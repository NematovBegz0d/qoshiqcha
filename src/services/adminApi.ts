import { tg } from "@/lib/telegram";
import type { Branch, BusinessContacts, Category, OrderStatus, Product, Promotion, Settings } from "@/lib/types";

const BASE = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3005"
).replace(/\/$/, "");

async function call<T = unknown>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const initData = tg()?.initData ?? "";
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData, ...body }),
    });
  } catch {
    throw new Error("Server bilan aloqa yo'q. Internetingizni tekshiring.");
  }

  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json as T;
}

export const adminApi = {
  updateOrderStatus: (id: string, status: OrderStatus) =>
    call<{
      status: OrderStatus;
      statusHistoryItem: { status: OrderStatus; at: number; by: number };
    }>("PATCH", `/api/admin/orders/${id}/status`, { status }),

  updateSettings: (patch: Partial<Settings>) => call("PATCH", "/api/admin/settings", { patch }),

  createProduct: (product: Product) => call("POST", "/api/admin/products", { product }),

  updateProduct: (id: string, patch: Partial<Product>) =>
    call("PATCH", `/api/admin/products/${id}`, { patch }),

  deleteProduct: (id: string) => call("DELETE", `/api/admin/products/${id}`),

  createCategory: (category: Category) => call("POST", "/api/admin/categories", { category }),

  updateCategory: (id: string, patch: Partial<Category>) =>
    call("PATCH", `/api/admin/categories/${id}`, { patch }),

  deleteCategory: (id: string) => call("DELETE", `/api/admin/categories/${id}`),

  createPromotion: (promotion: Promotion) => call("POST", "/api/admin/promotions", { promotion }),

  updatePromotion: (id: string, patch: Partial<Promotion>) =>
    call("PATCH", `/api/admin/promotions/${id}`, { patch }),

  deletePromotion: (id: string) => call("DELETE", `/api/admin/promotions/${id}`),

  createBranch: (branch: Branch) => call("POST", "/api/admin/branches", { branch }),

  updateBranch: (id: string, patch: Partial<Branch>) =>
    call("PATCH", `/api/admin/branches/${id}`, { patch }),

  deleteBranch: (id: string) => call("DELETE", `/api/admin/branches/${id}`),

  updateContacts: (patch: Partial<BusinessContacts>) =>
    call("PATCH", "/api/admin/contacts", { patch }),
};
