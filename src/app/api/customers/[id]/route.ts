import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { notFound, ok, readJson, withApi } from "@/server/http";
import {
  deleteCustomer,
  getCustomerById,
  updateCustomer,
  type CustomerInput,
} from "@/server/repositories/customers";
import { listOrdersForCustomer } from "@/server/repositories/orders";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/customers/:id  (admin only)
 * Add `?withOrders=1` to include the customer's order history.
 */
export async function GET(request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { id } = await params;

    const customer = await getCustomerById(id);
    if (!customer) throw notFound("مشتری مورد نظر یافت نشد.");

    const withOrders = ["1", "true"].includes(request.nextUrl.searchParams.get("withOrders") ?? "");
    if (!withOrders) return ok(customer);

    return ok({ ...customer, orders: await listOrdersForCustomer(id) });
  });
}

/** PATCH /api/customers/:id (admin only). */
export async function PATCH(request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { id } = await params;

    const existing = await getCustomerById(id);
    if (!existing) throw notFound("مشتری مورد نظر یافت نشد.");

    const body = await readJson<Partial<CustomerInput>>(request);

    const merged: CustomerInput = {
      name: body.name ?? existing.name,
      phone: body.phone ?? existing.phone,
      email: body.email ?? existing.email,
      city: body.city ?? existing.city,
      province: body.province ?? existing.province,
      joinedAt: body.joinedAt ?? existing.joinedAt,
      orders: body.orders ?? existing.orders,
      totalSpent: body.totalSpent ?? existing.totalSpent,
      lastOrderAt: body.lastOrderAt ?? existing.lastOrderAt,
    };

    return ok(await updateCustomer(id, merged));
  });
}

/** DELETE /api/customers/:id (admin only). */
export async function DELETE(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { id } = await params;
    return ok(await deleteCustomer(id));
  });
}
