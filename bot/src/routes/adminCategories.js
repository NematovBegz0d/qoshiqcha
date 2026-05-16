import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { cleanDocumentId, cleanCategoryPayload } from "../adminValidation.js";
import { sendAdminError } from "../helpers/adminError.js";

export function createAdminCategoriesRouter({ db }) {
  const router = express.Router();

  router.post("/", requireAdmin, async (req, res) => {
    try {
      const category = req.body?.category;
      const id = cleanDocumentId(category?.id, "category.id");
      const data = cleanCategoryPayload(category);
      await db.doc(`categories/${id}`).set(data);
      return res.status(201).json({ ok: true, id });
    } catch (err) {
      return sendAdminError(res, err, "[POST /api/admin/categories]");
    }
  });

  router.patch("/:id", requireAdmin, async (req, res) => {
    try {
      const id = cleanDocumentId(req.params.id, "category.id");
      const patch = cleanCategoryPayload(req.body?.patch, { partial: true });
      await db.doc(`categories/${id}`).set(patch, { merge: true });
      return res.json({ ok: true });
    } catch (err) {
      return sendAdminError(res, err, "[PATCH /api/admin/categories/:id]");
    }
  });

  router.delete("/:id", requireAdmin, async (req, res) => {
    try {
      const id = cleanDocumentId(req.params.id, "category.id");
      const productsSnap = await db.collection("products").where("categoryId", "==", id).get();
      const batch = db.batch();
      batch.delete(db.doc(`categories/${id}`));
      productsSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      return res.json({ ok: true, deletedProducts: productsSnap.size });
    } catch (err) {
      return sendAdminError(res, err, "[DELETE /api/admin/categories/:id]");
    }
  });

  return router;
}
