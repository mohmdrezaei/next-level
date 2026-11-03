import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrdersExplorer } from "@/features/account/components/orders-explorer";
import { requireUser } from "@/features/auth/server/session";
import { listOrdersForUser } from "@/server/repositories/orders";

export const metadata = { title: "سفارش‌های من" };

export default async function AccountOrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await listOrdersForUser(user.id);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-2.5 text-[0.66rem] tracking-[0.28em] text-gold/85">
            <span className="h-px w-7 bg-gold/45" />
            MY ORDERS
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
            سفارش‌های من
          </h1>
          <p className="max-w-xl text-xs leading-7 text-smoke">
            وضعیت هر سفارش را پیگیری کنید، فاکتور را ببینید و در صورت نیاز درخواست مرجوعی ثبت کنید.
          </p>
        </div>

        <Button asChild variant="ghost" size="sm">
          <Link href="/shop">
            ادامه خرید
            <ArrowLeft className="size-3.5" />
          </Link>
        </Button>
      </header>

      <OrdersExplorer orders={orders} />
    </div>
  );
}
