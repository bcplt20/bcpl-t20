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

/** Absolute API origin (no /api suffix) — exported so the payment WebView can
 *  build/recognise the checkout + return URLs. */
export const API_ORIGIN = BASE;

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

/** Backfill date of birth for legacy users who registered before DOB capture.
 *  Server validates YYYY-MM-DD + 18–45 eligibility; throws ApiError otherwise. */
export function patchDob(token: string, dob: string): Promise<{ success: boolean }> {
  return apiFetch('/register/dob', { method: 'PATCH', body: { dob }, token });
}

export function createPhase1Payment(
  token: string,
  registrationId: string,
  consent: { termsVersion: string; privacyVersion: string; marketingOptIn: boolean },
): Promise<{
  success: boolean;
  orderId: string;
  paymentSessionId: string;
  amount: number;
  /** JS-SDK mode matching the order's Cashfree environment: 'production' | 'sandbox'. */
  cashfreeMode?: 'production' | 'sandbox';
  /** Server-hosted checkout page URL — open this in the browser (runs the v3 SDK). */
  checkoutUrl?: string;
}> {
  // platform:"app" → Cashfree returns to our own in-app-intercepted terminal
  // page (never the website receipt). The WebView catches it and verifies.
  return apiFetch('/payment/phase1/create', { method: 'POST', body: { registrationId, consent, platform: 'app' }, token });
}

export function verifyPhase1Payment(
  token: string,
  orderId: string,
): Promise<{ success: boolean; registrationId?: string; regNumber?: string; status?: string }> {
  return apiFetch('/payment/phase1/verify', { method: 'POST', body: { orderId }, token });
}

// ── Phase 2 payment ───────────────────────────────────────────────────────────
export function createPhase2Payment(
  token: string,
  registrationId: string,
  declarations?: { version: string; items: string[] },
): Promise<{
  success: boolean;
  orderId: string;
  paymentSessionId: string;
  amount: number;
  cashfreeMode?: 'production' | 'sandbox';
  checkoutUrl?: string;
}> {
  return apiFetch('/payment/phase2/create', { method: 'POST', body: { registrationId, declarations, platform: 'app' }, token });
}

export function verifyPhase2Payment(
  token: string,
  orderId: string,
): Promise<{ success: boolean; status?: string }> {
  return apiFetch('/payment/phase2/verify', { method: 'POST', body: { orderId }, token });
}

// ── Video Upload (Phase 1) ────────────────────────────────────────────────────
// Endpoints + shapes mirror the website (bcpl-website/src/lib/api.ts) exactly so
// the native in-app upload uses the same server flow: presigned S3 PUT + confirm.

export type VideoConstraints = {
  videoMinSeconds: number;
  videoMaxSeconds: number;
  maxVideoFileSizeMb: number;
  maxReuploads: number;
  maxAttempts: number;
  allowedFormats: string[];
};

export function getVideoInstructions(token: string): Promise<{
  role: string | null;
  roleKey: 'bat' | 'bowl' | 'ar' | 'wk' | null;
  instructions: { en: string[]; hi: string[] } | null;
  constraints: VideoConstraints;
}> {
  return apiFetch('/video/instructions', { token });
}

export function getVideoStatus(token: string): Promise<{
  registered: boolean;
  phase1Status?: string;
  videoDeadline?: string | null;
  deadlineExpired?: boolean;
  videoSubmitted?: boolean;
  submittedAt?: string | null;
  attemptsUsed?: number;
  maxAttempts?: number;
  canReupload?: boolean;
  latestVideoStatus?: string | null;
  reuploadReason?: string | null;
}> {
  return apiFetch('/video/status', { token });
}

export function getVideoUploadUrl(
  token: string,
  registrationId: string,
  contentType: string,
  sizeBytes?: number,
): Promise<{ success: boolean; presignedUrl: string; s3Key: string; maxSizeMb?: number }> {
  return apiFetch('/video/upload-url', { method: 'POST', body: { registrationId, contentType, sizeBytes }, token });
}

export function confirmVideoUpload(
  token: string,
  registrationId: string,
  s3Key: string,
  declarationAccepted: boolean,
  durationSeconds?: number,
): Promise<{ success: boolean; message: string; attemptsUsed?: number; maxAttempts?: number; reuploadsLeft?: number }> {
  return apiFetch('/video/confirm', { method: 'POST', body: { registrationId, s3Key, declarationAccepted, durationSeconds }, token });
}

// ── KYC (Phase 2) ─────────────────────────────────────────────────────────────
// Same endpoints + statuses as the website KYC page.

export interface KycInitiateBody {
  registrationId: string;
  profession: string;
  aadhaarNumber: string;
  panNumber: string;
  tshirtSize?: string;
  trouserSize?: string;
  shoeSize?: string;
  helmetSize?: string;
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
  bloodGroup?: string;
}

export function initiateKyc(token: string, data: KycInitiateBody): Promise<{
  success: boolean; kycId: string; status: string; message: string;
  aadhaarRefId?: string; panVerified?: boolean;
}> {
  return apiFetch('/kyc/initiate', { method: 'POST', body: data, token });
}

export function verifyKycOtp(token: string, data: { registrationId: string; aadhaarRefId: string; otp: string }): Promise<{
  success: boolean; status: string; message: string;
}> {
  return apiFetch('/kyc/verify-otp', { method: 'POST', body: data, token });
}

export function getKycProgress(token: string, registrationId: string): Promise<{
  hasKyc: boolean;
  status?: string;
  panVerified?: boolean;
  aadhaarVerified?: boolean;
  aadhaarParked?: boolean;
  profession?: string;
  profile?: {
    tshirtSize?: string | null;
    trouserSize?: string | null;
    shoeSize?: string | null;
    helmetSize?: string | null;
    emergencyName?: string | null;
    emergencyRelation?: string | null;
    emergencyPhone?: string | null;
    bloodGroup?: string | null;
  } | null;
}> {
  return apiFetch(`/kyc/progress/${registrationId}`, { token });
}

export function kycAadhaarOtp(token: string, data: { registrationId: string; aadhaarNumber: string }): Promise<{
  success: boolean; status: string; aadhaarRefId?: string; panVerified?: boolean; message: string;
}> {
  return apiFetch('/kyc/aadhaar-otp', { method: 'POST', body: data, token });
}

export function kycVerifyPan(token: string, data: { registrationId: string; panNumber: string }): Promise<{
  success: boolean; status: string; message: string;
}> {
  return apiFetch('/kyc/verify-pan', { method: 'POST', body: data, token });
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export interface Avatar {
  kind: 'preset' | 'photo';
  preset?: string;
  viewUrl?: string;
}

export interface Dashboard {
  user: AuthUser;
  avatar?: Avatar | null;
  registered: boolean;
  registration?: {
    id: string;
    regNumber?: string | null;
    role?: string | null;
    trialCity?: string | null;
    dob?: string | null;
    age?: number | null;
    classification?: ClassificationValue | null;
    classificationComplete?: boolean;
    carryover?: boolean;
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

// ── Phase 1 result (100-point scorecard) ────────────────────────────────────
// Mirrors GET /api/results/me (api-server/src/routes/results.ts). Legacy
// breakdown items may lack `label`, so the screen falls back to a prettified key.
export interface Phase1BreakdownItem {
  key: string;
  label?: string;
  score: number;
  max: number;
}

export interface Phase1Result {
  available: boolean;
  /** Only meaningful when available:true. */
  decision?: 'qualified' | 'not_shortlisted';
  name?: string;
  regNumber?: string | null;
  role?: string | null;
  trialCity?: string | null;
  total?: number;
  breakdown?: Phase1BreakdownItem[];
  selectorNote?: string | null;
  cityRank?: number | null;
  cityCount?: number | null;
  roleRank?: number | null;
  roleCount?: number | null;
  scoredAt?: string | null;
  myFeedback?: { rating: string; comment?: string | null } | null;
  /** Present when available:false — routes the pre-result / pending states. */
  reason?: string;
  phase1Status?: string | null;
}

export function getMyResult(token: string): Promise<Phase1Result> {
  return apiFetch('/results/me', { token });
}

// ── Trial pass (digital QR pass for the physical trial) ─────────────────────
export interface TrialPassData {
  player: { name: string; regNumber: string | null; role: string | null; city: string | null };
  venue: { name: string; city: string | null; address: string | null; mapsUrl: string | null } | null;
  slot: { batch: string | null; date: string | null; reportingTime: string | null; startTime: string | null } | null;
  checkedInAt: string | null;
  assessmentSubmitted: boolean;
  assessmentAt: string | null;
  qrDataUrl: string;
}

export function getTrialPass(token: string): Promise<TrialPassData> {
  return apiFetch('/user/trial-pass', { token });
}

// ── AI helper (player chat + technique feedback) ────────────────────────────
export interface AiChatMsg { role: 'user' | 'assistant'; text: string }
// token optional — guests get general answers, logged-in players get personalised ones.
export function aiChat(token: string | null | undefined, messages: AiChatMsg[]): Promise<{ reply: string }> {
  return apiFetch('/ai/chat', { method: 'POST', body: { messages }, ...(token ? { token } : {}) });
}

// ── Public news articles (DB-backed, merged with the static archive) ────────
export interface ApiNewsArticle {
  id: string; slug: string; tag: string; title: string; titleHi: string;
  image: string; paragraphs: string[]; paragraphsHi: string[];
  press: { label: string; url: string }[];
  published: boolean; publishedAt: string | null; updatedAt: string;
}
export function getNewsArticles(): Promise<{ articles: ApiNewsArticle[] }> {
  return apiFetch('/news');
}
export interface AiTip { en: string; hi: string }
export function getAiFeedback(token: string): Promise<{ tips: AiTip[] }> {
  return apiFetch('/ai/feedback', { token });
}

// ── Player classification (playing style) ───────────────────────────────────
export interface ClassificationValue {
  battingHand?: 'right' | 'left';
  battingPosition?: 'opener' | 'top_order' | 'middle_order' | 'lower_middle_order' | 'finisher';
  battingStyle?: 'anchor' | 'aggressive' | 'power_hitter' | 'defensive';
  bowlingArm?: 'right' | 'left';
  bowlingType?: 'fast' | 'fast_medium' | 'medium_fast' | 'medium_pace' | 'off_spin' | 'leg_spin' | 'orthodox_spin' | 'wrist_spin';
}

export function getClassification(token: string): Promise<{ role: string; classification: ClassificationValue | null; complete: boolean; carryover: boolean }> {
  return apiFetch('/user/classification', { token });
}

export function saveClassification(
  token: string,
  classification: ClassificationValue,
): Promise<{ success: boolean; role: string; classification: ClassificationValue; complete: boolean }> {
  return apiFetch('/user/classification', { method: 'POST', token, body: classification });
}

// ── Profile avatar ─────────────────────────────────────────────────────────
export function setAvatarPreset(token: string, preset: string): Promise<{ success: boolean; avatar: Avatar | null }> {
  return apiFetch('/user/avatar', { method: 'POST', token, body: { preset } });
}

export function getAvatarUploadUrl(
  token: string,
  contentType: string,
  sizeBytes: number,
): Promise<{ success: boolean; presignedUrl: string; s3Key: string }> {
  return apiFetch('/user/avatar/upload-url', { method: 'POST', token, body: { contentType, sizeBytes } });
}

export function confirmAvatarUpload(token: string): Promise<{ success: boolean; avatar: Avatar | null }> {
  return apiFetch('/user/avatar/confirm', { method: 'POST', token });
}

/** Upload the picked image bytes to the presigned S3 URL (PUT). */
export async function putToPresignedUrl(url: string, blob: Blob, contentType: string): Promise<void> {
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
  if (!res.ok) throw new ApiError(`Upload failed (${res.status})`, res.status);
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
export type AppMediaItem = {
  id: string;
  kind: 'photo' | 'video' | 'short';
  title?: string;
  url?: string;
  youtubeId?: string;
  thumbUrl?: string;
  viewUrl?: string;
  order: number;
};

export function getAppMedia(): Promise<{ items: AppMediaItem[] }> {
  return apiFetch('/app-media');
}

export function getGallery(): Promise<{ albums: GalleryAlbum[] }> {
  return apiFetch('/gallery');
}

// ── Community Scorer (Profiles & Teams) ──────────────────────────────────────
export interface CommunityProfile {
  userId: string;
  displayName: string;
  role: string; // batsman|bowler|all_rounder|wicket_keeper
  battingStyle: string; // right|left
  bowlingStyle?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityProfileStats {
  batting: { matches: number; innings: number; runs: number; balls: number; fours: number; sixes: number; strikeRate: number };
  bowling: { matches: number; innings: number; wickets: number; balls: number; overs: number; runsConceded: number; economy: number };
}

export interface CommunityTeam {
  id: string;
  ownerUserId: string;
  name: string;
  shortName: string;
  createdAt: string;
}

export interface CommunityTeamMember {
  id: string;
  teamId: string;
  userId?: string | null;
  phoneMasked?: string | null;
  name: string;
  role: string;
  addedAt: string;
}

export function communityGetProfile(token: string): Promise<{ profile: CommunityProfile | null }> {
  return apiFetch('/community/profile', { token });
}

export function communityUpdateProfile(token: string, data: { displayName: string; role: string; battingStyle: string; bowlingStyle?: string }): Promise<{ success: boolean; profile: CommunityProfile }> {
  return apiFetch('/community/profile', { method: 'PUT', body: data, token });
}

export function communityGetProfileStats(token: string): Promise<{ stats: CommunityProfileStats }> {
  return apiFetch('/community/profile/stats', { token });
}

export function communityMyTeams(token: string): Promise<{ teams: CommunityTeam[] }> {
  return apiFetch('/community/teams/mine', { token });
}

export function communityCreateTeam(token: string, data: { name: string; shortName: string }): Promise<{ success: boolean; team: CommunityTeam }> {
  return apiFetch('/community/teams', { method: 'POST', body: data, token });
}

export function communityGetTeam(token: string, id: string): Promise<{ team: CommunityTeam; members: CommunityTeamMember[] }> {
  return apiFetch(`/community/teams/${id}`, { token });
}

export function communityUpdateTeam(token: string, id: string, data: { name?: string; shortName?: string }): Promise<{ success: boolean; team: CommunityTeam }> {
  return apiFetch(`/community/teams/${id}`, { method: 'PATCH', body: data, token });
}

export function communityDeleteTeam(token: string, id: string): Promise<{ success: boolean }> {
  return apiFetch(`/community/teams/${id}`, { method: 'DELETE', token });
}

export function communityAddMember(token: string, teamId: string, data: { name: string; phone?: string; role?: string }): Promise<{ success: boolean; member: CommunityTeamMember }> {
  return apiFetch(`/community/teams/${teamId}/members`, { method: 'POST', body: data, token });
}

export function communityRemoveMember(token: string, teamId: string, memberId: string): Promise<{ success: boolean }> {
  return apiFetch(`/community/teams/${teamId}/members/${memberId}`, { method: 'DELETE', token });
}

// ── Community Scorer (Matches) ───────────────────────────────────────────────
export interface CommunityMatch {
  id: string;
  team1: string;
  team2: string;
  venue?: string | null;
  oversLimit: number;
  playersPerSide: number;
  status: 'live' | 'innings2' | 'completed';
  resultDesc?: string | null;
  teamAId?: string | null;
  teamBId?: string | null;
  teamAVerified?: boolean;
  teamBVerified?: boolean;
  createdAt: string;
}

export interface CommunityRecentBall {
  over: string | number;
  runs: number;
  isWicket: boolean;
  extraType?: string | null;
  commentary?: string | null;
}

export interface CommunityBatting {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean | string;
}

export interface CommunityBowling {
  name: string;
  overs: number | string;
  runs: number;
  wickets: number;
}

export interface CommunityInnings {
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  overs: number;
  balls: number;
  extras: number;
  target?: number | null;
  status: string;
  batting: CommunityBatting[];
  bowling: CommunityBowling[];
  recentBalls: CommunityRecentBall[];
}

export interface CommunityRosterMember {
  id: string;
  name: string;
  role: string;
}

export function communityCreateMatch(token: string, data: { team1?: string, team2?: string, teamAId?: string, teamBId?: string, venue?: string, oversLimit: number, playersPerSide?: number, battingFirst: 'team1'|'team2' }): Promise<{ match: CommunityMatch }> {
  return apiFetch('/community/matches', { method: 'POST', body: data, token });
}

export function communityMyMatches(token: string): Promise<{ matches: CommunityMatch[] }> {
  return apiFetch('/community/matches/mine', { token });
}

export function communityScorecard(id: string): Promise<{ match: CommunityMatch; innings: CommunityInnings[]; rosters?: { teamA: CommunityRosterMember[]; teamB: CommunityRosterMember[] } }> {
  return apiFetch(`/community/matches/${id}`);
}

export function communityBall(token: string, id: string, data: { type: 'run'|'wide'|'noball'|'bye'|'legbye'|'wicket', runs: number, batterName: string, bowlerName: string, dismissalType?: string, dismissedBatter?: string, fielderName?: string, strikerMemberId?: string, bowlerMemberId?: string }): Promise<{ inningsTotal: { runs: number, wickets: number, overs: number, balls: number }, inningsComplete: boolean, commentary: string }> {
  return apiFetch(`/community/matches/${id}/ball`, { method: 'POST', body: data, token });
}

export function communityUndo(token: string, id: string): Promise<{ success: boolean }> {
  return apiFetch(`/community/matches/${id}/ball`, { method: 'DELETE', token });
}

export function communityInningsEnd(token: string, id: string): Promise<{ target: number }> {
  return apiFetch(`/community/matches/${id}/innings-end`, { method: 'POST', token });
}

export function communityFinish(token: string, id: string, data?: { abandon?: boolean }): Promise<{ resultDesc: string }> {
  return apiFetch(`/community/matches/${id}/finish`, { method: 'POST', body: data || {}, token });
}

export interface CommunityOfficial {
  userId: string;
  name: string;
  role: string;
}

export function communityGetOfficials(token: string, matchId: string): Promise<{ officials: CommunityOfficial[] }> {
  return apiFetch(`/community/matches/${matchId}/officials`, { token });
}

export function communityAddOfficial(token: string, matchId: string, data: { phone: string; role: string }): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/community/matches/${matchId}/officials`, { method: 'POST', body: data, token });
}

export function communityRemoveOfficial(token: string, matchId: string, userId: string): Promise<{ success: boolean }> {
  return apiFetch(`/community/matches/${matchId}/officials/${userId}`, { method: 'DELETE', token });
}

export function communityVerifyTeamStart(token: string, matchId: string, data: { teamId: string; memberId: string }): Promise<{ success: boolean; phoneMasked: string }> {
  return apiFetch(`/community/matches/${matchId}/verify-team/start`, { method: 'POST', body: data, token });
}

export function communityVerifyTeamConfirm(token: string, matchId: string, data: { teamId: string; last4: string; code: string }): Promise<{ success: boolean }> {
  return apiFetch(`/community/matches/${matchId}/verify-team/confirm`, { method: 'POST', body: data, token });
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
  coach?: string | null;
  owner?: string | null;
  homeGround?: string | null;
  titlesWon?: number;
  playerCount?: number;
}

export function getTeams(): Promise<{ teams: Team[] }> {
  return apiFetch('/teams');
}

/** A squad player on a franchise team (admin-managed; purely API-driven). */
export interface TeamPlayer {
  id: string;
  teamId: string;
  name: string;
  role: string; // Batsman | Bowler | All-rounder | Wicket-keeper
  age?: number | null;
  state?: string | null;
  photoUrl?: string | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  jerseyNo?: string | null;
  nationality?: string | null;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  auctionPrice?: string | null;
}

/** Team detail + full squad. Accepts slug or uuid. */
export function getTeamDetail(slugOrId: string): Promise<{ team: Team; players: TeamPlayer[] }> {
  return apiFetch(`/teams/${slugOrId}`);
}

export interface AppBanner {
  id: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
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
