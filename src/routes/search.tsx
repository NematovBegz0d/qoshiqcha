import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Search as SearchIcon, X } from "lucide-react";
import { useCatalog } from "@/store/catalogStore";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate();
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);
  const allProducts = useCatalog((s) => s.products);
  const allCategories = useCatalog((s) => s.categories);
  const [q, setQ] = useState("");

  const activeProducts = useMemo(() => allProducts.filter((p) => p.active), [allProducts]);
  const activeCategories = useMemo(() => allCategories.filter((c) => c.active), [allCategories]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return activeProducts.filter((p) => {
      return (
        p.name.toLowerCase().includes(t) ||
        (p.name_ru?.toLowerCase().includes(t) ?? false) ||
        (p.name_en?.toLowerCase().includes(t) ?? false) ||
        (p.description?.toLowerCase().includes(t) ?? false) ||
        (p.description_ru?.toLowerCase().includes(t) ?? false) ||
        (p.description_en?.toLowerCase().includes(t) ?? false)
      );
    });
  }, [q, activeProducts]);

  const noResultsDesc =
    lang === "ru"
      ? `По запросу «${q}» ничего нет`
      : lang === "en"
        ? `No results for "${q}"`
        : `"${q}" bo'yicha natija yo'q`;

  const resultsLabel =
    lang === "ru"
      ? `${results.length} результатов`
      : lang === "en"
        ? `${results.length} results`
        : `${results.length} ta natija`;

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
          <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-full bg-card border border-border">
            <SearchIcon className="w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tr("searchPlaceholder")}
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label={tr("cancel")}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 pt-2 space-y-4">
        {!q.trim() ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              {tr("categories")}
            </p>
            <div className="flex flex-wrap gap-2">
              {activeCategories.map((c) => {
                const name =
                  lang === "ru"
                    ? (c.name_ru ?? c.name)
                    : lang === "en"
                      ? (c.name_en ?? c.name)
                      : c.name;
                return (
                  <button
                    key={c.id}
                    onClick={() => setQ(c.name)}
                    className="px-3 py-1.5 rounded-full bg-card border border-border text-sm font-medium active:scale-95 transition-transform"
                  >
                    {c.icon} {name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : results.length === 0 ? (
          <EmptyState title={tr("notFound")} description={noResultsDesc} />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{resultsLabel}</p>
            <div className="grid grid-cols-2 gap-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
