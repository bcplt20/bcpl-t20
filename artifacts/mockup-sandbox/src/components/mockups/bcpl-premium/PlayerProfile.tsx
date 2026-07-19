import React, { useState } from "react";

const L = "/__mockup/bcpl-assets/logos/";

/* ── DEMO STATES ── */
type Phase = "p1_registered" | "p1_video" | "p2_selected" | "auction" | "signed";
const DEMO_PHASES: {id:Phase;label:string;short:string;color:string}[] = [
  { id:"p1_registered", label:"P1 Registered",     short:"P1 REG",  color:"#FF7A29" },
  { id:"p1_video",      label:"Video Uploaded",     short:"VIDEO",   color:"#FF7A29" },
  { id:"p2_selected",   label:"P2 Selected",        short:"P2 SEL",  color:"#E8B23D" },
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
  const done  = (label:string) => ({ label, state:"done"    as const });
  const active= (label:string) => ({ label, state:"active"  as const });
  const wait  = (label:string) => ({ label, state:"waiting" as const });
  const map: Record<Phase, Array<{label:string;state:"done"|"active"|"waiting"}>> = {
    p1_registered: [active("Phase 1 Registration"), wait("Video Upload"), wait("Scout Review"), wait("Trial Invite"), wait("Franchise Auction"), wait("Team Selected")],
    p1_video:      [done("Phase 1 Registration"),   active("Video Upload"), wait("Scout Review"), wait("Trial Invite"), wait("Franchise Auction"), wait("Team Selected")],
    p2_selected:   [done("Phase 1 Registration"),   done("Video Upload"),  done("Scout Review"),  active("Trial Invite"), wait("Franchise Auction"), wait("Team Selected")],
    auction:       [done("Phase 1 Registration"),   done("Video Upload"),  done("Scout Review"),  done("Trial Invite"),  active("Franchise Auction"), wait("Team Selected")],
    signed:        [done("Phase 1 Registration"),   done("Video Upload"),  done("Scout Review"),  done("Trial Invite"),  done("Franchise Auction"),  active("Team Selected")],
  };
  return map[phase];
}

/* ── STATUS BANNER CONFIG ── */
function getBanner(phase: Phase) {
  const M: Record<Phase, { color:string; bg:string; icon:string; title:string; body:string }> = {
    p1_registered: { color:"#FF7A29", bg:"rgba(255,122,41,0.08)", icon:"📝", title:"Registration Complete — Upload Your Video", body:`You've registered as a Batsman for BCPL Season 5. Next step: upload your 2-minute trial video. Deadline: 28 Feb 2026.` },
    p1_video:      { color:"#FF7A29", bg:"rgba(255,122,41,0.08)", icon:"🎬", title:"Video Submitted — Scout Review in Progress", body:`Your video is with BCCI-certified scouts. Review takes up to 7 working days. You'll receive an email & SMS.` },
    p2_selected:   { color:"#E8B23D", bg:"rgba(232,178,61,0.08)", icon:"⭐", title:"Congratulations! Selected for Phase 2 Trial", body:`Report to ${PLAYER.p2City} on ${PLAYER.p2Date} for your physical trial. Phase 2 fee of ₹2,000 due before trial.` },
    auction:       { color:"#E8B23D", bg:"rgba(232,178,61,0.08)", icon:"🔨", title:"You Are Auction Shortlisted!", body:`All 10 franchise coaches have reviewed your trial. Your profile is live for the Season 5 Franchise Auction. Base price: ₹1L.` },
    signed:        { color:"#22C55E", bg:"rgba(34,197,94,0.08)",  icon:"🏆", title:`You've Been Signed by Mumbai Mavericks!`, body:`Contract value: ${PLAYER.contract}. Welcome to the squad. Report to your franchise on 15 Sep 2026 for pre-season camp.` },
  };
  return M[phase];
}

export function PlayerProfile() {
  const [phase, setPhase] = useState<Phase>("p1_video");
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
        @media(max-width:1023px){.profile-layout{flex-direction:column!important;}}
      `}</style>

      {/* TICKER */}
      <div style={{ background:"linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A)", overflow:"hidden", height:34, display:"flex", alignItems:"center" }}>
        <div style={{ display:"flex", whiteSpace:"nowrap", animation:"tickerScroll 32s linear infinite" }}>
          {[0,1].map(i => <span key={i} style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:11, letterSpacing:".1em", color:"#fff", paddingRight:80 }}>🏏 BCPL T20 · SEASON 5 · REF: BCPL-S5-7432 · PLAYER DASHBOARD · #OfficeSeStadiumtak &nbsp;&nbsp; 🏏 BCPL T20 · SEASON 5 · REF: BCPL-S5-7432 · PLAYER DASHBOARD · #OfficeSeStadiumtak &nbsp;&nbsp;</span>)}
        </div>
      </div>

      {/* NAVBAR */}
      <nav style={{ position:"sticky", top:0, zIndex:200, background:"rgba(6,16,30,0.97)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div className="wrap" style={{ height:60, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:20, color:"#FF7A29" }}>BCPL</span>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:20, color:"#fff" }}>T20</span>
            <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:10, color:"rgba(255,122,41,0.6)", marginLeft:6, letterSpacing:".1em" }}>SEASON 5</span>
          </div>
          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:"Inter,sans-serif", fontSize:12, color:"rgba(255,255,255,0.35)" }}>
            <span style={{ cursor:"pointer", color:"rgba(255,255,255,0.5)" }}>Dashboard</span>
            <span>›</span>
            <span style={{ color:"#FF7A29" }}>My Profile</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Avatar */}
            <div style={{ width:36, height:36, borderRadius:12, background:"linear-gradient(135deg,#FF7A29,#D95E10)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:14, color:"#fff" }}>RS</div>
            <div style={{ display:"none" }}>
              <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:13, color:"#fff" }}>Rahul Sharma</div>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,255,255,0.35)" }}>BCPL-S5-7432</div>
            </div>
            <button className="btn-ghost" style={{ fontSize:11, padding:"7px 14px" }}>Log Out</button>
          </div>
        </div>
      </nav>

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
          <div key={phase} style={{ background:banner.bg, border:`1px solid ${banner.color}33`, borderLeft:`4px solid ${banner.color}`, borderRadius:12, padding:"18px 22px", marginBottom:28, display:"flex", alignItems:"flex-start", gap:16, animation:"fadeUp .35s ease both" }}>
            <span style={{ fontSize:28, flexShrink:0, marginTop:2 }}>{banner.icon}</span>
            <div>
              <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:14, color:banner.color, marginBottom:5, textTransform:"uppercase", letterSpacing:".02em" }}>{banner.title}</div>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>{banner.body}</div>
            </div>
            {phase === "p1_registered" && (
              <button className="btn-orange" style={{ flexShrink:0, marginLeft:"auto", whiteSpace:"nowrap" }}>UPLOAD VIDEO →</button>
            )}
            {phase === "p2_selected" && (
              <button className="btn-orange" style={{ flexShrink:0, marginLeft:"auto", whiteSpace:"nowrap", background:"linear-gradient(135deg,#E8B23D,#C49A1E)", color:"#000" }}>PAY ₹2,000 →</button>
            )}
          </div>

          {/* ── MAIN LAYOUT ── */}
          <div className="profile-layout" style={{ display:"flex", alignItems:"flex-start", gap:20 }}>

            {/* ══ LEFT: PLAYER CARD ══ */}
            <div style={{ width:320, minWidth:280, flexShrink:0 }}>

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
                
                {/* Booking ref */}
                <div style={{ background:"rgba(255,122,41,0.07)", border:"1px solid rgba(255,122,41,0.2)", borderRadius:12, padding:"8px 14px", display:"inline-flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:".1em", textTransform:"uppercase" }}>REF</span>
                  <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:13, color:"#FF7A29", letterSpacing:".06em" }}>{PLAYER.ref}</span>
                </div>
              </div>

              {/* Contact Details */}
              <div className="card" style={{ padding:"18px 22px", marginBottom:14 }}>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:14 }}>Contact Details</div>
                {[
                  { label:"Email",   value:PLAYER.email,   mono:false },
                  { label:"Phone",   value:PLAYER.phone,   mono:false },
                  { label:"Company", value:PLAYER.company,  mono:false },
                  { label:"DOB",     value:`${PLAYER.dob} (Age ${PLAYER.age})`, mono:false },
                ].map(row => (
                  <div key={row.label} className="row-item">
                    <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:".06em", flexShrink:0, minWidth:60 }}>{row.label}</span>
                    <span style={{ fontFamily:row.mono?"monospace":"Inter,sans-serif", fontSize:12, color:"rgba(255,255,255,0.75)", textAlign:"right", wordBreak:"break-all" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Registration Details */}
              <div className="card" style={{ padding:"18px 22px", marginBottom:14 }}>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:14 }}>Registration</div>
                {[
                  { label:"Role",     value:`${PLAYER.roleIcon} ${PLAYER.role}` },
                  { label:"City",     value:PLAYER.city },
                  { label:"Reg Date", value:PLAYER.regDate },
                  { label:"Phase 1",  value:`₹${PLAYER.paid} Paid ✓` },
                ].map(row => (
                  <div key={row.label} className="row-item">
                    <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:".06em", flexShrink:0, minWidth:60 }}>{row.label}</span>
                    <span style={{ fontFamily:"Inter,sans-serif", fontSize:12, color: row.label==="Phase 1" ? "#22C55E" : "rgba(255,255,255,0.75)", textAlign:"right" }}>{row.value}</span>
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
                <button className="btn-orange" style={{ width:"100%", padding:"12px", fontSize:12 }}>📋 DOWNLOAD ID CARD</button>
                <button className="btn-ghost" style={{ width:"100%", padding:"12px", fontSize:12 }}>✉️ CONTACT SUPPORT</button>
              </div>
            </div>

            {/* ══ RIGHT: JOURNEY + DETAILS ══ */}
            <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:16 }}>

              {/* ── Journey Rail ── */}
              <div className="card" style={{ padding:"22px 24px" }}>
                <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:13, color:"#fff", textTransform:"uppercase", letterSpacing:".05em", marginBottom:20 }}>🗺 Your Journey — Season 5</div>
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
                          {i < nodes.length-1 && <div style={{ width:2, height:32, background: isDone ? "#22C55E44" : "rgba(255,255,255,0.07)", margin:"3px 0" }} />}
                        </div>
                        {/* Right: content */}
                        <div style={{ paddingBottom: i < nodes.length-1 ? 0 : 0, minHeight:50 }}>
                          <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:isActive ? 900 : 700, fontSize:14, color: isDone ? "#22C55E" : isActive ? "#FF7A29" : "rgba(255,255,255,0.3)", marginTop:4 }}>{node.label}</div>
                          {isDone && <div style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Completed ✓</div>}
                          {isActive && <div style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,122,41,0.7)", marginTop:2 }}>● In Progress</div>}
                          {isWait && <div style={{ fontFamily:"Inter,sans-serif", fontSize:11, color:"rgba(255,255,255,0.18)", marginTop:2 }}>Pending</div>}
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
                    { label:"Ref No.",    value:PLAYER.ref,                           highlight:false },
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
                  <button className="btn-orange" style={{ fontSize:11, padding:"9px 16px" }}>📥 DOWNLOAD RECEIPT</button>
                  <button className="btn-ghost" style={{ fontSize:11, padding:"9px 16px" }}>🖨 PRINT ID CARD</button>
                  <button className="btn-ghost" style={{ fontSize:11, padding:"9px 16px" }}>📞 HELPLINE</button>
                  <button className="btn-ghost" style={{ fontSize:11, padding:"9px 16px" }}>✉️ EMAIL SUPPORT</button>
                  {phase !== "p1_registered" && <button className="btn-ghost" style={{ fontSize:11, padding:"9px 16px" }}>🎬 RE-WATCH VIDEO</button>}
                </div>
              </div>

            </div>{/* end RIGHT */}
          </div>{/* end layout */}
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ background:"#040A15", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"20px 0" }}>
        <div className="wrap" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
          <span style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:"rgba(255,255,255,0.2)" }}>BCPL T20 · Season 5 · Kriparti Playing 11 Pvt. Ltd. · © 2026</span>
          <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:10, letterSpacing:".1em", color:"#FF7A29" }}>#OfficeSeStadiumtak</span>
        </div>
      </footer>
    </div>
  );
}
