import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { SiteHeader } from '../components/SiteHeader';
import { BCPLFooter } from '../components/BCPLFooter';
import { getDashboard, isAuthenticated } from '../lib/api';
import { useLang } from '../lib/i18n';
import { formatRole } from '../lib/format';
import { IcoDownload, IcoChat, IcoIdCard } from '../lib/icons';

/**
 * Shareable digital player card (logged-in player). Renders a premium
 * gradient card to a <canvas> so it can be exported as a PNG and shared on
 * WhatsApp. No external html-to-image dependency — the card is drawn directly.
 */
const CARD_W = 720;
const CARD_H = 1040;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'BCPL';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

type CardData = { name: string; role: string; regNo: string };

function drawCard(ctx: CanvasRenderingContext2D, d: CardData) {
  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, '#12233F');
  bg.addColorStop(0.5, '#1B2E52');
  bg.addColorStop(1, '#24396B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Accent glow top
  const glow = ctx.createRadialGradient(CARD_W / 2, 120, 20, CARD_W / 2, 120, 420);
  glow.addColorStop(0, 'rgba(255,122,41,0.28)');
  glow.addColorStop(1, 'rgba(255,122,41,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, 420);

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, CARD_W - 48, CARD_H - 48);

  ctx.textAlign = 'center';

  // Season 5 branding strip
  ctx.fillStyle = '#F5B301';
  ctx.font = '900 26px Montserrat, sans-serif';
  ctx.fillText('BCPL · SEASON 5', CARD_W / 2, 96);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '700 16px Montserrat, sans-serif';
  ctx.fillText('BHARTIYA CORPORATE PREMIER LEAGUE', CARD_W / 2, 128);

  // Avatar circle with initials
  const cx = CARD_W / 2;
  const cy = 340;
  const r = 130;
  const av = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  av.addColorStop(0, '#FF7A29');
  av.addColorStop(1, '#F5B301');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = av;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.stroke();
  ctx.fillStyle = '#12233F';
  ctx.font = '900 96px Montserrat, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials(d.name), cx, cy + 4);
  ctx.textBaseline = 'alphabetic';

  // Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 54px Montserrat, sans-serif';
  ctx.fillText(d.name.toUpperCase().slice(0, 22), CARD_W / 2, 560);

  // Role pill
  const role = formatRole(d.role, 'en').toUpperCase();
  ctx.font = '800 26px Montserrat, sans-serif';
  const rw = ctx.measureText(role).width + 56;
  const rx = (CARD_W - rw) / 2;
  ctx.fillStyle = 'rgba(255,122,41,0.18)';
  roundRect(ctx, rx, 590, rw, 52, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,122,41,0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, rx, 590, rw, 52, 26);
  ctx.stroke();
  ctx.fillStyle = '#FF9A57';
  ctx.fillText(role, CARD_W / 2, 625);

  // Reg number box
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  roundRect(ctx, 120, 720, CARD_W - 240, 120, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  roundRect(ctx, 120, 720, CARD_W - 240, 120, 16);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '800 18px Montserrat, sans-serif';
  ctx.fillText('REGISTRATION NUMBER', CARD_W / 2, 762);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 40px Montserrat, sans-serif';
  ctx.fillText(d.regNo, CARD_W / 2, 812);

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '700 18px Montserrat, sans-serif';
  ctx.fillText('www.bcplt20.com', CARD_W / 2, CARD_H - 60);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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
        const regNo = reg.regNumber || (reg.id ? 'BCPL-' + reg.id.slice(0, 6).toUpperCase() : '—');
        setData({ name: d.user.name || 'Player', role: reg.role, regNo });
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) drawCard(ctx, data);
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
      `I'm registered for BCPL Season 5! 🏏 Register & showcase your cricket — www.bcplt20.com`,
      `मैं BCPL Season 5 के लिए registered हूँ! 🏏 Register करें और अपनी cricket दिखाएँ — www.bcplt20.com`,
    );
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: '#fff' }}>
      <SiteHeader />
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '32px 18px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <IcoIdCard size={24} style={{ color: '#FF7A29' }} />
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
            <button onClick={() => navigate('/register')} style={btn('#FF7A29')}>
              {t('Register Now →', 'रजिस्टर करें →')}
            </button>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={CARD_W}
              height={CARD_H}
              style={{ width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '0 auto 22px', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}
            />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={download} style={{ ...btn('#FF7A29'), display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <IcoDownload size={16} style={{ color: 'currentColor' }} /> {t('Download PNG', 'PNG डाउनलोड करें')}
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
