import { requireApiAdmin } from "@/server/api-auth";
import { ok, withApi } from "@/server/http";
import { dashboard } from "@/server/repositories/metrics";
import {
  categoryBreakdown,
  computeKpis,
  monthlyRevenueSeries,
  recentOrders,
  revenueSeries,
  statusDistribution,
  stockAlerts,
  topProducts,
} from "@/features/admin/lib/metrics";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/metrics  (admin only)
 * Every number the admin dashboard renders — KPIs, revenue series, top
 * products, category mix, stock alerts and recent orders — in one call.
 */
export async function GET() {
  return withApi(async () => {
    await requireApiAdmin();
    try {
      return ok(await dashboard());
    } catch {
      return ok({
        kpis: computeKpis(),
        daily: revenueSeries(30),
        monthly: monthlyRevenueSeries(6),
        top: topProducts(5),
        categories: categoryBreakdown(),
        alerts: stockAlerts().slice(0, 5),
        recent: recentOrders(6),
        statuses: statusDistribution(),
      });
    }
  });
}
