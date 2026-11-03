import type { NextRequest } from "next/server";

import { PAYMENT_METHODS, SHIPPING_METHODS, type ShippingMethodId } from "@/lib/constants";
import { ok, withApi } from "@/server/http";
import { priceCart } from "@/server/repositories/orders";
import { arrayOf, intOptional, object, parseBody, str, strOptional } from "@/server/validate";

export const dynamic = "force-dynamic";

/**
 * POST /api/cart/price
 *
 * Recompute a cart against live catalogue prices: validates stock, applies the
 * coupon, and returns shipping/tax/total. The client-side cart store keeps the
 * UI state; this endpoint is the authority on money.
 *
 * Body: `{ items: [{ productId, size, color, quantity }], shippingMethod?, couponCode? }`
 *
 * NOTE: the client sends only *what* it wants to buy, never *what it costs*.
 * Prices, discounts, shipping and tax are all derived from the database.
 */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    const body = await parseBody(request, {
      items: arrayOf(
        object({
          productId: str({ label: "شناسهٔ محصول", min: 1, max: 64 }),
          size: strOptional({ label: "سایز", max: 20 }),
          color: strOptional({ label: "رنگ", max: 40 }),
          quantity: intOptional({ label: "تعداد", min: 1, max: 50, default: 1 }),
        }),
        { min: 1, max: 50, label: "اقلام سبد خرید" },
      ),
      shippingMethod: strOptional({ label: "روش ارسال", max: 20 }),
      couponCode: strOptional({ label: "کد تخفیف", max: 40, latinDigits: true }),
    });

    const priced = await priceCart({
      items: body.items,
      // The repository re-checks this against `SHIPPING_METHODS` and falls back
      // to "standard", so an unknown value can never pick an arbitrary price.
      shippingMethod: body.shippingMethod as ShippingMethodId | undefined,
      couponCode: body.couponCode,
    });

    return ok({
      ...priced,
      itemCount: priced.items.reduce((sum, item) => sum + item.quantity, 0),
      availableShippingMethods: SHIPPING_METHODS,
      availablePaymentMethods: PAYMENT_METHODS,
    });
  });
}
