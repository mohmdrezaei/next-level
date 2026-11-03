import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { notFound, ok, withApi } from "@/server/http";
import { duplicateProduct, findProduct } from "@/server/repositories/products";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ idOrSlug: string }>;
}

/** POST /api/products/:idOrSlug/duplicate (admin only). */
export async function POST(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { idOrSlug } = await params;

    const existing = await findProduct(idOrSlug);
    if (!existing) throw notFound("محصول مورد نظر یافت نشد.");

    const copy = await duplicateProduct(existing.id);
    return ok(copy, undefined, 201);
  });
}
