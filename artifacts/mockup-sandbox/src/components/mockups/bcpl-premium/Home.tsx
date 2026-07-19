import React, { useState, useEffect } from "react";

const TEAMS = [
  { name: "Rajasthan Scorchers", city: "Jaipur", color: "#EF4444" },
  { name: "Punjab Warriors", city: "Chandigarh", color: "#F59E0B" },
  { name: "Kolkata Tigers", city: "Kolkata", color: "#F97316" },
  { name: "Lucknow Nawabs", city: "Lucknow", color: "#8B5CF6" },
  { name: "Mumbai Mavericks", city: "Mumbai", color: "#3B82F6" },
  { name: "Hyderabad Hawks", city: "Hyderabad", color: "#06B6D4" },
  { name: "Delhi Suryas", city: "Delhi", color: "#FF7A29" },
  { name: "Chennai Thalaivas", city: "Chennai", color: "#10B981" },
  { name: "Ahmedabad Lions", city: "Ahmedabad", color: "#EC4899" },
  { name: "Bengaluru Rockets", city: "Bengaluru", color: "#22C55E" },
];

const NAV_LINKS = ["Home", "Match Center", "Teams", "Sponsors", "Photos", "Videos", "About", "FAQ", "Contact"];

const TICKER_TEXT = "🏏 SEASON 5 REGISTRATIONS OPEN · ₹6 CR PRIZE POOL · 21 TRIAL CITIES · BACKED BY SOURAV GANGULY · 10 FRANCHISE TEAMS · #OfficeSeStadiumtak";

const ROADMAP = [
  {
    dates: "Oct–Feb 2025",
    milestone: "REGISTRATIONS",
    status: "OPEN",
    statusColor: "#FF7A29",
    desc: "Phase 1 open. Upload your 2-min trial video. BCCI scouts review.",
    cta: "REGISTER →",
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
    desc: "Phase 2 selections announced. Franchise team lists revealed.",
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

export function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState({ days: 47, hrs: 14, min: 22, sec: 45 });

  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + 47);
    target.setHours(18, 0, 0, 0);
    const tick = setInterval(() => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { clearInterval(tick); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hrs: Math.floor((diff % 86400000) / 3600000),
        min: Math.floor((diff % 3600000) / 60000),
        sec: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div style={{ background: "#06101E", minHeight: "100vh", color: "#F0EDE8", fontFamily: "'Inter',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pulseOrange { 0%,100% { box-shadow: 0 0 0 0 rgba(255,122,41,0.5); } 50% { box-shadow: 0 0 0 12px rgba(255,122,41,0); } }
        @keyframes liveBlip { 0%,100% { opacity:1; } 50% { opacity:0.15; } }
        @keyframes shimGold { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px rgba(255,122,41,0.3), 0 0 40px rgba(255,122,41,0.1); border-color: rgba(255,122,41,0.7); } 50% { box-shadow: 0 0 40px rgba(255,122,41,0.7), 0 0 80px rgba(255,122,41,0.3); border-color: #FF7A29; } }
        @keyframes diagonalMove { from { background-position: 0 0; } to { background-position: 60px 60px; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }

        .wrap { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
        @media(min-width:768px){ .wrap { padding: 0 40px; } }

        .desk-nav { display: none; align-items: center; gap: 20px; }
        @media(min-width:1024px){ .desk-nav { display: flex !important; } .ham-btn { display: none !important; } .mob-only { display: none !important; } }

        .nav-link { font-family: Montserrat, sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.08em; color: rgba(255,255,255,0.65); text-decoration: none; text-transform: uppercase; transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: #FF7A29; }

        .btn-orange { background: linear-gradient(135deg,#FF7A29,#D95E10); border: none; border-radius: 2px; color: #fff; font-family: Montserrat, sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.06em; cursor: pointer; padding: 11px 22px; transition: opacity 0.2s, transform 0.15s; text-transform: uppercase; }
        .btn-orange:hover { opacity: 0.9; transform: translateY(-1px); }

        .btn-ghost { background: transparent; border: 1px solid rgba(255,255,255,0.25); border-radius: 2px; color: rgba(255,255,255,0.8); font-family: Montserrat, sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.06em; cursor: pointer; padding: 11px 22px; transition: border-color 0.2s, color 0.2s; text-transform: uppercase; }
        .btn-ghost:hover { border-color: #FF7A29; color: #FF7A29; }

        .card { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; }

        .stat-box { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; padding: 20px 24px; }
        .stat-box-val { font-family: Montserrat, sans-serif; font-weight: 900; font-size: 28px; color: #FF7A29; line-height: 1; }
        .stat-box-label { font-family: Montserrat, sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.1em; color: rgba(255,255,255,0.45); text-transform: uppercase; margin-top: 6px; }

        .countdown-box { background: #060C18; border: 1px solid rgba(255,122,41,0.2); border-radius: 2px; padding: 18px 16px; text-align: center; min-width: 70px; }
        .countdown-num { font-family: Montserrat, sans-serif; font-weight: 900; font-size: 36px; color: #FF7A29; line-height: 1; display: block; }
        .countdown-label { font-family: Montserrat, sans-serif; font-weight: 700; font-size: 10px; letter-spacing: 0.12em; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-top: 4px; display: block; }

        .step-node { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: Montserrat, sans-serif; font-weight: 900; font-size: 15px; flex-shrink: 0; }
        .step-line { flex: 1; height: 2px; }

        .team-card { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; padding: 20px; cursor: default; transition: transform 0.2s, border-color 0.2s; position: relative; overflow: hidden; }
        .team-card:hover { transform: translateY(-3px); }

        .roadmap-scroll { display: flex; gap: 0; overflow-x: auto; padding-bottom: 12px; }
        .roadmap-scroll::-webkit-scrollbar { height: 4px; }
        .roadmap-scroll::-webkit-scrollbar-track { background: #060C18; }
        .roadmap-scroll::-webkit-scrollbar-thumb { background: #FF7A29; border-radius: 2px; }

        .roadmap-block { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; min-width: 220px; padding: 24px 20px; flex-shrink: 0; position: relative; }
        .roadmap-block.active { border-color: rgba(255,122,41,0.7); animation: glowPulse 2.5s ease-in-out infinite; }
        .roadmap-connector { width: 40px; height: 2px; background: rgba(255,255,255,0.12); align-self: center; flex-shrink: 0; position: relative; }
        .roadmap-connector::after { content:'▶'; position:absolute; right:-8px; top:-8px; color:rgba(255,255,255,0.2); font-size:10px; }

        .city-chip { background: #0A1727; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; padding: 8px 14px; font-family: Montserrat, sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.05em; color: rgba(255,255,255,0.75); text-transform: uppercase; transition: border-color 0.2s, color 0.2s; cursor: default; }
        .city-chip:hover { border-color: #FF7A29; color: #FF7A29; }

        .pricing-card { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; padding: 24px 20px; text-align: center; transition: border-color 0.2s, transform 0.2s; }
        .pricing-card:hover { border-color: rgba(255,122,41,0.4); transform: translateY(-2px); }

        .footer-link { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 13px; font-family: Inter, sans-serif; transition: color 0.2s; }
        .footer-link:hover { color: #FF7A29; }

        .shimmer-gold { background: linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimGold 3s linear infinite; }

        .section-label { font-family: Montserrat, sans-serif; font-weight: 800; font-size: 11px; letter-spacing: 0.15em; color: #FF7A29; text-transform: uppercase; display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .section-label::before { content: ''; display: inline-block; width: 24px; height: 2px; background: #FF7A29; }

        .section-title { font-family: Montserrat, sans-serif; font-weight: 900; line-height: 1.05; }

        .mob-menu { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #06101E; z-index: 999; display: flex; flex-direction: column; padding: 80px 32px 32px; gap: 24px; overflow-y: auto; }
        .mob-menu-link { font-family: Montserrat, sans-serif; font-weight: 800; font-size: 18px; letter-spacing: 0.06em; color: rgba(255,255,255,0.8); text-transform: uppercase; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 20px; transition: color 0.2s; }
        .mob-menu-link:hover { color: #FF7A29; }
        .close-btn { position: fixed; top: 20px; right: 24px; background: none; border: none; color: #fff; font-size: 28px; cursor: pointer; z-index: 1000; }

        .ham-btn { display: flex; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
        .ham-bar { width: 24px; height: 2px; background: #fff; display: block; }

        .diagonal-accent { position: absolute; top: 0; left: -80px; width: 300px; height: 100%; background: linear-gradient(135deg, rgba(255,122,41,0.06) 0%, transparent 60%); pointer-events: none; transform: skewX(-15deg); }

        .live-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: 2px; padding: 5px 12px; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #EF4444; animation: liveBlip 1.2s ease-in-out infinite; }

        .phase-badge { display: inline-block; font-family: Montserrat, sans-serif; font-weight: 800; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 8px; border-radius: 2px; }
      `}</style>

      {/* TICKER BAR */}
      <div style={{ background: "linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A)", overflow: "hidden", height: 36, display: "flex", alignItems: "center", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", whiteSpace: "nowrap", animation: "tickerScroll 32s linear infinite", gap: 0 }}>
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
          {/* Logo */}
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

          {/* Desktop Nav */}
          <nav className="desk-nav">
            {NAV_LINKS.map(link => (
              <a key={link} className="nav-link" href="#">{link}</a>
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
      <section style={{ background: "#06101E", position: "relative", overflow: "hidden", padding: "80px 0 60px" }}>
        {/* Diagonal accent */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: "linear-gradient(135deg, rgba(255,122,41,0.05) 0%, transparent 70%)", pointerEvents: "none", transform: "skewX(-8deg)", transformOrigin: "top left" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "40%", height: "60%", background: "radial-gradient(ellipse at right bottom, rgba(255,122,41,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        {/* Diagonal slash accent */}
        <div style={{ position: "absolute", top: "10%", left: "-5%", width: "4px", height: "80%", background: "linear-gradient(180deg,transparent,#FF7A29,transparent)", opacity: 0.3, transform: "skewX(-15deg)" }} />

        <div className="wrap">
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48 }}>
            {/* Left: Heading + CTA + Countdown */}
            <div style={{ animation: "fadeUp 0.8s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div className="live-badge">
                  <span className="live-dot" />
                  <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: "0.1em", color: "#EF4444", textTransform: "uppercase" }}>Phase 1 Open</span>
                </div>
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", color: "#E8B23D" }}>SEASON 5 · 2025–26</span>
              </div>

              <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: "clamp(32px, 6vw, 72px)", lineHeight: 1.0, color: "#fff", textTransform: "uppercase", marginBottom: 20, letterSpacing: "-0.01em" }}>
                INDIA'S BIGGEST<br />
                <span style={{ color: "#FF7A29" }}>CORPORATE</span><br />
                CRICKET LEAGUE
              </h1>

              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 32, maxWidth: 500 }}>
                10 franchise teams. 21 trial cities. ₹6 Cr prize pool.<br />
                Backed by <strong style={{ color: "#E8B23D" }}>Sourav Ganguly</strong>. Open to all working professionals.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 48 }}>
                <button className="btn-orange" style={{ fontSize: 14, padding: "14px 28px" }}>REGISTER NOW — ₹299 →</button>
                <button className="btn-ghost" style={{ fontSize: 14, padding: "14px 28px" }}>HOW IT WORKS ↓</button>
              </div>

              {/* Countdown */}
              <div>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 14 }}>⏱ Phase 1 Closes In</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    { val: countdown.days, label: "DAYS" },
                    { val: countdown.hrs, label: "HRS" },
                    { val: countdown.min, label: "MIN" },
                    { val: countdown.sec, label: "SEC" },
                  ].map(({ val, label }) => (
                    <div key={label} className="countdown-box">
                      <span className="countdown-num">{String(val).padStart(2, "0")}</span>
                      <span className="countdown-label">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats 2×2 grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, animation: "fadeUp 0.8s 0.2s ease both" }}>
              {[
                { val: "₹6 Cr", label: "Prize Pool" },
                { val: "10", label: "Franchise Teams" },
                { val: "21", label: "Trial Cities" },
                { val: "₹15L", label: "Top Auction Bid" },
              ].map(s => (
                <div key={s.label} className="stat-box" style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: "#FF7A29" }} />
                  <div className="stat-box-val" style={{ paddingLeft: 8 }}>{s.val}</div>
                  <div className="stat-box-label" style={{ paddingLeft: 8 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PHASE 1 URGENT STRIP */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div style={{
          background: "linear-gradient(135deg,#C94E0E 0%,#FF7A29 50%,#E8611A 100%)",
          backgroundSize: "300% 300%",
          animation: "gradShift 4s ease infinite",
          padding: "48px 0",
          position: "relative",
        }}>
          {/* Diagonal stripe texture */}
          <div style={{
            position: "absolute", inset: 0,
            background: "repeating-linear-gradient(135deg, transparent, transparent 20px, rgba(0,0,0,0.06) 20px, rgba(0,0,0,0.06) 40px)",
            animation: "diagonalMove 2s linear infinite",
          }} />
          <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: "clamp(22px, 4vw, 38px)", color: "#fff", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                ⚡ PHASE 1 TRIALS NOW OPEN
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "rgba(255,255,255,0.9)", marginBottom: 28, lineHeight: 1.5 }}>
                Send your 2-minute video. BCCI scouts review in 7 days.
              </div>
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 2, padding: "10px 20px", fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 14, color: "#fff" }}>
                  🏏 Bat &nbsp;/&nbsp; 🎳 Bowl &nbsp;/&nbsp; 🧤 WK — <span style={{ color: "#FFE8A0" }}>₹299</span>
                </div>
                <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 2, padding: "10px 20px", fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 14, color: "#fff" }}>
                  ⭐ All-Rounder — <span style={{ color: "#FFE8A0" }}>₹399</span>
                </div>
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 28 }}>
                If selected for Phase 2 — pay only then (₹2,000 / ₹3,000)
              </div>
              <button style={{ background: "#060C18", border: "2px solid rgba(255,255,255,0.3)", borderRadius: 2, color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: "0.06em", padding: "14px 32px", cursor: "pointer", textTransform: "uppercase", transition: "background 0.2s" }}>
                REGISTER NOW →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "80px 0", background: "#06101E" }}>
        <div className="wrap">
          <div className="section-label">Process</div>
          <h2 className="section-title" style={{ fontSize: "clamp(24px, 4vw, 42px)", color: "#fff", marginBottom: 16, textTransform: "uppercase" }}>HOW THE TRIAL WORKS</h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.5)", marginBottom: 52, fontSize: 15 }}>Your journey from office to stadium — 6 clear steps.</p>

          {/* Journey Rail */}
          <div style={{ overflowX: "auto", paddingBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", minWidth: 700, gap: 0 }}>
              {[
                { num: 1, icon: "📝", label: "Register & Pay", sub: "Fill form + pay entry fee", phase: "P1", color: "#FF7A29", active: true },
                { num: 2, icon: "🎬", label: "Upload Video", sub: "2-min trial clip", phase: "P1", color: "#FF7A29", active: false },
                { num: 3, icon: "⏱", label: "Scout Review", sub: "BCCI scouts evaluate · 7 days", phase: "P1", color: "#FF7A29", active: false },
                { num: 4, icon: "🏟", label: "Physical Trial", sub: "At your city (if selected)", phase: "P2", color: "#E8B23D", active: false },
                { num: 5, icon: "🔨", label: "Franchise Auction", sub: "Franchises bid on you", phase: "P2", color: "#E8B23D", active: false },
                { num: 6, icon: "🏆", label: "Play BCPL S5", sub: "Represent your franchise", phase: "FINAL", color: "#22C55E", active: false },
              ].map((step, i, arr) => (
                <React.Fragment key={i}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 100 }}>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 9, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 2, background: step.phase === "P1" ? "rgba(255,122,41,0.15)" : step.phase === "P2" ? "rgba(232,178,61,0.15)" : "rgba(34,197,94,0.15)", color: step.phase === "P1" ? "#FF7A29" : step.phase === "P2" ? "#E8B23D" : "#22C55E", textTransform: "uppercase" }}>{step.phase}</span>
                    </div>
                    <div className="step-node" style={{ background: step.active ? "#FF7A29" : step.phase === "FINAL" ? "#22C55E" : step.phase === "P2" ? "rgba(232,178,61,0.15)" : "rgba(255,122,41,0.12)", border: `2px solid ${step.color}`, color: step.active ? "#fff" : step.color, animation: step.active ? "pulseOrange 2s infinite" : "none" }}>
                      {step.num}
                    </div>
                    <div style={{ marginTop: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{step.icon}</div>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 12, color: step.active ? "#FF7A29" : "rgba(255,255,255,0.8)", letterSpacing: "0.04em", lineHeight: 1.2, marginBottom: 4 }}>{step.label}</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{step.sub}</div>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ height: 2, flex: "0 0 20px", background: i < 2 ? "rgba(255,122,41,0.3)" : i < 5 ? "rgba(232,178,61,0.2)" : "rgba(34,197,94,0.3)", alignSelf: "center", marginTop: -40 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEASON 5 ROADMAP TIMELINE */}
      <section style={{ padding: "80px 0", background: "#060C18" }}>
        <div className="wrap">
          <div className="section-label">Timeline</div>
          <h2 className="section-title" style={{ fontSize: "clamp(24px, 4vw, 42px)", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>SEASON 5 ROADMAP</h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.45)", marginBottom: 40, fontSize: 15 }}>From registration to the final — your complete season journey.</p>

          <div className="roadmap-scroll" style={{ display: "flex", alignItems: "stretch" }}>
            {ROADMAP.map((block, i) => (
              <React.Fragment key={i}>
                <div className={`roadmap-block${block.active ? " active" : ""}`} style={{ borderTop: `3px solid ${block.statusColor}` }}>
                  <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>{block.dates}</div>
                  <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", textTransform: "uppercase", marginBottom: 10, letterSpacing: "0.02em" }}>{block.milestone}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: block.active ? "rgba(255,122,41,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${block.active ? "rgba(255,122,41,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 2, padding: "4px 10px", marginBottom: 14 }}>
                    {block.active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF7A29", display: "inline-block", animation: "liveBlip 1.2s infinite" }} />}
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: "0.1em", color: block.statusColor, textTransform: "uppercase" }}>{block.status}</span>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: block.cta ? 16 : 0 }}>{block.desc}</div>
                  {block.cta && (
                    <button className="btn-orange" style={{ fontSize: 11, padding: "8px 16px", marginTop: 8 }}>{block.cta}</button>
                  )}
                </div>
                {i < ROADMAP.length - 1 && (
                  <div className="roadmap-connector" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* FRANCHISE TEAMS */}
      <section style={{ padding: "80px 0", background: "#06101E" }}>
        <div className="wrap">
          <div className="section-label">Franchises</div>
          <h2 className="section-title" style={{ fontSize: "clamp(24px, 4vw, 42px)", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>THE 10 FRANCHISE TEAMS</h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.45)", marginBottom: 40, fontSize: 15 }}>Choose your allegiance. One of these will be your home.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {TEAMS.map(team => (
              <div key={team.name} className="team-card" style={{ borderTop: `3px solid ${team.color}` }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${team.color}14 0%, transparent 70%)`, pointerEvents: "none" }} />
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 15, color: "#fff", letterSpacing: "0.02em", marginBottom: 6, lineHeight: 1.2 }}>{team.name}</div>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 11, color: team.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{team.city}</div>
                <div style={{ marginTop: 12, width: 24, height: 3, background: team.color, borderRadius: 1 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIZE POOL SECTION */}
      <section style={{ padding: "80px 0", background: "#060C18", textAlign: "center" }}>
        <div className="wrap">
          <div className="section-label" style={{ justifyContent: "center" }}>Season 5</div>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: "clamp(64px, 12vw, 120px)", lineHeight: 1, marginBottom: 8 }}>
            <span className="shimmer-gold">₹6 CRORE</span>
          </div>
          <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: "clamp(18px, 3vw, 28px)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>SEASON 5 PRIZE POOL</div>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.5)", fontSize: 16, marginBottom: 52 }}>The biggest prize pool in corporate cricket history.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, textAlign: "left" }}>
            {[
              { val: "4", label: "Seasons Completed" },
              { val: "400+", label: "Players Auctioned" },
              { val: "₹14 Cr+", label: "Total Prize Distributed" },
              { val: "21", label: "Cities Covered" },
            ].map(s => (
              <div key={s.label} className="stat-box" style={{ textAlign: "center", padding: "28px 20px" }}>
                <div className="stat-box-val" style={{ fontSize: 36 }}>{s.val}</div>
                <div className="stat-box-label" style={{ marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AMBASSADOR SECTION */}
      <section style={{ padding: "80px 0", background: "#06101E" }}>
        <div className="wrap">
          <div className="section-label">Brand Ambassador</div>
          <h2 className="section-title" style={{ fontSize: "clamp(22px, 3.5vw, 38px)", color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>BACKED BY INDIA'S GREATEST MATCH-WINNER</h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.45)", marginBottom: 40, fontSize: 15 }}>Sourav Ganguly · The Prince of Kolkata · BCPL Brand Ambassador</p>

          <div className="card" style={{ borderLeft: "4px solid #FF7A29", padding: "36px 32px", position: "relative", overflow: "hidden", maxWidth: 760 }}>
            <div style={{ position: "absolute", top: -20, right: -20, fontSize: 120, opacity: 0.04, fontFamily: "Georgia, serif", lineHeight: 1, userSelect: "none" }}>"</div>
            <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: "100%", background: "linear-gradient(270deg,rgba(255,122,41,0.04) 0%,transparent 100%)", pointerEvents: "none" }} />
            <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", color: "#FF7A29", textTransform: "uppercase", marginBottom: 16 }}>Brand Ambassador · BCPL T20 Season 5</div>
            <blockquote style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(16px, 2vw, 20px)", lineHeight: 1.7, color: "rgba(255,255,255,0.85)", fontStyle: "italic", marginBottom: 24, borderLeft: "none", padding: 0 }}>
              "Cricket is not just a sport — it is a way of life. BCPL gives every corporate professional the chance to live that dream."
            </blockquote>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#FF7A29,#E8B23D)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 16, color: "#fff" }}>SG</div>
              <div>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 16, color: "#E8B23D" }}>Sourav Ganguly</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>The Prince of Kolkata · BCCI Former President</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REGISTRATION CTA SECTION */}
      <section style={{ padding: "80px 0", background: "#060C18" }}>
        <div className="wrap">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-label" style={{ justifyContent: "center" }}>Register Now</div>
            <h2 className="section-title" style={{ fontSize: "clamp(24px, 4vw, 48px)", color: "#fff", marginBottom: 12, textTransform: "uppercase" }}>YOUR SHOT AT THE BIG LEAGUE</h2>
            <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.45)", fontSize: 15 }}>Season 5 is calling. Pick your role. Start your journey.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 36 }}>
            {[
              { emoji: "🏏", role: "Batsman", p1: "₹299", p2: "₹2,000" },
              { emoji: "🎳", role: "Bowler", p1: "₹299", p2: "₹2,000" },
              { emoji: "🧤", role: "Wicket-Keeper", p1: "₹299", p2: "₹2,000" },
              { emoji: "⭐", role: "All-Rounder", p1: "₹399", p2: "₹3,000", premium: true },
            ].map(r => (
              <div key={r.role} className="pricing-card" style={{ borderTop: r.premium ? "3px solid #E8B23D" : "3px solid rgba(255,122,41,0.4)" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{r.emoji}</div>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 15, color: "#fff", marginBottom: 4, textTransform: "uppercase" }}>{r.role}</div>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 28, color: r.premium ? "#E8B23D" : "#FF7A29", marginBottom: 8 }}>{r.p1}</div>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Phase 1 Entry</div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                    Phase 2: {r.p2}<br />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Only if selected</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <button className="btn-orange" style={{ fontSize: 16, padding: "18px 48px", letterSpacing: "0.06em" }}>
              REGISTER NOW — SEASON 5 →
            </button>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 16 }}>
              If selected for Phase 2, pay only then. No hidden charges.
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#060C18", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "60px 0 0" }}>
        <div className="wrap">
          {/* Top */}
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

            {/* Links */}
            {[
              {
                header: "League",
                links: ["About", "Teams", "Sponsors", "Schedule"],
              },
              {
                header: "Help",
                links: ["FAQ", "Contact", "Eligibility Criteria", "Cricket Rulebook"],
              },
              {
                header: "Legal",
                links: ["Terms", "Privacy", "Refunds", "Code of Conduct"],
              },
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

          {/* Bottom bar */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 0", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
              Season 5 · Kriparti Playing 11 Pvt. Ltd. · © 2025 · All Rights Reserved
            </span>
            <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", color: "#FF7A29" }}>#OfficeSeStadiumtak</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
