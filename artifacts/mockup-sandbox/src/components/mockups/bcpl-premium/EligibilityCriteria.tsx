import React from 'react';

function Navbar({ active = '' }) {
  const links = [['Home', 'home'], ['Schedule', 'schedule'], ['Match Center', 'matchcenter'], ['Teams', 'teams'], ['Points Table', 'points'], ['About', 'about']];
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,22,40,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22 }}>
          <span style={{ color: '#FF7A29' }}>BCPL</span><span style={{ color: '#fff', marginLeft: 4 }}>T20</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, marginLeft: 10, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Bhartiya Corporate Premier League</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {links.map(([label, key]) => (
            <a key={key} href="#" style={{ color: active === key ? '#FF7A29' : 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13.5, textDecoration: 'none', fontFamily: 'Inter,sans-serif', borderBottom: active === key ? '2px solid #FF7A29' : '2px solid transparent', paddingBottom: 2 }}>{label}</a>
          ))}
          <button style={{ background: 'linear-gradient(135deg,#FF7A29,#E8611A)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,122,41,0.4)', fontFamily: 'Inter,sans-serif' }}>Register ₹299</button>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{ background: '#06101E', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '56px 40px 32px', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 24, marginBottom: 10 }}><span style={{ color: '#FF7A29' }}>BCPL</span><span style={{ color: '#fff', marginLeft: 4 }}>T20</span></div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5, lineHeight: 1.7, margin: '0 0 20px' }}>Bhartiya Corporate Premier League. World's largest corporate cricket league for working professionals.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['📸', '▶️', '🐦', '📘'].map((ic, i) => <a key={i} href="#" style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.08)' }}>{ic}</a>)}
            </div>
          </div>
          {[['League', ['Home', 'Schedule', 'Match Center', 'Teams', 'Points Table']], ['Info', ['About BCPL', 'FAQ', 'Contact Us', 'Eligibility', 'Code of Conduct']], ['Legal', ['Cricket Rulebook', 'Terms of Service', 'Privacy Policy']]].map(([title, links]) => (
            <div key={title}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>{title}</div>
              {links.map(l => <div key={l} style={{ marginBottom: 9 }}><a href="#" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>{l}</a></div>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>© 2025 Kriparti Playing 11 Private Limited. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

export function EligibilityCriteria() {
  const List = ({ items }: { items: string[] }) => (
    <ul style={{ padding: 0, margin: '16px 0' }}>
      {items.map((item, i) => (
        <li key={i} style={{ position: 'relative', paddingLeft: 24, listStyle: 'none', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 0, top: 0, color: '#FF7A29' }}>●</span>
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <div style={{ background: '#0A1628', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      {/* Page Hero */}
      <div style={{ background: '#0A1628', height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 42, color: '#fff', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>ELIGIBILITY CRITERIA</h1>
        <div style={{ color: '#FF7A29', fontFamily: 'Inter,sans-serif', fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Who Can Play in BCPL T20?</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter,sans-serif' }}>Last updated: June 2025</div>
      </div>

      {/* Content Area */}
      <div style={{ background: '#FAF8F4', flex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 40px', color: '#14203F', fontFamily: 'Inter,sans-serif', fontSize: 16, lineHeight: 1.8 }}>
          
          <p style={{ marginBottom: 40, fontSize: 17 }}>The Bhartiya Corporate Premier League is strictly for working professionals. We maintain high standards of verification to ensure a level playing field for all participating corporate teams.</p>

          <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 24px 0' }}>Who is Eligible to Play</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 48 }}>
            {[
              { title: "Working Professionals", desc: "Full-time, part-time, or self-employed individuals currently working in any industry." },
              { title: "Age", desc: "18 years and above. No upper age limit — Your Cricket Dream Isn't Over!" },
              { title: "All Roles", desc: "Batsman, Bowler, Wicket-Keeper, All-Rounder — all positions welcome." },
              { title: "Any City", desc: "Applications from all 10 BCPL cities and surrounding regions accepted." },
              { title: "All Skill Levels", desc: "From office-ground players to those who played at university/state level." },
              { title: "Both Genders", desc: "Male and female cricketers are welcome to participate." }
            ].map((item, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid rgba(46, 158, 79, 0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ color: '#2E9E4F', fontSize: 20, lineHeight: 1.2 }}>✅</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 16, color: '#0F2247', fontWeight: 700 }}>{item.title}</h4>
                    <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 24px 0' }}>Who is NOT Eligible</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 48 }}>
            {[
              "Full-time students (except part-time employed students)",
              "Professional cricketers under contract with BCCI, state associations, or IPL franchises",
              "Previous season players who violated code of conduct (banned)",
              "Individuals below 18 years of age"
            ].map((item, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid rgba(232, 73, 63, 0.15)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ color: '#E8493F', fontSize: 20, flexShrink: 0 }}>❌</div>
                <div style={{ color: '#0F2247', fontSize: 15, fontWeight: 500 }}>{item}</div>
              </div>
            ))}
          </div>

          <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>Required Documents</h2>
          <p style={{ marginBottom: 16 }}>Players must upload clear copies of the following documents during registration:</p>
          <List items={[
            "Valid Government ID proof (Aadhaar / PAN / Passport)",
            "Employment proof (Recent offer letter, salary slip, or valid business registration)",
            "Recent passport-size photograph (High resolution)",
            "A playing video (Minimum 2 minutes showcasing your skills)"
          ]} />

          <div style={{ background: 'rgba(255,122,41,0.08)', borderLeft: '4px solid #FF7A29', borderRadius: 8, padding: '24px', margin: '40px 0 20px 0' }}>
            <h3 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 14, color: '#FF7A29', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 0' }}>Important Note on Fees</h3>
            <p style={{ margin: 0, fontWeight: 500, color: '#0F2247' }}>The registration fee of ₹299/₹399 is the only payment you will ever make. There is no auction fee, no team fee, and no tournament fee.</p>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
