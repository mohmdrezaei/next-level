/**
 * Database-backed sessions with resilient memory store fallback.
 *
 * A random opaque token is stored in the `nextlevel.session` cookie and looked
 * up in the `sessions` table (or fallback memory session store).
 */
import { randomBytes } from "node:crypto";

import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { accentFor, type SessionUser, type UserRole } from "@/features/auth/types";
import { COOKIE_KEYS } from "@/lib/constants";
import {
  findMemoryUserById,
  getMemorySessions,
  toSessionUserFromMemory,
} from "./memory-store";

const SESSION_DAYS = 30;
const MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

type UserRow = typeof users.$inferSelect;

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role === "admin" ? "admin" : "customer",
    accent: row.accent || accentFor(row.email || row.id),
  };
}

/** Drop sessions that are past their expiry. Cheap enough to run inline. */
export async function purgeExpiredSessions(): Promise<void> {
  try {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  } catch {
    // Database offline
  }
}

/**
 * Cookie flags shared by every session write.
 */
function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
    priority: "high" as const,
  };
}

export async function createSessionForUser(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000);

  // Store in memory session fallback
  getMemorySessions().set(token, { token, userId, expiresAt });

  // Opportunistic housekeeping: sessions are also filtered by `expiresAt` on read
  await purgeExpiredSessions().catch(() => {});

  try {
    await db.insert(sessions).values({ token, userId, expiresAt });
  } catch {
    // DB offline fallback
  }

  try {
    const store = await cookies();
    store.set(COOKIE_KEYS.session, token, sessionCookieOptions());
  } catch {
    // No request context
  }

  return token;
}

/**
 * Issue a fresh session token for the current user and revoke every other one.
 */
export async function rotateSessionForUser(userId: string): Promise<string> {
  await revokeSessionsForUser(userId);
  return createSessionForUser(userId);
}

/** Revoke every session belonging to a user (e.g. after a password change). */
export async function revokeSessionsForUser(userId: string): Promise<number> {
  let count = 0;
  for (const [token, sess] of getMemorySessions().entries()) {
    if (sess.userId === userId) {
      getMemorySessions().delete(token);
      count++;
    }
  }

  try {
    const removed = await db
      .delete(sessions)
      .where(eq(sessions.userId, userId))
      .returning({ token: sessions.token });
    return removed.length || count;
  } catch {
    return count;
  }
}

/** Read the session token from the request cookies, if a request scope exists. */
async function readToken(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(COOKIE_KEYS.session)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await readToken();
  if (!token) return null;

  // 1. Check memory sessions first
  const memSession = getMemorySessions().get(token);
  if (memSession && memSession.expiresAt > new Date()) {
    const memUser = findMemoryUserById(memSession.userId);
    if (memUser) {
      return toSessionUserFromMemory(memUser);
    }
  }

  // 2. Check Database
  try {
    const rows = await db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    const row = rows[0];
    if (row) return toSessionUser(row.user);
  } catch {
    // Database offline
  }

  return null;
}

export async function destroySession(): Promise<void> {
  const token = await readToken();

  if (token) {
    getMemorySessions().delete(token);
    try {
      await db.delete(sessions).where(eq(sessions.token, token));
    } catch {
      // DB offline
    }
  }

  try {
    const store = await cookies();
    store.delete(COOKIE_KEYS.session);
  } catch {
    // No request context
  }
}

export async function requireUser(nextPath = "/account"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=%2Fadmin");
  if (user.role !== "admin") redirect("/account?denied=admin");
  return user;
}

export type { UserRole };
