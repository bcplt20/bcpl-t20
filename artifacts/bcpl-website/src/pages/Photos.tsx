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
        /* float-reg-btn */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
        @media(max-width:1023px){ .float-reg-btn { display:none; } }
        .photo-masonry { columns:2 160px; column-gap:12px; }
        @media(min-width:640px){ .photo-masonry { columns:3 200px; column-gap:16px; } }
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
          <a href="/" style={{display:'flex',flexDirection:'row',alignItems:'center',gap:8,textDecoration:'none',flexShrink:0,whiteSpace:'nowrap'}}>
            <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL"
              style={{height:36,maxWidth:100,width:'auto',objectFit:'contain',display:'block',filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))',flexShrink:0}}/>
            <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(232,178,61,0.12)',border:'1px solid rgba(232,178,61,0.5)',borderRadius:6,padding:'3px 10px',flexShrink:0}}>
              <span style={{fontSize:9}}>🏆</span>
              <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:9,color:'#E8B23D',letterSpacing:'.12em'}}>SEASON 5</span>
            </div>
          </a>
          <div className="desk-nav">
            {links.map(l=>(
              <a key={l} href={ROUTE_MAP[l]||'/'} style={{color:l==='Photos'?'#FF7A29':'rgba(255,255,255,0.75)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',transition:'color 0.2s'}}>{l}</a>
            ))}
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
          <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{height:36,width:'auto',objectFit:'contain',marginBottom:32,filter:'brightness(1.3)'}}/>
          {links.map(l=>(
            <a key={l} href="#" onClick={()=>{ setOpen(false); window.location.assign(ROUTE_MAP[l]||'/'); }} style={{color:'rgba(255,255,255,0.88)',fontWeight:700,fontSize:20,textDecoration:'none',fontFamily:'Montserrat,sans-serif',padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{l}</a>
          ))}
          <a href="/register" className="btn-fire" style={{marginTop:32,height:54,fontSize:17,width:'100%',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>📝 Register for ₹299 →</a>
        </div>
      )}
    </>
  );
}


function MobileStickyCTA() {
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'10px 16px calc(16px + env(safe-area-inset-bottom))',gap:10}}>
      <a href="/register" className="btn-fire" style={{flex:2,height:52,fontSize:15,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>Register ₹299 →</a>
      <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="btn-wa" style={{flex:1,height:52,fontSize:14,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>💬 WhatsApp</a>
    </div>
  );
}


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

export function Photos() {
  const [filter, setFilter] = React.useState('All Photos');
  const [season, setSeason] = React.useState('Season 5');
  const [visible, setVisible] = React.useState(12);
  const [lightbox, setLightbox] = React.useState<number|null>(null);

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

      {/* COMING SOON */}
      <section style={{position:'relative',zIndex:1,padding:'40px 0 120px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'clamp(40px,8vw,80px) clamp(20px,5vw,60px)',textAlign:'center',maxWidth:600,margin:'0 auto',border:'1px solid rgba(255,122,41,0.15)',animation:'fadeSlide 0.7s ease both'}}>
            <div style={{fontSize:64,marginBottom:20}}>📷</div>
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,4vw,32px)',color:'#fff',marginBottom:12,lineHeight:1.2}}>
              Photos Will Be<br/>
              <span className="shimmer-gold">Uploaded Soon</span>
            </h2>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:15,lineHeight:1.7,maxWidth:420,margin:'0 auto 28px',fontFamily:'Inter,sans-serif'}}>
              Match day galleries, trial ground moments, auction highlights, and celebrations — all coming as Season 5 unfolds.
            </p>
            <a href="https://www.instagram.com/bcplt20" target="_blank" rel="noopener noreferrer"
              style={{display:'inline-flex',alignItems:'center',gap:10,padding:'14px 32px',borderRadius:14,background:'linear-gradient(135deg,#E1306C,#F77737,#FCAF45)',border:'none',color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,cursor:'pointer',letterSpacing:'0.02em',textDecoration:'none'}}>
              📸 Follow @bcplt20 for Updates
            </a>
          </div>
        </div>
      </section>
      {/* ── FLOATING REGISTER BUTTON ── */}
      <a className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>🏏 REGISTER NOW &rarr;</a>
      <BCPLFooter />
      <MobileStickyCTA/>
    </div>
  );
}
