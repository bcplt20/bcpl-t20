import { useEffect, useState } from "react";
import { Link } from "wouter";
import { isAuthenticated, getRegistrationStatus } from "../lib/api";
import { resumeDraft } from "../lib/draftAutosave";
import { useLang } from "../lib/i18n";

/**
 * ResumeBanner — a slim, dismissible-per-session nudge that helps visitors
 * finish an incomplete registration (conversion recovery).
 *
 * Two mutually-exclusive cases (logged-in wins):
 *  a) Logged-in player whose Phase 1 registration is 'pending' (payment not
 *     done). Carryover / already-selected players are excluded because their
 *     phase1Status is 'selected' (waived), never 'pending'.
 *  b) Anonymous visitor with an unconverted server draft (resumeDraft()).
 *
 * Both CTAs link to /register, which resumes into the correct step
 * (pending → complete-payment CTA; anon draft → silent prefill).
 *
 * Sits in normal document flow directly under the sticky header, so it never
 * overlaps and stays under the header's z-index (200). Dismissal is remembered
 * per browser session (sessionStorage).
 *
 * Fetching is done once per mount and shared via a module-level cache so
 * placing the banner on several pages during one page-load never causes a
 * fetch storm.
 */

type Kind = "pending" | "draft" | null;

/* Per-page-load cache — one resolve per full page load, shared across mounts. */
let cache: Promise<Kind> | null = null;

const DISMISS_KEY = "bcpl_resume_banner_dismissed";

function wasDismissed(): boolean {
  try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}
function markDismissed(): void {
  try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* private mode */ }
}

async function resolveKind(): Promise<Kind> {
  // Logged-in path takes priority.
  if (isAuthenticated()) {
    try {
      const s = (await getRegistrationStatus()) as { registered?: boolean; phase1Status?: string };
      // Only nudge on true payment-pending. 'selected' (carryover/waived) and
      // every post-payment status are intentionally excluded.
      if (s.registered && s.phase1Status === "pending") return "pending";
    } catch { /* ignore — never surface errors to a marketing page */ }
    return null;
  }
  // Anonymous path: unconverted server draft.
  try {
    const d = await resumeDraft();
    if (d) return "draft";
  } catch { /* ignore */ }
  return null;
}

export function ResumeBanner() {
  const { t } = useLang();
  const [kind, setKind] = useState<Kind>(null);
  const [hidden, setHidden] = useState(wasDismissed());

  useEffect(() => {
    if (hidden) return;
    if (!cache) cache = resolveKind();
    let alive = true;
    cache.then(k => { if (alive) setKind(k); }).catch(() => {});
    return () => { alive = false; };
  }, [hidden]);

  if (hidden || !kind) return null;

  const msg = kind === "pending"
    ? t("Your registration is incomplete — payment is pending.", "आपका registration अधूरा है — payment बाकी है।")
    : t("Your form is half-filled — continue right where you left off.", "आपका form आधा भरा है — जहाँ छोड़ा था वहीं से जारी रखें।");

  return (
    <div
      role="region"
      aria-label={t("Resume your registration", "अपना registration फिर से शुरू करें")}
      style={{
        position: "relative", zIndex: 100,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        padding: "9px 16px",
        background: "linear-gradient(90deg,#24396B,#1B2E52)",
        borderBottom: "1px solid rgba(255,122,41,0.35)",
        color: "#F0EDE8", fontFamily: "'Inter',sans-serif",
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF7A29", flexShrink: 0, display: "inline-block" }} />
      <span style={{ flex: 1, minWidth: 180, fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{msg}</span>
      <Link
        href="/register"
        style={{
          flexShrink: 0, textDecoration: "none",
          background: "linear-gradient(135deg,#FF8A3D,#D95E10)", color: "#fff",
          fontFamily: "'Barlow Condensed','Mukta',sans-serif", fontWeight: 800,
          fontSize: 13, letterSpacing: ".04em", textTransform: "uppercase",
          padding: "8px 18px", borderRadius: 10,
          boxShadow: "0 4px 14px rgba(255,122,41,.35)",
        }}
      >
        {t("Continue", "जारी रखें")}
      </Link>
      <button
        onClick={() => { markDismissed(); setHidden(true); }}
        aria-label={t("Dismiss", "बंद करें")}
        style={{ flexShrink: 0, background: "none", border: "none", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 4px" }}
      >
        ✕
      </button>
    </div>
  );
}
