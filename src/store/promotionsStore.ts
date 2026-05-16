import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import type { Promotion } from "@/lib/types";

type State = {
  promotions: Promotion[];
  loading: boolean;
  load: () => Promise<void>;
};

export const usePromotions = create<State>()((set) => ({
  promotions: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    try {
      const snap = await getDocs(collection(db, "promotions"));
      const data: Promotion[] = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as Promotion)
        .sort((a, b) => a.order - b.order);
      set({ promotions: data, loading: false });
    } catch (err) {
      console.error("[promotionsStore] load xatosi:", err);
      set({ loading: false });
    }
  },
}));
