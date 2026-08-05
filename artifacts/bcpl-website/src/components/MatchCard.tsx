import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { IcoPin } from '../lib/icons';

export function MatchCountdown({ targetDate, compact }: { targetDate: string, compact?: boolean }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    if (isNaN(target)) return;
    
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  const boxStyle = {
    background: 'rgba(0,0,0,0.3)',
    padding: compact ? '2px 4px' : '4px 8px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'baseline',
    gap: 2
  };
  
  const valStyle = {
    fontFamily: 'var(--font-head)',
    fontWeight: 800,
    color: '#fff',
    fontSize: compact ? 12 : 16,
    fontVariantNumeric: 'tabular-nums'
  };
  
  const lblStyle = {
    fontSize: compact ? 8 : 10,
    color: 'var(--ink-3)',
    fontWeight: 700
  };

  return (
    <div style={{ display: 'flex', gap: compact ? 4 : 8, alignItems: 'center' }}>
      <div style={boxStyle}><span style={valStyle}>{String(timeLeft.d).padStart(2, '0')}</span><span style={lblStyle}>D</span></div>
      <div style={{ color: 'var(--ink-3)', fontWeight: 700, fontSize: compact ? 10 : 14 }}>:</div>
      <div style={boxStyle}><span style={valStyle}>{String(timeLeft.h).padStart(2, '0')}</span><span style={lblStyle}>H</span></div>
      <div style={{ color: 'var(--ink-3)', fontWeight: 700, fontSize: compact ? 10 : 14 }}>:</div>
      <div style={boxStyle}><span style={valStyle}>{String(timeLeft.m).padStart(2, '0')}</span><span style={lblStyle}>M</span></div>
      <div style={{ color: 'var(--ink-3)', fontWeight: 700, fontSize: compact ? 10 : 14 }}>:</div>
      <div style={boxStyle}><span style={valStyle}>{String(timeLeft.s).padStart(2, '0')}</span><span style={lblStyle}>S</span></div>
    </div>
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

export function MatchCard({ match, compact = false, delayIndex = 0 }: MatchCardProps) {
  const dt = match.scheduledAt ? new Date(match.scheduledAt) : null;
  const fmt = (opt: Intl.DateTimeFormatOptions) => dt ? dt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', ...opt }) : '';

  const isFinal = match.stage === 'final';
  const isSemi = match.stage === 'semifinal';

  let borderColor = 'rgba(255,255,255,0.18)';
  let bgOuter = compact ? 'linear-gradient(135deg,#1F3652,#1D2942)' : 'linear-gradient(165deg,#25477C 0%,#24396B 60%,#1D3B67 100%)';
  
  if (isFinal) {
    borderColor = 'rgba(232,178,61,0.5)';
    bgOuter = 'linear-gradient(165deg, rgba(37,71,124,1) 0%, rgba(50,45,25,1) 100%)';
  } else if (isSemi) {
    borderColor = 'rgba(192,132,252,0.4)';
  }

  // Match status pill
  let statusColor = '#E8B23D';
  let statusBg = 'rgba(232,178,61,0.15)';
  let statusText = 'TBD';
  let statusBorder = 'rgba(232,178,61,0.3)';

  if (match.status === 'live' || match.status === 'innings2') {
    statusColor = '#E8493F';
    statusBg = 'rgba(232,73,63,0.15)';
    statusBorder = 'rgba(232,73,63,0.4)';
    statusText = 'LIVE';
  } else if (match.status === 'completed' || match.status === 'abandoned') {
    statusColor = '#22C55E';
    statusBg = 'rgba(34,197,94,0.12)';
    statusBorder = 'rgba(34,197,94,0.3)';
    statusText = 'RESULT';
  } else if (dt) {
    statusColor = '#60A5FA';
    statusBg = 'rgba(59,130,246,0.12)';
    statusBorder = 'rgba(59,130,246,0.3)';
    statusText = 'UPCOMING';
  }

  // Formatting date/time
  const dateStr = dt ? fmt({ weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase() : 'DATE TBD';
  const timeStr = dt ? `${fmt({ hour: 'numeric', minute: '2-digit', hour12: true })} IST` : 'TIME TBD';

  return (
    <Link href="/match-center" style={{ textDecoration: 'none', display: 'block', animation: `fadeSlide 0.3s ${delayIndex*0.05}s ease both` }}>
      <div 
        className="v3-card match-card"
        style={{
          background: bgOuter,
          border: `1px solid ${borderColor}`,
          borderRadius: 16,
          padding: compact ? '16px' : '20px 24px',
          boxShadow: isFinal ? '0 16px 40px rgba(232,178,61,0.15), inset 0 1px 0 rgba(255,255,255,0.1)' : '0 10px 30px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.05)',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = isFinal ? '0 24px 60px rgba(232,178,61,0.25), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 20px 48px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.18)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = isFinal ? '0 16px 40px rgba(232,178,61,0.15), inset 0 1px 0 rgba(255,255,255,0.1)' : '0 10px 30px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.05)';
        }}
      >
        {isFinal && (
          <div style={{ position: 'absolute', top: -50, right: -50, width: 100, height: 100, background: 'radial-gradient(circle, rgba(232,178,61,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />
        )}
        
        {/* Header row: Match No, Venue, Badges, Status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: compact ? 12 : 20, flexWrap: 'wrap', gap: 12 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: compact ? 11 : 13, color: 'var(--ink-3)', fontFamily: 'var(--font-head)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              MATCH {match.matchNo}
            </span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: compact ? 11 : 13, color: 'var(--ink-2)', fontFamily: 'Inter, sans-serif' }}>
              <IcoPin size={compact ? 12 : 14} style={{ color: 'var(--ink-3)' }}/> {match.venue || 'Venue TBA'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Stage Badges */}
            {isFinal ? (
              <span style={{ background: 'linear-gradient(90deg, #E8B23D, #FFD700)', padding: '4px 12px', borderRadius: 100, fontSize: compact ? 10 : 11, fontFamily: 'var(--font-head)', fontWeight: 900, color: '#1B2E52', letterSpacing: '0.1em', boxShadow: '0 0 12px rgba(232,178,61,0.4)' }}>
                FINAL
              </span>
            ) : isSemi ? (
              <span style={{ background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.4)', padding: '3px 10px', borderRadius: 100, fontSize: compact ? 10 : 11, fontFamily: 'var(--font-head)', fontWeight: 800, color: '#D8B4FE', letterSpacing: '0.1em' }}>
                SEMI FINAL
              </span>
            ) : match.grp ? (
              <span style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 100, fontSize: compact ? 10 : 11, fontFamily: 'var(--font-head)', fontWeight: 900, color: '#fff', letterSpacing: '0.1em' }}>
                {match.grp}
              </span>
            ) : null}
            
            {/* Status Pill */}
            <span style={{ background: statusBg, border: `1px solid ${statusBorder}`, padding: '3px 10px', borderRadius: 100, fontSize: compact ? 10 : 11, fontFamily: 'var(--font-head)', fontWeight: 800, color: statusColor, letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {statusText === 'LIVE' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, animation: 'liveBlip 1s ease-in-out infinite' }}/>}
              {statusText}
            </span>
          </div>

        </div>

        {/* Teams Area */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: compact ? 12 : 24, marginBottom: compact ? 12 : 24 }}>
          <div style={{ flex: 1, textAlign: 'right', fontSize: compact ? 'clamp(16px, 4vw, 22px)' : 'clamp(24px, 5vw, 36px)', fontFamily: 'var(--font-head)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, color: match.winner === match.team1 ? '#FF7A29' : '#fff' }}>
            {match.team1}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: compact ? 12 : 16, fontFamily: 'var(--font-head)', fontWeight: 900, color: '#FF7A29', fontStyle: 'italic', letterSpacing: '0.05em' }}>VS</span>
          </div>

          <div style={{ flex: 1, textAlign: 'left', fontSize: compact ? 'clamp(16px, 4vw, 22px)' : 'clamp(24px, 5vw, 36px)', fontFamily: 'var(--font-head)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, color: match.winner === match.team2 ? '#FF7A29' : '#fff' }}>
            {match.team2}
          </div>
        </div>

        {/* Footer Row: Date, Countdown, Result */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: compact ? 12 : 16, flexWrap: 'wrap', gap: 12 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: compact ? 14 : 18, fontFamily: 'var(--font-head)', fontWeight: 800, color: '#fff' }}>{dateStr}</span>
            <span style={{ fontSize: compact ? 12 : 14, color: 'var(--ink-2)', fontFamily: 'Inter, sans-serif' }}>{timeStr}</span>
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
