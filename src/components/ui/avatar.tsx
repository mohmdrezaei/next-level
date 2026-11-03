"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "./radix";
import { cn } from "@/lib/utils";

export function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full border border-ivory/12",
        className,
      )}
      {...props}
    />
  );
}

export function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex size-full items-center justify-center bg-elevated text-xs font-semibold text-ivory",
        className,
      )}
      {...props}
    />
  );
}

/** Initials avatar tinted with a per-user accent colour. */
export function InitialsAvatar({
  name,
  accent = "#c8a24c",
  className,
}: {
  name: string;
  accent?: string;
  className?: string;
}) {
  const label = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <Avatar className={className}>
      <AvatarFallback
        style={{
          background: `linear-gradient(140deg, ${accent}33, ${accent}0f)`,
          color: accent,
          borderColor: `${accent}44`,
        }}
        className="border"
      >
        {label}
      </AvatarFallback>
    </Avatar>
  );
}
