/**
 * Admin API for Sponsorship Enquiries — leads submitted from the public
 * Sponsorship Hub (POST /api/sponsors/enquiry). The admin endpoints are
 * being built in parallel in the api-server; this client routes through the
 * shared adminReq plumbing (auth headers, token renewal, error shape).
 *
 * Expected server routes (admin):
 *   GET  /admin/sponsors/enquiries            → { enquiries: SponsorEnquiry[] }
 *   PATCH /admin/sponsors/enquiries/:id       → { enquiry: SponsorEnquiry }
 *     body: { status?: EnquiryStatus; note?: string }
 *
 * All calls are null-safe at the caller (the view degrades to an empty list
 * with a friendly message if the endpoint isn't live yet).
 */
import { adminReq } from "../../lib/adminHttp";

export type EnquiryStatus = "new" | "contacted" | "closed";

export type SponsorEnquiry = {
  id: string;
  name: string;
  company: string;
  designation: string;
  phone: string;
  email: string;
  budget: string;
  message: string;
  status: EnquiryStatus;
  note: string;
  createdAt: string; // ISO
};

export const fetchSponsorEnquiries = () =>
  adminReq<{ enquiries: SponsorEnquiry[] }>("GET", "/admin/sponsors/enquiries");

export const updateSponsorEnquiry = (
  id: string,
  patch: { status?: EnquiryStatus; note?: string },
) =>
  adminReq<{ enquiry: SponsorEnquiry }>(
    "PATCH", `/admin/sponsors/enquiries/${encodeURIComponent(id)}`, patch,
  );
