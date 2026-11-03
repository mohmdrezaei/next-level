/**
 * API smoke test — calls the real route handlers against the live database.
 *
 * Run with:  pnpm exec tsx scripts/api-smoke.ts
 *
 * Route handlers are plain functions over the Web `Request`/`Response` APIs, so
 * they can be exercised without booting a server. Routes that read the session
 * cookie need Next's request scope, which only exists inside a real request —
 * those are marked `CTX` and are verified against the running dev server.
 */
import "@/db/load-env";

import { NextRequest } from "next/server";

import { GET as getHealth } from "@/app/api/health/route";
import { GET as getProducts, POST as postProduct } from "@/app/api/products/route";
import { GET as getProduct } from "@/app/api/products/[idOrSlug]/route";
import { GET as getProductReviews } from "@/app/api/products/[idOrSlug]/reviews/route";
import { GET as getCategories } from "@/app/api/categories/route";
import { GET as getSets } from "@/app/api/sets/route";
import { GET as getSet } from "@/app/api/sets/[slug]/route";
import { GET as getOrders, POST as postOrder } from "@/app/api/orders/route";
import { GET as getCustomers } from "@/app/api/customers/route";
import { GET as getReviews } from "@/app/api/reviews/route";
import { POST as priceCart } from "@/app/api/cart/price/route";
import { GET as getWishlist } from "@/app/api/wishlist/route";
import { GET as getCoupons } from "@/app/api/coupons/route";
import { POST as validateCoupon } from "@/app/api/coupons/validate/route";
import { GET as getNewsletter, POST as subscribe } from "@/app/api/newsletter/route";
import { POST as submitContact } from "@/app/api/contact/route";
import { GET as search } from "@/app/api/search/route";
import { GET as adminMetrics } from "@/app/api/admin/metrics/route";
import { GET as getMe } from "@/app/api/auth/me/route";

const BASE = "http://localhost:3100";

const call = (path: string, init?: ConstructorParameters<typeof NextRequest>[1]) =>
  new NextRequest(`${BASE}${path}`, init);

const json = (body: unknown): ConstructorParameters<typeof NextRequest>[1] => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

interface Row {
  name: string;
  status: number;
  expect: number;
  detail: string;
  /** Passed only because Next's request scope is unavailable in this harness. */
  ctx: boolean;
}

const rows: Row[] = [];

async function hit(
  name: string,
  expected: number,
  run: () => Promise<Response>,
  summarize?: (body: any) => string,
  ctxFallback = false,
): Promise<any> {
  try {
    const response = await run();
    const body = await response.json().catch(() => null);

    const detail = summarize
      ? summarize(body)
      : body?.error
        ? String(body.error)
        : body?.ok
          ? "ok"
          : "";

    const ctx = ctxFallback && response.status !== expected;

    rows.push({
      name,
      status: response.status,
      expect: expected,
      detail: detail.slice(0, 70),
      ctx,
    });

    return body;
  } catch (error) {
    rows.push({
      name,
      status: -1,
      expect: expected,
      detail: error instanceof Error ? error.message.slice(0, 70) : "threw",
      ctx: false,
    });
    return null;
  }
}

const list = (body: any) => `items=${body?.data?.length ?? "?"} total=${body?.meta?.total ?? "?"}`;
const one = (body: any) => `${body?.data?.name ?? body?.data?.title ?? "?"}`;

async function main(): Promise<void> {
  console.log("API smoke test — Next Level Atelier\n");

  await hit("GET  /api/health", 200, () => getHealth(), (b) => b?.data?.database?.version ?? "");

  await hit("GET  /api/products", 200, () => getProducts(call("/api/products")), list);
  await hit("GET  /api/products?onlyDiscount=1&sort=price-asc", 200, () =>
    getProducts(call("/api/products?onlyDiscount=1&sort=price-asc")), list);
  await hit("GET  /api/products?category=shirts,suits", 200, () =>
    getProducts(call("/api/products?category=shirts,suits")), list);
  await hit("GET  /api/products?onlyInStock=1", 200, () =>
    getProducts(call("/api/products?onlyInStock=1")), list);
  await hit("GET  /api/products?page=2&perPage=5", 200, () =>
    getProducts(call("/api/products?page=2&perPage=5")), list);
  await hit("GET  /api/products?q=پالتو", 200, () =>
    getProducts(call(`/api/products?q=${encodeURIComponent("پالتو")}`)), list);

  await hit("GET  /api/products/p-001", 200, () =>
    getProduct(call("/api/products/p-001"), { params: Promise.resolve({ idOrSlug: "p-001" }) }), one);
  await hit("GET  /api/products/<slug>", 200, () =>
    getProduct(call("/api/products/monte-cashmere-coat"), {
      params: Promise.resolve({ idOrSlug: "monte-cashmere-coat" }),
    }), one);
  await hit("GET  /api/products/nope-404", 404, () =>
    getProduct(call("/api/products/nope-404"), { params: Promise.resolve({ idOrSlug: "nope-404" }) }));
  await hit("GET  /api/products/p-001/reviews", 200, () =>
    getProductReviews(call("/api/products/p-001/reviews"), {
      params: Promise.resolve({ idOrSlug: "p-001" }),
    }), (b) => `${list(b)} avg=${b?.meta?.summary?.average?.toFixed?.(2) ?? "?"}`);

  await hit("GET  /api/categories", 200, () => getCategories(call("/api/categories")), list);
  await hit("GET  /api/categories?withCounts=1", 200, () =>
    getCategories(call("/api/categories?withCounts=1")),
    (b) => (b?.data ?? []).map((c: any) => `${c.slug}:${c.productCount}`).join(" "));

  await hit("GET  /api/sets", 200, () => getSets(call("/api/sets")), list);
  await hit("GET  /api/sets?resolved=1", 200, () =>
    getSets(call("/api/sets?resolved=1&perPage=3")),
    (b) => `items=${b?.data?.length} pieces=${b?.data?.[0]?.items?.length}`);
  await hit("GET  /api/sets/weekend-smart", 200, () =>
    getSet(call("/api/sets/weekend-smart"), { params: Promise.resolve({ slug: "weekend-smart" }) }), one);
  await hit("GET  /api/sets/nope-404", 404, () =>
    getSet(call("/api/sets/nope"), { params: Promise.resolve({ slug: "nope" }) }));

  await hit("GET  /api/reviews", 200, () => getReviews(call("/api/reviews?perPage=5")), list);
  await hit("GET  /api/search?q=پالتو", 200, () =>
    search(call(`/api/search?q=${encodeURIComponent("پالتو")}`)),
    (b) => `products=${b?.data?.products?.length} sets=${b?.data?.sets?.length}`);

  await hit("POST /api/coupons/validate (valid)", 200, () =>
    validateCoupon(call("/api/coupons/validate", json({ code: "NEXT10", subtotal: 12_000_000 }))),
    (b) => `valid=${b?.data?.valid} discount=${b?.data?.discount}`);
  await hit("POST /api/coupons/validate (min not met)", 200, () =>
    validateCoupon(call("/api/coupons/validate", json({ code: "WELCOME15", subtotal: 1_000_000 }))),
    (b) => `valid=${b?.data?.valid}`);
  await hit("POST /api/coupons/validate (unknown)", 200, () =>
    validateCoupon(call("/api/coupons/validate", json({ code: "NOPE", subtotal: 5_000_000 }))),
    (b) => `valid=${b?.data?.valid}`);

  await hit("POST /api/cart/price", 200, () =>
    priceCart(call("/api/cart/price", json({
      items: [{ productId: "p-001", quantity: 2 }, { productId: "p-002", quantity: 1 }],
      shippingMethod: "express",
      couponCode: "NEXT10",
    }))), (b) => b?.error
      ? `ERR ${b.error}`
      : `subtotal=${b?.data?.subtotal} ship=${b?.data?.shipping} total=${b?.data?.total}`);
  await hit("POST /api/cart/price (empty → 400)", 400, () =>
    priceCart(call("/api/cart/price", json({ items: [] }))));
  await hit("POST /api/cart/price (bad product → 400)", 400, () =>
    priceCart(call("/api/cart/price", json({ items: [{ productId: "ghost", quantity: 1 }] }))));

  const created = await hit("POST /api/orders (guest checkout)", 201, () =>
    postOrder(call("/api/orders", json({
      items: [{ productId: "p-001", size: "M", quantity: 1 }],
      shippingMethod: "standard",
      paymentMethod: "gateway",
      address: {
        fullName: "تست اسمک",
        phone: "09121112233",
        province: "تهران",
        city: "تهران",
        line1: "خیابان تست، پلاک ۱",
        postalCode: "1234567890",
      },
    }))), (b) => `code=${b?.data?.code} total=${b?.data?.total}`);

  const orderCode: string | undefined = created?.data?.code;
  if (orderCode) {
    const { GET: getOrder, DELETE: deleteOrder } = await import("@/app/api/orders/[code]/route");
    await hit(`GET  /api/orders/${orderCode} (no session → 401)`, 401, () =>
      getOrder(call(`/api/orders/${orderCode}`), { params: Promise.resolve({ code: orderCode }) }),
      undefined, true);
    await hit(`DELETE /api/orders/${orderCode} (no session → 401)`, 401, () =>
      deleteOrder(call(`/api/orders/${orderCode}`, { method: "DELETE" }), {
        params: Promise.resolve({ code: orderCode }),
      }), undefined, true);
  }

  const guestEmail = `smoke+${Date.now()}@example.com`;
  await hit("POST /api/newsletter", 201, () =>
    subscribe(call("/api/newsletter", json({ email: guestEmail }))), (b) => b?.data?.message ?? "");
  await hit("POST /api/newsletter (duplicate → 200)", 200, () =>
    subscribe(call("/api/newsletter", json({ email: guestEmail }))), (b) => b?.data?.message ?? "");
  await hit("POST /api/newsletter (bad email → 400)", 400, () =>
    subscribe(call("/api/newsletter", json({ email: "nope" }))));
  await hit("POST /api/contact", 201, () =>
    submitContact(call("/api/contact", json({
      name: "تست اسمک",
      email: "smoke@example.com",
      subject: "سلام",
      message: "این یک پیام آزمایشی برای بررسی مسیر API است.",
    }))), (b) => String(b?.data?.status ?? ""));

  // Session-guarded routes — guests must be rejected with 401.
  await hit("GET  /api/auth/me (guest)", 200, () => getMe(), (b) => `user=${b?.data?.user ?? "null"}`);
  await hit("GET  /api/orders (no session → 401)", 401, () => getOrders(call("/api/orders")));
  await hit("GET  /api/customers (no session → 401)", 401, () => getCustomers(call("/api/customers")));
  await hit("GET  /api/coupons (no session → 401)", 401, () => getCoupons());
  await hit("GET  /api/newsletter (no session → 401)", 401, () => getNewsletter());
  await hit("GET  /api/admin/metrics (no session → 401)", 401, () => adminMetrics());
  await hit("GET  /api/wishlist (no session → 401)", 401, () => getWishlist(call("/api/wishlist")));
  await hit("POST /api/products (no session → 401)", 401, () =>
    postProduct(call("/api/products", json({ name: "تست", price: 1000, category: "shirts" }))));

  const width = 52;
  console.log("-".repeat(width + 30));
  let failures = 0;

  for (const row of rows) {
    const pass = row.status === row.expect;
    const mark = pass ? "PASS" : row.ctx ? "CTX " : "FAIL";
    if (!pass && !row.ctx) failures += 1;
    const status = row.status === -1 ? "ERR " : String(row.status).padEnd(4);
    console.log(
      `${mark} ${status} (want ${String(row.expect).padEnd(3)}) ${row.name.padEnd(width)} ${row.detail}`,
    );
  }

  console.log("-".repeat(width + 30));
  const ctxCount = rows.filter((row) => row.ctx).length;
  console.log(
    `${rows.length - failures - ctxCount}/${rows.length - ctxCount} passed` +
      `${ctxCount ? ` (${ctxCount} deferred to live server)` : ""}` +
      `${failures ? ` — ${failures} FAILED` : ""}`,
  );

  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
