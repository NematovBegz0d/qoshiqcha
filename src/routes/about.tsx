import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { aboutStats, aboutTexts } from "@/data/businessInfo";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const navigate = useNavigate();
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
          <h1 className="text-lg font-bold">Biz haqimizda</h1>
        </div>
      </header>

      <main className="px-4 pt-2 space-y-4">
        <div className="rounded-2xl bg-gradient-primary text-primary-foreground p-6 shadow-soft">
          <h2 className="text-2xl font-extrabold">{aboutTexts.name}</h2>
          <p className="text-sm opacity-90 mt-2 leading-relaxed">{aboutTexts.tagline}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {aboutStats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="p-4 rounded-2xl bg-card border border-border text-center"
              >
                <div className="grid place-items-center w-10 h-10 mx-auto rounded-xl bg-primary-soft text-primary mb-2">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xl font-extrabold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-3 text-sm leading-relaxed">
          <div>
            <h3 className="font-bold text-base">Bizning missiya</h3>
            <p className="text-muted-foreground mt-1">{aboutTexts.mission}</p>
          </div>
          <div>
            <h3 className="font-bold text-base">Sifat kafolati</h3>
            <p className="text-muted-foreground mt-1">{aboutTexts.quality}</p>
          </div>
          <div>
            <h3 className="font-bold text-base">Tez yetkazish</h3>
            <p className="text-muted-foreground mt-1">{aboutTexts.delivery}</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground py-4">
          Versiya {aboutTexts.version} · © {aboutTexts.year} {aboutTexts.name}
        </p>
      </main>
    </div>
  );
}
