import type { NotifItem } from "@/lib/types";

const API_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3005"
).replace(/\/$/, "");

async function apiJson<T>(path: string, method: string, body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Server bilan aloqa yo'q. Internetingizni tekshiring.");
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Server xatosi (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchMyNotifications(initData: string): Promise<NotifItem[]> {
  const data = await apiJson<{ items: NotifItem[] }>("/api/notifications/my", "POST", { initData });
  return data.items;
}

export async function markNotificationRead(initData: string, id: string): Promise<void> {
  await apiJson<{ ok: boolean }>(`/api/notifications/${id}/read`, "PATCH", { initData });
}
