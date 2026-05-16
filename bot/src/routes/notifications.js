import express from "express";
import { requireTelegram } from "../middleware/auth.js";

export function createNotificationsRouter({ db }) {
  const router = express.Router();

  router.post("/my", requireTelegram, async (req, res) => {
    try {
      const snap = await db
        .collection("notifications")
        .doc(String(req.tgUser.id))
        .collection("items")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      const items = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          type: d.type ?? "order_status",
          title: d.title ?? "",
          body: d.body ?? "",
          orderId: d.orderId ?? null,
          orderNumber: d.orderNumber ?? null,
          status: d.status ?? null,
          read: d.read ?? false,
          createdAt: d.createdAt?.toMillis?.() ?? Date.now(),
        };
      });

      return res.json({ ok: true, items });
    } catch (err) {
      console.error("[POST /api/notifications/my]", err);
      return res.status(500).json({ error: "Bildirishnomalar yuklanmadi" });
    }
  });

  router.patch("/:id/read", requireTelegram, async (req, res) => {
    try {
      const notifId = req.params.id;
      if (!notifId || typeof notifId !== "string" || notifId.length > 128) {
        return res.status(400).json({ error: "Noto'g'ri ID" });
      }

      await db
        .collection("notifications")
        .doc(String(req.tgUser.id))
        .collection("items")
        .doc(notifId)
        .update({ read: true });

      return res.json({ ok: true });
    } catch (err) {
      console.error("[PATCH /api/notifications/:id/read]", err);
      return res.status(500).json({ error: "Belgilab bo'lmadi" });
    }
  });

  return router;
}
