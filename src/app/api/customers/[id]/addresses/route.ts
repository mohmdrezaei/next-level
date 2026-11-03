import type { NextRequest } from "next/server";

import { requireCustomerAccess } from "@/server/api-auth";
import { ok, withApi } from "@/server/http";
import { createAddress, listAddresses } from "@/server/repositories/addresses";
import { boolOptional, parseBody, phone, str, strOptional } from "@/server/validate";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

/** GET /api/customers/:id/addresses — the customer's saved addresses. */
export async function GET(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const { id } = await params;
    await requireCustomerAccess(id);
    return ok(await listAddresses(id));
  });
}

/**
 * POST /api/customers/:id/addresses — add an address.
 *
 * `requireCustomerAccess` rejects a shopper addressing another customer's
 * ledger row (staff may address any). Fields are validated and sanitised before
 * the repository normalises them again.
 */
export async function POST(request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const { id } = await params;
    await requireCustomerAccess(id);

    const body = await parseBody(request, {
      title: strOptional({ label: "عنوان نشانی", max: 60 }),
      fullName: str({ label: "نام گیرنده", min: 2, max: 80 }),
      phone: phone(),
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
      isDefault: boolOptional(),
    });

    return ok(await createAddress(id, body), undefined, 201);
  });
}
