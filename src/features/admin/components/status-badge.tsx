import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_META } from "@/features/orders/lib/status";
import type { OrderStatus } from "@/features/orders/types";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Order status                                                              */
/* -------------------------------------------------------------------------- */

export function OrderStatusBadge({
  status,
  className,
  size = "sm",
}: {
  status: OrderStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  const meta = ORDER_STATUS_META[status];
  return (
    <Badge tone={meta.tone} size={size} className={className}>
      <span className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Customer tier                                                             */
/* -------------------------------------------------------------------------- */

const TIER_META: Record<"bronze" | "silver" | "gold", { label: string; tone: "warning" | "neutral" | "gold" }> = {
  bronze: { label: "برنز", tone: "warning" },
  silver: { label: "نقره‌ای", tone: "neutral" },
  gold: { label: "طلایی", tone: "gold" },
};

export function TierBadge({
  tier,
  size = "sm",
  className,
}: {
  tier: "bronze" | "silver" | "gold";
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = TIER_META[tier];
  return (
    <Badge tone={meta.tone} size={size} className={className}>
      {meta.label}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inventory                                                                 */
/* -------------------------------------------------------------------------- */

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  const tone = stock === 0 ? "danger" : stock < 15 ? "warning" : stock < 40 ? "info" : "success";
  const label = stock === 0 ? "ناموجود" : stock < 15 ? "بحرانی" : stock < 40 ? "کم" : "موجود";
  return (
    <Badge tone={tone} className={className}>
      <span className="tnum">{label}</span>
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Badge pills (product badges)                                              */
/* -------------------------------------------------------------------------- */

const PRODUCT_BADGE_TONE = {
  new: "info",
  limited: "gold",
  bestseller: "success",
  sale: "danger",
} as const;

const PRODUCT_BADGE_LABEL: Record<keyof typeof PRODUCT_BADGE_TONE, string> = {
  new: "جدید",
  limited: "تیراژ محدود",
  bestseller: "پرفروش",
  sale: "تخفیف",
};

export function ProductBadgePill({
  badge,
  className,
}: {
  badge: keyof typeof PRODUCT_BADGE_TONE;
  className?: string;
}) {
  return (
    <Badge tone={PRODUCT_BADGE_TONE[badge]} className={cn(className)}>
      {PRODUCT_BADGE_LABEL[badge]}
    </Badge>
  );
}
