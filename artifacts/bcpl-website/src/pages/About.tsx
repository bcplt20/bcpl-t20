import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';
import { StickyRegisterCTA } from "../components/StickyRegisterCTA";
import { IcoBulb, IcoBat, IcoStadium, IcoRupee, IcoCheck } from '../lib/icons';

type IcoComp = (p: { size?: number; style?: React.CSSProperties }) => React.ReactElement;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#1C2B47; }
.wrap { max-width:1200px; margin:0 auto; padding:0 20px; }
.desk-nav { display:none; align-items:center; gap:22px; }
.ham-btn { display:flex; }
@media(min-width:768px){ .wrap{padding:0 32px} }
@media(min-width:1280px){ .wrap{padding:0 48px} }
@media(min-width:1024px){ .desk-nav{display:flex!important;} .ham-btn{display:none!important;} }
.v3-kicker { font-family:Inter,sans-serif; font-weight:700; font-size:12px; letter-spacing:.22em; color:#E8B23D; text-transform:uppercase; }
.v3-h { font-family:'Barlow Condensed','Mukta','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; line-height:.95; letter-spacing:.015em; }
.btn-fire { background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%); border:none; border-radius:14px; color:#fff; font-family:var(--font-head); font-weight:800; cursor:pointer; box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2); transition:transform 0.15s,box-shadow 0.2s; letter-spacing:0.02em; animation:pulseGlow 3s ease-in-out infinite; }
.btn-fire:hover { transform:translateY(-2px); box-shadow:0 14px 40px rgba(255,122,41,0.6); }
.btn-fire:active { transform:scale(0.97); }
.glass-card { background:linear-gradient(135deg,rgba(30,55,105,0.9),rgba(23,43,81,0.85)); backdrop-filter:blur(32px); border:1px solid rgba(255,255,255,0.18); border-radius:20px; box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.18); }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
.tag-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,122,41,0.12); border:1px solid rgba(255,122,41,0.3); border-radius:100px; padding:5px 14px; font-size:11px; font-weight:700; font-family:var(--font-head); color:#FF7A29; letter-spacing:0.1em; }
@keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes floatUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulseGlow { 0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)} 50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes scanPulse { 0%,100%{opacity:0.03} 50%{opacity:0.08} }
@keyframes liveBlip { 0%,100%{opacity:1} 50%{opacity:0.2} }
@keyframes floatParticle { 0%{transform:translateY(0) rotate(0deg);opacity:0.4} 50%{opacity:0.8} 100%{transform:translateY(-80px) rotate(180deg);opacity:0} }
@keyframes fadeSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes borderGlow { 0%,100%{border-color:rgba(255,122,41,0.3)} 50%{border-color:rgba(255,122,41,0.8)} }
@keyframes countUp { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
        /* float-reg-btn */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:var(--font-head); font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
        @media(max-width:1023px){ .float-reg-btn { display:none; } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
`;

function AmbientBg() {
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.07}} viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
        <path d="M0,400 Q320,320 640,380 Q960,440 1280,360 L1280,720 L0,720 Z" fill="#273E6E"/>
        <rect x="80" y="100" width="8" height="300" fill="#334"/>
        <rect x="76" y="80" width="16" height="12" fill="#445" rx="2"/>
        <rect x="1192" y="100" width="8" height="300" fill="#334"/>
        <rect x="1188" y="80" width="16" height="12" fill="#445" rx="2"/>
        <rect x="440" y="420" width="400" height="160" fill="none" stroke="#334" strokeWidth="2"/>
      </svg>
      {[
        {top:'15%',left:'8%',color:'#FF7A29',delay:'0s',size:3},
        {top:'35%',left:'92%',color:'#E8B23D',delay:'1.2s',size:3},
        {top:'60%',left:'5%',color:'#fff',delay:'2.1s',size:2},
        {top:'75%',left:'88%',color:'#FF7A29',delay:'0.7s',size:3},
        {top:'25%',left:'50%',color:'#E8B23D',delay:'1.8s',size:2},
        {top:'85%',left:'30%',color:'#fff',delay:'0.4s',size:3},
        {top:'45%',left:'70%',color:'#FF7A29',delay:'2.5s',size:2},
        {top:'10%',left:'65%',color:'#E8B23D',delay:'1.0s',size:3},
      ].map((p,i)=>(
        <div key={i} style={{position:'absolute',top:p.top,left:p.left,width:p.size,height:p.size,borderRadius:'50%',background:p.color,animation:`floatParticle 6s ease-in-out ${p.delay} infinite`}}/>
      ))}
      <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
    </div>
  );
}

const stats = [
  {num:'2.5L+',labelEn:'Players',labelHi:'खिलाड़ी',subEn:'registered across all seasons',subHi:'सभी seasons में register'},
  {num:'Pan-India',labelEn:'Trial Network',labelHi:'Trial नेटवर्क',subEn:'growing every season',subHi:'हर season बढ़ रहा'},
  {num:'4',labelEn:'Seasons',labelHi:'Seasons',subEn:'completed since 2023',subHi:'2023 से पूरे'},
  {num:'10',labelEn:'Franchises',labelHi:'Franchises',subEn:'competing in Season 5',subHi:'Season 5 में'},
];

const timeline = [
  {year:'2023',textEn:'Season 1 — Founded in Delhi. Working professionals took the field for the first time. One unforgettable dream born.',textHi:'Season 1 — Delhi में शुरुआत। Working professionals पहली बार मैदान में उतरे। एक अविस्मरणीय सपना जन्मा।'},
  {year:'2024',textEn:'Season 2 — Growth exploded. Players joined from cities across India. Franchise auction system introduced. Corporate cricket found its identity.',textHi:'Season 2 — तेज़ी से बढ़ोतरी। पूरे भारत के शहरों से खिलाड़ी जुड़े। Franchise auction system शुरू। Corporate cricket को अपनी पहचान मिली।'},
  {year:'2025',textEn:'Season 3 & 4 — Two powerful seasons. Registrations grew rapidly across cities, with national media coverage. BCPL established itself as India\'s corporate cricket league.',textHi:'Season 3 और 4 — दो शानदार seasons। Registrations कई शहरों में तेज़ी से बढ़े, national media coverage भी मिला। BCPL भारत की corporate cricket league के रूप में स्थापित हुई।'},
  {year:'2026',textEn:'Season 4 concluded — a large wave of players registered across cities. Tournament held in October 2026. The stage was set for the grandest season.',textHi:'Season 4 समाप्त — कई शहरों से खिलाड़ियों की बड़ी लहर register हुई। October 2026 में tournament हुआ। सबसे बड़े season के लिए तैयारी।'},
  {year:'2026–27',textEn:'Season 5 — Registrations open now. 50+ trial cities across India. 10 franchise teams. ₹15 Crore+ prize pool. India\'s corporate cricket league for working professionals awaits you.',textHi:'Season 5 — Registrations अब खुले हैं। पूरे भारत में 50+ trial cities। 10 franchise teams। ₹15 करोड़+ prize pool। Working professionals के लिए भारत की corporate cricket league आपका इंतज़ार कर रही है।'},
];

const diffs: {icon:IcoComp;titleEn:string;titleHi:string;bodyEn:string;bodyHi:string}[] = [
  {icon:IcoBat,titleEn:'vs Local Cricket',titleHi:'vs Local Cricket',bodyEn:'No politics. No favoritism. Pure merit through criteria-based video assessment. Every applicant gets a fair, anonymous evaluation.',bodyHi:'कोई पक्षपात नहीं। Pure merit through criteria-based video assessment। हर applicant को fair, anonymous evaluation मिलती है।'},
  {icon:IcoStadium,titleEn:'vs Amateur Leagues',titleHi:'vs Amateur Leagues',bodyEn:'Professional grounds. Franchise system. Real auctions. This is as close to IPL as corporate cricket gets.',bodyHi:'Professional grounds। Franchise system। Real auctions। Corporate cricket में IPL के सबसे करीब।'},
  {icon:IcoRupee,titleEn:'vs Doing Nothing',titleHi:'vs कुछ न करना',bodyEn:'₹299 gets you in. No other league offers this entry point for a shot at professional-grade cricket.',bodyHi:'₹299 में entry। कोई दूसरी league इतने कम में professional-grade cricket का मौका नहीं देती।'},
];


const ROUTE_MAP: Record<string,string> = {
  'Home':'/', 'HOME':'/',
  'Match Center':'/match-center', 'MATCH CENTER':'/match-center',
  'Teams':'/teams', 'TEAMS':'/teams',
  'Sponsors':'/sponsors', 'SPONSORS':'/sponsors',
  'Photos':'/photos', 'PHOTOS':'/photos',
  'Videos':'/videos', 'VIDEOS':'/videos',
  'About':'/about', 'ABOUT':'/about',
  'FAQ':'/faq',
  'Contact':'/contact', 'CONTACT':'/contact',
  'Schedule':'/schedule',
  'Points Table':'/points-table',
};

export function About() {
  const { t } = useLang();

  return (
    <div style={{minHeight:'100vh',background:'#1C2B47',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <SiteHeader active="About" />

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'clamp(80px,12vh,130px) 0 clamp(48px,7vw,80px)',textAlign:'center'}}>
        <div className="wrap">
          <div className="v3-kicker" style={{marginBottom:16,animation:'floatUp 0.6s ease both'}}>{t("OUR STORY","हमारी कहानी")}</div>
          <h1 className="v3-h" style={{fontSize:'clamp(40px,9vw,88px)',marginBottom:20,animation:'floatUp 0.7s ease 0.1s both'}}>
            <span style={{color:'#fff',display:'block'}}>{t("WHERE OFFICES","जहां ऑफिसें")}</span>
            <span className="shimmer-gold" style={{display:'block'}}>{t("MEET STADIUMS.","स्टेडियम बनती हैं।")}</span>
          </h1>
          <p style={{color:'rgba(255,255,255,0.72)',fontSize:'clamp(14px,2vw,17px)',maxWidth:640,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            {t("India's corporate cricket league. Turning working professionals into franchise cricketers since 2023.","भारत की कॉर्पोरेट क्रिकेट लीग। 2023 से working professionals को franchise cricketers बना रहे हैं।")}
          </p>
        </div>
      </section>

      {/* THE PROBLEM → THE MISSION */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'clamp(20px,5vw,40px) clamp(16px,4vw,48px)',borderLeft:'3px solid #E8B23D',maxWidth:860,margin:'0 auto',animation:'fadeSlide 0.8s ease 0.4s both'}}>
            <div style={{marginBottom:16,color:'#E8B23D',display:'flex'}}><IcoBulb size={32}/></div>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(17px,2.2vw,21px)',lineHeight:1.75,fontStyle:'italic'}}>
              {t("Every working professional who watched IPL and thought 'I could have played' deserves a real shot. Millions stopped competitive cricket when work took over. BCPL exists to give them the stage they never got.","हर working professional जो IPL देखते हुए सोचता है 'मैं भी खेल सकता था' — उसे एक असली मौका मिलना चाहिए। लाखों लोगों ने काम की वजह से competitive cricket छोड़ दी। BCPL उन्हें वो stage देने के लिए है जो उन्हें कभी नहीं मिला।")}
            </p>
            <div style={{marginTop:20,color:'var(--ink-3)',fontSize:13,fontFamily:'var(--font-head)',fontWeight:700,letterSpacing:'0.08em'}}>— {t("BCPL FOUNDING MISSION","BCPL की स्थापना मिशन")}</div>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:20}}>
            {stats.map((s,i)=>(
              <div key={i} className="glass-card" style={{padding:'36px 24px',textAlign:'center',animation:`countUp 3s ease ${i*0.4}s infinite`}}>
                <div style={{fontFamily:'var(--font-head)',fontWeight:900,fontSize:52,color:'#FF7A29',lineHeight:1,marginBottom:8}}>{s.num}</div>
                <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:16,color:'#fff',marginBottom:6}}>{t(s.labelEn,s.labelHi)}</div>
                <div style={{color:'var(--ink-3)',fontSize:12,fontFamily:'Inter,sans-serif'}}>{t(s.subEn,s.subHi)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="tag-pill" style={{marginBottom:16}}>{t("OUR JOURNEY","हमारा सफर")}</div>
            <h2 className="v3-h" style={{fontSize:'clamp(30px,4vw,48px)',color:'#fff'}}>{t("Five Seasons of ","पाँच Seasons की ")} <span className="shimmer-gold">{t("Legacy","विरासत")}</span></h2>
          </div>
          <div style={{position:'relative',maxWidth:700,margin:'0 auto'}}>
            <div style={{position:'absolute',left:28,top:0,bottom:0,width:2,background:'linear-gradient(180deg,#E8B23D,rgba(232,178,61,0.2))'}}/>
            {timeline.map((tm,i)=>(
              <div key={i} style={{display:'flex',gap:28,marginBottom:i<timeline.length-1?40:0,position:'relative',animation:`fadeSlide 0.6s ease ${i*0.15}s both`}}>
                <div style={{width:58,height:58,borderRadius:'50%',background:'linear-gradient(135deg,#FF7A29,#C94E0E)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-head)',fontWeight:900,fontSize:13,color:'#fff',flexShrink:0,zIndex:1,boxShadow:'0 0 0 4px rgba(255,122,41,0.2)'}}>
                  {tm.year}
                </div>
                <div className="glass-card" style={{flex:1,padding:'20px 24px'}}>
                  <p style={{color:'rgba(255,255,255,0.88)',fontSize:15,lineHeight:1.6}}>{t(tm.textEn,tm.textHi)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE'RE DIFFERENT */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="tag-pill" style={{marginBottom:16}}>{t("WHY BCPL","क्यों BCPL")}</div>
            <h2 className="v3-h" style={{fontSize:'clamp(30px,4vw,48px)',color:'#fff'}}>{t("How We're ","हम कैसे ")} <span className="shimmer-gold">{t("Different","अलग हैं")}</span></h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:24}}>
            {diffs.map((d,i)=>(
              <div key={i} className="glass-card" style={{padding:'36px 28px',borderTop:'3px solid #FF7A29',transition:'transform 0.2s',animation:`fadeSlide 0.7s ease ${i*0.15}s both`}}>
                <div style={{marginBottom:16,color:'#FF7A29',display:'flex'}}><d.icon size={36}/></div>
                <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:17,color:'#FF7A29',marginBottom:12}}>{t(d.titleEn,d.titleHi)}</div>
                <p style={{color:'rgba(255,255,255,0.88)',fontSize:14,lineHeight:1.7}}>{t(d.bodyEn,d.bodyHi)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE MODEL: FROM OFFICE TO STADIUM ── */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="tag-pill" style={{marginBottom:16}}>{t("THE MODEL","मॉडल")}</div>
            <h2 className="v3-h" style={{fontSize:'clamp(30px,4vw,48px)',color:'#fff'}}>{t("From Office to ","ऑफिस से ")} <span className="shimmer-gold">{t("Stadium","स्टेडियम तक")}</span></h2>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:640,margin:'16px auto 0'}}>
              {t("BCPL runs on a clear two-phase model, so working professionals can be assessed fairly before ever stepping onto a franchise stage.","BCPL एक साफ़ दो-phase model पर चलती है, ताकि working professionals का franchise stage पर पहुँचने से पहले निष्पक्ष मूल्यांकन हो सके।")}
            </p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:20,maxWidth:900,margin:'0 auto'}}>
            <div className="glass-card" style={{padding:'28px 24px',borderTop:'3px solid #E8B23D',animation:'fadeSlide 0.6s ease 0.05s both'}}>
              <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:18,color:'#E8B23D',marginBottom:10}}>{t("Phase 1 — Video Assessment","Phase 1 — वीडियो मूल्यांकन")}</div>
              <p style={{color:'rgba(255,255,255,0.88)',fontSize:14,lineHeight:1.7}}>{t("Register and submit your prescribed cricket video within the permitted window. Your submission is assessed against published role-specific criteria.","Register करें और तय window में अपना cricket video submit करें। आपकी submission published role-specific criteria पर परखी जाती है।")}</p>
            </div>
            <div className="glass-card" style={{padding:'28px 24px',borderTop:'3px solid #FF7A29',animation:'fadeSlide 0.6s ease 0.15s both'}}>
              <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:18,color:'#FF7A29',marginBottom:10}}>{t("Phase 2 — Physical Trial","Phase 2 — फिजिकल ट्रायल")}</div>
              <p style={{color:'rgba(255,255,255,0.88)',fontSize:14,lineHeight:1.7}}>{t("Qualified players attend a standardised on-ground trial in their allotted city, scored on role-specific criteria out of 100 — leading toward the Auction Pool.","Qualified players अपने allotted शहर में एक standardised on-ground trial देते हैं, जो role-specific criteria पर 100 में से scored होता है — Auction Pool की ओर।")}</p>
            </div>
          </div>
          <p style={{color:'rgba(255,255,255,0.72)',fontSize:13,lineHeight:1.7,maxWidth:720,margin:'24px auto 0',textAlign:'center'}}>
            {t("Phase 1 qualification, Phase 2 completion and Auction Pool entry are distinct stages. None of them guarantees Team Purchase, a player contract or Tournament Participation.","Phase 1 qualification, Phase 2 completion और Auction Pool entry अलग-अलग stages हैं। इनमें से कोई भी Team Purchase, player contract या Tournament Participation की गारंटी नहीं देता।")}
          </p>
        </div>
      </section>

      {/* ── OPERATING PRINCIPLES ── */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="tag-pill" style={{marginBottom:16}}>{t("HOW WE OPERATE","हम कैसे काम करते हैं")}</div>
            <h2 className="v3-h" style={{fontSize:'clamp(30px,4vw,48px)',color:'#fff'}}>{t("Our Operating ","हमारे संचालन ")} <span className="shimmer-gold">{t("Principles","सिद्धांत")}</span></h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:20,maxWidth:1100,margin:'0 auto'}}>
            {[
              {titleEn:'Fairness',titleHi:'निष्पक्षता',bodyEn:'Assessment is based on cricket skill, not contacts or reputation. Every applicant is evaluated against the same published criteria.',bodyHi:'मूल्यांकन cricket skill पर आधारित — contacts या reputation पर नहीं। हर applicant को समान published criteria पर परखा जाता है।'},
              {titleEn:'Standardisation',titleHi:'मानकीकरण',bodyEn:'A single, role-specific assessment framework runs across authorised venues so players are measured consistently.',bodyHi:'एक ही role-specific assessment framework सभी authorised venues पर — ताकि players को एक जैसा मापा जाए।'},
              {titleEn:'Opportunity',titleHi:'अवसर',bodyEn:'A two-phase model — a video-based Phase 1 and an on-ground Phase 2 — opens a real route for working professionals across India.',bodyHi:'दो-phase model — video-based Phase 1 और on-ground Phase 2 — पूरे भारत के working professionals के लिए एक असली रास्ता।'},
              {titleEn:'Integrity',titleHi:'ईमानदारी',bodyEn:'Blind assessment, locked digital scoring and audited corrections protect the process from manipulation.',bodyHi:'Blind assessment, locked digital scoring और audited corrections process को manipulation से बचाते हैं।'},
              {titleEn:'Technology',titleHi:'तकनीक',bodyEn:'BCPL may use authorised personnel, coaches, software and assessment tools to support validation, scoring and operations.',bodyHi:'BCPL authorised personnel, coaches, software और assessment tools का उपयोग validation, scoring और operations के लिए कर सकती है।'},
              {titleEn:'Player Experience',titleHi:'खिलाड़ी अनुभव',bodyEn:'A clear journey — from registration to trial pass to result — with transparent stage names at every step.',bodyHi:'एक साफ़ journey — registration से trial pass से result तक — हर step पर transparent stage names के साथ।'},
            ].map((p,i)=>(
              <div key={i} className="glass-card" style={{padding:'28px 24px',borderTop:'2px solid rgba(255,122,41,0.3)',animation:`fadeSlide 0.6s ease ${0.05+i*0.08}s both`}}>
                <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:17,color:'#FF7A29',marginBottom:10}}>{t(p.titleEn,p.titleHi)}</div>
                <p style={{color:'rgba(255,255,255,0.88)',fontSize:14,lineHeight:1.7}}>{t(p.bodyEn,p.bodyHi)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR LEADERSHIP (text-led, no photos) ── */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div style={{textAlign:'center',marginBottom:48}}>
            <div className="tag-pill" style={{marginBottom:16}}>{t("THE TEAM BEHIND THE LEAGUE","लीग के पीछे की टीम")}</div>
            <h2 className="v3-h" style={{fontSize:'clamp(30px,4vw,48px)',color:'#fff'}}>
              {t("Our ","हमारा ")} <span className="shimmer-gold">{t("Leadership","नेतृत्व")}</span>
            </h2>
          </div>

          {/* Founder — text-led featured card, no photo */}
          <div className="glass-card" style={{maxWidth:860,margin:'0 auto 32px',borderTop:'3px solid #E8B23D',padding:'clamp(24px,4vw,40px)',animation:'fadeSlide 0.7s ease both'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(232,178,61,0.12)',border:'1px solid rgba(232,178,61,0.35)',borderRadius:100,padding:'5px 14px',marginBottom:18}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'#E8B23D',display:'inline-block'}}/>
              <span style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:11,color:'#E8B23D',letterSpacing:'.12em'}}>{t("FOUNDER","संस्थापक")}</span>
            </div>
            <div className="v3-h" style={{fontSize:'clamp(24px,3.5vw,34px)',color:'#fff',marginBottom:6,textTransform:'none'}}>Saurabh Jha</div>
            <div style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:14,color:'#FF7A29',letterSpacing:'.06em',marginBottom:20}}>{t("Founder & Chairman","संस्थापक और अध्यक्ष")}</div>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:15,lineHeight:1.8,maxWidth:620}}>
              {t("Founder of the Bhartiya Corporate Premier League, operated by Kriparthi Playing 11 Pvt. Ltd. Saurabh built BCPL to give every working professional a real, fair shot at professional-grade cricket.","Bhartiya Corporate Premier League के संस्थापक, जो Kriparthi Playing 11 Pvt. Ltd. द्वारा संचालित है। Saurabh ने BCPL को इसलिए बनाया ताकि हर working professional को professional-grade cricket का एक असली, निष्पक्ष मौका मिले।")}
            </p>
          </div>

          {/* Leadership — text-led grid, names + roles + short bio, no photos */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:20,maxWidth:1100,margin:'0 auto'}}>
            {[
              {name:'Muhammad Muzammil', role:'COO & CMO',         bioEn:'Leads day-to-day operations and marketing across the league.',bioHi:'लीग के day-to-day operations और marketing का नेतृत्व।'},
              {name:'Mohammed Imran',    role:'Head of Production', bioEn:'Oversees content and broadcast production for BCPL.',bioHi:'BCPL के content और broadcast production की देखरेख।'},
              {name:'Gaurav Anthoney',   role:'Head of Operations',bioEn:'Runs on-ground trial and event operations nationwide.',bioHi:'देशभर में on-ground trial और event operations संभालते हैं।'},
              {name:'Gautam Singh',      role:'Legal Head',        sub:'Partner, D K Singh & Co.', bioEn:'Advises on legal, compliance and governance matters.',bioHi:'legal, compliance और governance मामलों पर सलाह।'},
              {name:'Mohit Kumar',       role:'Finance & Accounts',bioEn:'Manages finance, accounts and payments oversight.',bioHi:'finance, accounts और payments की देखरेख।'},
            ].map((m,i)=>(
              <div key={i} className="glass-card" style={{padding:'22px 22px 24px',borderTop:'2px solid rgba(255,122,41,0.3)',animation:`fadeSlide 0.6s ease ${0.1+i*0.1}s both`}}>
                <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:16,color:'#fff',marginBottom:4,lineHeight:1.25}}>{m.name}</div>
                <div style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:12,color:'#FF7A29',letterSpacing:'.05em',marginBottom:m.sub?2:10}}>{m.role}</div>
                {m.sub && <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'var(--ink-3)',marginBottom:10}}>{m.sub}</div>}
                <p style={{color:'rgba(255,255,255,0.88)',fontSize:13,lineHeight:1.65}}>{t(m.bioEn,m.bioHi)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPANY CARD */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'clamp(20px,5vw,48px) clamp(16px,4vw,48px)',maxWidth:860,margin:'0 auto',border:'1px solid rgba(232,178,61,0.25)',animation:'borderGlow 3s ease infinite'}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:32,alignItems:'center',marginBottom:32}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontFamily:'var(--font-head)',fontWeight:900,fontSize:22,color:'#fff',marginBottom:8}}>Kriparthi Playing 11 Pvt. Ltd.</div>
                <div style={{color:'var(--ink-3)',fontSize:13,fontFamily:'Inter,sans-serif'}}>Operating the Bhartiya Corporate Premier League · India</div>
              </div>
              <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
                {[{label:'Registered',val:'Company'},{ label:'Track Record',val:'4 Seasons'},{label:'Players Served',val:'2.5 Lakh+'}].map((b,i)=>(
                  <div key={i} style={{textAlign:'center'}}>
                    <div style={{fontFamily:'var(--font-head)',fontWeight:900,fontSize:20,color:'#E8B23D'}}>{b.val}</div>
                    <div style={{color:'var(--ink-3)',fontSize:11,fontFamily:'Inter,sans-serif'}}>{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:24}}>
              {['Structured Assessment Process','Professional Grounds','Transparent Fee Structure','Transparent Selection Process'].map((f,i)=>(
                <div key={i} style={{color:'rgba(255,255,255,0.88)',fontSize:14,fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:8}}><span style={{color:'#22C55E',display:'inline-flex',flexShrink:0}}><IcoCheck size={16}/></span>{f}</div>
              ))}
            </div>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:14,fontFamily:'Inter,sans-serif',fontStyle:'italic'}}>Transparent process. Every player treated fairly.</p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 120px',textAlign:'center'}}>
        <div className="wrap">
          <h2 className="v3-h" style={{fontSize:'clamp(26px,3.5vw,44px)',color:'#fff',marginBottom:12}}>
            {t("Join ","शामिल हों ")} <span style={{color:'#FF7A29'}}>2.5 {t("Lakh+","लाख+")}</span> {t(" players who took their shot"," खिलाड़ियों के साथ जिन्होंने अपना मौका लिया")}
          </h2>
          <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,marginBottom:32}}>{t("Registration open now. ₹299 only.","Registration अब खुले हैं। सिर्फ ₹299।")}</p>
          <Link href="/register" className="btn-fire" style={{padding:'18px 48px',fontSize:17,textDecoration:'none',display:'inline-block'}}>{t("Register for ₹299 →","₹299 में Register करें →")}</Link>
        </div>
      </section>

      {/* ── FLOATING REGISTER BUTTON ── */}
      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>{t("REGISTER NOW","अभी REGISTER करें")} &rarr;</Link>
      <BCPLFooter />
      <StickyRegisterCTA/>
    </div>
  );
}
