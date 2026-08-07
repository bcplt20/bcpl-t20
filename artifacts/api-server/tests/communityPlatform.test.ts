/**
 * Community cricket platform — Phase 1 (profiles, teams, roster-linked stats).
 *
 * Route: src/routes/community.ts, mounted at /api/community.
 *
 * Auth: we mint player JWTs directly with the same secret the server uses,
 * exactly like communityScorer.test.ts. BUT profiles/team-members carry an FK
 * to the real `users` table, so every test creates a genuine users row (fresh
 * random phone/email) and mints its token from that user's id. Parallel-safe:
 * every user/phone is unique per test; assertions only inspect rows created in
 * that test. No table truncation — the community engine auto-creates its tables.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { usersTable } = await import("@workspace/db/schema");
const { eq } = await import("drizzle-orm");

const SECRET = process.env.JWT_SECRET || "bcpl-dev-secret-CHANGE-IN-PROD";

let seq = 0;
function freshPhone(): string {
  // 12-13 digits, unique per call across parallel runs.
  return "9" + String(Date.now()).slice(-8) + String(process.pid % 100).padStart(2, "0") + String(seq++ % 10);
}

/** Create a genuine users row and mint its player JWT. */
async function makeUser(): Promise<{ token: string; userId: string; phone: string }> {
  const phone = freshPhone();
  const [{ id: userId }] = await db.insert(usersTable)
    .values({
      name: "Platform Test",
      phone,
      email: `plat-${randomUUID()}@test.bcpl`,
      isVerified: true,
    })
    .returning({ id: usersTable.id });
  const token = jwt.sign({ userId, phone }, SECRET);
  return { token, userId, phone };
}

/** Insert a users row with a specific phone (for auto-link tests). */
async function insertUserWithPhone(phone: string): Promise<string> {
  const [{ id }] = await db.insert(usersTable)
    .values({ name: "Phone User", phone, email: `plat-${randomUUID()}@test.bcpl`, isVerified: true })
    .returning({ id: usersTable.id });
  return id;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function createTeam(token: string, over: Record<string, unknown> = {}): Promise<string> {
  const r = await request(app).post("/api/community/teams").set(auth(token))
    .send({ name: "Test XI", shortName: "TXI", ...over });
  expect(r.status).toBe(200);
  expect(r.body.success).toBe(true);
  return r.body.team.id;
}

// ── 1. cricket profile ────────────────────────────────────────────────────────
describe("cricket profile", () => {
  it("404 before any profile, then PUT upsert + GET returns camelCase", async () => {
    const { token } = await makeUser();
    const none = await request(app).get("/api/community/profile").set(auth(token));
    expect(none.status).toBe(404);

    const put = await request(app).put("/api/community/profile").set(auth(token)).send({
      displayName: "Virat", role: "all_rounder", battingStyle: "right", bowlingStyle: "right-arm medium",
    });
    expect(put.status).toBe(200);
    expect(put.body.profile.displayName).toBe("Virat");
    expect(put.body.profile.role).toBe("all_rounder");
    expect(put.body.profile.battingStyle).toBe("right");
    expect(put.body.profile.bowlingStyle).toBe("right-arm medium");

    const get = await request(app).get("/api/community/profile").set(auth(token));
    expect(get.status).toBe(200);
    expect(get.body.profile.displayName).toBe("Virat");

    // upsert overwrites
    const put2 = await request(app).put("/api/community/profile").set(auth(token)).send({
      displayName: "Virat K", role: "batsman", battingStyle: "left",
    });
    expect(put2.status).toBe(200);
    expect(put2.body.profile.displayName).toBe("Virat K");
    expect(put2.body.profile.role).toBe("batsman");
    expect(put2.body.profile.battingStyle).toBe("left");
    expect(put2.body.profile.bowlingStyle).toBeNull();
  });

  it("rejects invalid role/battingStyle", async () => {
    const { token } = await makeUser();
    const r = await request(app).put("/api/community/profile").set(auth(token))
      .send({ displayName: "X", role: "keeper", battingStyle: "right" });
    expect(r.status).toBe(400);
    const r2 = await request(app).put("/api/community/profile").set(auth(token))
      .send({ displayName: "X", role: "batsman", battingStyle: "switch" });
    expect(r2.status).toBe(400);
  });
});

// ── 2. teams + members (auto-link by phone) ────────────────────────────────────
describe("teams and members", () => {
  it("create team, add member, appears in /teams/:id and /teams/mine", async () => {
    const { token } = await makeUser();
    const teamId = await createTeam(token);

    const add = await request(app).post(`/api/community/teams/${teamId}/members`).set(auth(token))
      .send({ name: "Rohit", role: "batsman" });
    expect(add.status).toBe(200);
    expect(add.body.member.name).toBe("Rohit");
    expect(add.body.member.userId).toBeNull();

    const pub = await request(app).get(`/api/community/teams/${teamId}`);
    expect(pub.status).toBe(200);
    expect(pub.body.members.length).toBe(1);
    expect(pub.body.members[0].name).toBe("Rohit");

    const mine = await request(app).get("/api/community/teams/mine").set(auth(token));
    expect(mine.status).toBe(200);
    expect(mine.body.teams.some((t: { id: string }) => t.id === teamId)).toBe(true);
  });

  it("adding a member whose phone matches a user auto-links user_id + uses profile display_name", async () => {
    const { token } = await makeUser();
    const teamId = await createTeam(token);

    // A pre-existing user with a community profile.
    const linkedPhone = freshPhone();
    const linkedUserId = await insertUserWithPhone(linkedPhone);
    const linkedToken = jwt.sign({ userId: linkedUserId, phone: linkedPhone }, SECRET);
    await request(app).put("/api/community/profile").set(auth(linkedToken))
      .send({ displayName: "Profile Name", role: "bowler", battingStyle: "right" });

    const add = await request(app).post(`/api/community/teams/${teamId}/members`).set(auth(token))
      .send({ name: "Typed Name", phone: linkedPhone, role: "bowler" });
    expect(add.status).toBe(200);
    expect(add.body.member.userId).toBe(linkedUserId);
    // display_name from the linked user's profile wins over the typed name
    expect(add.body.member.name).toBe("Profile Name");

    // team appears in the linked user's /teams/mine (member linkage)
    const mine = await request(app).get("/api/community/teams/mine").set(auth(linkedToken));
    expect(mine.body.teams.some((t: { id: string }) => t.id === teamId)).toBe(true);
  });

  it("backfill: linkPhoneToTeams runs on profile PUT for a phone added before the user existed", async () => {
    const { token } = await makeUser();
    const teamId = await createTeam(token);

    // Add a member by a phone that has NO users row yet.
    const futurePhone = freshPhone();
    const add = await request(app).post(`/api/community/teams/${teamId}/members`).set(auth(token))
      .send({ name: "Future Player", phone: futurePhone });
    expect(add.status).toBe(200);
    expect(add.body.member.userId).toBeNull();

    // Now that phone registers and sets a profile → backfill links the member.
    const futureUserId = await insertUserWithPhone(futurePhone);
    const futureToken = jwt.sign({ userId: futureUserId, phone: futurePhone }, SECRET);
    const put = await request(app).put("/api/community/profile").set(auth(futureToken))
      .send({ displayName: "Now Registered", role: "batsman", battingStyle: "right" });
    expect(put.status).toBe(200);

    const pub = await request(app).get(`/api/community/teams/${teamId}`);
    const m = pub.body.members.find((x: { name: string }) => x.name === "Future Player");
    expect(m.userId).toBe(futureUserId);
  });

  it("enforces 25-member cap per team", async () => {
    const { token } = await makeUser();
    const teamId = await createTeam(token);
    for (let i = 0; i < 25; i++) {
      const r = await request(app).post(`/api/community/teams/${teamId}/members`).set(auth(token))
        .send({ name: `P${i}` });
      expect(r.status).toBe(200);
    }
    const over = await request(app).post(`/api/community/teams/${teamId}/members`).set(auth(token))
      .send({ name: "P26" });
    expect(over.status).toBe(400);
  });

  it("rename (PATCH) and delete only for owner; non-owner → 403", async () => {
    const { token } = await makeUser();
    const teamId = await createTeam(token);
    const { token: intruder } = await makeUser();

    const badRename = await request(app).patch(`/api/community/teams/${teamId}`).set(auth(intruder))
      .send({ name: "Hacked" });
    expect(badRename.status).toBe(403);
    const badAdd = await request(app).post(`/api/community/teams/${teamId}/members`).set(auth(intruder))
      .send({ name: "X" });
    expect(badAdd.status).toBe(403);
    const badDel = await request(app).delete(`/api/community/teams/${teamId}`).set(auth(intruder));
    expect(badDel.status).toBe(403);

    const ok = await request(app).patch(`/api/community/teams/${teamId}`).set(auth(token))
      .send({ name: "Renamed XI", shortName: "RXI" });
    expect(ok.status).toBe(200);
    expect(ok.body.team.name).toBe("Renamed XI");
    expect(ok.body.team.shortName).toBe("RXI");

    const del = await request(app).delete(`/api/community/teams/${teamId}`).set(auth(token));
    expect(del.status).toBe(200);
    const gone = await request(app).get(`/api/community/teams/${teamId}`);
    expect(gone.status).toBe(404);
  });

  it("cannot delete a team referenced by a match", async () => {
    const { token } = await makeUser();
    const teamId = await createTeam(token);
    const other = await createTeam(token, { name: "Other XI", shortName: "OXI" });

    const mk = await request(app).post("/api/community/matches").set(auth(token)).send({
      oversLimit: 2, teamAId: teamId, teamBId: other,
    });
    expect(mk.status).toBe(200);

    const del = await request(app).delete(`/api/community/teams/${teamId}`).set(auth(token));
    expect(del.status).toBe(400);
  });
});

// ── 3. roster-linked match + ball + stats ──────────────────────────────────────
describe("roster-linked match, ball with member ids, and stats", () => {
  it("match defaults team names from linked teams; roster returned on GET", async () => {
    const { token } = await makeUser();
    const teamA = await createTeam(token, { name: "Chargers", shortName: "CHG" });
    const teamB = await createTeam(token, { name: "Strikers", shortName: "STR" });
    await request(app).post(`/api/community/teams/${teamA}/members`).set(auth(token)).send({ name: "A1", role: "batsman" });
    await request(app).post(`/api/community/teams/${teamB}/members`).set(auth(token)).send({ name: "B1", role: "bowler" });

    const mk = await request(app).post("/api/community/matches").set(auth(token))
      .send({ oversLimit: 2, teamAId: teamA, teamBId: teamB });
    expect(mk.status).toBe(200);
    // names default from team names
    expect(mk.body.match.team1).toBe("Chargers");
    expect(mk.body.match.team2).toBe("Strikers");
    expect(mk.body.match.teamAId).toBe(teamA);
    expect(mk.body.match.teamBId).toBe(teamB);

    const sc = await request(app).get(`/api/community/matches/${mk.body.match.id}`);
    expect(sc.status).toBe(200);
    expect(sc.body.rosters.teamA.length).toBe(1);
    expect(sc.body.rosters.teamA[0].name).toBe("A1");
    expect(sc.body.rosters.teamB[0].name).toBe("B1");
  });

  it("ball with foreign member id → 400; ball with member of the match's team → stats aggregate", async () => {
    // Owner scores. Striker & bowler are real users so we can read their /profile/stats.
    const { token: owner } = await makeUser();

    // batting user + profile + team
    const strikerUser = await makeUser();
    await request(app).put("/api/community/profile").set(auth(strikerUser.token))
      .send({ displayName: "Striker", role: "batsman", battingStyle: "right" });
    const teamA = await createTeam(owner, { name: "Batters", shortName: "BAT" });
    const addA = await request(app).post(`/api/community/teams/${teamA}/members`).set(auth(owner))
      .send({ name: "Striker", phone: strikerUser.phone, role: "batsman" });
    expect(addA.body.member.userId).toBe(strikerUser.userId);
    const strikerMemberId = addA.body.member.id;

    // bowling user + profile + team
    const bowlerUser = await makeUser();
    await request(app).put("/api/community/profile").set(auth(bowlerUser.token))
      .send({ displayName: "Bowler", role: "bowler", battingStyle: "right" });
    const teamB = await createTeam(owner, { name: "Bowlers", shortName: "BOW" });
    const addB = await request(app).post(`/api/community/teams/${teamB}/members`).set(auth(owner))
      .send({ name: "Bowler", phone: bowlerUser.phone, role: "bowler" });
    const bowlerMemberId = addB.body.member.id;

    const mk = await request(app).post("/api/community/matches").set(auth(owner))
      .send({ oversLimit: 2, teamAId: teamA, teamBId: teamB });
    const matchId = mk.body.match.id;

    // foreign member id (a member of an unrelated team) → 400
    const foreignTeam = await createTeam(owner, { name: "Outsiders", shortName: "OUT" });
    const foreignMem = await request(app).post(`/api/community/teams/${foreignTeam}/members`).set(auth(owner))
      .send({ name: "Foreign" });
    const badBall = await request(app).post(`/api/community/matches/${matchId}/ball`).set(auth(owner))
      .send({ type: "run", runs: 1, batterName: "Striker", bowlerName: "Bowler", strikerMemberId: foreignMem.body.member.id });
    expect(badBall.status).toBe(400);

    // valid balls: striker faces 4, then 6, then a wicket bowled by bowler.
    const b1 = await request(app).post(`/api/community/matches/${matchId}/ball`).set(auth(owner))
      .send({ type: "run", runs: 4, batterName: "Striker", bowlerName: "Bowler", strikerMemberId, bowlerMemberId });
    expect(b1.status).toBe(200);
    await request(app).post(`/api/community/matches/${matchId}/ball`).set(auth(owner))
      .send({ type: "run", runs: 6, batterName: "Striker", bowlerName: "Bowler", strikerMemberId, bowlerMemberId });
    await request(app).post(`/api/community/matches/${matchId}/ball`).set(auth(owner))
      .send({ type: "wicket", runs: 0, batterName: "Striker", bowlerName: "Bowler", dismissalType: "bowled", dismissedBatter: "Striker", strikerMemberId, bowlerMemberId });

    // striker's batting stats: 10 runs off 3 balls, one 4, one 6
    const bat = await request(app).get("/api/community/profile/stats").set(auth(strikerUser.token));
    expect(bat.status).toBe(200);
    expect(bat.body.stats.batting.runs).toBe(10);
    expect(bat.body.stats.batting.balls).toBe(3);
    expect(bat.body.stats.batting.fours).toBe(1);
    expect(bat.body.stats.batting.sixes).toBe(1);
    expect(bat.body.stats.batting.matches).toBe(1);

    // bowler's bowling stats: 1 wicket, 10 runs conceded, 3 legal balls, 1 match/innings
    const bowl = await request(app).get("/api/community/profile/stats").set(auth(bowlerUser.token));
    expect(bowl.status).toBe(200);
    expect(bowl.body.stats.bowling.wickets).toBe(1);
    expect(bowl.body.stats.bowling.runsConceded).toBe(10);
    expect(bowl.body.stats.bowling.balls).toBe(3);
    expect(bowl.body.stats.bowling.matches).toBe(1);
    expect(bowl.body.stats.bowling.innings).toBe(1);
  });

  it("rejects a striker member id from the BOWLING side (wrong-side 400)", async () => {
    const { token: owner } = await makeUser();
    const teamA = await createTeam(owner, { name: "Bats", shortName: "BTS" });
    const teamB = await createTeam(owner, { name: "Balls", shortName: "BLS" });
    const batter = await request(app).post(`/api/community/teams/${teamA}/members`).set(auth(owner)).send({ name: "Bat1" });
    const bowler = await request(app).post(`/api/community/teams/${teamB}/members`).set(auth(owner)).send({ name: "Bowl1" });

    // team1 = teamA bats first, so batting side = teamA.
    const mk = await request(app).post("/api/community/matches").set(auth(owner))
      .send({ oversLimit: 2, teamAId: teamA, teamBId: teamB });
    const matchId = mk.body.match.id;

    // striker id belongs to the bowling side (teamB) → 400
    const wrong = await request(app).post(`/api/community/matches/${matchId}/ball`).set(auth(owner))
      .send({ type: "run", runs: 1, batterName: "X", bowlerName: "Y", strikerMemberId: bowler.body.member.id });
    expect(wrong.status).toBe(400);

    // bowler id belongs to the batting side (teamA) → 400
    const wrong2 = await request(app).post(`/api/community/matches/${matchId}/ball`).set(auth(owner))
      .send({ type: "run", runs: 1, batterName: "X", bowlerName: "Y", bowlerMemberId: batter.body.member.id });
    expect(wrong2.status).toBe(400);

    // correct sides → 200
    const ok = await request(app).post(`/api/community/matches/${matchId}/ball`).set(auth(owner))
      .send({ type: "run", runs: 1, batterName: "X", bowlerName: "Y", strikerMemberId: batter.body.member.id, bowlerMemberId: bowler.body.member.id });
    expect(ok.status).toBe(200);
  });

  it("rejects member ids when the match has no linked teams (400)", async () => {
    const { token: owner } = await makeUser();
    const team = await createTeam(owner, { name: "Solo", shortName: "SOL" });
    const mem = await request(app).post(`/api/community/teams/${team}/members`).set(auth(owner)).send({ name: "M1" });

    // plain match, no teamAId/teamBId
    const mk = await request(app).post("/api/community/matches").set(auth(owner))
      .send({ team1: "Aa", team2: "Bb", oversLimit: 2 });
    const matchId = mk.body.match.id;

    const r = await request(app).post(`/api/community/matches/${matchId}/ball`).set(auth(owner))
      .send({ type: "run", runs: 1, batterName: "X", bowlerName: "Y", strikerMemberId: mem.body.member.id });
    expect(r.status).toBe(400);
  });

  it("empty stats return zeros (no matches)", async () => {
    const { token } = await makeUser();
    const r = await request(app).get("/api/community/profile/stats").set(auth(token));
    expect(r.status).toBe(200);
    expect(r.body.stats.batting.runs).toBe(0);
    expect(r.body.stats.bowling.wickets).toBe(0);
    expect(r.body.stats.batting.strikeRate).toBe(0);
    expect(r.body.stats.bowling.economy).toBe(0);
  });
});

// ── 4. PII: phone exposure ──────────────────────────────────────────────────────
describe("member phone PII", () => {
  it("public team GET omits phone; owner GET includes it", async () => {
    const { token: owner } = await makeUser();
    const teamId = await createTeam(owner);
    const phone = freshPhone();
    const add = await request(app).post(`/api/community/teams/${teamId}/members`).set(auth(owner))
      .send({ name: "WithPhone", phone });
    expect(add.status).toBe(200);
    // owner-only add endpoint echoes phone
    expect(add.body.member.phone).toBe(phone);

    // public (no auth) → no phone field at all
    const pub = await request(app).get(`/api/community/teams/${teamId}`);
    expect(pub.status).toBe(200);
    expect(pub.body.members[0]).not.toHaveProperty("phone");

    // a non-owner authed requester → still no phone
    const { token: other } = await makeUser();
    const asOther = await request(app).get(`/api/community/teams/${teamId}`).set(auth(other));
    expect(asOther.body.members[0]).not.toHaveProperty("phone");

    // owner authed → phone present
    const asOwner = await request(app).get(`/api/community/teams/${teamId}`).set(auth(owner));
    expect(asOwner.body.members[0].phone).toBe(phone);
  });

  it("match GET rosters never include phone", async () => {
    const { token: owner } = await makeUser();
    const teamA = await createTeam(owner, { name: "PhA", shortName: "PHA" });
    const teamB = await createTeam(owner, { name: "PhB", shortName: "PHB" });
    await request(app).post(`/api/community/teams/${teamA}/members`).set(auth(owner))
      .send({ name: "RA", phone: freshPhone() });
    await request(app).post(`/api/community/teams/${teamB}/members`).set(auth(owner))
      .send({ name: "RB", phone: freshPhone() });
    const mk = await request(app).post("/api/community/matches").set(auth(owner))
      .send({ oversLimit: 2, teamAId: teamA, teamBId: teamB });

    // even the owner-authed match GET must not leak phones through rosters
    const sc = await request(app).get(`/api/community/matches/${mk.body.match.id}`).set(auth(owner));
    expect(sc.status).toBe(200);
    expect(sc.body.rosters.teamA[0]).not.toHaveProperty("phone");
    expect(sc.body.rosters.teamB[0]).not.toHaveProperty("phone");
  });
});

// ── 5. auth guards ──────────────────────────────────────────────────────────────
describe("auth guards", () => {
  it("unauthenticated profile/teams → 401", async () => {
    expect((await request(app).get("/api/community/profile")).status).toBe(401);
    expect((await request(app).post("/api/community/teams").send({ name: "X", shortName: "X" })).status).toBe(401);
    expect((await request(app).get("/api/community/profile/stats")).status).toBe(401);
  });

  it("public GET /teams/:id works with no auth", async () => {
    const { token } = await makeUser();
    const teamId = await createTeam(token);
    const r = await request(app).get(`/api/community/teams/${teamId}`);
    expect(r.status).toBe(200);
    expect(r.body.team.id).toBe(teamId);
  });
});

// keep eq import referenced (used for potential cleanup helpers / lint)
void eq;
void usersTable;
