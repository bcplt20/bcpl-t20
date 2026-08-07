/**
 * Admin API for the Matches view — match deletion.
 *
 * Uses the shared adminReq plumbing (auth headers, token renewal, error shape).
 * Do NOT add fetch logic here — always route through adminReq.
 */
import { adminReq } from "../../lib/adminHttp";

/**
 * Delete a match and all its scoring data.
 *
 * When the match already has score data, the server replies 409 and adminReq
 * throws an Error whose message explains what would be lost. Call again with
 * force=true to confirm the destructive delete.
 */
/** AI match-report draft (Gemini) — Hindi + English, generated from the real scorecard. */
export type AiReportDraft = { titleEn: string; titleHi: string; reportEn: string; reportHi: string };
export const adminAiReportDraft = (id: string) =>
  adminReq<AiReportDraft>("POST", `/admin/ai/matches/${id}/report-draft`);

export const adminDeleteMatch = (id: string, force = false) =>
  adminReq<{ success: boolean }>(
    "DELETE",
    `/matches/admin/matches/${id}${force ? "?force=1" : ""}`,
  );
