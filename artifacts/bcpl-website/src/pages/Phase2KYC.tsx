import React, { useState } from 'react';

const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
const NAV_ROUTES: Record<string,string> = { 'Home':'', 'Match Center':'match-center', 'Teams':'teams', 'Sponsors':'sponsors', 'Photos':'photos', 'Videos':'videos', 'About':'about', 'FAQ':'faq', 'Contact':'contact' };

export function Phase2KYC() {
  const [aadhaarFront, setAadhaarFront] = useState<'none'|'uploaded'>('none');
  const [aadhaarBack, setAadhaarBack]   = useState<'none'|'uploaded'>('none');
  const [pan, setPan]                   = useState<'none'|'uploaded'>('none');
  const [profession, setProfession]     = useState('');
  const [kycState, setKycState]         = useState<'pending'|'verified'>('pending');
  const [submitting, setSubmitting]     = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);

  const allUploaded = aadhaarFront === 'uploaded' && aadhaarBack === 'uploaded' && pan === 'uploaded' && !!profession;

  const PROFESSIONS = [
    { id:'doctor',     icon:'👨‍⚕️', label:'Doctor' },
    { id:'nurse',      icon:'🏥', label:'Nurse / Health' },
    { id:'ips',        icon:'👮', label:'IPS / Police' },
    { id:'army',       icon:'🎖️', label:'Army / Defence' },
    { id:'engineer',   icon:'⚙️', label:'Engineer' },
    { id:'it',         icon:'💻', label:'IT Professional' },
    { id:'ca',         icon:'💰', label:'CA / Finance' },
    { id:'bank',       icon:'🏦', label:'Bank Employee' },
    { id:'lawyer',     icon:'⚖️', label:'Lawyer' },
    { id:'teacher',    icon:'📚', label:'Teacher / Prof' },
    { id:'business',   icon:'🏢', label:'Business Owner' },
    { id:'govt',       icon:'🏛️', label:'Govt. Officer' },
    { id:'intern',     icon:'🎓', label:'Intern' },
    { id:'farmer',     icon:'🌾', label:'Farmer' },
    { id:'delivery',   icon:'📦', label:'Delivery Boy' },
    { id:'shopkeeper', icon:'🏪', label:'Shopkeeper' },
    { id:'driver',     icon:'🚗', label:'Driver' },
    { id:'chef',       icon:'👨‍🍳', label:'Chef / Cook' },
    { id:'plumber',    icon:'🔧', label:'Plumber' },
    { id:'electrician',icon:'⚡', label:'Electrician' },
    { id:'mechanic',   icon:'🔩', label:'Mechanic' },
    { id:'tailor',     icon:'🧵', label:'Tailor' },
    { id:'security',   icon:'🛡️', label:'Security Guard' },
    { id:'salesperson',icon:'🤝', label:'Sales / Retail' },
    { id:'sports',     icon:'🏅', label:'Sports Pro' },
    { id:'other',      icon:'✨', label:'Other' },
  ];

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setKycState('verified'); }, 1800);
  };

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', fontFamily:"'Inter',sans-serif", color:'#F0EDE8', overflowX:'hidden', paddingBottom:80 }}>
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
        .btn-primary:disabled{opacity:.35;cursor:not-allowed;filter:none;transform:none}
        .upload-zone{border:2px dashed rgba(255,255,255,0.15);background:#0C1A2E;padding:24px 16px;text-align:center;cursor:pointer;transition:all .2s;border-radius:12px;width:100%}
        .upload-zone:hover{border-color:rgba(255,122,41,0.5);background:#0E1F35}
        .upload-zone.done{border-color:#22C55E;border-style:solid;background:rgba(34,197,94,0.06)}
        .doc-card{background:#0A1727;border:1px solid rgba(255,255,255,0.08);padding:20px 16px;border-radius:12px;width:100%}
        .doc-card.verified-card{border-color:rgba(34,197,94,0.3)}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes scaleIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes verifiedPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)}50%{box-shadow:0 0 0 12px rgba(34,197,94,0)}}

        /* Upload grid — 1 col on mobile, 2 col on wider */
        .upload-grid{display:grid;grid-template-columns:1fr;gap:20px;margin-bottom:24px}
        @media(min-width:640px){.upload-grid{grid-template-columns:1fr 1fr}}

        /* Verified chips */
        .verified-chips{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}

        /* Submit row */
        .submit-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
        .submit-btn{padding:18px 32px;font-size:15px;letter-spacing:.06em;width:100%}
        @media(min-width:480px){.submit-btn{width:auto}}

        /* Achievement bar */
        .achiev-bar-inner{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#E8B23D;font-family:Montserrat,sans-serif;letter-spacing:.06em;flex-wrap:wrap}

        /* State toggle */
        .state-toggle{margin-left:auto;display:flex;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)}
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
            <div style={{ display:'flex', flexDirection:'column', borderLeft:'2px solid rgba(255,122,41,0.4)', paddingLeft:10, gap:1 }}>
              <span style={{ fontSize:8, fontWeight:800, color:'#FF7A29', letterSpacing:'.16em' }}>SEASON 5</span>
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

      {/* ── ACHIEVEMENT BAR ── */}
      <div style={{ background:'rgba(232,178,61,0.08)', borderBottom:'1px solid rgba(232,178,61,0.2)', padding:'10px 0' }}>
        <div className="wrap" style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div className="achiev-bar-inner">
            <span style={{ color:'#22C55E' }}>✓</span> PHASE 1 CLEARED
            <span style={{ color:'rgba(255,255,255,0.2)' }}>·</span>
            <span style={{ color:'#22C55E' }}>✓</span> PHASE 2 PAID
            <span style={{ color:'rgba(255,255,255,0.2)' }}>·</span>
            <span style={{ color:'rgba(255,255,255,0.35)' }}>→ KYC PENDING</span>
          </div>
          {/* Design toggle */}
          <div className="state-toggle">
            <button onClick={() => setKycState('pending')} style={{ padding:'6px 14px', fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', border:'none', cursor:'pointer', background: kycState==='pending'?'rgba(255,122,41,0.2)':'rgba(255,255,255,0.04)', color: kycState==='pending'?'#FF7A29':'rgba(255,255,255,0.4)' }}>⏳ PENDING</button>
            <button onClick={() => setKycState('verified')} style={{ padding:'6px 14px', fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', border:'none', borderLeft:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', background: kycState==='verified'?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.04)', color: kycState==='verified'?'#22C55E':'rgba(255,255,255,0.4)' }}>✅ VERIFIED</button>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="wrap" style={{ paddingTop:40 }}>
        {/* Page header */}
        <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:32 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(20px,4vw,28px)', color:'#fff', textTransform:'uppercase', letterSpacing:'.02em', marginBottom:4 }}>
            {kycState === 'pending' ? 'Identity Verification (KYC)' : '✅ KYC Verified'}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:10 }}>
            Required for BCCI compliance and franchise contract records
          </div>
          {kycState === 'pending' ? (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,122,41,0.1)', border:'1px solid rgba(255,122,41,0.3)', padding:'5px 14px', fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'#FF7A29' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#FF7A29', display:'inline-block', animation:'liveBlip 1.2s ease infinite' }} />
              ⏳ PENDING VERIFICATION
            </div>
          ) : (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.35)', padding:'5px 14px', fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'#22C55E', animation:'verifiedPulse 2s ease infinite' }}>
              ✅ KYC COMPLETE — CLEARED FOR PHYSICAL TRIAL
            </div>
          )}
        </div>

        {kycState === 'verified' ? (
          /* ─── VERIFIED STATE ─── */
          <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.25)', padding:'40px 24px', textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:64, marginBottom:16, animation:'scaleIn .5s cubic-bezier(.34,1.56,.64,1) both' }}>✅</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(20px,4vw,28px)', color:'#22C55E', marginBottom:8 }}>KYC VERIFICATION COMPLETE</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)', marginBottom:24 }}>All documents verified. You are officially cleared for BCPL Season 5 Physical Trials.</div>
            <div className="verified-chips">
              {['🪪 Aadhaar ✓','📋 PAN ✓','👤 Identity ✓'].map(t => (
                <div key={t} style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', padding:'8px 20px', fontSize:12, fontWeight:700, color:'#22C55E', fontFamily:'Montserrat,sans-serif', borderRadius:8 }}>{t}</div>
              ))}
            </div>
            <div style={{ marginTop:24 }}>
              <button className="btn-primary" style={{ padding:'16px 32px', fontSize:14, letterSpacing:'.06em', width:'100%', maxWidth:360 }} onClick={() => { window.location.href = import.meta.env.BASE_URL + 'player-profile'; }}>VIEW YOUR PLAYER DASHBOARD →</button>
            </div>
          </div>
        ) : (
          /* ─── PENDING STATE — upload UI ─── */
          <>
            {/* ── PROFESSION SELECTOR ── */}
            <div style={{ background:'#0A1727', border:'1px solid rgba(255,122,41,0.2)', borderRadius:12, padding:'20px 18px', marginBottom:24 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#FF7A29', letterSpacing:'.06em', marginBottom:4 }}>YOUR PROFESSION</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:16 }}>Select the field you currently work in</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:8 }}>
                {PROFESSIONS.map(p => (
                  <button key={p.id} onClick={() => setProfession(p.id)}
                    style={{ padding:'10px 8px', borderRadius:10, border: profession===p.id ? '2px solid #FF7A29' : '1px solid rgba(255,255,255,0.1)', background: profession===p.id ? 'rgba(255,122,41,0.12)' : 'rgba(255,255,255,0.03)', color: profession===p.id ? '#FF7A29' : 'rgba(255,255,255,0.6)', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:11, cursor:'pointer', textAlign:'center', transition:'all .18s', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:20 }}>{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="upload-grid">
              {/* Aadhaar Card */}
              <div className="doc-card">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <span style={{ fontSize:24 }}>🪪</span>
                  <div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff', textTransform:'uppercase' }}>Aadhaar Card</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Front + Back required</div>
                  </div>
                </div>
                {/* Front */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'.12em', fontFamily:'Montserrat,sans-serif', marginBottom:8 }}>FRONT SIDE</div>
                  <div className={`upload-zone${aadhaarFront==='uploaded'?' done':''}`} onClick={() => setAadhaarFront('uploaded')}>
                    {aadhaarFront === 'uploaded' ? (
                      <div>
                        <div style={{ fontSize:28, marginBottom:6 }}>✅</div>
                        <div style={{ fontSize:12, fontWeight:700, color:'#22C55E', fontFamily:'Montserrat,sans-serif' }}>aadhaar_front.jpg uploaded</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>2.4 MB</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize:28, marginBottom:8 }}>📤</div>
                        <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', fontFamily:'Montserrat,sans-serif', marginBottom:4 }}>UPLOAD FRONT</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>JPG · PNG · PDF · Max 5MB</div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Back */}
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'.12em', fontFamily:'Montserrat,sans-serif', marginBottom:8 }}>BACK SIDE</div>
                  <div className={`upload-zone${aadhaarBack==='uploaded'?' done':''}`} onClick={() => setAadhaarBack('uploaded')}>
                    {aadhaarBack === 'uploaded' ? (
                      <div>
                        <div style={{ fontSize:28, marginBottom:6 }}>✅</div>
                        <div style={{ fontSize:12, fontWeight:700, color:'#22C55E', fontFamily:'Montserrat,sans-serif' }}>aadhaar_back.jpg uploaded</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>1.9 MB</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize:28, marginBottom:8 }}>📤</div>
                        <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', fontFamily:'Montserrat,sans-serif', marginBottom:4 }}>UPLOAD BACK</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>JPG · PNG · PDF · Max 5MB</div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ marginTop:12, fontSize:11, color:'rgba(255,255,255,0.3)', fontStyle:'italic' }}>⚠️ Name on Aadhaar must match registration name</div>
              </div>

              {/* PAN Card */}
              <div className="doc-card">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <span style={{ fontSize:24 }}>📋</span>
                  <div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff', textTransform:'uppercase' }}>PAN Card</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Single document required</div>
                  </div>
                </div>
                <div className={`upload-zone${pan==='uploaded'?' done':''}`} onClick={() => setPan('uploaded')} style={{ minHeight:180, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {pan === 'uploaded' ? (
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#22C55E', fontFamily:'Montserrat,sans-serif' }}>pan_card.jpg uploaded</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>1.7 MB</div>
                    </div>
                  ) : (
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:36, marginBottom:12 }}>📤</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.6)', fontFamily:'Montserrat,sans-serif', marginBottom:6 }}>UPLOAD PAN CARD</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>JPG · PNG · PDF · Max 5MB</div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop:12, fontSize:11, color:'rgba(255,255,255,0.3)', fontStyle:'italic' }}>⚠️ PAN must be in your personal name, not company name</div>

                {/* Why we need this */}
                <div style={{ marginTop:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', padding:'16px', borderRadius:8 }}>
                  <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'rgba(255,255,255,0.4)', marginBottom:10 }}>WHY WE NEED THIS</div>
                  {[
                    'BCCI compliance for league participation',
                    'Franchise contract records',
                    'Prize money distribution & TDS',
                    'Anti-impersonation verification',
                  ].map(r => (
                    <div key={r} style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6, display:'flex', gap:6 }}>
                      <span style={{ color:'rgba(255,122,41,0.6)', flexShrink:0 }}>→</span>{r}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacy assurance */}
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:12, marginBottom:24, borderRadius:8 }}>
              <span style={{ fontSize:24, flexShrink:0 }}>🔒</span>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
                <strong style={{ color:'rgba(255,255,255,0.7)' }}>Privacy Assured.</strong> Your documents are encrypted at rest and in transit (AES-256). We never share with third parties. Stored in compliance with the IT Act, 2000. Used exclusively for BCCI compliance and BCPL records.
              </div>
            </div>

            {/* Submit */}
            <div className="submit-row">
              <button
                className="btn-primary submit-btn"
                disabled={!allUploaded || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                    <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                    VERIFYING...
                  </span>
                ) : 'SUBMIT FOR KYC VERIFICATION →'}
              </button>
              {!allUploaded && (
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>
                  Upload all documents to continue · {[aadhaarFront, aadhaarBack, pan].filter(s => s==='uploaded').length}/3 uploaded
                </div>
              )}
            </div>

            {/* Demo hint */}
            <div style={{ marginTop:12, fontSize:11, color:'rgba(255,255,255,0.2)', fontStyle:'italic' }}>
              💡 Click each upload zone to simulate document upload, then submit to see verified state.
            </div>
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#040C18', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'32px 0 20px', marginTop:60 }}>
        <div className="wrap">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16, marginBottom:16 }}>
                          <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{ height:42, width:'auto', objectFit:'contain', display:'block', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}/>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px' }}>
                <span style={{ fontSize:9 }}>🏆</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
              </div>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              {['About','Teams','FAQ','Contact','Terms','Privacy'].map(l => (
                <a key={l} href="#" style={{ fontSize:12, color:'rgba(255,255,255,0.4)', textDecoration:'none', fontWeight:600 }}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:14, fontSize:11, color:'rgba(255,255,255,0.25)', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <span>Season 5 · BCPL Pvt. Ltd.</span>
            <span>© 2026 BCPL. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
