import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Mail, MapPin, Phone, ShoppingBag, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InitialsAvatar } from "@/components/ui/avatar";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { OrderStatusBadge, TierBadge } from "@/features/admin/components/status-badge";
import { fetchAdminCustomers, fetchAdminOrders } from "@/features/admin/actions";
import {
  formatCompactPrice,
  formatDate,
  formatNumber,
  formatRelative,
  toPersianDigits,
} from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const customers = await fetchAdminCustomers();
  const customer = customers.find((item) => item.id === id);
  return { title: customer ? customer.name : "مشتری یافت نشد" };
}

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customers, orders] = await Promise.all([fetchAdminCustomers(), fetchAdminOrders()]);

  const customer = customers.find((item) => item.id === id);
  if (!customer) notFound();

  const own = orders
    .filter(
      (order) =>
        order.customerId === customer.id ||
        (Boolean(customer.phone) && order.customerPhone === customer.phone) ||
        (Boolean(customer.name) && order.customerName === customer.name),
    )
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const recent = own[0];
  const average = own.length
    ? Math.round(own.reduce((sum, order) => sum + order.total, 0) / own.length)
    : 0;

  const stats = [
    { label: "تعداد سفارش", value: toPersianDigits(customer.orders), icon: ShoppingBag },
    {
      label: "مجموع خرید",
      value: `${formatCompactPrice(customer.totalSpent)} تومان`,
      icon: Wallet,
    },
    { label: "میانگین سفارش", value: `${formatCompactPrice(average)} تومان`, icon: Wallet },
  ];

  return (
    <div className="flex flex-col gap-9">
      <AdminPageHeader eyebrow="CUSTOMER PROFILE" title={customer.name} description={customer.email}>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/customers">
            <ArrowRight className="size-3.5" />
            فهرست مشتریان
          </Link>
        </Button>
      </AdminPageHeader>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 p-6">
          <InitialsAvatar name={customer.name} accent="#c8a24c" className="size-16" />

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <TierBadge tier={customer.tier} size="md" />
              <Badge tone="outline">{customer.province}</Badge>
              <Badge tone="outline">{customer.city}</Badge>
              <Badge tone="neutral">
                عضویت از {formatDate(customer.joinedAt)}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-smoke">
              <span className="flex items-center gap-2">
                <Phone className="size-3.5 text-gold" />
                <span className="tnum">{customer.phone}</span>
              </span>
              <span className="flex items-center gap-2">
                <Mail className="size-3.5 text-gold" />
                <span dir="ltr">{customer.email}</span>
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="size-3.5 text-gold" />
                {customer.province}، {customer.city}
              </span>
            </div>
          </div>

          <span className="ms-auto flex flex-col items-end gap-1 text-end">
            <span className="text-[0.62rem] text-mute">آخرین خرید</span>
            <span className="text-xs text-ivory">
              {customer.lastOrderAt ? formatRelative(customer.lastOrderAt) : "—"}
            </span>
          </span>
        </CardContent>
      </Card>

      <section className="grid gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[0.68rem] text-mute">{stat.label}</span>
                <span className="tnum text-lg font-semibold text-ivory">{stat.value}</span>
              </div>
              <span className="grid size-9 place-items-center rounded-lg border border-gold/20 bg-gold/[0.08] text-gold">
                <stat.icon className="size-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">تاریخچه سفارش‌ها</CardTitle>
          <CardDescription className="text-[0.7rem]">
            {own.length
              ? `${formatNumber(own.length)} سفارش ثبت‌شده برای این مشتری`
              : "هنوز سفارشی برای این مشتری ثبت نشده است."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {own.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-2xl border-collapse text-start">
                <thead>
                  <tr className="border-y border-line bg-elevated/40">
                    <th className="px-5 py-3 text-start text-[0.66rem] font-medium text-mute">کد سفارش</th>
                    <th className="px-5 py-3 text-start text-[0.66rem] font-medium text-mute">تاریخ</th>
                    <th className="px-5 py-3 text-start text-[0.66rem] font-medium text-mute">اقلام</th>
                    <th className="px-5 py-3 text-start text-[0.66rem] font-medium text-mute">مبلغ</th>
                    <th className="px-5 py-3 text-start text-[0.66rem] font-medium text-mute">وضعیت</th>
                  </tr>
                </thead>

                <tbody>
                  {own.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-line transition-colors duration-200 hover:bg-ivory/[0.03]"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/orders/${order.code}`}
                          className="tnum text-xs text-ivory transition-colors duration-300 hover:text-gold-soft"
                        >
                          {order.code}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-[0.68rem] text-mute">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="tnum px-5 py-4 text-[0.68rem] text-smoke">
                        {toPersianDigits(order.items.length)}
                      </td>
                      <td className="tnum px-5 py-4 text-[0.7rem] text-gold-soft">
                        {formatNumber(order.total)}
                      </td>
                      <td className="px-5 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-14 text-mute">
              <ShoppingBag className="size-6" />
              <span className="text-xs">{recent ? "" : "سفارشی ثبت نشده است."}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
