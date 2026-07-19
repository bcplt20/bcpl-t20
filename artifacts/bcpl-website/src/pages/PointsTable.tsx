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
.pt-row{transition:background 0.15s;}
.pt-row:hover{background:rgba(255,122,41,0.04)!important;}
.perf-card{transition:transform 0.2s,box-shadow 0.2s;}
.perf-card:hover{transform:translateY(-4px);box-shadow:0 32px 80px rgba(0,0,0,0.6)!important;}
@keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
@keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.2}}
@keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
@keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes countUp{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
        /* float-reg-btn */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
`;

const particles = [
  {left:'5%',top:'18%',color:'#FF7A29',delay:'0s',dur:'6s'},
  {left:'20%',top:'68%',color:'#E8B23D',delay:'1.4s',dur:'8s'},
  {left:'42%',top:'28%',color:'#fff',delay:'2.3s',dur:'7s'},
  {left:'62%',top:'78%',color:'#FF7A29',delay:'0.8s',dur:'9s'},
  {left:'76%',top:'10%',color:'#E8B23D',delay:'3.5s',dur:'6.5s'},
  {left:'86%',top:'52%',color:'#fff',delay:'1.9s',dur:'7.5s'},
  {left:'31%',top:'58%',color:'#FF7A29',delay:'4.4s',dur:'8s'},
  {left:'93%',top:'33%',color:'#E8B23D',delay:'2.6s',dur:'6s'},
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
              <a key={l} href={h} style={{color:'rgba(255,255,255,0.72)',fontSize:13,fontWeight:600,fontFamily:'Inter,sans-serif',textDecoration:'none',borderBottom:'2px solid transparent',paddingBottom:2}}>{l}</a>
            ))}
            <button className="btn-fire" style={{padding:'10px 22px',fontSize:13,borderRadius:12}}>Register ₹299</button>
          </div>
          <button className="ham-btn" onClick={()=>setOpen(o=>!o)} style={{flexDirection:'column',gap:5,background:'none',border:'none',cursor:'pointer',padding:8,zIndex:201}}>
            <span style={{display:'block',width:24,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(45deg) translate(5px,5px)':''}}/>
            <span style={{display:'block',width:24,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'scaleX(0)':''}}/>
            <span style={{display:'block',width:24,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(-45deg) translate(5px,-5px)':''}}/>
          </button>
        </div>
      </nav>
      {open && (
        <div style={{position:'fixed',inset:0,background:'#06101E',zIndex:300,display:'flex',flexDirection:'column',padding:'80px 28px 40px',overflowY:'auto'}}>
          <button onClick={()=>{ setOpen(false); window.location.assign(ROUTE_MAP[l]||'/'); }} style={{position:'absolute',top:18,right:18,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:28,cursor:'pointer',lineHeight:1}}>✕</button>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:32}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff'}}>T20</span></div>
          {[['🏠 Home','#'],['🔴 Match Center','#'],['🏏 Teams','#'],['🤝 Sponsors','#'],['📷 Photos','#'],['▶️ Videos','#'],['ℹ️ About','#'],['❓ FAQ','#'],['✉️ Contact','#']].map(([l,h])=>(
            <a key={l} href={h} onClick={()=>{ setOpen(false); window.location.assign(ROUTE_MAP[l]||'/'); }} style={{color:'rgba(255,255,255,0.85)',fontWeight:700,fontSize:18,textDecoration:'none',fontFamily:'Montserrat,sans-serif',padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{l}</a>
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
        <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:24,display:'flex',flexWrap:'wrap',gap:12,justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'rgba(255,255,255,0.25)',fontSize:11,fontFamily:'Inter,sans-serif'}}>© 2025 Kriparti Playing11 Pvt. Ltd. · <a href="https://www.bcpl-t20.com" style={{color:'rgba(255,122,41,0.5)',textDecoration:'none'}}>www.bcpl-t20.com</a></div>
          <div style={{color:'rgba(255,255,255,0.2)',fontSize:11,fontFamily:'Inter,sans-serif'}}>Relive the dream. Rediscover the thrill.</div>
        </div>
      </div>
    </footer>
  );
}

interface TeamRow {
  pos: number;
  emoji: string;
  name: string;
  abbr: string;
  p: number;
  w: number;
  l: number;
  t: number;
  nrr: string;
  pts: number;
  form: ('W'|'L')[];
  qualified?: boolean;
  eliminated?: boolean;
}

const GROUP_A: TeamRow[] = [
  {pos:1,emoji:'🌊',name:'Mumbai Mavericks',abbr:'MUM',p:8,w:6,l:2,t:0,nrr:'+1.24',pts:12,form:['W','W','L','W','W'],qualified:true},
  {pos:2,emoji:'🗼',name:'Delhi Dynamos',abbr:'DEL',p:8,w:5,l:3,t:0,nrr:'+0.87',pts:10,form:['W','W','L','W','L'],qualified:true},
  {pos:3,emoji:'🐆',name:'Pune Panthers',abbr:'PUN',p:8,w:5,l:3,t:0,nrr:'+0.43',pts:10,form:['L','W','W','W','L']},
  {pos:4,emoji:'🦁',name:'Ahmedabad Lions',abbr:'AHM',p:8,w:4,l:4,t:0,nrr:'-0.12',pts:8,form:['W','L','L','W','L']},
  {pos:5,emoji:'♟️',name:'Kolkata Knights',abbr:'KOL',p:8,w:3,l:5,t:0,nrr:'-0.65',pts:6,form:['L','L','L','W','W']},
];

const GROUP_B: TeamRow[] = [
  {pos:1,emoji:'🐂',name:'Bangalore Bulls',abbr:'BLR',p:8,w:7,l:1,t:0,nrr:'+1.56',pts:14,form:['W','W','W','W','L'],qualified:true},
  {pos:2,emoji:'🦅',name:'Hyderabad Hawks',abbr:'HYD',p:8,w:5,l:3,t:0,nrr:'+0.92',pts:10,form:['W','W','L','W','L'],qualified:true},
  {pos:3,emoji:'👑',name:'Lucknow Nawabs',abbr:'LKN',p:8,w:4,l:4,t:0,nrr:'+0.11',pts:8,form:['W','L','W','L','W']},
  {pos:4,emoji:'🌶️',name:'Chennai Chiefs',abbr:'CHN',p:8,w:3,l:5,t:0,nrr:'-0.34',pts:6,form:['L','W','L','L','W']},
  {pos:5,emoji:'🐅',name:'Jaipur Jaguars',abbr:'JAI',p:8,w:2,l:6,t:0,nrr:'-0.88',pts:4,form:['L','L','W','L','L'],eliminated:true},
];

function FormDots({form}: {form: ('W'|'L')[]}) {
  return (
    <div style={{display:'flex',gap:4,alignItems:'center'}}>
      {form.map((f,i)=>(
        <div key={i} style={{width:10,height:10,borderRadius:'50%',background: f==='W'?'#22C55E':'#E8493F',boxShadow: f==='W'?'0 0 6px rgba(34,197,94,0.4)':'0 0 6px rgba(232,73,63,0.4)'}} title={f==='W'?'Win':'Loss'}/>
      ))}
    </div>
  );
}

function StandingsTable({rows, groupLabel}: {rows: TeamRow[], groupLabel: string}) {
  const cols = ['Pos','Team','P','W','L','T','NRR','Pts','Form'];
  return (
    <div className="glass-card" style={{marginBottom:32,overflow:'hidden',animation:'fadeSlide 0.5s ease both'}}>
      <div style={{padding:'20px 24px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span className="tag-pill">GROUP {groupLabel}</span>
          <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#fff'}}>Group {groupLabel} Standings</span>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <span style={{background:'rgba(232,178,61,0.1)',border:'1px solid rgba(232,178,61,0.25)',borderRadius:100,padding:'3px 12px',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#E8B23D'}}>🏆 Qualified</span>
          <span style={{background:'rgba(232,73,63,0.1)',border:'1px solid rgba(232,73,63,0.25)',borderRadius:100,padding:'3px 12px',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#E8493F'}}>❌ Eliminated</span>
        </div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:640}}>
          <thead>
            <tr style={{background:'rgba(255,122,41,0.06)'}}>
              {cols.map(c=>(
                <th key={c} style={{padding:'12px 14px',textAlign: c==='Team'?'left':'center',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:10,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.1em',whiteSpace:'nowrap'}}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i)=>(
              <tr
                key={i}
                className="pt-row"
                style={{
                  borderBottom:'1px solid rgba(255,255,255,0.05)',
                  borderLeft: row.qualified ? '3px solid rgba(232,178,61,0.5)' : row.eliminated ? '3px solid rgba(232,73,63,0.4)' : '3px solid transparent',
                  opacity: row.eliminated ? 0.55 : 1,
                  background: row.qualified ? 'rgba(232,178,61,0.03)' : 'transparent',
                }}
              >
                <td style={{padding:'14px',textAlign:'center'}}>
                  <div style={{
                    width:30,height:30,borderRadius:'50%',
                    background: row.pos===1?'linear-gradient(135deg,#E8B23D,#FFD700)':row.pos===2?'linear-gradient(135deg,#9CA3AF,#D1D5DB)':row.pos===3?'linear-gradient(135deg,#B45309,#D97706)':'rgba(255,255,255,0.06)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:12,
                    color: row.pos<=3?'#060E1C':'rgba(255,255,255,0.4)',
                    margin:'0 auto'
                  }}>{row.pos}</div>
                </td>
                <td style={{padding:'14px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:18}}>{row.emoji}</span>
                    <div>
                      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:14,color:'#fff',whiteSpace:'nowrap'}}>{row.name}</div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif'}}>{row.abbr}</div>
                    </div>
                    {row.qualified && <span style={{fontSize:10,color:'#E8B23D',fontFamily:'Montserrat,sans-serif',fontWeight:700}}>QUALIFIED</span>}
                    {row.eliminated && <span style={{fontSize:10,color:'#E8493F',fontFamily:'Montserrat,sans-serif',fontWeight:700}}>ELIMINATED</span>}
                  </div>
                </td>
                {[row.p,row.w,row.l,row.t].map((v,j)=>(
                  <td key={j} style={{padding:'14px',textAlign:'center',fontFamily:'Inter,sans-serif',fontSize:13,color: j===1?'#22C55E':j===2?'#E8493F':'rgba(255,255,255,0.6)'}}>{v}</td>
                ))}
                <td style={{padding:'14px',textAlign:'center',fontFamily:'Montserrat,sans-serif',fontSize:13,fontWeight:700,color: row.nrr.startsWith('+')?'#22C55E':'#E8493F'}}>{row.nrr}</td>
                <td style={{padding:'14px',textAlign:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:16,color:'#FF7A29'}}>{row.pts}</td>
                <td style={{padding:'14px',textAlign:'center'}}>
                  <FormDots form={row.form}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

export function PointsTable() {
  return (
    <div style={{background:'#060E1C',color:'#fff',minHeight:'100vh',overflowX:'hidden',fontFamily:'Inter,sans-serif'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <div style={{position:'relative',zIndex:10}}>
        <AnnouncementBar/>
        <Navbar/>

        {/* HERO */}
        <div style={{padding:'60px 0 48px',textAlign:'center'}}>
          <div className="wrap">
            <div style={{marginBottom:16,display:'flex',justifyContent:'center',alignItems:'center',gap:8}}>
              <span className="tag-pill">📊 LIVE STANDINGS</span>
              <span style={{width:8,height:8,borderRadius:'50%',background:'#E8493F',animation:'liveBlip 1s ease-in-out infinite',display:'inline-block'}}/>
            </div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,6vw,68px)',lineHeight:1.05,marginBottom:10,color:'#fff'}}>
              WHO'S LEADING
            </h1>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,6vw,68px)',lineHeight:1.05,marginBottom:24}}>
              <span className="shimmer-gold">THE PACK?</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:15,fontFamily:'Inter,sans-serif',maxWidth:480,margin:'0 auto'}}>Live group standings · Season 5 · Top 2 from each group advance to playoffs</p>
          </div>
        </div>

        <div className="wrap" style={{paddingBottom:100}}>

          {/* LEGEND */}
          <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:28}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(232,178,61,0.08)',border:'1px solid rgba(232,178,61,0.25)',borderRadius:100,padding:'6px 16px',fontSize:12,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#E8B23D'}}>🏆 Qualified for Playoffs</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(232,73,63,0.08)',border:'1px solid rgba(232,73,63,0.25)',borderRadius:100,padding:'6px 16px',fontSize:12,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#E8493F'}}>❌ Eliminated</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:100,padding:'6px 16px',fontSize:12,fontFamily:'Inter,sans-serif',fontWeight:600,color:'rgba(255,255,255,0.5)'}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'#22C55E',display:'inline-block'}}/>W = Win
              <span style={{marginLeft:8,width:8,height:8,borderRadius:'50%',background:'#E8493F',display:'inline-block'}}/>L = Loss
            </span>
          </div>

          {/* GROUP A */}
          <StandingsTable rows={GROUP_A} groupLabel="A"/>

          {/* GROUP B */}
          <StandingsTable rows={GROUP_B} groupLabel="B"/>

          {/* TOP PERFORMERS */}
          <div style={{marginBottom:40}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#fff',letterSpacing:'0.04em'}}>TOP PERFORMERS</h2>
              <div style={{flex:1,height:2,background:'linear-gradient(90deg,#FF7A29,transparent)'}}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
              {[
                {icon:'🏏',title:'Top Scorer',name:'A. Kumar',team:'DEL',stat:'387 runs',sub:'Avg 54.8 · SR 142.3',accent:'#3B82F6'},
                {icon:'🎳',title:'Top Wicket-Taker',name:'S. Reddy',team:'HYD',stat:'18 wickets',sub:'Avg 14.2 · Econ 7.1',accent:'#6366F1'},
                {icon:'⭐',title:'Best All-Rounder',name:'R. Singh',team:'AHM',stat:'245 runs + 12 wkts',sub:'Impact player of the season',accent:'#EF4444'},
              ].map((p,i)=>(
                <div key={i} className="glass-card perf-card" style={{padding:'24px',borderTop:`3px solid ${p.accent}`,animation:`fadeSlide 0.4s ${i*0.1}s ease both`}}>
                  <div style={{fontSize:28,marginBottom:12}}>{p.icon}</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:8}}>{p.title}</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20,color:'#fff',marginBottom:4}}>{p.name}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',fontFamily:'Inter,sans-serif',marginBottom:14}}>{p.team}</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,color:p.accent,marginBottom:6}}>{p.stat}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif'}}>{p.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PLAYOFF BRACKET */}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#fff',letterSpacing:'0.04em'}}>PLAYOFF BRACKET</h2>
              <div style={{flex:1,height:2,background:'linear-gradient(90deg,#FF7A29,transparent)'}}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16,alignItems:'start'}}>
              {/* SF1 */}
              <div className="glass-card" style={{padding:'22px',borderLeft:'3px solid rgba(59,130,246,0.6)'}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:10,color:'rgba(59,130,246,0.8)',letterSpacing:'0.12em',marginBottom:14,textTransform:'uppercase'}}>SEMIFINAL 1 · AUG 10</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(34,197,94,0.06)',borderRadius:10,border:'1px solid rgba(34,197,94,0.15)'}}>
                    <span>🌊</span>
                    <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#fff'}}>MUM</span>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif'}}>Group A Topper</span>
                  </div>
                  <div style={{textAlign:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'rgba(255,255,255,0.3)'}}>VS</div>
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(255,255,255,0.07)'}}>
                    <span>🦅</span>
                    <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#fff'}}>HYD</span>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif'}}>Group B Runner-up</span>
                  </div>
                </div>
              </div>
              {/* SF2 */}
              <div className="glass-card" style={{padding:'22px',borderLeft:'3px solid rgba(99,102,241,0.6)'}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:10,color:'rgba(99,102,241,0.8)',letterSpacing:'0.12em',marginBottom:14,textTransform:'uppercase'}}>SEMIFINAL 2 · AUG 11</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(34,197,94,0.06)',borderRadius:10,border:'1px solid rgba(34,197,94,0.15)'}}>
                    <span>🗼</span>
                    <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#fff'}}>DEL</span>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif'}}>Group A Runner-up</span>
                  </div>
                  <div style={{textAlign:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'rgba(255,255,255,0.3)'}}>VS</div>
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(255,255,255,0.07)'}}>
                    <span>🐂</span>
                    <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#fff'}}>BLR</span>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif'}}>Group B Topper</span>
                  </div>
                </div>
              </div>
              {/* FINAL */}
              <div style={{background:'linear-gradient(135deg,rgba(232,178,61,0.12),rgba(15,34,71,0.9))',backdropFilter:'blur(32px)',border:'1px solid rgba(232,178,61,0.4)',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,0.5),0 0 60px rgba(232,178,61,0.1)',padding:'22px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                  <span style={{fontSize:18}}>🏆</span>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:10,color:'#E8B23D',letterSpacing:'0.15em',textTransform:'uppercase'}}>GRAND FINAL · AUG 17</div>
                </div>
                <div style={{textAlign:'center',padding:'20px 0'}}>
                  <div className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:28,marginBottom:8}}>TBD vs TBD</div>
                  <div style={{color:'rgba(255,255,255,0.3)',fontSize:13,fontFamily:'Inter,sans-serif'}}>Winner SF1 · Winner SF2</div>
                </div>
                <div style={{background:'rgba(232,178,61,0.06)',borderRadius:10,padding:'10px',textAlign:'center'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11,color:'rgba(232,178,61,0.6)',letterSpacing:'0.1em'}}>📍 VENUE · TBD</div>
                </div>
              </div>
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
