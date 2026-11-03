"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Ruler,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Price } from "@/components/shared/price";
import { RatingStars } from "@/components/shared/rating-stars";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { useCartStore } from "@/features/cart/store/cart-store";
import { toCartLine } from "@/features/cart/types";
import { badgeLabel, CATEGORY_MAP } from "../data/catalog";
import { cn } from "@/lib/utils";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import type { Product } from "../types";

const GUARANTEES = [
  { icon: Truck, title: "ارسال سریع", body: "تهران و کرج ۲۴ ساعته" },
  { icon: RotateCcw, title: "بازگشت ۷ روزه", body: "بدون قید و شرط" },
  { icon: ShieldCheck, title: "پرداخت امن", body: "درگاه بانکی معتبر" },
  { icon: BadgeCheck, title: "ضمانت اصالت", body: "برگه اصالت پارچه" },
];

export function ProductPurchasePanel({ product }: { product: Product }) {
  const availableVariant = product.variants.find((variant) => variant.stock > 0);
  const [size, setSize] = React.useState(availableVariant?.size ?? product.variants[0]?.size ?? "ONE");
  const [color, setColor] = React.useState(product.colors[0]?.name ?? "—");
  const [quantity, setQuantity] = React.useState(1);
  const [justAdded, setJustAdded] = React.useState(false);

  const addLine = useCartStore((state) => state.addLine);
  const openDrawer = useCartStore((state) => state.openDrawer);

  const selectedVariant = product.variants.find((variant) => variant.size === size);
  const selectedColor = product.colors.find((item) => item.name === color);
  const maxQuantity = Math.max(1, selectedVariant?.stock ?? 1);
  const soldOut = !selectedVariant || selectedVariant.stock <= 0;
  const lowStock = !soldOut && (selectedVariant?.stock ?? 0) <= 5;
  const category = CATEGORY_MAP[product.category];

  React.useEffect(() => {
    setQuantity(1);
  }, [size]);

  const handleAdd = () => {
    if (soldOut) return;
    addLine(
      toCartLine(product, {
        size,
        color,
        colorHex: selectedColor?.hex ?? "#8a8a8e",
        quantity,
      }),
      { openDrawer: false },
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (soldOut) return;

    addLine(
      toCartLine(product, {
        size,
        color,
        colorHex: selectedColor?.hex ?? "#8a8a8e",
        quantity,
      }),
      { openDrawer: false },
    );

    window.location.href = "/checkout";
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/shop?category=${product.category}`}
            className="text-[0.68rem] tracking-[0.2em] text-gold/85 transition-colors duration-300 hover:text-gold"
          >
            {category?.latinTitle ?? product.category}
          </Link>
          <span className="size-1 rounded-full bg-line" />
          <span className="text-[0.68rem] text-mute">
            کد قطعه: <span className="tnum">{toPersianDigits(product.id.replace("p-", ""))}</span>
          </span>
        </div>

        <h1 className="text-2xl font-semibold leading-relaxed tracking-tight text-ivory sm:text-3xl">
          {product.name}
        </h1>
        <span className="text-xs tracking-[0.14em] text-mute">{product.latinName}</span>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <RatingStars rating={product.rating} count={product.reviewCount} size="md" />
          <a
            href="#reviews"
            className="text-[0.68rem] text-mute transition-colors duration-300 hover:text-gold-soft"
          >
            مشاهده نظرات
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {product.badges.map((badge) => (
            <Badge key={badge} tone={badge === "sale" ? "danger" : badge === "new" ? "info" : "gold"}>
              {badgeLabel(badge)}
            </Badge>
          ))}
        </div>
      </div>

      <Price value={product.price} compareAt={product.compareAtPrice} size="lg" />

      <p className="text-xs leading-7 text-smoke sm:text-sm">{product.shortDescription}</p>

      <Separator />

      {/* Colour */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[0.68rem] tracking-[0.18em] text-mute">رنگ</span>
          <span className="text-xs text-ivory">{color}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {product.colors.map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setColor(item.name)}
                  aria-pressed={item.name === color}
                  aria-label={item.name}
                  className={cn(
                    "grid size-9 place-items-center rounded-full border-2 transition-all duration-300",
                    item.name === color
                      ? "border-gold scale-110"
                      : "border-line hover:border-ivory/40",
                  )}
                >
                  <span
                    className="size-6 rounded-full border border-ivory/15"
                    style={{ backgroundColor: item.hex }}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>{item.name}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[0.68rem] tracking-[0.18em] text-mute">سایز</span>
          <Link
            href="/about#sizing"
            className="inline-flex items-center gap-1.5 text-[0.68rem] text-mute transition-colors duration-300 hover:text-gold-soft"
          >
            <Ruler className="size-3.5" />
            راهنمای سایز
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {product.variants.map((variant) => {
            const disabled = variant.stock <= 0;
            const active = variant.size === size;
            return (
              <button
                key={variant.size}
                type="button"
                disabled={disabled}
                onClick={() => setSize(variant.size)}
                className={cn(
                  "relative h-11 min-w-14 rounded-md border px-3 text-xs transition-colors duration-300",
                  active
                    ? "border-gold/60 bg-gold/12 text-gold-soft"
                    : "border-line text-smoke hover:border-ivory/30 hover:text-ivory",
                  disabled && "cursor-not-allowed text-mute line-through opacity-45 hover:border-line",
                )}
              >
                {variant.size === "ONE" ? "تک‌سایز" : variant.size}
                {disabled ? (
                  <span className="absolute inset-x-1 bottom-1 text-[0.55rem] text-mute">ناموجود</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {lowStock ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[0.68rem] text-warning"
          >
            تنها <span className="tnum">{toPersianDigits(selectedVariant?.stock ?? 0)}</span> عدد از
            این سایز باقی مانده است.
          </motion.p>
        ) : null}
      </div>

      {/* Quantity + actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[0.68rem] tracking-[0.18em] text-mute">تعداد</span>
          <QuantityStepper
            value={quantity}
            max={maxQuantity}
            onChange={setQuantity}
            label="تعداد سفارش"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            {justAdded ? "✓ به سبد اضافه شد" : soldOut ? "ناموجود" : "افزودن به سبد"}
          </Button>

          <Button
            type="button"
            onClick={handleBuyNow}
            disabled={soldOut}
            variant="gold"
            size="lg"
            className="flex-1"
          >
            خرید فوری
          </Button>

          <WishlistButton product={product} variant="icon" className="size-12 shrink-0" />
        </div>

        {!soldOut ? (
          <button
            type="button"
            onClick={openDrawer}
            className="text-[0.68rem] text-mute underline-offset-4 transition-colors duration-300 hover:text-gold-soft hover:underline"
          >
            مشاهده سبد خرید
          </button>
        ) : (
          <p className="text-[0.68rem] text-mute">
            این سایز تمام شده است. برای اطلاع از شارژ موجودی با پشتیبانی تماس بگیرید.
          </p>
        )}
      </div>

      <Separator />

      {/* Guarantees */}
      <div className="grid grid-cols-2 gap-4">
        {GUARANTEES.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-elevated text-gold">
              <item.icon className="size-4" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[0.7rem] text-ivory">{item.title}</span>
              <span className="text-[0.62rem] text-mute">{item.body}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-surface/50 p-4">
        <div className="flex items-center gap-2.5 text-[0.7rem] text-smoke">
          <Truck className="size-4 text-gold" />
          ارسال رایگان برای سفارش‌های بالای{" "}
          <span className="tnum text-ivory">{formatNumber(FREE_SHIPPING_THRESHOLD)}</span> تومان
        </div>
      </div>
    </div>
  );
}
