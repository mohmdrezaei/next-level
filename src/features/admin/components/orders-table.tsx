"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/controls";
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
import { OrderStatusBadge } from "./status-badge";
import { OrderForm } from "./order-form";
import { BulkDeleteButton, SelectionPill } from "./bulk-actions";
import { deleteOrderAction, deleteOrdersAction } from "../actions";
import { ORDER_STATUS_META } from "@/features/orders/lib/status";
import { formatCompactPrice, formatDate, formatNumber, toPersianDigits } from "@/lib/format";
import { normalize } from "@/features/products/lib/query";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/features/orders/types";
import type { Product } from "@/features/products/types";

const PAGE_SIZE = 8;

type TabKey = "all" | "active" | "delivered" | "cancelled";

const ACTIVE: OrderStatus[] = ["pending", "paid", "processing", "shipped"];

const TABS: { value: TabKey; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "active", label: "در جریان" },
  { value: "delivered", label: "تحویل‌شده" },
  { value: "cancelled", label: "لغو / مرجوع" },
];

export function OrdersTable({
  orders,
  products,
}: {
  orders: Order[];
  /** Catalogue used by the create/edit form's item picker. */
  products: Product[];
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<TabKey>("all");
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = React.useState<Order | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Order | null>(null);
  const [formSession, setFormSession] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    const needle = normalize(query);

    return orders.filter((order) => {
      if (tab === "active" && !ACTIVE.includes(order.status)) return false;
      if (tab === "delivered" && order.status !== "delivered") return false;
      if (tab === "cancelled" && !["cancelled", "returned"].includes(order.status)) return false;
      if (!needle) return true;

      return normalize(
        [order.code, order.customerName, order.customerPhone, order.address.city, order.address.province].join(" "),
      ).includes(needle);
    });
  }, [orders, tab, query]);

  React.useEffect(() => setPage(1), [tab, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const counts = {
    all: orders.length,
    active: orders.filter((order) => ACTIVE.includes(order.status)).length,
    delivered: orders.filter((order) => order.status === "delivered").length,
    cancelled: orders.filter((order) => ["cancelled", "returned"].includes(order.status)).length,
  };

  const allOnPageSelected = rows.length > 0 && rows.every((row) => selected.includes(row.code));

  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelected((state) => state.filter((code) => !rows.some((row) => row.code === code)));
    } else {
      setSelected((state) => [...new Set([...state, ...rows.map((row) => row.code)])]);
    }
  };

  const toggleOne = (code: string) =>
    setSelected((state) =>
      state.includes(code) ? state.filter((item) => item !== code) : [...state, code],
    );

  const run = async (action: () => Promise<{ ok: boolean; message: string }>): Promise<boolean> => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.ok) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
    return result.ok;
  };

  const openCreate = () => {
    setEditing(null);
    setFormSession((session) => session + 1);
    setFormOpen(true);
  };

  const openEdit = (order: Order) => {
    setEditing(order);
    setFormSession((session) => session + 1);
    setFormOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-line p-5">
          <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
            <TabsList className="flex-wrap">
              {TABS.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                  <span className="tnum ms-1.5 text-[0.62rem] text-mute">
                    {toPersianDigits(counts[item.value])}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-4">
            <div className="w-full sm:w-72">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                startIcon={<Search />}
                placeholder="جست‌وجوی کد سفارش، نام مشتری یا شهر…"
                className="h-11 text-xs"
              />
            </div>

            <SelectionPill count={selected.length} onClear={() => setSelected([])} />

            <BulkDeleteButton
              count={selected.length}
              entityLabel="سفارش"
              busy={busy}
              onConfirm={async () => {
                const ok = await run(() => deleteOrdersAction(selected));
                if (ok) setSelected([]);
                return ok;
              }}
            />

            <span className="tnum ms-auto text-[0.68rem] text-mute">
              {formatNumber(filtered.length)} سفارش
            </span>

            <Button type="button" variant="gold" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              سفارش جدید
            </Button>
          </div>
        </div>

        <Table>
          <THead>
            <TR>
              <TH className="w-10">
                <Checkbox
                  checked={allOnPageSelected}
                  onCheckedChange={toggleAll}
                  aria-label="انتخاب همه"
                />
              </TH>
              <TH>کد سفارش</TH>
              <TH>مشتری</TH>
              <TH>تاریخ</TH>
              <TH className="text-center">اقلام</TH>
              <TH className="text-center">مبلغ</TH>
              <TH>وضعیت</TH>
              <TH className="w-14 text-center">عملیات</TH>
            </TR>
          </THead>

          <TBody>
            {rows.map((order) => {
              const checked = selected.includes(order.code);

              return (
                <TR key={order.id} className={cn(checked && "bg-gold/[0.04]")}>
                  <TD>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleOne(order.code)}
                      aria-label={`انتخاب ${order.code}`}
                    />
                  </TD>

                  <TD>
                    <Link
                      href={`/admin/orders/${order.code}`}
                      className="tnum text-xs text-gold transition-colors duration-300 hover:text-gold-soft"
                    >
                      {order.code}
                    </Link>
                    <span className="mt-1 block text-[0.6rem] text-mute">
                      {order.trackingCode ? `کد رهگیری ${order.trackingCode}` : "بدون کد رهگیری"}
                    </span>
                  </TD>

                  <TD className="whitespace-normal">
                    <span className="flex flex-col gap-0.5">
                      <span className="text-xs text-ivory">{order.customerName}</span>
                      <span className="text-[0.62rem] text-mute">
                        {order.address.province}، {order.address.city}
                      </span>
                    </span>
                  </TD>

                  <TD className="text-[0.68rem] text-mute">{formatDate(order.createdAt)}</TD>

                  <TD className="tnum text-center text-ivory">
                    {toPersianDigits(order.items.reduce((sum, item) => sum + item.quantity, 0))}
                  </TD>

                  <TD className="tnum text-center text-ivory">{formatCompactPrice(order.total)}</TD>

                  <TD>
                    <OrderStatusBadge status={order.status} />
                  </TD>

                  <TD className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`عملیات ${order.code}`}
                          className="grid size-8 place-items-center rounded-md border border-line text-mute transition-colors duration-300 hover:border-ivory/25 hover:text-ivory"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/orders/${order.code}`}>
                            <Eye className="size-4" />
                            مشاهده جزئیات
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem onSelect={() => openEdit(order)}>
                          <Pencil className="size-4" />
                          ویرایش سفارش
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          variant="danger"
                          onSelect={() => setPendingDelete(order)}
                        >
                          <Trash2 className="size-4" />
                          حذف سفارش
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TD>
                </TR>
              );
            })}

            {rows.length === 0 ? (
              <TableEmpty
                colSpan={8}
                message={`سفارشی با این مشخصات پیدا نشد. ${
                  tab !== "all" ? `وضعیت «${ORDER_STATUS_META.delivered.label}» و سایر وضعیت‌ها را بررسی کنید.` : ""
                }`}
              />
            ) : null}
          </TBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line p-5">
          <TablePager
            page={current}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPageChange={setPage}
          />
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[0.68rem] text-mute transition-colors duration-300 hover:text-ivory"
          >
            بازگشت به داشبورد
            <ArrowLeft className="size-3.5" />
          </Link>
        </div>
      </Card>

      {/* Create / edit drawer */}
      <OrderForm
        key={formSession}
        open={formOpen}
        onOpenChange={setFormOpen}
        order={editing}
        products={products}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />

      {/* Single delete confirmation */}
      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (!open ? setPendingDelete(null) : null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف سفارش</DialogTitle>
            <DialogDescription>
              آیا از حذف سفارش {pendingDelete?.code} مطمئن هستید؟ اقلام و تاریخچه این سفارش نیز
              حذف می‌شود و این عملیات قابل بازگشت نیست.
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
                const ok = await run(() => deleteOrderAction(pendingDelete.code));
                if (ok) {
                  setSelected((state) => state.filter((code) => code !== pendingDelete.code));
                  setPendingDelete(null);
                }
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
