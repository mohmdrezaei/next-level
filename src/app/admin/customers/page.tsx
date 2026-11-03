import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { CustomersTable } from "@/features/admin/components/customers-table";
import { fetchAdminCustomers, fetchAdminOrders } from "@/features/admin/actions";
import { formatCompactPrice, formatNumber, toPersianDigits } from "@/lib/format";
import { Crown, Repeat, Users, Wallet } from "lucide-react";

export const metadata = { title: "مشتریان" };

export default async function AdminCustomersPage() {
  const [customers, orders] = await Promise.all([fetchAdminCustomers(), fetchAdminOrders()]);

  const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const repeat = customers.filter((customer) => customer.orders > 1).length;
  const gold = customers.filter((customer) => customer.tier === "gold").length;

  const stats = [
    { label: "کل مشتریان", value: formatNumber(customers.length), hint: "ثبت‌نام‌شده در فروشگاه", icon: Users },
    { label: "مجموع خرید", value: `${formatCompactPrice(totalSpent)} تومان`, hint: "از ابتدای فعالیت", icon: Wallet },
    { label: "خرید تکراری", value: toPersianDigits(repeat), hint: "بیش از یک سفارش", icon: Repeat },
    { label: "باشگاه طلایی", value: toPersianDigits(gold), hint: "بالای ۶۰ میلیون تومان", icon: Crown },
  ];

  return (
    <div className="flex flex-col gap-9">
      <AdminPageHeader
        eyebrow="CUSTOMERS"
        title="مدیریت مشتریان"
        description="مشتری بسازید، ویرایش کنید یا حذف کنید. برای دیدن پروفایل کامل و سفارش‌ها روی هر ردیف کلیک کنید."
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

      <CustomersTable customers={customers} orders={orders} />
    </div>
  );
}
