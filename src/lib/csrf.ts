/**
 * Origin-based CSRF defence for state-changing API calls.
 *
 * The session cookie is `SameSite=Lax`, which already blocks cross-site POSTs
 * in every modern browser. This is a second, independent layer: browsers attach
 * an `Origin` header to every non-GET request, so a mismatching origin is a
 * strong signal of a cross-site forgery attempt.
 *
 * Design notes:
 * - A **missing** `Origin` is allowed. Non-browser clients (curl, cron, native
 *   apps, server-to-server) do not send it, and they are not CSRF vectors —
 *   CSRF requires a browser that automatically attaches cookies.
 * - When `Origin` is present it must match the request `Host`, or appear in the
 *   `TRUSTED_ORIGINS` allowlist (comma-separated absolute origins) for
 *   deployments that sit behind a proxy that rewrites `Host`.
 */

/** HTTP methods that change state and therefore need an origin check. */
export const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Parse the `TRUSTED_ORIGINS` env var into absolute origins. */
export function trustedOrigins(): string[] {
  return (process.env.TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

/**
 * `true` when the request may proceed.
 *
 * @param method  The HTTP method.
 * @param headers The incoming request headers.
 */
export function isSameOriginRequest(method: string, headers: Headers): boolean {
  if (!MUTATING_METHODS.has(method.toUpperCase())) return true;

  const origin = headers.get("origin");
  if (!origin) return true;

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  // `null` origin — sandboxed iframes and some redirect flows. Reject.
  if (parsed.origin === "null") return false;

  const host = headers.get("host");
  if (host && parsed.host === host) return true;

  const forwardedHost = headers.get("x-forwarded-host");
  if (forwardedHost && parsed.host === forwardedHost.split(",")[0]?.trim()) return true;

  return trustedOrigins().includes(parsed.origin);
}
