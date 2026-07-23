import app from "./app";
import { logger } from "./lib/logger";
import { sendVideoReminders } from "./routes/video";
import { ensureRegNumbers } from "./routes/register";
import { ensurePhase1Scores } from "./routes/results";
import { ensureKycPanVerified, ensurePlayerProfiles } from "./routes/kyc";
import { ensureTeams } from "./routes/teams";
import { ensureMarketingTables } from "./routes/marketing";
import { ensureReferralProgramTables } from "./routes/referralProgram";
import { ensureAdminContentTables } from "./routes/adminTools";
import { ensureNotificationErrorColumn } from "./lib/notify";
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
