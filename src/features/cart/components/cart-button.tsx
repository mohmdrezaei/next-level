"use client";

import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMounted } from "@/lib/hooks/use-mounted";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "../store/cart-store";

export function CartButton({ className }: { className?: string }) {
  const mounted = useMounted();
  const count = useCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0));
  const openDrawer = useCartStore((state) => state.openDrawer);

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`سبد خرید${count > 0 ? ` — ${count} قلم` : ""}`}
      className={cn(
        "relative grid size-10 place-items-center rounded-full border border-line text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory",
        className,
      )}
    >
      <ShoppingBag className="size-4" />

      <AnimatePresence>
        {mounted && count > 0 ? (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 22 }}
            className="tnum absolute -top-1.5 -end-1.5 grid min-w-5 place-items-center rounded-full bg-gold px-1 text-[0.6rem] font-semibold text-ongold"
          >
            {toPersianDigits(count)}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </button>
  );
}
