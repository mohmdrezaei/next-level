/**
 * Order repository — reads, the checkout write path, and status transitions,
 * with resilient database and memory store fallback.
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
import { DEMO_ORDERS, ORDERS } from "@/features/orders/data/orders";
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
import { cleanPhone } from "../phone";
import { validateCoupon } from "./coupons";
import { applyOrderToCustomer } from "./customers";
import { getProductsByIds } from "./products";
import { getUserById } from "./users";
import { getSettings } from "./settings";

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
  processing: "سفارش در بوتیک بسته‌بندی و بازرسی شد.",
  shipped: "سفارش تحویل شرکت حمل شد.",
  delivered: "سفارش تحویل مشتری شد.",
  cancelled: "سفارش لغو شد و مبلغ بازگردانده شد.",
  returned: "کالا مرجوع شد و مبلغ عودت داده شد.",
};

type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;
type OrderEventRow = typeof orderEvents.$inferSelect;

declare global {
  // eslint-disable-next-line no-var
  var __memoryOrders: Map<string, Order> | undefined;
  // eslint-disable-next-line no-var
  var __memoryOrdersByCode: Map<string, Order> | undefined;
}

function getMemoryOrders(): Map<string, Order> {
  if (!globalThis.__memoryOrders) {
    globalThis.__memoryOrders = new Map<string, Order>(ORDERS.map((o) => [o.id, { ...o }]));
  }
  return globalThis.__memoryOrders;
}

function getMemoryOrdersByCode(): Map<string, Order> {
  if (!globalThis.__memoryOrdersByCode) {
    globalThis.__memoryOrdersByCode = new Map<string, Order>(
      Array.from(getMemoryOrders().values()).map((o) => [o.code, o]),
    );
  }
  return globalThis.__memoryOrdersByCode;
}

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

  try {
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
  } catch {
    return [];
  }
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
  const results: Order[] = [];
  const seenCodes = new Set<string>();

  // 1. Check memory orders
  for (const o of getMemoryOrders().values()) {
    if (query.status && o.status !== query.status) continue;
    if (query.customerId && o.customerId !== query.customerId) continue;
    if (query.q?.trim()) {
      const needle = query.q.trim().toLowerCase();
      const haystack = [
        o.code,
        o.customerName,
        o.customerPhone,
        o.customerEmail,
        o.address.city,
        o.address.province,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) continue;
    }
    seenCodes.add(o.code);
    results.push(o);
  }

  // 2. Query DB if connected
  try {
    const conditions = buildConditions(query);
    const rows = await db
      .select()
      .from(orders)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(query.limit ?? 100)
      .offset(query.offset ?? 0);

    const hydrated = await hydrateOrders(rows);
    for (const h of hydrated) {
      if (!seenCodes.has(h.code)) {
        seenCodes.add(h.code);
        results.push(h);
      }
    }
  } catch {
    // DB offline
  }

  return results
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 100));
}

export async function countOrders(query: OrderQuery = {}): Promise<number> {
  const list = await listOrders(query);
  return list.length;
}

export async function getOrderByCode(code: string): Promise<Order | null> {
  const mem = getMemoryOrdersByCode().get(code);
  if (mem) return mem;

  try {
    const rows = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
    if (rows.length) {
      const hydrated = await hydrateOrders(rows);
      if (hydrated[0]) return hydrated[0];
    }
  } catch {
    // DB offline
  }

  const demoMatch = ORDERS.find((o) => o.code === code);
  return demoMatch ?? null;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const mem = getMemoryOrders().get(id);
  if (mem) return mem;

  try {
    const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (rows.length) {
      const hydrated = await hydrateOrders(rows);
      if (hydrated[0]) return hydrated[0];
    }
  } catch {
    // DB offline
  }

  const demoMatch = ORDERS.find((o) => o.id === id);
  return demoMatch ?? null;
}

export async function listOrdersForCustomer(customerId: string): Promise<Order[]> {
  return listOrders({ customerId, limit: 200 });
}

const PURCHASED_STATUSES: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

export async function hasPurchasedProduct(customerId: string, productId: string): Promise<boolean> {
  if (!customerId || !productId) return false;

  for (const order of getMemoryOrders().values()) {
    if (order.customerId === customerId && PURCHASED_STATUSES.includes(order.status)) {
      if (order.items.some((item) => item.productId === productId)) return true;
    }
  }

  try {
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
  } catch {
    return false;
  }
}

/**
 * Orders belonging to a signed-in user, via their customerId or phone number.
 * Used by the account area (`/account/orders`).
 */
export async function listOrdersForUser(userId: string): Promise<Order[]> {
  const user = await getUserById(userId);
  const customerId = user?.customerId;
  const userPhone = user ? cleanPhone(user.phone) : "";
  const userEmail = user?.email?.toLowerCase();

  const matched: Order[] = [];
  const seenCodes = new Set<string>();

  // 1. Check memory orders (recent orders placed in this session)
  for (const order of getMemoryOrders().values()) {
    const orderPhone = cleanPhone(order.customerPhone || order.address.phone);
    const isOwner =
      (customerId && order.customerId === customerId) ||
      (userPhone && orderPhone === userPhone) ||
      (userEmail && order.customerEmail.toLowerCase() === userEmail);

    if (isOwner && !seenCodes.has(order.code)) {
      seenCodes.add(order.code);
      matched.push(order);
    }
  }

  // 2. Try DB if connected
  try {
    if (customerId) {
      const dbOrders = await listOrdersForCustomer(customerId);
      for (const order of dbOrders) {
        if (!seenCodes.has(order.code)) {
          seenCodes.add(order.code);
          matched.push(order);
        }
      }
    }
  } catch {
    // DB offline
  }

  // 3. For demo user or if no orders found, include DEMO_ORDERS
  if (userId === "u_demo" || matched.length === 0) {
    for (const o of DEMO_ORDERS) {
      if (!seenCodes.has(o.code)) {
        seenCodes.add(o.code);
        matched.push(o);
      }
    }
  }

  return matched.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
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
    if (getMemoryOrdersByCode().has(code)) continue;

    try {
      const existing = await db.select({ id: orders.id }).from(orders).where(eq(orders.code, code)).limit(1);
      if (!existing.length) return code;
    } catch {
      return code;
    }
  }
  return `NR-${Math.floor(10_000 + Math.random() * 89_999)}`;
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

export interface PriceCartOptions {
  /**
   * When `false` the catalogue stock limits are ignored. Used by the admin
   * panel, where an operator may legitimately record an order for a size that
   * is momentarily out of stock.
   */
  enforceStock?: boolean;
}

export async function priceCart(
  input: {
    items: OrderItemInput[];
    shippingMethod?: ShippingMethodId;
    couponCode?: string | null;
  },
  options: PriceCartOptions = {},
): Promise<PricedCart> {
  const enforceStock = options.enforceStock !== false;
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

    const fallbackSize =
      product.variants.find((candidate) => candidate.stock > 0)?.size ??
      product.variants[0]?.size ??
      "ONE";

    const size = line.size?.trim() || fallbackSize;
    const variant = product.variants.find((candidate) => candidate.size === size);
    const quantity = Math.max(1, Math.floor(Number(line.quantity ?? 1)));

    if (enforceStock && variant && variant.stock <= 0) {
      throw badRequest(`سایز ${size} از «${product.name}» موجود نیست.`, { field: "items" });
    }
    if (enforceStock && variant && quantity > variant.stock) {
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

  const settings = await getSettings();
  const standardPrice = settings.standardShipping ?? 149_000;
  const expressPrice = settings.expressShipping ?? 349_000;
  const freeThreshold = settings.freeShipping ?? FREE_SHIPPING_THRESHOLD;
  const taxRate = (settings.taxRate ?? 9) / 100;

  const payable = Math.max(0, subtotal - discount);
  const methodPrice = shippingMethodId === "express" ? expressPrice : standardPrice;
  const shipping = freeShipping || payable >= freeThreshold ? 0 : methodPrice;
  const tax = Math.round(payable * taxRate);

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

export interface CreateOrderOptions {
  /**
   * When `false` the storefront availability rules (e.g. COD being disabled)
   * are skipped. The admin panel uses this to record manual orders.
   */
  enforceSettings?: boolean;
}

export async function createOrder(
  input: OrderInput,
  options: CreateOrderOptions = {},
): Promise<Order> {
  if (!input.address || typeof input.address !== "object") {
    throw badRequest("نشانی ارسال سفارش الزامی است.", { field: "address" });
  }
  if (!input.address.fullName?.trim() || !input.address.line1?.trim()) {
    throw badRequest("نام گیرنده و نشانی سفارش الزامی است.", { field: "address" });
  }

  const settings = await getSettings();

  const priced = await priceCart({
    items: input.items,
    shippingMethod: input.shippingMethod,
    couponCode: input.couponCode,
  });

  const paymentMethod: PaymentMethodId =
    input.paymentMethod && PAYMENT_METHODS.some((method) => method.id === input.paymentMethod)
      ? input.paymentMethod
      : "gateway";

  if (options.enforceSettings !== false && paymentMethod === "cod" && !settings.enableCod) {
    throw badRequest("پرداخت در محل در حال حاضر غیرفعال است.", { field: "paymentMethod" });
  }

  const status: OrderStatus = input.status && ORDER_STATUSES.includes(input.status) ? input.status : "pending";

  const id = newId("o");
  const code = await nextOrderCode();
  const createdAt = new Date();

  const customerName = input.customerName?.trim() || input.address.fullName.trim();
  const customerPhone = input.customerPhone?.trim() || input.address.phone?.trim() || "";
  const customerEmail = input.customerEmail?.trim() || "";

  const createdOrder: Order = {
    id,
    code,
    createdAt: createdAt.toISOString(),
    status,
    customerId: input.customerId ?? "",
    customerName,
    customerPhone,
    customerEmail,
    items: priced.items,
    subtotal: priced.subtotal,
    discount: priced.discount,
    shipping: priced.shipping,
    tax: priced.tax,
    total: priced.total,
    shippingMethod: priced.shippingMethod,
    paymentMethod,
    address: {
      fullName: input.address.fullName.trim(),
      phone: input.address.phone?.trim() ?? "",
      province: input.address.province?.trim() ?? "",
      city: input.address.city?.trim() ?? "",
      line1: input.address.line1.trim(),
      postalCode: input.address.postalCode?.trim() ?? "",
    },
    timeline: [
      {
        status,
        at: createdAt.toISOString(),
        note: ORDER_NOTES[status],
      },
    ],
    trackingCode: null,
    hasReview: false,
  };

  // 1. Always record in memory store
  getMemoryOrders().set(id, createdOrder);
  getMemoryOrdersByCode().set(code, createdOrder);

  // 2. Attempt PostgreSQL write
  try {
    await db.insert(orders).values({
      id,
      code,
      createdAt,
      status,
      customerId: input.customerId ?? "",
      customerName,
      customerPhone,
      customerEmail,
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
      await applyOrderToCustomer(input.customerId, priced.total, createdAt).catch(() => {});
    }
  } catch {
    // Database offline fallback
  }

  return createdOrder;
}

/* -------------------------------------------------------------------------- */
/*  Admin edits                                                               */
/* -------------------------------------------------------------------------- */

export interface AdminOrderInput {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  address: OrderAddress;
  status: OrderStatus;
  shippingMethod?: ShippingMethodId;
  paymentMethod?: PaymentMethodId;
  /** When present the line items are replaced and the invoice is repriced. */
  items?: OrderItemInput[];
  trackingCode?: string | null;
}

async function nextEventPosition(orderId: string): Promise<number> {
  try {
    const rows = await db
      .select({ position: orderEvents.position })
      .from(orderEvents)
      .where(eq(orderEvents.orderId, orderId));
    return rows.reduce((max, row) => Math.max(max, row.position), -1) + 1;
  } catch {
    return 0;
  }
}

export async function updateOrder(code: string, input: AdminOrderInput): Promise<Order> {
  const existing = await getOrderByCode(code);
  if (!existing) throw notFound("سفارش مورد نظر یافت نشد.");

  const address: OrderAddress = {
    fullName: input.address.fullName?.trim() ?? "",
    phone: input.address.phone?.trim() ?? "",
    province: input.address.province?.trim() ?? "",
    city: input.address.city?.trim() ?? "",
    line1: input.address.line1?.trim() ?? "",
    postalCode: input.address.postalCode?.trim() ?? "",
  };
  if (!address.fullName || !address.line1) {
    throw badRequest("نام گیرنده و نشانی سفارش الزامی است.", { field: "address" });
  }

  const status: OrderStatus = ORDER_STATUSES.includes(input.status)
    ? input.status
    : existing.status;

  let priced: PricedCart | null = null;
  if (Array.isArray(input.items) && input.items.length > 0) {
    priced = await priceCart(
      { items: input.items, shippingMethod: input.shippingMethod ?? existing.shippingMethod },
      { enforceStock: false },
    );
  }

  const paymentMethod: PaymentMethodId =
    input.paymentMethod && PAYMENT_METHODS.some((method) => method.id === input.paymentMethod)
      ? input.paymentMethod
      : existing.paymentMethod;

  const trackingCode =
    input.trackingCode === undefined
      ? existing.trackingCode
      : input.trackingCode?.trim() || null;

  const timeline = [...existing.timeline];
  const statusChanged = status !== existing.status;
  if (statusChanged) {
    timeline.push({ status, at: new Date().toISOString(), note: ORDER_NOTES[status] });
  }

  const updated: Order = {
    ...existing,
    customerName: input.customerName?.trim() || address.fullName,
    customerPhone: input.customerPhone?.trim() ?? existing.customerPhone,
    customerEmail: input.customerEmail?.trim() ?? existing.customerEmail,
    address,
    status,
    shippingMethod: priced ? priced.shippingMethod : existing.shippingMethod,
    paymentMethod,
    items: priced ? priced.items : existing.items,
    subtotal: priced ? priced.subtotal : existing.subtotal,
    discount: priced ? priced.discount : existing.discount,
    shipping: priced ? priced.shipping : existing.shipping,
    tax: priced ? priced.tax : existing.tax,
    total: priced ? priced.total : existing.total,
    trackingCode,
    timeline,
  };

  getMemoryOrders().set(existing.id, updated);
  getMemoryOrdersByCode().set(code, updated);

  try {
    await db
      .update(orders)
      .set({
        customerName: updated.customerName,
        customerPhone: updated.customerPhone,
        customerEmail: updated.customerEmail,
        status: updated.status,
        subtotal: updated.subtotal,
        discount: updated.discount,
        shipping: updated.shipping,
        tax: updated.tax,
        total: updated.total,
        shippingMethod: updated.shippingMethod,
        paymentMethod: updated.paymentMethod,
        addressFullName: address.fullName,
        addressPhone: address.phone,
        addressProvince: address.province,
        addressCity: address.city,
        addressLine1: address.line1,
        addressPostalCode: address.postalCode,
        trackingCode: updated.trackingCode,
      })
      .where(eq(orders.id, existing.id));

    if (priced) {
      await db.delete(orderItems).where(eq(orderItems.orderId, existing.id));
      await db.insert(orderItems).values(
        priced.items.map((item, index) => ({
          orderId: existing.id,
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
    }

    if (statusChanged) {
      await db.insert(orderEvents).values({
        orderId: existing.id,
        status,
        at: new Date(),
        note: ORDER_NOTES[status],
        position: await nextEventPosition(existing.id),
      });
    }
  } catch {
    // DB offline
  }

  return updated;
}

/* -------------------------------------------------------------------------- */
/*  Status transitions                                                        */
/* -------------------------------------------------------------------------- */

export async function changeOrderStatus(code: string, status: OrderStatus): Promise<Order> {
  if (!ORDER_STATUSES.includes(status)) {
    throw badRequest("وضعیت سفارش معتبر نیست.", { field: "status" });
  }

  const existing = await getOrderByCode(code);
  if (!existing) throw notFound("سفارش مورد نظر یافت نشد.");

  const trackingCode =
    existing.trackingCode ?? (["shipped", "delivered"].includes(status) ? `IR${Math.floor(900000 + Math.random() * 99999)}` : null);

  const updated: Order = {
    ...existing,
    status,
    trackingCode,
    timeline: [
      ...existing.timeline,
      {
        status,
        at: new Date().toISOString(),
        note: ORDER_NOTES[status],
      },
    ],
  };

  getMemoryOrders().set(existing.id, updated);
  getMemoryOrdersByCode().set(code, updated);

  try {
    await db.update(orders).set({ status, trackingCode }).where(eq(orders.id, existing.id));
  } catch {
    // DB offline
  }

  return updated;
}

export async function deleteOrder(code: string): Promise<Order> {
  const [existing] = await deleteOrders([code]);
  if (!existing) throw notFound("سفارش مورد نظر یافت نشد.");
  return existing;
}

/** Bulk delete used by the admin panel's group actions. */
export async function deleteOrders(codes: string[]): Promise<Order[]> {
  const unique = [...new Set(codes.filter(Boolean))];
  if (!unique.length) return [];

  const removed: Order[] = [];
  for (const code of unique) {
    const existing = getMemoryOrdersByCode().get(code) ?? (await getOrderByCode(code));
    if (!existing) continue;

    getMemoryOrders().delete(existing.id);
    getMemoryOrdersByCode().delete(code);
    removed.push(existing);
  }

  try {
    await db.delete(orders).where(inArray(orders.code, unique));
  } catch {
    // DB offline
  }

  return removed;
}
