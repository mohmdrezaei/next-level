# راهنمای امنیت بک‌اند — Next Level Atelier

این سند تمام کنترل‌های امنیتی پیاده‌شده در سمت سرور این پروژه را مستند می‌کند
(Next.js 16 App Router + Drizzle ORM + PostgreSQL). ساختار آن از سند مرجع
«شهر کفش» گرفته شده، اما محتوا بر اساس **معماری واقعی همین پروژه** نوشته شده
است؛ هرجا معماری متفاوت بوده، دلیل تفاوت توضیح داده شده.

> اصل حاکم بر همه‌ی لایه‌ها: **هیچ‌چیز از سمت کلاینت قابل اعتماد نیست.**
> قیمت، هویت، مالکیت، نقش و وضعیت سفارش، همه سمت سرور بازمحاسبه/بررسی می‌شوند.

---

## فهرست

1. [مرور کلی معماری امنیتی](#۱-مرور-کلی)
2. [تفاوت‌های کلیدی با سند مرجع](#۲-تفاوتهای-کلیدی)
3. [احراز هویت و نشست](#۳-احراز-هویت-و-نشست)
4. [کوکی و مدیریت نشست](#۴-کوکی-و-مدیریت-نشست)
5. [نگهبان‌های دسترسی و نقش‌ها](#۵-نگهبانهای-دسترسی-و-نقشها)
6. [جلوگیری از IDOR](#۶-جلوگیری-از-idor)
7. [اعتبارسنجی ورودی](#۷-اعتبارسنجی-ورودی)
8. [پاک‌سازی و XSS](#۸-پاکسازی-و-xss)
9. [Rate Limiting](#۹-rate-limiting)
10. [قفل حساب (Lockout)](#۱۰-قفل-حساب)
11. [محدودیت حجم بدنه](#۱۱-محدودیت-حجم-بدنه)
12. [CSRF](#۱۲-csrf)
13. [هدرهای امنیتی HTTP](#۱۳-هدرهای-امنیتی)
14. [امنیت منطق سفارش و قیمت](#۱۴-امنیت-منطق-سفارش)
15. [جلوگیری از SQL Injection](#۱۵-sql-injection)
16. [Open Redirect](#۱۶-open-redirect)
17. [مدیریت اسرار](#۱۷-مدیریت-اسرار)
18. [بهداشت لاگ‌ها](#۱۸-بهداشت-لاگها)
19. [چک‌لیست](#۱۹-چکلیست)
20. [شکاف‌های باقی‌مانده](#۲۰-شکافهای-باقیمانده)

---

## ۱. مرور کلی

| لایه | کنترل امنیتی | فایل مرجع |
|---|---|---|
| Edge (Proxy) | Rate Limiting + محدودیت حجم بدنه + بررسی Origin (CSRF) | `src/proxy.ts`، `src/lib/rate-limit.ts`، `src/lib/csrf.ts` |
| شبکه | هدرهای امنیتی + CSP + HSTS | `next.config.ts` |
| احراز هویت | رمز عبور (scrypt) + توکن نشست تصادفی + قفل حساب | `src/server/auth/*`، `src/server/repositories/users.ts` |
| دسترسی | `requireApiUser` / `requireApiAdmin` / `resolveCustomerScope` | `src/server/api-auth.ts` |
| اعتبارسنجی | Schema اعلانی برای همه‌ی بدنه‌ها | `src/server/validate.ts` |
| پاک‌سازی | حذف HTML + Escape + رندر امن متن غنی | `src/lib/sanitize.ts` |
| منطق تجاری | محاسبه‌ی قیمت فقط سمت سرور | `src/server/repositories/orders.ts` |
| داده | کوئری پارامتری با Drizzle + Escape الگوهای LIKE | `src/server/repositories/*`، `src/server/sql.ts` |
| لاگ | ماسک توکن/ایمیل/تلفن | `src/lib/redact.ts` |

---

## ۲. تفاوت‌های کلیدی با سند مرجع

سند مرجع بر پایه‌ی «ورود با OTP + JWT دست‌ساز + درگاه پرداخت ایران‌کیش +
آپلود تصویر با ImageKit» نوشته شده بود. این پروژه معماری متفاوتی دارد و
به‌جای کپی کورکورانه، **معادل امن** هر مورد پیاده شده است:

| موضوع در سند مرجع | وضعیت در این پروژه | دلیل / معادل |
|---|---|---|
| OTP + جدول `otps` | **وجود ندارد** | ورود با ایمیل/موبایل + رمز عبور است؛ رمز با `scrypt` هش می‌شود |
| JWT دست‌ساز (HMAC-SHA256) | **جایگزین شد** | نشست **Stateful** با توکن تصادفی ۳۲ بایتی در جدول `sessions` |
| Refresh Token + Rotation | **جایگزین شد** | چون نشست در دیتابیس است، ابطال (Revocation) واقعی ممکن است |
| درگاه پرداخت (IranKish) | **وجود ندارد** | این پروژه درگاه پرداخت ندارد؛ وضعیت سفارش فقط `pending` ثبت می‌شود |
| آپلود فایل (ImageKit + sharp) | **وجود ندارد** | endpoint آپلودی وجود ندارد؛ تصاویر از Unsplash یا `/public` می‌آیند |
| مسیر `/media/[name]` (Path Traversal) | **موجود نیست** | هیچ مسیری فایل کاربرمحور را از دیسک نمی‌خواند |
| Zod | **معادل بدون وابستگی** | `src/server/validate.ts` — همان قابلیت‌ها، بدون افزودن پکیج |
| CSP با `unsafe-inline` | **پیاده شد** | با همان محدودیت، و توصیه‌ی Nonce در بخش ۲۰ |

چرا JWT پیاده نشد؟ چون توکن تصادفی + جدول نشست، **قوی‌تر** است: ابطال فوری
(مثلاً بعد از تغییر رمز) در JWT بدون deny-list ممکن نیست. جدول `sessions`
دقیقاً همان deny-list را به‌صورت ذاتی دارد.

---

## ۳. احراز هویت و نشست

**محل:** `src/server/auth/session.ts`، `src/server/auth/password.ts`،
`src/server/auth/throttle.ts`

```ts
// توکن تصادفی ۳۲ بایتی (CSPRNG) — قابل حدس زدن نیست
const token = randomBytes(32).toString("base64url");
await db.insert(sessions).values({ token, userId, expiresAt });
```

**قواعد پیاده‌شده:**

- **هش رمز با `scrypt`** (Node `crypto.scrypt`، ۶۴ بایت کلید، نمک ۱۶ بایتی
  تصادفی) و مقایسه‌ی زمان‌ثابت با `timingSafeEqual`.
- **توکن نشست تصادفی** با `crypto.randomBytes` (نه `Math.random`) — چون فقط
  تصادفی است، forgeable نیست.
- **انقضا** در هر خواندن با `gt(sessions.expiresAt, new Date())` بررسی می‌شود.
- **پاک‌سازی نشست‌های منقضی** هنگام هر ورود (`purgeExpiredSessions`).
- **ابطال کامل پس از تغییر رمز:** `changePassword()` همه‌ی نشست‌های کاربر را
  حذف می‌کند (`revokeSessionsForUser`) و سپس برای همان دستگاه یک نشست تازه
  صادر می‌شود (`createSessionForUser` در روت). یعنی توکنی که پیش از تغییر رمز
  دزدیده شده، از همان لحظه بی‌اعتبار می‌شود.
- **Fail-fast دیتابیس:** ماژول `src/db/index.ts` در نبود `DATABASE_URL` خطا
  می‌دهد.
- **حداقل طول رمز:** ۶ کاراکتر (سمت سرور، در `createUser` / `changePassword` /
  `registerAction`).

> ⚠️ **توصیه:** سیاست رمز می‌تواند سخت‌گیرانه‌تر شود (حداقل ۸ کاراکتر + بررسی
> رمزهای لو‌رفته). همچنین `scrypt` را می‌توان به `argon2id` ارتقا داد.

---

## ۴. کوکی و مدیریت نشست

**محل:** `src/server/auth/session.ts`

```ts
function sessionCookieOptions() {
  return {
    httpOnly: true,                                  // JS و XSS به آن دسترسی ندارد
    sameSite: "lax",                                 // لایه‌ی اول دفاع در برابر CSRF
    path: "/",
    maxAge: 30 * 24 * 60 * 60,                       // ۳۰ روز
    secure: process.env.NODE_ENV === "production",   // فقط روی HTTPS
    priority: "high",
  };
}
```

- `httpOnly` → دزدیدن توکن با XSS ممکن نیست.
- `sameSite: "lax"` → کوکی روی درخواست‌های cross-site ارسال نمی‌شود.
- `secure` در production → کوکی هرگز روی HTTP خام نمی‌رود.
- در خروج (`destroySession`) هم ردیف نشست از دیتابیس حذف می‌شود و هم کوکی.

> ⚠️ **توصیه:** روی استقرار HTTPS-only می‌توان نام کوکی را به پیشوند `__Host-`
> ارتقا داد (`__Host-nextlevel.session`) که تضمین سخت‌گیرانه‌ی Secure + بدون
> Domain + مسیر `/` می‌دهد. این کار نیازمند تغییر همزمان `COOKIE_KEYS.session`
> و خواندن آن در Proxy است.

---

## ۵. نگهبان‌های دسترسی و نقش‌ها

**محل:** `src/server/api-auth.ts`

```ts
export async function requireApiUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireApiAdmin(): Promise<SessionUser> {
  const user = await requireApiUser();
  if (user.role !== "admin") throw forbidden();
  return user;
}
```

**الگوی استفاده در هر Route:**

```ts
export async function GET() {
  return withApi(async () => {
    await requireApiAdmin();     // ← ابتدای هندلر، قبل از هر کار دیگری
    return ok(await dashboard());
  });
}
```

**پوشش بررسی‌شده:**

- تمام مسیرهای `/api/admin/*`، `/api/products` (نوشتن)، `/api/sets` (نوشتن)،
  `/api/categories` (نوشتن)، `/api/customers` (نوشتن)، `/api/coupons`،
  `/api/settings` (نوشتن)، `/api/reviews/:id` (حذف)، `/api/orders/:code` (حذف و
  تغییر وضعیت) با `requireApiAdmin` محافظت شده‌اند.
- `/api/account/*`، `/api/addresses/*`، `/api/wishlist`، `/api/orders`
  (خواندن) با `requireApiUser` محافظت شده‌اند.
- Server Actionهای ادمین (`src/features/admin/actions.ts`) همه از `guard()`
  عبور می‌کنند که اول `requireAdmin()` را صدا می‌زند.
- **نقش پیش‌فرض `customer` است** و ارتقا به `admin` فقط با seed/دیتابیس انجام
  می‌شود. `POST /api/auth/register` نقش را در سرور روی `customer` پین می‌کند و
  مقدار `role` ارسالی از کلاینت را نادیده می‌گیرد.

> ✅ قاعده: هیچ endpoint مدیریتی‌ای نباید بدون `requireApiAdmin` در ابتدای
> هندلر باقی بماند.

---

## ۶. جلوگیری از IDOR

**هدف:** کاربر نتواند به منابع دیگران (آدرس، سفارش، پروفایل) دسترسی پیدا کند.

**محل:** `src/server/repositories/addresses.ts`، `src/server/api-auth.ts`

قاعده‌ی سند مرجع — «شرط مالکیت داخل `WHERE`، نه بررسی جداگانه بعد از واکشی» —
پیاده شد:

```ts
/** شرط مالکیت: هم در خواندن و هم در نوشتن داخل WHERE قرار می‌گیرد. */
function ownershipCondition(id: string, scopeCustomerId?: string | null) {
  return scopeCustomerId
    ? and(eq(addresses.id, id), eq(addresses.customerId, scopeCustomerId))
    : eq(addresses.id, id);
}
```

و در روت:

```ts
const scope = await resolveCustomerScope();   // admin → null ، مشتری → شناسه‌ی خودش
const existing = await getAddress(id, scope);
if (!existing) throw notFound("نشانی مورد نظر یافت نشد.");
```

نکات:

- پاسخ در نبود مالکیت **`404`** است (نه `403`)، تا وجود/عدم‌وجود منبع لو نرود.
- `UPDATE` هم دوباره با همان شرط مالکیت اجرا می‌شود، پس حتی یک race بین خواندن
  و نوشتن هم نمی‌تواند ردیف دیگری را تغییر دهد.
- `resolveCustomerScope()` برای کارکنان `null` (بدون محدودیت) و برای مشتری
  شناسه‌ی دفتر کل خودش را برمی‌گرداند.
- در `/api/orders` (خواندن)، مشتری فقط سفارش‌های `customerId` خودش را می‌بیند
  و در نبود مشتری متناظر، شرط `"__none__"` می‌شود.
- در `/api/orders/:code`، سفارش فقط وقتی برگردانده می‌شود که
  `order.customerId === customerId` کاربر باشد.

---

## ۷. اعتبارسنجی ورودی

**هدف:** اعتبارسنجی و محدودسازی تمام بدنه‌ها پیش از رسیدن به دیتابیس.

**محل:** `src/server/validate.ts`

پروژه عمداً از کتابخانه‌ی اعتبارسنجی استفاده نمی‌کند (فلسفه‌ی «بدون وابستگی
اضافی» که در هش رمز و تولید شناسه هم دیده می‌شود). به‌جای آن یک لایه‌ی اعلانی
نوشته شده که همان تضمین‌ها را می‌دهد:

```ts
const body = await parseBody(request, {
  name: str({ label: "نام", min: 3, max: 80 }),        // سقف طول + حذف HTML
  email: email(),                                       // نرمال‌سازی + Regex
  phone: phoneOptional(),                               // → 09xxxxxxxxx
  subject: strOptional({ label: "موضوع", max: 120 }),
  message: str({ label: "متن پیام", min: 10, max: 5000 }),
});
```

**اصول پیاده‌شده:**

- **حداکثر طول برای همه‌ی رشته‌ها** (پیش‌فرض ۱۰۰۰، در هر فیلد صریح).
- **حداقل/حداکثر عددی** (`quantity` بین ۱ و ۵۰، `rating` بین ۱ و ۵، `limit`
  سقف ۱۰۰ در `readPagination`).
- **اعتبارسنجی قالب** (ایمیل، موبایل، نامک، کد پستی ۱۰ رقمی، تاریخ تولد
  `YYYY/MM/DD`).
- **نرمال‌سازی ورودی**: ارقام فارسی/عربی → ASCII (`toLatinDigits`)،
  موبایل → `09xxxxxxxxx` (`cleanPhone`)، ایمیل → lowercase.
- **پاسخ ۴۰۰ با پیام دقیق و نقشه‌ی فیلد**:
  `{ error, meta: { details: { field, fields } } }` — بدون افشای جزئیات داخلی.
- **همه‌ی رشته‌ها پیش از اعتبارسنجی از `sanitizeString` عبور می‌کنند** (حذف
  تگ + برش طول).
- فیلدهای رمز با `sanitize: false, trim: false` اعتبارسنجی می‌شوند تا مقدار
  رمز دست‌نخورده بماند.

**روت‌های پوشش‌داده‌شده:** `auth/login`، `auth/register`، `account/password`،
`account/profile`، `contact`، `newsletter`، `coupons/validate`، `cart/price`،
`orders` (POST)، `reviews` (POST)، `products/[idOrSlug]/reviews` (POST)،
`wishlist` (POST)، `addresses/[id]` (PATCH)، `customers/[id]/addresses` (POST).

> اگر تیم ترجیح می‌دهد از Zod استفاده کند، کافی است `parseBody()` با یک
> wrapper روی `schema.safeParse()` جایگزین شود؛ هیچ call site دیگری تغییر
> نمی‌کند. (`zod@4.6.5` از قبل در store پروژه موجود است.)

---

## ۸. پاک‌سازی و XSS

**محل:** `src/lib/sanitize.ts`

```ts
export function sanitizeString(input: unknown, maxLength = 1000): string {
  const cleaned = stripHtml(String(input ?? ""))
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");
  return cleaned.slice(0, Math.max(0, maxLength)).trim();
}
```

**اصول:**

- **هیچ‌جا `dangerouslySetInnerHTML` استفاده نمی‌شود** (بررسی شد). یعنی React
  به‌صورت خودکار همه‌چیز را Escape می‌کند و XSS بازتابی/ذخیره‌شده عملاً بسته است.
- با این حال، `sanitizeString` روی **همه‌ی رشته‌های ورودی** اعمال می‌شود تا
  محتوای مخرب هرگز در دیتابیس ذخیره نشود (دفاع در عمق برای ادمین‌پنل، خروجی
  CSV، ایمیل و هر سطح آینده‌ای که HTML خام رندر کند).
- **اعتبارسنجی رنگ**: `hex` فقط با `/^#[0-9a-fA-F]{3,8}$/` پذیرفته می‌شود، چون
  در `style` درون‌خطی تزریق می‌شود. همین قاعده برای `accent` ست‌ها.
- **اعتبارسنجی آدرس تصویر**: `safeUrl()` فقط `http(s)` و مسیرهای نسبی داخلی را
  می‌پذیرد و `javascript:` / `data:` / `//evil.com` را رد می‌کند.
- **رندر متن غنی** (`renderRichText`): رویکرد «**ابتدا Escape، سپس فقط تگ‌های
  مجاز**» — کل متن Escape می‌شود و بعد فقط مارکرهای محدود (`**bold**`، لیست،
  هدر، نقل‌قول) به تگ‌های ثابت تبدیل می‌شوند. لینک فقط با پروتکل `http(s)` و
  با `rel="noopener noreferrer nofollow"`.

**فایل‌های پوشش‌داده‌شده:** `products`، `addresses`، `customers`، `reviews`،
`messaging`، `categories`، `sets`، `coupons`، `users` (پروفایل).

---

## ۹. Rate Limiting

**هدف:** مقابله با Brute-force، Spam و سوءاستفاده از منابع.

**محل:** `src/lib/rate-limit.ts` + `src/proxy.ts`

**جدول محدودیت‌ها (پنجره‌ی ثابت ۱ دقیقه‌ای):**

| الگوی مسیر | سقف |
|---|---|
| `/api/auth/login` | ۵ |
| `/api/auth/register` | ۵ |
| `/api/auth/me` | ۱۲۰ |
| `/api/auth/*` | ۳۰ |
| `/api/account/password` | ۵ |
| `/api/account/*` | ۶۰ |
| `/api/contact` | ۵ |
| `/api/newsletter` | ۵ |
| `/api/coupons/validate` | ۲۰ |
| `/api/reviews*` | ۱۰ |
| `/api/cart/price` | ۶۰ |
| `/api/orders` | ۲۰ |
| `/api/addresses/*` | ۳۰ |
| `/api/wishlist` | ۶۰ |
| `/api/search` | ۶۰ |
| `/api/admin/*` | ۱۲۰ |
| `/api/*` (پیش‌فرض) | ۱۲۰ |

**کد هسته (پنجره‌ی ثابت):**

```ts
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  if (store.entries.size > MAX_ENTRIES) cleanup(store, now);   // جلوگیری از رشد حافظه
  const entry = store.entries.get(key);
  if (!entry || entry.resetAt <= now) {
    store.entries.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, resetMs: windowMs };
  }
  entry.count += 1;
  if (entry.count > limit) return { success: false, limit, remaining: 0, resetMs: entry.resetAt - now };
  return { success: true, limit, remaining: limit - entry.count, resetMs: entry.resetAt - now };
}
```

کلید = `${clientIp}:${scope}` و IP از `x-forwarded-for` / `x-real-ip` /
`cf-connecting-ip` استخراج می‌شود. پاسخ ۴۲۹ همراه هدرهای `Retry-After`،
`X-RateLimit-Limit`، `X-RateLimit-Remaining` و `X-RateLimit-Reset`.

> ⚠️ **محدودیت مهم:** این شمارنده‌ها در حافظه‌ی همان پروسه هستند. در استقرار
> چند‌نمونه‌ای (multi-instance)، سقف مؤثر = `limit × تعداد نمونه`. برای مقیاس
> افقی باید `rateLimit()` با نسخه‌ی Redis/Upstash جایگزین شود؛ امضای تابع عمداً
> کوچک نگه داشته شده تا فقط همین یک فایل تغییر کند.

---

## ۱۰. قفل حساب

**محل:** `src/server/auth/throttle.ts`

Rate Limiter بر اساس **IP** کار می‌کند و مهاجم توزیع‌شده آن را دور می‌زند. این
لایه بر اساس **شناسه‌ی حساب** کار می‌کند:

- سیاست: پس از **۵ تلاش ناموفق** در پنجره‌ی ۱۵ دقیقه، حساب **۱۵ دقیقه** قفل
  می‌شود.
- ورود موفق شمارنده را صفر می‌کند.
- کلید نرمال‌سازی‌شده است (`Ali@X.com` و `ali@x.com` یک سبد مشترک دارند).

پیاده‌سازی در **هر دو مسیر ورود** اعمال شده: روت `POST /api/auth/login` و
Server Action `loginAction`.

> ⚠️ **محدودیت:** این هم در حافظه‌ی پروسه است؛ برای چند‌نمونه‌ای باید به Redis
> یا جدول `login_attempts` منتقل شود.

---

## ۱۱. محدودیت حجم بدنه

**محل:** `src/proxy.ts` + `src/server/http.ts`

```ts
const maxBodyBytes = rule.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;   // ۶ مگابایت
const contentLength = Number(request.headers.get("content-length") ?? "0");
if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
  return jsonError(413, "حجم درخواست بیش از حد مجاز است.", limitHeaders);
}
```

- سقف سراسری **۶ مگابایت**، روی همه‌ی مسیرهای `/api/*`.
- **دفاع دوم در هندلر:** `readJson()` هم `content-length` و هم طول متن خوانده‌شده
  را بررسی می‌کند، تا درخواست‌های chunked (بدون `content-length`) هم محدود بمانند.
- `CATALOGUE_MAX_BODY_BYTES` (۱۲ مگابایت) برای نوشتن‌های حجیم کاتالوگ رزرو شده
  است و می‌تواند روی روت‌های محصول/ست فعال شود.

---

## ۱۲. CSRF

**محل:** `src/lib/csrf.ts` + `src/proxy.ts`

دو لایه‌ی مستقل:

1. **`SameSite=Lax`** روی کوکی نشست — مرورگر کوکی را روی POST بین‌سایتی نمی‌فرستد.
2. **بررسی Origin** در Proxy برای همه‌ی متدهای تغییردهنده (`POST`, `PUT`,
   `PATCH`, `DELETE`):

```ts
export function isSameOriginRequest(method: string, headers: Headers): boolean {
  if (!MUTATING_METHODS.has(method.toUpperCase())) return true;
  const origin = headers.get("origin");
  if (!origin) return true;                       // کلاینت غیرمرورگری: بردار CSRF نیست
  const parsed = new URL(origin);
  if (parsed.origin === "null") return false;     // iframe سندباکس‌شده
  const host = headers.get("host");
  if (host && parsed.host === host) return true;
  const forwardedHost = headers.get("x-forwarded-host");
  if (forwardedHost && parsed.host === forwardedHost.split(",")[0]?.trim()) return true;
  return trustedOrigins().includes(parsed.origin); // allowlist از TRUSTED_ORIGINS
}
```

- Origin **غایب** مجاز است: کلاینت‌های غیرمرورگری (curl، cron، اپ موبایل) آن را
  نمی‌فرستند و بردار CSRF نیستند (CSRF نیازمند مرورگری است که خودکار کوکی
  می‌فرستد).
- Origin **موجود** باید با `Host` (یا `X-Forwarded-Host`) یکی باشد، وگرنه `403`.
- استقرار پشت پروکسی که `Host` را بازنویسی می‌کند، می‌تواند دامنه‌های مجاز را در
  `TRUSTED_ORIGINS` تعریف کند.

> ⚠️ **توصیه:** برای عملیات بسیار حساس (تغییر رمز، حذف حساب) می‌توان
> `SameSite=strict` یا CSRF Token دوگانه‌ی کوکی اضافه کرد.

---

## ۱۳. هدرهای امنیتی

**محل:** `next.config.ts`

```ts
const baseSecurityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const productionSecurityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
];
```

**کارکرد هر هدر:**

- `X-Frame-Options: DENY` + `frame-ancestors 'none'` → ضد Clickjacking.
- `X-Content-Type-Options: nosniff` → ضد MIME Sniffing.
- `Referrer-Policy` → کنترل نشت آدرس در Referer.
- `Permissions-Policy` → غیرفعال‌سازی دوربین/میکروفون/موقعیت/پرداخت.
- `Cross-Origin-Opener-Policy` → جداسازی پنجره‌ی مرور (ضد XS-Leaks).
- `HSTS` → اجبار HTTPS (فقط production).
- `CSP` → محدودسازی منابع مجاز، `object-src 'none'`، `frame-src 'none'`.
- `poweredByHeader: false` → عدم افشای نسخه‌ی Next.js.

هدرها روی `/:path*` (همه‌ی مسیرها) اعمال می‌شوند. CSP و HSTS فقط در production
اضافه می‌شوند تا توسعه‌ی محلی روی HTTP نشکند.

> ⚠️ **توصیه:** CSP فعلی برای اسکریپت `'unsafe-inline'` و `'unsafe-eval'` را
> مجاز می‌کند (نیاز Next.js و Radix). برای سخت‌گیرانه‌تر کردن باید به
> **Nonce/Hash** مهاجرت کرد.

---

## ۱۴. امنیت منطق سفارش

**محل:** `src/server/repositories/orders.ts`، `src/app/api/orders/route.ts`،
`src/app/api/cart/price/route.ts`

سه آسیب‌پذیری واقعی در این بخش بسته شد:

### الف) قیمت فقط سمت سرور

```ts
// The prices and the total are computed here from the database — never taken
// from the browser — so a tampered request cannot change what is charged.
const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
```

کلاینت فقط می‌گوید «چه می‌خواهد بخرد»، نه «چند باید بپردازد». `priceCart()` همه‌ی
قیمت‌ها، تخفیف، ارسال و مالیات را از دیتابیس بازمحاسبه می‌کند.

### ب) `customerId` از بدنه حذف شد (IDOR)

پیش‌تر روت `POST /api/orders` مقدار `body.customerId` را از کلاینت می‌پذیرفت؛
یعنی یک مهمان می‌توانست سفارش را به دفتر کل **شخص دیگری** بچسباند و آمار خرید او
را دستکاری کند. اکنون:

```ts
// Only a signed-in shopper is linked to a ledger row — and only their own.
const customerId = user && user.role !== "admin" ? await ensureCustomerForUser(user.id) : null;
```

### ج) `status` از کلاینت حذف شد (Privilege Escalation)

پیش‌تر `input.status` از بدنه پذیرفته می‌شد؛ یعنی هر کسی می‌توانست با
`{"status":"delivered"}` یک سفارش پرداخت‌نشده را «تحویل‌شده» ثبت کند. اکنون
وضعیت **همیشه** روی `pending` پین می‌شود و تنها راه تغییر آن،
`PATCH /api/orders/:code/status` با `requireApiAdmin` است.

### د) نشان «خرید تأییدشده» واقعی شد

پیش‌تر هر نظر ثبت‌شده `verified: true` می‌گرفت. اکنون این نشان از دفتر کل سفارش
استخراج می‌شود (`hasPurchasedProduct`) و فقط برای وضعیت‌های
`paid`/`processing`/`shipped`/`delivered` صادر می‌شود.

### ه) نام نویسنده‌ی نظر از نشست گرفته می‌شود

پیش‌تر `body.author` اجازه‌ی override داشت (جعل هویت). اکنون نام نویسنده همیشه
`user.name` است.

---

## ۱۵. SQL Injection

**هدف:** جلوگیری کامل از تزریق SQL.

- تمام کوئری‌ها با **Drizzle ORM** و **کوئری پارامتری** (`eq`, `and`, `inArray`,
  `sql` با Template) نوشته شده‌اند؛ هیچ رشته‌ای به‌صورت دستی به SQL الحاق نمی‌شود.
- در جست‌وجوی `ILIKE`، کاراکترهای ویژه‌ی الگو Escape می‌شوند
  (`src/server/sql.ts`):

```ts
export function escapeLikePattern(input: unknown): string {
  return String(input ?? "").replace(/[\\%_]/g, (char) => `\\${char}`);
}
export function containsPattern(input: unknown): string {
  return `%${escapeLikePattern(input)}%`;
}
```

  بدون این Escape، جست‌وجوی `%` همه‌ی ردیف‌ها را برمی‌گرداند و الگوهایی مثل
  `a%b%c%d%e%f` می‌توانند روی جدول بزرگ پرهزینه شوند.
- ورودی‌های عددی (شناسه‌ها، صفحه‌بندی) با `Number.isInteger(...) && > 0`
  اعتبارسنجی می‌شوند (`readPagination` هم سقف ۱۰۰ دارد).
- در کوئری‌های خام (`sql\`...\``) مقادیر به‌صورت پارامتر (`` ${qty} ``,
  `` ${productId} ``) تزریق می‌شوند، نه با الحاق رشته.
- فایل‌های پوشش‌داده‌شده: `products.ts`، `customers.ts`، `orders.ts`، `sets.ts`.

---

## ۱۶. Open Redirect

**محل:** `src/lib/redirects.ts`

پارامتر `?next=` که مستقیم به `redirect()` داده شود، یک Open Redirect کلاسیک است:
مرورگرها `//evil.com` و `/\evil.com` را URL پروتکل‌نسبی می‌بینند.

```ts
export function safeInternalPath(value: unknown, fallback = "/account"): string {
  const raw = String(value ?? "").trim();
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (CONTROL_CHARS_RE.test(raw)) return fallback;
  const probe = new URL(raw, "http://internal.invalid");
  if (probe.origin !== "http://internal.invalid") return fallback;
  return `${probe.pathname}${probe.search}${probe.hash}`;
}
```

استفاده‌شده در: `loginAction` (Server Action)، صفحه‌ی `/login`.

---

## ۱۷. مدیریت اسرار

**محل:** `.env` + `.gitignore` + `.env.example`

- تمام اسرار در `.env` نگه داشته می‌شوند و **هرگز commit نمی‌شوند**:

```gitignore
# env files (can opt-in for committing if needed)
.env*
# misc
*.pem
```

- کلیدها فقط سمت سرور خوانده می‌شوند (`process.env.*`).
- **هیچ سری‌ای نباید پیشوند `NEXT_PUBLIC_` بگیرد** — این پیشوند مقدار را در
  باندل مرورگر inline می‌کند. تنها مقدار عمومی مجاز
  `NEXT_PUBLIC_SITE_URL` است.
- **Fail-fast:** `src/db/index.ts` در نبود `DATABASE_URL` در همان بارگذاری خطا
  می‌دهد.

| متغیر | کاربرد |
|---|---|
| `DATABASE_URL` | رشته‌ی اتصال دیتابیس (الزامی) |
| `DB_POOL_MAX` | اندازه‌ی استخر اتصال (اختیاری) |
| `DB_DEBUG` | لاگ کوئری‌ها در توسعه (اختیاری) |
| `NEXT_PUBLIC_SITE_URL` | آدرس عمومی سایت (تنها مقدار عمومی) |
| `TRUSTED_ORIGINS` | دامنه‌های مجاز اضافی برای بررسی Origin (اختیاری) |

> ⚠️ **توجه:** این پروژه برخلاف سند مرجع، `JWT_SECRET` ندارد، چون JWT استفاده
> نمی‌کند؛ نشست‌ها توکن تصادفی در دیتابیس هستند و امضایی لازم نیست.

---

## ۱۸. بهداشت لاگ‌ها

**محل:** `src/lib/redact.ts`

```ts
/** A session token is a bearer credential, so only a short prefix is logged. */
export function maskToken(token: unknown): string {
  const value = String(token ?? "");
  if (!value) return "(none)";
  if (value.length <= 8) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 8)}…`;
}
```

**اصول:**

- توکن/رمز هرگز کامل لاگ نمی‌شود (`maskToken`).
- ایمیل و موبایل با `maskEmail` / `maskPhone` ماسک می‌شوند (`al***@gmail.com`،
  `0912***4567`).
- پارامترهای حساس URL (`token`, `code`, `api_key`, `password`, …) با
  `redactUrl` قبل از لاگ حذف می‌شوند.
- بدنه‌ی پاسخ‌های بزرگ/خارجی با `truncatePayload` برش داده می‌شوند.
- `withApi()` خطاها را **ساختارمند و برش‌خورده** لاگ می‌کند و هرگز بدنه‌ی
  درخواست، کوکی یا توکن را وارد لاگ نمی‌کند.
- **کدهای خطای داخلی به کاربر نمایش داده نمی‌شوند**؛ پاسخ ۵۰۰ همیشه
  «خطای داخلی سرور.» است.
- `/api/health` دیگر دلیل خطای دیتابیس را به کلاینت برنمی‌گرداند (پیام درایور
  می‌تواند میزبان، پورت، نام کاربر و حتی رشته‌ی اتصال را لو بدهد)؛ فقط لاگ
  سرور می‌شود.

---

## ۱۹. چک‌لیست

- [x] `proxy.ts` ساخته شد و Rate Limiting + محدودیت حجم بدنه + بررسی Origin روی
      `/api/*` اعمال شد.
- [x] جدول محدودیت‌ها بر اساس حساسیت هر endpoint تنظیم شد.
- [x] نشست امن: توکن تصادفی CSPRNG، بررسی انقضا، ابطال کامل پس از تغییر رمز.
- [x] کوکی با `httpOnly` + `sameSite` + `secure` (در production) + `priority`.
- [x] `requireApiUser` / `requireApiAdmin` و فراخوانی در ابتدای هر هندلر
      محافظت‌شده.
- [x] شرط مالکیت (`customerId = scope`) داخل `WHERE` در همه‌ی کوئری‌های منابع
      کاربر.
- [x] Schema اعتبارسنجی با سقف طول/عدد برای همه‌ی بدنه‌های عمومی و حساب کاربری.
- [x] `sanitizeString` روی همه‌ی رشته‌های ورودی.
- [x] متن غنی «اول Escape، بعد تگ سفیدلیست»؛ لینک فقط `http(s)`.
- [x] هدرهای امنیتی + CSP + HSTS در production؛ `poweredByServer: false`.
- [x] قیمت و جمع فقط از دیتابیس؛ `customerId` و `status` از بدنه حذف شدند.
- [x] Escape الگوهای `ILIKE`؛ همه‌ی کوئری‌ها پارامتری.
- [x] `.env*` و `*.pem` در `.gitignore`؛ fail-fast برای `DATABASE_URL`.
- [x] ماسک توکن/ایمیل/موبایل در لاگ.
- [x] قفل حساب پس از تلاش‌های ناموفق (در حافظه).
- [x] جلوگیری از Open Redirect در `?next=`.

---

## ۲۰. شکاف‌های باقی‌مانده

مواردی که آگاهانه پیاده نشده‌اند یا جای بهبود دارند:

| مورد | وضعیت فعلی | توصیه |
|---|---|---|
| Rate Limiter | در حافظه‌ی پروسه (`Map`) | برای چند‌نمونه‌ای: Redis/Upstash |
| قفل حساب | در حافظه‌ی پروسه | جدول `login_attempts` یا Redis |
| CSP | `unsafe-inline`/`unsafe-eval` برای اسکریپت | Nonce/Hash برای `script-src` |
| سیاست رمز | حداقل ۶ کاراکتر | حداقل ۸ + بررسی رمزهای لو‌رفته |
| هش رمز | `scrypt` | `argon2id` (توصیه‌ی OWASP فعلی) |
| 2FA | وجود ندارد | TOTP برای حساب‌های ادمین |
| CSRF Token | فقط Origin + SameSite | توکن دوگانه برای عملیات بسیار حساس |
| ابطال نشست | حذف کامل پس از تغییر رمز | افزودن «خروج از همه‌ی دستگاه‌ها» در UI |
| پایش امنیتی | فقط لاگ | هشدار روی نرخ ۴۲۹/۴۰۳/۴۰۱ غیرعادی |
| محدودیت اندازه‌ی کوئری | `limit` سقف ۱۰۰ | افزودن سقف برای `q` (طول) |
| TypeScript Build | `ignoreBuildErrors` تنظیم نشده ✅ | فعال بماند |

---

*این سند بر اساس پیاده‌سازی واقعی پروژه‌ی «Next Level Atelier» تهیه شده است.
برای انتقال به پروژه‌ی دیگر، فایل‌های `src/lib/rate-limit.ts`،
`src/lib/csrf.ts`، `src/lib/sanitize.ts`، `src/lib/redact.ts`،
`src/lib/redirects.ts`، `src/server/validate.ts` و `src/server/sql.ts` عملاً
بدون تغییر قابل استفاده‌اند؛ بقیه‌ی موارد باید به ساختار پروژه‌ی مقصد تطبیق
داده شوند.*
