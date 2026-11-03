import type { NextRequest } from "next/server";

import type { SortKey } from "@/features/products/types";
import { requireApiAdmin } from "@/server/api-auth";
import {
  ok,
  paginationMeta,
  readJson,
  readList,
  readPagination,
  withApi,
} from "@/server/http";
import {
  countProducts,
  createProduct,
  listProducts,
  type ProductInput,
  type ProductQuery,
} from "@/server/repositories/products";

export const dynamic = "force-dynamic";

const SORTS: SortKey[] = ["featured", "newest", "price-asc", "price-desc", "rating"];

function readProductQuery(searchParams: URLSearchParams): ProductQuery {
  const number = (key: string): number | undefined => {
    const raw = searchParams.get(key);
    if (raw === null || raw === "") return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const sortRaw = searchParams.get("sort") ?? "";
  const sort = SORTS.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : "featured";

  return {
    q: searchParams.get("q") ?? undefined,
    categories: readList(searchParams, "category"),
    sizes: readList(searchParams, "size"),
    colors: readList(searchParams, "color"),
    badges: readList(searchParams, "badge"),
    minPrice: number("minPrice"),
    maxPrice: number("maxPrice"),
    onlyDiscount: searchParams.get("onlyDiscount") === "1" || searchParams.get("onlyDiscount") === "true",
    onlyInStock: searchParams.get("onlyInStock") === "1" || searchParams.get("onlyInStock") === "true",
    featured: searchParams.get("featured") === null ? undefined : searchParams.get("featured") !== "0",
    sort,
  };
}

/**
 * GET /api/products
 *
 * Query: `q`, `category`, `size`, `color`, `badge` (comma separated),
 * `minPrice`, `maxPrice`, `onlyDiscount=1`, `onlyInStock=1`, `featured`,
 * `sort=featured|newest|price-asc|price-desc|rating`, `page`, `perPage`.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    const searchParams = request.nextUrl.searchParams;
    const pagination = readPagination(searchParams);
    const query = readProductQuery(searchParams);

    const [items, total] = await Promise.all([
      listProducts({ ...query, limit: pagination.perPage, offset: pagination.offset }),
      countProducts(query),
    ]);

    return ok(items, paginationMeta(total, pagination));
  });
}

/** POST /api/products — create a product (admin only). */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    await requireApiAdmin();
    const body = await readJson<ProductInput>(request);
    const product = await createProduct(body);
    return ok(product, undefined, 201);
  });
}
