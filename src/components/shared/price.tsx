import { cn } from "@/lib/utils";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { discountPercent } from "@/lib/format";

interface PriceProps {
  value: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  showDiscount?: boolean;
}

const SIZE_CLASSES = {
  sm: { base: "text-sm", compare: "text-[0.7rem]" },
  md: { base: "text-base", compare: "text-xs" },
  lg: { base: "text-xl", compare: "text-sm" },
} as const;

export function Price({
  value,
  compareAt,
  size = "md",
  className,
  showDiscount = true,
}: PriceProps) {
  const off = discountPercent(value, compareAt);
  const sizes = SIZE_CLASSES[size];

  return (
    <span className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("tnum font-semibold text-ivory", sizes.base)}>
        {formatNumber(value)}
        <span className="ms-1 text-[0.7em] font-normal text-mute">تومان</span>
      </span>

      {off > 0 && compareAt ? (
        <>
          <span className={cn("tnum text-mute line-through decoration-danger/60", sizes.compare)}>
            {formatNumber(compareAt)}
          </span>
          {showDiscount ? (
            <span className="tnum rounded-full bg-danger/12 px-2 py-0.5 text-[0.65rem] font-medium text-danger">
              {toPersianDigits(off)}٪ تخفیف
            </span>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
