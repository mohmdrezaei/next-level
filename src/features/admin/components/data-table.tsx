import * as React from "react";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Table primitives — responsive shell + cells                               */
/* -------------------------------------------------------------------------- */

export function TableScroll({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("-mx-px overflow-x-auto", className)}>
      <div className="min-w-full align-middle">{children}</div>
    </div>
  );
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return <table className={cn("w-full caption-bottom border-collapse text-sm", className)} {...props} />;
}

export function THead({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn("border-b border-line [&_tr]:border-0", className)}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TR({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b border-line/70 transition-colors duration-300 hover:bg-ivory/[0.02]", className)}
      {...props}
    />
  );
}

export function TH({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-4 py-3 text-start text-[0.68rem] font-medium tracking-wide text-mute",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td className={cn("whitespace-nowrap px-4 py-4 align-middle text-xs text-smoke", className)} {...props} />
  );
}

export function TableCount({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("tnum text-xs text-smoke", className)} {...props} />;
}

/* -------------------------------------------------------------------------- */
/*  Local pager (client-side tables)                                          */
/* -------------------------------------------------------------------------- */

export function TablePager({
  page,
  totalPages,
  totalItems,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (next: number) => void;
  className?: string;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5,
  );

  return (
    <nav
      aria-label="صفحه‌بندی"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="h-9 rounded-full border border-line px-4 text-xs text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory disabled:opacity-35"
      >
        قبلی
      </button>

      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          aria-current={item === page ? "page" : undefined}
          className={cn(
            "tnum size-9 rounded-full border text-xs transition-colors duration-300",
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
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="h-9 rounded-full border border-line px-4 text-xs text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory disabled:opacity-35"
      >
        بعدی
      </button>

      <span className="tnum ms-2 text-[0.68rem] text-mute">{formatNumber(totalItems)} مورد</span>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty row                                                                 */
/* -------------------------------------------------------------------------- */

export function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center text-xs text-mute">
        {message}
      </td>
    </tr>
  );
}
