import Link from "next/link";
import { ArrowUpLeft, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SetCollage } from "./set-collage";
import { setPricing, setRoles } from "../lib/set-pricing";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ResolvedSet } from "../types";

interface SetCardProps {
  set: ResolvedSet;
  className?: string;
  /** Larger type and a taller collage, used on the /sets index. */
  size?: "md" | "lg";
}

export function SetCard({ set, className, size = "md" }: SetCardProps) {
  const pricing = setPricing(set);
  const percent = Math.round(set.discountRate * 100);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface/70 shadow-soft transition-[border-color,transform,box-shadow] duration-500 ease-[var(--ease-silk)] hover:-translate-y-1 hover:border-gold/30 hover:shadow-lift",
        className,
      )}
    >
      <Link href={`/sets/${set.slug}`} className="relative block overflow-hidden">
        <SetCollage items={set.items} title={set.title} />

        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(9,9,11,0.72),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <span className="absolute top-3.5 start-3.5 flex flex-wrap items-center gap-1.5">
          <Badge tone="ivory" size="sm" className="backdrop-blur-sm">
            <Layers className="size-3" />
            {toPersianDigits(pricing.itemCount)} قطعه
          </Badge>
          <Badge tone="gold" size="sm" className="tnum backdrop-blur-sm">
            {toPersianDigits(percent)}٪ تخفیف ست
          </Badge>
        </span>

        <span className="absolute bottom-3.5 inset-x-3.5 flex items-center justify-between opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <span className="rounded-full bg-ivory px-4 py-1.5 text-[0.66rem] font-medium text-ink">
            مشاهده ست
          </span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="text-[0.62rem] tracking-[0.2em] text-gold/85 uppercase">
          {set.occasion}
        </span>

        <h3 className={cn("font-semibold tracking-tight text-ivory", size === "lg" ? "text-base" : "text-sm")}>
          <Link
            href={`/sets/${set.slug}`}
            className="inline-flex items-center gap-2 transition-colors duration-300 hover:text-gold-soft"
          >
            {set.title}
            <ArrowUpLeft className="size-3.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Link>
        </h3>

        <p className="text-[0.68rem] leading-6 text-mute">{setRoles(set)}</p>

        <p className="line-clamp-2 text-[0.7rem] leading-6 text-smoke">{set.subtitle}</p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <span className="flex flex-col gap-1">
            <span className="tnum text-sm font-semibold text-gold-soft">
              {formatNumber(pricing.total)}
              <span className="ms-1 text-[0.62rem] font-normal text-mute">تومان</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="tnum text-[0.66rem] text-mute line-through">
                {formatNumber(pricing.subtotal)}
              </span>
              <span className="tnum text-[0.62rem] text-success">
                {formatNumber(pricing.discount)} تومان سود
              </span>
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}
