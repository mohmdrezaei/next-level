import type { OrderStatus } from "../types";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger"; description: string }
> = {
  pending: {
    label: "در انتظار پرداخت",
    tone: "warning",
    description: "سفارش ثبت شده اما پرداخت تکمیل نشده است.",
  },
  paid: {
    label: "پرداخت‌شده",
    tone: "info",
    description: "پرداخت با موفقیت انجام شد و سفارش در صف آماده‌سازی است.",
  },
  processing: {
    label: "در حال آماده‌سازی",
    tone: "info",
    description: "سفارش در بوتیک بسته‌بندی و بازرسی می‌شود.",
  },
  shipped: {
    label: "ارسال‌شده",
    tone: "info",
    description: "سفارش تحویل شرکت حمل شده و در مسیر است.",
  },
  delivered: {
    label: "تحویل‌شده",
    tone: "success",
    description: "سفارش به مشتری تحویل داده شده است.",
  },
  cancelled: {
    label: "لغو‌شده",
    tone: "danger",
    description: "سفارش توسط مشتری یا بوتیک لغو شده است.",
  },
  returned: {
    label: "مرجوع‌شده",
    tone: "neutral",
    description: "کالا بازگشت داده شده و مبلغ عودت شده است.",
  },
};

export const ORDER_FLOW: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered"];

export const statusLabel = (status: OrderStatus) => ORDER_STATUS_META[status].label;

export function statusProgress(status: OrderStatus): number {
  const terminal = ["cancelled", "returned"];
  if (terminal.includes(status)) return 100;
  const index = ORDER_FLOW.indexOf(status);
  return index < 0 ? 0 : ((index + 1) / ORDER_FLOW.length) * 100;
}

export const isActiveOrder = (status: OrderStatus) =>
  !["delivered", "cancelled", "returned"].includes(status);
