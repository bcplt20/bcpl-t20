import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import {
  sendOtp, verifyOtp, saveAuthToken, isAuthenticated,
  registerPhase1, createPhase1Payment, getRegistrationStatus,
} from '../lib/api';

/*
  BCPL T20 — Bhartiya Corporate Premier League
  World's largest corporate cricket league for working professionals
  Run by BCPL T20 Pvt. Ltd. | Brand Ambassador: Sourav Ganguly
  ₹6 Cr Season 5 Prize Pool | 10 Franchise Teams | 21 Trial Cities

  TRIAL JOURNEY:
  ┌─────────────────────────────────────────────────────────────────┐
  │ PHASE 1 (Video Trial)                                           │
  │  → Register + Pay ₹299 (Bat/Bowl/WK) or ₹399 (All-Rounder)    │
  │  → Upload your 2-minute trial video                            │
  │  → BCCI-certified scouts evaluate                               │
  │  → Result within 7 working days                                │
  │                                                                 │
  │ PHASE 2 (Physical Trial) — only if selected                    │
  │  → Physical trial at your trial city                           │
  │  → Pay ₹2,000 (Bat/Bowl/WK) or ₹3,000 (All-Rounder)          │
  │  → Franchise auction — get drafted into a team                 │
  └─────────────────────────────────────────────────────────────────┘
*/

const ROLES = [
  {
    id: 'bat',  emoji: '🏏', icon: 'batsman', label: 'Batsman',
    desc: 'Open the innings. Anchor the chase.',
    phase1: 299, phase2: 2000,
    color: '#3B82F6', colorDark: '#1D4ED8',
    svgPath: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" fill="#3B82F612" stroke="#3B82F630" stroke-width="1.5"/>
      <path d="M18 40 L38 12" stroke="#3B82F6" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M35 9 L44 18 L38 24 L29 15 Z" fill="#3B82F6"/>
      <circle cx="17" cy="41" r="4.5" fill="#3B82F6"/>
      <path d="M15 41 Q17 38.5 19 41" stroke="white" stroke-width="1.1" fill="none" opacity="0.7"/>
      <path d="M15 41 Q17 43.5 19 41" stroke="white" stroke-width="1.1" fill="none" opacity="0.7"/>
    </svg>`,
  },
  {
    id: 'bowl', emoji: '🎳', icon: 'bowler', label: 'Bowler',
    desc: 'Take wickets. Change the game.',
    phase1: 299, phase2: 2000,
    color: '#8B5CF6', colorDark: '#6D28D9',
    svgPath: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" fill="#8B5CF612" stroke="#8B5CF630" stroke-width="1.5"/>
      <circle cx="28" cy="30" r="11" fill="#8B5CF6" opacity="0.85"/>
      <path d="M17.5 30 Q22 24 28 30 Q34 36 38.5 30" stroke="white" stroke-width="1.4" fill="none" opacity="0.65"/>
      <path d="M17.5 30 Q22 36 28 30 Q34 24 38.5 30" stroke="white" stroke-width="1.4" fill="none" opacity="0.65"/>
      <line x1="14" y1="14" x2="21" y2="12" stroke="#8B5CF6" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>
      <line x1="12" y1="19" x2="21" y2="17" stroke="#8B5CF6" stroke-width="2.5" stroke-linecap="round" opacity="0.35"/>
    </svg>`,
  },
  {
    id: 'wk',   emoji: '🧤', icon: 'wicketkeeper', label: 'Wicket-Keeper',
    desc: 'Command the field. Lead from behind the stumps.',
    phase1: 299, phase2: 2000,
    color: '#06B6D4', colorDark: '#0E7490',
    svgPath: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" fill="#06B6D412" stroke="#06B6D430" stroke-width="1.5"/>
      <rect x="19" y="16" width="4" height="22" rx="2" fill="#06B6D4"/>
      <rect x="26" y="16" width="4" height="22" rx="2" fill="#06B6D4"/>
      <rect x="33" y="16" width="4" height="22" rx="2" fill="#06B6D4"/>
      <rect x="17.5" y="13" width="10" height="4" rx="2" fill="#06B6D4" opacity="0.8"/>
      <rect x="28.5" y="13" width="10" height="4" rx="2" fill="#06B6D4" opacity="0.8"/>
      <path d="M15 35 Q13 40 17 42" stroke="#06B6D4" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.55"/>
      <path d="M41 35 Q43 40 39 42" stroke="#06B6D4" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.55"/>
    </svg>`,
  },
  {
    id: 'ar',   emoji: '⭐', icon: 'allrounder', label: 'All-Rounder',
    desc: 'Bat. Bowl. Win matches. The complete cricketer.',
    phase1: 399, phase2: 3000,
    color: '#F59E0B', colorDark: '#B45309',
    svgPath: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" fill="#F59E0B12" stroke="#F59E0B30" stroke-width="1.5"/>
      <path d="M28 10 L31.5 21 L44 21 L34 28.5 L37.5 40 L28 33 L18.5 40 L22 28.5 L12 21 L24.5 21 Z" fill="#F59E0B" opacity="0.9"/>
    </svg>`,
  },
];

const CITIES = [
  'Mumbai','Delhi','Bengaluru','Hyderabad','Pune','Chennai','Kolkata','Ahmedabad',
  'Jaipur','Lucknow','Chandigarh','Kochi','Indore','Nagpur','Bhopal','Patna',
  'Surat','Vadodara','Noida','Gurugram','Agra',
];

const JOURNEY = [
  { phase:'P1', icon:'📝', label:'Register',   sub:'Fill form + pay entry fee',          done:false, active:true  },
  { phase:'P1', icon:'🎬', label:'Upload Video',sub:'2-min trial clip',                  done:false, active:false },
  { phase:'P1', icon:'⏱',  label:'7-Day Result',sub:'BCCI scouts evaluate',              done:false, active:false },
  { phase:'P2', icon:'🏟', label:'Physical Trial',sub:'At your city (if selected)',      done:false, active:false },
  { phase:'P2', icon:'🔨', label:'Auction',    sub:'Franchises bid on you',              done:false, active:false },
  { phase:'P2', icon:'🏆', label:'Play BCPL',  sub:'Represent your franchise',           done:false, active:false },
];

export function Registration() {
  const [, navigate]            = useLocation();
  const [step, setStep]         = useState(1); // 1:details 2:role 3:city 4:pay
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [dob, setDob]           = useState('');
  const [role, setRole]         = useState<typeof ROLES[0] | null>(null);
  const [city, setCity]         = useState('');
  const [cityQ, setCityQ]       = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered    = CITIES.filter(c => c.toLowerCase().includes(cityQ.toLowerCase()));
  const price       = role?.phase1 ?? 299;
  const phase2price = role?.phase2 ?? 2000;

  /* DOB age validation — 18 to 45 years */
  const today   = new Date();
  const maxDob  = new Date(today.getFullYear()-18, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const minDob  = new Date(today.getFullYear()-45, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const dobValid = dob >= minDob && dob <= maxDob;
  const ageError = dob && !dobValid
    ? (dob > maxDob ? 'You must be at least 18 years old to register.' : 'Maximum age limit is 45 years.')
    : '';

  const canNext =
    step === 1 ? !!(name && email && phone.length === 10 && dob && dobValid) :
    step === 2 ? !!role :
    step === 3 ? !!city : agreed;

  /* Login modal state */
  const [showLogin, setShowLogin]   = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp]     = useState('');
  const [loginStep, setLoginStep]   = useState<'phone'|'otp'>('phone');

  /* Video upload state (for already-registered players) */
  const [loggedIn, setLoggedIn]         = useState(false);
  const [videoFile, setVideoFile]       = useState<File|null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploaded, setVideoUploaded]   = useState(false);
  const [videoDragOver, setVideoDragOver]   = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  /* ── New registration + payment state ── */
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError]     = useState('');
  const [payLoading, setPayLoading]     = useState(false);
  const [payError, setPayError]         = useState('');
  const [showPayOtp, setShowPayOtp]     = useState(false);
  const [payOtpStep, setPayOtpStep]     = useState<'phone'|'otp'>('phone');
  const [payOtp, setPayOtp]             = useState('');
  const [payOtpLoading, setPayOtpLoading] = useState(false);
  const [payOtpError, setPayOtpError]   = useState('');

  const handleVideoFile = (file: File) => {
    if (!file.type.startsWith('video/')) { alert('Please select a video file (MP4, MOV, AVI, etc.)'); return; }
    if (file.size > 500 * 1024 * 1024) { alert('File too large. Max size is 500 MB.'); return; }
    setVideoFile(file);
    setVideoUploaded(false);
  };

  const handleVideoUpload = () => {
    if (!videoFile) return;
    setVideoUploading(true);
    setTimeout(() => { setVideoUploading(false); setVideoUploaded(true); }, 2200);
  };

  /* ── Cashfree SDK loader ── */
  const loadCashfreeSDK = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if ((window as any).Cashfree) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Cashfree SDK failed to load'));
      document.head.appendChild(s);
    });

  /* ── Existing login modal (registered players → video upload) ── */
  const handleSendLoginOtp = async () => {
    setLoginLoading(true); setLoginError('');
    try {
      const r = await sendOtp(loginPhone, 'login');
      if (r.devOtp) console.info('[DEV OTP]', r.devOtp);
      setLoginStep('otp');
    } catch (e: any) { setLoginError(e.message ?? 'Failed to send OTP'); }
    finally { setLoginLoading(false); }
  };

  const handleVerifyLoginOtp = async () => {
    setLoginLoading(true); setLoginError('');
    try {
      const r = await verifyOtp(loginPhone, loginOtp, 'login');
      saveAuthToken(r.token, r.user);
      setLoggedIn(true); setShowLogin(false);
    } catch (e: any) { setLoginError(e.message ?? 'Invalid OTP. Please try again.'); }
    finally { setLoginLoading(false); }
  };

  /* ── New registration payment flow ── */
  const doRegisterAndPay = async () => {
    setPayLoading(true); setPayError('');
    try {
      let regId: string;
      try {
        const reg = await registerPhase1({ role: role!.id, trialCity: city });
        regId = reg.registrationId;
      } catch (e: any) {
        // Already registered — get existing regId
        const status = await getRegistrationStatus() as any;
        if (status?.registrationId) { regId = status.registrationId; }
        else throw e;
      }
      const pay = await createPhase1Payment(regId);
      // Store data for receipt page
      sessionStorage.setItem('bcpl_p1_pending', JSON.stringify({ amount: pay.amount, orderId: pay.orderId }));
      // Open Cashfree
      await loadCashfreeSDK();
      const cashfree = (window as any).Cashfree({ mode: 'production' });
      cashfree.checkout({ paymentSessionId: pay.paymentSessionId });
    } catch (e: any) {
      setPayError(e.message ?? 'Payment failed. Please try again.');
      setPayLoading(false);
    }
  };

  const handlePay = () => {
    if (!isAuthenticated()) {
      setShowPayOtp(true); setPayOtpStep('phone'); setPayOtp(''); setPayOtpError('');
    } else {
      doRegisterAndPay();
    }
  };

  const handlePayOtpSend = async () => {
    setPayOtpLoading(true); setPayOtpError('');
    try {
      const r = await sendOtp(phone, 'register');
      if (r.devOtp) console.info('[DEV OTP]', r.devOtp);
      setPayOtpStep('otp');
    } catch (e: any) { setPayOtpError(e.message ?? 'Failed to send OTP'); }
    finally { setPayOtpLoading(false); }
  };

  const handlePayOtpVerify = async () => {
    setPayOtpLoading(true); setPayOtpError('');
    try {
      const r = await verifyOtp(phone, payOtp, 'register', name, email);
      saveAuthToken(r.token, r.user);
      setShowPayOtp(false);
      setPayOtpLoading(false);
      doRegisterAndPay();
    } catch (e: any) {
      setPayOtpError(e.message ?? 'Invalid OTP. Please try again.');
      setPayOtpLoading(false);
    }
  };

  const NAV_LINKS: [string,string][] = [['Home','/'],['Match Center','/match-center'],['Teams','/teams'],['Sponsors','/sponsors'],['About','/about'],['FAQ','/faq'],['Contact','/contact'],['Login','#login']];

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', color:'#F0EDE8', fontFamily:"'Inter',sans-serif", overflowX:'hidden', paddingBottom:'calc(100px + env(safe-area-inset-bottom))' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        /* ── KEYFRAMES ── */
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes pulseOrange{0%,100%{box-shadow:0 0 0 0 rgba(255,122,41,0.5)}50%{box-shadow:0 0 0 10px rgba(255,122,41,0)}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes stepIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes barGrow{from{width:0}to{width:var(--tw)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

        /* ── UTILITY ── */
        .wrap{max-width:1200px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}

        /* ── NAV RESPONSIVE ── */
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .bot-cta{display:flex}
        @media(min-width:1024px){.bot-cta{display:none}}
        /* ── INLINE NAV BUTTONS — hidden on mobile (sticky CTA handles it) ── */
        .form-nav-btns{display:none}
        @media(min-width:1024px){.form-nav-btns{display:flex}}

        /* ── BUTTONS ── */
        .btn-primary{
          background:linear-gradient(135deg,#FF7A29,#D95E10);
          border:none;border-radius:4px;color:#fff;
          font-family:Montserrat,sans-serif;font-weight:900;
          letter-spacing:0.06em;cursor:pointer;
          transition:transform .15s,filter .2s;
          clip-path:polygon(0 0,calc(100% - 12px) 0,100% 100%,0 100%);
        }
        .btn-primary:hover{filter:brightness(1.15);transform:translateY(-2px)}
        .btn-primary:disabled{opacity:.35;cursor:not-allowed;filter:none;transform:none}

        .btn-back{
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:4px;color:rgba(255,255,255,0.6);
          font-family:Montserrat,sans-serif;font-weight:700;
          cursor:pointer;transition:all .2s;
        }
        .btn-back:hover{background:rgba(255,255,255,0.09);color:#fff}

        /* ── INPUTS ── */
        .field-inp{
          width:100%;background:#0C1A2E;
          border:1.5px solid rgba(255,255,255,0.1);
          border-bottom:2px solid rgba(255,122,41,0.4);
          color:#F0EDE8;padding:13px 16px;
          font-family:Inter,sans-serif;font-size:15px;
          outline:none;transition:all .2s;border-radius:0;
        }
        .field-inp:focus{border-bottom-color:#FF7A29;background:#0E1F35}
        .field-inp::placeholder{color:rgba(255,255,255,0.22)}
        .field-lbl{
          display:block;font-size:10px;font-weight:700;
          letter-spacing:.14em;text-transform:uppercase;
          color:rgba(255,255,255,0.38);margin-bottom:6px;
        }

        /* ── ROLE CARD ── */
        .role-card{
          position:relative;overflow:hidden;cursor:pointer;
          border:1px solid rgba(255,255,255,0.08);
          background:#0C1A2E;
          transition:all .22s;
          clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,0 100%);
        }
        .role-card:hover{border-color:rgba(255,255,255,0.22);transform:translateY(-3px)}
        .role-card.selected{border-color:var(--rc,#FF7A29)}
        .role-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:3px;
          background:var(--rc,#FF7A29);transform:scaleX(0);transform-origin:left;
          transition:transform .3s;
        }
        .role-card.selected::before{transform:scaleX(1)}
        .role-card .corner-cut{
          position:absolute;top:0;right:0;width:16px;height:16px;
          background:#06101E;clip-path:polygon(0 0,100% 0,100% 100%);
        }
        .role-card.selected .corner-cut{background:var(--rc,#FF7A29)}

        /* ── ROLES GRID ── */
        .roles-grid{display:grid;grid-template-columns:1fr;gap:12px}
        @media(min-width:480px){.roles-grid{grid-template-columns:repeat(2,1fr);gap:14px}}

        /* ── CITY CHIP ── */
        .city-chip{
          border:1px solid rgba(255,255,255,0.1);border-radius:12px;
          padding:8px 14px;font-size:13px;font-weight:600;
          cursor:pointer;transition:all .15s;background:transparent;color:rgba(255,255,255,0.65);
        }
        .city-chip:hover{border-color:#FF7A29;color:#FF7A29}
        .city-chip.sel{border-color:#FF7A29;background:rgba(255,122,41,0.12);color:#FF7A29;font-weight:700}

        /* ── STEP INDICATOR ── */
        .step-row{display:flex;align-items:center;overflow:hidden}
        .step-node{
          width:30px;height:30px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-family:Montserrat,sans-serif;font-weight:900;font-size:12px;
          border:2px solid rgba(255,255,255,0.15);
          color:rgba(255,255,255,0.3);background:transparent;
          transition:all .3s;flex-shrink:0;
        }
        @media(min-width:400px){.step-node{width:32px;height:32px;font-size:13px}}
        .step-node.done{background:#22C55E;border-color:#22C55E;color:#fff}
        .step-node.active{background:#FF7A29;border-color:#FF7A29;color:#fff;animation:pulseOrange 2s infinite}
        .step-track{height:2px;flex:1;background:rgba(255,255,255,0.08);margin:0 4px;transition:background .4s;min-width:8px}
        .step-track.done{background:#22C55E}
        .step-track.active{background:linear-gradient(90deg,#22C55E,#FF7A29)}
        .step-label{font-size:10px;color:rgba(255,255,255,0.4);font-weight:700;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;margin-left:8px;flex-shrink:0}
        @media(max-width:360px){.step-label{display:none}}

        /* ── TICKET ── */
        .ticket{
          background:#0A1727;
          border:1px solid rgba(255,122,41,0.35);
          position:relative;
          overflow:visible;
        }
        .ticket::before,.ticket::after{
          content:'';position:absolute;
          width:20px;height:20px;border-radius:50%;
          background:#06101E;top:50%;transform:translateY(-50%);
        }
        .ticket::before{left:-10px;border:1px solid rgba(255,122,41,0.35)}
        .ticket::after{right:-10px;border:1px solid rgba(255,122,41,0.35)}
        .ticket-dashed{
          border-top:2px dashed rgba(255,122,41,0.25);
          margin:0 20px;
        }

        /* ── TICKET BODY GRID ── */
        .ticket-info-grid{display:grid;grid-template-columns:1fr;gap:0}
        @media(min-width:400px){.ticket-info-grid{grid-template-columns:1fr 1fr}}

        /* ── WHAT YOU GET GRID ── */
        .what-you-get-grid{display:grid;grid-template-columns:1fr;gap:6px}
        @media(min-width:400px){.what-you-get-grid{grid-template-columns:1fr 1fr}}

        /* ── PHASE 2 GRID ── */
        .phase2-strip-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(min-width:600px){.phase2-strip-grid{grid-template-columns:1fr 1fr}}

        /* ── PHASE BADGE ── */
        .phase-badge{
          display:inline-block;padding:2px 10px;
          font-size:9px;font-weight:900;letter-spacing:.18em;
          text-transform:uppercase;font-family:Montserrat,sans-serif;
        }

        /* ── STEP ENTER ── */
        .step-enter{animation:stepIn .35s cubic-bezier(.34,1.56,.64,1) both}

        /* ── JOURNEY RAIL ── */
        .journey-wrap{display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch}
        .journey-node{
          display:flex;flex-direction:column;align-items:center;gap:6px;
          flex:1;min-width:0;position:relative;
        }
        .journey-node::after{
          content:'';position:absolute;top:18px;left:calc(50% + 20px);
          right:calc(-50% + 20px);height:2px;
          background:rgba(255,255,255,0.1);
        }
        .journey-node:last-child::after{display:none}
        .j-icon{
          width:36px;height:36px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;border:2px solid rgba(255,255,255,0.12);
          background:#0C1A2E;flex-shrink:0;
        }
        .j-icon.p1{border-color:#FF7A29;background:rgba(255,122,41,0.12)}
        .j-icon.p1.active-j{background:#FF7A29}
        .j-icon.p2{border-color:rgba(232,178,61,0.5);background:rgba(232,178,61,0.06)}
        .j-label{font-size:9px;font-weight:700;font-family:Montserrat,sans-serif;letter-spacing:.04em;text-align:center;white-space:nowrap}
        .j-sub{font-size:8px;color:rgba(255,255,255,0.28);line-height:1.3;margin-top:2px;text-align:center}
        @media(max-width:479px){.j-label{display:none}.j-sub{display:none}}

        /* ── FORM FIELD GRIDS ── */
        .field-grid-2{display:grid;grid-template-columns:1fr;gap:16px}
        @media(min-width:480px){.field-grid-2{grid-template-columns:1fr 1fr}}

        /* ── CITY CHIPS CONTAINER ── */
        .city-chips-wrap{display:flex;flex-wrap:wrap;gap:8px;max-height:300px;overflow-y:auto;-webkit-overflow-scrolling:touch}
      `}</style>

      {/* ═══════════════ STICKY TOP WRAPPER (ticker + nav) ═══════════════ */}
      <div style={{ position:'sticky', top:0, zIndex:300 }}>

      {/* ═══════════════ TICKER BAR ═══════════════ */}
      <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 30s linear infinite', gap:0 }}>
          {[...Array(4)].map((_,i) => (
            <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff', paddingRight:0 }}>
              &nbsp;🏏 SEASON 5 REGISTRATIONS OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 50+ CITIES &nbsp;·&nbsp; BACKED BY SOURAV GANGULY &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav style={{ background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {/* Orange top accent line */}
        <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
        <div className="wrap" style={{ height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* Logo — click to go home */}
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', flexShrink:0 }} onClick={()=>navigate('/')}>
            <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{ height:42, width:'auto', objectFit:'contain', display:'block', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}/>
            <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px', whiteSpace:'nowrap', flexShrink:0 }}>
              <span style={{ fontSize:9 }}>🏆</span>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
            </div>
          </div>
          {/* Desktop nav */}
          <div className="desk-nav">
            {NAV_LINKS.map(([l,h]) => <a key={l} href={h} style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, textDecoration:'none', letterSpacing:'.04em', transition:'color .15s' }}>{l}</a>)}
            <a href="/register" className="btn-primary" style={{ padding:'10px 24px', fontSize:12, textDecoration:'none' }}>REGISTER NOW →</a>
          </div>
          {/* Hamburger */}
          <button className="ham-btn" onClick={() => setMenuOpen(o => !o)}>
            {[0,1,2].map(i => <span key={i} style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:1, transition:'all .25s', transform: i===0&&menuOpen ? 'rotate(45deg) translate(5px,5px)' : i===1&&menuOpen ? 'scaleX(0)' : i===2&&menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : '' }} />)}
          </button>
        </div>
      </nav>
      </div>{/* end sticky top wrapper */}

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position:'fixed', inset:0, background:'#040C18', zIndex:400, display:'flex', flexDirection:'column', padding:'72px 24px 40px', overflowY:'auto' }}>
          <button onClick={() => setMenuOpen(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:38, height:38, borderRadius:4, cursor:'pointer', fontSize:18 }}>✕</button>
          {NAV_LINKS.map(([l,h]) => <a key={l} href={h} onClick={()=>setMenuOpen(false)} style={{ color:'rgba(255,255,255,0.85)', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{l}</a>)}
          <a href="/register" className="btn-primary" style={{ marginTop:24, padding:'16px', fontSize:15, textAlign:'center', textDecoration:'none' }}>REGISTER NOW →</a>
        </div>
      )}

      {/* ═══════════════ HERO ═══════════════ */}
      <div style={{ position:'relative', overflow:'hidden', background:'#06101E', paddingTop:40, paddingBottom:0 }}>
        {/* Diagonal orange slash */}
        <div style={{ position:'absolute', top:0, left:'-5%', width:'55%', height:'100%', background:'linear-gradient(135deg, rgba(255,122,41,0.08) 0%, transparent 60%)', transform:'skewX(-8deg)', pointerEvents:'none' }} />
        {/* Right glow */}
        <div style={{ position:'absolute', top:0, right:0, width:'40%', height:'100%', background:'radial-gradient(ellipse at right, rgba(30,64,175,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />

        <div className="wrap">
          {/* Live badge */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.35)', padding:'5px 14px', borderRadius:12 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#FF7A29', display:'inline-block', animation:'liveBlip 1.2s ease-in-out infinite' }} />
              <span style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', color:'#FF7A29', letterSpacing:'.14em' }}>PHASE 1 OPEN NOW</span>
            </div>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>Season 5 · Limited slots per city</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(32px,6vw,64px)', lineHeight:.95, letterSpacing:'-.02em', marginBottom:12, textTransform:'uppercase' }}>
            <span style={{ color:'#fff', display:'block' }}>YOUR SHOT</span>
            <span style={{ color:'#fff', display:'block' }}>AT THE</span>
            <span style={{ background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'shimGold 3s linear infinite', display:'block' }}>BIG LEAGUE.</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, maxWidth:480, lineHeight:1.6, marginBottom:32 }}>
            India's biggest corporate T20 league. 10 franchise teams. BCCI-certified scouts. You send one video — we decide your future in cricket.
          </p>

          {/* ─── JOURNEY RAIL ─── */}
          <div style={{ marginBottom:0, paddingBottom:32 }}>
            <div style={{ fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'rgba(255,255,255,0.3)', marginBottom:16 }}>YOUR COMPLETE TRIAL JOURNEY</div>
            <div className="journey-wrap">
              {JOURNEY.map((j, i) => (
                <div key={i} className="journey-node" style={{ minWidth:56 }}>
                  {/* Phase badge */}
                  <div style={{ fontSize:8, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color: j.phase==='P1' ? '#FF7A29' : '#E8B23D', marginBottom:2 }}>
                    {j.phase}
                  </div>
                  {/* Icon circle */}
                  <div className={`j-icon ${j.phase==='p1'?'p1':'p2'}${j.active?' active-j':''}`} style={{ border:`2px solid ${j.phase==='P1'?'rgba(255,122,41,0.4)':'rgba(232,178,61,0.3)'}`, background: i===0 ? '#FF7A29' : j.phase==='P1'?'rgba(255,122,41,0.08)':'rgba(232,178,61,0.06)' }}>
                    <span style={{ fontSize:14 }}>{j.icon}</span>
                  </div>
                  {/* Label — hidden on very small screens via CSS */}
                  <div>
                    <div className="j-label" style={{ color: i===0 ? '#FF7A29' : j.phase==='P1'?'rgba(255,255,255,0.7)':'rgba(232,178,61,0.6)' }}>{j.label}</div>
                    <div className="j-sub">{j.sub}</div>
                  </div>
                  {/* Connector line */}
                  {i < JOURNEY.length-1 && (
                    <div style={{ position:'absolute', top:24, left:'calc(50% + 20px)', right:'calc(-50% + 20px)', height:2, background: i===0?'rgba(255,122,41,0.4)':'rgba(255,255,255,0.08)', zIndex:0 }} />
                  )}
                </div>
              ))}
            </div>

            {/* Phase divider note */}
            <div style={{ display:'flex', gap:16, marginTop:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                <span style={{ width:12, height:12, borderRadius:'50%', background:'rgba(255,122,41,0.3)', border:'1px solid #FF7A29', display:'inline-block' }} />
                Phase 1 — Video Trial: ₹299 / ₹399
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                <span style={{ width:12, height:12, borderRadius:'50%', background:'rgba(232,178,61,0.15)', border:'1px solid rgba(232,178,61,0.5)', display:'inline-block' }} />
                Phase 2 — Physical Trial (if selected): ₹2,000 / ₹3,000
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ ORANGE DIVIDER ═══════════════ */}
      <div style={{ height:3, background:'linear-gradient(90deg,transparent,#FF7A29,#E8B23D,#FF7A29,transparent)' }} />

      {/* ═══════════════ FORM SECTION ═══════════════ */}
      <div className="wrap" style={{ paddingTop:40 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:32 }}>

          {/* ─── LEFT: FORM ─── */}
          <div style={{ maxWidth:680 }}>

            {/* Step progress bar */}
            <div className="step-row" style={{ marginBottom:32 }}>
              {[1,2,3,4].map((s,i) => (
                <React.Fragment key={s}>
                  <div className={`step-node ${step>s?'done':step===s?'active':''}`}>
                    {step > s ? '✓' : s}
                  </div>
                  {i < 3 && <div className={`step-track ${step>s?'done':step===s?'active':''}`} />}
                </React.Fragment>
              ))}
              <div className="step-label">
                Step {step} of 4
              </div>
            </div>

            {/* ─── STEP 1: Personal Details ─── */}
            {step === 1 && (
              <div className="step-enter">
                <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:28 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,5vw,22px)', color:'#fff', textTransform:'uppercase', letterSpacing:'.02em' }}>Your Details</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>As per Aadhaar / PAN — used for franchise records</div>
                  <a href="/eligibility" style={{ fontSize:11, color:'#FF7A29', textDecoration:'none', fontWeight:700, display:'inline-block', marginTop:6 }}>Check eligibility criteria →</a>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:20 }}>
                  <div>
                    <label className="field-lbl">Full Name *</label>
                    <input className="field-inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Kumar Sharma" autoFocus />
                  </div>
                  <div className="field-grid-2">
                    <div>
                      <label className="field-lbl">Email *</label>
                      <input className="field-inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className="field-lbl">Phone *</label>
                      <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                        <span style={{ padding:'0 12px', height:46, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,122,41,0.25)', borderRight:'none', fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.6)', flexShrink:0, borderRadius:'8px 0 0 8px', letterSpacing:'.02em' }}>+91</span>
                        <input className="field-inp" type="tel" value={phone}
                          onChange={e => { const v = e.target.value.replace(/\D/g,''); if(v.length<=10) setPhone(v); }}
                          placeholder="9876543210" maxLength={10} inputMode="numeric"
                          style={{ borderRadius:'0 8px 8px 0', borderLeft:'none', flex:1 }} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="field-lbl">Date of Birth (18–45 yrs)</label>
                    <input className="field-inp" type="date" value={dob} onChange={e => setDob(e.target.value)} min={minDob} max={maxDob} style={{ colorScheme:'dark' }} />
                    {ageError && <div style={{fontSize:11,color:'#EF4444',marginTop:5,fontWeight:600}}>⚠ {ageError}</div>}
                  </div>
                </div>

                {/* Already registered? */}
                {!loggedIn ? (
                  <div style={{ marginTop:20, padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>Already registered Phase 1? Upload your video directly.</span>
                    <button onClick={() => { setShowLogin(true); setLoginStep('phone'); setLoginPhone(''); setLoginOtp(''); }} style={{ background:'none', border:'1px solid rgba(255,122,41,0.4)', color:'#FF7A29', fontSize:11, fontWeight:700, padding:'6px 14px', cursor:'pointer', fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em', flexShrink:0, borderRadius:6 }}>LOGIN →</button>
                  </div>
                ) : (
                  /* ── VIDEO UPLOAD SECTION (shown after login) ── */
                  <div style={{ marginTop:20 }}>
                    <div style={{ padding:'14px 16px', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:10, display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                      <span style={{ fontSize:18 }}>✅</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#22C55E', fontFamily:'Montserrat,sans-serif' }}>Logged in as +91 {loginPhone}</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Upload your 2-minute trial video below</div>
                      </div>
                      <button onClick={()=>{ setLoggedIn(false); setVideoFile(null); setVideoUploaded(false); }} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:16 }}>✕</button>
                    </div>

                    {/* Upload zone */}
                    <div
                      onDragOver={e=>{ e.preventDefault(); setVideoDragOver(true); }}
                      onDragLeave={()=>setVideoDragOver(false)}
                      onDrop={e=>{ e.preventDefault(); setVideoDragOver(false); const f=e.dataTransfer.files[0]; if(f) handleVideoFile(f); }}
                      onClick={()=>videoInputRef.current?.click()}
                      style={{ border:`2px dashed ${videoDragOver?'#FF7A29':'rgba(255,122,41,0.3)'}`, borderRadius:12, padding:'28px 20px', textAlign:'center', cursor:'pointer', background:videoDragOver?'rgba(255,122,41,0.06)':'rgba(255,122,41,0.02)', transition:'all .2s', marginBottom:12 }}
                    >
                      <input ref={videoInputRef} type="file" accept="video/*" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if(f) handleVideoFile(f); }}/>
                      {videoFile ? (
                        <div>
                          <div style={{ fontSize:28, marginBottom:8 }}>🎬</div>
                          <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:4, wordBreak:'break-all' }}>{videoFile.name}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{(videoFile.size/1024/1024).toFixed(1)} MB · Click to change</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize:36, marginBottom:10 }}>📹</div>
                          <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:4 }}>Tap to select video or drag & drop</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>MP4, MOV, AVI · Max 2 minutes · Max 500 MB</div>
                        </div>
                      )}
                    </div>

                    {/* Tips */}
                    <div style={{ marginBottom:16, display:'flex', flexDirection:'column', gap:5 }}>
                      {['🏏 Show batting, bowling, or fielding based on your role','📍 Any outdoor/indoor ground — no studio needed','⏱ Keep it under 2 minutes for best results'].map(t=>(
                        <div key={t} style={{ fontSize:11, color:'rgba(255,255,255,0.4)', display:'flex', gap:6 }}><span style={{flexShrink:0}}></span>{t}</div>
                      ))}
                    </div>

                    {videoUploaded ? (
                      <div style={{ padding:'16px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.4)', borderRadius:10, textAlign:'center' }}>
                        <div style={{ fontSize:24, marginBottom:6 }}>✅</div>
                        <div style={{ fontSize:14, fontWeight:800, color:'#22C55E', fontFamily:'Montserrat,sans-serif' }}>Video Uploaded Successfully!</div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:4 }}>BCCI scouts will review within 7 working days. Result via SMS + Email.</div>
                      </div>
                    ) : (
                      <button
                        disabled={!videoFile || videoUploading}
                        onClick={handleVideoUpload}
                        style={{ width:'100%', padding:'16px 0', background:videoFile?'linear-gradient(135deg,#FF7A29,#C94E0E)':'rgba(255,255,255,0.06)', border:'none', borderRadius:10, color:videoFile?'#fff':'rgba(255,255,255,0.3)', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, cursor:videoFile?'pointer':'not-allowed', letterSpacing:'.06em', transition:'all .2s' }}
                      >
                        {videoUploading ? '⏳ Uploading...' : '🎬 SUBMIT TRIAL VIDEO →'}
                      </button>
                    )}
                  </div>
                )}

                {/* Login Modal */}
                {showLogin && (
                  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
                    <div style={{ background:'#0C1A2E', border:'1px solid rgba(255,122,41,0.3)', borderRadius:16, padding:28, width:'100%', maxWidth:380, position:'relative' }}>
                      <button onClick={() => setShowLogin(false)} style={{ position:'absolute', top:12, right:14, background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:18, cursor:'pointer' }}>✕</button>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:18, color:'#fff', marginBottom:6 }}>Registered Player Login</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:20 }}>Enter your registered mobile number to continue.</div>
                      {loginStep === 'phone' ? (<>
                        <label style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'.08em', display:'block', marginBottom:6 }}>MOBILE NUMBER</label>
                        <input className="field-inp" type="tel" inputMode="numeric" maxLength={10} value={loginPhone}
                          onChange={e => { const v=e.target.value.replace(/\D/g,''); if(v.length<=10) setLoginPhone(v); }}
                          placeholder="10-digit number" style={{ marginBottom:16, width:'100%' }} />
                        {loginError && <div style={{ fontSize:12, color:'#EF4444', marginBottom:10, fontWeight:600 }}>⚠ {loginError}</div>}
                        <button disabled={loginPhone.length!==10 || loginLoading} onClick={handleSendLoginOtp}
                          style={{ width:'100%', padding:'13px 0', background:'linear-gradient(135deg,#FF7A29,#C94E0E)', border:'none', borderRadius:10, color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, cursor:'pointer', opacity:loginPhone.length!==10||loginLoading?0.5:1 }}>
                          {loginLoading ? '⏳ Sending...' : 'Send OTP →'}
                        </button>
                      </>) : (<>
                        <div style={{ fontSize:12, color:'#22C55E', marginBottom:12 }}>✅ OTP sent to +91 {loginPhone}</div>
                        <label style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'.08em', display:'block', marginBottom:6 }}>ENTER OTP</label>
                        <input className="field-inp" type="tel" inputMode="numeric" maxLength={6} value={loginOtp}
                          onChange={e => { const v=e.target.value.replace(/\D/g,''); if(v.length<=6) setLoginOtp(v); }}
                          placeholder="6-digit OTP" style={{ marginBottom:16, width:'100%', letterSpacing:'0.3em', fontSize:20, textAlign:'center' }} />
                        {loginError && <div style={{ fontSize:12, color:'#EF4444', marginBottom:10, fontWeight:600 }}>⚠ {loginError}</div>}
                        <button disabled={loginOtp.length!==6 || loginLoading} onClick={handleVerifyLoginOtp}
                          style={{ width:'100%', padding:'13px 0', background:'linear-gradient(135deg,#FF7A29,#C94E0E)', border:'none', borderRadius:10, color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, cursor:'pointer', opacity:loginOtp.length!==6||loginLoading?0.5:1 }}>
                          {loginLoading ? '⏳ Verifying...' : 'Verify & Login →'}
                        </button>
                        <button onClick={() => { setLoginStep('phone'); setLoginError(''); }} style={{ width:'100%', marginTop:8, padding:'10px', background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.4)', fontSize:12, cursor:'pointer' }}>← Change Number</button>
                      </>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 2: Role ─── */}
            {step === 2 && (
              <div className="step-enter">
                <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:28 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,5vw,22px)', color:'#fff', textTransform:'uppercase', letterSpacing:'.02em' }}>Your Role</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>Scouts evaluate you specifically for this role. Every player brings equal value to the game.</div>
                </div>

                <div className="roles-grid">
                  {ROLES.map(r => (
                    <div
                      key={r.id}
                      className={`role-card${role?.id===r.id?' selected':''}`}
                      style={{ '--rc': r.color } as any}
                      onClick={() => setRole(r)}
                      tabIndex={0}
                      onKeyDown={e => e.key==='Enter'&&setRole(r)}
                    >
                      <div className="corner-cut" />
                      <div style={{ padding:'18px 16px 16px' }}>
                        {/* Top row */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                          {/* Role icon */}
                          <img src={import.meta.env.BASE_URL + 'bcpl-assets/role-icons/' + r.icon + '.png'} alt={r.label}
                            style={{ width:64, height:64, objectFit:'contain', flexShrink:0 }} />
                          {role?.id === r.id && (
                            <div style={{ width:20, height:20, borderRadius:'50%', background:r.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff' }}>✓</div>
                          )}
                        </div>

                        {/* Name */}
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#fff', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{r.label}</div>
                        <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginBottom:14, lineHeight:1.5 }}>{r.desc}</div>

                        {/* Price rows */}
                        <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:12, display:'flex', flexDirection:'column', gap:8 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div>
                              <div style={{ fontSize:11, fontWeight:700, color:'#FF7A29', letterSpacing:'.1em', fontFamily:'Montserrat,sans-serif' }}>PHASE 1</div>
                              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Video Trial Entry</div>
                            </div>
                            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:24, color: role?.id===r.id ? r.color : '#fff' }}>₹{r.phase1}</div>
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', opacity:.55 }}>
                            <div>
                              <div style={{ fontSize:11, fontWeight:700, color:'#E8B23D', letterSpacing:'.1em', fontFamily:'Montserrat,sans-serif' }}>PHASE 2 🔒</div>
                              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Physical Trial (if selected)</div>
                            </div>
                            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:18, color:'rgba(232,178,61,0.7)' }}>₹{r.phase2.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {role && (
                  <div style={{ marginTop:16, padding:'12px 16px', background:`${role.color}10`, border:`1px solid ${role.color}30`, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <span style={{ fontSize:18 }}>{role.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#fff', fontFamily:'Montserrat,sans-serif' }}>{role.label} selected</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Phase 1 fee: ₹{role.phase1} · Phase 2 (if selected): ₹{role.phase2.toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize:18, color:'#22C55E' }}>✓</div>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 3: City ─── */}
            {step === 3 && (
              <div className="step-enter">
                <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:24 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,5vw,22px)', color:'#fff', textTransform:'uppercase', letterSpacing:'.02em' }}>Trial City</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>50+ cities across India. Choose the city nearest to your home or workplace.</div>
                </div>

                {/* Search */}
                <div style={{ position:'relative', marginBottom:20 }}>
                  <input
                    className="field-inp"
                    placeholder="🔍  Search your city..."
                    value={cityQ}
                    onChange={e => { setCityQ(e.target.value); setCity(''); setShowDrop(true); }}
                    onFocus={() => setShowDrop(true)}
                    onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                  />
                  {showDrop && cityQ && (
                    <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#0C1A2E', border:'1px solid rgba(255,122,41,0.3)', zIndex:99, maxHeight:200, overflowY:'auto' }}>
                      {filtered.slice(0,8).map(c => (
                        <div key={c} onMouseDown={() => { setCity(c); setCityQ(c); setShowDrop(false); }} style={{ padding:'12px 16px', cursor:'pointer', fontSize:14, color:'rgba(255,255,255,0.8)', borderBottom:'1px solid rgba(255,255,255,0.05)', transition:'background .12s' }} onMouseEnter={e => (e.currentTarget.style.background='rgba(255,122,41,0.1)')} onMouseLeave={e => (e.currentTarget.style.background='')}>
                          📍 {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick chips */}
                <div className="city-chips-wrap">
                  {CITIES.map(c => (
                    <button key={c} className={`city-chip${city===c?' sel':''}`} onClick={() => { setCity(c); setCityQ(c); }}>
                      {c}
                    </button>
                  ))}
                </div>

                {city && (
                  <div style={{ marginTop:20, padding:'14px 18px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.3)', display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:20 }}>📍</span>
                    <div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:16, color:'#22C55E' }}>{city}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>If selected in Phase 1, your physical trial will be held in this city</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 4: Payment ─── */}
            {step === 4 && (
              <div className="step-enter">
                <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:24 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,5vw,22px)', color:'#fff', textTransform:'uppercase', letterSpacing:'.02em' }}>Confirm & Pay</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>Phase 1 entry fee. No hidden charges. Phase 2 fee payable only if selected.</div>
                </div>

                {/* ── MATCH TICKET ── */}
                <div className="ticket" style={{ borderRadius:0, marginBottom:24 }}>
                  {/* Ticket header */}
                  <div style={{ background:'linear-gradient(135deg,#FF7A29,#C94E0E)', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                    <div>
                      <div style={{ fontSize:8, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.2em', color:'rgba(255,255,255,0.7)', marginBottom:3 }}>BCPL · SEASON 5</div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff', letterSpacing:'.04em' }}>PHASE 1 TRIAL ENTRY</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.6)', letterSpacing:'.14em' }}>ENTRY FEE</div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:36, color:'#fff', lineHeight:1 }}>₹{price}</div>
                    </div>
                  </div>

                  {/* Ticket body */}
                  <div style={{ padding:'0 24px' }}>
                    {/* Player info rows */}
                    <div className="ticket-info-grid" style={{ paddingTop:18, paddingBottom:16 }}>
                      {[
                        { l:'PLAYER NAME', v:name || '—' },
                        { l:'ROLE', v:role ? `${role.emoji} ${role.label}` : '—' },
                        { l:'TRIAL CITY', v:city || '—' },
                        { l:'SEASON', v:'5 · 2025–26' },
                      ].map(row => (
                        <div key={row.l} style={{ padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize:9, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'rgba(255,255,255,0.3)', marginBottom:4 }}>{row.l}</div>
                          <div style={{ fontSize:13, fontWeight:600, color:'#F0EDE8' }}>{row.v}</div>
                        </div>
                      ))}
                    </div>

                    <div className="ticket-dashed" />

                    {/* Inclusions */}
                    <div style={{ padding:'14px 0' }}>
                      <div style={{ fontSize:9, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'rgba(255,255,255,0.3)', marginBottom:10 }}>WHAT YOU GET</div>
                      <div className="what-you-get-grid">
                        {[
                          '✅ BCCI-certified scout evaluation',
                          '✅ Selection results announced promptly',
                          '✅ Zero auction / tournament fee',
                          '✅ Result guarantee (or full refund)',
                          '✅ Phase 2 invite if selected',
                        ].map(t => <div key={t} style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.5 }}>{t}</div>)}
                      </div>
                    </div>

                    <div className="ticket-dashed" />

                    {/* Phase 2 teaser */}
                    <div style={{ padding:'14px 0 16px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                            <span style={{ fontSize:10 }}>🔒</span>
                            <span style={{ fontSize:9, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'rgba(232,178,61,0.6)' }}>PHASE 2 (IF SELECTED)</span>
                          </div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Physical trial at {city||'your city'} — pay only if selected</div>
                        </div>
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'rgba(232,178,61,0.6)' }}>₹{phase2price.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms checkbox */}
                <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', marginBottom:20, padding:'14px 16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop:2, accentColor:'#FF7A29', width:16, height:16, flexShrink:0 }} />
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>
                    I confirm I am a working professional aged 18–45, not under a first-class cricket contract, and I agree to the{' '}
                    <a href="/terms" style={{ color:'#FF7A29', textDecoration:'none', fontWeight:600 }}>Terms & Conditions</a>,{' '}
                    <a href="/refunds" style={{ color:'#FF7A29', textDecoration:'none', fontWeight:600 }}>Refund Policy</a>, and{' '}
                    <a href="/eligibility" style={{ color:'#FF7A29', textDecoration:'none', fontWeight:600 }}>Eligibility Criteria</a>.
                  </span>
                </label>

                {/* GST Breakdown */}
                <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'14px 16px', marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>Registration Fee</span>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>₹{price}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10, paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>GST (18%)</span>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>₹{Math.round(price * 0.18)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:14, fontWeight:800, color:'#FF7A29', fontFamily:'Montserrat,sans-serif' }}>Total Payable</span>
                    <span style={{ fontSize:16, fontWeight:900, color:'#FF7A29', fontFamily:'Montserrat,sans-serif' }}>₹{Math.round(price * 1.18)}</span>
                  </div>
                </div>

                {/* Pay CTA */}
                <button
                  className="btn-primary"
                  disabled={!agreed || payLoading}
                  style={{ width:'100%', padding:'20px 0', fontSize:17, clipPath:'none', borderRadius:12, letterSpacing:'.08em' }}
                  onClick={handlePay}
                >
                  {payLoading ? '⏳ Processing...' : `🏏  PAY ₹${price} · ENTER PHASE 1`}
                </button>
                {payError && (
                  <div style={{ marginTop:12, padding:'12px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, fontSize:13, color:'#EF4444', fontWeight:600 }}>
                    ⚠ {payError}
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:12, flexWrap:'wrap' }}>
                  {['🔒 Cashfree Secured','256-bit SSL','BCPL'].map(t => (
                    <span key={t} style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:600 }}>{t}</span>
                  ))}
                </div>
                {/* TEST MODE — remove before go-live */}
                {agreed && (
                  <div style={{ marginTop:20, textAlign:'center', borderTop:'1px dashed rgba(255,255,255,0.08)', paddingTop:14 }}>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.15)', marginBottom:8, letterSpacing:'.08em' }}>— TEST MODE ONLY —</div>
                    <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/payment-receipt?name='+encodeURIComponent(name)+'&role='+encodeURIComponent(role?.label||'Batsman')+'&city='+encodeURIComponent(city)+'&amount='+price; }}
                        style={{ padding:'6px 14px', background:'none', border:'1px dashed rgba(34,197,94,0.3)', borderRadius:8, color:'rgba(34,197,94,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, letterSpacing:'.06em' }}>
                        → Skip to Phase 1 Receipt
                      </button>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/upload-video'; }}
                        style={{ padding:'6px 14px', background:'none', border:'1px dashed rgba(34,197,94,0.3)', borderRadius:8, color:'rgba(34,197,94,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, letterSpacing:'.06em' }}>
                        → Video Upload Page
                      </button>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/result'; }}
                        style={{ padding:'6px 14px', background:'none', border:'1px dashed rgba(34,197,94,0.3)', borderRadius:8, color:'rgba(34,197,94,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, letterSpacing:'.06em' }}>
                        → Result Page
                      </button>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/phase2/payment'; }}
                        style={{ padding:'6px 14px', background:'none', border:'1px dashed rgba(232,178,61,0.3)', borderRadius:8, color:'rgba(232,178,61,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, letterSpacing:'.06em' }}>
                        → Phase 2 Payment
                      </button>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/phase2/payment-receipt'; }}
                        style={{ padding:'6px 14px', background:'none', border:'1px dashed rgba(232,178,61,0.3)', borderRadius:8, color:'rgba(232,178,61,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, letterSpacing:'.06em' }}>
                        → Phase 2 Receipt
                      </button>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/phase2/kyc'; }}
                        style={{ padding:'6px 14px', background:'none', border:'1px dashed rgba(232,178,61,0.3)', borderRadius:8, color:'rgba(232,178,61,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, letterSpacing:'.06em' }}>
                        → Phase 2 KYC
                      </button>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/phase2/kyc-approved'; }}
                        style={{ padding:'6px 14px', background:'none', border:'1px dashed rgba(232,178,61,0.3)', borderRadius:8, color:'rgba(232,178,61,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, letterSpacing:'.06em' }}>
                        → KYC Approved
                      </button>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'auction/selected'; }}
                        style={{ padding:'6px 14px', background:'none', border:'1px dashed rgba(232,178,61,0.3)', borderRadius:8, color:'rgba(232,178,61,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, letterSpacing:'.06em' }}>
                        → Auction Selected
                      </button>
                      <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'profile'; }}
                        style={{ padding:'6px 14px', background:'none', border:'1px dashed rgba(34,197,94,0.3)', borderRadius:8, color:'rgba(34,197,94,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, letterSpacing:'.06em' }}>
                        → Player Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── NAV BUTTONS — hidden on mobile (sticky bottom CTA handles it) ─── */}
            <div className="form-nav-btns" style={{ gap:12, marginTop:28 }}>
              {step > 1 && (
                <button className="btn-back" style={{ flex:1, padding:'14px', fontSize:13, letterSpacing:'.06em' }} onClick={() => setStep(s => s - 1)}>
                  ← BACK
                </button>
              )}
              {step < 4 && (
                <button className="btn-primary" disabled={!canNext} onClick={() => canNext && setStep(s => s + 1)} style={{ flex:2, padding:'14px 0', fontSize:14, clipPath:'none', borderRadius:12, letterSpacing:'.06em' }}>
                  CONTINUE →
                </button>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Info sidebar (desktop) ─── */}
        </div>
      </div>

      {/* ═══════════════ PHASE 2 INFO STRIP ═══════════════ */}
      <div className="wrap" style={{ marginTop:48 }}>
        <div style={{ background:'#0A1727', border:'1px solid rgba(232,178,61,0.2)', padding:'24px 20px', position:'relative', overflow:'hidden' }}>
          {/* Diagonal accent */}
          <div style={{ position:'absolute', top:0, right:0, width:160, height:'100%', background:'linear-gradient(135deg, transparent 50%, rgba(232,178,61,0.05) 100%)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:'0 0 auto' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.2em', color:'#E8B23D', marginBottom:6 }}>🔒 PHASE 2 — PHYSICAL TRIAL</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'rgba(255,255,255,0.8)' }}>Only for selected players.</div>
            </div>
            <div style={{ flex:1, minWidth:240 }}>
              <div className="phase2-strip-grid">
                {[
                  { icon:'🏟', label:'Ground Trial', sub:'At your registered city' },
                  { icon:'📋', label:'Skill Evaluation', sub:'By franchise coaching staff' },
                  { icon:'🔨', label:'Live Auction', sub:'Franchises bid on you publicly' },
                  { icon:'💰', label:'Phase 2 Fee', sub:'₹2,000 (Bat/Bowl/WK) · ₹3,000 (AR)' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <span style={{ fontSize:18 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)', fontFamily:'Montserrat,sans-serif' }}>{item.label}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ PAY OTP MODAL (new registration) ═══════════════ */}
      {showPayOtp && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#0C1A2E', border:'1px solid rgba(255,122,41,0.35)', borderRadius:16, padding:28, width:'100%', maxWidth:380, position:'relative' }}>
            <button onClick={() => setShowPayOtp(false)} style={{ position:'absolute', top:12, right:14, background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:18, cursor:'pointer' }}>✕</button>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:18, color:'#fff', marginBottom:4 }}>Verify Your Number</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:20 }}>One-time OTP to confirm your identity before payment.</div>
            {payOtpStep === 'phone' ? (<>
              <label style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'.08em', display:'block', marginBottom:6 }}>MOBILE NUMBER</label>
              <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:16 }}>
                <span style={{ padding:'0 12px', height:46, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,122,41,0.25)', borderRight:'none', fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.6)', flexShrink:0 }}>+91</span>
                <div className="field-inp" style={{ flex:1, display:'flex', alignItems:'center', borderLeft:'none', pointerEvents:'none', opacity:.7 }}>{phone}</div>
              </div>
              {payOtpError && <div style={{ fontSize:12, color:'#EF4444', marginBottom:10, fontWeight:600 }}>⚠ {payOtpError}</div>}
              <button disabled={payOtpLoading} onClick={handlePayOtpSend}
                style={{ width:'100%', padding:'13px 0', background:'linear-gradient(135deg,#FF7A29,#C94E0E)', border:'none', borderRadius:10, color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, cursor:'pointer', opacity:payOtpLoading?0.5:1 }}>
                {payOtpLoading ? '⏳ Sending...' : `Send OTP to +91 ${phone} →`}
              </button>
            </>) : (<>
              <div style={{ fontSize:12, color:'#22C55E', marginBottom:12 }}>✅ OTP sent to +91 {phone}</div>
              <label style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'.08em', display:'block', marginBottom:6 }}>ENTER OTP</label>
              <input className="field-inp" type="tel" inputMode="numeric" maxLength={6} value={payOtp}
                onChange={e => { const v=e.target.value.replace(/\D/g,''); if(v.length<=6) setPayOtp(v); }}
                placeholder="6-digit OTP" style={{ marginBottom:16, width:'100%', letterSpacing:'0.3em', fontSize:20, textAlign:'center' }} autoFocus />
              {payOtpError && <div style={{ fontSize:12, color:'#EF4444', marginBottom:10, fontWeight:600 }}>⚠ {payOtpError}</div>}
              <button disabled={payOtp.length!==6 || payOtpLoading} onClick={handlePayOtpVerify}
                style={{ width:'100%', padding:'13px 0', background:'linear-gradient(135deg,#FF7A29,#C94E0E)', border:'none', borderRadius:10, color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, cursor:'pointer', opacity:payOtp.length!==6||payOtpLoading?0.5:1 }}>
                {payOtpLoading ? '⏳ Verifying...' : 'Verify & Pay →'}
              </button>
              <button onClick={() => { setPayOtpStep('phone'); setPayOtpError(''); }} style={{ width:'100%', marginTop:8, padding:'10px', background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.4)', fontSize:12, cursor:'pointer' }}>← Back</button>
            </>)}
          </div>
        </div>
      )}

      {/* Footer */}
      <BCPLFooter />

      {/* ═══════════════ MOBILE STICKY CTA — hidden on step 4 (inline pay button handles it) ═══════════════ */}
      {step < 4 && (
        <div className="bot-cta" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:500, padding:'10px 16px calc(20px + env(safe-area-inset-bottom))', background:'rgba(4,10,20,0.98)', backdropFilter:'blur(20px)', borderTop:'2px solid #FF7A29', gap:10 }}>
          <button
            className="btn-primary"
            disabled={!canNext}
            onClick={() => canNext && setStep(s => s + 1)}
            style={{ flex:2, padding:'15px 0', fontSize:14, clipPath:'none', borderRadius:12, letterSpacing:'.06em' }}
          >
            CONTINUE →
          </button>
          <button
            style={{ flex:1, padding:'15px 0', background:'linear-gradient(135deg,#25D366,#1BA851)', border:'none', borderRadius:12, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em' }}
            onClick={() => window.open('https://wa.me/918800000000?text=Hi+BCPL+team,+I+need+help+with+registration', '_blank')}
          >
            💬 WHATSAPP
          </button>
        </div>
      )}
    </div>
  );
}
