/**
 * Database-backed set reads for **server components**.
 *
 * The pure pricing/availability helpers live in `./set-pricing` so client
 * components can use them without importing server-only database code.
 */
export {
  getFeaturedSets,
  getResolvedSet,
  getResolvedSets,
  getSetsContainingProduct,
} from "@/server/repositories/sets";
