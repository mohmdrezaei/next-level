import type { CategorySlug, Product } from "../types";
import { CATEGORIES, CATEGORY_MAP, PRODUCTS, PRODUCT_BY_ID, PRODUCT_BY_SLUG } from "../data/catalog";
import { isOnSale, sortProducts } from "./query";

/** Static catalogue accessors — safe to import from client components. */
export const allProducts = (): Product[] => PRODUCTS;

export const getProductBySlug = (slug: string): Product | undefined => PRODUCT_BY_SLUG.get(slug);

export const getProductById = (id: string): Product | undefined => PRODUCT_BY_ID.get(id);

export const getProductsByIds = (ids: string[]): Product[] =>
  ids.map((id) => PRODUCT_BY_ID.get(id)).filter((product): product is Product => Boolean(product));

export const getFeaturedProducts = (limit = 4): Product[] =>
  sortProducts(
    PRODUCTS.filter((product) => product.featured),
    "featured",
  ).slice(0, limit);

export const getNewArrivals = (limit = 4): Product[] =>
  sortProducts(PRODUCTS, "newest").slice(0, limit);

export const getBestSellers = (limit = 4): Product[] =>
  sortProducts(PRODUCTS, "rating")
    .filter((product) => product.reviewCount > 60)
    .slice(0, limit);

export const getOnSaleProducts = (limit = 4): Product[] =>
  sortProducts(PRODUCTS.filter(isOnSale), "featured").slice(0, limit);

export const getProductsByCategory = (category: CategorySlug, limit = 4): Product[] =>
  sortProducts(
    PRODUCTS.filter((product) => product.category === category),
    "featured",
  ).slice(0, limit);

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const scored = PRODUCTS.filter((candidate) => candidate.id !== product.id).map((candidate) => {
    let score = 0;
    if (candidate.category === product.category) score += 4;
    score += candidate.colors.filter((color) =>
      product.colors.some((own) => own.name === color.name),
    ).length;
    score += Math.abs(candidate.price - product.price) < product.price * 0.35 ? 1 : 0;
    return { candidate, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.candidate.rating - a.candidate.rating)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function searchProducts(query: string, limit = 6): Product[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return PRODUCTS.filter((product) =>
    [product.name, product.latinName, product.shortDescription]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  ).slice(0, limit);
}

export const categoryBySlug = (slug: CategorySlug) => CATEGORY_MAP[slug];

export const categoryCounts = (): Record<string, number> =>
  CATEGORIES.reduce<Record<string, number>>((acc, category) => {
    acc[category.slug] = PRODUCTS.filter((product) => product.category === category.slug).length;
    return acc;
  }, {});

export const catalogueStats = () => ({
  products: PRODUCTS.length,
  categories: CATEGORIES.length,
  reviews: PRODUCTS.reduce((sum, product) => sum + product.reviewCount, 0),
  rating: PRODUCTS.reduce((sum, product) => sum + product.rating, 0) / (PRODUCTS.length || 1),
});
