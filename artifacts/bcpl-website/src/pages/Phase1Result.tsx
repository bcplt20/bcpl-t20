/**
 * BCPL PLAYER JOURNEY — Phase 1 Result (100-point transparent scoring)
 *
 * Both outcomes get the SAME premium experience:
 *   anticipation → reveal → player scorecard → breakdown → standing.
 * Non-shortlisted players see "ASSESSMENT COMPLETE" with strengths &
 * areas to improve — never a grey failure card.
 *
 * Privacy: the downloadable share card contains only name / role / city /
 * score / rank — no phone, DOB, reg number or documents.
 *
 * DEV ONLY: ?demo=q or ?demo=nq renders sample data so designers can
 * preview both variants without a scored account (stripped from prod).
 */
import { useState, useEffect, useRef } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getMyResult, isAuthenticated, type MyResult } from '../lib/api';
import { useLang } from '../lib/i18n';

const BASE = import.meta.env.BASE_URL;

const ROLE_LABELS: Record<string, { en: string; hi: string; icon: string }> = {
  bat:  { en: 'Batsman',       hi: 'बल्लेबाज़',      icon: '🏏' },
  bowl: { en: 'Bowler',        hi: 'गेंदबाज़',       icon: '🎯' },
  wk:   { en: 'Wicket-Keeper', hi: 'विकेट-कीपर',   icon: '🧤' },
  ar:   { en: 'All-Rounder',   hi: 'ऑल-राउंडर',    icon: '⚡' },
};
const PHASE2_FEES: Record<string, number> = { bat: 2000, bowl: 2000, wk: 2000, ar: 3000 };

/** Registrations store role in two historic formats ("bat" and "Batsman") — normalise to bat|bowl|wk|ar. */
function normRole(role: string | undefined): string {
  const lc = (role ?? '').toLowerCase();
  if (lc === 'bat' || (lc.includes('bat') && !lc.includes('wicket'))) return 'bat';
  if (lc === 'bowl' || lc.includes('bowl')) return 'bowl';
  if (lc === 'wk' || lc.includes('wicket') || lc.includes('keep')) return 'wk';
  if (lc === 'ar' || lc.includes('all')) return 'ar';
  return lc;
}

/** Criterion labels — roleSkill adapts to the player's role. */
function critLabel(key: string, role: string, t: (en: string, hi: string) => string): string {
  switch (key) {
    case 'roleSkill':
      return role === 'bat'  ? t('Batting Skill', 'बैटिंग स्किल')
           : role === 'bowl' ? t('Bowling Skill', 'बॉलिंग स्किल')
           : role === 'wk'   ? t('Keeping Skill', 'कीपिंग स्किल')
           : t('All-Round Skill', 'ऑल-राउंड स्किल');
    case 'technique':     return t('Technique & Basics',  'तकनीक और बेसिक्स');
    case 'execution':     return t('Control & Execution', 'कंट्रोल और एग्ज़ीक्यूशन');
    case 'gameAwareness': return t('Game Awareness',      'गेम की समझ');
    case 'movement':      return t('Athletic Movement',   'फिटनेस और मूवमेंट');
    case 'videoEvidence': return t('Video Quality',       'वीडियो क्वालिटी');
    default:              return key;
  }
}

/** Honest, respectful improvement pointers per criterion. */
function improveTip(key: string, role: string, t: (en: string, hi: string) => string): string {
  switch (key) {
    case 'roleSkill':
      return role === 'bowl'
        ? t('Work on line-length consistency and one reliable variation.', 'लाइन-लेंथ की consistency और एक भरोसेमंद variation पर काम करें।')
        : role === 'wk'
        ? t('Practise clean collection and faster glove-to-stump work.', 'क्लीन कलेक्शन और तेज़ glove-to-stump वर्क की प्रैक्टिस करें।')
        : t('Sharpen shot selection and core role fundamentals daily.', 'शॉट सिलेक्शन और अपने रोल के बेसिक्स पर रोज़ काम करें।');
    case 'technique':     return t('Daily drills on stance, grip and balance will lift this fast.', 'स्टांस, ग्रिप और बैलेंस की रोज़ाना drills से यह जल्दी सुधरेगा।');
    case 'execution':     return t('Repeat one skill till it lands 8 times out of 10.', 'एक skill को तब तक दोहराएँ जब तक 10 में से 8 बार सही न लगे।');
    case 'gameAwareness': return t('Watch match footage and study situations — when to attack, when to hold.', 'मैच फुटेज देखें — कब अटैक करना है, कब रुकना है, यह समझें।');
    case 'movement':      return t('Add sprint, agility and fielding sessions to your weekly routine.', 'हफ़्ते की routine में sprint, agility और fielding sessions जोड़ें।');
    case 'videoEvidence': return t('Next time record in good light, steady camera, full action visible.', 'अगली बार अच्छी रोशनी, स्थिर कैमरा और पूरा एक्शन दिखाते हुए रिकॉर्ड करें।');
    default:              return '';
  }
}

/* ── Share card (canvas → PNG). Privacy-safe fields only. ── */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function downloadShareCard(r: MyResult, roleLabel: string, qualified: boolean) {
  const W = 1080, H = 1350;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  try {
    await Promise.all([
      document.fonts.load('900 300px Montserrat'),
      document.fonts.load('800 44px Montserrat'),
      document.fonts.load('700 30px Inter'),
    ]);
  } catch { /* fallback fonts are fine */ }

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0B1B32'); g.addColorStop(1, '#06101E');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const rg = ctx.createRadialGradient(W / 2, 640, 80, W / 2, 640, 620);
  rg.addColorStop(0, 'rgba(232,178,61,0.20)'); rg.addColorStop(1, 'rgba(232,178,61,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(232,178,61,0.55)'; ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = 'rgba(255,122,41,0.25)'; ctx.lineWidth = 2;
  ctx.strokeRect(56, 56, W - 112, H - 112);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#E8B23D'; ctx.font = '800 46px Montserrat, sans-serif';
  ctx.fillText('BCPL • SEASON 5', W / 2, 160);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '700 30px Inter, sans-serif';
  ctx.fillText('PHASE 1 — VIDEO TRIAL ASSESSMENT', W / 2, 215);

  const name = (r.name || '').toUpperCase();
  ctx.fillStyle = '#FFFFFF'; ctx.font = '900 74px Montserrat, sans-serif';
  ctx.fillText(name.length > 18 ? name.slice(0, 17) + '…' : name, W / 2, 345);
  ctx.fillStyle = '#FF7A29'; ctx.font = '800 38px Montserrat, sans-serif';
  ctx.fillText(roleLabel.toUpperCase() + (r.trialCity ? '  •  ' + r.trialCity.toUpperCase() : ''), W / 2, 410);

  ctx.fillStyle = '#E8B23D'; ctx.font = '900 300px Montserrat, sans-serif';
  ctx.fillText(String(r.total ?? 0), W / 2, 790);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '800 44px Montserrat, sans-serif';
  ctx.fillText('/ 100  BCPL SCORE', W / 2, 865);

  ctx.fillStyle = '#FFFFFF'; ctx.font = '800 46px Montserrat, sans-serif';
  ctx.fillText((r.trialCity || '').toUpperCase() + ' RANK  #' + (r.cityRank ?? '—'), W / 2, 985);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '700 30px Inter, sans-serif';
  ctx.fillText('among ' + (r.cityCount ?? 0) + ' evaluated players', W / 2, 1035);

  if (qualified) {
    ctx.fillStyle = 'rgba(34,197,94,0.15)'; rr(ctx, W / 2 - 330, 1085, 660, 92, 46); ctx.fill();
    ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 3; rr(ctx, W / 2 - 330, 1085, 660, 92, 46); ctx.stroke();
    ctx.fillStyle = '#22C55E'; ctx.font = '900 42px Montserrat, sans-serif';
    ctx.fillText('✓ QUALIFIED FOR PHASE 2', W / 2, 1147);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; rr(ctx, W / 2 - 300, 1085, 600, 92, 46); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 3; rr(ctx, W / 2 - 300, 1085, 600, 92, 46); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '900 42px Montserrat, sans-serif';
    ctx.fillText('SEASON 5 TRIALIST', W / 2, 1147);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '700 28px Inter, sans-serif';
  ctx.fillText('bcplt20.com  •  #BCPLSeason5', W / 2, 1262);

  const a = document.createElement('a');
  a.download = 'BCPL-Phase1-Scorecard.png';
  a.href = cv.toDataURL('image/png');
  a.click();
}

/* ── DEV-ONLY demo data (?demo=q / ?demo=nq) — never in prod builds ── */
function demoResult(kind: string): MyResult {
  const qualified = kind === 'q';
  return {
    available: true,
    decision: qualified ? 'qualified' : 'not_shortlisted',
    name: qualified ? 'Rahul Sharma' : 'Amit Verma',
    regNumber: qualified ? 'BCPL-DEL-114' : 'BCPL-DEL-267',
    role: qualified ? 'ar' : 'bat',
    trialCity: 'Delhi',
    total: qualified ? 84 : 58,
    breakdown: qualified
      ? [
          { key: 'roleSkill', score: 30, max: 35 }, { key: 'technique', score: 21, max: 25 },
          { key: 'execution', score: 13, max: 15 }, { key: 'gameAwareness', score: 8, max: 10 },
          { key: 'movement', score: 8, max: 10 },   { key: 'videoEvidence', score: 4, max: 5 },
        ]
      : [
          { key: 'roleSkill', score: 22, max: 35 }, { key: 'technique', score: 13, max: 25 },
          { key: 'execution', score: 9, max: 15 },  { key: 'gameAwareness', score: 7, max: 10 },
          { key: 'movement', score: 5, max: 10 },   { key: 'videoEvidence', score: 2, max: 5 },
        ],
    selectorNote: qualified ? null : 'Good natural timing. Footwork against short balls needs work — practise back-foot drills.',
    cityRank: qualified ? 12 : 214, cityCount: 486,
    roleRank: qualified ? 4 : 96,  roleCount: 141,
    scoredAt: new Date().toISOString(),
  };
}

/* ═══════════════════════════════════════════════════════════════ */
export function Phase1Result() {
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState<MyResult | null>(null);
  const [stage, setStage]     = useState<'intro' | 'result'>('intro');
  const [flash, setFlash]     = useState(false);
  const [barsOn, setBarsOn]   = useState(false);
  const [demo, setDemo]       = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    // DEV-only preview of both variants without a scored account
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const d = params.get('demo');
      if (d === 'q' || d === 'nq') {
        setResult(demoResult(d)); setDemo(true); setLoading(false);
        if (params.get('open') === '1') { setStage('result'); setBarsOn(true); }
        return;
      }
    }
    if (!isAuthenticated()) { window.location.replace(BASE + 'register'); return; }
    getMyResult()
      .then(r => {
        // Pre-result states keep their original destinations (old page behavior):
        // not yet paid → registration; paid but no video → upload page.
        if (r.reason === 'not_registered' || r.phase1Status === 'pending') {
          window.location.replace(BASE + 'register'); return;
        }
        if (r.phase1Status === 'payment_done') {
          window.location.replace(BASE + 'register/upload-video'); return;
        }
        setResult(r);
      })
      .catch((e: any) => setError(e?.message ?? 'Failed to load result. Please refresh.'))
      .finally(() => setLoading(false));
    return () => { timers.current.forEach(id => window.clearTimeout(id)); };
  }, []);

  const reveal = () => {
    setFlash(true);
    setStage('result');
    timers.current.push(window.setTimeout(() => setFlash(false), 950));
    timers.current.push(window.setTimeout(() => setBarsOn(true), 350));
    try { window.scrollTo({ top: 0 }); } catch { /* noop */ }
  };

  const r = result;
  const qualified = r?.decision === 'qualified';
  const role      = normRole(r?.role);
  const roleInfo  = ROLE_LABELS[role] ?? { en: r?.role ?? '', hi: r?.role ?? '', icon: '🏏' };
  const roleLabel = t(roleInfo.en, roleInfo.hi);
  const phase2Fee = Math.round((PHASE2_FEES[role] ?? 2000) * 1.18);

  // Strongest / weakest by score-to-max ratio (ties → bigger max first = more meaningful)
  const sorted = [...(r?.breakdown ?? [])].sort((a, b) =>
    (b.score / b.max) - (a.score / a.max) || b.max - a.max);
  const strongest = sorted[0];
  const weakest   = sorted[sorted.length - 1];

  const pct        = r?.cityCount ? Math.max(1, Math.ceil((r.cityRank! / r.cityCount) * 100)) : null;
  const showPct    = qualified && !!r?.cityCount && r.cityCount >= 50 && pct !== null;
  const showRole   = !!r?.roleCount && r.roleCount >= 20;

  const initials = (r?.name ?? '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '🏏';

  const statusColor = qualified ? '#22C55E' : '#7FB4E8';

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', fontFamily:"'Inter',sans-serif", color:'#F0EDE8', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .wrap{max-width:1200px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .rwrap{max-width:680px;margin:0 auto;padding:0 16px}
        .btn-gold{background:linear-gradient(135deg,#E8B23D,#C4901E);border:none;border-radius:12px;color:#081020;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:.06em;cursor:pointer;transition:transform .15s,filter .2s}
        .btn-gold:hover{filter:brightness(1.1);transform:translateY(-2px)}
        .btn-orange{background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:.06em;cursor:pointer;transition:transform .15s,filter .2s}
        .btn-orange:hover{filter:brightness(1.12);transform:translateY(-2px)}
        .btn-ghost{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.14);border-radius:12px;color:rgba(255,255,255,0.75);font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;transition:all .2s}
        .btn-ghost:hover{border-color:#E8B23D;color:#E8B23D}
        .rcard{background:#0A1727;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:24px 20px;margin-bottom:18px}
        @media(min-width:640px){.rcard{padding:28px 28px}}
        .grid2r{display:grid;grid-template-columns:1fr;gap:14px}
        @media(min-width:600px){.grid2r{grid-template-columns:1fr 1fr}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardIn{0%{opacity:0;transform:scale(.86) translateY(30px)}60%{transform:scale(1.02) translateY(-4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes flashOut{0%{opacity:1}100%{opacity:0}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 60px rgba(232,178,61,0.18)}50%{box-shadow:0 0 110px rgba(232,178,61,0.34)}}
        @keyframes ballFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes confFall{0%{transform:translateY(-8vh) rotate(0)}100%{transform:translateY(105vh) rotate(720deg)}}
        .conf{position:fixed;top:0;width:9px;height:15px;z-index:60;pointer-events:none;animation:confFall linear forwards}
      `}</style>

      <SiteHeader />
      {demo && (
        <div style={{ position:'fixed', bottom:10, left:10, zIndex:99, background:'#7C3AED', color:'#fff', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:10, letterSpacing:'.1em', padding:'4px 10px', borderRadius:6, opacity:.85 }}>
          DEV PREVIEW — SAMPLE DATA
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16 }}>
          <div style={{ width:40, height:40, border:'3px solid rgba(232,178,61,0.2)', borderTopColor:'#E8B23D', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>
            {t('Loading your result…', 'आपका result लोड हो रहा है…')}
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {!loading && error && (
        <div className="rwrap" style={{ paddingTop:60, textAlign:'center', paddingBottom:80 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
          <div style={{ fontSize:15, color:'#EF4444', marginBottom:16 }}>{error}</div>
          <button onClick={() => window.location.reload()} className="btn-orange" style={{ padding:'12px 28px', fontSize:13 }}>
            {t('Refresh →', 'दोबारा लोड करें →')}
          </button>
        </div>
      )}

      {/* ── STILL UNDER REVIEW (no score / no decision yet) ── */}
      {!loading && !error && r && !r.available && (
        <div className="rwrap" style={{ paddingTop:60, textAlign:'center', paddingBottom:100 }}>
          {r.phase1Status === 'selected' || r.phase1Status === 'rejected' ? (
            <>
              <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:24, color:'#E8B23D', marginBottom:12 }}>
                {t('Your scorecard is being finalised', 'आपका scorecard तैयार हो रहा है')}
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
                {t('Your Phase 1 decision has been announced by SMS & email. Your detailed 100-point scorecard will appear here shortly.',
                   'आपका Phase 1 decision SMS और email से भेज दिया गया है। आपका detailed 100-point scorecard जल्द ही यहाँ दिखेगा।')}
              </div>
              {r.phase1Status === 'selected' && (
                <button className="btn-orange" style={{ marginTop:24, padding:'14px 30px', fontSize:13 }}
                  onClick={() => { window.location.href = BASE + 'register/phase2'; }}>
                  {t('CONTINUE TO PHASE 2 →', 'PHASE 2 की ओर बढ़ें →')}
                </button>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize:48, marginBottom:16, animation:'ballFloat 3s ease-in-out infinite', display:'inline-block' }}>🎬</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:24, color:'#A855F7', marginBottom:12 }}>
                {t('Your Video is Under Review', 'आपकी video review में है')}
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
                {t('BCCI-certified scouts are doing a full 100-point evaluation of your trial video. You will get SMS + email the moment your result is ready.',
                   'BCCI-certified scouts आपकी trial video का पूरा 100-point evaluation कर रहे हैं। Result तैयार होते ही आपको SMS + email मिलेगा।')}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ANTICIPATION ── */}
      {!loading && !error && r?.available && stage === 'intro' && (
        <div style={{ position:'relative', minHeight:'78vh', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 30%, rgba(232,178,61,0.13) 0%, transparent 55%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 32px)', pointerEvents:'none' }} />
          <div className="rwrap" style={{ textAlign:'center', position:'relative', zIndex:1, padding:'70px 16px' }}>
            <div style={{ fontSize:64, marginBottom:22, animation:'ballFloat 3s ease-in-out infinite', display:'inline-block', filter:'drop-shadow(0 0 26px rgba(232,178,61,0.5))' }}>🏏</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, letterSpacing:'.24em', color:'#E8B23D', marginBottom:14 }}>
              BCPL SEASON 5 — {t('PHASE 1 ASSESSMENT', 'PHASE 1 मूल्यांकन')}
            </div>
            <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(34px,7vw,64px)', lineHeight:1, textTransform:'uppercase', marginBottom:18, animation:'fadeUp .5s ease both' }}>
              <span style={{ color:'#fff', display:'block' }}>{t('YOUR RESULT', 'आपका RESULT')}</span>
              <span style={{ background:'linear-gradient(90deg,#E8B23D,#FFE9A8,#E8B23D)', backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'shimGold 3s linear infinite', display:'block' }}>
                {t('IS READY', 'तैयार है')}
              </span>
            </h1>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:15, maxWidth:460, margin:'0 auto 30px', lineHeight:1.7, animation:'fadeUp .5s .1s ease both' }}>
              {t('BCCI-certified scouts have completed a full 100-point evaluation of your trial video.',
                 'BCCI-certified scouts ने आपकी trial video का पूरा 100-point evaluation कर लिया है।')}
            </p>
            <button className="btn-gold" onClick={reveal}
              style={{ padding:'18px 44px', fontSize:15, animation:'fadeUp .5s .18s ease both, glowPulse 2.4s ease infinite' }}>
              {t('VIEW MY RESULT →', 'मेरा RESULT देखें →')}
            </button>
            <div style={{ marginTop:22, fontSize:12, color:'rgba(255,255,255,0.35)', animation:'fadeUp .5s .25s ease both' }}>
              {t('Every submitted video gets a complete evaluation.', 'हर submit हुई video का पूरा evaluation किया जाता है।')}
            </div>
          </div>
        </div>
      )}

      {/* ── REVEAL FLASH ── */}
      {flash && (
        <div style={{ position:'fixed', inset:0, zIndex:70, pointerEvents:'none', background:'radial-gradient(circle at 50% 38%, rgba(255,236,170,0.95) 0%, rgba(232,178,61,0.55) 30%, rgba(6,16,30,0) 70%)', animation:'flashOut .95s ease forwards' }} />
      )}

      {/* ── CONFETTI (qualified only) ── */}
      {stage === 'result' && qualified && flash && Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="conf" style={{
          left: (4 + i * 7) + '%',
          background: i % 3 === 0 ? '#E8B23D' : i % 3 === 1 ? '#FF7A29' : '#22C55E',
          animationDuration: (2.2 + (i % 5) * 0.4) + 's',
          animationDelay: (i % 7) * 0.12 + 's',
          borderRadius: 2,
        }} />
      ))}

      {/* ── RESULT ── */}
      {!loading && !error && r?.available && stage === 'result' && (
        <div className="rwrap" style={{ paddingTop:34, paddingBottom:90 }}>

          {/* ═══ PLAYER SCORECARD ═══ */}
          <div style={{ borderRadius:22, padding:2, background: qualified
              ? 'linear-gradient(135deg,#E8B23D,#7A5A14 40%,#E8B23D 70%,#FFE9A8)'
              : 'linear-gradient(135deg,rgba(127,180,232,0.8),rgba(46,80,115,0.7) 45%,rgba(127,180,232,0.65))',
            animation:'cardIn .7s cubic-bezier(.34,1.4,.64,1) both', marginBottom:18,
            boxShadow: qualified ? '0 24px 70px rgba(232,178,61,0.16)' : '0 24px 70px rgba(90,140,190,0.12)' }}>
            <div style={{ borderRadius:20, background:'linear-gradient(160deg,#0D1F35 0%,#081527 55%,#0A1727 100%)', padding:'26px 22px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 26px)', pointerEvents:'none' }} />
              <div style={{ position:'absolute', top:-90, right:-60, width:260, height:260, borderRadius:'50%', background: qualified ? 'radial-gradient(circle, rgba(232,178,61,0.16), transparent 65%)' : 'radial-gradient(circle, rgba(127,180,232,0.12), transparent 65%)', pointerEvents:'none' }} />

              {/* top strip */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22, position:'relative' }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, letterSpacing:'.2em', color:'#E8B23D' }}>BCPL <span style={{ color:'rgba(255,255,255,0.4)' }}>•</span> S5</div>
                {r.regNumber && (
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:10, letterSpacing:'.1em', color:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:8, padding:'4px 10px' }}>
                    🎟 {r.regNumber}
                  </div>
                )}
              </div>

              {/* identity */}
              <div style={{ textAlign:'center', position:'relative' }}>
                <div style={{ width:92, height:92, borderRadius:'50%', margin:'0 auto 14px', background:'linear-gradient(135deg,#FF7A29,#E8B23D)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:34, color:'#fff', border:'3px solid rgba(255,255,255,0.18)', boxShadow:'0 10px 34px rgba(255,122,41,0.35)' }}>
                  {initials}
                </div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(22px,5vw,30px)', color:'#fff', textTransform:'uppercase', letterSpacing:'.02em', marginBottom:8 }}>
                  {r.name}
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap', marginBottom:18 }}>
                  <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'.08em', color:'#FF9A5C', background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.3)', borderRadius:20, padding:'5px 14px' }}>
                    {roleInfo.icon} {roleLabel.toUpperCase()}
                  </span>
                  {r.trialCity && (
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'.08em', color:'rgba(255,255,255,0.65)', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:20, padding:'5px 14px' }}>
                      📍 {r.trialCity.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* status band */}
                <div style={{ display:'inline-block', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, letterSpacing:'.14em', color:statusColor, background: qualified ? 'rgba(34,197,94,0.1)' : 'rgba(127,180,232,0.1)', border:'1px solid ' + (qualified ? 'rgba(34,197,94,0.4)' : 'rgba(127,180,232,0.35)'), borderRadius:10, padding:'9px 18px', marginBottom:24 }}>
                  {qualified
                    ? '✓ ' + t('PHASE 1 QUALIFIED — SELECTED FOR PHASE 2', 'PHASE 1 QUALIFIED — PHASE 2 के लिए चुने गए')
                    : t('PHASE 1 ASSESSMENT COMPLETE', 'PHASE 1 मूल्यांकन पूरा')}
                </div>

                {/* score */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'.22em', color:'rgba(255,255,255,0.4)', marginBottom:2 }}>
                    {t('BCPL SCORE', 'BCPL स्कोर')}
                  </div>
                  <div style={{ lineHeight:1 }}>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(70px,17vw,104px)', background: qualified ? 'linear-gradient(90deg,#E8B23D,#FFE9A8,#E8B23D)' : 'linear-gradient(90deg,#DCE9F5,#ffffff,#DCE9F5)', backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'shimGold 4s linear infinite' }}>
                      {r.total}
                    </span>
                    <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(20px,5vw,28px)', color:'rgba(255,255,255,0.35)' }}> /100</span>
                  </div>
                </div>

                {/* rank chips */}
                <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap' }}>
                  <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'10px 18px', minWidth:120 }}>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff' }}>#{r.cityRank}</div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', color:'rgba(255,255,255,0.45)', fontFamily:'Montserrat,sans-serif' }}>
                      {(r.trialCity ?? '').toUpperCase()} {t('RANK', 'रैंक')}
                    </div>
                  </div>
                  {showPct && (
                    <div style={{ background:'rgba(232,178,61,0.08)', border:'1px solid rgba(232,178,61,0.35)', borderRadius:12, padding:'10px 18px', minWidth:120 }}>
                      <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#E8B23D' }}>{t('TOP', 'टॉप')} {pct}%</div>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', color:'rgba(255,255,255,0.45)', fontFamily:'Montserrat,sans-serif' }}>
                        {t('IN', 'में')} {(r.trialCity ?? '').toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═══ PERFORMANCE BREAKDOWN ═══ */}
          <div className="rcard" style={{ animation:'fadeUp .55s .25s ease both' }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, letterSpacing:'.16em', color:'#E8B23D', marginBottom:4 }}>
              {t('YOUR PERFORMANCE', 'आपका प्रदर्शन')}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:22 }}>
              {t('100-point assessment by BCCI-certified scouts', 'BCCI-certified scouts का 100-point मूल्यांकन')}
            </div>
            {(r.breakdown ?? []).map((b, i) => (
              <div key={b.key} style={{ marginBottom: 16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.78)' }}>{critLabel(b.key, role, t)}</span>
                  <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#fff' }}>
                    {b.score}<span style={{ color:'rgba(255,255,255,0.35)', fontWeight:700, fontSize:12 }}>/{b.max}</span>
                  </span>
                </div>
                <div style={{ height:9, borderRadius:6, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:6, background:'linear-gradient(90deg,#FF7A29,#E8B23D)', width: barsOn ? Math.round((b.score / b.max) * 100) + '%' : '0%', transition:'width .9s cubic-bezier(.25,.9,.3,1) ' + (0.15 + i * 0.12) + 's' }} />
                </div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:16, marginTop:20 }}>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, letterSpacing:'.1em', color:'rgba(255,255,255,0.6)' }}>{t('TOTAL', 'कुल')}</span>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#E8B23D' }}>{r.total} / 100</span>
            </div>
          </div>

          {/* ═══ STANDING ═══ */}
          <div className="rcard" style={{ animation:'fadeUp .55s .35s ease both' }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, letterSpacing:'.16em', color:'#E8B23D', marginBottom:18 }}>
              {t('YOUR BCPL STANDING', 'आपकी BCPL रैंकिंग')}
            </div>
            <div className="grid2r">
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 18px' }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:28, color:'#fff', marginBottom:2 }}>#{r.cityRank} <span style={{ fontSize:14, color:'rgba(255,255,255,0.35)' }}>/ {r.cityCount}</span></div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>
                  {t('Overall rank among evaluated players in ' + (r.trialCity ?? ''), (r.trialCity ?? '') + ' के सभी evaluated players में overall रैंक')}
                </div>
              </div>
              {showRole ? (
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 18px' }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:28, color:'#fff', marginBottom:2 }}>#{r.roleRank} <span style={{ fontSize:14, color:'rgba(255,255,255,0.35)' }}>/ {r.roleCount}</span></div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>
                    {t(roleLabel + ' rank in ' + (r.trialCity ?? ''), (r.trialCity ?? '') + ' में ' + roleLabel + ' रैंक')}
                  </div>
                </div>
              ) : (
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 18px', display:'flex', alignItems:'center' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>
                    {t('Role-wise rank will appear once enough players of your role are evaluated.', 'आपके रोल के पर्याप्त players evaluate होने पर role-wise रैंक दिखेगी।')}
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop:14, fontSize:12, color:'rgba(255,255,255,0.42)', lineHeight:1.7, background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 14px' }}>
              💡 {t('Selection is not decided by score alone — scouts also balance roles, city squads and Phase 2 capacity. There is no single cut-off mark.',
                    'Selection सिर्फ़ score से तय नहीं होता — scouts role balance, शहर की squad और Phase 2 capacity भी देखते हैं। कोई एक cut-off नंबर नहीं होता।')}
            </div>
          </div>

          {/* ═══ QUALIFIED → NEXT STEP ═══ */}
          {qualified && (
            <div className="rcard" style={{ animation:'fadeUp .55s .45s ease both', border:'1px solid rgba(255,122,41,0.3)', background:'linear-gradient(150deg,rgba(255,122,41,0.09),#0A1727 55%)' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, letterSpacing:'.16em', color:'#FF7A29', marginBottom:6 }}>
                {t('YOUR NEXT STEP', 'आपका अगला कदम')}
              </div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(19px,4vw,24px)', color:'#fff', marginBottom:10 }}>
                {t('PHASE 2 — PHYSICAL TRIAL', 'PHASE 2 — फ़िज़िकल ट्रायल')}
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.7, marginBottom:18 }}>
                {t('Ground trial in ' + (r.trialCity ?? 'your city') + ' → franchise evaluation → live auction. Secure your spot now.',
                   (r.trialCity ?? 'आपके शहर') + ' में ground trial → franchise evaluation → live auction। अभी अपनी जगह पक्की करें।')}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <button className="btn-orange" style={{ padding:'16px 30px', fontSize:14, flex:'1 1 240px' }}
                  onClick={() => { window.location.href = BASE + 'register/phase2'; }}>
                  {t('PROCEED TO PHASE 2 — ₹', 'PHASE 2 में जाएँ — ₹') + phase2Fee.toLocaleString('en-IN') + ' →'}
                </button>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', flex:'1 1 160px' }}>
                  {t('Fee incl. GST. Your Phase 2 spot is reserved for a limited time.', 'Fee GST सहित। आपकी Phase 2 सीट सीमित समय के लिए reserved है।')}
                </div>
              </div>
            </div>
          )}

          {/* ═══ NOT SHORTLISTED → STRENGTHS + PATH FORWARD ═══ */}
          {!qualified && (
            <>
              <div className="grid2r" style={{ marginBottom:18, animation:'fadeUp .55s .45s ease both' }}>
                {strongest && (
                  <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:16, padding:'20px 18px' }}>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.14em', color:'#22C55E', marginBottom:8 }}>
                      💪 {t('YOUR STRONGEST AREA', 'आपकी सबसे मज़बूत स्किल')}
                    </div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:17, color:'#fff', marginBottom:4 }}>
                      {critLabel(strongest.key, role, t)}
                    </div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)' }}>
                      {strongest.score}/{strongest.max} — {t('keep building on this. It is a real strength.', 'इसे और मज़बूत करते रहें। यह आपकी असली ताकत है।')}
                    </div>
                  </div>
                )}
                {weakest && (
                  <div style={{ background:'rgba(255,122,41,0.05)', border:'1px solid rgba(255,122,41,0.25)', borderRadius:16, padding:'20px 18px' }}>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.14em', color:'#FF7A29', marginBottom:8 }}>
                      🎯 {t('AREA TO WORK ON', 'किस पर काम करें')}
                    </div>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:17, color:'#fff', marginBottom:4 }}>
                      {critLabel(weakest.key, role, t)}
                    </div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                      {improveTip(weakest.key, role, t)}
                    </div>
                  </div>
                )}
              </div>

              {r.selectorNote && (
                <div className="rcard" style={{ animation:'fadeUp .55s .5s ease both', borderLeft:'4px solid #E8B23D' }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.14em', color:'#E8B23D', marginBottom:10 }}>
                    📝 {t("SELECTOR'S NOTE FOR YOU", 'SELECTOR का आपके लिए नोट')}
                  </div>
                  <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.8, fontStyle:'italic' }}>
                    “{r.selectorNote}”
                  </div>
                </div>
              )}

              <div className="rcard" style={{ animation:'fadeUp .55s .55s ease both' }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, letterSpacing:'.16em', color:'rgba(255,255,255,0.55)', marginBottom:10 }}>
                  {t('WHAT THIS MEANS', 'इसका मतलब क्या है')}
                </div>
                <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.6)', lineHeight:1.8 }}>
                  {t('You have not qualified for Phase 2 in this selection cycle. This is a checkpoint, not a verdict on your cricket. Your score and rank above show exactly where you stand — and exactly what to train next.',
                     'इस selection cycle में आप Phase 2 के लिए qualify नहीं हुए। यह एक पड़ाव है — आपके cricket पर आख़िरी फ़ैसला नहीं। ऊपर का score और रैंक दिखाता है कि आप कहाँ खड़े हैं — और अब किस चीज़ पर मेहनत करनी है।')}
                </div>
                <div style={{ marginTop:14, background:'rgba(232,178,61,0.06)', border:'1px solid rgba(232,178,61,0.2)', borderRadius:12, padding:'14px 16px', fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.7 }}>
                  🏆 {t('BCPL Season 6 trials open in approximately 6 months. Many players who missed one season came back stronger and got picked in the auction.',
                        'BCPL Season 6 के trials लगभग 6 महीने में खुलेंगे। कई players एक season चूकने के बाद और मज़बूत होकर लौटे और auction में चुने गए।')}
                </div>
              </div>
            </>
          )}

          {/* ═══ SHARE ═══ */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:18, animation:'fadeUp .55s .6s ease both' }}>
            <button className="btn-ghost" style={{ flex:'1 1 220px', padding:'15px 20px', fontSize:13 }}
              onClick={() => { void downloadShareCard(r, roleLabel, qualified); }}>
              📤 {t('DOWNLOAD SHARE CARD', 'SHARE CARD डाउनलोड करें')}
            </button>
            <button className="btn-ghost" style={{ flex:'1 1 220px', padding:'15px 20px', fontSize:13 }}
              onClick={() => { window.location.href = BASE + 'profile'; }}>
              👤 {t('GO TO MY PROFILE', 'मेरी PROFILE पर जाएँ')}
            </button>
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center', lineHeight:1.7 }}>
            {t('Your scorecard is personal — BCPL never publishes a public merit list. The share card contains only your name, role, score and rank.',
               'आपका scorecard निजी है — BCPL कोई public merit list नहीं छापता। Share card में सिर्फ़ आपका नाम, रोल, score और रैंक होता है।')}
          </div>
        </div>
      )}

      <BCPLFooter />
    </div>
  );
}
