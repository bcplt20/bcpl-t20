import { pgTable, uuid, varchar, text, integer, json, timestamp } from "drizzle-orm/pg-core";

/** Real bulk SMS / WhatsApp campaigns sent from the admin panel to player
 *  segments (stage + trial city) — the SMS/WhatsApp twin of email_campaigns.
 *
 *  channel: sms | whatsapp
 *   - sms      → delivered ONLY via a DLT-approved MSG91 Flow template
 *                (flowTemplateId is required; NO raw-text bulk sends ever).
 *   - whatsapp → delivered via an Interakt template picked from
 *                whatsapp_templates (templateName is required).
 *
 *  status: sending | sent | failed | dry_run. A row stuck in 'sending' at boot
 *  means the process died mid-send and is marked 'failed' by the startup sweep.
 *
 *  totals mirror the per-recipient outcomes recorded in notification_logs:
 *  sent + failed + skipped, plus the dry-run count (would-send outside prod). */
export const smsCampaignsTable = pgTable("sms_campaigns", {
  id:              uuid("id").primaryKey().defaultRandom(),
  channel:         varchar("channel", { length: 20 }).notNull(), // sms | whatsapp
  name:            varchar("name", { length: 150 }).notNull(),
  // Free-text preview/reference of the message (SMS text or WhatsApp body).
  body:            text("body").default("").notNull(),
  // SMS only: the DLT-approved MSG91 Flow template id used for the send.
  flowTemplateId:  varchar("flow_template_id", { length: 120 }),
  // WhatsApp only: the Interakt template name (from whatsapp_templates).
  templateName:    varchar("template_name", { length: 120 }),
  // Ordered template variables (var1, var2 … / {{1}}, {{2}} …).
  templateVars:    json("template_vars").$type<string[]>().default([]).notNull(),
  audience:        json("audience").$type<{ stage?: string; city?: string }>().default({}).notNull(),
  status:          varchar("status", { length: 20 }).default("sending").notNull(),
  totalRecipients: integer("total_recipients").default(0).notNull(),
  sentCount:       integer("sent_count").default(0).notNull(),
  failedCount:     integer("failed_count").default(0).notNull(),
  skippedCount:    integer("skipped_count").default(0).notNull(),
  dryRun:          integer("dry_run").default(0).notNull(), // 1 = dry-run (nothing sent)
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt:     timestamp("completed_at", { withTimezone: true }),
});

export type SmsCampaign = typeof smsCampaignsTable.$inferSelect;
