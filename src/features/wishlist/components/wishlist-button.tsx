"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useWishlistStore } from "../store/wishlist-store";
import { cn } from "@/lib/utils";
import type { Product } from "@/features/products/types";

interface WishlistButtonProps {
  product: Product;
  className?: string;
  variant?: "icon" | "labelled";
  onToggle?: (added: boolean) => void;
}

export function WishlistButton({
  product,
  className,
  variant = "icon",
  onToggle,
}: WishlistButtonProps) {
  const toggle = useWishlistStore((state) => state.toggle);
  const active = useWishlistStore((state) =>
    state.items.some((item) => item.id === product.id),
  );
  const [mounted, setMounted] = React.useState(false);
  const reduce = useReducedMotion();

  React.useEffect(() => setMounted(true), []);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const added = toggle(product);
    onToggle?.(added);
  };

  const isActive = mounted && active;

  if (variant === "labelled") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isActive}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-full border px-5 text-xs transition-colors duration-300",
          isActive
            ? "border-danger/35 bg-danger/10 text-danger"
            : "border-line bg-surface/60 text-smoke hover:border-ivory/25 hover:text-ivory",
          className,
        )}
      >
        <Heart className={cn("size-4", isActive && "fill-current")} />
        {isActive ? "در علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isActive ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      aria-pressed={isActive}
      className={cn(
        "grid size-9 place-items-center rounded-full border backdrop-blur-md transition-colors duration-300",
        isActive
          ? "border-danger/40 bg-danger/15 text-danger"
          : "border-ivory/15 bg-ink/55 text-ivory hover:border-ivory/35",
        className,
      )}
    >
      <motion.span
        key={isActive ? "on" : "off"}
        initial={reduce ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 18 }}
      >
        <Heart className={cn("size-4", isActive && "fill-current")} />
      </motion.span>
    </button>
  );
}
