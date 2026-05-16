import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronLeft,
  Package,
  ShoppingBag,
  Tag,
  Settings as SettingsIcon,
  Lock,
  Megaphone,
} from "lucide-react";
import { haptic, getTelegramUser } from "@/lib/telegram";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { PromotionsTab } from "@/components/admin/PromotionsTab";

// UI-only guard. Real security is enforced in bot callbacks (ADMIN_TELEGRAM_IDS env on server).
const ADMIN_IDS: Set<number> = new Set(
  ((import.meta.env.VITE_ADMIN_TELEGRAM_IDS as string | undefined) ?? "")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0),
);

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Tab = "orders" | "products" | "categories" | "promotions" | "settings";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("orders");

  const tgUser = getTelegramUser();
  if (!tgUser) {
    return <AccessDenied message="Admin panel faqat Telegram Mini App ichida ochiladi." />;
  }
  if (!ADMIN_IDS.has(tgUser.id)) {
    return <AccessDenied message="Ruxsat yo'q." />;
  }

  return (
    <div className="app-shell pb-12">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl pt-safe border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link
            to="/profile"
            className="grid place-items-center w-10 h-10 rounded-full bg-card border border-border active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-tight">Admin Panel</h1>
            <p className="text-[11px] text-muted-foreground">Boshqaruv markazi</p>
          </div>
        </div>
        <div className="no-scrollbar overflow-x-auto px-4 pb-2">
          <div className="flex gap-1.5 w-max">
            <TabBtn
              icon={<ShoppingBag className="w-3.5 h-3.5" />}
              label="Buyurtmalar"
              active={tab === "orders"}
              onClick={() => setTab("orders")}
            />
            <TabBtn
              icon={<Package className="w-3.5 h-3.5" />}
              label="Mahsulotlar"
              active={tab === "products"}
              onClick={() => setTab("products")}
            />
            <TabBtn
              icon={<Tag className="w-3.5 h-3.5" />}
              label="Kategoriyalar"
              active={tab === "categories"}
              onClick={() => setTab("categories")}
            />
            <TabBtn
              icon={<Megaphone className="w-3.5 h-3.5" />}
              label="Aksiyalar"
              active={tab === "promotions"}
              onClick={() => setTab("promotions")}
            />
            <TabBtn
              icon={<SettingsIcon className="w-3.5 h-3.5" />}
              label="Sozlamalar"
              active={tab === "settings"}
              onClick={() => setTab("settings")}
            />
          </div>
        </div>
      </header>

      <main className="px-4 pt-3 space-y-4">
        {tab === "orders" && <OrdersTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "promotions" && <PromotionsTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

function TabBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => {
        haptic("light");
        onClick();
      }}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
        active
          ? "bg-gradient-primary text-primary-foreground shadow-soft"
          : "bg-card border border-border"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="app-shell flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid place-items-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
        <Lock className="w-7 h-7" />
      </div>
      <p className="text-sm font-semibold text-muted-foreground">{message}</p>
      <Link
        to="/profile"
        className="px-6 py-2.5 rounded-full bg-card border border-border text-sm font-semibold"
      >
        Orqaga
      </Link>
    </div>
  );
}
