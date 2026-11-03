"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "./radix";
import { cn } from "@/lib/utils";

export const sheetVariants = cva(
  "fixed z-70 flex flex-col border-ivory/10 bg-carbon/[0.97] backdrop-blur-xl shadow-lift",
  {
    variants: {
      side: {
        left: "radix-sheet-left inset-y-0 left-0 h-full w-full border-e",
        right: "radix-sheet-right inset-y-0 right-0 h-full w-full border-s",
        bottom: "radix-sheet-bottom inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t",
      },
      width: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-xl",
        xl: "max-w-3xl",
        full: "max-w-none",
      },
    },
    defaultVariants: { side: "left", width: "md" },
  },
);

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export interface SheetContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  showClose?: boolean;
  hideTitle?: boolean;
}

export function SheetContent({
  className,
  children,
  side,
  width,
  showClose = true,
  hideTitle = false,
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="radix-overlay" />
      <DialogPrimitive.Content
        className={cn(sheetVariants({ side, width }), className)}
        {...props}
      >
        {hideTitle ? (
          <DialogPrimitive.Title className="sr-only">
            {props["aria-label"] ?? "پنل"}
          </DialogPrimitive.Title>
        ) : null}
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            aria-label="بستن"
            className="absolute end-4 top-4 z-10 rounded-full border border-line bg-surface/80 p-2 text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex shrink-0 flex-col gap-1 border-b border-line px-5 py-5 pe-14", className)}
      {...props}
    />
  );
}

export function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-y-auto px-5 py-5", className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("shrink-0 border-t border-line bg-carbon/80 px-5 py-5", className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-base font-semibold tracking-tight text-ivory", className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-xs text-mute", className)}
      {...props}
    />
  );
}
