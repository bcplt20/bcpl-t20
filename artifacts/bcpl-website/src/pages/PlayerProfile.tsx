import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getDashboard, getPlayerTrialVenue, getMyResult, type MyResult } from '../lib/api';
import { getTrialPass, getProfileCompletion, submitProfileBackfill } from '../lib/api';
import { ReferralCard } from '../components/ReferralCard';
import { clearSession, getSession } from '../lib/auth';
import { useLang } from '../lib/i18n';

const BASE = import.meta.env.BASE_URL;

// ── Role display labels ───────────────────────────────────────────────────────
const ROLE_LABEL: Record<string,string> = {
  batsman:'Batsman', bowler:'Bowler', allrounder:'All-Rounder',
  wicketkeeper:'Wicket-Keeper', wicketkeeper_batsman:'WK-Batsman',
};
const ROLE_ICON: Record<string,string> = {
  batsman:'🏏', bowler:'🎯', allrounder:'⚡',
  wicketkeeper:'🧤', wicketkeeper_batsman:'🧤',
};

// ── Derive current step from dashboard data ───────────────────────────────────
type Step =
  | 'not_registered'
  | 'upload_video'
  | 'under_review'
  | 'rejected'
  | 'p2_register'
  | 'p2_kyc'
  | 'p2_kyc_pending'
  | 'trial_wait'
  | 'trial_announced';

function deriveStep(data: any, trialFound: boolean): Step {
  if (!data?.registered) return 'not_registered';
  const reg  = data.registration;
  const p1   = reg?.phase1Status  ?? '';
  const p2   = reg?.phase2Status  ?? null;
  const kyc  = data?.kyc?.status  ?? null;

  if (p1 === 'rejected')                                            return 'rejected';
  if (!data.video?.submitted)                                       return 'upload_video';
  if (p1 !== 'selected')                                            return 'under_review';
  if (!p2)                                                          return 'p2_register';
  if (p2 === 'payment_done' && (!kyc || kyc === 'failed'))          return 'p2_kyc';
  if (p2 === 'payment_done' && kyc === 'pending')                   return 'p2_kyc_pending';
  if ((p2 === 'kyc_done' || kyc === 'verified') && trialFound)      return 'trial_announced';
  if (p2 === 'kyc_done'   || kyc === 'verified')                    return 'trial_wait';
  return 'under_review';
}

// ── Journey nodes ─────────────────────────────────────────────────────────────
function journeyNodes(step: Step) {
  const done    = (l: string) => ({ label: l, state: 'done'    as const });
  const active  = (l: string) => ({ label: l, state: 'active'  as const });
  const waiting = (l: string) => ({ label: l, state: 'waiting' as const });

  type Node = ReturnType<typeof done> | ReturnType<typeof active> | ReturnType<typeof waiting>;
  const map: Record<Step, Node[]> = {
    not_registered:   [active('Register'),        waiting('Video'), waiting('P1 Review'),   waiting('P2+KYC'),    waiting('Trial')],
    upload_video:     [done('Register'),           active('Video'),  waiting('P1 Review'),   waiting('P2+KYC'),    waiting('Trial')],
    under_review:     [done('Register'),           done('Video'),    active('P1 Review'),    waiting('P2+KYC'),    waiting('Trial')],
    rejected:         [done('Register'),           done('Video'),    active('Not Selected'),      waiting('P2+KYC'),    waiting('Trial')],
    p2_register:      [done('Register'),           done('Video'),    done('P1 Selected'),  active('P2+KYC'),     waiting('Trial')],
    p2_kyc:           [done('Register'),           done('Video'),    done('P1 Selected'),  active('P2+KYC'),     waiting('Trial')],
    p2_kyc_pending:   [done('Register'),           done('Video'),    done('P1 Selected'),  active('P2+KYC'),     waiting('Trial')],
    trial_wait:       [done('Register'),           done('Video'),    done('P1 Selected'),  done('P2+KYC'),     active('Trial')],
    trial_announced:  [done('Register'),           done('Video'),    done('P1 Selected'),  done('P2+KYC'),     active('Trial')],
  };
  return map[step];
}

// ── Status banner config ──────────────────────────────────────────────────────
function getBannerConfig(step: Step, data: any, venue: any, t: any) {
  const name = data?.user?.name ?? '';
  const city = data?.registration?.trialCity ?? '';
  const dl   = data?.registration?.videoDeadline
    ? new Date(data.registration.videoDeadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
    : '—';

  const cfgs: Record<Step,{color:string;bg:string;icon:string;title:string;body:string;cta?:string;ctaPath?:string}> = {
    not_registered: {
      color:'var(--orange)', bg:'rgba(255,122,41,0.08)', icon:'📝',
      title: t('Register for BCPL Season 5', 'BCPL सीजन 5 के लिए रजिस्टर करें'),
      body: t('Start your BCPL journey — register as a player and pay the Phase 1 fee to get started.', 'अपना BCPL सफर शुरू करें — एक खिलाड़ी के रूप में रजिस्टर करें और फेज 1 की फीस देकर शुरुआत करें।'),
      cta: t('REGISTER NOW →', 'अभी रजिस्टर करें →'), ctaPath:'/register',
    },
    upload_video: {
      color:'var(--orange)', bg:'rgba(255,122,41,0.08)', icon:'🎬',
      title: t('Upload Your Trial Video', 'अपना ट्रायल वीडियो अपलोड करें'),
      body: t(`Hi ${name}! Your Phase 1 registration is done. Upload your 30–60 second trial video before ${dl} for Phase 1 evaluation.`, `नमस्ते ${name}! आपका फेज 1 रजिस्ट्रेशन हो गया है। Phase 1 evaluation के लिए ${dl} से पहले अपना 30–60 सेकंड का ट्रायल वीडियो अपलोड करें।`),
      cta: t('UPLOAD VIDEO →', 'वीडियो अपलोड करें →'), ctaPath:'/register/upload-video',
    },
    under_review: {
      color:'var(--gold)', bg:'rgba(232,178,61,0.08)', icon:'🔍',
      title: t('Video Under Evaluation', 'वीडियो evaluation में है'),
      body: t('Your Phase 1 submission goes through BCPL\'s evaluation process against the Phase 1 assessment criteria. Your result is typically released within 48 hours. You will receive an SMS + Email with the result.', 'आपका Phase 1 submission BCPL के Phase 1 assessment criteria पर evaluate किया जा रहा है। आपका result आमतौर पर 48 घंटे में release होता है। आपको परिणाम के साथ एक SMS + ईमेल मिलेगा।'),
    },
    rejected: {
      color:'var(--red)', bg:'rgba(239,68,68,0.08)', icon:'❌',
      title: t('Not Selected for Phase 2', 'फेज 2 के लिए नहीं चुना गया'),
      body: t('Unfortunately you were not selected for Phase 2 this season. We encourage you to apply again in Season 6. Thank you for participating in BCPL Season 5.', 'दुर्भाग्य से आपको इस सीज़न में फेज 2 के लिए नहीं चुना गया है। हम आपको सीजन 6 में फिर से आवेदन करने के लिए प्रोत्साहित करते हैं।'),
    },
    p2_register: {
      color:'var(--green)', bg:'rgba(34,197,94,0.08)', icon:'⭐',
      title: t('Congratulations! Selected for Phase 2', 'बधाई हो! फेज 2 के लिए चुने गए'),
      body: t(`${name}, you've cleared Phase 1 evaluation! Complete Phase 2 registration and pay the trial fee to secure your spot at the ${city} physical trial.`, `${name}, आपने फेज 1 evaluation पास कर लिया है! फेज 2 रजिस्ट्रेशन पूरा करें और ${city} फिजिकल ट्रायल में अपनी जगह पक्की करने के लिए ट्रायल फीस का भुगतान करें।`),
      cta: t('COMPLETE PHASE 2 →', 'फेज 2 पूरा करें →'), ctaPath:'/register/phase2',
    },
    p2_kyc: {
      color:'var(--orange)', bg:'rgba(255,122,41,0.08)', icon:'🪪',
      title: t('Complete Your KYC', 'अपना KYC पूरा करें'),
      body: t(`Phase 2 payment done ✓. One last step — complete your KYC (Aadhaar + PAN verification) to confirm your trial slot in ${city}.`, `फेज 2 पेमेंट हो गया ✓। एक आखिरी कदम — ${city} में अपने ट्रायल स्लॉट की पुष्टि के लिए अपना KYC (आधार + PAN वेरिफिकेशन) पूरा करें।`),
      cta: t('COMPLETE KYC →', 'KYC पूरा करें →'), ctaPath:'/register/phase2/kyc',
    },
    p2_kyc_pending: {
      color:'var(--gold)', bg:'rgba(232,178,61,0.08)', icon:'⏳',
      title: t('KYC Under Review', 'KYC रिव्यू में है'),
      body: t('Your KYC documents are being verified. This usually takes a few hours. You will receive an SMS + Email once verified.', 'आपके KYC दस्तावेज़ों को वेरीफाई किया जा रहा है। इसमें आमतौर पर कुछ घंटे लगते हैं। वेरीफाई होने पर आपको एक SMS + ईमेल मिलेगा।'),
    },
    trial_wait: {
      color:'var(--green)', bg:'rgba(34,197,94,0.08)', icon:'🏟️',
      title: t('KYC Verified — Awaiting Trial Schedule', 'KYC वेरीफाइड — ट्रायल शेड्यूल का इंतज़ार है'),
      body: t(`You're fully registered for the ${city} physical trial! Trial venue and date will be announced soon via SMS + Email. Start your preparations!`, `आप ${city} फिजिकल ट्रायल के लिए पूरी तरह रजिस्टर्ड हैं! ट्रायल का स्थान और तारीख जल्द ही SMS + ईमेल के जरिए घोषित की जाएगी। अपनी तैयारी शुरू करें!`),
    },
    trial_announced: {
      color:'var(--gold)', bg:'rgba(232,178,61,0.08)', icon:'📍',
      title: t(`Trial Scheduled — ${venue?.city ?? city}`, `ट्रायल निर्धारित — ${venue?.city ?? city}`),
      body: t(`Your physical trial is confirmed at ${venue?.venue ?? ''}. Report by ${venue?.reportingTime ?? ''} on ${venue?.trialDate ? new Date(venue.trialDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '—'}.`, `आपका फिजिकल ट्रायल ${venue?.venue ?? ''} पर पक्का है। ${venue?.trialDate ? new Date(venue.trialDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '—'} को ${venue?.reportingTime ?? ''} तक रिपोर्ट करें।`),
    },
  };
  return cfgs[step];
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function fmtAmt(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

// ── Task #32 — small modal to collect ONLY the missing profile fields ─────────
// Same required fields + validation as the KYC page (T-shirt + emergency
// contact required, blood group optional). Submits to /api/user/profile-backfill.
const TSHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

function ProfileBackfillModal({ t, onClose, onDone }: {
  t: (en: string, hi: string) => string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [tshirtSize, setTshirtSize] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!tshirtSize) return setErr(t('Please select your T-shirt size.', 'कृपया टी-शर्ट साइज़ चुनें।'));
    if (!emergencyName.trim()) return setErr(t('Emergency contact name is required.', 'इमरजेंसी कॉन्टैक्ट का नाम ज़रूरी है।'));
    if (!/^\d{10}$/.test(emergencyPhone.trim())) return setErr(t('Please enter a valid 10-digit emergency number.', 'कृपया सही 10-अंकों का इमरजेंसी नंबर डालें।'));
    setBusy(true);
    try {
      await submitProfileBackfill({
        tshirtSize,
        emergencyName: emergencyName.trim(),
        emergencyRelation: emergencyRelation.trim() || undefined,
        emergencyPhone: emergencyPhone.trim(),
        bloodGroup: bloodGroup || undefined,
      });
      onDone();
    } catch (e: any) {
      setErr(e?.message ?? t('Something went wrong. Please try again.', 'कुछ गलत हो गया। दोबारा कोशिश करें।'));
    } finally {
      setBusy(false);
    }
  };

  const chip = (val: string, active: boolean, onClick: () => void) => (
    <button key={val} type="button" onClick={onClick}
      style={{ padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13,
        border: `1px solid ${active ? 'var(--orange)' : 'rgba(255,255,255,0.15)'}`,
        background: active ? 'rgba(255,122,41,0.15)' : 'rgba(255,255,255,0.04)',
        color: active ? 'var(--orange)' : 'rgba(255,255,255,0.7)' }}>
      {val}
    </button>
  );
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'var(--ink)', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box' };
  const label = (s: string) => <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '14px 0 6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s}</div>;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--panel, #0A1727)', border: '1px solid var(--line, rgba(255,255,255,0.1))', borderRadius: 'var(--r, 16px)', padding: 24, maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 18, color: 'var(--gold)', marginBottom: 4 }}>
          📋 {t('Complete your details', 'बाकी जानकारी भरें')}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8, lineHeight: 1.5 }}>
          {t('Only the fields below are still needed.', 'सिर्फ़ नीचे दी गई जानकारी बाकी है।')}
        </div>

        {label(t('T-shirt size *', 'टी-शर्ट साइज़ *'))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TSHIRT_SIZES.map(s => chip(s, tshirtSize === s, () => setTshirtSize(tshirtSize === s ? '' : s)))}
        </div>

        {label(t('Emergency contact name *', 'इमरजेंसी कॉन्टैक्ट का नाम *'))}
        <input style={inputStyle} value={emergencyName} onChange={e => setEmergencyName(e.target.value)} maxLength={100} />

        {label(t('Relationship (optional)', 'रिश्ता (वैकल्पिक)'))}
        <input style={inputStyle} value={emergencyRelation} onChange={e => setEmergencyRelation(e.target.value)} maxLength={30} />

        {label(t('Emergency number (10 digits) *', 'इमरजेंसी नंबर (10 अंक) *'))}
        <input style={inputStyle} value={emergencyPhone} inputMode="numeric" onChange={e => setEmergencyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />

        {label(t('Blood group (optional)', 'ब्लड ग्रुप (वैकल्पिक)'))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {BLOOD_GROUPS.map(b => chip(b, bloodGroup === b, () => setBloodGroup(bloodGroup === b ? '' : b)))}
        </div>

        {err && <div style={{ color: 'var(--red, #EF4444)', fontSize: 13, marginTop: 14 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-ghost" onClick={onClose} disabled={busy} style={{ flex: 1 }}>{t('Later', 'बाद में')}</button>
          <button className="btn-orange" onClick={submit} disabled={busy} style={{ flex: 2, padding: '12px 20px', fontSize: 14 }}>
            {busy ? t('Saving…', 'सेव हो रहा है…') : t('Save', 'सेव करें')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PlayerProfile() {
  const [loading,  setLoading]  = useState(true);
  const [data,     setData]     = useState<any>(null);
  const [venue,    setVenue]    = useState<any>(null);
  const [myResult, setMyResult] = useState<MyResult | null>(null);
  const [hasTrialPass, setHasTrialPass] = useState(false);
  const [error,    setError]    = useState('');
  // Task #32 — nudge KYC-done players whose T-shirt/emergency details predate
  // the KYC-page collection. needsBackfill drives the banner; showBackfill the modal.
  const [needsBackfill, setNeedsBackfill] = useState(false);
  const [showBackfill,  setShowBackfill]  = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'journey' | 'card' | 'profile' | 'support'>('home');

  const [, setLocation] = useLocation();
  const { t } = useLang();

  useEffect(() => {
    const session = getSession();
    if (!session) { setLocation('/register'); return; }

    Promise.all([getDashboard(), getPlayerTrialVenue(), getMyResult().catch(() => null)])
      .then(([dash, tv, res]) => {
        setData(dash);
        if (tv.found) setVenue(tv.venue);
        if (res && res.available) setMyResult(res);
      })
      .catch(() => setError(t('Could not load your profile. Please refresh.', 'आपकी प्रोफाइल लोड नहीं हो सकी। कृपया रिफ्रेश करें।')))
      .finally(() => setLoading(false));

    getTrialPass().then(() => setHasTrialPass(true)).catch(() => {});
    getProfileCompletion().then(pc => setNeedsBackfill(!!pc.needsBackfill)).catch(() => {});
  }, [setLocation, t]);

  const step   = data ? deriveStep(data, !!venue) : 'not_registered';
  const nodes  = journeyNodes(step);
  const ban    = data ? getBannerConfig(step, data, venue, t) : null;

  const reg    = data?.registration;
  const user   = data?.user;
  const regId  = reg?.regNumber ?? (reg?.id ? 'REF-' + reg.id.slice(0, 6).toUpperCase() : '—');

  // Payment rows may carry gateway statuses ('success'/'captured') instead of 'paid',
  // and old/manual registrations may lack a payment row entirely while the
  // registration status already proves payment — trust either signal.
  const paidish = (s: unknown) => ['paid', 'success', 'captured'].includes(String(s ?? '').toLowerCase());
  const p1Paid = paidish(data?.phase1Payment?.status) || ['payment_done','video_submitted','selected','rejected'].includes(reg?.phase1Status ?? '');
  const p2Paid = paidish(data?.phase2Payment?.status) || ['payment_done','kyc_done','kyc_approved','trial_cleared','auction_shortlisted','team_signed'].includes(reg?.phase2Status ?? '');

  if (loading) return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'4px solid rgba(255,122,41,0.2)', borderTopColor:'var(--orange)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 20px' }} />
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:15, fontFamily:'var(--font-body)' }}>{t("Loading your profile…", "आपकी प्रोफाइल लोड हो रही है…")}</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ color:'var(--red)', fontSize:16, marginBottom:24, fontFamily:'var(--font-body)' }}>{error}</div>
        <button onClick={() => { clearSession(); setLocation('/'); }}
          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:'var(--r)', color:'var(--red)', fontFamily:'var(--font-head)', fontWeight:800, fontSize:14, letterSpacing:'.06em', padding:'12px 24px', cursor:'pointer', textTransform:'uppercase' }}>
          🚪 {t("Sign Out", "साइन आउट")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-root">
      <style>{`
        .page-root { background: var(--bg); min-height: 100vh; font-family: var(--font-body); color: var(--ink); padding-bottom: 120px; overflow-x: hidden; }
        .W { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
        @media(min-width: 768px){ .W { padding: 0 32px; } }
        
        .btn-orange { background: linear-gradient(135deg, var(--orange), var(--orange-2)); border: none; border-radius: var(--r); color: #fff; font-family: var(--font-head); font-weight: 900; letter-spacing: .06em; cursor: pointer; padding: 16px 32px; font-size: 16px; transition: all .2s; text-transform: uppercase; text-decoration: none; display: inline-block; box-shadow: 0 6px 20px rgba(255,122,41,0.3); }
        .btn-orange:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .btn-ghost { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; color: rgba(255,255,255,0.7); font-family: var(--font-head); font-weight: 800; cursor: pointer; padding: 12px 20px; font-size: 13px; letter-spacing: .06em; transition: all .2s; text-transform: uppercase; }
        .btn-ghost:hover { border-color: var(--orange); color: var(--orange); background: rgba(255,122,41,0.05); }
        
        .grid2 { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media(min-width: 640px){ .grid2 { grid-template-columns: 1fr 1fr; } }
        .main-layout { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media(min-width: 900px){ .main-layout { grid-template-columns: 1.1fr 1.6fr; align-items: start; } }
        
        .card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
        .tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; font-family: var(--font-head); letter-spacing: .08em; text-transform: uppercase; }
        
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGreen { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 50% { box-shadow: 0 0 0 12px rgba(34,197,94,0); } }
        @keyframes pulseOrange { 0%,100% { box-shadow: 0 0 0 0 rgba(255,122,41,0.4); } 50% { box-shadow: 0 0 0 12px rgba(255,122,41,0); } }
        
        .mob-bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000; display: flex; background: rgba(3,7,16,0.95); backdrop-filter: blur(12px); border-top: 1px solid rgba(255,255,255,0.08); padding-bottom: env(safe-area-inset-bottom); }
        @media (min-width: 768px) { .mob-bottom-nav { display: none; } }
        .mob-tab-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 12px 0; background: transparent; border: none; color: rgba(255,255,255,0.4); font-family: var(--font-body); cursor: pointer; transition: color 0.2s; }
        .mob-tab-btn.active { color: var(--orange); }
        .mob-tab-btn .icon { font-size: 22px; }
        .mob-tab-btn .lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
        
        @media (max-width: 767px) {
          .mob-tab-content { display: none; }
          .mob-tab-content.active { display: block; animation: fadeUp 0.3s ease both; }
        }
        @media (min-width: 768px) {
          .mob-tab-content { display: block !important; }
        }
      `}</style>

      <SiteHeader />

      <main style={{ paddingTop: 32 }}>
        <div className="W">
          {/* Task #32 — prominent Hindi-first nudge for KYC-done players whose
              T-shirt size / emergency contact was never collected. */}
          {needsBackfill && (
            <div style={{ background: 'linear-gradient(135deg, rgba(232,178,61,0.14), rgba(255,122,41,0.10))', border: '1px solid rgba(232,178,61,0.45)', borderRadius: 'var(--r)', padding: '18px 20px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', animation: 'fadeUp .5s ease both' }}>
              <div style={{ fontSize: 30, lineHeight: 1 }}>📋</div>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 15, color: 'var(--gold)', marginBottom: 4 }}>
                  {t('A few details are still pending', 'कुछ ज़रूरी जानकारी बाकी है')}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  {t(
                    'Please add your T-shirt size and emergency contact — these are needed for the trial.',
                    'कृपया अपनी टी-शर्ट साइज़ और इमरजेंसी कॉन्टैक्ट जानकारी भरें — ट्रायल के लिए यह ज़रूरी है।',
                  )}
                </div>
              </div>
              <button className="btn-orange" style={{ padding: '12px 22px', fontSize: 13 }} onClick={() => setShowBackfill(true)}>
                {t('Add now →', 'अभी भरें →')}
              </button>
            </div>
          )}
          {showBackfill && (
            <ProfileBackfillModal
              t={t}
              onClose={() => setShowBackfill(false)}
              onDone={() => { setShowBackfill(false); setNeedsBackfill(false); }}
            />
          )}
          <div className="main-layout">
            
            {/* LEFT COLUMN: Profile & Support (combined on mobile via tabs) */}
            <div className={`mob-tab-content ${activeTab === 'home' || activeTab === 'card' || activeTab === 'profile' || activeTab === 'support' ? 'active' : ''}`}>
              
              <div className={`mob-tab-content ${activeTab === 'card' || activeTab === 'home' ? 'active' : ''}`}>
                {/* ── HERO CARD ── */}
                <div className="card" style={{ background: 'linear-gradient(135deg, #0A1727, #060D18)', borderTop: '4px solid var(--orange)', marginBottom: 24, animation: 'fadeUp .5s ease both' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 32, color: '#fff', flexShrink: 0, animation: step === 'trial_wait' || step === 'trial_announced' ? 'pulseGreen 2s ease infinite' : step === 'p2_register' ? 'pulseOrange 2s ease infinite' : 'none' }}>
                      {user?.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(24px, 4vw, 32px)', color: '#fff', textTransform: 'uppercase', lineHeight: 1.1 }}>
                          {user?.name ?? '—'}
                        </div>
                      </div>
                      
                      {reg && (
                        <div className="tag" style={{ background: step === 'rejected' ? 'rgba(239,68,68,0.1)' : step === 'trial_wait' || step === 'trial_announced' ? 'rgba(34,197,94,0.1)' : 'rgba(255,122,41,0.1)', borderColor: step === 'rejected' ? 'rgba(239,68,68,0.4)' : step === 'trial_wait' || step === 'trial_announced' ? 'rgba(34,197,94,0.4)' : 'rgba(255,122,41,0.4)', color: step === 'rejected' ? 'var(--red)' : step === 'trial_wait' || step === 'trial_announced' ? 'var(--green)' : 'var(--orange)', marginBottom: 16 }}>
                          {step === 'rejected' ? t('✕ Not Selected', '✕ नहीं चुना गया')
                            : step === 'trial_wait' || step === 'trial_announced' ? t('✓ KYC Verified', '✓ KYC वेरीफाइड')
                            : step === 'under_review' ? t('🔍 Under Review', '🔍 रिव्यू में है')
                            : step === 'p2_register' ? t('⭐ Phase 2 Selected', '⭐ फेज 2 के लिए चयनित')
                            : step === 'upload_video' ? t('📹 Video Pending', '📹 वीडियो पेंडिंग')
                            : step === 'p2_kyc' || step === 'p2_kyc_pending' ? t('🪪 KYC Pending', '🪪 KYC पेंडिंग')
                            : t('Registered', 'रजिस्टर्ड')}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                        {reg && <>
                          <span>{ROLE_ICON[reg.role] ?? '🏏'} {t(ROLE_LABEL[reg.role] ?? reg.role, ROLE_LABEL[reg.role] ?? reg.role)}</span>
                          <span>📍 {reg.trialCity}</span>
                          <span>🆔 {regId}</span>
                        </>}
                        {!reg && <span style={{ color: 'var(--orange)' }}>{t("Not yet registered", "अभी तक रजिस्टर्ड नहीं")}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
                    <button className="btn-ghost" style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)', background: 'transparent' }} onClick={() => { clearSession(); setLocation('/'); }}>
                      🚪 {t("Sign Out", "साइन आउट")}
                    </button>
                    {hasTrialPass && (
                      <Link href="/trial-pass" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        🎫 {t("Trial Pass", "ट्रायल पास")}
                      </Link>
                    )}
                    {reg && (
                      <button className="btn-ghost" onClick={() => {
                        const logoUrl = `${window.location.origin}${BASE}bcpl-assets/bcpl-logo-white.png`;
                        const initials = user?.name?.charAt(0).toUpperCase() ?? '?';
                        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BCPL Player ID — ${user?.name}</title><style>body{margin:0;background:#030E1C;display:flex;justify-content:center;padding:32px;font-family:'Segoe UI',sans-serif}.card{width:340px;background:linear-gradient(145deg,#0D1F3C,#06101E);border:1.5px solid rgba(255,122,41,0.45);border-radius:18px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6)}.stripe{height:4px;background:linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)}.head{background:linear-gradient(135deg,#FF7A29,#C94E0E);padding:14px 20px}.head-title{font-size:10px;font-weight:800;color:rgba(255,255,255,0.9);letter-spacing:.18em}.head-sub{font-size:8px;color:rgba(255,255,255,0.65);margin-top:3px;letter-spacing:.1em}.body{padding:20px 22px 16px}.avatar{width:60px;height:60px;background:linear-gradient(135deg,#FF7A29,#C94E0E);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;margin-bottom:12px;box-shadow:0 4px 20px rgba(255,122,41,0.4)}.name{font-size:20px;font-weight:900;color:#fff;margin-bottom:3px}.role{font-size:11px;font-weight:800;color:#FF7A29;letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px}hr{border:none;border-top:1px solid rgba(255,255,255,0.08);margin:12px 0}.row{display:flex;justify-content:space-between;margin-bottom:9px}.label{font-size:9px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:.08em}.val{font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);text-align:right}.ref{font-family:monospace;color:#FF7A29;font-size:11px;font-weight:700}.foot{background:rgba(255,122,41,0.07);border-top:1px solid rgba(255,122,41,0.18);padding:12px 22px;display:flex;justify-content:space-between;align-items:center}.kyc{background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.4);border-radius:6px;padding:4px 11px;font-size:9px;font-weight:800;color:#22C55E;letter-spacing:.08em}.site{font-size:9px;color:rgba(255,255,255,0.25);font-weight:600}@media print{body{padding:0;background:#fff}.card{box-shadow:none}}</style></head><body><div class="card"><div class="stripe"></div><div class="head"><div class="head-title">BHARTIYA CORPORATE PREMIER LEAGUE</div><div class="head-sub">OFFICIAL PLAYER ID CARD · SEASON 5</div></div><div class="body"><div class="avatar">${initials}</div><div class="name">${user?.name}</div><div class="role">🏏 ${reg.role} · ${reg.trialCity}</div><hr/><div class="row"><span class="label">Email</span><span class="val">${user?.email || '—'}</span></div><div class="row"><span class="label">Phone</span><span class="val">${user?.phone || '—'}</span></div><hr/><div class="row"><span class="label">Registration No.</span><span class="ref">${regId}</span></div><div class="row"><span class="label">KYC Status</span><span class="val" style="color:#22C55E">✅ Verified</span></div></div><div class="foot"><span class="site">bcplt20.com · BCPL Season 5</span><span class="kyc">ID CARD</span></div></div><script>window.onload=function(){window.print();}<\/script></body></html>`;
                        const win = window.open('', '_blank');
                        if(win){ win.document.write(html); win.document.close(); }
                      }}>
                        📄 {t("ID Card", "ID कार्ड")}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={`mob-tab-content ${activeTab === 'profile' ? 'active' : ''}`}>
                {!reg && (
                  <div className="card" style={{ marginBottom: 24, animation: 'fadeUp .5s .1s ease both' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '.12em', marginBottom: 20, textTransform: 'uppercase' }}>{t("MY ACCOUNT", "मेरा अकाउंट")}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                      {[
                        { label: t('Name', 'नाम'), value: user?.name || '—' },
                        { label: t('Phone', 'फोन'), value: user?.phone || '—' },
                        { label: t('Email', 'ईमेल'), value: user?.email || '—' },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.06em', flexShrink: 0, alignSelf: 'center' }}>{row.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', wordBreak: 'break-all', textAlign: 'right' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,122,41,0.06)', border: '1px solid rgba(255,122,41,0.25)', borderRadius: 12, fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 16 }}>
                      {t("You haven't registered for Season 5 yet. Register now to start your BCPL journey.", "आपने अभी तक सीजन 5 के लिए रजिस्टर नहीं किया है। अपना BCPL सफर शुरू करने के लिए अभी रजिस्टर करें।")}
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button className="btn-orange" style={{ padding: '12px 24px', fontSize: 14 }} onClick={() => setLocation('/register')}>
                        {t("REGISTER NOW →", "अभी रजिस्टर करें →")}
                      </button>
                      <button className="btn-ghost" style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => { clearSession(); setLocation('/'); }}>
                        🚪 {t("Sign Out", "साइन आउट")}
                      </button>
                    </div>
                  </div>
                )}
                {/* ── REGISTRATION SUMMARY ── */}
                {reg && (
                  <div className="card" style={{ marginBottom: 24, animation: 'fadeUp .5s .1s ease both' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '.12em', marginBottom: 20, textTransform: 'uppercase' }}>{t("REGISTRATION SUMMARY", "रजिस्ट्रेशन सारांश")}</div>
                    
                    <div className="grid2">
                      {/* Phase 1 Payment */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', border: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t("Phase 1 Payment", "फेज 1 पेमेंट")}</div>
                          <div className="tag" style={{ background: p1Paid ? 'rgba(34,197,94,0.1)' : 'rgba(232,178,61,0.1)', borderColor: p1Paid ? 'rgba(34,197,94,0.3)' : 'rgba(232,178,61,0.3)', color: p1Paid ? 'var(--green)' : 'var(--gold)', padding: '4px 10px', fontSize: 10 }}>
                            {p1Paid ? t('✓ Paid', '✓ पेड') : t('Pending', 'पेंडिंग')}
                          </div>
                        </div>
                        {data.phase1Payment && <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-head)' }}>{fmtAmt(data.phase1Payment.amount)}</div>}
                        {data.phase1Payment?.paidAt && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{fmtDate(data.phase1Payment.paidAt)}</div>}
                      </div>

                      {/* Trial Video */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', border: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t("Trial Video", "ट्रायल वीडियो")}</div>
                          <div className="tag" style={{ background: data.video?.submitted ? (reg.phase1Status === 'selected' ? 'rgba(34,197,94,0.1)' : 'rgba(232,178,61,0.1)') : 'rgba(255,122,41,0.1)', borderColor: data.video?.submitted ? (reg.phase1Status === 'selected' ? 'rgba(34,197,94,0.3)' : 'rgba(232,178,61,0.3)') : 'rgba(255,122,41,0.3)', color: data.video?.submitted ? (reg.phase1Status === 'selected' ? 'var(--green)' : 'var(--gold)') : 'var(--orange)', padding: '4px 10px', fontSize: 10 }}>
                            {data.video?.submitted
                              ? (reg.phase1Status === 'selected' ? t('✓ Selected', '✓ चयनित') : reg.phase1Status === 'rejected' ? t('✕ Not Selected', '✕ नहीं चुना गया') : t('🔍 Under Review', '🔍 रिव्यू में'))
                              : t('Not Uploaded', 'अपलोड नहीं हुआ')}
                          </div>
                        </div>
                        {data.video?.submittedAt && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{t("Submitted", "सबमिट किया")} {fmtDate(data.video.submittedAt)}</div>}
                        {!data.video?.submitted && (
                          <button onClick={() => { setLocation('/register/upload-video'); }}
                            style={{ marginTop: 8, padding: '8px 16px', fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-head)', background: 'rgba(255,122,41,0.1)', border: '1px solid rgba(255,122,41,0.4)', color: 'var(--orange)', borderRadius: '8px', cursor: 'pointer', textTransform: 'uppercase' }}>
                            {t("UPLOAD NOW →", "अभी अपलोड करें →")}
                          </button>
                        )}
                      </div>

                      {/* Phase 2 Payment */}
                      {(reg.phase1Status === 'selected' || data.phase2Payment || p2Paid) && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', border: '1px solid var(--line)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t("Phase 2 Payment", "फेज 2 पेमेंट")}</div>
                            <div className="tag" style={{ background: p2Paid ? 'rgba(34,197,94,0.1)' : 'rgba(255,122,41,0.1)', borderColor: p2Paid ? 'rgba(34,197,94,0.3)' : 'rgba(255,122,41,0.3)', color: p2Paid ? 'var(--green)' : 'var(--orange)', padding: '4px 10px', fontSize: 10 }}>
                              {p2Paid ? t('✓ Paid', '✓ पेड') : t('Pending', 'पेंडिंग')}
                            </div>
                          </div>
                          {data.phase2Payment && <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-head)' }}>{fmtAmt(data.phase2Payment.amount)}</div>}
                          {data.phase2Payment?.paidAt && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{fmtDate(data.phase2Payment.paidAt)}</div>}
                          {!data.phase2Payment && !p2Paid && (
                            <button onClick={() => { setLocation('/register/phase2'); }}
                              style={{ marginTop: 8, padding: '8px 16px', fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-head)', background: 'rgba(255,122,41,0.1)', border: '1px solid rgba(255,122,41,0.4)', color: 'var(--orange)', borderRadius: '8px', cursor: 'pointer', textTransform: 'uppercase' }}>
                              {t("PAY NOW →", "अभी पेमेंट करें →")}
                            </button>
                          )}
                        </div>
                      )}

                      {/* KYC */}
                      {(reg.phase2Status || data.kyc) && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', border: '1px solid var(--line)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t("KYC Verification", "KYC वेरिफिकेशन")}</div>
                            <div className="tag" style={{ background: data.kyc?.status === 'verified' ? 'rgba(34,197,94,0.1)' : data.kyc?.status === 'pending' ? 'rgba(232,178,61,0.1)' : 'rgba(255,122,41,0.1)', borderColor: data.kyc?.status === 'verified' ? 'rgba(34,197,94,0.3)' : data.kyc?.status === 'pending' ? 'rgba(232,178,61,0.3)' : 'rgba(255,122,41,0.3)', color: data.kyc?.status === 'verified' ? 'var(--green)' : data.kyc?.status === 'pending' ? 'var(--gold)' : 'var(--orange)', padding: '4px 10px', fontSize: 10 }}>
                              {data.kyc?.status === 'verified' ? t('✓ Verified', '✓ वेरीफाइड') : data.kyc?.status === 'pending' ? t('⏳ In Review', '⏳ रिव्यू में') : t('Pending', 'पेंडिंग')}
                            </div>
                          </div>
                          {data.kyc?.submittedAt && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{t("Submitted", "सबमिट किया")} {fmtDate(data.kyc.submittedAt)}</div>}
                          {(!data.kyc || data.kyc.status === 'failed') && (
                            <button onClick={() => { setLocation('/register/phase2/kyc'); }}
                              style={{ marginTop: 8, padding: '8px 16px', fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-head)', background: 'rgba(255,122,41,0.1)', border: '1px solid rgba(255,122,41,0.4)', color: 'var(--orange)', borderRadius: '8px', cursor: 'pointer', textTransform: 'uppercase' }}>
                              {t("COMPLETE KYC →", "KYC पूरा करें →")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={`mob-tab-content ${activeTab === 'support' ? 'active' : ''}`}>
                <ReferralCard />
              </div>
            </div>

            {/* RIGHT COLUMN: Journey, Banner, Result (combined on mobile via tabs) */}
            <div className={`mob-tab-content ${activeTab === 'home' || activeTab === 'journey' ? 'active' : ''}`}>
              
              <div className={`mob-tab-content ${activeTab === 'home' ? 'active' : ''}`}>
                {/* ── STATUS BANNER ── */}
                {ban && (
                  <div className="card" style={{ background: ban.bg, border: `1px solid ${ban.color}40`, animation: 'fadeUp .5s .15s ease both', marginBottom: 24, padding: '32px 24px' }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 48, lineHeight: 1 }}>{ban.icon}</div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(20px, 3vw, 28px)', color: ban.color, marginBottom: 12, textTransform: 'uppercase', lineHeight: 1.1 }}>{ban.title}</div>
                        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: ban.cta ? 24 : 0 }}>{ban.body}</div>
                        {ban.cta && ban.ctaPath && (
                          <button className="btn-orange" onClick={() => { setLocation(ban.ctaPath!); }}>
                            {ban.cta}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ── PHASE 1 RESULT READY ── */}
                {myResult?.available && (
                  <div className="card" style={{ background: 'linear-gradient(120deg, rgba(232,178,61,0.1), rgba(255,122,41,0.05))', border: '1px solid rgba(232,178,61,0.4)', marginBottom: 24, animation: 'fadeUp .5s .2s ease both', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', padding: '24px 32px' }}>
                    <div style={{ fontSize: 40 }}>🏆</div>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20, color: 'var(--gold)', marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                        {t("YOUR PHASE 1 RESULT IS READY", "आपका फेज 1 परिणाम तैयार है")}
                      </div>
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                        {t("Your full 100-point scorecard from BCPL's Phase 1 evaluation is waiting.", "BCPL के Phase 1 evaluation से आपका पूरा 100-पॉइंट स्कोरकार्ड तैयार है।")}
                      </div>
                    </div>
                    <button className="btn-orange" style={{ background: 'linear-gradient(135deg, var(--gold), #C4901E)', color: '#000', boxShadow: '0 6px 20px rgba(232,178,61,0.3)' }}
                      onClick={() => { setLocation('/register/result'); }}>
                      {t("VIEW MY RESULT →", "मेरा परिणाम देखें →")}
                    </button>
                  </div>
                )}
              </div>

              <div className={`mob-tab-content ${activeTab === 'journey' ? 'active' : ''}`}>
                {/* ── JOURNEY TIMELINE ── */}
                <div className="card" style={{ animation: 'fadeUp .5s .25s ease both', marginBottom: 24 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '.12em', marginBottom: 24, textTransform: 'uppercase' }}>{t("YOUR JOURNEY", "आपका सफर")}</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
                    {/* Vertical line connecting nodes */}
                    <div style={{ position: 'absolute', left: 19, top: 20, bottom: 20, width: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2, zIndex: 0 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', borderRadius: 2, background: 'linear-gradient(180deg, var(--green), var(--orange))',
                        height: `${(['not_registered','upload_video','under_review','rejected'].includes(step) ? 0 : step === 'p2_register' || step === 'p2_kyc' || step === 'p2_kyc_pending' ? 50 : 85)}%`,
                        transition: 'height .6s ease',
                      }} />
                    </div>

                    {nodes.map((n, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                          background: n.state === 'done' ? 'var(--green)' : n.state === 'active' ? 'var(--bg)' : 'var(--bg)',
                          border: n.state === 'done' ? '2px solid var(--green)' : n.state === 'active' ? '3px solid var(--orange)' : '2px solid rgba(255,255,255,0.1)',
                          color: n.state === 'done' ? '#fff' : n.state === 'active' ? 'var(--orange)' : 'rgba(255,255,255,0.3)',
                          boxShadow: n.state === 'active' ? '0 0 0 4px rgba(255,122,41,0.15)' : 'none'
                        }}>
                          {n.state === 'done' ? '✓' : n.state === 'active' ? '●' : '○'}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: n.state === 'active' ? 800 : 700, fontFamily: 'var(--font-head)', color: n.state === 'done' ? 'var(--green)' : n.state === 'active' ? '#fff' : 'rgba(255,255,255,0.4)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
                          {t(n.label, n.label)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── TRIAL VENUE (if announced) ── */}
                {venue && (
                  <div className="card" style={{ background: 'rgba(232,178,61,0.06)', border: '1px solid rgba(232,178,61,0.3)', animation: 'fadeUp .5s .3s ease both' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 13, color: 'var(--gold)', letterSpacing: '.12em', marginBottom: 20, textTransform: 'uppercase' }}>📍 {t("YOUR TRIAL VENUE", "आपका ट्रायल स्थान")}</div>
                    <div className="grid2">
                      {[
                        { label: t('Venue', 'स्थान'), value: venue.venue },
                        { label: t('City', 'शहर'),  value: venue.city  },
                        { label: t('Date', 'तारीख'),  value: new Date(venue.trialDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) },
                        { label: t('Time', 'समय'),  value: venue.trialTime },
                        { label: t('Reporting By', 'रिपोर्टिंग समय'), value: venue.reportingTime },
                        { label: t('Available Slots', 'उपलब्ध स्लॉट'), value: String(venue.slots) },
                      ].map(row => (
                        <div key={row.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'rgba(255,255,255,0.4)', letterSpacing: '.08em', marginBottom: 6, textTransform: 'uppercase' }}>{row.label}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{row.value}</div>
                        </div>
                      ))}
                    </div>
                    {venue.notes && (
                      <div style={{ marginTop: 20, padding: '16px', background: 'rgba(232,178,61,0.08)', border: '1px solid rgba(232,178,61,0.2)', borderRadius: '12px', fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                        📋 {venue.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="mob-bottom-nav">
        {[
          { id: 'home', icon: '🏠', label: t('Home', 'होम') },
          { id: 'journey', icon: '📍', label: t('Journey', 'सफर') },
          { id: 'card', icon: '🪪', label: t('Card', 'कार्ड') },
          { id: 'profile', icon: '👤', label: t('Profile', 'प्रोफाइल') },
          { id: 'support', icon: '🎧', label: t('Support', 'सपोर्ट') },
        ].map(tb => (
          <button key={tb.id} className={`mob-tab-btn ${activeTab === tb.id ? 'active' : ''}`} onClick={() => setActiveTab(tb.id as any)}>
            <span className="icon">{tb.icon}</span>
            <span className="lbl">{tb.label}</span>
          </button>
        ))}
      </div>

      <BCPLFooter />
    </div>
  );
}
