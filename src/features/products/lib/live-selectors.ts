import { CATEGORY_MAP } from "@/features/products/data/catalog";
import type { CategorySlug, Product } from "@/features/products/types";
import * as products from "@/server/repositories/products";
import * as staticSelectors from "@/features/products/lib/selectors";

/**
 * Database-backed catalogue reads for **server components**.
 *
 * Hits PostgreSQL for live store mutations, with an automatic resilient
 * fallback to the seeded catalogue if the database connection is cold or down.
 */

export const allProducts = async (): Promise<Product[]> => {
  try {
    return await products.listProducts({ limit: 500 });
  } catch {
    return staticSelectors.allProducts();
  }
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const res = await products.getProductBySlug(slug);
    return res ?? staticSelectors.getProductBySlug(slug) ?? null;
  } catch {
    return staticSelectors.getProductBySlug(slug) ?? null;
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const res = await products.getProductById(id);
    return res ?? staticSelectors.getProductById(id) ?? null;
  } catch {
    return staticSelectors.getProductById(id) ?? null;
  }
};

export const getProductsByIds = async (ids: string[]): Promise<Product[]> => {
  try {
    return await products.getProductsByIds(ids);
  } catch {
    return staticSelectors.getProductsByIds(ids);
  }
};

export const getProductsBySlugs = async (slugs: string[]): Promise<Product[]> => {
  try {
    return await products.getProductsBySlugs(slugs);
  } catch {
    return slugs
      .map((slug) => staticSelectors.getProductBySlug(slug))
      .filter((p): p is Product => Boolean(p));
  }
};

export const getFeaturedProducts = async (limit = 4): Promise<Product[]> => {
  try {
    return await products.getFeaturedProducts(limit);
  } catch {
    return staticSelectors.getFeaturedProducts(limit);
  }
};

export const getNewArrivals = async (limit = 4): Promise<Product[]> => {
  try {
    return await products.getNewArrivals(limit);
  } catch {
    return staticSelectors.getNewArrivals(limit);
  }
};

export const getBestSellers = async (limit = 4): Promise<Product[]> => {
  try {
    return await products.getBestSellers(limit);
  } catch {
    return staticSelectors.getBestSellers(limit);
  }
};

export const getOnSaleProducts = async (limit = 4): Promise<Product[]> => {
  try {
    return await products.getOnSaleProducts(limit);
  } catch {
    return staticSelectors.getOnSaleProducts(limit);
  }
};

export const getProductsByCategory = async (category: CategorySlug, limit = 4): Promise<Product[]> => {
  try {
    return await products.getProductsByCategory(category, limit);
  } catch {
    return staticSelectors.getProductsByCategory(category, limit);
  }
};

export const getRelatedProducts = async (product: Product, limit = 4): Promise<Product[]> => {
  try {
    return await products.getRelatedProducts(product, limit);
  } catch {
    return staticSelectors.getRelatedProducts(product, limit);
  }
};

export const searchProducts = async (query: string, limit = 6): Promise<Product[]> => {
  try {
    return await products.searchProducts(query, limit);
  } catch {
    return staticSelectors.searchProducts(query, limit);
  }
};

export const categoryCounts = async (): Promise<Record<string, number>> => {
  try {
    return await products.categoryCounts();
  } catch {
    return staticSelectors.categoryCounts();
  }
};

export const catalogueStats = async () => {
  try {
    return await products.catalogueStats();
  } catch {
    return staticSelectors.catalogueStats();
  }
};

export const productFacets = async () => {
  try {
    return await products.productFacets();
  } catch {
    const list = staticSelectors.allProducts();
    return {
      sizes: ["S", "M", "L", "XL", "XXL", "40", "41", "42", "43", "44", "45", "ONE"],
      colors: Array.from(new Set(list.flatMap((p) => p.colors.map((c) => c.name)))),
      price: {
        min: Math.min(...list.map((p) => p.price)),
        max: Math.max(...list.map((p) => p.price)),
      },
    };
  }
};

/** Categories are a static reference table — safe to read synchronously. */
export const categoryBySlug = (slug: CategorySlug) => CATEGORY_MAP[slug];
