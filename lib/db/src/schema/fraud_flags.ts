import { pgTable, uuid, varchar, timestamp, json } from "drizzle-orm/pg-core";
import { registrationsTable } from "./registrations";

/**
 * Fraud flags (Stage 6) — one row per registration+type finding.
 *
 * type:   duplicate_video | duplicate_aadhaar | duplicate_pan
 * status: flagged | cleared | blocked
 *
 * Detail carries the evidence (matched registration ids, shared ref/etag).
 * Uniqueness on (registration_id, type) means a re-scan can never
 * resurrect or duplicate a finding an admin already reviewed.
 */
export const fraudFlagsTable = pgTable("fraud_flags", {
  id:             uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull().references(() => registrationsTable.id),
  type:           varchar("type", { length: 40 }).notNull(),
  status:         varchar("status", { length: 20 }).default("flagged").notNull(),
  reasonCode:     varchar("reason_code", { length: 80 }),
  detail:         json("detail").$type<Record<string, unknown>>(),
  note:           varchar("note", { length: 1000 }),
  createdBy:      varchar("created_by", { length: 120 }),
  reviewedBy:     varchar("reviewed_by", { length: 120 }),
  reviewedAt:     timestamp("reviewed_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type FraudFlag = typeof fraudFlagsTable.$inferSelect;
