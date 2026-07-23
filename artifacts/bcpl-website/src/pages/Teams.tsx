import React from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getTeams, type ApiTeam } from '../lib/api';

/* Canonical display order (Group A = first 5, Group B = last 5) */
const CANON_ORDER = [
  "Rajasthan Scorchers", "Punjab Warriors", "Kolkata Tigers", "Lucknow Nawabs", "Mumbai Mavericks",
  "Hyderabad Hawks", "Delhi Suryas", "Chennai Thalaivas", "Ahmedabad Lions", "Bengaluru Rockets",
];

const asset = (url: string) =>
  !url ? "" : url.startsWith("data:") || url.startsWith("http") ? url : import.meta.env.BASE_URL + url.replace(/^\//, "");

const abbrOf = (name: string) => name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

type CardTeam = { slug: string; name: string; abbr: string; city: string; color: string; logo: string; playerCount: number };

function TeamCard({ t }: { t: CardTeam }) {
  const [hov, setHov] = React.useState(false);
  return (
    <a href={`/team/${t.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{ background:"#0A1727", border:`1.5px solid ${hov ? t.color : "rgba(255,255,255,0.07)"}`, borderRadius:12, borderTop:`3px solid ${t.color}`, padding:"20px 18px", transition:"all 0.25s", boxShadow:hov?`0 12px 40px ${t.color}22,0 0 0 1px ${t.color}33`:"none", cursor:"pointer", position:"relative", overflow:"hidden" }}>
        {/* Watermark logo */}
        {t.logo && <img src={t.logo} alt={t.name} style={{ position:"absolute", right:"-6%", bottom:"-6%", width:"72%", height:"72%", objectFit:"contain", opacity:0.055, pointerEvents:"none", transition:"opacity 0.3s", filter:"grayscale(20%)" }} />}

        {/* Top row: logo badge + name */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, position:"relative", zIndex:1 }}>
          <div style={{ width:52, height:52, background:"rgba(255,255,255,0.96)", borderRadius:14, border:`2px solid ${t.color}55`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${t.color}44` }}>
            {t.logo
              ? <img src={t.logo} alt={t.name} style={{ width:"87%", height:"87%", objectFit:"contain" }} />
              : <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:16, color:t.color }}>{t.abbr}</span>}
          </div>
          <div>
            <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:16, color:"#fff", lineHeight:1.2, marginBottom:4 }}>{t.name}</div>
            <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:11, color:t.color, letterSpacing:".08em", textTransform:"uppercase" }}>{t.city}</div>
          </div>
        </div>

        {/* Season tag */}
        <div style={{ marginBottom:14, position:"relative", zIndex:1 }}>
          <span style={{ background:`${t.color}12`, border:`1px solid ${t.color}30`, borderRadius:8, color:t.color, fontSize:10, fontWeight:700, padding:"3px 10px", fontFamily:"Montserrat,sans-serif", letterSpacing:".06em" }}>
            {t.playerCount > 0 ? `SQUAD · ${t.playerCount} PLAYER${t.playerCount > 1 ? "S" : ""}` : "SEASON 5 FRANCHISE"}
          </span>
        </div>

        {/* View squad link */}
        <div style={{ display:"flex", alignItems:"center", gap:6, color:"#FF7A29", fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:12, position:"relative", zIndex:1 }}>
          <span>View Squad</span>
          <span style={{ transition:"transform 0.2s", transform:hov?"translateX(4px)":"none" }}>→</span>
        </div>
      </div>
    </a>
  );
}


export function Teams() {
  const [teams, setTeams] = React.useState<CardTeam[] | null>(null);
  const [loadErr, setLoadErr] = React.useState("");

  React.useEffect(() => {
    getTeams(5)
      .then(d => {
        const ordered = [...(d.teams || [])].sort((a, b) => {
          const ia = CANON_ORDER.indexOf(a.name), ib = CANON_ORDER.indexOf(b.name);
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.name.localeCompare(b.name);
        });
        setTeams(ordered.map((t: ApiTeam) => ({
          slug: t.slug, name: t.name, abbr: abbrOf(t.name), city: t.city,
          color: t.color || "#FF7A29", logo: asset(t.logoUrl), playerCount: t.playerCount || 0,
        })));
      })
      .catch(e => setLoadErr(e?.message || "Could not load teams"));
  }, []);

  const groupA = teams ? teams.slice(0, 5) : [];
  const groupB = teams ? teams.slice(5) : [];

  return (
    <div style={{ background:"#06101E", color:"#fff", minHeight:"100vh", overflowX:"hidden", fontFamily:"Inter,sans-serif" }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .wrap{max-width:1280px;margin:0 auto;padding:0 16px;}
        @media(min-width:640px){.wrap{padding:0 24px}}
        @media(min-width:1024px){.wrap{padding:0 40px}}
        .desk-nav{display:none;}
        .ham-btn{display:flex!important;}
        @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}}
        .teams-grid{display:grid;grid-template-columns:1fr;gap:16px;}
        @media(min-width:640px){.teams-grid{grid-template-columns:repeat(2,1fr);}}
        @media(min-width:1100px){.teams-grid{grid-template-columns:repeat(3,1fr);}}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes shimOrange{0%{background-position:-200% center}100%{background-position:200% center}}
        .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimGold 3s linear infinite;}
        .nav-link{font-family:Montserrat,sans-serif;font-weight:700;font-size:12px;letter-spacing:.08em;color:rgba(255,255,255,0.55);text-decoration:none;text-transform:uppercase;transition:color .2s;}
        .nav-link:hover,.nav-link.active{color:#FF7A29;}
        .btn-orange{background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;font-size:12px;letter-spacing:.06em;cursor:pointer;padding:10px 18px;transition:opacity .2s;text-transform:uppercase;}
        .btn-orange:hover{opacity:.88;}
        .footer-link{color:rgba(255,255,255,0.45);font-size:13px;font-family:Inter,sans-serif;text-decoration:none;transition:color .2s;}
        .footer-link:hover{color:#FF7A29;}

        /* ── MOBILE MENU ── */
        .mob-menu{position:fixed;top:0;left:0;right:0;bottom:0;background:#06101E;z-index:999;display:flex;flex-direction:column;padding:80px 28px 40px;gap:24px;overflow-y:auto;}
        .mob-menu-link{font-family:Montserrat,sans-serif;font-weight:800;font-size:18px;letter-spacing:0.06em;color:rgba(255,255,255,0.8);text-transform:uppercase;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:20px;transition:color 0.2s;text-decoration:none;display:block;}
        .mob-menu-link:hover{color:#FF7A29;}
        .close-btn{position:fixed;top:20px;right:24px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;z-index:1000;}

        /* ── LIVE STANDINGS STRIP ── */
        .standings-scroll{overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;scrollbar-width:thin;}

        /* ── FLOATING REGISTER BUTTON ── */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:'Montserrat',sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }

        /* ── MOBILE RESPONSIVE FIXES ── */
        @media(max-width:639px){
          .float-reg-btn{bottom:16px;right:16px;padding:12px 16px;font-size:12px;}
        }
      `}</style>

      <SiteHeader active="Teams" />

      {/* HERO */}
      <section style={{ padding:"clamp(60px,8vw,80px) 0 48px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 60% at 50% 0%,rgba(255,122,41,0.06) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div className="wrap" style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:11, letterSpacing:".16em", color:"#FF7A29", textTransform:"uppercase", display:"inline-flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <span style={{ width:24, height:2, background:"#FF7A29", display:"inline-block" }}/>The Franchises<span style={{ width:24, height:2, background:"#FF7A29", display:"inline-block" }}/>
          </div>
          <h1 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"clamp(38px,7vw,80px)", lineHeight:1.04, marginBottom:14 }}>
            <span style={{ display:"block", color:"#fff" }}>TEN CITIES.</span>
            <span className="shimmer-gold" style={{ display:"block" }}>ONE DREAM.</span>
          </h1>
          <p style={{ fontFamily:"Inter,sans-serif", color:"rgba(255,255,255,0.45)", fontSize:16, lineHeight:1.7, maxWidth:480, margin:"0 auto 36px" }}>
            Get picked and represent your city in BCPL Season 5.
          </p>

          {/* Logo parade */}
          {teams && (
            <div style={{ display:"flex", justifyContent:"center", flexWrap:"wrap", gap:10, marginBottom:0 }}>
              {teams.map(t=>(
                <a key={t.slug} href={`/team/${t.slug}`} style={{ width:48, height:48, background:"rgba(255,255,255,0.96)", borderRadius:14, padding:5, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px ${t.color}44`, border:`2px solid ${t.color}55`, textDecoration:"none" }}>
                  {t.logo
                    ? <img src={t.logo} alt={t.abbr} style={{ width:"88%", height:"88%", objectFit:"contain" }} />
                    : <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:13, color:t.color }}>{t.abbr}</span>}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SEASON INFO STRIP */}
      <section style={{ padding:"0 0 48px" }}>
        <div className="wrap">
          <div style={{ background:"rgba(255,122,41,0.06)", border:"1px solid rgba(255,122,41,0.15)", borderRadius:12, padding:"14px 20px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#FF7A29", flexShrink:0 }}/>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:13, color:"#FF7A29" }}>SEASON 5</span>
            <span style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>·</span>
            <span style={{ fontFamily:"Inter,sans-serif", fontSize:13, color:"rgba(255,255,255,0.6)" }}>10 franchise teams · Squads announced after auction in Aug 2026 · Tournament begins Sep 2026</span>
          </div>
        </div>
      </section>

      {/* LOADING / ERROR */}
      {!teams && !loadErr && (
        <section style={{ padding:"0 0 56px" }}>
          <div className="wrap" style={{ textAlign:"center", color:"rgba(255,255,255,0.4)", fontFamily:"Inter,sans-serif", fontSize:14, padding:"40px 0" }}>
            Loading teams…
          </div>
        </section>
      )}
      {loadErr && (
        <section style={{ padding:"0 0 56px" }}>
          <div className="wrap">
            <div style={{ background:"rgba(232,73,63,0.08)", border:"1px solid rgba(232,73,63,0.3)", borderRadius:12, padding:"18px 20px", textAlign:"center", color:"#F87171", fontFamily:"Inter,sans-serif", fontSize:14 }}>
              Could not load teams right now — please refresh the page to try again.
            </div>
          </div>
        </section>
      )}

      {/* GROUP A */}
      {teams && groupA.length > 0 && (
        <section style={{ padding:"0 0 56px" }}>
          <div className="wrap">
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
              <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(255,122,41,0.7),transparent)" }}/>
              <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:12, color:"#FF7A29", letterSpacing:".15em" }}>GROUP A</span>
              <div style={{ flex:1, height:1, background:"linear-gradient(270deg,rgba(255,122,41,0.7),transparent)" }}/>
            </div>
            <div className="teams-grid">
              {groupA.map(t=><TeamCard key={t.slug} t={t}/>)}
            </div>
          </div>
        </section>
      )}

      {/* GROUP B */}
      {teams && groupB.length > 0 && (
        <section style={{ padding:"0 0 56px" }}>
          <div className="wrap">
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
              <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(255,122,41,0.7),transparent)" }}/>
              <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:12, color:"#FF7A29", letterSpacing:".15em" }}>GROUP B</span>
              <div style={{ flex:1, height:1, background:"linear-gradient(270deg,rgba(255,122,41,0.7),transparent)" }}/>
            </div>
            <div className="teams-grid">
              {groupB.map(t=><TeamCard key={t.slug} t={t}/>)}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding:"0 0 80px" }}>
        <div className="wrap">
          <div style={{ background:"#0A1727", border:"1px solid rgba(255,122,41,0.2)", borderRadius:12, borderTop:"3px solid #FF7A29", padding:"clamp(32px,5vw,52px)", textAlign:"center" }}>
            <h2 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"clamp(20px,3.5vw,36px)", color:"#fff", marginBottom:10, textTransform:"uppercase" }}>Want to play for one of these franchises?</h2>
            <p style={{ fontFamily:"Inter,sans-serif", color:"rgba(255,255,255,0.45)", fontSize:15, lineHeight:1.7, maxWidth:460, margin:"0 auto 28px" }}>
              Register today and get your shot at Season 5. 50+ cities, all roles open.
            </p>
            <a href="/register" className="btn-orange" style={{ fontSize:14, padding:"14px 36px", textDecoration:"none", display:"inline-block" }}>REGISTER NOW — ₹299 →</a>
          </div>
        </div>
      </section>

      <BCPLFooter />
      {/* ── FLOATING REGISTER BUTTON ── */}
      <a className="float-reg-btn float-reg-pulse" href="/register" style={{textDecoration:"none"}}>🏏 REGISTER NOW →</a>
    </div>
  );
}
