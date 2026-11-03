import { requireApiAdmin } from "@/server/api-auth";
import { ok, withApi } from "@/server/http";
import { recalculateCustomerStats } from "@/server/repositories/customers";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/customers/:id/recalculate  (admin only)
 * Re-derive order count / lifetime spend from the order ledger.
 */
export async function POST(_request: Request, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { id } = await params;
    return ok(await recalculateCustomerStats(id));
  });
}
