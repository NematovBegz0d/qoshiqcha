import type { Order, OrderStatus } from "@/lib/types";

export const orderStatusFlow: OrderStatus[] = [
  "new",
  "accepted",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
];

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "Yangi",
  accepted: "Qabul",
  preparing: "Tayyorlanmoqda",
  delivering: "Yetkazilmoqda",
  completed: "Yakunlangan",
  cancelled: "Bekor",
};

const pickupStatusLabels: Partial<Record<OrderStatus, string>> = {
  delivering: "Tayyor",
  completed: "Topshirildi",
};

export const orderStatusActionLabels: Partial<Record<OrderStatus, string>> = {
  accepted: "Qabul qilish",
  preparing: "Tayyorlash",
  delivering: "Keyingi bosqich",
  completed: "Yakunlash",
  cancelled: "Bekor qilish",
};

export const orderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  new: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["delivering", "cancelled"],
  delivering: ["completed"],
  completed: [],
  cancelled: [],
};

export function getNextOrderStatuses(status: OrderStatus): OrderStatus[] {
  return orderStatusTransitions[status] ?? [];
}

export function getOrderStatusLabel(status: OrderStatus, orderType?: Order["orderType"]): string {
  if (orderType === "pickup" && pickupStatusLabels[status]) {
    return pickupStatusLabels[status];
  }
  return orderStatusLabels[status];
}
