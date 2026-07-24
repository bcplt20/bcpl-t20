/**
 * Phase 1 AI pipeline config — admin client.
 * Feeds the "AI Evaluation Controls" card in ApiHealthView.
 * Uses the shared adminReq plumbing (lib/adminHttp) — never duplicate auth logic.
 */
import { adminReq } from "../../lib/adminHttp";

export type Phase1AiConfig = {
  aiEnabled: boolean;
  resultReleaseEnabled: boolean;
  realNotificationsEnabled: boolean;
  testMode: boolean;
  minScore: number;
  resultReleaseHours: number;
  uploadWindowDays: number;
  geminiPrimaryModel: string;
  geminiValidationModel: string;
} & Record<string, unknown>;

type ConfigResponse = { success: boolean; config: Phase1AiConfig };

export async function adminGetPhase1AiConfig(): Promise<Phase1AiConfig> {
  const r = await adminReq<ConfigResponse>("GET", "/admin-tools/phase1/config");
  return r.config;
}

export async function adminPatchPhase1AiConfig(
  patch: Partial<Pick<Phase1AiConfig, "aiEnabled" | "resultReleaseEnabled" | "realNotificationsEnabled" | "testMode">>,
): Promise<Phase1AiConfig> {
  const r = await adminReq<ConfigResponse>("PATCH", "/admin-tools/phase1/config", patch);
  return r.config;
}
