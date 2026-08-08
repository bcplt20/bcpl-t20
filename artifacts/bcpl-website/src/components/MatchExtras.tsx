import { useEffect, useState } from 'react';
import { getMatchMoments, getPolls, castPollVote, type MatchMoment, type Poll } from '../lib/api';
import { useLang } from '../lib/i18n';
import { IcoZap, IcoBat, IcoBall, IcoStar, IcoTrophy } from '../lib/icons';

/* Persistent per-device id (same key as the Vote page — one vote per device). */
const DEVICE_KEY = 'bcpl_device_v1';
function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

const PANEL = '#24396B';
const LINE = 'rgba(255,255,255,.18)';
const GOLD = '#E8B23D';
const ORANGE = '#FF7A29';

function momentIcon(type: MatchMoment['type']) {
  switch (type) {
    case 'wicket': return <IcoBall size={18} style={{ color: '#F26158' }} />;
    case 'six': return <IcoBat size={18} style={{ color: '#9B7CFF' }} />;
    case 'fifty': return <IcoStar size={18} style={{ color: GOLD }} />;
    case 'hundred': return <IcoTrophy size={18} style={{ color: GOLD }} />;
    case 'hat_trick': return <IcoZap size={18} style={{ color: ORANGE }} />;
    default: return <IcoStar size={18} style={{ color: GOLD }} />;
  }
}

/* ── Match Moments (auto-refreshes while live) ───────────────────────────── */
export function MatchMoments({ matchId, live }: { matchId: string; live: boolean }) {
  const { t, lang } = useLang();
  const [moments, setMoments] = useState<MatchMoment[]>([]);

  useEffect(() => {
    if (!matchId) return;
    let on = true;
    const load = () => getMatchMoments(matchId)
      .then((r) => { if (on) setMoments(r.moments); })
      .catch(() => { /* not found / hiccup — hide */ });
    load();
    if (!live) return () => { on = false; };
    const iv = setInterval(load, 10_000);
    return () => { on = false; clearInterval(iv); };
  }, [matchId, live]);

  if (moments.length === 0) return null;
  // newest first
  const ordered = [...moments].reverse();

  return (
    <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: '18px 18px', marginBottom: 24, boxShadow: '0 12px 34px rgba(0,0,0,.28)' }}>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: ORANGE, marginBottom: 14 }}>
        {t('Match Moments', 'मैच के पल')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ordered.map((m, i) => {
          const text = lang === 'hi' && m.textHi ? m.textHi : m.text;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12, borderBottom: i < ordered.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ flex: '0 0 auto', marginTop: 1 }}>{momentIcon(m.type)}</span>
                <div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,.92)', fontWeight: 700, lineHeight: 1.4 }}>{text}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', fontWeight: 600, marginTop: 2 }}>
                    {t('Over', 'ओवर')} {m.over}.{m.ball}
                  </div>
                </div>
              </div>
              {m.clipUrl && (
                <video
                  src={m.clipUrl}
                  controls
                  playsInline
                  preload="none"
                  style={{ width: '100%', maxWidth: 480, borderRadius: 10, background: '#000' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Inline match-day fan poll (shows an open poll only) ──────────────────── */
export function MatchDayPoll() {
  const { t, lang } = useLang();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    getPolls()
      .then((r) => {
        if (!on) return;
        const open = r.polls.find((p) => p.votingOpen);
        if (open) setPoll(open);
      })
      .catch(() => {});
    return () => { on = false; };
  }, []);

  if (!poll) return null;
  const title = lang === 'hi' && poll.titleHi ? poll.titleHi : poll.titleEn;
  const showResults = voted || poll.options.some((o) => typeof o.percent === 'number');

  const vote = async (optionId: string) => {
    if (busy || voted) return;
    setBusy(optionId);
    setMsg(null);
    try {
      const res = await castPollVote(poll.id, optionId, getDeviceId());
      setPoll((p) => (p ? { ...p, options: res.options, totalVotes: res.totalVotes } : p));
      setVoted(true);
    } catch (e: any) {
      if (e?.status === 409) { setVoted(true); setMsg(t('You already voted.', 'आपने पहले ही वोट दिया है।')); }
      else setMsg(t('Could not record your vote. Please try again.', 'वोट दर्ज नहीं हो सका। कृपया फिर से प्रयास करें।'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: '18px 18px', marginBottom: 24, boxShadow: '0 12px 34px rgba(0,0,0,.28)' }}>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: ORANGE, marginBottom: 4 }}>
        {t('Fan Poll', 'फैन पोल')}
      </div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 17, color: '#fff', marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {poll.options.map((o) => {
          const pct = typeof o.percent === 'number' ? o.percent : 0;
          return (
            <button
              key={o.id}
              disabled={!!busy || voted}
              onClick={() => vote(o.id)}
              style={{
                position: 'relative', textAlign: 'left', width: '100%', overflow: 'hidden',
                background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)',
                borderRadius: 10, padding: '12px 14px', color: '#fff',
                cursor: voted ? 'default' : 'pointer', fontFamily: 'Inter,sans-serif',
              }}
            >
              {showResults && (
                <span style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: 'rgba(255,122,41,.22)', transition: 'width .5s ease' }} />
              )}
              <span style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
                <span>{o.label}</span>
                {showResults && <span style={{ color: GOLD, fontWeight: 800 }}>{pct}%</span>}
              </span>
            </button>
          );
        })}
      </div>
      {typeof poll.totalVotes === 'number' && showResults && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>
          {t(`${poll.totalVotes} votes`, `${poll.totalVotes} वोट`)}
        </div>
      )}
      {msg && <div style={{ marginTop: 10, fontSize: 12.5, color: GOLD }}>{msg}</div>}
    </div>
  );
}
