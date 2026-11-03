/**
 * The customer-panel navigation lives with its feature module.
 * Re-exported here so layout-level imports stay within `components/layout`.
 */
export {
  AccountNavLinks,
  ACCOUNT_NAV_ITEMS,
  isAccountNavActive,
} from "@/features/account/components/account-nav";
export type { AccountNavItem } from "@/features/account/components/account-nav";
