/**
 * Player classification (playing style) — SINGLE source of truth for the
 * validated shape + display labels on the API side.
 *
 * Stored on registrations.classification (jsonb), role-shaped. The registration
 * role must be canonicalised (bat|bowl|wk|ar) before validating, so historic
 * long role codes ("Batsman", "wicketkeeper_batsman", …) resolve correctly.
 */
import { z } from "zod";
import { normalizeRole, type RoleKey } from "./phase1Roles";

/* ── Enums ─────────────────────────────────────────────────────────────── */
export const BATTING_HANDS = ["right", "left"] as const;
export const BATTING_POSITIONS = [
  "opener", "top_order", "middle_order", "lower_middle_order", "finisher",
] as const;
export const BATTING_STYLES = ["anchor", "aggressive", "power_hitter", "defensive"] as const;
export const BOWLING_ARMS = ["right", "left"] as const;
export const RIGHT_BOWLING_TYPES = [
  "fast", "fast_medium", "medium_fast", "medium_pace", "off_spin", "leg_spin",
] as const;
export const LEFT_BOWLING_TYPES = [
  "fast", "fast_medium", "medium_fast", "medium_pace", "orthodox_spin", "wrist_spin",
] as const;
export const ALL_BOWLING_TYPES = [
  "fast", "fast_medium", "medium_fast", "medium_pace",
  "off_spin", "leg_spin", "orthodox_spin", "wrist_spin",
] as const;

export type BattingHand = (typeof BATTING_HANDS)[number];
export type BattingPosition = (typeof BATTING_POSITIONS)[number];
export type BattingStyle = (typeof BATTING_STYLES)[number];
export type BowlingArm = (typeof BOWLING_ARMS)[number];
export type BowlingType = (typeof ALL_BOWLING_TYPES)[number];

export interface Classification {
  battingHand?: BattingHand;
  battingPosition?: BattingPosition;
  battingStyle?: BattingStyle;
  bowlingArm?: BowlingArm;
  bowlingType?: BowlingType;
}

/* ── Validation ────────────────────────────────────────────────────────── */
/* The batting/bowling requirements depend on the (canonical) role, so we build
 * the schema per role and validate the wrong-arm bowling-type combination in a
 * superRefine. */
export function classificationSchemaFor(roleRaw: string | null | undefined) {
  const role = normalizeRole(roleRaw);
  const needsBatting = role === "bat" || role === "wk" || role === "ar";
  const needsBowling = role === "bowl" || role === "ar";

  const base = z.object({
    battingHand: z.enum(BATTING_HANDS).optional(),
    battingPosition: z.enum(BATTING_POSITIONS).optional(),
    battingStyle: z.enum(BATTING_STYLES).optional(),
    bowlingArm: z.enum(BOWLING_ARMS).optional(),
    bowlingType: z.enum(ALL_BOWLING_TYPES).optional(),
  }).strict();

  return base.superRefine((v, ctx) => {
    if (needsBatting) {
      if (!v.battingHand) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["battingHand"], message: "Batting hand is required" });
      }
      if (!v.battingPosition) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["battingPosition"], message: "Batting position is required" });
      }
      // battingStyle is only meaningful (and only optional) for wicketkeepers.
      if (v.battingStyle && role !== "wk") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["battingStyle"], message: "Batting style applies to wicketkeepers only" });
      }
    } else if (v.battingHand || v.battingPosition || v.battingStyle) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["battingHand"], message: "Batting fields do not apply to this role" });
    }

    if (needsBowling) {
      if (!v.bowlingArm) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bowlingArm"], message: "Bowling arm is required" });
      }
      if (!v.bowlingType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bowlingType"], message: "Bowling type is required" });
      }
      // Reject wrong-arm bowling types (e.g. leg_spin only valid right-arm).
      if (v.bowlingArm && v.bowlingType) {
        const allowed = v.bowlingArm === "right" ? RIGHT_BOWLING_TYPES : LEFT_BOWLING_TYPES;
        if (!(allowed as readonly string[]).includes(v.bowlingType)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bowlingType"], message: "Bowling type is not valid for the selected arm" });
        }
      }
    } else if (v.bowlingArm || v.bowlingType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bowlingArm"], message: "Bowling fields do not apply to this role" });
    }
  });
}

/** Is a stored classification value valid & complete for the registration role? */
export function isClassificationComplete(roleRaw: string | null | undefined, value: unknown): boolean {
  if (value == null || typeof value !== "object") return false;
  return classificationSchemaFor(roleRaw).safeParse(value).success;
}

/* ── Labels (EN) — for admin panel + emails. ───────────────────────────── */
const BATTING_HAND_EN: Record<BattingHand, string> = { right: "Right-Hand", left: "Left-Hand" };
const BATTING_POSITION_EN: Record<BattingPosition, string> = {
  opener: "Opener",
  top_order: "Top Order",
  middle_order: "Middle Order",
  lower_middle_order: "Lower Middle Order",
  finisher: "Finisher",
};
const BATTING_STYLE_EN: Record<BattingStyle, string> = {
  anchor: "Anchor",
  aggressive: "Aggressive",
  power_hitter: "Power Hitter",
  defensive: "Defensive",
};
const BOWLING_ARM_EN: Record<BowlingArm, string> = { right: "Right-Arm", left: "Left-Arm" };
const BOWLING_TYPE_EN: Record<string, string> = {
  fast: "Fast",
  fast_medium: "Fast-Medium",
  medium_fast: "Medium-Fast",
  medium_pace: "Medium Pace",
  off_spin: "Off Spin",
  leg_spin: "Leg Spin",
  orthodox_spin: "Orthodox Spin",
  wrist_spin: "Wrist Spin (Chinaman)",
};

/** Full batting label, e.g. "Right-Hand Batsman". */
export function battingLabelEn(role: RoleKey, c: Classification): string | null {
  if (!c.battingHand) return null;
  const noun = role === "wk" ? "Wicketkeeper Batsman" : role === "ar" ? "Batsman" : "Batsman";
  return `${BATTING_HAND_EN[c.battingHand]} ${noun}`;
}

/** Position label. For pure batsmen "Finisher (Power Hitter)"; wk/ar just "Finisher". */
export function battingPositionLabelEn(role: RoleKey, c: Classification): string | null {
  if (!c.battingPosition) return null;
  if (c.battingPosition === "finisher" && role === "bat") return "Finisher (Power Hitter)";
  return BATTING_POSITION_EN[c.battingPosition];
}

export function battingStyleLabelEn(c: Classification): string | null {
  return c.battingStyle ? BATTING_STYLE_EN[c.battingStyle] : null;
}

/** Full bowling label, e.g. "Right-Arm Off Spin", "Left-Arm Wrist Spin (Chinaman)". */
export function bowlingLabelEn(c: Classification): string | null {
  if (!c.bowlingArm || !c.bowlingType) return null;
  return `${BOWLING_ARM_EN[c.bowlingArm]} ${BOWLING_TYPE_EN[c.bowlingType] ?? c.bowlingType}`;
}

/** Compact admin label, e.g. "RHB · Opener" and/or "Right-Arm Off Spin". */
export function compactLabelEn(roleRaw: string | null | undefined, value: unknown): string {
  if (!isClassificationComplete(roleRaw, value)) return "—";
  const role = normalizeRole(roleRaw);
  const c = value as Classification;
  const parts: string[] = [];
  if (c.battingHand && c.battingPosition) {
    const hand = c.battingHand === "right" ? "RHB" : "LHB";
    const pos = BATTING_POSITION_EN[c.battingPosition];
    parts.push(`${hand} · ${pos}`);
  }
  const bowl = bowlingLabelEn(c);
  if (bowl) parts.push(bowl);
  return parts.length ? parts.join(" | ") : "—";
}
