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
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
        @media(max-width:1023px){ .float-reg-btn { display:none; } }
`;

const FAQS = [
  // Registration
  {cat:'Registration',qEn:'How do I register?',qHi:'मैं कैसे register करूं?',aEn:'Visit www.bcplt20.com, fill the registration form, choose your playing role (Batsman, Bowler, Wicket-Keeper, or All-Rounder), select your nearest trial city, and pay ₹299 (₹399 for All-Rounder). The entire process takes just 5 minutes.',aHi:'www.bcplt20.com पर जाएं, registration form भरें, अपनी playing role चुनें (Batsman, Bowler, Wicket-Keeper, या All-Rounder), अपना nearest trial city select करें, और ₹299 (All-Rounder के लिए ₹399) pay करें। पूरी process सिर्फ 5 मिनट में।'},
  {cat:'Registration',qEn:'Can I register from any city?',qHi:'क्या मैं किसी भी शहर से register कर सकता हूं?',aEn:'Yes! We have 75 trial cities across India. Simply select your nearest city during the registration process. We cover all major metros and many tier-2 cities.',aHi:'हां! हमारे पास पूरे भारत में 75 trial cities हैं। Registration process के दौरान अपना nearest city select करें। हम सभी major metros और कई tier-2 cities cover करते हैं।'},
  {cat:'Registration',qEn:'What happens after I register?',qHi:'Register करने के बाद क्या होता है?',aEn:'You\'ll receive a confirmation email with your unique registration ID. You then need to upload a 2-minute cricket skills video within 15 days of registration. Our scouting team reviews every single video and delivers a result within 15 working days.',aHi:'आपको registration ID के साथ confirmation email मिलेगा। फिर आपको 15 दिनों के अंदर 2-minute cricket skills video upload करना होगा। हमारी scouting team हर video को review करती है और 15 working days में result देती है।'},
  {cat:'Registration',qEn:'Can I change my role after registering?',qHi:'क्या मैं register करने के बाद अपनी role बदल सकता हूँ?',aEn:'No. Role selection (Batsman, Bowler, Wicket-Keeper, All-Rounder) is final at the time of registration. Choose carefully based on your primary skill and comfort.',aHi:'नहीं। Registration के समय role (Batsman, Bowler, Wicket-Keeper, All-Rounder) selection final है। अपनी skill और comfort के हिसाब से ध्यान से चुनें।'},
  {cat:'Registration',qEn:'Is the registration fee refundable?',qHi:'क्या registration fee refundable है?',aEn:'Yes, within 15 days of registration if you have not yet uploaded your evaluation video. Once your video has been uploaded and submitted for review, the fee becomes non-refundable. Please refer to our Refunds policy for full details.',aHi:'हाँ, registration के 15 दिनों के अंदर अगर आपने evaluation video upload नहीं किया है। Video upload होने और review के लिए submit होने के बाद fee non-refundable हो जाती है। Details के लिए हमारी Refunds policy देखें।'},
  // Eligibility
  {cat:'Eligibility',qEn:'Who can participate in BCPL?',qHi:'BCPL में कौन participate कर सकता है?',aEn:'Any working professional can participate — salaried employees, self-employed individuals, freelancers, or business owners. Minimum age is 18. There is no upper age limit. You must be currently employed or actively running a business.',aHi:'कोई भी working professional participate कर सकता है — salaried employees, self-employed, freelancers, या business owners। Minimum age 18 है। कोई upper age limit नहीं है। आपको currently employed होना चाहिए या अपना business चलाना चाहिए।'},
  {cat:'Eligibility',qEn:'Do I need to be a trained cricketer?',qHi:'क्या मुझे trained cricketer होना ज़रूरी है?',aEn:'No formal training is required. We look for players with basic cricket experience and genuine passion for the game. Our BCCI-certified coaches evaluate attitude, effort, and raw talent — not just polished technique.',aHi:'कोई formal training ज़रूरी नहीं है। हम basic cricket experience और game के लिए passion देखते हैं। हमारे BCCI-certified coaches attitude, effort और raw talent को evaluate करते हैं — सिर्फ polished technique नहीं।'},
  {cat:'Eligibility',qEn:'Are women eligible to participate?',qHi:'क्या महिलाएं participate कर सकती हैं?',aEn:'Season 5 is a men\'s-only edition. However, BCPL is actively planning a dedicated women\'s division for Season 6 (2026). Stay tuned to our social media for announcements.',aHi:'Season 5 men\'s-only edition है। हालाँकि, BCPL Season 6 (2026) के लिए dedicated women\'s division plan कर रहा है। Announcements के लिए हमारे social media से जुड़े रहें।'},
  {cat:'Eligibility',qEn:'Is there an age limit?',qHi:'क्या कोई age limit है?',aEn:'The minimum age is 18 years. There is no maximum age limit — we\'ve had players in their 40s compete at the highest level in previous seasons. Cricket is for everyone!',aHi:'Minimum age 18 साल है। कोई maximum age limit नहीं है — पिछले seasons में 40s की उम्र के players भी खेले हैं। Cricket सबके लिए है!'},
  // Selection
  {cat:'Selection',qEn:'How does the video evaluation work?',qHi:'Video evaluation कैसे काम करता है?',aEn:'After uploading your 60-second skills video, it is reviewed by BCCI-certified scouts within 15 working days. Each video is evaluated anonymously on specific skill criteria relevant to your registered role. You receive a detailed result via email.',aHi:'आपका 60-second skills video upload होने के बाद, BCCI-certified scouts 15 working days में review करते हैं। हर video को anonymously evaluate किया जाता है। आपको email पर detailed result मिलता है।'},
  {cat:'Selection',qEn:'What happens if I get shortlisted?',qHi:'अगर मैं shortlist हो गया तो क्या होगा?',aEn:'Shortlisted players are invited to a physical trial in their selected city. These trials are conducted at professional cricket grounds. Top performers from the physical trials then enter the franchise auction pool.',aHi:'Shortlisted players को उनके शहर में physical trial के लिए invite किया जाता है। ये trials professional cricket grounds पर होते हैं। Top performers फिर franchise auction pool में जाते हैं।'},
  {cat:'Selection',qEn:'What is the franchise auction?',qHi:'Franchise auction क्या है?',aEn:'The 10 BCPL franchise teams (Delhi Dynamos, Mumbai Mavericks, Pune Panthers, etc.) bid for players from the trial pool. Players selected in the auction play in the main BCPL T20 season completely free — zero additional fee required.',aHi:'10 BCPL franchise teams (Delhi Dynamos, Mumbai Mavericks, Pune Panthers, etc.) trial pool के players के लिए bid करती हैं। Auction में select हुए players main BCPL T20 season बिल्कुल free खेलते हैं — कोई extra fee नहीं।'},
  {cat:'Selection',qEn:'How many players get selected each season?',qHi:'हर season कितने players select होते हैं?',aEn:'Each franchise picks 12–15 players, meaning roughly 120–150 players play in the main season. This represents about 5–8% of total registrants. Selection is purely merit-based through our transparent scouting system.',aHi:'हर franchise 12–15 players pick करती है, मतलब लगभग 120–150 players main season में खेलते हैं। यह total registrants का करीब 5–8% है। Selection सिर्फ transparent scouting system के ज़रिए merit-based होता है।'},
  // Payment
  {cat:'Payment',qEn:'What payment methods are accepted?',qHi:'कौनसे payment methods accept किए जाते हैं?',aEn:'We accept all major UPI apps (GPay, PhonePe, Paytm, etc.), debit and credit cards (Visa, Mastercard, RuPay), net banking from 50+ banks, and popular wallets. All payments are processed securely via Cashfree.',aHi:'हम सभी major UPI apps (GPay, PhonePe, Paytm, etc.), debit/credit cards, 50+ banks से net banking, और wallets accept करते हैं। सभी payments Cashfree के ज़रिए securely process होते हैं।'},
  {cat:'Payment',qEn:'Is my payment information secure?',qHi:'क्या मेरी payment information secure है?',aEn:'Yes, absolutely. All transactions are secured with 256-bit SSL encryption via Cashfree, India\'s most trusted payment gateway. BCPL never stores your card details — all sensitive data is handled exclusively by Cashfree\'s PCI-DSS compliant infrastructure.',aHi:'हाँ, बिल्कुल। सभी transactions 256-bit SSL encryption के साथ Cashfree (India\'s most trusted payment gateway) के ज़रिए secure हैं। BCPL कभी card details store नहीं करता।'},
  {cat:'Payment',qEn:'Can I get a GST invoice for my registration?',qHi:'क्या मुझे registration का GST invoice मिल सकता है?',aEn:'Yes. Email support@bcplt20.com with your Registration ID and GSTIN (if applicable). GST invoices are issued within 3 business days. The registration fee attracts applicable GST as per government regulations.',aHi:'हाँ। अपना Registration ID और GSTIN support@bcplt20.com पर email करें। GST invoices 3 business days में issue हो जाते हैं।'},
  {cat:'Payment',qEn:'When is payment deducted from my account?',qHi:'मेरे account से payment कब deduct होता है?',aEn:'Payment is deducted immediately upon successful form submission. Cashfree processes the transaction in real-time. You receive a payment confirmation SMS and email instantly after deduction.',aHi:'Form successfully submit होते ही payment deduct हो जाता है। आपको instantly SMS और email confirmation मिलता है।'},
  // General
  {cat:'General',qEn:'When is BCPL Season 5?',qHi:'BCPL Season 5 कब है?',aEn:'Video trials run from July–August 2025. Physical trials take place August–September 2025. The main BCPL T20 season (matches) runs September–November 2025. The finale is expected in late November 2025.',aHi:'Video trials July–August 2025 में होंगे। Physical trials August–September 2025 में। Main BCPL T20 season September–November 2025 में खेला जाएगा।'},
  {cat:'General',qEn:'Where are the matches held?',qHi:'Matches कहाँ होते हैं?',aEn:'BCPL Season 5 matches are held at professional cricket grounds in franchise cities, including iconic venues like DY Patil Stadium (Mumbai), Feroz Shah Kotla (Delhi), and other professional grounds across our 10 franchise cities.',aHi:'BCPL Season 5 के matches 10 franchise cities के professional cricket grounds पर होते हैं, जैसे DY Patil Stadium (Mumbai), Feroz Shah Kotla (Delhi)।'},
  {cat:'General',qEn:'How is BCPL different from other corporate leagues?',qHi:'BCPL दूसरी corporate leagues से कैसे अलग है?',aEn:'Three key differences: (1) Franchise system — real teams, real auctions, just like IPL. (2) Professional grounds and BCCI-certified coaches — not local maidan cricket. (3) Zero hidden fees — ₹299 entry, and if selected in auction, you play for FREE. No other league offers this.',aHi:'तीन बड़े फर्क: (1) Franchise system — real teams, real auctions (IPL की तरह)। (2) Professional grounds और BCCI-certified coaches। (3) Zero hidden fees — ₹299 entry, और auction में select होने पर free में खेलें।'},
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

function MobileStickyCTA() {
  const { t } = useLang();
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'10px 16px calc(16px + env(safe-area-inset-bottom))',gap:10}}>
      <Link href="/register" className="btn-fire" style={{flex:2,height:52,fontSize:15,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>{t("Register ₹299 →","₹299 में Register करें →")}</Link>
      <a href="https://wa.me/919151346555" target="_blank" rel="noopener noreferrer" className="btn-wa" style={{flex:1,height:52,fontSize:14,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:6}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
        WhatsApp
      </a>
    </div>
  );
}

function AccordionItem({qEn,qHi,aEn,aHi,open,onToggle,lang}: {qEn:string,qHi:string,aEn:string,aHi:string,open:boolean,onToggle:()=>void,lang:'en'|'hi'}) {
  const q = lang==='hi' ? qHi : qEn;
  const a = lang==='hi' ? aHi : aEn;
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
  const { t, lang } = useLang();
  const [search, setSearch] = React.useState('');
  const [cat, setCat] = React.useState('All');
  const [openIdx, setOpenIdx] = React.useState<number|null>(0);

  const filtered = FAQS.filter(f => {
    const matchCat = cat==='All' || f.cat===cat;
    const q = lang==='hi' ? f.qHi : f.qEn;
    const a = lang==='hi' ? f.aHi : f.aEn;
    const matchSearch = !search || q.toLowerCase().includes(search.toLowerCase()) || a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{minHeight:'100vh',background:'#060E1C',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <SiteHeader active="FAQ" />

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'100px 0 60px',textAlign:'center'}}>
        <div className="wrap">
          <div className="tag-pill" style={{marginBottom:24,animation:'floatUp 0.6s ease both'}}>{t("QUESTIONS?","सवाल?")}</div>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,color:'#fff',marginBottom:12,animation:'floatUp 0.7s ease 0.1s both'}}>
            {t("WE'VE GOT","हमारे पास हैं")}
          </h1>
          <h1 className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:28,animation:'floatUp 0.7s ease 0.2s both'}}>
            {t("ANSWERS.","जवाब।")}
          </h1>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:18,maxWidth:500,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            {t("20+ answers to every question you have about registering, playing, and winning.","Registering, playing, और winning के बारे में हर सवाल के 20+ जवाब।")}
          </p>
        </div>
      </section>

      {/* SEARCH */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 32px'}}>
        <div className="wrap" style={{maxWidth:700,margin:'0 auto'}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:18,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.3)',display:'flex',alignItems:'center'}}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
            </span>
            <input
              className="inp"
              style={{paddingLeft:52,fontSize:16}}
              placeholder={t("Search 20+ questions...", "20+ सवाल Search करें...")}
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
              <div style={{color:'rgba(255,255,255,0.5)',fontSize:16,fontFamily:'Inter,sans-serif'}}>{t("No questions found. Try a different search term.","कोई सवाल नहीं मिला। दूसरा search term try करें।")}</div>
            </div>
          ) : filtered.map((f,i)=>(
            <AccordionItem
              key={`${f.cat}-${i}`}
              qEn={f.qEn}
              qHi={f.qHi}
              aEn={f.aEn}
              aHi={f.aHi}
              open={openIdx===i}
              onToggle={()=>setOpenIdx(openIdx===i?null:i)}
              lang={lang}
            />
          ))}
        </div>
      </section>

      {/* STILL HAVE QUESTIONS */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 120px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'clamp(20px,5vw,48px) clamp(16px,4vw,48px)',textAlign:'center',maxWidth:720,margin:'0 auto',border:'1px solid rgba(232,178,61,0.2)'}}>
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:28,color:'#fff',marginBottom:8}}>{t("Still Have Questions?","अभी भी सवाल हैं?")}</h2>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:15,marginBottom:32,lineHeight:1.6}}>{t("Our support team is here for you. We'll respond within 2 hours on WhatsApp.","हमारी support team आपके लिए यहां है। हम WhatsApp पर 2 घंटे में जवाब देंगे।")}</p>
            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
              <a href="https://wa.me/919151346555" target="_blank" rel="noopener noreferrer" className="btn-wa" style={{padding:'14px 28px',fontSize:15,borderRadius:14,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                {t("WhatsApp Us","WhatsApp करें")}
              </a>
              <a href="mailto:support@bcplt20.com" style={{textDecoration:'none'}}>
                <button style={{padding:'14px 28px',fontSize:15,borderRadius:14,background:'rgba(6,182,212,0.15)',border:'1.5px solid rgba(6,182,212,0.4)',color:'#06B6D4',fontFamily:'Montserrat,sans-serif',fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8}}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
                  {t("Email Us","Email करें")}
                </button>
              </a>
              <a href="tel:+919151346555" style={{textDecoration:'none'}}>
                <button style={{padding:'14px 28px',fontSize:15,borderRadius:14,background:'rgba(139,92,246,0.15)',border:'1.5px solid rgba(139,92,246,0.4)',color:'#8B5CF6',fontFamily:'Montserrat,sans-serif',fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8}}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {t("Call Us","Call करें")}
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FLOATING REGISTER BUTTON ── */}
      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>{t("REGISTER NOW","अभी REGISTER करें")} &rarr;</Link>
      <BCPLFooter />
      <MobileStickyCTA/>
    </div>
  );
}
