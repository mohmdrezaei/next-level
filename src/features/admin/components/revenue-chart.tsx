"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCompactPrice, formatNumber, toPersianDigits } from "@/lib/format";

export interface SeriesPoint {
  label: string;
  value: number;
  orders: number;
}

interface RevenueChartProps {
  daily: SeriesPoint[];
  monthly: SeriesPoint[];
}

const W = 760;
const H = 300;
const PAD = { top: 26, right: 22, bottom: 38, left: 22 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

interface Point extends SeriesPoint {
  x: number;
  y: number;
}

/** Catmull–Rom → cubic bezier smoothing for a soft, premium line. */
function smoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function RevenueChart({ daily, monthly }: RevenueChartProps) {
  const reduce = useReducedMotion();
  const [range, setRange] = React.useState<"daily" | "monthly">("daily");
  const [active, setActive] = React.useState<number | null>(null);

  const data = range === "daily" ? daily : monthly;
  const uniqueId = React.useId().replace(/[^a-zA-Z0-9]/g, "");

  const max = Math.max(...data.map((point) => point.value), 1);
  const stepX = INNER_W / Math.max(1, data.length - 1);

  const points: Point[] = data.map((point, index) => ({
    ...point,
    x: PAD.left + index * stepX,
    y: PAD.top + (1 - point.value / max) * INNER_H,
  }));

  const line = smoothPath(points);
  const baseline = PAD.top + INNER_H;
  const area = points.length
    ? `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
    : "";

  const total = data.reduce((sum, point) => sum + point.value, 0);
  const totalOrders = data.reduce((sum, point) => sum + point.orders, 0);

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const x = ratio * W;
    const index = Math.round((x - PAD.left) / stepX);
    setActive(Math.min(points.length - 1, Math.max(0, index)));
  };

  const activePoint = active === null ? null : points[active];

  return (
    <Card className="overflow-hidden p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[0.7rem] tracking-wide text-mute">روند فروش</span>
          <span className="tnum text-lg font-semibold text-ivory">
            {formatCompactPrice(total)}
            <span className="ms-1.5 text-[0.7rem] font-normal text-mute">تومان</span>
          </span>
          <span className="tnum text-[0.68rem] text-mute">
            {formatNumber(totalOrders)} سفارش در این بازه
          </span>
        </div>

        <Tabs value={range} onValueChange={(value) => setRange(value as "daily" | "monthly")}>
          <TabsList>
            <TabsTrigger value="daily">۳۰ روز</TabsTrigger>
            <TabsTrigger value="monthly">۶ ماه</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative mt-6" dir="ltr">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setActive(null)}
          role="img"
          aria-label="نمودار درآمد"
        >
          <defs>
            <linearGradient id={`fill-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.32" />
              <stop offset="55%" stopColor="var(--color-gold)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`stroke-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-copper)" />
              <stop offset="45%" stopColor="var(--color-gold)" />
              <stop offset="100%" stopColor="var(--color-gold-soft)" />
            </linearGradient>
          </defs>

          {/* grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = PAD.top + ratio * INNER_H;
            return (
              <line
                key={ratio}
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="var(--color-line)"
                strokeWidth="1"
                strokeDasharray={ratio === 1 ? "0" : "3 6"}
                opacity={ratio === 1 ? 0.9 : 0.5}
              />
            );
          })}

          {/* area fill */}
          <motion.path
            d={area}
            fill={`url(#fill-${uniqueId})`}
            initial={reduce ? false : { opacity: 0 }}
            animate={reduce ? undefined : { opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.25 }}
          />

          {/* line */}
          <motion.path
            d={line}
            fill="none"
            stroke={`url(#stroke-${uniqueId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0, opacity: 0.4 }}
            animate={reduce ? undefined : { pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* hover guide */}
          {activePoint ? (
            <g>
              <line
                x1={activePoint.x}
                y1={PAD.top}
                x2={activePoint.x}
                y2={baseline}
                stroke="var(--color-gold)"
                strokeWidth="1"
                strokeDasharray="3 4"
                opacity="0.5"
              />
              <circle cx={activePoint.x} cy={activePoint.y} r="7" fill="var(--color-gold)" opacity="0.18" />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="4"
                fill="var(--color-ink)"
                stroke="var(--color-gold)"
                strokeWidth="2"
              />
            </g>
          ) : null}

          {/* endpoint dot */}
          {points.length ? (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="3.5"
              fill="var(--color-gold-soft)"
            />
          ) : null}
        </svg>

        {/* tooltip */}
        {activePoint ? (
          <div
            className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-ivory/10 bg-carbon/97 px-3 py-2 text-center shadow-lift backdrop-blur-xl"
            style={{
              left: `${(activePoint.x / W) * 100}%`,
              transform:
                activePoint.x > W - 90
                  ? "translateX(-90%)"
                  : activePoint.x < 90
                    ? "translateX(-10%)"
                    : "translateX(-50%)",
            }}
          >
            <span className="block text-[0.62rem] text-mute">{activePoint.label}</span>
            <span className="tnum block text-[0.72rem] font-medium text-ivory">
              {formatCompactPrice(activePoint.value)}
            </span>
            <span className="tnum block text-[0.6rem] text-gold-soft">
              {toPersianDigits(activePoint.orders)} سفارش
            </span>
          </div>
        ) : null}

        {/* x-axis labels */}
        <div className="mt-2 flex items-center justify-between px-1 text-[0.6rem] text-mute">
          <span>{data[0]?.label ?? ""}</span>
          <span className="hidden sm:inline">{data[Math.floor(data.length / 2)]?.label ?? ""}</span>
          <span>{data[data.length - 1]?.label ?? ""}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-[0.68rem] text-mute">
        <ArrowUpRight className="size-3.5 text-gold" />
        <span>مبالغ بر پایه سفارش‌های پرداخت‌شده محاسبه شده است.</span>
        <span className={cn("tnum ms-auto text-gold-soft")}>{formatCompactPrice(max)} سقف</span>
      </div>
    </Card>
  );
}
