/**
 * Store settings repository with resilient database and memory store fallback.
 *
 * The storefront configuration lives in `store_settings.id = 'store'` with
 * memory store synchronization so settings apply immediately across all
 * server and client components.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import { FREE_SHIPPING_THRESHOLD, SITE, TAX_RATE } from "@/lib/constants";

import { badRequest } from "../http";

/** The singleton key the settings row is pinned to. */
export const SETTINGS_ID = "store";

export type DefaultOrder = "featured" | "newest" | "price-asc";

export interface StoreSettings {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  freeShipping: number;
  /** VAT percentage as displayed in the form (`9` means 9%). */
  taxRate: number;
  standardShipping: number;
  expressShipping: number;
  enableWallet: boolean;
  enableCod: boolean;
  enableReviews: boolean;
  defaultOrder: DefaultOrder;
  updatedAt: string | null;
}

const ORDER_VALUES: DefaultOrder[] = ["featured", "newest", "price-asc"];

/** Fallback used before the row is written, and as the "reset" target. */
export const DEFAULT_SETTINGS: StoreSettings = {
  name: SITE.name,
  tagline: SITE.tagline,
  phone: SITE.phone,
  email: SITE.email,
  address: SITE.address,
  freeShipping: FREE_SHIPPING_THRESHOLD,
  taxRate: TAX_RATE * 100,
  standardShipping: 149_000,
  expressShipping: 349_000,
  enableWallet: true,
  enableCod: false,
  enableReviews: true,
  defaultOrder: "featured",
  updatedAt: null,
};

type SettingsRow = typeof storeSettings.$inferSelect;

declare global {
  // eslint-disable-next-line no-var
  var __memoryStoreSettings: StoreSettings | undefined;
}

export function getMemorySettings(): StoreSettings {
  if (!globalThis.__memoryStoreSettings) {
    globalThis.__memoryStoreSettings = { ...DEFAULT_SETTINGS };
  }
  return globalThis.__memoryStoreSettings;
}

function mapRow(row: SettingsRow): StoreSettings {
  return {
    name: row.name,
    tagline: row.tagline,
    phone: row.phone,
    email: row.email,
    address: row.address,
    freeShipping: row.freeShipping,
    taxRate: row.taxRate,
    standardShipping: row.standardShipping,
    expressShipping: row.expressShipping,
    enableWallet: row.enableWallet,
    enableCod: row.enableCod,
    enableReviews: row.enableReviews,
    defaultOrder: ORDER_VALUES.includes(row.defaultOrder as DefaultOrder)
      ? (row.defaultOrder as DefaultOrder)
      : "featured",
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

/** Current settings — reads from DB or falls back to memory settings. */
export async function getSettings(): Promise<StoreSettings> {
  try {
    const rows = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.id, SETTINGS_ID))
      .limit(1);

    if (rows[0]) {
      const mapped = mapRow(rows[0]);
      globalThis.__memoryStoreSettings = mapped;
      return mapped;
    }
  } catch {
    // Database offline
  }

  return getMemorySettings();
}

/** Synchronous reader for components that need active settings immediately. */
export function getLiveSettingsSync(): StoreSettings {
  return getMemorySettings();
}

/** A partial patch; every field is optional and validated when present. */
export type SettingsPatch = Partial<Omit<StoreSettings, "updatedAt">>;

function toNumber(value: unknown, field: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw badRequest("مقدار وارد‌شده عددی نیست.", { field });
  if (parsed < min || parsed > max) {
    throw badRequest("مقدار وارد‌شده خارج از محدوده مجاز است.", { field });
  }
  return parsed;
}

/** Validate + persist a patch, merging it over current values and memory store. */
export async function updateSettings(patch: SettingsPatch): Promise<StoreSettings> {
  const current = getMemorySettings();

  const next: StoreSettings = {
    ...current,
    ...Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ),
  };

  const name = String(next.name ?? "").trim();
  if (name.length < 2) throw badRequest("نام فروشگاه الزامی است.", { field: "name" });

  const email = String(next.email ?? "").trim();
  if (email && !/^\S+@\S+\.\S+$/.test(email)) throw badRequest("ایمیل معتبر نیست.", { field: "email" });

  const defaultOrder = ORDER_VALUES.includes(next.defaultOrder) ? next.defaultOrder : "featured";

  const values = {
    id: SETTINGS_ID,
    name,
    tagline: String(next.tagline ?? "").trim(),
    phone: String(next.phone ?? "").trim(),
    email,
    address: String(next.address ?? "").trim(),
    freeShipping: Math.round(toNumber(next.freeShipping, "freeShipping", 0, 1_000_000_000)),
    taxRate: toNumber(next.taxRate, "taxRate", 0, 100),
    standardShipping: Math.round(toNumber(next.standardShipping, "standardShipping", 0, 100_000_000)),
    expressShipping: Math.round(toNumber(next.expressShipping, "expressShipping", 0, 100_000_000)),
    enableWallet: Boolean(next.enableWallet),
    enableCod: Boolean(next.enableCod),
    enableReviews: Boolean(next.enableReviews),
    defaultOrder,
    updatedAt: new Date(),
  };

  const updated: StoreSettings = {
    name: values.name,
    tagline: values.tagline,
    phone: values.phone,
    email: values.email,
    address: values.address,
    freeShipping: values.freeShipping,
    taxRate: values.taxRate,
    standardShipping: values.standardShipping,
    expressShipping: values.expressShipping,
    enableWallet: values.enableWallet,
    enableCod: values.enableCod,
    enableReviews: values.enableReviews,
    defaultOrder: values.defaultOrder,
    updatedAt: values.updatedAt.toISOString(),
  };

  // Sync in-memory store immediately
  globalThis.__memoryStoreSettings = updated;

  try {
    await db
      .insert(storeSettings)
      .values(values)
      .onConflictDoUpdate({ target: storeSettings.id, set: values });
  } catch {
    // Database offline
  }

  return updated;
}

/** Wipe the row and restore default settings. */
export async function resetSettings(): Promise<StoreSettings> {
  globalThis.__memoryStoreSettings = { ...DEFAULT_SETTINGS };
  try {
    await db.delete(storeSettings).where(eq(storeSettings.id, SETTINGS_ID));
  } catch {
    // Database offline
  }
  return { ...DEFAULT_SETTINGS };
}
