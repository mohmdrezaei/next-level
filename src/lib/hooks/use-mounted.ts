"use client";

import * as React from "react";

/**
 * Returns false during the server render and the first client render, then true.
 * Used to gate anything that depends on persisted client state (localStorage,
 * media queries, `matchMedia`) so the markup cannot mismatch.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}
