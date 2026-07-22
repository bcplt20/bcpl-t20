/**
 * BCPL API Client
 * All calls go to the API server (VITE_API_URL).
 * Admin calls include the x-bcpl-admin header automatically.
 */

import { getSession, saveSession, clearSession } from "./auth";

/**
 * API base URL:
 * 1. VITE_API_URL wins when set (explicit override).
 * 2. Otherwise fall back to the app's base path — "/" in production
 *    (nginx routes /api), "/bcpl-website/" in the Replit dev preview
 *    (vite dev proxy routes it to the local API server).
 */
const BASE =
  (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") ||
  (import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, ""));
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY ?? "";

// True when a legacy VITE_ADMIN_KEY is baked into the bundle (old header auth fallback).
export const hasLegacyAdminKey = () => Boolean(ADMIN_KEY);

/** Reading via getSession() also refreshes the 48h inactivity window on every API call. */
function getStoredToken(): string | null {
  return getSession()?.token ?? null;
}

async function req<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  isAdmin = false,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isAdmin && ADMIN_KEY) headers["x-bcpl-admin"] = ADMIN_KEY;
  const token = getStoredToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error ?? res.statusText);
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
}) => req<{ match: any }>("POST", "/matches/admin/matches", data, true);

export const recordToss = (matchId: string, data: {
  tossWinner: string; tossDecision: "bat" | "field";
}) => req<{ match: any }>("PUT", `/matches/admin/matches/${matchId}/toss`, data, true);

export const setPlayingXI = (matchId: string, data: {
  xi1: { name: string; role: string }[];
  xi2: { name: string; role: string }[];
  battingTeam: string;
}) => req<{ innings: any }>("POST", `/matches/admin/matches/${matchId}/xi`, data, true);

export const updateMatchStatus = (matchId: string, data: {
  status: string; winner?: string; resultDesc?: string; playerOfMatch?: string;
}) => req<{ match: any }>("PUT", `/matches/admin/matches/${matchId}/status`, data, true);

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
}) => req<{ success: boolean; inningsComplete: boolean }>(
  "POST", `/scoring/admin/scoring/${matchId}/ball`, data, true
);

export const endInnings = (matchId: string) =>
  req<{ innings2: any; target: number }>(
    "POST", `/scoring/admin/scoring/${matchId}/innings-end`, {}, true
  );

export const undoBall = (matchId: string) =>
  req<{ success: boolean }>("DELETE", `/scoring/admin/scoring/${matchId}/ball`, undefined, true);

/* ─── Points Table ─────────────────────────────────── */

export const getPointsTable = (season = 5) =>
  req<{ table: any[] }>("GET", `/points-table?season=${season}`);

export const updatePointsRow = (team: string, data: {
  played?: number; won?: number; lost?: number; noResult?: number; nrr?: number; form?: string[];
}, season = 5) =>
  req<{ row: any }>(
    "PUT", `/points-table/admin/points-table/${encodeURIComponent(team)}?season=${season}`, data, true
  );

export const recordMatchResult = (data: {
  winner?: string; loser?: string; noResult?: boolean; season?: number;
}) => req("POST", "/points-table/admin/points-table/result", data, true);

/* ─── Admin Panel API ──────────────────────────────────────────── */

const ADMIN_TOKEN_KEY = "bcpl_admin_token_v1";

function getAdminToken(): string | null {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}

export function saveAdminToken(token: string): void {
  try { localStorage.setItem(ADMIN_TOKEN_KEY, token); } catch {}
}

export function clearAdminToken(): void {
  try { localStorage.removeItem(ADMIN_TOKEN_KEY); } catch {}
}

async function adminReq<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAdminToken();
  if (token) headers["x-bcpl-admin-token"] = token;
  // Legacy fallback for server-to-server calls
  if (!token && ADMIN_KEY) headers["x-bcpl-admin"] = ADMIN_KEY;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

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
  req<{ success: boolean; registrationId: string }>(
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
  req<{ success: boolean; team: ApiTeam }>("POST", "/teams/admin/teams", data, true);

export const adminUpdateTeam = (id: string, data: Partial<Omit<ApiTeam, "id" | "slug">>) =>
  req<{ success: boolean; team: ApiTeam }>("PUT", `/teams/admin/teams/${id}`, data, true);

export const adminDeleteTeam = (id: string) =>
  req<{ success: boolean }>("DELETE", `/teams/admin/teams/${id}`, undefined, true);

export const adminAddTeamPlayer = (teamId: string, data: Partial<Omit<ApiTeamPlayer, "id" | "teamId">> & { name: string }) =>
  req<{ success: boolean; player: ApiTeamPlayer }>("POST", `/teams/admin/teams/${teamId}/players`, data, true);

export const adminUpdateTeamPlayer = (playerId: string, data: Partial<Omit<ApiTeamPlayer, "id" | "teamId">>) =>
  req<{ success: boolean; player: ApiTeamPlayer }>("PUT", `/teams/admin/players/${playerId}`, data, true);

export const adminDeleteTeamPlayer = (playerId: string) =>
  req<{ success: boolean }>("DELETE", `/teams/admin/players/${playerId}`, undefined, true);

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
