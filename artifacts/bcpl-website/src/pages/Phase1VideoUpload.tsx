import React, { useState, useRef } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';

const SAMPLE_VIDEOS = [
  {
    role: 'Batsman',
    icon: '🏏',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg,#0a1f44 0%,#1a3a6e 50%,#0d2a52 100%)',
    duration: '1:52',
    description: 'Cover drive · Pull shot · Sweep shot · Footwork',
    what: 'Watch how to demonstrate 3+ strokes clearly on camera — stance, backlift, and follow-through all visible.',
    ytSearch: 'cricket batting trial video technique showcase',
    badge: 'Most Selected',
    badgeColor: '#3B82F6',
  },
  {
    role: 'Bowler',
    icon: '🎳',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg,#1a0a44 0%,#3a1a6e 50%,#2a0d52 100%)',
    duration: '1:48',
    description: 'Outswinger · Yorker · Change of pace · Run-up',
    what: 'Full run-up visible, delivery stride, ball release — scouts check your action, seam position, and variation.',
    ytSearch: 'cricket bowling trial video technique fast medium spin',
    badge: 'High Demand',
    badgeColor: '#8B5CF6',
  },
  {
    role: 'Wicket-Keeper',
    icon: '🧤',
    color: '#06B6D4',
    gradient: 'linear-gradient(135deg,#041f2e 0%,#0a3d4f 50%,#062a3a 100%)',
    duration: '1:55',
    description: 'Standing up · Stumpings · Catches · Wide takes',
    what: 'Film at chest height from mid-off angle — glove positioning, quick release, and agility are key scoring factors.',
    ytSearch: 'cricket wicket keeper trial video stumping catch technique',
    badge: 'Rare Role',
    badgeColor: '#06B6D4',
  },
  {
    role: 'All-Rounder',
    icon: '⭐',
    color: '#E8B23D',
    gradient: 'linear-gradient(135deg,#2e1f04 0%,#4f3a0a 50%,#3a2a06 100%)',
    duration: '2:00',
    description: '1 min batting · 1 min bowling · Clear transitions',
    what: 'Split exactly 50-50. Use a visible title card between segments. Scouts look for equal competence in both skills.',
    ytSearch: 'cricket all rounder trial video batting bowling showcase',
    badge: 'Top Auction',
    badgeColor: '#E8B23D',
  },
];

export function Phase1VideoUpload() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
const NAV_ROUTES: Record<string,string> = { 'Home':'', 'Match Center':'match-center', 'Teams':'teams', 'Sponsors':'sponsors', 'Photos':'photos', 'Videos':'videos', 'About':'about', 'FAQ':'faq', 'Contact':'contact' };

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', color:'#F0EDE8', fontFamily:"'Inter',sans-serif", overflowX:'hidden', paddingBottom:'calc(120px + env(safe-area-inset-bottom))' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes pulseDanger{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}50%{box-shadow:0 0 0 10px rgba(239,68,68,0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes uploadBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes dashedMarch{to{stroke-dashoffset:-20}}

        .wrap{max-width:1140px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}

        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}

        .btn-primary{
          background:linear-gradient(135deg,#FF7A29,#D95E10);
          border:none;border-radius:12px;color:#fff;
          font-family:Montserrat,sans-serif;font-weight:900;
          letter-spacing:0.06em;cursor:pointer;
          transition:transform .15s,filter .2s;
        }
        .btn-primary:hover{filter:brightness(1.15);transform:translateY(-2px)}

        .upload-zone{
          border:2px dashed rgba(255,122,41,0.35);
          background:#060C18;
          border-radius:12px;
          padding:40px 20px;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          text-align:center;cursor:pointer;
          transition:border-color .2s,background .2s;
          min-height:200px;
          width:100%;
        }
        .upload-zone:hover,.upload-zone.drag{border-color:#FF7A29;background:rgba(255,122,41,0.04)}

        .guideline-card{
          background:#060C18;border-left:3px solid #FF7A29;
          padding:14px 16px;border-radius:0;margin-bottom:10px;
        }
        .guideline-card:last-child{margin-bottom:0}

        .tip-check{
          display:flex;align-items:flex-start;gap:10px;
          padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);
          font-size:13px;color:rgba(255,255,255,0.65);line-height:1.5;
        }
        .tip-check:last-child{border-bottom:none}

        .info-chip{
          display:inline-flex;align-items:center;gap:6px;
          padding:6px 14px;border-radius:12px;
          font-family:Montserrat,sans-serif;font-weight:700;font-size:11px;
          letter-spacing:.06em;
        }

        .two-col{display:flex;flex-direction:column;gap:24px}
        @media(min-width:900px){.two-col{flex-direction:row;gap:32px}}
        .col-left{flex:1;min-width:0}
        .col-right{flex:1;min-width:0}

        .format-chips{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
        .format-chip{flex:1;min-width:80px;background:#060C18;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:10px 14px}

        .filming-grid{display:grid;grid-template-columns:1fr;gap:0}
        @media(min-width:600px){.filming-grid{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}}

        .sticky-banner{position:fixed;bottom:0;left:0;right:0;zIndex:500;background:rgba(4,10,20,0.98);backdropFilter:blur(20px);borderTop:2px solid #FF7A29;padding:12px 16px calc(12px + env(safe-area-inset-bottom))}
        .sticky-inner{max-width:1140px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .sticky-text{display:flex;align-items:flex-start;gap:10px;flex:1;min-width:0}

        .fade-in{animation:fadeUp .45s ease both}

        .sample-grid{display:grid;grid-template-columns:1fr;gap:16px}
        @media(min-width:600px){.sample-grid{grid-template-columns:1fr 1fr}}
        @media(min-width:1000px){.sample-grid{grid-template-columns:repeat(4,1fr)}}

        .sample-card{
          position:relative;border-radius:14px;overflow:hidden;cursor:pointer;
          border:1px solid rgba(255,255,255,0.07);
          transition:transform .2s,box-shadow .2s;
        }
        .sample-card:hover{transform:translateY(-4px)}
        .sample-card:hover .play-btn{transform:translate(-50%,-50%) scale(1.12)}

        .play-btn{
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:52px;height:52px;border-radius:50%;
          background:rgba(255,122,41,0.9);
          display:flex;align-items:center;justify-content:center;
          font-size:18px;transition:transform .2s;
          box-shadow:0 4px 24px rgba(255,122,41,0.5);
          border:2px solid rgba(255,255,255,0.3);
        }

        .video-modal-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,0.92);
          display:flex;align-items:center;justify-content:center;
          z-index:800;padding:16px;
        }
        .video-modal{
          background:#060C18;border-radius:16px;
          border:1px solid rgba(255,255,255,0.12);
          width:100%;max-width:640px;overflow:hidden;
        }
      `}</style>

      <div style={{ position:'sticky', top:0, zIndex:300 }}>
      {/* ── TICKER ── */}
      <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 30s linear infinite' }}>
          {[...Array(4)].map((_,i) => (
            <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff' }}>
              &nbsp;🏏 SEASON 5 REGISTRATIONS OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 50+ CITIES &nbsp;·&nbsp; BACKED BY SOURAV GANGULY &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
        <div className="wrap" style={{ height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
                          <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{ height:42, width:'auto', objectFit:'contain', display:'block', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}/>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px' }}>
                <span style={{ fontSize:9 }}>🏆</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
              </div>
          </a>
          <div className="desk-nav">
            {NAV.map(l => <a key={l} href={'/' + NAV_ROUTES[l]} style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, textDecoration:'none', letterSpacing:'.04em' }}>{l}</a>)}
            <button className="btn-primary" style={{ padding:'10px 24px', fontSize:12 }}>REGISTER NOW →</button>
          </div>
          <button className="ham-btn" onClick={() => setMenuOpen(o => !o)}>
            {[0,1,2].map(i => <span key={i} style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:1, transition:'all .25s', transform: i===0&&menuOpen?'rotate(45deg) translate(5px,5px)':i===1&&menuOpen?'scaleX(0)':i===2&&menuOpen?'rotate(-45deg) translate(5px,-5px)':'' }} />)}
          </button>
        </div>
      </nav>
      </div>{/* /sticky-top */}

      {menuOpen && (
        <div style={{ position:'fixed', inset:0, background:'#040C18', zIndex:400, display:'flex', flexDirection:'column', padding:'72px 24px 40px', overflowY:'auto' }}>
          <button onClick={() => setMenuOpen(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:38, height:38, borderRadius:4, cursor:'pointer', fontSize:18 }}>✕</button>
          {NAV.map(l => <a key={l} href={'/' + NAV_ROUTES[l]} onClick={()=>setMenuOpen(false)} style={{ color:'rgba(255,255,255,0.85)', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{l}</a>)}
          <button className="btn-primary" style={{ marginTop:24, padding:'16px', fontSize:15 }}>REGISTER NOW →</button>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div style={{ background:'linear-gradient(180deg,#060C18 0%,#06101E 100%)', borderBottom:'1px solid rgba(255,255,255,0.06)', paddingTop:36, paddingBottom:32 }}>
        <div className="wrap">
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.2em', color:'rgba(255,255,255,0.3)', marginBottom:10, textTransform:'uppercase' }}>Phase 1 · Step 2 of 3</div>
              <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(24px,5vw,44px)', color:'#fff', letterSpacing:'-.01em', textTransform:'uppercase', lineHeight:.95, marginBottom:8 }}>
                UPLOAD YOUR<br /><span style={{ color:'#FF7A29' }}>TRIAL VIDEO</span>
              </h1>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13, lineHeight:1.6, maxWidth:460 }}>Your video is your ticket to the ground trials. Make every second count.</p>
            </div>
            {/* Deadline badge */}
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.4)', padding:'10px 16px', borderRadius:12, animation:'pulseDanger 2s ease-in-out infinite', flexShrink:0 }}>
              <span style={{ fontSize:14 }}>⚠️</span>
              <div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, color:'#EF4444', letterSpacing:'.1em' }}>7 DAYS REMAINING</div>
                <div style={{ fontSize:10, color:'rgba(239,68,68,0.7)', fontWeight:600 }}>Upload before deadline</div>
              </div>
            </div>
          </div>

          {/* Player summary bar */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:24 }}>
            {[
              { icon:'🏏', label:'Batsman', bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.35)', color:'#60A5FA' },
              { icon:'📍', label:'Mumbai', bg:'rgba(255,122,41,0.1)', border:'rgba(255,122,41,0.35)', color:'#FF7A29' },
              { icon:'🎫', label:'BCPL-S5-MUM-BAT-7432', bg:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.55)' },
              { icon:'✅', label:'PAID ₹299', bg:'rgba(34,197,94,0.1)', border:'rgba(34,197,94,0.35)', color:'#22C55E' },
            ].map(c => (
              <span key={c.label} className="info-chip" style={{ background:c.bg, border:`1px solid ${c.border}`, color:c.color }}>
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="wrap" style={{ marginTop:36 }}>
        <div className="two-col">

          {/* ── LEFT: Upload zone ── */}
          <div className="col-left">
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:10, letterSpacing:'.18em', color:'rgba(255,255,255,0.3)', marginBottom:14, textTransform:'uppercase' }}>Upload Zone</div>

            {/* Dropzone */}
            <div
              className={`upload-zone${dragging ? ' drag' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); }}
            >
              <div style={{ fontSize:44, marginBottom:16, animation:'uploadBounce 2s ease-in-out infinite' }}>🎬</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#fff', letterSpacing:'.04em', marginBottom:8 }}>DRAG &amp; DROP YOUR VIDEO</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:24, lineHeight:1.6 }}>
                MP4 &nbsp;·&nbsp; MOV &nbsp;·&nbsp; AVI &nbsp;·&nbsp; Max 500MB &nbsp;·&nbsp; Max 2 minutes
              </div>
              <label style={{ display:'inline-block' }}>
                <input type="file" accept="video/*" style={{ display:'none' }} />
                <span style={{ display:'inline-block', background:'rgba(255,122,41,0.12)', border:'1px solid rgba(255,122,41,0.4)', color:'#FF7A29', padding:'10px 24px', borderRadius:12, fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, letterSpacing:'.08em', cursor:'pointer', transition:'all .2s' }}>
                  + Browse Files
                </span>
              </label>
              <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.3)', fontSize:11 }}>
                <span style={{ animation:'uploadBounce 1.5s ease-in-out infinite', display:'inline-block' }}>↓</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:600, letterSpacing:'.04em' }}>Drag down to see sample video guidelines</span>
              </div>
            </div>

            {/* Sample uploaded state */}
            <div style={{ marginTop:16, background:'#0A1727', border:'1px solid #22C55E', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <div style={{ width:40, height:40, background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.4)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🎥</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:'#22C55E', letterSpacing:'.02em', marginBottom:3 }}>✅ trial_video_final.mp4</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span>124 MB</span>
                  <span>·</span>
                  <span>1:47 duration</span>
                  <span>·</span>
                  <span style={{ color:'#22C55E', fontWeight:700 }}>Ready to submit</span>
                </div>
              </div>
              <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #22C55E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>✓</div>
            </div>

            {/* Format info */}
            <div className="format-chips">
              {[
                { label:'Max Size', val:'500 MB' },
                { label:'Max Duration', val:'2 min' },
                { label:'Formats', val:'MP4, MOV, AVI' },
              ].map(f => (
                <div key={f.label} className="format-chip">
                  <div style={{ fontSize:9, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.14em', color:'rgba(255,255,255,0.3)', marginBottom:3 }}>{f.label}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#FF7A29' }}>{f.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Guidelines ── */}
          <div className="col-right">
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:10, letterSpacing:'.18em', color:'rgba(255,255,255,0.3)', marginBottom:14, textTransform:'uppercase' }}>What Scouts Look For</div>

            <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'0 0 4px' }}>
              <div style={{ borderLeft:'4px solid #FF7A29', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#FF7A29', letterSpacing:'.06em', textTransform:'uppercase' }}>Role-Specific Guidelines</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>Follow your role requirements exactly for best scout scores</div>
              </div>

              {/* Role cards */}
              <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  {
                    icon:'🏏', role:'Batsman', color:'#3B82F6',
                    req:'Show 3+ strokes: drives, pulls & sweeps',
                    tips:['Cover drive off front foot','Pull shot to leg side','Reverse or conventional sweep'],
                  },
                  {
                    icon:'🎳', role:'Bowler', color:'#8B5CF6',
                    req:'5+ deliveries — mix pace & swing',
                    tips:['Outswinger & inswinger pair','Yorker delivery','Change of pace ball'],
                  },
                  {
                    icon:'🧤', role:'Wicket-Keeper', color:'#06B6D4',
                    req:'3+ takes & stumpings, glove work',
                    tips:['Caught behind the stumps','Quick stumping drill','Wide ball diving take'],
                  },
                  {
                    icon:'⭐', role:'All-Rounder', color:'#E8B23D',
                    req:'2 min split — 1 min bat + 1 min bowl',
                    tips:['Batting first half','Bowling second half','Clear scene transitions'],
                  },
                ].map(r => (
                  <div className="guideline-card" key={r.role} style={{ borderLeftColor:r.color }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:20 }}>{r.icon}</span>
                      <div>
                        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, color:'#fff', letterSpacing:'.03em' }}>{r.role}</div>
                        <div style={{ fontSize:11, color:r.color, fontWeight:700 }}>{r.req}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {r.tips.map(t => (
                        <span key={t} style={{ fontSize:10, color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', padding:'3px 9px', borderRadius:12, fontWeight:600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SAMPLE VIDEOS ── */}
        <div style={{ marginTop:36, background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'24px 20px' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, letterSpacing:'.16em', color:'rgba(255,255,255,0.4)', marginBottom:6, textTransform:'uppercase' }}>🎬 Sample Trial Videos</div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:1.5, maxWidth:520 }}>
                Sample videos for each role — watch before filming your own trial video.
              </div>
            </div>
            <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:10, padding:'7px 14px', fontSize:11, color:'#22C55E', fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em', flexShrink:0 }}>
              ✓ Season 4 Best Entries
            </div>
          </div>

          <div className="sample-grid">
            {SAMPLE_VIDEOS.map((v, idx) => (
              <div key={v.role} className="sample-card" onClick={() => setActiveVideo(idx)}
                style={{ boxShadow: `0 4px 24px ${v.color}18` }}>
                {/* Thumbnail */}
                <div style={{ background: v.gradient, height:160, position:'relative', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'12px 14px' }}>
                  {/* Cricket lines overlay */}
                  <div style={{ position:'absolute', inset:0, opacity:.06, backgroundImage:'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 20px)', pointerEvents:'none' }} />
                  {/* Badge top-right */}
                  <div style={{ position:'absolute', top:10, right:10, background:`${v.color}33`, border:`1px solid ${v.color}66`, borderRadius:6, padding:'3px 8px', fontSize:9, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.08em', color:v.color }}>
                    {v.badge}
                  </div>
                  {/* Duration top-left */}
                  <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.6)', borderRadius:6, padding:'3px 8px', fontSize:10, fontWeight:700, color:'#fff' }}>
                    ⏱ {v.duration}
                  </div>
                  {/* Large role icon */}
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-60%)', fontSize:42, opacity:.4 }}>{v.icon}</div>
                  {/* Play button */}
                  <div className="play-btn">▶</div>
                  {/* Role label */}
                  <div style={{ position:'relative', zIndex:1 }}>
                    <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, color:'#fff', letterSpacing:'.06em' }}>{v.icon} {v.role}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{v.description}</div>
                  </div>
                </div>
                {/* Card body */}
                <div style={{ background:'#060C18', padding:'12px 14px', borderTop:`2px solid ${v.color}44` }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.55 }}>{v.what}</div>
                  <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:v.color, flexShrink:0 }} />
                    <span style={{ fontSize:10, color:v.color, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em' }}>WATCH SAMPLE ▶</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FILMING TIPS ── */}
        <div style={{ marginTop:36, background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'24px 20px' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, letterSpacing:'.16em', color:'rgba(255,255,255,0.4)', marginBottom:16, textTransform:'uppercase' }}>📹 Filming Tips</div>
          <div className="filming-grid">
            {[
              { ok:true,  tip:'Good natural light or indoor stadium lighting' },
              { ok:true,  tip:'Camera at stumps height, side-on angle for batting/bowling' },
              { ok:true,  tip:'Wear proper cricket gear: whites or team kit' },
              { ok:false, tip:'No watermarks, brand logos, or social media handles' },
              { ok:false, tip:'No selfie-style or front-facing camera clips' },
            ].map(t => (
              <div key={t.tip} className="tip-check">
                <span style={{ fontSize:15, flexShrink:0, color: t.ok ? '#22C55E' : '#EF4444' }}>{t.ok ? '✓' : '✗'}</span>
                <span style={{ color: t.ok ? 'rgba(255,255,255,0.65)' : 'rgba(239,68,68,0.75)' }}>{t.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── VIDEO MODAL ── */}
      {activeVideo !== null && (
        <div className="video-modal-overlay" onClick={() => setActiveVideo(null)}>
          <div className="video-modal" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#fff' }}>
                  {SAMPLE_VIDEOS[activeVideo].icon} {SAMPLE_VIDEOS[activeVideo].role} — Sample Trial Video
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:3 }}>
                  Season 4 best entry · {SAMPLE_VIDEOS[activeVideo].duration}
                </div>
              </div>
              <button onClick={() => setActiveVideo(null)} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', width:34, height:34, borderRadius:8, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            {/* Video area */}
            <div style={{ background: SAMPLE_VIDEOS[activeVideo].gradient, height:240, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, opacity:.05, backgroundImage:'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 20px)' }} />
              <div style={{ fontSize:56, opacity:.3 }}>{SAMPLE_VIDEOS[activeVideo].icon}</div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, textAlign:'center', padding:'0 24px', lineHeight:1.6, position:'relative' }}>
                Sample videos will be available once the first season's trial entries are approved.<br />
                <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>In the meantime, use the YouTube guide below ↓</span>
              </div>
            </div>

            {/* What to show */}
            <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'rgba(255,255,255,0.3)', marginBottom:8, textTransform:'uppercase' }}>What Scouts Look For</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{SAMPLE_VIDEOS[activeVideo].what}</div>
              <div style={{ marginTop:10, display:'flex', gap:6, flexWrap:'wrap' }}>
                {SAMPLE_VIDEOS[activeVideo].description.split(' · ').map(tag => (
                  <span key={tag} style={{ fontSize:10, color:SAMPLE_VIDEOS[activeVideo].color, background:`${SAMPLE_VIDEOS[activeVideo].color}15`, border:`1px solid ${SAMPLE_VIDEOS[activeVideo].color}33`, padding:'3px 10px', borderRadius:12, fontWeight:700 }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* YouTube CTA */}
            <div style={{ padding:'14px 20px', display:'flex', gap:10, flexWrap:'wrap' }}>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(SAMPLE_VIDEOS[activeVideo].ytSearch)}`}
                target="_blank"
                rel="noreferrer"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 16px', background:'rgba(255,0,0,0.12)', border:'1px solid rgba(255,0,0,0.35)', borderRadius:10, color:'#FF4444', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, letterSpacing:'.06em', textDecoration:'none' }}
              >
                ▶ Watch Reference on YouTube
              </a>
              <button onClick={() => setActiveVideo(null)} style={{ padding:'11px 16px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'rgba(255,255,255,0.5)', fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STICKY BOTTOM BANNER ── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:500, background:'rgba(4,10,20,0.98)', backdropFilter:'blur(20px)', borderTop:'2px solid #FF7A29', padding:`10px 16px calc(10px + env(safe-area-inset-bottom))` }}>
        <div style={{ maxWidth:1140, margin:'0 auto', display:'flex', flexDirection:'column', gap:8 }}>
          {/* Warning text row */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <span style={{ fontSize:14, flexShrink:0, lineHeight:1.4 }}>⚠️</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)', lineHeight:1.4 }}>
              <strong style={{ color:'#FF7A29', fontFamily:'Montserrat,sans-serif', letterSpacing:'.04em' }}>VIDEO MUST BE UPLOADED WITHIN 7 DAYS.</strong> Late submissions will not be reviewed.
            </span>
          </div>
          {/* Action row */}
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button className="btn-primary" style={{ flex:1, padding:'11px 16px', fontSize:13, whiteSpace:'nowrap' }}>
              SUBMIT VIDEO →
            </button>
            {/* TEST MODE */}
            <button onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/result'; }}
              style={{ padding:'8px 12px', background:'none', border:'1px dashed rgba(34,197,94,0.3)', borderRadius:8, color:'rgba(34,197,94,0.5)', fontSize:11, cursor:'pointer', fontFamily:'Montserrat,sans-serif', fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>
              🧪 Test
            </button>
          </div>
        </div>
      </div>

      <BCPLFooter />
    </div>
  );
}
