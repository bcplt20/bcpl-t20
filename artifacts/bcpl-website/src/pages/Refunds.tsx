import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { LegalDocHeader } from '../lib/legalMeta';
import { IcoRupee, IcoRoute, IcoCard, IcoVideo, IcoCheck, IcoX, IcoInfo, IcoWarn, IcoList, IcoBan, IcoClock, IcoTrophy, IcoSearch, IcoMail, IcoPen, IcoChat, IcoStadium, IcoZap, IcoCalendar } from '../lib/icons';

type IcoComp = (p: { size?: number; style?: React.CSSProperties }) => React.ReactElement;

const OrangeDot = () => (
  <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#FF7A29',marginRight:10,flexShrink:0,marginTop:7}}/>
);

export function Refunds() {
  const [regId,setRegId]=React.useState('');
  const [reason,setReason]=React.useState('');
  const [submitted,setSubmitted]=React.useState(false);

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
    .glass-card{background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85));backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.09);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06);}
    .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
    .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
    .inp{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:14px;color:#F8F4EE;padding:15px 18px;font-family:Inter,sans-serif;font-size:15px;outline:none;transition:all 0.25s;appearance:none;}
    .inp:focus{border-color:#FF7A29;background:rgba(255,122,41,0.06);box-shadow:0 0 0 4px rgba(255,122,41,0.12);}
    .inp::placeholder{color:rgba(255,255,255,0.28);}
    .lbl{font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:8px;display:block;}
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
            <div className="tag-pill" style={{marginBottom:20}}><IcoRupee size={14}/> REFUND & CANCELLATION POLICY</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,7vw,72px)',lineHeight:1.05,marginBottom:8}}>
              <span style={{color:'#fff',display:'block'}}>REFUND &</span>
              <span className="shimmer-gold" style={{display:'block'}}>CANCELLATION.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:12,marginTop:16,fontFamily:'Inter,sans-serif'}}>यह दस्तावेज़ English में मान्य है · This document is authoritative in English.</p>
            <p style={{color:'rgba(255,255,255,0.65)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:600,margin:'16px auto 0'}}>
              This policy sets out, by scenario, when a refund applies under the BCPL two-phase process and when it does not.
            </p>
            <div style={{marginTop:28}}>
              <LegalDocHeader doc="refunds" />
            </div>
          </div>
        </section>

        <div className="wrap" style={{maxWidth:860,margin:'0 auto',paddingBottom:40}}>

          {/* Visual Flowchart */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.1s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
              <span style={{color:'#E8B23D',display:'inline-flex',alignItems:'center'}}><IcoRoute size={20}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:18,color:'#E8B23D'}}>Phase 1 Refund Flow (Before Video Upload)</h2>
            </div>
            <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
              <div style={{display:'flex',alignItems:'center',gap:0,minWidth:520,flexWrap:'nowrap'}}>
                <div style={{background:'linear-gradient(135deg,rgba(255,122,41,0.2),rgba(232,178,61,0.1))',border:'2px solid rgba(255,122,41,0.5)',borderRadius:14,padding:'14px 18px',textAlign:'center',minWidth:120,flexShrink:0}}>
                  <div style={{marginBottom:4,color:'#FF7A29',display:'flex',justifyContent:'center'}}><IcoCard size={22}/></div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:12,color:'#FF7A29',lineHeight:1.3}}>Phase 1<br/>fee paid</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'0 6px',flexShrink:0}}>
                  <div style={{color:'rgba(255,255,255,0.4)',fontSize:20,lineHeight:1}}>→</div>
                </div>
                <div style={{background:'rgba(30,64,175,0.2)',border:'2px solid rgba(59,130,246,0.4)',borderRadius:14,padding:'14px 18px',textAlign:'center',minWidth:130,flexShrink:0}}>
                  <div style={{marginBottom:4,color:'#60A5FA',display:'flex',justifyContent:'center'}}><IcoVideo size={22}/></div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:12,color:'#60A5FA',lineHeight:1.3}}>Video<br/>uploaded?</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6,padding:'0 8px',flexShrink:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                    <span style={{color:'#22C55E',fontSize:11,fontWeight:700,fontFamily:'Montserrat,sans-serif'}}>NO →</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                    <span style={{color:'#E8493F',fontSize:11,fontWeight:700,fontFamily:'Montserrat,sans-serif'}}>YES →</span>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8,flexShrink:0}}>
                  <div style={{background:'rgba(34,197,94,0.15)',border:'2px solid rgba(34,197,94,0.5)',borderRadius:12,padding:'10px 16px',minWidth:160}}>
                    <div style={{marginBottom:2,color:'#22C55E',display:'flex'}}><IcoCheck size={16}/></div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:11,color:'#22C55E',lineHeight:1.3}}>Within 15 days &amp; no upload<br/><span style={{color:'rgba(34,197,94,0.7)',fontWeight:600}}>Full Phase 1 fee refund under this policy</span></div>
                  </div>
                  <div style={{background:'rgba(232,73,63,0.15)',border:'2px solid rgba(232,73,63,0.5)',borderRadius:12,padding:'10px 16px',minWidth:160}}>
                    <div style={{marginBottom:2,color:'#E8493F',display:'flex'}}><IcoX size={16}/></div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:11,color:'#E8493F',lineHeight:1.3}}>Assessment begun<br/><span style={{color:'rgba(232,73,63,0.7)',fontWeight:600}}>Fee not refundable except as this policy provides</span></div>
                  </div>
                </div>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:11,marginTop:14,lineHeight:1.6}}>Separate published backstop: if your Phase 1 result is not delivered within 15 working days of video upload, you are entitled to a full refund of your Phase 1 fee under this policy (Scenario A).</p>
          </div>

          <div style={{background:'rgba(34,197,94,0.1)',border:'2px solid rgba(34,197,94,0.4)',borderLeft:'4px solid #22C55E',borderRadius:16,padding:'16px clamp(16px,4vw,24px)',marginBottom:16,animation:'fadeSlide 0.5s ease 0.15s both'}}>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <span style={{flexShrink:0,color:'#22C55E',display:'inline-flex'}}><IcoCheck size={22}/></span>
              <p style={{color:'rgba(255,255,255,0.9)',fontSize:'clamp(13px,2vw,15px)',fontWeight:700,fontFamily:'Montserrat,sans-serif'}}>Where this policy provides for a refund, you are entitled to a full refund of the applicable fee. <span style={{color:'#22C55E'}}>No deductions.</span></p>
            </div>
          </div>

          <div style={{background:'rgba(232,73,63,0.1)',border:'2px solid rgba(232,73,63,0.4)',borderLeft:'4px solid #E8493F',borderRadius:16,padding:'16px clamp(16px,4vw,24px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.2s both'}}>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <span style={{flexShrink:0,color:'#E8493F',display:'inline-flex'}}><IcoInfo size={22}/></span>
              <p style={{color:'rgba(255,255,255,0.9)',fontSize:'clamp(13px,2vw,15px)',fontWeight:700,fontFamily:'Montserrat,sans-serif'}}>Non-selection at any stage <span style={{color:'#E8493F'}}>does not by itself entitle you to a refund</span> — refunds apply only where this policy expressly provides.</p>
            </div>
          </div>

          {/* Payment Disclaimer — prominent */}
          <div style={{background:'rgba(232,178,61,0.10)',border:'2px solid rgba(232,178,61,0.45)',borderLeft:'4px solid #E8B23D',borderRadius:16,padding:'18px clamp(16px,4vw,24px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.22s both'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{flexShrink:0,lineHeight:1,color:'#E8B23D',display:'inline-flex'}}><IcoWarn size={24}/></span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:15,color:'#E8B23D',marginBottom:6}}>Payment Disclaimer</div>
                <p style={{color:'rgba(255,255,255,0.9)',fontSize:'clamp(13px,2vw,15px)',lineHeight:1.75,fontWeight:600}}>
                  Payment of Phase 1 or Phase 2 fees does not guarantee qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration or tournament participation.
                </p>
              </div>
            </div>
          </div>

          {/* Fee context note */}
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'14px clamp(16px,4vw,22px)',marginBottom:24}}>
            <p style={{color:'rgba(255,255,255,0.7)',fontSize:13,lineHeight:1.75}}>
              Phase 1 fee is role-based (₹299 + applicable GST for Batsman/Bowler/Wicketkeeper; ₹399 + applicable GST for All-Rounder). The Phase 2 fee is the applicable role-based Phase 2 fee plus applicable GST as displayed at the time of payment. GST is charged as applicable. The amount shown to you at checkout is the amount payable.
            </p>
          </div>

          {/* Section 1 — Refund Scenarios A–H */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.25s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,flexWrap:'wrap'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,rgba(255,122,41,0.3),rgba(232,178,61,0.2))',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#FF7A29',flexShrink:0}}>1</div>
              <span style={{color:'#FF7A29',display:'inline-flex',alignItems:'center'}}><IcoList size={22}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>Refund Scenarios (A–H)</h2>
            </div>
            <div style={{background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.15)',borderRadius:12,padding:'14px 18px',marginBottom:16}}>
              <p style={{color:'rgba(255,255,255,0.85)',fontSize:13,fontWeight:600,fontFamily:'Inter,sans-serif',lineHeight:1.7}}>Where a refund applies under this policy, you are entitled to a full refund of the applicable fee with no deductions by BCPL. Two published player-friendly protections apply to Phase 1 and are set out in Scenario A.</p>
            </div>
            <div style={{display:'grid',gap:12}}>
              {([
                {tag:'A', tone:'green', icon:IcoVideo, title:'Phase 1 player protections', desc:'You are entitled to a full refund of your Phase 1 fee under this policy in two situations: (i) if you cancel before uploading your Phase 1 video, within the 15-day upload window (once the video is uploaded and the assessment has begun, the fee is no longer refundable except as this policy provides); and (ii) if your Phase 1 result is not delivered within 15 working days of your video upload (the published backstop, even though results are targeted within 48 hours of submission).'},
                {tag:'A.', tone:'blue', icon:IcoBan, title:'A — Player does not qualify Phase 1', desc:'If you do not qualify at Phase 1, no Phase 2 fee becomes payable. The Phase 2 fee simply never arises, so there is no Phase 2 amount to refund.'},
                {tag:'B', tone:'blue', icon:IcoClock, title:'B — Qualifies Phase 1 but does not pay Phase 2', desc:'If you qualify at Phase 1 but do not pay the Phase 2 fee, Phase 2 is not activated and no further amount is due from you.'},
                {tag:'C', tone:'blue', icon:IcoCard, title:'C — Qualifies and pays Phase 2', desc:'Once you qualify and pay the applicable role-based Phase 2 fee plus applicable GST as displayed at the time of payment, any later cancellation or refund is governed by the express provisions of this policy.'},
                {tag:'D', tone:'red', icon:IcoInfo, title:'D — Not selected after the physical trial', desc:'Non-selection after your physical trial does NOT automatically entitle you to a refund of the Phase 2 fee. Refunds apply only where this policy expressly provides for them.'},
                {tag:'E', tone:'green', icon:IcoRoute, title:'E — Duplicate payment', desc:'Verified duplicate charges for the same fee are refunded to the original payment method. To request this, write to support@bcplt20.com with your payment reference; verified duplicate amounts are processed within 5–7 working days (plus gateway processing time).'},
                {tag:'F', tone:'green', icon:IcoZap, title:'F — Technical payment error', desc:'If an amount is debited but the order is not created or confirmed, the payment gateway auto-reverses the amount where applicable. If it is not reversed, contact support@bcplt20.com within 48 hours with your transaction details so we can investigate and resolve it.'},
                {tag:'G', tone:'green', icon:IcoStadium, title:'G — BCPL cancels or reschedules a trial', desc:'If BCPL cancels or reschedules a trial, BCPL will offer the published remedy for that situation — such as a rescheduled slot or venue, or a refund of the applicable fee where BCPL cancels a trial entirely and no alternative is provided.'},
                {tag:'H', tone:'red', icon:IcoClock, title:'H — Player misses their trial slot', desc:'Missed trial slots are not automatically refundable. Any rescheduling or further consideration is only as provided under the published season rules.'},
              ] as {tag:string;tone:string;icon:IcoComp;title:string;desc:string}[]).map((item)=>{
                const tones:Record<string,{bg:string;bd:string;fg:string}> = {
                  green:{bg:'rgba(34,197,94,0.05)',bd:'rgba(34,197,94,0.2)',fg:'#22C55E'},
                  red:{bg:'rgba(232,73,63,0.05)',bd:'rgba(232,73,63,0.2)',fg:'#E8493F'},
                  blue:{bg:'rgba(59,130,246,0.05)',bd:'rgba(59,130,246,0.2)',fg:'#60A5FA'},
                };
                const c = tones[item.tone];
                return (
                <div key={item.title} style={{display:'flex',gap:14,alignItems:'flex-start',background:c.bg,border:`1px solid ${c.bd}`,borderRadius:12,padding:'16px'}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:c.bg,border:`1px solid ${c.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:c.fg,flexShrink:0}}>{item.tag}</div>
                  <div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#fff',marginBottom:4,display:'flex',alignItems:'center',gap:8}}><span style={{color:c.fg,display:'inline-flex'}}><item.icon size={16}/></span>{item.title}</div>
                    <div style={{color:'rgba(255,255,255,0.7)',fontSize:13,lineHeight:1.7}}>{item.desc}</div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Section 2 — What is not refundable */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.3s both',border:'1px solid rgba(232,73,63,0.2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,flexWrap:'wrap'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(232,73,63,0.2)',border:'1px solid rgba(232,73,63,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#E8493F',flexShrink:0}}>2</div>
              <span style={{color:'#E8493F',display:'inline-flex',alignItems:'center'}}><IcoInfo size={22}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>Situations Where a Refund Does Not Apply</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.65)',fontSize:14,lineHeight:1.7,marginBottom:16}}>Outside the situations for which this policy expressly provides a refund, fees are <strong style={{color:'#E8493F'}}>not refundable</strong>. This includes, for example:</p>
            <div style={{display:'grid',gap:10}}>
              {([
                {icon:IcoVideo,text:'After your Phase 1 video has been uploaded and the assessment has begun'},
                {icon:IcoCalendar,text:'Change of mind after the applicable Phase 1 upload window has passed'},
                {icon:IcoTrophy,text:'Non-selection at any stage, including after the physical trial (see Scenario D)'},
                {icon:IcoSearch,text:'Ineligibility caused by false or inaccurate declarations of age, professional status or identity'},
                {icon:IcoBan,text:'Disqualification for Code of Conduct or integrity violations at any stage'},
                {icon:IcoRupee,text:'Inability to attend a trial due to personal, scheduling or travel reasons (see Scenario H)'},
                {icon:IcoBan,text:'Technical issues on your own device, internet or upload from your end'},
              ] as {icon:IcoComp;text:string}[]).map((item,i)=>(
                <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',background:'rgba(232,73,63,0.06)',border:'1px solid rgba(232,73,63,0.15)',borderRadius:10,padding:'10px 14px'}}>
                  <span style={{flexShrink:0,color:'#E8493F',display:'inline-flex'}}><item.icon size={18}/></span>
                  <span style={{color:'rgba(255,255,255,0.75)',fontSize:13,lineHeight:1.6}}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.35s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,flexWrap:'wrap'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,rgba(255,122,41,0.3),rgba(232,178,61,0.2))',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#FF7A29',flexShrink:0}}>3</div>
              <span style={{color:'#FF7A29',display:'inline-flex',alignItems:'center'}}><IcoMail size={22}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>How to Request a Refund</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:16}}>
              Email <strong style={{color:'#E8B23D'}}>support@bcplt20.com</strong> with the following details in your email:
            </p>
            <div style={{display:'grid',gap:10,marginBottom:16}}>
              {[
                {n:1,label:'Subject Line',desc:'Use exactly: "REFUND REQUEST — [Your Registration ID]"'},
                {n:2,label:'Registration ID',desc:'Your unique BCPL Registration ID (found in confirmation email)'},
                {n:3,label:'Reason',desc:'Brief explanation of why you\'re requesting the refund'},
                {n:4,label:'Payment Screenshot',desc:'Screenshot or PDF of Cashfree payment confirmation'},
              ].map((item)=>(
                <div key={item.n} style={{display:'flex',gap:12,alignItems:'flex-start',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'12px 14px'}}>
                  <div style={{width:24,height:24,borderRadius:'50%',background:'rgba(255,122,41,0.2)',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#FF7A29',flexShrink:0,fontFamily:'Montserrat,sans-serif'}}>{item.n}</div>
                  <div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:12,color:'#E8B23D',marginBottom:2}}>{item.label}</div>
                    <div style={{color:'rgba(255,255,255,0.7)',fontSize:13,lineHeight:1.5}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.4s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,flexWrap:'wrap'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,rgba(255,122,41,0.3),rgba(232,178,61,0.2))',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#FF7A29',flexShrink:0}}>4</div>
              <span style={{color:'#FF7A29',display:'inline-flex',alignItems:'center'}}><IcoClock size={22}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>Processing Timeline</h2>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:14,marginBottom:16}}>
              {[
                {days:'24h',label:'Acknowledgement',desc:'Refund request acknowledged via email'},
                {days:'5-7',label:'Business Days',desc:'Refund processed and initiated'},
                {days:'+1-2',label:'Extra Days',desc:'Cashfree gateway processing time'},
              ].map((item,i)=>(
                <div key={i} style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.2)',borderRadius:12,padding:'16px',textAlign:'center'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:28,color:'#FF7A29',lineHeight:1}}>{item.days}</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:4,marginBottom:4}}>{item.label}</div>
                  <div style={{color:'rgba(255,255,255,0.5)',fontSize:11,lineHeight:1.4}}>{item.desc}</div>
                </div>
              ))}
            </div>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
              {[
                'Refund credited to the original payment method (credit card, debit card, or UPI)',
                'UPI refunds typically arrive faster (1-3 days) than card refunds (5-7 days)',
                'If refund not received within 10 business days, email support@bcplt20.com',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.75)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Refund Request Mini-Form */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.45s both',border:'1px solid rgba(255,122,41,0.2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
              <span style={{color:'#FF7A29',display:'inline-flex',alignItems:'center'}}><IcoPen size={24}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>Refund Request Form</h2>
            </div>
            {submitted ? (
              <div style={{textAlign:'center',padding:'24px 0'}}>
                <div style={{marginBottom:12,color:'#22C55E',display:'flex',justifyContent:'center'}}><IcoCheck size={44}/></div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20,color:'#22C55E',marginBottom:8}}>Request Submitted!</div>
                <p style={{color:'rgba(255,255,255,0.6)',fontSize:14}}>We've received your refund request. Expect an acknowledgement within 24 hours at your registered email.</p>
              </div>
            ) : (
              <>
                <div style={{marginBottom:18}}>
                  <label className="lbl">Registration ID</label>
                  <input className="inp" type="text" placeholder="e.g. BCPL-2025-123456" value={regId} onChange={e=>setRegId(e.target.value)}/>
                </div>
                <div style={{marginBottom:20}}>
                  <label className="lbl">Reason for Refund</label>
                  <textarea className="inp" rows={4} placeholder="Briefly explain why you're requesting a refund..." value={reason} onChange={e=>setReason(e.target.value)} style={{resize:'vertical',minHeight:100}}/>
                </div>
                <button className="btn-fire" style={{width:'100%',height:52,fontSize:16}} onClick={()=>{if(regId.trim()&&reason.trim())setSubmitted(true);}}>
                  Submit Refund Request →
                </button>
                <p style={{textAlign:'center',marginTop:14,color:'rgba(255,255,255,0.4)',fontSize:13}}>
                  Or email directly: <strong style={{color:'#E8B23D'}}>support@bcplt20.com</strong>
                </p>
              </>
            )}
          </div>

          <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.4)',borderLeft:'3px solid #FF7A29',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20,animation:'borderGlow 3s ease-in-out infinite'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{flexShrink:0,color:'#FF7A29',display:'inline-flex'}}><IcoChat size={24}/></span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:6}}>Have Questions?</div>
                <p style={{color:'rgba(255,255,255,0.85)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  Contact our support team at <strong style={{color:'#E8B23D'}}>support@bcplt20.com</strong> or WhatsApp us. We're here 9 AM – 7 PM, Monday–Saturday.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px)',textAlign:'center'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,22px)',marginBottom:8}}>Still Deciding?</div>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,marginBottom:20}}>You are entitled to a full refund of your Phase 1 fee under this policy if you cancel before uploading your video, within the 15-day upload window.</p>
            <Link href="/register" className="btn-fire" style={{padding:'14px 36px',fontSize:16,width:'100%',maxWidth:300,textDecoration:'none',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>Register for Phase 1 →</Link>
          </div>
        </div>

        <BCPLFooter />
      </div>
      <StickyRegisterCTA />
      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>REGISTER NOW →</Link>
    </div>
  );
}
