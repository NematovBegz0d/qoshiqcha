import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, ModifierOption, Product, Variant } from "@/lib/types";

type CartState = {
  items: CartItem[];
  add: (
    product: Product,
    opts?: { variant?: Variant; modifiers?: ModifierOption[]; quantity?: number; comment?: string },
  ) => void;
  remove: (uid: string) => void;
  setQuantity: (uid: string, q: number) => void;
  setComment: (uid: string, c: string) => void;
  clear: () => void;
  count: () => number;
  itemsTotal: () => number;
};

const uidFor = (productId: string, variantId?: string, modIds: string[] = []) =>
  [productId, variantId ?? "_", ...modIds.sort()].join("|");

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, opts = {}) => {
        const variant = opts.variant;
        const modifiers = opts.modifiers ?? [];
        const qty = Math.min(99, Math.max(1, Math.trunc(opts.quantity ?? 1)));
        const uid = uidFor(
          product.id,
          variant?.id,
          modifiers.map((m) => m.id),
        );
        set((s) => {
          const existing = s.items.find((i) => i.uid === uid);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.uid === uid ? { ...i, quantity: Math.min(99, i.quantity + qty) } : i,
              ),
            };
          }
          const basePrice = variant?.price ?? product.price;
          return {
            items: [
              ...s.items,
              {
                uid,
                productId: product.id,
                name: product.name,
                image: product.image,
                basePrice,
                selectedVariant: variant,
                selectedModifiers: modifiers,
                quantity: qty,
                comment: opts.comment,
              },
            ],
          };
        });
      },
      remove: (uid) => set((s) => ({ items: s.items.filter((i) => i.uid !== uid) })),
      setQuantity: (uid, q) =>
        set((s) => {
          const quantity = Math.min(99, Math.max(0, Math.trunc(Number(q) || 0)));
          return {
            items:
              quantity <= 0
                ? s.items.filter((i) => i.uid !== uid)
                : s.items.map((i) => (i.uid === uid ? { ...i, quantity } : i)),
          };
        }),
      setComment: (uid, c) =>
        set((s) => ({ items: s.items.map((i) => (i.uid === uid ? { ...i, comment: c } : i)) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      itemsTotal: () =>
        get().items.reduce((n, i) => {
          const mods = i.selectedModifiers.reduce((s, m) => s + m.price, 0);
          return n + (i.basePrice + mods) * i.quantity;
        }, 0),
    }),
    { name: "qoshiqcha-cart" },
  ),
);

export const itemSubtotal = (i: CartItem) => {
  const mods = i.selectedModifiers.reduce((s, m) => s + m.price, 0);
  return (i.basePrice + mods) * i.quantity;
};
