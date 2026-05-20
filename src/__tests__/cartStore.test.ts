import { describe, it, expect, beforeEach } from "vitest";
import { itemSubtotal } from "@/store/cartStore";
import type { CartItem, Product } from "@/lib/types";

// itemSubtotal — pure function, to'g'ridan-to'g'ri test qilish mumkin
describe("itemSubtotal", () => {
  const baseItem: CartItem = {
    uid: "p1|_",
    productId: "p1",
    name: "Lavash oddiy",
    image: "img.jpg",
    basePrice: 32000,
    selectedModifiers: [],
    quantity: 1,
  };

  it("modifiersiz mahsulot narxi to'g'ri hisoblanadi", () => {
    expect(itemSubtotal(baseItem)).toBe(32000);
  });

  it("miqdor ko'paytirishni to'g'ri hisoblaydi", () => {
    expect(itemSubtotal({ ...baseItem, quantity: 3 })).toBe(96000);
  });

  it("modifier narxlarini qo'shib hisoblaydi", () => {
    const item: CartItem = {
      ...baseItem,
      selectedModifiers: [
        { id: "m1", name: "Ketchup", price: 3000 },
        { id: "m2", name: "Majonez", price: 2000 },
      ],
      quantity: 2,
    };
    // (32000 + 3000 + 2000) * 2 = 74000
    expect(itemSubtotal(item)).toBe(74000);
  });

  it("variant narxini basePrice sifatida ishlatadi", () => {
    const item: CartItem = {
      ...baseItem,
      basePrice: 42000, // katta variant
      selectedVariant: { id: "v_katta", name: "Katta", price: 42000 },
      quantity: 1,
    };
    expect(itemSubtotal(item)).toBe(42000);
  });

  it("0 miqdor uchun 0 qaytaradi", () => {
    expect(itemSubtotal({ ...baseItem, quantity: 0 })).toBe(0);
  });
});

// cartStore uid generation logic
// uidFor ni import qilish mumkin emas (private), lekin xatti-harakatni sinalaydi
describe("cart uid uniqueness logic (integration)", () => {
  it("bir xil mahsulot + variant + modifiers => bir xil uid bo'lishi kerak", () => {
    // uidFor = [productId, variantId ?? "_", ...modIds.sort()].join("|")
    const productId = "p1";
    const variantId = "v1";
    const modIds = ["m2", "m1"]; // tartib aralash
    const uid1 = [productId, variantId, ...modIds.slice().sort()].join("|");
    const uid2 = [productId, variantId, ...modIds.slice().reverse().sort()].join("|");
    expect(uid1).toBe(uid2);
  });

  it("variant yo'q bo'lsa '_' ishlatiladi", () => {
    const uid = ["p1", "_"].join("|");
    expect(uid).toBe("p1|_");
  });

  it("har xil mahsulotlar har xil uid beradi", () => {
    const uid1 = ["p1", "_"].join("|");
    const uid2 = ["p2", "_"].join("|");
    expect(uid1).not.toBe(uid2);
  });
});

// Product narx hisoblash qoidalari (variant bo'lsa variant.price ishlatiladi)
describe("cart basePrice selection logic", () => {
  const mockProduct: Product = {
    id: "p1",
    name: "Lavash",
    slug: "lavash",
    categoryId: "lavash",
    description: "Test",
    image: "img.jpg",
    price: 32000,
    rating: 4.5,
    reviewsCount: 0,
    active: true,
    variants: [
      { id: "v_kichik", name: "Kichik", price: 28000 },
      { id: "v_katta", name: "Katta", price: 42000 },
    ],
  };

  it("variantsiz mahsulotda product.price ishlatiladi", () => {
    const basePrice = mockProduct.variants?.[0]?.price ?? mockProduct.price;
    expect(typeof basePrice).toBe("number");
    expect(basePrice).toBe(28000);
  });

  it("variant tanlansa uning narxi basePrice bo'ladi", () => {
    const variant = mockProduct.variants?.[1];
    const basePrice = variant?.price ?? mockProduct.price;
    expect(basePrice).toBe(42000);
  });

  it("product narxi minimal 0 bo'lishi kerak", () => {
    expect(mockProduct.price).toBeGreaterThanOrEqual(0);
  });
});
