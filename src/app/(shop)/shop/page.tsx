import type { Metadata } from "next";
import { Suspense } from "react";
import {
  applyFilters,
  buildFacets,
  readFilters,
  PAGE_SIZE,
} from "@/features/products/lib/query";
import { allProducts } from "@/features/products/lib/live-selectors";
import { ProductGrid, ProductGridSkeleton } from "@/features/products/components/product-grid";
import { ProductSort } from "@/features/products/components/product-sort";
import {
  MobileFilterSheet,
  ProductFiltersSidebar,
} from "@/features/products/components/product-filters";
import { ActiveFilters } from "@/features/products/components/active-filters";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Pagination } from "@/components/shared/pagination";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "فروشگاه",
  description:
    "همه محصولات بوتیک Next Level: پالتو، کت و شلوار، پیراهن، بافت، شلوار، کفش و اکسسوری مردانه.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const products = await allProducts();
  const filters = readFilters(params);
  const facets = buildFacets(products);
  const results = applyFilters(products, filters);

  const rawPage = Number(Array.isArray(params.page) ? params.page[0] : params.page);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.min(rawPage, totalPages) : 1;
  const paged = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container-page py-10 lg:py-14">
      <Breadcrumbs items={[{ title: "فروشگاه" }]} className="mb-6" />

      {/* Page head */}
      <header className="mb-10 flex flex-col gap-4 border-b border-line pb-8">
        <span className="inline-flex items-center gap-2.5 text-[0.68rem] tracking-[0.28em] text-gold/85">
          <span className="h-px w-7 bg-gold/45" />
          THE SHOP
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
          همه محصولات بوتیک
        </h1>
        <p className="max-w-2xl text-xs leading-7 text-smoke sm:text-sm">
          {formatNumber(products.length)} قطعه در {formatNumber(facets.categories.length)} دسته‌بندی.
          با فیلترها دقیقاً همان چیزی را پیدا کنید که می‌خواهید؛ از جنس پارچه تا محدوده قیمت.
        </p>
      </header>

      <div className="flex gap-10">
        <Suspense fallback={<div className="hidden w-64 shrink-0 lg:block" />}>
          <ProductFiltersSidebar facets={facets} />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col gap-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Suspense fallback={null}>
                <MobileFilterSheet facets={facets} resultCount={results.length} />
              </Suspense>
              <span className="tnum text-xs text-smoke">
                {formatNumber(results.length)} محصول
              </span>
            </div>

            <Suspense fallback={null}>
              <ProductSort />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <ActiveFilters />
          </Suspense>

          <Suspense fallback={<ProductGridSkeleton count={PAGE_SIZE} />}>
            <ProductGrid products={paged} columns={3} />
          </Suspense>

          <Suspense fallback={null}>
            <Pagination page={page} totalPages={totalPages} className="mt-6" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
