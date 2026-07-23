import React from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';

function MobileCTA() {
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,padding:'10px 16px 18px',background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',gap:10}}>
      <button className="btn-fire" style={{flex:2,height:52,fontSize:15}}>Register ₹299 →</button>
      <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="btn-wa" style={{flex:1,height:52,fontSize:14,borderRadius:14,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>💬 WhatsApp</a>
    </div>
  );
}

const OrangeDot = () => (
  <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#FF7A29',marginRight:10,flexShrink:0,marginTop:7}}/>
);

export function Privacy() {

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

  const sections = [
    {n:1,icon:'📦',title:'Data We Collect',items:[
      'Full name, email address, and mobile number (provided during registration)',
      'Date of birth and city of residence for eligibility verification',
      'Current employer/company name and employment type (professional verification)',
      'Cricket role preference: Batsman, Bowler, Wicketkeeper, or All-Rounder',
      'Cricket performance video (uploaded post-registration via secure BCPL portal)',
      'Payment metadata: transaction ID, amount, date — NOT card details or UPI PINs',
      'Device and browser data via Google Analytics (anonymised, aggregated only)',
    ]},
    {n:2,icon:'🔧',title:'How We Use Your Data',items:[
      'Processing your registration and generating your unique BCPL Registration ID',
      'Sharing your cricket profile with authorised BCPL scouts for video evaluation',
      'Communicating shortlisting results, trial schedules, and selection updates',
      'Match scheduling, team assignment, and tournament logistics coordination',
      'Sending important league updates, season announcements, and newsletters (opt-out available)',
      'Improving our platform and user experience via anonymised analytics data',
    ]},
    {n:3,icon:'🤝',title:'Data Sharing',items:[
      'Shortlisted player profiles (name, video, cricket role) are shared with franchise team scouts',
      'Payment transaction data is processed by Cashfree under their separate Privacy Policy',
      'Aggregated, anonymised statistics may be shared with sponsors for league reporting',
      'We NEVER sell, rent, or trade your personal data to any third party — ever',
      'We do not share your data with advertisers, data brokers, or marketing platforms',
      'Data may be disclosed if required by law or court order — we will notify you when legally permitted',
    ]},
    {n:4,icon:'🔐',title:'Data Security',items:[
      '256-bit AES encryption for all data stored at rest on our servers',
      'SSL/TLS (HTTPS) encryption for all data in transit between your device and our servers',
      'Role-based access controls — only authorised BCPL staff access player data',
      'Regular third-party security audits and penetration testing (quarterly)',
      'Cashfree processes payments in a PCI-DSS compliant environment — BCPL never sees card data',
      'In the event of a data breach, affected users will be notified within 72 hours',
    ]},
    {n:5,icon:'✊',title:'Your Rights',items:[
      'Right to Access: request a copy of all personal data BCPL holds about you',
      'Right to Correct: request correction of inaccurate or incomplete personal data',
      'Right to Delete: request account deletion — available before shortlisting stage only',
      'Right to Withdraw Consent: withdraw from marketing communications at any time',
      'Right to Portability: receive your data in a structured, machine-readable format',
      'To exercise any right, email: privacy@bcpl-t20.com — we respond within 7 business days',
    ]},
    {n:6,icon:'🍪',title:'Cookie Policy',items:[
      'We use only essential session cookies required for website functionality',
      'Google Analytics cookies collect anonymised page-view data to improve our site',
      'We do NOT use advertising cookies, tracking pixels, or retargeting technologies',
      'We do NOT use third-party social media cookies or cross-site tracking',
      'You can opt out of Google Analytics via browser settings or browser extension',
      'Blocking essential cookies may affect website functionality but will not affect your registration',
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
            <div className="tag-pill" style={{marginBottom:20}}>🔒 YOUR DATA</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,7vw,72px)',lineHeight:1.05,marginBottom:8}}>
              <span style={{color:'#fff',display:'block'}}>PRIVACY</span>
              <span className="shimmer-gold" style={{display:'block'}}>POLICY.</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,fontWeight:600,letterSpacing:'0.05em',marginTop:16,fontFamily:'Montserrat,sans-serif'}}>Last updated: January 15, 2025</p>
            <p style={{color:'rgba(255,255,255,0.65)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:600,margin:'16px auto 0'}}>
              Your privacy matters to us. We are transparent about what data we collect, why we collect it, and who can see it.
            </p>
          </div>
        </section>

        <div className="wrap" style={{maxWidth:860,margin:'0 auto',paddingBottom:40}}>

          <div style={{background:'rgba(34,197,94,0.1)',border:'2px solid rgba(34,197,94,0.4)',borderLeft:'4px solid #22C55E',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.1s both'}}>
            <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
              <span style={{fontSize:28,flexShrink:0}}>🛡️</span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:16,color:'#22C55E',marginBottom:4}}>Our Privacy Promise</div>
                <p style={{color:'rgba(255,255,255,0.85)',fontSize:'clamp(13px,2vw,15px)',fontWeight:600}}>We <strong style={{color:'#22C55E'}}>NEVER sell your data to third parties. Ever.</strong> Your information is used solely to run BCPL T20 Season 5.</p>
              </div>
            </div>
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
              <span style={{fontSize:24,flexShrink:0}}>📧</span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:6}}>Privacy Officer Contact</div>
                <p style={{color:'rgba(255,255,255,0.85)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  For all privacy-related queries, requests, or complaints, contact us at <strong style={{color:'#E8B23D'}}>privacy@bcpl-t20.com</strong>. We acknowledge all requests within 2 business days and resolve within 7.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px)',textAlign:'center'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,22px)',marginBottom:8}}>Your Data Is Safe With Us</div>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,marginBottom:20}}>Register with confidence — join 10,000+ professionals who trust BCPL T20 Season 5.</p>
            <button className="btn-fire" style={{padding:'14px 36px',fontSize:16,width:'100%',maxWidth:300}}>Register Securely →</button>
          </div>
        </div>

        <BCPLFooter />
      </div>
      <MobileCTA/>
      <a className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>🏏 REGISTER NOW →</a>
    </div>
  );
}
