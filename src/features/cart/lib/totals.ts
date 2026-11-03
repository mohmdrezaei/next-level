import { FREE_SHIPPING_THRESHOLD, SHIPPING_METHODS, TAX_RATE, type ShippingMethodId } from "@/lib/constants";
import type { CartLine, CartTotals, Coupon } from "../types";

export interface TotalsConfig {
  freeShippingThreshold?: number;
  taxRate?: number;
  standardShipping?: number;
  expressShipping?: number;
}

interface ComputeInput {
  lines: CartLine[];
  coupon?: Coupon | null;
  shippingMethod?: ShippingMethodId;
  config?: TotalsConfig;
}

export function computeTotals({
  lines,
  coupon = null,
  shippingMethod = "standard",
  config,
}: ComputeInput): CartTotals {
  const threshold = config?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD;
  const effectiveTaxRate = config?.taxRate !== undefined ? config.taxRate : TAX_RATE;

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const discount = coupon ? Math.round(subtotal * coupon.rate) : 0;
  const net = Math.max(0, subtotal - discount);

  let methodPrice: number;
  if (shippingMethod === "pickup") {
    methodPrice = 0;
  } else if (shippingMethod === "express") {
    methodPrice = config?.expressShipping !== undefined ? config.expressShipping : 349_000;
  } else {
    methodPrice = config?.standardShipping !== undefined ? config.standardShipping : 149_000;
  }

  const qualifiesForFreeShipping = subtotal >= threshold || Boolean(coupon?.freeShipping);
  const shipping = subtotal === 0 || qualifiesForFreeShipping ? 0 : methodPrice;

  const tax = Math.round(net * effectiveTaxRate);
  const total = net + shipping + tax;

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total,
    itemCount,
    freeShippingRemaining: Math.max(0, threshold - subtotal),
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
