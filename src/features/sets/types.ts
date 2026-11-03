import type { Product } from "@/features/products/types";

export interface SetItem {
  productId: string;
  /** The part this piece plays in the look, e.g. «کفش» یا «پیراهن». */
  role: string;
}

export interface ProductSet {
  slug: string;
  title: string;
  latinTitle: string;
  subtitle: string;
  description: string;
  /** When to wear it, e.g. «اداری»، «آخر هفته». */
  occasion: string;
  season: string;
  /** Bundle discount applied when the whole look is bought together. */
  discountRate: number;
  featured: boolean;
  accent: string;
  items: SetItem[];
}

export interface ResolvedSetItem {
  role: string;
  product: Product;
}

/** A set with its products already looked up. */
export interface ResolvedSet extends Omit<ProductSet, "items"> {
  items: ResolvedSetItem[];
}

export interface SetPricing {
  subtotal: number;
  discount: number;
  total: number;
  /** Effective saving, 0–1. */
  savingsRate: number;
  itemCount: number;
}
