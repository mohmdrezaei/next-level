/**
 * Tiny typed wrapper around `fetch` for the `app/api` REST surface.
 *
 * Every route answers with the same envelope (`{ ok, data, error, meta }`), so
 * callers only have to deal with `data` or a thrown `ApiError`. Validation
 * failures carry the offending field name in `meta.details.field`, which the
 * forms use to highlight the right input.
 */

export interface ApiMeta {
  total?: number;
  page?: number;
  perPage?: number;
  pages?: number;
  details?: { field?: string } & Record<string, unknown>;
  [key: string]: unknown;
}

interface Envelope<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
  meta?: ApiMeta;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly field?: string;
  readonly details?: unknown;

  constructor(status: number, message: string, field?: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.field = field;
    this.details = details;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Query string parameters; `undefined`/`null` values are dropped. */
  query?: Record<string, string | number | boolean | null | undefined>;
}

function withQuery(url: string, query?: ApiFetchOptions["query"]): string {
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

/**
 * Call an API route and return its `data`.
 *
 * @throws {ApiClientError} whenever the response is not `ok`.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, query, headers, ...rest } = options;

  const response = await fetch(withQuery(path, query), {
    ...rest,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    throw new ApiClientError(
      response.status,
      payload?.error ?? "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.",
      payload?.meta?.details?.field,
      payload?.meta?.details,
    );
  }

  return payload.data as T;
}
