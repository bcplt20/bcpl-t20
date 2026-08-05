import React from 'react';
import { Link } from 'wouter';
import { SiteHeader } from '../components/SiteHeader';
import { BCPLFooter } from '../components/BCPLFooter';
import { Skel } from '../components/Skel';
import { getMatches } from '../lib/api';
import { useLang } from '../lib/i18n';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { IcoBat } from '../lib/icons';
import { MatchCard } from '../components/MatchCard';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.wrap{max-width:1200px;margin:0 auto;padding:0 20px;}
.desk-nav{display:none;align-items:center;gap:22px;}
.ham-btn{display:flex;}
@media(min-width:768px){.wrap{padding:0 32px}}
@media(min-width:1280px){.wrap{padding:0 48px}}
@media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}}
.v3-kicker{font-family:Inter,sans-serif;font-weight:700;font-size:12px;letter-spacing:.22em;color:#E8B23D;text-transform:uppercase;}
.v3-h{font-family:'Barlow Condensed','Mukta','Montserrat',sans-serif;font-weight:800;text-transform:uppercase;line-height:.95;letter-spacing:.015em;}
/* Filter tabs: 2-col grid on mobile, single row from 640 */
.filter-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;}
@media(min-width:640px){.filter-tabs{display:flex;flex-wrap:wrap;}}
.filter-tabs .filter-tab{width:100%;text-align:center;}
@media(min-width:640px){.filter-tabs .filter-tab{width:auto;}}
.filter-bar{display:flex;flex-direction:column;gap:16px;}
@media(min-width:768px){.filter-bar{flex-direction:row;align-items:center;justify-content:space-between;}.filter-bar .filter-tabs{margin-bottom:0;}}
.glass-card{background:linear-gradient(135deg,rgba(30,55,105,0.9),rgba(23,43,81,0.85));backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.18);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.18);}
.shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
.filter-tab{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.18);border-radius:10px;color:rgba(255,255,255,0.72);font-family:var(--font-head);font-weight:700;font-size:12px;padding:8px 18px;cursor:pointer;transition:all 0.2s;letter-spacing:0.06em;}
.filter-tab.active{background:rgba(255,122,41,0.15);border-color:rgba(255,122,41,0.5);color:#FF7A29;}
.filter-tab:hover:not(.active){background:rgba(255,255,255,0.18);color:rgba(255,255,255,0.88);}
.team-select{background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.18);border-radius:12px;color:#F8F4EE;padding:10px 16px;font-family:Inter,sans-serif;font-size:14px;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;width:100%;transition:all 0.25s;}
@media(min-width:768px){.team-select{width:auto;flex:1;max-width:260px;}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
@keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.2}}
@keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
@keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
/* float-reg-btn */
.float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:var(--font-head); font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
.float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
@keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
.float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
@media(max-width:1023px){ .float-reg-btn { display:none; } }
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
        <path d="M0,600 Q320,480 640,500 Q960,520 1280,480 L1280,720 L0,720 Z" fill="#273E6E"/>
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

type ApiMatchRow = {
  id: string; matchNo: number; team1: string; team2: string; venue: string;
  scheduledAt: string | null; status: string; winner: string | null; resultDesc: string | null;
  stage?: string; grp?: string;
};

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

  const enrichedMatches = React.useMemo(() => {
    if (!apiMatches) return [];
    return apiMatches
      .filter(m => m.status !== 'cancelled')
      .map(m => {
        const dt = m.scheduledAt ? new Date(m.scheduledAt) : null;
        const fmt = (opt: Intl.DateTimeFormatOptions) =>
          dt ? dt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', ...opt }) : '';
        const uiStatus = 
          (m.status === 'live' || m.status === 'innings2') ? 'LIVE'
          : (m.status === 'completed' || m.status === 'abandoned') ? 'COMPLETED'
          : dt ? 'UPCOMING' : 'TBD';
        
        return {
          ...m,
          uiStatus,
          monthGroup: dt ? fmt({ month: 'long', year: 'numeric' }).toUpperCase() : 'DATE TO BE ANNOUNCED',
          sortKey: dt ? dt.toISOString() : '9999-12-31'
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [apiMatches]);

  const teamOptions = React.useMemo(() => {
    const names = new Set<string>();
    enrichedMatches.forEach(m => { names.add(m.team1); names.add(m.team2); });
    return ['All Teams', ...Array.from(names).sort()];
  }, [enrichedMatches]);

  const loading = apiMatches === null && !loadErr;

  const filtered = enrichedMatches.filter(m => {
    const tabOk = activeTab === 'All' ||
      (activeTab === 'Upcoming' && (m.uiStatus === 'UPCOMING' || m.uiStatus === 'TBD')) ||
      (activeTab === 'Completed' && m.uiStatus === 'COMPLETED') ||
      (activeTab === 'Live' && m.uiStatus === 'LIVE');
    const teamOk = teamFilter === 'All Teams' ||
      m.team1 === teamFilter || m.team2 === teamFilter;
    return tabOk && teamOk;
  });

  const groups = filtered.reduce<Record<string, typeof enrichedMatches>>((acc, m) => {
    if (!acc[m.monthGroup]) acc[m.monthGroup] = [];
    acc[m.monthGroup].push(m);
    return acc;
  }, {});

  return (
    <div style={{background:'#1C2B47',color:'#fff',minHeight:'100vh',overflowX:'hidden',fontFamily:'Inter,sans-serif'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <div style={{position:'relative',zIndex:10}}>
        <SiteHeader />

        {/* HERO */}
        <div style={{padding:'clamp(80px,12vh,130px) 0 clamp(32px,5vw,56px)',textAlign:'center',position:'relative'}}>
          <div className="wrap">
            <div className="v3-kicker" style={{marginBottom:16}}>
              {t("SEASON 4 FIXTURES", "सीज़न 4 फिक्स्चर")}
            </div>
            <h1 className="v3-h" style={{fontSize:'clamp(40px,9vw,88px)',marginBottom:20}}>
              <span style={{color:'#fff'}}>{t("SEASON 4 ", "सीज़न 4 ")}</span>
              <span className="shimmer-gold">{t("FIXTURES.", "फिक्स्चर।")}</span>
            </h1>
            <p style={{color:'rgba(255,255,255,0.72)',fontSize:'clamp(14px,2vw,16px)',fontFamily:'Inter,sans-serif',lineHeight:1.7,maxWidth:640,margin:'0 auto'}}>
              {t("Every Season 4 match — dates, venues and results — appears here as soon as it is announced.", "हर Season 4 match — तारीख, venue और result — announce होते ही यहाँ दिखेगा।")}
            </p>
          </div>
        </div>

        <div className="wrap" style={{paddingBottom:100}}>

          {/* FILTERS */}
          <div className="glass-card" style={{padding:'20px 20px',marginBottom:32}}>
            <div className="filter-bar">
              <div className="filter-tabs">
                {(['All','Upcoming','Completed','Live'] as const).map(tab=>(
                  <button key={tab} className={`filter-tab${activeTab===tab?' active':''}`} onClick={()=>setActiveTab(tab)}>{tab}</button>
                ))}
              </div>
              <select
                value={teamFilter}
                onChange={e=>setTeamFilter(e.target.value)}
                className="team-select"
              >
                {teamOptions.map(t=><option key={t} value={t} style={{background:'#1F3453'}}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div role="status" aria-label={t('Loading…', 'लोड हो रहा है…')} style={{display:'flex',flexDirection:'column',gap:12}}>
              {Array.from({length:3}).map((_,i)=>(
                <div key={i} className="glass-card" style={{padding:'16px 16px',border:'1px solid rgba(255,255,255,0.18)',borderRadius:14,display:'flex',alignItems:'center',gap:16}}>
                  <Skel w={44} h={44} r={22} style={{flexShrink:0}}/>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:10}}>
                    <Skel w="45%" h={14}/>
                    <Skel w="70%" h={12}/>
                  </div>
                  <Skel w={70} h={22} r={8} style={{flexShrink:0}}/>
                </div>
              ))}
            </div>
          )}

          {/* ERROR */}
          {loadErr && (
            <div style={{background:'rgba(232,73,63,0.08)',border:'1px solid rgba(232,73,63,0.3)',borderRadius:12,padding:'18px 20px',textAlign:'center',color:'#F87171',fontFamily:'Inter,sans-serif',fontSize:14,marginBottom:24}}>
              Could not load fixtures right now — please refresh the page to try again.
            </div>
          )}

          {/* UPCOMING NOTICE */}
          {!loading && !loadErr && enrichedMatches.length === 0 && (
            <div style={{textAlign:'center',padding:'clamp(60px,10vw,100px) 20px'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:20}}><IcoBat size={40} style={{color:'rgba(255,255,255,0.72)'}}/></div>
              <div className="v3-h" style={{fontSize:'clamp(26px,5vw,40px)',color:'#fff',marginBottom:12}}>
                {t("Fixtures Coming Soon", "Fixtures जल्द आएंगे")}
              </div>
              <p style={{color:'var(--ink-3)',fontSize:15,maxWidth:440,margin:'0 auto 28px',lineHeight:1.7}}>
                {t("The complete Season 4 fixture list will be published here after the players' auction in August 2026. The tournament begins in September 2026.", "पूरी Season 4 fixture list players' auction (Aug 2026) के बाद यहाँ publish होगी। Tournament Sep 2026 में शुरू होगा।")}
              </p>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,122,41,0.1)',border:'1px solid rgba(255,122,41,0.3)',borderRadius:20,padding:'8px 20px'}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'#FF7A29',display:'inline-block',animation:'liveBlip 1.2s infinite'}}/>
                <span style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:12,color:'#FF7A29',letterSpacing:'.08em'}}>
                  {t("REGISTRATIONS OPEN — SEASON 4", "रजिस्ट्रेशन खुले हैं — सीज़न 4")}
                </span>
              </div>
            </div>
          )}

          {/* MATCH GROUPS */}
          {!loading && Object.entries(groups).length === 0 && enrichedMatches.length > 0 && (
            <div style={{textAlign:'center',padding:'60px 0',color:'var(--ink-3)',fontFamily:'Inter,sans-serif',fontSize:15}}>No matches found for this filter.</div>
          )}

          {Object.entries(groups).map(([month, matches]) => (
            <div key={month} style={{marginBottom:40}}>
              {/* Month divider */}
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
                <div style={{fontFamily:'var(--font-head)',fontWeight:900,fontSize:13,color:'#E8B23D',letterSpacing:'0.15em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{month}</div>
                <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(232,178,61,0.4),transparent)'}}/>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {matches.map((m, i) => (
                  <MatchCard key={m.id || m.matchNo} match={m} delayIndex={i} />
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
        {t("REGISTER NOW →", "अभी रजिस्टर करें →")}
      </Link>
    </div>
  );
}
