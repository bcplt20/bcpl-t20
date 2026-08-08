/**
 * Push-token CRUD + notification inbox (src/routes/growth.ts, src/lib/push.ts).
 *
 * PUSH_ENABLED is left OFF so notify() runs the dry-run path (no network): we
 * assert inbox rows are still written, dedupe holds, tokens register/upsert/
 * unregister, and the inbox read endpoints behave.
 */
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import request from "supertest";
import { inArray, eq } from "drizzle-orm";

process.env.PUSH_ENABLED = "0"; // force dry-run (no real Expo calls)

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { usersTable, pushTokensTable, notificationsInboxTable, notificationLogsTable } = await import("@workspace/db/schema");
const { signToken } = await import("../src/lib/auth");
const { ensurePushTables, notify } = await import("../src/lib/push");

const suffix = String(Date.now()).slice(-7);
const userIds: string[] = [];

async function mkUser() {
  const n = userIds.length + 1;
  const [u] = await db.insert(usersTable).values({
    name: `Push Test ${suffix}-${n}`,
    phone: `7${suffix}${String(n).padStart(2, "0")}`.slice(0, 12),
    email: `push-${suffix}-${n}@test.bcpl`,
    isVerified: true,
  }).returning();
  userIds.push(u.id);
  return { user: u, token: signToken({ userId: u.id, phone: u.phone }) };
}

beforeAll(async () => { await ensurePushTables(); });

afterAll(async () => {
  if (userIds.length) {
    await db.delete(notificationsInboxTable).where(inArray(notificationsInboxTable.userId, userIds));
    await db.delete(notificationLogsTable).where(inArray(notificationLogsTable.userId, userIds));
    await db.delete(pushTokensTable).where(inArray(pushTokensTable.userId, userIds));
    await db.delete(usersTable).where(inArray(usersTable.id, userIds));
  }
});

describe("push-token CRUD", () => {
  it("registers, upserts, and unregisters an Expo token", async () => {
    const { token } = await mkUser();
    const expo = `ExponentPushToken[${suffix}reg]`;

    const r1 = await request(app).post("/api/user/push-token")
      .set("Authorization", `Bearer ${token}`).send({ token: expo, platform: "android" });
    expect(r1.status).toBe(200);

    // Upsert (same token again, different platform) → still one row.
    const r2 = await request(app).post("/api/user/push-token")
      .set("Authorization", `Bearer ${token}`).send({ token: expo, platform: "ios" });
    expect(r2.status).toBe(200);

    const rows = await db.select().from(pushTokensTable).where(eq(pushTokensTable.expoToken, expo));
    expect(rows.length).toBe(1);
    expect(rows[0].platform).toBe("ios");

    const del = await request(app).delete("/api/user/push-token")
      .set("Authorization", `Bearer ${token}`).send({ token: expo });
    expect(del.status).toBe(200);
    const after = await db.select().from(pushTokensTable).where(eq(pushTokensTable.expoToken, expo));
    expect(after.length).toBe(0);
  });

  it("rejects a bad token and requires auth", async () => {
    const { token } = await mkUser();
    const bad = await request(app).post("/api/user/push-token")
      .set("Authorization", `Bearer ${token}`).send({ token: "x" });
    expect(bad.status).toBe(400);
    const noAuth = await request(app).post("/api/user/push-token").send({ token: "ExponentPushToken[y]" });
    expect(noAuth.status).toBe(401);
  });

  it("a device token re-points to the newest account (unique expo_token)", async () => {
    const a = await mkUser();
    const b = await mkUser();
    const shared = `ExponentPushToken[${suffix}shared]`;
    await request(app).post("/api/user/push-token").set("Authorization", `Bearer ${a.token}`).send({ token: shared });
    await request(app).post("/api/user/push-token").set("Authorization", `Bearer ${b.token}`).send({ token: shared });
    const rows = await db.select().from(pushTokensTable).where(eq(pushTokensTable.expoToken, shared));
    expect(rows.length).toBe(1);
    expect(rows[0].userId).toBe(b.user.id);
  });
});

describe("notification inbox + notify() dry-run dedupe", () => {
  it("writes an inbox row on notify (even with push off) and dedupes by key", async () => {
    const { user, token } = await mkUser();
    const key = `test_event_${suffix}_${user.id}`;

    const first = await notify({ userId: user.id, type: "kyc_approved", title: "T1", body: "B1", dedupeKey: key });
    expect(first.inboxWritten).toBe(true);
    expect(first.push?.dryRun).toBe(true); // PUSH_ENABLED=0 → dry run

    // Same key again → NOT written (idempotent).
    const second = await notify({ userId: user.id, type: "kyc_approved", title: "T1", body: "B1", dedupeKey: key });
    expect(second.inboxWritten).toBe(false);

    const list = await request(app).get("/api/user/notifications").set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    const mine = list.body.notifications.filter((x: { title: string }) => x.title === "T1");
    expect(mine.length).toBe(1);
    expect(list.body.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it("marks notifications read (all + by id)", async () => {
    const { user, token } = await mkUser();
    await notify({ userId: user.id, type: "phase2_paid", title: "R1", body: "b", dedupeKey: `r1_${suffix}_${user.id}` });
    await notify({ userId: user.id, type: "phase2_paid", title: "R2", body: "b", dedupeKey: `r2_${suffix}_${user.id}` });

    const before = await request(app).get("/api/user/notifications").set("Authorization", `Bearer ${token}`);
    expect(before.body.unreadCount).toBe(2);
    const firstId = before.body.notifications[0].id;

    const readOne = await request(app).post("/api/user/notifications/read")
      .set("Authorization", `Bearer ${token}`).send({ ids: [firstId] });
    expect(readOne.status).toBe(200);
    const mid = await request(app).get("/api/user/notifications").set("Authorization", `Bearer ${token}`);
    expect(mid.body.unreadCount).toBe(1);

    const readAll = await request(app).post("/api/user/notifications/read")
      .set("Authorization", `Bearer ${token}`).send({});
    expect(readAll.status).toBe(200);
    const after = await request(app).get("/api/user/notifications").set("Authorization", `Bearer ${token}`);
    expect(after.body.unreadCount).toBe(0);
  });

  it("inbox is scoped per-user", async () => {
    const a = await mkUser();
    const b = await mkUser();
    await notify({ userId: a.user.id, type: "test", title: "OnlyForA", body: "x", dedupeKey: `onlyA_${suffix}` });
    const listB = await request(app).get("/api/user/notifications").set("Authorization", `Bearer ${b.token}`);
    expect(listB.body.notifications.some((x: { title: string }) => x.title === "OnlyForA")).toBe(false);
  });
});
