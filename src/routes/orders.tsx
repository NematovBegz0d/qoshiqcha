import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ListOrdered,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ChefHat,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { formatUZS } from "@/lib/format";
import { getTelegramUser } from "@/lib/telegram";
import { useMyOrders } from "@/hooks/useMyOrders";
import type { OrderStatus } from "@/lib/types";
import { getOrderStatusLabel } from "@/lib/orderStatus";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

import { useCatalog } from "@/store/catalogStore";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const tgUser = getTelegramUser();
  const { orders, loading, refreshing, error, refresh } = useMyOrders(tgUser?.id);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);
  const products = useCatalog((s) => s.products);

  const statusInfo: Record<
    OrderStatus,
    {
      label: string;
      hint?: string;
      color: string;
      icon: React.ComponentType<{ className?: string }>;
      pulse?: boolean;
    }
  > = {
    new: {
      label: tr("orderNew"),
      hint: tr("orderNewHint"),
      color: "bg-warning/15 text-warning",
      icon: Clock,
      pulse: true,
    },
    accepted: {
      label: tr("orderAccepted"),
      color: "bg-primary/15 text-primary",
      icon: CheckCircle2,
    },
    preparing: {
      label: tr("orderPreparing"),
      color: "bg-accent text-accent-foreground",
      icon: ChefHat,
    },
    delivering: { label: tr("orderDelivering"), color: "bg-primary/15 text-primary", icon: Truck },
    completed: {
      label: tr("orderCompleted"),
      color: "bg-success/15 text-success",
      icon: CheckCircle2,
    },
    cancelled: {
      label: tr("orderCancelled"),
      color: "bg-destructive/15 text-destructive",
      icon: XCircle,
    },
  };

  return (
    <div className="app-shell pb-28">
      <main className="px-4 pt-safe pt-4 space-y-3">
        {/* Page header with refresh button */}
        <div className="flex items-center justify-between pb-1">
          <h1 className="text-lg font-bold">{tr("myOrders")}</h1>
          <button
            onClick={() => {
              void refresh();
            }}
            disabled={refreshing || loading}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
            aria-label="Yangilash"
          >
            <RefreshCw
              className={`w-4 h-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        {loading && (
          <div className="flex justify-center pt-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {!loading && error && orders.length === 0 && (
          <p className="text-center text-sm text-destructive pt-8">{error}</p>
        )}
        {!loading && !error && !tgUser && (
          <p className="text-center text-sm text-muted-foreground pt-8">{tr("loginRequired")}</p>
        )}
        {!loading && !error && tgUser && orders.length === 0 && (
          <EmptyState
            icon={<ListOrdered className="w-9 h-9" />}
            title={tr("noOrders")}
            description={tr("noOrdersDesc")}
            action={
              <Link
                to="/"
                className="mt-2 inline-flex rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
              >
                {tr("goToMenu")}
              </Link>
            }
          />
        )}
        {orders.map((o) => {
          const s = statusInfo[o.status];
          const Icon = s.icon;
          const statusLabel =
            o.status === "new" ? s.label : getOrderStatusLabel(o.status, o.orderType);
          return (
            <div
              key={o.id}
              className="p-4 rounded-2xl bg-card border border-border shadow-card space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-bold">{o.orderNumber}</span>
                </div>
                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.color} ${s.pulse ? "animate-pulse" : ""}`}
                >
                  <Icon className="w-3 h-3" />
                  {statusLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(o.createdAt).toLocaleString("uz-UZ")}
              </p>
              {s.hint && <p className="text-[11px] text-warning font-medium">{s.hint}</p>}
              <div className="flex flex-wrap gap-1">
                {o.items.slice(0, 3).map((i, idx) => {
                  const p = products.find((p) => p.id === i.productId);
                  const pName = p
                    ? (lang === "ru" ? p.name_ru : lang === "en" ? p.name_en : p.name) || i.name
                    : i.name;
                  return (
                    <span
                      key={i.productId ?? String(idx)}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-secondary"
                    >
                      {pName} x{i.quantity}
                    </span>
                  );
                })}
                {o.items.length > 3 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary">
                    +{o.items.length - 3}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {o.orderType === "delivery" ? tr("delivery") : tr("pickup")}
                </span>
                <span className="text-base font-bold text-primary">{formatUZS(o.totalPrice)}</span>
              </div>
            </div>
          );
        })}
      </main>
      <BottomNav />
    </div>
  );
}
