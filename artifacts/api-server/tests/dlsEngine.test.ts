/**
 * DLS Standard Edition unit tests (src/lib/dls.ts).
 *
 * Resource-table spot checks against published DLS Standard Edition values,
 * plus target/par worked examples.
 */
import { describe, it, expect } from "vitest";
import { resourcePct, dlsTarget, dlsPar, availableResource, T20_START_RESOURCE } from "../src/lib/dls";

describe("DLS resource table spot checks (Standard Edition, 50-over relative %)", () => {
  it("matches published cells", () => {
    expect(resourcePct(50, 0)).toBe(100);      // full innings
    expect(resourcePct(20, 0)).toBe(56.6);     // T20 start
    expect(resourcePct(10, 0)).toBe(32.1);
    expect(resourcePct(30, 0)).toBe(75.1);
    expect(resourcePct(20, 5)).toBe(37.2);
    expect(resourcePct(5, 0)).toBe(17.2);
    expect(resourcePct(0, 0)).toBe(0);
  });

  it("all out (10 wickets) → 0 resource regardless of overs", () => {
    expect(resourcePct(15, 10)).toBe(0);
    expect(resourcePct(20, 10)).toBe(0);
  });

  it("T20 starting resource constant is 56.6", () => {
    expect(T20_START_RESOURCE).toBe(56.6);
  });

  it("interpolates fractional overs between whole-over rows (17.3 = 17.5 decimal)", () => {
    // Between R(17,0)=49.9 and R(18,0)=52.2, halfway ≈ 51.05.
    const v = resourcePct(17.3, 0); // 17 overs 3 balls = 17.5 true decimal
    expect(v).toBeGreaterThan(49.9);
    expect(v).toBeLessThan(52.2);
    expect(v).toBeCloseTo((49.9 + 52.2) / 2, 1);
  });
});

describe("DLS revised target (Standard Edition formula)", () => {
  it("R2 <= R1: Target = floor(S * R2/R1) + 1", () => {
    // Team1 150 off full 20 (R1=56.6). Team2 reduced to 10 overs before start (R2=32.1).
    // floor(150 * 32.1/56.6) + 1 = floor(85.07)+1 = 86.
    expect(dlsTarget({ team1Score: 150, team1Resource: 56.6, team2Resource: 32.1 })).toBe(86);
  });

  it("equal resource → target = score + 1", () => {
    expect(dlsTarget({ team1Score: 160, team1Resource: 56.6, team2Resource: 56.6 })).toBe(161);
  });

  it("R2 > R1 (team2 has more resource) → adds a G-based increment", () => {
    const t = dlsTarget({ team1Score: 140, team1Resource: 40, team2Resource: 56.6 });
    expect(t).toBeGreaterThan(141); // strictly more than score+1
  });
});

describe("DLS par score", () => {
  it("par rises as the chasing side consumes resource", () => {
    // Team1 150 off full 20 (R1=56.6); team2 has full 20 (R2=56.6).
    // At start (20 overs left, 0 wickets) resource used = 0 → par 0.
    const parStart = dlsPar(150, 56.6, 56.6, 20, 0);
    expect(parStart).toBe(0);
    // Halfway-ish: 10 overs left, 0 wickets → used = 56.6 - 32.1 = 24.5.
    // par = floor(150 * 24.5/56.6) = floor(64.9) = 64.
    const parMid = dlsPar(150, 56.6, 56.6, 10, 0);
    expect(parMid).toBe(Math.floor((150 * (56.6 - 32.1)) / 56.6));
    // At the very end (0 overs left) used = full R2 → par ≈ full score.
    const parEnd = dlsPar(150, 56.6, 56.6, 0, 0);
    expect(parEnd).toBe(150);
  });

  it("wickets lost raises resource consumed → higher par at same overs", () => {
    const par0w = dlsPar(150, 56.6, 56.6, 10, 0);
    const par5w = dlsPar(150, 56.6, 56.6, 10, 5);
    expect(par5w).toBeGreaterThan(par0w);
  });
});

describe("availableResource with interruptions", () => {
  it("no interruptions → full allocation resource", () => {
    expect(availableResource(20, [])).toBe(56.6);
  });

  it("a mid-innings stoppage removes the lost resource", () => {
    // Stop with 10 overs left at 2 wickets, resume with 6 overs left.
    // lost = R(10,2) - R(6,2). available = R(20,0) - lost.
    const lost = resourcePct(10, 2) - resourcePct(6, 2);
    expect(availableResource(20, [
      { oversLeftAtStop: 10, wicketsLostAtStop: 2, oversLeftAtResume: 6 },
    ])).toBeCloseTo(Math.round((56.6 - lost) * 100) / 100, 2);
  });
});
