"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { ArrowLeft, BadgePercent, ShoppingBag, Ticket, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/controls";
import { EmptyState } from "@/components/shared/empty-state";
import { CartLineItem } from "./cart-line-item";
import { useCartStore } from "../store/cart-store";
import { computeSavings, computeTotals } from "../lib/totals";
import { useMounted } from "@/lib/hooks/use-mounted";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, TAX_RATE } from "@/lib/constants";

export function CartPageContent() {
  const mounted = useMounted();
  const lines = useCartStore((state) => state.lines);
  const coupon = useCartStore((state) => state.coupon);
  const couponCode = useCartStore((state) => state.couponCode);
  const couponError = useCartStore((state) => state.couponError);
  const shippingMethod = useCartStore((state) => state.shippingMethod);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const clear = useCartStore((state) => state.clear);

  const [code, setCode] = React.useState("");

  const totals = computeTotals({ lines, coupon, shippingMethod });
  const savings = computeSavings(lines);
  const shippingProgress = Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (!mounted) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl border border-line bg-surface/40" />
        ))}
      </div>
    );
  }

  if (!lines.length) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="سبد خرید شما خالی است"
        description="می‌توانید از فروشگاه، ست‌های کامل یا علاقه‌مندی‌های خود شروع کنید و قطعات مورد نظر را به سبد اضافه کنید."
        action={{ label: "رفتن به فروشگاه", href: "/shop" }}
        className="py-20"
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="tnum text-xs text-smoke">
            {toPersianDigits(totals.itemCount)} قلم کالا در سبد شما
          </span>
          <button
            type="button"
            onClick={() => {
              clear();
              toast.success("سبد خرید خالی شد");
            }}
            className="text-[0.68rem] text-mute transition-colors duration-300 hover:text-danger"
          >
            خالی کردن سبد
          </button>
        </div>

        <ul className="flex flex-col rounded-xl border border-line bg-surface/40 px-5">
          <AnimatePresence initial={false} mode="popLayout">
            {lines.map((line) => (
              <CartLineItem key={line.key} line={line} />
            ))}
          </AnimatePresence>
        </ul>

        {/* Coupon */}
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface/40 p-5">
          <span className="flex items-center gap-2 text-xs font-medium text-ivory">
            <Ticket className="size-4 text-gold" />
            کد تخفیف
          </span>

          {coupon ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-gold/30 bg-gold/[0.07] px-4 py-3">
              <span className="flex items-center gap-2.5 text-xs text-gold-soft">
                <BadgePercent className="size-4" />
                {coupon.code}
                <span className="text-mute">— {coupon.label}</span>
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                aria-label="حذف کد تخفیف"
                className="grid size-7 place-items-center rounded-full text-mute transition-colors duration-300 hover:text-danger"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2.5">
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="مثلاً NEXT10"
                  dir="ltr"
                  data-invalid={couponError ? "" : undefined}
                  className="h-11 flex-1"
                />
                <Button
                  type="button"
                  variant="subtle"
                  size="md"
                  className="h-11"
                  onClick={() => {
                    if (!code.trim()) return;
                    const ok = applyCoupon(code, totals.subtotal);
                    if (ok) {
                      toast.success("کد تخفیف اعمال شد");
                      setCode("");
                    }
                  }}
                >
                  اعمال
                </Button>
              </div>

              {couponError ? (
                <p className="text-[0.68rem] text-danger">{couponError}</p>
              ) : (
                <p className="text-[0.65rem] text-mute">
                  کدهای فعال: NEXT10، WELCOME15، FREESHIP
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface/40 p-5">
          <div className="flex items-center gap-2 text-[0.7rem] text-smoke">
            <Truck className="size-4 text-gold" />
            {totals.qualifiesForFreeShipping ? (
              <span className="text-success">ارسال این سفارش رایگان است.</span>
            ) : (
              <span>
                <span className="tnum text-ivory">{formatNumber(totals.freeShippingRemaining)}</span>{" "}
                تومان تا ارسال رایگان
              </span>
            )}
          </div>
          <Progress value={shippingProgress} />
        </div>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface/50 p-6">
          <h2 className="text-sm font-semibold tracking-tight text-ivory">خلاصه سفارش</h2>

          <dl className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-mute">جمع کالاها</dt>
              <dd className="tnum text-ivory">{formatNumber(totals.subtotal)} تومان</dd>
            </div>

            {savings > 0 ? (
              <div className="flex items-center justify-between">
                <dt className="text-mute">سود شما</dt>
                <dd className="tnum text-success">{formatNumber(savings)} تومان</dd>
              </div>
            ) : null}

            {totals.discount > 0 ? (
              <div className="flex items-center justify-between">
                <dt className="text-mute">تخفیف کد</dt>
                <dd className="tnum text-danger">− {formatNumber(totals.discount)} تومان</dd>
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <dt className="text-mute">مالیات بر ارزش افزوده</dt>
              <dd className="tnum text-ivory">
                {formatNumber(totals.tax)} تومان
                <span className="ms-1 text-[0.62rem] text-mute">
                  ({toPersianDigits(TAX_RATE * 100)}٪)
                </span>
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-mute">هزینه ارسال</dt>
              <dd className="tnum text-ivory">
                {totals.shipping === 0 ? (
                  <Badge tone="success">رایگان</Badge>
                ) : (
                  `${formatNumber(totals.shipping)} تومان`
                )}
              </dd>
            </div>
          </dl>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-smoke">مبلغ قابل پرداخت</span>
            <span className="tnum text-base font-semibold text-ivory">
              {formatNumber(totals.total)}
              <span className="ms-1 text-[0.68rem] font-normal text-mute">تومان</span>
            </span>
          </div>

          <Button asChild variant="gold" size="lg" className="w-full">
            <Link href="/checkout">
              ادامه و تکمیل خرید
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          <Button asChild variant="ghost" size="sm">
            <Link href="/shop">ادامه خرید</Link>
          </Button>

          <ul className="flex flex-col gap-2.5 border-t border-line pt-4 text-[0.65rem] text-mute">
            <li>بازرسی کیفی و بسته‌بندی اختصاصی پیش از ارسال</li>
            <li>امکان بازگشت کالا تا ۷ روز پس از دریافت</li>
            <li>پشتیبانی تلفنی در ساعات کاری بوتیک</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
