"use client";

import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilterParams } from "../hooks/use-filter-params";
import { SORT_OPTIONS } from "../lib/query";
import type { SortKey } from "../types";

export function ProductSort() {
  const { filters, setFilter } = useFilterParams();

  return (
    <Select value={filters.sort} onValueChange={(value) => setFilter("sort", value as SortKey)}>
      <SelectTrigger size="sm" className="w-48" aria-label="ترتیب نمایش محصولات">
        <span className="flex items-center gap-2">
          <ArrowUpDown className="size-3.5 text-mute" />
          <SelectValue placeholder="ترتیب نمایش" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
