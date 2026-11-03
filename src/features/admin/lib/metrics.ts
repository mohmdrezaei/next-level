import { PRODUCTS, CATEGORY_MAP } from "@/features/products/data/catalog";
import type { CategorySlug } from "@/features/products/types";
import { CUSTOMERS, ORDERS } from "@/features/orders/data/orders";
import { productStock } from "@/features/products/lib/query";
import type { Order } from "@/features/orders/types";

const DAY = 86_400_000;
const REFERENCE = Date.parse("2026-09-26T12:00:00+03:30");

/** Orders that actually generate revenue. */
const REVENUE_STATUSES = new Set(["paid", "processing", "shipped", "delivered"]);
export const isRevenueOrder = (order: Order) => REVENUE_STATUSES.has(order.status);

export interface Kpi {
  id: string;
  label: string;
  value: number;
  previous: number;
  format: "currency" | "number" | "percent";
  hint: string;
}

function withinDays(dateIso: string, from: number, to: number): boolean {
  const time = Date.parse(dateIso);
  return time > REFERENCE - from * DAY && time <= REFERENCE - to * DAY;
}

export function computeKpis(): Kpi[] {
  const current = ORDERS.filter((order) => withinDays(order.createdAt, 30, 0));
  const previous = ORDERS.filter((order) => withinDays(order.createdAt, 60, 30));

  const sum = (list: Order[]) =>
    list.filter(isRevenueOrder).reduce((total, order) => total + order.total, 0);

  const revenue = sum(current);
  const revenuePrev = sum(previous);

  const ordersCount = current.length;
  const ordersPrev = previous.length;

  const aov = current.length ? revenue / current.length : 0;
  const aovPrev = previous.length ? revenuePrev / previous.length : 0;

  const newCustomers = CUSTOMERS.filter((customer) =>
    withinDays(customer.joinedAt, 30, 0),
  ).length;
  const newCustomersPrev = CUSTOMERS.filter((customer) =>
    withinDays(customer.joinedAt, 60, 30),
  ).length;

  return [
    {
      id: "revenue",
      label: "درآمد ۳۰ روز",
      value: revenue,
      previous: revenuePrev,
      format: "currency",
      hint: "مجموع سفارش‌های پرداخت‌شده",
    },
    {
      id: "orders",
      label: "تعداد سفارش",
      value: ordersCount,
      previous: ordersPrev,
      format: "number",
      hint: "همه سفارش‌های ثبت‌شده",
    },
    {
      id: "aov",
      label: "میانگین سبد",
      value: aov,
      previous: aovPrev,
      format: "currency",
      hint: "میانگین ارزش هر سفارش",
    },
    {
      id: "customers",
      label: "مشتری جدید",
      value: newCustomers,
      previous: newCustomersPrev,
      format: "number",
      hint: "ثبت‌نام در ۳۰ روز گذشته",
    },
  ];
}

export function growthPercent(value: number, previous: number): number {
  if (previous === 0) return value > 0 ? 100 : 0;
  return ((value - previous) / previous) * 100;
}

export interface SeriesPoint {
  label: string;
  value: number;
  orders: number;
}

/** Daily revenue for the last `days` days. */
export function revenueSeries(days = 30): SeriesPoint[] {
  const buckets = new Map<string, { value: number; orders: number }>();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(REFERENCE - index * DAY);
    const key = `${date.getMonth() + 1}/${date.getDate()}`;
    buckets.set(key, { value: 0, orders: 0 });
  }

  for (const order of ORDERS) {
    if (!isRevenueOrder(order)) continue;
    const time = Date.parse(order.createdAt);
    if (time < REFERENCE - days * DAY) continue;
    const date = new Date(time);
    const key = `${date.getMonth() + 1}/${date.getDate()}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.value += order.total;
      bucket.orders += 1;
    }
  }

  return [...buckets].map(([label, bucket]) => ({ label, ...bucket }));
}

/** Monthly revenue for the last `months` months. */
export function monthlyRevenueSeries(months = 6): SeriesPoint[] {
  const monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  const buckets = new Map<string, { value: number; orders: number }>();

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(REFERENCE - index * 30.4 * DAY);
    buckets.set(monthNames[date.getMonth()], { value: 0, orders: 0 });
  }

  for (const order of ORDERS) {
    if (!isRevenueOrder(order)) continue;
    const date = new Date(Date.parse(order.createdAt));
    const label = monthNames[date.getMonth()];
    const bucket = buckets.get(label);
    if (bucket) {
      bucket.value += order.total;
      bucket.orders += 1;
    }
  }

  return [...buckets].map(([label, bucket]) => ({ label, ...bucket }));
}

export interface TopProduct {
  id: string;
  slug: string;
  name: string;
  latinName: string;
  image: string;
  units: number;
  revenue: number;
  category: CategorySlug;
}

export function topProducts(limit = 5): TopProduct[] {
  const totals = new Map<string, { units: number; revenue: number }>();

  for (const order of ORDERS) {
    if (!isRevenueOrder(order)) continue;
    for (const item of order.items) {
      const existing = totals.get(item.productId) ?? { units: 0, revenue: 0 };
      totals.set(item.productId, {
        units: existing.units + item.quantity,
        revenue: existing.revenue + item.price * item.quantity,
      });
    }
  }

  return [...totals]
    .map(([id, value]) => {
      const product = PRODUCTS.find((item) => item.id === id);
      return {
        id,
        slug: product?.slug ?? "",
        name: product?.name ?? "—",
        latinName: product?.latinName ?? "—",
        image: product?.images[0]?.src ?? "",
        category: product?.category ?? "accessories",
        ...value,
      } as TopProduct;
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export interface CategorySlice {
  slug: CategorySlug;
  title: string;
  units: number;
  revenue: number;
  share: number;
}

export function categoryBreakdown(): CategorySlice[] {
  const totals = new Map<CategorySlug, { units: number; revenue: number }>();

  for (const order of ORDERS) {
    if (!isRevenueOrder(order)) continue;
    for (const item of order.items) {
      const product = PRODUCTS.find((entry) => entry.id === item.productId);
      if (!product) continue;
      const existing = totals.get(product.category) ?? { units: 0, revenue: 0 };
      totals.set(product.category, {
        units: existing.units + item.quantity,
        revenue: existing.revenue + item.price * item.quantity,
      });
    }
  }

  const grand = [...totals.values()].reduce((sum, value) => sum + value.revenue, 0) || 1;

  return [...totals]
    .map(([slug, value]) => ({
      slug,
      title: CATEGORY_MAP[slug]?.title ?? slug,
      ...value,
      share: (value.revenue / grand) * 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export interface StockAlert {
  id: string;
  slug: string;
  name: string;
  image: string;
  stock: number;
  status: "out" | "critical" | "low";
}

export function stockAlerts(): StockAlert[] {
  return PRODUCTS.map((product) => ({ product, stock: productStock(product) }))
    .filter((entry) => entry.stock < 40)
    .map(
      ({ product, stock }): StockAlert => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.src ?? "",
        stock,
        status: stock === 0 ? "out" : stock < 15 ? "critical" : "low",
      }),
    )
    .sort((a, b) => a.stock - b.stock);
}

export function recentOrders(limit = 6): Order[] {
  return ORDERS.slice(0, limit);
}

export function statusDistribution(): { status: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const order of ORDERS) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
  }
  return [...counts].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
}

export function lowStockCount(): number {
  return stockAlerts().length;
}

export function averageRating(): number {
  return PRODUCTS.reduce((sum, product) => sum + product.rating, 0) / (PRODUCTS.length || 1);
}
