import React, { useState } from "react";
import { BCPLFooter } from '../components/BCPLFooter';

const L = import.meta.env.BASE_URL + "bcpl-assets/logos/";

/* ── DEMO STATES ── */
type Phase = "p1_registered" | "p1_video" | "p2_selected" | "auction" | "signed";
const DEMO_PHASES: {id:Phase;label:string;short:string;color:string}[] = [
  { id:"p1_registered", label:"P1 Registered",     short:"P1 REG",  color:"#FF7A29" },
  { id:"p1_video",      label:"Video Uploaded",     short:"VIDEO",   color:"#FF7A29" },
  { id:"p2_selected",   label:"P2 Selected",        short:"P2 REG",  color:"#E8B23D" },
  { id:"auction",       label:"Auction Shortlisted", short:"AUCTION", color:"#E8B23D" },
  { id:"signed",        label:"Team Signed! 🏆",    short:"SIGNED",  color:"#22C55E" },
];

/* ── PLAYER DATA ── */
const PLAYER = {
  name:      "Rahul Sharma",
  initials:  "RS",
  email:     "rahul.sharma@tcsmumbai.com",
  phone:     "+91 98765 43210",
  company:   "Tata Consultancy Services, Mumbai",
  role:      "Batsman",
  roleIcon:  "🏏",
  city:      "Mumbai",
  dob:       "15 Mar 1994",
  age:       32,
  ref:       "BCPL-S5-7432",
  regDate:   "12 Feb 2026",
  paid:      299,
  videoUrl:  "2-min batting drill · uploaded 14 Feb 2026",
  p2City:    "Mumbai · Wankhede Ground",
  p2Date:    "22 Mar 2026",
  p2Paid:    2000,
  team:      "Mumbai Mavericks",
  teamSlug:  "mumbai_mavericks",
  teamColor: "#3B82F6",
  contract:  "₹8,50,000",
};

/* ── JOURNEY NODES ── */
function getNodes(phase: Phase) {
  const done  = (label:string, receipt?:string) => ({ label, state:"done"    as const, receipt });
  const active= (label:string) => ({ label, state:"active"  as const, receipt: undefined as string|undefined });
  const wait  = (label:string) => ({ label, state:"waiting" as const, receipt: undefined as string|undefined });
  const map: Record<Phase, Array<{label:string;state:"done"|"active"|"waiting";receipt?:string}>> = {
    p1_registered: [active("P1 Registration"),                         wait("Video Upload"), wait("P2 Registration"),                              wait("Franchise Auction"), wait("Team Signed")],
    p1_video:      [done("P1 Registration","register/p1-receipt"),     active("Video Upload"), wait("P2 Registration"),                            wait("Franchise Auction"), wait("Team Signed")],
    p2_selected:   [done("P1 Registration","register/p1-receipt"),     done("Video Upload"), active("P2 Registration"),                            wait("Franchise Auction"), wait("Team Signed")],
    auction:       [done("P1 Registration","register/p1-receipt"),     done("Video Upload"), done("P2 Registration","register/p2-receipt"),         active("Franchise Auction"), wait("Team Signed")],
    signed:        [done("P1 Registration","register/p1-receipt"),     done("Video Upload"), done("P2 Registration","register/p2-receipt"),         done("Franchise Auction"), active("Team Signed")],
  };
  return map[phase];
}

/* ── STATUS BANNER CONFIG ── */
function getBanner(phase: Phase) {
  const M: Record<Phase, { color:string; bg:string; icon:string; title:string; body:string }> = {
    p1_registered: { color:"#FF7A29", bg:"rgba(255,122,41,0.08)", icon:"📝", title:"Registration Complete — Upload Your Video", body:`You've registered as a Batsman for BCPL Season 5. Next step: upload your 2-minute trial video. Deadline: 28 Feb 2026.` },
    p1_video:      { color:"#FF7A29", bg:"rgba(255,122,41,0.08)", icon:"🎬", title:"Video Submitted — Scout Review in Progress", body:`Your video is with BCCI-certified scouts. Review takes up to 7 working days. You'll receive an email & SMS.` },
    p2_selected:   { color:"#E8B23D", bg:"rgba(232,178,61,0.08)", icon:"⭐", title:"Congratulations! Selected for Phase 2 Trial", body:`Report to ${PLAYER.p2City} on ${PLAYER.p2Date} for your physical trial. Phase 2 fee of ₹2,000 due before trial.` },
    auction:       { color:"#E8B23D", bg:"rgba(232,178,61,0.08)", icon:"🔨", title:"You Are Shortlisted for Auction!", body:`All 10 franchise coaches have reviewed your trial. Your profile is live for the Season 5 Franchise Auction. Base price: ₹2L · Max: ₹20L.` },
    signed:        { color:"#22C55E", bg:"rgba(34,197,94,0.08)",  icon:"🏆", title:`You've Been Signed by Mumbai Mavericks!`, body:`Contract value: ${PLAYER.contract}. Welcome to the squad. Report to your franchise on 15 Sep 2026 for pre-season camp.` },
  };
  return M[phase];
}

export function PlayerProfile() {
  const [phase, setPhase] = useState<Phase>("p1_video");
  const [menuOpen, setMenuOpen] = useState(false);
  const nodes  = getNodes(phase);
  const banner = getBanner(phase);

  return (
    <div style={{ background:"#06101E", minHeight:"100vh", color:"#F0EDE8", fontFamily:"'Inter',sans-serif", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .wrap{max-width:1280px;margin:0 auto;padding:0 16px;}
        @media(min-width:640px){.wrap{padding:0 24px}}
        @media(min-width:1024px){.wrap{padding:0 40px}}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.2),0 0 0 1px rgba(255,122,41,0.4)}50%{box-shadow:0 0 32px rgba(255,122,41,0.5),0 0 0 1px #FF7A29}}
        @keyframes checkPop{0%{transform:scale(0)}80%{transform:scale(1.2)}100%{transform:scale(1)}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes shimOrange{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimGold 3s linear infinite;}
        .shimmer-orange{background:linear-gradient(90deg,#FF7A29,#FFB347,#FF7A29);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimOrange 3s linear infinite;}
        .card{background:#0A1727;border:1px solid rgba(255,255,255,0.07);border-radius:12px;}
        .btn-orange{background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;font-size:12px;letter-spacing:.06em;cursor:pointer;padding:10px 18px;transition:opacity .2s;text-transform:uppercase;}
        .btn-orange:hover{opacity:.88;}
        .btn-ghost{background:transparent;border:1.5px solid rgba(255,255,255,0.18);border-radius:12px;color:rgba(255,255,255,0.65);font-family:Montserrat,sans-serif;font-weight:700;font-size:12px;letter-spacing:.06em;cursor:pointer;padding:10px 18px;text-transform:uppercase;transition:border-color .2s,color .2s;}
        .btn-ghost:hover{border-color:#FF7A29;color:#FF7A29;}
        .row-item{display:flex;justify-content:space-between;align-items:flex-start;gap:12;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);}
        .row-item:last-child{border-bottom:none;}
        @media(max-width:1023px){.profile-layout{flex-direction:column!important;}.profile-left{width:100%!important;min-width:0!important;}.status-btn{margin-left:0!important;width:100%;margin-top:10px!important;}
      `}</style>

      <div style={{ position:'sticky', top:0, zIndex:300 }}>
      {/* TICKER */}
      <div style={{ background:"linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A)", overflow:"hidden", height:34, display:"flex", alignItems:"center" }}>
        <div style={{ display:"flex", whiteSpace:"nowrap", animation:"tickerScroll 32s linear infinite" }}>
          {[0,1].map(i => <span key={i} style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:11, letterSpacing:".1em", color:"#fff", paddingRight:80 }}>🏏 BCPL T20 · SEASON 5 · REF: BCPL-S5-7432 · PLAYER DASHBOARD · #OfficeSeStadiumtak &nbsp;&nbsp; 🏏 BCPL T20 · SEASON 5 · REF: BCPL-S5-7432 · PLAYER DASHBOARD · #OfficeSeStadiumtak &nbsp;&nbsp;</span>)}
        </div>
      </div>

      {/* NAVBAR */}
      <nav style={{ background:"rgba(6,16,30,0.97)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
        <div className="wrap" style={{ height:60, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          {/* BCPL Logo + Season 5 badge */}
          <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:8, flexShrink:0, whiteSpace:'nowrap' }}>
            <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL"
              style={{ height:36, maxWidth:100, width:'auto', objectFit:'contain', display:'block', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))', flexShrink:0 }}/>
            <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px', flexShrink:0 }}>
              <span style={{ fontSize:9 }}>🏆</span>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
            </div>
          </div>
          {/* Right: hamburger menu */}
          <button onClick={() => setMenuOpen(true)} style={{ display:"flex", flexDirection:"column", gap:5, background:"none", border:"none", cursor:"pointer", padding:8, flexShrink:0 }}>
            <span style={{ display:"block", width:22, height:2, background:"#fff", borderRadius:12 }}/>
            <span style={{ display:"block", width:22, height:2, background:"#fff", borderRadius:12 }}/>
            <span style={{ display:"block", width:22, height:2, background:"#fff", borderRadius:12 }}/>
          </button>
        </div>
      </nav>
      </div>{/* /sticky-top */}

      {/* ── PLAYER SIDE MENU ── */}
      {menuOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:600 }} onClick={() => setMenuOpen(false)}>
          {/* Backdrop */}
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} />
          {/* Drawer from right */}
          <div style={{ position:'absolute', top:0, right:0, bottom:0, width:280, background:'#06101E', borderLeft:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', padding:'24px 20px' }} onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button onClick={() => setMenuOpen(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:36, height:36, borderRadius:6, cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</button>

            {/* Player info header */}
            <div style={{ marginTop:8, marginBottom:28, paddingBottom:20, borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width:52, height:52, borderRadius:12, background:'linear-gradient(135deg,#FF7A29,#D95E10)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'#fff', marginBottom:12 }}>RS</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff', marginBottom:4 }}>{PLAYER.name}</div>
              <div style={{ fontFamily:'monospace', fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:6 }}>{PLAYER.ref}</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:6, padding:'3px 10px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', display:'inline-block' }} />
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:9, color:'#22C55E', letterSpacing:'.1em' }}>KYC VERIFIED</span>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {[
                { icon:'👤', label:'Player Profile',   action:() => { setMenuOpen(false); window.scrollTo({top:0,behavior:'smooth'}); } },
                { icon:'📋', label:'Download ID Card', action:() => { setMenuOpen(false); (document.querySelector('.btn-orange') as HTMLButtonElement)?.click(); } },
                { icon:'✉️', label:'Contact Support',  action:() => setMenuOpen(false) },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'13px 16px', cursor:'pointer', textAlign:'left', width:'100%', transition:'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,0.03)')}>
                  <span style={{ fontSize:16 }}>{item.icon}</span>
                  <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:13, color:'rgba(255,255,255,0.85)' }}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Player details summary */}
            <div style={{ marginTop:20, padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10 }}>Quick Info</div>
              {[
                { label:'Role',    value:`${PLAYER.roleIcon} ${PLAYER.role}` },
                { label:'City',    value:PLAYER.city },
                { label:'Company', value:PLAYER.company.split(',')[0] },
                { label:'Phone',   value:PLAYER.phone },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', gap:8, padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', flexShrink:0 }}>{r.label}</span>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'rgba(255,255,255,0.7)', textAlign:'right' }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Logout at bottom */}
            <div style={{ marginTop:'auto', paddingTop:20 }}>
              <button onClick={() => { window.location.href = import.meta.env.BASE_URL; }}
                style={{ width:'100%', padding:'12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, color:'rgba(239,68,68,0.8)', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, letterSpacing:'.06em', cursor:'pointer', textTransform:'uppercase' }}>
                🚪 Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DEMO STATE SWITCHER ── */}
      <div style={{ background:"#040A15", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"10px 0" }}>
        <div className="wrap">
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:".12em", textTransform:"uppercase", marginRight:4 }}>DEMO · Player State →</span>
            {DEMO_PHASES.map(dp => (
              <button key={dp.id} onClick={() => setPhase(dp.id)}
                style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, letterSpacing:".06em", padding:"6px 12px", borderRadius:12, cursor:"pointer", textTransform:"uppercase", border:"1.5px solid", transition:"all .2s",
                  background: phase===dp.id ? dp.color : "transparent",
                  borderColor: phase===dp.id ? dp.color : "rgba(255,255,255,0.14)",
                  color: phase===dp.id ? "#fff" : "rgba(255,255,255,0.4)" }}>
                {dp.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main style={{ padding:"clamp(24px,4vw,40px) 0 80px" }}>
        <div className="wrap">

          {/* ── STATUS BANNER ── */}
          <div key={phase} style={{ background:banner.bg, border:`1px solid ${banner.color}33`, borderLeft:`4px solid ${banner.color}`, borderRadius:12, padding:"18px 22px", marginBottom:28, display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap", animation:"fadeUp .35s ease both" }}>
            <span style={{ fontSize:28, flexShrink:0, marginTop:2 }}>{banner.icon}</span>
            <div style={{ flex:1, minWidth:180 }}>
              <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:14, color:banner.color, marginBottom:5, textTransform:"uppercase", letterSpacing:".02em" }}>{banner.title}</div>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>{banner.body}</div>
            </div>
            {phase === "p1_registered" && (
              <button className="btn-orange status-btn" style={{ flexShrink:0, marginLeft:"auto", whiteSpace:"nowrap", minHeight:44 }}>UPLOAD VIDEO →</button>
            )}
            {phase === "p2_selected" && (
              <button className="btn-orange status-btn" style={{ flexShrink:0, marginLeft:"auto", whiteSpace:"nowrap", background:"linear-gradient(135deg,#E8B23D,#C49A1E)", color:"#000", minHeight:44 }}>PAY ₹2,000 →</button>
            )}
          </div>

          {/* ── MAIN LAYOUT ── */}
          <div className="profile-layout" style={{ display:"flex", alignItems:"flex-start", gap:20 }}>

            {/* ══ LEFT: PLAYER CARD ══ */}
            <div className="profile-left" style={{ width:320, minWidth:280, flexShrink:0 }}>

              {/* Avatar + name */}
              <div className="card" style={{ padding:"28px 22px", marginBottom:14, textAlign:"center", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,#FF7A29,#E8B23D)` }} />
                {/* Big avatar */}
                <div style={{ width:84, height:84, borderRadius:12, background:"linear-gradient(135deg,#FF7A29,#D95E10)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:32, color:"#fff", margin:"0 auto 16px", position:"relative", boxShadow:"0 8px 32px rgba(255,122,41,0.35)" }}>
                  RS
                  {/* Online dot */}
                  <div style={{ position:"absolute", bottom:4, right:4, width:12, height:12, borderRadius:"50%", background:"#22C55E", border:"2px solid #0A1727" }} />
                </div>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:20, color:"#fff", marginBottom:4 }}>{PLAYER.name}</div>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:11, color:"#FF7A29", letterSpacing:".1em", textTransform:"uppercase", marginBottom:14 }}>{PLAYER.roleIcon} {PLAYER.role} · {PLAYER.city}</div>
                
                {/* BCPL Registration Number */}
                <div style={{ background:"rgba(255,122,41,0.07)", border:"1px solid rgba(255,122,41,0.2)", borderRadius:12, padding:"8px 14px", display:"inline-flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:8, color:"rgba(255,255,255,0.4)", letterSpacing:".08em", textTransform:"uppercase" }}>BCPL Reg. No.</span>
                  <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:13, color:"#FF7A29", letterSpacing:".06em" }}>{PLAYER.ref}</span>
                </div>
              </div>

              {/* Player Details */}
              <div className="card" style={{ padding:"18px 22px", marginBottom:14 }}>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:14 }}>Player Details</div>
                {[
                  { label:"Email",      value:PLAYER.email,                       color:"rgba(255,255,255,0.75)" },
                  { label:"Mobile",     value:PLAYER.phone,                       color:"rgba(255,255,255,0.75)" },
                  { label:"Role",       value:`${PLAYER.roleIcon} ${PLAYER.role}`, color:"rgba(255,255,255,0.75)" },
                  { label:"Trial City", value:PLAYER.city,                        color:"rgba(255,255,255,0.75)" },
                  { label:"KYC",        value:"✅ Verified",                      color:"#22C55E" },
                ].map(row => (
                  <div key={row.label} className="row-item">
                    <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:".06em", flexShrink:0, minWidth:72 }}>{row.label}</span>
                    <span style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:row.color, textAlign:"right", wordBreak:"break-all" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Team card — shown when signed */}
              {phase === "signed" && (
                <div className="card" style={{ padding:"18px 22px", borderTop:`3px solid ${PLAYER.teamColor}`, position:"relative", overflow:"hidden" }}>
                  <img src={`${L}${PLAYER.teamSlug}.png`} alt={PLAYER.team}
                    style={{ position:"absolute", right:-12, bottom:-12, width:90, height:90, objectFit:"contain", opacity:0.08 }} />
                  <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:14 }}>Your Franchise</div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <div style={{ width:44, height:44, background:"#fff", borderRadius:3, padding:3, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <img src={`${L}${PLAYER.teamSlug}.png`} alt={PLAYER.team} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                    </div>
                    <div>
                      <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:15, color:"#fff" }}>{PLAYER.team}</div>
                      <div style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,255,255,0.4)" }}>{PLAYER.city} · Season 5</div>
                    </div>
                  </div>
                  <div className="row-item">
                    <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase" }}>Contract</span>
                    <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:16 }} className="shimmer-gold">{PLAYER.contract}</span>
                  </div>
                </div>
              )}

              {/* Quick links */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:14 }}>
                <button className="btn-orange" style={{ width:"100%", padding:"12px", fontSize:12 }} onClick={() => {
                  const initials = PLAYER.name.split(' ').map((w:string)=>w[0]).join('');
                  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BCPL Player ID — ${PLAYER.name}</title><style>body{margin:0;background:#030E1C;display:flex;justify-content:center;padding:32px;font-family:'Segoe UI',sans-serif}.card{width:340px;background:linear-gradient(145deg,#0D1F3C,#06101E);border:1.5px solid rgba(255,122,41,0.45);border-radius:18px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6)}.stripe{height:4px;background:linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)}.head{background:linear-gradient(135deg,#FF7A29,#C94E0E);padding:14px 20px}.head-title{font-size:10px;font-weight:800;color:rgba(255,255,255,0.9);letter-spacing:.18em}.head-sub{font-size:8px;color:rgba(255,255,255,0.65);margin-top:3px;letter-spacing:.1em}.body{padding:20px 22px 16px}.avatar{width:60px;height:60px;background:linear-gradient(135deg,#FF7A29,#C94E0E);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;margin-bottom:12px;box-shadow:0 4px 20px rgba(255,122,41,0.4)}.name{font-size:20px;font-weight:900;color:#fff;margin-bottom:3px}.role{font-size:11px;font-weight:800;color:#FF7A29;letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px}hr{border:none;border-top:1px solid rgba(255,255,255,0.08);margin:12px 0}.row{display:flex;justify-content:space-between;margin-bottom:9px}.label{font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:.08em}.val{font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);text-align:right}.ref{font-family:monospace;color:#FF7A29;font-size:11px;font-weight:700}.foot{background:rgba(255,122,41,0.07);border-top:1px solid rgba(255,122,41,0.18);padding:12px 22px;display:flex;justify-content:space-between;align-items:center}.kyc{background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.4);border-radius:6px;padding:4px 11px;font-size:9px;font-weight:800;color:#22C55E;letter-spacing:.08em}.site{font-size:9px;color:rgba(255,255,255,0.25);font-weight:600}@media print{body{padding:0;background:#fff}.card{box-shadow:none}}</style></head><body><div class="card"><div class="stripe"></div><div class="head"><div class="head-title">BHARTIYA CORPORATE PREMIER LEAGUE</div><div class="head-sub">OFFICIAL PLAYER ID CARD · SEASON 5 · 2026–27</div></div><div class="body"><div class="avatar">${initials}</div><div class="name">${PLAYER.name}</div><div class="role">${PLAYER.roleIcon} ${PLAYER.role} · ${PLAYER.city}</div><hr/><div class="row"><span class="label">Email</span><span class="val">${PLAYER.email}</span></div><div class="row"><span class="label">Phone</span><span class="val">${PLAYER.phone}</span></div><div class="row"><span class="label">Date of Birth</span><span class="val">${PLAYER.dob}</span></div><hr/><div class="row"><span class="label">Player ID</span><span class="ref">${PLAYER.ref}</span></div><div class="row"><span class="label">Reg. Date</span><span class="val">${PLAYER.regDate}</span></div><div class="row"><span class="label">Phase 1 Fee</span><span class="val">₹${PLAYER.paid} Paid ✓</span></div></div><div class="foot"><span class="site">bcplt20.com · BCPL Season 5</span><span class="kyc">KYC ✓ VERIFIED</span></div></div><script>window.onload=function(){window.print();}<\/script></body></html>`;
                  const win = window.open('', '_blank');
                  if(win){ win.document.write(html); win.document.close(); }
                }}>📋 DOWNLOAD ID CARD</button>
                <button className="btn-ghost" style={{ width:"100%", padding:"12px", fontSize:12 }}>✉️ CONTACT SUPPORT</button>
              </div>
            </div>

            {/* ══ RIGHT: JOURNEY + DETAILS ══ */}
            <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:16 }}>

              {/* ── Player Timeline ── */}
              <div className="card" style={{ padding:"22px 24px" }}>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:13, color:"#fff", textTransform:"uppercase", letterSpacing:".05em", marginBottom:20 }}>📊 Player Timeline</div>
                <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                  {nodes.map((node, i) => {
                    const isDone   = node.state === "done";
                    const isActive = node.state === "active";
                    const isWait   = node.state === "waiting";
                    const color    = isDone ? "#22C55E" : isActive ? "#FF7A29" : "rgba(255,255,255,0.18)";
                    return (
                      <div key={i} style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                        {/* Left: Line + dot */}
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:28, flexShrink:0 }}>
                          <div style={{ width:28, height:28, borderRadius:12, background: isDone ? "#22C55E" : isActive ? "#FF7A29" : "rgba(255,255,255,0.06)", border:`1.5px solid ${color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontFamily:"Montserrat,sans-serif", fontWeight:900, color: isDone||isActive ? "#fff" : "rgba(255,255,255,0.2)", flexShrink:0, animation: isActive ? "glowPulse 2s infinite" : "none" }}>
                            {isDone ? "✓" : isActive ? "●" : i+1}
                          </div>
                          {i < nodes.length-1 && <div style={{ width:2, height:36, background: isDone ? "#22C55E44" : "rgba(255,255,255,0.07)", margin:"3px 0" }} />}
                        </div>
                        {/* Right: content */}
                        <div style={{ minHeight:52, paddingTop:2 }}>
                          <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:isActive ? 900 : 700, fontSize:14, color: isDone ? "#22C55E" : isActive ? "#FF7A29" : "rgba(255,255,255,0.3)" }}>{node.label}</div>
                          {isDone && (
                            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:4 }}>
                              <span style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,255,255,0.3)" }}>Completed ✓</span>
                              {node.receipt && (
                                <button onClick={() => { window.location.href = import.meta.env.BASE_URL + node.receipt; }}
                                  style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:9, color:'#FF7A29', background:'rgba(255,122,41,0.1)', border:'1px solid rgba(255,122,41,0.3)', borderRadius:6, padding:'2px 8px', cursor:'pointer', letterSpacing:'.06em', textTransform:'uppercase' }}>
                                  📄 Receipt
                                </button>
                              )}
                            </div>
                          )}
                          {isActive && <div style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,122,41,0.7)", marginTop:4 }}>● In Progress</div>}
                          {isWait && <div style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,255,255,0.18)", marginTop:4 }}>Pending</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── PHASE 1 PAYMENT ── (always visible) */}
              <div className="card" style={{ padding:"22px 24px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:13, color:"#fff", textTransform:"uppercase", letterSpacing:".05em" }}>Phase 1 · Registration & Payment</div>
                  <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, padding:"4px 10px", borderRadius:12, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"#22C55E", letterSpacing:".08em" }}>PAID ✓</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
                  {[
                    { label:"Role",       value:`${PLAYER.roleIcon} ${PLAYER.role}`, highlight:false },
                    { label:"Entry Fee",  value:"₹299 Paid",                          highlight:true  },
                    { label:"City",       value:PLAYER.city,                          highlight:false },
                    { label:"Reg Date",   value:PLAYER.regDate,                       highlight:false },
                    { label:"BCPL Reg. No.", value:PLAYER.ref,                        highlight:false },
                    { label:"Status",     value:"ACTIVE",                             highlight:true  },
                  ].map(f => (
                    <div key={f.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 14px" }}>
                      <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:".1em", textTransform:"uppercase", marginBottom:5 }}>{f.label}</div>
                      <div style={{ fontFamily:f.label==="Ref No." ? "monospace" : "Montserrat,sans-serif", fontWeight:800, fontSize:13, color: f.highlight ? "#22C55E" : "rgba(255,255,255,0.8)" }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── VIDEO UPLOAD ── */}
              {(phase === "p1_video" || phase === "p2_selected" || phase === "auction" || phase === "signed") && (
                <div className="card" style={{ padding:"22px 24px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:13, color:"#fff", textTransform:"uppercase", letterSpacing:".05em" }}>Phase 1 · Trial Video</div>
                    <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, padding:"4px 10px", borderRadius:12, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"#22C55E", letterSpacing:".08em" }}>SUBMITTED ✓</span>
                  </div>
                  {/* Video preview mock */}
                  <div style={{ background:"#060C18", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"18px", display:"flex", alignItems:"center", gap:16, marginBottom:14, cursor:"pointer" }}>
                    <div style={{ width:72, height:52, background:"linear-gradient(135deg,#1a2a3a,#0a1520)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:"1px solid rgba(255,255,255,0.08)", position:"relative" }}>
                      <span style={{ fontSize:22 }}>▶</span>
                      <div style={{ position:"absolute", bottom:4, right:4, fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:8, color:"rgba(255,255,255,0.4)" }}>2:00</div>
                    </div>
                    <div>
                      <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:13, color:"#fff", marginBottom:4 }}>{PLAYER.videoUrl}</div>
                      <div style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,255,255,0.35)" }}>Role: {PLAYER.role} · Duration: 2:00 · Format: MP4</div>
                    </div>
                  </div>
                  {phase === "p1_video" && (
                    <div style={{ background:"rgba(255,122,41,0.06)", border:"1px solid rgba(255,122,41,0.18)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:"#FF7A29", display:"inline-block", animation:"liveBlip 1.2s infinite" }} />
                      <span style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:"rgba(255,255,255,0.55)" }}>Under review by BCCI-certified scouts · Result expected by <strong style={{ color:"#FF7A29" }}>28 Feb 2026</strong></span>
                    </div>
                  )}
                  {(phase === "p2_selected" || phase === "auction" || phase === "signed") && (
                    <div style={{ background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:16 }}>✅</span>
                      <span style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:"rgba(255,255,255,0.55)" }}>Scout review complete · <strong style={{ color:"#22C55E" }}>PASSED — Selected for Phase 2 trial</strong></span>
                    </div>
                  )}
                </div>
              )}

              {/* ── UPLOAD CTA (only for P1_registered) ── */}
              {phase === "p1_registered" && (
                <div className="card" style={{ padding:"22px 24px", borderTop:"3px solid #FF7A29" }}>
                  <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:13, color:"#fff", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>Phase 1 · Upload Your Trial Video</div>
                  <p style={{ fontFamily:"Inter,sans-serif", fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.6, marginBottom:16 }}>
                    Upload a 2-minute video of yourself batting, bowling, or keeping wicket. BCCI-certified scouts will review it within 7 days.
                  </p>
                  <div style={{ background:"#060C18", border:"2px dashed rgba(255,122,41,0.3)", borderRadius:12, padding:"32px", textAlign:"center", cursor:"pointer", marginBottom:14 }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>🎬</div>
                    <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>Drag & drop your video here</div>
                    <div style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:12 }}>MP4, MOV · Max 500MB · Max 2 minutes</div>
                    <button className="btn-orange" style={{ padding:"10px 24px" }}>BROWSE FILES</button>
                  </div>
                  <div style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:"rgba(255,122,41,0.6)", textAlign:"center" }}>⏱ Upload deadline: 28 Feb 2026</div>
                </div>
              )}

              {/* ── PHASE 2 PANEL ── */}
              {(phase === "p2_selected" || phase === "auction" || phase === "signed") && (
                <div className="card" style={{ padding:"22px 24px", borderTop:"3px solid #E8B23D" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:13, color:"#fff", textTransform:"uppercase", letterSpacing:".05em" }}>Phase 2 · Physical Trial</div>
                    {phase === "p2_selected"
                      ? <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, padding:"4px 10px", borderRadius:12, background:"rgba(232,178,61,0.12)", border:"1px solid rgba(232,178,61,0.35)", color:"#E8B23D", letterSpacing:".08em" }}>ACTION NEEDED</span>
                      : <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, padding:"4px 10px", borderRadius:12, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"#22C55E", letterSpacing:".08em" }}>CLEARED ✓</span>
                    }
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10, marginBottom:14 }}>
                    {[
                      { label:"Trial City",  value:PLAYER.p2City  },
                      { label:"Trial Date",  value:PLAYER.p2Date  },
                      { label:"Phase 2 Fee", value:"₹2,000"       },
                      { label:"Status",      value: phase==="p2_selected" ? "PAYMENT PENDING" : "TRIAL CLEARED ✓" },
                    ].map(f => (
                      <div key={f.label} style={{ background:"rgba(232,178,61,0.04)", border:"1px solid rgba(232,178,61,0.1)", borderRadius:12, padding:"12px 14px" }}>
                        <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:".1em", textTransform:"uppercase", marginBottom:5 }}>{f.label}</div>
                        <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:12, color: f.label==="Status" && phase==="p2_selected" ? "#E8B23D" : f.label==="Status" ? "#22C55E" : "rgba(255,255,255,0.8)" }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  {phase === "p2_selected" && (
                    <button style={{ background:"linear-gradient(135deg,#E8B23D,#C49A1E)", border:"none", borderRadius:12, color:"#000", fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:13, letterSpacing:".06em", padding:"14px 28px", cursor:"pointer", width:"100%", textTransform:"uppercase" }}>
                      PAY ₹2,000 NOW TO CONFIRM TRIAL →
                    </button>
                  )}
                </div>
              )}

              {/* ── AUCTION PANEL ── */}
              {(phase === "auction" || phase === "signed") && (
                <div className="card" style={{ padding:"22px 24px", borderTop:"3px solid #E8B23D" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:13, color:"#fff", textTransform:"uppercase", letterSpacing:".05em" }}>Franchise Auction</div>
                    {phase === "auction"
                      ? <div style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ width:7, height:7, borderRadius:"50%", background:"#FF7A29", display:"inline-block", animation:"liveBlip 1s infinite" }}/><span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, color:"#FF7A29" }}>LIVE</span></div>
                      : <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, padding:"4px 10px", borderRadius:12, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"#22C55E", letterSpacing:".08em" }}>SIGNED ✓</span>
                    }
                  </div>
                  {/* Franchise logos mini-grid */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:14 }}>
                    {[
                      {slug:"rajasthan_scorchers",n:"RS",  selected: phase==="signed" && false },
                      {slug:"punjab_warriors",    n:"PW",  selected: false },
                      {slug:"kolkata_tigers",     n:"KT",  selected: false },
                      {slug:"lucknow_nawabs",     n:"LN",  selected: false },
                      {slug:"mumbai_mavericks",   n:"MM",  selected: phase==="signed" },
                      {slug:"hyderabad_hawks",    n:"HH",  selected: false },
                      {slug:"delhi_suryas",       n:"DS",  selected: false },
                      {slug:"chennai_thalaivas",  n:"CT",  selected: false },
                      {slug:"ahmedabad_lions",    n:"AL",  selected: false },
                      {slug:"bengaluru_rockets",  n:"BR",  selected: false },
                    ].map(t => (
                      <div key={t.slug} style={{ background: t.selected ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)", border:`1px solid ${t.selected ? "#3B82F6" : "rgba(255,255,255,0.07)"}`, borderRadius:12, padding:"8px", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:4 }}>
                        <div style={{ width:32, height:32, background:"#fff", borderRadius:12, padding:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <img src={`${L}${t.slug}.png`} alt={t.n} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                        </div>
                        <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:8, color: t.selected ? "#3B82F6" : "rgba(255,255,255,0.3)", letterSpacing:".06em" }}>{t.n}</span>
                      </div>
                    ))}
                  </div>
                  {phase === "auction" && (
                    <div style={{ background:"rgba(255,122,41,0.06)", border:"1px solid rgba(255,122,41,0.2)", borderRadius:12, padding:"12px 16px" }}>
                      <div style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:"rgba(255,255,255,0.55)" }}>Current highest bid: <strong style={{ color:"#FF7A29" }}>₹8,50,000</strong> by Mumbai Mavericks · 3 franchises bidding</div>
                    </div>
                  )}
                  {phase === "signed" && (
                    <div style={{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.25)", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ width:44, height:44, background:"#fff", borderRadius:12, padding:3, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <img src={`${L}mumbai_mavericks.png`} alt="MM" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                      </div>
                      <div>
                        <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:15, color:"#fff", marginBottom:2 }}>Mumbai Mavericks signed you!</div>
                        <div style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:"rgba(255,255,255,0.45)" }}>Contract: <strong style={{ color:"#E8B23D" }}>{PLAYER.contract}</strong> · Season 5 Squad Member</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── QUICK ACTIONS ── */}
              <div className="card" style={{ padding:"18px 22px" }}>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:14 }}>Quick Actions</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  <button className="btn-orange" style={{ fontSize:11, padding:"9px 16px" }}
                    onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/p1-receipt'; }}>📥 DOWNLOAD RECEIPT</button>
                  <button className="btn-ghost" style={{ fontSize:11, padding:"9px 16px" }}
                    onClick={() => { const BASE = import.meta.env.BASE_URL; const logoUrl = `${window.location.origin}${BASE}bcpl-assets/bcpl-logo-white.png`; const w = window.open('', '_blank'); if (!w) return; w.document.write(`<!DOCTYPE html><html><head><title>BCPL ID Card</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#06101E;display:flex;align-items:center;justify-content:center;min-height:100vh;-webkit-print-color-adjust:exact;print-color-adjust:exact}.card{width:340px;background:linear-gradient(135deg,#0A1A30,#06101E);border:2px solid #FF7A29;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.6)}.card-header{background:linear-gradient(135deg,#C94E0E,#FF7A29);padding:16px 20px;display:flex;align-items:center;gap:12px}.logo{width:44px;height:44px;object-fit:contain}.brand{font-size:16px;font-weight:900;color:#fff}.sub{font-size:9px;color:rgba(255,255,255,0.8);margin-top:2px}.card-body{padding:20px}.avatar{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#FF7A29,#E8B23D);display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:12px}.name{font-size:18px;font-weight:900;color:#fff;margin-bottom:4px}.role{font-size:11px;color:#FF7A29;font-weight:700;letter-spacing:.1em;margin-bottom:16px}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:11px}.lbl{color:rgba(255,255,255,0.35);font-weight:700;text-transform:uppercase;letter-spacing:.08em}.val{color:#F0EDE8;font-weight:700}.ref{font-family:monospace;color:#FF7A29;font-size:10px}.card-footer{background:rgba(0,0,0,0.3);padding:12px 20px;text-align:center;font-size:9px;font-weight:800;color:#E8B23D;letter-spacing:.12em}@media print{body{background:#06101E}}</style></head><body><div class="card"><div class="card-header"><img class="logo" src="${logoUrl}" alt="BCPL"/><div><div class="brand">BCPL T20</div><div class="sub">Bhartiya Corporate Premier League</div></div></div><div class="card-body"><div class="avatar">🏏</div><div class="name">Rahul Sharma</div><div class="role">BATSMAN · SEASON 5</div><div class="row"><span class="lbl">ID</span><span class="val ref">BCPL-MUM-7432</span></div><div class="row"><span class="lbl">City</span><span class="val">Mumbai</span></div><div class="row"><span class="lbl">Phase 1</span><span class="val" style="color:#22C55E">Registered ✓</span></div><div class="row"><span class="lbl">Season</span><span class="val">Season 5 · 2026</span></div></div><div class="card-footer">#OfficeSeStadiumtak</div></div></body></html>`); w.document.close(); setTimeout(() => w.print(), 600); }}>🖨 PRINT ID CARD</button>
                  <button className="btn-ghost" style={{ fontSize:11, padding:"9px 16px" }}
                    onClick={() => window.open('https://wa.me/918800000000?text=' + encodeURIComponent('Hi, I need help with my BCPL Season 5 registration.'), '_blank')}>📞 HELPLINE</button>
                  <button className="btn-ghost" style={{ fontSize:11, padding:"9px 16px" }}
                    onClick={() => { window.location.href = 'mailto:support@bcplt20.com?subject=BCPL%20Season%205%20Support%20-%20BCPL-MUM-7432'; }}>✉️ EMAIL SUPPORT</button>
                  {phase !== "p1_registered" && <button className="btn-ghost" style={{ fontSize:11, padding:"9px 16px" }}
                    onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/upload-video'; }}>🎬 RE-WATCH VIDEO</button>}
                </div>
              </div>

            </div>{/* end RIGHT */}
          </div>{/* end layout */}
        </div>
      </main>

      <BCPLFooter />
    </div>
  );
}
