import express from "express";
import { requireTelegram } from "../middleware/auth.js";
import { createRateLimit } from "../middleware/rateLimit.js";

function validationError(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function cleanProductId(productId) {
  if (!productId || typeof productId !== "string") {
    throw validationError("productId noto'g'ri");
  }

  const safeProductId = productId.trim();
  if (!safeProductId || safeProductId.length > 120 || safeProductId.includes("/")) {
    throw validationError("productId noto'g'ri");
  }

  return safeProductId;
}

function cleanRating(rating) {
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw validationError("Reyting 1 dan 5 gacha bo'lishi kerak");
  }
  return ratingNum;
}

function cleanReviewText(text) {
  if (!text || typeof text !== "string") {
    throw validationError("Sharh matni kiritilmagan");
  }

  const safeText = text.trim();
  if (safeText.length < 3) {
    throw validationError("Sharh matni kamida 3 belgi bo'lishi kerak");
  }
  if (safeText.length > 1000) {
    throw validationError("Sharh matni 1000 belgidan oshmasin");
  }

  return safeText;
}

async function assertUserCanReviewProduct(db, telegramId, productId) {
  // Eng yangi 100 ta buyurtmani tekshiramiz (orderBy bilan deterministik).
  // telegramId + createdAt composite index ishlatiladi (firestore.indexes.json).
  const ordersSnap = await db
    .collection("orders")
    .where("telegramId", "==", telegramId)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const hasCompletedOrderForProduct = ordersSnap.docs.some((doc) => {
    const order = doc.data();
    const items = order.items;
    return (
      order.status === "completed" &&
      Array.isArray(items) &&
      items.some((item) => item?.productId === productId)
    );
  });

  if (!hasCompletedOrderForProduct) {
    throw validationError(
      "Sharh qoldirish uchun avval shu mahsulot bo'yicha yakunlangan buyurtma kerak.",
    );
  }
}

export function createReviewsRouter({ db, admin }) {
  const router = express.Router();

  router.post(
    "/",
    createRateLimit({ windowMs: 60_000, max: 8, name: "reviews" }),
    requireTelegram,
    async (req, res) => {
      try {
        const safeProductId = cleanProductId(req.body?.productId);
        const ratingNum = cleanRating(req.body?.rating);
        const safeText = cleanReviewText(req.body?.text);
        const authorId = req.tgUser.id;
        const reviewId = `${safeProductId}_${authorId}`;

        // Transaction tashqarisida tekshirish — transaction.get(Query) ishlamaydi Admin SDK da
        await assertUserCanReviewProduct(db, authorId, safeProductId);

        await db.runTransaction(async (t) => {
          const productRef = db.collection("products").doc(safeProductId);
          const reviewRef = db.collection("reviews").doc(reviewId);

          const [productSnap, existingReviewSnap] = await Promise.all([
            t.get(productRef),
            t.get(reviewRef),
          ]);

          if (!productSnap.exists) {
            throw validationError("Mahsulot topilmadi");
          }

          const data = productSnap.data();
          if (data.active === false) {
            throw validationError("Bu mahsulot hozir sharh qabul qilmaydi");
          }

          if (existingReviewSnap.exists) {
            throw validationError("Siz bu mahsulotga avval sharh qoldirgansiz.");
          }

          const oldCount = Number.isInteger(data.reviewsCount) ? data.reviewsCount : 0;
          const oldRating = typeof data.rating === "number" ? data.rating : 0;
          const newCount = oldCount + 1;
          const newRating = Math.round(((oldRating * oldCount + ratingNum) / newCount) * 10) / 10;

          t.set(reviewRef, {
            productId: safeProductId,
            author: req.tgUser.first_name ?? req.tgUser.username ?? "Foydalanuvchi",
            authorId,
            rating: ratingNum,
            text: safeText,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          t.update(productRef, {
            rating: newRating,
            reviewsCount: newCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });

        return res.status(201).json({ ok: true, id: reviewId });
      } catch (err) {
        if (err.status === 400) {
          return res.status(400).json({ error: err.message });
        }
        console.error("[POST /api/reviews]", err);
        return res.status(500).json({ error: "Sharh saqlanmadi. Keyinroq urinib ko'ring." });
      }
    },
  );

  return router;
}
