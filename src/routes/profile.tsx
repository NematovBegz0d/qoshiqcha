import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Info,
  Tag,
  Building2,
  Phone,
  Globe,
  MapPin,
  ChevronRight,
  Pencil,
  Mail,
  Calendar,
  ShoppingBag,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ProfileForm } from "@/components/ProfileForm";
import { getTelegramUser, haptic } from "@/lib/telegram";
import { useUser } from "@/store/userStore";
import { useSettings, langLabels, type Theme } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";
import { useMyOrders } from "@/hooks/useMyOrders";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

// UI-only convenience: admin linkini yashirish/ko'rsatish uchun.
// Real security /admin route guard va bot inline callback'da (ADMIN_TELEGRAM_IDS env).
const ADMIN_IDS: Set<number> = new Set(
  ((import.meta.env.VITE_ADMIN_TELEGRAM_IDS as string | undefined) ?? "")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0),
);

function ProfilePage() {
  const tgUser = getTelegramUser();
  const profile = useUser((s) => s.profile);
  const setProfile = useUser((s) => s.setProfile);
  const addresses = useUser((s) => s.addresses);
  const defaultAddressId = useUser((s) => s.defaultAddressId);
  const lang = useSettings((s) => s.lang);
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const tr = useT(lang);
  const { orders: apiOrders, loading: ordersLoading } = useMyOrders(tgUser?.id ?? null);

  const [editing, setEditing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Set hydrated on mount
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Auto-fill telegram data on first visit
  useEffect(() => {
    if (!hydrated) return;
    const u = getTelegramUser();
    if (u && !profile.telegramId) {
      setProfile({
        telegramId: u.id,
        username: u.username,
        photoUrl: u.photo_url,
        firstName: profile.firstName ?? u.first_name,
        lastName: profile.lastName ?? u.last_name,
      });
    }
    if (!profile.profileCompleted) {
      setEditing(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const isAdmin = tgUser !== null && ADMIN_IDS.has(tgUser.id);

  const guestName = lang === "ru" ? "Гость" : lang === "en" ? "Guest" : "Mehmon";
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || guestName;
  const completed = !!profile.profileCompleted;

  const items = [
    {
      label: tr("savedAddresses"),
      icon: MapPin,
      to: "/address" as const,
      value: addresses.length ? `${addresses.length} ta` : undefined,
    },
    {
      label: tr("ordersHistory"),
      icon: ShoppingBag,
      to: "/orders" as const,
      value: !ordersLoading && apiOrders.length > 0 ? `${apiOrders.length} ta` : undefined,
    },
    { label: tr("promotions"), icon: Tag, to: "/promotions" as const },
    { label: tr("branches"), icon: Building2, to: "/branches" as const },
    { label: tr("contacts"), icon: Phone, to: "/contacts" as const },
    { label: tr("language"), icon: Globe, to: "/language" as const, value: langLabels[lang] },
    { label: tr("about"), icon: Info, to: "/about" as const },
  ];

  return (
    <div className="app-shell pb-28">
      <main className="px-4 pt-safe pt-4 space-y-4">
        {/* Profile card */}
        <div className="relative p-4 rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft mt-3">
          <button
            onClick={() => {
              haptic("light");
              setEditing(true);
            }}
            className="absolute top-3 right-3 grid place-items-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 transition-all duration-200 backdrop-blur-sm"
            aria-label={tr("editProfile")}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-3">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div className="grid place-items-center w-16 h-16 rounded-full bg-white/20 text-2xl font-bold">
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg leading-tight truncate">{fullName}</p>
              {profile.username && <p className="text-xs opacity-80">@{profile.username}</p>}
              {!completed && (
                <button
                  onClick={() => {
                    haptic("light");
                    setEditing(true);
                  }}
                  className="mt-1.5 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full"
                >
                  {tr("fillProfile")}
                </button>
              )}
            </div>
          </div>

          {completed && (
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
              {profile.phone && (
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} text={profile.phone} />
              )}
              {profile.email && (
                <InfoRow icon={<Mail className="w-3.5 h-3.5" />} text={profile.email} />
              )}
              {profile.birthDate && (
                <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} text={profile.birthDate} />
              )}
              {addresses[0] && (
                <InfoRow
                  icon={<MapPin className="w-3.5 h-3.5" />}
                  text={
                    (addresses.find((a) => a.id === defaultAddressId) ?? addresses[0]).fullAddress
                  }
                />
              )}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label={tr("orders")} value={ordersLoading ? "—" : apiOrders.length} />
          <Stat
            label={lang === "ru" ? "Адреса" : lang === "en" ? "Addresses" : "Manzillar"}
            value={addresses.length}
          />
        </div>

        {/* Menu */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Link key={it.label} to={it.to} onClick={() => haptic("light")}>
                <div className="flex items-center gap-3 p-4 active:bg-secondary transition-colors">
                  <div className="grid place-items-center w-9 h-9 rounded-xl bg-primary-soft text-primary shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{it.label}</span>
                  {it.value && <span className="text-xs text-muted-foreground">{it.value}</span>}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}

          {/* Dark mode toggle row */}
          <button
            onClick={() => {
              haptic("light");
              const next: Theme =
                theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
              setTheme(next);
            }}
            className="w-full flex items-center gap-3 p-4 active:bg-secondary transition-colors"
          >
            <div className="grid place-items-center w-9 h-9 rounded-xl bg-primary-soft text-primary shrink-0">
              {theme === "dark" ? (
                <Moon className="w-4 h-4" />
              ) : theme === "system" ? (
                <Monitor className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </div>
            <span className="flex-1 text-sm font-medium text-left">
              {lang === "ru" ? "Тема" : lang === "en" ? "Theme" : "Mavzu"}
            </span>
            <span className="text-xs text-muted-foreground">
              {theme === "dark"
                ? lang === "ru"
                  ? "Тёмная"
                  : lang === "en"
                    ? "Dark"
                    : "Qora"
                : theme === "light"
                  ? lang === "ru"
                    ? "Светлая"
                    : lang === "en"
                      ? "Light"
                      : "Yorug'"
                  : lang === "ru"
                    ? "Системная"
                    : lang === "en"
                      ? "System"
                      : "Tizim"}
            </span>
          </button>
        </div>

        {isAdmin && (
          <Link
            to="/admin"
            className="block text-center text-xs text-muted-foreground py-1 hover:text-primary transition-colors"
          >
            {tr("adminPanel")}
          </Link>
        )}

        <p className="text-center text-[11px] text-muted-foreground pt-2">
          Powered by <span className="font-bold text-primary">Qoshiqcha fast food</span>
        </p>
      </main>

      <BottomNav />

      {editing && <ProfileForm forceOpen={!completed} onClose={() => setEditing(false)} />}
    </div>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 opacity-90">
      <span className="opacity-80">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-3 rounded-2xl bg-card border border-border">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
