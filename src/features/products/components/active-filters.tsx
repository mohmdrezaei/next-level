"use client";

import { X } from "lucide-react";
import { formatCompactPrice } from "@/lib/format";
import { CATEGORY_MAP } from "../data/catalog";
import { useFilterParams } from "../hooks/use-filter-params";
import { activeFilterCount } from "../lib/query";
import { PRICE_BOUNDS } from "../data/catalog";

export function ActiveFilters() {
  const { filters, toggleFilter, setFilter, reset, clearSearch, isPending } = useFilterParams();
  const count = activeFilterCount(filters);

  if (count === 0 && !filters.q) return null;

  const chip =
    "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/60 px-3 py-1.5 text-[0.68rem] text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory";

  return (
    <div className="flex flex-wrap items-center gap-2" data-pending={isPending ? "" : undefined}>
      <span className="text-[0.68rem] text-mute">فیلترهای فعال:</span>

      {filters.q ? (
        <button type="button" onClick={clearSearch} className={chip}>
          «{filters.q}»
          <X className="size-3" />
        </button>
      ) : null}

      {filters.categories.map((slug) => (
        <button
          key={slug}
          type="button"
          onClick={() => toggleFilter("categories", slug)}
          className={chip}
        >
          {CATEGORY_MAP[slug]?.title ?? slug}
          <X className="size-3" />
        </button>
      ))}

      {filters.sizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => toggleFilter("sizes", size)}
          className={chip}
        >
          سایز {size === "ONE" ? "تک‌سایز" : size}
          <X className="size-3" />
        </button>
      ))}

      {filters.colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => toggleFilter("colors", color)}
          className={chip}
        >
          {color}
          <X className="size-3" />
        </button>
      ))}

      {filters.minPrice !== PRICE_BOUNDS.min || filters.maxPrice !== PRICE_BOUNDS.max ? (
        <button
          type="button"
          onClick={() => {
            setFilter("minPrice", PRICE_BOUNDS.min);
            setFilter("maxPrice", PRICE_BOUNDS.max);
          }}
          className={chip}
        >
          {formatCompactPrice(filters.minPrice)} — {formatCompactPrice(filters.maxPrice)}
          <X className="size-3" />
        </button>
      ) : null}

      {filters.onlyDiscount ? (
        <button type="button" onClick={() => setFilter("onlyDiscount", false)} className={chip}>
          تخفیف‌دار
          <X className="size-3" />
        </button>
      ) : null}

      {filters.onlyInStock ? (
        <button type="button" onClick={() => setFilter("onlyInStock", false)} className={chip}>
          موجود
          <X className="size-3" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={reset}
        className="text-[0.68rem] text-danger/85 transition-colors duration-300 hover:text-danger"
      >
        پاک کردن همه
      </button>
    </div>
  );
}
