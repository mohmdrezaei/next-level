import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

function loadEnv(file = ".env") {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv();
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });

try {
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name`;
  console.log("TABLES:", tables.map((t) => t.table_name).join(", "));

  const mig = await sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id`;
  console.log("APPLIED MIGRATIONS:", mig.length);

  const counts = {};
  for (const t of tables.map((r) => r.table_name)) {
    if (t.startsWith("__")) continue;
    const [row] = await sql`SELECT count(*)::int AS n FROM ${sql(t)}`;
    counts[t] = row.n;
  }
  console.log("ROW COUNTS:", JSON.stringify(counts, null, 2));
} catch (error) {
  console.error("DB VERIFY FAILED:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
