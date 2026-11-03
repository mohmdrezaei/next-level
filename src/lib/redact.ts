/**
 * Log hygiene helpers.
 *
 * Nothing in this module ever logs. It exists so that the *rest* of the server
 * can log diagnostics without writing bearer credentials, secrets or full
 * personal data into the log stream, where they would outlive the request and
 * be visible to anyone with log access.
 */

/** A payment/session token is a bearer credential — only a prefix is logged. */
export function maskToken(token: unknown): string {
  const value = String(token ?? "");
  if (!value) return "(none)";
  if (value.length <= 8) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 8)}…`;
}

/** `ali.reza@gmail.com` → `al***@gmail.com`. */
export function maskEmail(email: unknown): string {
  const value = String(email ?? "").trim();
  const at = value.indexOf("@");
  if (at < 1) return value ? "***" : "(none)";

  const local = value.slice(0, at);
  const domain = value.slice(at);
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}***${domain}`;
}

/** `09121234567` → `0912***4567`. */
export function maskPhone(phone: unknown): string {
  const value = String(phone ?? "").trim();
  if (value.length <= 6) return value ? "***" : "(none)";
  return `${value.slice(0, 4)}***${value.slice(-3)}`;
}

/** `Ali Rezaei` → `Ali R.`. */
export function maskName(name: unknown): string {
  const value = String(name ?? "").trim();
  if (!value) return "(none)";
  const [first, ...rest] = value.split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1].slice(0, 1)}.` : first;
}

/** Clamp an arbitrary payload (an upstream response body, a stack trace…). */
export function truncatePayload(value: unknown, max = 2000): string {
  const text = typeof value === "string" ? value : safeStringify(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max)}… (truncated, ${text.length - max} more chars)`;
}

function safeStringify(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserialisable]";
  }
}

/**
 * Strip credentials out of a URL before logging it — query strings frequently
 * carry `?token=…`, `?api_key=…`, `?code=…` (OTP / OAuth).
 */
const SENSITIVE_QUERY_KEYS = /^(token|access_token|refresh_token|api_?key|secret|password|passcode|code|otp|signature|sig|auth)$/i;

export function redactUrl(input: unknown): string {
  const raw = String(input ?? "");
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEYS.test(key)) url.searchParams.set(key, "***");
    }
    if (url.username || url.password) {
      url.username = "***";
      url.password = "";
    }
    return url.toString();
  } catch {
    return raw;
  }
}

/**
 * One-line, structured description of a failed outbound request, with the URL
 * redacted and the error message clamped.
 */
export function describeFetchError(error: unknown, url?: string): string {
  const parts: string[] = [];
  if (url) parts.push(`url=${redactUrl(url)}`);

  if (error instanceof Error) {
    parts.push(`name=${error.name}`);
    parts.push(`message=${truncatePayload(error.message, 300)}`);
    if (error.cause) parts.push(`cause=${truncatePayload(safeStringify(error.cause), 200)}`);
  } else {
    parts.push(`error=${truncatePayload(safeStringify(error), 300)}`);
  }

  return parts.join(" ");
}
