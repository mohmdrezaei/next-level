import type { NextRequest } from "next/server";

import { ok, readPagination, withApi } from "@/server/http";
import { searchProducts as dbSearchProducts } from "@/server/repositories/products";
import { listSets as dbListSets } from "@/server/repositories/sets";
import { searchProducts as staticSearchProducts } from "@/features/products/lib/selectors";
import { SETS } from "@/features/sets/data/sets";

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
      dbSearchProducts(q, limit).catch(() => staticSearchProducts(q, limit)),
      dbListSets({ q, limit: Math.ceil(limit / 2) }).catch(() =>
        SETS.filter(
          (s) =>
            s.title.includes(q) ||
            s.latinTitle.toLowerCase().includes(q.toLowerCase()) ||
            s.description.includes(q),
        ).slice(0, Math.ceil(limit / 2)),
      ),
    ]);

    return ok({ query: q, products, sets });
  });
}
