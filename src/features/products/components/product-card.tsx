"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpLeft, Eye } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Price } from "@/components/shared/price";
import { RatingStars } from "@/components/shared/rating-stars";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import { CATEGORY_MAP, badgeLabel } from "../data/catalog";
import type { Product, ProductBadge } from "../types";

const BADGE_TONE: Record<ProductBadge, string> = {
  new: "border-info/30 bg-info/15 text-info",
  limited: "border-gold/30 bg-gold/15 text-gold-soft",
  bestseller: "border-success/30 bg-success/15 text-success",
  sale: "border-danger/30 bg-danger/15 text-danger",
};

interface ProductCardProps {
  product: Product;
  className?: string;
  /** Stretch the card to fill its grid cell (used by the shop grid). */
  compact?: boolean;
}

export function ProductCard({ product, className, compact = false }: ProductCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const reduce = useReducedMotion();
  const category = CATEGORY_MAP[product.category];
  const secondary = product.images[1]?.src ?? product.images[0]?.src;
  const soldOut = product.variants.every((variant) => variant.stock <= 0);

  return (
    <article
      className={cn("group relative flex flex-col", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden rounded-xl border border-line bg-carbon shadow-soft transition-[border-color,box-shadow] duration-500 group-hover:border-ivory/18 group-hover:shadow-lift">
        <Link
          href={`/shop/${product.slug}`}
          aria-label={product.name}
          className="block aspect-4/5 overflow-hidden"
        >
          <motion.img
            src={product.images[0]?.src}
            alt={product.images[0]?.alt ?? product.name}
            loading="lazy"
            decoding="async"
            className={cn(
              "absolute inset-0 size-full object-cover",
              mediaClassFor(product.images[0]?.src),
            )}
            animate={reduce ? undefined : { scale: hovered ? 1.06 : 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.img
            src={secondary}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className={cn("absolute inset-0 size-full object-cover", mediaClassFor(secondary))}
            animate={reduce ? undefined : { opacity: hovered ? 1 : 0, scale: hovered ? 1.03 : 1.09 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />

          <span className="overlay-scrim pointer-events-none absolute inset-0 opacity-70" />
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {soldOut ? (
            <span className="rounded-full border border-line bg-ink/80 px-2.5 py-1 text-[0.65rem] text-smoke backdrop-blur-md">
              ناموجود
            </span>
          ) : null}
          {product.badges.slice(0, 2).map((badge) => (
            <span
              key={badge}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.65rem] font-medium backdrop-blur-md",
                BADGE_TONE[badge],
              )}
            >
              {badgeLabel(badge)}
            </span>
          ))}
        </div>

        {/* Wishlist */}
        <div className="absolute top-3 left-3">
          <WishlistButton product={product} />
        </div>

        {/* Quick actions */}
        <div
          className={cn(
            "absolute inset-x-3 bottom-3 flex items-center gap-2 transition-all duration-500 ease-[var(--ease-silk)]",
            compact ? "opacity-100" : "translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
          )}
        >
          <AddToCartButton
            product={product}
            variant="gold"
            sizeProp="sm"
            className="h-10 flex-1 text-xs"
            label="افزودن سریع"
          />
          <Link
            href={`/shop/${product.slug}`}
            aria-label="مشاهده جزئیات"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-ivory/15 bg-ink/70 text-ivory backdrop-blur-md transition-colors duration-300 hover:border-ivory/40"
          >
            <Eye className="size-4" />
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 pt-4">
        <span className="text-[0.65rem] tracking-[0.2em] text-mute">
          {category?.latinTitle ?? product.category}
        </span>

        <h3 className="text-sm font-medium leading-6 text-ivory">
          <Link
            href={`/shop/${product.slug}`}
            className="inline-flex items-center gap-1.5 transition-colors duration-300 hover:text-gold-soft"
          >
            {product.name}
            <ArrowUpLeft className="size-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          </Link>
        </h3>

        <RatingStars rating={product.rating} count={product.reviewCount} />

        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <Price value={product.price} compareAt={product.compareAtPrice} size="sm" />

          <div className="flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.name}
                title={color.name}
                className="size-3 rounded-full border border-ivory/20"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
