import React from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';

function MobileCTA() {
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,padding:'10px 16px 18px',background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',gap:10}}>
      <a href="/register" className="btn-fire" style={{flex:2,height:52,fontSize:15,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>Register ₹299 →</a>
      <button className="btn-wa" style={{flex:1,height:52,fontSize:14,borderRadius:14}}>💬 WhatsApp</button>
    </div>
  );
}

const OrangeDot = () => (
  <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#FF7A29',marginRight:10,flexShrink:0,marginTop:7}}/>
);

export function CricketRulebook() {
  const [activeSection,setActiveSection]=React.useState<number|null>(null);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    .wrap{max-width:1280px;margin:0 auto;padding:0 16px;}
    .desk-nav{display:none;align-items:center;gap:22px;}
    .ham-btn{display:flex;}
    .bot-cta{display:flex;}
    @media(min-width:640px){.wrap{padding:0 24px}}
    @media(min-width:768px){.wrap{padding:0 32px}}
    @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}.bot-cta{display:none!important;}}
    .btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;display:inline-flex;align-items:center;justify-content:center;min-height:44px;}
    .btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
    .btn-wa{background:linear-gradient(135deg,#25D366,#1BA851);border:none;border-radius:14px;color:#fff;font-weight:700;cursor:pointer;font-family:Montserrat,sans-serif;transition:transform 0.15s;display:inline-flex;align-items:center;justify-content:center;min-height:44px;}
    .glass-card{background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85));backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.09);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06);}
    .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
    .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
    .toc-link{color:rgba(255,255,255,0.7);text-decoration:none;font-size:13px;font-family:Inter,sans-serif;padding:8px 12px;border-radius:8px;display:flex;align-items:center;gap:8px;transition:all 0.2s;cursor:pointer;background:none;border:none;text-align:left;width:100%;min-height:44px;}
    .toc-link:hover{background:rgba(255,122,41,0.1);color:#FF7A29;}
    .footer-grid{grid-template-columns:1fr!important;}
    @media(min-width:640px){.footer-grid{grid-template-columns:1fr 1fr!important;}}
    .float-reg-btn{position:fixed;bottom:28px;right:28px;z-index:9999;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;font-size:13px;letter-spacing:.06em;cursor:pointer;padding:14px 22px;text-transform:uppercase;text-decoration:none;display:flex;align-items:center;gap:8px;box-shadow:0 8px 32px rgba(255,122,41,0.45);clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);transition:opacity .2s,transform .15s;}
    .float-reg-btn:hover{opacity:.9;transform:translateY(-2px);}
    .float-reg-pulse{animation:floatPulse 2.5s ease-in-out infinite;}
    @media(max-width:1023px){.float-reg-btn{display:none!important;}}
    @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
    @keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes borderGlow{0%,100%{border-color:rgba(255,122,41,0.3)}50%{border-color:rgba(255,122,41,0.8)}}
    @keyframes floatPulse{0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45)}50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)}}
  `;

  const particles=[
    {top:'15%',left:'8%',color:'#FF7A29',delay:'0s',size:3},
    {top:'25%',left:'92%',color:'#E8B23D',delay:'1.2s',size:4},
    {top:'55%',left:'5%',color:'#fff',delay:'0.7s',size:3},
    {top:'70%',left:'88%',color:'#FF7A29',delay:'2s',size:3},
    {top:'40%',left:'50%',color:'#E8B23D',delay:'1.5s',size:4},
    {top:'80%',left:'30%',color:'#fff',delay:'0.3s',size:3},
    {top:'10%',left:'65%',color:'#FF7A29',delay:'2.5s',size:3},
    {top:'60%',left:'72%',color:'#E8B23D',delay:'0.9s',size:4},
  ];

  const toc=[
    {n:1,label:'Match Format',icon:'📅'},
    {n:2,label:'Team Composition',icon:'👥'},
    {n:3,label:'Equipment',icon:'🏏'},
    {n:4,label:'Powerplay',icon:'⚡'},
    {n:5,label:'Bowling',icon:'🎳'},
    {n:6,label:'Batting',icon:'🏌️'},
    {n:7,label:'Fielding',icon:'🧤'},
    {n:8,label:'Umpiring',icon:'👨‍⚖️'},
  ];

  const rules=[
    {n:1,icon:'📅',title:'Match Format',items:[
      'T20 format: 20 overs per side in all group and knockout matches',
      'DLS (Duckworth-Lewis-Stern) method applied for all weather interruptions',
      'Minimum 10 overs per side required for a valid result to be declared',
      'Super Over used to break ties in all knockout and playoff matches',
      'Coin toss determines batting/fielding choice; toss result is final',
      'Matches start at scheduled time; 5-minute grace period for late arrivals, thereafter match forfeited',
    ]},
    {n:2,icon:'👥',title:'Team Composition',items:[
      '12-player squad registered per team; playing XI declared 30 minutes before match',
      'At least 4 corporate professionals (non-ringers) must be in the playing XI at all times',
      'One substitute fielder allowed — may only field, not bat or bowl',
      'Concussion substitute may bat, bowl, and field if approved by on-field umpire',
      'Team captain must be registered and be a corporate professional',
      'Ringers policy: maximum 7 non-corporate players per squad',
    ]},
    {n:3,icon:'🏏',title:'Equipment Standards',items:[
      'BCPL-approved bats only: maximum edge thickness 40mm, maximum width 108mm',
      'Helmets are mandatory for all batsmen and close-in fielders (under 15 yards)',
      'Shin guards (batting pads) are mandatory for batsmen',
      'Wicketkeeping gloves and inner gloves mandatory for wicketkeepers',
      'Spikes/studs allowed; no metal studs on artificial turf surfaces',
      'White kit mandatory for league stage; team-coloured kits for knockout rounds',
      'BCPL logo must be visible on jersey; no competing league logos permitted',
    ]},
    {n:4,icon:'⚡',title:'Powerplay Rules',items:[
      'Mandatory powerplay: overs 1 to 6 — maximum 2 fielders outside the 30-yard circle',
      'Bowling powerplay (optional): 2 additional overs taken by batting team anytime overs 7–16',
      'Death overs: 17–20 — standard fielding restrictions apply (max 5 outside circle)',
      'Fielding circle (30 yards) must be marked; umpires may call No-Ball for fielding violations',
      'Fielding captain must notify umpire before optional powerplay is taken',
    ]},
    {n:5,icon:'🎳',title:'Bowling Regulations',items:[
      'Maximum 4 overs per bowler per innings — no exceptions',
      'No-beamer rule: first offence = official warning; second = bowler removed from attack',
      'Front foot no-ball results in a free hit for the batsman on the next delivery',
      'Wide ball: delivery more than one bat-width outside off or leg stump = wide + extra run',
      'No-ball: includes overstepping, waist-height full-toss, and fielding violations',
      'A bowler may bowl from either end but cannot bowl consecutive overs',
    ]},
    {n:6,icon:'🏌️',title:'Batting Rules',items:[
      'Free hit on all no-balls (including wide no-balls): batsman can only be dismissed run out',
      'LBW law applies in full per standard MCC Laws of Cricket',
      'Mankad run-out (non-striker backing up): bowler must warn batsman before effecting dismissal',
      'Obstructing the field: batsman out if intentionally impeding fielder',
      'Handled the ball: now covered under Obstructing the Field (MCC 2017 Laws)',
      'Two bouncer rule per over — third beamer results in no-ball warning',
      'Retired hurt batsman may return; retired out batsman may not',
    ]},
    {n:7,icon:'🧤',title:'Fielding Restrictions',items:[
      'The 30-yard fielding circle must be maintained throughout the innings',
      'Powerplay: minimum 2 fielders inside the circle (excluding wicketkeeper and bowler)',
      'Non-powerplay: maximum 5 fielders outside the circle at point of delivery',
      'Wicketkeeper must remain behind the stumps until ball is delivered',
      'Fielders must not encroach on the pitch — umpire may call Dead Ball',
      'Substitute fielder: must not bat, bowl, or keep wicket; may field anywhere',
    ]},
    {n:8,icon:'👨‍⚖️',title:'Umpiring & DRS',items:[
      '2 on-field umpires appointed by BCPL for all group and knockout matches',
      'Third umpire available for all knockout rounds and finals only',
      'No DRS (Decision Review System) available in group stage matches',
      'Ball-tracking and Hawk-Eye technology available for semi-finals and finals',
      'Umpires\' decisions are final in group stage — no appeals process during match',
      'Post-match conduct complaints submitted to BCPL Disciplinary Committee within 24 hours',
    ]},
  ];

  return (
    <div style={{background:'#060E1C',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#F8F4EE',paddingBottom:80,overflowX:'hidden'}}>
      <style>{css}</style>
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
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
        {particles.map((p,i)=>(
          <div key={i} style={{position:'absolute',top:p.top,left:p.left,width:p.size,height:p.size,borderRadius:'50%',background:p.color,animation:`floatParticle 4s ease-in-out ${p.delay} infinite`}}/>
        ))}
        <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.015) 2px,rgba(255,255,255,0.015) 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <SiteHeader />

        <section style={{padding:'clamp(40px,8vw,72px) 0 40px',textAlign:'center',animation:'fadeSlide 0.6s ease both'}}>
          <div className="wrap">
            <div className="tag-pill" style={{marginBottom:20}}>📋 OFFICIAL RULES</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,7vw,72px)',lineHeight:1.05,marginBottom:8}}>
              <span style={{color:'#fff',display:'block'}}>BCPL CRICKET</span>
              <span className="shimmer-gold" style={{display:'block'}}>RULEBOOK.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,fontWeight:600,letterSpacing:'0.05em',marginTop:16,fontFamily:'Montserrat,sans-serif'}}>Official Rules — Season 5 · 2025</p>
            <p style={{color:'rgba(255,255,255,0.65)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:600,margin:'16px auto 0'}}>
              The complete, official BCPL T20 cricket rulebook. All rules are binding on players, team managers, and officials across all 75 cities.
            </p>
          </div>
        </section>

        <div className="wrap" style={{maxWidth:900,margin:'0 auto',paddingBottom:40}}>

          {/* Table of Contents */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,28px) clamp(16px,4vw,32px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.1s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <span style={{fontSize:22}}>📑</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:18,color:'#E8B23D'}}>Table of Contents</h2>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:4}}>
              {toc.map(item=>(
                <button key={item.n} className="toc-link" onClick={()=>setActiveSection(item.n===activeSection?null:item.n)}>
                  <span style={{width:22,height:22,borderRadius:'50%',background:'rgba(255,122,41,0.2)',border:'1px solid rgba(255,122,41,0.4)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#FF7A29',flexShrink:0,fontFamily:'Montserrat,sans-serif'}}>{item.n}</span>
                  <span>{item.icon} {item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rule Sections */}
          {rules.map((rule,idx)=>(
            <div key={rule.n} className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:`fadeSlide 0.5s ease ${0.1+idx*0.07}s both`,border:activeSection===rule.n?'1px solid rgba(255,122,41,0.5)':'1px solid rgba(255,255,255,0.09)',transition:'border-color 0.3s'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,flexWrap:'wrap'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,rgba(255,122,41,0.3),rgba(232,178,61,0.2))',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:14,color:'#FF7A29',flexShrink:0}}>{rule.n}</div>
                <span style={{fontSize:24}}>{rule.icon}</span>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>{rule.title}</h2>
              </div>
              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
                {rule.items.map((item,i)=>(
                  <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.75)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                    <OrangeDot/>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Callout */}
          <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.4)',borderLeft:'3px solid #FF7A29',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20,animation:'borderGlow 3s ease-in-out infinite'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{fontSize:24,flexShrink:0}}>⚖️</span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:6}}>MCC Laws Apply</div>
                <p style={{color:'rgba(255,255,255,0.85)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  BCPL rules are based on the <strong style={{color:'#E8B23D'}}>MCC Laws of Cricket (2017 edition)</strong>. In any situation not explicitly covered by this rulebook, MCC Laws shall apply. The Tournament Director's ruling is final and binding on all parties.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px)',textAlign:'center'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,22px)',marginBottom:8}}>Ready to Play?</div>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,marginBottom:20}}>Register for BCPL T20 Season 5 — where corporate professionals become cricket legends.</p>
            <a href="/register" className="btn-fire" style={{padding:'14px 36px',fontSize:16,width:'100%',maxWidth:300,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>Register for ₹299 →</a>
          </div>
        </div>

        <BCPLFooter />
      </div>
      <MobileCTA/>
      <a className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>🏏 REGISTER NOW →</a>
    </div>
  );
}
