"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { NavigationMenu as NavigationMenuPrimitive } from "./radix";
import { cn } from "@/lib/utils";

export function NavigationMenu({
  className,
  children,
  viewportClassName,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & { viewportClassName?: string }) {
  return (
    <NavigationMenuPrimitive.Root
      className={cn("relative flex max-w-max flex-1 items-center justify-center", className)}
      {...props}
    >
      {children}
      <NavigationMenuPrimitive.Viewport
        className={cn(
          "radix-pop absolute top-full left-0 z-70 mt-3 h-[var(--radix-navigation-menu-viewport-height)] w-full origin-top overflow-hidden rounded-xl border border-ivory/10 bg-carbon/97 shadow-lift backdrop-blur-xl md:w-[var(--radix-navigation-menu-viewport-width)]",
          viewportClassName,
        )}
      />
    </NavigationMenuPrimitive.Root>
  );
}

export function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      className={cn("group flex flex-1 list-none items-center gap-1", className)}
      {...props}
    />
  );
}

export const NavigationMenuItem = NavigationMenuPrimitive.Item;

export function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      className={cn(
        "group inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm text-smoke transition-colors duration-300 hover:bg-ivory/[0.05] hover:text-ivory data-[state=open]:bg-ivory/[0.06] data-[state=open]:text-ivory",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-3.5 transition-transform duration-300 group-data-[state=open]:rotate-180" />
    </NavigationMenuPrimitive.Trigger>
  );
}

export function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      className={cn(
        "top-0 left-0 w-full p-4 md:absolute md:w-auto",
        "data-[motion^=from-]:animate-fade-in",
        className,
      )}
      {...props}
    />
  );
}

export function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      className={cn(
        "block select-none rounded-lg p-3 text-sm text-smoke no-underline outline-hidden transition-colors duration-300 hover:bg-ivory/[0.05] hover:text-ivory",
        className,
      )}
      {...props}
    />
  );
}

export function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      className={cn("top-full z-60 flex h-1.5 items-end justify-center overflow-hidden", className)}
      {...props}
    >
      <span className="size-3 rotate-45 rounded-tl-xs border-t border-s border-ivory/10 bg-carbon/97" />
    </NavigationMenuPrimitive.Indicator>
  );
}
