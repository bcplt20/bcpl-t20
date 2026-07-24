import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Explicit pool sizing (scalability audit): 2 PM2 workers x PGPOOL_MAX
// connections must stay well under RDS max_connections. Defaults match the
// previous implicit pg defaults (max 10) so behavior only changes via env.
const intEnv = (name: string, fallback: number): number => {
  const raw = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
};

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
  max: intEnv("PGPOOL_MAX", 10),
  idleTimeoutMillis: intEnv("PGPOOL_IDLE_TIMEOUT_MS", 30_000),
  connectionTimeoutMillis: intEnv("PGPOOL_CONNECT_TIMEOUT_MS", 10_000),
  // Client-side guard against hung queries (works on RDS + Neon alike).
  // 60s default leaves ample room for startup backfills; override via env.
  query_timeout: intEnv("PG_QUERY_TIMEOUT_MS", 60_000),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
