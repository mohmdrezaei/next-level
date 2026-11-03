import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AccountNavLinks } from "@/components/layout/account-nav";
import { AccountSidebar } from "@/features/account/components/account-sidebar";
import { requireUser } from "@/features/auth/server/session";
import { getFeaturedSets } from "@/features/sets/lib/live-sets";
import { allProducts } from "@/features/products/lib/live-selectors";
import { listOrdersForUser } from "@/server/repositories/orders";

export const metadata: Metadata = {
  title: { default: "پنل کاربری", template: "%s | پنل کاربری Next Level" },
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const [orders, featuredSets, products] = await Promise.all([
    listOrdersForUser(user.id),
    getFeaturedSets(3),
    allProducts(),
  ]);

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="flex min-h-dvh flex-col">
      <AnnouncementBar />
      <SiteHeader user={user} featuredSets={featuredSets} products={products} />

      <main className="flex-1">
        <div className="container-page py-10 lg:py-14">
          <div className="flex flex-col gap-8">
            {/* Mobile navigation strip */}
            <div className="lg:hidden">
              <AccountNavLinks variant="chips" />
            </div>

            <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-12">
              <aside className="hidden lg:sticky lg:top-28 lg:block lg:h-fit">
                <AccountSidebar
                  user={user}
                  totalSpent={totalSpent}
                  ordersCount={orders.length}
                />
              </aside>

              <div className="min-w-0">{children}</div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
