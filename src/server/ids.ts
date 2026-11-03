import { randomUUID } from "node:crypto";

/**
 * Short, prefixed, collision-resistant identifiers.
 *
 * The original demo data used hand-written ids (`p-001`, `o-001`); new rows
 * created through the API keep the same prefix convention so they remain
 * visually consistent in the admin panel.
 */
export function newId(prefix: string): string {
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}
