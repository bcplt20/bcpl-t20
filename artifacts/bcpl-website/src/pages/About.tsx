import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';
import { StickyRegisterCTA } from "../components/StickyRegisterCTA";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#060E1C; }
.wrap { max-width:1280px; margin:0 auto; padding:0 20px; }
.desk-nav { display:none; align-items:center; gap:22px; }
.ham-btn { display:flex; }
@media(min-width:768px){ .wrap{padding:0 32px} }
@media(min-width:1024px){ .desk-nav{display:flex!important;} .ham-btn{display:none!important;} }
.btn-fire { background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%); border:none; border-radius:14px; color:#fff; font-family:Montserrat,sans-serif; font-weight:800; cursor:pointer; box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2); transition:transform 0.15s,box-shadow 0.2s; letter-spacing:0.02em; animation:pulseGlow 3s ease-in-out infinite; }
.btn-fire:hover { transform:translateY(-2px); box-shadow:0 14px 40px rgba(255,122,41,0.6); }
.btn-fire:active { transform:scale(0.97); }
.glass-card { background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85)); backdrop-filter:blur(32px); border:1px solid rgba(255,255,255,0.09); border-radius:20px; box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06); }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
.tag-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,122,41,0.12); border:1px solid rgba(255,122,41,0.3); border-radius:100px; padding:5px 14px; font-size:11px; font-weight:700; font-family:Montserrat,sans-serif; color:#FF7A29; letter-spacing:0.1em; }
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
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
        @media(max-width:1023px){ .float-reg-btn { display:none; } }
`;

function AmbientBg() {
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.07}} viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
        <path d="M0,400 Q320,320 640,380 Q960,440 1280,360 L1280,720 L0,720 Z" fill="#1a2a4a"/>
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
  {year:'2026–27',textEn:'Season 5 — Registrations open now. 15+ trial cities across India. 10 franchise teams. ₹15 Crore+ prize pool. India\'s corporate cricket league for working professionals awaits you.',textHi:'Season 5 — Registrations अब खुले हैं। पूरे भारत में 15+ trial cities। 10 franchise teams। ₹15 करोड़+ prize pool। Working professionals के लिए भारत की corporate cricket league आपका इंतज़ार कर रही है।'},
];

const diffs = [
  {icon:'🏏',titleEn:'vs Local Cricket',titleHi:'vs Local Cricket',bodyEn:'No politics. No favoritism. Pure merit through criteria-based video assessment. Every applicant gets a fair, anonymous evaluation.',bodyHi:'कोई पक्षपात नहीं। Pure merit through criteria-based video assessment। हर applicant को fair, anonymous evaluation मिलती है।'},
  {icon:'🏟️',titleEn:'vs Amateur Leagues',titleHi:'vs Amateur Leagues',bodyEn:'Professional grounds. Franchise system. Real auctions. This is as close to IPL as corporate cricket gets.',bodyHi:'Professional grounds। Franchise system। Real auctions। Corporate cricket में IPL के सबसे करीब।'},
  {icon:'💰',titleEn:'vs Doing Nothing',titleHi:'vs कुछ न करना',bodyEn:'₹299 gets you in. No other league offers this entry point for a shot at professional-grade cricket.',bodyHi:'₹299 में entry। कोई दूसरी league इतने कम में professional-grade cricket का मौका नहीं देती।'},
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
    <div style={{minHeight:'100vh',background:'#060E1C',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <SiteHeader active="About" />

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'100px 0 80px',textAlign:'center'}}>
        <div className="wrap">
          <div className="tag-pill" style={{marginBottom:24,animation:'floatUp 0.6s ease both'}}>{t("OUR STORY","हमारी कहानी")}</div>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,color:'#fff',marginBottom:12,animation:'floatUp 0.7s ease 0.1s both'}}>
            {t("WHERE OFFICES","जहां ऑफिसें")}
          </h1>
          <h1 className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:28,animation:'floatUp 0.7s ease 0.2s both'}}>
            {t("MEET STADIUMS.","स्टेडियम बनती हैं।")}
          </h1>
          <p style={{color:'rgba(255,255,255,0.65)',fontSize:18,maxWidth:600,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            {t("India's corporate cricket league. Turning working professionals into franchise cricketers since 2023.","भारत की कॉर्पोरेट क्रिकेट लीग। 2023 से working professionals को franchise cricketers बना रहे हैं।")}
          </p>
        </div>
      </section>

      {/* THE PROBLEM → THE MISSION */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'clamp(20px,5vw,40px) clamp(16px,4vw,48px)',borderLeft:'3px solid #E8B23D',maxWidth:860,margin:'0 auto',animation:'fadeSlide 0.8s ease 0.4s both'}}>
            <div style={{fontSize:32,marginBottom:16}}>💡</div>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(17px,2.2vw,21px)',lineHeight:1.75,fontStyle:'italic'}}>
              {t("Every working professional who watched IPL and thought 'I could have played' deserves a real shot. Millions stopped competitive cricket when work took over. BCPL exists to give them the stage they never got.","हर working professional जो IPL देखते हुए सोचता है 'मैं भी खेल सकता था' — उसे एक असली मौका मिलना चाहिए। लाखों लोगों ने काम की वजह से competitive cricket छोड़ दी। BCPL उन्हें वो stage देने के लिए है जो उन्हें कभी नहीं मिला।")}
            </p>
            <div style={{marginTop:20,color:'rgba(255,255,255,0.35)',fontSize:13,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.08em'}}>— {t("BCPL FOUNDING MISSION","BCPL की स्थापना मिशन")}</div>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:20}}>
            {stats.map((s,i)=>(
              <div key={i} className="glass-card" style={{padding:'36px 24px',textAlign:'center',animation:`countUp 3s ease ${i*0.4}s infinite`}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:52,color:'#FF7A29',lineHeight:1,marginBottom:8}}>{s.num}</div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#fff',marginBottom:6}}>{t(s.labelEn,s.labelHi)}</div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontFamily:'Inter,sans-serif'}}>{t(s.subEn,s.subHi)}</div>
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
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(28px,4vw,44px)',color:'#fff'}}>{t("Five Seasons of ","पाँच Seasons की ")} <span className="shimmer-gold">{t("Legacy","विरासत")}</span></h2>
          </div>
          <div style={{position:'relative',maxWidth:700,margin:'0 auto'}}>
            <div style={{position:'absolute',left:28,top:0,bottom:0,width:2,background:'linear-gradient(180deg,#E8B23D,rgba(232,178,61,0.2))'}}/>
            {timeline.map((tm,i)=>(
              <div key={i} style={{display:'flex',gap:28,marginBottom:i<timeline.length-1?40:0,position:'relative',animation:`fadeSlide 0.6s ease ${i*0.15}s both`}}>
                <div style={{width:58,height:58,borderRadius:'50%',background:'linear-gradient(135deg,#FF7A29,#C94E0E)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#fff',flexShrink:0,zIndex:1,boxShadow:'0 0 0 4px rgba(255,122,41,0.2)'}}>
                  {tm.year}
                </div>
                <div className="glass-card" style={{flex:1,padding:'20px 24px'}}>
                  <p style={{color:'rgba(255,255,255,0.82)',fontSize:15,lineHeight:1.6}}>{t(tm.textEn,tm.textHi)}</p>
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
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(28px,4vw,44px)',color:'#fff'}}>{t("How We're ","हम कैसे ")} <span className="shimmer-gold">{t("Different","अलग हैं")}</span></h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:24}}>
            {diffs.map((d,i)=>(
              <div key={i} className="glass-card" style={{padding:'36px 28px',borderTop:'3px solid #FF7A29',transition:'transform 0.2s',animation:`fadeSlide 0.7s ease ${i*0.15}s both`}}>
                <div style={{fontSize:36,marginBottom:16}}>{d.icon}</div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:17,color:'#FF7A29',marginBottom:12}}>{t(d.titleEn,d.titleHi)}</div>
                <p style={{color:'rgba(255,255,255,0.7)',fontSize:14,lineHeight:1.7}}>{t(d.bodyEn,d.bodyHi)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEET THE TEAM ── */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 80px'}}>
        <div className="wrap">
          <div style={{textAlign:'center',marginBottom:56}}>
            <div className="tag-pill" style={{marginBottom:16}}>{t("THE PEOPLE BEHIND BCPL","BCPL की टीम")}</div>
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(28px,4vw,44px)',color:'#fff'}}>
              {t("Meet Our ","हमारी ")} <span className="shimmer-gold">{t("Team","टीम")}</span>
            </h2>
          </div>

          {/* Founder — Full-width featured card */}
          <div className="glass-card" style={{display:'flex',flexWrap:'wrap',gap:0,maxWidth:860,margin:'0 auto 48px',borderTop:'3px solid #E8B23D',overflow:'hidden',animation:'fadeSlide 0.7s ease both'}}>
            <div style={{flexShrink:0,width:'clamp(160px,35%,280px)',background:'linear-gradient(180deg,rgba(232,178,61,0.08) 0%,rgba(6,14,28,0) 100%)'}}>
              <img
                src={import.meta.env.BASE_URL + 'bcpl-assets/people/saurabh.png'}
                alt="Saurabh Jha"
                style={{width:'100%',height:'100%',minHeight:220,objectFit:'cover',objectPosition:'top',display:'block'}}
                onError={(e)=>{ (e.target as HTMLImageElement).src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><rect fill="%23132040" width="280" height="280"/><text fill="%23FF7A29" font-size="72" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle" x="140" y="140">SJ</text></svg>'; }}
              />
            </div>
            <div style={{flex:1,minWidth:220,padding:'clamp(24px,4vw,40px)'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(232,178,61,0.12)',border:'1px solid rgba(232,178,61,0.35)',borderRadius:100,padding:'5px 14px',marginBottom:18}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'#E8B23D',display:'inline-block'}}/>
                <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:11,color:'#E8B23D',letterSpacing:'.12em'}}>{t("FOUNDER","संस्थापक")}</span>
              </div>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:6,lineHeight:1.1}}>Saurabh Jha</div>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:14,color:'#FF7A29',letterSpacing:'.06em',marginBottom:20}}>{t("Founder & Chairman","संस्थापक और अध्यक्ष")}</div>
              <p style={{color:'rgba(255,255,255,0.65)',fontSize:14,lineHeight:1.8,maxWidth:420}}>
                {t("Visionary behind Bharatiya Corporate Premier League. Conceptualized under Kriparti Playing 11 Private Limited, Saurabh built BCPL from the ground up to give every working professional a real shot at professional cricket.","Bharatiya Corporate Premier League के visionary। Kriparti Playing 11 Private Limited के तहत conceptualize किया, Saurabh ने BCPL को ground से build किया ताकि हर working professional को professional cricket का असली मौका मिल सके।")}
              </p>
            </div>
          </div>

          {/* Rest of team — 5-column grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:20,maxWidth:1100,margin:'0 auto'}}>
            {[
              {name:'Muhammad Muzammil', role:'COO & CMO',           photo:'muzammil', initials:'MM'},
              {name:'Mohammed Imran',    role:'Head of Production',   photo:'imran',    initials:'MI'},
              {name:'Gaurav Anthoney',   role:'Head of Operations',   photo:'gaurav',   initials:'GA'},
              {name:'Gautam Singh',      role:'Legal Head',           sub:'Partner, D K Singh & Co.', photo:'gautam', initials:'GS'},
              {name:'Mohit Kumar',       role:'Finance & Accounts',   photo:'mohit',    initials:'MK'},
            ].map((m,i)=>(
              <div key={i} className="glass-card" style={{overflow:'hidden',display:'flex',flexDirection:'column',animation:`fadeSlide 0.6s ease ${0.1+i*0.1}s both`,transition:'transform 0.2s',borderTop:'2px solid rgba(255,122,41,0.3)'}}>
                <div style={{position:'relative',paddingTop:'100%',background:'linear-gradient(180deg,rgba(255,122,41,0.06) 0%,rgba(6,14,28,0) 100%)'}}>
                  <img
                    src={import.meta.env.BASE_URL + `bcpl-assets/people/${m.photo}.png`}
                    alt={m.name}
                    style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}
                    onError={(e)=>{ (e.target as HTMLImageElement).style.display='none'; }}
                  />
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:'40%',background:'linear-gradient(0deg,rgba(6,14,28,0.95) 0%,transparent 100%)'}}/>
                </div>
                <div style={{padding:'16px 18px 20px'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#fff',marginBottom:4,lineHeight:1.25}}>{m.name}</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:12,color:'#FF7A29',letterSpacing:'.05em',marginBottom:m.sub?2:0}}>{m.role}</div>
                  {m.sub && <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:2}}>{m.sub}</div>}
                </div>
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
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#fff',marginBottom:8}}>BCPL T20 Pvt. Ltd.</div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:13,fontFamily:'Inter,sans-serif'}}>Registered Company · India</div>
              </div>
              <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
                {[{label:'Registered',val:'Company'},{ label:'Track Record',val:'4 Seasons'},{label:'Players Served',val:'2.5 Lakh+'}].map((b,i)=>(
                  <div key={i} style={{textAlign:'center'}}>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20,color:'#E8B23D'}}>{b.val}</div>
                    <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontFamily:'Inter,sans-serif'}}>{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:24}}>
              {['✅ Structured Assessment Process','✅ Professional Grounds','✅ Transparent Fee Structure','✅ Transparent Selection Process'].map((f,i)=>(
                <div key={i} style={{color:'rgba(255,255,255,0.75)',fontSize:14,fontFamily:'Inter,sans-serif'}}>{f}</div>
              ))}
            </div>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:14,fontFamily:'Inter,sans-serif',fontStyle:'italic'}}>Transparent process. Every player treated fairly.</p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 120px',textAlign:'center'}}>
        <div className="wrap">
          <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(24px,3.5vw,40px)',color:'#fff',marginBottom:12}}>
            {t("Join ","शामिल हों ")} <span style={{color:'#FF7A29'}}>2.5 {t("Lakh+","लाख+")}</span> {t(" players who took their shot"," खिलाड़ियों के साथ जिन्होंने अपना मौका लिया")}
          </h2>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:15,marginBottom:32}}>{t("Registration open now. ₹299 only.","Registration अब खुले हैं। सिर्फ ₹299।")}</p>
          <Link href="/register" className="btn-fire" style={{padding:'18px 48px',fontSize:17,textDecoration:'none',display:'inline-block'}}>{t("Register for ₹299 →","₹299 में Register करें →")}</Link>
        </div>
      </section>

      {/* ── FLOATING REGISTER BUTTON ── */}
      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>🏏 {t("REGISTER NOW","अभी REGISTER करें")} &rarr;</Link>
      <BCPLFooter />
      <StickyRegisterCTA/>
    </div>
  );
}
