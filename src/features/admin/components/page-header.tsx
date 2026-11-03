import * as React from "react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/** Consistent page masthead for every admin screen. */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6 border-b border-line pb-7 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="flex max-w-2xl flex-col gap-3">
        {eyebrow ? (
          <span className="inline-flex items-center gap-2.5 text-[0.66rem] tracking-[0.28em] text-gold/85">
            <span className="h-px w-7 bg-gold/45" />
            {eyebrow}
          </span>
        ) : null}

        <h1 className="text-xl font-semibold tracking-tight text-ivory text-elegant sm:text-2xl">{title}</h1>

        {description ? (
          <p className="text-xs leading-7 text-smoke sm:text-sm">{description}</p>
        ) : null}
      </div>

      {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
    </header>
  );
}
