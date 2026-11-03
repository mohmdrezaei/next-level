import type { CategorySlug, Product, ProductFilters, SortKey } from "../types";
import { PRICE_BOUNDS } from "../data/catalog";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "پیشنهاد Next Level" },
  { value: "newest", label: "جدیدترین" },
  { value: "price-asc", label: "ارزان‌ترین" },
  { value: "price-desc", label: "گران‌ترین" },
  { value: "rating", label: "بیشترین امتیاز" },
];

export const PAGE_SIZE = 9;

export function createDefaultFilters(): ProductFilters {
  return {
    q: "",
    categories: [],
    sizes: [],
    colors: [],
    minPrice: PRICE_BOUNDS.min,
    maxPrice: PRICE_BOUNDS.max,
    onlyDiscount: false,
    onlyInStock: false,
    sort: "featured",
  };
}

/** Normalise Persian/Arabic characters so search behaves predictably. */
export function normalize(input: string): string {
  return input
    .replace(/[\u064A\u0649]/g, "\u06CC")
    .replace(/\u0643/g, "\u06A9")
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export const productStock = (product: Product): number =>
  product.variants.reduce((sum, variant) => sum + variant.stock, 0);

export const isInStock = (product: Product): boolean => productStock(product) > 0;

export const isOnSale = (product: Product): boolean =>
  product.compareAtPrice !== null && product.compareAtPrice > product.price;

export function matchesSearch(product: Product, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = normalize(
    [product.name, product.latinName, product.shortDescription, product.category].join(" "),
  );
  const needles = normalize(query).split(" ").filter(Boolean);
  return needles.every((needle) => haystack.includes(needle));
}

export function matchesFilters(product: Product, filters: ProductFilters): boolean {
  if (!matchesSearch(product, filters.q)) return false;
  if (filters.categories.length && !filters.categories.includes(product.category)) return false;
  if (filters.onlyDiscount && !isOnSale(product)) return false;
  if (filters.onlyInStock && !isInStock(product)) return false;
  if (product.price < filters.minPrice || product.price > filters.maxPrice) return false;

  if (filters.sizes.length) {
    const available = product.variants.filter((variant) => variant.stock > 0).map((v) => v.size);
    if (!filters.sizes.some((size) => available.includes(size))) return false;
  }

  if (filters.colors.length) {
    const palette = product.colors.map((color) => color.name);
    if (!filters.colors.some((name) => palette.includes(name))) return false;
  }

  return true;
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = [...products];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "rating":
      return list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "featured":
    default:
      return list.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          b.rating * Math.log10(b.reviewCount + 10) - a.rating * Math.log10(a.reviewCount + 10),
      );
  }
}

export function applyFilters(products: Product[], filters: ProductFilters): Product[] {
  return sortProducts(
    products.filter((product) => matchesFilters(product, filters)),
    filters.sort,
  );
}

export function isFilterActive(filters: ProductFilters): boolean {
  const defaults = createDefaultFilters();
  return (
    filters.q.trim().length > 0 ||
    filters.categories.length > 0 ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.onlyDiscount ||
    filters.onlyInStock ||
    filters.sort !== defaults.sort ||
    filters.minPrice !== defaults.minPrice ||
    filters.maxPrice !== defaults.maxPrice
  );
}

export function activeFilterCount(filters: ProductFilters): number {
  return (
    filters.categories.length +
    filters.sizes.length +
    filters.colors.length +
    (filters.onlyDiscount ? 1 : 0) +
    (filters.onlyInStock ? 1 : 0) +
    (filters.minPrice !== PRICE_BOUNDS.min || filters.maxPrice !== PRICE_BOUNDS.max ? 1 : 0)
  );
}

type SearchParamsLike = Record<string, string | string[] | undefined>;

const asArray = (value: string | string[] | undefined): string[] => {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : value.split(",");
};

/** Read ProductFilters out of a Next.js `searchParams` object. */
export function readFilters(searchParams: SearchParamsLike): ProductFilters {
  const defaults = createDefaultFilters();
  const num = (value: string | string[] | undefined, fallback: number) => {
    const raw = Array.isArray(value) ? value[0] : value;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && raw !== undefined && raw !== "" ? parsed : fallback;
  };

  const sortRaw = (Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort) ?? "";
  const sort = SORT_OPTIONS.some((option) => option.value === sortRaw)
    ? (sortRaw as SortKey)
    : defaults.sort;

  return {
    q: (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "",
    categories: asArray(searchParams.category) as CategorySlug[],
    sizes: asArray(searchParams.size),
    colors: asArray(searchParams.color),
    minPrice: num(searchParams.minPrice, defaults.minPrice),
    maxPrice: num(searchParams.maxPrice, defaults.maxPrice),
    onlyDiscount: searchParams.onlyDiscount === "1",
    onlyInStock: searchParams.onlyInStock === "1",
    sort,
  };
}

export function serializeFilters(filters: ProductFilters): Record<string, string> {
  const defaults = createDefaultFilters();
  const params: Record<string, string> = {};
  if (filters.q) params.q = filters.q;
  if (filters.categories.length) params.category = filters.categories.join(",");
  if (filters.sizes.length) params.size = filters.sizes.join(",");
  if (filters.colors.length) params.color = filters.colors.join(",");
  if (filters.minPrice !== defaults.minPrice) params.minPrice = String(filters.minPrice);
  if (filters.maxPrice !== defaults.maxPrice) params.maxPrice = String(filters.maxPrice);
  if (filters.onlyDiscount) params.onlyDiscount = "1";
  if (filters.onlyInStock) params.onlyInStock = "1";
  if (filters.sort !== defaults.sort) params.sort = filters.sort;
  return params;
}

export function filtersToQueryString(filters: ProductFilters): string {
  const params = new URLSearchParams(serializeFilters(filters));
  const value = params.toString();
  return value ? `?${value}` : "";
}

export interface Facets {
  categories: { slug: CategorySlug; count: number }[];
  sizes: { size: string; count: number }[];
  colors: { name: string; hex: string; count: number }[];
  bounds: { min: number; max: number };
}

export function buildFacets(products: Product[]): Facets {
  const categoryCount = new Map<CategorySlug, number>();
  const sizeCount = new Map<string, number>();
  const colorCount = new Map<string, { hex: string; count: number }>();

  for (const product of products) {
    categoryCount.set(product.category, (categoryCount.get(product.category) ?? 0) + 1);

    for (const variant of product.variants) {
      if (variant.stock > 0) {
        sizeCount.set(variant.size, (sizeCount.get(variant.size) ?? 0) + 1);
      }
    }

    for (const color of product.colors) {
      const existing = colorCount.get(color.name);
      colorCount.set(color.name, { hex: color.hex, count: (existing?.count ?? 0) + 1 });
    }
  }

  const prices = products.map((product) => product.price);

  return {
    categories: [...categoryCount].map(([slug, count]) => ({ slug, count })),
    sizes: [...sizeCount]
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => a.size.localeCompare(b.size, "en")),
    colors: [...colorCount].map(([name, value]) => ({ name, hex: value.hex, count: value.count })),
    bounds: {
      min: prices.length ? Math.min(...prices) : PRICE_BOUNDS.min,
      max: prices.length ? Math.max(...prices) : PRICE_BOUNDS.max,
    },
  };
}
