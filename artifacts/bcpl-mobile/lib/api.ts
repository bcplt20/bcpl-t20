/**
 * BCPL API client for the mobile app.
 * In development the Expo bundle runs outside the Replit proxy, so we need an
 * absolute URL (EXPO_PUBLIC_DOMAIN). Store/production builds default to the
 * live site.
 */
const BASE =
  (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '') ||
  (process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : 'https://bcplt20.com');

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  const res = await fetch(`${BASE}/api${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON error body
  }
  if (!res.ok) {
    const err = (data ?? {}) as { error?: string; code?: string };
    throw new ApiError(err.error ?? `Request failed (${res.status})`, res.status, err.code);
  }
  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
}

export function sendOtp(
  phone: string,
  purpose: 'login' | 'register' = 'login',
): Promise<{ success: boolean; message: string; devOtp?: string }> {
  return apiFetch('/auth/send-otp', { method: 'POST', body: { phone, purpose } });
}

export function verifyOtp(
  phone: string,
  otp: string,
  extra?: { purpose?: 'login' | 'register'; name?: string; email?: string },
): Promise<{ success: boolean; token: string; user: AuthUser }> {
  return apiFetch('/auth/verify-otp', {
    method: 'POST',
    body: { phone, otp, purpose: extra?.purpose ?? 'login', name: extra?.name, email: extra?.email },
  });
}

// ── Registration (Phase 1) ───────────────────────────────────────────────────
export type PlayerRole = 'bat' | 'bowl' | 'wk' | 'ar';

export interface RegisterStatus {
  registered: boolean;
  registrationId?: string;
  regNumber?: string | null;
  role?: string | null;
  trialCity?: string | null;
  phase1Status?: string | null;
  phase2Status?: string | null;
  videoDeadline?: string | null;
  fees?: { phase1: number; phase2: number };
}

export function getRegisterStatus(token: string): Promise<RegisterStatus> {
  return apiFetch('/register/status', { token });
}

export function registerPhase1(
  token: string,
  body: { role: PlayerRole; trialCity: string; dob: string },
): Promise<{ success: boolean; registrationId: string; role: string; trialCity: string; phase1Fee: number; videoDeadline: string }> {
  return apiFetch('/register/phase1', { method: 'POST', body, token });
}

export function createPhase1Payment(
  token: string,
  registrationId: string,
  consent: { termsVersion: string; privacyVersion: string; marketingOptIn: boolean },
): Promise<{ success: boolean; orderId: string; paymentSessionId: string; amount: number }> {
  return apiFetch('/payment/phase1/create', { method: 'POST', body: { registrationId, consent }, token });
}

export function verifyPhase1Payment(
  token: string,
  orderId: string,
): Promise<{ success: boolean; registrationId?: string; regNumber?: string; status?: string }> {
  return apiFetch('/payment/phase1/verify', { method: 'POST', body: { orderId }, token });
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export interface Dashboard {
  user: AuthUser;
  registered: boolean;
  registration?: {
    id: string;
    regNumber?: string | null;
    role?: string | null;
    trialCity?: string | null;
    phase1Status?: string | null;
    phase2Status?: string | null;
    videoDeadline?: string | null;
    deadlineExpired?: boolean;
    createdAt?: string;
  };
  phase1Payment?: { status: string; amount: number; paidAt?: string | null } | null;
  video?: { submitted: boolean; submittedAt?: string | null; status?: string | null } | null;
  phase2Payment?: { status: string; amount: number; paidAt?: string | null } | null;
  kyc?: { status: string; profession?: string | null; verifiedAt?: string | null } | null;
  trial?: {
    venue?: { name: string; city?: string | null; address?: string | null; mapsUrl?: string | null } | null;
    slot?: { batch?: string | null; date?: string | null; reportingTime?: string | null; startTime?: string | null } | null;
    checkedInAt?: string | null;
    assessmentSubmitted?: boolean;
    assessmentAt?: string | null;
  } | null;
}

export function getDashboard(token: string): Promise<Dashboard> {
  return apiFetch('/user/dashboard', { token });
}

// ── Gallery / media ──────────────────────────────────────────────────────────
export interface GalleryItem {
  id: string;
  name: string;
  kind: 'photo' | 'video';
  sizeBytes?: number;
  viewUrl: string;
  thumbUrl?: string;
}
export interface GalleryAlbum {
  id: string;
  name: string;
  kind?: string;
  items: GalleryItem[];
}
export function getGallery(): Promise<{ albums: GalleryAlbum[] }> {
  return apiFetch('/gallery');
}

// ── Match center ─────────────────────────────────────────────────────────────
export interface Match {
  id: string;
  matchNo: number;
  season: number;
  team1: string;
  team2: string;
  venue?: string | null;
  scheduledAt?: string | null;
  stage?: string | null;
  grp?: string | null;
  status: string; // scheduled | live | completed | abandoned...
  winner?: string | null;
  resultDesc?: string | null;
}

export function getMatches(): Promise<{ matches: Match[] }> {
  return apiFetch('/matches');
}

export interface LiveInnings {
  number: number;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  overs: number;
  balls: number;
  extras?: number;
  target?: number | null;
  status?: string;
}

export interface LiveMatch {
  matchId: string;
  matchNo: number;
  team1: string;
  team2: string;
  venue?: string | null;
  scheduledAt?: string | null;
  status: string;
  winner?: string | null;
  resultDesc?: string | null;
  innings: LiveInnings[];
  recentDeliveries: { over: string | number; runs: number; isWicket: boolean; commentary?: string | null }[];
}

export function getLiveMatch(id: string): Promise<LiveMatch> {
  return apiFetch(`/matches/${id}/live`);
}

export interface ScorecardBatting {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissal?: string | null;
}
export interface ScorecardBowling {
  name: string;
  overs: number;
  balls?: number;
  runs: number;
  wickets: number;
  wides?: number;
  noBalls?: number;
}
export interface ScorecardResponse {
  match: Match;
  scorecards: {
    /** full innings row from the server */
    innings: {
      id: string;
      inningsNumber: number;
      battingTeam?: string | null;
      bowlingTeam?: string | null;
      totalRuns?: number;
      totalWickets?: number;
    };
    scorecard: {
      batting: ScorecardBatting[];
      bowling: ScorecardBowling[];
      fallOfWickets: { wicket: number; batter: string; runs: number; overStr: string }[];
    };
  }[];
}

export function getScorecard(id: string): Promise<ScorecardResponse> {
  return apiFetch(`/matches/${id}/scorecard`);
}

// ── Points table & teams ─────────────────────────────────────────────────────
export interface PointsRow {
  team: string;
  played: number;
  won: number;
  lost: number;
  noResult: number;
  points: number;
  nrr: number | string;
  form?: string | null;
}

export function getPointsTable(): Promise<{ season: number; table: PointsRow[] }> {
  return apiFetch('/points-table');
}

export interface Team {
  id: string;
  season: number;
  slug: string;
  name: string;
  city?: string | null;
  color?: string | null;
  secondColor?: string | null;
  logoUrl?: string | null;
  captain?: string | null;
  homeGround?: string | null;
  playerCount?: number;
}

export function getTeams(): Promise<{ teams: Team[] }> {
  return apiFetch('/teams');
}

export interface AppBanner {
  id: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  accent?: string;
  order: number;
}

export function getAppBanners(): Promise<{ banners: AppBanner[] }> {
  return apiFetch('/app-banners');
}

export interface VideoItem {
  id: string;
  title: string;
  youtubeId?: string;
  url?: string;
}

export function getVideos(): Promise<{ videos: VideoItem[] }> {
  return apiFetch('/videos');
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  url?: string;
  tier: 'title' | 'powered' | 'associate' | 'partner';
}

export function getSponsors(): Promise<{ sponsors: Sponsor[] }> {
  return apiFetch('/sponsors');
}

// Public site assets (news images etc.) always come from the live site.
export const SITE_ASSETS = 'https://bcplt20.com';
