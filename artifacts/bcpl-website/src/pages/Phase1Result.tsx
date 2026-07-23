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
import { getMyResult, sendResultFeedback, isAuthenticated, type MyResult } from '../lib/api';
import { useLang } from '../lib/i18n';
import { Link, useLocation } from 'wouter';


const ROLE_LABELS: Record<string, { en: string; hi: string }> = {
  bat:  { en: 'Batsman',       hi: 'बल्लेबाज़' },
  bowl: { en: 'Bowler',        hi: 'गेंदबाज़' },
  wk:   { en: 'Wicket-Keeper', hi: 'विकेट-कीपर' },
  ar:   { en: 'All-Rounder',   hi: 'ऑल-राउंडर' },
};
const PHASE2_FEES: Record<string, number> = { bat: 2000, bowl: 2000, wk: 2000, ar: 3000 };

/** AI video-trial rubric categories (per-role, §§20–23) — bilingual labels + honest improvement tips. */
const AI_CRIT: Record<string, { en: string; hi: string; tip: { en: string; hi: string } }> = {
  balanceSetup:        { en: 'Balance & Setup',        hi: 'बैलेंस और सेटअप',        tip: { en: 'Groove a stable stance and still head at the crease — balance is the base of every shot.', hi: 'स्थिर स्टांस और स्थिर सिर की प्रैक्टिस करें — बैलेंस ही हर शॉट की नींव है।' } },
  footwork:            { en: 'Footwork',                hi: 'फुटवर्क',                 tip: { en: 'Daily front-foot / back-foot drills will sharpen decisive movement to the pitch of the ball.', hi: 'रोज़ front-foot / back-foot drills करें — गेंद तक की मूवमेंट तेज़ होगी।' } },
  shotExecution:       { en: 'Shot Execution',          hi: 'शॉट एग्ज़ीक्यूशन',        tip: { en: 'Repeat one shot till it lands clean 8 times out of 10 before adding the next.', hi: 'एक शॉट को तब तक दोहराएँ जब तक 10 में से 8 बार सही न लगे।' } },
  timingControl:       { en: 'Timing & Control',        hi: 'टाइमिंग और कंट्रोल',      tip: { en: 'Slow the swing down — meet the ball under your eyes and let timing beat power.', hi: 'स्विंग धीमा करें — गेंद को आँखों के नीचे खेलें, ताकत से ज़्यादा टाइमिंग पर भरोसा करें।' } },
  adaptability:        { en: 'Range / Adaptability',    hi: 'रेंज और अनुकूलन',         tip: { en: 'Show more range next time — attack, defend and rotate strike in the same session.', hi: 'अगली बार ज़्यादा रेंज दिखाएँ — अटैक, डिफेंस और स्ट्राइक रोटेशन एक ही सेशन में।' } },
  gameReadiness:       { en: 'Game Readiness',          hi: 'गेम रेडीनेस',             tip: { en: 'Train match situations, not just nets — plan each ball like a real game.', hi: 'सिर्फ नेट्स नहीं, मैच सिचुएशन की प्रैक्टिस करें — हर गेंद को असली मैच की तरह खेलें।' } },
  evidenceReliability: { en: 'Video Evidence Quality',  hi: 'वीडियो एविडेंस क्वालिटी', tip: { en: 'Next time record in good light with a steady camera and your full action clearly visible.', hi: 'अगली बार अच्छी रोशनी, स्थिर कैमरा और पूरा एक्शन साफ़ दिखाते हुए रिकॉर्ड करें।' } },
  runUpRhythm:         { en: 'Run-up & Rhythm',         hi: 'रन-अप और रिदम',           tip: { en: 'Mark a consistent run-up and repeat it till the rhythm feels automatic.', hi: 'एक फिक्स रन-अप बनाएं और उसे तब तक दोहराएँ जब तक रिदम अपने-आप न आए।' } },
  actionRelease:       { en: 'Action & Release',        hi: 'एक्शन और रिलीज़',         tip: { en: 'Film your action side-on and work on a repeatable, braced release position.', hi: 'अपना एक्शन side-on रिकॉर्ड करें और एक जैसी रिलीज़ पोज़िशन पर काम करें।' } },
  controlEvidence:     { en: 'Line & Length Control',   hi: 'लाइन-लेंथ कंट्रोल',       tip: { en: 'Bowl at one marked spot — 30 balls a day. Consistency of line-length wins trials.', hi: 'एक निशान पर रोज़ 30 गेंदें डालें — लाइन-लेंथ की consistency ही ट्रायल जिताती है।' } },
  paceSpinEvidence:    { en: 'Pace / Spin Threat',      hi: 'पेस / स्पिन का दम',       tip: { en: 'Build your stock-ball threat first — genuine pace or real turn — before variations.', hi: 'पहले अपनी main गेंद का दम बढ़ाएँ — असली पेस या असली टर्न — फिर वेरिएशन।' } },
  variationEvidence:   { en: 'Variations',              hi: 'वेरिएशन',                 tip: { en: 'Master ONE reliable variation and show it clearly in your next video.', hi: 'एक भरोसेमंद वेरिएशन पक्का करें और अगली वीडियो में साफ़ दिखाएँ।' } },
  repeatability:       { en: 'Repeatability',           hi: 'रिपीटेबिलिटी',            tip: { en: 'Bowl longer spells in practice — the skill is doing it again and again, not once.', hi: 'प्रैक्टिस में लंबे स्पेल डालें — हुनर एक बार नहीं, बार-बार करने में है।' } },
  battingAbility:      { en: 'Batting Ability',         hi: 'बैटिंग क्षमता',           tip: { en: 'Sharpen shot selection and core batting fundamentals with daily focused drills.', hi: 'रोज़ाना focused drills से शॉट सिलेक्शन और बैटिंग के बेसिक्स मज़बूत करें।' } },
  bowlingAbility:      { en: 'Bowling Ability',         hi: 'बॉलिंग क्षमता',           tip: { en: 'Give your bowling equal practice time — an all-rounder needs both skills match-ready.', hi: 'बॉलिंग को भी बराबर समय दें — ऑल-राउंडर के दोनों हुनर match-ready होने चाहिए।' } },
  techniqueExecution:  { en: 'Technique & Execution',   hi: 'तकनीक और एग्ज़ीक्यूशन',   tip: { en: 'Daily drills on stance, grip and basics will lift this fast.', hi: 'स्टांस, ग्रिप और बेसिक्स की रोज़ाना drills से यह जल्दी सुधरेगा।' } },
  athleticMovement:    { en: 'Athletic Movement',       hi: 'फिटनेस और मूवमेंट',       tip: { en: 'Add sprint, agility and fielding sessions to your weekly routine.', hi: 'हफ़्ते की routine में sprint, agility और fielding sessions जोड़ें।' } },
  keepingTechnique:    { en: 'Keeping Technique',       hi: 'कीपिंग तकनीक',            tip: { en: 'Daily glove work — clean catching position, soft hands, head steady behind the ball.', hi: 'रोज़ glove work करें — सही कैचिंग पोज़िशन, soft hands, गेंद के पीछे स्थिर सिर।' } },
  movementPositioning: { en: 'Movement & Positioning',  hi: 'मूवमेंट और पोज़िशनिंग',   tip: { en: 'Practise lateral movement drills — be set in position before the ball arrives.', hi: 'lateral movement drills करें — गेंद आने से पहले पोज़िशन में सेट रहें।' } },
  receivingHands:      { en: 'Receiving / Hands',       hi: 'कैचिंग / हैंड्स',         tip: { en: 'Take 100 clean catches a day — soft hands close to the body.', hi: 'रोज़ 100 क्लीन कैच लें — शरीर के पास soft hands से।' } },
  stumpingReaction:    { en: 'Stumping & Reactions',    hi: 'स्टंपिंग और रिएक्शन',     tip: { en: 'Speed up glove-to-stump work with reaction drills off a wall or partner.', hi: 'दीवार या पार्टनर के साथ reaction drills से glove-to-stump स्पीड बढ़ाएँ।' } },
  battingEvidence:     { en: 'Batting Evidence',        hi: 'बैटिंग एविडेंस',          tip: { en: 'Show clear batting contribution too — a keeper who bats doubles his value.', hi: 'बैटिंग भी साफ़ दिखाएँ — जो कीपर बैटिंग करता है उसकी value दोगुनी होती है।' } },
};

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
  const ai = AI_CRIT[key];
  if (ai) return t(ai.en, ai.hi);
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
  const ai = AI_CRIT[key];
  if (ai) return t(ai.tip.en, ai.tip.hi);
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
      document.fonts.load('900 300px "Barlow Condensed"'),
      document.fonts.load('800 44px "Barlow Condensed"'),
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
  ctx.fillStyle = '#E8B23D'; ctx.font = '800 46px "Barlow Condensed", sans-serif';
  ctx.fillText('BCPL • SEASON 5', W / 2, 160);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '700 30px Inter, sans-serif';
  ctx.fillText('PHASE 1 — VIDEO TRIAL ASSESSMENT', W / 2, 215);

  const name = (r.name || '').toUpperCase();
  ctx.fillStyle = '#FFFFFF'; ctx.font = '900 74px "Barlow Condensed", sans-serif';
  ctx.fillText(name.length > 18 ? name.slice(0, 17) + '…' : name, W / 2, 345);
  ctx.fillStyle = '#FF7A29'; ctx.font = '800 38px "Barlow Condensed", sans-serif';
  ctx.fillText(roleLabel.toUpperCase() + (r.trialCity ? '  •  ' + r.trialCity.toUpperCase() : ''), W / 2, 410);

  ctx.fillStyle = '#E8B23D'; ctx.font = '900 300px "Barlow Condensed", sans-serif';
  ctx.fillText(String(r.total ?? 0), W / 2, 790);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '800 44px "Barlow Condensed", sans-serif';
  ctx.fillText('/ 100  BCPL SCORE', W / 2, 865);

  ctx.fillStyle = '#FFFFFF'; ctx.font = '800 46px "Barlow Condensed", sans-serif';
  ctx.fillText((r.trialCity || '').toUpperCase() + ' RANK  #' + (r.cityRank ?? '—'), W / 2, 985);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '700 30px Inter, sans-serif';
  ctx.fillText('among ' + (r.cityCount ?? 0) + ' evaluated players', W / 2, 1035);

  if (qualified) {
    ctx.fillStyle = 'rgba(34,197,94,0.15)'; rr(ctx, W / 2 - 330, 1085, 660, 92, 46); ctx.fill();
    ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 3; rr(ctx, W / 2 - 330, 1085, 660, 92, 46); ctx.stroke();
    ctx.fillStyle = '#22C55E'; ctx.font = '900 42px "Barlow Condensed", sans-serif';
    ctx.fillText('✓ QUALIFIED FOR PHASE 2', W / 2, 1147);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; rr(ctx, W / 2 - 300, 1085, 600, 92, 46); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 3; rr(ctx, W / 2 - 300, 1085, 600, 92, 46); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '900 42px "Barlow Condensed", sans-serif';
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
  const [, navigate]          = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState<MyResult | null>(null);
  const [stage, setStage]     = useState<'intro' | 'result'>('intro');
  const [flash, setFlash]     = useState(false);
  const [barsOn, setBarsOn]   = useState(false);
  const [demo, setDemo]       = useState(false);
  const [fbRating, setFbRating]   = useState('');
  const [fbComment, setFbComment] = useState('');
  const [fbSaved, setFbSaved]     = useState(false);
  const [fbBusy, setFbBusy]       = useState(false);
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
    if (!isAuthenticated()) { navigate('/register'); return; }
    getMyResult()
      .then(r => {
        // Pre-result states keep their original destinations:
        if (r.reason === 'not_registered' || r.phase1Status === 'pending') {
          navigate('/register'); return;
        }
        if (r.phase1Status === 'payment_done') {
          navigate('/register/upload-video'); return;
        }
        setResult(r);
        if (r.myFeedback) {
          setFbRating(r.myFeedback.rating);
          setFbComment(r.myFeedback.comment ?? '');
          setFbSaved(true);
        }
      })
      .catch((e: any) => setError(e?.message ?? t('Failed to load result. Please refresh.', 'रिजल्ट लोड करने में विफल। कृपया रीफ्रेश करें।')))
      .finally(() => setLoading(false));
    return () => { timers.current.forEach(id => window.clearTimeout(id)); };
  }, [navigate, t]);

  const reveal = () => {
    setFlash(true);
    setStage('result');
    timers.current.push(window.setTimeout(() => setFlash(false), 950));
    timers.current.push(window.setTimeout(() => setBarsOn(true), 350));
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* noop */ }
  };

  // §41 — process-clarity feedback (both outcomes; edits allowed, never suppressed)
  const submitFeedback = async () => {
    if (!fbRating || fbBusy) return;
    if (demo) { setFbSaved(true); return; }
    setFbBusy(true);
    try {
      await sendResultFeedback(fbRating as 'not_clear' | 'mostly_clear' | 'very_clear', fbComment.trim() || undefined);
      setFbSaved(true);
    } catch { /* keep the form editable so the player can retry */ }
    setFbBusy(false);
  };

  const r = result;
  const qualified = r?.decision === 'qualified';
  const role      = normRole(r?.role);
  const roleInfo  = ROLE_LABELS[role] ?? { en: r?.role ?? '', hi: r?.role ?? '' };
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
    .split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '';

  const statusColor = qualified ? 'var(--green)' : 'var(--ink-2)';
  const scoreValue = r?.total ?? 0;
  // Circle circumference is 2 * PI * r = 2 * 3.14159 * 46 = 289.026
  const circ = 289.026;
  const dashoffset = circ - (circ * scoreValue / 100);

  return (
    <div style={{ background:'var(--bg)', minHeight:'100dvh', fontFamily:"var(--font-body)", color:'var(--ink)', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .W{max-width:1200px;margin:0 auto;padding:0 20px}
        @media(min-width:768px){.W{padding:0 32px}}
        .rwrap{max-width:680px;margin:0 auto;padding:0 20px}
        
        .btn-gold{background:linear-gradient(135deg,var(--gold),#C4901E);border:none;border-radius:var(--r);color:#081020;font-family:'Barlow Condensed',sans-serif;font-weight:900;fontSize:16px;letter-spacing:.08em;cursor:pointer;transition:transform .15s,filter .2s;text-transform:uppercase;display:inline-flex;align-items:center;justify-content:center;}
        .btn-gold:hover{filter:brightness(1.1);transform:translateY(-2px)}
        .btn-orange{background:linear-gradient(135deg,var(--orange),var(--orange-2));border:none;border-radius:var(--r);color:#fff;font-family:'Barlow Condensed',sans-serif;font-weight:900;fontSize:16px;letter-spacing:.08em;cursor:pointer;transition:transform .15s,filter .2s;text-transform:uppercase;display:inline-flex;align-items:center;justify-content:center;}
        .btn-orange:hover{filter:brightness(1.12);transform:translateY(-2px)}
        .btn-ghost{background:rgba(255,255,255,0.05);border:1px solid var(--line);border-radius:var(--r);color:var(--ink-2);font-family:'Barlow Condensed',sans-serif;font-weight:800;fontSize:15px;letter-spacing:.06em;cursor:pointer;transition:all .2s;text-transform:uppercase;display:inline-flex;align-items:center;justify-content:center;}
        .btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
        
        .rcard{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:24px 20px;margin-bottom:16px}
        @media(min-width:640px){.rcard{padding:32px}}
        .grid2r{display:grid;grid-template-columns:1fr;gap:16px}
        @media(min-width:600px){.grid2r{grid-template-columns:1fr 1fr}}
        
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardIn{0%{opacity:0;transform:scale(.9) translateY(30px)}60%{transform:scale(1.02) translateY(-4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes flashOut{0%{opacity:1}100%{opacity:0}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 60px rgba(232,178,61,0.15)}50%{box-shadow:0 0 100px rgba(232,178,61,0.3)}}
        @keyframes iconFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes confFall{0%{transform:translateY(-10vh) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}
        .conf{position:fixed;top:0;width:10px;height:16px;z-index:60;pointer-events:none;animation:confFall linear forwards}

        .score-circle-wrap { position: relative; width: 220px; height: 220px; margin: 0 auto 16px; display:flex; align-items:center; justify-content:center; }
        @media(min-width:480px){.score-circle-wrap { width: 260px; height: 260px; }}
        .score-circle-svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); overflow: visible; }
      `}</style>

      <SiteHeader />
      {demo && (
        <div style={{ position:'fixed', bottom:10, left:10, zIndex:99, background:'#7C3AED', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:12, letterSpacing:'.1em', padding:'6px 12px', borderRadius:6, opacity:.9, textTransform:'uppercase' }}>
          DEV PREVIEW — SAMPLE DATA
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60dvh', gap:16 }}>
          <div style={{ width:48, height:48, border:'4px solid rgba(232,178,61,0.15)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
          <div style={{ fontSize:15, color:'var(--ink-3)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase' }}>
            {t('Loading your result…', 'आपका रिजल्ट लोड हो रहा है…')}
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {!loading && error && (
        <div className="rwrap" style={{ paddingTop:80, textAlign:'center', paddingBottom:80 }}>
          <div style={{ width:80, height:80, margin:'0 auto 20px', background:'rgba(239,68,68,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--red)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div style={{ fontSize:15, color:'var(--red)', marginBottom:24, fontWeight:600 }}>{error}</div>
          <button onClick={() => window.location.reload()} className="btn-orange" style={{ padding:'14px 32px' }}>
            {t('REFRESH', 'रीफ्रेश')} →
          </button>
        </div>
      )}

      {/* ── STILL UNDER REVIEW (no score / no decision yet) ── */}
      {!loading && !error && r && !r.available && (
        <div className="rwrap" style={{ paddingTop:80, textAlign:'center', paddingBottom:100 }}>
          {r.phase1Status === 'selected' || r.phase1Status === 'rejected' ? (
            <>
              <div style={{ width:80, height:80, margin:'0 auto 20px', background:'rgba(232,178,61,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--gold)', marginBottom:16, textTransform:'uppercase' }}>
                {t('Your scorecard is being finalised', 'आपका स्कोरकार्ड तैयार किया जा रहा है')}
              </div>
              <div style={{ fontSize:15, color:'var(--ink-2)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
                {t('Your Phase 1 decision has been announced by SMS & email. Your detailed 100-point scorecard will appear here shortly.',
                   'आपका Phase 1 निर्णय SMS और ईमेल के माध्यम से घोषित कर दिया गया है। आपका विस्तृत 100-पॉइंट स्कोरकार्ड जल्द ही यहाँ दिखाई देगा।')}
              </div>
              {r.phase1Status === 'selected' && (
                <Link href="/register/phase2" className="btn-orange" style={{ marginTop:32, padding:'16px 36px' }}>
                  {t('CONTINUE TO PHASE 2', 'PHASE 2 की ओर बढ़ें')} →
                </Link>
              )}
            </>
          ) : (
            <>
              <div style={{ width:96, height:96, margin:'0 auto 24px', background:'rgba(168,85,247,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#A855F7', animation:'iconFloat 3s ease-in-out infinite' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'#A855F7', marginBottom:16, textTransform:'uppercase' }}>
                {t('Your Video is Under Review', 'आपका वीडियो समीक्षा के अधीन है')}
              </div>
              <div style={{ fontSize:15, color:'var(--ink-2)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
                {t('BCCI-certified scouts are doing a full 100-point evaluation of your trial video. You will get SMS + email the moment your result is ready.',
                   'BCCI-certified scouts आपके ट्रायल वीडियो का पूरा 100-पॉइंट मूल्यांकन कर रहे हैं। आपका परिणाम तैयार होते ही आपको SMS + ईमेल मिल जाएगा।')}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ANTICIPATION ── */}
      {!loading && !error && r?.available && stage === 'intro' && (
        <div style={{ position:'relative', minHeight:'80dvh', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 30%, rgba(232,178,61,0.1) 0%, transparent 60%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg, rgba(255,255,255,0.01) 0 1px, transparent 1px 32px)', pointerEvents:'none' }} />
          <div className="rwrap" style={{ textAlign:'center', position:'relative', zIndex:1, padding:'64px 20px' }}>
            <div style={{ width:100, height:100, margin:'0 auto 24px', background:'rgba(232,178,61,0.1)', border:'1px solid rgba(232,178,61,0.3)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)', animation:'iconFloat 3s ease-in-out infinite, glowPulse 2.4s ease infinite' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, letterSpacing:'.24em', color:'var(--gold)', marginBottom:16, textTransform:'uppercase' }}>
              BCPL SEASON 5 — {t('PHASE 1 ASSESSMENT', 'PHASE 1 मूल्यांकन')}
            </div>
            <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'clamp(42px,8vw,72px)', lineHeight:.95, textTransform:'uppercase', marginBottom:20, animation:'fadeUp .5s ease both' }}>
              <span style={{ color:'var(--ink)', display:'block' }}>{t('YOUR RESULT', 'आपका परिणाम')}</span>
              <span style={{ background:'linear-gradient(90deg,var(--gold),#FFE9A8,var(--gold))', backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'shimGold 3s linear infinite', display:'block' }}>
                {t('IS READY', 'तैयार है')}
              </span>
            </h1>
            <p style={{ color:'var(--ink-2)', fontSize:16, maxWidth:480, margin:'0 auto 36px', lineHeight:1.7, animation:'fadeUp .5s .1s ease both' }}>
              {t('BCCI-certified scouts have completed a full 100-point evaluation of your trial video.',
                 'BCCI-certified scouts ने आपके ट्रायल वीडियो का पूरा 100-पॉइंट मूल्यांकन पूरा कर लिया है।')}
            </p>
            <button className="btn-gold" onClick={reveal}
              style={{ padding:'18px 48px', animation:'fadeUp .5s .18s ease both, glowPulse 2.4s ease infinite' }}>
              {t('VIEW MY RESULT', 'मेरा परिणाम देखें')} →
            </button>
            <div style={{ marginTop:24, fontSize:13, color:'var(--ink-3)', fontWeight:500, animation:'fadeUp .5s .25s ease both' }}>
              {t('Every submitted video gets a complete evaluation.', 'सबमिट किए गए प्रत्येक वीडियो का पूरा मूल्यांकन किया जाता है।')}
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
          background: i % 3 === 0 ? 'var(--gold)' : i % 3 === 1 ? 'var(--orange)' : 'var(--green)',
          animationDuration: (2.2 + (i % 5) * 0.4) + 's',
          animationDelay: (i % 7) * 0.12 + 's',
          borderRadius: 4,
        }} />
      ))}

      {/* ── RESULT ── */}
      {!loading && !error && r?.available && stage === 'result' && (
        <div className="rwrap" style={{ paddingTop:40, paddingBottom:90 }}>

          {/* ═══ PLAYER SCORECARD ═══ */}
          <div style={{ borderRadius:24, padding:2, background: qualified
              ? 'linear-gradient(135deg,var(--gold),#7A5A14 40%,var(--gold) 70%,#FFE9A8)'
              : 'linear-gradient(135deg,rgba(127,180,232,0.6),rgba(46,80,115,0.5) 45%,rgba(127,180,232,0.4))',
            animation:'cardIn .7s cubic-bezier(.34,1.4,.64,1) both', marginBottom:24,
            boxShadow: qualified ? '0 24px 70px rgba(232,178,61,0.16)' : '0 24px 70px rgba(90,140,190,0.08)' }}>
            <div style={{ borderRadius:22, background:'var(--panel)', padding:'32px 24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 26px)', pointerEvents:'none' }} />
              <div style={{ position:'absolute', top:-120, right:-80, width:300, height:300, borderRadius:'50%', background: qualified ? 'radial-gradient(circle, rgba(232,178,61,0.15), transparent 65%)' : 'radial-gradient(circle, rgba(127,180,232,0.1), transparent 65%)', pointerEvents:'none' }} />

              {/* top strip */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, position:'relative' }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, letterSpacing:'.2em', color: qualified ? 'var(--gold)' : 'var(--ink-2)' }}>BCPL <span style={{ color:'var(--line)' }}>•</span> S5</div>
                {r.regNumber && (
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:12, letterSpacing:'.1em', color:'var(--ink-3)', border:'1px solid var(--line)', borderRadius:12, padding:'6px 12px' }}>
                    {r.regNumber}
                  </div>
                )}
              </div>

              {/* identity */}
              <div style={{ textAlign:'center', position:'relative' }}>
                <div style={{ width:100, height:100, borderRadius:'50%', margin:'0 auto 16px', background: qualified ? 'linear-gradient(135deg,var(--orange),var(--gold))' : 'linear-gradient(135deg,#3B82F6,#1E40AF)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:36, color:'#fff', border:'4px solid rgba(255,255,255,0.1)', boxShadow: qualified ? '0 12px 40px rgba(255,122,41,0.35)' : 'none' }}>
                  {initials}
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'clamp(28px,6vw,36px)', color:'var(--ink)', textTransform:'uppercase', letterSpacing:'.02em', marginBottom:10 }}>
                  {r.name}
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap', marginBottom:24 }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:13, letterSpacing:'.08em', color: qualified ? '#FF9A5C' : '#93C5FD', background: qualified ? 'rgba(255,122,41,0.12)' : 'rgba(59,130,246,0.12)', border:`1px solid ${qualified ? 'rgba(255,122,41,0.3)' : 'rgba(59,130,246,0.3)'}`, borderRadius:20, padding:'6px 16px', textTransform:'uppercase' }}>
                    {roleLabel}
                  </span>
                  {r.trialCity && (
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:13, letterSpacing:'.08em', color:'var(--ink-2)', background:'rgba(255,255,255,0.06)', border:'1px solid var(--line)', borderRadius:20, padding:'6px 16px', textTransform:'uppercase' }}>
                      {r.trialCity}
                    </span>
                  )}
                </div>

                {/* status band */}
                <div style={{ display:'inline-block', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, letterSpacing:'.14em', color:statusColor, background: qualified ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border:'1px solid ' + (qualified ? 'rgba(34,197,94,0.4)' : 'var(--line)'), borderRadius:12, padding:'10px 20px', marginBottom:32, textTransform:'uppercase' }}>
                  {qualified
                    ? '✓ ' + t('PHASE 1 QUALIFIED — SELECTED FOR PHASE 2', 'PHASE 1 क्वालिफाइड — PHASE 2 के लिए चयनित')
                    : '✓ ' + t('PHASE 1 ASSESSMENT COMPLETE', 'PHASE 1 मूल्यांकन पूरा')}
                </div>

                {/* Animated Score Circle */}
                <div className="score-circle-wrap">
                  <svg className="score-circle-svg" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle cx="50" cy="50" r="46" fill="none" stroke="var(--line)" strokeWidth="4" />
                    {/* Animated progress */}
                    <circle 
                      cx="50" cy="50" r="46" fill="none" 
                      stroke={qualified ? "url(#gold-grad)" : "var(--ink-3)"} 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      strokeDasharray={circ} 
                      strokeDashoffset={barsOn ? dashoffset : circ} 
                      style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s' }} 
                    />
                    <defs>
                      <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--gold)" />
                        <stop offset="100%" stopColor="#FFE9A8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Score text inside circle */}
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:12 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:12, letterSpacing:'.22em', color:'var(--ink-3)', marginBottom:2, textTransform:'uppercase' }}>
                      {t('BCPL SCORE', 'BCPL स्कोर')}
                    </div>
                    <div style={{ lineHeight:0.9, position:'relative', left:4 }}>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'clamp(56px,14vw,84px)', background: qualified ? 'linear-gradient(90deg,var(--gold),#FFE9A8,var(--gold))' : 'linear-gradient(90deg,#DCE9F5,#ffffff,#DCE9F5)', backgroundSize:'200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'shimGold 4s linear infinite' }}>
                        {r.total}
                      </span>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'clamp(20px,5vw,28px)', color:'var(--ink-3)', position:'absolute', bottom:10, right:-30 }}>/100</span>
                    </div>
                  </div>
                </div>

                {/* rank chips */}
                <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap', marginTop:16 }}>
                  {r.cityRank && (
                    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--line)', padding:'10px 18px', borderRadius:16, display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:12, letterSpacing:'.1em', color:'var(--ink-3)', textTransform:'uppercase' }}>{r.trialCity || 'CITY'} RANK</span>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--ink)' }}>#{r.cityRank}</span>
                      {showPct && <span style={{ background:'rgba(255,255,255,0.1)', color:'var(--ink)', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:8 }}>TOP {pct}%</span>}
                    </div>
                  )}
                  {r.roleRank && showRole && (
                    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--line)', padding:'10px 18px', borderRadius:16, display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:12, letterSpacing:'.1em', color:'var(--ink-3)', textTransform:'uppercase' }}>ROLE RANK</span>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--ink)' }}>#{r.roleRank}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:12, marginBottom:32 }}>
            <button className="btn-ghost" style={{ flex:1 }} onClick={() => downloadShareCard(r, roleLabel, qualified)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight:6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {t('SAVE CARD', 'कार्ड सेव करें')}
            </button>
            <button className="btn-ghost" style={{ flex:1 }} onClick={() => {
                const msg = encodeURIComponent(t(`🏏 I scored ${r.total}/100 in the BCPL Season 5 Phase 1 Trials! India's biggest corporate cricket league. Check it out at https://bcplt20.com`, `🏏 मैंने BCPL Season 5 Phase 1 Trials में ${r.total}/100 स्कोर किया! भारत की सबसे बड़ी कॉर्पोरेट क्रिकेट लीग। https://bcplt20.com पर देखें`));
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}>
              {t('SHARE', 'शेयर करें')}
            </button>
          </div>

          {/* ═══ NON-SELECTED NEXT STEPS ═══ */}
          {!qualified && (
            <div className="rcard" style={{ borderLeft:'4px solid var(--orange)' }}>
              <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--ink)', textTransform:'uppercase', marginBottom:12, letterSpacing:'.04em' }}>
                {t('Your Journey Doesn\'t End Here', 'आपकी यात्रा यहीं समाप्त नहीं होती')}
              </h3>
              <p style={{ color:'var(--ink-2)', fontSize:14, lineHeight:1.7, marginBottom:16 }}>
                {t('Thank you for participating in the BCPL Season 5 trials. While you haven\'t progressed to Phase 2 in this selection cycle, your dedication to the sport is commendable.',
                   'BCPL Season 5 ट्रायल्स में भाग लेने के लिए धन्यवाद। यद्यपि आप इस चयन चक्र में Phase 2 के लिए आगे नहीं बढ़े हैं, खेल के प्रति आपका समर्पण सराहनीय है।')}
              </p>
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--line)', borderRadius:12, padding:16 }}>
                <p style={{ color:'var(--ink-3)', fontSize:13, lineHeight:1.6, marginBottom:0 }}>
                  {t('We encourage you to use the feedback below to improve your game. Season 6 registrations will open soon.', 'हम आपको अपने खेल में सुधार करने के लिए नीचे दिए गए फीडबैक का उपयोग करने के लिए प्रोत्साहित करते हैं। Season 6 के रजिस्ट्रेशन जल्द ही खुलेंगे।')}
                </p>
              </div>
            </div>
          )}

          {/* ═══ FEEDBACK & NEXT STEPS ═══ */}
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, letterSpacing:'.16em', color:'var(--ink-3)', marginBottom:16, textTransform:'uppercase' }}>
            {t('BCPL Assessment Feedback', 'BCPL मूल्यांकन फीडबैक')}
          </div>

          <div className="grid2r">
            {/* Strengths & Weaknesses automatically derived */}
            {strongest && (
              <div className="rcard" style={{ marginBottom:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(34,197,94,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--green)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--green)', textTransform:'uppercase', letterSpacing:'.04em' }}>{t('Key Strength', 'मुख्य ताकत')}</div>
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:'var(--ink)', marginBottom:6, textTransform:'uppercase' }}>
                  {critLabel(strongest.key, role, t)}
                </div>
                <div style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.6 }}>
                  {t('Your strongest area during the video evaluation. Keep refining this competitive edge.', 'वीडियो मूल्यांकन के दौरान आपका सबसे मजबूत क्षेत्र। इस प्रतिस्पर्धात्मक बढ़त को सुधारते रहें।')}
                </div>
              </div>
            )}

            {weakest && (
              <div className="rcard" style={{ marginBottom:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,122,41,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--orange)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--orange)', textTransform:'uppercase', letterSpacing:'.04em' }}>{t('Area to Improve', 'सुधार का क्षेत्र')}</div>
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:'var(--ink)', marginBottom:6, textTransform:'uppercase' }}>
                  {critLabel(weakest.key, role, t)}
                </div>
                <div style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.6 }}>
                  {improveTip(weakest.key, role, t)}
                </div>
              </div>
            )}
          </div>

          {/* Selector Note */}
          {r.selectorNote && (
            <div className="rcard" style={{ marginTop:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--ink)', textTransform:'uppercase', letterSpacing:'.04em' }}>{t('Selector Note', 'चयनकर्ता का नोट')}</div>
              </div>
              <div style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.7, fontStyle:'italic' }}>
                "{r.selectorNote}"
              </div>
            </div>
          )}

          {/* Detailed Breakdown */}
          <div style={{ marginTop:40 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, letterSpacing:'.16em', color:'var(--ink-3)', marginBottom:16, textTransform:'uppercase' }}>
              {t('100-Point Breakdown', '100-पॉइंट विवरण')}
            </div>
            <div className="rcard" style={{ padding:0, overflow:'hidden' }}>
              {(r.breakdown ?? []).map((b, i, arr) => (
                <div key={b.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:'var(--ink-2)' }}>{critLabel(b.key, role, t)}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:60, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', background: qualified ? 'var(--gold)' : 'var(--ink-3)', width: barsOn ? `${(b.score / b.max) * 100}%` : '0%', transition:'width 1s cubic-bezier(.34,1.56,.64,1) .8s' }} />
                    </div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:'var(--ink)', width:40, textAlign:'right' }}>
                      {b.score} <span style={{ color:'var(--ink-3)' }}>/{b.max}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualified Next Steps */}
          {qualified && (
            <div style={{ marginTop:48 }}>
              <div style={{ background:'var(--panel)', border:'1px solid var(--gold)', borderRadius:'var(--r)', padding:32, textAlign:'center', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 0%, rgba(232,178,61,0.15) 0%, transparent 60%)', pointerEvents:'none' }} />
                <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--gold)', textTransform:'uppercase', marginBottom:12, letterSpacing:'.04em' }}>
                  {t('Prepare For The Physical Trial', 'फिजिकल ट्रायल की तैयारी करें')}
                </h3>
                <p style={{ color:'var(--ink-2)', fontSize:15, lineHeight:1.6, maxWidth:480, margin:'0 auto 24px' }}>
                  {t(`Congratulations on passing Phase 1. Your next step is the Phase 2 physical ground trial in ${r.trialCity}. Complete your Phase 2 payment (₹${phase2Fee}) to secure your trial slot.`,
                     `Phase 1 पास करने पर बधाई। आपका अगला कदम ${r.trialCity} में Phase 2 फिजिकल ग्राउंड ट्रायल है। अपना ट्रायल स्लॉट सुरक्षित करने के लिए अपना Phase 2 भुगतान (₹${phase2Fee}) पूरा करें।`)}
                </p>
                <Link href="/register/phase2" className="btn-orange" style={{ padding:'16px 36px', fontSize:16, width:'100%', maxWidth:320 }}>
                  {t('PROCEED TO PHASE 2', 'PHASE 2 की ओर बढ़ें')} →
                </Link>
              </div>
            </div>
          )}

          {/* ═══ §41 PROCESS-CLARITY FEEDBACK (both outcomes) ═══ */}
          <div className="rcard" style={{ marginTop:48 }}>
            <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--ink)', textTransform:'uppercase', marginBottom:8, letterSpacing:'.04em' }}>
              {t('Was the BCPL Phase 1 process clear?', 'क्या BCPL Phase 1 प्रक्रिया स्पष्ट थी?')}
            </h3>
            <p style={{ color:'var(--ink-3)', fontSize:13, lineHeight:1.6, marginBottom:18 }}>
              {t('Your feedback helps us improve the trial experience for every player.', 'आपका फीडबैक हर खिलाड़ी के लिए ट्रायल अनुभव बेहतर बनाने में मदद करता है।')}
            </p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
              {([['not_clear', 'Not Clear', 'स्पष्ट नहीं'], ['mostly_clear', 'Mostly Clear', 'कुछ हद तक स्पष्ट'], ['very_clear', 'Very Clear', 'पूरी तरह स्पष्ट']] as const).map(([v, en, hi]) => (
                <button key={v} onClick={() => { setFbRating(v); setFbSaved(false); }}
                  style={{ padding:'10px 20px', borderRadius:20, cursor:'pointer', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, letterSpacing:'.06em', textTransform:'uppercase', transition:'all .2s',
                    background: fbRating === v ? 'rgba(232,178,61,0.15)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid ' + (fbRating === v ? 'var(--gold)' : 'var(--line)'),
                    color: fbRating === v ? 'var(--gold)' : 'var(--ink-2)' }}>
                  {t(en, hi)}
                </button>
              ))}
            </div>
            <textarea value={fbComment} maxLength={1000} rows={3}
              onChange={e => { setFbComment(e.target.value); setFbSaved(false); }}
              placeholder={t('Anything else you want to tell us? (optional)', 'कुछ और बताना चाहते हैं? (वैकल्पिक)')}
              style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid var(--line)', borderRadius:12, padding:'12px 14px', color:'var(--ink)', fontFamily:'Inter,sans-serif', fontSize:14, lineHeight:1.6, resize:'vertical', marginBottom:16, outline:'none' }} />
            <button className="btn-gold" onClick={submitFeedback} disabled={!fbRating || fbBusy}
              style={{ padding:'12px 28px', opacity: !fbRating || fbBusy ? 0.5 : 1, cursor: !fbRating || fbBusy ? 'default' : 'pointer' }}>
              {fbSaved ? '✓ ' + t('SAVED — THANK YOU', 'सेव हो गया — धन्यवाद') : t('SUBMIT FEEDBACK', 'फीडबैक भेजें')}
            </button>
          </div>

        </div>
      )}

      <BCPLFooter />
    </div>
  );
}
