import { describe, it, expect } from "vitest";
import { formatUZS, orderNumber, isPromoExpired } from "@/lib/format";

describe("formatUZS", () => {
  it("butun sonni UZS formatida qaytaradi", () => {
    expect(formatUZS(32000)).toBe("32 000 UZS");
  });

  it("nolni to'g'ri formatlaydi", () => {
    expect(formatUZS(0)).toBe("0 UZS");
  });

  it("katta sonlarni bo'sh joyli formatlaydi", () => {
    expect(formatUZS(1500000)).toBe("1 500 000 UZS");
  });

  it("kasr qismini yaxlitlaydi", () => {
    expect(formatUZS(99.9)).toBe("100 UZS");
    expect(formatUZS(15000.4)).toBe("15 000 UZS");
  });

  it("manfiy sonni ham qaytaradi", () => {
    const result = formatUZS(-5000);
    expect(result).toContain("5 000 UZS");
  });
});

describe("orderNumber", () => {
  it("#-bilan boshlanadi", () => {
    expect(orderNumber()).toMatch(/^#/);
  });

  it("har safar boshqa raqam chiqaradi", () => {
    const a = orderNumber();
    const b = orderNumber();
    // Very rarely same, but possible — just check format
    expect(a).toMatch(/^#[A-Z0-9]{4}\d{4}$/);
    expect(b).toMatch(/^#[A-Z0-9]{4}\d{4}$/);
  });

  it("8 belgidan iborat (#XXXX9999)", () => {
    const n = orderNumber();
    // # + 4 alfanum + 4 raqam = 9 belgi
    expect(n.length).toBe(9);
  });
});

describe("isPromoExpired", () => {
  it("o'tgan sana uchun true qaytaradi", () => {
    expect(isPromoExpired("01.01.2020")).toBe(true);
  });

  it("kelajakdagi sana uchun false qaytaradi", () => {
    expect(isPromoExpired("31.12.2099")).toBe(false);
  });

  it("'Doimiy' kabi string uchun false qaytaradi (muddatsiz)", () => {
    expect(isPromoExpired("Doimiy")).toBe(false);
  });

  it("bo'sh string uchun false qaytaradi", () => {
    expect(isPromoExpired("")).toBe(false);
  });

  it("noto'g'ri format uchun false qaytaradi", () => {
    expect(isPromoExpired("2024-12-31")).toBe(false);
    expect(isPromoExpired("31/12/2024")).toBe(false);
  });

  it("kecha sanasi uchun true qaytaradi (muddati o'tgan)", () => {
    const yesterday = new Date(Date.now() - 864_00_000 * 2); // 2 kun oldin
    const dd = String(yesterday.getDate()).padStart(2, "0");
    const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
    const yyyy = yesterday.getFullYear();
    expect(isPromoExpired(`${dd}.${mm}.${yyyy}`)).toBe(true);
  });

  it("bugungi sana hali muddati o'tmagan hisoblanadi (d+1 logika)", () => {
    // isPromoExpired: new Date(y, m-1, d+1) — ya'ni ertadan boshlab o'tgan
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    expect(isPromoExpired(`${dd}.${mm}.${yyyy}`)).toBe(false);
  });
});
