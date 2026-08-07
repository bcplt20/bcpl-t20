/**
 * Fan Voting (polls) — src/routes/polls.ts, mounted at /api/polls (public) and
 * /api/admin/polls (admin CONTENT_TEAM). Covers admin CRUD + open/close, public
 * listing with result-visibility gating, ANONYMOUS device-based voting (one vote
 * per device/user per poll → 409), missing-deviceId rejection, per-IP soft cap,
 * window/status enforcement, results, no-PII, and role gating.
 */
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { usersTable } = await import("@workspace/db/schema");
const { signAdminToken } = await import("../src/routes/adminUsers");
const { __resetVoteRateLimit } = await import("../src/routes/polls");

const JWT_SECRET = process.env.JWT_SECRET || "bcpl-dev-secret-CHANGE-IN-PROD";
const suffix = String(Date.now()).slice(-7);

const contentToken = signAdminToken({ email: `poll-content-${suffix}@t.bcpl`, name: "Content", role: "CONTENT_TEAM" });
const financeToken = signAdminToken({ email: `poll-finance-${suffix}@t.bcpl`, name: "Finance", role: "FINANCE_TEAM" });
const adminHdr = (t: string) => ({ "x-bcpl-admin-token": t });

let seq = 0;
async function makeVoter() {
  const phone = "9" + String(Date.now()).slice(-8) + String(seq++ % 100).padStart(2, "0");
  const [{ id }] = await db.insert(usersTable).values({
    name: "Voter", phone, email: `voter-${randomUUID()}@test.bcpl`, isVerified: true,
  }).returning({ id: usersTable.id });
  return { token: jwt.sign({ userId: id, phone }, JWT_SECRET), userId: id };
}
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const newDevice = () => randomUUID();
// distinct source IP per call so per-IP cap tests don't collide across cases
const fromIp = (ip: string) => ({ "x-forwarded-for": ip });

function uslug(base: string) { return `${base}-${suffix}-${seq++}`; }

beforeAll(() => { __resetVoteRateLimit(); });

describe("fan polls — admin CRUD + role gate", () => {
  it("non-content admin is blocked; content admin can create", async () => {
    const blocked = await request(app).post("/api/admin/polls").set(adminHdr(financeToken))
      .send({ slug: uslug("blk"), titleEn: "X" });
    expect(blocked.status).toBe(403);

    const r = await request(app).post("/api/admin/polls").set(adminHdr(contentToken)).send({
      slug: uslug("mos"), titleEn: "Man of the Series", titleHi: "सीरीज़ का हीरो",
      category: "man_of_series", status: "open", showLiveResults: true,
      options: [
        { label: "Player One", teamName: "Alpha" },
        { label: "Player Two", teamName: "Bravo" },
      ],
    });
    expect(r.status).toBe(200);
    expect(r.body.poll.slug).toContain("mos");
    expect(r.body.options.length).toBe(2);
  });

  it("duplicate slug rejected", async () => {
    const slug = uslug("dup");
    await request(app).post("/api/admin/polls").set(adminHdr(contentToken)).send({ slug, titleEn: "A" });
    const dup = await request(app).post("/api/admin/polls").set(adminHdr(contentToken)).send({ slug, titleEn: "B" });
    expect(dup.status).toBe(400);
  });

  it("add/patch/delete option and patch/delete poll", async () => {
    const create = await request(app).post("/api/admin/polls").set(adminHdr(contentToken))
      .send({ slug: uslug("edit"), titleEn: "Edit me" });
    const pollId = create.body.poll.id;

    const addOpt = await request(app).post(`/api/admin/polls/${pollId}/options`).set(adminHdr(contentToken))
      .send({ label: "Opt A", teamName: "Alpha" });
    expect(addOpt.status).toBe(200);
    const optId = addOpt.body.option.id;

    const patchOpt = await request(app).patch(`/api/admin/polls/${pollId}/options/${optId}`).set(adminHdr(contentToken))
      .send({ label: "Opt A (edited)" });
    expect(patchOpt.status).toBe(200);
    expect(patchOpt.body.option.label).toBe("Opt A (edited)");

    const patchPoll = await request(app).patch(`/api/admin/polls/${pollId}`).set(adminHdr(contentToken))
      .send({ status: "open", titleEn: "Edited Title" });
    expect(patchPoll.status).toBe(200);
    expect(patchPoll.body.poll.status).toBe("open");

    const delOpt = await request(app).delete(`/api/admin/polls/${pollId}/options/${optId}`).set(adminHdr(contentToken));
    expect(delOpt.status).toBe(200);

    const delPoll = await request(app).delete(`/api/admin/polls/${pollId}`).set(adminHdr(contentToken));
    expect(delPoll.status).toBe(200);

    const gone = await request(app).get(`/api/admin/polls/${pollId}`).set(adminHdr(contentToken));
    expect(gone.status).toBe(404);
  });
});

describe("fan polls — public listing + result visibility", () => {
  async function openPollWithOptions(showLive: boolean) {
    const r = await request(app).post("/api/admin/polls").set(adminHdr(contentToken)).send({
      slug: uslug("pub"), titleEn: "Public Poll", status: "open", showLiveResults: showLive,
      options: [{ label: "One", teamName: "A" }, { label: "Two", teamName: "B" }],
    });
    return { pollId: r.body.poll.id, slug: r.body.poll.slug, optionId: r.body.options[0].id };
  }

  it("draft polls are not public; open polls are", async () => {
    const draft = await request(app).post("/api/admin/polls").set(adminHdr(contentToken))
      .send({ slug: uslug("draft"), titleEn: "Draft", status: "draft" });
    const bySlug = await request(app).get(`/api/polls/${draft.body.poll.slug}`);
    expect(bySlug.status).toBe(404);
  });

  it("showLiveResults=false hides counts until closed", async () => {
    const { slug } = await openPollWithOptions(false);
    const open = await request(app).get(`/api/polls/${slug}`);
    expect(open.status).toBe(200);
    expect(open.body.poll.totalVotes).toBeNull();
    expect(open.body.poll.options[0]).not.toHaveProperty("votes");
  });

  it("showLiveResults=true exposes counts + percent", async () => {
    const { slug } = await openPollWithOptions(true);
    const open = await request(app).get(`/api/polls/${slug}`);
    expect(open.body.poll.totalVotes).toBe(0);
    expect(open.body.poll.options[0]).toHaveProperty("votes");
    expect(open.body.poll.options[0]).toHaveProperty("percent");
  });
});

describe("fan polls — voting", () => {
  async function freshOpenPoll(showLive = true) {
    const r = await request(app).post("/api/admin/polls").set(adminHdr(contentToken)).send({
      slug: uslug("vote"), titleEn: "Vote Poll", status: "open", showLiveResults: showLive,
      options: [{ label: "One", teamName: "A" }, { label: "Two", teamName: "B" }],
    });
    return { pollId: r.body.poll.id, optionId: r.body.options[0].id, optionId2: r.body.options[1].id };
  }

  it("anonymous vote works WITHOUT auth when a deviceId is supplied", async () => {
    __resetVoteRateLimit();
    const { pollId, optionId } = await freshOpenPoll();
    const r = await request(app).post(`/api/polls/${pollId}/vote`).set(fromIp("11.0.0.1"))
      .send({ optionId, deviceId: newDevice() });
    expect(r.status).toBe(200);
    expect(r.body.totalVotes).toBe(1);
  });

  it("guest with no auth AND no deviceId → 400", async () => {
    __resetVoteRateLimit();
    const { pollId, optionId } = await freshOpenPoll();
    const r = await request(app).post(`/api/polls/${pollId}/vote`).set(fromIp("11.0.0.2")).send({ optionId });
    expect(r.status).toBe(400);
  });

  it("deviceId must be a uuid", async () => {
    __resetVoteRateLimit();
    const { pollId, optionId } = await freshOpenPoll();
    const r = await request(app).post(`/api/polls/${pollId}/vote`).set(fromIp("11.0.0.3"))
      .send({ optionId, deviceId: "not-a-uuid" });
    expect(r.status).toBe(400);
  });

  it("one vote per device; duplicate deviceId → 409, no voter PII", async () => {
    __resetVoteRateLimit();
    const { pollId, optionId } = await freshOpenPoll();
    const device = newDevice();

    const v1 = await request(app).post(`/api/polls/${pollId}/vote`).set(fromIp("11.0.1.1"))
      .send({ optionId, deviceId: device });
    expect(v1.status).toBe(200);
    expect(v1.body.totalVotes).toBe(1);
    // no PII: neither the deviceId nor any ip should surface in the response
    expect(JSON.stringify(v1.body)).not.toContain(device);
    expect(JSON.stringify(v1.body)).not.toContain("11.0.1.1");

    const v2 = await request(app).post(`/api/polls/${pollId}/vote`).set(fromIp("11.0.1.2"))
      .send({ optionId, deviceId: device });
    expect(v2.status).toBe(409);
  });

  it("authed player: one vote per user; duplicate → 409 (token preferred over device)", async () => {
    __resetVoteRateLimit();
    const { pollId, optionId } = await freshOpenPoll();
    const voter = await makeVoter();

    const v1 = await request(app).post(`/api/polls/${pollId}/vote`).set(auth(voter.token)).set(fromIp("11.0.2.1"))
      .send({ optionId, deviceId: newDevice() });
    expect(v1.status).toBe(200);
    expect(JSON.stringify(v1.body)).not.toContain(voter.userId);

    // same user, DIFFERENT device → still deduped by user:<id>
    const v2 = await request(app).post(`/api/polls/${pollId}/vote`).set(auth(voter.token)).set(fromIp("11.0.2.2"))
      .send({ optionId, deviceId: newDevice() });
    expect(v2.status).toBe(409);
  });

  it("soft per-IP-per-poll cap → 429 once exceeded", async () => {
    __resetVoteRateLimit();
    const { pollId, optionId } = await freshOpenPoll();
    const ip = "11.9.9.9";
    let capped = false;
    // 20 distinct devices from one IP are allowed; the 21st is capped.
    for (let i = 0; i < 21; i++) {
      __resetVoteRateLimit(); // isolate from the short-window spam guard
      const r = await request(app).post(`/api/polls/${pollId}/vote`).set(fromIp(ip))
        .send({ optionId, deviceId: newDevice() });
      if (r.status === 429) { capped = true; break; }
      expect(r.status).toBe(200);
    }
    expect(capped).toBe(true);
  });

  it("rejects an option that belongs to another poll", async () => {
    __resetVoteRateLimit();
    const a = await freshOpenPoll();
    const b = await freshOpenPoll();
    const r = await request(app).post(`/api/polls/${a.pollId}/vote`).set(fromIp("11.3.0.1"))
      .send({ optionId: b.optionId, deviceId: newDevice() });
    expect(r.status).toBe(400);
  });

  it("cannot vote on a draft/closed poll", async () => {
    __resetVoteRateLimit();
    const { pollId, optionId } = await freshOpenPoll();
    await request(app).patch(`/api/admin/polls/${pollId}`).set(adminHdr(contentToken)).send({ status: "closed" });
    const r = await request(app).post(`/api/polls/${pollId}/vote`).set(fromIp("11.4.0.1"))
      .send({ optionId, deviceId: newDevice() });
    expect(r.status).toBe(400);
  });

  it("cannot vote outside opensAt/closesAt window", async () => {
    __resetVoteRateLimit();
    // open now but closesAt already in the past
    const past = new Date(Date.now() - 60_000).toISOString();
    const r = await request(app).post("/api/admin/polls").set(adminHdr(contentToken)).send({
      slug: uslug("window"), titleEn: "Windowed", status: "open", closesAt: past,
      options: [{ label: "One" }],
    });
    const v = await request(app).post(`/api/polls/${r.body.poll.id}/vote`).set(fromIp("11.5.0.1"))
      .send({ optionId: r.body.options[0].id, deviceId: newDevice() });
    expect(v.status).toBe(400);
  });

  it("admin results show counts + percentages + total (mixed authed + anon)", async () => {
    __resetVoteRateLimit();
    const { pollId, optionId, optionId2 } = await freshOpenPoll();
    const v1 = await makeVoter();
    await request(app).post(`/api/polls/${pollId}/vote`).set(auth(v1.token)).set(fromIp("11.6.0.1"))
      .send({ optionId, deviceId: newDevice() });
    await request(app).post(`/api/polls/${pollId}/vote`).set(fromIp("11.6.0.2"))
      .send({ optionId, deviceId: newDevice() });
    await request(app).post(`/api/polls/${pollId}/vote`).set(fromIp("11.6.0.3"))
      .send({ optionId: optionId2, deviceId: newDevice() });

    const res = await request(app).get(`/api/admin/polls/${pollId}/results`).set(adminHdr(contentToken));
    expect(res.status).toBe(200);
    expect(res.body.totalVotes).toBe(3);
    const first = res.body.results.find((r: { optionId: string }) => r.optionId === optionId);
    expect(first.votes).toBe(2);
    expect(first.percent).toBeCloseTo(66.7, 1);
    // no voter ids anywhere in the results payload
    expect(JSON.stringify(res.body)).not.toContain(v1.userId);
  });
});
