/**
 * Curated-set repository. A "set" is a complete look: a bundle of products
 * sold together at a discount. Identity is the slug.
 */
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { products, setItems, sets } from "@/db/schema";
import type { Product } from "@/features/products/types";
import type { ProductSet, ResolvedSet, SetItem } from "@/features/sets/types";
import { slugify } from "@/lib/utils";
import { sanitizeString } from "@/lib/sanitize";

import { badRequest, conflict, notFound } from "../http";
import { getProductsByIds } from "./products";
import { containsPattern } from "../sql";

/* -------------------------------------------------------------------------- */
/*  Input contract                                                            */
/* -------------------------------------------------------------------------- */

export interface SetItemInput {
  productId: string;
  role: string;
}

/** Loose variant accepted by the repository / REST API. */
export interface SetItemDraft {
  productId: string;
  role?: string;
}

/** The complete set payload — what the admin form builds. */
export interface SetInput {
  slug: string;
  title: string;
  latinTitle: string;
  subtitle: string;
  description: string;
  occasion: string;
  season: string;
  discountRate: number;
  featured: boolean;
  accent: string;
  items: SetItemInput[];
}

/** What the repository accepts; only `title` and two-plus pieces are required. */
export type SetDraft = Partial<Omit<SetInput, "items">> & {
  title: string;
  items: SetItemDraft[];
};

export interface SetQuery {
  featured?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
}

type SetRow = typeof sets.$inferSelect;
type SetItemRow = typeof setItems.$inferSelect;

/* -------------------------------------------------------------------------- */
/*  Mapping                                                                   */
/* -------------------------------------------------------------------------- */

function mapSet(row: SetRow, items: SetItemRow[]): ProductSet {
  return {
    slug: row.slug,
    title: row.title,
    latinTitle: row.latinTitle,
    subtitle: row.subtitle,
    description: row.description,
    occasion: row.occasion,
    season: row.season,
    discountRate: row.discountRate,
    featured: row.featured,
    accent: row.accent,
    items: items.map((item): SetItem => ({ productId: item.productId, role: item.role })),
  };
}

async function attachItems(rows: SetRow[]): Promise<ProductSet[]> {
  if (!rows.length) return [];

  const slugs = rows.map((row) => row.slug);
  const items = await db
    .select()
    .from(setItems)
    .where(inArray(setItems.setSlug, slugs))
    .orderBy(asc(setItems.setSlug), asc(setItems.position));

  const grouped = new Map<string, SetItemRow[]>();
  for (const item of items) {
    const bucket = grouped.get(item.setSlug);
    if (bucket) bucket.push(item);
    else grouped.set(item.setSlug, [item]);
  }

  return rows.map((row) => mapSet(row, grouped.get(row.slug) ?? []));
}

/** Turn a set definition into a set whose pieces are real products. */
export function resolveSet(set: ProductSet, catalogue: Product[]): ResolvedSet {
  const byId = new Map(catalogue.map((product) => [product.id, product]));

  return {
    ...set,
    items: set.items.flatMap((item) => {
      const product = byId.get(item.productId);
      return product ? [{ role: item.role, product }] : [];
    }),
  };
}

async function resolveAll(definitions: ProductSet[]): Promise<ResolvedSet[]> {
  const ids = [...new Set(definitions.flatMap((set) => set.items.map((item) => item.productId)))];
  const catalogue = await getProductsByIds(ids);
  return definitions.map((set) => resolveSet(set, catalogue));
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                     */
/* -------------------------------------------------------------------------- */

export async function listSets(query: SetQuery = {}): Promise<ProductSet[]> {
  const conditions = [];
  if (query.featured !== undefined) conditions.push(eq(sets.featured, query.featured));
  if (query.q?.trim()) conditions.push(sql`${sets.title} ilike ${containsPattern(query.q.trim())}`);

  const rows = await db
    .select()
    .from(sets)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(sets.featured), asc(sets.title))
    .limit(query.limit ?? 100)
    .offset(query.offset ?? 0);

  return attachItems(rows);
}

export async function countSets(query: SetQuery = {}): Promise<number> {
  const conditions = [];
  if (query.featured !== undefined) conditions.push(eq(sets.featured, query.featured));
  if (query.q?.trim()) conditions.push(sql`${sets.title} ilike ${containsPattern(query.q.trim())}`);

  const rows = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(sets)
    .where(conditions.length ? and(...conditions) : undefined);

  return rows[0]?.value ?? 0;
}

export async function getSet(slug: string): Promise<ProductSet | null> {
  const rows = await db.select().from(sets).where(eq(sets.slug, slug)).limit(1);
  return rows.length ? (await attachItems(rows))[0] : null;
}

export async function getResolvedSets(query: SetQuery = {}): Promise<ResolvedSet[]> {
  return resolveAll(await listSets(query));
}

export async function getFeaturedSets(limit = 8): Promise<ResolvedSet[]> {
  return resolveAll(await listSets({ featured: true, limit }));
}

export async function getResolvedSet(slug: string): Promise<ResolvedSet | null> {
  const set = await getSet(slug);
  if (!set) return null;
  return (await resolveAll([set]))[0] ?? null;
}

/** Sets that contain a given product — used for cross-selling on the PDP. */
export async function getSetsContainingProduct(
  productId: string,
  limit = 2,
): Promise<ResolvedSet[]> {
  const rows = await db
    .select({ set: sets })
    .from(setItems)
    .innerJoin(sets, eq(sets.slug, setItems.setSlug))
    .where(eq(setItems.productId, productId))
    .orderBy(desc(sets.featured))
    .limit(limit);

  return resolveAll(await attachItems(rows.map((row) => row.set)));
}

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

function normaliseItems(items: SetItemDraft[] | undefined): SetItemDraft[] {
  const seen = new Set<string>();
  const result: SetItemDraft[] = [];

  for (const item of items ?? []) {
    const productId = String(item?.productId ?? "").trim();
    if (!productId || seen.has(productId)) continue;
    seen.add(productId);
    result.push({ productId, role: sanitizeString(item.role ?? "", 60) || "قطعه" });
  }

  return result;
}

async function validate(input: SetDraft, slug: string, currentSlug?: string): Promise<SetItemDraft[]> {
  if (!input || typeof input !== "object") throw badRequest("اطلاعات ست ارسال نشده است.");
  if (typeof input.title !== "string" || input.title.trim().length < 3) {
    throw badRequest("عنوان ست باید حداقل ۳ کاراکتر باشد.", { field: "title" });
  }
  if (!slug) throw badRequest("نامک (slug) ست معتبر نیست.", { field: "slug" });

  const duplicate = await db.select({ slug: sets.slug }).from(sets).where(eq(sets.slug, slug));
  if (duplicate.some((row) => row.slug !== currentSlug)) {
    throw conflict("ست دیگری با این نامک وجود دارد.");
  }

  const items = normaliseItems(input.items);
  if (items.length < 2) throw badRequest("هر ست باید حداقل دو قطعه داشته باشد.", { field: "items" });

  if (input.discountRate !== undefined && (!Number.isFinite(input.discountRate) || input.discountRate < 0)) {
    throw badRequest("درصد تخفیف معتبر نیست.", { field: "discountRate" });
  }

  const known = await db
    .select({ id: products.id })
    .from(products)
    .where(inArray(products.id, items.map((item) => item.productId)));

  const knownIds = new Set(known.map((row) => row.id));
  if (items.some((item) => !knownIds.has(item.productId))) {
    throw badRequest("یکی از قطعه‌های انتخابی در فهرست محصولات نیست.", { field: "items" });
  }

  return items;
}

/* -------------------------------------------------------------------------- */
/*  Writes                                                                    */
/* -------------------------------------------------------------------------- */

async function writeItems(slug: string, items: SetItemDraft[]): Promise<void> {
  await db.delete(setItems).where(eq(setItems.setSlug, slug));

  if (!items.length) return;

  await db.insert(setItems).values(
    items.map((item, index) => ({
      setSlug: slug,
      productId: item.productId,
      role: item.role ?? "قطعه",
      position: index,
    })),
  );
}

/**
 * Sanitise + clamp the editable text fields of a set.
 *
 * Titles, subtitles and descriptions are rendered on the storefront, so they
 * are stripped of markup and length-capped here — the single choke point shared
 * by create and update. `accent` feeds a CSS custom property, so it is
 * restricted to a literal hex colour.
 */
function prepareSetFields(input: SetDraft, fallbackAccent: string) {
  const title = sanitizeString(input.title, 120);
  const subtitle = sanitizeString(input.subtitle ?? "", 300);
  const accentCandidate = String(input.accent ?? "").trim();

  return {
    title,
    latinTitle: sanitizeString(input.latinTitle ?? "", 120) || title,
    subtitle,
    description: sanitizeString(input.description ?? "", 4000) || subtitle,
    occasion: sanitizeString(input.occasion ?? "", 80) || "همه‌کاره",
    season: sanitizeString(input.season ?? "", 80) || "چهارفصل",
    discountRate: Math.min(0.5, Math.max(0, input.discountRate ?? 0)),
    featured: Boolean(input.featured),
    accent: /^#[0-9a-fA-F]{3,8}$/.test(accentCandidate) ? accentCandidate : fallbackAccent,
  };
}

export async function createSet(input: SetDraft): Promise<ProductSet> {
  const slug = slugify(input.slug || input.latinTitle || input.title);
  const items = await validate(input, slug);

  await db.insert(sets).values({
    slug,
    ...prepareSetFields(input, "#c8a24c"),
  });

  await writeItems(slug, items);

  const created = await getSet(slug);
  if (!created) throw notFound("ست ایجاد شد اما بازخوانی نشد.");
  return created;
}

export async function updateSet(slug: string, input: SetDraft): Promise<ProductSet> {
  const existing = await getSet(slug);
  if (!existing) throw notFound("ست مورد نظر یافت نشد.");

  const nextSlug = slugify(input.slug || input.latinTitle || input.title) || slug;
  const items = await validate(input, nextSlug, slug);

  await db
    .update(sets)
    .set({
      slug: nextSlug,
      ...prepareSetFields(input, existing.accent),
    })
    .where(eq(sets.slug, slug));

  // `set_items.set_slug` cascades on update via the FK, so re-insert explicitly.
  await writeItems(nextSlug, items);

  const updated = await getSet(nextSlug);
  if (!updated) throw notFound("ست مورد نظر یافت نشد.");
  return updated;
}

export async function deleteSet(slug: string): Promise<ProductSet> {
  const [existing] = await deleteSets([slug]);
  if (!existing) throw notFound("ست مورد نظر یافت نشد.");
  return existing;
}

/** Bulk delete used by the admin panel's group actions. */
export async function deleteSets(slugs: string[]): Promise<ProductSet[]> {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (!unique.length) return [];

  const removed: ProductSet[] = [];
  for (const slug of unique) {
    const existing = await getSet(slug);
    if (existing) removed.push(existing);
  }
  if (!removed.length) return [];

  await db.delete(sets).where(inArray(sets.slug, removed.map((set) => set.slug)));
  return removed;
}

export async function duplicateSet(slug: string): Promise<ProductSet> {
  const source = await getSet(slug);
  if (!source) throw notFound("ست مورد نظر یافت نشد.");

  let nextSlug = `${source.slug}-copy`;
  let counter = 2;
  while ((await db.select({ slug: sets.slug }).from(sets).where(eq(sets.slug, nextSlug))).length) {
    nextSlug = `${source.slug}-copy-${counter}`;
    counter += 1;
  }

  await db.insert(sets).values({
    slug: nextSlug,
    title: `${source.title} (کپی)`,
    latinTitle: source.latinTitle,
    subtitle: source.subtitle,
    description: source.description,
    occasion: source.occasion,
    season: source.season,
    discountRate: source.discountRate,
    featured: false,
    accent: source.accent,
  });

  await writeItems(nextSlug, source.items.map((item) => ({ productId: item.productId, role: item.role })));

  const created = await getSet(nextSlug);
  if (!created) throw notFound("کپی ایجاد شد اما بازخوانی نشد.");
  return created;
}
