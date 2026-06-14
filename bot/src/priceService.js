import crypto from "crypto";
import { env } from "./config/env.js";

// ─── Validation Error ──────────────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

// ─── Order number generator ────────────────────────────────────────────────

export function generateOrderNumber() {
  return `#${crypto.randomBytes(3).toString("hex").toUpperCase()}${Date.now().toString().slice(-4)}`;
}

// ─── Firestore settings ────────────────────────────────────────────────────

const SETTINGS_DEFAULTS = {
  deliveryPrice: 15000,
  freeDeliveryFrom: 50000,
  minOrderPrice: 25000,
  workingHours: { from: "09:00", to: "00:00" },
  shopIsOpen: true,
};

/**
 * Firestore settings/global dan o'qiydi.
 * - doc yo'q → SETTINGS_DEFAULTS qaytaradi (log bilan)
 * - Firestore xato (network, permission) → throw qiladi → 500 ga boradi
 * @param {FirebaseFirestore.Firestore} db
 */
export async function getSettings(db) {
  const snap = await db.collection("settings").doc("global").get();
  if (!snap.exists) {
    console.warn("[priceService] settings/global topilmadi — default ishlatilmoqda");
    return { ...SETTINGS_DEFAULTS };
  }
  return { ...SETTINGS_DEFAULTS, ...snap.data() };
}

// ─── Working hours check ───────────────────────────────────────────────────

/**
 * Hozirgi vaqt ish vaqti ichida ekanligini tekshiradi.
 *
 * Qo'llab-quvvatlangan holatlar:
 *   "09:00" → "22:00"  — oddiy kun ichi ish vaqti
 *   "09:00" → "00:00"  — "00:00" = yarim tun = 24:00 (ish kuni oxiri)
 *   "18:00" → "03:00"  — yarim tundan o'tuvchi ish vaqti
 *
 * Noto'g'ri format → xavfsiz default: true (ochiq deb hisoblash)
 */
export function parseTimeToMinutes(value, { allowEndOfDay = false } = {}) {
  if (typeof value !== "string") return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (allowEndOfDay && hour === 24 && minute === 0) return 24 * 60;
  if (hour === 0 && minute === 0 && allowEndOfDay) return 24 * 60;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export function getCurrentMinutesInTimeZone(timeZone = env.APP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return new Date().getHours() * 60 + new Date().getMinutes();
  }
  return hour * 60 + minute;
}

export function isTimeWithinWindow(timeValue, workingHours) {
  const { from, to } = workingHours ?? {};
  const targetMinutes = parseTimeToMinutes(timeValue);
  const fromMinutes = parseTimeToMinutes(from);
  const toMinutes = parseTimeToMinutes(to, { allowEndOfDay: true });

  if (targetMinutes === null || fromMinutes === null || toMinutes === null) {
    return false;
  }

  if (toMinutes < fromMinutes) {
    return targetMinutes >= fromMinutes || targetMinutes < toMinutes;
  }

  return targetMinutes >= fromMinutes && targetMinutes < toMinutes;
}

export function minutesUntilTimeInCurrentWindow(timeValue, workingHours) {
  const { from, to } = workingHours ?? {};
  const targetMinutes = parseTimeToMinutes(timeValue);
  const fromMinutes = parseTimeToMinutes(from);
  const toMinutes = parseTimeToMinutes(to, { allowEndOfDay: true });

  if (targetMinutes === null || fromMinutes === null || toMinutes === null) {
    return null;
  }

  const currentMinutes = getCurrentMinutesInTimeZone();

  if (toMinutes < fromMinutes) {
    // Masalan 18:00 → 03:00: 00:30 keyingi kun ichida bo'lishi mumkin.
    if (currentMinutes >= fromMinutes && targetMinutes < toMinutes) {
      return targetMinutes + 24 * 60 - currentMinutes;
    }
    if (
      currentMinutes < toMinutes &&
      targetMinutes >= currentMinutes &&
      targetMinutes < toMinutes
    ) {
      return targetMinutes - currentMinutes;
    }
    if (targetMinutes >= currentMinutes) {
      return targetMinutes - currentMinutes;
    }
    return null;
  }

  if (targetMinutes < currentMinutes) return null;
  return targetMinutes - currentMinutes;
}

export function isWithinWorkingHours(workingHours) {
  const { from, to } = workingHours ?? {};
  const fromMinutes = parseTimeToMinutes(from);
  const toMinutes = parseTimeToMinutes(to, { allowEndOfDay: true });

  if (fromMinutes === null || toMinutes === null) {
    console.warn("[priceService] Noto'g'ri workingHours formati — ochiq deb hisoblanmoqda");
    return true;
  }

  const currentMinutes = getCurrentMinutesInTimeZone();

  if (toMinutes < fromMinutes) {
    // Yarim tundan o'tuvchi ish vaqti: masalan 18:00 → 03:00
    return currentMinutes >= fromMinutes || currentMinutes < toMinutes;
  }

  return currentMinutes >= fromMinutes && currentMinutes < toMinutes;
}

// ─── Phone validation ──────────────────────────────────────────────────────

export function validatePhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

// ─── Price validation helper ───────────────────────────────────────────────

/**
 * Narx qiymati haqiqiy son va manfiy emasligini tekshiradi.
 * @throws {ValidationError}
 */
function assertValidPrice(price, label) {
  if (typeof price !== "number" || !isFinite(price) || price < 0) {
    throw new ValidationError(
      `Narx ma'lumoti noto'g'ri: "${label}". Menyu yangilangan bo'lishi mumkin.`,
    );
  }
}

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

function resolveAndValidateModifiers(product, selectedModifiers) {
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

// ─── Cart recalculation ────────────────────────────────────────────────────

/**
 * Har bir cart item uchun Firestore'dan mahsulotni o'qiydi,
 * active holatini va narx to'g'riligini tekshirib, qayta hisoblaydi.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {Array} cartItems — frontenddan kelgan items[]
 * @returns {{ recalculatedItems: Array, itemsTotal: number }}
 * @throws {ValidationError} — validatsiya xatolarida
 * @throws {Error}           — Firestore xatolarida (→ 500)
 */
export async function recalculateCart(db, cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new ValidationError("Savat bo'sh");
  }

  // ── 1-bosqich: item tuzilishini tekshirish + unikal productId'larni yig'ish ──
  for (const item of cartItems) {
    if (!item.productId || typeof item.productId !== "string") {
      throw new ValidationError("Mahsulot ID noto'g'ri formatda");
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new ValidationError(`Noto'g'ri miqdor: ${item.productId}`);
    }
  }

  // ── 2-bosqich: barcha mahsulotni BITTA batch o'qishda olish (N+1 emas) ──────
  const uniqueIds = [...new Set(cartItems.map((item) => item.productId))];
  const refs = uniqueIds.map((id) => db.collection("products").doc(id));
  const snaps = await db.getAll(...refs);
  const productById = new Map(snaps.map((snap) => [snap.id, snap]));

  const recalculatedItems = [];
  let itemsTotal = 0;

  for (const item of cartItems) {
    const quantity = Number(item.quantity);

    // ── Batch natijasidan mahsulotni olish ────────────────────────────────
    const productSnap = productById.get(item.productId);
    if (!productSnap || !productSnap.exists) {
      throw new ValidationError(
        `Mahsulot topilmadi: ${item.productId}. Menyu yangilangan bo'lishi mumkin.`,
      );
    }

    const product = productSnap.data();

    if (product.active === false) {
      throw new ValidationError(
        `Bu mahsulot hozir sotilmaydi: "${product.name}". Savatni yangilang.`,
      );
    }

    // product.price validatsiyasi
    assertValidPrice(product.price, product.name);

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

// ─── Delivery price calculation ────────────────────────────────────────────

export function calcDeliveryPrice(orderType, itemsTotal, settings) {
  if (orderType === "pickup") return 0;
  if (itemsTotal >= settings.freeDeliveryFrom) return 0;
  return settings.deliveryPrice;
}
