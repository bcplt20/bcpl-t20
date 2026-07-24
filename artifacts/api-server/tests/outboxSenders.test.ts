// Real sendSms/sendEmail auto-enqueue-on-failure integration. globalThis.fetch
// is stubbed to fail, so NO real provider call can happen even though real
// MSG91/Brevo keys exist in dev. Asserts: provider failure → outbox row with
// the exact payload; noOutbox suppresses queueing; OTP path never queues.
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import { db } from "@workspace/db";
import { notificationOutboxTable } from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";
import { ensureOutboxTable } from "../src/lib/outbox";
import { sendSms, sendOtp } from "../src/lib/sms";
import { sendEmail } from "../src/lib/email";

const RUN = `${Date.now()}-${process.pid}`;
const cleanupIds: string[] = [];
const hasSmsKeys = Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_SENDER_ID);
const hasEmailKey = Boolean(process.env.BREVO_API_KEY);

beforeAll(async () => {
  await ensureOutboxTable();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  if (cleanupIds.length) {
    await db.delete(notificationOutboxTable).where(inArray(notificationOutboxTable.id, cleanupIds));
  }
});

function stubFetchDown() {
  return vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error(`simulated network down ${RUN}`));
}

async function rowsFor(recipient: string) {
  const rows = await db.select().from(notificationOutboxTable).where(eq(notificationOutboxTable.recipient, recipient));
  cleanupIds.push(...rows.map((r) => r.id));
  return rows;
}

describe("sendSms failure auto-enqueue", () => {
  it.skipIf(!hasSmsKeys)("queues the failed sms with its exact message", async () => {
    stubFetchDown();
    const recipient = "0000000099"; // impossible number — and fetch is stubbed anyway
    const message = `sms retry test ${RUN}`;

    const res = await sendSms(recipient, message, { outboxMeta: { template: "test-sms" } });
    expect(res.ok).toBe(false);
    expect(res.skipped).toBeFalsy();

    const rows = (await rowsFor(recipient)).filter((r) => (r.payload as { message?: string }).message === message);
    expect(rows.length).toBe(1);
    expect(rows[0]!.template).toBe("test-sms");
    expect(rows[0]!.status).toBe("pending");
    expect(rows[0]!.lastError).toContain("simulated network down");
  });

  it.skipIf(!hasSmsKeys)("does NOT queue when noOutbox is set (sweep self-call guard)", async () => {
    stubFetchDown();
    const recipient = "0000000098";
    const message = `no-outbox test ${RUN}`;

    const res = await sendSms(recipient, message, { noOutbox: true });
    expect(res.ok).toBe(false);

    const rows = (await rowsFor(recipient)).filter((r) => (r.payload as { message?: string }).message === message);
    expect(rows.length).toBe(0);
  });

  it.skipIf(!hasSmsKeys)("OTP failures are NEVER queued (time-sensitive)", async () => {
    stubFetchDown();
    const before = await db.select({ id: notificationOutboxTable.id }).from(notificationOutboxTable);
    const ok = await sendOtp("0000000097", "123456");
    expect(ok).toBe(false);
    const after = await db.select({ id: notificationOutboxTable.id }).from(notificationOutboxTable);
    expect(after.length).toBe(before.length);
  });
});

describe("sendEmail failure auto-enqueue", () => {
  it.skipIf(!hasEmailKey)("queues the failed email with subject + html", async () => {
    stubFetchDown();
    const to = `outbox-sender-${RUN}@example.com`;
    const subject = `email retry test ${RUN}`;

    const res = await sendEmail(
      { to, toName: "Outbox Sender Test", subject, htmlContent: "<p>retry me</p>" },
      { outboxMeta: { template: "test-email" } },
    );
    expect(res.ok).toBe(false);
    expect(res.skipped).toBeFalsy();

    const rows = (await rowsFor(to)).filter((r) => (r.payload as { subject?: string }).subject === subject);
    expect(rows.length).toBe(1);
    expect(rows[0]!.channel).toBe("email");
    expect(rows[0]!.recipientName).toBe("Outbox Sender Test");
  });

  it.skipIf(!hasEmailKey)("identical failed email dedupes into one live row", async () => {
    stubFetchDown();
    const to = `outbox-dedupe-${RUN}@example.com`;
    const subject = `dedupe email ${RUN}`;
    const params = { to, toName: "D", subject, htmlContent: "<p>same</p>" };

    await sendEmail(params);
    await sendEmail(params);

    const rows = (await rowsFor(to)).filter((r) => (r.payload as { subject?: string }).subject === subject);
    expect(rows.length).toBe(1);
  });
});
