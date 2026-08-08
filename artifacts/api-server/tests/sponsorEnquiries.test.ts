/**
 * Sponsorship enquiries — public lead form + admin CRM.
 *
 * Covers:
 *  - zod validation (missing fields, bad phone, invalid budget)
 *  - phone normalization (+91 / 0 / spaces → bare 10-digit)
 *  - honeypot field → silently accepted, nothing stored, no email
 *  - per-IP rate limit (3/hour) → 429
 *  - admin list (newest first) + status filter + auth gate
 *  - admin PATCH status + adminNote (+ 404 on unknown id, 400 on empty)
 *  - admin-alert email is GATED (dry-run) unless remindersEnabled(), and a
 *    failing send NEVER fails the API (row is source of truth)
 *
 * Brevo is fully mocked — no real email can fire (keys live in dev).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import request from "supertest";
import { sql } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-sponsor-enq";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";
// Keep reminders OFF by default so the default path is DRY RUN (no send).
delete process.env.REMINDERS_ENABLED;
process.env.ADMIN_ALERT_EMAIL = "ops@bcplt20.test";

vi.mock("../src/lib/email", async (o) => {
  const orig = await o<typeof import("../src/lib/email")>();
  return { ...orig, sendEmail: vi.fn(async () => ({ ok: true as const })) };
});

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const email = await import("../src/lib/email");
const {
  ensureSponsorEnquiriesTable,
  __resetEnquiryRateLimit,
  normalizeIndianPhone,
} = await import("../src/routes/sponsorEnquiries");

const admin = { "x-bcpl-admin": TEST_ADMIN_SECRET };
const suffix = String(Date.now()).slice(-7);
const companyTag = `ZZTEST-${suffix}`;
const createdIds: string[] = [];

beforeAll(async () => {
  await ensureSponsorEnquiriesTable();
  __resetEnquiryRateLimit();
  vi.mocked(email.sendEmail).mockClear();
});

afterAll(async () => {
  await db.execute(sql`DELETE FROM sponsor_enquiries WHERE company LIKE ${"%" + companyTag + "%"}`);
});

function payload(over: Record<string, unknown> = {}) {
  return {
    name: "Anita Sharma",
    company: `${companyTag} Retail Pvt Ltd`,
    designation: "Marketing Head",
    phone: "9876543210",
    email: "anita@example.com",
    budgetRange: "5-15L",
    message: "We would like to explore a jersey partnership.",
    source: "website",
    ...over,
  };
}

describe("phone normalization", () => {
  it("normalizes common Indian formats to bare 10 digits", () => {
    expect(normalizeIndianPhone("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianPhone("098765-43210")).toBe("9876543210");
    expect(normalizeIndianPhone("9876543210")).toBe("9876543210");
  });
  it("rejects invalid numbers", () => {
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(normalizeIndianPhone("1234567890")).toBeNull(); // must start 6-9
  });
});

describe("POST /api/sponsors/enquiry — validation", () => {
  it("400s on missing required fields", async () => {
    const r = await request(app).post("/api/sponsors/enquiry")
      .set("x-forwarded-for", "77.0.0.1").send({ name: "X" });
    expect(r.status).toBe(400);
  });

  it("400s on an invalid budget range", async () => {
    const r = await request(app).post("/api/sponsors/enquiry")
      .set("x-forwarded-for", "77.0.0.2").send(payload({ budgetRange: "1-cr" }));
    expect(r.status).toBe(400);
  });

  it("400s on a bad phone number", async () => {
    const r = await request(app).post("/api/sponsors/enquiry")
      .set("x-forwarded-for", "77.0.0.3").send(payload({ phone: "1234567890" }));
    expect(r.status).toBe(400);
    expect(r.body.code).toBe("BAD_PHONE");
  });
});

describe("POST /api/sponsors/enquiry — happy path + honeypot", () => {
  it("201 saves a valid enquiry (email dry-run, not sent)", async () => {
    const r = await request(app).post("/api/sponsors/enquiry")
      .set("x-forwarded-for", "77.1.0.1").send(payload());
    expect(r.status).toBe(201);
    expect(r.body.ok).toBe(true);
    expect(typeof r.body.id).toBe("string");
    createdIds.push(r.body.id);
    // reminders disabled → dry run → no email attempted
    expect(email.sendEmail).not.toHaveBeenCalled();
  });

  it("honeypot: accepts silently, stores nothing, sends nothing", async () => {
    vi.mocked(email.sendEmail).mockClear();
    const before = await db.execute(sql`SELECT count(*)::int AS n FROM sponsor_enquiries WHERE company LIKE ${"%" + companyTag + "%"}`);
    const beforeN = (before as unknown as { rows: Array<{ n: number }> }).rows[0].n;
    const r = await request(app).post("/api/sponsors/enquiry")
      .set("x-forwarded-for", "77.1.0.2")
      .send(payload({ website_url: "http://spam.example" }));
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    const after = await db.execute(sql`SELECT count(*)::int AS n FROM sponsor_enquiries WHERE company LIKE ${"%" + companyTag + "%"}`);
    expect((after as unknown as { rows: Array<{ n: number }> }).rows[0].n).toBe(beforeN);
    expect(email.sendEmail).not.toHaveBeenCalled();
  });
});

describe("POST /api/sponsors/enquiry — rate limit (3/hour per IP)", () => {
  it("429s after the 3rd enquiry from the same IP", async () => {
    __resetEnquiryRateLimit();
    const ip = "77.9.9.9";
    for (let i = 0; i < 3; i++) {
      const r = await request(app).post("/api/sponsors/enquiry").set("x-forwarded-for", ip).send(payload());
      expect(r.status).toBe(201);
      createdIds.push(r.body.id);
    }
    const r4 = await request(app).post("/api/sponsors/enquiry").set("x-forwarded-for", ip).send(payload());
    expect(r4.status).toBe(429);
    expect(r4.body.code).toBe("RATE_LIMITED");
  });
});

describe("admin-alert email gating", () => {
  const origEnv = process.env.NODE_ENV;
  afterEach(() => {
    if (origEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = origEnv;
    delete process.env.REMINDERS_ENABLED;
  });

  it("dispatches a best-effort email in production when reminders are enabled", async () => {
    process.env.NODE_ENV = "production";
    process.env.REMINDERS_ENABLED = "1";
    vi.mocked(email.sendEmail).mockClear();
    __resetEnquiryRateLimit();
    const r = await request(app).post("/api/sponsors/enquiry")
      .set("x-forwarded-for", "77.2.0.1").send(payload());
    expect(r.status).toBe(201);
    createdIds.push(r.body.id);
    expect(email.sendEmail).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(email.sendEmail).mock.calls[0][0];
    expect(arg.to).toBe("ops@bcplt20.test");
    expect(arg.subject).toContain("sponsorship enquiry");
  });

  it("DRY RUN in dev even with REMINDERS_ENABLED=1 (prod-only, non-overridable)", async () => {
    process.env.NODE_ENV = "development";
    process.env.REMINDERS_ENABLED = "1";
    vi.mocked(email.sendEmail).mockClear();
    __resetEnquiryRateLimit();
    const r = await request(app).post("/api/sponsors/enquiry")
      .set("x-forwarded-for", "77.2.0.3").send(payload());
    expect(r.status).toBe(201);
    createdIds.push(r.body.id);
    // dev is a non-overridable dry-run — REMINDERS_ENABLED cannot force a send
    expect(email.sendEmail).not.toHaveBeenCalled();
  });

  it("never fails the API when the email send throws", async () => {
    process.env.NODE_ENV = "production";
    process.env.REMINDERS_ENABLED = "1";
    vi.mocked(email.sendEmail).mockRejectedValueOnce(new Error("brevo down"));
    __resetEnquiryRateLimit();
    const r = await request(app).post("/api/sponsors/enquiry")
      .set("x-forwarded-for", "77.2.0.2").send(payload());
    expect(r.status).toBe(201);
    expect(r.body.ok).toBe(true);
    createdIds.push(r.body.id);
  });
});

describe("admin: list + patch", () => {
  it("rejects unauthenticated list in prod-like mode", async () => {
    // With ADMIN_SECRET set, a missing/wrong header is forbidden.
    const r = await request(app).get("/api/sponsors/admin/enquiries")
      .set("x-bcpl-admin", "wrong-secret");
    expect(r.status).toBe(403);
  });

  it("lists enquiries newest first", async () => {
    const r = await request(app).get("/api/sponsors/admin/enquiries").set(admin);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.enquiries)).toBe(true);
    const mine = r.body.enquiries.filter((e: { company: string }) => e.company.includes(companyTag));
    expect(mine.length).toBeGreaterThan(0);
    // newest first: created_at descending
    const times = r.body.enquiries.map((e: { createdAt: string }) => new Date(e.createdAt).getTime());
    for (let i = 1; i < times.length; i++) expect(times[i - 1]).toBeGreaterThanOrEqual(times[i]);
    expect(r.body.statuses).toContain("new");
    expect(r.body.budgetRanges).toContain("5-15L");
  });

  it("filters by status", async () => {
    const r = await request(app).get("/api/sponsors/admin/enquiries?status=new").set(admin);
    expect(r.status).toBe(200);
    for (const e of r.body.enquiries) expect(e.status).toBe("new");
  });

  it("400s on an invalid status filter", async () => {
    const r = await request(app).get("/api/sponsors/admin/enquiries?status=bogus").set(admin);
    expect(r.status).toBe(400);
  });

  it("patches status + adminNote", async () => {
    const id = createdIds[0];
    const r = await request(app).patch(`/api/sponsors/admin/enquiries/${id}`).set(admin)
      .send({ status: "contacted", adminNote: "Called; sending deck." });
    expect(r.status).toBe(200);
    expect(r.body.enquiry.status).toBe("contacted");
    expect(r.body.enquiry.adminNote).toBe("Called; sending deck.");
  });

  it("400s on an empty patch body", async () => {
    const id = createdIds[0];
    const r = await request(app).patch(`/api/sponsors/admin/enquiries/${id}`).set(admin).send({});
    expect(r.status).toBe(400);
  });

  it("404s on an unknown id", async () => {
    const r = await request(app).patch(`/api/sponsors/admin/enquiries/00000000-0000-0000-0000-000000000000`)
      .set(admin).send({ status: "closed" });
    expect(r.status).toBe(404);
  });
});
