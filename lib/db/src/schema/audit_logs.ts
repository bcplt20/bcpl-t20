import { pgTable, uuid, varchar, json, timestamp } from "drizzle-orm/pg-core";

/**
 * Audit trail for admin configuration changes and sensitive actions
 * (who / when / old value / new value).
 */
export const auditLogsTable = pgTable("audit_logs", {
  id:        uuid("id").primaryKey().defaultRandom(),
  actor:     varchar("actor", { length: 100 }).notNull(),   // e.g. "admin"
  actorIp:   varchar("actor_ip", { length: 45 }),
  action:    varchar("action", { length: 50 }).notNull(),   // e.g. "settings.update"
  entity:    varchar("entity", { length: 60 }).notNull(),   // e.g. "site_settings"
  entityKey: varchar("entity_key", { length: 120 }),
  oldValue:  json("old_value"),
  newValue:  json("new_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
