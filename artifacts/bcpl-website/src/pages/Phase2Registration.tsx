import { useState, useEffect } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getRegistrationStatus, getMe } from '../lib/api';

const BASE = import.meta.env.BASE_URL;

type LoadState = 'loading' | 'ok' | 'not_selected' | 'error';

export function Phase2Registration() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [playerName, setPlayerName] = useState('');
  const [role, setRole]             = useState('');
  const [city, setCity]             = useState('');
  const [regId, setRegId]           = useState('');
  const [phase2Status, setPhase2Status] = useState<string|null>(null);

  // Declarations — the only thing asked before payment.
  // Employment + emergency details are collected during KYC, after payment.
  const [check1, setCheck1]     = useState(false);
  const [check2, setCheck2]     = useState(false);
  const [check3, setCheck3]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [status, me] = await Promise.all([getRegistrationStatus(), getMe()]);
        if (!status.registered || status.phase1Status !== 'selected') {
          setLoadState('not_selected'); return;
        }
        setPlayerName(me.user?.name || '');
        setRole(status.role || '');
        setCity(status.trialCity || '');
        setRegId(status.registrationId || '');
        setPhase2Status(status.phase2Status ?? null);
        setLoadState('ok');
      } catch { setLoadState('error'); }
    })();
  }, []);

  const canProceed = check1 && check2 && check3;

  const handleProceed = () => {
    window.location.href = BASE + 'register/phase2/payment';
  };

  if (loadState === 'loading') return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', fontFamily:'Inter,sans-serif' }}>
      Loading your registration…
    </div>
  );

  if (loadState === 'error') return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#EF4444', fontFamily:'Inter,sans-serif' }}>
      Error loading. <a href={BASE} style={{ color:'#FF7A29', marginLeft:8 }}>Go home</a>
    </div>
  );

  if (loadState === 'not_selected') return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24, fontFamily:'Inter,sans-serif', textAlign:'center' }}>
      <div style={{ fontSize:48 }}>🏏</div>
      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff' }}>Phase 2 Not Accessible Yet</div>
      <div style={{ fontSize:14, color:'#64748B', maxWidth:360 }}>Phase 2 is only available after your Phase 1 video has been reviewed and you've been selected by scouts.</div>
      <a href={BASE + 'register/video-upload'} style={{ padding:'12px 28px', borderRadius:12, background:'linear-gradient(135deg,#FF7A29,#D95E10)', color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, textDecoration:'none', marginTop:8 }}>Go to Video Upload →</a>
    </div>
  );

  // Already moved past this step
  if (phase2Status && phase2Status !== 'pending') {
    window.location.href = BASE + 'register/phase2/payment';
    return null;
  }

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', color:'#F0EDE8', fontFamily:"'Inter',sans-serif", overflowX:'hidden', paddingBottom:'calc(120px + env(safe-area-inset-bottom))' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes stepIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        .wrap{max-width:1200px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:18px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .main-grid{display:grid;grid-template-columns:1fr;gap:32px}
        @media(min-width:1024px){.main-grid{grid-template-columns:1fr 320px}}
        .btn-primary{background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:0.06em;cursor:pointer;transition:filter .2s,transform .15s}
        .btn-primary:hover{filter:brightness(1.15);transform:translateY(-2px)}
        .btn-primary:disabled{opacity:.35;cursor:not-allowed;filter:none;transform:none}
        .step-enter{animation:stepIn .35s cubic-bezier(.34,1.56,.64,1) both}
        .check-row{display:flex;align-items:flex-start;gap:14px;cursor:pointer;padding:16px;border:1px solid rgba(255,255,255,0.07);background:#0A1727;transition:border-color .2s;border-radius:12px}
        .check-row:hover{border-color:rgba(255,122,41,0.3)}
        .check-row.checked{border-color:rgba(34,197,94,0.4);background:rgba(34,197,94,0.04)}
        .custom-check{width:20px;height:20px;border:2px solid rgba(255,255,255,0.2);border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .2s;margin-top:1px}
        .custom-check.checked{background:#22C55E;border-color:#22C55E}
        .nav-link{font-size:12px;font-weight:700;font-family:Montserrat,sans-serif;letter-spacing:.08em;color:rgba(255,255,255,0.65);text-decoration:none;text-transform:uppercase;cursor:pointer;transition:color .2s;background:none;border:none}
        .nav-link:hover{color:#FF7A29}
        .ticket{background:#0A1727;border:1px solid rgba(255,122,41,0.3);position:relative;overflow:visible}
        .ticket::before,.ticket::after{content:'';position:absolute;width:20px;height:20px;border-radius:50%;background:#06101E;top:50%;transform:translateY(-50%)}
        .ticket::before{left:-10px;border:1px solid rgba(255,122,41,0.3)}
        .ticket::after{right:-10px;border:1px solid rgba(255,122,41,0.3)}
        @media(max-width:480px){.ticket::before,.ticket::after{display:none}}
        .ticket-dashed{border-top:2px dashed rgba(255,122,41,0.22);margin:0 24px}
        footer a{color:rgba(255,255,255,0.45);text-decoration:none}
        footer a:hover{color:#FF7A29}
      `}</style>

      <SiteHeader />

      <div className="wrap" style={{ paddingTop:32 }}>
        {/* Selected banner */}
        <div style={{ background:'#060C18', border:'1px solid rgba(232,178,61,0.5)', borderLeft:'4px solid #E8B23D', padding:'14px 16px', marginBottom:32, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', borderRadius:12 }}>
          <span style={{ fontSize:20 }}>✅</span>
          <div style={{ flex:1 }}>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, color:'#E8B23D', letterSpacing:'.1em' }}>PHASE 1 CLEARED</span>
            <span style={{ color:'rgba(255,255,255,0.3)', margin:'0 8px' }}>|</span>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'rgba(255,255,255,0.7)' }}>Scout Selected</span>
            <span style={{ color:'rgba(255,255,255,0.3)', margin:'0 8px' }}>|</span>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'rgba(255,255,255,0.7)' }}>🏏 {role} · {city}</span>
          </div>
          <div style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.35)', borderRadius:12, padding:'4px 12px', fontSize:10, fontWeight:900, fontFamily:'Montserrat,sans-serif', color:'#22C55E', letterSpacing:'.12em' }}>SELECTED ✓</div>
        </div>

        {/* Title */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:10, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.18em', color:'#FF7A29', marginBottom:8, textTransform:'uppercase' }}>Phase 2 Onboarding</div>
          <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(22px,4vw,40px)', color:'#fff', letterSpacing:'.02em', lineHeight:1.1 }}>
            PHASE 2 — <span style={{ color:'#FF7A29' }}>PLAYER ONBOARDING</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, marginTop:10 }}>Confirm the declarations below to proceed to Phase 2 payment. Your remaining details will be collected during KYC, after payment.</p>
        </div>

        <div className="main-grid">
          {/* Declaration — the only pre-payment step */}
          <div>
            <div className="step-enter" style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'24px 20px' }}>
              <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:24 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff' }}>Terms &amp; Declaration</div>
                <div style={{ color:'rgba(255,255,255,0.45)', fontSize:13, marginTop:4 }}>Please read and confirm each statement carefully</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  { val:check1, set:setCheck1, text:'I confirm that I have not played first-class cricket, IPL, or international cricket professionally.' },
                  { val:check2, set:setCheck2, text:'I understand the trial terms, the franchise auction process, and the two-phase selection system.' },
                  { val:check3, set:setCheck3, text:'I agree to abide by the BCPL Code of Conduct throughout Season 5.' },
                ].map(({ val, set, text }, idx) => (
                  <div key={idx} className={`check-row ${val?'checked':''}`} onClick={() => set(!val)}>
                    <div className={`custom-check ${val?'checked':''}`}>{val && <span style={{ color:'#fff', fontSize:12, fontWeight:900 }}>✓</span>}</div>
                    <span style={{ fontSize:14, color: val ? '#fff' : 'rgba(255,255,255,0.65)', lineHeight:1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
              {canProceed && (
                <div style={{ marginTop:16, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:16 }}>✅</span>
                  <span style={{ fontSize:12, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'#22C55E' }}>All declarations confirmed. You may proceed.</span>
                </div>
              )}
              <div style={{ marginTop:16, background:'rgba(255,122,41,0.06)', border:'1px solid rgba(255,122,41,0.2)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:10 }}>
                <span style={{ fontSize:16 }}>📋</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>Employment details, emergency contact, blood group and T-shirt size will be asked on the KYC page after your payment.</span>
              </div>
              <div style={{ marginTop:28, display:'flex', justifyContent:'flex-end' }}>
                <button className="btn-primary" style={{ padding:'16px 28px', fontSize:14 }} disabled={!canProceed} onClick={handleProceed}>PROCEED TO PHASE 2 PAYMENT →</button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ fontSize:10, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'rgba(255,255,255,0.35)', marginBottom:12, textTransform:'uppercase' }}>Phase 2 Entry Fee</div>
            <div className="ticket">
              <div style={{ background:'linear-gradient(135deg,#FF7A29,#D95E10)', padding:'18px 24px' }}>
                <div style={{ fontSize:9, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.18em', color:'rgba(255,255,255,0.7)', marginBottom:6, textTransform:'uppercase' }}>BCPL Season 5</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#fff', lineHeight:1.3 }}>PHASE 2 PHYSICAL<br/>TRIAL ENTRY</div>
              </div>
              <div style={{ padding:'20px 24px', textAlign:'center', background:'#0A1727' }}>
                <div style={{ fontSize:9, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'rgba(255,255,255,0.38)', marginBottom:6, textTransform:'uppercase' }}>Entry Fee</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:48, color:'#FF7A29', lineHeight:1 }}>₹2,000</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:6 }}>Batsman / Bowler / Wicket-Keeper</div>
              </div>
              <div className="ticket-dashed" />
              <div style={{ padding:'16px 24px', background:'#0A1727' }}>
                {[
                  ['Player', playerName || '—'],
                  ['Role', '🏏 ' + (role || '—')],
                  ['Trial City', city || '—'],
                  ['Reg. ID', regId ? regId.slice(0,8).toUpperCase() : '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:12, gap:8 }}>
                    <span style={{ color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{k}</span>
                    <span style={{ color:'#fff', fontWeight:700, fontFamily:'Montserrat,sans-serif', textAlign:'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding:'12px 24px', background:'rgba(232,178,61,0.06)', borderTop:'1px solid rgba(232,178,61,0.15)' }}>
                <div style={{ fontSize:11, color:'#E8B23D', fontWeight:700, fontFamily:'Montserrat,sans-serif', lineHeight:1.5 }}>
                  ⚡ Confirm the declarations, then pay to secure your trial slot.
                </div>
              </div>
            </div>

            <div style={{ marginTop:16, background:'#060C18', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'16px' }}>
              <div style={{ fontSize:10, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.12em', color:'rgba(255,255,255,0.35)', marginBottom:10, textTransform:'uppercase' }}>What Phase 2 includes</div>
              {['Reserved physical trial slot','Franchise coaching staff evaluation','Live auction participation rights','BCPL Season 5 player profile'].map(item => (
                <div key={item} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8 }}>
                  <span style={{ color:'#22C55E', flexShrink:0, marginTop:1 }}>✅</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BCPLFooter />
    </div>
  );
}
