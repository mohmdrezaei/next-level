"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { readFilters, serializeFilters } from "../lib/query";
import type { ProductFilters } from "../types";

type ArrayKeys = "categories" | "sizes" | "colors";

/**
 * Keeps the filter state in the URL so results stay shareable and the browser
 * back button keeps working. Server components read the same query string.
 */
export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  const filters = React.useMemo<ProductFilters>(
    () => readFilters(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const commit = React.useCallback(
    (next: ProductFilters) => {
      const params = new URLSearchParams(serializeFilters(next));
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const setFilter = React.useCallback(
    <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
      commit({ ...filters, [key]: value });
    },
    [commit, filters],
  );

  const toggleFilter = React.useCallback(
    (key: ArrayKeys, value: string) => {
      const current = filters[key] as string[];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      commit({ ...filters, [key]: next });
    },
    [commit, filters],
  );

  const reset = React.useCallback(() => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router]);

  const clearSearch = React.useCallback(() => {
    commit({ ...filters, q: "" });
  }, [commit, filters]);

  return { filters, setFilter, toggleFilter, reset, clearSearch, isPending };
}
