import type { NextRequest } from "next/server";

import type { OrderStatus } from "@/features/orders/types";
import { requireApiAdmin } from "@/server/api-auth";
import { badRequest, ok, readJson, withApi } from "@/server/http";
import { changeOrderStatus } from "@/server/repositories/orders";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ code: string }>;
}

/**
 * PATCH /api/orders/:code/status  (admin only)
 * Body: `{ "status": "shipped" }`
 */
export async function PATCH(request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { code } = await params;

    const body = await readJson<{ status?: OrderStatus }>(request);
    if (!body.status) throw badRequest("وضعیت جدید سفارش ارسال نشده است.", { field: "status" });

    return ok(await changeOrderStatus(code, body.status));
  });
}
