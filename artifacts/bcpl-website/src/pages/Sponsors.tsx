import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { SponsorWall } from '../components/SponsorWall';


// Sponsor data will be added once partnerships are confirmed
const SPONSOR_TIERS = [
  { labelEn:'TITLE SPONSOR', labelHi:'TITLE SPONSOR', color:'#E8B23D', descEn:'Exclusive brand visibility across all Season 5 matches, jerseys, and digital platforms.', descHi:'Season 5 के सभी matches, jerseys और digital platforms पर exclusive brand visibility।' },
  { labelEn:'PRESENTING SPONSOR', labelHi:'PRESENTING SPONSOR', color:'#FF7A29', descEn:'Premium partner status with prominent placement at all trial cities and match venues.', descHi:'सभी trial cities और match venues पर prominent placement के साथ premium partner status।' },
  { labelEn:'ASSOCIATE SPONSOR', labelHi:'ASSOCIATE SPONSOR', color:'rgba(255,255,255,0.4)', descEn:'Targeted brand exposure across BCPL digital channels and city-level events.', descHi:'BCPL digital channels और city-level events पर targeted brand exposure।' },
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

export function Sponsors() {
  const { t } = useLang();
  const [name,setName]=React.useState('');
  const [email,setEmail]=React.useState('');
  const [company,setCompany]=React.useState('');
  const [message,setMessage]=React.useState('');
  const [sent,setSent]=React.useState(false);

  return (
    <div style={{background:'#060E1C',color:'#fff',minHeight:'100vh',overflowX:'hidden',fontFamily:'Inter,sans-serif'}}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .wrap{max-width:1200px;margin:0 auto;padding:0 20px;}
        .desk-nav{display:none;align-items:center;gap:22px;}
        .ham-btn{display:flex;}
        @media(min-width:768px){.wrap{padding:0 32px}}
        @media(min-width:1280px){.wrap{padding:0 48px}}
        .v3-kicker{font-family:Inter,sans-serif;font-weight:700;font-size:12px;letter-spacing:.22em;color:#E8B23D;text-transform:uppercase;}
        .v3-h{font-family:'Barlow Condensed','Mukta','Montserrat',sans-serif;font-weight:800;text-transform:uppercase;line-height:.95;letter-spacing:.015em;}
        @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}.tier2-grid{grid-template-columns:repeat(4,1fr)!important;}.tier3-grid{grid-template-columns:repeat(3,1fr)!important;}.tier1-grid{grid-template-columns:repeat(2,1fr)!important;}.stats-row{grid-template-columns:repeat(4,1fr)!important;}.form-row{grid-template-columns:1fr 1fr!important;}}
        @media(min-width:640px){.tier2-grid{grid-template-columns:repeat(2,1fr)!important;}.tier3-grid{grid-template-columns:repeat(3,1fr)!important;}.form-row{grid-template-columns:1fr 1fr!important;}}
        .btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:var(--font-head);font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;}
        .btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
        .btn-fire:active{transform:scale(0.97);}
        .btn-wa{background:linear-gradient(135deg,#25D366,#1BA851);border:none;border-radius:14px;color:#fff;font-weight:700;cursor:pointer;font-family:var(--font-head);transition:transform 0.15s;}
        .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
        .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:var(--font-head);color:#FF7A29;letter-spacing:0.1em;}
        .inp{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:14px;color:#F8F4EE;padding:15px 18px;font-family:Inter,sans-serif;font-size:15px;outline:none;transition:all 0.25s;appearance:none;}
        .inp:focus{border-color:#FF7A29;background:rgba(255,122,41,0.06);box-shadow:0 0 0 4px rgba(255,122,41,0.12);}
        .inp::placeholder{color:rgba(255,255,255,0.28);}
        .lbl{font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:8px;display:block;font-family:var(--font-head);}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes goldShimmer{0%,100%{border-color:rgba(232,178,61,0.3);box-shadow:0 0 20px rgba(232,178,61,0.1)}50%{border-color:rgba(232,178,61,0.8);box-shadow:0 0 40px rgba(232,178,61,0.3),0 0 80px rgba(232,178,61,0.1)}}
        @keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
        @keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes borderGlow{0%,100%{border-color:rgba(255,122,41,0.25)}50%{border-color:rgba(255,122,41,0.7)}}
        @keyframes orangeGlow{0%,100%{border-color:rgba(255,122,41,0.2)}50%{border-color:rgba(255,122,41,0.6)}}
      
        /* ── FLOATING REGISTER BUTTON ── */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:var(--font-head); font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
        @media(max-width:1023px){ .float-reg-btn { display:none; } }
      `}</style>

      {/* Ambient Background */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
        <svg style={{position:'absolute',bottom:0,left:0,width:'100%',opacity:0.07}} viewBox="0 0 1280 320" preserveAspectRatio="xMidYMax meet">
          <path d="M0,280 Q320,160 640,200 Q960,240 1280,180 L1280,320 L0,320 Z" fill="#1E3A5F"/>
          <rect x="80" y="60" width="8" height="200" fill="#2D4F7A"/>
          <rect x="70" y="50" width="28" height="12" fill="#2D4F7A"/>
          <rect x="1190" y="60" width="8" height="200" fill="#2D4F7A"/>
          <rect x="1180" y="50" width="28" height="12" fill="#2D4F7A"/>
          <rect x="440" y="220" width="400" height="60" fill="rgba(255,255,255,0.03)" rx="4"/>
        </svg>
        {[{top:'15%',left:'10%',c:'#FF7A29',d:'0s'},{top:'60%',left:'5%',c:'#E8B23D',d:'1.2s'},{top:'30%',left:'90%',c:'#fff',d:'2.4s'},{top:'75%',left:'85%',c:'#FF7A29',d:'0.6s'},{top:'50%',left:'50%',c:'#E8B23D',d:'1.8s'},{top:'10%',left:'70%',c:'#fff',d:'3s'},{top:'85%',left:'30%',c:'#FF7A29',d:'0.3s'},{top:'40%',left:'20%',c:'#E8B23D',d:'2.1s'}].map((p,i)=>(
          <div key={i} style={{position:'absolute',top:p.top,left:p.left,width:3,height:3,borderRadius:'50%',background:p.c,animation:`floatParticle 4s ease-in-out ${p.d} infinite`}}/>
        ))}
        <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,rgba(255,255,255,0.01) 0px,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <SiteHeader active="Sponsors" />

        {/* HERO */}
        <section style={{padding:'clamp(80px,12vh,130px) 0 clamp(40px,6vw,64px)',textAlign:'center'}}>
          <div className="wrap">
            <div className="v3-kicker" style={{marginBottom:16}}>{t("OUR PARTNERS","हमारे PARTNERS")}</div>
            <h1 className="v3-h" style={{fontSize:'clamp(40px,9vw,88px)',marginBottom:20}}>
              <span style={{color:'#fff',display:'block'}}>{t("THE BRANDS","THE BRANDS")}</span>
              <span className="shimmer-gold" style={{display:'block'}}>{t("BEHIND THE DREAM.","BEHIND THE DREAM.")}</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:'clamp(14px,2vw,17px)',lineHeight:1.7,maxWidth:640,margin:'0 auto',fontFamily:'Inter,sans-serif'}}>
              {t("Our partners share our passion for cricket and corporate excellence. Together, we're building India's corporate cricket movement.","हमारे partners cricket और corporate excellence के लिए हमारा जुनून साझा करते हैं। साथ मिलकर हम भारत का corporate cricket movement बना रहे हैं।")}
            </p>
          </div>
        </section>

        {/* OUR SPONSORS — live list managed from the admin panel */}
        <SponsorWall />

        {/* SPONSORSHIP TIERS */}
        <section style={{padding:'0 0 64px'}}>
          <div className="wrap">
            <div style={{textAlign:'center',marginBottom:40}}>
              <div style={{fontFamily:'var(--font-head)',fontWeight:900,fontSize:16,color:'#fff',marginBottom:8}}>{t("Sponsorship Opportunities — Season 5","Sponsorship Opportunities — Season 5")}</div>
              <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,fontFamily:'Inter,sans-serif',maxWidth:480,margin:'0 auto'}}>
                {t("We are actively seeking brand partners for BCPL Season 5. Reach working-professional cricketers across India.","हम BCPL Season 5 के लिए brand partners की तलाश कर रहे हैं। पूरे भारत के working-professional cricketers तक पहुंचें।")}
              </p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:20}}>
              {SPONSOR_TIERS.map((tier,i)=>(
                <div key={tier.labelEn} style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:`1.5px dashed ${tier.color}55`,borderRadius:20,padding:'28px 24px',display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
                  <div style={{width:60,height:60,borderRadius:'50%',background:`${tier.color}15`,border:`2px dashed ${tier.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>🤝</div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,flexWrap:'wrap'}}>
                      <span style={{fontFamily:'var(--font-head)',fontWeight:900,fontSize:14,color:tier.color,letterSpacing:'0.1em'}}>{t(tier.labelEn,tier.labelHi)}</span>
                      <span style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.35)',fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:100,fontFamily:'var(--font-head)'}}>{t("SLOT AVAILABLE","SLOT AVAILABLE")}</span>
                    </div>
                    <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,lineHeight:1.6,fontFamily:'Inter,sans-serif',margin:0}}>{t(tier.descEn,tier.descHi)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BECOME A SPONSOR */}
        <section style={{padding:'0 0 80px'}}>
          <div className="wrap">
            <div style={{background:'linear-gradient(135deg,rgba(15,34,71,0.96),rgba(10,22,46,0.92))',backdropFilter:'blur(32px)',border:'1px solid rgba(255,122,41,0.2)',borderRadius:24,padding:'48px 32px',animation:'borderGlow 3s ease-in-out infinite'}}>
              <div style={{textAlign:'center',marginBottom:40}}>
                <div className="v3-kicker" style={{marginBottom:16}}>{t("PARTNER WITH US","हमारे साथ PARTNER करें")}</div>
                <h2 className="v3-h" style={{fontSize:'clamp(26px,4vw,44px)',color:'#fff',marginBottom:12}}>{t("Become a Sponsor","Sponsor बनें")}</h2>
                <p style={{color:'rgba(255,255,255,0.5)',fontSize:15,lineHeight:1.7,maxWidth:480,margin:'0 auto',fontFamily:'Inter,sans-serif'}}>
                  {t("Reach an engaged national audience of working-professional cricketers. Be part of India's corporate cricket movement.","Working-professional cricketers की एक engaged national audience तक पहुंचें। भारत के corporate cricket movement का हिस्सा बनें।")}
                </p>
              </div>

              {/* STATS */}
              <div className="stats-row" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,marginBottom:40}}>
                {[
                  {valEn:'Nationwide',valHi:'Nationwide',labelEn:'Active Cricketers',labelHi:'Active Cricketers'},
                  {valEn:'Multi-City',valHi:'Multi-City',labelEn:'Trial Cities',labelHi:'Trial Cities'},
                  {valEn:'Pan-India',valHi:'Pan-India',labelEn:'Reach',labelHi:'पहुंच'},
                  {valEn:'Season 5',valHi:'Season 5',labelEn:'Since 2020',labelHi:'2020 से'},
                ].map((s,i)=>(
                  <div key={i} style={{background:'rgba(255,122,41,0.06)',border:'1px solid rgba(255,122,41,0.15)',borderRadius:14,padding:'20px 16px',textAlign:'center'}}>
                    <div style={{fontFamily:'var(--font-head)',fontWeight:900,fontSize:24,color:'#FF7A29',marginBottom:4}}>{t(s.valEn,s.valHi)}</div>
                    <div style={{color:'rgba(255,255,255,0.45)',fontSize:12,fontFamily:'Inter,sans-serif',letterSpacing:'0.04em'}}>{t(s.labelEn,s.labelHi)}</div>
                  </div>
                ))}
              </div>

              {/* CONTACT FORM */}
              {sent?(
                <div style={{textAlign:'center',padding:'40px 20px'}}>
                  <div style={{fontSize:48,marginBottom:16}}>✅</div>
                  <h3 style={{fontFamily:'var(--font-head)',fontWeight:900,fontSize:22,color:'#22C55E',marginBottom:8}}>{t("Enquiry Sent!","Enquiry भेज दी गई!")}</h3>
                  <p style={{color:'rgba(255,255,255,0.55)',fontFamily:'Inter,sans-serif'}}>{t("Our partnerships team will reach out to you within 48 hours.","हमारी partnerships team 48 hours के अंदर आपसे contact करेगी।")}</p>
                </div>
              ):(
                <div>
                  <div className="form-row" style={{display:'grid',gridTemplateColumns:'1fr',gap:16,marginBottom:16}}>
                    <div>
                      <label className="lbl">{t("Your Name","आपका नाम")}</label>
                      <input className="inp" placeholder={t("Rajesh Kumar","Rajesh Kumar")} value={name} onChange={e=>setName(e.target.value)}/>
                    </div>
                    <div>
                      <label className="lbl">{t("Email Address","Email Address")}</label>
                      <input className="inp" type="email" placeholder={t("rajesh@company.com","rajesh@company.com")} value={email} onChange={e=>setEmail(e.target.value)}/>
                    </div>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label className="lbl">{t("Company Name","Company का नाम")}</label>
                    <input className="inp" placeholder={t("Your Company Pvt. Ltd.","Your Company Pvt. Ltd.")} value={company} onChange={e=>setCompany(e.target.value)}/>
                  </div>
                  <div style={{marginBottom:24}}>
                    <label className="lbl">{t("Message","Message")}</label>
                    <textarea className="inp" placeholder={t("Tell us about your sponsorship interest, budget, and preferred tier...","हमें अपनी sponsorship interest, budget और preferred tier के बारे में बताएं...")} value={message} onChange={e=>setMessage(e.target.value)} style={{minHeight:110,resize:'vertical',lineHeight:1.6}}/>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <button className="btn-fire" onClick={()=>{if(name&&email)setSent(true);}} style={{padding:'16px 48px',fontSize:15,borderRadius:14}}>
                      {t("🤝 Send Enquiry →","🤝 Enquiry भेजें →")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <StickyRegisterCTA />

        <BCPLFooter />
      </div>
      {/* ── FLOATING REGISTER BUTTON ── */}
      <Link className="float-reg-btn float-reg-pulse" href="/register" style={{textDecoration:"none"}}>{t("🏏 REGISTER NOW →","🏏 अभी REGISTER करें →")}</Link>
    </div>
  );
}
