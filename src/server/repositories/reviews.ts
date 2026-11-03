/**
 * Product-review repository with database and in-memory fallback store.
 */
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import type { ProductReview } from "@/features/products/types";
import { sanitizeString } from "@/lib/sanitize";

import { badRequest, notFound } from "../http";
import { newId } from "../ids";

type ReviewRow = typeof reviews.$inferSelect;

function mapReview(row: ReviewRow): ProductReview {
  return {
    id: row.id,
    productId: row.productId,
    author: row.author,
    rating: row.rating,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    verified: row.verified,
    helpful: row.helpful,
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __memoryReviews: ProductReview[] | undefined;
}

export function getMemoryReviews(): ProductReview[] {
  if (!globalThis.__memoryReviews) {
    globalThis.__memoryReviews = [];
  }
  return globalThis.__memoryReviews;
}

export interface ReviewQuery {
  productId?: string;
  minRating?: number;
  limit?: number;
  offset?: number;
}

export async function listReviews(query: ReviewQuery = {}): Promise<ProductReview[]> {
  try {
    const conditions = [];
    if (query.productId) conditions.push(eq(reviews.productId, query.productId));
    if (typeof query.minRating === "number") conditions.push(sql`${reviews.rating} >= ${query.minRating}`);

    const rows = await db
      .select()
      .from(reviews)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(reviews.createdAt))
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);

    return rows.map(mapReview);
  } catch {
    const mem = getMemoryReviews();
    return mem
      .filter((r) => {
        if (query.productId && r.productId !== query.productId) return false;
        if (typeof query.minRating === "number" && r.rating < query.minRating) return false;
        return true;
      })
      .slice(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 50));
  }
}

export async function countReviews(query: ReviewQuery = {}): Promise<number> {
  try {
    const conditions = [];
    if (query.productId) conditions.push(eq(reviews.productId, query.productId));

    const rows = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(reviews)
      .where(conditions.length ? and(...conditions) : undefined);

    return rows[0]?.value ?? 0;
  } catch {
    const mem = getMemoryReviews();
    return mem.filter((r) => {
      if (query.productId && r.productId !== query.productId) return false;
      return true;
    }).length;
  }
}

/** Star histogram, highest star first. */
export function buildRatingBreakdown(list: ProductReview[]): { stars: number; count: number }[] {
  const buckets = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: list.filter((review) => Math.round(review.rating) === stars).length,
  }));

  return buckets;
}

export interface RatingSummary {
  average: number;
  total: number;
  breakdown: { stars: number; count: number }[];
}

export async function getRatingSummary(productId: string): Promise<RatingSummary> {
  try {
    const rows = await db
      .select({ rating: reviews.rating, value: sql<number>`count(*)::int` })
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .groupBy(reviews.rating);

    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const weighted = rows.reduce((sum, row) => sum + row.rating * row.value, 0);

    const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: rows.find((row) => row.rating === stars)?.value ?? 0,
    }));

    return { average: total ? weighted / total : 0, total, breakdown };
  } catch {
    const mem = getMemoryReviews().filter((r) => r.productId === productId);
    const total = mem.length;
    const weighted = mem.reduce((sum, r) => sum + r.rating, 0);
    const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: mem.filter((r) => Math.round(r.rating) === stars).length,
    }));
    return { average: total ? weighted / total : 0, total, breakdown };
  }
}

export interface ReviewInput {
  productId: string;
  author: string;
  rating: number;
  title?: string;
  body?: string;
  verified?: boolean;
}

/** Recompute the denormalised rating/reviewCount on the product row. */
async function syncProductRating(productId: string): Promise<void> {
  try {
    const rows = await db
      .select({
        average: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
        total: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    const stats = rows[0];
    await db
      .update(products)
      .set({ rating: stats?.average ?? 0, reviewCount: stats?.total ?? 0 })
      .where(eq(products.id, productId));
  } catch {
    // Non-fatal if DB is offline
  }
}

export async function createReview(input: ReviewInput): Promise<ProductReview> {
  if (!input?.productId) throw badRequest("شناسهٔ محصول الزامی است.", { field: "productId" });
  if (!input.author?.trim() || input.author.trim().length < 2) {
    throw badRequest("نام نویسنده باید حداقل ۲ کاراکتر باشد.", { field: "author" });
  }

  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw badRequest("امتیاز باید عددی بین ۱ تا ۵ باشد.", { field: "rating" });
  }

  const id = newId("r");
  const newReviewItem: ProductReview = {
    id,
    productId: input.productId,
    author: sanitizeString(input.author, 60),
    rating,
    title: sanitizeString(input.title ?? "", 120),
    body: sanitizeString(input.body ?? "", 2000),
    createdAt: new Date().toISOString(),
    verified: Boolean(input.verified),
    helpful: 0,
  };

  try {
    const productRows = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, input.productId))
      .limit(1);
    if (!productRows.length) throw notFound("محصول مورد نظر یافت نشد.");

    await db.insert(reviews).values({
      id,
      productId: input.productId,
      author: newReviewItem.author,
      rating,
      title: newReviewItem.title,
      body: newReviewItem.body,
      verified: newReviewItem.verified,
      helpful: 0,
    });

    await syncProductRating(input.productId);

    const rows = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!rows[0]) throw notFound("نظر ثبت شد اما بازخوانی نشد.");
    return mapReview(rows[0]);
  } catch {
    const mem = getMemoryReviews();
    mem.unshift(newReviewItem);
    return newReviewItem;
  }
}

export async function markReviewHelpful(id: string): Promise<ProductReview> {
  try {
    const rows = await db
      .update(reviews)
      .set({ helpful: sql`${reviews.helpful} + 1` })
      .where(eq(reviews.id, id))
      .returning();

    if (!rows[0]) throw notFound("نظر مورد نظر یافت نشد.");
    return mapReview(rows[0]);
  } catch {
    const mem = getMemoryReviews();
    const item = mem.find((r) => r.id === id);
    if (!item) throw notFound("نظر مورد نظر یافت نشد.");
    item.helpful += 1;
    return item;
  }
}

export async function deleteReview(id: string): Promise<ProductReview> {
  try {
    const rows = await db.delete(reviews).where(eq(reviews.id, id)).returning();
    const row = rows[0];
    if (!row) throw notFound("نظر مورد نظر یافت نشد.");

    await syncProductRating(row.productId);
    return mapReview(row);
  } catch {
    const mem = getMemoryReviews();
    const index = mem.findIndex((r) => r.id === id);
    if (index === -1) throw notFound("نظر مورد نظر یافت نشد.");
    const [removed] = mem.splice(index, 1);
    return removed;
  }
}
