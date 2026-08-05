import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../../components/BCPLFooter';
import { SiteHeader } from '../../components/SiteHeader';
import { StickyRegisterCTA } from '../../components/StickyRegisterCTA';
import type { LandingFaq } from './landingData';

/**
 * Shared shell for the SEO keyword landing pages
 * (/corporate-cricket, /corporate-cricket-tournament-delhi, /how-to-join,
 * /office-cricket-team). Uses the V3 lightened dark-navy design language
 * (bg #1B2E52/#24396B, text >= .88 white, orange/gold accents) so these
 * marketing pages sit visually alongside About / Eligibility.
 *
 * All internal links use wouter <Link> so the app base path is respected.
 */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#1C2B47; }
.lp-wrap { max-width:900px; margin:0 auto; padding:0 20px; }
@media(min-width:768px){ .lp-wrap{padding:0 32px} }
.lp-h1 { font-family:'Barlow Condensed','Mukta','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; line-height:1.02; letter-spacing:.015em; color:#fff; font-size:clamp(30px,6vw,58px); }
.lp-h2 { font-family:'Barlow Condensed','Mukta','Montserrat',sans-serif; font-weight:800; font-size:clamp(22px,3.2vw,32px); color:#fff; letter-spacing:.01em; }
.lp-kicker { font-family:Inter,sans-serif; font-weight:700; font-size:12px; letter-spacing:.22em; color:#E8B23D; text-transform:uppercase; }
.lp-p { color:rgba(255,255,255,0.88); font-size:clamp(14px,2vw,16px); line-height:1.8; margin-bottom:16px; }
.lp-crumb { color:rgba(255,255,255,0.72); font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
.lp-crumb:hover { color:#FF7A29; }
.btn-fire { background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%); border:none; border-radius:14px; color:#fff; font-family:'Barlow Condensed','Mukta',sans-serif; font-weight:800; cursor:pointer; box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2); transition:transform 0.15s,box-shadow 0.2s; letter-spacing:0.04em; text-transform:uppercase; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; min-height:44px; }
.btn-fire:hover { transform:translateY(-2px); box-shadow:0 14px 40px rgba(255,122,41,0.6); }
.btn-ghost { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.22); border-radius:14px; color:rgba(255,255,255,0.92); font-family:'Barlow Condensed','Mukta',sans-serif; font-weight:700; letter-spacing:.03em; text-transform:uppercase; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:12px 22px; transition:border-color .2s,background .2s; }
.btn-ghost:hover { border-color:#FF7A29; background:rgba(255,122,41,0.1); }
.glass-card { background:linear-gradient(135deg,rgba(30,55,105,0.9),rgba(23,43,81,0.85)); backdrop-filter:blur(32px); border:1px solid rgba(255,255,255,0.18); border-radius:20px; box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.18); }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
.tag-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,122,41,0.12); border:1px solid rgba(255,122,41,0.3); border-radius:100px; padding:5px 14px; font-size:11px; font-weight:700; font-family:'Barlow Condensed','Mukta',sans-serif; color:#FF7A29; letter-spacing:0.12em; text-transform:uppercase; }
.lp-fire-num { font-family:'Barlow Condensed','Mukta',sans-serif; font-weight:900; font-size:30px; color:#FF7A29; line-height:1; }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes fadeSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulseGlow { 0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)} 50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)} }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
`;

function AmbientBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)' }} />
    </div>
  );
}

export interface LandingSection {
  h2: string;
  body: React.ReactNode;
}

interface LandingLayoutProps {
  active?: string;
  kicker: string;
  h1: React.ReactNode;
  intro: React.ReactNode;
  sections: LandingSection[];
  faqs: LandingFaq[];
  faqHeading: string;
  finalCtaTitle: React.ReactNode;
  finalCtaSub: string;
  children?: React.ReactNode; // optional extra block rendered before the FAQ
}

export function LandingLayout(props: LandingLayoutProps) {
  const {
    kicker, h1, intro, sections, faqs, faqHeading,
    finalCtaTitle, finalCtaSub, children,
  } = props;

  return (
    <div style={{ minHeight: '100vh', background: '#1C2B47', fontFamily: 'Inter,sans-serif', color: '#F8F4EE', position: 'relative', paddingBottom: 80, overflowX: 'hidden' }}>
      <style>{CSS}</style>
      <AmbientBg />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <SiteHeader />

        {/* Breadcrumb */}
        <div className="lp-wrap" style={{ paddingTop: 'clamp(78px,10vh,110px)', paddingBottom: 8 }}>
          <Link href="/" className="lp-crumb">← Home</Link>
        </div>

        {/* HERO */}
        <section style={{ padding: '8px 0 32px', animation: 'fadeSlide 0.6s ease both' }}>
          <div className="lp-wrap">
            <div className="lp-kicker" style={{ marginBottom: 14 }}>{kicker}</div>
            <h1 className="lp-h1" style={{ marginBottom: 18 }}>{h1}</h1>
            <div style={{ maxWidth: 760 }}>{intro}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 26 }}>
              <Link href="/register" className="btn-fire" style={{ padding: '14px 30px', fontSize: 16 }}>Register Now →</Link>
              <Link href="/eligibility" className="btn-ghost">Check Eligibility</Link>
            </div>
          </div>
        </section>

        {/* SECTIONS */}
        {sections.map((s, i) => (
          <section key={i} style={{ padding: '0 0 clamp(28px,4vw,44px)' }}>
            <div className="lp-wrap">
              <h2 className="lp-h2" style={{ marginBottom: 14 }}>{s.h2}</h2>
              <div>{s.body}</div>
            </div>
          </section>
        ))}

        {children}

        {/* FAQ */}
        <section style={{ padding: '8px 0 clamp(32px,5vw,56px)' }}>
          <div className="lp-wrap">
            <div className="tag-pill" style={{ marginBottom: 16 }}>FAQ</div>
            <h2 className="lp-h2" style={{ marginBottom: 22 }}>{faqHeading}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {faqs.map((f, i) => (
                <div key={i} className="glass-card" style={{ padding: 'clamp(18px,3vw,24px)' }}>
                  <h3 style={{ fontFamily: "'Barlow Condensed','Mukta',sans-serif", fontWeight: 800, fontSize: 'clamp(16px,2.4vw,19px)', color: '#E8B23D', marginBottom: 8, lineHeight: 1.3 }}>{f.q}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 'clamp(13px,2vw,15px)', lineHeight: 1.75 }}>{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={{ padding: '0 0 clamp(60px,8vw,110px)', textAlign: 'center' }}>
          <div className="lp-wrap">
            <div className="glass-card" style={{ padding: 'clamp(28px,5vw,48px) clamp(20px,4vw,44px)', border: '1px solid rgba(232,178,61,0.28)' }}>
              <h2 className="lp-h2" style={{ marginBottom: 12 }}>{finalCtaTitle}</h2>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, marginBottom: 26, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>{finalCtaSub}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                <Link href="/register" className="btn-fire" style={{ padding: '16px 40px', fontSize: 17, animation: 'pulseGlow 3s ease-in-out infinite' }}>Register Now →</Link>
                <Link href="/faq" className="btn-ghost">Read the full FAQ</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <BCPLFooter />
      <StickyRegisterCTA />
    </div>
  );
}

/** Small reusable helper for a bullet list within a section body. */
export function LpBullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: 'rgba(255,255,255,0.88)', fontSize: 'clamp(13px,2vw,15px)', lineHeight: 1.75 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#FF7A29', flexShrink: 0, marginTop: 8 }} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
