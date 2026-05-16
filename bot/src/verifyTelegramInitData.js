import crypto from "crypto";

// Default: 1 soat (3600s). TELEGRAM_INIT_DATA_MAX_AGE_SECONDS env bilan o'zgartiriladi.
// 86400 (24 soat) juda uzun — replay attack oynasini kattalashtiradi.
const DEFAULT_MAX_AGE_SECONDS = Number(process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS ?? 3600);

/**
 * Verify Telegram WebApp initData per:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(initData, botToken, options = {}) {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) return null;
  params.delete("hash");

  const authDate = Number(params.get("auth_date"));
  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1000);
  if (!Number.isFinite(authDate)) return null;
  if (authDate > nowSeconds + 60) return null;
  if (maxAgeSeconds > 0 && nowSeconds - authDate > maxAgeSeconds) return null;

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  const computedBuffer = Buffer.from(computed, "hex");
  const hashBuffer = Buffer.from(hash, "hex");
  if (
    computedBuffer.length !== hashBuffer.length ||
    !crypto.timingSafeEqual(computedBuffer, hashBuffer)
  ) {
    return null;
  }

  const userRaw = params.get("user");
  try {
    return userRaw ? JSON.parse(userRaw) : null;
  } catch {
    return null;
  }
}
