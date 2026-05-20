import "dotenv/config";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function requireString(name, { min = 1, example = "" } = {}) {
  const value = cleanString(process.env[name]);
  if (value.length < min) {
    const hint = example ? ` Masalan: ${example}` : "";
    throw new Error(`Missing required environment variable: ${name}.${hint}`);
  }
  return value;
}

function optionalString(name, fallback = "") {
  return cleanString(process.env[name]) || fallback;
}

function normalizePath(value, fallback) {
  const raw = cleanString(value) || fallback;
  if (!raw) return "";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function resolveWebhookUrl(path) {
  const explicitUrl = optionalString("BOT_WEBHOOK_URL");
  if (explicitUrl) return explicitUrl;

  const renderUrl = optionalString("RENDER_EXTERNAL_URL").replace(/\/$/, "");
  if (renderUrl) return `${renderUrl}${path}`;

  const renderHostname = optionalString("RENDER_EXTERNAL_HOSTNAME");
  return renderHostname ? `https://${renderHostname}${path}` : "";
}

function parseBoolean(name, fallback = true) {
  const value = cleanString(process.env[name]).toLowerCase();
  if (!value) return fallback;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  throw new Error(`Invalid boolean environment variable: ${name}`);
}

function parsePositiveInteger(name, fallback) {
  const raw = cleanString(process.env[name]);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid positive integer environment variable: ${name}`);
  }
  return value;
}

function parseTelegramIds(name) {
  const raw = cleanString(process.env[name]);
  if (!raw) return [];

  const ids = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (ids.length === 0) {
    throw new Error(`${name} sozlangan, lekin ichida yaroqli Telegram ID topilmadi.`);
  }

  return ids;
}

function parseServiceAccount() {
  const raw = requireString("FIREBASE_SERVICE_ACCOUNT", {
    example: '{"type":"service_account",...}',
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT JSON formatida emas: ${err.message}`);
  }

  const requiredFields = ["project_id", "client_email", "private_key"];
  for (const field of requiredFields) {
    if (!cleanString(parsed[field])) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT ichida "${field}" maydoni yo'q.`);
    }
  }

  return {
    ...parsed,
    private_key: String(parsed.private_key).replace(/\\n/g, "\n"),
  };
}

const isProduction = process.env.NODE_ENV === "production";
const botWebhookPath = normalizePath(process.env.BOT_WEBHOOK_PATH, "/telegram/webhook");

export const env = Object.freeze({
  NODE_ENV: optionalString("NODE_ENV", "development"),
  IS_PRODUCTION: isProduction,
  PORT: optionalString("PORT", "3005"),
  BOT_TOKEN: requireString("BOT_TOKEN"),
  WEB_APP_URL: requireString("WEB_APP_URL"),
  CORS_ORIGIN: optionalString("CORS_ORIGIN"),
  ADMIN_CHAT_ID: optionalString("ADMIN_CHAT_ID"),
  ADMIN_TELEGRAM_IDS: parseTelegramIds("ADMIN_TELEGRAM_IDS"),
  BOT_POLLING: parseBoolean("BOT_POLLING", true),
  BOT_WEBHOOK_URL: resolveWebhookUrl(botWebhookPath),
  BOT_WEBHOOK_PATH: botWebhookPath,
  BOT_WEBHOOK_SECRET: optionalString("BOT_WEBHOOK_SECRET"),
  APP_TIME_ZONE: optionalString("APP_TIME_ZONE", "Asia/Tashkent"),
  MIN_PICKUP_LEAD_MINUTES: parsePositiveInteger("MIN_PICKUP_LEAD_MINUTES", 20),
  FIREBASE_SERVICE_ACCOUNT: parseServiceAccount(),
});

export const ADMIN_TELEGRAM_ID_SET = new Set(env.ADMIN_TELEGRAM_IDS);
