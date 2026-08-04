import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { LegalDocHeader } from '../lib/legalMeta';
import { IcoScale, IcoBat, IcoTarget, IcoPhone, IcoBan, IcoFlask, IcoCheck, IcoChat, IcoShirt, IcoUsers } from '../lib/icons';

type IcoComp = (p: { size?: number; style?: React.CSSProperties }) => React.ReactElement;

const OrangeDot = () => (
  <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#FF7A29',marginRight:10,flexShrink:0,marginTop:7}}/>
);

export function CodeOfConduct() {

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{background:#F6F3EC;}
    .wrap{max-width:1280px;margin:0 auto;padding:0 16px;}
    .desk-nav{display:none;align-items:center;gap:22px;}
    .ham-btn{display:flex;}
    @media(min-width:640px){.wrap{padding:0 24px}}
    @media(min-width:768px){.wrap{padding:0 32px}}
    @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}}
    .btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;display:inline-flex;align-items:center;justify-content:center;min-height:44px;}
    .btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
    .btn-fire:active{transform:scale(0.97);}
    .glass-card { background:#FFFFFF; border:1px solid rgba(12,29,51,0.10); border-radius:20px; box-shadow:0 10px 30px rgba(12,29,51,0.08); }
    .shimmer-gold{background:linear-gradient(90deg,#B8892B,#E8B23D,#B8892B,#C79A2E,#B8892B);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
    .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
    .float-reg-btn{position:fixed;bottom:28px;right:28px;z-index:900;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;font-size:13px;letter-spacing:.06em;cursor:pointer;padding:14px 22px;text-transform:uppercase;text-decoration:none;display:flex;align-items:center;gap:8px;box-shadow:0 8px 32px rgba(255,122,41,0.45);clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);transition:opacity .2s,transform .15s;}
    .float-reg-btn:hover{opacity:.9;transform:translateY(-2px);}
    .float-reg-pulse{animation:floatPulse 2.5s ease-in-out infinite;}
    .footer-grid{grid-template-columns:1fr!important;}
    @media(min-width:640px){.footer-grid{grid-template-columns:1fr 1fr!important;}}
    .glass-card-inner{padding:20px 16px!important;}
    @media(min-width:640px){.glass-card-inner{padding:32px 36px!important;}}
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

  const particles = [
    {top:'15%',left:'8%',color:'#FF7A29',delay:'0s',size:3},
    {top:'25%',left:'92%',color:'#B8892B',delay:'1.2s',size:4},
    {top:'55%',left:'5%',color:'#0C1D33',delay:'0.7s',size:3},
    {top:'70%',left:'88%',color:'#FF7A29',delay:'2s',size:3},
    {top:'40%',left:'50%',color:'#B8892B',delay:'1.5s',size:4},
    {top:'80%',left:'30%',color:'#0C1D33',delay:'0.3s',size:3},
    {top:'10%',left:'65%',color:'#FF7A29',delay:'2.5s',size:3},
    {top:'60%',left:'72%',color:'#B8892B',delay:'0.9s',size:4},
  ];

  return (
    <div style={{background:'#F6F3EC',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#0C1D33',paddingBottom:80,overflowX:'hidden'}}>
      <style>{css}</style>

      {/* Ambient Background */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
        <svg style={{position:'absolute',bottom:0,left:0,right:0,width:'100%',opacity:0.07}} viewBox="0 0 1440 400" preserveAspectRatio="none">
          <path d="M0,400 L0,200 Q360,80 720,80 Q1080,80 1440,200 L1440,400 Z" fill="rgba(12,29,51,0.05)"/>
          <rect x="680" y="200" width="80" height="200" fill="#FFFFFF"/>
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

        {/* Hero */}
        <section style={{padding:'clamp(40px,8vw,72px) 0 40px',textAlign:'center',animation:'fadeSlide 0.6s ease both'}}>
          <div className="wrap">
            <div className="tag-pill" style={{marginBottom:20}}><IcoScale size={14}/> PLAYER STANDARDS</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(36px,7vw,72px)',lineHeight:1.05,marginBottom:8}}>
              <span style={{color:'#0C1D33',display:'block'}}>CODE OF</span>
              <span className="shimmer-gold" style={{display:'block'}}>CONDUCT.</span>
            </h1>
            <p style={{color:'rgba(12,29,51,.60)',fontSize:12,marginTop:16,fontFamily:'Inter,sans-serif'}}>यह दस्तावेज़ English में मान्य है · This document is authoritative in English.</p>
            <p style={{color:'rgba(12,29,51,.78)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:600,margin:'16px auto 0'}}>
              BCPL T20 expects high standards of sportsmanship, professionalism and integrity from all participants. These standards apply during registration, trials, the auction and the tournament, in every trial city.
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="wrap" style={{maxWidth:860,margin:'0 auto',paddingBottom:40}}>

          <LegalDocHeader doc="conduct" />

          <p style={{color:'rgba(12,29,51,.78)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7,margin:'0 0 20px',fontStyle:'italic'}}>
            This document applies to BCPL Season 5 unless expressly stated otherwise.
          </p>

          {/* KEY POINTS summary */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,28px) clamp(16px,4vw,32px)',marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <span style={{color:'#B8892B',display:'inline-flex',alignItems:'center'}}><IcoScale size={20}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#B8892B'}}>Key Points</h2>
            </div>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:8}}>
              {[
                'Play and behave fairly and respectfully — toward opponents, officials, staff and the game — at every stage.',
                'Prohibited: abuse, threats, violence, discrimination, harassment, cheating, false documents, bribery, betting/corruption and manipulation of the process.',
                'BCPL applies its own internal offence levels (Levels 1\u20134) and does not claim ICC disciplinary jurisdiction.',
                'A fair process applies: report, evidence, notice, a chance to respond, decision, proportionate sanction, written decision and an appeal window. BCPL does not impose arbitrary fines.',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(12,29,51,.78)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.65}}>
                  <OrangeDot/><span>{item}</span>
                </li>
              ))}
            </ul>
          </div>


          {/* Section 1 */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.1s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{color:'#B8892B',display:'inline-flex',alignItems:'center'}}><IcoBat size={28}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#0C1D33'}}>1. Spirit of the Game</h2>
            </div>
            <p style={{color:'rgba(12,29,51,.78)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:14}}>
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
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(12,29,51,.78)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2 */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.2s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{color:'#B8892B',display:'inline-flex',alignItems:'center'}}><IcoTarget size={28}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#0C1D33'}}>2. On-Field Conduct</h2>
            </div>
            <p style={{color:'rgba(12,29,51,.78)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:14}}>
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
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(12,29,51,.78)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
            <div style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:12,padding:'12px 16px'}}>
              <p style={{color:'rgba(34,197,94,0.9)',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8}}><span style={{color:'#22C55E',display:'inline-flex',flexShrink:0}}><IcoCheck size={16}/></span>Positive play, encouraging teammates, and constructive communication are always welcome.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.3s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{color:'#B8892B',display:'inline-flex',alignItems:'center'}}><IcoPhone size={28}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#0C1D33'}}>3. Off-Field Conduct</h2>
            </div>
            <p style={{color:'rgba(12,29,51,.78)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:14}}>
              Players represent BCPL T20 and the corporate cricket community beyond the boundary ropes. Professional conduct is expected in all public and digital spaces.
            </p>
            <div style={{display:'grid',gap:12}}>
              {([
                {icon:IcoChat,title:'Social Media',desc:'Do not post disparaging, defamatory, or inflammatory content about BCPL, fellow players, teams, or officials. Celebrate cricket; build the community.'},
                {icon:IcoShirt,title:'Dress Code',desc:'Wear designated BCPL kit during all official events. No logos of competing leagues. White kit for league stage; coloured for knockouts.'},
                {icon:IcoUsers,title:'Media Interactions',desc:'Be respectful in all media interactions. You have implicitly consented to media coverage by registering for Season 5.'},
              ] as {icon:IcoComp;title:string;desc:string}[]).map((item,i)=>(
                <div key={i} style={{background:'rgba(12,29,51,0.04)',border:'1px solid rgba(12,29,51,0.12)',borderRadius:12,padding:'14px 16px',display:'flex',gap:12}}>
                  <span style={{flexShrink:0,color:'#B8892B',display:'inline-flex'}}><item.icon size={20}/></span>
                  <div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:13,color:'#B8892B',marginBottom:4}}>{item.title}</div>
                    <div style={{color:'rgba(12,29,51,.78)',fontSize:13,lineHeight:1.6}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3b — Prohibited Conduct catalogue */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.32s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{color:'#B8892B',display:'inline-flex',alignItems:'center'}}><IcoBan size={28}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#0C1D33'}}>4. Prohibited Conduct</h2>
            </div>
            <p style={{color:'rgba(12,29,51,.78)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:14}}>
              The following are treated as violations of this Code at any stage — <strong style={{color:'#B8892B'}}>registration, physical trials, the auction and the tournament</strong>:
            </p>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
              {[
                'Abuse, threats, violence or intimidation toward any player, official, coach, evaluator, staff member or spectator',
                'Harassment or discrimination of any kind, including on the basis of religion, caste, gender, region, language or disability',
                'Bribery, inducement or any attempt to influence, pressure or intimidate coaches, evaluators or officials over assessment or selection',
                'Submitting false documents, false declarations, forged identity or professional/employment records',
                'Impersonation, or duplicate / multiple identity registration or fraud',
                'Video manipulation, tampering, or submitting footage that is not the registered player\u2019s own genuine performance',
                'Unauthorised re-trial attempts, or attempting to take a trial in another person\u2019s name or slot',
                'Betting, match-fixing, spot-fixing, corruption or approaches related to any of these',
                'Venue misconduct, including damaging property, ignoring safety directions or disruptive behaviour',
                'Interfering with scoring, trial equipment, records or the assessment/ranking process',
                'Violating applicable safety rules, or participating without required protective equipment when instructed',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(12,29,51,.78)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 4 */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.35s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{color:'#B8892B',display:'inline-flex',alignItems:'center'}}><IcoFlask size={28}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#0C1D33'}}>5. Anti-Doping Policy</h2>
            </div>
            <p style={{color:'rgba(12,29,51,.78)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:14}}>
              BCPL T20 follows recognised anti-doping principles aligned with WADA guidelines, in both letter and spirit. A clean sport is a fair sport.
            </p>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
              {[
                'Random doping tests may be conducted at any match stage, including trials',
                'Players must declare all medications and supplements on the medical disclosure form',
                'Use of any WADA-prohibited substance results in investigation under the fair disciplinary process',
                'A confirmed violation is treated as a Level 4 matter and may lead to a season ban and ineligibility for future editions',
                'Participants may raise concerns through the published BCPL grievance process',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(12,29,51,.78)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 5b — Wider conduct obligations */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.37s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{color:'#B8892B',display:'inline-flex',alignItems:'center'}}><IcoUsers size={28}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#0C1D33'}}>6. Safeguarding, Integrity & Wider Obligations</h2>
            </div>
            <p style={{color:'rgba(12,29,51,.78)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:14}}>
              Beyond match play, all participants owe the following standards throughout registration, trials, the auction and the tournament:
            </p>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
              {[
                'Sexual harassment & safeguarding: any sexual harassment, or any conduct that endangers the safety or dignity of another person, is strictly prohibited and treated as a serious violation.',
                'Discrimination & harassment: harassment or discrimination on the basis of religion, caste, gender, region, language, disability or similar is prohibited.',
                'Betting, corruption & inside information: betting, match/spot-fixing, corrupt approaches and misuse of non-public inside information are strictly prohibited.',
                'Alcohol & substance rules: where applicable, published alcohol and substance rules must be followed at BCPL venues and events.',
                'Confidentiality & data/privacy: respect confidential BCPL information and the privacy of other participants; do not misuse or disclose others\u2019 personal data.',
                'Media & public statements: make only responsible public and media statements; do not make disparaging, defamatory or misleading statements about BCPL, participants, teams or officials.',
                'Sponsor & brand obligations: honour reasonable sponsor and BCPL brand obligations and do not display competing-league branding at official events.',
                'Medical & safety compliance: follow all medical, safety and first-response directions given by BCPL staff and officials.',
                'Reporting & non-retaliation: participants are encouraged to report suspected misconduct in good faith; retaliation against a good-faith reporter or a witness is itself a violation.',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(12,29,51,.78)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 7 — fair disciplinary process */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.4s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{color:'#B8892B',display:'inline-flex',alignItems:'center'}}><IcoScale size={28}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#0C1D33'}}>7. Fair Disciplinary Process</h2>
            </div>
            <p style={{color:'rgba(12,29,51,.78)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:16}}>
              These are BCPL&rsquo;s own internal conduct levels and process. BCPL does not claim ICC disciplinary jurisdiction; its levels are inspired by recognised cricket conduct frameworks. Where a violation is alleged, BCPL follows a fair, proportionate process:
            </p>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
              {[
                'Incident report: an alleged violation is reported to BCPL (by an official, staff member or participant) and recorded.',
                'Evidence: relevant evidence — for example match/venue reports, recordings, documents or witness accounts — is gathered.',
                'Notice: the participant is informed in writing of the alleged violation and the applicable conduct rule and level.',
                'Opportunity to respond: the participant is given a reasonable opportunity to respond or explain before a decision is made.',
                'Interim action: where safety or the integrity of the process requires it, BCPL may take interim action (for example interim suspension or removal from a venue) pending the outcome.',
                'Decision authority: the matter is decided by the authorised BCPL disciplinary decision-maker for the season.',
                'Sanction: a proportionate sanction appropriate to the severity, intent and context is applied — see the sanctions and escalation levels below.',
                'Written decision: the outcome and any sanction are communicated to the participant in writing with reasons.',
                'Appeal: the participant may appeal within the stated appeal window through the published process. (OWNER / COUNSEL DECISION REQUIRED: confirm the exact appeal window / number of days.)',
                'Final internal decision: the decision on appeal is BCPL\u2019s final internal decision, subject to applicable law.',
                'Records: BCPL keeps records of the report, evidence, decision and sanction for audit and integrity purposes.',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(12,29,51,.78)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
            <div style={{background:'rgba(12,29,51,0.04)',border:'1px solid rgba(12,29,51,0.12)',borderRadius:12,padding:'14px 16px',marginBottom:20}}>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:13,color:'#B8892B',marginBottom:8}}>Possible sanctions</div>
              <p style={{color:'rgba(12,29,51,.78)',fontSize:13,lineHeight:1.7}}>
                Depending on severity, sanctions may include: a warning; invalidation of an affected score or attempt; removal from a venue; cancellation of a trial; disqualification from the current process; suspension; a ban from current and/or future BCPL participation; forfeiture where applicable; and reporting to the appropriate authorities where required by law. BCPL does not impose arbitrary monetary fines.
              </p>
            </div>
            <p style={{color:'rgba(12,29,51,.78)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:20}}>
              Sanctions escalate with severity through the following BCPL internal levels. The level applied depends on the severity, intent and context of the violation.
            </p>
            <div style={{display:'grid',gap:12}}>
              {[
                {level:'Level 1',color:'#B8892B',bg:'rgba(232,178,61,0.1)',border:'rgba(232,178,61,0.3)',badge:'Warning',desc:'Minor conduct issues, such as dress-code lapses or a first-time social-media infraction. A formal warning is issued.'},
                {level:'Level 2',color:'#FF7A29',bg:'rgba(255,122,41,0.1)',border:'rgba(255,122,41,0.3)',badge:'Score Invalidation',desc:'Repeated Level 1 conduct, or conduct that compromises the fairness of an assessment. May include invalidation of the affected trial/assessment score or attempt.'},
                {level:'Level 3',color:'#E8493F',bg:'rgba(232,73,63,0.1)',border:'rgba(232,73,63,0.3)',badge:'Disqualification',desc:'Serious misconduct — for example fraud, false documents, video manipulation, pressuring officials or venue misconduct. May lead to disqualification from the current process.'},
                {level:'Level 4',color:'#ff4444',bg:'rgba(255,68,68,0.12)',border:'rgba(255,68,68,0.4)',badge:'Ban',desc:'Most serious violations — for example violence, sexual harassment, betting/corruption, anti-doping violations or repeated Level 3 conduct. May lead to suspension or a ban from current and future BCPL participation, and reporting to authorities where required.'},
              ].map((item,i)=>(
                <div key={i} style={{background:item.bg,border:`1px solid ${item.border}`,borderRadius:12,padding:'14px 18px',display:'flex',gap:14,alignItems:'flex-start',flexWrap:'wrap'}}>
                  <div style={{flexShrink:0,textAlign:'center',minWidth:80}}>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:12,color:item.color}}>{item.level}</div>
                    <div style={{background:item.color,color:'#0C1D33',borderRadius:8,padding:'3px 8px',fontSize:11,fontWeight:700,marginTop:4,fontFamily:'Montserrat,sans-serif',whiteSpace:'nowrap'}}>{item.badge}</div>
                  </div>
                  <div style={{color:'rgba(12,29,51,.78)',fontSize:13,lineHeight:1.6,flex:1,minWidth:180}}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Orange Callout */}
          <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.4)',borderLeft:'3px solid #FF7A29',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20,animation:'borderGlow 3s ease-in-out infinite'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{flexShrink:0,color:'#E8493F',display:'inline-flex'}}><IcoBan size={24}/></span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:6}}>Serious Violations</div>
                <p style={{color:'#0C1D33',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  A confirmed <strong style={{color:'#FF7A29'}}>Level 3 or Level 4</strong> violation may result in <strong style={{color:'#E8493F'}}>disqualification or a season ban</strong> following the fair disciplinary process. Fee treatment in such cases follows the applicable <Link href="/refunds" style={{color:'#B8892B',fontWeight:600}}>Refund &amp; Cancellation Policy</Link>. Participants may raise concerns through the published BCPL grievance process.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px)',textAlign:'center',animation:'fadeSlide 0.5s ease 0.5s both'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,22px)',marginBottom:8}}>
              Ready to Play by the Rules?
            </div>
            <p style={{color:'rgba(12,29,51,.78)',fontSize:14,marginBottom:20}}>Register for BCPL T20 Season 5 and be part of the corporate cricket community.</p>
            <Link href="/register" className="btn-fire" style={{padding:'14px 36px',fontSize:16,width:'100%',maxWidth:300,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>Register for Phase 1 →</Link>
          </div>
        </div>

        <BCPLFooter />
      </div>
      <StickyRegisterCTA />
      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>REGISTER NOW →</Link>
    </div>
  );
}
