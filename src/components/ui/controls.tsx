"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import {
  Checkbox as CheckboxPrimitive,
  Progress as ProgressPrimitive,
  RadioGroup as RadioGroupPrimitive,
  Slider as SliderPrimitive,
  Switch as SwitchPrimitive,
  ToggleGroup as ToggleGroupPrimitive,
} from "./radix";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Checkbox                                                                  */
/* -------------------------------------------------------------------------- */

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer size-[18px] shrink-0 rounded-xs border border-ivory/25 bg-surface/70 transition-colors duration-300 data-[state=checked]:border-gold data-[state=checked]:bg-gold data-[state=indeterminate]:border-gold data-[state=indeterminate]:bg-gold disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-ongold">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3" strokeWidth={3} />
        ) : (
          <Check className="size-3" strokeWidth={3.5} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */
/*  Radio group                                                               */
/* -------------------------------------------------------------------------- */

export function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-3", className)} {...props} />;
}

export function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "size-[18px] shrink-0 rounded-full border border-ivory/25 bg-surface/70 transition-colors duration-300 data-[state=checked]:border-gold disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex size-full items-center justify-center">
        <span className="size-2 rounded-full bg-gold" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

/* -------------------------------------------------------------------------- */
/*  Switch                                                                    */
/* -------------------------------------------------------------------------- */

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-line bg-elevated transition-colors duration-300 data-[state=checked]:border-gold/60 data-[state=checked]:bg-gold/25 disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 rounded-full bg-mute shadow-soft transition-transform duration-300 ease-[var(--ease-silk)] translate-x-1 data-[state=checked]:translate-x-[1.45rem] data-[state=checked]:bg-gold rtl:translate-x-[-0.25rem] rtl:data-[state=checked]:translate-x-[-1.45rem]" />
    </SwitchPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */
/*  Slider                                                                    */
/* -------------------------------------------------------------------------- */

export function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none select-none items-center py-2", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-line">
        <SliderPrimitive.Range className="absolute h-full bg-[linear-gradient(90deg,var(--color-copper),var(--color-gold))]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-4 rounded-full border-2 border-gold bg-ink shadow-[0_0_0_4px_rgba(200,162,76,0.15)] transition-transform duration-200 hover:scale-110 disabled:opacity-45" />
    </SliderPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */
/*  Progress                                                                  */
/* -------------------------------------------------------------------------- */

export function Progress({
  className,
  indicatorClassName,
  value = 0,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-line", className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 bg-[linear-gradient(90deg,var(--color-copper),var(--color-gold))] transition-transform duration-[900ms] ease-[var(--ease-silk)]",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */
/*  Toggle group                                                              */
/* -------------------------------------------------------------------------- */

export function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

export function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center rounded-sm border border-line px-3 text-xs text-smoke transition-colors duration-300 hover:border-ivory/25 hover:text-ivory data-[state=on]:border-gold/50 data-[state=on]:bg-gold/12 data-[state=on]:text-gold-soft",
        className,
      )}
      {...props}
    />
  );
}
