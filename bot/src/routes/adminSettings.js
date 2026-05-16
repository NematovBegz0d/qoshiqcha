import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { cleanSettingsPatch } from "../adminValidation.js";
import { sendAdminError } from "../helpers/adminError.js";

export function createAdminSettingsRouter({ db }) {
  const router = express.Router();

  router.patch("/", requireAdmin, async (req, res) => {
    try {
      const patch = cleanSettingsPatch(req.body?.patch);
      await db.doc("settings/global").set(patch, { merge: true });
      return res.json({ ok: true });
    } catch (err) {
      return sendAdminError(res, err, "[PATCH /api/admin/settings]");
    }
  });

  return router;
}
