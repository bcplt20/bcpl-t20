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

export const sendOtp = (phone: string, purpose: "login" | "register" = "login") =>
  req<{ success: boolean; message: string; devOtp?: string }>(
    "POST", "/auth/send-otp", { phone, purpose }
  );

export const verifyOtp = (phone: string, otp: string, purpose: "login" | "register" = "login", name?: string, email?: string) =>
  req<{ success: boolean; token: string; user: { id: string; name: string; phone: string; email: string } }>(
    "POST", "/auth/verify-otp", { phone, otp, purpose, name, email }
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
  }>("GET", "/video/status");

export const getUploadUrl = (registrationId: string, contentType: string) =>
  req<{ success: boolean; presignedUrl: string; s3Key: string }>(
    "POST", "/video/upload-url", { registrationId, contentType }
  );

export const confirmVideoUpload = (registrationId: string, s3Key: string) =>
  req<{ success: boolean; message: string }>(
    "POST", "/video/confirm", { registrationId, s3Key }
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

// Lightweight token check used on panel load to restore the session
export const adminVerifySession = () =>
  adminReq<{ success: boolean }>("GET", "/admin/session/verify");

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

export const registerPhase1 = (data: { role: string; trialCity: string }) =>
  req<{
    success: boolean; registrationId: string;
    role: string; trialCity: string; phase1Fee: number; videoDeadline: string;
  }>("POST", "/register/phase1", data);

/* ─── Payments ─────────────────────────────────────────── */

export const createPhase1Payment = (registrationId: string) =>
  req<{ success: boolean; orderId: string; paymentSessionId: string; amount: number }>(
    "POST", "/payment/phase1/create", { registrationId }
  );

export const verifyPhase1Payment = (orderId: string) =>
  req<{ success: boolean; registrationId: string; regNumber?: string | null }>(
    "POST", "/payment/phase1/verify", { orderId }
  );

export const createPhase2Payment = (registrationId: string) =>
  req<{ success: boolean; orderId: string; paymentSessionId: string; amount: number }>(
    "POST", "/payment/phase2/create", { registrationId }
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

export const adminGetSampleUploadUrl = (contentType: string) =>
  adminReq<{ success: boolean; presignedUrl: string; s3Key: string; publicUrl: string }>(
    "POST", "/settings/admin/upload-url", { contentType }
  );

// Finance — send a real GST invoice email to the player
export const adminSendInvoice = (registrationId: string, phase: 1 | 2, email?: string) =>
  adminReq<{ success: boolean; sentTo: string; invoiceNo: string }>(
    "POST", "/admin/invoice/send",
    { registrationId, phase, ...(email ? { email } : {}) }
  );

/* ─── Phase 1 Result — BCPL Player Journey (100-point scoring) ── */

export interface ResultBreakdownItem { key: string; score: number; max: number }
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
}

export const getMyResult = () => req<MyResult>("GET", "/results/me");

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
