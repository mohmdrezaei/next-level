import { sql } from "drizzle-orm";

import { db } from "@/db";
import { truncatePayload } from "@/lib/redact";
import { ApiError, ok, withApi } from "@/server/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Liveness + database connectivity probe.
 *
 * The probe reports *whether* the database answered, not *why* it did not:
 * driver messages routinely embed the host, port, user name and sometimes the
 * connection string. Those go to the server log; the caller gets a fixed 503.
 */
export async function GET() {
  return withApi(async () => {
    const started = Date.now();
    let version = "";

    try {
      const rows = await db.execute<{ version: string }>(sql`select version() as version`);
      version = String(rows[0]?.version ?? "").split(" ").slice(0, 2).join(" ");
    } catch (error) {
      console.error(`[health] database probe failed: ${truncatePayload(error, 300)}`);
      throw new ApiError(503, "اتصال به پایگاه داده برقرار نشد.");
    }

    return ok({
      status: "healthy",
      database: { connected: true, version, latencyMs: Date.now() - started },
      timestamp: new Date().toISOString(),
    });
  });
}
