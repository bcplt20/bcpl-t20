import app from "./app";
import { logger } from "./lib/logger";
import { runVideoValidations } from "./lib/videoValidation";
import { runAiValidityChecks } from "./lib/aiPipeline";
import { runAiScoringPasses } from "./lib/aiScoring";
import { runResultReleases } from "./lib/resultRelease";
import { sendVideoReminders } from "./routes/video";
import { ensureRegNumbers } from "./routes/register";
import { ensurePhase1Scores } from "./routes/results";
import { ensureKycPanVerified, ensurePlayerProfiles, ensureKycEmployment } from "./routes/kyc";
import { ensureTeams } from "./routes/teams";
import { ensureMarketingTables } from "./routes/marketing";
import { ensureReferralProgramTables } from "./routes/referralProgram";
import { ensureAdminContentTables } from "./routes/adminTools";
import { ensureNotificationErrorColumn } from "./lib/notify";
import { ensureOutboxTable, runOutboxSweep } from "./lib/outbox";
import { ensurePhase1AiTables } from "./lib/phase1Migrations";
import { ensureTrialsTables } from "./routes/trials";
import { ensureAdminUsersTable } from "./routes/adminUsers";
import { ensureRefundsTables } from "./routes/refunds";
import { ensureFraudTables } from "./routes/fraud";
import { recordJobRun } from "./lib/heartbeat";
import { reconcileAbandonedPayments } from "./lib/reconcilePayments";
import { sendPaymentReminders, remindersEnabled } from "./lib/reminders";

const port = Number(process.env["PORT"] ?? "8080");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

async function start() {
  // Idempotent migrations BEFORE accepting traffic:
  //  - reg_number column + backfill (BCPL-DEL-1 style IDs)
  //  - kyc_records.pan_verified flag (manual-review fallback)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await ensureRegNumbers();
      await ensurePhase1Scores();
      await ensureKycPanVerified();
      await ensurePlayerProfiles();
      await ensureKycEmployment(); // Stage 6 employment verification
      await ensureTeams();
      await ensureMarketingTables();
      await ensureReferralProgramTables(); // needs referral_codes from ensureMarketingTables
      await ensureAdminContentTables();
      await ensureNotificationErrorColumn();
      await ensureOutboxTable(); // durable notification retry queue
      await ensurePhase1AiTables(); // Phase 1 AI evaluation pipeline
      await ensureTrialsTables(); // Physical trials suite (Stage 4)
      await ensureAdminUsersTable(); // Stage 5 server-side RBAC
      await ensureFraudTables(); // Stage 6 fraud flag extensions
      await ensureRefundsTables(); // Stage 5 finance refunds
      logger.info("startup migrations ensured");
      break;
    } catch (e) {
      logger.error({ err: e, attempt }, "startup migration failed");
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

void start();

// ── Reminder scheduler: every 6 hours (plus a startup sweep after 90s) ──────
// Video nudges (day-3 / day-6 / last-day) + payment reminders (P1 abandoned,
// P2 pending) + Cashfree reconciliation. Real sends happen only when
// remindersEnabled() — production, or REMINDERS_ENABLED=1 — otherwise every
// sweep is a logged DRY RUN. Dedupe keys on notification_logs guarantee each
// player gets each reminder at most once, ever, even across restarts.
const SIX_HOURS = 6 * 60 * 60 * 1000;
async function reminderTick(): Promise<void> {
  const dryRun = !remindersEnabled();
  let tickOk = true;
  let tickErr: unknown = null;
  try {
    const n = await sendVideoReminders({ dryRun });
    if (n > 0) logger.info({ dryRun, count: n }, "video reminders processed");
  } catch (e) {
    tickOk = false; tickErr = e;
    logger.error({ err: e }, "Reminder scheduler failed");
  }
  try {
    const r = await sendPaymentReminders({ dryRun });
    if (r.p1Candidates || r.p2Candidates) logger.info(r, "payment reminders processed");
  } catch (e) {
    tickOk = false; tickErr = e;
    logger.error({ err: e }, "Payment reminder sweep failed");
  }
  try {
    await reconcileAbandonedPayments();
  } catch (e) {
    tickOk = false; tickErr = e;
    logger.error({ err: e }, "Payment reconciliation failed");
  }
  recordJobRun("reminder-sweep", tickOk, tickErr, SIX_HOURS);
}
setTimeout(() => { void reminderTick(); }, 90_000);
setInterval(() => { void reminderTick(); }, SIX_HOURS);

// ── Phase 1 video validation worker: every 2 minutes ────────────────────────
// Technical ffprobe validation of new submissions (pipeline stage
// VALIDATING_VIDEO). Cheap per video; the AI stages are gated separately.
const TWO_MINUTES = 2 * 60 * 1000;
async function phase1PipelineTick(label: string): Promise<void> {
  let tickOk = true;
  let tickErr: unknown = null;
  try {
    const r = await runVideoValidations(25);
    if (r.claimed > 0) logger.info(r, label + ": video validation");
  } catch (e) {
    tickOk = false; tickErr = e;
    logger.error({ err: e }, label + ": video validation failed");
  }
  try {
    const a = await runAiValidityChecks(25);
    if (a.claimed > 0) logger.info(a, label + ": ai validity");
  } catch (e) {
    tickOk = false; tickErr = e;
    logger.error({ err: e }, label + ": ai validity failed");
  }
  try {
    const s = await runAiScoringPasses(10);
    if (s.claimed > 0) logger.info(s, label + ": ai scoring");
  } catch (e) {
    tickOk = false; tickErr = e;
    logger.error({ err: e }, label + ": ai scoring failed");
  }
  try {
    const rel = await runResultReleases(50);
    if (rel.claimed > 0) logger.info(rel, label + ": result release");
  } catch (e) {
    tickOk = false; tickErr = e;
    logger.error({ err: e }, label + ": result release failed");
  }
  recordJobRun("phase1-pipeline", tickOk, tickErr, TWO_MINUTES);
}
setTimeout(() => { void phase1PipelineTick("startup sweep"); }, 20_000);
setInterval(() => { void phase1PipelineTick("pipeline tick"); }, TWO_MINUTES);

// ── Notification outbox sweep: every 5 minutes ──────────────────────────────
// Retries email/SMS sends that failed at the provider (queued by
// queueSendFailure). Real retries only when outboxEnabled() — production or
// OUTBOX_ENABLED=1 — otherwise a logged dry run (real keys live in dev!).
const FIVE_MINUTES = 5 * 60 * 1000;
async function outboxTick(): Promise<void> {
  try {
    const r = await runOutboxSweep(25);
    if (r.due > 0 || r.claimed > 0) logger.info(r, "outbox sweep");
    recordJobRun("outbox-sweep", true, undefined, FIVE_MINUTES);
  } catch (e) {
    logger.error({ err: e }, "outbox sweep failed");
    recordJobRun("outbox-sweep", false, e, FIVE_MINUTES);
  }
}
setTimeout(() => { void outboxTick(); }, 60_000);
setInterval(() => { void outboxTick(); }, FIVE_MINUTES);
