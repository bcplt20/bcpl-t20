import React from 'react';
import { BCPLFooter } from '../components/BCPLFooter';

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
.inp { width:100%; background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.1); border-radius:14px; color:#F8F4EE; padding:15px 18px; font-family:Inter,sans-serif; font-size:15px; outline:none; transition:all 0.25s; appearance:none; }
.inp:focus { border-color:#FF7A29; background:rgba(255,122,41,0.06); box-shadow:0 0 0 4px rgba(255,122,41,0.12); }
.inp::placeholder { color:rgba(255,255,255,0.28); }
@keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes pulseGlow { 0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)} 50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes scanPulse { 0%,100%{opacity:0.03} 50%{opacity:0.08} }
@keyframes floatParticle { 0%{transform:translateY(0) rotate(0deg);opacity:0.4} 50%{opacity:0.8} 100%{transform:translateY(-80px) rotate(180deg);opacity:0} }
@keyframes fadeSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes floatUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes expandIn { from{opacity:0;max-height:0} to{opacity:1;max-height:600px} }
        /* float-reg-btn */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
        @media(max-width:1023px){ .float-reg-btn { display:none; } }
`;

const FAQS = [
  // Registration
  {cat:'Registration',q:'How do I register?',a:'Visit www.bcpl-t20.com, fill the registration form, choose your playing role (Batsman, Bowler, Wicket-Keeper, or All-Rounder), select your nearest trial city, and pay ₹299 (₹399 for All-Rounder). The entire process takes just 5 minutes.'},
  {cat:'Registration',q:'Can I register from any city?',a:'Yes! We have 75 trial cities across India. Simply select your nearest city during the registration process. We cover all major metros and many tier-2 cities.'},
  {cat:'Registration',q:'What happens after I register?',a:'You\'ll receive a confirmation email with your unique registration ID. You then need to upload a 60-second cricket skills video within 7 days of registration. Our scouting team reviews every single video.'},
  {cat:'Registration',q:'Can I change my role after registering?',a:'No. Role selection (Batsman, Bowler, Wicket-Keeper, All-Rounder) is final at the time of registration. Choose carefully based on your primary skill and comfort.'},
  {cat:'Registration',q:'Is the registration fee refundable?',a:'Yes, within 7 days of registration if you have not yet uploaded your evaluation video. Once your video has been uploaded and submitted for review, the fee becomes non-refundable. Please refer to our Refunds policy for full details.'},
  // Eligibility
  {cat:'Eligibility',q:'Who can participate in BCPL?',a:'Any working professional can participate — salaried employees, self-employed individuals, freelancers, or business owners. Minimum age is 18. There is no upper age limit. You must be currently employed or actively running a business.'},
  {cat:'Eligibility',q:'Do I need to be a trained cricketer?',a:'No formal training is required. We look for players with basic cricket experience and genuine passion for the game. Our BCCI-certified coaches evaluate attitude, effort, and raw talent — not just polished technique.'},
  {cat:'Eligibility',q:'Are women eligible to participate?',a:'Season 5 is a men\'s-only edition. However, BCPL is actively planning a dedicated women\'s division for Season 6 (2026). Stay tuned to our social media for announcements.'},
  {cat:'Eligibility',q:'Is there an age limit?',a:'The minimum age is 18 years. There is no maximum age limit — we\'ve had players in their 40s compete at the highest level in previous seasons. Cricket is for everyone!'},
  // Selection
  {cat:'Selection',q:'How does the video evaluation work?',a:'After uploading your 60-second skills video, it is reviewed by BCCI-certified scouts within 15 working days. Each video is evaluated anonymously on specific skill criteria relevant to your registered role. You receive a detailed result via email.'},
  {cat:'Selection',q:'What happens if I get shortlisted?',a:'Shortlisted players are invited to a physical trial in their selected city. These trials are conducted at professional cricket grounds. Top performers from the physical trials then enter the franchise auction pool.'},
  {cat:'Selection',q:'What is the franchise auction?',a:'The 10 BCPL franchise teams (Delhi Dynamos, Mumbai Mavericks, Pune Panthers, etc.) bid for players from the trial pool. Players selected in the auction play in the main BCPL T20 season completely free — zero additional fee required.'},
  {cat:'Selection',q:'How many players get selected each season?',a:'Each franchise picks 12–15 players, meaning roughly 120–150 players play in the main season. This represents about 5–8% of total registrants. Selection is purely merit-based through our transparent scouting system.'},
  // Payment
  {cat:'Payment',q:'What payment methods are accepted?',a:'We accept all major UPI apps (GPay, PhonePe, Paytm, etc.), debit and credit cards (Visa, Mastercard, RuPay), net banking from 50+ banks, and popular wallets. All payments are processed securely via Cashfree.'},
  {cat:'Payment',q:'Is my payment information secure?',a:'Yes, absolutely. All transactions are secured with 256-bit SSL encryption via Cashfree, India\'s most trusted payment gateway. BCPL never stores your card details — all sensitive data is handled exclusively by Cashfree\'s PCI-DSS compliant infrastructure.'},
  {cat:'Payment',q:'Can I get a GST invoice for my registration?',a:'Yes. Email invoice@bcpl-t20.com with your Registration ID and GSTIN (if applicable). GST invoices are issued within 3 business days. The registration fee attracts applicable GST as per government regulations.'},
  {cat:'Payment',q:'When is payment deducted from my account?',a:'Payment is deducted immediately upon successful form submission. Cashfree processes the transaction in real-time. You receive a payment confirmation SMS and email instantly after deduction.'},
  // General
  {cat:'General',q:'When is BCPL Season 5?',a:'Video trials run from July–August 2025. Physical trials take place August–September 2025. The main BCPL T20 season (matches) runs September–November 2025. The finale is expected in late November 2025.'},
  {cat:'General',q:'Where are the matches held?',a:'BCPL Season 5 matches are held at professional cricket grounds in franchise cities, including iconic venues like DY Patil Stadium (Mumbai), Feroz Shah Kotla (Delhi), and other professional grounds across our 10 franchise cities.'},
  {cat:'General',q:'How is BCPL different from other corporate leagues?',a:'Three key differences: (1) Franchise system — real teams, real auctions, just like IPL. (2) Professional grounds and BCCI-certified coaches — not local maidan cricket. (3) Zero hidden fees — ₹299 entry, and if selected in auction, you play for FREE. No other league offers this.'},
];

const CATS = ['All','Registration','Eligibility','Selection','Payment','General'];

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

function AnnouncementBar() {
  return (
    <div style={{position:'relative',zIndex:10,background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)',backgroundSize:'300% 100%',animation:'gradShift 4s ease infinite',color:'#fff',padding:'11px 20px',textAlign:'center',fontSize:13,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.04em',display:'flex',alignItems:'center',justifyContent:'center',gap:16,flexWrap:'wrap'}}>
      <span>🏏 Season 5 Registrations OPEN — ₹299 Only</span>
      <span style={{width:1,height:14,background:'rgba(255,255,255,0.4)',display:'inline-block'}}/>
      <span>75 Cities · 10 Franchises · 5,000+ Players</span>
      <span style={{width:1,height:14,background:'rgba(255,255,255,0.4)',display:'inline-block'}}/>
      <span>#OfficeSeStadiumtak</span>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = React.useState(false);
  const links = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:200,background:'rgba(6,14,28,0.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.07)',boxShadow:'0 1px 0 0 rgba(255,122,41,0.25)'}}>
        <div className="wrap" style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <a href="/" style={{display:'flex',flexDirection:'row',alignItems:'center',gap:8,textDecoration:'none',flexShrink:0,whiteSpace:'nowrap'}}>
            <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL"
              style={{height:36,maxWidth:100,width:'auto',objectFit:'contain',display:'block',filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))',flexShrink:0}}/>
            <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(232,178,61,0.12)',border:'1px solid rgba(232,178,61,0.5)',borderRadius:6,padding:'3px 10px',flexShrink:0}}>
              <span style={{fontSize:9}}>🏆</span>
              <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:9,color:'#E8B23D',letterSpacing:'.12em'}}>SEASON 5</span>
            </div>
          </a>
          <div className="desk-nav">
            {links.map(l=>(
              <a key={l} href={ROUTE_MAP[l]||'/'} style={{color:l==='FAQ'?'#FF7A29':'rgba(255,255,255,0.75)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',transition:'color 0.2s'}}>{l}</a>
            ))}
          </div>
          <button className="ham-btn" onClick={()=>setOpen(o=>!o)} style={{flexDirection:'column',gap:5,background:'none',border:'none',cursor:'pointer',padding:8,zIndex:201}}>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(45deg) translate(5px,5px)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'scaleX(0)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(-45deg) translate(5px,-5px)':''}}/>
          </button>
        </div>
      </nav>
      {open && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#06101E',zIndex:300,display:'flex',flexDirection:'column',padding:'72px 24px 40px',overflowY:'auto'}}>
          <button onClick={()=>setOpen(false)} style={{position:'absolute',top:18,right:20,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:28,cursor:'pointer',lineHeight:1}}>✕</button>
          <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{height:36,width:'auto',objectFit:'contain',marginBottom:32,filter:'brightness(1.3)'}}/>
          {links.map(l=>(
            <a key={l} href={ROUTE_MAP[l]||'/'} onClick={()=>setOpen(false)} style={{color:'rgba(255,255,255,0.88)',fontWeight:700,fontSize:20,textDecoration:'none',fontFamily:'Montserrat,sans-serif',padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{l}</a>
          ))}
          <a href="/register" className="btn-fire" style={{marginTop:32,height:54,fontSize:17,width:'100%',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>📝 Register for ₹299 →</a>
        </div>
      )}
    </>
  );
}


function MobileStickyCTA() {
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'10px 16px calc(16px + env(safe-area-inset-bottom))',gap:10}}>
      <a href="/register" className="btn-fire" style={{flex:2,height:52,fontSize:15,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>Register ₹299 →</a>
      <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="btn-wa" style={{flex:1,height:52,fontSize:14,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>💬 WhatsApp</a>
    </div>
  );
}

function AccordionItem({q,a,open,onToggle}: {q:string,a:string,open:boolean,onToggle:()=>void}) {
  return (
    <div className="glass-card" style={{marginBottom:12,overflow:'hidden',border:open?'1px solid rgba(255,122,41,0.4)':'1px solid rgba(255,255,255,0.09)',transition:'border 0.2s',borderLeft:open?'3px solid #FF7A29':'1px solid rgba(255,255,255,0.09)'}}>
      <button onClick={onToggle} style={{width:'100%',background:'none',border:'none',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',gap:16,textAlign:'left'}}>
        <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:15,color:open?'#FF7A29':'rgba(255,255,255,0.88)',transition:'color 0.2s',lineHeight:1.4}}>{q}</span>
        <span style={{flexShrink:0,width:28,height:28,borderRadius:'50%',background:open?'rgba(255,122,41,0.2)':'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',color:open?'#FF7A29':'rgba(255,255,255,0.5)',fontSize:18,transition:'all 0.25s',transform:open?'rotate(45deg)':''}}>+</span>
      </button>
      {open && (
        <div style={{padding:'0 24px 20px',animation:'expandIn 0.3s ease'}}>
          <p style={{color:'rgba(255,255,255,0.68)',fontSize:14,lineHeight:1.8,fontFamily:'Inter,sans-serif'}}>{a}</p>
        </div>
      )}
    </div>
  );
}


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

export function FAQ() {
  const [search, setSearch] = React.useState('');
  const [cat, setCat] = React.useState('All');
  const [openIdx, setOpenIdx] = React.useState<number|null>(0);

  const filtered = FAQS.filter(f => {
    const matchCat = cat==='All' || f.cat===cat;
    const matchSearch = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{minHeight:'100vh',background:'#060E1C',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <AnnouncementBar/>
      <Navbar/>

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'100px 0 60px',textAlign:'center'}}>
        <div className="wrap">
          <div className="tag-pill" style={{marginBottom:24,animation:'floatUp 0.6s ease both'}}>QUESTIONS?</div>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,color:'#fff',marginBottom:12,animation:'floatUp 0.7s ease 0.1s both'}}>
            WE'VE GOT
          </h1>
          <h1 className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:28,animation:'floatUp 0.7s ease 0.2s both'}}>
            ANSWERS.
          </h1>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:18,maxWidth:500,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            20+ answers to every question you have about registering, playing, and winning.
          </p>
        </div>
      </section>

      {/* SEARCH */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 32px'}}>
        <div className="wrap" style={{maxWidth:700,margin:'0 auto'}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:18,top:'50%',transform:'translateY(-50%)',fontSize:18,color:'rgba(255,255,255,0.3)'}}>🔍</span>
            <input
              className="inp"
              style={{paddingLeft:52,fontSize:16}}
              placeholder="Search 20+ questions..."
              value={search}
              onChange={e=>{ setSearch(e.target.value); setOpenIdx(null); }}
            />
          </div>
        </div>
      </section>

      {/* CATEGORY TABS */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        <div className="wrap">
          <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>{ setCat(c); setOpenIdx(null); }} style={{padding:'10px 22px',borderRadius:100,border:`1.5px solid ${cat===c?'#FF7A29':'rgba(255,255,255,0.12)'}`,background:cat===c?'rgba(255,122,41,0.15)':'rgba(255,255,255,0.04)',color:cat===c?'#FF7A29':'rgba(255,255,255,0.6)',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:13,cursor:'pointer',transition:'all 0.2s',letterSpacing:'0.04em'}}>
                {c}
                <span style={{marginLeft:8,background:'rgba(255,255,255,0.1)',borderRadius:100,padding:'2px 8px',fontSize:11,color:'rgba(255,255,255,0.45)'}}>
                  {c==='All'?FAQS.length:FAQS.filter(f=>f.cat===c).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 60px'}}>
        <div className="wrap" style={{maxWidth:860,margin:'0 auto'}}>
          {filtered.length===0 ? (
            <div style={{textAlign:'center',padding:'60px 20px'}}>
              <div style={{fontSize:40,marginBottom:16}}>🤔</div>
              <div style={{color:'rgba(255,255,255,0.5)',fontSize:16,fontFamily:'Inter,sans-serif'}}>No questions found. Try a different search term.</div>
            </div>
          ) : filtered.map((f,i)=>(
            <AccordionItem
              key={`${f.cat}-${i}`}
              q={f.q}
              a={f.a}
              open={openIdx===i}
              onToggle={()=>setOpenIdx(openIdx===i?null:i)}
            />
          ))}
        </div>
      </section>

      {/* STILL HAVE QUESTIONS */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 120px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'clamp(20px,5vw,48px) clamp(16px,4vw,48px)',textAlign:'center',maxWidth:720,margin:'0 auto',border:'1px solid rgba(232,178,61,0.2)'}}>
            <div style={{fontSize:44,marginBottom:16}}>💬</div>
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:28,color:'#fff',marginBottom:8}}>Still Have Questions?</h2>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:15,marginBottom:32,lineHeight:1.6}}>Our support team is here for you. We'll respond within 2 hours on WhatsApp.</p>
            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="btn-wa" style={{padding:'14px 28px',fontSize:15,borderRadius:14,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8}}>💬 WhatsApp Us</a>
              <a href="mailto:info@bcpl-t20.com" style={{textDecoration:'none'}}>
                <button style={{padding:'14px 28px',fontSize:15,borderRadius:14,background:'rgba(6,182,212,0.15)',border:'1.5px solid rgba(6,182,212,0.4)',color:'#06B6D4',fontFamily:'Montserrat,sans-serif',fontWeight:700,cursor:'pointer'}}>📧 Email Us</button>
              </a>
              <a href="tel:+919876543210" style={{textDecoration:'none'}}>
                <button style={{padding:'14px 28px',fontSize:15,borderRadius:14,background:'rgba(139,92,246,0.15)',border:'1.5px solid rgba(139,92,246,0.4)',color:'#8B5CF6',fontFamily:'Montserrat,sans-serif',fontWeight:700,cursor:'pointer'}}>📞 Call Us</button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FLOATING REGISTER BUTTON ── */}
      <a className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>🏏 REGISTER NOW &rarr;</a>
      <BCPLFooter />
      <MobileStickyCTA/>
    </div>
  );
}
