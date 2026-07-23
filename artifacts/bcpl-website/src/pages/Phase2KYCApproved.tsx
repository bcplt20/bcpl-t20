import React, { useState, useEffect } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getDashboard } from '../lib/api';
import { getSession } from '../lib/auth';

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
  const [playerName, setPlayerName] = useState('Player');
  const [playerCity, setPlayerCity] = useState('—');
  const [regIdShort, setRegIdShort] = useState('—');
  const [playerRole, setPlayerRole] = useState('—');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const BASE = import.meta.env.BASE_URL;

  useEffect(() => {
    const session = getSession();
    if (!session) { window.location.href = BASE + 'register'; return; }
    getDashboard().then(d => {
      if (d.user)         setPlayerName(d.user.name);
      if (d.user?.email)  setPlayerEmail(d.user.email);
      if (d.user?.phone)  setPlayerPhone(d.user.phone);
      if (d.registration?.trialCity) setPlayerCity(d.registration.trialCity);
      if (d.registration?.id)        setRegIdShort('BCPL-' + d.registration.id.slice(0,8).toUpperCase());
      if (d.registration?.role)      setPlayerRole(d.registration.role);
    }).catch(() => {});
  }, []);

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

      <SiteHeader />

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
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(22px,4vw,28px)', color:'#fff', letterSpacing:'-.01em' }}>{playerName}</div>
            </div>
            <div style={{ padding:'20px' }}>
              <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
                <div className="chip" style={{ background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)', color:'#93C5FD' }}>🏏 {playerRole}</div>
                <div className="chip" style={{ background:'rgba(255,122,41,0.1)', border:'1px solid rgba(255,122,41,0.3)', color:'#FF7A29' }}>📍 {playerCity}</div>
              </div>

              {[
                { label:'Registration No.', value:regIdShort, mono:true },
                { label:'Email', value:playerEmail || '—', mono:false },
                { label:'Phone', value:playerPhone || '—', mono:false },
                { label:'KYC Status', value:'✅ Verified', green:true },
              ].map(row => (
                <div key={row.label} className="profile-info-row">
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600, flexShrink:0 }}>{row.label}</div>
                  <div style={{ fontSize: row.mono ? 11 : 12, fontWeight:700, color: row.green ? '#22C55E' : 'rgba(255,255,255,0.8)', fontFamily: row.mono ? 'monospace' : 'inherit', textAlign:'right', wordBreak:'break-all', marginLeft:8 }}>{row.value}</div>
                </div>
              ))}

              <button className="btn-outline" style={{ width:'100%', padding:'13px', marginTop:20, fontSize:13 }} onClick={() => {
                const logoUrl = `${window.location.origin}${import.meta.env.BASE_URL}bcpl-assets/bcpl-logo-white.png`;
                const initials = playerName.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2);
                const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BCPL Player ID — ${playerName}</title><style>body{margin:0;background:#030E1C;display:flex;justify-content:center;padding:32px;font-family:'Segoe UI',sans-serif}.card{width:340px;background:linear-gradient(145deg,#0D1F3C,#06101E);border:1.5px solid rgba(255,122,41,0.45);border-radius:18px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6)}.stripe{height:4px;background:linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)}.head{background:linear-gradient(135deg,#FF7A29,#C94E0E);padding:14px 20px}.head-title{font-size:10px;font-weight:800;color:rgba(255,255,255,0.9);letter-spacing:.18em}.head-sub{font-size:8px;color:rgba(255,255,255,0.65);margin-top:3px;letter-spacing:.1em}.body{padding:20px 22px 16px}.avatar{width:60px;height:60px;background:linear-gradient(135deg,#FF7A29,#C94E0E);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;margin-bottom:12px;box-shadow:0 4px 20px rgba(255,122,41,0.4)}.name{font-size:20px;font-weight:900;color:#fff;margin-bottom:3px}.role{font-size:11px;font-weight:800;color:#FF7A29;letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px}hr{border:none;border-top:1px solid rgba(255,255,255,0.08);margin:12px 0}.row{display:flex;justify-content:space-between;margin-bottom:9px}.label{font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:.08em}.val{font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);text-align:right}.ref{font-family:monospace;color:#FF7A29;font-size:11px;font-weight:700}.foot{background:rgba(255,122,41,0.07);border-top:1px solid rgba(255,122,41,0.18);padding:12px 22px;display:flex;justify-content:space-between;align-items:center}.kyc{background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.4);border-radius:6px;padding:4px 11px;font-size:9px;font-weight:800;color:#22C55E;letter-spacing:.08em}.site{font-size:9px;color:rgba(255,255,255,0.25);font-weight:600}@media print{body{padding:0;background:#fff}.card{box-shadow:none}}</style></head><body><div class="card"><div class="stripe"></div><div class="head"><div class="head-title">BHARTIYA CORPORATE PREMIER LEAGUE</div><div class="head-sub">OFFICIAL PLAYER ID CARD · SEASON 5 · 2026–27</div></div><div class="body"><div class="avatar">${initials}</div><div class="name">${playerName}</div><div class="role">🏏 ${playerRole} · ${playerCity}</div><hr/><div class="row"><span class="label">Email</span><span class="val">${playerEmail}</span></div><div class="row"><span class="label">Phone</span><span class="val">${playerPhone}</span></div><hr/><div class="row"><span class="label">Registration No.</span><span class="ref">${regIdShort}</span></div><div class="row"><span class="label">KYC Status</span><span class="val" style="color:#22C55E">✅ Verified</span></div></div><div class="foot"><span class="site">bcplt20.com · BCPL Season 5</span><span class="kyc">KYC ✓ VERIFIED</span></div></div><script>window.onload=function(){window.print();}<\/script></body></html>`;
                const win = window.open('', '_blank');
                if(win){ win.document.write(html); win.document.close(); }
              }}>
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
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(24px,5vw,32px)', color:'#fff' }}>{playerCity}</div>
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
                📍 View {playerCity} on Google Maps →
              </button>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', textAlign:'center', fontStyle:'italic' }}>Exact ground address will be shared 30 days before trial</div>
            </div>
          </div>
        </div>

        {/* ── IMPORTANT NOTICES ── */}
        <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'rgba(255,255,255,0.25)', marginBottom:16 }}>IMPORTANT UPDATES</div>
        <div className="notices-grid">
          {[
            { icon:'💬', title:'Stay Connected', body:'Join the BCPL Mumbai Players WhatsApp group for real-time trial updates, schedule announcements and coordination.', cta:'Join WhatsApp Group →', color:'#25D366', onClick: () => window.open('https://wa.me/919151346555?text=Hi%2C%20I%20want%20to%20join%20the%20BCPL%20Players%20WhatsApp%20group', '_blank') },
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

      <BCPLFooter />
    </div>
  );
}
