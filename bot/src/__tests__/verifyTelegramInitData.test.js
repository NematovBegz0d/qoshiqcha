// Node built-in test runner (Node 18+). Tashqi kutubxona kerak emas.
// Ishga tushirish: node --test src/__tests__/verifyTelegramInitData.test.js

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyTelegramInitData } from "../verifyTelegramInitData.js";

// ─── Helpers ───────────────────────────────────────────────────────────────

const TEST_TOKEN = "1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi";
const TEST_USER = { id: 99887766, first_name: "Test", username: "testuser" };

/**
 * To'g'ri imzolangan initData string yaratadi.
 * @param {object} user    - Telegram user obyekti
 * @param {object} options
 *   authDateOffset  - hozirgi vaqtdan necha soniya farq qilsin (manfiy = o'tgan)
 *   botToken        - imzolashda foydalaniladigan token
 *   corruptHash     - to'g'ri hash o'rniga noto'g'ri hash qo'yish
 *   extraParams     - qo'shimcha URLSearchParams kalitlari
 */
function buildInitData(user, options = {}) {
  const {
    authDateOffset = 0,
    botToken = TEST_TOKEN,
    corruptHash = false,
    extraParams = {},
  } = options;

  const authDate = Math.floor(Date.now() / 1000) + authDateOffset;
  const params = new URLSearchParams();
  params.set("auth_date", String(authDate));
  params.set("user", JSON.stringify(user));
  for (const [k, v] of Object.entries(extraParams)) {
    params.set(k, v);
  }

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const validHash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  params.set("hash", corruptHash ? "0".repeat(64) : validHash);
  return params.toString();
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("verifyTelegramInitData — hash tekshiruvi", () => {
  it("to'g'ri initData → user obyekti qaytadi", () => {
    const initData = buildInitData(TEST_USER);
    const result = verifyTelegramInitData(initData, TEST_TOKEN);
    assert.deepEqual(result, TEST_USER);
  });

  it("noto'g'ri hash → null qaytadi", () => {
    const initData = buildInitData(TEST_USER, { corruptHash: true });
    assert.equal(verifyTelegramInitData(initData, TEST_TOKEN), null);
  });

  it("boshqa bot tokeni bilan imzolangan → null qaytadi", () => {
    const initData = buildInitData(TEST_USER, { botToken: "9999999999:WRONGTOKENVALUE" });
    assert.equal(verifyTelegramInitData(initData, TEST_TOKEN), null);
  });

  it("hash maydoni yo'q → null qaytadi", () => {
    const initData = buildInitData(TEST_USER);
    const params = new URLSearchParams(initData);
    params.delete("hash");
    assert.equal(verifyTelegramInitData(params.toString(), TEST_TOKEN), null);
  });

  it("hash 64 ta hex raqam emas → null qaytadi", () => {
    const params = new URLSearchParams();
    params.set("auth_date", String(Math.floor(Date.now() / 1000)));
    params.set("user", JSON.stringify(TEST_USER));
    params.set("hash", "not_a_valid_hash_at_all");
    assert.equal(verifyTelegramInitData(params.toString(), TEST_TOKEN), null);
  });

  it("bo'sh initData → null qaytadi", () => {
    assert.equal(verifyTelegramInitData("", TEST_TOKEN), null);
    assert.equal(verifyTelegramInitData(null, TEST_TOKEN), null);
  });

  it("bo'sh botToken → null qaytadi", () => {
    const initData = buildInitData(TEST_USER);
    assert.equal(verifyTelegramInitData(initData, ""), null);
    assert.equal(verifyTelegramInitData(initData, null), null);
  });
});

describe("verifyTelegramInitData — vaqt tekshiruvi (maxAge)", () => {
  it("yangi ma'lumot (30 soniya oldin) → user qaytadi", () => {
    const initData = buildInitData(TEST_USER, { authDateOffset: -30 });
    const result = verifyTelegramInitData(initData, TEST_TOKEN, { maxAgeSeconds: 3600 });
    assert.deepEqual(result, TEST_USER);
  });

  it("muddati o'tgan ma'lumot (>1 soat) → null qaytadi", () => {
    const initData = buildInitData(TEST_USER, { authDateOffset: -(3600 + 1) });
    assert.equal(verifyTelegramInitData(initData, TEST_TOKEN, { maxAgeSeconds: 3600 }), null);
  });

  it("24 soat oldingi ma'lumot 3600s maxAge bilan → null qaytadi", () => {
    const initData = buildInitData(TEST_USER, { authDateOffset: -86400 });
    assert.equal(verifyTelegramInitData(initData, TEST_TOKEN, { maxAgeSeconds: 3600 }), null);
  });

  it("kelajakdagi auth_date (>60s) → null qaytadi (clock skew himoyasi)", () => {
    const initData = buildInitData(TEST_USER, { authDateOffset: 120 });
    assert.equal(verifyTelegramInitData(initData, TEST_TOKEN), null);
  });

  it("kichik clock skew (30s kelajak) → ruxsat beriladi", () => {
    const initData = buildInitData(TEST_USER, { authDateOffset: 30 });
    const result = verifyTelegramInitData(initData, TEST_TOKEN);
    assert.deepEqual(result, TEST_USER);
  });

  it("maxAgeSeconds=0 → muddati tekshirilmaydi, eski ma'lumot ham o'tadi", () => {
    const initData = buildInitData(TEST_USER, { authDateOffset: -86400 });
    const result = verifyTelegramInitData(initData, TEST_TOKEN, { maxAgeSeconds: 0 });
    assert.deepEqual(result, TEST_USER);
  });

  it("auth_date maydoni yo'q → null qaytadi", () => {
    const params = new URLSearchParams(buildInitData(TEST_USER));
    params.delete("auth_date");
    // hash endi mos kelmaydi — bu holat ham null qaytarishi kerak
    assert.equal(verifyTelegramInitData(params.toString(), TEST_TOKEN), null);
  });
});

describe("verifyTelegramInitData — admin ID tekshiruvi", () => {
  it("admin ID ro'yxatidagi foydalanuvchi → user qaytadi", () => {
    const adminUser = { id: 12345678, first_name: "Admin" };
    const initData = buildInitData(adminUser);
    const user = verifyTelegramInitData(initData, TEST_TOKEN);
    assert.ok(user !== null, "Admin foydalanuvchi autentifikatsiyadan o'tishi kerak");
    assert.equal(user.id, adminUser.id);

    // Admin Set tekshiruvi simulatsiyasi
    const ADMIN_IDS = new Set([12345678, 99999999]);
    assert.ok(ADMIN_IDS.has(user.id), "Admin ID to'plamda bo'lishi kerak");
  });

  it("admin bo'lmagan foydalanuvchi → Set da yo'q", () => {
    const regularUser = { id: 55555555, first_name: "Regular" };
    const initData = buildInitData(regularUser);
    const user = verifyTelegramInitData(initData, TEST_TOKEN);
    assert.ok(user !== null, "Oddiy foydalanuvchi autentifikatsiyadan o'tishi kerak");

    const ADMIN_IDS = new Set([12345678, 99999999]);
    assert.ok(!ADMIN_IDS.has(user.id), "Oddiy ID admin to'plamda bo'lmasligi kerak");
  });

  it("bo'sh ADMIN_IDS → hech kim admin emas", () => {
    const initData = buildInitData(TEST_USER);
    const user = verifyTelegramInitData(initData, TEST_TOKEN);
    assert.ok(user !== null);

    const EMPTY_ADMIN_IDS = new Set();
    assert.ok(!EMPTY_ADMIN_IDS.has(user.id), "Bo'sh to'plamda hech qanday ID bo'lmasligi kerak");
  });
});

describe("verifyTelegramInitData — timing-safe taqqoslash", () => {
  it("bir xil uzunlikdagi noto'g'ri hash → timingSafeEqual false qaytaradi", () => {
    // Agar hash to'g'ri uzunlikda bo'lsa lekin qiymat noto'g'ri bo'lsa
    const validInitData = buildInitData(TEST_USER);
    const params = new URLSearchParams(validInitData);
    // Hashni oxirgi belgisini o'zgartirish
    const originalHash = params.get("hash");
    const tamperedHash = originalHash.slice(0, -1) + (originalHash.at(-1) === "a" ? "b" : "a");
    params.set("hash", tamperedHash);
    assert.equal(verifyTelegramInitData(params.toString(), TEST_TOKEN), null);
  });
});
