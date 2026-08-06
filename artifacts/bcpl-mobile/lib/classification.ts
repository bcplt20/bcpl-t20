/**
 * Player classification (playing style) — mobile shared module.
 * Option lists (per role) + bilingual display labels. Mirrors the server's
 * validated shape (api-server src/lib/classification.ts) and the website's
 * src/lib/classification.ts.
 */
import { canonicalRole } from './roleLabel';

export type BattingHand = 'right' | 'left';
export type BattingPosition = 'opener' | 'top_order' | 'middle_order' | 'lower_middle_order' | 'finisher';
export type BattingStyle = 'anchor' | 'aggressive' | 'power_hitter' | 'defensive';
export type BowlingArm = 'right' | 'left';
export type BowlingType =
  | 'fast' | 'fast_medium' | 'medium_fast' | 'medium_pace'
  | 'off_spin' | 'leg_spin' | 'orthodox_spin' | 'wrist_spin';

export interface Classification {
  battingHand?: BattingHand;
  battingPosition?: BattingPosition;
  battingStyle?: BattingStyle;
  bowlingArm?: BowlingArm;
  bowlingType?: BowlingType;
}

export const BATTING_POSITIONS: BattingPosition[] = [
  'opener', 'top_order', 'middle_order', 'lower_middle_order', 'finisher',
];
export const BATTING_STYLES: BattingStyle[] = ['anchor', 'aggressive', 'power_hitter', 'defensive'];
export const RIGHT_BOWLING_TYPES: BowlingType[] = ['fast', 'fast_medium', 'medium_fast', 'medium_pace', 'off_spin', 'leg_spin'];
export const LEFT_BOWLING_TYPES: BowlingType[] = ['fast', 'fast_medium', 'medium_fast', 'medium_pace', 'orthodox_spin', 'wrist_spin'];

export function bowlingTypesForArm(arm: BowlingArm): BowlingType[] {
  return arm === 'right' ? RIGHT_BOWLING_TYPES : LEFT_BOWLING_TYPES;
}

type Lang = 'en' | 'hi';
type Bi = { en: string; hi: string };

const HAND: Record<BattingHand, Bi> = {
  right: { en: 'Right-Hand', hi: 'दाएँ हाथ के' },
  left: { en: 'Left-Hand', hi: 'बाएँ हाथ के' },
};
const POSITION: Record<BattingPosition, Bi> = {
  opener: { en: 'Opener', hi: 'ओपनर' },
  top_order: { en: 'Top Order', hi: 'टॉप ऑर्डर' },
  middle_order: { en: 'Middle Order', hi: 'मिडल ऑर्डर' },
  lower_middle_order: { en: 'Lower Middle Order', hi: 'लोअर मिडल ऑर्डर' },
  finisher: { en: 'Finisher', hi: 'फिनिशर' },
};
const STYLE: Record<BattingStyle, Bi> = {
  anchor: { en: 'Anchor', hi: 'एंकर' },
  aggressive: { en: 'Aggressive', hi: 'आक्रामक' },
  power_hitter: { en: 'Power Hitter', hi: 'पावर हिटर' },
  defensive: { en: 'Defensive', hi: 'रक्षात्मक' },
};
const ARM: Record<BowlingArm, Bi> = {
  right: { en: 'Right-Arm', hi: 'दाएँ हाथ से' },
  left: { en: 'Left-Arm', hi: 'बाएँ हाथ से' },
};
const BOWL_TYPE: Record<BowlingType, Bi> = {
  fast: { en: 'Fast', hi: 'तेज़' },
  fast_medium: { en: 'Fast-Medium', hi: 'फास्ट-मीडियम' },
  medium_fast: { en: 'Medium-Fast', hi: 'मीडियम-फास्ट' },
  medium_pace: { en: 'Medium Pace', hi: 'मीडियम पेस' },
  off_spin: { en: 'Off Spin', hi: 'ऑफ स्पिन' },
  leg_spin: { en: 'Leg Spin', hi: 'लेग स्पिन' },
  orthodox_spin: { en: 'Orthodox Spin', hi: 'ऑर्थोडॉक्स स्पिन' },
  wrist_spin: { en: 'Wrist Spin (Chinaman)', hi: 'रिस्ट स्पिन (चाइनामैन)' },
};

const pick = (b: Bi, lang: Lang) => (lang === 'hi' ? b.hi : b.en);

/* ── Option label helpers (for the form chips) ─────────────────────────── */
export const handLabel = (h: BattingHand, lang: Lang) => pick(HAND[h], lang);
export const armLabel = (a: BowlingArm, lang: Lang) => pick(ARM[a], lang);
export const styleLabel = (s: BattingStyle, lang: Lang) => pick(STYLE[s], lang);
export const bowlingTypeLabel = (b: BowlingType, lang: Lang) => pick(BOWL_TYPE[b], lang);

export function positionLabel(role: string | null | undefined, p: BattingPosition, lang: Lang): string {
  // Pure batsmen see "Finisher (Power Hitter)"; wk/ar see plain "Finisher".
  if (p === 'finisher' && canonicalRole(role) === 'bat') {
    return lang === 'hi' ? 'फिनिशर (पावर हिटर)' : 'Finisher (Power Hitter)';
  }
  return pick(POSITION[p], lang);
}

/* ── Composed display labels (for profile / summaries) ─────────────────── */
export function battingSummary(role: string | null | undefined, c: Classification, lang: Lang): string | null {
  if (!c.battingHand || !c.battingPosition) return null;
  const noun = lang === 'hi' ? 'बल्लेबाज़' : 'Batsman';
  const line = `${pick(HAND[c.battingHand], lang)} ${noun}`;
  const pos = positionLabel(role, c.battingPosition, lang);
  const parts = [line, pos];
  if (c.battingStyle) parts.push(pick(STYLE[c.battingStyle], lang));
  return parts.join(' · ');
}

export function bowlingSummary(c: Classification, lang: Lang): string | null {
  if (!c.bowlingArm || !c.bowlingType) return null;
  return `${pick(ARM[c.bowlingArm], lang)} ${pick(BOWL_TYPE[c.bowlingType], lang)}`;
}

/** Is a stored classification complete for the given role? (client mirror). */
export function isClassificationComplete(role: string | null | undefined, c: Classification | null | undefined): boolean {
  if (!c) return false;
  const r = canonicalRole(role);
  const needsBat = r === 'bat' || r === 'wk' || r === 'ar';
  const needsBowl = r === 'bowl' || r === 'ar';
  if (needsBat && (!c.battingHand || !c.battingPosition)) return false;
  if (needsBowl && (!c.bowlingArm || !c.bowlingType)) return false;
  if (needsBowl && c.bowlingArm && c.bowlingType) {
    if (!bowlingTypesForArm(c.bowlingArm).includes(c.bowlingType)) return false;
  }
  return true;
}
