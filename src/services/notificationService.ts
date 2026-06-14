import type { NotifItem } from "@/lib/types";
import { apiRequest } from "@/services/api";

export async function fetchMyNotifications(initData: string): Promise<NotifItem[]> {
  const data = await apiRequest<{ items: NotifItem[] }>("POST", "/api/notifications/my", {
    initData,
  });
  return data.items;
}

export async function markNotificationRead(initData: string, id: string): Promise<void> {
  await apiRequest<{ ok: boolean }>("PATCH", `/api/notifications/${id}/read`, { initData });
}
