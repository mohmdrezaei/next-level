import { getApiUser } from "@/server/api-auth";
import { ok, withApi } from "@/server/http";
import { ensureCustomerForUser } from "@/server/repositories/users";
import { countWishlist } from "@/server/repositories/wishlist";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/me
 * Returns the signed-in user plus the ids the header needs (customer ledger,
 * wishlist size). Responds `{ user: null }` for guests rather than 401.
 */
export async function GET() {
  return withApi(async () => {
    const user = await getApiUser();
    if (!user) return ok({ user: null, customerId: null, wishlistCount: 0 });

    const customerId = user.role === "admin" ? null : await ensureCustomerForUser(user.id);

    return ok({
      user,
      customerId,
      wishlistCount: customerId ? await countWishlist(customerId) : 0,
    });
  });
}
