import type { NextRequest } from "next/server";

import { requireApiAdmin, requireApiUser } from "@/server/api-auth";
import { forbidden, notFound, ok, withApi } from "@/server/http";
import { deleteOrder, getOrderByCode } from "@/server/repositories/orders";
import { ensureCustomerForUser } from "@/server/repositories/users";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ code: string }>;
}

/** GET /api/orders/:code — staff, or the customer who placed it. */
export async function GET(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const user = await requireApiUser();
    const { code } = await params;

    const order = await getOrderByCode(code);
    if (!order) throw notFound("سفارش مورد نظر یافت نشد.");

    if (user.role !== "admin") {
      const customerId = await ensureCustomerForUser(user.id);
      if (!customerId || order.customerId !== customerId) throw forbidden();
    }

    return ok(order);
  });
}

/** DELETE /api/orders/:code (admin only). */
export async function DELETE(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { code } = await params;
    return ok(await deleteOrder(code));
  });
}
