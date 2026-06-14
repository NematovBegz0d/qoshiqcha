import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Address, Order } from "@/lib/types";

export type UserProfile = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  birthDate?: string; // YYYY-MM-DD
  gender?: "male" | "female" | "other";
  photoUrl?: string;
  telegramId?: number;
  username?: string;
  profileCompleted?: boolean;
};

type UserState = {
  // legacy
  phone?: string;
  // profile
  profile: UserProfile;
  addresses: Address[];
  defaultAddressId?: string;
  orders: Order[];
  setPhone: (p: string) => void;
  setProfile: (p: Partial<UserProfile>) => void;
  resetProfile: () => void;
  addAddress: (a: Address) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  addOrder: (o: Order) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
};

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      phone: undefined,
      profile: {},
      addresses: [],
      orders: [],
      setPhone: (phone) => set((s) => ({ phone, profile: { ...s.profile, phone } })),
      setProfile: (p) =>
        set((s) => ({
          profile: { ...s.profile, ...p },
          phone: p.phone ?? s.phone,
        })),
      resetProfile: () => set({ profile: {} }),
      addAddress: (a) =>
        set((s) => {
          const makeDefault = s.addresses.length === 0 || !!a.isDefault;
          return {
            addresses: [
              ...s.addresses.map((x) => (makeDefault ? { ...x, isDefault: false } : x)),
              { ...a, isDefault: makeDefault },
            ],
            defaultAddressId: makeDefault ? a.id : (s.defaultAddressId ?? a.id),
          };
        }),
      removeAddress: (id) =>
        set((s) => {
          const remaining = s.addresses.filter((a) => a.id !== id);
          const wasDefault = s.defaultAddressId === id;
          if (!wasDefault) return { addresses: remaining };
          const newDefault = remaining[0] ?? null;
          return {
            addresses: newDefault
              ? remaining.map((a, i) => ({ ...a, isDefault: i === 0 }))
              : remaining,
            defaultAddressId: newDefault?.id,
          };
        }),
      setDefaultAddress: (id) =>
        set((s) => ({
          defaultAddressId: id,
          addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
        })),
      // Lokal orders faqat order-success ekrani uchun optimistik kesh —
      // haqiqiy tarix backenddan (useMyOrders). localStorage shishmasligi uchun 50 ta bilan cheklaymiz.
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders].slice(0, 50) })),
      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  statusHistory: [...o.statusHistory, { status, at: Date.now() }],
                }
              : o,
          ),
        })),
    }),
    { name: "qoshiqcha-user" },
  ),
);
