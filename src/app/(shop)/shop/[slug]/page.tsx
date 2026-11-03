import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SectionHeading } from "@/components/shared/section-heading";
import { ProductGallery } from "@/features/products/components/product-gallery";
import { ProductPurchasePanel } from "@/features/products/components/product-purchase-panel";
import { ProductDetailsTabs } from "@/features/products/components/product-details-tabs";
import { ProductSetsBand } from "@/features/sets/components/product-sets-band";
import { ProductGrid } from "@/features/products/components/product-grid";
import { ProductReviews } from "@/features/reviews/components/product-reviews";
import { badgeLabel, CATEGORY_MAP } from "@/features/products/data/catalog";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/features/products/lib/live-selectors";
import { listReviews } from "@/server/repositories/reviews";

// The catalogue is editable at runtime, so product pages render on demand.
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "محصول یافت نشد" };

  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [{ url: product.images[0]?.src ?? "" }],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const category = CATEGORY_MAP[product.category];
  const [related, reviews] = await Promise.all([
    getRelatedProducts(product, 4),
    listReviews({ productId: product.id, limit: 24 }),
  ]);

  return (
    <div className="container-page py-10 lg:py-14">
      <Breadcrumbs
        items={[
          { title: "فروشگاه", href: "/shop" },
          { title: category?.title ?? product.category, href: `/shop?category=${product.category}` },
          { title: product.name },
        ]}
        className="mb-8"
      />

      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <ProductGallery
          images={product.images}
          productName={product.name}
          badges={product.badges.map((badge) => (
            <Badge key={badge} tone={badge === "sale" ? "danger" : badge === "new" ? "info" : "gold"} size="md">
              {badgeLabel(badge)}
            </Badge>
          ))}
        />

        <ProductPurchasePanel product={product} />
      </div>

      <ProductSetsBand productId={product.id} />

      <div className="mt-20 border-t border-line pt-14">
        <ProductDetailsTabs product={product} />
      </div>

      <div className="mt-20 border-t border-line pt-14">
        <ProductReviews product={product} reviews={reviews} />
      </div>

      {related.length ? (
        <div className="mt-20 border-t border-line pt-14">
          <SectionHeading
            eyebrow="پیشنهاد آتلیه"
            title="قطعاتی که با این انتخاب هماهنگ‌اند"
            description="بر اساس دسته‌بندی، پالت رنگ و محدوده قیمت این قطعه پیشنهاد شده‌اند."
            className="mb-10"
          />
          <ProductGrid products={related} columns={4} />
        </div>
      ) : null}
    </div>
  );
}
