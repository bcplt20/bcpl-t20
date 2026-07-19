import React, { useState } from 'react';

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

export function Contact() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const contactMethods = [
    { icon: '📞', title: 'Call Us', detail: '+91 98765 43210', note: 'Mon-Sat 10AM-7PM' },
    { icon: '💬', title: 'WhatsApp', detail: '+91 98765 43210', note: 'Quick replies within 2 hours' },
    { icon: '📧', title: 'Email', detail: 'support@bcplt20.com', note: 'Response within 24 hours' },
    { icon: '📍', title: 'Office', detail: 'Kriparti Playing 11 Pvt Ltd', note: 'Pune, Maharashtra' },
    { icon: '📸', title: 'Instagram', detail: '@bcplt20official', note: 'Follow for updates' },
    { icon: '▶️', title: 'YouTube', detail: 'BCPL T20', note: 'Watch match highlights' }
  ];

  return (
    <div style={{ backgroundColor: '#0A1628', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Navbar active="" />
      
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0F2247, #1a3a6e)', height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 48, margin: '0 0 16px', letterSpacing: '0.02em' }}>CONTACT US</h1>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.8)', margin: 0 }}>We're here to help</p>
      </div>

      {/* Two Column Layout */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 40px', display: 'flex', gap: 60, flexWrap: 'wrap' }}>
        
        {/* LEFT - Contact Methods */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {contactMethods.map((method, i) => (
              <div 
                key={i} 
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ 
                  background: 'rgba(15,34,71,0.6)', 
                  backdropFilter: 'blur(20px)', 
                  border: '1px solid rgba(255,255,255,0.10)', 
                  borderLeft: hoveredCard === i ? '4px solid #FF7A29' : '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 16, 
                  padding: '24px', 
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{method.icon}</div>
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>{method.title}</h3>
                <div style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>{method.detail}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{method.note}</div>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: 20, 
            background: 'rgba(232,178,61,0.05)', 
            border: '1px solid rgba(232,178,61,0.3)', 
            borderRadius: 16, 
            padding: '32px',
            textAlign: 'center'
          }}>
            <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, margin: '0 0 12px', color: '#E8B23D' }}>Registration Queries</h4>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: '0 0 24px' }}>For registration-related queries, WhatsApp is the fastest channel.</p>
            <button style={{ 
              background: '#2E9E4F', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 10, 
              padding: '12px 24px', 
              fontWeight: 700, 
              fontSize: 15, 
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              width: '100%',
              boxShadow: '0 4px 16px rgba(46,158,79,0.3)'
            }}>
              WhatsApp Now →
            </button>
          </div>
        </div>

        {/* RIGHT - Contact Form */}
        <div style={{ flex: '1 1 400px' }}>
          <div style={{ 
            background: 'rgba(15,34,71,0.6)', 
            backdropFilter: 'blur(20px)', 
            border: '1px solid rgba(255,255,255,0.10)', 
            borderRadius: 16, 
            padding: '40px' 
          }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, margin: '0 0 32px' }}>Send Us a Message</h2>
            
            <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Name</label>
                  <input type="text" placeholder="John Doe" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none' }} />
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Phone</label>
                  <input type="tel" placeholder="+91 99999 99999" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none' }} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Email</label>
                <input type="email" placeholder="john@example.com" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Subject</label>
                <select style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none' }}>
                  <option value="general" style={{ background: '#0F2247', color: '#fff' }}>General Inquiry</option>
                  <option value="registration" style={{ background: '#0F2247', color: '#fff' }}>Registration</option>
                  <option value="technical" style={{ background: '#0F2247', color: '#fff' }}>Technical Issue</option>
                  <option value="sponsorship" style={{ background: '#0F2247', color: '#fff' }}>Sponsorship</option>
                  <option value="media" style={{ background: '#0F2247', color: '#fff' }}>Media</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Message</label>
                <textarea rows={4} placeholder="How can we help you?" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none', resize: 'vertical' }} />
              </div>

              <button style={{ 
                background: 'linear-gradient(135deg, #FF7A29, #E8611A)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 10, 
                padding: '16px', 
                fontWeight: 700, 
                fontSize: 16, 
                cursor: 'pointer',
                boxShadow: '0 6px 24px rgba(255,122,41,0.4)',
                fontFamily: 'Inter, sans-serif',
                marginTop: 8
              }}>
                Send Message →
              </button>

              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 8 }}>
                We respect your privacy. Your details will never be shared.
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
