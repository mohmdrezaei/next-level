"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/format";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  size?: "sm" | "md";
  className?: string;
  label?: string;
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  size = "md",
  className,
  label = "تعداد",
}: QuantityStepperProps) {
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));

  const buttonClass =
    "grid place-items-center text-smoke transition-colors duration-300 hover:text-ivory disabled:opacity-35 disabled:hover:text-smoke";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line bg-surface/60",
        size === "sm" ? "h-9 px-1.5" : "h-11 px-2",
        className,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= min}
        aria-label="کاهش تعداد"
        className={cn(buttonClass, size === "sm" ? "size-7" : "size-8")}
      >
        <Minus className="size-3.5" />
      </button>

      <span
        aria-live="polite"
        className={cn(
          "tnum min-w-7 text-center font-medium text-ivory",
          size === "sm" ? "text-xs" : "text-sm",
        )}
      >
        {toPersianDigits(value)}
      </span>

      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= max}
        aria-label="افزایش تعداد"
        className={cn(buttonClass, size === "sm" ? "size-7" : "size-8")}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
