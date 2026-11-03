import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_KEYS } from "@/lib/constants";
import { isSameOriginRequest } from "@/lib/csrf";
import {
  DEFAULT_MAX_BODY_BYTES,
  clientIp,
  matchRateRule,
  rateLimit,
  rateLimitHeaders,
  rateLimitKey,
} from "@/lib/rate-limit";

/**
 * Next.js 16 renamed Middleware to "Proxy"; the behaviour is unchanged.
 *
 * Two responsibilities, applied in order:
 *
 * 1. **API hardening** (every `/api/*` request) — rate limiting, a request-body
 *    size cap, and a same-origin (CSRF) check on state-changing methods. These
 *    are cheap, allocation-free checks that belong at the edge, before any
 *    route handler or database work happens.
 *
 * 2. **Optimistic session gate** (`/admin/*`, `/account/*`) — the Next.js
 *    authentication guide is explicit that Proxy runs on every route (including
 *    prefetched ones), so it must not perform database lookups:
 *
 *      "it's important to only read the session from the cookie (optimistic
 *       checks), and avoid database checks to prevent performance issues."
 *
 *    The `nextlevel.session` cookie holds an **opaque random token** (see
 *    `src/server/auth/session.ts`); it is deliberately not decodable, so all we
 *    can check here is that it is present. The authoritative checks live in the
 *    layouts: `requireUser()` for `/account` and `requireAdmin()` for `/admin`,
 *    both of which validate the token against the `sessions` table and redirect
 *    guests / non-admins to the right place.
 *
 * NOTE: an earlier version of this file decoded the cookie as base64-encoded
 * JSON — a leftover from the demo build's forgeable cookie. Against the real
 * token-based session that `JSON.parse` always threw, so `readSession()`
 * returned `null` and every signed-in user was bounced to `/login` on the way
 * to `/account`. Do not reintroduce cookie decoding here.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return guardApi(request);
  }

  // Optimistic check: is a session cookie present? No DB access here.
  const hasSession = Boolean(request.cookies.get(COOKIE_KEYS.session)?.value);

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/* -------------------------------------------------------------------------- */
/*  API hardening                                                             */
/* -------------------------------------------------------------------------- */

/** Response headers shared by every hardened API reply. */
const BASE_API_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
};

function jsonError(
  status: number,
  error: string,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  return NextResponse.json(
    { ok: false, data: null, error },
    { status, headers: { ...BASE_API_HEADERS, ...extraHeaders } },
  );
}

function guardApi(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const rule = matchRateRule(pathname);

  // --- 1) Rate limit, keyed by client IP and route scope ------------------
  const ip = clientIp(request.headers);
  const result = rateLimit(rateLimitKey(ip, rule.scope), rule.limit, rule.windowMs);

  if (!result.success) {
    return jsonError(429, "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید.", {
      ...rateLimitHeaders(result),
    });
  }

  const limitHeaders = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  };

  // --- 2) Body size cap ---------------------------------------------------
  const maxBodyBytes = rule.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    return jsonError(413, "حجم درخواست بیش از حد مجاز است.", limitHeaders);
  }

  // --- 3) Same-origin check for state-changing methods (CSRF) -------------
  if (!isSameOriginRequest(request.method, request.headers)) {
    return jsonError(403, "مبدأ درخواست معتبر نیست.", limitHeaders);
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(limitHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/api/:path*"],
};
