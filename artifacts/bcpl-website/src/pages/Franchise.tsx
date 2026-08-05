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
          <p style={{ maxWidth: 640, margin: '18px auto 0', fontSize: 15.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter,sans-serif' }}>
            {t('This season, BCPL opens its franchise model. Own a team, build its squad, grow its fanbase — and share in the league\u2019s revenues.',
               'इस season BCPL अपना franchise model खोल रही है। एक team की मालिकी लीजिए, उसकी squad बनाइए, fanbase बढ़ाइए — और league की revenue में हिस्सेदार बनिए।')}
          </p>
          <a className="fr-cta" style={{ marginTop: 26 }} href={`mailto:${FR_EMAIL}?subject=Franchise Enquiry — BCPL`}>
            {t('ENQUIRE NOW', 'अभी संपर्क करें')} · {FR_EMAIL}
          </a>
        </div>
      </section>

      <section style={{ padding: '14px 0 clamp(60px,8vw,100px)' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(40px,5vw,60px)' }}>

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
          </div>

          {/* Revenue share */}
          <div>
            <h2 className="fr-sec-h">{t('How franchises earn', 'Franchise की कमाई कैसे होती है')}</h2>
            <div className="fr-grid2">
              <div className="fr-card">
                <div className="fr-num" style={{ color: '#31C56B' }}>25%</div>
                <div className="fr-label" style={{ margin: '10px 0 8px' }}>{t('Of Registration Revenue', 'Registration revenue का')}</div>
                <p className="fr-p">{t('25% of the league\u2019s player-registration revenue is distributed among the franchises every season. The more registrations your team\u2019s outreach brings in, the bigger the shared pool grows.',
                  'League की player-registration revenue का 25% हर season franchises में बाँटा जाता है। आपकी team की मेहनत से जितने ज़्यादा registrations आएँगे, बँटने वाला pool उतना बड़ा होगा।')}</p>
              </div>
              <div className="fr-card">
                <div className="fr-num" style={{ color: '#31C56B' }}>50%</div>
                <div className="fr-label" style={{ margin: '10px 0 8px' }}>{t('Of Sponsorship Revenue', 'Sponsorship revenue का')}</div>
                <p className="fr-p">{t('50% of the league\u2019s sponsorship revenue is distributed among the franchises every season — a direct share in the league\u2019s commercial growth.',
                  'League की sponsorship revenue का 50% हर season franchises में बाँटा जाता है — league की commercial growth में सीधी हिस्सेदारी।')}</p>
              </div>
            </div>
            <p className="fr-p" style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              {t('Note: revenue shares depend on the league\u2019s actual registration and sponsorship revenues each season. Figures above describe the sharing structure, not an assured return.',
                 'नोट: revenue share हर season की असली registration और sponsorship revenue पर निर्भर करता है। ऊपर दिया गया ढाँचा sharing structure है, किसी return की गारंटी नहीं।')}
            </p>
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
                ['Agreement & onboarding', 'Agreement और onboarding', 'Franchise agreement, fee schedule and team identity are finalised.', 'Franchise agreement, fee schedule और team identity finalise होती है।'],
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
