/**
 * Database-backed set reads for **server components**.
 *
 * Hits PostgreSQL for live store mutations, with an automatic resilient
 * fallback to the seeded set definitions if the database connection is cold or down.
 */
import * as serverSets from "@/server/repositories/sets";
import * as staticSets from "./sets";
import type { ResolvedSet } from "../types";

export const getFeaturedSets = async (limit = 8): Promise<ResolvedSet[]> => {
  try {
    return await serverSets.getFeaturedSets(limit);
  } catch {
    return staticSets.getFeaturedSets().slice(0, limit);
  }
};

export const getResolvedSet = async (slug: string): Promise<ResolvedSet | null> => {
  try {
    return await serverSets.getResolvedSet(slug);
  } catch {
    return staticSets.getResolvedSet(slug);
  }
};

export const getResolvedSets = async (): Promise<ResolvedSet[]> => {
  try {
    return await serverSets.getResolvedSets();
  } catch {
    return staticSets.getResolvedSets();
  }
};

export const getSetsContainingProduct = async (
  productId: string,
  limit = 2,
): Promise<ResolvedSet[]> => {
  try {
    return await serverSets.getSetsContainingProduct(productId, limit);
  } catch {
    return staticSets.getSetsContainingProduct(productId, limit);
  }
};
