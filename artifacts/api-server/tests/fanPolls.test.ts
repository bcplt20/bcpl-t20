/**
 * Fan Voting (polls) — src/routes/polls.ts, mounted at /api/polls (public) and
 * /api/admin/polls (admin CONTENT_TEAM). Covers admin CRUD + open/close, public
 * listing with result-visibility gating, one-vote-per-user (409), window/status
 * enforcement, results, no-PII, and role gating.
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

  it("requires auth", async () => {
    const { pollId, optionId } = await freshOpenPoll();
    const r = await request(app).post(`/api/polls/${pollId}/vote`).send({ optionId });
    expect(r.status).toBe(401);
  });

  it("one vote per user; duplicate → 409, counts update, no voter PII", async () => {
    __resetVoteRateLimit();
    const { pollId, optionId } = await freshOpenPoll();
    const voter = await makeVoter();

    const v1 = await request(app).post(`/api/polls/${pollId}/vote`).set(auth(voter.token)).send({ optionId });
    expect(v1.status).toBe(200);
    expect(v1.body.totalVotes).toBe(1);
    // no PII: response must not contain the voter's id
    expect(JSON.stringify(v1.body)).not.toContain(voter.userId);

    const v2 = await request(app).post(`/api/polls/${pollId}/vote`).set(auth(voter.token)).send({ optionId });
    expect(v2.status).toBe(409);
  });

  it("rejects an option that belongs to another poll", async () => {
    __resetVoteRateLimit();
    const a = await freshOpenPoll();
    const b = await freshOpenPoll();
    const voter = await makeVoter();
    const r = await request(app).post(`/api/polls/${a.pollId}/vote`).set(auth(voter.token))
      .send({ optionId: b.optionId });
    expect(r.status).toBe(400);
  });

  it("cannot vote on a draft/closed poll", async () => {
    __resetVoteRateLimit();
    const { pollId, optionId } = await freshOpenPoll();
    await request(app).patch(`/api/admin/polls/${pollId}`).set(adminHdr(contentToken)).send({ status: "closed" });
    const voter = await makeVoter();
    const r = await request(app).post(`/api/polls/${pollId}/vote`).set(auth(voter.token)).send({ optionId });
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
    const voter = await makeVoter();
    const v = await request(app).post(`/api/polls/${r.body.poll.id}/vote`).set(auth(voter.token))
      .send({ optionId: r.body.options[0].id });
    expect(v.status).toBe(400);
  });

  it("admin results show counts + percentages + total", async () => {
    __resetVoteRateLimit();
    const { pollId, optionId, optionId2 } = await freshOpenPoll();
    const v1 = await makeVoter(), v2 = await makeVoter(), v3 = await makeVoter();
    await request(app).post(`/api/polls/${pollId}/vote`).set(auth(v1.token)).send({ optionId });
    await request(app).post(`/api/polls/${pollId}/vote`).set(auth(v2.token)).send({ optionId });
    await request(app).post(`/api/polls/${pollId}/vote`).set(auth(v3.token)).send({ optionId: optionId2 });

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
