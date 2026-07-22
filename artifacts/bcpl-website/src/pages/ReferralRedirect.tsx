import { useEffect } from "react";
import { useLocation } from "wouter";
import { saveReferralCode, trackReferralClick } from "@/lib/marketingApi";

/** Landing page for referral links: bcplt20.com/r/CODE
 *  Stores the code (30-day window), counts the click, then sends
 *  the visitor straight to the registration page. */
export function ReferralRedirect({ params }: { params?: { code?: string } }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const code = (params?.code ?? "").trim().toUpperCase();
    if (code && /^[A-Z0-9_-]{2,30}$/.test(code)) {
      saveReferralCode(code);
      trackReferralClick(code);
    }
    setLocation("/register", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ background: "#06101E", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Montserrat,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#FF7A29", marginBottom: 8 }}>BCPL T20</div>
        <div style={{ fontSize: 14, color: "#94A3B8" }}>Taking you to registration…</div>
      </div>
    </div>
  );
}
