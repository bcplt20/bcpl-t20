import React, { useState } from "react";

const NAV_LINKS = ["Home", "Match Center", "Teams", "Sponsors", "Photos", "Videos", "About", "FAQ", "Contact"];

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

const RESULTS = [
  {
    team1: "Mumbai Mavericks",
    score1: "187/4",
    overs1: "19.2ov",
    team2: "Bengaluru Rockets",
    score2: "165/8",
    overs2: "20ov",
    result: "Mumbai Mavericks WON by 22 runs",
    winner: "Mumbai Mavericks",
    mom: "A. Sharma 87*(54)",
    color1: "#3B82F6",
    color2: "#22C55E",
  },
  {
    team1: "Delhi Suryas",
    score1: "143/7",
    overs1: "20ov",
    team2: "Kolkata Tigers",
    score2: "139/9",
    overs2: "20ov",
    result: "Delhi Suryas WON by 4 runs",
    winner: "Delhi Suryas",
    mom: "S. Mehta 45(32) + 3 wkts",
    color1: "#FF7A29",
    color2: "#F97316",
  },
  {
    team1: "Chennai Thalaivas",
    score1: "201/3",
    overs1: "18.4ov",
    team2: "Hyderabad Hawks",
    score2: "178/6",
    overs2: "20ov",
    result: "Chennai Thalaivas WON by 7 wkts",
    winner: "Chennai Thalaivas",
    mom: "R. Kumar 78*(48)",
    color1: "#10B981",
    color2: "#06B6D4",
  },
];

const POINTS = [
  { rank: 1, name: "Bengaluru Rockets", color: "#22C55E", p: 8, w: 7, l: 1, pts: 14, nrr: "+1.56" },
  { rank: 2, name: "Mumbai Mavericks", color: "#3B82F6", p: 8, w: 6, l: 2, pts: 12, nrr: "+1.24" },
  { rank: 3, name: "Delhi Suryas", color: "#FF7A29", p: 8, w: 5, l: 3, pts: 10, nrr: "+0.87" },
  { rank: 4, name: "Chennai Thalaivas", color: "#10B981", p: 8, w: 5, l: 3, pts: 10, nrr: "+0.43" },
  { rank: 5, name: "Rajasthan Scorchers", color: "#EF4444", p: 8, w: 4, l: 4, pts: 8, nrr: "+0.12" },
];

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

        .wrap { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
        @media(min-width:768px){ .wrap { padding: 0 40px; } }

        .desk-nav { display: none; align-items: center; gap: 20px; }
        @media(min-width:1024px){ .desk-nav { display: flex !important; } .ham-btn { display: none !important; } }

        .nav-link { font-family: Montserrat, sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.08em; color: rgba(255,255,255,0.65); text-decoration: none; text-transform: uppercase; transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: #FF7A29; }
        .nav-link.active { color: #FF7A29; }

        .btn-orange { background: linear-gradient(135deg,#FF7A29,#D95E10); border: none; border-radius: 2px; color: #fff; font-family: Montserrat, sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.06em; cursor: pointer; padding: 11px 22px; transition: opacity 0.2s, transform 0.15s; text-transform: uppercase; }
        .btn-orange:hover { opacity: 0.9; transform: translateY(-1px); }

        .card { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; }

        .section-label { font-family: Montserrat, sans-serif; font-weight: 800; font-size: 11px; letter-spacing: 0.15em; color: #FF7A29; text-transform: uppercase; display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .section-label::before { content: ''; display: inline-block; width: 24px; height: 2px; background: #FF7A29; }

        .section-title { font-family: Montserrat, sans-serif; font-weight: 900; line-height: 1.05; }

        .roadmap-scroll { display: flex; overflow-x: auto; padding-bottom: 16px; gap: 0; align-items: stretch; }
        .roadmap-scroll::-webkit-scrollbar { height: 4px; }
        .roadmap-scroll::-webkit-scrollbar-track { background: #060C18; }
        .roadmap-scroll::-webkit-scrollbar-thumb { background: #FF7A29; border-radius: 2px; }

        .roadmap-block { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; min-width: 230px; padding: 24px 20px; flex-shrink: 0; position: relative; }
        .roadmap-block.active { border-color: rgba(255,122,41,0.6); animation: glowPulse 2.5s ease-in-out infinite; }
        .roadmap-connector { width: 36px; height: 2px; background: rgba(255,255,255,0.1); align-self: center; flex-shrink: 0; position: relative; }
        .roadmap-connector::after { content: '▶'; position: absolute; right: -8px; top: -8px; color: rgba(255,255,255,0.18); font-size: 10px; }

        .city-chip { background: #0A1727; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; padding: 8px 14px; font-family: Montserrat, sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.05em; color: rgba(255,255,255,0.7); text-transform: uppercase; transition: border-color 0.2s, color 0.2s; cursor: default; display: flex; align-items: center; gap: 8px; }
        .city-chip:hover { border-color: rgba(255,122,41,0.6); color: #FF7A29; }

        .result-card { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; transition: transform 0.2s, border-color 0.2s; }
        .result-card:hover { transform: translateY(-3px); border-color: rgba(255,122,41,0.25); }

        .pts-row { display: grid; grid-template-columns: 28px 1fr 48px 28px 28px 48px 68px; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; }
        .pts-row:hover { background: rgba(255,122,41,0.04); }
        .pts-row:last-child { border-bottom: none; }

        .pts-header { display: grid; grid-template-columns: 28px 1fr 48px 28px 28px 48px 68px; align-items: center; gap: 8px; padding: 10px 16px; background: #060C18; }

        .mob-menu { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #06101E; z-index: 999; display: flex; flex-direction: column; padding: 80px 32px 32px; gap: 24px; overflow-y: auto; }
        .mob-menu-link { font-family: Montserrat, sans-serif; font-weight: 800; font-size: 18px; letter-spacing: 0.06em; color: rgba(255,255,255,0.8); text-transform: uppercase; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 20px; transition: color 0.2s; }
        .mob-menu-link:hover { color: #FF7A29; }
        .close-btn { position: fixed; top: 20px; right: 24px; background: none; border: none; color: #fff; font-size: 28px; cursor: pointer; z-index: 1000; }

        .ham-btn { display: flex; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
        .ham-bar { width: 24px; height: 2px; background: #fff; display: block; }

        .footer-link { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 13px; font-family: Inter, sans-serif; transition: color 0.2s; }
        .footer-link:hover { color: #FF7A29; }
      
        /* ── FLOATING REGISTER BUTTON ── */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:2px; color:#fff; font-family:'Montserrat',sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
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
              <a key={link} className={`nav-link${link === "Match Center" ? " active" : ""}`} href="#">{link}</a>
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
          {NAV_LINKS.map(link => (
            <div key={link} className="mob-menu-link" onClick={() => setMenuOpen(false)}>{link}</div>
          ))}
          <button className="btn-orange" style={{ marginTop: 12, padding: "14px 24px", fontSize: 14 }}>REGISTER NOW →</button>
        </div>
      )}

      {/* HERO */}
      <section style={{ background: "#06101E", padding: "60px 0 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "100%", background: "linear-gradient(135deg, rgba(255,122,41,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: "linear-gradient(180deg,transparent,#FF7A29 30%,#FF7A29 70%,transparent)", opacity: 0.35 }} />

        <div className="wrap">
          <div style={{ animation: "fadeUp 0.7s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 2, padding: "5px 12px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "inline-block", animation: "liveBlip 1.2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: "0.1em", color: "#EF4444", textTransform: "uppercase" }}>Phase 1 Open</span>
              </div>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", color: "#E8B23D" }}>SEASON 5 · 2025–26</span>
            </div>

            <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: "clamp(28px, 5vw, 60px)", color: "#fff", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.05, marginBottom: 14 }}>
              MATCH CENTER <span style={{ color: "#FF7A29" }}>·</span> SEASON 5
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(14px, 1.8vw, 17px)", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 560 }}>
              Season roadmap, trial city updates, match results and points table — all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* SEASON 5 TIMELINE — MAIN FEATURE */}
      <section style={{ padding: "64px 0", background: "#060C18" }}>
        <div className="wrap">
          <div className="section-label">Season Roadmap</div>
          <h2 className="section-title" style={{ fontSize: "clamp(22px, 4vw, 40px)", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
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

                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: block.active ? "rgba(255,122,41,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${block.active ? "rgba(255,122,41,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: 2, padding: "4px 10px", marginBottom: 14 }}>
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
      <section style={{ padding: "64px 0", background: "#06101E" }}>
        <div className="wrap">
          <div className="section-label">Locations</div>
          <h2 className="section-title" style={{ fontSize: "clamp(22px, 4vw, 40px)", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
            TRIAL CITIES — SEASON 5
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.4)", marginBottom: 36, fontSize: 15 }}>
            21 cities. One dream. Find your nearest trial ground.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {CITIES.map(city => (
              <div key={city} className="city-chip">
                <span>{city}</span>
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 9, letterSpacing: "0.1em", color: "#FF7A29", background: "rgba(255,122,41,0.12)", border: "1px solid rgba(255,122,41,0.2)", borderRadius: 2, padding: "2px 6px", textTransform: "uppercase" }}>Open</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MATCH RESULTS */}
      <section style={{ padding: "64px 0", background: "#060C18" }}>
        <div className="wrap">
          <div className="section-label">Results</div>
          <h2 className="section-title" style={{ fontSize: "clamp(22px, 4vw, 40px)", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
            RECENT RESULTS — SEASON 5 EXHIBITION
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.4)", marginBottom: 36, fontSize: 15 }}>
            Exhibition matches from Season 5 showcase events.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {RESULTS.map((match, i) => (
              <div key={i} className="result-card">
                {/* Orange header gradient */}
                <div style={{ background: "linear-gradient(135deg,#0D1E35,#0A1727)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Exhibition Match {i + 1}</span>
                  <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: "0.1em", color: "#22C55E", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 2, padding: "3px 8px", textTransform: "uppercase" }}>COMPLETED</span>
                </div>

                <div style={{ padding: "20px 18px" }}>
                  {/* Teams + Scores */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    {/* Team 1 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 13, color: match.winner === match.team1 ? "#fff" : "rgba(255,255,255,0.5)", lineHeight: 1.2, marginBottom: 4 }}>{match.team1}</div>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 22, color: match.winner === match.team1 ? match.color1 : "rgba(255,255,255,0.4)", lineHeight: 1 }}>{match.score1}</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>({match.overs1})</div>
                    </div>

                    {/* VS */}
                    <div style={{ padding: "0 14px", textAlign: "center" }}>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>VS</div>
                    </div>

                    {/* Team 2 */}
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 13, color: match.winner === match.team2 ? "#fff" : "rgba(255,255,255,0.5)", lineHeight: 1.2, marginBottom: 4 }}>{match.team2}</div>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 22, color: match.winner === match.team2 ? match.color2 : "rgba(255,255,255,0.4)", lineHeight: 1 }}>{match.score2}</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>({match.overs2})</div>
                    </div>
                  </div>

                  {/* Dashed divider */}
                  <div style={{ borderTop: "1px dashed rgba(255,255,255,0.1)", margin: "0 0 14px" }} />

                  {/* Result */}
                  <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 13, color: "#FF7A29", marginBottom: 6 }}>{match.result}</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                    <span style={{ color: "rgba(255,255,255,0.25)" }}>MOM: </span>
                    <span style={{ color: "#E8B23D", fontWeight: 600 }}>{match.mom}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POINTS TABLE */}
      <section style={{ padding: "64px 0", background: "#06101E" }}>
        <div className="wrap">
          <div className="section-label">Standings</div>
          <h2 className="section-title" style={{ fontSize: "clamp(22px, 4vw, 40px)", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
            POINTS TABLE — TOP 5
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.4)", marginBottom: 32, fontSize: 15 }}>
            Exhibition series standings. Season 5 league table begins Sep 2026.
          </p>

          <div className="card" style={{ overflow: "hidden" }}>
            {/* Header */}
            <div className="pts-header">
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>#</span>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Team</span>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>P</span>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>W</span>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>L</span>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>PTS</span>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>NRR</span>
            </div>

            {POINTS.map((row, i) => (
              <div key={i} className="pts-row">
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 13, color: i === 0 ? "#E8B23D" : "rgba(255,255,255,0.4)" }}>{row.rank}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 3, height: 18, background: row.color, borderRadius: 1, flexShrink: 0 }} />
                  <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 13, color: "#fff" }}>{row.name}</span>
                </div>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>{row.p}</span>
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, color: "#22C55E", textAlign: "center" }}>{row.w}</span>
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, color: "#EF4444", textAlign: "center" }}>{row.l}</span>
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 14, color: "#FF7A29", textAlign: "center" }}>{row.pts}</span>
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, color: "#22C55E", textAlign: "right" }}>{row.nrr}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, textAlign: "right" }}>
            <a href="#" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 12, color: "#FF7A29", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}>VIEW FULL TABLE →</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#060C18", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "60px 0 0" }}>
        <div className="wrap">
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 40, marginBottom: 48 }}>
            {/* Brand */}
            <div style={{ minWidth: 220 }}>
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
              { header: "League", links: ["About", "Teams", "Sponsors", "Schedule"] },
              { header: "Help", links: ["FAQ", "Contact", "Eligibility Criteria", "Cricket Rulebook"] },
              { header: "Legal", links: ["Terms", "Privacy", "Refunds", "Code of Conduct"] },
            ].map(col => (
              <div key={col.header}>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 16 }}>{col.header}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(link => (
                    <a key={link} href="#" className="footer-link">{link}</a>
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
      <a className="float-reg-btn float-reg-pulse" href="#" style={{textDecoration:"none"}}>🏏 REGISTER NOW →</a>
    </div>
  );
}
