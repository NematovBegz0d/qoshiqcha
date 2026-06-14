import { getRedis } from "../redisClient.js";

const TOO_MANY_REQUESTS_MESSAGE =
  "Juda ko'p so'rov yuborildi. Birozdan keyin urinib ko'ring.";

export function getClientKey(req, name) {
  // Express `trust proxy` (index.js: app.set("trust proxy", 1)) req.ip ni
  // ishonchli proxy soni bo'yicha to'g'ri aniqlaydi.
  //
  // X-Forwarded-For ni QO'LDA parse QILMAYMIZ: u mijoz tomonidan
  // soxtalashtiriladi (spoofing) — har so'rovda turli qiymat yuborib
  // hujumchi cheksiz yangi bucket olishi va rate limit ni chetlab o'tishi mumkin edi.
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  return `${name}:${ip}`;
}

function sendTooMany(res, retryAfterMs) {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  res.set("Retry-After", String(retryAfterSeconds));
  return res.status(429).json({ error: TOO_MANY_REQUESTS_MESSAGE });
}

// ─── In-memory limiter (yagona instance / Redissiz fallback) ─────────────────

const buckets = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) buckets.delete(key);
  }
}, 10 * 60_000).unref?.();

export function createMemoryRateLimit({ windowMs = 60_000, max = 60, name = "default" } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req, name);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      return sendTooMany(res, current.resetAt - now);
    }

    return next();
  };
}

// ─── Redis limiter (distributed / ko'p instance) ─────────────────────────────

// Fixed-window counter, atomik Lua script bilan (INCR + birinchi so'rovda
// PEXPIRE). Bitta atomik amal → INCR va EXPIRE orasida race bo'lmaydi.
// Qaytaradi: { count, ttlMs }.
const FIXED_WINDOW_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return {current, ttl}
`;

export function createRedisRateLimit(redis, { windowMs = 60_000, max = 60, name = "default" } = {}) {
  return async (req, res, next) => {
    const key = `ratelimit:${getClientKey(req, name)}`;
    try {
      const [count, ttlMs] = await redis.eval(FIXED_WINDOW_SCRIPT, 1, key, windowMs);

      if (count > max) {
        // PTTL -1 (muddatsiz) yoki -2 (yo'q) bo'lsa windowMs ga qaytamiz.
        const retryAfterMs = ttlMs > 0 ? ttlMs : windowMs;
        return sendTooMany(res, retryAfterMs);
      }

      return next();
    } catch (err) {
      // FAIL-OPEN: Redis uzilsa rate limit API ni qulatmasligi kerak.
      // So'rovni o'tkazamiz, lekin xatoni log qilamiz.
      console.error("[rateLimit] Redis xatosi, so'rov o'tkazildi (fail-open):", err.message);
      return next();
    }
  };
}

// ─── Tanlovchi: Redis bo'lsa distributed, bo'lmasa in-memory ─────────────────

export function createRateLimit(options = {}) {
  const redis = getRedis();
  return redis ? createRedisRateLimit(redis, options) : createMemoryRateLimit(options);
}
