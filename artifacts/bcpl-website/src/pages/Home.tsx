import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";

const L = import.meta.env.BASE_URL + "bcpl-assets/logos/";
const G = import.meta.env.BASE_URL + "bcpl-assets/ganguly_shoot.jpg";

const TEAMS = [
  { name:"Rajasthan Scorchers",  city:"Jaipur",      color:"#E97B6B", logo:"🦂" },
  { name:"Punjab Warriors",      city:"Chandigarh",  color:"#DC2626", logo:"⚔️" },
  { name:"Kolkata Tigers",        city:"Kolkata",     color:"#F97316", logo:"🐯" },
  { name:"Lucknow Nawabs",        city:"Lucknow",     color:"#F59E0B", logo:"👑" },
  { name:"Mumbai Mavericks",      city:"Mumbai",      color:"#3B82F6", logo:"🌊" },
  { name:"Hyderabad Hawks",       city:"Hyderabad",   color:"#16A34A", logo:"🦅" },
  { name:"Delhi Suryas",           city:"Delhi",       color:"#6366F1", logo:"☀️" },
  { name:"Chennai Thalaivas",      city:"Chennai",     color:"#2563EB", logo:"🦁" },
  { name:"Ahmedabad Lions",        city:"Ahmedabad",   color:"#B91C1C", logo:"🦁" },
  { name:"Bengaluru Rockets",      city:"Bengaluru",   color:"#EF4444", logo:"🚀" },
];

const NAV = ["Home","Match Center","Teams","Sponsors","Photos","Videos","About","FAQ","Contact"];
const ROUTES: Record<string,string> = {
  "Home":"/","Match Center":"/match-center","Teams":"/teams","Sponsors":"/sponsors",
  "Photos":"/photos","Videos":"/videos","About":"/about","FAQ":"/faq","Contact":"/contact",
};

const STATS = [
  { value:"₹6 Cr", label:"Prize Pool",      icon:"💰", color:"#FF7A29" },
  { value:"10",    label:"Franchise Teams", icon:"🏏", color:"#E8B23D" },
  { value:"21",    label:"Trial Cities",    icon:"📍", color:"#22C55E" },
  { value:"4",     label:"Seasons Done",    icon:"🏆", color:"#3B82F6" },
];

const STEPS = [
  { num:1, phase:"Phase 1", icon:"📋", title:"Register & Pay",    price:"₹299 / ₹399", desc:"Choose your role. Pay the Phase 1 fee. Instant confirmation.",                           color:"#FF7A29", status:"OPEN NOW" },
  { num:2, phase:"Phase 1", icon:"🎬", title:"Upload Your Video", price:"Free",          desc:"Record a 2-minute trial clip. Upload from any cricket ground in India.",               color:"#FF7A29", status:null },
  { num:3, phase:"Phase 1", icon:"🔍", title:"Scout Review",      price:"Free",          desc:"BCCI-certified scouts review your clip. Result within 7 working days.",                color:"#FF7A29", status:null },
  { num:4, phase:"Phase 2", icon:"🏟", title:"Physical Trial",    price:"₹2,000",        desc:"If selected — attend your city trial. Franchise coaches watch live.",                   color:"#E8B23D", status:"Only if selected" },
  { num:5, phase:"Phase 2", icon:"🏏", title:"Franchise Auction", price:"No extra cost", desc:"10 BCPL franchises bid for you live. Top auction bid: ₹20 Lakh.",                     color:"#E8B23D", status:null },
  { num:6, phase:"Final",   icon:"🏆", title:"Play Season 5",     price:"No extra cost", desc:"Represent your franchise. ₹6 Crore prize pool. Office se Stadium tak.",               color:"#22C55E", status:null },
];

const FAQS = [
  { q:"How much do I pay in Phase 1?",                   a:"₹299 for Batsman/Bowler/Wicket-keeper. ₹399 for All-rounders. That's it for Phase 1." },
  { q:"Do I pay anything extra for Phase 2?",            a:"Only if you are selected after Phase 1. Phase 2 fee is ₹2,000 (Bat/Bowl/WK) or ₹3,000 (All-rounder). If you are not selected, you pay nothing more." },
  { q:"Are there any hidden costs?",                     a:"Zero. Maximum total cost is ₹2,299 to ₹3,399 for your entire BCPL journey — from registration to franchise auction." },
  { q:"Who reviews my Phase 1 video?",                   a:"BCCI-certified cricket scouts review every video. Results are sent within 7 working days of submission." },
  { q:"Which cities have physical trials?",              a:"21 cities including Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Lucknow, Pune, and more." },
  { q:"What if I'm not selected for Phase 2?",           a:"You simply don't pay for Phase 2. Your Phase 1 payment covers the scout review and there is no further obligation." },
];

export function Home() {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [faqOpen,   setFaqOpen]   = useState<number|null>(null);
  const [countdown, setCountdown] = useState({ d:47, h:14, m:22, s:45 });
  const [imgErr,    setImgErr]    = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const target = new Date(Date.now() + 47*86400000);
    const t = setInterval(()=>{
      const diff = target.getTime()-Date.now();
      if(diff<=0){ clearInterval(t); return; }
      setCountdown({ d:Math.floor(diff/86400000), h:Math.floor((diff%86400000)/3600000), m:Math.floor((diff%3600000)/60000), s:Math.floor((diff%60000)/1000) });
    },1000);
    return ()=>clearInterval(t);
  },[]);

  return (
    <div style={{ background:"#06101E", color:"#F0EDE8", fontFamily:"'Inter',sans-serif", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}

        /* ─ Layout ─ */
        .W{max-width:1200px;margin:0 auto;padding:0 20px;}
        @media(min-width:768px){.W{padding:0 32px;}}
        @media(min-width:1280px){.W{padding:0 48px;}}

        /* ─ Typography ─ */
        .mont{font-family:'Montserrat',sans-serif;}

        /* ─ Animations ─ */
        @keyframes ticker   {from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes pulse6   {0%,100%{box-shadow:0 0 0 0 rgba(255,122,41,.4)}50%{box-shadow:0 0 0 10px rgba(255,122,41,0)}}
        @keyframes blip     {0%,100%{opacity:1}50%{opacity:.15}}
        @keyframes fadeUp   {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes gradMove {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

        /* ─ Buttons ─ */
        .btn-cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:14px;color:#fff;font-family:'Montserrat',sans-serif;font-weight:900;font-size:14px;letter-spacing:.04em;cursor:pointer;padding:14px 28px;text-transform:uppercase;text-decoration:none;transition:opacity .2s,transform .15s;}
        .btn-cta:hover{opacity:.9;transform:translateY(-2px);}
        .btn-ghost{display:inline-flex;align-items:center;background:transparent;border:1.5px solid rgba(255,255,255,.25);border-radius:14px;color:rgba(255,255,255,.85);font-family:'Montserrat',sans-serif;font-weight:700;font-size:14px;cursor:pointer;padding:13px 26px;text-transform:uppercase;transition:border-color .2s,color .2s;}
        .btn-ghost:hover{border-color:#FF7A29;color:#FF7A29;}

        /* ─ Nav ─ */
        .nav-link{font-family:'Montserrat',sans-serif;font-weight:700;font-size:12px;letter-spacing:.08em;color:rgba(255,255,255,.55);text-decoration:none;text-transform:uppercase;transition:color .2s;white-space:nowrap;}
        .nav-link:hover{color:#FF7A29;}
        .desk-links{display:none;}
        @media(min-width:1024px){.desk-links{display:flex;gap:18px;align-items:center;}.ham{display:none!important;}}

        /* ─ Mobile Menu ─ */
        .mob-menu{position:fixed;inset:0;background:#06101E;z-index:1000;display:flex;flex-direction:column;padding:72px 32px 32px;gap:0;overflow-y:auto;}
        .mob-link{padding:18px 0;border-bottom:1px solid rgba(255,255,255,.06);font-family:'Montserrat',sans-serif;font-weight:800;font-size:20px;color:rgba(255,255,255,.8);text-transform:uppercase;cursor:pointer;letter-spacing:.02em;}
        .mob-link:hover{color:#FF7A29;}

        /* ─ Section Label ─ */
        .slbl{font-family:'Montserrat',sans-serif;font-weight:800;font-size:11px;letter-spacing:.15em;color:#FF7A29;text-transform:uppercase;display:flex;align-items:center;gap:10px;margin-bottom:14px;}
        .slbl::before{content:'';display:inline-block;width:20px;height:2px;background:#FF7A29;}

        /* ─ Cards ─ */
        .card{background:#0A1727;border:1px solid rgba(255,255,255,.07);border-radius:16px;}

        /* ─ Price Chip ─ */
        .chip{border-radius:10px;padding:8px 16px;font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;text-align:center;}

        /* ─ Step cards grid ─ */
        .steps-grid{display:grid;grid-template-columns:1fr;gap:12px;}
        @media(min-width:640px){.steps-grid{grid-template-columns:1fr 1fr;}}
        @media(min-width:1024px){.steps-grid{grid-template-columns:repeat(3,1fr);}}

        /* ─ Team grid ─ */
        .team-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
        @media(min-width:480px){.team-grid{grid-template-columns:repeat(3,1fr);}}
        @media(min-width:768px){.team-grid{grid-template-columns:repeat(5,1fr);}}

        /* ─ Stats row ─ */
        .stats-row{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
        @media(min-width:640px){.stats-row{grid-template-columns:repeat(4,1fr);}}

        /* ─ Price cards ─ */
        .price-grid{display:grid;grid-template-columns:1fr;gap:14px;}
        @media(min-width:640px){.price-grid{grid-template-columns:1fr 1fr;}}

        /* ─ Hero grid ─ */
        .hero-grid{display:flex;flex-direction:column;gap:32px;}
        @media(min-width:900px){.hero-grid{flex-direction:row;align-items:center;}}

        /* ─ Ambassador grid ─ */
        .amb-grid{display:flex;flex-direction:column;gap:20px;}
        @media(min-width:768px){.amb-grid{flex-direction:row;align-items:center;}}

        /* ─ Floating CTA ─ */
        .float-btn{position:fixed;bottom:20px;right:20px;z-index:999;animation:pulse6 2.5s infinite;}
        @media(min-width:768px){.float-btn{bottom:28px;right:28px;}}

        /* ─ Countdown ─ */
        .cd-box{background:#060C18;border:1px solid rgba(255,122,41,.2);border-radius:12px;padding:12px 10px;text-align:center;min-width:58px;}
        @media(min-width:480px){.cd-box{padding:14px 14px;min-width:68px;}}

        /* ─ shimmer text ─ */
        .shim{background:linear-gradient(90deg,#FF7A29,#FFB347,#FF7A29);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradMove 3s ease infinite;}
        .shim-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradMove 3s ease infinite;}
      `}</style>

      {/* ── TICKER ── */}
      <div style={{ background:"linear-gradient(90deg,#C94E0E,#FF7A29)", height:34, overflow:"hidden", display:"flex", alignItems:"center" }}>
        <div style={{ display:"flex", whiteSpace:"nowrap", animation:"ticker 36s linear infinite" }}>
          {[0,1].map(i=>(
            <span key={i} className="mont" style={{ fontSize:11, fontWeight:800, letterSpacing:".1em", color:"#fff", paddingRight:80 }}>
              🏏 SEASON 5 OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; 21 CITIES &nbsp;·&nbsp; REGISTER AT ₹299 &nbsp;·&nbsp; SOURAV GANGULY &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position:"sticky", top:0, zIndex:200, background:"rgba(6,16,30,.97)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <div className="W" style={{ height:60, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
              <span className="mont" style={{ fontWeight:900, fontSize:22, color:"#FF7A29" }}>BCPL</span>
              <span className="mont" style={{ fontWeight:900, fontSize:22, color:"#fff" }}>T20</span>
            </div>
            <div style={{ width:1, height:26, background:"rgba(255,255,255,.12)" }}/>
            <div>
              <div className="mont" style={{ fontWeight:800, fontSize:9, letterSpacing:".12em", color:"#E8B23D", textTransform:"uppercase" }}>Season 5</div>
              <div className="mont" style={{ fontWeight:700, fontSize:8, letterSpacing:".06em", color:"rgba(255,255,255,.3)", textTransform:"uppercase" }}>Kriparti Playing11</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="desk-links">
            {NAV.map(n=><a key={n} className="nav-link" href={ROUTES[n]||"#"}>{n}</a>)}
          </nav>

          {/* Right side */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <button className="btn-cta" style={{ fontSize:12, padding:"9px 18px" }} onClick={()=>navigate("/registration")}>Register Now →</button>
            <button className="ham" onClick={()=>setMenuOpen(true)}
              style={{ display:"flex", flexDirection:"column", gap:5, background:"none", border:"none", cursor:"pointer", padding:"8px" }}>
              {[0,1,2].map(i=><span key={i} style={{ width:22, height:2, background:"#fff", display:"block" }}/>)}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen&&(
        <div className="mob-menu">
          <button onClick={()=>setMenuOpen(false)} style={{ position:"fixed", top:18, right:22, background:"none", border:"none", color:"#fff", fontSize:28, cursor:"pointer", zIndex:1001, lineHeight:1 }}>✕</button>
          {NAV.map(n=>(
            <div key={n} className="mob-link" onClick={()=>{ setMenuOpen(false); navigate(ROUTES[n]||"/"); }}>{n}</div>
          ))}
          <button className="btn-cta" style={{ marginTop:24, width:"100%", justifyContent:"center", fontSize:16, padding:"16px" }} onClick={()=>{ setMenuOpen(false); navigate("/registration"); }}>
            Register Now — ₹299 →
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section style={{ background:"linear-gradient(135deg,#060C18 0%,#0A1520 100%)", position:"relative", overflow:"hidden", paddingBottom:0 }}>
        {/* BG grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)", backgroundSize:"60px 60px", pointerEvents:"none" }}/>
        {/* Orange radial */}
        <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"60%", height:"140%", background:"radial-gradient(ellipse,rgba(255,122,41,.06) 0%,transparent 65%)", pointerEvents:"none" }}/>

        <div className="W" style={{ position:"relative", zIndex:1, paddingTop:"clamp(48px,8vw,80px)", paddingBottom:"clamp(48px,8vw,72px)" }}>
          <div className="hero-grid">
            {/* Left: Text */}
            <div style={{ flex:1 }}>
              {/* Badge */}
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,122,41,.1)", border:"1px solid rgba(255,122,41,.3)", borderRadius:20, padding:"6px 14px", marginBottom:22 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"blip 1.2s infinite" }}/>
                <span className="mont" style={{ fontSize:11, fontWeight:800, color:"#FF7A29", letterSpacing:".12em", textTransform:"uppercase" }}>Phase 1 Registrations Open</span>
              </div>

              {/* Headline */}
              <h1 className="mont" style={{ fontWeight:900, fontSize:"clamp(32px,6vw,72px)", lineHeight:1.02, textTransform:"uppercase", color:"#fff", letterSpacing:"-.02em", marginBottom:20 }}>
                India's Biggest<br/>
                <span className="shim">Corporate</span><br/>
                Cricket League
              </h1>

              <p style={{ fontSize:"clamp(15px,2vw,18px)", color:"rgba(255,255,255,.6)", lineHeight:1.7, marginBottom:28, maxWidth:500 }}>
                10 franchise teams. 21 cities. ₹6 Crore prize pool. Open to every working professional. <strong style={{ color:"rgba(255,255,255,.85)" }}>Office se Stadium tak.</strong>
              </p>

              {/* Price pills */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:28 }}>
                {[{label:"Bat / Bowl / WK",price:"₹299",color:"#FF7A29"},{label:"All-Rounder",price:"₹399",color:"#E8B23D"},{label:"Phase 2 fee (only if selected)",price:"₹2,000+",color:"#22C55E"}].map(p=>(
                  <div key={p.label} style={{ background:p.color+"18", border:`1px solid ${p.color}44`, borderRadius:10, padding:"8px 14px", display:"flex", gap:8, alignItems:"center" }}>
                    <span className="mont" style={{ fontSize:15, fontWeight:900, color:p.color }}>{p.price}</span>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,.5)" }}>{p.label}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:32 }}>
                <button className="btn-cta" style={{ fontSize:15, padding:"15px 32px" }} onClick={()=>navigate("/registration")}>
                  Register Now — ₹299 →
                </button>
                <a className="btn-ghost" href="#how-it-works" style={{ fontSize:14, padding:"14px 26px" }}>How It Works ↓</a>
              </div>

              {/* Countdown */}
              <div>
                <div className="mont" style={{ fontSize:10, fontWeight:700, letterSpacing:".14em", color:"rgba(255,255,255,.35)", textTransform:"uppercase", marginBottom:10 }}>⏱ Phase 1 Closes In</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {[{v:countdown.d,l:"Days"},{v:countdown.h,l:"Hrs"},{v:countdown.m,l:"Min"},{v:countdown.s,l:"Sec"}].map(({v,l})=>(
                    <div key={l} className="cd-box">
                      <div className="mont" style={{ fontWeight:900, fontSize:"clamp(22px,4vw,34px)", color:"#FF7A29", lineHeight:1 }}>{String(v).padStart(2,"0")}</div>
                      <div className="mont" style={{ fontWeight:700, fontSize:9, letterSpacing:".12em", color:"rgba(255,255,255,.35)", textTransform:"uppercase", marginTop:4 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Stats + Ganguly */}
            <div style={{ flex:"0 0 auto", display:"flex", flexDirection:"column", gap:12, alignSelf:"stretch", minWidth:0 }}>
              {/* Stats */}
              <div className="stats-row" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {STATS.map(s=>(
                  <div key={s.label} className="card" style={{ padding:"16px 14px", borderLeft:`3px solid ${s.color}` }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
                    <div className="mont" style={{ fontWeight:900, fontSize:"clamp(22px,3vw,28px)", color:s.color }}>{s.value}</div>
                    <div className="mont" style={{ fontWeight:700, fontSize:10, letterSpacing:".08em", color:"rgba(255,255,255,.4)", textTransform:"uppercase", marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Trust badge */}
              <div className="card" style={{ padding:"16px", display:"flex", alignItems:"center", gap:12, borderColor:"rgba(232,178,61,.25)" }}>
                <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#E8B23D,#C49A1E)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:18, color:"#fff", flexShrink:0 }}>SG</div>
                <div>
                  <div className="mont" style={{ fontWeight:900, fontSize:14, color:"#E8B23D" }}>Sourav Ganguly</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>Brand Ambassador · BCPL T20</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", marginTop:3, fontStyle:"italic" }}>"Cricket is a way of life."</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          NO HIDDEN COSTS BANNER
      ══════════════════════════════════════ */}
      <section style={{ background:"linear-gradient(135deg,#0A2010,#061208)", borderTop:"1px solid rgba(34,197,94,.15)", borderBottom:"1px solid rgba(34,197,94,.15)", padding:"20px 0" }}>
        <div className="W" style={{ display:"flex", flexWrap:"wrap", gap:16, alignItems:"center", justifyContent:"center" }}>
          {[
            { icon:"✅", text:"Zero hidden costs — ever" },
            { icon:"🛡",  text:"Pay Phase 2 ONLY if selected" },
            { icon:"🔒",  text:"Secure payment via Cashfree" },
            { icon:"⚡",  text:"Instant registration confirmation" },
          ].map(b=>(
            <div key={b.text} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>{b.icon}</span>
              <span className="mont" style={{ fontWeight:700, fontSize:12, color:"#22C55E", letterSpacing:".04em" }}>{b.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding:"clamp(60px,8vw,96px) 0", background:"#06101E", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 40px,rgba(255,255,255,.012) 40px,rgba(255,255,255,.012) 80px)", pointerEvents:"none" }}/>
        <div className="W" style={{ position:"relative", zIndex:1 }}>
          <div className="slbl">Process</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4vw,44px)", color:"#fff", textTransform:"uppercase", marginBottom:8 }}>How It Works</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.45)", marginBottom:44, maxWidth:520 }}>6 steps from registration to the pitch. Simple, transparent, fair.</p>

          {/* Phase 1 header */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <div style={{ background:"linear-gradient(90deg,#FF7A29,#D95E10)", borderRadius:10, padding:"5px 16px" }}>
              <span className="mont" style={{ fontSize:11, fontWeight:900, color:"#fff", letterSpacing:".1em" }}>PHASE 1 — ONLINE</span>
            </div>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(255,122,41,.4),transparent)" }}/>
            <span className="mont" style={{ fontSize:11, fontWeight:700, color:"rgba(255,122,41,.6)" }}>₹299 / ₹399</span>
          </div>

          <div className="steps-grid" style={{ marginBottom:28 }}>
            {STEPS.slice(0,3).map(step=>(
              <div key={step.num} className="card" style={{ padding:"22px 20px", position:"relative", overflow:"hidden", borderTop:`3px solid ${step.color}` }}>
                <div style={{ position:"absolute", right:-10, bottom:-20, fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:100, lineHeight:1, color:`${step.color}08`, userSelect:"none" }}>{step.num}</div>
                <div style={{ width:52, height:52, borderRadius:"50%", background:`${step.color}18`, border:`2px solid ${step.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:14, position:"relative", zIndex:1 }}>
                  {step.icon}
                  <div style={{ position:"absolute", top:-4, right:-4, width:20, height:20, borderRadius:"50%", background:step.color, border:"2px solid #06101E", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span className="mont" style={{ fontSize:10, fontWeight:900, color:"#fff" }}>{step.num}</span>
                  </div>
                </div>
                <div className="mont" style={{ fontWeight:900, fontSize:15, color:step.num===1?"#FF7A29":"#fff", marginBottom:8 }}>{step.title}</div>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.45)", lineHeight:1.65, marginBottom:12 }}>{step.desc}</p>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ background:`${step.color}18`, border:`1px solid ${step.color}44`, borderRadius:8, padding:"4px 10px" }}>
                    <span className="mont" style={{ fontSize:12, fontWeight:800, color:step.color }}>{step.price}</span>
                  </span>
                  {step.status&&step.num===1&&(
                    <span style={{ background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.3)", borderRadius:8, padding:"4px 10px", display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"blip 1s infinite" }}/>
                      <span className="mont" style={{ fontSize:10, fontWeight:800, color:"#22C55E", letterSpacing:".08em" }}>OPEN NOW</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Phase 1 → Phase 2 divider */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(255,122,41,.4),rgba(232,178,61,.4))" }}/>
            <div style={{ background:"linear-gradient(135deg,#FF7A29,#E8B23D)", borderRadius:10, padding:"8px 18px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>⭐</span>
              <span className="mont" style={{ fontWeight:900, fontSize:10, color:"#fff", letterSpacing:".1em" }}>IF SELECTED → PAY ₹2,000 & ADVANCE TO PHASE 2</span>
            </div>
            <div style={{ flex:1, height:1, background:"linear-gradient(270deg,rgba(255,122,41,.4),rgba(232,178,61,.4))" }}/>
          </div>

          {/* Phase 2 header */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <div style={{ background:"linear-gradient(90deg,#E8B23D,#C49A1E)", borderRadius:10, padding:"5px 16px" }}>
              <span className="mont" style={{ fontSize:11, fontWeight:900, color:"#000", letterSpacing:".1em" }}>PHASE 2 — PHYSICAL</span>
            </div>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(232,178,61,.4),transparent)" }}/>
            <span className="mont" style={{ fontSize:11, fontWeight:700, color:"rgba(232,178,61,.6)" }}>₹2,000 / ₹3,000 (only if selected)</span>
          </div>

          <div className="steps-grid" style={{ marginBottom:0 }}>
            {STEPS.slice(3).map(step=>(
              <div key={step.num} className="card" style={{ padding:"22px 20px", position:"relative", overflow:"hidden", borderTop:`3px solid ${step.color}` }}>
                <div style={{ position:"absolute", right:-10, bottom:-20, fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:100, lineHeight:1, color:`${step.color}08`, userSelect:"none" }}>{step.num}</div>
                <div style={{ width:52, height:52, borderRadius:"50%", background:`${step.color}18`, border:`2px solid ${step.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:14, position:"relative", zIndex:1 }}>
                  {step.icon}
                  <div style={{ position:"absolute", top:-4, right:-4, width:20, height:20, borderRadius:"50%", background:step.color, border:"2px solid #06101E", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span className="mont" style={{ fontSize:10, fontWeight:900, color:step.num===6?"#000":"#fff" }}>{step.num}</span>
                  </div>
                </div>
                <div className="mont" style={{ fontWeight:900, fontSize:15, color:step.color, marginBottom:8 }}>{step.title}</div>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.45)", lineHeight:1.65, marginBottom:12 }}>{step.desc}</p>
                {step.status&&(
                  <span style={{ background:"rgba(232,178,61,.1)", border:"1px solid rgba(232,178,61,.3)", borderRadius:8, padding:"4px 10px" }}>
                    <span className="mont" style={{ fontSize:11, fontWeight:800, color:"#E8B23D" }}>{step.status}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PRICING — CRYSTAL CLEAR
      ══════════════════════════════════════ */}
      <section style={{ padding:"clamp(60px,7vw,88px) 0", background:"#060C18" }}>
        <div className="W">
          <div className="slbl">Pricing</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4vw,42px)", color:"#fff", textTransform:"uppercase", marginBottom:6 }}>Complete Fee Structure</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.45)", marginBottom:36, maxWidth:520 }}>No fine print. No surprises. Here's exactly what you pay — and when.</p>

          <div className="price-grid">
            {/* Phase 1 */}
            <div className="card" style={{ padding:"24px", borderTop:"3px solid #FF7A29" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,122,41,.12)", border:"1px solid rgba(255,122,41,.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📋</div>
                <div>
                  <div className="mont" style={{ fontWeight:900, fontSize:16, color:"#FF7A29" }}>Phase 1</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Online — Pay now to register</div>
                </div>
                <div style={{ marginLeft:"auto", background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.3)", borderRadius:8, padding:"3px 10px" }}>
                  <span className="mont" style={{ fontSize:10, fontWeight:800, color:"#22C55E" }}>OPEN</span>
                </div>
              </div>
              {[{role:"🏏 Batsman",price:"₹299"},{role:"🎳 Bowler",price:"₹299"},{role:"🧤 Wicket-keeper",price:"₹299"},{role:"⭐ All-Rounder",price:"₹399"}].map(r=>(
                <div key={r.role} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
                  <span style={{ fontSize:14, color:"rgba(255,255,255,.7)" }}>{r.role}</span>
                  <span className="mont" style={{ fontWeight:900, fontSize:18, color:"#FF7A29" }}>{r.price}</span>
                </div>
              ))}
              <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginTop:14, lineHeight:1.6 }}>Includes: Scout review slot · Video submission · Registration confirmation</p>
              <button className="btn-cta" style={{ width:"100%", justifyContent:"center", marginTop:20, fontSize:14, padding:"14px" }} onClick={()=>navigate("/registration")}>
                Register Now →
              </button>
            </div>

            {/* Phase 2 */}
            <div className="card" style={{ padding:"24px", borderTop:"3px solid #E8B23D" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"rgba(232,178,61,.12)", border:"1px solid rgba(232,178,61,.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🏆</div>
                <div>
                  <div className="mont" style={{ fontWeight:900, fontSize:16, color:"#E8B23D" }}>Phase 2</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Physical Trial — Only if selected</div>
                </div>
                <div style={{ marginLeft:"auto", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:8, padding:"3px 10px" }}>
                  <span className="mont" style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,.35)" }}>IF SELECTED</span>
                </div>
              </div>
              {[{role:"🏏 Batsman",price:"₹2,000"},{role:"🎳 Bowler",price:"₹2,000"},{role:"🧤 Wicket-keeper",price:"₹2,000"},{role:"⭐ All-Rounder",price:"₹3,000"}].map(r=>(
                <div key={r.role} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
                  <span style={{ fontSize:14, color:"rgba(255,255,255,.7)" }}>{r.role}</span>
                  <span className="mont" style={{ fontWeight:900, fontSize:18, color:"#E8B23D" }}>{r.price}</span>
                </div>
              ))}
              <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginTop:14, lineHeight:1.6 }}>Includes: Physical trial entry · Franchise auction eligibility · Season 5 participation</p>
              <div style={{ marginTop:20, padding:"14px 16px", background:"rgba(34,197,94,.06)", border:"1px solid rgba(34,197,94,.2)", borderRadius:12, display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:18, flexShrink:0 }}>🛡</span>
                <p style={{ fontSize:12, color:"rgba(34,197,94,.9)", lineHeight:1.6 }}><strong>Not selected?</strong> You pay nothing for Phase 2. Ever. Your Phase 1 fee covers everything.</p>
              </div>
            </div>
          </div>

          {/* Total cost summary */}
          <div style={{ marginTop:20, padding:"20px 24px", background:"rgba(255,122,41,.05)", border:"1px solid rgba(255,122,41,.2)", borderRadius:16, display:"flex", flexWrap:"wrap", gap:20, alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div className="mont" style={{ fontWeight:900, fontSize:14, color:"#FF7A29" }}>Maximum Total Cost (Full Journey)</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginTop:4 }}>Phase 1 + Phase 2 combined, if fully selected</div>
            </div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {[{label:"Bat/Bowl/WK",total:"₹2,299"},{label:"All-Rounder",total:"₹3,399"}].map(t=>(
                <div key={t.label} style={{ textAlign:"center" }}>
                  <div className="mont" style={{ fontWeight:900, fontSize:24, color:"#fff" }}>{t.total}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>{t.label} — complete</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          10 FRANCHISE TEAMS
      ══════════════════════════════════════ */}
      <section style={{ padding:"clamp(60px,7vw,88px) 0", background:"#06101E" }}>
        <div className="W">
          <div className="slbl">Franchises</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(22px,4vw,40px)", color:"#fff", textTransform:"uppercase", marginBottom:8 }}>10 Franchise Teams</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.4)", marginBottom:36 }}>Get auctioned to one of these franchises. Your city, your team, your glory.</p>
          <div className="team-grid">
            {TEAMS.map(t=>(
              <div key={t.name} className="card" style={{ padding:"16px 12px", display:"flex", flexDirection:"column", gap:8, cursor:"pointer", transition:"transform .2s,border-color .2s", borderTop:`3px solid ${t.color}` }}
                onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-3px)")}
                onMouseLeave={e=>(e.currentTarget.style.transform="translateY(0)")}>
                <div style={{ width:44, height:44, borderRadius:12, background:t.color+"22", border:`1px solid ${t.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{t.logo}</div>
                <div>
                  <div className="mont" style={{ fontWeight:800, fontSize:"clamp(11px,1.5vw,13px)", color:"#F1F5F9", lineHeight:1.2 }}>{t.name}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:3 }}>{t.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          AMBASSADOR
      ══════════════════════════════════════ */}
      <section style={{ padding:"clamp(60px,7vw,80px) 0", background:"#060C18" }}>
        <div className="W">
          <div className="amb-grid">
            <div style={{ flex:1 }}>
              <div className="slbl">Brand Ambassador</div>
              <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4vw,48px)", color:"#fff", textTransform:"uppercase", lineHeight:1.05, marginBottom:16 }}>
                Backed by<br/><span className="shim-gold">Sourav Ganguly</span>
              </h2>
              <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"rgba(255,255,255,.55)", lineHeight:1.75, fontStyle:"italic", maxWidth:480, marginBottom:20 }}>
                "Cricket is not just a sport — it is a way of life. BCPL gives every working professional the chance to live that dream."
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#E8B23D,#C49A1E)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:18, color:"#fff" }}>SG</div>
                <div>
                  <div className="mont" style={{ fontWeight:900, fontSize:16, color:"#E8B23D" }}>Sourav Ganguly</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Former BCCI President · BCPL Brand Ambassador</div>
                </div>
              </div>
            </div>
            <div style={{ flex:"0 0 auto", display:"flex", flexDirection:"column", gap:10 }}>
              {[{v:"4",l:"Seasons Completed"},{v:"400+",l:"Players Auctioned"},{v:"₹14 Cr+",l:"Total Prize Distributed"},{v:"₹20L",l:"Highest Auction Bid"}].map(s=>(
                <div key={s.l} className="card" style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:16, minWidth:220, borderLeft:"3px solid #E8B23D" }}>
                  <div className="mont" style={{ fontWeight:900, fontSize:22, color:"#E8B23D" }}>{s.v}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAQ
      ══════════════════════════════════════ */}
      <section style={{ padding:"clamp(60px,7vw,88px) 0", background:"#06101E" }}>
        <div className="W">
          <div className="slbl">FAQ</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(22px,4vw,40px)", color:"#fff", textTransform:"uppercase", marginBottom:8 }}>Frequently Asked Questions</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.4)", marginBottom:36 }}>Everything you need to know before registering.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10, maxWidth:760 }}>
            {FAQS.map((f,i)=>(
              <div key={i} className="card" style={{ overflow:"hidden", cursor:"pointer", transition:"border-color .2s", borderColor:faqOpen===i?"rgba(255,122,41,.4)":"rgba(255,255,255,.07)" }}
                onClick={()=>setFaqOpen(faqOpen===i?null:i)}>
                <div style={{ padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ width:24, height:24, borderRadius:"50%", background:"rgba(255,122,41,.1)", border:"1px solid rgba(255,122,41,.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span className="mont" style={{ fontSize:10, fontWeight:800, color:"#FF7A29" }}>{i+1}</span>
                    </span>
                    <span className="mont" style={{ fontWeight:700, fontSize:"clamp(13px,2vw,15px)", color:faqOpen===i?"#FF7A29":"#F1F5F9" }}>{f.q}</span>
                  </div>
                  <span style={{ fontSize:18, color:faqOpen===i?"#FF7A29":"rgba(255,255,255,.3)", flexShrink:0, transition:"transform .25s", display:"inline-block", transform:faqOpen===i?"rotate(45deg)":"rotate(0)" }}>+</span>
                </div>
                {faqOpen===i&&(
                  <div style={{ padding:"0 20px 18px 56px" }}>
                    <p style={{ fontSize:"clamp(13px,1.8vw,14px)", color:"rgba(255,255,255,.55)", lineHeight:1.75 }}>{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section style={{ padding:"clamp(60px,8vw,96px) 0", background:"linear-gradient(135deg,#0A1218,#060C14)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 80% at 50% 50%,rgba(255,122,41,.06) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div className="W" style={{ textAlign:"center", position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,122,41,.1)", border:"1px solid rgba(255,122,41,.3)", borderRadius:20, padding:"6px 16px", marginBottom:24 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"blip 1.2s infinite" }}/>
            <span className="mont" style={{ fontSize:11, fontWeight:800, color:"#FF7A29", letterSpacing:".12em", textTransform:"uppercase" }}>Registrations Closing Soon</span>
          </div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(28px,5vw,60px)", color:"#fff", textTransform:"uppercase", lineHeight:1.04, marginBottom:16 }}>
            Your Stadium Debut<br/>Starts With <span className="shim">₹299</span>
          </h2>
          <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"rgba(255,255,255,.5)", lineHeight:1.7, marginBottom:32, maxWidth:520, margin:"0 auto 32px" }}>
            Join thousands of working professionals who have already taken the first step. Phase 1 closes soon.
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button className="btn-cta" style={{ fontSize:16, padding:"16px 36px" }} onClick={()=>navigate("/registration")}>
              🏏 Register Now — ₹299 →
            </button>
            <a className="btn-ghost" href="#how-it-works" style={{ fontSize:14, padding:"15px 28px" }}>
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer style={{ background:"#040810", borderTop:"1px solid rgba(255,255,255,.06)", padding:"clamp(40px,6vw,60px) 0 24px" }}>
        <div className="W">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:32, marginBottom:40 }}>
            <div>
              <div style={{ display:"flex", alignItems:"baseline", gap:2, marginBottom:10 }}>
                <span className="mont" style={{ fontWeight:900, fontSize:20, color:"#FF7A29" }}>BCPL</span>
                <span className="mont" style={{ fontWeight:900, fontSize:20, color:"#fff" }}>T20</span>
              </div>
              <p style={{ fontSize:13, color:"rgba(255,255,255,.35)", lineHeight:1.7 }}>India's Biggest Corporate T20 Cricket League. Season 5 — 2026.</p>
            </div>
            {[
              { title:"League", links:["About","Teams","Schedule","Points Table","Sponsors"] },
              { title:"Register", links:["Phase 1 Registration","Eligibility Criteria","FAQ","Cricket Rules","Code of Conduct"] },
              { title:"Legal", links:["Privacy Policy","Terms & Conditions","Refund Policy","Contact Us"] },
            ].map(col=>(
              <div key={col.title}>
                <div className="mont" style={{ fontWeight:800, fontSize:11, letterSpacing:".1em", color:"rgba(255,255,255,.4)", textTransform:"uppercase", marginBottom:14 }}>{col.title}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {col.links.map(l=>(
                    <a key={l} href="#" style={{ fontSize:13, color:"rgba(255,255,255,.4)", textDecoration:"none", transition:"color .2s" }}
                      onMouseEnter={e=>(e.currentTarget.style.color="#FF7A29")}
                      onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,.4)")}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", paddingTop:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.25)" }}>© 2026 BCPL T20 — Kriparti Playing11 Pvt. Ltd. All rights reserved.</p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.2)" }}>Made with 🏏 in India</p>
          </div>
        </div>
      </footer>

      {/* Floating Register Button */}
      <div className="float-btn">
        <button className="btn-cta" style={{ fontSize:13, padding:"13px 22px", borderRadius:12, boxShadow:"0 8px 32px rgba(255,122,41,.5)" }} onClick={()=>navigate("/registration")}>
          🏏 Register — ₹299
        </button>
      </div>
    </div>
  );
}
