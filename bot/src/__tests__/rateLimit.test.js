// Node built-in test runner (Node 18+).
// Ishga tushirish: node --test src/__tests__/rateLimit.test.js

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getClientKey, createRateLimit } from "../middleware/rateLimit.js";

// ─── Fake req/res ────────────────────────────────────────────────────────────

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    set(k, v) {
      this.headers[k] = v;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.body = obj;
      return this;
    },
  };
}

// ─── getClientKey — spoofing himoyasi (Y2) ───────────────────────────────────

describe("getClientKey — X-Forwarded-For spoofing e'tiborga olinmaydi", () => {
  it("req.ip ishlatiladi, soxta X-Forwarded-For header'i emas", () => {
    const req = {
      ip: "10.0.0.5", // Express trust proxy aniqlagan haqiqiy IP
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" }, // hujumchi soxtasi
      socket: { remoteAddress: "172.16.0.1" },
    };
    assert.equal(getClientKey(req, "api"), "api:10.0.0.5");
  });

  it("har xil soxta X-Forwarded-For bilan ham kalit o'zgarmaydi", () => {
    const base = { ip: "10.0.0.5", socket: {} };
    const k1 = getClientKey({ ...base, headers: { "x-forwarded-for": "9.9.9.9" } }, "api");
    const k2 = getClientKey({ ...base, headers: { "x-forwarded-for": "8.8.8.8" } }, "api");
    // Avval: har xil header → har xil bucket (limit bypass). Endi: bir xil.
    assert.equal(k1, k2);
  });

  it("req.ip yo'q → socket.remoteAddress ga tushadi", () => {
    const req = { headers: {}, socket: { remoteAddress: "192.168.1.7" } };
    assert.equal(getClientKey(req, "reviews"), "reviews:192.168.1.7");
  });

  it("hech narsa yo'q → 'unknown'", () => {
    assert.equal(getClientKey({ headers: {} }, "api"), "api:unknown");
  });
});

// ─── createRateLimit — limit xulqi ───────────────────────────────────────────

describe("createRateLimit — limit va 429", () => {
  it("max gacha o'tkazadi, max+1 da 429 + Retry-After qaytaradi", () => {
    const limiter = createRateLimit({ windowMs: 60_000, max: 2, name: "test-429" });
    const req = { ip: "5.5.5.5", headers: {}, socket: {} };

    let nextCount = 0;
    const next = () => nextCount++;

    // 1 va 2 — o'tadi
    limiter(req, makeRes(), next);
    limiter(req, makeRes(), next);
    assert.equal(nextCount, 2);

    // 3 — bloklanadi
    const res = makeRes();
    limiter(req, res, next);
    assert.equal(nextCount, 2, "3-so'rov next() ni chaqirmasligi kerak");
    assert.equal(res.statusCode, 429);
    assert.ok(res.headers["Retry-After"], "Retry-After header bo'lishi kerak");
    assert.match(res.body.error, /Juda ko'p/);
  });

  it("turli IP lar mustaqil bucket oladi", () => {
    const limiter = createRateLimit({ windowMs: 60_000, max: 1, name: "test-iso" });
    let nextCount = 0;
    const next = () => nextCount++;

    limiter({ ip: "1.0.0.1", headers: {}, socket: {} }, makeRes(), next);
    limiter({ ip: "1.0.0.2", headers: {}, socket: {} }, makeRes(), next);
    // Ikkalasi ham birinchi so'rov → ikkalasi ham o'tadi
    assert.equal(nextCount, 2);
  });

  it("oyna (window) tugagach hisob qayta tiklanadi", () => {
    // windowMs=0 → keyingi so'rovda resetAt <= now → yangi bucket
    const limiter = createRateLimit({ windowMs: 0, max: 1, name: "test-reset" });
    const req = { ip: "7.7.7.7", headers: {}, socket: {} };
    let nextCount = 0;
    const next = () => nextCount++;

    limiter(req, makeRes(), next);
    limiter(req, makeRes(), next);
    // windowMs=0 bo'lgani uchun har safar reset → ikkalasi ham o'tadi
    assert.equal(nextCount, 2);
  });
});


// ─── createRedisRateLimit — distributed limiter (fake Redis) ─────────────────

import { createRedisRateLimit } from "../middleware/rateLimit.js";

// Lua FIXED_WINDOW_SCRIPT xatti-harakatini taqlid qiluvchi minimal fake.
// Bitta jarayonda hisoblaydi, lekin "shared" Redis kabi: bir nechta limiter
// instance bir xil fake'ni ulashsa, hisob umumiy bo'ladi (distributed model).
function makeFakeRedis() {
  const store = new Map(); // key -> { count, resetAt }
  return {
    calls: 0,
    async eval(_script, _numKeys, key, windowMs) {
      this.calls++;
      const now = Date.now();
      const win = Number(windowMs);
      let entry = store.get(key);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + win };
        store.set(key, entry);
      }
      entry.count += 1;
      const ttl = entry.resetAt - now;
      return [entry.count, ttl];
    },
  };
}

function makeBrokenRedis() {
  return {
    async eval() {
      throw new Error("ECONNREFUSED");
    },
  };
}

describe("createRedisRateLimit — distributed limit xulqi", () => {
  it("max gacha o'tkazadi, max+1 da 429 + Retry-After", async () => {
    const redis = makeFakeRedis();
    const limiter = createRedisRateLimit(redis, { windowMs: 60_000, max: 2, name: "rtest" });
    const req = { ip: "5.5.5.5", headers: {}, socket: {} };

    let nextCount = 0;
    const next = () => nextCount++;

    await limiter(req, makeRes(), next);
    await limiter(req, makeRes(), next);
    assert.equal(nextCount, 2);

    const res = makeRes();
    await limiter(req, res, next);
    assert.equal(nextCount, 2, "3-so'rov next() ni chaqirmasligi kerak");
    assert.equal(res.statusCode, 429);
    assert.ok(res.headers["Retry-After"], "Retry-After header bo'lishi kerak");
    assert.match(res.body.error, /Juda ko'p/);
  });

  it("turli IP lar mustaqil hisoblanadi", async () => {
    const redis = makeFakeRedis();
    const limiter = createRedisRateLimit(redis, { windowMs: 60_000, max: 1, name: "riso" });
    let nextCount = 0;
    const next = () => nextCount++;

    await limiter({ ip: "1.0.0.1", headers: {}, socket: {} }, makeRes(), next);
    await limiter({ ip: "1.0.0.2", headers: {}, socket: {} }, makeRes(), next);
    assert.equal(nextCount, 2);
  });

  it("DISTRIBUTED: ikki limiter (ikki instance) bir Redis'ni ulashadi → umumiy hisob", async () => {
    const redis = makeFakeRedis(); // bitta shared Redis
    const opts = { windowMs: 60_000, max: 2, name: "rshared" };
    const instanceA = createRedisRateLimit(redis, opts);
    const instanceB = createRedisRateLimit(redis, opts);
    const req = { ip: "9.9.9.9", headers: {}, socket: {} };

    let nextCount = 0;
    const next = () => nextCount++;

    await instanceA(req, makeRes(), next); // 1 (A)
    await instanceB(req, makeRes(), next); // 2 (B)
    assert.equal(nextCount, 2);

    // 3-so'rov qaysi instance'da bo'lishidan qat'i nazar bloklanadi.
    const res = makeRes();
    await instanceB(req, res, next);
    assert.equal(res.statusCode, 429, "umumiy hisob max dan oshdi → bloklanadi");
    assert.equal(nextCount, 2);
  });

  it("FAIL-OPEN: Redis xato bersa so'rov o'tkaziladi", async () => {
    const limiter = createRedisRateLimit(makeBrokenRedis(), {
      windowMs: 60_000,
      max: 1,
      name: "rfail",
    });
    const req = { ip: "3.3.3.3", headers: {}, socket: {} };
    let nextCount = 0;
    const next = () => nextCount++;

    const res = makeRes();
    await limiter(req, res, next);
    assert.equal(nextCount, 1, "Redis xatosida ham next() chaqirilishi kerak (fail-open)");
    assert.notEqual(res.statusCode, 429);
  });
});
