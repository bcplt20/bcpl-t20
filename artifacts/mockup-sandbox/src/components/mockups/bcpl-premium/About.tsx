import React from 'react';

function Navbar({active=''}: {active?: string}) {
  const links=[['Home','home'],['Schedule','schedule'],['Match Center','matchcenter'],['Teams','teams'],['Points Table','points'],['About','about']];
  return (
    <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(10,22,40,0.97)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'0 40px'}}>
      <div style={{maxWidth:1200,margin:'0 auto',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22}}>
          <span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:4}}>T20</span>
          <span style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:600,marginLeft:10,fontFamily:'Inter,sans-serif',textTransform:'uppercase',letterSpacing:'0.12em'}}>Bhartiya Corporate Premier League</span>
        </div>
        <div style={{display:'flex',gap:24,alignItems:'center'}}>
          {links.map(([label,key])=>(
            <a key={key} href="#" style={{color:active===key?'#FF7A29':'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',borderBottom:active===key?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2}}>{label}</a>
          ))}
          <button style={{background:'linear-gradient(135deg,#FF7A29,#E8611A)',color:'#fff',border:'none',borderRadius:10,padding:'10px 22px',fontWeight:700,fontSize:13.5,cursor:'pointer',boxShadow:'0 4px 20px rgba(255,122,41,0.4)',fontFamily:'Inter,sans-serif'}}>Register ₹299</button>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const footerSections: [string, string[]][] = [
    ['League',['Home','Schedule','Match Center','Teams','Points Table']],
    ['Info',['About BCPL','FAQ','Contact Us','Eligibility','Code of Conduct']],
    ['Legal',['Cricket Rulebook','Terms of Service','Privacy Policy']]
  ];
  return (
    <footer style={{background:'#06101E',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'56px 40px 32px',fontFamily:'Inter,sans-serif'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1fr',gap:40,marginBottom:40}}>
          <div>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:10}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:4}}>T20</span></div>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:12.5,lineHeight:1.7,margin:'0 0 20px'}}>Bhartiya Corporate Premier League. World's largest corporate cricket league for working professionals.</p>
            <div style={{display:'flex',gap:8}}>
              {['📸','▶️','🐦','📘'].map((ic,i)=><a key={i} href="#" style={{width:34,height:34,borderRadius:8,background:'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,textDecoration:'none',border:'1px solid rgba(255,255,255,0.08)'}}>{ic}</a>)}
            </div>
          </div>
          {footerSections.map(([title,links])=>(
            <div key={title}>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:14}}>{title}</div>
              {links.map(l=><div key={l} style={{marginBottom:9}}><a href="#" style={{color:'rgba(255,255,255,0.6)',fontSize:13,textDecoration:'none'}}>{l}</a></div>)}
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'rgba(255,255,255,0.3)',fontSize:12}}>© 2025 Kriparti Playing 11 Private Limited. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

export function About() {
  return (
    <div style={{ backgroundColor: '#0A1628', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Navbar active="about" />
      
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0F2247, #1a3a6e)', height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 48, margin: '0 0 16px', letterSpacing: '0.02em' }}>ABOUT BCPL</h1>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.8)', margin: 0 }}>India's Biggest Corporate Cricket League</p>
      </div>

      {/* Mission */}
      <div style={{ padding: '80px 40px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <blockquote style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 28, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)', margin: '0 0 32px' }}>
          "At BCPL T20, we believe team sports are more than just a game — they teach teamwork, leadership and perseverance that resonate with every corporate professional."
        </blockquote>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
          BCPL is a T20 tournament built exclusively for corporate employees and working professionals across India — a chance to step off the office floor and onto a real cricket stage. Conceptualised and run by Kriparti Playing 11 Private Limited, BCPL has grown season after season to become the world's largest corporate cricket league.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 40px', display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
        {[
          { label: '5,000+', sub: 'Players' },
          { label: '200+', sub: 'Teams' },
          { label: '10', sub: 'Cities' },
          { label: '5', sub: 'Seasons' }
        ].map((stat, i) => (
          <div key={i} style={{ background: 'rgba(15,34,71,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '32px', minWidth: 200, textAlign: 'center', flex: '1 1 200px' }}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 36, color: '#FF7A29', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* What We Provide */}
      <div style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 40px' }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 32, textAlign: 'center', marginBottom: 48 }}>What We Provide</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
          {[
            { icon: '🎽', title: 'Real Kit & Jersey', desc: 'Every selected player gets an official BCPL kit and jersey — no expense to you.' },
            { icon: '🏟️', title: 'Stadium-Grade Grounds', desc: 'We play on real cricket stadiums and top-tier grounds across 10 Indian cities.' },
            { icon: '👨‍🏫', title: 'Professional Coaches', desc: 'BCCI-certified coaches assess and guide every selected player through the season.' }
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(15,34,71,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 24 }}>{item.icon}</div>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 16 }}>{item.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Process */}
      <div style={{ maxWidth: 900, margin: '0 auto 80px', padding: '0 40px' }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 32, textAlign: 'center', marginBottom: 48 }}>Our Process</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { phase: 'Phase 1', title: 'Video Trials', desc: 'Submit a 2-minute video showcasing your skills.' },
            { phase: 'Phase 2', title: 'Physical Shortlisting', desc: 'Top candidates are invited for in-person assessment.' },
            { phase: 'Phase 3', title: 'Player Auction', desc: 'Franchises bid on selected players.' },
            { phase: 'Phase 4', title: 'Season Play', desc: 'Compete in the tournament and make your mark.' }
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 24, background: 'rgba(15,34,71,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '32px', alignItems: 'center' }}>
              <div style={{ background: 'linear-gradient(135deg, #FF7A29, #E8611A)', width: 64, height: 64, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 24, flexShrink: 0, boxShadow: '0 4px 16px rgba(255,122,41,0.3)' }}>
                {i + 1}
              </div>
              <div>
                <div style={{ color: '#FF7A29', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{step.phase}</div>
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20, margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The People Behind BCPL */}
      <div style={{ maxWidth: 1200, margin: '0 auto 100px', padding: '0 40px' }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 32, textAlign: 'center', marginBottom: 48 }}>The People Behind BCPL</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
          {[
            { name: 'Rahul Sharma', role: 'Founder', initials: 'RS', color: '#E8B23D' },
            { name: 'Amit Desai', role: 'Head Coach', initials: 'AD', color: '#2E9E4F' },
            { name: 'Priya Patel', role: 'Operations Director', initials: 'PP', color: '#E8493F' }
          ].map((person, i) => (
            <div key={i} style={{ background: 'rgba(15,34,71,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ width: 96, height: 96, borderRadius: 48, background: person.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, margin: '0 auto 24px', color: '#fff' }}>
                {person.initials}
              </div>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{person.name}</h3>
              <div style={{ color: '#FF7A29', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{person.role}</div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
