"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductGrid } from "@/features/products/components/product-grid";
import { SectionHeading } from "@/components/shared/section-heading";
import type { Product } from "@/features/products/types";

interface ProductShowcaseProps {
  featured: Product[];
  newest: Product[];
  bestSellers: Product[];
}

const TABS = [
  { value: "featured", label: "منتخب آتلیه" },
  { value: "newest", label: "تازه رسیده‌ها" },
  { value: "bestsellers", label: "پرفروش‌ترین‌ها" },
] as const;

export function ProductShowcase({ featured, newest, bestSellers }: ProductShowcaseProps) {
  const map = { featured, newest, bestsellers: bestSellers } as const;

  return (
    <section className="container-page py-20 lg:py-28">
      <SectionHeading
        eyebrow="انتخاب‌های ما"
        title="قطعاتی که بیشترین توجه را می‌گیرند"
        description="از پالتوهای کشمیر تا پیراهن‌های آکسفورد؛ هر قطعه پیش از ورود به فروشگاه، سه مرحله کنترل کیفیت را رد می‌کند."
        action={{ label: "همه محصولات", href: "/shop" }}
        className="mb-10"
      />

      <Tabs defaultValue="featured" className="flex flex-col gap-10">
        <TabsList className="mx-auto lg:mx-0">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <ProductGrid products={map[tab.value]} columns={4} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
