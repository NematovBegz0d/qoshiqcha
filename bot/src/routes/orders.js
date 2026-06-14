import express from "express";
import { requireTelegram, authenticateTelegramInitData } from "../middleware/auth.js";
import { serializeOrderDoc, sortOrdersNewestFirst } from "../helpers/serialize.js";
import {
  ValidationError,
  getSettings,
  isWithinWorkingHours,
  isTimeWithinWindow,
  minutesUntilTimeInCurrentWindow,
  validatePhone,
  generateOrderNumber,
  recalculateCart,
  calcDeliveryPrice,
} from "../priceService.js";
import { notifyAdminOfOrder } from "../orderHandlers.js";
import { getBranchById } from "../branches.js";
import { env } from "../config/env.js";

function cleanText(value, label, { min = 0, max = 200 } = {}) {
  if (typeof value !== "string") {
    throw new ValidationError(`${label} matn bo'lishi kerak`);
  }

  const cleaned = value.trim();
  if (cleaned.length < min) {
    throw new ValidationError(`${label} kiritilmagan`);
  }
  if (cleaned.length > max) {
    throw new ValidationError(`${label} ${max} belgidan oshmasin`);
  }

  return cleaned;
}

function cleanOptionalText(value, label, max = 200) {
  if (value === undefined || value === null) return "";
  return cleanText(value, label, { max });
}

function cleanOptionalCoordinate(value, label, { min, max }) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`${label} son bo'lishi kerak`);
  }
  if (value < min || value > max) {
    throw new ValidationError(`${label} noto'g'ri oraliqda`);
  }
  return value;
}

function cleanAddress(address) {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    throw new ValidationError("Yetkazish manzili kiritilmagan");
  }

  return {
    fullAddress: cleanText(address.fullAddress, "Yetkazish manzili", { min: 5, max: 500 }),
    title: cleanOptionalText(address.title, "Manzil nomi", 80),
    lat: cleanOptionalCoordinate(address.lat, "Latitude", { min: -90, max: 90 }),
    lng: cleanOptionalCoordinate(address.lng, "Longitude", { min: -180, max: 180 }),
    house: cleanOptionalText(address.house, "Uy", 40),
    apartment: cleanOptionalText(address.apartment, "Xonadon", 40),
    floor: cleanOptionalText(address.floor, "Qavat", 20),
    entrance: cleanOptionalText(address.entrance, "Kirish", 40),
    courierNote: cleanOptionalText(address.courierNote, "Kuryer izohi", 300),
  };
}

async function cleanPickup(db, pickup) {
  if (!pickup || typeof pickup !== "object" || Array.isArray(pickup)) {
    throw new ValidationError("Olib ketish uchun filial va vaqt kiritilmagan");
  }

  const branchId = cleanText(pickup.branchId, "Filial ID", { min: 1, max: 80 });
  const branch = await getBranchById(db, branchId);
  if (!branch) {
    throw new ValidationError("Tanlangan filial topilmadi");
  }

  const pickupTime = cleanText(pickup.pickupTime, "Olib ketish vaqti", { min: 5, max: 5 });
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(pickupTime)) {
    throw new ValidationError("Olib ketish vaqti noto'g'ri formatda");
  }

  const branchHours = { from: branch.openFrom, to: branch.openTo };
  if (!isTimeWithinWindow(pickupTime, branchHours)) {
    throw new ValidationError(
      `Tanlangan filial ish vaqti: ${branch.openFrom}–${branch.openTo}. Boshqa vaqt tanlang.`,
    );
  }

  const leadMinutes = minutesUntilTimeInCurrentWindow(pickupTime, branchHours);
  if (leadMinutes === null) {
    throw new ValidationError("Olib ketish vaqti o'tib ketgan. Yangi vaqt tanlang.");
  }
  if (leadMinutes < env.MIN_PICKUP_LEAD_MINUTES) {
    throw new ValidationError(
      `Olib ketish vaqti kamida ${env.MIN_PICKUP_LEAD_MINUTES} daqiqa oldindan tanlanishi kerak.`,
    );
  }

  return {
    branchId: branch.id,
    branchName: branch.name,
    pickupTime,
  };
}

export function createOrdersRouter({ db, admin, bot }) {
  const router = express.Router();

  // GET my orders
  router.post("/my", requireTelegram, async (req, res) => {
    try {
      const snap = await db
        .collection("orders")
        .where("telegramId", "==", req.tgUser.id)
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      const orders = snap.docs.map(serializeOrderDoc).sort(sortOrdersNewestFirst);
      return res.json({ ok: true, orders });
    } catch (err) {
      console.error("[POST /api/orders/my]", err);
      return res.status(500).json({ error: "Buyurtmalarni yuklashda server xatosi" });
    }
  });

  // Create new order
  router.post("/", async (req, res) => {
    try {
      const { initData, order } = req.body ?? {};

      if (!initData || typeof initData !== "string") {
        return res.status(401).json({ error: "Telegram ma'lumoti yo'q" });
      }

      const tgUser = authenticateTelegramInitData(initData);
      if (!tgUser) {
        return res
          .status(401)
          .json({ error: "Telegram autentifikatsiya xatosi. Botni qayta oching." });
      }

      if (!order || typeof order !== "object" || Array.isArray(order)) {
        return res.status(400).json({ error: "Order ma'lumoti noto'g'ri" });
      }

      const settings = await getSettings();

      if (!settings.shopIsOpen) {
        return res.status(400).json({ error: "Do'kon hozir yopiq" });
      }

      if (!isWithinWorkingHours(settings.workingHours)) {
        return res.status(400).json({
          error: `Do'kon ish vaqti: ${settings.workingHours.from}–${settings.workingHours.to}`,
        });
      }

      const orderType = order.orderType;
      if (orderType !== "delivery" && orderType !== "pickup") {
        return res.status(400).json({ error: "Buyurtma turi noto'g'ri" });
      }

      const ALLOWED_PAYMENT = ["cash", "card_courier"];
      if (!ALLOWED_PAYMENT.includes(order.paymentType)) {
        return res.status(400).json({ error: "To'lov turi noto'g'ri" });
      }

      const safePhone = cleanText(order.phone, "Telefon raqami", { min: 3, max: 32 });
      if (!validatePhone(safePhone)) {
        return res.status(400).json({ error: "Telefon raqami noto'g'ri" });
      }

      const safeAddress = orderType === "delivery" ? cleanAddress(order.address) : null;
      const safePickup = orderType === "pickup" ? await cleanPickup(db, order.pickup) : null;

      const { recalculatedItems, itemsTotal } = await recalculateCart(order.items);

      if (itemsTotal < settings.minOrderPrice) {
        return res.status(400).json({
          error: `Minimal buyurtma: ${settings.minOrderPrice} UZS. Hozir: ${itemsTotal} UZS`,
        });
      }

      const deliveryPrice = calcDeliveryPrice(orderType, itemsTotal, settings);
      const totalPrice = itemsTotal + deliveryPrice;

      const orderDoc = {
        orderNumber: generateOrderNumber(),
        telegramId: tgUser.id,
        user: {
          telegramId: tgUser.id,
          firstName: tgUser.first_name ?? null,
          username: tgUser.username ?? null,
          phone: safePhone,
        },
        items: recalculatedItems,
        orderType,
        address: safeAddress,
        pickup: safePickup,
        phone: safePhone,
        paymentType: order.paymentType,
        itemsTotal,
        deliveryPrice,
        discount: 0,
        totalPrice,
        status: "new",
        statusHistory: [{ status: "new", at: admin.firestore.Timestamp.now(), by: "system" }],
        comment: cleanOptionalText(order.comment, "Buyurtma izohi", 500),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const ref = await db.collection("orders").add(orderDoc);
      const savedSnap = await ref.get();
      const savedOrder = serializeOrderDoc(savedSnap);

      notifyAdminOfOrder(bot, savedOrder).catch((err) => {
        console.error("[notify] Admin ga xabar yuborishda xato:", err.message);
      });

      return res.status(201).json({
        ok: true,
        id: ref.id,
        orderNumber: orderDoc.orderNumber,
        order: savedOrder,
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message });
      }
      console.error("[POST /api/orders]", err);
      return res.status(500).json({ error: "Server xatosi. Keyinroq urinib ko'ring." });
    }
  });

  return router;
}
