import React from "react";

const BASE = import.meta.env.BASE_URL;

const SOCIAL = [
  { label:"Instagram", href:"https://www.instagram.com/bcpl.t20",                          path:"M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" },
  { label:"YouTube",   href:"https://www.youtube.com/@bcplt20league",                      path:"M10,16.5V7.5L16,12M20,4.4C19.4,4.2 15.7,4 12,4C8.3,4 4.6,4.2 4,4.4C2.1,4.9 2,8.6 2,12C2,15.4 2.1,19.1 4,19.6C4.6,19.8 8.3,20 12,20C15.7,20 19.4,19.8 20,19.6C21.9,19.1 22,15.4 22,12C22,8.6 21.9,4.9 20,4.4Z" },
  { label:"X",         href:"https://x.com/BCPLT20League",                                 path:"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { label:"Facebook",  href:"https://www.facebook.com/bhartiyacorporatepremierleague",     path:"M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" },
];

const COL_LEAGUE  = [["About","/about"],["Teams","/teams"],["Schedule","/schedule"],["Points Table","/points-table"],["Sponsors","/sponsors"]];
const COL_REG     = [["Phase 1 Registration","/register"],["Eligibility Criteria","/eligibility"],["FAQ","/faq"],["Cricket Rules","/cricket-rulebook"],["Code of Conduct","/code-of-conduct"]];
const COL_LEGAL   = [["Privacy Policy","/privacy"],["Terms & Conditions","/terms"],["Refund Policy","/refunds"],["Contact Us","/contact"]];

const lnk: React.CSSProperties = { fontSize:13, color:"rgba(255,255,255,.38)", textDecoration:"none", display:"block" };

export function BCPLFooter() {
  return (
    <footer style={{ background:"#030710", borderTop:"1px solid rgba(255,255,255,.05)", padding:"clamp(32px,5vw,52px) 0 20px", fontFamily:"Montserrat,Inter,sans-serif" }}>
      <style>{`
        .bcpl-foot-wrap { max-width:1200px; margin:0 auto; padding:0 clamp(16px,4vw,40px); }
        .bcpl-foot-cols { display:grid; grid-template-columns:220px 1fr 1fr 1fr; gap:40px; margin-bottom:32px; }
        @media(max-width:900px){ .bcpl-foot-cols{grid-template-columns:1fr 1fr 1fr;} .bcpl-foot-brand{grid-column:1/-1;} }
        @media(max-width:540px){ .bcpl-foot-cols{grid-template-columns:1fr 1fr;} .bcpl-foot-brand{grid-column:1/-1;} }
        @media(max-width:380px){ .bcpl-foot-cols{grid-template-columns:1fr;} }
        .bcpl-foot-link:hover{ color:#FF7A29!important; }
        .bcpl-soc:hover{ border-color:#FF7A29!important; background:rgba(255,122,41,.12)!important; }
        .bcpl-foot-bottom{ display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
        .bcpl-foot-legal{ display:flex; gap:14px; align-items:center; flex-wrap:wrap; }
        @keyframes s5glow{0%,100%{opacity:1;text-shadow:0 0 6px rgba(232,178,61,0.6)}50%{opacity:.78;text-shadow:0 0 14px rgba(232,178,61,1),0 0 4px #fff}}
        @keyframes trophyBounce{0%,100%{transform:translateY(0) rotate(0deg)}30%{transform:translateY(-3px) rotate(-8deg)}60%{transform:translateY(-1px) rotate(5deg)}}
        .s5-badge-text{animation:s5glow 2.4s ease-in-out infinite}
        .s5-trophy{display:inline-block;animation:trophyBounce 2.8s ease-in-out infinite}
      `}</style>

      <div className="bcpl-foot-wrap">
        <div className="bcpl-foot-cols">
          {/* Brand */}
          <div className="bcpl-foot-brand">
            <a href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", marginBottom:12, flexWrap:"nowrap" }}>
              <img src={BASE + "bcpl-assets/bcpl-logo-white.png"} alt="BCPL"
                style={{ height:38, maxWidth:120, width:"auto", objectFit:"contain", display:"block", flexShrink:0 }}/>
              <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(232,178,61,0.1)", border:"1px solid rgba(232,178,61,0.4)", borderRadius:6, padding:"3px 9px", flexShrink:0, whiteSpace:"nowrap" }}>
                <span className="s5-trophy" style={{ fontSize:9 }}>🏆</span>
                <span className="s5-badge-text" style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:9, color:"#E8B23D", letterSpacing:".12em" }}>SEASON 5</span>
              </div>
            </a>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.3)", lineHeight:1.7, maxWidth:200, marginTop:0 }}>India's Biggest Corporate Cricket League. Season 5 — 2026–27.</p>
          </div>

          {/* League */}
          <div>
            <div style={{ fontWeight:800, fontSize:10, letterSpacing:".1em", color:"rgba(255,255,255,.35)", textTransform:"uppercase", marginBottom:12 }}>League</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {COL_LEAGUE.map(([l,h])=>(
                <a key={l} href={h} className="bcpl-foot-link" style={lnk}>{l}</a>
              ))}
            </div>
          </div>

          {/* Register */}
          <div>
            <div style={{ fontWeight:800, fontSize:10, letterSpacing:".1em", color:"rgba(255,255,255,.35)", textTransform:"uppercase", marginBottom:12 }}>Register</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {COL_REG.map(([l,h])=>(
                <a key={l} href={h} className="bcpl-foot-link" style={lnk}>{l}</a>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <div style={{ fontWeight:800, fontSize:10, letterSpacing:".1em", color:"rgba(255,255,255,.35)", textTransform:"uppercase", marginBottom:12 }}>Legal</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {COL_LEGAL.map(([l,h])=>(
                <a key={l} href={h} className="bcpl-foot-link" style={lnk}>{l}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,.05)", paddingTop:20 }}>
          {/* Social icons */}
          <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:18, flexWrap:"wrap" }}>
            {SOCIAL.map(s=>(
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label} className="bcpl-soc"
                style={{ width:38, height:38, borderRadius:9, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", color:"rgba(255,255,255,.6)", flexShrink:0, transition:"border-color .2s,background .2s" }}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d={s.path}/></svg>
              </a>
            ))}
          </div>

          <div className="bcpl-foot-bottom">
            <p style={{ fontSize:11, color:"rgba(255,255,255,.2)", fontWeight:600 }}>© 2026–27 BCPL — Bhartiya Corporate Premier League · All Rights Reserved.</p>
            <div className="bcpl-foot-legal">
              <a href="/privacy"  style={{ fontSize:11, color:"rgba(255,255,255,.2)", textDecoration:"none" }} className="bcpl-foot-link">Privacy Policy</a>
              <span style={{ color:"rgba(255,255,255,.1)", fontSize:10 }}>|</span>
              <a href="/terms"    style={{ fontSize:11, color:"rgba(255,255,255,.2)", textDecoration:"none" }} className="bcpl-foot-link">Terms</a>
              <span style={{ color:"rgba(255,255,255,.1)", fontSize:10 }}>|</span>
              <a href="/refunds"  style={{ fontSize:11, color:"rgba(255,255,255,.2)", textDecoration:"none" }} className="bcpl-foot-link">Refund Policy</a>
              <span style={{ color:"rgba(255,255,255,.1)", fontSize:10 }}>|</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,.15)" }}>Made with 🏏 in India</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
