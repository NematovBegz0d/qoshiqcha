import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { cleanDocumentId, cleanProductPayload } from "../adminValidation.js";
import { sendAdminError } from "../helpers/adminError.js";

export function createAdminProductsRouter({ db, admin }) {
  const router = express.Router();

  router.post("/", requireAdmin, async (req, res) => {
    try {
      const product = req.body?.product;
      const id = cleanDocumentId(product?.id, "product.id");
      const data = await cleanProductPayload(product);
      await db.doc(`products/${id}`).set({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(201).json({ ok: true, id });
    } catch (err) {
      return sendAdminError(res, err, "[POST /api/admin/products]");
    }
  });

  router.patch("/:id", requireAdmin, async (req, res) => {
    try {
      const id = cleanDocumentId(req.params.id, "product.id");
      const patch = await cleanProductPayload(req.body?.patch, { partial: true });
      await db
        .doc(`products/${id}`)
        .set(
          { ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true },
        );
      return res.json({ ok: true });
    } catch (err) {
      return sendAdminError(res, err, "[PATCH /api/admin/products/:id]");
    }
  });

  router.delete("/:id", requireAdmin, async (req, res) => {
    try {
      const id = cleanDocumentId(req.params.id, "product.id");
      await db.doc(`products/${id}`).delete();
      return res.json({ ok: true });
    } catch (err) {
      return sendAdminError(res, err, "[DELETE /api/admin/products/:id]");
    }
  });

  return router;
}
