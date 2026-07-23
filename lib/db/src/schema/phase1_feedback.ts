import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { registrationsTable } from "./registrations";

/**
 * §41 — process-clarity feedback on the Phase 1 result experience.
 * One row per registration (upsert on resubmit). Negative feedback is
 * stored verbatim for BCPL analysis — never suppressed.
 */
export const phase1FeedbackTable = pgTable("phase1_feedback", {
  id:             uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull().references(() => registrationsTable.id).unique(),
  rating:         text("rating").notNull(),   // not_clear | mostly_clear | very_clear
  comment:        text("comment"),            // optional free text (≤1000 chars, API-enforced)
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Phase1Feedback = typeof phase1FeedbackTable.$inferSelect;
