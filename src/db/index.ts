/**
 * PostgreSQL client + Drizzle instance.
 *
 * The connection is cached on `globalThis` so that Next.js dev-server hot
 * reloads (and route-handler re-evaluation) reuse a single pool instead of
 * opening a new one on every module evaluation.
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

interface DbCache {
  sql: Sql;
  db: Database;
}

declare global {
  // eslint-disable-next-line no-var
  var __nextLevelDb: DbCache | undefined;
}

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy `.env.example` to `.env` and point it at your PostgreSQL instance.",
    );
  }
  return url;
}

function createCache(): DbCache {
  const poolMax = Number(process.env.DB_POOL_MAX ?? 10);
  const sql = postgres(connectionString(), {
    max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 10,
    // Drizzle owns the query building; keep the driver quiet unless asked.
    debug: process.env.DB_DEBUG === "true",
    // `prepare: false` keeps the client compatible with transaction poolers
    // (PgBouncer / Supabase / Neon pooled connections).
    prepare: false,
    onnotice: () => {},
  });

  return { sql, db: drizzle(sql, { schema }) };
}

function getCache(): DbCache {
  if (!globalThis.__nextLevelDb) {
    globalThis.__nextLevelDb = createCache();
  }
  return globalThis.__nextLevelDb;
}

/** Drizzle query builder — the main entry point for application code. */
export const db: Database = new Proxy({} as Database, {
  get(_target, property) {
    const value = Reflect.get(getCache().db, property) as unknown;
    return typeof value === "function" ? value.bind(getCache().db) : value;
  },
});

/** Raw postgres.js client, for health checks and hand-written SQL. */
export function getSql(): Sql {
  return getCache().sql;
}

export { schema };
