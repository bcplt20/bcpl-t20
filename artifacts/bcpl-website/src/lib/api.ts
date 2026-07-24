/**
 * BCPL API Client
 * All calls go to the API server (VITE_API_URL).
 * Admin calls go through adminReq (session token) from adminHttp.ts.
 */

import { getSession, saveSession, clearSession } from "./auth";
import { BASE, adminReq } from "./adminHttp";

// Shared admin plumbing lives in adminHttp.ts (single source of truth).
export {
  saveAdminToken,
  clearAdminToken,
  hasAdminToken,
} from "./adminHttp";

/** Reading via getSession() also refreshes the 48h inactivity window on every API call. */
function getStoredToken(): string | null {
  return getSession()?.token ?? null;
}

async function req<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getStoredToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const e = new Error((err as any).error ?? res.statusText) as Error & { status?: number; code?: string };
    e.status = res.status;
    e.code   = (err as any).code;
    throw e;
  }
  return res.json() as Promise<T>;
}

/* ─── Auth ─────────────────────────────────────────── */

/* ─── Public sponsors (website sponsor wall) ───────── */
export type PublicSponsor = { name: string; category: string; logo: string; website: string };
export const getPublicSponsors = () =>
  req<{ sponsors: PublicSponsor[] }>("GET", "/sponsors");

/* ─── Public fee config (single source of truth for displayed prices) ─── */
export type FeeConfig = { phase1: Record<string, number>; phase2: Record<string, number>; gstRate: number };
export const getFees = () => req<FeeConfig>("GET", "/fees");

/* ─── getPlayerNextAction — status-aware CTA for header/nudges ─── */
export const getNextAction = () =>
  req<{ action: string; phase1Status?: string; phase2Status?: string | null }>("GET", "/user/next-action");

export const sendOtp = (phone: string, purpose: "login" | "register" = "login", draftKey?: string) =>
  req<{ success: boolean; message: string; devOtp?: string }>(
    "POST", "/auth/send-otp", { phone, purpose, ...(draftKey ? { draftKey } : {}) }
  );

export const verifyOtp = (phone: string, otp: string, purpose: "login" | "register" = "login", name?: string, email?: string, draftKey?: string) =>
  req<{ success: boolean; token: string; user: { id: string; name: string; phone: string; email: string } }>(
    "POST", "/auth/verify-otp", { phone, otp, purpose, name, email, ...(draftKey ? { draftKey } : {}) }
  );

export const getDashboard = () =>
  req<{
    user:          { id: string; name: string; phone: string; email: string };
    registered:    boolean;
    registration?: {
      id: string; role: string; trialCity: string;
      phase1Status: string; phase2Status: string | null;
      videoDeadline: string | null; deadlineExpired: boolean; createdAt: string;
    };
    phase1Payment?: { status: string; amount: number; paidAt: string } | null;
    video?:         { submitted: boolean; submittedAt: string; status: string } | null;
    phase2Payment?: { status: string; amount: number; paidAt: string } | null;
    kyc?:           { status: string; profession: string; verifiedAt: string | null } | null;
  }>("GET", "/user/dashboard");

export const getPlayerTrialVenue = () =>
  req<{
    found: boolean;
    venue?: {
      id: string; city: string; venue: string; trialDate: string;
      trialTime: string; reportingTime: string; slots: number; notes: string | null;
      status: string; announcedAt: string | null;
    };
  }>("GET", "/user/trial-venue");

export const getMe = () =>
  req<{ user: { id: string; name: string; phone: string; email: string } }>(
    "GET", "/auth/me"
  );

export const getRegistrationStatus = () =>
  req<{
    registered:     boolean;
    registrationId?: string;
    role?:           string;
    trialCity?:      string;
    phase1Status?:   string;
    phase2Status?:   string | null;
    videoDeadline?:  string | null;
    fees?:           { phase1: number; phase2: number };
  }>("GET", "/register/status");

/* ─── Video Upload ─────────────────────────────────── */

export const getVideoStatus = () =>
  req<{
    registered:     boolean;
    phase1Status?:  string;
    videoDeadline?: string | null;
    deadlineExpired?: boolean;
    videoSubmitted?: boolean;
    submittedAt?:   string | null;
    attemptsUsed?:  number;
    maxAttempts?:   number;
    canReupload?:   boolean;
    latestVideoStatus?: string | null;
    reuploadReason?: string | null;
  }>("GET", "/video/status");

export type VideoConstraints = {
  videoMinSeconds:    number;
  videoMaxSeconds:    number;
  maxVideoFileSizeMb: number;
  maxReuploads:       number;
  maxAttempts:        number;
  allowedFormats:     string[];
};

export const getVideoInstructions = () =>
  req<{
    role: string | null;
    roleKey: 'bat' | 'bowl' | 'ar' | 'wk' | null;
    instructions: { en: string[]; hi: string[] } | null;
    constraints: VideoConstraints;
  }>("GET", "/video/instructions");

export const getUploadUrl = (registrationId: string, contentType: string, sizeBytes?: number) =>
  req<{ success: boolean; presignedUrl: string; s3Key: string; maxSizeMb?: number }>(
    "POST", "/video/upload-url", { registrationId, contentType, sizeBytes }
  );

export const confirmVideoUpload = (registrationId: string, s3Key: string, declarationAccepted: boolean, durationSeconds?: number) =>
  req<{ success: boolean; message: string; attemptsUsed?: number; maxAttempts?: number; reuploadsLeft?: number }>(
    "POST", "/video/confirm", { registrationId, s3Key, declarationAccepted, durationSeconds }
  );

/* ─── Matches ──────────────────────────────────────── */

export const getMatches = (season = 5) =>
  req<{ matches: any[] }>("GET", `/matches?season=${season}`);

export const getLiveScore = (matchId: string) =>
  req<any>("GET", `/matches/${matchId}/live`);

export const getScorecard = (matchId: string) =>
  req<any>("GET", `/matches/${matchId}/scorecard`);

export const createMatch = (data: {
  matchNo: number; season?: number;
  team1: string; team2: string;
  venue: string; scheduledAt?: string;
}) => adminReq<{ match: any }>("POST", "/matches/admin/matches", data);

export const recordToss = (matchId: string, data: {
  tossWinner: string; tossDecision: "bat" | "field";
}) => adminReq<{ match: any }>("PUT", `/matches/admin/matches/${matchId}/toss`, data);

export const setPlayingXI = (matchId: string, data: {
  xi1: { name: string; role: string }[];
  xi2: { name: string; role: string }[];
  battingTeam: string;
}) => adminReq<{ innings: any }>("POST", `/matches/admin/matches/${matchId}/xi`, data);

export const updateMatchStatus = (matchId: string, data: {
  status: string; winner?: string; resultDesc?: string; playerOfMatch?: string;
}) => adminReq<{ match: any }>("PUT", `/matches/admin/matches/${matchId}/status`, data);

/* ─── Scoring ──────────────────────────────────────── */

export const recordBall = (matchId: string, data: {
  outcome: string;
  batterName: string;
  bowlerName: string;
  dismissalType?: string;
  dismissedBatter?: string;
  fielderName?: string;
  nonStrikerOut?: boolean;
  customCommentary?: string;
}) => adminReq<{ success: boolean; inningsComplete: boolean }>(
  "POST", `/scoring/admin/scoring/${matchId}/ball`, data
);

export const endInnings = (matchId: string) =>
  adminReq<{ innings2: any; target: number }>(
    "POST", `/scoring/admin/scoring/${matchId}/innings-end`, {}
  );

export const undoBall = (matchId: string) =>
  adminReq<{ success: boolean }>("DELETE", `/scoring/admin/scoring/${matchId}/ball`);

/* ─── Points Table ─────────────────────────────────── */

export const getPointsTable = (season = 5) =>
  req<{ table: any[] }>("GET", `/points-table?season=${season}`);

export const updatePointsRow = (team: string, data: {
  played?: number; won?: number; lost?: number; noResult?: number; nrr?: number; form?: string[];
}, season = 5) =>
  adminReq<{ row: any }>(
    "PUT", `/points-table/admin/points-table/${encodeURIComponent(team)}?season=${season}`, data
  );

export const recordMatchResult = (data: {
  winner?: string; loser?: string; noResult?: boolean; season?: number;
}) => adminReq("POST", "/points-table/admin/points-table/result", data);

/* ─── Admin Panel API (adminReq imported from adminHttp.ts) ────── */

// Admin session (login)
export const adminLogin = (password: string) =>
  fetch(`${BASE}/api/admin/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  }).then(async r => {
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as any).error ?? "Login failed"); }
    return r.json() as Promise<{ success: boolean; token: string }>;
  });

/* Stage 5 RBAC — server-managed admin users, refunds, API health */
export type AdminProfile = {
  email: string; name: string; role: string; cities: string[]; permissions: string[];
};

// Lightweight token check used on panel load to restore the session.
// Stage 5: also returns the admin identity so the panel can restore
// role-based navigation without a fresh login.
export const adminVerifySession = () =>
  adminReq<{ success: boolean; admin?: AdminProfile | null }>("GET", "/admin/session/verify");

// Email + password login for server-managed admin users (admin_users table).
export const adminEmailLogin = (email: string, password: string) =>
  fetch(`${BASE}/api/admin/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then(async r => {
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as any).error ?? "Login failed"); }
    return r.json() as Promise<{ success: boolean; token: string; admin?: AdminProfile }>;
  });

export type AdminUserRow = {
  id: string; email: string; name: string; role: string; cities: string[];
  active: boolean; lastLoginAt: string | null; createdAt: string; permissions: string[];
};
export const adminListAdminUsers = () =>
  adminReq<{ admins: AdminUserRow[]; roles: string[]; roleViews: Record<string, string[]> }>("GET", "/admin/admin-users");
export const adminCreateAdminUser = (data: { email: string; name: string; role: string; password: string; cities?: string[] }) =>
  adminReq<{ admin: AdminUserRow }>("POST", "/admin/admin-users", data);
export const adminUpdateAdminUser = (id: string, data: Partial<{ name: string; role: string; cities: string[]; active: boolean; password: string }>) =>
  adminReq<{ admin: AdminUserRow }>("PATCH", `/admin/admin-users/${id}`, data);
export const adminDeleteAdminUser = (id: string) =>
  adminReq<{ success: boolean }>("DELETE", `/admin/admin-users/${id}`);

export type AdminRefund = {
  id: string; registrationId: string; phase: number; paymentId: string | null; paymentRef: string | null;
  amount: string; reason: string; reasonNote: string | null; eligibility: string; status: string;
  requestedBy: string | null; decidedBy: string | null; decidedAt: string | null;
  processedBy: string | null; processedAt: string | null; refundRef: string | null; createdAt: string;
};
export type RefundRow = { refund: AdminRefund; regNumber: string | null; playerName: string | null; phone: string | null };
export type RefundCandidate = {
  registrationId: string; phase: number; payments: number; total: string;
  regNumber: string | null; playerName: string | null; phone: string | null; hasRefund: boolean;
};
export const adminGetRefunds = (params?: { status?: string; phase?: string }) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.phase) qs.set("phase", params.phase);
  const q = qs.toString();
  return adminReq<{ refunds: RefundRow[]; reasons: string[]; eligibility: string[] }>("GET", `/admin/refunds${q ? "?" + q : ""}`);
};
export const adminGetRefundCandidates = () =>
  adminReq<{ candidates: RefundCandidate[] }>("GET", "/admin/refunds/candidates");
export const adminCreateRefund = (data: {
  regNumber?: string; registrationId?: string; phase: number; reason: string;
  amount?: number; reasonNote?: string; eligibility?: string;
}) => adminReq<{ refund: AdminRefund }>("POST", "/admin/refunds", data);
export const adminRefundAction = (id: string, data: { action: "approve" | "reject" | "process"; refundRef?: string; eligibility?: string; note?: string }) =>
  adminReq<{ refund: AdminRefund }>("PATCH", `/admin/refunds/${id}`, data);

export type HealthIntegration = {
  id: string; name: string; configured: boolean; lastActivityAt: string | null;
  probe: { ok: boolean; note: string } | null; note: string;
};
export type HealthJob = { id: string; intervalMs: number | null; lastRunAt: string | null; lastOkAt: string | null; lastError: string | null; runs: number; fails: number };
export const adminGetApiHealth = (probe = false) =>
  adminReq<{ checkedAt: string; probed: boolean; uptimeSec: number; integrations: HealthIntegration[]; jobs: HealthJob[]; queues: Record<string, number> }>(
    "GET", `/admin/health${probe ? "?probe=1" : ""}`);

// Stats
export const adminGetStats = () =>
  adminReq<{
    registrations: { total:number; paymentDone:number; videoSubmitted:number; selected:number; rejected:number };
    videos: { total:number; pending:number; reviewed:number };
    kyc: { total:number; pending:number; verified:number; failed:number };
    users: { total:number };
  }>("GET", "/admin/stats");

// Phase 1 Registrations
export const adminGetRegistrations = (params?: Record<string, string>) =>
  adminReq<{ registrations: any[]; total: number }>(
    "GET",
    `/admin/registrations${params && Object.keys(params).length ? "?" + new URLSearchParams(params) : ""}`,
  );

export const adminUpdatePhase1Status = (id: string, status: string) =>
  adminReq<{ success: boolean; registration: any }>(
    "PUT", `/admin/registrations/${id}/phase1-status`, { status }
  );

export const adminUpdatePhase2Status = (id: string, status: string) =>
  adminReq<{ success: boolean; registration: any }>(
    "PUT", `/admin/registrations/${id}/phase2-status`, { status }
  );

// Videos
export const adminGetVideos = (status?: string) =>
  adminReq<{ videos: any[]; total: number }>(
    "GET", `/admin/videos${status ? `?status=${status}` : ""}`
  );

export const adminReviewVideo = (id: string, status = "reviewed") =>
  adminReq<{ success: boolean; video: any }>(
    "PUT", `/admin/videos/${id}/review`, { status }
  );

// Trial Venues
export const adminGetTrialVenues = () =>
  adminReq<{ venues: any[] }>("GET", "/admin/trial-venues");

export const adminCreateTrialVenue = (data: {
  city: string; venue: string; trialDate: string; trialTime: string;
  reportingTime: string; slots?: number; notes?: string;
}) => adminReq<{ success: boolean; venue: any }>("POST", "/admin/trial-venues", data);

export const adminUpdateTrialVenue = (id: string, data: Partial<{
  city: string; venue: string; trialDate: string; trialTime: string;
  reportingTime: string; slots: number; notes: string; status: string;
}>) => adminReq<{ success: boolean; venue: any }>("PUT", `/admin/trial-venues/${id}`, data);

export const adminDeleteTrialVenue = (id: string) =>
  adminReq<{ success: boolean }>("DELETE", `/admin/trial-venues/${id}`);

export const adminAnnounceTrialVenue = (id: string) =>
  adminReq<{ success: boolean; sent: number; total: number }>(
    "POST", `/admin/trial-venues/${id}/announce`
  );

// KYC
export const adminGetKyc = (status?: string) =>
  adminReq<{ kyc: any[]; total: number }>(
    "GET", `/admin/kyc${status ? `?status=${status}` : ""}`
  );

export const adminUpdateKycStatus = (id: string, status: string) =>
  adminReq<{ success: boolean; kyc: any }>(
    "PUT", `/admin/kyc/${id}/status`, { status }
  );

/* ─── Auth token helpers ───────────────────────────────── */

export function saveAuthToken(token: string, user: any): void {
  saveSession(token, user);
}

export function getAuthUser(): any | null {
  return getSession()?.user ?? null;
}

export function clearAuthToken(): void {
  clearSession();
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

/* ─── Registration ─────────────────────────────────────── */

export const registerPhase1 = (data: { role: string; trialCity: string; dob: string }) =>
  req<{
    success: boolean; registrationId: string;
    role: string; trialCity: string; phase1Fee: number; videoDeadline: string;
  }>("POST", "/register/phase1", data);

/** DOB backfill for players who registered before the age gate existed. */
export const updateDob = (dob: string) =>
  req<{ success: boolean }>("PATCH", "/register/dob", { dob });

/* ─── Payments ─────────────────────────────────────────── */

export const createPhase1Payment = (
  registrationId: string,
  consent?: { termsVersion: string; privacyVersion: string; marketingOptIn: boolean },
) =>
  req<{ success: boolean; orderId: string; paymentSessionId: string; amount: number }>(
    "POST", "/payment/phase1/create", consent ? { registrationId, consent } : { registrationId }
  );

export const verifyPhase1Payment = (orderId: string) =>
  req<{ success: boolean; registrationId: string; regNumber?: string | null }>(
    "POST", "/payment/phase1/verify", { orderId }
  );

export const createPhase2Payment = (
  registrationId: string,
  declarations?: { version: string; items: string[] },
) =>
  req<{ success: boolean; orderId: string; paymentSessionId: string; amount: number }>(
    "POST", "/payment/phase2/create", declarations ? { registrationId, declarations } : { registrationId }
  );

export const verifyPhase2Payment = (orderId: string) =>
  req<{ success: boolean; registrationId: string }>(
    "POST", "/payment/phase2/verify", { orderId }
  );

export const initiateKyc = (data: {
  registrationId: string;
  profession: string;
  aadhaarNumber: string;
  panNumber: string;
  // Jersey + emergency contact (collected on the KYC page after payment).
  // The server still accepts the old employment fields (company, jobTitle,
  // experience, linkedin) for backward compatibility, but the form no longer
  // collects or sends them.
  tshirtSize?: string;
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
  bloodGroup?: string;
}) => req<{
  success: boolean; kycId: string; status: string; message: string;
  aadhaarRefId?: string; panVerified?: boolean;
}>("POST", "/kyc/initiate", data);

export const verifyKycOtp = (data: {
  registrationId: string;
  aadhaarRefId: string;
  otp: string;
}) => req<{ success: boolean; status: string; message: string }>(
  "POST", "/kyc/verify-otp", data
);

/** Where the player left off in KYC — powers the resume-mid-way flow. */
export const getKycProgress = (registrationId: string) =>
  req<{
    hasKyc: boolean;
    status?: string;
    panVerified?: boolean;
    aadhaarVerified?: boolean;
    aadhaarParked?: boolean;
    profession?: string;
    profile?: {
      tshirtSize?: string | null; emergencyName?: string | null;
      emergencyRelation?: string | null; emergencyPhone?: string | null;
      bloodGroup?: string | null;
    } | null;
  }>("GET", `/kyc/progress/${registrationId}`);

/** (Re)send Aadhaar OTP only — never re-runs the billed PAN check. */
export const kycAadhaarOtp = (data: { registrationId: string; aadhaarNumber: string }) =>
  req<{ success: boolean; status: string; aadhaarRefId?: string; panVerified?: boolean; message: string }>(
    "POST", "/kyc/aadhaar-otp", data
  );

/** Verify PAN only — for players whose Aadhaar OTP is already done. */
export const kycVerifyPan = (data: { registrationId: string; panNumber: string }) =>
  req<{ success: boolean; status: string; message: string }>(
    "POST", "/kyc/verify-pan", data
  );

/* ─── Teams & Squads ───────────────────────────────── */

export type ApiTeam = {
  id: string; season: number; slug: string; name: string; city: string;
  color: string; secondColor: string; logoUrl: string;
  captain: string; coach: string; owner: string; homeGround: string;
  titlesWon: number; playerCount?: number;
};

export type ApiTeamPlayer = {
  id: string; teamId: string; name: string; role: string; age: number | null;
  state: string; photoUrl: string; battingStyle: string; bowlingStyle: string;
  jerseyNo: string; nationality: string; isCaptain: boolean; isViceCaptain: boolean;
  auctionPrice: string; stats: Record<string, unknown>;
};

export const getTeams = (season = 5) =>
  req<{ teams: ApiTeam[] }>("GET", `/teams?season=${season}`);

export const getTeamDetail = (slugOrId: string) =>
  req<{ team: ApiTeam; players: ApiTeamPlayer[] }>("GET", `/teams/${slugOrId}`);

export const adminCreateTeam = (data: { name: string } & Partial<Omit<ApiTeam, "id" | "slug">>) =>
  adminReq<{ success: boolean; team: ApiTeam }>("POST", "/teams/admin/teams", data);

export const adminUpdateTeam = (id: string, data: Partial<Omit<ApiTeam, "id" | "slug">>) =>
  adminReq<{ success: boolean; team: ApiTeam }>("PUT", `/teams/admin/teams/${id}`, data);

export const adminDeleteTeam = (id: string) =>
  adminReq<{ success: boolean }>("DELETE", `/teams/admin/teams/${id}`);

export const adminAddTeamPlayer = (teamId: string, data: Partial<Omit<ApiTeamPlayer, "id" | "teamId">> & { name: string }) =>
  adminReq<{ success: boolean; player: ApiTeamPlayer }>("POST", `/teams/admin/teams/${teamId}/players`, data);

export const adminUpdateTeamPlayer = (playerId: string, data: Partial<Omit<ApiTeamPlayer, "id" | "teamId">>) =>
  adminReq<{ success: boolean; player: ApiTeamPlayer }>("PUT", `/teams/admin/players/${playerId}`, data);

export const adminDeleteTeamPlayer = (playerId: string) =>
  adminReq<{ success: boolean }>("DELETE", `/teams/admin/players/${playerId}`);

/* ─── Site settings (admin-managed key-value, e.g. sample videos) ── */

export interface SampleVideoEntry { url: string; label?: string; uploadedAt?: string }
export type SampleVideoRole = 'batsman' | 'bowler' | 'wicket-keeper' | 'all-rounder';
export type SampleVideos = Partial<Record<SampleVideoRole, SampleVideoEntry | null>>;

export const getSiteSetting = <T = unknown>(key: string) =>
  req<{ key: string; value: T | null; updatedAt: string | null }>("GET", `/settings/${key}`);

export const adminSetSiteSetting = (key: string, value: unknown) =>
  adminReq<{ success: boolean; key: string }>("PUT", `/settings/admin/${key}`, { value });

export const adminGetSampleUploadUrl = (contentType: string, purpose?: "cms") =>
  adminReq<{ success: boolean; presignedUrl: string; s3Key: string; publicUrl: string }>(
    "POST", "/settings/admin/upload-url", { contentType, ...(purpose ? { purpose } : {}) }
  );

/* ─── Stage 6: homepage CMS config (display values for the public site) ── */
export interface HomepageDateItem { label: string; date: string }
export interface HomepageStatItem { label: string; value: string }
export interface HomepageConfig {
  heroDesktopUrl?: string; heroTabletUrl?: string; heroMobileUrl?: string; heroPosterUrl?: string;
  seasonNumber?: number;
  registrationStatus?: "open" | "closed" | "coming_soon";
  phase1FeeStandard?: number; phase1FeeAllRounder?: number;
  phase2FeeStandard?: number; phase2FeeAllRounder?: number;
  prizePool?: string; auctionValue?: string;
  importantDates?: HomepageDateItem[];
  stats?: HomepageStatItem[];
  socialLinks?: { instagram?: string; youtube?: string; x?: string; facebook?: string };
  supportEmail?: string; supportPhone?: string;
}

/* ─── Stage 6: employment verification (KYC team) ── */
export type EmploymentStatus = "pending" | "verified" | "failed" | "more_information_required";
export const adminSetKycEmployment = (
  id: string,
  data: { status: EmploymentStatus; method?: string; reference?: string; failureReason?: string; category?: string },
) => adminReq<{ success: boolean; kyc: Record<string, unknown> }>("PATCH", `/admin/kyc/${id}/employment`, data);

/* ─── Stage 6: fraud flags ── */
export interface FraudFlagRow {
  id: string; registrationId: string; type: string; status: string;
  reasonCode: string | null; detail: Record<string, unknown> | null;
  note: string | null; createdBy: string | null; reviewedBy: string | null;
  reviewedAt: string | null; createdAt: string; updatedAt: string;
  regNumber: string | null; player: string; phone: string; trialCity: string;
}
export const adminGetFraudFlags = (filters?: { status?: string; type?: string }) => {
  const qs = new URLSearchParams();
  if (filters?.status) qs.set("status", filters.status);
  if (filters?.type) qs.set("type", filters.type);
  const q = qs.toString();
  return adminReq<{ flags: FraudFlagRow[]; counts: Record<string, number>; total: number }>(
    "GET", "/admin/fraud" + (q ? "?" + q : "")
  );
};
export const adminRunFraudScan = () =>
  adminReq<{ success: boolean; candidates: number; created: number; byType: Record<string, number> }>(
    "POST", "/admin/fraud/scan"
  );
export const adminFraudFlagAction = (id: string, action: "clear" | "block" | "reflag", note?: string) =>
  adminReq<{ success: boolean; flag: FraudFlagRow }>("PATCH", `/admin/fraud/${id}`, { action, ...(note !== undefined ? { note } : {}) });

// Finance — send a real GST invoice email to the player
export const adminSendInvoice = (registrationId: string, phase: 1 | 2, email?: string) =>
  adminReq<{ success: boolean; sentTo: string; invoiceNo: string }>(
    "POST", "/admin/invoice/send",
    { registrationId, phase, ...(email ? { email } : {}) }
  );

/* ─── Phase 1 Result — BCPL Player Journey (100-point scoring) ── */

export interface ResultBreakdownItem { key: string; label?: string; score: number; max: number }
export interface MyResult {
  available: boolean;
  reason?: 'not_registered' | 'payment_pending' | 'video_pending' | 'under_review' | 'score_pending';
  phase1Status?: string;
  decision?: 'qualified' | 'not_shortlisted';
  name?: string;
  regNumber?: string | null;
  role?: string;
  trialCity?: string;
  total?: number;
  breakdown?: ResultBreakdownItem[];
  selectorNote?: string | null;
  cityRank?: number;
  cityCount?: number;
  roleRank?: number;
  roleCount?: number;
  scoredAt?: string;
  myFeedback?: { rating: string; comment?: string | null } | null;
}

export const getMyResult = () => req<MyResult>("GET", "/results/me");

export const sendResultFeedback = (rating: 'not_clear' | 'mostly_clear' | 'very_clear', comment?: string) =>
  req<{ success: boolean }>("POST", "/results/feedback", { rating, comment });

export interface Phase1ScoreInput {
  roleSkill: number;      // /35
  technique: number;      // /25
  execution: number;      // /15
  gameAwareness: number;  // /10
  movement: number;       // /10
  videoEvidence: number;  // /5
  selectorNote?: string | null;
}
export interface Phase1ScoreSaved extends Phase1ScoreInput { total: number }

export const adminSaveScore = (registrationId: string, data: Phase1ScoreInput) =>
  adminReq<{ success: boolean; score: Phase1ScoreSaved }>(
    "PUT", `/admin/registrations/${registrationId}/score`, data);


// Operational dashboard (Live Operations + Action Required tabs)
export interface OpsAlert { id: string; severity: "critical" | "warn" | "info"; label: string; count: number; tab: string }
export interface OpsData {
  matrix: { city: string | null; role: string; p1: string; p2: string | null; n: number }[];
  evals: { byStatus: Record<string, number>; avgScore: number | null; avgConfidence: number | null; avgProcessingMs: number | null };
  results: Record<string, number>;
  kyc: Record<string, number>;
  videos: Record<string, number>;
  alerts: OpsAlert[];
  trials?: { allocated: number; checkedIn: number; assessed: number };
}
export const adminGetOps = () => adminReq<OpsData>("GET", "/admin/ops");


/* ─── Stage 4: Physical Trials ───────────────────────────────────── */

export interface TrialSlotRec { id: string; venueId: string; city: string; slotDate: string; reportingTime: string; startTime: string; batchName: string; capacity: number; status: string; notes: string | null; createdAt: string; updatedAt: string; }
export interface TrialSlotRow { slot: TrialSlotRec; venueName: string | null; venueStatus: string | null; assigned: number; checkedIn: number; }
export interface TrialAllocRow {
  alloc: { id: string; registrationId: string; slotId: string; venueId: string; city: string; status: string; source: string; passToken: string; createdAt: string };
  fullName: string | null; regNumber: string | null; role: string; phone: string | null;
  batchName: string | null; slotDate: string | null; reportingTime: string | null; venueName: string | null;
  checkedInAt: string | null; assessedAt: string | null; assessResult: string | null;
}
export interface TrialCheckinRow {
  checkin: { id: string; method: string; staff: string | null; device: string | null; checkedInAt: string };
  fullName: string | null; regNumber: string | null; role: string; city: string; batchName: string | null;
}
export interface AssessmentRow {
  assessment: { id: string; registrationId: string; allocationId: string | null; city: string | null; venue: string | null; batch: string | null; assessor: string; playerRole: string; scores: Record<string, number>; finalScore: string; comments: string | null; result: string; createdAt: string; updatedAt: string };
  fullName: string | null; regNumber: string | null; role: string;
}
export interface TrialsOverviewCity { city: string; eligible: number; allocated: number; checkedIn: number; assessed: number; finalSelected: number; finalNotSelected: number; openCapacity: number; }
export interface AllocationRunResult { dryRun: boolean; totalAllocated: number; totalUnallocated: number; perCity: { city: string; eligible: number; allocated: number; unallocated: number }[]; notificationsQueued: number; notificationsEnabled: boolean; }
export interface AssessmentConfig { criteria: Record<string, string[]>; scale: { min: number; max: number }; weighting: string; results: string[]; }

const trialQs = (p: Record<string, string | undefined>): string => {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "") u.set(k, v);
  const s = u.toString();
  return s ? `?${s}` : "";
};

export const adminGetTrialSlots = (city?: string) =>
  adminReq<{ slots: TrialSlotRow[] }>("GET", `/admin/trials/slots${trialQs({ city })}`);
export const adminCreateTrialSlot = (body: { venueId: string; batchName: string; capacity?: number; slotDate?: string; reportingTime?: string; startTime?: string; notes?: string }) =>
  adminReq<{ slot: TrialSlotRec }>("POST", "/admin/trials/slots", body);
export const adminPatchTrialSlot = (id: string, body: Partial<{ batchName: string; capacity: number; slotDate: string; reportingTime: string; startTime: string; notes: string; status: string }>) =>
  adminReq<{ slot: TrialSlotRec }>("PATCH", `/admin/trials/slots/${id}`, body);
export const adminDeleteTrialSlot = (id: string) =>
  adminReq<{ ok: boolean }>("DELETE", `/admin/trials/slots/${id}`);
export const adminPatchTrialVenueExtras = (id: string, body: { address?: string | null; mapsUrl?: string | null }) =>
  adminReq<{ venue: unknown }>("PATCH", `/admin/trials/venues/${id}`, body);
export const adminRunTrialAllocation = (body: { city?: string; dryRun: boolean; by?: string }) =>
  adminReq<AllocationRunResult>("POST", "/admin/trials/allocate", body);
export const adminGetTrialAllocations = (p: { city?: string; slotId?: string; q?: string }) =>
  adminReq<{ allocations: TrialAllocRow[] }>("GET", `/admin/trials/allocations${trialQs(p)}`);
export const adminMoveTrialAllocation = (id: string, slotId: string) =>
  adminReq<{ allocation: unknown }>("PATCH", `/admin/trials/allocations/${id}`, { slotId });
export const adminCancelTrialAllocation = (id: string) =>
  adminReq<{ allocation: unknown }>("POST", `/admin/trials/allocations/${id}/cancel`);
export const adminTrialCheckin = (body: { token?: string; regNumber?: string; staff?: string; device?: string }) =>
  adminReq<{ ok: boolean; checkedInAt: string; player: { name: string; regNumber: string | null; role: string; city: string }; slot: { batch: string; date: string; reportingTime: string } | null }>("POST", "/admin/trials/checkin", body);
export const adminGetTrialCheckins = (p: { city?: string; slotId?: string }) =>
  adminReq<{ checkins: TrialCheckinRow[] }>("GET", `/admin/trials/checkins${trialQs(p)}`);
export const adminGetAssessmentConfig = () =>
  adminReq<AssessmentConfig>("GET", "/admin/trials/assessment-config");
export const adminSaveAssessment = (body: { registrationId: string; scores: Record<string, number>; comments?: string; assessor: string; result?: string }) =>
  adminReq<{ assessment: AssessmentRow["assessment"] }>("POST", "/admin/trials/assessments", body);
export const adminPatchAssessment = (id: string, body: { result?: string; comments?: string }) =>
  adminReq<{ assessment: AssessmentRow["assessment"] }>("PATCH", `/admin/trials/assessments/${id}`);
export const adminGetAssessments = (p: { city?: string; result?: string; q?: string }) =>
  adminReq<{ assessments: AssessmentRow[] }>("GET", `/admin/trials/assessments${trialQs(p)}`);
export const adminGetTrialsOverview = () =>
  adminReq<{ cities: TrialsOverviewCity[] }>("GET", "/admin/trials/overview");

/* player-facing digital trial pass */
export interface TrialPassData {
  player: { name: string; regNumber: string | null; role: string; city: string | null };
  venue: { name: string; city: string; address: string | null; mapsUrl: string | null } | null;
  slot: { batch: string; date: string; reportingTime: string; startTime: string } | null;
  checkedInAt: string | null;
  qrDataUrl: string;
}
export const getTrialPass = () => req<TrialPassData>("GET", "/user/trial-pass");
