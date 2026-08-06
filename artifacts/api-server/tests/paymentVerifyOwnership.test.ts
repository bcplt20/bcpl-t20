/**
 * IDOR guard on payment verify endpoints:
 * /api/payment/phase1/verify and /api/payment/phase2/verify must 404 when the
 * orderId belongs to another user's registration — BEFORE any provider lookup
 * or mutation. No Cashfree call is made (404 short-circuits in stub/dev too).
 */
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { eq, inArray } from "drizzle-orm";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { usersTable, registrationsTable, phase1PaymentsTable, phase2PaymentsTable } =
  await import("@workspace/db/schema");

const JWT_SECRET = process.env.JWT_SECRET || "bcpl-dev-secret-CHANGE-IN-PROD";
const suffix = String(Date.now()).slice(-7);
const p1Order = `p1_idor_${suffix}`;
const p2Order = `p2_idor_${suffix}`;

const userIds: string[] = [];
let regAId = "";

afterAll(async () => {
  if (regAId) {
    await db.delete(phase2PaymentsTable).where(eq(phase2PaymentsTable.registrationId, regAId));
    await db.delete(phase1PaymentsTable).where(eq(phase1PaymentsTable.registrationId, regAId));
    await db.delete(registrationsTable).where(eq(registrationsTable.id, regAId));
  }
  if (userIds.length) await db.delete(usersTable).where(inArray(usersTable.id, userIds));
});

async function seed() {
  const [victim] = await db.insert(usersTable).values({
    name: "IDOR Victim", phone: "97" + String(Date.now()).slice(-8),
    email: `idor-v-${suffix}@test.bcpl`, isVerified: true,
  }).returning({ id: usersTable.id });
  const [attacker] = await db.insert(usersTable).values({
    name: "IDOR Attacker", phone: "96" + String(Date.now()).slice(-8),
    email: `idor-a-${suffix}@test.bcpl`, isVerified: true,
  }).returning({ id: usersTable.id });
  userIds.push(victim.id, attacker.id);

  const [reg] = await db.insert(registrationsTable).values({
    userId: victim.id, role: "batsman", trialCity: "Mumbai",
    phase1Status: "pending", regNumber: `IDOR-${suffix}`,
  }).returning({ id: registrationsTable.id });
  regAId = reg.id;

  await db.insert(phase1PaymentsTable).values({
    registrationId: reg.id, amount: "299", cashfreeOrderId: p1Order, status: "pending",
  });
  await db.insert(phase2PaymentsTable).values({
    registrationId: reg.id, amount: "800", cashfreeOrderId: p2Order, status: "pending",
  });
  return { attackerToken: jwt.sign({ userId: attacker.id, phone: "0000000000" }, JWT_SECRET) };
}

describe("payment verify ownership (IDOR)", () => {
  it("phase1 & phase2 verify return 404 for a foreign orderId and leave rows untouched", async () => {
    const { attackerToken } = await seed();

    const r1 = await request(app).post("/api/payment/phase1/verify")
      .set("Authorization", `Bearer ${attackerToken}`).send({ orderId: p1Order });
    expect(r1.status).toBe(404);

    const r2 = await request(app).post("/api/payment/phase2/verify")
      .set("Authorization", `Bearer ${attackerToken}`).send({ orderId: p2Order });
    expect(r2.status).toBe(404);

    const [p1] = await db.select({ status: phase1PaymentsTable.status })
      .from(phase1PaymentsTable).where(eq(phase1PaymentsTable.cashfreeOrderId, p1Order)).limit(1);
    const [p2] = await db.select({ status: phase2PaymentsTable.status })
      .from(phase2PaymentsTable).where(eq(phase2PaymentsTable.cashfreeOrderId, p2Order)).limit(1);
    expect(p1?.status).toBe("pending");
    expect(p2?.status).toBe("pending");

    const [reg] = await db.select({ p1: registrationsTable.phase1Status, p2: registrationsTable.phase2Status })
      .from(registrationsTable).where(eq(registrationsTable.id, regAId)).limit(1);
    expect(reg?.p1).toBe("pending");
    expect(reg?.p2 ?? null).toBeNull();
  });
});
