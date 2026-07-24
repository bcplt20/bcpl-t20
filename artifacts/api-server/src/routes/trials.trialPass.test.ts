/**
 * GET /api/user/trial-pass — response contract (§17-18/§20).
 * PlayerProfile's deriveStep and the TrialPass page consume this shape; a past
 * regression came from an unnoticed shape drift, so this pins the contract:
 *   - 404 no_registration / no_allocation
 *   - allocated: player/venue/slot blocks, checkedInAt null, assessmentSubmitted false
 *   - checked-in + submitted evaluation flip checkedInAt / assessmentSubmitted
 *     (assessmentSubmitted derives from trial_evaluations status='submitted').
 * Runs against the real dev DB with throwaway rows (impossible phone), fully
 * cleaned up in afterAll. No HTTP framework deps: express on an ephemeral port.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import crypto from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { db } from "@workspace/db";
import {
  usersTable, registrationsTable, trialVenuesTable, trialSlotsTable,
  trialAllocationsTable, trialCheckinsTable, trialEvaluationsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth";
import { userTrialsRouter } from "./trials";

const suffix = crypto.randomBytes(5).toString("hex");
const PHONE_A = `0000${(Date.now() % 1_000_000_00)}1`.slice(0, 13); // impossible (leading 0000) — never routable
const PHONE_B = `0000${(Date.now() % 1_000_000_00)}2`.slice(0, 13);

let server: Server;
let base = "";
let userNoReg = "";   // user with no registration at all
let userId = "";      // full journey user
let regId = "";
let venueId = "";
let slotId = "";
let allocId = "";
let tokenA = "";      // no-reg user
let tokenB = "";      // journey user

async function getPass(token: string) {
  const res = await fetch(`${base}/api/user/trial-pass`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, body: await res.json() as any };
}

beforeAll(async () => {
  const app = express();
  app.use("/api/user", userTrialsRouter);
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const [uA] = await db.insert(usersTable).values({
    name: "TrialPass NoReg", phone: PHONE_A, email: `trialpass-a-${suffix}@test.invalid`, isVerified: true,
  }).returning();
  const [uB] = await db.insert(usersTable).values({
    name: "TrialPass Journey", phone: PHONE_B, email: `trialpass-b-${suffix}@test.invalid`, isVerified: true,
  }).returning();
  userNoReg = uA.id; userId = uB.id;
  tokenA = signToken({ userId: userNoReg, phone: PHONE_A });
  tokenB = signToken({ userId, phone: PHONE_B });

  const [reg] = await db.insert(registrationsTable).values({
    userId, regNumber: `T-${suffix}`, role: "bat", trialCity: "Delhi", phase1Status: "selected",
  }).returning();
  regId = reg.id;

  const [venue] = await db.insert(trialVenuesTable).values({
    city: "Delhi", venue: "Contract Test Ground", trialDate: "12 August 2026",
    trialTime: "8:00 AM – 12:00 PM", reportingTime: "7:30 AM",
    address: "Test Address 1", status: "active",
  }).returning();
  venueId = venue.id;

  const [slot] = await db.insert(trialSlotsTable).values({
    venueId, city: "Delhi", slotDate: "12 August 2026", reportingTime: "7:30 AM",
    startTime: "8:00 AM", batchName: `Batch T${suffix.slice(0, 4)}`,
  }).returning();
  slotId = slot.id;
});

afterAll(async () => {
  // FK-safe order; every delete keyed to this run's rows only.
  if (regId) {
    await db.delete(trialEvaluationsTable).where(eq(trialEvaluationsTable.registrationId, regId));
    await db.delete(trialCheckinsTable).where(eq(trialCheckinsTable.registrationId, regId));
    await db.delete(trialAllocationsTable).where(eq(trialAllocationsTable.registrationId, regId));
  }
  if (slotId)  await db.delete(trialSlotsTable).where(eq(trialSlotsTable.id, slotId));
  if (venueId) await db.delete(trialVenuesTable).where(eq(trialVenuesTable.id, venueId));
  if (regId)   await db.delete(registrationsTable).where(eq(registrationsTable.id, regId));
  if (userId)      await db.delete(usersTable).where(eq(usersTable.id, userId));
  if (userNoReg)   await db.delete(usersTable).where(eq(usersTable.id, userNoReg));
  await new Promise<void>((r) => server.close(() => r()));
});

describe("GET /api/user/trial-pass contract", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await fetch(`${base}/api/user/trial-pass`);
    expect(res.status).toBe(401);
  });

  it("404 no_registration when the user never registered", async () => {
    const { status, body } = await getPass(tokenA);
    expect(status).toBe(404);
    expect(body.error).toBe("no_registration");
  });

  it("404 no_allocation before any allocation exists", async () => {
    const { status, body } = await getPass(tokenB);
    expect(status).toBe(404);
    expect(body.error).toBe("no_allocation");
  });

  it("allocated: full pass shape, not checked in, not assessed", async () => {
    const [alloc] = await db.insert(trialAllocationsTable).values({
      registrationId: regId, slotId, venueId, city: "Delhi",
      status: "allocated", passToken: crypto.randomBytes(16).toString("hex"),
    }).returning();
    allocId = alloc.id;

    const { status, body } = await getPass(tokenB);
    expect(status).toBe(200);
    expect(body.player).toMatchObject({ name: "TrialPass Journey", regNumber: `T-${suffix}`, role: "bat", city: "Delhi" });
    expect(body.venue).toMatchObject({ name: "Contract Test Ground", city: "Delhi", address: "Test Address 1" });
    expect(body.slot).toMatchObject({ date: "12 August 2026", reportingTime: "7:30 AM", startTime: "8:00 AM" });
    expect(String(body.slot.batch)).toContain("Batch T");
    expect(body.checkedInAt).toBeNull();
    expect(body.assessmentSubmitted).toBe(false);
    expect(body.assessmentAt).toBeNull();
    expect(String(body.qrDataUrl)).toMatch(/^data:image\/png/);
  });

  it("checked-in: checkedInAt set, still not assessed", async () => {
    await db.insert(trialCheckinsTable).values({
      registrationId: regId, allocationId: allocId, venueId, slotId,
      staff: "vitest", device: "contract-test",
    });
    const { status, body } = await getPass(tokenB);
    expect(status).toBe(200);
    expect(body.checkedInAt).not.toBeNull();
    expect(body.assessmentSubmitted).toBe(false);
  });

  it("assessed: submitted evaluation flips assessmentSubmitted + assessmentAt", async () => {
    await db.insert(trialEvaluationsTable).values({
      registrationId: regId, allocationId: allocId, evaluatorEmail: "vitest@test.invalid",
      playerRole: "bat", rubricVersion: "contract-test", sections: { total: 72.5 },
      totalScore: "72.50", status: "submitted",
    });
    const { status, body } = await getPass(tokenB);
    expect(status).toBe(200);
    expect(body.assessmentSubmitted).toBe(true);
    expect(body.assessmentAt).not.toBeNull();
  });

  it("superseded evaluations do NOT count as assessed", async () => {
    await db.update(trialEvaluationsTable)
      .set({ status: "superseded" })
      .where(eq(trialEvaluationsTable.registrationId, regId));
    const { body } = await getPass(tokenB);
    expect(body.assessmentSubmitted).toBe(false);
    expect(body.assessmentAt).toBeNull();
  });
});
