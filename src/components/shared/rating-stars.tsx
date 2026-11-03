import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
  showValue?: boolean;
}

export function RatingStars({
  rating,
  count,
  size = "sm",
  className,
  showValue = true,
}: RatingStarsProps) {
  const dimension = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => {
          const filled = rating >= index + 0.75;
          const half = !filled && rating >= index + 0.25;
          return (
            <span key={index} className="relative inline-flex">
              <Star className={cn(dimension, "text-line")} strokeWidth={1.5} />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? "100%" : "50%" }}
                >
                  <Star className={cn(dimension, "fill-gold text-gold")} strokeWidth={1.5} />
                </span>
              )}
            </span>
          );
        })}
      </div>

      {showValue ? (
        <span className="tnum text-[0.7rem] text-mute">
          {toPersianDigits(rating.toFixed(1))}
          {count !== undefined ? ` (${toPersianDigits(count)})` : ""}
        </span>
      ) : null}
    </div>
  );
}
