import { useCallback, useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { tg } from "@/lib/telegram";
import { fetchAdminOrders } from "@/services/orderService";
import { adminApi } from "@/services/adminApi";

export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts: { initial?: boolean } = {}) => {
    const initData = tg()?.initData ?? "";
    if (!initData) {
      setLoading(false);
      setError("Admin orderlarni ko'rish uchun Telegram Mini App ichida oching.");
      return;
    }

    if (opts.initial) setLoading(true);
    else setRefreshing(true);

    try {
      const nextOrders = await fetchAdminOrders(initData);
      setOrders(nextOrders);
      setError(null);
    } catch (err) {
      console.error("[useAdminOrders] API xatosi:", err);
      setError(err instanceof Error ? err.message : "Orderlar yuklanmadi. Internetni tekshiring.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load({ initial: true });
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
    const result = await adminApi.updateOrderStatus(id, status);
    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? {
              ...order,
              status: result.status,
              statusHistory: [...order.statusHistory, result.statusHistoryItem],
            }
          : order,
      ),
    );
  }, []);

  return { orders, loading, refreshing, error, refresh, updateStatus };
}
