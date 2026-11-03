import type { NextRequest } from "next/server";

import { requireApiUser } from "@/server/api-auth";
import { notFound, ok, paginationMeta, readPagination, withApi } from "@/server/http";
import { hasPurchasedProduct } from "@/server/repositories/orders";
import { findProduct } from "@/server/repositories/products";
import { countReviews, createReview, listReviews, type ReviewQuery } from "@/server/repositories/reviews";
import { ensureCustomerForUser } from "@/server/repositories/users";
import { int, parseBody, str, strOptional } from "@/server/validate";

export const dynamic = "force-dynamic";

/**
 * GET /api/reviews
 * Query: `productId`, `minRating`, `page`, `perPage`.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    const searchParams = request.nextUrl.searchParams;
    const pagination = readPagination(searchParams);

    const minRating = Number(searchParams.get("minRating") ?? "");
    const query: ReviewQuery = {
      productId: searchParams.get("productId") ?? undefined,
      minRating: Number.isFinite(minRating) && minRating > 0 ? minRating : undefined,
      limit: pagination.perPage,
      offset: pagination.offset,
    };

    const [items, total] = await Promise.all([listReviews(query), countReviews(query)]);
    return ok(items, paginationMeta(total, pagination));
  });
}

/**
 * POST /api/reviews — post a review (signed-in shoppers).
 *
 * The author name is taken from the session, never from the body: a shopper
 * must not be able to publish a review under someone else's name. The
 * "verified purchase" badge is derived from the order ledger rather than
 * assumed, so it means something.
 */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    const user = await requireApiUser();

    const body = await parseBody(request, {
      productId: str({ label: "شناسهٔ محصول", min: 1, max: 64 }),
      rating: int({ label: "امتیاز", min: 1, max: 5 }),
      title: strOptional({ label: "عنوان نظر", max: 120 }),
      body: strOptional({ label: "متن نظر", max: 2000 }),
    });

    const product = await findProduct(body.productId);
    if (!product) throw notFound("محصول مورد نظر یافت نشد.");

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
