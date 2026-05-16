import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Check } from "lucide-react";
import { useSettings, langLabels, type Lang } from "@/store/settingsStore";
import { haptic, notify } from "@/lib/telegram";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/language")({
  component: LanguagePage,
});

const options: { code: Lang; flag: string }[] = [
  { code: "uz", flag: "🇺🇿" },
  { code: "ru", flag: "🇷🇺" },
  { code: "en", flag: "🇬🇧" },
];

function LanguagePage() {
  const navigate = useNavigate();
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const tr = useT(lang);

  const choose = (l: Lang) => {
    setLang(l);
    haptic("medium");
    notify("success");
    setTimeout(() => navigate({ to: "/profile" }), 200);
  };

  return (
    <div className="app-shell pb-12">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl pt-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/profile" })}
            className="grid place-items-center w-10 h-10 rounded-full bg-card border border-border active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">{tr("language")}</h1>
        </div>
      </header>

      <main className="px-4 pt-2">
        <p className="text-sm text-muted-foreground px-1 mb-3">{tr("chooseLanguage")}</p>
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
          {options.map((o) => {
            const active = lang === o.code;
            return (
              <button
                key={o.code}
                onClick={() => choose(o.code)}
                className="w-full flex items-center gap-3 p-4 active:bg-secondary text-left"
              >
                <span className="text-2xl">{o.flag}</span>
                <span className="flex-1 font-medium text-sm">{langLabels[o.code]}</span>
                {active && (
                  <div className="grid place-items-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
