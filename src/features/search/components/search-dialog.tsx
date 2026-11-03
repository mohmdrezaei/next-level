"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/shared/price";
import { formatNumber } from "@/lib/format";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/features/products/data/catalog";
import type { Product } from "@/features/products/types";

const SUGGESTIONS = ["پالتو", "پیراهن آکسفورد", "بلیزر", "کفش چرم", "بافت مرینو", "کیف چرم"];

/**
 * Quick-search palette. `products` is supplied by the server header wrapper so
 * results come from the live catalogue rather than a build-time snapshot.
 */
export function SearchDialog({
  products = [],
  triggerClassName,
}: {
  products?: Product[];
  triggerClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return products
      .filter((product) =>
        [product.name, product.latinName, product.shortDescription]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 6);
  }, [products, query]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 90);
      return () => window.clearTimeout(timer);
    }
    setQuery("");
  }, [open]);

  const submit = (value: string) => {
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(value)}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="جست‌وجو در محصولات"
        className={cn(
          "grid size-10 place-items-center rounded-full border border-line text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory",
          triggerClassName,
        )}
      >
        <Search className="size-4" />
      </DialogTrigger>

      <DialogContent
        className="top-[12%] max-w-2xl translate-y-0 gap-0 p-0"
        overlayClassName="items-start"
        showClose={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>جست‌وجو در محصولات Next Level</DialogTitle>
          <DialogDescription>نام محصول، دسته‌بندی یا کلمه کلیدی را وارد کنید.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) submit(query.trim());
          }}
          className="flex items-center gap-3 border-b border-line px-5 py-4"
        >
          <Search className="size-4 shrink-0 text-mute" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجو در آتلیه… مثلاً «پالتو کشمیر»"
            className="h-9 flex-1 bg-transparent text-sm text-ivory outline-hidden placeholder:text-mute"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="پاک کردن"
              className="grid size-7 place-items-center rounded-full text-mute transition-colors duration-300 hover:text-ivory"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[0.6rem] text-mute sm:block">
              ESC
            </kbd>
          )}
        </form>

        <div className="max-h-[52vh] overflow-y-auto p-5">
          {!query.trim() ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <span className="inline-flex items-center gap-2 text-[0.68rem] tracking-wide text-mute">
                  <TrendingUp className="size-3.5 text-gold" />
                  جست‌وجوهای پرطرفدار
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => submit(item)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs text-smoke transition-colors duration-300 hover:border-gold/40 hover:text-gold-soft"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[0.68rem] tracking-wide text-mute">دسته‌بندی‌ها</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CATEGORIES.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/shop?category=${category.slug}`}
                      onClick={() => setOpen(false)}
                      className="rounded-lg border border-line px-3 py-2.5 text-xs text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory"
                    >
                      {category.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-smoke">نتیجه‌ای برای «{query}» پیدا نشد.</p>
              <p className="mt-2 text-xs text-mute">
                املای کلمه را بررسی کنید یا از دسته‌بندی‌ها استفاده کنید.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="mb-2 text-[0.68rem] tracking-wide text-mute">
                {formatNumber(results.length)} نتیجه
              </span>
              <AnimatePresence initial={false}>
                {results.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: index * 0.03 }}
                  >
                    <Link
                      href={`/shop/${product.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-4 rounded-lg p-2.5 transition-colors duration-300 hover:bg-ivory/[0.05]"
                    >
                      <span className="size-14 shrink-0 overflow-hidden rounded-md border border-line bg-carbon">
                        <img
                          src={product.images[0]?.src}
                          alt=""
                          loading="lazy"
                          className={cn(
                            "size-full object-cover",
                            mediaClassFor(product.images[0]?.src),
                          )}
                        />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-xs font-medium text-ivory">
                          {product.name}
                        </span>
                        <span className="truncate text-[0.68rem] text-mute">
                          {product.latinName}
                        </span>
                      </span>
                      <Price value={product.price} compareAt={product.compareAtPrice} size="sm" showDiscount={false} />
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={() => submit(query.trim())}
              >
                مشاهده همه نتایج در فروشگاه
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
