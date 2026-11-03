import { WishlistPageContent } from "@/features/wishlist/components/wishlist-page-content";
import { requireUser } from "@/features/auth/server/session";
import { allProducts } from "@/features/products/lib/live-selectors";

export const metadata = { title: "علاقه‌مندی‌ها" };

export default async function AccountWishlistPage() {
  await requireUser("/account/wishlist");
  const products = await allProducts();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-7">
        <span className="inline-flex items-center gap-2.5 text-[0.66rem] tracking-[0.28em] text-gold/85">
          <span className="h-px w-7 bg-gold/45" />
          WISHLIST
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
          علاقه‌مندی‌های من
        </h1>
        <p className="max-w-xl text-xs leading-7 text-smoke">
          قطعاتی که ذخیره کرده‌اید. می‌توانید هر کدام را مستقیم به سبد خرید اضافه کنید.
        </p>
      </header>

      <WishlistPageContent products={products} />
    </div>
  );
}
