import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#060E1C; }
.wrap { max-width:1280px; margin:0 auto; padding:0 20px; }
.desk-nav { display:none; align-items:center; gap:22px; }
.ham-btn { display:flex; }
.bot-cta { display:flex; }
@media(min-width:768px){ .wrap{padding:0 32px} }
@media(min-width:1024px){ .desk-nav{display:flex!important;} .ham-btn{display:none!important;} .bot-cta{display:none!important;} }
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

function MobileStickyCTA() {
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'10px 16px calc(16px + env(safe-area-inset-bottom))',gap:10}}>
      <Link href="/register" className="btn-fire" style={{flex:2,height:52,fontSize:15,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>Register ₹299 →</Link>
      <a href="https://wa.me/919151346555" target="_blank" rel="noopener noreferrer" className="btn-wa" style={{flex:1,height:52,fontSize:14,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>💬 WhatsApp</a>
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
            {t("Every evaluation. Every score. Every ranking. Completely transparent.","हर मूल्यांकन। हर स्कोर। हर रैंकिंग। पूरी तरह पारदर्शी।")}
          </p>
        </div>
      </section>

      {/* VIDEO EVALUATION METHODOLOGY */}
      <section className="trust-section" style={{position:'relative',zIndex:1,padding:'0 0 0'}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(255,122,41,0.15)',animation:'fadeSlide 0.7s ease 0.1s both'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24}}>
              <span className="step-num">1</span>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Video Evaluation Methodology","Video Evaluation की प्रक्रिया")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("PHASE 1","PHASE 1")}</p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:24}}>
              {t("Your video is evaluated against BCPL's Phase 1 assessment criteria. The assessment is role-specific and criteria-based — your name, city and personal details play no part in your score. Only your cricket skills are assessed.","आपका video BCPL के Phase 1 assessment criteria पर evaluate किया जाता है। यह assessment role-specific और criteria-based है — आपके score में आपका नाम, शहर या व्यक्तिगत जानकारी की कोई भूमिका नहीं होती। सिर्फ आपकी cricket skills assess होती हैं।")}
            </p>
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
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Your BCPL Score (out of 100)","आपका BCPL Score (100 में से)")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("TRANSPARENT SCORING","पारदर्शी स्कोरिंग")}</p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:24}}>
              {t("After evaluation, you receive a detailed score breakdown out of 100. This is not a pass/fail — it's a comprehensive assessment of your cricket capabilities at the time of submission.","Evaluation के बाद, आपको 100 में से एक detailed score breakdown मिलता है। यह pass/fail नहीं है — यह submission के समय आपकी cricket capabilities का comprehensive assessment है।")}
            </p>
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:12,background:'rgba(232,178,61,0.06)',border:'1px solid rgba(232,178,61,0.2)',borderRadius:12,padding:'20px 24px'}}>
              {[
                {cat:'Role Skill',max:35,exEn:'Batting/Bowling/WK/All-rounder fundamentals',exHi:'Batting/Bowling/WK/All-rounder fundamentals'},
                {cat:'Technique',max:25,exEn:'Form, mechanics, execution quality',exHi:'Form, mechanics, execution quality'},
                {cat:'Execution',max:15,exEn:'Performance under pressure visible in video',exHi:'Video में दिखने वाले pressure के तहत performance'},
                {cat:'Game Awareness',max:10,exEn:'Cricket IQ, decision-making',exHi:'Cricket IQ, decision-making'},
                {cat:'Movement & Fitness',max:10,exEn:'Agility, speed, stamina indicators',exHi:'Agility, speed, stamina indicators'},
                {cat:'Video Evidence Quality',max:5,exEn:'Clarity, angles, match authenticity',exHi:'Clarity, angles, match authenticity'},
              ].map((r,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                  <div style={{flex:'1 1 180px'}}>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#fff',marginBottom:2}}>{r.cat}</div>
                    <p style={{color:'rgba(255,255,255,0.45)',fontSize:12}}>{t(r.exEn,r.exHi)}</p>
                  </div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:18,color:'#E8B23D',flexShrink:0}}>/{r.max}</div>
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
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("City Rank + Role Rank","City Rank + Role Rank")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("MERIT-BASED RANKING","Merit-based रैंकिंग")}</p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:24}}>
              {t("Your score determines two rankings that matter for Phase 2 selection: your rank in your city, and your rank among all players in your role (Batsman, Bowler, WK, All-rounder) across India.","आपका score दो rankings तय करता है जो Phase 2 selection के लिए महत्वपूर्ण हैं: आपके शहर में आपकी rank, और पूरे भारत में आपकी role (Batsman, Bowler, WK, All-rounder) की सभी players की rank।")}
            </p>
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:16,marginBottom:24}}>
              <div style={{background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:12,padding:'18px 20px'}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#3B82F6',marginBottom:10}}>{t("City Rank Example","City Rank उदाहरण")}</div>
                <p style={{color:'rgba(255,255,255,0.7)',fontSize:14,lineHeight:1.7}}>
                  {t("\"Delhi Rank #247 of 18,420 evaluated players\" means you scored higher than 18,173 players who submitted videos from Delhi trials.","\"Delhi Rank #247 of 18,420 evaluated players\" का मतलब है कि आपने Delhi trials से videos submit करने वाले 18,173 players से ज्यादा score किया।")}
                </p>
              </div>
              <div style={{background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.25)',borderRadius:12,padding:'18px 20px'}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#3B82F6',marginBottom:10}}>{t("Role Rank Example","Role Rank उदाहरण")}</div>
                <p style={{color:'rgba(255,255,255,0.7)',fontSize:14,lineHeight:1.7}}>
                  {t("\"All-Rounder Rank #38 of 3,140 (Top 1.2%)\" means among all All-rounders nationwide, you're in the top 1.2%.","\"All-Rounder Rank #38 of 3,140 (Top 1.2%)\" का मतलब है कि देश भर के सभी All-rounders में, आप top 1.2% में हैं।")}
                </p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:14,lineHeight:1.7,fontStyle:'italic'}}>
              {t("Rankings update daily as new evaluations complete. Your rank may improve or change as more players are evaluated in your city/role.","जैसे-जैसे नए evaluations पूरे होते हैं, रैंकिंग daily update होती है। आपकी rank बेहतर हो सकती है या बदल सकती है जैसे आपके शहर/role में और players evaluate होते हैं।")}
            </p>
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
                <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,3.5vw,32px)',color:'#fff',marginBottom:8}}>{t("Physical Trials","Physical Trials")}</h2>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{t("PHASE 2 — ONLY IF SELECTED","PHASE 2 — सिर्फ select होने पर")}</p>
              </div>
            </div>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:15,lineHeight:1.8,marginBottom:24}}>
              {t("Top-ranked players from Phase 1 receive an invitation to physical trials in their city. Trials are conducted at professional cricket grounds. Experienced coaches evaluate players live on standardized drills: batting nets, bowling spells, fielding circuits, match simulations.","Phase 1 से top-ranked players को अपने शहर में physical trials का invitation मिलता है। Trials professional cricket grounds पर conduct किए जाते हैं। Experienced coaches live standardized drills पर players को evaluate करते हैं: batting nets, bowling spells, fielding circuits, match simulations।")}
            </p>
            <div style={{background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:12,padding:'20px 24px'}}>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#22C55E',marginBottom:12}}>{t("Phase 2 Fee Structure","Phase 2 Fee Structure")}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <p style={{color:'rgba(255,255,255,0.45)',fontSize:12,marginBottom:4}}>{t("Batsman / Bowler / WK","Batsman / Bowler / WK")}</p>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,color:'#fff'}}>₹2,000</div>
                </div>
                <div>
                  <p style={{color:'rgba(255,255,255,0.45)',fontSize:12,marginBottom:4}}>{t("All-Rounder","All-Rounder")}</p>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,color:'#fff'}}>₹3,000</div>
                </div>
              </div>
              <p style={{color:'rgba(255,255,255,0.55)',fontSize:13,marginTop:16,lineHeight:1.6}}>
                {t("Phase 2 fee covers: professional ground booking, professional coaching evaluation, match simulation setup, video documentation of your trial, and detailed performance report.","Phase 2 fee में शामिल है: professional ground booking, professional coaching evaluation, match simulation setup, आपके trial का video documentation, और detailed performance report।")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section className="trust-section" style={{position:'relative',zIndex:1}}>
        <div className="wrap" style={{maxWidth:900}}>
          <div className="glass-card" style={{padding:'clamp(28px,5vw,48px)',border:'1px solid rgba(139,92,246,0.15)',animation:'fadeSlide 0.7s ease 0.5s both'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24}}>
              <span className="step-num" style={{background:'linear-gradient(135deg,#8B5CF6,#7C3AED)'}}>5</span>
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
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:18,color:'#3B82F6',marginBottom:10}}>{t("Maximum Total Cost","अधिकतम कुल लागत")}</div>
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
                {t("This is the complete cost from registration to franchise auction. If you're not selected for Phase 2, you only pay Phase 1 fee (₹299/₹399). After auction selection, everything is free — jersey, training, matches, prize money.","यह registration से franchise auction तक की पूरी लागत है। अगर आप Phase 2 के लिए select नहीं होते, तो आप सिर्फ Phase 1 fee (₹299/₹399) देते हैं। Auction selection के बाद, सब कुछ free है — jersey, training, matches, prize money।")}
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
      <MobileStickyCTA/>
    </div>
  );
}
