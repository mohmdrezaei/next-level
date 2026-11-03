import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: React.ReactNode[];
  className?: string;
  itemClassName?: string;
  /** Duration of one full loop, in seconds. */
  speed?: number;
  reverse?: boolean;
}

/** Infinite, CSS-driven ticker. Pauses on hover. */
export function Marquee({ items, className, itemClassName, speed = 38, reverse }: MarqueeProps) {
  const doubled = [...items, ...items];

  return (
    <div className={cn("group/marquee mask-fade-x overflow-hidden", className)}>
      <div
        className="flex w-max animate-marquee items-center group-hover/marquee:[animation-play-state:paused]"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {doubled.map((item, index) => (
          <div
            key={index}
            className={cn("flex shrink-0 items-center gap-4 px-6", itemClassName)}
            aria-hidden={index >= items.length}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
