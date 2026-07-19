import React from 'react';

// Shared Navbar
function Navbar({active=''}) {
  const links=[['Home','home'],['Schedule','schedule'],['Match Center','matchcenter'],['Teams','teams'],['Points Table','points'],['About','about']];
  return (
    <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(10,22,40,0.97)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'0 40px'}}>
      <div style={{maxWidth:1200,margin:'0 auto',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,letterSpacing:'-0.02em'}}>
          <span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:4}}>T20</span>
          <span style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:600,marginLeft:10,fontFamily:'Inter,sans-serif',textTransform:'uppercase',letterSpacing:'0.12em'}}>Bhartiya Corporate Premier League</span>
        </div>
        <div style={{display:'flex',gap:24,alignItems:'center'}}>
          {links.map(([label,key])=>(
            <a key={key} href="#" style={{color:active===key?'#FF7A29':'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',transition:'color 0.2s',borderBottom:active===key?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2}}>{label}</a>
          ))}
          <button style={{background:'linear-gradient(135deg,#FF7A29,#E8611A)',color:'#fff',border:'none',borderRadius:10,padding:'10px 22px',fontWeight:700,fontSize:13.5,cursor:'pointer',boxShadow:'0 4px 20px rgba(255,122,41,0.4)',fontFamily:'Inter,sans-serif',letterSpacing:'0.01em'}}>
            Register ₹299
          </button>
        </div>
      </div>
    </nav>
  );
}

// Shared Footer
function Footer() {
  return (
    <footer style={{background:'#06101E',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'56px 40px 32px',fontFamily:'Inter,sans-serif'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:40,marginBottom:40}}>
          <div>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:26,marginBottom:10}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:4}}>T20</span></div>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:12.5,lineHeight:1.7,margin:0}}>Bhartiya Corporate Premier League<br/>World's largest corporate cricket league for working professionals.</p>
            <div style={{display:'flex',gap:10,marginTop:20}}>
              {['📸','▶️','🐦','📘'].map((ic,i)=>(
                <a key={i} href="#" style={{width:36,height:36,borderRadius:9,background:'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,textDecoration:'none',border:'1px solid rgba(255,255,255,0.08)'}}>{ic}</a>
              ))}
            </div>
          </div>
          {[['League',['Home','Schedule','Match Center','Teams','Points Table']],['Info',['About BCPL','FAQ','Contact Us','Eligibility','Code of Conduct']],['Legal',['Cricket Rulebook','Terms of Service','Privacy Policy','Refund Policy']]].map(([title,links])=>(
            <div key={title}>
              <div style={{color:'rgba(255,255,255,0.35)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:16}}>{title}</div>
              {links.map(l=><div key={l} style={{marginBottom:10}}><a href="#" style={{color:'rgba(255,255,255,0.6)',fontSize:13.5,textDecoration:'none',transition:'color 0.2s'}}>{l}</a></div>)}
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:24,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'rgba(255,255,255,0.3)',fontSize:12}}>© 2025 Kriparti Playing 11 Private Limited. All rights reserved.</div>
          <div style={{display:'flex',gap:20}}>
            {['Privacy Policy','Terms','Refund Policy'].map(l=><a key={l} href="#" style={{color:'rgba(255,255,255,0.3)',fontSize:12,textDecoration:'none'}}>{l}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Home() {
  const premiumCTA = {
    background: 'linear-gradient(135deg,#FF7A29,#E8611A)',
    borderRadius: '10px',
    fontWeight: 700,
    boxShadow: '0 6px 24px rgba(255,122,41,0.4)',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, sans-serif'
  };

  const glassCard = {
    background: 'rgba(15,34,71,0.6)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '16px',
    padding: '32px'
  };

  return (
    <div style={{ background: '#0A1628', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 0. Announcement Bar */}
      <div style={{ 
        background: 'linear-gradient(90deg,#FF7A29,#E8611A)', 
        color: '#fff', 
        fontWeight: 700, 
        fontSize: '13px', 
        textAlign: 'center', 
        padding: '10px' 
      }}>
        🔴 SEASON 5 TRIALS OPEN NOW — Limited slots. Register before they fill. <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>→ Register for ₹299</span>
      </div>

      {/* 1. Sticky Navbar */}
      <Navbar active="home" />

      {/* 2. Hero Section */}
      <section style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url(/__mockup/images/bcpl-hero.jpg) center/cover',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg,rgba(6,16,30,0.93) 0%,rgba(10,22,40,0.75) 60%,transparent 100%)',
          zIndex: 1
        }} />
        
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 40px', position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Left Side */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255,122,41,0.2)',
              border: '1px solid rgba(255,122,41,0.4)',
              borderRadius: '999px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#FF7A29'
            }}>
              ● SEASON 5 TRIALS OPEN NOW
            </div>
            
            <div style={{
              color: '#FF7A29',
              fontSize: '11px',
              letterSpacing: '0.18em',
              fontWeight: 700,
              marginTop: '20px',
              textTransform: 'uppercase'
            }}>
              INDIA'S BIGGEST CORPORATE T20 LEAGUE
            </div>
            
            <h1 style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 900,
              fontSize: '88px',
              lineHeight: 0.9,
              marginTop: '16px',
              marginBottom: '24px'
            }}>
              YOUR CRICKET<br/>DREAM<br/><span style={{ color: '#FF7A29' }}>ISN'T OVER.</span>
            </h1>
            
            <p style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '17px',
              maxWidth: '480px',
              lineHeight: 1.6,
              marginBottom: '32px'
            }}>
              Job, family, no time to play — life got in the way. This is your real trial. Send one video. That's it.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
              <button style={premiumCTA}>
                Register for ₹299 →
              </button>
              <button style={{
                background: 'transparent',
                border: '1.5px solid rgba(255,255,255,0.3)',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: 700,
                padding: '12px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, sans-serif'
              }}>
                📞 Call Us
              </button>
              <button style={{
                background: '#2E9E4F',
                border: 'none',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: 700,
                padding: '12px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, sans-serif'
              }}>
                💬 WhatsApp
              </button>
            </div>
            
            <a href="#" style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '13.5px',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-block',
              transition: 'color 0.2s'
            }}>
              ▶ Watch How It Works
            </a>
          </div>

          {/* Right Side */}
          <div style={{
            ...glassCard,
            padding: '40px',
            minWidth: '380px',
            boxShadow: '0 0 60px rgba(255,122,41,0.25),0 20px 60px rgba(0,0,0,0.5)',
            transform: 'translateY(-10px)'
          }}>
            <div style={{
              background: 'rgba(255,122,41,0.15)',
              color: '#FF7A29',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-block',
              letterSpacing: '0.08em',
              marginBottom: '16px'
            }}>
              PHASE 1 TRIALS
            </div>
            
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              ONLY
            </div>
            
            <div style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 900,
              fontSize: '72px',
              color: '#E8B23D',
              textShadow: '0 0 40px rgba(232,178,61,0.4)',
              lineHeight: 1
            }}>
              ₹299
            </div>
            
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', marginBottom: '24px' }}>
              to enter Phase 1 trials
            </div>
            
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '24px' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>All-Rounder</span>
              <span style={{ color: '#E8B23D', fontSize: '20px', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>₹399</span>
            </div>
            
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '24px' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
                <span style={{ color: '#E8B23D', fontWeight: 'bold' }}>✓</span> No auction fee
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
                <span style={{ color: '#E8B23D', fontWeight: 'bold' }}>✓</span> No tournament fee
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
                <span style={{ color: '#E8B23D', fontWeight: 'bold' }}>✓</span> No hidden charges
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 3. Stats Bar */}
      <section style={{
        background: '#06101E',
        padding: '40px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {[
            ['5,000+', 'Players Registered'],
            ['200+', 'Corporate Teams'],
            ['10', 'City Franchises'],
            ['Season 5', 'Edition']
          ].map(([num, label], i) => (
            <React.Fragment key={label}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 800,
                  fontSize: '52px',
                  color: '#E8B23D',
                  lineHeight: 1.1
                }}>{num}</div>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '8px',
                  fontWeight: 600
                }}>{label}</div>
              </div>
              {i < 3 && (
                <div style={{ width: '1px', height: '60px', background: 'rgba(255,255,255,0.1)' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* 4. How It Works */}
      <section style={{
        padding: '80px 40px',
        background: 'linear-gradient(180deg,#06101E,#0F2247)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: '16px'
            }}>THE PROCESS</div>
            <h2 style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: '44px',
              margin: 0
            }}>THREE STEPS TO THE FIELD</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            {[
              ['01', '🎬', 'Upload Your Video', 'Send a 2-min clip of you batting, bowling or fielding. Our scout panel reviews every single submission.'],
              ['02', '🏅', 'Get Shortlisted', 'Top performers receive a personal call. Physical trial at a ground near you — batting, bowling, fielding in front of our scouts.'],
              ['03', '🏟️', 'Play in BCPL T20', "You're auctioned to a city franchise. Kit, jersey, coach, stadium-grade ground. No more fees — ever."]
            ].map(([num, icon, title, desc]) => (
              <div key={num} style={{
                ...glassCard,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 900,
                  fontSize: '80px',
                  opacity: 0.08,
                  color: '#FF7A29',
                  lineHeight: 1
                }}>{num}</div>
                
                <div style={{
                  color: '#FF7A29',
                  fontWeight: 800,
                  fontSize: '14px',
                  marginBottom: '20px'
                }}>{num}</div>
                
                <div style={{ fontSize: '24px', marginBottom: '16px' }}>{icon}</div>
                
                <h3 style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize: '20px',
                  marginBottom: '12px'
                }}>{title}</h3>
                
                <p style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  margin: 0
                }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Upcoming Match */}
      <section style={{
        padding: '60px 40px',
        background: '#0F2247'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: '12px'
            }}>MATCH CENTER</div>
            <h2 style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: '36px',
              margin: 0
            }}>NEXT MATCH</h2>
          </div>

          <div style={{
            ...glassCard,
            maxWidth: '640px',
            margin: '0 auto',
            boxShadow: '0 0 40px rgba(255,122,41,0.15)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#FF7A29',
              letterSpacing: '0.05em',
              marginBottom: '24px'
            }}>UPCOMING • SAT 26 JUL • 6:00 PM IST</div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div style={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 800,
                fontSize: '28px',
                color: '#C62828'
              }}>MUMBAI MAVERICKS</div>
              
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.6)'
              }}>VS</div>
              
              <div style={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 800,
                fontSize: '28px',
                color: '#1565C0'
              }}>DELHI DYNAMOS</div>
            </div>
            
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255,255,255,0.05)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '32px'
            }}>
              🏟️ DY Patil Stadium, Mumbai
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
              {[
                ['04', 'DAYS'],
                ['12', 'HOURS'],
                ['45', 'MINS']
              ].map(([val, lbl]) => (
                <div key={lbl} style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  minWidth: '80px'
                }}>
                  <div style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                    fontSize: '24px',
                    color: '#fff',
                    marginBottom: '4px'
                  }}>{val}</div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: '0.05em'
                  }}>{lbl}</div>
                </div>
              ))}
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <a href="#" style={{
                color: '#FF7A29',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none'
              }}>View All Matches →</a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Teams */}
      <section style={{
        padding: '60px 40px',
        background: '#0A1628'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: '12px'
            }}>THE FRANCHISES</div>
            <h2 style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: '42px',
              margin: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'end'
            }}>
              <span>TEN CITIES. ONE DREAM.</span>
              <a href="#" style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
                paddingBottom: '8px'
              }}>View All 10 Teams →</a>
            </h2>
          </div>

          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '16px',
            paddingBottom: '16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {[
              ['Delhi Dynamos', '#1565C0', 'Delhi'],
              ['Mumbai Mavericks', '#C62828', 'Mumbai'],
              ['Pune Panthers', '#6A1B9A', 'Pune'],
              ['Kolkata Knights', '#424242', 'Kolkata'],
              ['Bangalore Bulls', '#E65100', 'Bangalore'],
              ['Chennai Chiefs', '#F9A825', 'Chennai']
            ].map(([name, color, city]) => (
              <div key={name} style={{
                ...glassCard,
                minWidth: '240px',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: color
                }} />
                
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  alignSelf: 'flex-start',
                  marginBottom: '12px'
                }}>SEASON 5</div>
                
                <div style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  color: '#fff'
                }}>{name}</div>
                
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.55)'
                }}>{city}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Points Table Preview */}
      <section style={{
        padding: '60px 40px',
        background: '#06101E'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: '12px'
            }}>STANDINGS</div>
            <h2 style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: '32px',
              margin: 0
            }}>POINTS TABLE — GROUP A</h2>
          </div>

          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            background: 'rgba(15,34,71,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 1fr',
              background: 'rgba(255,122,41,0.15)',
              color: '#FF7A29',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: '11px',
              letterSpacing: '0.1em',
              padding: '16px 20px'
            }}>
              <div>TEAM</div>
              <div style={{ textAlign: 'center' }}>P</div>
              <div style={{ textAlign: 'center' }}>W</div>
              <div style={{ textAlign: 'center' }}>L</div>
              <div style={{ textAlign: 'center' }}>PTS</div>
              <div style={{ textAlign: 'right' }}>NRR</div>
            </div>
            
            {[
              ['Delhi Dynamos', '8', '6', '2', '12', '+1.24', true],
              ['Mumbai Mavericks', '8', '5', '3', '10', '+0.87', false],
              ['Pune Panthers', '8', '4', '4', '8', '+0.12', false],
              ['Kolkata Knights', '8', '3', '5', '6', '-0.45', false],
              ['Ahmedabad Aces', '8', '2', '6', '4', '-1.78', false]
            ].map(([team, p, w, l, pts, nrr, isLeader], i) => (
              <div key={team} style={{
                display: 'grid',
                gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 1fr',
                padding: '16px 20px',
                background: isLeader ? 'rgba(232,178,61,0.08)' : (i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'),
                borderBottom: i !== 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                borderLeft: isLeader ? '3px solid #E8B23D' : '3px solid transparent',
                alignItems: 'center',
                fontSize: '14px'
              }}>
                <div style={{ fontWeight: isLeader ? 700 : 500, color: isLeader ? '#E8B23D' : '#fff' }}>{team}</div>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>{p}</div>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>{w}</div>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>{l}</div>
                <div style={{ textAlign: 'center', fontWeight: isLeader ? 800 : 700, color: isLeader ? '#E8B23D' : '#fff', fontSize: '15px' }}>{pts}</div>
                <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '13px' }}>{nrr}</div>
              </div>
            ))}
          </div>
          
          <div style={{ maxWidth: '800px', margin: '20px auto 0', textAlign: 'right' }}>
            <a href="#" style={{
              color: '#FF7A29',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none'
            }}>View Full Points Table →</a>
          </div>
        </div>
      </section>

      {/* 8. Registration CTA */}
      <section style={{
        padding: '100px 40px',
        background: 'linear-gradient(135deg,#0F2247,#1a3a6e)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255,122,41,0.15)',
            border: '1px solid rgba(255,122,41,0.3)',
            borderRadius: '999px',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#FF7A29',
            marginBottom: '24px'
          }}>
            SEASON 5 IS LIVE
          </div>
          
          <h2 style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: '52px',
            lineHeight: 1.1,
            marginBottom: '24px'
          }}>
            DON'T MISS<br/><span style={{ color: '#FF7A29' }}>SEASON 5.</span>
          </h2>
          
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '16px',
            lineHeight: 1.6,
            marginBottom: '40px',
            maxWidth: '500px',
            margin: '0 auto 40px'
          }}>
            ₹299 to enter Phase 1 trials. No hidden fees. No auction fee. No tournament fee.
          </p>
          
          <button style={{
            ...premiumCTA,
            fontSize: '18px',
            padding: '18px 40px',
            boxShadow: '0 10px 40px rgba(255,122,41,0.5)'
          }}>
            Register Now — ₹299 →
          </button>
          
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px',
            marginTop: '24px',
            marginBottom: '32px'
          }}>
            All-Rounder: ₹399 &nbsp;|&nbsp; Corporate employees only &nbsp;|&nbsp; Season 5
          </div>
          
          <div style={{
            display: 'inline-flex',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            color: '#fff',
            fontWeight: 600
          }}>
            🏏 5,000+ professionals already registered
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <Footer />
      
    </div>
  );
}
