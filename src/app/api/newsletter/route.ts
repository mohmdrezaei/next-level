import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { ok, withApi } from "@/server/http";
import { email, parseBody } from "@/server/validate";
import { listSubscribers, subscribeToNewsletter } from "@/server/repositories/messaging";

export const dynamic = "force-dynamic";

/** GET /api/newsletter (admin only) — recent subscribers. */
export async function GET() {
  return withApi(async () => {
    await requireApiAdmin();
    return ok(await listSubscribers());
  });
}

/**
 * POST /api/newsletter
 * Body: `{ "email": "someone@example.com" }` — idempotent.
 */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    const body = await parseBody(request, { email: email() });

    const result = await subscribeToNewsletter(body.email);
    return ok(
      { ...result, message: result.created ? "عضویت شما ثبت شد." : "این ایمیل از قبل عضو شده است." },
      undefined,
      result.created ? 201 : 200,
    );
  });
}
