import type { NextRequest } from "next/server";

import { ok, withApi } from "@/server/http";
import { validateCoupon } from "@/server/repositories/coupons";
import { int, parseBody, str } from "@/server/validate";

export const dynamic = "force-dynamic";

/**
 * POST /api/coupons/validate
 * Body: `{ "code": "NEXT10", "subtotal": 12000000 }`
 *
 * The coupon code is upper-cased and length-capped, and the subtotal is only
 * ever used to *display* a preview discount — the authoritative discount is
 * recomputed server-side from live catalogue prices at checkout.
 */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    const body = await parseBody(request, {
      code: str({ label: "کد تخفیف", min: 1, max: 40, latinDigits: true }),
      subtotal: int({ label: "مبلغ سبد خرید", min: 0, max: 10_000_000_000, default: 0 }),
    });

    const { coupon, error } = await validateCoupon(body.code, body.subtotal);

    if (error || !coupon) {
      return ok({ valid: false, coupon: null, error: error ?? "کد تخفیف معتبر نیست." });
    }

    return ok({
      valid: true,
      coupon,
      error: null,
      discount: Math.round(body.subtotal * coupon.rate),
    });
  });
}
