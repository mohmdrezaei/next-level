import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { notFound, ok, readJson, withApi } from "@/server/http";
import {
  deleteProduct,
  findProduct,
  updateProduct,
  type ProductInput,
} from "@/server/repositories/products";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ idOrSlug: string }>;
}

/** GET /api/products/:idOrSlug */
export async function GET(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const { idOrSlug } = await params;
    const product = await findProduct(idOrSlug);
    if (!product) throw notFound("محصول مورد نظر یافت نشد.");
    return ok(product);
  });
}

/** PATCH /api/products/:idOrSlug — partial update (admin only). */
export async function PATCH(request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { idOrSlug } = await params;

    const existing = await findProduct(idOrSlug);
    if (!existing) throw notFound("محصول مورد نظر یافت نشد.");

    const body = await readJson<Partial<ProductInput>>(request);

    // Merge onto the current values so PATCH stays partial.
    const merged: ProductInput = {
      name: body.name ?? existing.name,
      latinName: body.latinName ?? existing.latinName,
      slug: body.slug ?? existing.slug,
      category: body.category ?? existing.category,
      price: body.price ?? existing.price,
      compareAtPrice: body.compareAtPrice ?? existing.compareAtPrice,
      shortDescription: body.shortDescription ?? existing.shortDescription,
      description: body.description ?? existing.description,
      materials: body.materials ?? existing.materials,
      highlights: body.highlights ?? existing.highlights,
      colors: body.colors ?? existing.colors.map((color) => ({ name: color.name, hex: color.hex })),
      sizes: body.sizes ?? existing.variants.map((variant) => variant.size),
      badges: body.badges ?? existing.badges,
      stock:
        body.stock ??
        existing.variants.reduce((sum, variant) => sum + variant.stock, 0),
      featured: body.featured ?? existing.featured,
      images: body.images ?? existing.images.map((image) => ({ src: image.src, alt: image.alt })),
    };

    const product = await updateProduct(existing.id, merged);
    return ok(product);
  });
}

/** DELETE /api/products/:idOrSlug (admin only). */
export async function DELETE(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { idOrSlug } = await params;

    const existing = await findProduct(idOrSlug);
    if (!existing) throw notFound("محصول مورد نظر یافت نشد.");

    const removed = await deleteProduct(existing.id);
    return ok(removed);
  });
}
