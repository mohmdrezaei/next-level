/**
 * Customer repository. A customer is the shop's ledger entry for a buyer —
 * distinct from a `user`, which is a login.
 */
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import type { Customer } from "@/features/orders/types";
import { sanitizeString } from "@/lib/sanitize";

import { badRequest, conflict, notFound } from "../http";
import { newId } from "../ids";
import { containsPattern } from "../sql";

type CustomerRow = typeof customers.$inferSelect;

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

  return rows.map(mapCustomer);
}

export async function countCustomers(query: CustomerQuery = {}): Promise<number> {
  const conditions = [];
  if (query.q?.trim()) {
    const needle = containsPattern(query.q.trim());
    conditions.push(
      or(ilike(customers.name, needle), ilike(customers.phone, needle), ilike(customers.email, needle)),
    );
  }
  if (query.tier) conditions.push(eq(customers.tier, query.tier));

  const rows = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(customers)
    .where(conditions.length ? and(...conditions) : undefined);

  return rows[0]?.value ?? 0;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return rows[0] ? mapCustomer(rows[0]) : null;
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const rows = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
  return rows[0] ? mapCustomer(rows[0]) : null;
}

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

function validate(input: CustomerDraft): void {
  if (!input || typeof input !== "object") throw badRequest("اطلاعات مشتری ارسال نشده است.");
  if (typeof input.name !== "string" || input.name.trim().length < 3) {
    throw badRequest("نام مشتری باید حداقل ۳ کاراکتر باشد.", { field: "name" });
  }
  if (input.phone && !/^0\d{10}$/.test(input.phone.trim())) {
    throw badRequest("شماره موبایل باید ۱۱ رقم و با صفر شروع شود.", { field: "phone" });
  }
  if (input.email && input.email.trim() && !isEmail(input.email.trim())) {
    throw badRequest("ایمیل وارد‌شده معتبر نیست.", { field: "email" });
  }
}

async function assertPhoneAvailable(phone: string, exceptId?: string): Promise<void> {
  if (!phone) return;
  const rows = await db.select({ id: customers.id }).from(customers).where(eq(customers.phone, phone));
  if (rows.some((row) => row.id !== exceptId)) {
    throw conflict("مشتری دیگری با این شماره موبایل ثبت شده است.");
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

  await db.insert(customers).values({
    id,
    name: sanitizeString(input.name, 80),
    phone,
    email: sanitizeString(input.email ?? "", 160),
    city: sanitizeString(input.city ?? "", 60),
    province: sanitizeString(input.province ?? "", 60),
    joinedAt: input.joinedAt ? new Date(input.joinedAt) : new Date(),
    orders: Math.max(0, Math.round(Number(input.orders ?? 0))),
    totalSpent,
    tier: tierForSpend(totalSpent),
    lastOrderAt: input.lastOrderAt ? new Date(input.lastOrderAt) : new Date(),
  });

  const created = await getCustomerById(id);
  if (!created) throw notFound("مشتری ایجاد شد اما بازخوانی نشد.");
  return created;
}

export async function updateCustomer(id: string, input: CustomerDraft): Promise<Customer> {
  const existingRows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  const existing = existingRows[0];
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

  await db
    .update(customers)
    .set({
      name: sanitizeString(input.name ?? existing.name, 80),
      phone,
      email: sanitizeString(input.email ?? existing.email, 160),
      city: sanitizeString(input.city ?? existing.city, 60),
      province: sanitizeString(input.province ?? existing.province, 60),
      joinedAt: input.joinedAt ? new Date(input.joinedAt) : existing.joinedAt,
      orders: Math.max(0, Math.round(Number(input.orders ?? existing.orders))),
      totalSpent,
      tier: tierForSpend(totalSpent),
      lastOrderAt: input.lastOrderAt ? new Date(input.lastOrderAt) : existing.lastOrderAt,
    })
    .where(eq(customers.id, id));

  const updated = await getCustomerById(id);
  if (!updated) throw notFound("مشتری مورد نظر یافت نشد.");
  return updated;
}

export async function deleteCustomer(id: string): Promise<Customer> {
  const existing = await getCustomerById(id);
  if (!existing) throw notFound("مشتری مورد نظر یافت نشد.");

  await db.delete(customers).where(eq(customers.id, id));
  return existing;
}

/** Re-derive a customer's order count and spend from the order ledger. */
export async function recalculateCustomerStats(id: string): Promise<Customer> {
  const existing = await getCustomerById(id);
  if (!existing) throw notFound("مشتری مورد نظر یافت نشد.");

  const rows = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
      last: sql<string | null>`max(${orders.createdAt})`,
    })
    .from(orders)
    .where(eq(orders.customerId, id));

  const stats = rows[0];
  const totalSpent = stats?.total ?? 0;
  const lastOrderAt = stats?.last ? new Date(stats.last) : existing.lastOrderAt ? new Date(existing.lastOrderAt) : null;

  await db
    .update(customers)
    .set({
      orders: stats?.count ?? 0,
      totalSpent,
      tier: tierForSpend(totalSpent),
      lastOrderAt,
    })
    .where(eq(customers.id, id));

  const updated = await getCustomerById(id);
  if (!updated) throw notFound("مشتری مورد نظر یافت نشد.");
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
  const rows = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  const existing = rows[0];
  if (!existing) return;

  const totalSpent = existing.totalSpent + total;

  await db
    .update(customers)
    .set({
      orders: existing.orders + 1,
      totalSpent,
      tier: tierForSpend(totalSpent),
      lastOrderAt: placedAt,
    })
    .where(eq(customers.id, customerId));
}
