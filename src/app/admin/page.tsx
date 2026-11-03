import Link from "next/link";
import { ArrowLeft, PackagePlus, ShoppingBag, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/controls";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { KpiCard } from "@/features/admin/components/kpi-card";
import { RevenueChart } from "@/features/admin/components/revenue-chart";
import { OrderStatusBadge, StockBadge } from "@/features/admin/components/status-badge";
import { Table, TableEmpty, TBody, TD, TH, THead, TR } from "@/features/admin/components/data-table";
import {
  averageRating,
  categoryBreakdown,
  computeKpis,
  growthPercent,
  monthlyRevenueSeries,
  recentOrders,
  revenueSeries,
  statusDistribution,
  stockAlerts,
  topProducts,
} from "@/features/admin/lib/metrics";
import { ORDER_STATUS_META } from "@/features/orders/lib/status";
import { formatCompactPrice, formatNumber, formatRelative, toPersianDigits } from "@/lib/format";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/features/orders/types";

export default function AdminDashboardPage() {
  const kpis = computeKpis();
  const daily = revenueSeries(30);
  const monthly = monthlyRevenueSeries(6);
  const top = topProducts(5);
  const orders = recentOrders(6);
  const alerts = stockAlerts().slice(0, 5);
  const categories = categoryBreakdown();
  const statuses = statusDistribution();
  const totalOrders = statuses.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex flex-col gap-9">
      <AdminPageHeader
        eyebrow="OVERVIEW"
        title="نمای کلی آتلیه"
        description={`عملکرد فروش، وضعیت موجودی و آخرین سفارش‌ها. میانگین امتیاز محصولات ${toPersianDigits(
          averageRating().toFixed(1),
        )} از ۵ است.`}
      >
        <Button asChild variant="subtle" size="sm">
          <Link href="/admin/orders">
            <ShoppingBag className="size-3.5" />
            مدیریت سفارش‌ها
          </Link>
        </Button>
        <Button asChild variant="gold" size="sm">
          <Link href="/admin/products/new">
            <PackagePlus className="size-3.5" />
            افزودن محصول
          </Link>
        </Button>
      </AdminPageHeader>

      {/* KPIs */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <KpiCard
            key={kpi.id}
            id={kpi.id}
            label={kpi.label}
            value={kpi.value}
            format={kpi.format}
            hint={kpi.hint}
            growth={growthPercent(kpi.value, kpi.previous)}
            index={index}
          />
        ))}
      </section>

      {/* Revenue */}
      <RevenueChart daily={daily} monthly={monthly} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* Top products */}
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>پرفروش‌ترین قطعات</CardTitle>
              <CardDescription>بر اساس درآمد سفارش‌های پرداخت‌شده</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/products">
                همه محصولات
                <ArrowLeft className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent className="px-0 pb-0 md:px-0">
            <Table>
              <THead>
                <TR>
                  <TH>محصول</TH>
                  <TH className="text-center">تعداد</TH>
                  <TH className="text-center">درآمد</TH>
                </TR>
              </THead>
              <TBody>
                {top.map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <span className="flex items-center gap-3">
                        <span className="size-10 shrink-0 overflow-hidden rounded-md border border-line bg-carbon">
                          <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                            className={cn("size-full object-cover", mediaClassFor(item.image))}
                          />
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-xs text-ivory">{item.name}</span>
                          <span className="text-[0.62rem] text-mute">{item.latinName}</span>
                        </span>
                      </span>
                    </TD>
                    <TD className="tnum text-center">{formatNumber(item.units)}</TD>
                    <TD className="tnum text-center text-ivory">
                      {formatCompactPrice(item.revenue)}
                    </TD>
                  </TR>
                ))}
                {top.length === 0 ? <TableEmpty colSpan={3} message="داده‌ای برای نمایش نیست." /> : null}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* Stock alerts */}
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>هشدار موجودی</CardTitle>
              <CardDescription>قطعاتی که نیاز به شارژ دارند</CardDescription>
            </div>
            <Badge tone={alerts.length ? "warning" : "success"} className="tnum">
              {toPersianDigits(alerts.length)} مورد
            </Badge>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={`/admin/products/${alert.id}`}
                className="group flex items-center gap-3 rounded-lg border border-line p-3 transition-colors duration-300 hover:border-gold/25"
              >
                <span className="size-11 shrink-0 overflow-hidden rounded-md border border-line bg-carbon">
                  <img
                    src={alert.image}
                    alt=""
                    loading="lazy"
                    className={cn("size-full object-cover", mediaClassFor(alert.image))}
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-xs text-ivory">{alert.name}</span>
                  <span className="tnum text-[0.62rem] text-mute">
                    موجودی کل: {toPersianDigits(alert.stock)} عدد
                  </span>
                </span>
                <StockBadge stock={alert.stock} />
              </Link>
            ))}
            {alerts.length === 0 ? (
              <p className="py-10 text-center text-xs text-mute">
                موجودی همه قطعات در محدوده سالم است.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* Recent orders */}
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>آخرین سفارش‌ها</CardTitle>
              <CardDescription>۶ سفارش اخیر ثبت‌شده در فروشگاه</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/orders">
                همه سفارش‌ها
                <ArrowLeft className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent className="px-0 pb-0 md:px-0">
            <Table>
              <THead>
                <TR>
                  <TH>کد سفارش</TH>
                  <TH>مشتری</TH>
                  <TH>وضعیت</TH>
                  <TH className="text-center">مبلغ</TH>
                  <TH className="text-center">زمان</TH>
                </TR>
              </THead>
              <TBody>
                {orders.map((order) => (
                  <TR key={order.id}>
                    <TD>
                      <Link
                        href={`/admin/orders/${order.code}`}
                        className="tnum text-xs text-gold transition-colors duration-300 hover:text-gold-soft"
                      >
                        {order.code}
                      </Link>
                    </TD>
                    <TD>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-xs text-ivory">{order.customerName}</span>
                        <span className="text-[0.62rem] text-mute">{order.address.city}</span>
                      </span>
                    </TD>
                    <TD>
                      <OrderStatusBadge status={order.status} />
                    </TD>
                    <TD className="tnum text-center text-ivory">{formatCompactPrice(order.total)}</TD>
                    <TD className="text-center text-[0.68rem] text-mute">
                      {formatRelative(order.createdAt)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {/* Category breakdown */}
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <CardTitle>سهم دسته‌بندی‌ها</CardTitle>
                <CardDescription>از کل درآمد فروشگاه</CardDescription>
              </div>
              <TrendingUp className="size-4 text-gold" />
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {categories.map((slice) => (
                <div key={slice.slug} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-smoke">{slice.title}</span>
                    <span className="tnum text-mute">
                      {formatCompactPrice(slice.revenue)}
                      <span className="ms-2 text-gold-soft">{toPersianDigits(slice.share.toFixed(1))}٪</span>
                    </span>
                  </div>
                  <Progress value={slice.share} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order statuses */}
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>وضعیت سفارش‌ها</CardTitle>
              <CardDescription>
                مجموع <span className="tnum">{formatNumber(totalOrders)}</span> سفارش ثبت‌شده
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {statuses.map((row) => {
                const meta = ORDER_STATUS_META[row.status as OrderStatus];
                const share = totalOrders ? (row.count / totalOrders) * 100 : 0;
                return (
                  <div key={row.status} className="flex items-center gap-3">
                    <OrderStatusBadge status={row.status as OrderStatus} />
                    <span className="hidden flex-1 text-[0.68rem] text-mute sm:block">
                      {meta.description}
                    </span>
                    <span className="tnum ms-auto text-xs text-ivory">
                      {toPersianDigits(row.count)}
                      <span className="ms-1.5 text-[0.62rem] text-mute">
                        ({toPersianDigits(share.toFixed(0))}٪)
                      </span>
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
