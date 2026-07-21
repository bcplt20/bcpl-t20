import { useState, useEffect } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { verifyPhase2Payment, getRegistrationStatus, getMe } from '../lib/api';

const BASE = import.meta.env.BASE_URL;
const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
const NAV_ROUTES: Record<string,string> = { Home:'', 'Match Center':'match-center', Teams:'teams', Sponsors:'sponsors', Photos:'photos', Videos:'videos', About:'about', FAQ:'faq', Contact:'contact' };

export function Phase2PaymentReceipt() {
  const [state, setState] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [playerName, setPlayerName] = useState('');
  const [role, setRole]     = useState('');
  const [city, setCity]     = useState('');
  const [regId, setRegId]   = useState('');
  const [amount, setAmount] = useState(2000);
  const [paidAt, setPaidAt] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get('orderId');
      try {
        if (orderId) await verifyPhase2Payment(orderId).catch(() => {});
        const [status, me] = await Promise.all([getRegistrationStatus(), getMe()]);
        const pending = JSON.parse(sessionStorage.getItem('bcpl_p2_pending') || '{}');
        sessionStorage.removeItem('bcpl_p2_pending');
        setPlayerName(me.user?.name || '');
        setRole(status.role || '');
        setCity(status.trialCity || '');
        setRegId(status.registrationId || '');
        setAmount(pending.amount ?? status.fees?.phase2 ?? 2000);
        setPaidAt(new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }));
        setState('success');
      } catch (e: any) {
        setErrMsg(e.message);
        setState('error');
      }
    })();
  }, []);

  if (state === 'verifying') return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, color:'#64748B', fontFamily:'Inter,sans-serif' }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(232,178,61,0.3)', borderTopColor:'#E8B23D', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      Verifying your payment…
    </div>
  );

  if (state === 'error') return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, padding:24, fontFamily:'Inter,sans-serif', textAlign:'center' }}>
      <div style={{ fontSize:48 }}>⚠️</div>
      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'#EF4444' }}>Verification Issue</div>
      <div style={{ fontSize:13, color:'#64748B', maxWidth:380 }}>{errMsg || 'Could not verify payment. If you paid, your slot is still confirmed. Please contact support.'}</div>
      <a href={BASE + 'register/phase2/kyc'} style={{ padding:'12px 28px', borderRadius:12, background:'linear-gradient(135deg,#FF7A29,#D95E10)', color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, textDecoration:'none' }}>Try KYC Anyway →</a>
    </div>
  );

  const taxBase = Math.round(amount / 1.18);
  const gst     = amount - taxBase;
  const halfGst = Math.round(gst / 2);

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', color:'#F0EDE8', fontFamily:"'Inter',sans-serif", overflowX:'hidden', paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes shimmerAnim{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .wrap{max-width:900px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:18px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .nav-link{font-size:12px;font-weight:700;font-family:Montserrat,sans-serif;letter-spacing:.08em;color:rgba(255,255,255,0.65);text-decoration:none;text-transform:uppercase;cursor:pointer;transition:color .2s;background:none;border:none}
        .nav-link:hover{color:#FF7A29}
        .hero-check{animation:scaleIn .6s cubic-bezier(.34,1.56,.64,1) both}
        .hero-title{animation:fadeUp .5s .2s ease both}
        .ticket{background:#0A1727;border:1px solid rgba(232,178,61,0.4);position:relative;overflow:visible;width:100%;max-width:100%}
        .ticket::before,.ticket::after{content:'';position:absolute;width:22px;height:22px;border-radius:50%;background:#06101E;top:50%;transform:translateY(-50%);z-index:2}
        .ticket::before{left:-11px;border:1px solid rgba(232,178,61,0.4)}
        .ticket::after{right:-11px;border:1px solid rgba(232,178,61,0.4)}
        @media(max-width:480px){.ticket::before,.ticket::after{display:none}}
        .ticket-dashed{border-top:2px dashed rgba(232,178,61,0.25);margin:0 24px}
        .receipt-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);gap:8px}
        .receipt-row:last-child{border-bottom:none}
        .next-steps-grid{display:grid;grid-template-columns:1fr;gap:16px}
        @media(min-width:600px){.next-steps-grid{grid-template-columns:repeat(3,1fr)}}
        .next-card{background:#0A1727;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:22px 20px;border-top:3px solid #FF7A29}
        .chip-pill{display:inline-flex;align-items:center;gap:6px;border-radius:12px;padding:6px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;letter-spacing:.06em;border:1px solid}
        footer a{color:rgba(255,255,255,0.45);text-decoration:none}
        footer a:hover{color:#FF7A29}
      `}</style>

      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:300 }}>
        <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
          <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 32s linear infinite' }}>
            {[...Array(4)].map((_,i) => (
              <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff' }}>
                &nbsp;🏏 SEASON 5 REGISTRATIONS OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 50+ CITIES &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
              </span>
            ))}
          </div>
        </div>
        <nav style={{ background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
          <div className="wrap" style={{ maxWidth:1200, height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <a href={BASE} style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
              <img src={BASE + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{ height:36, maxWidth:100, width:'auto', objectFit:'contain', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}/>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px' }}>
                <span style={{ fontSize:9 }}>🏆</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
              </div>
            </a>
            <div className="desk-nav">{NAV.map(n => <a key={n} href={BASE + NAV_ROUTES[n]} className="nav-link">{n}</a>)}</div>
            <button className="ham-btn" onClick={() => setMenuOpen(o => !o)}>
              {[0,1,2].map(i => <span key={i} style={{ width:24, height:2, background:'#fff', display:'block', borderRadius:12, transition:'all .3s', transform: menuOpen?(i===0?'rotate(45deg) translate(5px,5px)':i===2?'rotate(-45deg) translate(5px,-5px)':'scaleX(0)'):'none', opacity:menuOpen&&i===1?0:1 }} />)}
            </button>
          </div>
          {menuOpen && (
            <div style={{ background:'#0A1727', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'12px 0' }}>
              {NAV.map(n => <a key={n} href={BASE + NAV_ROUTES[n]} onClick={() => setMenuOpen(false)} style={{ padding:'10px 24px', fontSize:13, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em', color:'rgba(255,255,255,0.7)', textTransform:'uppercase', textDecoration:'none', display:'block' }}>{n}</a>)}
            </div>
          )}
        </nav>
      </div>

      <div className="wrap" style={{ paddingTop:0 }}>
        {/* Hero */}
        <div style={{ position:'relative', overflow:'hidden', padding:'60px 0 48px', textAlign:'center' }}>
          <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(135deg,rgba(232,178,61,0.04) 0px,rgba(232,178,61,0.04) 1px,transparent 1px,transparent 40px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,#E8B23D,transparent)' }} />
          <div className="hero-check" style={{ width:88, height:88, borderRadius:'50%', background:'linear-gradient(135deg,#E8B23D,#B8860B)', margin:'0 auto 24px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 12px rgba(232,178,61,0.1), 0 0 0 24px rgba(232,178,61,0.05)' }}>
            <span style={{ fontSize:40, lineHeight:1 }}>✓</span>
          </div>
          <h1 className="hero-title" style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(24px,5vw,52px)', color:'#fff', lineHeight:1.05, letterSpacing:'.01em' }}>
            PHYSICAL TRIAL SLOT<br/>
            <span style={{ background:'linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'shimmerAnim 2.5s linear infinite', display:'inline-block' }}>SECURED.</span>
          </h1>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(13px,2.5vw,20px)', color:'rgba(255,255,255,0.45)', marginTop:12, letterSpacing:'.06em', animation:'fadeUp .5s .35s ease both' }}>SEE YOU ON THE GROUND.</div>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:10, marginTop:28 }}>
            <span className="chip-pill" style={{ background:'rgba(255,122,41,0.1)', borderColor:'rgba(255,122,41,0.4)', color:'#FF7A29' }}>🏏 {role}</span>
            <span className="chip-pill" style={{ background:'rgba(232,178,61,0.08)', borderColor:'rgba(232,178,61,0.35)', color:'#E8B23D' }}>📍 {city}</span>
            <span className="chip-pill" style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.6)', fontFamily:'monospace', fontSize:10 }}>REF: {regId.slice(0,8).toUpperCase()}</span>
          </div>
        </div>

        {/* Gold ticket receipt */}
        <div style={{ maxWidth:640, margin:'0 auto 48px' }}>
          <div className="ticket">
            <div style={{ background:'linear-gradient(135deg,#E8B23D,#B8860B)', padding:'20px 24px' }}>
              <div style={{ fontSize:9, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.2em', color:'rgba(0,0,0,0.5)', marginBottom:5, textTransform:'uppercase' }}>Official Confirmation · BCPL Season 5</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(13px,3vw,16px)', color:'#fff', textShadow:'0 2px 8px rgba(0,0,0,0.25)' }}>PHASE 2 PHYSICAL TRIAL — CONFIRMED</div>
            </div>

            <div style={{ background:'#0A1727', padding:'22px 24px 14px' }}>
              {[
                ['Player',          playerName],
                ['Role',            '🏏 ' + role],
                ['Trial City',      '📍 ' + city],
                ['Registration No.', regId.slice(0,8).toUpperCase()],
                ['Payment Date',    paidAt],
              ].map(([k,v]) => (
                <div key={k} className="receipt-row">
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600, flexShrink:0 }}>{k}</span>
                  <span style={{ fontSize: k==='Registration No.'?11:13, color:'#fff', fontWeight:700, fontFamily: k==='Registration No.'?'monospace':'Montserrat,sans-serif', textAlign:'right', wordBreak:'break-all' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* GST breakdown */}
            <div style={{ background:'rgba(232,178,61,0.04)', borderTop:'1px solid rgba(232,178,61,0.15)', padding:'14px 24px' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:9, letterSpacing:'.14em', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', marginBottom:10 }}>Payment Breakdown</div>
              {[
                { label:'Taxable Amount', val:`₹${taxBase.toLocaleString()}`, dim:false },
                { label:'CGST @ 9%',      val:`₹${halfGst.toLocaleString()}`, dim:true },
                { label:'SGST @ 9%',      val:`₹${halfGst.toLocaleString()}`, dim:true },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color: r.dim?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.6)', fontWeight:600 }}>{r.label}</span>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color: r.dim?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.7)', fontWeight:700 }}>{r.val}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0 2px', marginTop:6, borderTop:'1px solid rgba(232,178,61,0.35)' }}>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, color:'#E8B23D', letterSpacing:'.04em' }}>TOTAL PAID</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#22C55E' }}>₹{amount.toLocaleString()} ✅</span>
              </div>
            </div>

            <div className="ticket-dashed" />

            <div style={{ background:'#0A1727', padding:'16px 24px 20px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:18 }}>📋</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'#E8B23D', letterSpacing:'.08em' }}>NEXT STEP</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', marginTop:2 }}>Complete KYC verification — Aadhaar + PAN required</div>
              </div>
              <button onClick={() => { window.location.href = BASE + 'register/phase2/kyc'; }} style={{ flexShrink:0, background:'transparent', border:'1px solid rgba(232,178,61,0.5)', borderRadius:12, color:'#E8B23D', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'.1em', cursor:'pointer', padding:'9px 18px' }}>COMPLETE KYC →</button>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.18em', color:'rgba(255,255,255,0.35)', marginBottom:20, textTransform:'uppercase' }}>Next Steps</div>
          <div className="next-steps-grid">
            {[
              { icon:'🪪', title:'Complete KYC', desc:'Aadhaar + PAN required for BCCI compliance and franchise records.', cta:'COMPLETE KYC →', ctaColor:'#FF7A29', topColor:'#FF7A29', href: BASE + 'register/phase2/kyc' },
              { icon:'📅', title:'Trial Date Announcement', desc:'SMS + Email notification 30 days before your trial date. Check your phone.', cta:null, ctaColor:'', topColor:'#E8B23D', href: null },
              { icon:'💬', title:'Stay Updated', desc:'Keep your email and phone number active. All updates go there directly.', cta:null, ctaColor:'', topColor:'#25D366', href: null },
            ].map(({ icon, title, desc, cta, ctaColor, topColor, href }) => (
              <div key={title} className="next-card" style={{ borderTopColor:topColor }}>
                <div style={{ fontSize:28, marginBottom:12 }}>{icon}</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#fff', marginBottom:8 }}>{title}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.6, marginBottom: cta?16:0 }}>{desc}</div>
                {cta && href && (
                  <button onClick={() => { window.location.href = href; }} style={{ background:'transparent', border:`1px solid ${ctaColor}60`, borderRadius:12, color:ctaColor, fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'.1em', cursor:'pointer', padding:'8px 16px' }}>
                    {cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <BCPLFooter />
    </div>
  );
}
