/**
 * Unit tests for the MVP / fantasy points calculator (src/lib/mvpPoints.ts).
 *
 * Pure function — no DB. We build synthetic scorecards (delivery lists) and
 * assert exact points using the shipped Dream11-style defaults, covering:
 * run points, four/six bonuses, 30/50/100 milestones, duck, wicket + bowled/lbw
 * bonus, 3/4/5-wicket hauls, maiden overs, catches (+3-catch bonus), stumping,
 * direct + assisted run-outs, and per-match aggregation across two matches.
 */
import { describe, it, expect } from "vitest";
import {
  computeMvpPoints, DEFAULT_MVP_POINTS_CONFIG, resolveMvpConfig,
  type ScoredDelivery,
} from "../src/lib/mvpPoints";

const C = DEFAULT_MVP_POINTS_CONFIG;

type D = Partial<ScoredDelivery>;
/** delivery factory with sensible defaults */
function del(over: number, o: D): ScoredDelivery {
  return {
    inningsId: o.inningsId ?? "inn1",
    overNumber: over,
    batterName: o.batterName ?? "Bat",
    bowlerName: o.bowlerName ?? "Bowl",
    runsOffBat: o.runsOffBat ?? 0,
    extrasRuns: o.extrasRuns ?? 0,
    extraType: o.extraType ?? null,
    totalRuns: o.totalRuns ?? ((o.runsOffBat ?? 0) + (o.extrasRuns ?? 0)),
    isWicket: o.isWicket ?? false,
    dismissalType: o.dismissalType ?? null,
    dismissedBatter: o.dismissedBatter ?? null,
    fielderName: o.fielderName ?? null,
    battingTeam: o.battingTeam ?? "TeamA",
    bowlingTeam: o.bowlingTeam ?? "TeamB",
  };
}

const oneMatch = new Map([["inn1", "m1"], ["inn2", "m1"]]);

function scoreOf(dels: ScoredDelivery[], name: string, team: string) {
  const players = computeMvpPoints(dels, oneMatch, DEFAULT_MVP_POINTS_CONFIG);
  return players.find(p => p.name === name && p.team === team);
}

describe("mvp points — batting", () => {
  it("runs + four bonus + six bonus", () => {
    const dels = [
      del(0, { runsOffBat: 4 }),
      del(0, { runsOffBat: 6 }),
      del(0, { runsOffBat: 2 }),
    ];
    const p = scoreOf(dels, "Bat", "TeamA")!;
    // runs=12 → 12*1; one four → +1; one six → +2
    expect(p.runs).toBe(12);
    expect(p.breakdown.battingPoints).toBe(12 * C.batting.run + C.batting.fourBonus + C.batting.sixBonus);
  });

  it("30-run milestone", () => {
    const dels = Array.from({ length: 10 }, () => del(0, { runsOffBat: 3 })); // 30 runs
    const p = scoreOf(dels, "Bat", "TeamA")!;
    expect(p.runs).toBe(30);
    expect(p.breakdown.battingPoints).toBe(30 * C.batting.run + C.batting.milestone30);
  });

  it("50-run milestone (not double-counted with 30)", () => {
    const dels = Array.from({ length: 25 }, () => del(0, { runsOffBat: 2 })); // 50 runs
    const p = scoreOf(dels, "Bat", "TeamA")!;
    expect(p.breakdown.battingPoints).toBe(50 * C.batting.run + C.batting.milestone50);
  });

  it("100-run milestone", () => {
    const dels = Array.from({ length: 25 }, () => del(0, { runsOffBat: 4 })); // 100 runs, 25 fours
    const p = scoreOf(dels, "Bat", "TeamA")!;
    expect(p.breakdown.battingPoints).toBe(100 * C.batting.run + 25 * C.batting.fourBonus + C.batting.milestone100);
  });

  it("duck: out for 0 → penalty", () => {
    const dels = [del(0, { isWicket: true, dismissalType: "bowled", dismissedBatter: "Bat", bowlerName: "X" })];
    const p = scoreOf(dels, "Bat", "TeamA")!;
    expect(p.runs).toBe(0);
    expect(p.breakdown.battingPoints).toBe(C.batting.duck);
  });

  it("no duck if scored runs before out", () => {
    const dels = [
      del(0, { runsOffBat: 2 }),
      del(0, { isWicket: true, dismissalType: "bowled", dismissedBatter: "Bat", bowlerName: "X" }),
    ];
    const p = scoreOf(dels, "Bat", "TeamA")!;
    expect(p.breakdown.battingPoints).toBe(2 * C.batting.run);
  });
});

describe("mvp points — bowling", () => {
  it("wicket + bowled bonus", () => {
    const dels = [del(0, { bowlerName: "Bowl", isWicket: true, dismissalType: "bowled", dismissedBatter: "z" })];
    const p = scoreOf(dels, "Bowl", "TeamB")!;
    expect(p.wickets).toBe(1);
    expect(p.breakdown.bowlingPoints).toBe(C.bowling.wicket + C.bowling.bowledLbwBonus);
  });

  it("caught wicket → no bowled/lbw bonus", () => {
    const dels = [del(0, { bowlerName: "Bowl", isWicket: true, dismissalType: "caught", dismissedBatter: "z", fielderName: "F" })];
    const p = scoreOf(dels, "Bowl", "TeamB")!;
    expect(p.breakdown.bowlingPoints).toBe(C.bowling.wicket);
  });

  it("run_out is NOT credited to the bowler", () => {
    const dels = [del(0, { bowlerName: "Bowl", isWicket: true, dismissalType: "run_out", dismissedBatter: "z", fielderName: "F" })];
    const p = scoreOf(dels, "Bowl", "TeamB");
    expect(p?.wickets ?? 0).toBe(0);
  });

  it("3-wicket haul bonus", () => {
    const dels = [
      del(0, { bowlerName: "Bowl", isWicket: true, dismissalType: "caught", fielderName: "F1" }),
      del(0, { bowlerName: "Bowl", isWicket: true, dismissalType: "caught", fielderName: "F1" }),
      del(0, { bowlerName: "Bowl", isWicket: true, dismissalType: "caught", fielderName: "F1" }),
    ];
    const p = scoreOf(dels, "Bowl", "TeamB")!;
    expect(p.wickets).toBe(3);
    expect(p.breakdown.bowlingPoints).toBe(3 * C.bowling.wicket + C.bowling.haul3);
  });

  it("5-wicket haul bonus (bowled → also bowled bonuses)", () => {
    const dels = Array.from({ length: 5 }, () =>
      del(0, { bowlerName: "Bowl", isWicket: true, dismissalType: "bowled", dismissedBatter: "z" }));
    const p = scoreOf(dels, "Bowl", "TeamB")!;
    expect(p.wickets).toBe(5);
    expect(p.breakdown.bowlingPoints).toBe(5 * C.bowling.wicket + 5 * C.bowling.bowledLbwBonus + C.bowling.haul5);
  });

  it("maiden over: 6 legal balls, 0 runs conceded", () => {
    const dels = Array.from({ length: 6 }, () => del(0, { bowlerName: "Bowl", runsOffBat: 0 }));
    const p = scoreOf(dels, "Bowl", "TeamB")!;
    expect(p.breakdown.bowlingPoints).toBe(C.bowling.maidenOver);
  });

  it("not a maiden if a run (or a charged wide) is conceded", () => {
    const withRun = Array.from({ length: 6 }, (_, i) => del(0, { bowlerName: "Bowl", runsOffBat: i === 3 ? 1 : 0 }));
    // a run was conceded → no maiden; bowler earns nothing (0 / absent from list)
    expect(scoreOf(withRun, "Bowl", "TeamB")?.breakdown.bowlingPoints ?? 0).toBe(0);

    // byes/leg-byes are NOT charged to the bowler → still a maiden
    const withBye = [
      ...Array.from({ length: 5 }, () => del(0, { bowlerName: "Bowl2", runsOffBat: 0 })),
      del(0, { bowlerName: "Bowl2", extraType: "leg_bye", extrasRuns: 1 }),
    ];
    expect(scoreOf(withBye, "Bowl2", "TeamB")!.breakdown.bowlingPoints).toBe(C.bowling.maidenOver);
  });
});

describe("mvp points — fielding", () => {
  it("catch credited to fielder (on bowling side)", () => {
    const dels = [del(0, { bowlerName: "Bowl", isWicket: true, dismissalType: "caught", fielderName: "Fielder" })];
    const p = scoreOf(dels, "Fielder", "TeamB")!;
    expect(p.catches).toBe(1);
    expect(p.breakdown.fieldingPoints).toBe(C.fielding.catch);
  });

  it("3 catches in a match → catch bonus", () => {
    const dels = Array.from({ length: 3 }, () =>
      del(0, { bowlerName: "Bowl", isWicket: true, dismissalType: "caught", fielderName: "Fielder" }));
    const p = scoreOf(dels, "Fielder", "TeamB")!;
    expect(p.catches).toBe(3);
    expect(p.breakdown.fieldingPoints).toBe(3 * C.fielding.catch + C.fielding.threeCatchBonus);
  });

  it("stumping credited to keeper", () => {
    const dels = [del(0, { bowlerName: "Bowl", isWicket: true, dismissalType: "stumped", fielderName: "Keeper" })];
    const p = scoreOf(dels, "Keeper", "TeamB")!;
    expect(p.breakdown.fieldingPoints).toBe(C.fielding.stumping);
  });

  it("direct run-out (single fielder)", () => {
    const dels = [del(0, { isWicket: true, dismissalType: "run_out", fielderName: "Fielder" })];
    const p = scoreOf(dels, "Fielder", "TeamB")!;
    expect(p.breakdown.fieldingPoints).toBe(C.fielding.directRunout);
  });

  it("assisted run-out (A/B) → both get assist points", () => {
    const dels = [del(0, { isWicket: true, dismissalType: "run_out", fielderName: "Thrower/Catcher" })];
    const a = scoreOf(dels, "Thrower", "TeamB")!;
    const b = scoreOf(dels, "Catcher", "TeamB")!;
    expect(a.breakdown.fieldingPoints).toBe(C.fielding.assistedRunout);
    expect(b.breakdown.fieldingPoints).toBe(C.fielding.assistedRunout);
  });
});

describe("mvp points — aggregation & config", () => {
  it("aggregates across two matches and counts matches distinctly", () => {
    const twoMatches = new Map([["innA", "mA"], ["innB", "mB"]]);
    const dels: ScoredDelivery[] = [
      del(0, { inningsId: "innA", batterName: "Star", runsOffBat: 6 }),
      del(0, { inningsId: "innB", batterName: "Star", runsOffBat: 4 }),
    ];
    const players = computeMvpPoints(dels, twoMatches, DEFAULT_MVP_POINTS_CONFIG);
    const star = players.find(p => p.name === "Star")!;
    expect(star.matches).toBe(2);
    expect(star.runs).toBe(10);
  });

  it("total points = batting + bowling + fielding; sorted desc", () => {
    const dels: ScoredDelivery[] = [
      // all-rounder: 6 runs, 1 wicket (bowled), 1 catch
      del(0, { batterName: "AR", runsOffBat: 6 }),
      del(0, { bowlerName: "AR", bowlingTeam: "TeamA", isWicket: true, dismissalType: "bowled", dismissedBatter: "z" }),
      del(0, { bowlerName: "X", bowlingTeam: "TeamA", isWicket: true, dismissalType: "caught", fielderName: "AR" }),
    ];
    const players = computeMvpPoints(dels, oneMatch, DEFAULT_MVP_POINTS_CONFIG);
    // AR appears twice (TeamA as batter and bowler/fielder are the same "TeamA" team here)
    const ar = players.find(p => p.name === "AR" && p.team === "TeamA")!;
    expect(ar.points).toBe(ar.breakdown.battingPoints + ar.breakdown.bowlingPoints + ar.breakdown.fieldingPoints);
    // sorted descending
    for (let i = 1; i < players.length; i++) expect(players[i - 1].points).toBeGreaterThanOrEqual(players[i].points);
  });

  it("resolveMvpConfig fills defaults for partial/invalid stored config", () => {
    const merged = resolveMvpConfig({ batting: { run: 2 } });
    expect(merged.batting.run).toBe(2);           // override kept
    expect(merged.batting.fourBonus).toBe(C.batting.fourBonus); // default filled
    expect(merged.bowling.wicket).toBe(C.bowling.wicket);
  });
});
