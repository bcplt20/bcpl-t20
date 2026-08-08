import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { getLiveNow, type LiveMatch } from '../lib/api';
import { useLang } from '../lib/i18n';

/**
 * LIVE match banner (Home + Match Center). Fetches GET /api/matches/live-now
 * and renders a broadcast-style card ONLY when a match is actually in progress
 * (isLive). Pulsing dot is allowed per design rules. Tapping opens the
 * scorecard. Renders nothing when nothing is live.
 */
function scoreLine(m: LiveMatch): string {
  const last = m.innings[m.innings.length - 1];
  if (!last) return '';
  const oversTxt = `${last.overs}.${last.balls}`;
  return `${last.battingTeam} ${last.totalRuns}/${last.totalWickets} (${oversTxt})`;
}

export function LiveMatchBanner() {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const [live, setLive] = useState<LiveMatch[]>([]);

  useEffect(() => {
    let on = true;
    const load = () => getLiveNow(5)
      .then((r) => { if (on) setLive(r.matches.filter((m) => m.isLive)); })
      .catch(() => { /* server hiccup — keep prior */ });
    load();
    const id = setInterval(load, 30_000);
    return () => { on = false; clearInterval(id); };
  }, []);

  if (live.length === 0) return null;

  return (
    <>
      <style>{`@keyframes bcplLivePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(1.35)}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {live.map((m) => (
          <button
            key={m.matchId}
            onClick={() => navigate(`/scorecard/${m.matchId}`)}
            style={{
              textAlign: 'left', cursor: 'pointer', width: '100%',
              background: 'linear-gradient(135deg,#22345C,#2C4677)',
              border: '1px solid rgba(255,122,41,0.5)', borderRadius: 14,
              padding: '16px 18px', color: '#fff',
              boxShadow: '0 10px 34px rgba(0,0,0,.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF3B30', animation: 'bcplLivePulse 1.4s ease-in-out infinite' }} />
              <span style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 12, letterSpacing: '.1em', color: '#FF7A29' }}>
                {t('LIVE NOW', 'लाइव')}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                {t('Match', 'मैच')} {m.matchNo}{m.stage ? ` · ${m.stage}` : ''}
              </span>
            </div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 17, marginBottom: 4 }}>
              {m.team1} <span style={{ color: 'rgba(255,255,255,0.55)' }}>{t('vs', 'बनाम')}</span> {m.team2}
            </div>
            {scoreLine(m) && (
              <div style={{ fontSize: 14.5, color: '#F5B301', fontWeight: 800 }}>{scoreLine(m)}</div>
            )}
            <div style={{ marginTop: 8, fontSize: 12, color: '#FF9A57', fontWeight: 800 }}>
              {t('View live scorecard →', 'लाइव स्कोरकार्ड देखें →')}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
