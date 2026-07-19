import React, { useState } from 'react';

/*
  BCPL T20 — Bhartiya Corporate Premier League
  World's largest corporate cricket league for working professionals
  Run by Kriparti Playing 11 Pvt. Ltd. | Brand Ambassador: Sourav Ganguly
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
    id: 'bat',  emoji: '🏏', label: 'Batsman',
    desc: 'Open the innings. Anchor the chase.',
    phase1: 299, phase2: 2000,
    color: '#3B82F6', colorDark: '#1D4ED8',
  },
  {
    id: 'bowl', emoji: '🎳', label: 'Bowler',
    desc: 'Take wickets. Change the game.',
    phase1: 299, phase2: 2000,
    color: '#8B5CF6', colorDark: '#6D28D9',
  },
  {
    id: 'wk',   emoji: '🧤', label: 'Wicket-Keeper',
    desc: 'Command the field. Lead from behind the stumps.',
    phase1: 299, phase2: 2000,
    color: '#06B6D4', colorDark: '#0E7490',
  },
  {
    id: 'ar',   emoji: '⭐', label: 'All-Rounder',
    desc: 'Bat. Bowl. Win matches. Most wanted at auction.',
    phase1: 399, phase2: 3000,
    color: '#F59E0B', colorDark: '#B45309',
    premium: true,
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
  const [step, setStep]         = useState(1); // 1:details 2:role 3:city 4:pay
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [company, setCompany]   = useState('');
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
  const canNext     =
    step === 1 ? !!(name && email && phone && company) :
    step === 2 ? !!role :
    step === 3 ? !!city : agreed;

  const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', color:'#F0EDE8', fontFamily:"'Inter',sans-serif", overflowX:'hidden', paddingBottom:100 }}>
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
        .wrap{max-width:1200px;margin:0 auto;padding:0 20px}
        @media(min-width:768px){.wrap{padding:0 32px}}

        /* ── NAV RESPONSIVE ── */
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .bot-cta{display:flex}
        @media(min-width:1024px){.bot-cta{display:none}}

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

        /* ── CITY CHIP ── */
        .city-chip{
          border:1px solid rgba(255,255,255,0.1);border-radius:12px;
          padding:8px 14px;font-size:13px;font-weight:600;
          cursor:pointer;transition:all .15s;background:transparent;color:rgba(255,255,255,0.65);
        }
        .city-chip:hover{border-color:#FF7A29;color:#FF7A29}
        .city-chip.sel{border-color:#FF7A29;background:rgba(255,122,41,0.12);color:#FF7A29;font-weight:700}

        /* ── STEP INDICATOR ── */
        .step-node{
          width:32px;height:32px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-family:Montserrat,sans-serif;font-weight:900;font-size:13px;
          border:2px solid rgba(255,255,255,0.15);
          color:rgba(255,255,255,0.3);background:transparent;
          transition:all .3s;flex-shrink:0;
        }
        .step-node.done{background:#22C55E;border-color:#22C55E;color:#fff}
        .step-node.active{background:#FF7A29;border-color:#FF7A29;color:#fff;animation:pulseOrange 2s infinite}
        .step-track{height:2px;flex:1;background:rgba(255,255,255,0.08);margin:0 4px;transition:background .4s}
        .step-track.done{background:#22C55E}
        .step-track.active{background:linear-gradient(90deg,#22C55E,#FF7A29)}

        /* ── TICKET ── */
        .ticket{
          background:#0A1727;
          border:1px solid rgba(255,122,41,0.35);
          position:relative;
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

        /* ── PHASE BADGE ── */
        .phase-badge{
          display:inline-block;padding:2px 10px;
          font-size:9px;font-weight:900;letter-spacing:.18em;
          text-transform:uppercase;font-family:Montserrat,sans-serif;
        }

        /* ── STEP ENTER ── */
        .step-enter{animation:stepIn .35s cubic-bezier(.34,1.56,.64,1) both}

        /* ── JOURNEY RAIL ── */
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
      `}</style>

      {/* ═══════════════ TICKER BAR ═══════════════ */}
      <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 30s linear infinite', gap:0 }}>
          {[...Array(4)].map((_,i) => (
            <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff', paddingRight:0 }}>
              &nbsp;🏏 SEASON 5 REGISTRATIONS OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 21 TRIAL CITIES &nbsp;·&nbsp; BACKED BY SOURAV GANGULY &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav style={{ position:'sticky', top:0, zIndex:300, background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {/* Orange top accent line */}
        <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
        <div className="wrap" style={{ height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, lineHeight:1 }}>
              <span style={{ color:'#FF7A29' }}>BCPL</span>
              <span style={{ color:'#fff' }}> T20</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', borderLeft:'2px solid rgba(255,122,41,0.4)', paddingLeft:10, gap:1 }}>
              <span style={{ fontSize:8, fontWeight:800, color:'#FF7A29', letterSpacing:'.16em' }}>SEASON 5</span>
              <span style={{ fontSize:7, color:'rgba(255,255,255,0.35)', letterSpacing:'.08em' }}>KRIPARTI PLAYING11</span>
            </div>
          </div>
          {/* Desktop nav */}
          <div className="desk-nav">
            {NAV.map(l => <a key={l} href="#" style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, textDecoration:'none', letterSpacing:'.04em', transition:'color .15s' }}>{l}</a>)}
            <button className="btn-primary" style={{ padding:'10px 24px', fontSize:12 }}>REGISTER NOW →</button>
          </div>
          {/* Hamburger */}
          <button className="ham-btn" onClick={() => setMenuOpen(o => !o)}>
            {[0,1,2].map(i => <span key={i} style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:1, transition:'all .25s', transform: i===0&&menuOpen ? 'rotate(45deg) translate(5px,5px)' : i===1&&menuOpen ? 'scaleX(0)' : i===2&&menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : '' }} />)}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position:'fixed', inset:0, background:'#040C18', zIndex:400, display:'flex', flexDirection:'column', padding:'72px 24px 40px', overflowY:'auto' }}>
          <button onClick={() => setMenuOpen(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:38, height:38, borderRadius:4, cursor:'pointer', fontSize:18 }}>✕</button>
          {NAV.map(l => <a key={l} href="#" style={{ color:'rgba(255,255,255,0.85)', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{l}</a>)}
          <button className="btn-primary" style={{ marginTop:24, padding:'16px', fontSize:15 }}>REGISTER NOW →</button>
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
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
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
            <div style={{ display:'flex', alignItems:'flex-start', gap:0, overflowX:'auto', paddingBottom:8 }}>
              {JOURNEY.map((j, i) => (
                <div key={i} className="journey-node" style={{ minWidth:80 }}>
                  {/* Phase badge */}
                  <div style={{ fontSize:8, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color: j.phase==='P1' ? '#FF7A29' : '#E8B23D', marginBottom:2 }}>
                    {j.phase}
                  </div>
                  {/* Icon circle */}
                  <div className={`j-icon ${j.phase==='p1'?'p1':'p2'}${j.active?' active-j':''}`} style={{ border:`2px solid ${j.phase==='P1'?'rgba(255,122,41,0.4)':'rgba(232,178,61,0.3)'}`, background: i===0 ? '#FF7A29' : j.phase==='P1'?'rgba(255,122,41,0.08)':'rgba(232,178,61,0.06)' }}>
                    <span style={{ fontSize:14 }}>{j.icon}</span>
                  </div>
                  {/* Label */}
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:10, fontWeight:700, color: i===0 ? '#FF7A29' : j.phase==='P1'?'rgba(255,255,255,0.7)':'rgba(232,178,61,0.6)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.04em', whiteSpace:'nowrap' }}>{j.label}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.28)', lineHeight:1.3, marginTop:2 }}>{j.sub}</div>
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
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:32 }} className="form-grid">

          {/* ─── LEFT: FORM ─── */}
          <div style={{ maxWidth:680 }}>

            {/* Step progress bar */}
            <div style={{ display:'flex', alignItems:'center', marginBottom:32 }}>
              {[1,2,3,4].map((s,i) => (
                <React.Fragment key={s}>
                  <div className={`step-node ${step>s?'done':step===s?'active':''}`}>
                    {step > s ? '✓' : s}
                  </div>
                  {i < 3 && <div className={`step-track ${step>s?'done':step===s?'active':''}`} />}
                </React.Fragment>
              ))}
              <div style={{ marginLeft:12, fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
                Step {step} of 4
              </div>
            </div>

            {/* ─── STEP 1: Personal Details ─── */}
            {step === 1 && (
              <div className="step-enter">
                <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:28 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff', textTransform:'uppercase', letterSpacing:'.02em' }}>Your Details</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>As per Aadhaar / PAN — used for franchise records</div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:20 }}>
                  <div>
                    <label className="field-lbl">Full Name *</label>
                    <input className="field-inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Kumar Sharma" autoFocus />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <label className="field-lbl">Work Email *</label>
                      <input className="field-inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
                    </div>
                    <div>
                      <label className="field-lbl">Phone *</label>
                      <input className="field-inp" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <label className="field-lbl">Company / Organisation *</label>
                      <input className="field-inp" value={company} onChange={e => setCompany(e.target.value)} placeholder="Your Employer / Business" />
                    </div>
                    <div>
                      <label className="field-lbl">Date of Birth (18–45 yrs)</label>
                      <input className="field-inp" type="date" value={dob} onChange={e => setDob(e.target.value)} style={{ colorScheme:'dark' }} />
                    </div>
                  </div>
                </div>

                {/* Already registered? */}
                <div style={{ marginTop:20, padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>Already registered Phase 1? Upload your video directly.</span>
                  <button style={{ background:'none', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:700, padding:'6px 14px', cursor:'pointer', fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em' }}>LOGIN →</button>
                </div>
              </div>
            )}

            {/* ─── STEP 2: Role ─── */}
            {step === 2 && (
              <div className="step-enter">
                <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:28 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff', textTransform:'uppercase', letterSpacing:'.02em' }}>Your Role</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>Scouts evaluate you specifically for this role. All-Rounders are highest valued at auction.</div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
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
                          <span style={{ fontSize:28 }}>{r.emoji}</span>
                          {r.premium && (
                            <div style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.4)', padding:'2px 8px', fontSize:8, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'#F59E0B' }}>
                              PREMIUM
                            </div>
                          )}
                          {role?.id === r.id && (
                            <div style={{ width:20, height:20, borderRadius:'50%', background:r.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff' }}>✓</div>
                          )}
                        </div>

                        {/* Name */}
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#fff', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{r.label}</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:14, lineHeight:1.4 }}>{r.desc}</div>

                        {/* Price rows */}
                        <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:12, display:'flex', flexDirection:'column', gap:6 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div>
                              <div style={{ fontSize:9, fontWeight:700, color:'#FF7A29', letterSpacing:'.12em', fontFamily:'Montserrat,sans-serif' }}>PHASE 1</div>
                              <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)' }}>Video Trial Entry</div>
                            </div>
                            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color: role?.id===r.id ? r.color : '#fff' }}>₹{r.phase1}</div>
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', opacity:.55 }}>
                            <div>
                              <div style={{ fontSize:9, fontWeight:700, color:'#E8B23D', letterSpacing:'.12em', fontFamily:'Montserrat,sans-serif' }}>PHASE 2 🔒</div>
                              <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)' }}>Physical Trial (if selected)</div>
                            </div>
                            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:16, color:'rgba(232,178,61,0.7)' }}>₹{r.phase2.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {role && (
                  <div style={{ marginTop:16, padding:'12px 16px', background:`${role.color}10`, border:`1px solid ${role.color}30`, display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>{role.emoji}</span>
                    <div style={{ flex:1 }}>
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
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff', textTransform:'uppercase', letterSpacing:'.02em' }}>Trial City</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>21 cities across India. Choose nearest to your home or workplace.</div>
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
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
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
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Phase 1 & Phase 2 trials will be conducted here</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 4: Payment ─── */}
            {step === 4 && (
              <div className="step-enter">
                <div style={{ borderLeft:'3px solid #FF7A29', paddingLeft:14, marginBottom:24 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff', textTransform:'uppercase', letterSpacing:'.02em' }}>Confirm & Pay</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>Phase 1 entry fee. No hidden charges. Phase 2 fee payable only if selected.</div>
                </div>

                {/* ── MATCH TICKET ── */}
                <div className="ticket" style={{ borderRadius:0, marginBottom:24 }}>
                  {/* Ticket header */}
                  <div style={{ background:'linear-gradient(135deg,#FF7A29,#C94E0E)', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:8, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.2em', color:'rgba(255,255,255,0.7)', marginBottom:3 }}>BCPL T20 · SEASON 5</div>
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
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, paddingTop:18, paddingBottom:16 }}>
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
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                        {[
                          '✅ BCCI-certified scout evaluation',
                          '✅ Result within 7 working days',
                          '✅ Franchise auction eligibility',
                          '✅ Zero auction/tournament fee',
                          '✅ 7-day refund if not reviewed',
                          '✅ Phase 2 invite if selected',
                        ].map(t => <div key={t} style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>{t}</div>)}
                      </div>
                    </div>

                    <div className="ticket-dashed" />

                    {/* Phase 2 teaser */}
                    <div style={{ padding:'14px 0 16px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
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
                    <a href="#" style={{ color:'#FF7A29', textDecoration:'none', fontWeight:600 }}>Terms & Conditions</a>,{' '}
                    <a href="#" style={{ color:'#FF7A29', textDecoration:'none', fontWeight:600 }}>Refund Policy</a>, and{' '}
                    <a href="#" style={{ color:'#FF7A29', textDecoration:'none', fontWeight:600 }}>Eligibility Criteria</a>.
                  </span>
                </label>

                {/* Pay CTA */}
                <button
                  className="btn-primary"
                  disabled={!agreed}
                  style={{ width:'100%', padding:'20px 0', fontSize:17, clipPath:'none', borderRadius:12, letterSpacing:'.08em' }}
                >
                  🏏 &nbsp;PAY ₹{price} · ENTER PHASE 1 TRIALS
                </button>
                <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:12 }}>
                  {['🔒 Razorpay Secured','256-bit SSL','Kriparti Playing11'].map(t => (
                    <span key={t} style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:600 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ─── NAV BUTTONS ─── */}
            <div style={{ display:'flex', gap:12, marginTop:28 }}>
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
        <div style={{ background:'#0A1727', border:'1px solid rgba(232,178,61,0.2)', padding:'24px 28px', position:'relative', overflow:'hidden' }}>
          {/* Diagonal accent */}
          <div style={{ position:'absolute', top:0, right:0, width:160, height:'100%', background:'linear-gradient(135deg, transparent 50%, rgba(232,178,61,0.05) 100%)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:'0 0 auto' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.2em', color:'#E8B23D', marginBottom:6 }}>🔒 PHASE 2 — PHYSICAL TRIAL</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'rgba(255,255,255,0.8)' }}>Only for selected players.</div>
            </div>
            <div style={{ flex:1, minWidth:240 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
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

      {/* ═══════════════ MOBILE STICKY CTA ═══════════════ */}
      <div className="bot-cta" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:500, padding:'10px 16px 20px', background:'rgba(4,10,20,0.98)', backdropFilter:'blur(20px)', borderTop:'2px solid #FF7A29', gap:10 }}>
        <button
          className="btn-primary"
          disabled={!canNext}
          onClick={() => canNext && (step < 4 ? setStep(s => s + 1) : null)}
          style={{ flex:2, padding:'15px 0', fontSize:14, clipPath:'none', borderRadius:12, letterSpacing:'.06em' }}
        >
          {step < 4 ? 'CONTINUE →' : `PAY ₹${price} · ENTER TRIALS`}
        </button>
        <button style={{ flex:1, padding:'15px 0', background:'linear-gradient(135deg,#25D366,#1BA851)', border:'none', borderRadius:12, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em' }}>
          💬 WHATSAPP
        </button>
      </div>
    </div>
  );
}
