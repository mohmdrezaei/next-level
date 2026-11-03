/**
 * Pure pricing/availability helpers for a resolved set.
 *
 * Kept free of any database import so client components (e.g. the purchase
 * panel) can use them without pulling server-only code into the bundle.
 */
import type { Product } from "@/features/products/types";
import type { ResolvedSet, SetPricing } from "../types";

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
