import React, { useState, useEffect } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { getRegistrationStatus, isAuthenticated } from '../lib/api';

const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
const NAV_ROUTES: Record<string,string> = { 'Home':'', 'Match Center':'match-center', 'Teams':'teams', 'Sponsors':'sponsors', 'Photos':'photos', 'Videos':'videos', 'About':'about', 'FAQ':'faq', 'Contact':'contact' };

const ROLE_LABELS: Record<string, string> = {
  bat: '🏏 Batsman', bowl: '🎳 Bowler', wk: '🧤 Wicket-Keeper', ar: '⭐ All-Rounder',
};
const PHASE2_FEES: Record<string, number> = {
  bat: 2000, bowl: 2000, wk: 2000, ar: 3000,
};

function formatRegId(id: string, _role: string, city: string) {
  // Fallback only — real sequential number comes from the API (regNumber)
  const cityCode = (city || 'XX').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
  const suffix = id.replace(/-/g, '').slice(-4).toUpperCase();
  return `BCPL-${cityCode}-${suffix}`;
}

export function Phase1Result() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [result, setResult]       = useState<'selected' | 'rejected' | null>(null);
  const [role, setRole]           = useState('bat');
  const [city, setCity]           = useState('');
  const [regId, setRegId]         = useState('');
  const [phase2Fee, setPhase2Fee] = useState(2000);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.replace('/register');
      return;
    }
    getRegistrationStatus().then((s: any) => {
      if (!s.registered) { window.location.replace('/register'); return; }
      const st = s.phase1Status;
      if (st === 'pending')         { window.location.replace('/register'); return; }
      if (st === 'payment_done')    { window.location.replace('/register/upload-video'); return; }
      if (st === 'video_submitted') {
        // Still under review — show a pending message on this page
        setResult(null);
      } else if (st === 'selected') {
        setResult('selected');
      } else if (st === 'rejected') {
        setResult('rejected');
      }
      setRole(s.role ?? 'bat');
      setCity(s.trialCity ?? '');
      setRegId(s.regNumber ?? s.registrationId ?? '');
      setPhase2Fee(Math.round((PHASE2_FEES[s.role ?? 'bat'] ?? 2000) * 1.18));
    }).catch((e: any) => {
      setError(e.message ?? 'Failed to load result. Please refresh.');
    }).finally(() => setLoading(false));
  }, []);

  const roleLabel = ROLE_LABELS[role] ?? role;
  // If regId already looks like BCPL-XXX-N (from API), use it directly
  const formattedId = regId ? (regId.startsWith('BCPL-') ? regId : formatRegId(regId, role, city)) : '';

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', fontFamily:"'Inter',sans-serif", color:'#F0EDE8', overflowX:'hidden', paddingBottom:40 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .wrap{max-width:1200px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .btn-primary{background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:.06em;cursor:pointer;transition:transform .15s,filter .2s}
        .btn-primary:hover{filter:brightness(1.15);transform:translateY(-2px)}
        .btn-gold{background:linear-gradient(135deg,#E8B23D,#C49A1E);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:.06em;cursor:pointer;transition:all .2s}
        .btn-gold:hover{filter:brightness(1.1);transform:translateY(-2px)}
        .field-inp{width:100%;background:#0C1A2E;border:none;border-bottom:2px solid rgba(255,122,41,0.4);color:#F0EDE8;padding:13px 16px;font-family:Inter,sans-serif;font-size:15px;outline:none;transition:border-color .2s}
        .field-inp:focus{border-bottom-color:#FF7A29}
        .field-inp::placeholder{color:rgba(255,255,255,0.25)}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.1}}
        @keyframes diagonalStripe{from{background-position:0 0}to{background-position:60px 60px}}
        @keyframes scaleIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .p2-items-grid{display:grid;grid-template-columns:1fr;gap:12px}
        @media(min-width:540px){.p2-items-grid{grid-template-columns:repeat(3,1fr)}}
        .p2-cta-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
        .p2-cta-btn{flex:2;padding:18px 0;font-size:14px;letter-spacing:.06em;min-width:200px;width:100%}
        @media(min-width:540px){.p2-cta-btn{width:auto}}
        .mini-ticket{background:#060C18;border:1px solid rgba(255,122,41,0.3);padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px}
      `}</style>

      {/* ── STICKY TOP ── */}
      <div style={{ position:'sticky', top:0, zIndex:300 }}>
        <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
          <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 28s linear infinite' }}>
            {[...Array(4)].map((_,i) => (
              <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff' }}>
                &nbsp;🏏 SEASON 5 REGISTRATIONS OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 50+ CITIES &nbsp;·&nbsp; BACKED BY SOURAV GANGULY &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
              </span>
            ))}
          </div>
        </div>

        <nav style={{ background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
          <div className="wrap" style={{ height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
              <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{ height:42, width:'auto', objectFit:'contain', display:'block', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}/>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px' }}>
                <span style={{ fontSize:9 }}>🏆</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
              </div>
            </a>
            <div className="desk-nav">
              {NAV.map(l => <a key={l} href={'/' + NAV_ROUTES[l]} style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, textDecoration:'none', letterSpacing:'.04em' }}>{l}</a>)}
              <a href="/register" className="btn-primary" style={{ padding:'10px 24px', fontSize:12, textDecoration:'none' }}>REGISTER NOW →</a>
            </div>
            <button className="ham-btn" onClick={() => setMenuOpen(o => !o)}>
              {[0,1,2].map(i => <span key={i} style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:1 }} />)}
            </button>
          </div>
        </nav>
      </div>

      {menuOpen && (
        <div style={{ position:'fixed', inset:0, background:'#040C18', zIndex:400, display:'flex', flexDirection:'column', padding:'72px 24px 40px', overflowY:'auto' }}>
          <button onClick={() => setMenuOpen(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:38, height:38, borderRadius:4, cursor:'pointer', fontSize:18 }}>✕</button>
          {NAV.map(l => <a key={l} href={'/' + NAV_ROUTES[l]} onClick={()=>setMenuOpen(false)} style={{ color:'rgba(255,255,255,0.85)', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{l}</a>)}
          <a href="/register" className="btn-primary" style={{ marginTop:24, padding:'16px', fontSize:15, textAlign:'center', textDecoration:'none' }}>REGISTER NOW →</a>
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16 }}>
          <div style={{ width:40, height:40, border:'3px solid rgba(255,122,41,0.2)', borderTopColor:'#FF7A29', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>Loading your result...</div>
        </div>
      )}

      {/* ── ERROR ── */}
      {!loading && error && (
        <div className="wrap" style={{ paddingTop:60, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
          <div style={{ fontSize:15, color:'#EF4444', marginBottom:16 }}>{error}</div>
          <button onClick={() => window.location.reload()} className="btn-primary" style={{ padding:'12px 28px', fontSize:13 }}>Refresh →</button>
        </div>
      )}

      {/* ── VIDEO UNDER REVIEW ── */}
      {!loading && !error && result === null && (
        <div className="wrap" style={{ paddingTop:60, textAlign:'center', paddingBottom:80 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎬</div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:24, color:'#A855F7', marginBottom:12 }}>Your Video is Under Review</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
            Our BCCI-certified scouts are reviewing your trial video.<br/>
            You will receive your result via <strong style={{color:'rgba(255,255,255,0.7)'}}>SMS + Email</strong> within 15 working days.
          </div>
          {formattedId && (
            <div style={{ marginTop:24, display:'inline-block', background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:12, padding:'10px 20px', fontSize:12, fontWeight:700, color:'#A855F7', fontFamily:'Montserrat,sans-serif' }}>
              🎟 {formattedId}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ SELECTED ══════════════ */}
      {!loading && !error && result === 'selected' && (
        <div>
          <div style={{ position:'relative', overflow:'hidden', paddingTop:56, paddingBottom:48, background:'#06101E' }}>
            <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg, rgba(255,122,41,0.04) 0px, rgba(255,122,41,0.04) 1px, transparent 1px, transparent 30px)', animation:'diagonalStripe 3s linear infinite', pointerEvents:'none' }} />
            <div style={{ position:'absolute', top:0, right:0, width:'50%', height:'100%', background:'radial-gradient(ellipse at right top, rgba(232,178,61,0.1) 0%, transparent 60%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', left:0, top:0, width:'6px', height:'100%', background:'linear-gradient(180deg,#FF7A29,#E8B23D)' }} />

            <div className="wrap" style={{ textAlign:'center', position:'relative', zIndex:1 }}>
              <div style={{ fontSize:48, marginBottom:16, animation:'scaleIn .6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(12px,1.5vw,14px)', letterSpacing:'.2em', color:'rgba(255,255,255,0.5)', marginBottom:8, textTransform:'uppercase' }}>Phase 1 Result</div>
              <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(28px,5vw,60px)', lineHeight:.95, textTransform:'uppercase', letterSpacing:'-.01em', marginBottom:12, animation:'fadeUp .5s ease .1s both' }}>
                <span style={{ color:'#fff', display:'block' }}>CONGRATULATIONS!</span>
                <span style={{ background:'linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D)', backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'shimGold 3s linear infinite', display:'block' }}>YOU'VE BEEN SELECTED</span>
                <span style={{ color:'rgba(255,255,255,0.9)', display:'block', fontSize:'80%' }}>FOR PHASE 2</span>
              </h1>
              <p style={{ color:'rgba(255,255,255,0.55)', fontSize:15, maxWidth:500, margin:'0 auto 24px', lineHeight:1.6, animation:'fadeUp .5s ease .2s both' }}>
                Your trial video impressed our BCCI-certified scouts. You've earned your spot.
              </p>
              <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap', marginBottom:24 }}>
                {[roleLabel, `📍 ${city}`, `🎟 ${formattedId}`].filter(Boolean).map(c => (
                  <div key={c} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'6px 14px', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.8)', fontFamily:'Montserrat,sans-serif' }}>{c}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height:3, background:'linear-gradient(90deg,transparent,#FF7A29,#E8B23D,#FF7A29,transparent)' }} />

          <div className="wrap" style={{ paddingTop:40, paddingBottom:80 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:24 }}>
              <div style={{ background:'#0A1727', border:'1px solid rgba(255,122,41,0.25)' }}>
                <div style={{ background:'linear-gradient(135deg,rgba(255,122,41,0.15),rgba(255,122,41,0.05))', borderBottom:'1px solid rgba(255,122,41,0.2)', padding:'20px 20px' }}>
                  <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.18em', color:'#FF7A29', marginBottom:6 }}>YOUR NEXT STEP</div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,4vw,22px)', color:'#fff' }}>PHASE 2 — PHYSICAL TRIAL</div>
                </div>
                <div style={{ padding:'24px 20px' }}>
                  <div className="p2-items-grid" style={{ marginBottom:24 }}>
                    {[
                      { icon:'🏟', title:'Ground Trial', sub:`Physical trial at ${city} cricket ground` },
                      { icon:'📋', title:'Franchise Eval', sub:'Coaching staff assesses your skills directly' },
                      { icon:'🔨', title:'Live Auction', sub:'Franchises bid on you in front of everyone' },
                    ].map(item => (
                      <div key={item.title} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', padding:'16px', borderTop:'2px solid rgba(255,122,41,0.3)' }}>
                        <span style={{ fontSize:24, display:'block', marginBottom:8 }}>{item.icon}</span>
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#fff', marginBottom:4 }}>{item.title}</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>{item.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mini-ticket">
                    <div>
                      <div style={{ fontSize:9, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'#FF7A29', marginBottom:4 }}>PHASE 2 ENTRY FEE (incl. GST)</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>Payable now to secure your spot</div>
                    </div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(32px,8vw,42px)', color:'#FF7A29' }}>₹{phase2Fee.toLocaleString('en-IN')}</div>
                  </div>

                  <div className="p2-cta-row">
                    <button className="btn-gold p2-cta-btn"
                      onClick={() => { window.location.href = '/register/phase2'; }}>
                      CLAIM YOUR PHASE 2 SPOT — PAY ₹{phase2Fee.toLocaleString('en-IN')} →
                    </button>
                    <div style={{ flex:1, minWidth:180, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', padding:'10px 16px', borderRadius:12 }}>
                      <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', color:'#EF4444', letterSpacing:'.12em', marginBottom:2 }}>⚠️ TIME SENSITIVE</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>Phase 2 spot reserved for <strong style={{ color:'#fff' }}>limited time</strong> only</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ REJECTED ══════════════ */}
      {!loading && !error && result === 'rejected' && (
        <div>
          <div style={{ position:'relative', overflow:'hidden', paddingTop:56, paddingBottom:48, background:'#06101E' }}>
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.25)', pointerEvents:'none' }} />
            <div className="wrap" style={{ textAlign:'center', position:'relative', zIndex:1 }}>
              <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.2em', color:'rgba(255,255,255,0.35)', marginBottom:8, textTransform:'uppercase' }}>Phase 1 Result</div>
              <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(28px,4vw,52px)', lineHeight:.95, textTransform:'uppercase', letterSpacing:'-.01em', marginBottom:12, color:'rgba(255,255,255,0.65)' }}>
                BETTER LUCK<br/>NEXT SEASON.
              </h1>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14, maxWidth:480, margin:'0 auto 24px', lineHeight:1.7 }}>
                Thank you for participating in BCPL Season 5 trials. Our BCCI-certified scouts carefully reviewed your video submission.
              </p>
              <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap' }}>
                {[roleLabel, `📍 ${city}`, 'Season 5 Participant'].filter(Boolean).map(c => (
                  <div key={c} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'6px 14px', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', fontFamily:'Montserrat,sans-serif' }}>{c}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height:2, background:'rgba(255,255,255,0.06)' }} />

          <div className="wrap" style={{ paddingTop:40, paddingBottom:80, maxWidth:680 }}>
            <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderLeft:'4px solid rgba(255,255,255,0.2)', padding:'20px 20px', marginBottom:24 }}>
              <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'rgba(255,255,255,0.4)', marginBottom:8 }}>REGARDING YOUR ENTRY FEE</div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.7 }}>
                Your entry fee is non-refundable as your video was reviewed in full by our BCCI-certified scouts. Scouts provide a thorough evaluation for every submitted video regardless of outcome.
              </p>
            </div>

            <div style={{ background:'rgba(255,122,41,0.05)', border:'1px solid rgba(255,122,41,0.15)', padding:'20px 20px', marginBottom:24 }}>
              <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'#FF7A29', marginBottom:8 }}>🏋️ KEEP TRAINING</div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.7 }}>
                BCPL Season 6 registrations open in approximately 6 months. Use this time to train consistently. Many of our best auction picks were Season 2–3 rejections who came back stronger.
              </p>
            </div>
          </div>
        </div>
      )}

      <BCPLFooter />
    </div>
  );
}
