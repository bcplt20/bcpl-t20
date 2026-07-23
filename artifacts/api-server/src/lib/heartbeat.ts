/**
 * Stage 5 — in-process job heartbeats for the admin API-health page.
 * Background ticks (reminder sweep, phase-1 pipeline) call recordJobRun
 * after every run; /api/admin/health reports the latest state. Values
 * reset on process restart — that is fine, the page also shows process
 * uptime so "no heartbeat yet" right after a deploy is self-explanatory.
 */

export interface JobBeat {
  id: string;
  intervalMs: number | null;
  lastRunAt: string | null;
  lastOkAt: string | null;
  lastError: string | null;
  runs: number;
  fails: number;
}

const beats = new Map<string, JobBeat>();

export function recordJobRun(id: string, ok: boolean, error?: unknown, intervalMs?: number): void {
  const now = new Date().toISOString();
  const b = beats.get(id) ?? { id, intervalMs: intervalMs ?? null, lastRunAt: null, lastOkAt: null, lastError: null, runs: 0, fails: 0 };
  if (intervalMs) b.intervalMs = intervalMs;
  b.lastRunAt = now;
  b.runs += 1;
  if (ok) {
    b.lastOkAt = now;
    b.lastError = null;
  } else {
    b.fails += 1;
    b.lastError = error instanceof Error ? error.message.slice(0, 300) : String(error ?? "unknown error").slice(0, 300);
  }
  beats.set(id, b);
}

export function getJobHeartbeats(): JobBeat[] {
  return [...beats.values()].sort((a, b) => a.id.localeCompare(b.id));
}
