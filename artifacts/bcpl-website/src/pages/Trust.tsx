import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';
import { LegalDocHeader } from '../lib/legalMeta';
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
.btn-wa { background:linear-gradient(135deg,#25D366,#1BA851); border:none; border-radius:14px; color:#fff; font-weight:700; cursor:pointer; font-family:Montserrat,sans-serif; transition:transform 0.15s; }
.glass-card { background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85)); backdrop-filter:blur(32px); border:1px solid rgba(255,255,255,0.09); border-radius:20px; box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06); }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
.tag-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,122,41,0.12); border:1px solid rgba(255,122,41,0.3); border-radius:100px; padding:5px 14px; font-size:11px; font-weight:700; font-family:Montserrat,sans-serif; color:#FF7A29; letter-spacing:0.1em; }
@keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes pulseGlow { 0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)} 50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes scanPulse { 0%,100%{opacity:0.03} 50%{opacity:0.08} }
@keyframes floatParticle { 0%{transform:translateY(0) rotate(0deg);opacity:0.4} 50%{opacity:0.8} 100%{transform:translateY(-80px) rotate(180deg);opacity:0} }
@keyframes fadeSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes floatUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        /* float-reg-btn */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
        @media(max-width:1023px){ .float-reg-btn { display:none; } }
        .trust-section { margin-bottom:clamp(40px,7vw,80px); }
        .step-num { display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#FF7A29,#C94E0E); font-family:Montserrat,sans-serif; font-weight:900; font-size:16px; color:#fff; flex-shrink:0; box-shadow:0 4px 16px rgba(255,122,41,0.35); }
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

export function Trust() {
  const { t } = useLang();

  return (
    <div style={{minHeight:'100vh',background:'#060E1C',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <SiteHeader active="About" />

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'100px 0 80px',textAlign:'center'}}>
        <div className="wrap">
          <div className="tag-pill" style={{marginBottom:24,animation:'floatUp 0.6s ease both'}}>{t("TRUST & TRANSPARENCY","पारदर्शिता")}</div>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,color:'#fff',marginBottom:12,animation:'floatUp 0.7s ease 0.1s both'}}>
            {t("HOW BCPL","BCPL की")}
          </h1>
          <h1 className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:28,animation:'floatUp 0.7s ease 0.2s both'}}>
            {t("SELECTION WORKS.","चयन प्रक्रिया।")}
          </h1>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:18,maxWidth:600,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            {t("A clear, two-phase, role-specific assessment process — from Phase 1 video assessment to the BCPL Auction Pool.","एक स्पष्ट, दो-चरणीय, role-specific assessment process — Phase 1 video assessment से लेकर BCPL Auction Pool तक।")}
          </p>
          <div style={{marginTop:32}}>
            <LegalDocHeader doc="selection" />
          </div>
        </div>
      </section>

      {/* VIDEO EVALUATION METHODOLOGY */}
      <section className="trust-section" style={{position:'relative',zIndex:1,padding:'0 0 0'}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(255,122,41,0.15)',animation:'fadeSlide 0.7s ease 0.1s both'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24}}>
              <span className="step-num">1</span>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Phase 1 — Video Assessment","Phase 1 — Video Assessment")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("PHASE 1","PHASE 1")}</p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:16}}>
              {t("Phase 1 is a video-based assessment stage. The applicable Phase 1 fee depends on your playing role — Batsman, Bowler and Wicketkeeper pay ₹299 + applicable GST, while All-Rounder pays ₹399 + applicable GST. You must upload the required video within the applicable deadline, and the submitted video must represent the registered player's own cricket performance.","Phase 1 एक video-based assessment stage है। लागू Phase 1 fee आपकी playing role पर निर्भर करती है — Batsman, Bowler और Wicketkeeper ₹299 + applicable GST देते हैं, जबकि All-Rounder ₹399 + applicable GST देता है। आपको required video लागू deadline के अंदर upload करना होगा, और submitted video registered player के अपने cricket performance को दर्शाना चाहिए।")}
            </p>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:16}}>
              {t("BCPL may use automated, digital and technology-assisted assessment systems and third-party technology service providers for video validation, scoring, ranking, fraud/integrity checks and administration. The assessment is role-specific and criteria-based. Invalid or unclear footage may require re-upload according to BCPL rules. Your Phase 1 result may include a score and/or ranking where applicable.","BCPL video validation, scoring, ranking, fraud/integrity checks और administration के लिए automated, digital और technology-assisted assessment systems तथा third-party technology service providers का उपयोग कर सकता है। यह assessment role-specific और criteria-based है। Invalid या unclear footage को BCPL rules के अनुसार re-upload करना पड़ सकता है। आपके Phase 1 result में जहां लागू हो score और/या ranking शामिल हो सकती है।")}
            </p>
            <div style={{background:'rgba(255,122,41,0.05)',border:'1px solid rgba(255,122,41,0.2)',borderRadius:12,padding:'14px 18px',marginBottom:24}}>
              <p style={{color:'rgba(255,255,255,0.62)',fontSize:13.5,lineHeight:1.7}}>
                {t("Payment of Phase 1 or Phase 2 fees does not guarantee qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration or tournament participation. Your Phase 1 result target is within 48 hours of video submission; if a result is not delivered within 15 working days, a full refund applies as published. Qualification to Phase 2 does not guarantee final selection.","Phase 1 या Phase 2 fees का भुगतान qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration या tournament participation की गारंटी नहीं देता। आपके Phase 1 result का target video submission के 48 घंटे के भीतर है; यदि 15 working days के भीतर result नहीं दिया जाता, तो published नीति के अनुसार full refund लागू होता है। Phase 2 के लिए qualification final selection की गारंटी नहीं देता।")}
              </p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>
              {[
                {titleEn:'Technical Skill',titleHi:'Technical Skill',bodyEn:'Shot selection, footwork, bowling action, fielding technique — role-specific fundamentals.',bodyHi:'Shot selection, footwork, bowling action, fielding technique — role के हिसाब से fundamentals।'},
                {titleEn:'Execution',titleHi:'Execution',bodyEn:'How cleanly you execute your skills under match conditions shown in your video.',bodyHi:'आपके video में दिखाई गई match conditions में आप कितनी अच्छी तरह execute करते हैं।'},
                {titleEn:'Game Awareness',titleHi:'Game Awareness',bodyEn:'Decision-making, situational understanding, cricket intelligence visible in your play.',bodyHi:'Decision-making, situational understanding, आपके खेल में दिखने वाली cricket intelligence।'},
                {titleEn:'Physical Fitness',titleHi:'Physical Fitness',bodyEn:'Movement quality, agility, stamina indicators from your video evidence.',bodyHi:'आपके video evidence से movement quality, agility, stamina indicators।'},
              ].map((c,i)=>(
                <div key={i} style={{background:'rgba(255,122,41,0.05)',border:'1px solid rgba(255,122,41,0.15)',borderRadius:12,padding:'16px 18px'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#FF7A29',marginBottom:6}}>{t(c.titleEn,c.titleHi)}</div>
                  <p style={{color:'rgba(255,255,255,0.55)',fontSize:13,lineHeight:1.6}}>{t(c.bodyEn,c.bodyHi)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SCORING FRAMEWORK */}
      <section className="trust-section" style={{position:'relative',zIndex:1}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(232,178,61,0.15)',animation:'fadeSlide 0.7s ease 0.2s both'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24}}>
              <span className="step-num" style={{background:'linear-gradient(135deg,#E8B23D,#F0C860)'}}>2</span>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Role-Specific 100-Point Framework","Role-Specific 100-Point Framework")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("SCORING FRAMEWORK","SCORING FRAMEWORK")}</p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:24}}>
              {t("Each playing role is assessed against a role-specific 100-point assessment framework covering role skill, technique, execution, game awareness, movement/fitness and video-evidence quality. The detailed category weights are published once BCPL finalises the season rubric. Your result reflects an assessment of your cricket capabilities at the time of submission and is not a simple pass/fail.","हर playing role का मूल्यांकन एक role-specific 100-point assessment framework पर होता है जिसमें role skill, technique, execution, game awareness, movement/fitness और video-evidence quality शामिल हैं। Detailed category weights तब publish किए जाते हैं जब BCPL season rubric को finalise कर देता है। आपका result submission के समय आपकी cricket capabilities के मूल्यांकन को दर्शाता है और यह एक साधारण pass/fail नहीं है।")}
            </p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,background:'rgba(232,178,61,0.06)',border:'1px solid rgba(232,178,61,0.2)',borderRadius:12,padding:'20px 24px'}}>
              {[
                {role:'Batsman'},{role:'Bowler'},{role:'All-Rounder'},{role:'Wicketkeeper'},
              ].map((r,i)=>(
                <div key={i} style={{textAlign:'center'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#fff',marginBottom:4}}>{r.role}</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:'#E8B23D'}}>/100</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RANKING METHODOLOGY */}
      <section className="trust-section" style={{position:'relative',zIndex:1}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(59,130,246,0.15)',animation:'fadeSlide 0.7s ease 0.3s both'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24}}>
              <span className="step-num" style={{background:'linear-gradient(135deg,#3B82F6,#2563EB)'}}>3</span>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Ranking & the Auction Pool","रैंकिंग और Auction Pool")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("CENTRAL RANKING","CENTRAL RANKING")}</p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:20}}>
              {t("BCPL may apply published playing-role allocations, regional representation requirements, minimum assessment standards, national merit ranking and applicable tie-break rules when determining advancement to the Auction Pool for the relevant season.","BCPL relevant season के लिए Auction Pool में advancement तय करते समय published playing-role allocations, regional representation requirements, minimum assessment standards, national merit ranking और applicable tie-break rules लागू कर सकता है।")}
            </p>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:20}}>
              {t("Advancement is not tied to any fixed score. It depends on your score, your role ranking, published role allocation, minimum quality standards, regional and national rules and applicable tie-break criteria for the relevant season. Exact numerical quotas are published only once officially approved for the season.","Advancement किसी fixed score से जुड़ी नहीं है। यह आपके score, आपकी role ranking, published role allocation, minimum quality standards, regional और national rules तथा relevant season के applicable tie-break criteria पर निर्भर करती है। Exact numerical quotas केवल तब publish किए जाते हैं जब वे season के लिए officially approved हो जाते हैं।")}
            </p>
            <div style={{background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:12,padding:'18px 20px'}}>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#3B82F6',marginBottom:10}}>{t("What the Auction Pool means","Auction Pool का मतलब")}</div>
              <p style={{color:'rgba(255,255,255,0.7)',fontSize:14,lineHeight:1.7}}>
                {t("Qualification for the BCPL Auction Pool means eligibility to participate in the applicable player-auction process. Auction Pool qualification does not guarantee purchase by a team, a player contract, remuneration, squad selection or tournament participation.","BCPL Auction Pool के लिए qualification का मतलब है applicable player-auction process में भाग लेने की eligibility। Auction Pool qualification किसी team द्वारा purchase, player contract, remuneration, squad selection या tournament participation की गारंटी नहीं देती।")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PHYSICAL TRIALS */}
      <section className="trust-section" style={{position:'relative',zIndex:1}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(34,197,94,0.15)',animation:'fadeSlide 0.7s ease 0.4s both'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24}}>
              <span className="step-num" style={{background:'linear-gradient(135deg,#22C55E,#16A34A)'}}>4</span>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Phase 2 — Physical Trial","Phase 2 — Physical Trial")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("PHASE 2 — ONLY IF QUALIFIED","PHASE 2 — सिर्फ qualify होने पर")}</p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:16}}>
              {t("Only eligible Phase 1 qualified players may proceed to Phase 2. Phase 2 requires the applicable role-based Phase 2 fee plus applicable GST as displayed at the time of payment, together with the required declarations and verification. Phase 2 is a physical, standardised cricket trial conducted at authorised venues.","केवल eligible Phase 1 qualified players ही Phase 2 में आगे बढ़ सकते हैं। Phase 2 के लिए applicable role-based Phase 2 fee plus applicable GST (जैसा payment के समय दिखाया गया हो) के साथ आवश्यक declarations और verification चाहिए। Phase 2 authorised venues पर आयोजित एक physical, standardised cricket trial है।")}
            </p>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:16}}>
              {t("BCPL seeks to use the same published role-specific assessment framework, scoring structure and applicable attempt rules across authorised Phase 2 venues. This is a standardised assessment framework — it does not promise that every pitch, weather, environmental condition or feeder delivery will be physically identical.","BCPL authorised Phase 2 venues पर same published role-specific assessment framework, scoring structure और applicable attempt rules उपयोग करने का प्रयास करता है। यह एक standardised assessment framework है — यह वादा नहीं करता कि हर pitch, weather, environmental condition या feeder delivery physically identical होगी।")}
            </p>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:16}}>
              {t("Each role is assessed against a role-specific 100-point framework. The detailed category weights are published once BCPL finalises the season rubric. Full attempt rules are set out in the Phase 2 Physical Trial Rules.","हर role का मूल्यांकन एक role-specific 100-point framework पर होता है। Detailed category weights तब publish किए जाते हैं जब BCPL season rubric finalise कर देता है। पूरे attempt rules Phase 2 Physical Trial Rules में दिए गए हैं।")}
              {' '}
              <Link href="/trial-rules" style={{color:'#22C55E',fontWeight:700,textDecoration:'underline'}}>{t("View Phase 2 Physical Trial Rules →","Phase 2 Physical Trial Rules देखें →")}</Link>
            </p>
            <div style={{background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:12,padding:'20px 24px'}}>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#22C55E',marginBottom:12}}>{t("Phase 2 Fee Structure","Phase 2 Fee Structure")}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <p style={{color:'rgba(255,255,255,0.45)',fontSize:12,marginBottom:4}}>{t("Batsman / Bowler / WK","Batsman / Bowler / WK")}</p>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,color:'#fff'}}>{t("₹2,000 + GST","₹2,000 + GST")}</div>
                </div>
                <div>
                  <p style={{color:'rgba(255,255,255,0.45)',fontSize:12,marginBottom:4}}>{t("All-Rounder","All-Rounder")}</p>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,color:'#fff'}}>{t("₹3,000 + GST","₹3,000 + GST")}</div>
                </div>
              </div>
              <p style={{color:'rgba(255,255,255,0.55)',fontSize:13,marginTop:16,lineHeight:1.6}}>
                {t("Payment of Phase 1 or Phase 2 fees does not guarantee qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration or tournament participation.","Phase 1 या Phase 2 fees का भुगतान qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration या tournament participation की गारंटी नहीं देता।")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PHYSICAL TRIAL ATTEMPTS */}
      <section className="trust-section" style={{position:'relative',zIndex:1}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(34,197,94,0.15)',animation:'fadeSlide 0.7s ease 0.45s both'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24}}>
              <span className="step-num" style={{background:'linear-gradient(135deg,#22C55E,#16A34A)'}}>5</span>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Trial Attempts by Role","Role के अनुसार Trial Attempts")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("STANDARDISED FRAMEWORK","STANDARDISED FRAMEWORK")}</p>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:12,marginBottom:20}}>
              {[
                {role:'Batsman',en:'6 valid assessment deliveries. The intended standard framework may include 3 pace-style and 3 spin-style deliveries.',hi:'6 valid assessment deliveries। Intended standard framework में 3 pace-style और 3 spin-style deliveries शामिल हो सकती हैं।'},
                {role:'Bowler',en:'6 bowling attempts. Wides, poor execution or inaccurate attempts may count as attempts according to the approved BCPL trial protocol.',hi:'6 bowling attempts। Wides, poor execution या inaccurate attempts approved BCPL trial protocol के अनुसार attempts के रूप में count हो सकते हैं।'},
                {role:'All-Rounder',en:'6 valid batting deliveries plus 6 bowling attempts.',hi:'6 valid batting deliveries और 6 bowling attempts।'},
                {role:'Wicketkeeper',en:'Standardised wicketkeeping assessment plus 6 valid batting deliveries.',hi:'Standardised wicketkeeping assessment और 6 valid batting deliveries।'},
              ].map((r,i)=>(
                <div key={i} style={{background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:12,padding:'14px 18px'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#22C55E',marginBottom:6}}>{r.role}</div>
                  <p style={{color:'rgba(255,255,255,0.62)',fontSize:13.5,lineHeight:1.7}}>{t(r.en,r.hi)}</p>
                </div>
              ))}
            </div>
            <p style={{color:'rgba(255,255,255,0.62)',fontSize:14,lineHeight:1.8}}>
              {t("If an authorised feeder delivery is clearly unusable, it may be marked \"FEEDER ERROR / RE-BOWL\" and will not count as one of the six valid deliveries. Evaluators cannot grant extra valid balls at their discretion.","यदि कोई authorised feeder delivery स्पष्ट रूप से unusable है, तो उसे \"FEEDER ERROR / RE-BOWL\" mark किया जा सकता है और वह छह valid deliveries में से एक के रूप में count नहीं होगी। Evaluators अपनी discretion पर extra valid balls नहीं दे सकते।")}
            </p>
          </div>
        </div>
      </section>

      {/* DIGITAL SCORING */}
      <section className="trust-section" style={{position:'relative',zIndex:1}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(232,178,61,0.15)',animation:'fadeSlide 0.7s ease 0.5s both'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24}}>
              <span className="step-num" style={{background:'linear-gradient(135deg,#E8B23D,#F0C860)'}}>6</span>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Digital Scoring & Corrections","Digital Scoring और Corrections")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("LOCKED & AUDITED","LOCKED & AUDITED")}</p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:16}}>
              {t("Physical-trial scores are recorded digitally. Evaluators assess players against the applicable role-specific rubric. Once submitted, assessments lock — normal evaluators cannot freely edit a submitted final assessment. Any authorised correction must follow an audited process.","Physical-trial scores digitally record किए जाते हैं। Evaluators players का मूल्यांकन applicable role-specific rubric पर करते हैं। Submit होने के बाद, assessments lock हो जाते हैं — normal evaluators किसी submitted final assessment को स्वतंत्र रूप से edit नहीं कर सकते। कोई भी authorised correction एक audited process का पालन करना चाहिए।")}
            </p>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8}}>
              {t("Evaluators do not decide whether a player is finally selected for the Auction Pool. Auction Pool qualification is determined centrally according to applicable BCPL ranking and allocation rules.","Evaluators यह तय नहीं करते कि किसी player का Auction Pool के लिए अंतिम चयन होगा या नहीं। Auction Pool qualification केंद्रीय रूप से applicable BCPL ranking और allocation rules के अनुसार तय होती है।")}
            </p>
          </div>
        </div>
      </section>

      {/* BLIND EVALUATOR PROCESS */}
      <section className="trust-section" style={{position:'relative',zIndex:1}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(6,182,212,0.15)',animation:'fadeSlide 0.7s ease 0.55s both'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24}}>
              <span className="step-num" style={{background:'linear-gradient(135deg,#06B6D4,#0891B2)'}}>7</span>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Evaluator Assessment Process","Evaluator Assessment Process")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("FOCUS ON PERFORMANCE","PERFORMANCE पर फोकस")}</p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8}}>
              {t("Physical-trial evaluators are not required to see unnecessary personal information or the player's previous Phase 1 scores while assessing the player's cricket performance. Evaluators focus on assessing cricket performance against the role-specific rubric.","Physical-trial evaluators को player की cricket performance का मूल्यांकन करते समय अनावश्यक व्यक्तिगत जानकारी या player के पिछले Phase 1 scores देखना आवश्यक नहीं होता। Evaluators role-specific rubric के आधार पर cricket performance का मूल्यांकन करने पर focus करते हैं।")}
            </p>
          </div>
        </div>
      </section>

      {/* RESULTS TIMING */}
      <section className="trust-section" style={{position:'relative',zIndex:1}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(59,130,246,0.15)',animation:'fadeSlide 0.7s ease 0.6s both'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24}}>
              <span className="step-num" style={{background:'linear-gradient(135deg,#3B82F6,#2563EB)'}}>8</span>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Phase 2 Results Timing","Phase 2 Results Timing")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("NOT IMMEDIATE","तुरंत नहीं")}</p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8}}>
              {t("After completing your physical trial, your assessment is recorded. Advancement results may be finalised after completion of the applicable BCPL trial window so eligible candidates can be ranked under the applicable season rules. Completing your trial does not mean you have been selected.","अपना physical trial पूरा करने के बाद, आपका assessment record किया जाता है। Advancement results applicable BCPL trial window पूरी होने के बाद finalise किए जा सकते हैं ताकि eligible candidates को applicable season rules के अंतर्गत rank किया जा सके। Trial पूरा करने का मतलब यह नहीं है कि आपका चयन हो गया है।")}
            </p>
          </div>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section className="trust-section" style={{position:'relative',zIndex:1}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(139,92,246,0.15)',animation:'fadeSlide 0.7s ease 0.65s both'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24}}>
              <span className="step-num" style={{background:'linear-gradient(135deg,#8B5CF6,#7C3AED)'}}>9</span>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Eligibility & Disqualification","पात्रता और अयोग्यता")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("CLEAR RULES","स्पष्ट नियम")}</p>
              </div>
            </div>
            <div style={{marginBottom:24}}>
              <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#8B5CF6',marginBottom:14}}>{t("Who Can Participate","कौन भाग ले सकता है")}</h3>
              <ul style={{listStyle:'none',padding:0,margin:0}}>
                {[
                  {en:'Age 18 or above (no upper limit)',hi:'18 वर्ष या उससे अधिक (कोई ऊपरी सीमा नहीं)'},
                  {en:'Working professional: salaried employee, self-employed, freelancer, or business owner',hi:'Working professional: salaried employee, self-employed, freelancer, या business owner'},
                  {en:'Currently employed or actively running a business',hi:'वर्तमान में employed या सक्रिय रूप से business चला रहे हैं'},
                  {en:'Valid Indian ID proof for KYC (Aadhaar + PAN)',hi:'KYC के लिए valid Indian ID proof (Aadhaar + PAN)'},
                  {en:'No active contracts with state or national cricket associations',hi:'State या national cricket associations के साथ कोई active contract नहीं'},
                ].map((r,i)=>(
                  <li key={i} style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:10}}>
                    <span style={{color:'#8B5CF6',fontSize:18,flexShrink:0}}>✓</span>
                    <span style={{color:'rgba(255,255,255,0.7)',fontSize:14,lineHeight:1.7}}>{t(r.en,r.hi)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:12,padding:'18px 20px'}}>
              <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#EF4444',marginBottom:12}}>{t("Disqualification Grounds","अयोग्यता के कारण")}</h3>
              <ul style={{listStyle:'none',padding:0,margin:0}}>
                {[
                  {en:'Submitting someone else\'s video as your own',hi:'किसी और का video अपना बताकर submit करना'},
                  {en:'False identity or employment information',hi:'झूठी पहचान या employment की जानकारी'},
                  {en:'Attempting to manipulate scores or rankings',hi:'Scores या rankings को manipulate करने की कोशिश'},
                  {en:'Violating BCPL Code of Conduct during trials',hi:'Trials के दौरान BCPL Code of Conduct का उल्लंघन'},
                  {en:'Undisclosed professional cricket contracts',hi:'Undisclosed professional cricket contracts'},
                ].map((r,i)=>(
                  <li key={i} style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:8}}>
                    <span style={{color:'#EF4444',fontSize:18,flexShrink:0}}>✕</span>
                    <span style={{color:'rgba(255,255,255,0.65)',fontSize:13,lineHeight:1.7}}>{t(r.en,r.hi)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEES BREAKDOWN */}
      <section className="trust-section" style={{position:'relative',zIndex:1}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(232,178,61,0.15)',animation:'fadeSlide 0.7s ease 0.6s both'}}>
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:20,textAlign:'center'}}>{t("Complete Fee Breakdown","पूरी Fee Breakdown")}</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:16,marginBottom:24}}>
              <div style={{background:'linear-gradient(135deg,rgba(255,122,41,0.1),rgba(255,122,41,0.05))',border:'1px solid rgba(255,122,41,0.3)',borderRadius:14,padding:'20px 24px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:12}}>
                  <div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:14,color:'#FF7A29',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:4}}>{t("PHASE 1 FEE","PHASE 1 FEE")}</div>
                    <p style={{color:'rgba(255,255,255,0.5)',fontSize:13}}>{t("Video Evaluation","Video Evaluation")}</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:32,color:'#fff',lineHeight:1}}>₹299</div>
                    <p style={{color:'rgba(255,255,255,0.45)',fontSize:12,marginTop:4}}>{t("Batsman / Bowler / WK","Batsman / Bowler / WK")}</p>
                  </div>
                </div>
                <div style={{textAlign:'right',marginTop:8}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:32,color:'#fff',lineHeight:1}}>₹399</div>
                  <p style={{color:'rgba(255,255,255,0.45)',fontSize:12,marginTop:4}}>{t("All-Rounder","All-Rounder")}</p>
                </div>
              </div>
              <div style={{background:'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.05))',border:'1px solid rgba(34,197,94,0.3)',borderRadius:14,padding:'20px 24px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                  <div>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:14,color:'#22C55E',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:4}}>{t("PHASE 2 FEE","PHASE 2 FEE")}</div>
                    <p style={{color:'rgba(255,255,255,0.5)',fontSize:13}}>{t("Physical Trial (if selected)","Physical Trial (select होने पर)")}</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:28,color:'#fff',lineHeight:1}}>₹2,000</div>
                    <p style={{color:'rgba(255,255,255,0.45)',fontSize:12,marginTop:4}}>{t("Batsman / Bowler / WK","Batsman / Bowler / WK")}</p>
                  </div>
                </div>
                <div style={{textAlign:'right',marginTop:12}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:28,color:'#fff',lineHeight:1}}>₹3,000</div>
                  <p style={{color:'rgba(255,255,255,0.45)',fontSize:12,marginTop:4}}>{t("All-Rounder","All-Rounder")}</p>
                </div>
              </div>
            </div>
            <div style={{background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:12,padding:'20px 24px',textAlign:'center'}}>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:18,color:'#3B82F6',marginBottom:10}}>{t("Combined Phase 1 + Phase 2 Fees (plus applicable GST)","Phase 1 + Phase 2 fees का जोड़ (साथ में applicable GST)")}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:36,color:'#fff'}}>₹2,299</div>
                  <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,marginTop:6}}>{t("Batsman / Bowler / WK","Batsman / Bowler / WK")}</p>
                </div>
                <div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:36,color:'#fff'}}>₹3,399</div>
                  <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,marginTop:6}}>{t("All-Rounder","All-Rounder")}</p>
                </div>
              </div>
              <p style={{color:'rgba(255,255,255,0.55)',fontSize:13,marginTop:20,lineHeight:1.7,fontStyle:'italic'}}>
                {t("These are the applicable Phase 1 and Phase 2 fees. If you do not qualify Phase 1, no Phase 2 fee becomes payable. Payment of Phase 1 or Phase 2 fees does not guarantee qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration or tournament participation. All fees attract applicable GST as displayed at the time of payment.","ये applicable Phase 1 और Phase 2 fees हैं। यदि आप Phase 1 qualify नहीं करते, तो कोई Phase 2 fee देय नहीं होती। Phase 1 या Phase 2 fees का भुगतान qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration या tournament participation की गारंटी नहीं देता। सभी fees पर payment के समय दिखाई गई applicable GST लागू होती है।")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORT & APPEALS */}
      <section className="trust-section" style={{position:'relative',zIndex:1}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(6,182,212,0.15)',animation:'fadeSlide 0.7s ease 0.7s both',textAlign:'center'}}>
            <div style={{fontSize:44,marginBottom:16}}>💬</div>
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:12}}>{t("Questions or Concerns?","सवाल या चिंता?")}</h2>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:15,lineHeight:1.7,maxWidth:560,margin:'0 auto 28px'}}>
              {t("If you have questions about your evaluation, score, rank, or the selection process — our support team is here to help. We respond within 24 hours.","अगर आपके पास अपने evaluation, score, rank, या selection process के बारे में सवाल हैं — हमारी support team मदद के लिए यहां है। हम 24 घंटे के भीतर जवाब देते हैं।")}
            </p>
            <div style={{display:'flex',flexWrap:'wrap',gap:14,justifyContent:'center',marginBottom:24}}>
              <a href="https://wa.me/919151346555" target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                <button className="btn-wa" style={{padding:'14px 28px',fontSize:15}}>
                  💬 {t("WhatsApp Support","WhatsApp Support")}
                </button>
              </a>
              <a href="mailto:support@bcplt20.com" style={{textDecoration:'none'}}>
                <button style={{padding:'14px 28px',fontSize:15,borderRadius:14,background:'rgba(6,182,212,0.15)',border:'1.5px solid rgba(6,182,212,0.4)',color:'#06B6D4',fontFamily:'Montserrat,sans-serif',fontWeight:700,cursor:'pointer'}}>
                  📧 {t("Email Support","Email Support")}
                </button>
              </a>
              <a href="tel:+919151346555" style={{textDecoration:'none'}}>
                <button style={{padding:'14px 28px',fontSize:15,borderRadius:14,background:'rgba(139,92,246,0.15)',border:'1.5px solid rgba(139,92,246,0.4)',color:'#8B5CF6',fontFamily:'Montserrat,sans-serif',fontWeight:700,cursor:'pointer'}}>
                  📞 {t("Call Us","Call करें")}
                </button>
              </a>
            </div>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:13,lineHeight:1.7}}>
              {t("support@bcplt20.com  •  +91 91513 46555  •  wa.me/919151346555","support@bcplt20.com  •  +91 91513 46555  •  wa.me/919151346555")}
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 120px',textAlign:'center'}}>
        <div className="wrap">
          <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(24px,3.5vw,40px)',color:'#fff',marginBottom:12}}>
            {t("Transparent Process. Fair Evaluation.","पारदर्शी Process। Fair Evaluation।")}
          </h2>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:15,marginBottom:32}}>{t("Your cricket journey starts here.","आपका cricket सफर यहीं से शुरू होता है।")}</p>
          <Link href="/register" className="btn-fire" style={{padding:'18px 48px',fontSize:17,textDecoration:'none',display:'inline-block'}}>{t("Register for ₹299 →","₹299 में Register करें →")}</Link>
        </div>
      </section>

      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>🏏 {t("REGISTER NOW","अभी REGISTER करें")} &rarr;</Link>
      <BCPLFooter />
      <StickyRegisterCTA/>
    </div>
  );
}
