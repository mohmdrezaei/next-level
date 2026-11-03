"use client";

import { DollarSign, ReceiptText, ShoppingBag, TrendingDown, TrendingUp, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";

const ICONS = {
  revenue: DollarSign,
  orders: ShoppingBag,
  aov: ReceiptText,
  customers: Users,
} as const;

export interface KpiCardProps {
  id: keyof typeof ICONS | string;
  label: string;
  value: number;
  format: "currency" | "number" | "percent";
  hint: string;
  growth: number;
  index?: number;
}

export function KpiCard({ id, label, value, format, hint, growth, index = 0 }: KpiCardProps) {
  const reduce = useReducedMotion();
  const Icon = ICONS[id as keyof typeof ICONS] ?? ReceiptText;
  const up = growth >= 0;

  const suffix = format === "currency" ? " تومان" : format === "percent" ? "٪" : "";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { y: -4 }}
      className="h-full"
    >
      <Card className="group relative h-full overflow-hidden p-5 transition-colors duration-300 hover:border-gold/25 md:p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -end-10 size-40 rounded-full bg-[radial-gradient(circle,rgba(200,162,76,0.16),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 place-items-center rounded-full border border-line bg-elevated text-gold transition-colors duration-300 group-hover:border-gold/35">
            <Icon className="size-[18px]" strokeWidth={1.7} />
          </span>

          <Badge tone={up ? "success" : "danger"} size="sm" className="tnum">
            {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {toPersianDigits(Math.abs(growth).toFixed(1))}٪
          </Badge>
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <span className="text-[0.7rem] tracking-wide text-mute">{label}</span>
          <span
            className={cn(
              "tnum text-2xl font-semibold tracking-tight text-ivory",
              format === "currency" && "text-[1.35rem]",
            )}
          >
            <AnimatedNumber value={value} suffix={suffix} duration={1.5} />
          </span>
          <span className="text-[0.68rem] leading-5 text-mute">{hint}</span>
        </div>
      </Card>
    </motion.div>
  );
}
