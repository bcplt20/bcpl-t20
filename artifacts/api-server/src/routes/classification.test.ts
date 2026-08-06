/**
 * Player classification (playing style) — POST validation matrix + the
 * skill-video upload gate.
 *
 * Runs against the real dev DB with throwaway rows (impossible phone), cleaned
 * up in afterAll. Mints player JWTs directly (signToken) — never OTP-login.
 * No S3 creds in CI → getUploadPresignedUrl returns a stub URL, so the 200 path
 * for the upload gate is exercised without touching AWS.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import crypto from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { db } from "@workspace/db";
import { usersTable, registrationsTable, phase1VideosTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth";
import userRouter, { ensureRegistrationClassificationColumn } from "./user";
import videoRouter from "./video";

const suffix = crypto.randomBytes(5).toString("hex");
const rand9 = String(crypto.randomInt(100_000_000, 999_999_999));

type Ctx = { userId: string; regId: string; token: string; phone: string };

let server: Server;
let base = "";
const created: string[] = []; // user ids to clean up

async function makePlayer(role: string, n: number): Promise<Ctx> {
  const phone = `0000${rand9}${n}`;
  const [u] = await db.insert(usersTable).values({
    name: `Classify ${role} ${n}`, phone, email: `classify-${role}-${n}-${suffix}@test.invalid`, isVerified: true,
  }).returning();
  const [reg] = await db.insert(registrationsTable).values({
    userId: u.id, regNumber: `C-${suffix}-${n}`, role, trialCity: "Delhi", phase1Status: "payment_done",
    videoDeadline: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  }).returning();
  created.push(u.id);
  return { userId: u.id, regId: reg.id, token: signToken({ userId: u.id, phone }), phone };
}

async function postClassification(token: string, body: unknown) {
  const res = await fetch(`${base}/api/user/classification`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as any };
}

async function uploadUrl(token: string, registrationId: string) {
  const res = await fetch(`${base}/api/video/upload-url`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ registrationId, contentType: "video/mp4", sizeBytes: 1024 }),
  });
  return { status: res.status, body: (await res.json()) as any };
}

let bat: Ctx, bowl: Ctx, wk: Ctx, ar: Ctx;

beforeAll(async () => {
  await ensureRegistrationClassificationColumn();
  const app = express();
  app.use(express.json());
  app.use("/api/user", userRouter);
  app.use("/api/video", videoRouter);
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  bat = await makePlayer("bat", 1);
  bowl = await makePlayer("bowl", 2);
  wk = await makePlayer("wk", 3);
  ar = await makePlayer("ar", 4);
});

afterAll(async () => {
  for (const id of created) {
    const regs = await db.select({ id: registrationsTable.id }).from(registrationsTable).where(eq(registrationsTable.userId, id));
    for (const r of regs) await db.delete(phase1VideosTable).where(eq(phase1VideosTable.registrationId, r.id));
    await db.delete(registrationsTable).where(eq(registrationsTable.userId, id));
    await db.delete(usersTable).where(eq(usersTable.id, id));
  }
  server?.close();
});

describe("POST /api/user/classification — validation matrix", () => {
  it("bat: valid batting classification saves", async () => {
    const r = await postClassification(bat.token, { battingHand: "right", battingPosition: "opener" });
    expect(r.status).toBe(200);
    expect(r.body.complete).toBe(true);
    expect(r.body.classification.battingHand).toBe("right");
  });

  it("bat: missing required batting position is rejected", async () => {
    const r = await postClassification(bat.token, { battingHand: "left" });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe("INVALID_CLASSIFICATION");
  });

  it("bat: bowling fields do not apply", async () => {
    const r = await postClassification(bat.token, { battingHand: "right", battingPosition: "finisher", bowlingArm: "right", bowlingType: "off_spin" });
    expect(r.status).toBe(400);
  });

  it("bowl: valid right-arm off_spin saves", async () => {
    const r = await postClassification(bowl.token, { bowlingArm: "right", bowlingType: "off_spin" });
    expect(r.status).toBe(200);
    expect(r.body.complete).toBe(true);
  });

  it("bowl: wrong-arm bowling type (leg_spin on left arm) is rejected", async () => {
    const r = await postClassification(bowl.token, { bowlingArm: "left", bowlingType: "leg_spin" });
    expect(r.status).toBe(400);
  });

  it("bowl: left-arm wrist_spin (chinaman) is valid", async () => {
    const r = await postClassification(bowl.token, { bowlingArm: "left", bowlingType: "wrist_spin" });
    expect(r.status).toBe(200);
  });

  it("bowl: missing bowling type is rejected", async () => {
    const r = await postClassification(bowl.token, { bowlingArm: "right" });
    expect(r.status).toBe(400);
  });

  it("wk: batting required, optional battingStyle accepted", async () => {
    const r = await postClassification(wk.token, { battingHand: "right", battingPosition: "middle_order", battingStyle: "anchor" });
    expect(r.status).toBe(200);
    expect(r.body.classification.battingStyle).toBe("anchor");
  });

  it("wk: valid without optional battingStyle", async () => {
    const r = await postClassification(wk.token, { battingHand: "left", battingPosition: "top_order" });
    expect(r.status).toBe(200);
  });

  it("ar: requires BOTH batting and bowling", async () => {
    const missing = await postClassification(ar.token, { battingHand: "right", battingPosition: "top_order" });
    expect(missing.status).toBe(400);
    const full = await postClassification(ar.token, {
      battingHand: "right", battingPosition: "top_order", bowlingArm: "right", bowlingType: "medium_fast",
    });
    expect(full.status).toBe(200);
    expect(full.body.complete).toBe(true);
  });
});

describe("skill-video upload gate", () => {
  it("403 CLASSIFICATION_REQUIRED before a valid classification exists", async () => {
    const p = await makePlayer("bat", 5);
    const r = await uploadUrl(p.token, p.regId);
    expect(r.status).toBe(403);
    expect(r.body.code).toBe("CLASSIFICATION_REQUIRED");
  });

  it("allows the presign once a valid classification is saved", async () => {
    const p = await makePlayer("bat", 6);
    const gated = await uploadUrl(p.token, p.regId);
    expect(gated.status).toBe(403);

    const saved = await postClassification(p.token, { battingHand: "right", battingPosition: "opener" });
    expect(saved.status).toBe(200);

    const ok = await uploadUrl(p.token, p.regId);
    expect(ok.status).toBe(200);
    expect(ok.body.success).toBe(true);
    expect(typeof ok.body.presignedUrl).toBe("string");
  });
});
