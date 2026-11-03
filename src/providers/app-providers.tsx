"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WishlistSync } from "@/features/wishlist/components/wishlist-sync";
import { ThemeProvider } from "./theme-provider";

/** Sonner needs to know the active theme so toasts match the surface behind them. */
function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="bottom-left"
      dir="rtl"
      closeButton
      theme={resolvedTheme === "light" ? "light" : "dark"}
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border !border-line !bg-surface !text-ivory !shadow-soft",
          title: "!text-ivory",
          description: "!text-smoke",
          actionButton: "!bg-gold !text-ongold",
          cancelButton: "!bg-elevated !text-smoke",
          closeButton: "!border-line !bg-elevated !text-smoke",
        },
      }}
    />
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={220} skipDelayDuration={120}>
        <WishlistSync />
        {children}
        <ThemedToaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
