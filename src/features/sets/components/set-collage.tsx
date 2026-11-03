import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";
import type { ResolvedSetItem } from "../types";

interface SetCollageProps {
  items: ResolvedSetItem[];
  title: string;
  className?: string;
  /** Slight zoom used on card hover. */
  interactive?: boolean;
}

/**
 * Shows the pieces of a look as a collage. Four pieces fill a 2×2 grid, three
 * pieces put the lead item in a tall column, two pieces sit side by side.
 */
export function SetCollage({ items, title, className, interactive = true }: SetCollageProps) {
  const shown = items.slice(0, 4);
  const cellClass = cn(
    "relative overflow-hidden bg-carbon",
    interactive &&
      "transition-transform duration-700 ease-[var(--ease-silk)] group-hover:scale-[1.03]",
  );

  if (shown.length >= 4) {
    return (
      <div className={cn("grid aspect-4/3 grid-cols-2 grid-rows-2 gap-px bg-line", className)}>
        {shown.map((item) => (
          <span key={item.product.id} className={cellClass}>
            <img
              src={item.product.images[0]?.src}
              alt={`${item.role} — ${item.product.name}`}
              loading="lazy"
              className={cn("size-full object-cover", mediaClassFor(item.product.images[0]?.src))}
            />
          </span>
        ))}
      </div>
    );
  }

  if (shown.length === 3) {
    return (
      <div
        className={cn(
          "grid aspect-4/3 grid-cols-2 grid-rows-2 gap-px bg-line",
          className,
        )}
      >
        <span className={cn(cellClass, "row-span-2")}>
          <img
            src={shown[0].product.images[0]?.src}
            alt={`${shown[0].role} — ${shown[0].product.name}`}
            loading="lazy"
            className={cn("size-full object-cover", mediaClassFor(shown[0].product.images[0]?.src))}
          />
        </span>
        {shown.slice(1).map((item) => (
          <span key={item.product.id} className={cellClass}>
            <img
              src={item.product.images[0]?.src}
              alt={`${item.role} — ${item.product.name}`}
              loading="lazy"
              className={cn("size-full object-cover", mediaClassFor(item.product.images[0]?.src))}
            />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid aspect-4/3 grid-cols-2 gap-px bg-line", className)}>
      {shown.map((item) => (
        <span key={item.product.id} className={cellClass}>
          <img
            src={item.product.images[0]?.src}
            alt={`${item.role} — ${item.product.name}`}
            loading="lazy"
            className={cn("size-full object-cover", mediaClassFor(item.product.images[0]?.src))}
          />
        </span>
      ))}
    </div>
  );
}
