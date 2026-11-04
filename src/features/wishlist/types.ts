import type { Product } from "@/features/products/types";

export interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  latinName: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  category: string;
  addedAt: number;
}

/** Map a catalogue product into the slim shape the wishlist UI renders. */
export function toWishlistItem(product: Product): WishlistItem {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    latinName: product.latinName,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    image: product.images[0]?.src ?? "",
    category: product.category,
    addedAt: Date.now(),
  };
}
