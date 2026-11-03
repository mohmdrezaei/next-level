import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { ok, withApi } from "@/server/http";
import { duplicateSet } from "@/server/repositories/sets";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ slug: string }>;
}

/** POST /api/sets/:slug/duplicate (admin only). */
export async function POST(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    await requireApiAdmin();
    const { slug } = await params;
    return ok(await duplicateSet(slug), undefined, 201);
  });
}
