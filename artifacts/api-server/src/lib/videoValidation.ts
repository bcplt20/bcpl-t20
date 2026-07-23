/**
 * Phase 1 video technical validation (pipeline stage: QUEUED → VALIDATING_VIDEO → VIDEO_VALID).
 *
 * ffprobe runs over a short-lived presigned GET URL — the video is never
 * downloaded through the app server (spec §9/§58). Purely technical checks
 * live here (duration, corruption, codec, resolution, integrity); the AI
 * validity pass (§17) is a separate later stage that consumes 'validated' rows.
 *
 * Integrity contract with /video/confirm: the object's ETag/size captured at
 * confirm time must still match at validation time (and again at any later
 * consume step) — a mismatch means the object was overwritten after confirm
 * via a still-valid presigned PUT, which parks the evaluation for admin
 * review instead of entering the AI pipeline.
 */
import { spawn } from "node:child_process";
import { db } from "@workspace/db";
import {
  phase1VideosTable, phase1EvaluationsTable,
  registrationsTable, usersTable, notificationLogsTable,
} from "@workspace/db/schema";
import { eq, and, ne, lt, notExists, isNotNull } from "drizzle-orm";
import { headS3Object, getDownloadPresignedUrl } from "./s3";
import { getPhase1Config } from "./phase1Config";
import { sendEmail, tplVideoReuploadRequired } from "./email";
import { sendSms } from "./sms";
import { logger } from "./logger";

// Codecs/containers Gemini + browsers handle natively; anything else is
// flagged needsTranscoding rather than rejected (spec §10: transcode only
// when technically necessary, never automatically).
const OK_CODECS = new Set(["h264", "hevc", "h265", "vp8", "vp9", "av1"]);
const OK_CONTAINER_HINTS = ["mp4", "mov", "webm", "matroska"];
/** Longest edge above this → downscale during (later) transcode stage. */
const MAX_EDGE_PX = 3840;
/** Container-rounding slack on the 30–60 s rule — ffprobe is authoritative
 *  but a 29.96 s clip must not bounce (spec wording targets whole seconds). */
const DURATION_SLACK_SEC = 1;
/** 'validating' rows untouched this long are presumed crashed and retried. */
const STALE_VALIDATING_MIN = 15;

type ProbeData = {
  format?: { format_name?: string; duration?: string; bit_rate?: string };
  streams?: Array<{
    codec_type?: string; codec_name?: string;
    width?: number; height?: number;
    avg_frame_rate?: string; nb_frames?: string; duration?: string;
  }>;
};
type ProbeResult = { ok: true; data: ProbeData } | { ok: false; error: string; transient: boolean };

export function ffprobeUrl(url: string, timeoutMs = 45_000): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const args = [
      "-v", "error",
      "-print_format", "json",
      "-show_format", "-show_streams",
      "-i", url,
    ];
    const p = spawn("ffprobe", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; p.kill("SIGKILL"); resolve({ ok: false, error: "ffprobe timeout", transient: true }); }
    }, timeoutMs);
    p.stdout.on("data", (d) => { out += d; });
    p.stderr.on("data", (d) => { err += d; });
    p.on("error", (e) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      // spawn failure (ffprobe missing) — environment problem, not the video's fault
      resolve({ ok: false, error: String(e).slice(0, 300), transient: true });
    });
    p.on("close", (code) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (code === 0) {
        try { resolve({ ok: true, data: JSON.parse(out) as ProbeData }); }
        catch { resolve({ ok: false, error: "unparseable ffprobe output", transient: false }); }
        return;
      }
      const stderr = err.slice(0, 400);
      // Network/access failures are transient (retry later); demux/parse
      // failures mean the file itself is bad.
      const transient = /connection|timed? ?out|tls|ssl|http error 5|403 forbidden|temporary|unavailable|network/i.test(stderr)
        && !/invalid data|moov atom|could not find|end of file|invalid argument|does not contain/i.test(stderr);
      resolve({ ok: false, error: stderr || ("ffprobe exit " + code), transient });
    });
  });
}

function parseFps(avg?: string): number | null {
  if (!avg) return null;
  const m = avg.match(/^(\d+)\/(\d+)$/);
  if (!m) return null;
  const den = Number(m[2]);
  if (!den) return null;
  return Math.round((Number(m[1]) / den) * 100) / 100;
}

/** Friendly one-liners per reason code — shared by the technical validation
 *  stage and the AI validity stage (email + SMS copy). */
export const REASON_LINES: Record<string, (minS: number, maxS: number) => string> = {
  VIDEO_TOO_SHORT: (minS) => "Your video is too short. Please upload at least " + minS + " seconds of cricket footage.",
  VIDEO_TOO_LONG: (_m, maxS) => "Your video exceeds the " + maxS + "-second Phase 1 limit. Please upload a shorter video.",
  CORRUPTED_VIDEO: () => "We could not read your video file. Please record again in MP4 or MOV format and upload once more.",
  // AI validity (§17) reason codes
  NOT_CRICKET_VIDEO: () => "The footage does not clearly show cricket play. Please upload a genuine cricket video.",
  PLAYER_NOT_VISIBLE: () => "You are not clearly visible in the footage. Keep your full body in frame.",
  INSUFFICIENT_ACTIONS: () => "There were not enough cricket actions to assess. Show more shots or deliveries.",
  VIDEO_TOO_DARK: () => "The video is too dark to assess clearly. Please record in better light.",
  EXCESSIVE_EDITING: () => "The video has too many edits or filters. Upload normal-speed, unedited footage.",
  WRONG_ROLE_EVIDENCE: () => "The footage does not match your registered playing role.",
  ASSESSMENT_NOT_RELIABLE: () => "We could not reliably complete your Phase 1 assessment from this upload. Please record a clearer video.",
};

export type ValidationRunResult = {
  claimed: number;
  validated: number;
  reuploadRequired: number;
  integrityReview: number;
  transientErrors: number;
};

/** Scheduler entrypoint: claim and validate pending submissions. Safe to call
 *  concurrently — claims go through a unique index on (registration_id, attempt_number). */
export async function runVideoValidations(limit = 25): Promise<ValidationRunResult> {
  const result: ValidationRunResult = { claimed: 0, validated: 0, reuploadRequired: 0, integrityReview: 0, transientErrors: 0 };
  const cfg = await getPhase1Config();

  // New submissions that have no evaluation row yet.
  const fresh = await db.select({
    videoId: phase1VideosTable.id,
    registrationId: phase1VideosTable.registrationId,
    attemptNumber: phase1VideosTable.attemptNumber,
  }).from(phase1VideosTable)
    .where(and(
      eq(phase1VideosTable.status, "submitted"),
      notExists(
        db.select({ one: phase1EvaluationsTable.id }).from(phase1EvaluationsTable)
          .where(and(
            eq(phase1EvaluationsTable.registrationId, phase1VideosTable.registrationId),
            eq(phase1EvaluationsTable.attemptNumber, phase1VideosTable.attemptNumber),
          )),
      ),
    ))
    .limit(limit);

  for (const cand of fresh) {
    // Atomic claim — the unique index makes double-claims impossible.
    const claimedRows = await db.insert(phase1EvaluationsTable)
      .values({ registrationId: cand.registrationId, attemptNumber: cand.attemptNumber, status: "validating" })
      .onConflictDoNothing()
      .returning({ id: phase1EvaluationsTable.id });
    if (!claimedRows.length) continue;
    result.claimed += 1;
    await validateOne(claimedRows[0].id, cand.registrationId, cand.attemptNumber, cfg, result);
  }

  // Retry rows stuck in 'validating' (crashed worker / transient errors).
  const staleCutoff = new Date(Date.now() - STALE_VALIDATING_MIN * 60 * 1000);
  const stale = await db.update(phase1EvaluationsTable)
    .set({ updatedAt: new Date() })
    .where(and(
      eq(phase1EvaluationsTable.status, "validating"),
      lt(phase1EvaluationsTable.updatedAt, staleCutoff),
    ))
    .returning({
      id: phase1EvaluationsTable.id,
      registrationId: phase1EvaluationsTable.registrationId,
      attemptNumber: phase1EvaluationsTable.attemptNumber,
    });
  for (const row of stale.slice(0, limit)) {
    result.claimed += 1;
    await validateOne(row.id, row.registrationId, row.attemptNumber, cfg, result);
  }

  return result;
}

type Cfg = Awaited<ReturnType<typeof getPhase1Config>>;

async function validateOne(
  evalId: string,
  registrationId: string,
  attemptNumber: number,
  cfg: Cfg,
  result: ValidationRunResult,
): Promise<void> {
  const startedAt = Date.now();
  try {
    const [video] = await db.select().from(phase1VideosTable)
      .where(and(
        eq(phase1VideosTable.registrationId, registrationId),
        eq(phase1VideosTable.attemptNumber, attemptNumber),
      )).limit(1);

    // Superseded/withdrawn between claim and processing — nothing to do.
    if (!video || video.status !== "submitted" || !video.s3Key) {
      await db.update(phase1EvaluationsTable)
        .set({ status: "skipped", reasonCode: "SUPERSEDED", updatedAt: new Date() })
        .where(eq(phase1EvaluationsTable.id, evalId));
      return;
    }

    // ── Integrity: object must still be exactly what was confirmed ──
    const head = await headS3Object(video.s3Key);
    if (!head.exists) {
      await failVideoForReupload(evalId, video.id, "CORRUPTED_VIDEO", { note: "object missing at validation time" }, cfg, registrationId, startedAt);
      result.reuploadRequired += 1;
      return;
    }
    const etagChanged = video.etag && head.etag && video.etag !== head.etag;
    const sizeChanged = video.sizeBytes && head.sizeBytes && video.sizeBytes !== head.sizeBytes;
    if (etagChanged || sizeChanged) {
      await finishIntegrity(evalId, "ETAG_MISMATCH", {
        confirmedEtag: video.etag, currentEtag: head.etag,
        confirmedSize: video.sizeBytes, currentSize: head.sizeBytes,
      }, startedAt);
      result.integrityReview += 1;
      return;
    }

    // ── Integrity: identical file already used by a different registration ──
    if (video.etag) {
      const [dupe] = await db.select({ id: phase1VideosTable.id, registrationId: phase1VideosTable.registrationId })
        .from(phase1VideosTable)
        .where(and(
          eq(phase1VideosTable.etag, video.etag),
          isNotNull(phase1VideosTable.etag),
          ne(phase1VideosTable.registrationId, registrationId),
        )).limit(1);
      if (dupe) {
        await finishIntegrity(evalId, "DUPLICATE_VIDEO", { matchesRegistrationId: dupe.registrationId }, startedAt);
        result.integrityReview += 1;
        return;
      }
    }

    // ── Technical probe over a short-lived processing URL ──
    const url = await getDownloadPresignedUrl(video.s3Key, 900);
    const probe = await ffprobeUrl(url);
    if (!probe.ok) {
      if (probe.transient) {
        // Leave in 'validating'; the stale-reclaim sweep retries later.
        await db.update(phase1EvaluationsTable)
          .set({ error: probe.error.slice(0, 500), updatedAt: new Date() })
          .where(eq(phase1EvaluationsTable.id, evalId));
        result.transientErrors += 1;
        logger.warn({ evalId, err: probe.error }, "video validation transient failure — will retry");
        return;
      }
      await failVideoForReupload(evalId, video.id, "CORRUPTED_VIDEO", { probeError: probe.error }, cfg, registrationId, startedAt);
      result.reuploadRequired += 1;
      return;
    }

    const vstream = (probe.data.streams ?? []).find((s) => s.codec_type === "video");
    const durationSec = Number(probe.data.format?.duration ?? vstream?.duration ?? 0) || 0;
    const nbFrames = vstream?.nb_frames && /^\d+$/.test(vstream.nb_frames) ? Number(vstream.nb_frames) : null;
    const summary = {
      container: probe.data.format?.format_name ?? null,
      durationSec,
      codec: vstream?.codec_name ?? null,
      width: vstream?.width ?? null,
      height: vstream?.height ?? null,
      fps: parseFps(vstream?.avg_frame_rate),
      nbFrames,
      bitRate: probe.data.format?.bit_rate ? Number(probe.data.format.bit_rate) : null,
      etagAtValidation: head.etag,
      probedAt: new Date().toISOString(),
    };

    // Corrupted / not-a-video / static image disguised as video (§18)
    if (!vstream || durationSec < 1 || (nbFrames !== null && nbFrames <= 2)) {
      await failVideoForReupload(evalId, video.id, "CORRUPTED_VIDEO", summary, cfg, registrationId, startedAt);
      result.reuploadRequired += 1;
      return;
    }

    // Duration window (authoritative — client fast-fail was only a hint)
    if (durationSec < cfg.videoMinSeconds - DURATION_SLACK_SEC) {
      await failVideoForReupload(evalId, video.id, "VIDEO_TOO_SHORT", summary, cfg, registrationId, startedAt);
      result.reuploadRequired += 1;
      return;
    }
    if (durationSec > cfg.videoMaxSeconds + DURATION_SLACK_SEC) {
      await failVideoForReupload(evalId, video.id, "VIDEO_TOO_LONG", summary, cfg, registrationId, startedAt);
      result.reuploadRequired += 1;
      return;
    }

    // Transcode only when technically necessary (§10)
    const codecOk = vstream.codec_name ? OK_CODECS.has(vstream.codec_name.toLowerCase()) : false;
    const containerOk = OK_CONTAINER_HINTS.some((h) => (probe.data.format?.format_name ?? "").includes(h));
    const longestEdge = Math.max(vstream.width ?? 0, vstream.height ?? 0);
    const needsTranscoding = !codecOk || !containerOk || longestEdge > MAX_EDGE_PX;

    await db.update(phase1EvaluationsTable).set({
      status: "validated",
      videoS3Key: video.s3Key,
      videoDurationSec: durationSec,
      videoMimeType: head.contentType ?? video.mimeType,
      videoSizeBytes: head.sizeBytes || video.sizeBytes,
      videoEtag: head.etag ?? video.etag,
      needsTranscoding,
      validation: summary,
      reasonCode: null,
      error: null,
      processingMs: Date.now() - startedAt,
      updatedAt: new Date(),
    }).where(eq(phase1EvaluationsTable.id, evalId));
    result.validated += 1;
  } catch (e) {
    // Unexpected failure — keep 'validating' with the error recorded; the
    // stale sweep retries. Never let one bad row kill the whole tick.
    result.transientErrors += 1;
    logger.error({ err: e, evalId }, "video validation crashed for row");
    await db.update(phase1EvaluationsTable)
      .set({ error: String(e).slice(0, 500), updatedAt: new Date() })
      .where(eq(phase1EvaluationsTable.id, evalId))
      .catch(() => {});
  }
}

/** Shared failure path: mark evaluation reupload_required, fail the video
 *  row, and notify the player exactly once (reserve-first dedupe). Used by
 *  both the technical validation stage and the AI validity stage. */
export async function failVideoForReupload(
  evalId: string,
  videoId: string,
  reasonCode: string,
  validation: unknown,
  cfg: Cfg,
  registrationId: string,
  startedAt: number,
  claimToken?: string,
): Promise<boolean> {
  // With a claim token the eval write is CAS-guarded: if another worker
  // reclaimed the row, skip ALL side effects (video flip + notification).
  const updated = await db.update(phase1EvaluationsTable).set({
    status: "reupload_required",
    reasonCode,
    validation,
    processingMs: Date.now() - startedAt,
    updatedAt: new Date(),
  }).where(claimToken
    ? and(eq(phase1EvaluationsTable.id, evalId), eq(phase1EvaluationsTable.claimToken, claimToken))
    : eq(phase1EvaluationsTable.id, evalId))
    .returning({ id: phase1EvaluationsTable.id });
  if (updated.length === 0) {
    logger.warn({ evalId, videoId }, "phase1 reupload-fail discarded — claim reclaimed by another worker");
    return false;
  }
  await db.update(phase1VideosTable).set({ status: "validation_failed" })
    .where(eq(phase1VideosTable.id, videoId));

  logger.info({ evalId, videoId, reasonCode }, "phase1 video validation failed — reupload required");

  // Notify the player (reserve-first dedupe — exactly one send per video row).
  const [row] = await db.select({ user: usersTable })
    .from(registrationsTable)
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(eq(registrationsTable.id, registrationId)).limit(1);
  if (!row) return true;
  const reserved = await db.insert(notificationLogsTable)
    .values({ userId: row.user.id, type: "email", template: "video_reupload_required", dedupeKey: "p1_reupload_" + videoId })
    .onConflictDoNothing()
    .returning({ id: notificationLogsTable.id });
  if (!reserved.length) return true;

  const reasonLine = (REASON_LINES[reasonCode] ?? REASON_LINES.CORRUPTED_VIDEO)(cfg.videoMinSeconds, cfg.videoMaxSeconds);
  const email = tplVideoReuploadRequired(row.user.name, reasonLine);
  await Promise.allSettled([
    sendEmail({ to: row.user.email, toName: row.user.name, ...email }),
    sendSms(row.user.phone, "BCPL T20: We could not accept your trial video. " + reasonLine + " Upload again at bcplt20.com -BCPL T20"),
  ]);
  return true;
}

async function finishIntegrity(evalId: string, reasonCode: string, validation: unknown, startedAt: number): Promise<void> {
  // Parked for admin review — never auto-accuse the player (§18), so no
  // player-facing notification here.
  await db.update(phase1EvaluationsTable).set({
    status: "integrity_review",
    reasonCode,
    validation,
    processingMs: Date.now() - startedAt,
    updatedAt: new Date(),
  }).where(eq(phase1EvaluationsTable.id, evalId));
  logger.warn({ evalId, reasonCode }, "phase1 video parked for integrity review");
}
