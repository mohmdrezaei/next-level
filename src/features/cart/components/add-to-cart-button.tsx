"use client";

import * as React from "react";
import { Check, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCartStore } from "../store/cart-store";
import { toCartLine } from "../types";
import { cn } from "@/lib/utils";
import type { Product } from "@/features/products/types";

interface AddToCartButtonProps {
  product: Product;
  size?: string;
  color?: string;
  quantity?: number;
  variant?: ButtonProps["variant"];
  className?: string;
  label?: string;
  openDrawer?: boolean;
  sizeProp?: ButtonProps["size"];
}

export function AddToCartButton({
  product,
  size,
  color,
  quantity = 1,
  variant = "primary",
  className,
  label = "افزودن به سبد خرید",
  openDrawer = true,
  sizeProp = "lg",
}: AddToCartButtonProps) {
  const addLine = useCartStore((state) => state.addLine);
  const [added, setAdded] = React.useState(false);

  const resolvedSize = size ?? product.variants.find((item) => item.stock > 0)?.size ?? product.variants[0]?.size ?? "ONE";
  const resolvedColor = color ?? product.colors[0]?.name ?? "—";
  const colorHex = product.colors.find((item) => item.name === resolvedColor)?.hex ?? "#8a8a8e";

  const variantStock =
    product.variants.find((item) => item.size === resolvedSize)?.stock ?? 0;
  const disabled = variantStock <= 0;

  const handleClick = () => {
    if (disabled) return;
    addLine(
      toCartLine(product, {
        size: resolvedSize,
        color: resolvedColor,
        colorHex,
        quantity,
      }),
      { openDrawer },
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      variant={variant}
      size={sizeProp}
      className={cn("relative overflow-hidden", className)}
    >
      <AnimatePresence initial={false} mode="wait">
        {added ? (
          <motion.span
            key="added"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="inline-flex items-center gap-2"
          >
            <Check className="size-4" />
            به سبد اضافه شد
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="inline-flex items-center gap-2"
          >
            <ShoppingBag className="size-4" />
            {disabled ? "ناموجود" : label}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
