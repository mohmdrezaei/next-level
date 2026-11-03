/**
 * Discount-code repository.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { coupons } from "@/db/schema";
import type { Coupon } from "@/features/cart/types";
import { sanitizeString } from "@/lib/sanitize";

import { badRequest } from "../http";

type CouponRow = typeof coupons.$inferSelect;

function mapCoupon(row: CouponRow): Coupon {
  return {
    code: row.code,
    label: row.label,
    rate: row.rate,
    minSubtotal: row.minSubtotal,
    ...(row.freeShipping ? { freeShipping: true } : {}),
  };
}

export async function listCoupons(): Promise<Coupon[]> {
  const rows = await db.select().from(coupons).where(eq(coupons.active, true));
  return rows.map(mapCoupon);
}

export async function findCoupon(code: string): Promise<Coupon | null> {
  const rows = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.trim().toUpperCase()))
    .limit(1);

  const row = rows[0];
  return row && row.active ? mapCoupon(row) : null;
}

export interface CouponCheck {
  coupon: Coupon | null;
  error: string | null;
}

/** Validate a code against a cart subtotal. */
export async function validateCoupon(code: string, subtotal: number): Promise<CouponCheck> {
  const coupon = await findCoupon(code);
  if (!coupon) return { coupon: null, error: "کد تخفیف معتبر نیست." };

  if (subtotal < coupon.minSubtotal) {
    return {
      coupon: null,
      error: `این کد برای سبدی با حداقل ${coupon.minSubtotal.toLocaleString("en-US")} تومان است.`,
    };
  }

  return { coupon, error: null };
}

export async function createCoupon(input: {
  code: string;
  label?: string;
  rate?: number;
  minSubtotal?: number;
  freeShipping?: boolean;
}): Promise<Coupon> {
  const code = String(input.code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    throw badRequest("کد تخفیف باید بین ۳ تا ۳۲ کاراکتر انگلیسی/عدد باشد.", { field: "code" });
  }

  const rate = Number(input.rate ?? 0);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw badRequest("نرخ تخفیف باید عددی بین ۰ و ۱ باشد.", { field: "rate" });
  }

  await db
    .insert(coupons)
    .values({
      code,
      label: sanitizeString(input.label ?? "", 80),
      rate,
      minSubtotal: Math.max(0, Math.round(Number(input.minSubtotal ?? 0))),
      freeShipping: Boolean(input.freeShipping),
      active: true,
    })
    .onConflictDoUpdate({
      target: coupons.code,
      set: {
        label: sanitizeString(input.label ?? "", 80),
        rate,
        minSubtotal: Math.max(0, Math.round(Number(input.minSubtotal ?? 0))),
        freeShipping: Boolean(input.freeShipping),
        active: true,
      },
    });

  const created = await findCoupon(code);
  if (!created) throw badRequest("کد تخفیف ذخیره نشد.");
  return created;
}
