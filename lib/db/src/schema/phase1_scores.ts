import { pgTable, uuid, integer, text, timestamp } from "drizzle-orm/pg-core";
import { registrationsTable } from "./registrations";

/**
 * BCPL 100-point Phase 1 (video trial) evaluation — one row per registration.
 * Criterion maxima (35/25/15/10/10/5) are enforced in the API layer
 * (SCORE_CRITERIA in routes/results.ts) so cricket experts can retune
 * weights without a schema change. `total` is always recomputed server-side.
 */
export const phase1ScoresTable = pgTable("phase1_scores", {
  id:             uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull().references(() => registrationsTable.id).unique(),
  roleSkill:      integer("role_skill").notNull(),      // /35 role-specific cricket skill
  technique:      integer("technique").notNull(),       // /25
  execution:      integer("execution").notNull(),       // /15 control / execution
  gameAwareness:  integer("game_awareness").notNull(),  // /10
  movement:       integer("movement").notNull(),        // /10 athletic movement
  videoEvidence:  integer("video_evidence").notNull(),  // /5  video evidence quality
  total:          integer("total").notNull(),           // 0–100, server-computed
  selectorNote:   text("selector_note"),                // optional genuine feedback shown to the player
  scoredAt:       timestamp("scored_at",  { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Phase1Score = typeof phase1ScoresTable.$inferSelect;
