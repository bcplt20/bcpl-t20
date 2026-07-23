/**
 * Phase 1 AI pipeline configuration.
 *
 * Single source of truth for every tunable used by the automated Phase 1
 * evaluation system. Values live in site_settings (admin-editable via
 * /api/settings/admin/*), validated with zod, cached briefly in-process,
 * and hard-overridable through environment variables (staging kill switches).
 *
 * IMPORTANT SAFETY DEFAULTS: aiEnabled / resultReleaseEnabled /
 * realNotificationsEnabled all default to FALSE — nothing touches real
 * players until the admin explicitly flips the switches.
 */
import { db } from "@workspace/db";
import { siteSettingsTable, auditLogsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { logger } from "./logger";

/* ─────────────────────────── main config ─────────────────────────── */

export const PHASE1_CONFIG_KEY = "phase1_ai_config";

/** Base object schema (kept un-refined so .partial() works for patches). */
export const phase1ConfigBase = z.object({
  // Staging switches — all OFF by default
  aiEnabled:                z.boolean().default(false),
  resultReleaseEnabled:     z.boolean().default(false),
  realNotificationsEnabled: z.boolean().default(false),
  /** Test mode: mock Gemini, forced outcomes allowed, no real charges/messages. */
  testMode:                 z.boolean().default(true),

  // Business rules (backend-owned, never AI-owned)
  minScore:           z.number().int().min(0).max(100).default(80),
  resultReleaseHours: z.number().min(0).max(720).default(48),
  uploadWindowDays:   z.number().int().min(1).max(60).default(7),

  // Video constraints
  videoMinSeconds:    z.number().int().min(5).max(600).default(30),
  videoMaxSeconds:    z.number().int().min(10).max(900).default(60),
  maxVideoFileSizeMb: z.number().int().min(10).max(2048).default(200),
  maxReuploads:       z.number().int().min(0).max(10).default(2),

  // Multi-pass scoring
  maxScoreVariance: z.number().int().min(0).max(100).default(8),
  minAiConfidence:  z.number().min(0).max(1).default(0.8),

  // Models & versioning
  // Pinned stable models (July 2026). The 2.5 family 404s for API keys created
  // after mid-2026 ("no longer available to new users"), so keep these current.
  // GEMINI_PRIMARY_MODEL / GEMINI_VALIDATION_MODEL env vars override without a deploy.
  geminiPrimaryModel:    z.string().min(1).default("gemini-3.5-flash"),
  geminiValidationModel: z.string().min(1).default("gemini-3.1-flash-lite"),
  promptVersion:     z.string().min(1).default("V1"),
  rubricVersion:     z.string().min(1).default("V1"),
  assessmentVersion: z.string().min(1).default("V1"),
});

export const phase1ConfigSchema = phase1ConfigBase.refine(
  (c) => c.videoMinSeconds < c.videoMaxSeconds,
  { message: "videoMinSeconds must be less than videoMaxSeconds" },
);
export type Phase1Config = z.infer<typeof phase1ConfigSchema>;

function envBool(name: string): boolean | undefined {
  const v = process.env[name];
  if (v === undefined || v === "") return undefined;
  return v === "1" || v.toLowerCase() === "true";
}

/** Environment variables act as hard overrides (deployment kill switches). */
function applyEnvOverrides(cfg: Phase1Config): Phase1Config {
  const out = { ...cfg };
  const ai = envBool("PHASE1_AI_ENABLED");
  const rel = envBool("RESULT_RELEASE_ENABLED");
  const msg = envBool("REAL_NOTIFICATIONS_ENABLED");
  const test = envBool("PHASE1_TEST_MODE");
  if (ai !== undefined) out.aiEnabled = ai;
  if (rel !== undefined) out.resultReleaseEnabled = rel;
  if (msg !== undefined) out.realNotificationsEnabled = msg;
  if (test !== undefined) out.testMode = test;
  if (process.env.GEMINI_PRIMARY_MODEL) out.geminiPrimaryModel = process.env.GEMINI_PRIMARY_MODEL;
  if (process.env.GEMINI_VALIDATION_MODEL) out.geminiValidationModel = process.env.GEMINI_VALIDATION_MODEL;
  return out;
}

let cache: { value: Phase1Config; at: number } | null = null;
const CACHE_TTL_MS = 30_000;

export function bustPhase1ConfigCache() {
  cache = null;
}

export async function getPhase1Config(): Promise<Phase1Config> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;
  let stored: unknown = {};
  try {
    const rows = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, PHASE1_CONFIG_KEY))
      .limit(1);
    stored = rows[0]?.value ?? {};
  } catch (err) {
    logger.error({ err }, "phase1Config: failed to read site_settings; using defaults");
  }
  const parsed = phase1ConfigSchema.safeParse(stored);
  let cfg: Phase1Config;
  if (parsed.success) {
    cfg = parsed.data;
  } else {
    logger.warn({ issues: parsed.error.issues }, "phase1Config: stored config invalid; using defaults");
    cfg = phase1ConfigSchema.parse({});
  }
  cfg = applyEnvOverrides(cfg);
  cache = { value: cfg, at: Date.now() };
  return cfg;
}

/** Admin update: merge patch, validate, persist, audit, bust cache. */
export async function updatePhase1Config(
  patch: unknown,
  actor: string,
  actorIp?: string,
): Promise<Phase1Config> {
  const patchParsed = phase1ConfigBase.partial().strict().parse(patch);
  const rows = await db
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, PHASE1_CONFIG_KEY))
    .limit(1);
  const oldStored = (rows[0]?.value as Record<string, unknown> | undefined) ?? {};
  const merged = phase1ConfigSchema.parse({ ...phase1ConfigSchema.parse(oldStored ?? {}), ...patchParsed });

  await db
    .insert(siteSettingsTable)
    .values({ key: PHASE1_CONFIG_KEY, value: merged })
    .onConflictDoUpdate({
      target: siteSettingsTable.key,
      set: { value: merged, updatedAt: sql`now()` },
    });
  await db.insert(auditLogsTable).values({
    actor,
    actorIp,
    action: "settings.update",
    entity: "site_settings",
    entityKey: PHASE1_CONFIG_KEY,
    oldValue: oldStored,
    newValue: merged,
  });
  bustPhase1ConfigCache();
  logger.info({ actor, keys: Object.keys(patchParsed) }, "phase1 config updated");
  return applyEnvOverrides(merged);
}

/* ─────────────────────────── rubrics ─────────────────────────── */

export const PHASE1_RUBRICS_KEY = "phase1_rubrics";

const rubricCategory = z.object({
  key:   z.string().min(1).max(40),
  label: z.string().min(1).max(80),
  max:   z.number().int().min(1).max(100),
});
const rubricSchema = z.object({ categories: z.array(rubricCategory).min(3).max(12) })
  .superRefine((r, ctx) => {
    const sum = r.categories.reduce((a, c) => a + c.max, 0);
    if (sum !== 100) ctx.addIssue({ code: "custom", message: `category maxima must total 100 (got ${sum})` });
    const keys = new Set(r.categories.map((c) => c.key));
    if (keys.size !== r.categories.length) ctx.addIssue({ code: "custom", message: "duplicate category keys" });
  });
export const rubricsSchema = z.object({
  bat:  rubricSchema,
  bowl: rubricSchema,
  ar:   rubricSchema,
  wk:   rubricSchema,
});
export type Phase1Rubrics = z.infer<typeof rubricsSchema>;
export type Phase1Rubric = z.infer<typeof rubricSchema>;

/** Initial rubrics exactly as specified (sections 20–23). */
export const DEFAULT_RUBRICS: Phase1Rubrics = {
  bat: { categories: [
    { key: "balanceSetup",        label: "Balance & Setup",                  max: 15 },
    { key: "footwork",            label: "Footwork",                         max: 20 },
    { key: "shotExecution",       label: "Shot Execution",                   max: 20 },
    { key: "timingControl",       label: "Timing & Control",                 max: 20 },
    { key: "adaptability",        label: "Range / Adaptability Evidence",    max: 10 },
    { key: "gameReadiness",       label: "Game Readiness",                   max: 10 },
    { key: "evidenceReliability", label: "Evidence Reliability",             max: 5 },
  ]},
  bowl: { categories: [
    { key: "runUpRhythm",         label: "Run-up & Rhythm",                  max: 15 },
    { key: "actionRelease",       label: "Action / Release",                 max: 20 },
    { key: "controlEvidence",     label: "Control Evidence",                 max: 25 },
    { key: "paceSpinEvidence",    label: "Pace or Spin Evidence",            max: 15 },
    { key: "variationEvidence",   label: "Variation Evidence",               max: 10 },
    { key: "repeatability",       label: "Repeatability",                    max: 10 },
    { key: "evidenceReliability", label: "Evidence Reliability",             max: 5 },
  ]},
  ar: { categories: [
    { key: "battingAbility",      label: "Batting Ability",                  max: 35 },
    { key: "bowlingAbility",      label: "Bowling Ability",                  max: 35 },
    { key: "techniqueExecution",  label: "Technique / Execution",            max: 10 },
    { key: "athleticMovement",    label: "Athletic Movement",                max: 10 },
    { key: "gameReadiness",       label: "Game Readiness",                   max: 5 },
    { key: "evidenceReliability", label: "Evidence Reliability",             max: 5 },
  ]},
  wk: { categories: [
    { key: "keepingTechnique",    label: "Keeping Technique",                max: 30 },
    { key: "movementPositioning", label: "Movement & Positioning",           max: 20 },
    { key: "receivingHands",      label: "Receiving / Hands",                max: 15 },
    { key: "stumpingReaction",    label: "Stumping / Reaction Evidence",     max: 10 },
    { key: "battingEvidence",     label: "Batting Evidence",                 max: 15 },
    { key: "athleticMovement",    label: "Athletic Movement",                max: 5 },
    { key: "evidenceReliability", label: "Evidence Reliability",             max: 5 },
  ]},
};

let rubricsCache: { value: Phase1Rubrics; at: number } | null = null;

export function bustRubricsCache() {
  rubricsCache = null;
}

export async function getPhase1Rubrics(): Promise<Phase1Rubrics> {
  if (rubricsCache && Date.now() - rubricsCache.at < CACHE_TTL_MS) return rubricsCache.value;
  let value = DEFAULT_RUBRICS;
  try {
    const rows = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, PHASE1_RUBRICS_KEY))
      .limit(1);
    if (rows[0]?.value) {
      const parsed = rubricsSchema.safeParse(rows[0].value);
      if (parsed.success) value = parsed.data;
      else logger.warn({ issues: parsed.error.issues }, "phase1 rubrics invalid in settings; using defaults");
    }
  } catch (err) {
    logger.error({ err }, "phase1Rubrics: read failed; using defaults");
  }
  rubricsCache = { value, at: Date.now() };
  return value;
}

/* ────────────────── role-specific video instructions ────────────────── */

export const PHASE1_INSTRUCTIONS_KEY = "phase1_video_instructions";

const instructionEntry = z.object({
  en: z.array(z.string().min(1).max(200)).min(1).max(15),
  hi: z.array(z.string().min(1).max(200)).min(1).max(15),
});
export const instructionsSchema = z.object({
  bat: instructionEntry, bowl: instructionEntry, ar: instructionEntry, wk: instructionEntry,
});
export type Phase1Instructions = z.infer<typeof instructionsSchema>;

export const DEFAULT_INSTRUCTIONS: Phase1Instructions = {
  bat: {
    en: [
      "Upload 30–60 seconds of footage.",
      "Show multiple genuine batting shots.",
      "Keep your full body visible where possible.",
      "Bat and ball should be visible.",
      "Use stable footage — avoid shaky video.",
      "Avoid excessive edits, filters and slow-motion-only clips.",
      "Include normal-speed cricket action.",
      "Show enough deliveries to evaluate technique.",
    ],
    hi: [
      "30–60 सेकंड का वीडियो अपलोड करें।",
      "कई असली बैटिंग शॉट दिखाएं।",
      "जहाँ हो सके पूरा शरीर दिखे।",
      "बैट और बॉल साफ़ दिखने चाहिए।",
      "कैमरा स्थिर रखें — हिलता वीडियो न भेजें।",
      "ज़्यादा एडिटिंग, फ़िल्टर या सिर्फ़ slow-motion न भेजें।",
      "नॉर्मल स्पीड की क्रिकेट एक्शन ज़रूर हो।",
      "तकनीक परखने लायक़ पर्याप्त गेंदें दिखाएं।",
    ],
  },
  bowl: {
    en: [
      "Upload 30–60 seconds of footage.",
      "Show multiple complete bowling deliveries.",
      "Show your run-up, bowling action and release.",
      "Keep your full body visible where possible.",
      "Use normal-speed footage.",
      "Avoid excessive cuts and filters.",
    ],
    hi: [
      "30–60 सेकंड का वीडियो अपलोड करें।",
      "कई पूरी गेंदबाज़ी डिलीवरी दिखाएं।",
      "रन-अप, बॉलिंग एक्शन और रिलीज़ दिखाएं।",
      "जहाँ हो सके पूरा शरीर दिखे।",
      "नॉर्मल स्पीड का वीडियो रखें।",
      "ज़्यादा कट और फ़िल्टर से बचें।",
    ],
  },
  ar: {
    en: [
      "Upload 30–60 seconds of footage.",
      "Your video MUST show both batting AND bowling.",
      "Show multiple batting shots and complete bowling deliveries.",
      "Keep your full body visible where possible.",
      "Use normal-speed, stable footage.",
      "Avoid excessive edits and filters.",
    ],
    hi: [
      "30–60 सेकंड का वीडियो अपलोड करें।",
      "वीडियो में बैटिंग और बॉलिंग दोनों ज़रूर दिखें।",
      "कई बैटिंग शॉट और पूरी बॉलिंग डिलीवरी दिखाएं।",
      "जहाँ हो सके पूरा शरीर दिखे।",
      "नॉर्मल स्पीड, स्थिर वीडियो रखें।",
      "ज़्यादा एडिटिंग और फ़िल्टर से बचें।",
    ],
  },
  wk: {
    en: [
      "Upload 30–60 seconds of footage.",
      "Show meaningful wicketkeeping actions — receiving, movement, keeping technique.",
      "Include stumping / catch actions where available.",
      "Include batting evidence where required by BCPL policy.",
      "Keep your full body visible where possible.",
      "Use normal-speed, stable footage.",
    ],
    hi: [
      "30–60 सेकंड का वीडियो अपलोड करें।",
      "विकेटकीपिंग की असली एक्शन दिखाएं — कैच लेना, मूवमेंट, तकनीक।",
      "स्टंपिंग / कैच के मौक़े हों तो ज़रूर दिखाएं।",
      "BCPL नियम के अनुसार बैटिंग भी दिखाएं।",
      "जहाँ हो सके पूरा शरीर दिखे।",
      "नॉर्मल स्पीड, स्थिर वीडियो रखें।",
    ],
  },
};

let instructionsCache: { value: Phase1Instructions; at: number } | null = null;

export function bustInstructionsCache() {
  instructionsCache = null;
}

export async function getPhase1Instructions(): Promise<Phase1Instructions> {
  if (instructionsCache && Date.now() - instructionsCache.at < CACHE_TTL_MS) return instructionsCache.value;
  let value = DEFAULT_INSTRUCTIONS;
  try {
    const rows = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, PHASE1_INSTRUCTIONS_KEY))
      .limit(1);
    if (rows[0]?.value) {
      const parsed = instructionsSchema.safeParse(rows[0].value);
      if (parsed.success) value = parsed.data;
      else logger.warn({ issues: parsed.error.issues }, "phase1 instructions invalid in settings; using defaults");
    }
  } catch (err) {
    logger.error({ err }, "phase1Instructions: read failed; using defaults");
  }
  instructionsCache = { value, at: Date.now() };
  return value;
}
