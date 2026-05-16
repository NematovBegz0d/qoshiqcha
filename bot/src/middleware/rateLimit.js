const buckets = new Map();

function getClientKey(req, name) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : req.ip;
  return `${name}:${ip || req.socket?.remoteAddress || "unknown"}`;
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
