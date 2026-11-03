/**
 * Shared HTTP plumbing for the `app/api` route handlers: a typed error class,
 * a uniform JSON envelope, and a wrapper that turns thrown errors into
 * consistent responses.
 */
import { NextResponse } from "next/server";

import { truncatePayload } from "@/lib/redact";

export interface ApiMeta {
  total?: number;
  page?: number;
  perPage?: number;
  pages?: number;
  [key: string]: unknown;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
  meta?: ApiMeta;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new ApiError(400, message, details);

export const unauthorized = (message = "برای انجام این کار باید وارد حساب خود شوید.") =>
  new ApiError(401, message);

export const forbidden = (message = "شما به این بخش دسترسی ندارید.") => new ApiError(403, message);

export const notFound = (message = "موردی با این شناسه پیدا نشد.") => new ApiError(404, message);

export const conflict = (message: string) => new ApiError(409, message);

export const payloadTooLarge = (message = "حجم درخواست بیش از حد مجاز است.") =>
  new ApiError(413, message);

export const tooManyRequests = (
  message = "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید.",
) => new ApiError(429, message);

/** Success envelope. `meta` is only attached when provided. */
export function ok<T>(data: T, meta?: ApiMeta, status = 200): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json<ApiEnvelope<T>>(
    { ok: true, data, error: null, ...(meta ? { meta } : {}) },
    { status },
  );
}

/** Failure envelope. */
export function fail(
  status: number,
  error: string,
  details?: unknown,
): NextResponse<ApiEnvelope<never>> {
  return NextResponse.json<ApiEnvelope<never>>(
    { ok: false, data: null, error, ...(details ? { meta: { details } } : {}) },
    { status },
  );
}

/** The concrete response type every route handler returns. */
export type ApiResponse = NextResponse<ApiEnvelope<unknown>>;

/**
 * Wrap a route handler so any thrown `ApiError` becomes a proper response and
 * anything unexpected becomes a 500 without leaking internals.
 *
 * The handler is intentionally typed loosely: a single route frequently returns
 * differently-shaped payloads on different branches (e.g. `{ user: null }` for
 * guests), and a narrow generic would reject those.
 */
export async function withApi(handler: () => Promise<ApiResponse>): Promise<ApiResponse> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.status, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "خطای ناشناخته";

    // Server-side diagnostics stay on the server: the client only ever sees the
    // generic 500 below. The line is clamped and never contains the request
    // body, cookies or tokens (see `@/lib/redact`).
    const summary =
      error instanceof Error ? `${error.name}: ${error.message}` : truncatePayload(error, 300);
    console.error(`[api] ${truncatePayload(summary, 500)}`);

    // Surface common PostgreSQL failures with a helpful message.
    if (/ECONNREFUSED|ENOTFOUND|password authentication failed/i.test(message)) {
      return fail(
        503,
        "اتصال به پایگاه داده برقرار نشد. مقدار DATABASE_URL و اجرا بودن PostgreSQL را بررسی کنید.",
      );
    }

    return fail(500, "خطای داخلی سرور.");
  }
}

/**
 * Largest JSON body any route will read, in bytes. The proxy rejects oversized
 * requests before they reach a handler; this is the in-handler backstop for
 * requests that arrive without a `content-length` (chunked transfer encoding).
 */
const MAX_BODY_BYTES = 6 * 1024 * 1024;

/** Parse a JSON body, rejecting malformed or oversized payloads. */
export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw payloadTooLarge();
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    throw badRequest("بدنهٔ درخواست خوانده نشد.");
  }

  if (text.length > MAX_BODY_BYTES) throw payloadTooLarge();
  if (!text.trim()) throw badRequest("بدنهٔ درخواست خالی است.");

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw badRequest("بدنهٔ درخواست JSON معتبر نیست.");
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("بدنهٔ درخواست باید یک شیء JSON باشد.");
  }

  return body as T;
}

export interface Pagination {
  page: number;
  perPage: number;
  offset: number;
}

const DEFAULT_PER_PAGE = 24;
const MAX_PER_PAGE = 100;

/** Read `?page=` / `?perPage=` with sane clamping. */
export function readPagination(searchParams: URLSearchParams): Pagination {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const requested = Number(searchParams.get("perPage") ?? DEFAULT_PER_PAGE) || DEFAULT_PER_PAGE;
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Math.floor(requested)));

  return { page, perPage, offset: (page - 1) * perPage };
}

export const paginationMeta = (total: number, { page, perPage }: Pagination): ApiMeta => ({
  total,
  page,
  perPage,
  pages: Math.max(1, Math.ceil(total / perPage)),
});

/** Split a comma-separated query param into a trimmed, non-empty list. */
export function readList(searchParams: URLSearchParams, key: string): string[] {
  const raw = searchParams.get(key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
