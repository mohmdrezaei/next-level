/**
 * Account repository — the login/identity side of the shop, kept separate from
 * the `customers` ledger table.
 */
import { and, eq, ne, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { customers, users } from "@/db/schema";
import { accentFor, type SessionUser, type UserRole } from "@/features/auth/types";
import { sanitizeString } from "@/lib/sanitize";

import { hashPassword, verifyPassword } from "../auth/password";
import { revokeSessionsForUser } from "../auth/session";
import { badRequest, conflict, notFound } from "../http";
import { newId } from "../ids";
import { cleanPhone, isValidEmail, isValidPhone } from "../phone";

type UserRow = typeof users.$inferSelect;

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  accent: string;
  customerId: string | null;
  createdAt: string;
}

export type Gender = "male" | "female" | "unspecified";

/** The subset of a user the account profile screen reads and writes. */
export interface ProfileRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** Jalali date string as typed by the shopper, e.g. "1370/05/12". */
  birthday: string;
  gender: Gender;
}

const GENDERS: Gender[] = ["male", "female", "unspecified"];

export function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role === "admin" ? "admin" : "customer",
    accent: row.accent || accentFor(row.email || row.id),
  };
}

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role === "admin" ? "admin" : "customer",
    accent: row.accent,
    customerId: row.customerId,
    createdAt: row.createdAt.toISOString(),
  };
}

function toProfile(row: UserRow): ProfileRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    birthday: row.birthday,
    gender: GENDERS.includes(row.gender as Gender) ? (row.gender as Gender) : "unspecified",
  };
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ? toUserRecord(rows[0]) : null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
  return rows[0] ?? null;
}

export async function findUserByPhone(phone: string): Promise<UserRow | null> {
  const cleaned = cleanPhone(phone);
  const rows = await db.select().from(users).where(eq(users.phone, cleaned)).limit(1);
  return rows[0] ?? null;
}

/** Accepts an email address or an Iranian mobile number. */
export async function findUserByIdentifier(identifier: string): Promise<UserRow | null> {
  const value = identifier.trim();
  if (value.includes("@")) return findUserByEmail(value);
  return findUserByPhone(value);
}

export async function listUsers(limit = 100): Promise<UserRecord[]> {
  const rows = await db.select().from(users).orderBy(users.createdAt).limit(limit);
  return rows.map(toUserRecord);
}

export interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role?: UserRole;
  /** Attach the login to an existing customer ledger row. */
  customerId?: string | null;
}

export async function createUser(input: RegisterInput): Promise<SessionUser> {
  const name = sanitizeString(input.name ?? "", 80);
  const phone = cleanPhone(input.phone);
  const email = sanitizeString(input.email ?? "", 160).toLowerCase();
  const password = String(input.password ?? "");

  if (name.length < 3) throw badRequest("نام و نام خانوادگی را کامل وارد کنید.", { field: "name" });
  if (!isValidPhone(phone)) {
    throw badRequest("شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد.", { field: "phone" });
  }
  if (email && !isValidEmail(email)) throw badRequest("ایمیل معتبر نیست.", { field: "email" });
  if (password.length < 6) throw badRequest("رمز عبور باید حداقل ۶ کاراکتر باشد.", { field: "password" });

  const resolvedEmail = email || `${phone}@nextlevel.demo`;

  const existing = await db
    .select({ id: users.id, email: users.email, phone: users.phone })
    .from(users)
    .where(or(eq(users.email, resolvedEmail), eq(users.phone, phone)));

  if (existing.length) {
    throw conflict("حسابی با این شماره موبایل یا ایمیل از قبل وجود دارد.");
  }

  const id = newId("u");
  const role: UserRole = input.role === "admin" ? "admin" : "customer";

  await db.insert(users).values({
    id,
    name,
    email: resolvedEmail,
    phone,
    role,
    accent: accentFor(phone || resolvedEmail),
    passwordHash: await hashPassword(password),
    customerId: input.customerId ?? null,
  });

  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!rows[0]) throw notFound("حساب ساخته شد اما بازخوانی نشد.");
  return toSessionUser(rows[0]);
}

/** Verify a credential pair, returning the session user on success. */
export async function verifyCredentials(
  identifier: string,
  password: string,
): Promise<SessionUser | null> {
  const row = await findUserByIdentifier(identifier);
  if (!row) return null;

  const valid = await verifyPassword(password, row.passwordHash);
  return valid ? toSessionUser(row) : null;
}

export async function setPassword(userId: string, password: string): Promise<void> {
  if (String(password).length < 6) {
    throw badRequest("رمز عبور باید حداقل ۶ کاراکتر باشد.", { field: "password" });
  }

  const updated = await db
    .update(users)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  if (!updated.length) throw notFound("کاربر مورد نظر یافت نشد.");
}

/* -------------------------------------------------------------------------- */
/*  Account profile                                                           */
/* -------------------------------------------------------------------------- */

export async function getProfile(userId: string): Promise<ProfileRecord> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!rows[0]) throw notFound("کاربر مورد نظر یافت نشد.");
  return toProfile(rows[0]);
}

export interface ProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  gender?: string;
}

/** Update the fields the shopper owns on `/account/profile`. */
export async function updateProfile(userId: string, input: ProfileInput): Promise<ProfileRecord> {
  const current = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const row = current[0];
  if (!row) throw notFound("کاربر مورد نظر یافت نشد.");

  const name = sanitizeString(input.name ?? row.name, 80);
  const phone = cleanPhone(input.phone ?? row.phone);
  const email = sanitizeString(input.email ?? row.email, 160).toLowerCase();
  const birthday = sanitizeString(input.birthday ?? row.birthday, 10);
  const gender = GENDERS.includes(input.gender as Gender)
    ? (input.gender as Gender)
    : (row.gender as Gender);

  if (name.length < 3) throw badRequest("نام و نام خانوادگی را کامل وارد کنید.", { field: "name" });
  if (!isValidPhone(phone)) {
    throw badRequest("شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد.", { field: "phone" });
  }
  if (email && !isValidEmail(email)) throw badRequest("ایمیل معتبر نیست.", { field: "email" });
  if (birthday && !/^\d{4}\/\d{2}\/\d{2}$/.test(birthday)) {
    throw badRequest("تاریخ تولد را به شکل ۱۳۷۰/۰۵/۱۲ وارد کنید.", { field: "birthday" });
  }

  // Email and phone are the login identifiers, so they must stay unique.
  const clashes = await db
    .select({ id: users.id })
    .from(users)
    .where(and(or(eq(users.email, email), eq(users.phone, phone)), ne(users.id, userId)));

  if (clashes.length) {
    throw conflict("حساب دیگری با این ایمیل یا شماره موبایل ثبت شده است.");
  }

  await db.update(users).set({ name, phone, email, birthday, gender }).where(eq(users.id, userId));

  return getProfile(userId);
}

/** Verify the current password, then store a new hash. */
export async function changePassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
): Promise<void> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const row = rows[0];
  if (!row) throw notFound("کاربر مورد نظر یافت نشد.");

  const valid = await verifyPassword(String(currentPassword ?? ""), row.passwordHash);
  if (!valid) throw badRequest("رمز عبور فعلی درست نیست.", { field: "current" });

  if (String(nextPassword ?? "").length < 6) {
    throw badRequest("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.", { field: "next" });
  }
  if (currentPassword === nextPassword) {
    throw badRequest("رمز جدید باید با رمز فعلی متفاوت باشد.", { field: "next" });
  }

  await setPassword(userId, nextPassword);

  // A credential change invalidates every existing session: a token stolen
  // before the reset must stop working the moment the password does. The
  // caller re-issues a session for the device that performed the change.
  await revokeSessionsForUser(userId);
}

/** Ensure a customer ledger row exists for a signed-in shopper. */
export async function ensureCustomerForUser(userId: string): Promise<string | null> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];
  if (!user) throw notFound("کاربر مورد نظر یافت نشد.");
  if (user.customerId) return user.customerId;

  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.phone, user.phone))
    .limit(1);

  if (existing[0]) {
    await db.update(users).set({ customerId: existing[0].id }).where(eq(users.id, userId));
    return existing[0].id;
  }

  const customerId = newId("c");
  await db.insert(customers).values({
    id: customerId,
    name: user.name,
    phone: user.phone,
    email: user.email,
    city: "",
    province: "",
    joinedAt: new Date(),
    orders: 0,
    totalSpent: 0,
    tier: "bronze",
    lastOrderAt: null,
  });

  await db.update(users).set({ customerId }).where(eq(users.id, userId));
  return customerId;
}

export async function countUsers(): Promise<number> {
  const rows = await db.select({ value: sql<number>`count(*)::int` }).from(users);
  return rows[0]?.value ?? 0;
}
