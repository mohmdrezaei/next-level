/**
 * SQL pattern helpers.
 *
 * Every query in this project goes through Drizzle's parameter binding, so user
 * input can never change the *structure* of a statement — classic SQL injection
 * is already off the table. What parameter binding does **not** do is stop a
 * user from injecting LIKE *wildcards*: the pattern itself is still data that
 * `ILIKE` interprets.
 *
 * Left unescaped, a search for `%` matches every row, and a pattern like
 * `a%b%c%d%e%f` can be made pathologically expensive on a large table. Escaping
 * the metacharacters keeps search behaving like a literal substring search.
 *
 * Postgres uses `\` as the default `LIKE`/`ILIKE` escape character, so `\%`,
 * `\_` and `\\` are what we emit.
 */
export function escapeLikePattern(input: unknown): string {
  return String(input ?? "").replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Build a `%needle%` pattern with the needle escaped. */
export function containsPattern(input: unknown): string {
  return `%${escapeLikePattern(input)}%`;
}

/** Build a `needle%` prefix pattern with the needle escaped. */
export function prefixPattern(input: unknown): string {
  return `${escapeLikePattern(input)}%`;
}
