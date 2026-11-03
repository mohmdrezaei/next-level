/**
 * Drizzle ORM schema — PostgreSQL.
 *
 * The schema mirrors the domain types in the `features` modules. Where the
 * domain stores a plain string we keep the column strictly typed (`date`,
 * `timestamptz`) and let the repository layer convert to the exact string
 * shape the UI expects — see `src/server/repositories`.
 *
 * Naming: snake_case columns, plural snake_case tables.
 */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const emptyTextArray = sql`'{}'::text[]`;

/* -------------------------------------------------------------------------- */
/*  Catalogue                                                                 */
/* -------------------------------------------------------------------------- */

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  latinTitle: text("latin_title").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    latinName: text("latin_name").notNull().default(""),
    category: text("category").notNull(),
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    story: text("story").notNull().default(""),
    materials: text("materials").array().notNull().default(emptyTextArray),
    care: text("care").array().notNull().default(emptyTextArray),
    highlights: text("highlights").array().notNull().default(emptyTextArray),
    badges: text("badges").array().notNull().default(emptyTextArray),
    tags: text("tags").array().notNull().default(emptyTextArray),
    rating: real("rating").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    /** Stored as a calendar date; the domain exposes it as "YYYY-MM-DD". */
    createdAt: date("created_at", { mode: "string" }).notNull(),
    featured: boolean("featured").notNull().default(false),
  },
  (table) => [
    uniqueIndex("products_slug_key").on(table.slug),
    index("products_category_idx").on(table.category),
    index("products_featured_idx").on(table.featured),
  ],
);

export const productColors = pgTable(
  "product_colors",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    hex: text("hex").notNull(),
    accent: text("accent").notNull(),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("product_colors_product_idx").on(table.productId)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    stock: integer("stock").notNull().default(0),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("product_variants_product_idx").on(table.productId)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    src: text("src").notNull(),
    alt: text("alt").notNull().default(""),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("product_images_product_idx").on(table.productId)],
);

/* -------------------------------------------------------------------------- */
/*  Curated sets (complete looks)                                             */
/* -------------------------------------------------------------------------- */

export const sets = pgTable(
  "sets",
  {
    slug: text("slug").primaryKey(),
    title: text("title").notNull(),
    latinTitle: text("latin_title").notNull().default(""),
    subtitle: text("subtitle").notNull().default(""),
    description: text("description").notNull().default(""),
    occasion: text("occasion").notNull().default(""),
    season: text("season").notNull().default(""),
    discountRate: real("discount_rate").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    accent: text("accent").notNull().default("#c8a24c"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sets_featured_idx").on(table.featured)],
);

export const setItems = pgTable(
  "set_items",
  {
    id: serial("id").primaryKey(),
    setSlug: text("set_slug")
      .notNull()
      .references(() => sets.slug, { onDelete: "cascade", onUpdate: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    role: text("role").notNull().default(""),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    index("set_items_set_idx").on(table.setSlug),
    index("set_items_product_idx").on(table.productId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Customers & addresses                                                     */
/* -------------------------------------------------------------------------- */

export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    city: text("city").notNull().default(""),
    province: text("province").notNull().default(""),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    orders: integer("orders").notNull().default(0),
    totalSpent: integer("total_spent").notNull().default(0),
    tier: text("tier").notNull().default("bronze"),
    lastOrderAt: timestamp("last_order_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("customers_phone_key").on(table.phone)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    fullName: text("full_name").notNull().default(""),
    phone: text("phone").notNull().default(""),
    province: text("province").notNull().default(""),
    city: text("city").notNull().default(""),
    line1: text("line1").notNull().default(""),
    postalCode: text("postal_code").notNull().default(""),
    isDefault: boolean("is_default").notNull().default(false),
  },
  (table) => [index("addresses_customer_idx").on(table.customerId)],
);

/* -------------------------------------------------------------------------- */
/*  Orders                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Orders are historical records: line items and the shipping address are
 * snapshots taken at checkout, so they intentionally carry no foreign key to
 * `products`/`customers`. `customerId` is indexed for lookups only.
 */
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").notNull().default("pending"),
    customerId: text("customer_id").notNull().default(""),
    customerName: text("customer_name").notNull().default(""),
    customerPhone: text("customer_phone").notNull().default(""),
    customerEmail: text("customer_email").notNull().default(""),
    subtotal: integer("subtotal").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    shipping: integer("shipping").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    total: integer("total").notNull().default(0),
    shippingMethod: text("shipping_method").notNull().default("standard"),
    paymentMethod: text("payment_method").notNull().default("gateway"),
    addressFullName: text("address_full_name").notNull().default(""),
    addressPhone: text("address_phone").notNull().default(""),
    addressProvince: text("address_province").notNull().default(""),
    addressCity: text("address_city").notNull().default(""),
    addressLine1: text("address_line1").notNull().default(""),
    addressPostalCode: text("address_postal_code").notNull().default(""),
    trackingCode: text("tracking_code"),
    hasReview: boolean("has_review").notNull().default(false),
  },
  (table) => [
    uniqueIndex("orders_code_key").on(table.code),
    index("orders_customer_idx").on(table.customerId),
    index("orders_status_idx").on(table.status),
    index("orders_created_idx").on(table.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    slug: text("slug").notNull().default(""),
    name: text("name").notNull(),
    latinName: text("latin_name").notNull().default(""),
    image: text("image").notNull().default(""),
    size: text("size").notNull().default(""),
    color: text("color").notNull().default(""),
    price: integer("price").notNull().default(0),
    quantity: integer("quantity").notNull().default(1),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    note: text("note").notNull().default(""),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("order_events_order_idx").on(table.orderId)],
);

/* -------------------------------------------------------------------------- */
/*  Reviews                                                                   */
/* -------------------------------------------------------------------------- */

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    author: text("author").notNull(),
    rating: integer("rating").notNull().default(5),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    verified: boolean("verified").notNull().default(false),
    helpful: integer("helpful").notNull().default(0),
  },
  (table) => [index("reviews_product_idx").on(table.productId)],
);

/* -------------------------------------------------------------------------- */
/*  Accounts & sessions                                                       */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    role: text("role").notNull().default("customer"),
    accent: text("accent").notNull().default("#c8a24c"),
    /** scrypt hash, formatted as `scrypt$<salt-hex>$<key-hex>`. */
    passwordHash: text("password_hash").notNull(),
    /** Links a storefront login to its customer ledger row, when present. */
    customerId: text("customer_id"),
    /** Jalali date string as typed by the shopper, e.g. "1370/05/12". */
    birthday: text("birthday").notNull().default(""),
    gender: text("gender").notNull().default("unspecified"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_key").on(table.email),
    index("users_customer_idx").on(table.customerId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    /** Opaque random token stored in the `nextlevel.session` cookie. */
    token: text("token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

/* -------------------------------------------------------------------------- */
/*  Wishlist                                                                  */
/* -------------------------------------------------------------------------- */

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: serial("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("wishlist_customer_product_key").on(table.customerId, table.productId),
    index("wishlist_customer_idx").on(table.customerId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Commerce helpers                                                          */
/* -------------------------------------------------------------------------- */

export const coupons = pgTable("coupons", {
  code: text("code").primaryKey(),
  label: text("label").notNull().default(""),
  rate: real("rate").notNull().default(0),
  minSubtotal: integer("min_subtotal").notNull().default(0),
  freeShipping: boolean("free_shipping").notNull().default(false),
  active: boolean("active").notNull().default(true),
});

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("newsletter_email_key").on(table.email)],
);

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("new"),
});

/* -------------------------------------------------------------------------- */
/*  Store settings                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Single-row table holding the storefront configuration the admin edits on
 * `/admin/settings`. `id` is pinned to `'store'`, so the row is unique by
 * construction and the repository can always upsert against a known key.
 */
export const storeSettings = pgTable("store_settings", {
  id: text("id").primaryKey().default("store"),
  name: text("name").notNull().default("Next Level"),
  tagline: text("tagline").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  /** Orders at or above this amount ship free (Toman). */
  freeShipping: integer("free_shipping").notNull().default(5_000_000),
  /** VAT percentage as typed in the form, e.g. `9` for 9%. */
  taxRate: real("tax_rate").notNull().default(9),
  standardShipping: integer("standard_shipping").notNull().default(149_000),
  expressShipping: integer("express_shipping").notNull().default(349_000),
  enableWallet: boolean("enable_wallet").notNull().default(true),
  enableCod: boolean("enable_cod").notNull().default(false),
  enableReviews: boolean("enable_reviews").notNull().default(true),
  defaultOrder: text("default_order").notNull().default("featured"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Relations                                                                 */
/* -------------------------------------------------------------------------- */

export const productsRelations = relations(products, ({ many }) => ({
  colors: many(productColors),
  variants: many(productVariants),
  images: many(productImages),
  reviews: many(reviews),
  setItems: many(setItems),
}));

export const productColorsRelations = relations(productColors, ({ one }) => ({
  product: one(products, { fields: [productColors.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const setsRelations = relations(sets, ({ many }) => ({
  items: many(setItems),
}));

export const setItemsRelations = relations(setItems, ({ one }) => ({
  set: one(sets, { fields: [setItems.setSlug], references: [sets.slug] }),
  product: one(products, { fields: [setItems.productId], references: [products.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(addresses),
  wishlist: many(wishlistItems),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  timeline: many(orderEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  customer: one(customers, { fields: [wishlistItems.customerId], references: [customers.id] }),
  product: one(products, { fields: [wishlistItems.productId], references: [products.id] }),
}));
