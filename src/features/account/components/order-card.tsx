import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/controls";
import { OrderStatusBadge } from "@/features/admin/components/status-badge";
import { ORDER_STATUS_META, statusProgress } from "@/features/orders/lib/status";
import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber, toPersianDigits } from "@/lib/format";
import type { Order } from "@/features/orders/types";

export function OrderCard({ order }: { order: Order }) {
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="flex flex-col gap-5 rounded-xl border border-line bg-surface/60 p-5 shadow-soft transition-colors duration-500 hover:border-ivory/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-3">
            <Link
              href={`/account/orders/${order.code}`}
              className="tnum text-sm font-medium text-ivory transition-colors duration-300 hover:text-gold-soft"
            >
              سفارش {order.code}
            </Link>
            <OrderStatusBadge status={order.status} />
          </span>
          <span className="text-[0.66rem] text-mute">
            ثبت‌شده در {formatDate(order.createdAt)}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="tnum text-sm font-semibold text-ivory">
            {formatNumber(order.total)}
            <span className="ms-1 text-[0.65rem] font-normal text-mute">تومان</span>
          </span>
          <span className="tnum text-[0.62rem] text-mute">
            {toPersianDigits(units)} قلم کالا
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {order.items.slice(0, 4).map((item) => (
            <Link
              key={`${item.productId}-${item.size}-${item.color}`}
              href={`/shop/${item.slug}`}
              className="size-14 overflow-hidden rounded-lg border border-line bg-carbon transition-transform duration-300 hover:-translate-y-0.5"
              title={item.name}
            >
              <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className={cn("size-full object-cover", mediaClassFor(item.image))}
                    />
            </Link>
          ))}

          {order.items.length > 4 ? (
            <span className="tnum grid size-14 place-items-center rounded-lg border border-dashed border-line text-[0.66rem] text-mute">
              +{toPersianDigits(order.items.length - 4)}
            </span>
          ) : null}

          <span className="ms-auto flex flex-wrap gap-2">
            <Badge tone="outline">
              {order.shippingMethod === "express"
                ? "ارسال سریع"
                : order.shippingMethod === "pickup"
                  ? "تحویل حضوری"
                  : "ارسال استاندارد"}
            </Badge>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Progress value={statusProgress(order.status)} />
          <div className="flex items-center justify-between text-[0.64rem]">
            <span className="text-mute">{ORDER_STATUS_META[order.status].description}</span>
            {order.trackingCode ? (
              <span className="tnum text-gold-soft">رهگیری: {order.trackingCode}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Link
          href={`/account/orders/${order.code}`}
          className="inline-flex items-center gap-2 text-[0.68rem] text-gold transition-colors duration-300 hover:text-gold-soft"
        >
          جزئیات سفارش
          <ArrowLeft className="size-3.5" />
        </Link>

        {order.status === "delivered" ? (
          <span className="inline-flex items-center gap-2 text-[0.68rem] text-mute">
            <Package className="size-3.5" />
            تحویل‌شده
          </span>
        ) : null}
      </div>
    </article>
  );
}
