import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors",
  {
    variants: {
      tone: {
        neutral: "border-line bg-elevated text-smoke",
        ivory: "border-transparent bg-ivory text-ink",
        gold: "border-gold/25 bg-gold/12 text-gold-soft",
        success: "border-success/25 bg-success/12 text-success",
        warning: "border-warning/25 bg-warning/12 text-warning",
        danger: "border-danger/25 bg-danger/12 text-danger",
        info: "border-info/25 bg-info/12 text-info",
        outline: "border-ivory/15 bg-transparent text-smoke",
      },
      size: {
        sm: "px-2.5 py-0.5 text-[0.68rem]",
        md: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "sm" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}
