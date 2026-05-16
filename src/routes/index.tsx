import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Clock,
  MapPin,
  Bike,
  ShoppingBag,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { CategoryScroll } from "@/components/CategoryScroll";
import { PickupSheet } from "@/components/PickupSheet";
import { DeliveryMapSheet } from "@/components/DeliveryMapSheet";
import { EmptyState } from "@/components/EmptyState";
import { useCatalog } from "@/store/catalogStore";
import { usePromotions } from "@/store/promotionsStore";
import { branches } from "@/data/branches";
import { formatUZS, isPromoExpired } from "@/lib/format";
import { useSettings } from "@/store/settingsStore";
import { useUser } from "@/store/userStore";
import { haptic } from "@/lib/telegram";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function CatalogSkeleton() {
  return (
    <div className="px-4 pt-3 space-y-6 pb-4 animate-pulse">
      {/* Category chips */}
      <div className="flex gap-2 overflow-hidden">
        {[80, 100, 70, 90, 60].map((w, i) => (
          <div key={i} className="h-8 rounded-full bg-muted shrink-0" style={{ width: w }} />
        ))}
      </div>
      {/* Product grid */}
      {[0, 1].map((section) => (
        <div key={section} className="space-y-3">
          <div className="h-5 w-32 rounded-lg bg-muted" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="h-36 bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                  <div className="h-8 w-full rounded-xl bg-muted mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HomePage() {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const allProducts = useCatalog((s) => s.products);
  const allCategories = useCatalog((s) => s.categories);
  const catalogLoading = useCatalog((s) => s.catalogLoading);
  const catalogError = useCatalog((s) => s.catalogError);
  const loadFromFirestore = useCatalog((s) => s.loadFromFirestore);
  const settings = useCatalog((s) => s.shopSettings);
  const mode = useSettings((s) => s.mode);
  const setMode = useSettings((s) => s.setMode);
  const pickupBranchId = useSettings((s) => s.pickupBranchId);
  const pickupTime = useSettings((s) => s.pickupTime);
  const addresses = useUser((s) => s.addresses);
  const defaultAddressId = useUser((s) => s.defaultAddressId);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);
  const allPromos = usePromotions((s) => s.promotions);

  const products = useMemo(() => allProducts.filter((p) => p.active), [allProducts]);
  const categories = useMemo(() => allCategories.filter((c) => c.active), [allCategories]);
  const activePromos = useMemo(
    () => allPromos.filter((p) => p.active && !isPromoExpired(p.expiresAt)),
    [allPromos],
  );

  const [pickupOpen, setPickupOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [scrollCat, setScrollCat] = useState<string | null>(null);
  const catBarRef = useRef<HTMLDivElement>(null);

  // Scroll-spy: faqat barcha kategoriyalar ko'rinib turganda (activeCat === null) ishlaydi
  useEffect(() => {
    if (activeCat !== null) {
      setScrollCat(null);
      return;
    }

    const findActive = () => {
      const barBottom = catBarRef.current?.getBoundingClientRect().bottom ?? 140;
      let active: string | null = null;
      document.querySelectorAll<HTMLElement>("[data-cat-section]").forEach((el) => {
        if (el.getBoundingClientRect().top <= barBottom + 16) {
          active = el.dataset.catSection ?? null;
        }
      });
      setScrollCat(active);
    };

    findActive();
    window.addEventListener("scroll", findActive, { passive: true });
    return () => window.removeEventListener("scroll", findActive);
  }, [activeCat]);

  const visible = useMemo(
    () => (activeCat ? products.filter((p) => p.categoryId === activeCat) : products),
    [activeCat, products],
  );

  const grouped = useMemo(() => {
    if (activeCat) return [{ cat: categories.find((c) => c.id === activeCat)!, items: visible }];
    return categories
      .map((cat) => ({ cat, items: products.filter((p) => p.categoryId === cat.id) }))
      .filter((g) => g.items.length > 0);
  }, [activeCat, visible, categories, products]);

  const defaultAddress = addresses.find((a) => a.id === defaultAddressId) ?? addresses[0];
  const pickupBranch = branches.find((b) => b.id === pickupBranchId);

  const handleSelectMode = (v: "delivery" | "pickup") => {
    haptic("light");
    setMode(v);
    if (v === "delivery") {
      if (!defaultAddress) setMapOpen(true);
    } else if (!pickupBranch || !pickupTime) {
      setPickupOpen(true);
    }
  };

  return (
    <div className="app-shell pb-28">
      <Header />

      <main>
        {/* Top section: hero + toggle + address + hours */}
        <div className="px-4 pt-2 space-y-4">
          {/* Hero banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary text-primary-foreground shadow-soft min-h-[140px]">
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/10" />
            <div className="absolute top-2 right-16 w-10 h-10 rounded-full bg-white/10" />
            <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-[72px] leading-none select-none opacity-90 drop-shadow-lg">
              🍕
            </span>
            <span className="absolute right-14 bottom-1 text-[36px] leading-none select-none opacity-60">
              🍔
            </span>
            <div className="relative px-5 pt-5 pb-5 max-w-[65%]">
              <p className="text-[11px] font-semibold opacity-75 tracking-widest uppercase mb-1">
                {tr("fastDelivery")}
              </p>
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
                Qoshiqcha 🥄
                <br />
                <span className="text-white/90 text-lg font-bold">fast food</span>
              </h2>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
                <span className="text-base leading-none">🛵</span>
                <p className="text-[11px] font-semibold leading-tight">
                  {formatUZS(settings.freeDeliveryFrom)} {tr("freeDeliveryFrom")} <br />
                  <span className="text-white font-extrabold">{tr("freeDelivery")}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Delivery / pickup toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-secondary">
            {[
              { v: "delivery" as const, label: tr("delivery"), icon: Bike },
              { v: "pickup" as const, label: tr("pickup"), icon: ShoppingBag },
            ].map(({ v, label, icon: Icon }) => (
              <button
                key={v}
                onClick={() => handleSelectMode(v)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === v ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Mode info card */}
          {mode === "delivery" ? (
            <button
              onClick={() => {
                haptic("light");
                setMapOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-soft border border-border shadow-card active:scale-[0.99] transition-transform text-left"
            >
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary-soft text-primary shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">{tr("deliveryAddress")}</p>
                <p className="text-sm font-semibold truncate">
                  {defaultAddress?.fullAddress ?? tr("selectOnMap")}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => {
                haptic("light");
                setPickupOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-soft border border-border shadow-card active:scale-[0.99] transition-transform text-left"
            >
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary-soft text-primary shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">{tr("pickup")}</p>
                <p className="text-sm font-semibold truncate">
                  {pickupBranch && pickupTime
                    ? `${pickupBranch.name} • ${pickupTime}`
                    : tr("selectBranchTime")}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          )}

          {/* Working hours */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              settings.shopIsOpen
                ? "bg-success/10 border-success/20"
                : "bg-destructive/10 border-destructive/20"
            }`}
          >
            <Clock
              className={`w-4 h-4 ${settings.shopIsOpen ? "text-success" : "text-destructive"}`}
            />
            <p className="text-xs text-foreground">
              {settings.shopIsOpen ? tr("openNow") : tr("closedNow")} &middot;{" "}
              {settings.workingHours.from} &ndash; {settings.workingHours.to}
            </p>
          </div>
        </div>

        {/* Promotions strip */}
        {activePromos.length > 0 && (
          <div className="no-scrollbar overflow-x-auto pt-3 -mb-1">
            <div className="flex gap-3 px-4 w-max pb-1">
              {activePromos.map((p) => {
                const ptitle =
                  lang === "ru"
                    ? (p.title_ru ?? p.title)
                    : lang === "en"
                      ? (p.title_en ?? p.title)
                      : p.title;
                return (
                  <Link
                    key={p.id}
                    to="/promotions"
                    className={`flex-none w-48 rounded-2xl bg-gradient-to-br ${p.color} text-white p-4 shadow-soft active:scale-[0.97] transition-transform`}
                  >
                    <p className="text-2xl font-extrabold leading-none">{p.badge}</p>
                    <p className="text-xs font-semibold mt-1.5 line-clamp-2 opacity-90">{ptitle}</p>
                    <p className="text-[10px] opacity-70 mt-1">{p.expiresAt}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Sticky category bar — top: header base (60px) + address row (26px) when shown */}
        <div
          ref={catBarRef}
          className="sticky z-20 bg-background/95 backdrop-blur-md py-2 border-b border-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-1"
          style={{ top: defaultAddress ? 86 : 60 }}
        >
          <CategoryScroll
            categories={categories}
            active={activeCat ?? scrollCat}
            onChange={setActiveCat}
          />
        </div>

        {/* Products */}
        {catalogLoading && products.length === 0 ? (
          <CatalogSkeleton />
        ) : catalogError ? (
          <EmptyState
            icon={<AlertCircle className="w-8 h-8" />}
            title={tr("catalogError")}
            description={catalogError}
            action={
              <button
                onClick={() => void loadFromFirestore()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-soft active:scale-95 transition-transform"
              >
                <RefreshCw className="w-4 h-4" />
                {tr("retry")}
              </button>
            }
          />
        ) : products.length === 0 ? (
          <EmptyState title={tr("catalogEmpty")} description={tr("catalogEmptyDesc")} />
        ) : (
          <div className="px-4 pt-3 space-y-4 pb-4">
            {grouped.map(({ cat, items }) => (
              <section key={cat.id} data-cat-section={cat.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    {cat.icon} {cat.name}
                  </h2>
                  <button
                    onClick={() => setActiveCat(cat.id)}
                    className="text-xs font-semibold text-primary"
                  >
                    {tr("seeAll")}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      <PickupSheet open={pickupOpen} onOpenChange={setPickupOpen} />
      <DeliveryMapSheet open={mapOpen} onOpenChange={setMapOpen} />
    </div>
  );
}
