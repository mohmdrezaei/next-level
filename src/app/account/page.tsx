import Link from "next/link";
import { ArrowLeft, Heart, Package, ShieldAlert, ShoppingBag, Sparkles, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/controls";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { OrderCard } from "@/features/account/components/order-card";
import { requireUser } from "@/features/auth/server/session";
import { isActiveOrder } from "@/features/orders/lib/status";
import { getProductById } from "@/features/products/lib/live-selectors";
import { listOrdersForUser } from "@/server/repositories/orders";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import { formatCompactPrice, formatNumber, toPersianDigits } from "@/lib/format";
import { ADMIN_CREDENTIALS } from "@/lib/constants";

export const metadata = { title: "داشبورد" };

export default async function AccountDashboardPage({ searchParams }: PageProps<"/account">) {
  const params = await searchParams;
  const deniedAdmin = params.denied === "admin";
  const user = await requireUser();
  const orders = await listOrdersForUser(user.id);
  const active = orders.filter((order) => isActiveOrder(order.status));
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const itemsPurchased = orders.reduce(
    (sum, order) => sum + order.items.reduce((inner, item) => inner + item.quantity, 0),
    0,
  );
  const points = Math.round(totalSpent / 1_000_000) * 10;
  const latest = orders[0];

  const latestProduct = latest ? await getProductById(latest.items[0]?.productId ?? "") : null;

  const stats = [
    { label: "تعداد سفارش‌ها", value: toPersianDigits(orders.length), hint: "از ابتدای عضویت", icon: Package },
    { label: "سفارش‌های در جریان", value: toPersianDigits(active.length), hint: "در حال آماده‌سازی یا ارسال", icon: ShoppingBag },
    { label: "مجموع خرید", value: `${formatCompactPrice(totalSpent)} تومان`, hint: "مجموع سفارش‌های تأییدشده", icon: Wallet },
    { label: "امتیاز باشگاه", value: formatNumber(points), hint: "قابل استفاده در خرید بعدی", icon: Sparkles },
  ];

  return (
    <div className="flex flex-col gap-9">
      {deniedAdmin ? (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 text-xs font-medium text-warning">
              <ShieldAlert className="size-4" />
              دسترسی به پنل مدیریت ممکن نیست
            </span>
            <p className="text-[0.7rem] leading-6 text-smoke">
              شما با حساب مشتری وارد شده‌اید. پنل مدیریت فقط با ایمیل مدیر
              {" "}
              <span dir="ltr" className="rounded border border-line px-1.5 py-0.5">
                {ADMIN_CREDENTIALS.email}
              </span>{" "}
              و رمز{" "}
              <span dir="ltr" className="rounded border border-line px-1.5 py-0.5">
                {ADMIN_CREDENTIALS.password}
              </span>{" "}
              باز می‌شود.
            </p>
          </div>
          <Button asChild variant="gold" size="md" className="shrink-0">
            <Link href="/login?next=%2Fadmin">ورود با حساب مدیر</Link>
          </Button>
        </div>
      ) : null}

      {/* Greeting */}
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-2xl border border-gold/20 p-6 sm:p-8">
          <span
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(169,113,59,0.16),rgba(11,11,13,0.4)_45%,rgba(200,162,76,0.14))]"
          />
          <span aria-hidden className="grain-layer absolute inset-0 -z-10 opacity-[0.15]" />

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2.5">
              <span className="text-[0.66rem] tracking-[0.24em] text-gold/85">خوش آمدید</span>
              <h1 className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
                {user.name}
              </h1>
              <p className="max-w-lg text-xs leading-7 text-smoke">
                از این پنل می‌توانید سفارش‌ها را پیگیری کنید، نشانی‌ها را مدیریت کنید و قطعات
                مورد علاقه‌تان را ذخیره کنید.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="gold" size="md">
                <Link href="/shop">
                  ادامه خرید
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="md">
                <Link href="/account/wishlist">
                  <Heart className="size-4" />
                  علاقه‌مندی‌ها
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Stats */}
      <StaggerGroup className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <Card className="flex h-full items-start gap-4 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-elevated text-gold">
                <stat.icon className="size-[18px]" strokeWidth={1.7} />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[0.68rem] tracking-wide text-mute">{stat.label}</span>
                <span className="tnum text-base font-semibold text-ivory">{stat.value}</span>
                <span className="text-[0.62rem] leading-5 text-mute">{stat.hint}</span>
              </span>
            </Card>
          </StaggerItem>
        ))}
      </StaggerGroup>

      {/* Latest order + club */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-5">
          <SectionHeading
            eyebrow="آخرین سفارش"
            title="آخرین خرید شما"
            action={{ label: "همه سفارش‌ها", href: "/account/orders" }}
          />
          {latest ? (
            <OrderCard order={latest} />
          ) : (
            <Card className="p-8 text-center text-xs text-mute">
              هنوز سفارشی ثبت نکرده‌اید.
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>باشگاه مشتریان Next Level</CardTitle>
              <CardDescription>با هر خرید امتیاز جمع کنید</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-smoke">سطح فعلی</span>
                <Badge tone="gold">{totalSpent > 60_000_000 ? "طلایی" : totalSpent > 25_000_000 ? "نقره‌ای" : "برنز"}</Badge>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[0.68rem]">
                  <span className="text-mute">پیشرفت تا سطح بعدی</span>
                  <span className="tnum text-gold-soft">
                    {toPersianDigits(Math.min(100, Math.round((totalSpent / 60_000_000) * 100)))}٪
                  </span>
                </div>
                <Progress value={Math.min(100, (totalSpent / 60_000_000) * 100)} />
              </div>

              <dl className="grid grid-cols-2 gap-4 border-t border-line pt-4 text-xs">
                <div className="flex flex-col gap-1">
                  <dt className="text-mute">کالاهای خریداری‌شده</dt>
                  <dd className="tnum text-ivory">{formatNumber(itemsPurchased)}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-mute">امتیاز قابل استفاده</dt>
                  <dd className="tnum text-ivory">{formatNumber(points)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {latestProduct ? (
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle>پیشنهاد تکمیلی</CardTitle>
                <CardDescription>مکمل آخرین خرید شما</CardDescription>
              </CardHeader>

              <CardContent className="flex items-center gap-4">
                <Link
                  href={`/shop/${latestProduct.slug}`}
                  className="size-20 shrink-0 overflow-hidden rounded-lg border border-line bg-carbon"
                >
                  <img
                    src={latestProduct.images[0]?.src}
                    alt=""
                    loading="lazy"
                    className={cn(
                      "size-full object-cover",
                      mediaClassFor(latestProduct.images[0]?.src),
                    )}
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Link
                    href={`/shop/${latestProduct.slug}`}
                    className="truncate text-xs text-ivory transition-colors duration-300 hover:text-gold-soft"
                  >
                    {latestProduct.name}
                  </Link>
                  <span className="tnum text-[0.68rem] text-mute">
                    {formatNumber(latestProduct.price)} تومان
                  </span>
                  <Button asChild variant="outline" size="sm" className="mt-1 w-fit">
                    <Link href={`/shop/${latestProduct.slug}`}>مشاهده محصول</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
