/**
 * Database-backed sessions.
 *
 * A random opaque token is stored in the `nextlevel.session` cookie and looked
 * up in the `sessions` table on every request — replacing the demo build's
 * base64-encoded cookie, which could be forged by anyone.
 */
import { randomBytes } from "node:crypto";

import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { accentFor, type SessionUser, type UserRole } from "@/features/auth/types";
import { COOKIE_KEYS } from "@/lib/constants";

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
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

/**
 * Cookie flags shared by every session write.
 *
 * - `httpOnly`  → JavaScript (and therefore any XSS payload) cannot read it.
 * - `sameSite: "lax"` → the browser refuses to attach the cookie to cross-site
 *   POSTs, which is the first line of defence against CSRF.
 * - `secure`    → HTTPS-only in production, so the token never travels in clear.
 * - `path: "/"` → a single cookie for the whole site, no sibling-scoped copies.
 *
 * RECOMMENDATION: on an HTTPS-only deployment the name can be promoted to the
 * `__Host-` prefix (`__Host-nextlevel.session`) for a hard guarantee that the
 * cookie is Secure, has no `Domain`, and is scoped to `/`. That requires
 * changing `COOKIE_KEYS.session` *and* the Proxy read in lockstep.
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

  // Opportunistic housekeeping: sessions are also filtered by `expiresAt` on
  // read, so a failure here must never block a login.
  await purgeExpiredSessions().catch(() => {});

  await db.insert(sessions).values({ token, userId, expiresAt });

  const store = await cookies();
  store.set(COOKIE_KEYS.session, token, sessionCookieOptions());

  return token;
}

/**
 * Issue a fresh session token for the current user and revoke every other one.
 *
 * Called after a credential change so that a stolen or previously-issued token
 * stops working the moment the password does. This is the *stateful* revocation
 * that a stateless JWT cannot provide without a server-side deny-list.
 */
export async function rotateSessionForUser(userId: string): Promise<string> {
  await revokeSessionsForUser(userId);
  return createSessionForUser(userId);
}

/** Revoke every session belonging to a user (e.g. after a password change). */
export async function revokeSessionsForUser(userId: string): Promise<number> {
  const removed = await db
    .delete(sessions)
    .where(eq(sessions.userId, userId))
    .returning({ token: sessions.token });

  return removed.length;
}

/** Read the session token from the request cookies, if a request scope exists. */
async function readToken(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(COOKIE_KEYS.session)?.value ?? null;
  } catch {
    // `cookies()` throws when called outside a request (scripts, static
    // generation). There is no session in that case, so treat it as a guest.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[session] no request scope — treating caller as a guest.");
    }
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await readToken();
  if (!token) return null;

  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  return row ? toSessionUser(row.user) : null;
}

export async function destroySession(): Promise<void> {
  const token = await readToken();

  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  const store = await cookies();
  store.delete(COOKIE_KEYS.session);
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
