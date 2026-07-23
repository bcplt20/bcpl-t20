/** Shared role handling for the Phase 1 pipeline.
 *  registrations.role has two historic formats ("bat" and "Batsman") — always
 *  normalise on read, everywhere. */
export type RoleKey = "bat" | "bowl" | "ar" | "wk";

export function normalizeRole(role: string | null | undefined): RoleKey {
  const r = (role ?? "").toLowerCase();
  if (r === "bowl" || r.startsWith("bowler")) return "bowl";
  if (r === "ar" || r.startsWith("all")) return "ar";
  if (r === "wk" || r.startsWith("wicket") || r.startsWith("keep")) return "wk";
  return "bat";
}

export const ROLE_LABELS: Record<RoleKey, string> = {
  bat: "BATSMAN",
  bowl: "BOWLER",
  ar: "ALL-ROUNDER",
  wk: "WICKETKEEPER",
};
