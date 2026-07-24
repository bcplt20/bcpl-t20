/**
 * Admin API for the "Incomplete Registrations" (registration funnel) view.
 *
 * Uses the shared adminReq plumbing (auth headers, token renewal, error shape).
 * Do NOT add fetch logic here — always route through adminReq.
 */
import { adminReq } from "../../lib/adminHttp";

export type DraftRow = {
  id: string;
  draftNumber: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  trialCity: string | null;
  mobileVerified: boolean;
  status: string;
  phase1PaymentStatus: string;
  registrationId: string | null;
  startedAt: string;
  lastActivityAt: string;
};

export type DraftsResponse = {
  counts: Record<string, number>;
  drafts: DraftRow[];
};

/** Fetch drafts filtered by a funnel group (otp_not_taken | otp_done). */
export const adminGetDrafts = (group: "otp_not_taken" | "otp_done") =>
  adminReq<DraftsResponse>("GET", `/admin/drafts?group=${group}&limit=500`);
