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

export function Schedule() {
  const [filter, setFilter] = useState('All');

  const upcomingMatches = [
    { m: 'M13', date: 'SAT, 26 JULY 2025 · 6:00 PM IST', team1: 'MUMBAI MAVERICKS', team2: 'DELHI DYNAMOS', venue: '🏟️ DY Patil Stadium, Mumbai', countdown: 'Starts in 3 days' },
    { m: 'M14', date: 'SUN, 27 JULY 2025 · 10:00 AM IST', team1: 'BANGALORE BULLS', team2: 'PUNE PANTHERS', venue: '🏟️ Chinnaswamy, Bangalore', countdown: 'Starts in 4 days' },
    { m: 'M15', date: 'SAT, 2 AUG 2025 · 6:00 PM IST', team1: 'CHENNAI CHIEFS', team2: 'KOLKATA KNIGHTS', venue: '🏟️ Chepauk, Chennai', countdown: 'Starts in 10 days' },
    { m: 'M16', date: 'SUN, 3 AUG 2025 · 10:00 AM IST', team1: 'DELHI DYNAMOS', team2: 'HYDERABAD HAWKS', venue: '🏟️ Kotla, Delhi', countdown: 'Starts in 11 days' },
    { m: 'M17', date: 'SAT, 9 AUG 2025 · 6:00 PM IST', team1: 'AHMEDABAD ACES', team2: 'JAIPUR JAGUARS', venue: '🏟️ Motera, Ahmedabad', countdown: 'Starts in 17 days' }
  ];

  const completedMatches = [
    { m: 'M12', date: 'SAT, 12 JULY 2025 · 6:00 PM IST', team1: 'KOLKATA KNIGHTS', team2: 'HYDERABAD HAWKS', venue: '🏟️ Eden Gardens, Kolkata', result: 'Hyderabad Hawks won by 2 wkts', score: '156/6 (20 ov) vs 158/8 (19.4 ov)' },
    { m: 'M11', date: 'SUN, 6 JULY 2025 · 10:00 AM IST', team1: 'MUMBAI MAVERICKS', team2: 'CHENNAI CHIEFS', venue: '🏟️ Wankhede, Mumbai', result: 'Mumbai Mavericks won by 6 wkts', score: '132/9 (20 ov) vs 135/4 (17.2 ov)' },
    { m: 'M10', date: 'SAT, 5 JULY 2025 · 6:00 PM IST', team1: 'DELHI DYNAMOS', team2: 'BANGALORE BULLS', venue: '🏟️ DY Patil Stadium, Mumbai', result: 'Delhi Dynamos won by 34 runs', score: '185/4 (20 ov) vs 151/all (18.3 ov)' }
  ];

  const knockouts = [
    { m: 'SF1', title: 'SEMI-FINAL 1', date: 'SAT, 23 AUG 2025 · 6:00 PM IST', team1: 'TBD', team2: 'TBD', venue: '🏟️ DY Patil Stadium, Mumbai', type: 'semi' },
    { m: 'SF2', title: 'SEMI-FINAL 2', date: 'SUN, 24 AUG 2025 · 10:00 AM IST', team1: 'TBD', team2: 'TBD', venue: '🏟️ Chinnaswamy, Bangalore', type: 'semi' },
    { m: 'FINAL', title: 'GRAND FINAL', date: 'SAT, 30 AUG 2025 · 6:00 PM IST', team1: 'TBD', team2: 'TBD', venue: '🏟️ DY Patil Stadium, Mumbai', type: 'final' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', color: '#fff', fontFamily: 'Inter,sans-serif' }}>
      <Navbar active="schedule" />
      
      {/* Hero */}
      <div style={{ padding: '60px 40px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 48, margin: '0 0 16px', color: '#fff' }}>MATCH SCHEDULE</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, margin: 0 }}>Season 5 — All Fixtures</p>
      </div>

      {/* Filter Bar */}
      <div style={{ position: 'sticky', top: 64, zIndex: 90, background: 'rgba(10,22,40,0.97)', backdropFilter: 'blur(24px)', padding: '16px 40px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {['All', 'Group A', 'Group B', 'Playoffs'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#FF7A29' : 'rgba(15,34,71,0.6)', border: filter === f ? 'none' : '1px solid rgba(255,255,255,0.1)', color: filter === f ? '#fff' : 'rgba(255,255,255,0.7)', padding: '8px 20px', borderRadius: 20, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}>{f}</button>
          ))}
        </div>
        <select style={{ background: 'rgba(15,34,71,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
          <option>All Cities</option>
          <option>Mumbai</option>
          <option>Bangalore</option>
          <option>Chennai</option>
          <option>Delhi</option>
        </select>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px' }}>
        
        {/* UPCOMING MATCHES */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ color: '#FF7A29', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            UPCOMING MATCHES <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(255,122,41,0.3) 0%, transparent 100%)' }}></div>
          </div>
          {upcomingMatches.map(match => (
            <div key={match.m} style={{ background: 'rgba(15,34,71,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, marginBottom: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,122,41,0.15)', color: '#FF7A29', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, border: '2px solid rgba(255,122,41,0.4)', flexShrink: 0 }}>{match.m}</div>
              
              <div style={{ flex: 1, margin: '0 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ background: 'rgba(15,34,71,0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#4FC3F7', letterSpacing: 1 }}>UPCOMING</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>{match.date}</span>
                </div>
                <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
                  {match.team1} <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>VS</span> {match.team2}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {match.venue}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16, flexShrink: 0 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#E8B23D' }}>{match.countdown}</div>
                <button style={{ background: 'linear-gradient(135deg,#FF7A29,#E8611A)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,122,41,0.3)' }}>Get Tickets →</button>
              </div>
            </div>
          ))}
        </div>

        {/* KNOCKOUT STAGE */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ color: '#E8B23D', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            KNOCKOUT STAGE <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(232,178,61,0.3) 0%, transparent 100%)' }}></div>
          </div>
          {knockouts.map(match => (
            <div key={match.m} style={{ 
              background: match.type === 'final' ? 'rgba(255,122,41,0.05)' : 'rgba(15,34,71,0.6)', 
              backdropFilter: 'blur(20px)', 
              border: match.type === 'final' ? '1px solid rgba(255,122,41,0.4)' : '1px solid rgba(232,178,61,0.3)', 
              borderRadius: 16, 
              marginBottom: 16, 
              padding: match.type === 'final' ? 32 : 24, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              boxShadow: match.type === 'final' ? '0 0 30px rgba(255,122,41,0.1)' : 'none'
            }}>
              <div style={{ width: match.type === 'final' ? 80 : 60, height: match.type === 'final' ? 80 : 60, borderRadius: '50%', background: match.type === 'final' ? 'linear-gradient(135deg,#FF7A29,#E8611A)' : 'rgba(232,178,61,0.15)', color: match.type === 'final' ? '#fff' : '#E8B23D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: match.type === 'final' ? 20 : 16, border: match.type === 'final' ? 'none' : '2px solid rgba(232,178,61,0.4)', flexShrink: 0, textAlign: 'center', lineHeight: 1.2 }}>
                {match.m}
              </div>
              
              <div style={{ flex: 1, margin: '0 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ background: match.type === 'final' ? '#FF7A29' : 'rgba(232,178,61,0.2)', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 800, color: match.type === 'final' ? '#fff' : '#E8B23D', letterSpacing: 1 }}>{match.title}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>{match.date}</span>
                </div>
                <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: match.type === 'final' ? 28 : 22, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, color: 'rgba(255,255,255,0.5)' }}>
                  {match.team1} <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>VS</span> {match.team2}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {match.venue}
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                <button style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 13, cursor: 'not-allowed' }}>To Be Decided</button>
              </div>
            </div>
          ))}
        </div>

        {/* COMPLETED MATCHES */}
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            COMPLETED MATCHES <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%)' }}></div>
          </div>
          {completedMatches.map(match => (
            <div key={match.m} style={{ background: 'rgba(15,34,71,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, marginBottom: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.8 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>{match.m}</div>
              
              <div style={{ flex: 1, margin: '0 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>COMPLETED</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}>{match.date}</span>
                </div>
                <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6, color: 'rgba(255,255,255,0.8)' }}>
                  {match.team1} <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>VS</span> {match.team2}
                </div>
                <div style={{ color: '#2E9E4F', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{match.result}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span>{match.venue}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{match.score}</span>
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                <button style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}>Match Center</button>
              </div>
            </div>
          ))}
        </div>

      </div>

      <Footer />
    </div>
  );
}
