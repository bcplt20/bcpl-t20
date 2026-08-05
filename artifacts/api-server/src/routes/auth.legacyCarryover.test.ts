/**
 * POST /api/auth/verify-otp — Season-4 paid carryover.
 * Old-site PAID players (legacy_registrations, source='paid') were promised
 * trials for two seasons on one payment. Logging in with OTP must
 * auto-provision: user + registration with phase1Status='selected',
 * phase2Status='payment_done' (straight to the Phase-2 KYC card), a reg
 * number, and a legacyCarryover marker in consents. Unpaid legacy rows get
 * nothing. Runs against the real dev DB with throwaway rows; OTP rows are
 * inserted directly (never via send-otp — real SMS keys live in dev).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import crypto from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { db } from "@workspace/db";
import {
  usersTable, registrationsTable, otpSessionsTable, legacyRegistrationsTable,
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";
import authRouter from "./auth";
import paymentRouter from "./payment";

const rand8 = String(crypto.randomInt(10_000_000, 99_999_999));
const PHONE_PAID   = `96${rand8}`;  // format-valid; OTP rows inserted directly, no SMS ever sent
const PHONE_UNPAID = `97${rand8}`;
const PHONE_REREG  = `98${rand8}`; // legacy paid AND already registered fresh this season
const LEGACY_ID_A = crypto.randomInt(90_000_000, 99_999_999);
const LEGACY_ID_B = LEGACY_ID_A + 1;
const LEGACY_ID_C = LEGACY_ID_A + 2;

let server: Server;
let base = "";

async function seedOtp(phone: string): Promise<string> {
  const otp = String(crypto.randomInt(100000, 999999));
  await db.insert(otpSessionsTable).values({
    phone, otpCode: otp, purpose: "login",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  return otp;
}

async function verify(phone: string, otp: string) {
  const r = await fetch(base + "/api/auth/verify-otp", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone, otp, purpose: "login" }),
  });
  return { status: r.status, body: await r.json() as any };
}

beforeAll(async () => {
  await db.insert(legacyRegistrationsTable).values([
    {
      source: "paid", legacyRegId: LEGACY_ID_A,
      firstName: "Carry", lastName: "Over",
      phone: "91" + PHONE_PAID, // old exports often carry the country code
      email: `carryover.${rand8}@legacy-test.invalid`,
      trialCity: "Bangalore", role: "All Rounder", // old spelling — must normalise
      paymentStatus: "paid", amountPaise: 236000,
    },
    {
      source: "paid", legacyRegId: LEGACY_ID_C,
      firstName: "Already", lastName: "Registered",
      phone: PHONE_REREG, trialCity: "Delhi", role: "Batsman",
      paymentStatus: "paid", amountPaise: 236000,
    },
    {
      source: "unpaid", legacyRegId: LEGACY_ID_B,
      firstName: "Never", lastName: "Paid",
      phone: PHONE_UNPAID, amountPaise: 0,
    },
  ]);
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  app.use("/api/payment", paymentRouter);
  await new Promise<void>((r) => { server = app.listen(0, () => r()); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  const users = await db.select({ id: usersTable.id }).from(usersTable)
    .where(inArray(usersTable.phone, [PHONE_PAID, PHONE_UNPAID, PHONE_REREG]));
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await db.delete(registrationsTable).where(inArray(registrationsTable.userId, ids));
    await db.delete(usersTable).where(inArray(usersTable.id, ids));
  }
  await db.delete(otpSessionsTable).where(inArray(otpSessionsTable.phone, [PHONE_PAID, PHONE_UNPAID, PHONE_REREG]));
  await db.delete(legacyRegistrationsTable)
    .where(inArray(legacyRegistrationsTable.legacyRegId, [LEGACY_ID_A, LEGACY_ID_B, LEGACY_ID_C]));
  await new Promise<void>((r) => server.close(() => r()));
});

describe("legacy paid carryover login", () => {
  it("provisions user + phase2-ready registration on first login", async () => {
    const otp = await seedOtp(PHONE_PAID);
    const { status, body } = await verify(PHONE_PAID, otp);
    expect(status).toBe(200);
    expect(body.token).toBeTruthy();
    expect(body.user.name).toBe("Carry Over");

    const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, PHONE_PAID));
    expect(user).toBeTruthy();
    const [reg] = await db.select().from(registrationsTable)
      .where(eq(registrationsTable.userId, user.id));
    expect(reg).toBeTruthy();
    expect(reg.phase1Status).toBe("selected");
    expect(reg.phase2Status).toBe("payment_done");
    expect(reg.role).toBe("ar");
    expect(reg.trialCity).toBe("Bengaluru");
    expect(reg.regNumber).toMatch(/^BCPL-/);
    expect((reg.consents as any)?.legacyCarryover?.legacyRegId).toBe(LEGACY_ID_A);
  });

  it("second login is idempotent — no duplicate registration", async () => {
    const otp = await seedOtp(PHONE_PAID);
    const { status } = await verify(PHONE_PAID, otp);
    expect(status).toBe(200);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, PHONE_PAID));
    const regs = await db.select({ id: registrationsTable.id }).from(registrationsTable)
      .where(eq(registrationsTable.userId, user.id));
    expect(regs.length).toBe(1);
  });

  it("concurrent logins with one OTP: exactly one succeeds, no duplicate rows", async () => {
    const otp = await seedOtp(PHONE_PAID);
    const results = await Promise.all([verify(PHONE_PAID, otp), verify(PHONE_PAID, otp)]);
    const oks = results.filter((r) => r.status === 200);
    expect(oks.length).toBe(1);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, PHONE_PAID));
    const regs = await db.select({ id: registrationsTable.id }).from(registrationsTable)
      .where(eq(registrationsTable.userId, user.id));
    expect(regs.length).toBe(1);
  });

  it("upgrades an existing fresh-season registration in place (fees waived, reg number assigned)", async () => {
    // Player registered THIS season before carryover login shipped: user +
    // registration stuck at payment_pending, no reg number yet.
    const [user] = await db.insert(usersTable).values({
      name: "Already Registered", phone: PHONE_REREG,
      email: `rereg.${rand8}@legacy-test.invalid`, isVerified: true,
    }).returning();
    await db.insert(registrationsTable).values({
      userId: user.id, role: "bat", trialCity: "Delhi",
      phase1Status: "payment_pending",
    });

    const otp = await seedOtp(PHONE_REREG);
    const { status } = await verify(PHONE_REREG, otp);
    expect(status).toBe(200);

    const regs = await db.select().from(registrationsTable)
      .where(eq(registrationsTable.userId, user.id));
    expect(regs.length).toBe(1); // upgraded in place, never duplicated
    const reg = regs[0];
    expect(reg.phase1Status).toBe("selected");       // no video-upload step
    expect(reg.phase2Status).toBe("payment_done");   // Phase-2 fee waived
    expect(reg.regNumber).toMatch(/^BCPL-/);         // number assigned, shown on trial pass
    expect((reg.consents as any)?.legacyCarryover?.upgradedExisting).toBe(true);
  });

  it("carryover registration can NEVER create a payable Phase-2 order (no double billing)", async () => {
    const otp = await seedOtp(PHONE_PAID);
    const { body } = await verify(PHONE_PAID, otp);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, PHONE_PAID));
    const [reg] = await db.select({ id: registrationsTable.id }).from(registrationsTable)
      .where(eq(registrationsTable.userId, user.id));
    const r = await fetch(base + "/api/payment/phase2/create", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + body.token },
      body: JSON.stringify({ registrationId: reg.id }),
    });
    expect(r.status).toBe(409); // phase2 already payment_done — waived, not billable
  });

  it("unpaid legacy phone still gets 404 on login", async () => {
    const otp = await seedOtp(PHONE_UNPAID);
    const { status } = await verify(PHONE_UNPAID, otp);
    expect(status).toBe(404);
    const users = await db.select({ id: usersTable.id }).from(usersTable)
      .where(eq(usersTable.phone, PHONE_UNPAID));
    expect(users.length).toBe(0);
  });
});
