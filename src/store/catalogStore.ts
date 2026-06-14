import { create } from "zustand";
import { persist } from "zustand/middleware";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import type { Branch, BusinessContacts, Category, Product, Settings } from "@/lib/types";
import { settings as mockSettings } from "@/data/mockData";
import { defaultBranches, defaultBusinessContacts } from "@/data/businessInfo";
import { db } from "@/services/firebase";
import { adminApi } from "@/services/adminApi";

type CatalogState = {
  products: Product[];
  categories: Category[];
  shopSettings: Settings;
  branches: Branch[];
  businessContacts: BusinessContacts;
  catalogLoading: boolean;
  catalogError: string | null;
  loadFromFirestore: () => Promise<void>;
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductActive: (id: string) => Promise<void>;
  addCategory: (c: Category) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateShopSettings: (patch: Partial<Settings>) => Promise<void>;
  addBranch: (b: Branch) => Promise<void>;
  updateBranch: (id: string, patch: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  updateBusinessContacts: (patch: Partial<BusinessContacts>) => Promise<void>;
  resetCatalog: () => void;
};

export const useCatalog = create<CatalogState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      shopSettings: mockSettings,
      branches: defaultBranches,
      businessContacts: defaultBusinessContacts,
      catalogLoading: false,
      catalogError: null,

      loadFromFirestore: async () => {
        set({ catalogLoading: true, catalogError: null });
        try {
          const [catSnap, prodSnap, settingsSnap, branchSnap, contactsSnap] = await Promise.all([
            getDocs(collection(db, "categories")),
            getDocs(collection(db, "products")),
            getDoc(doc(db, "settings", "global")),
            getDocs(collection(db, "branches")),
            getDoc(doc(db, "settings", "contacts")),
          ]);

          const categories = catSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Category)
            .sort((a, b) => a.order - b.order);
          const products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
          const shopSettings = settingsSnap.exists()
            ? ({ ...mockSettings, ...settingsSnap.data() } as Settings)
            : mockSettings;
          const branches = branchSnap.docs.length
            ? branchSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Branch)
            : defaultBranches;
          const businessContacts = contactsSnap.exists()
            ? ({ ...defaultBusinessContacts, ...contactsSnap.data() } as BusinessContacts)
            : defaultBusinessContacts;

          set({
            categories,
            products,
            shopSettings,
            branches,
            businessContacts,
            catalogError: null,
          });
        } catch (err) {
          console.error("[catalogStore] Firestore yuklanmadi:", err);
          set({ catalogError: "Katalog yuklanmadi. Internet aloqasini tekshiring." });
        } finally {
          set({ catalogLoading: false });
        }
      },

      addProduct: async (p) => {
        await adminApi.createProduct(p);
        set((s) => ({ products: [p, ...s.products] }));
      },
      updateProduct: async (id, patch) => {
        await adminApi.updateProduct(id, patch);
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
      },
      deleteProduct: async (id) => {
        await adminApi.deleteProduct(id);
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
      },
      toggleProductActive: async (id) => {
        const current = get().products.find((p) => p.id === id);
        if (!current) throw new Error(`Product not found: ${id}`);
        const nextActive = !current.active;
        await adminApi.updateProduct(id, { active: nextActive });
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, active: nextActive } : p)),
        }));
      },
      addCategory: async (c) => {
        await adminApi.createCategory(c);
        set((s) => ({ categories: [...s.categories, c] }));
      },
      updateCategory: async (id, patch) => {
        await adminApi.updateCategory(id, patch);
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
      },
      deleteCategory: async (id) => {
        await adminApi.deleteCategory(id);
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          products: s.products.filter((p) => p.categoryId !== id),
        }));
      },
      updateShopSettings: async (patch) => {
        await adminApi.updateSettings(patch);
        set((s) => ({ shopSettings: { ...s.shopSettings, ...patch } }));
      },

      addBranch: async (b) => {
        await adminApi.createBranch(b);
        set((s) => ({ branches: [...s.branches, b] }));
      },
      updateBranch: async (id, patch) => {
        await adminApi.updateBranch(id, patch);
        set((s) => ({
          branches: s.branches.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        }));
      },
      deleteBranch: async (id) => {
        await adminApi.deleteBranch(id);
        set((s) => ({ branches: s.branches.filter((b) => b.id !== id) }));
      },
      updateBusinessContacts: async (patch) => {
        await adminApi.updateContacts(patch);
        set((s) => ({ businessContacts: { ...s.businessContacts, ...patch } }));
      },

      resetCatalog: () =>
        set({
          products: [],
          categories: [],
          shopSettings: mockSettings,
          branches: defaultBranches,
          businessContacts: defaultBusinessContacts,
          catalogError: null,
        }),
    }),
    {
      name: "qoshiqcha-catalog",
      version: 3,
      migrate: (persisted, version) => {
        const base = persisted as Partial<CatalogState>;
        if (version < 2) {
          base.products = [];
          base.categories = [];
          base.catalogError = null;
        }
        if (version < 3) {
          base.branches = defaultBranches;
          base.businessContacts = defaultBusinessContacts;
        }
        return base as unknown as CatalogState;
      },
    },
  ),
);

export const newId = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
