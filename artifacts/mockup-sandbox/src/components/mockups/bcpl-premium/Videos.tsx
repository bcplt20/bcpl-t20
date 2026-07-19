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
.video-thumb { position:relative; border-radius:14px; overflow:hidden; cursor:pointer; transition:transform 0.25s,box-shadow 0.25s; }
.video-thumb:hover { transform:scale(1.02); box-shadow:0 16px 48px rgba(0,0,0,0.6); }
.video-thumb:hover .play-btn { transform:translate(-50%,-50%) scale(1.1); background:rgba(255,122,41,0.85); }
.play-btn { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:44px; height:44px; border-radius:50%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; transition:all 0.2s; backdrop-filter:blur(4px); border:1.5px solid rgba(255,255,255,0.2); }
.video-card { cursor:pointer; transition:transform 0.2s; }
.video-card:hover { transform:translateY(-4px); }
        /* float-reg-btn */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:2px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
`;

const VIDEOS = [
  {title:'DEL vs BLR Final — Full Highlights',cat:'Match Highlights',dur:'28:14',views:'87K views',date:'2 days ago',g:'linear-gradient(135deg,#3B82F6 0%,#1e3a5f 100%)'},
  {title:'Mumbai Mavericks Squad Reveal 2025',cat:'Team Videos',dur:'6:45',views:'34K views',date:'5 days ago',g:'linear-gradient(135deg,#06B6D4 0%,#0c2a3a 100%)'},
  {title:'Top 10 Catches Season 5',cat:'Compilations',dur:'8:22',views:'52K views',date:'1 week ago',g:'linear-gradient(135deg,#E8B23D 0%,#2a1f0a 100%)'},
  {title:'BCPL Auction 2025 — All Bids',cat:'Auction',dur:'45:00',views:'120K views',date:'2 weeks ago',g:'linear-gradient(135deg,#8B5CF6 0%,#1e0a3a 100%)'},
  {title:'How I Got Shortlisted — Ravi Story',cat:'Interviews',dur:'11:30',views:'28K views',date:'1 week ago',g:'linear-gradient(135deg,#22C55E 0%,#0a2a1a 100%)'},
  {title:'Batting Masterclass BCCI Coach',cat:'Training',dur:'18:45',views:'19K views',date:'2 weeks ago',g:'linear-gradient(135deg,#F97316 0%,#2a1005 100%)'},
  {title:'PUN vs KOL Match Highlights',cat:'Match Highlights',dur:'31:10',views:'41K views',date:'3 days ago',g:'linear-gradient(135deg,#A78BFA 0%,#1a0a3a 100%)'},
  {title:'Season 5 Opening Ceremony',cat:'Events',dur:'12:34',views:'45K views',date:'3 days ago',g:'linear-gradient(135deg,#FF7A29 0%,#2a1205 100%)'},
  {title:'Top 10 Sixes Season 5',cat:'Compilations',dur:'5:30',views:'67K views',date:'1 week ago',g:'linear-gradient(135deg,#EC4899 0%,#2a0a1a 100%)'},
  {title:'AHM vs CHN Last Ball Thriller',cat:'Match Highlights',dur:'25:45',views:'39K views',date:'4 days ago',g:'linear-gradient(135deg,#EF4444 0%,#2a0505 100%)'},
  {title:'Player Testimonials Season 5',cat:'Interviews',dur:'15:20',views:'22K views',date:'2 weeks ago',g:'linear-gradient(135deg,#10B981 0%,#0a2a1a 100%)'},
  {title:'BCPL Season 5 Promo',cat:'Promos',dur:'2:30',views:'95K views',date:'1 month ago',g:'linear-gradient(135deg,#F59E0B 0%,#2a1a05 100%)'},
];

const TABS = ['All','Highlights','Interviews','Trials','Promos'];
const TAB_MAP: Record<string,string[]> = {
  'All':[],'Highlights':['Match Highlights','Compilations'],'Interviews':['Interviews'],'Trials':['Training','Team Videos'],'Promos':['Promos','Events','Auction'],
};

const CAT_COLORS: Record<string,string> = {
  'Match Highlights':'#FF7A29','Team Videos':'#06B6D4','Compilations':'#E8B23D','Auction':'#8B5CF6','Interviews':'#22C55E','Training':'#F97316','Events':'#EC4899','Promos':'#3B82F6',
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
              <a key={l} href="#" style={{color:l==='Videos'?'#FF7A29':'rgba(255,255,255,0.75)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',transition:'color 0.2s'}}>{l}</a>
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

function PlayButton({size=44}:{size?:number}) {
  return (
    <div className="play-btn" style={{width:size,height:size}}>
      <svg width={size*0.4} height={size*0.4} viewBox="0 0 12 14" fill="white">
        <path d="M0 0 L12 7 L0 14 Z"/>
      </svg>
    </div>
  );
}

export function Videos() {
  const [tab, setTab] = React.useState('All');

  const filtered = tab==='All' ? VIDEOS : VIDEOS.filter(v => TAB_MAP[tab]?.includes(v.cat));

  return (
    <div style={{minHeight:'100vh',background:'#060E1C',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <AnnouncementBar/>
      <Navbar/>

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'100px 0 60px',textAlign:'center'}}>
        <div className="wrap">
          <div className="tag-pill" style={{marginBottom:24,animation:'floatUp 0.6s ease both'}}>BCPL TV</div>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,color:'#fff',marginBottom:12,animation:'floatUp 0.7s ease 0.1s both'}}>
            WATCH EVERY
          </h1>
          <h1 className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:24,animation:'floatUp 0.7s ease 0.2s both'}}>
            MOMENT.
          </h1>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:18,maxWidth:520,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            Highlights, interviews, replays — your BCPL content hub.
          </p>
        </div>
      </section>

      {/* FEATURED VIDEO */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 48px'}}>
        <div className="wrap">
          <div className="glass-card" style={{overflow:'hidden',animation:'fadeSlide 0.7s ease 0.1s both'}}>
            <div style={{position:'relative',paddingTop:'56.25%',background:'linear-gradient(135deg,#FF7A29 0%,#C94E0E 30%,#0A1628 100%)',cursor:'pointer'}}>
              {/* decorative overlays */}
              <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(255,255,255,0.02) 30px,rgba(255,255,255,0.02) 31px)'}}/> 
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(0,0,0,0.55)',backdropFilter:'blur(8px)',border:'2px solid rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px rgba(0,0,0,0.5)',transition:'transform 0.2s',cursor:'pointer'}}>
                  <svg width="28" height="28" viewBox="0 0 12 14" fill="white"><path d="M0 0 L12 7 L0 14 Z"/></svg>
                </div>
              </div>
              {/* top-left badge */}
              <div style={{position:'absolute',top:16,left:16}}>
                <span style={{background:'rgba(236,72,153,0.85)',backdropFilter:'blur(8px)',border:'1px solid rgba(236,72,153,0.5)',borderRadius:100,padding:'4px 12px',fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#fff',letterSpacing:'0.08em'}}>EVENTS</span>
              </div>
              {/* duration */}
              <div style={{position:'absolute',bottom:16,right:16,background:'rgba(0,0,0,0.75)',borderRadius:6,padding:'3px 8px',fontSize:12,color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:700}}>12:34</div>
            </div>
            <div style={{padding:'24px 28px 28px',display:'flex',flexWrap:'wrap',gap:20,alignItems:'flex-start',justifyContent:'space-between'}}>
              <div style={{flex:1,minWidth:200}}>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#fff',marginBottom:8,lineHeight:1.3}}>SEASON 5 OPENING CEREMONY</h2>
                <div style={{display:'flex',gap:16,flexWrap:'wrap',color:'rgba(255,255,255,0.45)',fontSize:13,fontFamily:'Inter,sans-serif'}}>
                  <span>▶ 45K views</span>
                  <span>·</span>
                  <span>3 days ago</span>
                  <span>·</span>
                  <span style={{color:'#FF7A29',fontWeight:600}}>BCPL TV</span>
                </div>
              </div>
              <button className="btn-fire" style={{padding:'12px 28px',fontSize:14,flexShrink:0}}>Watch Now →</button>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER TABS */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 32px'}}>
        <div className="wrap">
          <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
            {TABS.map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 24px',borderRadius:100,border:`1.5px solid ${tab===t?'#FF7A29':'rgba(255,255,255,0.12)'}`,background:tab===t?'rgba(255,122,41,0.15)':'rgba(255,255,255,0.04)',color:tab===t?'#FF7A29':'rgba(255,255,255,0.6)',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:13,cursor:'pointer',transition:'all 0.2s',letterSpacing:'0.04em'}}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO GRID */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 60px'}}>
        <div className="wrap">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:24}}>
            {filtered.map((v,i)=>{
              const catColor = CAT_COLORS[v.cat] || '#FF7A29';
              return (
                <div key={i} className="video-card" style={{animation:`fadeSlide 0.5s ease ${(i%3)*0.1}s both`}}>
                  {/* Thumbnail */}
                  <div className="video-thumb" style={{aspectRatio:'16/9',background:v.g,marginBottom:12}}>
                    <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(255,255,255,0.015) 20px,rgba(255,255,255,0.015) 21px)'}}/>
                    <PlayButton size={44}/>
                    {/* category pill */}
                    <div style={{position:'absolute',top:10,left:10}}>
                      <span style={{background:catColor+'cc',backdropFilter:'blur(4px)',borderRadius:100,padding:'3px 10px',fontSize:9,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#fff',letterSpacing:'0.06em'}}>{v.cat}</span>
                    </div>
                    {/* duration */}
                    <div style={{position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,0.8)',borderRadius:5,padding:'2px 7px',fontSize:11,color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:700}}>{v.dur}</div>
                  </div>
                  {/* Info */}
                  <div>
                    <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:15,color:'#fff',marginBottom:6,lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{v.title}</h3>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <div style={{width:20,height:20,borderRadius:'50%',background:'linear-gradient(135deg,#FF7A29,#C94E0E)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,flexShrink:0}}>▶</div>
                      <span style={{color:'rgba(255,255,255,0.45)',fontSize:12,fontFamily:'Inter,sans-serif'}}>BCPL TV</span>
                    </div>
                    <div style={{color:'rgba(255,255,255,0.35)',fontSize:12,fontFamily:'Inter,sans-serif'}}>{v.views} · {v.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* YOUTUBE CTA */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 120px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'48px',textAlign:'center',maxWidth:640,margin:'0 auto',border:'1px solid rgba(255,122,41,0.15)'}}>
            <div style={{fontSize:44,marginBottom:12}}>▶️</div>
            <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,color:'#fff',marginBottom:6}}>Subscribe to BCPL TV</h3>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:14,marginBottom:24,fontFamily:'Inter,sans-serif'}}>23K subscribers · New videos every match day</div>
            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
              <button style={{padding:'14px 36px',borderRadius:14,background:'#FF0000',border:'none',color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',gap:8,letterSpacing:'0.02em'}}>
                <span>▶</span> Subscribe
              </button>
              <button style={{padding:'14px 28px',borderRadius:14,background:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.7)',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:15,cursor:'pointer'}}>
                🔔 Enable Alerts
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FLOATING REGISTER BUTTON ── */}
      <a className='float-reg-btn float-reg-pulse' href='#' style={{textDecoration:'none'}}>🏏 REGISTER NOW &rarr;</a>
      <Footer/>
      <MobileStickyCTA/>
    </div>
  );
}
