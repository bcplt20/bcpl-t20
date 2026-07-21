import React, { useState } from 'react';

export function Phase2Payment() {
  const [agreed, setAgreed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', color:'#F0EDE8', fontFamily:"'Inter',sans-serif", overflowX:'hidden', paddingBottom:'calc(120px + env(safe-area-inset-bottom))' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes shimmerAnim{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulseGold{0%,100%{box-shadow:0 0 0 0 rgba(232,178,61,0.5)}50%{box-shadow:0 0 0 12px rgba(232,178,61,0)}}
        .wrap{max-width:900px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:18px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .btn-gold{
          background:linear-gradient(135deg,#E8B23D,#B8860B);
          border:none;border-radius:12px;color:#000;
          font-family:Montserrat,sans-serif;font-weight:900;
          letter-spacing:0.08em;cursor:pointer;
          transition:filter .2s,transform .15s;
          animation:pulseGold 2.5s infinite;
        }
        .btn-gold:hover{filter:brightness(1.12);transform:translateY(-2px)}
        .btn-gold:disabled{opacity:.35;cursor:not-allowed;filter:none;transform:none;animation:none}
        .ticket{background:#0A1727;border:1px solid rgba(232,178,61,0.35);position:relative;overflow:visible;width:100%;max-width:100%}
        .ticket::before,.ticket::after{content:'';position:absolute;width:22px;height:22px;border-radius:50%;background:#06101E;top:50%;transform:translateY(-50%);z-index:2}
        .ticket::before{left:-11px;border:1px solid rgba(232,178,61,0.35)}
        .ticket::after{right:-11px;border:1px solid rgba(232,178,61,0.35)}
        @media(max-width:480px){.ticket::before,.ticket::after{display:none}}
        .ticket-dashed{border-top:2px dashed rgba(232,178,61,0.25);margin:0 24px}
        .nav-link{font-size:12px;font-weight:700;font-family:Montserrat,sans-serif;letter-spacing:.08em;color:rgba(255,255,255,0.65);text-decoration:none;text-transform:uppercase;cursor:pointer;transition:color .2s;background:none;border:none}
        .nav-link:hover{color:#FF7A29}
        .incl-row{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
        .incl-row:last-child{border-bottom:none}
        .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmerAnim 2.5s linear infinite}
        footer a{color:rgba(255,255,255,0.45);text-decoration:none}
        footer a:hover{color:#FF7A29}
        .receipt-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);gap:8px}
        .receipt-row:last-child{border-bottom:none}
        .security-strip{display:flex;justify-content:center;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 20px;background:#060C18;border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin-top:20px}
        .achievement-banner{background:#060C18;border:1px solid rgba(232,178,61,0.5);border-left:4px solid #E8B23D;padding:14px 16px;margin-bottom:32px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-radius:12px}
      `}</style>

      {/* TICKER */}
      <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 32s linear infinite' }}>
          {[...Array(4)].map((_,i) => (
            <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff' }}>
              &nbsp;🏏 SEASON 5 REGISTRATIONS OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 21 TRIAL CITIES &nbsp;·&nbsp; BACKED BY SOURAV GANGULY &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* NAVBAR */}
      <nav style={{ position:'sticky', top:0, zIndex:300, background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
        <div className="wrap" style={{ maxWidth:1200, height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', flexDirection:'column', lineHeight:1.1 }}>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:18, color:'#fff', letterSpacing:'.04em' }}><span style={{ color:'#FF7A29' }}>BCPL</span> T20</span>
            <span style={{ fontSize:8, fontWeight:700, letterSpacing:'.14em', color:'rgba(255,255,255,0.38)', textTransform:'uppercase', fontFamily:'Montserrat,sans-serif' }}>SEASON 5 · KRIPARTI PLAYING11</span>
          </div>
          <div className="desk-nav">{NAV.map(n => <button key={n} className="nav-link">{n}</button>)}</div>
          <button className="ham-btn" onClick={() => setMenuOpen(o => !o)}>
            {[0,1,2].map(i => <span key={i} style={{ width:24, height:2, background:'#fff', display:'block', borderRadius:12, transition:'all .3s', transform: menuOpen ? (i===0?'rotate(45deg) translate(5px,5px)':i===2?'rotate(-45deg) translate(5px,-5px)':'scaleX(0)') : 'none', opacity: menuOpen && i===1 ? 0 : 1 }} />)}
          </button>
        </div>
        {menuOpen && (
          <div style={{ background:'#0A1727', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'12px 0' }}>
            {NAV.map(n => <div key={n} style={{ padding:'10px 24px', fontSize:13, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em', color:'rgba(255,255,255,0.7)', cursor:'pointer', textTransform:'uppercase' }}>{n}</div>)}
          </div>
        )}
      </nav>

      <div className="wrap" style={{ paddingTop:32 }}>
        {/* ACHIEVEMENT BANNER */}
        <div className="achievement-banner">
          <span style={{ fontSize:20 }}>✅</span>
          <div style={{ flex:1, minWidth:0 }}>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, color:'#E8B23D', letterSpacing:'.1em' }}>PHASE 1 CLEARED</span>
            <span style={{ color:'rgba(255,255,255,0.3)', margin:'0 8px' }}>|</span>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'rgba(255,255,255,0.7)' }}>Scout Selected</span>
            <span style={{ color:'rgba(255,255,255,0.3)', margin:'0 8px' }}>|</span>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'rgba(255,255,255,0.7)' }}>🏏 Batsman · Mumbai</span>
          </div>
          <div style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.35)', borderRadius:12, padding:'4px 12px', fontSize:10, fontWeight:900, fontFamily:'Montserrat,sans-serif', color:'#22C55E', letterSpacing:'.12em', flexShrink:0 }}>SELECTED ✓</div>
        </div>

        {/* PAGE TITLE */}
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:10, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.18em', color:'#E8B23D', marginBottom:8, textTransform:'uppercase' }}>Secure Your Spot</div>
          <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(24px,4vw,44px)', color:'#fff', letterSpacing:'.02em', lineHeight:1.1 }}>
            PHASE 2 <span style={{ color:'#E8B23D' }}>ENTRY FEE</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, marginTop:10 }}>You've been selected. Now secure your physical trial slot.</p>
        </div>

        {/* MATCH TICKET — GOLD THEME */}
        <div style={{ maxWidth:680, margin:'0 auto 40px' }}>
          <div className="ticket">
            {/* Gold header */}
            <div style={{ background:'linear-gradient(135deg,#E8B23D,#B8860B)', padding:'22px 24px' }}>
              <div style={{ fontSize:9, fontWeight:900, fontFamily:'Montserrat,sans-serif', letterSpacing:'.2em', color:'rgba(0,0,0,0.55)', marginBottom:6, textTransform:'uppercase' }}>BCPL Season 5 · BCPL T20</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(14px,4vw,18px)', color:'#fff', lineHeight:1.25, textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>PHASE 2 PHYSICAL TRIAL ENTRY · BCPL SEASON 5</div>
              <div style={{ marginTop:6, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.75)' }}>Brand Ambassador: Sourav Ganguly</div>
            </div>

            {/* Big price */}
            <div style={{ background:'#0A1727', padding:'28px 24px', textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing:'.16em', color:'rgba(255,255,255,0.38)', marginBottom:8, textTransform:'uppercase' }}>Total Amount Due</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(48px,10vw,64px)', color:'#fff', lineHeight:1, letterSpacing:'-0.02em' }}>₹2,000</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:8 }}>Phase 2 Entry Fee — Batsman · Mumbai Trial</div>
            </div>

            <div className="ticket-dashed" />

            {/* Receipt rows */}
            <div style={{ background:'#0A1727', padding:'20px 24px 24px' }}>
              {[
                ['Player Name','Rahul Sharma'],
                ['Role','🏏 Batsman'],
                ['Trial City','📍 Mumbai'],
                ['Phase 1 Booking Ref','BCPL-S5-P1-MUM-BAT-4421'],
                ['Phase 2 Amount','₹2,000'],
              ].map(([k,v]) => (
                <div key={k} className="receipt-row">
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600, flexShrink:0 }}>{k}</span>
                  <span style={{ fontSize:13, color: k==='Phase 2 Amount' ? '#E8B23D' : '#fff', fontWeight:700, fontFamily:'Montserrat,sans-serif', letterSpacing: k.includes('Ref') ? '.04em' : 0, wordBreak:'break-all', textAlign:'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INCLUSIONS */}
        <div style={{ maxWidth:680, margin:'0 auto 32px', background:'#0A1727', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'24px 20px' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, letterSpacing:'.12em', color:'rgba(255,255,255,0.55)', marginBottom:16, textTransform:'uppercase' }}>What ₹2,000 Gets You</div>
          {[
            { icon:'✅', text:'Reserved physical trial slot at your city ground', ok:true },
            { icon:'✅', text:'Franchise coaching staff evaluation — scouts watch you live', ok:true },
            { icon:'✅', text:'Live auction participation rights — get drafted by a franchise', ok:true },
            { icon:'✅', text:'BCPL Season 5 player profile (digital + physical)', ok:true },
            { icon:'✅', text:'Match jersey if contracted by a franchise', ok:true },
            { icon:'❌', text:'Does NOT guarantee franchise selection — merit based', ok:false },
          ].map(({ icon, text, ok }) => (
            <div key={text} className="incl-row">
              <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
              <span style={{ fontSize:13, color: ok ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.38)', lineHeight:1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* TERMS + CTA */}
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <div
            onClick={() => setAgreed(a => !a)}
            style={{ display:'flex', alignItems:'flex-start', gap:14, cursor:'pointer', padding:'16px 20px', background: agreed ? 'rgba(232,178,61,0.06)' : '#0A1727', border: agreed ? '1px solid rgba(232,178,61,0.4)' : '1px solid rgba(255,255,255,0.08)', borderRadius:12, marginBottom:20, transition:'all .2s' }}
          >
            <div style={{ width:20, height:20, border: agreed ? '2px solid #E8B23D' : '2px solid rgba(255,255,255,0.2)', borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginTop:1, background: agreed ? '#E8B23D' : 'transparent', transition:'all .2s' }}>
              {agreed && <span style={{ color:'#000', fontSize:12, fontWeight:900 }}>✓</span>}
            </div>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.55 }}>
              I understand this is a Phase 2 physical trial entry fee. Payment confirms my trial slot and is non-refundable. If selected for Phase 2, I pay only then — no charge unless selected.
            </span>
          </div>

          <button
            className="btn-gold"
            disabled={!agreed}
            style={{ width:'100%', padding:'18px 32px', fontSize:15, letterSpacing:'.1em', textAlign:'center' }}
          >
            PAY ₹2,000 — SECURE YOUR TRIAL SPOT →
          </button>

          {/* Security strip */}
          <div className="security-strip">
            {[
              { icon:'🔒', label:'Razorpay Secured' },
              { icon:'🛡', label:'256-bit SSL' },
              { icon:'🏢', label:'BCPL T20' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:14 }}>{icon}</span>
                <span style={{ fontSize:11, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'rgba(255,255,255,0.35)', letterSpacing:'.06em' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ marginTop:80, background:'#060C18', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'40px 0 24px' }}>
        <div className="wrap" style={{ maxWidth:1200 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:28, marginBottom:32 }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, marginBottom:8 }}><span style={{ color:'#FF7A29' }}>BCPL</span> T20</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:1.7 }}>India's biggest corporate cricket league. Season 5 · ₹6 Cr Prize Pool · 21 Cities</div>
              <div style={{ marginTop:12, fontSize:11, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:'#E8B23D' }}>#OfficeSeStadiumtak</div>
            </div>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'.12em', color:'rgba(255,255,255,0.35)', marginBottom:12, textTransform:'uppercase' }}>Quick Links</div>
              {['Register','Teams','Match Center','FAQ','Contact'].map(l => <div key={l} style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:8 }}><a href="#">{l}</a></div>)}
            </div>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'.12em', color:'rgba(255,255,255,0.35)', marginBottom:12, textTransform:'uppercase' }}>Legal</div>
              {['Terms & Conditions','Privacy Policy','Refund Policy','Code of Conduct'].map(l => <div key={l} style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:8 }}><a href="#">{l}</a></div>)}
            </div>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'.12em', color:'rgba(255,255,255,0.35)', marginBottom:12, textTransform:'uppercase' }}>Organised By</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.7 }}>BCPL T20 Pvt. Ltd.<br/>Brand Ambassador: Sourav Ganguly<br/>Season 5 · BCCI Certified Scouts</div>
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:20, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>© 2025 BCPL T20 Pvt. Ltd. All rights reserved.</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>BCPL T20 Season 5</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
