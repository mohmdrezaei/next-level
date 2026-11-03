/**
 * Order repository — reads, the checkout write path, and status transitions.
 *
 * Orders are immutable history: line items and the shipping address are
 * snapshots, and totals are always recomputed on the server so a client can
 * never dictate the price it pays.
 */
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { orderEvents, orderItems, orders } from "@/db/schema";
import type {
  Order,
  OrderAddress,
  OrderEvent,
  OrderItem,
  OrderStatus,
} from "@/features/orders/types";
import {
  FREE_SHIPPING_THRESHOLD,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
  TAX_RATE,
  type PaymentMethodId,
  type ShippingMethodId,
} from "@/lib/constants";

import { ApiError, badRequest, notFound } from "../http";
import { newId } from "../ids";
import { containsPattern } from "../sql";
import { validateCoupon } from "./coupons";
import { applyOrderToCustomer } from "./customers";
import { getProductsByIds } from "./products";
import { ensureCustomerForUser } from "./users";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const ORDER_NOTES: Record<OrderStatus, string> = {
  pending: "سفارش ثبت شد و در انتظار پرداخت است.",
  paid: "پرداخت با موفقیت تأیید شد.",
  processing: "سفارش در آتلیه بسته‌بندی و بازرسی شد.",
  shipped: "سفارش تحویل شرکت حمل شد.",
  delivered: "سفارش تحویل مشتری شد.",
  cancelled: "سفارش لغو شد و مبلغ بازگردانده شد.",
  returned: "کالا مرجوع شد و مبلغ عودت داده شد.",
};

type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;
type OrderEventRow = typeof orderEvents.$inferSelect;

/* -------------------------------------------------------------------------- */
/*  Mapping                                                                   */
/* -------------------------------------------------------------------------- */

function mapItem(row: OrderItemRow): OrderItem {
  return {
    productId: row.productId,
    slug: row.slug,
    name: row.name,
    latinName: row.latinName,
    image: row.image,
    size: row.size,
    color: row.color,
    price: row.price,
    quantity: row.quantity,
  };
}

function mapEvent(row: OrderEventRow): OrderEvent {
  return {
    status: row.status as OrderStatus,
    at: row.at.toISOString(),
    note: row.note,
  };
}

function mapOrder(row: OrderRow, items: OrderItemRow[], timeline: OrderEventRow[]): Order {
  const address: OrderAddress = {
    fullName: row.addressFullName,
    phone: row.addressPhone,
    province: row.addressProvince,
    city: row.addressCity,
    line1: row.addressLine1,
    postalCode: row.addressPostalCode,
  };

  return {
    id: row.id,
    code: row.code,
    createdAt: row.createdAt.toISOString(),
    status: row.status as OrderStatus,
    customerId: row.customerId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    items: items.map(mapItem),
    subtotal: row.subtotal,
    discount: row.discount,
    shipping: row.shipping,
    tax: row.tax,
    total: row.total,
    shippingMethod: row.shippingMethod as ShippingMethodId,
    paymentMethod: row.paymentMethod as PaymentMethodId,
    address,
    timeline: timeline.map(mapEvent),
    trackingCode: row.trackingCode,
    hasReview: row.hasReview,
  };
}

async function hydrateOrders(rows: OrderRow[]): Promise<Order[]> {
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id);

  const [items, events] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, ids))
      .orderBy(asc(orderItems.orderId), asc(orderItems.position)),
    db
      .select()
      .from(orderEvents)
      .where(inArray(orderEvents.orderId, ids))
      .orderBy(asc(orderEvents.orderId), asc(orderEvents.position)),
  ]);

  const groupBy = <T extends { orderId: string }>(list: T[]) => {
    const map = new Map<string, T[]>();
    for (const entry of list) {
      const bucket = map.get(entry.orderId);
      if (bucket) bucket.push(entry);
      else map.set(entry.orderId, [entry]);
    }
    return map;
  };

  const itemMap = groupBy(items);
  const eventMap = groupBy(events);

  return rows.map((row) => mapOrder(row, itemMap.get(row.id) ?? [], eventMap.get(row.id) ?? []));
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                     */
/* -------------------------------------------------------------------------- */

export interface OrderQuery {
  customerId?: string;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

function buildConditions(query: OrderQuery) {
  const conditions = [];

  if (query.customerId) conditions.push(eq(orders.customerId, query.customerId));
  if (query.status) conditions.push(eq(orders.status, query.status));

  if (query.q?.trim()) {
    const needle = containsPattern(query.q.trim());
    conditions.push(
      or(
        ilike(orders.code, needle),
        ilike(orders.customerName, needle),
        ilike(orders.customerPhone, needle),
        ilike(orders.customerEmail, needle),
      ),
    );
  }

  if (query.from) conditions.push(gte(orders.createdAt, new Date(query.from)));
  if (query.to) conditions.push(lte(orders.createdAt, new Date(query.to)));

  return conditions;
}

export async function listOrders(query: OrderQuery = {}): Promise<Order[]> {
  const conditions = buildConditions(query);

  const rows = await db
    .select()
    .from(orders)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(query.limit ?? 100)
    .offset(query.offset ?? 0);

  return hydrateOrders(rows);
}

export async function countOrders(query: OrderQuery = {}): Promise<number> {
  const conditions = buildConditions(query);

  const rows = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(orders)
    .where(conditions.length ? and(...conditions) : undefined);

  return rows[0]?.value ?? 0;
}

export async function getOrderByCode(code: string): Promise<Order | null> {
  const rows = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
  return rows.length ? (await hydrateOrders(rows))[0] : null;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows.length ? (await hydrateOrders(rows))[0] : null;
}

export async function listOrdersForCustomer(customerId: string): Promise<Order[]> {
  return listOrders({ customerId, limit: 200 });
}

/**
 * Statuses that represent a real, fulfilled purchase. A `pending` order has not
 * been paid for, and `cancelled`/`returned` ones were undone.
 */
const PURCHASED_STATUSES: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

/**
 * Did this customer actually buy this product?
 *
 * Backs the "verified purchase" badge on reviews. Deriving the badge from the
 * order ledger — instead of trusting the client, or flagging every signed-in
 * reviewer — is what makes it worth displaying.
 */
export async function hasPurchasedProduct(customerId: string, productId: string): Promise<boolean> {
  if (!customerId || !productId) return false;

  const rows = await db
    .select({ id: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.customerId, customerId),
        eq(orderItems.productId, productId),
        inArray(orders.status, PURCHASED_STATUSES),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

/**
 * Orders belonging to a signed-in user, via their customer ledger row.
 * Used by the account area, which only knows the session user id.
 */
export async function listOrdersForUser(userId: string): Promise<Order[]> {
  const customerId = await ensureCustomerForUser(userId);
  return customerId ? listOrdersForCustomer(customerId) : [];
}

/* -------------------------------------------------------------------------- */
/*  Checkout                                                                  */
/* -------------------------------------------------------------------------- */

export interface OrderItemInput {
  productId: string;
  size?: string;
  color?: string;
  quantity?: number;
}

export interface OrderInput {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: OrderItemInput[];
  address: OrderAddress;
  shippingMethod?: ShippingMethodId;
  paymentMethod?: PaymentMethodId;
  couponCode?: string | null;
  status?: OrderStatus;
}

async function nextOrderCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = `NR-${Math.floor(10_000 + Math.random() * 89_999)}`;
    const existing = await db.select({ id: orders.id }).from(orders).where(eq(orders.code, code)).limit(1);
    if (!existing.length) return code;
  }
  throw new ApiError(500, "تولید کد سفارش ناموفق بود.");
}

export interface PricedCart {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingMethod: ShippingMethodId;
  couponCode: string | null;
  couponLabel: string | null;
}

/**
 * Recompute a cart against live catalogue prices. Shared by `POST /api/cart/price`
 * and the checkout write path so the client and server never disagree.
 */
export async function priceCart(input: {
  items: OrderItemInput[];
  shippingMethod?: ShippingMethodId;
  couponCode?: string | null;
}): Promise<PricedCart> {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw badRequest("سبد خرید خالی است.", { field: "items" });
  }

  const ids = [...new Set(input.items.map((item) => String(item.productId ?? "").trim()).filter(Boolean))];
  if (!ids.length) throw badRequest("شناسهٔ محصولات سبد خرید معتبر نیست.", { field: "items" });

  const catalogue = await getProductsByIds(ids);
  const byId = new Map(catalogue.map((product) => [product.id, product]));

  const items: OrderItem[] = [];

  for (const line of input.items) {
    const productId = String(line.productId ?? "").trim();
    const product = byId.get(productId);
    if (!product) throw badRequest(`محصول ${productId} در فهرست محصولات نیست.`, { field: "items" });

    // Mirror the storefront's default: prefer a size that is actually in stock.
    const fallbackSize =
      product.variants.find((candidate) => candidate.stock > 0)?.size ??
      product.variants[0]?.size ??
      "ONE";

    const size = line.size?.trim() || fallbackSize;
    const variant = product.variants.find((candidate) => candidate.size === size);
    const quantity = Math.max(1, Math.floor(Number(line.quantity ?? 1)));

    if (variant && variant.stock <= 0) {
      throw badRequest(`سایز ${size} از «${product.name}» موجود نیست.`, { field: "items" });
    }
    if (variant && quantity > variant.stock) {
      throw badRequest(
        `از «${product.name}» تنها ${variant.stock} عدد در سایز ${size} موجود است.`,
        { field: "items" },
      );
    }

    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      latinName: product.latinName,
      image: product.images[0]?.src ?? "",
      size,
      color: line.color?.trim() || product.colors[0]?.name || "",
      price: product.price,
      quantity,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const shippingMethodId: ShippingMethodId =
    input.shippingMethod && SHIPPING_METHODS.some((method) => method.id === input.shippingMethod)
      ? input.shippingMethod
      : "standard";

  const method = SHIPPING_METHODS.find((entry) => entry.id === shippingMethodId) ?? SHIPPING_METHODS[0];

  let discount = 0;
  let freeShipping = false;
  let couponCode: string | null = null;
  let couponLabel: string | null = null;

  if (input.couponCode?.trim()) {
    const { coupon, error } = await validateCoupon(input.couponCode, subtotal);
    if (error || !coupon) throw badRequest(error ?? "کد تخفیف معتبر نیست.", { field: "couponCode" });

    discount = Math.round(subtotal * coupon.rate);
    freeShipping = Boolean(coupon.freeShipping);
    couponCode = coupon.code;
    couponLabel = coupon.label;
  }

  const payable = subtotal - discount;
  const shipping = freeShipping || payable >= FREE_SHIPPING_THRESHOLD ? 0 : method.price;
  const tax = Math.round(payable * TAX_RATE);

  return {
    items,
    subtotal,
    discount,
    shipping,
    tax,
    total: payable + shipping + tax,
    shippingMethod: shippingMethodId,
    couponCode,
    couponLabel,
  };
}

export async function createOrder(input: OrderInput): Promise<Order> {
  if (!input.address || typeof input.address !== "object") {
    throw badRequest("نشانی ارسال سفارش الزامی است.", { field: "address" });
  }
  if (!input.address.fullName?.trim() || !input.address.line1?.trim()) {
    throw badRequest("نام گیرنده و نشانی سفارش الزامی است.", { field: "address" });
  }

  const priced = await priceCart({
    items: input.items,
    shippingMethod: input.shippingMethod,
    couponCode: input.couponCode,
  });

  const paymentMethod: PaymentMethodId =
    input.paymentMethod && PAYMENT_METHODS.some((method) => method.id === input.paymentMethod)
      ? input.paymentMethod
      : "gateway";

  const status: OrderStatus = input.status && ORDER_STATUSES.includes(input.status) ? input.status : "pending";

  const id = newId("o");
  const code = await nextOrderCode();
  const createdAt = new Date();

  await db.insert(orders).values({
    id,
    code,
    createdAt,
    status,
    customerId: input.customerId ?? "",
    customerName: input.customerName?.trim() || input.address.fullName.trim(),
    customerPhone: input.customerPhone?.trim() || input.address.phone?.trim() || "",
    customerEmail: input.customerEmail?.trim() || "",
    subtotal: priced.subtotal,
    discount: priced.discount,
    shipping: priced.shipping,
    tax: priced.tax,
    total: priced.total,
    shippingMethod: priced.shippingMethod,
    paymentMethod,
    addressFullName: input.address.fullName.trim(),
    addressPhone: input.address.phone?.trim() ?? "",
    addressProvince: input.address.province?.trim() ?? "",
    addressCity: input.address.city?.trim() ?? "",
    addressLine1: input.address.line1.trim(),
    addressPostalCode: input.address.postalCode?.trim() ?? "",
    trackingCode: null,
    hasReview: false,
  });

  await db.insert(orderItems).values(
    priced.items.map((item, index) => ({
      orderId: id,
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      latinName: item.latinName,
      image: item.image,
      size: item.size,
      color: item.color,
      price: item.price,
      quantity: item.quantity,
      position: index,
    })),
  );

  await db.insert(orderEvents).values({
    orderId: id,
    status,
    at: createdAt,
    note: ORDER_NOTES[status],
    position: 0,
  });

  if (input.customerId) {
    await applyOrderToCustomer(input.customerId, priced.total, createdAt);
  }

  const created = await getOrderById(id);
  if (!created) throw notFound("سفارش ایجاد شد اما بازخوانی نشد.");
  return created;
}

/* -------------------------------------------------------------------------- */
/*  Status transitions                                                        */
/* -------------------------------------------------------------------------- */

export async function changeOrderStatus(code: string, status: OrderStatus): Promise<Order> {
  if (!ORDER_STATUSES.includes(status)) {
    throw badRequest("وضعیت سفارش معتبر نیست.", { field: "status" });
  }

  const rows = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
  const order = rows[0];
  if (!order) throw notFound("سفارش مورد نظر یافت نشد.");
  if (order.status === status) throw badRequest("وضعیت سفارش از قبل همین بوده است.");

  const positionRows = await db
    .select({ value: sql<number>`coalesce(max(${orderEvents.position}), -1)::int` })
    .from(orderEvents)
    .where(eq(orderEvents.orderId, order.id));

  await db.insert(orderEvents).values({
    orderId: order.id,
    status,
    at: new Date(),
    note: ORDER_NOTES[status],
    position: (positionRows[0]?.value ?? -1) + 1,
  });

  const trackingCode =
    order.trackingCode ?? (["shipped", "delivered"].includes(status) ? `IR${Math.floor(900000 + Math.random() * 99999)}` : null);

  await db.update(orders).set({ status, trackingCode }).where(eq(orders.id, order.id));

  const updated = await getOrderByCode(code);
  if (!updated) throw notFound("سفارش مورد نظر یافت نشد.");
  return updated;
}

export async function deleteOrder(code: string): Promise<Order> {
  const existing = await getOrderByCode(code);
  if (!existing) throw notFound("سفارش مورد نظر یافت نشد.");

  await db.delete(orders).where(eq(orders.code, code));
  return existing;
}
