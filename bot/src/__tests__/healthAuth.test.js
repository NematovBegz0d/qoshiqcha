// Node built-in test runner (Node 18+).
// Ishga tushirish: node --test src/__tests__/healthAuth.test.js

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isHealthRequestAuthorized, createHealthGuard } from "../middleware/healthAuth.js";

const SECRET = "super-secret-token-123";

// ─── isHealthRequestAuthorized ───────────────────────────────────────────────

describe("isHealthRequestAuthorized — O2 himoyasi", () => {
  it("development: doim ochiq (secret bo'lmasa ham)", () => {
    assert.equal(isHealthRequestAuthorized({}, { isProduction: false, secret: "" }), true);
  });

  it("production + secret sozlanmagan → yopiq", () => {
    const req = { query: { secret: "x" }, headers: {} };
    assert.equal(isHealthRequestAuthorized(req, { isProduction: true, secret: "" }), false);
  });

  it("production + to'g'ri ?secret= → ochiq", () => {
    const req = { query: { secret: SECRET }, headers: {} };
    assert.equal(isHealthRequestAuthorized(req, { isProduction: true, secret: SECRET }), true);
  });

  it("production + to'g'ri x-health-secret header → ochiq", () => {
    const req = { query: {}, headers: { "x-health-secret": SECRET } };
    assert.equal(isHealthRequestAuthorized(req, { isProduction: true, secret: SECRET }), true);
  });

  it("production + noto'g'ri secret → yopiq", () => {
    const req = { query: { secret: "wrong" }, headers: {} };
    assert.equal(isHealthRequestAuthorized(req, { isProduction: true, secret: SECRET }), false);
  });

  it("production + secret yo'q (so'rovda) → yopiq", () => {
    const req = { query: {}, headers: {} };
    assert.equal(isHealthRequestAuthorized(req, { isProduction: true, secret: SECRET }), false);
  });
});

// ─── createHealthGuard middleware ────────────────────────────────────────────

describe("createHealthGuard middleware", () => {
  function makeRes() {
    return {
      statusCode: 200,
      body: undefined,
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(o) {
        this.body = o;
        return this;
      },
    };
  }

  it("ruxsat berilganda next() chaqiriladi", () => {
    const guard = createHealthGuard({ isProduction: false, secret: "" });
    let called = false;
    guard({ query: {}, headers: {} }, makeRes(), () => (called = true));
    assert.equal(called, true);
  });

  it("ruxsat yo'q → 404 (mavjudligini oshkor qilmaslik uchun)", () => {
    const guard = createHealthGuard({ isProduction: true, secret: SECRET });
    const res = makeRes();
    let called = false;
    guard({ query: { secret: "wrong" }, headers: {} }, res, () => (called = true));
    assert.equal(called, false);
    assert.equal(res.statusCode, 404);
  });
});
