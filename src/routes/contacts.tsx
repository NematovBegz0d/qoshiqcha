import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { haptic } from "@/lib/telegram";
import { useCatalog } from "@/store/catalogStore";
import { getContactIcon, getSocialIcon } from "@/data/businessInfo";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/contacts")({
  component: ContactsPage,
});

function ContactsPage() {
  const navigate = useNavigate();
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);
  const { contacts, socials, workingHours } = useCatalog((s) => s.businessContacts);

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
          <h1 className="text-lg font-bold">{tr("contactsTitle")}</h1>
        </div>
      </header>

      <main className="px-4 pt-2 space-y-4">
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
          {contacts.map((c) => {
            const Icon = getContactIcon(c.href);
            return (
              <a
                key={c.label}
                href={c.href}
                onClick={() => haptic("light")}
                className="flex items-center gap-3 p-4 active:bg-secondary"
              >
                <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary-soft text-primary shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="font-semibold text-sm">{c.value}</p>
                </div>
              </a>
            );
          })}
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 px-1">{tr("socialNetworks")}</p>
          <div className="grid grid-cols-3 gap-2">
            {socials.map((s) => {
              const Icon = getSocialIcon(s.label);
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => haptic("light")}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border active:scale-95"
                >
                  <div className={`grid place-items-center w-11 h-11 rounded-2xl text-white ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">{s.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
          <h3 className="font-bold">{tr("workingTime")}</h3>
          <p className="text-sm opacity-90 mt-1">{workingHours}</p>
        </div>
      </main>
    </div>
  );
}
