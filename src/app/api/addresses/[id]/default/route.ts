import type { NextRequest } from "next/server";

import { resolveCustomerScope } from "@/server/api-auth";
import { ok, withApi } from "@/server/http";
import { setDefaultAddress } from "@/server/repositories/addresses";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/addresses/:id/default — make this the default shipping address.
 *
 * The ownership scope is applied inside the repository's `WHERE` clause, so a
 * foreign address id resolves to `404` rather than being mutated.
 */
export async function POST(_request: NextRequest, { params }: Context) {
  return withApi(async () => {
    const { id } = await params;
    const scope = await resolveCustomerScope();

    return ok(await setDefaultAddress(scope, id));
  });
}
