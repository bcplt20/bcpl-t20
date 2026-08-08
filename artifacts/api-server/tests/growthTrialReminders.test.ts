/**
 * Trial-day morning reminder sweep (src/lib/trialReminders.ts).
 *
 * Real sends are mocked (never hit MSG91/Brevo). Asserts:
 *  - dry-run counts today's allocated trials, sends nothing
 *  - a real sweep reserves exactly one notification per allocation (dedupe)
 *  - allocations whose slot date is NOT today are ignored
 */
import { describe, it, expect, afterAll, vi } from "vitest";
import crypto from "node:crypto";
import { inArray, like, eq } from "drizzle-orm";

vi.mock("../src/lib/sms", async (o) => ({ ...(await o<typeof import("../src/lib/sms")>()), sendSms: vi.fn(async () => ({ ok: true as const })) }));
vi.mock("../src/lib/email", async (o) => ({ ...(await o<typeof import("../src/lib/email")>()), sendEmail: vi.fn(async () => ({ ok: true as const })) }));
process.env.PUSH_ENABLED = "0";

const { db } = await import("@workspace/db");
const {
  usersTable, registrationsTable, notificationLogsTable, notificationsInboxTable,
  trialVenuesTable, trialSlotsTable, trialAllocationsTable,
} = await import("@workspace/db/schema");
const { sendTrialDayReminders } = await import("../src/lib/trialReminders");
const { ensureTrialsTables } = await import("../src/routes/trials");

const suffix = String(Date.now()).slice(-7);
const userIds: string[] = [];
const regIds: string[] = [];
const venueIds: string[] = [];
const slotIds: string[] = [];
const allocIds: string[] = [];

function humanDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

let seq = 0;
async function mkAllocation(dateText: string) {
  const n = ++seq;
  const [u] = await db.insert(usersTable).values({
    name: `Trial Test ${suffix}-${n}`,
    phone: `5${suffix}${String(n).padStart(2, "0")}`.slice(0, 12),
    email: `trial-${suffix}-${n}@test.bcpl`, isVerified: true,
  }).returning();
  userIds.push(u.id);
  const [reg] = await db.insert(registrationsTable).values({
    userId: u.id, role: "bat", trialCity: "TrialCity" + suffix, phase1Status: "selected", phase2Status: "kyc_done",
  }).returning();
  regIds.push(reg.id);
  const [venue] = await db.insert(trialVenuesTable).values({
    city: "TrialCity" + suffix, venue: "Trial Ground " + n, trialDate: dateText,
    trialTime: "8:00 AM – 12:00 PM", reportingTime: "7:30 AM",
  } as typeof trialVenuesTable.$inferInsert).returning();
  venueIds.push(venue.id);
  const [slot] = await db.insert(trialSlotsTable).values({
    venueId: venue.id, city: "TrialCity" + suffix, slotDate: dateText,
    reportingTime: "8:00 AM", startTime: "9:00 AM", batchName: "Batch A",
  } as typeof trialSlotsTable.$inferInsert).returning();
  slotIds.push(slot.id);
  const [alloc] = await db.insert(trialAllocationsTable).values({
    registrationId: reg.id, slotId: slot.id, venueId: venue.id, city: "TrialCity" + suffix,
    status: "allocated", passToken: crypto.randomUUID(),
  } as typeof trialAllocationsTable.$inferInsert).returning();
  allocIds.push(alloc.id);
  return { user: u, reg, alloc };
}

afterAll(async () => {
  if (allocIds.length) await db.delete(trialAllocationsTable).where(inArray(trialAllocationsTable.id, allocIds));
  if (slotIds.length) await db.delete(trialSlotsTable).where(inArray(trialSlotsTable.id, slotIds));
  if (venueIds.length) await db.delete(trialVenuesTable).where(inArray(trialVenuesTable.id, venueIds));
  await db.delete(notificationLogsTable).where(like(notificationLogsTable.dedupeKey, "trial_day_%"));
  if (userIds.length) {
    await db.delete(notificationLogsTable).where(inArray(notificationLogsTable.userId, userIds));
    await db.delete(notificationsInboxTable).where(inArray(notificationsInboxTable.userId, userIds));
  }
  if (regIds.length) await db.delete(registrationsTable).where(inArray(registrationsTable.id, regIds));
  if (userIds.length) await db.delete(usersTable).where(inArray(usersTable.id, userIds));
});

describe("trial-day reminder sweep", () => {
  it("dry-run counts today's allocations, sends nothing", async () => {
    await ensureTrialsTables();
    const today = humanDate(new Date());
    await mkAllocation(today);
    await mkAllocation(humanDate(new Date(Date.now() + 3 * 86400000))); // 3 days out → not today

    const res = await sendTrialDayReminders({ dryRun: true });
    expect(res.dryRun).toBe(true);
    expect(res.candidates).toBeGreaterThanOrEqual(1);
    expect(res.sent).toBe(0);
    const logs = await db.select().from(notificationLogsTable).where(like(notificationLogsTable.dedupeKey, "trial_day_%"));
    expect(logs.length).toBe(0);
  });

  it("real sweep reserves exactly one reminder per allocation (dedupe)", async () => {
    const today = humanDate(new Date());
    const { alloc } = await mkAllocation(today);

    await sendTrialDayReminders({ dryRun: false });
    await sendTrialDayReminders({ dryRun: false }); // second sweep must not re-reserve

    const rows = await db.select().from(notificationLogsTable)
      .where(eq(notificationLogsTable.dedupeKey, "trial_day_" + alloc.id));
    expect(rows.length).toBe(1);
  });
});
