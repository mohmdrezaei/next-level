import type { NextRequest } from "next/server";

import { ok, readPagination, withApi } from "@/server/http";
import { searchProducts } from "@/server/repositories/products";
import { listSets } from "@/server/repositories/sets";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=...
 * Unified product + curated-set search, used by the header search dialog.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    const searchParams = request.nextUrl.searchParams;
    const q = (searchParams.get("q") ?? "").trim();
    const pagination = readPagination(searchParams);

    if (!q) return ok({ query: "", products: [], sets: [] });

    const limit = Math.min(pagination.perPage, 20);

    const [products, sets] = await Promise.all([
      searchProducts(q, limit),
      listSets({ q, limit: Math.ceil(limit / 2) }),
    ]);

    return ok({ query: q, products, sets });
  });
}
