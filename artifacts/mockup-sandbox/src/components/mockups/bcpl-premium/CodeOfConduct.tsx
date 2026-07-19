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

export function CodeOfConduct() {
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
        <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 42, color: '#fff', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>CODE OF CONDUCT</h1>
        <div style={{ color: '#FF7A29', fontFamily: 'Inter,sans-serif', fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Fair Play. Respect. Integrity.</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter,sans-serif' }}>Last updated: June 2025</div>
      </div>

      {/* Content Area */}
      <div style={{ background: '#FAF8F4', flex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 40px', color: '#14203F', fontFamily: 'Inter,sans-serif', fontSize: 16, lineHeight: 1.8 }}>
          
          <h3 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 16, color: '#FF7A29', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px 0' }}>Introduction</h3>
          <p style={{ marginBottom: 32 }}>BCPL believes in the spirit of cricket — fair play, respect for opponents, umpires and the game itself. This Code of Conduct outlines the standards of behavior expected from all participating players, teams, and support staff.</p>

          <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>1. Player Responsibilities</h2>
          <List items={[
            "Respect all opponents, teammates, and umpires at all times.",
            "No sledging or verbal abuse of any kind will be tolerated.",
            "Accept umpire decisions without dissent, both verbal and physical.",
            "Maintain personal hygiene and arrive at the venue on time."
          ]} />

          <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>2. On-Field Conduct</h2>
          <List items={[
            "No deliberate time-wasting tactics by either batting or bowling sides.",
            "Fielders must not encroach on the batting crease or distract the batsman deliberately.",
            "Absolutely no ball tampering or altering the condition of the match ball."
          ]} />

          <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>3. Off-Field Conduct</h2>
          <div style={{ background: 'rgba(255,122,41,0.08)', borderLeft: '4px solid #FF7A29', borderRadius: 8, padding: '16px 20px', margin: '24px 0' }}>
            <strong>Social Media Policy:</strong> No negative posts, disparaging remarks, or abusive content regarding BCPL organizers, participating teams, or opponents across any social platform.
          </div>
          <List items={[
            "Strictly no consumption of alcohol or prohibited substances during events and at the venue.",
            "Maintain professional decorum in all official WhatsApp groups and communications."
          ]} />

          <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>4. Penalty System</h2>
          <p style={{ marginBottom: 24 }}>The league operates on a strict card-based disciplinary system. Any violations will result in immediate action by the match officials and the disciplinary committee.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', gap: 20 }}>
              <div style={{ width: 48, height: 64, background: '#FACC15', borderRadius: 6, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }}></div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#0F2247', fontWeight: 700 }}>Yellow Card (Warning)</h4>
                <p style={{ margin: 0, color: '#475569', fontSize: 15, lineHeight: 1.5 }}>Given for mild misconduct, minor dissent, or first-time slow over-rate offenses.</p>
              </div>
            </div>
            
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', gap: 20 }}>
              <div style={{ width: 48, height: 64, background: '#FF7A29', borderRadius: 6, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }}></div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#0F2247', fontWeight: 700 }}>Orange Card (1 Match Suspension)</h4>
                <p style={{ margin: 0, color: '#475569', fontSize: 15, lineHeight: 1.5 }}>Given for repeated dissent, verbal abuse directed at players or officials, and deliberate dangerous play.</p>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', gap: 20 }}>
              <div style={{ width: 48, height: 64, background: '#E8493F', borderRadius: 6, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }}></div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#0F2247', fontWeight: 700 }}>Red Card (Season Ban)</h4>
                <p style={{ margin: 0, color: '#475569', fontSize: 15, lineHeight: 1.5 }}>Immediate removal from the tournament for physical altercations, match-fixing attempts, severe abuse, or fraudulent documentation.</p>
              </div>
            </div>
          </div>

          <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>5. Reporting Misconduct</h2>
          <p>Any participant can report violations of the Code of Conduct. All reports must be filed with the BCPL Disciplinary Committee via official WhatsApp channels or email within <strong>24 hours</strong> of the incident.</p>

        </div>
      </div>

      <Footer />
    </div>
  );
}
