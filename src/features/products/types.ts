export type CategorySlug =
  | "outerwear"
  | "suits"
  | "shirts"
  | "knitwear"
  | "trousers"
  | "footwear"
  | "accessories";

export interface Category {
  slug: CategorySlug;
  title: string;
  latinTitle: string;
  description: string;
}

export interface ProductColor {
  name: string;
  hex: string;
  /** Tailwind-independent swatch accent used for art generation. */
  accent: string;
}

export interface ProductVariant {
  size: string;
  stock: number;
}

export interface ProductImage {
  src: string;
  alt: string;
}

export type ProductBadge = "new" | "limited" | "bestseller" | "sale";

export interface Product {
  id: string;
  slug: string;
  name: string;
  latinName: string;
  category: CategorySlug;
  price: number;
  compareAtPrice: number | null;
  shortDescription: string;
  description: string;
  story: string;
  materials: string[];
  care: string[];
  highlights: string[];
  colors: ProductColor[];
  variants: ProductVariant[];
  images: ProductImage[];
  rating: number;
  reviewCount: number;
  badges: ProductBadge[];
  tags: string[];
  createdAt: string;
  featured: boolean;
}

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "rating";

export interface ProductFilters {
  q: string;
  categories: CategorySlug[];
  sizes: string[];
  colors: string[];
  minPrice: number;
  maxPrice: number;
  onlyDiscount: boolean;
  onlyInStock: boolean;
  sort: SortKey;
}

export interface ProductReview {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  verified: boolean;
  helpful: number;
}
