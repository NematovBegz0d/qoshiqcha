import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { serializeOrderDoc } from "../helpers/serialize.js";
import { cleanDocumentId } from "../adminValidation.js";
import { canChangeOrderStatus, getNextOrderStatuses } from "../orderStatus.js";
import { statusMessages } from "../telegramMessages.js";
import { sendAdminError } from "../helpers/adminError.js";
import { writeOrderStatusNotification } from "../helpers/writeNotification.js";

const ORDER_STATUS_LABELS = Object.freeze({
  new: "Yangi",
  accepted: "Qabul qilingan",
  preparing: "Tayyorlanmoqda",
  delivering: "Yo'lda / tayyor",
  completed: "Yakunlangan",
  cancelled: "Bekor qilingan",
});

export function createAdminOrdersRouter({ db, admin, bot }) {
  const router = express.Router();

  router.post("/", requireAdmin, async (_, res) => {
    try {
      const snap = await db.collection("orders").orderBy("createdAt", "desc").limit(100).get();
      const orders = snap.docs.map(serializeOrderDoc);
      return res.json({ ok: true, orders });
    } catch (err) {
      console.error("[POST /api/admin/orders]", err);
      return res.status(500).json({ error: "Orderlar yuklanmadi" });
    }
  });

  router.patch("/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = cleanDocumentId(req.params.id, "order id");
      const { status } = req.body ?? {};

      if (typeof status !== "string" || !(status in ORDER_STATUS_LABELS)) {
        return res.status(400).json({ error: "Status noto'g'ri" });
      }

      const ref = db.collection("orders").doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        return res.status(404).json({ error: "Buyurtma topilmadi" });
      }

      const order = snap.data();
      const currentStatus = order.status ?? "new";
      if (!canChangeOrderStatus(currentStatus, status)) {
        const nextStatuses = getNextOrderStatuses(currentStatus)
          .map((s) => ORDER_STATUS_LABELS[s] ?? s)
          .join(", ");
        return res.status(400).json({
          error: nextStatuses
            ? `Bu statusga o'tib bo'lmaydi. Keyingi ruxsat etilgan: ${nextStatuses}`
            : "Bu buyurtma yakuniy holatda",
        });
      }

      const changedAt = admin.firestore.Timestamp.now();
      await ref.update({
        status,
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status,
          at: changedAt,
          by: req.tgUser.id,
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (order.telegramId && statusMessages[status]) {
        bot.telegram
          .sendMessage(
            order.telegramId,
            `${statusMessages[status]}\n\nBuyurtma: ${order.orderNumber}`,
          )
          .catch((err) => {
            console.error("[admin status] Userga status xabari yuborilmadi:", err.message);
          });
      }

      if (order.telegramId) {
        writeOrderStatusNotification(db, {
          telegramId: order.telegramId,
          status,
          orderNumber: order.orderNumber,
          orderId: id,
          orderType: order.orderType ?? "delivery",
        }).catch((err) => {
          console.error("[admin status] Notification yozishda xato:", err.message);
        });
      }

      return res.json({
        ok: true,
        status,
        statusHistoryItem: { status, at: changedAt.toMillis(), by: req.tgUser.id },
      });
    } catch (err) {
      return sendAdminError(res, err, "[PATCH /api/admin/orders/:id/status]");
    }
  });

  return router;
}
