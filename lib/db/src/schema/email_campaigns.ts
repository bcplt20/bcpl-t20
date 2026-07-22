import { pgTable, uuid, varchar, text, integer, json, timestamp } from "drizzle-orm/pg-core";

/** Real Brevo email campaigns sent from the admin panel.
 *  status: sending | sent | failed. Rows stuck in 'sending' at boot are marked failed. */
export const emailCampaignsTable = pgTable("email_campaigns", {
  id:              uuid("id").primaryKey().defaultRandom(),
  subject:         varchar("subject", { length: 300 }).notNull(),
  body:            text("body").notNull(),
  audience:        json("audience").$type<{ stage?: string; city?: string }>().default({}).notNull(),
  status:          varchar("status", { length: 20 }).default("sending").notNull(),
  totalRecipients: integer("total_recipients").default(0).notNull(),
  sentCount:       integer("sent_count").default(0).notNull(),
  failedCount:     integer("failed_count").default(0).notNull(),
  testSentTo:      varchar("test_sent_to", { length: 255 }),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt:     timestamp("completed_at", { withTimezone: true }),
});

export type EmailCampaign = typeof emailCampaignsTable.$inferSelect;
