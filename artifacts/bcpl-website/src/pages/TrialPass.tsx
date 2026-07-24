import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { SiteHeader } from '../components/SiteHeader';
import { BCPLFooter } from '../components/BCPLFooter';
import { useLang } from '../lib/i18n';
import { openLoginModal } from '../lib/auth';
import { getTrialPass, type TrialPassData } from '../lib/api';
import { formatRoleCity, formatDateLong, formatTime, formatBatch } from '../lib/format';

/* ── Inline SVG icons (2026 spec — no emoji glyphs) ────────────────────────── */
const ico = (d: React.ReactNode, vb = '0 0 24 24') => (p: { size?: number; style?: React.CSSProperties }) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox={vb} fill="none" stroke="currentColor"
    strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={p.style} aria-hidden="true">{d}</svg>
);
const IcoLock   = ico(<><rect x="4" y="10" width="16" height="10" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>);
const IcoTicket = ico(<><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" /><path d="M13 6v2.5M13 11v2M13 15.5V18" strokeDasharray="0.1 3.4" /></>);
const IcoPin    = ico(<><path d="M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11Z" /><circle cx="12" cy="10" r="2.6" /></>);
const IcoPrint  = ico(<><path d="M6 9V4h12v5" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v6H7z" /></>);
const IcoCheck  = ico(<path d="M4.5 12.5 10 18 19.5 7" />);

const CSS = `
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#060E1C; }
.tp-wrap { width:100%; max-width:720px; margin:0 auto; padding:0 20px; }
.tp-card { width:100%; max-width:100%; background:linear-gradient(135deg,rgba(15,34,71,0.95),rgba(10,22,46,0.9)); border:1px solid rgba(232,178,61,0.35); border-radius:24px; overflow:hidden; box-shadow:0 24px 64px rgba(0,0,0,0.5); }
.tp-head { background:linear-gradient(135deg,#E8B23D,#F5C842); padding:18px 24px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.tp-status { display:flex; align-items:center; justify-content:center; gap:8px; padding:11px 16px; font-family:var(--font-head); font-weight:800; font-size:12.5px; letter-spacing:0.08em; text-transform:uppercase; }
.tp-status.await { background:rgba(232,178,61,0.10); color:#E8B23D; border-bottom:1px solid rgba(232,178,61,0.25); }
.tp-status.in    { background:rgba(34,197,94,0.12);  color:#4ADE80; border-bottom:1px solid rgba(34,197,94,0.3); }
.tp-status.done  { background:rgba(34,197,94,0.16);  color:#4ADE80; border-bottom:1px solid rgba(34,197,94,0.35); }
.tp-qrbox { background:#fff; border-radius:16px; padding:14px; display:inline-block; max-width:100%; }
.tp-qrbox img { width:clamp(140px,42vw,180px); height:clamp(140px,42vw,180px); max-width:100%; display:block; }
.tp-row { display:flex; justify-content:space-between; gap:14px; padding:11px 0; border-bottom:1px dashed rgba(255,255,255,0.1); }
.tp-lbl { font-family:var(--font-body); font-weight:600; font-size:11px; color:rgba(255,255,255,0.45); letter-spacing:0.08em; text-transform:uppercase; }
.tp-val { font-family:var(--font-body); font-weight:700; font-size:14px; color:#fff; text-align:right; }
.tp-print-btn { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#FF6B00,#FF8C40); color:#fff; border:none; border-radius:12px; padding:13px 26px; font-family:var(--font-head); font-weight:800; font-size:13px; letter-spacing:0.06em; cursor:pointer; }
.tp-maps { display:inline-flex; align-items:center; gap:6px; color:#7EC8FF; font-family:var(--font-body); font-weight:600; font-size:12.5px; text-decoration:none; }
/* perforated ticket divider */
.tp-perf { position:relative; height:0; border-top:2px dashed rgba(255,255,255,0.14); margin:0 24px; }
.tp-perf::before, .tp-perf::after { content:''; position:absolute; top:-12px; width:24px; height:24px; border-radius:50%; background:#060E1C; border:1px solid rgba(232,178,61,0.25); }
.tp-perf::before { left:-36px; }
.tp-perf::after  { right:-36px; }
/* journey indicator */
.tp-journey { display:flex; align-items:flex-start; padding:18px 20px 20px; gap:0; }
.tp-jstep { flex:1; display:flex; flex-direction:column; align-items:center; gap:7px; position:relative; min-width:0; }
.tp-jdot { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:#0A1727; border:2px solid rgba(255,255,255,0.14); color:rgba(255,255,255,0.3); position:relative; z-index:1; }
.tp-jdot.done   { background:#22C55E; border-color:#22C55E; color:#fff; }
.tp-jdot.active { border-color:#E8B23D; color:#E8B23D; box-shadow:0 0 0 4px rgba(232,178,61,0.15); }
.tp-jlbl { font-family:var(--font-body); font-weight:700; font-size:9.5px; letter-spacing:0.04em; text-transform:uppercase; color:rgba(255,255,255,0.4); text-align:center; line-height:1.3; }
.tp-jlbl.done { color:#4ADE80; } .tp-jlbl.active { color:#E8B23D; }
.tp-jline { position:absolute; top:12px; left:calc(50% + 15px); right:calc(-50% + 15px); height:2px; background:rgba(255,255,255,0.1); }
.tp-jline.done { background:rgba(34,197,94,0.55); }
@media print {
  body { background:#fff !important; }
  .no-print { display:none !important; }
  .tp-page { padding:0 !important; }
  .tp-card { background:#fff !important; border:2px solid #000 !important; box-shadow:none !important; border-radius:8px !important; }
  .tp-head { background:#fff !important; border-bottom:2px solid #000; }
  .tp-head * { color:#000 !important; }
  .tp-status { border-bottom:1px solid #999 !important; color:#000 !important; background:#fff !important; }
  .tp-lbl { color:#444 !important; }
  .tp-val, .tp-name { color:#000 !important; }
  .tp-row { border-bottom:1px solid #ccc !important; }
  .tp-note { color:#333 !important; }
  .tp-perf { border-top:2px dashed #999 !important; }
  .tp-perf::before, .tp-perf::after { background:#fff !important; border-color:#999 !important; }
  .tp-jdot.done { background:#000 !important; border-color:#000 !important; }
  .tp-jlbl { color:#333 !important; }
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

  /* §20 journey — Pass Issued → Check-In → Physical Trial → Assessment → Result */
  const journey = (d: TrialPassData) => {
    const steps = [
      { en: 'Pass Issued', hi: 'पास जारी', done: true },
      { en: 'Venue Check-In', hi: 'चेक-इन', done: !!d.checkedInAt },
      { en: 'Physical Trial', hi: 'फिजिकल ट्रायल', done: !!d.assessmentSubmitted },
      { en: 'Assessment', hi: 'असेसमेंट', done: !!d.assessmentSubmitted },
      { en: 'Result', hi: 'रिज़ल्ट', done: false },
    ];
    const firstPending = steps.findIndex(s => !s.done);
    return steps.map((s, i) => ({ ...s, state: s.done ? 'done' : i === firstPending ? 'active' : 'waiting' }));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060E1C', fontFamily: 'var(--font-body)' }}>
      <style>{CSS}</style>
      <div className="no-print"><SiteHeader /></div>

      <div className="tp-page" style={{ padding: '110px 0 80px' }}>
        <div className="tp-wrap">

          {state === 'loading' && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '80px 0', font: '600 14px var(--font-body)' }}>
              {t('Loading your trial pass…', 'आपका ट्रायल पास लोड हो रहा है…')}
            </div>
          )}

          {state === 'noauth' && (
            <div className="tp-card" style={{ padding: 40, textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: '50%', background: 'rgba(232,178,61,0.1)', border: '1px solid rgba(232,178,61,0.3)', alignItems: 'center', justifyContent: 'center', color: '#E8B23D', marginBottom: 16 }}>
                <IcoLock size={26} />
              </div>
              <div style={{ font: '800 20px var(--font-head)', color: '#fff', marginBottom: 8 }}>
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
              <div style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: '50%', background: 'rgba(232,178,61,0.1)', border: '1px solid rgba(232,178,61,0.3)', alignItems: 'center', justifyContent: 'center', color: '#E8B23D', marginBottom: 16 }}>
                <IcoTicket size={26} />
              </div>
              <div style={{ font: '800 20px var(--font-head)', color: '#fff', marginBottom: 8 }}>
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
                <span className="tag-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,178,61,0.12)', border: '1px solid rgba(232,178,61,0.35)', borderRadius: 100, padding: '5px 14px', font: '700 11px var(--font-head)', color: '#E8B23D', letterSpacing: '0.1em' }}>
                  OFFICIAL TRIAL PASS
                </span>
              </div>

              <div className="tp-card">
                <div className="tp-head">
                  <div>
                    <div style={{ font: '900 16px var(--font-head)', color: '#0A1020', letterSpacing: '0.04em' }}>BCPL T20</div>
                    <div style={{ font: '700 10.5px var(--font-body)', color: 'rgba(10,16,32,0.65)', letterSpacing: '0.12em' }}>PHYSICAL TRIAL PASS</div>
                  </div>
                  <div style={{ font: '800 13px var(--font-head)', color: '#0A1020', background: 'rgba(255,255,255,0.4)', borderRadius: 8, padding: '6px 12px' }}>
                    {data.player.regNumber ?? '—'}
                  </div>
                </div>

                {/* §19 status line — always states the CURRENT stage explicitly */}
                {data.assessmentSubmitted ? (
                  <div className="tp-status done"><IcoCheck size={15} /> {t('Physical Trial Completed — Assessment Recorded', 'फिजिकल ट्रायल पूरा — असेसमेंट रिकॉर्ड हो गया')}</div>
                ) : data.checkedInAt ? (
                  <div className="tp-status in"><IcoCheck size={15} /> {t('Venue Check-In Complete', 'वेन्यू चेक-इन पूरा')}</div>
                ) : (
                  <div className="tp-status await">{t('Awaiting Venue Check-In', 'वेन्यू चेक-इन बाकी है')}</div>
                )}

                <div style={{ padding: '26px 24px 26px' }}>
                  <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {/* QR */}
                    <div style={{ textAlign: 'center' }}>
                      <div className="tp-qrbox" style={data.assessmentSubmitted ? { opacity: 0.55 } : undefined}>
                        <img src={data.qrDataUrl} alt="Trial pass QR" />
                      </div>
                      <div style={{ font: '600 10.5px var(--font-body)', color: 'rgba(255,255,255,0.4)', marginTop: 8 }} className="tp-note">
                        {data.assessmentSubmitted
                          ? t('Check-in complete — QR no longer needed', 'चेक-इन पूरा — अब QR की ज़रूरत नहीं')
                          : t('Show this QR at the venue gate', 'गेट पर यह QR दिखाएँ')}
                      </div>
                      {data.checkedInAt && !data.assessmentSubmitted && (
                        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ADE80', borderRadius: 100, padding: '4px 12px', font: '700 11px var(--font-body)' }}>
                          <IcoCheck size={12} /> {t('Checked in', 'चेक-इन हो गया')}
                        </div>
                      )}
                    </div>

                    {/* details */}
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div className="tp-name" style={{ font: '900 24px var(--font-head)', color: '#fff', marginBottom: 2 }}>{data.player.name}</div>
                      <div style={{ font: '600 12px var(--font-body)', color: '#E8B23D', marginBottom: 14 }}>
                        {formatRoleCity(data.player.role, data.player.city)}
                      </div>

                      <div className="tp-row"><span className="tp-lbl">{t('Venue', 'वेन्यू')}</span><span className="tp-val">{data.venue?.name ?? '—'}</span></div>
                      {data.venue?.address && (
                        <div className="tp-row"><span className="tp-lbl">{t('Address', 'पता')}</span><span className="tp-val" style={{ fontWeight: 500, fontSize: 12.5 }}>{data.venue.address}</span></div>
                      )}
                      <div className="tp-row"><span className="tp-lbl">{t('Date', 'तारीख़')}</span><span className="tp-val" style={{ color: '#E8B23D' }}>{formatDateLong(data.slot?.date)}</span></div>
                      <div className="tp-row"><span className="tp-lbl">{t('Reporting time', 'रिपोर्टिंग समय')}</span><span className="tp-val" style={{ color: '#4ADE80' }}>{formatTime(data.slot?.reportingTime)}</span></div>
                      <div className="tp-row"><span className="tp-lbl">{t('Trial time', 'ट्रायल समय')}</span><span className="tp-val">{formatTime(data.slot?.startTime)}</span></div>
                      <div className="tp-row" style={{ borderBottom: 'none' }}><span className="tp-lbl">{t('Batch', 'बैच')}</span><span className="tp-val">{formatBatch(data.slot?.batch)}</span></div>

                      {data.venue?.mapsUrl && (
                        <a className="tp-maps no-print" href={data.venue.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 10 }}>
                          <IcoPin size={14} /> {t('Open in Google Maps', 'Google Maps में खोलें')}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* §20 perforation + journey strip */}
                <div className="tp-perf" />
                <div className="tp-journey">
                  {journey(data).map((s, i, arr) => (
                    <div key={s.en} className="tp-jstep">
                      {i < arr.length - 1 && <div className={`tp-jline ${s.state === 'done' ? 'done' : ''}`} />}
                      <div className={`tp-jdot ${s.state}`}>
                        {s.state === 'done' ? <IcoCheck size={13} /> : <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'block' }} />}
                      </div>
                      <div className={`tp-jlbl ${s.state}`}>{t(s.en, s.hi)}</div>
                    </div>
                  ))}
                </div>

                {data.assessmentSubmitted ? (
                  <div className="tp-note" style={{ margin: '0 24px 24px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: '12px 16px', font: '500 12px var(--font-body)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
                    {t(
                      'Your physical trial assessment has been recorded. Results will be announced after trials conclude across all cities — you will be notified by SMS + email. No further action is needed.',
                      'आपका फिजिकल ट्रायल असेसमेंट रिकॉर्ड हो गया है। सभी शहरों के ट्रायल पूरे होने के बाद रिज़ल्ट की घोषणा होगी — आपको SMS + ईमेल से सूचना मिलेगी। अभी आपको कुछ और करने की ज़रूरत नहीं है।'
                    )}
                  </div>
                ) : (
                  <div className="tp-note" style={{ margin: '0 24px 24px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', font: '500 12px var(--font-body)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                    {t(
                      'Carry your original Aadhaar card. Reach 30 minutes before your reporting time. Cricket kit optional — kit is available at the venue.',
                      'अपना original आधार कार्ड साथ लाएँ। Reporting time से 30 मिनट पहले पहुँचें। क्रिकेट किट optional है — venue पर किट उपलब्ध है।'
                    )}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', marginTop: 24 }} className="no-print">
                <button className="tp-print-btn" onClick={() => window.print()}>
                  <IcoPrint size={16} /> {t('PRINT / SAVE PASS', 'पास प्रिंट / सेव करें')}
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
