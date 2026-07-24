/**
 * Dead Gemini model self-heal.
 *
 * A stored phase1_ai_config that still pins the retired 1.x/2.x model
 * families (saved before the July 2026 model refresh) must never reach
 * callers, must be migrated away by any config save, and an admin PATCH
 * must not be able to pin a retired model again. (Prod incident: stored
 * pins override code defaults, so AI evals kept failing after deploy.)
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  getPhase1Config, updatePhase1Config, bustPhase1ConfigCache,
  phase1ConfigSchema, PHASE1_CONFIG_KEY,
  GEMINI_PRIMARY_DEFAULT, GEMINI_VALIDATION_DEFAULT, isDeadGeminiModel,
} from "../src/lib/phase1Config";

let hadRow = false;
let originalRow: unknown = null;
const savedEnv: Record<string, string | undefined> = {};
/* Base mirrors the CURRENT stored row (parsed) so parallel suites reading
   business flags (aiEnabled etc.) see unchanged values during this file. */
let base: Record<string, unknown>;

async function writeRaw(value: unknown) {
  await db.insert(siteSettingsTable).values({ key: PHASE1_CONFIG_KEY, value })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value, updatedAt: sql`now()` } });
  bustPhase1ConfigCache();
}
async function readRaw(): Promise<Record<string, unknown>> {
  const rows = await db.select().from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, PHASE1_CONFIG_KEY)).limit(1);
  return (rows[0]?.value as Record<string, unknown>) ?? {};
}

beforeAll(async () => {
  for (const k of ["GEMINI_PRIMARY_MODEL", "GEMINI_VALIDATION_MODEL"]) {
    savedEnv[k] = process.env[k];
    delete process.env[k]; // env overrides would mask what we're testing
  }
  const rows = await db.select().from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, PHASE1_CONFIG_KEY)).limit(1);
  hadRow = rows.length > 0;
  originalRow = rows[0]?.value ?? null;
  const parsed = phase1ConfigSchema.safeParse(originalRow ?? {});
  base = { ...(parsed.success ? parsed.data : phase1ConfigSchema.parse({})) };
});

afterAll(async () => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
  if (hadRow) await writeRaw(originalRow);
  else {
    await db.delete(siteSettingsTable).where(eq(siteSettingsTable.key, PHASE1_CONFIG_KEY));
    bustPhase1ConfigCache();
  }
});

beforeEach(() => bustPhase1ConfigCache());

describe("phase1 config: retired Gemini model self-heal", () => {
  it("classifies models correctly", () => {
    expect(isDeadGeminiModel("gemini-2.5-flash")).toBe(true);
    expect(isDeadGeminiModel("gemini-2.0-flash-lite")).toBe(true);
    expect(isDeadGeminiModel("gemini-1.5-pro")).toBe(true);
    expect(isDeadGeminiModel(GEMINI_PRIMARY_DEFAULT)).toBe(false);
    expect(isDeadGeminiModel(GEMINI_VALIDATION_DEFAULT)).toBe(false);
    expect(isDeadGeminiModel("gemini-3.5-pro")).toBe(false);
  });

  it("heals retired pins at read time (the prod scenario)", async () => {
    await writeRaw({ ...base, geminiPrimaryModel: "gemini-2.5-flash", geminiValidationModel: "gemini-2.5-flash-lite" });
    const cfg = await getPhase1Config();
    expect(cfg.geminiPrimaryModel).toBe(GEMINI_PRIMARY_DEFAULT);
    expect(cfg.geminiValidationModel).toBe(GEMINI_VALIDATION_DEFAULT);
  });

  it("preserves stored CURRENT-generation custom models", async () => {
    await writeRaw({ ...base, geminiPrimaryModel: "gemini-3.5-pro", geminiValidationModel: GEMINI_VALIDATION_DEFAULT });
    const cfg = await getPhase1Config();
    expect(cfg.geminiPrimaryModel).toBe("gemini-3.5-pro");
  });

  it("rejects an admin PATCH that pins a retired model", async () => {
    await expect(updatePhase1Config({ geminiPrimaryModel: "gemini-2.0-flash" }, "vitest"))
      .rejects.toThrow(/retired/);
    await expect(updatePhase1Config({ geminiValidationModel: "gemini-1.5-flash" }, "vitest"))
      .rejects.toThrow(/retired/);
  });

  it("any config save migrates a retired pin in the stored row", async () => {
    await writeRaw({ ...base, geminiPrimaryModel: "gemini-2.5-flash", geminiValidationModel: "gemini-2.5-flash-lite" });
    const prevMinScore = Number(base["minScore"] ?? 80);
    await updatePhase1Config({ minScore: prevMinScore }, "vitest"); // unrelated field
    const row = await readRaw();
    expect(row["geminiPrimaryModel"]).toBe(GEMINI_PRIMARY_DEFAULT);
    expect(row["geminiValidationModel"]).toBe(GEMINI_VALIDATION_DEFAULT);
    expect(row["minScore"]).toBe(prevMinScore);
  });

  it("env override still wins over healing (explicit ops kill switch)", async () => {
    await writeRaw({ ...base, geminiPrimaryModel: "gemini-2.5-flash" });
    process.env["GEMINI_PRIMARY_MODEL"] = "gemini-9.9-test";
    try {
      bustPhase1ConfigCache();
      const cfg = await getPhase1Config();
      expect(cfg.geminiPrimaryModel).toBe("gemini-9.9-test");
    } finally {
      delete process.env["GEMINI_PRIMARY_MODEL"];
      bustPhase1ConfigCache();
    }
  });
});
