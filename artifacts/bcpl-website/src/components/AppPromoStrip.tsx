import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLang } from "../lib/i18n";

/**
 * Slim, dismissible "download the app" promo strip for the homepage.
 * Dismissal is persisted in localStorage so it stays hidden once closed.
 * V3 style (navy + gold accent), bilingual, no reveal animation. Tapping the
 * body navigates to /download.
 */
const KEY = "bcpl_app_promo_dismissed_v1";

export function AppPromoStrip() {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem(KEY) !== "1");
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div
      onClick={() => navigate("/download")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") navigate("/download"); }}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 16px",
        background: "linear-gradient(90deg,#12233F,#24396B)",
        borderBottom: "1px solid rgba(232,178,61,0.4)",
        cursor: "pointer",
      }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex", flex: "0 0 auto" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8B23D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18h2" /></svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Montserrat,Inter,sans-serif", fontWeight: 800, fontSize: 13.5, color: "#fff", lineHeight: 1.25 }}>
          {t("The BCPL app is here", "BCPL app \u0906 \u0917\u092F\u093E \u0939\u0948")}
        </div>
        <div style={{ fontFamily: "Inter,sans-serif", fontSize: 11.5, color: "rgba(255,255,255,0.72)" }}>
          {t("Live scores, your trial pass and every update \u2014 download it now", "Live scores, trial pass \u0914\u0930 \u0939\u0930 update \u2014 \u0905\u092D\u0940 download \u0915\u0930\u0947\u0902")}
        </div>
      </div>
      <span
        style={{
          flex: "0 0 auto",
          fontFamily: "Montserrat,Inter,sans-serif", fontWeight: 800, fontSize: 12,
          letterSpacing: ".04em", textTransform: "uppercase",
          color: "#0C1D33", background: "linear-gradient(135deg,#E8B23D,#FFD873)",
          borderRadius: 8, padding: "7px 14px",
        }}
      >
        {t("Download", "\u0921\u093E\u0909\u0928\u0932\u094B\u0921")}
      </span>
      <button
        onClick={dismiss}
        aria-label={t("Dismiss", "\u092C\u0902\u0926 \u0915\u0930\u0947\u0902")}
        style={{
          flex: "0 0 auto", background: "transparent", border: "none",
          color: "rgba(255,255,255,0.6)", fontSize: 20, lineHeight: 1,
          cursor: "pointer", padding: "2px 4px",
        }}
      >
        {"\u00D7"}
      </button>
    </div>
  );
}
