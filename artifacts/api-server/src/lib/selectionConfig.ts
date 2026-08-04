/**
 * Final 600 Selection Configuration (settings key `selection_config`).
 *
 * The engine NEVER hard-codes 600/100/30/30/30/10. Every quota is read from
 * this admin-approved configuration (spec: "The engine should read an approved
 * Selection Configuration."). Defaults reproduce the spec's EXACT default model:
 *
 *   5 zones × (30 bat / 30 bowl / 30 ar / 10 wk) = 500 guaranteed zonal
 *   + national wildcards (30 bat / 30 bowl / 30 ar / 10 wk) = 100
 *   = 600 total (180 bat / 180 bowl / 180 ar / 60 wk).
 *
 * Zone mapping: NO zone concept exists in the base schema — geography is
 * registrations.trial_city / trial_allocations.city. We map city → zone here.
 * The mapping is versioned; an unmapped city must surface as an exception and
 * NEVER silently default (the engine treats unmapped cities as ineligible and
 * records a SELECTION CONSTRAINT EXCEPTION style diagnostic).
 */
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { RoleKey } from "./phase1Roles";

export const SELECTION_CONFIG_KEY = "selection_config";
export const SELECTION_ALGORITHM_VERSION = "final600-v1";

export const ZONES = ["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"] as const;
export type Zone = (typeof ZONES)[number];

export const SELECTION_ROLES: RoleKey[] = ["bat", "bowl", "ar", "wk"];

/** Tie-breaker component identifiers (deterministic order per spec §Tie-breakers). */
export const TIE_BREAKERS = [
  "physical_score",        // 1. Physical Trial Score (raw, immutable)
  "role_critical",         // 2. Role-critical component score
  "consistency",           // 3. Consistency / control component
  "phase1_score",          // 4. Phase 1 score
  "deterministic_id",      // 5. Deterministic Trial ID / Player ID (always last, guarantees total order)
] as const;
export type TieBreaker = (typeof TIE_BREAKERS)[number];

const roleQuota = z.object({
  bat: z.number().int().min(0).max(100000),
  bowl: z.number().int().min(0).max(100000),
  ar: z.number().int().min(0).max(100000),
  wk: z.number().int().min(0).max(100000),
});

export const selectionConfigSchema = z.object({
  seasonKey: z.string().min(1).max(60).default("2026"),
  totalPool: z.number().int().min(1).max(1_000_000).default(600),
  /** per-zone role quotas (applied to EACH zone) */
  perZoneRoleQuota: roleQuota.default({ bat: 30, bowl: 30, ar: 30, wk: 10 }),
  /** national wildcard role quotas (from the remaining national pool) */
  wildcardRoleQuota: roleQuota.default({ bat: 30, bowl: 30, ar: 30, wk: 10 }),
  /** ordered deterministic tie-breakers — deterministic_id must remain last */
  tieBreakers: z.array(z.enum(TIE_BREAKERS)).min(1).default([...TIE_BREAKERS]),
  /** version tag for the active city→zone mapping (audit) */
  zoneMappingVersion: z.string().min(1).max(40).default("in-cities-v1"),
  /** city (lowercase) → zone. Overrides/extends DEFAULT_CITY_ZONE_MAP. */
  cityZoneMap: z.record(z.enum(ZONES)).default({}),
  /** metrics formula version stamped onto batch member derived metrics */
  metricsVersion: z.string().min(1).max(20).default("metrics-v1"),
}).strict();

export type SelectionConfig = z.infer<typeof selectionConfigSchema>;

/**
 * Sensible default Indian city → zone assignment. Keys are lowercase, trimmed.
 * Unmapped cities are NOT defaulted anywhere — they surface as exceptions.
 */
export const DEFAULT_CITY_ZONE_MAP: Record<string, Zone> = {
  // NORTH
  "delhi": "NORTH", "new delhi": "NORTH", "gurugram": "NORTH", "gurgaon": "NORTH",
  "noida": "NORTH", "faridabad": "NORTH", "chandigarh": "NORTH", "ludhiana": "NORTH",
  "amritsar": "NORTH", "jalandhar": "NORTH", "jaipur": "NORTH", "jodhpur": "NORTH",
  "udaipur": "NORTH", "lucknow": "NORTH", "kanpur": "NORTH", "agra": "NORTH",
  "meerut": "NORTH", "varanasi": "NORTH", "dehradun": "NORTH", "shimla": "NORTH",
  "jammu": "NORTH", "srinagar": "NORTH",
  // SOUTH
  "bengaluru": "SOUTH", "bangalore": "SOUTH", "chennai": "SOUTH", "hyderabad": "SOUTH",
  "kochi": "SOUTH", "cochin": "SOUTH", "thiruvananthapuram": "SOUTH", "trivandrum": "SOUTH",
  "coimbatore": "SOUTH", "madurai": "SOUTH", "mysuru": "SOUTH", "mysore": "SOUTH",
  "vijayawada": "SOUTH", "visakhapatnam": "SOUTH", "vizag": "SOUTH", "mangaluru": "SOUTH",
  "mangalore": "SOUTH", "hubli": "SOUTH", "warangal": "SOUTH",
  // EAST
  "kolkata": "EAST", "howrah": "EAST", "patna": "EAST", "ranchi": "EAST",
  "jamshedpur": "EAST", "bhubaneswar": "EAST", "cuttack": "EAST", "guwahati": "EAST",
  "siliguri": "EAST", "durgapur": "EAST", "asansol": "EAST", "gaya": "EAST",
  "dhanbad": "EAST", "shillong": "EAST", "imphal": "EAST", "agartala": "EAST",
  // WEST
  "mumbai": "WEST", "navi mumbai": "WEST", "thane": "WEST", "pune": "WEST",
  "nagpur": "WEST", "nashik": "WEST", "ahmedabad": "WEST", "surat": "WEST",
  "vadodara": "WEST", "rajkot": "WEST", "goa": "WEST", "panaji": "WEST",
  "aurangabad": "WEST", "kolhapur": "WEST", "gandhinagar": "WEST",
  // CENTRAL
  "bhopal": "CENTRAL", "indore": "CENTRAL", "gwalior": "CENTRAL", "jabalpur": "CENTRAL",
  "ujjain": "CENTRAL", "raipur": "CENTRAL", "bilaspur": "CENTRAL", "durg": "CENTRAL",
  "bhilai": "CENTRAL", "sagar": "CENTRAL",
};

/** Effective city→zone map = defaults merged with config overrides. Lowercase keys. */
export function effectiveCityZoneMap(cfg: SelectionConfig): Record<string, Zone> {
  const merged: Record<string, Zone> = { ...DEFAULT_CITY_ZONE_MAP };
  for (const [city, zone] of Object.entries(cfg.cityZoneMap ?? {})) {
    merged[city.trim().toLowerCase()] = zone;
  }
  return merged;
}

/** Parse/normalize a raw settings value into a full SelectionConfig (defaults applied). */
export function parseSelectionConfig(raw: unknown): SelectionConfig {
  return selectionConfigSchema.parse(raw ?? {});
}

/** Read the current selection config from site_settings (defaults if unset). */
export async function getSelectionConfig(): Promise<SelectionConfig> {
  const [row] = await db.select().from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, SELECTION_CONFIG_KEY)).limit(1);
  return parseSelectionConfig(row?.value);
}

/** Total target derived from quotas (should equal totalPool when consistent). */
export function computedTotal(cfg: SelectionConfig): number {
  const perZone = cfg.perZoneRoleQuota.bat + cfg.perZoneRoleQuota.bowl + cfg.perZoneRoleQuota.ar + cfg.perZoneRoleQuota.wk;
  const wild = cfg.wildcardRoleQuota.bat + cfg.wildcardRoleQuota.bowl + cfg.wildcardRoleQuota.ar + cfg.wildcardRoleQuota.wk;
  return perZone * ZONES.length + wild;
}
