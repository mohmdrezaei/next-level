import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { ok, withApi } from "@/server/http";
import { deleteReview } from "@/server/repositories/reviews";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

/** DELETE /api/reviews/:id (admin only) — also refreshes the product rating. */
export async function DELETE(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { id } = await params;
    return ok(await deleteReview(id));
  });
}
