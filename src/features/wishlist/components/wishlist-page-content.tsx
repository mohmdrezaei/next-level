"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Price } from "@/components/shared/price";
import { useWishlistStore } from "../store/wishlist-store";
import { useCartStore } from "@/features/cart/store/cart-store";
import { useMounted } from "@/lib/hooks/use-mounted";
import { toCartLine } from "@/features/cart/types";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";
import type { Product } from "@/features/products/types";

/**
 * The saved-pieces list. Products are looked up from `products`, which the
 * server page passes in from the live catalogue — a client component cannot
 * reach the runtime store itself.
 */
export function WishlistPageContent({ products = [] }: { products?: Product[] }) {
  const mounted = useMounted();
  const items = useWishlistStore((state) => state.items);
  const remove = useWishlistStore((state) => state.remove);
  const clear = useWishlistStore((state) => state.clear);
  const addLine = useCartStore((state) => state.addLine);
  const openDrawer = useCartStore((state) => state.openDrawer);

  if (!mounted) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-56 animate-pulse rounded-xl border border-line bg-surface/40" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={<Heart />}
        title="فهرست علاقه‌مندی‌ها خالی است"
        description="با زدن آیکن قلب روی هر محصول، آن را در این فهرست ذخیره کنید تا بعداً سریع‌تر پیدایش کنید."
        action={{ label: "مشاهده محصولات", href: "/shop" }}
        className="py-20"
      />
    );
  }

  const addToCart = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) {
      toast.error("این محصول دیگر در دسترس نیست.");
      return;
    }
    const variant = product.variants.find((item) => item.stock > 0);
    if (!variant) {
      toast.error("این محصول موقتاً ناموجود است.");
      return;
    }

    addLine(
      toCartLine(product, {
        size: variant.size,
        color: product.colors[0]?.name ?? "—",
        colorHex: product.colors[0]?.hex ?? "#8a8a8e",
        quantity: 1,
      }),
      { openDrawer: false },
    );
    toast.success("به سبد خرید اضافه شد", { description: product.name });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="tnum text-xs text-smoke">
          {toPersianDigits(items.length)} قطعه ذخیره‌شده
        </span>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={openDrawer}>
            <ShoppingBag className="size-3.5" />
            مشاهده سبد
          </Button>
          <button
            type="button"
            onClick={() => {
              clear();
              toast.success("فهرست علاقه‌مندی‌ها خالی شد");
            }}
            className="text-[0.68rem] text-mute transition-colors duration-300 hover:text-danger"
          >
            پاک کردن همه
          </button>
        </div>
      </div>

      <motion.ul layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface/60 shadow-soft transition-colors duration-500 hover:border-ivory/20"
            >
              <Link href={`/shop/${item.slug}`} className="relative block aspect-4/3 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className={cn(
                    "size-full object-cover transition-transform duration-700 ease-[var(--ease-silk)] group-hover:scale-105",
                    mediaClassFor(item.image),
                  )}
                />
                <span className="overlay-scrim absolute inset-0" />
              </Link>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <Link
                  href={`/shop/${item.slug}`}
                  className="text-sm font-medium text-ivory transition-colors duration-300 hover:text-gold-soft"
                >
                  {item.name}
                </Link>
                <span className="text-[0.65rem] tracking-[0.14em] text-mute">{item.latinName}</span>

                <Price value={item.price} compareAt={item.compareAtPrice} size="sm" />

                <div className="mt-auto flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    className="flex-1"
                    onClick={() => addToCart(item.id)}
                  >
                    <ShoppingBag className="size-3.5" />
                    افزودن به سبد
                  </Button>

                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={`حذف ${item.name} از علاقه‌مندی‌ها`}
                    className="grid size-9 place-items-center rounded-full border border-line text-mute transition-colors duration-300 hover:border-danger/40 hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
