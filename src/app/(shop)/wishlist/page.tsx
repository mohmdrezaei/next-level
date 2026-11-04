import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { WishlistPageContent } from "@/features/wishlist/components/wishlist-page-content";
import { allProducts } from "@/features/products/lib/live-selectors";
import { getSession } from "@/features/auth/server/session";
import { ensureCustomerForUser } from "@/server/repositories/users";
import { listWishlist } from "@/server/repositories/wishlist";
import type { Product } from "@/features/products/types";

export const metadata: Metadata = {
  title: "علاقه‌مندی‌ها",
  description: "قطعاتی که در بوتیک Next Level ذخیره کرده‌اید.",
};

export default async function WishlistPage() {
  const user = await getSession();
  const products = await allProducts();

  let initialProducts: Product[] | undefined;
  if (user) {
    const customerId = (await ensureCustomerForUser(user.id)) || user.id;
    initialProducts = await listWishlist(customerId);
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <Breadcrumbs items={[{ title: "علاقه‌مندی‌ها" }]} className="mb-6" />

      <header className="mb-10 flex flex-col gap-3 border-b border-line pb-8">
        <span className="inline-flex items-center gap-2.5 text-[0.68rem] tracking-[0.28em] text-gold/85">
          <span className="h-px w-7 bg-gold/45" />
          WISHLIST
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
          علاقه‌مندی‌ها
        </h1>
      </header>

      <WishlistPageContent
        products={products}
        initialProducts={initialProducts}
        userId={user?.id}
      />
    </div>
  );
}
