/**
 * Customer repository with resilient database and memory store fallback.
 *
 * A customer is the shop's ledger entry for a buyer — distinct from a `user`,
 * which is an authentication account.
 */
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import type { Customer } from "@/features/orders/types";
import { CUSTOMERS } from "@/features/orders/data/orders";
import { sanitizeString } from "@/lib/sanitize";

import { badRequest, conflict, notFound } from "../http";
import { newId } from "../ids";
import { containsPattern } from "../sql";

type CustomerRow = typeof customers.$inferSelect;

declare global {
  // eslint-disable-next-line no-var
  var __memoryCustomers: Map<string, Customer> | undefined;
}

export function getMemoryCustomers(): Map<string, Customer> {
  if (!globalThis.__memoryCustomers) {
    globalThis.__memoryCustomers = new Map<string, Customer>(
      CUSTOMERS.map((c) => [c.id, { ...c }]),
    );
  }
  return globalThis.__memoryCustomers;
}

/** The complete customer payload — what the admin form builds. */
export interface CustomerInput {
  name: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  joinedAt: string;
  orders: number;
  totalSpent: number;
  lastOrderAt: string;
}

/** What the repository accepts; only `name` is required. */
export type CustomerDraft = Partial<CustomerInput> & { name: string };

export interface CustomerQuery {
  q?: string;
  tier?: string;
  limit?: number;
  offset?: number;
}

/** The tier a customer lands in, derived from lifetime spend. */
export const tierForSpend = (totalSpent: number): Customer["tier"] =>
  totalSpent > 60_000_000 ? "gold" : totalSpent > 25_000_000 ? "silver" : "bronze";

function mapCustomer(row: CustomerRow): Customer {
  const joinedAt = row.joinedAt ?? new Date();
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    city: row.city,
    province: row.province,
    joinedAt: joinedAt.toISOString(),
    orders: row.orders,
    totalSpent: row.totalSpent,
    tier: row.tier as Customer["tier"],
    lastOrderAt: (row.lastOrderAt ?? joinedAt).toISOString(),
  };
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/* -------------------------------------------------------------------------- */
/*  Reads                                                                     */
/* -------------------------------------------------------------------------- */

export async function listCustomers(query: CustomerQuery = {}): Promise<Customer[]> {
  const memCustomers = Array.from(getMemoryCustomers().values());
  const seenIds = new Set<string>();
  const results: Customer[] = [];

  // 1. Filter memory store
  for (const c of memCustomers) {
    if (query.tier && c.tier !== query.tier) continue;
    if (query.q?.trim()) {
      const needle = query.q.trim().toLowerCase();
      const haystack = [c.name, c.phone, c.email, c.city, c.province].join(" ").toLowerCase();
      if (!haystack.includes(needle)) continue;
    }
    seenIds.add(c.id);
    results.push(c);
  }

  // 2. Query DB if connected
  try {
    const conditions = [];

    if (query.q?.trim()) {
      const needle = containsPattern(query.q.trim());
      conditions.push(
        or(
          ilike(customers.name, needle),
          ilike(customers.phone, needle),
          ilike(customers.email, needle),
          ilike(customers.city, needle),
        ),
      );
    }

    if (query.tier) conditions.push(eq(customers.tier, query.tier));

    const rows = await db
      .select()
      .from(customers)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(customers.totalSpent), asc(customers.name))
      .limit(query.limit ?? 100)
      .offset(query.offset ?? 0);

    for (const row of rows) {
      const mapped = mapCustomer(row);
      if (!seenIds.has(mapped.id)) {
        seenIds.add(mapped.id);
        results.push(mapped);
      }
    }
  } catch {
    // Database offline
  }

  return results
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 100));
}

export async function countCustomers(query: CustomerQuery = {}): Promise<number> {
  const list = await listCustomers(query);
  return list.length;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const mem = getMemoryCustomers().get(id);
  if (mem) return mem;

  try {
    const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (rows[0]) return mapCustomer(rows[0]);
  } catch {
    // DB offline
  }

  return null;
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const needle = phone.trim();
  for (const c of getMemoryCustomers().values()) {
    if (c.phone === needle) return c;
  }

  try {
    const rows = await db.select().from(customers).where(eq(customers.phone, needle)).limit(1);
    if (rows[0]) return mapCustomer(rows[0]);
  } catch {
    // DB offline
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

function validate(input: CustomerDraft): void {
  if (!input || typeof input !== "object") throw badRequest("اطلاعات مشتری ارسال نشده است.");
  if (typeof input.name !== "string" || input.name.trim().length < 3) {
    throw badRequest("نام مشتری باید حداقل ۳ کاراکتر باشد.", { field: "name" });
  }
  if (input.phone && !/^0\d{10}$/.test(input.phone.trim().replace(/\s/g, ""))) {
    throw badRequest("شماره موبایل باید ۱۱ رقم و با صفر شروع شود.", { field: "phone" });
  }
  if (input.email && input.email.trim() && !isEmail(input.email.trim())) {
    throw badRequest("ایمیل وارد‌شده معتبر نیست.", { field: "email" });
  }
}

async function assertPhoneAvailable(phone: string, exceptId?: string): Promise<void> {
  if (!phone) return;
  const needle = phone.trim().replace(/\s/g, "");

  for (const c of getMemoryCustomers().values()) {
    if (c.phone.replace(/\s/g, "") === needle && c.id !== exceptId) {
      throw conflict("مشتری دیگری با این شماره موبایل ثبت شده است.");
    }
  }

  try {
    const rows = await db.select({ id: customers.id }).from(customers).where(eq(customers.phone, phone));
    if (rows.some((row) => row.id !== exceptId)) {
      throw conflict("مشتری دیگری با این شماره موبایل ثبت شده است.");
    }
  } catch {
    // DB offline
  }
}

/* -------------------------------------------------------------------------- */
/*  Writes                                                                    */
/* -------------------------------------------------------------------------- */

export async function createCustomer(input: CustomerDraft): Promise<Customer> {
  validate(input);

  const phone = input.phone?.trim() ?? "";
  await assertPhoneAvailable(phone);

  const totalSpent = Math.max(0, Math.round(Number(input.totalSpent ?? 0)));
  const id = newId("c");
  const joinedAt = input.joinedAt ? new Date(input.joinedAt).toISOString() : new Date().toISOString();
  const lastOrderAt = input.lastOrderAt ? new Date(input.lastOrderAt).toISOString() : joinedAt;

  const newCust: Customer = {
    id,
    name: sanitizeString(input.name, 80),
    phone,
    email: sanitizeString(input.email ?? "", 160),
    city: sanitizeString(input.city ?? "تهران", 60),
    province: sanitizeString(input.province ?? "تهران", 60),
    joinedAt,
    orders: Math.max(0, Math.round(Number(input.orders ?? 0))),
    totalSpent,
    tier: tierForSpend(totalSpent),
    lastOrderAt,
  };

  getMemoryCustomers().set(id, newCust);

  try {
    await db.insert(customers).values({
      id,
      name: newCust.name,
      phone,
      email: newCust.email,
      city: newCust.city,
      province: newCust.province,
      joinedAt: new Date(joinedAt),
      orders: newCust.orders,
      totalSpent,
      tier: newCust.tier,
      lastOrderAt: new Date(lastOrderAt),
    });
  } catch {
    // DB offline
  }

  return newCust;
}

export async function updateCustomer(id: string, input: CustomerDraft): Promise<Customer> {
  const existing = await getCustomerById(id);
  if (!existing) throw notFound("مشتری مورد نظر یافت نشد.");

  const merged: CustomerDraft = {
    name: input.name ?? existing.name,
    phone: input.phone ?? existing.phone,
    email: input.email ?? existing.email,
  };
  validate(merged);

  const phone = merged.phone?.trim() ?? "";
  await assertPhoneAvailable(phone, id);

  const totalSpent = Math.max(0, Math.round(Number(input.totalSpent ?? existing.totalSpent)));
  const ordersCount = Math.max(0, Math.round(Number(input.orders ?? existing.orders)));

  const updated: Customer = {
    ...existing,
    name: sanitizeString(input.name ?? existing.name, 80),
    phone,
    email: sanitizeString(input.email ?? existing.email, 160),
    city: sanitizeString(input.city ?? existing.city, 60),
    province: sanitizeString(input.province ?? existing.province, 60),
    joinedAt: input.joinedAt ? new Date(input.joinedAt).toISOString() : existing.joinedAt,
    orders: ordersCount,
    totalSpent,
    tier: tierForSpend(totalSpent),
    lastOrderAt: input.lastOrderAt ? new Date(input.lastOrderAt).toISOString() : existing.lastOrderAt,
  };

  getMemoryCustomers().set(id, updated);

  try {
    await db
      .update(customers)
      .set({
        name: updated.name,
        phone,
        email: updated.email,
        city: updated.city,
        province: updated.province,
        joinedAt: new Date(updated.joinedAt),
        orders: updated.orders,
        totalSpent,
        tier: updated.tier,
        lastOrderAt: new Date(updated.lastOrderAt),
      })
      .where(eq(customers.id, id));
  } catch {
    // DB offline
  }

  return updated;
}

export async function deleteCustomer(id: string): Promise<Customer> {
  const existing = await getCustomerById(id);
  if (!existing) throw notFound("مشتری مورد نظر یافت نشد.");

  getMemoryCustomers().delete(id);

  try {
    await db.delete(customers).where(eq(customers.id, id));
  } catch {
    // DB offline
  }

  return existing;
}

/** Re-derive a customer's order count and spend from the order ledger. */
export async function recalculateCustomerStats(id: string): Promise<Customer> {
  const existing = await getCustomerById(id);
  if (!existing) throw notFound("مشتری مورد نظر یافت نشد.");

  // Check memory orders
  const memoryOrders = Array.from(globalThis.__memoryOrders?.values() ?? []);
  const matchingOrders = memoryOrders.filter((o) => o.customerId === id);

  let count = matchingOrders.length;
  let total = matchingOrders.reduce((sum, o) => sum + o.total, 0);
  let last: string | null = matchingOrders[0]?.createdAt ?? null;

  try {
    const rows = await db
      .select({
        count: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
        last: sql<string | null>`max(${orders.createdAt})`,
      })
      .from(orders)
      .where(eq(orders.customerId, id));

    const stats = rows[0];
    if (stats && stats.count > 0) {
      count = stats.count;
      total = stats.total;
      last = stats.last;
    }
  } catch {
    // DB offline
  }

  const updated: Customer = {
    ...existing,
    orders: count || existing.orders,
    totalSpent: total || existing.totalSpent,
    tier: tierForSpend(total || existing.totalSpent),
    lastOrderAt: last ? new Date(last).toISOString() : existing.lastOrderAt,
  };

  getMemoryCustomers().set(id, updated);

  try {
    await db
      .update(customers)
      .set({
        orders: updated.orders,
        totalSpent: updated.totalSpent,
        tier: updated.tier,
        lastOrderAt: new Date(updated.lastOrderAt),
      })
      .where(eq(customers.id, id));
  } catch {
    // DB offline
  }

  return updated;
}

/**
 * Fold an order's value into the customer's running totals.
 * Called by `createOrder` so the ledger stays in sync automatically.
 */
export async function applyOrderToCustomer(
  customerId: string,
  total: number,
  placedAt: Date,
): Promise<void> {
  const existing = getMemoryCustomers().get(customerId);
  if (existing) {
    const totalSpent = existing.totalSpent + total;
    existing.orders += 1;
    existing.totalSpent = totalSpent;
    existing.tier = tierForSpend(totalSpent);
    existing.lastOrderAt = placedAt.toISOString();
  }

  try {
    const rows = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    const dbExisting = rows[0];
    if (dbExisting) {
      const totalSpent = dbExisting.totalSpent + total;
      await db
        .update(customers)
        .set({
          orders: dbExisting.orders + 1,
          totalSpent,
          tier: tierForSpend(totalSpent),
          lastOrderAt: placedAt,
        })
        .where(eq(customers.id, customerId));
    }
  } catch {
    // DB offline
  }
}
