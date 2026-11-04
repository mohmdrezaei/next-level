"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiFetch } from "@/lib/api-client";
import type { Product } from "@/features/products/types";

import { toWishlistItem, type WishlistItem } from "../types";

export { toWishlistItem, type WishlistItem };

interface WishlistState {
  currentUserId: string | null;
  itemsByUser: Record<string, WishlistItem[]>;
  items: WishlistItem[];
  setUser: (userId: string | null, incoming?: WishlistItem[]) => void;
  toggle: (product: Product) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  hydrate: (incoming: WishlistItem[]) => void;
}

/* -------------------------------------------------------------------------- */
/*  Server mirror                                                             */
/* -------------------------------------------------------------------------- */

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
      currentUserId: null,
      itemsByUser: {},
      items: [],

      setUser: (userId, incoming) => {
        const userKey = userId || "__guest__";
        set((state) => {
          const userItems = incoming !== undefined ? incoming : (state.itemsByUser[userKey] ?? []);
          return {
            currentUserId: userId,
            items: userItems,
            itemsByUser: {
              ...state.itemsByUser,
              [userKey]: userItems,
            },
          };
        });
      },

      toggle: (product) => {
        const userKey = get().currentUserId || "__guest__";
        const currentItems = get().items;
        const exists = currentItems.some((item) => item.id === product.id);
        let nextItems: WishlistItem[];

        if (exists) {
          nextItems = currentItems.filter((item) => item.id !== product.id);
          mirror("/api/wishlist", { method: "DELETE", query: { productId: product.id } });
        } else {
          nextItems = [toWishlistItem(product), ...currentItems];
          mirror("/api/wishlist", { method: "POST", body: { productId: product.id } });
        }

        set((state) => ({
          items: nextItems,
          itemsByUser: { ...state.itemsByUser, [userKey]: nextItems },
        }));

        return !exists;
      },

      remove: (id) => {
        const userKey = get().currentUserId || "__guest__";
        const nextItems = get().items.filter((item) => item.id !== id);
        set((state) => ({
          items: nextItems,
          itemsByUser: { ...state.itemsByUser, [userKey]: nextItems },
        }));
        mirror("/api/wishlist", { method: "DELETE", query: { productId: id } });
      },

      clear: () => {
        const userKey = get().currentUserId || "__guest__";
        set((state) => ({
          items: [],
          itemsByUser: { ...state.itemsByUser, [userKey]: [] },
        }));
        mirror("/api/wishlist", { method: "DELETE", query: { all: 1 } });
      },

      hydrate: (incoming) => {
        const userKey = get().currentUserId || "__guest__";
        set((state) => {
          const currentItems = state.itemsByUser[userKey] ?? [];
          const known = new Set(currentItems.map((item) => item.id));
          const missing = incoming.filter((item) => !known.has(item.id));
          const nextItems = missing.length ? [...currentItems, ...missing] : currentItems;
          return {
            items: nextItems,
            itemsByUser: { ...state.itemsByUser, [userKey]: nextItems },
          };
        });
      },
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
