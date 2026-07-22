/**
 * Player referral program API client.
 *
 * NOTE: BASE and adminReq are deliberately DUPLICATED from api.ts (same
 * pattern as marketingApi.ts). Several queued tasks edit api.ts, and keeping
 * this module fully self-contained avoids merge conflicts. If the admin auth
 * scheme changes in api.ts, mirror it here.
 */
import { getSession } from "./auth";

const BASE =
  (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") ||
  (import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, ""));
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY ?? "";
const ADMIN_TOKEN_KEY = "bcpl_admin_token_v1";

function getAdminToken(): string | null {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}

// Sliding session (mirrors api.ts): the server re-issues a fresh token via
// this header once the current one is past half its life — persist it.
function captureRenewedToken(res: Response): void {
  const renewed = res.headers.get("x-bcpl-admin-token-renewed");
  if (renewed) { try { localStorage.setItem(ADMIN_TOKEN_KEY, renewed); } catch {} }
}

async function adminReq<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAdminToken();
  if (token) headers["x-bcpl-admin-token"] = token;
  // Legacy fallback (mirrors api.ts adminReq)
  if (!token && ADMIN_KEY) headers["x-bcpl-admin"] = ADMIN_KEY;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  captureRenewedToken(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

/** Player-authenticated GET (Bearer token from the OTP session). */
async function playerReq<T = unknown>(path: string): Promise<T> {
  const token = getSession()?.token;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

/* ─── Player side ── */

export type RewardTierStatus = {
  threshold: number;
  reward: string;
  reached: boolean;
  rewardGiven: boolean;
};
export type LeaderboardRow = { rank: number; name: string; paid: number; isMe: boolean };
export type MyReferral =
  | { eligible: false }
  | {
      eligible: true;
      code: string;
      link: string;
      joined: number;
      paid: number;
      rank: number | null;
      totalReferrers: number;
      tiers: RewardTierStatus[];
      leaderboard: LeaderboardRow[];
    };

/** My referral card — lazily creates the code server-side for any
 *  Phase-1-paid player (old registrations included). */
export const getMyReferral = () => playerReq<MyReferral>("/referral/me");

/** Prefilled WhatsApp share (Hinglish — players share with colleagues). */
export function whatsAppShareUrl(link: string): string {
  const msg =
    "🏏 Maine BCPL T20 Season 5 ke liye register kar liya hai — India ki sabse badi corporate cricket league!\n\n" +
    "Tum bhi apna cricket talent dikhao. Mere personal link se register karo 👇\n" + link;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

/* ─── Admin side ── */

export type RewardTier = {
  id: string;
  threshold: number;
  reward: string;
  createdAt: string;
  updatedAt: string;
};
export type ReferrerMilestone = { threshold: number; reward: string; given: boolean };
export type PlayerReferrerRow = {
  code: string;
  name: string;
  phone: string | null;
  clicks: number;
  createdAt: string;
  joined: number;
  paid: number;
  milestones: ReferrerMilestone[];
};
export type ReferralOverview = {
  players: PlayerReferrerRow[];
  totals: {
    referrers: number;
    activeReferrers: number;
    joined: number;
    paid: number;
    rewardsGiven: number;
    rewardsDue: number;
  };
};

export const adminListTiers = () =>
  adminReq<{ tiers: RewardTier[] }>("GET", "/referral/admin/tiers");

export const adminCreateTier = (data: { threshold: number; reward: string }) =>
  adminReq<{ success: boolean; tier: RewardTier }>("POST", "/referral/admin/tiers", data);

export const adminUpdateTier = (id: string, data: Partial<{ threshold: number; reward: string }>) =>
  adminReq<{ success: boolean; tier: RewardTier }>("PUT", `/referral/admin/tiers/${id}`, data);

export const adminDeleteTier = (id: string) =>
  adminReq<{ success: boolean }>("DELETE", `/referral/admin/tiers/${id}`);

export const adminReferralOverview = () =>
  adminReq<ReferralOverview>("GET", "/referral/admin/overview");

export const adminMarkRewardGiven = (code: string, threshold: number) =>
  adminReq<{ success: boolean }>("POST", "/referral/admin/grants", { code, threshold });

export const adminUnmarkRewardGiven = (code: string, threshold: number) =>
  adminReq<{ success: boolean }>("DELETE", "/referral/admin/grants", { code, threshold });
