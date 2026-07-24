/**
 * Central formatting helpers (final-finishing spec §6).
 *
 * SINGLE source of truth for player-facing vocabulary: role labels,
 * "Role • City" identity lines, dates, times and batch names. Raw backend
 * values (bat / wk / wicketkeeper_batsman / "2026-08-12" / "07:30") must
 * NEVER reach the UI — route every display through these helpers.
 */

/* ── Roles ──────────────────────────────────────────────────────────────────
   Canonical short values (bat/bowl/ar/wk) + the historic long formats that
   still live on old registrations — both map to ONE canonical label. */
const ROLE_EN: Record<string, string> = {
  bat: 'Batsman', batsman: 'Batsman',
  bowl: 'Bowler', bowler: 'Bowler',
  ar: 'All-Rounder', allrounder: 'All-Rounder', all_rounder: 'All-Rounder', 'all-rounder': 'All-Rounder',
  wk: 'Wicketkeeper', wicketkeeper: 'Wicketkeeper', wicket_keeper: 'Wicketkeeper',
  wicketkeeper_batsman: 'Wicketkeeper-Batsman',
};
const ROLE_HI: Record<string, string> = {
  bat: 'बल्लेबाज़', batsman: 'बल्लेबाज़',
  bowl: 'गेंदबाज़', bowler: 'गेंदबाज़',
  ar: 'ऑल-राउंडर', allrounder: 'ऑल-राउंडर', all_rounder: 'ऑल-राउंडर', 'all-rounder': 'ऑल-राउंडर',
  wk: 'विकेटकीपर', wicketkeeper: 'विकेटकीपर', wicket_keeper: 'विकेटकीपर',
  wicketkeeper_batsman: 'विकेटकीपर-बल्लेबाज़',
};

export function formatRole(role: string | null | undefined, lang: 'en' | 'hi' = 'en'): string {
  if (!role) return '—';
  const key = role.trim().toLowerCase();
  return (lang === 'hi' ? ROLE_HI[key] : ROLE_EN[key]) ?? ROLE_EN[key] ?? role;
}

/** "Wicketkeeper • Delhi" — the §19 identity line. Never shows raw values. */
export function formatRoleCity(role: string | null | undefined, city: string | null | undefined, lang: 'en' | 'hi' = 'en'): string {
  const parts = [formatRole(role, lang)];
  if (city && city.trim()) parts.push(city.trim());
  return parts.join(' • ');
}

/* ── Dates ────────────────────────────────────────────────────────────────── */

function toDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

/** "Saturday, 12 September 2026" — trial pass / schedule display. Falls back
 *  to the raw string when the value isn't parseable (free-form slot dates). */
export function formatDateLong(d: string | Date | null | undefined): string {
  const dt = toDate(d);
  if (!dt) return typeof d === 'string' && d.trim() ? d : '—';
  return dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** "12 Sep 2026" — compact date for receipts, chips, meta rows. */
export function formatDateShort(d: string | Date | null | undefined): string {
  const dt = toDate(d);
  if (!dt) return typeof d === 'string' && d.trim() ? d : '—';
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Times ────────────────────────────────────────────────────────────────── */

/** Slot times are stored as admin-entered strings ("07:30", "7:30 AM",
 *  "07:30:00"). Normalise bare 24h values to "7:30 AM"; anything already
 *  human-readable passes through untouched. */
export function formatTime(t: string | null | undefined): string {
  if (!t || !t.trim()) return '—';
  const raw = t.trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return raw; // already has AM/PM or free-form — trust the admin copy
  let h = parseInt(m[1]!, 10);
  const min = m[2]!;
  if (h > 23) return raw;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}`;
}

/** Batch names pass through ("Batch A", "Morning 1") with a tidy fallback. */
export function formatBatch(b: string | null | undefined): string {
  return b && b.trim() ? b.trim() : '—';
}
