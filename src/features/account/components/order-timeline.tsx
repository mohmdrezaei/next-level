import { Check, Clock } from "lucide-react";
import { OrderStatusBadge } from "@/features/admin/components/status-badge";
import { ORDER_FLOW } from "@/features/orders/lib/status";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderEvent } from "@/features/orders/types";

/** Vertical timeline of everything that happened to an order. */
export function OrderTimeline({ order }: { order: Order }) {
  const events = [...order.timeline].reverse();

  return (
    <ol className="relative flex flex-col gap-7 border-s border-line ps-6">
      {events.map((event: OrderEvent, index) => (
        <li key={`${event.status}-${event.at}`} className="relative">
          <span
            className={cn(
              "absolute -start-[1.95rem] top-0.5 grid size-4 place-items-center rounded-full border",
              index === 0 ? "border-gold bg-gold/20" : "border-line bg-elevated",
            )}
          >
            {index === 0 ? (
              <span className="size-1.5 rounded-full bg-gold" />
            ) : (
              <Check className="size-2.5 text-mute" strokeWidth={3} />
            )}
          </span>

          <div className="flex flex-wrap items-center gap-3">
            <OrderStatusBadge status={event.status} />
            <span className="text-[0.64rem] text-mute">{formatDateTime(event.at)}</span>
          </div>

          <p className="mt-2 text-xs leading-6 text-smoke">{event.note}</p>
        </li>
      ))}

      {/* Remaining expected steps */}
      {ORDER_FLOW.filter((status) => !order.timeline.some((event) => event.status === status))
        .slice(0, 3)
        .map((status) => (
          <li key={`pending-${status}`} className="relative opacity-55">
            <span className="absolute -start-[1.95rem] top-0.5 grid size-4 place-items-center rounded-full border border-dashed border-line bg-ink">
              <Clock className="size-2.5 text-mute" />
            </span>
            <OrderStatusBadge status={status} />
            <p className="mt-2 text-[0.68rem] text-mute">در انتظار انجام</p>
          </li>
        ))}
    </ol>
  );
}
