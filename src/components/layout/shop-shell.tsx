import * as React from "react";
import { AnnouncementBar } from "./announcement-bar";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { getSession } from "@/features/auth/server/session";
import { getFeaturedSets } from "@/features/sets/lib/live-sets";
import { allProducts } from "@/features/products/lib/live-selectors";

/**
 * The storefront chrome (announcement bar → header → content → footer).
 *
 * It lives in its own component so the landing route can be reached both
 * through the `(shop)` route group layout and from the root `page.tsx`
 * without duplicating markup or paying for two session lookups per request.
 *
 * The header is a client component and cannot reach the runtime catalogue
 * store, so its search palette and set menu are fed from here.
 */
export async function ShopShell({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  const [featuredSets, products] = await Promise.all([getFeaturedSets(3), allProducts()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <AnnouncementBar />
      <SiteHeader user={user} featuredSets={featuredSets} products={products} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
