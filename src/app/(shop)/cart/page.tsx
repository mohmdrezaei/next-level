import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CartPageContent } from "@/features/cart/components/cart-page-content";

export const metadata: Metadata = {
  title: "سبد خرید",
  description: "مرور کالاهای انتخابی، اعمال کد تخفیف و ادامه فرآیند خرید در بوتیک Next Level.",
};

export default function CartPage() {
  return (
    <div className="container-page py-10 lg:py-14">
      <Breadcrumbs items={[{ title: "سبد خرید" }]} className="mb-6" />

      <header className="mb-10 flex flex-col gap-3 border-b border-line pb-8">
        <span className="inline-flex items-center gap-2.5 text-[0.68rem] tracking-[0.28em] text-gold/85">
          <span className="h-px w-7 bg-gold/45" />
          YOUR BAG
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">سبد خرید</h1>
      </header>

      <CartPageContent />
    </div>
  );
}
