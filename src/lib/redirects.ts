/**
 * Redirect-target validation.
 *
 * A `?next=` parameter that is fed straight into `redirect()` is a classic
 * open-redirect: `//evil.com` and `/\evil.com` are treated as protocol-relative
 * URLs by browsers, so an attacker can bounce a freshly-authenticated user to a
 * look-alike domain. Everything that consumes a user-supplied path goes through
 * `safeInternalPath()`.
 */

const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/;

/**
 * Return `value` when it is a safe, same-origin path; otherwise `fallback`.
 *
 * Rejects:
 * - anything that is not rooted (`https://evil.com`, `javascript:alert(1)`);
 * - protocol-relative and backslash tricks (`//evil.com`, `/\evil.com`, `/\/x`);
 * - control characters, which some parsers strip before resolving the URL.
 */
export function safeInternalPath(value: unknown, fallback = "/account"): string {
  const raw = String(value ?? "").trim();

  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (CONTROL_CHARS_RE.test(raw)) return fallback;

  try {
    // Resolve against a throwaway origin: if the result escapes it, reject.
    const probe = new URL(raw, "http://internal.invalid");
    if (probe.origin !== "http://internal.invalid") return fallback;
    if (probe.pathname.startsWith("//")) return fallback;

    return `${probe.pathname}${probe.search}${probe.hash}`;
  } catch {
    return fallback;
  }
}
