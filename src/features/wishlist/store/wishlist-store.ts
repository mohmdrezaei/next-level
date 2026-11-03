"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiFetch } from "@/lib/api-client";
import type { Product } from "@/features/products/types";

export interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  latinName: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  category: string;
  addedAt: number;
}

/** Map a catalogue product into the slim shape the wishlist UI renders. */
export function toWishlistItem(product: Product): WishlistItem {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    latinName: product.latinName,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    image: product.images[0]?.src ?? "",
    category: product.category,
    addedAt: Date.now(),
  };
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (product: Product) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  /** Merge products saved on the server into the local list. */
  hydrate: (incoming: WishlistItem[]) => void;
}

/* -------------------------------------------------------------------------- */
/*  Server mirror                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Guests keep their list in `localStorage` only. Once `WishlistSync` confirms a
 * session, every mutation is also mirrored to `/api/wishlist` so the list
 * follows the shopper across devices. Failures are swallowed — the local list
 * stays authoritative for the UI.
 */
let remoteEnabled = false;

export function setWishlistRemote(enabled: boolean): void {
  remoteEnabled = enabled;
}

function mirror(path: string, options: Parameters<typeof apiFetch>[1]): void {
  if (!remoteEnabled) return;
  void apiFetch(path, options).catch(() => {});
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (product) => {
        const exists = get().items.some((item) => item.id === product.id);
        if (exists) {
          set((state) => ({ items: state.items.filter((item) => item.id !== product.id) }));
          mirror("/api/wishlist", { method: "DELETE", query: { productId: product.id } });
          return false;
        }
        set((state) => ({ items: [toWishlistItem(product), ...state.items] }));
        mirror("/api/wishlist", { method: "POST", body: { productId: product.id } });
        return true;
      },

      remove: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
        mirror("/api/wishlist", { method: "DELETE", query: { productId: id } });
      },

      clear: () => {
        set({ items: [] });
        mirror("/api/wishlist", { method: "DELETE", query: { all: 1 } });
      },

      hydrate: (incoming) =>
        set((state) => {
          const known = new Set(state.items.map((item) => item.id));
          const missing = incoming.filter((item) => !known.has(item.id));
          return missing.length ? { items: [...state.items, ...missing] } : state;
        }),
    }),
    {
      name: "nextlevel.wishlist",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useWishlistItems = () => useWishlistStore((state) => state.items);
export const useWishlistCount = () => useWishlistStore((state) => state.items.length);
export const useIsWished = (id: string) =>
  useWishlistStore((state) => state.items.some((item) => item.id === id));
