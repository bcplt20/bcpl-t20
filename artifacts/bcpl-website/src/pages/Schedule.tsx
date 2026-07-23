import React from 'react';
import { Link } from 'wouter';
import { SiteHeader } from '../components/SiteHeader';
import { BCPLFooter } from '../components/BCPLFooter';
import { getMatches } from '../lib/api';
import { useLang } from '../lib/i18n';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.wrap{max-width:1280px;margin:0 auto;padding:0 16px;}
.desk-nav{display:none;align-items:center;gap:22px;}
.ham-btn{display:flex;}
@media(min-width:640px){.wrap{padding:0 24px}}
@media(min-width:768px){.wrap{padding:0 32px}}
@media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}}
.btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;}
.btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
.btn-fire:active{transform:scale(0.97);}
.glass-card{background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85));backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.09);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06);}
.shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
.tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
.match-card{transition:transform 0.2s,box-shadow 0.2s;}
.match-card:hover{transform:translateY(-3px);box-shadow:0 32px 80px rgba(0,0,0,0.6)!important;}
.filter-tab{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:rgba(255,255,255,0.5);font-family:Montserrat,sans-serif;font-weight:700;font-size:12px;padding:8px 18px;cursor:pointer;transition:all 0.2s;letter-spacing:0.06em;}
.filter-tab.active{background:rgba(255,122,41,0.15);border-color:rgba(255,122,41,0.5);color:#FF7A29;}
.filter-tab:hover:not(.active){background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.8);}
.team-select{background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:12px;color:#F8F4EE;padding:10px 16px;font-family:Inter,sans-serif;fontSize:14px;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;width:100%;max-width:320px;transition:all 0.25s;}
@keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
@keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.2}}
@keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
@keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes borderGlow{0%,100%{border-color:rgba(255,122,41,0.3)}50%{border-color:rgba(255,122,41,0.8)}}
/* float-reg-btn */
.float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
.float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
@keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
.float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
@media(max-width:1023px){ .float-reg-btn { display:none; } }

/* ── MOBILE FIXES ── */
@media(max-width:639px){
  .match-row-inner { flex-wrap:wrap; gap:8px; }
  .match-date-box { width:56px!important; height:62px!important; }
  .match-date-day { font-size:22px!important; }
}
`;

const particles = [
  {left:'8%',top:'15%',color:'#FF7A29',delay:'0s',dur:'6s'},
  {left:'22%',top:'65%',color:'#E8B23D',delay:'1.2s',dur:'8s'},
  {left:'48%',top:'30%',color:'#fff',delay:'2.1s',dur:'7s'},
  {left:'65%',top:'75%',color:'#FF7A29',delay:'0.7s',dur:'9s'},
  {left:'78%',top:'12%',color:'#E8B23D',delay:'3.3s',dur:'6.5s'},
  {left:'88%',top:'50%',color:'#fff',delay:'1.8s',dur:'7.5s'},
  {left:'33%',top:'55%',color:'#FF7A29',delay:'4.2s',dur:'8s'},
  {left:'92%',top:'35%',color:'#E8B23D',delay:'2.8s',dur:'6s'},
];

function AmbientBg() {
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.07}} viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
        <path d="M0,600 Q320,480 640,500 Q960,520 1280,480 L1280,720 L0,720 Z" fill="#1a2a4a"/>
        <rect x="80" y="60" width="8" height="200" fill="#334"/>
        <rect x="60" y="58" width="48" height="6" fill="#334"/>
        <rect x="1192" y="60" width="8" height="200" fill="#334"/>
        <rect x="1172" y="58" width="48" height="6" fill="#334"/>
        <rect x="440" y="500" width="400" height="120" fill="none" stroke="#445" strokeWidth="2"/>
      </svg>
      {particles.map((p,i)=>(
        <div key={i} style={{position:'absolute',left:p.left,top:p.top,width:3,height:3,borderRadius:'50%',background:p.color,animation:`floatParticle ${p.dur} ${p.delay} infinite`}}/>
      ))}
      <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
    </div>
  );
}

type MatchStatus = 'COMPLETED' | 'LIVE' | 'UPCOMING' | 'TBD';

interface Match {
  day: string;
  month: string;
  weekday: string;
  matchNo: number;
  teamA: string;
  teamB: string;
  status: MatchStatus;
  venue: string;
  time: string;
  result?: string;
  monthGroup: string;
  sortKey: string;
}

type ApiMatchRow = {
  id: string; matchNo: number; team1: string; team2: string; venue: string;
  scheduledAt: string | null; status: string; winner: string | null; resultDesc: string | null;
};

function StatusPill({status}: {status: MatchStatus}) {
  if (status === 'LIVE') return (
    <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(232,73,63,0.15)',border:'1px solid rgba(232,73,63,0.4)',borderRadius:100,padding:'4px 12px',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'#E8493F',letterSpacing:'0.08em'}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:'#E8493F',animation:'liveBlip 1s ease-in-out infinite',display:'inline-block'}}/>LIVE
    </span>
  );
  if (status === 'COMPLETED') return (
    <span style={{background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:100,padding:'4px 12px',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'#22C55E',letterSpacing:'0.08em',display:'inline-block'}}>FINAL</span>
  );
  if (status === 'UPCOMING') return (
    <span style={{background:'rgba(59,130,246,0.12)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:100,padding:'4px 12px',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'#60A5FA',letterSpacing:'0.08em',display:'inline-block'}}>UPCOMING</span>
  );
  return (
    <span style={{background:'rgba(232,178,61,0.1)',border:'1px solid rgba(232,178,61,0.25)',borderRadius:100,padding:'4px 12px',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:800,color:'#E8B23D',letterSpacing:'0.08em',display:'inline-block'}}>TBD</span>
  );
}

export function Schedule() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = React.useState<'All'|'Upcoming'|'Completed'|'Live'>('All');
  const [teamFilter, setTeamFilter] = React.useState('All Teams');
  const [apiMatches, setApiMatches] = React.useState<ApiMatchRow[] | null>(null);
  const [loadErr, setLoadErr] = React.useState('');

  React.useEffect(() => {
    getMatches(5)
      .then((d: any) => setApiMatches(((d as any).matches || []) as ApiMatchRow[]))
      .catch((e: any) => setLoadErr(e?.message || 'Could not load fixtures'));
  }, []);

  const allMatches: Match[] = React.useMemo(() => {
    if (!apiMatches) return [];
    return apiMatches
      .filter(m => m.status !== 'cancelled')
      .map(m => {
        const dt = m.scheduledAt ? new Date(m.scheduledAt) : null;
        const fmt = (opt: Intl.DateTimeFormatOptions) =>
          dt ? dt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', ...opt }) : '';
        const status: MatchStatus =
          m.status === 'live' ? 'LIVE'
          : (m.status === 'completed' || m.status === 'abandoned') ? 'COMPLETED'
          : dt ? 'UPCOMING' : 'TBD';
        return {
          day: dt ? fmt({ day: '2-digit' }) : '—',
          month: dt ? fmt({ month: 'short' }).toUpperCase() : 'TBD',
          weekday: dt ? fmt({ weekday: 'short' }).toUpperCase() : '',
          matchNo: m.matchNo,
          teamA: m.team1,
          teamB: m.team2,
          status,
          venue: m.venue || 'Venue TBA',
          time: dt ? `${fmt({ hour: 'numeric', minute: '2-digit', hour12: true })} IST` : 'Time TBD',
          result: m.status === 'abandoned'
            ? (m.resultDesc || 'Match abandoned — no result')
            : m.status === 'completed'
              ? (m.resultDesc || (m.winner ? `${m.winner} won` : undefined))
              : undefined,
          monthGroup: dt ? fmt({ month: 'long', year: 'numeric' }).toUpperCase() : 'DATE TO BE ANNOUNCED',
          sortKey: dt ? dt.toISOString() : '9999-12-31',
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [apiMatches]);

  const teamOptions = React.useMemo(() => {
    const names = new Set<string>();
    allMatches.forEach(m => { names.add(m.teamA); names.add(m.teamB); });
    return ['All Teams', ...Array.from(names).sort()];
  }, [allMatches]);

  const loading = apiMatches === null && !loadErr;

  const filtered = allMatches.filter(m => {
    const tabOk = activeTab === 'All' ||
      (activeTab === 'Upcoming' && (m.status === 'UPCOMING' || m.status === 'TBD')) ||
      (activeTab === 'Completed' && m.status === 'COMPLETED') ||
      (activeTab === 'Live' && m.status === 'LIVE');
    const teamOk = teamFilter === 'All Teams' ||
      m.teamA === teamFilter || m.teamB === teamFilter;
    return tabOk && teamOk;
  });

  const groups = filtered.reduce<Record<string, Match[]>>((acc, m) => {
    if (!acc[m.monthGroup]) acc[m.monthGroup] = [];
    acc[m.monthGroup].push(m);
    return acc;
  }, {});

  return (
    <div style={{background:'#060E1C',color:'#fff',minHeight:'100vh',overflowX:'hidden',fontFamily:'Inter,sans-serif'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <div style={{position:'relative',zIndex:10}}>
        <SiteHeader />

        {/* HERO */}
        <div style={{padding:'clamp(40px,6vw,60px) 0 clamp(28px,4vw,48px)',textAlign:'center',position:'relative'}}>
          <div className="wrap">
            <div style={{marginBottom:16,display:'flex',justifyContent:'center'}}>
              <span className="tag-pill">
                {t("📅 SEASON 5 FIXTURES", "📅 सीज़न 5 फिक्स्चर")}
              </span>
            </div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,6vw,72px)',lineHeight:1.05,marginBottom:12,color:'#fff'}}>
              {t("SEASON 5", "सीज़न 5")}
            </h1>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,6vw,72px)',lineHeight:1.05,marginBottom:24}}>
              <span className="shimmer-gold">{t("FIXTURES.", "फिक्स्चर।")}</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:15,fontFamily:'Inter,sans-serif',maxWidth:520,margin:'0 auto'}}>
              {t("Every Season 5 match — dates, venues and results — appears here as soon as it is announced.", "हर Season 5 match — तारीख, venue और result — announce होते ही यहाँ दिखेगा।")}
            </p>
          </div>
        </div>

        <div className="wrap" style={{paddingBottom:100}}>

          {/* FILTERS */}
          <div className="glass-card" style={{padding:'20px 20px',marginBottom:32}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
              {(['All','Upcoming','Completed','Live'] as const).map(tab=>(
                <button key={tab} className={`filter-tab${activeTab===tab?' active':''}`} onClick={()=>setActiveTab(tab)}>{tab}</button>
              ))}
            </div>
            <div>
              <select
                value={teamFilter}
                onChange={e=>setTeamFilter(e.target.value)}
                className="team-select"
              >
                {teamOptions.map(t=><option key={t} value={t} style={{background:'#0A1628'}}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div style={{textAlign:'center',padding:'60px 0',color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif',fontSize:15}}>Loading fixtures…</div>
          )}

          {/* ERROR */}
          {loadErr && (
            <div style={{background:'rgba(232,73,63,0.08)',border:'1px solid rgba(232,73,63,0.3)',borderRadius:12,padding:'18px 20px',textAlign:'center',color:'#F87171',fontFamily:'Inter,sans-serif',fontSize:14,marginBottom:24}}>
              Could not load fixtures right now — please refresh the page to try again.
            </div>
          )}

          {/* UPCOMING NOTICE */}
          {!loading && !loadErr && allMatches.length === 0 && (
            <div style={{textAlign:'center',padding:'clamp(60px,10vw,100px) 20px'}}>
              <div style={{fontSize:64,marginBottom:20}}>🏏</div>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(22px,4vw,36px)',color:'#fff',marginBottom:12}}>
                {t("Fixtures Coming Soon", "Fixtures जल्द आएंगे")}
              </div>
              <p style={{color:'rgba(255,255,255,0.45)',fontSize:15,maxWidth:440,margin:'0 auto 28px',lineHeight:1.7}}>
                {t("The complete Season 5 fixture list will be published here after the players' auction in August 2026. The tournament begins in September 2026.", "पूरी Season 5 fixture list players' auction (Aug 2026) के बाद यहाँ publish होगी। Tournament Sep 2026 में शुरू होगा।")}
              </p>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,122,41,0.1)',border:'1px solid rgba(255,122,41,0.3)',borderRadius:20,padding:'8px 20px'}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'#FF7A29',display:'inline-block',animation:'liveBlip 1.2s infinite'}}/>
                <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:12,color:'#FF7A29',letterSpacing:'.08em'}}>
                  {t("REGISTRATIONS OPEN — SEASON 5", "रजिस्ट्रेशन खुले हैं — सीज़न 5")}
                </span>
              </div>
            </div>
          )}

          {/* MATCH GROUPS */}
          {!loading && Object.entries(groups).length === 0 && allMatches.length > 0 && (
            <div style={{textAlign:'center',padding:'60px 0',color:'rgba(255,255,255,0.3)',fontFamily:'Inter,sans-serif',fontSize:15}}>No matches found for this filter.</div>
          )}

          {Object.entries(groups).map(([month, matches]) => (
            <div key={month} style={{marginBottom:40}}>
              {/* Month divider */}
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#E8B23D',letterSpacing:'0.15em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{month}</div>
                <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(232,178,61,0.4),transparent)'}}/>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {matches.map((m, i) => (
                  <div
                    key={`${m.matchNo}-${i}`}
                    className="glass-card match-card"
                    style={{
                      padding:'16px 16px',
                      border:'1px solid rgba(255,255,255,0.09)',
                      animation:`fadeSlide 0.3s ${i*0.05}s ease both`,
                    }}
                  >
                    <div className="match-row-inner" style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                      {/* Date box */}
                      <div
                        className="match-date-box"
                        style={{
                          width:64,height:70,borderRadius:12,flexShrink:0,
                          background:'linear-gradient(135deg,rgba(255,122,41,0.25),rgba(232,97,26,0.15))',
                          border:'1px solid rgba(255,122,41,0.2)',
                          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:1
                        }}
                      >
                        <div className="match-date-day" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:26,color:'#FF7A29',lineHeight:1}}>{m.day}</div>
                        <div style={{fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'rgba(255,122,41,0.7)',letterSpacing:'0.06em'}}>{m.month}</div>
                        <div style={{fontSize:10,fontFamily:'Inter,sans-serif',color:'rgba(255,255,255,0.3)'}}>{m.weekday}</div>
                      </div>

                      {/* Teams */}
                      <div style={{flex:1,minWidth:120}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                          <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#fff'}}>{m.teamA}</span>
                          <span style={{color:'rgba(255,255,255,0.3)',fontSize:13,fontFamily:'Inter,sans-serif'}}>vs</span>
                          <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#fff'}}>{m.teamB}</span>
                        </div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
                          <span style={{fontSize:12,color:'rgba(255,122,41,0.7)',fontFamily:'Montserrat,sans-serif',fontWeight:700}}>Match {m.matchNo}</span>
                          <span style={{fontSize:12,color:'rgba(255,255,255,0.35)',fontFamily:'Inter,sans-serif'}}>📍 {m.venue}</span>
                          <span style={{fontSize:12,color:'rgba(255,255,255,0.25)',fontFamily:'Inter,sans-serif'}}>· {m.time}</span>
                        </div>
                        {m.result && (
                          <div style={{marginTop:6}}>
                            <span style={{fontSize:12,color:'#22C55E',fontFamily:'Inter,sans-serif',fontWeight:600}}>✓ {m.result}</span>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div style={{flexShrink:0}}>
                        <StatusPill status={m.status}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
        <BCPLFooter />

        <StickyRegisterCTA />
      </div>
      {/* ── FLOATING REGISTER BUTTON ── */}
      <Link href="/register" className="float-reg-btn float-reg-pulse" style={{textDecoration:"none"}}>
        {t("🏏 REGISTER NOW →", "🏏 अभी रजिस्टर करें →")}
      </Link>
    </div>
  );
}
