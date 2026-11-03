import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { notFound, ok, readJson, withApi } from "@/server/http";
import {
  deleteCategory,
  getCategory,
  upsertCategory,
  type CategoryInput,
} from "@/server/repositories/categories";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ slug: string }>;
}

/** GET /api/categories/:slug */
export async function GET(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const { slug } = await params;
    const category = await getCategory(slug);
    if (!category) throw notFound("دسته‌بندی مورد نظر یافت نشد.");
    return ok(category);
  });
}

/** PATCH /api/categories/:slug (admin only). */
export async function PATCH(request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { slug } = await params;

    const existing = await getCategory(slug);
    if (!existing) throw notFound("دسته‌بندی مورد نظر یافت نشد.");

    const body = await readJson<Partial<CategoryInput>>(request);
    const saved = await upsertCategory({
      slug,
      title: body.title ?? existing.title,
      latinTitle: body.latinTitle ?? existing.latinTitle,
      description: body.description ?? existing.description,
      position: body.position,
    });

    return ok(saved);
  });
}

/** DELETE /api/categories/:slug (admin only, refuses while products use it). */
export async function DELETE(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { slug } = await params;
    return ok(await deleteCategory(slug));
  });
}
