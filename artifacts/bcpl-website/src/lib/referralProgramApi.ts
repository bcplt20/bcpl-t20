/**
 * Player referral program API client.
 *
 * Admin request plumbing (auth headers, sliding-session renewal, error
 * shape) is shared via adminHttp.ts — the single source of truth.
 */
import { getSession } from "./auth";
import { BASE, adminReq } from "./adminHttp";

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
