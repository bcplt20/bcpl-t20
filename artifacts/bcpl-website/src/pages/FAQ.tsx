import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';
import { LegalDocHeader } from '../lib/legalMeta';
import { useFees } from '../lib/fees';
import { SEASON } from '../lib/season';
import type { FeeConfig } from '../lib/api';
import { StickyRegisterCTA } from "../components/StickyRegisterCTA";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#1C2B47; }
.wrap { max-width:1200px; margin:0 auto; padding:0 20px; }
@media(min-width:1280px){ .wrap{padding:0 48px} }
.v3-kicker { font-family:Inter,sans-serif; font-weight:700; font-size:12px; letter-spacing:.22em; color:#E8B23D; text-transform:uppercase; }
.v3-h { font-family:'Barlow Condensed','Mukta','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; line-height:.95; letter-spacing:.015em; }
.desk-nav { display:none; align-items:center; gap:22px; }
.ham-btn { display:flex; }
@media(min-width:768px){ .wrap{padding:0 32px} }
@media(min-width:1024px){ .desk-nav{display:flex!important;} .ham-btn{display:none!important;} }
.btn-fire { background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%); border:none; border-radius:14px; color:#fff; font-family:var(--font-head); font-weight:800; cursor:pointer; box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2); transition:transform 0.15s,box-shadow 0.2s; letter-spacing:0.02em; animation:pulseGlow 3s ease-in-out infinite; }
.btn-fire:hover { transform:translateY(-2px); box-shadow:0 14px 40px rgba(255,122,41,0.6); }
.btn-fire:active { transform:scale(0.97); }
.btn-wa { background:linear-gradient(135deg,#25D366,#1BA851); border:none; border-radius:14px; color:#fff; font-weight:700; cursor:pointer; font-family:var(--font-head); transition:transform 0.15s; }
.glass-card { background:linear-gradient(135deg,rgba(30,55,105,0.9),rgba(23,43,81,0.85)); backdrop-filter:blur(32px); border:1px solid rgba(255,255,255,0.18); border-radius:20px; box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.18); }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
.tag-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,122,41,0.12); border:1px solid rgba(255,122,41,0.3); border-radius:100px; padding:5px 14px; font-size:11px; font-weight:700; font-family:var(--font-head); color:#FF7A29; letter-spacing:0.1em; }
.inp { width:100%; background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.18); border-radius:14px; color:#F8F4EE; padding:15px 18px; font-family:Inter,sans-serif; font-size:16px; outline:none; transition:all 0.25s; appearance:none; }
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
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:var(--font-head); font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
        @media(max-width:1023px){ .float-reg-btn { display:none; } }
`;

/* Fee mentions come from the shared fee config (GET /api/fees) so copy can
   never drift from what the server actually charges. */
const FAQS = (F: FeeConfig) => [
  // Registration
  {cat:'Registration',qEn:'How do I register?',qHi:'मैं कैसे register करूं?',aEn:'Visit www.bcplt20.com, fill the registration form, choose your playing role (Batsman, Bowler, Wicket-Keeper, or All-Rounder), select your nearest trial city, and pay ₹' + F.phase1.bat + ' + GST (₹' + F.phase1.ar + ' + GST for All-Rounder). The entire process takes just 5 minutes.',aHi:'www.bcplt20.com पर जाएं, registration form भरें, अपनी playing role चुनें (Batsman, Bowler, Wicket-Keeper, या All-Rounder), अपना nearest trial city select करें, और ₹' + F.phase1.bat + ' + GST (All-Rounder के लिए ₹' + F.phase1.ar + ' + GST) pay करें। पूरी process सिर्फ 5 मिनट में।'},
  {cat:'Registration',qEn:'Can I register from any city?',qHi:'क्या मैं किसी भी शहर से register कर सकता हूं?',aEn:'Yes! We have trial cities across India. Simply select your nearest city during the registration process. We cover all major metros and many tier-2 cities.',aHi:'हां! हमारे पास पूरे भारत में trial cities हैं। Registration process के दौरान अपना nearest city select करें। हम सभी major metros और कई tier-2 cities cover करते हैं।'},
  {cat:'Registration',qEn:'What happens after I register?',qHi:'Register करने के बाद क्या होता है?',aEn:'You\'ll receive a confirmation email with your unique registration ID. You then need to upload a 30–60 second cricket skills video within 15 days of registration. Your submission goes through BCPL\'s Phase 1 evaluation process and you receive a result within 48 hours.',aHi:'आपको registration ID के साथ confirmation email मिलेगा। फिर आपको 15 दिनों के अंदर 30–60 second cricket skills video upload करना होगा। आपकी submission BCPL के Phase 1 evaluation process से गुज़रती है और result 48 घंटे में मिलता है।'},
  {cat:'Registration',qEn:'Can I change my role after registering?',qHi:'क्या मैं register करने के बाद अपनी role बदल सकता हूँ?',aEn:'No. Role selection (Batsman, Bowler, Wicket-Keeper, All-Rounder) is final at the time of registration. Choose carefully based on your primary skill and comfort.',aHi:'नहीं। Registration के समय role (Batsman, Bowler, Wicket-Keeper, All-Rounder) selection final है। अपनी skill और comfort के हिसाब से ध्यान से चुनें।'},
  {cat:'Registration',qEn:'Is the Phase 1 fee refundable?',qHi:'क्या Phase 1 fee refundable है?',aEn:'No. Once a Phase 1 payment is successfully completed, the fee is non-refundable — including where you do not upload a video, upload after the deadline, upload an incomplete/invalid/corrupted/inaccessible/non-compliant video, voluntarily withdraw, are found ineligible due to your own inaccurate or misleading information, or do not qualify for the next stage. Not uploading a video does not create a right to a refund. See the Refund & Cancellation Policy for the limited exceptions.',aHi:'नहीं। एक बार Phase 1 payment सफलतापूर्वक पूरा हो जाने पर fee non-refundable है — जिसमें वे स्थितियां भी शामिल हैं जब आप video upload नहीं करते, deadline के बाद upload करते हैं, incomplete/invalid/corrupted/inaccessible/non-compliant video upload करते हैं, स्वेच्छा से withdraw करते हैं, अपनी गलत या misleading जानकारी के कारण ineligible पाए जाते हैं, या अगले stage के लिए qualify नहीं करते। Video upload न करना refund का अधिकार नहीं बनाता। सीमित अपवादों के लिए Refund & Cancellation Policy देखें।'},
  // Eligibility
  {cat:'Eligibility',qEn:'Who can participate in BCPL?',qHi:'BCPL में कौन participate कर सकता है?',aEn:'Any working professional aged ' + SEASON.ageMin + ' to ' + SEASON.ageMax + ' years (as on the date of registration) can participate — salaried employees, self-employed individuals, freelancers, or business owners. You must be currently employed or actively running a business.',aHi:SEASON.ageMin + ' से ' + SEASON.ageMax + ' साल (registration की तारीख़ पर) का कोई भी working professional participate कर सकता है — salaried employees, self-employed, freelancers, या business owners। आपको currently employed होना चाहिए या अपना business चलाना चाहिए।'},
  {cat:'Eligibility',qEn:'Do I need to be a trained cricketer?',qHi:'क्या मुझे trained cricketer होना ज़रूरी है?',aEn:'No formal training is required. We look for players with basic cricket experience and genuine passion for the game. Our experienced coaches evaluate attitude, effort, and raw talent — not just polished technique.',aHi:'कोई formal training ज़रूरी नहीं है। हम basic cricket experience और game के लिए passion देखते हैं। हमारे experienced coaches attitude, effort और raw talent को evaluate करते हैं — सिर्फ polished technique नहीं।'},
  {cat:'Eligibility',qEn:'Are women eligible to participate?',qHi:'क्या महिलाएं participate कर सकती हैं?',aEn:'Season 5 is a men\'s-only edition. However, BCPL is actively planning a dedicated women\'s division for Season 6 (2026). Stay tuned to our social media for announcements.',aHi:'Season 5 men\'s-only edition है। हालाँकि, BCPL Season 6 (2026) के लिए dedicated women\'s division plan कर रहा है। Announcements के लिए हमारे social media से जुड़े रहें।'},
  {cat:'Eligibility',qEn:'Is there an age limit?',qHi:'क्या कोई age limit है?',aEn:'Yes. Players must be ' + SEASON.ageMin + ' to ' + SEASON.ageMax + ' years of age as on the date of registration, as set out in the Eligibility Criteria.',aHi:'हाँ। Eligibility Criteria के अनुसार players की उम्र registration की तारीख़ पर ' + SEASON.ageMin + ' से ' + SEASON.ageMax + ' साल होनी चाहिए।'},
  // Phase 1
  {cat:'Phase 1',qEn:'What is Phase 1?',qHi:'Phase 1 क्या है?',aEn:'Phase 1 is a video-based assessment stage. After registering, you upload a 30–60 second cricket skills video within 15 days. Your submission is assessed under BCPL\'s role-specific Phase 1 framework, and your result target is within 48 hours of video submission.',aHi:'Phase 1 एक video-based assessment stage है। Register करने के बाद, आप 15 दिनों के अंदर 30–60 second cricket skills video upload करते हैं। आपकी submission BCPL के role-specific Phase 1 framework के तहत assess होती है, और result का target video submission के 48 घंटे के भीतर है।'},
  {cat:'Phase 1',qEn:'How much does Phase 1 cost by role?',qHi:'Role के हिसाब से Phase 1 की fee कितनी है?',aEn:'The applicable Phase 1 fee depends on your playing role: ₹' + F.phase1.bat + ' + applicable GST for Batsman, Bowler and Wicketkeeper, and ₹' + F.phase1.ar + ' + applicable GST for All-Rounder. The exact GST-inclusive amount is displayed at the time of payment.',aHi:'लागू Phase 1 fee आपकी playing role पर निर्भर करती है: Batsman, Bowler और Wicketkeeper के लिए ₹' + F.phase1.bat + ' + applicable GST, और All-Rounder के लिए ₹' + F.phase1.ar + ' + applicable GST। GST-inclusive amount payment के समय दिखाई जाती है।'},
  {cat:'Phase 1',qEn:'Why is the All-Rounder Phase 1 fee different?',qHi:'All-Rounder की Phase 1 fee अलग क्यों है?',aEn:'An All-Rounder is assessed in both disciplines — batting and bowling. This involves a larger evaluation workload than a single-discipline role, so the applicable All-Rounder Phase 1 fee is ₹' + F.phase1.ar + ' + applicable GST.',aHi:'All-Rounder का मूल्यांकन दोनों disciplines — batting और bowling — में होता है। इसमें single-discipline role की तुलना में ज़्यादा evaluation workload होता है, इसलिए लागू All-Rounder Phase 1 fee ₹' + F.phase1.ar + ' + applicable GST है।'},
  {cat:'Phase 1',qEn:'Does payment guarantee selection?',qHi:'क्या payment selection की गारंटी देता है?',aEn:'No. Payment of Phase 1 or Phase 2 fees does not guarantee qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration or tournament participation.',aHi:'नहीं। Phase 1 या Phase 2 fees का भुगतान qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration या tournament participation की गारंटी नहीं देता।'},
  {cat:'Phase 1',qEn:'How is Phase 1 evaluated?',qHi:'Phase 1 का evaluation कैसे होता है?',aEn:'Your video is assessed against BCPL\'s role-specific Phase 1 framework. BCPL may use automated, digital and technology-assisted assessment systems and third-party technology service providers for video validation, scoring, ranking, fraud/integrity checks and administration. Your result may include a score and/or ranking where applicable.',aHi:'आपका video BCPL के role-specific Phase 1 framework पर assess होता है। BCPL video validation, scoring, ranking, fraud/integrity checks और administration के लिए automated, digital और technology-assisted assessment systems तथा third-party technology service providers का उपयोग कर सकता है। आपके result में जहां लागू हो score और/या ranking शामिल हो सकती है।'},
  {cat:'Phase 1',qEn:'Do humans manually watch every video?',qHi:'क्या हर video को इंसान manually देखते हैं?',aEn:'Not necessarily. BCPL may use automated, digital and technology-assisted assessment systems, along with third-party technology providers, for validation, scoring and integrity checks. We do not claim that every video is manually reviewed by a human panel.',aHi:'ज़रूरी नहीं। BCPL validation, scoring और integrity checks के लिए automated, digital और technology-assisted assessment systems तथा third-party technology providers का उपयोग कर सकता है। हम यह दावा नहीं करते कि हर video को किसी human panel द्वारा manually review किया जाता है।'},
  {cat:'Phase 1',qEn:'What happens if I do not qualify Phase 1?',qHi:'अगर मैं Phase 1 qualify नहीं करता तो क्या होगा?',aEn:'If you do not qualify Phase 1, no Phase 2 fee becomes payable. Only eligible Phase 1 qualified players who choose to proceed pay the Phase 2 fee.',aHi:'यदि आप Phase 1 qualify नहीं करते, तो कोई Phase 2 fee देय नहीं होती। केवल eligible Phase 1 qualified players जो आगे बढ़ना चुनते हैं, Phase 2 fee देते हैं।'},
  // Phase 2
  {cat:'Phase 2',qEn:'Who pays the Phase 2 fee?',qHi:'Phase 2 fee कौन देता है?',aEn:'Only eligible Phase 1 qualified players who choose to proceed to the physical trial pay the Phase 2 fee. The applicable role-based Phase 2 fee is ₹' + F.phase2.bat + ' + applicable GST for Batsman/Bowler/Wicketkeeper and ₹' + F.phase2.ar + ' + applicable GST for All-Rounder, as displayed at the time of payment.',aHi:'केवल eligible Phase 1 qualified players जो physical trial के लिए आगे बढ़ना चुनते हैं, Phase 2 fee देते हैं। लागू role-based Phase 2 fee Batsman/Bowler/Wicketkeeper के लिए ₹' + F.phase2.bat + ' + applicable GST और All-Rounder के लिए ₹' + F.phase2.ar + ' + applicable GST है, जैसा payment के समय दिखाया जाता है।'},
  {cat:'Phase 2',qEn:'What happens after I pay the Phase 2 fee?',qHi:'Phase 2 fee देने के बाद क्या होता है?',aEn:'After payment you complete KYC and the required declarations (including Aadhaar/PAN identity verification), and then receive a physical-trial slot at your chosen city.',aHi:'Payment के बाद आप KYC और आवश्यक declarations (Aadhaar/PAN identity verification सहित) पूरा करते हैं, और फिर अपने chosen city में physical-trial slot मिलता है।'},
  {cat:'Phase 2',qEn:'What happens at the physical trial?',qHi:'Physical trial में क्या होता है?',aEn:'Phase 2 is a physical, standardised cricket trial conducted at authorised venues. You are assessed against a role-specific 100-point framework using the applicable attempt rules for your role.',aHi:'Phase 2 authorised venues पर आयोजित एक physical, standardised cricket trial है। आपका मूल्यांकन आपकी role के लिए applicable attempt rules का उपयोग करते हुए एक role-specific 100-point framework पर होता है।'},
  {cat:'Phase 2',qEn:'How many balls or attempts will I receive?',qHi:'मुझे कितनी balls या attempts मिलेंगी?',aEn:'It depends on your role: Batsman — 6 valid assessment deliveries (the intended standard framework may include 3 pace-style and 3 spin-style). Bowler — 6 bowling attempts. All-Rounder — 6 valid batting deliveries plus 6 bowling attempts. Wicketkeeper — a standardised wicketkeeping assessment plus 6 valid batting deliveries.',aHi:'यह आपकी role पर निर्भर करता है: Batsman — 6 valid assessment deliveries (intended standard framework में 3 pace-style और 3 spin-style शामिल हो सकती हैं)। Bowler — 6 bowling attempts। All-Rounder — 6 valid batting deliveries और 6 bowling attempts। Wicketkeeper — standardised wicketkeeping assessment और 6 valid batting deliveries।'},
  {cat:'Phase 2',qEn:'Will every player receive the same number of attempts?',qHi:'क्या हर player को समान संख्या में attempts मिलेंगी?',aEn:'The same published role-specific framework applies to every player in that role. For bowlers, wides or poor execution may count as attempts per the approved protocol. Deliveries marked "FEEDER ERROR / RE-BOWL" do not count toward your valid deliveries, and evaluators cannot grant extra valid balls at their discretion.',aHi:'उस role के हर player पर same published role-specific framework लागू होता है। Bowlers के लिए, wides या poor execution approved protocol के अनुसार attempts के रूप में count हो सकते हैं। "FEEDER ERROR / RE-BOWL" mark की गई deliveries आपकी valid deliveries में count नहीं होतीं, और evaluators अपनी discretion पर extra valid balls नहीं दे सकते।'},
  {cat:'Phase 2',qEn:'What if the batting feeder delivers an unusable ball?',qHi:'अगर batting feeder unusable ball देता है तो?',aEn:'If an authorised feeder delivery is clearly unusable, it may be marked "FEEDER ERROR / RE-BOWL" and will not count as one of your six valid batting deliveries.',aHi:'यदि कोई authorised feeder delivery स्पष्ट रूप से unusable है, तो उसे "FEEDER ERROR / RE-BOWL" mark किया जा सकता है और वह आपकी छह valid batting deliveries में से एक के रूप में count नहीं होगी।'},
  {cat:'Phase 2',qEn:'Are trials standardised in every city?',qHi:'क्या हर शहर में trials standardised होते हैं?',aEn:'BCPL seeks to use the same published role-specific assessment framework, scoring structure and applicable attempt rules across authorised Phase 2 venues. This is a standardised assessment framework — it does not mean every pitch, weather or environmental condition will be physically identical.',aHi:'BCPL authorised Phase 2 venues पर same published role-specific assessment framework, scoring structure और applicable attempt rules उपयोग करने का प्रयास करता है। यह एक standardised assessment framework है — इसका मतलब यह नहीं है कि हर pitch, weather या environmental condition physically identical होगी।'},
  {cat:'Phase 2',qEn:'How is my physical score recorded?',qHi:'मेरा physical score कैसे record होता है?',aEn:'Physical-trial scores are recorded digitally, and evaluators assess you against the applicable role-specific rubric. Once submitted, assessments lock.',aHi:'Physical-trial scores digitally record किए जाते हैं, और evaluators आपका मूल्यांकन applicable role-specific rubric पर करते हैं। Submit होने के बाद, assessments lock हो जाते हैं।'},
  {cat:'Phase 2',qEn:'Can my coach change my score later?',qHi:'क्या मेरा coach बाद में मेरा score बदल सकता है?',aEn:'No. Normal evaluators cannot freely edit a submitted final assessment. Any authorised correction must follow an audited process.',aHi:'नहीं। Normal evaluators किसी submitted final assessment को स्वतंत्र रूप से edit नहीं कर सकते। कोई भी authorised correction एक audited process का पालन करना चाहिए।'},
  {cat:'Phase 2',qEn:'Why is the physical-trial result not announced immediately?',qHi:'Physical-trial result तुरंत क्यों नहीं announce होता?',aEn:'After completing your physical trial, your assessment is recorded. Advancement results may be finalised after completion of the applicable BCPL trial window so eligible candidates can be ranked under the applicable season rules.',aHi:'अपना physical trial पूरा करने के बाद, आपका assessment record किया जाता है। Advancement results applicable BCPL trial window पूरी होने के बाद finalise किए जा सकते हैं ताकि eligible candidates को applicable season rules के अंतर्गत rank किया जा सके।'},
  {cat:'Phase 2',qEn:'What happens if I miss my slot?',qHi:'अगर मैं अपना slot miss कर दूं तो?',aEn:'Missed slots are handled per the applicable policy and are not automatically refundable. Please refer to the Refund & Cancellation Policy for the applicable scenario.',aHi:'Missed slots को applicable policy के अनुसार संभाला जाता है और वे automatically refundable नहीं होते। लागू scenario के लिए कृपया Refund & Cancellation Policy देखें।'},
  {cat:'Phase 2',qEn:'Can I attempt the physical trial again?',qHi:'क्या मैं physical trial दोबारा दे सकता हूं?',aEn:'Re-trials are not available at a player\'s request. Where a genuine procedural error occurs, corrections are handled through an audited correction process, not by repeating the trial on demand.',aHi:'Player के अनुरोध पर re-trials उपलब्ध नहीं हैं। जहां कोई genuine procedural error होती है, वहां corrections एक audited correction process के ज़रिए संभाले जाते हैं, न कि demand पर trial दोहराकर।'},
  {cat:'Phase 2',qEn:'What if there was a procedural error?',qHi:'अगर कोई procedural error हुई तो?',aEn:'Report it at the venue or to support at the time. Genuine procedural issues are reviewed and, where appropriate, corrected through an audited correction workflow.',aHi:'इसे venue पर या उसी समय support को report करें। Genuine procedural issues की समीक्षा की जाती है और जहां उचित हो, एक audited correction workflow के ज़रिए ठीक किया जाता है।'},
  {cat:'Phase 2',qEn:'Is the Phase 2 fee automatically refunded if I am not selected?',qHi:'अगर मैं select नहीं होता तो क्या Phase 2 fee automatically refund होती है?',aEn:'No. Non-selection after the physical trial does not by itself make the Phase 2 fee refundable unless the applicable Refund Policy expressly provides for such a refund. See scenario D of the Refund & Cancellation Policy.',aHi:'नहीं। Physical trial के बाद non-selection अपने आप में Phase 2 fee को refundable नहीं बनाता, जब तक applicable Refund Policy स्पष्ट रूप से ऐसे refund का प्रावधान न करे। Refund & Cancellation Policy का scenario D देखें।'},
  // Selection
  {cat:'Selection',qEn:'How is the Auction Pool selected?',qHi:'Auction Pool का चयन कैसे होता है?',aEn:'BCPL may apply published playing-role allocations, regional representation requirements, minimum assessment standards, national merit ranking and applicable tie-break rules when determining advancement to the Auction Pool for the relevant season.',aHi:'BCPL relevant season के लिए Auction Pool में advancement तय करते समय published playing-role allocations, regional representation requirements, minimum assessment standards, national merit ranking और applicable tie-break rules लागू कर सकता है।'},
  {cat:'Selection',qEn:'Does regional representation apply?',qHi:'क्या regional representation लागू होता है?',aEn:'It may apply where published. Advancement can depend on published role allocations, regional representation requirements, minimum standards, national merit ranking and applicable tie-break rules for the relevant season.',aHi:'यह लागू हो सकता है जहां published हो। Advancement published role allocations, regional representation requirements, minimum standards, national merit ranking और relevant season के applicable tie-break rules पर निर्भर कर सकता है।'},
  {cat:'Selection',qEn:'Does Auction Pool qualification guarantee a team?',qHi:'क्या Auction Pool qualification किसी team की गारंटी देती है?',aEn:'No. Qualification for the BCPL Auction Pool means eligibility to participate in the applicable player-auction process. Auction Pool qualification does not guarantee purchase by a team, a player contract, remuneration, squad selection or tournament participation.',aHi:'नहीं। BCPL Auction Pool के लिए qualification का मतलब है applicable player-auction process में भाग लेने की eligibility। Auction Pool qualification किसी team द्वारा purchase, player contract, remuneration, squad selection या tournament participation की गारंटी नहीं देती।'},
  {cat:'Selection',qEn:'What is the franchise auction?',qHi:'Franchise auction क्या है?',aEn:'BCPL franchise teams bid for players from the Auction Pool through the applicable player-auction process. Auction Pool qualification is eligibility to participate in that process and does not guarantee purchase, a contract, remuneration, squad selection or tournament participation.',aHi:'BCPL franchise teams applicable player-auction process के ज़रिए Auction Pool के players के लिए bid करती हैं। Auction Pool qualification उस process में भाग लेने की eligibility है और यह purchase, contract, remuneration, squad selection या tournament participation की गारंटी नहीं देती।'},
  // Payment
  {cat:'Payment',qEn:'What payment methods are accepted?',qHi:'कौनसे payment methods accept किए जाते हैं?',aEn:'We accept all major UPI apps (GPay, PhonePe, Paytm, etc.), debit and credit cards (Visa, Mastercard, RuPay), net banking from 50+ banks, and popular wallets. All payments are processed securely via Cashfree.',aHi:'हम सभी major UPI apps (GPay, PhonePe, Paytm, etc.), debit/credit cards, 50+ banks से net banking, और wallets accept करते हैं। सभी payments Cashfree के ज़रिए securely process होते हैं।'},
  {cat:'Payment',qEn:'Is my payment information secure?',qHi:'क्या मेरी payment information secure है?',aEn:'Payments are processed via Cashfree using SSL/TLS encryption in a PCI-DSS compliant environment, and BCPL never stores your card number, CVV, UPI PIN or bank credentials. No online system can be guaranteed 100% secure, but reasonable safeguards are applied to protect your data.',aHi:'Payments Cashfree के ज़रिए SSL/TLS encryption के साथ एक PCI-DSS compliant environment में process होते हैं, और BCPL आपका card number, CVV, UPI PIN या bank credentials कभी store नहीं करता। कोई भी online system 100% secure होने की गारंटी नहीं दे सकता, लेकिन आपके data की सुरक्षा के लिए reasonable safeguards लगाए जाते हैं।'},
  {cat:'Payment',qEn:'Can I get a GST invoice for my registration?',qHi:'क्या मुझे registration का GST invoice मिल सकता है?',aEn:'Yes. Email support@bcplt20.com with your Registration ID and GSTIN (if applicable). GST invoices are issued within 3 business days. The registration fee attracts applicable GST as per government regulations.',aHi:'हाँ। अपना Registration ID और GSTIN support@bcplt20.com पर email करें। GST invoices 3 business days में issue हो जाते हैं।'},
  {cat:'Payment',qEn:'When is payment deducted from my account?',qHi:'मेरे account से payment कब deduct होता है?',aEn:'Payment is deducted immediately upon successful form submission. Cashfree processes the transaction in real-time. You receive a payment confirmation SMS and email instantly after deduction.',aHi:'Form successfully submit होते ही payment deduct हो जाता है। आपको instantly SMS और email confirmation मिलता है।'},
  // General
  /* OWNER / COUNSEL DECISION REQUIRED: exact Season 5 dates were hard-coded to 2025 and are not verifiable in the codebase. Reworded to reference official announcements until confirmed dates are supplied. */
  {cat:'General',qEn:'When is BCPL Season 5?',qHi:'BCPL Season 5 कब है?',aEn:'BCPL Season 5 runs in stages — Phase 1 video trials, then Phase 2 physical trials, followed by national evaluation, the player auction and the tournament matches. The specific dates for each stage are announced through official BCPL channels and your registered contact details. Please rely on official announcements for the confirmed schedule.',aHi:'BCPL Season 5 चरणों में चलता है — Phase 1 video trials, फिर Phase 2 physical trials, उसके बाद national evaluation, player auction और tournament matches। हर चरण की specific dates official BCPL channels और आपके registered contact details के ज़रिए घोषित की जाती हैं। पुष्ट schedule के लिए official announcements पर भरोसा करें।'},
  /* OWNER / COUNSEL DECISION REQUIRED: specific stadium names are not verifiable in the codebase. Reworded to generic venues; publish named venues only once confirmed. */
  {cat:'General',qEn:'Where are the matches held?',qHi:'Matches कहाँ होते हैं?',aEn:'BCPL Season 5 matches are held at professional cricket grounds across the participating franchise cities. Specific venues are confirmed and announced through official BCPL channels ahead of the tournament.',aHi:'BCPL Season 5 के matches participating franchise cities के professional cricket grounds पर होते हैं। Specific venues tournament से पहले official BCPL channels के ज़रिए confirm और घोषित किए जाते हैं।'},
  {cat:'General',qEn:'How is BCPL structured?',qHi:'BCPL की संरचना कैसी है?',aEn:'BCPL runs a two-phase, role-specific assessment: a Phase 1 video assessment, then a standardised Phase 2 physical trial, followed by central ranking and an Auction Pool through which franchise teams participate in the applicable player-auction process. Phase 1 entry starts at ₹' + F.phase1.bat + ' + applicable GST. Any tournament-related fees or exceptions are governed by the applicable BCPL Season 5 rules.',aHi:'BCPL एक two-phase, role-specific assessment चलाता है: एक Phase 1 video assessment, फिर एक standardised Phase 2 physical trial, उसके बाद central ranking और एक Auction Pool जिसके ज़रिए franchise teams applicable player-auction process में भाग लेती हैं। Phase 1 entry ₹' + F.phase1.bat + ' + applicable GST से शुरू होती है। कोई भी tournament-related fees या exceptions applicable BCPL Season 5 rules के अधीन हैं।'},
  {cat:'General',qEn:'What is BCPL?',qHi:'BCPL क्या है?',aEn:'BCPL (Bhartiya Corporate Premier League) is a corporate T20 cricket league for working professionals across India, run by Kriparthi Playing 11 Pvt. Ltd. It gives working professionals a structured, standardised route from a video assessment to a physical trial, national ranking and a franchise player auction.',aHi:'BCPL (Bhartiya Corporate Premier League) पूरे भारत के working professionals के लिए एक corporate T20 cricket league है, जिसे Kriparthi Playing 11 Pvt. Ltd. चलाती है। यह working professionals को video assessment से physical trial, national ranking और franchise player auction तक एक structured, standardised रास्ता देती है।',linkTo:'/about',linkLabelEn:'About BCPL',linkLabelHi:'BCPL के बारे में'},

  // Eligibility (additional)
  {cat:'Eligibility',qEn:'What does "working professional" mean?',qHi:'"Working professional" का क्या मतलब है?',aEn:'It means you currently earn a living through work or business — a salaried employee, self-employed person, freelancer, business owner, gig/delivery worker, farmer, or government/PSU staff. You should be currently employed or actively running a business at the time of registration.',aHi:'इसका मतलब है कि आप वर्तमान में काम या business से कमाई करते हैं — salaried employee, self-employed, freelancer, business owner, gig/delivery worker, farmer, या government/PSU staff। Registration के समय आपको currently employed या सक्रिय रूप से business चलाना चाहिए।',linkTo:'/eligibility',linkLabelEn:'Eligibility Criteria',linkLabelHi:'Eligibility Criteria'},
  {cat:'Eligibility',qEn:'Can self-employed people, gig workers, farmers or business owners register?',qHi:'क्या self-employed, gig workers, farmers या business owners register कर सकते हैं?',aEn:'Yes. Self-employed professionals, freelancers, business owners, gig/delivery workers and farmers are all eligible, provided you meet the age (18–45) and other eligibility requirements and can support your status if verification is requested.',aHi:'हां। Self-employed professionals, freelancers, business owners, gig/delivery workers और farmers सभी eligible हैं, बशर्ते आप age (18–45) और अन्य eligibility requirements पूरी करें और verification मांगे जाने पर अपना status प्रमाणित कर सकें।',linkTo:'/eligibility',linkLabelEn:'Eligibility Criteria',linkLabelHi:'Eligibility Criteria'},
  {cat:'Eligibility',qEn:'Why is my date of birth required?',qHi:'मेरी date of birth क्यों ज़रूरी है?',aEn:'Your date of birth is used to confirm you meet the 18–45 age eligibility as on the registration date, and to match your identity documents during KYC.',aHi:'आपकी date of birth यह confirm करने के लिए उपयोग होती है कि आप registration की तारीख़ पर 18–45 age eligibility पूरी करते हैं, और KYC के दौरान आपके identity documents से match करने के लिए।',linkTo:'/eligibility',linkLabelEn:'Eligibility Criteria',linkLabelHi:'Eligibility Criteria'},
  {cat:'Eligibility',qEn:'Can professional cricketers register? Is there a cricket-gap rule?',qHi:'क्या professional cricketers register कर सकते हैं? क्या कोई cricket-gap नियम है?',aEn:'You must not currently be under a first-class / professional cricket contract, and you must have no active contract with a state or national cricket association. Any past professional or representative cricket must be disclosed honestly at registration. Undisclosed contracts can lead to disqualification without refund.',aHi:'आप वर्तमान में किसी first-class / professional cricket contract में नहीं होने चाहिए, और किसी state या national cricket association के साथ कोई active contract नहीं होना चाहिए। कोई भी पिछला professional या representative cricket registration के समय ईमानदारी से बताना ज़रूरी है। Undisclosed contracts बिना refund के disqualification का कारण बन सकते हैं।',linkTo:'/eligibility',linkLabelEn:'Eligibility Criteria',linkLabelHi:'Eligibility Criteria'},

  // Phase 1 (additional)
  {cat:'Phase 1',qEn:'Is GST charged on top of the fee?',qHi:'क्या fee के ऊपर GST लगता है?',aEn:'Yes. Fees are shown as the base amount plus applicable GST, and the exact GST-inclusive amount is displayed at the time of payment. GST is charged as per government regulations.',aHi:'हां। Fees base amount plus applicable GST के रूप में दिखाई जाती हैं, और exact GST-inclusive amount payment के समय दिखाई जाती है। GST सरकारी नियमों के अनुसार लगता है।',linkTo:'/refunds',linkLabelEn:'Refund & Cancellation Policy',linkLabelHi:'Refund & Cancellation Policy'},
  {cat:'Phase 1',qEn:'What is included in the Phase 1 fee?',qHi:'Phase 1 fee में क्या शामिल है?',aEn:'The Phase 1 fee covers registration in and access to the Phase 1 trial process, including the opportunity to submit the prescribed video assessment within the permitted submission period. It does not guarantee qualification or selection.',aHi:'Phase 1 fee में Phase 1 trial process में registration और access शामिल है, जिसमें अनुमत submission period के अंदर निर्धारित video assessment submit करने का अवसर शामिल है। यह qualification या selection की गारंटी नहीं देती।',linkTo:'/refunds',linkLabelEn:'Refund & Cancellation Policy',linkLabelHi:'Refund & Cancellation Policy'},
  {cat:'Phase 1',qEn:'Do I get a refund if I do not upload my video?',qHi:'अगर मैं अपना video upload नहीं करता तो क्या refund मिलता है?',aEn:'No. Not uploading a video does not create a right to a refund. Once a Phase 1 payment is successfully completed, the fee is non-refundable, including where you do not upload, upload late, upload an invalid video, withdraw, or do not qualify. Your application may simply expire or become incomplete for that cycle.',aHi:'नहीं। Video upload न करना refund का अधिकार नहीं बनाता। एक बार Phase 1 payment सफलतापूर्वक पूरा हो जाने पर fee non-refundable है, जिसमें वे स्थितियां शामिल हैं जब आप upload नहीं करते, late upload करते हैं, invalid video upload करते हैं, withdraw करते हैं, या qualify नहीं करते। उस cycle के लिए आपका application बस expire या incomplete हो सकता है।',linkTo:'/refunds',linkLabelEn:'Refund & Cancellation Policy',linkLabelHi:'Refund & Cancellation Policy'},
  {cat:'Phase 1',qEn:'What happens if my video is late or invalid?',qHi:'अगर मेरा video late या invalid हुआ तो क्या होगा?',aEn:'If you upload after the permitted period, the upload may be rejected and your Phase 1 application may expire or become incomplete. Incomplete, invalid, corrupted, inaccessible or non-compliant videos may be rejected. In all these cases the Phase 1 fee remains non-refundable.',aHi:'यदि आप अनुमत अवधि के बाद upload करते हैं, तो upload reject हो सकता है और आपका Phase 1 application expire या incomplete हो सकता है। Incomplete, invalid, corrupted, inaccessible या non-compliant videos reject हो सकती हैं। इन सभी स्थितियों में Phase 1 fee non-refundable रहती है।',linkTo:'/trust',linkLabelEn:'How Selection Works',linkLabelHi:'How Selection Works'},
  {cat:'Phase 1',qEn:'What video format and duration are accepted?',qHi:'कौन सा video format और duration accept होता है?',aEn:'A 30–60 second cricket skills video showing your own, current performance for your role. Please follow the Phase 1 Video Rules for the accepted formats, quality and content requirements.',aHi:'30–60 second cricket skills video जिसमें आपकी role के लिए आपका अपना, current performance दिखे। Accepted formats, quality और content requirements के लिए Phase 1 Video Rules देखें।',linkTo:'/trust',linkLabelEn:'How Selection Works',linkLabelHi:'How Selection Works'},
  {cat:'Phase 1',qEn:'When will my Phase 1 result appear and will I see a score and rank?',qHi:'मेरा Phase 1 result कब आएगा और क्या मुझे score और rank दिखेगी?',aEn:'Your Phase 1 result target is within 48 hours of video submission. Your result may include a score and/or a ranking where applicable. Scores are assessed against a role-specific 100-point framework, and a score does not by itself guarantee advancement.',aHi:'आपके Phase 1 result का target video submission के 48 घंटे के भीतर है। आपके result में जहां लागू हो score और/या ranking शामिल हो सकती है। Scores एक role-specific 100-point framework पर assess होते हैं, और कोई score अपने आप advancement की गारंटी नहीं देता।',linkTo:'/trust',linkLabelEn:'How Selection Works',linkLabelHi:'How Selection Works'},
  {cat:'Phase 1',qEn:'What does "Phase 1 Qualified" mean?',qHi:'"Phase 1 Qualified" का क्या मतलब है?',aEn:'Phase 1 Qualified means you are eligible to proceed to the Phase 2 physical trial if you choose to and pay the Phase 2 fee. It does not mean you have been selected, and it does not equal Auction Pool qualification.',aHi:'Phase 1 Qualified का मतलब है कि यदि आप चाहें और Phase 2 fee दें तो आप Phase 2 physical trial में आगे बढ़ने के eligible हैं। इसका मतलब यह नहीं कि आपका चयन हो गया है, और यह Auction Pool qualification के बराबर नहीं है।',linkTo:'/trust',linkLabelEn:'How Selection Works',linkLabelHi:'How Selection Works'},

  // Selection (additional)
  {cat:'Selection',qEn:'When will final results be released?',qHi:'Final results कब release होंगे?',aEn:'Advancement results may be finalised after completion of the applicable BCPL national trial window, so eligible candidates can be ranked under the applicable Season 5 rules. Completing your trial does not mean you have been selected.',aHi:'Advancement results applicable BCPL national trial window पूरी होने के बाद finalise किए जा सकते हैं, ताकि eligible candidates को applicable Season 5 rules के अंतर्गत rank किया जा सके। Trial पूरा करना यह नहीं दर्शाता कि आपका चयन हो गया है।',linkTo:'/trust',linkLabelEn:'How Selection Works',linkLabelHi:'How Selection Works'},
  {cat:'Selection',qEn:'How are the Final 600 selected nationally?',qHi:'Final 600 का national चयन कैसे होता है?',aEn:'For Season 5, the Final 600 may be formed using merit ranking, role-specific requirements, geographic/zone representation across BCPL\'s five zones, national wildcard allocation, published tie-break criteria and eligibility/integrity checks. BCPL does not publish confidential formulas or other participants\' data.',aHi:'Season 5 के लिए, Final 600 merit ranking, role-specific requirements, BCPL के पांच zones में geographic/zone representation, national wildcard allocation, published tie-break criteria और eligibility/integrity checks से बन सकता है। BCPL confidential formulas या अन्य participants का data publish नहीं करता।',linkTo:'/trust',linkLabelEn:'How Selection Works',linkLabelHi:'How Selection Works'},
  {cat:'Selection',qEn:'What are zones and wildcards?',qHi:'Zones और wildcards क्या हैं?',aEn:'BCPL uses a five-zone model for national geographic representation in Season 5, and may allocate a limited number of national wildcards. Exact numerical quotas per zone or role are published only once officially approved and may change for future seasons.',aHi:'BCPL Season 5 में national geographic representation के लिए five-zone model उपयोग करता है, और सीमित संख्या में national wildcards आवंटित कर सकता है। प्रति zone या role exact numerical quotas केवल officially approved होने पर publish किए जाते हैं और भविष्य के seasons के लिए बदल सकते हैं।',linkTo:'/trust',linkLabelEn:'How Selection Works',linkLabelHi:'How Selection Works'},
  {cat:'Selection',qEn:'Does a high score, like 95, guarantee selection?',qHi:'क्या 95 जैसा high score selection की गारंटी देता है?',aEn:'No. Scores are out of 100 and assessed against role-specific criteria. A fixed score such as 95 does not by itself guarantee selection. Final cut-offs emerge only after the applicable national trial population is complete, and advancement depends on ranking, role requirements, zone representation and other published rules.',aHi:'नहीं। Scores 100 में से होते हैं और role-specific criteria पर assess होते हैं। 95 जैसा fixed score अपने आप selection की गारंटी नहीं देता। Final cut-offs applicable national trial population पूरी होने के बाद ही सामने आते हैं, और advancement ranking, role requirements, zone representation और अन्य published rules पर निर्भर करता है।',linkTo:'/trust',linkLabelEn:'How Selection Works',linkLabelHi:'How Selection Works'},
  {cat:'Selection',qEn:'Does Final 600 or auction entry guarantee a salary or contract?',qHi:'क्या Final 600 या auction entry salary या contract की गारंटी देता है?',aEn:'No. Final 600 / Auction Pool entry does not guarantee team purchase. Auction participation does not guarantee a contract, salary or remuneration unless a team purchases you and all requirements are completed.',aHi:'नहीं। Final 600 / Auction Pool entry team purchase की गारंटी नहीं देती। Auction में भाग लेना contract, salary या remuneration की गारंटी नहीं देता, जब तक कोई team आपको purchase न करे और सभी requirements पूरी न हों।',linkTo:'/trust',linkLabelEn:'How Selection Works',linkLabelHi:'How Selection Works'},
  {cat:'Selection',qEn:'What happens if no team buys a player at the auction?',qHi:'अगर auction में किसी player को कोई team नहीं खरीदती तो क्या होता है?',aEn:'Auction Pool qualification is eligibility to participate in the player-auction process. If no team purchases a player, no team contract, squad selection, remuneration or tournament participation follows from the auction alone. The Phase 2 fee is not automatically refunded for non-purchase.',aHi:'Auction Pool qualification player-auction process में भाग लेने की eligibility है। यदि कोई team किसी player को purchase नहीं करती, तो अकेले auction से कोई team contract, squad selection, remuneration या tournament participation नहीं मिलता। Non-purchase के लिए Phase 2 fee automatically refund नहीं होती।',linkTo:'/refunds',linkLabelEn:'Refund & Cancellation Policy',linkLabelHi:'Refund & Cancellation Policy'},

  // Phase 2 (additional)
  {cat:'Phase 2',qEn:'What documents are required and why is employment verification needed?',qHi:'कौन से documents ज़रूरी हैं और employment verification क्यों चाहिए?',aEn:'For Phase 2 you complete KYC (Aadhaar/PAN identity verification) and provide the required declarations, and employment/professional status may be verified. This confirms you meet the working-professional eligibility and that the person attending the trial is the registered player.',aHi:'Phase 2 के लिए आप KYC (Aadhaar/PAN identity verification) पूरा करते हैं और आवश्यक declarations देते हैं, और employment/professional status verify किया जा सकता है। इससे यह confirm होता है कि आप working-professional eligibility पूरी करते हैं और trial में उपस्थित व्यक्ति ही registered player है।',linkTo:'/eligibility',linkLabelEn:'Eligibility Criteria',linkLabelHi:'Eligibility Criteria'},
  {cat:'Phase 2',qEn:'Can the venue or date change, and can I attend another venue?',qHi:'क्या venue या date बदल सकती है, और क्या मैं दूसरे venue पर जा सकता हूं?',aEn:'BCPL may reschedule or change a trial venue/date; you will be notified through official channels. Attending a different venue is subject to the applicable operational rules. If BCPL cancels a trial without a reasonable rescheduled opportunity, refund treatment is set out in the Refund & Cancellation Policy.',aHi:'BCPL किसी trial का venue/date reschedule या बदल सकता है; आपको official channels के ज़रिए सूचित किया जाएगा। किसी दूसरे venue पर जाना applicable operational rules के अधीन है। यदि BCPL किसी trial को बिना reasonable rescheduled अवसर के cancel करता है, तो refund treatment Refund & Cancellation Policy में दिया गया है।',linkTo:'/trial-rules',linkLabelEn:'Phase 2 Physical Trial Rules',linkLabelHi:'Phase 2 Physical Trial Rules'},
  {cat:'Phase 2',qEn:'What happens if my QR trial pass does not work?',qHi:'अगर मेरा QR trial pass काम न करे तो क्या होगा?',aEn:'Show your QR trial pass and a valid ID at the venue. If the QR does not scan, venue staff will verify your identity and registration through the approved backup process. Follow staff instructions and the Phase 2 Physical Trial Rules.',aHi:'Venue पर अपना QR trial pass और एक valid ID दिखाएं। यदि QR scan न हो, तो venue staff approved backup process के ज़रिए आपकी identity और registration verify करेंगे। Staff के निर्देशों और Phase 2 Physical Trial Rules का पालन करें।',linkTo:'/trial-rules',linkLabelEn:'Phase 2 Physical Trial Rules',linkLabelHi:'Phase 2 Physical Trial Rules'},
  {cat:'Phase 2',qEn:'What happens after check-in and after I complete the physical trial?',qHi:'Check-in के बाद और physical trial पूरा करने के बाद क्या होता है?',aEn:'After check-in you go through identity verification, warm-up/holding, and your role-specific assessment. After you complete the trial, your assessment is recorded and locked, and your result enters a result-pending state until advancement is finalised under the applicable Season 5 rules.',aHi:'Check-in के बाद आप identity verification, warm-up/holding, और अपने role-specific assessment से गुज़रते हैं। Trial पूरा करने के बाद, आपका assessment record और lock हो जाता है, और आपका result तब तक result-pending state में रहता है जब तक applicable Season 5 rules के अंतर्गत advancement finalise न हो जाए।',linkTo:'/trial-rules',linkLabelEn:'Phase 2 Physical Trial Rules',linkLabelHi:'Phase 2 Physical Trial Rules'},

  // Payment (additional)
  {cat:'Payment',qEn:'What if my payment is debited but the status is still pending?',qHi:'अगर मेरा payment debit हो गया लेकिन status अभी भी pending है तो?',aEn:'If money is debited but your registration is not created or the status does not update, this is a reconciliation case. Contact support@bcplt20.com with your transaction ID. Duplicate payments and debited-but-not-registered cases are handled per the Refund & Cancellation Policy.',aHi:'यदि पैसा debit हो गया लेकिन आपका registration नहीं बना या status update नहीं हुआ, तो यह एक reconciliation case है। अपना transaction ID के साथ support@bcplt20.com पर संपर्क करें। Duplicate payments और debited-but-not-registered cases Refund & Cancellation Policy के अनुसार संभाले जाते हैं।',linkTo:'/refunds',linkLabelEn:'Refund & Cancellation Policy',linkLabelHi:'Refund & Cancellation Policy'},
  {cat:'Payment',qEn:'How do refunds work?',qHi:'Refunds कैसे काम करते हैं?',aEn:'Phase 1 and Phase 2 fees are generally non-refundable once successfully paid. Limited exceptions apply — such as a duplicate payment, payment debited but registration not created, BCPL cancelling a trial without a reasonable rescheduled opportunity, or a valid compliant Phase 1 submission where BCPL does not declare a result within the published 15-working-days period and you raise a support request. See the full policy for the exact process.',aHi:'Phase 1 और Phase 2 fees सफलतापूर्वक pay होने के बाद आम तौर पर non-refundable हैं। सीमित अपवाद लागू होते हैं — जैसे duplicate payment, payment debit होना पर registration न बनना, BCPL द्वारा किसी trial को बिना reasonable rescheduled अवसर के cancel करना, या एक valid compliant Phase 1 submission जहां BCPL published 15-working-days अवधि के भीतर result घोषित नहीं करता और आप support request उठाते हैं। सटीक प्रक्रिया के लिए पूरी policy देखें।',linkTo:'/refunds',linkLabelEn:'Refund & Cancellation Policy',linkLabelHi:'Refund & Cancellation Policy'},

  // General (additional)
  {cat:'General',qEn:'How does BCPL use my data, and are sponsors given my personal information?',qHi:'BCPL मेरा data कैसे उपयोग करता है, और क्या sponsors को मेरी personal information दी जाती है?',aEn:'BCPL collects only the data needed to register, assess and administer your participation, and does not sell, rent or trade your personal data. Sponsor logos on the site do not mean your personal data is shared with sponsors; personally identifiable information is not given to sponsors for their own marketing without an appropriate consent or legal basis. See the Privacy Policy for details.',aHi:'BCPL केवल वही data लेता है जो आपको register करने, assess करने और आपकी participation चलाने के लिए ज़रूरी है, और आपका personal data बेचता, किराए पर देता या trade नहीं करता। Site पर sponsor logos का मतलब यह नहीं कि आपका personal data sponsors के साथ share होता है; personally identifiable information sponsors को उनकी अपनी marketing के लिए appropriate consent या legal basis के बिना नहीं दी जाती। विवरण के लिए Privacy Policy देखें।',linkTo:'/privacy',linkLabelEn:'Privacy Policy',linkLabelHi:'Privacy Policy'},
  {cat:'General',qEn:'How can I report misconduct or an integrity concern?',qHi:'मैं misconduct या integrity concern कैसे report करूं?',aEn:'You can report misconduct, bribery, manipulation or integrity concerns to support@bcplt20.com. Reports are reviewed under the Code of Conduct and disciplinary process. No bribery, favours or manipulation of scores or the selection process is tolerated.',aHi:'आप misconduct, bribery, manipulation या integrity concerns को support@bcplt20.com पर report कर सकते हैं। Reports की समीक्षा Code of Conduct और disciplinary process के अंतर्गत की जाती है। Scores या selection process की किसी भी bribery, favours या manipulation को बर्दाश्त नहीं किया जाता।',linkTo:'/code-of-conduct',linkLabelEn:'Code of Conduct',linkLabelHi:'Code of Conduct'},
  {cat:'General',qEn:'Where can I read the full rulebook and policies?',qHi:'मैं पूरा rulebook और policies कहां पढ़ सकता हूं?',aEn:'You can read the detailed documents on the site: How Selection Works, Eligibility Criteria, Phase 1 Video Rules, Phase 2 Physical Trial Rules, the BCPL Cricket Rulebook, Code of Conduct, Terms & Conditions, Privacy Policy and the Refund & Cancellation Policy.',aHi:'आप site पर विस्तृत documents पढ़ सकते हैं: How Selection Works, Eligibility Criteria, Phase 1 Video Rules, Phase 2 Physical Trial Rules, BCPL Cricket Rulebook, Code of Conduct, Terms & Conditions, Privacy Policy और Refund & Cancellation Policy।',linkTo:'/cricket-rulebook',linkLabelEn:'BCPL Cricket Rulebook',linkLabelHi:'BCPL Cricket Rulebook'},
  {cat:'General',qEn:'How can I contact support?',qHi:'मैं support से कैसे संपर्क करूं?',aEn:'Email support@bcplt20.com or use the Contact page to reach the right support category (registration, payment, video upload, KYC/verification, trial pass, refund, privacy, misconduct, sponsor/media or general).',aHi:'support@bcplt20.com पर email करें या सही support category (registration, payment, video upload, KYC/verification, trial pass, refund, privacy, misconduct, sponsor/media या general) तक पहुंचने के लिए Contact page का उपयोग करें।',linkTo:'/contact',linkLabelEn:'Contact / Support',linkLabelHi:'Contact / Support'},
];

const CATS = ['All','Registration','Eligibility','Phase 1','Phase 2','Selection','Payment','General'];

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

function AccordionItem({qEn,qHi,aEn,aHi,open,onToggle,lang,linkTo,linkLabel}: {qEn:string,qHi:string,aEn:string,aHi:string,open:boolean,onToggle:()=>void,lang:'en'|'hi',linkTo?:string,linkLabel?:string}) {
  const q = lang==='hi' ? qHi : qEn;
  const a = lang==='hi' ? aHi : aEn;
  const more = lang==='hi' ? 'और पढ़ें' : 'Learn more';
  return (
    <div className="glass-card" style={{marginBottom:12,overflow:'hidden',border:open?'1px solid rgba(255,122,41,0.4)':'1px solid rgba(255,255,255,0.18)',transition:'border 0.2s',borderLeft:open?'3px solid #FF7A29':'1px solid rgba(255,255,255,0.18)'}}>
      <button onClick={onToggle} style={{width:'100%',background:'none',border:'none',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',gap:16,textAlign:'left'}}>
        <span style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:15,color:open?'#FF7A29':'rgba(255,255,255,0.88)',transition:'color 0.2s',lineHeight:1.4}}>{q}</span>
        <span style={{flexShrink:0,width:28,height:28,borderRadius:'50%',background:open?'rgba(255,122,41,0.2)':'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',color:open?'#FF7A29':'rgba(255,255,255,0.72)',fontSize:18,transition:'all 0.25s',transform:open?'rotate(45deg)':''}}>+</span>
      </button>
      {open && (
        <div style={{padding:'0 24px 20px',animation:'expandIn 0.3s ease'}}>
          <p style={{color:'rgba(255,255,255,0.88)',fontSize:14,lineHeight:1.8,fontFamily:'Inter,sans-serif'}}>{a}</p>
          {linkTo && linkLabel && (
            <Link href={linkTo} style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:12,color:'#FF7A29',fontFamily:'var(--font-head)',fontWeight:700,fontSize:13,textDecoration:'none'}}>
              {more}: {linkLabel} &rarr;
            </Link>
          )}
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
  const fees = useFees();
  const faqItems = FAQS(fees);

  const filtered = faqItems.filter(f => {
    const matchCat = cat==='All' || f.cat===cat;
    const q = lang==='hi' ? f.qHi : f.qEn;
    const a = lang==='hi' ? f.aHi : f.aEn;
    const matchSearch = !search || q.toLowerCase().includes(search.toLowerCase()) || a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{minHeight:'100vh',background:'#1C2B47',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <SiteHeader active="FAQ" />

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'clamp(80px,12vh,130px) 0 clamp(40px,6vw,64px)',textAlign:'center'}}>
        <div className="wrap">
          <div className="v3-kicker" style={{marginBottom:16,animation:'floatUp 0.6s ease both'}}>{t("QUESTIONS?","सवाल?")}</div>
          <h1 className="v3-h" style={{fontSize:'clamp(40px,9vw,88px)',marginBottom:20,animation:'floatUp 0.7s ease 0.1s both'}}>
            <span style={{color:'#fff',display:'block'}}>{t("WE'VE GOT","हमारे पास हैं")}</span>
            <span className="shimmer-gold" style={{display:'block'}}>{t("ANSWERS.","जवाब।")}</span>
          </h1>
          <p style={{color:'rgba(255,255,255,0.72)',fontSize:'clamp(14px,2vw,17px)',maxWidth:640,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            {t("Answers to your questions about registration, Phase 1, Phase 2, scoring and the Auction Pool.","Registration, Phase 1, Phase 2, scoring और Auction Pool के बारे में आपके सवालों के जवाब।")}
          </p>
          <div style={{marginTop:32}}>
            <LegalDocHeader doc="faq" />
            {/* Season-5 applicability line — see report: recommend LegalDocHeader carry this centrally */}
            <p style={{maxWidth:880,margin:'-14px auto 0',fontSize:12.5,color:'rgba(255,255,255,0.72)',fontStyle:'italic',lineHeight:1.6}}>
              {t("This document applies to BCPL Season 5 unless expressly stated otherwise.","यह document, जब तक स्पष्ट रूप से अन्यथा न कहा जाए, BCPL Season 5 पर लागू होता है।")}
            </p>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 32px'}}>
        <div className="wrap" style={{maxWidth:700,margin:'0 auto'}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:18,top:'50%',transform:'translateY(-50%)',color:'var(--ink-3)',display:'flex',alignItems:'center'}}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
            </span>
            <input
              className="inp"
              style={{paddingLeft:52,fontSize:16}}
              placeholder={t("Search questions...", "सवाल Search करें...")}
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
              <button key={c} onClick={()=>{ setCat(c); setOpenIdx(null); }} style={{padding:'10px 22px',borderRadius:100,border:`1.5px solid ${cat===c?'#FF7A29':'rgba(255,255,255,0.2)'}`,background:cat===c?'rgba(255,122,41,0.15)':'rgba(255,255,255,0.04)',color:cat===c?'#FF7A29':'rgba(255,255,255,0.88)',fontFamily:'var(--font-head)',fontWeight:700,fontSize:13,cursor:'pointer',transition:'all 0.2s',letterSpacing:'0.04em'}}>
                {c}
                <span style={{marginLeft:8,background:'rgba(255,255,255,0.18)',borderRadius:100,padding:'2px 8px',fontSize:11,color:'var(--ink-3)'}}>
                  {c==='All'?faqItems.length:faqItems.filter(f=>f.cat===c).length}
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
              <div style={{color:'rgba(255,255,255,0.72)',fontSize:16,fontFamily:'Inter,sans-serif'}}>{t("No questions found. Try a different search term.","कोई सवाल नहीं मिला। दूसरा search term try करें।")}</div>
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
              linkTo={(f as {linkTo?:string}).linkTo}
              linkLabel={lang==='hi' ? (f as {linkLabelHi?:string}).linkLabelHi : (f as {linkLabelEn?:string}).linkLabelEn}
            />
          ))}
        </div>
      </section>

      {/* STILL HAVE QUESTIONS */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 120px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'clamp(20px,5vw,48px) clamp(16px,4vw,48px)',textAlign:'center',maxWidth:720,margin:'0 auto',border:'1px solid rgba(232,178,61,0.2)'}}>
            <h2 className="v3-h" style={{fontSize:30,color:'#fff',marginBottom:8}}>{t("Still Have Questions?","अभी भी सवाल हैं?")}</h2>
            <p style={{color:'rgba(255,255,255,0.88)',fontSize:15,marginBottom:32,lineHeight:1.6}}>{t("Our support team is here for you. We'll respond within 2 hours on WhatsApp.","हमारी support team आपके लिए यहां है। हम WhatsApp पर 2 घंटे में जवाब देंगे।")}</p>
            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
              <a href="https://wa.me/919151346555" target="_blank" rel="noopener noreferrer" className="btn-wa" style={{padding:'14px 28px',fontSize:15,borderRadius:14,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                {t("WhatsApp Us","WhatsApp करें")}
              </a>
              <a href="mailto:support@bcplt20.com" style={{textDecoration:'none'}}>
                <button style={{padding:'14px 28px',fontSize:15,borderRadius:14,background:'rgba(6,182,212,0.15)',border:'1.5px solid rgba(6,182,212,0.4)',color:'#06B6D4',fontFamily:'var(--font-head)',fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8}}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
                  {t("Email Us","Email करें")}
                </button>
              </a>
              <a href="tel:+919151346555" style={{textDecoration:'none'}}>
                <button style={{padding:'14px 28px',fontSize:15,borderRadius:14,background:'rgba(139,92,246,0.15)',border:'1.5px solid rgba(139,92,246,0.4)',color:'#8B5CF6',fontFamily:'var(--font-head)',fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8}}>
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
      <StickyRegisterCTA/>
    </div>
  );
}
