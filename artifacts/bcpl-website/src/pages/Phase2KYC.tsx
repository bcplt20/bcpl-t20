import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getRegistrationStatus, initiateKyc, verifyKycOtp, getKycProgress, kycAadhaarOtp, kycVerifyPan } from '../lib/api';
import { useLang } from '../lib/i18n';
import { IcoUsers, IcoCard, IcoUser, IcoTarget, IcoShield, IcoStar, IcoMedal, IcoRoute, IcoBook, IcoScale, IcoBat, IcoCheck, IcoLock, IcoIdCard, IcoList, IcoHourglass, IcoPhone, IcoWarn } from '../lib/icons';

// Must match backend enum exactly
const PROFESSIONS = [
  { id:'Business Owner',                              icon: IcoUsers, label:'Business Owner' },
  { id:'Salaried Employee',                           icon: IcoCard,  label:'Salaried Employee' },
  { id:'Doctor',                                      icon: IcoUser,  label:'Doctor' },
  { id:'Engineer',                                    icon: IcoTarget, label:'Engineer' },
  { id:'Government Officer',                          icon: IcoShield, label:'Govt. Officer' },
  { id:'IAS / IPS / IFS',                             icon: IcoStar,  label:'IAS / IPS / IFS' },
  { id:'Army / Navy / Air Force',                     icon: IcoMedal, label:'Army / Defence' },
  { id:'Railway Employee',                            icon: IcoRoute, label:'Railway Employee' },
  { id:'Teacher / Professor',                         icon: IcoBook,  label:'Teacher / Prof' },
  { id:'Lawyer',                                      icon: IcoScale, label:'Lawyer' },
  { id:'Farmer / Agriculture',                        icon: IcoUser,  label:'Farmer' },
  { id:'Delivery / Logistics (Zomato, Swiggy etc.)',  icon: IcoRoute, label:'Delivery Boy' },
  { id:'Student / Intern',                            icon: IcoBook,  label:'Student / Intern' },
  { id:'Freelancer / Self-Employed',                  icon: IcoUser,  label:'Freelancer' },
  { id:'Other',                                       icon: IcoStar,  label:'Other' },
];

const TSHIRT_OPTS     = ['S','M','L','XL','XXL'];
const RELATION_OPTS   = ['Father','Mother','Spouse','Friend','Other'];
const BLOOD_OPTS      = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

type LoadState = 'loading' | 'ok' | 'not_eligible' | 'already_done' | 'error';

function validateAadhaar(v: string) { return /^\d{12}$/.test(v.replace(/\s/g, '')); }
function validatePan(v: string)     { return /^[A-Z]{5}\d{4}[A-Z]$/.test(v.toUpperCase()); }

function ChipRow({ options, value, onChange, minWidth }: { options: string[]; value: string; onChange: (v: string) => void; minWidth?: number }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:8 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(value === o ? '' : o)}
          style={{ padding:'12px 18px', minWidth, borderRadius:'var(--r)', border: value===o ? '2px solid var(--orange)' : '1px solid var(--line)', background: value===o ? 'rgba(255,122,41,0.1)' : 'rgba(255,255,255,0.03)', color: value===o ? 'var(--orange)' : 'rgba(255,255,255,0.6)', fontFamily:'var(--font-body)', fontWeight:600, fontSize:14, cursor:'pointer', textAlign:'center', transition:'all .2s' }}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function Phase2KYC() {
  const [loadState, setLoadState]   = useState<LoadState>('loading');
  const [regId, setRegId]           = useState('');
  const [city, setCity]             = useState('');
  const [role, setRole]             = useState('');

  // Jersey size — the only field kept from the removed employment card
  const [tshirt, setTshirt]         = useState('');
  // Emergency contact
  const [ecName, setEcName]         = useState('');
  const [ecRel, setEcRel]           = useState('');
  const [ecPhone, setEcPhone]       = useState('');
  const [ecPhoneErr, setEcPhoneErr] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  // KYC form fields
  const [profession, setProfession] = useState('');
  const [aadhaar, setAadhaar]       = useState('');
  const [pan, setPan]               = useState('');
  const [aadhaarErr, setAadhaarErr] = useState('');
  const [panErr, setPanErr]         = useState('');

  // Submit state
  const [submitting, setSubmitting]     = useState(false);
  const [submitErr, setSubmitErr]       = useState('');
  const [kycStatus, setKycStatus]       = useState<'pending'|'verified'|null>(null);
  const [panAutoVerified, setPanAutoVerified] = useState(true);
  const [kycMsg, setKycMsg]             = useState('');
  // Resume-mid-way: which single step is left for this player
  const [resumeMode, setResumeMode]     = useState<'none'|'aadhaar'|'pan'>('none');
  // OTP step
  const [kycId, setKycId]               = useState('');
  const [aadhaarRefId, setAadhaarRefId] = useState('');
  const [otp, setOtp]                   = useState('');
  const [otpErr, setOtpErr]             = useState('');
  const [otpLoading, setOtpLoading]     = useState(false);

  const [, setLocation] = useLocation();
  const { t } = useLang();

  useEffect(() => {
    (async () => {
      try {
        const status = await getRegistrationStatus();
        if (!status.registered || status.phase1Status !== 'selected') {
          setLoadState('not_eligible'); return;
        }
        if (status.phase2Status !== 'payment_done') {
          if (status.phase2Status === 'kyc_done') { setLoadState('already_done'); return; }
          setLoadState('not_eligible'); return;
        }
        const rid = status.registrationId || '';
        setRegId(rid);
        setCity(status.trialCity || '');
        setRole(status.role || '');
        // Resume support: find out what's already done so the player never
        // re-enters verified documents (and is never re-billed).
        try {
          const prog = await getKycProgress(rid);
          if (prog.profile) {
            if (prog.profile.tshirtSize)        setTshirt(prog.profile.tshirtSize);
            if (prog.profile.emergencyName)     setEcName(prog.profile.emergencyName);
            if (prog.profile.emergencyRelation) setEcRel(prog.profile.emergencyRelation);
            if (prog.profile.emergencyPhone && /^\d{10}$/.test(prog.profile.emergencyPhone)) setEcPhone(prog.profile.emergencyPhone);
            if (prog.profile.bloodGroup)        setBloodGroup(prog.profile.bloodGroup);
          }
          if (prog.hasKyc && prog.profession) setProfession(prog.profession);
          if (prog.hasKyc && prog.status === 'pending') {
            if (!prog.aadhaarVerified) {
              setResumeMode('aadhaar');                        // only Aadhaar OTP left
              setPanAutoVerified(prog.panVerified !== false);
            } else if (!prog.panVerified) {
              setResumeMode('pan');                            // only PAN left
            } else {
              setKycStatus('pending');                         // both done, awaiting sync
            }
          } else if (prog.hasKyc && prog.status === 'verified') {
            setKycStatus('verified');
          }
        } catch {}
        setLoadState('ok');
      } catch { setLoadState('error'); }
    })();
  }, []);

  // Players who filled the old pre-payment form saved these in sessionStorage —
  // recover them so nobody has to type twice.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('bcpl_p2_profile');
      if (!saved) return;
      const p = JSON.parse(saved);
      if (p.tshirt)     setTshirt(p.tshirt);
      if (p.ecName)     setEcName(p.ecName);
      if (p.ecRel)      setEcRel(p.ecRel);
      if (p.ecPhone && /^\d{10}$/.test(p.ecPhone)) setEcPhone(p.ecPhone);
      if (p.bloodGroup) setBloodGroup(p.bloodGroup);
    } catch {}
  }, []);

  // Blood group is deliberately NOT required — many players don't know theirs.
  const emergencyOk  = !!(ecName.trim() && ecRel && /^\d{10}$/.test(ecPhone));
  const canSubmit = !!tshirt && emergencyOk && !!profession && !!aadhaar && !!pan && !aadhaarErr && !panErr;

  const handleAadhaarBlur = () => {
    if (aadhaar && !validateAadhaar(aadhaar)) setAadhaarErr('Aadhaar must be 12 digits');
    else setAadhaarErr('');
  };
  const handlePanBlur = () => {
    if (pan && !validatePan(pan)) setPanErr('Enter a valid PAN (e.g. ABCDE1234F)');
    else setPanErr('');
  };
  const handleEcPhoneBlur = () => {
    if (ecPhone && !/^\d{10}$/.test(ecPhone)) setEcPhoneErr('Enter a 10-digit mobile number');
    else setEcPhoneErr('');
  };

  const handleSubmit = async () => {
    if (!validateAadhaar(aadhaar)) { setAadhaarErr('Aadhaar must be 12 digits'); return; }
    if (!validatePan(pan))         { setPanErr('Enter a valid PAN (e.g. ABCDE1234F)'); return; }
    if (!/^\d{10}$/.test(ecPhone)) { setEcPhoneErr('Enter a 10-digit mobile number'); return; }
    // Defensive: canSubmit already gates these, but this path is also reused
    // for OTP resend — never let a submit through without the required set.
    if (!profession || !tshirt || !ecName.trim() || !ecRel) {
      setSubmitErr('Please complete profession, T-shirt size and emergency contact before submitting.');
      return;
    }

    setSubmitting(true); setSubmitErr('');
    try {
      const result = await initiateKyc({
        registrationId: regId,
        profession,
        aadhaarNumber: aadhaar.replace(/\s/g, ''),
        panNumber: pan.toUpperCase(),
        tshirtSize: tshirt,
        emergencyName: ecName.trim(),
        emergencyRelation: ecRel,
        emergencyPhone: ecPhone,
        bloodGroup: bloodGroup || undefined,
      });
      // Details are now stored server-side — the sessionStorage copy is stale.
      try { sessionStorage.removeItem('bcpl_p2_profile'); } catch {}
      setKycMsg(result.message);
      setKycId(result.kycId);

      if (result.status === 'OTP_SENT' && result.aadhaarRefId) {
        // PAN checked — now collect Aadhaar OTP
        setPanAutoVerified(result.panVerified !== false);
        setAadhaarRefId(result.aadhaarRefId);
      } else if (result.status === 'verified' || result.status === 'VALID') {
        setKycStatus('verified');
        setTimeout(() => { setLocation('/register/phase2/kyc-approved'); }, 2000);
      } else {
        setKycStatus('pending');
      }
    } catch (e: any) {
      setSubmitErr(e.message || 'KYC submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Aadhaar-only resume: NEVER re-runs the billed PAN check.
  const handleAadhaarResume = async () => {
    if (!validateAadhaar(aadhaar)) { setAadhaarErr('Aadhaar must be 12 digits'); return; }
    setSubmitting(true); setSubmitErr('');
    try {
      const result = await kycAadhaarOtp({ registrationId: regId, aadhaarNumber: aadhaar.replace(/\s/g, '') });
      setKycMsg(result.message);
      if (result.status === 'OTP_SENT' && result.aadhaarRefId) {
        setPanAutoVerified(result.panVerified !== false);
        setAadhaarRefId(result.aadhaarRefId);
      } else if (result.status === 'verified') {
        setKycStatus('verified');
        setTimeout(() => { setLocation('/register/phase2/kyc-approved'); }, 2000);
      } else if (result.status === 'AADHAAR_DONE') {
        setResumeMode('pan');
      }
    } catch (e: any) {
      setSubmitErr(e.message || 'Could not send OTP. Please try again.');
    } finally { setSubmitting(false); }
  };

  // PAN-only resume for players whose Aadhaar OTP is already done.
  const handlePanResume = async () => {
    if (!validatePan(pan)) { setPanErr('Enter a valid PAN (e.g. ABCDE1234F)'); return; }
    setSubmitting(true); setSubmitErr('');
    try {
      const result = await kycVerifyPan({ registrationId: regId, panNumber: pan.toUpperCase() });
      setKycMsg(result.message);
      if (result.status === 'verified') {
        setKycStatus('verified');
        setTimeout(() => { setLocation('/register/phase2/kyc-approved'); }, 2000);
      } else if (result.status === 'MANUAL_REVIEW') {
        setKycStatus('pending');
      } else if (result.status === 'PAN_VERIFIED') {
        setResumeMode('aadhaar');   // PAN done — Aadhaar OTP still pending
        setPanAutoVerified(true);
      }
    } catch (e: any) {
      setSubmitErr(e.message || 'PAN verification failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const handleOtpResend = async () => {
    if (!validateAadhaar(aadhaar)) {
      setSubmitErr('Re-enter your 12-digit Aadhaar to resend the OTP.');
      setAadhaarRefId(''); setResumeMode('aadhaar');
      return;
    }
    setSubmitting(true); setSubmitErr('');
    try {
      const result = await kycAadhaarOtp({ registrationId: regId, aadhaarNumber: aadhaar.replace(/\s/g, '') });
      if (result.status === 'OTP_SENT' && result.aadhaarRefId) setAadhaarRefId(result.aadhaarRefId);
      else setSubmitErr(result.message || 'Could not resend OTP.');
    } catch (e: any) { setSubmitErr(e.message || 'Could not resend OTP.'); }
    finally { setSubmitting(false); }
  };

  const handleOtpVerify = async () => {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) { setOtpErr('6-digit OTP required'); return; }
    setOtpLoading(true); setOtpErr('');
    try {
      const result = await verifyKycOtp({ registrationId: regId, aadhaarRefId, otp });
      if (result.status === 'verified') {
        setKycStatus('verified');
        setKycMsg(result.message);
        setTimeout(() => { setLocation('/register/phase2/kyc-approved'); }, 2000);
      } else if (result.status === 'MANUAL_REVIEW') {
        setKycStatus('pending');
        setKycMsg(result.message);
      } else {
        setOtpErr(result.message || 'Verification failed. Try again.');
      }
    } catch (e: any) {
      setOtpErr(e.message || 'Incorrect OTP or expired. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  if (loadState === 'loading') return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', fontFamily:'var(--font-body)' }}>{t("Loading…", "लोड हो रहा है…")}</div>
  );
  if (loadState === 'already_done') return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24, textAlign:'center', fontFamily:'var(--font-body)' }}>
      <div style={{ color:'var(--green)' }}><IcoCheck size={40} /></div>
      <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:32, color:'var(--green)', textTransform:'uppercase' }}>{t("KYC Already Verified", "KYC पहले ही वेरीफाई हो चुका है")}</div>
      <Link href="/register/phase2/kyc-approved" className="btn-cta" style={{ marginTop:16 }}>{t("View KYC Status →", "KYC स्टेटस देखें →")}</Link>
      <style>{`.btn-cta{display:inline-flex;align-items:center;background:linear-gradient(135deg,var(--orange),var(--orange-2));border:none;border-radius:14px;color:#fff;font-family:var(--font-head);font-weight:900;letter-spacing:0.04em;padding:14px 28px;text-transform:uppercase;text-decoration:none;}`}</style>
    </div>
  );
  if (loadState === 'not_eligible' || loadState === 'error') return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24, textAlign:'center', fontFamily:'var(--font-body)' }}>
      <div style={{ color:'var(--orange)' }}><IcoLock size={40} /></div>
      <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:32, color:'#fff', textTransform:'uppercase' }}>{t("KYC Not Available", "KYC उपलब्ध नहीं")}</div>
      <div style={{ fontSize:15, color:'#64748B', maxWidth:400, lineHeight:1.6 }}>{t("Complete Phase 2 payment first, then return here for KYC.", "पहले फेज 2 पेमेंट पूरा करें, फिर KYC के लिए यहां लौटें।")}</div>
      <Link href="/register/phase2/payment" className="btn-cta" style={{ marginTop:16 }}>{t("Go to Phase 2 Payment →", "फेज 2 पेमेंट पर जाएं →")}</Link>
      <style>{`.btn-cta{display:inline-flex;align-items:center;background:linear-gradient(135deg,var(--orange),var(--orange-2));border:none;border-radius:14px;color:#fff;font-family:var(--font-head);font-weight:900;letter-spacing:0.04em;padding:14px 28px;text-transform:uppercase;text-decoration:none;}`}</style>
    </div>
  );

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '12px', color: '#fff',
    padding: '16px', fontSize: 16, outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 0.2s', boxSizing: 'border-box'
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: 'rgba(255,255,255,0.4)',
    fontFamily: 'var(--font-head)', marginBottom: 10, textTransform: 'uppercase'
  };

  return (
    <div className="page-root">
      <style>{`
        .page-root { background: var(--bg); min-height: 100vh; font-family: var(--font-body); color: var(--ink); overflow-x: hidden; padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
        .W { max-width: 800px; margin: 0 auto; padding: 0 20px; }
        @media (min-width: 768px) { .W { padding: 0 32px; } }
        @media (min-width: 1280px) { .W { padding: 0 48px; } }
        
        .btn-primary { background: linear-gradient(135deg, var(--orange), var(--orange-2)); border: none; border-radius: var(--r); color: #fff; font-family: var(--font-head); font-weight: 900; letter-spacing: .06em; cursor: pointer; transition: all .2s; text-transform: uppercase; }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; filter: none; transform: none; }
        
        .card { background: var(--panel); border: 1px solid var(--line); padding: 32px 24px; border-radius: var(--r); width: 100%; margin-bottom: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .grid2 { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 640px) { .grid2 { grid-template-columns: 1fr 1fr; } }
        
        @keyframes verifiedPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 50% { box-shadow: 0 0 0 12px rgba(34,197,94,0); } }
        @keyframes liveBlip { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
        @keyframes scaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        input:focus { border-color: var(--orange) !important; }
        
        .stick-cta { position: fixed; bottom: 0; left: 0; right: 0; padding: 16px 20px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); background: rgba(3,7,16,0.95); backdrop-filter: blur(12px); border-top: 1px solid rgba(255,122,41,0.3); z-index: 1000; }
        @media (min-width: 768px) { .stick-cta { display: none; } }
      `}</style>

      <SiteHeader />

      {/* Progress bar */}
      <div style={{ background: 'rgba(232,178,61,0.06)', borderBottom: '1px solid rgba(232,178,61,0.2)', padding: '12px 0' }}>
        <div className="W" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-head)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--green)' }}>✓</span> {t("PHASE 1 CLEARED", "फेज 1 क्लियर")}
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ color: 'var(--green)' }}>✓</span> {t("PHASE 2 PAID", "फेज 2 पेड")}
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ color: kycStatus === 'verified' ? 'var(--green)' : 'rgba(255,255,255,0.4)' }}>
            {kycStatus === 'verified' ? t("✓ KYC VERIFIED", "✓ KYC वेरीफाइड") : t("→ KYC PENDING", "→ KYC पेंडिंग")}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><IcoBat size={14} /> {role} · {city}</span>
        </div>
      </div>

      <div className="W" style={{ paddingTop: 40 }}>
        {/* Page header */}
        <div style={{ borderLeft: '4px solid var(--orange)', paddingLeft: 16, marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(28px, 5vw, 40px)', color: '#fff', textTransform: 'uppercase', letterSpacing: '.02em', marginBottom: 8, lineHeight: 1.1 }}>
            {kycStatus === 'verified' ? t("KYC Verified", "KYC वेरीफाइड") : t("Player Details & KYC", "प्लेयर जानकारी और KYC")}
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.6, maxWidth: 600 }}>
            {t("Emergency contact and identity verification — required for compliance and franchise contract records.", "आपातकालीन संपर्क और पहचान वेरिफिकेशन — compliance और फ्रैंचाइज़ी कॉन्ट्रैक्ट के लिए आवश्यक।")}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 11, fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '.14em', textTransform: 'uppercase',
            background: kycStatus === 'verified' ? 'rgba(34,197,94,0.1)' : 'rgba(255,122,41,0.1)',
            border: kycStatus === 'verified' ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,122,41,0.4)',
            color: kycStatus === 'verified' ? 'var(--green)' : 'var(--orange)',
            borderRadius: 8,
            animation: kycStatus === 'verified' ? 'verifiedPulse 2s ease infinite' : 'none',
          }}>
            {kycStatus === 'verified' ? (
              <><IcoCheck size={14} /> {t("KYC COMPLETE — CLEARED FOR PHYSICAL TRIAL", "KYC पूरा — फिजिकल ट्रायल के लिए क्लियर")}</>
            ) : (
              <><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block', animation: 'liveBlip 1.2s ease infinite' }} /> {t("PENDING VERIFICATION", "वेरिफिकेशन पेंडिंग")}</>
            )}
          </div>
        </div>

        {/* VERIFIED STATE */}
        {kycStatus === 'verified' ? (
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.3)', padding: '48px 24px', textAlign: 'center', marginBottom: 40, borderRadius: 'var(--r)' }}>
            <div style={{ color: 'var(--green)', marginBottom: 20, animation: 'scaleIn .5s cubic-bezier(.34,1.56,.64,1) both' }}><IcoCheck size={72} /></div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(24px, 5vw, 36px)', color: 'var(--green)', marginBottom: 12, textTransform: 'uppercase' }}>{t("KYC VERIFICATION COMPLETE", "KYC वेरिफिकेशन पूरा")}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 24, lineHeight: 1.6 }}>{kycMsg || t('All documents verified. You are cleared for BCPL Season 5 Physical Trials.', 'सभी दस्तावेज़ वेरीफाई हो गए हैं। आप फिजिकल ट्रायल के लिए क्लियर हैं।')}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
              {[{ icon: IcoIdCard, label: 'Aadhaar' }, { icon: IcoList, label: 'PAN' }, { icon: IcoUser, label: 'Identity' }].map(c => (
                <div key={c.label} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', padding: '10px 24px', fontSize: 14, fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-head)', borderRadius: 10, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 8 }}><c.icon size={16} /> {c.label} ✓</div>
              ))}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{t("Redirecting to your dashboard…", "आपके डैशबोर्ड पर ले जा रहे हैं…")}</div>
          </div>
        ) : kycStatus === 'pending' ? (
          /* KYC Submitted — Pending */
          <div style={{ background: 'rgba(255,122,41,0.06)', border: '1px solid rgba(255,122,41,0.3)', padding: '48px 24px', textAlign: 'center', borderRadius: 'var(--r)', marginBottom: 40 }}>
            <div style={{ color: 'var(--orange)', marginBottom: 20 }}><IcoHourglass size={48} /></div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(24px, 5vw, 32px)', color: 'var(--orange)', marginBottom: 12, textTransform: 'uppercase' }}>{t("KYC Submitted for Review", "KYC रिव्यू के लिए सबमिट हो गया")}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>{kycMsg || t('Your documents are under review. You will receive an SMS + Email when verified (usually within 24 hours).', 'आपके दस्तावेज़ों की जाँच हो रही है। वेरीफाई होने पर आपको SMS + ईमेल मिलेगा (आमतौर पर 24 घंटे में)।')}</div>
          </div>
        ) : aadhaarRefId ? (
          /* ── STEP 2: Aadhaar OTP ── */
          <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--r)', padding: '40px 24px', marginBottom: 40 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ color: 'var(--green)', marginBottom: 16 }}><IcoPhone size={40} /></div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(24px, 4vw, 28px)', color: 'var(--green)', marginBottom: 12, textTransform: 'uppercase' }}>
                {panAutoVerified ? t('PAN Verified ✓', 'PAN वेरीफाइड ✓') : t('Documents Received ✓', 'दस्तावेज़ प्राप्त ✓')}
              </div>
              {!panAutoVerified && (
                <div style={{ fontSize: 14, color: 'var(--orange)', marginBottom: 12, fontWeight: 600 }}>
                  {t('PAN will be verified by our team — no action needed from you.', 'PAN हमारी टीम द्वारा वेरीफाई किया जाएगा — आपको कुछ करने की जरूरत नहीं है।')}
                </div>
              )}
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
                {t("An OTP has been sent to your Aadhaar-linked mobile number. Enter it below to complete verification.", "आपके आधार से जुड़े मोबाइल नंबर पर एक OTP भेजा गया है। वेरिफिकेशन पूरा करने के लिए इसे नीचे दर्ज करें।")}
              </div>
            </div>

            <div style={{ maxWidth: 360, margin: '0 auto' }}>
              <label style={lbl}>{t("AADHAAR OTP (6 digits) *", "आधार OTP (6 अंक) *")}</label>
              <input
                style={{ ...inp, letterSpacing: '0.25em', fontSize: 28, textAlign: 'center', fontWeight: 700, borderColor: otpErr ? 'var(--red)' : (otp.length === 6 ? 'var(--green)' : 'var(--line)') }}
                type="text" inputMode="numeric" maxLength={6} placeholder="• • • • • •"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setOtpErr(''); }}
              />
              {otpErr && <div style={{ fontSize: 13, color: 'var(--red)', marginTop: 8, textAlign: 'center', fontWeight: 600 }}><IcoWarn size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {otpErr}</div>}

              <button
                onClick={handleOtpVerify}
                disabled={otpLoading || otp.length !== 6}
                style={{ marginTop: 24, width: '100%', background: otp.length === 6 ? 'linear-gradient(135deg,var(--green),#16A34A)' : 'rgba(255,255,255,0.05)', color: otp.length === 6 ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '12px', padding: '18px 24px', fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16, letterSpacing: '.08em', cursor: otp.length === 6 ? 'pointer' : 'not-allowed', transition: 'all .2s', textTransform: 'uppercase' }}
              >
                {otpLoading ? t('VERIFYING…', 'वेरीफाई हो रहा है…') : t('VERIFY & COMPLETE KYC →', 'वेरीफाई और KYC पूरा करें →')}
              </button>

              <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                {t("OTP expires in 10 minutes. Didn't receive?", "OTP 10 मिनट में एक्सपायर हो जाएगा। नहीं मिला?")}{' '}
                <button onClick={handleOtpResend} disabled={submitting} style={{ background: 'none', border: 'none', color: submitting ? 'rgba(255,255,255,0.3)' : 'var(--orange)', cursor: submitting ? 'wait' : 'pointer', fontSize: 14, fontWeight: 700, padding: 0 }}>{submitting ? t('Resending…', 'दोबारा भेज रहे हैं…') : t('Resend', 'दोबारा भेजें')}</button>
              </div>
              {submitErr && (
                <div style={{ fontSize: 13, color: 'var(--red)', marginTop: 12, textAlign: 'center', fontWeight: 600 }}><IcoWarn size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {submitErr}</div>
              )}
            </div>
          </div>
        ) : resumeMode === 'aadhaar' ? (
          /* ── RESUME: only the Aadhaar OTP step is left ── */
          <div style={{ background: 'var(--panel)', border: '1px solid rgba(232,178,61,0.4)', borderRadius: 'var(--r)', padding: '40px 24px', marginBottom: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ color: 'var(--gold)', marginBottom: 16 }}><IcoIdCard size={48} /></div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(24px, 4vw, 32px)', color: 'var(--gold)', marginBottom: 12, textTransform: 'uppercase' }}>{t("Resume Your KYC", "अपना KYC फिर से शुरू करें")}</div>
              <div style={{ fontSize: 15, color: panAutoVerified ? 'var(--green)' : 'var(--orange)', fontWeight: 700, marginBottom: 12 }}>
                {panAutoVerified ? t('✓ PAN already verified — it will not be checked again', '✓ PAN पहले ही वेरीफाइड है — इसे दोबारा चेक नहीं किया जाएगा') : t('PAN is with our team for review — no action needed on PAN', 'PAN हमारी टीम के पास रिव्यू के लिए है — आपको कुछ करने की जरूरत नहीं है')}
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
                {t("Only the Aadhaar OTP step is left. For your privacy we never store your Aadhaar number — enter it again to receive a fresh OTP.", "केवल आधार OTP स्टेप बचा है। आपकी गोपनीयता के लिए हम कभी आपका आधार नंबर सेव नहीं करते — नया OTP पाने के लिए इसे दोबारा दर्ज करें।")}
              </div>
            </div>
            <div style={{ maxWidth: 400, margin: '0 auto' }}>
              <label style={lbl}>{t("AADHAAR NUMBER *", "आधार नंबर *")}</label>
              <input
                style={{ ...inp, borderColor: aadhaarErr ? 'var(--red)' : (aadhaar && validateAadhaar(aadhaar) ? 'var(--green)' : 'var(--line)') }}
                type="text" inputMode="numeric" maxLength={14} placeholder="XXXX XXXX XXXX"
                value={aadhaar} onChange={e => { setAadhaar(e.target.value); setAadhaarErr(''); }}
                onBlur={handleAadhaarBlur}
              />
              {aadhaarErr && <div style={{ fontSize: 13, color: 'var(--red)', marginTop: 8, fontWeight: 600 }}><IcoWarn size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {aadhaarErr}</div>}
              {submitErr && <div style={{ fontSize: 13, color: 'var(--red)', marginTop: 12, fontWeight: 600 }}><IcoWarn size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {submitErr}</div>}
              
              <button className="btn-primary" style={{ marginTop: 24, width: '100%', padding: '18px 0', fontSize: 16 }}
                disabled={submitting || !validateAadhaar(aadhaar)} onClick={handleAadhaarResume}>
                {submitting ? t('SENDING OTP…', 'OTP भेज रहे हैं…') : t('SEND AADHAAR OTP →', 'आधार OTP भेजें →')}
              </button>
              
              <button onClick={() => setResumeMode('none')}
                style={{ marginTop: 16, width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 8 }}>
                {t("← Fill the full form again instead", "← इसके बजाय पूरा फॉर्म दोबारा भरें")}
              </button>
            </div>
          </div>
        ) : resumeMode === 'pan' ? (
          /* ── RESUME: Aadhaar done, only PAN is left ── */
          <div style={{ background: 'var(--panel)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 'var(--r)', padding: '40px 24px', marginBottom: 40, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ color: 'var(--green)', marginBottom: 16 }}><IcoList size={48} /></div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(24px, 4vw, 32px)', color: 'var(--green)', marginBottom: 12, textTransform: 'uppercase' }}>{t("Almost Done — PAN Verification", "लगभग पूरा — PAN वेरिफिकेशन")}</div>
              <div style={{ fontSize: 15, color: 'var(--green)', fontWeight: 700, marginBottom: 12 }}>
                {t('✓ Aadhaar OTP verified', '✓ आधार OTP वेरीफाइड')}
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
                {t("Your Aadhaar is verified. Please provide your PAN number to complete the final compliance step.", "आपका आधार वेरीफाइड है। अंतिम स्टेप पूरा करने के लिए कृपया अपना PAN नंबर दें।")}
              </div>
            </div>
            <div style={{ maxWidth: 400, margin: '0 auto' }}>
              <label style={lbl}>{t("PAN NUMBER *", "PAN नंबर *")}</label>
              <input
                style={{ ...inp, textTransform: 'uppercase', borderColor: panErr ? 'var(--red)' : (pan && validatePan(pan) ? 'var(--green)' : 'var(--line)') }}
                type="text" maxLength={10} placeholder="ABCDE1234F"
                value={pan} onChange={e => { setPan(e.target.value.toUpperCase()); setPanErr(''); }}
                onBlur={handlePanBlur}
              />
              {panErr && <div style={{ fontSize: 13, color: 'var(--red)', marginTop: 8, fontWeight: 600 }}><IcoWarn size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {panErr}</div>}
              {submitErr && <div style={{ fontSize: 13, color: 'var(--red)', marginTop: 12, fontWeight: 600 }}><IcoWarn size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {submitErr}</div>}
              
              <button className="btn-primary" style={{ marginTop: 24, width: '100%', padding: '18px 0', fontSize: 16 }}
                disabled={submitting || !validatePan(pan)} onClick={handlePanResume}>
                {submitting ? t('VERIFYING PAN…', 'PAN वेरीफाई हो रहा है…') : t('VERIFY PAN & COMPLETE KYC →', 'PAN वेरीफाई करें और KYC पूरा करें →')}
              </button>
              
              <button onClick={() => setResumeMode('none')}
                style={{ marginTop: 16, width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 8 }}>
                {t("← Fill the full form again instead", "← इसके बजाय पूरा फॉर्म दोबारा भरें")}
              </button>
            </div>
          </div>
        ) : (
          /* ── STEP 1: Full Form ── */
          <div>
            <div className="card">
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 6, textTransform: 'uppercase' }}>{t("1. Player Essentials", "1. प्लेयर की जरूरी जानकारी")}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{t("Required for match jerseys and on-ground safety.", "मैच जर्सी और मैदान पर सुरक्षा के लिए आवश्यक।")}</div>

              <div className="grid2">
                <div>
                  <label style={lbl}>{t("T-SHIRT SIZE *", "टी-शर्ट का साइज़ *")}</label>
                  <ChipRow options={TSHIRT_OPTS} value={tshirt} onChange={setTshirt} minWidth={48} />
                </div>
                <div>
                  <label style={lbl}>{t("BLOOD GROUP", "ब्लड ग्रुप")}</label>
                  <ChipRow options={BLOOD_OPTS} value={bloodGroup} onChange={setBloodGroup} minWidth={48} />
                </div>
              </div>

              <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 20, textTransform: 'uppercase' }}>{t("Emergency Contact", "आपातकालीन संपर्क")}</div>
                <div className="grid2">
                  <div>
                    <label style={lbl}>{t("CONTACT PERSON NAME *", "संपर्क व्यक्ति का नाम *")}</label>
                    <input style={inp} placeholder={t("Full Name", "पूरा नाम")} value={ecName} onChange={e => setEcName(e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>{t("RELATION *", "रिश्ता *")}</label>
                    <select style={{ ...inp, appearance: 'none', color: ecRel ? '#fff' : 'rgba(255,255,255,0.4)' }} value={ecRel} onChange={e => setEcRel(e.target.value)}>
                      <option value="" disabled>{t("Select Relation", "रिश्ता चुनें")}</option>
                      {RELATION_OPTS.map(o => <option key={o} value={o} style={{ color: '#000' }}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 24, maxWidth: 400 }}>
                  <label style={lbl}>{t("EMERGENCY MOBILE NUMBER *", "आपातकालीन मोबाइल नंबर *")}</label>
                  <input style={{ ...inp, borderColor: ecPhoneErr ? 'var(--red)' : 'var(--line)' }} type="tel" maxLength={10} placeholder="10-digit number" value={ecPhone} onChange={e => { setEcPhone(e.target.value.replace(/\D/g,'')); setEcPhoneErr(''); }} onBlur={handleEcPhoneBlur} />
                  {ecPhoneErr && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, fontWeight: 600 }}><IcoWarn size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {ecPhoneErr}</div>}
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 6, textTransform: 'uppercase' }}>{t("2. Employment Details", "2. रोज़गार की जानकारी")}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{t("Required to confirm working professional eligibility.", "वर्किंग प्रोफेशनल योग्यता की पुष्टि के लिए आवश्यक।")}</div>
              
              <label style={lbl}>{t("SELECT YOUR PROFESSION *", "अपना पेशा चुनें *")}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                {PROFESSIONS.map(p => (
                  <button key={p.id} onClick={() => setProfession(p.id)}
                    style={{ padding: '16px', borderRadius: '12px', border: profession === p.id ? '2px solid var(--orange)' : '1px solid var(--line)', background: profession === p.id ? 'rgba(255,122,41,0.08)' : 'rgba(255,255,255,0.02)', color: profession === p.id ? 'var(--orange)' : 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ display: 'inline-flex' }}><p.icon size={20} /></span>
                    <span style={{ lineHeight: 1.3 }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 6, textTransform: 'uppercase' }}>{t("3. Identity Verification", "3. पहचान वेरिफिकेशन")}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{t("Compliance and franchise record requirements. Aadhaar OTP will be sent.", "Compliance और फ्रैंचाइज़ी रिकॉर्ड के लिए आवश्यक। आधार OTP भेजा जाएगा।")}</div>

              <div className="grid2">
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '24px', borderRadius: 'var(--r)' }}>
                  <div style={{ color: 'var(--gold)', marginBottom: 12 }}><IcoIdCard size={32} /></div>
                  <label style={lbl}>{t("AADHAAR NUMBER *", "आधार नंबर *")}</label>
                  <input
                    style={{ ...inp, borderColor: aadhaarErr ? 'var(--red)' : (aadhaar && validateAadhaar(aadhaar) ? 'var(--green)' : 'var(--line)') }}
                    type="text" inputMode="numeric" maxLength={14} placeholder="XXXX XXXX XXXX"
                    value={aadhaar} onChange={e => { setAadhaar(e.target.value); setAadhaarErr(''); }}
                    onBlur={handleAadhaarBlur}
                  />
                  {aadhaarErr && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, fontWeight: 600 }}><IcoWarn size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {aadhaarErr}</div>}
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 12, lineHeight: 1.5 }}>{t("An OTP will be sent to the mobile number linked with this Aadhaar.", "इस आधार से जुड़े मोबाइल नंबर पर एक OTP भेजा जाएगा।")}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '24px', borderRadius: 'var(--r)' }}>
                  <div style={{ color: 'var(--gold)', marginBottom: 12 }}><IcoList size={32} /></div>
                  <label style={lbl}>{t("PAN NUMBER *", "PAN नंबर *")}</label>
                  <input
                    style={{ ...inp, textTransform: 'uppercase', borderColor: panErr ? 'var(--red)' : (pan && validatePan(pan) ? 'var(--green)' : 'var(--line)') }}
                    type="text" maxLength={10} placeholder="ABCDE1234F"
                    value={pan} onChange={e => { setPan(e.target.value.toUpperCase()); setPanErr(''); }}
                    onBlur={handlePanBlur}
                  />
                  {panErr && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, fontWeight: 600 }}><IcoWarn size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {panErr}</div>}
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 12, lineHeight: 1.5 }}>{t("Required for franchise contract and prize money tax compliance.", "फ्रैंचाइज़ी कॉन्ट्रैक्ट और इनामी राशि के टैक्स नियमों के लिए आवश्यक।")}</div>
                </div>
              </div>

              {submitErr && <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', color: 'var(--red)', fontSize: 14, marginTop: 24, fontWeight: 600 }}><IcoWarn size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} /> {submitErr}</div>}

              <div className="desk-only-btn" style={{ marginTop: 32 }}>
                <style>{`@media(max-width: 767px){ .desk-only-btn { display: none !important; } }`}</style>
                <button className="btn-primary" style={{ width: '100%', padding: '20px', fontSize: 16 }} disabled={!canSubmit || submitting} onClick={handleSubmit}>
                  {submitting ? t('VERIFYING DOCUMENTS…', 'दस्तावेज़ों की जाँच हो रही है…') : t('PROCEED TO AADHAAR OTP →', 'आधार OTP के लिए आगे बढ़ें →')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky CTA */}
      {!aadhaarRefId && resumeMode === 'none' && kycStatus !== 'verified' && kycStatus !== 'pending' && (
        <div className="stick-cta">
          <button className="btn-primary" style={{ width: '100%', padding: '16px 20px', fontSize: 16 }} disabled={!canSubmit || submitting} onClick={handleSubmit}>
            {submitting ? t('VERIFYING…', 'वेरीफाई हो रहा है…') : t('PROCEED TO OTP →', 'OTP के लिए आगे बढ़ें →')}
          </button>
        </div>
      )}

      <BCPLFooter />
    </div>
  );
}
