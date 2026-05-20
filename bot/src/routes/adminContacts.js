import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { cleanContactsPatch } from "../adminValidation.js";
import { sendAdminError } from "../helpers/adminError.js";

export function createAdminContactsRouter({ db }) {
  const router = express.Router();

  router.patch("/", requireAdmin, async (req, res) => {
    try {
      const patch = cleanContactsPatch(req.body?.patch);
      await db.doc("settings/contacts").set(patch, { merge: true });
      return res.json({ ok: true });
    } catch (err) {
      return sendAdminError(res, err, "[PATCH /api/admin/contacts]");
    }
  });

  return router;
}
