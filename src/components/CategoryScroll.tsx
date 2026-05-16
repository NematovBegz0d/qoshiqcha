import type { Category } from "@/lib/types";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

export function CategoryScroll({
  categories,
  active,
  onChange,
}: {
  categories: Category[];
  active: string | null;
  onChange: (id: string | null) => void;
}) {
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);

  return (
    <div className="no-scrollbar overflow-x-auto">
      <div className="flex gap-2 w-max px-4 pb-1">
        <button
          onClick={() => onChange(null)}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            active === null
              ? "bg-gradient-primary text-primary-foreground shadow-soft"
              : "bg-card border border-border text-foreground"
          }`}
        >
          {tr("seeAll")}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              active === c.id
                ? "bg-gradient-primary text-primary-foreground shadow-soft"
                : "bg-card border border-border text-foreground"
            }`}
          >
            <span>{c.icon}</span>
            {(lang === "ru" ? c.name_ru : lang === "en" ? c.name_en : c.name) || c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
