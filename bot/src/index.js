import express from "express";
import cors from "cors";
import { createBot } from "./bot.js";
import { db, admin } from "./firebaseAdmin.js";
import { createOrdersRouter } from "./routes/orders.js";
import { createAdminOrdersRouter } from "./routes/adminOrders.js";
import { createAdminProductsRouter } from "./routes/adminProducts.js";
import { createAdminCategoriesRouter } from "./routes/adminCategories.js";
import { createAdminPromotionsRouter } from "./routes/adminPromotions.js";
import { createAdminSettingsRouter } from "./routes/adminSettings.js";
import { createReviewsRouter } from "./routes/reviews.js";
import { createNotificationsRouter } from "./routes/notifications.js";
import { createRateLimit } from "./middleware/rateLimit.js";
import { env } from "./config/env.js";

// ─── Startup checks ────────────────────────────────────────────────────────

const bot = createBot(env.BOT_TOKEN);

// ─── CORS ──────────────────────────────────────────────────────────────────

const IS_PRODUCTION = env.IS_PRODUCTION;

const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((o) => o.trim())
  .filter(Boolean)
  .filter((o) => {
    // Productionda wildcard qabul qilinmaydi
    if (IS_PRODUCTION && o === "*") {
      console.warn(
        "[CORS] WARNING: CORS_ORIGIN=* productionda ruxsat etilmaydi. O'tkazib yuborildi.",
      );
      return false;
    }
    return true;
  });

// Localhost originlari faqat development rejimida avtomatik qo'shiladi
if (!IS_PRODUCTION) {
  for (const origin of [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ]) {
    if (!corsOrigins.includes(origin)) corsOrigins.push(origin);
  }
}

if (IS_PRODUCTION && corsOrigins.length === 0) {
  console.error("[CORS] XATO: Productionda CORS_ORIGIN sozlanmagan. Barcha so'rovlar rad etiladi.");
}

const allowAllCorsOrigins = !IS_PRODUCTION && corsOrigins.includes("*");

// ─── Express setup ─────────────────────────────────────────────────────────

const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAllCorsOrigins || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  }),
);

if (!env.BOT_POLLING && env.BOT_WEBHOOK_URL) {
  app.use(
    bot.webhookCallback(env.BOT_WEBHOOK_PATH, {
      secretToken: env.BOT_WEBHOOK_SECRET || undefined,
    }),
  );
}

app.use(express.json({ limit: "1mb" }));
app.use("/api", createRateLimit({ windowMs: 60_000, max: 180, name: "api" }));

app.get("/", (_, res) => res.json({ ok: true, name: "Qoshiqcha fast food-bot" }));
app.get("/healthz", (_, res) =>
  res.json({
    ok: true,
    botPolling: env.BOT_POLLING,
    webhookPath: env.BOT_WEBHOOK_PATH,
    webhookUrlConfigured: Boolean(env.BOT_WEBHOOK_URL),
    webhookSecretConfigured: Boolean(env.BOT_WEBHOOK_SECRET),
    renderExternalUrlConfigured: Boolean(process.env.RENDER_EXTERNAL_URL),
    renderExternalHostnameConfigured: Boolean(process.env.RENDER_EXTERNAL_HOSTNAME),
    renderGitCommit: process.env.RENDER_GIT_COMMIT ?? null,
  }),
);

// ─── Routes ────────────────────────────────────────────────────────────────

const deps = { db, admin, bot };

app.use("/api/orders", createOrdersRouter(deps));
app.use("/api/admin/orders", createAdminOrdersRouter(deps));
app.use("/api/admin/products", createAdminProductsRouter(deps));
app.use("/api/admin/categories", createAdminCategoriesRouter(deps));
app.use("/api/admin/promotions", createAdminPromotionsRouter(deps));
app.use("/api/admin/settings", createAdminSettingsRouter(deps));
app.use("/api/reviews", createReviewsRouter(deps));
app.use("/api/notifications", createNotificationsRouter(deps));

// ─── Start ─────────────────────────────────────────────────────────────────

const PORT = env.PORT;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));

if (env.BOT_POLLING) {
  bot.launch().then(() => console.log("Bot started"));
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
} else if (env.BOT_WEBHOOK_URL) {
  const webhookOptions = env.BOT_WEBHOOK_SECRET
    ? { secret_token: env.BOT_WEBHOOK_SECRET }
    : undefined;

  bot.telegram
    .setWebhook(env.BOT_WEBHOOK_URL, webhookOptions)
    .then(() => console.log(`Bot webhook set: ${env.BOT_WEBHOOK_URL}`))
    .catch((err) => {
      console.error("Bot webhook setup failed:", err);
      process.exitCode = 1;
    });
} else {
  console.log("Bot polling and webhook disabled");
}
