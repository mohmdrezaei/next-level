"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./radix";

export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, required, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <Label.Root
            htmlFor={htmlFor}
            className="text-xs font-medium tracking-wide text-smoke select-none"
          >
            {label}
            {required ? <span className="ms-1 text-gold">*</span> : null}
          </Label.Root>
          {hint && !error ? <span className="text-[0.7rem] text-mute">{hint}</span> : null}
        </div>
      ) : null}

      {children}

      <div
        className={cn(
          "overflow-hidden text-[0.72rem] text-danger transition-[max-height,opacity] duration-300",
          error ? "max-h-12 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {error}
      </div>
    </div>
  );
}
