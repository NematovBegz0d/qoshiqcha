import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { cleanDocumentId, cleanPromotionPayload } from "../adminValidation.js";
import { sendAdminError } from "../helpers/adminError.js";

export function createAdminPromotionsRouter({ db, admin }) {
  const router = express.Router();

  router.post("/", requireAdmin, async (req, res) => {
    try {
      const promotion = req.body?.promotion;
      const id = cleanDocumentId(promotion?.id, "promotion.id");
      const data = cleanPromotionPayload(promotion);
      await db.doc(`promotions/${id}`).set({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(201).json({ ok: true, id });
    } catch (err) {
      return sendAdminError(res, err, "[POST /api/admin/promotions]");
    }
  });

  router.patch("/:id", requireAdmin, async (req, res) => {
    try {
      const id = cleanDocumentId(req.params.id, "promotion.id");
      const patch = cleanPromotionPayload(req.body?.patch, { partial: true });
      await db
        .doc(`promotions/${id}`)
        .set(
          { ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true },
        );
      return res.json({ ok: true });
    } catch (err) {
      return sendAdminError(res, err, "[PATCH /api/admin/promotions/:id]");
    }
  });

  router.delete("/:id", requireAdmin, async (req, res) => {
    try {
      const id = cleanDocumentId(req.params.id, "promotion.id");
      await db.doc(`promotions/${id}`).delete();
      return res.json({ ok: true });
    } catch (err) {
      return sendAdminError(res, err, "[DELETE /api/admin/promotions/:id]");
    }
  });

  return router;
}
