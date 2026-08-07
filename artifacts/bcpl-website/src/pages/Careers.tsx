import React from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';

const APPLY_EMAIL = 'jobs@bcplt20.com';

const CSS = `
*, *::before, *::after { box-sizing:border-box; }
body { background:#1C2B47; }
.wrap { max-width:1080px; margin:0 auto; padding:0 20px; }
@media(min-width:768px){ .wrap{padding:0 32px} }
.v3-kicker { font-family:Inter,sans-serif; font-weight:700; font-size:12px; letter-spacing:.22em; color:#E8B23D; text-transform:uppercase; }
.v3-h { font-family:'Barlow Condensed','Mukta','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; line-height:.95; letter-spacing:.015em; }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:carShimmer 3s linear infinite; }
@keyframes carShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
.job-card { background:linear-gradient(135deg,rgba(30,55,105,0.92),rgba(23,43,81,0.88)); border:1px solid rgba(255,255,255,0.18); border-radius:18px; padding:clamp(18px,3vw,28px); box-shadow:0 14px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10); }
.job-dept { display:inline-flex; align-items:center; border-radius:100px; padding:4px 13px; font-size:10.5px; font-weight:900; font-family:'Montserrat',Inter,sans-serif; letter-spacing:.12em; text-transform:uppercase; }
.job-title { font-family:'Montserrat',Inter,sans-serif; font-weight:800; font-size:clamp(17px,2.4vw,21px); color:#fff; margin:12px 0 4px; }
.job-meta { font-size:12.5px; color:rgba(255,255,255,0.6); font-family:Inter,sans-serif; font-weight:600; }
.job-salary { display:inline-block; background:rgba(49,197,107,0.12); border:1px solid rgba(49,197,107,0.45); color:#6EE7A0; font-weight:800; font-size:13px; border-radius:8px; padding:5px 12px; margin:6px 0 4px; font-family:Inter,sans-serif; }
.job-salary-note { font-weight:600; font-size:11px; color:rgba(255,255,255,0.55); }
.job-sub { font-family:'Montserrat',Inter,sans-serif; font-weight:900; font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,0.55); margin:16px 0 8px; }
.job-li { font-size:14px; line-height:1.7; color:rgba(255,255,255,0.82); font-family:Inter,sans-serif; padding-left:18px; position:relative; margin-bottom:6px; }
.job-li::before { content:''; position:absolute; left:2px; top:9px; width:6px; height:6px; border-radius:50%; background:#FF7A29; }
.job-li.do::before { background:#31C56B; }
.apply-btn { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#FF7A29,#D95E10); border-radius:10px; padding:11px 22px; font-family:'Montserrat',Inter,sans-serif; font-weight:900; font-size:12px; letter-spacing:.08em; color:#fff; text-transform:uppercase; text-decoration:none; box-shadow:0 8px 26px rgba(255,122,41,0.35); transition:transform .15s, opacity .2s; }
.apply-btn:hover { transform:translateY(-2px); opacity:.92; }
.dept-head { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(22px,3.4vw,30px); color:#fff; text-transform:uppercase; letter-spacing:.03em; margin:0 0 4px; }
.careers-grid { display:grid; grid-template-columns:1fr; gap:18px; }
@media(min-width:820px){ .careers-grid{grid-template-columns:1fr 1fr;} }
.perk-grid { display:grid; grid-template-columns:1fr; gap:16px; }
@media(min-width:760px){ .perk-grid{grid-template-columns:1fr 1fr 1fr;} }
.perk { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:18px 20px; }
.perk .ic { font-size:22px; }
.perk h4 { font-family:'Montserrat',Inter,sans-serif; font-weight:800; font-size:14.5px; color:#fff; margin:8px 0 6px; }
.perk p { font-size:13px; line-height:1.65; color:rgba(255,255,255,0.72); font-family:Inter,sans-serif; margin:0; }
/* League-in-numbers stat strip */
.cr-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; max-width:760px; margin:28px auto 0; }
@media(min-width:640px){ .cr-stats{grid-template-columns:repeat(3,1fr);} }
.cr-stat { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:16px 14px; text-align:center; }
.cr-stat b { display:block; font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(22px,4vw,30px); color:#E8B23D; line-height:1; letter-spacing:.01em; }
.cr-stat span { display:block; font-size:11.5px; color:rgba(255,255,255,0.72); font-family:Inter,sans-serif; margin-top:6px; line-height:1.4; }
/* Section heading */
.cr-sec-kick { font-family:Inter,sans-serif; font-weight:700; font-size:11.5px; letter-spacing:.2em; color:#FF7A29; text-transform:uppercase; }
.cr-sec-h { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(26px,4vw,40px); color:#fff; text-transform:uppercase; letter-spacing:.02em; margin:6px 0 0; line-height:1; }
.cr-sec-sub { font-size:14.5px; line-height:1.7; color:rgba(255,255,255,0.72); font-family:Inter,sans-serif; max-width:640px; margin:14px 0 0; }
/* Value / role cards */
.cr-cards { display:grid; grid-template-columns:1fr; gap:16px; margin-top:26px; }
@media(min-width:640px){ .cr-cards.two{grid-template-columns:1fr 1fr;} }
@media(min-width:820px){ .cr-cards.three{grid-template-columns:1fr 1fr 1fr;} }
.cr-card { background:linear-gradient(135deg,rgba(30,55,105,0.9),rgba(23,43,81,0.86)); border:1px solid rgba(255,255,255,0.16); border-radius:16px; padding:22px; box-shadow:0 12px 34px rgba(0,0,0,0.3); }
.cr-card .cic { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; background:rgba(255,122,41,0.14); border:1px solid rgba(255,122,41,0.4); }
.cr-card h4 { font-family:'Montserrat',Inter,sans-serif; font-weight:800; font-size:16px; color:#fff; margin:14px 0 7px; }
.cr-card p { font-size:13.5px; line-height:1.68; color:rgba(255,255,255,0.78); font-family:Inter,sans-serif; margin:0; }
.cr-card .rtags { display:flex; flex-wrap:wrap; gap:7px; margin-top:12px; }
.cr-card .rtag { font-size:11px; font-weight:700; font-family:Inter,sans-serif; color:rgba(255,255,255,0.82); background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.16); border-radius:100px; padding:4px 11px; }
/* Hiring steps */
.cr-steps { display:grid; grid-template-columns:1fr; gap:14px; margin-top:26px; counter-reset:crstep; }
@media(min-width:760px){ .cr-steps{grid-template-columns:repeat(2,1fr);} }
@media(min-width:1000px){ .cr-steps{grid-template-columns:repeat(4,1fr);} }
.cr-step { position:relative; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.16); border-radius:14px; padding:22px 18px 18px; }
.cr-step .num { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:18px; color:#0E1A33; background:linear-gradient(135deg,#FF7A29,#FFB347); }
.cr-step h4 { font-family:'Montserrat',Inter,sans-serif; font-weight:800; font-size:14.5px; color:#fff; margin:12px 0 6px; }
.cr-step p { font-size:12.5px; line-height:1.6; color:rgba(255,255,255,0.72); font-family:Inter,sans-serif; margin:0; }
`;

type Job = {
  title: string; titleHi: string;
  dept: 'OPERATIONS' | 'TECH' | 'MARKETING' | 'SOCIAL MEDIA';
  type: string; typeHi: string;
  /** Market-aligned monthly salary band (Delhi NCR) */
  salary: string;
  doing: [string, string][];  // what you'll do [en, hi]
  quals: [string, string][];  // what we look for [en, hi]
};

const DEPT_COLOR: Record<Job['dept'], { bg: string; border: string; color: string }> = {
  'OPERATIONS':   { bg: 'rgba(49,197,107,0.14)',  border: 'rgba(49,197,107,0.5)', color: '#6EE7A0' },
  'TECH':         { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(96,165,250,0.5)', color: '#93C5FD' },
  'MARKETING':    { bg: 'rgba(232,178,61,0.14)',  border: 'rgba(232,178,61,0.5)', color: '#FFD873' },
  'SOCIAL MEDIA': { bg: 'rgba(244,114,182,0.14)', border: 'rgba(244,114,182,0.5)', color: '#F9A8D4' },
};

const JOBS: Job[] = [
  {
    title: 'Project Manager', titleHi: 'Project Manager',
    dept: 'OPERATIONS', type: 'Full-time · Delhi NCR', typeHi: 'Full-time · Delhi NCR',
    salary: '₹70,000 – ₹1,00,000 / month',
    doing: [
      ['Run the whole team day-to-day — assign work, set deadlines, remove blockers across tech, marketing and social', 'पूरी team का day-to-day संचालन — काम बाँटना, deadlines तय करना, tech/marketing/social की रुकावटें हटाना'],
      ['Track that every person and campaign is delivering — weekly reviews, clear reports to the founder', 'हर व्यक्ति और campaign की delivery track करना — weekly reviews, founder को साफ़ reports'],
      ['Own the season calendar — registrations, trials, auction, match days — so nothing slips', 'Season का पूरा calendar own करना — registrations, trials, auction, match days — कुछ भी miss न हो'],
      ['Flag hiring needs early — where the team is overloaded and where a new hire pays for itself', 'Hiring की ज़रूरत पहले भाँपना — कहाँ team overloaded है और कहाँ नई hire ज़रूरी है'],
    ],
    quals: [
      ['4+ years managing cross-functional teams or projects (sports/events/startups a plus)', 'Cross-functional teams/projects manage करने का 4+ साल अनुभव (sports/events/startup plus)'],
      ['Strong with planning tools, timelines and written status reporting', 'Planning tools, timelines और written status reporting में मज़बूत'],
      ['Comfortable being the single point of accountability for delivery', 'Delivery की अकेली ज़िम्मेदारी लेने में सहज'],
      ['Hindi + English fluency; calm under match-day pressure', 'Hindi + English दोनों में fluent; match-day pressure में शांत'],
    ],
  },
  {
    title: 'Full-Stack Developer', titleHi: 'Full-Stack Developer',
    dept: 'TECH', type: 'Full-time · Delhi NCR / Hybrid', typeHi: 'Full-time · Delhi NCR / Hybrid',
    salary: '₹60,000 – ₹1,00,000 / month',
    doing: [
      ['Own bcplt20.com end-to-end — registrations, payments, live scoring and the admin panel', 'bcplt20.com की पूरी ज़िम्मेदारी — registrations, payments, live scoring और admin panel'],
      ['Ship features fast during the season and keep the platform stable on match days', 'Season के दौरान तेज़ी से features ship करें और match days पर platform stable रखें'],
      ['Work directly with the founder — your decisions shape the product', 'सीधे founder के साथ काम — आपके decisions product को आकार देंगे'],
    ],
    quals: [
      ['3–5 years experience with React, Node.js and TypeScript', 'React, Node.js और TypeScript में 3–5 साल का अनुभव'],
      ['Strong PostgreSQL and REST API design skills', 'PostgreSQL और REST API design की मज़बूत पकड़'],
      ['Hands-on with AWS (EC2, RDS, S3) and Linux deployment', 'AWS (EC2, RDS, S3) और Linux deployment का hands-on अनुभव'],
      ['Owns features end-to-end — from database to UI', 'Database से UI तक — feature की पूरी ज़िम्मेदारी लेने वाले'],
    ],
  },
  {
    title: 'UI/UX Designer', titleHi: 'UI/UX Designer',
    dept: 'TECH', type: 'Full-time / Contract · Remote friendly', typeHi: 'Full-time / Contract · Remote friendly',
    salary: '₹40,000 – ₹65,000 / month',
    doing: [
      ['Design the fan-facing website, player flows and match-day screens', 'Fan-facing website, player flows और match-day screens design करें'],
      ['Build a consistent BCPL design language across web, social and print', 'Web, social और print पर एक consistent BCPL design language बनाएं'],
    ],
    quals: [
      ['2+ years designing responsive web and mobile interfaces', 'Responsive web/mobile interfaces design का 2+ साल अनुभव'],
      ['Portfolio with real shipped products (Figma proficiency)', 'असली launched products का portfolio (Figma में दक्ष)'],
      ['Understands sports/consumer brand aesthetics', 'Sports/consumer brand की visual समझ'],
    ],
  },
  {
    title: 'Marketing Manager', titleHi: 'Marketing Manager',
    dept: 'MARKETING', type: 'Full-time · Delhi NCR', typeHi: 'Full-time · Delhi NCR',
    salary: '₹50,000 – ₹80,000 / month',
    doing: [
      ['Own the season\u2019s registration targets and the campaigns that hit them', 'Season के registration targets और उन्हें पूरा करने वाले campaigns की ज़िम्मेदारी'],
      ['Run corporate outreach — HR heads, office cricket teams, company sports days', 'Corporate outreach चलाएं — HR heads, office cricket teams, company sports days'],
      ['Coordinate sponsors, agencies and on-ground activations', 'Sponsors, agencies और on-ground activations coordinate करें'],
    ],
    quals: [
      ['4+ years in brand or event marketing (sports a plus)', 'Brand/event marketing में 4+ साल (sports का अनुभव plus)'],
      ['Plans and runs registration-drive campaigns end-to-end', 'Registration-drive campaigns की पूरी planning और execution'],
      ['Comfortable with budgets, agencies and on-ground activations', 'Budget, agencies और on-ground activations संभालने में सक्षम'],
    ],
  },
  {
    title: 'Performance Marketing Executive', titleHi: 'Performance Marketing Executive',
    dept: 'MARKETING', type: 'Full-time · Delhi NCR / Hybrid', typeHi: 'Full-time · Delhi NCR / Hybrid',
    salary: '₹30,000 – ₹50,000 / month',
    doing: [
      ['Run Meta & Google campaigns that bring player registrations at the lowest cost', 'Meta व Google campaigns चलाएं जो सबसे कम cost पर player registrations लाएं'],
      ['Own tracking — pixels, UTMs, GA4 — and report what\u2019s working weekly', 'Tracking की ज़िम्मेदारी — pixels, UTMs, GA4 — और हर हफ़्ते report करें क्या काम कर रहा है'],
    ],
    quals: [
      ['2+ years running Meta & Google ad campaigns', 'Meta और Google ads campaigns चलाने का 2+ साल अनुभव'],
      ['Tracks cost-per-registration and optimises daily', 'Cost-per-registration track कर के रोज़ optimise करने वाले'],
      ['Basic analytics skills (GA4, pixels, UTM discipline)', 'Analytics की समझ (GA4, pixels, UTM)'],
    ],
  },
  {
    title: 'Social Media Manager', titleHi: 'Social Media Manager',
    dept: 'SOCIAL MEDIA', type: 'Full-time · Delhi NCR / Hybrid', typeHi: 'Full-time · Delhi NCR / Hybrid',
    salary: '₹30,000 – ₹50,000 / month',
    doing: [
      ['Run BCPL\u2019s Instagram, YouTube and X — calendar, posting, community', 'BCPL के Instagram, YouTube और X चलाएं — calendar, posting, community'],
      ['Cover match days live — scores, moments, player stories', 'Match days को live cover करें — scores, moments, player stories'],
      ['Grow follower count and engagement season on season', 'हर season followers और engagement बढ़ाएं'],
    ],
    quals: [
      ['2+ years managing Instagram, YouTube and X for a brand', 'किसी brand के Instagram, YouTube, X संभालने का 2+ साल अनुभव'],
      ['Plans content calendars and engages the community daily', 'Content calendar planning और daily community engagement'],
      ['Cricket/sports content sense — match days, reels, trends', 'Cricket/sports content की समझ — match days, reels, trends'],
    ],
  },
  {
    title: 'Video Editor & Graphic Designer', titleHi: 'Video Editor & Graphic Designer',
    dept: 'SOCIAL MEDIA', type: 'Full-time · Delhi NCR', typeHi: 'Full-time · Delhi NCR',
    salary: '₹25,000 – ₹45,000 / month',
    doing: [
      ['Cut match highlights, reels and player features within hours of play', 'खेल के कुछ ही घंटों में match highlights, reels और player features तैयार करें'],
      ['Design posters, creatives and sponsor deliverables for every fixture', 'हर fixture के posters, creatives और sponsor deliverables design करें'],
    ],
    quals: [
      ['2+ years editing short-form video (reels, highlights)', 'Short-form video editing (reels, highlights) का 2+ साल अनुभव'],
      ['Strong graphic design for posts, posters and creatives', 'Posts, posters, creatives के लिए मज़बूत graphic design'],
      ['Premiere Pro / After Effects / Photoshop or equivalent', 'Premiere Pro / After Effects / Photoshop या समकक्ष tools'],
    ],
  },
];

export default function Careers() {
  const { t } = useLang();
  const depts: { key: Job['dept']; en: string; hi: string; blurb: string; blurbHi: string }[] = [
    { key: 'OPERATIONS', en: 'Operations & Management', hi: 'Operations & Management', blurb: 'Keep the whole league machine running on time — people, plans and delivery.', blurbHi: 'पूरी league की machine को समय पर चलाइए — लोग, plans और delivery।' },
    { key: 'TECH', en: 'Technology', hi: 'Technology', blurb: 'Build and run the platform behind every registration, payment and live score.', blurbHi: 'हर registration, payment और live score के पीछे का platform बनाएँ और चलाएँ।' },
    { key: 'MARKETING', en: 'Marketing', hi: 'Marketing', blurb: 'Take BCPL to every corporate cricketer in India.', blurbHi: 'BCPL को भारत के हर corporate cricketer तक पहुँचाएँ।' },
    { key: 'SOCIAL MEDIA', en: 'Social Media', hi: 'Social Media', blurb: 'Tell the league\u2019s story every single day.', blurbHi: 'League की कहानी हर दिन दुनिया को दिखाएँ।' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#1C2B47', color: '#fff' }}>
      <style>{CSS}</style>
      <SiteHeader active="About" />

      {/* Hero */}
      <section style={{ padding: 'calc(var(--sh-h, 68px) + clamp(40px,6vw,72px)) 0 clamp(36px,5vw,56px)', background: 'linear-gradient(180deg,#16233F,#1C2B47)', textAlign: 'center' }}>
        <div className="wrap">
          <div className="v3-kicker" style={{ marginBottom: 14 }}>{t('JOBS @ BCPL', 'JOBS @ BCPL')}</div>
          <h1 className="v3-h" style={{ fontSize: 'clamp(44px,8vw,84px)', color: '#fff' }}>
            {t('BUILD THE LEAGUE', 'LEAGUE बनाइए')} <span className="shimmer-gold">{t('WITH US.', 'हमारे साथ.')}</span>
          </h1>
          <p style={{ maxWidth: 620, margin: '18px auto 0', fontSize: 15.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter,sans-serif' }}>
            {t('The Bhartiya Corporate Premier League is setting up its first in-house team across technology, marketing and social media. Small team, big ownership, real impact.',
               'Bhartiya Corporate Premier League अपनी पहली in-house team बना रही है — technology, marketing और social media। छोटी team, बड़ी ज़िम्मेदारी, असली impact।')}
          </p>
          <a className="apply-btn" style={{ marginTop: 26 }} href={`mailto:${APPLY_EMAIL}?subject=Job Application — BCPL`}>
            {t('APPLY NOW', 'अभी APPLY करें')} · {APPLY_EMAIL}
          </a>

          {/* League in numbers — why this is a place worth joining */}
          <div className="cr-stats">
            {[
              ['4', t('Seasons completed', 'Seasons पूरे')],
              ['48+', t('Trial cities', 'Trial शहर')],
              ['2.4 lakh+', t('Working professionals reached', 'Working professionals तक पहुँच')],
              ['10', t('Franchise teams', 'Franchise teams')],
              ['385+', t('Players auctioned', 'Players auction हुए')],
              ['Season 5', t('Now building the in-house team', 'अब in-house team बन रही है')],
            ].map(([b, s]) => (
              <div key={String(s)} className="cr-stat"><b>{b}</b><span>{s}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* Why work at BCPL */}
      <section style={{ padding: 'clamp(24px,4vw,40px) 0 clamp(30px,4vw,44px)' }}>
        <div className="wrap">
          <div style={{ marginBottom: 8 }}>
            <div className="cr-sec-kick">{t('Why work here', 'यहाँ क्यों काम करें')}</div>
            <h2 className="cr-sec-h">{t('A GROWING LEAGUE, REAL OWNERSHIP', 'बढ़ती हुई league, असली ownership')}</h2>
            <p className="cr-sec-sub">
              {t('BCPL is a corporate T20 cricket league built for India\u2019s working professionals — across 48+ trial cities and a community of 2.4 lakh+ people. You join early, own your area and see your work on the ground the same season.',
                 'BCPL working professionals के लिए बनी एक corporate T20 cricket league है — 48+ trial शहरों और 2.4 लाख+ लोगों की community के साथ। आप जल्दी जुड़ते हैं, अपना area own करते हैं और अपना काम उसी season मैदान पर देखते हैं।')}
            </p>
          </div>
          <div className="perk-grid" style={{ marginTop: 22 }}>
            {[
              ['🏏', 'Work in sport, for real', 'खेल में असली काम', 'Match days, players, live scores — your work shows up on the ground and on screen the same week.', 'Match days, players, live scores — आपका काम उसी हफ़्ते मैदान और screen पर दिखता है।'],
              ['🚀', 'Day-one ownership', 'पहले दिन से ownership', 'You are the first hires. No layers, no hand-offs — you own your area and build it your way.', 'आप पहली hires हैं। कोई layers नहीं — अपना area खुद own कीजिए, अपने तरीके से बनाइए।'],
              ['📈', 'Grow with the league', 'League के साथ आगे बढ़िए', 'As BCPL grows across seasons and cities, the people who built it lead the teams that follow.', 'जैसे BCPL seasons और शहरों में बढ़ेगी, जिन्होंने इसे बनाया वही आगे teams lead करेंगे।'],
            ].map(([ic, en, hi, pEn, pHi]) => (
              <div key={en} className="perk">
                <span className="ic">{ic}</span>
                <h4>{t(en, hi)}</h4>
                <p>{t(pEn, pHi)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture & Values */}
      <section style={{ padding: 'clamp(20px,3vw,32px) 0' }}>
        <div className="wrap">
          <div className="cr-sec-kick">{t('Culture & values', 'Culture और values')}</div>
          <h2 className="cr-sec-h">{t('HOW WE WORK', 'हम कैसे काम करते हैं')}</h2>
          <div className="cr-cards three">
            {[
              ['🎯', 'Ownership over titles', 'Title से ज़्यादा ownership', 'You run your area end to end. Fewer approvals, faster decisions, clear accountability.', 'आप अपना area पूरी तरह चलाते हैं। कम approvals, तेज़ decisions, साफ़ ज़िम्मेदारी।'],
              ['⚡', 'Ship in season time', 'Season की रफ़्तार में काम', 'Match days set the pace. We plan carefully and move quickly when it matters.', 'Match days rफ़्तार तय करते हैं। हम सोच-समझकर plan करते हैं और ज़रूरत पर तेज़ चलते हैं।'],
              ['🤝', 'Small team, straight talk', 'छोटी team, सीधी बात', 'Direct access to the founder, honest feedback and credit where it is due.', 'Founder तक सीधी पहुँच, ईमानदार feedback और सही श्रेय।'],
              ['🌱', 'Learn on real problems', 'असली problems पर सीखें', 'You build a live product used by thousands — not slides. Growth comes from doing.', 'आप हज़ारों लोगों द्वारा इस्तेमाल होने वाला live product बनाते हैं — slides नहीं। सीख काम से आती है।'],
              ['🇮🇳', 'Built in India, for India', 'भारत में, भारत के लिए', 'A bilingual, city-first product for working professionals across the country.', 'देश भर के working professionals के लिए एक bilingual, city-first product।'],
              ['📊', 'Numbers we can see', 'ऐसे numbers जो दिखें', 'Registrations, engagement, delivery — we track what matters and share it openly.', 'Registrations, engagement, delivery — हम ज़रूरी चीज़ें track करते हैं और खुलकर साझा करते हैं।'],
            ].map(([ic, en, hi, pEn, pHi]) => (
              <div key={en} className="cr-card">
                <div className="cic">{ic}</div>
                <h4>{t(en, hi)}</h4>
                <p>{t(pEn, pHi)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where you can work — role areas */}
      <section style={{ padding: 'clamp(20px,3vw,32px) 0' }}>
        <div className="wrap">
          <div className="cr-sec-kick">{t('Where you fit', 'आप कहाँ fit होते हैं')}</div>
          <h2 className="cr-sec-h">{t('ROLE AREAS ACROSS THE LEAGUE', 'League के अलग-अलग role areas')}</h2>
          <p className="cr-sec-sub">{t('From the platform to the pitch — here is where people build BCPL.', 'Platform से लेकर pitch तक — लोग यहाँ BCPL बनाते हैं।')}</p>
          <div className="cr-cards three">
            {[
              ['⚙️', 'Operations', 'Operations', 'Season calendar, registrations, trials, auction and match-day delivery.', 'Season calendar, registrations, trials, auction और match-day delivery।', ['Planning', 'Delivery', 'Match days']],
              ['📣', 'Marketing', 'Marketing', 'Registration campaigns, corporate outreach and on-ground activations.', 'Registration campaigns, corporate outreach और on-ground activations।', ['Campaigns', 'Corporate', 'Performance']],
              ['💻', 'Technology', 'Technology', 'The website, app, payments, live scoring and the admin platform.', 'Website, app, payments, live scoring और admin platform।', ['React', 'Node', 'Design']],
              ['🎬', 'Content', 'Content', 'Highlights, reels, posters and the day-to-day story of the league.', 'Highlights, reels, posters और league की रोज़ की कहानी।', ['Video', 'Social', 'Graphics']],
              ['🥅', 'Ground staff', 'Ground staff', 'Trial-day and match-day ground operations, kit and logistics.', 'Trial-day व match-day की ground operations, kit और logistics।', ['On-ground', 'Kit', 'Logistics']],
              ['📍', 'City coordinators', 'City coordinators', 'Local point of contact across trial cities — venues, players and turnout.', 'Trial शहरों में local संपर्क — venues, players और turnout।', ['48+ cities', 'Local', 'Community']],
            ].map(([ic, en, hi, pEn, pHi, tags]) => (
              <div key={en as string} className="cr-card">
                <div className="cic">{ic as string}</div>
                <h4>{t(en as string, hi as string)}</h4>
                <p>{t(pEn as string, pHi as string)}</p>
                <div className="rtags">
                  {(tags as string[]).map(tg => <span key={tg} className="rtag">{tg}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Growth & Learning + Perks */}
      <section style={{ padding: 'clamp(20px,3vw,32px) 0' }}>
        <div className="wrap">
          <div className="cr-sec-kick">{t('Growth & benefits', 'Growth और फ़ायदे')}</div>
          <h2 className="cr-sec-h">{t('GROW WITH THE LEAGUE', 'League के साथ आगे बढ़ें')}</h2>
          <div className="cr-cards three">
            {[
              ['📈', 'Learn by building', 'बनाते हुए सीखें', 'Take on real responsibility early and pick up skills across the season.', 'जल्दी असली ज़िम्मेदारी लें और पूरे season नई skills सीखें।'],
              ['🧭', 'Mentorship & direct access', 'Mentorship और सीधी पहुँच', 'Work closely with the founder and experienced hires — feedback that helps you improve.', 'Founder और अनुभवी hires के साथ करीब से काम — ऐसा feedback जो आपको बेहतर बनाए।'],
              ['🚀', 'Room to lead', 'Lead करने का मौका', 'As the league grows across seasons and cities, early team members can step into leadership.', 'जैसे league seasons और शहरों में बढ़ेगी, शुरुआती team के लोग leadership में जा सकते हैं।'],
              ['💰', 'Market-aligned pay', 'Market के अनुसार pay', 'Salary bands set by role and experience, reviewed as you grow.', 'Role और experience के अनुसार salary bands, growth के साथ review।'],
              ['🗓️', 'Flexible where the role allows', 'जहाँ role की इजाज़त हो, flexibility', 'Several roles are hybrid or remote-friendly; on-ground roles are in the field.', 'कई roles hybrid या remote-friendly हैं; on-ground roles मैदान पर होते हैं।'],
              ['🏏', 'Match-day energy', 'Match-day की energy', 'Be part of live events, players and the atmosphere of a cricket season.', 'Live events, players और cricket season के माहौल का हिस्सा बनें।'],
            ].map(([ic, en, hi, pEn, pHi]) => (
              <div key={en} className="cr-card">
                <div className="cic">{ic}</div>
                <h4>{t(en, hi)}</h4>
                <p>{t(pEn, pHi)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring process */}
      <section style={{ padding: 'clamp(20px,3vw,32px) 0' }}>
        <div className="wrap">
          <div className="cr-sec-kick">{t('Hiring process', 'Hiring process')}</div>
          <h2 className="cr-sec-h">{t('HOW HIRING WORKS', 'Hiring कैसे होती है')}</h2>
          <div className="cr-steps">
            {[
              ['Apply', 'Apply करें', 'Email your resume (and portfolio, if any) with the role in the subject line.', 'Resume (और portfolio, अगर हो) email करें — subject में role लिखें।'],
              ['Screening', 'Screening', 'We review applications and reach out to shortlisted candidates.', 'हम applications देखते हैं और shortlist हुए candidates से संपर्क करते हैं।'],
              ['Conversation', 'बातचीत', 'A call or two about your experience, the role and how you work.', 'आपके experience, role और काम के तरीके पर एक-दो calls।'],
              ['Offer & onboarding', 'Offer और onboarding', 'A clear offer, then a hands-on start on real work from week one.', 'साफ़ offer, फिर पहले हफ़्ते से असली काम पर hands-on शुरुआत।'],
            ].map(([en, hi, pEn, pHi], i) => (
              <div key={en} className="cr-step">
                <div className="num">{i + 1}</div>
                <h4>{t(en, hi)}</h4>
                <p>{t(pEn, pHi)}</p>
              </div>
            ))}
          </div>
          <p className="cr-sec-sub" style={{ marginTop: 16 }}>
            {t('Shortlisted candidates typically hear from us within 10 working days.', 'Shortlist हुए candidates को आम तौर पर 10 working days में जवाब मिलता है।')}
          </p>
        </div>
      </section>

      {/* Departments */}
      <section style={{ padding: '0 0 clamp(60px,8vw,100px)' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(36px,5vw,54px)' }}>
          {depts.map(d => (
            <div key={d.key}>
              <h2 className="dept-head">{t(d.en, d.hi)}</h2>
              <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter,sans-serif', margin: '0 0 18px' }}>{t(d.blurb, d.blurbHi)}</p>
              <div className="careers-grid">
                {JOBS.filter(j => j.dept === d.key).map(j => {
                  const c = DEPT_COLOR[j.dept];
                  return (
                    <div key={j.title} className="job-card">
                      <span className="job-dept" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>{j.dept}</span>
                      <h3 className="job-title">{t(j.title, j.titleHi)}</h3>
                      <div className="job-meta">{t(j.type, j.typeHi)}</div>
                      <div className="job-salary">💰 {j.salary} <span className="job-salary-note">{t('(based on experience — market-aligned)', '(experience के अनुसार — market rate)')}</span></div>
                      <div className="job-sub">{t('What you\u2019ll do', 'आप क्या करेंगे')}</div>
                      <div>
                        {j.doing.map(([en, hi]) => <div key={en} className="job-li do">{t(en, hi)}</div>)}
                      </div>
                      <div className="job-sub">{t('What we look for', 'हम क्या देखते हैं')}</div>
                      <div style={{ marginBottom: 18 }}>
                        {j.quals.map(([en, hi]) => <div key={en} className="job-li">{t(en, hi)}</div>)}
                      </div>
                      <a className="apply-btn" href={`mailto:${APPLY_EMAIL}?subject=Application: ${encodeURIComponent(j.title)}`}>
                        {t('APPLY', 'APPLY करें')} →
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* How to apply */}
          <div className="job-card" style={{ textAlign: 'center' }}>
            <h3 className="job-title" style={{ marginTop: 0 }}>{t('How to apply', 'Apply कैसे करें')}</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter,sans-serif', maxWidth: 640, margin: '0 auto 16px' }}>
              {t(`Email your resume (and portfolio, if applicable) to ${APPLY_EMAIL} with the role name in the subject line. Shortlisted candidates will hear from us within 10 working days.`,
                 `अपना resume (और portfolio, अगर हो) ${APPLY_EMAIL} पर भेजें — subject में role का नाम लिखें। Shortlist हुए candidates को 10 working days में जवाब मिलेगा।`)}
            </p>
            <a className="apply-btn" href={`mailto:${APPLY_EMAIL}?subject=Job Application — BCPL`}>{APPLY_EMAIL}</a>
          </div>
        </div>
      </section>

      <BCPLFooter />
    </div>
  );
}
