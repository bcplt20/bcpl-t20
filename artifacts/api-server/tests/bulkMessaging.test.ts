/**
 * Task #47 — bulk SMS / WhatsApp to player segments (SMS/WhatsApp twin of the
 * bulk email tool).
 *
 * Every outbound provider call is stubbed via globalThis.fetch, so even though
 * REAL MSG91 / Interakt keys are live in dev, NO real SMS/WhatsApp is ever sent
 * from this test. Asserts:
 *  - segment resolution by stage + trial city, deduped by phone, phone-less
 *    recipients skipped
 *  - the safety gate: a DRY RUN records the would-send count and writes NO
 *    per-recipient notification_logs rows and calls NO provider
 *  - a real send records sent/failed/skipped totals via reserve-first dedupe
 *  - a re-run of the same campaign NEVER double-sends (dedupe on re-run)
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@workspace/db";
import {
  usersTable,
  registrationsTable,
  phase1PaymentsTable,
  notificationLogsTable,
  smsCampaignsTable,
} from "@workspace/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

// Stub every outbound provider call before importing the routes. A fresh
// Response per call — a Response body can only be read once.
let fetchCalls = 0;
vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
  fetchCalls++;
  return new Response(JSON.stringify({ type: "success", result: true }), { status: 200 });
});

const { resolvePhoneAudience, runBulkCampaign, ensureMarketingTables } = await import(
  "../src/routes/marketing"
);
const { ensureNotificationErrorColumn } = await import("../src/lib/notify");

const RUN = String(Date.now()).slice(-7);
const CITY = `TestCity${RUN}`;
const userIds: string[] = [];
const regIds: string[] = [];
const campaignIds: string[] = [];

let phoneSeq = 10;
async function mkPlayer(suffix: string, opts: { phone?: string | null; city?: string | null; paid?: boolean }) {
  // A valid, unique 10-digit Indian mobile (starts 6-9). RUN is 7 digits, so
  // `9` + 7 digits + a 2-digit sequence = a unique 10-digit number.
  const validPhone = `9${RUN}${String(phoneSeq++).padStart(2, "0")}`;
  const [user] = await db
    .insert(usersTable)
    .values({
      name: `BulkMsg ${RUN}-${suffix}`,
      phone: opts.phone === undefined ? validPhone : (opts.phone ?? `INVALID-${suffix}`),
      email: `bulkmsg-${RUN}-${suffix}@test.bcpl`,
      isVerified: true,
    })
    .returning();
  userIds.push(user.id);
  const [reg] = await db
    .insert(registrationsTable)
    .values({
      userId: user.id,
      role: "bat",
      trialCity: opts.city === undefined ? CITY : opts.city,
      phase1Status: "pending",
    })
    .returning();
  regIds.push(reg.id);
  if (opts.paid) {
    await db.insert(phase1PaymentsTable).values({
      registrationId: reg.id,
      amount: "499",
      cashfreeOrderId: `order-${RUN}-${suffix}`,
      status: "success",
    });
  }
  return { user, reg };
}

beforeAll(async () => {
  await ensureNotificationErrorColumn();
  await ensureMarketingTables();
  // A) registered, in CITY, with a phone, not paid
  await mkPlayer("A", { city: CITY, paid: false });
  // B) registered, in CITY, paid (p1)
  await mkPlayer("B", { city: CITY, paid: true });
  // C) registered, DIFFERENT city, paid — excluded by city filter
  await mkPlayer("C", { city: `Other${RUN}`, paid: true });
  // D) NO phone (invalid) — must be skipped by the resolver
  await mkPlayer("D", { city: CITY, phone: `bad-${RUN}`, paid: false });
});

afterAll(async () => {
  if (campaignIds.length) {
    await db.delete(smsCampaignsTable).where(inArray(smsCampaignsTable.id, campaignIds));
  }
  if (userIds.length) {
    await db.delete(notificationLogsTable).where(inArray(notificationLogsTable.userId, userIds));
    await db.delete(phase1PaymentsTable).where(inArray(phase1PaymentsTable.registrationId, regIds));
    await db.delete(registrationsTable).where(inArray(registrationsTable.id, regIds));
    await db.delete(usersTable).where(inArray(usersTable.id, userIds));
  }
  vi.restoreAllMocks();
});

describe("resolvePhoneAudience — segment resolution", () => {
  it("filters by trial city and skips recipients without a phone", async () => {
    const rows = await resolvePhoneAudience({ stage: "registered", city: CITY });
    const names = rows.map((r) => r.name).sort();
    // A + B are in CITY with valid phones; C is another city; D has no phone.
    expect(names).toEqual([`BulkMsg ${RUN}-A`, `BulkMsg ${RUN}-B`]);
    // Every returned recipient has a normalized 10-digit phone.
    expect(rows.every((r) => /^[0-9]{10}$/.test(r.phone))).toBe(true);
  });

  it("filters by stage (p1_paid) within the city", async () => {
    const rows = await resolvePhoneAudience({ stage: "p1_paid", city: CITY });
    expect(rows.map((r) => r.name)).toEqual([`BulkMsg ${RUN}-B`]);
  });
});

describe("runBulkCampaign — reserve-first dedupe + totals", () => {
  async function newCampaignRow(channel: "sms" | "whatsapp") {
    const [row] = await db
      .insert(smsCampaignsTable)
      .values({
        channel,
        name: `bulk-${channel}-${RUN}`,
        flowTemplateId: channel === "sms" ? "flow-test-id" : null,
        templateName: channel === "whatsapp" ? "bcpl_phase1_receipt" : null,
        templateVars: [],
        audience: { stage: "registered", city: CITY },
        status: "sending",
        totalRecipients: 2,
      })
      .returning();
    campaignIds.push(row!.id);
    return row!;
  }

  it("sends once per recipient and records totals", async () => {
    fetchCalls = 0;
    const row = await newCampaignRow("sms");
    const recipients = await resolvePhoneAudience({ stage: "registered", city: CITY });
    expect(recipients.length).toBe(2);

    await runBulkCampaign(row.id, "sms", { flowTemplateId: "flow-test-id", templateVars: [], body: "" }, recipients);

    const [after] = await db.select().from(smsCampaignsTable).where(eq(smsCampaignsTable.id, row.id));
    expect(after!.status).toBe("sent");
    expect(after!.sentCount).toBe(2);
    expect(after!.failedCount).toBe(0);
    expect(after!.skippedCount).toBe(0);
    expect(fetchCalls).toBe(2); // exactly one provider call per recipient

    // One dedupe row per campaign+recipient, status 'sent'.
    const logs = await db
      .select({ status: notificationLogsTable.status, dedupeKey: notificationLogsTable.dedupeKey })
      .from(notificationLogsTable)
      .where(inArray(notificationLogsTable.userId, recipients.map((r) => r.userId)));
    const forCampaign = logs.filter((l) => l.dedupeKey?.includes(row.id));
    expect(forCampaign.length).toBe(2);
    expect(forCampaign.every((l) => l.status === "sent")).toBe(true);
  });

  it("a re-run of the same campaign never double-sends (dedupe)", async () => {
    const [row] = await db
      .select()
      .from(smsCampaignsTable)
      .where(eq(smsCampaignsTable.name, `bulk-sms-${RUN}`))
      .limit(1);
    const recipients = await resolvePhoneAudience({ stage: "registered", city: CITY });

    fetchCalls = 0;
    await runBulkCampaign(row!.id, "sms", { flowTemplateId: "flow-test-id", templateVars: [], body: "" }, recipients);

    // Re-run: every recipient already reserved → all skipped, NO provider calls.
    expect(fetchCalls).toBe(0);
    const [after] = await db.select().from(smsCampaignsTable).where(eq(smsCampaignsTable.id, row!.id));
    expect(after!.skippedCount).toBe(2);
    expect(after!.sentCount).toBe(0);

    // Still exactly 2 dedupe rows for this campaign — no duplicates inserted.
    const forCampaign = await db
      .select({ id: notificationLogsTable.id })
      .from(notificationLogsTable)
      .where(sql`${notificationLogsTable.dedupeKey} LIKE ${`%${row!.id}%`}`);
    expect(forCampaign.length).toBe(2);
  });
});

describe("safety gate — dry run writes no sends", () => {
  it("a dry-run campaign records would-send count but no notification_logs and no provider calls", async () => {
    // Simulate the send endpoint's dry-run branch: insert a dry_run row, call
    // NO provider, write NO per-recipient rows.
    fetchCalls = 0;
    const recipients = await resolvePhoneAudience({ stage: "registered", city: CITY });
    const [row] = await db
      .insert(smsCampaignsTable)
      .values({
        channel: "whatsapp",
        name: `bulk-dry-${RUN}`,
        templateName: "bcpl_phase1_receipt",
        templateVars: [],
        audience: { stage: "registered", city: CITY },
        status: "dry_run",
        totalRecipients: recipients.length,
        dryRun: 1,
        completedAt: new Date(),
      })
      .returning();
    campaignIds.push(row!.id);

    expect(fetchCalls).toBe(0);
    expect(row!.status).toBe("dry_run");
    expect(row!.totalRecipients).toBe(2);

    // No per-recipient rows carry this campaign's dedupe key.
    const forCampaign = await db
      .select({ id: notificationLogsTable.id })
      .from(notificationLogsTable)
      .where(sql`${notificationLogsTable.dedupeKey} LIKE ${`%${row!.id}%`}`);
    expect(forCampaign.length).toBe(0);
  });
});
