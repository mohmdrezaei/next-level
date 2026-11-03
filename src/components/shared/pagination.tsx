"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";

interface PaginationProps {
  page: number;
  totalPages: number;
  className?: string;
}

export function Pagination({ page, totalPages, className }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goTo = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: true });
  };

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  const button =
    "grid size-10 place-items-center rounded-full border text-xs transition-colors duration-300 disabled:opacity-35";

  return (
    <nav
      aria-label="صفحه‌بندی"
      className={cn("flex items-center justify-center gap-2", className)}
    >
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        aria-label="صفحه قبلی"
        className={cn(button, "border-line text-smoke hover:border-ivory/25 hover:text-ivory")}
      >
        <ChevronRight className="size-4" />
      </button>

      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => goTo(item)}
          aria-current={item === page ? "page" : undefined}
          className={cn(
            button,
            "tnum",
            item === page
              ? "border-gold/55 bg-gold/12 text-gold-soft"
              : "border-line text-smoke hover:border-ivory/25 hover:text-ivory",
          )}
        >
          {toPersianDigits(item)}
        </button>
      ))}

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        aria-label="صفحه بعدی"
        className={cn(button, "border-line text-smoke hover:border-ivory/25 hover:text-ivory")}
      >
        <ChevronLeft className="size-4" />
      </button>
    </nav>
  );
}
