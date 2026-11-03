"use client";

import * as React from "react";
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox, Slider, Switch } from "@/components/ui/controls";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatCompactPrice, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CATEGORY_MAP } from "../data/catalog";
import { useFilterParams } from "../hooks/use-filter-params";
import { activeFilterCount, type Facets } from "../lib/query";
import type { ProductFilters } from "../types";

interface FilterPanelProps {
  facets: Facets;
  className?: string;
}

function FilterPanel({ facets, className }: FilterPanelProps) {
  const { filters, setFilter, toggleFilter, reset, isPending } = useFilterParams();

  const [priceDraft, setPriceDraft] = React.useState<[number, number]>([
    filters.minPrice,
    filters.maxPrice,
  ]);

  React.useEffect(() => {
    setPriceDraft([filters.minPrice, filters.maxPrice]);
  }, [filters.minPrice, filters.maxPrice]);

  const [searchDraft, setSearchDraft] = React.useState(filters.q);

  React.useEffect(() => {
    setSearchDraft(filters.q);
  }, [filters.q]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchDraft !== filters.q) setFilter("q", searchDraft);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [searchDraft, filters.q, setFilter]);

  return (
    <div className={cn("flex flex-col gap-7", className)} data-pending={isPending ? "" : undefined}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-ivory">
          <SlidersHorizontal className="size-4 text-gold" />
          فیلترها
        </span>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-[0.68rem] text-mute transition-colors duration-300 hover:text-gold-soft"
        >
          <RotateCcw className="size-3" />
          حذف همه
        </button>
      </div>

      <Input
        value={searchDraft}
        onChange={(event) => setSearchDraft(event.target.value)}
        placeholder="جست‌وجو در نتایج…"
        startIcon={<Search />}
        endSlot={
          searchDraft ? (
            <button
              type="button"
              onClick={() => setSearchDraft("")}
              aria-label="پاک کردن جست‌وجو"
              className="grid size-7 place-items-center rounded-full text-mute transition-colors duration-300 hover:text-ivory"
            >
              <X className="size-3.5" />
            </button>
          ) : null
        }
        className="h-11"
      />

      {/* Categories */}
      <fieldset className="flex flex-col gap-3.5">
        <legend className="mb-3 text-[0.68rem] tracking-[0.18em] text-mute">دسته‌بندی</legend>
        {facets.categories.map((entry) => {
          const category = CATEGORY_MAP[entry.slug];
          const checked = filters.categories.includes(entry.slug);
          return (
            <label
              key={entry.slug}
              className="flex cursor-pointer items-center justify-between gap-3 text-xs text-smoke transition-colors duration-300 hover:text-ivory"
            >
              <span className="flex items-center gap-2.5">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleFilter("categories", entry.slug)}
                />
                {category?.title ?? entry.slug}
              </span>
              <span className="tnum text-[0.65rem] text-mute">{formatNumber(entry.count)}</span>
            </label>
          );
        })}
      </fieldset>

      <Separator />

      {/* Sizes */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[0.68rem] tracking-[0.18em] text-mute">سایز</legend>
        <div className="flex flex-wrap gap-2">
          {facets.sizes.map((entry) => {
            const active = filters.sizes.includes(entry.size);
            return (
              <button
                key={entry.size}
                type="button"
                onClick={() => toggleFilter("sizes", entry.size)}
                className={cn(
                  "tnum h-9 min-w-10 rounded-sm border px-2.5 text-xs transition-colors duration-300",
                  active
                    ? "border-gold/55 bg-gold/12 text-gold-soft"
                    : "border-line text-smoke hover:border-ivory/25 hover:text-ivory",
                )}
              >
                {entry.size === "ONE" ? "تک‌سایز" : entry.size}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Separator />

      {/* Colours */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[0.68rem] tracking-[0.18em] text-mute">رنگ</legend>
        <div className="flex flex-wrap gap-3">
          {facets.colors.map((entry) => {
            const active = filters.colors.includes(entry.name);
            return (
              <button
                key={entry.name}
                type="button"
                onClick={() => toggleFilter("colors", entry.name)}
                title={entry.name}
                aria-pressed={active}
                className={cn(
                  "relative size-8 rounded-full border-2 transition-all duration-300",
                  active ? "border-gold scale-110" : "border-line hover:border-ivory/40",
                )}
                style={{ backgroundColor: entry.hex }}
              >
                <span className="sr-only">{entry.name}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <Separator />

      {/* Price */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 flex w-full items-center justify-between text-[0.68rem] tracking-[0.18em] text-mute">
          <span>محدوده قیمت</span>
          <span className="tnum text-[0.68rem] text-smoke">
            {formatCompactPrice(priceDraft[0])} — {formatCompactPrice(priceDraft[1])}
          </span>
        </legend>
        <Slider
          min={facets.bounds.min}
          max={facets.bounds.max}
          step={100_000}
          value={priceDraft}
          onValueChange={(value) => setPriceDraft([value[0], value[1]] as [number, number])}
          onValueCommit={(value) => {
            setFilter("minPrice", value[0]);
            setFilter("maxPrice", value[1]);
          }}
          minStepsBetweenThumbs={1}
        />
        <div className="flex items-center justify-between text-[0.65rem] text-mute">
          <span className="tnum">{formatNumber(facets.bounds.min)}</span>
          <span className="tnum">{formatNumber(facets.bounds.max)}</span>
        </div>
      </fieldset>

      <Separator />

      {/* Toggles */}
      <div className="flex flex-col gap-4">
        <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-smoke">
          فقط تخفیف‌دارها
          <Switch
            checked={filters.onlyDiscount}
            onCheckedChange={(checked) => setFilter("onlyDiscount", checked)}
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-smoke">
          فقط کالاهای موجود
          <Switch
            checked={filters.onlyInStock}
            onCheckedChange={(checked) => setFilter("onlyInStock", checked)}
          />
        </label>
      </div>
    </div>
  );
}

export function ProductFiltersSidebar({ facets }: { facets: Facets }) {
  return (
    <aside className="sticky top-28 hidden h-fit w-64 shrink-0 flex-col rounded-xl border border-line bg-surface/60 p-5 shadow-soft lg:flex">
      <FilterPanel facets={facets} />
    </aside>
  );
}

export function MobileFilterSheet({
  facets,
  resultCount,
}: {
  facets: Facets;
  resultCount: number;
}) {
  const { filters } = useFilterParams();
  const count = activeFilterCount(filters);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="subtle" size="sm" className="lg:hidden">
          <Filter className="size-3.5" />
          فیلترها
          {count > 0 ? (
            <Badge tone="gold" className="tnum ms-1">
              {formatNumber(count)}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" width="sm" hideTitle aria-label="فیلتر محصولات">
        <SheetHeader>
          <SheetTitle>فیلتر محصولات</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <FilterPanel facets={facets} />
        </SheetBody>
        <SheetFooter>
          <SheetTrigger asChild>
            <Button variant="gold" size="md" className="w-full">
              نمایش {formatNumber(resultCount)} محصول
            </Button>
          </SheetTrigger>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
