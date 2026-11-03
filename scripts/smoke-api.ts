/**
 * API smoke test.
 *
 * Boots every route handler in-process against the live PostgreSQL instance and
 * asserts the response envelope. Used to verify the REST surface without a dev
 * server (`next dev` cannot run in the sandbox because Turbopack's persistent
 * cache needs file renames/deletes).
 *
 * Run with:  npx tsx scripts/smoke-api.ts
 */
import "../src/db/load-env";

import { NextRequest } from "next/server";

import * as healthRoute from "@/app/api/health/route";
import * as settingsRoute from "@/app/api/settings/route";
import * as productsRoute from "@/app/api/products/route";
import * as productRoute from "@/app/api/products/[idOrSlug]/route";
import * as productReviewsRoute from "@/app/api/products/[idOrSlug]/reviews/route";
import * as categoriesRoute from "@/app/api/categories/route";
import * as setsRoute from "@/app/api/sets/route";
import * as searchRoute from "@/app/api/search/route";
import * as couponsRoute from "@/app/api/coupons/route";
import * as couponsRouteValidate from "@/app/api/coupons/validate/route";
import * as newsletterRoute from "@/app/api/newsletter/route";
import * as contactRoute from "@/app/api/contact/route";
import * as ordersRoute from "@/app/api/orders/route";
import * as wishlistRoute from "@/app/api/wishlist/route";
import * as metricsRoute from "@/app/api/admin/metrics/route";
import * as profileRoute from "@/app/api/account/profile/route";
import * as passwordRoute from "@/app/api/account/password/route";

import { db } from "@/db";
import { contactMessages, newsletterSubscribers, orders, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

const BASE = "http://localhost:3100";
const EMAIL = `smoke-${Date.now()}@nextlevel.test`;

let failures = 0;

function get(path: string): NextRequest {
  return new NextRequest(`${BASE}${path}`);
}

function send(path: string, method: string, body: unknown): NextRequest {
  return new NextRequest(`${BASE}${path}`, {
    method,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function check(
  label: string,
  expected: number | number[],
  run: () => Promise<Response>,
  assert?: (data: unknown) => string | null,
): Promise<unknown> {
  const wanted = Array.isArray(expected) ? expected : [expected];
  try {
    const response = await run();
    const payload = (await response.json()) as { ok: boolean; data: unknown; error: string | null };
    const statusOk = wanted.includes(response.status);
    const envelopeOk = response.status < 400 ? payload.ok === true : payload.ok === false;
    const extra = statusOk && envelopeOk && assert ? assert(payload.data) : null;
    const pass = statusOk && envelopeOk && !extra;

    if (!pass) failures += 1;
    console.log(
      `${pass ? "PASS" : "FAIL"}  ${response.status}  ${label}` +
        (extra ? `  -> ${extra}` : statusOk ? "" : `  (expected ${wanted.join("/")})`),
    );
    return payload.data;
  } catch (error) {
    failures += 1;
    console.log(`FAIL  ERR   ${label}  -> ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

async function main(): Promise<void> {
  /* ---------------------------------------------------------------- public */

  await check("GET  /api/health", 200, () => healthRoute.GET(), (data) => {
    const d = data as { database?: { connected?: boolean } };
    return d?.database?.connected ? null : "database not connected";
  });

  await check("GET  /api/settings", 200, () => settingsRoute.GET(), (data) => {
    const d = data as { name?: string; freeShipping?: number };
    return d?.name && typeof d.freeShipping === "number" ? null : "missing settings fields";
  });

  const products = (await check(
    "GET  /api/products",
    200,
    () => productsRoute.GET(get("/api/products?perPage=3")),
    (data) => (Array.isArray(data) && data.length ? null : "empty product list"),
  )) as { id: string; slug: string; variants: { size: string; stock: number }[]; colors: { name: string }[] }[];

  const first = products?.[0];
  const inStock = first?.variants?.find((v) => v.stock > 0);

  await check("GET  /api/categories?withCounts=1", 200, () =>
    categoriesRoute.GET(get("/api/categories?withCounts=1")),
  );
  await check("GET  /api/sets", 200, () => setsRoute.GET(get("/api/sets")));
  await check("GET  /api/search?q=پالتو", 200, () => searchRoute.GET(get("/api/search?q=%D9%BE%D8%A7%D9%84%D8%AA%D9%88")));
  await check("GET  /api/coupons (guest -> admin only)", 401, () => couponsRoute.GET());
  await check("POST /api/coupons/validate", [200, 400], () =>
    couponsRouteValidate.POST(send("/api/coupons/validate", "POST", { code: "NEXT10", subtotal: 6_000_000 })),
  );

  if (first) {
    await check(`GET  /api/products/${first.slug}`, 200, () =>
      productRoute.GET(get(`/api/products/${first.slug}`), { params: Promise.resolve({ idOrSlug: first.slug }) }),
    );
    await check(`GET  /api/products/${first.slug}/reviews`, 200, () =>
      productReviewsRoute.GET(get(`/api/products/${first.slug}/reviews`), {
        params: Promise.resolve({ idOrSlug: first.slug }),
      }),
    );
  }

  /* ------------------------------------------------------------ writes */

  await check("POST /api/newsletter", [200, 201], () =>
    newsletterRoute.POST(send("/api/newsletter", "POST", { email: EMAIL })),
  );

  await check("POST /api/contact", 201, () =>
    contactRoute.POST(
      send("/api/contact", "POST", {
        name: "اسموک تست",
        email: EMAIL,
        phone: "09120000000",
        subject: "other",
        message: "این پیام توسط اسکریپت تست خودکار ساخته شده است.",
      }),
    ),
  );

  let orderCode: string | null = null;
  if (first && inStock) {
    const data = (await check("POST /api/orders (guest checkout)", 201, () =>
      ordersRoute.POST(
        send("/api/orders", "POST", {
          customerName: "اسموک تست",
          customerPhone: "09120000000",
          customerEmail: EMAIL,
          items: [
            {
              productId: first.id,
              size: inStock.size,
              color: first.colors?.[0]?.name ?? "—",
              quantity: 1,
            },
          ],
          address: {
            fullName: "اسموک تست",
            phone: "09120000000",
            province: "تهران",
            city: "تهران",
            line1: "خیابان تست، پلاک ۱، واحد ۲",
            postalCode: "1234567890",
          },
          shippingMethod: "standard",
          paymentMethod: "gateway",
        }),
      ),
    )) as { code?: string; total?: number } | null;

    orderCode = data?.code ?? null;
  }

  /* ------------------------------------------------------------- guards */

  await check("GET  /api/wishlist (guest)", 401, () => wishlistRoute.GET(get("/api/wishlist")));
  await check("GET  /api/admin/metrics (guest)", 401, () => metricsRoute.GET());
  await check("GET  /api/account/profile (guest)", 401, () => profileRoute.GET());
  await check("PATCH /api/account/profile (guest)", 401, () =>
    profileRoute.PATCH(send("/api/account/profile", "PATCH", { name: "x" })),
  );
  await check("PUT  /api/account/password (guest)", 401, () =>
    passwordRoute.PUT(send("/api/account/password", "PUT", { current: "a", next: "b", confirm: "b" })),
  );
  await check("PUT  /api/settings (guest)", 401, () =>
    settingsRoute.PUT(send("/api/settings", "PUT", { name: "hacked" })),
  );

  /* ------------------------------------------- write paths (repo round-trip) */

  // `/api/settings` PUT and `/api/account/*` need a session, which cannot be
  // forged outside a request scope — exercise the repositories they wrap.
  const settingsRepo = await import("@/server/repositories/settings");
  const usersRepo = await import("@/server/repositories/users");

  const before = await settingsRepo.getSettings();
  const saved = await settingsRepo.updateSettings({ name: "اسموک تست", freeShipping: 7_000_000 });
  const persisted = (await settingsRepo.getSettings()).freeShipping === 7_000_000;
  console.log(
    `${saved.name === "اسموک تست" && persisted ? "PASS" : "FAIL"}  ---   settings upsert + reload` +
      `  (before: ${before.name} / ${before.freeShipping})`,
  );
  if (saved.name !== "اسموک تست" || !persisted) failures += 1;

  await settingsRepo.resetSettings();
  const afterReset = await settingsRepo.getSettings();
  console.log(
    `${afterReset.name !== "اسموک تست" ? "PASS" : "FAIL"}  ---   settings reset to defaults  (${afterReset.name})`,
  );
  if (afterReset.name === "اسموک تست") failures += 1;

  const tempPhone = "09990000001";
  const tempUser = await usersRepo.createUser({
    name: "کاربر تست",
    phone: tempPhone,
    email: `profile-${Date.now()}@nextlevel.test`,
    password: "smoke12345",
  });

  const updatedProfile = await usersRepo.updateProfile(tempUser.id, {
    name: "کاربر ویرایش‌شده",
    birthday: "1370/05/12",
    gender: "male",
  });
  const profileOk = updatedProfile.name === "کاربر ویرایش‌شده" && updatedProfile.birthday === "1370/05/12";
  console.log(`${profileOk ? "PASS" : "FAIL"}  ---   profile update persists`);
  if (!profileOk) failures += 1;

  let passwordOk = false;
  try {
    await usersRepo.changePassword(tempUser.id, "wrong-password", "smoke67890");
  } catch {
    passwordOk = true; // wrong current password must be rejected
  }
  await usersRepo.changePassword(tempUser.id, "smoke12345", "smoke67890");
  const loginAfter = await usersRepo.verifyCredentials(updatedProfile.email, "smoke67890");
  const passwordPassed = passwordOk && Boolean(loginAfter);
  console.log(`${passwordPassed ? "PASS" : "FAIL"}  ---   password change (reject wrong, accept new)`);
  if (!passwordPassed) failures += 1;

  await db.delete(users).where(eq(users.id, tempUser.id));

  /* ------------------------------------------------------------ cleanup */

  await db.delete(contactMessages).where(eq(contactMessages.email, EMAIL));
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, EMAIL));
  if (orderCode) {
    await db.delete(orders).where(inArray(orders.code, [orderCode]));
  }
  console.log("\ncleanup: removed smoke-test rows");

  console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
