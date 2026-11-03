"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Landmark,
  MapPin,
  Package,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/controls";
import { CartLineItem } from "@/features/cart/components/cart-line-item";
import { useCartStore } from "@/features/cart/store/cart-store";
import { computeTotals } from "@/features/cart/lib/totals";
import { useMounted } from "@/lib/hooks/use-mounted";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  PAYMENT_METHODS,
  SHIPPING_METHODS,
  TAX_RATE,
  type PaymentMethodId,
  type ShippingMethodId,
} from "@/lib/constants";
import { isActiveOrder } from "@/features/orders/lib/status";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { Order, OrderStatus } from "@/features/orders/types";

const STEPS = [
  { id: 0, title: "اطلاعات گیرنده", icon: MapPin },
  { id: 1, title: "ارسال و پرداخت", icon: Truck },
  { id: 2, title: "بازبینی نهایی", icon: Package },
];

const PAYMENT_ICONS: Record<PaymentMethodId, typeof CreditCard> = {
  gateway: CreditCard,
  wallet: Wallet,
  cod: Landmark,
};

const PROVINCES = [
  "تهران",
  "البرز",
  "اصفهان",
  "فارس",
  "خراسان رضوی",
  "آذربایجان شرقی",
  "گیلان",
  "خوزستان",
  "یزد",
  "قم",
];

interface AddressForm {
  fullName: string;
  phone: string;
  province: string;
  city: string;
  line1: string;
  postalCode: string;
}

type Errors = Partial<Record<keyof AddressForm, string>>;

export function CheckoutFlow() {
  const mounted = useMounted();
  const lines = useCartStore((state) => state.lines);
  const coupon = useCartStore((state) => state.coupon);
  const shippingMethod = useCartStore((state) => state.shippingMethod);
  const setShippingMethod = useCartStore((state) => state.setShippingMethod);
  const clear = useCartStore((state) => state.clear);

  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Errors>({});
  const [payment, setPayment] = React.useState<PaymentMethodId>("gateway");
  const [placedCode, setPlacedCode] = React.useState<string | null>(null);
  const [placedTotal, setPlacedTotal] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const [savedAddresses, setSavedAddresses] = React.useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<AddressForm>({
    fullName: "",
    phone: "",
    province: "تهران",
    city: "تهران",
    line1: "",
    postalCode: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const me = await apiFetch<{ user: any; customerId: string | null }>("/api/auth/me");
        if (cancelled || !me?.user) return;

        setForm((prev) => ({
          ...prev,
          fullName: prev.fullName || me.user.name || "",
          phone: prev.phone || me.user.phone || "",
        }));

        if (me.customerId) {
          const list = await apiFetch<any[]>(`/api/customers/${me.customerId}/addresses`);
          if (cancelled || !list || !list.length) return;
          setSavedAddresses(list);
          const def = list.find((a) => a.isDefault) ?? list[0];
          if (def) {
            setSelectedAddressId(def.id);
            setForm({
              fullName: def.fullName || me.user.name || "",
              phone: def.phone || me.user.phone || "",
              province: def.province || "تهران",
              city: def.city || "تهران",
              line1: def.line1 || "",
              postalCode: def.postalCode || "",
            });
          }
        }
      } catch {
        // Guest mode fallback
      }
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = computeTotals({ lines, coupon, shippingMethod });

  const setField = (key: keyof AddressForm, value: string) => {
    setForm((state) => ({ ...state, [key]: value }));
    setErrors((state) => ({ ...state, [key]: undefined }));
  };

  const validateAddress = (): boolean => {
    const next: Errors = {};
    if (form.fullName.trim().length < 3) next.fullName = "نام و نام خانوادگی را کامل وارد کنید.";
    if (!/^0?9\d{9}$/.test(form.phone.replace(/[\s-]/g, "").replace(/^(\+98|98)/, "0")))
      next.phone = "شماره موبایل معتبر نیست.";
    if (form.city.trim().length < 2) next.city = "نام شهر را وارد کنید.";
    if (form.line1.trim().length < 10) next.line1 = "نشانی کامل‌تری وارد کنید.";
    if (!/^\d{10}$/.test(form.postalCode.replace(/\D/g, ""))) next.postalCode = "کد پستی باید ۱۰ رقم باشد.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 0 && !validateAddress()) {
      toast.error("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }
    setStep((value) => Math.min(2, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => setStep((value) => Math.max(0, value - 1));

  const placeOrder = async () => {
    if (!lines.length) return;
    setSubmitting(true);

    try {
      // Prices, discounts, shipping and tax are recomputed server-side, so the
      // amount charged can never be influenced by the client.
      const order = await apiFetch<Order>("/api/orders", {
        method: "POST",
        body: {
          items: lines.map((line) => ({
            productId: line.productId,
            size: line.size,
            color: line.color,
            quantity: line.quantity,
          })),
          address: {
            fullName: form.fullName,
            phone: form.phone,
            province: form.province,
            city: form.city,
            line1: form.line1,
            postalCode: form.postalCode,
          },
          customerName: form.fullName,
          customerPhone: form.phone,
          shippingMethod,
          paymentMethod: payment,
          couponCode: coupon?.code ?? null,
        },
      });

      setPlacedTotal(order.total);
      setPlacedCode(order.code);
      try {
        const stored = JSON.parse(localStorage.getItem("nextlevel_placed_orders") || "[]");
        stored.unshift(order);
        localStorage.setItem("nextlevel_placed_orders", JSON.stringify(stored.slice(0, 20)));
      } catch {}
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error instanceof ApiClientError && error.field === "address") {
        setStep(0);
      }
      toast.error(error instanceof ApiClientError ? error.message : "ثبت سفارش ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface/40" />;
  }

  if (placedCode) {
    return <SuccessView code={placedCode} total={placedTotal} />;
  }

  if (!lines.length) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-line bg-surface/40 px-6 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-full border border-line bg-elevated text-mute">
          <Package className="size-6" />
        </span>
        <h2 className="text-base font-semibold text-ivory">سبد خرید خالی است</h2>
        <p className="max-w-sm text-xs leading-6 text-mute">
          برای تکمیل خرید ابتدا قطعات مورد نظر را به سبد اضافه کنید.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/shop">رفتن به فروشگاه</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
      <div className="flex flex-col gap-8">
        {/* Stepper */}
        <ol className="flex items-center gap-2">
          {STEPS.map((item, index) => {
            const state = step === item.id ? "current" : step > item.id ? "done" : "todo";
            return (
              <li key={item.id} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => step > item.id && setStep(item.id)}
                  className="flex items-center gap-2.5 text-start"
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full border text-xs transition-colors duration-300",
                      state === "current" && "border-gold bg-gold/12 text-gold-soft",
                      state === "done" && "border-success/40 bg-success/12 text-success",
                      state === "todo" && "border-line text-mute",
                    )}
                  >
                    {state === "done" ? <Check className="size-4" /> : <item.icon className="size-4" />}
                  </span>
                  <span
                    className={cn(
                      "hidden text-xs sm:block",
                      state === "todo" ? "text-mute" : "text-ivory",
                    )}
                  >
                    {item.title}
                  </span>
                </button>
                {index < STEPS.length - 1 ? (
                  <span
                    className={cn(
                      "h-px flex-1 transition-colors duration-500",
                      step > item.id ? "bg-success/40" : "bg-line",
                    )}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 ? (
              <div className="flex flex-col gap-6 rounded-xl border border-line bg-surface/40 p-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-semibold text-ivory">نشانی تحویل سفارش</h2>
                  <p className="text-[0.68rem] text-mute">
                    اطلاعات گیرنده را وارد کنید. برای ویرایش نشانی‌های ذخیره‌شده به پنل کاربری بروید.
                  </p>
                </div>

                {savedAddresses.length > 0 && (
                  <div className="flex flex-col gap-2 rounded-lg border border-gold/20 bg-gold/[0.04] p-3.5">
                    <span className="text-[0.68rem] font-medium text-gold-soft">
                      نشانی‌های ذخیره‌شده شما:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setForm({
                              fullName: addr.fullName,
                              phone: addr.phone,
                              province: addr.province,
                              city: addr.city,
                              line1: addr.line1,
                              postalCode: addr.postalCode,
                            });
                          }}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-xs transition-colors",
                            selectedAddressId === addr.id
                              ? "border-gold bg-gold/15 text-ivory"
                              : "border-line bg-surface/80 text-smoke hover:border-ivory/20",
                          )}
                        >
                          {addr.title || addr.city} — {addr.line1.slice(0, 24)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="نام و نام خانوادگی" required error={errors.fullName}>
                    <Input
                      value={form.fullName}
                      onChange={(event) => setField("fullName", event.target.value)}
                      data-invalid={errors.fullName ? "" : undefined}
                      placeholder="مثلاً آرش مهرآذین"
                    />
                  </Field>

                  <Field label="شماره موبایل" required error={errors.phone}>
                    <Input
                      value={form.phone}
                      onChange={(event) => setField("phone", event.target.value)}
                      data-invalid={errors.phone ? "" : undefined}
                      placeholder="09120000000"
                      dir="ltr"
                      className="text-start"
                    />
                  </Field>

                  <Field label="استان" required>
                    <select
                      value={form.province}
                      onChange={(event) => setField("province", event.target.value)}
                      className="h-12 w-full rounded-md border border-line bg-surface/60 px-4 text-sm text-ivory transition-colors duration-300 hover:border-ivory/20 focus:border-gold/60"
                    >
                      {PROVINCES.map((province) => (
                        <option key={province} value={province} className="bg-carbon">
                          {province}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="شهر" required error={errors.city}>
                    <Input
                      value={form.city}
                      onChange={(event) => setField("city", event.target.value)}
                      data-invalid={errors.city ? "" : undefined}
                      placeholder="مثلاً تهران"
                    />
                  </Field>

                  <Field label="نشانی کامل" required error={errors.line1} className="sm:col-span-2">
                    <Input
                      value={form.line1}
                      onChange={(event) => setField("line1", event.target.value)}
                      data-invalid={errors.line1 ? "" : undefined}
                      placeholder="خیابان، کوچه، پلاک، واحد"
                    />
                  </Field>

                  <Field label="کد پستی" required error={errors.postalCode}>
                    <Input
                      value={form.postalCode}
                      onChange={(event) => setField("postalCode", event.target.value)}
                      data-invalid={errors.postalCode ? "" : undefined}
                      placeholder="1234567890"
                      dir="ltr"
                      className="text-start"
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface/40 p-6">
                  <h2 className="text-sm font-semibold text-ivory">روش ارسال</h2>
                  <RadioGroup
                    value={shippingMethod}
                    onValueChange={(value) => setShippingMethod(value as ShippingMethodId)}
                    className="gap-3"
                  >
                    {SHIPPING_METHODS.map((method) => (
                      <label
                        key={method.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors duration-300",
                          shippingMethod === method.id
                            ? "border-gold/45 bg-gold/[0.06]"
                            : "border-line hover:border-ivory/25",
                        )}
                      >
                        <RadioGroupItem value={method.id} />
                        <span className="flex flex-1 flex-col gap-1">
                          <span className="text-xs text-ivory">{method.title}</span>
                          <span className="text-[0.65rem] text-mute">{method.description}</span>
                        </span>
                        <span className="tnum text-xs text-ivory">
                          {method.price === 0 ? (
                            <Badge tone="success">رایگان</Badge>
                          ) : (
                            `${formatNumber(method.price)} تومان`
                          )}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface/40 p-6">
                  <h2 className="text-sm font-semibold text-ivory">روش پرداخت</h2>
                  <RadioGroup
                    value={payment}
                    onValueChange={(value) => setPayment(value as PaymentMethodId)}
                    className="gap-3"
                  >
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = PAYMENT_ICONS[method.id];
                      return (
                        <label
                          key={method.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors duration-300",
                            payment === method.id
                              ? "border-gold/45 bg-gold/[0.06]"
                              : "border-line hover:border-ivory/25",
                          )}
                        >
                          <RadioGroupItem value={method.id} />
                          <Icon className="size-4 text-gold" />
                          <span className="flex flex-1 flex-col gap-1">
                            <span className="text-xs text-ivory">{method.title}</span>
                            <span className="text-[0.65rem] text-mute">{method.description}</span>
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface/40 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-ivory">نشانی تحویل</h2>
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="text-[0.68rem] text-gold transition-colors duration-300 hover:text-gold-soft"
                    >
                      ویرایش
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs leading-6 text-smoke">
                    <span className="text-ivory">{form.fullName}</span>
                    <span className="tnum">{form.phone}</span>
                    <span>
                      {form.province}، {form.city}، {form.line1}
                    </span>
                    <span className="tnum text-mute">کد پستی: {form.postalCode}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface/40 p-6">
                  <h2 className="text-sm font-semibold text-ivory">کالاهای سفارش</h2>
                  <ul className="flex flex-col">
                    {lines.map((line) => (
                      <CartLineItem key={line.key} line={line} compact />
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface/40 p-6">
                  <h2 className="text-sm font-semibold text-ivory">ارسال و پرداخت</h2>
                  <div className="flex flex-col gap-2.5 text-xs text-smoke">
                    <span className="flex items-center gap-2.5">
                      <Truck className="size-4 text-gold" />
                      {SHIPPING_METHODS.find((item) => item.id === shippingMethod)?.title}
                    </span>
                    <span className="flex items-center gap-2.5">
                      {React.createElement(PAYMENT_ICONS[payment], { className: "size-4 text-gold" })}
                      {PAYMENT_METHODS.find((item) => item.id === payment)?.title}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {step > 0 ? (
            <Button type="button" variant="ghost" size="md" onClick={goBack}>
              <ArrowRight className="size-4" />
              مرحله قبل
            </Button>
          ) : (
            <Button asChild variant="ghost" size="md">
              <Link href="/cart">بازگشت به سبد</Link>
            </Button>
          )}

          {step < 2 ? (
            <Button type="button" variant="primary" size="md" onClick={goNext}>
              ادامه
              <ArrowLeft className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="gold"
              size="lg"
              loading={submitting}
              onClick={placeOrder}
            >
              پرداخت و ثبت سفارش
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface/50 p-6">
          <h2 className="text-sm font-semibold text-ivory">خلاصه پرداخت</h2>

          <ul className="flex flex-col gap-2.5 text-xs">
            {lines.slice(0, 4).map((line) => (
              <li key={line.key} className="flex items-center justify-between gap-3">
                <span className="truncate text-mute">
                  {line.name}
                  <span className="ms-1.5 text-[0.62rem]">
                    ({line.size === "ONE" ? "تک‌سایز" : line.size} / {line.color})
                  </span>
                </span>
                <span className="tnum shrink-0 text-ivory">×{toPersianDigits(line.quantity)}</span>
              </li>
            ))}
            {lines.length > 4 ? (
              <li className="text-[0.68rem] text-mute">
                و {toPersianDigits(lines.length - 4)} قلم دیگر…
              </li>
            ) : null}
          </ul>

          <Separator />

          <dl className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-mute">جمع کالاها</dt>
              <dd className="tnum text-ivory">{formatNumber(totals.subtotal)} تومان</dd>
            </div>
            {totals.discount > 0 ? (
              <div className="flex items-center justify-between">
                <dt className="text-mute">تخفیف</dt>
                <dd className="tnum text-danger">− {formatNumber(totals.discount)} تومان</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <dt className="text-mute">مالیات ({toPersianDigits(TAX_RATE * 100)}٪)</dt>
              <dd className="tnum text-ivory">{formatNumber(totals.tax)} تومان</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-mute">ارسال</dt>
              <dd className="tnum text-ivory">
                {totals.shipping === 0 ? <Badge tone="success">رایگان</Badge> : `${formatNumber(totals.shipping)} تومان`}
              </dd>
            </div>
          </dl>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-smoke">قابل پرداخت</span>
            <span className="tnum text-base font-semibold text-ivory">
              {formatNumber(totals.total)}
              <span className="ms-1 text-[0.68rem] font-normal text-mute">تومان</span>
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SuccessView({ code, total }: { code: string; total: number }) {
  const status: OrderStatus = "paid";
  const tracking = isActiveOrder(status) ? "۲۴ ساعت آینده" : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-2xl border border-success/25 bg-success/[0.05] px-6 py-14 text-center"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.1 }}
        className="grid size-16 place-items-center rounded-full border border-success/40 bg-success/12 text-success"
      >
        <CheckCircle2 className="size-8" />
      </motion.span>

      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-ivory">سفارش شما ثبت شد</h1>
        <p className="max-w-md text-xs leading-7 text-smoke">
          پرداخت با موفقیت انجام شد. کد پیگیری سفارش شما{" "}
          <span className="tnum font-semibold text-gold-soft">{code}</span> است. جزئیات سفارش در پنل
          کاربری قابل مشاهده است.
        </p>
      </div>

      <dl className="grid w-full gap-4 border-y border-line py-6 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <dt className="text-[0.62rem] text-mute">مبلغ پرداخت‌شده</dt>
          <dd className="tnum text-sm text-ivory">{formatNumber(total)} تومان</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-[0.62rem] text-mute">زمان آماده‌سازی</dt>
          <dd className="text-sm text-ivory">{tracking}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-[0.62rem] text-mute">روش ارسال</dt>
          <dd className="text-sm text-ivory">پست پیشتاز</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="gold" size="md">
          <Link href="/account/orders">
            پیگیری سفارش‌ها
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="md">
          <Link href="/shop">
            <Store className="size-4" />
            ادامه خرید
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
