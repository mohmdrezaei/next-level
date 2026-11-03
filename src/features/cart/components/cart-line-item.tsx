"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { useCartStore } from "../store/cart-store";
import type { CartLine } from "../types";

export function CartLineItem({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeLine = useCartStore((state) => state.removeLine);
  const reduce = useReducedMotion();

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, x: -18, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-4 border-b border-line py-4 last:border-b-0"
    >
      <Link
        href={`/shop/${line.slug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-line bg-carbon sm:size-24"
      >
        <img
          src={line.image}
          alt={line.name}
          loading="lazy"
          className={cn("size-full object-cover", mediaClassFor(line.image))}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              href={`/shop/${line.slug}`}
              className="truncate text-xs font-medium text-ivory transition-colors duration-300 hover:text-gold-soft"
            >
              {line.name}
            </Link>
            <span className="text-[0.68rem] text-mute">
              {line.latinName}
            </span>
          </div>

          <button
            type="button"
            onClick={() => removeLine(line.key)}
            aria-label={`حذف ${line.name} از سبد`}
            className="grid size-7 shrink-0 place-items-center rounded-full text-mute transition-colors duration-300 hover:bg-danger/12 hover:text-danger"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[0.68rem] text-smoke">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-1">
            <span
              className="size-2.5 rounded-full border border-ivory/20"
              style={{ backgroundColor: line.colorHex }}
            />
            {line.color}
          </span>
          <span className="rounded-full border border-line px-2 py-1">
            سایز {line.size === "ONE" ? "تک‌سایز" : line.size}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          {!compact ? (
            <QuantityStepper
              size="sm"
              value={line.quantity}
              max={line.maxQuantity}
              onChange={(next) => setQuantity(line.key, next)}
            />
          ) : (
            <span className="tnum text-[0.7rem] text-mute">
              {formatNumber(line.quantity)} عدد
            </span>
          )}

          <span className="tnum text-xs font-semibold text-ivory">
            {formatNumber(line.price * line.quantity)}
            <span className="ms-1 text-[0.65rem] font-normal text-mute">تومان</span>
          </span>
        </div>

        {line.quantity >= line.maxQuantity ? (
          <span className="text-[0.65rem] text-warning">
            حداکثر موجودی این سایز در سبد شماست.
          </span>
        ) : null}
      </div>
    </motion.li>
  );
}
