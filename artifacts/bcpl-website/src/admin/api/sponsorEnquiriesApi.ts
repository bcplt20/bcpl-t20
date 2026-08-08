/**
 * Admin API for Sponsorship Enquiries — leads submitted from the public
 * Sponsorship Hub (POST /api/sponsors/enquiry). Routes through the shared
 * adminReq plumbing (auth headers, token renewal, error shape).
 *
 * Server routes (see api-server/src/routes/sponsorEnquiries.ts):
 *   GET   /api/sponsors/admin/enquiries[?status=]  → { enquiries, statuses, budgetRanges }
 *   PATCH /api/sponsors/admin/enquiries/:id        → { ok, enquiry }
 *     body: { status?: EnquiryStatus; adminNote?: string }
 *
 * Gated server-side to CONTENT_TEAM / FINANCE_TEAM (SUPER_ADMIN always passes).
 * The view degrades to an empty list with a friendly message on any error.
 */
import { adminReq } from "../../lib/adminHttp";

export type EnquiryStatus = "new" | "contacted" | "closed";
/** Fixed server vocabulary — matches BUDGET_RANGES in the API route. */
export type BudgetRange = "under-1L" | "1-5L" | "5-15L" | "15L-plus" | "custom";

export type SponsorEnquiry = {
  id: string;
  name: string;
  company: string;
  designation: string | null;
  phone: string;
  email: string | null;
  budgetRange: string;
  message: string | null;
  source: string;
  status: EnquiryStatus;
  adminNote: string | null;
  createdAt: string; // ISO
};

export const fetchSponsorEnquiries = (status?: EnquiryStatus) =>
  adminReq<{ enquiries: SponsorEnquiry[]; statuses?: string[]; budgetRanges?: string[] }>(
    "GET",
    `/sponsors/admin/enquiries${status ? `?status=${encodeURIComponent(status)}` : ""}`,
  );

export const updateSponsorEnquiry = (
  id: string,
  patch: { status?: EnquiryStatus; adminNote?: string },
) =>
  adminReq<{ ok: boolean; enquiry: { id: string; status: EnquiryStatus; adminNote: string | null } }>(
    "PATCH", `/sponsors/admin/enquiries/${encodeURIComponent(id)}`, patch,
  );
