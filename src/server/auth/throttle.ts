/**
 * Account lockout for credential guessing.
 *
 * The edge rate limiter in `src/proxy.ts` throttles by **IP**, which a
 * distributed attacker (or a botnet) trivially sidesteps. This layer throttles
 * by **account identifier**, so hammering a single email/phone from many
 * addresses still trips a lock.
 *
 * Policy: after `MAX_FAILURES` failures inside `FAILURE_WINDOW_MS`, the
 * identifier is locked for `LOCKOUT_MS`. A successful sign-in clears the
 * counter.
 *
 * LIMITATION: state is per-process. A multi-instance deployment should move
 * this to Redis (or a `login_attempts` table) — same trade-off as the edge
 * limiter.
 */

const STORE_KEY = "__nextLevelLoginThrottle";

interface AttemptRecord {
  count: number;
  /** Start of the current failure window. */
  windowStart: number;
  /** Epoch ms until which the identifier is locked, or 0. */
  lockedUntil: number;
}

interface ThrottleStore {
  attempts: Map<string, AttemptRecord>;
}

declare global {
  // eslint-disable-next-line no-var
  var __nextLevelLoginThrottle: ThrottleStore | undefined;
}

export const MAX_FAILURES = 5;
export const FAILURE_WINDOW_MS = 15 * 60 * 1000;
export const LOCKOUT_MS = 15 * 60 * 1000;

const MAX_TRACKED = 10_000;

function getStore(): ThrottleStore {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = { attempts: new Map<string, AttemptRecord>() };
  }
  return globalThis[STORE_KEY] as ThrottleStore;
}

/** Normalise the key so `Ali@X.com` and `ali@x.com` share a bucket. */
export function throttleKey(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export interface LockoutStatus {
  locked: boolean;
  /** Milliseconds until the lock lifts (0 when not locked). */
  retryAfterMs: number;
}

/** Is this identifier currently locked out? */
export function lockoutStatus(identifier: string): LockoutStatus {
  const store = getStore();
  const record = store.attempts.get(throttleKey(identifier));
  const now = Date.now();

  if (!record || !record.lockedUntil) return { locked: false, retryAfterMs: 0 };
  if (record.lockedUntil <= now) {
    store.attempts.delete(throttleKey(identifier));
    return { locked: false, retryAfterMs: 0 };
  }

  return { locked: true, retryAfterMs: record.lockedUntil - now };
}

/** Record a failed sign-in attempt; returns the resulting lockout status. */
export function registerFailure(identifier: string): LockoutStatus {
  const store = getStore();
  const key = throttleKey(identifier);
  const now = Date.now();

  if (store.attempts.size > MAX_TRACKED) {
    for (const [entryKey, entry] of store.attempts) {
      if ((entry.lockedUntil && entry.lockedUntil <= now) || entry.windowStart + FAILURE_WINDOW_MS <= now) {
        store.attempts.delete(entryKey);
      }
    }
  }

  const existing = store.attempts.get(key);
  const record: AttemptRecord =
    existing && existing.windowStart + FAILURE_WINDOW_MS > now && !existing.lockedUntil
      ? { ...existing, count: existing.count + 1 }
      : { count: 1, windowStart: now, lockedUntil: 0 };

  if (record.count >= MAX_FAILURES) {
    record.lockedUntil = now + LOCKOUT_MS;
  }

  store.attempts.set(key, record);

  return { locked: Boolean(record.lockedUntil), retryAfterMs: record.lockedUntil ? LOCKOUT_MS : 0 };
}

/** Clear the failure counter after a successful sign-in. */
export function registerSuccess(identifier: string): void {
  getStore().attempts.delete(throttleKey(identifier));
}
