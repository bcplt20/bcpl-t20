import React, { useState, useEffect } from "react";

const L = "/__mockup/bcpl-assets/logos/";
const G = "/__mockup/bcpl-assets/ganguly_2.jpg";

const TEAMS = [
  { name:"Rajasthan Scorchers", city:"Jaipur",     color:"#E97B6B", logo:`${L}rajasthan_scorchers.jpg`  },
  { name:"Punjab Warriors",     city:"Chandigarh", color:"#DC2626", logo:`${L}punjab_warriors.jpg`      },
  { name:"Kolkata Tigers",      city:"Kolkata",    color:"#F97316", logo:`${L}kolkata_tigers.jpg`       },
  { name:"Lucknow Nawabs",      city:"Lucknow",    color:"#F59E0B", logo:`${L}lucknow_nawabs.jpg`       },
  { name:"Mumbai Mavericks",    city:"Mumbai",     color:"#3B82F6", logo:`${L}mumbai_mavericks.jpg`     },
  { name:"Hyderabad Hawks",     city:"Hyderabad",  color:"#16A34A", logo:`${L}hyderabad_hawks.jpg`      },
  { name:"Delhi Suryas",        city:"Delhi",      color:"#6366F1", logo:`${L}delhi_suryas.jpg`         },
  { name:"Chennai Thalaivas",   city:"Chennai",    color:"#2563EB", logo:`${L}chennai_thalaivas.jpg`    },
  { name:"Ahmedabad Lions",     city:"Ahmedabad",  color:"#B91C1C", logo:`${L}ahmedabad_lions.jpg`      },
  { name:"Bengaluru Rockets",   city:"Bengaluru",  color:"#EF4444", logo:`${L}bengaluru_rockets.jpg`    },
];

const NAV_LINKS = ["Home","Match Center","Teams","Sponsors","Photos","Videos","About","FAQ","Contact"];
const TICKER = "🏏 SEASON 5 OPEN · ₹6 CR PRIZE POOL · 21 TRIAL CITIES · SOURAV GANGULY · 10 FRANCHISE TEAMS · #OfficeSeStadiumtak";

const SLIDES = [
  {
    id: 0,
    tag: "Phase 1 Now Open",
    headline: ["INDIA'S BIGGEST", "CORPORATE", "CRICKET LEAGUE"],
    accents: [false, true, false],
    sub: "10 franchise teams. 21 cities. ₹6 Cr prize pool. Open for all working professionals.",
    cta: "REGISTER NOW — ₹299 →",
    ctaSecondary: "HOW IT WORKS ↓",
    bg: "linear-gradient(135deg,#06101E 0%,#0A1727 100%)",
    accent: "#FF7A29",
    image: null,
    imageSide: "stats",
  },
  {
    id: 1,
    tag: "Brand Ambassador · BCPL T20",
    headline: ["BACKED BY", "SOURAV", "GANGULY"],
    accents: [false, true, false],
    sub: "\"Cricket is not just a sport — it is a way of life. BCPL gives every professional the chance to live that dream.\"",
    cta: "REGISTER FOR SEASON 5 →",
    ctaSecondary: null,
    bg: "linear-gradient(135deg,#04080F 0%,#0A0F1A 100%)",
    accent: "#E8B23D",
    image: G,
    imageSide: "photo",
  },
  {
    id: 2,
    tag: "Season 5 · Prize Pool",
    headline: ["₹6 CRORE", "PRIZE", "POOL"],
    accents: [true, false, false],
    sub: "The biggest prize pool in corporate cricket history. Top auction bid: ₹15 Lakh. 4 seasons completed.",
    cta: "REGISTER & WIN →",
    ctaSecondary: "VIEW ROADMAP ↓",
    bg: "linear-gradient(135deg,#06101E 0%,#0D1A10 100%)",
    accent: "#22C55E",
    image: null,
    imageSide: "prize",
  },
];

const ROADMAP = [
  { dates:"Oct–Feb 2025", milestone:"REGISTRATIONS", status:"OPEN",     statusColor:"#FF7A29", desc:"Phase 1 open. Upload your 2-min trial video. BCCI scouts review.", cta:"REGISTER →", active:true },
  { dates:"Mar–Jun 2026", milestone:"TRIALS",         status:"UPCOMING", statusColor:"#E8B23D", desc:"Physical trials at 21 city grounds. Franchise coaches present.", cta:null, active:false },
  { dates:"Jul–Aug 2026", milestone:"RESULTS",        status:"UPCOMING", statusColor:"#E8B23D", desc:"Phase 2 selections announced. Franchise team lists revealed.", cta:null, active:false },
  { dates:"Aug 2026",     milestone:"AUCTION",         status:"UPCOMING", statusColor:"#E8B23D", desc:"Live franchise auction. Players sold for up to ₹15L.", cta:null, active:false },
  { dates:"Sep–Oct 2026", milestone:"TOURNAMENT",      status:"UPCOMING", statusColor:"#E8B23D", desc:"BCPL Season 5 T20 matches across India. ₹6 Cr prize pool.", cta:null, active:false },
];

const STEPS = [
  { num:1, icon:"📝", label:"Register & Pay",    sub:"Fill form + pay entry fee",          phase:"P1", color:"#FF7A29", active:true  },
  { num:2, icon:"🎬", label:"Upload Video",       sub:"2-min trial clip to BCCI scouts",    phase:"P1", color:"#FF7A29", active:false },
  { num:3, icon:"⏱", label:"Scout Review",       sub:"BCCI scouts evaluate · 7 days",      phase:"P1", color:"#FF7A29", active:false },
  { num:4, icon:"🏟", label:"Physical Trial",     sub:"At your city (if selected)",         phase:"P2", color:"#E8B23D", active:false },
  { num:5, icon:"🔨", label:"Franchise Auction",  sub:"Franchises bid on you",              phase:"P2", color:"#E8B23D", active:false },
  { num:6, icon:"🏆", label:"Play BCPL S5",       sub:"Represent your franchise",           phase:"FINAL", color:"#22C55E", active:false },
];

export function Home() {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [slideIdx,   setSlideIdx]   = useState(0);
  const [countdown,  setCountdown]  = useState({ days:47, hrs:14, min:22, sec:45 });
  const [imgError,   setImgError]   = useState(false);

  /* Countdown */
  useEffect(() => {
    const target = new Date(); target.setDate(target.getDate()+47); target.setHours(18,0,0,0);
    const t = setInterval(() => {
      const d = target.getTime() - Date.now();
      if (d<=0) { clearInterval(t); return; }
      setCountdown({ days:Math.floor(d/86400000), hrs:Math.floor((d%86400000)/3600000), min:Math.floor((d%3600000)/60000), sec:Math.floor((d%60000)/1000) });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* Banner auto-rotate */
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i+1)%SLIDES.length), 5500);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[slideIdx];

  return (
    <div style={{ background:"#06101E", minHeight:"100vh", color:"#F0EDE8", fontFamily:"'Inter',sans-serif", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }

        @keyframes tickerScroll  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes shimGold      { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes shimOrange    { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes gradShift     { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes glowPulse     { 0%,100%{box-shadow:0 0 20px rgba(255,122,41,0.25),0 0 40px rgba(255,122,41,0.08);border-color:rgba(255,122,41,0.6)} 50%{box-shadow:0 0 40px rgba(255,122,41,0.6),0 0 80px rgba(255,122,41,0.2);border-color:#FF7A29} }
        @keyframes liveBlip      { 0%,100%{opacity:1} 50%{opacity:0.1} }
        @keyframes pulseOrange   { 0%,100%{box-shadow:0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 0 0 10px rgba(255,122,41,0)} }
        @keyframes fadeUp        { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn       { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes diagonalMove  { from{background-position:0 0} to{background-position:60px 60px} }
        @keyframes logoFloat     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

        .wrap { max-width:1280px; margin:0 auto; padding:0 16px; }
        @media(min-width:640px){ .wrap{padding:0 24px} }
        @media(min-width:1024px){ .wrap{padding:0 40px} }

        /* NAV */
        .desk-nav { display:none; }
        @media(min-width:1024px){ .desk-nav{display:flex;align-items:center;gap:20px} .ham-btn{display:none!important} }
        .nav-link { font-family:Montserrat,sans-serif; font-weight:700; font-size:12px; letter-spacing:.08em; color:rgba(255,255,255,0.6); text-decoration:none; text-transform:uppercase; transition:color .2s; }
        .nav-link:hover { color:#FF7A29; }
        .ham-btn { display:flex; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:8px; }
        .ham-bar { width:24px; height:2px; background:#fff; display:block; }
        .mob-menu { position:fixed; top:0; left:0; right:0; bottom:0; background:#06101E; z-index:999; display:flex; flex-direction:column; padding:80px 32px 32px; gap:24px; overflow-y:auto; }
        .mob-menu-link { font-family:Montserrat,sans-serif; font-weight:800; font-size:18px; color:rgba(255,255,255,0.8); text-transform:uppercase; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:20px; }
        .close-btn { position:fixed; top:20px; right:24px; background:none; border:none; color:#fff; font-size:28px; cursor:pointer; z-index:1000; }

        /* BUTTONS */
        .btn-orange { background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:2px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:12px 22px; transition:opacity .2s,transform .15s; text-transform:uppercase; }
        .btn-orange:hover { opacity:.9; transform:translateY(-1px); }
        .btn-ghost { background:transparent; border:1.5px solid rgba(255,255,255,0.3); border-radius:2px; color:rgba(255,255,255,0.8); font-family:Montserrat,sans-serif; font-weight:700; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:12px 22px; transition:border-color .2s,color .2s; text-transform:uppercase; }
        .btn-ghost:hover { border-color:#FF7A29; color:#FF7A29; }

        /* SECTION LABELS */
        .section-label { font-family:Montserrat,sans-serif; font-weight:800; font-size:11px; letter-spacing:.15em; color:#FF7A29; text-transform:uppercase; display:flex; align-items:center; gap:10px; margin-bottom:14px; }
        .section-label::before { content:''; display:inline-block; width:24px; height:2px; background:#FF7A29; }
        .section-title { font-family:Montserrat,sans-serif; font-weight:900; line-height:1.05; }

        /* SHIMMER */
        .shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimGold 3s linear infinite; }
        .shimmer-orange { background:linear-gradient(90deg,#FF7A29,#FFB347,#FF7A29,#FFB347,#FF7A29); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimOrange 3s linear infinite; }

        /* COUNTDOWN */
        .countdown-box { background:#060C18; border:1px solid rgba(255,122,41,0.2); border-radius:2px; padding:14px 12px; text-align:center; min-width:64px; }
        .countdown-num { font-family:Montserrat,sans-serif; font-weight:900; font-size:clamp(24px,5vw,36px); color:#FF7A29; line-height:1; display:block; }
        .countdown-label { font-family:Montserrat,sans-serif; font-weight:700; font-size:10px; letter-spacing:.12em; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-top:4px; display:block; }

        /* STAT BOX */
        .stat-box { background:#0A1727; border:1px solid rgba(255,255,255,0.07); border-radius:2px; padding:18px 20px; position:relative; overflow:hidden; }
        .stat-val { font-family:Montserrat,sans-serif; font-weight:900; font-size:clamp(20px,3vw,28px); color:#FF7A29; }
        .stat-lbl { font-family:Montserrat,sans-serif; font-weight:700; font-size:10px; letter-spacing:.1em; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-top:5px; }

        /* CARDS */
        .card { background:#0A1727; border:1px solid rgba(255,255,255,0.07); border-radius:2px; }

        /* STEP CARD */
        .step-card { background:#0A1727; border:1px solid rgba(255,255,255,0.07); border-radius:2px; padding:20px 18px; display:flex; flex-direction:column; gap:10px; position:relative; transition:border-color .2s,transform .2s; }
        .step-card:hover { transform:translateY(-2px); }
        .step-card.active-step { border-color:rgba(255,122,41,0.5); animation:glowPulse 2.5s ease-in-out infinite; }

        /* TEAM CARD */
        .team-card { background:#0A1727; border:1px solid rgba(255,255,255,0.07); border-radius:2px; padding:18px 16px; position:relative; overflow:hidden; transition:transform .2s,border-color .2s; cursor:default; display:flex; flex-direction:column; justify-content:space-between; min-height:130px; }
        .team-card:hover { transform:translateY(-3px); }

        /* ROADMAP */
        .roadmap-block { background:#0A1727; border:1px solid rgba(255,255,255,0.07); border-radius:2px; min-width:200px; padding:22px 18px; flex-shrink:0; }
        .roadmap-block.active { border-color:rgba(255,122,41,0.6); animation:glowPulse 2.5s ease-in-out infinite; }

        /* PRICING CARD */
        .pricing-card { background:#0A1727; border:1px solid rgba(255,255,255,0.07); border-radius:2px; padding:22px 18px; text-align:center; transition:border-color .2s,transform .2s; }
        .pricing-card:hover { border-color:rgba(255,122,41,0.35); transform:translateY(-2px); }

        /* FOOTER LINK */
        .footer-link { color:rgba(255,255,255,0.5); text-decoration:none; font-size:13px; font-family:Inter,sans-serif; transition:color .2s; }
        .footer-link:hover { color:#FF7A29; }

        /* SLIDE DOT */
        .slide-dot { width:24px; height:3px; border-radius:2px; cursor:pointer; transition:all .3s; border:none; }
      `}</style>

      {/* ── TICKER ── */}
      <div style={{ background:"linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A)", overflow:"hidden", height:36, display:"flex", alignItems:"center", position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", whiteSpace:"nowrap", animation:"tickerScroll 32s linear infinite" }}>
          {[0,1].map(i => <span key={i} style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:11, letterSpacing:".1em", color:"#fff", paddingRight:80 }}>{TICKER} &nbsp;&nbsp;&nbsp; {TICKER} &nbsp;&nbsp;&nbsp;</span>)}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position:"sticky", top:0, zIndex:200, background:"rgba(6,16,30,0.97)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div className="wrap" style={{ height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
              <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:22, color:"#FF7A29" }}>BCPL</span>
              <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:22, color:"#fff" }}>T20</span>
            </div>
            <div style={{ width:1, height:28, background:"rgba(255,255,255,0.12)" }} />
            <div>
              <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:9, letterSpacing:".12em", color:"#E8B23D", textTransform:"uppercase" }}>Season 5</div>
              <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:8, letterSpacing:".08em", color:"rgba(255,255,255,0.35)", textTransform:"uppercase" }}>Kriparti Playing11</div>
            </div>
          </div>
          <nav className="desk-nav">
            {NAV_LINKS.map(l => <a key={l} className="nav-link" href="#">{l}</a>)}
          </nav>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button className="btn-orange" style={{ fontSize:12, padding:"9px 18px" }}>REGISTER NOW →</button>
            <button className="ham-btn" onClick={() => setMenuOpen(true)}><span className="ham-bar"/><span className="ham-bar"/><span className="ham-bar"/></button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mob-menu">
          <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
          {NAV_LINKS.map(l => <div key={l} className="mob-menu-link" onClick={() => setMenuOpen(false)}>{l}</div>)}
          <button className="btn-orange" style={{ marginTop:12, padding:"14px 24px", fontSize:14 }}>REGISTER NOW →</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          BANNER CAROUSEL — Full-bleed hero
      ══════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", background:slide.bg, transition:"background 0.7s ease", minHeight:"clamp(440px,58vw,580px)", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>

        {/* Background texture */}
        <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(135deg,transparent,transparent 40px,rgba(255,255,255,0.012) 40px,rgba(255,255,255,0.012) 80px)", pointerEvents:"none" }} />

        {/* Accent radial */}
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 60% 70% at 20% 50%,${slide.accent}0D 0%,transparent 70%)`, pointerEvents:"none", transition:"background 0.7s" }} />

        {/* Diagonal accent bar */}
        <div style={{ position:"absolute", top:0, left:"-5%", width:"55%", height:"100%", background:`linear-gradient(135deg,${slide.accent}08 0%,transparent 60%)`, transform:"skewX(-6deg)", transformOrigin:"top left", pointerEvents:"none", transition:"background 0.7s" }} />

        {/* Top color bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,transparent 0%,${slide.accent} 40%,${slide.accent} 60%,transparent 100%)`, opacity:0.8, transition:"background 0.7s" }} />

        {/* RIGHT SIDE CONTENT */}
        {slide.imageSide === "photo" && (
          <div style={{ position:"absolute", right:0, top:0, bottom:0, width:"clamp(200px,40%,420px)", overflow:"hidden" }}>
            {!imgError ? (
              <img src={G} alt="Sourav Ganguly" onError={() => setImgError(true)}
                style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top center", filter:"brightness(0.85) contrast(1.1)" }} />
            ) : (
              /* Fallback if image doesn't load */
              <div style={{ width:"100%", height:"100%", background:"linear-gradient(180deg,#0A0F1A,#040810)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8 }}>
                <div style={{ width:100, height:100, borderRadius:2, background:"linear-gradient(135deg,#E8B23D,#C49A1E)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:40, color:"#fff" }}>SG</div>
              </div>
            )}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(270deg,transparent 40%,#040810 100%)" }} />
          </div>
        )}

        {slide.imageSide === "stats" && (
          <div style={{ position:"absolute", right:"3%", top:"50%", transform:"translateY(-50%)", display:"flex", flexDirection:"column", gap:10, zIndex:1 }}>
            {[{v:"₹6 Cr",l:"Prize Pool"},{v:"10",l:"Teams"},{v:"21",l:"Cities"},{v:"₹15L",l:"Top Bid"}].map(s => (
              <div key={s.l} className="stat-box" style={{ minWidth:120, borderLeft:`3px solid ${slide.accent}`, paddingLeft:14, transition:"border-color 0.7s" }}>
                <div className="stat-val" style={{ color:slide.accent, transition:"color 0.7s" }}>{s.v}</div>
                <div className="stat-lbl">{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {slide.imageSide === "prize" && (
          <div style={{ position:"absolute", right:"4%", top:"50%", transform:"translateY(-50%)", textAlign:"center", zIndex:1 }}>
            <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"clamp(60px,10vw,110px)", lineHeight:1, color:"#22C55E", opacity:0.12 }}>₹6Cr</div>
          </div>
        )}

        {/* LEFT: Main Slide Content */}
        <div className="wrap" style={{ position:"relative", zIndex:2, paddingTop:56, paddingBottom:64, maxWidth:680 }}>
          {/* Tag */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:`${slide.accent}18`, border:`1px solid ${slide.accent}44`, borderRadius:2, padding:"6px 14px", marginBottom:22, transition:"all 0.5s" }}>
            {slide.id === 1 && <span style={{ width:7, height:7, borderRadius:"50%", background:"#E8B23D", display:"inline-block" }} />}
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:11, color:slide.accent, letterSpacing:".12em", textTransform:"uppercase", transition:"color 0.5s" }}>{slide.tag}</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"clamp(28px,5.5vw,68px)", lineHeight:1.03, color:"#fff", textTransform:"uppercase", marginBottom:20, letterSpacing:"-0.01em" }}>
            {slide.headline.map((line, i) => (
              <React.Fragment key={i}>
                {slide.accents[i]
                  ? <span style={{ color:slide.accent, transition:"color 0.5s" }}>{line}</span>
                  : line}
                {i < slide.headline.length - 1 && <br />}
              </React.Fragment>
            ))}
          </h1>

          {/* Sub */}
          <p style={{ fontFamily:"Inter,sans-serif", fontSize:"clamp(14px,2vw,17px)", color:"rgba(255,255,255,0.6)", lineHeight:1.65, marginBottom:32, maxWidth:520, fontStyle: slide.id===1 ? "italic" : "normal" }}>
            {slide.sub}
          </p>

          {/* CTAs */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom: slide.id === 0 ? 36 : 0 }}>
            <button className="btn-orange" style={{ fontSize:14, padding:"14px 28px", background:`linear-gradient(135deg,${slide.accent},${slide.accent}CC)`, transition:"background 0.5s" }}>{slide.cta}</button>
            {slide.ctaSecondary && <button className="btn-ghost" style={{ fontSize:14, padding:"14px 28px" }}>{slide.ctaSecondary}</button>}
          </div>

          {/* Countdown — slide 0 only */}
          {slide.id === 0 && (
            <div>
              <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, letterSpacing:".16em", color:"rgba(255,255,255,0.4)", textTransform:"uppercase", marginBottom:12 }}>⏱ Phase 1 Closes In</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[{v:countdown.days,l:"DAYS"},{v:countdown.hrs,l:"HRS"},{v:countdown.min,l:"MIN"},{v:countdown.sec,l:"SEC"}].map(({v,l}) => (
                  <div key={l} className="countdown-box">
                    <span className="countdown-num">{String(v).padStart(2,"0")}</span>
                    <span className="countdown-label">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ganguly attribution — slide 1 */}
          {slide.id === 1 && (
            <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:8 }}>
              <div style={{ width:36, height:36, borderRadius:2, background:"linear-gradient(135deg,#E8B23D,#C49A1E)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:14, color:"#fff" }}>SG</div>
              <div>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:15, color:"#E8B23D" }}>Sourav Ganguly</div>
                <div style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:"rgba(255,255,255,0.4)" }}>The Prince of Kolkata · BCPL Brand Ambassador</div>
              </div>
            </div>
          )}

          {/* Prize breakdown — slide 2 */}
          {slide.id === 2 && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
              {[{v:"4",l:"Seasons Done"},{v:"400+",l:"Players Auctioned"},{v:"₹14Cr+",l:"Total Distributed"}].map(s => (
                <div key={s.l} style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:2, padding:"10px 14px" }}>
                  <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:18, color:"#22C55E" }}>{s.v}</div>
                  <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:".08em", marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slide dots + admin button */}
        <div style={{ position:"absolute", bottom:16, left:0, right:0, display:"flex", alignItems:"center", justifyContent:"center", gap:12, zIndex:3 }}>
          <div style={{ display:"flex", gap:6 }}>
            {SLIDES.map((_,i) => (
              <button key={i} className="slide-dot" onClick={() => setSlideIdx(i)}
                style={{ background: i===slideIdx ? "#FF7A29" : "rgba(255,255,255,0.25)", width: i===slideIdx ? 32 : 20 }} />
            ))}
          </div>
          <div style={{ width:1, height:16, background:"rgba(255,255,255,0.15)" }} />
          {/* Admin: Add Banner (concept button) */}
          <button onClick={() => alert("Admin banner upload — connect to CMS/backend")}
            style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:2, color:"rgba(255,255,255,0.5)", fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:10, letterSpacing:".08em", padding:"5px 12px", cursor:"pointer", textTransform:"uppercase" }}>
            + Add Banner
          </button>
        </div>
      </section>

      {/* ── PHASE 1 URGENT STRIP ── */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(135deg,#C94E0E,#FF7A29,#E8611A)", backgroundSize:"300% 300%", animation:"gradShift 4s ease infinite", padding:"clamp(32px,5vw,48px) 0", position:"relative" }}>
          <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(135deg,transparent,transparent 20px,rgba(0,0,0,0.06) 20px,rgba(0,0,0,0.06) 40px)", animation:"diagonalMove 2s linear infinite" }} />
          <div className="wrap" style={{ position:"relative", zIndex:1, textAlign:"center" }}>
            <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"clamp(20px,4vw,36px)", color:"#fff", marginBottom:8, textTransform:"uppercase" }}>⚡ PHASE 1 TRIALS NOW OPEN</div>
            <div style={{ fontFamily:"Inter,sans-serif", fontSize:"clamp(14px,2vw,16px)", color:"rgba(255,255,255,0.9)", marginBottom:24, lineHeight:1.5 }}>Send your 2-min video. BCCI-certified scouts review in 7 days.</div>
            <div style={{ display:"flex", justifyContent:"center", flexWrap:"wrap", gap:10, marginBottom:16 }}>
              <div style={{ background:"rgba(0,0,0,0.22)", border:"1px solid rgba(255,255,255,0.22)", borderRadius:2, padding:"10px 18px", fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:13, color:"#fff" }}>🏏 Bat / 🎳 Bowl / 🧤 WK — <span style={{ color:"#FFE8A0" }}>₹299</span></div>
              <div style={{ background:"rgba(0,0,0,0.22)", border:"1px solid rgba(255,255,255,0.22)", borderRadius:2, padding:"10px 18px", fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:13, color:"#fff" }}>⭐ All-Rounder — <span style={{ color:"#FFE8A0" }}>₹399</span></div>
            </div>
            <div style={{ fontFamily:"Inter,sans-serif", fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:24 }}>If selected for Phase 2 — pay only then (₹2,000 / ₹3,000). No upfront commitment.</div>
            <button style={{ background:"#060C18", border:"2px solid rgba(255,255,255,0.3)", borderRadius:2, color:"#fff", fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:14, letterSpacing:".06em", padding:"14px 32px", cursor:"pointer", textTransform:"uppercase" }}>REGISTER NOW →</button>
          </div>
        </div>
      </section>

      {/* ══ HOW THE TRIAL WORKS (grid, NO scroll) ══ */}
      <section style={{ padding:"clamp(60px,8vw,80px) 0", background:"#06101E" }}>
        <div className="wrap">
          <div className="section-label">Process</div>
          <h2 className="section-title" style={{ fontSize:"clamp(22px,4vw,40px)", color:"#fff", marginBottom:8, textTransform:"uppercase" }}>HOW THE TRIAL WORKS</h2>
          <p style={{ fontFamily:"Inter,sans-serif", color:"rgba(255,255,255,0.45)", marginBottom:40, fontSize:15 }}>Your journey from office to stadium — 6 clear steps.</p>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
            {STEPS.map((step) => (
              <div key={step.num} className={`step-card${step.active ? " active-step" : ""}`} style={{ borderTop:`3px solid ${step.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:14, color:step.active ? "#fff" : step.color, background:step.active ? "#FF7A29" : step.phase==="FINAL" ? "#22C55E" : step.phase==="P2" ? `${step.color}18` : `${step.color}14`, border:`2px solid ${step.color}`, flexShrink:0, animation:step.active ? "pulseOrange 2s infinite" : "none" }}>{step.num}</div>
                  <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:9, padding:"2px 7px", borderRadius:2, background:step.phase==="P1" ? "rgba(255,122,41,0.12)" : step.phase==="P2" ? "rgba(232,178,61,0.12)" : "rgba(34,197,94,0.12)", color:step.phase==="P1" ? "#FF7A29" : step.phase==="P2" ? "#E8B23D" : "#22C55E", letterSpacing:".08em" }}>{step.phase}</span>
                </div>
                <div style={{ fontSize:24 }}>{step.icon}</div>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:13, color:step.active ? "#FF7A29" : "rgba(255,255,255,0.85)", letterSpacing:".02em", lineHeight:1.2 }}>{step.label}</div>
                <div style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.4 }}>{step.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SEASON 5 ROADMAP ══ */}
      <section style={{ padding:"clamp(60px,8vw,80px) 0", background:"#060C18" }}>
        <div className="wrap">
          <div className="section-label">Timeline</div>
          <h2 className="section-title" style={{ fontSize:"clamp(22px,4vw,40px)", color:"#fff", marginBottom:8, textTransform:"uppercase" }}>SEASON 5 ROADMAP</h2>
          <p style={{ fontFamily:"Inter,sans-serif", color:"rgba(255,255,255,0.45)", marginBottom:36, fontSize:15 }}>From registration to the final — your complete season journey.</p>
          <div style={{ display:"flex", alignItems:"stretch", overflowX:"auto", paddingBottom:8, gap:0 }}>
            {ROADMAP.map((block,i) => (
              <React.Fragment key={i}>
                <div className={`roadmap-block${block.active ? " active" : ""}`} style={{ borderTop:`3px solid ${block.statusColor}` }}>
                  <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:".08em", marginBottom:8, textTransform:"uppercase" }}>{block.dates}</div>
                  <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:17, color:"#fff", textTransform:"uppercase", marginBottom:10 }}>{block.milestone}</div>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:block.active ? "rgba(255,122,41,0.1)" : "rgba(255,255,255,0.05)", border:`1px solid ${block.active ? "rgba(255,122,41,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius:2, padding:"4px 10px", marginBottom:12 }}>
                    {block.active && <span style={{ width:6, height:6, borderRadius:"50%", background:"#FF7A29", display:"inline-block", animation:"liveBlip 1.2s infinite" }} />}
                    <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, color:block.statusColor, letterSpacing:".1em" }}>{block.status}</span>
                  </div>
                  <div style={{ fontFamily:"Inter,sans-serif", fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.5, marginBottom:block.cta ? 14 : 0 }}>{block.desc}</div>
                  {block.cta && <button className="btn-orange" style={{ fontSize:11, padding:"8px 16px" }}>{block.cta}</button>}
                </div>
                {i < ROADMAP.length-1 && <div style={{ width:32, height:2, background:"rgba(255,255,255,0.1)", alignSelf:"center", flexShrink:0, position:"relative" }}><span style={{ position:"absolute", right:-6, top:-7, color:"rgba(255,255,255,0.2)", fontSize:10 }}>▶</span></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ══ THE 10 FRANCHISE TEAMS (with real logos) ══ */}
      <section style={{ padding:"clamp(60px,8vw,80px) 0", background:"#06101E" }}>
        <div className="wrap">
          <div className="section-label">Franchises</div>
          <h2 className="section-title" style={{ fontSize:"clamp(22px,4vw,40px)", color:"#fff", marginBottom:8, textTransform:"uppercase" }}>THE 10 FRANCHISE TEAMS</h2>
          <p style={{ fontFamily:"Inter,sans-serif", color:"rgba(255,255,255,0.45)", marginBottom:36, fontSize:15 }}>Choose your allegiance. One of these will be your home.</p>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
            {TEAMS.map(team => (
              <div key={team.name} className="team-card" style={{ borderTop:`3px solid ${team.color}` }}>
                {/* Watermark logo bg */}
                <img src={team.logo} alt={team.name}
                  style={{ position:"absolute", right:"-8%", bottom:"-8%", width:"80%", height:"80%", objectFit:"contain", opacity:0.06, pointerEvents:"none", filter:"grayscale(30%)" }} />
                {/* Color glow corner */}
                <div style={{ position:"absolute", top:0, right:0, width:80, height:80, background:`radial-gradient(circle at top right,${team.color}18 0%,transparent 70%)`, pointerEvents:"none" }} />

                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", position:"relative", zIndex:1 }}>
                  <div>
                    <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"clamp(13px,1.8vw,16px)", color:"#fff", letterSpacing:".01em", lineHeight:1.2, marginBottom:6 }}>{team.name}</div>
                    <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:11, color:team.color, letterSpacing:".08em", textTransform:"uppercase" }}>{team.city}</div>
                  </div>
                  {/* Logo badge */}
                  <div style={{ width:52, height:52, borderRadius:4, background:"#fff", padding:3, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 2px 12px ${team.color}33` }}>
                    <img src={team.logo} alt={team.name} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                  </div>
                </div>

                <div style={{ position:"relative", zIndex:1, marginTop:16 }}>
                  <div style={{ width:28, height:3, background:team.color, borderRadius:1 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ₹6 CRORE PRIZE POOL ══ */}
      <section style={{ padding:"clamp(60px,8vw,80px) 0", background:"#060C18", textAlign:"center" }}>
        <div className="wrap">
          <div className="section-label" style={{ justifyContent:"center" }}>Season 5</div>
          <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"clamp(56px,12vw,120px)", lineHeight:1, marginBottom:8 }}>
            <span className="shimmer-gold">₹6 CRORE</span>
          </div>
          <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"clamp(16px,3vw,26px)", color:"#fff", textTransform:"uppercase", letterSpacing:".1em", marginBottom:12 }}>SEASON 5 PRIZE POOL</div>
          <p style={{ fontFamily:"Inter,sans-serif", color:"rgba(255,255,255,0.45)", fontSize:15, marginBottom:48 }}>The biggest prize pool in corporate cricket history.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, textAlign:"left" }}>
            {[{v:"4",l:"Seasons Completed"},{v:"400+",l:"Players Auctioned"},{v:"₹14 Cr+",l:"Total Prize Distributed"},{v:"21",l:"Trial Cities"}].map(s => (
              <div key={s.l} className="stat-box" style={{ textAlign:"center", padding:"24px 18px" }}>
                <div className="stat-val" style={{ fontSize:"clamp(24px,4vw,36px)" }}>{s.v}</div>
                <div className="stat-lbl" style={{ marginTop:8 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AMBASSADOR — SOURAV GANGULY (with real photo) ══ */}
      <section style={{ padding:"clamp(60px,8vw,80px) 0", background:"#06101E", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 80% at 100% 50%,rgba(232,178,61,0.05) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div className="wrap" style={{ position:"relative", zIndex:1 }}>
          <div className="section-label">Brand Ambassador</div>
          <h2 className="section-title" style={{ fontSize:"clamp(20px,3.5vw,36px)", color:"#fff", marginBottom:8, textTransform:"uppercase" }}>BACKED BY INDIA'S GREATEST MATCH-WINNER</h2>
          <p style={{ fontFamily:"Inter,sans-serif", color:"rgba(255,255,255,0.4)", marginBottom:40, fontSize:15 }}>Sourav Ganguly · The Prince of Kolkata · BCPL Brand Ambassador</p>

          {/* 2-col: quote + photo */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:24 }}>
            <div>
              {/* Quote card */}
              <div className="card" style={{ borderLeft:"4px solid #E8B23D", padding:"clamp(24px,4vw,40px) clamp(20px,3vw,36px)", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:-16, right:8, fontSize:100, opacity:0.04, fontFamily:"Georgia,serif", lineHeight:1, userSelect:"none" }}>"</div>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, letterSpacing:".12em", color:"#E8B23D", textTransform:"uppercase", marginBottom:16 }}>Brand Ambassador · BCPL T20 Season 5</div>
                <blockquote style={{ fontFamily:"Inter,sans-serif", fontSize:"clamp(15px,2vw,19px)", lineHeight:1.72, color:"rgba(255,255,255,0.85)", fontStyle:"italic", marginBottom:28, borderLeft:"none", padding:0 }}>
                  "Cricket is not just a sport — it is a way of life. BCPL gives every corporate professional the chance to live that dream. From offices to stadiums, this is where champions are made."
                </blockquote>
                <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  {/* Ganguly photo avatar */}
                  <div style={{ width:56, height:56, borderRadius:2, overflow:"hidden", border:"2px solid #E8B23D", flexShrink:0 }}>
                    <img src={G} alt="Sourav Ganguly" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top center" }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  </div>
                  <div>
                    <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:17, color:"#E8B23D" }}>Sourav Ganguly</div>
                    <div style={{ fontFamily:"Inter,sans-serif", fontSize:13, color:"rgba(255,255,255,0.4)" }}>The Prince of Kolkata · Ex-BCCI President · Season 5 Ambassador</div>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:10, marginTop:14 }}>
                {[
                  { icon:"🏆", label:"Former India Captain", sub:"Led India to No.1 ODI ranking" },
                  { icon:"📜", label:"Ex-BCCI President",    sub:"Governed Indian cricket 2019–22" },
                  { icon:"🎯", label:"BCPL Champion",         sub:"Believes in grassroots cricket" },
                ].map(b => (
                  <div key={b.label} style={{ background:"rgba(232,178,61,0.05)", border:"1px solid rgba(232,178,61,0.15)", borderRadius:2, padding:"14px 16px" }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>{b.icon}</div>
                    <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:12, color:"#E8B23D", marginBottom:3 }}>{b.label}</div>
                    <div style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:"rgba(255,255,255,0.45)" }}>{b.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ REGISTRATION CTA ══ */}
      <section style={{ padding:"clamp(60px,8vw,80px) 0", background:"#060C18" }}>
        <div className="wrap">
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <div className="section-label" style={{ justifyContent:"center" }}>Register Now</div>
            <h2 className="section-title" style={{ fontSize:"clamp(22px,4vw,46px)", color:"#fff", marginBottom:10, textTransform:"uppercase" }}>YOUR SHOT AT THE BIG LEAGUE</h2>
            <p style={{ fontFamily:"Inter,sans-serif", color:"rgba(255,255,255,0.45)", fontSize:15 }}>Season 5 is calling. Pick your role. Start your journey.</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:12, marginBottom:32 }}>
            {[
              { emoji:"🏏", role:"Batsman",        p1:"₹299", p2:"₹2,000", premium:false },
              { emoji:"🎳", role:"Bowler",          p1:"₹299", p2:"₹2,000", premium:false },
              { emoji:"🧤", role:"Wicket-Keeper",   p1:"₹299", p2:"₹2,000", premium:false },
              { emoji:"⭐", role:"All-Rounder",      p1:"₹399", p2:"₹3,000", premium:true  },
            ].map(r => (
              <div key={r.role} className="pricing-card" style={{ borderTop:r.premium ? "3px solid #E8B23D" : "3px solid rgba(255,122,41,0.35)" }}>
                <div style={{ fontSize:30, marginBottom:10 }}>{r.emoji}</div>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:14, color:"#fff", marginBottom:4, textTransform:"uppercase" }}>{r.role}</div>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:28, color:r.premium ? "#E8B23D" : "#FF7A29", marginBottom:4 }}>{r.p1}</div>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:".06em", textTransform:"uppercase" }}>Phase 1 Entry</div>
                <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:"rgba(255,255,255,0.35)", lineHeight:1.5 }}>
                    Phase 2: {r.p2}<br/>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.22)" }}>Only if selected</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign:"center" }}>
            <button className="btn-orange" style={{ fontSize:16, padding:"18px 48px" }}>REGISTER NOW — SEASON 5 →</button>
            <div style={{ fontFamily:"Inter,sans-serif", fontSize:13, color:"rgba(255,255,255,0.28)", marginTop:14 }}>If selected for Phase 2, pay only then. No hidden charges.</div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background:"#060C18", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"clamp(40px,6vw,60px) 0 0" }}>
        <div className="wrap">
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", gap:36, marginBottom:44 }}>
            <div style={{ minWidth:200 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:2, marginBottom:8 }}>
                <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:24, color:"#FF7A29" }}>BCPL</span>
                <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:24, color:"#fff" }}>T20</span>
              </div>
              <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:11, color:"#E8B23D", letterSpacing:".12em", textTransform:"uppercase", marginBottom:10 }}>#OfficeSeStadiumtak</div>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:13, color:"rgba(255,255,255,0.3)", lineHeight:1.6 }}>India's biggest corporate cricket league.<br/>Season 5 · Kriparti Playing 11 Pvt. Ltd.</div>
            </div>
            {[
              { header:"League",  links:["About","Teams","Sponsors","Schedule"] },
              { header:"Help",    links:["FAQ","Contact","Eligibility Criteria","Cricket Rulebook"] },
              { header:"Legal",   links:["Terms","Privacy","Refunds","Code of Conduct"] },
            ].map(col => (
              <div key={col.header}>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, letterSpacing:".12em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:14 }}>{col.header}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {col.links.map(l => <a key={l} href="#" className="footer-link">{l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"20px 0", display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"center", gap:12 }}>
            <span style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:"rgba(255,255,255,0.22)" }}>Season 5 · Kriparti Playing 11 Pvt. Ltd. · © 2026 · All Rights Reserved</span>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:11, letterSpacing:".1em", color:"#FF7A29" }}>#OfficeSeStadiumtak</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
