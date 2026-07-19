import React from 'react';

/* ── VARIANT C: "THE DRESSING ROOM" ─────────────────────────────────
   The underexplored axis: spatial metaphor.
   Registration as walking through a cricket dressing room.
   Role = clicking your position on an actual cricket field SVG.
   City = choosing from a stylised India map with city dots.
   CTA = "Walk Out to the Pitch" not "Register".
   ──────────────────────────────────────────────────────────────────── */

/* Cricket field SVG with clickable positions */
function CricketField({ role, onSelect }: { role:string; onSelect:(r:string)=>void }) {
  const positions = [
    { id:'bat',  label:'Batsman',       x:50, y:28, emoji:'🏏', color:'#3B82F6', note:'Strike batter / Non-striker end' },
    { id:'wk',   label:'Wicket-Keeper', x:50, y:72, emoji:'🧤', color:'#06B6D4', note:'Behind the stumps' },
    { id:'bowl', label:'Bowler',        x:50, y:50, emoji:'🎳', color:'#8B5CF6', note:'At the bowling crease' },
    { id:'ar',   label:'All-Rounder',   x:50, y:50, emoji:'⭐', color:'#F59E0B', note:'Anywhere on the field', premium:true },
  ];
  // Show bat/wk/bowl as distinct positions; ar shown as floating
  const mainPos = [
    { id:'bat',  x:50, y:22, emoji:'🏏', color:'#3B82F6' },
    { id:'wk',   x:50, y:78, emoji:'🧤', color:'#06B6D4' },
    { id:'bowl', x:50, y:50, emoji:'🎳', color:'#8B5CF6' },
  ];

  return (
    <div style={{ position:'relative' }}>
      {/* Field SVG */}
      <svg viewBox="0 0 300 300" style={{ width:'100%', maxWidth:320, margin:'0 auto', display:'block', filter:'drop-shadow(0 8px 32px rgba(0,0,0,0.5))' }}>
        {/* Outfield */}
        <ellipse cx="150" cy="150" rx="145" ry="145" fill="#1A3A0A" stroke="#2A5015" strokeWidth="2"/>
        {/* 30-yard circle */}
        <ellipse cx="150" cy="150" rx="85" ry="85" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="6 4"/>
        {/* Pitch */}
        <rect x="122" y="70" width="56" height="160" rx="4" fill="#3D6B20"/>
        <rect x="128" y="70" width="44" height="160" rx="2" fill="#4A7D28"/>
        {/* Crease lines */}
        <line x1="122" y1="105" x2="178" y2="105" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
        <line x1="122" y1="195" x2="178" y2="195" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
        {/* Stumps top */}
        {[138,150,162].map(x=><line key={x} x1={x} y1="90" x2={x} y2="108" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round"/>)}
        {/* Bail top */}
        <line x1="136" y1="91" x2="164" y2="91" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"/>
        {/* Stumps bottom */}
        {[138,150,162].map(x=><line key={x} x1={x} y1="192" x2={x} y2="210" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round"/>)}
        {/* Bail bottom */}
        <line x1="136" y1="193" x2="164" y2="193" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"/>

        {/* Position markers */}
        {mainPos.map(p => {
          const cx = p.x / 100 * 300;
          const cy = p.y / 100 * 300;
          const isSelected = role === p.id;
          return (
            <g key={p.id} style={{ cursor:'pointer' }} onClick={() => onSelect(p.id)}>
              {/* Glow ring when selected */}
              {isSelected && <circle cx={cx} cy={cy} r="22" fill={`${p.color}30`} stroke={p.color} strokeWidth="2"/>}
              {/* Position circle */}
              <circle cx={cx} cy={cy} r="16" fill={isSelected ? p.color : 'rgba(0,0,0,0.6)'} stroke={isSelected ? p.color : 'rgba(255,255,255,0.25)'} strokeWidth="2"/>
              {/* Emoji */}
              <text x={cx} y={cy+5} textAnchor="middle" fontSize="14">{p.emoji}</text>
            </g>
          );
        })}

        {/* All-rounder — special position top-right of field */}
        <g style={{ cursor:'pointer' }} onClick={() => onSelect('ar')}>
          {role==='ar' && <circle cx="245" cy="80" r="22" fill="rgba(245,158,11,0.25)" stroke="#F59E0B" strokeWidth="2"/>}
          <circle cx="245" cy="80" r="16" fill={role==='ar'?'#F59E0B':'rgba(0,0,0,0.6)'} stroke={role==='ar'?'#F59E0B':'rgba(255,255,255,0.25)'} strokeWidth="2"/>
          <text x="245" y="85" textAnchor="middle" fontSize="14">⭐</text>
          <text x="245" y="105" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.5)" fontFamily="Montserrat,sans-serif" fontWeight="700">ALL-RDR</text>
        </g>

        {/* Labels */}
        <text x="150" y="14" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)" fontFamily="Montserrat,sans-serif" fontWeight="700">BATSMAN END</text>
        <text x="150" y="296" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)" fontFamily="Montserrat,sans-serif" fontWeight="700">KEEPER END</text>
      </svg>

      {/* Role info box */}
      {role && (() => {
        const pos = [...mainPos, {id:'ar',x:0,y:0,emoji:'⭐',color:'#F59E0B'}].find(p=>p.id===role);
        const info: Record<string,{label:string;note:string;price:number;premium?:boolean}> = {
          bat:  {label:'Batsman',       note:'You score runs & anchor the innings.',           price:299},
          wk:   {label:'Wicket-Keeper', note:'The backbone. Behind every ball.',               price:299},
          bowl: {label:'Bowler',        note:'You take wickets & dry up runs.',                price:299},
          ar:   {label:'All-Rounder',   note:'You can do both. Scouts want you most.',         price:399, premium:true},
        };
        const r = info[role];
        return (
          <div style={{ marginTop:16, background:`${pos?.color}15`, border:`1px solid ${pos?.color}40`, borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', animation:'floatUp 0.3s ease' }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:16, color:'#fff', marginBottom:4 }}>
                {pos?.emoji} {r.label} {r.premium && <span style={{ fontSize:10, background:'rgba(245,158,11,0.2)', color:'#F59E0B', border:'1px solid rgba(245,158,11,0.4)', borderRadius:6, padding:'2px 6px', fontWeight:700, marginLeft:6 }}>PREMIUM</span>}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{r.note}</div>
            </div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:28, color: pos?.color }}>₹{r.price}</div>
          </div>
        );
      })()}
    </div>
  );
}

/* India-inspired city cluster */
function CityMap({ selected, onSelect }: { selected:string; onSelect:(c:string)=>void }) {
  // City dots with approximate % positions on an India bounding box
  const cities = [
    {name:'Delhi',     x:45, y:22, big:true},
    {name:'Noida',     x:47, y:24},
    {name:'Gurugram',  x:43, y:24},
    {name:'Jaipur',    x:38, y:30},
    {name:'Lucknow',   x:54, y:28},
    {name:'Kanpur',    x:52, y:30},
    {name:'Agra',      x:46, y:28},
    {name:'Patna',     x:62, y:32},
    {name:'Kolkata',   x:72, y:38, big:true},
    {name:'Bhubaneswar',x:68,y:46},
    {name:'Mumbai',    x:34, y:50, big:true},
    {name:'Pune',      x:35, y:54},
    {name:'Ahmedabad', x:28, y:40, big:true},
    {name:'Surat',     x:30, y:46},
    {name:'Nagpur',    x:50, y:48},
    {name:'Hyderabad', x:50, y:60, big:true},
    {name:'Bengaluru', x:46, y:68, big:true},
    {name:'Chennai',   x:54, y:68, big:true},
    {name:'Kochi',     x:44, y:78},
    {name:'Indore',    x:42, y:40},
    {name:'Bhopal',    x:44, y:40},
    {name:'Chandigarh',x:43, y:17},
  ];

  return (
    <div style={{ position:'relative', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:16, overflow:'hidden' }}>
      {/* India silhouette SVG (rough outline) */}
      <svg viewBox="0 0 300 380" style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.08 }}>
        <path d="M120,10 L150,8 L175,15 L200,30 L215,55 L225,85 L230,110 L235,140 L230,170 L220,200 L215,230 L220,250 L225,265 L215,280 L200,295 L185,310 L170,330 L155,355 L145,370 L135,355 L125,335 L115,310 L100,295 L85,285 L75,270 L80,250 L75,230 L65,210 L55,190 L50,165 L45,140 L50,110 L55,85 L60,60 L70,40 L90,22 Z" fill="#1E40AF" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      </svg>

      {/* City dots */}
      <div style={{ position:'relative', height:300 }}>
        {cities.map(c=>{
          const isSelected = selected===c.name;
          return (
            <button
              key={c.name}
              onClick={()=>onSelect(c.name)}
              title={c.name}
              style={{
                position:'absolute',
                left:`${c.x}%`,
                top:`${c.y * 3}px`,
                width: isSelected ? 28 : c.big ? 12 : 8,
                height: isSelected ? 28 : c.big ? 12 : 8,
                borderRadius:'50%',
                background: isSelected ? '#FF7A29' : c.big ? 'rgba(255,122,41,0.6)' : 'rgba(255,255,255,0.35)',
                border: isSelected ? '2px solid #FF7A29' : c.big ? '1px solid rgba(255,122,41,0.4)' : '1px solid rgba(255,255,255,0.2)',
                cursor:'pointer',
                transition:'all 0.25s',
                transform:'translate(-50%,-50%)',
                boxShadow: isSelected ? '0 0 16px rgba(255,122,41,0.8)' : c.big ? '0 0 8px rgba(255,122,41,0.3)' : 'none',
                zIndex: isSelected ? 10 : 1,
              }}
            />
          );
        })}
      </div>

      {selected && (
        <div style={{ position:'absolute', bottom:12, left:12, right:12, background:'rgba(255,122,41,0.15)', border:'1px solid rgba(255,122,41,0.4)', borderRadius:10, padding:'8px 12px', textAlign:'center' }}>
          <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#FF7A29' }}>📍 {selected}</span>
        </div>
      )}
    </div>
  );
}

const STEPS_DRESSING = [
  { id:'locker',  label:'Your Locker',    emoji:'🪪', desc:'Fill in your details' },
  { id:'field',   label:'Your Position',  emoji:'🏟️', desc:'Pick your role on the field' },
  { id:'city',    label:'Your Ground',    emoji:'📍', desc:'Choose your trial city' },
  { id:'kit',     label:'Your Kit Fee',   emoji:'🏆', desc:'Walk out to the pitch' },
];

export function RegVariantC() {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({name:'',email:'',phone:''});
  const [role, setRole] = React.useState('');
  const [city, setCity] = React.useState('');
  const [agreed, setAgreed] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const navLinks = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];

  const priceMap: Record<string,number> = {bat:299,bowl:299,wk:299,ar:399};
  const roleLabel: Record<string,string> = {bat:'Batsman',bowl:'Bowler',wk:'Wicket-Keeper',ar:'All-Rounder'};
  const price = role ? priceMap[role] : 299;

  const canNext = step===0 ? (form.name && form.email && form.phone) : step===1 ? !!role : step===2 ? !!city : agreed;

  return (
    <div style={{ background:'#060E1C', minHeight:'100vh', color:'#F8F4EE', fontFamily:'Inter,sans-serif', overflowX:'hidden', paddingBottom:120 }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8)}}
        @keyframes floatUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes stepEnter{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        .btn-fire{background:linear-gradient(135deg,#FF7A29,#E8611A,#C94E0E);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45);transition:transform 0.15s;animation:pulseGlow 3s ease-in-out infinite;letter-spacing:0.02em}
        .btn-fire:hover{transform:translateY(-2px)}
        .btn-fire:disabled{opacity:0.35;cursor:not-allowed;animation:none}
        .inp{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:14px;color:#F8F4EE;padding:14px 18px;font-family:Inter,sans-serif;font-size:15px;outline:none;transition:all 0.25s}
        .inp:focus{border-color:#FF7A29;background:rgba(255,122,41,0.05)}
        .inp::placeholder{color:rgba(255,255,255,0.25)}
        .lbl{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;display:block}
        .wrap{max-width:900px;margin:0 auto;padding:0 20px}
        .desk-nav{display:none;align-items:center;gap:20px}
        .ham-btn{display:flex}
        .bot-cta{display:flex}
        @media(min-width:768px){.wrap{padding:0 32px}}
        @media(min-width:1024px){.desk-nav{display:flex!important}.ham-btn{display:none!important}.bot-cta{display:none!important}}
        .step-active{animation:stepEnter 0.4s cubic-bezier(0.34,1.56,0.64,1) both}
        .locker-texture{background-image:repeating-linear-gradient(90deg,rgba(255,255,255,0.02) 0px,rgba(255,255,255,0.02) 1px,transparent 1px,transparent 60px),repeating-linear-gradient(0deg,rgba(255,255,255,0.02) 0px,rgba(255,255,255,0.02) 1px,transparent 1px,transparent 60px)}
      `}</style>

      {/* Ambient background */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 15% 30%, rgba(255,122,41,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 20%, rgba(30,64,175,0.1) 0%, transparent 60%)' }} />
        {[...Array(5)].map((_,i)=><div key={i} style={{ position:'absolute', width:3, height:3, borderRadius:'50%', background:i%2?'#FF7A29':'#E8B23D', left:`${12+i*16}%`, bottom:`${10+i*14}%`, opacity:0.5, animation:`liveBlip ${3+i*0.5}s ease-in-out ${i*0.4}s infinite` }} />)}
      </div>

      {/* Announcement bar */}
      <div style={{ position:'relative', zIndex:10, background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', color:'#fff', padding:'10px 20px', textAlign:'center', fontSize:12, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'0.08em' }}>
        🏏 VARIANT C · THE DRESSING ROOM &nbsp;·&nbsp; Click your position on the field &nbsp;·&nbsp; #OfficeSeStadiumtak
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
          <button className="ham-btn" onClick={()=>setOpen(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', padding:8, flexDirection:'column', gap:5 }}>
            {[0,1,2].map(i=><span key={i} style={{ display:'block', width:24, height:2, background:'#fff', borderRadius:12, transition:'all 0.25s', transform:i===0&&open?'rotate(45deg) translate(5px,5px)':i===1&&open?'scaleX(0)':i===2&&open?'rotate(-45deg) translate(5px,-5px)':'' }} />)}
          </button>
        </div>
      </nav>

      {open && <div style={{ position:'fixed', inset:0, background:'#06101E', zIndex:250, display:'flex', flexDirection:'column', padding:'80px 24px 40px', overflowY:'auto' }}>
        <button onClick={()=>setOpen(false)} style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:40, height:40, borderRadius:10, cursor:'pointer', fontSize:18 }}>✕</button>
        {navLinks.map(l=><a key={l} href="#" style={{ color:'rgba(255,255,255,0.9)', fontWeight:700, fontSize:20, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'block' }}>{l}</a>)}
      </div>}

      <div style={{ position:'relative', zIndex:5, padding:'36px 0 0' }}>
        <div className="wrap">
          {/* Page header */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.3)', borderRadius:100, padding:'5px 14px', fontSize:11, fontWeight:700, color:'#FF7A29', fontFamily:'Montserrat,sans-serif', letterSpacing:'0.1em' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#FF7A29', animation:'liveBlip 1.2s ease-in-out infinite' }} />
                DRESSING ROOM OPEN
              </span>
            </div>
            <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(28px,5vw,44px)', lineHeight:1.05, letterSpacing:'-0.02em', marginBottom:8 }}>
              Get Ready.<br/>
              <span style={{ background:'linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D)', backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'shimmer 3s linear infinite' }}>Walk Out to the Pitch.</span>
            </h1>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14 }}>Four stations. Five minutes. One chance.</p>
          </div>

          {/* Station nav strip */}
          <div style={{ display:'flex', gap:4, marginBottom:32, overflowX:'auto', paddingBottom:4 }}>
            {STEPS_DRESSING.map((s,i)=>(
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:12, background:step===i?'rgba(255,122,41,0.15)':step>i?'rgba(34,197,94,0.08)':'rgba(255,255,255,0.03)', border:`1px solid ${step===i?'rgba(255,122,41,0.4)':step>i?'rgba(34,197,94,0.25)':'rgba(255,255,255,0.07)'}`, cursor: step>i ? 'pointer' : 'default', transition:'all 0.2s', whiteSpace:'nowrap' }} onClick={()=>step>i&&setStep(i)}>
                <span style={{ fontSize:16 }}>{step>i ? '✅' : s.emoji}</span>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color: step===i?'#FF7A29':step>i?'#22C55E':'rgba(255,255,255,0.35)', letterSpacing:'0.1em', textTransform:'uppercase' }}>STATION {i+1}</div>
                  <div style={{ fontSize:12, fontWeight:600, color: step===i?'#fff':step>i?'rgba(34,197,94,0.9)':'rgba(255,255,255,0.4)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* STATION 0: YOUR LOCKER */}
          {step===0 && (
            <div className="step-active">
              <div style={{ background:'linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85))', border:'1px solid rgba(255,255,255,0.09)', borderRadius:24, padding:32, position:'relative', overflow:'hidden' }} className="locker-texture">
                {/* Locker icon */}
                <div style={{ position:'absolute', top:20, right:24, fontSize:48, opacity:0.08 }}>🔐</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff', marginBottom:6 }}>🪪 Station 1 — Your Locker</div>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginBottom:28 }}>Your personal details go in your locker before you step out.</p>
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div>
                    <label className="lbl">Full Name *</label>
                    <input className="inp" placeholder="e.g. Rahul Sharma" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus />
                  </div>
                  <div>
                    <label className="lbl">Work Email *</label>
                    <input className="inp" type="email" placeholder="rahul@company.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
                  </div>
                  <div>
                    <label className="lbl">Phone *</label>
                    <input className="inp" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATION 1: YOUR POSITION */}
          {step===1 && (
            <div className="step-active">
              <div style={{ background:'linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85))', border:'1px solid rgba(255,255,255,0.09)', borderRadius:24, padding:32 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff', marginBottom:6 }}>🏟️ Station 2 — Your Position</div>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginBottom:24 }}>Tap your position on the field. This determines how scouts evaluate your video.</p>
                <CricketField role={role} onSelect={setRole} />
              </div>
            </div>
          )}

          {/* STATION 2: YOUR GROUND */}
          {step===2 && (
            <div className="step-active">
              <div style={{ background:'linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85))', border:'1px solid rgba(255,255,255,0.09)', borderRadius:24, padding:32 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff', marginBottom:6 }}>📍 Station 3 — Your Ground</div>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginBottom:24 }}>Pick your trial city from the map below — or use quick select.</p>

                {/* Quick select */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
                  {['Mumbai','Delhi','Bengaluru','Pune','Hyderabad','Chennai','Kolkata','Ahmedabad','Jaipur','Lucknow'].map(c=>(
                    <button key={c} onClick={()=>setCity(c)} style={{ background:city===c?'rgba(255,122,41,0.2)':'rgba(255,255,255,0.05)', border:`1px solid ${city===c?'rgba(255,122,41,0.5)':'rgba(255,255,255,0.1)'}`, borderRadius:10, padding:'8px 14px', fontSize:13, fontWeight:600, color:city===c?'#FF7A29':'rgba(255,255,255,0.6)', cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.2s' }}>
                      {city===c?'📍 ':''}{c}
                    </button>
                  ))}
                </div>

                {/* Map */}
                <CityMap selected={city} onSelect={setCity} />
              </div>
            </div>
          )}

          {/* STATION 3: KIT FEE */}
          {step===3 && (
            <div className="step-active">
              <div style={{ background:'linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85))', border:'1px solid rgba(255,255,255,0.09)', borderRadius:24, padding:32 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff', marginBottom:6 }}>🏆 Station 4 — Your Kit Fee</div>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginBottom:28 }}>Pay your entry. Then walk out to the pitch.</p>

                {/* Receipt-style summary */}
                <div style={{ background:'#040C18', borderRadius:18, padding:24, marginBottom:24, border:'1px solid rgba(255,255,255,0.06)', fontFamily:'monospace' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em', marginBottom:20, textTransform:'uppercase', textAlign:'center' }}>— BCPL KIT FEE RECEIPT —</div>
                  {[
                    {l:'Player Name', v:form.name},
                    {l:'Position',    v:role ? roleLabel[role] : '—'},
                    {l:'Trial City',  v:city || '—'},
                    {l:'Season',      v:'5 (2025)'},
                  ].map(row=>(
                    <div key={row.l} style={{ display:'flex', justifyContent:'space-between', marginBottom:10, fontSize:13 }}>
                      <span style={{ color:'rgba(255,255,255,0.4)' }}>{row.l}</span>
                      <span style={{ color:'#fff', fontWeight:600 }}>{row.v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:'1px dashed rgba(255,255,255,0.1)', paddingTop:16, marginTop:8, display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'rgba(255,255,255,0.5)', fontSize:14 }}>Kit Fee</span>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:32, color:'#FF7A29' }}>₹{price}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:12 }}>
                    {['Auction fee = ₹0','Tournament fee = ₹0','7-day refund guarantee'].map(t=>(
                      <div key={t} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#22C55E' }}>
                        <span>✓</span><span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <label style={{ display:'flex', gap:10, alignItems:'flex-start', cursor:'pointer', marginBottom:24 }}>
                  <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{ marginTop:3, accentColor:'#FF7A29', width:16, height:16 }} />
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>I've read and agree to the <a href="#" style={{ color:'#FF7A29', textDecoration:'none' }}>Terms</a>, <a href="#" style={{ color:'#FF7A29', textDecoration:'none' }}>Refund Policy</a>, and <a href="#" style={{ color:'#FF7A29', textDecoration:'none' }}>Eligibility Criteria</a>.</span>
                </label>

                <button className="btn-fire" disabled={!agreed} style={{ width:'100%', height:64, fontSize:18, borderRadius:18 }}>
                  🏏 Walk Out to the Pitch — ₹{price}
                </button>
                <div style={{ textAlign:'center', marginTop:12, fontSize:11, color:'rgba(255,255,255,0.25)' }}>Powered by Razorpay · 256-bit SSL · Kriparti Playing11 Pvt. Ltd.</div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display:'flex', gap:12, marginTop:24 }}>
            {step>0 && <button onClick={()=>setStep(s=>s-1)} style={{ flex:1, height:52, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, color:'rgba(255,255,255,0.7)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Montserrat,sans-serif' }}>← Back to Station {step}</button>}
            {step<3 && <button className="btn-fire" disabled={!canNext} onClick={()=>canNext&&setStep(s=>s+1)} style={{ flex:2, height:52, fontSize:15, borderRadius:14 }}>
              Enter Station {step+2} →
            </button>}
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="bot-cta" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:500, padding:'10px 16px 18px', background:'rgba(4,12,24,0.97)', backdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.07)', gap:10 }}>
        <button className="btn-fire" style={{ flex:2, height:52, fontSize:15 }} disabled={!canNext} onClick={()=>canNext&&(step<3?setStep(s=>s+1):null)}>
          {step===3 ? `🏏 Walk Out ₹${price}` : `Enter Station ${step+2} →`}
        </button>
        <button style={{ flex:1, height:52, background:'linear-gradient(135deg,#25D366,#1BA851)', border:'none', borderRadius:14, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Montserrat,sans-serif' }}>💬 WhatsApp</button>
      </div>
    </div>
  );
}
