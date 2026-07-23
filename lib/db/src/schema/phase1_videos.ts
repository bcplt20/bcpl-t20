import { pgTable, uuid, varchar, integer, bigint, boolean, timestamp } from "drizzle-orm/pg-core";
import { registrationsTable } from "./registrations";

export const phase1VideosTable = pgTable("phase1_videos", {
  id:              uuid("id").primaryKey().defaultRandom(),
  registrationId:  uuid("registration_id").notNull().references(() => registrationsTable.id),
  s3Key:           varchar("s3_key",  { length: 500 }),
  s3Url:           varchar("s3_url",  { length: 1000 }),
  durationSeconds: integer("duration_seconds"),
  // Technical metadata captured by server-side validation (Phase 1 AI pipeline)
  mimeType:        varchar("mime_type", { length: 60 }),
  sizeBytes:       bigint("size_bytes", { mode: "number" }),
  etag:            varchar("etag", { length: 80 }),
  declarationAccepted: boolean("declaration_accepted").default(false).notNull(),
  attemptNumber:   integer("attempt_number").default(1).notNull(),
  submittedAt:     timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  status:          varchar("status", { length: 20 }).default("submitted").notNull(), // submitted | reviewed | superseded
});

export type Phase1Video = typeof phase1VideosTable.$inferSelect;
