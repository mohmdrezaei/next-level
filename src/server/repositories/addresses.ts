/**
 * Saved shipping addresses, scoped to a customer.
 */
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { addresses } from "@/db/schema";
import type { Address } from "@/features/orders/types";
import { sanitizeString } from "@/lib/sanitize";

import { badRequest, notFound } from "../http";
import { newId } from "../ids";
import { cleanPhone, isValidPhone, toLatinDigits } from "../phone";

type AddressRow = typeof addresses.$inferSelect;

export interface AddressInput {
  title?: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  line1: string;
  postalCode: string;
  isDefault?: boolean;
}

function mapAddress(row: AddressRow): Address {
  return {
    id: row.id,
    title: row.title,
    fullName: row.fullName,
    phone: row.phone,
    province: row.province,
    city: row.city,
    line1: row.line1,
    postalCode: row.postalCode,
    isDefault: row.isDefault,
  };
}

export async function listAddresses(customerId: string): Promise<Address[]> {
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.customerId, customerId))
    .orderBy(desc(addresses.isDefault), asc(addresses.id));

  return rows.map(mapAddress);
}

/**
 * Ownership predicate.
 *
 * Every read and write of a single address goes through here, so the ownership
 * check lives in the SQL `WHERE` clause rather than in a separate "fetch, then
 * compare" step. A caller who does not own the row gets no row back at all,
 * which surfaces as a `404` — indistinguishable from "this address does not
 * exist", so the endpoint cannot be used to probe for other people's ids.
 *
 * `scopeCustomerId === null | undefined` means "no ownership restriction"
 * (used by admins).
 */
function ownershipCondition(id: string, scopeCustomerId?: string | null) {
  return scopeCustomerId
    ? and(eq(addresses.id, id), eq(addresses.customerId, scopeCustomerId))
    : eq(addresses.id, id);
}

export async function getAddress(
  id: string,
  scopeCustomerId?: string | null,
): Promise<Address | null> {
  const rows = await db
    .select()
    .from(addresses)
    .where(ownershipCondition(id, scopeCustomerId))
    .limit(1);

  return rows[0] ? mapAddress(rows[0]) : null;
}

/** The customer that owns an address, or null when it does not exist. */
export async function getAddressOwner(id: string): Promise<string | null> {
  const rows = await db
    .select({ customerId: addresses.customerId })
    .from(addresses)
    .where(eq(addresses.id, id))
    .limit(1);

  return rows[0]?.customerId ?? null;
}

/**
 * Normalise + validate an address payload.
 *
 * Free-text fields are stripped of markup and length-capped before validation
 * so that nothing dangerous is ever persisted, and the phone is normalised to
 * `09xxxxxxxxx` regardless of the digits/prefixes the shopper typed.
 */
function prepare(input: AddressInput): AddressInput & { fullName: string; phone: string; province: string; city: string; line1: string; postalCode: string } {
  const prepared = {
    title: sanitizeString(input?.title ?? "", 60) || "نشانی",
    fullName: sanitizeString(input?.fullName ?? "", 80),
    phone: cleanPhone(String(input?.phone ?? "")),
    province: sanitizeString(input?.province ?? "", 60),
    city: sanitizeString(input?.city ?? "", 60),
    line1: sanitizeString(input?.line1 ?? "", 500),
    postalCode: toLatinDigits(String(input?.postalCode ?? "").trim()).replace(/\D/g, "").slice(0, 10),
    isDefault: Boolean(input?.isDefault),
  };

  if (!prepared.fullName) throw badRequest("نام گیرنده الزامی است.", { field: "fullName" });
  if (!isValidPhone(prepared.phone)) {
    throw badRequest("شماره تماس باید ۱۱ رقم و با ۰۹ شروع شود.", { field: "phone" });
  }
  if (!prepared.province) throw badRequest("استان الزامی است.", { field: "province" });
  if (!prepared.city) throw badRequest("شهر الزامی است.", { field: "city" });
  if (!prepared.line1) throw badRequest("نشانی الزامی است.", { field: "line1" });
  if (!/^\d{10}$/.test(prepared.postalCode)) {
    throw badRequest("کد پستی باید ۱۰ رقم باشد.", { field: "postalCode" });
  }

  return prepared;
}

/** Only one default per customer — flip the others off first. */
async function clearDefaults(customerId: string, exceptId?: string): Promise<void> {
  const rows = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(eq(addresses.customerId, customerId));

  for (const row of rows) {
    if (row.id === exceptId) continue;
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.id, row.id));
  }
}

export async function createAddress(customerId: string, input: AddressInput): Promise<Address> {
  const prepared = prepare(input);

  const id = newId("addr");

  await db.insert(addresses).values({
    id,
    customerId,
    title: prepared.title,
    fullName: prepared.fullName,
    phone: prepared.phone,
    province: prepared.province,
    city: prepared.city,
    line1: prepared.line1,
    postalCode: prepared.postalCode,
    isDefault: prepared.isDefault,
  });

  if (prepared.isDefault) await clearDefaults(customerId, id);

  const created = await getAddress(id, customerId);
  if (!created) throw notFound("نشانی ذخیره شد اما بازخوانی نشد.");
  return created;
}

/**
 * Update an address the caller is allowed to touch.
 *
 * `scopeCustomerId` is folded into the `WHERE` of both the lookup and the
 * `UPDATE`, so even a race between the two cannot rewrite someone else's row.
 */
export async function updateAddress(
  id: string,
  input: AddressInput,
  scopeCustomerId?: string | null,
): Promise<Address> {
  const rows = await db
    .select()
    .from(addresses)
    .where(ownershipCondition(id, scopeCustomerId))
    .limit(1);

  const existing = rows[0];
  if (!existing) throw notFound("نشانی مورد نظر یافت نشد.");

  const prepared = prepare({ ...input, isDefault: input.isDefault ?? existing.isDefault });

  const updated = await db
    .update(addresses)
    .set({
      title: prepared.title || existing.title,
      fullName: prepared.fullName,
      phone: prepared.phone,
      province: prepared.province,
      city: prepared.city,
      line1: prepared.line1,
      postalCode: prepared.postalCode,
      isDefault: prepared.isDefault,
    })
    .where(ownershipCondition(id, scopeCustomerId))
    .returning({ id: addresses.id });

  if (!updated.length) throw notFound("نشانی مورد نظر یافت نشد.");

  if (prepared.isDefault) await clearDefaults(existing.customerId, id);

  const result = await getAddress(id, scopeCustomerId);
  if (!result) throw notFound("نشانی مورد نظر یافت نشد.");
  return result;
}

export async function deleteAddress(
  scopeCustomerId: string | null,
  id: string,
): Promise<Address> {
  const rows = await db
    .select()
    .from(addresses)
    .where(ownershipCondition(id, scopeCustomerId))
    .limit(1);

  const existing = rows[0];
  if (!existing) throw notFound("نشانی مورد نظر یافت نشد.");

  await db.delete(addresses).where(ownershipCondition(id, scopeCustomerId));
  return mapAddress(existing);
}

export async function setDefaultAddress(
  scopeCustomerId: string | null,
  id: string,
): Promise<Address> {
  const rows = await db
    .select()
    .from(addresses)
    .where(ownershipCondition(id, scopeCustomerId))
    .limit(1);

  const existing = rows[0];
  if (!existing) throw notFound("نشانی مورد نظر یافت نشد.");

  await clearDefaults(existing.customerId, id);

  await db
    .update(addresses)
    .set({ isDefault: true })
    .where(ownershipCondition(id, scopeCustomerId));

  const updated = await getAddress(id, scopeCustomerId);
  if (!updated) throw notFound("نشانی مورد نظر یافت نشد.");
  return updated;
}
