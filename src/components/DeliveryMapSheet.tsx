import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Locate, Search, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/store/userStore";
import { useSettings } from "@/store/settingsStore";
import { haptic, notify, tg } from "@/lib/telegram";
import { useT } from "@/lib/i18n";
import type { Address } from "@/lib/types";

// ── Yandex Maps 2.1 minimal types ────────────────────────────────────────────

interface YPlacemark {
  geometry: {
    getCoordinates(): [number, number];
    setCoordinates(c: [number, number]): void;
  };
  events: { add(type: string, cb: () => void): void };
}

interface YClickEvent {
  get(key: "coords"): [number, number];
}

interface YMap {
  geoObjects: { add(obj: YPlacemark): void };
  events: { add(type: string, cb: (e: YClickEvent) => void): void };
  setCenter(c: [number, number], zoom?: number): void;
  destroy(): void;
}

interface YGeoObject {
  getAddressLine(): string;
  getThoroughfare(): string;
  getPremiseNumber(): string;
  getLocalities(): string[];
  geometry: { getCoordinates(): [number, number] } | null;
}

interface YGeoResult {
  geoObjects: {
    get(index: number): YGeoObject | undefined;
    getLength(): number;
  };
}

interface YMaps {
  ready(cb: () => void): void;
  Map: new (el: HTMLElement, state: object, opts?: object) => YMap;
  Placemark: new (c: [number, number], props?: object, opts?: object) => YPlacemark;
  geocode(request: string | [number, number], options?: object): Promise<YGeoResult>;
}

declare global {
  interface Window {
    ymaps?: YMaps;
  }
}

// ── Nominatim types ───────────────────────────────────────────────────────────

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    pedestrian?: string;
    neighbourhood?: string;
    suburb?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
  };
}

interface SuggestItem {
  label: string;
  lat: number;
  lng: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type Coords = { lat: number; lng: number };

const BUXORO: Coords = { lat: 39.7747, lng: 64.4286 };

const YANDEX_KEY = (import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined) ?? "";

let _loadPromise: Promise<YMaps> | null = null;

function loadYmaps(): Promise<YMaps> {
  if (_loadPromise) return _loadPromise;
  _loadPromise = new Promise((resolve, reject) => {
    if (window.ymaps?.ready) {
      window.ymaps.ready(() => resolve(window.ymaps!));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_KEY}&lang=ru_RU`;
    s.async = true;
    s.onload = () => window.ymaps!.ready(() => resolve(window.ymaps!));
    s.onerror = () => {
      _loadPromise = null;
      reject(new Error("Yandex Maps yuklanmadi"));
    };
    document.head.appendChild(s);
  });
  return _loadPromise;
}

// Nominatim — format reverse geocode response to a short readable address
function formatNominatimAddress(r: NominatimResult): string {
  const a = r.address;
  if (!a) return r.display_name;
  const street = a.road ?? a.pedestrian ?? a.neighbourhood ?? a.suburb ?? "";
  const house = a.house_number ? ` ${a.house_number}` : "";
  const city = a.city ?? a.town ?? a.village ?? a.county ?? "";
  if (street && city) return `${street}${house}, ${city}`;
  if (street) return `${street}${house}`;
  return r.display_name.split(", ").slice(0, 3).join(", ");
}

async function nominatimReverse(c: Coords): Promise<string> {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?lat=${c.lat}&lon=${c.lng}&format=json&accept-language=uz,ru,en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Nominatim reverse xatosi");
  const data: NominatimResult = await res.json();
  return formatNominatimAddress(data);
}

async function nominatimSearch(q: string): Promise<SuggestItem[]> {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=uz&accept-language=uz,ru,en`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data: NominatimResult[] = await res.json();
  return data.map((item) => ({
    label: formatNominatimAddress(item),
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

// ── Yandex geokoder (asosiy) ──────────────────────────────────────────────────
// Xarita allaqachon Yandex API kaliti bilan yuklanadi; geokodingni ham Yandex
// orqali qilamiz — Nominatim (OSM jamoat serveri) ToS/rate-limit muammosi yo'q,
// O'zbekistonda qamrov ham yaxshiroq.

// O'zbekiston chegara qutisi [SW [lat,lng], NE [lat,lng]] — qidiruvni yo'naltirish uchun.
const UZ_BOUNDS: [[number, number], [number, number]] = [
  [37.0, 56.0],
  [45.6, 73.2],
];

function shortYandexAddress(obj: YGeoObject): string {
  const street = obj.getThoroughfare() || "";
  const house = obj.getPremiseNumber() || "";
  const city = obj.getLocalities()?.[0] || "";
  const streetHouse = [street, house].filter(Boolean).join(" ");
  if (streetHouse && city) return `${streetHouse}, ${city}`;
  if (streetHouse) return streetHouse;
  // To'liq qatordan mamlakat prefiksini olib tashlab qisqartiramiz.
  return obj.getAddressLine().replace(/^(O['‘`]?zbekiston|Узбекистан|Uzbekistan),?\s*/i, "");
}

async function yandexReverse(c: Coords): Promise<string> {
  const ym = await loadYmaps();
  const res = await ym.geocode([c.lat, c.lng], { results: 1 });
  const obj = res.geoObjects.get(0);
  if (!obj) throw new Error("Yandex reverse: natija topilmadi");
  return shortYandexAddress(obj);
}

async function yandexSearch(q: string): Promise<SuggestItem[]> {
  const ym = await loadYmaps();
  const res = await ym.geocode(q, { results: 5, boundedBy: UZ_BOUNDS });
  const items: SuggestItem[] = [];
  const len = res.geoObjects.getLength();
  for (let i = 0; i < len; i++) {
    const obj = res.geoObjects.get(i);
    const coords = obj?.geometry?.getCoordinates();
    if (!obj || !coords) continue;
    items.push({ label: shortYandexAddress(obj), lat: coords[0], lng: coords[1] });
  }
  return items;
}

// ── Provayder-agnostik: Yandex (kalit bo'lsa) → Nominatim (fallback) ──────────

async function reverseAddress(c: Coords): Promise<string> {
  if (YANDEX_KEY) {
    try {
      return await yandexReverse(c);
    } catch {
      // Yandex ishlamasa, Nominatim'ga tushamiz
    }
  }
  return nominatimReverse(c);
}

async function searchAddress(q: string): Promise<SuggestItem[]> {
  if (YANDEX_KEY) {
    try {
      const results = await yandexSearch(q);
      if (results.length > 0) return results;
    } catch {
      // Yandex ishlamasa, Nominatim'ga tushamiz
    }
  }
  return nominatimSearch(q);
}

// ── Component ─────────────────────────────────────────────────────────────────

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
  const mapRef = useRef<YMap | null>(null);
  const markRef = useRef<YPlacemark | null>(null);
  const coordsRef = useRef<Coords>(BUXORO);

  const [coords, setCoords] = useState<Coords>(BUXORO);
  const [inputValue, setInputValue] = useState("");
  const [title, setTitle] = useState("Uy");
  const [addrLoading, setAddrLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [suggests, setSuggests] = useState<SuggestItem[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  // ── Reverse geocode (Nominatim) ──────────────────────────────────────────

  async function reverseGeocode(c: Coords) {
    setAddrLoading(true);
    try {
      const addr = await reverseAddress(c);
      setInputValue(addr);
    } catch {
      // foydalanuvchi qo'lda kiritadi
    } finally {
      setAddrLoading(false);
    }
  }

  // ── Map init / destroy ───────────────────────────────────────────────────

  useEffect(() => {
    if (!open) {
      mapRef.current?.destroy();
      mapRef.current = null;
      markRef.current = null;
      return;
    }

    const timer = setTimeout(async () => {
      if (!mapDivRef.current || mapRef.current) return;

      let ym: YMaps;
      try {
        ym = await loadYmaps();
      } catch {
        toast.error(lang === "ru" ? "Карта не загрузилась" : "Xarita yuklanmadi");
        return;
      }

      const c = coordsRef.current;

      const map = new ym.Map(
        mapDivRef.current,
        { center: [c.lat, c.lng], zoom: 14, controls: [] }, // controls — state ichida bo'lishi kerak
        { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true },
      );

      const mark = new ym.Placemark(
        [c.lat, c.lng],
        {},
        { draggable: true, preset: "islands#redDotIcon" },
      );

      map.geoObjects.add(mark);

      map.events.add("click", (e) => {
        const [lat, lng] = e.get("coords");
        const nc: Coords = { lat, lng };
        mark.geometry.setCoordinates([lat, lng]);
        setCoords(nc);
        void reverseGeocode(nc);
        haptic("light");
      });

      mark.events.add("dragend", () => {
        const [lat, lng] = mark.geometry.getCoordinates();
        const nc: Coords = { lat, lng };
        setCoords(nc);
        void reverseGeocode(nc);
        haptic("light");
      });

      mapRef.current = map;
      markRef.current = mark;

      void reverseGeocode(c);
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Sync pin + center when coords change ─────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || !markRef.current) return;
    markRef.current.geometry.setCoordinates([coords.lat, coords.lng]);
    mapRef.current.setCenter([coords.lat, coords.lng], 15);
  }, [coords]);

  // ── GPS ──────────────────────────────────────────────────────────────────

  const useMyLocation = () => {
    setGeoLoading(true);
    haptic("light");

    const t = (ru: string, en: string, uz: string) =>
      lang === "ru" ? ru : lang === "en" ? en : uz;

    const locate = (): Promise<Coords> =>
      new Promise((resolve, reject) => {
        // 1. Telegram LocationManager (Bot API 8.0+)
        const lm = tg()?.LocationManager;
        if (lm) {
          lm.init(() => {
            if (!lm.isLocationAvailable) {
              reject(
                new Error(
                  t(
                    "Местоположение недоступно в Telegram.",
                    "Location not available in Telegram.",
                    "Telegram versiyangizda joylashuv mavjud emas.",
                  ),
                ),
              );
              return;
            }
            lm.getLocation((loc) => {
              if (loc) {
                resolve({ lat: loc.latitude, lng: loc.longitude });
              } else if (!lm.isAccessGranted) {
                lm.openSettings();
                reject(new Error("__settings__"));
              } else {
                reject(
                  new Error(
                    t(
                      "Местоположение не определено. Попробуйте ещё раз.",
                      "Location not found. Try again.",
                      "Joylashuv aniqlanmadi. Qayta urinib ko'ring.",
                    ),
                  ),
                );
              }
            });
          });
          return;
        }

        // 2. navigator.geolocation fallback
        if (!navigator.geolocation) {
          reject(
            new Error(
              t(
                "Геолокация не поддерживается",
                "Geolocation not supported",
                "Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi",
              ),
            ),
          );
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => {
            if (err.code === err.PERMISSION_DENIED) {
              reject(
                new Error(
                  t(
                    "Доступ к геолокации запрещён. Разрешите в настройках.",
                    "Location permission denied. Allow it in settings.",
                    "Joylashuv ruxsati berilmagan. Sozlamalarda ruxsat bering.",
                  ),
                ),
              );
            } else if (err.code === err.TIMEOUT) {
              reject(
                new Error(
                  t(
                    "Время истекло. Введите адрес вручную.",
                    "Timed out. Enter address manually.",
                    "Vaqt tugadi. Manzilni qidiruv orqali kiriting.",
                  ),
                ),
              );
            } else {
              reject(
                new Error(
                  t(
                    "Местоположение недоступно. Введите адрес вручную.",
                    "Location unavailable. Enter address manually.",
                    "Joylashuv aniqlanmadi. Manzilni qidiruv orqali kiriting.",
                  ),
                ),
              );
            }
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 30000 },
        );
      });

    locate()
      .then((c) => {
        setCoords(c);
        void reverseGeocode(c);
      })
      .catch((err: Error) => {
        if (err.message !== "__settings__") toast.error(err.message);
      })
      .finally(() => {
        setGeoLoading(false);
      });
  };

  // ── Address search (Nominatim suggest) ───────────────────────────────────

  const onSearchChange = (v: string) => {
    setInputValue(v);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (!v.trim() || v.length < 2) {
      setSuggests([]);
      return;
    }
    suggestTimer.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const results = await searchAddress(v);
        setSuggests(results);
      } catch {
        setSuggests([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 600);
  };

  const selectSuggest = (item: SuggestItem) => {
    setSuggests([]);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    setInputValue(item.label);
    const nc: Coords = { lat: item.lat, lng: item.lng };
    setCoords(nc);
    haptic("light");
  };

  // ── Save ──────────────────────────────────────────────────────────────────

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
          {/* Yandex Map container */}
          <div className="relative rounded-2xl overflow-hidden border border-border bg-secondary h-56">
            <div ref={mapDivRef} className="w-full h-full" />

            {/* GPS button */}
            <button
              onClick={useMyLocation}
              className="absolute bottom-3 right-3 h-10 px-3 rounded-full bg-card border border-border shadow-card text-xs font-semibold flex items-center gap-1.5 active:scale-95 z-[500]"
            >
              {geoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Locate className="w-4 h-4 text-primary" />
              )}
              {tr("myLocation")}
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground -mt-2 text-center">
            {lang === "ru"
              ? "Нажмите на карту или перетащите маркер, чтобы выбрать точку"
              : lang === "en"
                ? "Tap the map or drag the pin to select a location"
                : "Xaritaga bosing yoki pinni torting — joylashuv aniqlanadi"}
          </p>

          {/* Address search */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {tr("addressLabel")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={inputValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={tr("addressPlaceholder")}
                className="w-full pl-9 pr-10 py-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm transition-colors"
              />
              {(addrLoading || suggestLoading) && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {inputValue && !addrLoading && !suggestLoading && (
                <button
                  onClick={() => {
                    setInputValue("");
                    setSuggests([]);
                    if (suggestTimer.current) clearTimeout(suggestTimer.current);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggest dropdown */}
            {suggests.length > 0 && (
              <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
                {suggests.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggest(item)}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left active:bg-secondary transition-colors"
                  >
                    <span className="text-xs text-foreground line-clamp-2">{item.label}</span>
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
