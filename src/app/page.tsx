import type { Metadata } from "next";
import { ShopShell } from "@/components/layout/shop-shell";
import { HomeSections } from "@/features/home/components/home-sections";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.shortDescription,
};

/**
 * Landing route.
 *
 * `app/(shop)/page.tsx` renders the same sections through the shop group
 * layout; this file exists so the root path resolves deterministically and
 * renders the storefront chrome around the identical body.
 */
export default function RootPage() {
  return (
    <ShopShell>
      <HomeSections />
    </ShopShell>
  );
}
