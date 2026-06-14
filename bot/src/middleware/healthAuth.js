import crypto from "crypto";

/**
 * Maxfiy tokenlarni doimiy vaqtda (timing-safe) taqqoslaydi.
 * Uzunlik sizib chiqmasligi uchun avval sha256 hash qilinadi (teng uzunlik).
 */
function safeEqual(a, b) {
  const ah = crypto.createHash("sha256").update(String(a)).digest();
  const bh = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ah, bh);
}

/**
 * Telegram diagnostika / webhook endpointlariga kirish ruxsatini tekshiradi.
 *
 * Qoidalar:
 *   - Development: ochiq (qulay debugging uchun).
 *   - Production + HEALTH_CHECK_SECRET sozlanmagan: YOPIQ (endpoint o'chirilgan).
 *   - Production + secret sozlangan: faqat to'g'ri ?secret= yoki
 *     x-health-secret header bilan ochiladi.
 *
 * @param {object} req
 * @param {{ isProduction: boolean, secret: string }} opts
 * @returns {boolean}
 */
export function isHealthRequestAuthorized(req, { isProduction, secret }) {
  if (!isProduction) return true;
  if (!secret) return false;

  const provided = req.query?.secret ?? req.headers?.["x-health-secret"];
  if (typeof provided !== "string" || provided.length === 0) return false;

  return safeEqual(provided, secret);
}

/**
 * Express middleware fabrikasi. Ruxsat yo'q bo'lsa 404 qaytaradi
 * (endpoint mavjudligini oshkor qilmaslik uchun 403 emas, 404).
 */
export function createHealthGuard({ isProduction, secret }) {
  return (req, res, next) => {
    if (isHealthRequestAuthorized(req, { isProduction, secret })) {
      return next();
    }
    return res.status(404).json({ ok: false, error: "Not found" });
  };
}
