import { CATEGORY_MAP } from "@/features/products/data/catalog";
import type { CategorySlug, Product } from "@/features/products/types";
import * as products from "@/server/repositories/products";

/**
 * Database-backed catalogue reads for **server components**.
 *
 * These are the async equivalents of `features/products/lib/selectors` (which
 * reads the static seed module). Everything here hits PostgreSQL, so anything
 * the admin panel changes shows up on the storefront immediately.
 *
 * Client components must receive products as props from a server parent.
 */

export const allProducts = (): Promise<Product[]> => products.listProducts({ limit: 500 });

export const getProductBySlug = (slug: string): Promise<Product | null> =>
  products.getProductBySlug(slug);

export const getProductById = (id: string): Promise<Product | null> => products.getProductById(id);

export const getProductsByIds = (ids: string[]): Promise<Product[]> =>
  products.getProductsByIds(ids);

export const getProductsBySlugs = (slugs: string[]): Promise<Product[]> =>
  products.getProductsBySlugs(slugs);

export const getFeaturedProducts = (limit = 4): Promise<Product[]> =>
  products.getFeaturedProducts(limit);

export const getNewArrivals = (limit = 4): Promise<Product[]> => products.getNewArrivals(limit);

export const getBestSellers = (limit = 4): Promise<Product[]> => products.getBestSellers(limit);

export const getOnSaleProducts = (limit = 4): Promise<Product[]> =>
  products.getOnSaleProducts(limit);

export const getProductsByCategory = (category: CategorySlug, limit = 4): Promise<Product[]> =>
  products.getProductsByCategory(category, limit);

export const getRelatedProducts = (product: Product, limit = 4): Promise<Product[]> =>
  products.getRelatedProducts(product, limit);

export const searchProducts = (query: string, limit = 6): Promise<Product[]> =>
  products.searchProducts(query, limit);

export const categoryCounts = (): Promise<Record<string, number>> => products.categoryCounts();

export const catalogueStats = () => products.catalogueStats();

export const productFacets = () => products.productFacets();

/** Categories are a static reference table — safe to read synchronously. */
export const categoryBySlug = (slug: CategorySlug) => CATEGORY_MAP[slug];
