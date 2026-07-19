import React from 'react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.wrap{max-width:1280px;margin:0 auto;padding:0 20px;}
.desk-nav{display:none;align-items:center;gap:22px;}
.ham-btn{display:flex;}
.bot-cta{display:flex;}
@media(min-width:768px){.wrap{padding:0 32px}}
@media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}.bot-cta{display:none!important;}}
.btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;}
.btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
.btn-fire:active{transform:scale(0.97);}
.btn-wa{background:linear-gradient(135deg,#25D366,#1BA851);border:none;border-radius:14px;color:#fff;font-weight:700;cursor:pointer;font-family:Montserrat,sans-serif;transition:transform 0.15s;}
.glass-card{background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85));backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.09);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06);}
.shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
.tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
.match-card{transition:transform 0.2s,box-shadow 0.2s;}
.match-card:hover{transform:translateY(-3px);box-shadow:0 32px 80px rgba(0,0,0,0.6)!important;}
.filter-tab{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:rgba(255,255,255,0.5);font-family:Montserrat,sans-serif;font-weight:700;font-size:12px;padding:8px 18px;cursor:pointer;transition:all 0.2s;letter-spacing:0.06em;}
.filter-tab.active{background:rgba(255,122,41,0.15);border-color:rgba(255,122,41,0.5);color:#FF7A29;}
.filter-tab:hover:not(.active){background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.8);}
@keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
@keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.2}}
@keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
@keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes borderGlow{0%,100%{border-color:rgba(255,122,41,0.3)}50%{border-color:rgba(255,122,41,0.8)}}
`;

const particles = [
  {left:'8%',top:'15%',color:'#FF7A29',delay:'0s',dur:'6s'},
  {left:'22%',top:'65%',color:'#E8B23D',delay:'1.2s',dur:'8s'},
  {left:'48%',top:'30%',color:'#fff',delay:'2.1s',dur:'7s'},
  {left:'65%',top:'75%',color:'#FF7A29',delay:'0.7s',dur:'9s'},
  {left:'78%',top:'12%',color:'#E8B23D',delay:'3.3s',dur:'6.5s'},
  {left:'88%',top:'50%',color:'#fff',delay:'1.8s',dur:'7.5s'},
  {left:'33%',top:'55%',color:'#FF7A29',delay:'4.2s',dur:'8s'},
  {left:'92%',top:'35%',color:'#E8B23D',delay:'2.8s',dur:'6s'},
];

function AmbientBg() {
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.07}} viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
        <path d="M0,600 Q320,480 640,500 Q960,520 1280,480 L1280,720 L0,720 Z" fill="#1a2a4a"/>
        <rect x="80" y="60" width="8" height="200" fill="#334"/>
        <rect x="60" y="58" width="48" height="6" fill="#334"/>
        <rect x="1192" y="60" width="8" height="200" fill="#334"/>
        <rect x="1172" y="58" width="48" height="6" fill="#334"/>
        <rect x="440" y="500" width="400" height="120" fill="none" stroke="#445" strokeWidth="2"/>
      </svg>
      {particles.map((p,i)=>(
        <div key={i} style={{position:'absolute',left:p.left,top:p.top,width:3,height:3,borderRadius:'50%',background:p.color,animation:`floatParticle ${p.dur} ${p.delay} infinite`}}/>
      ))}
      <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
    </div>
  );
}

function AnnouncementBar() {
  return (
    <div style={{background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)',backgroundSize:'300% 100%',animation:'gradShift 4s ease infinite',color:'#fff',padding:'11px 20px',textAlign:'center',position:'relative',zIndex:10,fontSize:12,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.06em'}}>
      <span>🏏 BCPL T20 SEASON 5 — REGISTRATIONS OPEN</span>
      <span style={{margin:'0 14px',opacity:0.5}}>|</span>
      <span>₹299 onwards · 75 cities · 10 teams</span>
      <span style={{margin:'0 14px',opacity:0.5}}>|</span>
      <span style={{color:'rgba(255,255,255,0.85)'}}>#OfficeSeStadiumtak</span>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = React.useState(false);
  const links = [['Home','#'],['Match Center','#'],['Teams','#'],['Sponsors','#'],['Photos','#'],['Videos','#'],['About','#'],['FAQ','#'],['Contact','#']];
  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:200,background:'rgba(6,14,28,0.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.07)',boxShadow:'0 1px 0 0 rgba(255,122,41,0.25)'}}>
        <div className="wrap" style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center'}}>
            <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#FF7A29'}}>BCPL</span>
            <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#fff'}}>T20</span>
            <span style={{fontSize:10,color:'rgba(255,122,41,0.7)',fontFamily:'Montserrat,sans-serif',fontWeight:700,marginLeft:8,letterSpacing:'0.06em'}}>SEASON 5</span>
          </div>
          <div className="desk-nav">
            {links.map(([l,h])=>(
              <a key={l} href={h} style={{color: l==='Schedule' ? '#FF7A29':'rgba(255,255,255,0.72)',fontSize:13,fontWeight:600,fontFamily:'Inter,sans-serif',textDecoration:'none',borderBottom: l==='Schedule'?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2}}>{l}</a>
            ))}
            <button className="btn-fire" style={{padding:'10px 22px',fontSize:13,borderRadius:12}}>Register ₹299</button>
          </div>
          <button className="ham-btn" onClick={()=>setOpen(o=>!o)} style={{flexDirection:'column',gap:5,background:'none',border:'none',cursor:'pointer',padding:8,zIndex:201}}>
            <span style={{display:'block',width:24,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',transform:open?'rotate(45deg) translate(5px,5px)':''}}/>
            <span style={{display:'block',width:24,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',transform:open?'scaleX(0)':''}}/>
            <span style={{display:'block',width:24,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',transform:open?'rotate(-45deg) translate(5px,-5px)':''}}/>
          </button>
        </div>
      </nav>
      {open && (
        <div style={{position:'fixed',inset:0,background:'#06101E',zIndex:300,display:'flex',flexDirection:'column',padding:'80px 28px 40px',overflowY:'auto'}}>
          <button onClick={()=>setOpen(false)} style={{position:'absolute',top:18,right:18,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:28,cursor:'pointer',lineHeight:1}}>✕</button>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:32}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff'}}>T20</span></div>
          {[['🏠 Home','#'],['🔴 Match Center','#'],['🏏 Teams','#'],['🤝 Sponsors','#'],['📷 Photos','#'],['▶️ Videos','#'],['ℹ️ About','#'],['❓ FAQ','#'],['✉️ Contact','#']].map(([l,h])=>(
            <a key={l} href={h} onClick={()=>setOpen(false)} style={{color:'rgba(255,255,255,0.85)',fontWeight:700,fontSize:18,textDecoration:'none',fontFamily:'Montserrat,sans-serif',padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{l}</a>
          ))}
          <button className="btn-fire" style={{marginTop:32,height:54,fontSize:16,borderRadius:14,width:'100%'}}>📝 Register for ₹299 →</button>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer style={{background:'#040C18',borderTop:'1px solid rgba(255,255,255,0.05)',padding:'48px 0 32px',position:'relative',zIndex:10}}>
      <div className="wrap">
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:32,marginBottom:32}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr',gap:32}}>
            <div>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:8}}>
                <span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff'}}>T20</span>
                <span style={{fontSize:11,color:'rgba(255,122,41,0.7)',marginLeft:8,fontFamily:'Montserrat,sans-serif'}}>SEASON 5</span>
              </div>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,lineHeight:1.7,marginBottom:10,fontFamily:'Inter,sans-serif'}}>Relive the dream. Rediscover the thrill.</p>
              <p style={{color:'rgba(255,122,41,0.65)',fontSize:12,fontWeight:700,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.06em'}}>#OfficeSeStadiumtak</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              <div>
                <div style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14,fontFamily:'Montserrat,sans-serif'}}>League</div>
                {['Schedule','Match Center','Teams','Points Table','Photos','Videos'].map(l=>(
                  <div key={l} style={{marginBottom:9}}><a href="#" style={{color:'rgba(255,255,255,0.5)',fontSize:13,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>{l}</a></div>
                ))}
              </div>
              <div>
                <div style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14,fontFamily:'Montserrat,sans-serif'}}>Info</div>
                {['About','FAQ','Contact','Terms','Privacy','Refunds','Eligibility'].map(l=>(
                  <div key={l} style={{marginBottom:9}}><a href="#" style={{color:'rgba(255,255,255,0.5)',fontSize:13,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>{l}</a></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:24,display:'flex',flexWrap:'wrap',gap:12,justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'rgba(255,255,255,0.25)',fontSize:11,fontFamily:'Inter,sans-serif'}}>© 2025 Kriparti Playing11 Pvt. Ltd. · <a href="https://www.bcpl-t20.com" style={{color:'rgba(255,122,41,0.5)',textDecoration:'none'}}>www.bcpl-t20.com</a></div>
          <div style={{color:'rgba(255,255,255,0.2)',fontSize:11,fontFamily:'Inter,sans-serif'}}>Relive the dream. Rediscover the thrill.</div>
        </div>
      </div>
    </footer>
  );
}

type MatchStatus = 'COMPLETED' | 'LIVE' | 'UPCOMING' | 'TBD';

interface Match {
  day: string;
  month: string;
  weekday: string;
  dateKey: string;
  teamA: string;
  teamAEmoji: string;
  teamAFull: string;
  teamB: string;
  teamBEmoji: string;
  teamBFull: string;
  status: MatchStatus;
  venue: string;
  time: string;
  result?: string;
  marquee?: boolean;
  final?: boolean;
  semifinal?: boolean;
  monthGroup: string;
}

const ALL_MATCHES: Match[] = [
  {day:'3',month:'JUL',weekday:'SAT',dateKey:'Jul 3',teamA:'MUM',teamAEmoji:'🌊',teamAFull:'Mumbai Mavericks',teamB:'DEL',teamBEmoji:'🗼',teamBFull:'Delhi Dynamos',status:'COMPLETED',venue:'DY Patil Stadium',time:'6:00 PM IST',result:'MUM 198/4 won by 12 runs',monthGroup:'JULY 2025'},
  {day:'5',month:'JUL',weekday:'MON',dateKey:'Jul 5',teamA:'DEL',teamAEmoji:'🗼',teamAFull:'Delhi Dynamos',teamB:'BLR',teamBEmoji:'🐂',teamBFull:'Bangalore Bulls',status:'COMPLETED',venue:'DY Patil Stadium',time:'6:00 PM IST',result:'DEL 187/4 won by 22 runs',monthGroup:'JULY 2025'},
  {day:'7',month:'JUL',weekday:'WED',dateKey:'Jul 7',teamA:'PUN',teamAEmoji:'🐆',teamAFull:'Pune Panthers',teamB:'KOL',teamBEmoji:'♟️',teamBFull:'Kolkata Knights',status:'COMPLETED',venue:'MCA Stadium',time:'6:00 PM IST',result:'PUN 143/7 won by 4 runs',monthGroup:'JULY 2025'},
  {day:'12',month:'JUL',weekday:'MON',dateKey:'Jul 12',teamA:'AHM',teamAEmoji:'🦁',teamAFull:'Ahmedabad Lions',teamB:'CHN',teamBEmoji:'🌶️',teamBFull:'Chennai Chiefs',status:'LIVE',venue:'DY Patil Stadium',time:'6:00 PM IST',monthGroup:'JULY 2025'},
  {day:'15',month:'JUL',weekday:'THU',dateKey:'Jul 15',teamA:'HYD',teamAEmoji:'🦅',teamAFull:'Hyderabad Hawks',teamB:'LKN',teamBEmoji:'👑',teamBFull:'Lucknow Nawabs',status:'UPCOMING',venue:'Uppal Stadium',time:'6:00 PM IST',monthGroup:'JULY 2025'},
  {day:'17',month:'JUL',weekday:'SAT',dateKey:'Jul 17',teamA:'JAI',teamAEmoji:'🐅',teamAFull:'Jaipur Jaguars',teamB:'BLR',teamBEmoji:'🐂',teamBFull:'Bangalore Bulls',status:'UPCOMING',venue:'SMS Stadium',time:'6:00 PM IST',monthGroup:'JULY 2025'},
  {day:'19',month:'JUL',weekday:'MON',dateKey:'Jul 19',teamA:'MUM',teamAEmoji:'🌊',teamAFull:'Mumbai Mavericks',teamB:'PUN',teamBEmoji:'🐆',teamBFull:'Pune Panthers',status:'UPCOMING',venue:'DY Patil Stadium',time:'6:00 PM IST',monthGroup:'JULY 2025'},
  {day:'22',month:'JUL',weekday:'THU',dateKey:'Jul 22',teamA:'DEL',teamAEmoji:'🗼',teamAFull:'Delhi Dynamos',teamB:'KOL',teamBEmoji:'♟️',teamBFull:'Kolkata Knights',status:'UPCOMING',venue:'Ferozeshah Kotla',time:'6:00 PM IST',monthGroup:'JULY 2025'},
  {day:'24',month:'JUL',weekday:'SAT',dateKey:'Jul 24',teamA:'AHM',teamAEmoji:'🦁',teamAFull:'Ahmedabad Lions',teamB:'HYD',teamBEmoji:'🦅',teamBFull:'Hyderabad Hawks',status:'UPCOMING',venue:'Narendra Modi Stadium',time:'6:00 PM IST',monthGroup:'JULY 2025'},
  {day:'26',month:'JUL',weekday:'MON',dateKey:'Jul 26',teamA:'MUM',teamAEmoji:'🌊',teamAFull:'Mumbai Mavericks',teamB:'DEL',teamBEmoji:'🗼',teamBFull:'Delhi Dynamos',status:'UPCOMING',venue:'DY Patil Stadium',time:'6:00 PM IST',marquee:true,monthGroup:'JULY 2025'},
  {day:'10',month:'AUG',weekday:'SUN',dateKey:'Aug 10',teamA:'SF1',teamAEmoji:'🏏',teamAFull:'Semifinal 1',teamB:'TBD',teamBEmoji:'',teamBFull:'TBD',status:'TBD',venue:'TBD',time:'TBD',semifinal:true,monthGroup:'AUGUST 2025'},
  {day:'11',month:'AUG',weekday:'MON',dateKey:'Aug 11',teamA:'SF2',teamAEmoji:'🏏',teamAFull:'Semifinal 2',teamB:'TBD',teamBEmoji:'',teamBFull:'TBD',status:'TBD',venue:'TBD',time:'TBD',semifinal:true,monthGroup:'AUGUST 2025'},
  {day:'17',month:'AUG',weekday:'SUN',dateKey:'Aug 17',teamA:'TBD',teamAEmoji:'🏆',teamAFull:'Winner SF1',teamB:'TBD',teamBEmoji:'🏆',teamBFull:'Winner SF2',status:'TBD',venue:'TBD',time:'TBD',final:true,monthGroup:'AUGUST 2025'},
];

const TEAMS = ['All Teams','Mumbai Mavericks','Delhi Dynamos','Pune Panthers','Kolkata Knights','Ahmedabad Lions','Bangalore Bulls','Chennai Chiefs','Hyderabad Hawks','Jaipur Jaguars','Lucknow Nawabs'];

function StatusPill({status}: {status: MatchStatus}) {
  if (status === 'LIVE') return (
    <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(232,73,63,0.15)',border:'1px solid rgba(232,73,63,0.4)',borderRadius:100,padding:'4px 12px',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'#E8493F',letterSpacing:'0.08em'}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:'#E8493F',animation:'liveBlip 1s ease-in-out infinite',display:'inline-block'}}/>LIVE
    </span>
  );
  if (status === 'COMPLETED') return (
    <span style={{background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:100,padding:'4px 12px',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'#22C55E',letterSpacing:'0.08em',display:'inline-block'}}>FINAL</span>
  );
  if (status === 'UPCOMING') return (
    <span style={{background:'rgba(59,130,246,0.12)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:100,padding:'4px 12px',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'#60A5FA',letterSpacing:'0.08em',display:'inline-block'}}>UPCOMING</span>
  );
  return (
    <span style={{background:'rgba(232,178,61,0.1)',border:'1px solid rgba(232,178,61,0.25)',borderRadius:100,padding:'4px 12px',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'#E8B23D',letterSpacing:'0.08em',display:'inline-block'}}>TBD</span>
  );
}

export function Schedule() {
  const [activeTab, setActiveTab] = React.useState<'All'|'Upcoming'|'Completed'|'Live'>('All');
  const [teamFilter, setTeamFilter] = React.useState('All Teams');

  const filtered = ALL_MATCHES.filter(m => {
    const tabOk = activeTab === 'All' ||
      (activeTab === 'Upcoming' && (m.status === 'UPCOMING' || m.status === 'TBD')) ||
      (activeTab === 'Completed' && m.status === 'COMPLETED') ||
      (activeTab === 'Live' && m.status === 'LIVE');
    const teamOk = teamFilter === 'All Teams' ||
      m.teamAFull === teamFilter || m.teamBFull === teamFilter;
    return tabOk && teamOk;
  });

  const groups = filtered.reduce<Record<string, Match[]>>((acc, m) => {
    if (!acc[m.monthGroup]) acc[m.monthGroup] = [];
    acc[m.monthGroup].push(m);
    return acc;
  }, {});

  return (
    <div style={{background:'#060E1C',color:'#fff',minHeight:'100vh',overflowX:'hidden',fontFamily:'Inter,sans-serif'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <div style={{position:'relative',zIndex:10}}>
        <AnnouncementBar/>
        <Navbar/>

        {/* HERO */}
        <div style={{padding:'60px 0 48px',textAlign:'center',position:'relative'}}>
          <div className="wrap">
            <div style={{marginBottom:16,display:'flex',justifyContent:'center'}}>
              <span className="tag-pill">📅 SEASON 5 FIXTURES</span>
            </div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(36px,6vw,72px)',lineHeight:1.05,marginBottom:12,color:'#fff'}}>
              EVERY MATCH,
            </h1>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(36px,6vw,72px)',lineHeight:1.05,marginBottom:24}}>
              <span className="shimmer-gold">EVERY MOMENT.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:15,fontFamily:'Inter,sans-serif',maxWidth:520,margin:'0 auto'}}>Full fixture list for BCPL T20 Season 5 · 10 teams · 75 cities · One champion</p>
          </div>
        </div>

        <div className="wrap" style={{paddingBottom:100}}>

          {/* FILTERS */}
          <div className="glass-card" style={{padding:'20px 24px',marginBottom:32}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
              {(['All','Upcoming','Completed','Live'] as const).map(tab=>(
                <button key={tab} className={`filter-tab${activeTab===tab?' active':''}`} onClick={()=>setActiveTab(tab)}>{tab}</button>
              ))}
            </div>
            <div>
              <select
                value={teamFilter}
                onChange={e=>setTeamFilter(e.target.value)}
                style={{background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:12,color:'#F8F4EE',padding:'10px 16px',fontFamily:'Inter,sans-serif',fontSize:14,outline:'none',cursor:'pointer',appearance:'none',minWidth:200,transition:'all 0.25s'}}
              >
                {TEAMS.map(t=><option key={t} value={t} style={{background:'#0A1628'}}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* MATCH GROUPS */}
          {Object.entries(groups).length === 0 && (
            <div style={{textAlign:'center',padding:'60px 0',color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif',fontSize:15}}>No matches found for this filter.</div>
          )}

          {Object.entries(groups).map(([month, matches]) => (
            <div key={month} style={{marginBottom:40}}>
              {/* Month divider */}
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#E8B23D',letterSpacing:'0.15em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{month}</div>
                <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(232,178,61,0.4),transparent)'}}/>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {matches.map((m, i) => (
                  <div
                    key={i}
                    className="glass-card match-card"
                    style={{
                      padding:'18px 20px',
                      border: m.final ? '1px solid rgba(232,178,61,0.4)' : m.marquee ? '1px solid rgba(232,178,61,0.5)' : '1px solid rgba(255,255,255,0.09)',
                      background: m.final ? 'linear-gradient(135deg,rgba(232,178,61,0.1),rgba(15,34,71,0.9))' : m.marquee ? 'linear-gradient(135deg,rgba(232,178,61,0.07),rgba(15,34,71,0.9))' : undefined,
                      animation:`fadeSlide 0.3s ${i*0.05}s ease both`,
                    }}
                  >
                    {m.final && (
                      <div style={{marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:11,color:'#E8B23D',letterSpacing:'0.15em'}}>🏆 GRAND FINAL</span>
                      </div>
                    )}
                    {m.semifinal && (
                      <div style={{marginBottom:10}}>
                        <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11,color:'rgba(255,122,41,0.8)',letterSpacing:'0.12em'}}>🏏 PLAYOFF</span>
                      </div>
                    )}
                    {m.marquee && (
                      <div style={{marginBottom:8}}>
                        <span style={{background:'rgba(232,178,61,0.12)',border:'1px solid rgba(232,178,61,0.3)',borderRadius:6,padding:'2px 10px',fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#E8B23D',letterSpacing:'0.1em'}}>⭐ MARQUEE MATCH</span>
                      </div>
                    )}
                    <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                      {/* Date box */}
                      <div style={{
                        width:64,height:70,borderRadius:12,flexShrink:0,
                        background: m.final ? 'linear-gradient(135deg,#E8B23D,#C4922A)' : 'linear-gradient(135deg,rgba(255,122,41,0.25),rgba(232,97,26,0.15))',
                        border: m.final ? 'none' : '1px solid rgba(255,122,41,0.2)',
                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:1
                      }}>
                        <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:26,color: m.final ? '#060E1C' :'#FF7A29',lineHeight:1}}>{m.day}</div>
                        <div style={{fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color: m.final ? 'rgba(6,14,28,0.7)' : 'rgba(255,122,41,0.7)',letterSpacing:'0.06em'}}>{m.month}</div>
                        <div style={{fontSize:10,fontFamily:'Inter,sans-serif',color: m.final ? 'rgba(6,14,28,0.5)' : 'rgba(255,255,255,0.3)'}}>{m.weekday}</div>
                      </div>

                      {/* Teams */}
                      <div style={{flex:1,minWidth:120}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                          <span style={{fontSize:18}}>{m.teamAEmoji}</span>
                          <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#fff'}}>{m.teamA}</span>
                          <span style={{color:'rgba(255,255,255,0.3)',fontSize:13,fontFamily:'Inter,sans-serif'}}>vs</span>
                          <span style={{fontSize:18}}>{m.teamBEmoji}</span>
                          <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#fff'}}>{m.teamB}</span>
                        </div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
                          <span style={{fontSize:12,color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif'}}>📍 {m.venue}</span>
                          <span style={{fontSize:12,color:'rgba(255,255,255,0.25)',fontFamily:'Inter,sans-serif'}}>· {m.time}</span>
                        </div>
                        {m.result && (
                          <div style={{marginTop:6}}>
                            <span style={{fontSize:12,color:'#22C55E',fontFamily:'Inter,sans-serif',fontWeight:600}}>✓ {m.result}</span>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div style={{flexShrink:0}}>
                        <StatusPill status={m.status}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Download CTA */}
          <div style={{textAlign:'center',marginTop:16}}>
            <button style={{background:'transparent',border:'1.5px solid rgba(255,255,255,0.2)',borderRadius:14,color:'rgba(255,255,255,0.7)',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:14,padding:'14px 32px',cursor:'pointer',transition:'all 0.2s',letterSpacing:'0.04em'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,122,41,0.5)';(e.currentTarget as HTMLButtonElement).style.color='#FF7A29';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,255,255,0.2)';(e.currentTarget as HTMLButtonElement).style.color='rgba(255,255,255,0.7)';}}>
              📅 Download Full Schedule (PDF)
            </button>
          </div>

        </div>
        <Footer/>

        {/* MOBILE STICKY CTA */}
        <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'10px 16px 18px',gap:10}}>
          <button className="btn-fire" style={{flex:2,height:52,fontSize:15}}>Register ₹299 →</button>
          <button className="btn-wa" style={{flex:1,height:52,fontSize:14,borderRadius:14}}>💬 WhatsApp</button>
        </div>
      </div>
    </div>
  );
}
