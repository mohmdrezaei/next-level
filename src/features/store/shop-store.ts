import { PRODUCTS } from "@/features/products/data/catalog";
import { SETS } from "@/features/sets/data/sets";
import { CUSTOMERS, ORDERS } from "@/features/orders/data/orders";
import type { Product } from "@/features/products/types";
import type { ProductSet } from "@/features/sets/types";
import type { Customer, Order } from "@/features/orders/types";

/**
 * The single source of truth for everything the shop sells.
 *
 * The store starts as a deep clone of the seeded demo catalogue and then lives
 * on `globalThis` so that edits made from the admin panel survive module
 * re-evaluation during development (HMR). Every reader — storefront pages and
 * admin screens alike — goes through the helpers below, which is what makes an
 * admin change show up on the public site without a rebuild.
 */
export interface ShopStore {
  products: Product[];
  sets: ProductSet[];
  customers: Customer[];
  orders: Order[];
}

declare global {
  var __nextLevelStore: ShopStore | undefined;
}

/* -------------------------------------------------------------------------- */
/*  Cloning                                                                   */
/* -------------------------------------------------------------------------- */

export function cloneProduct(product: Product): Product {
  return {
    ...product,
    materials: [...product.materials],
    care: [...product.care],
    highlights: [...product.highlights],
    colors: product.colors.map((color) => ({ ...color })),
    variants: product.variants.map((variant) => ({ ...variant })),
    images: product.images.map((image) => ({ ...image })),
    badges: [...product.badges],
    tags: [...product.tags],
  };
}

export function cloneSet(set: ProductSet): ProductSet {
  return { ...set, items: set.items.map((item) => ({ ...item })) };
}

export function cloneCustomer(customer: Customer): Customer {
  return { ...customer };
}

export function cloneOrder(order: Order): Order {
  return {
    ...order,
    items: order.items.map((item) => ({ ...item })),
    address: { ...order.address },
    timeline: order.timeline.map((event) => ({ ...event })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Store access                                                              */
/* -------------------------------------------------------------------------- */

export function getShopStore(): ShopStore {
  if (!globalThis.__nextLevelStore) {
    globalThis.__nextLevelStore = {
      products: PRODUCTS.map(cloneProduct),
      sets: SETS.map(cloneSet),
      customers: CUSTOMERS.map(cloneCustomer),
      orders: ORDERS.map(cloneOrder),
    };
  }
  return globalThis.__nextLevelStore;
}

/* -------------------------------------------------------------------------- */
/*  Derived indexes (rebuilt on demand so they never go stale)                 */
/* -------------------------------------------------------------------------- */

export const productById = (id: string): Product | undefined =>
  getShopStore().products.find((product) => product.id === id);

export const productBySlug = (slug: string): Product | undefined =>
  getShopStore().products.find((product) => product.slug === slug);

export const setBySlug = (slug: string): ProductSet | undefined =>
  getShopStore().sets.find((set) => set.slug === slug);

export const customerById = (id: string): Customer | undefined =>
  getShopStore().customers.find((customer) => customer.id === id);

/** The tier a customer lands in, derived from lifetime spend. */
export const tierForSpend = (totalSpent: number): Customer["tier"] =>
  totalSpent > 60_000_000 ? "gold" : totalSpent > 25_000_000 ? "silver" : "bronze";
