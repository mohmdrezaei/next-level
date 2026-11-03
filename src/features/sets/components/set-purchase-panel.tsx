"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, ShoppingBag, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/features/cart/store/cart-store";
import { toCartLine } from "@/features/cart/types";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import { defaultSizeFor, setAvailability, setPricing, stockForSize } from "../lib/set-pricing";
import type { ResolvedSet } from "../types";

export function SetPurchasePanel({ set }: { set: ResolvedSet }) {
  const pricing = setPricing(set);
  const availability = setAvailability(set);
  const addLines = useCartStore((state) => state.addLines);
  const [pending, setPending] = React.useState(false);
  const [added, setAdded] = React.useState(false);

  const [sizes, setSizes] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(set.items.map((item) => [item.product.id, defaultSizeFor(item.product)])),
  );

  const pickSize = (productId: string, size: string) =>
    setSizes((current) => ({ ...current, [productId]: size }));

  const toLine = (item: ResolvedSet["items"][number]) =>
    toCartLine(item.product, {
      size: sizes[item.product.id] ?? defaultSizeFor(item.product),
      color: item.product.colors[0]?.name ?? "استاندارد",
      colorHex: item.product.colors[0]?.hex ?? "#8a8378",
      quantity: 1,
    });

  const addWholeSet = async () => {
    setPending(true);
    try {
      addLines(set.items.map(toLine), { openDrawer: true });
      setAdded(true);
      toast.success(`ست «${set.title}» به سبد خرید افزوده شد`, {
        description: `${toPersianDigits(pricing.itemCount)} قطعه — ${formatNumber(pricing.total)} تومان`,
      });
      window.setTimeout(() => setAdded(false), 2200);
    } finally {
      setPending(false);
    }
  };

  const addSingle = (productId: string) => {
    const item = set.items.find((entry) => entry.product.id === productId);
    if (!item) return;
    addLines([toLine(item)], { openDrawer: true });
    toast.success(`${item.product.name} به سبد خرید افزوده شد`);
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* Pieces */}
      <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface/50">
        {set.items.map((item, index) => {
          const selected = sizes[item.product.id] ?? defaultSizeFor(item.product);
          const soldOut = item.product.variants.every((variant) => variant.stock <= 0);

          return (
            <motion.li
              key={item.product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-4 p-4 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <Link
                href={`/shop/${item.product.slug}`}
                className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-line bg-carbon sm:size-24"
              >
                <img
                  src={item.product.images[0]?.src}
                  alt={item.product.name}
                  loading="lazy"
                  className={cn(
                    "size-full object-cover",
                    mediaClassFor(item.product.images[0]?.src),
                  )}
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="gold" size="sm">
                    {item.role}
                  </Badge>
                  {soldOut ? (
                    <Badge tone="danger" size="sm">
                      ناموجود
                    </Badge>
                  ) : null}
                </div>

                <Link
                  href={`/shop/${item.product.slug}`}
                  className="truncate text-xs font-medium text-ivory transition-colors duration-300 hover:text-gold-soft"
                >
                  {item.product.name}
                </Link>

                <span className="tnum text-[0.7rem] text-smoke">
                  {formatNumber(item.product.price)}
                  <span className="ms-1 text-[0.6rem] text-mute">تومان</span>
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {item.product.variants.map((variant) => {
                    const disabled = variant.stock <= 0;
                    const active = selected === variant.size;

                    return (
                      <button
                        key={variant.size}
                        type="button"
                        disabled={disabled}
                        onClick={() => pickSize(item.product.id, variant.size)}
                        aria-pressed={active}
                        title={
                          disabled
                            ? "ناموجود"
                            : `${variant.size} — ${toPersianDigits(variant.stock)} عدد موجود`
                        }
                        className={cn(
                          "min-w-9 rounded-md border px-2.5 py-1 text-[0.66rem] transition-colors duration-300",
                          active
                            ? "border-gold bg-gold/15 text-gold-soft"
                            : "border-line text-smoke hover:border-ivory/25 hover:text-ivory",
                          disabled &&
                            "cursor-not-allowed border-line/60 text-mute/50 line-through hover:border-line/60 hover:text-mute/50",
                        )}
                      >
                        {variant.size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={soldOut}
                  onClick={() => addSingle(item.product.id)}
                  className="h-8 px-3 text-[0.66rem]"
                >
                  افزودن
                </Button>
              </div>
            </motion.li>
          );
        })}
      </ul>

      {/* Bundle summary */}
      <Card className="border-gold/25 lg:sticky lg:top-28">
        <CardHeader>
          <CardTitle className="text-sm">خرید کل ست</CardTitle>
          <CardDescription className="text-[0.7rem] leading-6">
            قطعات با سایزی که انتخاب کرده‌اید به سبد اضافه می‌شوند و تخفیف ست به‌صورت خودکار روی
            مجموع اعمال می‌شود.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5 text-[0.72rem]">
            <div className="flex items-center justify-between">
              <span className="text-mute">مجموع قطعات</span>
              <span className="tnum text-smoke">{formatNumber(pricing.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-mute">
                تخفیف ست ({toPersianDigits(Math.round(set.discountRate * 100))}٪)
              </span>
              <span className="tnum text-success">− {formatNumber(pricing.discount)}</span>
            </div>

            <Separator className="my-1" />

            <div className="flex items-center justify-between">
              <span className="text-xs text-ivory">مبلغ نهایی ست</span>
              <span className="tnum text-base font-semibold text-gold-soft">
                {formatNumber(pricing.total)}
                <span className="ms-1 text-[0.62rem] font-normal text-mute">تومان</span>
              </span>
            </div>
          </div>

          {!availability.inStock ? (
            <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.07] px-3.5 py-2.5 text-[0.68rem] leading-6 text-warning">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {availability.soldOut.join("، ")} در حال حاضر موجود نیست. می‌توانید بقیه قطعات ست را
              جداگانه به سبد اضافه کنید.
            </p>
          ) : null}

          <Button
            type="button"
            variant="gold"
            size="lg"
            disabled={pending || !availability.inStock}
            onClick={addWholeSet}
            className="w-full"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : added ? (
              <Check className="size-4" />
            ) : (
              <ShoppingBag className="size-4" />
            )}
            {added ? "به سبد اضافه شد" : "افزودن کل ست به سبد"}
          </Button>

          <p className="text-center text-[0.62rem] leading-6 text-mute">
            برای تغییر رنگ هر قطعه، به صفحه محصول آن مراجعه کنید.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
