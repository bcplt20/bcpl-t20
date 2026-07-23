import { useState, useEffect } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getDashboard, getPlayerTrialVenue, getMyResult, type MyResult } from '../lib/api';
import { ReferralCard } from '../components/ReferralCard';
import { clearSession, getSession } from '../lib/auth';

const BASE = import.meta.env.BASE_URL;

// ── Role display labels ───────────────────────────────────────────────────────
const ROLE_LABEL: Record<string,string> = {
  batsman:'Batsman', bowler:'Bowler', allrounder:'All-Rounder',
  wicketkeeper:'Wicket-Keeper', wicketkeeper_batsman:'WK-Batsman',
};
const ROLE_ICON: Record<string,string> = {
  batsman:'🏏', bowler:'🎯', allrounder:'⚡',
  wicketkeeper:'🧤', wicketkeeper_batsman:'🧤',
};

// ── Derive current step from dashboard data ───────────────────────────────────
type Step =
  | 'not_registered'
  | 'upload_video'
  | 'under_review'
  | 'rejected'
  | 'p2_register'
  | 'p2_kyc'
  | 'p2_kyc_pending'
  | 'trial_wait'
  | 'trial_announced';

function deriveStep(data: any, trialFound: boolean): Step {
  if (!data?.registered) return 'not_registered';
  const reg  = data.registration;
  const p1   = reg?.phase1Status  ?? '';
  const p2   = reg?.phase2Status  ?? null;
  const kyc  = data?.kyc?.status  ?? null;

  if (p1 === 'rejected')                                            return 'rejected';
  if (!data.video?.submitted)                                       return 'upload_video';
  if (p1 !== 'selected')                                            return 'under_review';
  if (!p2)                                                          return 'p2_register';
  if (p2 === 'payment_done' && (!kyc || kyc === 'failed'))          return 'p2_kyc';
  if (p2 === 'payment_done' && kyc === 'pending')                   return 'p2_kyc_pending';
  if ((p2 === 'kyc_done' || kyc === 'verified') && trialFound)      return 'trial_announced';
  if (p2 === 'kyc_done'   || kyc === 'verified')                    return 'trial_wait';
  return 'under_review';
}

// ── Journey nodes ─────────────────────────────────────────────────────────────
function journeyNodes(step: Step) {
  const done    = (l: string) => ({ label: l, state: 'done'    as const });
  const active  = (l: string) => ({ label: l, state: 'active'  as const });
  const waiting = (l: string) => ({ label: l, state: 'waiting' as const });

  type Node = ReturnType<typeof done> | ReturnType<typeof active> | ReturnType<typeof waiting>;
  const map: Record<Step, Node[]> = {
    not_registered:   [active('Register'),        waiting('Upload Video'), waiting('Phase 1 Review'),   waiting('Phase 2 + KYC'),    waiting('Physical Trial')],
    upload_video:     [done('Register'),           active('Upload Video'),  waiting('Phase 1 Review'),   waiting('Phase 2 + KYC'),    waiting('Physical Trial')],
    under_review:     [done('Register'),           done('Upload Video'),    active('Phase 1 Review'),    waiting('Phase 2 + KYC'),    waiting('Physical Trial')],
    rejected:         [done('Register'),           done('Upload Video'),    active('Not Selected'),      waiting('Phase 2 + KYC'),    waiting('Physical Trial')],
    p2_register:      [done('Register'),           done('Upload Video'),    done('Phase 1 Selected ✓'),  active('Phase 2 + KYC'),     waiting('Physical Trial')],
    p2_kyc:           [done('Register'),           done('Upload Video'),    done('Phase 1 Selected ✓'),  active('Phase 2 + KYC'),     waiting('Physical Trial')],
    p2_kyc_pending:   [done('Register'),           done('Upload Video'),    done('Phase 1 Selected ✓'),  active('Phase 2 + KYC'),     waiting('Physical Trial')],
    trial_wait:       [done('Register'),           done('Upload Video'),    done('Phase 1 Selected ✓'),  done('Phase 2 + KYC ✓'),     active('Physical Trial')],
    trial_announced:  [done('Register'),           done('Upload Video'),    done('Phase 1 Selected ✓'),  done('Phase 2 + KYC ✓'),     active('Physical Trial')],
  };
  return map[step];
}

// ── Status banner config ──────────────────────────────────────────────────────
function banner(step: Step, data: any, venue: any) {
  const name = data?.user?.name ?? '';
  const city = data?.registration?.trialCity ?? '';
  const dl   = data?.registration?.videoDeadline
    ? new Date(data.registration.videoDeadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
    : '—';

  const cfgs: Record<Step,{color:string;bg:string;icon:string;title:string;body:string;cta?:string;ctaPath?:string}> = {
    not_registered: {
      color:'#FF7A29', bg:'rgba(255,122,41,0.08)', icon:'📝',
      title:'Register for BCPL Season 5',
      body: 'Start your BCPL journey — register as a player and pay the Phase 1 fee to get started.',
      cta:'REGISTER NOW →', ctaPath:'register',
    },
    upload_video: {
      color:'#FF7A29', bg:'rgba(255,122,41,0.08)', icon:'🎬',
      title:'Upload Your Trial Video',
      body: `Hi ${name}! Your Phase 1 registration is done. Upload your 2-minute trial video before ${dl} for scout review.`,
      cta:'UPLOAD VIDEO →', ctaPath:'register/upload-video',
    },
    under_review: {
      color:'#E8B23D', bg:'rgba(232,178,61,0.08)', icon:'🔍',
      title:'Video Under Scout Review',
      body: 'Your video is being reviewed by BCCI-certified scouts. This takes up to 15 working days. You will receive an SMS + Email with the result.',
    },
    rejected: {
      color:'#EF4444', bg:'rgba(239,68,68,0.08)', icon:'❌',
      title:'Not Selected for Phase 2',
      body: 'Unfortunately you were not selected for Phase 2 this season. We encourage you to apply again in Season 6. Thank you for participating in BCPL Season 5.',
    },
    p2_register: {
      color:'#22C55E', bg:'rgba(34,197,94,0.08)', icon:'⭐',
      title:'Congratulations! Selected for Phase 2',
      body: `${name}, you've cleared Phase 1 scout review! Complete Phase 2 registration and pay the trial fee to secure your spot at the ${city} physical trial.`,
      cta:'COMPLETE PHASE 2 →', ctaPath:'register/phase2',
    },
    p2_kyc: {
      color:'#FF7A29', bg:'rgba(255,122,41,0.08)', icon:'🪪',
      title:'Complete Your KYC',
      body: `Phase 2 payment done ✓. One last step — complete your KYC (Aadhaar + PAN verification) to confirm your trial slot in ${city}.`,
      cta:'COMPLETE KYC →', ctaPath:'register/phase2/kyc',
    },
    p2_kyc_pending: {
      color:'#E8B23D', bg:'rgba(232,178,61,0.08)', icon:'⏳',
      title:'KYC Under Review',
      body: 'Your KYC documents are being verified. This usually takes a few hours. You will receive an SMS + Email once verified.',
    },
    trial_wait: {
      color:'#22C55E', bg:'rgba(34,197,94,0.08)', icon:'🏟️',
      title:'KYC Verified — Awaiting Trial Schedule',
      body: `You're fully registered for the ${city} physical trial! Trial venue and date will be announced soon via SMS + Email. Start your preparations!`,
    },
    trial_announced: {
      color:'#E8B23D', bg:'rgba(232,178,61,0.08)', icon:'📍',
      title:`Trial Scheduled — ${venue?.city ?? city}`,
      body: `Your physical trial is confirmed at ${venue?.venue ?? ''}. Report by ${venue?.reportingTime ?? ''} on ${venue?.trialDate ? new Date(venue.trialDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '—'}.`,
    },
  };
  return cfgs[step];
}

// ── Format date helper ────────────────────────────────────────────────────────
function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function fmtAmt(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

// ── Styles ────────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#0A1727', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14, padding: '22px 20px', marginBottom: 18,
};
const tag = (color: string): React.CSSProperties => ({
  display:'inline-flex', alignItems:'center', gap:5,
  padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
  fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em',
  background: color + '18', border: `1px solid ${color}40`, color,
});
const pill = (done: boolean, active: boolean): React.CSSProperties => ({
  width: 36, height: 36, borderRadius: '50%', display:'flex',
  alignItems:'center', justifyContent:'center', fontSize: 16, flexShrink:0,
  background: done ? '#22C55E' : active ? '#FF7A29' : 'rgba(255,255,255,0.08)',
  border: done ? '2px solid #22C55E' : active ? '2px solid #FF7A29' : '2px solid rgba(255,255,255,0.12)',
  color: '#fff',
});
const line: React.CSSProperties = {
  width: 2, flex:1, minHeight: 24,
  background: 'rgba(255,255,255,0.07)', margin: '4px 0',
};
const inp: React.CSSProperties = {
  width:'100%', padding:'12px 14px', background:'#071121',
  border:'1px solid #1E293B', borderRadius:10, color:'#F0EDE8',
  fontSize:14, fontFamily:'Inter,sans-serif', outline:'none',
};

// ─────────────────────────────────────────────────────────────────────────────
export function PlayerProfile() {
  const [loading,  setLoading]  = useState(true);
  const [data,     setData]     = useState<any>(null);
  const [venue,    setVenue]    = useState<any>(null);
  const [myResult, setMyResult] = useState<MyResult | null>(null);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session) { window.location.href = BASE + 'register'; return; }

    Promise.all([getDashboard(), getPlayerTrialVenue(), getMyResult().catch(() => null)])
      .then(([dash, tv, res]) => {
        setData(dash);
        if (tv.found) setVenue(tv.venue);
        if (res && res.available) setMyResult(res);
      })
      .catch(() => setError('Could not load your profile. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const step   = data ? deriveStep(data, !!venue) : 'not_registered';
  const nodes  = journeyNodes(step);
  const ban    = data ? banner(step, data, venue) : null;

  const reg    = data?.registration;
  const user   = data?.user;
  // Real sequential ID (BCPL-DEL-1) from API; fallback to short UUID for old cached data
  // Sequential player number (BCPL-DEL-1) is assigned when Phase 1 payment
  // succeeds. Unpaid players get a neutral support reference — never a fake
  // BCPL-looking ID.
  const regId  = reg?.regNumber ?? (reg?.id ? 'REF-' + reg.id.slice(0, 6).toUpperCase() : '—');

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(255,122,41,0.2)', borderTop:'3px solid #FF7A29', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Loading your profile…</div>
        <button onClick={() => { clearSession(); window.location.href = BASE; }}
          style={{ marginTop:18, background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontSize:12, textDecoration:'underline', cursor:'pointer' }}>
          Sign out
        </button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ background:'#06101E', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ color:'#EF4444', fontSize:15, marginBottom:20 }}>{error}</div>
        <button onClick={() => { clearSession(); window.location.href = BASE; }}
          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:10, color:'#EF4444', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, letterSpacing:'.04em', padding:'10px 20px', cursor:'pointer' }}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', fontFamily:"'Inter',sans-serif", color:'#F0EDE8', paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .wrap{max-width:860px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 28px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .btn-orange{background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:.06em;cursor:pointer;padding:14px 28px;font-size:14px;transition:all .2s}
        .btn-orange:hover{filter:brightness(1.12);transform:translateY(-2px)}
        .btn-ghost{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:rgba(255,255,255,0.65);font-family:Montserrat,sans-serif;font-weight:700;cursor:pointer;padding:10px 16px;font-size:12px;letter-spacing:.04em;transition:all .2s}
        .btn-ghost:hover{border-color:#FF7A29;color:#FF7A29}
        .grid2{display:grid;grid-template-columns:1fr;gap:14px}
        @media(min-width:600px){.grid2{grid-template-columns:1fr 1fr}}
        .grid3{display:grid;grid-template-columns:1fr;gap:14px}
        @media(min-width:640px){.grid3{grid-template-columns:repeat(3,1fr)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse22{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)}50%{box-shadow:0 0 0 10px rgba(34,197,94,0)}}
        @keyframes pulseOr{0%,100%{box-shadow:0 0 0 0 rgba(255,122,41,0.4)}50%{box-shadow:0 0 0 10px rgba(255,122,41,0)}}
      `}</style>

      <SiteHeader />

      <main style={{ paddingTop:32 }}>
        <div className="wrap">

          {/* ── HERO CARD ── */}
          <div style={{ ...card, background:'linear-gradient(135deg,#0D1F35,#0A1727)', border:'1px solid rgba(255,122,41,0.2)', marginBottom:20, animation:'fadeUp .5s ease both' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
              {/* Avatar */}
              <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#FF7A29,#E8B23D)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:26, color:'#fff', flexShrink:0, animation: step==='trial_wait'||step==='trial_announced' ? 'pulse22 2s ease infinite' : step==='p2_register' ? 'pulseOr 2s ease infinite' : 'none' }}>
                {user?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,3vw,24px)', color:'#fff' }}>
                    {user?.name ?? '—'}
                  </div>
                  {reg && (
                    <div style={tag(step==='rejected' ? '#EF4444' : step==='trial_wait'||step==='trial_announced' ? '#22C55E' : '#FF7A29')}>
                      {step==='rejected' ? '✕ Not Selected'
                        : step==='trial_wait'||step==='trial_announced' ? '✓ KYC Verified'
                        : step==='under_review' ? '🔍 Under Review'
                        : step==='p2_register' ? '⭐ Phase 2 Selected'
                        : step==='upload_video' ? '📹 Video Pending'
                        : step==='p2_kyc'||step==='p2_kyc_pending' ? '🪪 KYC Pending'
                        : 'Registered'}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:13, color:'rgba(255,255,255,0.55)' }}>
                  {reg && <>
                    <span>{ROLE_ICON[reg.role] ?? '🏏'} {ROLE_LABEL[reg.role] ?? reg.role}</span>
                    <span>📍 {reg.trialCity}</span>
                    <span>🆔 {regId}</span>
                    <span>📅 {fmtDate(reg.createdAt)}</span>
                  </>}
                  {!reg && <span style={{ color:'#FF7A29' }}>Not yet registered</span>}
                </div>
              </div>
              <button className="btn-ghost" style={{ color:'#EF4444', borderColor:'rgba(239,68,68,0.25)', marginLeft:'auto', alignSelf:'flex-start', flexShrink:0 }}
                onClick={() => { clearSession(); window.location.href = BASE; }}>
                🚪 Sign Out
              </button>
            </div>
          </div>

          {/* ── PHASE 1 RESULT READY ── */}
          {myResult?.available && (
            <div style={{ ...card, background:'linear-gradient(120deg,rgba(232,178,61,0.14),rgba(255,122,41,0.06))', border:'1px solid rgba(232,178,61,0.45)', marginBottom:20, animation:'fadeUp .5s .04s ease both', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <div style={{ fontSize:34 }}>🏏</div>
              <div style={{ flex:1, minWidth:220 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#E8B23D', marginBottom:4, letterSpacing:'.04em' }}>
                  YOUR PHASE 1 RESULT IS READY
                </div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>
                  Your full 100-point scorecard from BCCI-certified scouts is waiting.
                </div>
              </div>
              <button className="btn-orange" style={{ background:'linear-gradient(135deg,#E8B23D,#C4901E)', color:'#081020' }}
                onClick={() => { window.location.href = BASE + 'register/result'; }}>
                VIEW MY RESULT →
              </button>
            </div>
          )}

          {/* ── JOURNEY TIMELINE ── */}
          <div style={{ ...card, animation:'fadeUp .5s .07s ease both' }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em', marginBottom:18 }}>YOUR JOURNEY</div>
            <div style={{ display:'flex', gap:0 }}>
              {nodes.map((n, i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
                  {/* Circle */}
                  <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0,
                    background: n.state==='done' ? '#22C55E' : n.state==='active' ? '#FF7A29' : 'rgba(255,255,255,0.07)',
                    border: n.state==='done' ? '2px solid #22C55E' : n.state==='active' ? '2px solid #FF7A29' : '2px solid rgba(255,255,255,0.1)',
                  }}>
                    {n.state==='done' ? '✓' : n.state==='active' ? '●' : '○'}
                  </div>
                  {/* Connector line */}
                  {i < nodes.length-1 && (
                    <div style={{ position:'absolute', display:'none' }} />
                  )}
                  {/* Label */}
                  <div style={{ fontSize:10, fontWeight:700, fontFamily:'Montserrat,sans-serif', textAlign:'center', marginTop:8, color: n.state==='done' ? '#22C55E' : n.state==='active' ? '#FF7A29' : 'rgba(255,255,255,0.3)', letterSpacing:'.04em', lineHeight:1.3 }}>
                    {n.label}
                  </div>
                </div>
              ))}
            </div>
            {/* Connector bar */}
            <div style={{ position:'relative', marginTop:-36, marginBottom:36, paddingLeft:16, paddingRight:16, zIndex:0 }}>
              <div style={{ height:2, background:'rgba(255,255,255,0.07)', borderRadius:2, position:'relative' }}>
                <div style={{ position:'absolute', left:0, top:0, height:'100%', borderRadius:2, background:'linear-gradient(90deg,#22C55E,#FF7A29)',
                  width: `${(['not_registered','upload_video','under_review','rejected'].includes(step) ? 0 : step==='p2_register'||step==='p2_kyc'||step==='p2_kyc_pending' ? 50 : 85)}%`,
                  transition:'width .6s ease',
                }} />
              </div>
            </div>
          </div>

          {/* ── STATUS BANNER ── */}
          {ban && (
            <div style={{ ...card, background: ban.bg, border:`1px solid ${ban.color}30`, animation:'fadeUp .5s .12s ease both' }}>
              <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
                <div style={{ fontSize:40 }}>{ban.icon}</div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(15px,2.5vw,19px)', color: ban.color, marginBottom:8 }}>{ban.title}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.7, marginBottom: ban.cta ? 20 : 0 }}>{ban.body}</div>
                  {ban.cta && ban.ctaPath && (
                    <button className="btn-orange"
                      onClick={() => { window.location.href = BASE + ban.ctaPath; }}>
                      {ban.cta}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TRIAL VENUE (if announced) ── */}
          {venue && (
            <div style={{ ...card, background:'rgba(232,178,61,0.06)', border:'1px solid rgba(232,178,61,0.25)', animation:'fadeUp .5s .16s ease both' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, color:'#E8B23D', letterSpacing:'.1em', marginBottom:16 }}>📍 YOUR TRIAL VENUE</div>
              <div className="grid2">
                {[
                  { label:'Venue', value: venue.venue },
                  { label:'City',  value: venue.city  },
                  { label:'Date',  value: new Date(venue.trialDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) },
                  { label:'Time',  value: venue.trialTime },
                  { label:'Reporting By', value: venue.reportingTime },
                  { label:'Available Slots', value: String(venue.slots) },
                ].map(row => (
                  <div key={row.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:10, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'rgba(255,255,255,0.35)', letterSpacing:'.08em', marginBottom:4, textTransform:'uppercase' }}>{row.label}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#F0EDE8' }}>{row.value}</div>
                  </div>
                ))}
              </div>
              {venue.notes && (
                <div style={{ marginTop:14, padding:'12px 14px', background:'rgba(232,178,61,0.06)', border:'1px solid rgba(232,178,61,0.15)', borderRadius:10, fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                  📋 {venue.notes}
                </div>
              )}
            </div>
          )}

          {/* ── REGISTRATION SUMMARY ── */}
          {reg && (
            <div style={{ ...card, animation:'fadeUp .5s .2s ease both' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em', marginBottom:16 }}>REGISTRATION SUMMARY</div>
              <div className="grid2">
                {/* Phase 1 Payment */}
                <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'14px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ fontSize:12, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.06em' }}>Phase 1 Payment</div>
                    <div style={tag((data.phase1Payment?.status==='paid' || ['payment_done','video_submitted','selected','rejected'].includes(reg.phase1Status)) ? '#22C55E' : '#E8B23D')}>
                      {(data.phase1Payment?.status==='paid' || ['payment_done','video_submitted','selected','rejected'].includes(reg.phase1Status)) ? '✓ Paid' : 'Pending'}
                    </div>
                  </div>
                  {data.phase1Payment && <div style={{ fontSize:15, fontWeight:700, color:'#F0EDE8' }}>{fmtAmt(data.phase1Payment.amount)}</div>}
                  {data.phase1Payment?.paidAt && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>{fmtDate(data.phase1Payment.paidAt)}</div>}
                </div>

                {/* Trial Video */}
                <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'14px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ fontSize:12, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.06em' }}>Trial Video</div>
                    <div style={tag(data.video?.submitted ? (reg.phase1Status==='selected' ? '#22C55E' : '#E8B23D') : '#FF7A29')}>
                      {data.video?.submitted
                        ? (reg.phase1Status==='selected' ? '✓ Selected' : reg.phase1Status==='rejected' ? '✕ Not Selected' : '🔍 Under Review')
                        : 'Not Uploaded'}
                    </div>
                  </div>
                  {data.video?.submittedAt && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>Submitted {fmtDate(data.video.submittedAt)}</div>}
                  {!data.video?.submitted && (
                    <button onClick={() => { window.location.href = BASE+'register/upload-video'; }}
                      style={{ marginTop:8, padding:'6px 14px', fontSize:11, fontWeight:700, fontFamily:'Montserrat,sans-serif', background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.3)', color:'#FF7A29', borderRadius:8, cursor:'pointer' }}>
                      UPLOAD NOW →
                    </button>
                  )}
                </div>

                {/* Phase 2 Payment */}
                {(reg.phase1Status==='selected' || data.phase2Payment) && (
                  <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'14px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ fontSize:12, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.06em' }}>Phase 2 Payment</div>
                      <div style={tag(data.phase2Payment?.status==='paid' ? '#22C55E' : '#FF7A29')}>
                        {data.phase2Payment?.status==='paid' ? '✓ Paid' : 'Pending'}
                      </div>
                    </div>
                    {data.phase2Payment && <div style={{ fontSize:15, fontWeight:700, color:'#F0EDE8' }}>{fmtAmt(data.phase2Payment.amount)}</div>}
                    {data.phase2Payment?.paidAt && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>{fmtDate(data.phase2Payment.paidAt)}</div>}
                    {!data.phase2Payment && (
                      <button onClick={() => { window.location.href = BASE+'register/phase2'; }}
                        style={{ marginTop:8, padding:'6px 14px', fontSize:11, fontWeight:700, fontFamily:'Montserrat,sans-serif', background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.3)', color:'#FF7A29', borderRadius:8, cursor:'pointer' }}>
                        PAY NOW →
                      </button>
                    )}
                  </div>
                )}

                {/* KYC */}
                {(reg.phase2Status || data.kyc) && (
                  <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'14px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{ fontSize:12, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.06em' }}>KYC Verification</div>
                      <div style={tag(data.kyc?.status==='verified' ? '#22C55E' : data.kyc?.status==='failed' ? '#EF4444' : '#E8B23D')}>
                        {data.kyc?.status==='verified' ? '✓ Verified' : data.kyc?.status==='failed' ? '✕ Failed' : data.kyc ? '⏳ Pending' : 'Pending'}
                      </div>
                    </div>
                    {data.kyc?.profession && <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>{data.kyc.profession}</div>}
                    {data.kyc?.verifiedAt && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>Verified {fmtDate(data.kyc.verifiedAt)}</div>}
                    {(step==='p2_kyc' || step==='p2_kyc_pending' || data.kyc?.status==='failed') && (
                      <button onClick={() => { window.location.href = BASE+'register/phase2/kyc'; }}
                        style={{ marginTop:8, padding:'6px 14px', fontSize:11, fontWeight:700, fontFamily:'Montserrat,sans-serif', background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.3)', color:'#FF7A29', borderRadius:8, cursor:'pointer' }}>
                        {data.kyc?.status==='failed' ? 'RETRY KYC →' : 'COMPLETE KYC →'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CONTACT INFO ── */}
          {user && (
            <div style={{ ...card, animation:'fadeUp .5s .24s ease both' }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em', marginBottom:16 }}>ACCOUNT DETAILS</div>
              <div className="grid2">
                {[
                  { label:'Name',  value: user.name  },
                  { label:'Phone', value: user.phone  },
                  { label:'Email', value: user.email  },
                  { label:'Trial City', value: reg?.trialCity ?? '—' },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ fontSize:10, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'rgba(255,255,255,0.35)', letterSpacing:'.08em', marginBottom:4, textTransform:'uppercase' }}>{row.label}</div>
                    <div style={{ fontSize:14, color:'#F0EDE8', fontWeight:500 }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REFER & EARN (renders only for Phase-1-paid players) ── */}
          <ReferralCard />

          {/* ── QUICK ACTIONS ── */}
          <div style={{ ...card, animation:'fadeUp .5s .28s ease both' }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em', marginBottom:16 }}>QUICK ACTIONS</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {data?.phase1Payment?.status==='paid' && (
                <button className="btn-ghost"
                  onClick={() => { window.location.href = BASE+'register/payment-receipt'; }}>
                  📥 P1 Receipt
                </button>
              )}
              {data?.phase2Payment?.status==='paid' && (
                <button className="btn-ghost"
                  onClick={() => { window.location.href = BASE+'register/phase2/payment-receipt'; }}>
                  📥 P2 Receipt
                </button>
              )}
              {data?.video?.submitted && (
                <button className="btn-ghost"
                  onClick={() => { window.location.href = BASE+'register/upload-video'; }}>
                  🎬 View Video
                </button>
              )}
              <button className="btn-ghost"
                onClick={() => { window.open('mailto:support@bcplt20.com?subject=BCPL%20Support%20-%20'+regId, '_blank'); }}>
                ✉️ Email Support
              </button>
              <button className="btn-ghost"
                onClick={() => { window.open('https://wa.me/918800000000?text='+encodeURIComponent('Hi, I need help with my BCPL Season 5 registration. Player ID: '+regId), '_blank'); }}>
                📞 WhatsApp Help
              </button>
              <button className="btn-ghost" style={{ color:'#EF4444', borderColor:'rgba(239,68,68,0.25)' }}
                onClick={() => { clearSession(); window.location.href = BASE; }}>
                🚪 Sign Out
              </button>
            </div>
          </div>

        </div>
      </main>
      <BCPLFooter />
    </div>
  );
}
