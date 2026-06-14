// Sof (db'siz) savat narx-hisoblash mantiqi.
// Firestore o'qish recalculateCart (priceService.js) da, bu yerda faqat sof hisob —
// shu sababli firebase-admin'siz to'liq testlanadi.

import { ValidationError } from "./errors.js";

// Bitta buyurtmadagi turli mahsulotlar (cart item) sonining chegarasi.
// DoS himoyasi: cheklanmagan massiv → cheklanmagan Firestore o'qishi.
export const MAX_CART_ITEMS = 50;

// ─── Price validation helper ───────────────────────────────────────────────

/**
 * Narx qiymati haqiqiy son va manfiy emasligini tekshiradi.
 * @throws {ValidationError}
 */
export function assertValidPrice(price, label) {
  if (typeof price !== "number" || !isFinite(price) || price < 0) {
    throw new ValidationError(
      `Narx ma'lumoti noto'g'ri: "${label}". Menyu yangilangan bo'lishi mumkin.`,
    );
  }
}

// ─── Item tuzilishi validatsiyasi ────────────────────────────────────────────

/**
 * cartItems massivining tuzilishini Firestore o'qishidan OLDIN tekshiradi.
 * @throws {ValidationError}
 */
export function validateCartItemsStructure(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new ValidationError("Savat bo'sh");
  }
  if (cartItems.length > MAX_CART_ITEMS) {
    throw new ValidationError(`Savatda mahsulot juda ko'p (maksimal ${MAX_CART_ITEMS} ta)`);
  }

  for (const item of cartItems) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ValidationError("Savat elementi noto'g'ri formatda");
    }
    if (!item.productId || typeof item.productId !== "string") {
      throw new ValidationError("Mahsulot ID noto'g'ri formatda");
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new ValidationError(`Noto'g'ri miqdor: ${item.productId}`);
    }
  }
}

// ─── Modifier resolution ─────────────────────────────────────────────────────

function normalizeSelectedModifiers(product, selectedModifiers) {
  if (selectedModifiers === undefined || selectedModifiers === null) return [];
  if (!Array.isArray(selectedModifiers)) {
    throw new ValidationError(`Modifierlar noto'g'ri formatda: "${product.name}"`);
  }
  if (selectedModifiers.length > 100) {
    throw new ValidationError(`Modifierlar soni juda ko'p: "${product.name}"`);
  }

  return selectedModifiers.map((selectedMod, index) => {
    if (!selectedMod || typeof selectedMod !== "object" || typeof selectedMod.id !== "string") {
      throw new ValidationError(`Modifier #${index + 1} noto'g'ri formatda (${product.name})`);
    }
    return selectedMod.id.trim();
  });
}

export function resolveAndValidateModifiers(product, selectedModifiers) {
  const selectedIds = normalizeSelectedModifiers(product, selectedModifiers);
  const duplicateIds = selectedIds.filter((id, index) => selectedIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    throw new ValidationError(`Bir xil modifier qayta tanlangan: "${product.name}"`);
  }

  const modifiers = Array.isArray(product.modifiers) ? product.modifiers : [];
  const resolvedModifiers = [];
  let modsTotal = 0;

  for (const selectedId of selectedIds) {
    let found = null;

    for (const modifier of modifiers) {
      const option = (modifier.options ?? []).find((o) => o.id === selectedId);
      if (option) {
        found = { modifier, option };
        break;
      }
    }

    if (!found) {
      throw new ValidationError(`Modifier topilmadi: "${selectedId}" (${product.name})`);
    }

    assertValidPrice(found.option.price, `${product.name} / ${found.option.name}`);
    modsTotal += found.option.price;
    resolvedModifiers.push({
      id: found.option.id,
      name: found.option.name,
      price: found.option.price,
    });
  }

  for (const modifier of modifiers) {
    const options = Array.isArray(modifier.options) ? modifier.options : [];
    const selectedInGroup = selectedIds.filter((id) => options.some((option) => option.id === id));
    const maxSelect = Number.isInteger(Number(modifier.maxSelect))
      ? Number(modifier.maxSelect)
      : modifier.type === "single"
        ? 1
        : options.length;

    if (modifier.required && selectedInGroup.length === 0) {
      throw new ValidationError(
        `Majburiy tanlov kiritilmagan: "${modifier.name}" (${product.name})`,
      );
    }

    if (modifier.type === "single" && selectedInGroup.length > 1) {
      throw new ValidationError(`Faqat bitta tanlov mumkin: "${modifier.name}" (${product.name})`);
    }

    if (selectedInGroup.length > maxSelect) {
      throw new ValidationError(
        `Tanlovlar soni limitdan oshgan: "${modifier.name}" (${product.name})`,
      );
    }
  }

  return { resolvedModifiers, modsTotal };
}

// ─── Cart totals (sof hisob) ─────────────────────────────────────────────────

/**
 * Oldindan o'qilgan mahsulotlar (productById) asosida savatni qayta hisoblaydi.
 * Firestore'ga murojaat qilmaydi — sof funksiya.
 *
 * @param {Array} cartItems — tuzilishi allaqachon validateCartItemsStructure dan o'tgan
 * @param {Map<string, object>} productById — productId → Firestore product.data()
 * @returns {{ recalculatedItems: Array, itemsTotal: number }}
 * @throws {ValidationError}
 */
export function computeCartTotals(cartItems, productById) {
  const recalculatedItems = [];
  let itemsTotal = 0;

  for (const item of cartItems) {
    const product = productById.get(item.productId);
    if (!product) {
      throw new ValidationError(
        `Mahsulot topilmadi: ${item.productId}. Menyu yangilangan bo'lishi mumkin.`,
      );
    }

    if (product.active === false) {
      throw new ValidationError(
        `Bu mahsulot hozir sotilmaydi: "${product.name}". Savatni yangilang.`,
      );
    }

    assertValidPrice(product.price, product.name);

    const quantity = Number(item.quantity);

    // ── Variant narxi ──────────────────────────────────────────────────────
    let basePrice;
    let resolvedVariant = null;

    if (item.selectedVariant?.id) {
      const variant = (product.variants ?? []).find((v) => v.id === item.selectedVariant.id);
      if (!variant) {
        throw new ValidationError(
          `Variant topilmadi: "${item.selectedVariant.id}" (${product.name})`,
        );
      }
      assertValidPrice(variant.price, `${product.name} / ${variant.name}`);
      basePrice = variant.price;
      resolvedVariant = { id: variant.id, name: variant.name, price: variant.price };
    } else {
      basePrice = product.price;
    }

    // ── Modifier narxlari ──────────────────────────────────────────────────
    const { resolvedModifiers, modsTotal } = resolveAndValidateModifiers(
      product,
      item.selectedModifiers,
    );

    // ── Qatorcha hisob ─────────────────────────────────────────────────────
    const unitPrice = basePrice + modsTotal;
    const subtotal = unitPrice * quantity;
    itemsTotal += subtotal;

    recalculatedItems.push({
      productId: item.productId,
      name: product.name,
      image: product.image ?? "",
      basePrice,
      unitPrice,
      selectedVariant: resolvedVariant,
      selectedModifiers: resolvedModifiers,
      quantity,
      subtotal,
      comment: typeof item.comment === "string" ? item.comment.slice(0, 200) : undefined,
    });
  }

  return { recalculatedItems, itemsTotal };
}
