import { useCallback, useEffect, useState } from "react";
import { tg } from "@/lib/telegram";
import type { NotifItem } from "@/lib/types";
import { fetchMyNotifications, markNotificationRead } from "@/services/notificationService";
import { useNotifStore } from "@/store/notifStore";

export function useNotifications() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setUnreadCount = useNotifStore((s) => s.setUnreadCount);

  const load = useCallback(async () => {
    const initData = tg()?.initData ?? "";
    if (!initData) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await fetchMyNotifications(initData);
      setItems(next);
      setUnreadCount(next.filter((n) => !n.read).length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bildirishnomalar yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(
    (id: string) => {
      const initData = tg()?.initData ?? "";
      if (!initData) return;
      setItems((curr) => {
        const next = curr.map((n) => (n.id === id ? { ...n, read: true } : n));
        setUnreadCount(next.filter((n) => !n.read).length);
        return next;
      });
      markNotificationRead(initData, id).catch((err) => {
        console.error("[useNotifications] markRead xatosi:", err.message);
      });
    },
    [setUnreadCount],
  );

  const unreadCount = items.filter((n) => !n.read).length;

  return { items, loading, error, markRead, refresh: load, unreadCount };
}
