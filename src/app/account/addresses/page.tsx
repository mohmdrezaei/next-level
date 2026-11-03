import { AddressManager } from "@/features/account/components/address-manager";
import { requireUser } from "@/features/auth/server/session";
import { listAddresses } from "@/server/repositories/addresses";
import { ensureCustomerForUser } from "@/server/repositories/users";

export const metadata = { title: "نشانی‌های من" };

export default async function AccountAddressesPage() {
  const user = await requireUser("/account/addresses");
  const customerId = await ensureCustomerForUser(user.id);
  const addresses = customerId ? await listAddresses(customerId) : [];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-7">
        <span className="inline-flex items-center gap-2.5 text-[0.66rem] tracking-[0.28em] text-gold/85">
          <span className="h-px w-7 bg-gold/45" />
          ADDRESSES
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
          نشانی‌های من
        </h1>
        <p className="max-w-xl text-xs leading-7 text-smoke">
          نشانی‌های تحویل سفارش را مدیریت کنید. نشانی پیش‌فرض در صفحه پرداخت به‌صورت خودکار انتخاب
          می‌شود.
        </p>
      </header>

      <AddressManager initial={addresses} customerId={customerId} />
    </div>
  );
}
