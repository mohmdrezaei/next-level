import type { NextRequest } from "next/server";

import { ok, withApi } from "@/server/http";
import { markReviewHelpful } from "@/server/repositories/reviews";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

/** POST /api/reviews/:id/helpful — increment the "was this helpful" counter. */
export async function POST(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const { id } = await params;
    return ok(await markReviewHelpful(id));
  });
}
