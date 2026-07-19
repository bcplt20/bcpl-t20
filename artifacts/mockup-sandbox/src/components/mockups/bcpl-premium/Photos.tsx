import React from 'react';

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
@keyframes pulseGlow { 0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)} 50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes scanPulse { 0%,100%{opacity:0.03} 50%{opacity:0.08} }
@keyframes floatParticle { 0%{transform:translateY(0) rotate(0deg);opacity:0.4} 50%{opacity:0.8} 100%{transform:translateY(-80px) rotate(180deg);opacity:0} }
@keyframes fadeSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes floatUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
.photo-card { position:relative; border-radius:16px; overflow:hidden; cursor:pointer; transition:transform 0.25s,box-shadow 0.25s; break-inside:avoid; margin-bottom:16px; }
.photo-card:hover { transform:scale(1.02); box-shadow:0 20px 60px rgba(0,0,0,0.6); }
.photo-overlay { position:absolute; inset:0; background:linear-gradient(0deg,rgba(0,0,0,0.75) 0%,transparent 50%); opacity:0; transition:opacity 0.25s; display:flex; flex-direction:column; justify-content:flex-end; padding:16px; }
.photo-card:hover .photo-overlay { opacity:1; }
`;

const GRADIENTS = [
  'linear-gradient(135deg,#FF7A29 0%,#0A1628 100%)',
  'linear-gradient(135deg,#8B5CF6 0%,#0A1628 100%)',
  'linear-gradient(135deg,#E8B23D 0%,#1a2a4a 100%)',
  'linear-gradient(135deg,#06B6D4 0%,#0A1628 100%)',
  'linear-gradient(135deg,#22C55E 0%,#0A1628 100%)',
  'linear-gradient(135deg,#E8493F 0%,#1a2a4a 100%)',
  'linear-gradient(135deg,#3B82F6 0%,#0A1628 100%)',
  'linear-gradient(135deg,#F97316 0%,#1e1240 100%)',
  'linear-gradient(135deg,#A78BFA 0%,#06101E 100%)',
  'linear-gradient(135deg,#EC4899 0%,#0A1628 100%)',
  'linear-gradient(135deg,#10B981 0%,#0A1628 100%)',
  'linear-gradient(135deg,#F59E0B 0%,#1a2a4a 100%)',
];

const HEIGHTS = [200, 240, 180, 220, 160, 240, 200, 180, 220, 160, 240, 200];

const PHOTOS = [
  {title:'DEL vs BLR Final · Jul 5',cat:'Match Day'},
  {title:'Opening Ceremony 2025',cat:'Celebrations'},
  {title:'MOM Award Ceremony',cat:'Celebrations'},
  {title:'Boundary! DEL batter',cat:'Match Day'},
  {title:'Mumbai trials — 500 applicants',cat:'Team Trials'},
  {title:'Scout evaluation session',cat:'Team Trials'},
  {title:'Fielding drills Pune',cat:'Training'},
  {title:'Franchise auction board',cat:'Auction'},
  {title:'Bid war — all-rounder',cat:'Auction'},
  {title:'Team jersey reveal DEL',cat:'Celebrations'},
  {title:'Pre-season camp Delhi',cat:'Training'},
  {title:'BCCI coach masterclass',cat:'Training'},
  {title:'Team photo MUM Mavericks',cat:'Team Trials'},
  {title:'Six! AHM batter smashes',cat:'Match Day'},
  {title:'Wicket! BLR bowler celebrates',cat:'Match Day'},
  {title:'Crowd at DY Patil',cat:'Match Day'},
  {title:'Award ceremony Season 5',cat:'Celebrations'},
  {title:'Practice match',cat:'Training'},
  {title:'Player registration day',cat:'Team Trials'},
  {title:'Stadium lights at Kotla',cat:'Match Day'},
  {title:'Morning warm-up',cat:'Training'},
  {title:'Victory lap MUM',cat:'Celebrations'},
  {title:'Trophy presentation',cat:'Celebrations'},
  {title:'Franchise owner + captain',cat:'Auction'},
];

const FILTERS = ['All Photos','Match Day','Team Trials','Auction','Celebrations','Training'];
const SEASONS = ['Season 5','Season 4','Season 3'];

const CAT_COLORS: Record<string,string> = {
  'Match Day':'#FF7A29','Team Trials':'#06B6D4','Auction':'#E8B23D','Celebrations':'#22C55E','Training':'#8B5CF6',
};

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
  const links = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:200,background:'rgba(6,14,28,0.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.07)',boxShadow:'0 1px 0 0 rgba(255,122,41,0.25)'}}>
        <div className="wrap" style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff'}}>T20</span></span>
            <span style={{fontSize:10,color:'rgba(255,122,41,0.7)',fontFamily:'Montserrat,sans-serif',fontWeight:700,marginLeft:8,letterSpacing:'0.08em'}}>SEASON 5</span>
          </div>
          <div className="desk-nav">
            {links.map(l=>(
              <a key={l} href="#" style={{color:l==='Photos'?'#FF7A29':'rgba(255,255,255,0.75)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',transition:'color 0.2s'}}>{l}</a>
            ))}
            <button className="btn-fire" style={{padding:'10px 22px',fontSize:14}}>Register ₹299</button>
          </div>
          <button className="ham-btn" onClick={()=>setOpen(o=>!o)} style={{flexDirection:'column',gap:5,background:'none',border:'none',cursor:'pointer',padding:8,zIndex:201}}>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',transform:open?'rotate(45deg) translate(5px,5px)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',transform:open?'scaleX(0)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',transform:open?'rotate(-45deg) translate(5px,-5px)':''}}/>
          </button>
        </div>
      </nav>
      {open && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#06101E',zIndex:300,display:'flex',flexDirection:'column',padding:'72px 24px 40px',overflowY:'auto'}}>
          <button onClick={()=>setOpen(false)} style={{position:'absolute',top:18,right:20,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:28,cursor:'pointer',lineHeight:1}}>✕</button>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:32}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff'}}>T20</span></div>
          {links.map(l=>(
            <a key={l} href="#" onClick={()=>setOpen(false)} style={{color:'rgba(255,255,255,0.88)',fontWeight:700,fontSize:20,textDecoration:'none',fontFamily:'Montserrat,sans-serif',padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{l}</a>
          ))}
          <button className="btn-fire" style={{marginTop:32,height:54,fontSize:17,width:'100%'}}>📝 Register for ₹299 →</button>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer style={{background:'#040C18',borderTop:'1px solid rgba(255,255,255,0.05)',padding:'48px 0 32px',position:'relative',zIndex:10}}>
      <div className="wrap">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:40,marginBottom:40}}>
          <div>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:26,marginBottom:8}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff'}}>T20</span></div>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.1em',marginBottom:12}}>SEASON 5 · 2025</div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:13,fontFamily:'Inter,sans-serif',lineHeight:1.6}}>#OfficeSeStadiumtak<br/>Relive the dream. Rediscover the thrill.</div>
          </div>
          <div>
            <div style={{color:'rgba(255,255,255,0.3)',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.1em',marginBottom:16,textTransform:'uppercase'}}>League</div>
            {['Schedule','Match Center','Teams','Points Table','Photos','Videos'].map(l=>(
              <a key={l} href="#" style={{display:'block',color:'rgba(255,255,255,0.55)',fontSize:14,fontFamily:'Inter,sans-serif',textDecoration:'none',marginBottom:9}}>{l}</a>
            ))}
          </div>
          <div>
            <div style={{color:'rgba(255,255,255,0.3)',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.1em',marginBottom:16,textTransform:'uppercase'}}>Info</div>
            {['About','FAQ','Contact','Terms','Privacy','Refunds','Eligibility'].map(l=>(
              <a key={l} href="#" style={{display:'block',color:'rgba(255,255,255,0.55)',fontSize:14,fontFamily:'Inter,sans-serif',textDecoration:'none',marginBottom:9}}>{l}</a>
            ))}
          </div>
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:24,display:'flex',flexWrap:'wrap',gap:12,justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'rgba(255,255,255,0.3)',fontSize:12,fontFamily:'Inter,sans-serif'}}>© 2025 Kriparti Playing11 Pvt. Ltd. | www.bcpl-t20.com</div>
          <div style={{color:'rgba(255,255,255,0.25)',fontSize:12,fontFamily:'Inter,sans-serif'}}>All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

function MobileStickyCTA() {
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'10px 16px 18px',gap:10}}>
      <button className="btn-fire" style={{flex:2,height:52,fontSize:15}}>Register ₹299 →</button>
      <button className="btn-wa" style={{flex:1,height:52,fontSize:14}}>💬 WhatsApp</button>
    </div>
  );
}

export function Photos() {
  const [filter, setFilter] = React.useState('All Photos');
  const [season, setSeason] = React.useState('Season 5');
  const [visible, setVisible] = React.useState(12);

  const filtered = filter==='All Photos' ? PHOTOS : PHOTOS.filter(p=>p.cat===filter);
  const shown = filtered.slice(0, visible);

  return (
    <div style={{minHeight:'100vh',background:'#060E1C',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <AnnouncementBar/>
      <Navbar/>

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'100px 0 60px',textAlign:'center'}}>
        <div className="wrap">
          <div className="tag-pill" style={{marginBottom:24,animation:'floatUp 0.6s ease both'}}>SEASON 5 GALLERY</div>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,color:'#fff',marginBottom:12,animation:'floatUp 0.7s ease 0.1s both'}}>
            MOMENTS THAT
          </h1>
          <h1 className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:24,animation:'floatUp 0.7s ease 0.2s both'}}>
            DEFINE US.
          </h1>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:18,maxWidth:520,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            Every boundary. Every wicket. Every dream realized.
          </p>
        </div>
      </section>

      {/* FILTER BAR */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 20px'}}>
        <div className="wrap">
          <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center',marginBottom:16}}>
            {FILTERS.map(f=>(
              <button key={f} onClick={()=>{ setFilter(f); setVisible(12); }} style={{padding:'9px 20px',borderRadius:100,border:`1.5px solid ${filter===f?'#FF7A29':'rgba(255,255,255,0.12)'}`,background:filter===f?'rgba(255,122,41,0.15)':'rgba(255,255,255,0.04)',color:filter===f?'#FF7A29':'rgba(255,255,255,0.6)',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:12,cursor:'pointer',transition:'all 0.2s',letterSpacing:'0.04em'}}>
                {f}
              </button>
            ))}
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'center'}}>
            {SEASONS.map(s=>(
              <button key={s} onClick={()=>setSeason(s)} style={{padding:'7px 16px',borderRadius:100,border:`1px solid ${season===s?'rgba(232,178,61,0.6)':'rgba(255,255,255,0.08)'}`,background:season===s?'rgba(232,178,61,0.1)':'transparent',color:season===s?'#E8B23D':'rgba(255,255,255,0.4)',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11,cursor:'pointer',transition:'all 0.2s',letterSpacing:'0.06em'}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* MASONRY GRID */}
      <section style={{position:'relative',zIndex:1,padding:'20px 0 60px'}}>
        <div className="wrap">
          <div style={{columns:'2 200px',columnGap:16}}>
            {shown.map((p,i)=>{
              const h = HEIGHTS[i % HEIGHTS.length];
              const g = GRADIENTS[i % GRADIENTS.length];
              const catColor = CAT_COLORS[p.cat] || '#FF7A29';
              return (
                <div key={i} className="photo-card" style={{background:g,height:h}}>
                  {/* subtle grid pattern overlay */}
                  <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(255,255,255,0.03) 20px,rgba(255,255,255,0.03) 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(255,255,255,0.03) 20px,rgba(255,255,255,0.03) 21px)'}}/>
                  {/* cricket ball decoration */}
                  <div style={{position:'absolute',top:12,right:12,width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🏏</div>
                  <div className="photo-overlay">
                    <span style={{display:'inline-flex',alignItems:'center',gap:4,background:catColor+'22',border:`1px solid ${catColor}55`,borderRadius:100,padding:'3px 10px',fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:catColor,marginBottom:6,width:'fit-content'}}>{p.cat}</span>
                    <span style={{color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:13,lineHeight:1.3}}>{p.title}</span>
                  </div>
                  {/* always-visible bottom bar */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(0deg,rgba(0,0,0,0.7) 0%,transparent 100%)',padding:'20px 12px 10px',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:4,background:catColor+'33',border:`1px solid ${catColor}44`,borderRadius:100,padding:'2px 8px',fontSize:9,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:catColor}}>{p.cat}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* LOAD MORE */}
          {visible < filtered.length && (
            <div style={{textAlign:'center',marginTop:40}}>
              <button onClick={()=>setVisible(v=>v+12)} className="glass-card" style={{padding:'16px 48px',fontSize:15,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'rgba(255,255,255,0.75)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:14,cursor:'pointer',background:'rgba(255,255,255,0.04)',transition:'all 0.2s'}}>
                Load More Photos ↓
              </button>
            </div>
          )}
        </div>
      </section>

      {/* INSTAGRAM CTA */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 120px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'40px',textAlign:'center',maxWidth:640,margin:'0 auto',border:'1px solid rgba(232,178,61,0.15)'}}>
            <div style={{fontSize:40,marginBottom:12}}>📸</div>
            <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#fff',marginBottom:8}}>
              Follow @bcplt20 for live updates
            </h3>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,marginBottom:24}}>Behind-the-scenes, live match stories, and player spotlights.</p>
            <button style={{padding:'14px 36px',borderRadius:14,background:'linear-gradient(135deg,#E1306C,#F77737,#FCAF45)',border:'none',color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,cursor:'pointer',letterSpacing:'0.02em'}}>
              Follow on Instagram →
            </button>
          </div>
        </div>
      </section>

      <Footer/>
      <MobileStickyCTA/>
    </div>
  );
}
