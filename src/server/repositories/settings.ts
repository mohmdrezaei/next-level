/**
 * Store settings repository.
 *
 * The storefront configuration lives in a single row (`store_settings.id =
 * 'store'`). Reads never fail: when the row has not been written yet the
 * repository answers with the compile-time defaults, so `/admin/settings` and
 * any storefront caller always receive a complete object.
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

/** Current settings — the defaults when nothing has been saved yet. */
export async function getSettings(): Promise<StoreSettings> {
  const rows = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.id, SETTINGS_ID))
    .limit(1);

  return rows[0] ? mapRow(rows[0]) : { ...DEFAULT_SETTINGS };
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

/** Validate + persist a patch, merging it over the current values. */
export async function updateSettings(patch: SettingsPatch): Promise<StoreSettings> {
  const current = await getSettings();

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

  await db
    .insert(storeSettings)
    .values(values)
    .onConflictDoUpdate({ target: storeSettings.id, set: values });

  return getSettings();
}

/** Wipe the row so `getSettings()` falls back to the shipped defaults. */
export async function resetSettings(): Promise<StoreSettings> {
  await db.delete(storeSettings).where(eq(storeSettings.id, SETTINGS_ID));
  return { ...DEFAULT_SETTINGS };
}
