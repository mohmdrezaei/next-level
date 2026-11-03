import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { OrdersTable } from "@/features/admin/components/orders-table";
import { fetchAdminOrders } from "@/features/admin/actions";
import { isRevenueOrder } from "@/features/admin/lib/metrics";
import { formatCompactPrice, formatNumber, toPersianDigits } from "@/lib/format";
import { RefreshCcw, ShoppingBag, Truck, Wallet } from "lucide-react";

export const metadata = { title: "سفارش‌ها" };

export default async function AdminOrdersPage() {
  const orders = await fetchAdminOrders();

  const revenue = orders.filter(isRevenueOrder).reduce((sum, order) => sum + order.total, 0);
  const open = orders.filter((order) =>
    ["pending", "paid", "processing"].includes(order.status),
  ).length;
  const shipping = orders.filter((order) => order.status === "shipped").length;
  const returns = orders.filter((order) => ["cancelled", "returned"].includes(order.status)).length;

  const stats = [
    { label: "کل سفارش‌ها", value: formatNumber(orders.length), hint: "از ابتدای فعالیت", icon: ShoppingBag },
    { label: "درآمد تأییدشده", value: `${formatCompactPrice(revenue)} تومان`, hint: "سفارش‌های پرداخت‌شده", icon: Wallet },
    { label: "در حال پردازش", value: toPersianDigits(open), hint: "نیازمند اقدام آتلیه", icon: RefreshCcw },
    { label: "در مسیر ارسال", value: toPersianDigits(shipping), hint: "تحویل‌شده به پست", icon: Truck },
  ];

  return (
    <div className="flex flex-col gap-9">
      <AdminPageHeader
        eyebrow="ORDERS"
        title="مدیریت سفارش‌ها"
        description={`پیگیری وضعیت سفارش‌ها، مشاهده جزئیات اقلام و ثبت تغییر وضعیت. ${toPersianDigits(
          returns,
        )} سفارش لغو یا مرجوع شده است.`}
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-start gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-elevated text-gold">
              <stat.icon className="size-[18px]" strokeWidth={1.7} />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-[0.68rem] tracking-wide text-mute">{stat.label}</span>
              <span className="tnum text-base font-semibold text-ivory">{stat.value}</span>
              <span className="text-[0.62rem] text-mute">{stat.hint}</span>
            </span>
          </Card>
        ))}
      </section>

      <OrdersTable orders={orders} />
    </div>
  );
}
