import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getDashboard } from '../lib/api';
import { getSession } from '../lib/auth';
import { useLang } from '../lib/i18n';

const ROADMAP = [
  { icon:'📝', label:'Register',     done:true  },
  { icon:'🎬', label:'Video',        done:true  },
  { icon:'🔨', label:'Phase 2',      done:true  },
  { icon:'🪪', label:'KYC',          done:true  },
  { icon:'🏟', label:'Trial',        active:true },
  { icon:'💰', label:'Auction',      done:false },
  { icon:'🏆', label:'Play BCPL',    done:false },
];

export function Phase2KYCApproved() {
  const [playerName, setPlayerName] = useState('Player');
  const [playerCity, setPlayerCity] = useState('—');
  const [regIdShort, setRegIdShort] = useState('—');
  const [playerRole, setPlayerRole] = useState('—');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  
  const [, setLocation] = useLocation();
  const { t } = useLang();
  const BASE = import.meta.env.BASE_URL;

  useEffect(() => {
    const session = getSession();
    if (!session) { setLocation('/register'); return; }
    getDashboard().then(d => {
      if (d.user)         setPlayerName(d.user.name);
      if (d.user?.email)  setPlayerEmail(d.user.email);
      if (d.user?.phone)  setPlayerPhone(d.user.phone);
      if (d.registration?.trialCity) setPlayerCity(d.registration.trialCity);
      if (d.registration?.id)        setRegIdShort('BCPL-' + d.registration.id.slice(0,8).toUpperCase());
      if (d.registration?.role)      setPlayerRole(d.registration.role);
    }).catch(() => {});
  }, [setLocation]);

  return (
    <div className="page-root">
      <style>{`
        .page-root { background: var(--bg); min-height: 100vh; font-family: var(--font-body); color: var(--ink); overflow-x: hidden; padding-bottom: 100px; }
        .W { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        @media(min-width: 768px){ .W { padding: 0 32px; } }
        
        .btn-cta { display: inline-block; background: linear-gradient(135deg, var(--orange), var(--orange-2)); border: none; border-radius: var(--r); color: #fff; font-family: var(--font-head); font-weight: 900; letter-spacing: .06em; cursor: pointer; transition: all .2s; text-decoration: none; padding: 14px 28px; text-transform: uppercase; }
        .btn-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(255,122,41,0.3); }
        .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: var(--r); color: rgba(255,255,255,0.8); font-family: var(--font-head); font-weight: 800; cursor: pointer; transition: all .2s; letter-spacing: .06em; text-transform: uppercase; }
        .btn-outline:hover { border-color: var(--orange); color: var(--orange); }
        
        .notice-card { background: var(--panel); border: 1px solid var(--line); padding: 24px; border-radius: var(--r); transition: border-color .2s; height: 100%; display: flex; flex-direction: column; }
        .notice-card:hover { border-color: rgba(255,122,41,0.4); }
        
        .chip { display: inline-flex; items-align: center; gap: 6px; padding: 6px 14px; font-size: 12px; font-weight: 800; font-family: var(--font-head); border-radius: 12px; text-transform: uppercase; letter-spacing: .04em; }
        
        @keyframes verifiedPop { 0% { transform: scale(0.5) rotate(-10deg); opacity: 0; } 60% { transform: scale(1.15) rotate(3deg); } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseOrange { 0%,100% { box-shadow: 0 0 0 0 rgba(255,122,41,0.5); } 50% { box-shadow: 0 0 0 12px rgba(255,122,41,0); } }
        @keyframes countdownPulse { 0%,100% { color: var(--gold); } 50% { color: #FFD700; text-shadow: 0 0 20px rgba(232,178,61,0.5); } }
        
        .profile-grid { display: grid; grid-template-columns: 1fr; gap: 24px; margin-bottom: 40px; }
        @media(min-width: 800px) { .profile-grid { grid-template-columns: 1fr 1fr; } }
        
        .notices-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 48px; }
        @media(min-width: 640px) { .notices-grid { grid-template-columns: repeat(3, 1fr); } }
        
        .season-cta { background: linear-gradient(135deg, var(--panel), #060C18); border: 1px solid rgba(255,122,41,0.3); padding: 32px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; border-radius: var(--r); }
        .season-cta-btn { width: 100%; text-align: center; }
        @media(min-width: 480px) { .season-cta-btn { width: auto; } }
        
        .profile-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line); gap: 8px; }
        
        .roadmap-rail { display: flex; align-items: center; gap: 0; min-width: 600px; padding: 10px 0; }
        .roadmap-node-label { font-size: 10px; font-weight: 800; font-family: var(--font-head); text-align: center; white-space: nowrap; margin-top: 6px; text-transform: uppercase; letter-spacing: .04em; }
        
        .hero-chips { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
      `}</style>

      <SiteHeader />

      {/* ── VERIFIED HERO BANNER ── */}
      <div style={{ background: 'linear-gradient(135deg, #06101E, #04140A)', borderBottom: '2px solid rgba(34,197,94,0.4)', padding: '60px 0 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${BASE}bcpl-assets/event-teams-a.webp)`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.1, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
        <div className="W" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 80, animation: 'verifiedPop .7s cubic-bezier(.34,1.56,.64,1) both', display: 'inline-block', marginBottom: 16 }}>✅</div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(28px, 6vw, 56px)', color: 'var(--green)', letterSpacing: '.02em', textTransform: 'uppercase', marginBottom: 12, animation: 'fadeUp .5s ease .1s both', lineHeight: 1.1 }}>
            {t("KYC VERIFIED", "KYC वेरीफाइड")}
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto 24px', lineHeight: 1.6, animation: 'fadeUp .5s ease .2s both' }}>
            {t("You are officially cleared to participate in BCPL Season 5 Physical Trials. Your franchise journey begins on the ground.", "आप आधिकारिक रूप से BCPL सीजन 5 फिजिकल ट्रायल में भाग लेने के लिए क्लियर हैं। आपका फ्रैंचाइज़ी सफर अब मैदान पर शुरू होता है।")}
          </div>
          <div className="hero-chips" style={{ animation: 'fadeUp .5s ease .3s both' }}>
            {[
              { label: t('Phase 1 ✓', 'फेज 1 ✓'), color: 'var(--green)', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
              { label: t('Phase 2 ✓', 'फेज 2 ✓'), color: 'var(--green)', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
              { label: t('KYC ✓', 'KYC ✓'), color: 'var(--green)', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
              { label: t('Trial: Upcoming', 'ट्रायल: आगामी'), color: 'var(--orange)', bg: 'rgba(255,122,41,0.1)', border: 'rgba(255,122,41,0.4)' },
            ].map(c => (
              <div key={c.label} className="chip" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>{c.label}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SEASON ROADMAP RAIL ── */}
      <div style={{ background: '#030812', borderBottom: '1px solid var(--line)', padding: '24px 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="W">
          <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '.16em', color: 'rgba(255,255,255,0.3)', marginBottom: 16, textTransform: 'uppercase' }}>{t("YOUR JOURNEY", "आपका सफर")}</div>
          <div className="roadmap-rail">
            {ROADMAP.map((node, i) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 64 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                    background: node.done ? 'var(--green)' : node.active ? 'var(--orange)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${node.done ? 'var(--green)' : node.active ? 'var(--orange)' : 'rgba(255,255,255,0.1)'}`,
                    animation: node.active ? 'pulseOrange 2s ease infinite' : 'none',
                    color: node.done ? '#fff' : 'inherit'
                  }}>
                    {node.done ? '✓' : node.icon}
                  </div>
                  <div className="roadmap-node-label" style={{ color: node.done ? 'var(--green)' : node.active ? 'var(--orange)' : 'rgba(255,255,255,0.3)' }}>{t(node.label, node.label)}</div>
                </div>
                {i < ROADMAP.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: node.done ? 'var(--green)' : 'rgba(255,255,255,0.08)', margin: '0 8px', marginBottom: 20, minWidth: 16 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="W" style={{ paddingTop: 48 }}>
        <div className="profile-grid">

          {/* LEFT — Player Profile */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderTop: '4px solid var(--orange)', borderRadius: 'var(--r)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '.16em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{t("PLAYER PROFILE", "प्लेयर प्रोफाइल")}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 36px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.1 }}>{playerName}</div>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div className="chip" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#93C5FD' }}>🏏 {playerRole}</div>
                <div className="chip" style={{ background: 'rgba(255,122,41,0.1)', border: '1px solid rgba(255,122,41,0.3)', color: 'var(--orange)' }}>📍 {playerCity}</div>
              </div>

              {[
                { label: t('Registration No.', 'रजिस्ट्रेशन नं.'), value: regIdShort, mono: true },
                { label: t('Email', 'ईमेल'), value: playerEmail || '—', mono: false },
                { label: t('Phone', 'फोन'), value: playerPhone || '—', mono: false },
                { label: t('KYC Status', 'KYC स्टेटस'), value: t('✅ Verified', '✅ वेरीफाइड'), green: true },
              ].map(row => (
                <div key={row.label} className="profile-row">
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, flexShrink: 0 }}>{row.label}</div>
                  <div style={{ fontSize: row.mono ? 13 : 14, fontWeight: 700, color: row.green ? 'var(--green)' : 'rgba(255,255,255,0.9)', fontFamily: row.mono ? 'monospace' : 'inherit', textAlign: 'right', wordBreak: 'break-all', marginLeft: 8 }}>{row.value}</div>
                </div>
              ))}

              <button className="btn-outline" style={{ width: '100%', padding: '16px', marginTop: 24, fontSize: 14 }} onClick={() => {
                const logoUrl = `${window.location.origin}${BASE}bcpl-assets/bcpl-logo-white.png`;
                const initials = playerName.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2);
                const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BCPL Player ID — ${playerName}</title><style>body{margin:0;background:#030E1C;display:flex;justify-content:center;padding:32px;font-family:'Segoe UI',sans-serif}.card{width:340px;background:linear-gradient(145deg,#0D1F3C,#06101E);border:1.5px solid rgba(255,122,41,0.45);border-radius:18px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6)}.stripe{height:4px;background:linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)}.head{background:linear-gradient(135deg,#FF7A29,#C94E0E);padding:14px 20px}.head-title{font-size:10px;font-weight:800;color:rgba(255,255,255,0.9);letter-spacing:.18em}.head-sub{font-size:8px;color:rgba(255,255,255,0.65);margin-top:3px;letter-spacing:.1em}.body{padding:20px 22px 16px}.avatar{width:60px;height:60px;background:linear-gradient(135deg,#FF7A29,#C94E0E);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;margin-bottom:12px;box-shadow:0 4px 20px rgba(255,122,41,0.4)}.name{font-size:20px;font-weight:900;color:#fff;margin-bottom:3px}.role{font-size:11px;font-weight:800;color:#FF7A29;letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px}hr{border:none;border-top:1px solid rgba(255,255,255,0.08);margin:12px 0}.row{display:flex;justify-content:space-between;margin-bottom:9px}.label{font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:.08em}.val{font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);text-align:right}.ref{font-family:monospace;color:#FF7A29;font-size:11px;font-weight:700}.foot{background:rgba(255,122,41,0.07);border-top:1px solid rgba(255,122,41,0.18);padding:12px 22px;display:flex;justify-content:space-between;align-items:center}.kyc{background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.4);border-radius:6px;padding:4px 11px;font-size:9px;font-weight:800;color:#22C55E;letter-spacing:.08em}.site{font-size:9px;color:rgba(255,255,255,0.25);font-weight:600}@media print{body{padding:0;background:#fff}.card{box-shadow:none}}</style></head><body><div class="card"><div class="stripe"></div><div class="head"><div class="head-title">BHARTIYA CORPORATE PREMIER LEAGUE</div><div class="head-sub">OFFICIAL PLAYER ID CARD · SEASON 5 · 2026–27</div></div><div class="body"><div class="avatar">${initials}</div><div class="name">${playerName}</div><div class="role">🏏 ${playerRole} · ${playerCity}</div><hr/><div class="row"><span class="label">Email</span><span class="val">${playerEmail}</span></div><div class="row"><span class="label">Phone</span><span class="val">${playerPhone}</span></div><hr/><div class="row"><span class="label">Registration No.</span><span class="ref">${regIdShort}</span></div><div class="row"><span class="label">KYC Status</span><span class="val" style="color:#22C55E">✅ Verified</span></div></div><div class="foot"><span class="site">bcplt20.com · BCPL Season 5</span><span class="kyc">KYC ✓ VERIFIED</span></div></div><script>window.onload=function(){window.print();}<\/script></body></html>`;
                const win = window.open('', '_blank');
                if(win){ win.document.write(html); win.document.close(); }
              }}>
                📄 {t("Download Player ID Card →", "प्लेयर ID कार्ड डाउनलोड करें →")}
              </button>
            </div>
          </div>

          {/* RIGHT — Trial Details */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderTop: '4px solid var(--gold)', borderRadius: 'var(--r)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '.16em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{t("TRIAL INFORMATION", "ट्रायल की जानकारी")}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(24px, 3.5vw, 32px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.1 }}>{t("Physical Trial Details", "फिजिकल ट्रायल की जानकारी")}</div>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '.14em', color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>{t("TRIAL CITY", "ट्रायल शहर")}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 32 }}>🏟</span>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(28px, 5vw, 40px)', color: '#fff', textTransform: 'uppercase' }}>{playerCity}</div>
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '.14em', color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>{t("TRIAL GROUND", "ट्रायल का मैदान")}</div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>{t("To be announced", "घोषणा की जाएगी")}</div>
              </div>

              <div style={{ background: 'rgba(232,178,61,0.08)', border: '1px solid rgba(232,178,61,0.3)', padding: '24px 20px', marginBottom: 24, borderRadius: '12px' }}>
                <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '.14em', color: 'var(--gold)', marginBottom: 8, textTransform: 'uppercase' }}>{t("TRIAL DATE", "ट्रायल की तारीख")}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(28px, 6vw, 48px)', color: 'var(--gold)', lineHeight: 1, marginBottom: 12, animation: 'countdownPulse 2s ease infinite', textTransform: 'uppercase' }}>
                  {t("COMING SOON", "जल्द आ रही है")}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 6 }}>
                  {t("You'll receive SMS + Email", "आपको SMS + ईमेल मिलेगा")} <strong style={{ color: '#fff' }}>{t("30 days before", "30 दिन पहले")}</strong> {t("your trial date.", "आपकी ट्रायल की तारीख से।")}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{t("Expected: March–June 2026", "संभावित: मार्च–जून 2026")}</div>
              </div>

              <button className="btn-outline" style={{ width: '100%', padding: '16px', fontSize: 14, marginBottom: 16 }}>
                📍 {t(`View ${playerCity} on Google Maps →`, `${playerCity} को गूगल मैप्स पर देखें →`)}
              </button>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontStyle: 'italic' }}>{t("Exact ground address will be shared 30 days before trial", "मैदान का सही पता ट्रायल से 30 दिन पहले बताया जाएगा")}</div>
            </div>
          </div>
        </div>

        {/* ── IMPORTANT NOTICES ── */}
        <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '.16em', color: 'rgba(255,255,255,0.4)', marginBottom: 20, textTransform: 'uppercase' }}>{t("IMPORTANT UPDATES", "महत्वपूर्ण अपडेट्स")}</div>
        <div className="notices-grid">
          {[
            { icon:'💬', title: t('Stay Connected', 'जुड़े रहें'), body: t('Join the BCPL Players WhatsApp group for real-time trial updates, schedule announcements and coordination.', 'रियल-टाइम ट्रायल अपडेट्स और शेड्यूल के लिए BCPL प्लेयर्स WhatsApp ग्रुप से जुड़ें।'), cta: t('Join WhatsApp Group →', 'WhatsApp ग्रुप से जुड़ें →'), color: '#25D366', onClick: () => window.open('https://wa.me/919151346555?text=Hi%2C%20I%20want%20to%20join%20the%20BCPL%20Players%20WhatsApp%20group', '_blank') },
            { icon:'🏋️', title: t('Prepare Now', 'तैयारी शुरू करें'), body: t('Train consistently. BCPL evaluators assess your cricket skill and fitness against the standardised role-specific framework. Focus on your strengths — batting technique, bowling rhythm, or all-round conditioning.', 'लगातार ट्रेनिंग करें। BCPL evaluators आपकी क्रिकेट स्किल और फिटनेस को standardised role-specific framework के अनुसार आंकते हैं। अपनी ताकत पर ध्यान दें।'), cta: t('View Training Tips →', 'ट्रेनिंग टिप्स देखें →'), color: 'var(--orange)', onClick: () => { const el = document.getElementById('training-tips'); if(el) el.scrollIntoView({behavior:'smooth'}); } },
            { icon:'📧', title: t('Check Your Email', 'ईमेल चेक करें'), body: t('All trial updates, schedule and instructions will be sent to your registered email & WhatsApp number.', 'सभी ट्रायल अपडेट्स, शेड्यूल और निर्देश आपके रजिस्टर्ड ईमेल और WhatsApp पर भेजे जाएंगे।'), cta: t('Manage Preferences →', 'प्राथमिकताएं प्रबंधित करें →'), color: '#3B82F6', onClick: () => {} },
          ].map(card => (
            <div key={card.title} className="notice-card">
              <div style={{ fontSize: 36, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 12, textTransform: 'uppercase' }}>{card.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 24, flex: 1 }}>{card.body}</div>
              <button onClick={card.onClick} style={{ background: 'transparent', border: `1px solid ${card.color}40`, color: card.color, padding: '12px 20px', fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-head)', cursor: 'pointer', borderRadius: '10px', letterSpacing: '.06em', transition: 'all .2s', textTransform: 'uppercase' }}>
                {card.cta}
              </button>
            </div>
          ))}
        </div>

        {/* ── TRAINING TIPS ── */}
        <div id="training-tips" style={{ background: 'var(--panel)', border: '1px solid rgba(255,122,41,0.3)', borderRadius: 'var(--r)', padding: '32px 24px', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20, color: 'var(--orange)', letterSpacing: '.06em', marginBottom: 8, textTransform: 'uppercase' }}>🏋️ {t("TRAINING TIPS FOR PHYSICAL TRIAL", "फिजिकल ट्रायल के लिए ट्रेनिंग टिप्स")}</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>{t("BCPL evaluators assess these key areas against the standardised role-specific framework (blind to unnecessary personal details). Franchises make purchase decisions only at the auction, not at the trial.", "BCPL evaluators इन प्रमुख क्षेत्रों को standardised role-specific framework के अनुसार आंकते हैं (गैर-ज़रूरी निजी जानकारी के बिना)। फ्रैंचाइज़ी खरीद के फैसले सिर्फ़ ऑक्शन में लेती हैं, ट्रायल में नहीं।")}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {[
              { icon:'🏃', title: t('Fitness First', 'पहले फिटनेस'), tip: t('30 min cardio daily. Your stamina matters in the last over as much as the first.', 'रोज़ 30 मिनट कार्डियो। आखिरी ओवर में भी स्टैमिना उतनी ही मायने रखती है।') },
              { icon:'🏏', title: t('Master Your Core Skill', 'मुख्य कौशल में महारत'), tip: t('Spend 70% of practice on your primary role. Consistency beats variety at trials.', 'अपनी मुख्य भूमिका पर 70% अभ्यास करें। निरंतरता जरूरी है।') },
              { icon:'🎯', title: t('Video Review', 'वीडियो रिव्यू'), tip: t('Watch back your own practice sessions. Identify one technical flaw and fix it weekly.', 'अपने अभ्यास सेशन का वीडियो देखें और गलतियां सुधारें।') },
              { icon:'🧘', title: t('Match Simulation', 'मैच सिम्युलेशन'), tip: t('Practice under pressure — tape a match format with others. React-time decisions matter.', 'दबाव में अभ्यास करें। निर्णय लेने की क्षमता मायने रखती है।') },
              { icon:'💪', title: t('Strength & Agility', 'स्ट्रेंथ और फुर्ती'), tip: t('Focus on rotational strength (core, shoulders) and lateral movement. Cricket is explosive.', 'कोर और कंधों की ताकत पर ध्यान दें। फुर्ती बहुत जरूरी है।') },
              { icon:'🍎', title: t('Nutrition', 'पोषण'), tip: t('High protein, complex carbs 3 hours before trial. Avoid heavy meals on trial day.', 'ट्रायल से 3 घंटे पहले अच्छा भोजन। भारी भोजन से बचें।') },
            ].map(t => (
              <div key={t.title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '12px', padding: '20px', borderLeft: `4px solid var(--orange)` }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{t.icon}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 8, textTransform: 'uppercase' }}>{t.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{t.tip}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Season 5 phase summary */}
        <div className="season-cta">
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(24px, 4vw, 32px)', color: '#fff', marginBottom: 8, textTransform: 'uppercase' }}>{t("You're in the top bracket.", "आप टॉप ब्रैकेट में हैं।")}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 600 }}>{t("Only players who clear Phase 1 video + Phase 2 KYC reach the physical trial. You're one step from the auction floor.", "केवल वही खिलाड़ी जो फेज 1 वीडियो + फेज 2 KYC पास करते हैं, फिजिकल ट्रायल तक पहुंचते हैं। आप ऑक्शन से एक कदम दूर हैं।")}</div>
          </div>
          <button className="btn-cta season-cta-btn" onClick={() => { setLocation('/#timeline'); }}>
            {t("VIEW SEASON 5 ROADMAP →", "सीजन 5 रोडमैप देखें →")}
          </button>
        </div>
      </div>

      <BCPLFooter />
    </div>
  );
}
