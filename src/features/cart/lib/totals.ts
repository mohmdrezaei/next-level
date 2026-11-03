import { FREE_SHIPPING_THRESHOLD, SHIPPING_METHODS, TAX_RATE, type ShippingMethodId } from "@/lib/constants";
import type { CartLine, CartTotals, Coupon } from "../types";

interface ComputeInput {
  lines: CartLine[];
  coupon?: Coupon | null;
  shippingMethod?: ShippingMethodId;
}

export function computeTotals({
  lines,
  coupon = null,
  shippingMethod = "standard",
}: ComputeInput): CartTotals {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const discount = coupon ? Math.round(subtotal * coupon.rate) : 0;
  const net = Math.max(0, subtotal - discount);

  const method = SHIPPING_METHODS.find((item) => item.id === shippingMethod) ?? SHIPPING_METHODS[0];
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || Boolean(coupon?.freeShipping);
  const shipping = subtotal === 0 || qualifiesForFreeShipping ? 0 : method.price;

  const tax = Math.round(net * TAX_RATE);
  const total = net + shipping + tax;

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total,
    itemCount,
    freeShippingRemaining: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    qualifiesForFreeShipping,
  };
}

/** Savings vs. compare-at prices across the cart. */
export function computeSavings(lines: CartLine[]): number {
  return lines.reduce((sum, line) => {
    if (!line.compareAtPrice || line.compareAtPrice <= line.price) return sum;
    return sum + (line.compareAtPrice - line.price) * line.quantity;
  }, 0);
}
