import React from 'react';

function Navbar({open,setOpen}:{open:boolean,setOpen:(v:boolean)=>void}) {
  const links=[['🏠 Home'],['🔴 Match Center'],['🏏 Teams'],['🤝 Sponsors'],['📷 Photos'],['▶️ Videos'],['ℹ️ About'],['❓ FAQ'],['✉️ Contact']];
  return (
    <>
      <div style={{background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)',backgroundSize:'300% 100%',animation:'gradShift 4s ease infinite',color:'#fff',padding:'11px 20px',textAlign:'center',fontSize:13,fontWeight:700,fontFamily:'Montserrat,sans-serif',zIndex:10,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',gap:0,flexWrap:'wrap'}}>
        <span>🏏 Season 5 Registrations OPEN</span>
        <span style={{display:'inline-block',width:1,height:14,background:'rgba(255,255,255,0.4)',margin:'0 14px',verticalAlign:'middle'}}/>
        <span>75 Cities · 10 Teams · ₹299 Only</span>
        <span style={{display:'inline-block',width:1,height:14,background:'rgba(255,255,255,0.4)',margin:'0 14px',verticalAlign:'middle'}}/>
        <span>#OfficeSeStadiumtak</span>
      </div>
      <nav style={{position:'sticky',top:0,zIndex:200,background:'rgba(6,14,28,0.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.07)',boxShadow:'0 1px 0 0 rgba(255,122,41,0.25)'}}>
        <div className="wrap" style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,display:'flex',alignItems:'center'}}>
            <span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:3}}>T20</span>
            <span style={{fontSize:10,color:'rgba(255,122,41,0.7)',marginLeft:8,fontWeight:700,letterSpacing:'0.08em'}}>SEASON 5</span>
          </div>
          <div className="desk-nav" style={{alignItems:'center',gap:22}}>
            {['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'].map(l=>(
              <a key={l} href="#" style={{color:'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13,textDecoration:'none',fontFamily:'Inter,sans-serif',transition:'color 0.2s'}}>{l}</a>
            ))}
            <button className="btn-fire" style={{padding:'10px 20px',fontSize:13}}>Register ₹299</button>
          </div>
          <button className="ham-btn" onClick={()=>setOpen(!open)} style={{flexDirection:'column',gap:5,background:'none',border:'none',cursor:'pointer',padding:8,zIndex:201,display:'flex'}}>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(45deg) translate(5px,5px)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'scaleX(0)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(-45deg) translate(5px,-5px)':''}}/>
          </button>
        </div>
      </nav>
      {open&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#06101E',zIndex:199,display:'flex',flexDirection:'column',padding:'80px 24px 40px',overflowY:'auto'}}>
          <button onClick={()=>setOpen(false)} style={{position:'absolute',top:16,right:16,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:28,cursor:'pointer',lineHeight:1}}>✕</button>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:32}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:3}}>T20</span></div>
          {links.map(([l])=>(
            <a key={l} href="#" onClick={()=>setOpen(false)} style={{color:'rgba(255,255,255,0.85)',fontWeight:700,fontSize:18,textDecoration:'none',fontFamily:'Montserrat,sans-serif',padding:'13px 0',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'block'}}>{l}</a>
          ))}
          <button className="btn-fire" style={{marginTop:28,height:52,fontSize:16,width:'100%'}}>📝 Register for ₹299 →</button>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer style={{background:'#040C18',borderTop:'1px solid rgba(255,255,255,0.05)',padding:'48px 0 32px'}}>
      <div className="wrap">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,marginBottom:32}}>
          <div>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:8}}>
              <span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:4}}>T20</span>
            </div>
            <div style={{fontSize:11,color:'rgba(255,122,41,0.7)',fontWeight:700,letterSpacing:'0.08em',marginBottom:10}}>SEASON 5 · 2025</div>
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,lineHeight:1.7,marginBottom:8,maxWidth:280}}>Relive the dream. Rediscover the thrill. World's largest corporate cricket league.</p>
            <p style={{color:'rgba(255,122,41,0.6)',fontSize:12,fontWeight:700}}>#OfficeSeStadiumtak</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>League</div>
              {['Schedule','Match Center','Teams','Points Table','Photos','Videos'].map(l=>(
                <div key={l} style={{marginBottom:8}}><a href="#" style={{color:'rgba(255,255,255,0.55)',fontSize:13,textDecoration:'none'}}>{l}</a></div>
              ))}
            </div>
            <div>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Info</div>
              {['About','FAQ','Contact','Terms','Privacy','Refunds','Eligibility'].map(l=>(
                <div key={l} style={{marginBottom:8}}><a href="#" style={{color:'rgba(255,255,255,0.55)',fontSize:13,textDecoration:'none'}}>{l}</a></div>
              ))}
            </div>
          </div>
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:20,display:'flex',flexWrap:'wrap',gap:12,justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'rgba(255,255,255,0.28)',fontSize:11}}>© 2025 Kriparti Playing11 Pvt. Ltd. | www.bcpl-t20.com</div>
          <div style={{color:'rgba(255,255,255,0.28)',fontSize:11}}>All rights reserved</div>
        </div>
      </div>
    </footer>
  );
}

function MobileCTA() {
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,padding:'10px 16px 18px',background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',gap:10}}>
      <button className="btn-fire" style={{flex:2,height:52,fontSize:15}}>Register ₹299 →</button>
      <button className="btn-wa" style={{flex:1,height:52,fontSize:14,borderRadius:14}}>💬 WhatsApp</button>
    </div>
  );
}

const OrangeDot = () => (
  <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#FF7A29',marginRight:10,flexShrink:0,marginTop:7}}/>
);

export function CodeOfConduct() {
  const [open,setOpen]=React.useState(false);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{background:#060E1C;}
    .wrap{max-width:1280px;margin:0 auto;padding:0 20px;}
    .desk-nav{display:none;align-items:center;gap:22px;}
    .ham-btn{display:flex;}
    .bot-cta{display:flex;}
    @media(min-width:768px){.wrap{padding:0 32px}}
    @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}.bot-cta{display:none!important;}}
    .btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;display:inline-flex;align-items:center;justify-content:center;}
    .btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
    .btn-fire:active{transform:scale(0.97);}
    .btn-wa{background:linear-gradient(135deg,#25D366,#1BA851);border:none;border-radius:14px;color:#fff;font-weight:700;cursor:pointer;font-family:Montserrat,sans-serif;transition:transform 0.15s;display:inline-flex;align-items:center;justify-content:center;}
    .glass-card{background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85));backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.09);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06);}
    .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
    .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
    @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
    @keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes borderGlow{0%,100%{border-color:rgba(255,122,41,0.3)}50%{border-color:rgba(255,122,41,0.8)}}
  `;

  const particles = [
    {top:'15%',left:'8%',color:'#FF7A29',delay:'0s',size:3},
    {top:'25%',left:'92%',color:'#E8B23D',delay:'1.2s',size:4},
    {top:'55%',left:'5%',color:'#fff',delay:'0.7s',size:3},
    {top:'70%',left:'88%',color:'#FF7A29',delay:'2s',size:3},
    {top:'40%',left:'50%',color:'#E8B23D',delay:'1.5s',size:4},
    {top:'80%',left:'30%',color:'#fff',delay:'0.3s',size:3},
    {top:'10%',left:'65%',color:'#FF7A29',delay:'2.5s',size:3},
    {top:'60%',left:'72%',color:'#E8B23D',delay:'0.9s',size:4},
  ];

  return (
    <div style={{background:'#060E1C',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#F8F4EE',paddingBottom:80}}>
      <style>{css}</style>

      {/* Ambient Background */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
        {/* Stadium SVG */}
        <svg style={{position:'absolute',bottom:0,left:0,right:0,width:'100%',opacity:0.07}} viewBox="0 0 1440 400" preserveAspectRatio="none">
          <path d="M0,400 L0,200 Q360,80 720,80 Q1080,80 1440,200 L1440,400 Z" fill="#1a2a4a"/>
          <rect x="680" y="200" width="80" height="200" fill="#0d1a33"/>
          <line x1="200" y1="0" x2="260" y2="200" stroke="#E8B23D" strokeWidth="3"/>
          <line x1="200" y1="0" x2="140" y2="200" stroke="#E8B23D" strokeWidth="3"/>
          <circle cx="200" cy="0" r="8" fill="#E8B23D"/>
          <line x1="1240" y1="0" x2="1300" y2="200" stroke="#E8B23D" strokeWidth="3"/>
          <line x1="1240" y1="0" x2="1180" y2="200" stroke="#E8B23D" strokeWidth="3"/>
          <circle cx="1240" cy="0" r="8" fill="#E8B23D"/>
        </svg>
        {/* Particles */}
        {particles.map((p,i)=>(
          <div key={i} style={{position:'absolute',top:p.top,left:p.left,width:p.size,height:p.size,borderRadius:'50%',background:p.color,animation:`floatParticle 4s ease-in-out ${p.delay} infinite`}}/>
        ))}
        {/* Scanlines */}
        <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.015) 2px,rgba(255,255,255,0.015) 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <Navbar open={open} setOpen={setOpen}/>

        {/* Hero */}
        <section style={{padding:'72px 0 40px',textAlign:'center',animation:'fadeSlide 0.6s ease both'}}>
          <div className="wrap">
            <div className="tag-pill" style={{marginBottom:20}}>⚖️ PLAYER STANDARDS</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(36px,7vw,72px)',lineHeight:1.05,marginBottom:8}}>
              <span style={{color:'#fff',display:'block'}}>CODE OF</span>
              <span className="shimmer-gold" style={{display:'block'}}>CONDUCT.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,fontWeight:600,letterSpacing:'0.05em',marginTop:16,fontFamily:'Montserrat,sans-serif'}}>Last updated: January 15, 2025</p>
            <p style={{color:'rgba(255,255,255,0.65)',fontSize:16,lineHeight:1.7,maxWidth:600,margin:'16px auto 0'}}>
              BCPL T20 holds all players to the highest standards of sportsmanship, professionalism, and integrity. These guidelines apply to every registered participant across all 75 cities.
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="wrap" style={{maxWidth:860,margin:'0 auto',paddingBottom:40}}>

          {/* Section 1 */}
          <div className="glass-card" style={{padding:'32px 36px',marginBottom:20,animation:'fadeSlide 0.5s ease 0.1s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{fontSize:28}}>🏏</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:20,color:'#fff'}}>1. Spirit of the Game</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:15,lineHeight:1.8,marginBottom:14}}>
              Cricket is more than a sport — it is a gentleman's game built on centuries of honour, respect, and fair play. Every BCPL participant is expected to uphold and embody these values at all times, both on and off the field.
            </p>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
              {[
                'Play hard but play fair — results matter, but integrity matters more',
                'Respect your opponents, teammates, umpires, and spectators at all times',
                'Accept all decisions gracefully, whether in your favour or against',
                'Demonstrate genuine sportsmanship — congratulate opponents on good play',
                'Uphold the integrity of BCPL Season 5 as a tournament of professionals',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.75)',fontSize:14,lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2 */}
          <div className="glass-card" style={{padding:'32px 36px',marginBottom:20,animation:'fadeSlide 0.5s ease 0.2s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{fontSize:28}}>🎯</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:20,color:'#fff'}}>2. On-Field Conduct</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:15,lineHeight:1.8,marginBottom:14}}>
              Player behaviour during match hours — from warm-ups through to post-match — is held to strict conduct standards. The following behaviours are <strong style={{color:'#E8493F'}}>strictly prohibited</strong>:
            </p>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
              {[
                'Dissent toward umpires — verbal or physical — including gesturing or arguing decisions',
                'Intimidating, threatening, or engaging in verbal abuse of any opponent or official',
                'Excessive, orchestrated, or abusive appealing designed to pressurise the umpire',
                'Deliberately damaging pitch or equipment or engaging in time-wasting tactics',
                'Physical altercations of any kind — immediate Level 4 violation',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.75)',fontSize:14,lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
            <div style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:12,padding:'12px 16px'}}>
              <p style={{color:'rgba(34,197,94,0.9)',fontSize:13,fontWeight:600}}>✅ Positive play, encouraging teammates, and constructive communication are always welcome.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="glass-card" style={{padding:'32px 36px',marginBottom:20,animation:'fadeSlide 0.5s ease 0.3s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{fontSize:28}}>📱</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:20,color:'#fff'}}>3. Off-Field Conduct</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:15,lineHeight:1.8,marginBottom:14}}>
              Players represent BCPL T20 and the corporate cricket community beyond the boundary ropes. Professional conduct is expected in all public and digital spaces.
            </p>
            <div style={{display:'grid',gap:12}}>
              {[
                {icon:'💬',title:'Social Media',desc:'Do not post disparaging, defamatory, or inflammatory content about BCPL, fellow players, teams, or officials. Celebrate cricket; build the community.'},
                {icon:'👕',title:'Dress Code',desc:'Wear designated BCPL kit during all official events. No logos of competing leagues. White kit for league stage; coloured for knockouts.'},
                {icon:'🤝',title:'Media Interactions',desc:'Be respectful in all media interactions. You have implicitly consented to media coverage by registering for Season 5.'},
              ].map((item,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'14px 16px',display:'flex',gap:12}}>
                  <span style={{fontSize:20,flexShrink:0}}>{item.icon}</span>
                  <div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:13,color:'#E8B23D',marginBottom:4}}>{item.title}</div>
                    <div style={{color:'rgba(255,255,255,0.7)',fontSize:13,lineHeight:1.6}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 */}
          <div className="glass-card" style={{padding:'32px 36px',marginBottom:20,animation:'fadeSlide 0.5s ease 0.35s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{fontSize:28}}>🧪</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:20,color:'#fff'}}>4. Anti-Doping Policy</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:15,lineHeight:1.8,marginBottom:14}}>
              BCPL T20 follows all BCCI and WADA anti-doping guidelines in both letter and spirit. A clean sport is a fair sport.
            </p>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
              {[
                'Random doping tests may be conducted at any match stage, including trials',
                'Players must declare all medications and supplements on the medical disclosure form',
                'Use of any WADA-prohibited substance results in immediate investigation',
                'Confirmed violations lead to Level 4 status — permanent ban from all BCPL editions',
                'Players may appeal via the BCPL Disciplinary Panel within 14 days of notification',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.75)',fontSize:14,lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 5 */}
          <div className="glass-card" style={{padding:'32px 36px',marginBottom:20,animation:'fadeSlide 0.5s ease 0.4s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{fontSize:28}}>⚠️</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:20,color:'#fff'}}>5. Consequences & Penalties</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:15,lineHeight:1.8,marginBottom:20}}>
              BCPL operates a four-level disciplinary system. The level assigned depends on severity, intent, and context of the violation.
            </p>
            <div style={{display:'grid',gap:12}}>
              {[
                {level:'Level 1',color:'#E8B23D',bg:'rgba(232,178,61,0.1)',border:'rgba(232,178,61,0.3)',badge:'Warning',desc:'Minor on-field dissent, dress code violation, or first-time social media infraction. Formal written warning issued.'},
                {level:'Level 2',color:'#FF7A29',bg:'rgba(255,122,41,0.1)',border:'rgba(255,122,41,0.3)',badge:'1-Match Ban',desc:'Repeated Level 1 offence, aggressive appealing, sustained verbal hostility. Player suspended for next scheduled match.'},
                {level:'Level 3',color:'#E8493F',bg:'rgba(232,73,63,0.1)',border:'rgba(232,73,63,0.3)',badge:'Season Ban',desc:'Serious misconduct, physical altercation (non-assault), deliberate pitch tampering. Full season suspension.'},
                {level:'Level 4',color:'#ff4444',bg:'rgba(255,68,68,0.12)',border:'rgba(255,68,68,0.4)',badge:'Permanent Ban',desc:'Assault, anti-doping violation, fraud, or repeated Level 3 offences. Permanent ineligibility from all BCPL editions.'},
              ].map((item,i)=>(
                <div key={i} style={{background:item.bg,border:`1px solid ${item.border}`,borderRadius:12,padding:'14px 18px',display:'flex',gap:14,alignItems:'flex-start'}}>
                  <div style={{flexShrink:0,textAlign:'center',minWidth:80}}>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:12,color:item.color}}>{item.level}</div>
                    <div style={{background:item.color,color:'#fff',borderRadius:8,padding:'3px 8px',fontSize:11,fontWeight:700,marginTop:4,fontFamily:'Montserrat,sans-serif',whiteSpace:'nowrap'}}>{item.badge}</div>
                  </div>
                  <div style={{color:'rgba(255,255,255,0.75)',fontSize:13,lineHeight:1.6}}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Orange Callout */}
          <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.4)',borderLeft:'3px solid #FF7A29',borderRadius:16,padding:'20px 24px',marginBottom:20,animation:'borderGlow 3s ease-in-out infinite'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{fontSize:24,flexShrink:0}}>🚫</span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:6}}>Critical Notice</div>
                <p style={{color:'rgba(255,255,255,0.85)',fontSize:14,lineHeight:1.7}}>
                  Any <strong style={{color:'#FF7A29'}}>Level 3 or Level 4</strong> violation results in <strong style={{color:'#E8493F'}}>immediate disqualification and forfeiture of the registration fee.</strong> No appeal halts the initial suspension — appeals only affect future eligibility.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="glass-card" style={{padding:'32px',textAlign:'center',animation:'fadeSlide 0.5s ease 0.5s both'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,marginBottom:8}}>
              Ready to Play by the Rules?
            </div>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,marginBottom:20}}>Register for BCPL T20 Season 5 and be part of the world's greatest corporate cricket league.</p>
            <button className="btn-fire" style={{padding:'14px 36px',fontSize:16}}>Register for ₹299 →</button>
          </div>
        </div>

        <Footer/>
      </div>
      <MobileCTA/>
      <style>{`
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
      `}</style>
      {/* float reg */}
      <a className='float-reg-btn float-reg-pulse' href='#' style={{textDecoration:'none'}}>🏏 REGISTER NOW →</a>
    </div>
  );
}
