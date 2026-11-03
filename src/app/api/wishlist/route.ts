import type { NextRequest } from "next/server";

import { requireApiUser } from "@/server/api-auth";
import { badRequest, ok, withApi } from "@/server/http";
import { ensureCustomerForUser } from "@/server/repositories/users";
import {
  addToWishlist,
  clearWishlist,
  listWishlist,
  listWishlistProductIds,
  removeFromWishlist,
} from "@/server/repositories/wishlist";
import { parseBody, str } from "@/server/validate";

export const dynamic = "force-dynamic";

/** Resolve the signed-in shopper's customer ledger row. */
async function currentCustomerId(): Promise<string> {
  const user = await requireApiUser();
  const customerId = await ensureCustomerForUser(user.id);
  if (!customerId) throw badRequest("حساب کاربری به مشتری متصل نیست.");
  return customerId;
}

/**
 * GET /api/wishlist
 * Returns the saved products; `?ids=1` returns only the product ids.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    const customerId = await currentCustomerId();
    const idsOnly = ["1", "true"].includes(request.nextUrl.searchParams.get("ids") ?? "");

    return ok(idsOnly ? await listWishlistProductIds(customerId) : await listWishlist(customerId));
  });
}

/** POST /api/wishlist — body: `{ "productId": "p-001" }` */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    const customerId = await currentCustomerId();
    const body = await parseBody(request, {
      productId: str({ label: "شناسهٔ محصول", min: 1, max: 64 }),
    });

    await addToWishlist(customerId, body.productId);

    return ok({ productId: body.productId, wishlisted: true }, undefined, 201);
  });
}

/**
 * DELETE /api/wishlist
 * `?productId=p-001` removes one item; `?all=1` clears the list.
 */
export async function DELETE(request: NextRequest) {
  return withApi(async () => {
    const customerId = await currentCustomerId();
    const searchParams = request.nextUrl.searchParams;

    if (["1", "true"].includes(searchParams.get("all") ?? "")) {
      return ok({ removed: await clearWishlist(customerId) });
    }

    const productId = searchParams.get("productId");
    if (!productId) throw badRequest("شناسهٔ محصول الزامی است.", { field: "productId" });

    await removeFromWishlist(customerId, productId);
    return ok({ productId, wishlisted: false });
  });
}
