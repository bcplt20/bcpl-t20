/**
 * Gemini client for the Phase 1 pipeline — mock mode without GEMINI_API_KEY.
 *
 * MOCK MODE (staging default): deterministic structured outputs derived from
 * the video etag, so the whole pipeline runs end-to-end with zero AI cost.
 * Results carry provider:"mock" so nothing mocked can be confused with a
 * real assessment. Forced outcomes for staging tests come from
 * lib/testOverrides (honoured only while cfg.testMode is on).
 *
 * REAL MODE: direct REST calls to generativelanguage.googleapis.com using
 * GEMINI_API_KEY (spec §15 — key lives in env, prod is EC2 so no Replit
 * proxy). Video bytes stream S3 → Gemini Files API without touching disk.
 * NOTE: real mode is written but cannot be exercised until the owner
 * provides GEMINI_API_KEY.
 */
import { z } from "zod";
import { getDownloadPresignedUrl } from "./s3";
import { logger } from "./logger";

const BASE = "https://generativelanguage.googleapis.com";

export type GeminiMode = "real" | "mock";
export function geminiMode(): GeminiMode {
  return process.env.GEMINI_API_KEY ? "real" : "mock";
}

/* ───────────────────────── validity (AI pass zero, §17) ───────────────────────── */

export const validitySchema = z.object({
  validCricketVideo:            z.boolean(),
  assessmentPossible:           z.boolean(),
  playerClearlyVisible:         z.boolean(),
  sufficientCricketActions:     z.boolean(),
  roleEvidence:                 z.string().max(30),
  excessiveEditing:             z.boolean(),
  normalSpeedEvidenceAvailable: z.boolean(),
  qualityScore:                 z.number().min(0).max(100),
  reuploadRequired:             z.boolean(),
  reasonCode:                   z.string().max(40).nullable(),
});
export type ValidityResult = z.infer<typeof validitySchema>;

/** Deterministic small hash for stable mock outputs. */
export function seededInt(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

export function mockValidity(seed: string, roleLabel: string): ValidityResult {
  return {
    validCricketVideo: true,
    assessmentPossible: true,
    playerClearlyVisible: true,
    sufficientCricketActions: true,
    roleEvidence: roleLabel,
    excessiveEditing: false,
    normalSpeedEvidenceAvailable: true,
    qualityScore: 80 + seededInt(seed + ":quality", 16),
    reuploadRequired: false,
    reasonCode: null,
  };
}

/* ───────────────────────── real-mode plumbing ───────────────────────── */

function apiKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY not set");
  return k;
}

/** Stream an S3 object into the Gemini Files API (resumable, one shot). */
export async function uploadVideoToGemini(s3Key: string, mimeType: string, sizeBytes: number): Promise<{ name: string; uri: string }> {
  const start = await fetch(BASE + "/upload/v1beta/files?key=" + apiKey(), {
    method: "POST",
    headers: {
      "x-goog-upload-protocol": "resumable",
      "x-goog-upload-command": "start",
      "x-goog-upload-header-content-length": String(sizeBytes),
      "x-goog-upload-header-content-type": mimeType,
      "content-type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: s3Key.split("/").pop() ?? "video" } }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!start.ok) throw new Error("gemini files start failed: " + start.status + " " + (await start.text()).slice(0, 200));
  const uploadUrl = start.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new Error("gemini files start: no upload url header");

  const src = await fetch(await getDownloadPresignedUrl(s3Key, 3600), { signal: AbortSignal.timeout(60_000) });
  if (!src.ok || !src.body) throw new Error("s3 stream for gemini upload failed: " + src.status);

  const up = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "x-goog-upload-command": "upload, finalize",
      "x-goog-upload-offset": "0",
      "content-length": String(sizeBytes),
    },
    body: src.body as never,
    // Node fetch requires half-duplex for streaming request bodies.
    ...({ duplex: "half" } as object),
    signal: AbortSignal.timeout(15 * 60_000),
  });
  if (!up.ok) throw new Error("gemini file upload failed: " + up.status + " " + (await up.text()).slice(0, 200));
  const j = (await up.json()) as { file?: { name?: string; uri?: string; state?: string } };
  if (!j.file?.name || !j.file?.uri) throw new Error("gemini file upload: malformed response");
  return { name: j.file.name, uri: j.file.uri };
}

export async function waitGeminiFileActive(name: string, maxWaitMs = 120_000): Promise<void> {
  const startAt = Date.now();
  for (;;) {
    const res = await fetch(BASE + "/v1beta/" + name + "?key=" + apiKey(), { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error("gemini file poll failed: " + res.status);
    const j = (await res.json()) as { state?: string };
    if (j.state === "ACTIVE") return;
    if (j.state === "FAILED") throw new Error("gemini file processing FAILED");
    if (Date.now() - startAt > maxWaitMs) throw new Error("gemini file not ACTIVE after " + maxWaitMs + "ms");
    await new Promise((r) => setTimeout(r, 2000));
  }
}

export async function deleteGeminiFile(name: string): Promise<void> {
  try {
    await fetch(BASE + "/v1beta/" + name + "?key=" + apiKey(), { method: "DELETE", signal: AbortSignal.timeout(15_000) });
  } catch (e) {
    logger.warn({ err: e, name }, "gemini file cleanup failed (non-fatal)");
  }
}

/** generateContent constrained to JSON output; returns the raw text. */
export async function generateJson(model: string, prompt: string, fileUri: string, mimeType: string): Promise<string> {
  const res = await fetch(BASE + "/v1beta/models/" + model + ":generateContent?key=" + apiKey(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ file_data: { file_uri: fileUri, mime_type: mimeType } }, { text: prompt }] }],
      generationConfig: { response_mime_type: "application/json", temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error("gemini generateContent failed: " + res.status + " " + (await res.text()).slice(0, 300));
  const j = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  if (!text) throw new Error("gemini generateContent: empty response");
  return text;
}

/** Parse + schema-validate a JSON reply; retries are the caller's concern. */
export function parseStructured<T>(schema: z.ZodType<T>, raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const parsed = schema.safeParse(JSON.parse(cleaned));
  if (!parsed.success) throw new Error("AI JSON failed schema validation: " + parsed.error.issues.map((i) => i.path.join(".") + " " + i.message).join("; "));
  return parsed.data;
}

/** Real-mode validity call: upload → wait ACTIVE → generate (retry once on malformed JSON) → cleanup. */
export async function realValidityCheck(args: {
  s3Key: string; mimeType: string; sizeBytes: number; model: string; prompt: string;
}): Promise<ValidityResult> {
  const file = await uploadVideoToGemini(args.s3Key, args.mimeType, args.sizeBytes);
  try {
    await waitGeminiFileActive(file.name);
    let raw = await generateJson(args.model, args.prompt, file.uri, args.mimeType);
    try {
      return parseStructured(validitySchema, raw);
    } catch (firstErr) {
      logger.warn({ err: firstErr }, "gemini validity JSON malformed — retrying once");
      raw = await generateJson(args.model, args.prompt + "\n\nReturn ONLY the raw JSON object. No explanations.", file.uri, args.mimeType);
      return parseStructured(validitySchema, raw);
    }
  } finally {
    await deleteGeminiFile(file.name);
  }
}

/* ───────────────────── scoring passes (§§25–29) ───────────────────── */

type RubricShape = { categories: Array<{ key: string; label: string; max: number }> };

/** Loose transport schema — business validation happens in validateScoreResult. */
export const scoringResponseSchema = z.object({
  candidateId:     z.string().optional(),
  role:            z.string().optional(),
  videoValid:      z.boolean(),
  scores:          z.record(z.string(), z.number()),
  totalScore:      z.number(),
  confidence:      z.number(),
  strongestArea:   z.string().optional(),
  improvementArea: z.string().optional(),
});
export type ScoringResponse = z.infer<typeof scoringResponseSchema>;

export type ScorePassResult = {
  videoValid: boolean;
  scores: Record<string, number>;
  totalScore: number;
  confidence: number;
  strongestArea: string;
  improvementArea: string;
};

const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Backend MUST validate every AI score (§25): per-category bounds, exact
 *  sum, total 0-100, confidence 0-1. Throws on any violation → caller retries. */
export function validateScoreResult(rubric: RubricShape, r: ScoringResponse): ScorePassResult {
  const entries = Object.entries(r.scores);
  const scores: Record<string, number> = {};
  let sum = 0;
  for (const c of rubric.categories) {
    const found = entries.find(([k]) => normKey(k) === normKey(c.key));
    if (!found) throw new Error("AI response missing category score: " + c.key);
    const v = Math.round(found[1]);
    if (v < 0 || v > c.max) throw new Error("AI score out of range for " + c.key + ": " + v + " (max " + c.max + ")");
    scores[c.key] = v;
    sum += v;
  }
  const total = Math.round(r.totalScore);
  if (sum !== total) throw new Error("AI category sum " + sum + " != totalScore " + total);
  if (total < 0 || total > 100) throw new Error("AI totalScore out of range: " + total);
  if (r.confidence < 0 || r.confidence > 1) throw new Error("AI confidence out of range: " + r.confidence);

  const ratio = (key: string) => {
    const max = rubric.categories.find((c) => c.key === key)!.max;
    return max > 0 ? scores[key] / max : 0;
  };
  const keys = rubric.categories.map((c) => c.key);
  const pick = (claim: string | undefined, fallback: string) => {
    if (claim) { const m = keys.find((k) => normKey(k) === normKey(claim)); if (m) return m; }
    return fallback;
  };
  const byBest  = [...keys].sort((a, b) => ratio(b) - ratio(a));
  const byWorst = [...keys].sort((a, b) => ratio(a) - ratio(b));
  return {
    videoValid: r.videoValid,
    scores,
    totalScore: total,
    confidence: r.confidence,
    strongestArea:   pick(r.strongestArea, byBest[0]),
    improvementArea: pick(r.improvementArea, byWorst[0]),
  };
}

/** Deterministic mock scoring pass: distributes totalScore across the rubric
 *  proportionally to category maxima, with a seed/pass-dependent 1-point
 *  jitter so passes differ slightly but reproducibly. */
export function mockScorePass(rubric: RubricShape, seed: string, passNumber: number, totalScore: number, confidence: number): ScorePassResult {
  const cats = rubric.categories;
  const scores: Record<string, number> = {};
  let acc = 0;
  for (const c of cats) {
    scores[c.key] = Math.min(Math.floor((totalScore * c.max) / 100), c.max);
    acc += scores[c.key];
  }
  let rem = totalScore - acc;
  let i = seededInt(seed + ":rem" + passNumber, cats.length);
  let guard = 0;
  while (rem > 0 && guard < 500) {
    const c = cats[i % cats.length];
    if (scores[c.key] < c.max) { scores[c.key] += 1; rem -= 1; }
    i += 1; guard += 1;
  }
  const from = cats[seededInt(seed + ":jf" + passNumber, cats.length)];
  const to   = cats[seededInt(seed + ":jt" + passNumber, cats.length)];
  if (from.key !== to.key && scores[from.key] > 0 && scores[to.key] < to.max) {
    scores[from.key] -= 1;
    scores[to.key] += 1;
  }
  return validateScoreResult(rubric, {
    videoValid: true,
    scores,
    totalScore,
    confidence,
  });
}

/** Median with even-count support: round(mean of middle two). */
export function medianScore(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return 0;
  return n % 2 === 1 ? s[(n - 1) / 2] : Math.round((s[n / 2 - 1] + s[n / 2]) / 2);
}

/** Real-mode scoring pass against an already-uploaded Gemini file.
 *  Retries once on malformed/invalid JSON (§25). */
export async function realScorePass(args: {
  model: string; prompt: string; fileUri: string; mimeType: string; rubric: RubricShape;
}): Promise<{ result: ScorePassResult; rawText: string }> {
  let raw = await generateJson(args.model, args.prompt, args.fileUri, args.mimeType);
  try {
    return { result: validateScoreResult(args.rubric, parseStructured(scoringResponseSchema, raw)), rawText: raw };
  } catch (firstErr) {
    logger.warn({ err: firstErr }, "gemini scoring JSON invalid — retrying once");
    raw = await generateJson(args.model, args.prompt + "\n\nYour previous answer was invalid: " + String(firstErr).slice(0, 200) + "\nReturn ONLY the corrected raw JSON object.", args.fileUri, args.mimeType);
    return { result: validateScoreResult(args.rubric, parseStructured(scoringResponseSchema, raw)), rawText: raw };
  }
}
