/**
 * Player classification (playing style) — website shared module.
 * Option lists (per role) + bilingual display labels. Mirrors the server's
 * validated shape (api-server src/lib/classification.ts) and the mobile app's
 * lib/classification.ts.
 */
import type { ClassificationValue } from "./api";

export type Lang = "en" | "hi";

export type BattingHand = "right" | "left";
export type BattingPosition = "opener" | "top_order" | "middle_order" | "lower_middle_order" | "finisher";
export type BattingStyle = "anchor" | "aggressive" | "power_hitter" | "defensive";
export type BowlingArm = "right" | "left";
export type BowlingType =
  | "fast" | "fast_medium" | "medium_fast" | "medium_pace"
  | "off_spin" | "leg_spin" | "orthodox_spin" | "wrist_spin";

export type CanonRole = "bat" | "bowl" | "ar" | "wk";

/** Canonicalise raw role codes (short + historic long formats) → bat|bowl|ar|wk. */
export function canonicalRole(role: string | null | undefined): CanonRole {
  const r = (role ?? "").trim().toLowerCase();
  if (r === "bowl" || r.startsWith("bowler")) return "bowl";
  if (r === "ar" || r.startsWith("all")) return "ar";
  if (r === "wk" || r.startsWith("wicket") || r.startsWith("keep")) return "wk";
  return "bat";
}

export const BATTING_HANDS: BattingHand[] = ["right", "left"];
export const BATTING_POSITIONS: BattingPosition[] = ["opener", "top_order", "middle_order", "lower_middle_order", "finisher"];
export const BATTING_STYLES: BattingStyle[] = ["anchor", "aggressive", "power_hitter", "defensive"];
export const BOWLING_ARMS: BowlingArm[] = ["right", "left"];
export const RIGHT_BOWLING_TYPES: BowlingType[] = ["fast", "fast_medium", "medium_fast", "medium_pace", "off_spin", "leg_spin"];
export const LEFT_BOWLING_TYPES: BowlingType[] = ["fast", "fast_medium", "medium_fast", "medium_pace", "orthodox_spin", "wrist_spin"];

export function bowlingTypesForArm(arm: BowlingArm): BowlingType[] {
  return arm === "right" ? RIGHT_BOWLING_TYPES : LEFT_BOWLING_TYPES;
}

type Bi = { en: string; hi: string };

const HAND: Record<BattingHand, Bi> = {
  right: { en: "Right-Hand", hi: "दाएँ हाथ के" },
  left: { en: "Left-Hand", hi: "बाएँ हाथ के" },
};
const POSITION: Record<BattingPosition, Bi> = {
  opener: { en: "Opener", hi: "ओपनर" },
  top_order: { en: "Top Order", hi: "टॉप ऑर्डर" },
  middle_order: { en: "Middle Order", hi: "मिडल ऑर्डर" },
  lower_middle_order: { en: "Lower Middle Order", hi: "लोअर मिडल ऑर्डर" },
  finisher: { en: "Finisher", hi: "फिनिशर" },
};
const STYLE: Record<BattingStyle, Bi> = {
  anchor: { en: "Anchor", hi: "एंकर" },
  aggressive: { en: "Aggressive", hi: "आक्रामक" },
  power_hitter: { en: "Power Hitter", hi: "पावर हिटर" },
  defensive: { en: "Defensive", hi: "रक्षात्मक" },
};
const ARM: Record<BowlingArm, Bi> = {
  right: { en: "Right-Arm", hi: "दाएँ हाथ से" },
  left: { en: "Left-Arm", hi: "बाएँ हाथ से" },
};
const BOWL_TYPE: Record<BowlingType, Bi> = {
  fast: { en: "Fast", hi: "तेज़" },
  fast_medium: { en: "Fast-Medium", hi: "फास्ट-मीडियम" },
  medium_fast: { en: "Medium-Fast", hi: "मीडियम-फास्ट" },
  medium_pace: { en: "Medium Pace", hi: "मीडियम पेस" },
  off_spin: { en: "Off Spin", hi: "ऑफ स्पिन" },
  leg_spin: { en: "Leg Spin", hi: "लेग स्पिन" },
  orthodox_spin: { en: "Orthodox Spin", hi: "ऑर्थोडॉक्स स्पिन" },
  wrist_spin: { en: "Wrist Spin (Chinaman)", hi: "रिस्ट स्पिन (चाइनामैन)" },
};

const pick = (b: Bi, lang: Lang) => (lang === "hi" ? b.hi : b.en);

export const handLabel = (h: BattingHand, lang: Lang) => pick(HAND[h], lang);
export const armLabel = (a: BowlingArm, lang: Lang) => pick(ARM[a], lang);
export const styleLabel = (s: BattingStyle, lang: Lang) => pick(STYLE[s], lang);
export const bowlingTypeLabel = (b: BowlingType, lang: Lang) => pick(BOWL_TYPE[b], lang);

export function positionLabel(role: string | null | undefined, p: BattingPosition, lang: Lang): string {
  if (p === "finisher" && canonicalRole(role) === "bat") {
    return lang === "hi" ? "फिनिशर (पावर हिटर)" : "Finisher (Power Hitter)";
  }
  return pick(POSITION[p], lang);
}

export function battingSummary(role: string | null | undefined, c: ClassificationValue, lang: Lang): string | null {
  if (!c.battingHand || !c.battingPosition) return null;
  const noun = lang === "hi" ? "बल्लेबाज़" : "Batsman";
  const parts = [`${pick(HAND[c.battingHand], lang)} ${noun}`, positionLabel(role, c.battingPosition, lang)];
  if (c.battingStyle) parts.push(pick(STYLE[c.battingStyle], lang));
  return parts.join(" · ");
}

export function bowlingSummary(c: ClassificationValue, lang: Lang): string | null {
  if (!c.bowlingArm || !c.bowlingType) return null;
  return `${pick(ARM[c.bowlingArm], lang)} ${pick(BOWL_TYPE[c.bowlingType], lang)}`;
}

export function isClassificationComplete(role: string | null | undefined, c: ClassificationValue | null | undefined): boolean {
  if (!c) return false;
  const r = canonicalRole(role);
  const needsBat = r === "bat" || r === "wk" || r === "ar";
  const needsBowl = r === "bowl" || r === "ar";
  if (needsBat && (!c.battingHand || !c.battingPosition)) return false;
  if (needsBowl && (!c.bowlingArm || !c.bowlingType)) return false;
  if (needsBowl && c.bowlingArm && c.bowlingType && !bowlingTypesForArm(c.bowlingArm).includes(c.bowlingType)) return false;
  return true;
}
