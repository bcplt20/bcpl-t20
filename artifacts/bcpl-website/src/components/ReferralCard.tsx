import { useState, useEffect } from 'react';
import { getMyReferral, whatsAppShareUrl, type MyReferral } from '../lib/referralProgramApi';

/**
 * Player referral program UI:
 *  - <ReferralCard />        full card on the player dashboard
 *  - <ReferralShareBanner /> compact share block on the P1 payment receipt
 * Both self-fetch and render nothing until the API confirms the player is
 * eligible (has a successful Phase-1 payment), so they are safe to drop
 * anywhere without breaking pages for unpaid/logged-out users.
 */

function useMyReferral(retryIfIneligible = false): Extract<MyReferral, { eligible: true }> | null {
  const [data, setData] = useState<Extract<MyReferral, { eligible: true }> | null>(null);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const attempt = (n: number) => {
      getMyReferral()
        .then(d => {
          if (!alive) return;
          if (d.eligible) { setData(d); return; }
          // Right after checkout, payment verification may still be settling
          // server-side — retry briefly so the receipt banner doesn't miss
          // freshly-paid players.
          if (retryIfIneligible && n < 4) timer = setTimeout(() => attempt(n + 1), 3000);
        })
        .catch(() => { /* not logged in / server hiccup — just don't render */ });
    };
    attempt(0);
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [retryIfIneligible]);
  return data;
}

const cardStyle: React.CSSProperties = {
  background: '#0A1727', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14, padding: '22px 20px', marginBottom: 18,
};
const secLabel: React.CSSProperties = {
  fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 12,
  color: 'rgba(255,255,255,0.35)', letterSpacing: '.1em',
};
const linkBox: React.CSSProperties = {
  flex: 1, minWidth: 200, background: '#071121', border: '1px dashed rgba(255,122,41,0.45)',
  borderRadius: 10, padding: '11px 14px', fontFamily: 'monospace', fontSize: 13,
  color: '#FF9A57', fontWeight: 700, overflowWrap: 'anywhere',
};
const waBtn: React.CSSProperties = {
  background: '#25D366', color: '#fff', border: 'none', borderRadius: 10,
  padding: '11px 18px', fontFamily: 'Montserrat,sans-serif', fontWeight: 900,
  fontSize: 13, letterSpacing: '.04em', cursor: 'pointer',
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(true); setTimeout(() => setCopied(false), 1500);
      }}
      style={{
        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
        border: copied ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(255,255,255,0.14)',
        color: copied ? '#4ADE80' : 'rgba(255,255,255,0.75)',
        borderRadius: 10, padding: '11px 16px', fontFamily: 'Montserrat,sans-serif',
        fontWeight: 800, fontSize: 12, letterSpacing: '.04em', cursor: 'pointer',
      }}>
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  );
}

/* ── Full dashboard card ─────────────────────────────────────────────────── */
export function ReferralCard() {
  const data = useMyReferral();
  if (!data) return null;

  const next = data.tiers.find(t => !t.reached);
  const lastReached = [...data.tiers].reverse().find(t => t.reached);
  const from = next ? (lastReached?.threshold ?? 0) : 0;
  const pct = next
    ? Math.max(0, Math.min(100, Math.round(((data.paid - from) / (next.threshold - from)) * 100)))
    : 100;

  return (
    <div style={{ ...cardStyle, border: '1px solid rgba(255,122,41,0.25)', animation: 'fadeUp .5s .26s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={secLabel}>REFER &amp; EARN</div>
        <div style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
          fontFamily: 'Montserrat,sans-serif', letterSpacing: '.06em',
          background: 'rgba(255,122,41,0.1)', border: '1px solid rgba(255,122,41,0.3)', color: '#FF9A57',
        }}>
          {data.rank ? `RANK #${data.rank} OF ${data.totalReferrers}` : 'UNRANKED — SHARE TO START'}
        </div>
      </div>
      <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(17px,2.6vw,21px)', color: '#fff', marginBottom: 4 }}>
        Bring your friends, win BCPL rewards 🎁
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 16 }}>
        Share your personal link. When a friend registers and completes the ₹99 Phase 1 payment, you move up the reward ladder.
      </p>

      {/* Link + actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'stretch', marginBottom: 18 }}>
        <div style={linkBox}>{data.link}</div>
        <CopyBtn text={data.link} />
        <button style={waBtn} onClick={() => window.open(whatsAppShareUrl(data.link), '_blank')}>
          💬 Share on WhatsApp
        </button>
      </div>

      {/* Stats */}
      <div className="grid3" style={{ marginBottom: 18 }}>
        {[
          { label: 'Friends Joined', value: data.joined, sub: 'clicked & registered' },
          { label: 'Paid Referrals', value: data.paid, sub: 'completed ₹99 payment' },
          { label: 'Your Rank', value: data.rank ? `#${data.rank}` : '—', sub: data.rank ? 'on the referrer leaderboard' : 'first paid referral unlocks rank' },
        ].map(s => (
          <div key={s.label} style={{ background: '#071121', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Montserrat,sans-serif', color: 'rgba(255,255,255,0.35)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 24, color: '#fff' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress to next reward */}
      {next && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
              Next reward: <span style={{ color: '#FF9A57' }}>{next.reward}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#FF9A57', fontFamily: 'Montserrat,sans-serif' }}>
              {data.paid}/{next.threshold} paid
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, background: 'linear-gradient(90deg,#FF7A29,#E8B23D)', transition: 'width .6s ease' }} />
          </div>
        </div>
      )}

      {/* Reward ladder */}
      <div style={{ ...secLabel, fontSize: 11, marginBottom: 10 }}>REWARD LADDER</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
        {data.tiers.map(t => (
          <div key={t.threshold} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 9,
            background: t.reached ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)',
            border: t.reached ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              minWidth: 34, textAlign: 'center', fontFamily: 'Montserrat,sans-serif', fontWeight: 900,
              fontSize: 13, color: t.reached ? '#4ADE80' : 'rgba(255,255,255,0.45)',
            }}>
              {t.reached ? '✓' : t.threshold}
            </div>
            <div style={{ flex: 1, fontSize: 13, color: t.reached ? '#D1FAE5' : 'rgba(255,255,255,0.6)', fontWeight: t.reached ? 600 : 400 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 11, marginRight: 8 }}>{t.threshold} PAID →</span>
              {t.reward}
            </div>
            {t.rewardGiven && (
              <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'Montserrat,sans-serif', letterSpacing: '.05em', color: '#4ADE80', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap' }}>
                🎁 RECEIVED
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ ...secLabel, fontSize: 11, marginBottom: 10 }}>TOP REFERRERS — SEASON 5</div>
      {data.leaderboard.length === 0 ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', padding: '14px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 9 }}>
          Nobody on the board yet — your first paid referral makes you #1. 🏆
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.leaderboard.map(r => (
            <div key={r.rank} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8,
              background: r.isMe ? 'rgba(255,122,41,0.1)' : 'transparent',
              border: r.isMe ? '1px solid rgba(255,122,41,0.35)' : '1px solid transparent',
            }}>
              <div style={{ minWidth: 30, fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 13, color: r.rank <= 3 ? '#E8B23D' : 'rgba(255,255,255,0.4)' }}>
                {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: r.isMe ? 800 : 500, color: r.isMe ? '#FF9A57' : '#F0EDE8' }}>
                {r.name}{r.isMe ? ' (You)' : ''}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#4ADE80' }}>{r.paid} paid</div>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, marginTop: 14 }}>
        Only friends who complete the ₹99 Phase 1 payment count towards rewards. Rewards are handed out by the BCPL team as each milestone is verified.
      </p>
    </div>
  );
}

/* ── Compact banner for the payment receipt page ─────────────────────────── */
export function ReferralShareBanner() {
  const data = useMyReferral(true);
  if (!data) return null;

  const tease = data.tiers.slice(0, 3);
  return (
    <div style={{
      background: 'linear-gradient(135deg,#1A0F04,#0A1727)', border: '1px solid rgba(255,122,41,0.4)',
      borderRadius: 12, padding: '28px 20px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 13, letterSpacing: '.16em', color: '#FF9A57', marginBottom: 6, textTransform: 'uppercase' }}>
        🎁 Refer &amp; Earn
      </div>
      <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 8 }}>
        Apni team banao — rewards jeeto!
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 18px' }}>
        Your personal referral link is ready. Every friend who registers &amp; pays ₹99 takes you up the reward ladder{tease.length > 0 ? ` — ${tease.map(t => `${t.threshold} = ${t.reward.replace(/^[^\w₹']*/, '').split(' — ')[0]}`).join(' · ')} …` : '.'}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch', maxWidth: 640, margin: '0 auto 14px' }}>
        <div style={{ ...linkBox, textAlign: 'left' }}>{data.link}</div>
        <CopyBtn text={data.link} />
        <button style={waBtn} onClick={() => window.open(whatsAppShareUrl(data.link), '_blank')}>
          💬 Share on WhatsApp
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
        Track joins, payments &amp; your leaderboard rank anytime on your <a href={import.meta.env.BASE_URL + 'profile'} style={{ color: '#FF9A57', fontWeight: 700 }}>player dashboard</a>.
      </div>
    </div>
  );
}
