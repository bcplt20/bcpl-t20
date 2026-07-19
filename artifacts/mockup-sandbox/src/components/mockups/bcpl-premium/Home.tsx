import React from 'react';

function Navbar({ active = '' }) {
  const [open, setOpen] = React.useState(false);
  const links = [['Home', 'home'], ['Match Center', 'matchcenter'], ['Teams', 'teams'], ['Sponsors', 'sponsors'], ['About', 'about']];
  return (
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,22,40,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 2px 0 0 rgba(255,122,41,0.2)' }}>
        <div className="wrap" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 20 }}>
            <span style={{ color: '#FF7A29' }}>BCPL</span><span style={{ color: '#fff', marginLeft: 3 }}>T20</span>
          </div>
          <div className="nav-links">
            {links.map(([l, k]) => <a key={k} href="#" style={{ color: active === k ? '#FF7A29' : 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13.5, textDecoration: 'none', fontFamily: 'Inter,sans-serif', borderBottom: active === k ? '2px solid #FF7A29' : '2px solid transparent', paddingBottom: 2 }}>{l}</a>)}
            <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5, borderRadius: 10, minHeight: '36px' }}>Register ₹299</button>
          </div>
          <button className="ham" onClick={() => setOpen(o => !o)} style={{ flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 8, zIndex: 201 }}>
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.25s', transform: open ? 'rotate(45deg) translate(4px,4px)' : '' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.25s', opacity: open ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.25s', transform: open ? 'rotate(-45deg) translate(4px,-4px)' : '' }} />
          </button>
        </div>
      </nav>
      {open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(6,16,30,0.99)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '72px 24px 40px', overflowY: 'auto' }}>
          <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 26, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22, marginBottom: 28 }}><span style={{ color: '#FF7A29' }}>BCPL</span><span style={{ color: '#fff', marginLeft: 3 }}>T20</span></div>
          {[['🏠 Home', 'home'], ['🔴 Match Center', 'mc'], ['🏏 Teams', 'teams'], ['🤝 Sponsors', 'sp'], ['📷 Photos', 'ph'], ['▶️ Videos', 'vid'], ['ℹ️ About', 'about'], ['❓ FAQ', 'faq'], ['✉️ Contact', 'contact']].map(([l, k]) => (
            <a key={k} href="#" onClick={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: 19, textDecoration: 'none', fontFamily: 'Montserrat,sans-serif', padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{l}</a>
          ))}
          <button className="btn-primary" style={{ marginTop: 28, height: 52, fontSize: 16, borderRadius: 14, width: '100%', minHeight: '48px' }}>📝 Register for ₹299 →</button>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer style={{ background: '#06101E', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="grid-2" style={{ gap: 28, marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22, marginBottom: 10 }}><span style={{ color: '#FF7A29' }}>BCPL</span><span style={{ color: '#fff', marginLeft: 4 }}>T20</span></div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.7, marginBottom: 8, maxWidth: 280, fontFamily: 'Inter,sans-serif' }}>Bharatiya Corporate Premier League — world's largest corporate cricket league for working professionals.</p>
            <p style={{ color: 'rgba(255,122,41,0.6)', fontSize: 12, fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>#OfficeSeStadiumtak</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'Inter,sans-serif' }}>League</div>
              {['Schedule', 'Match Center', 'Teams', 'Points Table', 'Photos', 'Videos'].map(l => <div key={l} style={{ marginBottom: 8 }}><a href="#" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none', fontFamily: 'Inter,sans-serif' }}>{l}</a></div>)}
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'Inter,sans-serif' }}>Info</div>
              {['About', 'FAQ', 'Contact', 'Terms', 'Privacy', 'Refunds', 'Eligibility'].map(l => <div key={l} style={{ marginBottom: 8 }}><a href="#" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none', fontFamily: 'Inter,sans-serif' }}>{l}</a></div>)}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['📸', '▶️', '🐦', '📘'].map((ic, i) => <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.07)' }}>{ic}</a>)}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, fontFamily: 'Inter,sans-serif' }}>© 2025 Kriparti Playing11 Pvt. Ltd.</div>
        </div>
      </div>
    </footer>
  );
}

export function Home() {
  return (
    <div className="home-wrapper" style={{ background: '#0A1628', color: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .wrap { max-width:1200px; margin:0 auto; padding:0 16px; }
        .section { padding:40px 0; }
        .h1 { font-family:Montserrat,sans-serif; font-weight:900; font-size:36px; line-height:1.05; }
        .h2 { font-family:Montserrat,sans-serif; font-weight:800; font-size:22px; }
        .grid-2 { display:grid; grid-template-columns:1fr; gap:14px; }
        .grid-3 { display:grid; grid-template-columns:1fr; gap:14px; }
        .grid-4 { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        .hide-mob { display:none!important; }
        .glass { background:rgba(15,34,71,0.7); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.10); border-radius:16px; }
        .btn-primary { background:linear-gradient(135deg,#FF7A29,#E8611A); border:none; border-radius:12px; color:#fff; font-weight:700; font-family:Montserrat,sans-serif; cursor:pointer; box-shadow:0 6px 24px rgba(255,122,41,0.4); transition:transform 0.15s; }
        .btn-primary:active { transform:scale(0.97); }
        .btn-wa { background:#2E9E4F; border:none; border-radius:12px; color:#fff; font-weight:700; cursor:pointer; }
        .input-f { background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.12); border-radius:12px; color:#fff; padding:14px 16px; width:100%; font-family:Inter,sans-serif; font-size:15px; outline:none; transition:border-color 0.2s; appearance:none; }
        .input-f:focus { border-color:#FF7A29; }
        .input-f::placeholder { color:rgba(255,255,255,0.3); }
        .input-f option { background:#0F2247; color:#fff; }
        .tscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; border-radius:16px; }
        .dtable { width:100%; border-collapse:collapse; min-width:560px; }
        .dtable th { background:rgba(255,122,41,0.12); color:rgba(255,255,255,0.55); font-size:11px; text-transform:uppercase; letter-spacing:0.1em; padding:12px 14px; text-align:left; font-family:Inter,sans-serif; }
        .dtable td { padding:14px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:14px; font-family:Inter,sans-serif; }
        .nav-links { display:none; }
        .ham { display:flex; }
        .bot-cta { display:flex; }
        .home-wrapper { padding-bottom: 96px; }
        @media(min-width:768px){
          .wrap{padding:0 28px} .section{padding:60px 0} .h1{font-size:56px}
          .grid-2{grid-template-columns:repeat(2,1fr);gap:24px}
          .grid-3{grid-template-columns:repeat(2,1fr);gap:20px}
          .grid-4{grid-template-columns:repeat(4,1fr);gap:16px}
        }
        @media(min-width:1024px){
          .section{padding:80px 0} .h1{font-size:80px}
          .grid-3{grid-template-columns:repeat(3,1fr)}
          .hide-mob{display:block!important}
          .nav-links{display:flex!important;align-items:center;gap:20px}
          .ham{display:none!important}
          .bot-cta{display:none!important}
          .home-wrapper { padding-bottom: 0; }
        }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        
        .hero-split { display:flex; flex-direction:column; gap:24px; }
        .hero-buttons { display:flex; flex-direction:column; gap:12px; width:100%; }
        @media(min-width:1024px) {
          .hero-split { flex-direction:row; align-items:center; gap:60px; }
          .hero-split > div:first-child { flex: 0 0 55%; }
          .hero-split > div:last-child { flex: 0 0 45%; }
          .hero-buttons { flex-direction:row; width:auto; }
        }
      `}</style>

      {/* 1. ANNOUNCEMENT BAR */}
      <div style={{ background: '#FF7A29', color: '#fff', fontSize: '12px', padding: '8px', textAlign: 'center', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-block', animation: 'marquee 15s linear infinite', paddingLeft: '100%' }}>
          🏏 SEASON 5 TRIALS OPEN — Register before slots fill · ₹299 · Limited seats · #OfficeSeStadiumtak &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          🏏 SEASON 5 TRIALS OPEN — Register before slots fill · ₹299 · Limited seats · #OfficeSeStadiumtak
        </div>
      </div>

      {/* 2. NAVBAR */}
      <Navbar active="home" />

      {/* 3. HERO SECTION */}
      <section style={{ position: 'relative', background: 'linear-gradient(160deg, #0A1628 0%, #0F2247 50%, #0A1628 100%)', padding: '60px 0 80px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-20%', top: '10%', width: '60%', height: '80%', background: 'radial-gradient(ellipse, rgba(255,122,41,0.15), transparent 60%)', zIndex: 0, pointerEvents: 'none' }} />
        
        <div className="wrap relative" style={{ zIndex: 1 }}>
          <div className="hero-split">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(15,34,71,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '100px', padding: '8px 16px', marginBottom: '24px', fontFamily: 'Inter,sans-serif', fontSize: '12px', fontWeight: 600 }}>
                <span>✅ 5,000+ professionals playing</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
                <span>⭐ Trusted since 2020</span>
              </div>
              
              <h1 className="h1" style={{ marginBottom: '20px', textTransform: 'uppercase' }}>
                YOUR CRICKET DREAM<br />
                <span style={{ background: 'linear-gradient(135deg, #FF7A29, #E8B23D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ISN'T OVER.</span>
              </h1>
              
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: '480px', marginBottom: '32px' }}>
                Job, family, no time to play — life got in the way. This is your real trial. Send one video. That's it.
              </p>
              
              <div className="hero-buttons">
                <button className="btn-primary" style={{ height: '52px', padding: '0 32px', fontSize: '15px' }}>Register for ₹299 →</button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="glass" style={{ flex: 1, height: '52px', padding: '0 24px', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, fontFamily: 'Inter,sans-serif', cursor: 'pointer', borderRadius: '12px', minWidth: '120px' }}>📞 Call Us</button>
                  <button className="btn-wa" style={{ flex: 1, height: '52px', padding: '0 24px', fontFamily: 'Inter,sans-serif', minWidth: '120px' }}>💬 WhatsApp</button>
                </div>
              </div>
            </div>
            
            <div>
              <div className="glass" style={{ padding: '32px', borderTop: '4px solid #FF7A29', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, right: 24, background: '#FF7A29', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '100px', fontFamily: 'Montserrat,sans-serif' }}>PHASE 1 TRIALS OPEN</div>
                
                <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: '56px', color: '#E8B23D', lineHeight: 1 }}>₹299</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginTop: '4px', marginBottom: '20px' }}>to enter Phase 1 trials (Batsman/Bowler/WK)</div>
                
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '15px' }}>All-Rounder</div>
                  <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: '24px', color: '#E8B23D' }}>₹399</div>
                </div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'Inter,sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: '#2E9E4F' }}>✓</span> No auction fee</li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: '#2E9E4F' }}>✓</span> No tournament fee</li>
                  <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: '#2E9E4F' }}>✓</span> No hidden charges</li>
                </ul>
                
                <button className="btn-primary" style={{ width: '100%', height: '56px', fontSize: '16px' }}>Register Now</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. STATS BAR */}
      <section style={{ background: '#06101E', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '40px 0' }}>
        <div className="wrap">
          <div className="grid-4">
            {[
              { num: '5,000+', label: 'Players Registered' },
              { num: '200+', label: 'Corporate Teams' },
              { num: '10', label: 'City Franchises' },
              { num: '5', label: 'Successful Seasons' }
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: '36px', color: '#E8B23D', lineHeight: 1, marginBottom: '8px' }}>{stat.num}</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="section">
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ display: 'inline-block', background: 'rgba(255,122,41,0.1)', color: '#FF7A29', fontFamily: 'Montserrat,sans-serif', fontSize: '12px', fontWeight: 800, padding: '6px 12px', borderRadius: '100px', letterSpacing: '0.1em', marginBottom: '12px' }}>HOW IT WORKS</span>
            <h2 className="h2" style={{ textTransform: 'uppercase' }}>From Registration to the Field</h2>
          </div>
          
          <div className="grid-4" style={{ position: 'relative' }}>
            {/* Desktop connecting line */}
            <div className="hide-mob" style={{ position: 'absolute', top: '40px', left: '10%', right: '10%', height: '2px', borderTop: '2px dashed rgba(255,255,255,0.1)', zIndex: 0 }} />
            
            {[
              { icon: '📹', title: 'Upload Video', desc: 'Record a 2-min playing video and submit during registration' },
              { icon: '📋', title: 'Get Shortlisted', desc: 'Our scout panel reviews all videos within 2–3 weeks' },
              { icon: '🏟️', title: 'Physical Trial', desc: 'Invited players attend a trial at a BCPL ground in your city' },
              { icon: '🏆', title: 'Play Season 5', desc: 'Selected players go to auction, get kitted up, and play!' }
            ].map((step, i) => (
              <div key={i} className="glass" style={{ padding: '24px 20px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'linear-gradient(135deg, #FF7A29, #E8611A)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: '16px', margin: '0 auto -20px', position: 'relative', top: '-44px', border: '4px solid #0A1628' }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{step.icon}</div>
                <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>{step.title}</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '32px', fontFamily: 'Inter,sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ color: '#E8B23D', fontWeight: 700 }}>Note:</span> ₹299 is the ONLY fee. Auction, kit, jersey — all covered.
          </div>
        </div>
      </section>

      {/* 6. UPCOMING MATCH WIDGET & 8. POINTS TABLE (Side by side on desktop) */}
      <section className="section" style={{ background: '#0F2247' }}>
        <div className="wrap">
          <div className="grid-2">
            
            {/* MATCH WIDGET */}
            <div>
              <h2 className="h2" style={{ marginBottom: '24px' }}>NEXT MATCH</h2>
              <div className="glass" style={{ padding: '32px 24px', border: '1px solid rgba(255,122,41,0.3)', boxShadow: '0 0 30px rgba(255,122,41,0.05)' }}>
                <div style={{ display: 'inline-block', background: 'rgba(33,150,243,0.15)', color: '#64B5F6', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', fontFamily: 'Montserrat,sans-serif', letterSpacing: '0.05em', marginBottom: '24px' }}>UPCOMING</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'rgba(198,40,40,0.1)', border: '2px solid #C62828', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 12px' }}>🦁</div>
                    <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: '14px', lineHeight: 1.2 }}>MUMBAI<br/>MAVERICKS</div>
                  </div>
                  <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'rgba(255,255,255,0.2)', fontSize: '24px', padding: '0 16px' }}>VS</div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'rgba(21,101,192,0.1)', border: '2px solid #1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 12px' }}>👑</div>
                    <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: '14px', lineHeight: 1.2 }}>DELHI<br/>DYNAMOS</div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'center', fontFamily: 'Inter,sans-serif', marginBottom: '24px' }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>📅 SAT, 26 JULY 2025 · 6:00 PM IST</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>🏟️ DY Patil Stadium, Mumbai</div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                  {[
                    { v: '3', l: 'DAYS' },
                    { v: '14', l: 'HRS' },
                    { v: '23', l: 'MIN' }
                  ].map((t, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px 12px', minWidth: '60px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: '18px', color: '#fff' }}>{t.v}</div>
                      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{t.l}</div>
                    </div>
                  ))}
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <a href="#" style={{ color: '#FF7A29', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>View All Matches →</a>
                </div>
              </div>
            </div>

            {/* POINTS TABLE PREVIEW */}
            <div>
              <h2 className="h2" style={{ marginBottom: '24px' }}>SEASON 5 STANDINGS</h2>
              <div className="glass" style={{ padding: '24px', overflow: 'hidden' }}>
                <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: '14px', marginBottom: '16px', color: 'rgba(255,255,255,0.7)' }}>GROUP A - TOP 3</div>
                
                <div className="tscroll" style={{ marginBottom: '24px' }}>
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Team</th>
                        <th>P</th>
                        <th>W</th>
                        <th>L</th>
                        <th>Pts</th>
                        <th>NRR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>🏆 Delhi Dynamos</td>
                        <td>8</td>
                        <td>6</td>
                        <td>2</td>
                        <td style={{ fontWeight: 700, color: '#E8B23D' }}>12</td>
                        <td style={{ color: '#2E9E4F' }}>+1.24</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Mumbai Mavericks</td>
                        <td>8</td>
                        <td>5</td>
                        <td>3</td>
                        <td style={{ fontWeight: 700, color: '#E8B23D' }}>10</td>
                        <td style={{ color: '#2E9E4F' }}>+0.87</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Pune Panthers</td>
                        <td>8</td>
                        <td>4</td>
                        <td>4</td>
                        <td style={{ fontWeight: 700, color: '#E8B23D' }}>8</td>
                        <td style={{ color: '#2E9E4F' }}>+0.12</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <button className="glass" style={{ width: '100%', height: '48px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter,sans-serif', fontWeight: 600, cursor: 'pointer', borderRadius: '12px' }}>View Full Standings →</button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. FRANCHISE TEAMS */}
      <section className="section">
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 className="h2" style={{ marginBottom: '8px' }}>10 CITY FRANCHISES</h2>
            <p style={{ fontFamily: 'Inter,sans-serif', color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>Your future team is waiting</p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '24px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', margin: '0 -16px', padding: '0 16px 24px' }}>
            {[
              { n: 'Delhi Dynamos', c: 'Delhi', i: '👑', co: '#1565C0' },
              { n: 'Mumbai Mavericks', c: 'Mumbai', i: '🦁', co: '#C62828' },
              { n: 'Pune Panthers', c: 'Pune', i: '🐆', co: '#7B1FA2' },
              { n: 'Kolkata Knights', c: 'Kolkata', i: '⚔️', co: '#424242' },
              { n: 'Ahmedabad Lions', c: 'Ahmedabad', i: '🦁', co: '#FF6F00' },
              { n: 'Bangalore Bulls', c: 'Bangalore', i: '🐂', co: '#E65100' },
              { n: 'Chennai Chiefs', c: 'Chennai', i: '🛡️', co: '#F9A825' },
              { n: 'Hyderabad Hawks', c: 'Hyderabad', i: '🦅', co: '#2E7D32' },
              { n: 'Jaipur Jaguars', c: 'Jaipur', i: '🐆', co: '#AD1457' },
              { n: 'Lucknow Nawabs', c: 'Lucknow', i: '👑', co: '#0277BD' }
            ].map((team, i) => (
              <div key={i} className="glass" style={{ minWidth: '160px', width: '160px', padding: '20px 16px', scrollSnapAlign: 'start', borderTop: `4px solid ${team.co}`, flexShrink: 0 }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '6px', background: team.co, marginBottom: '16px' }} />
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{team.i}</div>
                <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: '15px', lineHeight: 1.2, marginBottom: '4px' }}>{team.n}</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>{team.c}</div>
                <div style={{ background: 'rgba(46,158,79,0.15)', color: '#2E9E4F', fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontFamily: 'Inter,sans-serif' }}>Season 5 Active</div>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontFamily: 'Inter,sans-serif' }} className="hide-desktop">
            ← Swipe to see all 10 teams →
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIALS */}
      <section className="section" style={{ background: '#0F2247' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="h2">WHAT PLAYERS SAY</h2>
          </div>
          
          <div className="grid-3">
            {[
              { q: "I registered in 5 minutes. Got the call in 2 weeks. Now I play for Delhi Dynamos!", a: "Rahul M.", r: "IT Professional, Delhi" },
              { q: "Never thought I'd play in a real stadium. BCPL made it happen. The auction was surreal!", a: "Priya S.", r: "Marketing Manager, Mumbai" },
              { q: "From the office to the stadium in one season. BCPL is the real deal. No hidden charges.", a: "Amit K.", r: "Software Engineer, Bangalore" }
            ].map((t, i) => (
              <div key={i} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ color: '#E8B23D', fontSize: '14px', letterSpacing: '2px' }}>★★★★★</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontStyle: 'italic', flex: 1 }}>"{t.q}"</div>
                <div>
                  <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: '14px' }}>— {t.a}</div>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{t.r}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. REGISTRATION CTA BANNER */}
      <section style={{ padding: '60px 16px', background: 'linear-gradient(135deg, #FF7A29, #E8611A)', textAlign: 'center' }}>
        <div className="wrap" style={{ maxWidth: '800px' }}>
          <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>YOUR CITY NEEDS A PLAYER LIKE YOU</div>
          <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: '32px', marginBottom: '20px', lineHeight: 1.2 }}>Register for Season 5</h2>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: '16px', color: 'rgba(255,255,255,0.9)', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            ₹299 only. No auction fee. No tournament fee. No hidden charges.
          </p>
          <button style={{ background: '#fff', color: '#E8611A', border: 'none', borderRadius: '14px', height: '52px', padding: '0 32px', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', transition: 'transform 0.2s', minHeight: '48px' }}>
            Register Now — ₹299 →
          </button>
        </div>
      </section>

      {/* 12. FOOTER */}
      <Footer />

      {/* 11. MOBILE STICKY BOTTOM CTA */}
      <div className="bot-cta" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 199, padding: '10px 16px 16px', background: 'rgba(6,16,30,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', gap: 10 }}>
        <button className="btn-primary" style={{ flex: 2, height: 50, fontSize: 15, minHeight: '48px' }}>Register ₹299 →</button>
        <button className="btn-wa" style={{ flex: 1, height: 50, fontSize: 14, borderRadius: 12, minHeight: '48px' }}>💬 WhatsApp</button>
      </div>
      
    </div>
  );
}
