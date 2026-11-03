"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Accordion as AccordionPrimitive } from "./radix";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-b border-line last:border-b-0", className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 py-5 text-start text-sm font-medium text-ivory transition-colors duration-300 hover:text-gold-soft",
          className,
        )}
        {...props}
      >
        {children}
        <Plus className="size-4 shrink-0 text-mute transition-transform duration-300 ease-[var(--ease-silk)] group-data-[state=open]:rotate-45 group-data-[state=open]:text-gold" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content className="radix-accordion" {...props}>
      <div className={cn("pb-6 pe-8 text-xs leading-7 text-smoke", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
