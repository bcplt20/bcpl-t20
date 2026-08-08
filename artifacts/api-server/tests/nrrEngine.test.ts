/**
 * ICC Net Run Rate unit tests (src/lib/pointsEngine.ts).
 *
 * Pure aggregator tests with hand-built innings fixtures — no DB. Includes:
 *  - a known worked ICC example (two matches)
 *  - the all-out rule (full allotted overs counted, not actual)
 *  - decimal-overs conversion (17.3 ov = 17.5)
 *  - DLS revised-overs allocation used as the denominator
 *  - points: win=2, tie/no-result=1 each, loss=0
 */
import { describe, it, expect } from "vitest";
import { aggregateStandings, oversToDecimal, inningsOversForNrr } from "../src/lib/pointsEngine";

type InnRow = Parameters<typeof aggregateStandings>[1] extends Map<string, infer T> ? T extends Array<infer U> ? U : never : never;

let uid = 0;
function match(team1: string, team2: string, winner: string | null): any {
  return { id: "m" + ++uid, season: 1, team1, team2, status: "completed", winner, resultDesc: "", dlsApplied: false };
}
function inn(matchId: string, bat: string, bowl: string, runs: number, wkts: number, overs: number, balls: number, extra?: { revisedOvers?: number; originalOvers?: number }): any {
  return {
    id: matchId + ":" + bat, matchId, inningsNumber: 1, battingTeam: bat, bowlingTeam: bowl,
    totalRuns: runs, totalWickets: wkts, overs, balls, extras: 0, target: null,
    originalOvers: extra?.originalOvers ?? 20, revisedOvers: extra?.revisedOvers ?? null,
    dlsInterruptions: [], status: "completed",
  };
}

describe("overs conversion + all-out rule", () => {
  it("converts 17.3 overs to 17.5 decimal", () => {
    expect(oversToDecimal(17, 3)).toBe(17.5);
    expect(oversToDecimal(20, 0)).toBe(20);
  });
  it("counts full allocation when a side is bowled out", () => {
    // 120 all out in 18.2 overs → NRR counts the full 20 overs.
    expect(inningsOversForNrr(10, 18, 2, 20)).toBe(20);
    // Not all out → actual overs.
    expect(inningsOversForNrr(6, 18, 2, 20)).toBe(oversToDecimal(18, 2));
  });
});

describe("aggregateStandings NRR", () => {
  it("computes NRR across matches summing runs/overs (not averaging)", () => {
    // Match 1: A 160/5 (20) beats B 150/8 (20).
    const m1 = match("A", "B", "A");
    const byMatch = new Map<string, any[]>();
    byMatch.set(m1.id, [inn(m1.id, "A", "B", 160, 5, 20, 0), inn(m1.id, "B", "A", 150, 8, 20, 0)]);
    // Match 2: A 140/10 (all out, 18.2) loses to C 141/3 (17.3).
    const m2 = match("A", "C", "C");
    byMatch.set(m2.id, [inn(m2.id, "A", "C", 140, 10, 18, 2), inn(m2.id, "C", "A", 141, 3, 17, 3)]);

    const table = aggregateStandings([m1, m2], byMatch);
    const A = table.find((t) => t.team === "A")!;
    const B = table.find((t) => t.team === "B")!;
    const C = table.find((t) => t.team === "C")!;

    // A scored 160 (20 ov) + 140 (ALL OUT → 20 ov) = 300 runs in 40 overs.
    // A conceded 150 (20) + 141 (17.3=17.5) = 291 in 37.5 overs.
    const aScored = 300 / 40;
    const aConceded = 291 / 37.5;
    expect(A.nrr).toBeCloseTo(Math.round((aScored - aConceded) * 1000) / 1000, 3);
    expect(A.played).toBe(2);
    expect(A.won).toBe(1);
    expect(A.lost).toBe(1);
    expect(A.points).toBe(2);

    // B: scored 150/20, conceded 160/20 → negative NRR.
    expect(B.nrr).toBeCloseTo(Math.round((150 / 20 - 160 / 20) * 1000) / 1000, 3);
    expect(B.points).toBe(0);

    // C beat A → 2 pts.
    expect(C.won).toBe(1);
    expect(C.points).toBe(2);
  });

  it("all-out denominator matters: 100 all out in 10 overs counts as 20 overs", () => {
    const m = match("X", "Y", "Y");
    const byMatch = new Map<string, any[]>();
    // X all out 100 in 10 overs; Y 101/2 in 12 overs.
    byMatch.set(m.id, [inn(m.id, "X", "Y", 100, 10, 10, 0), inn(m.id, "Y", "X", 101, 2, 12, 0)]);
    const table = aggregateStandings([m], byMatch);
    const X = table.find((t) => t.team === "X")!;
    // X run rate scored = 100/20 (full quota), NOT 100/10.
    expect(X.oversFaced).toBe(20);
    expect(X.nrr).toBeCloseTo(Math.round((100 / 20 - 101 / 12) * 1000) / 1000, 3);
  });

  it("DLS revised overs is used as the denominator", () => {
    const m = match("P", "Q", "P");
    m.dlsApplied = true;
    const byMatch = new Map<string, any[]>();
    // Q chased in a rain-reduced innings: 90/4 in 10 overs, revised allocation 10.
    byMatch.set(m.id, [
      inn(m.id, "P", "Q", 120, 6, 20, 0),
      inn(m.id, "Q", "P", 90, 4, 10, 0, { revisedOvers: 10 }),
    ]);
    const table = aggregateStandings([m], byMatch);
    const Q = table.find((t) => t.team === "Q")!;
    // Not all out → actual overs (10), which equals revised allocation here.
    expect(Q.oversFaced).toBe(10);
  });

  it("DLS: reduction DURING innings 1 → side batting first charged its REVISED allocation", () => {
    // Rain mid innings-1: side1 gets only 15 overs, finishes 130/6 in 15.
    // Side2 chases full-ish (revised) 15 overs, 110/8 in 15 (not all out).
    const m = match("D1", "D2", "D2");
    m.dlsApplied = true;
    const byMatch = new Map<string, any[]>();
    byMatch.set(m.id, [
      inn(m.id, "D1", "D2", 130, 6, 15, 0, { revisedOvers: 15 }),
      inn(m.id, "D2", "D1", 110, 8, 15, 0, { revisedOvers: 15 }),
    ]);
    const table = aggregateStandings([m], byMatch);
    const D1 = table.find((t) => t.team === "D1")!;
    // Charged 15 overs (its revised allocation), NOT 20 and NOT actual-if-different.
    expect(D1.oversFaced).toBe(15);
    expect(D1.nrr).toBeCloseTo(Math.round((130 / 15 - 110 / 15) * 1000) / 1000, 3);
  });

  it("DLS: reduction BEFORE innings 2 → chasing side charged its revised quota", () => {
    // Side1 full 20 → 170/5. Rain in the break: chase cut to 12 overs.
    // Side2 90/3 in 12 (used full revised quota, innings closed at limit).
    const m = match("E1", "E2", "E1");
    m.dlsApplied = true;
    const byMatch = new Map<string, any[]>();
    byMatch.set(m.id, [
      inn(m.id, "E1", "E2", 170, 5, 20, 0),
      inn(m.id, "E2", "E1", 90, 3, 12, 0, { revisedOvers: 12 }),
    ]);
    const table = aggregateStandings([m], byMatch);
    const E2 = table.find((t) => t.team === "E2")!;
    expect(E2.oversFaced).toBe(12); // revised quota, not 20
    expect(E2.nrr).toBeCloseTo(Math.round((90 / 12 - 170 / 20) * 1000) / 1000, 3);
  });

  it("DLS: all-out in a reduced innings still counts the REVISED allocation, not 20", () => {
    // Chase reduced to 12 overs; side2 all out for 80 in 9.4 overs.
    // NRR must charge the full REVISED 12 overs (all-out rule uses allocation).
    const m = match("F1", "F2", "F1");
    m.dlsApplied = true;
    const byMatch = new Map<string, any[]>();
    byMatch.set(m.id, [
      inn(m.id, "F1", "F2", 150, 6, 20, 0),
      inn(m.id, "F2", "F1", 80, 10, 9, 4, { revisedOvers: 12 }),
    ]);
    const table = aggregateStandings([m], byMatch);
    const F2 = table.find((t) => t.team === "F2")!;
    expect(F2.oversFaced).toBe(12); // revised allocation, NOT 20 and NOT 9.67
  });

  it("tie / no-result splits a point each", () => {
    const m = match("T1", "T2", null); // no winner → no-result/tie
    const byMatch = new Map<string, any[]>();
    byMatch.set(m.id, [inn(m.id, "T1", "T2", 150, 6, 20, 0), inn(m.id, "T2", "T1", 150, 7, 20, 0)]);
    const table = aggregateStandings([m], byMatch);
    const T1 = table.find((t) => t.team === "T1")!;
    const T2 = table.find((t) => t.team === "T2")!;
    expect(T1.noResult).toBe(1);
    expect(T2.noResult).toBe(1);
    expect(T1.points).toBe(1);
    expect(T2.points).toBe(1);
  });

  it("sorts by points then NRR", () => {
    const m1 = match("H", "L", "H");
    const m2 = match("H", "M", "H");
    const byMatch = new Map<string, any[]>();
    byMatch.set(m1.id, [inn(m1.id, "H", "L", 200, 4, 20, 0), inn(m1.id, "L", "H", 120, 10, 15, 0)]);
    byMatch.set(m2.id, [inn(m2.id, "H", "M", 180, 5, 20, 0), inn(m2.id, "M", "H", 170, 8, 20, 0)]);
    const table = aggregateStandings([m1, m2], byMatch);
    expect(table[0].team).toBe("H"); // most points
    expect(table[0].points).toBe(4);
  });
});
