/**
 * End-to-end HTTP smoke test for the whole `app/api` surface.
 *
 * Unlike `scripts/smoke-api.ts` (which invokes route handlers in-process), this
 * drives a REAL running dev/prod server over HTTP, so cookies, sessions,
 * middleware and the Postgres round-trip are all exercised for real.
 *
 * Usage:
 *   NEXT_DIST_DIR=.build npx next dev -p 3001     # terminal 1
 *   node scripts/verify-api.mjs                   # terminal 2
 *
 * Env: SMOKE_BASE (default http://127.0.0.1:3001)
 */
const BASE = process.env.SMOKE_BASE ?? "http://127.0.0.1:3001";
const ADMIN = { identifier: "admin@nextlevel.test", password: "nextlevel1234" };
const TS = Date.now();

let pass = 0;
let fail = 0;
const failures = [];

function record(ok, label, detail) {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${label}`);
  } else {
    fail += 1;
    failures.push(label);
    console.log(`FAIL  ${label}${detail ? `  -> ${detail}` : ""}`);
  }
}

/** Minimal cookie-jar session over fetch. */
class Session {
  constructor(name) {
    this.name = name;
    this.jar = new Map();
  }
  #absorb(res) {
    const list = res.headers.getSetCookie?.() ?? [];
    for (const raw of list) {
      const pair = raw.split(";")[0];
      const i = pair.indexOf("=");
      if (i > 0) this.jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
  }
  async req(method, path, body) {
    const headers = {};
    if (body !== undefined) headers["content-type"] = "application/json";
    if (this.jar.size) {
      headers.cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    }
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
    });
    this.#absorb(res);
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* non-JSON (HTML error page) */
    }
    return { status: res.status, json };
  }
  get(p) {
    return this.req("GET", p);
  }
  post(p, b) {
    return this.req("POST", p, b);
  }
  patch(p, b) {
    return this.req("PATCH", p, b);
  }
  put(p, b) {
    return this.req("PUT", p, b);
  }
  del(p, b) {
    return this.req("DELETE", p, b);
  }
}

/** Assert a response has an expected status and a well-formed envelope. */
async function expect(label, promise, wanted, inspect) {
  const list = Array.isArray(wanted) ? wanted : [wanted];
  try {
    const { status, json } = await promise;
    if (!list.includes(status)) {
      record(false, label, `status ${status}, expected ${list.join("/")}`);
      return { status, json };
    }
    if (json && typeof json === "object" && "ok" in json) {
      const wantOk = status < 400;
      if (json.ok !== wantOk) {
        record(false, label, `envelope ok=${json.ok} for status ${status}`);
        return { status, json };
      }
    }
    const problem = inspect ? inspect(json) : null;
    record(!problem, label, problem);
    return { status, json };
  } catch (error) {
    record(false, label, error instanceof Error ? error.message : String(error));
    return { status: 0, json: null };
  }
}

const data = (r) => r.json?.data;

async function main() {
  console.log(`\n=== Next Level API smoke test against ${BASE} ===\n`);

  const guest = new Session("guest");
  const admin = new Session("admin");
  const shopper = new Session("shopper");

  /* ------------------------------------------------------------ public */

  await expect("GET  /api/health", guest.get("/api/health"), 200, (j) =>
    j?.data?.database?.connected ? null : "database not connected",
  );
  await expect("GET  /api/settings", guest.get("/api/settings"), 200, (j) =>
    typeof j?.data?.name === "string" ? null : "no settings",
  );
  const cats = await expect("GET  /api/categories", guest.get("/api/categories"), 200, (j) =>
    Array.isArray(j?.data) && j.data.length ? null : "empty",
  );
  await expect("GET  /api/categories?withCounts=1", guest.get("/api/categories?withCounts=1"), 200);
  const catSlug = data(cats)?.[0]?.slug;

  const prods = await expect(
    "GET  /api/products",
    guest.get("/api/products?perPage=3"),
    200,
    (j) => (Array.isArray(j?.data) && j.data.length ? null : "empty"),
  );
  const product = data(prods)?.[0];
  const inStock = product?.variants?.find((v) => v.stock > 0);
  const colorName = product?.colors?.[0]?.name ?? "—";

  if (product) {
    await expect(`GET  /api/products/${product.slug}`, guest.get(`/api/products/${product.slug}`), 200);
    await expect(
      `GET  /api/products/${product.slug}/reviews`,
      guest.get(`/api/products/${product.slug}/reviews`),
      200,
    );
  }

  const sets = await expect("GET  /api/sets", guest.get("/api/sets"), 200, (j) =>
    Array.isArray(j?.data) && j.data.length ? null : "empty",
  );
  const setSlug = data(sets)?.[0]?.slug;
  if (setSlug) await expect(`GET  /api/sets/${setSlug}`, guest.get(`/api/sets/${setSlug}`), 200);

  await expect("GET  /api/search?q=پالتو", guest.get(`/api/search?q=${encodeURIComponent("پالتو")}`), 200);
  await expect(
    "POST /api/coupons/validate",
    guest.post("/api/coupons/validate", { code: "NEXT10", subtotal: 6_000_000 }),
    [200, 400],
  );

  if (product && inStock) {
    await expect(
      "POST /api/cart/price",
      guest.post("/api/cart/price", {
        items: [{ productId: product.id, size: inStock.size, color: colorName, quantity: 1 }],
        shippingMethod: "standard",
      }),
      200,
      (j) => (typeof j?.data?.total === "number" ? null : "no total"),
    );
  }

  /* -------------------------------------------------------------- auth */

  const shopperEmail = `smoke-${TS}@nextlevel.test`;
  const shopperPhone = `0999${String(TS).slice(-7)}`;

  await expect(
    "POST /api/auth/register (shopper)",
    shopper.post("/api/auth/register", {
      name: "خریدار تست",
      phone: shopperPhone,
      email: shopperEmail,
      password: "smoke12345",
    }),
    201,
    (j) => (j?.data?.user?.email === shopperEmail ? null : "wrong user echoed"),
  );

  await expect("GET  /api/auth/me (shopper)", shopper.get("/api/auth/me"), 200, (j) =>
    j?.data?.user ? null : "no session",
  );
  const me = await expect("GET  /api/auth/me → customerId", shopper.get("/api/auth/me"), 200);
  const customerId = data(me)?.customerId ?? null;

  await expect(
    "POST /api/auth/login (admin)",
    admin.post("/api/auth/login", ADMIN),
    200,
    (j) => (j?.data?.user?.role === "admin" ? null : "not admin"),
  );
  await expect("GET  /api/auth/me (admin)", admin.get("/api/auth/me"), 200);

  /* ----------------------------------------------------------- account */

  await expect("GET  /api/account/profile", shopper.get("/api/account/profile"), 200);
  await expect(
    "PATCH /api/account/profile",
    shopper.patch("/api/account/profile", { name: "خریدار ویرایش‌شده", gender: "male", birthday: "1370/05/12" }),
    200,
    (j) => (j?.data?.name === "خریدار ویرایش‌شده" ? null : "not persisted"),
  );
  await expect(
    "PUT  /api/account/password (wrong current → 4xx)",
    shopper.put("/api/account/password", { current: "nope", next: "smoke67890", confirm: "smoke67890" }),
    [400, 401, 403],
  );
  await expect(
    "PUT  /api/account/password",
    shopper.put("/api/account/password", { current: "smoke12345", next: "smoke67890", confirm: "smoke67890" }),
    200,
  );

  /* ---------------------------------------------------------- wishlist */

  if (product) {
    await expect("POST /api/wishlist", shopper.post("/api/wishlist", { productId: product.id }), [200, 201]);
    await expect("GET  /api/wishlist", shopper.get("/api/wishlist"), 200);
    await expect("GET  /api/wishlist?ids=1", shopper.get("/api/wishlist?ids=1"), 200);
    await expect(
      `DELETE /api/wishlist?productId=${product.id}`,
      shopper.del(`/api/wishlist?productId=${product.id}`),
      200,
    );
  }

  /* --------------------------------------------------------- addresses */

  let addressId = null;
  if (customerId) {
    await expect(`GET  /api/customers/${customerId}/addresses`, shopper.get(`/api/customers/${customerId}/addresses`), 200);
    const created = await expect(
      `POST /api/customers/${customerId}/addresses`,
      shopper.post(`/api/customers/${customerId}/addresses`, {
        title: "خانه",
        fullName: "خریدار تست",
        phone: shopperPhone,
        province: "تهران",
        city: "تهران",
        line1: "خیابان تست، پلاک ۱",
        postalCode: "1234567890",
        isDefault: true,
      }),
      [200, 201],
    );
    addressId = data(created)?.id ?? null;

    if (addressId) {
      await expect(
        `PATCH /api/addresses/${addressId}`,
        shopper.patch(`/api/addresses/${addressId}`, { line1: "خیابان ویرایش‌شده، پلاک ۲" }),
        200,
      );
      await expect(`POST /api/addresses/${addressId}/default`, shopper.post(`/api/addresses/${addressId}/default`), 200);
    }
  }

  /* ------------------------------------------------------------ orders */

  let orderCode = null;
  if (product && inStock) {
    const created = await expect(
      "POST /api/orders (shopper checkout)",
      shopper.post("/api/orders", {
        customerName: "خریدار تست",
        customerPhone: shopperPhone,
        customerEmail: shopperEmail,
        items: [{ productId: product.id, size: inStock.size, color: colorName, quantity: 1 }],
        address: {
          fullName: "خریدار تست",
          phone: shopperPhone,
          province: "تهران",
          city: "تهران",
          line1: "خیابان تست، پلاک ۱",
          postalCode: "1234567890",
        },
        shippingMethod: "standard",
        paymentMethod: "gateway",
      }),
      201,
      (j) => (j?.data?.code ? null : "no order code"),
    );
    orderCode = data(created)?.code ?? null;
  }

  await expect("GET  /api/orders (shopper)", shopper.get("/api/orders?perPage=5"), 200);
  if (orderCode) {
    await expect(`GET  /api/orders/${orderCode}`, shopper.get(`/api/orders/${orderCode}`), 200);
    await expect(
      `PATCH /api/orders/${orderCode}/status (admin)`,
      admin.patch(`/api/orders/${orderCode}/status`, { status: "processing" }),
      200,
    );
  }

  /* ----------------------------------------------------------- reviews */

  let reviewId = null;
  if (product) {
    const created = await expect(
      `POST /api/products/${product.slug}/reviews`,
      shopper.post(`/api/products/${product.slug}/reviews`, {
        rating: 5,
        title: "عالی",
        body: "تست خودکار رابط برنامه‌نویسی.",
      }),
      201,
    );
    reviewId = data(created)?.id ?? null;
    if (reviewId) {
      await expect(`POST /api/reviews/${reviewId}/helpful`, guest.post(`/api/reviews/${reviewId}/helpful`), 200);
    }
  }
  await expect("GET  /api/reviews (admin)", admin.get("/api/reviews?perPage=5"), 200);

  /* ------------------------------------------------------------- admin */

  await expect("GET  /api/admin/metrics", admin.get("/api/admin/metrics"), 200, (j) =>
    Array.isArray(j?.data?.kpis) && j.data.kpis.length ? null : "no kpis",
  );
  await expect("GET  /api/customers", admin.get("/api/customers?perPage=5"), 200);
  await expect("GET  /api/coupons", admin.get("/api/coupons"), 200);
  await expect("GET  /api/newsletter", admin.get("/api/newsletter"), 200);
  await expect("GET  /api/contact", admin.get("/api/contact"), 200);

  // categories CRUD
  const catSlugNew = `smoke-cat-${TS}`;
  await expect(
    "POST /api/categories (admin)",
    admin.post("/api/categories", { slug: catSlugNew, title: "دسته تست", latinTitle: "Smoke", position: 99 }),
    [200, 201],
  );
  await expect(
    `PATCH /api/categories/${catSlugNew}`,
    admin.patch(`/api/categories/${catSlugNew}`, { title: "دسته ویرایش‌شده" }),
    200,
  );
  await expect(`DELETE /api/categories/${catSlugNew}`, admin.del(`/api/categories/${catSlugNew}`), 200);

  // products CRUD + duplicate
  const prodSlug = `smoke-product-${TS}`;
  const createdProduct = await expect(
    "POST /api/products (admin)",
    admin.post("/api/products", {
      name: "محصول تست",
      latinName: "Smoke Product",
      slug: prodSlug,
      category: "shirts",
      price: 1_000_000,
      compareAtPrice: null,
      shortDescription: "توضیح کوتاه",
      description: "توضیح کامل",
      materials: ["پنبه"],
      highlights: ["ویژگی"],
      colors: [{ name: "مشکی", hex: "#000000" }],
      sizes: ["M", "L"],
      badges: [],
      stock: 5,
      featured: false,
      images: [],
    }),
    [200, 201],
  );
  const newProductId = data(createdProduct)?.id ?? null;

  let dupProductId = null;
  if (newProductId) {
    await expect(
      `PATCH /api/products/${prodSlug}`,
      admin.patch(`/api/products/${prodSlug}`, { price: 1_200_000 }),
      200,
    );
    const dup = await expect(
      `POST /api/products/${prodSlug}/duplicate`,
      admin.post(`/api/products/${prodSlug}/duplicate`),
      [200, 201],
    );
    dupProductId = data(dup)?.id ?? null;
  }

  // sets CRUD + duplicate
  const setSlugNew = `smoke-set-${TS}`;
  await expect(
    "POST /api/sets (admin)",
    admin.post("/api/sets", {
      slug: setSlugNew,
      title: "ست تست",
      latinTitle: "Smoke Set",
      subtitle: "زیرعنوان",
      description: "توضیح",
      occasion: "روزمره",
      season: "پاییز",
      discountRate: 0.1,
      featured: false,
      accent: "#c8a24c",
      items: product ? [{ productId: product.id, role: "بالاتنه" }] : [],
    }),
    [200, 201],
  );
  await expect(`PATCH /api/sets/${setSlugNew}`, admin.patch(`/api/sets/${setSlugNew}`, { title: "ست ویرایش‌شده" }), 200);
  const dupSet = await expect(
    `POST /api/sets/${setSlugNew}/duplicate`,
    admin.post(`/api/sets/${setSlugNew}/duplicate`),
    [200, 201],
  );
  const dupSetSlug = data(dupSet)?.slug ?? null;

  // customers CRUD
  const newCustPhone = `0998${String(TS).slice(-7)}`;
  const createdCustomer = await expect(
    "POST /api/customers (admin)",
    admin.post("/api/customers", {
      name: "مشتری تست",
      phone: newCustPhone,
      email: `cust-${TS}@nextlevel.test`,
      city: "شیراز",
      province: "فارس",
      joinedAt: "1404/01/01",
      orders: 0,
      totalSpent: 0,
      lastOrderAt: "",
    }),
    [200, 201],
  );
  const newCustomerId = data(createdCustomer)?.id ?? null;
  if (newCustomerId) {
    await expect(`GET  /api/customers/${newCustomerId}`, admin.get(`/api/customers/${newCustomerId}`), 200);
    await expect(
      `PATCH /api/customers/${newCustomerId}`,
      admin.patch(`/api/customers/${newCustomerId}`, { city: "اصفهان" }),
      200,
    );
    await expect(
      `POST /api/customers/${newCustomerId}/recalculate`,
      admin.post(`/api/customers/${newCustomerId}/recalculate`),
      200,
    );
  }

  // coupons create
  const couponCode = `SMOKE${String(TS).slice(-6)}`;
  await expect(
    "POST /api/coupons (admin)",
    admin.post("/api/coupons", { code: couponCode, label: "تست", rate: 0.1, minSubtotal: 0, freeShipping: false }),
    [200, 201],
  );

  // settings PUT + DELETE(reset)
  await expect(
    "PUT  /api/settings (admin)",
    admin.put("/api/settings", { name: "اسموک تست", freeShipping: 7_000_000, taxRate: 9 }),
    200,
  );
  await expect("DELETE /api/settings (admin, reset)", admin.del("/api/settings"), 200);

  // newsletter + contact writes
  const nlEmail = `nl-${TS}@nextlevel.test`;
  await expect("POST /api/newsletter", guest.post("/api/newsletter", { email: nlEmail }), [200, 201]);
  await expect(
    "POST /api/contact",
    guest.post("/api/contact", {
      name: "اسموک تست",
      email: nlEmail,
      phone: "09120000000",
      subject: "other",
      message: "پیام تست خودکار.",
    }),
    [200, 201],
  );

  /* ------------------------------------------------------------ guards */

  const fresh = new Session("anon");
  await expect("GUARD GET  /api/wishlist", fresh.get("/api/wishlist"), 401);
  await expect("GUARD GET  /api/admin/metrics", fresh.get("/api/admin/metrics"), 401);
  await expect("GUARD GET  /api/account/profile", fresh.get("/api/account/profile"), 401);
  await expect("GUARD GET  /api/customers", fresh.get("/api/customers"), 401);
  await expect("GUARD GET  /api/coupons", fresh.get("/api/coupons"), 401);
  await expect("GUARD PUT  /api/settings", fresh.put("/api/settings", { name: "hacked" }), 401);
  await expect("GUARD POST /api/products", fresh.post("/api/products", {}), 401);
  await expect("GUARD GET  /api/contact", fresh.get("/api/contact"), 401);

  /* ----------------------------------------------------------- cleanup */

  console.log("\n--- cleanup ---");
  const cleanups = [
    ["DELETE /api/addresses", addressId && shopper.del(`/api/addresses/${addressId}`)],
    ["DELETE /api/reviews", reviewId && admin.del(`/api/reviews/${reviewId}`)],
    ["DELETE dup product", dupProductId && admin.del(`/api/products/${dupProductId}`)],
    ["DELETE product", newProductId && admin.del(`/api/products/${newProductId}`)],
    ["DELETE dup set", dupSetSlug && admin.del(`/api/sets/${dupSetSlug}`)],
    ["DELETE set", admin.del(`/api/sets/${setSlugNew}`)],
    ["DELETE customer", newCustomerId && admin.del(`/api/customers/${newCustomerId}`)],
    ["DELETE order", orderCode && admin.del(`/api/orders/${orderCode}`)],
  ];
  for (const [label, p] of cleanups) {
    if (!p) continue;
    const { status } = await p;
    console.log(`  ${status < 400 ? "ok  " : "!!  "}${label} (${status})`);
  }

  await expect("POST /api/auth/logout (shopper)", shopper.post("/api/auth/logout"), 200);

  /* ------------------------------------------------------------ report */

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  if (fail) console.log("failed checks:\n  - " + failures.join("\n  - "));
  process.exit(fail ? 1 : 0);
}

main().catch((error) => {
  console.error("\nsmoke test crashed:", error);
  process.exit(1);
});
