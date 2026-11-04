export type UserRole = "customer" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  customerId?: string;
  /** Deterministic accent used for the generated avatar. */
  accent: string;
}

export interface AuthState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
}

export const ACCENTS = ["#c8a24c", "#6c9bd1", "#6fae7f", "#a9713b", "#b06a8a", "#7a7ad1"];

export function accentFor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  }
  return ACCENTS[hash % ACCENTS.length];
}
