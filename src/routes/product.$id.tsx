import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { ProductReviews, StarRow } from "@/components/ProductReviews";
import { useReviews } from "@/store/reviewsStore";
import { useCatalog } from "@/store/catalogStore";
import type { ModifierOption, Variant } from "@/lib/types";
import { useCart } from "@/store/cartStore";
import { formatUZS } from "@/lib/format";
import { haptic, notify } from "@/lib/telegram";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const products = useCatalog((s) => s.products);
  const product = products.find((p) => p.id === id && p.active);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);

  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<Variant | undefined>(product?.variants?.[0]);
  const [mods, setMods] = useState<Record<string, ModifierOption[]>>({});
  const [expanded, setExpanded] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const add = useCart((s) => s.add);
  const initialVariant = product?.variants?.[0];

  useEffect(() => {
    setVariant(initialVariant);
  }, [product?.id, initialVariant]);

  const flatMods = useMemo(() => Object.values(mods).flat(), [mods]);
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const base = variant?.price ?? product.price;
    const m = flatMods.reduce((s, o) => s + o.price, 0);
    return (base + m) * qty;
  }, [product, variant, flatMods, qty]);

  if (!product) {
    return (
      <div className="app-shell p-6 text-center">
        <p>{tr("productNotFound")}</p>
        <Link to="/" className="text-primary font-semibold">
          {tr("backToHome")}
        </Link>
      </div>
    );
  }

  const toggleMod = (modId: string, opt: ModifierOption, maxSelect: number, single: boolean) => {
    haptic("light");
    setSelectionError(null);
    setMods((cur) => {
      const list = cur[modId] ?? [];
      const exists = list.find((o) => o.id === opt.id);
      if (exists) return { ...cur, [modId]: list.filter((o) => o.id !== opt.id) };
      if (single) return { ...cur, [modId]: [opt] };
      if (list.length >= maxSelect) return cur;
      return { ...cur, [modId]: [...list, opt] };
    });
  };

  const onAdd = () => {
    const missingRequired = (product.modifiers ?? []).filter(
      (mod) => mod.required && !(mods[mod.id]?.length > 0),
    );

    if (missingRequired.length > 0) {
      const names = missingRequired.map((mod) => mod.name).join(", ");
      setSelectionError(
        lang === "ru"
          ? `Выберите обязательные опции: ${names}`
          : lang === "en"
            ? `Choose required options: ${names}`
            : `Majburiy tanlovlarni belgilang: ${names}`,
      );
      notify("warning");
      return;
    }

    haptic("medium");
    notify("success");
    add(product, { variant, modifiers: flatMods, quantity: qty });
    navigate({ to: "/cart" });
  };

  return (
    <div className="app-shell pb-32">
      <div className="relative">
        <img src={product.image} alt={product.name} className="w-full aspect-[4/3] object-cover" />
        <button
          onClick={() =>
            window.history.length > 1 ? window.history.back() : navigate({ to: "/" })
          }
          aria-label={tr("back")}
          className="absolute top-4 left-4 grid place-items-center w-10 h-10 rounded-full bg-card/95 backdrop-blur shadow-card active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 pt-5 space-y-5">
        <ProductRatingHeader
          productId={product.id}
          fallback={{ rating: product.rating, count: product.reviewsCount }}
        />

        <div>
          <h1 className="text-2xl font-bold leading-tight">
            {(lang === "ru" ? product.name_ru : lang === "en" ? product.name_en : product.name) ||
              product.name}
          </h1>
          <p className={`mt-2 text-sm text-muted-foreground ${expanded ? "" : "line-clamp-2"}`}>
            {(lang === "ru"
              ? product.description_ru
              : lang === "en"
                ? product.description_en
                : product.description) || product.description}
          </p>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 text-sm font-semibold text-primary"
          >
            {expanded ? tr("hide") : tr("showMore")}
          </button>
        </div>

        {product.variants && product.variants.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-semibold">{tr("size")}</h3>
            <div className="grid grid-cols-3 gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    haptic("light");
                    setVariant(v);
                  }}
                  className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                    variant?.id === v.id
                      ? "bg-primary-soft border-primary text-primary"
                      : "bg-card border-border"
                  }`}
                >
                  <div>{v.name}</div>
                  <div className="text-[11px] opacity-70 mt-0.5">{formatUZS(v.price)}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {product.modifiers?.map((mod) => (
          <section key={mod.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{mod.name}</h3>
              <span className="text-[11px] text-muted-foreground">
                {mod.required
                  ? lang === "ru"
                    ? "обязательно"
                    : lang === "en"
                      ? "required"
                      : "majburiy"
                  : lang === "ru"
                    ? "по желанию"
                    : lang === "en"
                      ? "optional"
                      : "ixtiyoriy"}
                {" · "}
                {lang === "ru" ? "макс" : lang === "en" ? "max" : "maks"}: {mod.maxSelect}
              </span>
            </div>
            <div className="space-y-2">
              {mod.options.map((opt) => {
                const selected = (mods[mod.id] ?? []).some((o) => o.id === opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleMod(mod.id, opt, mod.maxSelect, mod.type === "single")}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selected ? "bg-primary-soft border-primary" : "bg-card border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 grid place-items-center ${
                        selected ? "border-primary bg-primary" : "border-border"
                      }`}
                    >
                      {selected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{opt.name}</p>
                      <p className="text-xs text-success font-semibold">
                        {opt.price === 0 ? tr("free") : `+ ${formatUZS(opt.price)}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {selectionError && (
          <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {selectionError}
          </p>
        )}

        <div id="reviews" className="pt-2">
          <ProductReviews
            productId={product.id}
            fallbackRating={product.rating}
            fallbackCount={product.reviewsCount}
          />
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card/95 backdrop-blur-xl border-t border-border p-3 pb-safe shadow-pop">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 bg-secondary rounded-full p-1">
            <button
              onClick={() => {
                haptic("light");
                setQty((q) => Math.max(1, q - 1));
              }}
              className="grid place-items-center w-9 h-9 rounded-full bg-card shadow-card active:scale-90"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center text-sm font-bold">{qty}</span>
            <button
              onClick={() => {
                haptic("light");
                setQty((q) => Math.min(99, q + 1));
              }}
              className="grid place-items-center w-9 h-9 rounded-full bg-card shadow-card active:scale-90"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onAdd}
            disabled={!product.active}
            className="flex-1 grid place-items-center h-11 rounded-full bg-gradient-primary text-primary-foreground text-sm font-bold shadow-soft active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {tr("addToCart")} · {formatUZS(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductRatingHeader({
  productId,
  fallback,
}: {
  productId: string;
  fallback: { rating: number; count: number };
}) {
  const reviews = useReviews((s) => s.reviews);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);

  const stats = useMemo(() => {
    const list = reviews.filter((r) => r.productId === productId);
    if (!list.length)
      return { count: fallback.count, avg: fallback.count === 0 ? 5.0 : fallback.rating };
    return {
      count: list.length,
      avg: list.reduce((sum, r) => sum + r.rating, 0) / list.length,
    };
  }, [reviews, productId, fallback.count, fallback.rating]);
  const scrollToReviews = () => {
    haptic("light");
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-sm">
        <StarRow value={stats.avg} size={14} />
        <span className="font-semibold">{stats.avg.toFixed(1)}</span>
        <span className="text-muted-foreground">
          · {stats.count} {tr("reviews").toLowerCase()}
        </span>
      </div>
      <button
        onClick={scrollToReviews}
        className="text-sm font-semibold text-primary active:scale-95 transition-transform"
      >
        {tr("reviews")} ({stats.count})
      </button>
    </div>
  );
}
