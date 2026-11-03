import type { Coupon } from "../types";

export const COUPONS: Coupon[] = [
  {
    code: "NEXT10",
    label: "۱۰٪ تخفیف روی کل سبد",
    rate: 0.1,
    minSubtotal: 0,
  },
  {
    code: "WELCOME15",
    label: "۱۵٪ تخفیف اولین خرید",
    rate: 0.15,
    minSubtotal: 8_000_000,
  },
  {
    code: "FREESHIP",
    label: "ارسال رایگان",
    rate: 0,
    minSubtotal: 0,
    freeShipping: true,
  },
];

export const findCoupon = (code: string): Coupon | undefined =>
  COUPONS.find((coupon) => coupon.code.toLowerCase() === code.trim().toLowerCase());

export interface CouponResult {
  coupon: Coupon | null;
  error: string | null;
}

export function validateCoupon(code: string, subtotal: number): CouponResult {
  const coupon = findCoupon(code);
  if (!coupon) return { coupon: null, error: "کد تخفیف معتبر نیست." };
  if (subtotal < coupon.minSubtotal) {
    return {
      coupon: null,
      error: `این کد برای سبدی با حداقل ${coupon.minSubtotal.toLocaleString("en-US")} تومان است.`,
    };
  }
  return { coupon, error: null };
}
