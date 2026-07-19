import React from 'react';

/* ── VARIANT A: "LIVE PLAYER CARD" ──────────────────────────────────
   The underexplored axis: identity formation.
   As you fill the form, your BCPL player card builds live on the right.
   By the time you pay, you already see yourself as a franchise cricketer.
   ──────────────────────────────────────────────────────────────────── */

const ROLES = [
  { id:'bat',  label:'Batsman',       abbr:'BAT', price:299, color:'#3B82F6', bg:'linear-gradient(135deg,#1D4ED8,#3B82F6)', emoji:'🏏' },
  { id:'bowl', label:'Bowler',        abbr:'BWL', price:299, color:'#8B5CF6', bg:'linear-gradient(135deg,#6D28D9,#8B5CF6)', emoji:'🎳' },
  { id:'wk',   label:'Wicket-Keeper', abbr:'WKT', price:299, color:'#06B6D4', bg:'linear-gradient(135deg,#0E7490,#06B6D4)', emoji:'🧤' },
  { id:'ar',   label:'All-Rounder',   abbr:'AR',  price:399, color:'#F59E0B', bg:'linear-gradient(135deg,#B45309,#F59E0B)', emoji:'⭐' },
];

const JERSEY_NUM = 23; // static for demo

function CricketJerseySVG({ bg, num }: { bg:string; num:number }) {
  return (
    <div style={{ position:'relative', width:120, height:140, margin:'0 auto' }}>
      <svg viewBox="0 0 120 140" style={{ width:'100%', height:'100%', filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}>
        <defs>
          <linearGradient id="jerseyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--jc1,#1D4ED8)" />
            <stop offset="100%" stopColor="var(--jc2,#3B82F6)" />
          </linearGradient>
        </defs>
        {/* Jersey body */}
        <path d="M20,20 L10,50 L30,55 L30,130 L90,130 L90,55 L110,50 L100,20 L80,30 Q60,38 40,30 Z" fill="url(#jerseyGrad)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
        {/* Collar */}
        <path d="M40,30 Q60,20 80,30 Q70,50 60,48 Q50,50 40,30 Z" fill="rgba(0,0,0,0.25)" />
        {/* Sleeve left */}
        <path d="M20,20 L10,50 L30,55 L28,30 Z" fill="rgba(255,255,255,0.12)" />
        {/* Sleeve right */}
        <path d="M100,20 L110,50 L90,55 L92,30 Z" fill="rgba(255,255,255,0.12)" />
        {/* BCPL text */}
        <text x="60" y="80" textAnchor="middle" fontSize="10" fontWeight="900" fill="rgba(255,255,255,0.9)" fontFamily="Montserrat,sans-serif">BCPL T20</text>
        {/* Number */}
        <text x="60" y="115" textAnchor="middle" fontSize="30" fontWeight="900" fill="rgba(255,255,255,0.95)" fontFamily="Montserrat,sans-serif">{num}</text>
        {/* Shine */}
        <ellipse cx="45" cy="40" rx="12" ry="6" fill="rgba(255,255,255,0.1)" transform="rotate(-20 45 40)" />
      </svg>
    </div>
  );
}

function PlayerCard({ name, role, city, step }:{ name:string; role:typeof ROLES[0]|null; city:string; step:number }) {
  const completeness = Math.min(100, Math.round((step / 3) * 100 + (name?25:0)));
  const displayName  = name || 'YOUR NAME';
  const displayRole  = role?.label || 'YOUR ROLE';
  const displayCity  = city || 'YOUR CITY';

  const cardBg   = role?.bg || 'linear-gradient(135deg,#0F2247,#1E3A6E)';
  const cardColor = role?.color || '#3B82F6';

  return (
    <div style={{ position:'relative', width:260, margin:'0 auto' }}>
      {/* Holographic glow */}
      <div style={{ position:'absolute', inset:-3, borderRadius:24, background:cardBg, filter:'blur(16px)', opacity:0.6 }} />

      {/* Card front */}
      <div style={{ position:'relative', background:'linear-gradient(160deg,#0D1F3C 0%,#0A1628 60%,rgba(15,34,71,0.9) 100%)', borderRadius:20, padding:24, border:`1px solid ${cardColor}40`, boxShadow:`0 0 0 1px ${cardColor}20, 0 32px 64px rgba(0,0,0,0.6)`, overflow:'hidden', minHeight:380 }}>

        {/* Bg pattern */}
        <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:'repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 20px)', pointerEvents:'none' }} />

        {/* BCPL header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:900, color:'rgba(255,255,255,0.9)', letterSpacing:'0.15em' }}>
            <span style={{ color:'#FF7A29' }}>BCPL</span> T20
          </div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:'0.12em' }}>SEASON 5</div>
        </div>

        {/* Jersey */}
        <div style={{ marginBottom:16, transition:'all 0.4s' }}>
          <CricketJerseySVG bg={cardBg} num={JERSEY_NUM} />
        </div>

        {/* Player name */}
        <div style={{ textAlign:'center', marginBottom:8 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize: name ? 18 : 14, color: name ? '#fff' : 'rgba(255,255,255,0.25)', letterSpacing: name ? '0.05em' : '0.08em', textTransform:'uppercase', minHeight:28, transition:'all 0.3s', borderBottom: !name ? '1px dashed rgba(255,255,255,0.15)' : 'none' }}>
            {displayName}
          </div>
        </div>

        {/* Role + city row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:role ? cardColor : 'rgba(255,255,255,0.2)', transition:'background 0.3s' }} />
            <span style={{ fontSize:11, fontWeight:700, fontFamily:'Montserrat,sans-serif', color: role ? cardColor : 'rgba(255,255,255,0.25)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{displayRole}</span>
          </div>
          <span style={{ fontSize:11, color: city ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', fontWeight:600 }}>📍 {displayCity}</span>
        </div>

        {/* Holographic strip */}
        <div style={{ height:3, borderRadius:2, background: role ? `linear-gradient(90deg, ${cardColor}, #E8B23D, ${cardColor})` : 'rgba(255,255,255,0.08)', backgroundSize:'200% 100%', animation: role ? 'shimmerCard 2s linear infinite' : 'none', marginBottom:12, transition:'all 0.4s' }} />

        {/* Completeness bar */}
        <div style={{ marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Card Status</span>
            <span style={{ fontSize:9, color: completeness >= 75 ? '#22C55E' : completeness >= 40 ? '#F59E0B' : 'rgba(255,255,255,0.35)', fontWeight:700 }}>{completeness}%</span>
          </div>
          <div style={{ height:3, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${completeness}%`, background: completeness >= 75 ? 'linear-gradient(90deg,#22C55E,#16A34A)' : 'linear-gradient(90deg,#FF7A29,#E8B23D)', transition:'width 0.6s ease, background 0.4s', borderRadius:2 }} />
          </div>
        </div>

        {/* BCPL seal */}
        <div style={{ textAlign:'center', marginTop:8 }}>
          <div style={{ display:'inline-block', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'4px 12px', fontSize:8, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em', fontWeight:700 }}>
            KRIPARTI PLAYING11 PVT. LTD.
          </div>
        </div>

      </div>
    </div>
  );
}

export function RegVariantA() {
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [role, setRole] = React.useState<typeof ROLES[0]|null>(null);
  const [city, setCity] = React.useState('');
  const [cityQ, setCityQ] = React.useState('');
  const [showCities, setShowCities] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const CITIES = ["Mumbai","Delhi","Bengaluru","Hyderabad","Pune","Chennai","Kolkata","Ahmedabad","Jaipur","Lucknow","Noida","Gurugram","Chandigarh","Kochi","Indore","Nagpur","Bhopal","Patna","Surat","Vadodara"];
  const filtered = CITIES.filter(c => c.toLowerCase().includes(cityQ.toLowerCase())).slice(0,8);

  const price = role?.price ?? 299;
  const canGo = step===1 ? (name && email && phone) : step===2 ? !!role : step===3 ? !!city : true;

  const navLinks = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];

  return (
    <div style={{ background:'#060E1C', minHeight:'100vh', color:'#F8F4EE', fontFamily:'Inter,sans-serif', overflowX:'hidden' }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes shimmerCard{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8)}}
        @keyframes floatUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardReveal{from{opacity:0;transform:perspective(800px) rotateY(20deg) scale(0.9)}to{opacity:1;transform:perspective(800px) rotateY(0deg) scale(1)}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.2}}
        .btn-fire{background:linear-gradient(135deg,#FF7A29,#E8611A,#C94E0E);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45);transition:transform 0.15s;animation:pulseGlow 3s ease-in-out infinite;letter-spacing:0.02em}
        .btn-fire:hover{transform:translateY(-2px)}
        .btn-fire:disabled{opacity:0.4;cursor:not-allowed;animation:none}
        .inp{width:100%;background:transparent;border:none;border-bottom:2px solid rgba(255,255,255,0.15);color:#fff;padding:12px 0;font-size:18px;font-family:Inter,sans-serif;outline:none;transition:border-color 0.2s;caret-color:#FF7A29}
        .inp:focus{border-color:#FF7A29}
        .inp::placeholder{color:rgba(255,255,255,0.2)}
        .lbl{font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;display:block}
        .wrap{max-width:1280px;margin:0 auto;padding:0 20px}
        .desk-nav{display:none;align-items:center;gap:20px}
        .ham-btn{display:flex}
        .bot-cta{display:flex}
        .card-col{display:none}
        @media(min-width:768px){.wrap{padding:0 32px}}
        @media(min-width:900px){.card-col{display:block}.main-grid{display:grid!important;grid-template-columns:1fr 300px;gap:48px;align-items:start}}
        @media(min-width:1024px){.desk-nav{display:flex!important}.ham-btn{display:none!important}.bot-cta{display:none!important}}
        .role-chip{border:2px solid rgba(255,255,255,0.1);border-radius:16px;padding:16px;cursor:pointer;transition:all 0.2s;background:rgba(255,255,255,0.03);display:flex;align-items:center;gap:12px}
        .role-chip:hover{border-color:rgba(255,255,255,0.25)}
        .role-chip.sel{border-color:var(--rc,#FF7A29);background:rgba(255,122,41,0.06)}
        .city-drop{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#0D2040;border:1px solid rgba(255,122,41,0.3);border-radius:12px;z-index:99;overflow:hidden}
        .city-item{padding:12px 16px;cursor:pointer;font-size:14px;color:rgba(255,255,255,0.8);transition:background 0.15s}
        .city-item:hover{background:rgba(255,122,41,0.15);color:#FF7A29}
        .step-enter{animation:floatUp 0.35s ease both}
      `}</style>

      {/* Ambient particles */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 60% at 15% 30%, rgba(255,122,41,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 20%, rgba(30,64,175,0.1) 0%, transparent 60%)' }} />
        {[...Array(6)].map((_,i) => <div key={i} style={{ position:'absolute', width:3, height:3, borderRadius:'50%', background:i%2?'#FF7A29':'#E8B23D', left:`${15+i*14}%`, bottom:`${15+i*10}%`, opacity:0.5, animation:`liveBlip ${3+i*0.4}s ease-in-out ${i*0.3}s infinite` }} />)}
      </div>

      {/* Announcement bar */}
      <div style={{ position:'relative', zIndex:10, background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', color:'#fff', padding:'10px 20px', textAlign:'center', fontSize:12, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'0.08em' }}>
        🏏 VARIANT A · LIVE PLAYER CARD &nbsp;·&nbsp; Your card builds as you fill the form &nbsp;·&nbsp; #OfficeSeStadiumtak
      </div>

      {/* Navbar */}
      <nav style={{ position:'sticky', top:0, zIndex:200, background:'rgba(6,14,28,0.96)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 1px 0 rgba(255,122,41,0.25)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 20px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22 }}>
            <span style={{ color:'#FF7A29' }}>BCPL</span><span style={{ color:'#fff', marginLeft:2 }}>T20</span>
            <span style={{ fontSize:9, color:'rgba(255,122,41,0.7)', fontWeight:600, letterSpacing:'0.15em', marginLeft:8 }}>SEASON 5</span>
          </div>
          <div className="desk-nav">
            {navLinks.map(l=><a key={l} href="#" style={{ color:'rgba(255,255,255,0.65)', fontSize:13, fontWeight:600, textDecoration:'none' }}>{l}</a>)}
            <button className="btn-fire" style={{ padding:'10px 22px', fontSize:13 }}>Register ₹299 →</button>
          </div>
          <button className="ham-btn" onClick={()=>setOpen(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', padding:8, flexDirection:'column', gap:5, zIndex:300 }}>
            {[0,1,2].map(i=><span key={i} style={{ display:'block', width:24, height:2, background:'#fff', borderRadius:2, transition:'all 0.25s', transform:i===0&&open?'rotate(45deg) translate(5px,5px)':i===1&&open?'scaleX(0)':i===2&&open?'rotate(-45deg) translate(5px,-5px)':'' }} />)}
          </button>
        </div>
      </nav>

      {open && <div style={{ position:'fixed', inset:0, background:'#06101E', zIndex:250, display:'flex', flexDirection:'column', padding:'80px 24px 40px', overflowY:'auto' }}>
        <button onClick={()=>setOpen(false)} style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:40, height:40, borderRadius:10, cursor:'pointer', fontSize:18 }}>✕</button>
        {navLinks.map(l=><a key={l} href="#" style={{ color:'rgba(255,255,255,0.9)', fontWeight:700, fontSize:20, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'block' }}>{l}</a>)}
      </div>}

      {/* Page header */}
      <div style={{ position:'relative', zIndex:5, padding:'32px 0 24px' }}>
        <div className="wrap">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <span style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.3)', borderRadius:100, padding:'5px 14px', fontSize:11, fontWeight:700, color:'#FF7A29', fontFamily:'Montserrat,sans-serif', letterSpacing:'0.1em' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#FF7A29', animation:'liveBlip 1.2s ease-in-out infinite' }} />
              REGISTRATION LIVE
            </span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>Step {step} of 4 · Your card is building</span>
          </div>
          <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(28px,5vw,48px)', lineHeight:1.05, letterSpacing:'-0.02em' }}>
            Build Your<br/>
            <span style={{ background:'linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D)', backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'gradShift 3s linear infinite' }}>Player Card.</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, marginTop:8 }}>Every field you fill adds to your BCPL identity.</p>
        </div>
      </div>

      {/* Main layout */}
      <div className="wrap" style={{ position:'relative', zIndex:5, paddingBottom:120 }}>
        <div className="main-grid" style={{ display:'block' }}>

          {/* LEFT: Form */}
          <div>
            {/* STEP 1 */}
            {step===1 && (
              <div className="step-enter">
                <div style={{ marginBottom:32 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#FF7A29', letterSpacing:'0.12em', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:24, height:24, borderRadius:'50%', background:'#FF7A29', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#fff', fontFamily:'Montserrat,sans-serif' }}>1</span>
                    YOUR DETAILS
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
                    <div>
                      <label className="lbl">Your Name *</label>
                      <input className="inp" placeholder="Start typing — watch your card..." value={name} onChange={e=>setName(e.target.value)} autoFocus />
                    </div>
                    <div>
                      <label className="lbl">Work Email *</label>
                      <input className="inp" type="email" placeholder="your@company.com" value={email} onChange={e=>setEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="lbl">Phone *</label>
                      <input className="inp" type="tel" placeholder="+91 98765 43210" value={phone} onChange={e=>setPhone(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Role */}
            {step===2 && (
              <div className="step-enter">
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#FF7A29', letterSpacing:'0.12em', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:24, height:24, borderRadius:'50%', background:'#FF7A29', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#fff' }}>2</span>
                  YOUR ROLE — CHOOSE. IT DEFINES YOUR CARD.
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {ROLES.map(r=>(
                    <div key={r.id} className={`role-chip${role?.id===r.id?' sel':''}`} style={{ '--rc':r.color } as any} onClick={()=>setRole(r)}>
                      <span style={{ fontSize:22, width:36, textAlign:'center' }}>{r.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:16, color:'#fff', marginBottom:2 }}>{r.label}</div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>Changes your card color & jersey accent</div>
                      </div>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color: role?.id===r.id ? r.color : 'rgba(255,255,255,0.4)' }}>₹{r.price}</div>
                      {role?.id===r.id && <div style={{ width:20, height:20, borderRadius:'50%', background:r.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>✓</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: City */}
            {step===3 && (
              <div className="step-enter">
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#FF7A29', letterSpacing:'0.12em', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:24, height:24, borderRadius:'50%', background:'#FF7A29', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#fff' }}>3</span>
                  YOUR CITY — FINALISES YOUR CARD LOCATION
                </div>
                <div style={{ position:'relative' }}>
                  <label className="lbl">Search City</label>
                  <input className="inp" placeholder="Type your city..." value={cityQ} onChange={e=>{setCityQ(e.target.value);setShowCities(true);setCity('')}} onFocus={()=>setShowCities(true)} />
                  {showCities && cityQ && (
                    <div className="city-drop">
                      {filtered.map(c=><div key={c} className="city-item" onClick={()=>{setCity(c);setCityQ(c);setShowCities(false)}}>📍 {c}</div>)}
                    </div>
                  )}
                </div>
                {city && <div style={{ marginTop:16, padding:'14px 18px', background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.3)', borderRadius:12, animation:'floatUp 0.3s ease' }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:18, color:'#06B6D4' }}>📍 {city} locked in</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4 }}>Your card location is set. Card is {Math.min(100,85+15)}% complete.</div>
                </div>}
                <div style={{ marginTop:20, display:'flex', flexWrap:'wrap', gap:8 }}>
                  {['Mumbai','Delhi','Bengaluru','Pune','Hyderabad','Chennai'].map(c=>(
                    <button key={c} onClick={()=>{setCity(c);setCityQ(c);setShowCities(false)}} style={{ background:city===c?'rgba(255,122,41,0.2)':'rgba(255,255,255,0.05)', border:`1px solid ${city===c?'rgba(255,122,41,0.5)':'rgba(255,255,255,0.1)'}`, borderRadius:10, padding:'7px 14px', fontSize:12, fontWeight:600, color:city===c?'#FF7A29':'rgba(255,255,255,0.6)', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Pay */}
            {step===4 && (
              <div className="step-enter">
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#22C55E', letterSpacing:'0.12em', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:24, height:24, borderRadius:'50%', background:'#22C55E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>✓</span>
                  CARD COMPLETE · ACTIVATE IT NOW
                </div>
                <div style={{ background:'linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85))', border:'1px solid rgba(255,255,255,0.09)', borderRadius:20, padding:28, marginBottom:20 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                    {[['Player',name],['Role',role?.label||'—'],['City',city],['Jersey',`#${JERSEY_NUM}`]].map(([k,v])=>(
                      <div key={k}>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:3 }}>{k}</div>
                        <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:20, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:15, color:'#fff' }}>Card Activation Fee</span>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:32, color:'#FF7A29' }}>₹{price}</span>
                  </div>
                  <button className="btn-fire" style={{ width:'100%', height:60, fontSize:18, borderRadius:16 }}>🏏 Activate My Player Card →</button>
                  <div style={{ textAlign:'center', marginTop:12, fontSize:11, color:'rgba(255,255,255,0.25)' }}>Powered by Razorpay · 256-bit SSL</div>
                </div>
              </div>
            )}

            {/* Nav */}
            <div style={{ display:'flex', gap:12, marginTop:32 }}>
              {step>1 && <button onClick={()=>setStep(s=>s-1)} style={{ flex:1, height:52, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, color:'rgba(255,255,255,0.7)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Montserrat,sans-serif' }}>← Back</button>}
              {step<4 && <button className="btn-fire" disabled={!canGo} onClick={()=>canGo&&setStep(s=>s+1)} style={{ flex:2, height:52, fontSize:15, borderRadius:14 }}>Continue →</button>}
            </div>
          </div>

          {/* RIGHT: Player Card */}
          <div className="card-col" style={{ paddingTop:8, animation:'cardReveal 0.8s ease' }}>
            <div style={{ position:'sticky', top:100 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', textAlign:'center', marginBottom:16 }}>
                Your Player Card — Updates Live
              </div>
              <PlayerCard name={name} role={role} city={city} step={step} />
              <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'rgba(255,255,255,0.25)', lineHeight:1.6 }}>
                Card activated after<br/>video evaluation by BCCI scouts
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile card preview strip */}
      <div style={{ position:'fixed', bottom:88, left:0, right:0, zIndex:400, padding:'0 16px 8px', display:'block' }} className="mob-card-strip">
        {(name || role) && (
          <div style={{ background:'rgba(4,12,24,0.96)', backdropFilter:'blur(20px)', borderRadius:'14px 14px 0 0', padding:'12px 16px', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background: role?.color || '#FF7A29' }} />
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#fff', flex:1, textTransform:'uppercase', letterSpacing:'0.05em' }}>{name || '—'}</span>
            {role && <span style={{ fontSize:11, fontWeight:700, color: role.color, background:`${role.color}20`, border:`1px solid ${role.color}40`, borderRadius:6, padding:'3px 8px' }}>{role.abbr}</span>}
            {city && <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>📍 {city}</span>}
          </div>
        )}
      </div>

      {/* Mobile bottom CTA */}
      <div className="bot-cta" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:500, padding:'10px 16px 18px', background:'rgba(4,12,24,0.97)', backdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.07)', gap:10 }}>
        <button className="btn-fire" style={{ flex:2, height:52, fontSize:15 }} disabled={!canGo} onClick={()=>canGo&&(step<4?setStep(s=>s+1):null)}>
          {step<4 ? 'Continue →' : `🏏 Activate Card ₹${price}`}
        </button>
        <button style={{ flex:1, height:52, background:'linear-gradient(135deg,#25D366,#1BA851)', border:'none', borderRadius:14, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Montserrat,sans-serif' }}>💬 WhatsApp</button>
      </div>
    </div>
  );
}
