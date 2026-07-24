/**
 * existingTables() — the drift probe that lets match delete survive a
 * database missing the scoring tables (prod lagged dev for months).
 * Guards the per-element IN binding (a raw `${array}::text[]` bind here
 * silently becomes ONE malformed string parameter — past incident).
 */
import { describe, it, expect } from "vitest";
import { existingTables } from "./matches";

describe("existingTables", () => {
  it("reports present tables and omits missing ones", async () => {
    const have = await existingTables([
      "innings",
      "deliveries",
      "definitely_not_a_real_table_xyz",
    ]);
    expect(have.has("innings")).toBe(true);
    expect(have.has("deliveries")).toBe(true);
    expect(have.has("definitely_not_a_real_table_xyz")).toBe(false);
  });

  it("returns an empty set for empty input without querying", async () => {
    expect((await existingTables([])).size).toBe(0);
  });
});
