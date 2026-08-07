/**
 * Community scorer engine — supertest against the exported Express app.
 *
 * Route: src/routes/community.ts, mounted at /api/community.
 *
 * Auth: we NEVER use OTP login here. We mint player JWTs directly with the
 * same secret the server uses (JWT_SECRET || dev fallback). Every test uses a
 * FRESH random uuid owner so parallel vitest runs never collide, and every
 * assertion only inspects matches created within that test. No table
 * truncation — the community engine auto-creates its own tables.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const { default: app } = await import("../src/app");

const SECRET = process.env.JWT_SECRET || "bcpl-dev-secret-CHANGE-IN-PROD";

/** Mint a fresh player token (unique owner per call unless a userId is given). */
function mintToken(userId: string = randomUUID()): { token: string; userId: string } {
  const phone = "99999999" + String(Math.floor(Math.random() * 90) + 10);
  const token = jwt.sign({ userId, phone }, SECRET);
  return { token, userId };
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Create a live match owned by `token`. Returns the match id. */
async function createMatch(
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const body = {
    team1: "Alpha",
    team2: "Bravo",
    venue: "Test Ground",
    oversLimit: 2,
    playersPerSide: 11,
    battingFirst: "team1",
    ...overrides,
  };
  const r = await request(app).post("/api/community/matches").set(auth(token)).send(body);
  expect(r.status).toBe(200);
  expect(r.body.success).toBe(true);
  return r.body.match.id;
}

/** Post a ball. */
function ball(id: string, token: string, body: Record<string, unknown>) {
  return request(app).post(`/api/community/matches/${id}/ball`).set(auth(token)).send(body);
}

/** Fetch the public scorecard. */
function scorecard(id: string) {
  return request(app).get(`/api/community/matches/${id}`);
}

const RUN = (n: number, batter = "B1", bowler = "Bo1") =>
  ({ type: "run" as const, runs: n, batterName: batter, bowlerName: bowler });

// ── 1. create validation + /matches/mine ─────────────────────────────────────
describe("create match validation", () => {
  it("rejects oversLimit below 1 and above 50", async () => {
    const { token } = mintToken();
    const lo = await request(app).post("/api/community/matches").set(auth(token))
      .send({ team1: "A", team2: "B", oversLimit: 0 });
    expect(lo.status).toBe(400);
    const hi = await request(app).post("/api/community/matches").set(auth(token))
      .send({ team1: "A", team2: "B", oversLimit: 51 });
    expect(hi.status).toBe(400);
  });

  it("rejects playersPerSide out of [2,11]", async () => {
    const { token } = mintToken();
    const lo = await request(app).post("/api/community/matches").set(auth(token))
      .send({ team1: "A", team2: "B", oversLimit: 5, playersPerSide: 1 });
    expect(lo.status).toBe(400);
    const hi = await request(app).post("/api/community/matches").set(auth(token))
      .send({ team1: "A", team2: "B", oversLimit: 5, playersPerSide: 12 });
    expect(hi.status).toBe(400);
  });

  it("rejects invalid battingFirst enum", async () => {
    const { token } = mintToken();
    const r = await request(app).post("/api/community/matches").set(auth(token))
      .send({ team1: "A", team2: "B", oversLimit: 5, battingFirst: "team3" });
    expect(r.status).toBe(400);
  });

  it("rejects identical team names", async () => {
    const { token } = mintToken();
    const r = await request(app).post("/api/community/matches").set(auth(token))
      .send({ team1: "Same", team2: "same", oversLimit: 5 });
    expect(r.status).toBe(400);
  });

  it("battingFirst=team2 makes team2 bat first", async () => {
    const { token } = mintToken();
    const id = await createMatch(token, { battingFirst: "team2" });
    const sc = await scorecard(id);
    expect(sc.status).toBe(200);
    expect(sc.body.innings[0].battingTeam).toBe("Bravo");
    expect(sc.body.innings[0].bowlingTeam).toBe("Alpha");
  });

  it("created match appears in /matches/mine and not for others", async () => {
    const { token, userId } = mintToken();
    const id = await createMatch(token);
    const mine = await request(app).get("/api/community/matches/mine").set(auth(token));
    expect(mine.status).toBe(200);
    expect(mine.body.matches.some((m: { id: string }) => m.id === id)).toBe(true);

    const { token: otherToken } = mintToken();
    const others = await request(app).get("/api/community/matches/mine").set(auth(otherToken));
    expect(others.body.matches.some((m: { id: string }) => m.id === id)).toBe(false);
    expect(userId).toBeTruthy();
  });
});

// ── 2. ball math ──────────────────────────────────────────────────────────────
describe("ball math", () => {
  it("run 4 adds 4 runs and one legal ball", async () => {
    const { token } = mintToken();
    const id = await createMatch(token);
    const r = await ball(id, token, RUN(4));
    expect(r.status).toBe(200);
    expect(r.body.inningsTotal.runs).toBe(4);
    expect(r.body.inningsTotal.balls).toBe(1);
  });

  it("wide with runs:2 → +3 extras, no legal ball", async () => {
    const { token } = mintToken();
    const id = await createMatch(token);
    const r = await ball(id, token, { type: "wide", runs: 2, batterName: "B1", bowlerName: "Bo1" });
    expect(r.status).toBe(200);
    expect(r.body.inningsTotal.runs).toBe(3); // 1 + 2
    expect(r.body.inningsTotal.balls).toBe(0);
  });

  it("noball runs:6 → +7, no legal ball", async () => {
    const { token } = mintToken();
    const id = await createMatch(token);
    const r = await ball(id, token, { type: "noball", runs: 6, batterName: "B1", bowlerName: "Bo1" });
    expect(r.status).toBe(200);
    expect(r.body.inningsTotal.runs).toBe(7); // 1 (nb) + 6 (bat)
    expect(r.body.inningsTotal.balls).toBe(0);
  });

  it("bye/legbye count a legal ball with minimum 1 run", async () => {
    const { token } = mintToken();
    const id = await createMatch(token);
    const bye = await ball(id, token, { type: "bye", runs: 0, batterName: "B1", bowlerName: "Bo1" });
    expect(bye.status).toBe(200);
    expect(bye.body.inningsTotal.runs).toBe(1); // max(1, 0)
    expect(bye.body.inningsTotal.balls).toBe(1);

    const lb = await ball(id, token, { type: "legbye", runs: 3, batterName: "B1", bowlerName: "Bo1" });
    expect(lb.body.inningsTotal.runs).toBe(4); // 1 + 3
    expect(lb.body.inningsTotal.balls).toBe(2);
  });

  it("6 legal balls → over increments, balls resets to 0", async () => {
    const { token } = mintToken();
    const id = await createMatch(token, { oversLimit: 5 });
    let last;
    for (let i = 0; i < 6; i++) last = await ball(id, token, RUN(1));
    expect(last!.body.inningsTotal.overs).toBe(1);
    expect(last!.body.inningsTotal.balls).toBe(0);
    expect(last!.body.inningsTotal.runs).toBe(6);
  });
});

// ── 3. wickets ────────────────────────────────────────────────────────────────
describe("wickets", () => {
  it("bowled counts a wicket", async () => {
    const { token } = mintToken();
    const id = await createMatch(token);
    const r = await ball(id, token, {
      type: "wicket", runs: 0, batterName: "B1", bowlerName: "Bo1",
      dismissalType: "bowled", dismissedBatter: "B1",
    });
    expect(r.status).toBe(200);
    expect(r.body.inningsTotal.wickets).toBe(1);
  });

  it("retired_hurt does NOT increment totalWickets but batter shows out", async () => {
    const { token } = mintToken();
    const id = await createMatch(token);
    const r = await ball(id, token, {
      type: "wicket", runs: 0, batterName: "B1", bowlerName: "Bo1",
      dismissalType: "retired_hurt", dismissedBatter: "B1",
    });
    expect(r.status).toBe(200);
    expect(r.body.inningsTotal.wickets).toBe(0);
    const sc = await scorecard(id);
    const b1 = sc.body.innings[0].batting.find((b: { name: string }) => b.name === "B1");
    expect(b1.out).toBe("retired_hurt");
  });

  it("run_out with runs:1 adds the run", async () => {
    const { token } = mintToken();
    const id = await createMatch(token);
    const r = await ball(id, token, {
      type: "wicket", runs: 1, batterName: "B1", bowlerName: "Bo1",
      dismissalType: "run_out", dismissedBatter: "B2",
    });
    expect(r.status).toBe(200);
    expect(r.body.inningsTotal.runs).toBe(1);
    expect(r.body.inningsTotal.wickets).toBe(1);
    expect(r.body.inningsTotal.balls).toBe(1);
  });
});

// ── 4. bowler figures ─────────────────────────────────────────────────────────
describe("bowler figures", () => {
  it("byes/legbyes NOT charged to bowler; wide/noball extras charged", async () => {
    const { token } = mintToken();
    const id = await createMatch(token, { oversLimit: 5 });
    await ball(id, token, { type: "bye", runs: 4, batterName: "B1", bowlerName: "Bo1" });
    await ball(id, token, { type: "legbye", runs: 2, batterName: "B1", bowlerName: "Bo1" });
    await ball(id, token, { type: "wide", runs: 1, batterName: "B1", bowlerName: "Bo1" }); // +2 charged
    await ball(id, token, { type: "noball", runs: 2, batterName: "B1", bowlerName: "Bo1" }); // +1 extra + 2 bat = 3 charged
    await ball(id, token, RUN(4, "B1", "Bo1")); // 4 off bat charged

    const sc = await scorecard(id);
    const bo1 = sc.body.innings[0].bowling.find((b: { name: string }) => b.name === "Bo1");
    // charged: bye/lb=0, wide=2, noball extra 1 + bat 2 = 3, run 4 → 9
    expect(bo1.runs).toBe(9);
  });
});

// ── 5. undo ───────────────────────────────────────────────────────────────────
describe("undo", () => {
  it("reverses runs/wickets/balls of the last ball", async () => {
    const { token } = mintToken();
    const id = await createMatch(token);
    await ball(id, token, RUN(4));
    const w = await ball(id, token, {
      type: "wicket", runs: 0, batterName: "B1", bowlerName: "Bo1",
      dismissalType: "bowled", dismissedBatter: "B1",
    });
    expect(w.body.inningsTotal.wickets).toBe(1);
    expect(w.body.inningsTotal.balls).toBe(2);

    const undo = await request(app).delete(`/api/community/matches/${id}/ball`).set(auth(token));
    expect(undo.status).toBe(200);
    const sc = await scorecard(id);
    const inn = sc.body.innings[0];
    expect(inn.totalRuns).toBe(4);
    expect(inn.totalWickets).toBe(0);
    expect(inn.balls).toBe(1);
    expect(inn.status).toBe("live");
  });

  it("undo after 6th legal ball restores overs/balls across the boundary", async () => {
    const { token } = mintToken();
    const id = await createMatch(token, { oversLimit: 5 });
    let last;
    for (let i = 0; i < 6; i++) last = await ball(id, token, RUN(1));
    expect(last!.body.inningsTotal.overs).toBe(1);
    expect(last!.body.inningsTotal.balls).toBe(0);

    const undo = await request(app).delete(`/api/community/matches/${id}/ball`).set(auth(token));
    expect(undo.status).toBe(200);
    const sc = await scorecard(id);
    const inn = sc.body.innings[0];
    expect(inn.overs).toBe(0);
    expect(inn.balls).toBe(5);
    expect(inn.totalRuns).toBe(5);
    expect(inn.status).toBe("live");
  });

  it("undo reopens a completed innings (reverts match status)", async () => {
    const { token } = mintToken();
    // 1 over match, all-out impossible quickly; use overs exhaustion instead
    const id = await createMatch(token, { oversLimit: 1 });
    let last;
    for (let i = 0; i < 6; i++) last = await ball(id, token, RUN(1));
    expect(last!.body.inningsComplete).toBe(true);
    let sc = await scorecard(id);
    expect(sc.body.innings[0].status).toBe("completed");
    expect(sc.body.match.status).toBe("innings2");

    const undo = await request(app).delete(`/api/community/matches/${id}/ball`).set(auth(token));
    expect(undo.status).toBe(200);
    sc = await scorecard(id);
    expect(sc.body.innings[0].status).toBe("live");
    expect(sc.body.match.status).toBe("live");
  });
});

// ── 6. innings-end / target / results ─────────────────────────────────────────
describe("innings-end + results", () => {
  it("innings-end is idempotent and sets target = inn1 + 1", async () => {
    const { token } = mintToken();
    const id = await createMatch(token, { oversLimit: 5 });
    await ball(id, token, RUN(4));
    await ball(id, token, RUN(2)); // inn1 = 6

    const e1 = await request(app).post(`/api/community/matches/${id}/innings-end`).set(auth(token)).send({});
    expect(e1.status).toBe(200);
    expect(e1.body.target).toBe(7);

    const e2 = await request(app).post(`/api/community/matches/${id}/innings-end`).set(auth(token)).send({});
    expect(e2.status).toBe(200);
    expect(e2.body.target).toBe(7); // idempotent — same target, no 3rd innings

    const sc = await scorecard(id);
    expect(sc.body.innings.length).toBe(2);
    expect(sc.body.innings[1].target).toBe(7);
  });

  it("reaching target mid-over completes innings + match, 'won by N wicket(s)'", async () => {
    const { token } = mintToken();
    const id = await createMatch(token, { oversLimit: 5, playersPerSide: 11 });
    // innings 1 = 6 runs → target 7
    await ball(id, token, RUN(6));
    await request(app).post(`/api/community/matches/${id}/innings-end`).set(auth(token)).send({});
    // innings 2 chase: 6 then 1 = 7 ≥ target, mid-over (2 legal balls)
    await ball(id, token, RUN(6, "C1", "Bo2"));
    const win = await ball(id, token, RUN(1, "C1", "Bo2"));
    expect(win.body.inningsComplete).toBe(true);

    const sc = await scorecard(id);
    expect(sc.body.match.status).toBe("completed");
    // 0 wickets fell → (11-1) - 0 = 10 wickets
    expect(sc.body.match.resultDesc).toBe("Bravo won by 10 wicket(s)");
  });

  it("overs exhausted with fewer runs → 'won by N run(s)'", async () => {
    const { token } = mintToken();
    const id = await createMatch(token, { oversLimit: 1 });
    // innings 1 = 6 x 4 = 24 → target 25
    for (let i = 0; i < 6; i++) await ball(id, token, RUN(4));
    await request(app).post(`/api/community/matches/${id}/innings-end`).set(auth(token)).send({});
    // innings 2 = 6 x 1 = 6, overs exhausted (< target)
    let last;
    for (let i = 0; i < 6; i++) last = await ball(id, token, RUN(1, "C1", "Bo2"));
    expect(last!.body.inningsComplete).toBe(true);

    const sc = await scorecard(id);
    expect(sc.body.match.status).toBe("completed");
    expect(sc.body.match.resultDesc).toBe("Alpha won by 18 run(s)"); // 24 - 6
  });

  it("undo after match completion reopens innings and clears result", async () => {
    const { token } = mintToken();
    const id = await createMatch(token, { oversLimit: 5, playersPerSide: 11 });
    // innings 1 = 6 runs → target 7
    await ball(id, token, RUN(6));
    await request(app).post(`/api/community/matches/${id}/innings-end`).set(auth(token)).send({});
    // innings 2 chase: 6 then 1 = 7 ≥ target → winning ball completes match
    await ball(id, token, RUN(6, "C1", "Bo2"));
    const win = await ball(id, token, RUN(1, "C1", "Bo2"));
    expect(win.body.inningsComplete).toBe(true);

    let sc = await scorecard(id);
    expect(sc.body.match.status).toBe("completed");
    expect(sc.body.match.resultDesc).toBe("Bravo won by 10 wicket(s)");
    expect(sc.body.innings[1].totalRuns).toBe(7);

    // undo the winning ball → reopen innings, clear result
    const undo = await request(app).delete(`/api/community/matches/${id}/ball`).set(auth(token));
    expect(undo.status).toBe(200);
    expect(undo.body.success).toBe(true);

    sc = await scorecard(id);
    expect(sc.body.match.status).toBe("innings2");
    expect(sc.body.match.resultDesc).toBe("");
    expect(sc.body.innings[1].status).toBe("live");
    expect(sc.body.innings[1].totalRuns).toBe(6); // winning +1 reversed
    expect(sc.body.innings[1].balls).toBe(1);

    // re-post the winning ball → completed again with correct result
    const win2 = await ball(id, token, RUN(1, "C1", "Bo2"));
    expect(win2.body.inningsComplete).toBe(true);
    sc = await scorecard(id);
    expect(sc.body.match.status).toBe("completed");
    expect(sc.body.match.resultDesc).toBe("Bravo won by 10 wicket(s)");
    expect(sc.body.innings[1].totalRuns).toBe(7);
  });

  it("tie uses the route's tie text (Match tied)", async () => {
    const { token } = mintToken();
    const id = await createMatch(token, { oversLimit: 1 });
    // innings 1 = 6 runs → target 7
    for (let i = 0; i < 6; i++) await ball(id, token, RUN(1));
    await request(app).post(`/api/community/matches/${id}/innings-end`).set(auth(token)).send({});
    // innings 2 = 6 runs → equal, overs exhausted (6 < target 7, does not auto-complete on runs)
    for (let i = 0; i < 6; i++) await ball(id, token, RUN(1, "C1", "Bo2"));

    const fin = await request(app).post(`/api/community/matches/${id}/finish`).set(auth(token)).send({});
    expect(fin.status).toBe(200);
    expect(fin.body.resultDesc).toBe("Match tied");
  });
});

// ── 7. finish edge cases ──────────────────────────────────────────────────────
describe("finish", () => {
  it("finish with no 2nd-innings balls → 400", async () => {
    const { token } = mintToken();
    const id = await createMatch(token, { oversLimit: 5 });
    await ball(id, token, RUN(4));
    await request(app).post(`/api/community/matches/${id}/innings-end`).set(auth(token)).send({});
    // no 2nd innings balls scored
    const fin = await request(app).post(`/api/community/matches/${id}/finish`).set(auth(token)).send({});
    expect(fin.status).toBe(400);
  });

  it("finish {abandon:true} → 'Match abandoned'", async () => {
    const { token } = mintToken();
    const id = await createMatch(token, { oversLimit: 5 });
    await ball(id, token, RUN(4));
    const fin = await request(app).post(`/api/community/matches/${id}/finish`).set(auth(token)).send({ abandon: true });
    expect(fin.status).toBe(200);
    expect(fin.body.resultDesc).toBe("Match abandoned");
    const sc = await scorecard(id);
    expect(sc.body.match.status).toBe("completed");
    expect(sc.body.match.resultDesc).toBe("Match abandoned");
  });
});

// ── 8. security ───────────────────────────────────────────────────────────────
describe("security", () => {
  it("non-owner ball/undo/finish → 403", async () => {
    const { token } = mintToken();
    const id = await createMatch(token);
    const { token: intruder } = mintToken();

    const b = await ball(id, intruder, RUN(4));
    expect(b.status).toBe(403);
    const u = await request(app).delete(`/api/community/matches/${id}/ball`).set(auth(intruder));
    expect(u.status).toBe(403);
    const f = await request(app).post(`/api/community/matches/${id}/finish`).set(auth(intruder)).send({});
    expect(f.status).toBe(403);
    const e = await request(app).post(`/api/community/matches/${id}/innings-end`).set(auth(intruder)).send({});
    expect(e.status).toBe(403);
  });

  it("unauthenticated create → 401", async () => {
    const r = await request(app).post("/api/community/matches")
      .send({ team1: "A", team2: "B", oversLimit: 5 });
    expect(r.status).toBe(401);
  });

  it("public GET scorecard works with no auth", async () => {
    const { token } = mintToken();
    const id = await createMatch(token);
    const sc = await request(app).get(`/api/community/matches/${id}`);
    expect(sc.status).toBe(200);
    expect(sc.body.match.id).toBe(id);
    expect(Array.isArray(sc.body.innings)).toBe(true);
  });

  it("wicket without dismissalType → 400", async () => {
    const { token } = mintToken();
    const id = await createMatch(token);
    const r = await ball(id, token, { type: "wicket", runs: 0, batterName: "B1", bowlerName: "Bo1" });
    expect(r.status).toBe(400);
  });
});
