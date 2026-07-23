import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getRegistrationStatus, getMe, createPhase2Payment } from '../lib/api';
import { useLang } from '../lib/i18n';

const BASE = import.meta.env.BASE_URL;

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
  
  const [, setLocation] = useLocation();
  const { t } = useLang();

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
        setPlayerName(me.user?.name || '');
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
      setPayError(e.message || t('Payment failed. Please try again.', 'पेमेंट विफल रहा। कृपया पुनः प्रयास करें।'));
      setPayLoading(false);
    }
  };

  if (loadState === 'loading') return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', fontFamily:'var(--font-body)' }}>
      {t("Loading…", "लोड हो रहा है…")}
    </div>
  );

  if (loadState === 'not_selected') return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24, fontFamily:'var(--font-body)', textAlign:'center' }}>
      <div style={{ fontSize:48 }}>🏏</div>
      <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:28, color:'#fff', textTransform:'uppercase' }}>{t("Not Eligible for Phase 2", "फेज 2 के लिए पात्र नहीं")}</div>
      <div style={{ fontSize:14, color:'#64748B', maxWidth:360 }}>{t("Phase 2 payment is only available after qualifying in Phase 1.", "फेज 2 पेमेंट केवल फेज 1 qualify करने के बाद उपलब्ध है।")}</div>
      <Link href="/register/upload-video" className="btn-cta" style={{ marginTop:8 }}>{t("Go to Video Upload →", "वीडियो अपलोड पर जाएं →")}</Link>
      <style>{`.btn-cta{display:inline-flex;align-items:center;background:linear-gradient(135deg,var(--orange),var(--orange-2));border:none;border-radius:14px;color:#fff;font-family:var(--font-head);font-weight:900;letter-spacing:0.04em;padding:14px 28px;text-transform:uppercase;text-decoration:none;}`}</style>
    </div>
  );

  if (loadState === 'already_paid') return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24, fontFamily:'var(--font-body)', textAlign:'center' }}>
      <div style={{ fontSize:48 }}>✅</div>
      <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:28, color:'var(--green)', textTransform:'uppercase' }}>{t("Payment Already Done", "पेमेंट पहले ही हो चुका है")}</div>
      <div style={{ fontSize:14, color:'#64748B', maxWidth:360 }}>{t("Your Phase 2 payment is confirmed. Proceed to KYC verification.", "आपका फेज 2 पेमेंट पक्का हो गया है। KYC पूरा करें।")}</div>
      <Link href="/register/phase2/kyc" className="btn-cta" style={{ marginTop:8 }}>{t("Complete KYC →", "KYC पूरा करें →")}</Link>
      <style>{`.btn-cta{display:inline-flex;align-items:center;background:linear-gradient(135deg,var(--orange),var(--orange-2));border:none;border-radius:14px;color:#fff;font-family:var(--font-head);font-weight:900;letter-spacing:0.04em;padding:14px 28px;text-transform:uppercase;text-decoration:none;}`}</style>
    </div>
  );

  const taxBase = Math.round(amount / 1.18);
  const gst     = amount - taxBase;

  return (
    <div className="page-root">
      <style>{`
        .page-root { background: var(--bg); min-height: 100vh; color: var(--ink); font-family: var(--font-body); overflow-x: hidden; padding-bottom: calc(120px + env(safe-area-inset-bottom)); }
        .W { max-width: 800px; margin: 0 auto; padding: 0 20px; }
        @media (min-width: 768px) { .W { padding: 0 32px; } }
        
        .btn-gold { background: linear-gradient(135deg, var(--gold), #B8860B); border: none; border-radius: var(--r); color: #000; font-family: var(--font-head); font-weight: 900; font-size: 18px; letter-spacing: 0.08em; padding: 20px 32px; cursor: pointer; text-transform: uppercase; transition: transform 0.15s, filter 0.2s; width: 100%; display: flex; justify-content: center; align-items: center; box-shadow: 0 10px 30px rgba(232,178,61,0.25); animation: pulseGold 2.5s infinite; }
        .btn-gold:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .btn-gold:disabled { opacity: 0.4; cursor: not-allowed; transform: none; animation: none; box-shadow: none; filter: grayscale(1); }
        @keyframes pulseGold { 0%,100% { box-shadow: 0 0 0 0 rgba(232,178,61,0.5); } 50% { box-shadow: 0 0 0 12px rgba(232,178,61,0); } }
        
        .ticket { background: var(--panel); border: 1px solid rgba(232,178,61,0.4); border-radius: var(--r); position: relative; overflow: hidden; margin-bottom: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
        .ticket-dash { border-top: 2px dashed rgba(232,178,61,0.25); margin: 0 24px; position: relative; }
        .ticket-dash::before, .ticket-dash::after { content:''; position:absolute; width:24px; height:24px; background:var(--bg); border-radius:50%; top:-12px; }
        .ticket-dash::before { left:-36px; border-right: 1px solid rgba(232,178,61,0.4); }
        .ticket-dash::after { right:-36px; border-left: 1px solid rgba(232,178,61,0.4); }
        
        .card-box { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 24px; margin-bottom: 32px; }
        
        .stick-cta { position: fixed; bottom: 0; left: 0; right: 0; padding: 16px 20px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); background: rgba(3,7,16,0.95); backdrop-filter: blur(12px); border-top: 1px solid rgba(232,178,61,0.3); z-index: 1000; }
        @media (min-width: 768px) { .stick-cta { display: none; } }
      `}</style>

      <SiteHeader />

      <div className="W" style={{ paddingTop: 40 }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 14, letterSpacing: '.18em', color: 'var(--gold)', marginBottom: 12, textTransform: 'uppercase' }}>{t("Secure Your Spot", "अपनी जगह पक्की करें")}</div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(32px, 6vw, 56px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.05 }}>
            {t("PHASE 2", "फेज 2")} <span style={{ color: 'var(--gold)' }}>{t("ENTRY FEE", "एंट्री फीस")}</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 12, lineHeight: 1.6 }}>
            {t("You've been selected. Now secure your physical trial slot.", "आपको चुना गया है। अब अपनी फिजिकल ट्रायल जगह पक्की करें।")}
          </p>
        </div>

        {/* Gold ticket */}
        <div className="ticket">
          <div style={{ background: 'linear-gradient(135deg, var(--gold), #B8860B)', padding: '24px 32px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 11, letterSpacing: '.2em', color: 'rgba(0,0,0,0.6)', marginBottom: 8, textTransform: 'uppercase' }}>{t("BCPL Season 5 · Secure Payment", "BCPL सीजन 5 · सुरक्षित पेमेंट")}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(18px, 4vw, 24px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              {t("PHASE 2 PHYSICAL TRIAL ENTRY", "फेज 2 फिजिकल ट्रायल एंट्री")}
            </div>
          </div>

          <div style={{ padding: '36px 32px', textAlign: 'center', background: 'var(--panel)' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, letterSpacing: '.16em', color: 'rgba(255,255,255,0.4)', marginBottom: 12, textTransform: 'uppercase' }}>{t("Total Amount Due", "कुल देय राशि")}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(56px, 8vw, 72px)', color: '#fff', lineHeight: 1 }}>₹{amount.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>{t(`Phase 2 Entry Fee · ${role} · ${city} Trial`, `फेज 2 एंट्री फीस · ${role} · ${city} ट्रायल`)}</div>
          </div>

          <div className="ticket-dash" />

          <div style={{ padding: '24px 32px', background: 'var(--panel)' }}>
            {[
              [t('Player Name', 'प्लेयर का नाम'), playerName],
              [t('Role', 'रोल'), '🏏 ' + role],
              [t('Trial City', 'ट्रायल शहर'), '📍 ' + city],
              [t('Registration Ref', 'रजिस्ट्रेशन नं.'), regId.slice(0,8).toUpperCase()],
              [t('Taxable Amount', 'कर योग्य राशि'), `₹${taxBase.toLocaleString('en-IN')}`],
              [t('GST (18%)', 'GST (18%)'), `₹${gst.toLocaleString('en-IN')}`],
            ].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 14 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{k}</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontSize: 16 }}>
              <span style={{ color: 'var(--gold)', fontWeight: 800, fontFamily: 'var(--font-head)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t("Total Amount", "कुल राशि")}</span>
              <span style={{ color: 'var(--gold)', fontWeight: 900, fontFamily: 'var(--font-head)', fontSize: 20 }}>₹{amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Terms + CTA */}
        <div style={{ marginBottom: 40 }}>
          <div onClick={() => setAgreed(a => !a)} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer', padding: '20px', background: agreed ? 'rgba(232,178,61,0.08)' : 'rgba(255,255,255,0.02)', border: agreed ? '1px solid rgba(232,178,61,0.5)' : '1px solid var(--line)', borderRadius: 'var(--r)', transition: 'all 0.2s', marginBottom: 24 }}>
            <div style={{ width: 24, height: 24, border: agreed ? '2px solid var(--gold)' : '2px solid rgba(255,255,255,0.3)', borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: agreed ? 'var(--gold)' : 'transparent', transition: 'all 0.2s' }}>
              {agreed && <span style={{ color: '#000', fontSize: 14, fontWeight: 900 }}>✓</span>}
            </div>
            <span style={{ fontSize: 14, color: agreed ? '#fff' : 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              {t("I understand this is a Phase 2 physical trial entry fee. Payment confirms my trial slot and is non-refundable. If selected, I pay only then — no charge unless selected.", "मैं समझता हूं कि यह फेज 2 फिजिकल ट्रायल एंट्री फीस है। पेमेंट मेरी ट्रायल जगह पक्की करता है और यह रिफंडेबल नहीं है।")}
            </span>
          </div>

          {payError && (
            <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--r)', color: 'var(--red)', fontSize: 14, marginBottom: 24, fontWeight: 600 }}>⚠ {payError}</div>
          )}

          <div className="desk-only-btn">
            <style>{`@media(max-width: 767px){ .desk-only-btn { display: none !important; } }`}</style>
            <button className="btn-gold" disabled={!agreed || payLoading} onClick={handlePay}>
              {payLoading ? t('Processing…', 'प्रोसेस हो रहा है…') : t(`PAY ₹${amount.toLocaleString('en-IN')} — SECURE YOUR SPOT →`, `₹${amount.toLocaleString('en-IN')} चुकाएं — जगह पक्की करें →`)}
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, flexWrap: 'wrap', padding: '24px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--r)', marginTop: 24 }}>
            {[{ icon:'🔒', label:'Cashfree Secured' }, { icon:'🛡', label:'256-bit SSL' }, { icon:'🏢', label:'BCPL' }].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="stick-cta">
        <button className="btn-gold" style={{ padding: '16px 20px', fontSize: 16 }} disabled={!agreed || payLoading} onClick={handlePay}>
          {payLoading ? t('Processing…', 'प्रोसेस हो रहा है…') : t(`PAY ₹${amount.toLocaleString('en-IN')} →`, `₹${amount.toLocaleString('en-IN')} चुकाएं →`)}
        </button>
      </div>

      <BCPLFooter />
    </div>
  );
}
