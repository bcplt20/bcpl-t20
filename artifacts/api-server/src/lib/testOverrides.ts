/**
 * Staging/test-mode forced outcomes (spec test-mode section: forced score,
 * forced validation failure, forced third pass, …).
 *
 * Stored in site_settings under `phase1_test_overrides` as a map keyed by
 * registration id. Honoured ONLY while cfg.testMode is true — in production
 * (testMode off) overrides are dead weight and ignored.
 *
 * Shape per registration:
 *   { "validity": { partial §17 fields... }, "score": 0-100, "forcePass3": bool }
 */
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { validitySchema } from "./gemini";
import { getPhase1Config } from "./phase1Config";
import { logger } from "./logger";

export const PHASE1_TEST_OVERRIDES_KEY = "phase1_test_overrides";

const overrideEntry = z.object({
  validity:   validitySchema.partial().optional(),
  score:      z.number().int().min(0).max(100).optional(),
  confidence: z.number().min(0).max(1).optional(),
  forcePass3: z.boolean().optional(),
}).passthrough();
export type Phase1TestOverride = z.infer<typeof overrideEntry>;

const overridesMap = z.record(z.string(), overrideEntry);

export async function getTestOverride(registrationId: string): Promise<Phase1TestOverride | undefined> {
  const cfg = await getPhase1Config();
  if (!cfg.testMode) return undefined;
  try {
    const rows = await db.select().from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, PHASE1_TEST_OVERRIDES_KEY)).limit(1);
    if (!rows[0]?.value) return undefined;
    const parsed = overridesMap.safeParse(rows[0].value);
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, "phase1 test overrides invalid — ignoring");
      return undefined;
    }
    return parsed.data[registrationId];
  } catch (err) {
    logger.error({ err }, "phase1 test overrides read failed — ignoring");
    return undefined;
  }
}
