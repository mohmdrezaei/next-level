import type { NextRequest } from "next/server";

import { resolveCustomerScope } from "@/server/api-auth";
import { notFound, ok, withApi } from "@/server/http";
import {
  deleteAddress,
  getAddress,
  updateAddress,
  type AddressInput,
} from "@/server/repositories/addresses";
import { boolOptional, parseBody, phoneOptional, strOptional } from "@/server/validate";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

/** Fields a shopper may patch on an address. All optional — PATCH is partial. */
const addressPatchShape = {
  title: strOptional({ label: "عنوان نشانی", max: 60 }),
  fullName: strOptional({ label: "نام گیرنده", min: 2, max: 80 }),
  phone: phoneOptional(),
  province: strOptional({ label: "استان", max: 60 }),
  city: strOptional({ label: "شهر", max: 60 }),
  line1: strOptional({ label: "نشانی", max: 500 }),
  postalCode: strOptional({
    label: "کد پستی",
    max: 10,
    latinDigits: true,
    pattern: /^\d{10}$/,
    patternMessage: "کد پستی باید ۱۰ رقم باشد.",
  }),
  isDefault: boolOptional(),
} as const;

/**
 * PATCH /api/addresses/:id
 *
 * IDOR protection: the caller's customer scope is resolved from the session and
 * passed into the repository, which folds it into the `WHERE` clause. A shopper
 * who guesses another address id gets a `404` — the same answer as a genuinely
 * missing address, so the endpoint leaks nothing about other accounts.
 */
export async function PATCH(request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const { id } = await params;
    const scope = await resolveCustomerScope();

    const existing = await getAddress(id, scope);
    if (!existing) throw notFound("نشانی مورد نظر یافت نشد.");

    const body = await parseBody(request, addressPatchShape);

    const merged: AddressInput = {
      title: body.title ?? existing.title,
      fullName: body.fullName ?? existing.fullName,
      phone: body.phone ?? existing.phone,
      province: body.province ?? existing.province,
      city: body.city ?? existing.city,
      line1: body.line1 ?? existing.line1,
      postalCode: body.postalCode ?? existing.postalCode,
      isDefault: body.isDefault ?? existing.isDefault,
    };

    return ok(await updateAddress(id, merged, scope));
  });
}

/** DELETE /api/addresses/:id */
export async function DELETE(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const { id } = await params;
    const scope = await resolveCustomerScope();

    return ok(await deleteAddress(scope, id));
  });
}
