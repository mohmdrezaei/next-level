"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { changeOrderStatusAction } from "../actions";
import { ORDER_FLOW, ORDER_STATUS_META } from "@/features/orders/lib/status";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/features/orders/types";

const EXTRA: OrderStatus[] = ["cancelled", "returned"];

export function OrderStatusControl({
  code,
  status,
}: {
  code: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<OrderStatus | null>(null);
  const options = [...ORDER_FLOW, ...EXTRA];

  const change = async (next: OrderStatus) => {
    if (next === status) return;
    setPending(next);
    const result = await changeOrderStatusAction(code, next);
    setPending(null);

    if (result.ok) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[0.68rem] tracking-[0.18em] text-mute">تغییر وضعیت سفارش</span>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const meta = ORDER_STATUS_META[option];
          const active = option === status;
          const loading = pending === option;

          return (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={active ? "gold" : "subtle"}
              disabled={Boolean(pending)}
              onClick={() => change(option)}
              className={cn("gap-2", active && "pointer-events-none")}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : active ? (
                <Check className="size-3.5" />
              ) : null}
              {meta.label}
            </Button>
          );
        })}
      </div>

      <p className="text-[0.66rem] leading-6 text-mute">
        وضعیت فعلی: <span className="text-ivory">{ORDER_STATUS_META[status].label}</span> —{" "}
        {ORDER_STATUS_META[status].description}
      </p>
    </div>
  );
}
