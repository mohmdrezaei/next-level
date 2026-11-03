/**
 * Product repository — every read and write of the catalogue goes through here,
 * so the REST API and the server components share identical behaviour.
 */
import { and, asc, desc, eq, exists, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { productColors, productImages, productVariants, products } from "@/db/schema";
import type {
  CategorySlug,
  Product,
  ProductBadge,
  ProductColor,
  ProductImage,
  ProductVariant,
  SortKey,
} from "@/features/products/types";
import { safeUrl, sanitizeString, sanitizeStringArray } from "@/lib/sanitize";
import { slugify } from "@/lib/utils";

import { badRequest, conflict, notFound } from "../http";
import { newId } from "../ids";
import { containsPattern } from "../sql";
import { PRODUCT_REAL_IMAGES } from "@/features/products/data/catalog";

/* -------------------------------------------------------------------------- */
/*  Input contract                                                            */
/* -------------------------------------------------------------------------- */

export interface ProductColorInput {
  name: string;
  hex: string;
}

export interface ProductImageInput {
  src: string;
  alt: string;
}

/**
 * The complete product payload — what the admin form builds and what a full
 * `PUT`-style create sends.
 */
export interface ProductInput {
  name: string;
  latinName: string;
  slug: string;
  category: CategorySlug;
  price: number;
  compareAtPrice: number | null;
  shortDescription: string;
  description: string;
  materials: string[];
  highlights: string[];
  colors: ProductColorInput[];
  sizes: string[];
  badges: ProductBadge[];
  stock: number;
  featured: boolean;
  images: ProductImageInput[];
}

/**
 * What the repository actually accepts: `ProductInput` plus anything the API
 * sends that omits optional fields. Only these three are truly required, and
 * `validateProductInput` enforces them at runtime.
 */
export type ProductDraft = Partial<ProductInput> & {
  name: string;
  price: number;
  category: CategorySlug;
};

export interface ProductQuery {
  q?: string;
  categories?: string[];
  sizes?: string[];
  colors?: string[];
  badges?: string[];
  minPrice?: number;
  maxPrice?: number;
  onlyDiscount?: boolean;
  onlyInStock?: boolean;
  featured?: boolean;
  sort?: SortKey;
  limit?: number;
  offset?: number;
}

const CATEGORIES: CategorySlug[] = [
  "outerwear",
  "suits",
  "shirts",
  "knitwear",
  "trousers",
  "footwear",
  "accessories",
];

const BADGES: ProductBadge[] = ["new", "limited", "bestseller", "sale"];

/** Gallery used when a product is saved with no images of its own. */
const ART_TEMPLATE: Record<CategorySlug, string> = {
  outerwear: "monte-cashmere-coat",
  suits: "milano-two-button-suit",
  shirts: "london-oxford-shirt",
  knitwear: "alpe-merino-sweater",
  trousers: "rio-pleated-trousers",
  footwear: "oxford-leather-shoes",
  accessories: "carter-leather-bag",
};

const DEFAULT_CARE: Record<CategorySlug, string[]> = {
  outerwear: ["خشک‌شویی تخصصی توصیه می‌شود", "دور از رطوبت و نور مستقیم نگهداری شود", "در آویز چوبی و کاور قرار دهید"],
  suits: ["خشک‌شویی با دمای پایین", "بین دو بار پوشیدن استراحت دهید", "اتو با پارچه واسط انجام شود"],
  shirts: ["شست‌وشو با آب سرد و دمای ۳۰ درجه", "اتو از سمت پشت پارچه", "سفیدکننده کلردار ممنوع است"],
  knitwear: ["شست‌وشوی دستی با شامپو ملایم", "روی سطح تخت خشک کنید", "تا کرده و در کاور نگهداری شود"],
  trousers: ["شست‌وشو با آب سرد و چرخه ملایم", "اتو در دمای متوسط از پشت", "از خشک‌کن صنعتی پرهیز کنید"],
  footwear: ["پس از هر بار پوشیدن با برس نرم تمیز کنید", "هر ۱۰ روز واکس بزنید", "در هوای بارانی از اسپری محافظ استفاده کنید"],
  accessories: ["دور از رطوبت و نور مستقیم نگه دارید", "برای چرم کرم مرطوب‌کننده استفاده کنید", "در کاور پارچه‌ای نگهداری شود"],
};

/* -------------------------------------------------------------------------- */
/*  Mapping                                                                   */
/* -------------------------------------------------------------------------- */

type ProductRow = typeof products.$inferSelect;
type ColorRow = typeof productColors.$inferSelect;
type VariantRow = typeof productVariants.$inferSelect;
type ImageRow = typeof productImages.$inferSelect;

function mapProduct(
  row: ProductRow,
  colors: ColorRow[],
  variants: VariantRow[],
  images: ImageRow[],
): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    latinName: row.latinName,
    category: row.category as CategorySlug,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    shortDescription: row.shortDescription,
    description: row.description,
    story: row.story,
    materials: row.materials,
    care: row.care,
    highlights: row.highlights,
    colors: colors.map((color): ProductColor => ({
      name: color.name,
      hex: color.hex,
      accent: color.accent,
    })),
    variants: variants.map((variant): ProductVariant => ({
      size: variant.size,
      stock: variant.stock,
    })),
    images: images.map((image): ProductImage => ({ src: image.src, alt: image.alt })),
    rating: row.rating,
    reviewCount: row.reviewCount,
    badges: row.badges as ProductBadge[],
    tags: row.tags,
    createdAt: row.createdAt,
    featured: row.featured,
  };
}

/** Load colours/variants/images for a batch of products in three queries. */
async function hydrate(rows: ProductRow[]): Promise<Product[]> {
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id);

  const [colors, variants, images] = await Promise.all([
    db
      .select()
      .from(productColors)
      .where(inArray(productColors.productId, ids))
      .orderBy(asc(productColors.productId), asc(productColors.position)),
    db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, ids))
      .orderBy(asc(productVariants.productId), asc(productVariants.position)),
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.productId), asc(productImages.position)),
  ]);

  const byProduct = <T extends { productId: string }>(list: T[]) => {
    const map = new Map<string, T[]>();
    for (const item of list) {
      const bucket = map.get(item.productId);
      if (bucket) bucket.push(item);
      else map.set(item.productId, [item]);
    }
    return map;
  };

  const colorMap = byProduct(colors);
  const variantMap = byProduct(variants);
  const imageMap = byProduct(images);

  return rows.map((row) =>
    mapProduct(row, colorMap.get(row.id) ?? [], variantMap.get(row.id) ?? [], imageMap.get(row.id) ?? []),
  );
}

/* -------------------------------------------------------------------------- */
/*  Validation & building                                                     */
/* -------------------------------------------------------------------------- */

export function validateProductInput(input: ProductDraft): void {
  if (!input || typeof input !== "object") throw badRequest("اطلاعات محصول ارسال نشده است.");
  if (typeof input.name !== "string" || input.name.trim().length < 3) {
    throw badRequest("نام محصول باید حداقل ۳ کاراکتر باشد.", { field: "name" });
  }
  if (!Number.isFinite(input.price) || Number(input.price) <= 0) {
    throw badRequest("قیمت محصول باید بزرگ‌تر از صفر باشد.", { field: "price" });
  }
  if (input.category && !CATEGORIES.includes(input.category)) {
    throw badRequest("دسته‌بندی محصول معتبر نیست.", { field: "category" });
  }
}

function normaliseImages(
  input: ProductImageInput[] | undefined,
  category: CategorySlug,
  name: string,
): ProductImage[] {
  const cleaned = (input ?? [])
    .map((image, index) => ({
      src: safeUrl(image?.src),
      alt: sanitizeString(image?.alt ?? "", 200) || `${name} — نمای ${index + 1}`,
    }))
    .filter((image) => image.src.length > 0);

  if (cleaned.length) return cleaned;

  return [1, 2, 3].map((index) => ({
    src: PRODUCT_REAL_IMAGES[ART_TEMPLATE[category]]?.[index - 1] ?? `/products/${ART_TEMPLATE[category]}-${index}.svg`,
    alt: `${name} — نمای ${index}`,
  }));
}

function normaliseColors(input: ProductColorInput[] | undefined): ProductColor[] {
  const palette = (input ?? []).filter((color) => String(color?.name ?? "").trim().length > 0);
  if (!palette.length) return [{ name: "زغالی", hex: "#2b2b31", accent: "#2b2b31" }];

  return palette.map((color) => {
    // A colour value is interpolated into inline styles by the storefront, so
    // it is restricted to a literal hex code rather than passed through.
    const candidate = String(color.hex ?? "").trim();
    const hex = /^#[0-9a-fA-F]{3,8}$/.test(candidate) ? candidate : "#2b2b31";
    return { name: sanitizeString(color.name, 60) || "رنگ", hex, accent: hex };
  });
}

function normaliseVariants(sizes: string[] | undefined, stock: number): ProductVariant[] {
  const list = sanitizeStringArray(sizes, { maxItems: 30, maxLength: 20 });
  const resolved = list.length ? list : ["ONE"];
  const total = Math.max(0, Math.round(stock));
  const perSize = Math.floor(total / resolved.length);
  const remainder = total - perSize * resolved.length;

  return resolved.map((size, index) => ({
    size,
    stock: perSize + (index === 0 ? remainder : 0),
  }));
}

interface PreparedProduct {
  row: Omit<ProductRow, "rating" | "reviewCount" | "createdAt"> & {
    rating: number;
    reviewCount: number;
    createdAt: string;
  };
  colors: ProductColor[];
  variants: ProductVariant[];
  images: ProductImage[];
}

function prepare(input: ProductDraft, id: string, slug: string, base?: ProductRow): PreparedProduct {
  const name = sanitizeString(input.name, 120);
  const category = (input.category ?? base?.category ?? "shirts") as CategorySlug;
  const shortDescription =
    sanitizeString(input.shortDescription ?? "", 300) || "قطعه‌ای از بوتیک Next Level.";
  const description = sanitizeString(input.description ?? "", 5000) || shortDescription;

  const materials = sanitizeStringArray(input.materials, { maxItems: 20, maxLength: 120 });
  const price = Math.round(Number(input.price));
  const compareAtPrice =
    input.compareAtPrice && Number(input.compareAtPrice) > price
      ? Math.round(Number(input.compareAtPrice))
      : null;

  return {
    row: {
      id,
      slug,
      name,
      latinName: sanitizeString(input.latinName ?? "", 120) || name,
      category,
      price,
      compareAtPrice,
      shortDescription,
      description,
      story: description,
      materials: materials.length ? materials : ["—"],
      care: DEFAULT_CARE[category],
      highlights: sanitizeStringArray(input.highlights, { maxItems: 20, maxLength: 200 }),
      badges: (input.badges ?? []).filter((badge) => BADGES.includes(badge)),
      tags: [category, sanitizeString(input.latinName ?? "", 120).toLowerCase().split(" ")[0] || name.toLowerCase().split(" ")[0] || category],
      rating: base?.rating ?? 0,
      reviewCount: base?.reviewCount ?? 0,
      createdAt: base?.createdAt ?? new Date().toISOString().slice(0, 10),
      featured: Boolean(input.featured),
    },
    colors: normaliseColors(input.colors),
    variants: normaliseVariants(input.sizes, input.stock ?? 0),
    images: normaliseImages(input.images, category, name),
  };
}

async function replaceChildren(
  productId: string,
  prepared: Pick<PreparedProduct, "colors" | "variants" | "images">,
): Promise<void> {
  await Promise.all([
    db.delete(productColors).where(eq(productColors.productId, productId)),
    db.delete(productVariants).where(eq(productVariants.productId, productId)),
    db.delete(productImages).where(eq(productImages.productId, productId)),
  ]);

  if (prepared.colors.length) {
    await db.insert(productColors).values(
      prepared.colors.map((color, index) => ({
        productId,
        name: color.name,
        hex: color.hex,
        accent: color.accent,
        position: index,
      })),
    );
  }

  if (prepared.variants.length) {
    await db.insert(productVariants).values(
      prepared.variants.map((variant, index) => ({
        productId,
        size: variant.size,
        stock: variant.stock,
        position: index,
      })),
    );
  }

  if (prepared.images.length) {
    await db.insert(productImages).values(
      prepared.images.map((image, index) => ({
        productId,
        src: image.src,
        alt: image.alt,
        position: index,
      })),
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                     */
/* -------------------------------------------------------------------------- */

function buildConditions(query: ProductQuery) {
  const conditions = [];

  if (query.q?.trim()) {
    const needle = containsPattern(query.q.trim());
    conditions.push(
      or(
        ilike(products.name, needle),
        ilike(products.latinName, needle),
        ilike(products.shortDescription, needle),
        ilike(products.category, needle),
      ),
    );
  }

  if (query.categories?.length) conditions.push(inArray(products.category, query.categories));
  if (query.badges?.length) conditions.push(sql`${products.badges} && ${query.badges}::text[]`);
  if (typeof query.minPrice === "number") conditions.push(gte(products.price, query.minPrice));
  if (typeof query.maxPrice === "number") conditions.push(lte(products.price, query.maxPrice));
  if (query.featured !== undefined) conditions.push(eq(products.featured, query.featured));

  if (query.onlyDiscount) {
    conditions.push(
      sql`${products.compareAtPrice} is not null and ${products.compareAtPrice} > ${products.price}`,
    );
  }

  if (query.onlyInStock) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(productVariants)
          .where(and(eq(productVariants.productId, products.id), gte(productVariants.stock, 1))),
      ),
    );
  }

  if (query.sizes?.length) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(productVariants)
          .where(
            and(
              eq(productVariants.productId, products.id),
              inArray(productVariants.size, query.sizes),
            ),
          ),
      ),
    );
  }

  if (query.colors?.length) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(productColors)
          .where(
            and(
              eq(productColors.productId, products.id),
              inArray(productColors.name, query.colors),
            ),
          ),
      ),
    );
  }

  return conditions;
}

function orderFor(sort: SortKey | undefined) {
  switch (sort) {
    case "newest":
      return [desc(products.createdAt), desc(products.id)];
    case "price-asc":
      return [asc(products.price), asc(products.name)];
    case "price-desc":
      return [desc(products.price), asc(products.name)];
    case "rating":
      return [desc(products.rating), desc(products.reviewCount)];
    case "featured":
    default:
      return [
        desc(products.featured),
        desc(sql`${products.rating} * log(10, ${products.reviewCount} + 10)`),
        asc(products.name),
      ];
  }
}

export async function listProducts(query: ProductQuery = {}): Promise<Product[]> {
  const conditions = buildConditions(query);

  const rows = await db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderFor(query.sort))
    .limit(query.limit ?? 100)
    .offset(query.offset ?? 0);

  return hydrate(rows);
}

export async function countProducts(query: ProductQuery = {}): Promise<number> {
  const conditions = buildConditions(query);
  const rows = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined);

  return rows[0]?.value ?? 0;
}

export async function getProductById(id: string): Promise<Product | null> {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows.length ? (await hydrate(rows))[0] : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return rows.length ? (await hydrate(rows))[0] : null;
}

/** Accepts either an id or a slug — handy for `GET /api/products/:idOrSlug`. */
export async function findProduct(idOrSlug: string): Promise<Product | null> {
  return (await getProductById(idOrSlug)) ?? (await getProductBySlug(idOrSlug));
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const rows = await db.select().from(products).where(inArray(products.id, ids));
  const mapped = await hydrate(rows);

  // Preserve the caller's ordering.
  const byId = new Map(mapped.map((product) => [product.id, product]));
  return ids.map((id) => byId.get(id)).filter((product): product is Product => Boolean(product));
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (!slugs.length) return [];
  const rows = await db.select().from(products).where(inArray(products.slug, slugs));
  const mapped = await hydrate(rows);
  const bySlug = new Map(mapped.map((product) => [product.slug, product]));
  return slugs.map((slug) => bySlug.get(slug)).filter((product): product is Product => Boolean(product));
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return listProducts({ featured: true, sort: "featured", limit });
}

export async function getNewArrivals(limit = 4): Promise<Product[]> {
  return listProducts({ sort: "newest", limit });
}

export async function getBestSellers(limit = 4): Promise<Product[]> {
  const rows = await db
    .select()
    .from(products)
    .where(gte(products.reviewCount, 60))
    .orderBy(desc(products.rating), desc(products.reviewCount))
    .limit(limit);

  return hydrate(rows);
}

export async function getOnSaleProducts(limit = 4): Promise<Product[]> {
  return listProducts({ onlyDiscount: true, sort: "featured", limit });
}

export async function getProductsByCategory(category: CategorySlug, limit = 4): Promise<Product[]> {
  return listProducts({ categories: [category], sort: "featured", limit });
}

export async function searchProducts(query: string, limit = 6): Promise<Product[]> {
  if (!query.trim()) return [];
  return listProducts({ q: query, sort: "featured", limit });
}

/** Related items: same category first, then shared palette, then price band. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const rows = await db
    .select()
    .from(products)
    .where(sql`${products.id} <> ${product.id}`)
    .limit(200);

  const candidates = await hydrate(rows);

  return candidates
    .map((candidate) => {
      let score = 0;
      if (candidate.category === product.category) score += 4;
      score += candidate.colors.filter((color) =>
        product.colors.some((own) => own.name === color.name),
      ).length;
      score += Math.abs(candidate.price - product.price) < product.price * 0.35 ? 1 : 0;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score || b.candidate.rating - a.candidate.rating)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export async function categoryCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({ category: products.category, value: sql<number>`count(*)::int` })
    .from(products)
    .groupBy(products.category);

  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = row.value;
    return acc;
  }, {});
}

export async function catalogueStats() {
  const rows = await db
    .select({
      products: sql<number>`count(*)::int`,
      reviews: sql<number>`coalesce(sum(${products.reviewCount}), 0)::int`,
      rating: sql<number>`coalesce(avg(${products.rating}), 0)::float`,
    })
    .from(products);

  const counts = await categoryCounts();

  return {
    products: rows[0]?.products ?? 0,
    categories: Object.keys(counts).length,
    reviews: rows[0]?.reviews ?? 0,
    rating: rows[0]?.rating ?? 0,
  };
}

/** Distinct palette/size facets, used by the shop filter sidebar. */
export async function productFacets() {
  const [colorRows, sizeRows, boundsRows] = await Promise.all([
    db
      .select({
        name: productColors.name,
        hex: sql<string>`min(${productColors.hex})`,
        value: sql<number>`count(*)::int`,
      })
      .from(productColors)
      .groupBy(productColors.name),
    db
      .select({ size: productVariants.size, value: sql<number>`count(*)::int` })
      .from(productVariants)
      .where(gte(productVariants.stock, 1))
      .groupBy(productVariants.size),
    db
      .select({
        min: sql<number>`coalesce(min(${products.price}), 0)::int`,
        max: sql<number>`coalesce(max(${products.price}), 0)::int`,
      })
      .from(products),
  ]);

  return {
    colors: colorRows.map((row) => ({ name: row.name, hex: row.hex, count: row.value })),
    sizes: sizeRows
      .map((row) => ({ size: row.size, count: row.value }))
      .sort((a, b) => a.size.localeCompare(b.size, "en")),
    bounds: { min: boundsRows[0]?.min ?? 0, max: boundsRows[0]?.max ?? 0 },
  };
}

/* -------------------------------------------------------------------------- */
/*  Writes                                                                    */
/* -------------------------------------------------------------------------- */

async function assertSlugAvailable(slug: string, exceptId?: string): Promise<void> {
  const rows = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug));
  if (rows.some((row) => row.id !== exceptId)) {
    throw conflict("محصولی با این نامک (slug) از قبل وجود دارد.");
  }
}

export async function createProduct(input: ProductDraft): Promise<Product> {
  validateProductInput(input);

  const slug = slugify(input.slug || input.latinName || input.name);
  if (!slug) throw badRequest("نامک (slug) محصول معتبر نیست.", { field: "slug" });
  await assertSlugAvailable(slug);

  const id = newId("p");
  const prepared = prepare(input, id, slug);

  await db.insert(products).values(prepared.row);
  await replaceChildren(id, prepared);

  const created = await getProductById(id);
  if (!created) throw notFound("محصول ایجاد شد اما بازخوانی نشد.");
  return created;
}

export async function updateProduct(id: string, input: ProductDraft): Promise<Product> {
  const existingRows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  const existing = existingRows[0];
  if (!existing) throw notFound("محصول مورد نظر یافت نشد.");

  validateProductInput(input);

  const slug = slugify(input.slug || input.latinName || input.name) || existing.slug;
  await assertSlugAvailable(slug, id);

  const prepared = prepare(input, id, slug, existing);

  await db.update(products).set(prepared.row).where(eq(products.id, id));
  await replaceChildren(id, prepared);

  const updated = await getProductById(id);
  if (!updated) throw notFound("محصول مورد نظر یافت نشد.");
  return updated;
}

export async function deleteProduct(id: string): Promise<Product> {
  const [existing] = await deleteProducts([id]);
  if (!existing) throw notFound("محصول مورد نظر یافت نشد.");
  return existing;
}

/** Bulk delete used by the admin panel's group actions. */
export async function deleteProducts(ids: string[]): Promise<Product[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];

  const removed: Product[] = [];
  for (const id of unique) {
    const existing = await getProductById(id);
    if (existing) removed.push(existing);
  }
  if (!removed.length) return [];

  // Cascades remove colours/variants/images; sets lose the dangling piece.
  await db.delete(products).where(inArray(products.id, removed.map((product) => product.id)));
  return removed;
}

export async function duplicateProduct(id: string): Promise<Product> {
  const source = await getProductById(id);
  if (!source) throw notFound("محصول مورد نظر یافت نشد.");

  let slug = `${source.slug}-copy`;
  let counter = 2;
  while ((await db.select({ id: products.id }).from(products).where(eq(products.slug, slug))).length) {
    slug = `${source.slug}-copy-${counter}`;
    counter += 1;
  }

  const newProductId = newId("p");

  await db.insert(products).values({
    id: newProductId,
    slug,
    name: `${source.name} (کپی)`,
    latinName: source.latinName,
    category: source.category,
    price: source.price,
    compareAtPrice: source.compareAtPrice,
    shortDescription: source.shortDescription,
    description: source.description,
    story: source.story,
    materials: source.materials,
    care: source.care,
    highlights: source.highlights,
    badges: source.badges,
    tags: source.tags,
    rating: source.rating,
    reviewCount: source.reviewCount,
    createdAt: new Date().toISOString().slice(0, 10),
    featured: false,
  });

  await replaceChildren(newProductId, {
    colors: source.colors,
    variants: source.variants,
    images: source.images,
  });

  const created = await getProductById(newProductId);
  if (!created) throw notFound("کپی ایجاد شد اما بازخوانی نشد.");
  return created;
}
