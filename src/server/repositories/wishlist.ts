/**
 * Wishlist repository — a join table between customers and products,
 * with resilient memory fallback per customer.
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

declare global {
  // eslint-disable-next-line no-var
  var __memoryWishlist: Map<string, Set<string>> | undefined;
}

function getMemoryWishlist(): Map<string, Set<string>> {
  if (!globalThis.__memoryWishlist) {
    globalThis.__memoryWishlist = new Map<string, Set<string>>();
    // Seed demo user (c-001) with demo pieces
    globalThis.__memoryWishlist.set("c-001", new Set(["p-001", "p-006"]));
  }
  return globalThis.__memoryWishlist;
}

export async function listWishlistProductIds(customerId: string): Promise<string[]> {
  try {
    const rows = await db
      .select({ productId: wishlistItems.productId })
      .from(wishlistItems)
      .where(eq(wishlistItems.customerId, customerId))
      .orderBy(desc(wishlistItems.createdAt));

    if (rows.length > 0) {
      return rows.map((row) => row.productId);
    }
  } catch {
    // Database offline or table empty, fallback to memory
  }

  const memSet = getMemoryWishlist().get(customerId);
  return memSet ? Array.from(memSet) : [];
}

export async function listWishlist(customerId: string): Promise<Product[]> {
  const ids = await listWishlistProductIds(customerId);
  return getProductsByIds(ids);
}

export async function addToWishlist(customerId: string, productId: string): Promise<void> {
  const products = await getProductsByIds([productId]);
  if (!products.length) throw notFound("محصول مورد نظر یافت نشد.");

  // 1. In-memory per customer
  const mem = getMemoryWishlist();
  if (!mem.has(customerId)) {
    mem.set(customerId, new Set<string>());
  }
  mem.get(customerId)!.add(productId);

  // 2. Database
  try {
    await db
      .insert(wishlistItems)
      .values({ customerId, productId })
      .onConflictDoNothing({ target: [wishlistItems.customerId, wishlistItems.productId] });
  } catch {
    // Memory fallback is authoritative if DB is offline
  }
}

export async function removeFromWishlist(customerId: string, productId: string): Promise<void> {
  // 1. In-memory per customer
  getMemoryWishlist().get(customerId)?.delete(productId);

  // 2. Database
  try {
    await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.customerId, customerId), eq(wishlistItems.productId, productId)));
  } catch {
    // Memory fallback is authoritative
  }
}

export async function clearWishlist(customerId: string): Promise<number> {
  // 1. In-memory per customer
  const memSet = getMemoryWishlist().get(customerId);
  const count = memSet?.size ?? 0;
  getMemoryWishlist().set(customerId, new Set<string>());

  // 2. Database
  try {
    const rows = await db
      .delete(wishlistItems)
      .where(eq(wishlistItems.customerId, customerId))
      .returning({ id: wishlistItems.id });
    return rows.length;
  } catch {
    return count;
  }
}

export async function countWishlist(customerId: string): Promise<number> {
  try {
    const rows = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(wishlistItems)
      .where(eq(wishlistItems.customerId, customerId));

    if (rows[0]?.value !== undefined && rows[0].value > 0) {
      return rows[0].value;
    }
  } catch {
    // Database offline
  }

  return getMemoryWishlist().get(customerId)?.size ?? 0;
}
