"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createOrderAction, updateOrderAction } from "../actions";
import { ORDER_STATUS_META } from "@/features/orders/lib/status";
import { PAYMENT_METHODS, SHIPPING_METHODS } from "@/lib/constants";
import type { PaymentMethodId, ShippingMethodId } from "@/lib/constants";
import { formatNumber, toPersianDigits } from "@/lib/format";
import type { Order, OrderStatus } from "@/features/orders/types";
import type { Product } from "@/features/products/types";

interface ItemRow {
  key: string;
  productId: string;
  size: string;
  quantity: number;
}

interface FormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  province: string;
  city: string;
  line1: string;
  postalCode: string;
  addressPhone: string;
  status: OrderStatus;
  shippingMethod: ShippingMethodId;
  paymentMethod: PaymentMethodId;
  trackingCode: string;
  items: ItemRow[];
}

const ORDER_STATUSES = Object.keys(ORDER_STATUS_META) as OrderStatus[];

let rowSeed = 0;
const nextRowKey = () => `row-${(rowSeed += 1)}`;

function emptyRow(product?: Product): ItemRow {
  return {
    key: nextRowKey(),
    productId: product?.id ?? "",
    size: product?.variants.find((variant) => variant.stock > 0)?.size ?? product?.variants[0]?.size ?? "",
    quantity: 1,
  };
}

function emptyState(products: Product[]): FormState {
  const product = products[0];
  return {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    province: "تهران",
    city: "تهران",
    line1: "",
    postalCode: "",
    addressPhone: "",
    status: "pending",
    shippingMethod: "standard",
    paymentMethod: "gateway",
    trackingCode: "",
    items: [emptyRow(product)],
  };
}

function stateFromOrder(order: Order): FormState {
  return {
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    province: order.address.province,
    city: order.address.city,
    line1: order.address.line1,
    postalCode: order.address.postalCode,
    addressPhone: order.address.phone,
    status: order.status,
    shippingMethod: order.shippingMethod,
    paymentMethod: order.paymentMethod,
    trackingCode: order.trackingCode ?? "",
    items: order.items.length
      ? order.items.map((item) => ({
          key: nextRowKey(),
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        }))
      : [emptyRow()],
  };
}

export function OrderForm({
  open,
  onOpenChange,
  order,
  products,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` → create a new order; an `Order` → edit it. */
  order: Order | null;
  products: Product[];
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<FormState>(() =>
    order ? stateFromOrder(order) : emptyState(products),
  );
  const [busy, setBusy] = React.useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((state) => ({ ...state, [key]: value }));

  const setItem = (key: string, patch: Partial<ItemRow>) =>
    setForm((state) => ({
      ...state,
      items: state.items.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    }));

  const addItem = () => setForm((state) => ({ ...state, items: [...state.items, emptyRow(products[0])] }));

  const removeItem = (key: string) =>
    setForm((state) => ({
      ...state,
      items: state.items.length > 1 ? state.items.filter((row) => row.key !== key) : state.items,
    }));

  const productMap = React.useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const subtotal = form.items.reduce((sum, row) => {
    const product = productMap.get(row.productId);
    return sum + (product ? product.price * Math.max(1, row.quantity) : 0);
  }, 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const rows = form.items.filter((row) => row.productId);
    if (!rows.length) {
      toast.error("حداقل یک قلم کالا برای سفارش انتخاب کنید.");
      return;
    }
    if (!form.customerName.trim() || !form.line1.trim()) {
      toast.error("نام گیرنده و نشانی سفارش الزامی است.");
      return;
    }

    const payload = {
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      customerEmail: form.customerEmail.trim(),
      address: {
        fullName: form.customerName.trim(),
        phone: form.addressPhone.trim() || form.customerPhone.trim(),
        province: form.province.trim(),
        city: form.city.trim(),
        line1: form.line1.trim(),
        postalCode: form.postalCode.trim(),
      },
      status: form.status,
      shippingMethod: form.shippingMethod,
      paymentMethod: form.paymentMethod,
      items: rows.map((row) => ({
        productId: row.productId,
        size: row.size || undefined,
        quantity: Math.max(1, Math.floor(row.quantity)),
      })),
    };

    setBusy(true);
    const result = order
      ? await updateOrderAction(order.code, { ...payload, trackingCode: form.trackingCode.trim() || null })
      : await createOrderAction(payload);
    setBusy(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" width="xl" hideTitle aria-label="فرم سفارش">
        <form onSubmit={submit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{order ? `ویرایش سفارش ${order.code}` : "سفارش جدید"}</SheetTitle>
            <SheetDescription>
              {order
                ? "اطلاعات گیرنده، اقلام و وضعیت سفارش را به‌روز کنید. مبلغ نهایی بر پایه اقلام بازمحاسبه می‌شود."
                : "یک سفارش دستی برای مشتری ثبت کنید. مبلغ نهایی بر پایه اقلام، ارسال و مالیات محاسبه می‌شود."}
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="flex flex-col gap-6">
            {/* Customer */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="نام گیرنده" required>
                <Input
                  value={form.customerName}
                  onChange={(event) => set("customerName", event.target.value)}
                  placeholder="آرش مهرآذین"
                  required
                />
              </Field>

              <Field label="شماره موبایل">
                <Input
                  value={form.customerPhone}
                  onChange={(event) => set("customerPhone", event.target.value)}
                  placeholder="09120000000"
                  dir="ltr"
                  className="text-start"
                />
              </Field>

              <Field label="ایمیل">
                <Input
                  type="email"
                  value={form.customerEmail}
                  onChange={(event) => set("customerEmail", event.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="text-start"
                />
              </Field>

              <Field label="تلفن گیرنده">
                <Input
                  value={form.addressPhone}
                  onChange={(event) => set("addressPhone", event.target.value)}
                  placeholder="02191002233"
                  dir="ltr"
                  className="text-start"
                />
              </Field>
            </div>

            <Separator />

            {/* Address */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="استان">
                <Input
                  value={form.province}
                  onChange={(event) => set("province", event.target.value)}
                  placeholder="تهران"
                />
              </Field>

              <Field label="شهر">
                <Input
                  value={form.city}
                  onChange={(event) => set("city", event.target.value)}
                  placeholder="تهران"
                />
              </Field>
            </div>

            <Field label="نشانی کامل" required>
              <Input
                value={form.line1}
                onChange={(event) => set("line1", event.target.value)}
                placeholder="خیابان ولیعصر، پلاک ۱۲، طبقه دوم"
                required
              />
            </Field>

            <Field label="کد پستی">
              <Input
                value={form.postalCode}
                onChange={(event) => set("postalCode", event.target.value)}
                placeholder="1234567890"
                dir="ltr"
                className="text-start"
              />
            </Field>

            <Separator />

            {/* Items */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-smoke">اقلام سفارش</span>
                <Button type="button" variant="subtle" size="sm" onClick={addItem}>
                  <Plus className="size-3.5" />
                  افزودن قلم
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {form.items.map((row) => {
                  const product = productMap.get(row.productId);
                  const sizes = product?.variants.map((variant) => variant.size) ?? [];

                  return (
                    <div
                      key={row.key}
                      className="grid gap-3 rounded-lg border border-line bg-surface/40 p-3 sm:grid-cols-[1.6fr_0.9fr_0.7fr_auto] sm:items-end"
                    >
                      <Field label="محصول">
                        <Select
                          value={row.productId || undefined}
                          onValueChange={(value) => {
                            const next = productMap.get(value);
                            setItem(row.key, {
                              productId: value,
                              size:
                                next?.variants.find((variant) => variant.stock > 0)?.size ??
                                next?.variants[0]?.size ??
                                "",
                            });
                          }}
                        >
                          <SelectTrigger size="sm">
                            <SelectValue placeholder="انتخاب محصول" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="سایز">
                        <Select
                          value={row.size || undefined}
                          onValueChange={(value) => setItem(row.key, { size: value })}
                          disabled={!sizes.length}
                        >
                          <SelectTrigger size="sm">
                            <SelectValue placeholder="سایز" />
                          </SelectTrigger>
                          <SelectContent>
                            {sizes.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size === "ONE" ? "تک‌سایز" : size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="تعداد">
                        <Input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(event) =>
                            setItem(row.key, { quantity: Number(event.target.value) || 1 })
                          }
                          dir="ltr"
                          className="h-10 text-start text-xs"
                        />
                      </Field>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="حذف قلم"
                        onClick={() => removeItem(row.key)}
                        disabled={form.items.length <= 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-line bg-surface/50 px-4 py-3">
                <span className="text-[0.68rem] text-mute">جمع اقلام (پیش از تخفیف و مالیات)</span>
                <span className="tnum text-sm text-ivory">{formatNumber(subtotal)} تومان</span>
              </div>
            </div>

            <Separator />

            {/* Fulfilment */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="وضعیت سفارش">
                <Select value={form.status} onValueChange={(value) => set("status", value as OrderStatus)}>
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {ORDER_STATUS_META[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="روش ارسال">
                <Select
                  value={form.shippingMethod}
                  onValueChange={(value) => set("shippingMethod", value as ShippingMethodId)}
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_METHODS.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="روش پرداخت">
                <Select
                  value={form.paymentMethod}
                  onValueChange={(value) => set("paymentMethod", value as PaymentMethodId)}
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="کد رهگیری" hint={order ? undefined : "پس از ثبت قابل ویرایش است"}>
                <Input
                  value={form.trackingCode}
                  onChange={(event) => set("trackingCode", event.target.value)}
                  placeholder="IR123456789"
                  dir="ltr"
                  className="text-start"
                  disabled={!order}
                />
              </Field>
            </div>

            <p className="tnum text-[0.65rem] leading-6 text-mute">
              {form.items.length > 0
                ? `${toPersianDigits(form.items.length)} قلم در این سفارش ثبت می‌شود. مبلغ نهایی شامل مالیات و هزینه ارسال است و پس از ذخیره محاسبه می‌شود.`
                : "برای ثبت سفارش حداقل یک قلم کالا اضافه کنید."}
            </p>
          </SheetBody>

          <SheetFooter className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" size="md" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>

            <Button type="submit" variant="gold" size="md" loading={busy}>
              {order ? "ذخیره تغییرات" : "ثبت سفارش"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
