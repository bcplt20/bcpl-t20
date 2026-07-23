import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';

function MobileCTA() {
  const { t } = useLang();
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,padding:'10px 16px 18px',background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',gap:10}}>
      <Link href="/register" className="btn-fire" style={{flex:2,height:52,fontSize:15,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>{t("Register ₹299 →","रजिस्टर ₹299 →")}</Link>
      <a href="https://wa.me/919151346555" target="_blank" rel="noopener noreferrer" className="btn-wa" style={{flex:1,height:52,fontSize:14,borderRadius:14,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>WhatsApp</a>
    </div>
  );
}

const OrangeDot = () => (
  <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#FF7A29',marginRight:10,flexShrink:0,marginTop:7}}/>
);

export function Privacy() {
  const { t } = useLang();
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const num = parseInt(id.replace('section-', ''));
            if (!isNaN(num)) setActiveSection(num);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-100px 0px -60% 0px' }
    );
    const sections = contentRef.current?.querySelectorAll('[id^="section-"]');
    sections?.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

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
    .legal-layout{display:grid;gap:40px;}
    @media(min-width:1024px){.legal-layout{grid-template-columns:260px 1fr;gap:56px;align-items:start;}}
    .toc-sticky{position:sticky;top:80px;display:none;}
    @media(min-width:1024px){.toc-sticky{display:block;}}
    .toc-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;cursor:pointer;transition:all .2s;text-decoration:none;color:rgba(255,255,255,.6);font-size:14px;border:1px solid transparent;min-height:44px;}
    .toc-item:hover{background:rgba(255,122,41,.08);color:#FF7A29;border-color:rgba(255,122,41,.2);}
    .toc-item.active{background:rgba(255,122,41,.12);color:#FF7A29;border-color:rgba(255,122,41,.35);font-weight:700;}
    .toc-num{width:26px;height:26px;border-radius:50%;background:rgba(255,122,41,.15);border:1px solid rgba(255,122,41,.3);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#FF7A29;flex-shrink:0;font-family:Montserrat,sans-serif;}
    .mobile-jump{display:block;margin-bottom:24px;}
    @media(min-width:1024px){.mobile-jump{display:none;}}
    .jump-select{width:100%;background:rgba(10,23,39,.9);border:1.5px solid rgba(255,122,41,.3);border-radius:var(--r);color:#F0EDE8;padding:14px 16px;font-family:Inter,sans-serif;font-size:15px;font-weight:600;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='%23FF7A29'%3E%3Cpath d='M0 0l6 8 6-8z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 16px center;background-size:12px;padding-right:44px;min-height:52px;}
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
    {n:1,icon:'📦',titleEn:'Data We Collect',titleHi:'हम क्या डेटा लेते हैं',items:[
      'Full name, email address, and mobile number (provided during registration)',
      'Date of birth and city of residence for eligibility verification',
      'Current employer/company name and employment type (professional verification)',
      'Cricket role preference: Batsman, Bowler, Wicketkeeper, or All-Rounder',
      'Cricket performance video (uploaded post-registration via secure BCPL portal)',
      'Payment metadata: transaction ID, amount, date — NOT card details or UPI PINs',
      'Device and browser data via Google Analytics (anonymised, aggregated only)',
    ]},
    {n:2,icon:'🔧',titleEn:'How We Use Your Data',titleHi:'हम डेटा का उपयोग कैसे करते हैं',items:[
      'Processing your registration and generating your unique BCPL Registration ID',
      'Sharing your cricket profile with authorised BCPL scouts for video evaluation',
      'Communicating shortlisting results, trial schedules, and selection updates',
      'Match scheduling, team assignment, and tournament logistics coordination',
      'Sending important league updates, season announcements, and newsletters (opt-out available)',
      'Improving our platform and user experience via anonymised analytics data',
    ]},
    {n:3,icon:'🤝',titleEn:'Data Sharing',titleHi:'डेटा साझाकरण',items:[
      'Shortlisted player profiles (name, video, cricket role) are shared with franchise team scouts',
      'Payment transaction data is processed by Cashfree under their separate Privacy Policy',
      'Aggregated, anonymised statistics may be shared with sponsors for league reporting',
      'We NEVER sell, rent, or trade your personal data to any third party — ever',
      'We do not share your data with advertisers, data brokers, or marketing platforms',
      'Data may be disclosed if required by law or court order — we will notify you when legally permitted',
    ]},
    {n:4,icon:'🔐',titleEn:'Data Security',titleHi:'डेटा सुरक्षा',items:[
      '256-bit AES encryption for all data stored at rest on our servers',
      'SSL/TLS (HTTPS) encryption for all data in transit between your device and our servers',
      'Role-based access controls — only authorised BCPL staff access player data',
      'Regular third-party security audits and penetration testing (quarterly)',
      'Cashfree processes payments in a PCI-DSS compliant environment — BCPL never sees card data',
      'In the event of a data breach, affected users will be notified within 72 hours',
    ]},
    {n:5,icon:'✊',titleEn:'Your Rights',titleHi:'आपके अधिकार',items:[
      'Right to Access: request a copy of all personal data BCPL holds about you',
      'Right to Correct: request correction of inaccurate or incomplete personal data',
      'Right to Delete: request account deletion — available before shortlisting stage only',
      'Right to Withdraw Consent: withdraw from marketing communications at any time',
      'Right to Portability: receive your data in a structured, machine-readable format',
      'To exercise any right, email: support@bcplt20.com — we respond within 7 business days',
    ]},
    {n:6,icon:'🍪',titleEn:'Cookie Policy',titleHi:'Cookie नीति',items:[
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

        <section style={{padding:'clamp(48px,8vw,80px) 0 clamp(40px,6vw,56px)',textAlign:'center',animation:'fadeSlide 0.6s ease both'}}>
          <div className="wrap">
            <div className="tag-pill" style={{marginBottom:20}}>🔒 {t("YOUR DATA","आपका डेटा")}</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(36px,7vw,72px)',lineHeight:1,marginBottom:12,letterSpacing:'.01em'}}>
              <span style={{color:'#fff',display:'block'}}>{t("PRIVACY","गोपनीयता")}</span>
              <span className="shimmer-gold" style={{display:'block'}}>{t("POLICY","नीति")}</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.48)',fontSize:12,fontWeight:700,letterSpacing:'0.06em',marginTop:18,fontFamily:'Montserrat,sans-serif',textTransform:'uppercase'}}>{t("Last updated: January 15, 2025","अपडेट: 15 जनवरी 2025")}</p>
            <p style={{color:'rgba(255,255,255,0.68)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:640,margin:'20px auto 0'}}>
              {t(
                "Your privacy matters to us. We are transparent about what data we collect, why we collect it, and who can see it.",
                "आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। हम स्पष्ट हैं कि हम क्या डेटा लेते हैं, क्यों लेते हैं और कौन इसे देख सकता है।"
              )}
            </p>
          </div>
        </section>

        <div className="wrap" style={{maxWidth:1280,margin:'0 auto',paddingBottom:56}}>
          <div className="legal-layout">
            
            <aside className="toc-sticky">
              <div style={{background:'linear-gradient(165deg,#0C1C30,#07101E)',border:'1px solid rgba(255,255,255,.09)',borderRadius:14,padding:'18px 14px',marginBottom:16}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13,letterSpacing:'.08em',color:'#E8B23D',marginBottom:14,textTransform:'uppercase'}}>{t("Contents","विषय-सूची")}</div>
                {sections.map(s=>(
                  <a
                    key={s.n}
                    href={`#section-${s.n}`}
                    className={`toc-item${activeSection===s.n?' active':''}`}
                    onClick={(e)=>{
                      e.preventDefault();
                      document.getElementById(`section-${s.n}`)?.scrollIntoView({behavior:'smooth',block:'start'});
                      setActiveSection(s.n);
                    }}
                  >
                    <div className="toc-num">{s.n}</div>
                    <span style={{flex:1,fontSize:13}}>{t(s.titleEn,s.titleHi)}</span>
                  </a>
                ))}
              </div>
            </aside>

            <div ref={contentRef}>
              <div className="mobile-jump">
                <select
                  className="jump-select"
                  value={activeSection || ''}
                  onChange={(e)=>{
                    const n = parseInt(e.target.value);
                    if(!isNaN(n)) document.getElementById(`section-${n}`)?.scrollIntoView({behavior:'smooth',block:'start'});
                  }}
                >
                  <option value="">{t("Jump to section...","विषय पर जाएं...")}</option>
                  {sections.map(s=>(
                    <option key={s.n} value={s.n}>{s.n}. {t(s.titleEn,s.titleHi)}</option>
                  ))}
                </select>
              </div>

              <div style={{background:'rgba(34,197,94,0.1)',border:'2px solid rgba(34,197,94,0.4)',borderLeft:'4px solid #22C55E',borderRadius:14,padding:'20px clamp(18px,4vw,26px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.1s both'}}>
                <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{fontSize:28,flexShrink:0}}>🛡️</span>
                  <div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:16,color:'#22C55E',marginBottom:4}}>{t("Our Privacy Promise","हमारा वादा")}</div>
                    <p style={{color:'rgba(255,255,255,0.85)',fontSize:'clamp(13px,2vw,15px)',fontWeight:600}}>
                      {t(
                        "We NEVER sell your data to third parties. Ever.",
                        "हम कभी भी आपका डेटा तीसरे पक्ष को नहीं बेचते। कभी नहीं।"
                      )} <strong style={{color:'#22C55E'}}>{t("Your information is used solely to run BCPL T20 Season 5.","आपकी जानकारी सिर्फ BCPL T20 Season 5 चलाने के लिए है।")}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {sections.map((s,idx)=>(
                <div key={s.n} id={`section-${s.n}`} className="glass-card" style={{padding:'clamp(22px,4vw,34px) clamp(18px,4vw,38px)',marginBottom:20,animation:`fadeSlide 0.5s ease ${0.12+idx*0.05}s both`,scrollMarginTop:'100px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,rgba(255,122,41,0.25),rgba(232,178,61,0.18))',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:14,color:'#FF7A29',flexShrink:0}}>{s.n}</div>
                    <span style={{fontSize:24,lineHeight:1}}>{s.icon}</span>
                    <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(17px,3vw,21px)',color:'#fff',lineHeight:1.2}}>{t(s.titleEn,s.titleHi)}</h2>
                  </div>
                  <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:12}}>
                    {s.items.map((item,i)=>(
                      <li key={i} style={{display:'flex',alignItems:'flex-start',gap:12,color:'rgba(255,255,255,0.78)',fontSize:'clamp(13px,2vw,15px)',lineHeight:1.75}}>
                        <OrangeDot/><span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.38)',borderLeft:'3px solid #FF7A29',borderRadius:14,padding:'20px clamp(18px,4vw,26px)',marginBottom:24,animation:'borderGlow 3s ease-in-out infinite'}}>
                <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                  <span style={{fontSize:26,flexShrink:0,lineHeight:1}}>📧</span>
                  <div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:7,letterSpacing:'.01em'}}>{t("Privacy Officer Contact","Privacy Officer से संपर्क करें")}</div>
                    <p style={{color:'rgba(255,255,255,0.85)',fontSize:'clamp(13px,2vw,15px)',lineHeight:1.7}}>
                      {t(
                        "For all privacy-related queries, requests, or complaints, contact us at",
                        "सभी privacy से जुड़े सवालों के लिए संपर्क करें"
                      )} <strong style={{color:'#E8B23D'}}>support@bcplt20.com</strong>. {t("We acknowledge all requests within 2 business days and resolve within 7.","हम 2 business days में acknowledgement और 7 में समाधान देते हैं।")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{padding:'clamp(24px,4vw,36px)',textAlign:'center'}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(19px,3vw,23px)',marginBottom:10,lineHeight:1.2}}>{t("Your Data Is Safe With Us","आपका डेटा हमारे पास सुरक्षित है")}</div>
                <p style={{color:'rgba(255,255,255,0.62)',fontSize:14,marginBottom:22,lineHeight:1.6}}>
                  {t(
                    "Register with confidence — join 10,000+ professionals who trust BCPL T20 Season 5.",
                    "विश्वास के साथ रजिस्टर करें — 10,000+ professionals BCPL T20 Season 5 पर भरोसा करते हैं।"
                  )}
                </p>
                <Link href="/register" className="btn-fire" style={{padding:'15px 38px',fontSize:16,width:'100%',maxWidth:320,textDecoration:'none',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                  {t("Register Securely →","सुरक्षित रजिस्टर करें →")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <BCPLFooter />
      </div>
      <MobileCTA/>
      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>
        {t("🏏 REGISTER NOW →","🏏 अभी रजिस्टर करें →")}
      </Link>
    </div>
  );
}
