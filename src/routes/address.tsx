import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, MapPin, Navigation, Trash2, Map, Smartphone } from "lucide-react";
import { useUser } from "@/store/userStore";
import type { Address } from "@/lib/types";
import { haptic } from "@/lib/telegram";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n";
import { DeliveryMapSheet } from "@/components/DeliveryMapSheet";

export const Route = createFileRoute("/address")({
  component: AddressPage,
});

function AddressPage() {
  const navigate = useNavigate();
  const addresses = useUser((s) => s.addresses);
  const addAddress = useUser((s) => s.addAddress);
  const removeAddress = useUser((s) => s.removeAddress);
  const setDefault = useUser((s) => s.setDefaultAddress);
  const defaultId = useUser((s) => s.defaultAddressId);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);

  const [adding, setAdding] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [form, setForm] = useState<Partial<Address>>({});

  const detect = () => {
    haptic("light");
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setForm((f) => ({
          ...f,
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          fullAddress:
            f.fullAddress ??
            `Lat: ${p.coords.latitude.toFixed(4)}, Lng: ${p.coords.longitude.toFixed(4)}`,
        }));
      },
      () => {},
    );
  };

  const save = () => {
    if (!form.fullAddress) return;
    const a: Address = {
      id: crypto.randomUUID(),
      title: form.title || "Uy",
      fullAddress: form.fullAddress!,
      lat: form.lat,
      lng: form.lng,
      house: form.house,
      apartment: form.apartment,
      floor: form.floor,
      entrance: form.entrance,
      courierNote: form.courierNote,
    };
    addAddress(a);
    haptic("medium");
    setAdding(false);
    setForm({});
  };

  return (
    <div className="app-shell pb-12">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl pt-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => (adding ? setAdding(false) : navigate({ to: "/" }))}
            className="grid place-items-center w-10 h-10 rounded-full bg-card border border-border active:scale-95"
            aria-label={tr("back")}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">{adding ? tr("newAddress") : tr("myAddresses")}</h1>
        </div>
      </header>

      <main className="px-4 pt-2 space-y-3">
        {!adding && (
          <>
            <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
              <Smartphone className="w-3 h-3 shrink-0" />
              <span>{tr("deviceOnly")}</span>
            </div>
            {addresses.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {tr("noAddresses")}
              </div>
            )}
            {addresses.map((a) => (
              <div
                key={a.id}
                className={`p-3 rounded-2xl bg-card border ${
                  defaultId === a.id ? "border-primary" : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary-soft text-primary shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{a.title}</p>
                      <button
                        onClick={() => removeAddress(a.id)}
                        className="text-muted-foreground active:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.fullAddress}</p>
                    {defaultId !== a.id && (
                      <button
                        onClick={() => {
                          haptic("light");
                          setDefault(a.id);
                        }}
                        className="mt-2 text-xs font-semibold text-primary"
                      >
                        {tr("makeDefault")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setAdding(true)}
              className="w-full h-12 rounded-full bg-gradient-primary text-primary-foreground font-bold shadow-soft active:scale-[0.98]"
            >
              + {tr("newAddress")}
            </button>
          </>
        )}

        {adding && (
          <div className="space-y-3">
            <button
              onClick={() => {
                haptic("light");
                setMapOpen(true);
              }}
              className="w-full aspect-[16/10] rounded-2xl bg-gradient-to-br from-primary-soft to-secondary border border-primary/20 grid place-items-center active:scale-[0.98] transition-transform"
            >
              <div className="text-center">
                <Map className="w-10 h-10 mx-auto mb-2 text-primary" />
                <p className="text-sm font-semibold text-primary">
                  {lang === "ru"
                    ? "Открыть карту"
                    : lang === "en"
                      ? "Open map"
                      : "Xaritadan tanlash"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === "ru"
                    ? "Найти и сохранить адрес"
                    : lang === "en"
                      ? "Find and save address"
                      : "Manzilni topib saqlash"}
                </p>
              </div>
            </button>
            <button
              onClick={detect}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-card border border-border font-semibold text-sm active:scale-[0.98]"
            >
              <Navigation className="w-4 h-4" /> {tr("detectLocation")}
            </button>
            {(["fullAddress", "title", "house", "apartment", "floor", "entrance"] as const).map(
              (k) => (
                <input
                  key={k}
                  placeholder={
                    {
                      fullAddress: tr("streetAddress"),
                      title: tr("titleLabel"),
                      house: tr("house"),
                      apartment: tr("apartment"),
                      floor: tr("floor"),
                      entrance: tr("entrance"),
                    }[k]
                  }
                  value={(form[k] as string) ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm"
                />
              ),
            )}
            <textarea
              placeholder={tr("courierNote")}
              value={form.courierNote ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, courierNote: e.target.value }))}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm resize-none"
            />
            <button
              onClick={save}
              disabled={!form.fullAddress}
              className="w-full h-12 rounded-full bg-gradient-primary text-primary-foreground font-bold shadow-soft active:scale-[0.98] disabled:opacity-50"
            >
              {tr("saveAddress")}
            </button>
          </div>
        )}
      </main>

      <DeliveryMapSheet
        open={mapOpen}
        onOpenChange={(v) => {
          setMapOpen(v);
          if (!v) setAdding(false);
        }}
      />
    </div>
  );
}
