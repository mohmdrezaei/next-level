import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CreditCard, MapPin, Phone, Printer, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { OrderStatusBadge } from "@/features/admin/components/status-badge";
import { OrderStatusControl } from "@/features/admin/components/order-status-control";
import { fetchAdminOrder } from "@/features/admin/actions";
import { ORDER_STATUS_META } from "@/features/orders/lib/status";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import { PAYMENT_METHODS, SHIPPING_METHODS } from "@/lib/constants";
import { formatDateTime, formatNumber, formatRelative, toPersianDigits } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[code]">) {
  const { code } = await params;
  return { title: `سفارش ${code}` };
}

export default async function AdminOrderDetailPage({
  params,
}: PageProps<"/admin/orders/[code]">) {
  const { code } = await params;
  const order = await fetchAdminOrder(code);
  if (!order) notFound();

  const shipping = SHIPPING_METHODS.find((method) => method.id === order.shippingMethod);
  const payment = PAYMENT_METHODS.find((method) => method.id === order.paymentMethod);
  const timeline = [...order.timeline].reverse();

  return (
    <div className="flex flex-col gap-9">
      <AdminPageHeader
        eyebrow={`ORDER ${order.code}`}
        title={`سفارش ${order.customerName}`}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <OrderStatusBadge status={order.status} size="md" />
            <span className="text-[0.68rem] text-mute">
              ثبت‌شده در {formatDateTime(order.createdAt)} ({formatRelative(order.createdAt)})
            </span>
            {order.trackingCode ? (
              <span className="tnum text-[0.68rem] text-gold-soft">
                کد رهگیری: {order.trackingCode}
              </span>
            ) : null}
          </span>
        }
      >
        <Button variant="subtle" size="sm">
          <Printer className="size-3.5" />
          چاپ فاکتور
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/orders">
            <ArrowRight className="size-3.5" />
            بازگشت به فهرست
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          {/* Items */}
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>اقلام سفارش</CardTitle>
              <CardDescription>
                <span className="tnum">
                  {toPersianDigits(order.items.reduce((sum, item) => sum + item.quantity, 0))}
                </span>{" "}
                قلم کالا
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {order.items.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex items-center gap-4">
                  <span className="size-16 shrink-0 overflow-hidden rounded-lg border border-line bg-carbon">
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className={cn("size-full object-cover", mediaClassFor(item.image))}
                    />
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`/admin/products/${item.productId}`}
                      className="truncate text-xs text-ivory transition-colors duration-300 hover:text-gold-soft"
                    >
                      {item.name}
                    </Link>
                    <span className="text-[0.62rem] text-mute">{item.latinName}</span>
                    <span className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] text-smoke">
                        سایز {item.size === "ONE" ? "تک‌سایز" : item.size}
                      </span>
                      <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] text-smoke">
                        {item.color}
                      </span>
                    </span>
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tnum text-xs text-ivory">
                      {formatNumber(item.price * item.quantity)} تومان
                    </span>
                    <span className="tnum text-[0.62rem] text-mute">
                      {formatNumber(item.price)} × {toPersianDigits(item.quantity)}
                    </span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>خلاصه مالی</CardTitle>
              <CardDescription>مبالغ ثبت‌شده در فاکتور سفارش</CardDescription>
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
                <span className="text-sm text-smoke">مبلغ کل</span>
                <span className="tnum text-base font-semibold text-ivory">
                  {formatNumber(order.total)} تومان
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>تاریخچه سفارش</CardTitle>
              <CardDescription>ترتیب رویدادها از جدید به قدیم</CardDescription>
            </CardHeader>

            <CardContent>
              <ol className="relative flex flex-col gap-6 border-s border-line ps-6">
                {timeline.map((event, index) => (
                  <li key={`${event.status}-${event.at}`} className="relative">
                    <span
                      className={
                        index === 0
                          ? "absolute -start-[1.9rem] top-1 grid size-4 place-items-center rounded-full border border-gold bg-gold/20"
                          : "absolute -start-[1.9rem] top-1 grid size-4 place-items-center rounded-full border border-line bg-elevated"
                      }
                    >
                      <span
                        className={
                          index === 0 ? "size-1.5 rounded-full bg-gold" : "size-1.5 rounded-full bg-mute"
                        }
                      />
                    </span>

                    <div className="flex flex-wrap items-center gap-3">
                      <OrderStatusBadge status={event.status} />
                      <span className="text-[0.65rem] text-mute">{formatDateTime(event.at)}</span>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-smoke">{event.note}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 xl:sticky xl:top-28 xl:h-fit">
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>تغییر وضعیت</CardTitle>
              <CardDescription>{ORDER_STATUS_META[order.status].description}</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderStatusControl code={order.code} status={order.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>مشتری و نشانی</CardTitle>
              <CardDescription>اطلاعات گیرنده سفارش</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 text-xs text-smoke">
              <Link
                href="/admin/customers"
                className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 transition-colors duration-300 hover:border-gold/25"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-ivory">{order.customerName}</span>
                  <span className="tnum text-[0.62rem] text-mute">{order.customerPhone}</span>
                </span>
                <span className="text-[0.62rem] text-gold">پروفایل مشتری</span>
              </Link>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                <span className="flex flex-col gap-1 leading-6">
                  <span>
                    {order.address.province}، {order.address.city}
                  </span>
                  <span>{order.address.line1}</span>
                  <span className="tnum text-mute">کد پستی: {order.address.postalCode}</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-gold" />
                <span className="tnum">{order.address.phone}</span>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Truck className="size-4 shrink-0 text-gold" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-ivory">{shipping?.title}</span>
                  <span className="text-[0.62rem] text-mute">{shipping?.estimate}</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="size-4 shrink-0 text-gold" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-ivory">{payment?.title}</span>
                  <span className="text-[0.62rem] text-mute">{payment?.description}</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
