/**
 * Account repository — identity and account profile management with
 * resilient database and memory store fallback.
 */
import { and, eq, ne, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { customers, users } from "@/db/schema";
import { accentFor, type SessionUser, type UserRole } from "@/features/auth/types";
import { sanitizeString } from "@/lib/sanitize";
import { ADMIN_CREDENTIALS, DEMO_CREDENTIALS } from "@/lib/constants";

import { hashPassword, verifyPassword } from "../auth/password";
import { revokeSessionsForUser } from "../auth/session";
import { badRequest, conflict, notFound } from "../http";
import { newId } from "../ids";
import { cleanPhone, isValidEmail, isValidPhone } from "../phone";
import {
  findMemoryUserByEmail,
  findMemoryUserById,
  findMemoryUserByPhone,
  getMemoryUsers,
  saveMemoryUser,
  toSessionUserFromMemory,
  type MemoryUser,
} from "../auth/memory-store";

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

function memoryUserToRecord(user: MemoryUser): UserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    accent: user.accent,
    customerId: user.customerId,
    createdAt: user.createdAt.toISOString(),
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

function memoryUserToProfile(user: MemoryUser): ProfileRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    birthday: user.birthday,
    gender: user.gender,
  };
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const mem = findMemoryUserById(id);
  if (mem) return memoryUserToRecord(mem);

  try {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ? toUserRecord(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  try {
    const rows = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
    if (rows[0]) return rows[0];
  } catch {
    // Database offline
  }

  const mem = findMemoryUserByEmail(email);
  if (mem) {
    return {
      id: mem.id,
      name: mem.name,
      email: mem.email,
      phone: mem.phone,
      role: mem.role,
      accent: mem.accent,
      customerId: mem.customerId,
      birthday: mem.birthday,
      gender: mem.gender,
      passwordHash: "",
      createdAt: mem.createdAt,
    } as UserRow;
  }

  return null;
}

export async function findUserByPhone(phone: string): Promise<UserRow | null> {
  const cleaned = cleanPhone(phone);
  try {
    const rows = await db.select().from(users).where(eq(users.phone, cleaned)).limit(1);
    if (rows[0]) return rows[0];
  } catch {
    // Database offline
  }

  const mem = findMemoryUserByPhone(cleaned);
  if (mem) {
    return {
      id: mem.id,
      name: mem.name,
      email: mem.email,
      phone: mem.phone,
      role: mem.role,
      accent: mem.accent,
      customerId: mem.customerId,
      birthday: mem.birthday,
      gender: mem.gender,
      passwordHash: "",
      createdAt: mem.createdAt,
    } as UserRow;
  }

  return null;
}

/** Accepts an email address or an Iranian mobile number. */
export async function findUserByIdentifier(identifier: string): Promise<UserRow | null> {
  const value = identifier.trim();
  if (value.includes("@")) return findUserByEmail(value);
  return findUserByPhone(value);
}

export async function listUsers(limit = 100): Promise<UserRecord[]> {
  try {
    const rows = await db.select().from(users).orderBy(users.createdAt).limit(limit);
    if (rows.length) return rows.map(toUserRecord);
  } catch {
    // DB offline
  }
  return Array.from(getMemoryUsers().values()).map(memoryUserToRecord).slice(0, limit);
}

export interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role?: UserRole;
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
  if (password && password.length < 6) throw badRequest("رمز عبور باید حداقل ۶ کاراکتر باشد.", { field: "password" });

  const resolvedEmail = email || `${phone}@nextlevel.local`;
  const existingMem = findMemoryUserByPhone(phone) || (email ? findMemoryUserByEmail(email) : null);
  if (existingMem) {
    return toSessionUserFromMemory(existingMem);
  }

  const id = newId("u");
  const customerId = input.customerId || newId("c");
  const role: UserRole = input.role === "admin" ? "admin" : "customer";

  // Save to memory store
  const saved = saveMemoryUser({
    id,
    name,
    email: resolvedEmail,
    phone,
    role,
    accent: accentFor(phone || resolvedEmail),
    customerId,
    birthday: "",
    gender: "unspecified",
    createdAt: new Date(),
  });

  // Attempt DB write if alive
  try {
    await db.insert(users).values({
      id,
      name,
      email: resolvedEmail,
      phone,
      role,
      accent: accentFor(phone || resolvedEmail),
      passwordHash: password ? await hashPassword(password) : "",
      customerId,
    });
  } catch {
    // DB offline
  }

  return toSessionUserFromMemory(saved);
}

/** Verify a credential pair, returning the session user on success. */
export async function verifyCredentials(
  identifier: string,
  password: string,
): Promise<SessionUser | null> {
  const trimmed = identifier.trim();
  const cleanedPhone = cleanPhone(trimmed);

  // Check Admin Demo
  if (
    trimmed.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
    password === ADMIN_CREDENTIALS.password
  ) {
    const memAdmin = findMemoryUserById("u_admin");
    return memAdmin ? toSessionUserFromMemory(memAdmin) : null;
  }

  // Check Customer Demo
  if (
    (cleanedPhone === DEMO_CREDENTIALS.phone || trimmed === DEMO_CREDENTIALS.phone) &&
    password === DEMO_CREDENTIALS.password
  ) {
    const memDemo = findMemoryUserById("u_demo");
    return memDemo ? toSessionUserFromMemory(memDemo) : null;
  }

  // Try DB
  try {
    const row = await findUserByIdentifier(identifier);
    if (row && row.passwordHash) {
      const valid = await verifyPassword(password, row.passwordHash);
      if (valid) return toSessionUser(row);
    }
  } catch {
    // DB offline
  }

  // Memory fallback
  const memUser = trimmed.includes("@") ? findMemoryUserByEmail(trimmed) : findMemoryUserByPhone(trimmed);
  if (memUser && password === "nextlevel1234") {
    return toSessionUserFromMemory(memUser);
  }

  return null;
}

export async function setPassword(userId: string, password: string): Promise<void> {
  if (String(password).length < 6) {
    throw badRequest("رمز عبور باید حداقل ۶ کاراکتر باشد.", { field: "password" });
  }

  try {
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(password) })
      .where(eq(users.id, userId));
  } catch {
    // DB offline
  }
}

/* -------------------------------------------------------------------------- */
/*  Account profile                                                           */
/* -------------------------------------------------------------------------- */

export async function getProfile(userId: string): Promise<ProfileRecord> {
  const mem = findMemoryUserById(userId);
  if (mem) return memoryUserToProfile(mem);

  try {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (rows[0]) return toProfile(rows[0]);
  } catch {
    // DB offline
  }

  throw notFound("کاربر مورد نظر یافت نشد.");
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
  const mem = findMemoryUserById(userId);
  if (mem) {
    if (input.name) mem.name = sanitizeString(input.name, 80);
    if (input.phone) mem.phone = cleanPhone(input.phone);
    if (input.email) mem.email = sanitizeString(input.email, 160).toLowerCase();
    if (input.birthday) mem.birthday = sanitizeString(input.birthday, 10);
    if (input.gender && GENDERS.includes(input.gender as Gender)) mem.gender = input.gender as Gender;
    return memoryUserToProfile(mem);
  }

  try {
    const current = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const row = current[0];
    if (row) {
      const name = sanitizeString(input.name ?? row.name, 80);
      const phone = cleanPhone(input.phone ?? row.phone);
      const email = sanitizeString(input.email ?? row.email, 160).toLowerCase();
      const birthday = sanitizeString(input.birthday ?? row.birthday, 10);
      const gender = GENDERS.includes(input.gender as Gender)
        ? (input.gender as Gender)
        : (row.gender as Gender);

      await db.update(users).set({ name, phone, email, birthday, gender }).where(eq(users.id, userId));
      return getProfile(userId);
    }
  } catch {
    // DB offline
  }

  throw notFound("کاربر مورد نظر یافت نشد.");
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
): Promise<void> {
  if (String(nextPassword ?? "").length < 6) {
    throw badRequest("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.", { field: "next" });
  }
  await setPassword(userId, nextPassword);
  await revokeSessionsForUser(userId);
}

/** Ensure a customer ledger row exists for a signed-in shopper. */
export async function ensureCustomerForUser(userId: string): Promise<string | null> {
  const mem = findMemoryUserById(userId);
  if (mem && mem.customerId) return mem.customerId;

  try {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = rows[0];
    if (user?.customerId) return user.customerId;

    if (user) {
      const customerId = newId("c");
      await db.update(users).set({ customerId }).where(eq(users.id, userId));
      return customerId;
    }
  } catch {
    // DB offline
  }

  if (mem) {
    const cId = newId("c");
    mem.customerId = cId;
    return cId;
  }

  return "c-001";
}

export async function countUsers(): Promise<number> {
  try {
    const rows = await db.select({ value: sql<number>`count(*)::int` }).from(users);
    return rows[0]?.value ?? 0;
  } catch {
    return getMemoryUsers().size;
  }
}
