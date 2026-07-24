import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * app_flags — one-time migration/backfill markers.
 *
 * Created at runtime by artifacts/api-server/src/routes/register.ts
 * (CREATE TABLE IF NOT EXISTS) to guard one-time data fixes such as
 * 'reg_number_paid_only_v1'. Declared here so drizzle-kit push does
 * not propose deleting the table (that wipe would re-run the guarded
 * one-time migrations on next boot).
 *
 * Column shapes MUST match the runtime DDL exactly:
 *   key varchar(60) PRIMARY KEY, done_at timestamptz NOT NULL DEFAULT now()
 */
export const appFlags = pgTable("app_flags", {
  key: varchar("key", { length: 60 }).primaryKey(),
  doneAt: timestamp("done_at", { withTimezone: true }).notNull().defaultNow(),
});
