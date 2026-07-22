import { useState, useEffect } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getRegistrationStatus, initiateKyc, verifyKycOtp } from '../lib/api';

const BASE = import.meta.env.BASE_URL;

// Must match backend enum exactly
const PROFESSIONS = [
  { id:'Business Owner',                              icon:'🏢', label:'Business Owner' },
  { id:'Salaried Employee',                           icon:'💼', label:'Salaried Employee' },
  { id:'Doctor',                                      icon:'👨‍⚕️', label:'Doctor' },
  { id:'Engineer',                                    icon:'⚙️', label:'Engineer' },
  { id:'Government Officer',                          icon:'🏛️', label:'Govt. Officer' },
  { id:'IAS / IPS / IFS',                             icon:'👮', label:'IAS / IPS / IFS' },
  { id:'Army / Navy / Air Force',                     icon:'🎖️', label:'Army / Defence' },
  { id:'Railway Employee',                            icon:'🚂', label:'Railway Employee' },
  { id:'Teacher / Professor',                         icon:'📚', label:'Teacher / Prof' },
  { id:'Lawyer',                                      icon:'⚖️', label:'Lawyer' },
  { id:'Farmer / Agriculture',                        icon:'🌾', label:'Farmer' },
  { id:'Delivery / Logistics (Zomato, Swiggy etc.)',  icon:'📦', label:'Delivery Boy' },
  { id:'Student / Intern',                            icon:'🎓', label:'Student / Intern' },
  { id:'Freelancer / Self-Employed',                  icon:'💻', label:'Freelancer' },
  { id:'Other',                                       icon:'✨', label:'Other' },
];

const TSHIRT_OPTS     = ['S','M','L','XL','XXL'];
const RELATION_OPTS   = ['Father','Mother','Spouse','Friend','Other'];
const BLOOD_OPTS      = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

type LoadState = 'loading' | 'ok' | 'not_eligible' | 'already_done' | 'error';

function validateAadhaar(v: string) { return /^\d{12}$/.test(v.replace(/\s/g, '')); }
function validatePan(v: string)     { return /^[A-Z]{5}\d{4}[A-Z]$/.test(v.toUpperCase()); }

function ChipRow({ options, value, onChange, minWidth }: { options: string[]; value: string; onChange: (v: string) => void; minWidth?: number }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(value === o ? '' : o)}
          style={{ padding:'9px 14px', minWidth, borderRadius:10, border: value===o ? '2px solid #FF7A29' : '1px solid rgba(255,255,255,0.1)', background: value===o ? 'rgba(255,122,41,0.12)' : 'rgba(255,255,255,0.03)', color: value===o ? '#FF7A29' : 'rgba(255,255,255,0.6)', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer', textAlign:'center', transition:'all .18s' }}>
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
  // OTP step
  const [kycId, setKycId]               = useState('');
  const [aadhaarRefId, setAadhaarRefId] = useState('');
  const [otp, setOtp]                   = useState('');
  const [otpErr, setOtpErr]             = useState('');
  const [otpLoading, setOtpLoading]     = useState(false);

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
        setRegId(status.registrationId || '');
        setCity(status.trialCity || '');
        setRole(status.role || '');
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
        // Optional — sending '' would fail the server's enum check
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
        setTimeout(() => { window.location.href = BASE + 'register/phase2/kyc-approved'; }, 2000);
      } else {
        setKycStatus('pending');
      }
    } catch (e: any) {
      setSubmitErr(e.message || 'KYC submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) { setOtpErr('6-digit OTP required'); return; }
    setOtpLoading(true); setOtpErr('');
    try {
      const result = await verifyKycOtp({ registrationId: regId, aadhaarRefId, otp });
      if (result.status === 'verified') {
        setKycStatus('verified');
        setKycMsg(result.message);
        setTimeout(() => { window.location.href = BASE + 'register/phase2/kyc-approved'; }, 2000);
      } else if (result.status === 'MANUAL_REVIEW') {
        // Aadhaar OTP done; PAN awaits manual check by the team
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

  // Shared loading/error/guard screens
  if (loadState === 'loading') return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', fontFamily:'Inter,sans-serif' }}>Loading…</div>
  );
  if (loadState === 'already_done') return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, padding:24, textAlign:'center', fontFamily:'Inter,sans-serif' }}>
      <div style={{ fontSize:48 }}>✅</div>
      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#22C55E' }}>KYC Already Verified</div>
      <a href={BASE + 'register/phase2/kyc-approved'} style={{ padding:'12px 28px', borderRadius:12, background:'linear-gradient(135deg,#FF7A29,#D95E10)', color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, textDecoration:'none' }}>View KYC Status →</a>
    </div>
  );
  if (loadState === 'not_eligible' || loadState === 'error') return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, padding:24, textAlign:'center', fontFamily:'Inter,sans-serif' }}>
      <div style={{ fontSize:48 }}>🔒</div>
      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'#F1F5F9' }}>KYC Not Available</div>
      <div style={{ fontSize:13, color:'#64748B', maxWidth:380 }}>Complete Phase 2 payment first, then return here for KYC.</div>
      <a href={BASE + 'register/phase2/payment'} style={{ padding:'12px 28px', borderRadius:12, background:'linear-gradient(135deg,#FF7A29,#D95E10)', color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, textDecoration:'none' }}>Go to Phase 2 Payment →</a>
    </div>
  );

  const inp: React.CSSProperties = {
    width:'100%', background:'#060B18', border:'1px solid #1E293B', borderRadius:10, color:'#E2E8F0',
    padding:'12px 14px', fontSize:15, outline:'none', fontFamily:'Inter,sans-serif', letterSpacing:'.05em', boxSizing:'border-box',
  };
  const lbl: React.CSSProperties = {
    display:'block', fontSize:10, fontWeight:700, letterSpacing:'.12em', color:'rgba(255,255,255,0.4)',
    fontFamily:'Montserrat,sans-serif', marginBottom:8, textTransform:'uppercase',
  };

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', fontFamily:"'Inter',sans-serif", color:'#F0EDE8', overflowX:'hidden', paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .wrap{max-width:900px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .btn-primary{background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:.06em;cursor:pointer;transition:all .2s}
        .btn-primary:hover{filter:brightness(1.15);transform:translateY(-2px)}
        .btn-primary:disabled{opacity:.35;cursor:not-allowed;filter:none;transform:none}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes scaleIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes verifiedPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)}50%{box-shadow:0 0 0 12px rgba(34,197,94,0)}}
        .upload-grid{display:grid;grid-template-columns:1fr;gap:20px;margin-bottom:24px}
        @media(min-width:640px){.upload-grid{grid-template-columns:1fr 1fr}}
        .doc-card{background:#0A1727;border:1px solid rgba(255,255,255,0.08);padding:20px 16px;border-radius:12px;width:100%}
        .nav-link{font-size:12px;font-weight:700;font-family:Montserrat,sans-serif;letter-spacing:.08em;color:rgba(255,255,255,0.65);text-decoration:none;text-transform:uppercase;cursor:pointer;transition:color .2s;background:none;border:none}
        .nav-link:hover{color:#FF7A29}
        footer a{color:rgba(255,255,255,0.45);text-decoration:none}
        footer a:hover{color:#FF7A29}
      `}</style>

      <SiteHeader />

      {/* Progress bar */}
      <div style={{ background:'rgba(232,178,61,0.08)', borderBottom:'1px solid rgba(232,178,61,0.2)', padding:'10px 0' }}>
        <div className="wrap" style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', fontSize:12, fontWeight:700, color:'#E8B23D', fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em' }}>
          <span style={{ color:'#22C55E' }}>✓</span> PHASE 1 CLEARED
          <span style={{ color:'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ color:'#22C55E' }}>✓</span> PHASE 2 PAID
          <span style={{ color:'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ color: kycStatus === 'verified' ? '#22C55E' : 'rgba(255,255,255,0.35)' }}>
            {kycStatus === 'verified' ? '✓ KYC VERIFIED' : '→ KYC PENDING'}
          </span>
          <span style={{ marginLeft:'auto', fontSize:11, color:'rgba(255,255,255,0.4)' }}>🏏 {role} · {city}</span>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop:40 }}>
        {/* Page header */}
        <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:32 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(20px,4vw,28px)', color:'#fff', textTransform:'uppercase', letterSpacing:'.02em', marginBottom:4 }}>
            {kycStatus === 'verified' ? '✅ KYC Verified' : 'Player Details & KYC'}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:10 }}>Emergency contact and identity verification — required for BCCI compliance and franchise contract records</div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em',
            background: kycStatus === 'verified' ? 'rgba(34,197,94,0.1)' : 'rgba(255,122,41,0.1)',
            border: kycStatus === 'verified' ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,122,41,0.3)',
            color: kycStatus === 'verified' ? '#22C55E' : '#FF7A29',
            animation: kycStatus === 'verified' ? 'verifiedPulse 2s ease infinite' : 'none',
          }}>
            {kycStatus === 'verified' ? '✅ KYC COMPLETE — CLEARED FOR PHYSICAL TRIAL' : (
              <><span style={{ width:6, height:6, borderRadius:'50%', background:'#FF7A29', display:'inline-block', animation:'liveBlip 1.2s ease infinite' }} />⏳ PENDING VERIFICATION</>
            )}
          </div>
        </div>

        {/* VERIFIED STATE */}
        {kycStatus === 'verified' ? (
          <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.25)', padding:'40px 24px', textAlign:'center', marginBottom:32, borderRadius:12 }}>
            <div style={{ fontSize:64, marginBottom:16, animation:'scaleIn .5s cubic-bezier(.34,1.56,.64,1) both' }}>✅</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(20px,4vw,28px)', color:'#22C55E', marginBottom:8 }}>KYC VERIFICATION COMPLETE</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)', marginBottom:20 }}>{kycMsg || 'All documents verified. You are cleared for BCPL Season 5 Physical Trials.'}</div>
            <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap', marginBottom:24 }}>
              {['🪪 Aadhaar ✓','📋 PAN ✓','👤 Identity ✓'].map(t => (
                <div key={t} style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', padding:'8px 20px', fontSize:12, fontWeight:700, color:'#22C55E', fontFamily:'Montserrat,sans-serif', borderRadius:8 }}>{t}</div>
              ))}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Redirecting to your dashboard…</div>
          </div>
        ) : kycStatus === 'pending' ? (
          /* KYC Submitted — Pending */
          <div style={{ background:'rgba(255,122,41,0.06)', border:'1px solid rgba(255,122,41,0.25)', padding:'40px 24px', textAlign:'center', borderRadius:12, marginBottom:32 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#FF7A29', marginBottom:8 }}>KYC Submitted for Review</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)', maxWidth:420, margin:'0 auto' }}>{kycMsg || 'Your documents are under review. You will receive an SMS + Email when verified (usually within 24 hours).'}</div>
          </div>
        ) : aadhaarRefId ? (
          /* ── STEP 2: Aadhaar OTP ── */
          <div style={{ background:'rgba(34,197,94,0.04)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:12, padding:'32px 24px', marginBottom:32 }}>
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📱</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'#22C55E', marginBottom:8 }}>
                {panAutoVerified ? 'PAN Verified ✓' : 'Documents Received ✓'}
              </div>
              {!panAutoVerified && (
                <div style={{ fontSize:12, color:'#FF7A29', marginBottom:8 }}>
                  PAN will be verified by our team — no action needed from you.
                </div>
              )}
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', maxWidth:380, margin:'0 auto' }}>
                An OTP has been sent to your <strong style={{ color:'#fff' }}>Aadhaar-linked mobile number</strong>. Enter it below to complete verification.
              </div>
            </div>

            <div style={{ maxWidth:320, margin:'0 auto' }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'.12em', color:'rgba(255,255,255,0.4)', fontFamily:'Montserrat,sans-serif', marginBottom:8, textTransform:'uppercase' }}>
                AADHAAR OTP (6 digits) *
              </label>
              <input
                style={{ ...inp, letterSpacing:'0.25em', fontSize:22, textAlign:'center', borderColor: otpErr ? '#EF4444' : (otp.length === 6 ? '#22C55E' : '#1E293B') }}
                type="text" inputMode="numeric" maxLength={6} placeholder="• • • • • •"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setOtpErr(''); }}
              />
              {otpErr && <div style={{ fontSize:11, color:'#EF4444', marginTop:6, textAlign:'center' }}>⚠ {otpErr}</div>}

              <button
                onClick={handleOtpVerify}
                disabled={otpLoading || otp.length !== 6}
                style={{ marginTop:20, width:'100%', background: otp.length===6 ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'rgba(255,255,255,0.07)', color: otp.length===6 ? '#fff' : 'rgba(255,255,255,0.35)', border:'none', borderRadius:10, padding:'16px 24px', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, letterSpacing:'.08em', cursor: otp.length===6 ? 'pointer' : 'not-allowed', transition:'all .2s' }}
              >
                {otpLoading ? 'VERIFYING…' : 'VERIFY & COMPLETE KYC →'}
              </button>

              <div style={{ marginTop:16, textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.3)' }}>
                OTP expires in 10 minutes. Didn't receive?{' '}
                <button onClick={handleSubmit} disabled={submitting} style={{ background:'none', border:'none', color: submitting ? 'rgba(255,255,255,0.3)' : '#FF7A29', cursor: submitting ? 'wait' : 'pointer', fontSize:12, fontWeight:700, padding:0 }}>{submitting ? 'Resending…' : 'Resend'}</button>
              </div>
              {submitErr && (
                <div style={{ fontSize:11, color:'#EF4444', marginTop:10, textAlign:'center' }}>⚠ {submitErr}</div>
              )}
            </div>
          </div>
        ) : (
          /* Main form: jersey size + emergency contact + KYC */
          <>
            {/* T-Shirt Size — kept for jerseys after the employment card was removed */}
            <div style={{ background:'#0A1727', border:'1px solid rgba(255,122,41,0.2)', borderRadius:12, padding:'20px 18px', marginBottom:24 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#FF7A29', letterSpacing:'.06em', marginBottom:4 }}>T-SHIRT SIZE *</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:16 }}>Used to prepare match jerseys for players who make it to the tournament</div>
              <ChipRow options={TSHIRT_OPTS} value={tshirt} onChange={setTshirt} minWidth={48} />
              <div style={{ marginTop:8, fontSize:11, color:'rgba(255,255,255,0.45)', lineHeight:1.55 }}>
                ℹ️ Only for tournament purpose — registration does not include a free T-shirt.
              </div>
            </div>

            {/* Emergency Contact */}
            <div style={{ background:'#0A1727', border:'1px solid rgba(255,122,41,0.2)', borderRadius:12, padding:'20px 18px', marginBottom:24 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#FF7A29', letterSpacing:'.06em', marginBottom:4 }}>EMERGENCY CONTACT *</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:16 }}>Required for physical trials — who should we call in an emergency?</div>
              <div style={{ display:'grid', gap:18 }}>
                <div>
                  <label style={lbl}>Contact Name *</label>
                  <input style={inp} placeholder="Full name of emergency contact" value={ecName} onChange={e => setEcName(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Relationship *</label>
                  <ChipRow options={RELATION_OPTS} value={ecRel} onChange={setEcRel} />
                </div>
                <div>
                  <label style={lbl}>Phone Number *</label>
                  <input
                    style={{ ...inp, borderColor: ecPhoneErr ? '#EF4444' : (/^\d{10}$/.test(ecPhone) ? '#22C55E' : '#1E293B') }}
                    type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit mobile number"
                    value={ecPhone}
                    onChange={e => { setEcPhone(e.target.value.replace(/\D/g,'')); setEcPhoneErr(''); }}
                    onBlur={handleEcPhoneBlur}
                  />
                  {ecPhoneErr && <div style={{ fontSize:11, color:'#EF4444', marginTop:6 }}>⚠ {ecPhoneErr}</div>}
                </div>
                <div>
                  <label style={lbl}>Blood Group <span style={{ color:'rgba(255,255,255,0.22)', textTransform:'none' }}>(optional)</span></label>
                  <ChipRow options={BLOOD_OPTS} value={bloodGroup} onChange={setBloodGroup} minWidth={48} />
                  <div style={{ marginTop:8, fontSize:11, color:'rgba(255,255,255,0.45)' }}>
                    Pick it if you know it — helps us in a medical emergency. You can skip this.
                  </div>
                </div>
              </div>
            </div>

            {/* Profession selector */}
            <div style={{ background:'#0A1727', border:'1px solid rgba(255,122,41,0.2)', borderRadius:12, padding:'20px 18px', marginBottom:24 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#FF7A29', letterSpacing:'.06em', marginBottom:4 }}>YOUR PROFESSION *</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:16 }}>Select the field you currently work in</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:8 }}>
                {PROFESSIONS.map(p => (
                  <button key={p.id} onClick={() => setProfession(p.id)}
                    style={{ padding:'10px 8px', borderRadius:10, border: profession===p.id?'2px solid #FF7A29':'1px solid rgba(255,255,255,0.1)', background: profession===p.id?'rgba(255,122,41,0.12)':'rgba(255,255,255,0.03)', color: profession===p.id?'#FF7A29':'rgba(255,255,255,0.6)', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:11, cursor:'pointer', textAlign:'center', transition:'all .18s', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:20 }}>{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Numbers */}
            <div className="upload-grid">
              {/* Aadhaar */}
              <div className="doc-card">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <span style={{ fontSize:24 }}>🪪</span>
                  <div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff', textTransform:'uppercase' }}>Aadhaar Card</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>12-digit Aadhaar number</div>
                  </div>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'.12em', color:'rgba(255,255,255,0.4)', fontFamily:'Montserrat,sans-serif', marginBottom:8, textTransform:'uppercase' }}>AADHAAR NUMBER *</label>
                  <input
                    style={{ ...inp, borderColor: aadhaarErr ? '#EF4444' : (aadhaar && validateAadhaar(aadhaar) ? '#22C55E' : '#1E293B') }}
                    type="text" inputMode="numeric" maxLength={14} placeholder="XXXX XXXX XXXX"
                    value={aadhaar} onChange={e => { setAadhaar(e.target.value); setAadhaarErr(''); }}
                    onBlur={handleAadhaarBlur}
                  />
                  {aadhaarErr && <div style={{ fontSize:11, color:'#EF4444', marginTop:6 }}>⚠ {aadhaarErr}</div>}
                  {aadhaar && validateAadhaar(aadhaar) && !aadhaarErr && <div style={{ fontSize:11, color:'#22C55E', marginTop:6 }}>✓ Valid Aadhaar number</div>}
                </div>
                <div style={{ marginTop:14, fontSize:11, color:'rgba(255,255,255,0.3)', fontStyle:'italic' }}>⚠️ Name on Aadhaar must match your registered name</div>
              </div>

              {/* PAN */}
              <div className="doc-card">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <span style={{ fontSize:24 }}>📋</span>
                  <div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff', textTransform:'uppercase' }}>PAN Card</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>10-character PAN number</div>
                  </div>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'.12em', color:'rgba(255,255,255,0.4)', fontFamily:'Montserrat,sans-serif', marginBottom:8, textTransform:'uppercase' }}>PAN NUMBER *</label>
                  <input
                    style={{ ...inp, textTransform:'uppercase', borderColor: panErr ? '#EF4444' : (pan && validatePan(pan) ? '#22C55E' : '#1E293B') }}
                    type="text" maxLength={10} placeholder="ABCDE1234F"
                    value={pan} onChange={e => { setPan(e.target.value.toUpperCase()); setPanErr(''); }}
                    onBlur={handlePanBlur}
                  />
                  {panErr && <div style={{ fontSize:11, color:'#EF4444', marginTop:6 }}>⚠ {panErr}</div>}
                  {pan && validatePan(pan) && !panErr && <div style={{ fontSize:11, color:'#22C55E', marginTop:6 }}>✓ Valid PAN format</div>}
                </div>
                <div style={{ marginTop:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', padding:'14px', borderRadius:8 }}>
                  <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'rgba(255,255,255,0.4)', marginBottom:8 }}>WHY WE NEED THIS</div>
                  {['BCCI compliance for league participation', 'Franchise contract records', 'Prize money distribution & TDS', 'Anti-impersonation verification'].map(r => (
                    <div key={r} style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:5, display:'flex', gap:6 }}>
                      <span style={{ color:'rgba(255,122,41,0.6)', flexShrink:0 }}>→</span>{r}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacy notice */}
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:12, marginBottom:24, borderRadius:8 }}>
              <span style={{ fontSize:24, flexShrink:0 }}>🔒</span>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
                <strong style={{ color:'rgba(255,255,255,0.7)' }}>Privacy Assured.</strong> Your Aadhaar and PAN numbers are encrypted and verified through Cashfree's secured KYC gateway. We never store raw numbers — only the verification reference ID. Compliant with IT Act, 2000 and UIDAI guidelines.
              </div>
            </div>

            {/* Error */}
            {submitErr && (
              <div style={{ padding:'12px 16px', background:'#EF444415', border:'1px solid #EF444440', borderRadius:10, color:'#EF4444', fontSize:13, marginBottom:16 }}>⚠ {submitErr}</div>
            )}

            {/* Submit */}
            <button
              className="btn-primary"
              style={{ padding:'18px 32px', fontSize:15, letterSpacing:'.06em', width:'100%', maxWidth:400 }}
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                  <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                  VERIFYING…
                </span>
              ) : 'SUBMIT FOR KYC VERIFICATION →'}
            </button>
            {!canSubmit && (
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:10 }}>
                {!tshirt ? '• Select your T-shirt size' : ''}
                {!emergencyOk ? ' • Complete emergency contact (name, relation + 10-digit phone)' : ''}
                {!profession ? ' • Select your profession' : ''}
                {!aadhaar || !validateAadhaar(aadhaar) ? ' • Enter valid Aadhaar (12 digits)' : ''}
                {!pan || !validatePan(pan) ? ' • Enter valid PAN' : ''}
              </div>
            )}
          </>
        )}
      </div>

      <BCPLFooter />
    </div>
  );
}
