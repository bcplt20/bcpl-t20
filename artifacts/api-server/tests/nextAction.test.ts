/**
 * /api/user/next-action journey matrix + /api/fees contract.
 *
 * Locks the status→CTA mapping to the CANONICAL status vocabulary
 * (phase1: pending → payment_done → video_submitted → selected|rejected;
 *  phase2: pending → payment_done → kyc_done → selected|rejected;
 *  kyc_records.status: pending|verified|failed). A regression here means
 * logged-in players see the wrong (or no) call-to-action in the header.
 * Also pins /api/fees values so fee copy on the website can never drift
 * from what the server charges.
 *
 * Final-finishing spec §17/§43/§44/§46: the trial layer (allocation →
 * check-in → locked assessment) extends the matrix, and the contradiction
 * guards assert that impossible state combinations can never surface.
 */
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { inArray } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const {
  usersTable, registrationsTable, phase1VideosTable, kycRecordsTable,
  trialAllocationsTable, trialCheckinsTable, trialEvaluationsTable,
} = await import("@workspace/db/schema");
const { signToken } = await import("../src/lib/auth");

const suffix = String(Date.now()).slice(-7); // unique per run
const createdUserIds: string[] = [];
const createdRegIds: string[] = [];

let seq = 0;
async function mkUser() {
  const n = ++seq;
  const [user] = await db.insert(usersTable).values({
    name: `NextAction Test ${suffix}-${n}`,
    phone: `8${suffix}${String(n).padStart(2, "0")}`.slice(0, 12),
    email: `nextaction-${suffix}-${n}@test.bcpl`,
    isVerified: true,
  }).returning();
  createdUserIds.push(user.id);
  return user;
}

async function mkReg(phase1Status: string, phase2Status?: string) {
  const user = await mkUser();
  const [reg] = await db.insert(registrationsTable).values({
    userId: user.id,
    role: "bat",
    trialCity: "NextActionCity" + suffix,
    phase1Status,
    ...(phase2Status !== undefined ? { phase2Status } : {}),
  }).returning();
  createdRegIds.push(reg.id);
  return { user, reg, token: signToken({ userId: user.id, phone: user.phone }) };
}

/** kyc_done player + an active trial allocation (venue/slot ids are opaque —
 *  no FK constraints on the runtime-ensured trial tables). */
async function mkAllocated(opts?: { allocStatus?: string }) {
  const made = await mkReg("selected", "kyc_done");
  const [alloc] = await db.insert(trialAllocationsTable).values({
    registrationId: made.reg.id,
    slotId: crypto.randomUUID(),
    venueId: crypto.randomUUID(),
    city: "NextActionCity" + suffix,
    passToken: crypto.randomBytes(24).toString("hex"),
    ...(opts?.allocStatus ? { status: opts.allocStatus } : {}),
  }).returning();
  return { ...made, alloc };
}

async function checkIn(alloc: { id: string; registrationId: string; slotId: string; venueId: string }) {
  await db.insert(trialCheckinsTable).values({
    allocationId: alloc.id,
    registrationId: alloc.registrationId,
    slotId: alloc.slotId,
    venueId: alloc.venueId,
  });
}

async function submitEval(regId: string, allocId: string, status = "submitted") {
  await db.insert(trialEvaluationsTable).values({
    registrationId: regId,
    allocationId: allocId,
    evaluatorEmail: "coach@test.bcpl",
    evaluatorName: "Test Coach",
    playerRole: "bat",
    rubricVersion: "test-v1",
    sections: { objective: {}, technical: {}, total: 72.5 },
    totalScore: "72.50",
    status,
  });
}

async function actionFor(token: string) {
  const res = await request(app)
    .get("/api/user/next-action")
    .set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(200);
  return res.body.action as string;
}

async function dashboardFor(token: string) {
  const res = await request(app)
    .get("/api/user/dashboard")
    .set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(200);
  return res.body as { trial: null | { allocated: boolean; checkedInAt: string | null; assessmentSubmitted: boolean; venue: unknown; slot: unknown } };
}

afterAll(async () => {
  if (createdRegIds.length) {
    await db.delete(trialEvaluationsTable).where(inArray(trialEvaluationsTable.registrationId, createdRegIds));
    await db.delete(trialCheckinsTable).where(inArray(trialCheckinsTable.registrationId, createdRegIds));
    await db.delete(trialAllocationsTable).where(inArray(trialAllocationsTable.registrationId, createdRegIds));
    await db.delete(kycRecordsTable).where(inArray(kycRecordsTable.registrationId, createdRegIds));
    await db.delete(phase1VideosTable).where(inArray(phase1VideosTable.registrationId, createdRegIds));
    await db.delete(registrationsTable).where(inArray(registrationsTable.id, createdRegIds));
  }
  if (createdUserIds.length) {
    await db.delete(usersTable).where(inArray(usersTable.id, createdUserIds));
  }
});

describe("GET /api/fees — public fee config", () => {
  it("serves the canonical fees + GST rate without auth", async () => {
    const res = await request(app).get("/api/fees");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      phase1: { bat: 299, bowl: 299, wk: 299, ar: 399 },
      phase2: { bat: 2000, bowl: 2000, wk: 2000, ar: 3000 },
      gstRate: 0.18,
    });
  });
});

describe("GET /api/user/next-action — journey matrix", () => {
  it("no token → 401", async () => {
    const res = await request(app).get("/api/user/next-action");
    expect(res.status).toBe(401);
  });

  it("no registration → REGISTER", async () => {
    const user = await mkUser();
    const token = signToken({ userId: user.id, phone: user.phone });
    expect(await actionFor(token)).toBe("REGISTER");
  });

  it("phase1=pending → COMPLETE_PAYMENT", async () => {
    const { token } = await mkReg("pending");
    expect(await actionFor(token)).toBe("COMPLETE_PAYMENT");
  });

  it("phase1=payment_done, no video → UPLOAD_VIDEO", async () => {
    const { token } = await mkReg("payment_done");
    expect(await actionFor(token)).toBe("UPLOAD_VIDEO");
  });

  it("phase1=payment_done with video row (mid-transition) → WAIT_FOR_RESULT", async () => {
    const { reg, token } = await mkReg("payment_done");
    await db.insert(phase1VideosTable).values({ registrationId: reg.id });
    expect(await actionFor(token)).toBe("WAIT_FOR_RESULT");
  });

  it("phase1=video_submitted (canonical uploaded status) → WAIT_FOR_RESULT", async () => {
    const { token } = await mkReg("video_submitted");
    expect(await actionFor(token)).toBe("WAIT_FOR_RESULT");
  });

  it("phase1=rejected → VIEW_RESULT", async () => {
    const { token } = await mkReg("rejected");
    expect(await actionFor(token)).toBe("VIEW_RESULT");
  });

  it("phase1=selected, no phase2 → CONTINUE_PHASE2", async () => {
    const { token } = await mkReg("selected");
    expect(await actionFor(token)).toBe("CONTINUE_PHASE2");
  });

  it("phase1=selected, phase2=pending → CONTINUE_PHASE2", async () => {
    const { token } = await mkReg("selected", "pending");
    expect(await actionFor(token)).toBe("CONTINUE_PHASE2");
  });

  it("phase2=payment_done, no KYC → COMPLETE_KYC", async () => {
    const { token } = await mkReg("selected", "payment_done");
    expect(await actionFor(token)).toBe("COMPLETE_KYC");
  });

  it("phase2=payment_done, KYC failed → COMPLETE_KYC (resubmit)", async () => {
    const { reg, token } = await mkReg("selected", "payment_done");
    await db.insert(kycRecordsTable).values({ registrationId: reg.id, status: "failed" });
    expect(await actionFor(token)).toBe("COMPLETE_KYC");
  });

  it("phase2=payment_done, KYC pending → MY_BCPL (nothing actionable)", async () => {
    const { reg, token } = await mkReg("selected", "payment_done");
    await db.insert(kycRecordsTable).values({ registrationId: reg.id, status: "pending" });
    expect(await actionFor(token)).toBe("MY_BCPL");
  });

  it("phase2=kyc_done, no allocation → VIEW_TRIAL (venue-pending details)", async () => {
    const { token } = await mkReg("selected", "kyc_done");
    expect(await actionFor(token)).toBe("VIEW_TRIAL");
  });

  it("phase2=selected (journey complete) → MY_BCPL", async () => {
    const { token } = await mkReg("selected", "selected");
    expect(await actionFor(token)).toBe("MY_BCPL");
  });
});

describe("GET /api/user/next-action — trial layer (§17/§43)", () => {
  it("kyc_done + active allocation → VIEW_TRIAL_PASS (never venue-pending)", async () => {
    const { token } = await mkAllocated();
    expect(await actionFor(token)).toBe("VIEW_TRIAL_PASS");
  });

  it("kyc_done + CANCELLED allocation → VIEW_TRIAL (only active passes count)", async () => {
    const { token } = await mkAllocated({ allocStatus: "cancelled" });
    expect(await actionFor(token)).toBe("VIEW_TRIAL");
  });

  it("checked-in but not yet assessed → still VIEW_TRIAL_PASS", async () => {
    const { alloc, token } = await mkAllocated();
    await checkIn(alloc);
    expect(await actionFor(token)).toBe("VIEW_TRIAL_PASS");
  });

  it("assessment submitted → MY_BCPL (profile shows the completed panel)", async () => {
    const { reg, alloc, token } = await mkAllocated();
    await checkIn(alloc);
    await submitEval(reg.id, alloc.id);
    expect(await actionFor(token)).toBe("MY_BCPL");
  });

  it("SUPERSEDED evaluation alone (§46 contradiction) → still VIEW_TRIAL_PASS", async () => {
    const { reg, alloc, token } = await mkAllocated();
    await submitEval(reg.id, alloc.id, "superseded");
    expect(await actionFor(token)).toBe("VIEW_TRIAL_PASS");
  });
});

describe("GET /api/user/dashboard — trial block single source of truth (§17/§44)", () => {
  it("kyc_done, no allocation → trial: null (dashboard shows venue-pending)", async () => {
    const { token } = await mkReg("selected", "kyc_done");
    const body = await dashboardFor(token);
    expect(body.trial).toBeNull();
  });

  it("pre-KYC journey (§46 contradiction guard) → trial: null even if stray rows exist", async () => {
    const { reg, token } = await mkReg("payment_done");
    // Contradictory combo: an allocation somehow exists while phase2 never reached kyc_done.
    await db.insert(trialAllocationsTable).values({
      registrationId: reg.id, slotId: crypto.randomUUID(), venueId: crypto.randomUUID(),
      city: "NextActionCity" + suffix, passToken: crypto.randomBytes(24).toString("hex"),
    });
    const body = await dashboardFor(token);
    expect(body.trial).toBeNull(); // journey stage wins — impossible combo never surfaces
  });

  it("allocated → trial.allocated=true, not checked in, not assessed", async () => {
    const { token } = await mkAllocated();
    const body = await dashboardFor(token);
    expect(body.trial).toMatchObject({ allocated: true, checkedInAt: null, assessmentSubmitted: false });
  });

  it("checked-in + assessment locked → checkedInAt set AND assessmentSubmitted true", async () => {
    const { reg, alloc, token } = await mkAllocated();
    await checkIn(alloc);
    await submitEval(reg.id, alloc.id);
    const body = await dashboardFor(token);
    expect(body.trial?.allocated).toBe(true);
    expect(body.trial?.checkedInAt).toBeTruthy();
    expect(body.trial?.assessmentSubmitted).toBe(true);
  });

  it("assessment WITHOUT check-in (§46 contradiction) → both facts reported as-is, never invented", async () => {
    const { reg, alloc, token } = await mkAllocated();
    await submitEval(reg.id, alloc.id);
    const body = await dashboardFor(token);
    // The dashboard reports REAL rows: assessed yes, checked-in null — the
    // client must render assessment state, not fabricate a check-in.
    expect(body.trial?.assessmentSubmitted).toBe(true);
    expect(body.trial?.checkedInAt).toBeNull();
  });
});
