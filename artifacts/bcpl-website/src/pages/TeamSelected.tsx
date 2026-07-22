import React, { useState } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';

const BOOKING_REF = 'BCPL-S5-7432';
const L = '/__mockup/bcpl-assets/logos/';

const TEAMS = [
  { name:'Rajasthan Scorchers', city:'Jaipur',     color:'#E97B6B', bg:'#1A0808', logo:`${L}rajasthan_scorchers.png`,  abbr:'RS', bid:'₹5,75,000' },
  { name:'Punjab Warriors',     city:'Chandigarh', color:'#DC2626', bg:'#1A0606', logo:`${L}punjab_warriors.png`,     abbr:'PW', bid:'₹4,50,000' },
  { name:'Kolkata Tigers',      city:'Kolkata',    color:'#F97316', bg:'#1A0A04', logo:`${L}kolkata_tigers.png`,      abbr:'KT', bid:'₹6,25,000' },
  { name:'Lucknow Nawabs',      city:'Lucknow',    color:'#F59E0B', bg:'#1A1204', logo:`${L}lucknow_nawabs.png`,      abbr:'LN', bid:'₹7,00,000' },
  { name:'Mumbai Mavericks',    city:'Mumbai',     color:'#3B82F6', bg:'#040E1A', logo:`${L}mumbai_mavericks.png`,    abbr:'MM', bid:'₹8,50,000' },
  { name:'Hyderabad Hawks',     city:'Hyderabad',  color:'#10B981', bg:'#041A10', logo:`${L}hyderabad_hawks.png`,     abbr:'HH', bid:'₹5,25,000' },
  { name:'Delhi Suryas',        city:'Delhi',      color:'#6366F1', bg:'#080A1A', logo:`${L}delhi_suryas.png`,        abbr:'DS', bid:'₹9,00,000' },
  { name:'Chennai Thalaivas',   city:'Chennai',    color:'#2563EB', bg:'#040B1A', logo:`${L}chennai_thalaivas.png`,   abbr:'CT', bid:'₹6,75,000' },
  { name:'Ahmedabad Lions',     city:'Ahmedabad',  color:'#B91C1C', bg:'#1A0404', logo:`${L}ahmedabad_lions.png`,     abbr:'AL', bid:'₹7,50,000' },
  { name:'Bengaluru Rockets',   city:'Bengaluru',  color:'#EF4444', bg:'#1A0606', logo:`${L}bengaluru_rockets.png`,   abbr:'BR', bid:'₹8,00,000' },
];

const ROADMAP = [
  { icon:'📝', label:'Register',     done:true },
  { icon:'🎬', label:'Video',        done:true },
  { icon:'🏟', label:'Phase 2',      done:true },
  { icon:'🪪', label:'KYC',          done:true },
  { icon:'🔨', label:'Auction',      done:true },
  { icon:'🏆', label:'Play BCPL',    done:true, final:true },
];

export function TeamSelected() {
  const [teamIdx, setTeamIdx]   = useState(4); // default: Mumbai Mavericks
  const team = TEAMS[teamIdx];

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', fontFamily:"'Inter',sans-serif", color:'#F0EDE8', overflowX:'hidden', paddingBottom:100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .wrap{max-width:1100px;margin:0 auto;padding:0 16px}
        @media(min-width:640px){.wrap{padding:0 24px}}
        @media(min-width:1024px){.wrap{padding:0 40px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .btn-white{background:#fff;border:none;border-radius:12px;color:#06101E;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:.06em;cursor:pointer;transition:all .2s;text-transform:uppercase}
        .btn-white:hover{filter:brightness(0.9);transform:translateY(-2px)}
        .btn-outline{background:transparent;border:2px solid rgba(255,255,255,0.3);border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:700;cursor:pointer;transition:all .2s}
        .btn-outline:hover{border-color:#fff;background:rgba(255,255,255,0.08)}
        .team-pill{padding:8px 14px;border-radius:12px;font-family:Montserrat,sans-serif;font-weight:800;font-size:11px;cursor:pointer;transition:all .2s;border:1px solid rgba(255,255,255,0.12);background:#0A1727;color:rgba(255,255,255,0.6);letter-spacing:.04em;white-space:nowrap}
        .team-pill:hover{border-color:rgba(255,255,255,0.35);color:#fff}
        .team-pill.active{background:#fff;color:#06101E;border-color:#fff}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulseGreen{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}50%{box-shadow:0 0 0 16px rgba(34,197,94,0)}}
        @keyframes confetti{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
        @keyframes scaleIn{from{transform:scale(0.7) rotate(-10deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes trophyBounce{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.05)}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.1}}
        .shimmer-white{background:linear-gradient(90deg,#fff,rgba(255,255,255,0.7),#fff);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimGold 2s linear infinite}
        .mob-menu{position:fixed;top:0;left:0;right:0;bottom:0;background:#06101E;z-index:999;display:flex;flex-direction:column;padding:80px 32px 32px;gap:24px;overflow-y:auto}
        .mob-menu-link{font-family:Montserrat,sans-serif;font-weight:800;font-size:18px;color:rgba(255,255,255,0.8);text-transform:uppercase;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:20px}
        .close-btn{position:fixed;top:20px;right:24px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;z-index:1000}
        .next-card{background:#0A1727;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;transition:border-color .2s}
        .next-card:hover{border-color:rgba(255,255,255,0.2)}
      `}</style>

      <SiteHeader />

      {/* TEAM PICKER (demo toggle) */}
      <div style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'10px 0', overflowX:'auto' }}>
        <div className="wrap" style={{ display:'flex', gap:8, flexWrap:'nowrap', alignItems:'center' }}>
          <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'.1em', flexShrink:0, textTransform:'uppercase' }}>DEMO · PICK TEAM →</span>
          {TEAMS.map((t,i)=>(
            <button key={t.abbr} className={`team-pill${i===teamIdx?' active':''}`} onClick={()=>setTeamIdx(i)} style={ i===teamIdx ? { background:t.color, borderColor:t.color, color:'#fff' } : {} }>{t.abbr}</button>
          ))}
        </div>
      </div>

      {/* HERO — SIGNED */}
      <section style={{ background:`linear-gradient(160deg,${team.bg} 0%,#06101E 60%)`, padding:'60px 0 0', position:'relative', overflow:'hidden', transition:'background 0.5s' }}>
        {/* Radial glow */}
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 70% 50% at 50% 0%,${team.color}14 0%,transparent 70%)`, pointerEvents:'none', transition:'background 0.5s' }} />
        {/* Top accent line */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,transparent,${team.color},transparent)`, transition:'background 0.5s' }} />
        {/* Logo watermark bg */}
        <div style={{ position:'absolute', right:'-5%', top:'50%', transform:'translateY(-50%)', width:'45%', maxWidth:400, aspectRatio:'1', opacity:0.06, pointerEvents:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <img src={team.logo} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
        </div>

        <div className="wrap" style={{ position:'relative', zIndex:1 }}>
          <div style={{ textAlign:'center', marginBottom:0, animation:'fadeUp 0.6s ease both' }}>
            {/* Trophy */}
            <div style={{ fontSize:'clamp(56px,10vw,100px)', animation:'trophyBounce 2s ease-in-out infinite', marginBottom:20, display:'inline-block' }}>🏆</div>

            <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:`${team.color}18`, border:`1px solid ${team.color}44`, borderRadius:12, padding:'8px 20px', marginBottom:20, transition:'all 0.5s' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E', display:'inline-block', animation:'liveBlip 1.2s infinite' }} />
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'#22C55E', letterSpacing:'.12em' }}>BCPL SEASON 5 · OFFICIALLY SIGNED</span>
            </div>

            <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(24px,5.5vw,60px)', lineHeight:1.05, color:'#fff', textTransform:'uppercase', marginBottom:12, letterSpacing:'-0.01em', animation:'scaleIn 0.5s 0.1s ease both' }}>
              YOU'VE BEEN<br/>
              <span style={{ color:team.color, transition:'color 0.5s' }}>SIGNED!</span>
            </h1>

            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(14px,2vw,18px)', color:'rgba(255,255,255,0.65)', lineHeight:1.6, maxWidth:520, margin:'0 auto 12px', animation:'fadeUp 0.5s 0.2s ease both' }}>
              Congratulations! <strong style={{ color:'#fff' }}>{team.name}</strong> has selected you in the BCPL Season 5 Franchise Auction.
            </p>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'rgba(255,255,255,0.3)', letterSpacing:'.12em', marginBottom:40, animation:'fadeUp 0.5s 0.3s ease both' }}>
              PLAYER REF · {BOOKING_REF}
            </div>
          </div>

          {/* SIGNED CONTRACT CARD */}
          <div style={{ maxWidth:560, margin:'0 auto 0', background:`linear-gradient(135deg,${team.bg},#06101E)`, border:`2px solid ${team.color}`, borderRadius:12, padding:'28px 24px', position:'relative', overflow:'hidden', transition:'all 0.5s', animation:'fadeUp 0.5s 0.35s ease both' }}>
            {/* Ticket notches */}
            <div style={{ position:'absolute', left:-1, top:'50%', width:16, height:32, background:'#06101E', borderRadius:'0 50% 50% 0', border:`2px solid ${team.color}`, borderLeft:'none', transform:'translateY(-50%)' }} />
            <div style={{ position:'absolute', right:-1, top:'50%', width:16, height:32, background:'#06101E', borderRadius:'50% 0 0 50%', border:`2px solid ${team.color}`, borderRight:'none', transform:'translateY(-50%)' }} />

            <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              {/* Team logo */}
              <div style={{ width:72, height:72, borderRadius:4, background:'#fff', padding:4, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <img src={team.logo} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              </div>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:10, color:`${team.color}`, letterSpacing:'.12em', marginBottom:4, textTransform:'uppercase', transition:'color 0.5s' }}>FRANCHISE CONTRACT · SEASON 5</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,3vw,24px)', color:'#fff', marginBottom:2 }}>{team.name}</div>
                <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.5)' }}>{team.city} · Corporate T20 Franchise</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em', marginBottom:3 }}>CONTRACT VALUE</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(22px,4vw,32px)', color:team.color, transition:'color 0.5s' }}>{team.bid}</div>
              </div>
            </div>

            <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${team.color}22`, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, textAlign:'center' }}>
              {[
                { label:'Player', val:'Rahul Sharma' },
                { label:'Role', val:'Batsman' },
                { label:'Ref', val:BOOKING_REF },
              ].map(f=>(
                <div key={f.label}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:3 }}>{f.label}</div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'rgba(255,255,255,0.8)' }}>{f.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height:80, background:'linear-gradient(180deg,transparent,#060C18)', marginTop:40 }} />
      </section>

      <div className="wrap">
        {/* JOURNEY RAIL — all complete */}
        <div style={{ background:'#0A1727', border:'1px solid rgba(34,197,94,0.2)', borderRadius:12, padding:'28px 20px', marginBottom:24 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'.12em', color:'#22C55E', textTransform:'uppercase', marginBottom:20 }}>🏆 JOURNEY COMPLETE · ALL 6 STAGES CLEARED</div>
          <div style={{ display:'flex', alignItems:'center', overflowX:'auto', paddingBottom:8 }}>
            {ROADMAP.map((step,i)=>(
              <React.Fragment key={i}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1, minWidth:64 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:step.final ? 20 : 15, background: step.final ? 'linear-gradient(135deg,#E8B23D,#F59E0B)' : 'linear-gradient(135deg,#22C55E,#16A34A)', border:'none', animation: step.final ? 'trophyBounce 2s ease-in-out infinite' : 'none', color:'#fff', fontWeight:900 }}>
                    {step.final ? '🏆' : '✓'}
                  </div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:10, color:step.final ? '#E8B23D' : '#22C55E', textAlign:'center', letterSpacing:'.04em', lineHeight:1.3 }}>{step.label}</div>
                </div>
                {i<ROADMAP.length-1 && <div style={{ flex:1, height:2, background:'rgba(34,197,94,0.4)', margin:'0 4px', marginBottom:24, minWidth:20 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* WHAT HAPPENS NEXT */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,3vw,24px)', color:'#fff', marginBottom:4, textTransform:'uppercase' }}>What Happens Next?</div>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:20 }}>Your franchise will contact you within 24 hours.</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
            {[
              { icon:'📱', title:'Franchise WhatsApp', body:`You'll be added to the official ${team.name} team WhatsApp group within 24 hours of the auction close.` },
              { icon:'🧢', title:'Team Kit & Jersey', body:'Your custom jersey, training gear, and Season 5 player ID will be dispatched to your address by courier.' },
              { icon:'📅', title:'Training Schedule', body:'Your franchise captain will share the training calendar, match venue, and pre-season camp details.' },
              { icon:'🏟', title:'Season 5 Begins', body:'BCPL Season 5 tournament matches begin Sep–Oct 2026. You\'ll receive your fixture schedule via email + WhatsApp.' },
            ].map(card=>(
              <div key={card.title} className="next-card">
                <div style={{ fontSize:28, marginBottom:10 }}>{card.icon}</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#fff', marginBottom:6 }}>{card.title}</div>
                <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>{card.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SHARE */}
        <div style={{ background:`linear-gradient(135deg,${team.bg},#06101E)`, border:`2px solid ${team.color}33`, borderRadius:12, padding:'28px 24px', textAlign:'center', transition:'all 0.5s', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 80% 60% at 50% 0%,${team.color}08 0%,transparent 70%)`, pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🎉</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(16px,2.5vw,22px)', color:'#fff', marginBottom:6, textTransform:'uppercase' }}>Share Your Milestone</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:24 }}>You made it from office to stadium. Let the world know.</div>
            <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
              {['📲 WhatsApp', '🐦 Twitter/X', '📸 Instagram'].map(btn=>(
                <button key={btn} className="btn-outline" style={{ padding:'12px 22px', fontSize:13, letterSpacing:'.04em' }}>{btn}</button>
              ))}
            </div>
            <div style={{ marginTop:20, fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'rgba(255,255,255,0.25)', letterSpacing:'.1em' }}>#OfficeSeStadiumtak · #BCPLT20 · #{team.name.replace(/\s/g,'')}</div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <BCPLFooter />
    </div>
  );
}
