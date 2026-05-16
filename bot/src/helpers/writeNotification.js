const STATUS_NOTIFICATIONS = {
  accepted: {
    title: "Buyurtmangiz qabul qilindi ✅",
    body: (orderNumber) => `#${orderNumber} buyurtmangiz tayyorlanishga qabul qilindi`,
  },
  preparing: {
    title: "Tayyorlanmoqda 🍳",
    body: (orderNumber) => `#${orderNumber} buyurtmangiz tayyorlanmoqda`,
  },
  delivering: {
    delivery: {
      title: "Buyurtma yo'lda 🚗",
      body: (orderNumber) => `#${orderNumber} kuryerga topshirildi`,
    },
    pickup: {
      title: "Tayyor! Olib keting 🎉",
      body: (orderNumber) => `#${orderNumber} buyurtmangiz tayyor`,
    },
  },
  completed: {
    title: "Buyurtma yakunlandi ✅",
    body: (orderNumber) => `#${orderNumber} muvaffaqiyatli yetkazildi`,
  },
  cancelled: {
    title: "Buyurtma bekor qilindi ❌",
    body: (orderNumber) => `#${orderNumber} bekor qilindi`,
  },
};

export async function writeOrderStatusNotification(
  db,
  { telegramId, status, orderNumber, orderId, orderType },
) {
  let template = STATUS_NOTIFICATIONS[status];
  if (!template) return; // "new" uchun bildirishnoma yozmaymiz

  if (status === "delivering") {
    template = template[orderType] ?? template.delivery;
  }

  await db
    .collection("notifications")
    .doc(String(telegramId))
    .collection("items")
    .add({
      type: "order_status",
      title: template.title,
      body: template.body(orderNumber),
      orderId,
      orderNumber,
      status,
      read: false,
      createdAt: new Date(),
    });
}
