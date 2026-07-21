/**
 * BCPL Auth — localStorage session with 48-hour expiry
 */

const AUTH_KEY   = 'bcpl_auth_v1';
const SESSION_MS = 48 * 60 * 60 * 1000; // 48 hours

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
}

/** Read session; returns null if missing or expired */
export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() - session.loginTime > SESSION_MS) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/** Persist a fresh session */
export function saveSession(token: string, user: AuthUser): void {
  const session: AuthSession = { token, user, loginTime: Date.now() };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

/** Clear session (logout) */
export function clearSession(): void {
  localStorage.removeItem(AUTH_KEY);
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
