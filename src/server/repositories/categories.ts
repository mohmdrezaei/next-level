/**
 * Category repository. Categories are a small, mostly-static reference table,
 * but keeping them in the database lets the admin panel manage them.
 */
import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Category, CategorySlug } from "@/features/products/types";
import { sanitizeString } from "@/lib/sanitize";

import { badRequest, conflict, notFound } from "../http";

type CategoryRow = typeof categories.$inferSelect;

function mapCategory(row: CategoryRow): Category {
  return {
    slug: row.slug as CategorySlug,
    title: row.title,
    latinTitle: row.latinTitle,
    description: row.description,
  };
}

export async function listCategories(): Promise<Category[]> {
  const rows = await db.select().from(categories).orderBy(asc(categories.position), asc(categories.slug));
  return rows.map(mapCategory);
}

export async function getCategory(slug: string): Promise<Category | null> {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return rows[0] ? mapCategory(rows[0]) : null;
}

/** Categories with a live product count, for the shop sidebar and admin list. */
export async function categoriesWithCounts(): Promise<(Category & { productCount: number })[]> {
  const rows = await db
    .select({
      slug: categories.slug,
      title: categories.title,
      latinTitle: categories.latinTitle,
      description: categories.description,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(categories)
    .leftJoin(products, eq(products.category, categories.slug))
    .groupBy(categories.slug, categories.title, categories.latinTitle, categories.description, categories.position)
    .orderBy(asc(categories.position), asc(categories.slug));

  return rows.map((row) => ({
    slug: row.slug as CategorySlug,
    title: row.title,
    latinTitle: row.latinTitle,
    description: row.description,
    productCount: row.productCount,
  }));
}

export interface CategoryInput {
  slug: string;
  title: string;
  latinTitle?: string;
  description?: string;
  position?: number;
}

export async function upsertCategory(input: CategoryInput): Promise<Category> {
  const slug = String(input?.slug ?? "").trim();
  const title = sanitizeString(input?.title ?? "", 80);

  if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
    throw badRequest("نامک دسته‌بندی باید انگلیسی، کوچک و بین ۲ تا ۴۰ کاراکتر باشد.", { field: "slug" });
  }
  if (title.length < 2) throw badRequest("عنوان دسته‌بندی الزامی است.", { field: "title" });

  const existing = await getCategory(slug);
  if (existing && !input.position) {
    throw conflict("دسته‌بندی‌ای با این نامک از قبل وجود دارد.");
  }

  await db
    .insert(categories)
    .values({
      slug,
      title,
      latinTitle: sanitizeString(input.latinTitle ?? "", 80) || title,
      description: sanitizeString(input.description ?? "", 400),
      position: Math.max(0, Math.round(Number(input.position ?? 0))),
    })
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        title,
        latinTitle: sanitizeString(input.latinTitle ?? "", 80) || title,
        description: sanitizeString(input.description ?? "", 400),
        position: Math.max(0, Math.round(Number(input.position ?? 0))),
      },
    });

  const saved = await getCategory(slug);
  if (!saved) throw notFound("دسته‌بندی ذخیره نشد.");
  return saved;
}

export async function deleteCategory(slug: string): Promise<Category> {
  const existing = await getCategory(slug);
  if (!existing) throw notFound("دسته‌بندی مورد نظر یافت نشد.");

  const used = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.category, slug));

  if ((used[0]?.value ?? 0) > 0) {
    throw conflict("این دسته‌بندی در حال استفاده است و حذف نمی‌شود.");
  }

  await db.delete(categories).where(eq(categories.slug, slug));
  return existing;
}
