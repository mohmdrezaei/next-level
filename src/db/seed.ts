/**
 * Seed script — loads the shop's demo catalogue, customers and orders into
 * PostgreSQL.
 *
 * Run with:  pnpm db:seed      (or `pnpm db:setup` to migrate first)
 *
 * The source of truth for the demo content remains the TypeScript data modules
 * under the `features` directories, so the seed stays in sync with the UI.
 */
import "./load-env";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import {
  addresses,
  categories,
  contactMessages,
  coupons,
  customers,
  newsletterSubscribers,
  orderEvents,
  orderItems,
  orders,
  productColors,
  productImages,
  productVariants,
  products,
  reviews,
  sessions,
  setItems,
  sets,
  users,
  wishlistItems,
} from "@/db/schema";
import { COUPONS } from "@/features/cart/lib/coupons";
import { CUSTOMERS, DEMO_ADDRESSES, ORDERS } from "@/features/orders/data/orders";
import { CATEGORIES, PRODUCTS } from "@/features/products/data/catalog";
import { getProductReviews } from "@/features/reviews/data/reviews";
import { SETS } from "@/features/sets/data/sets";
import { accentFor } from "@/features/auth/types";
import { ADMIN_CREDENTIALS, DEMO_CREDENTIALS } from "@/lib/constants";
import { hashPassword } from "@/server/auth/password";

/** Cap generated reviews per product so the table stays a sensible size. */
const MAX_REVIEWS_PER_PRODUCT = 10;

async function truncateAll(): Promise<void> {
  await db.execute(sql`
    truncate table
      ${sessions}, ${wishlistItems}, ${addresses},
      ${orderEvents}, ${orderItems}, ${orders},
      ${setItems}, ${sets},
      ${productImages}, ${productVariants}, ${productColors}, ${products},
      ${reviews}, ${categories}, ${customers}, ${users},
      ${coupons}, ${newsletterSubscribers}, ${contactMessages}
    restart identity cascade
  `);
}

async function seedCategories(): Promise<void> {
  await db.insert(categories).values(
    CATEGORIES.map((category, index) => ({
      slug: category.slug,
      title: category.title,
      latinTitle: category.latinTitle,
      description: category.description,
      position: index,
    })),
  );
  console.log(`  categories        ${CATEGORIES.length}`);
}

async function seedProducts(): Promise<void> {
  await db.insert(products).values(
    PRODUCTS.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      latinName: product.latinName,
      category: product.category,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      shortDescription: product.shortDescription,
      description: product.description,
      story: product.story,
      materials: product.materials,
      care: product.care,
      highlights: product.highlights,
      badges: product.badges,
      tags: product.tags,
      rating: product.rating,
      reviewCount: product.reviewCount,
      createdAt: product.createdAt,
      featured: product.featured,
    })),
  );

  const colors = PRODUCTS.flatMap((product) =>
    product.colors.map((color, index) => ({
      productId: product.id,
      name: color.name,
      hex: color.hex,
      accent: color.accent,
      position: index,
    })),
  );

  const variants = PRODUCTS.flatMap((product) =>
    product.variants.map((variant, index) => ({
      productId: product.id,
      size: variant.size,
      stock: variant.stock,
      position: index,
    })),
  );

  const images = PRODUCTS.flatMap((product) =>
    product.images.map((image, index) => ({
      productId: product.id,
      src: image.src,
      alt: image.alt,
      position: index,
    })),
  );

  if (colors.length) await db.insert(productColors).values(colors);
  if (variants.length) await db.insert(productVariants).values(variants);
  if (images.length) await db.insert(productImages).values(images);

  console.log(`  products          ${PRODUCTS.length} (+${colors.length} colors, ${variants.length} variants, ${images.length} images)`);
}

async function seedSets(): Promise<void> {
  await db.insert(sets).values(
    SETS.map((set) => ({
      slug: set.slug,
      title: set.title,
      latinTitle: set.latinTitle,
      subtitle: set.subtitle,
      description: set.description,
      occasion: set.occasion,
      season: set.season,
      discountRate: set.discountRate,
      featured: set.featured,
      accent: set.accent,
    })),
  );

  const items = SETS.flatMap((set) =>
    set.items.map((item, index) => ({
      setSlug: set.slug,
      productId: item.productId,
      role: item.role,
      position: index,
    })),
  );

  if (items.length) await db.insert(setItems).values(items);
  console.log(`  sets              ${SETS.length} (+${items.length} pieces)`);
}

async function seedCustomers(): Promise<void> {
  await db.insert(customers).values(
    CUSTOMERS.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      province: customer.province,
      joinedAt: new Date(customer.joinedAt),
      orders: customer.orders,
      totalSpent: customer.totalSpent,
      tier: customer.tier,
      lastOrderAt: customer.lastOrderAt ? new Date(customer.lastOrderAt) : null,
    })),
  );

  await db.insert(addresses).values(
    DEMO_ADDRESSES.map((address) => ({
      id: address.id,
      customerId: "c-001",
      title: address.title,
      fullName: address.fullName,
      phone: address.phone,
      province: address.province,
      city: address.city,
      line1: address.line1,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    })),
  );

  console.log(`  customers         ${CUSTOMERS.length} (+${DEMO_ADDRESSES.length} addresses)`);
}

async function seedOrders(): Promise<void> {
  await db.insert(orders).values(
    ORDERS.map((order) => ({
      id: order.id,
      code: order.code,
      createdAt: new Date(order.createdAt),
      status: order.status,
      customerId: order.customerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      shippingMethod: order.shippingMethod,
      paymentMethod: order.paymentMethod,
      addressFullName: order.address.fullName,
      addressPhone: order.address.phone,
      addressProvince: order.address.province,
      addressCity: order.address.city,
      addressLine1: order.address.line1,
      addressPostalCode: order.address.postalCode,
      trackingCode: order.trackingCode,
      hasReview: order.hasReview,
    })),
  );

  const items = ORDERS.flatMap((order) =>
    order.items.map((item, index) => ({
      orderId: order.id,
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

  const events = ORDERS.flatMap((order) =>
    order.timeline.map((event, index) => ({
      orderId: order.id,
      status: event.status,
      at: new Date(event.at),
      note: event.note,
      position: index,
    })),
  );

  if (items.length) await db.insert(orderItems).values(items);
  if (events.length) await db.insert(orderEvents).values(events);

  console.log(`  orders            ${ORDERS.length} (+${items.length} lines, ${events.length} events)`);
}

async function seedReviews(): Promise<void> {
  const rows = PRODUCTS.flatMap((product) =>
    getProductReviews(product.id, product.reviewCount)
      .slice(0, MAX_REVIEWS_PER_PRODUCT)
      .map((review) => ({
        id: review.id,
        productId: product.id,
        author: review.author,
        rating: Math.round(review.rating),
        title: review.title,
        body: review.body,
        createdAt: new Date(review.createdAt),
        verified: review.verified,
        helpful: review.helpful,
      })),
  );

  if (rows.length) await db.insert(reviews).values(rows);
  console.log(`  reviews           ${rows.length}`);
}

async function seedCoupons(): Promise<void> {
  await db.insert(coupons).values(
    COUPONS.map((coupon) => ({
      code: coupon.code,
      label: coupon.label,
      rate: coupon.rate,
      minSubtotal: coupon.minSubtotal,
      freeShipping: Boolean(coupon.freeShipping),
      active: true,
    })),
  );
  console.log(`  coupons           ${COUPONS.length}`);
}

async function seedUsers(): Promise<void> {
  const adminHash = await hashPassword(ADMIN_CREDENTIALS.password);
  const customerHash = await hashPassword(DEMO_CREDENTIALS.password);

  await db.insert(users).values([
    {
      id: "u-admin",
      name: "مدیر بوتیک",
      email: ADMIN_CREDENTIALS.email,
      phone: "09120000001",
      role: "admin",
      accent: "#c8a24c",
      passwordHash: adminHash,
      customerId: null,
    },
    {
      id: "u-c001",
      name: DEMO_CREDENTIALS.name,
      email: "arash@example.com",
      phone: DEMO_CREDENTIALS.phone,
      role: "customer",
      accent: accentFor(DEMO_CREDENTIALS.phone),
      passwordHash: customerHash,
      customerId: "c-001",
    },
  ]);

  console.log(`  users             2`);
}

async function main(): Promise<void> {
  const started = Date.now();
  console.log("Seeding Next Level Atelier → PostgreSQL\n");

  await truncateAll();

  await seedCategories();
  await seedProducts();
  await seedSets();
  await seedCustomers();
  await seedOrders();
  await seedReviews();
  await seedCoupons();
  await seedUsers();

  console.log(`\nDone in ${Date.now() - started}ms.`);
  console.log(`\nAdmin login:    ${ADMIN_CREDENTIALS.email} / ${ADMIN_CREDENTIALS.password}`);
  console.log(`Customer login: ${DEMO_CREDENTIALS.phone} / ${DEMO_CREDENTIALS.password}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("\nSeed failed:", error);
  process.exit(1);
});
