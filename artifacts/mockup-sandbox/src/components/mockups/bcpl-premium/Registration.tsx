import React from 'react';

/* ─── CONSTANTS ──────────────────────────────────────────────────── */
const CITIES = ["Mumbai","Delhi","Bengaluru","Hyderabad","Ahmedabad","Chennai","Kolkata","Pune","Jaipur","Surat","Lucknow","Kanpur","Nagpur","Indore","Thane","Bhopal","Visakhapatnam","Patna","Vadodara","Ghaziabad","Ludhiana","Agra","Nashik","Faridabad","Meerut","Rajkot","Varanasi","Aurangabad","Dhanbad","Amritsar","Navi Mumbai","Allahabad","Ranchi","Howrah","Coimbatore","Jabalpur","Gwalior","Vijayawada","Jodhpur","Madurai","Raipur","Kota","Guwahati","Chandigarh","Noida","Gurugram","Bhubaneswar","Kochi","Mysuru","Tiruchirappalli","Dehradun","Mangaluru","Aligarh","Bareilly","Moradabad","Gorakhpur","Bikaner","Siliguri","Salem","Warangal"].sort();

const ROLES = [
  { id:'batsman',  emoji:'🏏', title:'Batsman',        price:299, color:'#3B82F6', desc:'Opener to finisher. Every team needs run-machines.'},
  { id:'bowler',   emoji:'🎳', title:'Bowler',         price:299, color:'#8B5CF6', desc:'Fast, medium, spin — wickets win matches.'},
  { id:'wk',       emoji:'🧤', title:'Wicket-Keeper',  price:299, color:'#06B6D4', desc:'The backbone. The loudest voice on the ground.'},
  { id:'allrounder',emoji:'⭐', title:'All-Rounder',   price:399, color:'#F59E0B', desc:'Can do both? We pay premium for rare talents.'},
];

const STEPS = [
  { n:1, label:'Details' },
  { n:2, label:'Role'    },
  { n:3, label:'City'    },
  { n:4, label:'Video'   },
  { n:5, label:'Pay'     },
];

/* ─── CRICKET BALL SVG ──────────────────────────────────────────── */
function CricketBall({ active, done, n }: { active:boolean; done:boolean; n:number }) {
  const c = active ? '#FF7A29' : done ? '#22C55E' : 'rgba(255,255,255,0.15)';
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ filter: active ? 'drop-shadow(0 0 10px #FF7A29)' : done ? 'drop-shadow(0 0 8px #22C55E)' : 'none' }}>
      <circle cx="20" cy="20" r="18" fill={c} stroke={active ? '#FF7A29' : done ? '#22C55E' : 'rgba(255,255,255,0.1)'} strokeWidth="2"/>
      {!done && (
        <>
          <path d="M10,17 Q15,14 20,17 Q25,20 30,17" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10,23 Q15,26 20,23 Q25,20 30,23" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
        </>
      )}
      <text x="20" y="25" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff" fontFamily="Montserrat,sans-serif">
        {done ? '✓' : n}
      </text>
    </svg>
  );
}

/* ─── STADIUM BG SVG ─────────────────────────────────────────────── */
function StadiumBg() {
  return (
    <svg viewBox="0 0 800 320" style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'auto', opacity:0.12 }} preserveAspectRatio="xMidYMax meet">
      {/* stands */}
      <path d="M0,320 L0,180 Q100,160 200,170 Q300,180 400,160 Q500,140 600,160 Q700,175 800,165 L800,320 Z" fill="#1E40AF"/>
      {/* floodlight poles */}
      <rect x="30" y="20" width="6" height="180" fill="#334155"/>
      <rect x="760" y="20" width="6" height="180" fill="#334155"/>
      {/* floodlight heads */}
      <rect x="10" y="10" width="46" height="18" rx="3" fill="#64748B"/>
      <rect x="740" y="10" width="46" height="18" rx="3" fill="#64748B"/>
      {/* pitch */}
      <rect x="320" y="200" width="160" height="120" rx="4" fill="#2D5016" opacity="0.6"/>
      <rect x="346" y="200" width="108" height="120" rx="2" fill="#3D6B20" opacity="0.6"/>
      {/* crease lines */}
      <line x1="330" y1="230" x2="470" y2="230" stroke="#fff" strokeWidth="2" opacity="0.6"/>
      <line x1="330" y1="280" x2="470" y2="280" stroke="#fff" strokeWidth="2" opacity="0.6"/>
    </svg>
  );
}

/* ─── NAVBAR ─────────────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = React.useState(false);
  const links = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
  return (
    <>
      <nav style={{ position:'sticky', top:0, zIndex:200, background:'rgba(6,14,28,0.96)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 1px 0 0 rgba(255,122,41,0.25)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 20px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, letterSpacing:'-0.5px' }}>
            <span style={{ color:'#FF7A29' }}>BCPL</span>
            <span style={{ color:'#fff', marginLeft:2 }}>T20</span>
            <span style={{ fontSize:10, color:'rgba(255,122,41,0.7)', fontWeight:600, letterSpacing:'0.15em', marginLeft:8, verticalAlign:'middle' }}>SEASON 5</span>
          </div>
          <div className="desk-nav">
            {links.map(l => <a key={l} href="#" style={{ color:'rgba(255,255,255,0.65)', fontWeight:600, fontSize:13, textDecoration:'none', fontFamily:'Inter,sans-serif', padding:'4px 0', borderBottom:'2px solid transparent', transition:'all 0.2s' }}>{l}</a>)}
            <button className="btn-fire" style={{ padding:'10px 22px', fontSize:13.5, borderRadius:12 }}>Register ₹299 →</button>
          </div>
          <button onClick={() => setOpen(o => !o)} style={{ background:'none', border:'none', cursor:'pointer', padding:8, display:'flex', flexDirection:'column', gap:5, zIndex:300 }} className="ham-btn">
            {[0,1,2].map(i => <span key={i} style={{ display:'block', width:24, height:2, background:'#fff', borderRadius:2, transition:'all 0.25s', transform: i===0&&open?'rotate(45deg) translate(5px,5px)':i===1&&open?'scaleX(0)':i===2&&open?'rotate(-45deg) translate(5px,-5px)':'' }} />)}
          </button>
        </div>
      </nav>
      {open && (
        <div style={{ position:'fixed', inset:0, background:'#06101E', zIndex:250, display:'flex', flexDirection:'column', padding:'80px 24px 40px', overflowY:'auto' }}>
          <button onClick={() => setOpen(false)} style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:40, height:40, borderRadius:10, cursor:'pointer', fontSize:18 }}>✕</button>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:26, marginBottom:36 }}><span style={{ color:'#FF7A29' }}>BCPL</span><span style={{ color:'#fff', marginLeft:3 }}>T20</span></div>
          {links.map(l => <a key={l} href="#" onClick={() => setOpen(false)} style={{ color:'rgba(255,255,255,0.9)', fontWeight:700, fontSize:20, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'block' }}>{l}</a>)}
          <button className="btn-fire" style={{ marginTop:32, height:56, fontSize:17, borderRadius:16, width:'100%' }}>📝 Register for ₹299 →</button>
        </div>
      )}
    </>
  );
}

/* ─── MAIN REGISTRATION COMPONENT ───────────────────────────────── */
export function Registration() {
  const [step, setStep] = React.useState(1);
  const [role, setRole] = React.useState('');
  const [city, setCity] = React.useState('');
  const [citySearch, setCitySearch] = React.useState('');
  const [showCities, setShowCities] = React.useState(false);
  const [form, setForm] = React.useState({ name:'', email:'', phone:'', company:'', dob:'' });
  const [agreed, setAgreed] = React.useState(false);

  const price = ROLES.find(r => r.id === role)?.price ?? 299;
  const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 12);

  const canNext = () => {
    if (step===1) return form.name && form.email && form.phone;
    if (step===2) return !!role;
    if (step===3) return !!city;
    if (step===4) return true;
    return agreed;
  };

  return (
    <div style={{ background:'#060E1C', minHeight:'100vh', fontFamily:'Inter,sans-serif', color:'#F8F4EE', overflowX:'hidden', paddingBottom:100 }}>
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        
        /* ── Animations ── */
        @keyframes gradShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatUp {
          0%   { opacity:0; transform:translateY(24px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow:0 0 16px rgba(255,122,41,0.4); }
          50%      { box-shadow:0 0 36px rgba(255,122,41,0.8), 0 0 60px rgba(255,122,41,0.3); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes rotateBall {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        @keyframes tickerMove {
          from { transform:translateX(100%); }
          to   { transform:translateX(-100%); }
        }
        @keyframes scanPulse {
          0%,100% { opacity:0.03; }
          50%     { opacity:0.08; }
        }
        @keyframes ringExpand {
          0%   { transform:scale(0.8); opacity:1; }
          100% { transform:scale(1.6); opacity:0; }
        }
        @keyframes slideRight {
          from { opacity:0; transform:translateX(-20px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slideLeft {
          from { opacity:0; transform:translateX(20px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes countPop {
          0%   { transform:scale(1); }
          50%  { transform:scale(1.12); }
          100% { transform:scale(1); }
        }
        @keyframes floatParticle {
          0%   { transform:translateY(0px) rotate(0deg); opacity:0.4; }
          50%  { opacity:0.8; }
          100% { transform:translateY(-80px) rotate(180deg); opacity:0; }
        }
        @keyframes liveBlip {
          0%,100% { opacity:1; }
          50%      { opacity:0.2; }
        }

        /* ── Layout ── */
        .wrap { max-width:1280px; margin:0 auto; padding:0 20px; }
        .desk-nav { display:none; align-items:center; gap:22px; }
        .ham-btn  { display:flex; }
        .bot-cta  { display:flex; }
        .side-col { display:none; }

        @media(min-width:768px) {
          .wrap { padding:0 32px; }
        }
        @media(min-width:1024px) {
          .desk-nav { display:flex!important; }
          .ham-btn  { display:none!important; }
          .bot-cta  { display:none!important; }
          .side-col { display:block; }
          .reg-layout { display:grid!important; grid-template-columns:1fr 360px; gap:40px; align-items:start; }
        }

        /* ── Fire Button ── */
        .btn-fire {
          background: linear-gradient(135deg, #FF7A29 0%, #E8611A 60%, #C94E0E 100%);
          border: none; border-radius: 14px; color: #fff;
          font-family: Montserrat,sans-serif; font-weight: 800; cursor: pointer;
          box-shadow: 0 8px 28px rgba(255,122,41,0.45), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: transform 0.15s, box-shadow 0.2s;
          letter-spacing: 0.02em;
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .btn-fire:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(255,122,41,0.6); }
        .btn-fire:active { transform: translateY(0) scale(0.97); }

        /* ── Glass Card ── */
        .glass-card {
          background: linear-gradient(135deg, rgba(15,34,71,0.9) 0%, rgba(10,22,46,0.85) 100%);
          backdrop-filter: blur(32px);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
        }

        /* ── Premium Input ── */
        .inp {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 14px; color: #F8F4EE;
          padding: 15px 18px; font-family: Inter,sans-serif; font-size: 15px;
          outline: none; transition: all 0.25s; appearance: none;
        }
        .inp:focus { border-color: #FF7A29; background: rgba(255,122,41,0.06); box-shadow: 0 0 0 4px rgba(255,122,41,0.12); }
        .inp::placeholder { color: rgba(255,255,255,0.28); }
        .inp option { background: #0A1628; }

        /* ── Label ── */
        .lbl {
          font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 8px; display: block;
        }

        /* ── Role Card ── */
        .role-card {
          background: rgba(15,34,71,0.6);
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 18px; cursor: pointer;
          transition: all 0.25s; padding: 20px; position: relative; overflow: hidden;
        }
        .role-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, var(--rc,#FF7A29), transparent 60%);
          opacity: 0; transition: opacity 0.3s;
        }
        .role-card:hover::before { opacity: 0.08; }
        .role-card.active { border-color: var(--rc,#FF7A29); box-shadow: 0 0 0 1px var(--rc,#FF7A29), 0 8px 32px rgba(0,0,0,0.4); }
        .role-card.active::before { opacity: 0.12; }

        /* ── Shimmer Text ── */
        .shimmer-gold {
          background: linear-gradient(90deg, #E8B23D 0%, #FFD700 30%, #E8B23D 60%, #F5C842 80%, #E8B23D 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        /* ── Progress Node ── */
        .prog-node { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .prog-node.active-node::after {
          content: ''; position: absolute; top: 0; left: 0; width: 40px; height: 40px;
          border-radius: 50%; border: 2px solid #FF7A29;
          animation: ringExpand 1.8s ease-out infinite;
        }

        /* ── City Dropdown ── */
        .city-drop {
          position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 100;
          background: #0D2040; border: 1px solid rgba(255,122,41,0.3);
          border-radius: 14px; max-height: 240px; overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        }
        .city-item { padding: 13px 18px; cursor: pointer; font-size: 14px; color: rgba(255,255,255,0.8); transition: background 0.15s; }
        .city-item:hover { background: rgba(255,122,41,0.15); color: #FF7A29; }

        /* ── Scrollbar ── */
        .city-drop::-webkit-scrollbar { width: 4px; }
        .city-drop::-webkit-scrollbar-track { background: transparent; }
        .city-drop::-webkit-scrollbar-thumb { background: rgba(255,122,41,0.4); border-radius: 4px; }

        /* ── Step Animation ── */
        .step-enter { animation: slideLeft 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }

        /* ── WhatsApp btn ── */
        .btn-wa { background: linear-gradient(135deg,#25D366,#1BA851); border:none; border-radius:14px; color:#fff; font-weight:700; cursor:pointer; font-family:Montserrat,sans-serif; transition: transform 0.15s; }
        .btn-wa:active { transform: scale(0.97); }
      `}</style>

      {/* ── AMBIENT BG ─────────────────────────────────────────── */}
      <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
        {/* Gradient mesh */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%), radial-gradient(ellipse 70% 60% at 50% 80%, rgba(15,34,71,0.4) 0%, transparent 70%)' }} />
        {/* Stadium */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, opacity:0.07 }}><StadiumBg /></div>
        {/* Scan line effect */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)', animation:'scanPulse 4s ease-in-out infinite' }} />
        {/* Floating particles */}
        {[...Array(8)].map((_,i) => (
          <div key={i} style={{ position:'absolute', width:3, height:3, borderRadius:'50%', background:i%3===0?'#FF7A29':i%3===1?'#E8B23D':'rgba(255,255,255,0.5)', left:`${10+i*12}%`, bottom:`${10+i*8}%`, animation:`floatParticle ${4+i*0.7}s ease-in-out ${i*0.5}s infinite` }} />
        ))}
      </div>

      {/* ── ANNOUNCEMENT BAR ────────────────────────────────────── */}
      <div style={{ position:'relative', zIndex:10, background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', color:'#fff', padding:'11px 20px', textAlign:'center', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontWeight:800, fontSize:12, letterSpacing:'0.15em', fontFamily:'Montserrat,sans-serif' }}>🏏 SEASON 5 REGISTRATION OPEN</span>
          <span style={{ width:1, height:14, background:'rgba(255,255,255,0.4)', display:'inline-block' }} />
          <span style={{ fontSize:12, fontWeight:600 }}>Limited seats per city · #OfficeSeStadiumtak</span>
          <span style={{ width:1, height:14, background:'rgba(255,255,255,0.4)', display:'inline-block' }} />
          <span style={{ fontSize:12, fontWeight:700 }}>⚡ Register before slots fill</span>
        </div>
      </div>

      <div style={{ position:'relative', zIndex:10 }}>
        <Navbar />
      </div>

      {/* ── STICKY PROGRESS BAR ─────────────────────────────────── */}
      <div style={{ position:'sticky', top:64, zIndex:150, background:'rgba(6,14,28,0.97)', backdropFilter:'blur(28px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'16px 0' }}>
        <div className="wrap">
          <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'flex-start', maxWidth:520, margin:'0 auto' }}>
            {/* connector line */}
            <div style={{ position:'absolute', top:20, left:20, right:20, height:2, background:'rgba(255,255,255,0.07)', zIndex:0 }} />
            {/* filled line */}
            <div style={{ position:'absolute', top:20, left:20, height:2, width:`${((step-1)/(STEPS.length-1))*100}%`, background:'linear-gradient(90deg,#FF7A29,#E8B23D)', zIndex:1, transition:'width 0.5s ease', maxWidth:'calc(100% - 40px)' }} />
            {STEPS.map(s => (
              <div key={s.n} className={`prog-node${step===s.n?' active-node':''}`} style={{ zIndex:2 }}>
                <CricketBall active={step===s.n} done={step>s.n} n={s.n} />
                <span style={{ fontSize:10, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'0.05em', color:step===s.n?'#FF7A29':step>s.n?'#22C55E':'rgba(255,255,255,0.3)', whiteSpace:'nowrap' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HERO STRIP ──────────────────────────────────────────── */}
      <div style={{ position:'relative', zIndex:5, paddingTop:40, paddingBottom:32 }}>
        <div className="wrap">
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <span style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.3)', borderRadius:100, padding:'5px 14px', fontSize:11, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'#FF7A29', letterSpacing:'0.1em' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#FF7A29', animation:'liveBlip 1.2s ease-in-out infinite' }} />
              REGISTRATION LIVE
            </span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>Step {step} of 5</span>
          </div>
          <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(28px,6vw,52px)', lineHeight:1.05, marginBottom:12, letterSpacing:'-0.02em' }}>
            Your Shot.<br/>
            <span className="shimmer-gold">Your Season.</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:15, lineHeight:1.6, maxWidth:480 }}>
            5,000+ corporate professionals already chasing their cricket dream. ₹299 is all it takes.
          </p>
        </div>
      </div>

      {/* ── LIVE SOCIAL PROOF TICKER ────────────────────────────── */}
      <div style={{ position:'relative', zIndex:5, borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.02)', padding:'10px 0', overflow:'hidden', marginBottom:0 }}>
        <div style={{ whiteSpace:'nowrap', animation:'tickerMove 20s linear infinite', display:'inline-block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.4)', letterSpacing:'0.04em' }}>
          {['🏏 Rahul S. from Pune just registered','🎳 Priya M. from Mumbai shortlisted','🏆 Arjun K. playing for Delhi Dynamos','⭐ 23 people registering right now','🧤 WK slots filling fast in Bengaluru','✅ Ravi T. from Hyderabad confirmed','🏏 Rahul S. from Pune just registered','🎳 Priya M. from Mumbai shortlisted','🏆 Arjun K. playing for Delhi Dynamos'].join('   ·   ')}
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <div className="wrap" style={{ position:'relative', zIndex:5, paddingTop:32 }}>
        <div className="reg-layout" style={{ display:'block' }}>

          {/* ── LEFT: FORM ─────────────────────────────────────── */}
          <div>
            {/* STEP 1: PERSONAL DETAILS */}
            {step===1 && (
              <div className="glass-card step-enter" style={{ padding:32 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#FF7A29,#E8611A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📋</div>
                  <div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:20, color:'#fff' }}>Personal Details</div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Exactly as on your Aadhaar / PAN</div>
                  </div>
                </div>

                {/* Returning user strip */}
                <div style={{ background:'rgba(255,122,41,0.07)', border:'1px solid rgba(255,122,41,0.2)', borderRadius:14, padding:'14px 18px', marginBottom:28, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Already registered? Upload your video</span>
                  <button style={{ background:'transparent', border:'1px solid rgba(255,122,41,0.5)', color:'#FF7A29', borderRadius:10, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Montserrat,sans-serif', whiteSpace:'nowrap' }}>Login →</button>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:18 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:18 }} className="form-row">
                    <div>
                      <label className="lbl">Full Name *</label>
                      <input className="inp" placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} />
                    </div>
                    <div>
                      <label className="lbl">Work Email *</label>
                      <input className="inp" type="email" placeholder="rahul@company.com" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:18 }} className="form-row">
                    <div>
                      <label className="lbl">Phone Number *</label>
                      <input className="inp" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))} />
                    </div>
                    <div>
                      <label className="lbl">Date of Birth</label>
                      <input className="inp" type="date" value={form.dob} onChange={e => setForm(f => ({...f,dob:e.target.value}))} style={{ colorScheme:'dark' }} />
                    </div>
                  </div>
                  <div>
                    <label className="lbl">Company / Organisation</label>
                    <input className="inp" placeholder="Where do you work?" value={form.company} onChange={e => setForm(f => ({...f,company:e.target.value}))} />
                  </div>
                </div>

                {/* Mini trust */}
                <div style={{ marginTop:28, display:'flex', gap:20, flexWrap:'wrap' }}>
                  {['🔒 256-bit SSL','✅ Zero spam, ever','🔄 7-day refund'].map(t => (
                    <span key={t} style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: ROLE SELECTION */}
            {step===2 && (
              <div className="step-enter">
                <div className="glass-card" style={{ padding:32, marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                    <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#8B5CF6,#6D28D9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🎯</div>
                    <div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:20, color:'#fff' }}>Choose Your Role</div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2 }}>This determines your fee and which scouts assess you</div>
                    </div>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {ROLES.map(r => (
                    <div key={r.id} className={`role-card${role===r.id?' active':''}`} style={{ '--rc':r.color } as any} onClick={() => setRole(r.id)}>
                      <div style={{ fontSize:28, marginBottom:10 }}>{r.emoji}</div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:17, color:'#fff', marginBottom:6 }}>{r.title}</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.5, marginBottom:14 }}>{r.desc}</div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color: role===r.id ? r.color : '#fff' }}>₹{r.price}</span>
                        {r.id==='allrounder' && <span style={{ fontSize:10, background:'rgba(245,158,11,0.2)', color:'#F59E0B', border:'1px solid rgba(245,158,11,0.4)', borderRadius:6, padding:'3px 8px', fontWeight:700, letterSpacing:'0.08em' }}>PREMIUM</span>}
                      </div>
                      {role===r.id && (
                        <div style={{ position:'absolute', top:14, right:14, width:22, height:22, borderRadius:'50%', background:r.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700 }}>✓</div>
                      )}
                    </div>
                  ))}
                </div>

                {role && (
                  <div style={{ marginTop:20, background:'rgba(255,122,41,0.08)', border:'1px solid rgba(255,122,41,0.25)', borderRadius:16, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', animation:'floatUp 0.3s ease both' }}>
                    <span style={{ fontSize:14, color:'rgba(255,255,255,0.7)' }}>Selected: <strong style={{ color:'#fff' }}>{ROLES.find(r2=>r2.id===role)?.title}</strong></span>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#FF7A29', animation:'countPop 0.4s ease' }}>₹{price}</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: CITY */}
            {step===3 && (
              <div className="glass-card step-enter" style={{ padding:32 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#06B6D4,#0891B2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📍</div>
                  <div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:20, color:'#fff' }}>Select Your Trial City</div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2 }}>75 cities across India — find your nearest ground</div>
                  </div>
                </div>

                <div style={{ position:'relative' }}>
                  <label className="lbl">Search City</label>
                  <input
                    className="inp"
                    placeholder="Type your city name..."
                    value={citySearch}
                    onChange={e => { setCitySearch(e.target.value); setShowCities(true); setCity(''); }}
                    onFocus={() => setShowCities(true)}
                  />
                  {showCities && citySearch && (
                    <div className="city-drop">
                      {filteredCities.length > 0
                        ? filteredCities.map(c => (
                          <div key={c} className="city-item" onClick={() => { setCity(c); setCitySearch(c); setShowCities(false); }}>
                            📍 {c}
                          </div>
                        ))
                        : <div style={{ padding:'14px 18px', fontSize:13, color:'rgba(255,255,255,0.3)' }}>No city found. Contact us!</div>
                      }
                    </div>
                  )}
                </div>

                {city && (
                  <div style={{ marginTop:20, background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.3)', borderRadius:14, padding:'16px 20px', animation:'floatUp 0.3s ease both' }}>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:'0.08em', marginBottom:6 }}>SELECTED CITY</div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:22, color:'#06B6D4' }}>📍 {city}</div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:6 }}>Trials are conducted at the nearest BCPL-partner ground in your city.</div>
                  </div>
                )}

                {/* City grid preview */}
                <div style={{ marginTop:24 }}>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.08em', marginBottom:12, textTransform:'uppercase' }}>Popular Cities</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {['Mumbai','Delhi','Bengaluru','Hyderabad','Chennai','Pune','Kolkata','Jaipur'].map(c => (
                      <button key={c} onClick={() => { setCity(c); setCitySearch(c); setShowCities(false); }} style={{ background: city===c ? 'rgba(255,122,41,0.2)' : 'rgba(255,255,255,0.05)', border: city===c ? '1px solid rgba(255,122,41,0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 14px', fontSize:12, fontWeight:600, color: city===c ? '#FF7A29' : 'rgba(255,255,255,0.6)', cursor:'pointer', transition:'all 0.2s', fontFamily:'Inter,sans-serif' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: VIDEO */}
            {step===4 && (
              <div className="step-enter">
                <div className="glass-card" style={{ padding:32, marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                    <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#EC4899,#BE185D)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🎬</div>
                    <div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:20, color:'#fff' }}>Video Upload (Next Step)</div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2 }}>After payment — upload your 60-second showcase</div>
                    </div>
                  </div>

                  {/* Video upload preview area */}
                  <div style={{ border:'2px dashed rgba(255,255,255,0.15)', borderRadius:18, padding:40, textAlign:'center', background:'rgba(255,255,255,0.02)', position:'relative', overflow:'hidden' }}>
                    <div style={{ fontSize:40, marginBottom:16 }}>🎥</div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:18, color:'#fff', marginBottom:8 }}>Your Cricket Showcase</div>
                    <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7, maxWidth:320, margin:'0 auto' }}>
                      Record 60 seconds of yourself batting, bowling, or keeping. No professional setup needed — phone camera is fine.
                    </div>
                    <button style={{ marginTop:20, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'12px 28px', fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.7)', cursor:'pointer', fontFamily:'Montserrat,sans-serif' }}>
                      📁 Upload after payment
                    </button>
                  </div>
                </div>

                {/* Tips */}
                <div className="glass-card" style={{ padding:24 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:16, color:'#E8B23D', marginBottom:16 }}>📋 Video Tips from Scouts</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {[
                      { n:'01', t:'Record in daylight or bright light', c:'rgba(255,255,255,0.7)' },
                      { n:'02', t:'Show your natural stance & shot selection', c:'rgba(255,255,255,0.7)' },
                      { n:'03', t:'Keep background clean — cricket ground preferred', c:'rgba(255,255,255,0.7)' },
                      { n:'04', t:'Confidence matters more than perfection', c:'#FF7A29', bold:true },
                    ].map(tip => (
                      <div key={tip.n} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                        <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, color:'#FF7A29', opacity:0.6, minWidth:24, paddingTop:2 }}>{tip.n}</span>
                        <span style={{ fontSize:14, color:tip.c, fontWeight:tip.bold?700:400, lineHeight:1.5 }}>{tip.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: PAYMENT */}
            {step===5 && (
              <div className="step-enter">
                {/* Order summary */}
                <div className="glass-card" style={{ padding:32, marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
                    <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#22C55E,#16A34A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>💳</div>
                    <div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:20, color:'#fff' }}>Order Summary</div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Review before payment</div>
                    </div>
                  </div>

                  <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:16, overflow:'hidden', marginBottom:24 }}>
                    {[
                      { k:'Name', v:form.name||'—' },
                      { k:'Email', v:form.email||'—' },
                      { k:'Phone', v:form.phone||'—' },
                      { k:'Role', v:ROLES.find(r=>r.id===role)?.title||'—' },
                      { k:'City', v:city||'—' },
                    ].map((row,i) => (
                      <div key={row.k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', borderBottom:i<4?'1px solid rgba(255,255,255,0.05)':'none' }}>
                        <span style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{row.k}</span>
                        <span style={{ fontSize:14, color:'#fff', fontWeight:600, textAlign:'right', maxWidth:'60%', wordBreak:'break-all' }}>{row.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price breakdown */}
                  <div style={{ border:'1px solid rgba(255,122,41,0.3)', borderRadius:16, padding:20, background:'rgba(255,122,41,0.05)', marginBottom:24 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ fontSize:14, color:'rgba(255,255,255,0.6)' }}>Registration fee</span>
                      <span style={{ fontSize:14, color:'#fff', fontWeight:600 }}>₹{price}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ fontSize:14, color:'rgba(255,255,255,0.6)' }}>Auction fee (if selected)</span>
                      <span style={{ fontSize:14, color:'#22C55E', fontWeight:700 }}>₹0</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ fontSize:14, color:'rgba(255,255,255,0.6)' }}>Tournament fee</span>
                      <span style={{ fontSize:14, color:'#22C55E', fontWeight:700 }}>₹0</span>
                    </div>
                    <div style={{ height:1, background:'rgba(255,255,255,0.08)', marginBottom:12 }} />
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:16, color:'#fff' }}>Total</span>
                      <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:28, color:'#FF7A29' }}>₹{price}</span>
                    </div>
                  </div>

                  <label style={{ display:'flex', gap:12, alignItems:'flex-start', cursor:'pointer', marginBottom:24 }}>
                    <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{ marginTop:3, accentColor:'#FF7A29', width:17, height:17, cursor:'pointer' }} />
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                      I agree to the <a href="#" style={{ color:'#FF7A29', textDecoration:'none', fontWeight:600 }}>Terms & Conditions</a>, <a href="#" style={{ color:'#FF7A29', textDecoration:'none', fontWeight:600 }}>Refund Policy</a>, and confirm I meet the <a href="#" style={{ color:'#FF7A29', textDecoration:'none', fontWeight:600 }}>Eligibility Criteria</a>.
                    </span>
                  </label>

                  <button className="btn-fire" disabled={!agreed} style={{ width:'100%', height:60, fontSize:18, borderRadius:16, opacity:agreed?1:0.4, cursor:agreed?'pointer':'not-allowed', letterSpacing:'0.02em' }}>
                    🔒 Pay Securely · ₹{price}
                  </button>
                  <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:600 }}>Powered by Razorpay · 256-bit SSL</div>
                </div>
              </div>
            )}

            {/* ── NAV BUTTONS ── */}
            <div style={{ display:'flex', gap:12, marginTop:20 }}>
              {step > 1 && (
                <button onClick={() => setStep(s=>s-1)} style={{ flex:1, height:54, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14, color:'rgba(255,255,255,0.7)', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Montserrat,sans-serif', transition:'all 0.2s' }}>
                  ← Back
                </button>
              )}
              {step < 5 && (
                <button className="btn-fire" disabled={!canNext()} onClick={() => canNext() && setStep(s=>s+1)} style={{ flex:2, height:54, fontSize:16, borderRadius:14, opacity:canNext()?1:0.4, cursor:canNext()?'pointer':'not-allowed' }}>
                  {step===4 ? 'Continue to Payment →' : 'Continue →'}
                </button>
              )}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ──────────────────────────────────── */}
          <div className="side-col" style={{ position:'sticky', top:160 }}>

            {/* Price card */}
            <div style={{ background:'linear-gradient(135deg,#FF7A29,#C94E0E)', borderRadius:20, padding:28, marginBottom:16, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
              <div style={{ position:'absolute', bottom:-30, left:-10, width:80, height:80, borderRadius:'50%', background:'rgba(0,0,0,0.1)' }} />
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', fontWeight:700, letterSpacing:'0.12em', marginBottom:8, fontFamily:'Montserrat,sans-serif' }}>REGISTRATION FEE</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:52, color:'#fff', lineHeight:1, marginBottom:4 }}>₹{price}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', marginBottom:20 }}>One-time · No hidden charges</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {['Auction fee = ₹0','Tournament fee = ₹0','7-day refund guarantee'].map(t => (
                  <div key={t} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(255,255,255,0.9)', fontWeight:600 }}>
                    <span style={{ width:18, height:18, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>✓</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* What you get */}
            <div className="glass-card" style={{ padding:24, marginBottom:16 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, color:'#E8B23D', marginBottom:16, letterSpacing:'0.05em' }}>WHAT YOU GET</div>
              {[
                { i:'🏆', t:'Fair shot at BCPL Season 5' },
                { i:'🎽', t:'Official kit & jersey (if selected)' },
                { i:'🏟️', t:'Stadium-grade grounds' },
                { i:'👨‍🏫', t:'Professional BCCI-certified coaches' },
                { i:'📺', t:'TV & digital coverage' },
                { i:'🌟', t:'Corporate network of 5,000+ players' },
              ].map(item => (
                <div key={item.t} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:14 }}>
                  <span style={{ fontSize:16, width:24, flexShrink:0 }}>{item.i}</span>
                  <span style={{ fontSize:13.5, color:'rgba(255,255,255,0.8)', lineHeight:1.5 }}>{item.t}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="glass-card" style={{ padding:24, borderLeft:'3px solid #FF7A29', marginBottom:16 }}>
              <div style={{ color:'#E8B23D', fontSize:13, marginBottom:12 }}>★★★★★</div>
              <p style={{ fontSize:13.5, fontStyle:'italic', color:'rgba(255,255,255,0.8)', lineHeight:1.65, marginBottom:14 }}>
                "Registered on a Tuesday. Shortlisted by Friday. Played at DY Patil Stadium 6 weeks later. BCPL is 100% real."
              </p>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>— Arjun S., Software Engineer · Delhi Dynamos</div>
            </div>

            {/* FAQ pills */}
            <div className="glass-card" style={{ padding:24 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, color:'#fff', marginBottom:16 }}>Quick FAQ</div>
              {[
                { q:'Can I get a refund?', a:'Yes — within 7 days of registration.' },
                { q:'Do I need to be great?', a:'Passionate is enough. Coaches assess attitude.' },
                { q:'Any hidden fees?', a:'Never. ₹299 is the only fee, ever.' },
              ].map(faq => (
                <div key={faq.q} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.9)', marginBottom:4 }}>Q: {faq.q}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.5 }}>{faq.a}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Mobile: Price strip above footer */}
        <div className="side-col-mob" style={{ marginTop:28 }}>
          <div style={{ background:'linear-gradient(135deg,rgba(255,122,41,0.15),rgba(200,80,14,0.1))', border:'1px solid rgba(255,122,41,0.3)', borderRadius:18, padding:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:'0.1em' }}>YOUR TOTAL</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:36, color:'#FF7A29', lineHeight:1 }}>₹{price}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>No hidden fees · 7-day refund</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>Need help?</div>
              <button className="btn-wa" style={{ padding:'10px 18px', fontSize:13 }}>💬 WhatsApp</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{ position:'relative', zIndex:5, marginTop:60, background:'#040C18', borderTop:'1px solid rgba(255,255,255,0.05)', padding:'48px 0 32px' }}>
        <div className="wrap">
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:32, marginBottom:32 }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:24, marginBottom:12 }}>
                <span style={{ color:'#FF7A29' }}>BCPL</span><span style={{ color:'#fff', marginLeft:3 }}>T20</span>
              </div>
              <p style={{ color:'rgba(255,255,255,0.38)', fontSize:13, lineHeight:1.75, maxWidth:280, marginBottom:12 }}>
                Bharatiya Corporate Premier League — the world's largest corporate cricket league for working professionals.
              </p>
              <div style={{ color:'rgba(255,122,41,0.6)', fontSize:12, fontWeight:700, letterSpacing:'0.1em' }}>#OfficeSeStadiumtak</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <div>
                <div style={{ color:'rgba(255,255,255,0.25)', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14 }}>League</div>
                {['Schedule','Match Center','Teams','Points Table','Photos','Videos'].map(l => <div key={l} style={{ marginBottom:10 }}><a href="#" style={{ color:'rgba(255,255,255,0.5)', fontSize:13, textDecoration:'none' }}>{l}</a></div>)}
              </div>
              <div>
                <div style={{ color:'rgba(255,255,255,0.25)', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14 }}>Info</div>
                {['About','FAQ','Contact','Terms','Privacy','Refunds'].map(l => <div key={l} style={{ marginBottom:10 }}><a href="#" style={{ color:'rgba(255,255,255,0.5)', fontSize:13, textDecoration:'none' }}>{l}</a></div>)}
              </div>
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:20, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div style={{ color:'rgba(255,255,255,0.22)', fontSize:11 }}>© 2025 Kriparti Playing11 Pvt. Ltd.</div>
            <div style={{ color:'rgba(255,255,255,0.22)', fontSize:11 }}>www.bcpl-t20.com</div>
          </div>
        </div>
      </footer>

      {/* ── STICKY MOBILE BOTTOM CTA ────────────────────────────── */}
      <div className="bot-cta" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:500, padding:'10px 16px 18px', background:'rgba(4,12,24,0.97)', backdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.07)', gap:10 }}>
        <button className="btn-fire" style={{ flex:2, height:52, fontSize:15 }}
          onClick={() => step < 5 ? (canNext() ? setStep(s=>s+1) : null) : null}>
          {step===5 ? `🔒 Pay ₹${price}` : `Continue Step ${step} →`}
        </button>
        <button className="btn-wa" style={{ flex:1, height:52, fontSize:13, borderRadius:14 }}>💬 WhatsApp</button>
      </div>

    </div>
  );
}
