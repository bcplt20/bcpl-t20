import { pgTable, uuid, varchar, text, json, boolean, bigint, timestamp } from "drizzle-orm/pg-core";

/* Admin content tools: media library (S3), content-calendar planner,
 * WhatsApp template registry. Managed by api-server routes/adminTools.ts
 * (raw-SQL ensure at startup — drizzle-kit push is not used in this repo). */

export const mediaFoldersTable = pgTable("media_folders", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      varchar("name", { length: 150 }).notNull(),
  kind:      varchar("kind", { length: 10 }).default("photo").notNull(), // photo | video | mixed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type MediaFolder = typeof mediaFoldersTable.$inferSelect;

export const mediaFilesTable = pgTable("media_files", {
  id:          uuid("id").primaryKey().defaultRandom(),
  folderId:    uuid("folder_id").notNull().references(() => mediaFoldersTable.id),
  name:        varchar("name", { length: 300 }).notNull(),
  s3Key:       varchar("s3_key", { length: 500 }).notNull(),
  s3Url:       varchar("s3_url", { length: 1000 }).notNull(),
  contentType: varchar("content_type", { length: 100 }).notNull(),
  sizeBytes:   bigint("size_bytes", { mode: "number" }).default(0).notNull(),
  kind:        varchar("kind", { length: 10 }).notNull(), // photo | video
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type MediaFile = typeof mediaFilesTable.$inferSelect;

export const plannedPostsTable = pgTable("planned_posts", {
  id:        uuid("id").primaryKey().defaultRandom(),
  postDate:  varchar("post_date", { length: 10 }).notNull(), // YYYY-MM-DD
  postTime:  varchar("post_time", { length: 5 }),            // HH:MM (24 h)
  platform:  varchar("platform", { length: 30 }).notNull(),
  postType:  varchar("post_type", { length: 30 }).default("Post").notNull(),
  caption:   text("caption").notNull(),
  status:    varchar("status", { length: 20 }).default("draft").notNull(), // draft | planned | posted
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type PlannedPost = typeof plannedPostsTable.$inferSelect;

export const whatsappTemplatesTable = pgTable("whatsapp_templates", {
  id:           uuid("id").primaryKey().defaultRandom(),
  name:         varchar("name", { length: 100 }).notNull().unique(),
  category:     varchar("category", { length: 30 }).default("Utility").notNull(),
  language:     varchar("language", { length: 40 }).default("English").notNull(),
  body:         text("body").notNull(),
  varNames:     json("var_names").$type<string[]>().default([]).notNull(),
  sampleValues: json("sample_values").$type<string[]>().default([]).notNull(),
  // Manual tracking label set by the admin (draft | submitted | approved | rejected).
  // NOT synced with Interakt — there is no Interakt management API connection.
  status:       varchar("status", { length: 20 }).default("draft").notNull(),
  // true → the server code sends this template automatically (name must match lib/whatsapp.ts WA.*)
  usedInCode:   boolean("used_in_code").default(false).notNull(),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type WhatsappTemplate = typeof whatsappTemplatesTable.$inferSelect;
