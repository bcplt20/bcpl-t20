import { useState, useCallback } from 'react';
import { IcoImage, IcoChat } from '../lib/icons';

/**
 * Ready-made shareable referral poster (Task #56).
 *
 * Generates a premium 1080×1920 (WhatsApp status ratio) BCPL poster entirely
 * client-side on a <canvas>: dark-navy backdrop with orange accents, Barlow
 * Condensed headline, the player's name, a huge "bcplt20.com/r/CODE" callout,
 * a QR code of the referral link, and a Hindi CTA line. No emoji graphics —
 * everything is drawn, so it always looks crisp.
 *
 * The heavy `qrcode` dependency is dynamically imported the first time a poster
 * is generated, so it never weighs down the main bundle.
 */

const W = 1080;
const H = 1920;

// BCPL palette (matches the site + email templates).
const NAVY = '#06101E';
const NAVY_2 = '#0A1727';
const ORANGE = '#FF7A29';
const ORANGE_HI = '#FF9A57';
const GOLD = '#E8B23D';
const WHITE = '#F0EDE8';

/** Draw wrapped, centered text and return the y after the last line. */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/);
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
  return cursorY;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Build the poster on a canvas and return it (fonts already loaded). */
async function buildPoster(name: string, code: string, link: string): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Make sure the display fonts are ready before we paint.
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    await Promise.all([
      (document as Document & { fonts?: FontFaceSet }).fonts?.load("900 120px 'Barlow Condensed'"),
      (document as Document & { fonts?: FontFaceSet }).fonts?.load("800 40px 'Montserrat'"),
    ]);
  } catch { /* fonts optional — canvas falls back to system fonts */ }

  // ── Background: deep navy with a soft orange glow top + subtle vignette ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0B1A2E');
  bg.addColorStop(0.55, NAVY);
  bg.addColorStop(1, '#04080F');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 120, 40, W / 2, 120, 720);
  glow.addColorStop(0, 'rgba(255,122,41,0.20)');
  glow.addColorStop(1, 'rgba(255,122,41,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 900);

  // Outer orange frame.
  ctx.strokeStyle = 'rgba(255,122,41,0.55)';
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  ctx.textAlign = 'center';

  // ── Logo (falls back to a wordmark if the asset can't load) ──
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const logo = await loadImage(`${base}/bcpl-assets/bcpl-logo-white.png`);
  if (logo && logo.width) {
    const lw = 360;
    const lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, 120, lw, lh);
  } else {
    ctx.fillStyle = WHITE;
    ctx.font = "900 92px 'Barlow Condensed', sans-serif";
    ctx.fillText('BCPL T20', W / 2, 220);
  }

  // ── Eyebrow ──
  ctx.fillStyle = GOLD;
  ctx.font = "800 34px 'Montserrat', sans-serif";
  ctx.fillText('S E A S O N   5   ·   R E F E R   &   E A R N', W / 2, 360);

  // ── Player name ──
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = "600 40px 'Montserrat', sans-serif";
  ctx.fillText('Invited by', W / 2, 470);

  ctx.fillStyle = WHITE;
  ctx.font = "900 84px 'Barlow Condensed', sans-serif";
  const shownName = name.trim() || 'BCPL Player';
  drawWrapped(ctx, shownName.toUpperCase(), W / 2, 560, W - 200, 92);

  // ── Headline (Hindi hook) ──
  ctx.fillStyle = ORANGE_HI;
  ctx.font = "900 66px 'Barlow Condensed', sans-serif";
  let hy = 700;
  hy = drawWrapped(ctx, 'MAIN BCPL SEASON 5 KHEL RAHA HOON', W / 2, hy, W - 160, 74);
  hy = drawWrapped(ctx, 'TU BHI AA JAA!', W / 2, hy + 74, W - 160, 74);

  // ── QR code ──
  const QRCode = (await import('qrcode')).default;
  const qrSize = 460;
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, link, {
    width: qrSize,
    margin: 1,
    color: { dark: '#06101E', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
  const qrX = (W - qrSize) / 2;
  const qrY = 940;
  // White rounded plate behind the QR for scan reliability.
  const plate = qrSize + 56;
  ctx.fillStyle = '#ffffff';
  const px = (W - plate) / 2;
  const py = qrY - 28;
  const r = 28;
  ctx.beginPath();
  ctx.moveTo(px + r, py);
  ctx.arcTo(px + plate, py, px + plate, py + plate, r);
  ctx.arcTo(px + plate, py + plate, px, py + plate, r);
  ctx.arcTo(px, py + plate, px, py, r);
  ctx.arcTo(px, py, px + plate, py, r);
  ctx.closePath();
  ctx.fill();
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // ── "SCAN OR VISIT" hint ──
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = "700 32px 'Montserrat', sans-serif";
  ctx.fillText('SCAN KARO YA VISIT KARO', W / 2, qrY + qrSize + 90);

  // ── Big link callout ──
  ctx.fillStyle = ORANGE;
  ctx.font = "900 68px 'Barlow Condensed', sans-serif";
  ctx.fillText(`bcplt20.com/r/${code}`, W / 2, qrY + qrSize + 170);

  // ── CTA footer band ──
  const bandY = H - 210;
  ctx.fillStyle = NAVY_2;
  ctx.fillRect(60, bandY, W - 120, 120);
  ctx.strokeStyle = 'rgba(255,122,41,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, bandY, W - 120, 120);
  ctx.fillStyle = WHITE;
  ctx.font = "700 38px 'Montserrat', sans-serif";
  ctx.fillText('India ki sabse badi corporate cricket league', W / 2, bandY + 74);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Poster export failed'))),
      'image/png',
      0.95,
    );
  });
}

const posterBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg,#FF7A29,#D95E10)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '11px 18px',
  fontFamily: 'Montserrat,sans-serif',
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: '.04em',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
};

interface Props {
  name: string;
  code: string;
  link: string;
}

/** Buttons: generate → preview → Download PNG + WhatsApp share. */
export function ReferralPosterButton({ name, code, link }: Props) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const canvas = await buildPoster(name, code, link);
      const b = await canvasToBlob(canvas);
      setBlob(b);
      setPreview(URL.createObjectURL(b));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create the poster — please try again');
    } finally {
      setBusy(false);
    }
  }, [name, code, link]);

  const fileName = `BCPL-Referral-${code}.png`;

  const download = useCallback(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, [blob, fileName]);

  const shareText =
    'Main BCPL Season 5 khel raha hoon — tu bhi aa jaa! Mere personal link se register karo 👇\n' + link;

  const share = useCallback(async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: 'image/png' });
    const navAny = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };
    // Preferred: native share sheet with the actual poster image attached.
    if (navAny.share && navAny.canShare?.({ files: [file] })) {
      try {
        await navAny.share({ files: [file], text: shareText, title: 'BCPL Season 5' });
        return;
      } catch {
        /* user cancelled or share failed — fall through to the fallback */
      }
    }
    // Fallback: download the image, then open WhatsApp with the link text so
    // the player attaches the just-downloaded poster to their status/chat.
    download();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  }, [blob, fileName, shareText, download]);

  return (
    <div style={{ marginTop: 12 }}>
      {!preview ? (
        <button style={posterBtn} onClick={generate} disabled={busy}>
          {busy ? 'Poster ban raha hai…' : <><IcoImage size={15} style={{ color: 'currentColor' }} /> Ready-made poster banao</>}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <img
            src={preview}
            alt="Your BCPL referral poster"
            style={{
              width: '100%',
              maxWidth: 260,
              borderRadius: 12,
              border: '1px solid rgba(255,122,41,0.35)',
              alignSelf: 'flex-start',
            }}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={posterBtn} onClick={share}><IcoChat size={15} style={{ color: 'currentColor' }} /> WhatsApp par share karo</button>
            <button
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.8)',
                borderRadius: 10,
                padding: '11px 18px',
                fontFamily: 'Montserrat,sans-serif',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
              onClick={download}
            >
              Download PNG
            </button>
          </div>
        </div>
      )}
      {err && (
        <div style={{ fontSize: 12, color: '#F87171', marginTop: 8 }}>{err}</div>
      )}
    </div>
  );
}
