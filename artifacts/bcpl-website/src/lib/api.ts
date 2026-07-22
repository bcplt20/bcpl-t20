/**
 * BCPL API Client
 * All calls go to the API server (VITE_API_URL).
 * Admin calls include the x-bcpl-admin header automatically.
 */

import { getSession, saveSession, clearSession } from "./auth";

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY ?? "";

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
