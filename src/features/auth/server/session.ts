/**
 * Auth entry points used by server components and server actions.
 *
 * The real implementation lives in `src/server/auth/session.ts` (cookie token →
 * `sessions` table) and `src/server/repositories/users.ts` (accounts). This
 * module keeps the names the rest of the app already imports.
 */
import {
  createSessionForUser,
  destroySession,
  getSessionUser,
  requireAdmin,
  requireUser,
} from "@/server/auth/session";
import { createUser, verifyCredentials } from "@/server/repositories/users";
import type { SessionUser } from "../types";

/** Current user, or null for guests. */
export const getSession = getSessionUser;

/** Start a session for an already-authenticated user. */
export async function createSession(user: SessionUser): Promise<void> {
  await createSessionForUser(user.id);
}

export { destroySession, requireAdmin, requireUser };

/** Resolve a credential pair into a session user. */
export async function resolveCredentials(
  identifier: string,
  password: string,
): Promise<SessionUser | null> {
  return verifyCredentials(identifier, password);
}

export interface NewCustomer {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

/** Register a new shopper account. */
export async function createCustomerSession(input: NewCustomer): Promise<SessionUser> {
  return createUser({
    name: input.name,
    phone: input.phone,
    email: input.email,
    password: input.password,
    role: "customer",
  });
}
