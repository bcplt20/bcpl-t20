/**
 * Admin API for server-backed operational settings:
 *  - founder_signature: small data-URL signature image stamped on generated
 *    contracts (ContractsView). Admin-only; never public.
 *  - trial_ops_defaults: last-used staff / assessor names for on-ground trial
 *    check-in & assessment (TrialsOps), shared across devices.
 *
 * Uses the shared adminReq plumbing (auth headers, token renewal, error shape).
 * Do NOT add fetch logic here — always route through adminReq.
 */
import { adminReq } from "../../lib/adminHttp";

export type FounderSignature = { image: string };
export type TrialOpsDefaults = { staff: string; assessor: string };

type SettingRes<T> = { key: string; value: T | null; updatedAt: string | null };

export const fetchFounderSignature = () =>
  adminReq<SettingRes<FounderSignature>>("GET", "/settings/admin/founder_signature");

export const saveFounderSignature = (value: FounderSignature) =>
  adminReq<{ success: boolean }>("PUT", "/settings/admin/founder_signature", { value });

export const fetchTrialOpsDefaults = () =>
  adminReq<SettingRes<Partial<TrialOpsDefaults>>>("GET", "/settings/admin/trial_ops_defaults");

/** Legacy localStorage keys (pre server-backing) — cleared after a successful server save. */
export const LEGACY_TRIAL_STAFF_KEY = "bcpl_trial_staff";
export const LEGACY_TRIAL_ASSESSOR_KEY = "bcpl_trial_assessor";

/**
 * Save one or both trial default names. The server merges partial values
 * atomically (SQL jsonb merge), so the check-in and assessment tabs can save
 * concurrently from different devices without losing each other's field.
 * Called fire-and-forget from action handlers — a failure must never block
 * the actual check-in / assessment, so it only warns on the console.
 */
export async function persistTrialOpsDefaults(partial: Partial<TrialOpsDefaults>): Promise<void> {
  try {
    const clean: Partial<TrialOpsDefaults> = {};
    if (partial.staff !== undefined) clean.staff = partial.staff.slice(0, 80);
    if (partial.assessor !== undefined) clean.assessor = partial.assessor.slice(0, 80);
    if (clean.staff === undefined && clean.assessor === undefined) return;
    await adminReq<{ success: boolean }>("PUT", "/settings/admin/trial_ops_defaults", { value: clean });
    if (clean.staff !== undefined) localStorage.removeItem(LEGACY_TRIAL_STAFF_KEY);
    if (clean.assessor !== undefined) localStorage.removeItem(LEGACY_TRIAL_ASSESSOR_KEY);
  } catch (err) {
    console.warn("Could not save trial defaults to server:", err);
  }
}
