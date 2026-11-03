"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ShippingMethodId } from "@/lib/constants";
import { validateCoupon } from "../lib/coupons";
import type { CartLine, Coupon } from "../types";

interface CartState {
  lines: CartLine[];
  couponCode: string | null;
  coupon: Coupon | null;
  shippingMethod: ShippingMethodId;
  isDrawerOpen: boolean;
  /** Product id that was most recently added — used for micro-animations. */
  lastAddedId: string | null;
  couponError: string | null;

  addLine: (line: CartLine, options?: { openDrawer?: boolean }) => void;
  /** Adds every piece of a look in a single update. */
  addLines: (lines: CartLine[], options?: { openDrawer?: boolean }) => void;
  removeLine: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  clear: () => void;

  applyCoupon: (code: string, subtotal: number) => boolean;
  removeCoupon: () => void;
  setShippingMethod: (method: ShippingMethodId) => void;

  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      couponCode: null,
      coupon: null,
      shippingMethod: "standard",
      isDrawerOpen: false,
      lastAddedId: null,
      couponError: null,

      addLine: (line, options) =>
        set((state) => {
          const existing = state.lines.find((item) => item.key === line.key);
          const lines = existing
            ? state.lines.map((item) =>
                item.key === line.key
                  ? {
                      ...item,
                      quantity: Math.min(item.quantity + line.quantity, item.maxQuantity),
                    }
                  : item,
              )
            : [...state.lines, line];

          return {
            lines,
            lastAddedId: line.productId,
            isDrawerOpen: options?.openDrawer ?? state.isDrawerOpen,
          };
        }),

      addLines: (incoming, options) =>
        set((state) => {
          let lines = [...state.lines];

          for (const line of incoming) {
            const exists = lines.some((item) => item.key === line.key);
            lines = exists
              ? lines.map((item) =>
                  item.key === line.key
                    ? {
                        ...item,
                        quantity: Math.min(item.quantity + line.quantity, item.maxQuantity),
                      }
                    : item,
                )
              : [...lines, line];
          }

          return {
            lines,
            lastAddedId: incoming.at(-1)?.productId ?? state.lastAddedId,
            isDrawerOpen: options?.openDrawer ?? state.isDrawerOpen,
          };
        }),

      removeLine: (key) => set((state) => ({ lines: state.lines.filter((item) => item.key !== key) })),

      setQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines.map((item) =>
            item.key === key
              ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity)) }
              : item,
          ),
        })),

      increment: (key) => {
        const line = get().lines.find((item) => item.key === key);
        if (line) get().setQuantity(key, line.quantity + 1);
      },

      decrement: (key) => {
        const line = get().lines.find((item) => item.key === key);
        if (line) get().setQuantity(key, line.quantity - 1);
      },

      clear: () => set({ lines: [], couponCode: null, coupon: null, couponError: null }),

      applyCoupon: (code, subtotal) => {
        const { coupon, error } = validateCoupon(code, subtotal);
        if (error || !coupon) {
          set({ couponError: error ?? "کد تخفیف معتبر نیست." });
          return false;
        }
        set({ coupon, couponCode: coupon.code, couponError: null });
        return true;
      },

      removeCoupon: () => set({ coupon: null, couponCode: null, couponError: null }),

      setShippingMethod: (method) => set({ shippingMethod: method }),

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
    }),
    {
      name: "nextlevel.cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lines: state.lines,
        couponCode: state.couponCode,
        coupon: state.coupon,
        shippingMethod: state.shippingMethod,
      }),
    },
  ),
);

/* -------------------------------------------------------------------------- */
/*  Selectors (subscribe to the narrowest slice possible)                     */
/* -------------------------------------------------------------------------- */

export const useCartLines = () => useCartStore((state) => state.lines);
export const useCartCount = () =>
  useCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0));
export const useCartDrawerOpen = () => useCartStore((state) => state.isDrawerOpen);
