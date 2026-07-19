import React, { useState, useEffect } from "react";

export function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState({ days: 3, hrs: 14, min: 22, sec: 45 });

  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + 3);
    target.setHours(18, 0, 0, 0);
    const tick = setInterval(() => {
      const now = Date.now();
      const diff = target.getTime() - now;
      if (diff <= 0) { clearInterval(tick); return; }
      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const min = Math.floor((diff % 3600000) / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setCountdown({ days, hrs, min, sec });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const navLinks = ["Home","Match Center","Teams","Sponsors","Photos","Videos","About","FAQ","Contact"];
  const teams = [
    { emoji:"🗼", name:"Delhi Dynamos", city:"Delhi", color:"#3B82F6" },
    { emoji:"🌊", name:"Mumbai Mavericks", city:"Mumbai", color:"#06B6D4" },
    { emoji:"🐆", name:"Pune Panthers", city:"Pune", color:"#8B5CF6" },
    { emoji:"♟️", name:"Kolkata Knights", city:"Kolkata", color:"#F59E0B" },
    { emoji:"🦁", name:"Ahmedabad Lions", city:"Ahmedabad", color:"#EF4444" },
    { emoji:"🐂", name:"Bangalore Bulls", city:"Bangalore", color:"#10B981" },
    { emoji:"🌶️", name:"Chennai Chiefs", city:"Chennai", color:"#F97316" },
    { emoji:"🦅", name:"Hyderabad Hawks", city:"Hyderabad", color:"#6366F1" },
    { emoji:"🐅", name:"Jaipur Jaguars", city:"Jaipur", color:"#EC4899" },
    { emoji:"👑", name:"Lucknow Nawabs", city:"Lucknow", color:"#A78BFA" },
  ];
  const standings = [
    { rank:1, emoji:"🐂", name:"Bangalore Bulls", p:8, w:7, l:1, pts:14, nrr:"+1.56", group:"B" },
    { rank:2, emoji:"🌊", name:"Mumbai Mavericks", p:8, w:6, l:2, pts:12, nrr:"+1.24", group:"A" },
    { rank:3, emoji:"🗼", name:"Delhi Dynamos", p:8, w:5, l:3, pts:10, nrr:"+0.87", group:"A" },
    { rank:4, emoji:"🐆", name:"Pune Panthers", p:8, w:5, l:3, pts:10, nrr:"+0.43", group:"A" },
  ];
  const results = [
    { round:"RR4", date:"Jul 20", t1:"DEL", s1:"187/4", t2:"BLR", s2:"165/8", result:"DEL WON", mom:"A. Kumar 87(54)" },
    { round:"RR4", date:"Jul 19", t1:"PUN", s1:"143/7", t2:"KOL", s2:"139/9", result:"PUN WON", mom:"S. Mehta 45(32)+3wkts" },
    { round:"RR3", date:"Jul 18", t1:"AHM", s1:"201/3", t2:"CHN", s2:"178/6", result:"AHM WON", mom:"R. Singh 78(48)" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        body { background:#060E1C; font-family:Inter,sans-serif; color:#F8F4EE; overflow-x:hidden; }
        .wrap { max-width:1280px; margin:0 auto; padding:0 20px; }
        .desk-nav { display:none; align-items:center; gap:22px; }
        .ham-btn { display:flex; flex-direction:column; gap:5px; cursor:pointer; padding:8px; background:transparent; border:none; }
        .ham-bar { width:24px; height:2px; background:#F8F4EE; border-radius:2px; transition:all 0.3s ease; display:block; }
        .ham-bar.open-0 { transform:rotate(45deg) translate(5px,5px); }
        .ham-bar.open-1 { transform:scaleX(0); opacity:0; }
        .ham-bar.open-2 { transform:rotate(-45deg) translate(5px,-5px); }
        .bot-cta { display:flex; }
        @media(min-width:768px){ .wrap{padding:0 32px;} }
        @media(min-width:1024px){ .desk-nav{display:flex!important;} .ham-btn{display:none!important;} .bot-cta{display:none!important;} }

        .btn-fire { background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%); border:none; border-radius:14px; color:#fff; font-family:Montserrat,sans-serif; font-weight:800; cursor:pointer; box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2); transition:transform 0.15s,box-shadow 0.2s; letter-spacing:0.02em; animation:pulseGlow 3s ease-in-out infinite; }
        .btn-fire:hover { transform:translateY(-2px); box-shadow:0 14px 40px rgba(255,122,41,0.6); }
        .btn-fire:active { transform:scale(0.97); }
        .btn-wa { background:linear-gradient(135deg,#25D366,#1BA851); border:none; border-radius:14px; color:#fff; font-weight:700; cursor:pointer; font-family:Montserrat,sans-serif; transition:transform 0.15s; }
        .btn-wa:hover { transform:translateY(-2px); }
        .glass-card { background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85)); backdrop-filter:blur(32px); border:1px solid rgba(255,255,255,0.09); border-radius:20px; box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06); }
        .shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
        .tag-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,122,41,0.12); border:1px solid rgba(255,122,41,0.3); border-radius:100px; padding:5px 14px; font-size:11px; font-weight:700; font-family:Montserrat,sans-serif; color:#FF7A29; letter-spacing:0.1em; }
        .inp { width:100%; background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.1); border-radius:14px; color:#F8F4EE; padding:15px 18px; font-family:Inter,sans-serif; font-size:15px; outline:none; transition:all 0.25s; appearance:none; }
        .inp:focus { border-color:#FF7A29; background:rgba(255,122,41,0.06); box-shadow:0 0 0 4px rgba(255,122,41,0.12); }
        .inp::placeholder { color:rgba(255,255,255,0.28); }
        .lbl { font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-bottom:8px; display:block; }
        .section-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(255,122,41,0.1); border:1px solid rgba(255,122,41,0.25); border-radius:100px; padding:6px 16px; font-size:11px; font-weight:800; font-family:Montserrat,sans-serif; color:#FF7A29; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:16px; }
        .section-title { font-family:Montserrat,sans-serif; font-weight:900; line-height:1.05; }
        .divider-v { width:1px; height:20px; background:rgba(255,255,255,0.18); display:inline-block; margin:0 14px; vertical-align:middle; }

        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes floatUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4),0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2)} 50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3),inset 0 1px 0 rgba(255,255,255,0.2)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes tickerMove { from{transform:translateX(100%)} to{transform:translateX(-200%)} }
        @keyframes scanPulse { 0%,100%{opacity:0.03} 50%{opacity:0.08} }
        @keyframes liveBlip { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes floatParticle { 0%{transform:translateY(0) rotate(0deg);opacity:0.4} 50%{opacity:0.8} 100%{transform:translateY(-80px) rotate(180deg);opacity:0} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes borderGlow { 0%,100%{border-color:rgba(255,122,41,0.3)} 50%{border-color:rgba(255,122,41,0.8)} }
        @keyframes countUp { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
        @keyframes mobileMenuIn { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes heroIn { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes priceCardIn { from{opacity:0;transform:translateX(40px) scale(0.95)} to{opacity:1;transform:translateX(0) scale(1)} }
      `}</style>

      {/* AMBIENT BACKGROUND */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
        {/* Radial gradients */}
        <div style={{
          position:"absolute", inset:0,
          background:"radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)"
        }} />
        {/* Stadium SVG */}
        <svg style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"70%", opacity:0.07 }} viewBox="0 0 1280 500" preserveAspectRatio="xMidYMax meet">
          {/* Stands curve */}
          <path d="M0,500 Q640,80 1280,500 Z" fill="#4A6FA5" />
          <path d="M80,500 Q640,140 1200,500 Z" fill="#2D4A7A" />
          {/* Pitch rectangle */}
          <rect x="580" y="300" width="120" height="180" rx="4" fill="none" stroke="#8BAB6A" strokeWidth="2" />
          <rect x="595" y="310" width="90" height="160" rx="2" fill="none" stroke="#8BAB6A" strokeWidth="1" opacity="0.6" />
          {/* Floodlight poles */}
          <line x1="120" y1="500" x2="120" y2="60" stroke="#6B8CAE" strokeWidth="6" />
          <rect x="100" y="55" width="40" height="10" rx="3" fill="#6B8CAE" />
          <line x1="1160" y1="500" x2="1160" y2="60" stroke="#6B8CAE" strokeWidth="6" />
          <rect x="1140" y="55" width="40" height="10" rx="3" fill="#6B8CAE" />
          {/* Floodlight beams */}
          {[...Array(5)].map((_,i) => (
            <line key={i} x1="120" y1="60" x2={400+i*100} y2="300" stroke="rgba(255,255,200,0.3)" strokeWidth="1" />
          ))}
          {[...Array(5)].map((_,i) => (
            <line key={i} x1="1160" y1="60" x2={900-i*100} y2="300" stroke="rgba(255,255,200,0.3)" strokeWidth="1" />
          ))}
          {/* Crowd dots */}
          {[...Array(40)].map((_,i) => (
            <circle key={i} cx={160+i*24} cy={360+(i%3)*18} r="4" fill={i%3===0?"#FF7A29":i%3===1?"#3B82F6":"#E8B23D"} opacity="0.5" />
          ))}
        </svg>
        {/* 8 floating particles */}
        {[
          { left:"8%", top:"20%", color:"#FF7A29", delay:"0s", dur:"6s" },
          { left:"18%", top:"65%", color:"#E8B23D", delay:"1s", dur:"8s" },
          { left:"35%", top:"45%", color:"rgba(255,255,255,0.6)", delay:"2s", dur:"7s" },
          { left:"55%", top:"75%", color:"#FF7A29", delay:"0.5s", dur:"9s" },
          { left:"68%", top:"30%", color:"#E8B23D", delay:"1.5s", dur:"6.5s" },
          { left:"78%", top:"60%", color:"rgba(255,255,255,0.6)", delay:"3s", dur:"7.5s" },
          { left:"88%", top:"40%", color:"#FF7A29", delay:"2.5s", dur:"8.5s" },
          { left:"92%", top:"80%", color:"#E8B23D", delay:"4s", dur:"6s" },
        ].map((p, i) => (
          <div key={i} style={{
            position:"absolute", left:p.left, top:p.top,
            width:"3px", height:"3px", borderRadius:"50%", background:p.color,
            animation:`floatParticle ${p.dur} ${p.delay} ease-in-out infinite`
          }} />
        ))}
        {/* Scanline overlay */}
        <div style={{
          position:"absolute", inset:0,
          background:"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
          animation:"scanPulse 4s ease-in-out infinite"
        }} />
      </div>

      {/* ANNOUNCEMENT BAR */}
      <div style={{
        position:"relative", zIndex:10,
        background:"linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)",
        backgroundSize:"300% 100%",
        animation:"gradShift 4s ease infinite",
        color:"#fff", padding:"11px 20px", textAlign:"center",
        fontSize:"13px", fontWeight:700, fontFamily:"Montserrat,sans-serif", letterSpacing:"0.04em",
        display:"flex", alignItems:"center", justifyContent:"center", gap:0, flexWrap:"wrap"
      }}>
        <span>🏏 SEASON 5 TRIALS LIVE — Register before spots close</span>
        <span className="divider-v" />
        <span>Spots filling fast in 75 cities across India</span>
        <span className="divider-v" />
        <span>⚡ #OfficeSeStadiumtak</span>
      </div>

      {/* NAVBAR */}
      <nav style={{
        position:"sticky", top:0, zIndex:200,
        background:"rgba(6,14,28,0.96)", backdropFilter:"blur(24px)",
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        boxShadow:"0 1px 0 0 rgba(255,122,41,0.25)"
      }}>
        <div className="wrap" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:"64px" }}>
          {/* Logo */}
          <a href="#" style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"22px", color:"#FF7A29", letterSpacing:"-0.02em" }}>BCPL</span>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"22px", color:"#fff", letterSpacing:"-0.02em" }}>T20</span>
            <span style={{ fontSize:"10px", color:"rgba(255,122,41,0.7)", fontWeight:700, fontFamily:"Montserrat,sans-serif", letterSpacing:"0.08em", marginLeft:"4px", background:"rgba(255,122,41,0.1)", border:"1px solid rgba(255,122,41,0.25)", borderRadius:"6px", padding:"2px 7px" }}>SEASON 5</span>
          </a>
          {/* Desktop nav */}
          <div className="desk-nav">
            {navLinks.map(l => (
              <a key={l} href="#" style={{ color:"rgba(255,255,255,0.7)", textDecoration:"none", fontSize:"13px", fontWeight:600, fontFamily:"Montserrat,sans-serif", letterSpacing:"0.02em", transition:"color 0.2s" }}
                onMouseEnter={e=>(e.currentTarget.style.color="#FF7A29")}
                onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.7)")}
              >{l}</a>
            ))}
            <button className="btn-fire" style={{ padding:"10px 22px", fontSize:"13px", borderRadius:"12px" }}>Register ₹299</button>
          </div>
          {/* Hamburger */}
          <button className="ham-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span className={`ham-bar${menuOpen?" open-0":""}`} />
            <span className={`ham-bar${menuOpen?" open-1":""}`} />
            <span className={`ham-bar${menuOpen?" open-2":""}`} />
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            position:"fixed", inset:0, top:"64px", zIndex:199,
            background:"#06101E", display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", gap:"28px", animation:"mobileMenuIn 0.3s ease"
          }}>
            {navLinks.map(l => (
              <a key={l} href="#" onClick={() => setMenuOpen(false)} style={{ color:"rgba(255,255,255,0.85)", textDecoration:"none", fontSize:"22px", fontWeight:800, fontFamily:"Montserrat,sans-serif" }}>{l}</a>
            ))}
            <button className="btn-fire" style={{ padding:"16px 40px", fontSize:"17px", marginTop:"16px" }}>Register ₹299 →</button>
          </div>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ position:"relative", zIndex:1 }}>

        {/* ── HERO SECTION ── */}
        <section style={{ position:"relative", minHeight:"92vh", display:"flex", alignItems:"center", overflow:"hidden", padding:"60px 0 80px" }}>
          {/* Hero stadium SVG bg */}
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.05, pointerEvents:"none" }} viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid slice">
            <path d="M0,800 Q640,200 1280,800 Z" fill="#4A6FA5" />
            <path d="M0,800 Q640,300 1280,800 Z" fill="#2D4A7A" />
            {/* Floodlight beams from corners */}
            {[...Array(6)].map((_,i) => <line key={i} x1="0" y1="0" x2={300+i*80} y2="800" stroke="rgba(255,255,200,0.4)" strokeWidth="1.5" />)}
            {[...Array(6)].map((_,i) => <line key={i} x1="1280" y1="0" x2={980-i*80} y2="800" stroke="rgba(255,255,200,0.4)" strokeWidth="1.5" />)}
          </svg>

          <div className="wrap" style={{ width:"100%", display:"flex", flexWrap:"wrap", gap:"48px", alignItems:"center", justifyContent:"space-between" }}>
            {/* Left: hero text */}
            <div style={{ flex:"1 1 340px", maxWidth:"620px", animation:"heroIn 0.8s ease both" }}>
              {/* Live pill */}
              <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:"100px", padding:"6px 14px", marginBottom:"28px" }}>
                <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"liveBlip 1.2s ease-in-out infinite" }} />
                <span style={{ fontSize:"11px", fontWeight:800, fontFamily:"Montserrat,sans-serif", color:"#22C55E", letterSpacing:"0.1em" }}>PHASE 1 TRIALS OPEN</span>
              </div>

              <h1 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, lineHeight:1.02, marginBottom:"24px" }}>
                <span style={{ display:"block", fontSize:"clamp(40px,8vw,80px)", color:"#fff", letterSpacing:"-0.03em" }}>YOUR CRICKET</span>
                <span style={{ display:"block", fontSize:"clamp(40px,8vw,80px)", color:"#fff", letterSpacing:"-0.03em" }}>DREAM</span>
                <span className="shimmer-gold" style={{ display:"block", fontSize:"clamp(40px,8vw,80px)", letterSpacing:"-0.03em" }}>ISN'T OVER.</span>
              </h1>

              <p style={{ fontSize:"clamp(15px,2vw,18px)", color:"rgba(255,255,255,0.65)", lineHeight:1.7, marginBottom:"32px", maxWidth:"520px" }}>
                Job, family, no time to play — life got in the way. This is your real trial.<br />
                <strong style={{ color:"#FF7A29" }}>Send one video. That's it.</strong>
              </p>

              {/* Trust badges */}
              <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:"8px", marginBottom:"36px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:"10px", padding:"8px 14px" }}>
                  <span style={{ fontSize:"15px" }}>✅</span>
                  <span style={{ fontSize:"12px", fontWeight:700, fontFamily:"Montserrat,sans-serif", color:"rgba(255,255,255,0.8)" }}>5,000+ professionals registered</span>
                </div>
                <span className="divider-v" style={{ height:"28px" }} />
                <div style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(232,178,61,0.08)", border:"1px solid rgba(232,178,61,0.2)", borderRadius:"10px", padding:"8px 14px" }}>
                  <span style={{ fontSize:"15px" }}>⭐</span>
                  <span style={{ fontSize:"12px", fontWeight:700, fontFamily:"Montserrat,sans-serif", color:"rgba(255,255,255,0.8)" }}>Trusted since 2020</span>
                </div>
              </div>

              {/* Main CTA */}
              <button className="btn-fire" style={{ width:"100%", maxWidth:"400px", height:"60px", fontSize:"18px", display:"block", marginBottom:"18px" }}>
                🏏 Register for Season 5 — ₹299 →
              </button>

              {/* Secondary buttons */}
              <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
                <a href="tel:+918000000000" style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 20px", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"12px", color:"rgba(255,255,255,0.75)", textDecoration:"none", fontSize:"14px", fontWeight:600, fontFamily:"Montserrat,sans-serif", transition:"all 0.2s", backdropFilter:"blur(8px)" }}>📞 Call Us</a>
                <a href="https://wa.me/918000000000" style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 20px", background:"rgba(37,211,102,0.12)", border:"1px solid rgba(37,211,102,0.25)", borderRadius:"12px", color:"#25D366", textDecoration:"none", fontSize:"14px", fontWeight:700, fontFamily:"Montserrat,sans-serif", transition:"all 0.2s" }}>💬 WhatsApp</a>
              </div>
            </div>

            {/* Right: floating price card */}
            <div style={{ flex:"0 1 320px", animation:"priceCardIn 1s 0.3s ease both" }}>
              <div className="glass-card" style={{ padding:"32px", animation:"borderGlow 3s ease-in-out infinite", border:"1px solid rgba(255,122,41,0.4)" }}>
                {/* Chip */}
                <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:"rgba(255,122,41,0.12)", border:"1px solid rgba(255,122,41,0.3)", borderRadius:"100px", padding:"5px 14px", fontSize:"10px", fontWeight:800, fontFamily:"Montserrat,sans-serif", color:"#FF7A29", letterSpacing:"0.1em", marginBottom:"24px" }}>
                  <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"liveBlip 1.2s ease-in-out infinite" }} />
                  PHASE 1 TRIALS OPEN
                </div>
                {/* Price */}
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"72px", color:"#FF7A29", lineHeight:1, marginBottom:"4px", animation:"countUp 3s ease-in-out infinite" }}>₹299</div>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.5)", marginBottom:"8px" }}>Bat · Bowl · Wicket-Keeper</div>
                <div style={{ fontSize:"13px", color:"#E8B23D", fontWeight:700, marginBottom:"24px", fontFamily:"Montserrat,sans-serif" }}>₹399 for All-Rounder</div>
                {/* Features */}
                {["BCCI-certified scout evaluation","Results in 15 working days","75 cities across India","Zero fee if selected"].map(f => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
                    <span style={{ width:"18px", height:"18px", borderRadius:"50%", background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", flexShrink:0 }}>✓</span>
                    <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.7)", fontWeight:500 }}>{f}</span>
                  </div>
                ))}
                <button className="btn-fire" style={{ width:"100%", height:"50px", fontSize:"15px", marginTop:"20px" }}>Register Now →</button>
              </div>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF TICKER ── */}
        <div style={{ background:"rgba(255,122,41,0.06)", borderTop:"1px solid rgba(255,122,41,0.15)", borderBottom:"1px solid rgba(255,122,41,0.15)", padding:"14px 0", overflow:"hidden", position:"relative" }}>
          <div style={{ whiteSpace:"nowrap", animation:"tickerMove 20s linear infinite", display:"inline-block" }}>
            {["🏏 Rahul S. from Pune just registered","🎳 Priya M. shortlisted by DEL Dynamos","⭐ 23 people registering right now","🏆 Arjun K. playing for Delhi Dynamos","🧤 WK slots filling fast in Mumbai","✅ Ravi T. confirmed for Hyderabad trials","🏏 Suresh B. from Chennai just registered","🎳 Ankit P. shortlisted by BLR Bulls"].map((t,i) => (
              <span key={i} style={{ fontSize:"13px", color:"rgba(255,255,255,0.75)", fontWeight:600, fontFamily:"Montserrat,sans-serif", marginRight:"60px" }}>
                {t}
                <span style={{ color:"rgba(255,122,41,0.4)", marginLeft:"60px" }}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding:"96px 0" }}>
          <div className="wrap">
            <div style={{ textAlign:"center", marginBottom:"64px" }}>
              <div className="section-badge">THE PROCESS</div>
              <h2 className="section-title" style={{ fontSize:"clamp(32px,5vw,56px)", color:"#fff" }}>
                FROM OFFICE<br />
                <span className="shimmer-gold">TO STADIUM.</span>
              </h2>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"16px", marginTop:"16px", maxWidth:"480px", margin:"16px auto 0" }}>Four steps. No gatekeeping. Just cricket.</p>
            </div>
            {/* Steps */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0", position:"relative" }}>
              {[
                { num:"01", icon:"🏏", title:"Register", sub:"₹299 online, 2 minutes", desc:"Fill form, choose your role (Bat/Bowl/WK/AR), select city, pay securely." },
                { num:"02", icon:"🎬", title:"Upload Video", sub:"60-second showcase", desc:"Record yourself batting or bowling from your phone. No studio needed." },
                { num:"03", icon:"📋", title:"Get Evaluated", sub:"BCCI-certified scouts", desc:"Results within 15 working days. Fair. Merit-based. Completely transparent." },
                { num:"04", icon:"🏟️", title:"Play Live", sub:"Franchise auction + stadium", desc:"If selected, zero further fees. Ever. You play at premier venues across India." },
              ].map((step, i) => (
                <div key={i} style={{ flex:"1 1 220px", position:"relative", padding:"32px 24px", textAlign:"center" }}>
                  {/* Connector line (desktop) */}
                  {i < 3 && <div style={{ position:"absolute", top:"40px", right:"-1px", width:"2px", height:"calc(100% - 80px)", background:"rgba(255,122,41,0.15)", display:"none" }} />}
                  {/* Step number circle */}
                  <div style={{ width:"72px", height:"72px", borderRadius:"50%", background:"linear-gradient(135deg,#FF7A29,#E8611A)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", boxShadow:"0 8px 24px rgba(255,122,41,0.4)", position:"relative" }}>
                    <span style={{ fontSize:"28px" }}>{step.icon}</span>
                    <span style={{ position:"absolute", top:"-6px", right:"-6px", width:"24px", height:"24px", borderRadius:"50%", background:"#0A1628", border:"2px solid #FF7A29", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", fontWeight:900, fontFamily:"Montserrat,sans-serif", color:"#FF7A29" }}>{step.num}</span>
                  </div>
                  {/* Horizontal connector for desktop */}
                  {i < 3 && <div style={{ position:"absolute", top:"54px", right:0, width:"50%", height:"2px", background:"linear-gradient(90deg,rgba(255,122,41,0.4),transparent)", pointerEvents:"none" }} />}
                  <h3 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"20px", color:"#fff", marginBottom:"6px" }}>{step.title}</h3>
                  <div style={{ fontSize:"12px", color:"#FF7A29", fontWeight:700, fontFamily:"Montserrat,sans-serif", letterSpacing:"0.06em", marginBottom:"12px" }}>{step.sub}</div>
                  <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── NEXT MATCH WIDGET ── */}
        <section style={{ padding:"0 0 96px" }}>
          <div className="wrap">
            <div className="glass-card" style={{ padding:"36px", borderLeft:"4px solid #FF7A29", position:"relative", overflow:"hidden" }}>
              {/* Glow bg */}
              <div style={{ position:"absolute", top:0, right:0, width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle, rgba(255,122,41,0.06) 0%, transparent 70%)", pointerEvents:"none" }} />
              <div style={{ display:"flex", flexWrap:"wrap", gap:"32px", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:"rgba(255,122,41,0.1)", border:"1px solid rgba(255,122,41,0.25)", borderRadius:"8px", padding:"4px 12px", fontSize:"10px", fontWeight:800, fontFamily:"Montserrat,sans-serif", color:"#FF7A29", letterSpacing:"0.1em", marginBottom:"20px" }}>
                    🏏 NEXT MATCH
                  </div>
                  <h3 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"clamp(20px,3vw,32px)", color:"#fff", marginBottom:"12px" }}>
                    🌊 Mumbai Mavericks <span style={{ color:"#FF7A29" }}>vs</span> 🗼 Delhi Dynamos
                  </h3>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"16px", marginBottom:"24px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", color:"rgba(255,255,255,0.6)", fontSize:"13px", fontWeight:600 }}>
                      <span>📅</span> SAT, 26 JULY 2025 · 6:00 PM IST
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", color:"rgba(255,255,255,0.6)", fontSize:"13px", fontWeight:600 }}>
                      <span>📍</span> DY Patil Stadium, Mumbai
                    </div>
                  </div>
                  {/* Countdown */}
                  <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", marginBottom:"28px" }}>
                    {[
                      { val: countdown.days, label:"DAYS" },
                      { val: countdown.hrs, label:"HRS" },
                      { val: countdown.min, label:"MIN" },
                      { val: countdown.sec, label:"SEC" },
                    ].map(c => (
                      <div key={c.label} className="glass-card" style={{ padding:"16px 20px", textAlign:"center", minWidth:"70px", borderRadius:"14px" }}>
                        <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"28px", color:"#FF7A29", lineHeight:1 }}>{String(c.val).padStart(2,"0")}</div>
                        <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.4)", fontWeight:700, fontFamily:"Montserrat,sans-serif", letterSpacing:"0.1em", marginTop:"4px" }}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:"14px", flexWrap:"wrap" }}>
                    <button className="btn-fire" style={{ padding:"12px 24px", fontSize:"14px" }}>🔔 Set Reminder →</button>
                    <a href="#" style={{ display:"flex", alignItems:"center", color:"rgba(255,255,255,0.5)", textDecoration:"none", fontSize:"14px", fontWeight:600, fontFamily:"Montserrat,sans-serif", gap:"6px" }}>📆 Add to Calendar</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TEAMS CAROUSEL ── */}
        <section style={{ padding:"0 0 96px" }}>
          <div className="wrap" style={{ marginBottom:"36px" }}>
            <div className="section-badge">THE FRANCHISES</div>
            <h2 className="section-title" style={{ fontSize:"clamp(28px,4vw,48px)", color:"#fff" }}>
              TEN CITIES.<br />
              <span className="shimmer-gold">ONE DREAM.</span>
            </h2>
          </div>
          <div style={{ overflowX:"auto", paddingLeft:"20px", paddingBottom:"8px", display:"flex", gap:"14px", scrollbarWidth:"thin", scrollbarColor:"rgba(255,122,41,0.3) transparent" }}>
            {teams.map(team => (
              <div key={team.name} className="glass-card" style={{ minWidth:"200px", padding:"24px 20px", borderRadius:"20px", flexShrink:0, borderBottom:`3px solid ${team.color}`, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, right:0, width:"80px", height:"80px", borderRadius:"0 0 0 80px", background:`${team.color}10`, pointerEvents:"none" }} />
                <div style={{ fontSize:"36px", marginBottom:"12px" }}>{team.emoji}</div>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:"15px", color:"#fff", marginBottom:"4px" }}>{team.name}</div>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.45)", marginBottom:"12px" }}>{team.city}</div>
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", marginBottom:"12px" }}>12 Players · Qualified</div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:"5px", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:"8px", padding:"3px 10px", fontSize:"9px", fontWeight:800, fontFamily:"Montserrat,sans-serif", color:"#22C55E", letterSpacing:"0.08em", marginBottom:"14px" }}>
                  ● SEASON 5 ACTIVE
                </div>
                <a href="#" style={{ display:"block", fontSize:"12px", color:"#FF7A29", fontWeight:700, fontFamily:"Montserrat,sans-serif", textDecoration:"none" }}>View Squad →</a>
              </div>
            ))}
            <div style={{ minWidth:"20px", flexShrink:0 }} />
          </div>
        </section>

        {/* ── LIVE STANDINGS ── */}
        <section style={{ padding:"0 0 96px" }}>
          <div className="wrap">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px", marginBottom:"28px" }}>
              <div>
                <div className="section-badge">📊 LIVE STANDINGS</div>
                <h2 className="section-title" style={{ fontSize:"clamp(24px,3.5vw,40px)", color:"#fff" }}>TOP 4 TEAMS</h2>
              </div>
              <a href="#" style={{ color:"#FF7A29", textDecoration:"none", fontSize:"14px", fontWeight:700, fontFamily:"Montserrat,sans-serif" }}>View Full Standings →</a>
            </div>
            {/* Table header */}
            <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 40px 40px 40px 50px 60px", gap:"8px", padding:"10px 20px", fontSize:"10px", fontWeight:800, fontFamily:"Montserrat,sans-serif", color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
              <div>#</div><div>TEAM</div><div style={{textAlign:"center"}}>P</div><div style={{textAlign:"center"}}>W</div><div style={{textAlign:"center"}}>L</div><div style={{textAlign:"center"}}>PTS</div><div style={{textAlign:"center"}}>NRR</div>
            </div>
            {standings.map((s, i) => (
              <div key={s.name} className="glass-card" style={{ display:"grid", gridTemplateColumns:"40px 1fr 40px 40px 40px 50px 60px", gap:"8px", padding:"16px 20px", marginBottom:"10px", borderRadius:"16px", alignItems:"center", borderLeft:i===0?"3px solid #E8B23D":"3px solid transparent" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:i===0?"linear-gradient(135deg,#E8B23D,#FFD700)":"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:900, fontFamily:"Montserrat,sans-serif", color:i===0?"#0A1628":"rgba(255,255,255,0.5)" }}>{s.rank}</div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"18px" }}>{s.emoji}</span>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:800, fontFamily:"Montserrat,sans-serif", color:"#fff" }}>{s.name}</div>
                    <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontWeight:600 }}>GROUP {s.group}</div>
                  </div>
                </div>
                {[s.p, s.w, s.l].map((v,j)=>(
                  <div key={j} style={{ textAlign:"center", fontSize:"14px", fontWeight:700, fontFamily:"Montserrat,sans-serif", color:"rgba(255,255,255,0.6)" }}>{v}</div>
                ))}
                <div style={{ textAlign:"center", fontSize:"15px", fontWeight:900, fontFamily:"Montserrat,sans-serif", color:"#FF7A29" }}>{s.pts}</div>
                <div style={{ textAlign:"center", fontSize:"12px", fontWeight:700, fontFamily:"Montserrat,sans-serif", color:s.nrr.startsWith("+")?"#22C55E":"#E8493F" }}>{s.nrr}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RECENT RESULTS ── */}
        <section style={{ padding:"0 0 96px" }}>
          <div className="wrap">
            <div className="section-badge">🏆 RECENT RESULTS</div>
            <h2 className="section-title" style={{ fontSize:"clamp(24px,3.5vw,40px)", color:"#fff", marginBottom:"36px" }}>MATCH WRAP-UP</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"20px" }}>
              {results.map((r, i) => (
                <div key={i} className="glass-card" style={{ padding:"24px", borderRadius:"20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"16px" }}>
                    <span style={{ fontSize:"10px", fontWeight:800, fontFamily:"Montserrat,sans-serif", color:"rgba(255,255,255,0.35)", letterSpacing:"0.1em" }}>{r.round} · {r.date} JUL</span>
                    <span style={{ fontSize:"10px", fontWeight:800, fontFamily:"Montserrat,sans-serif", color:"#22C55E", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:"6px", padding:"2px 8px", letterSpacing:"0.06em" }}>WON</span>
                  </div>
                  <div style={{ marginBottom:"16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                      <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:"18px", color:"#fff" }}>{r.t1}</span>
                      <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"22px", color:"#FF7A29" }}>{r.s1}</span>
                    </div>
                    <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", marginBottom:"8px" }} />
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:"18px", color:"rgba(255,255,255,0.5)" }}>{r.t2}</span>
                      <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"22px", color:"rgba(255,255,255,0.45)" }}>{r.s2}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(232,178,61,0.08)", border:"1px solid rgba(232,178,61,0.2)", borderRadius:"10px", padding:"8px 12px" }}>
                    <span style={{ fontSize:"12px", color:"#E8B23D", fontWeight:700, fontFamily:"Montserrat,sans-serif" }}>⭐ MOM</span>
                    <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.65)", fontWeight:600 }}>{r.mom}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ELIGIBILITY QUICK CHECK ── */}
        <section style={{ padding:"80px 0", background:"rgba(10,22,40,0.8)", borderTop:"1px solid rgba(255,255,255,0.05)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div className="wrap" style={{ textAlign:"center" }}>
            <div className="section-badge">ELIGIBILITY</div>
            <h2 className="section-title" style={{ fontSize:"clamp(28px,4vw,48px)", color:"#fff", marginBottom:"16px" }}>WHO CAN PLAY?</h2>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"15px", marginBottom:"48px", maxWidth:"480px", margin:"0 auto 48px" }}>Simple criteria. No corporate gatekeeping. Just show us your game.</p>
            <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"14px", marginBottom:"48px" }}>
              {[
                { icon:"💼", text:"Working Professional", desc:"Currently employed or self-employed" },
                { icon:"🏏", text:"Cricket Experience", desc:"Played at school, college, or club level" },
                { icon:"📱", text:"Phone Video", desc:"Can record a 60-second cricket video" },
                { icon:"✅", text:"No Age Limit", desc:"18 to 45+, all are welcome" },
              ].map(c => (
                <div key={c.text} className="glass-card" style={{ padding:"24px 28px", borderRadius:"18px", minWidth:"200px", flex:"1 1 200px", maxWidth:"260px", textAlign:"center" }}>
                  <div style={{ fontSize:"36px", marginBottom:"12px" }}>{c.icon}</div>
                  <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:"15px", color:"#fff", marginBottom:"6px" }}>{c.text}</div>
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.45)" }}>{c.desc}</div>
                </div>
              ))}
            </div>
            <button className="btn-fire" style={{ padding:"16px 36px", fontSize:"15px" }}>Check Full Eligibility →</button>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section style={{ padding:"96px 0" }}>
          <div className="wrap">
            <div style={{ textAlign:"center", marginBottom:"56px" }}>
              <div className="section-badge">TESTIMONIALS</div>
              <h2 className="section-title" style={{ fontSize:"clamp(28px,4vw,48px)", color:"#fff" }}>
                REAL PLAYERS.<br />
                <span className="shimmer-gold">REAL STORIES.</span>
              </h2>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"24px" }}>
              {[
                { quote:"Registered on a Tuesday. Played at DY Patil in 6 weeks. I still can't believe it.", name:"Arjun S.", role:"Software Engineer", team:"Delhi Dynamos", emoji:"🗼", delay:"0s" },
                { quote:"Never thought I'd play franchise cricket. BCPL made it possible. The process is 100% transparent.", name:"Priya M.", role:"Marketing Manager", team:"Mumbai Mavericks", emoji:"🌊", delay:"0.15s" },
                { quote:"The scouting is genuine. Got shortlisted fairly on merit. No strings, no connections needed.", name:"Ravi K.", role:"Product Manager", team:"Pune Panthers", emoji:"🐆", delay:"0.3s" },
              ].map((t, i) => (
                <div key={i} className="glass-card" style={{ padding:"28px", borderRadius:"20px", position:"relative", animation:`fadeSlide 0.6s ${t.delay} ease both` }}>
                  {/* Quote mark */}
                  <div style={{ fontSize:"48px", color:"rgba(255,122,41,0.15)", fontFamily:"Georgia,serif", lineHeight:1, marginBottom:"8px" }}>"</div>
                  <p style={{ fontSize:"15px", color:"rgba(255,255,255,0.75)", lineHeight:1.7, marginBottom:"24px", fontStyle:"italic" }}>"{t.quote}"</p>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                    <div>
                      <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:"14px", color:"#fff", marginBottom:"2px" }}>{t.name}</div>
                      <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", marginBottom:"6px" }}>{t.role}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", color:"#FF7A29", fontWeight:700, fontFamily:"Montserrat,sans-serif" }}>
                        <span>{t.emoji}</span> {t.team}
                      </div>
                    </div>
                    <div style={{ fontSize:"14px", color:"#E8B23D", letterSpacing:"2px" }}>★★★★★</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA BANNER ── */}
        <section style={{ background:"linear-gradient(135deg,#C94E0E 0%,#FF7A29 40%,#E8611A 70%,#C94E0E 100%)", padding:"80px 20px", textAlign:"center", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)", pointerEvents:"none" }} />
          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ display:"inline-block", background:"rgba(255,255,255,0.15)", borderRadius:"100px", padding:"5px 16px", fontSize:"11px", fontWeight:800, fontFamily:"Montserrat,sans-serif", color:"#fff", letterSpacing:"0.12em", marginBottom:"24px" }}>🏆 SEASON 5 — LIMITED SPOTS</div>
            <h2 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"clamp(28px,5vw,60px)", color:"#fff", lineHeight:1.05, marginBottom:"16px" }}>
              YOUR CITY NEEDS<br />A PLAYER LIKE YOU
            </h2>
            <p style={{ fontSize:"clamp(16px,2vw,20px)", color:"rgba(255,255,255,0.85)", marginBottom:"8px", fontWeight:600 }}>Register for Season 5 — Only ₹299</p>
            <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.65)", marginBottom:"40px" }}>No auction fee. No tournament fee. No hidden charges. Ever.</p>
            <button style={{ background:"#fff", border:"none", borderRadius:"14px", color:"#E8611A", fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"18px", padding:"18px 48px", cursor:"pointer", boxShadow:"0 12px 40px rgba(0,0,0,0.25)", transition:"transform 0.15s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 20px 60px rgba(0,0,0,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 12px 40px rgba(0,0,0,0.25)"; }}
            >
              Register Now — ₹299 →
            </button>
            <div style={{ marginTop:"24px", fontSize:"13px", color:"rgba(255,255,255,0.55)" }}>
              🔒 Secure payment · Instant confirmation · 75 cities
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background:"#040C18", borderTop:"1px solid rgba(255,255,255,0.05)", padding:"48px 0 32px" }}>
        <div className="wrap">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"40px", marginBottom:"48px" }}>
            {/* Brand */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"12px" }}>
                <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"24px", color:"#FF7A29" }}>BCPL</span>
                <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"24px", color:"#fff" }}>T20</span>
              </div>
              <div style={{ fontSize:"11px", color:"rgba(255,122,41,0.7)", fontWeight:700, fontFamily:"Montserrat,sans-serif", letterSpacing:"0.08em", marginBottom:"14px" }}>SEASON 5 · 2025</div>
              <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.35)", lineHeight:1.7, marginBottom:"12px" }}>India's biggest corporate cricket league. Relive the dream. Rediscover the thrill.</p>
              <div style={{ fontSize:"12px", color:"#FF7A29", fontWeight:700, fontFamily:"Montserrat,sans-serif" }}>#OfficeSeStadiumtak</div>
            </div>
            {/* League links */}
            <div>
              <div style={{ fontSize:"11px", fontWeight:800, fontFamily:"Montserrat,sans-serif", color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"16px" }}>League</div>
              {["Schedule","Match Center","Teams","Points Table","Photos","Videos"].map(l => (
                <a key={l} href="#" style={{ display:"block", color:"rgba(255,255,255,0.5)", textDecoration:"none", fontSize:"14px", marginBottom:"10px", transition:"color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color="#FF7A29"}
                  onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.5)"}
                >{l}</a>
              ))}
            </div>
            {/* Info links */}
            <div>
              <div style={{ fontSize:"11px", fontWeight:800, fontFamily:"Montserrat,sans-serif", color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"16px" }}>Info</div>
              {["About","FAQ","Contact","Terms","Privacy","Refunds","Eligibility"].map(l => (
                <a key={l} href="#" style={{ display:"block", color:"rgba(255,255,255,0.5)", textDecoration:"none", fontSize:"14px", marginBottom:"10px", transition:"color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color="#FF7A29"}
                  onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.5)"}
                >{l}</a>
              ))}
            </div>
          </div>
          {/* Bottom bar */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:"24px", display:"flex", flexWrap:"wrap", gap:"12px", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.25)" }}>© 2025 Kriparti Playing11 Pvt. Ltd. All rights reserved.</div>
            <a href="https://www.bcpl-t20.com" style={{ fontSize:"12px", color:"#FF7A29", textDecoration:"none", fontWeight:700, fontFamily:"Montserrat,sans-serif" }}>www.bcpl-t20.com</a>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY BOTTOM CTA */}
      <div className="bot-cta" style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:500,
        background:"rgba(4,12,24,0.97)", backdropFilter:"blur(24px)",
        borderTop:"1px solid rgba(255,255,255,0.07)",
        padding:"10px 16px 18px", gap:"10px"
      }}>
        <button className="btn-fire" style={{ flex:2, height:"52px", fontSize:"15px" }}>Register ₹299 →</button>
        <a href="https://wa.me/918000000000" className="btn-wa" style={{ flex:1, height:"52px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", fontSize:"14px", borderRadius:"14px", textDecoration:"none" }}>💬 WhatsApp</a>
      </div>
    </>
  );
}
