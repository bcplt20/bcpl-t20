import React, { useState } from "react";

const NAV_LINKS = ["Home", "Match Center", "Teams", "Sponsors", "Photos", "Videos", "About", "FAQ", "Contact", "Login"];

const TICKER_TEXT = "🏏 SEASON 5 REGISTRATIONS OPEN · ₹6 CR PRIZE POOL · 21 TRIAL CITIES · BACKED BY SOURAV GANGULY · 10 FRANCHISE TEAMS · #OfficeSeStadiumtak";

const CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad",
  "Jaipur", "Lucknow", "Chandigarh", "Kochi", "Indore", "Nagpur", "Bhopal", "Patna",
  "Surat", "Vadodara", "Noida", "Gurugram", "Agra",
];

const TIMELINE = [
  {
    dates: "Oct 2025–Feb 2026",
    milestone: "REGISTRATIONS",
    status: "OPEN",
    statusColor: "#FF7A29",
    desc: "Phase 1 video trials. 21 cities. ₹299/₹399 entry.",
    cta: "REGISTER NOW →",
    active: true,
  },
  {
    dates: "Mar–Jun 2026",
    milestone: "TRIALS",
    status: "UPCOMING",
    statusColor: "#E8B23D",
    desc: "Physical trials at 21 city grounds. Franchise coaches present.",
    cta: null,
    active: false,
  },
  {
    dates: "Jul–Aug 2026",
    milestone: "RESULTS",
    status: "UPCOMING",
    statusColor: "#E8B23D",
    desc: "Phase 2 selections. Franchise team announcements.",
    cta: null,
    active: false,
  },
  {
    dates: "Aug 2026",
    milestone: "AUCTION",
    status: "UPCOMING",
    statusColor: "#E8B23D",
    desc: "Live franchise auction. Players sold for up to ₹15L.",
    cta: null,
    active: false,
  },
  {
    dates: "Sep–Oct 2026",
    milestone: "TOURNAMENT",
    status: "UPCOMING",
    statusColor: "#E8B23D",
    desc: "BCPL Season 5 T20 matches across India. ₹6 Cr prize pool.",
    cta: null,
    active: false,
  },
];

// Match results will be populated by admin when tournament begins (Sep 2026)
const RESULTS: any[] = [];

// Points table will be populated when tournament begins (Sep 2026)
const POINTS: any[] = [];


const ROUTE_MAP: Record<string,string> = {
  'Home':'/', 'HOME':'/',
  'Match Center':'/match-center', 'MATCH CENTER':'/match-center',
  'Teams':'/teams', 'TEAMS':'/teams',
  'Sponsors':'/sponsors', 'SPONSORS':'/sponsors',
  'Photos':'/photos', 'PHOTOS':'/photos',
  'Videos':'/videos', 'VIDEOS':'/videos',
  'About':'/about', 'ABOUT':'/about',
  'FAQ':'/faq',
  'Contact':'/contact', 'CONTACT':'/contact',
  'Schedule':'/schedule',
  'Points Table':'/points-table',
  'Login':'/register#login',
};

export function MatchCenter() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ background: "#06101E", minHeight: "100vh", color: "#F0EDE8", fontFamily: "'Inter',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes liveBlip { 0%,100% { opacity:1; } 50% { opacity:0.15; } }
        @keyframes pulseOrange { 0%,100% { box-shadow: 0 0 0 0 rgba(255,122,41,0.5); } 50% { box-shadow: 0 0 0 10px rgba(255,122,41,0); } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px rgba(255,122,41,0.3), 0 0 40px rgba(255,122,41,0.1); border-color: rgba(255,122,41,0.7); } 50% { box-shadow: 0 0 40px rgba(255,122,41,0.7), 0 0 80px rgba(255,122,41,0.3); border-color: #FF7A29; } }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        .wrap { max-width: 1280px; margin: 0 auto; padding: 0 16px; }
        @media(min-width:640px){ .wrap { padding: 0 24px; } }
        @media(min-width:768px){ .wrap { padding: 0 40px; } }

        .desk-nav { display: none; align-items: center; gap: 20px; }
        @media(min-width:1024px){ .desk-nav { display: flex !important; } .ham-btn { display: none !important; } }

        .nav-link { font-family: Montserrat, sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.08em; color: rgba(255,255,255,0.65); text-decoration: none; text-transform: uppercase; transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: #FF7A29; }
        .nav-link.active { color: #FF7A29; }

        .btn-orange { background: linear-gradient(135deg,#FF7A29,#D95E10); border: none; border-radius:12px; color: #fff; font-family: Montserrat, sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.06em; cursor: pointer; padding: 11px 22px; transition: opacity 0.2s, transform 0.15s; text-transform: uppercase; }
        .btn-orange:hover { opacity: 0.9; transform: translateY(-1px); }

        .card { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius:12px; }

        .section-label { font-family: Montserrat, sans-serif; font-weight: 800; font-size: 11px; letter-spacing: 0.15em; color: #FF7A29; text-transform: uppercase; display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .section-label::before { content: ''; display: inline-block; width: 24px; height: 2px; background: #FF7A29; }

        .section-title { font-family: Montserrat, sans-serif; font-weight: 900; line-height: 1.05; }

        .roadmap-scroll { display: flex; overflow-x: auto; padding-bottom: 16px; gap: 0; align-items: stretch; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
        .roadmap-scroll::-webkit-scrollbar { height: 4px; }
        .roadmap-scroll::-webkit-scrollbar-track { background: #060C18; }
        .roadmap-scroll::-webkit-scrollbar-thumb { background: #FF7A29; border-radius:12px; }

        .roadmap-block { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius:12px; min-width: 180px; max-width: 200px; padding: 20px 16px; flex-shrink: 0; position: relative; }
        .roadmap-block.active { border-color: rgba(255,122,41,0.6); animation: glowPulse 2.5s ease-in-out infinite; }
        .roadmap-connector { width: 20px; height: 2px; background: rgba(255,255,255,0.1); align-self: center; flex-shrink: 0; position: relative; }
        .roadmap-connector::after { content: '▶'; position: absolute; right: -8px; top: -8px; color: rgba(255,255,255,0.18); font-size: 10px; }
        @media(max-width:639px){
          .roadmap-scroll { flex-direction: column; overflow-x: visible; padding-bottom: 0; gap: 0; }
          .roadmap-block { min-width: unset; max-width: unset; width: 100%; display: flex; gap: 14px; align-items: flex-start; padding: 16px; border-radius: 12px; margin-bottom: 0; }
          .roadmap-block > * { flex-shrink: 0; }
          .roadmap-connector { width: 2px; height: 20px; margin: 0 auto; align-self: unset; }
          .roadmap-connector::after { content: '▼'; top: unset; right: unset; left: -4px; bottom: -10px; }
        }

        .city-chip { background: #0A1727; border: 1px solid rgba(255,255,255,0.1); border-radius:12px; padding: 8px 14px; font-family: Montserrat, sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.05em; color: rgba(255,255,255,0.7); text-transform: uppercase; transition: border-color 0.2s, color 0.2s; cursor: default; display: flex; align-items: center; gap: 8px; }
        .city-chip:hover { border-color: rgba(255,122,41,0.6); color: #FF7A29; }

        .result-card { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius:12px; overflow: hidden; transition: transform 0.2s, border-color 0.2s; }
        .result-card:hover { transform: translateY(-3px); border-color: rgba(255,122,41,0.25); }

        /* Points table: scrollable on mobile */
        .pts-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
        .pts-table-inner { min-width: 520px; }

        .pts-row { display: grid; grid-template-columns: 28px 1fr 48px 28px 28px 48px 68px; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; }
        .pts-row:hover { background: rgba(255,122,41,0.04); }
        .pts-row:last-child { border-bottom: none; }

        .pts-header { display: grid; grid-template-columns: 28px 1fr 48px 28px 28px 48px 68px; align-items: center; gap: 8px; padding: 10px 16px; background: #060C18; }

        .mob-menu { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #06101E; z-index: 999; display: flex; flex-direction: column; padding: 80px 32px 32px; gap: 24px; overflow-y: auto; }
        .mob-menu-link { font-family: Montserrat, sans-serif; font-weight: 800; font-size: 18px; letter-spacing: 0.06em; color: rgba(255,255,255,0.8); text-transform: uppercase; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 20px; transition: color 0.2s; text-decoration: none; display: block; }
        .mob-menu-link:hover { color: #FF7A29; }
        .close-btn { position: fixed; top: 20px; right: 24px; background: none; border: none; color: #fff; font-size: 28px; cursor: pointer; z-index: 1000; }

        .ham-btn { display: flex; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
        .ham-bar { width: 24px; height: 2px; background: #fff; display: block; }

        .footer-link { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 13px; font-family: Inter, sans-serif; transition: color 0.2s; }
        .footer-link:hover { color: #FF7A29; }

        /* Results grid: stack on mobile */
        .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

        /* ── FLOATING REGISTER BUTTON ── */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:'Montserrat',sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }

        @media(max-width:639px){
          .float-reg-btn { bottom:16px; right:16px; padding:12px 16px; font-size:12px; }
          .results-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* TICKER BAR */}
      <div style={{ background: "linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A)", overflow: "hidden", height: 36, display: "flex", alignItems: "center", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", whiteSpace: "nowrap", animation: "tickerScroll 32s linear infinite" }}>
          {[0, 1].map(i => (
            <span key={i} style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", color: "#fff", paddingRight: 80 }}>
              {TICKER_TEXT} &nbsp;&nbsp;&nbsp; {TICKER_TEXT} &nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(6,16,30,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="wrap" style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 22, color: "#FF7A29" }}>BCPL</span>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 22, color: "#fff" }}>T20</span>
            </div>
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.12)" }} />
            <div>
              <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 9, letterSpacing: "0.12em", color: "#E8B23D", textTransform: "uppercase" }}>Season 5</div>
              <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 8, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Kriparti Playing11</div>
            </div>
          </div>

          <nav className="desk-nav">
            {NAV_LINKS.map(link => (
              <a key={link} className={`nav-link${link === "Match Center" ? " active" : ""}`} href={ROUTE_MAP[link]||"#"}>{link}</a>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn-orange" style={{ fontSize: 12, padding: "9px 18px" }}>REGISTER NOW →</button>
            <button className="ham-btn" onClick={() => setMenuOpen(true)}>
              <span className="ham-bar" />
              <span className="ham-bar" />
              <span className="ham-bar" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mob-menu">
          <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 24, marginBottom: 8 }}>
            <span style={{ color: "#FF7A29" }}>BCPL</span><span style={{ color: "#fff", marginLeft: 3 }}>T20</span>
          </div>
          {NAV_LINKS.map(link => (
            <a key={link} className="mob-menu-link" href={ROUTE_MAP[link]||"#"} onClick={() => setMenuOpen(false)}>{link}</a>
          ))}
          <button className="btn-orange" style={{ marginTop: 12, padding: "14px 24px", fontSize: 14 }}>REGISTER NOW →</button>
        </div>
      )}

      {/* HERO */}
      <section style={{ background: "#06101E", padding: "clamp(40px,6vw,60px) 0 clamp(28px,4vw,48px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "100%", background: "linear-gradient(135deg, rgba(255,122,41,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: "linear-gradient(180deg,transparent,#FF7A29 30%,#FF7A29 70%,transparent)", opacity: 0.35 }} />

        <div className="wrap">
          <div style={{ animation: "fadeUp 0.7s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius:12, padding: "5px 12px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "inline-block", animation: "liveBlip 1.2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: "0.1em", color: "#EF4444", textTransform: "uppercase" }}>Phase 1 Open</span>
              </div>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", color: "#E8B23D" }}>SEASON 5 · 2025–26</span>
            </div>

            <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: "clamp(24px, 5vw, 60px)", color: "#fff", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.05, marginBottom: 14 }}>
              MATCH CENTER <span style={{ color: "#FF7A29" }}>·</span> SEASON 5
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(14px, 1.8vw, 17px)", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 560 }}>
              Season roadmap, trial city updates, match results and points table — all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* SEASON 5 TIMELINE — MAIN FEATURE */}
      <section style={{ padding: "clamp(40px,6vw,64px) 0", background: "#060C18" }}>
        <div className="wrap">
          <div className="section-label">Season Roadmap</div>
          <h2 className="section-title" style={{ fontSize: "clamp(20px, 4vw, 40px)", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
            SEASON 5 — COMPLETE TIMELINE
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.4)", marginBottom: 36, fontSize: 15 }}>
            From registration to the final. Your complete season roadmap.
          </p>

          <div className="roadmap-scroll">
            {TIMELINE.map((block, i) => (
              <React.Fragment key={i}>
                <div className={`roadmap-block${block.active ? " active" : ""}`} style={{ borderTop: `3px solid ${block.statusColor}` }}>
                  {/* Status bar accent */}
                  {block.active && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#C94E0E,#FF7A29)", animation: "gradShift 2s ease infinite", backgroundSize: "200% 100%" }} />
                  )}

                  <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                    {block.dates}
                  </div>

                  <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 19, color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 12, lineHeight: 1.1 }}>
                    {block.milestone}
                  </div>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: block.active ? "rgba(255,122,41,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${block.active ? "rgba(255,122,41,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius:12, padding: "4px 10px", marginBottom: 14 }}>
                    {block.active && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF7A29", display: "inline-block", animation: "liveBlip 1.2s infinite" }} />
                    )}
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: "0.1em", color: block.statusColor, textTransform: "uppercase" }}>
                      {block.status}
                    </span>
                  </div>

                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.55, marginBottom: block.cta ? 18 : 0 }}>
                    {block.desc}
                  </div>

                  {block.cta && (
                    <button className="btn-orange" style={{ fontSize: 12, padding: "9px 16px", marginTop: 4 }}>{block.cta}</button>
                  )}
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className="roadmap-connector" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* TRIAL CITIES */}
      <section style={{ padding: "clamp(40px,6vw,64px) 0", background: "#06101E" }}>
        <div className="wrap">
          <div className="section-label">Locations</div>
          <h2 className="section-title" style={{ fontSize: "clamp(20px, 4vw, 40px)", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
            TRIAL CITIES — SEASON 5
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.4)", marginBottom: 36, fontSize: 15 }}>
            21 cities. One dream. Find your nearest trial ground.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {CITIES.map(city => (
              <div key={city} className="city-chip">
                <span>{city}</span>
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 9, letterSpacing: "0.1em", color: "#FF7A29", background: "rgba(255,122,41,0.12)", border: "1px solid rgba(255,122,41,0.2)", borderRadius:12, padding: "2px 6px", textTransform: "uppercase" }}>Open</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MATCH RESULTS */}
      <section style={{ padding: "clamp(40px,6vw,64px) 0", background: "#060C18" }}>
        <div className="wrap">
          <div className="section-label">Results</div>
          <h2 className="section-title" style={{ fontSize: "clamp(20px, 4vw, 40px)", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
            MATCH RESULTS — SEASON 5
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.4)", marginBottom: 36, fontSize: 15 }}>
            Match results will appear here once the tournament begins.
          </p>
          <div style={{ textAlign: "center", padding: "48px 20px", background: "#0A1727", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏏</div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 20, color: "#fff", marginBottom: 8 }}>No Matches Played Yet</div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: "Inter, sans-serif", maxWidth: 360, margin: "0 auto" }}>
              Season 5 tournament kicks off Sep 2026. Live scores and match results will update here automatically.
            </p>
          </div>
        </div>
      </section>

      {/* POINTS TABLE */}
      <section style={{ padding: "clamp(40px,6vw,64px) 0", background: "#06101E" }}>
        <div className="wrap">
          <div className="section-label">Standings</div>
          <h2 className="section-title" style={{ fontSize: "clamp(20px, 4vw, 40px)", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
            POINTS TABLE — SEASON 5
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.4)", marginBottom: 32, fontSize: 15 }}>
            Season 5 league table begins Sep 2026.
          </p>
          <div style={{ textAlign: "center", padding: "48px 20px", background: "#0A1727", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 20, color: "#fff", marginBottom: 8 }}>Tournament Begins Sep 2026</div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: "Inter, sans-serif", maxWidth: 360, margin: "0 auto" }}>
              Points table will update in real time once Season 5 matches begin. Register now to be part of it!
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#060C18", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "clamp(40px,6vw,60px) 0 0" }}>
        <div className="wrap">
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 40, marginBottom: 48 }}>
            {/* Brand */}
            <div style={{ minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 8 }}>
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 24, color: "#FF7A29" }}>BCPL</span>
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 24, color: "#fff" }}>T20</span>
              </div>
              <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 12, color: "#E8B23D", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>#OfficeSeStadiumtak</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                India's biggest corporate cricket league.<br />Season 5 · Kriparti Playing 11 Pvt. Ltd.
              </div>
            </div>

            {[
              { header: "League", links: [["About","/about"],["Teams","/teams"],["Sponsors","/sponsors"],["Schedule","/schedule"]] },
              { header: "Help", links: [["FAQ","/faq"],["Contact","/contact"],["Eligibility Criteria","/eligibility"],["Cricket Rulebook","/cricket-rulebook"]] },
              { header: "Legal", links: [["Terms","/terms"],["Privacy","/privacy"],["Refunds","/refunds"],["Code of Conduct","/code-of-conduct"]] },
            ].map(col => (
              <div key={col.header}>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 16 }}>{col.header}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(([link,href]) => (
                    <a key={link} href={href} className="footer-link">{link}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 0", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
              Season 5 · Kriparti Playing 11 Pvt. Ltd. · © 2025 · All Rights Reserved
            </span>
            <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", color: "#FF7A29" }}>#OfficeSeStadiumtak</span>
          </div>
        </div>
      </footer>
      {/* ── FLOATING REGISTER BUTTON ── */}
      <a className="float-reg-btn float-reg-pulse" href="/register" style={{textDecoration:"none"}}>🏏 REGISTER NOW →</a>
    </div>
  );
}
