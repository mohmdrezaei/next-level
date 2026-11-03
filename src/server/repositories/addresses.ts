/**
 * Saved shipping addresses, scoped to a customer, with resilient database and memory store fallback.
 */
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { addresses } from "@/db/schema";
import type { Address } from "@/features/orders/types";
import { DEMO_ADDRESSES } from "@/features/orders/data/orders";
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

declare global {
  // eslint-disable-next-line no-var
  var __memoryAddresses: Map<string, Address[]> | undefined;
}

function getMemoryAddresses(): Map<string, Address[]> {
  if (!globalThis.__memoryAddresses) {
    globalThis.__memoryAddresses = new Map<string, Address[]>();
    globalThis.__memoryAddresses.set("c-001", [...DEMO_ADDRESSES]);
    globalThis.__memoryAddresses.set("c_demo", [...DEMO_ADDRESSES]);
  }
  return globalThis.__memoryAddresses;
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
  const memList = getMemoryAddresses().get(customerId) ?? [];

  try {
    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.customerId, customerId))
      .orderBy(desc(addresses.isDefault), asc(addresses.id));

    if (rows.length) {
      return rows.map(mapAddress);
    }
  } catch {
    // DB offline
  }

  if (memList.length) return memList;
  if (customerId === "c-001" || customerId === "c_demo") return [...DEMO_ADDRESSES];

  return [];
}

function ownershipCondition(id: string, scopeCustomerId?: string | null) {
  return scopeCustomerId
    ? and(eq(addresses.id, id), eq(addresses.customerId, scopeCustomerId))
    : eq(addresses.id, id);
}

export async function getAddress(
  id: string,
  scopeCustomerId?: string | null,
): Promise<Address | null> {
  // Check memory
  for (const [cId, list] of getMemoryAddresses().entries()) {
    if (scopeCustomerId && cId !== scopeCustomerId) continue;
    const found = list.find((a) => a.id === id);
    if (found) return found;
  }

  try {
    const rows = await db
      .select()
      .from(addresses)
      .where(ownershipCondition(id, scopeCustomerId))
      .limit(1);

    return rows[0] ? mapAddress(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function getAddressOwner(id: string): Promise<string | null> {
  for (const [cId, list] of getMemoryAddresses().entries()) {
    if (list.some((a) => a.id === id)) return cId;
  }

  try {
    const rows = await db
      .select({ customerId: addresses.customerId })
      .from(addresses)
      .where(eq(addresses.id, id))
      .limit(1);

    return rows[0]?.customerId ?? null;
  } catch {
    return null;
  }
}

function prepare(input: AddressInput): {
  title: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  line1: string;
  postalCode: string;
  isDefault: boolean;
} {
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

async function clearDefaults(customerId: string, exceptId?: string): Promise<void> {
  const memList = getMemoryAddresses().get(customerId);
  if (memList) {
    for (const item of memList) {
      if (item.id !== exceptId) item.isDefault = false;
    }
  }

  try {
    const rows = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.customerId, customerId));

    for (const row of rows) {
      if (row.id === exceptId) continue;
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.id, row.id));
    }
  } catch {
    // DB offline
  }
}

export async function createAddress(customerId: string, input: AddressInput): Promise<Address> {
  const prepared = prepare(input);
  const id = newId("addr");

  const addr: Address = {
    id,
    title: prepared.title ?? "نشانی",
    fullName: prepared.fullName,
    phone: prepared.phone,
    province: prepared.province,
    city: prepared.city,
    line1: prepared.line1,
    postalCode: prepared.postalCode,
    isDefault: prepared.isDefault,
  };

  const list = getMemoryAddresses().get(customerId) ?? [];
  if (prepared.isDefault) {
    for (const a of list) a.isDefault = false;
  }
  list.push(addr);
  getMemoryAddresses().set(customerId, list);

  try {
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
  } catch {
    // DB offline
  }

  return addr;
}

export async function updateAddress(
  id: string,
  input: AddressInput,
  scopeCustomerId?: string | null,
): Promise<Address> {
  const prepared = prepare(input);

  // Update memory
  for (const [cId, list] of getMemoryAddresses().entries()) {
    if (scopeCustomerId && cId !== scopeCustomerId) continue;
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...prepared, id };
      if (prepared.isDefault) {
        for (let i = 0; i < list.length; i++) {
          if (i !== idx) list[i].isDefault = false;
        }
      }
      return list[idx];
    }
  }

  try {
    await db
      .update(addresses)
      .set({
        title: prepared.title,
        fullName: prepared.fullName,
        phone: prepared.phone,
        province: prepared.province,
        city: prepared.city,
        line1: prepared.line1,
        postalCode: prepared.postalCode,
        isDefault: prepared.isDefault,
      })
      .where(ownershipCondition(id, scopeCustomerId));

    const result = await getAddress(id, scopeCustomerId);
    if (result) return result;
  } catch {
    // DB offline
  }

  throw notFound("نشانی مورد نظر یافت نشد.");
}

export async function deleteAddress(
  scopeCustomerId: string | null,
  id: string,
): Promise<Address> {
  for (const [cId, list] of getMemoryAddresses().entries()) {
    if (scopeCustomerId && cId !== scopeCustomerId) continue;
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      const [removed] = list.splice(idx, 1);
      return removed;
    }
  }

  try {
    const rows = await db
      .select()
      .from(addresses)
      .where(ownershipCondition(id, scopeCustomerId))
      .limit(1);

    const existing = rows[0];
    if (existing) {
      await db.delete(addresses).where(ownershipCondition(id, scopeCustomerId));
      return mapAddress(existing);
    }
  } catch {
    // DB offline
  }

  throw notFound("نشانی مورد نظر یافت نشد.");
}

export async function setDefaultAddress(
  scopeCustomerId: string | null,
  id: string,
): Promise<Address> {
  for (const [cId, list] of getMemoryAddresses().entries()) {
    if (scopeCustomerId && cId !== scopeCustomerId) continue;
    for (const a of list) {
      a.isDefault = a.id === id;
    }
    const found = list.find((a) => a.id === id);
    if (found) return found;
  }

  try {
    await db
      .update(addresses)
      .set({ isDefault: true })
      .where(ownershipCondition(id, scopeCustomerId));

    const updated = await getAddress(id, scopeCustomerId);
    if (updated) return updated;
  } catch {
    // DB offline
  }

  throw notFound("نشانی مورد نظر یافت نشد.");
}
