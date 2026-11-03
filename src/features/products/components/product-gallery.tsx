"use client";

import * as React from "react";
import { Expand, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { ProductImage } from "../types";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  badges?: React.ReactNode;
}

export function ProductGallery({ images, productName, badges }: ProductGalleryProps) {
  const [active, setActive] = React.useState(0);
  const [zoomOrigin, setZoomOrigin] = React.useState("50% 50%");
  const [zooming, setZooming] = React.useState(false);
  const current = images[active] ?? images[0];

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:items-start lg:gap-5">
      <div className="relative flex-1">
        <div
          className="group relative aspect-4/5 overflow-hidden rounded-2xl border border-line bg-carbon"
          onMouseEnter={() => setZooming(true)}
          onMouseLeave={() => setZooming(false)}
          onMouseMove={handleMove}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={current?.src}
              src={current?.src}
              alt={current?.alt ?? productName}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: zoomOrigin }}
              className={cn(
                "absolute inset-0 size-full object-cover transition-transform duration-500 ease-[var(--ease-silk)]",
                mediaClassFor(current?.src),
                zooming && "scale-[1.6]",
              )}
            />
          </AnimatePresence>

          <div className="pointer-events-none absolute top-4 right-4 flex flex-col items-end gap-1.5">
            {badges}
          </div>

          <Dialog>
            <DialogTrigger
              aria-label="بزرگ‌نمایی تصویر"
              className="absolute bottom-4 left-4 grid size-10 place-items-center rounded-full border border-ivory/15 bg-ink/60 text-ivory backdrop-blur-md transition-colors duration-300 hover:border-ivory/40"
            >
              <Expand className="size-4" />
            </DialogTrigger>

            <DialogContent className="max-w-4xl p-3" showClose={false}>
              <DialogTitle className="sr-only">{productName}</DialogTitle>
              <img
                src={current?.src}
                alt={current?.alt ?? productName}
                className={cn("aspect-4/5 w-full rounded-lg object-cover", mediaClassFor(current?.src))}
              />
              <DialogTrigger
                aria-label="بستن"
                className="absolute -top-2 -left-2 grid size-9 place-items-center rounded-full border border-line bg-carbon text-smoke transition-colors duration-300 hover:text-ivory"
              >
                <X className="size-4" />
              </DialogTrigger>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-3 lg:w-24 lg:flex-col">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`نمای ${index + 1}`}
            aria-current={index === active}
            className={cn(
              "relative aspect-4/5 w-20 shrink-0 overflow-hidden rounded-lg border transition-colors duration-300 lg:w-full",
              index === active
                ? "border-gold/60"
                : "border-line hover:border-ivory/30",
            )}
          >
            <img
              src={image.src}
              alt=""
              loading="lazy"
              className={cn("size-full object-cover", mediaClassFor(image.src))}
            />
            {index === active ? (
              <motion.span
                layoutId="gallery-active"
                className="absolute inset-0 rounded-lg ring-1 ring-inset ring-gold/50"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
