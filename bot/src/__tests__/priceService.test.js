import { test } from "node:test";
import assert from "node:assert/strict";

// ─── config/env.js import paytida validatsiya qiladi — minimal fake env ──────
process.env.BOT_TOKEN = process.env.BOT_TOKEN || "123:test";
process.env.WEB_APP_URL = process.env.WEB_APP_URL || "https://example.test";
process.env.FIREBASE_SERVICE_ACCOUNT =
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  JSON.stringify({
    type: "service_account",
    project_id: "test",
    client_email: "a@b.test",
    private_key: "-----BEGIN PRIVATE KEY-----\\nX\\n-----END PRIVATE KEY-----\\n",
  });

// priceService firebaseAdmin'ni import qilmaydi — db parametr orqali keladi.
const {
  recalculateCart,
  getSettings,
  calcDeliveryPrice,
  ValidationError,
  isWithinWorkingHours,
  normalizeWorkingHours,
  DEFAULT_WORKING_HOURS,
} = await import("../priceService.js");

// ─── Fake Firestore (faqat kerakli usullar) ─────────────────────────────────

function makeDb(products = {}, settingsDoc = undefined) {
  let getAllCalls = 0;
  return {
    get getAllCalls() {
      return getAllCalls;
    },
    // recalculateCart: db.collection("products").doc(id) → ref; getSettings: settings/global
    collection(name) {
      return {
        doc(id) {
          if (name === "settings") {
            return {
              async get() {
                const exists = settingsDoc !== undefined && id === "global";
                return { exists, data: () => settingsDoc };
              },
            };
          }
          return { id };
        },
      };
    },
    async getAll(...refs) {
      getAllCalls += 1;
      return refs.map((ref) => {
        const data = products[ref.id];
        return { id: ref.id, exists: data !== undefined, data: () => data };
      });
    },
  };
}

const burger = {
  name: "Burger",
  price: 30000,
  active: true,
  image: "x.jpg",
  variants: [{ id: "v-big", name: "Katta", price: 40000 }],
  modifiers: [
    {
      id: "m-sauce",
      name: "Sous",
      type: "multi",
      required: false,
      maxSelect: 2,
      options: [
        { id: "o-ketchup", name: "Ketchup", price: 2000 },
        { id: "o-cheese", name: "Pishloq", price: 5000 },
      ],
    },
  ],
};

// ─── recalculateCart ────────────────────────────────────────────────────────

test("oddiy item — narx to'g'ri hisoblanadi", async () => {
  const db = makeDb({ b1: burger });
  const { recalculatedItems, itemsTotal } = await recalculateCart(db, [
    { productId: "b1", quantity: 2 },
  ]);
  assert.equal(itemsTotal, 60000);
  assert.equal(recalculatedItems[0].unitPrice, 30000);
  assert.equal(recalculatedItems[0].subtotal, 60000);
});

test("variant + modifierlar narxga qo'shiladi", async () => {
  const db = makeDb({ b1: burger });
  const { itemsTotal } = await recalculateCart(db, [
    {
      productId: "b1",
      quantity: 1,
      selectedVariant: { id: "v-big" },
      selectedModifiers: [{ id: "o-ketchup" }, { id: "o-cheese" }],
    },
  ]);
  // 40000 (katta) + 2000 + 5000 = 47000
  assert.equal(itemsTotal, 47000);
});

test("mahsulot topilmasa — ValidationError", async () => {
  const db = makeDb({});
  await assert.rejects(
    () => recalculateCart(db, [{ productId: "yoq", quantity: 1 }]),
    ValidationError,
  );
});

test("faol bo'lmagan mahsulot — ValidationError", async () => {
  const db = makeDb({ b1: { ...burger, active: false } });
  await assert.rejects(
    () => recalculateCart(db, [{ productId: "b1", quantity: 1 }]),
    ValidationError,
  );
});

test("noto'g'ri miqdor — ValidationError", async () => {
  const db = makeDb({ b1: burger });
  await assert.rejects(
    () => recalculateCart(db, [{ productId: "b1", quantity: 0 }]),
    ValidationError,
  );
  await assert.rejects(
    () => recalculateCart(db, [{ productId: "b1", quantity: 100 }]),
    ValidationError,
  );
});

test("bo'sh savat — ValidationError", async () => {
  const db = makeDb({ b1: burger });
  await assert.rejects(() => recalculateCart(db, []), ValidationError);
});

test("N+1 emas: ko'p item bitta getAll chaqiruvida o'qiladi", async () => {
  const db = makeDb({ b1: burger, b2: { ...burger, name: "B2" } });
  await recalculateCart(db, [
    { productId: "b1", quantity: 1 },
    { productId: "b2", quantity: 1 },
    { productId: "b1", quantity: 3 }, // dublikat id
  ]);
  assert.equal(db.getAllCalls, 1, "getAll faqat bir marta chaqirilishi kerak");
});

test("noma'lum modifier — ValidationError", async () => {
  const db = makeDb({ b1: burger });
  await assert.rejects(
    () =>
      recalculateCart(db, [
        { productId: "b1", quantity: 1, selectedModifiers: [{ id: "yoq-mod" }] },
      ]),
    ValidationError,
  );
});

// ─── getSettings ────────────────────────────────────────────────────────────

test("getSettings — doc bo'lsa default ustiga merge qiladi", async () => {
  const db = makeDb({}, { deliveryPrice: 20000, shopIsOpen: false });
  const settings = await getSettings(db);
  assert.equal(settings.deliveryPrice, 20000);
  assert.equal(settings.shopIsOpen, false);
  assert.equal(settings.minOrderPrice, 25000); // defaultdan
});

test("getSettings — doc yo'q bo'lsa to'liq default", async () => {
  const db = makeDb({}, undefined);
  const settings = await getSettings(db);
  assert.equal(settings.deliveryPrice, 15000);
  assert.equal(settings.minOrderPrice, 25000);
});

test("getSettings — noto'g'ri workingHours default ish vaqtiga normallashtiriladi", async () => {
  const db = makeDb({}, { workingHours: { from: "xx", to: "yy" } });
  const settings = await getSettings(db);
  assert.deepEqual(settings.workingHours, DEFAULT_WORKING_HOURS);
});

test("getSettings — to'g'ri workingHours o'zgartirilmaydi", async () => {
  const db = makeDb({}, { workingHours: { from: "10:00", to: "22:00" } });
  const settings = await getSettings(db);
  assert.deepEqual(settings.workingHours, { from: "10:00", to: "22:00" });
});

// ─── workingHours fail-safe (fail-open EMAS) ────────────────────────────────

test("normalizeWorkingHours — to'g'ri format o'zgartirilmaydi", () => {
  assert.deepEqual(normalizeWorkingHours({ from: "08:30", to: "21:00" }), {
    from: "08:30",
    to: "21:00",
  });
});

test("normalizeWorkingHours — buzuq format default ga tushadi", () => {
  assert.deepEqual(normalizeWorkingHours({ from: "bad", to: "00:00" }), DEFAULT_WORKING_HOURS);
  assert.deepEqual(normalizeWorkingHours(null), DEFAULT_WORKING_HOURS);
  assert.deepEqual(normalizeWorkingHours({}), DEFAULT_WORKING_HOURS);
  assert.deepEqual(normalizeWorkingHours("salom"), DEFAULT_WORKING_HOURS);
});

test("isWithinWorkingHours — to'liq sutka (00:00–00:00) doim ochiq", () => {
  assert.equal(isWithinWorkingHours({ from: "00:00", to: "00:00" }), true);
});

test("isWithinWorkingHours — bo'sh oyna (12:00–12:00) doim yopiq", () => {
  assert.equal(isWithinWorkingHours({ from: "12:00", to: "12:00" }), false);
});

test("isWithinWorkingHours — noto'g'ri format FAIL-OPEN emas (default kabi baholanadi)", () => {
  // Avval doim true qaytarardi (fail-open). Endi default ish vaqtidek baholanishi kerak.
  const baseline = isWithinWorkingHours(DEFAULT_WORKING_HOURS);
  assert.equal(isWithinWorkingHours("garbage"), baseline);
  assert.equal(isWithinWorkingHours({ from: "9", to: "x" }), baseline);
  assert.equal(isWithinWorkingHours(null), baseline);
  assert.equal(isWithinWorkingHours(undefined), baseline);
});

// ─── calcDeliveryPrice ──────────────────────────────────────────────────────

test("calcDeliveryPrice — pickup bepul", () => {
  assert.equal(
    calcDeliveryPrice("pickup", 10000, { freeDeliveryFrom: 50000, deliveryPrice: 15000 }),
    0,
  );
});

test("calcDeliveryPrice — freeDeliveryFrom dan oshsa bepul", () => {
  assert.equal(
    calcDeliveryPrice("delivery", 50000, { freeDeliveryFrom: 50000, deliveryPrice: 15000 }),
    0,
  );
});

test("calcDeliveryPrice — aks holda deliveryPrice", () => {
  assert.equal(
    calcDeliveryPrice("delivery", 49999, { freeDeliveryFrom: 50000, deliveryPrice: 15000 }),
    15000,
  );
});
