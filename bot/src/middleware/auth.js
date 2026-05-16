import { verifyTelegramInitData } from "../verifyTelegramInitData.js";
import { env, ADMIN_TELEGRAM_ID_SET as ADMIN_IDS_SET } from "../config/env.js";

const BOT_TOKEN = env.BOT_TOKEN;

if (ADMIN_IDS_SET.size === 0) {
  console.warn(
    "[AUTH] WARNING: ADMIN_TELEGRAM_IDS sozlanmagan yoki bo'sh. " +
      "Admin endpointlari hech kimga ruxsat bermaydi.",
  );
}

export function authenticateTelegramInitData(initData) {
  if (!initData || typeof initData !== "string") return null;
  return verifyTelegramInitData(initData, BOT_TOKEN);
}

export function requireTelegram(req, res, next) {
  const tgUser = authenticateTelegramInitData(req.body?.initData);
  if (!tgUser) {
    return res.status(401).json({ error: "Telegram autentifikatsiya xatosi. Botni qayta oching." });
  }
  req.tgUser = tgUser;
  next();
}

export function requireAdmin(req, res, next) {
  const tgUser = authenticateTelegramInitData(req.body?.initData);
  if (!tgUser) {
    return res.status(401).json({ error: "Telegram autentifikatsiya xatosi" });
  }
  if (!ADMIN_IDS_SET.has(tgUser.id)) {
    return res.status(403).json({ error: "Ruxsat yo'q" });
  }
  req.tgUser = tgUser;
  next();
}
