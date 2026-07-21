import { useState, useEffect } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { getRegistrationStatus, getMe, createPhase2Payment, verifyPhase2Payment } from '../lib/api';

const BASE = import.meta.env.BASE_URL;
const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
const NAV_ROUTES: Record<string,string> = { Home:'', 'Match Center':'match-center', Teams:'teams', Sponsors:'sponsors', Photos:'photos', Videos:'videos', About:'about', FAQ:'faq', Contact:'contact' };

type LoadState = 'loading' | 'ok' | 'already_paid' | 'not_selected' | 'error';

export function Phase2Payment() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [playerName, setPlayerName] = useState('');
  const [role, setRole]             = useState('');
  const [city, setCity]             = useState('');
  const [regId, setRegId]           = useState('');
  const [amount, setAmount]         = useState(2000);
  const [agreed, setAgreed]         = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError]     = useState('');
  const [menuOpen, setMenuOpen]     = useState(false);

  // Load Cashfree SDK
  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.async = true;
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [status, me] = await Promise.all([getRegistrationStatus(), getMe()]);
        if (!status.registered || status.phase1Status !== 'selected') {
          setLoadState('not_selected'); return;
        }
        if (status.phase2Status === 'payment_done' || status.phase2Status === 'kyc_done') {
          setLoadState('already_paid'); return;
        }
        setPlayerName(me.name || '');
        setRole(status.role || '');
        setCity(status.trialCity || '');
        setRegId(status.registrationId || '');
        setAmount(status.fees?.phase2 ?? 2000);
        setLoadState('ok');
      } catch (e: any) {
        setPayError(e.message);
        setLoadState('error');
      }
    })();
  }, []);

  const handlePay = async () => {
    if (!agreed) return;
    setPayLoading(true); setPayError('');
    try {
      const pay = await createPhase2Payment(regId);
      sessionStorage.setItem('bcpl_p2_pending', JSON.stringify({ orderId: pay.orderId, amount: pay.amount }));
      const cashfree = (window as any).Cashfree({ mode: 'production' });
      cashfree.checkout({
        paymentSessionId: pay.paymentSessionId,
        returnUrl: window.location.origin + BASE + 'register/phase2/payment-receipt?orderId=' + pay.orderId,
      });
    } catch (e: any) {
      setPayError(e.message || 'Payment failed. Please try again.');
      setPayLoading(false);
    }
  };

  if (loadState === 'loading') return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', fontFamily:'Inter,sans-serif' }}>
      Loading…
    </div>
  );

  if (loadState === 'not_selected') return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24, fontFamily:'Inter,sans-serif', textAlign:'center' }}>
      <div style={{ fontSize:48 }}>🏏</div>
      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff' }}>Not Eligible for Phase 2</div>
      <div style={{ fontSize:14, color:'#64748B', maxWidth:360 }}>Phase 2 payment is only available after scout selection in Phase 1.</div>
      <a href={BASE + 'register/video-upload'} style={{ padding:'12px 28px', borderRadius:12, background:'linear-gradient(135deg,#FF7A29,#D95E10)', color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, textDecoration:'none', marginTop:8 }}>Go to Video Upload →</a>
    </div>
  );

  if (loadState === 'already_paid') return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24, fontFamily:'Inter,sans-serif', textAlign:'center' }}>
      <div style={{ fontSize:48 }}>✅</div>
      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#22C55E' }}>Phase 2 Payment Already Done</div>
      <div style={{ fontSize:14, color:'#64748B', maxWidth:360 }}>Your Phase 2 payment is confirmed. Proceed to KYC verification.</div>
      <a href={BASE + 'register/phase2/kyc'} style={{ padding:'12px 28px', borderRadius:12, background:'linear-gradient(135deg,#FF7A29,#D95E10)', color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, textDecoration:'none' }}>Complete KYC →</a>
    </div>
  );

  const taxBase = Math.round(amount / 1.18);
  const gst     = amount - taxBase;

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', color:'#F0EDE8', fontFamily:"'Inter',sans-serif", overflowX:'hidden', paddingBottom:'calc(120px + env(safe-area-inset-bottom))' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes shimmerAnim{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulseGold{0%,100%{box-shadow:0 0 0 0 rgba(232,178,61,0.5)}50%{box-shadow:0 0 0 12px rgba(232,178,61,0)}}
        .wrap{max-width:900px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:18px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .btn-gold{background:linear-gradient(135deg,#E8B23D,#B8860B);border:none;border-radius:12px;color:#000;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:0.08em;cursor:pointer;transition:filter .2s,transform .15s;animation:pulseGold 2.5s infinite}
        .btn-gold:hover{filter:brightness(1.12);transform:translateY(-2px)}
        .btn-gold:disabled{opacity:.35;cursor:not-allowed;filter:none;transform:none;animation:none}
        .ticket{background:#0A1727;border:1px solid rgba(232,178,61,0.35);position:relative;overflow:visible;width:100%;max-width:100%}
        .ticket::before,.ticket::after{content:'';position:absolute;width:22px;height:22px;border-radius:50%;background:#06101E;top:50%;transform:translateY(-50%);z-index:2}
        .ticket::before{left:-11px;border:1px solid rgba(232,178,61,0.35)}
        .ticket::after{right:-11px;border:1px solid rgba(232,178,61,0.35)}
        @media(max-width:480px){.ticket::before,.ticket::after{display:none}}
        .ticket-dashed{border-top:2px dashed rgba(232,178,61,0.25);margin:0 24px}
        .nav-link{font-size:12px;font-weight:700;font-family:Montserrat,sans-serif;letter-spacing:.08em;color:rgba(255,255,255,0.65);text-decoration:none;text-transform:uppercase;cursor:pointer;transition:color .2s;background:none;border:none}
        .nav-link:hover{color:#FF7A29}
        .incl-row{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
        .incl-row:last-child{border-bottom:none}
        .receipt-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);gap:8px}
        .receipt-row:last-child{border-bottom:none}
        .security-strip{display:flex;justify-content:center;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 20px;background:#060C18;border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin-top:20px}
        footer a{color:rgba(255,255,255,0.45);text-decoration:none}
        footer a:hover{color:#FF7A29}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:300 }}>
        <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
          <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 32s linear infinite' }}>
            {[...Array(4)].map((_,i) => (
              <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff' }}>
                &nbsp;🏏 SEASON 5 REGISTRATIONS OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 50+ CITIES &nbsp;·&nbsp; BACKED BY SOURAV GANGULY &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
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

      <div className="wrap" style={{ paddingTop:32 }}>
        {/* Selected banner */}
        <div style={{ background:'#060C18', border:'1px solid rgba(232,178,61,0.5)', borderLeft:'4px solid #E8B23D', padding:'14px 16px', marginBottom:36, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', borderRadius:12 }}>
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
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:10, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.18em', color:'#E8B23D', marginBottom:8, textTransform:'uppercase' }}>Secure Your Spot</div>
          <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(24px,4vw,44px)', color:'#fff', letterSpacing:'.02em', lineHeight:1.1 }}>
            PHASE 2 <span style={{ color:'#E8B23D' }}>ENTRY FEE</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, marginTop:10 }}>You've been selected. Now secure your physical trial slot.</p>
        </div>

        {/* Gold ticket */}
        <div style={{ maxWidth:680, margin:'0 auto 40px' }}>
          <div className="ticket">
            <div style={{ background:'linear-gradient(135deg,#E8B23D,#B8860B)', padding:'22px 24px' }}>
              <div style={{ fontSize:9, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.2em', color:'rgba(0,0,0,0.55)', marginBottom:6, textTransform:'uppercase' }}>BCPL Season 5 · Secure Payment</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(14px,4vw,18px)', color:'#fff', lineHeight:1.25, textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>PHASE 2 PHYSICAL TRIAL ENTRY · BCPL SEASON 5</div>
              <div style={{ marginTop:6, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.75)' }}>Brand Ambassador: Sourav Ganguly</div>
            </div>

            <div style={{ background:'#0A1727', padding:'28px 24px', textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'rgba(255,255,255,0.38)', marginBottom:8, textTransform:'uppercase' }}>Total Amount Due</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(48px,10vw,64px)', color:'#fff', lineHeight:1, letterSpacing:'-0.02em' }}>₹{amount.toLocaleString()}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:8 }}>Phase 2 Entry Fee · {role} · {city} Trial</div>
            </div>

            <div className="ticket-dashed" />

            <div style={{ background:'#0A1727', padding:'20px 24px 24px' }}>
              {[
                ['Player Name', playerName],
                ['Role', '🏏 ' + role],
                ['Trial City', '📍 ' + city],
                ['Registration Ref', regId.slice(0,8).toUpperCase()],
                ['Taxable Amount', `₹${taxBase.toLocaleString()}`],
                ['GST (18%)', `₹${gst.toLocaleString()}`],
                ['Phase 2 Amount', `₹${amount.toLocaleString()}`],
              ].map(([k,v]) => (
                <div key={k} className="receipt-row">
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600, flexShrink:0 }}>{k}</span>
                  <span style={{ fontSize: k==='Registration Ref'?11:13, color: k==='Phase 2 Amount'?'#E8B23D':'#fff', fontWeight:700, fontFamily: k==='Registration Ref'?'monospace':'Montserrat,sans-serif', letterSpacing: k==='Registration Ref'?'.04em':0, wordBreak:'break-all', textAlign:'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inclusions */}
        <div style={{ maxWidth:680, margin:'0 auto 32px', background:'#0A1727', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'24px 20px' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, letterSpacing:'.12em', color:'rgba(255,255,255,0.55)', marginBottom:16, textTransform:'uppercase' }}>What ₹{amount.toLocaleString()} Gets You</div>
          {[
            { icon:'✅', text:'Reserved physical trial slot at your city ground', ok:true },
            { icon:'✅', text:'Franchise coaching staff evaluation — scouts watch you live', ok:true },
            { icon:'✅', text:'Live auction participation rights — get drafted by a franchise', ok:true },
            { icon:'✅', text:'BCPL Season 5 player profile (digital + physical)', ok:true },
            { icon:'✅', text:'Match jersey if contracted by a franchise', ok:true },
            { icon:'❌', text:'Does NOT guarantee franchise selection — merit based', ok:false },
          ].map(({ icon, text, ok }) => (
            <div key={text} className="incl-row">
              <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
              <span style={{ fontSize:13, color: ok ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.38)', lineHeight:1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Terms + CTA */}
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <div onClick={() => setAgreed(a => !a)} style={{ display:'flex', alignItems:'flex-start', gap:14, cursor:'pointer', padding:'16px 20px', background: agreed?'rgba(232,178,61,0.06)':'#0A1727', border: agreed?'1px solid rgba(232,178,61,0.4)':'1px solid rgba(255,255,255,0.08)', borderRadius:12, marginBottom:20, transition:'all .2s' }}>
            <div style={{ width:20, height:20, border: agreed?'2px solid #E8B23D':'2px solid rgba(255,255,255,0.2)', borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginTop:1, background: agreed?'#E8B23D':'transparent', transition:'all .2s' }}>
              {agreed && <span style={{ color:'#000', fontSize:12, fontWeight:900 }}>✓</span>}
            </div>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.55 }}>
              I understand this is a Phase 2 physical trial entry fee. Payment confirms my trial slot and is non-refundable. If selected, I pay only then — no charge unless selected.
            </span>
          </div>

          {payError && (
            <div style={{ padding:'12px 16px', background:'#EF444415', border:'1px solid #EF444440', borderRadius:10, color:'#EF4444', fontSize:13, marginBottom:16 }}>⚠ {payError}</div>
          )}

          <button className="btn-gold" disabled={!agreed || payLoading} style={{ width:'100%', padding:'18px 32px', fontSize:15, letterSpacing:'.1em', textAlign:'center' }} onClick={handlePay}>
            {payLoading ? (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(0,0,0,0.3)', borderTopColor:'#000', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                Processing…
              </span>
            ) : `PAY ₹${amount.toLocaleString()} — SECURE YOUR TRIAL SPOT →`}
          </button>

          <div className="security-strip">
            {[{ icon:'🔒', label:'Cashfree Secured' }, { icon:'🛡', label:'256-bit SSL' }, { icon:'🏢', label:'BCPL' }].map(({ icon, label }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:14 }}>{icon}</span>
                <span style={{ fontSize:11, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'rgba(255,255,255,0.35)', letterSpacing:'.06em' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BCPLFooter />
    </div>
  );
}
