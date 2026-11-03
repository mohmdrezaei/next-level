"use client";

import * as React from "react";
import { PackageSearch, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderCard } from "./order-card";
import { isActiveOrder } from "@/features/orders/lib/status";
import { toPersianDigits } from "@/lib/format";
import { normalize } from "@/features/products/lib/query";
import type { Order } from "@/features/orders/types";

type TabKey = "all" | "active" | "delivered" | "cancelled";

const TABS: { value: TabKey; label: string }[] = [
  { value: "all", label: "همه سفارش‌ها" },
  { value: "active", label: "در جریان" },
  { value: "delivered", label: "تحویل‌شده" },
  { value: "cancelled", label: "لغو / مرجوع" },
];

export function OrdersExplorer({ orders }: { orders: Order[] }) {
  const [tab, setTab] = React.useState<TabKey>("all");
  const [query, setQuery] = React.useState("");
  const [allOrders, setAllOrders] = React.useState<Order[]>(orders);

  React.useEffect(() => {
    try {
      const stored: Order[] = JSON.parse(localStorage.getItem("nextlevel_placed_orders") || "[]");
      if (stored && Array.isArray(stored) && stored.length) {
        const existingCodes = new Set(orders.map((o) => o.code));
        const newOnes = stored.filter((o) => !existingCodes.has(o.code));
        if (newOnes.length) {
          setAllOrders([...newOnes, ...orders]);
          return;
        }
      }
    } catch {}
    setAllOrders(orders);
  }, [orders]);

  const filtered = React.useMemo(() => {
    const needle = normalize(query);
    return allOrders.filter((order) => {
      if (tab === "active" && !isActiveOrder(order.status)) return false;
      if (tab === "delivered" && order.status !== "delivered") return false;
      if (tab === "cancelled" && !["cancelled", "returned"].includes(order.status)) return false;
      if (!needle) return true;

      const haystack = [order.code, ...order.items.map((item) => item.name)].join(" ");
      return normalize(haystack).includes(needle);
    });
  }, [allOrders, tab, query]);

  const counts: Record<TabKey, number> = {
    all: allOrders.length,
    active: allOrders.filter((order) => isActiveOrder(order.status)).length,
    delivered: allOrders.filter((order) => order.status === "delivered").length,
    cancelled: allOrders.filter((order) => ["cancelled", "returned"].includes(order.status)).length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
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
              placeholder="جست‌وجو بر اساس کد سفارش یا نام کالا…"
              className="h-11 text-xs"
            />
          </div>

          <span className="tnum ms-auto text-[0.68rem] text-mute">
            {toPersianDigits(filtered.length)} سفارش
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<PackageSearch />}
          title="سفارشی با این مشخصات پیدا نشد"
          description="فیلتر وضعیت را تغییر دهید یا عبارت جست‌وجو را کوتاه‌تر کنید."
        />
      ) : (
        <ul className="flex flex-col gap-5">
          <AnimatePresence initial={false} mode="popLayout">
            {filtered.map((order, index) => (
              <motion.li
                key={order.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.34, delay: Math.min(index, 4) * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <OrderCard order={order} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
