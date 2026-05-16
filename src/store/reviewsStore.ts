import { create } from "zustand";
import { persist } from "zustand/middleware";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { tg } from "@/lib/telegram";
import { submitReview } from "@/services/orderService";

export type Review = {
  id: string;
  productId: string;
  author: string;
  authorId?: number;
  rating: number; // 1..5
  text: string;
  createdAt: number; // milliseconds
};

type State = {
  reviews: Review[];
  loading: boolean;
  loadForProduct: (productId: string) => Promise<void>;
  add: (r: Omit<Review, "id" | "createdAt">) => Promise<void>;
  remove: (id: string) => void;
  forProduct: (productId: string) => Review[];
  statsFor: (productId: string) => { count: number; avg: number };
};

function toMs(val: unknown): number {
  if (!val) return Date.now();
  if (typeof val === "number") return val;
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof (val as { toMillis?: () => number }).toMillis === "function") {
    return (val as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

export const useReviews = create<State>()(
  persist(
    (set, get) => ({
      reviews: [],
      loading: false,

      loadForProduct: async (productId: string) => {
        set({ loading: true });
        try {
          const q = query(collection(db, "reviews"), where("productId", "==", productId));
          const snap = await getDocs(q);
          const fetched: Review[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              productId: data.productId as string,
              author: (data.author as string) || "Foydalanuvchi",
              authorId: data.authorId as number | undefined,
              rating: (data.rating as number) || 5,
              text: (data.text as string) || "",
              createdAt: toMs(data.createdAt),
            };
          });
          set((s) => ({
            reviews: [...s.reviews.filter((r) => r.productId !== productId), ...fetched],
            loading: false,
          }));
        } catch (err) {
          console.error("[reviewsStore] loadForProduct xatosi:", err);
          set({ loading: false });
        }
      },

      add: async (r) => {
        const initData = tg()?.initData ?? "";
        if (!initData) {
          throw new Error("Sharh yozish uchun ilovani Telegram ichida oching.");
        }

        // Optimistic update — darhol ko'rsatish
        const tempId = `temp_${Date.now()}`;
        const tempReview: Review = { ...r, id: tempId, createdAt: Date.now() };
        set((s) => ({ reviews: [tempReview, ...s.reviews] }));

        try {
          const result = await submitReview(initData, {
            productId: r.productId,
            rating: r.rating,
            text: r.text,
          });
          // Vaqtinchalik ID ni Firestore real ID bilan almashtirish
          set((s) => ({
            reviews: s.reviews.map((rev) => (rev.id === tempId ? { ...rev, id: result.id } : rev)),
          }));
        } catch (err) {
          // Xato bo'lsa optimistic update ni bekor qilish
          set((s) => ({ reviews: s.reviews.filter((rev) => rev.id !== tempId) }));
          throw err;
        }
      },

      // Faqat lokal state dan o'chirish — Firestore delete backend orqali qilinadi
      remove: (id: string) => {
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) }));
      },

      forProduct: (pid) =>
        get()
          .reviews.filter((r) => r.productId === pid)
          .sort((a, b) => b.createdAt - a.createdAt),

      statsFor: (pid) => {
        const list = get().reviews.filter((r) => r.productId === pid);
        if (!list.length) return { count: 0, avg: 0 };
        const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
        return { count: list.length, avg };
      },
    }),
    {
      name: "qoshiqcha-reviews",
      version: 2,
      partialize: (s) => ({ reviews: s.reviews }),
    },
  ),
);
