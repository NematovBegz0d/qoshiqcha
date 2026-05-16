import { Bell, Search, Sparkles } from "lucide-react";
import { useUser } from "@/store/userStore";
import { getTelegramUser } from "@/lib/telegram";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";
import { useNotifStore } from "@/store/notifStore";

export function Header() {
  const addresses = useUser((s) => s.addresses);
  const defaultAddressId = useUser((s) => s.defaultAddressId);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);
  const guestName = lang === "ru" ? "Гость" : lang === "en" ? "Guest" : "Mehmon";
  const [name, setName] = useState<string>(guestName);
  const navigate = useNavigate();

  useEffect(() => {
    const u = getTelegramUser();
    if (u?.first_name) setName(u.first_name);
  }, []);

  const unreadCount = useNotifStore((s) => s.unreadCount);
  const def = addresses.find((a) => a.id === defaultAddressId) ?? addresses[0];

  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl pt-safe">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-primary shadow-soft">
            <Sparkles className="w-5 h-5 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {lang === "ru" ? "Привет" : lang === "en" ? "Hello" : "Salom"} 👋
            </p>
            <p className="text-sm font-semibold leading-tight">{name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate({ to: "/search" })}
            className="grid place-items-center w-10 h-10 rounded-full bg-card border border-border active:scale-95 transition-transform"
          >
            <Search className="w-[18px] h-[18px] text-foreground" />
          </button>
          <button
            onClick={() => navigate({ to: "/notifications" })}
            className="relative grid place-items-center w-10 h-10 rounded-full bg-card border border-border active:scale-95 transition-transform"
          >
            <Bell className="w-[18px] h-[18px] text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </div>
      {def && (
        <div className="px-4 pb-2 text-[12px] text-muted-foreground">
          <span className="text-foreground font-medium">{tr("delivery")}:</span> {def.fullAddress}
        </div>
      )}
    </header>
  );
}
