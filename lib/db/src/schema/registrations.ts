import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const registrationsTable = pgTable("registrations", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").notNull().references(() => usersTable.id),
  // Human-readable sequential ID per trial city: BCPL-DEL-1, BCPL-MUM-2 …
  regNumber:    varchar("reg_number",  { length: 30 }).unique(),
  role:         varchar("role",        { length: 20 }).notNull(), // bat | bowl | wk | ar
  trialCity:    varchar("trial_city",  { length: 50 }),
  // pending | payment_done | video_submitted | selected | rejected
  phase1Status: varchar("phase1_status", { length: 30 }).default("pending").notNull(),
  // null | pending | payment_done | kyc_done | selected | rejected
  phase2Status: varchar("phase2_status", { length: 30 }),
  videoDeadline: timestamp("video_deadline", { withTimezone: true }),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Registration = typeof registrationsTable.$inferSelect;
