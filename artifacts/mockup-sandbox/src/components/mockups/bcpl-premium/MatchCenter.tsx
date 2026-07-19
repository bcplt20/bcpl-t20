import React, { useState } from 'react';

function Navbar({ active = '' }) {
  const links = [
    ['Home', 'home'],
    ['Schedule', 'schedule'],
    ['Match Center', 'matchcenter'],
    ['Teams', 'teams'],
    ['Points Table', 'points'],
    ['About', 'about'],
  ];
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
            <div key={title as string}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>{title}</div>
              {(links as string[]).map(l => <div key={l} style={{ marginBottom: 9 }}><a href="#" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>{l}</a></div>)}
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

export function MatchCenter() {
  const [activeTab, setActiveTab] = useState('scorecard');

  const recentMatches = [
    { team1: 'KOL', team2: 'HYD', team1Score: '156/6', team2Score: '158/8', result: 'HYD won by 2 wkts' },
    { team1: 'MUM', team2: 'CHE', team1Score: '135/4', team2Score: '132/9', result: 'MUM won by 6 wkts' },
    { team1: 'DEL', team2: 'BLR', team1Score: '185/4', team2Score: '151/all', result: 'DEL won by 34 runs' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', color: '#fff', fontFamily: 'Inter,sans-serif' }}>
      <style>{`
        @keyframes customPulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 0.5; }
        }
      `}</style>
      
      <Navbar active="matchcenter" />
      
      {/* Hero */}
      <div style={{ padding: '40px 40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 40, margin: '0 0 12px', color: '#fff' }}>MATCH CENTER</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, margin: 0 }}>Live scores, results, and upcoming fixtures</p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 60px' }}>
        
        {/* LIVE BANNER */}
        <div style={{ background: 'linear-gradient(135deg,#1a0505,#2d0808)', border: '1px solid rgba(232,73,63,0.3)', borderRadius: 20, padding: '40px 48px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 40px rgba(232,73,63,0.15)', marginBottom: 32 }}>
          
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(232,73,63,0.1) 0%, transparent 60%)', animation: 'customPulse 4s infinite' }}></div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(232,73,63,0.2)', color: '#E8493F', padding: '6px 14px', borderRadius: 6, fontWeight: 800, fontSize: 13, marginBottom: 24, border: '1px solid rgba(232,73,63,0.5)', letterSpacing: 1 }}>
                <span style={{ width: 8, height: 8, background: '#E8493F', borderRadius: '50%', boxShadow: '0 0 8px #E8493F' }}></span>
                LIVE NOW
              </div>
              <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 36, color: '#fff', marginBottom: 12, lineHeight: 1 }}>MUMBAI MAVERICKS</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 18, marginBottom: 12 }}>VS</div>
              <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 36, color: '#fff', lineHeight: 1 }}>DELHI DYNAMOS</div>
              <div style={{ marginTop: 24, color: 'rgba(255,255,255,0.5)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                🏟️ DY Patil Stadium, Mumbai
              </div>
            </div>

            <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.3)', padding: '32px 40px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: 56, fontWeight: 900, fontFamily: 'Montserrat,sans-serif', color: '#fff', lineHeight: 1, marginBottom: 12 }}>
                134<span style={{ color: 'rgba(255,255,255,0.5)' }}>/4</span>
              </div>
              <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 20 }}>
                16.2 Overs
              </div>
              
              <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-end', fontSize: 14, color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, marginBottom: 20 }}>
                <div>CRR <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>8.23</span></div>
                <div>Req RR <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>12.8</span></div>
                <div>Target <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>168</span></div>
              </div>

              <div style={{ background: 'rgba(232,178,61,0.15)', color: '#E8B23D', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 14, display: 'inline-block', border: '1px solid rgba(232,178,61,0.3)' }}>
                Mumbai Mavericks need 34 runs in 22 balls
              </div>
            </div>
          </div>
        </div>

        {/* Recent Completed Matches */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 48 }}>
          {recentMatches.map((match, i) => (
            <div key={i} style={{ background: 'rgba(15,34,71,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>FINAL</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>Sat, 12 Jul</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{match.team1}</div>
                <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{match.team1Score}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{match.team2}</div>
                <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{match.team2Score}</div>
              </div>
              <div style={{ color: '#2E9E4F', fontSize: 13, fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                {match.result}
              </div>
            </div>
          ))}
        </div>

        {/* Live Match Detail Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
          
          {/* Main Content (Scorecard) */}
          <div style={{ background: 'rgba(15,34,71,0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,22,40,0.5)' }}>
              {['Scorecard', 'Commentary', 'Squads', 'Highlights'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} style={{ flex: 1, padding: '16px 0', background: 'transparent', border: 'none', color: activeTab === tab.toLowerCase() ? '#FF7A29' : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 14, cursor: 'pointer', borderBottom: activeTab === tab.toLowerCase() ? '2px solid #FF7A29' : '2px solid transparent' }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Scorecard Table */}
            <div style={{ padding: 24 }}>
              <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Mumbai Mavericks Innings</span>
                <span style={{ fontSize: 20 }}>134/4 <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>(16.2 Overs)</span></span>
              </div>

              {/* Batters */}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>Batter</div>
                  <div style={{ textAlign: 'right' }}>R</div>
                  <div style={{ textAlign: 'right' }}>B</div>
                  <div style={{ textAlign: 'right' }}>4s</div>
                  <div style={{ textAlign: 'right' }}>6s</div>
                  <div style={{ textAlign: 'right' }}>SR</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '16px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#FF7A29', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>Rohan Sharma <span style={{ fontSize: 16 }}>🏏</span></div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>not out</div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16 }}>45</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>38</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>3</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>1</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>118.42</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '16px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Vikram Singh</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>not out</div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16 }}>28</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>16</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>4</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>0</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>175.00</div>
                </div>
              </div>

              {/* Bowlers */}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>Bowler</div>
                  <div style={{ textAlign: 'right' }}>O</div>
                  <div style={{ textAlign: 'right' }}>M</div>
                  <div style={{ textAlign: 'right' }}>R</div>
                  <div style={{ textAlign: 'right' }}>W</div>
                  <div style={{ textAlign: 'right' }}>ECON</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '16px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>Amit Patel <span style={{ fontSize: 14, color: '#E8493F', fontWeight: 800 }}>🔴</span></div>
                  </div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>3.2</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>0</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>24</div>
                  <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16 }}>1</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>7.20</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '16px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Kunal Verma</div>
                  </div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>4.0</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>0</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>32</div>
                  <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16 }}>2</div>
                  <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>8.00</div>
                </div>
              </div>
              
              {/* Fall of Wickets */}
              <div style={{ marginTop: 24, padding: 16, background: 'rgba(0,0,0,0.1)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Fall of Wickets</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                  1-24 (Ishan, 3.2 ov), 2-45 (Rahul, 6.4 ov), 3-89 (Surya, 11.1 ov), 4-102 (Hardik, 13.5 ov)
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (Upcoming/Today) */}
          <div>
            <div style={{ background: 'rgba(15,34,71,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: 24, position: 'sticky', top: 88 }}>
              <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 18, marginBottom: 20, color: '#FF7A29' }}>THIS WEEK</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { date: 'Tomorrow, 10:00 AM', t1: 'BLR', t2: 'PUN' },
                  { date: 'Tomorrow, 6:00 PM', t1: 'CHE', t2: 'KOL' },
                  { date: 'Sun, 3 Aug, 10:00 AM', t1: 'DEL', t2: 'HYD' }
                ].map((m, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 12 }}>{m.date}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{m.t1}</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700 }}>VS</div>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{m.t2}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,122,41,0.4)', color: '#FF7A29', padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 14, marginTop: 24, cursor: 'pointer' }}>
                View Full Schedule
              </button>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
