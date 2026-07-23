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
