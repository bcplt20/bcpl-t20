import { useState } from "react";
import { useLocation } from "wouter";
import { NavUser } from "./NavUser";

/**
 * SiteHeader — THE one shared premium header for every page of the site.
 * Extracted from the Home page (canonical design): orange ticker strip +
 * sticky navbar with BCPL logo, SEASON 5 badge, desktop links, Register CTA
 * and the mobile hamburger menu.
 *
 * Self-contained: ships its own CSS (sh- prefixed classes) so it renders
 * identically on every page regardless of page-local styles.
 *
 * Usage:  <SiteHeader active="Teams" />   (active is optional)
 */

const NAV = ["Home", "Match Center", "Teams", "Sponsors", "Photos", "Videos", "About", "FAQ", "Contact", "Login"];
const RTES: Record<string, string> = {
  "Home": "/", "Match Center": "/match-center", "Teams": "/teams", "Sponsors": "/sponsors",
  "Photos": "/photos", "Videos": "/videos", "About": "/about", "FAQ": "/faq", "Contact": "/contact",
  "Login": "/register#login",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
  .sh-W{max-width:1200px;margin:0 auto;padding:0 20px;}
  @media(min-width:768px){.sh-W{padding:0 32px;}}
  @media(min-width:1280px){.sh-W{padding:0 48px;}}
  @keyframes shTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  .sh-link{font-family:'Montserrat',sans-serif;font-weight:700;font-size:12px;letter-spacing:.08em;color:rgba(255,255,255,.55);text-decoration:none;text-transform:uppercase;transition:color .2s;white-space:nowrap;}
  .sh-link:hover{color:#FF7A29;}
  .sh-link-active{color:#FF7A29;}
  .sh-desk{display:none;}
  @media(min-width:1024px){.sh-desk{display:flex;gap:18px;align-items:center;}.sh-ham{display:none!important;}}
  .sh-cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:14px;color:#fff;font-family:'Montserrat',sans-serif;font-weight:900;letter-spacing:.04em;cursor:pointer;text-transform:uppercase;text-decoration:none;transition:opacity .2s,transform .15s;}
  .sh-cta:hover{opacity:.9;transform:translateY(-2px);}
  .sh-cta-desk{display:none;}
  @media(min-width:640px){.sh-cta-desk{display:inline-flex;}}
  .sh-mob{position:fixed;inset:0;background:#06101E;z-index:1000;display:flex;flex-direction:column;padding:72px 32px 32px;overflow-y:auto;}
  .sh-moblink{padding:18px 0;border-bottom:1px solid rgba(255,255,255,.06);font-family:'Montserrat',sans-serif;font-weight:800;font-size:20px;color:rgba(255,255,255,.8);text-transform:uppercase;cursor:pointer;text-decoration:none;}
  .sh-moblink:hover{color:#FF7A29;}
`;

export function SiteHeader({ active }: { active?: string }) {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{CSS}</style>

      {/* ══ TICKER ══ */}
      <div style={{ background: "#081525", borderBottom: "1px solid rgba(232,178,61,.25)", height: 34, overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", whiteSpace: "nowrap", animation: "shTicker 36s linear infinite" }}>
          {[0, 1].map(i => (
            <span key={i} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: ".14em", color: "#E8B23D", paddingRight: 80 }}>
              🏏 SEASON 5 OPEN <span style={{ color: "rgba(232,178,61,.35)" }}>&nbsp;·&nbsp;</span> ₹6 CR+ PRIZE POOL <span style={{ color: "rgba(232,178,61,.35)" }}>&nbsp;·&nbsp;</span> 10 FRANCHISE TEAMS <span style={{ color: "rgba(232,178,61,.35)" }}>&nbsp;·&nbsp;</span> 50+ CITIES <span style={{ color: "rgba(232,178,61,.35)" }}>&nbsp;·&nbsp;</span> REGISTER AT ₹299 <span style={{ color: "rgba(232,178,61,.35)" }}>&nbsp;·&nbsp;</span> SOURAV GANGULY <span style={{ color: "rgba(232,178,61,.35)" }}>&nbsp;·&nbsp;</span> #OfficeSeStadiumtak &nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ══ NAVBAR ══ */}
      <nav style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(6,16,30,.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div className="sh-W" style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>

          {/* Logo + Season 5 badge */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, textDecoration: "none" }}>
            <img src={import.meta.env.BASE_URL + "bcpl-assets/bcpl-logo-white.png"} alt="BCPL" style={{ height: 42, width: "auto", objectFit: "contain", display: "block", filter: "brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))" }} />
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(232,178,61,0.12)", border: "1px solid rgba(232,178,61,0.5)", borderRadius: 6, padding: "3px 10px" }}>
              <span style={{ fontSize: 9 }}>🏆</span>
              <span style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 900, fontSize: 9, color: "#E8B23D", letterSpacing: ".12em" }}>SEASON 5</span>
            </div>
          </a>

          {/* Desktop links */}
          <nav className="sh-desk">
            {NAV.map(n => n === "Login"
              ? <NavUser key={n} variant="desktop" />
              : <a key={n} href={RTES[n] || "/"} className={"sh-link" + (active === n ? " sh-link-active" : "")}>{n}</a>
            )}
          </nav>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <button className="sh-cta sh-cta-desk" style={{ fontSize: 12, padding: "9px 18px" }} onClick={() => navigate("/register")}>Register Now →</button>
            <button className="sh-ham" onClick={() => setMenuOpen(true)} aria-label="Open menu" style={{ display: "flex", flexDirection: "column", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 8 }}>
              {[0, 1, 2].map(i => <span key={i} style={{ width: 22, height: 2, background: "#fff", display: "block" }} />)}
            </button>
          </div>
        </div>
      </nav>

      {/* ══ MOBILE MENU ══ */}
      {menuOpen && (
        <div className="sh-mob">
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ position: "fixed", top: 18, right: 22, background: "none", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", zIndex: 1001, lineHeight: 1 }}>✕</button>
          {NAV.map(n => (
            n === "Login"
              ? <NavUser key={n} variant="mobile" onNavigate={() => setMenuOpen(false)} />
              : <a key={n} href={RTES[n] || "/"} className="sh-moblink" onClick={() => setMenuOpen(false)} style={{ color: active === n ? "#FF7A29" : undefined }}>{n}</a>
          ))}
          <button className="sh-cta" style={{ marginTop: 24, width: "100%", justifyContent: "center", fontSize: 16, padding: 16 }} onClick={() => { setMenuOpen(false); navigate("/register"); }}>
            Register Now — ₹299 →
          </button>
        </div>
      )}
    </>
  );
}
