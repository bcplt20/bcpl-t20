import React, { useState, useEffect } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { getRegistrationStatus, getMe } from '../lib/api';

const BASE = import.meta.env.BASE_URL;
const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
const NAV_ROUTES: Record<string,string> = { Home:'', 'Match Center':'match-center', Teams:'teams', Sponsors:'sponsors', Photos:'photos', Videos:'videos', About:'about', FAQ:'faq', Contact:'contact' };
const STEPS = ['Professional Details','Emergency Contact','Declaration'];

type LoadState = 'loading' | 'ok' | 'not_selected' | 'error';

export function Phase2Registration() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [playerName, setPlayerName] = useState('');
  const [role, setRole]             = useState('');
  const [city, setCity]             = useState('');
  const [regId, setRegId]           = useState('');
  const [phase2Status, setPhase2Status] = useState<string|null>(null);
  const [menuOpen, setMenuOpen]     = useState(false);

  // Form state
  const [step, setStep]         = useState(1);
  const [company, setCompany]   = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [tshirt, setTshirt]     = useState('');
  const [ecName, setEcName]     = useState('');
  const [ecRel, setEcRel]       = useState('');
  const [ecPhone, setEcPhone]   = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
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

  const canNext =
    step === 1 ? !!(company && jobTitle && experience && tshirt) :
    step === 2 ? !!(ecName && ecRel && ecPhone && bloodGroup) :
    (check1 && check2 && check3);

  const handleProceed = () => {
    // Save form for display on KYC page
    sessionStorage.setItem('bcpl_p2_profile', JSON.stringify({ company, jobTitle, experience, linkedin, tshirt, ecName, ecRel, ecPhone, bloodGroup }));
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
        @keyframes pulseOrange{0%,100%{box-shadow:0 0 0 0 rgba(255,122,41,0.6)}50%{box-shadow:0 0 0 10px rgba(255,122,41,0)}}
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
        .btn-back{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:rgba(255,255,255,0.6);font-family:Montserrat,sans-serif;font-weight:700;cursor:pointer;transition:all .2s}
        .btn-back:hover{background:rgba(255,255,255,0.09);color:#fff}
        .field-inp{width:100%;background:#0C1A2E;border:none;border-bottom:2px solid rgba(255,122,41,0.4);color:#F0EDE8;padding:13px 14px;font-family:Inter,sans-serif;font-size:15px;outline:none;transition:all .2s}
        .field-inp:focus{border-bottom-color:#FF7A29;background:#0E1F35}
        .field-inp::placeholder{color:rgba(255,255,255,0.22)}
        .field-inp[readonly]{opacity:.6;cursor:not-allowed}
        .field-lbl{display:block;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,0.38);margin-bottom:6px;font-family:Montserrat,sans-serif}
        .chip-btn{border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:8px 16px;font-size:12px;font-weight:700;font-family:Montserrat,sans-serif;cursor:pointer;transition:all .15s;background:transparent;color:rgba(255,255,255,0.55);letter-spacing:.04em}
        .chip-btn:hover{border-color:#FF7A29;color:#FF7A29}
        .chip-btn.sel{border-color:#FF7A29;background:rgba(255,122,41,0.12);color:#FF7A29}
        .step-node{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Montserrat,sans-serif;font-weight:900;font-size:12px;border:2px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.3);background:transparent;transition:all .3s;flex-shrink:0}
        .step-node.done{background:#22C55E;border-color:#22C55E;color:#fff}
        .step-node.active{background:#FF7A29;border-color:#FF7A29;color:#fff;animation:pulseOrange 2s infinite}
        .step-track{height:2px;flex:1;background:rgba(255,255,255,0.08);margin:0 4px;transition:background .4s}
        .step-track.done{background:#22C55E}
        .step-enter{animation:stepIn .35s cubic-bezier(.34,1.56,.64,1) both}
        .check-row{display:flex;align-items:flex-start;gap:14px;cursor:pointer;padding:16px;border:1px solid rgba(255,255,255,0.07);background:#0A1727;transition:border-color .2s;border-radius:12px}
        .check-row:hover{border-color:rgba(255,122,41,0.3)}
        .check-row.checked{border-color:rgba(34,197,94,0.4);background:rgba(34,197,94,0.04)}
        .custom-check{width:20px;height:20px;border:2px solid rgba(255,255,255,0.2);border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .2s;margin-top:1px}
        .custom-check.checked{background:#22C55E;border-color:#22C55E}
        .nav-link{font-size:12px;font-weight:700;font-family:Montserrat,sans-serif;letter-spacing:.08em;color:rgba(255,255,255,0.65);text-decoration:none;text-transform:uppercase;cursor:pointer;transition:color .2s;background:none;border:none}
        .nav-link:hover{color:#FF7A29}
        .step-col{display:flex;flex-direction:column;align-items:center}
        .step-label{font-size:8px;font-weight:700;font-family:Montserrat,sans-serif;letter-spacing:.06em;color:rgba(255,255,255,0.3);text-transform:uppercase;text-align:center;margin-top:4px;min-width:60px}
        @media(max-width:400px){.step-label{display:none}}
        .form-btns{margin-top:28px;display:flex;gap:12px;justify-content:space-between;flex-wrap:wrap}
        .form-btns button{min-width:120px}
        .ticket{background:#0A1727;border:1px solid rgba(255,122,41,0.3);position:relative;overflow:visible}
        .ticket::before,.ticket::after{content:'';position:absolute;width:20px;height:20px;border-radius:50%;background:#06101E;top:50%;transform:translateY(-50%)}
        .ticket::before{left:-10px;border:1px solid rgba(255,122,41,0.3)}
        .ticket::after{right:-10px;border:1px solid rgba(255,122,41,0.3)}
        @media(max-width:480px){.ticket::before,.ticket::after{display:none}}
        .ticket-dashed{border-top:2px dashed rgba(255,122,41,0.22);margin:0 24px}
        footer a{color:rgba(255,255,255,0.45);text-decoration:none}
        footer a:hover{color:#FF7A29}
      `}</style>

      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:300 }}>
        <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
          <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 32s linear infinite' }}>
            {[...Array(4)].map((_,i) => (
              <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff' }}>
                &nbsp;🏏 SEASON 5 · PHASE 2 ONBOARDING &nbsp;·&nbsp; TRIAL SLOTS FILLING FAST &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
              </span>
            ))}
          </div>
        </div>
        <nav style={{ background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
          <div className="wrap" style={{ height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <a href={BASE} style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
              <img src={BASE + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{ height:36, maxWidth:100, width:'auto', objectFit:'contain', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}/>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px' }}>
                <span style={{ fontSize:9 }}>🏆</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
              </div>
            </a>
            <div className="desk-nav">
              {NAV.map(n => <a key={n} href={BASE + NAV_ROUTES[n]} className="nav-link">{n}</a>)}
            </div>
            <button className="ham-btn" onClick={() => setMenuOpen(o => !o)}>
              {[0,1,2].map(i => <span key={i} style={{ width:24, height:2, background:'#fff', display:'block', borderRadius:12, transition:'all .3s', transform: menuOpen ? (i===0?'rotate(45deg) translate(5px,5px)':i===2?'rotate(-45deg) translate(5px,-5px)':'scaleX(0)') : 'none', opacity: menuOpen && i===1 ? 0 : 1 }} />)}
            </button>
          </div>
          {menuOpen && (
            <div style={{ background:'#0A1727', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'12px 0' }}>
              {NAV.map(n => <a key={n} href={BASE + NAV_ROUTES[n]} onClick={() => setMenuOpen(false)} style={{ padding:'10px 24px', fontSize:13, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em', color:'rgba(255,255,255,0.7)', textTransform:'uppercase', textDecoration:'none', display:'block' }}>{n}</a>)}
            </div>
          )}
        </nav>
      </div>

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
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, marginTop:10 }}>Complete your profile to proceed to Phase 2 payment</p>
        </div>

        {/* Step indicator */}
        <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'16px 20px', marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center' }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className="step-col">
                  <div className={`step-node ${i < step-1 ? 'done' : i === step-1 ? 'active' : ''}`}>{i < step-1 ? '✓' : i+1}</div>
                  <span className="step-label" style={{ color: i === step-1 ? '#FF7A29' : i < step-1 ? '#22C55E' : 'rgba(255,255,255,0.3)' }}>{s}</span>
                </div>
                {i < STEPS.length-1 && <div className={`step-track ${i < step-1 ? 'done' : ''}`} style={{ marginBottom:20 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="main-grid">
          {/* Form */}
          <div>
            {step === 1 && (
              <div className="step-enter" style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'24px 20px' }}>
                <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:24 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff' }}>STEP 1 — Professional Details</div>
                </div>
                <div style={{ display:'grid', gap:20 }}>
                  <div>
                    <label className="field-lbl">Full Name <span style={{ color:'rgba(255,255,255,0.25)' }}>(from Phase 1)</span></label>
                    <input className="field-inp" value={playerName} readOnly />
                  </div>
                  <div>
                    <label className="field-lbl">Company / Organisation *</label>
                    <input className="field-inp" placeholder="e.g. Infosys, Tata Consultancy…" value={company} onChange={e => setCompany(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-lbl">Job Title / Designation *</label>
                    <input className="field-inp" placeholder="e.g. Senior Engineer, Product Manager…" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-lbl">Years of Experience *</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                      {['<1 yr','1–3 yr','3–5 yr','5–10 yr','10+ yr'].map(e => (
                        <button key={e} className={`chip-btn ${experience===e?'sel':''}`} onClick={() => setExperience(e)}>{e}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="field-lbl">LinkedIn Profile <span style={{ color:'rgba(255,255,255,0.22)' }}>(optional)</span></label>
                    <input className="field-inp" placeholder="linkedin.com/in/yourprofile" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-lbl">T-Shirt Size *</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                      {['S','M','L','XL','XXL'].map(s => (
                        <button key={s} className={`chip-btn ${tshirt===s?'sel':''}`} style={{ minWidth:48, textAlign:'center' }} onClick={() => setTshirt(s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="form-btns"><div />
                  <button className="btn-primary" style={{ padding:'14px 28px', fontSize:13 }} disabled={!canNext} onClick={() => setStep(2)}>NEXT: EMERGENCY CONTACT →</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-enter" style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'24px 20px' }}>
                <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:24 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff' }}>STEP 2 — Emergency Contact</div>
                </div>
                <div style={{ display:'grid', gap:20 }}>
                  <div>
                    <label className="field-lbl">Contact Name *</label>
                    <input className="field-inp" placeholder="Full name of emergency contact" value={ecName} onChange={e => setEcName(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-lbl">Relationship *</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                      {['Father','Mother','Spouse','Friend','Other'].map(r => (
                        <button key={r} className={`chip-btn ${ecRel===r?'sel':''}`} onClick={() => setEcRel(r)}>{r}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="field-lbl">Phone Number *</label>
                    <input className="field-inp" type="tel" placeholder="10-digit mobile number" value={ecPhone} onChange={e => setEcPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-lbl">Blood Group *</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                        <button key={bg} className={`chip-btn ${bloodGroup===bg?'sel':''}`} style={{ minWidth:48, textAlign:'center' }} onClick={() => setBloodGroup(bg)}>{bg}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="form-btns">
                  <button className="btn-back" style={{ padding:'12px 24px', fontSize:12 }} onClick={() => setStep(1)}>← BACK</button>
                  <button className="btn-primary" style={{ padding:'14px 28px', fontSize:13 }} disabled={!canNext} onClick={() => setStep(3)}>NEXT: DECLARATION →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-enter" style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'24px 20px' }}>
                <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:24 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff' }}>STEP 3 — Declaration</div>
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
                {canNext && (
                  <div style={{ marginTop:16, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:16 }}>✅</span>
                    <span style={{ fontSize:12, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'#22C55E' }}>All declarations confirmed. You may proceed.</span>
                  </div>
                )}
                <div className="form-btns">
                  <button className="btn-back" style={{ padding:'12px 24px', fontSize:12 }} onClick={() => setStep(2)}>← BACK</button>
                  <button className="btn-primary" style={{ padding:'16px 28px', fontSize:14 }} disabled={!canNext} onClick={handleProceed}>PROCEED TO PHASE 2 PAYMENT →</button>
                </div>
              </div>
            )}
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
                  ⚡ Pay after completing this onboarding form.
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
