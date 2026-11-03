/**
 * Dashboard analytics — the SQL equivalent of the demo build's
 * `features/admin/lib/metrics.ts`, computed against live order data.
 */
import { sql } from "drizzle-orm";

import { db } from "@/db";
import type { CategorySlug } from "@/features/products/types";
import type { Order } from "@/features/orders/types";

import { listOrders } from "./orders";

/** Orders that actually generate revenue. */
const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered"];
export const isRevenueOrder = (order: Order): boolean => REVENUE_STATUSES.includes(order.status);

/**
 * `array['paid', 'processing', …]` as a reusable, parameterised fragment.
 *
 * Drizzle's `sql` template expands a plain JS array into a parenthesised list
 * (`($1, $2, $3, $4)`), which Postgres parses as a ROW constructor — so
 * `status = any(${revenueStatusArray})` fails at runtime with
 * "op ANY/ALL (array) requires array on right side". Building an explicit
 * `array[…]` keeps the values parameterised *and* typed as `text[]`.
 */
const revenueStatusArray = sql`array[${sql.join(
  REVENUE_STATUSES.map((status) => sql`${status}`),
  sql`, `,
)}]`;

export interface Kpi {
  id: string;
  label: string;
  value: number;
  previous: number;
  format: "currency" | "number" | "percent";
  hint: string;
}

export function growthPercent(value: number, previous: number): number {
  if (previous === 0) return value > 0 ? 100 : 0;
  return ((value - previous) / previous) * 100;
}

interface WindowTotals {
  revenue: number;
  orders: number;
  customers: number;
}

async function windowTotals(fromDays: number, toDays: number): Promise<WindowTotals> {
  const rows = await db.execute<{ revenue: number; orders: number; customers: number }>(sql`
    select
      coalesce((
        select sum(total) from orders
        where status = any(${revenueStatusArray})
          and created_at >  now() - ${`${fromDays} days`}::interval
          and created_at <= now() - ${`${toDays} days`}::interval
      ), 0)::int as revenue,
      coalesce((
        select count(*) from orders
        where created_at >  now() - ${`${fromDays} days`}::interval
          and created_at <= now() - ${`${toDays} days`}::interval
      ), 0)::int as orders,
      coalesce((
        select count(*) from customers
        where joined_at >  now() - ${`${fromDays} days`}::interval
          and joined_at <= now() - ${`${toDays} days`}::interval
      ), 0)::int as customers
  `);

  const row = rows[0];
  return {
    revenue: Number(row?.revenue ?? 0),
    orders: Number(row?.orders ?? 0),
    customers: Number(row?.customers ?? 0),
  };
}

export async function computeKpis(): Promise<Kpi[]> {
  const [current, previous] = await Promise.all([windowTotals(30, 0), windowTotals(60, 30)]);

  const aov = current.orders ? current.revenue / current.orders : 0;
  const aovPrev = previous.orders ? previous.revenue / previous.orders : 0;

  return [
    {
      id: "revenue",
      label: "درآمد ۳۰ روز",
      value: current.revenue,
      previous: previous.revenue,
      format: "currency",
      hint: "مجموع سفارش‌های پرداخت‌شده",
    },
    {
      id: "orders",
      label: "تعداد سفارش",
      value: current.orders,
      previous: previous.orders,
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
      value: current.customers,
      previous: previous.customers,
      format: "number",
      hint: "ثبت‌نام در ۳۰ روز گذشته",
    },
  ];
}

export interface SeriesPoint {
  label: string;
  value: number;
  orders: number;
}

/** Daily revenue for the last `days` days, including empty days. */
export async function revenueSeries(days = 30): Promise<SeriesPoint[]> {
  const rows = await db.execute<{ label: string; value: number; orders: number }>(sql`
    select
      to_char(d.day, 'MM/DD') as label,
      coalesce(sum(o.total), 0)::int as value,
      count(o.id)::int as orders
    from generate_series(
      (current_date - (${days - 1} || ' days')::interval)::date,
      current_date,
      interval '1 day'
    ) as d(day)
    left join orders o
      on o.created_at::date = d.day
     and o.status = any(${revenueStatusArray})
    group by d.day
    order by d.day
  `);

  return rows.map((row) => ({
    label: String(row.label),
    value: Number(row.value),
    orders: Number(row.orders),
  }));
}

/** Monthly revenue for the last `months` months, labelled in the Persian calendar. */
export async function monthlyRevenueSeries(months = 6): Promise<SeriesPoint[]> {
  const rows = await db.execute<{ month: string; value: number; orders: number }>(sql`
    select
      to_char(date_trunc('month', o.created_at), 'YYYY-MM') as month,
      coalesce(sum(o.total), 0)::int as value,
      count(*)::int as orders
    from orders o
    where o.status = any(${revenueStatusArray})
      and o.created_at >= date_trunc('month', current_date) - (${months - 1} || ' months')::interval
    group by 1
    order by 1
  `);

  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long" });

  const byMonth = new Map(rows.map((row) => [String(row.month), row]));

  const series: SeriesPoint[] = [];
  const now = new Date();

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const row = byMonth.get(key);

    series.push({
      label: formatter.format(date),
      value: Number(row?.value ?? 0),
      orders: Number(row?.orders ?? 0),
    });
  }

  return series;
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

export async function topProducts(limit = 5): Promise<TopProduct[]> {
  const rows = await db.execute<{
    id: string;
    slug: string;
    name: string;
    latin_name: string;
    image: string;
    category: string;
    units: number;
    revenue: number;
  }>(sql`
    select
      oi.product_id as id,
      coalesce(p.slug, oi.slug) as slug,
      coalesce(p.name, oi.name) as name,
      coalesce(p.latin_name, oi.latin_name) as latin_name,
      coalesce(p.category, 'accessories') as category,
      coalesce(oi.image, '') as image,
      sum(oi.quantity)::int as units,
      sum(oi.price * oi.quantity)::int as revenue
    from order_items oi
    join orders o on o.id = oi.order_id
    left join products p on p.id = oi.product_id
    where o.status = any(${revenueStatusArray})
    group by oi.product_id, p.slug, p.name, p.latin_name, p.category, oi.slug, oi.name, oi.latin_name, oi.image
    order by revenue desc
    limit ${limit}
  `);

  return rows.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    latinName: String(row.latin_name),
    image: String(row.image),
    category: String(row.category) as CategorySlug,
    units: Number(row.units),
    revenue: Number(row.revenue),
  }));
}

export interface CategorySlice {
  slug: CategorySlug;
  title: string;
  units: number;
  revenue: number;
  share: number;
}

export async function categoryBreakdown(): Promise<CategorySlice[]> {
  const rows = await db.execute<{
    slug: string;
    title: string;
    units: number;
    revenue: number;
  }>(sql`
    select
      coalesce(p.category, 'accessories') as slug,
      coalesce(c.title, coalesce(p.category, 'accessories')) as title,
      sum(oi.quantity)::int as units,
      sum(oi.price * oi.quantity)::int as revenue
    from order_items oi
    join orders o on o.id = oi.order_id
    left join products p on p.id = oi.product_id
    left join categories c on c.slug = p.category
    where o.status = any(${revenueStatusArray})
    group by 1, 2
    order by revenue desc
  `);

  const grand = rows.reduce((sum, row) => sum + Number(row.revenue), 0) || 1;

  return rows.map((row) => ({
    slug: String(row.slug) as CategorySlug,
    title: String(row.title),
    units: Number(row.units),
    revenue: Number(row.revenue),
    share: (Number(row.revenue) / grand) * 100,
  }));
}

export interface StockAlert {
  id: string;
  slug: string;
  name: string;
  image: string;
  stock: number;
  status: "out" | "critical" | "low";
}

export async function stockAlerts(threshold = 40): Promise<StockAlert[]> {
  const rows = await db.execute<{
    id: string;
    slug: string;
    name: string;
    image: string;
    stock: number;
  }>(sql`
    select
      p.id,
      p.slug,
      p.name,
      coalesce((
        select i.src from product_images i
        where i.product_id = p.id
        order by i.position limit 1
      ), '') as image,
      coalesce(sum(v.stock), 0)::int as stock
    from products p
    left join product_variants v on v.product_id = p.id
    group by p.id, p.slug, p.name
    having coalesce(sum(v.stock), 0) < ${threshold}
    order by stock asc
  `);

  return rows.map((row) => {
    const stock = Number(row.stock);
    return {
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      image: String(row.image),
      stock,
      status: stock === 0 ? "out" : stock < 15 ? "critical" : "low",
    };
  });
}

export async function recentOrders(limit = 6): Promise<Order[]> {
  return listOrders({ limit });
}

export async function statusDistribution(): Promise<{ status: string; count: number }[]> {
  const rows = await db.execute<{ status: string; count: number }>(sql`
    select status, count(*)::int as count
    from orders
    group by status
    order by count desc
  `);

  return rows.map((row) => ({ status: String(row.status), count: Number(row.count) }));
}

export async function lowStockCount(threshold = 40): Promise<number> {
  return (await stockAlerts(threshold)).length;
}

export async function averageRating(): Promise<number> {
  const rows = await db.execute<{ value: number }>(sql`
    select coalesce(avg(rating), 0)::float as value from products
  `);
  return Number(rows[0]?.value ?? 0);
}

/** Everything the admin dashboard needs, in one round trip. */
export async function dashboard() {
  const [kpis, daily, monthly, top, categories, alerts, recent, statuses] = await Promise.all([
    computeKpis(),
    revenueSeries(30),
    monthlyRevenueSeries(6),
    topProducts(5),
    categoryBreakdown(),
    stockAlerts(),
    recentOrders(6),
    statusDistribution(),
  ]);

  return { kpis, daily, monthly, top, categories, alerts, recent, statuses };
}
