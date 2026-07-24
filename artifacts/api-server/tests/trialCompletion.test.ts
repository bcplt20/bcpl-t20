/**
 * §22 (final-finishing spec): physical-trial completion notice.
 *
 * Locks the two safety contracts:
 *  1. EXACTLY ONCE per registration — reserve-first dedupe on
 *     notification_logs; a correction → re-submit can never re-send.
 *  2. GATED outside production — with sends disabled the reservation is
 *     recorded as "skipped" and no provider call is attempted.
 */
import { describe, it, expect, afterAll } from "vitest";
import { eq, inArray } from "drizzle-orm";

process.env.ADMIN_SECRET ||= "test-admin-secret-for-vitest";
process.env.SESSION_SECRET ||= "test-session-secret-for-vitest";
// Hard-disable real sends no matter how the workspace env is configured —
// this suite must never talk to Brevo (real keys live in dev).
process.env.REMINDERS_ENABLED = "0";

const { db } = await import("@workspace/db");
const { usersTable, registrationsTable, notificationLogsTable } =
  await import("@workspace/db/schema");
const { sendTrialCompletionNotice, roleLabel } = await import("../src/lib/trialCompletion");

const suffix = String(Date.now()).slice(-7); // unique per run
const createdUserIds: string[] = [];
const createdRegIds: string[] = [];

let seq = 0;
async function mkPlayer(withEmail = true) {
  const n = ++seq;
  const [user] = await db.insert(usersTable).values({
    name: `TrialDone Test ${suffix}-${n}`,
    phone: `71${suffix}${String(n).padStart(2, "0")}`.slice(0, 12),
    email: withEmail ? `trialdone-${suffix}-${n}@test.bcpl` : "", // users.email is NOT NULL — "no email" players carry ""
    isVerified: true,
  }).returning();
  createdUserIds.push(user.id);
  const [reg] = await db.insert(registrationsTable).values({
    userId: user.id,
    role: "wk",
    trialCity: "TrialDoneCity" + suffix,
    phase1Status: "selected",
    phase2Status: "kyc_done",
  }).returning();
  createdRegIds.push(reg.id);
  return { user, reg };
}

const logsFor = (regId: string) => db.select().from(notificationLogsTable)
  .where(eq(notificationLogsTable.dedupeKey, "trial_completed_" + regId));

afterAll(async () => {
  if (createdRegIds.length) {
    await db.delete(notificationLogsTable).where(
      inArray(notificationLogsTable.dedupeKey, createdRegIds.map((r) => "trial_completed_" + r)));
    await db.delete(registrationsTable).where(inArray(registrationsTable.id, createdRegIds));
  }
  if (createdUserIds.length) {
    await db.delete(usersTable).where(inArray(usersTable.id, createdUserIds));
  }
});

describe("sendTrialCompletionNotice — §22 exactly-once + gating", () => {
  it("first call reserves ONE row (skipped outside prod); second call is a no-op", async () => {
    const { reg } = await mkPlayer();

    const first = await sendTrialCompletionNotice(reg.id);
    expect(first).toBe(false); // gated in test env — reserved, not sent

    const rows = await logsFor(reg.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.template).toBe("trial_completed");
    expect(rows[0]!.status).toBe("skipped"); // gate hit BEFORE any provider call

    // Correction → re-submit path: the dedupe key is already consumed.
    const second = await sendTrialCompletionNotice(reg.id);
    expect(second).toBe(false);
    expect(await logsFor(reg.id)).toHaveLength(1); // still exactly one, ever
  });

  it("no email on file → skipped loudly, nothing reserved (retry stays possible)", async () => {
    const { reg } = await mkPlayer(false);
    expect(await sendTrialCompletionNotice(reg.id)).toBe(false);
    expect(await logsFor(reg.id)).toHaveLength(0);
  });

  it("unknown registration → false, never throws", async () => {
    expect(await sendTrialCompletionNotice("00000000-0000-0000-0000-000000000000")).toBe(false);
  });

  it("roleLabel maps every canonical role value to player-facing copy (§6)", () => {
    expect(roleLabel("wk")).toBe("Wicketkeeper");
    expect(roleLabel("bat")).toBe("Batsman");
    expect(roleLabel("bowl")).toBe("Bowler");
    expect(roleLabel("ar")).toBe("All-Rounder");
    expect(roleLabel("wicketkeeper_batsman")).toBe("Wicketkeeper"); // historic format
    expect(roleLabel(null)).toBe("Player");
  });
});
