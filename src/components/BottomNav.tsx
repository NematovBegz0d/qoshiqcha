import { Link, useLocation } from "@tanstack/react-router";
import { Home, ShoppingBag, ListOrdered, User } from "lucide-react";
import { useCart } from "@/store/cartStore";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

export function BottomNav() {
  const loc = useLocation();
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);

  const tabs = [
    { to: "/", label: tr("home"), icon: Home },
    { to: "/cart", label: tr("cart"), icon: ShoppingBag },
    { to: "/orders", label: tr("orders"), icon: ListOrdered },
    { to: "/profile", label: tr("profile"), icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-card/98 backdrop-blur-2xl border-t border-border/40 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.07)]">
      <div className="grid grid-cols-4 gap-0.5 px-2 pt-1.5 pb-1">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to;
          const isCart = to === "/cart";
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 active:scale-90 transition-transform duration-150"
            >
              <div
                className={`relative flex items-center justify-center w-13 h-10 rounded-2xl transition-all duration-300 ${
                  active
                    ? "bg-gradient-primary shadow-[0_4px_14px_rgba(219,39,119,0.35)] scale-105"
                    : "scale-100"
                }`}
              >
                <Icon
                  className={`w-[22px] h-[22px] transition-all duration-300 ${
                    active ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {isCart && count > 0 && (
                  <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[9px] font-extrabold leading-none animate-pop-in ring-2 ring-card">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] leading-none transition-all duration-200 ${
                  active ? "text-primary font-bold" : "text-muted-foreground font-medium"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
