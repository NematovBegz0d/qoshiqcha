// Product service — catalog store ustida ishlaydi (zustand + localStorage).
import { useCatalog } from "@/store/catalogStore";
import type { Product, Category } from "@/lib/types";

export async function listCategories(): Promise<Category[]> {
  return useCatalog.getState().categories.filter((c) => c.active);
}

export async function listProducts(categoryId?: string): Promise<Product[]> {
  const all = useCatalog.getState().products.filter((p) => p.active);
  return categoryId ? all.filter((p) => p.categoryId === categoryId) : all;
}

export async function getProduct(id: string): Promise<Product | null> {
  return useCatalog.getState().products.find((p) => p.id === id) ?? null;
}
