/**
 * BCPL API Client
 * All calls go to the API server (VITE_API_URL).
 * Admin calls include the x-bcpl-admin header automatically.
 */

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY ?? "";
const AUTH_KEY  = "bcpl_auth_v1";

function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s?.token ?? null;
  } catch { return null; }
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

export const getMe = () =>
  req<{ user: { id: string; name: string; phone: string; email: string } }>(
    "GET", "/auth/me"
  );

export const getRegistrationStatus = () =>
  req<{ registered: boolean; phase1Status?: string; phase2Status?: string | null }>(
    "GET", "/register/status"
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
