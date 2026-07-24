/**
 * Task #55 — referral reward milestone congrats.
 *
 * Asserts the reserve-first dedupe contract of notifyReferralMilestone:
 *  - a NEW milestone reserves exactly one dedupe row and attempts a send
 *  - a repeat call for the same (code, threshold) NEVER double-sends
 *  - a code with no linked player is skipped (no notification rows)
 *
 * globalThis.fetch is stubbed for the whole file, so even though REAL
 * MSG91/Brevo/Interakt keys are live in dev, NO real provider call happens.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@workspace/db";
import {
  usersTable,
  referralCodesTable,
  notificationLogsTable,
} from "@workspace/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

// Stub every outbound provider call before importing the sender. A fresh
// Response per call is required — a Response body can only be read once.
vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
  new Response(JSON.stringify({ type: "success", result: true }), { status: 200 }),
);

const { notifyReferralMilestone } = await import("../src/lib/referralMilestone");
const { ensureNotificationErrorColumn } = await import("../src/lib/notify");

const RUN = String(Date.now()).slice(-7);
const userIds: string[] = [];
const codes: string[] = [];

async function mkPlayer(codeSuffix: string) {
  const [user] = await db
    .insert(usersTable)
    .values({
      name: `RefMilestone ${RUN}-${codeSuffix}`,
      phone: `9${RUN}${codeSuffix}`.slice(0, 12),
      email: `refms-${RUN}-${codeSuffix}@test.bcpl`,
      isVerified: true,
    })
    .returning();
  userIds.push(user.id);
  const code = `REFMS${RUN}${codeSuffix}`.toUpperCase().slice(0, 30);
  await db.insert(referralCodesTable).values({
    code,
    name: user.name,
    kind: "player",
    platform: "Player",
    userId: user.id,
  });
  codes.push(code);
  return { user, code };
}

beforeAll(async () => {
  await ensureNotificationErrorColumn();
  // Reserve-first dedupe relies on the partial unique index on dedupe_key.
  await db.execute(sql`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS dedupe_key varchar(160)`);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS notification_logs_dedupe_uq
    ON notification_logs (dedupe_key) WHERE dedupe_key IS NOT NULL
  `);
});

afterAll(async () => {
  if (codes.length) {
    await db.delete(notificationLogsTable).where(inArray(notificationLogsTable.userId, userIds));
    await db.delete(referralCodesTable).where(inArray(referralCodesTable.code, codes));
  }
  if (userIds.length) {
    await db.delete(usersTable).where(inArray(usersTable.id, userIds));
  }
  vi.restoreAllMocks();
});

describe("notifyReferralMilestone — reserve-first dedupe", () => {
  it("congratulates a new milestone exactly once and never double-sends", async () => {
    const { code } = await mkPlayer("A");
    const threshold = 5;
    const dedupeKey = `referral_milestone_${code}_${threshold}`;

    const first = await notifyReferralMilestone({ code, threshold, reward: "Official BCPL cap" });
    expect(first).toBe(true);

    // Exactly one row owns the dedupe key (the reserved email row).
    const reserved = await db
      .select({ id: notificationLogsTable.id, status: notificationLogsTable.status })
      .from(notificationLogsTable)
      .where(eq(notificationLogsTable.dedupeKey, dedupeKey));
    expect(reserved.length).toBe(1);

    // Repeat call must lose the reservation → no send, no extra dedupe row.
    const second = await notifyReferralMilestone({ code, threshold, reward: "Official BCPL cap" });
    expect(second).toBe(false);

    const stillOne = await db
      .select({ id: notificationLogsTable.id })
      .from(notificationLogsTable)
      .where(eq(notificationLogsTable.dedupeKey, dedupeKey));
    expect(stillOne.length).toBe(1);
  });

  it("separate thresholds reserve separately (each milestone congratulated)", async () => {
    const { code } = await mkPlayer("B");
    const a = await notifyReferralMilestone({ code, threshold: 1, reward: "Shoutout" });
    const b = await notifyReferralMilestone({ code, threshold: 11, reward: "Team XI jersey" });
    expect(a).toBe(true);
    expect(b).toBe(true);

    const rows = await db
      .select({ dedupeKey: notificationLogsTable.dedupeKey })
      .from(notificationLogsTable)
      .where(
        and(
          eq(notificationLogsTable.template, "referral_milestone"),
          inArray(notificationLogsTable.dedupeKey, [
            `referral_milestone_${code}_1`,
            `referral_milestone_${code}_11`,
          ]),
        ),
      );
    expect(rows.length).toBe(2);
  });

  it("skips when the referral code has no linked player", async () => {
    const orphan = `REFMSNOUSER${RUN}`.slice(0, 30);
    codes.push(orphan);
    await db.insert(referralCodesTable).values({
      code: orphan,
      name: "Orphan Code",
      kind: "player",
      platform: "Player",
    });
    const res = await notifyReferralMilestone({ code: orphan, threshold: 5, reward: "cap" });
    expect(res).toBe(false);
  });
});
