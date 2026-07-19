import React from 'react';

function Navbar({active=''}) {
  const links=[['Home','home'],['Schedule','schedule'],['Match Center','matchcenter'],['Teams','teams'],['Points Table','points'],['About','about']];
  return (
    <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(10,22,40,0.97)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'0 40px'}}>
      <div style={{maxWidth:1200,margin:'0 auto',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,display:'flex',alignItems:'center'}}>
          <span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:4}}>T20</span>
          <span style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:600,marginLeft:10,fontFamily:'Inter,sans-serif',textTransform:'uppercase',letterSpacing:'0.12em'}}>Bhartiya Corporate Premier League</span>
        </div>
        <div style={{display:'flex',gap:24,alignItems:'center'}}>
          {links.map(([label,key])=>(
            <a key={key} href="#" style={{color:active===key?'#FF7A29':'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',borderBottom:active===key?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2,transition:'color 0.2s'}}>{label}</a>
          ))}
          <button style={{background:'linear-gradient(135deg,#FF7A29,#E8611A)',color:'#fff',border:'none',borderRadius:10,padding:'10px 22px',fontWeight:700,fontSize:13.5,cursor:'pointer',boxShadow:'0 4px 20px rgba(255,122,41,0.4)',fontFamily:'Inter,sans-serif'}}>Register ₹299</button>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
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
          {[['League',['Home','Schedule','Match Center','Teams','Points Table']],['Info',['About BCPL','FAQ','Contact Us','Eligibility','Code of Conduct']],['Legal',['Cricket Rulebook','Terms of Service','Privacy Policy']]].map(([title,links])=>(
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

export function Teams() {
  const groupA = [
    {name: 'Delhi Dynamos', color: '#1565C0', city: 'Delhi', emoji: '🏏', letter: 'D'},
    {name: 'Mumbai Mavericks', color: '#C62828', city: 'Mumbai', emoji: '🦁', letter: 'M'},
    {name: 'Pune Panthers', color: '#6A1B9A', city: 'Pune', emoji: '🐆', letter: 'P'},
    {name: 'Kolkata Knights', color: '#424242', city: 'Kolkata', emoji: '⚔️', letter: 'K'},
    {name: 'Ahmedabad Aces', color: '#4E342E', city: 'Ahmedabad', emoji: '♠️', letter: 'A'},
  ];
  const groupB = [
    {name: 'Bangalore Bulls', color: '#E65100', city: 'Bangalore', emoji: '🐂', letter: 'B'},
    {name: 'Chennai Chiefs', color: '#F9A825', city: 'Chennai', emoji: '👑', letter: 'C', textColor: '#000'},
    {name: 'Hyderabad Hawks', color: '#2E7D32', city: 'Hyderabad', emoji: '🦅', letter: 'H'},
    {name: 'Jaipur Jaguars', color: '#AD1457', city: 'Jaipur', emoji: '🐅', letter: 'J'},
    {name: 'Surat Stallions', color: '#0277BD', city: 'Surat', emoji: '🐎', letter: 'S'},
  ];

  return (
    <div style={{background:'#0A1628',minHeight:'100vh',color:'#fff',fontFamily:'Inter,sans-serif'}}>
      <Navbar active="teams" />
      
      <section style={{height:280,background:'linear-gradient(135deg,#0F2247,#1a3a6e)',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center',padding:'0 20px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <div style={{color:'#FF7A29',fontWeight:800,fontSize:12,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:16,background:'rgba(255,122,41,0.1)',padding:'4px 12px',borderRadius:20}}>THE FRANCHISES</div>
        <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:52,color:'#fff',margin:'0 0 16px 0',lineHeight:1.1}}>TEN CITIES. ONE DREAM.</h1>
        <p style={{color:'rgba(255,255,255,0.7)',fontSize:16,maxWidth:600,margin:0,lineHeight:1.6}}>India's finest corporate cricket franchises competing for the Season 5 trophy.</p>
      </section>

      <main style={{maxWidth:1200,margin:'0 auto'}}>
        <section style={{padding:'60px 40px'}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:32}}>
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:28,margin:0,color:'#fff'}}>GROUP A</h2>
            <div style={{background:'rgba(255,122,41,0.15)',color:'#FF7A29',fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:16,textTransform:'uppercase',letterSpacing:'0.05em'}}>Five Franchises</div>
          </div>
          
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
            {groupA.map((team, idx) => (
              <div key={idx} style={{background:'rgba(15,34,71,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.10)',borderRadius:16,minHeight:220,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
                <div style={{height:6,background:team.color}}></div>
                <div style={{position:'absolute',top:10,right:-10,fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:96,color:team.color,opacity:0.15,lineHeight:1,userSelect:'none'}}>{team.letter}</div>
                <div style={{padding:20,flex:1,display:'flex',flexDirection:'column'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:18,color:'#fff',marginBottom:4,lineHeight:1.2,zIndex:1}}>
                    {team.emoji} {team.name}
                  </div>
                  <div style={{fontSize:13,color:'rgba(255,255,255,0.55)',zIndex:1}}>{team.city}</div>
                  
                  <div style={{height:1,background:'rgba(255,255,255,0.1)',margin:'16px 0',zIndex:1}}></div>
                  
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,0.7)',marginBottom:16,zIndex:1}}>
                    <span>12 Players</span>
                    <span>Qualified</span>
                  </div>
                  
                  <div style={{marginTop:'auto',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:1}}>
                    <div style={{background:'rgba(46,158,79,0.15)',color:'#2E9E4F',fontSize:10,fontWeight:700,padding:'4px 8px',borderRadius:4,textTransform:'uppercase'}}>Season 5 Active</div>
                  </div>
                  
                  <div style={{marginTop:16,zIndex:1}}>
                    <a href="#" style={{color:'#FF7A29',fontSize:13,fontWeight:600,textDecoration:'none',display:'inline-flex',alignItems:'center'}}>View Squad <span style={{marginLeft:4}}>→</span></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{padding:'20px 40px 80px'}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:32}}>
            <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:28,margin:0,color:'#fff'}}>GROUP B</h2>
            <div style={{background:'rgba(255,122,41,0.15)',color:'#FF7A29',fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:16,textTransform:'uppercase',letterSpacing:'0.05em'}}>Five Franchises</div>
          </div>
          
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
            {groupB.map((team, idx) => (
              <div key={idx} style={{background:'rgba(15,34,71,0.6)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.10)',borderRadius:16,minHeight:220,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
                <div style={{height:6,background:team.color}}></div>
                <div style={{position:'absolute',top:10,right:-10,fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:96,color:team.color,opacity:0.15,lineHeight:1,userSelect:'none'}}>{team.letter}</div>
                <div style={{padding:20,flex:1,display:'flex',flexDirection:'column'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:18,color:'#fff',marginBottom:4,lineHeight:1.2,zIndex:1}}>
                    {team.emoji} {team.name}
                  </div>
                  <div style={{fontSize:13,color:'rgba(255,255,255,0.55)',zIndex:1}}>{team.city}</div>
                  
                  <div style={{height:1,background:'rgba(255,255,255,0.1)',margin:'16px 0',zIndex:1}}></div>
                  
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,0.7)',marginBottom:16,zIndex:1}}>
                    <span>12 Players</span>
                    <span>Qualified</span>
                  </div>
                  
                  <div style={{marginTop:'auto',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:1}}>
                    <div style={{background:'rgba(46,158,79,0.15)',color:'#2E9E4F',fontSize:10,fontWeight:700,padding:'4px 8px',borderRadius:4,textTransform:'uppercase'}}>Season 5 Active</div>
                  </div>
                  
                  <div style={{marginTop:16,zIndex:1}}>
                    <a href="#" style={{color:'#FF7A29',fontSize:13,fontWeight:600,textDecoration:'none',display:'inline-flex',alignItems:'center'}}>View Squad <span style={{marginLeft:4}}>→</span></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <section style={{background:'linear-gradient(135deg,#FF7A29,#E8611A)',padding:'60px 20px',textAlign:'center'}}>
        <div style={{maxWidth:800,margin:'0 auto'}}>
          <div style={{color:'rgba(255,255,255,0.9)',fontWeight:600,fontSize:14,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>Want to play for one of these franchises?</div>
          <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:40,color:'#fff',margin:'0 0 32px 0',lineHeight:1.2}}>Register for ₹299 and get your shot</h2>
          <button style={{background:'#fff',color:'#E8611A',border:'none',borderRadius:10,padding:'16px 40px',fontWeight:800,fontSize:16,cursor:'pointer',boxShadow:'0 8px 30px rgba(0,0,0,0.15)',fontFamily:'Inter,sans-serif'}}>Register Now</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
