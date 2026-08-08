import React from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { SponsorWall } from '../components/SponsorWall';
import { useLang } from '../lib/i18n';
import { SEASON } from '../lib/season';
import { submitSponsorEnquiry } from '../lib/api';

const SP_EMAIL = 'sponsorship@bcplt20.com';
const SP_PHONE_DISPLAY = '+91 91513 46555';
const WHATSAPP_URL = 'https://wa.me/919151346555?text=' +
  encodeURIComponent('Hi BCPL team, I would like to know about sponsorship options.');
const BASE = import.meta.env.BASE_URL;
const HERO_IMG = BASE + 'bcpl-assets/stadium-hero.jpg';
const DECK_URL = BASE + 'bcpl-assets/BCPL-Sponsorship-Deck.pdf';

/* Real photos already shipped in public/bcpl-assets and used elsewhere on the
   site — reused here as the past-seasons strip (no new/invented assets). */
const PAST_SEASON_IMAGES: Array<[string, string]> = [
  ['event-teams-a.webp', 'Franchise owners & captains'],
  ['event-teams-b.webp', 'Ten franchises, one stage'],
  ['event-stage-trophy.webp', 'Season trophy presentation'],
  ['event-panel.webp', 'League panel & announcements'],
  ['auction-hero.webp', 'Player auction'],
  ['jerseys.webp', 'Team jerseys'],
  ['ganguly_1.jpg', 'League event'],
  ['ganguly_2.jpg', 'League event'],
  ['ganguly_3.jpg', 'League event'],
  ['ganguly_shoot.jpg', 'Brand shoot'],
  ['ambassador-a.webp', 'On-ground moments'],
  ['ambassador-b.webp', 'On-ground moments'],
];

const BUDGETS: Array<[string, string, string]> = [
  ['under-1L', 'Under \u20B91 Lakh', '\u20B91 लाख से कम'],
  ['1-5L', '\u20B91\u20135 Lakh', '\u20B91\u20135 लाख'],
  ['5-15L', '\u20B95\u201315 Lakh', '\u20B95\u201315 लाख'],
  ['15L-plus', '\u20B915 Lakh+', '\u20B915 लाख+'],
  ['custom', 'Prefer not to say', 'बताना नहीं चाहते'],
];

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
.sp-cta { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#FF7A29,#D95E10); border-radius:10px; padding:13px 26px; font-family:'Montserrat',Inter,sans-serif; font-weight:900; font-size:12.5px; letter-spacing:.08em; color:#fff; text-transform:uppercase; text-decoration:none; box-shadow:0 8px 26px rgba(255,122,41,0.35); transition:transform .15s, opacity .2s; cursor:pointer; border:none; }
.sp-cta:hover { transform:translateY(-2px); opacity:.92; }
.sp-cta.ghost { background:transparent; border:1px solid rgba(255,255,255,0.35); box-shadow:none; }
.sp-cta.gold { background:linear-gradient(135deg,#E8B23D,#FFD873); color:#0C1D33; box-shadow:0 8px 26px rgba(232,178,61,0.3); }
.sp-cta:disabled { opacity:.6; cursor:not-allowed; transform:none; }
.sp-sec-kick { font-family:Inter,sans-serif; font-weight:700; font-size:12px; letter-spacing:.2em; color:#E8B23D; text-transform:uppercase; }
.sp-sec-h { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(24px,3.6vw,34px); color:#fff; text-transform:uppercase; letter-spacing:.03em; margin:8px 0 6px; }
.sp-sec-sub { font-size:14.5px; line-height:1.7; color:rgba(255,255,255,0.78); font-family:Inter,sans-serif; max-width:660px; margin:0; }
.sp-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
@media(min-width:760px){ .sp-stats{grid-template-columns:repeat(4,1fr);} }
.sp-stat { background:linear-gradient(135deg,rgba(36,57,107,0.92),rgba(27,46,82,0.88)); border:1px solid rgba(255,255,255,0.16); border-radius:16px; padding:22px 18px; text-align:center; box-shadow:0 12px 34px rgba(0,0,0,0.3); }
.sp-stat b { display:block; font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(28px,4vw,40px); color:#FFD873; line-height:1; }
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
.sp-tier li::before { content:'\\2713'; position:absolute; left:0; top:0; color:#31C56B; font-weight:900; }
.sp-strip { display:flex; gap:14px; overflow-x:auto; padding:6px 2px 14px; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; }
.sp-strip::-webkit-scrollbar { height:6px; }
.sp-strip::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:6px; }
.sp-strip figure { flex:0 0 auto; width:min(280px,72vw); margin:0; scroll-snap-align:start; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.14); background:#16233F; box-shadow:0 10px 28px rgba(0,0,0,0.3); }
.sp-strip img { width:100%; height:180px; object-fit:cover; display:block; }
.sp-strip figcaption { font-family:Inter,sans-serif; font-size:11.5px; color:rgba(255,255,255,0.7); padding:8px 12px; }
.sp-field { display:flex; flex-direction:column; gap:6px; }
.sp-field label { font-family:Inter,sans-serif; font-size:12px; font-weight:700; letter-spacing:.04em; color:rgba(255,255,255,0.82); }
.sp-field label .opt { color:rgba(255,255,255,0.5); font-weight:500; }
.sp-input, .sp-select, .sp-textarea { width:100%; background:rgba(11,20,40,0.6); border:1px solid rgba(255,255,255,0.18); border-radius:11px; padding:12px 14px; color:#fff; font-family:Inter,sans-serif; font-size:14px; outline:none; transition:border-color .16s; }
.sp-input:focus, .sp-select:focus, .sp-textarea:focus { border-color:rgba(232,178,61,0.7); }
.sp-input.err { border-color:#EF6A6A; }
.sp-textarea { min-height:104px; resize:vertical; }
.sp-select option { color:#0C1D33; }
.sp-hp { position:absolute; left:-9999px; width:1px; height:1px; opacity:0; }
.sp-err { color:#FF9B9B; font-size:12px; font-family:Inter,sans-serif; }
.sp-note { font-size:11.5px; color:rgba(255,255,255,0.55); font-family:Inter,sans-serif; }
.sp-wa { display:inline-flex; align-items:center; gap:9px; background:#25D366; color:#062b16; border-radius:12px; padding:13px 22px; font-family:'Montserrat',Inter,sans-serif; font-weight:900; font-size:13px; text-decoration:none; box-shadow:0 10px 26px rgba(37,211,102,0.28); transition:transform .15s; }
.sp-wa:hover { transform:translateY(-2px); }
.sp-frow { display:grid; gap:14px; grid-template-columns:1fr 1fr; }
@media(max-width:560px){ .sp-frow { grid-template-columns:1fr; } }
`;

function SponsorEnquiryForm() {
  const { t } = useLang();
  const [form, setForm] = React.useState({
    name: '', company: '', designation: '', phone: '', email: '', budget: '', message: '', website_url: '',
  });
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [errs, setErrs] = React.useState<Record<string, string>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('Please enter your name.', 'कृपया अपना नाम भरें।');
    if (!form.company.trim()) e.company = t('Please enter your company.', 'कृपया company का नाम भरें।');
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = t('Enter a valid 10-digit mobile number.', '10 अंकों का सही mobile number भरें।');
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = t('Enter a valid email.', 'सही email भरें।');
    if (!form.budget) e.budget = t('Please select a budget range.', 'कृपया budget range चुनें।');
    if (!form.message.trim()) e.message = t('Please add a short message.', 'कृपया एक छोटा message लिखें।');
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    if (form.website_url.trim() !== '') { setDone(true); return; } // honeypot tripped — silently succeed
    if (!validate()) return;
    setBusy(true); setFailed(false);
    try {
      await submitSponsorEnquiry({
        name: form.name.trim(),
        company: form.company.trim(),
        designation: form.designation.trim() || undefined,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        budget: form.budget,
        message: form.message.trim() || undefined,
        ...(form.website_url ? { website_url: form.website_url } : {}),
      });
      setDone(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="sp-card" style={{ textAlign: 'center', border: '1px solid rgba(49,197,107,0.45)' }}>
        <div className="cic" style={{ margin: '0 auto 12px', background: 'rgba(49,197,107,0.18)', fontSize: 26 }}>{'\u2713'}</div>
        <h3 style={{ fontFamily: "'Montserrat',Inter,sans-serif", fontWeight: 800, fontSize: 'clamp(19px,3vw,24px)', color: '#fff', margin: '0 0 10px' }}>
          {t('Thank you — we\u2019ve received your enquiry.', 'धन्यवाद — आपकी enquiry हमें मिल गई है।')}
        </h3>
        <p className="sp-sec-sub" style={{ margin: '0 auto', maxWidth: 480 }}>
          {t('Our team will get in touch with you soon to discuss the right partnership for your brand.',
             'हमारी team जल्द ही आपके brand के लिए सही partnership पर बात करने के लिए संपर्क करेगी।')}
        </p>
      </div>
    );
  }

  return (
    <form className="sp-card" onSubmit={submit} noValidate style={{ position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        <div className="sp-frow">
          <div className="sp-field">
            <label>{t('Name', 'नाम')}</label>
            <input className={'sp-input' + (errs.name ? ' err' : '')} value={form.name} onChange={set('name')} autoComplete="name" />
            {errs.name && <span className="sp-err">{errs.name}</span>}
          </div>
          <div className="sp-field">
            <label>{t('Company', 'Company')}</label>
            <input className={'sp-input' + (errs.company ? ' err' : '')} value={form.company} onChange={set('company')} autoComplete="organization" />
            {errs.company && <span className="sp-err">{errs.company}</span>}
          </div>
        </div>
        <div className="sp-frow">
          <div className="sp-field">
            <label>{t('Designation', 'पद')} <span className="opt">{t('(optional)', '(वैकल्पिक)')}</span></label>
            <input className="sp-input" value={form.designation} onChange={set('designation')} autoComplete="organization-title" />
          </div>
          <div className="sp-field">
            <label>{t('Phone', 'फ़ोन')}</label>
            <input className={'sp-input' + (errs.phone ? ' err' : '')} value={form.phone} onChange={set('phone')} inputMode="numeric" maxLength={10} placeholder="9XXXXXXXXX" autoComplete="tel-national" />
            {errs.phone && <span className="sp-err">{errs.phone}</span>}
          </div>
        </div>
        <div className="sp-frow">
          <div className="sp-field">
            <label>{t('Email', 'ईमेल')} <span className="opt">{t('(optional)', '(वैकल्पिक)')}</span></label>
            <input className={'sp-input' + (errs.email ? ' err' : '')} value={form.email} onChange={set('email')} inputMode="email" autoComplete="email" />
            {errs.email && <span className="sp-err">{errs.email}</span>}
          </div>
          <div className="sp-field">
            <label>{t('Budget range', 'Budget range')}</label>
            <select className="sp-select" value={form.budget} onChange={set('budget')} style={errs.budget ? { borderColor: '#EF6A6A' } : undefined}>
              <option value="">{t('Select\u2026', 'चुनें\u2026')}</option>
              {BUDGETS.map(([v, en, hi]) => <option key={v} value={v}>{t(en, hi)}</option>)}
            </select>
            {errs.budget && <span className="sp-err">{errs.budget}</span>}
          </div>
        </div>
        <div className="sp-field">
          <label>{t('Message', 'Message')}</label>
          <textarea className="sp-textarea" value={form.message} onChange={set('message')}
            placeholder={t('Tell us about your brand and what you\u2019d like to achieve.', 'अपने brand और आप क्या हासिल करना चाहते हैं, इसके बारे में बताइए।')} />
          {errs.message && <span className="sp-err">{errs.message}</span>}
        </div>

        {/* Honeypot — hidden from humans; bots that fill it are silently dropped. */}
        <input className="sp-hp" tabIndex={-1} autoComplete="off" aria-hidden="true"
          value={form.website_url} onChange={set('website_url')} name="website_url" placeholder="Leave this empty" />

        {failed && (
          <div className="sp-err" style={{ lineHeight: 1.6 }}>
            {t('Couldn\u2019t submit right now. Please email us at ', 'अभी submit नहीं हो पाया। कृपया हमें email करें ')}
            <a href={`mailto:${SP_EMAIL}?subject=Sponsorship Enquiry — BCPL`} style={{ color: '#FFD873' }}>{SP_EMAIL}</a>
            {t(' or call ', ' या call करें ')}
            <a href="tel:+919151346555" style={{ color: '#FFD873' }}>{SP_PHONE_DISPLAY}</a>.
          </div>
        )}

        <button type="submit" className="sp-cta gold" disabled={busy} style={{ justifyContent: 'center' }}>
          {busy ? t('SENDING\u2026', 'भेजा जा रहा है\u2026') : t('SEND ENQUIRY', 'ENQUIRY भेजें')}
        </button>
        <p className="sp-note" style={{ textAlign: 'center', margin: 0 }}>
          {t('We\u2019ll only use your details to respond to this enquiry.', 'आपकी जानकारी सिर्फ़ इस enquiry के जवाब के लिए इस्तेमाल होगी।')}
        </p>
      </div>
    </form>
  );
}

export default function BecomeASponsor() {
  const { t } = useLang();
  const [deckOk, setDeckOk] = React.useState(false);

  // Show the deck button only if the PDF actually exists (graceful 404 hide).
  React.useEffect(() => {
    let alive = true;
    fetch(DECK_URL, { method: 'HEAD' })
      .then(r => { if (alive) setDeckOk(r.ok); })
      .catch(() => { if (alive) setDeckOk(false); });
    return () => { alive = false; };
  }, []);

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
            <a className="sp-cta" href="#enquiry">{t('ENQUIRE NOW', 'अभी पूछें')}</a>
            <a className="sp-cta ghost" href="#tiers">{t('VIEW OPTIONS', 'विकल्प देखें')}</a>
            {deckOk && (
              <a className="sp-cta gold" href={DECK_URL} target="_blank" rel="noopener noreferrer" download>
                {t('DOWNLOAD DECK (PDF)', 'DECK डाउनलोड करें (PDF)')}
              </a>
            )}
          </div>
        </div>
      </section>

      <section style={{ padding: '14px 0 clamp(60px,8vw,100px)' }}>
        <div className="sp-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(40px,5vw,60px)' }}>

          {/* Reach band — SEASON single-source numbers */}
          <div>
            <div className="sp-sec-kick">{t('The reach', 'पहुँच')}</div>
            <h2 className="sp-sec-h">{t('THE LEAGUE AT A GLANCE', 'League एक नज़र में')}</h2>
            <p className="sp-sec-sub" style={{ marginBottom: 22 }}>
              {t('A season-long league bringing together a growing, engaged audience of working professionals across India.',
                 'पूरे season चलने वाली एक league जो पूरे India में working professionals की एक बढ़ती, engaged audience को जोड़ती है।')}
            </p>
            <div className="sp-stats">
              {[
                [String(SEASON.teams), t('Franchise teams', 'Franchise teams')],
                [SEASON.trialCities, t('Trial cities', 'Trial शहर')],
                [SEASON.prizePool, t('Prize pool', 'Prize pool')],
                ['1', t('Season-long league', 'पूरे season की league')],
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
                ['\uD83D\uDCFA', 'Brand visibility all season', 'पूरे season brand visibility', 'Your brand travels with the league — ground branding, jerseys, digital coverage and match-day presence from trials to the final.', 'आपका brand league के साथ चलता है — ground branding, jerseys, digital coverage और trials से final तक match-day presence।'],
                ['\uD83D\uDC54', 'An engaged corporate audience', 'एक engaged corporate audience', 'Every player is a working professional. That means an urban, earning and brand-aware audience that follows the league closely.', 'हर player एक working professional है। यानी urban, कमाने वाली और brand-aware audience जो league को करीब से follow करती है।'],
                ['\uD83D\uDCCD', 'City-level activation', 'City-level activation', `With trials across ${SEASON.trialCities} cities, sponsors can activate locally — on the ground, where your audience actually is.`, `${SEASON.trialCities} शहरों में trials के साथ, sponsors locally activate कर सकते हैं — मैदान पर, जहाँ आपकी audience है।`],
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
              {t('Deliverables below are indicative — the final scope is set per agreement. Every partnership is built around your goals.',
                 'नीचे दिए deliverables indicative हैं — final scope agreement के अनुसार तय होता है। हर साझेदारी आपके goals के हिसाब से बनती है।')}
            </p>
            <div className="sp-cards two">
              {[
                [true, 'Flagship', 'Title Sponsor', 'Title Sponsor',
                  ['Name association with the league / season', 'Jersey & prime branding placement', 'LED & ground branding across venues', 'Website + app logo placement (sponsor strip)', 'Match-day announcements', 'Social media features', 'Hospitality box access'],
                  ['League / season के साथ नाम का जुड़ाव', 'Jersey और सबसे आगे branding placement', 'Venues पर LED और ground branding', 'Website + app logo placement (sponsor strip)', 'Match-day announcements', 'Social media features', 'Hospitality box access']],
                [false, '', 'Powered By', 'Powered By',
                  ['Presenting-level association with the league', 'Branding across grounds and digital', 'LED & ground branding at key fixtures', 'Website + app logo placement (sponsor strip)', 'Match-day announcements', 'Social media features'],
                  ['League के साथ presenting-level association', 'Grounds और digital पर branding', 'मुख्य fixtures पर LED और ground branding', 'Website + app logo placement (sponsor strip)', 'Match-day announcements', 'Social media features']],
                [false, '', 'Associate Sponsor', 'Associate Sponsor',
                  ['Branding across selected league touchpoints', 'Ground branding at selected fixtures', 'Website + app logo placement (sponsor strip)', 'Match-day presence at key fixtures', 'Social media features'],
                  ['चुने हुए league touchpoints पर branding', 'चुने हुए fixtures पर ground branding', 'Website + app logo placement (sponsor strip)', 'मुख्य fixtures पर match-day presence', 'Social media features']],
                [false, '', 'Partner', 'Partner',
                  ['Focused branding for a category or activity', 'City-level or activity-level activation', 'Website logo placement (sponsor strip)', 'Digital mentions and co-branding'],
                  ['किसी category या activity के लिए focused branding', 'City-level या activity-level activation', 'Website logo placement (sponsor strip)', 'Digital mentions और co-branding']],
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
            <p className="sp-note" style={{ marginTop: 14 }}>
              {t('Indicative deliverables — final scope, placements and pricing are confirmed per agreement.',
                 'Indicative deliverables — final scope, placements और pricing agreement के अनुसार तय होते हैं।')}
            </p>
          </div>

          {/* Past seasons photo strip */}
          <div>
            <div className="sp-sec-kick">{t('Past seasons', 'पिछले seasons')}</div>
            <h2 className="sp-sec-h">{t('MOMENTS FROM THE LEAGUE', 'League के पल')}</h2>
            <p className="sp-sec-sub" style={{ marginBottom: 16 }}>
              {t('A look at previous seasons — auctions, teams, jerseys and match-day.',
                 'पिछले seasons की एक झलक — auctions, teams, jerseys और match-day।')}
            </p>
            <div className="sp-strip">
              {PAST_SEASON_IMAGES.map(([img, alt]) => (
                <figure key={img}>
                  <img src={BASE + 'bcpl-assets/' + img} alt={alt} loading="lazy" />
                </figure>
              ))}
            </div>
          </div>

          {/* Existing sponsors wall (tier order + empty-slot CTA) */}
          <div>
            <div className="sp-sec-kick">{t('In good company', 'अच्छी company में')}</div>
            <h2 className="sp-sec-h">{t('BRANDS ALREADY WITH BCPL', 'BCPL से पहले से जुड़े brands')}</h2>
            <div style={{ marginTop: 8 }}>
              <SponsorWall />
            </div>
            <div className="sp-card" style={{ textAlign: 'center', marginTop: 8, border: '1px dashed rgba(232,178,61,0.5)', background: 'rgba(232,178,61,0.06)' }}>
              <div style={{ fontFamily: "'Barlow Condensed','Montserrat',sans-serif", fontWeight: 800, fontSize: 'clamp(20px,3vw,26px)', color: '#FFD873', textTransform: 'uppercase', letterSpacing: '.03em' }}>
                {t('YOUR LOGO HERE', 'आपका logo यहाँ')}
              </div>
              <p className="sp-sec-sub" style={{ margin: '8px auto 16px', maxWidth: 460 }}>
                {t('There\u2019s room for your brand on the league\u2019s sponsor wall. Let\u2019s talk.', 'League की sponsor wall पर आपके brand के लिए जगह है। आइए बात करें।')}
              </p>
              <a className="sp-cta gold" href="#enquiry">{t('CLAIM YOUR SPOT', 'अपनी जगह लें')}</a>
            </div>
          </div>

          {/* Deck download */}
          <div className="sp-card" style={{ textAlign: 'center' }}>
            <div className="cic" style={{ margin: '0 auto 12px', fontSize: 24 }}>{'\uD83D\uDCC4'}</div>
            <h3 style={{ fontFamily: "'Montserrat',Inter,sans-serif", fontWeight: 800, fontSize: 'clamp(18px,3vw,24px)', color: '#fff', margin: '0 0 8px' }}>
              {t('Sponsorship deck', 'Sponsorship deck')}
            </h3>
            <p className="sp-sec-sub" style={{ margin: '0 auto 18px', maxWidth: 480 }}>
              {t('Get the full overview — reach, tiers, placements and past seasons — in one PDF.',
                 'पूरा overview एक PDF में लीजिए — reach, tiers, placements और पिछले seasons।')}
            </p>
            {deckOk ? (
              <a className="sp-cta gold" href={DECK_URL} target="_blank" rel="noopener noreferrer" download>
                {t('DOWNLOAD SPONSORSHIP DECK (PDF)', 'SPONSORSHIP DECK डाउनलोड करें (PDF)')}
              </a>
            ) : (
              <p className="sp-note" style={{ margin: 0 }}>
                {t('The deck is on its way — email us and we\u2019ll send it over.', 'Deck जल्द आ रहा है — हमें email करें, हम भेज देंगे।')}
              </p>
            )}
          </div>

          {/* Enquiry form */}
          <div id="enquiry">
            <div className="sp-sec-kick">{t('Get in touch', 'संपर्क करें')}</div>
            <h2 className="sp-sec-h">{t('SEND A SPONSORSHIP ENQUIRY', 'Sponsorship enquiry भेजें')}</h2>
            <p className="sp-sec-sub" style={{ marginBottom: 18 }}>
              {t('Tell us about your brand and goals, and the league team will put together a custom sponsorship package.',
                 'हमें अपने brand और goals के बारे में बताइए, और league की team एक custom sponsorship package तैयार करेगी।')}
            </p>
            <SponsorEnquiryForm />
            {/* In-section WhatsApp CTA — uses the league's official number */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginTop: 18 }}>
              <span className="sp-sec-sub" style={{ margin: 0 }}>{t('Prefer to chat?', 'बात करना चाहते हैं?')}</span>
              <a className="sp-wa" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.94 1.34-.5.05-.94.24-3.17-.66-2.67-1.05-4.36-3.79-4.49-3.97-.13-.18-1.08-1.44-1.08-2.74 0-1.3.68-1.94.92-2.2.24-.27.53-.34.7-.34.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.18-.14.29-.28.45-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.27.72 1.18 1.54 1.91 1.06.95 1.95 1.24 2.22 1.38.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.24.09 1.55.73 1.82.86.27.14.45.2.51.31.07.12.07.66-.17 1.34z"/></svg>
                {t('CHAT ON WHATSAPP', 'WhatsApp पर बात करें')}
              </a>
            </div>
          </div>

        </div>
      </section>

      <BCPLFooter />
    </div>
  );
}
