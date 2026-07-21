import React from 'react';
import { BCPLFooter } from '../components/BCPLFooter';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#060E1C; }
.wrap { max-width:1280px; margin:0 auto; padding:0 20px; }
.desk-nav { display:none; align-items:center; gap:22px; }
.ham-btn { display:flex; }
.bot-cta { display:flex; }
@media(min-width:768px){ .wrap{padding:0 32px} }
@media(min-width:1024px){ .desk-nav{display:flex!important;} .ham-btn{display:none!important;} .bot-cta{display:none!important;} }
.btn-fire { background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%); border:none; border-radius:14px; color:#fff; font-family:Montserrat,sans-serif; font-weight:800; cursor:pointer; box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2); transition:transform 0.15s,box-shadow 0.2s; letter-spacing:0.02em; animation:pulseGlow 3s ease-in-out infinite; }
.btn-fire:hover { transform:translateY(-2px); box-shadow:0 14px 40px rgba(255,122,41,0.6); }
.btn-fire:active { transform:scale(0.97); }
.btn-wa { background:linear-gradient(135deg,#25D366,#1BA851); border:none; border-radius:14px; color:#fff; font-weight:700; cursor:pointer; font-family:Montserrat,sans-serif; transition:transform 0.15s; }
.glass-card { background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85)); backdrop-filter:blur(32px); border:1px solid rgba(255,255,255,0.09); border-radius:20px; box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06); }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
.tag-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,122,41,0.12); border:1px solid rgba(255,122,41,0.3); border-radius:100px; padding:5px 14px; font-size:11px; font-weight:700; font-family:Montserrat,sans-serif; color:#FF7A29; letter-spacing:0.1em; }
@keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes floatUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulseGlow { 0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)} 50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes scanPulse { 0%,100%{opacity:0.03} 50%{opacity:0.08} }
@keyframes liveBlip { 0%,100%{opacity:1} 50%{opacity:0.2} }
@keyframes floatParticle { 0%{transform:translateY(0) rotate(0deg);opacity:0.4} 50%{opacity:0.8} 100%{transform:translateY(-80px) rotate(180deg);opacity:0} }
@keyframes fadeSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes borderGlow { 0%,100%{border-color:rgba(255,122,41,0.3)} 50%{border-color:rgba(255,122,41,0.8)} }
@keyframes countUp { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
        /* float-reg-btn */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
        @media(max-width:1023px){ .float-reg-btn { display:none; } }
`;

function AmbientBg() {
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.07}} viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
        <path d="M0,400 Q320,320 640,380 Q960,440 1280,360 L1280,720 L0,720 Z" fill="#1a2a4a"/>
        <rect x="80" y="100" width="8" height="300" fill="#334"/>
        <rect x="76" y="80" width="16" height="12" fill="#445" rx="2"/>
        <rect x="1192" y="100" width="8" height="300" fill="#334"/>
        <rect x="1188" y="80" width="16" height="12" fill="#445" rx="2"/>
        <rect x="440" y="420" width="400" height="160" fill="none" stroke="#334" strokeWidth="2"/>
      </svg>
      {[
        {top:'15%',left:'8%',color:'#FF7A29',delay:'0s',size:3},
        {top:'35%',left:'92%',color:'#E8B23D',delay:'1.2s',size:3},
        {top:'60%',left:'5%',color:'#fff',delay:'2.1s',size:2},
        {top:'75%',left:'88%',color:'#FF7A29',delay:'0.7s',size:3},
        {top:'25%',left:'50%',color:'#E8B23D',delay:'1.8s',size:2},
        {top:'85%',left:'30%',color:'#fff',delay:'0.4s',size:3},
        {top:'45%',left:'70%',color:'#FF7A29',delay:'2.5s',size:2},
        {top:'10%',left:'65%',color:'#E8B23D',delay:'1.0s',size:3},
      ].map((p,i)=>(
        <div key={i} style={{position:'absolute',top:p.top,left:p.left,width:p.size,height:p.size,borderRadius:'50%',background:p.color,animation:`floatParticle 6s ease-in-out ${p.delay} infinite`}}/>
      ))}
      <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
    </div>
  );
}

function AnnouncementBar() {
  return (
    <div style={{position:'relative',zIndex:10,background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)',backgroundSize:'300% 100%',animation:'gradShift 4s ease infinite',color:'#fff',padding:'11px 20px',textAlign:'center',fontSize:13,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.04em',display:'flex',alignItems:'center',justifyContent:'center',gap:16,flexWrap:'wrap'}}>
      <span>🏏 Season 5 Registrations OPEN — ₹299 Only</span>
      <span style={{width:1,height:14,background:'rgba(255,255,255,0.4)',display:'inline-block'}}/>
      <span>75 Cities · 10 Franchises · 5,000+ Players</span>
      <span style={{width:1,height:14,background:'rgba(255,255,255,0.4)',display:'inline-block'}}/>
      <span>#OfficeSeStadiumtak</span>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = React.useState(false);
  const links = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact','Login'];
  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:200,background:'rgba(6,14,28,0.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.07)',boxShadow:'0 1px 0 0 rgba(255,122,41,0.25)'}}>
        <div className="wrap" style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <a href="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
            <div style={{width:36,height:36,borderRadius:'50%',overflow:'hidden',flexShrink:0}}>
              <img src={import.meta.env.BASE_URL + "bcpl-assets/bcpl-ball-color.jpg"} alt="BCPL" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
            <div>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:18,lineHeight:1}}>
                <span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff'}}>T20</span>
              </div>
              <div style={{fontSize:9,color:'rgba(255,122,41,0.7)',fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.08em',lineHeight:1,marginTop:2}}>SEASON 5</div>
            </div>
          </a>
          <div className="desk-nav">
            {links.map(l=>(
              <a key={l} href={ROUTE_MAP[l]||'/'} style={{color:l==='About'?'#FF7A29':'rgba(255,255,255,0.75)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',transition:'color 0.2s'}}>{l}</a>
            ))}
            <a href="/register" className="btn-fire" style={{padding:'10px 22px',fontSize:14,textDecoration:'none'}}>Register ₹299</a>
          </div>
          <button className="ham-btn" onClick={()=>setOpen(o=>!o)} style={{flexDirection:'column',gap:5,background:'none',border:'none',cursor:'pointer',padding:8,zIndex:201}}>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(45deg) translate(5px,5px)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'scaleX(0)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(-45deg) translate(5px,-5px)':''}}/>
          </button>
        </div>
      </nav>
      {open && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#06101E',zIndex:300,display:'flex',flexDirection:'column',padding:'72px 24px 40px',overflowY:'auto'}}>
          <button onClick={()=>setOpen(false)} style={{position:'absolute',top:18,right:20,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:28,cursor:'pointer',lineHeight:1}}>✕</button>
          <a href="/" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:32,textDecoration:'none',display:'block'}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff'}}>T20</span></a>
          {links.map(l=>(
            <a key={l} href={ROUTE_MAP[l]||'/'} onClick={()=>setOpen(false)} style={{color:'rgba(255,255,255,0.88)',fontWeight:700,fontSize:20,textDecoration:'none',fontFamily:'Montserrat,sans-serif',padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{l}</a>
          ))}
          <button className="btn-fire" style={{marginTop:32,height:54,fontSize:17,width:'100%'}}>📝 Register for ₹299 →</button>
        </div>
      )}
    </>
  );
}


function MobileStickyCTA() {
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'10px 16px calc(16px + env(safe-area-inset-bottom))',gap:10}}>
      <button className="btn-fire" style={{flex:2,height:52,fontSize:15}}>Register ₹299 →</button>
      <button className="btn-wa" style={{flex:1,height:52,fontSize:14}}>💬 WhatsApp</button>
    </div>
  );
}

const stats = [
  {num:'2 Lakh+',label:'Players',sub:'registered across all seasons'},
  {num:'75+',label:'Trial Cities',sub:'across India'},
  {num:'4',label:'Seasons',sub:'completed since 2023'},
  {num:'10',label:'Franchises',sub:'competing in Season 5'},
];

const timeline = [
  {year:'2023', icon:'🌱', text:'Season 1 — Founded in Delhi. Working professionals took the field for the first time. 500+ players, 5 trial cities, 1 unforgettable dream born.'},
  {year:'2024', icon:'📈', text:'Season 2 — Growth exploded. 25,000+ players across 21 cities. Franchise auction system introduced. Corporate cricket found its identity.'},
  {year:'2025', icon:'🏟️', text:'Season 3 & 4 — Two powerful seasons. 1 Lakh+ registrations, 50+ trial cities, national media coverage. BCPL became India\'s largest corporate cricket league.'},
  {year:'2026', icon:'🏆', text:'Season 4 concluded — 2 Lakh+ players registered. 21 trial cities. Tournament to be held in October 2026. The stage is set for the grandest season yet.'},
  {year:'2026–27', icon:'🚀', text:'Season 5 — Registrations open now. 75+ trial cities. 10 franchise teams. ₹6 Crore prize pool. #OfficeSeStadiumtak. India\'s biggest corporate cricket league awaits you.'},
];

const diffs = [
  {icon:'🏏',title:'vs Local Cricket',body:'No politics. No favoritism. Pure merit through video scouting. Every applicant gets a fair, anonymous evaluation.'},
  {icon:'🏟️',title:'vs Amateur Leagues',body:'Professional grounds. Franchise system. Real auctions. This is as close to IPL as corporate cricket gets.'},
  {icon:'💰',title:'vs Doing Nothing',body:'₹299 gets you in. No other league offers this entry point for a shot at professional-grade cricket.'},
];


const ROUTE_MAP: Record<string,string> = {
  'Home':'/', 'HOME':'/',
  'Match Center':'/match-center', 'MATCH CENTER':'/match-center',
  'Teams':'/teams', 'TEAMS':'/teams',
  'Sponsors':'/sponsors', 'SPONSORS':'/sponsors',
  'Photos':'/photos', 'PHOTOS':'/photos',
  'Videos':'/videos', 'VIDEOS':'/videos',
  'About':'/about', 'ABOUT':'/about',
  'FAQ':'/faq',
  'Contact':'/contact', 'CONTACT':'/contact',
  'Schedule':'/schedule',
  'Points Table':'/points-table',
};

export function About() {
  return (
    <div style={{minHeight:'100vh',background:'#060E1C',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <AnnouncementBar/>
      <Navbar/>

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'100px 0 80px',textAlign:'center'}}>
        <div className="wrap">
          <div className="tag-pill" style={{marginBottom:24,animation:'floatUp 0.6s ease both'}}>OUR STORY</div>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,color:'#fff',marginBottom:12,animation:'floatUp 0.7s ease 0.1s both'}}>
            WHERE OFFICES
          </h1>
          <h1 className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:28,animation:'floatUp 0.7s ease 0.2s both'}}>
            MEET STADIUMS.
          </h1>
          <p style={{color:'rgba(255,255,255,0.65)',fontSize:18,maxWidth:600,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            The world's largest corporate cricket league. Turning working professionals into franchise cricketers since 2020.
          </p>
        </div>
      </section>

      {/* MISSION CARD */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'clamp(20px,5vw,40px) clamp(16px,4vw,48px)',borderLeft:'3px solid #E8B23D',maxWidth:860,margin:'0 auto',animation:'fadeSlide 0.8s ease 0.4s both'}}>
            <div style={{fontSize:32,marginBottom:16}}>💡</div>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(17px,2.2vw,21px)',lineHeight:1.75,fontStyle:'italic'}}>
              "We believe every corporate professional who watched IPL and thought <span style={{color:'#FF7A29',fontWeight:700}}>'I could have played'</span> — deserves a real shot. BCPL exists to give them that shot."
            </p>
            <div style={{marginTop:20,color:'rgba(255,255,255,0.35)',fontSize:13,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.08em'}}>— BCPL FOUNDING MISSION</div>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:20}}>
            {stats.map((s,i)=>(
              <div key={i} className="glass-card" style={{padding:'36px 24px',textAlign:'center',animation:`countUp 3s ease ${i*0.4}s infinite`}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:52,color:'#FF7A29',lineHeight:1,marginBottom:8}}>{s.num}</div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#fff',marginBottom:6}}>{s.label}</div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontFamily:'Inter,sans-serif'}}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="tag-pill" style={{marginBottom:16}}>OUR JOURNEY</div>
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(28px,4vw,44px)',color:'#fff'}}>Five Seasons of <span className="shimmer-gold">Legacy</span></h2>
          </div>
          <div style={{position:'relative',maxWidth:700,margin:'0 auto'}}>
            <div style={{position:'absolute',left:28,top:0,bottom:0,width:2,background:'linear-gradient(180deg,#E8B23D,rgba(232,178,61,0.2))'}}/>
            {timeline.map((t,i)=>(
              <div key={i} style={{display:'flex',gap:28,marginBottom:i<timeline.length-1?40:0,position:'relative',animation:`fadeSlide 0.6s ease ${i*0.15}s both`}}>
                <div style={{width:58,height:58,borderRadius:'50%',background:'linear-gradient(135deg,#FF7A29,#C94E0E)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#fff',flexShrink:0,zIndex:1,boxShadow:'0 0 0 4px rgba(255,122,41,0.2)'}}>
                  {t.year}
                </div>
                <div className="glass-card" style={{flex:1,padding:'20px 24px'}}>
                  <p style={{color:'rgba(255,255,255,0.82)',fontSize:15,lineHeight:1.6}}>{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE'RE DIFFERENT */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="tag-pill" style={{marginBottom:16}}>WHY BCPL</div>
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(28px,4vw,44px)',color:'#fff'}}>How We're <span className="shimmer-gold">Different</span></h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:24}}>
            {diffs.map((d,i)=>(
              <div key={i} className="glass-card" style={{padding:'36px 28px',borderTop:'3px solid #FF7A29',transition:'transform 0.2s',animation:`fadeSlide 0.7s ease ${i*0.15}s both`}}>
                <div style={{fontSize:36,marginBottom:16}}>{d.icon}</div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:17,color:'#FF7A29',marginBottom:12}}>{d.title}</div>
                <p style={{color:'rgba(255,255,255,0.7)',fontSize:14,lineHeight:1.7}}>{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPANY CARD */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'clamp(20px,5vw,48px) clamp(16px,4vw,48px)',maxWidth:860,margin:'0 auto',border:'1px solid rgba(232,178,61,0.25)',animation:'borderGlow 3s ease infinite'}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:32,alignItems:'center',marginBottom:32}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#fff',marginBottom:8}}>BCPL T20 Pvt. Ltd.</div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:13,fontFamily:'Inter,sans-serif'}}>Registered Company · India</div>
              </div>
              <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
                {[{label:'Registered',val:'Company'},{ label:'Track Record',val:'4 Seasons'},{label:'Players Served',val:'2.5 Lakh+'}].map((b,i)=>(
                  <div key={i} style={{textAlign:'center'}}>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20,color:'#E8B23D'}}>{b.val}</div>
                    <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontFamily:'Inter,sans-serif'}}>{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:24}}>
              {['✅ BCCI-Connected Scouting','✅ Professional Grounds','✅ Zero Hidden Fees','✅ Transparent Selection Process'].map((f,i)=>(
                <div key={i} style={{color:'rgba(255,255,255,0.75)',fontSize:14,fontFamily:'Inter,sans-serif'}}>{f}</div>
              ))}
            </div>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:14,fontFamily:'Inter,sans-serif',fontStyle:'italic'}}>Transparent process. Every player treated fairly.</p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 120px',textAlign:'center'}}>
        <div className="wrap">
          <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(24px,3.5vw,40px)',color:'#fff',marginBottom:12}}>
            Join <span style={{color:'#FF7A29'}}>2.5 Lakh+</span> players who took their shot
          </h2>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:15,marginBottom:32}}>Registration open now. ₹299 only.</p>
          <button className="btn-fire" style={{padding:'18px 48px',fontSize:17}}>Register for ₹299 →</button>
        </div>
      </section>

      {/* ── FLOATING REGISTER BUTTON ── */}
      <a className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>🏏 REGISTER NOW &rarr;</a>
      <BCPLFooter />
      <MobileStickyCTA/>
    </div>
  );
}
