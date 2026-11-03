"use client";

import * as React from "react";

const emptySubscribe = () => () => {};

/**
 * Returns false during SSR, then true after hydration.
 * Uses useSyncExternalStore to avoid extra cascading renders and React 19 warnings.
 */
export function useMounted(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
