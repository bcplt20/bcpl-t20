import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { verifyPhase2Payment, getRegistrationStatus, getMe } from '../lib/api';
import { useLang } from '../lib/i18n';

export function Phase2PaymentReceipt() {
  const [state, setState] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [playerName, setPlayerName] = useState('');
  const [role, setRole]     = useState('');
  const [city, setCity]     = useState('');
  const [regId, setRegId]   = useState('');
  const [amount, setAmount] = useState(2000);
  const [paidAt, setPaidAt] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const [, setLocation] = useLocation();
  const { t } = useLang();

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
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20, color:'#64748B', fontFamily:'var(--font-body)' }}>
      <div style={{ width:48, height:48, border:'4px solid rgba(232,178,61,0.2)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, letterSpacing:'.06em', color:'#fff', textTransform:'uppercase' }}>{t("Verifying your payment…", "आपका पेमेंट वेरिफाई हो रहा है…")}</div>
    </div>
  );

  if (state === 'error') return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24, fontFamily:'var(--font-body)', textAlign:'center' }}>
      <div style={{ fontSize:56 }}>⚠️</div>
      <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:32, color:'var(--red)', textTransform:'uppercase' }}>{t("Verification Issue", "वेरिफिकेशन समस्या")}</div>
      <div style={{ fontSize:15, color:'#64748B', maxWidth:400, lineHeight:1.6 }}>{errMsg || t('Could not verify payment. If you paid, your slot is still confirmed. Please contact support.', 'पेमेंट वेरिफाई नहीं हो सका। यदि आपने पेमेंट कर दिया है, तो आपकी जगह पक्की है।')}</div>
      <Link href="/register/phase2/kyc" className="btn-cta" style={{ marginTop:16 }}>{t("Try KYC Anyway →", "फिर भी KYC का प्रयास करें →")}</Link>
      <style>{`.btn-cta{display:inline-flex;align-items:center;background:linear-gradient(135deg,var(--orange),var(--orange-2));border:none;border-radius:14px;color:#fff;font-family:var(--font-head);font-weight:900;letter-spacing:0.04em;padding:14px 28px;text-transform:uppercase;text-decoration:none;}`}</style>
    </div>
  );

  const taxBase = Math.round(amount / 1.18);
  const gst     = amount - taxBase;
  const halfGst = Math.round(gst / 2);

  return (
    <div className="page-root">
      <style>{`
        .page-root { background: var(--bg); min-height: 100vh; color: var(--ink); font-family: var(--font-body); overflow-x: hidden; padding-bottom: 80px; }
        .W { max-width: 800px; margin: 0 auto; padding: 0 20px; }
        @media (min-width: 768px) { .W { padding: 0 32px; } }
        
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmerAnim { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
        .ticket { background: var(--panel); border: 1px solid rgba(232,178,61,0.4); border-radius: var(--r); position: relative; overflow: hidden; margin-bottom: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); animation: fadeUp 0.6s 0.2s ease both; }
        .ticket-dash { border-top: 2px dashed rgba(232,178,61,0.25); margin: 0 24px; position: relative; }
        .ticket-dash::before, .ticket-dash::after { content:''; position:absolute; width:24px; height:24px; background:var(--bg); border-radius:50%; top:-12px; }
        .ticket-dash::before { left:-36px; border-right: 1px solid rgba(232,178,61,0.4); }
        .ticket-dash::after { right:-36px; border-left: 1px solid rgba(232,178,61,0.4); }
        
        .next-card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 24px; border-top: 3px solid var(--orange); transition: transform 0.2s; }
        .next-card:hover { transform: translateY(-4px); border-color: rgba(255,122,41,0.3); }
        .next-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media (min-width: 640px) { .next-grid { grid-template-columns: repeat(3, 1fr); } }
        
        .btn-kyc { background: transparent; border: 1px solid rgba(232,178,61,0.6); border-radius: var(--r); color: var(--gold); font-family: var(--font-head); font-weight: 800; font-size: 14px; letter-spacing: .08em; cursor: pointer; padding: 12px 24px; text-transform: uppercase; text-decoration: none; display: inline-block; transition: all 0.2s; }
        .btn-kyc:hover { background: rgba(232,178,61,0.1); transform: translateY(-2px); }
      `}</style>

      <SiteHeader />

      <div className="W">
        {/* Hero */}
        <div style={{ padding: '60px 0 48px', textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), #B8860B)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 12px rgba(232,178,61,0.1), 0 0 0 24px rgba(232,178,61,0.05)', animation: 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
            <span style={{ fontSize: 48, color: '#000', lineHeight: 1 }}>✓</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(32px, 6vw, 64px)', color: '#fff', lineHeight: 1.05, textTransform: 'uppercase', animation: 'fadeUp 0.5s 0.2s ease both' }}>
            {t("PHYSICAL TRIAL SLOT", "फिजिकल ट्रायल जगह")}<br/>
            <span style={{ background: 'linear-gradient(90deg, var(--gold), #FFD700, var(--gold))', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmerAnim 2.5s linear infinite', display: 'inline-block' }}>{t("SECURED.", "पक्की हो गई।")}</span>
          </h1>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 'clamp(14px, 3vw, 20px)', color: 'rgba(255,255,255,0.5)', marginTop: 16, letterSpacing: '.1em', textTransform: 'uppercase', animation: 'fadeUp 0.5s 0.3s ease both' }}>
            {t("SEE YOU ON THE GROUND.", "मैदान पर मिलते हैं।")}
          </div>
        </div>

        {/* Gold ticket receipt */}
        <div className="ticket">
          <div style={{ background: 'linear-gradient(135deg, var(--gold), #B8860B)', padding: '24px 32px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 11, letterSpacing: '.2em', color: 'rgba(0,0,0,0.6)', marginBottom: 8, textTransform: 'uppercase' }}>{t("Official Confirmation · BCPL Season 5", "आधिकारिक पुष्टि · BCPL सीजन 5")}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(16px, 4vw, 22px)', color: '#fff', textTransform: 'uppercase', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              {t("PHASE 2 PHYSICAL TRIAL — CONFIRMED", "फेज 2 फिजिकल ट्रायल — पक्का")}
            </div>
          </div>

          <div style={{ padding: '32px 32px 24px', background: 'var(--panel)' }}>
            {[
              [t('Player', 'प्लेयर'), playerName],
              [t('Role', 'रोल'), '🏏 ' + role],
              [t('Trial City', 'ट्रायल शहर'), '📍 ' + city],
              [t('Registration No.', 'रजिस्ट्रेशन नं.'), regId.slice(0,8).toUpperCase()],
              [t('Payment Date', 'पेमेंट की तारीख'), paidAt],
            ].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 14 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{k}</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(232,178,61,0.04)', borderTop: '1px solid rgba(232,178,61,0.2)', padding: '20px 32px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 11, letterSpacing: '.14em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>{t("Payment Breakdown", "पेमेंट विवरण")}</div>
            {[
              { label: t('Taxable Amount', 'कर योग्य राशि'), val: `₹${taxBase.toLocaleString('en-IN')}`, dim: false },
              { label: 'CGST @ 9%', val: `₹${halfGst.toLocaleString('en-IN')}`, dim: true },
              { label: 'SGST @ 9%', val: `₹${halfGst.toLocaleString('en-IN')}`, dim: true },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span style={{ fontSize: 13, color: r.dim ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontSize: 13, color: r.dim ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{r.val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 0', marginTop: 12, borderTop: '1px solid rgba(232,178,61,0.3)' }}>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16, color: 'var(--gold)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{t("TOTAL PAID", "कुल भुगतान")}</span>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 24, color: 'var(--green)' }}>₹{amount.toLocaleString('en-IN')} ✅</span>
            </div>
          </div>

          <div className="ticket-dash" />

          <div style={{ background: 'var(--panel)', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 32 }}>📋</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 14, color: 'var(--gold)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{t("NEXT STEP", "अगला कदम")}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{t("Complete KYC verification — Aadhaar + PAN required", "KYC पूरा करें — आधार और पैन जरूरी")}</div>
            </div>
            <Link href="/register/phase2/kyc" className="btn-kyc">{t("COMPLETE KYC →", "KYC पूरा करें →")}</Link>
          </div>
        </div>

        {/* Next steps */}
        <div style={{ animation: 'fadeUp 0.6s 0.4s ease both' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13, letterSpacing: '.18em', color: 'rgba(255,255,255,0.4)', marginBottom: 20, textTransform: 'uppercase' }}>{t("Next Steps", "अगले कदम")}</div>
          <div className="next-grid">
            {[
              { icon:'🪪', title: t('Complete KYC', 'KYC पूरा करें'), desc: t('Aadhaar + PAN required for compliance and franchise records.', 'Compliance और फ्रैंचाइज़ी रिकॉर्ड के लिए आधार + पैन आवश्यक।'), cta: t('COMPLETE KYC →', 'KYC पूरा करें →'), ctaColor: 'var(--orange)', topColor: 'var(--orange)', href: '/register/phase2/kyc' },
              { icon:'📅', title: t('Trial Date Announcement', 'ट्रायल की तारीख'), desc: t('SMS + Email notification 30 days before your trial date. Check your phone.', 'ट्रायल से 30 दिन पहले SMS + ईमेल से सूचना।'), cta: null, ctaColor: '', topColor: 'var(--gold)', href: null },
              { icon:'💬', title: t('Stay Updated', 'अपडेट रहें'), desc: t('Keep your email and phone number active. All updates go there directly.', 'अपना ईमेल और फोन चालू रखें। सभी अपडेट वहीं मिलेंगे।'), cta: null, ctaColor: '', topColor: 'var(--green)', href: null },
            ].map(({ icon, title, desc, cta, ctaColor, topColor, href }) => (
              <div key={title} className="next-card" style={{ borderTopColor: topColor }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 8, textTransform: 'uppercase' }}>{title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: cta ? 20 : 0 }}>{desc}</div>
                {cta && href && (
                  <Link href={href} style={{ background: 'transparent', border: `1px solid ${ctaColor}60`, borderRadius: 'var(--r)', color: ctaColor, fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13, letterSpacing: '.08em', cursor: 'pointer', padding: '10px 20px', textDecoration: 'none', display: 'inline-block', textTransform: 'uppercase' }}>
                    {cta}
                  </Link>
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
