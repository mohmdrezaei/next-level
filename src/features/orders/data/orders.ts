import { PRODUCTS } from "@/features/products/data/catalog";
import { seededRandom } from "@/lib/utils";
import { TAX_RATE } from "@/lib/constants";
import type { Address, Customer, Order, OrderEvent, OrderItem, OrderStatus } from "../types";

/**
 * Orders are generated from a fixed anchor date so every render (server or
 * client) produces identical data — no hydration surprises.
 */
const ANCHOR = Date.parse("2026-09-26T12:00:00+03:30");
const DAY = 86_400_000;

interface CustomerSeed {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  line1: string;
  postalCode: string;
  joinedDaysAgo: number;
}

const CUSTOMER_SEEDS: CustomerSeed[] = [
  { id: "c-001", name: "آرش مهرآذین", phone: "0912 111 0001", email: "arash@example.com", city: "تهران", province: "تهران", line1: "خیابان ولیعصر، کوچه ناهید، پلاک ۱۲", postalCode: "1968765411", joinedDaysAgo: 640 },
  { id: "c-002", name: "کامران راد", phone: "0912 111 0002", email: "kamran@example.com", city: "کرج", province: "البرز", line1: "میدان طالقانی، خیابان شهید بهشتی، پلاک ۴۵", postalCode: "3146789912", joinedDaysAgo: 512 },
  { id: "c-003", name: "سهیل نوری", phone: "0912 111 0003", email: "soheil@example.com", city: "اصفهان", province: "اصفهان", line1: "خیابان چهارباغ بالا، برج نگین، طبقه ۷", postalCode: "8173456121", joinedDaysAgo: 431 },
  { id: "c-004", name: "بابک تهرانی", phone: "0912 111 0004", email: "babak@example.com", city: "تهران", province: "تهران", line1: "سعادت‌آباد، بلوار دریا، پلاک ۸۸", postalCode: "1998763125", joinedDaysAgo: 388 },
  { id: "c-005", name: "پویا صادقی", phone: "0912 111 0005", email: "pouya@example.com", city: "مشهد", province: "خراسان رضوی", line1: "بلوار وکیل‌آباد، کوچه ۱۲، پلاک ۳۴", postalCode: "9174567812", joinedDaysAgo: 302 },
  { id: "c-006", name: "نیما فرهادی", phone: "0912 111 0006", email: "nima@example.com", city: "شیراز", province: "فارس", line1: "خیابان زند، ساختمان پارس، واحد ۵", postalCode: "7134567811", joinedDaysAgo: 275 },
  { id: "c-007", name: "رضا کیانی", phone: "0912 111 0007", email: "reza@example.com", city: "تبریز", province: "آذربایجان شرقی", line1: "خیابان ولیعصر، نرسیده به میدان ساعت", postalCode: "5156789123", joinedDaysAgo: 240 },
  { id: "c-008", name: "امیرحسین دلاور", phone: "0912 111 0008", email: "amir@example.com", city: "تهران", province: "تهران", line1: "پاسداران، بوستان دوم، پلاک ۱۹", postalCode: "1956783412", joinedDaysAgo: 198 },
  { id: "c-009", name: "شاهین مرادی", phone: "0912 111 0009", email: "shahin@example.com", city: "رشت", province: "گیلان", line1: "خیابان معلم، کوچه گلستان، پلاک ۷", postalCode: "4156789124", joinedDaysAgo: 156 },
  { id: "c-010", name: "محمد بهرامی", phone: "0912 111 0010", email: "mohammad@example.com", city: "یزد", province: "یزد", line1: "خیابان کاشانی، کوچه شهید صدوقی", postalCode: "8915673421", joinedDaysAgo: 120 },
  { id: "c-011", name: "کیوان اسدی", phone: "0912 111 0011", email: "keyvan@example.com", city: "تهران", province: "تهران", line1: "جردن، خیابان گلفام، پلاک ۲۳", postalCode: "1934567812", joinedDaysAgo: 88 },
  { id: "c-012", name: "فرید شریفی", phone: "0912 111 0012", email: "farid@example.com", city: "اهواز", province: "خوزستان", line1: "کیانپارس، خیابان اصلی، پلاک ۵۶", postalCode: "6156789123", joinedDaysAgo: 61 },
  { id: "c-013", name: "سامان آذرنوش", phone: "0912 111 0013", email: "saman@example.com", city: "قم", province: "قم", line1: "بلوار امین، کوچه ۱۴، پلاک ۹", postalCode: "3715678912", joinedDaysAgo: 34 },
  { id: "c-014", name: "هومن پارسا", phone: "0912 111 0014", email: "hooman@example.com", city: "تهران", province: "تهران", line1: "نیاوران، خیابان شهید باهنر، پلاک ۴۱", postalCode: "1963458712", joinedDaysAgo: 12 },
];

const STATUS_BY_AGE: { maxDays: number; status: OrderStatus }[] = [
  { maxDays: 2, status: "pending" },
  { maxDays: 5, status: "paid" },
  { maxDays: 9, status: "processing" },
  { maxDays: 16, status: "shipped" },
  { maxDays: 120, status: "delivered" },
];

function buildTimeline(status: OrderStatus, createdAt: number, seed: string): OrderEvent[] {
  const flow: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered"];
  const notes: Record<OrderStatus, string> = {
    pending: "سفارش ثبت شد و در انتظار پرداخت است.",
    paid: "پرداخت با موفقیت تأیید شد.",
    processing: "سفارش در آتلیه بسته‌بندی و بازرسی شد.",
    shipped: "سفارش تحویل پست پیشتاز شد.",
    delivered: "سفارش تحویل مشتری شد.",
    cancelled: "سفارش لغو شد و مبلغ بازگشت داده شد.",
    returned: "کالا مرجوع شد و مبلغ عودت داده شد.",
  };

  if (status === "cancelled" || status === "returned") {
    const step = status === "cancelled" ? 1 : 4;
    const events = flow.slice(0, step).map((item, index) => ({
      status: item,
      at: new Date(createdAt + index * 0.35 * DAY).toISOString(),
      note: notes[item],
    }));
    return [
      ...events,
      {
        status,
        at: new Date(createdAt + (step + 0.4) * DAY).toISOString(),
        note: notes[status],
      },
    ];
  }

  const endIndex = flow.indexOf(status);
  return flow.slice(0, endIndex + 1).map((item, index) => ({
    status: item,
    at: new Date(createdAt + index * (0.4 + seededRandom(`${seed}-${index}`) * 0.6) * DAY).toISOString(),
    note: notes[item],
  }));
}

function generateOrders(): Order[] {
  const orders: Order[] = [];
  const total = 34;

  for (let index = 0; index < total; index += 1) {
    const seed = `order-${index}`;
    const roll = seededRandom(seed);
    const customer = CUSTOMER_SEEDS[Math.floor(seededRandom(seed + "c") * CUSTOMER_SEEDS.length)];
    const daysAgo = Math.round(3 + seededRandom(seed + "age") ** 1.4 * 108);
    const createdAt = ANCHOR - daysAgo * DAY;

    const itemCount = 1 + Math.floor(seededRandom(seed + "n") * 3);
    const items: OrderItem[] = [];
    const used = new Set<string>();

    for (let i = 0; i < itemCount; i += 1) {
      const product = PRODUCTS[Math.floor(seededRandom(`${seed}-p${i}`) * PRODUCTS.length)];
      if (used.has(product.id)) continue;
      used.add(product.id);
      const color = product.colors[Math.floor(seededRandom(`${seed}-col${i}`) * product.colors.length)];
      const variant =
        product.variants[Math.floor(seededRandom(`${seed}-sz${i}`) * product.variants.length)];
      items.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        latinName: product.latinName,
        image: product.images[0]?.src ?? "",
        size: variant.size,
        color: color.name,
        price: product.price,
        quantity: 1 + Math.floor(seededRandom(`${seed}-q${i}`) * 2),
      });
    }

    if (!items.length) continue;

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discounted = roll > 0.65;
    const discount = discounted ? Math.round(subtotal * 0.1) : 0;
    const shipping = subtotal - discount >= 5_000_000 ? 0 : 149_000;
    const tax = Math.round((subtotal - discount) * TAX_RATE);
    const status =
      STATUS_BY_AGE.find((entry) => daysAgo <= entry.maxDays)?.status ?? "delivered";

    orders.push({
      id: `o-${String(index + 1).padStart(3, "0")}`,
      code: `NR-${String(14000 + index * 7)}`,
      createdAt: new Date(createdAt).toISOString(),
      status,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      items,
      subtotal,
      discount,
      shipping,
      tax,
      total: subtotal - discount + shipping + tax,
      shippingMethod: roll > 0.78 ? "express" : roll > 0.5 ? "standard" : "pickup",
      paymentMethod: roll > 0.85 ? "wallet" : roll > 0.15 ? "gateway" : "cod",
      address: {
        fullName: customer.name,
        phone: customer.phone,
        province: customer.province,
        city: customer.city,
        line1: customer.line1,
        postalCode: customer.postalCode,
      },
      timeline: buildTimeline(status, createdAt, seed),
      trackingCode: ["shipped", "delivered"].includes(status) ? `IR${900000 + index * 37}` : null,
      hasReview: status === "delivered" && roll > 0.55,
    });
  }

  return orders.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export const ORDERS: Order[] = generateOrders();

export const ORDER_BY_CODE = new Map(ORDERS.map((order) => [order.code, order]));

export const CUSTOMERS: Customer[] = CUSTOMER_SEEDS.map((seed): Customer => {
  const own = ORDERS.filter((order) => order.customerId === seed.id);
  const totalSpent = own.reduce((sum, order) => sum + order.total, 0);
  const lastOrderAt = own[0]?.createdAt ?? new Date(ANCHOR - seed.joinedDaysAgo * DAY).toISOString();

  return {
    id: seed.id,
    name: seed.name,
    phone: seed.phone,
    email: seed.email,
    city: seed.city,
    province: seed.province,
    joinedAt: new Date(ANCHOR - seed.joinedDaysAgo * DAY).toISOString(),
    orders: own.length,
    totalSpent,
    tier: totalSpent > 60_000_000 ? "gold" : totalSpent > 25_000_000 ? "silver" : "bronze",
    lastOrderAt,
  };
}).sort((a, b) => b.totalSpent - a.totalSpent);

export const CUSTOMER_BY_ID = new Map(CUSTOMERS.map((customer) => [customer.id, customer]));

/** Saved addresses for the signed-in demo user. */
export const DEMO_ADDRESSES: Address[] = [
  {
    id: "addr-1",
    title: "خانه",
    fullName: "آرش مهرآذین",
    phone: "0912 111 0001",
    province: "تهران",
    city: "تهران",
    line1: "خیابان ولیعصر، کوچه ناهید، پلاک ۱۲، طبقه دوم",
    postalCode: "1968765411",
    isDefault: true,
  },
  {
    id: "addr-2",
    title: "دفتر کار",
    fullName: "آرش مهرآذین",
    phone: "0912 111 0001",
    province: "تهران",
    city: "تهران",
    line1: "میدان ونک، برج نگین، طبقه ۹، واحد ۹۰۴",
    postalCode: "1998745123",
    isDefault: false,
  },
];

export const DEMO_ORDERS = ORDERS.filter((order) => order.customerId === "c-001");
