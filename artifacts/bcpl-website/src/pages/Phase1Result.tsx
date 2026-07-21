import React, { useState } from 'react';

const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
const NAV_ROUTES: Record<string,string> = { 'Home':'', 'Match Center':'match-center', 'Teams':'teams', 'Sponsors':'sponsors', 'Photos':'photos', 'Videos':'videos', 'About':'about', 'FAQ':'faq', 'Contact':'contact' };

export function Phase1Result() {
  const [result, setResult] = useState<'selected'|'rejected'>('selected');
  const [email, setEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

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
        @keyframes shimOrange{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.1}}
        @keyframes pulseOrange{0%,100%{box-shadow:0 0 0 0 rgba(255,122,41,0.5)}50%{box-shadow:0 0 0 12px rgba(255,122,41,0)}}
        @keyframes diagonalStripe{from{background-position:0 0}to{background-position:60px 60px}}
        @keyframes scaleIn{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes countdownPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,122,41,0.3)}50%{box-shadow:0 0 0 8px rgba(255,122,41,0)}}

        /* Phase 2 CTA items */
        .p2-items-grid{display:grid;grid-template-columns:1fr;gap:12px}
        @media(min-width:540px){.p2-items-grid{grid-template-columns:repeat(3,1fr)}}

        /* Phase 2 CTA row */
        .p2-cta-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
        .p2-cta-btn{flex:2;padding:18px 0;font-size:14px;letter-spacing:.06em;min-width:200px;width:100%}
        @media(min-width:540px){.p2-cta-btn{width:auto}}
        .p2-time-warn{flex:1;min-width:180px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);padding:10px 16px;border-radius:12px}

        /* Mini ticket */
        .mini-ticket{background:#060C18;border:1px solid rgba(255,122,41,0.3);padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px}

        /* Notify row */
        .notify-row{display:flex;gap:10px;flex-wrap:wrap}
        .notify-row input{flex:1;min-width:180px}
        .notify-row button{width:100%}
        @media(min-width:480px){.notify-row button{width:auto}}

        /* Scout eval header */
        .scout-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px}

        /* Footer links */
        .footer-links{display:flex;gap:20px;flex-wrap:wrap}
        .footer-bottom{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
      `}</style>

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
      <nav style={{ position:'sticky', top:0, zIndex:300, background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
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

      {menuOpen && (
        <div style={{ position:'fixed', inset:0, background:'#040C18', zIndex:400, display:'flex', flexDirection:'column', padding:'72px 24px 40px', overflowY:'auto' }}>
          <button onClick={() => setMenuOpen(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:38, height:38, borderRadius:4, cursor:'pointer', fontSize:18 }}>✕</button>
          {NAV.map(l => <a key={l} href="#" style={{ color:'rgba(255,255,255,0.85)', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{l}</a>)}
          <button className="btn-primary" style={{ marginTop:24, padding:'16px', fontSize:15 }}>REGISTER NOW →</button>
        </div>
      )}

      {/* ── TOGGLE BAR ── */}
      <div style={{ background:'#040C18', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'12px 0' }}>
        <div className="wrap" style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:12 } as any}>
          <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em', fontFamily:'Montserrat,sans-serif' }}>PHASE 1 RESULT:</span>
          <div style={{ display:'flex', borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setResult('selected')}
              style={{ padding:'8px 18px', fontSize:12, fontWeight:800, fontFamily:'Montserrat,sans-serif', border:'none', cursor:'pointer', letterSpacing:'.06em', background: result==='selected' ? '#22C55E' : 'rgba(255,255,255,0.04)', color: result==='selected' ? '#fff' : 'rgba(255,255,255,0.4)', transition:'all .2s' }}
            >✅ SELECTED</button>
            <button
              onClick={() => setResult('rejected')}
              style={{ padding:'8px 18px', fontSize:12, fontWeight:800, fontFamily:'Montserrat,sans-serif', border:'none', borderLeft:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', letterSpacing:'.06em', background: result==='rejected' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)', color: result==='rejected' ? '#EF4444' : 'rgba(255,255,255,0.4)', transition:'all .2s' }}
            >❌ NOT SELECTED</button>
          </div>
        </div>
      </div>

      {/* ══════════════ SELECTED STATE ══════════════ */}
      {result === 'selected' && (
        <div>
          {/* Hero */}
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
                {['🏏 Batsman','📍 Mumbai','🎟 BCPL-S5-MUM-BAT-7432'].map(c => (
                  <div key={c} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'6px 14px', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.8)', fontFamily:'Montserrat,sans-serif' }}>{c}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height:3, background:'linear-gradient(90deg,transparent,#FF7A29,#E8B23D,#FF7A29,transparent)' }} />

          <div className="wrap" style={{ paddingTop:40, paddingBottom:80 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:24 }}>
              {/* Phase 2 CTA */}
              <div style={{ background:'#0A1727', border:'1px solid rgba(255,122,41,0.25)' }}>
                <div style={{ background:'linear-gradient(135deg,rgba(255,122,41,0.15),rgba(255,122,41,0.05))', borderBottom:'1px solid rgba(255,122,41,0.2)', padding:'20px 20px' }}>
                  <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.18em', color:'#FF7A29', marginBottom:6 }}>YOUR NEXT STEP</div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,4vw,22px)', color:'#fff' }}>PHASE 2 — PHYSICAL TRIAL</div>
                </div>
                <div style={{ padding:'24px 20px' }}>
                  <div className="p2-items-grid" style={{ marginBottom:24 }}>
                    {[
                      { icon:'🏟', title:'Ground Trial', sub:'Physical trial at Mumbai cricket ground' },
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

                  {/* Mini match-ticket */}
                  <div className="mini-ticket">
                    <div>
                      <div style={{ fontSize:9, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'#FF7A29', marginBottom:4 }}>PHASE 2 ENTRY FEE</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>Payable now to secure your spot</div>
                    </div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(32px,8vw,42px)', color:'#FF7A29' }}>₹2,000</div>
                  </div>

                  <div className="p2-cta-row">
                    <button className="btn-gold p2-cta-btn" style={{ padding:'18px 0', fontSize:15, letterSpacing:'.06em' }}
                      onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/phase2/payment'; }}>
                      CLAIM YOUR PHASE 2 SPOT — PAY ₹2,000 →
                    </button>
                    <div className="p2-time-warn">
                      <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', color:'#EF4444', letterSpacing:'.12em', marginBottom:2 }}>⚠️ TIME SENSITIVE</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>Phase 2 spot reserved for <strong style={{ color:'#fff' }}>limited time</strong> only</div>
                    </div>
                  </div>
                  {/* TEST MODE */}
                  <div style={{ marginTop:14, textAlign:'center', borderTop:'1px dashed rgba(255,255,255,0.06)', paddingTop:12 }}>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.12)', marginBottom:6, letterSpacing:'.08em' }}>— TEST MODE ONLY —</div>
                    <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/phase2/payment'; }}
                        style={{ padding:'5px 12px', background:'none', border:'1px dashed rgba(232,178,61,0.3)', borderRadius:8, color:'rgba(232,178,61,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>→ Phase 2 Payment</button>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/phase2/payment-receipt'; }}
                        style={{ padding:'5px 12px', background:'none', border:'1px dashed rgba(232,178,61,0.3)', borderRadius:8, color:'rgba(232,178,61,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>→ Phase 2 Receipt</button>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/phase2/kyc'; }}
                        style={{ padding:'5px 12px', background:'none', border:'1px dashed rgba(232,178,61,0.3)', borderRadius:8, color:'rgba(232,178,61,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>→ Phase 2 KYC</button>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/phase2/kyc-approved'; }}
                        style={{ padding:'5px 12px', background:'none', border:'1px dashed rgba(232,178,61,0.3)', borderRadius:8, color:'rgba(232,178,61,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>→ KYC Approved</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ NOT SELECTED STATE ══════════════ */}
      {result === 'rejected' && (
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
                {['🏏 Batsman','📍 Mumbai','Season 5 Participant'].map(c => (
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
                Your ₹299 entry fee is non-refundable as your video was reviewed in full by our BCCI-certified scouts. Scouts provide a thorough evaluation for every submitted video regardless of outcome.
              </p>
            </div>

            <div style={{ background:'rgba(255,122,41,0.05)', border:'1px solid rgba(255,122,41,0.15)', padding:'20px 20px', marginBottom:24 }}>
              <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'#FF7A29', marginBottom:8 }}>🏋️ KEEP TRAINING</div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.7 }}>
                BCPL Season 6 registrations open in approximately 6 months. Use this time to train consistently. Many of our best auction picks were Season 2–3 rejections who came back stronger.
              </p>
            </div>

            <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', padding:'24px 20px' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff', marginBottom:4 }}>Get Notified for Season 6</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:16 }}>Be first to know when Season 6 registrations open.</div>
              <div className="notify-row">
                <input className="field-inp" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" style={{ flex:1, minWidth:180 }} />
                <button className="btn-primary" style={{ padding:'13px 24px', fontSize:13, letterSpacing:'.06em', whiteSpace:'nowrap' }}>NOTIFY ME →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background:'#040C18', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'32px 0 20px' }}>
        <div className="wrap">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:20, marginBottom:24 }}>
            <div>
                            <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{ height:42, width:'auto', objectFit:'contain', display:'block', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}/>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px' }}>
                <span style={{ fontSize:9 }}>🏆</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>#OfficeSeStadiumtak</div>
            </div>
            <div className="footer-links">
              {['About','Teams','FAQ','Contact','Terms','Privacy','Refunds'].map(l => (
                <a key={l} href="#" style={{ fontSize:12, color:'rgba(255,255,255,0.4)', textDecoration:'none', fontWeight:600 }}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:16, fontSize:11, color:'rgba(255,255,255,0.25)' }} className="footer-bottom">
            <span>Season 5 · BCPL Pvt. Ltd.</span>
            <span>© 2026 BCPL. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
