import crypto from "crypto";
import { env } from "./config/env.js";
import { validateCartItemsStructure, computeCartTotals } from "./cartPricing.js";

// ─── Validation Error ──────────────────────────────────────────────────────
// ValidationError alohida (firebase-admin'siz) modulda — bu yerda orqaga
// moslik uchun re-export qilinadi (adminValidation.js, adminError.js ishlatadi).
export { ValidationError } from "./errors.js";

// ─── Order number generator ────────────────────────────────────────────────

export function generateOrderNumber() {
  return `#${crypto.randomBytes(3).toString("hex").toUpperCase()}${Date.now().toString().slice(-4)}`;
}

// ─── Firestore settings ────────────────────────────────────────────────────

// Xavfsiz default ish vaqti. workingHours noto'g'ri sozlanganda shu ishlatiladi
// (fail-open "doim ochiq" ham, fail-closed "doim yopiq" ham emas — fail-safe).
export const DEFAULT_WORKING_HOURS = Object.freeze({ from: "09:00", to: "00:00" });

const SETTINGS_DEFAULTS = {
  deliveryPrice: 15000,
  freeDeliveryFrom: 50000,
  minOrderPrice: 25000,
  workingHours: { ...DEFAULT_WORKING_HOURS },
  shopIsOpen: true,
};

/**
 * workingHours ni validatsiya qiladi.
 * - Format to'g'ri (from/to "HH:MM") → o'zini qaytaradi.
 * - Noto'g'ri (yo'q, noto'g'ri tur, buzuq format) → xavfsiz DEFAULT_WORKING_HOURS
 *   (ogohlantirish bilan). Bu admin typo'si butun buyurtmani to'xtatib qo'ymasligi,
 *   ayni paytda do'konni 24/7 ochiq qoldirmasligi uchun.
 * @returns {{ from: string, to: string }}
 */
export function normalizeWorkingHours(workingHours) {
  const from = workingHours?.from;
  const to = workingHours?.to;
  const fromMinutes = parseTimeToMinutes(from);
  const toMinutes = parseTimeToMinutes(to, { allowEndOfDay: true });

  if (fromMinutes === null || toMinutes === null) {
    console.warn(
      "[priceService] Noto'g'ri workingHours formati — xavfsiz default ish vaqtiga qaytilmoqda",
    );
    return { ...DEFAULT_WORKING_HOURS };
  }

  return { from, to };
}

/**
 * Firestore settings/global dan o'qiydi.
 * - doc yo'q → SETTINGS_DEFAULTS qaytaradi (log bilan)
 * - Firestore xato (network, permission) → throw qiladi → 500 ga boradi
 * - workingHours har doim normallashtiriladi (buzuq format default'ga tushadi)
 * @param {FirebaseFirestore.Firestore} db
 */
export async function getSettings(db) {
  const snap = await db.collection("settings").doc("global").get();
  if (!snap.exists) {
    console.warn("[priceService] settings/global topilmadi — default ishlatilmoqda");
    return { ...SETTINGS_DEFAULTS };
  }
  const merged = { ...SETTINGS_DEFAULTS, ...snap.data() };
  merged.workingHours = normalizeWorkingHours(merged.workingHours);
  return merged;
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
 * Noto'g'ri format → null qaytaradi (chaqiruvchi qaror qabul qiladi;
 * isWithinWorkingHours buni xavfsiz default ish vaqtiga aylantiradi).
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
  // Noto'g'ri format fail-open EMAS: normalizeWorkingHours buzuq sozlamani
  // xavfsiz default ish vaqtiga aylantiradi va shu bo'yicha baholanadi.
  const { from, to } = normalizeWorkingHours(workingHours);
  const fromMinutes = parseTimeToMinutes(from);
  const toMinutes = parseTimeToMinutes(to, { allowEndOfDay: true });

  // normalizeWorkingHours valid qiymat kafolatlaydi; bu himoya uchun.
  if (fromMinutes === null || toMinutes === null) {
    return false;
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

// ─── Cart recalculation ────────────────────────────────────────────────────

/**
 * Savatni Firestore'dagi haqiqiy narxlar bilan qayta hisoblaydi.
 *
 * 1. Tuzilish + uzunlik validatsiyasi (DoS himoyasi: maksimal element soni).
 * 2. Barcha mahsulotlarni BITTA batch (parallel) bilan o'qiydi — N+1 emas.
 * 3. Sof computeCartTotals() bilan narxni qayta hisoblaydi.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {Array} cartItems — frontenddan kelgan items[]
 * @returns {Promise<{ recalculatedItems: Array, itemsTotal: number }>}
 * @throws {ValidationError} — validatsiya xatolarida
 * @throws {Error}           — Firestore xatolarida (→ 500)
 */
export async function recalculateCart(db, cartItems) {
  validateCartItemsStructure(cartItems);

  // Takrorlanmas productId lar (bir mahsulot turli variant/modifier bilan
  // bir necha marta bo'lishi mumkin) — har birini faqat bir marta o'qiymiz.
  const uniqueIds = [...new Set(cartItems.map((item) => item.productId))];
  const refs = uniqueIds.map((id) => db.collection("products").doc(id));
  const snaps = await db.getAll(...refs);

  const productById = new Map();
  snaps.forEach((snap, index) => {
    if (snap.exists) productById.set(uniqueIds[index], snap.data());
  });

  return computeCartTotals(cartItems, productById);
}

// ─── Delivery price calculation ────────────────────────────────────────────

export function calcDeliveryPrice(orderType, itemsTotal, settings) {
  if (orderType === "pickup") return 0;
  if (itemsTotal >= settings.freeDeliveryFrom) return 0;
  return settings.deliveryPrice;
}
