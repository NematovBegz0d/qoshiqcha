import { Markup } from "telegraf";
import { db, admin } from "./firebaseAdmin.js";
import { orderMessage, statusMessages } from "./telegramMessages.js";
import { canChangeOrderStatus, getNextOrderStatuses } from "./orderStatus.js";
import { writeOrderStatusNotification } from "./helpers/writeNotification.js";
import { env, ADMIN_TELEGRAM_ID_SET as ADMIN_IDS } from "./config/env.js";

const ADMIN_CHAT_ID = env.ADMIN_CHAT_ID;

function isAdmin(userId) {
  if (ADMIN_IDS.size === 0) return false;
  return ADMIN_IDS.has(userId);
}

// ─── Workflow transitions ──────────────────────────────────────────────────

const BUTTON_LABELS = {
  accepted: "✅ Qabul qilish",
  preparing: "👨‍🍳 Tayyorlanmoqda",
  delivering: "🚚 Yetkazilmoqda",
  completed: "🎉 Yakunlash",
  cancelled: "❌ Bekor qilish",
};

// ─── Keyboard — faqat joriy statusdan ruxsat etilgan keyingi bosqichlar ──────

/** @returns {import("telegraf").Markup | null} null = terminal status, tugma yo'q */
export function adminKeyboard(orderId, currentStatus) {
  const next = getNextOrderStatuses(currentStatus);
  if (next.length === 0) return null;

  const mainBtns = next
    .filter((s) => s !== "cancelled")
    .map((s) => Markup.button.callback(BUTTON_LABELS[s], `s:${orderId}:${s}`));

  const rows = [];
  if (mainBtns.length > 0) rows.push(mainBtns);
  if (next.includes("cancelled"))
    rows.push([Markup.button.callback(BUTTON_LABELS.cancelled, `s:${orderId}:cancelled`)]);

  return Markup.inlineKeyboard(rows);
}

// ─── Admin guruhga xabar ───────────────────────────────────────────────────

/** Yangi buyurtma kelganda admin guruhga xabar yuborish */
export async function notifyAdminOfOrder(bot, order) {
  if (!ADMIN_CHAT_ID) return;
  const kb = adminKeyboard(order.id, order.status ?? "new");
  await bot.telegram.sendMessage(ADMIN_CHAT_ID, orderMessage(order), {
    parse_mode: "HTML",
    ...(kb ? { reply_markup: kb.reply_markup } : {}),
  });
}

// ─── Inline callback handler ───────────────────────────────────────────────

/** Inline tugma bosilganda status yangilash + foydalanuvchini xabardor qilish */
export function registerOrderActions(bot) {
  bot.action(/^s:(.+):(.+)$/, async (ctx) => {
    const [, orderId, newStatus] = ctx.match;

    // ── 1. Admin tekshiruvi ────────────────────────────────────────────────
    if (!isAdmin(ctx.from?.id)) {
      await ctx.answerCbQuery("Ruxsat yo'q", { show_alert: true });
      return;
    }

    try {
      const ref = db.collection("orders").doc(orderId);
      const snap = await ref.get();
      if (!snap.exists) {
        await ctx.answerCbQuery("Buyurtma topilmadi");
        return;
      }
      const order = snap.data();

      // ── 2. Transition validatsiyasi ────────────────────────────────────
      if (!canChangeOrderStatus(order.status, newStatus)) {
        await ctx.answerCbQuery(`Bu o'tish ruxsat etilmagan: ${order.status} → ${newStatus}`, {
          show_alert: true,
        });
        return;
      }

      // ── 3. Firestore yangilash ─────────────────────────────────────────
      const changedAt = admin.firestore.Timestamp.now();
      await ref.update({
        status: newStatus,
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status: newStatus,
          at: changedAt,
          by: ctx.from.id,
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ── 4. Foydalanuvchiga xabar ───────────────────────────────────────
      if (order.telegramId && statusMessages[newStatus]) {
        await bot.telegram
          .sendMessage(
            order.telegramId,
            `${statusMessages[newStatus]}\n\nBuyurtma: ${order.orderNumber}`,
          )
          .catch(() => {});
      }

      if (order.telegramId) {
        await writeOrderStatusNotification(db, {
          telegramId: order.telegramId,
          status: newStatus,
          orderNumber: order.orderNumber,
          orderId,
          orderType: order.orderType ?? "delivery",
        }).catch((err) => {
          console.error("[orderHandlers] notification yozishda xato:", err.message);
        });
      }

      // ── 5. Admin xabarini yangi keyboard bilan edit qilish ─────────────
      await ctx.answerCbQuery(`✓ ${newStatus}`);
      const kb = adminKeyboard(orderId, newStatus);
      if (kb) {
        await ctx.editMessageReplyMarkup(kb.reply_markup);
      } else {
        // Terminal status — tugmalarni olib tashlash
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      }
    } catch (e) {
      console.error("[orderHandlers] callback xatosi:", e);
      await ctx.answerCbQuery("Xatolik");
    }
  });
}
