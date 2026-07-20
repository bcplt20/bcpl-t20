import React, { useState } from 'react';

export function Phase1VideoUpload() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];

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
      `}</style>

      {/* ── TICKER ── */}
      <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 30s linear infinite' }}>
          {[...Array(4)].map((_,i) => (
            <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff' }}>
              &nbsp;🏏 SEASON 5 REGISTRATIONS OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 21 TRIAL CITIES &nbsp;·&nbsp; BACKED BY SOURAV GANGULY &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position:'sticky', top:0, zIndex:300, background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
        <div className="wrap" style={{ height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, lineHeight:1 }}>
              <span style={{ color:'#FF7A29' }}>BCPL</span>
              <span style={{ color:'#fff' }}> T20</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', borderLeft:'2px solid rgba(255,122,41,0.4)', paddingLeft:10, gap:1 }}>
              <span style={{ fontSize:8, fontWeight:800, color:'#FF7A29', letterSpacing:'.16em' }}>SEASON 5</span>
              <span style={{ fontSize:7, color:'rgba(255,255,255,0.35)', letterSpacing:'.08em' }}>KRIPARTI PLAYING11</span>
            </div>
          </div>
          <div className="desk-nav">
            {NAV.map(l => <a key={l} href="#" style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, textDecoration:'none', letterSpacing:'.04em' }}>{l}</a>)}
            <button className="btn-primary" style={{ padding:'10px 24px', fontSize:12 }}>REGISTER NOW →</button>
          </div>
          <button className="ham-btn" onClick={() => setMenuOpen(o => !o)}>
            {[0,1,2].map(i => <span key={i} style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:1, transition:'all .25s', transform: i===0&&menuOpen?'rotate(45deg) translate(5px,5px)':i===1&&menuOpen?'scaleX(0)':i===2&&menuOpen?'rotate(-45deg) translate(5px,-5px)':'' }} />)}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{ position:'fixed', inset:0, background:'#040C18', zIndex:400, display:'flex', flexDirection:'column', padding:'72px 24px 40px', overflowY:'auto' }}>
          <button onClick={() => setMenuOpen(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:38, height:38, borderRadius:4, cursor:'pointer', fontSize:18 }}>✕</button>
          {NAV.map(l => <a key={l} href="#" style={{ color:'rgba(255,255,255,0.85)', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{l}</a>)}
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

      {/* ── STICKY BOTTOM BANNER ── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:500, background:'rgba(4,10,20,0.98)', backdropFilter:'blur(20px)', borderTop:'2px solid #FF7A29', padding:`12px 16px calc(12px + env(safe-area-inset-bottom))` }}>
        <div style={{ maxWidth:1140, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, flex:1, minWidth:0 }}>
            <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>⚠️</span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>
              <strong style={{ color:'#FF7A29', fontFamily:'Montserrat,sans-serif', letterSpacing:'.04em' }}>VIDEO MUST BE UPLOADED WITHIN 7 DAYS.</strong> Late submissions will not be reviewed.
            </span>
          </div>
          <button className="btn-primary" style={{ padding:'13px 24px', fontSize:13, whiteSpace:'nowrap', flexShrink:0, width:'100%', maxWidth:200 }}>
            SUBMIT VIDEO →
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ marginTop:64, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:32, paddingBottom:32 }}>
        <div className="wrap" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20 }}>
            <span style={{ color:'#FF7A29' }}>BCPL</span>
            <span style={{ color:'#fff' }}> T20</span>
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', letterSpacing:'.08em', textAlign:'center' }}>
            Kriparti Playing 11 Pvt. Ltd. &nbsp;·&nbsp; Season 5 &nbsp;·&nbsp; #OfficeSeStadiumtak
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', letterSpacing:'.06em' }}>
            © 2025 BCPL T20. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
