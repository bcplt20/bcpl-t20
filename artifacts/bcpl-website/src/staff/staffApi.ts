/**
 * Staff mobile app — API client. ALL admin/staff plumbing goes through
 * lib/adminHttp (single source of truth for token handling); never
 * duplicate token logic here.
 */
import { adminReq, BASE, saveAdminToken, hasAdminToken, clearAdminToken } from "../lib/adminHttp";

export { hasAdminToken, clearAdminToken };

export interface StaffMe { email: string; name: string; role: string; cities: string[] }

export interface GateResult {
  status: "GREEN" | "YELLOW" | "RED";
  code: string; label: string; sub: string;
  trialNo?: string; role?: string; batch?: string | null;
  reportingTime?: string | null; slotDate?: string | null;
}

export interface AttemptEntry { seq: number; outcome: string }
export interface AttemptState {
  batting: { valid: AttemptEntry[]; feederErrors: number };
  bowling: { valid: AttemptEntry[]; feederErrors: number };
}

export interface PlayerCard {
  allocationId: string;
  trialNo: string;
  role: string;
  requiredDisciplines: ("batting" | "bowling")[];
  checkedIn: boolean;
  attempts: AttemptState;
  evaluation: { locked: boolean; lockedAt: string; correctionPending: boolean } | null;
}

export interface RubricDim { key: string; label: string; weight: number; hint?: string }
export interface RoleRubric { objective: { discipline: "batting" | "bowling"; weight: number }[]; technical: RubricDim[] }
export interface RubricsPayload {
  version: string;
  roles: Record<string, RoleRubric>;
  outcomes: Record<string, Record<string, number>>;
  anchors: { min: number; max: number; label: string }[];
}

export async function staffLogin(email: string, password: string): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
  if (!res.ok || !data.token) throw new Error(data.error || "Login failed — check email & password");
  saveAdminToken(data.token);
}

export const staffMe = (): Promise<StaffMe> => adminReq<StaffMe>("GET", "/staff/me");

export const gateScan = (payload: { token?: string; regNumber?: string }): Promise<GateResult> =>
  adminReq<GateResult>("POST", "/staff/scan/gate", payload);

export interface CheckinResult {
  ok: boolean;
  checkedInAt: string;
  player: { name: string; regNumber: string; role: string; city: string };
  slot: { batch: string; date: string; reportingTime: string } | null;
  wristband: { trialNo: string };
}
export const staffCheckin = (payload: { token?: string; regNumber?: string; device?: string }): Promise<CheckinResult> =>
  adminReq<CheckinResult>("POST", "/staff/checkin", payload);

export const evalResolve = (payload: { token?: string; regNumber?: string }): Promise<PlayerCard> =>
  adminReq<PlayerCard>("POST", "/staff/eval/resolve", payload);

export const evalRubrics = (): Promise<RubricsPayload> =>
  adminReq<RubricsPayload>("GET", "/staff/eval/rubrics");

export const recordAttempt = (payload: { allocationId: string; discipline: string; outcome?: string; feederError?: boolean }): Promise<{ ok: boolean; attempts: AttemptState }> =>
  adminReq("POST", "/staff/eval/attempt", payload);

export const undoAttempt = (payload: { allocationId: string; discipline: string }): Promise<{ ok: boolean; attempts: AttemptState }> =>
  adminReq("POST", "/staff/eval/attempt/undo", payload);

export interface SubmitResult {
  evaluation: { id: string; totalScore: number; sections: unknown; rubricVersion: string; lockedAt: string };
}
export const submitEvaluation = (payload: { allocationId: string; technical: Record<string, number>; notes?: string }): Promise<SubmitResult> =>
  adminReq("POST", "/staff/eval/submit", payload);

export const requestCorrection = (payload: { allocationId: string; reason: string }): Promise<{ ok: boolean }> =>
  adminReq("POST", "/staff/eval/correction", payload);

export interface CorrectionItem {
  id: string; reason: string; requestedBy: string; createdAt: string;
  trialNo: string; city: string | null;
  evaluation: { id: string; totalScore: string; playerRole: string; evaluatorEmail: string; lockedAt: string };
}
export const listCorrections = (): Promise<{ corrections: CorrectionItem[] }> =>
  adminReq("GET", "/staff/supervisor/corrections");

export const decideCorrection = (id: string, approve: boolean, note?: string): Promise<{ ok: boolean }> =>
  adminReq("POST", `/staff/supervisor/corrections/${id}`, { approve, note });

export interface TodayCounters {
  allocated?: number; checked_in_today?: number; submitted_today?: number;
  pending_corrections?: number; in_progress?: number;
}
export const supervisorToday = (): Promise<{ counters: TodayCounters }> =>
  adminReq("GET", "/staff/supervisor/today");
