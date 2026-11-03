"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  /** Renders an icon absolutely positioned on the inline-start edge. */
  startIcon?: React.ReactNode;
  endSlot?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, startIcon, endSlot, ...props },
  ref,
) {
  const field = (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-md border border-line bg-surface/60 px-4 text-sm text-ivory transition-colors duration-300 placeholder:text-mute hover:border-ivory/20 focus:border-gold/60 disabled:opacity-50",
        startIcon && "ps-11",
        endSlot && "pe-12",
        "data-[invalid]:border-danger/70 data-[invalid]:bg-danger/[0.06]",
        className,
      )}
      {...props}
    />
  );

  if (!startIcon && !endSlot) return field;

  return (
    <div className="relative">
      {startIcon ? (
        <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-mute [&_svg]:size-4">
          {startIcon}
        </span>
      ) : null}
      {field}
      {endSlot ? (
        <span className="absolute inset-y-0 end-3 flex items-center">{endSlot}</span>
      ) : null}
    </div>
  );
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-28 w-full resize-y rounded-md border border-line bg-surface/60 px-4 py-3 text-sm leading-7 text-ivory transition-colors duration-300 placeholder:text-mute hover:border-ivory/20 focus:border-gold/60 disabled:opacity-50",
          "data-[invalid]:border-danger/70 data-[invalid]:bg-danger/[0.06]",
          className,
        )}
        {...props}
      />
    );
  },
);
