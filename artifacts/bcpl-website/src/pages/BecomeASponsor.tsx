import React from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { SponsorWall } from '../components/SponsorWall';
import { useLang } from '../lib/i18n';

const SP_EMAIL = 'sponsorship@bcplt20.com';
const BASE = import.meta.env.BASE_URL;
const HERO_IMG = BASE + 'bcpl-assets/stadium-hero.jpg';

const CSS = `
*, *::before, *::after { box-sizing:border-box; }
body { background:#1B2E52; }
.sp-wrap { max-width:1080px; margin:0 auto; padding:0 20px; }
@media(min-width:768px){ .sp-wrap{padding:0 32px} }
.sp-kicker { font-family:Inter,sans-serif; font-weight:700; font-size:12px; letter-spacing:.22em; color:#E8B23D; text-transform:uppercase; }
.sp-h1 { font-family:'Barlow Condensed','Mukta','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; line-height:.95; letter-spacing:.015em; color:#fff; font-size:clamp(40px,7.5vw,80px); margin:14px 0 0; }
.sp-shimmer { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:spShimmer 3s linear infinite; }
@keyframes spShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
.sp-lead { max-width:640px; margin:18px auto 0; font-size:15.5px; line-height:1.75; color:rgba(255,255,255,0.82); font-family:Inter,sans-serif; }
.sp-cta { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#FF7A29,#D95E10); border-radius:10px; padding:13px 26px; font-family:'Montserrat',Inter,sans-serif; font-weight:900; font-size:12.5px; letter-spacing:.08em; color:#fff; text-transform:uppercase; text-decoration:none; box-shadow:0 8px 26px rgba(255,122,41,0.35); transition:transform .15s, opacity .2s; }
.sp-cta:hover { transform:translateY(-2px); opacity:.92; }
.sp-cta.ghost { background:transparent; border:1px solid rgba(255,255,255,0.35); box-shadow:none; }
.sp-sec-kick { font-family:Inter,sans-serif; font-weight:700; font-size:12px; letter-spacing:.2em; color:#E8B23D; text-transform:uppercase; }
.sp-sec-h { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(24px,3.6vw,34px); color:#fff; text-transform:uppercase; letter-spacing:.03em; margin:8px 0 6px; }
.sp-sec-sub { font-size:14.5px; line-height:1.7; color:rgba(255,255,255,0.78); font-family:Inter,sans-serif; max-width:660px; margin:0; }
.sp-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
@media(min-width:760px){ .sp-stats{grid-template-columns:repeat(3,1fr);} }
.sp-stat { background:linear-gradient(135deg,rgba(36,57,107,0.92),rgba(27,46,82,0.88)); border:1px solid rgba(255,255,255,0.16); border-radius:16px; padding:22px 18px; text-align:center; box-shadow:0 12px 34px rgba(0,0,0,0.3); }
.sp-stat b { display:block; font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(30px,4.4vw,42px); color:#FFD873; line-height:1; }
.sp-stat span { display:block; margin-top:8px; font-size:12.5px; line-height:1.45; color:rgba(255,255,255,0.78); font-family:Inter,sans-serif; }
.sp-cards { display:grid; grid-template-columns:1fr; gap:18px; }
@media(min-width:760px){ .sp-cards.two{grid-template-columns:1fr 1fr;} .sp-cards.three{grid-template-columns:1fr 1fr 1fr;} }
.sp-card { background:linear-gradient(135deg,rgba(36,57,107,0.92),rgba(27,46,82,0.88)); border:1px solid rgba(255,255,255,0.16); border-radius:18px; padding:clamp(20px,3vw,26px); box-shadow:0 14px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08); }
.sp-card .cic { width:44px; height:44px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; font-size:21px; background:rgba(232,178,61,0.16); margin-bottom:12px; }
.sp-card h4 { font-family:'Montserrat',Inter,sans-serif; font-weight:800; font-size:16.5px; color:#fff; margin:0 0 8px; }
.sp-card p { font-size:14px; line-height:1.7; color:rgba(255,255,255,0.82); font-family:Inter,sans-serif; margin:0; }
.sp-tier { position:relative; background:linear-gradient(135deg,rgba(36,57,107,0.94),rgba(27,46,82,0.9)); border:1px solid rgba(255,255,255,0.16); border-radius:18px; padding:clamp(20px,3vw,26px); display:flex; flex-direction:column; gap:12px; box-shadow:0 14px 40px rgba(0,0,0,0.32); }
.sp-tier.feature { border:1px solid rgba(232,178,61,0.55); box-shadow:0 16px 46px rgba(232,178,61,0.14), 0 14px 40px rgba(0,0,0,0.32); }
.sp-tier .badge { align-self:flex-start; display:inline-flex; border-radius:100px; padding:4px 13px; font-size:10px; font-weight:900; font-family:'Montserrat',Inter,sans-serif; letter-spacing:.12em; text-transform:uppercase; background:rgba(255,122,41,0.16); border:1px solid rgba(255,147,80,0.55); color:#FF9350; }
.sp-tier h4 { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(22px,3vw,28px); color:#fff; text-transform:uppercase; letter-spacing:.02em; margin:0; }
.sp-tier .rate { font-family:Inter,sans-serif; font-weight:700; font-size:13px; color:#FFD873; }
.sp-tier ul { list-style:none; margin:6px 0 0; padding:0; display:flex; flex-direction:column; gap:9px; }
.sp-tier li { position:relative; padding-left:24px; font-size:13.5px; line-height:1.6; color:rgba(255,255,255,0.85); font-family:Inter,sans-serif; }
.sp-tier li::before { content:'\u2713'; position:absolute; left:0; top:0; color:#31C56B; font-weight:900; }
.sp-step { display:flex; gap:14px; align-items:flex-start; }
.sp-step .num { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#E8B23D,#FFD873); color:#0C1D33; font-family:'Montserrat',sans-serif; font-weight:900; font-size:14px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
.sp-step h4 { font-family:'Montserrat',Inter,sans-serif; font-weight:800; font-size:15.5px; color:#fff; margin:0 0 3px; }
.sp-step p { font-size:14px; line-height:1.7; color:rgba(255,255,255,0.82); font-family:Inter,sans-serif; margin:0; }
`;

export default function BecomeASponsor() {
  const { t } = useLang();

  return (
    <div style={{ minHeight: '100vh', background: '#1B2E52', color: '#fff' }}>
      <style>{CSS}</style>
      <SiteHeader active="Sponsor" />

      {/* Hero */}
      <section
        style={{
          padding: 'calc(var(--sh-h, 68px) + clamp(44px,6vw,80px)) 0 clamp(40px,5vw,60px)',
          textAlign: 'center',
          position: 'relative',
          backgroundImage: `linear-gradient(180deg, rgba(22,35,63,0.82), rgba(27,46,82,0.94)), url(${HERO_IMG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="sp-wrap">
          <div className="sp-kicker">{t('PARTNER WITH BCPL', 'BCPL के साथ जुड़िए')}</div>
          <h1 className="sp-h1">
            {t('BECOME A', 'बनिए एक')} <span className="sp-shimmer">{t('SPONSOR.', 'SPONSOR.')}</span>
          </h1>
          <p className="sp-lead">
            {t('Put your brand in front of India\u2019s working professionals — an urban, earning, brand-aware audience — across a full T20 season of trials, matches, digital coverage and on-ground moments.',
               'अपने brand को India के working professionals के सामने रखिए — urban, कमाने वाली, brand-aware audience — पूरे T20 season के trials, matches, digital coverage और on-ground moments में।')}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 26 }}>
            <a className="sp-cta" href={`mailto:${SP_EMAIL}?subject=Sponsorship Enquiry — BCPL`}>
              {t('TALK TO US', 'हमसे बात करें')} · {SP_EMAIL}
            </a>
            <a className="sp-cta ghost" href="#tiers">{t('VIEW OPTIONS', 'विकल्प देखें')}</a>
          </div>
        </div>
      </section>

      <section style={{ padding: '14px 0 clamp(60px,8vw,100px)' }}>
        <div className="sp-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(40px,5vw,60px)' }}>

          {/* Reach in numbers */}
          <div>
            <div className="sp-sec-kick">{t('The reach', 'पहुँच')}</div>
            <h2 className="sp-sec-h">{t('THE LEAGUE IN NUMBERS', 'League के numbers')}</h2>
            <p className="sp-sec-sub" style={{ marginBottom: 22 }}>
              {t('Four seasons in, BCPL brings a growing, engaged audience of working professionals across India.',
                 'चार seasons के बाद, BCPL पूरे India में working professionals की एक बढ़ती, engaged audience लाती है।')}
            </p>
            <div className="sp-stats">
              {[
                ['2,40,000+', t('Working professionals reached', 'Working professionals तक पहुँच')],
                ['385+', t('Players auctioned', 'Players auction हुए')],
                ['\u20B913 Cr+', t('Prize money distributed', 'Prize money बाँटी गई')],
                ['4', t('Seasons completed', 'Seasons पूरे')],
                ['48+', t('Trial cities', 'Trial शहर')],
                ['10', t('Franchise teams', 'Franchise teams')],
              ].map(([b, s]) => (
                <div key={String(s)} className="sp-stat"><b>{b}</b><span>{s}</span></div>
              ))}
            </div>
          </div>

          {/* Why sponsor */}
          <div>
            <div className="sp-sec-kick">{t('Why sponsor', 'Sponsor क्यों करें')}</div>
            <h2 className="sp-sec-h">{t('WHY BRANDS PARTNER WITH BCPL', 'Brands BCPL से क्यों जुड़ते हैं')}</h2>
            <div className="sp-cards two" style={{ marginTop: 18 }}>
              {[
                ['\uD83D\uDCFA', 'Brand visibility all season', 'पूरे season brand visibility', 'Your brand travels with the league — ground branding, jerseys, digital coverage, press and match-day presence from trials to the final.', 'आपका brand league के साथ चलता है — ground branding, jerseys, digital coverage, press और trials से final तक match-day presence।'],
                ['\uD83D\uDC54', 'An engaged corporate audience', 'एक engaged corporate audience', 'Every player is a working professional. That means an urban, earning and brand-aware audience that follows the league closely.', 'हर player एक working professional है। यानी urban, कमाने वाली और brand-aware audience जो league को करीब से follow करती है।'],
                ['\uD83D\uDCCD', 'City-level activation', 'City-level activation', 'With trials across 48+ cities, sponsors can activate locally — on the ground, where your audience actually is.', '48+ शहरों में trials के साथ, sponsors locally activate कर सकते हैं — मैदान पर, जहाँ आपकी audience है।'],
                ['\uD83E\uDD1D', 'Season-long association', 'पूरे season का association', 'A single, sustained partnership across an entire season — not a one-off placement — building recall over months.', 'पूरे season तक चलने वाली एक सतत साझेदारी — एक बार की placement नहीं — जो महीनों तक recall बनाती है।'],
              ].map(([ic, en, hi, pEn, pHi]) => (
                <div key={en} className="sp-card">
                  <div className="cic">{ic}</div>
                  <h4>{t(en, hi)}</h4>
                  <p>{t(pEn, pHi)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsorship tiers */}
          <div id="tiers">
            <div className="sp-sec-kick">{t('Sponsorship options', 'Sponsorship विकल्प')}</div>
            <h2 className="sp-sec-h">{t('WAYS TO PARTNER', 'जुड़ने के तरीके')}</h2>
            <p className="sp-sec-sub" style={{ marginBottom: 20 }}>
              {t('Every partnership is built around your goals. Packages are custom — reach out and we will put together the right fit.',
                 'हर साझेदारी आपके goals के हिसाब से बनती है। Packages custom होते हैं — हमसे संपर्क कीजिए और हम आपके लिए सही fit तैयार करेंगे।')}
            </p>
            <div className="sp-cards two">
              {[
                [true, 'Flagship', 'Title Sponsor', 'Title Sponsor',
                  ['Name association with the league / season', 'Prime placement across branding & broadcast', 'Lead presence on the website and social channels', 'Match-day and event visibility across the season'],
                  ['League / season के साथ नाम का जुड़ाव', 'Branding और broadcast में सबसे आगे placement', 'Website और social channels पर मुख्य presence', 'पूरे season match-day और event visibility']],
                [false, '', 'Powered By', 'Powered By',
                  ['Presenting-level association with the league', 'Branding across grounds and digital', 'Presence in league communications', 'Category association across the season'],
                  ['League के साथ presenting-level association', 'Grounds और digital पर branding', 'League communications में presence', 'पूरे season category association']],
                [false, '', 'Associate Sponsor', 'Associate Sponsor',
                  ['Branding across selected league touchpoints', 'Digital and social visibility', 'Match-day presence at key fixtures', 'Content and activation opportunities'],
                  ['चुने हुए league touchpoints पर branding', 'Digital और social visibility', 'मुख्य fixtures पर match-day presence', 'Content और activation के अवसर']],
                [false, '', 'Partner', 'Partner',
                  ['Focused branding for a category or activity', 'City-level or activity-level activation', 'Digital mentions and co-branding', 'A flexible entry point to partner with BCPL'],
                  ['किसी category या activity के लिए focused branding', 'City-level या activity-level activation', 'Digital mentions और co-branding', 'BCPL से जुड़ने का एक flexible entry point']],
              ].map(([feature, badgeEn, en, hi, itemsEn, itemsHi]) => (
                <div key={en as string} className={'sp-tier' + (feature ? ' feature' : '')}>
                  {feature ? <span className="badge">{t(badgeEn as string, 'फ्लैगशिप')}</span> : null}
                  <h4>{t(en as string, hi as string)}</h4>
                  <div className="rate">{t('Custom package \u2014 talk to us', 'Custom package \u2014 हमसे बात करें')}</div>
                  <ul>
                    {(itemsEn as string[]).map((it, i) => (
                      <li key={it}>{t(it, (itemsHi as string[])[i])}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Existing sponsors — social proof */}
          <div>
            <div className="sp-sec-kick">{t('In good company', 'अच्छी company में')}</div>
            <h2 className="sp-sec-h">{t('BRANDS ALREADY WITH BCPL', 'BCPL से पहले से जुड़े brands')}</h2>
            <div style={{ marginTop: 8 }}>
              <SponsorWall />
            </div>
          </div>

          {/* How it works */}
          <div>
            <div className="sp-sec-kick">{t('How it works', 'प्रक्रिया')}</div>
            <h2 className="sp-sec-h">{t('FROM ENQUIRY TO PARTNERSHIP', 'Enquiry से partnership तक')}</h2>
            <div className="sp-card" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16 }}>
              {[
                ['Send an enquiry', 'Enquiry भेजिए', `Write to ${SP_EMAIL} with your brand, category and what you would like to achieve.`, `${SP_EMAIL} पर अपना brand, category और आप क्या हासिल करना चाहते हैं, लिखकर भेजिए।`],
                ['We understand your goals', 'हम आपके goals समझते हैं', 'A short call to understand your audience, objectives and budget range.', 'आपकी audience, objectives और budget range समझने के लिए एक छोटी call।'],
                ['A package built for you', 'आपके लिए बना package', 'We put together a custom proposal — touchpoints, deliverables and pricing.', 'हम एक custom proposal तैयार करते हैं — touchpoints, deliverables और pricing।'],
                ['Go live with the league', 'League के साथ live', 'On agreement, your brand goes live across the season\u2019s touchpoints.', 'सहमति के बाद, आपका brand पूरे season के touchpoints पर live हो जाता है।'],
              ].map(([en, hi, pEn, pHi], i) => (
                <div key={en} className="sp-step">
                  <span className="num">{i + 1}</span>
                  <div>
                    <h4>{t(en, hi)}</h4>
                    <p>{t(pEn, pHi)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="sp-card" style={{ textAlign: 'center', border: '1px solid rgba(232,178,61,0.45)' }}>
            <h3 style={{ fontFamily: "'Montserrat',Inter,sans-serif", fontWeight: 800, fontSize: 'clamp(19px,3vw,26px)', color: '#fff', margin: '0 0 10px' }}>
              {t('Let\u2019s build the right partnership.', 'आइए सही साझेदारी बनाएँ।')}
            </h3>
            <p className="sp-sec-sub" style={{ margin: '0 auto 18px', maxWidth: 560 }}>
              {t('Tell us about your brand and goals, and the league team will put together a custom sponsorship package.',
                 'हमें अपने brand और goals के बारे में बताइए, और league की team एक custom sponsorship package तैयार करेगी।')}
            </p>
            <a className="sp-cta" href={`mailto:${SP_EMAIL}?subject=Sponsorship Enquiry — BCPL`}>{SP_EMAIL}</a>
          </div>
        </div>
      </section>

      <BCPLFooter />
    </div>
  );
}
