import type { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/api-auth";
import { ok, paginationMeta, readJson, readPagination, withApi } from "@/server/http";
import {
  countCustomers,
  createCustomer,
  listCustomers,
  type CustomerInput,
  type CustomerQuery,
} from "@/server/repositories/customers";

export const dynamic = "force-dynamic";

/**
 * GET /api/customers  (admin only)
 * Query: `q`, `tier`, `page`, `perPage`.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    await requireApiAdmin();

    const searchParams = request.nextUrl.searchParams;
    const pagination = readPagination(searchParams);

    const query: CustomerQuery = {
      q: searchParams.get("q") ?? undefined,
      tier: searchParams.get("tier") ?? undefined,
      limit: pagination.perPage,
      offset: pagination.offset,
    };

    const [items, total] = await Promise.all([listCustomers(query), countCustomers(query)]);
    return ok(items, paginationMeta(total, pagination));
  });
}

/** POST /api/customers (admin only). */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    await requireApiAdmin();
    const body = await readJson<CustomerInput>(request);
    return ok(await createCustomer(body), undefined, 201);
  });
}
