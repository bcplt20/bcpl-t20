import React, { useState } from 'react';

export function Phase1PaymentReceipt() {
  const [menuOpen, setMenuOpen] = useState(false);
  const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', color:'#F0EDE8', fontFamily:"'Inter',sans-serif", overflowX:'hidden', paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes checkPop{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.18) rotate(6deg);opacity:1}80%{transform:scale(0.94)}100%{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes ringPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}50%{box-shadow:0 0 0 18px rgba(34,197,94,0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes barcodeScan{0%{opacity:0.3}50%{opacity:1}100%{opacity:0.3}}

        .wrap{max-width:1100px;margin:0 auto;padding:0 20px}
        @media(min-width:768px){.wrap{padding:0 32px}}

        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}

        .btn-primary{
          background:linear-gradient(135deg,#FF7A29,#D95E10);
          border:none;border-radius:2px;color:#fff;
          font-family:Montserrat,sans-serif;font-weight:900;
          letter-spacing:0.06em;cursor:pointer;
          transition:transform .15s,filter .2s;
        }
        .btn-primary:hover{filter:brightness(1.15);transform:translateY(-2px)}

        .receipt-row{
          display:flex;justify-content:space-between;align-items:center;
          padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.05);
          font-size:13px;
        }
        .receipt-row:last-child{border-bottom:none}
        .receipt-label{color:rgba(255,255,255,0.4);font-weight:600;letter-spacing:.04em}
        .receipt-val{color:#F0EDE8;font-weight:700;text-align:right}

        .next-card{
          background:#0A1727;border:1px solid rgba(255,255,255,0.08);border-radius:2px;
          padding:22px 20px;flex:1;min-width:200px;
          transition:border-color .2s,transform .2s;
        }
        .next-card:hover{border-color:rgba(255,122,41,0.35);transform:translateY(-3px)}

        .share-btn{
          display:flex;align-items:center;justify-content:center;gap:8px;
          padding:14px 22px;border-radius:2px;font-family:Montserrat,sans-serif;
          font-weight:800;font-size:13px;letter-spacing:.06em;cursor:pointer;
          border:none;transition:filter .2s,transform .15s;
        }
        .share-btn:hover{filter:brightness(1.12);transform:translateY(-2px)}

        .barcode-line{display:inline-block;width:2px;margin:0 0.5px;background:rgba(255,255,255,0.85);animation:barcodeScan 2.5s ease-in-out infinite}

        .fade-up{animation:fadeUp .5s cubic-bezier(.34,1.56,.64,1) both}
        .fade-up-1{animation-delay:.1s}
        .fade-up-2{animation-delay:.25s}
        .fade-up-3{animation-delay:.4s}
        .fade-up-4{animation-delay:.55s}
        .fade-up-5{animation-delay:.7s}
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
            {[0,1,2].map(i => <span key={i} style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:1, transition:'all .25s', transform: i===0&&menuOpen ? 'rotate(45deg) translate(5px,5px)' : i===1&&menuOpen ? 'scaleX(0)' : i===2&&menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : '' }} />)}
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

      {/* ── HERO ── */}
      <div style={{ position:'relative', overflow:'hidden', background:'linear-gradient(180deg,#06101E 0%,#060C18 100%)', paddingTop:60, paddingBottom:56, textAlign:'center' }}>
        {/* Diagonal stripes */}
        <div style={{ position:'absolute', top:0, left:'-10%', width:'50%', height:'100%', background:'linear-gradient(135deg,rgba(34,197,94,0.06) 0%,transparent 60%)', transform:'skewX(-8deg)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:0, right:'-10%', width:'50%', height:'100%', background:'linear-gradient(225deg,rgba(34,197,94,0.04) 0%,transparent 60%)', transform:'skewX(-8deg)', pointerEvents:'none' }} />

        <div className="wrap">
          {/* Animated check circle */}
          <div className="fade-up" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:110, height:110, borderRadius:'50%', background:'rgba(34,197,94,0.12)', border:'3px solid #22C55E', marginBottom:32, animation:'ringPulse 2.5s ease-in-out infinite, fadeUp .5s ease both' }}>
            <div style={{ fontSize:52, animation:'checkPop .6s cubic-bezier(.34,1.56,.64,1) .2s both', display:'block' }}>✅</div>
          </div>

          <h1 className="fade-up fade-up-1" style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(30px,6vw,62px)', lineHeight:.95, letterSpacing:'-.02em', textTransform:'uppercase', marginBottom:10 }}>
            <span style={{ color:'#fff', display:'block' }}>ENTRY</span>
            <span style={{ color:'#22C55E', display:'block' }}>CONFIRMED.</span>
          </h1>
          <div className="fade-up fade-up-2" style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(14px,3vw,24px)', color:'#FF7A29', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:20 }}>
            YOU'RE IN THE TRIALS.
          </div>

          {/* Player chips */}
          <div className="fade-up fade-up-3" style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginBottom:28 }}>
            {[
              { label:'🏏 Batsman', color:'#3B82F6' },
              { label:'📍 Mumbai', color:'#FF7A29' },
              { label:'BCPL Season 5', color:'#E8B23D' },
            ].map(c => (
              <span key={c.label} style={{ padding:'6px 16px', background:`rgba(255,255,255,0.05)`, border:`1px solid ${c.color}44`, borderRadius:2, fontSize:12, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:c.color, letterSpacing:'.06em' }}>
                {c.label}
              </span>
            ))}
          </div>

          {/* Booking ref */}
          <div className="fade-up fade-up-4" style={{ display:'inline-block', background:'#060C18', border:'1px solid rgba(255,122,41,0.4)', padding:'12px 24px', borderRadius:2, marginBottom:0 }}>
            <div style={{ fontSize:9, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.18em', color:'rgba(255,255,255,0.35)', marginBottom:4 }}>BOOKING REFERENCE</div>
            <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:700, color:'#FF7A29', letterSpacing:'.12em' }}>BCPL-S5-MUM-BAT-7432</div>
          </div>
        </div>
      </div>

      {/* ── MATCH TICKET ── */}
      <div className="wrap fade-up fade-up-5" style={{ marginTop:40 }}>
        <div style={{ background:'#0A1727', border:'1px solid rgba(255,122,41,0.35)', borderRadius:0, position:'relative', overflow:'hidden' }}>
          {/* Ticket notches */}
          <div style={{ position:'absolute', left:-10, top:'50%', transform:'translateY(-50%)', width:20, height:20, borderRadius:'50%', background:'#06101E', border:'1px solid rgba(255,122,41,0.35)' }} />
          <div style={{ position:'absolute', right:-10, top:'50%', transform:'translateY(-50%)', width:20, height:20, borderRadius:'50%', background:'#06101E', border:'1px solid rgba(255,122,41,0.35)' }} />

          {/* Ticket header */}
          <div style={{ background:'linear-gradient(135deg,#C94E0E,#FF7A29,#E8611A)', padding:'16px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, letterSpacing:'.14em', color:'#fff', textTransform:'uppercase' }}>PHASE 1 TRIAL ENTRY</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:10, letterSpacing:'.12em', color:'rgba(255,255,255,0.75)', marginTop:2 }}>PAYMENT CONFIRMED</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.15)', padding:'6px 14px', borderRadius:2 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#fff', display:'inline-block', animation:'liveBlip 1.2s ease-in-out infinite' }} />
              <span style={{ fontSize:10, fontWeight:900, fontFamily:'Montserrat,sans-serif', color:'#fff', letterSpacing:'.1em' }}>CONFIRMED</span>
            </div>
          </div>

          {/* Ticket body */}
          <div style={{ padding:'0 28px' }}>
            {[
              { label:'Player Name', val:'Rahul Sharma' },
              { label:'Role', val:'🏏 Batsman' },
              { label:'Trial City', val:'📍 Mumbai' },
              { label:'Booking Ref', val:'BCPL-S5-MUM-BAT-7432' },
              { label:'Amount Paid', val:'₹299.00 ✅' },
              { label:'Payment Date', val:'15 Jan 2025, 11:42 AM' },
            ].map(r => (
              <div key={r.label} className="receipt-row">
                <span className="receipt-label">{r.label}</span>
                <span className="receipt-val" style={{ fontFamily: r.label==='Booking Ref' ? 'monospace' : 'Inter,sans-serif', color: r.label==='Amount Paid' ? '#22C55E' : '#F0EDE8' }}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* Dashed divider */}
          <div style={{ borderTop:'2px dashed rgba(255,122,41,0.25)', margin:'0 28px' }} />

          {/* Phase 2 locked row */}
          <div style={{ padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.14em', color:'rgba(255,255,255,0.5)', textTransform:'uppercase' }}>PHASE 2 STATUS</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:3 }}>🔒 Locked — You'll be notified if selected by scouts</div>
            </div>
            <span style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', padding:'5px 12px', borderRadius:2, fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.12em', color:'rgba(255,255,255,0.4)' }}>PENDING</span>
          </div>

          {/* Decorative barcode */}
          <div style={{ background:'#060C18', padding:'14px 28px', display:'flex', alignItems:'flex-end', gap:0, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            {Array.from({length:52}, (_,i) => {
              const heights = [24,32,18,38,22,28,14,36,20,30,16,40,26,18,34,22,28,12,38,24,30,16,36,20,26,14,32,24,38,18,28,22,36,14,30,26,18,40,24,32,16,38,22,28,12,36,20,30,16,40,26,18];
              const h = heights[i % heights.length];
              const delay = (i * 0.04) % 2.5;
              return <div key={i} className="barcode-line" style={{ height:h, animationDelay:`${delay}s` }} />;
            })}
            <span style={{ marginLeft:'auto', fontFamily:'monospace', fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'.08em' }}>BCPL-S5-MUM-BAT-7432</span>
          </div>
        </div>
      </div>

      {/* ── NEXT STEPS ── */}
      <div className="wrap" style={{ marginTop:48 }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.2em', color:'rgba(255,255,255,0.3)', marginBottom:20, textTransform:'uppercase' }}>Your Next Steps</div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {/* Step 1 */}
          <div className="next-card">
            <div style={{ fontSize:28, marginBottom:12 }}>🎬</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#FF7A29', letterSpacing:'.04em', marginBottom:6, textTransform:'uppercase' }}>Upload Your Trial Video</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#FF7A29', display:'inline-block', animation:'liveBlip 1s infinite' }} />
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,122,41,0.8)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.08em' }}>DEADLINE: WITHIN 7 DAYS</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:16 }}>Record your 2-minute cricket trial video. Follow the guidelines for best results.</p>
            <button className="btn-primary" style={{ width:'100%', padding:'12px', fontSize:12 }}>UPLOAD NOW →</button>
          </div>

          {/* Step 2 */}
          <div className="next-card">
            <div style={{ fontSize:28, marginBottom:12 }}>⏱</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#E8B23D', letterSpacing:'.04em', marginBottom:6, textTransform:'uppercase' }}>7-Day Scout Review</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(232,178,61,0.7)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em' }}>BCCI-CERTIFIED EVALUATORS</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>Our trained scouts review every submission. Results sent to your registered email & WhatsApp within 7 working days.</p>
          </div>

          {/* Step 3 */}
          <div className="next-card" style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:28, marginBottom:12 }}>🔒</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'rgba(255,255,255,0.5)', letterSpacing:'.04em', marginBottom:6, textTransform:'uppercase' }}>Phase 2 (If Selected)</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em' }}>PHYSICAL TRIAL · LOCKED</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', lineHeight:1.6 }}>If selected by scouts, you'll be invited to the physical ground trial. Pay ₹2,000 only after selection — not before.</p>
          </div>
        </div>
      </div>

      {/* ── SHARE SECTION ── */}
      <div className="wrap" style={{ marginTop:48 }}>
        <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderRadius:2, padding:'28px', textAlign:'center' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, letterSpacing:'.16em', color:'rgba(255,255,255,0.4)', marginBottom:6, textTransform:'uppercase' }}>Share Your Achievement</div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'#fff', marginBottom:24 }}>Tell the world you're in the trials! 🏏</div>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="share-btn" style={{ background:'#25D366', color:'#fff' }}>
              💬 Share on WhatsApp
            </button>
            <button className="share-btn" style={{ background:'linear-gradient(135deg,#833AB4,#FD1D1D,#F56040)', color:'#fff' }}>
              📸 Share on Instagram
            </button>
            <button className="share-btn" style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.7)' }}>
              ⬇ Download Receipt
            </button>
          </div>
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
