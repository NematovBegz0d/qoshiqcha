import { useState } from "react";
import { Package, DollarSign, CheckCircle2, XCircle, ShoppingBag, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatUZS } from "@/lib/format";
import { haptic, notify } from "@/lib/telegram";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import type { OrderStatus } from "@/lib/types";
import {
  getNextOrderStatuses,
  getOrderStatusLabel,
  orderStatusActionLabels,
  orderStatusFlow,
} from "@/lib/orderStatus";
import { Stat, FilterChip } from "./ui";

export function OrdersTab() {
  const { orders, loading, refreshing, error, refresh, updateStatus } = useAdminOrders();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Yuklanmoqda...</p>;
  }
  if (error) {
    return <p className="py-10 text-center text-sm text-destructive">{error}</p>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => o.createdAt >= today.getTime());
  const newOrders = orders.filter((o) => o.status === "new");
  const completed = orders.filter((o) => o.status === "completed");
  const cancelled = orders.filter((o) => o.status === "cancelled");
  const totalRevenue = completed.reduce((s, o) => s + o.totalPrice, 0);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat
          icon={<Package className="w-4 h-4" />}
          label="Bugungi"
          value={todayOrders.length.toString()}
        />
        <Stat
          icon={<ShoppingBag className="w-4 h-4" />}
          label="Yangi"
          value={newOrders.length.toString()}
        />
        <Stat
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Yakunlangan"
          value={completed.length.toString()}
        />
        <Stat
          icon={<XCircle className="w-4 h-4" />}
          label="Bekor"
          value={cancelled.length.toString()}
        />
      </div>

      <div className="p-4 rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
        <div className="flex items-center gap-2 text-xs opacity-80">
          <DollarSign className="w-4 h-4" /> Umumiy savdo
        </div>
        <p className="mt-1 text-2xl font-bold">{formatUZS(totalRevenue)}</p>
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Buyurtmalar
        </span>
        <button
          onClick={() => {
            void refresh();
          }}
          disabled={refreshing}
          className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
          aria-label="Yangilash"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="no-scrollbar overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 w-max">
          <FilterChip label="Barchasi" active={filter === "all"} onClick={() => setFilter("all")} />
          {orderStatusFlow.map((s) => (
            <FilterChip
              key={s}
              label={getOrderStatusLabel(s)}
              active={filter === s}
              onClick={() => setFilter(s)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center py-10 text-sm text-muted-foreground">Buyurtma yo'q</p>
        )}
        {filtered.map((o) => {
          const nextStatuses = getNextOrderStatuses(o.status);
          const isUpdating = updatingId === o.id;
          return (
            <div
              key={o.id}
              className="p-3 rounded-2xl bg-card border border-border shadow-card space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{o.orderNumber}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {o.user.firstName ?? o.user.username ?? "User"} · {o.phone}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {o.items.length} mahsulot ·{" "}
                    {o.orderType === "delivery" ? "Yetkazib berish" : "Olib ketish"} ·{" "}
                    {o.paymentType === "cash" ? "Naqd" : "Karta"}
                  </p>
                  {o.createdAt > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString("uz-UZ")}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">{formatUZS(o.totalPrice)}</p>
                  {o.deliveryPrice > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      yetk: {formatUZS(o.deliveryPrice)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {orderStatusFlow.map((s) => (
                  <span
                    key={s}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                      o.status === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground opacity-40"
                    }`}
                  >
                    {getOrderStatusLabel(s, o.orderType)}
                  </span>
                ))}
              </div>
              {nextStatuses.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {nextStatuses.map((status) => {
                    const actionLabel =
                      status === "delivering"
                        ? getOrderStatusLabel(status, o.orderType)
                        : (orderStatusActionLabels[status] ??
                          getOrderStatusLabel(status, o.orderType));
                    return (
                      <button
                        key={status}
                        onClick={async () => {
                          setUpdatingId(o.id);
                          try {
                            await updateStatus(o.id, status);
                            notify("success");
                            haptic("medium");
                          } catch (err) {
                            console.error("[admin] order status xatosi:", err);
                            notify("error");
                            toast.error(
                              err instanceof Error ? err.message : "Statusni o'zgartirib bo'lmadi.",
                            );
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                        disabled={isUpdating}
                        className={`h-9 px-3 rounded-xl text-xs font-bold border transition disabled:opacity-60 ${
                          status === "cancelled"
                            ? "bg-destructive/10 border-destructive/20 text-destructive"
                            : "bg-primary-soft border-primary/20 text-primary"
                        }`}
                      >
                        {isUpdating ? "Saqlanmoqda..." : actionLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
