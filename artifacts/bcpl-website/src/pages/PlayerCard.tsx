import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { SiteHeader } from '../components/SiteHeader';
import { BCPLFooter } from '../components/BCPLFooter';
import { getDashboard, isAuthenticated } from '../lib/api';
import { useLang } from '../lib/i18n';
import { formatRole } from '../lib/format';
import { battingSummary, bowlingSummary } from '../lib/classification';
import type { ClassificationValue } from '../lib/api';
import { IcoDownload, IcoChat, IcoIdCard } from '../lib/icons';

/**
 * Shareable digital player card (logged-in player). Mirrors the mobile app's
 * premium card (violet → magenta gradient, cyan photo ring, big SEASON 5
 * watermark) but richer — with a BCPL highlights block that makes it worth
 * sharing. Drawn directly to a <canvas> (no external html-to-image dep) so it
 * exports as a crisp PNG.
 *
 * Fixes vs the old card (owner feedback):
 *  - No white edge artifacts: the whole canvas is filled with the gradient and
 *    the rounded frame sits INSIDE that fill, so nothing bleeds at the border.
 *  - SEASON 5 watermark is drawn large but fully clipped inside the frame.
 *  - Denser, exciting layout (highlights block) instead of an empty card.
 */
const CARD_W = 760;
const CARD_H = 1120;
const PAD = 28;          // outer margin (gradient shows around the frame — no white)
const RAD = 40;          // frame corner radius

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'BCPL';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

type CardData = {
  name: string;
  role: string;
  regNo: string;
  city: string | null;
  batting: string | null;
  bowling: string | null;
};

const HIGHLIGHTS: Array<[string, string]> = [
  ['Total prize pool', '\u20B915 Cr+'],
  ['Winning amount this season', '\u20B96 Cr'],
  ['Man of the Series', 'Luxury car'],
  ['Auction contracts', '\u20B92\u201320 lakh'],
];

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCard(ctx: CanvasRenderingContext2D, d: CardData, t: (en: string, hi: string) => string) {
  const fx = PAD, fy = PAD, fw = CARD_W - PAD * 2, fh = CARD_H - PAD * 2;

  /* 1) Fill the ENTIRE canvas with the deep base so no white ever shows at the
        rounded corners when exported. */
  ctx.fillStyle = '#1A0B2E';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  /* 2) Clip to the rounded frame and paint the violet → magenta gradient. */
  ctx.save();
  roundRectPath(ctx, fx, fy, fw, fh, RAD);
  ctx.clip();

  const bg = ctx.createLinearGradient(fx, fy, fx + fw, fy + fh);
  bg.addColorStop(0, '#3A1266');
  bg.addColorStop(0.45, '#5E1A8F');
  bg.addColorStop(0.75, '#A11C7E');
  bg.addColorStop(1, '#D10062');
  ctx.fillStyle = bg;
  ctx.fillRect(fx, fy, fw, fh);

  // top magenta glow
  const glow = ctx.createRadialGradient(CARD_W / 2, fy + 60, 20, CARD_W / 2, fy + 60, 460);
  glow.addColorStop(0, 'rgba(255,61,166,0.32)');
  glow.addColorStop(1, 'rgba(255,61,166,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(fx, fy, fw, 460);

  // 3) Big SEASON 5 watermark — fully inside the clip, so never clipped oddly.
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 300px Montserrat, sans-serif';
  ctx.fillText('5', CARD_W / 2, CARD_H / 2 + 40);
  ctx.font = '900 70px Montserrat, sans-serif';
  ctx.globalAlpha = 0.06;
  ctx.fillText('SEASON', CARD_W / 2, CARD_H / 2 - 130);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // 4) Header — logo dot + SEASON 5 + reg pill
  ctx.textAlign = 'left';
  ctx.fillStyle = '#00DCF5';
  ctx.font = '800 20px Montserrat, sans-serif';
  ctx.fillText('SEASON 5', fx + 40, fy + 58);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 34px Montserrat, sans-serif';
  ctx.fillText('BCPL T20', fx + 40, fy + 94);

  // reg pill (right)
  ctx.font = '800 22px Montserrat, sans-serif';
  const regW = ctx.measureText(d.regNo).width + 44;
  const regX = fx + fw - 40 - regW;
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  roundRectPath(ctx, regX, fy + 42, regW, 46, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, regX, fy + 42, regW, 46, 14);
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(d.regNo, regX + regW / 2, fy + 72);

  // 5) Avatar — cyan ring
  const cx = CARD_W / 2;
  const cy = fy + 300;
  const r = 118;
  // subtle inner disc
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const av = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  av.addColorStop(0, 'rgba(0,220,245,0.22)');
  av.addColorStop(1, 'rgba(255,61,166,0.30)');
  ctx.fillStyle = av;
  ctx.fill();
  // initials
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 96px Montserrat, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials(d.name), cx, cy + 6);
  ctx.textBaseline = 'alphabetic';
  // cyan ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#00DCF5';
  ctx.stroke();

  // 6) Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 52px Montserrat, sans-serif';
  ctx.fillText(d.name.toUpperCase().slice(0, 22), cx, fy + 490);

  // 7) Meta chips row (role · city · style)
  const chips: string[] = [formatRole(d.role, 'en').toUpperCase()];
  if (d.city) chips.push(d.city.toUpperCase());
  if (d.batting) chips.push(d.batting.toUpperCase());
  else if (d.bowling) chips.push(d.bowling.toUpperCase());
  ctx.font = '800 18px Montserrat, sans-serif';
  let totalW = chips.reduce((s, c) => s + ctx.measureText(c).width + 40, 0) + (chips.length - 1) * 10;
  let cxs = cx - totalW / 2;
  const chipY = fy + 520;
  for (const c of chips) {
    const w = ctx.measureText(c).width + 40;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    roundRectPath(ctx, cxs, chipY, w, 40, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,220,245,0.5)';
    ctx.lineWidth = 1.5;
    roundRectPath(ctx, cxs, chipY, w, 40, 20);
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(c, cxs + w / 2, chipY + 27);
    cxs += w + 10;
  }

  // 8) Highlights block — the exciting/shareable part
  const blockX = fx + 40, blockW = fw - 80;
  const blockY = fy + 600, blockH = 300;
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  roundRectPath(ctx, blockX, blockY, blockW, blockH, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, blockX, blockY, blockW, blockH, 22);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD166';
  ctx.font = '800 20px Montserrat, sans-serif';
  ctx.fillText(t('BCPL SEASON 5 HIGHLIGHTS', 'BCPL SEASON 5 HIGHLIGHTS'), cx, blockY + 42);

  // 2x2 grid of highlight facts
  const gx0 = blockX + 30;
  const colW = (blockW - 60) / 2;
  const rowY = blockY + 90;
  const rowH = 100;
  HIGHLIGHTS.forEach(([label, value], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const gx = gx0 + col * colW + colW / 2;
    const gy = rowY + row * rowH;
    ctx.fillStyle = '#00DCF5';
    ctx.font = '900 34px Montserrat, sans-serif';
    ctx.fillText(value, gx, gy);
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = '600 16px Montserrat, sans-serif';
    ctx.fillText(label, gx, gy + 28);
  });

  // 9) Footer line
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '700 20px Montserrat, sans-serif';
  ctx.fillText('For more information: bcplt20.com', cx, fy + fh - 62);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '600 17px Montserrat, sans-serif';
  ctx.fillText('Download the BCPL app', cx, fy + fh - 34);

  ctx.restore(); // end clip

  // 10) subtle frame border (drawn AFTER unclip, sits on top edge cleanly)
  roundRectPath(ctx, fx, fy, fw, fh, RAD);
  ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  ctx.lineWidth = 3;
  ctx.stroke();
}

export function PlayerCard() {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/register', { replace: true }); return; }
    getDashboard()
      .then((d) => {
        if (!d.registered || !d.registration) { setData(null); setLoading(false); return; }
        const reg = d.registration;
        const regNo = reg.regNumber || (reg.id ? 'BCPL-' + reg.id.slice(0, 6).toUpperCase() : '\u2014');
        const cls: ClassificationValue | null = reg.classification ?? null;
        setData({
          name: d.user?.name || 'Player',
          role: reg.role,
          regNo,
          city: reg.trialCity || null,
          batting: cls ? battingSummary(reg.role, cls, 'en') : null,
          bowling: cls ? bowlingSummary(cls, 'en') : null,
        });
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) drawCard(ctx, data, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const download = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BCPL-Player-Card-${data?.regNo ?? 'card'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };

  const shareWhatsApp = () => {
    const msg = t(
      `I'm registered for BCPL Season 5! \uD83C\uDFCF Register & showcase your cricket — bcplt20.com`,
      `\u092E\u0948\u0902 BCPL Season 5 \u0915\u0947 \u0932\u093F\u090F registered \u0939\u0942\u0901! \uD83C\uDFCF Register \u0915\u0930\u0947\u0902 \u0914\u0930 \u0905\u092A\u0928\u0940 cricket \u0926\u093F\u0916\u093E\u090F\u0901 — bcplt20.com`,
    );
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: '#fff' }}>
      <SiteHeader />
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '32px 18px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <IcoIdCard size={24} style={{ color: '#FF3DA6' }} />
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 24, margin: 0 }}>
            {t('Your Player Card', 'आपका प्लेयर कार्ड')}
          </h1>
        </div>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 22 }}>
          {t('Download your Season 5 card and share it with friends.', 'अपना Season 5 कार्ड डाउनलोड करें और दोस्तों के साथ शेयर करें।')}
        </p>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-3)' }}>{t('Loading…', 'लोड हो रहा है…')}</div>
        ) : !data ? (
          <div style={{ background: '#1F3652', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>{t('No registration found', 'कोई रजिस्ट्रेशन नहीं मिला')}</div>
            <div style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 16 }}>
              {t('Complete your registration to unlock your player card.', 'अपना कार्ड पाने के लिए रजिस्ट्रेशन पूरा करें।')}
            </div>
            <button onClick={() => navigate('/register')} style={btn('#FF3DA6')}>
              {t('Register Now →', 'रजिस्टर करें →')}
            </button>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={CARD_W}
              height={CARD_H}
              style={{ width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto 22px', borderRadius: 24, boxShadow: '0 24px 70px rgba(0,0,0,.55)' }}
            />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={download} style={{ ...btn('#FF3DA6'), display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <IcoDownload size={16} style={{ color: 'currentColor' }} /> {t('Download card', 'कार्ड डाउनलोड करें')}
              </button>
              <button onClick={shareWhatsApp} style={{ ...btn('#25D366'), display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <IcoChat size={16} style={{ color: 'currentColor' }} /> {t('Share on WhatsApp', 'WhatsApp पर शेयर करें')}
              </button>
            </div>
          </>
        )}
      </div>
      <BCPLFooter />
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return {
    background: bg, color: '#fff', border: 'none', borderRadius: 10,
    padding: '12px 20px', fontFamily: 'Montserrat,sans-serif', fontWeight: 900,
    fontSize: 14, letterSpacing: '.03em', cursor: 'pointer',
  };
}
