// Node built-in test runner (Node 18+).
// Ishga tushirish: node --test src/__tests__/cartPricing.test.js

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_CART_ITEMS,
  validateCartItemsStructure,
  computeCartTotals,
  resolveAndValidateModifiers,
  assertValidPrice,
} from "../cartPricing.js";
import { ValidationError } from "../errors.js";

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeProductMap(products) {
  const map = new Map();
  for (const [id, data] of Object.entries(products)) map.set(id, data);
  return map;
}

const BURGER = {
  name: "Burger",
  price: 30000,
  active: true,
  image: "https://x/y.png",
  variants: [{ id: "big", name: "Katta", price: 40000 }],
  modifiers: [
    {
      id: "sauce",
      name: "Sous",
      type: "multi",
      maxSelect: 2,
      required: false,
      options: [
        { id: "ketchup", name: "Ketchup", price: 2000 },
        { id: "mayo", name: "Mayonez", price: 3000 },
      ],
    },
  ],
};

// ─── validateCartItemsStructure ──────────────────────────────────────────────

describe("validateCartItemsStructure — tuzilish va uzunlik (Y1)", () => {
  it("bo'sh massiv → 'Savat bo'sh'", () => {
    assert.throws(() => validateCartItemsStructure([]), /Savat bo'sh/);
  });

  it("massiv emas → 'Savat bo'sh'", () => {
    assert.throws(() => validateCartItemsStructure(null), ValidationError);
    assert.throws(() => validateCartItemsStructure({}), ValidationError);
  });

  it(`${MAX_CART_ITEMS} ta element → o'tadi`, () => {
    const items = Array.from({ length: MAX_CART_ITEMS }, (_, i) => ({
      productId: `p${i}`,
      quantity: 1,
    }));
    assert.doesNotThrow(() => validateCartItemsStructure(items));
  });

  it(`${MAX_CART_ITEMS + 1} ta element → DoS chegarasi xatosi`, () => {
    const items = Array.from({ length: MAX_CART_ITEMS + 1 }, (_, i) => ({
      productId: `p${i}`,
      quantity: 1,
    }));
    assert.throws(() => validateCartItemsStructure(items), /juda ko'p/);
  });

  it("productId yo'q → xato", () => {
    assert.throws(() => validateCartItemsStructure([{ quantity: 1 }]), /Mahsulot ID/);
  });

  it("noto'g'ri miqdor (0, 100, kasr) → xato", () => {
    assert.throws(() => validateCartItemsStructure([{ productId: "p", quantity: 0 }]), /miqdor/);
    assert.throws(() => validateCartItemsStructure([{ productId: "p", quantity: 100 }]), /miqdor/);
    assert.throws(() => validateCartItemsStructure([{ productId: "p", quantity: 1.5 }]), /miqdor/);
  });
});

// ─── computeCartTotals — asosiy hisob ────────────────────────────────────────

describe("computeCartTotals — narx hisobi", () => {
  it("oddiy mahsulot: narx × miqdor", () => {
    const products = makeProductMap({ b: BURGER });
    const { recalculatedItems, itemsTotal } = computeCartTotals(
      [{ productId: "b", quantity: 2, selectedModifiers: [] }],
      products,
    );
    assert.equal(itemsTotal, 60000);
    assert.equal(recalculatedItems[0].unitPrice, 30000);
    assert.equal(recalculatedItems[0].subtotal, 60000);
    assert.equal(recalculatedItems[0].name, "Burger");
  });

  it("variant narxi product narxini almashtiradi", () => {
    const products = makeProductMap({ b: BURGER });
    const { itemsTotal, recalculatedItems } = computeCartTotals(
      [{ productId: "b", quantity: 1, selectedVariant: { id: "big" }, selectedModifiers: [] }],
      products,
    );
    assert.equal(itemsTotal, 40000);
    assert.equal(recalculatedItems[0].selectedVariant.name, "Katta");
  });

  it("modifierlar narxni oshiradi", () => {
    const products = makeProductMap({ b: BURGER });
    const { itemsTotal } = computeCartTotals(
      [
        {
          productId: "b",
          quantity: 1,
          selectedModifiers: [{ id: "ketchup" }, { id: "mayo" }],
        },
      ],
      products,
    );
    // 30000 + 2000 + 3000
    assert.equal(itemsTotal, 35000);
  });

  it("mahsulot topilmadi (map'da yo'q) → xato", () => {
    assert.throws(
      () => computeCartTotals([{ productId: "yo'q", quantity: 1 }], new Map()),
      /Mahsulot topilmadi/,
    );
  });

  it("nofaol (active:false) mahsulot → xato", () => {
    const products = makeProductMap({ b: { ...BURGER, active: false } });
    assert.throws(
      () => computeCartTotals([{ productId: "b", quantity: 1, selectedModifiers: [] }], products),
      /sotilmaydi/,
    );
  });

  it("noto'g'ri narx (NaN) → xato", () => {
    const products = makeProductMap({ b: { ...BURGER, price: "bekor" } });
    assert.throws(
      () => computeCartTotals([{ productId: "b", quantity: 1, selectedModifiers: [] }], products),
      /Narx ma'lumoti noto'g'ri/,
    );
  });

  it("topilmagan variant → xato", () => {
    const products = makeProductMap({ b: BURGER });
    assert.throws(
      () =>
        computeCartTotals(
          [{ productId: "b", quantity: 1, selectedVariant: { id: "yoq" }, selectedModifiers: [] }],
          products,
        ),
      /Variant topilmadi/,
    );
  });

  it("comment 200 belgigacha kesiladi", () => {
    const products = makeProductMap({ b: BURGER });
    const longComment = "x".repeat(500);
    const { recalculatedItems } = computeCartTotals(
      [{ productId: "b", quantity: 1, selectedModifiers: [], comment: longComment }],
      products,
    );
    assert.equal(recalculatedItems[0].comment.length, 200);
  });

  it("bir mahsulot ikki marta (turli modifier) → ikkalasi ham hisoblanadi", () => {
    const products = makeProductMap({ b: BURGER });
    const { itemsTotal, recalculatedItems } = computeCartTotals(
      [
        { productId: "b", quantity: 1, selectedModifiers: [{ id: "ketchup" }] },
        { productId: "b", quantity: 1, selectedModifiers: [{ id: "mayo" }] },
      ],
      products,
    );
    assert.equal(recalculatedItems.length, 2);
    assert.equal(itemsTotal, 32000 + 33000);
  });
});

// ─── resolveAndValidateModifiers — modifier qoidalari ────────────────────────

describe("resolveAndValidateModifiers — qoidalar", () => {
  it("takroriy modifier → xato", () => {
    assert.throws(
      () => resolveAndValidateModifiers(BURGER, [{ id: "ketchup" }, { id: "ketchup" }]),
      /qayta tanlangan/,
    );
  });

  it("mavjud bo'lmagan modifier → xato", () => {
    assert.throws(() => resolveAndValidateModifiers(BURGER, [{ id: "yoq" }]), /Modifier topilmadi/);
  });

  it("single tipda bittadan ortiq tanlov → xato", () => {
    const product = {
      name: "X",
      modifiers: [
        {
          id: "m",
          name: "O'lcham",
          type: "single",
          maxSelect: 1,
          required: false,
          options: [
            { id: "a", name: "A", price: 0 },
            { id: "b", name: "B", price: 0 },
          ],
        },
      ],
    };
    assert.throws(
      () => resolveAndValidateModifiers(product, [{ id: "a" }, { id: "b" }]),
      /Faqat bitta tanlov/,
    );
  });

  it("majburiy modifier tanlanmagan → xato", () => {
    const product = {
      name: "X",
      modifiers: [
        {
          id: "m",
          name: "Non turi",
          type: "single",
          maxSelect: 1,
          required: true,
          options: [{ id: "a", name: "A", price: 0 }],
        },
      ],
    };
    assert.throws(() => resolveAndValidateModifiers(product, []), /Majburiy tanlov/);
  });

  it("maxSelect dan oshiq → xato", () => {
    assert.throws(
      () => resolveAndValidateModifiers(BURGER, [{ id: "ketchup" }, { id: "mayo" }, { id: "x" }]),
      ValidationError,
    );
  });

  it("100 dan ortiq modifier → DoS xatosi", () => {
    const many = Array.from({ length: 101 }, () => ({ id: "ketchup" }));
    assert.throws(() => resolveAndValidateModifiers(BURGER, many), /juda ko'p/);
  });
});

// ─── assertValidPrice ────────────────────────────────────────────────────────

describe("assertValidPrice", () => {
  it("manfiy narx → xato", () => {
    assert.throws(() => assertValidPrice(-1, "X"), ValidationError);
  });
  it("son emas → xato", () => {
    assert.throws(() => assertValidPrice("100", "X"), ValidationError);
  });
  it("0 va musbat → o'tadi", () => {
    assert.doesNotThrow(() => assertValidPrice(0, "X"));
    assert.doesNotThrow(() => assertValidPrice(15000, "X"));
  });
});
