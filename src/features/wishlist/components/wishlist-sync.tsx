"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api-client";
import { setWishlistRemote, toWishlistItem, useWishlistStore } from "../store/wishlist-store";
import type { Product } from "@/features/products/types";

interface MeResponse {
  user: { id: string } | null;
}

/**
 * Headless bridge between the user's isolated wishlist and `/api/wishlist`.
 *
 * Guests use guest storage (`__guest__`). When an authenticated session is detected,
 * the component switches the active store to that specific user and populates their
 * server-backed list.
 */
export function WishlistSync() {
  const setUser = useWishlistStore((state) => state.setUser);

  React.useEffect(() => {
    let active = true;

    (async () => {
      try {
        const me = await apiFetch<MeResponse>("/api/auth/me");
        if (!active) return;

        if (me?.user?.id) {
          setWishlistRemote(true);
          const products = await apiFetch<Product[]>("/api/wishlist");
          if (active) {
            setUser(me.user.id, Array.isArray(products) ? products.map(toWishlistItem) : []);
          }
        } else {
          setWishlistRemote(false);
          setUser(null);
        }
      } catch {
        // Guest or offline
        if (active) {
          setWishlistRemote(false);
          setUser(null);
        }
      }
    })();

    return () => {
      active = false;
      setWishlistRemote(false);
    };
  }, [setUser]);

  return null;
}
