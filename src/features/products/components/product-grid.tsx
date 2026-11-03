import * as React from "react";
import { PackageSearch } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { StaggerGroup, StaggerItem } from "@/components/shared/reveal";
import { ProductCard } from "./product-card";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Product } from "../types";

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4;
  className?: string;
  emptyAction?: { label: string; href: string };
}

const COLUMN_CLASSES = {
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
} as const;

export function ProductGrid({
  products,
  columns = 4,
  className,
  emptyAction,
}: ProductGridProps) {
  if (!products.length) {
    return (
      <EmptyState
        icon={<PackageSearch />}
        title="محصولی با این مشخصات پیدا نشد"
        description="فیلترها را تغییر دهید یا همه محصولات بوتیک را مرور کنید."
        action={emptyAction ?? { label: "مشاهده همه محصولات", href: "/shop" }}
      />
    );
  }

  return (
    <StaggerGroup
      className={cn("grid gap-x-5 gap-y-10", COLUMN_CLASSES[columns], className)}
      amount={0.05}
    >
      {products.map((product) => (
        <StaggerItem key={product.id}>
          <ProductCard product={product} />
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}

export function ProductGridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: 2 | 3 | 4 }) {
  return (
    <div className={cn("grid gap-x-5 gap-y-10", COLUMN_CLASSES[columns])}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
