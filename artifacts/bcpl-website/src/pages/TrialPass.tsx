import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { SiteHeader } from '../components/SiteHeader';
import { BCPLFooter } from '../components/BCPLFooter';
import { useLang } from '../lib/i18n';
import { openLoginModal } from '../lib/auth';
import { getTrialPass, type TrialPassData } from '../lib/api';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#060E1C; }
.tp-wrap { max-width:720px; margin:0 auto; padding:0 20px; }
.tp-card { background:linear-gradient(135deg,rgba(15,34,71,0.95),rgba(10,22,46,0.9)); border:1px solid rgba(232,178,61,0.35); border-radius:24px; overflow:hidden; box-shadow:0 24px 64px rgba(0,0,0,0.5); }
.tp-head { background:linear-gradient(135deg,#E8B23D,#F5C842); padding:18px 24px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.tp-qrbox { background:#fff; border-radius:16px; padding:14px; display:inline-block; }
.tp-row { display:flex; justify-content:space-between; gap:14px; padding:11px 0; border-bottom:1px dashed rgba(255,255,255,0.1); }
.tp-lbl { font:600 11px Inter,sans-serif; color:rgba(255,255,255,0.45); letter-spacing:0.08em; text-transform:uppercase; }
.tp-val { font:700 14px Inter,sans-serif; color:#fff; text-align:right; }
.tp-print-btn { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#FF6B00,#FF8C40); color:#fff; border:none; border-radius:12px; padding:13px 26px; font:800 13px Montserrat,sans-serif; letter-spacing:0.06em; cursor:pointer; }
.tp-maps { display:inline-flex; align-items:center; gap:6px; color:#7EC8FF; font:600 12.5px Inter,sans-serif; text-decoration:none; }
@media print {
  body { background:#fff !important; }
  .no-print { display:none !important; }
  .tp-page { padding:0 !important; }
  .tp-card { background:#fff !important; border:2px solid #000 !important; box-shadow:none !important; border-radius:8px !important; }
  .tp-head { background:#fff !important; border-bottom:2px solid #000; }
  .tp-head * { color:#000 !important; }
  .tp-lbl { color:#444 !important; }
  .tp-val, .tp-name { color:#000 !important; }
  .tp-row { border-bottom:1px solid #ccc !important; }
  .tp-note { color:#333 !important; }
}
`;

export function TrialPass() {
  const { t } = useLang();
  const [data, setData] = useState<TrialPassData | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'noauth' | 'nopass'>('loading');

  useEffect(() => {
    window.scrollTo(0, 0);
    getTrialPass()
      .then((d) => { setData(d); setState('ready'); })
      .catch((e: Error & { status?: number }) => {
        if (e.status === 401) setState('noauth');
        else setState('nopass');
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#060E1C', fontFamily: 'Inter,sans-serif' }}>
      <style>{CSS}</style>
      <div className="no-print"><SiteHeader /></div>

      <div className="tp-page" style={{ padding: '110px 0 80px' }}>
        <div className="tp-wrap">

          {state === 'loading' && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '80px 0', font: '600 14px Inter,sans-serif' }}>
              {t('Loading your trial pass…', 'आपका ट्रायल पास लोड हो रहा है…')}
            </div>
          )}

          {state === 'noauth' && (
            <div className="tp-card" style={{ padding: 40, textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🔒</div>
              <div style={{ font: '800 20px Montserrat,sans-serif', color: '#fff', marginBottom: 8 }}>
                {t('Login required', 'लॉगिन ज़रूरी है')}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 22 }}>
                {t('Please log in to view your Trial Pass.', 'अपना ट्रायल पास देखने के लिए लॉगिन करें।')}
              </p>
              <button className="tp-print-btn" onClick={() => openLoginModal()}>
                {t('LOGIN', 'लॉगिन करें')} →
              </button>
            </div>
          )}

          {state === 'nopass' && (
            <div className="tp-card" style={{ padding: 40, textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🎫</div>
              <div style={{ font: '800 20px Montserrat,sans-serif', color: '#fff', marginBottom: 8 }}>
                {t('Trial pass not ready yet', 'ट्रायल पास अभी तैयार नहीं है')}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, marginBottom: 22 }}>
                {t(
                  'Your trial slot has not been allocated yet. Complete Phase 2 (payment + KYC) if pending — slot details will appear here once allocated, and we will notify you.',
                  'आपका ट्रायल स्लॉट अभी allocate नहीं हुआ है। अगर Phase 2 (payment + KYC) बाकी है तो पहले पूरा करें — slot मिलते ही यहाँ details दिखेंगी और आपको सूचना भी भेजी जाएगी।'
                )}
              </p>
              <Link href="/profile" className="tp-maps" style={{ justifyContent: 'center' }}>
                ← {t('Back to my profile', 'मेरी प्रोफाइल पर जाएँ')}
              </Link>
            </div>
          )}

          {state === 'ready' && data && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 26 }} className="no-print">
                <span className="tag-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,178,61,0.12)', border: '1px solid rgba(232,178,61,0.35)', borderRadius: 100, padding: '5px 14px', font: '700 11px Montserrat,sans-serif', color: '#E8B23D', letterSpacing: '0.1em' }}>
                  OFFICIAL TRIAL PASS
                </span>
              </div>

              <div className="tp-card">
                <div className="tp-head">
                  <div>
                    <div style={{ font: '900 16px Montserrat,sans-serif', color: '#0A1020', letterSpacing: '0.04em' }}>BCPL T20</div>
                    <div style={{ font: '700 10.5px Inter,sans-serif', color: 'rgba(10,16,32,0.65)', letterSpacing: '0.12em' }}>PHYSICAL TRIAL PASS</div>
                  </div>
                  <div style={{ font: '800 13px Montserrat,sans-serif', color: '#0A1020', background: 'rgba(255,255,255,0.4)', borderRadius: 8, padding: '6px 12px' }}>
                    {data.player.regNumber ?? '—'}
                  </div>
                </div>

                <div style={{ padding: '26px 24px 30px' }}>
                  <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {/* QR */}
                    <div style={{ textAlign: 'center' }}>
                      <div className="tp-qrbox">
                        <img src={data.qrDataUrl} alt="Trial pass QR" style={{ width: 180, height: 180, display: 'block' }} />
                      </div>
                      <div style={{ font: '600 10.5px Inter,sans-serif', color: 'rgba(255,255,255,0.4)', marginTop: 8 }} className="tp-note">
                        {t('Show this QR at the venue gate', 'गेट पर यह QR दिखाएँ')}
                      </div>
                      {data.checkedInAt && (
                        <div style={{ marginTop: 8, display: 'inline-block', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ADE80', borderRadius: 100, padding: '4px 12px', font: '700 11px Inter,sans-serif' }}>
                          ✓ {t('Checked in', 'चेक-इन हो गया')}
                        </div>
                      )}
                    </div>

                    {/* details */}
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div className="tp-name" style={{ font: '900 24px Montserrat,sans-serif', color: '#fff', marginBottom: 2 }}>{data.player.name}</div>
                      <div style={{ font: '600 12px Inter,sans-serif', color: '#E8B23D', marginBottom: 14 }}>{data.player.role} · {data.player.city ?? ''}</div>

                      <div className="tp-row"><span className="tp-lbl">{t('Venue', 'वेन्यू')}</span><span className="tp-val">{data.venue?.name ?? '—'}</span></div>
                      {data.venue?.address && (
                        <div className="tp-row"><span className="tp-lbl">{t('Address', 'पता')}</span><span className="tp-val" style={{ fontWeight: 500, fontSize: 12.5 }}>{data.venue.address}</span></div>
                      )}
                      <div className="tp-row"><span className="tp-lbl">{t('Date', 'तारीख़')}</span><span className="tp-val" style={{ color: '#E8B23D' }}>{data.slot?.date ?? '—'}</span></div>
                      <div className="tp-row"><span className="tp-lbl">{t('Reporting time', 'रिपोर्टिंग समय')}</span><span className="tp-val" style={{ color: '#4ADE80' }}>{data.slot?.reportingTime ?? '—'}</span></div>
                      <div className="tp-row"><span className="tp-lbl">{t('Trial time', 'ट्रायल समय')}</span><span className="tp-val">{data.slot?.startTime ?? '—'}</span></div>
                      <div className="tp-row" style={{ borderBottom: 'none' }}><span className="tp-lbl">{t('Batch', 'बैच')}</span><span className="tp-val">{data.slot?.batch ?? '—'}</span></div>

                      {data.venue?.mapsUrl && (
                        <a className="tp-maps no-print" href={data.venue.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 10 }}>
                          📍 {t('Open in Google Maps', 'Google Maps में खोलें')}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="tp-note" style={{ marginTop: 22, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', font: '500 12px Inter,sans-serif', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                    {t(
                      'Carry your original Aadhaar card. Reach 30 minutes before your reporting time. Cricket kit optional — kit is available at the venue.',
                      'अपना original आधार कार्ड साथ लाएँ। Reporting time से 30 मिनट पहले पहुँचें। क्रिकेट किट optional है — venue पर किट उपलब्ध है।'
                    )}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 24 }} className="no-print">
                <button className="tp-print-btn" onClick={() => window.print()}>
                  🖨 {t('PRINT / SAVE PASS', 'पास प्रिंट / सेव करें')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="no-print"><BCPLFooter /></div>
    </div>
  );
}
