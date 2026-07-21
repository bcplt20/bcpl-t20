import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { getMatches, getPointsTable } from "../lib/api";
import { BCPLFooter } from "../components/BCPLFooter";
import { openLoginModal } from "../lib/auth";

const L = import.meta.env.BASE_URL + "bcpl-assets/logos/";

const TEAMS = [
  { name:"Rajasthan Scorchers",  city:"Jaipur",      color:"#E97B6B", slug:"rajasthan_scorchers"  },
  { name:"Punjab Warriors",      city:"Chandigarh",  color:"#DC2626", slug:"punjab_warriors"       },
  { name:"Kolkata Tigers",        city:"Kolkata",     color:"#F97316", slug:"kolkata_tigers"        },
  { name:"Lucknow Nawabs",        city:"Lucknow",     color:"#F59E0B", slug:"lucknow_nawabs"        },
  { name:"Mumbai Mavericks",      city:"Mumbai",      color:"#3B82F6", slug:"mumbai_mavericks"      },
  { name:"Hyderabad Hawks",       city:"Hyderabad",   color:"#16A34A", slug:"hyderabad_hawks"       },
  { name:"Delhi Suryas",           city:"Delhi",       color:"#6366F1", slug:"delhi_suryas"          },
  { name:"Chennai Thalaivas",      city:"Chennai",     color:"#2563EB", slug:"chennai_thalaivas"     },
  { name:"Ahmedabad Lions",        city:"Ahmedabad",   color:"#B91C1C", slug:"ahmedabad_lions"       },
  { name:"Bengaluru Rockets",      city:"Bengaluru",   color:"#EF4444", slug:"bengaluru_rockets"     },
];

const NAV  = ["Home","Match Center","Teams","Sponsors","Photos","Videos","About","FAQ","Contact","Login"];
const RTES: Record<string,string> = {
  "Home":"/","Match Center":"/match-center","Teams":"/teams","Sponsors":"/sponsors",
  "Photos":"/photos","Videos":"/videos","About":"/about","FAQ":"/faq","Contact":"/contact",
  "Login":"/register#login",
};

const STATS = [
  { value:"₹6 Cr+", label:"Prize Pool",      color:"#FF7A29" },
  { value:"10",     label:"Franchise Teams", color:"#E8B23D" },
  { value:"50+",    label:"Trial Cities",    color:"#22C55E" },
  { value:"4",      label:"Seasons Done",    color:"#3B82F6" },
];

const STEPS = [
  { num:1, phase:1, icon:"📋", title:"Register & Pay",    price:"₹299 / ₹399",  desc:"Batsman/Bowler/WK: ₹299 · All-Rounder: ₹399. Choose your role and pay online — instant confirmation.",   color:"#FF7A29", status:"OPEN NOW" },
  { num:2, phase:1, icon:"🎬", title:"Upload Trial Video", price:"Included",     desc:"Record a 2-minute cricket clip. Upload from any ground in India. No studio needed.",                      color:"#FF7A29", status:null },
  { num:3, phase:1, icon:"🔍", title:"Scout Review",       price:"Included",     desc:"BCCI-certified scouts review your clip. Result guaranteed within 15 working days — or full refund.",       color:"#FF7A29", status:null },
  { num:4, phase:2, icon:"🏟", title:"Physical Trial",     price:"₹2,000",       desc:"Only if selected from Phase 1 — attend your tri-city trial. Franchise coaches evaluate you live.",       color:"#E8B23D", status:"Only if selected from Phase 1" },
  { num:5, phase:2, icon:"🏏", title:"Franchise Auction",  price:"No extra cost",desc:"10 BCPL franchises bid for you in a live IPL-style auction. Top player bid: ₹20 Lakh.",                color:"#E8B23D", status:null },
  { num:6, phase:3, icon:"🏆", title:"Play Season 5",      price:"No extra cost",desc:"Represent your franchise. ₹6 Crore prize pool. Office se Stadium tak.",                                  color:"#22C55E", status:null },
];

const FAQS = [
  { q:"How much do I pay in Phase 1?",         a:"₹299 for Batsman/Bowler/Wicket-keeper. ₹399 for All-rounders. That's it for Phase 1." },
  { q:"Do I pay extra for Phase 2?",           a:"Only if selected. Phase 2 fee is ₹2,000 (Bat/Bowl/WK) or ₹3,000 (All-rounder). Not selected = pay nothing more." },
  { q:"Are there hidden costs?",               a:"Zero. Maximum total cost is ₹2,299–₹3,399 for your entire BCPL journey — registration to franchise auction." },
  { q:"Who reviews my Phase 1 video?",         a:"BCCI-certified cricket scouts review every video. Results sent within 15 working days of submission." },
  { q:"Which cities have physical trials?",    a:"50+ cities including Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Lucknow, Pune, Surat, Nagpur, Indore, Bhopal, Patna, Kochi, and many more." },
  { q:"What if I'm not selected for Phase 2?", a:"You simply don't pay for Phase 2. Your Phase 1 fee covers the scout review and there is no further obligation." },
];

/* Announcement banners that rotate */
const BANNERS = [
  { text:"🎁 Refer a friend and get ₹50 cashback on your next phase fee!", cta:"Refer Now", color:"#1a3a1a", border:"#22C55E", textCol:"#22C55E", ctaCol:"#22C55E" },
  { text:"⏰ Last date for Phase 1 registration is 28th February 2027 — Don't miss out!", cta:"Register Now", color:"#1a1a0a", border:"#FF7A29", textCol:"#FF7A29", ctaCol:"#FF7A29" },
  { text:"🏏 New cities added! Trials now in 50+ cities across India. Check your city →", cta:"View Cities", color:"#0a1a2e", border:"#3B82F6", textCol:"#60A5FA", ctaCol:"#60A5FA" },
];

/* Season timeline */
const TIMELINE = [
  { month:"Oct '26 – Feb '27", label:"Registrations", icon:"📋", details:["Register online in minutes","Pay ₹299 / ₹399 by role","Upload 2-min trial video"], color:"#FF7A29", done:true },
  { month:"Mar – Jun 2027",    label:"Trials",         icon:"🏟", details:["Physical trials in 50+ cities","Franchise coaches evaluate live","3-city option available"],         color:"#E8B23D", done:false },
  { month:"Jul – Aug 2027",    label:"Results",        icon:"📣", details:["SMS + Email notification","Selection results announced","Phase 2 invite if selected"],    color:"#22C55E", done:false },
  { month:"August 2027",       label:"Auction",        icon:"GAVEL", details:["10 franchises bid live","Top player bid: ₹20 Lakh","IPL-style live auction event"],  color:"#3B82F6", done:false },
  { month:"Sep – Oct 2027",    label:"Tournament",     icon:"🏆", details:["₹6 Crore prize pool","10 franchise teams compete","Office se Stadium tak"],           color:"#6366F1", done:false },
];

/* Matches */
const MATCHES: {status:string,team1:string,team2:string,t1Slug:string,t2Slug:string,t1Color:string,t2Color:string,score1:string,score2:string,info:string,winner:string}[] = [];

/* Points Table */
const POINTS_TABLE: {rank:number,team:string,slug:string,color:string,p:number,w:number,l:number,nr:number,pts:number,nrr:string}[] = [
  // Empty — will be populated from live API when tournament begins (Sep 2026)
];

/* Sponsors — empty until real sponsors confirmed */
const SPONSORS: {tier:string,name:string,logo:string,color:string}[] = [];

/* ═══════════════════════════════════════════════════════════ */
export function Home() {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [faqOpen,   setFaqOpen]   = useState<number|null>(null);
  const [countdown, setCountdown] = useState({ d:47, h:14, m:22, s:45 });
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerOut, setBannerOut] = useState(false);
  const [, navigate] = useLocation();

  /* Live data from API */
  const [liveMatches,  setLiveMatches]  = useState<any[]>([]);
  const [liveTable,    setLiveTable]    = useState<any[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const fetchLiveData = () => {
    getMatches(5)
      .then(r => setLiveMatches(r.matches))
      .catch(()=>{});
    getPointsTable(5)
      .then(r => setLiveTable(r.table))
      .catch(()=>{});
  };

  useEffect(()=>{
    fetchLiveData();
    pollRef.current = setInterval(fetchLiveData, 8000); // poll every 8s
    return ()=>{ if(pollRef.current) clearInterval(pollRef.current); };
  },[]);

  /* Countdown — Phase 1 closes 28 Feb 2027 */
  useEffect(()=>{
    const target = new Date('2027-02-28T23:59:59+05:30');
    const tick = ()=>{
      const diff = target.getTime()-Date.now();
      if(diff<=0){ setCountdown({d:0,h:0,m:0,s:0}); return; }
      setCountdown({ d:Math.floor(diff/86400000), h:Math.floor((diff%86400000)/3600000), m:Math.floor((diff%3600000)/60000), s:Math.floor((diff%60000)/1000) });
    };
    tick();
    const t = setInterval(tick,1000);
    return ()=>clearInterval(t);
  },[]);

  /* Banner auto-rotate */
  useEffect(()=>{
    const iv = setInterval(()=>{
      setBannerOut(true);
      setTimeout(()=>{ setBannerIdx(i=>(i+1)%BANNERS.length); setBannerOut(false); }, 350);
    }, 5000);
    return ()=>clearInterval(iv);
  },[]);

  /* Timeline scroll observer */
  const tlRef = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    const el = tlRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries)=>{
        if (entries[0].isIntersecting) {
          el.querySelectorAll<HTMLElement>(".tl-card").forEach(c=>c.classList.add("tl-visible"));
          el.classList.add("has-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.10 }
    );
    obs.observe(el);
    return ()=>obs.disconnect();
  }, []);

  const B = BANNERS[bannerIdx];

  return (
    <div style={{ background:"#06101E", color:"#F0EDE8", fontFamily:"'Inter',sans-serif", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        .W{max-width:1200px;margin:0 auto;padding:0 20px;}
        @media(min-width:768px){.W{padding:0 32px;}}
        @media(min-width:1280px){.W{padding:0 48px;}}
        .mont{font-family:'Montserrat',sans-serif;}

        /* Animations */
        @keyframes ticker   {from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes pulse6   {0%,100%{box-shadow:0 0 0 0 rgba(255,122,41,.4)}50%{box-shadow:0 0 0 10px rgba(255,122,41,0)}}
        @keyframes blip     {0%,100%{opacity:1}50%{opacity:.15}}
        @keyframes gradMove {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes bannerIn {from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bannerOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(8px)}}
        @keyframes shimmer  {0%{left:-100%}100%{left:200%}}
        @keyframes float    {0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes glow     {0%,100%{text-shadow:0 0 20px rgba(255,122,41,.3)}50%{text-shadow:0 0 40px rgba(255,122,41,.7),0 0 80px rgba(255,122,41,.3)}}
        @keyframes s5spin   {0%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}100%{transform:rotate(-2deg)}}
        @keyframes tlPop    {from{opacity:0;transform:scale(.85) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes railGrow {from{height:0}to{height:100%}}

        /* Buttons */
        .btn-cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:14px;color:#fff;font-family:'Montserrat',sans-serif;font-weight:900;font-size:14px;letter-spacing:.04em;cursor:pointer;padding:14px 28px;text-transform:uppercase;text-decoration:none;transition:opacity .2s,transform .15s;}
        .btn-cta:hover{opacity:.9;transform:translateY(-2px);}
        .btn-ghost{display:inline-flex;align-items:center;background:transparent;border:1.5px solid rgba(255,255,255,.25);border-radius:14px;color:rgba(255,255,255,.85);font-family:'Montserrat',sans-serif;font-weight:700;font-size:14px;cursor:pointer;padding:13px 26px;text-transform:uppercase;transition:border-color .2s,color .2s;text-decoration:none;}
        .btn-ghost:hover{border-color:#FF7A29;color:#FF7A29;}

        /* Nav */
        .nav-link{font-family:'Montserrat',sans-serif;font-weight:700;font-size:12px;letter-spacing:.08em;color:rgba(255,255,255,.55);text-decoration:none;text-transform:uppercase;transition:color .2s;white-space:nowrap;}
        .nav-link:hover{color:#FF7A29;}
        .desk-links{display:none;}
        @media(min-width:1024px){.desk-links{display:flex;gap:18px;align-items:center;}.ham{display:none!important;}}

        /* Mobile menu */
        .mob-menu{position:fixed;inset:0;background:#06101E;z-index:1000;display:flex;flex-direction:column;padding:72px 32px 32px;overflow-y:auto;}
        .mob-link{padding:18px 0;border-bottom:1px solid rgba(255,255,255,.06);font-family:'Montserrat',sans-serif;font-weight:800;font-size:20px;color:rgba(255,255,255,.8);text-transform:uppercase;cursor:pointer;}
        .mob-link:hover{color:#FF7A29;}

        /* Section label */
        .slbl{font-family:'Montserrat',sans-serif;font-weight:800;font-size:11px;letter-spacing:.15em;color:#FF7A29;text-transform:uppercase;display:flex;align-items:center;gap:10px;margin-bottom:14px;}
        .slbl::before{content:'';display:inline-block;width:20px;height:2px;background:#FF7A29;}

        /* Card */
        .card{background:#0A1727;border:1px solid rgba(255,255,255,.07);border-radius:16px;}

        /* Grids */
        .steps-grid{display:grid;grid-template-columns:1fr;gap:12px;}
        @media(min-width:640px){.steps-grid{grid-template-columns:1fr 1fr;}}
        @media(min-width:1024px){.steps-grid{grid-template-columns:repeat(3,1fr);}}

        .team-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
        @media(min-width:480px){.team-grid{grid-template-columns:repeat(3,1fr);}}
        @media(min-width:768px){.team-grid{grid-template-columns:repeat(5,1fr);}}

        .price-grid{display:grid;grid-template-columns:1fr;gap:14px;}
        @media(min-width:640px){.price-grid{grid-template-columns:1fr 1fr;}}

        .hero-grid{display:flex;flex-direction:column;gap:32px;}
        @media(min-width:900px){.hero-grid{flex-direction:row;align-items:center;}}
        @media(min-width:900px){.hero-right{flex:0 0 360px!important;width:360px!important;max-width:40%;}}
        .ganguly-img{right:0!important;left:auto!important;}
        @media(max-width:899px){.ganguly-img{left:50%!important;right:auto!important;transform:translateX(-50%)!important;width:100%!important;object-position:center top!important;opacity:0.18!important;}}

        .amb-grid{display:flex;flex-direction:column;gap:20px;}
        @media(min-width:768px){.amb-grid{flex-direction:row;align-items:center;}}

        /* Timeline */
        .tl-grid{display:grid;grid-template-columns:1fr;gap:0;}
        @media(min-width:768px){.tl-grid{grid-template-columns:repeat(5,1fr);gap:0;}}

        /* Sponsor tiers */
        .sp-row{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;}

        /* Footer columns - always horizontal */
        .foot-cols{display:flex;flex-wrap:wrap;gap:32px;}
        .foot-bottom{display:flex;flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
        .foot-legal-links{display:flex;flex-direction:row;flex-wrap:wrap;gap:12px;align-items:center;}

        /* Floating CTA — removed */

        /* Countdown */
        .cd-box{background:#060C18;border:1px solid rgba(255,122,41,.2);border-radius:12px;padding:12px 10px;text-align:center;min-width:58px;}
        @media(min-width:480px){.cd-box{padding:14px 14px;min-width:68px;}}

        /* Shimmer text */
        .shim{background:linear-gradient(90deg,#FF7A29,#FFB347,#FF7A29);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradMove 3s ease infinite;}
        .shim-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradMove 3s ease infinite;}

        /* S5 badge glow */
        .s5-badge{animation:s5spin 3s ease-in-out infinite;}

        /* S5 nav badge pulse */
        @keyframes s5NavPulse{0%,100%{box-shadow:0 0 6px rgba(232,178,61,.3)}50%{box-shadow:0 0 16px rgba(232,178,61,.7),0 0 28px rgba(232,178,61,.3)}}
        .s5-nav-badge{animation:s5NavPulse 2.5s ease-in-out infinite;}

        /* Hide register button on small phones to keep hamburger visible */
        @media(max-width:680px){.nav-reg-btn{display:none!important;}}

        /* Hashtag style */
        .hashtag-tag{display:inline-block;}

        /* Banner slide */
        .banner-in{animation:bannerIn .35s ease forwards;}
        .banner-out{animation:bannerOut .35s ease forwards;}

        /* Timeline */
        .tl-card{opacity:0;display:flex;flex-direction:column;transition:opacity .5s ease,transform .5s ease;}
        .tl-card.tl-visible{opacity:1;transform:translateY(0)!important;}
        .tl-card:not(.tl-visible){transform:translateY(18px);}
        .tl-card:nth-child(1){transition-delay:.05s;}
        .tl-card:nth-child(2){transition-delay:.15s;}
        .tl-card:nth-child(3){transition-delay:.25s;}
        .tl-card:nth-child(4){transition-delay:.35s;}
        .tl-card:nth-child(5){transition-delay:.45s;}
        /* Equal-height timeline inner cards */
        .tl-inner{flex:1;display:flex;flex-direction:column;transition:border-color .3s,box-shadow .3s;}
        .tl-inner:hover{box-shadow:0 8px 32px rgba(0,0,0,.4)!important;}
        /* Progress rail animation */
        @keyframes railAnim{from{width:0}to{width:100%}}
        .tl-rail{animation:railAnim 2.2s ease forwards;animation-delay:.6s;}

        /* Sponsor hover */
        .sp-card{transition:transform .2s,border-color .2s;}
        .sp-card:hover{transform:translateY(-3px);}

        /* Logo circle shimmer */
        .bcpl-logo{position:relative;overflow:hidden;}
        .bcpl-logo::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:shimmer 2.5s infinite;}

        /* ── MOBILE HERO IMPROVEMENTS ── */
        @media(max-width:899px){
          .hero-grid{flex-direction:column!important;gap:24px!important;}
          .hero-right-stats{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}
          .hero-amb-card{display:flex!important;}
        }
        @media(max-width:480px){
          .hero-right-stats{grid-template-columns:repeat(2,1fr)!important;}
          .cd-box{min-width:52px!important;padding:10px 8px!important;}
        }

        /* ── MOBILE GENERAL ── */
        @media(max-width:767px){
          .slbl{font-size:10px!important;}
          .tl-grid{overflow-x:hidden;}
          .tl-grid::before{display:none!important;}
          .tl-arrow{display:none!important;}
          .hashtag-tag{font-size:20px!important;}
        }
      `}</style>

      {/* ══ TICKER ══ */}
      <div style={{ background:"linear-gradient(90deg,#C94E0E,#FF7A29)", height:34, overflow:"hidden", display:"flex", alignItems:"center" }}>
        <div style={{ display:"flex", whiteSpace:"nowrap", animation:"ticker 36s linear infinite" }}>
          {[0,1].map(i=>(
            <span key={i} className="mont" style={{ fontSize:11, fontWeight:800, letterSpacing:".1em", color:"#fff", paddingRight:80 }}>
              🏏 SEASON 5 OPEN &nbsp;·&nbsp; ₹6 CR+ PRIZE POOL &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; 50+ CITIES &nbsp;·&nbsp; REGISTER AT ₹299 &nbsp;·&nbsp; SOURAV GANGULY &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ══ ANNOUNCEMENT BANNER ══ */}
      <div style={{ background:B.color, borderBottom:`1px solid ${B.border}33`, padding:"10px 0", overflow:"hidden" }}>
        <div className="W" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <span className={bannerOut?"banner-out":"banner-in"} style={{ fontSize:"clamp(12px,2vw,13px)", color:B.textCol, fontWeight:600, flex:1, minWidth:0 }}>{B.text}</span>
          <button onClick={()=>navigate("/register")} style={{ padding:"5px 16px", borderRadius:8, border:`1px solid ${B.ctaCol}55`, background:"transparent", color:B.ctaCol, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{B.cta} →</button>
          {/* Dots */}
          <div style={{ display:"flex", gap:5, flexShrink:0 }}>
            {BANNERS.map((_,i)=>(
              <button key={i} onClick={()=>setBannerIdx(i)} style={{ width:i===bannerIdx?20:6, height:6, borderRadius:3, border:"none", background:i===bannerIdx?B.ctaCol:"rgba(255,255,255,.2)", cursor:"pointer", padding:0, transition:"width .3s,background .3s" }}/>
            ))}
          </div>
        </div>
      </div>

      {/* ══ NAVBAR ══ */}
      <nav style={{ position:"sticky", top:0, zIndex:200, background:"rgba(6,16,30,.97)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <div className="W" style={{ height:60, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>

          {/* Logo */}
          <a href="/" style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0, textDecoration:"none" }}>
            <img src={import.meta.env.BASE_URL + "bcpl-assets/bcpl-logo-white.png"} alt="BCPL" style={{ height:42, width:"auto", objectFit:"contain", display:"block", filter:"brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))" }}/>
            <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(232,178,61,0.12)", border:"1px solid rgba(232,178,61,0.5)", borderRadius:6, padding:"3px 10px" }}>
              <span style={{ fontSize:9 }}>🏆</span>
              <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:9, color:"#E8B23D", letterSpacing:".12em" }}>SEASON 5</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="desk-links">
            {NAV.map(n=> n==="Login"
              ? <span key={n} className="nav-link" style={{cursor:"pointer",color:"#FF7A29",fontWeight:800}} onClick={openLoginModal}>{n}</span>
              : <a key={n} href={RTES[n]||"/"} className="nav-link" style={{textDecoration:"none"}}>{n}</a>
            )}
          </nav>

          {/* Right */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <button className="btn-cta nav-reg-btn" style={{ fontSize:12, padding:"9px 18px" }} onClick={()=>navigate("/register")}>Register Now →</button>
            <button className="ham" onClick={()=>setMenuOpen(true)} style={{ display:"flex", flexDirection:"column", gap:5, background:"none", border:"none", cursor:"pointer", padding:8 }}>
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
            n==="Login"
              ? <div key={n} className="mob-link" style={{color:"#FF7A29"}} onClick={()=>{ setMenuOpen(false); openLoginModal(); }}>{n}</div>
              : <a key={n} href={RTES[n]||"/"} className="mob-link" onClick={()=>setMenuOpen(false)} style={{textDecoration:"none"}}>{n}</a>
          ))}
          <button className="btn-cta" style={{ marginTop:24, width:"100%", justifyContent:"center", fontSize:16, padding:16 }} onClick={()=>{ setMenuOpen(false); navigate("/register"); }}>
            Register Now — ₹299 →
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section style={{ background:"linear-gradient(135deg,#060C18 0%,#0A1520 100%)", position:"relative", overflow:"hidden" }}>
        {/* BG grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)", backgroundSize:"60px 60px", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"60%", height:"140%", background:"radial-gradient(ellipse,rgba(255,122,41,.06) 0%,transparent 65%)", pointerEvents:"none" }}/>
        {/* Ganguly watermark — visible brand ambassador presence */}
        <img src={import.meta.env.BASE_URL + "bcpl-assets/ganguly_shoot.jpg"} alt="Sourav Ganguly — BCPL Brand Ambassador" aria-hidden="true"
          style={{ position:"absolute", right:0, top:0, height:"100%", width:"auto", objectFit:"cover", objectPosition:"center top", opacity:0.32, pointerEvents:"none", userSelect:"none", filter:"sepia(10%) contrast(1.08) brightness(0.95)", zIndex:0, maskImage:"linear-gradient(to left, rgba(0,0,0,1) 10%, rgba(0,0,0,0.7) 45%, transparent 72%)", WebkitMaskImage:"linear-gradient(to left, rgba(0,0,0,1) 10%, rgba(0,0,0,0.7) 45%, transparent 72%)" as any,
          // Mobile: center the image
          } as React.CSSProperties}
          className="ganguly-img"
        />

        <div className="W" style={{ position:"relative", zIndex:1, paddingTop:"clamp(48px,8vw,80px)", paddingBottom:"clamp(48px,8vw,72px)" }}>
          <div className="hero-grid">

            {/* Left: Text */}
            <div style={{ flex:1 }}>
              {/* SEASON 5 GLORIFIED BADGE */}
              <div style={{ display:"inline-flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div className="s5-badge" style={{ display:"inline-flex", alignItems:"center", gap:10, background:"linear-gradient(135deg,rgba(232,178,61,.15),rgba(232,178,61,.05))", border:"1.5px solid rgba(232,178,61,.5)", borderRadius:16, padding:"8px 18px", boxShadow:"0 0 24px rgba(232,178,61,.2), inset 0 1px 0 rgba(232,178,61,.3)" }}>
                  <span style={{ fontSize:18, lineHeight:1 }}>🏆</span>
                  <div>
                    <div className="mont" style={{ fontWeight:900, fontSize:16, color:"#E8B23D", letterSpacing:".06em", lineHeight:1, animation:"glow 2.5s ease infinite" }}>SEASON 5</div>
                    <div className="mont" style={{ fontWeight:700, fontSize:9, color:"rgba(232,178,61,.6)", letterSpacing:".12em", textTransform:"uppercase", marginTop:2, lineHeight:1 }}>BCPL · 2026–27</div>
                  </div>
                  <div style={{ width:1, height:28, background:"rgba(232,178,61,.3)" }}/>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"blip 1.2s infinite" }}/>
                    <span className="mont" style={{ fontSize:10, fontWeight:800, color:"#22C55E", letterSpacing:".1em" }}>REGISTRATIONS OPEN</span>
                  </div>
                </div>
              </div>

              {/* Headline */}
              <h1 className="mont" style={{ fontWeight:900, fontSize:"clamp(32px,6vw,72px)", lineHeight:1.02, textTransform:"uppercase", color:"#fff", letterSpacing:"-.02em", marginBottom:20 }}>
                India's Biggest<br/>
                <span className="shim">Corporate</span><br/>
                Cricket League
              </h1>

              <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"rgba(255,255,255,.6)", lineHeight:1.7, marginBottom:12, maxWidth:500 }}>
                10 franchise teams · 50+ cities · ₹6 Crore+ prize pool · Open to every working professional.
              </p>
              <div style={{ marginBottom:28 }}>
                <span className="mont hashtag-tag" style={{ fontWeight:900, fontSize:"clamp(18px,3vw,24px)", letterSpacing:".01em", background:"linear-gradient(90deg,#FF7A29,#FFB347,#FF7A29)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", animation:"gradMove 3s ease infinite" }}>#OfficeSeStadiumTak</span>
              </div>

              {/* Price pills */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:28 }}>
                {[{label:"Bat / Bowl / WK",price:"₹299",color:"#FF7A29"},{label:"All-Rounder",price:"₹399",color:"#E8B23D"},{label:"Phase 2 (only if selected)",price:"₹2,000+",color:"#22C55E"}].map(p=>(
                  <div key={p.label} style={{ background:p.color+"18", border:`1px solid ${p.color}44`, borderRadius:10, padding:"8px 14px", display:"flex", gap:8, alignItems:"center" }}>
                    <span className="mont" style={{ fontSize:15, fontWeight:900, color:p.color }}>{p.price}</span>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,.5)" }}>{p.label}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:32 }}>
                <button className="btn-cta" style={{ fontSize:15, padding:"15px 32px" }} onClick={()=>navigate("/register")}>Register Now — ₹299 →</button>
                <a className="btn-ghost" href="#how-it-works" style={{ fontSize:14, padding:"14px 26px" }}>How It Works ↓</a>
              </div>

              {/* Countdown */}
              <div>
                <div className="mont" style={{ fontSize:10, fontWeight:700, letterSpacing:".14em", color:"rgba(255,255,255,.35)", textTransform:"uppercase", marginBottom:10 }}>⏱ Registration for Phase 1 Closes In</div>
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

            {/* Right: Stats + Trust */}
            <div className="hero-right" style={{ flex:"0 0 auto", display:"flex", flexDirection:"column", gap:12, alignSelf:"stretch", minWidth:0, width:"100%" }}>
              <div className="hero-right-stats" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {STATS.map(s=>(
                  <div key={s.label} className="card" style={{ padding:"16px 14px", borderLeft:`3px solid ${s.color}` }}>
                    <div className="mont" style={{ fontWeight:900, fontSize:"clamp(22px,3vw,28px)", color:s.color }}>{s.value}</div>
                    <div className="mont" style={{ fontWeight:700, fontSize:10, letterSpacing:".08em", color:"rgba(255,255,255,.4)", textTransform:"uppercase", marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="card hero-amb-card" style={{ padding:16, display:"flex", alignItems:"center", gap:12, borderColor:"rgba(232,178,61,.35)", boxShadow:"0 0 20px rgba(232,178,61,.08)" }}>
                <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#E8B23D,#C49A1E)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:20, color:"#fff", flexShrink:0, boxShadow:"0 4px 14px rgba(232,178,61,.3)" }}>SG</div>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", color:"rgba(232,178,61,.6)", textTransform:"uppercase", marginBottom:3 }}>Brand Ambassador</div>
                  <div className="mont" style={{ fontWeight:900, fontSize:15, color:"#E8B23D" }}>Sourav Ganguly</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", marginTop:2 }}>Former BCCI President · Legend of Cricket</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", marginTop:3, fontStyle:"italic" }}>"Cricket is a way of life."</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ NO HIDDEN COSTS STRIP ══ */}
      <section style={{ background:"linear-gradient(135deg,#0A2010,#061208)", borderTop:"1px solid rgba(34,197,94,.15)", borderBottom:"1px solid rgba(34,197,94,.15)", padding:"16px 0", overflowX:"hidden" }}>
        <div style={{ display:"flex", gap:0, animation:"trustScroll 18s linear infinite", width:"max-content" }}>
          {[...Array(3)].map((_,rep)=>(
            <div key={rep} style={{ display:"flex", gap:0, flexShrink:0 }}>
              {[
                { icon:"✅", text:"Zero hidden costs — ever" },
                { icon:"🛡",  text:"Pay Phase 2 ONLY if selected" },
                { icon:"🔒",  text:"Secure payment via Cashfree" },
                { icon:"⚡",  text:"Instant registration confirmation" },
                { icon:"⏱",  text:"Phase 1 result in 15 days — or full refund" },
              ].map(b=>(
                <div key={b.text+rep} style={{ display:"flex", alignItems:"center", gap:8, padding:"0 28px", borderRight:"1px solid rgba(34,197,94,.12)", whiteSpace:"nowrap" }}>
                  <span style={{ fontSize:16 }}>{b.icon}</span>
                  <span className="mont" style={{ fontWeight:700, fontSize:11, color:"#22C55E", letterSpacing:".04em" }}>{b.text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <style>{`@keyframes trustScroll{0%{transform:translateX(0)}100%{transform:translateX(-33.333%)}}`}</style>
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

          {/* Phase 1 */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <div style={{ background:"linear-gradient(90deg,#FF7A29,#D95E10)", borderRadius:10, padding:"5px 16px" }}>
              <span className="mont" style={{ fontSize:11, fontWeight:900, color:"#fff", letterSpacing:".1em" }}>PHASE 1 — ONLINE</span>
            </div>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(255,122,41,.4),transparent)" }}/>
            <span className="mont" style={{ fontSize:11, fontWeight:700, color:"rgba(255,122,41,.6)" }}>₹299 / ₹399</span>
          </div>
          <div className="steps-grid" style={{ marginBottom:28 }}>
            {STEPS.slice(0,3).map(s=>(
              <div key={s.num} className="card" style={{ padding:"22px 20px", position:"relative", overflow:"hidden", borderTop:`3px solid ${s.color}` }}>
                <div style={{ position:"absolute", right:-10, bottom:-20, fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:100, lineHeight:1, color:`${s.color}08`, userSelect:"none" }}>{s.num}</div>
                <div style={{ width:52, height:52, borderRadius:"50%", background:`${s.color}18`, border:`2px solid ${s.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:14, position:"relative", zIndex:1 }}>
                  {s.icon}
                  <div style={{ position:"absolute", top:-4, right:-4, width:20, height:20, borderRadius:"50%", background:s.color, border:"2px solid #06101E", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span className="mont" style={{ fontSize:10, fontWeight:900, color:"#fff" }}>{s.num}</span>
                  </div>
                </div>
                <div className="mont" style={{ fontWeight:900, fontSize:15, color:s.num===1?"#FF7A29":"#fff", marginBottom:8 }}>{s.title}</div>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.45)", lineHeight:1.65, marginBottom:12 }}>{s.desc}</p>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ background:`${s.color}18`, border:`1px solid ${s.color}44`, borderRadius:8, padding:"4px 10px" }}>
                    <span className="mont" style={{ fontSize:12, fontWeight:800, color:s.color }}>{s.price}</span>
                  </span>
                  {s.status&&s.num===1&&(
                    <span style={{ background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.3)", borderRadius:8, padding:"4px 10px", display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"blip 1s infinite" }}/>
                      <span className="mont" style={{ fontSize:10, fontWeight:800, color:"#22C55E" }}>OPEN NOW</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Phase divider */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(255,122,41,.4),rgba(232,178,61,.4))" }}/>
            <div style={{ background:"linear-gradient(135deg,#FF7A29,#E8B23D)", borderRadius:10, padding:"8px 18px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>⭐</span>
              <span className="mont" style={{ fontWeight:900, fontSize:10, color:"#fff", letterSpacing:".1em" }}>IF SELECTED → PAY ₹2,000 & ADVANCE TO PHASE 2</span>
            </div>
            <div style={{ flex:1, height:1, background:"linear-gradient(270deg,rgba(255,122,41,.4),rgba(232,178,61,.4))" }}/>
          </div>

          {/* Phase 2 */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <div style={{ background:"linear-gradient(90deg,#E8B23D,#C49A1E)", borderRadius:10, padding:"5px 16px" }}>
              <span className="mont" style={{ fontSize:11, fontWeight:900, color:"#000", letterSpacing:".1em" }}>PHASE 2 — PHYSICAL</span>
            </div>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(232,178,61,.4),transparent)" }}/>
            <span className="mont" style={{ fontSize:11, fontWeight:700, color:"rgba(232,178,61,.6)" }}>₹2,000 / ₹3,000 (only if selected)</span>
          </div>
          <div className="steps-grid">
            {STEPS.slice(3).map(s=>(
              <div key={s.num} className="card" style={{ padding:"22px 20px", position:"relative", overflow:"hidden", borderTop:`3px solid ${s.color}` }}>
                <div style={{ position:"absolute", right:-10, bottom:-20, fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:100, lineHeight:1, color:`${s.color}08`, userSelect:"none" }}>{s.num}</div>
                <div style={{ width:52, height:52, borderRadius:"50%", background:`${s.color}18`, border:`2px solid ${s.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:14, position:"relative", zIndex:1 }}>
                  {s.icon}
                  <div style={{ position:"absolute", top:-4, right:-4, width:20, height:20, borderRadius:"50%", background:s.color, border:"2px solid #06101E", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span className="mont" style={{ fontSize:10, fontWeight:900, color:s.num===6?"#000":"#fff" }}>{s.num}</span>
                  </div>
                </div>
                <div className="mont" style={{ fontWeight:900, fontSize:15, color:s.color, marginBottom:8 }}>{s.title}</div>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.45)", lineHeight:1.65, marginBottom:12 }}>{s.desc}</p>
                {s.status&&(
                  <span style={{ background:"rgba(232,178,61,.1)", border:"1px solid rgba(232,178,61,.3)", borderRadius:8, padding:"4px 10px" }}>
                    <span className="mont" style={{ fontSize:11, fontWeight:800, color:"#E8B23D" }}>{s.status}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PRICING
      ══════════════════════════════════════ */}
      <section style={{ padding:"clamp(60px,7vw,88px) 0", background:"#060C18" }}>
        <div className="W">
          <div className="slbl">Pricing</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4vw,42px)", color:"#fff", textTransform:"uppercase", marginBottom:6 }}>Complete Fee Structure</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.45)", marginBottom:36, maxWidth:520 }}>No fine print. No surprises. Here's exactly what you pay — and when.</p>
          <div className="price-grid">
            <div className="card" style={{ padding:24, borderTop:"3px solid #FF7A29" }}>
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
              <button className="btn-cta" style={{ width:"100%", justifyContent:"center", marginTop:20, fontSize:14, padding:14 }} onClick={()=>navigate("/register")}>Register Now →</button>
            </div>
            <div className="card" style={{ padding:24, borderTop:"3px solid #E8B23D" }}>
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
                <p style={{ fontSize:12, color:"rgba(34,197,94,.9)", lineHeight:1.6 }}><strong>Not selected?</strong> You pay nothing for Phase 2. Ever.</p>
              </div>
            </div>
          </div>
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
          SEASON TIMELINE  (NEW!)
      ══════════════════════════════════════ */}
      <section style={{ padding:"clamp(60px,7vw,88px) 0", background:"#06101E", position:"relative", overflow:"hidden" }}>
        {/* BG decor */}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 100%,rgba(255,122,41,.04) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div className="W" style={{ position:"relative", zIndex:1 }}>
          <div className="slbl">Season Journey</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4vw,44px)", color:"#fff", textTransform:"uppercase", marginBottom:6 }}>Season 5 Timeline</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.45)", marginBottom:48, maxWidth:540 }}>From registration to the trophy — here's the complete road map for BCPL Season 5.</p>

          {/* Timeline grid */}
          <div className="tl-grid" ref={tlRef}>
            {TIMELINE.map((t, i)=>(
              <div key={i} className="tl-card" style={{ position:"relative" }}>
                {/* Card */}
                <div className="tl-inner" style={{ margin:"0 5px", background:"linear-gradient(160deg,#0C1C30,#07101E)", border:`1.5px solid ${t.color}30`, borderTop:`3px solid ${t.color}`, borderRadius:14, padding:"16px 14px", textAlign:"center", position:"relative", overflow:"hidden" }}>
                  {/* Shimmer bg */}
                  <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 90% 50% at 50% 0%,${t.color}09 0%,transparent 65%)`, pointerEvents:"none" }}/>

                  {/* Step number */}
                  <div style={{ position:"absolute", top:10, left:12, width:18, height:18, borderRadius:"50%", background:`${t.color}22`, border:`1px solid ${t.color}55`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span className="mont" style={{ fontSize:9, fontWeight:900, color:t.color }}>{i+1}</span>
                  </div>

                  {/* Icon bubble */}
                  <div style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${t.color}20,${t.color}08)`, border:`1.5px solid ${t.color}40`, display:"flex", alignItems:"center", justifyContent:"center", margin:"6px auto 10px" }}>
                    {t.icon === "GAVEL" ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 3.5L20.5 9.5L18 12L12 6L14.5 3.5Z" fill={t.color+"40"} stroke={t.color} strokeWidth="1.8"/>
                        <path d="M6.5 11.5L12.5 17.5L10 20L4 14L6.5 11.5Z" fill={t.color+"30"} stroke={t.color} strokeWidth="1.8"/>
                        <path d="M10 8L16 14" stroke={t.color} strokeWidth="2"/>
                        <path d="M3 21L8 16" stroke={t.color} strokeWidth="2.5" strokeLinecap="round"/>
                        <rect x="16" y="1" width="5" height="8" rx="1.5" fill={t.color+"50"} stroke={t.color} strokeWidth="1.5" transform="rotate(45 18.5 5)"/>
                      </svg>
                    ) : (
                      <span style={{ fontSize:22 }}>{t.icon}</span>
                    )}
                  </div>

                  {/* Month pill */}
                  <div style={{ display:"inline-block", background:`${t.color}15`, border:`1px solid ${t.color}35`, borderRadius:20, padding:"2px 10px", marginBottom:6 }}>
                    <span className="mont" style={{ fontSize:9, fontWeight:800, color:t.color, letterSpacing:".06em" }}>{t.month}</span>
                  </div>

                  {/* Label */}
                  <div className="mont" style={{ fontWeight:900, fontSize:14, color:"#fff", marginBottom:10, lineHeight:1.2 }}>{t.label}</div>

                  {/* Details bullets */}
                  <div className="tl-details" style={{ display:"flex", flexDirection:"column", gap:5, textAlign:"left" }}>
                    {(t as any).details.map((d:string, di:number)=>(
                      <div key={di} style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:t.color, display:"inline-block", flexShrink:0, marginTop:5 }}/>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,.5)", lineHeight:1.5 }}>{d}</span>
                      </div>
                    ))}
                  </div>

                  {/* Done badge */}
                  {t.done && (
                    <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:4, background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.3)", borderRadius:6, padding:"2px 8px" }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E", display:"inline-block" }}/>
                      <span className="mont" style={{ fontSize:9, fontWeight:800, color:"#22C55E", letterSpacing:".08em" }}>ONGOING</span>
                    </div>
                  )}
                </div>

                {/* Arrow connector */}
                {i < TIMELINE.length-1 && (
                  <div className="tl-arrow" style={{ position:"absolute", top:"50%", right:-12, transform:"translateY(-50%)", zIndex:10 }}>
                    <div style={{ width:16, height:16, borderRadius:"50%", background:t.color, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:8, color:"#fff", fontWeight:900 }}>→</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Responsive styles */}
          <style>{`
            @media(min-width:768px){
              .tl-grid{position:relative;align-items:stretch;}
              .tl-grid::before{content:'';position:absolute;top:50%;left:0;right:0;height:2px;background:linear-gradient(90deg,#FF7A29,#E8B23D,#22C55E,#3B82F6,#6366F1);transform:translateY(-50%);z-index:0;opacity:.25;animation:railAnim 2.2s ease forwards;animation-delay:.6s;width:0;}
              .tl-grid.has-visible::before{width:100%;}
            }
            @media(max-width:767px){
              .tl-grid{display:grid;grid-template-columns:1fr;gap:12px;}
              .tl-grid::before{display:none;}
              .tl-inner{text-align:center!important;padding:18px 16px!important;}
              .tl-inner .tl-details{text-align:left;}
              .tl-arrow{display:none!important;}
            }
          `}</style>

          {/* CTA strip */}
          <div style={{ marginTop:44, padding:"24px 28px", background:"linear-gradient(135deg,rgba(255,122,41,.08),rgba(232,178,61,.04))", border:"1px solid rgba(255,122,41,.2)", borderRadius:20, display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:16 }}>
            <div>
              <div className="mont" style={{ fontWeight:900, fontSize:16, color:"#FF7A29", marginBottom:4 }}>Phase 1 Registrations Are Open Now!</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>Join before 28th February 2027. Start your journey for just ₹299.</div>
            </div>
            <button className="btn-cta" style={{ fontSize:14, padding:"13px 28px", flexShrink:0 }} onClick={()=>navigate("/register")}>Register Now — ₹299 →</button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          MATCH CENTER + POINTS TABLE — only if live data available
      ══════════════════════════════════════ */}
      {(liveMatches.length > 0 || liveTable.length > 0) && <section style={{ padding:"clamp(60px,7vw,88px) 0", background:"#060C18", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize:"48px 48px", pointerEvents:"none" }}/>
        <div className="W" style={{ position:"relative", zIndex:1 }}>
          <div className="slbl">Live Season</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4vw,44px)", color:"#fff", textTransform:"uppercase", marginBottom:8 }}>Match Center & Standings</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.45)", marginBottom:40, maxWidth:520 }}>Live scores, upcoming fixtures, and the Season 5 points table — all in one place.</p>

          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:24 }}>
            <style>{`@media(min-width:900px){.mc-grid{grid-template-columns:1fr 1fr!important;}}`}</style>
            <div className="mc-grid" style={{ display:"grid", gridTemplateColumns:"1fr", gap:24 }}>

              {/* ── Matches column ── */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <div className="mont" style={{ fontSize:11, fontWeight:800, letterSpacing:".12em", color:"rgba(255,255,255,.4)", textTransform:"uppercase" }}>Recent &amp; Upcoming</div>
                  <a href="/match-center" style={{ fontSize:12, color:"#FF7A29", textDecoration:"none", fontWeight:700 }}>View all →</a>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {(liveMatches.length > 0
                    ? liveMatches.slice(0,5).map((m:any) => ({
                        status:  m.status==="live"||m.status==="innings2" ? "LIVE" : m.status==="completed"||m.status==="abandoned" ? "RESULT" : "UPCOMING",
                        team1:   m.team1, t1Slug: TEAMS.find(t=>t.name===m.team1)?.slug||"", t1Color: TEAMS.find(t=>t.name===m.team1)?.color||"#64748B",
                        team2:   m.team2, t2Slug: TEAMS.find(t=>t.name===m.team2)?.slug||"", t2Color: TEAMS.find(t=>t.name===m.team2)?.color||"#64748B",
                        score1: "", score2: "",
                        info:    `Match ${m.match_no} · ${m.venue}`,
                        winner:  m.winner||"",
                      }))
                    : MATCHES
                  ).map((m,i)=>{
                    const isLive    = m.status === "LIVE";
                    const isUpcoming = m.status === "UPCOMING";
                    const isResult   = m.status === "RESULT";
                    return (
                      <div key={i} style={{ background:"linear-gradient(135deg,#0A1727,#060C18)", border:`1px solid ${isLive?"rgba(239,68,68,.35)":"rgba(255,255,255,.07)"}`, borderRadius:14, padding:"14px 16px", position:"relative", overflow:"hidden", cursor:"pointer", transition:"transform .2s,border-color .2s" }}
                        onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLElement).style.borderColor=isLive?"rgba(239,68,68,.5)":"rgba(255,255,255,.14)"; }}
                        onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform=""; (e.currentTarget as HTMLElement).style.borderColor=isLive?"rgba(239,68,68,.35)":"rgba(255,255,255,.07)"; }}>
                        {isLive && <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 0%,rgba(239,68,68,.06) 0%,transparent 70%)", pointerEvents:"none" }}/>}
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                          {/* Status badge */}
                          {isLive && (
                            <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(239,68,68,.15)", border:"1px solid rgba(239,68,68,.35)", borderRadius:20, padding:"2px 10px" }}>
                              <span style={{ width:6, height:6, borderRadius:"50%", background:"#EF4444", display:"inline-block", animation:"blip 1s infinite" }}/>
                              <span className="mont" style={{ fontSize:9, fontWeight:800, color:"#EF4444", letterSpacing:".1em" }}>LIVE</span>
                            </div>
                          )}
                          {isUpcoming && (
                            <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(59,130,246,.12)", border:"1px solid rgba(59,130,246,.25)", borderRadius:20, padding:"2px 10px" }}>
                              <span className="mont" style={{ fontSize:9, fontWeight:800, color:"#60A5FA", letterSpacing:".1em" }}>UPCOMING</span>
                            </div>
                          )}
                          {isResult && (
                            <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.25)", borderRadius:20, padding:"2px 10px" }}>
                              <span className="mont" style={{ fontSize:9, fontWeight:800, color:"#22C55E", letterSpacing:".1em" }}>RESULT</span>
                            </div>
                          )}
                          <span style={{ fontSize:10, color:"rgba(255,255,255,.3)" }}>{m.info}</span>
                        </div>
                        {/* Teams & scores */}
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          {/* Team 1 */}
                          <div style={{ flex:1, display:"flex", alignItems:"center", gap:8 }}>
                            <img src={`${L}${m.t1Slug}.png`} alt={m.team1} style={{ width:28, height:28, objectFit:"contain", flexShrink:0 }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
                            <div>
                              <div className="mont" style={{ fontSize:"clamp(11px,2vw,13px)", fontWeight:800, color: m.winner===m.team1?"#FF7A29":"#E2E8F0" }}>{m.team1.split(" ")[0]}</div>
                              {m.score1 && <div style={{ fontSize:12, fontWeight:700, color: m.winner===m.team1?"#FF7A29":"#94A3B8" }}>{m.score1}</div>}
                            </div>
                          </div>
                          {/* VS */}
                          <div style={{ textAlign:"center", flexShrink:0 }}>
                            <div className="mont" style={{ fontSize:12, fontWeight:900, color:"rgba(255,255,255,.25)" }}>VS</div>
                            {isResult && m.winner && (
                              <div style={{ fontSize:9, color:"#22C55E", fontWeight:700, marginTop:2 }}>WON</div>
                            )}
                          </div>
                          {/* Team 2 */}
                          <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, flexDirection:"row-reverse", textAlign:"right" }}>
                            <img src={`${L}${m.t2Slug}.png`} alt={m.team2} style={{ width:28, height:28, objectFit:"contain", flexShrink:0 }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
                            <div>
                              <div className="mont" style={{ fontSize:"clamp(11px,2vw,13px)", fontWeight:800, color: m.winner===m.team2?"#FF7A29":"#E2E8F0" }}>{m.team2.split(" ")[0]}</div>
                              {m.score2 && <div style={{ fontSize:12, fontWeight:700, color: m.winner===m.team2?"#FF7A29":"#94A3B8" }}>{m.score2}</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Points Table column ── */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <div className="mont" style={{ fontSize:11, fontWeight:800, letterSpacing:".12em", color:"rgba(255,255,255,.4)", textTransform:"uppercase" }}>Points Table — Season 5</div>
                  <a href="/points-table" style={{ fontSize:12, color:"#FF7A29", textDecoration:"none", fontWeight:700 }}>Full table →</a>
                </div>
                <div style={{ background:"linear-gradient(135deg,#0A1727,#060C18)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, overflow:"hidden" }}>
                  {/* Table header */}
                  <div style={{ display:"grid", gridTemplateColumns:"28px 1fr 30px 30px 30px 44px 50px", gap:0, padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,.07)" }}>
                    {["#","Team","P","W","L","Pts","NRR"].map(h=>(
                      <div key={h} className="mont" style={{ fontSize:9, fontWeight:800, color:"rgba(255,255,255,.3)", letterSpacing:".1em", textAlign: h==="Team"?"left":"center" }}>{h}</div>
                    ))}
                  </div>
                  {/* Rows */}
                  {(liveTable.length > 0
                    ? liveTable.map((r:any, i:number) => ({
                        rank: i+1,
                        team: r.team,
                        slug: TEAMS.find(t=>t.name===r.team)?.slug||"",
                        color: TEAMS.find(t=>t.name===r.team)?.color||"#64748B",
                        p: r.played, w: r.won, l: r.lost, nr: r.no_result,
                        pts: r.points,
                        nrr: (r.nrr>=0?"+":"")+Number(r.nrr).toFixed(3),
                      }))
                    : POINTS_TABLE
                  ).map((row, i, arr)=>(
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"28px 1fr 30px 30px 30px 44px 50px", gap:0, padding:"9px 14px", borderBottom: i<arr.length-1?"1px solid rgba(255,255,255,.04)":"none", background: i<4?"rgba(255,122,41,.025)":"transparent", position:"relative" }}>
                      {/* Qualification indicator */}
                      {i<4 && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background:`${row.color}60`, borderRadius:"0 2px 2px 0" }}/>}
                      {/* Rank */}
                      <div className="mont" style={{ fontSize:11, fontWeight:900, color: i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"rgba(255,255,255,.3)", textAlign:"center" }}>
                        {i===0?"🥇":i===1?"🥈":i===2?"🥉":row.rank}
                      </div>
                      {/* Team name with mini logo */}
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <img src={`${L}${row.slug}.png`} alt={row.team} style={{ width:18, height:18, objectFit:"contain", flexShrink:0 }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
                        <span className="mont" style={{ fontSize:11, fontWeight:700, color: i<4?"#E2E8F0":"#94A3B8", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{row.team.split(" ").slice(0,1).join(" ")} {row.team.split(" ").slice(1).join(" ")}</span>
                      </div>
                      {[row.p, row.w, row.l].map((v,j)=>(
                        <div key={j} style={{ fontSize:11, color:"#64748B", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>{v}</div>
                      ))}
                      {/* Points */}
                      <div className="mont" style={{ fontSize:13, fontWeight:900, color: i<4?"#FF7A29":"#94A3B8", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>{row.pts}</div>
                      {/* NRR */}
                      <div className="mont" style={{ fontSize:10, fontWeight:700, color: row.nrr.startsWith("+")?i<4?"#22C55E":"#16A34A":"#EF4444", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>{row.nrr}</div>
                    </div>
                  ))}
                  {/* Playoff qualification note */}
                  <div style={{ padding:"9px 14px", background:"rgba(255,122,41,.04)", borderTop:"1px solid rgba(255,122,41,.1)", display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:10, height:10, background:"rgba(255,122,41,.4)", borderRadius:2, flexShrink:0 }}/>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,.3)" }}>Top 4 qualify for playoffs</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>}

      {/* ══════════════════════════════════════
          10 FRANCHISE TEAMS
      ══════════════════════════════════════ */}
      <section style={{ padding:"clamp(60px,7vw,88px) 0", background:"#060C18" }}>
        <div className="W">
          <div className="slbl">Franchises</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(22px,4vw,40px)", color:"#fff", textTransform:"uppercase", marginBottom:8 }}>10 Franchise Teams</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.4)", marginBottom:36 }}>Get auctioned to one of these franchises. Your city, your team, your glory.</p>
          <div className="team-grid">
            {TEAMS.map(t=>(
              <div key={t.name} className="card" style={{ padding:"16px 12px", display:"flex", flexDirection:"column", gap:8, cursor:"pointer", transition:"transform .2s,border-color .2s", borderTop:`3px solid ${t.color}`, position:"relative", overflow:"hidden" }}
                onClick={()=>navigate("/teams")}
                onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-3px)")}
                onMouseLeave={e=>(e.currentTarget.style.transform="")}>
                {/* Watermark logo behind content */}
                <img
                  src={`${L}${t.slug}.png`}
                  alt=""
                  aria-hidden="true"
                  style={{ position:"absolute", bottom:-8, right:-8, width:72, height:72, objectFit:"contain", opacity:0.08, pointerEvents:"none", userSelect:"none" }}
                />
                {/* Team logo — try image, fallback to colored initials */}
                <TeamLogo slug={t.slug} name={t.name} color={t.color}/>
                <div style={{ position:"relative", zIndex:1 }}>
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
      <section style={{ padding:"clamp(60px,7vw,80px) 0", background:"#06101E" }}>
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
      <section style={{ padding:"clamp(60px,7vw,88px) 0", background:"#060C18" }}>
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
                  <span style={{ fontSize:18, color:faqOpen===i?"#FF7A29":"rgba(255,255,255,.3)", flexShrink:0, display:"inline-block", transform:faqOpen===i?"rotate(45deg)":"rotate(0)", transition:"transform .25s" }}>+</span>
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
            Join 2.5 lakh+ working professionals who have already taken the first step. Phase 1 closes 28 February 2027.
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button className="btn-cta" style={{ fontSize:16, padding:"16px 36px" }} onClick={()=>navigate("/register")}>🏏 Register Now — ₹299 →</button>
            <a className="btn-ghost" href="#how-it-works" style={{ fontSize:14, padding:"15px 28px" }}>Learn More</a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SPONSORS  — only show if sponsors exist
      ══════════════════════════════════════ */}
      {SPONSORS.length > 0 && <section style={{ padding:"clamp(40px,6vw,72px) 0", background:"#040810", borderTop:"1px solid rgba(255,255,255,.05)" }}>
        <div className="W">
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div className="slbl" style={{ justifyContent:"center" }}>Our Partners</div>
            <h3 className="mont" style={{ fontWeight:900, fontSize:"clamp(18px,3vw,30px)", color:"#fff", textTransform:"uppercase" }}>Season 5 Sponsors</h3>
          </div>

          {/* Title Sponsors */}
          <div style={{ marginBottom:32 }}>
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <span className="mont" style={{ fontSize:10, fontWeight:800, letterSpacing:".15em", color:"#FF7A29", textTransform:"uppercase" }}>Title Sponsors</span>
            </div>
            <div className="sp-row">
              {SPONSORS.filter(s=>s.tier==="Title Sponsor").map((s,i)=>(
                <div key={i} className="sp-card" style={{ background:"linear-gradient(135deg,#0A1727,#060C18)", border:"1.5px solid rgba(255,122,41,.25)", borderRadius:16, padding:"18px 28px", display:"flex", alignItems:"center", gap:14, minWidth:180 }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:"linear-gradient(135deg,#FF7A29,#C94E0E)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span className="mont" style={{ fontWeight:900, fontSize:16, color:"#fff" }}>{s.logo}</span>
                  </div>
                  <div>
                    <div className="mont" style={{ fontWeight:800, fontSize:14, color:"#fff" }}>{s.name}</div>
                    <div style={{ fontSize:10, color:"#FF7A29", marginTop:2, fontWeight:600 }}>{s.tier}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Associate Sponsors */}
          <div style={{ marginBottom:28 }}>
            <div style={{ textAlign:"center", marginBottom:14 }}>
              <span className="mont" style={{ fontSize:10, fontWeight:800, letterSpacing:".15em", color:"#E8B23D", textTransform:"uppercase" }}>Associate Sponsors</span>
            </div>
            <div className="sp-row">
              {SPONSORS.filter(s=>s.tier==="Associate").map((s,i)=>(
                <div key={i} className="sp-card" style={{ background:"#0A1727", border:"1px solid rgba(232,178,61,.15)", borderRadius:14, padding:"14px 20px", display:"flex", alignItems:"center", gap:10, minWidth:150 }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:"linear-gradient(135deg,#E8B23D44,#E8B23D11)", border:"1px solid rgba(232,178,61,.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span className="mont" style={{ fontWeight:900, fontSize:13, color:"#E8B23D" }}>{s.logo}</span>
                  </div>
                  <div>
                    <div className="mont" style={{ fontWeight:700, fontSize:13, color:"#F1F5F9" }}>{s.name}</div>
                    <div style={{ fontSize:9, color:"#E8B23D", marginTop:1, fontWeight:600 }}>{s.tier}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Partners */}
          <div>
            <div style={{ textAlign:"center", marginBottom:14 }}>
              <span className="mont" style={{ fontSize:10, fontWeight:800, letterSpacing:".15em", color:"rgba(255,255,255,.35)", textTransform:"uppercase" }}>Official Partners</span>
            </div>
            <div className="sp-row">
              {SPONSORS.filter(s=>s.tier==="Official Partner").map((s,i)=>(
                <div key={i} className="sp-card" style={{ background:"#060C18", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, padding:"10px 16px", display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:30, height:30, borderRadius:7, background:"rgba(255,255,255,.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span className="mont" style={{ fontWeight:900, fontSize:11, color:"rgba(255,255,255,.5)" }}>{s.logo}</span>
                  </div>
                  <span className="mont" style={{ fontWeight:700, fontSize:12, color:"rgba(255,255,255,.5)" }}>{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Become a sponsor CTA */}
          <div style={{ marginTop:36, textAlign:"center" }}>
            <a href="/sponsors" style={{ fontSize:13, color:"rgba(255,255,255,.35)", textDecoration:"none", borderBottom:"1px solid rgba(255,255,255,.12)", paddingBottom:2 }}>
              Interested in sponsoring BCPL Season 5?&nbsp;<span style={{ color:"#FF7A29" }}>Contact us →</span>
            </a>
          </div>
        </div>
      </section>}

      {/* ══════════════════════════════════════
          FOOTER  (FIXED)
      ══════════════════════════════════════ */}
      <BCPLFooter />

    </div>
  );
}

/* ── Team Logo with image fallback ── */
function TeamLogo({ slug, name, color }: { slug:string; name:string; color:string }) {
  const [err, setErr] = useState(false);
  const L = import.meta.env.BASE_URL + "bcpl-assets/logos/";
  if (!err) {
    return (
      <img src={`${L}${slug}.png`} alt={name} onError={()=>setErr(true)}
        style={{ width:44, height:44, borderRadius:10, objectFit:"contain", background:color+"22" }}/>
    );
  }
  return (
    <div style={{ width:44, height:44, borderRadius:10, background:color+"22", border:`1px solid ${color}44`, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ fontSize:18 }}>🏏</span>
    </div>
  );
}
