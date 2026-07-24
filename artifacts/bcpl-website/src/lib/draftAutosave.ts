/**
 * Incomplete-registration autosave (client wiring for /api/drafts).
 *
 * Persists the visitor's registration-form progress server-side
 * (POST /api/drafts/upsert) so the admin "Incomplete Registrations"
 * funnel can see visitors who never finish OTP or payment.
 *
 * Rules:
 *  - Fire-and-forget: never throws, never blocks the form.
 *  - Debounced (800 ms) and merged; flushDraftSave() forces the send
 *    (await it before send-otp so the server hook finds the draft).
 *  - Only client-valid fields are sent — one invalid field would 400
 *    the entire upsert (server zod validation).
 *  - The anonymous clientKey lives in localStorage. OTP values are
 *    never sent here (server discards unknown keys anyway).
 */
import { BASE } from './adminHttp';

const KEY_STORAGE = 'bcpl_draft_key';

export function getDraftKey(): string {
  try {
    const existing = localStorage.getItem(KEY_STORAGE);
    if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
    const k = 'dk' + crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(KEY_STORAGE, k);
    return k;
  } catch {
    // Storage blocked (private mode) — session-stable fallback, valid shape.
    return 'dkfallback0000000000000000';
  }
}

export type DraftFields = {
  fullName?: string;
  email?: string;
  phone?: string;
  dob?: string; // YYYY-MM-DD
  role?: 'bat' | 'bowl' | 'wk' | 'ar';
  trialCity?: string;
  lastCompletedStep?: 'about' | 'contact' | 'cricket' | 'review';
  otpRequested?: boolean;
  source?: Record<string, string>;
};

let pending: DraftFields = {};
let timer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<void> = Promise.resolve();

async function send(): Promise<void> {
  const fields = pending;
  pending = {};
  if (!Object.keys(fields).length) return;
  try {
    await fetch(`${BASE}/api/drafts/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientKey: getDraftKey(), ...fields }),
      keepalive: true, // survives tab close mid-save
    });
  } catch {
    /* autosave must never surface errors to the form */
  }
}

export function queueDraftSave(fields: DraftFields): void {
  pending = { ...pending, ...fields };
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    inflight = inflight.then(send);
  }, 800);
}

/** Force queued fields out now. Await before send-otp. */
export function flushDraftSave(extra?: DraftFields): Promise<void> {
  if (extra) pending = { ...pending, ...extra };
  if (timer) { clearTimeout(timer); timer = null; }
  inflight = inflight.then(send);
  return inflight;
}

export type ResumedDraft = {
  draftId: string;
  draftNumber: string;
  status: string;
  mobileVerified: boolean;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
  role: string | null;
  trialCity: string | null;
  lastCompletedStep: string | null;
  phase1PaymentStatus: string;
  converted?: boolean;
};

/** Best-effort resume of a previous incomplete draft (404/converted → null). */
export async function resumeDraft(): Promise<ResumedDraft | null> {
  try {
    const res = await fetch(`${BASE}/api/drafts/resume?clientKey=${encodeURIComponent(getDraftKey())}`);
    if (!res.ok) return null;
    const d = (await res.json()) as ResumedDraft;
    return d.converted ? null : d;
  } catch {
    return null;
  }
}
