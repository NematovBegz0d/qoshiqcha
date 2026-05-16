import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Locate, Search, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/store/userStore";
import { useSettings } from "@/store/settingsStore";
import { haptic, notify, tg } from "@/lib/telegram";
import { useT } from "@/lib/i18n";
import type { Address } from "@/lib/types";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

type Coords = { lat: number; lng: number };

const TASHKENT: Coords = { lat: 41.3111, lng: 69.2797 };

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export function DeliveryMapSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const addAddress = useUser((s) => s.addAddress);
  const setDefaultAddress = useUser((s) => s.setDefaultAddress);
  const setMode = useSettings((s) => s.setMode);
  const lang = useSettings((s) => s.lang);
  const tr = useT(lang);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const coordsRef = useRef<Coords>(TASHKENT);

  const [coords, setCoords] = useState<Coords>(TASHKENT);
  const [inputValue, setInputValue] = useState("");
  const [title, setTitle] = useState("Uy");
  const [addrLoading, setAddrLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync coordsRef so callbacks always have latest value
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  async function reverseGeocode(c: Coords) {
    setAddrLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.lat}&lon=${c.lng}&accept-language=${lang},uz,ru`,
        { headers: { "Accept-Language": `${lang},uz;q=0.9,ru;q=0.8` } },
      );
      const data = (await res.json()) as { display_name?: string };
      if (data?.display_name) setInputValue(data.display_name);
    } catch {
      // foydalanuvchi qo'lda kiritadi
    } finally {
      setAddrLoading(false);
    }
  }

  // Initialize Leaflet when sheet opens, destroy when closes
  useEffect(() => {
    if (!open) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    // Wait for Sheet animation + DOM paint
    const timer = setTimeout(async () => {
      if (!mapDivRef.current || mapRef.current) return;

      const L = (await import("leaflet")).default;

      // Fix marker icons for bundlers (CDN URLs)
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const startCoords = coordsRef.current;
      const map = L.map(mapDivRef.current, {
        center: [startCoords.lat, startCoords.lng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const m = L.marker([startCoords.lat, startCoords.lng], { draggable: true }).addTo(map);

      // Click on map → move pin + reverse geocode
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        const c = { lat: e.latlng.lat, lng: e.latlng.lng };
        m.setLatLng([c.lat, c.lng]);
        setCoords(c);
        void reverseGeocode(c);
        haptic("light");
      });

      // Drag pin → reverse geocode
      m.on("dragend", () => {
        const pos = m.getLatLng();
        const c = { lat: pos.lat, lng: pos.lng };
        setCoords(c);
        void reverseGeocode(c);
        haptic("light");
      });

      mapRef.current = map;
      markerRef.current = m;

      void reverseGeocode(startCoords);
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Move map + marker when coords change from GPS or search
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([coords.lat, coords.lng]);
    mapRef.current.setView([coords.lat, coords.lng], 15, { animate: true });
  }, [coords]);

  // GPS — Telegram LocationManager (Bot API 8.0+) → navigator.geolocation fallback
  const useMyLocation = () => {
    setGeoLoading(true);
    haptic("light");

    const onSuccess = (c: Coords) => {
      setCoords(c);
      void reverseGeocode(c);
      setGeoLoading(false);
    };

    const onFail = (reason: string) => {
      setGeoLoading(false);
      toast.error(reason);
    };

    // 1. Telegram native LocationManager (aniqroq, ruxsat Telegram orqali so'raladi)
    const tgApp = tg();
    const lm = tgApp?.LocationManager;
    if (lm) {
      lm.init(() => {
        if (!lm.isLocationAvailable) {
          onFail(
            lang === "ru"
              ? "Местоположение недоступно в вашем Telegram."
              : lang === "en"
                ? "Location is not available in your Telegram."
                : "Telegram versiyangizda joylashuv mavjud emas.",
          );
          return;
        }
        lm.getLocation((loc) => {
          if (loc) {
            onSuccess({ lat: loc.latitude, lng: loc.longitude });
          } else if (!lm.isAccessGranted) {
            lm.openSettings();
            setGeoLoading(false);
          } else {
            onFail(
              lang === "ru"
                ? "Местоположение не определено. Попробуйте ещё раз."
                : lang === "en"
                  ? "Location not found. Try again."
                  : "Joylashuv aniqlanmadi. Qayta urinib ko'ring.",
            );
          }
        });
      });
      return;
    }

    // 2. navigator.geolocation fallback (brauzer, eski Telegram)
    if (!navigator.geolocation) {
      onFail(
        lang === "ru"
          ? "Геолокация не поддерживается"
          : lang === "en"
            ? "Geolocation not supported"
            : "Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          onFail(
            lang === "ru"
              ? "Доступ к геолокации запрещён. Разрешите в настройках Telegram или браузера."
              : lang === "en"
                ? "Location permission denied. Allow it in Telegram or browser settings."
                : "Joylashuv ruxsati berilmagan. Telegram yoki brauzer sozlamalarida ruxsat bering.",
          );
        } else if (err.code === err.TIMEOUT) {
          onFail(
            lang === "ru"
              ? "Время истекло. Введите адрес вручную."
              : lang === "en"
                ? "Location timed out. Enter address manually."
                : "Vaqt tugadi. Manzilni qidiruv orqali kiriting.",
          );
        } else {
          onFail(
            lang === "ru"
              ? "Местоположение недоступно. Слабый сигнал — введите адрес вручную."
              : lang === "en"
                ? "Location unavailable. Weak signal — enter address manually."
                : "Joylashuv aniqlanmadi. Signal zaif — manzilni qidiruv orqali kiriting.",
          );
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 30000 },
    );
  };

  // Search by text (Nominatim, debounced)
  const onSearchChange = (v: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!v.trim() || v.length < 3) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(v)}&limit=5&accept-language=${lang},uz,ru`,
        );
        const results = (await res.json()) as NominatimResult[];
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 600);
  };

  const selectResult = (r: NominatimResult) => {
    const c: Coords = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    setCoords(c);
    setInputValue(r.display_name);
    setSearchResults([]);
    haptic("light");
  };

  const save = () => {
    if (!inputValue.trim()) return;
    const a: Address = {
      id: crypto.randomUUID(),
      title: title || "Manzil",
      fullAddress: inputValue.trim(),
      lat: coords.lat,
      lng: coords.lng,
      isDefault: true,
    };
    addAddress(a);
    setDefaultAddress(a.id);
    setMode("delivery");
    haptic("medium");
    notify("success");
    onOpenChange(false);
  };

  const titleOptions =
    lang === "ru"
      ? ["Дом", "Работа", "Другое"]
      : lang === "en"
        ? ["Home", "Work", "Other"]
        : ["Uy", "Ish", "Boshqa"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 max-h-[95vh] overflow-y-auto border-0"
      >
        <SheetHeader className="px-5 pt-5 pb-2 text-left">
          <SheetTitle className="text-xl font-bold">{tr("deliveryMapTitle")}</SheetTitle>
          <p className="text-sm text-muted-foreground">{tr("mapHint")}</p>
        </SheetHeader>

        <div className="px-5 pb-6 space-y-4">
          {/* Leaflet map */}
          <div className="relative rounded-2xl overflow-hidden border border-border bg-secondary h-56">
            <div ref={mapDivRef} className="w-full h-full" />
            {/* GPS button */}
            <button
              onClick={useMyLocation}
              className="absolute bottom-3 right-3 h-10 px-3 rounded-full bg-card border border-border shadow-card text-xs font-semibold flex items-center gap-1.5 active:scale-95 z-[1000]"
            >
              {geoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Locate className="w-4 h-4 text-primary" />
              )}
              {tr("myLocation")}
            </button>
          </div>

          {/* Hint */}
          <p className="text-[11px] text-muted-foreground -mt-2 text-center">
            {lang === "ru"
              ? "Нажмите на карту или перетащите маркер, чтобы выбрать точку"
              : lang === "en"
                ? "Tap the map or drag the pin to select a location"
                : "Xaritaga bosing yoki pinni torting — joylashuv aniqlanadi"}
          </p>

          {/* Search box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {tr("addressLabel")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  onSearchChange(e.target.value);
                }}
                placeholder={tr("addressPlaceholder")}
                className="w-full pl-9 pr-10 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm transition-colors"
              />
              {(addrLoading || searchLoading) && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {inputValue && !addrLoading && !searchLoading && (
                <button
                  onClick={() => {
                    setInputValue("");
                    setSearchResults([]);
                    if (searchTimeout.current) clearTimeout(searchTimeout.current);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
                {searchResults.map((r) => (
                  <button
                    key={r.place_id}
                    onClick={() => selectResult(r)}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left active:bg-secondary transition-colors"
                  >
                    <span className="text-xs text-foreground line-clamp-2">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Label */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {tr("nameLabel")}
            </label>
            <div className="flex gap-2">
              {titleOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTitle(t);
                    haptic("light");
                  }}
                  className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${
                    title === t
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={save}
            disabled={!inputValue.trim()}
            className="w-full h-12 rounded-full bg-gradient-primary text-primary-foreground font-bold shadow-soft active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {tr("saveAndContinue")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
