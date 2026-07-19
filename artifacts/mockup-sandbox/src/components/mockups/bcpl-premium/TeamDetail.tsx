import React from 'react';

function Navbar() {
  const [open, setOpen] = React.useState(false);
  const links = [['Home','home'],['Match Center','matchcenter'],['Teams','teams'],['Sponsors','sponsors'],['Photos','photos'],['Videos','videos'],['About','about'],['FAQ','faq'],['Contact','contact']];
  return (
    <>
      <div style={{background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)',backgroundSize:'300% 100%',animation:'gradShift 4s ease infinite',color:'#fff',padding:'11px 20px',textAlign:'center',fontSize:12,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.04em',zIndex:10,position:'relative'}}>
        <span>🏏 BCPL T20 Season 5 — Trials Open in 75 Cities</span>
        <span style={{margin:'0 12px',opacity:0.5}}>|</span>
        <span>Register for ₹299 Only</span>
        <span style={{margin:'0 12px',opacity:0.5}}>|</span>
        <span>#OfficeSeStadiumtak</span>
      </div>
      <nav style={{position:'sticky',top:0,zIndex:200,background:'rgba(6,14,28,0.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.07)',boxShadow:'0 1px 0 0 rgba(255,122,41,0.25)'}}>
        <div className="wrap" style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,display:'flex',alignItems:'center'}}>
            <span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:3}}>T20</span>
            <span style={{fontSize:10,color:'rgba(255,122,41,0.7)',marginLeft:8,fontWeight:700,letterSpacing:'0.08em'}}>SEASON 5</span>
          </div>
          <div className="desk-nav">
            {links.map(([l,k])=><a key={k} href="#" style={{color:k==='teams'?'#FF7A29':'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13,textDecoration:'none',fontFamily:'Inter,sans-serif',borderBottom:k==='teams'?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2}}>{l}</a>)}
            <button className="btn-fire" style={{padding:'9px 20px',fontSize:13}}>Register ₹299</button>
          </div>
          <button className="ham-btn" onClick={()=>setOpen(o=>!o)} style={{flexDirection:'column',gap:5,background:'none',border:'none',cursor:'pointer',padding:8}}>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(45deg) translate(5px,5px)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'scaleX(0)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(-45deg) translate(5px,-5px)':''}}/>
          </button>
        </div>
      </nav>
      {open&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#06101E',zIndex:300,display:'flex',flexDirection:'column',padding:'80px 24px 40px',overflowY:'auto'}}>
          <button onClick={()=>setOpen(false)} style={{position:'absolute',top:20,right:20,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:28,cursor:'pointer'}}>✕</button>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:32}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:3}}>T20</span></div>
          {[['🏠 Home','home'],['🔴 Match Center','mc'],['🏏 Teams','teams'],['🤝 Sponsors','sp'],['📷 Photos','ph'],['▶️ Videos','vid'],['ℹ️ About','about'],['❓ FAQ','faq'],['✉️ Contact','contact']].map(([l,k])=>(
            <a key={k} href="#" onClick={()=>setOpen(false)} style={{color:'rgba(255,255,255,0.85)',fontWeight:700,fontSize:18,textDecoration:'none',fontFamily:'Montserrat,sans-serif',padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{l}</a>
          ))}
          <button className="btn-fire" style={{marginTop:32,height:52,fontSize:16,borderRadius:14,width:'100%'}}>📝 Register for ₹299 →</button>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer style={{background:'#040C18',borderTop:'1px solid rgba(255,255,255,0.05)',padding:'48px 0 32px'}}>
      <div className="wrap">
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:32,marginBottom:32}}>
          <div>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:12}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:4}}>T20</span></div>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:13,lineHeight:1.7,maxWidth:300,fontFamily:'Inter,sans-serif',marginBottom:8}}>Relive the dream. Rediscover the thrill. World's largest corporate cricket league for working professionals.</p>
            <p style={{color:'rgba(255,122,41,0.7)',fontSize:12,fontWeight:700,fontFamily:'Inter,sans-serif'}}>#OfficeSeStadiumtak</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12,fontFamily:'Montserrat,sans-serif'}}>League</div>
              {['Schedule','Match Center','Teams','Points Table','Photos','Videos'].map(l=><div key={l} style={{marginBottom:8}}><a href="#" style={{color:'rgba(255,255,255,0.55)',fontSize:13,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>{l}</a></div>)}
            </div>
            <div>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12,fontFamily:'Montserrat,sans-serif'}}>Info</div>
              {['About','FAQ','Contact','Terms','Privacy','Refunds','Eligibility'].map(l=><div key={l} style={{marginBottom:8}}><a href="#" style={{color:'rgba(255,255,255,0.55)',fontSize:13,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>{l}</a></div>)}
            </div>
          </div>
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:20,display:'flex',flexWrap:'wrap',gap:12,justifyContent:'space-between',alignItems:'center'}}>
          <p style={{color:'rgba(255,255,255,0.28)',fontSize:11,fontFamily:'Inter,sans-serif'}}>© 2025 Kriparti Playing11 Pvt. Ltd. | www.bcpl-t20.com</p>
          <div style={{display:'flex',gap:8}}>
            {['📸','▶️','🐦','📘'].map((ic,i)=><a key={i} href="#" style={{width:34,height:34,borderRadius:8,background:'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,textDecoration:'none',border:'1px solid rgba(255,255,255,0.07)'}}>{ic}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}

const ACCENT = '#3B82F6';

const PLAYERS = [
  {num:7,name:'Aditya Kumar',role:'BAT',status:'PLAYING XI',captain:true},
  {num:18,name:'Rohit Sharma',role:'BAT',status:'PLAYING XI',captain:false},
  {num:3,name:'Vikas Singh',role:'BWL',status:'PLAYING XI',captain:false},
  {num:11,name:'Pradeep Nair',role:'BWL',status:'PLAYING XI',captain:false},
  {num:6,name:'Sanjay Mehta',role:'AR',status:'PLAYING XI',captain:false},
  {num:22,name:'Anand Reddy',role:'BAT',status:'PLAYING XI',captain:false},
  {num:1,name:'Deepak Joshi',role:'WK',status:'PLAYING XI',captain:false},
  {num:14,name:'Rahul Gupta',role:'BAT',status:'PLAYING XI',captain:false},
  {num:9,name:'Suresh Pandey',role:'BWL',status:'PLAYING XI',captain:false},
  {num:5,name:'Arjun Verma',role:'AR',status:'PLAYING XI',captain:false},
  {num:17,name:'Nikhil Bose',role:'BWL',status:'PLAYING XI',captain:false},
  {num:24,name:'Kiran Rao',role:'WK',status:'RESERVE',captain:false},
];

const ROLE_COLORS: Record<string,string> = {BAT:'#3B82F6',BWL:'#EF4444',WK:'#F59E0B',AR:'#10B981'};

const RESULTS = [
  {date:'12 Jan',venue:'Kotla, Delhi',round:'Group Stage',teamA:'DEL',scoreA:'164/6',teamB:'MUM',scoreB:'158/8',won:true,mom:'Aditya Kumar'},
  {date:'18 Jan',venue:'Wankhede, Mumbai',round:'Group Stage',teamA:'DEL',scoreA:'142/9',teamB:'PUN',scoreB:'145/7',won:false,mom:'Sanjay Mehta'},
  {date:'25 Jan',venue:'Kotla, Delhi',round:'Group Stage',teamA:'DEL',scoreA:'178/4',teamB:'KOL',scoreB:'155/7',won:true,mom:'Rohit Sharma'},
  {date:'2 Feb',venue:'JSCA, Ranchi',round:'Group Stage',teamA:'DEL',scoreA:'139/8',teamB:'AHM',scoreB:'141/6',won:false,mom:'Vikas Singh'},
  {date:'9 Feb',venue:'Kotla, Delhi',round:'Group Stage',teamA:'DEL',scoreA:'188/3',teamB:'BLR',scoreB:'175/6',won:true,mom:'Anand Reddy'},
  {date:'16 Feb',venue:'Chepauk, Chennai',round:'Quarter Final',teamA:'DEL',scoreA:'155/7',teamB:'CHN',scoreB:'148/8',won:true,mom:'Pradeep Nair'},
  {date:'23 Feb',venue:'Eden Gardens',round:'Semi Final',teamA:'DEL',scoreA:'201/4',teamB:'HYD',scoreB:'182/6',won:true,mom:'Aditya Kumar'},
  {date:'1 Mar',venue:'Kotla, Delhi',round:'Final',teamA:'DEL',scoreA:'167/8',teamB:'BLR',scoreB:'170/5',won:false,mom:'Deepak Joshi'},
];

const ABOUT_INFO = [
  {label:'Founded',value:'2020'},
  {label:'Home Ground',value:'Feroz Shah Kotla, Delhi'},
  {label:'Coach',value:'Mahesh Srinivasan'},
  {label:'Captain',value:'Aditya Kumar'},
  {label:'Home City',value:'New Delhi'},
  {label:'Franchise Owner',value:'Corporate Sports Ventures Ltd'},
];

export function TeamDetail() {
  const [tab, setTab] = React.useState(0);
  const tabs = ['Squad','Results','About'];

  return (
    <div style={{background:'#060E1C',color:'#fff',minHeight:'100vh',overflowX:'hidden',fontFamily:'Inter,sans-serif'}}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .wrap{max-width:1280px;margin:0 auto;padding:0 20px;}
        .desk-nav{display:none;align-items:center;gap:22px;}
        .ham-btn{display:flex;}
        .bot-cta{display:flex;}
        @media(min-width:768px){.wrap{padding:0 32px}}
        @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}.bot-cta{display:none!important;}.squad-grid{grid-template-columns:repeat(3,1fr)!important;}.about-grid{grid-template-columns:repeat(2,1fr)!important;}}
        @media(min-width:640px){.squad-grid{grid-template-columns:repeat(2,1fr)!important;}}
        .btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;}
        .btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
        .btn-fire:active{transform:scale(0.97);}
        .btn-wa{background:linear-gradient(135deg,#25D366,#1BA851);border:none;border-radius:14px;color:#fff;font-weight:700;cursor:pointer;font-family:Montserrat,sans-serif;transition:transform 0.15s;}
        .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
        .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
        @keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes borderGlow{0%,100%{border-color:rgba(59,130,246,0.3)}50%{border-color:rgba(59,130,246,0.8)}}
        @keyframes blueGlow{0%,100%{box-shadow:0 0 40px rgba(59,130,246,0.2)}50%{box-shadow:0 0 80px rgba(59,130,246,0.4),0 0 120px rgba(59,130,246,0.1)}}
      
        /* ── FLOATING REGISTER BUTTON ── */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:'Montserrat',sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* Ambient */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 30% 30%, rgba(59,130,246,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(255,122,41,0.07) 0%, transparent 60%)'}}/>
        <svg style={{position:'absolute',bottom:0,left:0,width:'100%',opacity:0.07}} viewBox="0 0 1280 320" preserveAspectRatio="xMidYMax meet">
          <path d="M0,280 Q320,160 640,200 Q960,240 1280,180 L1280,320 L0,320 Z" fill="#1E3A5F"/>
          <rect x="80" y="60" width="8" height="200" fill="#2D4F7A"/>
          <rect x="70" y="50" width="28" height="12" fill="#2D4F7A"/>
          <rect x="1190" y="60" width="8" height="200" fill="#2D4F7A"/>
          <rect x="1180" y="50" width="28" height="12" fill="#2D4F7A"/>
          <rect x="440" y="220" width="400" height="60" fill="rgba(255,255,255,0.03)" rx="4"/>
        </svg>
        {[{top:'15%',left:'10%',c:'#3B82F6',d:'0s'},{top:'60%',left:'5%',c:'#E8B23D',d:'1.2s'},{top:'30%',left:'90%',c:'#3B82F6',d:'2.4s'},{top:'75%',left:'85%',c:'#FF7A29',d:'0.6s'},{top:'50%',left:'50%',c:'#E8B23D',d:'1.8s'},{top:'10%',left:'70%',c:'#3B82F6',d:'3s'},{top:'85%',left:'30%',c:'#FF7A29',d:'0.3s'},{top:'40%',left:'20%',c:'#E8B23D',d:'2.1s'}].map((p,i)=>(
          <div key={i} style={{position:'absolute',top:p.top,left:p.left,width:3,height:3,borderRadius:'50%',background:p.c,animation:`floatParticle 4s ease-in-out ${p.d} infinite`}}/>
        ))}
        <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,rgba(255,255,255,0.01) 0px,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <Navbar/>

        {/* HERO */}
        <section style={{padding:'72px 0 56px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:600,borderRadius:'50%',background:`radial-gradient(circle,${ACCENT}18,transparent 70%)`,animation:'blueGlow 4s ease-in-out infinite',pointerEvents:'none'}}/>
          <div className="wrap" style={{textAlign:'center',position:'relative',zIndex:2}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginBottom:16}}>
              <span style={{fontSize:52}}>🗼</span>
            </div>
            <div className="tag-pill" style={{marginBottom:16,borderColor:`${ACCENT}55`,color:ACCENT,background:`${ACCENT}18`}}>
              GROUP A · NEW DELHI
            </div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(36px,7vw,76px)',lineHeight:1.0,color:'#fff',marginBottom:24,textShadow:`0 0 60px ${ACCENT}66`}}>
              DELHI DYNAMOS
            </h1>
            <div style={{display:'flex',flexWrap:'wrap',gap:12,justifyContent:'center',marginBottom:0}}>
              {[{label:'Players',val:'12'},{label:'Record',val:'6W / 2L'},{label:'NRR',val:'+0.842'},{label:'Rank',val:'#3'}].map(s=>(
                <div key={s.label} style={{background:'rgba(59,130,246,0.10)',border:`1px solid ${ACCENT}33`,borderRadius:14,padding:'14px 24px',textAlign:'center',minWidth:90}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:ACCENT}}>{s.val}</div>
                  <div style={{color:'rgba(255,255,255,0.45)',fontSize:11,fontFamily:'Inter,sans-serif',marginTop:2,textTransform:'uppercase',letterSpacing:'0.06em'}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TAB BAR */}
        <div style={{position:'sticky',top:64,zIndex:100,background:'rgba(6,14,28,0.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom:40}}>
          <div className="wrap">
            <div style={{display:'flex',gap:0}}>
              {tabs.map((t,i)=>(
                <button key={t} onClick={()=>setTab(i)} style={{flex:1,maxWidth:180,padding:'16px 0',background:'none',border:'none',color:tab===i?ACCENT:'rgba(255,255,255,0.45)',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,cursor:'pointer',letterSpacing:'0.06em',position:'relative',transition:'color 0.2s'}}>
                  {t}
                  {tab===i&&<div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:ACCENT,borderRadius:'2px 2px 0 0'}}/>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="wrap" style={{paddingBottom:100}}>

          {/* SQUAD TAB */}
          {tab===0&&(
            <div className="squad-grid" style={{display:'grid',gridTemplateColumns:'1fr',gap:16}}>
              {PLAYERS.map((p,i)=>(
                <div key={p.num} style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:`1px solid ${p.status==='RESERVE'?'rgba(255,122,41,0.2)':'rgba(59,130,246,0.18)'}`,borderRadius:16,padding:'18px 16px',display:'flex',alignItems:'center',gap:14,animation:`fadeSlide 0.4s ease ${i*0.05}s both`,transition:'border-color 0.2s',boxShadow:'0 8px 32px rgba(0,0,0,0.3)'}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${ACCENT}33,${ACCENT}11)`,border:`2px solid ${ACCENT}55`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:16,color:ACCENT,flexShrink:0}}>
                    {p.num}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                      <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#F8F4EE',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</span>
                      {p.captain&&<span style={{background:'rgba(232,178,61,0.2)',border:'1px solid rgba(232,178,61,0.5)',color:'#E8B23D',fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:100,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.06em',flexShrink:0}}>C</span>}
                    </div>
                    <div style={{display:'flex',gap:6,marginTop:6,alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{background:`${ROLE_COLORS[p.role]}22`,border:`1px solid ${ROLE_COLORS[p.role]}55`,color:ROLE_COLORS[p.role],fontSize:10,fontWeight:800,padding:'2px 8px',borderRadius:6,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.06em'}}>{p.role}</span>
                      <span style={{background:p.status==='PLAYING XI'?'rgba(34,197,94,0.12)':'rgba(255,122,41,0.12)',border:`1px solid ${p.status==='PLAYING XI'?'rgba(34,197,94,0.35)':'rgba(255,122,41,0.35)'}`,color:p.status==='PLAYING XI'?'#22C55E':'#FF7A29',fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:6,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.04em'}}>{p.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RESULTS TAB */}
          {tab===1&&(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {RESULTS.map((r,i)=>(
                <div key={i} style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:'18px 20px',borderLeft:`4px solid ${r.won?'#22C55E':'#E8493F'}`,animation:`fadeSlide 0.4s ease ${i*0.06}s both`,display:'flex',flexWrap:'wrap',gap:12,alignItems:'center'}}>
                  <div style={{minWidth:80}}>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:2}}>{r.date}</div>
                    <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'rgba(255,255,255,0.35)'}}>{r.venue}</div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontSize:10,color:'rgba(255,122,41,0.7)',fontWeight:700,marginTop:2}}>{r.round}</div>
                  </div>
                  <div style={{flex:1,display:'flex',alignItems:'center',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:15,color:ACCENT}}>{r.teamA}</div>
                      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:18,color:'#F8F4EE'}}>{r.scoreA}</div>
                    </div>
                    <div style={{padding:'6px 14px',borderRadius:8,background:r.won?'rgba(34,197,94,0.15)':'rgba(232,73,63,0.15)',border:`1px solid ${r.won?'rgba(34,197,94,0.4)':'rgba(232,73,63,0.4)'}`,fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:11,color:r.won?'#22C55E':'#E8493F',letterSpacing:'0.08em'}}>
                      {r.won?'WON':'LOST'}
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:15,color:'rgba(255,255,255,0.6)'}}>{r.teamB}</div>
                      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:18,color:'rgba(255,255,255,0.85)'}}>{r.scoreB}</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right',minWidth:80}}>
                    <div style={{fontFamily:'Inter,sans-serif',fontSize:10,color:'rgba(255,255,255,0.35)',marginBottom:3}}>Man of Match</div>
                    <div style={{background:'rgba(232,178,61,0.12)',border:'1px solid rgba(232,178,61,0.3)',color:'#E8B23D',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:8,fontFamily:'Montserrat,sans-serif'}}>{r.mom}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ABOUT TAB */}
          {tab===2&&(
            <div>
              <div className="about-grid" style={{display:'grid',gridTemplateColumns:'1fr',gap:14,marginBottom:28}}>
                {ABOUT_INFO.map((a,i)=>(
                  <div key={i} style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:`1px solid rgba(59,130,246,0.15)`,borderRadius:16,padding:'20px 22px',animation:`fadeSlide 0.4s ease ${i*0.07}s both`}}>
                    <div style={{color:'rgba(255,255,255,0.35)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:'Montserrat,sans-serif',marginBottom:8}}>{a.label}</div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#F8F4EE'}}>{a.value}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:'1px solid rgba(59,130,246,0.15)',borderRadius:16,padding:'24px 22px'}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#F8F4EE',marginBottom:12}}>Team Philosophy</div>
                <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,lineHeight:1.8,fontFamily:'Inter,sans-serif'}}>
                  Delhi Dynamos embodies the spirit of the capital — relentless, ambitious, and always hungry for victory. Built on a foundation of corporate professionals who live by the motto "play hard, work harder," the Dynamos represent the dreams of thousands of working cricketers across Delhi NCR. Season 5 sees a recharged squad under Aditya Kumar's leadership, aiming to go one step further after reaching the finals in Season 4.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM CTA */}
        <section style={{padding:'0 0 80px'}}>
          <div className="wrap">
            <div style={{background:`linear-gradient(135deg,${ACCENT}14,rgba(255,122,41,0.06),rgba(15,34,71,0.92))`,backdropFilter:'blur(32px)',border:`1px solid ${ACCENT}30`,borderRadius:24,padding:'48px 32px',textAlign:'center',animation:'borderGlow 3s ease-in-out infinite'}}>
              <div className="tag-pill" style={{marginBottom:16,borderColor:`${ACCENT}55`,color:ACCENT,background:`${ACCENT}18`}}>🗼 WANT TO WEAR THE BLUE?</div>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(20px,4vw,34px)',color:'#fff',marginBottom:12}}>
                WANT TO PLAY FOR DELHI DYNAMOS?
              </h2>
              <p style={{color:'rgba(255,255,255,0.55)',fontSize:15,lineHeight:1.7,maxWidth:460,margin:'0 auto 28px',fontFamily:'Inter,sans-serif'}}>
                Register today and get your shot at representing Delhi on the BCPL stage. All roles open — Bat, Bowl, WK, All-Rounder.
              </p>
              <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
                <button className="btn-fire" style={{padding:'16px 36px',fontSize:15,borderRadius:14}}>🏏 Register for ₹299 →</button>
                <button className="btn-wa" style={{padding:'16px 24px',fontSize:15,borderRadius:14}}>💬 WhatsApp Us</button>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Sticky CTA */}
        <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'10px 16px 18px',gap:10}}>
          <button className="btn-fire" style={{flex:2,height:52,fontSize:14,borderRadius:14}}>Register ₹299 →</button>
          <button className="btn-wa" style={{flex:1,height:52,fontSize:13,borderRadius:14}}>💬 WhatsApp</button>
        </div>

        <Footer/>
      </div>
      {/* ── FLOATING REGISTER BUTTON ── */}
      <a className="float-reg-btn float-reg-pulse" href="#" style={{textDecoration:"none"}}>🏏 REGISTER NOW →</a>
    </div>
  );
}
