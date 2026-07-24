/**
 * Admin API for the Sponsors view — server-backed sponsor list.
 *
 * Storage: site_settings key "sponsors" on the API server. Full records
 * (amount, contract date, status) are admin-only; the public website reads
 * a sanitized list from GET /api/sponsors (active sponsors, no amounts).
 *
 * Uses the shared adminReq plumbing (auth headers, token renewal, error shape).
 * Do NOT add fetch logic here — always route through adminReq.
 */
import { adminReq } from "../../lib/adminHttp";

export type Sponsor = {
  id: string;
  name: string;
  category: string;   // free-text: "Title Sponsor", "Powered By", etc.
  logo: string;       // http(s) URL (S3 cms/ upload) or ""
  amount: string;     // private — never shown on the public site
  website: string;
  contract: string;   // private — contract-until date
  status: "active" | "negotiating" | "expired";
  visibility: string;
};

export const fetchSponsorsAdmin = () =>
  adminReq<{ key: string; value: Sponsor[] | null; updatedAt: string | null }>(
    "GET", "/settings/admin/sponsors",
  );

export const saveSponsorsAdmin = (value: Sponsor[]) =>
  adminReq<{ success: boolean }>("PUT", "/settings/admin/sponsors", { value });
