import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { IcoPin } from '../lib/icons';
import { useTeamMeta, BALL_LOGO } from '../lib/teamMeta';

export function MatchCountdown({ targetDate, compact }: { targetDate: string, compact?: boolean }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    if (isNaN(target)) return;

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(interval);
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };

    const interval = setInterval(tick, 1000);
    tick();
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  const boxStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.35)',
    padding: compact ? '2px 5px' : '4px 8px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.14)',
    display: 'flex',
    alignItems: 'baseline',
    gap: 2
  };

  const valStyle: React.CSSProperties = {
    fontFamily: 'var(--font-head)',
    fontWeight: 800,
    color: '#FFD873',
    fontSize: compact ? 13 : 16,
    fontVariantNumeric: 'tabular-nums'
  };

  const lblStyle: React.CSSProperties = {
    fontSize: compact ? 8 : 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 700
  };

  return (
    <div style={{ display: 'flex', gap: compact ? 4 : 8, alignItems: 'center' }}>
      <div style={boxStyle}><span style={valStyle}>{String(timeLeft.d).padStart(2, '0')}</span><span style={lblStyle}>D</span></div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: compact ? 10 : 14 }}>:</div>
      <div style={boxStyle}><span style={valStyle}>{String(timeLeft.h).padStart(2, '0')}</span><span style={lblStyle}>H</span></div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: compact ? 10 : 14 }}>:</div>
      <div style={boxStyle}><span style={valStyle}>{String(timeLeft.m).padStart(2, '0')}</span><span style={lblStyle}>M</span></div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: compact ? 10 : 14 }}>:</div>
      <div style={boxStyle}><span style={valStyle}>{String(timeLeft.s).padStart(2, '0')}</span><span style={lblStyle}>S</span></div>
    </div>
  );
}

/* Team logo badge — transparent logo sitting directly on the card, NO backing
   circle/box of any kind. Falls back to the BCPL ball logo (semis/final
   placeholders & missing logos), never to bare initials. `color` is kept in the
   signature for call-site compatibility but no longer paints a backdrop. */
export function TeamLogoBadge({ team, color, logo, size }: { team: string; color: string; logo: string; size: number }) {
  void color;
  const [broken, setBroken] = useState(false);
  const src = (!logo || broken) ? BALL_LOGO : logo;
  return (
    <span style={{
      width: size, height: size, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <img src={src} alt={team} decoding="async"
        onError={() => setBroken(true)}
        style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
    </span>
  );
}

export type MatchCardProps = {
  match: {
    id: string; matchNo: number; team1: string; team2: string; venue: string;
    scheduledAt: string | null; status: string; winner: string | null; resultDesc: string | null;
    stage?: string; grp?: string;
  };
  compact?: boolean;
  delayIndex?: number;
};

/* Stage meta: label + colors. League = Group Stage; Semi & Final get their own colors. */
export function stageMeta(match: { stage?: string; grp?: string }) {
  if (match.stage === 'final') return {
    label: 'FINAL',
    badge: { background: 'linear-gradient(90deg,#E8B23D,#FFD700)', color: '#1B2E52', border: 'none', glow: '0 0 14px rgba(232,178,61,0.5)' }
  };
  if (match.stage === 'semifinal') return {
    label: 'SEMI FINAL',
    badge: { background: 'linear-gradient(90deg,#7C3AED,#A855F7)', color: '#fff', border: 'none', glow: '0 0 12px rgba(168,85,247,0.45)' }
  };
  return {
    label: match.grp ? `GROUP STAGE · ${match.grp}` : 'GROUP STAGE',
    badge: { background: 'linear-gradient(90deg,#0EA5E9,#2563EB)', color: '#fff', border: 'none', glow: 'none' }
  };
}

/* True team name = a real franchise (not a TBD/placeholder like "Winner SF1"). */
const isPlaceholder = (name: string, colorKnown: boolean) => !colorKnown;

export function MatchCard({ match, compact = false, delayIndex = 0 }: MatchCardProps) {
  const { colorOf, logoOf } = useTeamMeta();
  const dt = match.scheduledAt ? new Date(match.scheduledAt) : null;
  const fmt = (opt: Intl.DateTimeFormatOptions) => dt ? dt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', ...opt }) : '';

  const isFinal = match.stage === 'final';
  const isSemi = match.stage === 'semifinal';
  const stage = stageMeta(match);

  const c1 = colorOf(match.team1);
  const c2 = colorOf(match.team2);
  const logo1 = logoOf(match.team1);
  const logo2 = logoOf(match.team2);

  /* Colorful IPL-style backdrop: each team's color washes in from its side. */
  let bgOuter = `linear-gradient(105deg, ${c1}4D 0%, ${c1}1A 28%, #22355F 46%, #22355F 54%, ${c2}1A 72%, ${c2}4D 100%)`;
  let borderColor = 'rgba(255,255,255,0.22)';
  if (isFinal) {
    bgOuter = 'linear-gradient(105deg, rgba(232,178,61,0.30) 0%, rgba(232,178,61,0.10) 30%, #2A3450 50%, rgba(232,178,61,0.10) 70%, rgba(232,178,61,0.30) 100%)';
    borderColor = 'rgba(232,178,61,0.55)';
  } else if (isSemi) {
    bgOuter = 'linear-gradient(105deg, rgba(168,85,247,0.28) 0%, rgba(168,85,247,0.10) 30%, #263055 50%, rgba(168,85,247,0.10) 70%, rgba(168,85,247,0.28) 100%)';
    borderColor = 'rgba(192,132,252,0.5)';
  }

  // Match status pill
  let statusColor = '#E8B23D';
  let statusBg = 'rgba(232,178,61,0.15)';
  let statusText = 'TBD';
  let statusBorder = 'rgba(232,178,61,0.3)';

  if (match.status === 'live' || match.status === 'innings2') {
    statusColor = '#FF5A50';
    statusBg = 'rgba(232,73,63,0.18)';
    statusBorder = 'rgba(232,73,63,0.45)';
    statusText = 'LIVE';
  } else if (match.status === 'completed' || match.status === 'abandoned') {
    statusColor = '#22C55E';
    statusBg = 'rgba(34,197,94,0.12)';
    statusBorder = 'rgba(34,197,94,0.3)';
    statusText = 'RESULT';
  } else if (dt) {
    statusColor = '#60A5FA';
    statusBg = 'rgba(59,130,246,0.14)';
    statusBorder = 'rgba(59,130,246,0.32)';
    statusText = 'UPCOMING';
  }

  const dateStr = dt ? fmt({ weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase() : 'DATE TBD';
  const timeStr = dt ? `${fmt({ hour: 'numeric', minute: '2-digit', hour12: true })} IST` : 'TIME TBD';

  const logoSize = compact ? 64 : 96;

  const TeamSide = ({ team, color, logo, right }: { team: string; color: string; logo: string; right?: boolean }) => (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 8 : 12 }}>
      <TeamLogoBadge team={team} color={color} logo={logo} size={logoSize} />
      <div style={{
        textAlign: 'center',
        fontSize: compact ? 'clamp(14px, 3.6vw, 18px)' : 'clamp(18px, 3.8vw, 28px)',
        fontFamily: 'var(--font-head)', fontWeight: 900, textTransform: 'uppercase',
        lineHeight: 1.12, letterSpacing: '0.02em',
        color: match.winner === team ? '#FFB347' : '#fff',
        textShadow: '0 2px 10px rgba(0,0,0,0.45)'
      }}>
        {team}
      </div>
    </div>
  );

  return (
    <Link href="/match-center" style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="v3-card match-card"
        style={{
          background: bgOuter,
          border: `1px solid ${borderColor}`,
          borderRadius: 18,
          padding: compact ? '14px 14px 12px' : '18px 22px 16px',
          boxShadow: isFinal ? '0 16px 40px rgba(232,178,61,0.18), inset 0 1px 0 rgba(255,255,255,0.12)' : '0 10px 30px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08)',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
      >
        {/* side color glows */}
        {!isFinal && !isSemi && <>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 6, background: c1, opacity: 0.85 }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 6, background: c2, opacity: 0.85 }} />
        </>}
        {isFinal && (
          <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 220, height: 120, background: 'radial-gradient(ellipse, rgba(255,215,0,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        )}

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: compact ? 10 : 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: compact ? 11 : 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-head)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              MATCH {match.matchNo}
            </span>
            <span style={{ background: stage.badge.background, padding: '3px 10px', borderRadius: 100, fontSize: compact ? 9 : 10.5, fontFamily: 'var(--font-head)', fontWeight: 900, color: stage.badge.color, letterSpacing: '0.08em', boxShadow: stage.badge.glow, whiteSpace: 'nowrap' }}>
              {stage.label}
            </span>
          </div>

          <span style={{ background: statusBg, border: `1px solid ${statusBorder}`, padding: '3px 10px', borderRadius: 100, fontSize: compact ? 10 : 11, fontFamily: 'var(--font-head)', fontWeight: 800, color: statusColor, letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {statusText === 'LIVE' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, animation: 'liveBlip 1s ease-in-out infinite' }} />}
            {statusText}
          </span>
        </div>

        {/* Teams */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: compact ? 8 : 16, marginBottom: compact ? 12 : 18 }}>
          <TeamSide team={match.team1} color={c1} logo={logo1} />
          {/* VS — vertically centered on the logo row (logo height / 2) */}
          <div style={{ alignSelf: 'flex-start', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: logoSize }}>
            <span style={{
              fontSize: compact ? 16 : 22, fontFamily: 'var(--font-head)', fontWeight: 900,
              fontStyle: 'italic', letterSpacing: '0.04em', lineHeight: 1,
              background: 'linear-gradient(90deg,#FF7A29,#FFD700)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))'
            }}>VS</span>
          </div>
          <TeamSide team={match.team2} color={c2} logo={logo2} right />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: compact ? 10 : 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: compact ? 13 : 16, fontFamily: 'var(--font-head)', fontWeight: 800, color: '#fff' }}>{dateStr} · <span style={{ color: '#FFD873' }}>{timeStr}</span></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: compact ? 11 : 12.5, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter, sans-serif' }}>
              <IcoPin size={compact ? 11 : 13} style={{ color: 'rgba(255,255,255,0.5)' }} /> {match.venue || 'Venue TBA'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {match.status === 'scheduled' && dt && dt.getTime() > Date.now() ? (
              <MatchCountdown targetDate={match.scheduledAt!} compact={compact} />
            ) : match.resultDesc ? (
              <span style={{ fontSize: compact ? 12 : 14, color: '#22C55E', fontFamily: 'Inter, sans-serif', fontWeight: 600, textAlign: 'right' }}>
                ✓ {match.resultDesc}
              </span>
            ) : match.winner ? (
              <span style={{ fontSize: compact ? 12 : 14, color: '#22C55E', fontFamily: 'Inter, sans-serif', fontWeight: 600, textAlign: 'right' }}>
                ✓ {match.winner} WON
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
