import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { notFound, ok, readJson, withApi } from "@/server/http";
import { deleteSet, getResolvedSet, updateSet, type SetInput } from "@/server/repositories/sets";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ slug: string }>;
}

/** GET /api/sets/:slug — the set with its products resolved. */
export async function GET(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const { slug } = await params;
    const set = await getResolvedSet(slug);
    if (!set) throw notFound("ست مورد نظر یافت نشد.");
    return ok(set);
  });
}

/** PATCH /api/sets/:slug (admin only). */
export async function PATCH(request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { slug } = await params;

    const existing = await getResolvedSet(slug);
    if (!existing) throw notFound("ست مورد نظر یافت نشد.");

    const body = await readJson<Partial<SetInput>>(request);

    const merged: SetInput = {
      slug: body.slug ?? existing.slug,
      title: body.title ?? existing.title,
      latinTitle: body.latinTitle ?? existing.latinTitle,
      subtitle: body.subtitle ?? existing.subtitle,
      description: body.description ?? existing.description,
      occasion: body.occasion ?? existing.occasion,
      season: body.season ?? existing.season,
      discountRate: body.discountRate ?? existing.discountRate,
      featured: body.featured ?? existing.featured,
      accent: body.accent ?? existing.accent,
      items:
        body.items ?? existing.items.map((item) => ({ productId: item.product.id, role: item.role })),
    };

    return ok(await updateSet(slug, merged));
  });
}

/** DELETE /api/sets/:slug (admin only). */
export async function DELETE(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { slug } = await params;
    return ok(await deleteSet(slug));
  });
}
