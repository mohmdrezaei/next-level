/**
 * Wishlist repository — a join table between customers and products.
 */
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import type { Product } from "@/features/products/types";

import { notFound } from "../http";
import { getProductsByIds } from "./products";

export interface WishlistEntry {
  productId: string;
  addedAt: string;
}

export async function listWishlistProductIds(customerId: string): Promise<string[]> {
  const rows = await db
    .select({ productId: wishlistItems.productId })
    .from(wishlistItems)
    .where(eq(wishlistItems.customerId, customerId))
    .orderBy(desc(wishlistItems.createdAt));

  return rows.map((row) => row.productId);
}

export async function listWishlist(customerId: string): Promise<Product[]> {
  return getProductsByIds(await listWishlistProductIds(customerId));
}

export async function addToWishlist(customerId: string, productId: string): Promise<void> {
  const products = await getProductsByIds([productId]);
  if (!products.length) throw notFound("محصول مورد نظر یافت نشد.");

  await db
    .insert(wishlistItems)
    .values({ customerId, productId })
    .onConflictDoNothing({ target: [wishlistItems.customerId, wishlistItems.productId] });
}

export async function removeFromWishlist(customerId: string, productId: string): Promise<void> {
  await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.customerId, customerId), eq(wishlistItems.productId, productId)));
}

export async function clearWishlist(customerId: string): Promise<number> {
  const rows = await db
    .delete(wishlistItems)
    .where(eq(wishlistItems.customerId, customerId))
    .returning({ id: wishlistItems.id });

  return rows.length;
}

export async function countWishlist(customerId: string): Promise<number> {
  const rows = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(wishlistItems)
    .where(eq(wishlistItems.customerId, customerId));

  return rows[0]?.value ?? 0;
}
