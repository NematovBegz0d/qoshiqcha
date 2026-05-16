import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Clock, Gift } from "lucide-react";
import { usePromotions } from "@/store/promotionsStore";
import { useSettings } from "@/store/settingsStore";
import { isPromoExpired } from "@/lib/format";

export const Route = createFileRoute("/promotions")({
  component: PromotionsPage,
});

function PromotionsPage() {
  const { promotions, loading } = usePromotions();
  const lang = useSettings((s) => s.lang);

  const active = promotions.filter((p) => p.active && !isPromoExpired(p.expiresAt));

  const title = (p: (typeof promotions)[0]) =>
    lang === "ru" ? (p.title_ru ?? p.title) : lang === "en" ? (p.title_en ?? p.title) : p.title;
  const desc = (p: (typeof promotions)[0]) =>
    lang === "ru"
      ? (p.description_ru ?? p.description)
      : lang === "en"
        ? (p.description_en ?? p.description)
        : p.description;

  return (
    <div className="app-shell pb-12">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl pt-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link
            to="/profile"
            className="grid place-items-center w-10 h-10 rounded-full bg-card border border-border active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">
            {lang === "ru" ? "Акции" : lang === "en" ? "Promotions" : "Aksiyalar"}
          </h1>
        </div>
      </header>

      <main className="px-4 pt-2 space-y-3">
        {loading && (
          <p className="text-center py-10 text-sm text-muted-foreground">Yuklanmoqda...</p>
        )}

        {!loading && active.length === 0 && (
          <div className="text-center py-16">
            <Gift className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">
              {lang === "ru"
                ? "Активных акций нет"
                : lang === "en"
                  ? "No active promotions"
                  : "Faol aksiyalar yo'q"}
            </p>
          </div>
        )}

        {active.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl overflow-hidden border border-border bg-card shadow-soft"
          >
            {p.image ? (
              <img src={p.image} alt={title(p)} className="w-full h-36 object-cover" />
            ) : (
              <div
                className={`bg-gradient-to-br ${p.color} text-white p-5 flex items-center gap-4`}
              >
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm shrink-0">
                  <span className="text-3xl font-extrabold leading-none">{p.badge}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold opacity-80 uppercase tracking-wide">
                    {lang === "ru" ? "СКИДКА" : lang === "en" ? "DISCOUNT" : "CHEGIRMA"}
                  </p>
                  <p className="text-lg font-bold leading-tight mt-0.5">{title(p)}</p>
                </div>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-bold text-base">{title(p)}</h3>
              {desc(p) && <p className="text-sm text-muted-foreground mt-1">{desc(p)}</p>}
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {lang === "ru"
                    ? "Действует до:"
                    : lang === "en"
                      ? "Valid until:"
                      : "Amal qiladi:"}{" "}
                  {p.expiresAt}
                </span>
              </div>
            </div>
          </div>
        ))}

        <Link
          to="/"
          className="block text-center w-full h-12 leading-[3rem] rounded-full bg-gradient-primary text-primary-foreground font-bold shadow-soft active:scale-[0.98] mt-4"
        >
          {lang === "ru" ? "Заказать" : lang === "en" ? "Order now" : "Buyurtma berish"}
        </Link>
      </main>
    </div>
  );
}
