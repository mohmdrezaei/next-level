"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api-client";
import { setWishlistRemote, toWishlistItem, useWishlistStore } from "../store/wishlist-store";
import type { Product } from "@/features/products/types";

interface MeResponse {
  user: { id: string } | null;
}

/**
 * Headless bridge between the local wishlist and `/api/wishlist`.
 *
 * Guests stay local-only. When a session is detected the component turns the
 * server mirror on and merges the products saved on the server into the local
 * list, so a shopper's favourites follow them across devices.
 */
export function WishlistSync() {
  const hydrate = useWishlistStore((state) => state.hydrate);

  React.useEffect(() => {
    let active = true;

    (async () => {
      try {
        const me = await apiFetch<MeResponse>("/api/auth/me");
        if (!active || !me.user) return;

        setWishlistRemote(true);

        const products = await apiFetch<Product[]>("/api/wishlist");
        if (active) hydrate(products.map(toWishlistItem));
      } catch {
        // Guest, offline, or a transient error — the local list keeps working.
      }
    })();

    return () => {
      active = false;
      setWishlistRemote(false);
    };
  }, [hydrate]);

  return null;
}
