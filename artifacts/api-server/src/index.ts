import app from "./app";
import { logger } from "./lib/logger";
import { runVideoValidations } from "./lib/videoValidation";
import { runAiValidityChecks } from "./lib/aiPipeline";
import { sendVideoReminders } from "./routes/video";
import { ensureRegNumbers } from "./routes/register";
import { ensurePhase1Scores } from "./routes/results";
import { ensureKycPanVerified, ensurePlayerProfiles } from "./routes/kyc";
import { ensureTeams } from "./routes/teams";
import { ensureMarketingTables } from "./routes/marketing";
import { ensureReferralProgramTables } from "./routes/referralProgram";
import { ensureAdminContentTables } from "./routes/adminTools";
import { ensureNotificationErrorColumn } from "./lib/notify";
import { ensurePhase1AiTables } from "./lib/phase1Migrations";
import { reconcileAbandonedPayments } from "./lib/reconcilePayments";

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
      await ensureTeams();
      await ensureMarketingTables();
      await ensureReferralProgramTables(); // needs referral_codes from ensureMarketingTables
      await ensureAdminContentTables();
      await ensureNotificationErrorColumn();
      await ensurePhase1AiTables(); // Phase 1 AI evaluation pipeline
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

// ── Reminder scheduler: runs every 6 hours ──────────────────────────────────
// Sends video upload reminders at Day 3 (4 days left) and Day 6 (1 day left)
const SIX_HOURS = 6 * 60 * 60 * 1000;
setInterval(async () => {
  try {
    logger.info("Running video reminder check...");
    await sendVideoReminders();
  } catch (e) {
    logger.error({ err: e }, "Reminder scheduler failed");
  }
  try {
    logger.info("Running abandoned payment reconciliation...");
    await reconcileAbandonedPayments();
  } catch (e) {
    logger.error({ err: e }, "Payment reconciliation failed");
  }
}, SIX_HOURS);

// ── Phase 1 video validation worker: every 2 minutes ────────────────────────
// Technical ffprobe validation of new submissions (pipeline stage
// VALIDATING_VIDEO). Cheap per video; the AI stages are gated separately.
const TWO_MINUTES = 2 * 60 * 1000;
async function phase1PipelineTick(label: string): Promise<void> {
  try {
    const r = await runVideoValidations(25);
    if (r.claimed > 0) logger.info(r, label + ": video validation");
  } catch (e) {
    logger.error({ err: e }, label + ": video validation failed");
  }
  try {
    const a = await runAiValidityChecks(25);
    if (a.claimed > 0) logger.info(a, label + ": ai validity");
  } catch (e) {
    logger.error({ err: e }, label + ": ai validity failed");
  }
}
setTimeout(() => { void phase1PipelineTick("startup sweep"); }, 20_000);
setInterval(() => { void phase1PipelineTick("pipeline tick"); }, TWO_MINUTES);
