import React from 'react';

const L = import.meta.env.BASE_URL + "bcpl-assets/logos/";

const ALL_TEAMS = [
  { name:"Rajasthan Scorchers", abbr:"RS", city:"Jaipur",     color:"#E97B6B", logo:`${L}rajasthan_scorchers.png` },
  { name:"Punjab Warriors",     abbr:"PW", city:"Chandigarh", color:"#DC2626", logo:`${L}punjab_warriors.png`     },
  { name:"Kolkata Tigers",      abbr:"KT", city:"Kolkata",    color:"#F97316", logo:`${L}kolkata_tigers.png`      },
  { name:"Lucknow Nawabs",      abbr:"LN", city:"Lucknow",    color:"#F59E0B", logo:`${L}lucknow_nawabs.png`      },
  { name:"Mumbai Mavericks",    abbr:"MM", city:"Mumbai",     color:"#3B82F6", logo:`${L}mumbai_mavericks.png`    },
  { name:"Hyderabad Hawks",     abbr:"HH", city:"Hyderabad",  color:"#16A34A", logo:`${L}hyderabad_hawks.png`     },
  { name:"Delhi Suryas",        abbr:"DS", city:"Delhi",      color:"#6366F1", logo:`${L}delhi_suryas.png`        },
  { name:"Chennai Thalaivas",   abbr:"CT", city:"Chennai",    color:"#2563EB", logo:`${L}chennai_thalaivas.png`   },
  { name:"Ahmedabad Lions",     abbr:"AL", city:"Ahmedabad",  color:"#B91C1C", logo:`${L}ahmedabad_lions.png`     },
  { name:"Bengaluru Rockets",   abbr:"BR", city:"Bengaluru",  color:"#EF4444", logo:`${L}bengaluru_rockets.png`   },
];
const GROUP_A = ALL_TEAMS.slice(0,5);
const GROUP_B = ALL_TEAMS.slice(5);

function TeamCard({ t, i }: { t:typeof ALL_TEAMS[0]; i:number }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"#0A1727", border:`1.5px solid ${hov ? t.color : "rgba(255,255,255,0.07)"}`, borderRadius:12, borderTop:`3px solid ${t.color}`, padding:"20px 18px", transition:"all 0.25s", boxShadow:hov?`0 12px 40px ${t.color}22,0 0 0 1px ${t.color}33`:"none", cursor:"pointer", position:"relative", overflow:"hidden" }}>
      {/* Watermark logo */}
      <img src={t.logo} alt={t.name} style={{ position:"absolute", right:"-6%", bottom:"-6%", width:"72%", height:"72%", objectFit:"contain", opacity:0.055, pointerEvents:"none", transition:"opacity 0.3s", filter:"grayscale(20%)" }} />

      {/* Top row: logo badge + name */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, position:"relative", zIndex:1 }}>
        <div style={{ width:52, height:52, background:"rgba(255,255,255,0.96)", borderRadius:14, border:`2px solid ${t.color}55`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${t.color}44` }}>
          <img src={t.logo} alt={t.name} style={{ width:"87%", height:"87%", objectFit:"contain" }} />
        </div>
        <div>
          <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:16, color:"#fff", lineHeight:1.2, marginBottom:4 }}>{t.name}</div>
          <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:11, color:t.color, letterSpacing:".08em", textTransform:"uppercase" }}>{t.city}</div>
        </div>
      </div>

      {/* Season tag */}
      <div style={{ marginBottom:14, position:"relative", zIndex:1 }}>
        <span style={{ background:`${t.color}12`, border:`1px solid ${t.color}30`, borderRadius:8, color:t.color, fontSize:10, fontWeight:700, padding:"3px 10px", fontFamily:"Montserrat,sans-serif", letterSpacing:".06em" }}>SEASON 5 FRANCHISE</span>
      </div>

      {/* View squad link */}
      <div style={{ display:"flex", alignItems:"center", gap:6, color:"#FF7A29", fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:12, position:"relative", zIndex:1 }}>
        <span>View Squad</span>
        <span style={{ transition:"transform 0.2s", transform:hov?"translateX(4px)":"none" }}>→</span>
      </div>
    </div>
  );
}


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
};

export function Teams() {
  const [menuOpen, setMenuOpen] = React.useState(false);

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
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:'Montserrat',sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }

        /* ── MOBILE RESPONSIVE FIXES ── */
        @media(max-width:639px){
          .float-reg-btn{bottom:16px;right:16px;padding:12px 16px;font-size:12px;}
        }
      `}</style>

      {/* TICKER */}
      <div style={{ background:"linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A)", overflow:"hidden", height:34, display:"flex", alignItems:"center" }}>
        <div style={{ display:"flex", whiteSpace:"nowrap", animation:"tickerScroll 32s linear infinite" }}>
          {[0,1].map(i=><span key={i} style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:11, letterSpacing:".1em", color:"#fff", paddingRight:80 }}>🏏 SEASON 5 OPEN · 10 FRANCHISE TEAMS · ₹6 CR PRIZE POOL · SOURAV GANGULY · #OfficeSeStadiumtak &nbsp;&nbsp; 🏏 SEASON 5 OPEN · 10 FRANCHISE TEAMS · ₹6 CR PRIZE POOL &nbsp;&nbsp;</span>)}
        </div>
      </div>

      {/* NAVBAR */}
      <nav style={{ position:"sticky", top:0, zIndex:200, background:"rgba(6,16,30,0.97)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div className="wrap" style={{ height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:22, color:"#FF7A29" }}>BCPL</span>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:22, color:"#fff" }}>T20</span>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:9, color:"rgba(255,122,41,0.6)", marginLeft:6, letterSpacing:".1em" }}>SEASON 5</span>
          </div>
          <div className="desk-nav" style={{ alignItems:"center", gap:20 }}>
            {["Home","Match Center","Teams","Sponsors","Photos","Videos","About","FAQ","Contact"].map(l=>(
              <a key={l} className={`nav-link${l==="Teams"?" active":""}`} href={ROUTE_MAP[l]||"#"}>{l}</a>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button className="btn-orange" style={{ fontSize:12, padding:"9px 18px" }}>REGISTER NOW →</button>
            <button
              className="ham-btn"
              onClick={() => setMenuOpen(true)}
              style={{ flexDirection:"column", gap:5, background:"none", border:"none", cursor:"pointer", padding:8 }}
            >
              <span style={{ display:"block", width:22, height:2, background:"#fff", borderRadius:12 }}/>
              <span style={{ display:"block", width:22, height:2, background:"#fff", borderRadius:12 }}/>
              <span style={{ display:"block", width:22, height:2, background:"#fff", borderRadius:12 }}/>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mob-menu">
          <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
          <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:24, marginBottom:8 }}>
            <span style={{ color:"#FF7A29" }}>BCPL</span><span style={{ color:"#fff", marginLeft:3 }}>T20</span>
          </div>
          {[["🏠 Home","Home"],["🔴 Match Center","Match Center"],["🏏 Teams","Teams"],["🤝 Sponsors","Sponsors"],["📷 Photos","Photos"],["▶️ Videos","Videos"],["ℹ️ About","About"],["❓ FAQ","FAQ"],["✉️ Contact","Contact"]].map(([label, key])=>(
            <a key={key} href={ROUTE_MAP[key]||"#"} className="mob-menu-link" onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <button className="btn-orange" style={{ marginTop:16, height:52, fontSize:15, borderRadius:14, width:"100%" }}>📝 REGISTER NOW →</button>
        </div>
      )}

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
          <div style={{ display:"flex", justifyContent:"center", flexWrap:"wrap", gap:10, marginBottom:0 }}>
            {ALL_TEAMS.map(t=>(
              <div key={t.abbr} style={{ width:48, height:48, background:"rgba(255,255,255,0.96)", borderRadius:14, padding:5, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px ${t.color}44`, border:`2px solid ${t.color}55` }}>
                <img src={t.logo} alt={t.abbr} style={{ width:"88%", height:"88%", objectFit:"contain" }} />
              </div>
            ))}
          </div>
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

      {/* GROUP A */}
      <section style={{ padding:"0 0 56px" }}>
        <div className="wrap">
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(255,122,41,0.7),transparent)" }}/>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:12, color:"#FF7A29", letterSpacing:".15em" }}>GROUP A</span>
            <div style={{ flex:1, height:1, background:"linear-gradient(270deg,rgba(255,122,41,0.7),transparent)" }}/>
          </div>
          <div className="teams-grid">
            {GROUP_A.map((t,i)=><TeamCard key={t.abbr} t={t} i={i}/>)}
          </div>
        </div>
      </section>

      {/* GROUP B */}
      <section style={{ padding:"0 0 56px" }}>
        <div className="wrap">
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(255,122,41,0.7),transparent)" }}/>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:12, color:"#FF7A29", letterSpacing:".15em" }}>GROUP B</span>
            <div style={{ flex:1, height:1, background:"linear-gradient(270deg,rgba(255,122,41,0.7),transparent)" }}/>
          </div>
          <div className="teams-grid">
            {GROUP_B.map((t,i)=><TeamCard key={t.abbr} t={t} i={i}/>)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"0 0 80px" }}>
        <div className="wrap">
          <div style={{ background:"#0A1727", border:"1px solid rgba(255,122,41,0.2)", borderRadius:12, borderTop:"3px solid #FF7A29", padding:"clamp(32px,5vw,52px)", textAlign:"center" }}>
            <h2 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:"clamp(20px,3.5vw,36px)", color:"#fff", marginBottom:10, textTransform:"uppercase" }}>Want to play for one of these franchises?</h2>
            <p style={{ fontFamily:"Inter,sans-serif", color:"rgba(255,255,255,0.45)", fontSize:15, lineHeight:1.7, maxWidth:460, margin:"0 auto 28px" }}>
              Register today and get your shot at Season 5. 50+ cities, all roles open.
            </p>
            <button className="btn-orange" style={{ fontSize:14, padding:"14px 36px" }}>REGISTER NOW — ₹299 →</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:"#040A15", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"clamp(40px,6vw,56px) 0 0" }}>
        <div className="wrap">
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", gap:32, marginBottom:40 }}>
            <div>
              <div style={{ display:"flex", alignItems:"baseline", gap:2, marginBottom:8 }}>
                <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:22, color:"#FF7A29" }}>BCPL</span>
                <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:22, color:"#fff" }}>T20</span>
              </div>
              <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, color:"#E8B23D", letterSpacing:".12em", textTransform:"uppercase", marginBottom:8 }}>#OfficeSeStadiumtak</div>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:13, color:"rgba(255,255,255,0.3)", lineHeight:1.6 }}>India's biggest corporate T20 league.<br/>Season 5 · BCPL Pvt. Ltd.</div>
            </div>
            {[
              {h:"League",links:[["About","/about"],["Teams","/teams"],["Sponsors","/sponsors"],["Schedule","/schedule"]]},
              {h:"Help",links:[["FAQ","/faq"],["Contact","/contact"],["Eligibility","/eligibility"],["Rulebook","/cricket-rulebook"]]},
              {h:"Legal",links:[["Terms","/terms"],["Privacy","/privacy"],["Refunds","/refunds"],["Code of Conduct","/code-of-conduct"]]}
            ].map(col=>(
              <div key={col.h}>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:9, letterSpacing:".12em", color:"rgba(255,255,255,0.25)", textTransform:"uppercase", marginBottom:12 }}>{col.h}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {col.links.map(([l,href])=><a key={l} href={href} className="footer-link">{l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"18px 0", display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,255,255,0.2)" }}>© 2026 BCPL Pvt. Ltd. · All Rights Reserved</span>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, color:"#FF7A29" }}>#OfficeSeStadiumtak</span>
          </div>
        </div>
      </footer>
      {/* ── FLOATING REGISTER BUTTON ── */}
      <a className="float-reg-btn float-reg-pulse" href="/register" style={{textDecoration:"none"}}>🏏 REGISTER NOW →</a>
    </div>
  );
}
