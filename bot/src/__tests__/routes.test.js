import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// ─── Env: import'lardan OLDIN o'rnatiladi (config/env.js import paytida o'qiydi) ──
const TEST_TOKEN = "1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi";
const ADMIN_USER = { id: 12345678, first_name: "Admin" };
const NORMAL_USER = { id: 99887766, first_name: "Test", username: "testuser" };

// firebaseAdmin.js modul yuklanishida admin.initializeApp(cert) chaqiradi —
// bu tarmoqqa ulanmaydi, lekin private_key ni parse qiladi. Shuning uchun
// haqiqiy (lokal generatsiya qilingan) RSA kalit beramiz.
const { privateKey: TEST_PRIVATE_KEY } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

process.env.NODE_ENV = "test";
process.env.BOT_TOKEN = TEST_TOKEN;
process.env.WEB_APP_URL = "https://example.test";
process.env.ADMIN_TELEGRAM_IDS = String(ADMIN_USER.id);
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
  type: "service_account",
  project_id: "test",
  client_email: "firebase-adminsdk@test.iam.gserviceaccount.com",
  private_key: TEST_PRIVATE_KEY,
});

const express = (await import("express")).default;
const { createOrdersRouter } = await import("../routes/orders.js");
const { createAdminSettingsRouter } = await import("../routes/adminSettings.js");

// ─── Imzolangan initData generatori ─────────────────────────────────────────

function buildInitData(user) {
  const params = new URLSearchParams();
  params.set("auth_date", String(Math.floor(Date.now() / 1000)));
  params.set("user", JSON.stringify(user));
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(TEST_TOKEN).digest();
  const hash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

// ─── Fake Firestore (stateful orders) ───────────────────────────────────────

const SETTINGS = {
  shopIsOpen: true,
  workingHours: { from: "00:00", to: "24:00" }, // doim ochiq
  minOrderPrice: 1000,
  deliveryPrice: 15000,
  freeDeliveryFrom: 50000,
};
const PRODUCTS = { b1: { name: "Burger", price: 30000, active: true, image: "x.jpg" } };

function snap(id, data) {
  return { id, exists: data !== undefined, data: () => data };
}

function makeFirestore() {
  const orders = new Map();
  let autoId = 0;

  function orderRef(id) {
    return {
      id,
      async create(data) {
        if (orders.has(id)) {
          const e = new Error("ALREADY_EXISTS");
          e.code = 6;
          throw e;
        }
        orders.set(id, data);
      },
      async get() {
        return snap(id, orders.get(id));
      },
    };
  }

  const ordersCollection = {
    doc: (id) => orderRef(id),
    add: async (data) => {
      const id = `auto_${++autoId}`;
      orders.set(id, data);
      return orderRef(id);
    },
    where() {
      const q = {
        where: () => q,
        orderBy: () => q,
        limit: () => q,
        get: async () => ({ docs: [...orders.entries()].map(([id, d]) => snap(id, d)) }),
      };
      return q;
    },
  };

  return {
    _ordersCount: () => orders.size,
    collection(name) {
      if (name === "orders") return ordersCollection;
      if (name === "settings") {
        return {
          doc: (id) => ({ get: async () => snap(id, id === "global" ? SETTINGS : undefined) }),
        };
      }
      if (name === "products") return { doc: (id) => ({ id }) };
      // branches (delivery oqimida chaqirilmaydi) va boshqalar
      return { doc: (id) => ({ id, get: async () => snap(id, undefined) }) };
    },
    async getAll(...refs) {
      return refs.map((r) => snap(r.id, PRODUCTS[r.id]));
    },
    doc(path) {
      const id = path.split("/")[1];
      return { set: async () => {}, get: async () => snap(id, SETTINGS) };
    },
  };
}

const fakeAdmin = {
  firestore: {
    Timestamp: { now: () => ({ toMillis: () => Date.now() }) },
    FieldValue: { serverTimestamp: () => "TS", arrayUnion: (x) => x },
  },
};
const fakeBot = { telegram: { sendMessage: async () => {} } };

// ─── Test server ─────────────────────────────────────────────────────────────

let server;
let baseUrl;
let db;

before(async () => {
  db = makeFirestore();
  const deps = { db, admin: fakeAdmin, bot: fakeBot };
  const app = express();
  app.use(express.json());
  app.use("/api/orders", createOrdersRouter(deps));
  app.use("/api/admin/settings", createAdminSettingsRouter(deps));
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

function post(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
function patch(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validOrder = {
  items: [{ productId: "b1", quantity: 1 }],
  orderType: "delivery",
  address: { fullAddress: "Test ko'cha 12, Buxoro" },
  phone: "+998901234567",
  paymentType: "cash",
};

// ─── POST /api/orders — auth ─────────────────────────────────────────────────

test("POST /api/orders — initData yo'q → 401", async () => {
  const res = await post("/api/orders", { order: validOrder });
  assert.equal(res.status, 401);
});

test("POST /api/orders — soxta initData → 401", async () => {
  const res = await post("/api/orders", {
    initData: "auth_date=1&hash=" + "0".repeat(64),
    order: validOrder,
  });
  assert.equal(res.status, 401);
});

// ─── POST /api/orders — idempotentlik ────────────────────────────────────────

test("POST /api/orders — bir xil clientOrderId ikki marta → bitta buyurtma", async () => {
  const initData = buildInitData(NORMAL_USER);
  const order = { ...validOrder, clientOrderId: "testorderkey1" };

  const res1 = await post("/api/orders", { initData, order });
  assert.equal(res1.status, 201);
  const body1 = await res1.json();
  assert.equal(body1.ok, true);
  assert.ok(body1.orderNumber);

  const countAfterFirst = db._ordersCount();

  const res2 = await post("/api/orders", { initData, order });
  assert.equal(res2.status, 200);
  const body2 = await res2.json();
  assert.equal(body2.duplicate, true);
  assert.equal(body2.orderNumber, body1.orderNumber, "bir xil buyurtma raqami qaytishi kerak");
  assert.equal(
    db._ordersCount(),
    countAfterFirst,
    "ikkinchi so'rov yangi buyurtma yaratmasligi kerak",
  );
});

test("POST /api/orders — bo'sh savat → 400", async () => {
  const initData = buildInitData(NORMAL_USER);
  const res = await post("/api/orders", {
    initData,
    order: { ...validOrder, items: [], clientOrderId: "emptycart0001" },
  });
  assert.equal(res.status, 400);
});

// ─── Admin guard ─────────────────────────────────────────────────────────────

test("PATCH /api/admin/settings — admin bo'lmagan → 403", async () => {
  const res = await patch("/api/admin/settings", {
    initData: buildInitData(NORMAL_USER),
    patch: { shopIsOpen: false },
  });
  assert.equal(res.status, 403);
});

test("PATCH /api/admin/settings — admin → 200", async () => {
  const res = await patch("/api/admin/settings", {
    initData: buildInitData(ADMIN_USER),
    patch: { shopIsOpen: false },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test("PATCH /api/admin/settings — initData yo'q → 401", async () => {
  const res = await patch("/api/admin/settings", { patch: { shopIsOpen: false } });
  assert.equal(res.status, 401);
});
