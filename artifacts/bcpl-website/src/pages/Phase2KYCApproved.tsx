import React, { useState } from 'react';

const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
const NAV_ROUTES: Record<string,string> = { 'Home':'', 'Match Center':'match-center', 'Teams':'teams', 'Sponsors':'sponsors', 'Photos':'photos', 'Videos':'videos', 'About':'about', 'FAQ':'faq', 'Contact':'contact' };

const ROADMAP = [
  { icon:'📝', label:'Register',     done:true  },
  { icon:'🎬', label:'Upload Video', done:true  },
  { icon:'🔨', label:'Phase 2 Pay',  done:true  },
  { icon:'🪪', label:'KYC',          done:true  },
  { icon:'🏟', label:'Trial',        active:true },
  { icon:'💰', label:'Auction',      done:false },
  { icon:'🏆', label:'Play BCPL',    done:false },
];

export function Phase2KYCApproved() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', fontFamily:"'Inter',sans-serif", color:'#F0EDE8', overflowX:'hidden', paddingBottom:100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .wrap{max-width:1200px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .btn-primary{background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:.06em;cursor:pointer;transition:all .2s}
        .btn-primary:hover{filter:brightness(1.15);transform:translateY(-2px)}
        .btn-outline{background:transparent;border:1px solid rgba(255,255,255,0.2);border-radius:12px;color:rgba(255,255,255,0.7);font-family:Montserrat,sans-serif;font-weight:700;cursor:pointer;transition:all .2s;letter-spacing:.04em}
        .btn-outline:hover{border-color:#FF7A29;color:#FF7A29}
        .notice-card{background:#0A1727;border:1px solid rgba(255,255,255,0.08);padding:20px 18px;border-radius:12px;transition:border-color .2s}
        .notice-card:hover{border-color:rgba(255,122,41,0.3)}
        .chip{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;font-size:12px;font-weight:700;font-family:Montserrat,sans-serif;border-radius:12px}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes shimOrange{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.1}}
        @keyframes pulseOrange{0%,100%{box-shadow:0 0 0 0 rgba(255,122,41,0.5)}50%{box-shadow:0 0 0 12px rgba(255,122,41,0)}}
        @keyframes verifiedPop{0%{transform:scale(0.5) rotate(-10deg);opacity:0}60%{transform:scale(1.15) rotate(3deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes goldPulse{0%,100%{box-shadow:0 0 0 0 rgba(232,178,61,0.4)}50%{box-shadow:0 0 0 10px rgba(232,178,61,0)}}
        @keyframes countdownPulse{0%,100%{color:#E8B23D}50%{color:#FFD700}}

        /* Main profile grid — 1 col mobile, 2 col desktop */
        .profile-grid{display:grid;grid-template-columns:1fr;gap:20px;margin-bottom:32px}
        @media(min-width:640px){.profile-grid{grid-template-columns:1fr 1fr}}

        /* Notices grid */
        .notices-grid{display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:40px}
        @media(min-width:540px){.notices-grid{grid-template-columns:repeat(3,1fr)}}

        /* Season CTA row */
        .season-cta{background:linear-gradient(135deg,#0A1727,#060C18);border:1px solid rgba(255,122,41,0.2);padding:24px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
        .season-cta-btn{padding:14px 28px;font-size:14px;letter-spacing:.06em;width:100%}
        @media(min-width:480px){.season-cta-btn{width:auto}}

        /* Profile info row */
        .profile-info-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);gap:8px}

        /* Roadmap rail */
        .roadmap-rail{display:flex;align-items:center;gap:0;min-width:520px}
        .roadmap-node-label{font-size:9px;font-weight:700;font-family:Montserrat,sans-serif;text-align:center;white-space:nowrap;margin-top:4px}

        /* Hero chips */
        .hero-chips{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}
      `}</style>

      <div style={{ position:'sticky', top:0, zIndex:300 }}>
      {/* ── TICKER ── */}
      <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 28s linear infinite' }}>
          {[...Array(4)].map((_,i) => (
            <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff' }}>
              &nbsp;🏏 SEASON 5 REGISTRATIONS OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 50+ CITIES &nbsp;·&nbsp; BACKED BY SOURAV GANGULY &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
        <div className="wrap" style={{ height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{ height:42, width:'auto', objectFit:'contain', display:'block', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}/>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px' }}>
                <span style={{ fontSize:9 }}>🏆</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
              </div>
          </div>
          <div className="desk-nav">
            {NAV.map(l => <a key={l} href="#" style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, textDecoration:'none', letterSpacing:'.04em' }}>{l}</a>)}
            <button className="btn-primary" style={{ padding:'10px 24px', fontSize:12 }}>REGISTER NOW →</button>
          </div>
          <button className="ham-btn" onClick={() => setMenuOpen(o => !o)}>
            {[0,1,2].map(i => <span key={i} style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:1 }} />)}
          </button>
        </div>
      </nav>
      </div>{/* /sticky-top */}

      {menuOpen && (
        <div style={{ position:'fixed', inset:0, background:'#040C18', zIndex:400, display:'flex', flexDirection:'column', padding:'72px 24px 40px', overflowY:'auto' }}>
          <button onClick={() => setMenuOpen(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:38, height:38, borderRadius:4, cursor:'pointer', fontSize:18 }}>✕</button>
          {NAV.map(l => <a key={l} href="#" style={{ color:'rgba(255,255,255,0.85)', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{l}</a>)}
          <button className="btn-primary" style={{ marginTop:24, padding:'16px', fontSize:15 }}>REGISTER NOW →</button>
        </div>
      )}

      {/* ── VERIFIED HERO BANNER ── */}
      <div style={{ background:'linear-gradient(135deg,#060C18,#0A1F12)', borderBottom:'2px solid rgba(34,197,94,0.3)', padding:'40px 0' }}>
        <div className="wrap" style={{ textAlign:'center' }}>
          <div style={{ fontSize:72, animation:'verifiedPop .7s cubic-bezier(.34,1.56,.64,1) both', display:'inline-block', marginBottom:16 }}>✅</div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(22px,4vw,44px)', color:'#22C55E', letterSpacing:'.02em', textTransform:'uppercase', marginBottom:8, animation:'fadeUp .5s ease .1s both' }}>
            KYC VERIFIED
          </div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)', maxWidth:520, margin:'0 auto 20px', lineHeight:1.7, animation:'fadeUp .5s ease .2s both' }}>
            You are officially cleared to participate in <strong style={{ color:'#fff' }}>BCPL Season 5 Physical Trials</strong>. Your franchise journey begins on the ground.
          </div>
          <div className="hero-chips">
            {[
              { label:'Phase 1 ✓', color:'#22C55E', bg:'rgba(34,197,94,0.1)', border:'rgba(34,197,94,0.3)' },
              { label:'Phase 2 ✓', color:'#22C55E', bg:'rgba(34,197,94,0.1)', border:'rgba(34,197,94,0.3)' },
              { label:'KYC ✓',     color:'#22C55E', bg:'rgba(34,197,94,0.1)', border:'rgba(34,197,94,0.3)' },
              { label:'Trial: Upcoming', color:'#FF7A29', bg:'rgba(255,122,41,0.1)', border:'rgba(255,122,41,0.3)' },
            ].map(c => (
              <div key={c.label} style={{ background:c.bg, border:`1px solid ${c.border}`, padding:'6px 16px', fontSize:12, fontWeight:700, color:c.color, fontFamily:'Montserrat,sans-serif', borderRadius:12 }}>{c.label}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SEASON ROADMAP RAIL ── */}
      <div style={{ background:'#040C18', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'20px 0', overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
        <div className="wrap">
          <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'rgba(255,255,255,0.25)', marginBottom:14 }}>YOUR JOURNEY</div>
          <div className="roadmap-rail">
            {ROADMAP.map((node, i) => (
              <React.Fragment key={i}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, minWidth:60 }}>
                  <div style={{
                    width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0,
                    background: node.done ? '#22C55E' : node.active ? '#FF7A29' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${node.done ? '#22C55E' : node.active ? '#FF7A29' : 'rgba(255,255,255,0.12)'}`,
                    animation: node.active ? 'pulseOrange 2s ease infinite' : 'none',
                  }}>
                    {node.done ? '✓' : node.icon}
                  </div>
                  <div className="roadmap-node-label" style={{ color: node.done ? '#22C55E' : node.active ? '#FF7A29' : 'rgba(255,255,255,0.3)' }}>{node.label}</div>
                </div>
                {i < ROADMAP.length - 1 && (
                  <div style={{ flex:1, height:2, background: node.done ? '#22C55E' : 'rgba(255,255,255,0.08)', margin:'0 4px', marginBottom:20, minWidth:8 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="wrap" style={{ paddingTop:40 }}>
        <div className="profile-grid">

          {/* LEFT — Player Profile */}
          <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderTop:'3px solid #FF7A29' }}>
            <div style={{ padding:'20px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'rgba(255,255,255,0.35)', marginBottom:6 }}>PLAYER PROFILE</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(22px,4vw,28px)', color:'#fff', letterSpacing:'-.01em' }}>Rahul Sharma</div>
            </div>
            <div style={{ padding:'20px' }}>
              <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
                <div className="chip" style={{ background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)', color:'#93C5FD' }}>🏏 Batsman</div>
                <div className="chip" style={{ background:'rgba(255,122,41,0.1)', border:'1px solid rgba(255,122,41,0.3)', color:'#FF7A29' }}>📍 Mumbai</div>
              </div>

              {[
                { label:'Phase 1 Booking Ref', value:'BCPL-S5-MUM-BAT-7432', mono:true },
                { label:'Phase 2 Booking Ref', value:'BCPL-S5-P2-MUM-BAT-8821', mono:true },
                { label:'T-Shirt Size', value:'L' },
                { label:'Company', value:'Infosys Pvt. Ltd.' },
                { label:'KYC Status', value:'✅ Verified', green:true },
              ].map(row => (
                <div key={row.label} className="profile-info-row">
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600, flexShrink:0 }}>{row.label}</div>
                  <div style={{ fontSize: row.mono ? 11 : 12, fontWeight:700, color: row.green ? '#22C55E' : 'rgba(255,255,255,0.8)', fontFamily: row.mono ? 'monospace' : 'inherit', textAlign:'right', wordBreak:'break-all', marginLeft:8 }}>{row.value}</div>
                </div>
              ))}

              <button className="btn-outline" style={{ width:'100%', padding:'13px', marginTop:20, fontSize:13 }}>
                📄 Download Player ID Card →
              </button>
            </div>
          </div>

          {/* RIGHT — Trial Details */}
          <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderTop:'3px solid #E8B23D' }}>
            <div style={{ padding:'20px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'rgba(255,255,255,0.35)', marginBottom:6 }}>TRIAL INFORMATION</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,3vw,22px)', color:'#fff' }}>Physical Trial Details</div>
            </div>
            <div style={{ padding:'20px' }}>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'rgba(255,255,255,0.35)', marginBottom:8 }}>TRIAL CITY</div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:28 }}>🏟</span>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(24px,5vw,32px)', color:'#fff' }}>Mumbai</div>
                </div>
              </div>

              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'rgba(255,255,255,0.35)', marginBottom:6 }}>TRIAL GROUND</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)', fontStyle:'italic' }}>To be announced</div>
              </div>

              <div style={{ background:'rgba(232,178,61,0.06)', border:'1px solid rgba(232,178,61,0.2)', padding:'20px 16px', marginBottom:20 }}>
                <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'rgba(255,255,255,0.35)', marginBottom:8 }}>TRIAL DATE</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(24px,6vw,40px)', color:'#E8B23D', lineHeight:1, marginBottom:8, animation:'countdownPulse 2s ease infinite' }}>
                  COMING SOON
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:4 }}>
                  You'll receive SMS + Email <strong style={{ color:'#fff' }}>30 days before</strong> your trial date.
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>Expected: March–June 2026</div>
              </div>

              <button className="btn-outline" style={{ width:'100%', padding:'13px', fontSize:13, marginBottom:12 }}>
                📍 View Mumbai on Google Maps →
              </button>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', textAlign:'center', fontStyle:'italic' }}>Exact ground address will be shared 30 days before trial</div>
            </div>
          </div>
        </div>

        {/* ── IMPORTANT NOTICES ── */}
        <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'rgba(255,255,255,0.25)', marginBottom:16 }}>IMPORTANT UPDATES</div>
        <div className="notices-grid">
          {[
            { icon:'💬', title:'Stay Connected', body:'Join the BCPL Mumbai Players WhatsApp group for real-time trial updates, schedule announcements and coordination.', cta:'Join WhatsApp Group →', color:'#25D366', onClick: () => window.open('https://wa.me/919999999999?text=Hi%2C%20I%20want%20to%20join%20the%20BCPL%20Players%20WhatsApp%20group', '_blank') },
            { icon:'🏋️', title:'Prepare Now', body:'Train consistently. Scouts value fitness and skill. Focus on your strengths — batting technique, bowling rhythm, or all-round conditioning.', cta:'View Training Tips →', color:'#FF7A29', onClick: () => { const el = document.getElementById('training-tips'); if(el) el.scrollIntoView({behavior:'smooth'}); } },
            { icon:'📧', title:'Check Your Email', body:'All trial updates, schedule and instructions will be sent to your registered email & WhatsApp number.', cta:'Manage Preferences →', color:'#3B82F6', onClick: () => {} },
          ].map(card => (
            <div key={card.title} className="notice-card">
              <div style={{ fontSize:28, marginBottom:10 }}>{card.icon}</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#fff', marginBottom:6 }}>{card.title}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:16 }}>{card.body}</div>
              <button onClick={card.onClick} style={{ background:'none', border:`1px solid ${card.color}40`, color:card.color, padding:'8px 16px', fontSize:11, fontWeight:700, fontFamily:'Montserrat,sans-serif', cursor:'pointer', borderRadius:12, letterSpacing:'.04em', transition:'all .2s' }}>
                {card.cta}
              </button>
            </div>
          ))}
        </div>

        {/* ── TRAINING TIPS ── */}
        <div id="training-tips" style={{ background:'#0A1727', border:'1px solid rgba(255,122,41,0.2)', borderRadius:12, padding:'24px 20px', marginBottom:28 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#FF7A29', letterSpacing:'.06em', marginBottom:4 }}>🏋️ TRAINING TIPS FOR PHYSICAL TRIAL</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:20 }}>Franchise scouts evaluate these key areas during the ground trial</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {[
              { icon:'🏃', title:'Fitness First', tip:'30 min cardio daily. Scouts notice your stamina in the last over as much as the first.' },
              { icon:'🏏', title:'Master Your Core Skill', tip:'Spend 70% of practice on your primary role. Consistency beats variety at trials.' },
              { icon:'🎯', title:'Video Review', tip:'Watch back your own practice sessions. Identify one technical flaw and fix it weekly.' },
              { icon:'🧘', title:'Match Simulation', tip:'Practice under pressure — tape a match format with others. React-time decisions matter.' },
              { icon:'💪', title:'Strength & Agility', tip:'Focus on rotational strength (core, shoulders) and lateral movement. Cricket is explosive, not endurance.' },
              { icon:'🍎', title:'Nutrition', tip:'High protein, complex carbs 3 hours before trial. Avoid heavy meals on trial day.' },
            ].map(t => (
              <div key={t.title} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'14px 14px', borderLeft:`3px solid rgba(255,122,41,0.4)` }}>
                <div style={{ fontSize:22, marginBottom:8 }}>{t.icon}</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#fff', marginBottom:6 }}>{t.title}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>{t.tip}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Season 5 phase summary */}
        <div className="season-cta">
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'#fff', marginBottom:4 }}>You're in the top bracket.</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>Only players who clear Phase 1 video + Phase 2 KYC reach the physical trial. You're one step from the auction floor.</div>
          </div>
          <button className="btn-primary season-cta-btn"
            onClick={() => { window.location.href = import.meta.env.BASE_URL.replace(/\/$/, '') + '/#timeline'; }}>
            VIEW SEASON 5 ROADMAP →
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#040C18', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'32px 0 20px', marginTop:60 }}>
        <div className="wrap">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16, marginBottom:16 }}>
            <div>
                            <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{ height:42, width:'auto', objectFit:'contain', display:'block', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}/>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px' }}>
                <span style={{ fontSize:9 }}>🏆</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:3 }}>#OfficeSeStadiumtak</div>
            </div>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              {['About','Teams','FAQ','Contact','Terms','Privacy','Refunds'].map(l => (
                <a key={l} href="#" style={{ fontSize:12, color:'rgba(255,255,255,0.4)', textDecoration:'none', fontWeight:600 }}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:14, fontSize:11, color:'rgba(255,255,255,0.2)', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <span>Season 5 · BCPL Pvt. Ltd.</span>
            <span>© 2026 BCPL. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
