/**
 * BCPL Auth — localStorage session with 48-hour *inactivity* expiry.
 * Any session read (page visit / API call) refreshes the activity window,
 * so active players stay logged in; only 48 hours of no activity logs out.
 */

const AUTH_KEY       = 'bcpl_auth_v1';
const IDLE_MS        = 48 * 60 * 60 * 1000; // 48 hours of inactivity
const TOUCH_EVERY_MS = 60 * 1000;           // persist activity at most once/min

/** Fired on login/logout so navbars across the app re-render */
export const AUTH_CHANGED_EVENT = 'bcpl:authChanged';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  loginTime: number;
  lastActivity?: number;
}

function emitAuthChanged(): void {
  try { window.dispatchEvent(new Event(AUTH_CHANGED_EVENT)); } catch { /* SSR/no-window */ }
}

/**
 * Read session; returns null if missing or idle-expired.
 * Every successful read counts as activity and extends the 48h window
 * (writes are throttled to once per minute).
 */
export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (!session?.token || !session?.user) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    const now = Date.now();
    // Sessions written by older clients may lack these fields — backfill.
    if (!session.loginTime) session.loginTime = now;
    const last = session.lastActivity ?? session.loginTime;
    if (now - last > IDLE_MS) {
      localStorage.removeItem(AUTH_KEY);
      emitAuthChanged();
      return null;
    }
    if (!session.lastActivity || now - session.lastActivity > TOUCH_EVERY_MS) {
      session.lastActivity = now;
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    }
    return session;
  } catch {
    return null;
  }
}

/** Persist a fresh session */
export function saveSession(token: string, user: AuthUser): void {
  const now = Date.now();
  const session: AuthSession = { token, user, loginTime: now, lastActivity: now };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  emitAuthChanged();
}

/** Clear session (logout) */
export function clearSession(): void {
  localStorage.removeItem(AUTH_KEY);
  emitAuthChanged();
}

/** Open the global login modal from any page */
export function openLoginModal(): void {
  window.dispatchEvent(new Event('bcpl:openLogin'));
}

/** Map registration status → the correct journey page path */
export function getJourneyPath(status: {
  registered: boolean;
  phase1Status?: string;
  phase2Status?: string | null;
}): string {
  const b = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  if (!status.registered) return `${b}/register`;

  const p1 = status.phase1Status ?? '';
  const p2 = status.phase2Status ?? '';

  if (p1 === 'payment_done')  return `${b}/register/upload-video`;
  if (p1 === 'video_uploaded') return `${b}/register/result`;

  if (p1 === 'selected' || p1 === 'rejected') {
    if (!p2 || p2 === 'pending')     return `${b}/register/phase2`;
    if (p2 === 'payment_done')       return `${b}/register/phase2/kyc`;
    if (p2 === 'kyc_approved')       return `${b}/register/phase2/kyc-approved`;
    if (p2 === 'trial_cleared' || p2 === 'auction_shortlisted') return `${b}/auction/selected`;
    if (p2 === 'team_signed')        return `${b}/team-selected`;
  }

  return `${b}/profile`;
}
