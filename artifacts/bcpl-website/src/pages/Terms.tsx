import React from 'react';
import { BCPLFooter } from '../components/BCPLFooter';

function AnnBar() {
  return (
    <div style={{background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)',backgroundSize:'300% 100%',animation:'gradShift 4s ease infinite',color:'#fff',padding:'11px 20px',textAlign:'center',fontSize:13,fontWeight:700,fontFamily:'Montserrat,sans-serif',zIndex:10,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',gap:0,flexWrap:'wrap'}}>
      <span>🏏 Season 5 Registrations OPEN</span>
      <span style={{display:'inline-block',width:1,height:14,background:'rgba(255,255,255,0.4)',margin:'0 14px',verticalAlign:'middle'}}/>
      <span>75 Cities · 10 Teams · ₹299 Only</span>
      <span style={{display:'inline-block',width:1,height:14,background:'rgba(255,255,255,0.4)',margin:'0 14px',verticalAlign:'middle'}}/>
      <span>#OfficeSeStadiumtak</span>
    </div>
  );
}

function Navbar({open,setOpen}:{open:boolean,setOpen:(v:boolean)=>void}) {
  const links=[['🏠 Home','/'],['🔴 Match Center','/match-center'],['🏏 Teams','/teams'],['🤝 Sponsors','/sponsors'],['📷 Photos','/photos'],['▶️ Videos','/videos'],['ℹ️ About','/about'],['❓ FAQ','/faq'],['✉️ Contact','/contact']];
  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:200,background:'rgba(6,14,28,0.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.07)',boxShadow:'0 1px 0 0 rgba(255,122,41,0.25)'}}>
        <div className="wrap" style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,display:'flex',alignItems:'center'}}>
            <span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:3}}>T20</span>
            <span style={{fontSize:10,color:'rgba(255,122,41,0.7)',marginLeft:8,fontWeight:700,letterSpacing:'0.08em'}}>SEASON 5</span>
          </div>
          <div className="desk-nav">
            {[['Home','/'],['Match Center','/match-center'],['Teams','/teams'],['Sponsors','/sponsors'],['Photos','/photos'],['Videos','/videos'],['About','/about'],['FAQ','/faq'],['Contact','/contact'],['Login','/register#login']].map(([l,h])=>(
              <a key={l} href={h} style={{color:'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13,textDecoration:'none',fontFamily:'Inter,sans-serif'}}>{l}</a>
            ))}
            <a href="/register" className="btn-fire" style={{padding:'10px 20px',fontSize:13,textDecoration:'none'}}>Register ₹299</a>
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
          {links.map(([l,h])=>(
            <a key={l} href={h} onClick={()=>setOpen(false)} style={{color:'rgba(255,255,255,0.85)',fontWeight:700,fontSize:18,textDecoration:'none',fontFamily:'Montserrat,sans-serif',padding:'13px 0',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',minHeight:44}}>{l}</a>
          ))}
          <button className="btn-fire" style={{marginTop:28,height:52,fontSize:16,width:'100%'}}>📝 Register for ₹299 →</button>
        </div>
      )}
    </>
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

export function Terms() {
  const [open,setOpen]=React.useState(false);

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

  const sections = [
    {n:1,icon:'✅',title:'Acceptance of Terms',items:[
      'By completing registration on www.bcpl-t20.com, you unconditionally accept these Terms & Conditions',
      'Acceptance is binding on you and any person or entity you represent',
      'If you do not agree with any part of these terms, do not proceed with registration',
      'BCPL reserves the right to update these terms at any time; updated terms govern immediately upon posting',
      'Continued participation after an update constitutes acceptance of revised terms',
    ]},
    {n:2,icon:'📝',title:'Registration & Eligibility',items:[
      'Registrations are open exclusively to working professionals aged 18 years and above',
      'Only one registration per person is permitted per season — duplicate registrations will be cancelled without refund',
      'Providing false information (profession, age, identity) constitutes fraud and results in immediate disqualification',
      'BCPL reserves the right to verify eligibility at any stage, including post-selection',
      'Registration is personal and non-transferable; you may not register on behalf of another person',
    ]},
    {n:3,icon:'💳',title:'Payment Terms',items:[
      'Registration fee: ₹299 (Batsman/Bowler/Wicketkeeper) or ₹399 (All-Rounder) — GST inclusive',
      'Payments processed securely via Razorpay; BCPL does not store card or UPI details',
      'Registration fees are non-refundable once a cricket video has been uploaded',
      'Within 7 days of registration (before video upload), a full refund may be requested',
      'In case of payment failure with amount debited, contact support@bcpl-t20.com within 48 hours',
    ]},
    {n:4,icon:'🏆',title:'Selection Process',items:[
      'Selection is entirely merit-based, assessed by BCPL-appointed scouts via submitted video',
      'BCPL\'s selection decision is final, conclusive, and binding — no appeal process exists',
      'Shortlisted players will be notified via registered email and phone number',
      'BCPL makes no guarantee of selection, trial invitation, or match participation',
      'Scouts evaluate role-specific skills; registration fee is for scouting access, not guaranteed selection',
    ]},
    {n:5,icon:'🤝',title:'Player Obligations',items:[
      'Shortlisted players must attend scheduled trials at the designated city venue on time',
      'Players must maintain conduct standards as outlined in the BCPL Code of Conduct at all times',
      'By registering, players grant BCPL irrevocable media consent for photos, videos, and broadcast coverage',
      'Players must maintain their own medical fitness and carry personal health insurance',
      'Players must notify BCPL immediately of any change in eligibility status after registration',
    ]},
    {n:6,icon:'©',title:'Intellectual Property',items:[
      'BCPL owns all match footage, broadcast content, highlight reels, and official photographs',
      'Players may share their own personal performance clips on social media for personal promotion',
      'BCPL name, logo, team names, and all associated marks are registered trademarks of BCPL T20 Pvt. Ltd.',
      'Unauthorised commercial use of BCPL brand assets is prohibited and actionable',
      'Players may not license or sell BCPL content without explicit written consent',
    ]},
    {n:7,icon:'⚠️',title:'Limitation of Liability',items:[
      'Players participate in BCPL matches and trials entirely at their own risk',
      'BCPL is not liable for any injury, illness, or accident occurring during matches, trials, or travel',
      'BCPL is not liable for any indirect, consequential, or special losses arising from participation or non-selection',
      'BCPL\'s total liability in any circumstances shall not exceed the registration fee paid',
      'Players are advised to maintain personal accident and health insurance for the duration of the tournament',
    ]},
    {n:8,icon:'⚖️',title:'Governing Law & Disputes',items:[
      'These Terms are governed by the laws of the Republic of India',
      'Courts of Delhi shall have exclusive jurisdiction over all disputes arising from these Terms',
      'Disputes must first be submitted to BCPL\'s Grievance Redressal process — email legal@bcpl-t20.com',
      'Unresolved disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996',
      'Arbitration proceedings shall be conducted in English in New Delhi',
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
        <AnnBar/>
        <Navbar open={open} setOpen={setOpen}/>

        <section style={{padding:'clamp(40px,8vw,72px) 0 40px',textAlign:'center',animation:'fadeSlide 0.6s ease both'}}>
          <div className="wrap">
            <div className="tag-pill" style={{marginBottom:20}}>⚖️ LEGAL</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,7vw,72px)',lineHeight:1.05,marginBottom:8}}>
              <span style={{color:'#fff',display:'block'}}>TERMS &</span>
              <span className="shimmer-gold" style={{display:'block'}}>CONDITIONS.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,fontWeight:600,letterSpacing:'0.05em',marginTop:16,fontFamily:'Montserrat,sans-serif'}}>Last updated: January 15, 2025</p>
            <p style={{color:'rgba(255,255,255,0.65)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:600,margin:'16px auto 0'}}>
              Please read these Terms & Conditions carefully before registering for BCPL T20 Season 5. These terms govern your participation in the league.
            </p>
          </div>
        </section>

        <div className="wrap" style={{maxWidth:860,margin:'0 auto',paddingBottom:40}}>

          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:24,animation:'fadeSlide 0.5s ease 0.1s both'}}>
            {sections.map(s=>(
              <span key={s.n} style={{background:'rgba(255,122,41,0.1)',border:'1px solid rgba(255,122,41,0.25)',borderRadius:8,padding:'5px 12px',fontSize:12,color:'rgba(255,255,255,0.7)',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:600,minHeight:36,display:'inline-flex',alignItems:'center'}}>
                {s.n}. {s.title}
              </span>
            ))}
          </div>

          {sections.map((s,idx)=>(
            <div key={s.n} className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:`fadeSlide 0.5s ease ${0.1+idx*0.07}s both`}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,flexWrap:'wrap'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,rgba(255,122,41,0.3),rgba(232,178,61,0.2))',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#FF7A29',flexShrink:0}}>{s.n}</div>
                <span style={{fontSize:22}}>{s.icon}</span>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>{s.title}</h2>
              </div>
              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
                {s.items.map((item,i)=>(
                  <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.75)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.8}}>
                    <OrangeDot/>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.4)',borderLeft:'3px solid #FF7A29',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20,animation:'borderGlow 3s ease-in-out infinite'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{fontSize:24,flexShrink:0}}>📬</span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:6}}>Questions About These Terms?</div>
                <p style={{color:'rgba(255,255,255,0.85)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  Contact our legal team at <strong style={{color:'#E8B23D'}}>legal@bcpl-t20.com</strong> or write to: BCPL T20 Pvt. Ltd., New Delhi, India. We aim to respond within 5 business days.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px)',textAlign:'center'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,22px)',marginBottom:8}}>Ready to Join BCPL T20?</div>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,marginBottom:20}}>By registering, you accept these terms. See you on the field!</p>
            <button className="btn-fire" style={{padding:'14px 36px',fontSize:16,width:'100%',maxWidth:300}}>Register for ₹299 →</button>
          </div>
        </div>

        <BCPLFooter />
      </div>
      <MobileCTA/>
      <a className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>🏏 REGISTER NOW →</a>
    </div>
  );
}
