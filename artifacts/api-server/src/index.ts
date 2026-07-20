import app from "./app";
import { logger } from "./lib/logger";
import { sendVideoReminders } from "./routes/video";

const port = Number(process.env["PORT"] ?? "8080");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});

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
}, SIX_HOURS);
