"use client";

import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { ArrowLeft, ShoppingBag, Truck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/controls";
import { EmptyState } from "@/components/shared/empty-state";
import { useMounted } from "@/lib/hooks/use-mounted";
import { useStoreSettings } from "@/lib/hooks/use-store-settings";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { CartLineItem } from "./cart-line-item";
import { useCartStore } from "../store/cart-store";
import { computeSavings, computeTotals } from "../lib/totals";

export function CartDrawer() {
  const settings = useStoreSettings();
  const mounted = useMounted();
  const isOpen = useCartStore((state) => state.isDrawerOpen);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const lines = useCartStore((state) => state.lines);
  const coupon = useCartStore((state) => state.coupon);
  const shippingMethod = useCartStore((state) => state.shippingMethod);

  const totals = computeTotals({
    lines,
    coupon,
    shippingMethod,
    config: {
      freeShippingThreshold: settings.freeShipping,
      taxRate: settings.taxRate / 100,
      standardShipping: settings.standardShipping,
      expressShipping: settings.expressShipping,
    },
  });
  const savings = computeSavings(lines);
  const shippingProgress = Math.min(100, (totals.subtotal / (settings.freeShipping || 1)) * 100);

  if (!mounted) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : closeDrawer())}>
      <SheetContent side="left" width="md" hideTitle aria-label="سبد خرید">
        <SheetHeader>
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="size-4 text-gold" />
            <SheetTitle>سبد خرید</SheetTitle>
            {totals.itemCount > 0 ? (
              <span className="tnum rounded-full bg-gold/12 px-2 py-0.5 text-[0.65rem] text-gold-soft">
                {toPersianDigits(totals.itemCount)} قلم
              </span>
            ) : null}
          </div>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-5">
            <EmptyState
              icon={<ShoppingBag />}
              title="سبد خرید شما خالی است"
              description="از میان قطعات فروشگاه یا ست‌های کامل انتخاب کنید و به سبد اضافه کنید."
              className="border-none bg-transparent py-10"
            >
              <Button asChild variant="outline" size="sm" onClick={closeDrawer}>
                <Link href="/shop">شروع خرید</Link>
              </Button>
            </EmptyState>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1" viewportClassName="px-5">
              <ul className="flex flex-col">
                <AnimatePresence initial={false} mode="popLayout">
                  {lines.map((line) => (
                    <CartLineItem key={line.key} line={line} />
                  ))}
                </AnimatePresence>
              </ul>
            </ScrollArea>

            <div className="shrink-0 border-t border-line bg-carbon/80 px-5 py-5">
              <div className="mb-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-[0.7rem] text-smoke">
                  <Truck className="size-4 text-gold" />
                  {totals.qualifiesForFreeShipping ? (
                    <span className="text-success">ارسال این سفارش رایگان است.</span>
                  ) : (
                    <span>
                      <span className="tnum text-ivory">
                        {formatNumber(totals.freeShippingRemaining)}
                      </span>{" "}
                      تومان تا ارسال رایگان
                    </span>
                  )}
                </div>
                <Progress value={shippingProgress} />
              </div>

              <dl className="mb-5 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-mute">جمع کالاها</dt>
                  <dd className="tnum text-ivory">{formatNumber(totals.subtotal)} تومان</dd>
                </div>

                {savings > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-mute">سود شما از تخفیف‌ها</dt>
                    <dd className="tnum text-success">{formatNumber(savings)} تومان</dd>
                  </div>
                ) : null}

                {totals.discount > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-mute">کد تخفیف {coupon?.code}</dt>
                    <dd className="tnum text-danger">− {formatNumber(totals.discount)} تومان</dd>
                  </div>
                ) : null}

                <div className="flex items-center justify-between border-t border-line pt-2.5">
                  <dt className="text-smoke">مبلغ قابل پرداخت</dt>
                  <dd className="tnum text-sm font-semibold text-ivory">
                    {formatNumber(totals.total)} تومان
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col gap-2.5">
                <Button asChild variant="gold" size="lg" onClick={closeDrawer}>
                  <Link href="/checkout" className="w-full">
                    تکمیل خرید
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" onClick={closeDrawer}>
                  <Link href="/cart">مشاهده سبد کامل</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
