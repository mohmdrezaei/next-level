"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMounted } from "@/lib/hooks/use-mounted";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  /** `icon` for headers, `labelled` for drawers and menus. */
  variant?: "icon" | "labelled";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const reduceMotion = useReducedMotion();

  // Before hydration we cannot know the stored theme; dark is the default.
  const isDark = !mounted || resolvedTheme !== "light";
  const nextLabel = isDark ? "حالت روشن" : "حالت تاریک";

  const toggle = React.useCallback(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 420);
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  const icon = (
    <span className="relative grid size-4 place-items-center">
      <AnimatePresence initial={false} mode="wait">
        {isDark ? (
          <motion.span
            key="moon"
            initial={reduceMotion ? false : { opacity: 0, rotate: 40, scale: 0.55 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, rotate: -40, scale: 0.55 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 grid place-items-center"
          >
            <Moon className="size-4" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={reduceMotion ? false : { opacity: 0, rotate: -60, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, rotate: 60, scale: 0.5 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 grid place-items-center"
          >
            <Sun className="size-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );

  if (variant === "labelled") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={nextLabel}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-smoke transition-colors duration-300 hover:bg-ivory/[0.04] hover:text-ivory",
          className,
        )}
      >
        {icon}
        <span>{nextLabel}</span>
        <span
          aria-hidden
          className={cn(
            "relative ms-auto h-5 w-9 shrink-0 rounded-full border transition-colors duration-300",
            isDark ? "border-line bg-elevated" : "border-gold/45 bg-gold/20",
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 size-3 -translate-y-1/2 rounded-full transition-all duration-300 ease-[var(--ease-silk)]",
              isDark ? "start-1 bg-mute" : "start-5 bg-gold",
            )}
          />
        </span>
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggle}
          aria-label={nextLabel}
          aria-pressed={!isDark}
          className={cn(
            "relative grid size-10 place-items-center rounded-full border border-line text-smoke",
            "transition-colors duration-300 hover:border-ivory/25 hover:text-ivory",
            className,
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent>{nextLabel}</TooltipContent>
    </Tooltip>
  );
}
