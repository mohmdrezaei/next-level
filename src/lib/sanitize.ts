/**
 * Input sanitisation and safe rich-text rendering.
 *
 * The storefront never injects HTML with `dangerouslySetInnerHTML`, so React's
 * automatic escaping is already the primary XSS defence. This module exists as
 * defence-in-depth: it strips markup *before* anything reaches the database, so
 * a stored payload can never resurface as HTML in an admin table, an email, a
 * CSV export, or a future SSR surface that does render raw HTML.
 *
 * Rule of thumb used throughout: **escape first, then whitelist**. Never take
 * raw user HTML and try to blacklist dangerous tags.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const HTML_ENTITY_RE = /[&<>"']/g;

/** Strip every tag: `<b>hi</b>` → `hi`. */
const HTML_TAG_RE = /<[^>]*>/g;

/** Characters that are invisible or used to smuggle control sequences. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Escape the five characters that matter inside HTML text and attributes. */
export function escapeHtml(input: string): string {
  return String(input ?? "").replace(HTML_ENTITY_RE, (char) => HTML_ENTITY_MAP[char] ?? char);
}

/** Remove HTML tags and invisible control characters. */
export function stripHtml(input: string): string {
  return String(input ?? "")
    .replace(HTML_TAG_RE, "")
    .replace(CONTROL_CHARS_RE, "");
}

/**
 * The workhorse used on every free-text field before it is persisted.
 *
 * 1. normalise the input to a string,
 * 2. strip tags and control characters,
 * 3. collapse whitespace runs,
 * 4. truncate to `maxLength`,
 * 5. trim the edges.
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  const cleaned = stripHtml(typeof input === "string" ? input : String(input ?? ""))
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");

  return cleaned.slice(0, Math.max(0, maxLength)).trim();
}

/** Sanitise every entry of a string array, dropping empties and capping size. */
export function sanitizeStringArray(
  input: unknown,
  { maxItems = 50, maxLength = 200 }: { maxItems?: number; maxLength?: number } = {},
): string[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((value) => sanitizeString(value, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

/**
 * Accept only `http:` / `https:` URLs — blocks `javascript:`, `data:`, `vbscript:`
 * and protocol-relative tricks. Returns `""` for anything else.
 */
export function safeUrl(input: unknown): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  // Reject control characters that browsers strip before parsing the scheme.
  if (CONTROL_CHARS_RE.test(raw)) return "";

  // Protocol-relative `//evil.com` is treated as an external absolute URL.
  if (raw.startsWith("//")) return "";

  // Relative paths inside the app are fine.
  if (raw.startsWith("/")) return raw;

  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? raw : "";
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/*  Safe rich text                                                            */
/* -------------------------------------------------------------------------- */

/** `[label](https://example.com)` — the URL group only matches http(s). */
const LINK_RE = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BOLD_RE = /\*\*([^*\n]+)\*\*/g;
const ITALIC_RE = /(^|[^*])\*([^*\n]+)\*/g;
const INLINE_CODE_RE = /`([^`\n]+)`/g;

/**
 * Render a restricted markdown subset to HTML, safely.
 *
 * The whole document is **escaped first**, so no tag coming from the user can
 * survive. Only then are a handful of markers rewritten into fixed, known-safe
 * tags. Link URLs must already be `http(s)://` (enforced by `LINK_RE`), so
 * `javascript:` and `data:` payloads cannot be produced.
 *
 * The output is intended for trusted rendering by the app (never echo raw user
 * HTML); it is safe because every character outside the whitelisted markers has
 * been escaped.
 */
export function renderRichText(raw: string): string {
  const escaped = escapeHtml(String(raw ?? "").replace(/\r\n?/g, "\n"));

  const lines = escaped.split("\n");
  const blocks: string[] = [];
  let listBuffer: string[] = [];
  let quoteBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length) {
      blocks.push(`<ul>${listBuffer.join("")}</ul>`);
      listBuffer = [];
    }
  };

  const flushQuote = () => {
    if (quoteBuffer.length) {
      blocks.push(`<blockquote>${quoteBuffer.join("<br />")}</blockquote>`);
      quoteBuffer = [];
    }
  };

  /** Apply inline markers to a single already-escaped line. */
  const inline = (line: string): string =>
    line
      .replace(INLINE_CODE_RE, "<code>$1</code>")
      .replace(BOLD_RE, "<strong>$1</strong>")
      .replace(ITALIC_RE, "$1<em>$2</em>")
      .replace(
        LINK_RE,
        '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>',
      );

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      flushQuote();
      continue;
    }

    if (/^###\s+/.test(trimmed)) {
      flushList();
      flushQuote();
      blocks.push(`<h4>${inline(trimmed.replace(/^###\s+/, ""))}</h4>`);
      continue;
    }

    if (/^##\s+/.test(trimmed)) {
      flushList();
      flushQuote();
      blocks.push(`<h3>${inline(trimmed.replace(/^##\s+/, ""))}</h3>`);
      continue;
    }

    if (/^#\s+/.test(trimmed)) {
      flushList();
      flushQuote();
      blocks.push(`<h2>${inline(trimmed.replace(/^#\s+/, ""))}</h2>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushQuote();
      listBuffer.push(`<li>${inline(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flushList();
      quoteBuffer.push(inline(trimmed.replace(/^>\s?/, "")));
      continue;
    }

    flushList();
    flushQuote();
    blocks.push(`<p>${inline(trimmed)}</p>`);
  }

  flushList();
  flushQuote();

  return blocks.join("");
}
