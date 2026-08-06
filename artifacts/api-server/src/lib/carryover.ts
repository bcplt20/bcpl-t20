/**
 * Legacy PAID carryover detection — SINGLE source of truth (server side).
 *
 * Old-site PAID players (~14-15k) were promised trials for two seasons on the
 * same payment. On login we provision a registration that lands directly on
 * Phase-2 KYC: phase1Status "selected", phase2Status "payment_done", and a
 * `consents.legacyCarryover` audit marker (see routes/auth.ts
 * provisionLegacyCarryover). That marker is the canonical carryover check —
 * these players NEVER pay Phase-1 or upload a skill video.
 */

/** True when the registration was provisioned as a legacy paid carryover. */
export function isLegacyCarryover(consents: unknown): boolean {
  if (!consents || typeof consents !== "object") return false;
  return "legacyCarryover" in (consents as Record<string, unknown>)
    && (consents as Record<string, unknown>).legacyCarryover != null;
}
