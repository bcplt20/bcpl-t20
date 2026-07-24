/**
 * QR Trial Ops — pure scoring-engine unit tests (no DB).
 * Covers the 100-point rubric computation, six-ball objective scaling,
 * feeder-error exclusion (via outcome maps), and gate time parsing.
 */
import { describe, it, expect } from "vitest";
import {
  computeObjectivePoints, computeEvalTotal, requiredDisciplines,
  parseTimeMinutes, parseSlotDateIst,
  DEFAULT_RUBRICS, OUTCOME_POINTS, RUBRIC_VERSION,
} from "../src/routes/staffTrials";

const perfectTech = (role: string): Record<string, number> =>
  Object.fromEntries(DEFAULT_RUBRICS[role]!.technical.map((d) => [d.key, 10]));

const six = (o: string): string[] => Array(6).fill(o);

describe("computeObjectivePoints", () => {
  it("perfect batting six = full weight", () => {
    expect(computeObjectivePoints(six("MIDDLED"), "batting", 40)).toBe(40);
  });
  it("perfect bowling six = full weight", () => {
    expect(computeObjectivePoints(six("TARGET_HIT"), "bowling", 45)).toBe(45);
  });
  it("mixed batting scales linearly", () => {
    // 3+2+1+0+3+2 = 11 of 18 → 11/18*40 = 24.44
    const outs = ["MIDDLED", "GOOD_CONTACT", "PARTIAL", "MISS", "MIDDLED", "GOOD_CONTACT"];
    expect(computeObjectivePoints(outs, "batting", 40)).toBe(24.44);
  });
  it("NEAR_TARGET = half of TARGET_HIT", () => {
    // 6×1.5 = 9 of 18 → half weight
    expect(computeObjectivePoints(six("NEAR_TARGET"), "bowling", 45)).toBe(22.5);
  });
  it("all misses = 0", () => {
    expect(computeObjectivePoints(six("MISS"), "batting", 40)).toBe(0);
    expect(computeObjectivePoints(six("MISS"), "bowling", 45)).toBe(0);
  });
  it("unknown outcomes count 0, extra attempts beyond 6 ignored", () => {
    expect(computeObjectivePoints([...six("MIDDLED"), "MIDDLED", "MIDDLED"], "batting", 40)).toBe(40);
    expect(computeObjectivePoints(six("WHATEVER"), "batting", 40)).toBe(0);
  });
});

describe("requiredDisciplines", () => {
  it("maps roles to assessed disciplines", () => {
    expect(requiredDisciplines("batsman")).toEqual(["batting"]);
    expect(requiredDisciplines("wicket_keeper")).toEqual(["batting"]);
    expect(requiredDisciplines("bowler")).toEqual(["bowling"]);
    expect(requiredDisciplines("all_rounder")).toEqual(["batting", "bowling"]);
  });
});

describe("computeEvalTotal — 100-point ceilings per role", () => {
  it("batsman perfect = 100 (40 obj + 55 tech + 5 fielding)", () => {
    const r = computeEvalTotal("batsman", { batting: six("MIDDLED"), bowling: [] }, perfectTech("batsman"), DEFAULT_RUBRICS["batsman"]!, RUBRIC_VERSION);
    expect(r.total).toBe(100);
    expect(r.sections.objective["batting"]!.points).toBe(40);
  });
  it("bowler perfect = 100 (45 obj + 50 tech + 5 fielding)", () => {
    const r = computeEvalTotal("bowler", { batting: [], bowling: six("TARGET_HIT") }, perfectTech("bowler"), DEFAULT_RUBRICS["bowler"]!, RUBRIC_VERSION);
    expect(r.total).toBe(100);
  });
  it("all-rounder perfect = 100 (20+20 obj, 20+20 tech, 10 fielding, 10 consistency)", () => {
    const r = computeEvalTotal("all_rounder", { batting: six("MIDDLED"), bowling: six("TARGET_HIT") }, perfectTech("all_rounder"), DEFAULT_RUBRICS["all_rounder"]!, RUBRIC_VERSION);
    expect(r.total).toBe(100);
  });
  it("wicket-keeper perfect = 100 (10 batting + 90 keeping dims, per published rubric)", () => {
    const r = computeEvalTotal("wicket_keeper", { batting: six("MIDDLED"), bowling: [] }, perfectTech("wicket_keeper"), DEFAULT_RUBRICS["wicket_keeper"]!, RUBRIC_VERSION);
    expect(r.total).toBe(100);
  });
  it("half-point technical scores scale correctly", () => {
    const tech = { ...perfectTech("batsman"), balance: 7.5 }; // 7.5/10*11 = 8.25 → total 100 - 2.75
    const r = computeEvalTotal("batsman", { batting: six("MIDDLED"), bowling: [] }, tech, DEFAULT_RUBRICS["batsman"]!, RUBRIC_VERSION);
    expect(r.total).toBe(97.25);
    expect(r.sections.technical["balance"]!.points).toBe(8.25);
  });
  it("zero everything = 0", () => {
    const tech = Object.fromEntries(Object.keys(perfectTech("batsman")).map((k) => [k, 0]));
    const r = computeEvalTotal("batsman", { batting: six("MISS"), bowling: [] }, tech, DEFAULT_RUBRICS["batsman"]!, RUBRIC_VERSION);
    expect(r.total).toBe(0);
  });
});

describe("computeEvalTotal — validation", () => {
  it("rejects incomplete attempts", () => {
    expect(() => computeEvalTotal("batsman", { batting: six("MIDDLED").slice(0, 4), bowling: [] }, perfectTech("batsman"), DEFAULT_RUBRICS["batsman"]!, RUBRIC_VERSION))
      .toThrow(/incomplete/);
  });
  it("all-rounder needs BOTH disciplines complete", () => {
    expect(() => computeEvalTotal("all_rounder", { batting: six("MIDDLED"), bowling: [] }, perfectTech("all_rounder"), DEFAULT_RUBRICS["all_rounder"]!, RUBRIC_VERSION))
      .toThrow(/bowling attempts incomplete/);
  });
  it("rejects missing technical dimension", () => {
    const tech = perfectTech("batsman");
    delete (tech as Record<string, number>)["timing"];
    expect(() => computeEvalTotal("batsman", { batting: six("MIDDLED"), bowling: [] }, tech, DEFAULT_RUBRICS["batsman"]!, RUBRIC_VERSION))
      .toThrow(/Missing technical score/);
  });
  it("rejects out-of-range and unknown dims", () => {
    expect(() => computeEvalTotal("batsman", { batting: six("MIDDLED"), bowling: [] }, { ...perfectTech("batsman"), timing: 11 }, DEFAULT_RUBRICS["batsman"]!, RUBRIC_VERSION))
      .toThrow(/0–10/);
    expect(() => computeEvalTotal("batsman", { batting: six("MIDDLED"), bowling: [] }, { ...perfectTech("batsman"), sneaky: 5 }, DEFAULT_RUBRICS["batsman"]!, RUBRIC_VERSION))
      .toThrow(/Unknown technical dimension/);
  });
});

describe("rubric weights integrity", () => {
  it.each(Object.entries(DEFAULT_RUBRICS))("%s weights sum to exactly 100", (_role, rubric) => {
    const total = rubric.objective.reduce((a, o) => a + o.weight, 0) +
      rubric.technical.reduce((a, d) => a + d.weight, 0);
    expect(total).toBe(100);
  });
  it("outcome maps contain the spec verdicts", () => {
    expect(Object.keys(OUTCOME_POINTS["bowling"]!)).toEqual(["TARGET_HIT", "NEAR_TARGET", "MISS"]);
    expect(OUTCOME_POINTS["bowling"]!["NEAR_TARGET"]).toBe(1.5);
  });
});

describe("gate time helpers", () => {
  it("parses reporting times in common Indian formats", () => {
    expect(parseTimeMinutes("9:00 AM")).toBe(540);
    expect(parseTimeMinutes("12:15 pm")).toBe(735);
    expect(parseTimeMinutes("12:05 AM")).toBe(5);
    expect(parseTimeMinutes("18:30")).toBe(1110);
    expect(parseTimeMinutes("9 AM")).toBe(540);
    expect(parseTimeMinutes("7.30 am")).toBe(450);
  });
  it("returns null for junk (gate must not hard-fail)", () => {
    expect(parseTimeMinutes("morning")).toBeNull();
    expect(parseTimeMinutes("")).toBeNull();
    expect(parseTimeMinutes(null)).toBeNull();
    expect(parseTimeMinutes("25:99")).toBeNull();
  });
  it("parses ISO slot dates to IST calendar dates", () => {
    expect(parseSlotDateIst("2026-08-10")).toBe("2026-08-10");
    expect(parseSlotDateIst("not a date")).toBeNull();
    expect(parseSlotDateIst("")).toBeNull();
  });
});
