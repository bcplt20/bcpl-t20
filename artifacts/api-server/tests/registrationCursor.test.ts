/**
 * Deterministic registration cursor — /api/user/dashboard must always pick
 * the user's FURTHEST-progressed registration when multiple rows exist
 * (legacy carryover, abandoned re-registrations).
 *
 * Regression for the prod bug where a website-KYC-complete player saw
 * "KYC pending" in the mobile app because an unordered LIMIT 1 picked an
 * older abandoned registration.
 */
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { inArray } from "drizzle-orm";

process.env.ADMIN_SECRET ||= "test-admin-secret-for-vitest";
process.env.SESSION_SECRET ||= "test-session-secret-for-vitest";

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { usersTable, registrationsTable, kycRecordsTable } = await import("@workspace/db/schema");
const { signToken } = await import("../src/lib/auth");

const suffix = String(Date.now()).slice(-7);
const createdUserIds: string[] = [];
const createdRegIds: string[] = [];

let seq = 0;
async function mkUser() {
  const n = ++seq;
  const [u] = await db.insert(usersTable).values({
    name: `Cursor Test ${suffix}-${n}`,
    phone: `7${suffix}${String(n).padStart(2, "0")}`, // 1+7+2 = exactly 10 digits, unique per user
    email: `cursor-${suffix}-${n}@test.invalid`,
    isVerified: true,
  }).returning();
  createdUserIds.push(u.id);
  return u;
}

async function mkReg(userId: string, p1: string, p2: string | null, createdAt: Date) {
  const [r] = await db.insert(registrationsTable).values({
    userId,
    role: "bat",
    trialCity: "Mumbai",
    phase1Status: p1,
    phase2Status: p2 as never,
    regNumber: `CUR-${suffix}-${++seq}`,
    createdAt,
  } as never).returning();
  createdRegIds.push(r.id);
  return r;
}

afterAll(async () => {
  if (createdRegIds.length) {
    await db.delete(kycRecordsTable).where(inArray(kycRecordsTable.registrationId, createdRegIds));
    await db.delete(registrationsTable).where(inArray(registrationsTable.id, createdRegIds));
  }
  if (createdUserIds.length) {
    await db.delete(usersTable).where(inArray(usersTable.id, createdUserIds));
  }
});

async function dashboardRegId(userId: string, phone: string) {
  const token = signToken({ userId, phone });
  const res = await request(app).get("/api/user/dashboard").set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(200);
  return res.body?.registration?.id ?? res.body?.registrationId ?? JSON.stringify(res.body);
}

describe("registration cursor picks furthest-progressed row", () => {
  it("kyc_done beats a NEWER payment_done registration", async () => {
    const u = await mkUser();
    const older = await mkReg(u.id, "selected", "kyc_done", new Date("2026-01-01"));
    await mkReg(u.id, "payment_done", "payment_done", new Date("2026-08-01"));
    const body = await request(app).get("/api/user/dashboard")
      .set("Authorization", `Bearer ${signToken({ userId: u.id, phone: u.phone })}`)
      .expect(200);
    expect(JSON.stringify(body.body)).toContain(older.id);
  });

  it("kyc_approved / trial_cleared / team_signed all beat payment_done", async () => {
    for (const p2 of ["kyc_approved", "trial_cleared", "team_signed"]) {
      const u = await mkUser();
      const winner = await mkReg(u.id, "selected", p2, new Date("2026-01-01"));
      await mkReg(u.id, "payment_done", "payment_done", new Date("2026-08-01"));
      const body = await request(app).get("/api/user/dashboard")
        .set("Authorization", `Bearer ${signToken({ userId: u.id, phone: u.phone })}`)
        .expect(200);
      expect(JSON.stringify(body.body), `p2=${p2}`).toContain(winner.id);
    }
  });

  it("ties broken by newest createdAt", async () => {
    const u = await mkUser();
    await mkReg(u.id, "pending", null, new Date("2026-01-01"));
    const newer = await mkReg(u.id, "pending", null, new Date("2026-08-01"));
    const body = await request(app).get("/api/user/dashboard")
      .set("Authorization", `Bearer ${signToken({ userId: u.id, phone: u.phone })}`)
      .expect(200);
    expect(JSON.stringify(body.body)).toContain(newer.id);
  });
});
