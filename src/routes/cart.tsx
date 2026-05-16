import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2, Minus, Plus, ShoppingBag, ChevronLeft } from "lucide-react";
import { useCart, itemSubtotal } from "@/store/cartStore";
import { formatUZS } from "@/lib/format";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { useCatalog } from "@/store/catalogStore";
import { ProductCard } from "@/components/ProductCard";
import { haptic } from "@/lib/telegram";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const setComment = useCart((s) => s.setComment);
  const itemsTotal = useCart((s) => s.itemsTotal());
  const navigate = useNavigate();
  const products = useCatalog((s) => s.products);
  const settings = useCatalog((s) => s.shopSettings);
  const mode = useSettings((s) => s.mode);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);

  const deliveryPrice =
    mode === "pickup" ? 0 : itemsTotal >= settings.freeDeliveryFrom ? 0 : settings.deliveryPrice;
  const total = itemsTotal + deliveryPrice;
  const recommended = products.filter((p) => p.popular).slice(0, 4);

  if (items.length === 0) {
    return (
      <div className="app-shell pb-28 pt-safe">
        <EmptyState
          icon={<ShoppingBag className="w-9 h-9" />}
          title={tr("cartEmpty")}
          description={tr("cartEmptyDesc")}
          action={
            <Link
              to="/"
              className="mt-2 inline-flex items-center rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              {tr("goToMenu")}
            </Link>
          }
        />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-shell pb-40">
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl pt-safe">
        <div className="px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate({ to: "/" })}
            aria-label="Orqaga"
            className="grid place-items-center w-9 h-9 rounded-full bg-card border border-border active:scale-95 transition-transform shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-lg font-bold">{tr("myCart")}</h1>
          <button
            onClick={() => {
              if (!confirm(tr("clearCartConfirm"))) return;
              haptic("medium");
              useCart.getState().clear();
            }}
            className="text-xs text-destructive font-semibold px-3 py-1.5 rounded-full bg-destructive/10 active:scale-95 transition-transform"
          >
            {tr("clearCart")}
          </button>
        </div>
      </div>

      <main className="px-4 pt-1 space-y-3">
        {items.map((i) => {
          const p = products.find((p) => p.id === i.productId);
          const pName = p
            ? (lang === "ru" ? p.name_ru : lang === "en" ? p.name_en : p.name) || i.name
            : i.name;
          return (
            <div
              key={i.uid}
              className="flex gap-3 p-3 rounded-2xl bg-card border border-border shadow-card animate-slide-up"
            >
              <img src={i.image} alt={pName} className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{pName}</h3>
                    {i.selectedVariant && (
                      <p className="text-[11px] text-muted-foreground">{i.selectedVariant.name}</p>
                    )}
                    {i.selectedModifiers.length > 0 && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {i.selectedModifiers.map((m) => m.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      haptic("light");
                      remove(i.uid);
                    }}
                    className="text-muted-foreground active:text-destructive"
                    aria-label="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">
                    {formatUZS(itemSubtotal(i))}
                  </span>
                  <div className="flex items-center gap-2 bg-secondary rounded-full p-0.5">
                    <button
                      onClick={() => {
                        haptic("light");
                        setQuantity(i.uid, i.quantity - 1);
                      }}
                      className="grid place-items-center w-7 h-7 rounded-full bg-card shadow-card active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold">{i.quantity}</span>
                    <button
                      onClick={() => {
                        haptic("light");
                        setQuantity(i.uid, i.quantity + 1);
                      }}
                      className="grid place-items-center w-7 h-7 rounded-full bg-card shadow-card active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder={
                    lang === "ru"
                      ? "Оставьте комментарий"
                      : lang === "en"
                        ? "Leave a comment"
                        : "Fikr qoldiring"
                  }
                  value={i.comment ?? ""}
                  onChange={(e) => setComment(i.uid, e.target.value)}
                  className="mt-2 w-full text-xs px-3 py-1.5 rounded-lg bg-secondary border border-transparent focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          );
        })}

        {recommended.length > 0 && (
          <section className="pt-4 pb-4 space-y-3">
            <h2 className="text-base font-bold">{tr("addMore")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {recommended.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card/95 backdrop-blur-xl border-t border-border px-4 pt-4 pb-2.5 shadow-pop space-y-3"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{tr("products")}</span>
            <span>{formatUZS(itemsTotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{mode === "pickup" ? tr("pickup") : tr("deliveryFee")}</span>
            <span>{deliveryPrice === 0 ? tr("free") : formatUZS(deliveryPrice)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
            <span>{tr("total")}</span>
            <span className="text-primary">{formatUZS(total)}</span>
          </div>
        </div>
        <button
          onClick={() => {
            haptic("medium");
            navigate({ to: "/checkout" });
          }}
          className="w-full h-14 rounded-full bg-gradient-primary text-primary-foreground font-bold shadow-soft active:scale-[0.98] transition-transform"
        >
          {tr("placeOrder")}
        </button>
      </div>
    </div>
  );
}
