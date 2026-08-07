import React, { useEffect, useState } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { NEWS_ARTICLES } from '../data/newsArticles';
import { getNews, type ApiNewsArticle } from '../lib/api';

const BASE = import.meta.env.BASE_URL;
const IMG = BASE + 'bcpl-assets/news/';

const CSS = `
*, *::before, *::after { box-sizing:border-box; }
body { background:#1C2B47; }
.wrap { max-width:1080px; margin:0 auto; padding:0 20px; }
@media(min-width:768px){ .wrap{padding:0 32px} }
.v3-kicker { font-family:Inter,sans-serif; font-weight:700; font-size:12px; letter-spacing:.22em; color:#E8B23D; text-transform:uppercase; }
.v3-h { font-family:'Barlow Condensed','Mukta','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; line-height:.95; letter-spacing:.015em; }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:newsShimmer 3s linear infinite; }
@keyframes newsShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
.news-card { background:linear-gradient(135deg,rgba(30,55,105,0.92),rgba(23,43,81,0.88)); border:1px solid rgba(255,255,255,0.18); border-radius:20px; overflow:hidden; box-shadow:0 18px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12); }
.news-hero-img { width:100%; display:block; aspect-ratio:16/9; object-fit:cover; background:#16233F; }
.news-tag { display:inline-flex; align-items:center; background:linear-gradient(90deg,#FF7A29,#FF9350); border-radius:100px; padding:4px 14px; font-size:10.5px; font-weight:900; font-family:'Montserrat',Inter,sans-serif; color:#fff; letter-spacing:.12em; text-transform:uppercase; }
.news-date { font-size:12.5px; font-weight:700; color:rgba(255,255,255,0.6); font-family:Inter,sans-serif; letter-spacing:.04em; }
.news-title { font-family:'Montserrat',Inter,sans-serif; font-weight:800; font-size:clamp(19px,3vw,26px); color:#fff; line-height:1.25; margin:10px 0 14px; }
.news-p { font-size:15px; line-height:1.75; color:rgba(255,255,255,0.82); font-family:Inter,sans-serif; margin-bottom:14px; }
.press-chip { display:inline-flex; align-items:center; gap:6px; background:rgba(232,178,61,0.10); border:1px solid rgba(232,178,61,0.4); border-radius:100px; padding:7px 16px; font-size:12.5px; font-weight:700; font-family:Inter,sans-serif; color:#FFD873; text-decoration:none; transition:background .2s, transform .2s; }
.press-chip:hover { background:rgba(232,178,61,0.22); transform:translateY(-1px); }
`;

/** Unified article shape: admin-published (API) articles + static archive. */
type DisplayArticle = {
  slug: string; tag: string; title: string; titleHi: string;
  date: string; imageSrc: string;
  paragraphs: string[]; paragraphsHi?: string[];
  press: Array<{ label: string; url: string }>;
};

function fmtNewsDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return ''; }
}

export default function News() {
  const { t, lang } = useLang();
  const [apiArticles, setApiArticles] = useState<ApiNewsArticle[]>([]);

  // Admin-published articles load on top of the static archive; if the API
  // hiccups the archive still renders (no error state needed).
  useEffect(() => {
    getNews().then(r => setApiArticles(r.articles)).catch(() => {});
  }, []);

  const articles: DisplayArticle[] = [
    ...apiArticles.map(a => ({
      slug: a.slug, tag: a.tag, title: a.title, titleHi: a.titleHi || a.title,
      date: fmtNewsDate(a.publishedAt),
      imageSrc: a.image ? (a.image.startsWith('http') ? a.image : IMG + a.image) : '',
      paragraphs: a.paragraphs, paragraphsHi: a.paragraphsHi,
      press: a.press,
    })),
    ...NEWS_ARTICLES.filter(s => !apiArticles.some(a => a.slug === s.slug)).map(s => ({
      slug: s.slug, tag: s.tag, title: s.title, titleHi: s.titleHi,
      date: s.date, imageSrc: IMG + s.image,
      paragraphs: s.paragraphs, paragraphsHi: undefined as string[] | undefined,
      press: s.press,
    })),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#1C2B47', color: '#fff' }}>
      <style>{CSS}</style>
      <SiteHeader active="Media" />

      {/* Hero */}
      <section style={{ padding: 'calc(var(--sh-h, 68px) + clamp(40px,6vw,72px)) 0 clamp(36px,5vw,56px)', background: 'linear-gradient(180deg,#16233F,#1C2B47)', textAlign: 'center' }}>
        <div className="wrap">
          <div className="v3-kicker" style={{ marginBottom: 14 }}>{t('BCPL NEWSROOM', 'BCPL न्यूज़रूम')}</div>
          <h1 className="v3-h" style={{ fontSize: 'clamp(44px,8vw,84px)', color: '#fff' }}>
            {t('LATEST', 'ताज़ा')} <span className="shimmer-gold">{t('NEWS.', 'ख़बरें.')}</span>
          </h1>
          <p style={{ maxWidth: 560, margin: '18px auto 0', fontSize: 15.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter,sans-serif' }}>
            {t('Announcements, auction stories and press coverage from the Bhartiya Corporate Premier League.',
               'Bhartiya Corporate Premier League की घोषणाएँ, auction की कहानियाँ और press coverage।')}
          </p>
        </div>
      </section>

      {/* Articles */}
      <section style={{ padding: '10px 0 clamp(60px,8vw,100px)' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(28px,4vw,44px)' }}>
          {articles.map(a => (
            <article key={a.slug} className="news-card">
              {a.imageSrc ? <img className="news-hero-img" src={a.imageSrc} alt={a.title} loading="lazy" decoding="async" /> : null}
              <div style={{ padding: 'clamp(18px,3.5vw,32px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span className="news-tag">{a.tag}</span>
                  {a.date ? <span className="news-date">{a.date}</span> : null}
                </div>
                <h2 className="news-title">{t(a.title, a.titleHi)}</h2>
                {(lang === 'hi' && a.paragraphsHi && a.paragraphsHi.length ? a.paragraphsHi : a.paragraphs).map((p, i) => <p key={i} className="news-p">{p}</p>)}

                {a.press.length > 0 && (
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.14em', color: 'rgba(255,255,255,0.55)', fontFamily: "'Montserrat',Inter,sans-serif", textTransform: 'uppercase', marginBottom: 10 }}>
                      {t('AS COVERED BY', 'इन्होंने कवर किया')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {a.press.map(p => (
                        <a key={p.url} className="press-chip" href={p.url} target="_blank" rel="noopener noreferrer">
                          {p.label} <span aria-hidden style={{ fontSize: 11, opacity: 0.8 }}>↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <StickyRegisterCTA />
      <BCPLFooter />
    </div>
  );
}
