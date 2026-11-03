import type { Product } from "@/features/products/types";
import type { ProductSet, ResolvedSet, SetPricing } from "@/features/sets/types";

/**
 * Pure set helpers shared by client components.
 *
 * Unlike `lib/live-sets` (which reads the server-side runtime store), these
 * take the catalogue as an argument, so an admin client component can resolve
 * a set it is holding in state without touching the store.
 */

/** Attach products to a set definition using the supplied catalogue. */
export function resolveSet(set: ProductSet, products: Product[]): ResolvedSet {
  return {
    ...set,
    items: set.items.flatMap((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return product ? [{ role: item.role, product }] : [];
    }),
  };
}

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
