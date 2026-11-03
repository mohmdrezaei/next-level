"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "./radix";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-300 ease-[var(--ease-silk)] active:scale-[0.975] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "bg-ivory text-ink hover:opacity-92 shadow-[0_14px_38px_-18px_rgba(0,0,0,0.55)]",
        gold: "gold-surface text-ongold hover:brightness-[1.08] shadow-[0_18px_50px_-20px_rgba(200,162,76,0.55)]",
        outline: "border border-ivory/15 text-ivory hover:border-ivory/40 hover:bg-ivory/[0.04]",
        subtle: "border border-line bg-elevated text-ivory hover:bg-elevated/60",
        ghost: "text-smoke hover:bg-ivory/[0.06] hover:text-ivory",
        danger: "bg-danger/92 text-white hover:bg-danger",
        link: "h-auto rounded-none px-0 text-gold hover:text-gold-soft underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6",
        lg: "h-14 px-8 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      data-loading={loading ? "" : undefined}
      {...props}
    >
      {loading ? (
        <>
          <span
            aria-hidden
            className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
          />
          <span>در حال انجام…</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
});
