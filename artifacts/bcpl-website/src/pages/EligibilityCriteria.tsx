import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';

function MobileCTA() {
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,padding:'10px 16px 18px',background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',gap:10}}>
      <Link href="/register" className="btn-fire" style={{flex:2,height:52,fontSize:15,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>Register ₹299 →</Link>
      <button className="btn-wa" style={{flex:1,height:52,fontSize:14,borderRadius:14}}>💬 WhatsApp</button>
    </div>
  );
}

const OrangeDot = () => (
  <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#FF7A29',marginRight:10,flexShrink:0,marginTop:7}}/>
);

export function EligibilityCriteria() {
  const [pro,setPro]=React.useState<boolean|null>(null);
  const [age,setAge]=React.useState<boolean|null>(null);
  const [exp,setExp]=React.useState<boolean|null>(null);

  const allYes = pro===true && age===true && exp===true;
  const anyNo = pro===false || age===false || exp===false;
  const anyAnswered = pro!==null || age!==null || exp!==null;

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
    .chip-yes{background:rgba(34,197,94,0.15);border:2px solid rgba(34,197,94,0.5);color:#22C55E;border-radius:10px;padding:8px 20px;font-family:Montserrat,sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:all 0.2s;min-height:44px;display:inline-flex;align-items:center;justify-content:center;}
    .chip-yes.active{background:rgba(34,197,94,0.3);border-color:#22C55E;box-shadow:0 0 16px rgba(34,197,94,0.4);}
    .chip-no{background:rgba(232,73,63,0.15);border:2px solid rgba(232,73,63,0.5);color:#E8493F;border-radius:10px;padding:8px 20px;font-family:Montserrat,sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:all 0.2s;min-height:44px;display:inline-flex;align-items:center;justify-content:center;}
    .chip-no.active{background:rgba(232,73,63,0.3);border-color:#E8493F;box-shadow:0 0 16px rgba(232,73,63,0.4);}
    .elig-2col{display:grid;grid-template-columns:1fr;gap:12;}
    @media(min-width:540px){.elig-2col{grid-template-columns:1fr 1fr;}}
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
    @keyframes eligiblePulse{0%,100%{box-shadow:0 0 24px rgba(34,197,94,0.3)}50%{box-shadow:0 0 48px rgba(34,197,94,0.6)}}
    @keyframes floatPulse{0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45)}50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)}}
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

  const questions = [
    {label:'Working Professional?',val:pro,setVal:setPro},
    {label:'18 years or older?',val:age,setVal:setAge},
    {label:'Basic cricket experience?',val:exp,setVal:setExp},
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
            <div className="tag-pill" style={{marginBottom:20}}>✅ AM I ELIGIBLE?</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,7vw,72px)',lineHeight:1.05,marginBottom:8}}>
              <span style={{color:'#fff',display:'block'}}>ELIGIBILITY</span>
              <span className="shimmer-gold" style={{display:'block'}}>CRITERIA.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,fontWeight:600,letterSpacing:'0.05em',marginTop:16,fontFamily:'Montserrat,sans-serif'}}>Last updated: January 15, 2025</p>
            <p style={{color:'rgba(255,255,255,0.65)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:600,margin:'16px auto 0'}}>
              BCPL T20 Season 5 is open to working professionals across India. Check your eligibility in seconds.
            </p>
          </div>
        </section>

        <div className="wrap" style={{maxWidth:860,margin:'0 auto',paddingBottom:40}}>

          {/* Quick Checker */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.1s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
              <span style={{fontSize:24}}>⚡</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#E8B23D'}}>Quick Eligibility Checker</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:13,marginBottom:24}}>Answer 3 quick questions to find out if you qualify for Season 5.</p>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {questions.map((q,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'nowrap',gap:10}}>
                  <span style={{color:'rgba(255,255,255,0.85)',fontSize:15,fontWeight:600,fontFamily:'Inter,sans-serif'}}>{q.label}</span>
                  <div style={{display:'flex',gap:8}}>
                    <button className={`chip-yes${q.val===true?' active':''}`} onClick={()=>q.setVal(true)}>✓ YES</button>
                    <button className={`chip-no${q.val===false?' active':''}`} onClick={()=>q.setVal(false)}>✗ NO</button>
                  </div>
                </div>
              ))}
            </div>
            {anyAnswered && (
              <div style={{marginTop:24}}>
                {allYes ? (
                  <div style={{background:'rgba(34,197,94,0.12)',border:'2px solid rgba(34,197,94,0.5)',borderRadius:16,padding:'20px 24px',textAlign:'center',animation:'eligiblePulse 2s ease-in-out infinite'}}>
                    <div style={{fontSize:32,marginBottom:8}}>🎉</div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20,color:'#22C55E',marginBottom:8}}>You're Eligible!</div>
                    <p style={{color:'rgba(255,255,255,0.7)',fontSize:14,marginBottom:16}}>You qualify for BCPL T20 Season 5. Secure your spot now!</p>
                    <Link href="/register" className="btn-fire" style={{padding:'14px 32px',fontSize:15,width:'100%',maxWidth:260,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>Register Now →</Link>
                  </div>
                ) : anyNo ? (
                  <div style={{background:'rgba(232,73,63,0.1)',border:'2px solid rgba(232,73,63,0.4)',borderRadius:16,padding:'20px 24px',textAlign:'center'}}>
                    <div style={{fontSize:32,marginBottom:8}}>❌</div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:18,color:'#E8493F',marginBottom:8}}>Not Eligible for Season 5</div>
                    <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,marginBottom:16}}>Based on your answers, you don't qualify this season. We'd love to have you in a future edition!</p>
                    <button style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:12,color:'rgba(255,255,255,0.7)',padding:'10px 24px',fontSize:14,cursor:'pointer',fontFamily:'Inter,sans-serif',minHeight:44,width:'100%',maxWidth:280}}>Contact us for future seasons →</button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Section 1 */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.2s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{fontSize:28}}>💼</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>1. Professional Status</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:16}}>BCPL T20 is designed exclusively for India's working professionals. If you earn a living, you belong on this field.</p>
            <div className="elig-2col">
              <div style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:12,padding:'14px 16px'}}>
                <div style={{color:'#22C55E',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:12,letterSpacing:'0.08em',marginBottom:8}}>✅ ELIGIBLE</div>
                {['Full-time employees (any sector)','Self-employed professionals','Business owners & entrepreneurs','Freelancers & consultants','Government employees & PSU staff'].map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:6,color:'rgba(255,255,255,0.75)',fontSize:13,lineHeight:1.6,marginBottom:4}}>
                    <span style={{color:'#22C55E',flexShrink:0}}>✓</span>{item}
                  </div>
                ))}
              </div>
              <div style={{background:'rgba(232,73,63,0.08)',border:'1px solid rgba(232,73,63,0.2)',borderRadius:12,padding:'14px 16px'}}>
                <div style={{color:'#E8493F',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:12,letterSpacing:'0.08em',marginBottom:8}}>❌ NOT ELIGIBLE</div>
                {['Full-time students (college/school)','Retired persons (Season 5)','Unemployed / actively job-seeking','Professional cricketers (Ranji+)','BCPL staff and officials'].map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:6,color:'rgba(255,255,255,0.6)',fontSize:13,lineHeight:1.6,marginBottom:4}}>
                    <span style={{color:'#E8493F',flexShrink:0}}>✗</span>{item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.25s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{fontSize:28}}>🎂</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>2. Age Requirements</h2>
            </div>
            <div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:16}}>
              <div style={{background:'linear-gradient(135deg,rgba(255,122,41,0.15),rgba(232,178,61,0.1))',border:'1px solid rgba(255,122,41,0.3)',borderRadius:14,padding:'16px 24px',textAlign:'center',flex:1,minWidth:120}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:36,color:'#FF7A29',lineHeight:1}}>18+</div>
                <div style={{color:'rgba(255,255,255,0.6)',fontSize:13,marginTop:4}}>Minimum Age</div>
              </div>
              <div style={{background:'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.05))',border:'1px solid rgba(34,197,94,0.2)',borderRadius:14,padding:'16px 24px',textAlign:'center',flex:1,minWidth:120}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:36,color:'#22C55E',lineHeight:1}}>45</div>
                <div style={{color:'rgba(255,255,255,0.6)',fontSize:13,marginTop:4}}>Maximum Age</div>
              </div>
            </div>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
              {[
                'Minimum age: 18 years as of the registration date',
                'Maximum age: 45 years as of the registration date',
                'Age verified via government-issued Aadhaar card or PAN card',
                'Date of birth must match across all submitted documents',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.75)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3 */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.3s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{fontSize:28}}>🏏</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>3. Cricket Experience</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:14}}>
              You don't need a century at Lord's — just a genuine love for the game and the ability to hold your own on a cricket field.
            </p>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
              {[
                'Basic cricket experience is required — colony or gully cricket counts!',
                'Players who have represented at state, district, or professional level must have a minimum 10-year gap from their last competitive match',
                'No formal coaching certificates or club membership needed',
                'Skills assessed via self-uploaded video post-registration',
                'Video must demonstrate batting, bowling, or keeping depending on your role',
                'All-rounders should show at least two skills in the video',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.75)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 4 */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.35s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{fontSize:28}}>💪</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>4. Physical Fitness</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:14}}>
              Cricket demands physical capability. BCPL requires all participants to be in a state of health that allows safe participation.
            </p>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
              {[
                'Must be medically fit to participate in outdoor cricket activities',
                'No active injuries that significantly prevent batting, bowling, or fielding',
                'Players with managed conditions (diabetes, hypertension) may participate with doctor clearance',
                'BCPL may request a fitness certificate from shortlisted/finalist players',
                'BCPL is not liable for injuries — players participate at their own risk',
              ].map((item,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.75)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  <OrangeDot/>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 5 */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.4s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <span style={{fontSize:28}}>📄</span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>5. Required Documents</h2>
            </div>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:'clamp(14px,2vw,15px)',lineHeight:1.8,marginBottom:18}}>
              Documents are submitted after shortlisting. Keep these ready before registration so you're prepared when scouts call.
            </p>
            <div style={{display:'grid',gap:12}}>
              {[
                {icon:'🪪',title:'Identity Proof',desc:'Aadhaar Card or PAN Card (any one). Must be government-issued and valid. Name must match registration details exactly.'},
                {icon:'📸',title:'Passport Photo',desc:'Recent colour photograph (taken within 3 months). Digital copy accepted — minimum 300 DPI resolution.'},
                {icon:'🏢',title:'Employment Proof',desc:'Offer letter, latest salary slip, or business registration certificate. Freelancers: GST registration or latest ITR.'},
                {icon:'🎥',title:'Cricket Video',desc:'Uploaded post-registration via the BCPL portal. 2-5 minutes. Clear footage of your cricketing skills in natural light.'},
              ].map((item,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'14px 16px',display:'flex',gap:12}}>
                  <span style={{fontSize:22,flexShrink:0}}>{item.icon}</span>
                  <div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:13,color:'#E8B23D',marginBottom:4}}>{item.title}</div>
                    <div style={{color:'rgba(255,255,255,0.7)',fontSize:13,lineHeight:1.6}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orange callout */}
          <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.4)',borderLeft:'3px solid #FF7A29',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20,animation:'borderGlow 3s ease-in-out infinite'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{fontSize:24,flexShrink:0}}>📋</span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:6}}>Registration Journey</div>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  {['Register','Upload Video','Get Result','Submit Docs','Done! 🏆'].map((step,i,arr)=>(
                    <React.Fragment key={i}>
                      <span style={{background:'rgba(255,122,41,0.15)',border:'1px solid rgba(255,122,41,0.3)',borderRadius:8,padding:'5px 12px',fontSize:12,color:'#FF7A29',fontWeight:700,fontFamily:'Montserrat,sans-serif'}}>{step}</span>
                      {i<arr.length-1&&<span style={{color:'rgba(255,122,41,0.5)',fontSize:16}}>→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px)',textAlign:'center'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,22px)',marginBottom:8}}>Meet All Criteria?</div>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,marginBottom:20}}>Join 75 cities, 10 franchise teams, and thousands of corporate cricketers. Your stadium moment awaits.</p>
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
              <Link href="/register" className="btn-fire" style={{padding:'14px 36px',fontSize:16,flex:'1 1 200px',maxWidth:280,textDecoration:'none',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>Register ₹299 →</Link>
              <button className="btn-wa" style={{padding:'14px 24px',fontSize:15,borderRadius:14,flex:'1 1 160px',maxWidth:200}}>💬 Ask on WhatsApp</button>
            </div>
          </div>
        </div>

        <BCPLFooter />
      </div>
      <MobileCTA/>
      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>🏏 REGISTER NOW →</Link>
    </div>
  );
}
