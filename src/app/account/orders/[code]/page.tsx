import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CreditCard,
  Download,
  MapPin,
  Package,
  RotateCcw,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/features/admin/components/status-badge";
import { OrderTimeline } from "@/features/account/components/order-timeline";
import { requireUser } from "@/features/auth/server/session";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import { getOrderByCode } from "@/server/repositories/orders";
import { isActiveOrder } from "@/features/orders/lib/status";
import { PAYMENT_METHODS, SHIPPING_METHODS } from "@/lib/constants";
import { formatDateTime, formatNumber, toPersianDigits } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/account/orders/[code]">) {
  const { code } = await params;
  return { title: `سفارش ${code}` };
}

export default async function AccountOrderDetailPage({
  params,
}: PageProps<"/account/orders/[code]">) {
  const { code } = await params;
  await requireUser("/account/orders");

  const order = await getOrderByCode(code);
  if (!order) notFound();

  const shipping = SHIPPING_METHODS.find((method) => method.id === order.shippingMethod);
  const payment = PAYMENT_METHODS.find((method) => method.id === order.paymentMethod);
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-line pb-7">
        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusBadge status={order.status} size="md" />
          <span className="text-[0.68rem] text-mute">
            ثبت‌شده در {formatDateTime(order.createdAt)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
            سفارش <span className="tnum">{order.code}</span>
          </h1>
          <p className="text-xs text-smoke">
            <span className="tnum">{toPersianDigits(units)}</span> قلم کالا — مبلغ کل{" "}
            <span className="tnum text-ivory">{formatNumber(order.total)}</span> تومان
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {order.trackingCode ? (
            <Badge tone="gold" className="tnum">
              کد رهگیری: {order.trackingCode}
            </Badge>
          ) : null}

          <Button variant="subtle" size="sm">
            <Download className="size-3.5" />
            دانلود فاکتور
          </Button>

          {isActiveOrder(order.status) ? (
            <Button variant="ghost" size="sm">
              <RotateCcw className="size-3.5" />
              درخواست مرجوعی
            </Button>
          ) : null}

          <Button asChild variant="ghost" size="sm">
            <Link href="/account/orders">
              <ArrowRight className="size-3.5" />
              بازگشت به سفارش‌ها
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          {/* Items */}
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>اقلام سفارش</CardTitle>
              <CardDescription>قطعاتی که در این سفارش ارسال شده‌اند</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-5">
              {order.items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex items-center gap-4"
                >
                  <Link
                    href={`/shop/${item.slug}`}
                    className="size-16 shrink-0 overflow-hidden rounded-lg border border-line bg-carbon"
                  >
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className={cn("size-full object-cover", mediaClassFor(item.image))}
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Link
                      href={`/shop/${item.slug}`}
                      className="truncate text-xs text-ivory transition-colors duration-300 hover:text-gold-soft"
                    >
                      {item.name}
                    </Link>
                    <span className="text-[0.62rem] text-mute">{item.latinName}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] text-smoke">
                        سایز {item.size === "ONE" ? "تک‌سایز" : item.size}
                      </span>
                      <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] text-smoke">
                        {item.color}
                      </span>
                    </span>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tnum text-xs text-ivory">
                      {formatNumber(item.price * item.quantity)} تومان
                    </span>
                    <span className="tnum text-[0.62rem] text-mute">
                      {formatNumber(item.price)} × {toPersianDigits(item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>خلاصه پرداخت</CardTitle>
              <CardDescription>مبالغ ثبت‌شده در فاکتور</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              <dl className="flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-mute">جمع کالاها</dt>
                  <dd className="tnum text-ivory">{formatNumber(order.subtotal)} تومان</dd>
                </div>
                {order.discount > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-mute">تخفیف</dt>
                    <dd className="tnum text-danger">− {formatNumber(order.discount)} تومان</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <dt className="text-mute">مالیات بر ارزش افزوده</dt>
                  <dd className="tnum text-ivory">{formatNumber(order.tax)} تومان</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-mute">هزینه ارسال</dt>
                  <dd className="tnum text-ivory">
                    {order.shipping === 0 ? "رایگان" : `${formatNumber(order.shipping)} تومان`}
                  </dd>
                </div>
              </dl>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-smoke">مبلغ پرداخت‌شده</span>
                <span className="tnum text-base font-semibold text-ivory">
                  {formatNumber(order.total)} تومان
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>وضعیت سفارش</CardTitle>
              <CardDescription>مسیر سفارش از ثبت تا تحویل</CardDescription>
            </CardHeader>

            <CardContent>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 xl:sticky xl:top-28 xl:h-fit">
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>نشانی تحویل</CardTitle>
              <CardDescription>محل دریافت سفارش</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-3 text-xs text-smoke">
              <span className="text-ivory">{order.address.fullName}</span>
              <span className="flex items-start gap-3 leading-6">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>
                  {order.address.province}، {order.address.city}
                  <br />
                  {order.address.line1}
                </span>
              </span>
              <span className="tnum text-mute">کد پستی: {order.address.postalCode}</span>
              <span className="tnum text-mute">{order.address.phone}</span>

              <Separator className="my-1" />

              <span className="flex items-center gap-3">
                <Truck className="size-4 shrink-0 text-gold" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-ivory">{shipping?.title}</span>
                  <span className="text-[0.62rem] text-mute">{shipping?.estimate}</span>
                </span>
              </span>

              <span className="flex items-center gap-3">
                <CreditCard className="size-4 shrink-0 text-gold" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-ivory">{payment?.title}</span>
                  <span className="text-[0.62rem] text-mute">{payment?.description}</span>
                </span>
              </span>
            </CardContent>
          </Card>

          <Card className="flex items-start gap-4 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-elevated text-gold">
              <Package className="size-4" />
            </span>
            <span className="flex flex-col gap-1.5">
              <span className="text-xs text-ivory">پشتیبانی سفارش</span>
              <span className="text-[0.66rem] leading-6 text-mute">
                در صورت وجود هر مشکل در سفارش، با شماره پشتیبانی آتلیه تماس بگیرید یا از بخش تماس با
                ما پیام بگذارید.
              </span>
              <Button asChild variant="ghost" size="sm" className="w-fit">
                <Link href="/contact">تماس با پشتیبانی</Link>
              </Button>
            </span>
          </Card>
        </div>
      </div>
    </div>
  );
}
