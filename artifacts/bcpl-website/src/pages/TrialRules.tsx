import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';

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
    .glass-card{background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85));backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.09);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06);}
    .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
    .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
    .toc-link{color:rgba(255,255,255,0.7);text-decoration:none;font-size:13px;font-family:Inter,sans-serif;padding:8px 12px;border-radius:8px;display:flex;align-items:center;gap:8px;transition:all 0.2s;cursor:pointer;background:none;border:none;text-align:left;width:100%;min-height:44px;}
    .toc-link:hover{background:rgba(255,122,41,0.1);color:#FF7A29;}
    .rubric-grid{display:grid;grid-template-columns:1fr;gap:14px;}
    @media(min-width:768px){.rubric-grid{grid-template-columns:1fr 1fr;}}
    .rubric-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;}
    .float-reg-btn{position:fixed;bottom:28px;right:28px;z-index:900;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;font-size:13px;letter-spacing:.06em;cursor:pointer;padding:14px 22px;text-transform:uppercase;text-decoration:none;display:flex;align-items:center;gap:8px;box-shadow:0 8px 32px rgba(255,122,41,0.45);clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);transition:opacity .2s,transform .15s;}
    .float-reg-btn:hover{opacity:.9;transform:translateY(-2px);}
    @media(max-width:1023px){.float-reg-btn{display:none!important;}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes borderGlow{0%,100%{border-color:rgba(255,122,41,0.3)}50%{border-color:rgba(255,122,41,0.8)}}
  `;

  const toc=[
    {n:1,label:'Purpose & Scope',icon:'🎯'},
    {n:2,label:'Trial Day & QR Pass',icon:'🎫'},
    {n:3,label:'The Six-Attempt Rule',icon:'🏏'},
    {n:4,label:'Standardised Assessment',icon:'⚖️'},
    {n:5,label:'100-Point Scoring',icon:'💯'},
    {n:6,label:'Blind Assessment',icon:'🕶️'},
    {n:7,label:'Locked Digital Scoring',icon:'🔒'},
    {n:8,label:'Results & Ranking',icon:'⏳'},
    {n:9,label:'Auction Pool Meaning',icon:'🏆'},
    {n:10,label:'Conduct, Safety & Re-trials',icon:'📋'},
  ];

  const sections:{n:number;icon:string;title:string;items:React.ReactNode[]}[]=[
    {n:1,icon:'🎯',title:'Purpose & Scope',items:[
      'The Phase 2 Physical Trial is a standardised, role-specific on-ground assessment for players who cleared Phase 1 and completed Phase 2 registration.',
      'Its purpose is to assess current cricket skill under a consistent, published framework — not reputation, contacts or recommendations.',
      <>This document is separate from the <Link href="/cricket-rulebook" style={{color:'#E8B23D',fontWeight:600}}>BCPL Cricket Rulebook</Link>, which governs tournament matches. Trial rules govern trial day only.</>,
      'This page is a plain-language summary. The final published BCPL trial rulebook and the official trial-day briefing prevail over this summary wherever they differ.',
    ]},
    {n:2,icon:'🎫',title:'Trial Day: Slots, Check-in & QR Trial Pass',items:[
      'Trials run in scheduled city slots. Your trial city, venue, date and slot time appear on your player dashboard once allotted.',
      <>Check-in requires your <Link href="/trial-pass" style={{color:'#E8B23D',fontWeight:600}}>QR Trial Pass</Link> (available on your dashboard) plus a valid government photo ID consistent with your KYC details.</>,
      'Arrive before your slot time. Late arrival may mean losing your slot, subject to the venue schedule of the day.',
      'Follow check-in staff and ground staff instructions at all times, including in warm-up areas.',
    ]},
    {n:3,icon:'🏏',title:'The Six-Attempt Rule',items:[
      'BATSMAN — 6 valid assessment deliveries.',
      'BOWLER — 6 bowling attempts.',
      'ALL-ROUNDER — 6 valid batting deliveries + 6 bowling attempts.',
      'WICKETKEEPER — standardised keeping drill + 6 valid batting deliveries.',
      'Feeder-error rule (batting): if a delivery is clearly unusable due to a feeder error, authorised officials may mark it FEEDER ERROR / RE-BOWL. That delivery does not count as one of your six valid deliveries. Coaches cannot casually grant extra balls outside this rule.',
      'Bowling attempts: a wide, no-ball or poor delivery normally still counts as one of your six attempts — it reflects your own execution — subject to the final published trial rulebook.',
    ]},
    {n:4,icon:'⚖️',title:'Standardised Assessment Framework',items:[
      'Your batting assessment should not depend on the quality of another trial candidate bowling to you. Batting deliveries come through a standardised delivery framework operated by trained feeders (which may include sidearm and spin feeders).',
      'Initial assessment concept for batting: 3 pace-style deliveries + 3 spin-style deliveries. The exact delivery protocol is published by BCPL before trials.',
      'Delivery conditions are standardised as far as practical across venues; BCPL does not claim mathematically identical speed or trajectory for every delivery at every venue.',
      'Bowlers bowl at marked line/length target zones — not at a trial batsman — so a batsman\u2019s skill never affects a bowler\u2019s score.',
      'Bowling attempt outcomes are recorded per the approved scoring rubric (for example TARGET HIT / NEAR TARGET / MISS).',
      'Bowling speed figures are used only where validated speed-measurement equipment is actually in operation at the venue.',
    ]},
    {n:5,icon:'💯',title:'100-Point Scoring Rubrics (Initial Structure)',items:[
      'Every role is scored out of 100 points under a versioned rubric maintained in BCPL\u2019s scoring system. The initial structures are below; exact weights are finalised by BCPL Cricket Operations and the final published trial rulebook carries the definitive version.',
    ]},
    {n:6,icon:'🕶️',title:'Blind Assessment',items:[
      'Where operationally implemented, trial evaluators receive only the information necessary to assess cricket performance: your Trial Number / Registration Number and your role.',
      'Evaluators do not see: your full name, phone, email, employer, Phase 1 score, Phase 1 rank, projected cutoffs, or any auction/selection status.',
      'This is a deliberate integrity feature: scores are for cricket on the day, nothing else.',
    ]},
    {n:7,icon:'🔒',title:'Digital, Locked Scoring',items:[
      'Physical-trial scores are recorded digitally at the venue.',
      'Once an evaluator submits an assessment, normal evaluator editing is locked.',
      'Genuine technical corrections (for example a data-entry error) are only possible through an authorised, audited correction process — never by informal edits.',
    ]},
    {n:8,icon:'⏳',title:'Results, National Ranking & Tie-breaks',items:[
      'Results are not announced at the venue on trial day. After your slot, your dashboard shows PHYSICAL TRIAL COMPLETED ✓ — your assessment has been securely recorded.',
      'Your status then shows NATIONAL RANKING PENDING until the applicable BCPL physical-trial window and ranking process are complete.',
      'BCPL may apply published playing-role allocations, regional representation requirements, minimum assessment standards and national merit ranking when creating the Auction Pool for the applicable season.',
      'There is no fixed public score cutoff (for example \u201c95+ automatically qualifies\u201d). The final cutoff is determined after the applicable trial dataset is complete, based on validated scores, role ranking, published allocations and minimum quality thresholds.',
      'Tie-breaking follows a deterministic published policy before final result release — for example: higher role-core score, then higher objective-attempt score, then higher applicable consistency score, then further published criteria. Ties are never resolved by random or manual preference.',
    ]},
    {n:9,icon:'🏆',title:'What Auction Pool Qualification Means',items:[
      'Auction Pool qualification means eligibility to enter the applicable BCPL auction process. That is all it means.',
      'It does NOT guarantee: purchase by a team, a player contract, salary or remuneration, a final squad place, or any tournament appearance.',
      'Franchise bidding decisions belong to the franchises. BCPL runs the process; it does not promise outcomes.',
    ]},
    {n:10,icon:'📋',title:'Conduct, Safety, Absence & Technical Re-trials',items:[
      <>Player conduct at trials is governed by the <Link href="/code-of-conduct" style={{color:'#E8B23D',fontWeight:600}}>Code of Conduct</Link>. Misconduct, abuse of officials or unfair means can lead to disqualification under the published process.</>,
      'Safety first: use the protective equipment required for your drill, follow venue safety directions, and inform trial staff of any injury or medical condition before participating.',
      <>Absence: missing your scheduled slot without an approved reschedule means your trial is not completed. Fee treatment in that case follows the <Link href="/refunds" style={{color:'#E8B23D',fontWeight:600}}>Refund Policy</Link>.</>,
      'Technical re-trial: if a technical failure at the venue (for example equipment or recording failure) prevents a valid assessment, BCPL may authorise a re-trial of the affected component through the audited process.',
    ]},
  ];

  const rubrics=[
    {role:'BATSMAN',icon:'🏏',rows:[['Objective attempt performance',40],['Coach technical assessment',55],['Fielding',5]],note:'Technical areas may include balance, footwork, timing, shot execution, shot selection.'},
    {role:'BOWLER',icon:'🎳',rows:[['Accuracy / attempt performance',45],['Coach technical assessment',50],['Fielding',5]],note:'Technical areas may include action & rhythm, line/length quality, control, variation.'},
    {role:'ALL-ROUNDER',icon:'⚡',rows:[['Batting',40],['Bowling',40],['Fielding',10],['Consistency / readiness',10]],note:'Configurable minimum batting and bowling component requirements may apply.'},
    {role:'WICKETKEEPER',icon:'🧤',rows:[['Collection',20],['Footwork',15],['Catching',15],['Stumping',15],['Throwing',10],['Positioning',10],['Batting',10],['Athleticism',5]],note:'Keeping drill is standardised for all wicketkeeper candidates.'},
  ];

  return (
    <div style={{background:'#060E1C',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#F8F4EE',paddingBottom:80,overflowX:'hidden'}}>
      <style>{css}</style>
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <SiteHeader />

        <section style={{padding:'clamp(40px,8vw,72px) 0 40px',textAlign:'center',animation:'fadeSlide 0.6s ease both'}}>
          <div className="wrap">
            <div className="tag-pill" style={{marginBottom:20}}>🏟 OFFICIAL TRIAL RULES</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,7vw,72px)',lineHeight:1.05,marginBottom:8}}>
              <span style={{color:'#fff',display:'block'}}>PHASE 2 — PHYSICAL</span>
              <span className="shimmer-gold" style={{display:'block'}}>TRIAL RULES.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,fontWeight:600,letterSpacing:'0.05em',marginTop:16,fontFamily:'Montserrat,sans-serif'}}>Season 5 · Summary of the standardised trial process</p>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:12,marginTop:6,fontFamily:'Inter,sans-serif'}}>यह दस्तावेज़ English में मान्य है · This document is authoritative in English.</p>
            <p style={{color:'rgba(255,255,255,0.65)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:640,margin:'16px auto 0'}}>
              How the BCPL physical trial works: your attempts, how scoring happens, what evaluators see, when results come, and exactly what Auction Pool qualification does — and does not — mean.
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
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:4}}>
              {toc.map(item=>(
                <button key={item.n} className="toc-link" onClick={()=>setActiveSection(item.n===activeSection?null:item.n)}>
                  <span style={{width:22,height:22,borderRadius:'50%',background:'rgba(255,122,41,0.2)',border:'1px solid rgba(255,122,41,0.4)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#FF7A29',flexShrink:0,fontFamily:'Montserrat,sans-serif'}}>{item.n}</span>
                  <span>{item.icon} {item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          {sections.map((sec,idx)=>(
            <div key={sec.n} className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:`fadeSlide 0.5s ease ${0.1+idx*0.06}s both`,border:activeSection===sec.n?'1px solid rgba(255,122,41,0.5)':'1px solid rgba(255,255,255,0.09)',transition:'border-color 0.3s'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,flexWrap:'wrap'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,rgba(255,122,41,0.3),rgba(232,178,61,0.2))',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:14,color:'#FF7A29',flexShrink:0}}>{sec.n}</div>
                <span style={{fontSize:24}}>{sec.icon}</span>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>{sec.title}</h2>
              </div>
              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
                {sec.items.map((item,i)=>(
                  <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.75)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                    <OrangeDot/><span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Rubric cards live inside section 5 */}
              {sec.n===5 && (
                <div className="rubric-grid" style={{marginTop:18}}>
                  {rubrics.map(r=>(
                    <div key={r.role} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'16px 18px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                        <span style={{fontSize:18}}>{r.icon}</span>
                        <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#E8B23D',letterSpacing:'.04em'}}>{r.role}</span>
                        <span style={{marginLeft:'auto',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:12,color:'rgba(255,255,255,0.4)'}}>/ 100</span>
                      </div>
                      {r.rows.map(([k,v])=>(
                        <div key={String(k)} className="rubric-row">
                          <span style={{color:'rgba(255,255,255,0.65)'}}>{k}</span>
                          <span style={{color:'#fff',fontWeight:700,flexShrink:0}}>{v}</span>
                        </div>
                      ))}
                      <p style={{fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.6,marginTop:10}}>{r.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Authority callout */}
          <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.4)',borderLeft:'3px solid #FF7A29',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20,animation:'borderGlow 3s ease-in-out infinite'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{fontSize:24,flexShrink:0}}>⚖️</span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:6}}>The Final Published Rulebook Prevails</div>
                <p style={{color:'rgba(255,255,255,0.85)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  This page is a plain-language summary of the BCPL physical-trial process. The <strong style={{color:'#E8B23D'}}>final published BCPL trial rulebook</strong>, official trial-day briefing and published season rules prevail over this summary wherever they differ. Rubric weights, delivery protocols, allocations and tie-break criteria are versioned and finalised by BCPL Cricket Operations before trials.
                </p>
              </div>
            </div>
          </div>

          {/* Trial process complaint callout */}
          <div style={{background:'rgba(232,178,61,0.07)',border:'1px solid rgba(232,178,61,0.35)',borderLeft:'3px solid #E8B23D',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{fontSize:24,flexShrink:0}}>🚩</span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#E8B23D',marginBottom:6}}>Report a Trial Process Issue</div>
                <p style={{color:'rgba(255,255,255,0.85)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  If you believe a trial-day process error affected your assessment — attempt count, an unmarked feeder error, check-in or identity issues — email <strong style={{color:'#E8B23D'}}>support@bcplt20.com</strong> within 48 hours of your slot with your Registration Number, trial city, slot time and a short description. Procedural complaints are reviewed through an audited process; this covers process errors, not disagreement with an evaluator's cricket judgement.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px)',textAlign:'center'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,22px)',marginBottom:8}}>Know the process. Then own it.</div>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,marginBottom:20}}>Phase 1 is open — register, submit your cricket video and take your shot at the BCPL stage.</p>
            <Link href="/register" className="btn-fire" style={{padding:'14px 36px',fontSize:16,width:'100%',maxWidth:300,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>Register for Phase 1 →</Link>
          </div>
        </div>

        <BCPLFooter />
      </div>
      <StickyRegisterCTA />
      <Link className='float-reg-btn' href='/register' style={{textDecoration:'none'}}>🏏 REGISTER NOW →</Link>
    </div>
  );
}
