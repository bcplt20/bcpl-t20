import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getRegistrationStatus, getMe } from '../lib/api';
import { useLang } from '../lib/i18n';

type LoadState = 'loading' | 'ok' | 'not_selected' | 'error';

export function Phase2Registration() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [playerName, setPlayerName] = useState('');
  const [role, setRole]             = useState('');
  const [city, setCity]             = useState('');
  const [regId, setRegId]           = useState('');
  const [phase2Status, setPhase2Status] = useState<string|null>(null);
  
  const [, setLocation] = useLocation();
  const { t } = useLang();

  // Declarations
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

  // Already past phase-2 registration → continue to payment (effect-driven, never during render)
  useEffect(() => {
    if (loadState === 'ok' && phase2Status && phase2Status !== 'pending') {
      setLocation('/register/phase2/payment');
    }
  }, [loadState, phase2Status, setLocation]);

  const canProceed = check1 && check2 && check3;

  const handleProceed = () => {
    setLocation('/register/phase2/payment');
  };

  if (loadState === 'loading') return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', fontFamily:'var(--font-body)' }}>
      {t("Loading your registration…", "आपका रजिस्ट्रेशन लोड हो रहा है…")}
    </div>
  );

  if (loadState === 'error') return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--red)', fontFamily:'var(--font-body)' }}>
      {t("Error loading.", "लोड करने में त्रुटि।")} <Link href="/" style={{ color:'var(--orange)', marginLeft:8, textDecoration:'none' }}>{t("Go home", "होम पर जाएं")}</Link>
    </div>
  );

  if (loadState === 'not_selected') return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24, fontFamily:'var(--font-body)', textAlign:'center' }}>
      <div style={{ fontSize:48 }}>🏏</div>
      <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:32, color:'#fff', textTransform:'uppercase' }}>{t("Phase 2 Not Accessible Yet", "फेज 2 अभी उपलब्ध नहीं है")}</div>
      <div style={{ fontSize:15, color:'#64748B', maxWidth:400, lineHeight:1.6 }}>{t("Phase 2 is only available after your Phase 1 video has been reviewed and you've been selected by scouts.", "फेज 2 केवल तभी उपलब्ध है जब आपके वीडियो का रिव्यू हो चुका हो और आपको चुना गया हो।")}</div>
      <Link href="/register/upload-video" className="btn-cta" style={{ marginTop:16 }}>{t("Go to Video Upload →", "वीडियो अपलोड पर जाएं →")}</Link>
      <style>{`.btn-cta{display:inline-flex;align-items:center;background:linear-gradient(135deg,var(--orange),var(--orange-2));border:none;border-radius:14px;color:#fff;font-family:var(--font-head);font-weight:900;letter-spacing:0.04em;padding:16px 32px;font-size:16px;text-decoration:none;text-transform:uppercase;transition:opacity 0.2s,transform 0.15s;box-shadow:0 6px 24px rgba(255,122,41,0.35);}`}</style>
    </div>
  );

  if (phase2Status && phase2Status !== 'pending') {
    return null; // redirect handled by the effect above
  }

  return (
    <div className="page-root">
      <style>{`
        .page-root { background: var(--bg); min-height: 100vh; color: var(--ink); font-family: var(--font-body); overflow-x: hidden; padding-bottom: calc(120px + env(safe-area-inset-bottom)); }
        .W { max-width: var(--container); margin: 0 auto; padding: 0 20px; }
        @media (min-width: 768px) { .W { padding: 0 32px; } }
        @media (min-width: 1280px) { .W { padding: 0 48px; } }
        .grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
        @media (min-width: 1024px) { .grid { grid-template-columns: 1.2fr 340px; } }
        
        .card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
        .btn-cta { background: linear-gradient(135deg, var(--orange), var(--orange-2)); border: none; border-radius: var(--r); color: #fff; font-family: var(--font-head); font-weight: 800; font-size: 16px; letter-spacing: 0.04em; padding: 18px 24px; cursor: pointer; text-transform: uppercase; transition: opacity 0.2s, transform 0.15s; box-shadow: 0 6px 24px rgba(255,122,41,0.35); width: 100%; display: flex; justify-content: center; align-items: center; }
        .btn-cta:hover { opacity: 0.9; transform: translateY(-2px); }
        .btn-cta:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
        
        .check-row { display: flex; align-items: flex-start; gap: 16px; cursor: pointer; padding: 20px; border: 1px solid var(--line); background: rgba(255,255,255,0.02); transition: all 0.2s; border-radius: var(--r); margin-bottom: 12px; }
        .check-row:hover { border-color: rgba(255,122,41,0.4); background: rgba(255,122,41,0.02); }
        .check-row.checked { border-color: rgba(34,197,94,0.4); background: rgba(34,197,94,0.06); }
        .cbox { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin-top: 2px; }
        .cbox.checked { background: var(--green); border-color: var(--green); }
        
        .ticket { background: var(--panel); border: 1px solid rgba(232,178,61,0.3); border-radius: var(--r); position: relative; overflow: hidden; }
        .ticket-dash { border-top: 2px dashed rgba(232,178,61,0.2); margin: 0 24px; position: relative; }
        .ticket-dash::before, .ticket-dash::after { content:''; position:absolute; width:24px; height:24px; background:var(--bg); border-radius:50%; top:-12px; }
        .ticket-dash::before { left:-36px; border-right: 1px solid rgba(232,178,61,0.3); }
        .ticket-dash::after { right:-36px; border-left: 1px solid rgba(232,178,61,0.3); }
        
        .stick-cta { position: fixed; bottom: 0; left: 0; right: 0; padding: 16px 20px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); background: rgba(3,7,16,0.95); backdrop-filter: blur(12px); border-top: 1px solid rgba(255,122,41,0.3); z-index: 1000; }
        @media (min-width: 768px) { .stick-cta { display: none; } }
      `}</style>

      <SiteHeader />

      <div className="W" style={{ paddingTop: 40 }}>
        {/* Banner */}
        <div style={{ background: 'linear-gradient(90deg, rgba(34,197,94,0.1), rgba(34,197,94,0.02))', border: '1px solid rgba(34,197,94,0.3)', borderLeft: '4px solid var(--green)', padding: '16px 20px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14, borderRadius: 'var(--r)' }}>
          <span style={{ fontSize: 24 }}>✅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16, color: 'var(--green)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{t("PHASE 1 CLEARED", "फेज 1 क्लियर")}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{t(`Scout Selected · 🏏 ${role} · ${city}`, `स्काउट द्वारा चयनित · 🏏 ${role} · ${city}`)}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13, letterSpacing: '.12em', color: 'var(--orange)', marginBottom: 8, textTransform: 'uppercase' }}>{t("Phase 2 Onboarding", "फेज 2 ऑनबोर्डिंग")}</div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(28px, 5vw, 48px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.05 }}>
            {t("PLAYER", "प्लेयर")} <span style={{ color: 'var(--orange)' }}>{t("ONBOARDING", "ऑनबोर्डिंग")}</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 12, maxWidth: 600, lineHeight: 1.6 }}>
            {t("Confirm the declarations below to proceed to Phase 2 payment. Employment & emergency details will be collected during KYC.", "फेज 2 पेमेंट के लिए आगे बढ़ने से पहले नीचे दी गई घोषणाओं की पुष्टि करें। रोज़गार और आपातकालीन जानकारी KYC के दौरान ली जाएगी।")}
          </p>
        </div>

        <div className="grid">
          <div>
            <div className="card">
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, color: '#fff', textTransform: 'uppercase', marginBottom: 6 }}>{t("Terms & Declaration", "शर्तें और घोषणा")}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>{t("Please read and confirm each statement carefully", "कृपया ध्यान से पढ़ें और प्रत्येक कथन की पुष्टि करें")}</div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { val: check1, set: setCheck1, text: t('I confirm that I have not played first-class cricket, IPL, or international cricket professionally.', 'मैं पुष्टि करता हूं कि मैंने प्रथम श्रेणी क्रिकेट, आईपीएल या अंतरराष्ट्रीय क्रिकेट पेशेवर रूप से नहीं खेला है।') },
                  { val: check2, set: setCheck2, text: t('I understand the trial terms, the franchise auction process, and the two-phase selection system.', 'मैं ट्रायल की शर्तों, फ्रैंचाइज़ी नीलामी प्रक्रिया और दो-चरणीय चयन प्रणाली को समझता हूं।') },
                  { val: check3, set: setCheck3, text: t('I agree to abide by the BCPL Code of Conduct throughout Season 5.', 'मैं सीजन 5 के दौरान BCPL आचार संहिता का पालन करने के लिए सहमत हूं।') },
                ].map(({ val, set, text }, idx) => (
                  <div key={idx} className={`check-row ${val ? 'checked' : ''}`} onClick={() => set(!val)}>
                    <div className={`cbox ${val ? 'checked' : ''}`}>{val && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>✓</span>}</div>
                    <span style={{ fontSize: 15, color: val ? '#fff' : 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>

              {canProceed && (
                <div style={{ marginTop: 16, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--r)', padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>{t("All declarations confirmed. You may proceed.", "सभी घोषणाओं की पुष्टि हो गई है। आप आगे बढ़ सकते हैं।")}</span>
                </div>
              )}

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }} className="desk-only-btn">
                <style>{`@media(max-width: 767px){ .desk-only-btn { display: none !important; } }`}</style>
                <button className="btn-cta" style={{ width: 'auto' }} disabled={!canProceed} onClick={handleProceed}>
                  {t("PROCEED TO PAYMENT →", "पेमेंट के लिए आगे बढ़ें →")}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13, letterSpacing: '.12em', color: 'rgba(255,255,255,0.4)', marginBottom: 12, textTransform: 'uppercase' }}>{t("Phase 2 Entry Fee", "फेज 2 एंट्री फीस")}</div>
            <div className="ticket">
              <div style={{ background: 'linear-gradient(135deg, var(--orange), var(--orange-2))', padding: '24px' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 11, letterSpacing: '.18em', color: 'rgba(255,255,255,0.8)', marginBottom: 6, textTransform: 'uppercase' }}>BCPL Season 5</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 22, color: '#fff', lineHeight: 1.2, textTransform: 'uppercase' }}>{t("PHASE 2 PHYSICAL TRIAL", "फेज 2 फिजिकल ट्रायल")}</div>
              </div>
              <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--panel)' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, letterSpacing: '.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>{t("Entry Fee", "एंट्री फीस")}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 56, color: 'var(--orange)', lineHeight: 1 }}>₹2,000</div>
              </div>
              <div className="ticket-dash" />
              <div style={{ padding: '20px 24px', background: 'var(--panel)' }}>
                {[
                  [t('Player', 'प्लेयर'), playerName || '—'],
                  [t('Role', 'रोल'), '🏏 ' + (role || '—')],
                  [t('Trial City', 'ट्रायल शहर'), city || '—'],
                  [t('Reg. ID', 'रजि. आईडी'), regId ? regId.slice(0,8).toUpperCase() : '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{k}</span>
                    <span style={{ color: '#fff', fontWeight: 700, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="stick-cta">
        <button className="btn-cta" disabled={!canProceed} onClick={handleProceed}>
          {t("PROCEED TO PAYMENT →", "पेमेंट के लिए आगे बढ़ें →")}
        </button>
      </div>

      <BCPLFooter />
    </div>
  );
}
