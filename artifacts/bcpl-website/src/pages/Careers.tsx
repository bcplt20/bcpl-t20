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
.job-li { font-size:14px; line-height:1.7; color:rgba(255,255,255,0.82); font-family:Inter,sans-serif; padding-left:18px; position:relative; margin-bottom:6px; }
.job-li::before { content:''; position:absolute; left:2px; top:9px; width:6px; height:6px; border-radius:50%; background:#FF7A29; }
.apply-btn { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#FF7A29,#D95E10); border-radius:10px; padding:11px 22px; font-family:'Montserrat',Inter,sans-serif; font-weight:900; font-size:12px; letter-spacing:.08em; color:#fff; text-transform:uppercase; text-decoration:none; box-shadow:0 8px 26px rgba(255,122,41,0.35); transition:transform .15s, opacity .2s; }
.apply-btn:hover { transform:translateY(-2px); opacity:.92; }
.dept-head { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(22px,3.4vw,30px); color:#fff; text-transform:uppercase; letter-spacing:.03em; margin:0 0 4px; }
.careers-grid { display:grid; grid-template-columns:1fr; gap:18px; }
@media(min-width:820px){ .careers-grid{grid-template-columns:1fr 1fr;} }
`;

type Job = {
  title: string; titleHi: string;
  dept: 'TECH' | 'MARKETING' | 'SOCIAL MEDIA';
  type: string; typeHi: string;
  quals: [string, string][]; // [en, hi]
};

const DEPT_COLOR: Record<Job['dept'], { bg: string; border: string; color: string }> = {
  'TECH':         { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(96,165,250,0.5)', color: '#93C5FD' },
  'MARKETING':    { bg: 'rgba(232,178,61,0.14)',  border: 'rgba(232,178,61,0.5)', color: '#FFD873' },
  'SOCIAL MEDIA': { bg: 'rgba(244,114,182,0.14)', border: 'rgba(244,114,182,0.5)', color: '#F9A8D4' },
};

const JOBS: Job[] = [
  {
    title: 'Full-Stack Developer', titleHi: 'Full-Stack Developer',
    dept: 'TECH', type: 'Full-time · Delhi NCR / Hybrid', typeHi: 'Full-time · Delhi NCR / Hybrid',
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
    quals: [
      ['2+ years designing responsive web and mobile interfaces', 'Responsive web/mobile interfaces design का 2+ साल अनुभव'],
      ['Portfolio with real shipped products (Figma proficiency)', 'असली launched products का portfolio (Figma में दक्ष)'],
      ['Understands sports/consumer brand aesthetics', 'Sports/consumer brand की visual समझ'],
    ],
  },
  {
    title: 'Marketing Manager', titleHi: 'Marketing Manager',
    dept: 'MARKETING', type: 'Full-time · Delhi NCR', typeHi: 'Full-time · Delhi NCR',
    quals: [
      ['4+ years in brand or event marketing (sports a plus)', 'Brand/event marketing में 4+ साल (sports का अनुभव plus)'],
      ['Plans and runs registration-drive campaigns end-to-end', 'Registration-drive campaigns की पूरी planning और execution'],
      ['Comfortable with budgets, agencies and on-ground activations', 'Budget, agencies और on-ground activations संभालने में सक्षम'],
    ],
  },
  {
    title: 'Performance Marketing Executive', titleHi: 'Performance Marketing Executive',
    dept: 'MARKETING', type: 'Full-time · Delhi NCR / Hybrid', typeHi: 'Full-time · Delhi NCR / Hybrid',
    quals: [
      ['2+ years running Meta & Google ad campaigns', 'Meta और Google ads campaigns चलाने का 2+ साल अनुभव'],
      ['Tracks cost-per-registration and optimises daily', 'Cost-per-registration track कर के रोज़ optimise करने वाले'],
      ['Basic analytics skills (GA4, pixels, UTM discipline)', 'Analytics की समझ (GA4, pixels, UTM)'],
    ],
  },
  {
    title: 'Social Media Manager', titleHi: 'Social Media Manager',
    dept: 'SOCIAL MEDIA', type: 'Full-time · Delhi NCR / Hybrid', typeHi: 'Full-time · Delhi NCR / Hybrid',
    quals: [
      ['2+ years managing Instagram, YouTube and X for a brand', 'किसी brand के Instagram, YouTube, X संभालने का 2+ साल अनुभव'],
      ['Plans content calendars and engages the community daily', 'Content calendar planning और daily community engagement'],
      ['Cricket/sports content sense — match days, reels, trends', 'Cricket/sports content की समझ — match days, reels, trends'],
    ],
  },
  {
    title: 'Video Editor & Graphic Designer', titleHi: 'Video Editor & Graphic Designer',
    dept: 'SOCIAL MEDIA', type: 'Full-time · Delhi NCR', typeHi: 'Full-time · Delhi NCR',
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
        </div>
      </section>

      {/* Departments */}
      <section style={{ padding: '14px 0 clamp(60px,8vw,100px)' }}>
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
                      <div style={{ margin: '14px 0 18px' }}>
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
