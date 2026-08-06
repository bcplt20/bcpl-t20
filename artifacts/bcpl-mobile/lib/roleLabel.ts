/**
 * Canonical player-role vocabulary for the mobile app.
 *
 * Ported from the website's single source of truth (bcpl-website
 * src/lib/format.ts). Raw backend role codes — bat / bowl / ar / wk AND the
 * historic long formats still living on old registrations (wicketkeeper,
 * wicketkeeper_batsman, all_rounder, …) — must NEVER reach the UI. Route every
 * role display through roleLabel() so users only ever see full-word,
 * bilingual labels (never "WK").
 */

export type CanonicalRole = 'bat' | 'bowl' | 'ar' | 'wk';

const ROLE_EN: Record<string, string> = {
  bat: 'Batsman', batsman: 'Batsman',
  bowl: 'Bowler', bowler: 'Bowler',
  ar: 'All-Rounder', allrounder: 'All-Rounder', all_rounder: 'All-Rounder', 'all-rounder': 'All-Rounder',
  wk: 'Wicket Keeper', wicketkeeper: 'Wicket Keeper', wicket_keeper: 'Wicket Keeper',
  wicketkeeper_batsman: 'Wicket Keeper',
};

const ROLE_HI: Record<string, string> = {
  bat: 'बल्लेबाज़', batsman: 'बल्लेबाज़',
  bowl: 'गेंदबाज़', bowler: 'गेंदबाज़',
  ar: 'ऑल-राउंडर', allrounder: 'ऑल-राउंडर', all_rounder: 'ऑल-राउंडर', 'all-rounder': 'ऑल-राउंडर',
  wk: 'विकेट कीपर', wicketkeeper: 'विकेट कीपर', wicket_keeper: 'विकेट कीपर',
  wicketkeeper_batsman: 'विकेट कीपर',
};

/** Map any role string (short or historic long) to a canonical short code. */
const ROLE_CANONICAL: Record<string, CanonicalRole> = {
  bat: 'bat', batsman: 'bat',
  bowl: 'bowl', bowler: 'bowl',
  ar: 'ar', allrounder: 'ar', all_rounder: 'ar', 'all-rounder': 'ar',
  wk: 'wk', wicketkeeper: 'wk', wicket_keeper: 'wk', wicketkeeper_batsman: 'wk',
};

/** Bilingual, full-word role label. Never returns a raw code like "WK". */
export function roleLabel(role: string | null | undefined, lang: 'en' | 'hi' = 'en'): string {
  if (!role) return '—';
  const key = role.trim().toLowerCase();
  return (lang === 'hi' ? ROLE_HI[key] : ROLE_EN[key]) ?? ROLE_EN[key] ?? role;
}

/** Normalise any role string to a canonical short code, defaulting to 'bat'. */
export function canonicalRole(role: string | null | undefined): CanonicalRole {
  if (!role) return 'bat';
  return ROLE_CANONICAL[role.trim().toLowerCase()] ?? 'bat';
}
