import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useUser } from "@/store/userStore";
import { formatUZS } from "@/lib/format";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";
import { getTelegramUser } from "@/lib/telegram";
import { useMyOrders } from "@/hooks/useMyOrders";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/order-success")({
  validateSearch: search,
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = Route.useSearch();
  const localOrder = useUser((s) => s.orders.find((o) => o.id === id));
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);
  const tgUser = getTelegramUser();
  const shouldLoadRemoteOrder = Boolean(id && !localOrder);
  const {
    orders: remoteOrders,
    loading,
    error,
  } = useMyOrders(shouldLoadRemoteOrder ? tgUser?.id : undefined);
  const order = localOrder ?? remoteOrders.find((remoteOrder) => remoteOrder.id === id);

  return (
    <div className="app-shell flex flex-col items-center px-6 py-10 text-center pt-safe">
      <div className="grid place-items-center w-24 h-24 rounded-full bg-success/15 text-success animate-pop-in">
        <CheckCircle2 className="w-14 h-14" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">{tr("orderSuccess")}</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">{tr("orderSuccessDesc")}</p>

      {order && (
        <div className="mt-6 w-full p-4 rounded-2xl bg-card border border-border shadow-card text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{tr("orderNumber")}</span>
            <span className="font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{tr("products")}</span>
            <span>
              {order.items.reduce((n, i) => n + i.quantity, 0)}{" "}
              {lang === "ru" ? "шт." : lang === "en" ? "pcs." : "dona"}
            </span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {order.orderType === "pickup" ? tr("pickup") : tr("delivery")}
            </span>
            <span className="text-right">
              {order.orderType === "pickup"
                ? `${order.pickup?.branchName ?? tr("pickupBranch")} ${order.pickup?.pickupTime ?? ""}`.trim()
                : (order.address?.title ?? order.address?.fullAddress ?? tr("addressLabel"))}
            </span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-border font-bold">
            <span>{tr("total")}</span>
            <span className="text-primary">{formatUZS(order.totalPrice)}</span>
          </div>
        </div>
      )}

      {!order && id && loading && (
        <div className="mt-6 w-full p-4 rounded-2xl bg-card border border-border shadow-card text-left">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{tr("loading")}</span>
          </div>
        </div>
      )}

      {!order && id && !loading && error && (
        <div className="mt-6 w-full p-4 rounded-2xl bg-card border border-border shadow-card text-left space-y-2">
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono text-xs break-all text-right">{id}</span>
          </div>
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {!order && id && !loading && !error && (
        <div className="mt-6 w-full p-4 rounded-2xl bg-card border border-border shadow-card text-left space-y-2">
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono text-xs break-all text-right">{id}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {lang === "ru"
              ? "Заказ отправлен на сервер."
              : lang === "en"
                ? "Order sent to server."
                : "Buyurtma serverga yuborilgan."}
          </p>
        </div>
      )}

      <div className="mt-8 w-full grid grid-cols-2 gap-3">
        <Link
          to="/orders"
          className="h-12 grid place-items-center rounded-full bg-card border border-border font-semibold text-sm active:scale-[0.98]"
        >
          {tr("myOrders")}
        </Link>
        <Link
          to="/"
          className="h-12 grid place-items-center rounded-full bg-gradient-primary text-primary-foreground font-bold text-sm shadow-soft active:scale-[0.98]"
        >
          {tr("backToHome")}
        </Link>
      </div>
    </div>
  );
}
