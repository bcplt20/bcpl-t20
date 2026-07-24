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
 */
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { inArray } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { usersTable, registrationsTable, phase1VideosTable, kycRecordsTable } =
  await import("@workspace/db/schema");
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

async function actionFor(token: string) {
  const res = await request(app)
    .get("/api/user/next-action")
    .set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(200);
  return res.body.action as string;
}

afterAll(async () => {
  if (createdRegIds.length) {
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

  it("phase2=kyc_done (canonical KYC-approved status) → VIEW_TRIAL", async () => {
    const { token } = await mkReg("selected", "kyc_done");
    expect(await actionFor(token)).toBe("VIEW_TRIAL");
  });

  it("phase2=selected (journey complete) → MY_BCPL", async () => {
    const { token } = await mkReg("selected", "selected");
    expect(await actionFor(token)).toBe("MY_BCPL");
  });
});
