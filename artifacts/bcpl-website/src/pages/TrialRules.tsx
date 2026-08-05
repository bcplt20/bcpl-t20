import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { LegalDocHeader } from '../lib/legalMeta';
import { IcoTarget, IcoTicket, IcoBat, IcoScale, IcoGauge, IcoEyeOff, IcoLock, IcoHourglass, IcoTrophy, IcoList, IcoBall, IcoZap, IcoShield, IcoStadium, IcoPages, IcoFlag } from '../lib/icons';

type IcoComp = (p: { size?: number; style?: React.CSSProperties }) => React.ReactElement;

/**
 * PHASE 2 — PHYSICAL TRIAL RULES (Season 5)
 *
 * Deliberately SEPARATE from the tournament Cricket Rulebook (/cricket-rulebook).
 * Plain-language summary of the standardised trial process. Wherever this page
 * and the final published BCPL trial rulebook differ, the final published
 * rulebook and the official trial-day briefing prevail — say so, everywhere.
 *
 * Wording rules honoured here (master spec parts P–AA):
 *  - no absolute promises ("identical deliveries", "no score can ever change")
 *  - no fixed public cutoff claims
 *  - Auction Pool = eligibility, never a guarantee of purchase/contract/salary
 *  - rubric weights shown as initial, versioned, finalised by Cricket Operations
 */

const OrangeDot = () => (
  <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#FF7A29',marginRight:10,flexShrink:0,marginTop:7}}/>
);

export function TrialRules() {
  const [activeSection,setActiveSection]=React.useState<number|null>(null);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    .wrap{max-width:1280px;margin:0 auto;padding:0 16px;}
    @media(min-width:640px){.wrap{padding:0 24px}}
    @media(min-width:768px){.wrap{padding:0 32px}}
    .btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;display:inline-flex;align-items:center;justify-content:center;min-height:44px;}
    .btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
    .glass-card{background:linear-gradient(135deg,rgba(30,55,105,0.9),rgba(23,43,81,0.85));backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.18);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.18);}
    .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
    .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
    .toc-link{color:rgba(255,255,255,0.88);text-decoration:none;font-size:13px;font-family:Inter,sans-serif;padding:8px 12px;border-radius:8px;display:flex;align-items:center;gap:8px;transition:all 0.2s;cursor:pointer;background:none;border:none;text-align:left;width:100%;min-height:44px;}
    .toc-link:hover{background:rgba(255,122,41,0.1);color:#FF7A29;}
    .rubric-grid{display:grid;grid-template-columns:1fr;gap:14px;}
    @media(min-width:768px){.rubric-grid{grid-template-columns:1fr 1fr;}}
    .rubric-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.18);font-size:13px;}
    .float-reg-btn{position:fixed;bottom:28px;right:28px;z-index:900;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;font-size:13px;letter-spacing:.06em;cursor:pointer;padding:14px 22px;text-transform:uppercase;text-decoration:none;display:flex;align-items:center;gap:8px;box-shadow:0 8px 32px rgba(255,122,41,0.45);clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);transition:opacity .2s,transform .15s;}
    .float-reg-btn:hover{opacity:.9;transform:translateY(-2px);}
    @media(max-width:1023px){.float-reg-btn{display:none!important;}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes borderGlow{0%,100%{border-color:rgba(255,122,41,0.3)}50%{border-color:rgba(255,122,41,0.8)}}
  `;

  const toc:{n:number;label:string;icon:IcoComp}[]=[
    {n:1,label:'Purpose & Scope',icon:IcoTarget},
    {n:2,label:'Before You Arrive',icon:IcoPages},
    {n:3,label:'Check-in, QR Pass & ID',icon:IcoTicket},
    {n:4,label:'Reporting, Late Arrival & Wristband',icon:IcoHourglass},
    {n:5,label:'The Six-Attempt Rule',icon:IcoBat},
    {n:6,label:'Standardised Assessment',icon:IcoScale},
    {n:7,label:'Scoring Disclosure (out of 100)',icon:IcoGauge},
    {n:8,label:'Blind Assessment',icon:IcoEyeOff},
    {n:9,label:'Locked Digital Scoring',icon:IcoLock},
    {n:10,label:'Coach & Staff Authority',icon:IcoShield},
    {n:11,label:'Results & National Ranking',icon:IcoHourglass},
    {n:12,label:'Auction Pool Meaning',icon:IcoTrophy},
    {n:13,label:'Conduct, Safety & Equipment',icon:IcoList},
    {n:14,label:'Weather, Emergencies & Re-trials',icon:IcoFlag},
  ];

  const sections:{n:number;icon:IcoComp;title:string;items:React.ReactNode[]}[]=[
    {n:1,icon:IcoTarget,title:'Purpose & Scope',items:[
      'The Phase 2 Physical Trial is a standardised, role-specific on-ground assessment for players who qualified in Phase 1 and completed Phase 2 registration and payment.',
      'Its purpose is to assess current cricket skill under a consistent, published framework — not reputation, contacts or recommendations.',
      <>This document is separate from the <Link href="/cricket-rulebook" style={{color:'#E8B23D',fontWeight:600}}>BCPL Cricket Rulebook</Link>, which governs tournament matches. Trial rules govern trial day only.</>,
      'This page is a plain-language summary. The final published BCPL trial rulebook and the official trial-day briefing prevail over this summary wherever they differ.',
    ]},
    {n:2,icon:IcoPages,title:'Before You Arrive: Slot, Venue & Documents',items:[
      'Your trial city, venue, date, slot date and reporting time appear on your player dashboard once your slot is allotted. Attend only the venue, date and slot allotted to you.',
      'You must attend at the venue, on the date and in the batch/slot allotted to you. Attending an unallotted venue, date or slot, or seeking entry to another player\u2019s slot, is not permitted.',
      'Carry your original government photo ID (for example your Aadhaar card) matching the identity details in your registration/KYC.',
      'Complete any documentation or verification requested before or at check-in. Incomplete or inconsistent documentation may prevent your trial being conducted.',
      'Dress for cricket assessment and bring your own required personal kit as advised in the trial-day briefing.',
    ]},
    {n:3,icon:IcoTicket,title:'Check-in, QR Trial Pass & Identity Verification',items:[
      <>Check-in requires your <Link href="/trial-pass" style={{color:'#E8B23D',fontWeight:600}}>QR Trial Pass</Link> (available on your dashboard) plus a valid government photo ID consistent with your registration/KYC details.</>,
      'At the gate, your QR Trial Pass is scanned by authorised staff for check-in. Check-in is recorded once per player and is duplicate-proof — a player cannot be checked in twice.',
      'Identity is verified against your registration/KYC details. If your identity cannot be verified, or the details do not match, your trial may not be conducted.',
      'No unauthorised entry: only checked-in players, authorised staff and authorised officials may enter the assessment area. Do not bring unauthorised persons onto the ground.',
      <>If your QR Trial Pass does not scan, do not leave — approach check-in staff, who follow an authorised manual verification process. If a genuine issue remains, email <strong style={{color:'#E8B23D'}}>support@bcplt20.com</strong> with your Registration Number.</>,
    ]},
    {n:4,icon:IcoHourglass,title:'Reporting Time, Late Arrival, Wristband & Warm-up',items:[
      'Report before the reporting time shown on your dashboard and Trial Pass. Reporting time is earlier than your actual assessment turn, to allow check-in and briefing.',
      'Late arrival may mean losing your slot, subject to the venue schedule of the day. Where a batch has already progressed, a late player may not be accommodated. There is no guaranteed re-slotting for late arrival.',
      'After check-in you may be issued a wristband or ground identifier. Keep it on and visible for the duration of your time on the ground; it confirms you are a checked-in, verified player.',
      'Move to the warm-up / holding area as directed and remain there until called. Warm up responsibly; do not enter the assessment zone until instructed.',
      'Follow all instructions from check-in staff, ground staff and officials, including in warm-up and holding areas.',
    ]},
    {n:5,icon:IcoBat,title:'The Six-Attempt Rule (Role-Specific Format)',items:[
      'BATSMAN — 6 valid batting assessment deliveries under the standardised Season 5 protocol.',
      'BOWLER — 6 authorised bowling attempts under the standardised Season 5 protocol.',
      'ALL-ROUNDER — 6 valid batting deliveries + 6 bowling attempts + an approved fielding / athletic component.',
      'WICKETKEEPER — a standardised wicketkeeping assessment + 6 valid batting deliveries.',
      'All players in the same session/category should receive the same approved attempt structure, subject only to documented technical or medical exceptions.',
      'No discretionary extra attempts: coaches and evaluators cannot grant additional valid attempts at their own discretion. The approved attempt count is fixed for everyone in the category.',
      'Feeder-error / technical interruption (batting): if an authorised feeder delivery is clearly unusable, or a genuine technical interruption occurs, authorised officials may mark it FEEDER ERROR / RE-BOWL. Such a delivery does not count toward the six valid batting deliveries and is not a discretionary favour.',
      'No-ball / interruption (bowling): the six bowling attempts form part of the assessment. Outcomes are recorded per the approved BCPL trial protocol; only genuine technical interruptions are handled through the authorised re-attempt process, not routine poor execution.',
    ]},
    {n:6,icon:IcoScale,title:'Standardised Assessment Framework (Reasonable Variation)',items:[
      'BCPL seeks to use the same published role-specific assessment framework, scoring structure and attempt rules across authorised Phase 2 venues and sessions.',
      'For batsmen, BCPL may use trained feeders (for example sidearm/throwdown or bowling feeders) to provide a more standardised batting assessment, so your batting assessment does not depend on the quality of another trial candidate bowling to you.',
      'BCPL does not promise any specific mix of pace or spin, or that every environmental condition, pitch, surface, weather or feeder delivery will be physically identical across venues and sessions. This is a standardised assessment protocol with reasonable variation in delivery types and conditions — not identical physical conditions.',
      'The exact delivery protocol for the season is published by BCPL and confirmed in the official trial-day briefing before assessment.',
      'Bowlers bowl at marked line/length target areas where applicable — not at a trial batsman — so a batsman\u2019s skill never affects a bowler\u2019s score.',
      'Bowling speed figures are used only where validated speed-measurement equipment is actually in operation at the venue; speed is not guaranteed to be measured everywhere.',
    ]},
    {n:7,icon:IcoGauge,title:'Scoring Disclosure — Scored Out of 100',items:[
      'Each role is assessed against role-specific criteria and the resulting assessment is expressed as a score out of 100.',
      'BATSMAN — assessed on technique, footwork, timing, shot selection, fitness and fielding, with an overall assessment.',
      'BOWLER — assessed on run-up & action, control, pace or spin, variation, fitness and fielding, with an overall assessment.',
      'ALL-ROUNDER — assessed on batting, bowling, fitness and fielding, with an overall assessment. Configurable minimum batting and bowling component expectations may apply.',
      'WICKETKEEPER — assessed on keeping, movement, hands (collection/receiving), stumping and a batting component, with an overall assessment.',
      'Raw marks and criterion-level scores may be retained for audit and integrity review.',
      'There is no fixed public score cutoff, and a specific number (for example 95) does not by itself guarantee advancement. Final advancement may depend on national merit ranking, role requirements, regional/zone representation, minimum quality standards and other published rules.',
      'Final cutoffs emerge only after completion of the applicable national trial population for the season; they are not published in advance.',
    ]},
    {n:8,icon:IcoEyeOff,title:'Blind Assessment',items:[
      'Where operationally implemented, physical-trial evaluators are not required to see unnecessary personal information or previous Phase 1 scoring while assessing the player\u2019s cricket performance.',
      'Evaluators receive only the information necessary to score cricket performance — for example your Trial Number / Registration Number and your role — and are not shown unnecessary personal details, Phase 1 scores or auction/selection status.',
      'This is a deliberate integrity feature: scores reflect cricket on the day, nothing else.',
      'You do not have access to other players\u2019 scores, and other players do not have access to yours. Individual scores are not displayed on the ground.',
    ]},
    {n:9,icon:IcoLock,title:'Digital, Locked Scoring',items:[
      'Physical-trial scores are recorded digitally at the venue by authorised assessors against the applicable role-specific rubric.',
      'Once an assessment is submitted, evaluators cannot freely edit the submitted final assessment; a submitted assessment is locked.',
      'Any authorised correction (for example a genuine data-entry error) must follow an audited process — never informal edits.',
      'No result is declared on the ground. Evaluators score performance; they do not announce or decide final selection at the venue.',
    ]},
    {n:10,icon:IcoShield,title:'Coach, Evaluator & Staff Authority',items:[
      'Authorised coaches, evaluators, check-in staff, scanner operators and ground staff manage the trial. Their instructions on the ground must be followed at all times.',
      'Coach/evaluator authority is limited to conducting and scoring the assessment under the published protocol; it does not extend to granting extra attempts or promising outcomes.',
      'No selection promises are made at the venue by any coach, evaluator or staff member. Any verbal comment on the ground is not a selection decision and is not binding.',
      'No bribery, inducement, favour or pressure toward any coach, evaluator, official or staff member is permitted. Any such attempt is a serious integrity breach and may lead to disqualification.',
    ]},
    {n:11,icon:IcoHourglass,title:'Results, National Ranking & Tie-breaks',items:[
      'After completing your physical trial, your assessment is recorded. Advancement results may be finalised after completion of the applicable BCPL trial window so eligible candidates can be ranked under the applicable season rules.',
      'No final result is declared at the venue on trial day, and completing your trial does not by itself mean you have been selected. After your slot, your dashboard shows PHYSICAL TRIAL COMPLETED ✓ — your assessment has been securely recorded (result-pending state).',
      'Your status then shows Final Selection Pending / National Ranking Pending until the applicable BCPL physical-trial window and ranking process are complete.',
      'BCPL may apply published playing-role allocations, regional/zone representation requirements, minimum assessment standards, national merit ranking and applicable tie-break rules when determining advancement to the Auction Pool for the relevant season.',
      'There is no fixed public score cutoff. Final advancement depends on validated scores, role ranking, published allocations, minimum quality thresholds, regional/national rules and applicable tie-break criteria — determined after the applicable trial dataset is complete.',
      'Tie-breaking follows a deterministic published policy before final result release. Ties are never resolved by random or manual preference.',
    ]},
    {n:12,icon:IcoTrophy,title:'What Auction Pool Qualification Means',items:[
      'Qualification for the BCPL Auction Pool means eligibility to enter the applicable Player Auction process. Auction Pool qualification does not guarantee Team Purchase, a player contract, remuneration, squad selection or Tournament Participation.',
      'Payment of Phase 1 or Phase 2 fees does not guarantee qualification, Final Selection, Auction Pool entry, auction purchase, team allocation, a player contract, remuneration or Tournament Participation.',
      'Franchise bidding decisions belong to the franchises and are made only at the Player Auction. BCPL runs the process; it does not promise outcomes.',
    ]},
    {n:13,icon:IcoList,title:'Conduct, Safety, Equipment & Clothing',items:[
      <>Player conduct at trials is governed by the <Link href="/code-of-conduct" style={{color:'#E8B23D',fontWeight:600}}>Code of Conduct</Link>. Misconduct, abuse of officials, unfair means or attempts to manipulate the process can lead to disqualification under the published disciplinary process.</>,
      'Medical & fitness responsibility: you are responsible for confirming you are medically fit to undertake physical cricket activity. Inform trial staff of any injury, condition or limitation before participating. Participate at your own risk within the safety directions given.',
      'Injury / unsafe conditions: if you are injured or conditions are unsafe, stop and inform staff. Follow first-response and safety directions from staff.',
      'Equipment: use the protective equipment required for your drill (for example helmet and pads where instructed). BCPL-approved or venue-provided equipment may be used where relevant; follow the trial-day equipment guidance.',
      'Clothing: wear appropriate cricket clothing and footwear as advised. Follow any clothing/branding guidance in the trial-day briefing.',
      'Photography / video: BCPL and authorised persons may photograph and record trials for assessment, integrity, operational and promotional purposes. Do not obstruct official recording. Player photography/filming of the ground, other players or officials may be restricted per venue rules.',
    ]},
    {n:14,icon:IcoFlag,title:'Weather, Emergencies, Absence & Technical Re-trials',items:[
      'Weather / venue disruption: trials may be paused, rescheduled or moved due to weather, ground conditions or operational reasons. Follow the updated instructions issued for your slot; a disruption outside your control does not by itself invalidate the process.',
      'Emergency instructions: in the event of an emergency or an instruction to evacuate, follow staff directions and marshals immediately, move calmly to the designated assembly area, and do not re-enter until cleared.',
      'Completion scan: your completion is recorded at the venue and reflected on your dashboard as PHYSICAL TRIAL COMPLETED ✓. Trial duplication is prevented — a player cannot be assessed twice for the same cycle.',
      <>Absence / no-show: missing your allotted slot without an approved reschedule means your trial is not completed. Fee treatment follows the <Link href="/refunds" style={{color:'#E8B23D',fontWeight:600}}>Refund & Cancellation Policy</Link>.</>,
      'Technical re-trial: if a genuine technical failure at the venue (for example equipment or recording failure) prevents a valid assessment, BCPL may authorise a re-trial of the affected component through the audited process. This is not a discretionary extra attempt for performance reasons.',
      <>Grievance: if you believe a trial-day process error affected your assessment, raise it through the reporting channel below and the <Link href="/contact" style={{color:'#E8B23D',fontWeight:600}}>official support channel</Link>. This covers process errors, not disagreement with an evaluator\u2019s cricket judgement.</>,
    ]},
  ];

  const rubrics:{role:string;icon:IcoComp;total:string;cats:string[];note:string}[]=[
    {role:'BATSMAN',icon:IcoBat,total:'out of 100',cats:['Technique','Footwork','Timing','Shot selection','Fitness','Fielding','Overall'],note:'Role-specific criteria assessed and expressed as a score out of 100. Detailed criteria weighting is finalised by BCPL Cricket Operations; the final published trial rulebook carries the definitive version.'},
    {role:'BOWLER',icon:IcoBall,total:'out of 100',cats:['Run-up & action','Control','Pace or spin','Variation','Fitness','Fielding','Overall'],note:'Role-specific criteria assessed and expressed as a score out of 100. Detailed criteria weighting is finalised by BCPL Cricket Operations; the final published trial rulebook carries the definitive version.'},
    {role:'ALL-ROUNDER',icon:IcoZap,total:'out of 100',cats:['Batting','Bowling','Fitness','Fielding','Overall'],note:'Configurable minimum batting and bowling component expectations may apply. Detailed criteria weighting is finalised by BCPL Cricket Operations; the final published trial rulebook carries the definitive version.'},
    {role:'WICKETKEEPER',icon:IcoShield,total:'out of 100',cats:['Keeping','Movement','Hands (collection)','Stumping','Batting','Fitness','Overall'],note:'The wicketkeeping assessment is standardised for all wicketkeeper candidates. Detailed criteria weighting is finalised by BCPL Cricket Operations; the final published trial rulebook carries the definitive version.'},
  ];

  return (
    <div style={{background:'#1C2B47',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#F8F4EE',paddingBottom:80,overflowX:'hidden'}}>
      <style>{css}</style>
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <SiteHeader />

        <section style={{padding:'clamp(40px,8vw,72px) 0 40px',textAlign:'center',animation:'fadeSlide 0.6s ease both'}}>
          <div className="wrap">
            <div className="tag-pill" style={{marginBottom:20}}><IcoStadium size={14}/> OFFICIAL TRIAL RULES</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,7vw,72px)',lineHeight:1.05,marginBottom:8}}>
              <span style={{color:'#fff',display:'block'}}>PHASE 2 — PHYSICAL</span>
              <span className="shimmer-gold" style={{display:'block'}}>TRIAL RULES.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:13,fontWeight:600,letterSpacing:'0.05em',marginTop:16,fontFamily:'Montserrat,sans-serif'}}>Season 5 · Summary of the standardised trial process</p>
            <p style={{color:'var(--ink-3)',fontSize:12,marginTop:6,fontFamily:'Inter,sans-serif'}}>यह दस्तावेज़ English में मान्य है · This document is authoritative in English.</p>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:640,margin:'16px auto 0'}}>
              How the BCPL physical trial works: your attempts, how scoring happens, what evaluators see, when results come, and exactly what Auction Pool qualification does — and does not — mean.
            </p>
          </div>
        </section>

        <div className="wrap" style={{maxWidth:900,margin:'0 auto',paddingBottom:40}}>

          <LegalDocHeader doc="trialRules" />

          <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7,margin:'0 0 20px',fontStyle:'italic'}}>
            This document applies to BCPL Season 5 unless expressly stated otherwise.
          </p>

          {/* KEY POINTS summary */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,28px) clamp(16px,4vw,32px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.08s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <span style={{color:'#E8B23D',display:'inline-flex',alignItems:'center'}}><IcoTarget size={20}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#E8B23D'}}>Key Points</h2>
            </div>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:8}}>
              {[
                'Bring your QR Trial Pass and original government photo ID matching your registration. Report before your reporting time.',
                'Everyone in a category gets the same fixed attempt structure: Batsman 6 valid deliveries, Bowler 6 attempts, All-Rounder 6+6+fielding, Wicketkeeper keeping assessment + 6 deliveries.',
                'No discretionary extra attempts. Only genuine feeder errors or technical interruptions are re-done through an audited process.',
                'You are assessed on role-specific criteria and given a score out of 100. There is no fixed public cutoff, and no result is declared at the venue.',
                'Completing the trial does not mean selection. Auction Pool qualification is decided centrally after the national trial window — and never guarantees Team Purchase, a contract or Tournament Participation.',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.65}}>
                  <OrangeDot/><span>{item}</span>
                </li>
              ))}
            </ul>
          </div>


          {/* Table of Contents */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,28px) clamp(16px,4vw,32px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.1s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <span style={{color:'#E8B23D',display:'inline-flex',alignItems:'center'}}><IcoPages size={20}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:18,color:'#E8B23D'}}>Table of Contents</h2>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:4}}>
              {toc.map(item=>(
                <button key={item.n} className="toc-link" onClick={()=>setActiveSection(item.n===activeSection?null:item.n)}>
                  <span style={{width:22,height:22,borderRadius:'50%',background:'rgba(255,122,41,0.2)',border:'1px solid rgba(255,122,41,0.4)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#FF7A29',flexShrink:0,fontFamily:'Montserrat,sans-serif'}}>{item.n}</span>
                  <span style={{display:'inline-flex',alignItems:'center',gap:8}}><span style={{color:'#FF7A29',display:'inline-flex'}}><item.icon size={16}/></span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          {sections.map((sec,idx)=>(
            <div key={sec.n} className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:`fadeSlide 0.5s ease ${0.1+idx*0.06}s both`,border:activeSection===sec.n?'1px solid rgba(255,122,41,0.5)':'1px solid rgba(255,255,255,0.18)',transition:'border-color 0.3s'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,flexWrap:'wrap'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,rgba(255,122,41,0.3),rgba(232,178,61,0.2))',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:14,color:'#FF7A29',flexShrink:0}}>{sec.n}</div>
                <span style={{color:'#FF7A29',display:'inline-flex',alignItems:'center'}}><sec.icon size={24}/></span>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>{sec.title}</h2>
              </div>
              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
                {sec.items.map((item,i)=>(
                  <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                    <OrangeDot/><span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Rubric cards live inside the scoring-disclosure section */}
              {sec.n===7 && (
                <div className="rubric-grid" style={{marginTop:18}}>
                  {rubrics.map(r=>(
                    <div key={r.role} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:14,padding:'16px 18px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                        <span style={{color:'#E8B23D',display:'inline-flex',alignItems:'center'}}><r.icon size={20}/></span>
                        <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#E8B23D',letterSpacing:'.04em'}}>{r.role}</span>
                        <span style={{marginLeft:'auto',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:12,color:'var(--ink-3)'}}>/ 100</span>
                      </div>
                      {r.cats.map(k=>(
                        <div key={k} className="rubric-row">
                          <span style={{color:'rgba(255,255,255,0.88)'}}>{k}</span>
                          <span style={{color:'var(--ink-3)',fontWeight:700,flexShrink:0,fontSize:11}}>criterion</span>
                        </div>
                      ))}
                      <p style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.6,marginTop:10}}>{r.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Authority callout */}
          <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.4)',borderLeft:'3px solid #FF7A29',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20,animation:'borderGlow 3s ease-in-out infinite'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{flexShrink:0,color:'#FF7A29',display:'inline-flex'}}><IcoScale size={24}/></span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:6}}>The Final Published Rulebook Prevails</div>
                <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  This page is a plain-language summary of the BCPL physical-trial process. The <strong style={{color:'#E8B23D'}}>final published BCPL trial rulebook</strong>, official trial-day briefing and published season rules prevail over this summary wherever they differ. Rubric weights, delivery protocols, allocations and tie-break criteria are versioned and finalised by BCPL Cricket Operations before trials.
                </p>
              </div>
            </div>
          </div>

          {/* Trial process complaint callout */}
          <div style={{background:'rgba(232,178,61,0.07)',border:'1px solid rgba(232,178,61,0.35)',borderLeft:'3px solid #E8B23D',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{flexShrink:0,color:'#E8B23D',display:'inline-flex'}}><IcoFlag size={24}/></span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#E8B23D',marginBottom:6}}>Report a Trial Process Issue</div>
                <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  If you believe a trial-day process error affected your assessment — attempt count, an unmarked feeder error, check-in or identity issues — email <strong style={{color:'#E8B23D'}}>support@bcplt20.com</strong> within 48 hours of your slot with your Registration Number, trial city, slot time and a short description. Procedural complaints are reviewed through an audited process; this covers process errors, not disagreement with an evaluator's cricket judgement.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px)',textAlign:'center'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,22px)',marginBottom:8}}>Know the process. Then own it.</div>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:14,marginBottom:20}}>Phase 1 is open — register, submit your cricket video and take your shot at the BCPL stage.</p>
            <Link href="/register" className="btn-fire" style={{padding:'14px 36px',fontSize:16,width:'100%',maxWidth:300,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>Register for Phase 1 →</Link>
          </div>
        </div>

        <BCPLFooter />
      </div>
      <StickyRegisterCTA />
      <Link className='float-reg-btn' href='/register' style={{textDecoration:'none'}}>REGISTER NOW →</Link>
    </div>
  );
}
