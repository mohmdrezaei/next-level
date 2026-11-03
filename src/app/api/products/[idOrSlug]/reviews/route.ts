import type { NextRequest } from "next/server";

import { requireApiUser } from "@/server/api-auth";
import { notFound, ok, paginationMeta, readPagination, withApi } from "@/server/http";
import { hasPurchasedProduct } from "@/server/repositories/orders";
import { findProduct } from "@/server/repositories/products";
import { createReview, getRatingSummary, listReviews } from "@/server/repositories/reviews";
import { ensureCustomerForUser } from "@/server/repositories/users";
import { int, parseBody, strOptional } from "@/server/validate";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ idOrSlug: string }>;
}

/** GET /api/products/:idOrSlug/reviews — reviews + star histogram. */
export async function GET(request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const { idOrSlug } = await params;

    const product = await findProduct(idOrSlug);
    if (!product) throw notFound("محصول مورد نظر یافت نشد.");

    const pagination = readPagination(request.nextUrl.searchParams);
    const minRating = Number(request.nextUrl.searchParams.get("minRating") ?? "");

    const [items, summary] = await Promise.all([
      listReviews({
        productId: product.id,
        minRating: Number.isFinite(minRating) && minRating > 0 ? minRating : undefined,
        limit: pagination.perPage,
        offset: pagination.offset,
      }),
      getRatingSummary(product.id),
    ]);

    return ok(items, { ...paginationMeta(summary.total, pagination), summary });
  });
}

/** POST /api/products/:idOrSlug/reviews — post a review (signed-in shoppers). */
export async function POST(request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const user = await requireApiUser();
    const { idOrSlug } = await params;

    const product = await findProduct(idOrSlug);
    if (!product) throw notFound("محصول مورد نظر یافت نشد.");

    // The product id comes from the *route*, not the body, so a caller cannot
    // attach a review to a different product than the one in the URL. The
    // author is the session user — never a client-supplied name.
    const body = await parseBody(request, {
      rating: int({ label: "امتیاز", min: 1, max: 5 }),
      title: strOptional({ label: "عنوان نظر", max: 120 }),
      body: strOptional({ label: "متن نظر", max: 2000 }),
    });

    const customerId = await ensureCustomerForUser(user.id);
    const verified = customerId ? await hasPurchasedProduct(customerId, product.id) : false;

    const review = await createReview({
      productId: product.id,
      author: user.name,
      rating: body.rating,
      title: body.title,
      body: body.body,
      verified,
    });

    return ok(review, undefined, 201);
  });
}
