import { useLocation } from "wouter";
import { useAuthUser } from "./NavUser";
import { useLang } from "../lib/i18n";

/**
 * StickyRegisterCTA — the one shared mobile sticky bottom CTA (spec Part 5).
 *
 * Premium glass bottom bar: dominant "Register for Phase 1 — ₹299" button
 * plus a compact secondary WhatsApp support icon (never two equally
 * prominent actions).
 *
 * - Respects iPhone safe areas (env(safe-area-inset-bottom)).
 * - Hidden for logged-in players (they are already registered).
 * - Hidden on desktop (>=1024px) — the header CTA covers that.
 * - z-index 900 (project scale: header 200 < page CTAs <=1000 < menu 1500 < modal 2000).
 *
 * Place on public marketing pages only — never on checkout/forms/dashboard.
 * Replaces the old per-page duplicated MobileStickyCTA copies.
 */

const WHATSAPP_URL = "https://wa.me/919151346555";

const CSS = `
  .srg-bar{position:fixed;left:0;right:0;bottom:0;z-index:900;display:flex;gap:10px;align-items:stretch;background:rgba(4,12,24,.97);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1px solid rgba(255,255,255,.07);padding:10px 16px calc(12px + env(safe-area-inset-bottom,0px));}
  @media(min-width:1024px){.srg-bar{display:none;}}
  .srg-btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:12px 16px;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:var(--r,14px);color:#fff;font-family:'Barlow Condensed','Mukta',sans-serif;font-weight:800;font-size:17px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;cursor:pointer;box-shadow:0 6px 22px rgba(255,122,41,.4);transition:opacity .2s,transform .15s;}
  .srg-btn:active{transform:scale(.985);}
  .srg-wa{flex:0 0 52px;display:inline-flex;align-items:center;justify-content:center;min-height:52px;border:1px solid rgba(37,211,102,.4);border-radius:var(--r,14px);background:rgba(37,211,102,.1);text-decoration:none;}
`;

/* Official WhatsApp glyph (simplified), premium single-colour treatment. */
function WhatsAppIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.5A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.12 15.07l-.3-.18-3.12.9.86-3.04-.2-.31A8.1 8.1 0 0 1 12.04 3.8Zm-3.27 3.5c-.18 0-.47.07-.72.34-.24.27-.94.92-.94 2.24 0 1.32.96 2.6 1.1 2.78.13.18 1.86 2.98 4.6 4.06 2.28.9 2.74.72 3.24.67.5-.04 1.6-.65 1.83-1.28.22-.63.22-1.17.15-1.28-.06-.11-.24-.18-.5-.31-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.13-.61.14-.18.27-.7.87-.86 1.05-.16.18-.31.2-.58.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.6-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.32.4-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.13-.6-1.45-.83-1.98-.2-.47-.4-.44-.58-.45l-.55-.01Z"/>
    </svg>
  );
}

export function StickyRegisterCTA() {
  const user = useAuthUser();
  const { t } = useLang();
  const [, navigate] = useLocation();

  if (user) return null; /* active players don't need a register nudge */

  return (
    <>
      <style>{CSS}</style>
      <div className="srg-bar">
        <button className="srg-btn" onClick={() => navigate("/register")}>
          {t("Register for Phase 1 — ₹299", "Phase 1 रजिस्टर करें — ₹299")} →
        </button>
        <a className="srg-wa" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp support">
          <WhatsAppIcon />
        </a>
      </div>
    </>
  );
}
