import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, MapPin, Phone, Clock, Navigation } from "lucide-react";
import { haptic } from "@/lib/telegram";
import { useCatalog } from "@/store/catalogStore";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/branches")({
  component: BranchesPage,
});

function BranchesPage() {
  const navigate = useNavigate();
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);
  const branches = useCatalog((s) => s.branches);

  return (
    <div className="app-shell pb-12">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl pt-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/profile" })}
            aria-label={tr("back")}
            className="grid place-items-center w-10 h-10 rounded-full bg-card border border-border active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">{tr("branchesTitle")}</h1>
        </div>
      </header>

      <main className="px-4 pt-2 space-y-3">
        {branches.map((b) => (
          <div key={b.id} className="p-4 rounded-2xl bg-card border border-border shadow-soft">
            <div className="flex items-start gap-3">
              <div className="grid place-items-center w-11 h-11 rounded-2xl bg-primary-soft text-primary shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold">{b.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{b.address}</p>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{b.hours}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <a href={`tel:${b.phone}`} className="text-foreground">
                      {b.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <a
                href={`tel:${b.phone}`}
                onClick={() => haptic("light")}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-secondary text-foreground text-sm font-semibold active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" /> {tr("callPhone")}
              </a>
              <a
                href={`https://yandex.uz/maps/?pt=${b.lng},${b.lat}&z=16&l=map`}
                target="_blank"
                rel="noreferrer"
                onClick={() => haptic("light")}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold active:scale-[0.98]"
              >
                <Navigation className="w-4 h-4" /> {tr("getDirections")}
              </a>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
