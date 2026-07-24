import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useAuthUser } from '../components/NavUser';
import { useLang } from '../lib/i18n';
import { AUCTION_PHOTOS } from '../data/auctionGallery';

/**
 * Auction page — honest information about the BCPL player auction.
 * No simulated/live bidding is shown here: the Season 5 auction happens in
 * August 2027, after Phase 1 and physical trials. Until then this page
 * explains the format and shows real photos from the last auction floor.
 */

const STEPS = [
  {
    n: '01',
    en: 'Register & upload your video', hi: 'Register करें और video upload करें',
    dEn: 'Pick your role, register for Phase 1 and upload a 30–60 second cricket clip from any ground.',
    dHi: 'अपना role चुनें, Phase 1 के लिए register करें और किसी भी मैदान से 30–60 second की cricket clip upload करें।',
    color: '#FF7A29',
  },
  {
    n: '02',
    en: 'Phase 1 result', hi: 'Phase 1 का result',
    dEn: 'Your video is evaluated against BCPL\u2019s Phase 1 assessment criteria. Result within 48 hours of review.',
    dHi: 'आपका video BCPL के Phase 1 assessment criteria पर evaluate होता है। Review के 48 घंटे में result।',
    color: '#E8B23D',
  },
  {
    n: '03',
    en: 'Physical trials', hi: 'Physical trials',
    dEn: 'Selected players are invited to live trials in their city (Mar – Jun 2027), evaluated by experienced coaches.',
    dHi: 'Select हुए players को अपने शहर में live trials का invitation मिलता है (Mar – Jun 2027)।',
    color: '#3B82F6',
  },
  {
    n: '04',
    en: 'The auction pool', hi: 'Auction pool',
    dEn: 'Players who clear trials enter the Season 5 auction pool — 10 franchises bid live in August 2027.',
    dHi: 'Trials clear करने वाले players Season 5 के auction pool में आते हैं — 10 franchises August 2027 में live bid लगाती हैं।',
    color: '#22C55E',
  },
];

export function AuctionLive() {
  const { t } = useLang();
  const user = useAuthUser();

  return (
    <div style={{ background: '#06101E', minHeight: '100vh', fontFamily: 'Inter,sans-serif', color: '#F0EDE8', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .wrap { max-width: 1100px; margin: 0 auto; padding: 0 16px; }
        @media(min-width:640px) { .wrap { padding: 0 24px; } }
        @media(min-width:1024px) { .wrap { padding: 0 40px; } }
        .shimmer-gold { background: linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimGold 3s linear infinite; }
        @keyframes shimGold { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .auc-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; max-width: 640px; margin: 0 auto 8px; }
        @media(max-width:639px) { .auc-stats { gap: 8px; } }
        .auc-steps { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media(min-width:768px) { .auc-steps { grid-template-columns: repeat(2,1fr); } }
        /* Floating register button (hidden for logged-in players via html.bcpl-authed) */
        .float-reg-btn { position: fixed; bottom: 28px; right: 28px; z-index: 900; background: linear-gradient(135deg,#FF7A29,#D95E10); border: none; border-radius: 12px; color: #fff; font-family: Montserrat, sans-serif; font-weight: 900; font-size: 13px; letter-spacing: .06em; cursor: pointer; padding: 14px 22px; text-transform: uppercase; text-decoration: none; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 32px rgba(255,122,41,0.45); transition: opacity .2s, transform .15s; }
        .float-reg-btn:hover { opacity: .9; transform: translateY(-2px); }
        @media(max-width:1023px){ .float-reg-btn { display:none; } }
      `}</style>

      <SiteHeader active="Auction" />

      {/* HERO */}
      <section style={{ padding: '56px 0 0', background: 'linear-gradient(180deg,#06101E 0%,#081218 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 0%,rgba(232,178,61,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 44, animation: 'fadeUp 0.5s ease both' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(232,178,61,0.08)', border: '1px solid rgba(232,178,61,0.35)', borderRadius: 12, padding: '8px 20px', marginBottom: 20 }}>
              <span style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 12, color: '#E8B23D', letterSpacing: '.14em' }}>
                {t('SEASON 5 · AUGUST 2027', 'SEASON 5 · अगस्त 2027')}
              </span>
            </div>

            <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(26px,5vw,56px)', lineHeight: 1.05, color: '#fff', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '-0.01em' }}>
              {t('THE BCPL', 'BCPL का')}<br />
              <span className="shimmer-gold">{t('PLAYER AUCTION', 'PLAYER AUCTION')}</span>
            </h1>
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 'clamp(14px,2vw,16px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 28px' }}>
              {t('Players who clear the physical trials enter the auction pool, and the 10 franchises bid for them live. The Season 5 auction takes place in August 2027.',
                 'जो players physical trials clear करते हैं वे auction pool में आते हैं, और 10 franchises उन पर live बोली लगाती हैं। Season 5 का auction अगस्त 2027 में होगा।')}
            </p>

            <div className="auc-stats">
              {[
                { v: '10', lEn: 'Franchises', lHi: 'Franchises' },
                { v: '₹2L–₹20L', lEn: 'Player value (Season 4)', lHi: 'Player value (Season 4)' },
                { v: 'LIVE', lEn: 'Bidding format', lHi: 'Bidding format' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#0A1727', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 10px' }}>
                  <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(16px,3vw,24px)', color: '#E8B23D', marginBottom: 4 }}>{s.v}</div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '.04em' }}>{t(s.lEn, s.lHi)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ height: 48, background: 'linear-gradient(180deg,transparent,#060C18)' }} />
      </section>

      <div className="wrap" style={{ paddingBottom: user ? 60 : 20 }}>
        {/* HOW YOU REACH THE AUCTION */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(18px,3vw,24px)', color: '#fff', textTransform: 'uppercase', marginBottom: 4 }}>
            {t('How you reach the auction', 'Auction तक कैसे पहुँचते हैं')}
          </div>
          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>
            {t('Four stages — every player follows the same path.', 'चार stages — हर player का रास्ता यही है।')}
          </div>
          <div className="auc-steps">
            {STEPS.map(s => (
              <div key={s.n} style={{ background: '#0A1727', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 18px', display: 'flex', gap: 14 }}>
                <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22, color: s.color, flexShrink: 0, lineHeight: 1 }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 6 }}>{t(s.en, s.hi)}</div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{t(s.dEn, s.dHi)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HOW BIDDING WORKS */}
        <div style={{ background: '#0A1727', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '24px 20px', marginBottom: 24 }}>
          <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(16px,2.5vw,20px)', color: '#fff', textTransform: 'uppercase', marginBottom: 12 }}>
            {t('How the bidding works', 'बोली कैसे लगती है')}
          </div>
          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>
            {t('Every player in the pool enters at a base price. On auction day the franchises bid live, and the highest bid signs the player for the season. In Season 4, player contracts ranged from ₹2 lakh to ₹20 lakh. Players in the auction pool are informed of their schedule and result by SMS, WhatsApp and email.',
               'Pool के हर player की एक base price होती है। Auction वाले दिन franchises live बोली लगाती हैं, और सबसे बड़ी बोली player को season के लिए sign करती है। Season 4 में player contracts ₹2 लाख से ₹20 लाख तक गए। Auction pool के players को उनका schedule और result SMS, WhatsApp और email से बताया जाता है।')}
          </div>
        </div>

        {/* AUCTION DAY GALLERY — real photos from the BCPL player auction */}
        <div style={{ background: '#0A1727', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '24px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(16px,2.5vw,20px)', color: '#fff', textTransform: 'uppercase' }}>
                {t('Auction Day Gallery', 'Auction Day की झलकियाँ')}
              </div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {t('Real moments from the BCPL player auction floor', 'BCPL player auction floor के असली पल')}
              </div>
            </div>
            <Link href="/photos" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 12, color: '#FF7A29', textDecoration: 'none', letterSpacing: '.06em' }}>
              {t('VIEW ALL', 'सभी देखें')} {AUCTION_PHOTOS.length} →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
            {[0, 7, 14, 21, 28, 35, 42, 49, 56].map(i => AUCTION_PHOTOS[i] && (
              <Link key={AUCTION_PHOTOS[i].f} href="/photos" style={{ display: 'block', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', lineHeight: 0 }}>
                <img src={import.meta.env.BASE_URL + 'auction/thumb/' + AUCTION_PHOTOS[i].f} alt="BCPL player auction moment"
                  loading="lazy" decoding="async"
                  style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
              </Link>
            ))}
          </div>
        </div>

        {/* CTA — only for visitors who are not logged in */}
        {!user && (
          <div style={{ background: 'linear-gradient(135deg,rgba(255,122,41,0.09),rgba(232,178,61,0.05))', border: '1px solid rgba(255,122,41,0.25)', borderRadius: 12, padding: '28px 22px', textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(17px,3vw,22px)', color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>
              {t('The road to the auction starts with Phase 1', 'Auction का रास्ता Phase 1 से शुरू होता है')}
            </div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>
              {t('Register, upload your video and take the first step.', 'Register करें, अपना video upload करें और पहला कदम लें।')}
            </div>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#FF7A29,#D95E10)', borderRadius: 12, color: '#fff', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 14, letterSpacing: '.06em', padding: '14px 28px', textTransform: 'uppercase', textDecoration: 'none', boxShadow: '0 8px 32px rgba(255,122,41,0.4)' }}>
              {t('Register Now', 'अभी रजिस्टर करें')} →
            </Link>
          </div>
        )}
      </div>

      <BCPLFooter />

      {/* Floating register button (auto-hidden for logged-in players) */}
      <Link href="/register" className="float-reg-btn">
        {t('REGISTER NOW →', 'अभी रजिस्टर करें →')}
      </Link>
    </div>
  );
}
