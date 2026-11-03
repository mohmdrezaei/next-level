import { ProfileForm } from "@/features/account/components/profile-form";
import { requireUser } from "@/features/auth/server/session";
import { listOrdersForUser } from "@/server/repositories/orders";

export const metadata = { title: "اطلاعات حساب" };

export default async function AccountProfilePage() {
  const user = await requireUser("/account/profile");
  const orders = await listOrdersForUser(user.id);
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-7">
        <span className="inline-flex items-center gap-2.5 text-[0.66rem] tracking-[0.28em] text-gold/85">
          <span className="h-px w-7 bg-gold/45" />
          PROFILE
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
          اطلاعات حساب
        </h1>
        <p className="max-w-xl text-xs leading-7 text-smoke">
          پروفایل، راه‌های تماس و رمز عبور خود را مدیریت کنید.
        </p>
      </header>

      <ProfileForm user={user} totalOrders={orders.length} totalSpent={totalSpent} />
    </div>
  );
}
