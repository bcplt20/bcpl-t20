import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getTeamDetail, getPointsTable, getMatches, type ApiTeam, type ApiTeamPlayer } from '../lib/api';
import { useLang } from '../lib/i18n';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';

const asset = (url: string) =>
  !url ? "" : url.startsWith("data:") || url.startsWith("http") ? url : import.meta.env.BASE_URL + url.replace(/^\//, "");

const num = (v: unknown) => { const n = Number(v); return isNaN(n) ? 0 : n; };

const ROLE_ABBR: Record<string,string> = { 'Batsman':'BAT', 'Bowler':'BWL', 'All-rounder':'AR', 'Wicket-keeper':'WK' };
const ROLE_COLORS: Record<string,string> = { BAT:'#3B82F6', BWL:'#EF4444', WK:'#F59E0B', AR:'#10B981' };

type PtsRow = { team: string; played: number; won: number; lost: number; noResult: number; points: number; nrr: string | number };
type Match  = { id: string; matchNo: number; team1: string; team2: string; venue: string; scheduledAt: string | null; status: string; winner: string | null; resultDesc: string | null };

export function TeamDetail() {
  const { t } = useLang();
  const [tab, setTab] = React.useState(0);
  const tabs = [t('Squad', 'Squad'), t('Results', 'Results'), t('About', 'About')];

  const slug = React.useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }, []);

  const [team,     setTeam]     = React.useState<ApiTeam | null>(null);
  const [players,  setPlayers]  = React.useState<ApiTeamPlayer[]>([]);
  const [ptsRows,  setPtsRows]  = React.useState<PtsRow[]>([]);
  const [matches,  setMatches]  = React.useState<Match[]>([]);
  const [loading,  setLoading]  = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [loadErr,  setLoadErr]  = React.useState("");
  const [sideErr,  setSideErr]  = React.useState("");

  React.useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    Promise.all([
      getTeamDetail(slug),
      getPointsTable(5).then(p => ({ ok: true as const, p })).catch(() => ({ ok: false as const, p: null })),
      getMatches(5).then(m => ({ ok: true as const, m })).catch(() => ({ ok: false as const, m: null })),
    ])
      .then(([d, pRes, mRes]) => {
        setTeam(d.team); setPlayers(d.players || []);
        if (pRes.ok) setPtsRows((((pRes.p as any)?.table) || []) as PtsRow[]);
        if (mRes.ok) setMatches((((mRes.m as any)?.matches) || []) as Match[]);
        if (!pRes.ok || !mRes.ok) setSideErr('Live standings and results could not be loaded right now — team info below may be incomplete. Please refresh to try again.');
      })
      .catch((e: any) => {
        if (String(e?.message || '').toLowerCase().includes('not found')) setNotFound(true);
        else setLoadErr(e?.message || 'Could not load team');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const ACCENT = team?.color || '#FF7A29';

  const row = ptsRows.find(r => r.team === team?.name);
  const sortedRows = [...ptsRows].sort((a, b) => b.points - a.points || num(b.nrr) - num(a.nrr));
  const rank = team ? sortedRows.findIndex(r => r.team === team.name) + 1 : 0;
  const played = row?.played ?? 0;

  const results = team ? matches
    .filter(m => (m.status === 'completed' || m.status === 'abandoned') && (m.team1 === team.name || m.team2 === team.name))
    .sort((a, b) => (b.scheduledAt || '').localeCompare(a.scheduledAt || ''))
    .map(m => ({
      matchNo: m.matchNo,
      opponent: m.team1 === team.name ? m.team2 : m.team1,
      won: m.winner === team.name,
      nr: m.status === 'abandoned',
      desc: m.resultDesc || '',
      venue: m.venue,
      date: m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }) : '',
    })) : [];

  const heroStats = [
    { label: 'Players', val: String(players.length) },
    { label: 'Record',  val: played > 0 ? `${row!.won}W / ${row!.lost}L` : '—' },
    { label: 'NRR',     val: played > 0 ? `${num(row!.nrr) > 0 ? '+' : ''}${num(row!.nrr).toFixed(2)}` : '—' },
    { label: 'Rank',    val: played > 0 && rank > 0 ? `#${rank}` : '—' },
  ];

  const aboutInfo = team ? [
    { label: 'Home City',       value: team.city || '—' },
    { label: 'Home Ground',     value: team.homeGround || 'To be announced' },
    { label: 'Coach',           value: team.coach || 'To be announced' },
    { label: 'Captain',         value: team.captain || 'To be announced' },
    { label: 'Franchise Owner', value: team.owner || 'To be announced' },
    { label: 'Titles Won',      value: team.titlesWon > 0 ? String(team.titlesWon) : '—' },
  ] : [];

  return (
    <div style={{background:'#060E1C',color:'#fff',minHeight:'100vh',overflowX:'hidden',fontFamily:'Inter,sans-serif'}}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .wrap{max-width:1280px;margin:0 auto;padding:0 16px;}
        .desk-nav{display:none;align-items:center;gap:22px;}
        .ham-btn{display:flex;}
        @media(min-width:640px){.wrap{padding:0 24px}}
        @media(min-width:768px){.wrap{padding:0 32px}}
        @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}.squad-grid{grid-template-columns:repeat(3,1fr)!important;}.about-grid{grid-template-columns:repeat(2,1fr)!important;}}
        @media(min-width:640px){.squad-grid{grid-template-columns:repeat(2,1fr)!important;}}
        .btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;}
        .btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
        .btn-fire:active{transform:scale(0.97);}
        .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
        .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
        @keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

        /* ── FLOATING REGISTER BUTTON ── */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:'Montserrat',sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
@media(max-width:1023px){ .float-reg-btn { display:none; } }

        /* ── HERO STATS RESPONSIVE ── */
        .hero-stats{display:flex;flex-wrap:wrap;gap:10;justify-content:center;}

        /* ── RESULTS TAB MOBILE ── */
        .result-row{display:flex;flex-wrap:wrap;gap:12;align-items:center;}

        /* ── BOTTOM CTA BUTTONS ── */
        .cta-buttons{display:flex;gap:12;justify-content:center;flex-wrap:wrap;}

        @media(max-width:639px){
          .float-reg-btn{bottom:80px;right:16px;padding:12px 16px;font-size:12px;}
          .hero-stats>div{min-width:calc(50% - 5px)!important;}
        }
      `}</style>

      {/* Ambient */}
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse 70% 60% at 30% 30%, ${ACCENT}1A 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(255,122,41,0.07) 0%, transparent 60%)`}}/>
        <svg style={{position:'absolute',bottom:0,left:0,width:'100%',opacity:0.07}} viewBox="0 0 1280 320" preserveAspectRatio="xMidYMax meet">
          <path d="M0,280 Q320,160 640,200 Q960,240 1280,180 L1280,320 L0,320 Z" fill="#1E3A5F"/>
          <rect x="80" y="60" width="8" height="200" fill="#2D4F7A"/>
          <rect x="70" y="50" width="28" height="12" fill="#2D4F7A"/>
          <rect x="1190" y="60" width="8" height="200" fill="#2D4F7A"/>
          <rect x="1180" y="50" width="28" height="12" fill="#2D4F7A"/>
          <rect x="440" y="220" width="400" height="60" fill="rgba(255,255,255,0.03)" rx="4"/>
        </svg>
        {[{top:'15%',left:'10%',d:'0s'},{top:'60%',left:'5%',d:'1.2s'},{top:'30%',left:'90%',d:'2.4s'},{top:'75%',left:'85%',d:'0.6s'},{top:'50%',left:'50%',d:'1.8s'},{top:'10%',left:'70%',d:'3s'},{top:'85%',left:'30%',d:'0.3s'},{top:'40%',left:'20%',d:'2.1s'}].map((p,i)=>(
          <div key={i} style={{position:'absolute',top:p.top,left:p.left,width:3,height:3,borderRadius:'50%',background:i%2===0?ACCENT:'#E8B23D',animation:`floatParticle 4s ease-in-out ${p.d} infinite`}}/>
        ))}
        <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,rgba(255,255,255,0.01) 0px,rgba(255,255,255,0.01) 1px,transparent 1px,transparent 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <SiteHeader active="Teams" />

        {/* LOADING */}
        {loading && (
          <div style={{minHeight:'50vh',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.4)',fontFamily:'Inter,sans-serif',fontSize:15}}>
            Loading team…
          </div>
        )}

        {/* NOT FOUND / ERROR */}
        {!loading && (notFound || (!team && loadErr)) && (
          <div style={{minHeight:'50vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 20px'}}>
            <div style={{textAlign:'center',maxWidth:420}}>
              <div style={{fontSize:48,marginBottom:16}}>🏏</div>
              <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,color:'#fff',marginBottom:10}}>
                {notFound ? 'Team not found' : 'Could not load team'}
              </h1>
              <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,lineHeight:1.7,marginBottom:24,fontFamily:'Inter,sans-serif'}}>
                {notFound ? 'This team does not exist or may have been removed.' : 'Something went wrong — please refresh the page to try again.'}
              </p>
              <Link href="/teams" className="btn-fire" style={{padding:'13px 28px',fontSize:14,borderRadius:12,textDecoration:'none',display:'inline-block'}}>← All Teams</Link>
            </div>
          </div>
        )}

        {!loading && team && (
          <>
            {/* HERO */}
            <section style={{padding:'clamp(48px,6vw,72px) 0 clamp(32px,4vw,56px)',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'min(600px,90vw)',height:'min(600px,90vw)',borderRadius:'50%',background:`radial-gradient(circle,${ACCENT}18,transparent 70%)`,pointerEvents:'none'}}/>
              <div className="wrap" style={{textAlign:'center',position:'relative',zIndex:2}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginBottom:16}}>
                  {team.logoUrl
                    ? <div style={{width:84,height:84,background:'rgba(255,255,255,0.96)',borderRadius:22,padding:8,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 12px 44px ${ACCENT}55`,border:`2px solid ${ACCENT}66`}}>
                        <img src={asset(team.logoUrl)} alt={team.name} style={{width:'92%',height:'92%',objectFit:'contain'}}/>
                      </div>
                    : <span style={{fontSize:52}}>🏏</span>}
                </div>
                <div className="tag-pill" style={{marginBottom:16,borderColor:`${ACCENT}55`,color:ACCENT,background:`${ACCENT}18`}}>
                  SEASON 5{team.city ? ` · ${team.city.toUpperCase()}` : ''}
                </div>
                <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(28px,6vw,76px)',lineHeight:1.0,color:'#fff',marginBottom:24,textShadow:`0 0 60px ${ACCENT}66`}}>
                  {team.name.toUpperCase()}
                </h1>
                <div className="hero-stats" style={{display:'flex',flexWrap:'wrap',gap:10,justifyContent:'center',marginBottom:0}}>
                  {heroStats.map(s=>(
                    <div key={s.label} style={{background:`${ACCENT}14`,border:`1px solid ${ACCENT}33`,borderRadius:14,padding:'14px 20px',textAlign:'center',minWidth:80,flex:'1 1 80px',maxWidth:140}}>
                      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,color:ACCENT}}>{s.val}</div>
                      <div style={{color:'rgba(255,255,255,0.45)',fontSize:11,fontFamily:'Inter,sans-serif',marginTop:2,textTransform:'uppercase',letterSpacing:'0.06em'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* PARTIAL DATA WARNING */}
            {sideErr && (
              <div className="wrap" style={{marginBottom:24}}>
                <div style={{background:'rgba(245,158,11,0.09)',border:'1px solid rgba(245,158,11,0.35)',borderRadius:12,padding:'13px 18px',color:'#F59E0B',fontFamily:'Inter,sans-serif',fontSize:13,textAlign:'center'}}>
                  ⚠️ {sideErr}
                </div>
              </div>
            )}

            {/* TAB BAR */}
            <div style={{position:'sticky',top:'var(--sh-h, 64px)',zIndex:100,background:'rgba(6,14,28,0.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom:40}}>
              <div className="wrap">
                <div style={{display:'flex',gap:0}}>
                  {tabs.map((t,i)=>(
                    <button key={t} onClick={()=>setTab(i)} style={{flex:1,maxWidth:180,padding:'16px 0',background:'none',border:'none',color:tab===i?ACCENT:'rgba(255,255,255,0.45)',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,cursor:'pointer',letterSpacing:'0.06em',position:'relative',transition:'color 0.2s'}}>
                      {t}
                      {tab===i&&<div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:ACCENT,borderRadius:'2px 2px 0 0'}}/>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="wrap" style={{paddingBottom:100}}>

              {/* SQUAD TAB */}
              {tab===0&&(
                players.length === 0
                  ? (
                    <div style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:`1px solid ${ACCENT}30`,borderRadius:20,padding:'clamp(36px,6vw,64px) 24px',textAlign:'center'}}>
                      <div style={{fontSize:46,marginBottom:16}}>👥</div>
                      <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,26px)',color:'#fff',marginBottom:10}}>SQUAD ANNOUNCED AFTER THE AUCTION</h2>
                      <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,lineHeight:1.7,maxWidth:440,margin:'0 auto 24px',fontFamily:'Inter,sans-serif'}}>
                        The {team.name} squad will be finalised at the BCPL Season 5 players' auction in August 2026. Register now for your chance to be picked.
                      </p>
                      <Link href="/register" className="btn-fire" style={{padding:'13px 28px',fontSize:14,borderRadius:12,textDecoration:'none',display:'inline-block'}}>🏏 Register for Phase 1 →</Link>
                    </div>
                  )
                  : (
                    <div className="squad-grid" style={{display:'grid',gridTemplateColumns:'1fr',gap:16}}>
                      {players.map((p,i)=>{
                        const roleAb = ROLE_ABBR[p.role] || p.role;
                        const rc = ROLE_COLORS[roleAb] || ACCENT;
                        return (
                          <div key={p.id} style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:`1px solid ${ACCENT}2E`,borderRadius:16,padding:'18px 16px',display:'flex',alignItems:'center',gap:14,animation:`fadeSlide 0.4s ease ${i*0.05}s both`,transition:'border-color 0.2s',boxShadow:'0 8px 32px rgba(0,0,0,0.3)'}}>
                            {p.photoUrl
                              ? <img src={asset(p.photoUrl)} alt={p.name} style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',border:`2px solid ${ACCENT}55`,flexShrink:0}}/>
                              : <div style={{width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${ACCENT}33,${ACCENT}11)`,border:`2px solid ${ACCENT}55`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:16,color:ACCENT,flexShrink:0}}>
                                  {p.jerseyNo || p.name[0]}
                                </div>}
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                                <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:14,color:'#F8F4EE',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</span>
                                {p.isCaptain&&<span style={{background:'rgba(232,178,61,0.2)',border:'1px solid rgba(232,178,61,0.5)',color:'#E8B23D',fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:100,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.06em',flexShrink:0}}>C</span>}
                                {p.isViceCaptain&&<span style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.25)',color:'rgba(255,255,255,0.75)',fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:100,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.06em',flexShrink:0}}>VC</span>}
                              </div>
                              <div style={{display:'flex',gap:6,marginTop:6,alignItems:'center',flexWrap:'wrap'}}>
                                <span style={{background:`${rc}22`,border:`1px solid ${rc}55`,color:rc,fontSize:10,fontWeight:800,padding:'2px 8px',borderRadius:6,fontFamily:'Montserrat,sans-serif',letterSpacing:'0.06em'}}>{roleAb}</span>
                                {p.jerseyNo && <span style={{color:'rgba(255,255,255,0.35)',fontSize:11,fontFamily:'Inter,sans-serif'}}>#{p.jerseyNo}</span>}
                                {p.state && <span style={{color:'rgba(255,255,255,0.35)',fontSize:11,fontFamily:'Inter,sans-serif'}}>{p.state}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
              )}

              {/* RESULTS TAB */}
              {tab===1&&(
                results.length === 0
                  ? (
                    <div style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:`1px solid ${ACCENT}30`,borderRadius:20,padding:'clamp(36px,6vw,64px) 24px',textAlign:'center'}}>
                      <div style={{fontSize:46,marginBottom:16}}>📋</div>
                      <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,26px)',color:'#fff',marginBottom:10}}>NO MATCHES PLAYED YET</h2>
                      <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,lineHeight:1.7,maxWidth:440,margin:'0 auto',fontFamily:'Inter,sans-serif'}}>
                        The Season 5 tournament begins in September 2026. Match results will appear here once the league is underway.
                      </p>
                    </div>
                  )
                  : (
                    <div style={{display:'flex',flexDirection:'column',gap:12}}>
                      {results.map((r,i)=>(
                        <div key={i} style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:'18px 16px',borderLeft:`4px solid ${r.nr?'#94A3B8':r.won?'#22C55E':'#E8493F'}`,animation:`fadeSlide 0.4s ease ${i*0.06}s both`,display:'flex',flexWrap:'wrap',gap:12,alignItems:'center'}}>
                          <div style={{minWidth:70}}>
                            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:2}}>{r.date}</div>
                            <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'rgba(255,255,255,0.35)'}}>{r.venue}</div>
                            <div style={{fontFamily:'Montserrat,sans-serif',fontSize:10,color:'rgba(255,122,41,0.7)',fontWeight:700,marginTop:2}}>Match {r.matchNo}</div>
                          </div>
                          <div style={{flex:1,display:'flex',alignItems:'center',gap:10,justifyContent:'center',flexWrap:'wrap',minWidth:160}}>
                            <div style={{textAlign:'center'}}>
                              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:15,color:'rgba(255,255,255,0.85)'}}>vs {r.opponent}</div>
                              {r.desc && <div style={{fontFamily:'Inter,sans-serif',fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:3}}>{r.desc}</div>}
                            </div>
                            <div style={{padding:'6px 12px',borderRadius:8,background:r.nr?'rgba(148,163,184,0.15)':r.won?'rgba(34,197,94,0.15)':'rgba(232,73,63,0.15)',border:`1px solid ${r.nr?'rgba(148,163,184,0.4)':r.won?'rgba(34,197,94,0.4)':'rgba(232,73,63,0.4)'}`,fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:11,color:r.nr?'#94A3B8':r.won?'#22C55E':'#E8493F',letterSpacing:'0.08em'}}>
                              {r.nr?'NO RESULT':r.won?'WON':'LOST'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
              )}

              {/* ABOUT TAB */}
              {tab===2&&(
                <div>
                  <div className="about-grid" style={{display:'grid',gridTemplateColumns:'1fr',gap:14,marginBottom:28}}>
                    {aboutInfo.map((a,i)=>(
                      <div key={i} style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:`1px solid ${ACCENT}26`,borderRadius:16,padding:'20px 22px',animation:`fadeSlide 0.4s ease ${i*0.07}s both`}}>
                        <div style={{color:'rgba(255,255,255,0.35)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:'Montserrat,sans-serif',marginBottom:8}}>{a.label}</div>
                        <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#F8F4EE'}}>{a.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))',backdropFilter:'blur(24px)',border:`1px solid ${ACCENT}26`,borderRadius:16,padding:'24px 22px'}}>
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#F8F4EE',marginBottom:12}}>About the Franchise</div>
                    <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,lineHeight:1.8,fontFamily:'Inter,sans-serif'}}>
                      {team.name} {team.city ? `represent ${team.city} as ` : 'are '}one of the ten franchises of BCPL Season 5 — India's corporate cricket league. {players.length > 0 ? `The squad currently has ${players.length} player${players.length > 1 ? 's' : ''}.` : "The squad will be finalised at the players' auction in August 2026."} The tournament begins in September 2026.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* BOTTOM CTA */}
            <section style={{padding:'0 0 80px'}}>
              <div className="wrap">
                <div style={{background:`linear-gradient(135deg,${ACCENT}14,rgba(255,122,41,0.06),rgba(15,34,71,0.92))`,backdropFilter:'blur(32px)',border:`1px solid ${ACCENT}30`,borderRadius:24,padding:'clamp(28px,4vw,48px) clamp(20px,3vw,32px)',textAlign:'center'}}>
                  <div className="tag-pill" style={{marginBottom:16,borderColor:`${ACCENT}55`,color:ACCENT,background:`${ACCENT}18`}}>🏏 SEASON 5 TRIALS OPEN</div>
                  <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,4vw,34px)',color:'#fff',marginBottom:12}}>
                    WANT TO PLAY FOR {team.name.toUpperCase()}?
                  </h2>
                  <p style={{color:'rgba(255,255,255,0.55)',fontSize:15,lineHeight:1.7,maxWidth:460,margin:'0 auto 28px',fontFamily:'Inter,sans-serif'}}>
                    Register today and get your shot at representing {team.city || 'your city'} on the BCPL stage. All roles open — Bat, Bowl, WK, All-Rounder.
                  </p>
                  <div className="cta-buttons" style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
                    <Link href="/register" className="btn-fire" style={{padding:'16px 32px',fontSize:15,borderRadius:14,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8}}>🏏 Register for Phase 1 →</Link>
                    <Link href="/teams" style={{padding:'16px 24px',fontSize:15,borderRadius:14,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.8)',fontFamily:'Montserrat,sans-serif',fontWeight:700,textDecoration:'none',display:'inline-flex',alignItems:'center'}}>← All Teams</Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        <StickyRegisterCTA />

        <BCPLFooter />
      </div>
      {/* ── FLOATING REGISTER BUTTON ── */}
      <Link href="/register" className="float-reg-btn float-reg-pulse" style={{textDecoration:"none"}}>
        {t("🏏 REGISTER NOW →", "🏏 अभी रजिस्टर करें →")}
      </Link>
    </div>
  );
}
