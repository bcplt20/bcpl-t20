import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { LegalDocHeader } from '../lib/legalMeta';
import { IcoTarget, IcoStar, IcoBan, IcoKey, IcoCamera, IcoMegaphone, IcoImage, IcoScale, IcoWarn, IcoPages, IcoMail } from '../lib/icons';

const OrangeDot = () => (
  <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#FF7A29',marginRight:10,flexShrink:0,marginTop:7}}/>
);

export function BrandUsagePolicy() {
  const { t } = useLang();
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll spy for desktop sticky TOC
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
    @media(min-width:640px){.wrap{padding:0 24px}}
    @media(min-width:768px){.wrap{padding:0 32px}}
    @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}}
    .btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;display:inline-flex;align-items:center;justify-content:center;min-height:44px;}
    .btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
    .glass-card{background:linear-gradient(135deg,rgba(30,55,105,0.9),rgba(23,43,81,0.85));backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.18);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.18);}
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
    .toc-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;cursor:pointer;transition:all .2s;text-decoration:none;color:rgba(255,255,255,0.88);font-size:14px;border:1px solid transparent;min-height:44px;}
    .toc-item:hover{background:rgba(255,122,41,.08);color:#FF7A29;border-color:rgba(255,122,41,.2);}
    .toc-item.active{background:rgba(255,122,41,.12);color:#FF7A29;border-color:rgba(255,122,41,.35);font-weight:700;}
    .toc-num{width:26px;height:26px;border-radius:50%;background:rgba(255,122,41,.15);border:1px solid rgba(255,122,41,.3);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#FF7A29;flex-shrink:0;font-family:Montserrat,sans-serif;}
    .mobile-jump{display:block;margin-bottom:24px;}
    @media(min-width:1024px){.mobile-jump{display:none;}}
    .jump-select{width:100%;background:rgba(23,46,75,.9);border:1.5px solid rgba(255,122,41,.3);border-radius:var(--r);color:#F0EDE8;padding:14px 16px;font-family:Inter,sans-serif;font-size:15px;font-weight:600;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='%23FF7A29'%3E%3Cpath d='M0 0l6 8 6-8z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 16px center;background-size:12px;padding-right:44px;min-height:52px;}
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

  const sections: {n:number;icon:React.ReactNode;titleEn:string;titleHi:string;items:string[]}[] = [
    {n:1,icon:<IcoTarget size={24}/>,titleEn:'Purpose & Scope',titleHi:'उद्देश्य और दायरा',items:[
      'This Brand, Photo & Logo Usage Policy governs how the intellectual property of the Bhartiya Corporate Premier League (BCPL T20) may and may not be used by any person or organisation',
      'It applies to all visitors, players, attendees, media, sponsors, partners and third parties who access www.bcplt20.com, attend BCPL events, or otherwise come into contact with BCPL materials',
      'This policy forms part of, and should be read together with, the BCPL Terms & Conditions, Privacy Policy, Eligibility Criteria and published rules',
      'By using, downloading or viewing any BCPL material, you agree to the terms of this policy',
    ]},
    {n:2,icon:<IcoStar size={24}/>,titleEn:'Ownership of BCPL Intellectual Property',titleHi:'BCPL बौद्धिक संपदा का स्वामित्व',items:[
      'The BCPL name and the "Bhartiya Corporate Premier League (BCPL T20)" identity are owned or controlled by Kriparti India Private Limited',
      'The BCPL T20 logo, the ball device, and all "Season 5" marks and season branding are owned by Kriparti India Private Limited',
      'Franchise and team names, team logos, jerseys and associated marks are owned or controlled by Kriparti India Private Limited',
      'Taglines and campaign lines, including #OfficeSeStadiumTak, are the property of Kriparti India Private Limited',
      'All website content — text, layout, graphics, design, code and imagery on www.bcplt20.com — is owned by Kriparti India Private Limited',
      'All BCPL documents and policies (including the Terms & Conditions, Privacy Policy, Eligibility Criteria and rules) are the property of Kriparti India Private Limited',
      'All photographs and videos captured at, or produced for, BCPL activities are owned or controlled by Kriparti India Private Limited',
      'These rights are protected under applicable Indian intellectual-property law; no ownership or interest in any of the above passes to you through access or use',
    ]},
    {n:3,icon:<IcoBan size={24}/>,titleEn:'Prohibited Uses',titleHi:'निषिद्ध उपयोग',items:[
      'You may not reproduce, copy, scrape, mirror or republish the BCPL logo, team logos, photographs or match footage on any other website, application, social-media page or platform',
      'You may not copy or republish any BCPL document or policy — including the Terms & Conditions, Privacy Policy, Eligibility Criteria or rules — in whole or in part, on any other website, app or channel',
      'You may not use any BCPL mark, name, logo or content for merchandising or on goods for sale',
      'You may not register or use domain names, social-media handles, account names or business names that are identical or confusingly similar to BCPL marks',
      'You may not use BCPL logos, photographs, videos, text or documents to train, fine-tune or build artificial-intelligence models or datasets without the prior written consent of Kriparti India Private Limited',
      'You may not alter, distort, recolour or combine BCPL marks with other logos or content in a way that misrepresents an association with BCPL',
    ]},
    {n:4,icon:<IcoKey size={24}/>,titleEn:'No Implied Licence',titleHi:'कोई निहित लाइसेंस नहीं',items:[
      'Access to www.bcplt20.com does not grant you any licence or right to use BCPL intellectual property beyond ordinary viewing of the website',
      'Viewing or downloading a BCPL document is permitted for your own personal reference only',
      'A personal download does not permit republication, redistribution, commercial use or public display of the document or its contents',
      'Any use not expressly permitted by this policy requires the prior written permission of Kriparti India Private Limited',
    ]},
    {n:5,icon:<IcoCamera size={24}/>,titleEn:'Player & Attendee Images',titleHi:'खिलाड़ी और उपस्थित लोगों की छवियां',items:[
      'BCPL may capture and use photographs and videos of players and attendees at registration, trials, auction and tournament activities, in accordance with the BCPL Privacy Policy',
      'Such images may be used by BCPL for its own promotional, media, archival and operational purposes',
      'Third parties may not commercially exploit, sell, license or republish images of BCPL players or attendees',
      'Requests relating to the use of a specific image should be directed to info@bcplt20.com and are handled under the BCPL Privacy Policy',
    ]},
    {n:6,icon:<IcoMegaphone size={24}/>,titleEn:'Media & Press Use',titleHi:'मीडिया और प्रेस उपयोग',items:[
      'Genuine media and press may use short, factual quotations about BCPL, with clear attribution to the Bhartiya Corporate Premier League (BCPL T20)',
      'Any use beyond short factual quotation — including reproduction of logos, photographs, footage or substantial text — requires prior written permission',
      'To request media permissions or official assets, contact info@bcplt20.com before publication',
      'Media use must not imply any endorsement, partnership or official association that has not been agreed in writing',
    ]},
    {n:7,icon:<IcoImage size={24}/>,titleEn:'Sponsors & Partners',titleHi:'प्रायोजक और भागीदार',items:[
      'Sponsors and partners may use BCPL marks only within the strict terms of their signed written agreement with Kriparti India Private Limited',
      'BCPL marks provided to a sponsor or partner may be used only for the specific purposes, period and territory set out in that agreement',
      'On expiry or termination of the agreement, the sponsor or partner must stop all use of BCPL marks',
      'Sponsors and partners may not sub-licence or transfer any right to use BCPL marks to a third party without written consent',
    ]},
    {n:8,icon:<IcoScale size={24}/>,titleEn:'Enforcement',titleHi:'प्रवर्तन',items:[
      'BCPL may issue takedown requests to websites, apps, platforms and hosting providers to remove infringing use of its intellectual property',
      'BCPL may pursue legal remedies for infringement, including under the Copyright Act 1957 and the Trade Marks Act 1999 of India',
      'BCPL may seek injunctions, damages, delivery-up and other remedies available under applicable law',
      'Where BCPL enforces its rights against an infringer, it may seek to recover its costs and legal expenses to the extent permitted by law',
    ]},
    {n:9,icon:<IcoWarn size={24}/>,titleEn:'Reporting Misuse',titleHi:'दुरुपयोग की रिपोर्ट करना',items:[
      'If you become aware of any misuse of BCPL intellectual property, please report it to info@bcplt20.com',
      'Include full details — the URL or platform, screenshots, the mark or content affected, and the date you observed the misuse',
      'Reporting helps BCPL protect its brand and the interests of players, attendees, sponsors and partners',
    ]},
    {n:10,icon:<IcoPages size={24}/>,titleEn:'Governing Law & Updates',titleHi:'लागू कानून और अपडेट',items:[
      'This policy is governed by the laws of the Republic of India, with New Delhi, India as the place of reference for its administration',
      'BCPL may update this policy from time to time; the current version and date are shown in the document header above',
      'Continued use of www.bcplt20.com, or of BCPL materials, after an update takes effect constitutes acceptance of the updated policy',
      'For any questions about this policy, contact info@bcplt20.com',
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

        <section style={{padding:'clamp(48px,8vw,80px) 0 clamp(40px,6vw,56px)',textAlign:'center',animation:'fadeSlide 0.6s ease both'}}>
          <div className="wrap">
            <div className="tag-pill" style={{marginBottom:20}}><IcoScale size={14}/> {t("LEGAL","कानूनी")}</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(36px,7vw,72px)',lineHeight:1,marginBottom:12,letterSpacing:'.01em'}}>
              <span style={{color:'#fff',display:'block'}}>{t("BRAND, PHOTO &","ब्रांड, फोटो और")}</span>
              <span className="shimmer-gold" style={{display:'block'}}>{t("LOGO USAGE","लोगो उपयोग")}</span>
            </h1>
            <div style={{marginTop:22,textAlign:'left'}}>
              <LegalDocHeader doc="brandUsage" />
            </div>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:640,margin:'20px auto 0'}}>
              {t(
                "This policy explains how the BCPL name, logo, team marks, taglines, website content, documents, photographs and videos may be used — and the uses that are not permitted. Please read it before using any BCPL material.",
                "यह नीति बताती है कि BCPL नाम, लोगो, टीम मार्क्स, टैगलाइन, वेबसाइट कंटेंट, दस्तावेज़, फोटो और वीडियो का उपयोग कैसे किया जा सकता है — और कौन-से उपयोग अनुमत नहीं हैं। किसी भी BCPL सामग्री का उपयोग करने से पहले इसे पढ़ें।"
              )}
            </p>
          </div>
        </section>

        <div className="wrap" style={{maxWidth:1280,margin:'0 auto',paddingBottom:56}}>
          <div className="legal-layout">

            {/* DESKTOP STICKY TOC */}
            <aside className="toc-sticky">
              <div style={{background:'linear-gradient(165deg,#213B5C,#1D2E49)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:14,padding:'18px 14px',marginBottom:16}}>
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

            {/* CONTENT */}
            <div ref={contentRef}>
              {/* MOBILE JUMP SELECTOR */}
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

              {sections.map((s,idx)=>(
                <div key={s.n} id={`section-${s.n}`} className="glass-card" style={{padding:'clamp(22px,4vw,34px) clamp(18px,4vw,38px)',marginBottom:20,animation:`fadeSlide 0.5s ease ${0.08+idx*0.05}s both`,scrollMarginTop:'100px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,rgba(255,122,41,0.25),rgba(232,178,61,0.18))',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:14,color:'#FF7A29',flexShrink:0}}>{s.n}</div>
                    <span style={{lineHeight:1,color:'#FF7A29',display:'inline-flex',alignItems:'center'}}>{s.icon}</span>
                    <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(17px,3vw,21px)',color:'#fff',lineHeight:1.2}}>{t(s.titleEn,s.titleHi)}</h2>
                  </div>
                  <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:12}}>
                    {s.items.map((item,i)=>(
                      <li key={i} style={{display:'flex',alignItems:'flex-start',gap:12,color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,15px)',lineHeight:1.75}}>
                        <OrangeDot/><span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.38)',borderLeft:'3px solid #FF7A29',borderRadius:14,padding:'20px clamp(18px,4vw,26px)',marginBottom:24,animation:'borderGlow 3s ease-in-out infinite'}}>
                <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                  <span style={{flexShrink:0,lineHeight:1,color:'#FF7A29',display:'inline-flex'}}><IcoMail size={26}/></span>
                  <div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:7,letterSpacing:'.01em'}}>{t("Questions or Permission Requests?","सवाल या अनुमति के लिए?")}</div>
                    <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,15px)',lineHeight:1.7}}>
                      {t(
                        "For brand permissions, media assets or to report misuse, contact us at",
                        "ब्रांड अनुमति, मीडिया एसेट्स या दुरुपयोग की रिपोर्ट के लिए संपर्क करें"
                      )} <strong style={{color:'#E8B23D'}}>info@bcplt20.com</strong>{t(
                        " or write to: Kriparti India Private Limited, New Delhi, India.",
                        " या लिखें: Kriparti India Private Limited, New Delhi, India."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{padding:'clamp(24px,4vw,36px)',textAlign:'center'}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(19px,3vw,23px)',marginBottom:10,lineHeight:1.2}}>{t("Ready to Join BCPL T20?","BCPL T20 join करने के लिए तैयार हैं?")}</div>
                <p style={{color:'rgba(255,255,255,0.88)',fontSize:14,marginBottom:22,lineHeight:1.6}}>
                  {t(
                    "Respecting the BCPL brand keeps the league fair for everyone. See you on the field!",
                    "BCPL ब्रांड का सम्मान लीग को सबके लिए निष्पक्ष रखता है। मैदान में मिलेंगे!"
                  )}
                </p>
                <Link href="/register" className="btn-fire" style={{padding:'15px 38px',fontSize:16,width:'100%',maxWidth:320,textDecoration:'none',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                  {t("Register — ₹299 + GST →","₹299 + GST में रजिस्टर करें →")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <BCPLFooter />
      </div>
      <StickyRegisterCTA />
      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>
        {t("REGISTER NOW →","अभी रजिस्टर करें →")}
      </Link>
    </div>
  );
}
