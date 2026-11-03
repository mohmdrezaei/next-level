"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Writes `dark` / `light` on <html>.
 *
 * Dark stays the default so the boutique's signature look is what visitors see
 * first; the choice is remembered in localStorage and can also follow the OS.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      enableColorScheme
      storageKey="nextlevel-theme"
      themes={["dark", "light"]}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
