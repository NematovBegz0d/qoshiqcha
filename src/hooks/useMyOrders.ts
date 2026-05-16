import { useCallback, useEffect, useState } from "react";
import type { Order } from "@/lib/types";
import { tg } from "@/lib/telegram";
import { fetchMyOrders } from "@/services/orderService";

export function useMyOrders(telegramId: number | null | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts: { initial?: boolean } = {}) => {
      if (!telegramId) {
        setLoading(false);
        return;
      }

      const initData = tg()?.initData ?? "";
      if (!initData) {
        setLoading(false);
        setError("Buyurtmalarni ko'rish uchun ilovani Telegram ichida oching.");
        return;
      }

      if (opts.initial) setLoading(true);
      else setRefreshing(true);

      try {
        const nextOrders = await fetchMyOrders(initData);
        setOrders(nextOrders);
        setError(null);
      } catch (err) {
        console.error("[useMyOrders] API xatosi:", err);
        setError(
          err instanceof Error ? err.message : "Buyurtmalarni yuklashda texnik xatolik yuz berdi.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [telegramId],
  );

  useEffect(() => {
    void load({ initial: true });
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  return { orders, loading, refreshing, error, refresh };
}
