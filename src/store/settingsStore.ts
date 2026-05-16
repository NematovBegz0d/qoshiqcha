import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "uz" | "ru" | "en";
export type FulfillmentMode = "delivery" | "pickup";
export type Theme = "light" | "dark" | "system";

type SettingsState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  mode: FulfillmentMode;
  setMode: (m: FulfillmentMode) => void;
  pickupBranchId?: string;
  pickupTime?: string;
  setPickup: (branchId: string, time: string) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: "uz",
      setLang: (lang) => set({ lang }),
      theme: "system",
      setTheme: (theme) => set({ theme }),
      mode: "delivery",
      setMode: (mode) => set({ mode }),
      pickupBranchId: undefined,
      pickupTime: undefined,
      setPickup: (pickupBranchId, pickupTime) =>
        set({ pickupBranchId, pickupTime, mode: "pickup" }),
    }),
    { name: "qoshiqcha-settings" },
  ),
);

export const langLabels: Record<Lang, string> = {
  uz: "O'zbek",
  ru: "Русский",
  en: "English",
};
