import { PRODUCT_BY_ID } from "@/features/products/data/catalog";
import type { Product } from "@/features/products/types";
import { SETS, SET_BY_SLUG } from "../data/sets";
import type { ProductSet, ResolvedSet, SetPricing } from "../types";

/** Attach the actual products to a set definition. */
export function resolveSet(set: ProductSet): ResolvedSet {
  return {
    ...set,
    items: set.items.flatMap((item) => {
      const product = PRODUCT_BY_ID.get(item.productId);
      return product ? [{ role: item.role, product }] : [];
    }),
  };
}

export const getResolvedSets = (): ResolvedSet[] => SETS.map(resolveSet);

export const getFeaturedSets = (): ResolvedSet[] =>
  SETS.filter((set) => set.featured).map(resolveSet);

export const getResolvedSet = (slug: string): ResolvedSet | null => {
  const set = SET_BY_SLUG.get(slug);
  return set ? resolveSet(set) : null;
};

/** Sets that contain a given product — used for cross-selling on the PDP. */
export function getSetsContainingProduct(productId: string, limit = 2): ResolvedSet[] {
  return SETS.filter((set) => set.items.some((item) => item.productId === productId))
    .slice(0, limit)
    .map(resolveSet);
}

/* -------------------------------------------------------------------------- */
/*  Pricing                                                                   */
/* -------------------------------------------------------------------------- */

export function setPricing(set: ResolvedSet): SetPricing {
  const subtotal = set.items.reduce((sum, item) => sum + item.product.price, 0);
  const discount = Math.round(subtotal * set.discountRate);

  return {
    subtotal,
    discount,
    total: subtotal - discount,
    savingsRate: subtotal > 0 ? discount / subtotal : 0,
    itemCount: set.items.length,
  };
}

/** "کفش · شلوار · پیراهن · بافت" */
export const setRoles = (set: ResolvedSet): string =>
  set.items.map((item) => item.role).join(" · ");

/* -------------------------------------------------------------------------- */
/*  Availability & defaults                                                   */
/* -------------------------------------------------------------------------- */

export interface SetAvailability {
  inStock: boolean;
  /** Titles of the pieces that are fully sold out. */
  soldOut: string[];
}

export function setAvailability(set: ResolvedSet): SetAvailability {
  const soldOut = set.items
    .filter((item) => item.product.variants.every((variant) => variant.stock <= 0))
    .map((item) => item.product.name);

  return { inStock: soldOut.length === 0, soldOut };
}

/** First in-stock size, falling back to the first declared variant. */
export function defaultSizeFor(product: Product): string {
  const available = product.variants.find((variant) => variant.stock > 0);
  return (available ?? product.variants[0])?.size ?? "ONE";
}

/** Max units that can be added for a given size. */
export function stockForSize(product: Product, size: string): number {
  return product.variants.find((variant) => variant.size === size)?.stock ?? 0;
}
