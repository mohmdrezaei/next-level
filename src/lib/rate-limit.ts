/**
 * Fixed-window rate limiter.
 *
 * Runs inside the Next.js Proxy (Edge runtime), so it must stay dependency-free
 * and must not import `node:*` modules. State lives in a module-level `Map`
 * pinned to `globalThis` so it survives hot reloads in development.
 *
 * LIMITATION: the counters are per-process. Behind multiple instances each one
 * keeps its own window, so the effective limit is `limit × instances`. For
 * horizontal scaling, swap `rateLimit()` for a Redis/Upstash implementation —
 * the signature is deliberately small so only this file needs to change.
 */

export interface RateLimitResult {
  /** `true` when the request is allowed. */
  success: boolean;
  /** The configured ceiling for the matched window. */
  limit: number;
  /** Requests still allowed in the current window. */
  remaining: number;
  /** Milliseconds until the window resets. */
  resetMs: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

interface LimitStore {
  entries: Map<string, WindowEntry>;
}

const STORE_KEY = "__nextLevelRateLimit";

declare global {
  // eslint-disable-next-line no-var
  var __nextLevelRateLimit: LimitStore | undefined;
}

/** Hard ceiling on tracked keys; above this the store is swept. */
const MAX_ENTRIES = 10_000;

function getStore(): LimitStore {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = { entries: new Map<string, WindowEntry>() };
  }
  return globalThis[STORE_KEY] as LimitStore;
}

/** Drop every window that has already elapsed. */
function cleanup(store: LimitStore, now: number): void {
  for (const [key, entry] of store.entries) {
    if (entry.resetAt <= now) store.entries.delete(key);
  }
}

/**
 * Consume one token for `key`.
 *
 * @param key     Usually `${clientIp}:${scope}` — see `rateLimitKey()`.
 * @param limit   Maximum requests allowed inside the window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const store = getStore();
  const now = Date.now();

  // Guard against unbounded growth when the limiter is hit by many distinct IPs.
  if (store.entries.size > MAX_ENTRIES) cleanup(store, now);

  const entry = store.entries.get(key);

  if (!entry || entry.resetAt <= now) {
    store.entries.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: Math.max(0, limit - 1), resetMs: windowMs };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return { success: false, limit, remaining: 0, resetMs: Math.max(0, entry.resetAt - now) };
  }

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetMs: Math.max(0, entry.resetAt - now),
  };
}

/* -------------------------------------------------------------------------- */
/*  Route rules                                                               */
/* -------------------------------------------------------------------------- */

export interface RateLimitRule {
  /** Stable name used as the bucket suffix, e.g. `auth:login`. */
  scope: string;
  limit: number;
  windowMs: number;
  /**
   * Largest request body accepted for this route, in bytes. `undefined` means
   * "fall back to the global cap".
   */
  maxBodyBytes?: number;
}

const MINUTE = 60_000;

/** Largest JSON body accepted anywhere except the routes that opt out. */
export const DEFAULT_MAX_BODY_BYTES = 6 * 1024 * 1024; // 6 MiB

/** Largest body accepted by bulk catalogue writes (product/set images). */
export const CATALOGUE_MAX_BODY_BYTES = 12 * 1024 * 1024; // 12 MiB

/**
 * Per-route ceilings, most specific first. The first entry whose `test`
 * matches the pathname wins.
 *
 * The ordering matters: `/api/auth/login` must be matched before the generic
 * `/api/*` fallback.
 */
interface RuleEntry extends RateLimitRule {
  test: (pathname: string) => boolean;
}

const startsWith = (prefix: string) => (pathname: string) => pathname.startsWith(prefix);

const RULES: RuleEntry[] = [
  // --- Authentication: brute-force protection -----------------------------
  { scope: "auth:login", limit: 5, windowMs: MINUTE, test: startsWith("/api/auth/login") },
  { scope: "auth:register", limit: 5, windowMs: MINUTE, test: startsWith("/api/auth/register") },
  { scope: "auth:me", limit: 120, windowMs: MINUTE, test: startsWith("/api/auth/me") },
  { scope: "auth", limit: 30, windowMs: MINUTE, test: startsWith("/api/auth/") },

  // --- Credential-bearing account writes ----------------------------------
  { scope: "account:password", limit: 5, windowMs: MINUTE, test: startsWith("/api/account/password") },
  { scope: "account", limit: 60, windowMs: MINUTE, test: startsWith("/api/account/") },

  // --- Public write endpoints (spam / abuse) ------------------------------
  { scope: "contact", limit: 5, windowMs: MINUTE, test: startsWith("/api/contact") },
  { scope: "newsletter", limit: 5, windowMs: MINUTE, test: startsWith("/api/newsletter") },
  { scope: "coupons:validate", limit: 20, windowMs: MINUTE, test: startsWith("/api/coupons/validate") },
  { scope: "reviews", limit: 10, windowMs: MINUTE, test: startsWith("/api/reviews") },

  // --- Checkout ------------------------------------------------------------
  { scope: "cart:price", limit: 60, windowMs: MINUTE, test: startsWith("/api/cart/price") },
  { scope: "orders", limit: 20, windowMs: MINUTE, test: startsWith("/api/orders") },
  { scope: "addresses", limit: 30, windowMs: MINUTE, test: startsWith("/api/addresses/") },
  { scope: "customers", limit: 60, windowMs: MINUTE, test: startsWith("/api/customers") },
  { scope: "wishlist", limit: 60, windowMs: MINUTE, test: startsWith("/api/wishlist") },

  // --- Search & catalogue reads -------------------------------------------
  { scope: "search", limit: 60, windowMs: MINUTE, test: startsWith("/api/search") },

  // --- Admin API: authenticated staff, so a generous but finite ceiling ----
  { scope: "admin", limit: 120, windowMs: MINUTE, test: startsWith("/api/admin/") },
  { scope: "admin-write", limit: 60, windowMs: MINUTE, test: startsWith("/api/products") },
  { scope: "admin-write", limit: 60, windowMs: MINUTE, test: startsWith("/api/sets") },
  { scope: "admin-write", limit: 60, windowMs: MINUTE, test: startsWith("/api/categories") },
  { scope: "admin-write", limit: 60, windowMs: MINUTE, test: startsWith("/api/settings") },

  // --- Health probes: cheap, polled, keep them unthrottled in practice ----
  { scope: "health", limit: 600, windowMs: MINUTE, test: startsWith("/api/health") },
];

/** The catch-all applied to any `/api/*` route not listed above. */
const DEFAULT_RULE: RateLimitRule = { scope: "api", limit: 120, windowMs: MINUTE };

/** Resolve the limiter rule for an API pathname. */
export function matchRateRule(pathname: string): RateLimitRule {
  return RULES.find((rule) => rule.test(pathname)) ?? DEFAULT_RULE;
}

/* -------------------------------------------------------------------------- */
/*  Client identity                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is a comma-separated chain (`client, proxy1, proxy2`); the
 * left-most entry is the original client. This header is spoofable unless the
 * deployment terminates at a trusted proxy that overwrites it — the limiter is
 * a speed bump, not an authorization boundary.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headers.get("x-real-ip")?.trim() || headers.get("cf-connecting-ip")?.trim() || "unknown";
}

/** Build the limiter bucket key for a request. */
export function rateLimitKey(ip: string, scope: string): string {
  return `${ip}:${scope}`;
}

/** Standard rate-limit response headers (draft-ietf-httpapi-ratelimit-headers). */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "Retry-After": String(Math.max(1, Math.ceil(result.resetMs / 1000))),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.max(1, Math.ceil(result.resetMs / 1000))),
  };
}
