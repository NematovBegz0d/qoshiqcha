const buckets = new Map();

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

export function createRateLimit({ windowMs = 60_000, max = 60, name = "default" } = {}) {
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
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSeconds));
      return res
        .status(429)
        .json({ error: "Juda ko'p so'rov yuborildi. Birozdan keyin urinib ko'ring." });
    }

    return next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) buckets.delete(key);
  }
}, 10 * 60_000).unref?.();
