/**
 * Session guards for the REST API.
 *
 * Server components redirect on failure; API routes must answer with a status
 * code instead, so these helpers throw `ApiError`s for `withApi` to translate.
 */
import type { SessionUser } from "@/features/auth/types";
import { getSessionUser } from "@/server/auth/session";
import { ensureCustomerForUser } from "@/server/repositories/users";

import { forbidden, unauthorized } from "./http";

/** Any signed-in shopper. */
export async function requireApiUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user;
}

/** Signed-in staff only — used for every catalogue/order mutation. */
export async function requireApiAdmin(): Promise<SessionUser> {
  const user = await requireApiUser();
  if (user.role !== "admin") throw forbidden();
  return user;
}

/** Optional session — returns null instead of throwing. */
export async function getApiUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/**
 * Allow staff, or the shopper whose own ledger row this is.
 * Returns the resolved customer id so callers don't have to look it up twice.
 */
export async function requireCustomerAccess(customerId: string): Promise<string> {
  const user = await requireApiUser();
  if (user.role === "admin") return customerId;

  const own = await ensureCustomerForUser(user.id);
  if (!own || own !== customerId) throw forbidden();

  return own;
}

/**
 * The customer id the caller may act on:
 * - `null` for staff, who are allowed to touch any customer's records;
 * - the caller's own customer id for a shopper.
 *
 * Pass the result straight into a repository call as `scopeCustomerId` so the
 * ownership restriction ends up inside the SQL `WHERE` clause instead of being
 * a separate comparison after the row has already been fetched.
 */
export async function resolveCustomerScope(): Promise<string | null> {
  const user = await requireApiUser();
  if (user.role === "admin") return null;

  const own = await ensureCustomerForUser(user.id);
  if (!own) throw forbidden();
  return own;
}
