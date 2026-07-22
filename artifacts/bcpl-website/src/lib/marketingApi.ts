/**
 * Marketing / referral API client.
 *
 * Admin request plumbing (auth headers, sliding-session renewal, error
 * shape) is shared via adminHttp.ts — the single source of truth.
 */
import { getSession } from "./auth";
import { BASE, adminReq } from "./adminHttp";

/* ─── Public referral capture (used by /r/:code page + Registration) ── */

const REF_KEY = "bcpl_ref";
const REF_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function saveReferralCode(code: string): void {
  try {
    localStorage.setItem(REF_KEY, JSON.stringify({ code: code.toUpperCase(), ts: Date.now() }));
  } catch { /* private mode etc. — referral capture is best-effort */ }
}

export function getStoredReferralCode(): string | null {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code?: string; ts?: number };
    if (!parsed.code || typeof parsed.ts !== "number" || Date.now() - parsed.ts > REF_TTL_MS) {
      localStorage.removeItem(REF_KEY);
      return null;
    }
    return String(parsed.code).toUpperCase();
  } catch { return null; }
}

/** Fire-and-forget click counter. Never blocks or throws. */
export function trackReferralClick(code: string): void {
  try {
    void fetch(`${BASE}/api/marketing/click/${encodeURIComponent(code)}`, { method: "POST" })
      .catch(() => {});
  } catch { /* ignore */ }
}

/** After a successful Phase-1 registration, attribute it to the stored
 *  referral code (if any). Fire-and-forget — never blocks the payment flow. */
export function fireReferralAttribution(registrationId: string): void {
  const code = getStoredReferralCode();
  if (!code) return;
  const token = getSession()?.token;
  if (!token) return;
  try {
    void fetch(`${BASE}/api/marketing/attribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ registrationId, code }),
    }).catch(() => {});
  } catch { /* ignore */ }
}

/** Public link shown/copied in the admin panel. */
export const referralLink = (code: string) => `https://bcplt20.com/r/${code}`;

/* ─── Types ── */

export type ReferralStat = {
  id: string;
  code: string;
  name: string;
  kind: "influencer" | "agent" | string;
  platform: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  commissionRate: number;
  paidOut: number;
  active: boolean;
  createdAt: string;
  clicks: number;
  signups: number;
  paid: number;
  revenue: number;
  commission: number;
};

export type FunnelData = {
  counts: {
    users: number;
    registrations: number;
    phase1Paid: number;
    videoUploaded: number;
    phase1Selected: number;
    phase2Paid: number;
  };
  revenue: { phase1: number; phase2: number; total: number };
  cities: string[];
};

export type Campaign = {
  id: string;
  name: string;
  channel: string;
  budget: number;
  spent: number;
  startDate: string | null;
  endDate: string | null;
  goal: string | null;
  status: "active" | "paused" | "completed" | string;
  notes: string | null;
  createdAt: string;
};

export type AudienceStage = "all" | "registered" | "p1_paid" | "video" | "selected" | "p2_paid";

export type EmailCampaign = {
  id: string;
  subject: string;
  body: string;
  audience: { stage?: AudienceStage; city?: string };
  status: "sending" | "sent" | "failed" | string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  testSentTo: string | null;
  createdAt: string;
  completedAt: string | null;
};

/* ─── Admin: funnel & referrals ── */

export const getMarketingFunnel = () => adminReq<FunnelData>("GET", "/marketing/funnel");

export const listReferrals = () =>
  adminReq<{ referrals: ReferralStat[] }>("GET", "/marketing/referrals");

export const createReferral = (data: {
  name: string; code?: string; kind?: "influencer" | "agent"; platform?: string;
  city?: string; phone?: string; email?: string; commissionRate?: number;
}) => adminReq<{ success: boolean; referral: ReferralStat }>("POST", "/marketing/referrals", data);

export const updateReferral = (id: string, data: Partial<{
  name: string; platform: string; city: string; phone: string; email: string;
  commissionRate: number; paidOut: number; active: boolean;
}>) => adminReq<{ success: boolean; referral: ReferralStat }>("PUT", `/marketing/referrals/${id}`, data);

export const deleteReferral = (id: string) =>
  adminReq<{ success: boolean }>("DELETE", `/marketing/referrals/${id}`);

/* ─── Admin: manual ad campaigns ── */

export const listCampaigns = () =>
  adminReq<{ campaigns: Campaign[] }>("GET", "/marketing/campaigns");

export const createCampaign = (data: Partial<Omit<Campaign, "id" | "createdAt">> & { name: string }) =>
  adminReq<{ success: boolean; campaign: Campaign }>("POST", "/marketing/campaigns", data);

export const updateCampaign = (id: string, data: Partial<Omit<Campaign, "id" | "createdAt">>) =>
  adminReq<{ success: boolean; campaign: Campaign }>("PUT", `/marketing/campaigns/${id}`, data);

export const deleteCampaign = (id: string) =>
  adminReq<{ success: boolean }>("DELETE", `/marketing/campaigns/${id}`);

/* ─── Admin: email campaigns ── */

export const listEmailCampaigns = () =>
  adminReq<{ campaigns: EmailCampaign[] }>("GET", "/marketing/email-campaigns");

export const getEmailCampaign = (id: string) =>
  adminReq<{ campaign: EmailCampaign }>("GET", `/marketing/email-campaigns/${id}`);

export const previewAudience = (audience: { stage: AudienceStage; city?: string }) =>
  adminReq<{ total: number; sample: { email: string; name: string }[] }>(
    "POST", "/marketing/email-campaigns/preview", audience);

export const sendTestEmail = (data: { subject: string; body: string; toEmail: string }) =>
  adminReq<{ success: boolean; sentTo: string }>("POST", "/marketing/email-campaigns/test", data);

export const sendEmailCampaign = (data: {
  subject: string; body: string;
  audience: { stage: AudienceStage; city?: string };
  testedEmail: string;
}) => adminReq<{ success: boolean; campaign: EmailCampaign }>("POST", "/marketing/email-campaigns/send", data);
