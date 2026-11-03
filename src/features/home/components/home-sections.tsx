import { Hero } from "./hero";
import { TrustStrip } from "./trust-strip";
import { ProductShowcase } from "./product-showcase";
import { FeaturedSets } from "./featured-sets";
import { EditorialSplit } from "./editorial-split";
import { CategoryGrid } from "./category-grid";
import { Testimonials } from "./testimonials";
import { CtaBand } from "./cta-band";
import {
  categoryCounts,
  getBestSellers,
  getFeaturedProducts,
  getNewArrivals,
} from "@/features/products/lib/live-selectors";
import { getFeaturedSets } from "@/features/sets/lib/live-sets";

/**
 * The landing page body. Rendered by both `app/(shop)/page.tsx` and the root
 * `app/page.tsx` so the two entry points stay in sync.
 *
 * Catalogue data is loaded here (on the server) and passed down, so the
 * client-heavy sections below never need to reach the runtime store — and any
 * change made in the admin panel shows up on the next render.
 */
export async function HomeSections() {
  const [featured, newest, bestSellers, sets, counts] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(8),
    getBestSellers(8),
    getFeaturedSets(),
    categoryCounts(),
  ]);

  return (
    <>
      <Hero />
      <TrustStrip />
      <ProductShowcase featured={featured} newest={newest} bestSellers={bestSellers} />
      <FeaturedSets sets={sets} />
      <EditorialSplit />
      <CategoryGrid counts={counts} />
      <Testimonials />
    </>
  );
}
