import { requireApiAdmin } from "@/server/api-auth";
import { ok, withApi } from "@/server/http";
import { dashboard } from "@/server/repositories/metrics";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/metrics  (admin only)
 * Every number the admin dashboard renders — KPIs, revenue series, top
 * products, category mix, stock alerts and recent orders — in one call.
 */
export async function GET() {
  return withApi(async () => {
    await requireApiAdmin();
    return ok(await dashboard());
  });
}
