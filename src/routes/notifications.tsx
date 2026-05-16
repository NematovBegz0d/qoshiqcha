import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  Bell,
  Truck,
  CheckCircle2,
  XCircle,
  ChefHat,
  Package,
  RefreshCw,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useNotifications } from "@/hooks/useNotifications";
import { useSettings } from "@/store/settingsStore";
import { useT, type Lang } from "@/lib/i18n";
import type { NotifItem } from "@/lib/types";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function getIcon(status: string | null) {
  switch (status) {
    case "accepted":
      return Package;
    case "preparing":
      return ChefHat;
    case "delivering":
      return Truck;
    case "completed":
      return CheckCircle2;
    case "cancelled":
      return XCircle;
    default:
      return Bell;
  }
}

function getTone(status: string | null): "primary" | "success" | "warning" | "destructive" {
  switch (status) {
    case "accepted":
    case "preparing":
      return "primary";
    case "delivering":
      return "warning";
    case "completed":
      return "success";
    case "cancelled":
      return "destructive";
    default:
      return "primary";
  }
}

const toneClasses: Record<string, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

function timeAgo(ts: number, tr: (key: Parameters<ReturnType<typeof useT>>[0]) => string): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return tr("justNow");
  if (mins < 60) return `${mins} ${tr("minutesAgo")}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${tr("hoursAgo")}`;
  return `${Math.floor(hours / 24)} ${tr("daysAgo")}`;
}

function NotificationsPage() {
  const navigate = useNavigate();
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);
  const { items, loading, error, markRead, refresh } = useNotifications();

  return (
    <div className="app-shell pb-10">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl pt-safe">
        <div className="flex items-center gap-2 px-3 pt-3 pb-3">
          <button
            onClick={() => navigate({ to: "/" })}
            aria-label={tr("back")}
            className="grid place-items-center w-10 h-10 rounded-full bg-card border border-border active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-lg font-bold">{tr("notifications")}</h1>
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="grid place-items-center w-9 h-9 rounded-full bg-card border border-border active:scale-95 transition-transform disabled:opacity-50"
            aria-label={tr("retry")}
          >
            <RefreshCw
              className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      <main className="px-4 pt-2 space-y-2">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-2xl bg-card border border-border animate-pulse"
              >
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-2.5 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-10 space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-soft active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              {tr("retry")}
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState title={tr("noNotifications")} description={tr("notificationsDesc")} />
        )}

        {!loading &&
          !error &&
          items.map((n: NotifItem) => {
            const Icon = getIcon(n.status);
            const tone = getTone(n.status);
            return (
              <article
                key={n.id}
                onClick={() => {
                  if (!n.read) markRead(n.id);
                }}
                className={`flex gap-3 p-3 rounded-2xl border transition-colors ${
                  n.read
                    ? "bg-card border-border"
                    : "bg-card border-primary/20 cursor-pointer active:bg-secondary"
                }`}
              >
                <div
                  className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${toneClasses[tone]}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    {timeAgo(n.createdAt, tr)}
                  </p>
                </div>
              </article>
            );
          })}
      </main>
    </div>
  );
}
