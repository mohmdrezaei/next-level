import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { ok, readJson, withApi } from "@/server/http";
import {
  categoriesWithCounts,
  listCategories,
  upsertCategory,
  type CategoryInput,
} from "@/server/repositories/categories";

export const dynamic = "force-dynamic";

/**
 * GET /api/categories
 * Add `?withCounts=1` to include the number of products in each category.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    const withCounts = request.nextUrl.searchParams.get("withCounts");
    const includeCounts = withCounts === "1" || withCounts === "true";

    return ok(includeCounts ? await categoriesWithCounts() : await listCategories());
  });
}

/** POST /api/categories — create or update a category (admin only). */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    await requireApiAdmin();
    const body = await readJson<CategoryInput>(request);
    return ok(await upsertCategory(body), undefined, 201);
  });
}
