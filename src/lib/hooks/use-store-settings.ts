"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api-client";
import { FREE_SHIPPING_THRESHOLD, SITE, TAX_RATE } from "@/lib/constants";

export interface ClientStoreSettings {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  freeShipping: number;
  /** Tax rate percentage (e.g. 9 for 9%) */
  taxRate: number;
  standardShipping: number;
  expressShipping: number;
  enableWallet: boolean;
  enableCod: boolean;
  enableReviews: boolean;
  defaultOrder: "featured" | "newest" | "price-asc";
}

export const DEFAULT_CLIENT_SETTINGS: ClientStoreSettings = {
  name: SITE.name,
  tagline: SITE.tagline,
  phone: SITE.phone,
  email: SITE.email,
  address: SITE.address,
  freeShipping: FREE_SHIPPING_THRESHOLD,
  taxRate: TAX_RATE * 100,
  standardShipping: 149_000,
  expressShipping: 349_000,
  enableWallet: true,
  enableCod: false,
  enableReviews: true,
  defaultOrder: "featured",
};

let cachedSettings: ClientStoreSettings | null = null;
const listeners = new Set<(settings: ClientStoreSettings) => void>();

export function updateClientStoreSettings(patch: Partial<ClientStoreSettings>) {
  cachedSettings = { ...(cachedSettings ?? DEFAULT_CLIENT_SETTINGS), ...patch };
  listeners.forEach((listener) => listener(cachedSettings!));
}

export function useStoreSettings(): ClientStoreSettings {
  const [settings, setSettings] = React.useState<ClientStoreSettings>(
    cachedSettings ?? DEFAULT_CLIENT_SETTINGS,
  );

  React.useEffect(() => {
    let mounted = true;

    const listener = (newSettings: ClientStoreSettings) => {
      if (mounted) setSettings(newSettings);
    };
    listeners.add(listener);

    if (!cachedSettings) {
      apiFetch<ClientStoreSettings>("/api/settings")
        .then((data) => {
          if (data && mounted) {
            cachedSettings = { ...DEFAULT_CLIENT_SETTINGS, ...data };
            listeners.forEach((l) => l(cachedSettings!));
          }
        })
        .catch(() => {
          // Fall back gracefully to defaults
        });
    }

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return settings;
}
