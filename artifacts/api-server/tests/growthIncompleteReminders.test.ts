/**
 * Incomplete-registration (draft) reminder sweep
 * (src/lib/incompleteReminders.ts).
 *
 * Asserts:
 *  - dry-run reports due candidates without writing notification_logs
 *  - only mobileVerified drafts inside the age window are candidates
 *  - reserve-first dedupe → at most one reserve per (draft, bucket)
 *  - max 2 reminders total (h24 + h72) across a draft's lifetime
 *
 * Real sends are forced off (dryRun:true), so no MSG91/Brevo traffic occurs.
 */
import { describe, it, expect, afterAll, vi } from "vitest";
import { inArray, like, eq } from "drizzle-orm";

// Stub real send paths — NEVER hit MSG91/Brevo from tests (real keys exist).
vi.mock("../src/lib/sms", async (o) => ({ ...(await o<typeof import("../src/lib/sms")>()), sendSms: vi.fn(async () => ({ ok: true as const })) }));
vi.mock("../src/lib/email", async (o) => ({ ...(await o<typeof import("../src/lib/email")>()), sendEmail: vi.fn(async () => ({ ok: true as const })) }));
// Force push into dry-run (no Expo calls) regardless of ambient env.
process.env.PUSH_ENABLED = "0";

const { db } = await import("@workspace/db");
const { usersTable, registrationDraftsTable, notificationLogsTable } = await import("@workspace/db/schema");
const { sendIncompleteRegistrationReminders } = await import("../src/lib/incompleteReminders");

const suffix = String(Date.now()).slice(-7);
const userIds: string[] = [];
const draftIds: string[] = [];
const HOUR = 60 * 60 * 1000;

let seq = 0;
async function mkUser() {
  const n = ++seq;
  const [u] = await db.insert(usersTable).values({
    name: `Inc Test ${suffix}-${n}`,
    phone: `9${suffix}${String(n).padStart(2, "0")}`.slice(0, 12),
    email: `inc-${suffix}-${n}@test.bcpl`,
    isVerified: true,
  }).returning();
  userIds.push(u.id);
  return u;
}

async function mkDraft(opts: {
  mobileVerified: boolean; status: string; ageHours: number; userId: string | null;
}) {
  const n = ++seq;
  const last = new Date(Date.now() - opts.ageHours * HOUR);
  const [d] = await db.insert(registrationDraftsTable).values({
    draftNumber: `REG-DRAFT-${suffix}${n}`,
    clientKey: `ck-${suffix}-${n}`,
    fullName: `Draft ${n}`,
    email: `draft-${suffix}-${n}@test.bcpl`,
    phone: `9${suffix}${String(n).padStart(3, "0")}`.slice(0, 12),
    mobileVerified: opts.mobileVerified,
    status: opts.status,
    userId: opts.userId,
    startedAt: last,
    lastActivityAt: last,
  }).returning();
  draftIds.push(d.id);
  return d;
}

afterAll(async () => {
  await db.delete(notificationLogsTable).where(like(notificationLogsTable.dedupeKey, `draft_incomplete_%`));
  if (userIds.length) await db.delete(notificationLogsTable).where(inArray(notificationLogsTable.userId, userIds));
  if (draftIds.length) {
    const { notificationsInboxTable } = await import("@workspace/db/schema");
    await db.delete(notificationsInboxTable).where(inArray(notificationsInboxTable.userId, userIds));
    await db.delete(registrationDraftsTable).where(inArray(registrationDraftsTable.id, draftIds));
  }
  if (userIds.length) await db.delete(usersTable).where(inArray(usersTable.id, userIds));
});

describe("incomplete-registration reminder sweep", () => {
  it("dry-run counts eligible drafts but sends/writes nothing", async () => {
    const u = await mkUser();
    await mkDraft({ mobileVerified: true, status: "PAYMENT_PENDING", ageHours: 30, userId: u.id }); // h24 window
    // Unverified → never a candidate.
    await mkDraft({ mobileVerified: false, status: "PAYMENT_PENDING", ageHours: 30, userId: null });
    // Too fresh (<24h) → not a candidate.
    await mkDraft({ mobileVerified: true, status: "PAYMENT_PENDING", ageHours: 5, userId: (await mkUser()).id });

    const res = await sendIncompleteRegistrationReminders({ dryRun: true });
    expect(res.dryRun).toBe(true);
    expect(res.candidates).toBeGreaterThanOrEqual(1);
    expect(res.sent).toBe(0);

    const logs = await db.select().from(notificationLogsTable).where(like(notificationLogsTable.dedupeKey, `draft_incomplete_%`));
    expect(logs.length).toBe(0); // dry run never reserves
  });

  it("reserves at most once per (draft, bucket) and caps at 2 reminders", async () => {
    const u = await mkUser();
    // Draft at 30h → falls in h24 bucket.
    const draft = await mkDraft({ mobileVerified: true, status: "PAYMENT_PENDING", ageHours: 30, userId: u.id });

    // First real sweep reserves the h24 key.
    await sendIncompleteRegistrationReminders({ dryRun: false });
    // Second real sweep must NOT reserve again for the same bucket.
    await sendIncompleteRegistrationReminders({ dryRun: false });

    const h24 = await db.select().from(notificationLogsTable)
      .where(eq(notificationLogsTable.dedupeKey, `draft_incomplete_${draft.id}_h24`));
    expect(h24.length).toBe(1);

    // Age the draft into the h72 bucket and sweep again → a second (final) reminder.
    await db.update(registrationDraftsTable)
      .set({ lastActivityAt: new Date(Date.now() - 90 * HOUR) })
      .where(eq(registrationDraftsTable.id, draft.id));
    await sendIncompleteRegistrationReminders({ dryRun: false });

    const all = await db.select().from(notificationLogsTable)
      .where(like(notificationLogsTable.dedupeKey, `draft_incomplete_${draft.id}_%`));
    // Exactly two buckets ever: h24 + h72 (never a third).
    const buckets = new Set(all.map((r) => r.dedupeKey));
    expect(buckets.has(`draft_incomplete_${draft.id}_h24`)).toBe(true);
    expect(buckets.has(`draft_incomplete_${draft.id}_h72`)).toBe(true);
    expect(all.length).toBe(2);
  });

  it("skips drafts that already converted to a registration", async () => {
    const u = await mkUser();
    const draft = await mkDraft({ mobileVerified: true, status: "PHASE1_ACTIVE", ageHours: 30, userId: u.id });
    await sendIncompleteRegistrationReminders({ dryRun: false });
    const logs = await db.select().from(notificationLogsTable)
      .where(like(notificationLogsTable.dedupeKey, `draft_incomplete_${draft.id}_%`));
    expect(logs.length).toBe(0);
  });
});
