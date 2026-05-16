// Telegram WebApp wrapper. Safe to call on server (no-ops there).

type HapticStyle = "light" | "medium" | "heavy" | "soft" | "rigid";

interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

type TgLocation = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  course: number | null;
  speed: number | null;
  horizontal_accuracy: number | null;
  vertical_accuracy: number | null;
};

interface TgWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: { user?: TgUser; start_param?: string };
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  HapticFeedback?: {
    impactOccurred: (s: HapticStyle) => void;
    notificationOccurred: (t: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  LocationManager?: {
    isInited: boolean;
    isLocationAvailable: boolean;
    isAccessRequested: boolean;
    isAccessGranted: boolean;
    init(callback?: () => void): void;
    getLocation(callback: (loc: TgLocation | null) => void): void;
    openSettings(): void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    setText: (t: string) => void;
    enable: () => void;
    disable: () => void;
  };
  setHeaderColor: (c: string) => void;
  setBackgroundColor: (c: string) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export const tg = (): TgWebApp | null => {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
};

export function initTelegram() {
  const wa = tg();
  if (!wa) return;
  try {
    wa.ready();
    wa.expand();
    wa.setHeaderColor("#ffffff");
    wa.setBackgroundColor("#ffffff");
  } catch {
    // ignore
  }
}

export function haptic(style: HapticStyle = "light") {
  tg()?.HapticFeedback?.impactOccurred(style);
}

export function notify(type: "success" | "error" | "warning") {
  tg()?.HapticFeedback?.notificationOccurred(type);
}

export function getTelegramUser(): TgUser | null {
  return tg()?.initDataUnsafe?.user ?? null;
}

export function useBackButton(onBack: () => void) {
  const wa = tg();
  if (!wa) return () => {};
  wa.BackButton.show();
  wa.BackButton.onClick(onBack);
  return () => {
    wa.BackButton.offClick(onBack);
    wa.BackButton.hide();
  };
}
