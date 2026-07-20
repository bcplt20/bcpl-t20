import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { registrationsTable } from "./registrations";

export const phase1VideosTable = pgTable("phase1_videos", {
  id:              uuid("id").primaryKey().defaultRandom(),
  registrationId:  uuid("registration_id").notNull().references(() => registrationsTable.id),
  s3Key:           varchar("s3_key",  { length: 500 }),
  s3Url:           varchar("s3_url",  { length: 1000 }),
  durationSeconds: integer("duration_seconds"),
  submittedAt:     timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  status:          varchar("status", { length: 20 }).default("submitted").notNull(), // submitted | reviewed
});

export type Phase1Video = typeof phase1VideosTable.$inferSelect;
