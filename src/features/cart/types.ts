import type { Product } from "@/features/products/types";

export interface CartLine {
  /** Stable identity of a concrete variant: product + size + colour. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  latinName: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
  size: string;
  color: string;
  colorHex: string;
  quantity: number;
  maxQuantity: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  freeShippingRemaining: number;
  qualifiesForFreeShipping: boolean;
}

export interface Coupon {
  code: string;
  label: string;
  /** Ratio applied to the subtotal, e.g. 0.1 for 10%. */
  rate: number;
  minSubtotal: number;
  freeShipping?: boolean;
}

export const lineKey = (productId: string, size: string, color: string) =>
  `${productId}::${size}::${color}`;

export function toCartLine(
  product: Product,
  options: { size: string; color: string; colorHex: string; quantity: number },
): CartLine {
  const variant = product.variants.find((item) => item.size === options.size);
  return {
    key: lineKey(product.id, options.size, options.color),
    productId: product.id,
    slug: product.slug,
    name: product.name,
    latinName: product.latinName,
    image: product.images[0]?.src ?? "",
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    size: options.size,
    color: options.color,
    colorHex: options.colorHex,
    quantity: options.quantity,
    maxQuantity: variant?.stock ?? 1,
  };
}
