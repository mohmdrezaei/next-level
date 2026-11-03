"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "./radix";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  variant = "pill",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: "pill" | "underline" }) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex items-center gap-1",
        variant === "pill" &&
          "w-fit rounded-full border border-line bg-surface/70 p-1 backdrop-blur-sm",
        variant === "underline" && "w-full border-b border-line",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  variant = "pill",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { variant?: "pill" | "underline" }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap text-xs font-medium transition-colors duration-300 ease-[var(--ease-silk)] disabled:opacity-45",
        variant === "pill" &&
          "h-9 rounded-full px-4 text-smoke hover:text-ivory data-[state=active]:bg-ivory data-[state=active]:text-ink",
        variant === "underline" &&
          "h-11 px-4 text-smoke after:absolute after:inset-x-3 after:bottom-0 after:h-px after:origin-center after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:text-ivory data-[state=active]:text-ivory data-[state=active]:after:scale-x-100",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("animate-fade-in outline-hidden", className)}
      {...props}
    />
  );
}
