import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { cleanDocumentId, cleanBranchPayload } from "../adminValidation.js";
import { sendAdminError } from "../helpers/adminError.js";

export function createAdminBranchesRouter({ db, admin }) {
  const router = express.Router();

  router.post("/", requireAdmin, async (req, res) => {
    try {
      const branch = req.body?.branch;
      const id = cleanDocumentId(branch?.id, "branch.id");
      const data = cleanBranchPayload(branch);
      await db.doc(`branches/${id}`).set({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(201).json({ ok: true, id });
    } catch (err) {
      return sendAdminError(res, err, "[POST /api/admin/branches]");
    }
  });

  router.patch("/:id", requireAdmin, async (req, res) => {
    try {
      const id = cleanDocumentId(req.params.id, "branch.id");
      const patch = cleanBranchPayload(req.body?.patch, { partial: true });
      await db
        .doc(`branches/${id}`)
        .set(
          { ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true },
        );
      return res.json({ ok: true });
    } catch (err) {
      return sendAdminError(res, err, "[PATCH /api/admin/branches/:id]");
    }
  });

  router.delete("/:id", requireAdmin, async (req, res) => {
    try {
      const id = cleanDocumentId(req.params.id, "branch.id");
      await db.doc(`branches/${id}`).delete();
      return res.json({ ok: true });
    } catch (err) {
      return sendAdminError(res, err, "[DELETE /api/admin/branches/:id]");
    }
  });

  return router;
}
