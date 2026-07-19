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

export function CricketRulebook() {
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

  const sections = [
    { id: "format", title: "1. Match Format" },
    { id: "teams", title: "2. Teams & Squad" },
    { id: "batting", title: "3. Batting Rules" },
    { id: "bowling", title: "4. Bowling Rules" },
    { id: "scoring", title: "5. Scoring" },
    { id: "drs", title: "6. DRS Policy" },
    { id: "playoffs", title: "7. Playoffs Format" }
  ];

  return (
    <div style={{ background: '#0A1628', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      {/* Page Hero */}
      <div style={{ background: '#0A1628', height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 42, color: '#fff', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>CRICKET RULEBOOK</h1>
        <div style={{ color: '#FF7A29', fontFamily: 'Inter,sans-serif', fontSize: 18, fontWeight: 500, marginBottom: 16 }}>BCPL Season 5 Official Playing Conditions</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter,sans-serif' }}>Last updated: June 2025</div>
      </div>

      {/* Content Area */}
      <div style={{ background: '#FAF8F4', flex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 40px', display: 'flex', gap: 60, alignItems: 'flex-start' }}>
          
          {/* Sticky TOC (Hidden on very small screens implicitly by layout structure, but let's just make it a fixed width column for now) */}
          <div style={{ width: 240, flexShrink: 0, position: 'sticky', top: 100, background: 'rgba(15,34,71,0.05)', borderRadius: 16, padding: '24px 20px', border: '1px solid rgba(15,34,71,0.1)' }} className="hidden md:block">
            <h4 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 13, color: '#FF7A29', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Table of Contents</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sections.map((s, i) => (
                <a key={i} href={`#${s.id}`} style={{ color: '#0F2247', textDecoration: 'none', fontSize: 14, fontWeight: 500, opacity: 0.8, transition: 'opacity 0.2s' }}>
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, color: '#14203F', fontFamily: 'Inter,sans-serif', fontSize: 16, lineHeight: 1.8, maxWidth: 800 }}>
            
            <h2 id="format" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '0 0 20px 0' }}>1. Match Format</h2>
            <p>Matches will be played in standard T20 format with a maximum of 20 overs per innings.</p>
            <List items={[
              "Matches will be scheduled as either day or day-night encounters.",
              "A minimum of 6 overs per side is required to constitute a match in case of rain interruptions.",
              "Innings break will be 15 minutes."
            ]} />

            <h2 id="teams" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>2. Teams & Squad</h2>
            <List items={[
              "Each franchise squad will consist of a maximum of 15 players.",
              "The playing XI must be chosen and submitted by the team captain and coach 30 minutes before the toss.",
              "A maximum of 3 'wild card' players are permitted per season per team."
            ]} />

            <h2 id="batting" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>3. Batting Rules</h2>
            <p>Standard ICC batting rules apply with the following BCPL specific conditions:</p>
            <List items={[
              "No helmets are formally mandatory in BCPL, but they are strongly recommended against fast and medium pace.",
              "Power play rules: Overs 1-6 allow a maximum of 2 fielders outside the 30-yard circle.",
              "Death overs are considered as overs 17-20 for statistical purposes."
            ]} />

            <h2 id="bowling" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>4. Bowling Rules</h2>
            <List items={[
              "A bowler can bowl a maximum of 4 overs in an uninterrupted innings.",
              "Wide delivery: Penalty of 1 extra run and the ball must be rebowled.",
              "No-ball: Penalty of 1 extra run and a Free Hit for the next delivery."
            ]} />

            <h2 id="scoring" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>5. Scoring</h2>
            <div style={{ background: 'rgba(255,122,41,0.08)', borderLeft: '4px solid #FF7A29', borderRadius: 8, padding: '16px 20px', margin: '24px 0' }}>
              <strong>Points System:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 12 }}>
                <div><strong>Win:</strong> 2 Points</div>
                <div><strong>Tie / No Result:</strong> 1 Point</div>
                <div><strong>Loss:</strong> 0 Points</div>
              </div>
            </div>
            <p>If teams finish on equal points at the end of the group stage, Net Run Rate (NRR) will be the primary tiebreaker.</p>

            <h2 id="drs" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>6. DRS Policy</h2>
            <List items={[
              "Each team is permitted 1 unsuccessful Decision Review System (DRS) review per innings.",
              "There is no ball-tracking technology available. LBW reviews will rely on soft signals from the square-leg umpire or primary umpire discussion.",
              "Reviews can be taken for caught behinds, run outs, and stumpings."
            ]} />

            <h2 id="playoffs" style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 22, color: '#0F2247', margin: '40px 0 20px 0' }}>7. Playoffs Format</h2>
            <p>The top 2 teams from Group A and the top 2 teams from Group B will advance to the Semi-Finals.</p>
            <List items={[
              "Semi-Final 1: A1 vs B2",
              "Semi-Final 2: B1 vs A2",
              "Grand Final: Winner SF1 vs Winner SF2"
            ]} />
            <p style={{ marginTop: 16 }}>All knockout stage matches will be held at a pre-designated neutral venue.</p>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
