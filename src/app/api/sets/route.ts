import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { ok, paginationMeta, readJson, readPagination, withApi } from "@/server/http";
import {
  countSets,
  createSet,
  getResolvedSets,
  listSets,
  type SetInput,
} from "@/server/repositories/sets";

export const dynamic = "force-dynamic";

/**
 * GET /api/sets
 * Query: `featured=1`, `q`, `resolved=1` (attach the products), `page`, `perPage`.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    const searchParams = request.nextUrl.searchParams;
    const pagination = readPagination(searchParams);
    const resolved = ["1", "true"].includes(searchParams.get("resolved") ?? "");
    const featured = searchParams.get("featured");

    const query = {
      featured: featured === null ? undefined : featured !== "0",
      q: searchParams.get("q") ?? undefined,
      limit: pagination.perPage,
      offset: pagination.offset,
    };

    const [items, total] = await Promise.all([
      resolved ? getResolvedSets(query) : listSets(query),
      countSets(query),
    ]);

    return ok(items, paginationMeta(total, pagination));
  });
}

/** POST /api/sets — create a curated set (admin only). */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    await requireApiAdmin();
    const body = await readJson<SetInput>(request);
    return ok(await createSet(body), undefined, 201);
  });
}
