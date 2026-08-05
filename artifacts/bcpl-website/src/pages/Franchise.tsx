import React from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';

const FR_EMAIL = 'franchise@bcplt20.com';

const CSS = `
*, *::before, *::after { box-sizing:border-box; }
body { background:#1C2B47; }
.wrap { max-width:1080px; margin:0 auto; padding:0 20px; }
@media(min-width:768px){ .wrap{padding:0 32px} }
.v3-kicker { font-family:Inter,sans-serif; font-weight:700; font-size:12px; letter-spacing:.22em; color:#E8B23D; text-transform:uppercase; }
.v3-h { font-family:'Barlow Condensed','Mukta','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; line-height:.95; letter-spacing:.015em; }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:frShimmer 3s linear infinite; }
@keyframes frShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
.fr-card { background:linear-gradient(135deg,rgba(30,55,105,0.92),rgba(23,43,81,0.88)); border:1px solid rgba(255,255,255,0.18); border-radius:18px; padding:clamp(20px,3.4vw,30px); box-shadow:0 14px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10); }
.fr-num { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(34px,5vw,46px); line-height:1; }
.fr-label { font-family:'Montserrat',Inter,sans-serif; font-weight:900; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,0.6); }
.fr-p { font-size:14.5px; line-height:1.75; color:rgba(255,255,255,0.82); font-family:Inter,sans-serif; }
.fr-grid2 { display:grid; grid-template-columns:1fr; gap:18px; }
@media(min-width:760px){ .fr-grid2{grid-template-columns:1fr 1fr;} }
.fr-grid3 { display:grid; grid-template-columns:1fr; gap:18px; }
@media(min-width:760px){ .fr-grid3{grid-template-columns:1fr 1fr 1fr;} }
.fr-step { display:flex; gap:14px; align-items:flex-start; }
.fr-step-n { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#E8B23D,#FFD873); color:#0C1D33; font-family:'Montserrat',sans-serif; font-weight:900; font-size:14px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
.fr-cta { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#FF7A29,#D95E10); border-radius:10px; padding:13px 26px; font-family:'Montserrat',Inter,sans-serif; font-weight:900; font-size:12.5px; letter-spacing:.08em; color:#fff; text-transform:uppercase; text-decoration:none; box-shadow:0 8px 26px rgba(255,122,41,0.35); transition:transform .15s, opacity .2s; }
.fr-cta:hover { transform:translateY(-2px); opacity:.92; }
.fr-sec-h { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(24px,3.6vw,32px); color:#fff; text-transform:uppercase; letter-spacing:.03em; margin:0 0 16px; }
.fr-badge { display:inline-flex; align-items:center; border-radius:100px; padding:4px 13px; font-size:10.5px; font-weight:900; font-family:'Montserrat',Inter,sans-serif; letter-spacing:.12em; text-transform:uppercase; }
.fr-why { border-radius:18px; padding:clamp(18px,3vw,26px); border:1px solid rgba(255,255,255,0.16); }
.fr-why h4 { font-family:'Montserrat',Inter,sans-serif; font-weight:800; font-size:16px; color:#fff; margin:10px 0 8px; }
.fr-why .ic { width:42px; height:42px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; font-size:20px; }
.fr-flow { display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap; }
.fr-flow-box { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.2); border-radius:12px; padding:12px 18px; font-family:'Montserrat',Inter,sans-serif; font-weight:800; font-size:13px; color:#fff; text-align:center; }
.fr-flow-arrow { color:#E8B23D; font-size:18px; font-weight:900; }
.fr-fine { font-size:13px; line-height:1.8; color:rgba(255,255,255,0.62); font-family:Inter,sans-serif; padding-left:18px; position:relative; margin-bottom:8px; }
.fr-fine::before { content:''; position:absolute; left:2px; top:10px; width:6px; height:6px; border-radius:50%; background:#E8B23D; }
.fr-check { font-size:14.5px; line-height:1.75; color:rgba(255,255,255,0.85); font-family:Inter,sans-serif; padding-left:26px; position:relative; margin-bottom:10px; }
.fr-check::before { content:'✓'; position:absolute; left:0; top:0; color:#31C56B; font-weight:900; }
`;

export default function Franchise() {
  const { t } = useLang();

  return (
    <div style={{ minHeight: '100vh', background: '#1C2B47', color: '#fff' }}>
      <style>{CSS}</style>
      <SiteHeader active="Teams" />

      {/* Hero */}
      <section style={{ padding: 'calc(var(--sh-h, 68px) + clamp(40px,6vw,72px)) 0 clamp(36px,5vw,56px)', background: 'linear-gradient(180deg,#16233F,#1C2B47)', textAlign: 'center' }}>
        <div className="wrap">
          <div className="v3-kicker" style={{ marginBottom: 14 }}>{t('FRANCHISE @ BCPL', 'FRANCHISE @ BCPL')}</div>
          <h1 className="v3-h" style={{ fontSize: 'clamp(40px,7.5vw,80px)', color: '#fff' }}>
            {t('OWN A', 'अपनी')} <span className="shimmer-gold">{t('BCPL FRANCHISE.', 'BCPL FRANCHISE.')}</span>
          </h1>
          <p style={{ maxWidth: 660, margin: '18px auto 0', fontSize: 15.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter,sans-serif' }}>
            {t('BCPL opens its franchise model — own a team in India\u2019s corporate cricket league, build its squad and fanbase, and share in the league\u2019s registration and sponsorship revenues.',
               'BCPL अपना franchise model खोल रही है — India की corporate cricket league में एक team की मालिकी लीजिए, squad और fanbase बनाइए, और league की registration व sponsorship revenue में हिस्सेदार बनिए।')}
          </p>
          <a className="fr-cta" style={{ marginTop: 26 }} href={`mailto:${FR_EMAIL}?subject=Franchise Enquiry — BCPL`}>
            {t('ENQUIRE NOW', 'अभी संपर्क करें')} · {FR_EMAIL}
          </a>
        </div>
      </section>

      <section style={{ padding: '14px 0 clamp(60px,8vw,100px)' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(40px,5vw,60px)' }}>

          {/* Why invest */}
          <div>
            <h2 className="fr-sec-h">{t('Why invest in BCPL', 'BCPL में invest क्यों करें')}</h2>
            <div className="fr-grid2">
              {[
                ['🏢', 'rgba(59,130,246,0.18)', 'India\u2019s corporate cricket audience', 'Corporate India की cricket audience',
                  'Every player in BCPL is a working professional — employees of companies across Delhi NCR and beyond. That means an audience of earning, urban, brand-aware professionals: exactly the audience sponsors and advertisers pay a premium to reach.',
                  'BCPL का हर player एक working professional है — Delhi NCR और उसके बाहर की companies के employees। यानी audience है कमाने वाले, urban, brand-aware professionals की — वही audience जिस तक पहुँचने के लिए sponsors और advertisers premium देते हैं।'],
                ['📊', 'rgba(49,197,107,0.16)', 'Audience insights that brands value', 'Brands के काम की audience insights',
                  'Thousands of professionals register with the league every season. Franchises get aggregated, consent-based audience and engagement insights — which industries, cities and age groups follow the league — making sponsorship conversations with brands far easier.',
                  'हर season हज़ारों professionals league में register करते हैं। Franchises को मिलती हैं aggregated, consent-based audience और engagement insights — किन industries, शहरों और age groups से league जुड़ी है — जिससे brands के साथ sponsorship की बात करना बहुत आसान हो जाता है।'],
                ['📈', 'rgba(232,178,61,0.16)', 'A league that grows every season', 'हर season बढ़ती league',
                  'Season on season, BCPL\u2019s registrations, digital reach and on-ground footprint have grown. Your franchise revenue pools — 25% of registration revenue and 50% of sponsorship revenue — are tied directly to that growth.',
                  'Season दर season BCPL के registrations, digital reach और on-ground presence बढ़ी है। आपकी franchise के revenue pools — registration revenue का 25% और sponsorship revenue का 50% — सीधे इसी growth से जुड़े हैं।'],
                ['🛡️', 'rgba(244,114,182,0.14)', 'League-run, professionally operated', 'League-run, professional संचालन',
                  'Grounds, umpires, live scoring, broadcast, the digital platform, player registrations and payments are all run centrally by the league with full transparency. You invest in the team — the league runs the machinery.',
                  'Grounds, umpires, live scoring, broadcast, digital platform, player registrations और payments — सब league centrally और पूरी transparency से चलाती है। आप team में invest करते हैं — machinery league चलाती है।'],
              ].map(([ic, bg, en, hi, pEn, pHi]) => (
                <div key={en as string} className="fr-why" style={{ background: 'linear-gradient(135deg,rgba(30,55,105,0.92),rgba(23,43,81,0.88))' }}>
                  <span className="ic" style={{ background: bg as string }}>{ic}</span>
                  <h4>{t(en as string, hi as string)}</h4>
                  <p className="fr-p" style={{ margin: 0 }}>{t(pEn as string, pHi as string)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* The investment */}
          <div>
            <h2 className="fr-sec-h">{t('The annual commitment', 'सालाना commitment')}</h2>
            <div className="fr-grid3">
              <div className="fr-card" style={{ textAlign: 'center' }}>
                <div className="fr-num" style={{ color: '#FFD873' }}>₹3 {t('Cr', 'करोड़')}</div>
                <div className="fr-label" style={{ margin: '10px 0 8px' }}>{t('League Franchise Fee', 'League Franchise Fee')}</div>
                <p className="fr-p">{t('Fixed annual fee paid to the league for franchise rights, league operations and central branding.',
                  'Franchise rights, league operations और central branding के लिए league को दी जाने वाली fixed सालाना fee।')}</p>
              </div>
              <div className="fr-card" style={{ textAlign: 'center' }}>
                <div className="fr-num" style={{ color: '#93C5FD' }}>₹2 {t('Cr', 'करोड़')}</div>
                <div className="fr-label" style={{ margin: '10px 0 8px' }}>{t('Team Operations Budget', 'Team Operations Budget')}</div>
                <p className="fr-p">{t('Your team\u2019s annual operating budget — player salaries, player retention, support staff and team management.',
                  'आपकी team का सालाना operating budget — players की salary, player retention, support staff और team management।')}</p>
              </div>
              <div className="fr-card" style={{ textAlign: 'center', border: '1px solid rgba(232,178,61,0.5)' }}>
                <div className="fr-num" style={{ color: '#FF9350' }}>₹5 {t('Cr', 'करोड़')}</div>
                <div className="fr-label" style={{ margin: '10px 0 8px' }}>{t('Total Per Season', 'कुल प्रति season')}</div>
                <p className="fr-p">{t('The complete annual commitment for owning and running a BCPL franchise.',
                  'BCPL franchise की मालिकी और संचालन की पूरी सालाना commitment।')}</p>
              </div>
            </div>
            <p className="fr-p" style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              {t('Note: the league franchise fee increases by 10% every season (e.g. ₹3 Cr this season → ₹3.3 Cr next season). Locking in early locks in the lower base.',
                 'नोट: league franchise fee हर season 10% बढ़ती है (जैसे इस season ₹3 करोड़ → अगले season ₹3.3 करोड़)। जल्दी जुड़ने पर कम base fee lock हो जाती है।')}
            </p>
          </div>

          {/* Revenue share */}
          <div>
            <h2 className="fr-sec-h">{t('How franchises earn', 'Franchise की कमाई कैसे होती है')}</h2>
            <div className="fr-grid2">
              <div className="fr-card">
                <div className="fr-num" style={{ color: '#31C56B' }}>25%</div>
                <div className="fr-label" style={{ margin: '10px 0 8px' }}>{t('Of Registration Revenue', 'Registration revenue का')}</div>
                <p className="fr-p">{t('Players across India pay a registration fee to join BCPL trials and the league. 25% of this registration revenue pool is distributed among the franchises every season. As the league\u2019s registration base grows — and as your team\u2019s brand pulls more players in — the pool grows with it.',
                  'पूरे India से players BCPL trials और league से जुड़ने के लिए registration fee देते हैं। इस registration revenue pool का 25% हर season franchises में बाँटा जाता है। जैसे-जैसे league का registration base बढ़ता है — और आपकी team का brand ज़्यादा players खींचता है — pool भी उतना बड़ा होता जाता है।')}</p>
              </div>
              <div className="fr-card">
                <div className="fr-num" style={{ color: '#31C56B' }}>50%</div>
                <div className="fr-label" style={{ margin: '10px 0 8px' }}>{t('Of Sponsorship Revenue', 'Sponsorship revenue का')}</div>
                <p className="fr-p">{t('Brands sponsor the league to reach its corporate-professional audience — title sponsors, ground branding, digital and broadcast partners. 50% of the league\u2019s sponsorship revenue is distributed among the franchises every season: a direct share in the league\u2019s commercial growth.',
                  'Brands league को sponsor करते हैं ताकि corporate-professional audience तक पहुँचें — title sponsors, ground branding, digital और broadcast partners। League की sponsorship revenue का 50% हर season franchises में बाँटा जाता है — commercial growth में सीधी हिस्सेदारी।')}</p>
              </div>
            </div>
            <div className="fr-card" style={{ marginTop: 18 }}>
              <div className="fr-label" style={{ marginBottom: 14 }}>{t('How the money flows', 'पैसा कैसे बहता है')}</div>
              <div className="fr-flow">
                <div className="fr-flow-box">{t('Player registrations', 'Player registrations')}<br /><span style={{ color: '#31C56B', fontSize: 12 }}>{t('25% to franchises', '25% franchises को')}</span></div>
                <span className="fr-flow-arrow">→</span>
                <div className="fr-flow-box" style={{ border: '1px solid rgba(232,178,61,0.55)' }}>{t('Shared franchise pool', 'साझा franchise pool')}<br /><span style={{ color: '#FFD873', fontSize: 12 }}>{t('divided among all teams', 'सभी teams में बँटता है')}</span></div>
                <span className="fr-flow-arrow">←</span>
                <div className="fr-flow-box">{t('League sponsorships', 'League sponsorships')}<br /><span style={{ color: '#31C56B', fontSize: 12 }}>{t('50% to franchises', '50% franchises को')}</span></div>
              </div>
            </div>
            <p className="fr-p" style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              {t('Note: revenue shares depend on the league\u2019s actual registration and sponsorship revenues each season. Figures above describe the sharing structure, not an assured return.',
                 'नोट: revenue share हर season की असली registration और sponsorship revenue पर निर्भर करता है। ऊपर दिया गया ढाँचा sharing structure है, किसी return की गारंटी नहीं।')}
            </p>
          </div>

          {/* Allocation: bid & auction */}
          <div>
            <h2 className="fr-sec-h">{t('How franchises are allotted', 'Franchise कैसे allot होती है')}</h2>
            <div className="fr-card">
              <span className="fr-badge" style={{ background: 'rgba(255,122,41,0.16)', border: '1px solid rgba(255,147,80,0.55)', color: '#FF9350' }}>
                {t('LIMITED SLOTS · BID & AUCTION', 'LIMITED SLOTS · BID व AUCTION')}
              </span>
              <p className="fr-p" style={{ marginTop: 14 }}>
                {t('Franchise slots are limited. If applications exceed the available slots (10+ interested parties), franchises are allotted through a transparent bid and auction process — the league invites sealed/competitive bids and slots go to the highest qualifying bidders.',
                   'Franchise slots सीमित हैं। अगर उपलब्ध slots से ज़्यादा applications आती हैं (10+ इच्छुक पक्ष), तो franchises एक transparent bid और auction process से allot होती हैं — league competitive bids आमंत्रित करती है और slots सबसे ऊँची qualifying bids को मिलते हैं।')}
              </p>
              <div className="fr-grid2" style={{ marginTop: 16 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '16px 18px' }}>
                  <div className="fr-num" style={{ color: '#FFD873', fontSize: 'clamp(26px,3.6vw,34px)' }}>₹2 {t('Lakh', 'लाख')}</div>
                  <div className="fr-label" style={{ margin: '8px 0 6px' }}>{t('Bid Registration Fee', 'Bid Registration Fee')}</div>
                  <p className="fr-p" style={{ margin: 0, fontSize: 13.5 }}>
                    {t('A one-time, non-refundable registration fee of ₹2,00,000 per applicant to participate in the franchise bid process. This confirms serious intent and covers evaluation and processing.',
                       'Bid process में भाग लेने के लिए प्रति आवेदक ₹2,00,000 की one-time, non-refundable registration fee। इससे serious intent confirm होता है और evaluation व processing cover होती है।')}
                  </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '16px 18px' }}>
                  <div className="fr-label" style={{ margin: '4px 0 8px' }}>{t('Bid process at a glance', 'Bid process एक नज़र में')}</div>
                  <div className="fr-fine">{t('Register for the bid with the ₹2 lakh fee + documents', '₹2 लाख fee + documents के साथ bid के लिए register करें')}</div>
                  <div className="fr-fine">{t('League verifies eligibility & background of every applicant', 'League हर आवेदक की eligibility व background verify करती है')}</div>
                  <div className="fr-fine">{t('Qualified applicants participate in the franchise auction', 'Qualified आवेदक franchise auction में भाग लेते हैं')}</div>
                  <div className="fr-fine">{t('Winning bidders sign the franchise agreement', 'जीतने वाले bidders franchise agreement sign करते हैं')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div>
            <h2 className="fr-sec-h">{t('Who can own a franchise', 'Franchise कौन ले सकता है')}</h2>
            <div className="fr-card">
              <p className="fr-p" style={{ marginTop: 0 }}>
                {t('BCPL is building a league families and companies trust. Every franchise owner represents the league — so every applicant goes through verification before approval:',
                   'BCPL एक ऐसी league बना रही है जिस पर परिवार और companies भरोसा करें। हर franchise owner league का चेहरा होता है — इसलिए हर आवेदक approval से पहले verification से गुज़रता है:')}
              </p>
              <div className="fr-check">{t('Clean legal background — no criminal proceedings or pending cases of moral turpitude', 'साफ़ legal background — कोई criminal proceedings या गंभीर pending cases नहीं')}</div>
              <div className="fr-check">{t('Legitimate, verifiable source of funds and sound financial standing', 'वैध, verifiable source of funds और मज़बूत financial standing')}</div>
              <div className="fr-check">{t('Individual or registered business entity with complete KYC (PAN, Aadhaar / company registration, GST where applicable)', 'व्यक्ति या registered business entity, पूरी KYC के साथ (PAN, Aadhaar / company registration, लागू हो तो GST)')}</div>
              <div className="fr-check">{t('No involvement in betting, match-fixing or any activity that conflicts with the spirit of the sport', 'Betting, match-fixing या खेल की भावना के ख़िलाफ़ किसी गतिविधि में कोई संलिप्तता नहीं')}</div>
              <p className="fr-p" style={{ marginBottom: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                {t('The league reserves the right to accept or reject any application after due diligence, with final decisions resting with BCPL.',
                   'Due diligence के बाद किसी भी application को स्वीकार या अस्वीकार करने का अधिकार league के पास सुरक्षित है — अंतिम निर्णय BCPL का होगा।')}
              </p>
            </div>
          </div>

          {/* Why own */}
          <div>
            <h2 className="fr-sec-h">{t('What you get as an owner', 'Owner के तौर पर आपको क्या मिलता है')}</h2>
            <div className="fr-grid2">
              {[
                ['Your own team identity', 'अपनी team की पहचान', 'Team name, colours, jersey and logo under the BCPL umbrella — presented across the website, match days and league media.', 'BCPL के अंतर्गत team का नाम, रंग, jersey और logo — website, match days और league media पर आपकी team की पहचान।'],
                ['Squad building & auction', 'Squad building और auction', 'Pick your squad through the league\u2019s player auction and manage it through the season.', 'League की player auction से अपनी squad चुनिए और पूरे season उसे manage कीजिए।'],
                ['League-run operations', 'League द्वारा संचालित operations', 'Grounds, umpires, scoring, broadcast and the digital platform are run centrally by the league — you focus on your team.', 'Grounds, umpires, scoring, broadcast और digital platform league centrally चलाती है — आप अपनी team पर focus कीजिए।'],
                ['Brand visibility', 'Brand visibility', 'Your franchise brand travels with the league — social media, press coverage and on-ground presence across the season.', 'आपका franchise brand league के साथ हर जगह पहुँचता है — social media, press coverage और on-ground presence।'],
                ['Sponsorship rights on your team', 'अपनी team पर sponsorship rights', 'Bring your own team sponsors — jersey, kit and team-level branding — over and above your share of the league\u2019s central sponsorship pool.', 'अपनी team के sponsors खुद लाइए — jersey, kit और team-level branding — league के central sponsorship pool में हिस्से के ऊपर।'],
                ['Audience & engagement insights', 'Audience व engagement insights', 'Season-wise aggregated insights on the league\u2019s registered professional audience — the data story that helps you close sponsors faster.', 'League की registered professional audience पर season-wise aggregated insights — वही data story जिससे sponsors जल्दी convince होते हैं।'],
              ].map(([en, hi, pEn, pHi]) => (
                <div key={en} className="fr-card">
                  <div style={{ fontFamily: "'Montserrat',Inter,sans-serif", fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 8 }}>{t(en, hi)}</div>
                  <p className="fr-p">{t(pEn, pHi)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Process */}
          <div>
            <h2 className="fr-sec-h">{t('How it works', 'प्रक्रिया कैसी है')}</h2>
            <div className="fr-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                ['Send an enquiry', 'Enquiry भेजिए', `Write to ${FR_EMAIL} with your name, organisation and city.`, `${FR_EMAIL} पर अपना नाम, organisation और शहर लिखकर भेजिए।`],
                ['Meet the league', 'League से मिलिए', 'We walk you through the model, the numbers and the season plan in detail.', 'हम आपको model, numbers और season plan detail में समझाते हैं।'],
                ['Register for the bid', 'Bid के लिए register कीजिए', 'Complete KYC and background verification, and pay the ₹2 lakh non-refundable bid registration fee.', 'KYC और background verification पूरी कीजिए, और ₹2 लाख non-refundable bid registration fee जमा कीजिए।'],
                ['Bid & agreement', 'Bid और agreement', 'If applicants exceed available slots, the franchise auction decides allotment. Winning owners sign the franchise agreement and fee schedule.', 'Slots से ज़्यादा आवेदक होने पर franchise auction से allotment तय होता है। जीतने वाले owners franchise agreement और fee schedule sign करते हैं।'],
                ['Build your team', 'अपनी team बनाइए', 'Join the player auction, build your squad and take the field.', 'Player auction में शामिल होकर squad बनाइए और मैदान में उतरिए।'],
              ].map(([en, hi, pEn, pHi], i) => (
                <div key={en} className="fr-step">
                  <span className="fr-step-n">{i + 1}</span>
                  <div>
                    <div style={{ fontFamily: "'Montserrat',Inter,sans-serif", fontWeight: 800, fontSize: 15.5, color: '#fff', marginBottom: 3 }}>{t(en, hi)}</div>
                    <p className="fr-p" style={{ margin: 0 }}>{t(pEn, pHi)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terms & conditions */}
          <div>
            <h2 className="fr-sec-h">{t('Key terms & conditions', 'मुख्य नियम व शर्तें')}</h2>
            <div className="fr-card">
              <div className="fr-fine">{t('The league franchise fee (₹3 Cr in the current season) increases by 10% every season.', 'League franchise fee (मौजूदा season में ₹3 करोड़) हर season 10% बढ़ती है।')}</div>
              <div className="fr-fine">{t('The ₹2 lakh bid registration fee is non-refundable, whether or not a franchise is allotted.', '₹2 लाख की bid registration fee non-refundable है — franchise allot हो या न हो।')}</div>
              <div className="fr-fine">{t('If interested applicants exceed available slots (10+), allotment is via the league\u2019s bid & auction process.', 'उपलब्ध slots से ज़्यादा (10+) इच्छुक आवेदक होने पर allotment league की bid व auction process से होता है।')}</div>
              <div className="fr-fine">{t('Every applicant undergoes KYC, background and source-of-funds verification; the league\u2019s decision on approval is final.', 'हर आवेदक की KYC, background और source-of-funds verification होती है; approval पर league का निर्णय अंतिम है।')}</div>
              <div className="fr-fine">{t('Revenue shares (25% of registration revenue, 50% of sponsorship revenue) depend on actual league revenues each season — they describe a sharing structure, not an assured or guaranteed return.', 'Revenue share (registration revenue का 25%, sponsorship revenue का 50%) हर season की असली league revenue पर निर्भर है — यह sharing structure है, कोई assured या guaranteed return नहीं।')}</div>
              <div className="fr-fine">{t('Detailed terms are set out in the franchise agreement shared during the enquiry process.', 'विस्तृत शर्तें franchise agreement में होंगी, जो enquiry process के दौरान साझा की जाती है।')}</div>
            </div>
          </div>

          {/* CTA */}
          <div className="fr-card" style={{ textAlign: 'center', border: '1px solid rgba(232,178,61,0.45)' }}>
            <h3 style={{ fontFamily: "'Montserrat',Inter,sans-serif", fontWeight: 800, fontSize: 'clamp(18px,3vw,24px)', color: '#fff', margin: '0 0 10px' }}>
              {t('Interested in owning a BCPL franchise?', 'BCPL franchise लेने में रुचि है?')}
            </h3>
            <p className="fr-p" style={{ maxWidth: 560, margin: '0 auto 18px' }}>
              {t('Limited franchises are available this season. Write to us and the league team will get in touch.',
                 'इस season सीमित franchises उपलब्ध हैं। हमें लिखिए — league की team आपसे संपर्क करेगी।')}
            </p>
            <a className="fr-cta" href={`mailto:${FR_EMAIL}?subject=Franchise Enquiry — BCPL`}>{FR_EMAIL}</a>
          </div>
        </div>
      </section>

      <BCPLFooter />
    </div>
  );
}
