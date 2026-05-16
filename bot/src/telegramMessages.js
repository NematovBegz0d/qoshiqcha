const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const orderMessage = (order) => {
  const items = order.items
    .map((i, idx) => {
      const modsPrice = i.selectedModifiers?.reduce((s, m) => s + m.price, 0) ?? 0;
      const subtotal = (i.basePrice + modsPrice) * i.quantity;
      const mods =
        i.selectedModifiers?.length > 0
          ? ` (${i.selectedModifiers.map((m) => escapeHtml(m.name)).join(", ")})`
          : "";
      return `${idx + 1}. ${escapeHtml(i.name)}${mods} ×${i.quantity} — ${subtotal} UZS`;
    })
    .join("\n");

  const customerName = [order.user.firstName, order.user.username ? `@${order.user.username}` : ""]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" ");

  const fulfillment =
    order.orderType === "delivery"
      ? `🚚 ${escapeHtml(order.address?.fullAddress ?? "")}`
      : `🏃 Olib ketish\n🏬 ${escapeHtml(order.pickup?.branchName ?? "Filial tanlanmagan")}\n⏰ ${escapeHtml(order.pickup?.pickupTime ?? "Vaqt tanlanmagan")}`;

  return `🆕 <b>Yangi buyurtma ${escapeHtml(order.orderNumber)}</b>

👤 ${customerName || "User"}
📞 ${escapeHtml(order.phone)}
${fulfillment}

🍽 <b>Mahsulotlar:</b>
${items}

💵 Mahsulotlar: ${order.itemsTotal} UZS
🚚 Yetkazish: ${order.deliveryPrice} UZS
<b>Jami: ${order.totalPrice} UZS</b>

💳 To'lov: ${escapeHtml(order.paymentType)}
${order.comment ? "📝 " + escapeHtml(order.comment) : ""}`;
};

export const statusMessages = {
  accepted: "✅ Buyurtmangiz qabul qilindi!",
  preparing: "👨‍🍳 Buyurtmangiz tayyorlanmoqda.",
  delivering: "🚚 Buyurtmangiz yo'lda!",
  completed: "🎉 Buyurtmangiz yetkazildi. Yoqimli ishtaha!",
  cancelled: "❌ Afsuski buyurtmangiz bekor qilindi.",
};
