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
.inp{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:14px;color:#F8F4EE;padding:15px 18px;font-family:Inter,sans-serif;font-size:15px;outline:none;transition:all 0.25s;appearance:none;}
.inp:focus{border-color:#FF7A29;background:rgba(255,122,41,0.06);box-shadow:0 0 0 4px rgba(255,122,41,0.12);}
.inp::placeholder{color:rgba(255,255,255,0.28);}
.lbl{font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:8px;display:block;}
.mc-result-card{transition:transform 0.2s,box-shadow 0.2s;}
.mc-result-card:hover{transform:translateY(-4px);box-shadow:0 32px 80px rgba(0,0,0,0.6)!important;}
.sc-row:hover{background:rgba(255,122,41,0.05);}
@keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes floatUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes tickerMove{from{transform:translateX(100%)}to{transform:translateX(-100%)}}
@keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
@keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.2}}
@keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
@keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes borderGlow{0%,100%{border-color:rgba(255,122,41,0.3)}50%{border-color:rgba(255,122,41,0.8)}}
@keyframes countUp{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
`;

const particles = [
  {left:'10%',top:'20%',color:'#FF7A29',delay:'0s',dur:'6s'},
  {left:'25%',top:'70%',color:'#E8B23D',delay:'1s',dur:'8s'},
  {left:'45%',top:'35%',color:'#fff',delay:'2s',dur:'7s'},
  {left:'60%',top:'80%',color:'#FF7A29',delay:'0.5s',dur:'9s'},
  {left:'75%',top:'15%',color:'#E8B23D',delay:'3s',dur:'6.5s'},
  {left:'85%',top:'55%',color:'#fff',delay:'1.5s',dur:'7.5s'},
  {left:'35%',top:'50%',color:'#FF7A29',delay:'4s',dur:'8s'},
  {left:'90%',top:'30%',color:'#E8B23D',delay:'2.5s',dur:'6s'},
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
          <div style={{display:'flex',alignItems:'center',gap:0}}>
            <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#FF7A29'}}>BCPL</span>
            <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#fff'}}>T20</span>
            <span style={{fontSize:10,color:'rgba(255,122,41,0.7)',fontFamily:'Montserrat,sans-serif',fontWeight:700,marginLeft:8,letterSpacing:'0.06em'}}>SEASON 5</span>
          </div>
          <div className="desk-nav">
            {links.map(([l,h])=>(
              <a key={l} href={h} style={{color: l==='Match Center'?'#FF7A29':'rgba(255,255,255,0.72)',fontSize:13,fontWeight:600,fontFamily:'Inter,sans-serif',textDecoration:'none',transition:'color 0.2s',borderBottom: l==='Match Center'?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2}}>{l}</a>
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
                  <div key={l} style={{marginBottom:9}}><a href="#" style={{color:'rgba(255,255,255,0.5)',fontSize:13,textDecoration:'none',fontFamily:'Inter,sans-serif',transition:'color 0.2s'}}>{l}</a></div>
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

const results = [
  {badge:'FINAL',date:'Jul 5',venue:'DY Patil Stadium',teamA:'DEL 🗼',scoreA:'187/4',scoreB:'165/8',teamB:'BLR 🐂',won:true,mom:'A. Kumar 87(54)'},
  {badge:'LEAGUE',date:'Jul 3',venue:'Wankhede Stadium',teamA:'PUN 🐆',scoreA:'143/7',scoreB:'139/9',teamB:'KOL ♟️',won:true,mom:'S. Mehta 45(32) · 3wkts'},
  {badge:'LEAGUE',date:'Jul 1',venue:'Sawai Man Singh',teamA:'AHM 🦁',scoreA:'201/3',scoreB:'178/6',teamB:'CHN 🌶️',won:true,mom:'R. Singh 78(48)'},
  {badge:'LEAGUE',date:'Jun 29',venue:'Uppal Stadium',teamA:'HYD 🦅',scoreA:'156/8',scoreB:'153/7',teamB:'LKN 👑',won:true,mom:'P. Nair 4/22'},
  {badge:'LEAGUE',date:'Jun 27',venue:'DY Patil Stadium',teamA:'MUM 🌊',scoreA:'198/3',scoreB:'180/7',teamB:'JAI 🐅',won:true,mom:'V. Kumar 92(56)'},
];

const miniStandings = [
  {rank:1,team:'🌊 MUM',pts:12,nrr:'+1.24'},
  {rank:2,team:'🐂 BLR',pts:14,nrr:'+1.56'},
  {rank:3,team:'🗼 DEL',pts:10,nrr:'+0.87'},
  {rank:4,team:'🦅 HYD',pts:10,nrr:'+0.92'},
];

export function MatchCenter() {
  const [scorecardOpen, setScorecardOpen] = React.useState(true);

  return (
    <div style={{background:'#060E1C',color:'#fff',minHeight:'100vh',overflowX:'hidden',fontFamily:'Inter,sans-serif'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <div style={{position:'relative',zIndex:10}}>
        <AnnouncementBar/>
        <Navbar/>

        {/* LIVE ALERT BAR */}
        <div style={{background:'linear-gradient(90deg,rgba(232,73,63,0.15),rgba(232,73,63,0.08),rgba(232,73,63,0.15))',borderBottom:'1px solid rgba(232,73,63,0.3)',padding:'12px 0',textAlign:'center'}}>
          <div className="wrap" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,flexWrap:'wrap'}}>
            <span style={{width:10,height:10,borderRadius:'50%',background:'#E8493F',display:'inline-block',animation:'liveBlip 1s ease-in-out infinite'}}/>
            <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13,color:'#E8493F',letterSpacing:'0.12em'}}>LIVE COVERAGE</span>
            <span style={{color:'rgba(255,255,255,0.6)',fontSize:13}}>—</span>
            <span style={{fontFamily:'Inter,sans-serif',fontSize:13,color:'rgba(255,255,255,0.85)',fontWeight:600}}>Mumbai Mavericks vs Delhi Dynamos · SAT 26 JULY · 6PM IST</span>
          </div>
        </div>

        <div className="wrap" style={{paddingTop:40,paddingBottom:80}}>

          {/* NEXT MATCH HERO */}
          <div className="glass-card" style={{padding:'32px',marginBottom:40,borderLeft:'3px solid #FF7A29',animation:'fadeSlide 0.6s ease both'}}>
            <div style={{marginBottom:20}}>
              <span className="tag-pill">🔥 NEXT MATCH</span>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20,marginBottom:28}}>
              <div style={{textAlign:'center',flex:1,minWidth:120}}>
                <div style={{fontSize:36,marginBottom:6}}>🌊</div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:22,color:'#fff',marginBottom:4}}>Mumbai Mavericks</div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontFamily:'Inter,sans-serif'}}>Mumbai</div>
              </div>
              <div style={{textAlign:'center',padding:'0 16px'}}>
                <div className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:44,lineHeight:1}}>VS</div>
              </div>
              <div style={{textAlign:'center',flex:1,minWidth:120}}>
                <div style={{fontSize:36,marginBottom:6}}>🗼</div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:22,color:'#fff',marginBottom:4}}>Delhi Dynamos</div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontFamily:'Inter,sans-serif'}}>Delhi</div>
              </div>
            </div>
            <div style={{textAlign:'center',marginBottom:8}}>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:15,color:'rgba(255,255,255,0.85)',letterSpacing:'0.04em'}}>SAT, 26 JULY 2025 · 6:00 PM IST</div>
            </div>
            <div style={{textAlign:'center',marginBottom:28}}>
              <span style={{fontSize:14,color:'rgba(255,255,255,0.5)',fontFamily:'Inter,sans-serif'}}>📍 DY Patil Stadium, Mumbai</span>
            </div>
            {/* Countdown */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,maxWidth:480,margin:'0 auto 28px'}}>
              {[['3','DAYS'],['14','HRS'],['22','MIN'],['45','SEC']].map(([n,l])=>(
                <div key={l} className="glass-card" style={{padding:'18px 8px',textAlign:'center',animation:'pulseGlow 3s ease-in-out infinite'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:32,color:'#FF7A29',lineHeight:1,marginBottom:6}}>{n}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.1em'}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
              <button className="btn-fire" style={{padding:'14px 36px',fontSize:15}}>Set Reminder →</button>
              <a href="#" style={{color:'rgba(255,255,255,0.4)',fontSize:13,fontFamily:'Inter,sans-serif',textDecoration:'underline'}}>Add to Calendar</a>
            </div>
          </div>

          {/* RECENT RESULTS */}
          <div style={{marginBottom:40}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#fff',letterSpacing:'0.04em'}}>RECENT RESULTS</h2>
              <div style={{flex:1,height:2,background:'linear-gradient(90deg,#FF7A29,transparent)'}}/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {results.map((r,i)=>(
                <div key={i} className={`glass-card mc-result-card`} style={{padding:'20px 24px',borderLeft:`3px solid ${r.won?'#22C55E':'#E8493F'}`,animation:`fadeSlide 0.4s ${i*0.08}s ease both`}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                      <span style={{background:'rgba(255,122,41,0.12)',border:'1px solid rgba(255,122,41,0.3)',borderRadius:6,padding:'3px 10px',fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#FF7A29',letterSpacing:'0.1em'}}>{r.badge}</span>
                      <span style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontFamily:'Inter,sans-serif'}}>{r.date} · {r.venue}</span>
                    </div>
                    <span style={{background:r.won?'rgba(34,197,94,0.15)':'rgba(232,73,63,0.15)',color:r.won?'#22C55E':'#E8493F',border:`1px solid ${r.won?'rgba(34,197,94,0.35)':'rgba(232,73,63,0.35)'}`,borderRadius:8,padding:'3px 12px',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700}}>{r.won?'WON':'LOST'}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:16,marginTop:14,flexWrap:'wrap'}}>
                    <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#fff'}}>{r.teamA}</span>
                    <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20,color:'#FF7A29'}}>{r.scoreA}</span>
                    <span style={{color:'rgba(255,255,255,0.3)',fontSize:14,fontFamily:'Inter,sans-serif'}}>vs</span>
                    <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20,color:'rgba(255,255,255,0.55)'}}>{r.scoreB}</span>
                    <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'rgba(255,255,255,0.55)'}}>{r.teamB}</span>
                  </div>
                  <div style={{marginTop:10}}>
                    <span style={{background:'rgba(232,178,61,0.1)',border:'1px solid rgba(232,178,61,0.25)',borderRadius:100,padding:'4px 12px',fontSize:12,color:'#E8B23D',fontFamily:'Inter,sans-serif'}}>⭐ MOM: {r.mom}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LATEST SCORECARD */}
          <div className="glass-card" style={{marginBottom:40,overflow:'hidden'}}>
            <button onClick={()=>setScorecardOpen(o=>!o)} style={{width:'100%',background:'none',border:'none',cursor:'pointer',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span className="tag-pill">📋 LATEST SCORECARD</span>
                <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:15,color:'#fff'}}>DEL vs BLR</span>
              </div>
              <span style={{color:'#FF7A29',fontSize:18,fontFamily:'Montserrat,sans-serif',transition:'transform 0.3s',transform:scorecardOpen?'rotate(180deg)':''}}>▼</span>
            </button>
            {scorecardOpen && (
              <div style={{padding:'0 24px 24px',animation:'fadeSlide 0.3s ease both'}}>
                <div style={{overflowX:'auto',borderRadius:12,marginBottom:16}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:560}}>
                    <thead>
                      <tr style={{background:'rgba(255,122,41,0.08)'}}>
                        {['Batter','How Out','R','B','4s','6s','SR'].map(h=>(
                          <th key={h} style={{padding:'10px 14px',textAlign:'left',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['A. Kumar (c)','b. S. Reddy','87','54','8','4','161.1'],
                        ['R. Sharma','lbw b. P. Nair','43','31','5','1','138.7'],
                        ['V. Singh','run out','28','22','3','0','127.3'],
                        ['Extras','','15','','','',''],
                        ['TOTAL','','187/4','20 ov','','',''],
                      ].map((row,i)=>(
                        <tr key={i} className="sc-row" style={{borderBottom:'1px solid rgba(255,255,255,0.05)',background:i===4?'rgba(255,122,41,0.06)':''}}>
                          {row.map((cell,j)=>(
                            <td key={j} style={{padding:'12px 14px',fontSize:13,fontFamily: j===0||i===4?'Montserrat,sans-serif':'Inter,sans-serif',fontWeight: j===0||i===4?700:400,color: i===4?'#FF7A29':j===2?'#fff':'rgba(255,255,255,0.7)'}}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'14px 16px',marginBottom:12}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.08em',marginBottom:8,textTransform:'uppercase'}}>Bowling</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
                    {['S. Reddy 4-0-38-2','P. Nair 4-0-42-1','R. Kumar 4-0-35-0','A. Patel 4-0-28-1'].map(b=>(
                      <span key={b} style={{fontSize:13,color:'rgba(255,255,255,0.7)',fontFamily:'Inter,sans-serif',background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'5px 12px'}}>{b}</span>
                    ))}
                  </div>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
                  <span style={{fontSize:12,color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif'}}>Fall of wickets:</span>
                  {['1-45(2.4)','2-78(8.1)','3-95(11.2)','4-162(17.5)'].map(f=>(
                    <span key={f} style={{fontSize:12,color:'rgba(255,122,41,0.7)',fontFamily:'Inter,sans-serif'}}>{f}</span>
                  ))}
                </div>
                <div style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:10,padding:'12px 16px',textAlign:'center'}}>
                  <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#22C55E'}}>🏆 DEL won by 22 runs</span>
                </div>
              </div>
            )}
          </div>

          {/* MINI STANDINGS */}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#fff',letterSpacing:'0.04em'}}>TOP STANDINGS</h2>
              <div style={{flex:1,height:2,background:'linear-gradient(90deg,#FF7A29,transparent)'}}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
              {miniStandings.map((s,i)=>(
                <div key={i} className="glass-card" style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:14,borderLeft:`3px solid ${i<2?'#E8B23D':'rgba(255,255,255,0.1)'}`}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background: i===0?'linear-gradient(135deg,#E8B23D,#FFD700)':i===1?'linear-gradient(135deg,#aaa,#ccc)':'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:14,color: i<2?'#060E1C':'rgba(255,255,255,0.5)',flexShrink:0}}>#{s.rank}</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#fff',marginBottom:2}}>{s.team}</div>
                    <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',fontFamily:'Inter,sans-serif'}}>{s.pts} pts · NRR {s.nrr}</div>
                  </div>
                </div>
              ))}
            </div>
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
