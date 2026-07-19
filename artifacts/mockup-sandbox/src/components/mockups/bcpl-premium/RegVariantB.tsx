import React from 'react';

/* ── VARIANT B: "SCOUT'S INTERVIEW" ─────────────────────────────────
   The underexplored axis: identity formation through dialogue.
   One question per screen. Full-screen immersion. Stadium atmosphere.
   Not "FULL NAME *" but "What do they call you, champion?"
   You're not filling a form — you're being interviewed for selection.
   ──────────────────────────────────────────────────────────────────── */

const QUESTIONS = [
  {
    id:'name',
    scout:'First things first —',
    q:'What do they\ncall you?',
    hint:"Your full name, as you'd want it on the scoreboard",
    type:'text',
    placeholder:'Rahul Sharma...',
    key:'name',
  },
  {
    id:'email',
    scout:'Good to meet you.',
    q:'Where can we\nreach you?',
    hint:'Your work email — we send the shortlist notification here',
    type:'email',
    placeholder:'rahul@company.com',
    key:'email',
  },
  {
    id:'phone',
    scout:'Almost there.',
    q:'Your phone\nnumber?',
    hint:'Scouts may call if you make the shortlist',
    type:'tel',
    placeholder:'+91 98765 43210',
    key:'phone',
  },
  {
    id:'company',
    scout:'Good.',
    q:'Where do you\nwork?',
    hint:'Company or organisation name',
    type:'text',
    placeholder:'Your Company Name...',
    key:'company',
  },
];

const ROLES = [
  { id:'bat',  emoji:'🏏', label:'Batsman',       sub:'I score runs. I win matches.', price:299, color:'#3B82F6', grad:'linear-gradient(135deg,#1D4ED8,#3B82F6)' },
  { id:'bowl', emoji:'🎳', label:'Bowler',         sub:'I take wickets. I break partnerships.', price:299, color:'#8B5CF6', grad:'linear-gradient(135deg,#6D28D9,#8B5CF6)' },
  { id:'wk',   emoji:'🧤', label:'Wicket-Keeper',  sub:'I\'m the backbone. The loudest voice.', price:299, color:'#06B6D4', grad:'linear-gradient(135deg,#0E7490,#06B6D4)' },
  { id:'ar',   emoji:'⭐', label:'All-Rounder',    sub:'I do both. Scouts want me most.', price:399, color:'#F59E0B', grad:'linear-gradient(135deg,#B45309,#F59E0B)', premium:true },
];

const CITIES_TOP = ['Mumbai','Delhi','Bengaluru','Pune','Hyderabad','Chennai','Kolkata','Ahmedabad','Jaipur','Lucknow','Noida','Gurugram','Chandigarh','Kochi','Indore','Nagpur','Surat','Vadodara','Bhopal','Patna'];

// Stadium backgrounds per question (CSS gradients simulating stadium atmosphere)
const BGRADS = [
  'radial-gradient(ellipse 80% 70% at 50% 120%, rgba(255,122,41,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 20% 20%, rgba(30,64,175,0.12) 0%, transparent 50%)',
  'radial-gradient(ellipse 80% 70% at 80% 110%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 10% 30%, rgba(30,64,175,0.1) 0%, transparent 50%)',
  'radial-gradient(ellipse 80% 70% at 20% 120%, rgba(6,182,212,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 50%)',
  'radial-gradient(ellipse 80% 70% at 60% 120%, rgba(245,158,11,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 30% 10%, rgba(30,64,175,0.1) 0%, transparent 50%)',
  'radial-gradient(ellipse 80% 70% at 40% 110%, rgba(59,130,246,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 70% 20%, rgba(30,64,175,0.1) 0%, transparent 50%)',
  'radial-gradient(ellipse 80% 70% at 50% 120%, rgba(34,197,94,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 20% 20%, rgba(30,64,175,0.1) 0%, transparent 50%)',
  'radial-gradient(ellipse 80% 70% at 50% 120%, rgba(255,122,41,0.2) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 10%, rgba(30,64,175,0.15) 0%, transparent 50%)',
];

export function RegVariantB() {
  const [qIdx, setQIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string,string>>({ name:'', email:'', phone:'', company:'' });
  const [role, setRole] = React.useState('');
  const [city, setCity] = React.useState('');
  const [citySearch, setCitySearch] = React.useState('');
  const [agreed, setAgreed] = React.useState(false);
  const [transitioning, setTransitioning] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // Steps: 0-3 = text questions, 4 = role, 5 = city, 6 = confirm+pay
  const totalSteps = 7;
  const progress = ((qIdx) / (totalSteps - 1)) * 100;

  const currentAnswer = qIdx < 4 ? answers[QUESTIONS[qIdx].key] : qIdx===4 ? role : qIdx===5 ? city : '';
  const canContinue = qIdx < 4 ? !!currentAnswer.trim() : qIdx===4 ? !!role : qIdx===5 ? !!city : agreed;

  const navLinks = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];

  const goNext = () => {
    if (!canContinue) return;
    setTransitioning(true);
    setTimeout(() => { setQIdx(i => Math.min(i+1, totalSteps-1)); setTransitioning(false); }, 300);
  };

  const goPrev = () => {
    setTransitioning(true);
    setTimeout(() => { setQIdx(i => Math.max(i-1, 0)); setTransitioning(false); }, 200);
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key==='Enter' && canContinue) goNext(); };
  const filteredCities = CITIES_TOP.filter(c=>c.toLowerCase().includes(citySearch.toLowerCase()));
  const selectedRole = ROLES.find(r=>r.id===role);
  const price = selectedRole?.price ?? 299;

  return (
    <div style={{ background:'#060E1C', height:'100vh', color:'#F8F4EE', fontFamily:'Inter,sans-serif', overflow:'hidden', position:'relative', display:'flex', flexDirection:'column' }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-24px)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes bgShift{from{opacity:0}to{opacity:1}}
        .desk-nav{display:none;align-items:center;gap:20px}
        .ham-btn{display:flex}
        .bot-cta{display:flex}
        @media(min-width:1024px){.desk-nav{display:flex!important}.ham-btn{display:none!important}.bot-cta{display:none!important}}
        .btn-fire{background:linear-gradient(135deg,#FF7A29,#E8611A,#C94E0E);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45);transition:transform 0.15s;animation:pulseGlow 3s ease-in-out infinite;letter-spacing:0.02em}
        .btn-fire:hover{transform:translateY(-2px)}
        .btn-fire:disabled{opacity:0.35;cursor:not-allowed;animation:none}
        .hero-input{background:transparent;border:none;border-bottom:3px solid rgba(255,255,255,0.2);color:#fff;padding:16px 0;font-size:clamp(22px,4vw,36px);font-family:Montserrat,sans-serif;font-weight:700;outline:none;width:100%;transition:border-color 0.3s;caret-color:#FF7A29}
        .hero-input:focus{border-color:#FF7A29}
        .hero-input::placeholder{color:rgba(255,255,255,0.2)}
        .q-enter{animation:slideIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both}
        .q-exit{animation:slideOut 0.25s ease both}
        .role-big{display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px;border:2px solid rgba(255,255,255,0.08);border-radius:20px;cursor:pointer;transition:all 0.25s;background:rgba(255,255,255,0.03)}
        .role-big:hover{border-color:rgba(255,255,255,0.2);transform:translateY(-4px)}
        .role-big.sel{border-color:var(--rc);background:rgba(255,255,255,0.06);transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.4)}
      `}</style>

      {/* Dynamic background */}
      <div style={{ position:'fixed', inset:0, background:BGRADS[Math.min(qIdx,BGRADS.length-1)], transition:'background 0.8s ease', pointerEvents:'none', zIndex:0 }}>
        {/* Stadium SVG silhouette */}
        <svg viewBox="0 0 800 300" style={{ position:'absolute', bottom:0, left:0, width:'100%', opacity:0.06 }} preserveAspectRatio="xMidYMax meet">
          <path d="M0,300 L0,160 Q100,140 200,150 Q300,160 400,140 Q500,120 600,140 Q700,155 800,145 L800,300 Z" fill="#1E40AF"/>
          <rect x="30" y="20" width="5" height="160" fill="#334155"/>
          <rect x="762" y="20" width="5" height="160" fill="#334155"/>
          <rect x="12" y="12" width="40" height="16" rx="3" fill="#64748B"/>
          <rect x="746" y="12" width="40" height="16" rx="3" fill="#64748B"/>
          <rect x="322" y="185" width="156" height="115" rx="3" fill="#2D5016" opacity="0.5"/>
          <line x1="330" y1="215" x2="470" y2="215" stroke="#fff" strokeWidth="2" opacity="0.5"/>
          <line x1="330" y1="265" x2="470" y2="265" stroke="#fff" strokeWidth="2" opacity="0.5"/>
        </svg>
        {/* Floating particles */}
        {[...Array(5)].map((_,i)=><div key={i} style={{ position:'absolute', width:3, height:3, borderRadius:'50%', background:i%2?'#FF7A29':'rgba(232,178,61,0.8)', left:`${10+i*18}%`, bottom:`${12+i*12}%`, opacity:0.5, animation:`liveBlip ${3.5+i*0.5}s ease-in-out ${i*0.4}s infinite` }} />)}
      </div>

      {/* Announcement bar */}
      <div style={{ position:'relative', zIndex:50, background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', color:'#fff', padding:'10px 20px', textAlign:'center', fontSize:12, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'0.08em', flexShrink:0 }}>
        🏏 VARIANT B · SCOUT'S INTERVIEW &nbsp;·&nbsp; One question at a time &nbsp;·&nbsp; #OfficeSeStadiumtak
      </div>

      {/* Navbar */}
      <nav style={{ position:'relative', zIndex:200, background:'rgba(6,14,28,0.7)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 20px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20 }}>
            <span style={{ color:'#FF7A29' }}>BCPL</span><span style={{ color:'#fff', marginLeft:2 }}>T20</span>
            <span style={{ fontSize:9, color:'rgba(255,122,41,0.7)', fontWeight:600, letterSpacing:'0.15em', marginLeft:8 }}>SEASON 5</span>
          </div>
          <div className="desk-nav">
            {navLinks.map(l=><a key={l} href="#" style={{ color:'rgba(255,255,255,0.55)', fontSize:12, fontWeight:600, textDecoration:'none' }}>{l}</a>)}
            <button className="btn-fire" style={{ padding:'8px 18px', fontSize:12 }}>Register ₹299 →</button>
          </div>
          <button className="ham-btn" onClick={()=>setOpen(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', padding:6, flexDirection:'column', gap:4 }}>
            {[0,1,2].map(i=><span key={i} style={{ display:'block', width:20, height:2, background:'#fff', borderRadius:12, transition:'all 0.25s', transform:i===0&&open?'rotate(45deg) translate(4px,4px)':i===1&&open?'scaleX(0)':i===2&&open?'rotate(-45deg) translate(4px,-4px)':'' }} />)}
          </button>
        </div>
      </nav>

      {open && <div style={{ position:'fixed', inset:0, background:'#06101E', zIndex:250, display:'flex', flexDirection:'column', padding:'80px 24px 40px' }}>
        <button onClick={()=>setOpen(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:36, height:36, borderRadius:10, cursor:'pointer', fontSize:16 }}>✕</button>
        {navLinks.map(l=><a key={l} href="#" style={{ color:'rgba(255,255,255,0.9)', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'block' }}>{l}</a>)}
      </div>}

      {/* Progress bar — very thin, at top of content area */}
      <div style={{ position:'relative', zIndex:10, height:3, background:'rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#FF7A29,#E8B23D)', transition:'width 0.5s ease', borderRadius:'0 2px 2px 0' }} />
      </div>

      {/* Main content — takes remaining height */}
      <div style={{ flex:1, position:'relative', zIndex:5, display:'flex', flexDirection:'column', justifyContent:'center', overflow:'hidden' }}>
        <div style={{ maxWidth:700, margin:'0 auto', padding:'0 24px', width:'100%' }}>

          {/* Q indicator */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em' }}>
              {qIdx + 1} / {totalSteps}
            </span>
            <div style={{ height:1, flex:1, background:'rgba(255,255,255,0.07)' }} />
          </div>

          {/* QUESTIONS 0-3: Text inputs */}
          {qIdx < 4 && (
            <div className={transitioning ? 'q-exit' : 'q-enter'} key={`q-${qIdx}`}>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'rgba(255,255,255,0.45)', marginBottom:8, fontStyle:'italic' }}>
                {QUESTIONS[qIdx].scout}
              </div>
              <h2 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(32px,6vw,56px)', lineHeight:1.05, color:'#fff', marginBottom:20, whiteSpace:'pre-line', letterSpacing:'-0.02em' }}>
                {QUESTIONS[qIdx].q}
              </h2>
              <input
                autoFocus
                className="hero-input"
                type={QUESTIONS[qIdx].type}
                placeholder={QUESTIONS[qIdx].placeholder}
                value={answers[QUESTIONS[qIdx].key]}
                onChange={e=>setAnswers(a=>({...a,[QUESTIONS[qIdx].key]:e.target.value}))}
                onKeyDown={handleKey}
              />
              <div style={{ marginTop:12, fontSize:12, color:'rgba(255,255,255,0.3)', fontStyle:'italic' }}>{QUESTIONS[qIdx].hint}</div>
            </div>
          )}

          {/* QUESTION 4: Role */}
          {qIdx===4 && (
            <div className={transitioning ? 'q-exit' : 'q-enter'} key="q-role">
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:8, fontStyle:'italic' }}>One more thing —</div>
              <h2 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(28px,5vw,44px)', color:'#fff', marginBottom:28, letterSpacing:'-0.02em', lineHeight:1.05 }}>
                What's your<br/>strongest role?
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
                {ROLES.map(r=>(
                  <div key={r.id} className={`role-big${role===r.id?' sel':''}`} style={{ '--rc':r.color } as any} onClick={()=>setRole(r.id)}>
                    <span style={{ fontSize:32 }}>{r.emoji}</span>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff', marginBottom:4 }}>{r.label}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.4 }}>{r.sub}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color: role===r.id ? r.color : 'rgba(255,255,255,0.5)' }}>₹{r.price}</span>
                      {r.premium && <span style={{ fontSize:9, background:'rgba(245,158,11,0.2)', color:'#F59E0B', border:'1px solid rgba(245,158,11,0.4)', borderRadius:5, padding:'2px 6px', fontWeight:700 }}>PREMIUM</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUESTION 5: City */}
          {qIdx===5 && (
            <div className={transitioning ? 'q-exit' : 'q-enter'} key="q-city">
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:8, fontStyle:'italic' }}>Almost done —</div>
              <h2 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(28px,5vw,44px)', color:'#fff', marginBottom:24, letterSpacing:'-0.02em', lineHeight:1.05 }}>
                Which city will<br/>you represent?
              </h2>
              <input
                autoFocus
                className="hero-input"
                placeholder="Start typing your city..."
                value={citySearch}
                onChange={e=>{setCitySearch(e.target.value);setCity('')}}
              />
              {citySearch && !city && (
                <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:8 }}>
                  {filteredCities.slice(0,8).map(c=>(
                    <button key={c} onClick={()=>{setCity(c);setCitySearch(c)}} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 14px', fontSize:13, color:'rgba(255,255,255,0.8)', cursor:'pointer', transition:'all 0.15s', fontFamily:'Inter,sans-serif' }}>
                      📍 {c}
                    </button>
                  ))}
                </div>
              )}
              {city && (
                <div style={{ marginTop:16, fontSize:22, fontFamily:'Montserrat,sans-serif', fontWeight:800, color:'#22C55E', animation:'slideIn 0.3s ease' }}>
                  ✓ {city} — selected.
                </div>
              )}
              {!citySearch && (
                <div style={{ marginTop:12, display:'flex', flexWrap:'wrap', gap:8 }}>
                  {['Mumbai','Delhi','Bengaluru','Pune','Hyderabad','Chennai','Kolkata','Ahmedabad'].map(c=>(
                    <button key={c} onClick={()=>{setCity(c);setCitySearch(c)}} style={{ background:city===c?'rgba(255,122,41,0.15)':'rgba(255,255,255,0.05)', border:`1px solid ${city===c?'rgba(255,122,41,0.4)':'rgba(255,255,255,0.1)'}`, borderRadius:10, padding:'7px 13px', fontSize:12, color:city===c?'#FF7A29':'rgba(255,255,255,0.6)', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>{c}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QUESTION 6: Confirm + Pay */}
          {qIdx===6 && (
            <div className={transitioning ? 'q-exit' : 'q-enter'} key="q-pay">
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:8, fontStyle:'italic' }}>One last thing —</div>
              <h2 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(28px,5vw,44px)', color:'#fff', marginBottom:24, letterSpacing:'-0.02em', lineHeight:1.05 }}>
                Ready to enter<br/>
                <span style={{ background:'linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D)', backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'gradShift 3s linear infinite' }}>the arena?</span>
              </h2>

              {/* Summary */}
              <div style={{ background:'rgba(15,34,71,0.6)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:24, marginBottom:20 }}>
                {[
                  { l:'Name',   v:answers.name },
                  { l:'Email',  v:answers.email },
                  { l:'Role',   v:selectedRole?.label+' · ₹'+price },
                  { l:'City',   v:'📍 '+city },
                ].map(row=>(
                  <div key={row.l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{row.l}</span>
                    <span style={{ fontSize:14, color:'#fff', fontWeight:600 }}>{row.v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:14, marginTop:4 }}>
                  <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, color:'#fff', fontSize:16 }}>Total</span>
                  <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, color:'#FF7A29', fontSize:28 }}>₹{price}</span>
                </div>
              </div>

              <label style={{ display:'flex', gap:10, alignItems:'flex-start', cursor:'pointer', marginBottom:20 }}>
                <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{ marginTop:3, accentColor:'#FF7A29', width:16, height:16 }} />
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>I agree to the <a href="#" style={{ color:'#FF7A29', textDecoration:'none' }}>Terms & Conditions</a> and <a href="#" style={{ color:'#FF7A29', textDecoration:'none' }}>Refund Policy</a>.</span>
              </label>

              <button className="btn-fire" disabled={!agreed} style={{ width:'100%', height:60, fontSize:18, borderRadius:16 }}>
                🏏 Enter the Arena — ₹{price}
              </button>
              <div style={{ textAlign:'center', marginTop:12, fontSize:11, color:'rgba(255,255,255,0.25)' }}>Powered by Razorpay · 256-bit SSL</div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:36 }}>
            {qIdx > 0 && (
              <button onClick={goPrev} style={{ background:'none', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'12px 20px', color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Montserrat,sans-serif', transition:'all 0.2s' }}>
                ← Back
              </button>
            )}
            {qIdx < 6 && (
              <button className="btn-fire" disabled={!canContinue} onClick={goNext} style={{ flex:1, height:52, fontSize:15, borderRadius:14 }}>
                {qIdx===5 ? 'Almost done →' : 'Continue →'}
              </button>
            )}
            {qIdx < 4 && canContinue && (
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', whiteSpace:'nowrap' }}>or press Enter ↵</div>
            )}
          </div>

          {/* Step dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:32 }}>
            {Array.from({length:totalSteps}).map((_,i)=>(
              <div key={i} style={{ width: i===qIdx ? 20 : 6, height:6, borderRadius:3, background: i===qIdx ? '#FF7A29' : i<qIdx ? 'rgba(255,122,41,0.4)' : 'rgba(255,255,255,0.1)', transition:'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile bottom CTA */}
      <div className="bot-cta" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:500, padding:'10px 16px 18px', background:'rgba(4,12,24,0.97)', backdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.07)', gap:10 }}>
        <button className="btn-fire" style={{ flex:2, height:52, fontSize:15 }} disabled={!canContinue} onClick={()=>canContinue&&goNext()}>
          {qIdx===6 ? `🏏 Enter Arena ₹${price}` : 'Continue →'}
        </button>
        <button style={{ flex:1, height:52, background:'linear-gradient(135deg,#25D366,#1BA851)', border:'none', borderRadius:14, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Montserrat,sans-serif' }}>💬 WhatsApp</button>
      </div>
    </div>
  );
}
