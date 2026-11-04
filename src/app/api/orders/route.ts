import type { NextRequest } from "next/server";

import type { PaymentMethodId, ShippingMethodId } from "@/lib/constants";
import { getApiUser, requireApiUser } from "@/server/api-auth";
import { ok, paginationMeta, readPagination, withApi } from "@/server/http";
import { countOrders, createOrder, listOrders, type OrderQuery } from "@/server/repositories/orders";
import { ensureCustomerForUser } from "@/server/repositories/users";
import {
  arrayOf,
  emailOptional,
  intOptional,
  object,
  parseBody,
  phoneOptional,
  str,
  strOptional,
} from "@/server/validate";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders
 *
 * Staff see every order; a signed-in customer only ever sees their own.
 * Query: `status`, `q`, `from`, `to`, `page`, `perPage`.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    const user = await requireApiUser();
    const searchParams = request.nextUrl.searchParams;
    const pagination = readPagination(searchParams);

    const query: OrderQuery = {
      status: searchParams.get("status") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      limit: pagination.perPage,
      offset: pagination.offset,
    };

    if (user.role !== "admin") {
      const customerId = await ensureCustomerForUser(user.id);
      query.customerId = customerId ?? "__none__";
    }

    const [items, total] = await Promise.all([listOrders(query), countOrders(query)]);
    return ok(items, paginationMeta(total, pagination));
  });
}

/**
 * POST /api/orders — place an order (checkout).
 *
 * The request may describe **what** is being bought; it may never describe
 * **who** it belongs to or **how much** it costs. Specifically:
 *
 * - prices, discounts, shipping and tax are recomputed server-side from the
 *   database (`priceCart`), so a tampered body cannot change the amount;
 * - `customerId` is taken from the session, never from the body, so an order
 *   cannot be attributed to — or billed against — another shopper's ledger;
 * - `status` is pinned to `pending`, so a caller cannot POST itself a
 *   `paid`/`delivered` order and skip fulfilment.
 *
 * Guest checkout is still allowed; such orders carry no customer id.
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
        { min: 1, max: 50, label: "اقلام سفارش" },
      ),
      address: object(
        {
          fullName: str({ label: "نام گیرنده", min: 2, max: 80 }),
          phone: str({ label: "شماره تماس", min: 8, max: 20 }),
          province: str({ label: "استان", min: 2, max: 60 }),
          city: str({ label: "شهر", min: 2, max: 60 }),
          line1: str({ label: "نشانی", min: 5, max: 500 }),
          postalCode: str({
            label: "کد پستی",
            min: 10,
            max: 10,
            latinDigits: true,
            pattern: /^\d{10}$/,
            patternMessage: "کد پستی باید ۱۰ رقم باشد.",
          }),
        },
        { label: "نشانی ارسال" },
      ),
      customerName: strOptional({ label: "نام", max: 80 }),
      customerPhone: phoneOptional(),
      customerEmail: emailOptional(),
      shippingMethod: strOptional({ label: "روش ارسال", max: 20 }),
      paymentMethod: strOptional({ label: "روش پرداخت", max: 20 }),
      couponCode: strOptional({ label: "کد تخفیف", max: 40, latinDigits: true }),
    });

    const user = await getApiUser();

    // Link to customer ledger if user is signed in
    let customerId =
      user ? ((await ensureCustomerForUser(user.id)) || user.id) : null;

    const customerPhone = body.customerPhone || body.address.phone || user?.phone || "";
    const customerName = body.customerName || body.address.fullName || user?.name || "مشتری گرامی";
    const customerEmail = body.customerEmail || user?.email || "";

    const order = await createOrder({
      items: body.items,
      address: body.address,
      shippingMethod: body.shippingMethod as ShippingMethodId | undefined,
      paymentMethod: body.paymentMethod as PaymentMethodId | undefined,
      couponCode: body.couponCode ?? null,
      customerId: customerId ?? undefined,
      customerName,
      customerPhone,
      customerEmail,
      status: "pending",
    });

    return ok(order, undefined, 201);
  });
}
