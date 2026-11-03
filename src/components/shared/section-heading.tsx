import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: { label: string; href: string };
  align?: "start" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "start",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div className={cn("flex max-w-2xl flex-col gap-3", align === "center" && "items-center")}>
        {eyebrow ? (
          <span className="inline-flex items-center gap-2.5 text-[0.68rem] tracking-[0.28em] text-gold/85">
            <span className="h-px w-7 bg-gold/45" />
            {eyebrow}
          </span>
        ) : null}

        <h2 className="text-2xl font-semibold tracking-tight text-ivory text-elegant sm:text-3xl md:text-[2.1rem]">
          {title}
        </h2>

        {description ? (
          <p className="text-xs leading-7 text-smoke sm:text-sm">{description}</p>
        ) : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-2 text-xs text-gold transition-colors duration-300 hover:text-gold-soft"
        >
          {action.label}
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}
