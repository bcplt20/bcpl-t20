import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { LegalDocHeader } from '../lib/legalMeta';
import { IcoCalendar, IcoUsers, IcoBat, IcoZap, IcoBall, IcoShield, IcoScale, IcoList, IcoStadium, IcoPages, IcoBan } from '../lib/icons';

type IcoComp = (p: { size?: number; style?: React.CSSProperties }) => React.ReactElement;

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
    @media(min-width:640px){.wrap{padding:0 24px}}
    @media(min-width:768px){.wrap{padding:0 32px}}
    @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}}
    .btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;display:inline-flex;align-items:center;justify-content:center;min-height:44px;}
    .btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
    .glass-card{background:linear-gradient(135deg,rgba(30,55,105,0.9),rgba(23,43,81,0.85));backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.18);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.18);}
    .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
    .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
    .toc-link{color:rgba(255,255,255,0.88);text-decoration:none;font-size:13px;font-family:Inter,sans-serif;padding:8px 12px;border-radius:8px;display:flex;align-items:center;gap:8px;transition:all 0.2s;cursor:pointer;background:none;border:none;text-align:left;width:100%;min-height:44px;}
    .toc-link:hover{background:rgba(255,122,41,0.1);color:#FF7A29;}
    .footer-grid{grid-template-columns:1fr!important;}
    @media(min-width:640px){.footer-grid{grid-template-columns:1fr 1fr!important;}}
    .float-reg-btn{position:fixed;bottom:28px;right:28px;z-index:900;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;font-size:13px;letter-spacing:.06em;cursor:pointer;padding:14px 22px;text-transform:uppercase;text-decoration:none;display:flex;align-items:center;gap:8px;box-shadow:0 8px 32px rgba(255,122,41,0.45);clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);transition:opacity .2s,transform .15s;}
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

  const toc:{n:number;label:string;icon:IcoComp}[]=[
    {n:1,label:'Foundation & Hierarchy',icon:IcoScale},
    {n:2,label:'Spirit of Cricket',icon:IcoBat},
    {n:3,label:'Teams, Squad & Officials',icon:IcoUsers},
    {n:4,label:'Match Format & Overs',icon:IcoCalendar},
    {n:5,label:'Powerplay & Fielding',icon:IcoZap},
    {n:6,label:'Bowling',icon:IcoBall},
    {n:7,label:'Batting & Dismissals',icon:IcoBat},
    {n:8,label:'Interruptions & Results',icon:IcoCalendar},
    {n:9,label:'Points, NRR & Qualification',icon:IcoList},
    {n:10,label:'Equipment, Ground & Ball',icon:IcoShield},
    {n:11,label:'Umpiring, Replays & Scorers',icon:IcoScale},
    {n:12,label:'Conduct, Integrity & Discipline',icon:IcoBan},
    {n:13,label:'Committee, Force Majeure & Amendments',icon:IcoPages},
  ];

  // "BCPL Playing Condition" = a BCPL-specific variation of / addition to the
  // MCC-foundation framework. Items so labelled are BCPL modifications; other
  // items summarise the standard framework. Concrete numeric BCPL conditions
  // (squad size, overs-per-bowler, grace periods etc.) are set in the final
  // published BCPL Playing Conditions and confirmed in the pre-match briefing —
  // OWNER / COUNSEL DECISION REQUIRED where a specific number is to be pinned.
  const rules:{n:number;icon:IcoComp;title:string;items:React.ReactNode[]}[]=[
    {n:1,icon:IcoScale,title:'Foundation, Scope & Document Hierarchy',items:[
      'Matches are governed by the MCC Laws of Cricket, as modified by the BCPL Playing Conditions. Where expressly adopted, relevant ICC Men\u2019s T20 playing-condition principles may be used as a reference framework. BCPL-specific conditions prevail for the BCPL competition where permitted.',
      'BCPL is an independent competition. BCPL matches are not International matches and are not governed, sanctioned or run by the ICC or any national board; ICC materials are referenced only where expressly adopted by BCPL.',
      'Document hierarchy: (1) BCPL Playing Conditions and tournament regulations; (2) ICC Men\u2019s T20 playing-condition principles where expressly adopted as reference; (3) MCC Laws of Cricket as the foundational Laws for anything not otherwise addressed.',
      'This page is a concise summary rulebook. The final published BCPL Playing Conditions and the official pre-match briefing prevail over this summary wherever they differ.',
    ]},
    {n:2,icon:IcoBat,title:'Spirit of Cricket',items:[
      'The Spirit of Cricket underpins the game: play hard, play fair, and respect opponents, team-mates, officials and the game itself.',
      'Captains are responsible, at all times, for ensuring their team plays within the Spirit of Cricket as well as within the Laws and Playing Conditions.',
      <>Player and team conduct is additionally governed by the BCPL <Link href="/code-of-conduct" style={{color:'#E8B23D',fontWeight:600}}>Code of Conduct</Link> and its disciplinary process.</>,
    ]},
    {n:3,icon:IcoUsers,title:'Teams, Playing XI, Substitutes & Officials',items:[
      'Each match is contested by two teams; each team fields a playing XI. (BCPL Playing Condition) Squad size, playing-XI declaration timing and player nomination follow the published BCPL Playing Conditions for the season.',
      '(BCPL Playing Condition) Player eligibility and composition requirements for a squad and playing XI are governed by the published BCPL eligibility and tournament rules.',
      'Substitutes: a substitute fielder may field but may not bat, bowl or act as captain or wicketkeeper unless the Playing Conditions expressly permit it.',
      'Concussion replacement: where adopted by BCPL, a like-for-like concussion replacement may be permitted subject to the match officials\u2019 approval and the published protocol. (BCPL Playing Condition)',
      'Captains\u2019 responsibilities: the captain represents the team to the umpires, is responsible for team conduct, and manages nominations and declarations as required.',
      'Officials & authority: match officials appointed by BCPL manage the match. Their on-field authority and decisions are as set out in the Laws and Playing Conditions.',
    ]},
    {n:4,icon:IcoCalendar,title:'Match Format, Toss, Innings & Overs',items:[
      'Format: Twenty20 — a maximum of 20 overs per side, unless reduced by the Playing Conditions due to interruption.',
      'Toss: the toss determines choice of batting or fielding and, once made and communicated, is final.',
      'Innings length & overs: each side bats one innings of up to 20 overs. Over completion, change of ends and related mechanics follow the Laws as modified by the Playing Conditions.',
      '(BCPL Playing Condition) A minimum number of overs per side is required to constitute a valid match; the exact minimum is set in the published BCPL Playing Conditions.',
      'Match duration, innings intervals and timings follow the published BCPL match regulations for the season. (BCPL Playing Condition)',
    ]},
    {n:5,icon:IcoZap,title:'Powerplay & Field Restrictions',items:[
      'A fielding circle is marked on the ground; field-restriction requirements are enforced by the umpires.',
      '(BCPL Playing Condition) Powerplay overs and the maximum number of fielders permitted outside the fielding circle during and after the powerplay follow the published BCPL Playing Conditions, based on standard T20 field-restriction principles.',
      'A minimum number of fielders must remain inside the circle during the powerplay, and a maximum number may be outside the circle thereafter, as specified in the Playing Conditions.',
      'The wicketkeeper and fielders must be correctly positioned at the moment of delivery; a breach may result in a No-ball or Dead ball as provided in the Laws/Playing Conditions.',
    ]},
    {n:6,icon:IcoBall,title:'Bowling: Limits, No-ball, Free Hit & Wide',items:[
      '(BCPL Playing Condition) Maximum overs per bowler per innings follow the published BCPL Playing Conditions (standard T20 principle: a proportionate per-bowler limit).',
      'No-ball: includes overstepping the popping crease, certain high full tosses and specified fielding/positioning breaches, per the Laws as modified by the Playing Conditions.',
      'Free hit: where adopted, a No-ball results in a Free hit on the following delivery, on which the striker cannot be dismissed except by the methods the Playing Conditions allow. (BCPL Playing Condition)',
      'Wide ball: a delivery outside the permitted lines/limits is called Wide and counts as an extra, per the Laws and any T20 wide-line guidance adopted.',
      'A bowler may bowl from either end but may not bowl two overs consecutively.',
    ]},
    {n:7,icon:IcoBat,title:'Batting, Scoring, Boundaries & Dismissals',items:[
      'Scoring & boundaries: runs, boundaries (four/six) and extras are scored per the Laws; the boundary is marked and adjudicated by the umpires/officials.',
      'Dismissals: the methods of dismissal are as set out in the MCC Laws of Cricket (including bowled, caught, LBW, run out, stumped and others).',
      'Run out at the non-striker\u2019s end: this is a legitimate method of run out under the current MCC Laws and is treated accordingly under the Playing Conditions.',
      'Obstructing the field now incorporates the former \u201Chandled the ball\u201D under the current MCC Laws.',
      'Wicketkeeper rules: the wicketkeeper must be positioned correctly and act within the Laws governing wicketkeeping.',
      'Retired hurt / retired: a batter who retires hurt may resume the innings; a batter who retires otherwise may only resume with the opposing captain\u2019s consent, per the Laws.',
      '(BCPL Playing Condition) Bouncer / short-pitched-delivery limits per over follow the published BCPL Playing Conditions.',
    ]},
    {n:8,icon:IcoCalendar,title:'Interruptions, Reduced Overs, Result, Tie & Super Over',items:[
      'Match interruptions: play may be suspended for weather, light, ground or safety reasons at the umpires\u2019 discretion.',
      '(BCPL Playing Condition) Rain / reduced-overs and revised-target calculations follow the recognised method adopted in the published BCPL Playing Conditions.',
      'Result calculation: the result is determined by runs scored, subject to any revised target and the minimum-overs requirement for a valid match.',
      'Tie & Super Over: where adopted, a tied match may be decided by a Super Over (or further Super Overs) per the Playing Conditions. (BCPL Playing Condition)',
      'Abandoned / no-result: a match that cannot reach a valid result is treated as no-result and dealt with under the points/regulations for the season.',
    ]},
    {n:9,icon:IcoList,title:'Points Table, Net Run Rate & Qualification',items:[
      '(BCPL Playing Condition) Points for a win, loss, tie and no-result, and standings, follow the published BCPL tournament regulations.',
      '(BCPL Playing Condition) Net Run Rate (or the adopted equivalent) is used as a standings/tie separator per the published method.',
      '(BCPL Playing Condition) Qualification for knockouts and the resolution of ties on points follow the published BCPL tournament regulations and tie-break order.',
    ]},
    {n:10,icon:IcoShield,title:'Equipment, Clothing, Ground, Pitch & Ball',items:[
      'Equipment: bats and equipment must comply with the applicable specifications in the Laws and any BCPL equipment guidance. (BCPL Playing Condition)',
      'Protective equipment: appropriate protective equipment must be worn where required; safety directions from officials must be followed.',
      'Clothing & branding: teams wear the designated BCPL kit; competing-league branding is not permitted. Clothing and branding rules follow the published BCPL guidance. (BCPL Playing Condition)',
      'Ground & pitch: the ground, boundary and pitch are prepared and adjudicated under the Laws and venue guidance.',
      'Ball & ball replacement: the match ball type and any ball-replacement procedure follow the Laws as modified by the published BCPL Playing Conditions. (BCPL Playing Condition)',
    ]},
    {n:11,icon:IcoScale,title:'Umpires, Decisions, Replays & Official Score',items:[
      'Umpires: match umpires are appointed by BCPL. The umpires are the sole judges of fair and unfair play during the match, subject to the Laws and Playing Conditions.',
      'Umpire decisions: an umpire\u2019s on-field decision is final except where a review/replay procedure is expressly available and invoked under the Playing Conditions.',
      '(BCPL Playing Condition) Availability of any decision-review, ball-tracking or replay technology — and the stages at which it applies, if at all — is set out in the published BCPL Playing Conditions. Such technology is not guaranteed to be available at every match.',
      'Scorers & official score: official scorers maintain the score; the official scorecard confirmed under the Playing Conditions is the record of the match.',
    ]},
    {n:12,icon:IcoBan,title:'Unfair Play, Player Conduct, Appeals, Discipline & Anti-Corruption',items:[
      'Unfair play: matters such as ball tampering, deliberate time-wasting and other unfair practices are dealt with under the Laws and Playing Conditions.',
      '(BCPL Playing Condition) Slow over-rate and time-wasting sanctions follow the published BCPL Playing Conditions.',
      <>Player conduct is governed by the BCPL <Link href="/code-of-conduct" style={{color:'#E8B23D',fontWeight:600}}>Code of Conduct</Link>, which applies its own internal offence levels and disciplinary process. BCPL does not claim ICC disciplinary jurisdiction.</>,
      'Protests & appeals: on-field appeals are decided by the umpires; any off-field protest or complaint follows the published BCPL process and timeline.',
      'Disciplinary process: alleged breaches are handled through the BCPL disciplinary process — report, evidence, notice, opportunity to respond, decision, sanction and appeal.',
      'Anti-corruption / anti-bribery: betting, match-fixing, spot-fixing, misuse of inside information and related corruption are strictly prohibited and dealt with under the applicable BCPL integrity rules.',
    ]},
    {n:13,icon:IcoPages,title:'Technical Committee, Force Majeure, Amendments & Version',items:[
      '(BCPL Playing Condition) A tournament / technical committee may rule on matters not expressly covered and on the interpretation of the Playing Conditions for the season.',
      'Force majeure: events beyond reasonable control may require suspension, rescheduling or other adjustment, handled under the published regulations.',
      'Rule amendments: BCPL may amend the Playing Conditions for the season through its published version workflow (reference update → operations/legal review → owner approval → new BCPL rulebook version → publish with effective date). External MCC/ICC updates do not automatically change live BCPL rules mid-season.',
      'Effective date & version: the effective date and version of these Playing Conditions are shown in the document header above.',
    ]},
  ];

  return (
    <div style={{background:'#1C2B47',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#F8F4EE',paddingBottom:80,overflowX:'hidden'}}>
      <style>{css}</style>
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
        <svg style={{position:'absolute',bottom:0,left:0,right:0,width:'100%',opacity:0.07}} viewBox="0 0 1440 400" preserveAspectRatio="none">
          <path d="M0,400 L0,200 Q360,80 720,80 Q1080,80 1440,200 L1440,400 Z" fill="#273E6E"/>
          <rect x="680" y="200" width="80" height="200" fill="#22375F"/>
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
            <div className="tag-pill" style={{marginBottom:20}}><IcoList size={14}/> OFFICIAL RULES</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,7vw,72px)',lineHeight:1.05,marginBottom:8}}>
              <span style={{color:'#fff',display:'block'}}>BCPL CRICKET</span>
              <span className="shimmer-gold" style={{display:'block'}}>RULEBOOK.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:13,fontWeight:600,letterSpacing:'0.05em',marginTop:16,fontFamily:'Montserrat,sans-serif'}}>Tournament Cricket Rules — Season 5</p>
            <p style={{color:'var(--ink-3)',fontSize:12,marginTop:6,fontFamily:'Inter,sans-serif'}}>यह दस्तावेज़ English में मान्य है · This document is authoritative in English.</p>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:600,margin:'16px auto 0'}}>
              The BCPL T20 tournament cricket rulebook. These rules govern competition matches and apply to players, team managers and officials at all match venues.
            </p>
          </div>
        </section>

        <div className="wrap" style={{maxWidth:900,margin:'0 auto',paddingBottom:40}}>

          <LegalDocHeader doc="rulebook" />

          <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7,margin:'0 0 20px',fontStyle:'italic'}}>
            This document applies to BCPL Season 5 unless expressly stated otherwise.
          </p>

          {/* KEY POINTS summary */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,28px) clamp(16px,4vw,32px)',marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <span style={{color:'#E8B23D',display:'inline-flex',alignItems:'center'}}><IcoList size={20}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#E8B23D'}}>Key Points</h2>
            </div>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:8}}>
              {[
                'BCPL matches follow the MCC Laws of Cricket, modified by the BCPL Playing Conditions; ICC Men\u2019s T20 principles are a reference only where expressly adopted.',
                'BCPL is an independent competition — not an ICC or International tournament.',
                'This page is a concise summary. The final published BCPL Playing Conditions and the pre-match briefing prevail.',
                'Items marked "(BCPL Playing Condition)" are BCPL-specific variations; concrete numbers are set in the published Playing Conditions.',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.65}}>
                  <OrangeDot/><span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cross-link: trial rules live on a separate page */}
          <div style={{background:'rgba(232,178,61,0.07)',border:'1px solid rgba(232,178,61,0.35)',borderLeft:'3px solid #E8B23D',borderRadius:16,padding:'16px clamp(16px,4vw,24px)',marginBottom:24,display:'flex',gap:12,alignItems:'flex-start'}}>
            <span style={{flexShrink:0,color:'#E8B23D',display:'inline-flex'}}><IcoStadium size={22}/></span>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
              This page covers tournament / competition cricket only. Looking for Phase 2 trial assessment rules? See <Link href="/trial-rules" style={{color:'#E8B23D',fontWeight:600}}>Physical Trial Rules</Link>.
            </p>
          </div>


          {/* Table of Contents */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,28px) clamp(16px,4vw,32px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.1s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <span style={{color:'#E8B23D',display:'inline-flex',alignItems:'center'}}><IcoPages size={20}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:18,color:'#E8B23D'}}>Table of Contents</h2>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:4}}>
              {toc.map(item=>(
                <button key={item.n} className="toc-link" onClick={()=>setActiveSection(item.n===activeSection?null:item.n)}>
                  <span style={{width:22,height:22,borderRadius:'50%',background:'rgba(255,122,41,0.2)',border:'1px solid rgba(255,122,41,0.4)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#FF7A29',flexShrink:0,fontFamily:'Montserrat,sans-serif'}}>{item.n}</span>
                  <span style={{display:'inline-flex',alignItems:'center',gap:8}}><span style={{color:'#FF7A29',display:'inline-flex'}}><item.icon size={16}/></span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rule Sections */}
          {rules.map((rule,idx)=>(
            <div key={rule.n} className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:`fadeSlide 0.5s ease ${0.1+idx*0.07}s both`,border:activeSection===rule.n?'1px solid rgba(255,122,41,0.5)':'1px solid rgba(255,255,255,0.18)',transition:'border-color 0.3s'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,flexWrap:'wrap'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,rgba(255,122,41,0.3),rgba(232,178,61,0.2))',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:14,color:'#FF7A29',flexShrink:0}}>{rule.n}</div>
                <span style={{color:'#FF7A29',display:'inline-flex',alignItems:'center'}}><rule.icon size={24}/></span>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>{rule.title}</h2>
              </div>
              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
                {rule.items.map((item,i)=>(
                  <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                    <OrangeDot/><span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Callout — foundation & hierarchy */}
          <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.4)',borderLeft:'3px solid #FF7A29',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20,animation:'borderGlow 3s ease-in-out infinite'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{flexShrink:0,color:'#FF7A29',display:'inline-flex'}}><IcoScale size={24}/></span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:6}}>Governing Foundation & Hierarchy</div>
                <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  BCPL matches are governed by the <strong style={{color:'#E8B23D'}}>MCC Laws of Cricket</strong>, as modified by the <strong style={{color:'#E8B23D'}}>BCPL Playing Conditions</strong>. Where expressly adopted, relevant <strong style={{color:'#E8B23D'}}>ICC Men&rsquo;s T20 playing-condition principles</strong> may be used as a reference framework. BCPL-specific conditions prevail for the BCPL competition where permitted. BCPL is an independent competition and is not an ICC or International tournament. In any situation not addressed here, the MCC Laws apply as the foundational Laws.
                </p>
              </div>
            </div>
          </div>

          {/* Version-control note (§25) */}
          <div style={{background:'rgba(232,178,61,0.07)',border:'1px solid rgba(232,178,61,0.35)',borderLeft:'3px solid #E8B23D',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{flexShrink:0,color:'#E8B23D',display:'inline-flex'}}><IcoPages size={24}/></span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#E8B23D',marginBottom:6}}>Reference Editions & Version Control</div>
                <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  MCC Laws of Cricket: <strong style={{color:'#E8B23D'}}>applicable edition adopted by BCPL</strong>. ICC Men&rsquo;s T20 playing-condition reference: <strong style={{color:'#E8B23D'}}>applicable reference edition adopted by BCPL</strong>.
                  {/* OWNER / COUNSEL DECISION REQUIRED: pin the exact MCC Laws edition (e.g. 3rd edition, 2017 Code as amended) and the exact ICC Men's T20 playing-conditions reference edition/date that BCPL Season 5 adopts. Do not auto-adopt external updates mid-season. */}
                  {' '}External rule updates do not automatically alter live BCPL rules; changes follow BCPL&rsquo;s versioned approval workflow before publication. Ruling on any matter not covered here is made by the BCPL tournament / technical committee and is final and binding under the published regulations.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px)',textAlign:'center'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,22px)',marginBottom:8}}>Ready to Play?</div>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:14,marginBottom:20}}>Register for BCPL T20 Season 5 — where corporate professionals become cricket legends.</p>
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
