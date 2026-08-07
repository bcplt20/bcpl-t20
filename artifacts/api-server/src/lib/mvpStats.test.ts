/**
 * computeMvpStats — raw statistical leaders (no point system).
 *
 * Pure-function unit tests (no DB): verify runs/wickets/catches/sixes/fours
 * tallies, that run-outs never credit the bowler, that catches credit the
 * fielder on the bowling side, and the tie-break order (value desc → fewer
 * matches → name asc).
 */
import { describe, it, expect } from "vitest";
import { computeMvpStats, type ScoredDelivery } from "./mvpPoints";

/** Minimal delivery builder with sensible defaults. */
function del(p: Partial<ScoredDelivery>): ScoredDelivery {
  return {
    inningsId: "i1",
    overNumber: 0,
    batterName: "B",
    bowlerName: "Z",
    runsOffBat: 0,
    extrasRuns: 0,
    extraType: null,
    totalRuns: 0,
    isWicket: false,
    dismissalType: null,
    dismissedBatter: null,
    fielderName: null,
    battingTeam: "Alpha",
    bowlingTeam: "Beta",
    ...p,
  };
}

describe("computeMvpStats", () => {
  it("tallies runs, fours and sixes off the bat by batter+batting team", () => {
    const map = new Map([["i1", "m1"]]);
    const dels = [
      del({ batterName: "Rohit", runsOffBat: 4 }),
      del({ batterName: "Rohit", runsOffBat: 6 }),
      del({ batterName: "Rohit", runsOffBat: 1 }),
      del({ batterName: "Rohit", runsOffBat: 6 }),
    ];
    const s = computeMvpStats(dels, map);
    expect(s.mostRuns[0]).toMatchObject({ player: "Rohit", team: "Alpha", value: 17, matches: 1 });
    expect(s.mostSixes[0]).toMatchObject({ player: "Rohit", value: 2 });
    expect(s.mostFours[0]).toMatchObject({ player: "Rohit", value: 1 });
  });

  it("credits bowler wickets for bowled/lbw/caught/stumped but NOT run-outs", () => {
    const map = new Map([["i1", "m1"]]);
    const dels = [
      del({ bowlerName: "Bumrah", isWicket: true, dismissalType: "bowled", dismissedBatter: "X" }),
      del({ bowlerName: "Bumrah", isWicket: true, dismissalType: "lbw", dismissedBatter: "Y" }),
      del({ bowlerName: "Bumrah", isWicket: true, dismissalType: "caught", fielderName: "Kohli", dismissedBatter: "Z" }),
      del({ bowlerName: "Bumrah", isWicket: true, dismissalType: "stumped", fielderName: "Pant", dismissedBatter: "W" }),
      // run-out: must NOT credit any bowler
      del({ bowlerName: "Bumrah", isWicket: true, dismissalType: "run_out", fielderName: "Jadeja", dismissedBatter: "V" }),
    ];
    const s = computeMvpStats(dels, map);
    expect(s.mostWickets[0]).toMatchObject({ player: "Bumrah", team: "Beta", value: 4 });
    // Jadeja (run-out fielder) earns no catch and no wicket.
    expect(s.mostWickets.find((w) => w.player === "Jadeja")).toBeUndefined();
    expect(s.mostCatches.find((c) => c.player === "Jadeja")).toBeUndefined();
  });

  it("credits catches (only dismissalType=caught) to the fielder on the bowling side", () => {
    const map = new Map([["i1", "m1"]]);
    const dels = [
      del({ isWicket: true, dismissalType: "caught", fielderName: "Kohli", dismissedBatter: "X" }),
      del({ isWicket: true, dismissalType: "caught", fielderName: "Kohli", dismissedBatter: "Y" }),
      // stumping is not a catch
      del({ isWicket: true, dismissalType: "stumped", fielderName: "Kohli", dismissedBatter: "Z" }),
    ];
    const s = computeMvpStats(dels, map);
    expect(s.mostCatches[0]).toMatchObject({ player: "Kohli", team: "Beta", value: 2 });
  });

  it("breaks ties by fewer matches, then name ascending", () => {
    // Amar & Bharat both score 10 runs; Amar in 2 matches, Bharat in 1 → Bharat first.
    // Chetan also 10 runs in 1 match → tie with Bharat on value+matches → name asc (Bharat < Chetan).
    const map = new Map([["i1", "m1"], ["i2", "m2"]]);
    const dels = [
      del({ inningsId: "i1", batterName: "Amar", runsOffBat: 5 }),
      del({ inningsId: "i2", batterName: "Amar", runsOffBat: 5 }),
      del({ inningsId: "i1", batterName: "Bharat", runsOffBat: 10 }),
      del({ inningsId: "i1", batterName: "Chetan", runsOffBat: 10 }),
    ];
    const s = computeMvpStats(dels, map);
    const names = s.mostRuns.map((r) => r.player);
    expect(names).toEqual(["Bharat", "Chetan", "Amar"]);
    expect(s.mostRuns[0]).toMatchObject({ player: "Bharat", matches: 1 });
    expect(s.mostRuns[2]).toMatchObject({ player: "Amar", matches: 2 });
  });

  it("returns at most `limit` entries and omits zero-value players", () => {
    const map = new Map([["i1", "m1"]]);
    const dels: ScoredDelivery[] = [];
    for (let i = 0; i < 15; i++) dels.push(del({ batterName: `P${i}`, runsOffBat: i + 1 }));
    // A batter who only faced dots (0 runs) should not appear in mostRuns.
    dels.push(del({ batterName: "Ducky", runsOffBat: 0 }));
    const s = computeMvpStats(dels, map, 10);
    expect(s.mostRuns).toHaveLength(10);
    expect(s.mostRuns.find((r) => r.player === "Ducky")).toBeUndefined();
    // Highest first.
    expect(s.mostRuns[0].value).toBe(15);
  });

  it("aggregates a player across multiple matches and counts distinct matches", () => {
    const map = new Map([["i1", "m1"], ["i2", "m2"]]);
    const dels = [
      del({ inningsId: "i1", batterName: "Surya", runsOffBat: 6 }),
      del({ inningsId: "i2", batterName: "Surya", runsOffBat: 6 }),
    ];
    const s = computeMvpStats(dels, map);
    expect(s.mostRuns[0]).toMatchObject({ player: "Surya", value: 12, matches: 2 });
    expect(s.mostSixes[0]).toMatchObject({ player: "Surya", value: 2 });
  });
});
