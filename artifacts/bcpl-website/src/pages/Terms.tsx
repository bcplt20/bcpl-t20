import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { LegalDocHeader } from '../lib/legalMeta';
import { IcoCheck, IcoPen, IcoCard, IcoVideo, IcoStadium, IcoTrophy, IcoUsers, IcoLock, IcoWarn, IcoScale, IcoMail } from '../lib/icons';

const OrangeDot = () => (
  <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#FF7A29',marginRight:10,flexShrink:0,marginTop:7}}/>
);

export function Terms() {
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

  // NOTE: Legal entity is stated as "Kriparthi Playing 11 Pvt. Ltd." per the
  // owner-approved spec (matches LEGAL_ENTITY in api-server emailTheme.ts).
  // OWNER / COUNSEL DECISION REQUIRED: GST invoice/receipt templates print
  // "Kriparti Playing11 Pvt. Ltd." (as on the registered GSTIN). Confirm the
  // single correct legal spelling and align all copies.
  const sections: {n:number;icon:React.ReactNode;titleEn:string;titleHi:string;items:string[]}[] = [
    {n:1,icon:<IcoCheck size={24}/>,titleEn:'Introduction, Acceptance & Versioning',titleHi:'परिचय, स्वीकृति और वर्जन',items:[
      'These Terms & Conditions govern your registration for and participation in the Bhartiya Corporate Premier League (BCPL) Season 5 on www.bcplt20.com',
      'BCPL is operated by the legal entity Kriparthi Playing 11 Pvt. Ltd. ("BCPL", "we", "us"); www.bcplt20.com is the official platform',
      'These Terms apply to BCPL Season 5 unless expressly stated otherwise',
      'By registering, you accept these Terms & Conditions, the Privacy Notice, the Refund & Cancellation Policy and the Eligibility Criteria; together these form the agreement between you and BCPL',
      'These Terms are versioned; the document version you accept and the acceptance time are recorded with your registration',
      'BCPL may update these Terms; updates are published on this page with a new version number and effective date, and continued use after an update takes effect constitutes acceptance',
      'If you do not agree with any part of these Terms, do not register and do not make any payment',
    ]},
    {n:2,icon:<IcoPen size={24}/>,titleEn:'Eligibility, Registration & Account',titleHi:'योग्यता, रजिस्ट्रेशन और अकाउंट',items:[
      'Registration is open to working professionals aged 18 to 45 years as on the date of registration; earlier "no upper age limit" statements do not apply to Season 5',
      'You must meet the working-professional requirement and the cricket participation/gap requirement set out in the Eligibility Criteria, which forms part of these Terms',
      'You confirm you are not currently under a first-class, IPL or international professional cricket contract, as detailed in the Eligibility Criteria',
      'All registration information (name, date of birth, profession, identity, cricket history, playing role, trial city) must be accurate, complete and current',
      'Access is secured by phone-number and OTP verification; you are responsible for keeping your OTP and account access confidential and must not share them',
      'Only one registration per person is permitted per season — duplicate or multiple-identity registrations are treated as fraud and cancelled without refund',
      'Registration is personal and non-transferable; you may not register on behalf of another person',
      'Providing false, inaccurate or misleading information results in disqualification at any stage, including after advancement, without refund',
    ]},
    {n:3,icon:<IcoCard size={24}/>,titleEn:'Fees, GST & Payments',titleHi:'फीस, GST और भुगतान',items:[
      'Phase 1 fee: ₹299 plus applicable GST (Batsman/Bowler/Wicketkeeper) or ₹399 plus applicable GST (All-Rounder); the exact payable amount including GST is shown before payment',
      'Phase 2 fee — payable only if you are Phase 1 Qualified and choose to proceed: the applicable role-based fee plus applicable GST as displayed at the time of payment',
      'Payment of Phase 1 or Phase 2 fees does not guarantee Phase 1 Qualified status, Final Selection, Auction Pool entry, Player Auction purchase, Team Purchase, a player contract, remuneration or Tournament Participation',
      'Payments are processed by a third-party payment gateway; BCPL does not store your card or UPI credentials',
      'A GST invoice/receipt is issued for successful payments',
      'Refunds — including duplicate-payment, debited-but-pending and BCPL-cancellation cases — are governed exclusively by the Refund & Cancellation Policy, which is incorporated into these Terms',
    ]},
    {n:4,icon:<IcoVideo size={24}/>,titleEn:'Phase 1 — Video Trial & Assessment',titleHi:'फेज 1 — वीडियो ट्रायल और असेसमेंट',items:[
      'Phase 1 is a video-based cricket assessment; the fee provides participation in and access to the Phase 1 process for your selected playing role',
      'You must upload a 30–60 second cricket video showing your own, current performance within the applicable upload window shown in your dashboard',
      'Videos that are incomplete, invalid, corrupted, inaccessible, unclear or non-compliant may require re-upload under BCPL rules; late uploads may be rejected according to the applicable process',
      'Manipulated, edited-to-deceive or impersonated videos lead to disqualification',
      'Phase 1 results are targeted within 48 hours of video submission; a Phase 1 score/rank, where shown, does not by itself guarantee advancement, and Phase 1 Qualified does not equal Auction Pool qualification',
    ]},
    {n:5,icon:<span style={{fontSize:24,lineHeight:1}}>🤖</span>,titleEn:'Assessment Methodology & Technology-Assisted Evaluation',titleHi:'असेसमेंट पद्धति और तकनीक-सहायित मूल्यांकन',items:[
      'BCPL may use a combination of authorised personnel, coaches, software, automated systems, artificial-intelligence-assisted tools and third-party service providers to support assessment and administration',
      'These tools may support video processing, validation, analysis, scoring, quality control, fraud/integrity detection, ranking and operational review',
      'Technology output may be subject to validation; scores do not guarantee advancement',
      'BCPL does not claim that every submission is manually watched by a human panel, and does not claim that any tool is infallible',
      'BCPL may reject unusable, manipulated or non-compliant submissions; final business-stage decisions follow the published selection rules',
      'No participant may demand disclosure of proprietary algorithms, prompts, model weights or other participants\' assessments, subject to applicable legal rights',
    ]},
    {n:6,icon:<IcoStadium size={24}/>,titleEn:'Phase 2 — Physical Trial, Verification & KYC',titleHi:'फेज 2 — फिजिकल ट्रायल, सत्यापन और KYC',items:[
      'Phase 2 is available only to players who are Phase 1 Qualified and complete the applicable payment, declarations and verification',
      'Phase 2 is a standardised physical cricket trial conducted under the published Physical Trial Rules; you must attend your assigned slot, on time, at the assigned venue',
      'BCPL may verify your identity, professional/employment status and eligibility during Phase 2, including through KYC documents; you must provide emergency information as required',
      'Where identity/KYC verification uses PAN and/or Aadhaar, the verification is processed for eligibility and integrity checks under the BCPL Privacy Notice; verification output is retained as described there',
      'Trial scores are recorded digitally by authorised coaches/evaluators; submitted assessments are locked and corrections happen only through an audited process',
      'After your physical trial, advancement may be finalised after completion of the applicable BCPL trial window so eligible candidates can be ranked under the applicable season rules',
    ]},
    {n:7,icon:<IcoTrophy size={24}/>,titleEn:'Ranking, Selection, Auction Pool & No-Guarantee Chain',titleHi:'रैंकिंग, चयन, ऑक्शन पूल और कोई गारंटी नहीं',items:[
      'Advancement is merit-based under the published BCPL assessment framework; no fixed score guarantees advancement unless formally published by BCPL',
      'BCPL may apply published playing-role allocations, regional/zone representation, minimum assessment standards, national merit ranking and applicable tie-break rules when determining advancement to the Auction Pool',
      'Phase 1 Qualified does not guarantee Auction Pool qualification; Phase 2 payment does not guarantee selection; physical-trial completion does not guarantee entry to the final pool',
      'Auction Pool qualification means eligibility to participate in the Player Auction — it does not guarantee Team Purchase, a player contract, remuneration or Tournament Participation',
      'Auction participation does not guarantee a contract unless a player is purchased and all applicable squad/contract requirements are completed',
      'Trial evaluators do not decide final Auction Pool selection; advancement is determined centrally under the applicable season rules, subject to the published grievance process',
    ]},
    {n:8,icon:<IcoUsers size={24}/>,titleEn:'Participant Risk, Conduct & Prohibited Behaviour',titleHi:'जोखिम, आचरण और निषिद्ध व्यवहार',items:[
      'You participate in trials, matches and travel on the basis that you are responsible for your own medical fitness; personal health and accident insurance is strongly recommended',
      'You must comply with the BCPL Code of Conduct at all stages — registration, trials, Player Auction and tournament',
      'Prohibited conduct includes bribery, influence attempts, selection manipulation, impersonation, document or video manipulation, betting/gambling-related conduct, abuse, harassment, discrimination and unsafe behaviour',
      'BCPL provides first-response support at trials where operationally available, but you remain responsible for disclosing conditions that affect your ability to participate safely',
      'Notify BCPL promptly of any change that affects your eligibility',
    ]},
    {n:9,icon:<span style={{fontSize:24,lineHeight:1}}>©</span>,titleEn:'Intellectual Property, Image & Publicity',titleHi:'बौद्धिक संपदा, छवि और प्रचार',items:[
      'BCPL owns all match footage, broadcast content, highlight reels and official photographs',
      'BCPL name, logo, team names and all associated marks are trademarks of BCPL / Kriparthi Playing 11 Pvt. Ltd.; unauthorised commercial use is prohibited and actionable',
      'By registering and participating, you grant BCPL permission to capture and use photographs, video, audio and broadcast coverage of you at BCPL registration, trials, auction and tournament activities for BCPL promotion, media and archival purposes',
      'You grant BCPL a licence to use your submitted trial video and related content for assessment, integrity, operational and reasonable promotional purposes connected with BCPL',
      'Players may share their own personal performance clips on social media for personal promotion, but may not license or sell BCPL content without explicit written consent',
    ]},
    {n:10,icon:<IcoLock size={24}/>,titleEn:'Data Protection, Communications & Third Parties',titleHi:'डेटा सुरक्षा, संचार और थर्ड पार्टी',items:[
      'Your personal data is processed in accordance with the BCPL Privacy Notice',
      'Consent records — the accepted document versions and acceptance time — are stored with your registration',
      'BCPL uses third-party service providers (for example, payment, OTP/SMS, email, WhatsApp, cloud/storage, video processing, KYC/identity verification, and technology/assessment providers) under restricted processing for defined purposes',
      'Service communications (OTP, payment confirmations, results, trial notifications) are part of the service and are sent to your registered contact details',
      'Optional promotional communications are sent only with your separate marketing consent, which you may withdraw at any time',
      'BCPL applies reasonable administrative, technical and organisational safeguards; no internet system can offer absolute security',
    ]},
    {n:11,icon:<IcoWarn size={24}/>,titleEn:'Platform Availability, Fraud & Disqualification',titleHi:'प्लेटफ़ॉर्म उपलब्धता, धोखाधड़ी और अयोग्यता',items:[
      'BCPL aims to keep the platform available but does not warrant uninterrupted or error-free operation; the platform may rely on third-party services',
      'BCPL may suspend or cancel a registration, invalidate a score or attempt, remove a participant from a venue, or disqualify a participant for fraud, misrepresentation, integrity breaches or Code of Conduct violations',
      'Disqualification for fraud or false information does not create a refund right; refund treatment is governed by the Refund & Cancellation Policy',
    ]},
    {n:12,icon:<IcoScale size={24}/>,titleEn:'Liability, Force Majeure & Changes',titleHi:'दायित्व, फोर्स मेज्योर और बदलाव',items:[
      'To the maximum extent permitted by applicable law, BCPL is not liable for indirect, consequential or special losses arising from participation, non-advancement or platform issues',
      'To the maximum extent permitted by applicable law, BCPL\'s total aggregate liability arising out of your participation shall not exceed the fees paid by you to BCPL',
      'Nothing in these Terms excludes or limits any liability that cannot be excluded or limited under applicable law',
      'BCPL is not responsible for delays or failures caused by events beyond its reasonable control (force majeure), including natural events, public-health restrictions, government orders or venue failure',
      'BCPL may change rules, formats, schedules, venues or dates for operational, safety or regulatory reasons; material changes are communicated through official channels',
    ]},
    {n:13,icon:<span style={{fontSize:24,lineHeight:1}}>§</span>,titleEn:'Governing Law, Grievance, Severability & Entire Agreement',titleHi:'कानून, शिकायत, विच्छेदनीयता और संपूर्ण अनुबंध',items:[
      'These Terms are governed by the laws of the Republic of India',
      'Disputes should first be submitted to BCPL\'s Grievance Redressal process — email support@bcplt20.com with your Registration ID',
      'The dispute-resolution forum and jurisdiction are as set out in the approved BCPL legal wording. OWNER / COUNSEL DECISION REQUIRED: confirm the governing court/jurisdiction and any arbitration seat before publication.',
      'If any provision of these Terms is held invalid or unenforceable, the remaining provisions continue in full force (severability)',
      'A failure or delay by BCPL to enforce any provision is not a waiver of that provision (waiver)',
      'These Terms, together with the Privacy Notice, Refund & Cancellation Policy, Eligibility Criteria, Code of Conduct and the published rules, form the entire agreement; where documents conflict, the specific rule for the relevant stage prevails (entire agreement / document hierarchy)',
      'The version number and effective date for these Terms are shown in the document header above',
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
              <span style={{color:'#fff',display:'block'}}>{t("TERMS &","नियम और")}</span>
              <span className="shimmer-gold" style={{display:'block'}}>{t("CONDITIONS","शर्तें")}</span>
            </h1>
            <div style={{marginTop:22,textAlign:'left'}}>
              <LegalDocHeader doc="terms" />
            </div>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:640,margin:'20px auto 0'}}>
              {t(
                "Please read these Terms & Conditions carefully before registering for BCPL Season 5. These terms govern your participation in the league. This document applies to BCPL Season 5 unless expressly stated otherwise.",
                "BCPL Season 5 में रजिस्ट्रेशन से पहले ये नियम और शर्तें ध्यान से पढ़ें। ये आपकी लीग में भागीदारी को नियंत्रित करती हैं। यह दस्तावेज़ BCPL Season 5 पर लागू होता है, जब तक स्पष्ट रूप से अन्यथा न कहा गया हो।"
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
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:7,letterSpacing:'.01em'}}>{t("Questions About These Terms?","इन शर्तों के बारे में सवाल?")}</div>
                    <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,15px)',lineHeight:1.7}}>
                      {t(
                        "Contact our legal team at",
                        "हमारी legal team से संपर्क करें"
                      )} <strong style={{color:'#E8B23D'}}>support@bcplt20.com</strong>{t(
                        " or write to: Kriparthi Playing 11 Pvt. Ltd., New Delhi, India.",
                        " या लिखें: Kriparthi Playing 11 Pvt. Ltd., New Delhi, India."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{padding:'clamp(24px,4vw,36px)',textAlign:'center'}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(19px,3vw,23px)',marginBottom:10,lineHeight:1.2}}>{t("Ready to Join BCPL T20?","BCPL T20 join करने के लिए तैयार हैं?")}</div>
                <p style={{color:'rgba(255,255,255,0.88)',fontSize:14,marginBottom:22,lineHeight:1.6}}>
                  {t(
                    "By registering, you accept these terms. See you on the field!",
                    "रजिस्टर करके आप ये शर्तें स्वीकार करते हैं। मैदान में मिलेंगे!"
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
