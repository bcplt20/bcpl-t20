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
            {links.map(([l,k])=><a key={k} href="#" style={{color:k==='sponsors'?'#FF7A29':'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13,textDecoration:'none',fontFamily:'Inter,sans-serif',borderBottom:k==='sponsors'?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2}}>{l}</a>)}
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

const TIER1 = [
  {name:'MegaStar Sports',cat:'Title Sponsor',desc:'Premium cricket equipment partner powering every boundary and wicket in BCPL Season 5.',gradA:'#FF7A29',gradB:'#E8B23D',icon:'🏏'},
  {name:'CorporateEdge',cat:'Co-Title Sponsor',desc:'Connecting corporate talent to the cricket field — HR & corporate services for Season 5.',gradA:'#3B82F6',gradB:'#8B5CF6',icon:'💼'},
];
const TIER2 = [
  {name:'PlayBold Energy',desc:'Official energy drink partner — fuel your game.',gradA:'#22C55E',gradB:'#16A34A',icon:'⚡'},
  {name:'FitPro Supplements',desc:'Nutrition science for peak athletic performance.',gradA:'#F59E0B',gradB:'#D97706',icon:'💪'},
  {name:'CrickGear Equipment',desc:'Professional cricket equipment for every role.',gradA:'#EF4444',gradB:'#DC2626',icon:'🦺'},
  {name:'ProStadium Apparel',desc:'Official kit supplier — look sharp, play sharper.',gradA:'#6366F1',gradB:'#4F46E5',icon:'👕'},
];
const TIER3 = [
  {name:'SweatHouse Gym',gradA:'#FF7A29',gradB:'#E8611A',icon:'🏋️'},
  {name:'TeamKit India',gradA:'#06B6D4',gradB:'#0891B2',icon:'🎽'},
  {name:'BallBridge',gradA:'#10B981',gradB:'#059669',icon:'🏏'},
  {name:'FieldVision',gradA:'#8B5CF6',gradB:'#7C3AED',icon:'📹'},
  {name:'ScoutPro',gradA:'#F59E0B',gradB:'#D97706',icon:'🔍'},
  {name:'CricLife',gradA:'#EC4899',gradB:'#DB2777',icon:'🌟'},
];

export function Sponsors() {
  const [name,setName]=React.useState('');
  const [email,setEmail]=React.useState('');
  const [company,setCompany]=React.useState('');
  const [message,setMessage]=React.useState('');
  const [sent,setSent]=React.useState(false);

  return (
    <div style={{background:'#060E1C',color:'#fff',minHeight:'100vh',overflowX:'hidden',fontFamily:'Inter,sans-serif'}}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .wrap{max-width:1280px;margin:0 auto;padding:0 20px;}
        .desk-nav{display:none;align-items:center;gap:22px;}
        .ham-btn{display:flex;}
        .bot-cta{display:flex;}
        @media(min-width:768px){.wrap{padding:0 32px}}
        @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}.bot-cta{display:none!important;}.tier2-grid{grid-template-columns:repeat(4,1fr)!important;}.tier3-grid{grid-template-columns:repeat(3,1fr)!important;}.tier1-grid{grid-template-columns:repeat(2,1fr)!important;}.stats-row{grid-template-columns:repeat(4,1fr)!important;}.form-row{grid-template-columns:1fr 1fr!important;}}
        @media(min-width:640px){.tier2-grid{grid-template-columns:repeat(2,1fr)!important;}.tier3-grid{grid-template-columns:repeat(3,1fr)!important;}.form-row{grid-template-columns:1fr 1fr!important;}}
        .btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;}
        .btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
        .btn-fire:active{transform:scale(0.97);}
        .btn-wa{background:linear-gradient(135deg,#25D366,#1BA851);border:none;border-radius:14px;color:#fff;font-weight:700;cursor:pointer;font-family:Montserrat,sans-serif;transition:transform 0.15s;}
        .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
        .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
        .inp{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:14px;color:#F8F4EE;padding:15px 18px;font-family:Inter,sans-serif;font-size:15px;outline:none;transition:all 0.25s;appearance:none;}
        .inp:focus{border-color:#FF7A29;background:rgba(255,122,41,0.06);box-shadow:0 0 0 4px rgba(255,122,41,0.12);}
        .inp::placeholder{color:rgba(255,255,255,0.28);}
        .lbl{font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:8px;display:block;font-family:Montserrat,sans-serif;}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes goldShimmer{0%,100%{border-color:rgba(232,178,61,0.3);box-shadow:0 0 20px rgba(232,178,61,0.1)}50%{border-color:rgba(232,178,61,0.8);box-shadow:0 0 40px rgba(232,178,61,0.3),0 0 80px rgba(232,178,61,0.1)}}
        @keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
        @keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes borderGlow{0%,100%{border-color:rgba(255,122,41,0.25)}50%{border-color:rgba(255,122,41,0.7)}}
        @keyframes orangeGlow{0%,100%{border-color:rgba(255,122,41,0.2)}50%{border-color:rgba(255,122,41,0.6)}}
      
        /* ── FLOATING REGISTER BUTTON ── */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:2px; color:#fff; font-family:'Montserrat',sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
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
        <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,rgba(255,255,255,0.01) 0px,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <Navbar/>

        {/* HERO */}
        <section style={{padding:'80px 0 60px',textAlign:'center'}}>
          <div className="wrap">
            <div className="tag-pill" style={{marginBottom:20}}>🤝 OUR PARTNERS</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:12}}>
              <span style={{color:'#fff',display:'block'}}>THE BRANDS</span>
              <span className="shimmer-gold" style={{display:'block'}}>BEHIND THE DREAM.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:17,lineHeight:1.7,maxWidth:520,margin:'0 auto',fontFamily:'Inter,sans-serif'}}>
              Our partners share our passion for cricket and corporate excellence. Together, we're building India's biggest corporate cricket movement.
            </p>
          </div>
        </section>

        {/* TIER 1 — TITLE SPONSORS */}
        <section style={{padding:'0 0 64px'}}>
          <div className="wrap">
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:32}}>
              <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(232,178,61,0.8),transparent)'}}/>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#E8B23D',letterSpacing:'0.15em'}}>TITLE SPONSORS</div>
              <div style={{flex:1,height:1,background:'linear-gradient(270deg,rgba(232,178,61,0.8),transparent)'}}/>
            </div>
            <div className="tier1-grid" style={{display:'grid',gridTemplateColumns:'1fr',gap:24}}>
              {TIER1.map((s,i)=>(
                <div key={s.name} style={{background:'linear-gradient(135deg,rgba(20,38,75,0.95),rgba(10,22,46,0.9))',backdropFilter:'blur(32px)',border:'1.5px solid rgba(232,178,61,0.35)',borderRadius:24,padding:'36px 32px',animation:`fadeSlide 0.5s ease ${i*0.1}s both,goldShimmer 3s ease-in-out ${i*0.5}s infinite`,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:0,right:0,width:200,height:200,background:`radial-gradient(circle,${s.gradA}12,transparent 70%)`,pointerEvents:'none'}}/>
                  <div style={{display:'flex',alignItems:'flex-start',gap:20,flexWrap:'wrap'}}>
                    <div style={{width:80,height:80,borderRadius:'50%',background:`linear-gradient(135deg,${s.gradA},${s.gradB})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,flexShrink:0,boxShadow:`0 8px 32px ${s.gradA}55`}}>
                      {s.icon}
                    </div>
                    <div style={{flex:1,minWidth:200}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:8}}>
                        <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:24,color:'#F8F4EE'}}>{s.name}</h2>
                        <span style={{background:'linear-gradient(135deg,rgba(232,178,61,0.2),rgba(232,178,61,0.08))',border:'1px solid rgba(232,178,61,0.5)',color:'#E8B23D',fontSize:9,fontWeight:800,padding:'4px 10px',borderRadius:100,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.1em',whiteSpace:'nowrap'}}>TITLE SPONSOR SEASON 5</span>
                      </div>
                      <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:'Montserrat,sans-serif',marginBottom:10}}>{s.cat}</div>
                      <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,lineHeight:1.7,fontFamily:'Inter,sans-serif',maxWidth:420}}>{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TIER 2 — PRESENTING SPONSORS */}
        <section style={{padding:'0 0 64px'}}>
          <div className="wrap">
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:32}}>
              <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(255,122,41,0.8),transparent)'}}/>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#FF7A29',letterSpacing:'0.15em'}}>PRESENTING SPONSORS</div>
              <div style={{flex:1,height:1,background:'linear-gradient(270deg,rgba(255,122,41,0.8),transparent)'}}/>
            </div>
            <div className="tier2-grid" style={{display:'grid',gridTemplateColumns:'1fr',gap:18}}>
              {TIER2.map((s,i)=>(
                <div key={s.name} style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:'1px solid rgba(255,122,41,0.2)',borderRadius:18,padding:'24px 20px',animation:`fadeSlide 0.4s ease ${i*0.08}s both,orangeGlow 3s ease-in-out ${i*0.4}s infinite`,textAlign:'center'}}>
                  <div style={{width:56,height:56,borderRadius:'50%',background:`linear-gradient(135deg,${s.gradA},${s.gradB})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 14px',boxShadow:`0 6px 24px ${s.gradA}44`}}>
                    {s.icon}
                  </div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#F8F4EE',marginBottom:6}}>{s.name}</div>
                  <p style={{color:'rgba(255,255,255,0.5)',fontSize:12,lineHeight:1.6,fontFamily:'Inter,sans-serif',marginBottom:10}}>{s.desc}</p>
                  <span style={{background:'rgba(255,122,41,0.12)',border:'1px solid rgba(255,122,41,0.3)',color:'#FF7A29',fontSize:9,fontWeight:800,padding:'3px 10px',borderRadius:100,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.1em'}}>PRESENTING PARTNER</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TIER 3 — ASSOCIATE SPONSORS */}
        <section style={{padding:'0 0 64px'}}>
          <div className="wrap">
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:32}}>
              <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(255,255,255,0.2),transparent)'}}/>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'rgba(255,255,255,0.4)',letterSpacing:'0.15em'}}>ASSOCIATE SPONSORS</div>
              <div style={{flex:1,height:1,background:'linear-gradient(270deg,rgba(255,255,255,0.2),transparent)'}}/>
            </div>
            <div className="tier3-grid" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
              {TIER3.map((s,i)=>(
                <div key={s.name} style={{background:'linear-gradient(135deg,rgba(15,34,71,0.85),rgba(10,22,46,0.8))',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'18px 16px',animation:`fadeSlide 0.4s ease ${i*0.07}s both`,display:'flex',alignItems:'center',gap:12,transition:'border-color 0.2s'}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${s.gradA},${s.gradB})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,boxShadow:`0 4px 16px ${s.gradA}44`}}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13,color:'#F8F4EE',marginBottom:4}}>{s.name}</div>
                    <span style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.4)',fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:100,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.08em'}}>ASSOCIATE PARTNER</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BECOME A SPONSOR */}
        <section style={{padding:'0 0 80px'}}>
          <div className="wrap">
            <div style={{background:'linear-gradient(135deg,rgba(15,34,71,0.96),rgba(10,22,46,0.92))',backdropFilter:'blur(32px)',border:'1px solid rgba(255,122,41,0.2)',borderRadius:24,padding:'48px 32px',animation:'borderGlow 3s ease-in-out infinite'}}>
              <div style={{textAlign:'center',marginBottom:40}}>
                <div className="tag-pill" style={{marginBottom:16}}>🤝 PARTNER WITH US</div>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,4vw,40px)',color:'#fff',marginBottom:12}}>Become a Sponsor</h2>
                <p style={{color:'rgba(255,255,255,0.5)',fontSize:15,lineHeight:1.7,maxWidth:480,margin:'0 auto',fontFamily:'Inter,sans-serif'}}>
                  Reach 5,000+ active cricketers across 75 cities. Be part of India's biggest corporate cricket movement.
                </p>
              </div>

              {/* STATS */}
              <div className="stats-row" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,marginBottom:40}}>
                {[{val:'5,000+',label:'Active Cricketers'},{val:'75',label:'Trial Cities'},{val:'Pan-India',label:'Reach'},{val:'Season 5',label:'Since 2020'}].map((s,i)=>(
                  <div key={i} style={{background:'rgba(255,122,41,0.06)',border:'1px solid rgba(255,122,41,0.15)',borderRadius:14,padding:'20px 16px',textAlign:'center'}}>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,color:'#FF7A29',marginBottom:4}}>{s.val}</div>
                    <div style={{color:'rgba(255,255,255,0.45)',fontSize:12,fontFamily:'Inter,sans-serif',letterSpacing:'0.04em'}}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* CONTACT FORM */}
              {sent?(
                <div style={{textAlign:'center',padding:'40px 20px'}}>
                  <div style={{fontSize:48,marginBottom:16}}>✅</div>
                  <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#22C55E',marginBottom:8}}>Enquiry Sent!</h3>
                  <p style={{color:'rgba(255,255,255,0.55)',fontFamily:'Inter,sans-serif'}}>Our partnerships team will reach out to you within 48 hours.</p>
                </div>
              ):(
                <div>
                  <div className="form-row" style={{display:'grid',gridTemplateColumns:'1fr',gap:16,marginBottom:16}}>
                    <div>
                      <label className="lbl">Your Name</label>
                      <input className="inp" placeholder="Rajesh Kumar" value={name} onChange={e=>setName(e.target.value)}/>
                    </div>
                    <div>
                      <label className="lbl">Email Address</label>
                      <input className="inp" type="email" placeholder="rajesh@company.com" value={email} onChange={e=>setEmail(e.target.value)}/>
                    </div>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label className="lbl">Company Name</label>
                    <input className="inp" placeholder="Your Company Pvt. Ltd." value={company} onChange={e=>setCompany(e.target.value)}/>
                  </div>
                  <div style={{marginBottom:24}}>
                    <label className="lbl">Message</label>
                    <textarea className="inp" placeholder="Tell us about your sponsorship interest, budget, and preferred tier..." value={message} onChange={e=>setMessage(e.target.value)} style={{minHeight:110,resize:'vertical',lineHeight:1.6}}/>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <button className="btn-fire" onClick={()=>{if(name&&email)setSent(true);}} style={{padding:'16px 48px',fontSize:15,borderRadius:14}}>
                      🤝 Send Enquiry →
                    </button>
                  </div>
                </div>
              )}
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
