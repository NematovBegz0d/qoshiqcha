import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatUZS } from "@/lib/format";
import { useCart } from "@/store/cartStore";
import { haptic } from "@/lib/telegram";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);
  const hasOptions = (product.variants?.length ?? 0) > 0 || (product.modifiers?.length ?? 0) > 0;

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.active) return;
    haptic("medium");
    if (hasOptions) {
      navigate({ to: "/product/$id", params: { id: product.id } });
      return;
    }
    add(product);
  };

  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group relative flex flex-col rounded-2xl bg-card shadow-card overflow-hidden border border-border/60 active:scale-[0.98] transition-transform"
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {!product.active && (
          <div className="absolute inset-0 bg-background/70 grid place-items-center">
            <span className="px-3 py-1 rounded-full bg-card text-xs font-medium text-muted-foreground">
              {tr("soldOut")}
            </span>
          </div>
        )}
        {product.oldPrice && product.active && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
            -{Math.round((1 - product.price / product.oldPrice) * 100)}%
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
          {product.reviewsCount === 0 ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-2.5 h-2.5 fill-warning text-warning" />
              ))}
              <span className="ml-0.5">5.0</span>
            </>
          ) : (
            <>
              <Star className="w-3 h-3 fill-warning text-warning" />
              <span className="ml-0.5">
                {product.rating.toFixed(1)} · {product.reviewsCount}
              </span>
            </>
          )}
        </div>
        <h3 className="text-sm font-semibold leading-tight line-clamp-2">
          {(lang === "ru" ? product.name_ru : lang === "en" ? product.name_en : product.name) ||
            product.name}
        </h3>
        {product.weight && <p className="text-[11px] text-muted-foreground">{product.weight}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-primary"> {formatUZS(product.price)} </span>
            {product.oldPrice && (
              <span className="text-[11px] text-muted-foreground line-through">
                {formatUZS(product.oldPrice)}
              </span>
            )}
          </div>
          <button
            onClick={onAdd}
            disabled={!product.active}
            aria-label={tr("addToCart")}
            className="grid place-items-center w-9 h-9 rounded-full bg-gradient-primary text-primary-foreground shadow-soft active:scale-90 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </Link>
  );
}
