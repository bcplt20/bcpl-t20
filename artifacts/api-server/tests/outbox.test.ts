// Outbox sweep logic — enqueue/dedupe, retry backoff, dead-lettering, dry-run
// gating. Senders are MOCKED (real MSG91/Brevo keys live in dev — no test may
// ever hit a real provider). Runs against the shared dev DB; rows created here
// carry unique test recipients and are deleted in afterAll.
//
// NOTE: the sweep claims ANY due row, so pre-existing dev failure debris may
// get mock-"sent" during this test. Dev outbox is dry-run-only (never really
// sends), so that debris is inert either way.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@workspace/db";
import { notificationOutboxTable } from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";
import { ensureOutboxTable, enqueueOutbox, runOutboxSweep } from "../src/lib/outbox";

const smsMock = vi.fn();
const emailMock = vi.fn();

vi.mock("../src/lib/sms", async (importOriginal) => {
  const orig = await importOriginal<typeof import("../src/lib/sms")>();
  return { ...orig, sendSms: (...args: unknown[]) => smsMock(...args) };
});
vi.mock("../src/lib/email", async (importOriginal) => {
  const orig = await importOriginal<typeof import("../src/lib/email")>();
  return { ...orig, sendEmail: (...args: unknown[]) => emailMock(...args) };
});

const RUN = `${Date.now()}-${process.pid}`;
const createdIds: string[] = [];

async function insertRow(overrides: Partial<typeof notificationOutboxTable.$inferInsert> = {}): Promise<string> {
  const [row] = await db
    .insert(notificationOutboxTable)
    .values({
      channel: "sms",
      recipient: `outbox-test-${RUN}-${Math.random().toString(36).slice(2, 8)}`,
      payload: { message: `test message ${RUN}` },
      status: "pending",
      nextAttemptAt: new Date(Date.now() - 60_000), // already due
      dedupeKey: `test:${RUN}:${Math.random().toString(36).slice(2, 10)}`,
      ...overrides,
    })
    .returning({ id: notificationOutboxTable.id });
  createdIds.push(row!.id);
  return row!.id;
}

async function fetchRow(id: string) {
  const [row] = await db.select().from(notificationOutboxTable).where(eq(notificationOutboxTable.id, id));
  return row!;
}

beforeAll(async () => {
  await ensureOutboxTable();
});

afterAll(async () => {
  if (createdIds.length) {
    await db.delete(notificationOutboxTable).where(inArray(notificationOutboxTable.id, createdIds));
  }
});

describe("enqueueOutbox dedupe", () => {
  it("merges identical live messages into one row (auto content key)", async () => {
    const recipient = `outbox-test-${RUN}-dedupe`;
    const payload = { message: `dedupe ${RUN}` };
    const first = await enqueueOutbox({ channel: "sms", recipient, payload });
    const second = await enqueueOutbox({ channel: "sms", recipient, payload });
    expect(first).toBe(true);
    expect(second).toBe(false); // 23505 on the live-row partial unique index

    const rows = await db.select().from(notificationOutboxTable).where(eq(notificationOutboxTable.recipient, recipient));
    expect(rows.length).toBe(1);
    createdIds.push(...rows.map((r) => r.id));
    expect(rows[0]!.status).toBe("pending");
    // first retry is scheduled in the future, not immediately
    expect(rows[0]!.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("runOutboxSweep", () => {
  it("dry-run (default outside production) reports due rows but touches nothing", async () => {
    const id = await insertRow();
    const r = await runOutboxSweep(5); // NODE_ENV != production, OUTBOX_ENABLED unset → dry
    expect(r.dryRun).toBe(true);
    expect(r.due).toBeGreaterThanOrEqual(1);
    expect(r.claimed).toBe(0);
    const row = await fetchRow(id);
    expect(row.status).toBe("pending");
    expect(row.attempts).toBe(0);
  });

  it("sends a due sms row and marks it sent (sweep passes noOutbox)", async () => {
    smsMock.mockResolvedValue({ ok: true });
    emailMock.mockResolvedValue({ ok: true });
    const id = await insertRow({ payload: { message: `sweep-ok ${RUN}` } });

    const r = await runOutboxSweep(100, { dryRun: false });
    expect(r.claimed).toBeGreaterThanOrEqual(1);

    const row = await fetchRow(id);
    expect(row.status).toBe("sent");
    expect(row.sentAt).not.toBeNull();
    expect(row.attempts).toBe(1);

    const call = smsMock.mock.calls.find((c) => c[1] === `sweep-ok ${RUN}`);
    expect(call).toBeTruthy();
    expect(call![2]).toMatchObject({ noOutbox: true }); // no self-requeue loops
  });

  it("reschedules a first failure with EXACTLY the 5-minute backoff (attempt #1)", async () => {
    smsMock.mockResolvedValue({ ok: false, error: "simulated provider down" });
    emailMock.mockResolvedValue({ ok: false, error: "simulated provider down" });
    const id = await insertRow({ payload: { message: `sweep-fail ${RUN}` } });

    const before = Date.now();
    await runOutboxSweep(100, { dryRun: false });

    const row = await fetchRow(id);
    expect(row.status).toBe("pending");
    expect(row.attempts).toBe(1);
    expect(row.lastError).toContain("simulated provider down");
    // Regression pin (off-by-one bug): attempt #1 backoff is 5 min, NOT 10.
    const delayMin = (row.nextAttemptAt.getTime() - before) / 60_000;
    expect(delayMin).toBeGreaterThan(4.5);
    expect(delayMin).toBeLessThan(6.5);
  });

  it("4th failed attempt does NOT dead-letter (max is 5) and backs off 40 min", async () => {
    smsMock.mockResolvedValue({ ok: false, error: "still down" });
    const id = await insertRow({ attempts: 3, maxAttempts: 5, payload: { message: `sweep-4th ${RUN}` } });

    const before = Date.now();
    await runOutboxSweep(100, { dryRun: false });

    const row = await fetchRow(id);
    expect(row.status).toBe("pending"); // regression pin: must survive to attempt #5
    expect(row.attempts).toBe(4);
    const delayMin = (row.nextAttemptAt.getTime() - before) / 60_000;
    expect(delayMin).toBeGreaterThan(35); // 5·2^3 = 40 min
    expect(delayMin).toBeLessThan(45);
  });

  it("dead-letters exactly at the 5th attempt", async () => {
    smsMock.mockResolvedValue({ ok: false, error: "still down" });
    const id = await insertRow({ attempts: 4, maxAttempts: 5, payload: { message: `sweep-dead ${RUN}` } });

    await runOutboxSweep(100, { dryRun: false });

    const row = await fetchRow(id);
    expect(row.status).toBe("dead");
    expect(row.attempts).toBe(5);
    expect(row.lastError).toContain("still down");
  });

  it("delivers email rows through sendEmail", async () => {
    emailMock.mockResolvedValue({ ok: true });
    const id = await insertRow({
      channel: "email",
      recipient: `outbox-test-${RUN}@example.com`,
      recipientName: "Outbox Test",
      payload: { subject: `subj ${RUN}`, htmlContent: "<p>retry</p>" },
    });

    await runOutboxSweep(100, { dryRun: false });

    const row = await fetchRow(id);
    expect(row.status).toBe("sent");
    const call = emailMock.mock.calls.find((c) => (c[0] as { subject?: string })?.subject === `subj ${RUN}`);
    expect(call).toBeTruthy();
    expect(call![1]).toMatchObject({ noOutbox: true });
  });
});
