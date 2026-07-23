import { pgTable, uuid, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

/** Stage 5 — server-side RBAC (replaces localStorage co-admins). */
export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "REGISTRATION_TEAM",
  "PAYMENT_TEAM",
  "VIDEO_AI_OPERATIONS",
  "KYC_TEAM",
  "TRIAL_CITY_MANAGER",
  "CONTENT_TEAM",
  "MATCH_OPERATIONS",
  "SUPPORT_TEAM",
  "FINANCE_TEAM",
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const adminUsersTable = pgTable("admin_users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  email:        varchar("email", { length: 160 }).notNull().unique(),
  name:         varchar("name", { length: 120 }).notNull(),
  passwordHash: varchar("password_hash", { length: 300 }).notNull(), // scrypt — salt:hash hex, never plaintext
  role:         varchar("role", { length: 40 }).default("SUPPORT_TEAM").notNull(),
  cities:       jsonb("cities").$type<string[]>().default([]).notNull(), // TRIAL_CITY_MANAGER city scope (normalized lowercase)
  active:       boolean("active").default(true).notNull(),
  lastLoginAt:  timestamp("last_login_at", { withTimezone: true }),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AdminUserRecord = typeof adminUsersTable.$inferSelect;
