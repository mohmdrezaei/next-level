/**
 * Dependency-free request validation.
 *
 * The project deliberately avoids a runtime validation library: it already
 * hand-rolls password hashing and id generation, and every dependency added to
 * an Edge-adjacent bundle has to earn its place. This module gives the same
 * ergonomics as a schema library — declarative field specs, typed output, hard
 * length/size caps, normalisation and precise 400 responses — in ~300 lines of
 * plain TypeScript.
 *
 * If the team would rather use Zod, `pnpm add zod` and swap `parseBody()` for a
 * `schema.safeParse()` wrapper; every call site already goes through
 * `parseBody()`, so nothing else has to change.
 *
 * Principles enforced here:
 * - **Every string has a maximum length.** Unbounded text is a DoS vector.
 * - **Every number has a range.** Prices, quantities and page sizes are clamped.
 * - **Input is normalised before it is stored** (Persian → ASCII digits, trim).
 * - **HTML is stripped by default** so nothing dangerous reaches the database.
 * - **Errors are specific but shallow** — a field name and a message, never a
 *   stack trace or an internal identifier.
 */
import { cleanPhone, isValidPhone, toLatinDigits } from "./phone";
import { badRequest, readJson } from "./http";
import { sanitizeString } from "@/lib/sanitize";

/* -------------------------------------------------------------------------- */
/*  Core types                                                                */
/* -------------------------------------------------------------------------- */

/** A single validated field. The phantom `T` drives `Infer<Shape>`. */
export interface FieldSpec<T> {
  parse(value: unknown): T;
}

export type Shape = Record<string, FieldSpec<unknown>>;

export type Infer<S extends Shape> = {
  [K in keyof S]: S[K] extends FieldSpec<infer T> ? T : never;
};

/** Internal: carries the field name so `validate()` can build a field map. */
class FieldError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "FieldError";
  }
}

const label = (name: string | undefined, fallback: string) => name ?? fallback;

/* -------------------------------------------------------------------------- */
/*  String                                                                    */
/* -------------------------------------------------------------------------- */

export interface StringOptions {
  /** Persian name used in error messages, e.g. "نام". */
  label?: string;
  /** Minimum length after trimming. */
  min?: number;
  /** Maximum length — the value is truncated, not rejected, when longer. */
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
  /** Strip HTML tags (default `true`). */
  sanitize?: boolean;
  /** Trim the result (default `true`). */
  trim?: boolean;
  /** Convert Persian/Arabic digits to ASCII before validating. */
  latinDigits?: boolean;
  /** Fallback used when the value is absent or empty. */
  default?: string;
}

function buildString(options: StringOptions, required: boolean, fieldLabel: string) {
  const {
    label: customLabel,
    min = 0,
    max = 1000,
    pattern,
    patternMessage,
    sanitize = true,
    trim = true,
    latinDigits = false,
    default: fallback,
  } = options;

  const name = label(customLabel, fieldLabel);

  return (value: unknown, key: string): string | undefined => {
    if (value === undefined || value === null || value === "") {
      if (fallback !== undefined) return fallback;
      if (!required) return undefined;
      throw new FieldError(key, `${name} الزامی است.`);
    }

    if (typeof value !== "string" && typeof value !== "number") {
      throw new FieldError(key, `${name} باید متن باشد.`);
    }

    let text = sanitize
      ? sanitizeString(value, max)
      : String(value).slice(0, max).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
    if (latinDigits) text = toLatinDigits(text);
    if (trim) text = text.trim();

    if (!text) {
      if (fallback !== undefined) return fallback;
      if (!required) return undefined;
      throw new FieldError(key, `${name} الزامی است.`);
    }

    if (text.length < min) {
      throw new FieldError(key, `${name} باید حداقل ${min} کاراکتر باشد.`);
    }

    if (pattern && !pattern.test(text)) {
      throw new FieldError(key, patternMessage ?? `${name} معتبر نیست.`);
    }

    return text;
  };
}

/** Required string. */
export function str(options: StringOptions = {}): FieldSpec<string> {
  const parse = buildString(options, true, "این فیلد");
  return { parse: (value) => parse(value, "field") as string };
}

/** Optional string — resolves to `undefined` when absent. */
export function strOptional(options: StringOptions = {}): FieldSpec<string | undefined> {
  const parse = buildString(options, false, "این فیلد");
  return { parse: (value) => parse(value, "field") };
}

/**
 * Required string with a *named* field so error messages can point at it.
 * `named("email", { ... })` keeps the declaration readable at the call site.
 */
function named<T>(field: string, spec: FieldSpec<T>): FieldSpec<T> {
  return { parse: (value) => spec.parse(value) };
}

/** Attach a field name to a spec (used internally by `object()`). */
export function field<T>(name: string, spec: FieldSpec<T>): FieldSpec<T> {
  return named(name, spec);
}

/* -------------------------------------------------------------------------- */
/*  Email / phone / slug                                                      */
/* -------------------------------------------------------------------------- */

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function email(options: StringOptions = {}): FieldSpec<string> {
  return {
    parse: (value) => {
      const text = str({
        label: "ایمیل",
        max: 254,
        latinDigits: true,
        ...options,
      }).parse(value);

      const normalised = text.toLowerCase();
      if (!EMAIL_RE.test(normalised)) {
        throw new FieldError("email", "ایمیل معتبر نیست.");
      }
      return normalised;
    },
  };
}

export function emailOptional(options: StringOptions = {}): FieldSpec<string | undefined> {
  return {
    parse: (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      return email(options).parse(value);
    },
  };
}

/** Iranian mobile number, normalised to `09xxxxxxxxx`. */
export function phone(options: StringOptions = {}): FieldSpec<string> {
  return {
    parse: (value) => {
      const text = str({ label: "شماره موبایل", max: 20, ...options }).parse(value);
      const cleaned = cleanPhone(text);
      if (!isValidPhone(cleaned)) {
        throw new FieldError("phone", "شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد.");
      }
      return cleaned;
    },
  };
}

export function phoneOptional(options: StringOptions = {}): FieldSpec<string | undefined> {
  return {
    parse: (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      return phone(options).parse(value);
    },
  };
}

/** URL-safe identifier: lowercase latin, digits and single hyphens. */
export function slug(options: StringOptions = {}): FieldSpec<string> {
  return {
    parse: (value) =>
      str({
        label: "نامک",
        min: 1,
        max: 100,
        latinDigits: true,
        pattern: SLUG_RE,
        patternMessage: "نامک فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و خط تیره باشد.",
        ...options,
      }).parse(value),
  };
}

/* -------------------------------------------------------------------------- */
/*  Numbers                                                                   */
/* -------------------------------------------------------------------------- */

export interface NumberOptions {
  label?: string;
  min?: number;
  max?: number;
  /** Round to an integer (default `true`). */
  integer?: boolean;
  default?: number;
}

function buildNumber(options: NumberOptions, required: boolean, fieldLabel: string) {
  const { label: customLabel, min, max, integer = true, default: fallback } = options;
  const name = label(customLabel, fieldLabel);

  return (value: unknown, key: string): number | undefined => {
    if (value === undefined || value === null || value === "") {
      if (fallback !== undefined) return fallback;
      if (!required) return undefined;
      throw new FieldError(key, `${name} الزامی است.`);
    }

    const raw = typeof value === "string" ? toLatinDigits(value).trim() : value;
    const parsed = Number(raw);

    if (!Number.isFinite(parsed)) {
      throw new FieldError(key, `${name} باید عدد باشد.`);
    }

    const normalised = integer ? Math.trunc(parsed) : parsed;

    if (min !== undefined && normalised < min) {
      throw new FieldError(key, `${name} نمی‌تواند کمتر از ${min} باشد.`);
    }
    if (max !== undefined && normalised > max) {
      throw new FieldError(key, `${name} نمی‌تواند بیشتر از ${max} باشد.`);
    }

    return normalised;
  };
}

export function int(options: NumberOptions = {}): FieldSpec<number> {
  const parse = buildNumber({ integer: true, ...options }, true, "این فیلد");
  return { parse: (value) => parse(value, "field") as number };
}

export function intOptional(options: NumberOptions = {}): FieldSpec<number | undefined> {
  const parse = buildNumber({ integer: true, ...options }, false, "این فیلد");
  return { parse: (value) => parse(value, "field") };
}

export function num(options: NumberOptions = {}): FieldSpec<number> {
  const parse = buildNumber({ integer: false, ...options }, true, "این فیلد");
  return { parse: (value) => parse(value, "field") as number };
}

/* -------------------------------------------------------------------------- */
/*  Boolean                                                                   */
/* -------------------------------------------------------------------------- */

const TRUE_VALUES = new Set(["true", "1", "on", "yes"]);
const FALSE_VALUES = new Set(["false", "0", "off", "no"]);

export function bool(options: { default?: boolean } = {}): FieldSpec<boolean> {
  return {
    parse: (value) => {
      if (value === undefined || value === null || value === "") {
        if (options.default !== undefined) return options.default;
        return false;
      }
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value !== 0;

      const text = String(value).trim().toLowerCase();
      if (TRUE_VALUES.has(text)) return true;
      if (FALSE_VALUES.has(text)) return false;
      throw new FieldError("field", "مقدار درست/نادرست معتبر نیست.");
    },
  };
}

/** Optional boolean — `undefined` when the key is absent (for PATCH merges). */
export function boolOptional(): FieldSpec<boolean | undefined> {
  return {
    parse: (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      return bool().parse(value);
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Enums and arrays                                                          */
/* -------------------------------------------------------------------------- */

export function oneOf<T extends string>(
  values: readonly T[],
  options: { label?: string; default?: T } = {},
): FieldSpec<T> {
  const name = label(options.label, "این فیلد");

  return {
    parse: (value) => {
      if ((value === undefined || value === null || value === "") && options.default !== undefined) {
        return options.default;
      }

      const text = String(value ?? "").trim();
      if ((values as readonly string[]).includes(text)) return text as T;

      throw new FieldError("field", `${name} باید یکی از این مقادیر باشد: ${values.join(", ")}.`);
    },
  };
}

export function arrayOf<T>(
  item: FieldSpec<T>,
  options: { min?: number; max?: number; label?: string } = {},
): FieldSpec<T[]> {
  const { min = 0, max = 200, label: customLabel } = options;
  const name = label(customLabel, "فهرست");

  return {
    parse: (value) => {
      if (value === undefined || value === null) {
        throw new FieldError("field", `${name} الزامی است.`);
      }
      if (!Array.isArray(value)) {
        throw new FieldError("field", `${name} باید یک فهرست باشد.`);
      }
      if (value.length < min) {
        throw new FieldError("field", `${name} باید حداقل ${min} مورد داشته باشد.`);
      }
      if (value.length > max) {
        throw new FieldError("field", `${name} نمی‌تواند بیش از ${max} مورد باشد.`);
      }
      return value.map((entry) => item.parse(entry));
    },
  };
}

/** Nested object with its own shape. */
export function object<S extends Shape>(shape: S, options: { label?: string } = {}): FieldSpec<Infer<S>> {
  const name = label(options.label, "این بخش");

  return {
    parse: (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new FieldError("field", `${name} باید یک شیء باشد.`);
      }
      return validateShape(value as Record<string, unknown>, shape);
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Shape validation                                                          */
/* -------------------------------------------------------------------------- */

/** Validate a plain object against a shape, collecting one error per field. */
export function validateShape<S extends Shape>(source: Record<string, unknown>, shape: S): Infer<S> {
  const errors: Record<string, string> = {};
  const output: Record<string, unknown> = {};

  for (const [key, spec] of Object.entries(shape) as [string, FieldSpec<unknown>][]) {
    try {
      output[key] = spec.parse(source[key]);
    } catch (error) {
      if (error instanceof FieldError) {
        errors[key] = error.message;
      } else if (error instanceof Error) {
        errors[key] = error.message;
      } else {
        errors[key] = "مقدار نامعتبر است.";
      }
    }
  }

  const failed = Object.keys(errors);
  if (failed.length) {
    const [first] = failed;
    // A single, human-readable summary plus a machine-readable field map.
    throw badRequest(Object.values(errors).join(" "), { field: first, fields: errors });
  }

  return output as Infer<S>;
}

/**
 * Read and validate a JSON request body.
 *
 * Throws a `400 ApiError` — with `{ field, fields }` in `details` — for a
 * malformed body or a failed field, so `withApi()` turns it into the standard
 * error envelope without any extra handling at the call site.
 */
export async function parseBody<S extends Shape>(request: Request, shape: S): Promise<Infer<S>> {
  const raw = await readJson<Record<string, unknown>>(request);
  return validateShape(raw, shape);
}

/** Validate `URLSearchParams` (query strings) against a shape. */
export function parseQuery<S extends Shape>(searchParams: URLSearchParams, shape: S): Infer<S> {
  const source: Record<string, unknown> = {};
  for (const key of Object.keys(shape)) {
    source[key] = searchParams.get(key) ?? undefined;
  }
  return validateShape(source, shape);
}
