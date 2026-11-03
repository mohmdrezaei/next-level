"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { ORDER_STATUS_META } from "@/features/orders/lib/status";
import { formatCompactPrice, formatDate, formatNumber, toPersianDigits } from "@/lib/format";
import { normalize } from "@/features/products/lib/query";
import type { Order, OrderStatus } from "@/features/orders/types";

const PAGE_SIZE = 8;

type TabKey = "all" | "active" | "delivered" | "cancelled";

const ACTIVE: OrderStatus[] = ["pending", "paid", "processing", "shipped"];

const TABS: { value: TabKey; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "active", label: "در جریان" },
  { value: "delivered", label: "تحویل‌شده" },
  { value: "cancelled", label: "لغو / مرجوع" },
];

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [tab, setTab] = React.useState<TabKey>("all");
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);

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

  return (
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
          <div className="w-full sm:w-80">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              startIcon={<Search />}
              placeholder="جست‌وجوی کد سفارش، نام مشتری یا شهر…"
              className="h-11 text-xs"
            />
          </div>

          <span className="tnum ms-auto text-[0.68rem] text-mute">
            {formatNumber(filtered.length)} سفارش
          </span>
        </div>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>کد سفارش</TH>
            <TH>مشتری</TH>
            <TH>تاریخ</TH>
            <TH className="text-center">اقلام</TH>
            <TH className="text-center">مبلغ</TH>
            <TH>وضعیت</TH>
            <TH className="w-14 text-center">جزئیات</TH>
          </TR>
        </THead>

        <TBody>
          {rows.map((order) => (
            <TR key={order.id}>
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
                <Button asChild variant="ghost" size="icon-sm" aria-label={`مشاهده ${order.code}`}>
                  <Link href={`/admin/orders/${order.code}`}>
                    <Eye className="size-4" />
                  </Link>
                </Button>
              </TD>
            </TR>
          ))}

          {rows.length === 0 ? (
            <TableEmpty
              colSpan={7}
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
  );
}
