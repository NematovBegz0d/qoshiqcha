import { useUser } from "@/store/userStore";
import type { Order, PickupInfo } from "@/lib/types";
import { apiRequest, AuthError } from "@/services/api";

// AuthError orqaga moslik uchun re-export qilinadi (avval shu modulda e'lon qilingan).
export { AuthError };

// ─── Local store operatsiyalari ────────────────────────────────────────────

export function saveOrderLocally(order: Order): void {
  useUser.getState().addOrder(order);
}

export function subscribeUserOrders(telegramId: number, cb: (orders: Order[]) => void): () => void {
  const filter = (orders: Order[]) =>
    telegramId ? orders.filter((o) => o.telegramId === telegramId) : orders;
  cb(filter(useUser.getState().orders));
  return useUser.subscribe((s) => cb(filter(s.orders)));
}

export async function updateOrderStatus(id: string, status: Order["status"]): Promise<void> {
  useUser.getState().updateOrderStatus(id, status);
}

export function getOrder(id: string): Order | undefined {
  return useUser.getState().orders.find((o) => o.id === id);
}

// ─── Backend API ───────────────────────────────────────────────────────────

/**
 * Backendga yuboriladigan cart item formati.
 * Narx maydonlari (basePrice, uid, name, image) KIRITILMAYDI.
 */
export type BackendCartItem = {
  productId: string;
  quantity: number;
  selectedVariant: { id: string; name: string; price: number } | null;
  selectedModifiers: { id: string; name: string; price: number }[];
  comment: string;
};

/**
 * Backendga yuboriladigan manzil formati.
 * id va isDefault KIRITILMAYDI; optional maydonlar normalize qilinadi.
 */
export type BackendAddress = {
  fullAddress: string;
  title: string;
  lat: number | null;
  lng: number | null;
  house: string;
  apartment: string;
  floor: string;
  entrance: string;
  courierNote: string;
};

/**
 * Backendga yuboriladigan order ma'lumotlari.
 * Narxlar (totalPrice, deliveryPrice, itemsTotal) KIRITILMAYDI —
 * backend ularni Firestore products va settings dan o'zi hisoblaydi.
 */
export type OrderPayload = {
  items: BackendCartItem[];
  orderType: Order["orderType"];
  address?: BackendAddress;
  pickup?: PickupInfo;
  phone: string;
  paymentType: "cash" | "card_courier";
  comment?: string;
};

export type BackendOrderResult = {
  id: string;
  orderNumber: string;
  order: Order;
};

function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return apiRequest<T>("POST", path, body);
}

export async function fetchMyOrders(initData: string): Promise<Order[]> {
  const result = await postJson<{ orders: Order[] }>("/api/orders/my", { initData });
  return result.orders;
}

export async function fetchAdminOrders(initData: string): Promise<Order[]> {
  const result = await postJson<{ orders: Order[] }>("/api/admin/orders", { initData });
  return result.orders;
}

/**
 * Buyurtmani backendga yuboradi.
 * Backend: initData verify → products Firestore'dan → narxlarni qayta hisoblash → saqlash → admin xabari.
 *
 * @throws {AuthError} — 401: initData yaroqsiz
 * @throws {Error}     — 400: validatsiya xatosi (backend error message bilan)
 * @throws {Error}     — network yoki 500 xato
 */
export async function submitOrderToBackend(
  initData: string,
  order: OrderPayload,
): Promise<BackendOrderResult> {
  return postJson<BackendOrderResult>("/api/orders", { initData, order });
}

// ─── Reviews ───────────────────────────────────────────────────────────────

export type ReviewPayload = {
  productId: string;
  rating: number;
  text: string;
};

export async function submitReview(
  initData: string,
  payload: ReviewPayload,
): Promise<{ id: string }> {
  return postJson<{ id: string }>("/api/reviews", { initData, ...payload });
}
