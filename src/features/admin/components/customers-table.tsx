"use client";

import * as React from "react";
import Link from "next/link";
import {
  Crown,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { InitialsAvatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableEmpty,
  TablePager,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "./data-table";
import { OrderStatusBadge, TierBadge } from "./status-badge";
import {
  createCustomerAction,
  deleteCustomerAction,
  recalculateCustomerStatsAction,
  updateCustomerAction,
} from "../actions";
import type { CustomerInput } from "../actions";
import {
  formatCompactPrice,
  formatDate,
  formatNumber,
  formatRelative,
  toPersianDigits,
} from "@/lib/format";
import { normalize } from "@/features/products/lib/query";
import type { Customer, Order } from "@/features/orders/types";

const PAGE_SIZE = 8;

const EMPTY_CUSTOMER: CustomerInput = {
  name: "",
  phone: "",
  email: "",
  city: "تهران",
  province: "تهران",
  joinedAt: new Date().toISOString().slice(0, 10),
  orders: 0,
  totalSpent: 0,
  lastOrderAt: "",
};

const TIER_LABEL: Record<Customer["tier"], string> = {
  bronze: "برنزی",
  silver: "نقره‌ای",
  gold: "طلایی",
};

function toCustomerInput(customer: Customer): CustomerInput {
  return {
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    city: customer.city,
    province: customer.province,
    joinedAt: customer.joinedAt,
    orders: customer.orders,
    totalSpent: customer.totalSpent,
    lastOrderAt: customer.lastOrderAt,
  };
}

/** Legacy rows occasionally carry a non-Gregorian value; normalise for <input type="date">. */
function toDateInput(value: string): string {
  const iso = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : new Date().toISOString().slice(0, 10);
}

export function CustomersTable({
  customers,
  orders,
}: {
  customers: Customer[];
  /** Order ledger, used for the profile drawer and the «recalculate» action. */
  orders: Order[];
}) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [active, setActive] = React.useState<Customer | null>(null);

  // Create / edit form
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState<CustomerInput>(EMPTY_CUSTOMER);

  const [pendingDelete, setPendingDelete] = React.useState<Customer | null>(null);
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    const needle = normalize(query);
    if (!needle) return customers;
    return customers.filter((customer) =>
      normalize(
        [customer.name, customer.phone, customer.email, customer.city, customer.province].join(" "),
      ).includes(needle),
    );
  }, [customers, query]);

  React.useEffect(() => setPage(1), [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const customerOrders = active
    ? orders.filter(
        (order) =>
          order.customerId === active.id ||
          (Boolean(active.phone) && order.customerPhone === active.phone) ||
          (Boolean(active.name) && order.customerName === active.name),
      )
    : [];

  const run = async (
    action: () => Promise<{ ok: boolean; message: string }>,
  ): Promise<boolean> => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
    return result.ok;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_CUSTOMER);
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm(toCustomerInput(customer));
    setActive(null);
    setFormOpen(true);
  };

  const set = <K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) =>
    setForm((state) => ({ ...state, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload: CustomerInput = {
      ...form,
      orders: Number.isFinite(form.orders) ? form.orders : 0,
      totalSpent: Number.isFinite(form.totalSpent) ? form.totalSpent : 0,
    };

    const ok = editing
      ? await run(() => updateCustomerAction(editing.id, payload))
      : await run(() => createCustomerAction(payload));

    if (ok) setFormOpen(false);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-line p-5">
          <div className="w-full sm:w-80">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              startIcon={<Search />}
              placeholder="جست‌وجوی نام، شماره تماس یا شهر…"
              className="h-11 text-xs"
            />
          </div>

          <span className="tnum text-[0.68rem] text-mute">
            {formatNumber(filtered.length)} مشتری
          </span>

          <Button type="button" variant="gold" size="sm" className="ms-auto" onClick={openCreate}>
            <UserPlus className="size-3.5" />
            مشتری جدید
          </Button>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>مشتری</TH>
              <TH>تماس</TH>
              <TH>شهر</TH>
              <TH className="text-center">سفارش‌ها</TH>
              <TH className="text-center">مجموع خرید</TH>
              <TH>سطح</TH>
              <TH className="text-center">آخرین خرید</TH>
              <TH className="w-14 text-center">عملیات</TH>
            </TR>
          </THead>

          <TBody>
            {rows.map((customer) => (
              <TR
                key={customer.id}
                className="cursor-pointer"
                onClick={() => setActive(customer)}
              >
                <TD className="whitespace-normal">
                  <span className="flex items-center gap-3">
                    <InitialsAvatar name={customer.name} accent="#c8a24c" className="size-9" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-xs text-ivory">{customer.name}</span>
                      <span className="tnum text-[0.62rem] text-mute">
                        عضویت از {formatDate(customer.joinedAt)}
                      </span>
                    </span>
                  </span>
                </TD>

                <TD>
                  <span className="flex flex-col gap-0.5">
                    <span className="tnum text-xs text-smoke">{customer.phone}</span>
                    <span className="text-[0.62rem] text-mute" dir="ltr">
                      {customer.email}
                    </span>
                  </span>
                </TD>

                <TD className="text-[0.68rem] text-mute">
                  {customer.province}، {customer.city}
                </TD>

                <TD className="tnum text-center text-ivory">{toPersianDigits(customer.orders)}</TD>

                <TD className="tnum text-center text-ivory">
                  {formatCompactPrice(customer.totalSpent)}
                </TD>

                <TD>
                  <TierBadge tier={customer.tier} />
                </TD>

                <TD className="text-center text-[0.65rem] text-mute">
                  {formatRelative(customer.lastOrderAt)}
                </TD>

                <TD className="text-center" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`عملیات ${customer.name}`}
                        className="grid size-8 place-items-center rounded-md border border-line text-mute transition-colors duration-300 hover:border-ivory/25 hover:text-ivory"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="start" className="w-52">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/customers/${customer.id}`}>
                          <ShoppingBag className="size-4" />
                          مشاهده پروفایل
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem onSelect={() => openEdit(customer)}>
                        <Pencil className="size-4" />
                        ویرایش مشتری
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onSelect={() => {
                          void run(() => recalculateCustomerStatsAction(customer.id));
                        }}
                      >
                        <RefreshCw className="size-4" />
                        بازخوانی از سفارش‌ها
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        variant="danger"
                        onSelect={() => setPendingDelete(customer)}
                      >
                        <Trash2 className="size-4" />
                        حذف مشتری
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TD>
              </TR>
            ))}

            {rows.length === 0 ? (
              <TableEmpty colSpan={8} message="مشتری‌ای با این مشخصات پیدا نشد." />
            ) : null}
          </TBody>
        </Table>

        <div className="border-t border-line p-5">
          <TablePager
            page={current}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* Profile drawer */}
      <Sheet open={Boolean(active)} onOpenChange={(open) => (!open ? setActive(null) : null)}>
        <SheetContent side="left" width="md" hideTitle aria-label="پروفایل مشتری">
          {active ? (
            <>
              <SheetHeader>
                <span className="flex items-center gap-3">
                  <InitialsAvatar name={active.name} accent="#c8a24c" className="size-11" />
                  <span className="flex flex-col gap-1">
                    <SheetTitle>{active.name}</SheetTitle>
                    <SheetDescription>مشتری از {formatDate(active.joinedAt)}</SheetDescription>
                  </span>
                </span>
              </SheetHeader>

              <SheetBody className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-2">
                  <TierBadge tier={active.tier} size="md" />
                  <Badge tone="outline">{active.province}</Badge>
                  <Badge tone="outline">{active.city}</Badge>
                </div>

                <dl className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-line p-3.5">
                    <dt className="text-[0.62rem] text-mute">تعداد سفارش</dt>
                    <dd className="tnum mt-1 text-sm text-ivory">
                      {toPersianDigits(active.orders)}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-line p-3.5">
                    <dt className="text-[0.62rem] text-mute">مجموع خرید</dt>
                    <dd className="tnum mt-1 text-sm text-ivory">
                      {formatNumber(active.totalSpent)} تومان
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-col gap-3 text-xs text-smoke">
                  <span className="flex items-center gap-3">
                    <Phone className="size-4 text-gold" />
                    <span className="tnum">{active.phone}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Mail className="size-4 text-gold" />
                    <span dir="ltr">{active.email}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <MapPin className="size-4 text-gold" />
                    {active.city}
                  </span>
                  <span className="flex items-center gap-3">
                    <Crown className="size-4 text-gold" />
                    سطح {TIER_LABEL[active.tier]}
                  </span>
                </div>

                <Separator />

                <div className="flex flex-col gap-4">
                  <span className="flex items-center gap-2 text-[0.68rem] tracking-[0.18em] text-mute">
                    <ShoppingBag className="size-3.5 text-gold" />
                    سفارش‌های این مشتری
                  </span>

                  <ul className="flex flex-col gap-3">
                    {customerOrders.map((order) => (
                      <li key={order.id}>
                        <Link
                          href={`/admin/orders/${order.code}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-line p-3.5 transition-colors duration-300 hover:border-gold/25"
                        >
                          <span className="flex flex-col gap-1">
                            <span className="tnum text-xs text-ivory">{order.code}</span>
                            <span className="text-[0.62rem] text-mute">
                              {formatDate(order.createdAt)}
                            </span>
                          </span>
                          <span className="flex flex-col items-end gap-1">
                            <OrderStatusBadge status={order.status} />
                            <span className="tnum text-[0.65rem] text-smoke">
                              {formatCompactPrice(order.total)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}

                    {customerOrders.length === 0 ? (
                      <li className="rounded-lg border border-dashed border-line py-8 text-center text-xs text-mute">
                        سفارشی برای این مشتری ثبت نشده است.
                      </li>
                    ) : null}
                  </ul>
                </div>
              </SheetBody>

              <SheetFooter className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  onClick={() => openEdit(active)}
                >
                  <Pencil className="size-3.5" />
                  ویرایش
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActive(null)}
                >
                  بستن
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Create / edit drawer */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent side="left" width="md" hideTitle aria-label="فرم مشتری">
          <form onSubmit={submit} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>{editing ? "ویرایش مشتری" : "مشتری جدید"}</SheetTitle>
              <SheetDescription>
                {editing
                  ? "اطلاعات پروفایل را به‌روز کنید. سطح باشگاه از مجموع خرید محاسبه می‌شود."
                  : "یک پروفایل مشتری بسازید. شماره موبایل باید ۱۱ رقم و یکتا باشد."}
              </SheetDescription>
            </SheetHeader>

            <SheetBody className="flex flex-col gap-5">
              <Field label="نام و نام خانوادگی" required>
                <Input
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder="آرش مهرآذین"
                  required
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="شماره موبایل" required hint="۱۱ رقم، شروع با صفر">
                  <Input
                    value={form.phone}
                    onChange={(event) => set("phone", event.target.value)}
                    placeholder="09120000000"
                    dir="ltr"
                    className="text-start"
                    required
                  />
                </Field>

                <Field label="ایمیل">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => set("email", event.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="text-start"
                  />
                </Field>

                <Field label="استان" required>
                  <Input
                    value={form.province}
                    onChange={(event) => set("province", event.target.value)}
                    placeholder="تهران"
                    required
                  />
                </Field>

                <Field label="شهر" required>
                  <Input
                    value={form.city}
                    onChange={(event) => set("city", event.target.value)}
                    placeholder="تهران"
                    required
                  />
                </Field>
              </div>

              <Field label="تاریخ عضویت">
                <Input
                  type="date"
                  value={toDateInput(form.joinedAt)}
                  onChange={(event) => set("joinedAt", event.target.value)}
                  dir="ltr"
                  className="text-start"
                />
              </Field>

              <Separator />

              <p className="text-[0.65rem] leading-6 text-mute">
                اگر می‌خواهید آمار از پیکربندی سفارش‌های واقعی محاسبه شود، از گزینه «بازخوانی از
                سفارش‌ها» در منوی هر ردیف استفاده کنید.
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="تعداد سفارش">
                  <Input
                    type="number"
                    min={0}
                    value={form.orders}
                    onChange={(event) => set("orders", Number(event.target.value))}
                    dir="ltr"
                    className="text-start"
                  />
                </Field>

                <Field label="مجموع خرید (تومان)">
                  <Input
                    type="number"
                    min={0}
                    step={100000}
                    value={form.totalSpent}
                    onChange={(event) => set("totalSpent", Number(event.target.value))}
                    dir="ltr"
                    className="text-start"
                  />
                </Field>
              </div>

              <div className="rounded-lg border border-line bg-surface/50 p-4">
                <span className="text-[0.62rem] text-mute">سطح باشگاه بر پایه خرید</span>
                <p className="mt-1.5 text-[0.68rem] text-smoke">
                  برنزی کمتر از ۲۵ میلیون · نقره‌ای تا ۶۰ میلیون · طلایی بالاتر از ۶۰ میلیون تومان
                </p>
              </div>
            </SheetBody>

            <SheetFooter className="flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" size="md" onClick={() => setFormOpen(false)}>
                انصراف
              </Button>

              <Button type="submit" variant="gold" size="md" loading={busy}>
                {editing ? "ذخیره تغییرات" : "ایجاد مشتری"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (!open ? setPendingDelete(null) : null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف مشتری</DialogTitle>
            <DialogDescription>
              آیا از حذف «{pendingDelete?.name}» مطمئن هستید؟ پروفایل مشتری حذف می‌شود، اما
              سفارش‌های ثبت‌شده‌اش در سیستم باقی می‌مانند.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="md">
                انصراف
              </Button>
            </DialogClose>

            <Button
              type="button"
              variant="danger"
              size="md"
              loading={busy}
              onClick={async () => {
                if (!pendingDelete) return;
                const ok = await run(() => deleteCustomerAction(pendingDelete.id));
                if (ok) setPendingDelete(null);
              }}
            >
              <Trash2 className="size-4" />
              حذف قطعی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
