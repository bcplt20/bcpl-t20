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
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',transform:open?'rotate(45deg) translate(5px,5px)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',transform:open?'scaleX(0)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',transform:open?'rotate(-45deg) translate(5px,-5px)':''}}/>
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

const TEAMS_A = [
  {name:'Delhi Dynamos',emoji:'🗼',abbr:'DEL',city:'New Delhi',color:'#3B82F6',form:['W','W','L','W','W'],pts:10,players:12,status:'Qualified'},
  {name:'Mumbai Mavericks',emoji:'🌊',abbr:'MUM',city:'Mumbai',color:'#06B6D4',form:['W','W','W','L','W'],pts:12,players:12,status:'Qualified'},
  {name:'Pune Panthers',emoji:'🐆',abbr:'PUN',city:'Pune',color:'#8B5CF6',form:['L','W','W','W','L'],pts:10,players:12,status:'Qualified'},
  {name:'Kolkata Knights',emoji:'♟️',abbr:'KOL',city:'Kolkata',color:'#F59E0B',form:['L','L','L','W','W'],pts:6,players:12,status:'Qualified'},
  {name:'Ahmedabad Lions',emoji:'🦁',abbr:'AHM',city:'Ahmedabad',color:'#EF4444',form:['W','L','L','W','L'],pts:6,players:12,status:'Qualified'},
];
const TEAMS_B = [
  {name:'Bangalore Bulls',emoji:'🐂',abbr:'BLR',city:'Bangalore',color:'#10B981',form:['W','W','W','W','L'],pts:14,players:12,status:'Qualified'},
  {name:'Hyderabad Hawks',emoji:'🦅',abbr:'HYD',city:'Hyderabad',color:'#6366F1',form:['W','W','L','W','L'],pts:10,players:12,status:'Qualified'},
  {name:'Lucknow Nawabs',emoji:'👑',abbr:'LKN',city:'Lucknow',color:'#A78BFA',form:['W','L','W','L','W'],pts:8,players:12,status:'Qualified'},
  {name:'Chennai Chiefs',emoji:'🌶️',abbr:'CHN',city:'Chennai',color:'#F97316',form:['L','W','L','L','W'],pts:6,players:12,status:'Qualified'},
  {name:'Jaipur Jaguars',emoji:'🐅',abbr:'JAI',city:'Jaipur',color:'#EC4899',form:['L','L','W','L','L'],pts:4,players:12,status:'Eliminated'},
];
const MINI_STANDINGS = [
  {abbr:'BLR',emoji:'🐂',pts:14,color:'#10B981'},
  {abbr:'MUM',emoji:'🌊',pts:12,color:'#06B6D4'},
  {abbr:'DEL',emoji:'🗼',pts:10,color:'#3B82F6'},
  {abbr:'PUN',emoji:'🐆',pts:10,color:'#8B5CF6'},
  {abbr:'HYD',emoji:'🦅',pts:10,color:'#6366F1'},
];

function TeamCard({t,i}:{t:typeof TEAMS_A[0],i:number}) {
  const [hov,setHov]=React.useState(false);
  const elim = t.status==='Eliminated';
  return (
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',
        backdropFilter:'blur(32px)',
        border:`1.5px solid ${hov?t.color:'rgba(255,255,255,0.09)'}`,
        borderRadius:20,
        padding:'24px 20px',
        transition:'all 0.3s',
        boxShadow:hov?`0 0 32px ${t.color}33,0 24px 64px rgba(0,0,0,0.5)`:'0 24px 64px rgba(0,0,0,0.4)',
        opacity:elim?0.55:1,
        animation:`fadeSlide 0.5s ease ${i*0.07}s both`,
        cursor:'pointer',
      }}
    >
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:`radial-gradient(circle,${t.color}33,transparent)`,border:`2px solid ${t.color}55`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,boxShadow:`0 0 20px ${t.color}44`,flexShrink:0}}>
          {t.emoji}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:17,color:'#F8F4EE',lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.name}</div>
          <div style={{color:'rgba(255,255,255,0.45)',fontSize:12,fontFamily:'Inter,sans-serif',marginTop:2}}>{t.city}</div>
        </div>
        {elim?(
          <span style={{background:'rgba(232,73,63,0.15)',border:'1px solid rgba(232,73,63,0.4)',color:'#E8493F',fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:100,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.08em',whiteSpace:'nowrap'}}>ELIMINATED</span>
        ):(
          <span style={{background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.35)',color:'#22C55E',fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:100,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.08em',whiteSpace:'nowrap'}}>SEASON 5 ACTIVE</span>
        )}
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <span style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontFamily:'Inter,sans-serif'}}>{t.players} Players · {t.status}</span>
        <span style={{color:t.color,fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13}}>{t.pts} pts</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:14}}>
        <span style={{color:'rgba(255,255,255,0.3)',fontSize:11,fontFamily:'Inter,sans-serif',marginRight:2}}>Form:</span>
        {t.form.map((r,j)=>(
          <div key={j} style={{width:22,height:22,borderRadius:'50%',background:r==='W'?'rgba(34,197,94,0.25)':'rgba(232,73,63,0.22)',border:`1.5px solid ${r==='W'?'#22C55E':'#E8493F'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:r==='W'?'#22C55E':'#E8493F',fontFamily:'Montserrat,sans-serif'}}>{r}</div>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,color:'#FF7A29',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:13,cursor:'pointer'}}>
        <span>View Squad</span>
        <span style={{transition:'transform 0.2s',transform:hov?'translateX(4px)':'translateX(0)'}}>→</span>
      </div>
    </div>
  );
}

export function Teams() {
  return (
    <div style={{background:'#060E1C',color:'#fff',minHeight:'100vh',overflowX:'hidden',fontFamily:'Inter,sans-serif'}}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .wrap{max-width:1280px;margin:0 auto;padding:0 20px;}
        .desk-nav{display:none;align-items:center;gap:22px;}
        .ham-btn{display:flex;}
        .bot-cta{display:flex;}
        @media(min-width:768px){.wrap{padding:0 32px}}
        @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}.bot-cta{display:none!important;}.teams-grid{grid-template-columns:repeat(3,1fr)!important;}}
        @media(min-width:640px){.teams-grid{grid-template-columns:repeat(2,1fr)!important;}}
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
        @keyframes borderGlow{0%,100%{border-color:rgba(255,122,41,0.3)}50%{border-color:rgba(255,122,41,0.8)}}
        @keyframes floatUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Ambient Background */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
        <svg style={{position:'absolute',bottom:0,left:0,width:'100%',opacity:0.07}} viewBox="0 0 1280 320" preserveAspectRatio="xMidYMax meet">
          <path d="M0,280 Q320,160 640,200 Q960,240 1280,180 L1280,320 L0,320 Z" fill="#1E3A5F"/>
          <rect x="80" y="60" width="8" height="200" fill="#2D4F7A"/>
          <rect x="70" y="50" width="28" height="12" fill="#2D4F7A"/>
          <rect x="1190" y="60" width="8" height="200" fill="#2D4F7A"/>
          <rect x="1180" y="50" width="28" height="12" fill="#2D4F7A"/>
          <rect x="440" y="220" width="400" height="60" fill="rgba(255,255,255,0.03)" rx="4"/>
        </svg>
        {[{top:'15%',left:'10%',c:'#FF7A29',d:'0s'},{top:'60%',left:'5%',c:'#E8B23D',d:'1.2s'},{top:'30%',left:'90%',c:'#fff',d:'2.4s'},{top:'75%',left:'85%',c:'#FF7A29',d:'0.6s'},{top:'50%',left:'50%',c:'#E8B23D',d:'1.8s'},{top:'10%',left:'70%',c:'#fff',d:'3s'},{top:'85%',left:'30%',c:'#FF7A29',d:'0.3s'},{top:'40%',left:'20%',c:'#E8B23D',d:'2.1s'}].map((p,i)=>(
          <div key={i} style={{position:'absolute',top:p.top,left:p.left,width:3,height:3,borderRadius:'50%',background:p.c,animation:`floatParticle 4s ease-in-out ${p.d} infinite`}}/>
        ))}
        <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <Navbar/>

        {/* HERO */}
        <section style={{padding:'80px 0 60px',textAlign:'center'}}>
          <div className="wrap">
            <div className="tag-pill" style={{marginBottom:20}}>🏏 THE FRANCHISES</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:12}}>
              <span style={{color:'#fff',display:'block'}}>TEN CITIES.</span>
              <span className="shimmer-gold" style={{display:'block'}}>ONE DREAM.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:17,lineHeight:1.7,maxWidth:520,margin:'0 auto',fontFamily:'Inter,sans-serif'}}>
              Get picked and represent your city on the BCPL stage.
            </p>
          </div>
        </section>

        {/* LIVE MINI STANDINGS */}
        <section style={{padding:'0 0 48px'}}>
          <div className="wrap">
            <div style={{overflowX:'auto',paddingBottom:8}}>
              <div style={{display:'inline-flex',gap:12,minWidth:'max-content'}}>
                <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.2)',borderRadius:12,padding:'10px 16px',display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'#22C55E',animation:'scanPulse 1s infinite'}}/>
                  <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:11,color:'#FF7A29',letterSpacing:'0.1em'}}>LIVE STANDINGS</span>
                </div>
                {MINI_STANDINGS.map((s,i)=>(
                  <div key={i} style={{background:'linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85))',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:12,padding:'10px 18px',display:'flex',alignItems:'center',gap:10}}>
                    <span style={{color:'rgba(255,255,255,0.3)',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:11}}>#{i+1}</span>
                    <span style={{fontSize:18}}>{s.emoji}</span>
                    <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13,color:'#fff'}}>{s.abbr}</span>
                    <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:12,color:s.color}}>{s.pts}pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* GROUP A */}
        <section style={{padding:'0 0 64px'}}>
          <div className="wrap">
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:32}}>
              <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(255,122,41,0.8),transparent)'}}/>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#FF7A29',letterSpacing:'0.15em'}}>GROUP A</div>
              <div style={{flex:1,height:1,background:'linear-gradient(270deg,rgba(255,122,41,0.8),transparent)'}}/>
            </div>
            <div className="teams-grid" style={{display:'grid',gridTemplateColumns:'1fr',gap:20}}>
              {TEAMS_A.map((t,i)=><TeamCard key={t.abbr} t={t} i={i}/>)}
            </div>
          </div>
        </section>

        {/* GROUP B */}
        <section style={{padding:'0 0 64px'}}>
          <div className="wrap">
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:32}}>
              <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(255,122,41,0.8),transparent)'}}/>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#FF7A29',letterSpacing:'0.15em'}}>GROUP B</div>
              <div style={{flex:1,height:1,background:'linear-gradient(270deg,rgba(255,122,41,0.8),transparent)'}}/>
            </div>
            <div className="teams-grid" style={{display:'grid',gridTemplateColumns:'1fr',gap:20}}>
              {TEAMS_B.map((t,i)=><TeamCard key={t.abbr} t={t} i={i}/>)}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section style={{padding:'0 0 80px'}}>
          <div className="wrap">
            <div style={{background:'linear-gradient(135deg,rgba(255,122,41,0.12),rgba(232,97,26,0.08),rgba(15,34,71,0.9))',backdropFilter:'blur(32px)',border:'1px solid rgba(255,122,41,0.25)',borderRadius:24,padding:'48px 32px',textAlign:'center',animation:'borderGlow 3s ease-in-out infinite'}}>
              <div className="tag-pill" style={{marginBottom:16}}>🎯 YOUR OPPORTUNITY AWAITS</div>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,4vw,36px)',color:'#fff',marginBottom:12}}>
                Want to play for one of these franchises?
              </h2>
              <p style={{color:'rgba(255,255,255,0.55)',fontSize:15,lineHeight:1.7,maxWidth:480,margin:'0 auto 28px',fontFamily:'Inter,sans-serif'}}>
                Register today and get your shot at representing your city in BCPL Season 5. 75 trial cities, all roles open.
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
    </div>
  );
}
