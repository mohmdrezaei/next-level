import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { ok, readJson, withApi } from "@/server/http";
import { createCoupon, listCoupons } from "@/server/repositories/coupons";

export const dynamic = "force-dynamic";

/** GET /api/coupons (admin only). */
export async function GET() {
  return withApi(async () => {
    await requireApiAdmin();
    return ok(await listCoupons());
  });
}

/** POST /api/coupons — create or reactivate a discount code (admin only). */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    await requireApiAdmin();

    const body = await readJson<{
      code?: string;
      label?: string;
      rate?: number;
      minSubtotal?: number;
      freeShipping?: boolean;
    }>(request);

    const coupon = await createCoupon({
      code: String(body.code ?? ""),
      label: body.label,
      rate: body.rate,
      minSubtotal: body.minSubtotal,
      freeShipping: body.freeShipping,
    });

    return ok(coupon, undefined, 201);
  });
}
