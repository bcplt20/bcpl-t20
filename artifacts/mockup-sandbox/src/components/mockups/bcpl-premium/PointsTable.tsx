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

export function PointsTable() {
  const groupA = [
    {rank:1, name:'Delhi Dynamos', city:'Delhi', color:'#1565C0', p:8, w:6, l:2, t:0, nr:0, pts:12, nrr:1.24},
    {rank:2, name:'Mumbai Mavericks', city:'Mumbai', color:'#C62828', p:8, w:5, l:3, t:0, nr:0, pts:10, nrr:0.87},
    {rank:3, name:'Pune Panthers', city:'Pune', color:'#6A1B9A', p:8, w:4, l:4, t:0, nr:0, pts:8, nrr:0.12},
    {rank:4, name:'Kolkata Knights', city:'Kolkata', color:'#424242', p:8, w:3, l:5, t:0, nr:0, pts:6, nrr:-0.45},
    {rank:5, name:'Ahmedabad Aces', city:'Ahmedabad', color:'#4E342E', p:8, w:2, l:6, t:0, nr:0, pts:4, nrr:-1.78},
  ];

  const groupB = [
    {rank:1, name:'Bangalore Bulls', city:'Bangalore', color:'#E65100', p:8, w:7, l:1, t:0, nr:0, pts:14, nrr:1.85},
    {rank:2, name:'Chennai Chiefs', city:'Chennai', color:'#F9A825', p:8, w:5, l:3, t:0, nr:0, pts:10, nrr:0.54},
    {rank:3, name:'Hyderabad Hawks', city:'Hyderabad', color:'#2E7D32', p:8, w:4, l:4, t:0, nr:0, pts:8, nrr:-0.11},
    {rank:4, name:'Jaipur Jaguars', city:'Jaipur', color:'#AD1457', p:8, w:3, l:5, t:0, nr:0, pts:6, nrr:-0.78},
    {rank:5, name:'Surat Stallions', city:'Surat', color:'#0277BD', p:8, w:1, l:7, t:0, nr:0, pts:2, nrr:-1.52},
  ];

  const renderTable = (data, title) => (
    <div style={{marginBottom:60}}>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
        <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,margin:0,color:'#fff'}}>{title}</h2>
      </div>
      
      <div style={{background:'rgba(15,34,71,0.6)',backdropFilter:'blur(20px)',borderRadius:16,border:'1px solid rgba(255,255,255,0.1)',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}}>
        <div style={{display:'grid',gridTemplateColumns:'60px 2fr 1.5fr repeat(6, 1fr) 1.5fr',background:'rgba(255,122,41,0.15)',color:'rgba(255,122,41,0.9)',padding:'16px 20px',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
          <div>Rank</div>
          <div>Team</div>
          <div>City</div>
          <div style={{textAlign:'center'}}>P</div>
          <div style={{textAlign:'center'}}>W</div>
          <div style={{textAlign:'center'}}>L</div>
          <div style={{textAlign:'center'}}>T</div>
          <div style={{textAlign:'center'}}>NR</div>
          <div style={{textAlign:'center'}}>Pts</div>
          <div style={{textAlign:'right'}}>NRR</div>
        </div>
        
        {data.map((row, idx) => (
          <div key={idx} style={{
            display:'grid',
            gridTemplateColumns:'60px 2fr 1.5fr repeat(6, 1fr) 1.5fr',
            padding:'16px 20px',
            alignItems:'center',
            fontSize:14,
            background: row.rank === 1 ? 'rgba(232,178,61,0.08)' : (idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.025)'),
            borderLeft: row.rank === 1 ? '3px solid #E8B23D' : '3px solid transparent',
            borderBottom: idx < data.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
          }}>
            <div style={{fontWeight:row.rank===1?800:600,color:row.rank===1?'#E8B23D':'rgba(255,255,255,0.6)'}}>{row.rank}</div>
            <div style={{display:'flex',alignItems:'center',gap:12,fontWeight:700,color:'#fff'}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:row.color,boxShadow:`0 0 8px ${row.color}`}}></div>
              {row.rank === 1 && <span style={{fontSize:16}}>🏆</span>}
              {row.name}
            </div>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:13}}>{row.city}</div>
            <div style={{textAlign:'center',color:'rgba(255,255,255,0.8)'}}>{row.p}</div>
            <div style={{textAlign:'center',color:'rgba(255,255,255,0.8)'}}>{row.w}</div>
            <div style={{textAlign:'center',color:'rgba(255,255,255,0.8)'}}>{row.l}</div>
            <div style={{textAlign:'center',color:'rgba(255,255,255,0.4)'}}>{row.t}</div>
            <div style={{textAlign:'center',color:'rgba(255,255,255,0.4)'}}>{row.nr}</div>
            <div style={{textAlign:'center',fontWeight:800,color:row.rank===1?'#E8B23D':'#fff',fontSize:15}}>{row.pts}</div>
            <div style={{textAlign:'right',fontWeight:600,color:row.nrr>0?'#2E9E4F':'#E8493F'}}>{row.nrr>0?'+':''}{row.nrr.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{background:'#0A1628',minHeight:'100vh',color:'#fff',fontFamily:'Inter,sans-serif'}}>
      <Navbar active="points" />
      
      <section style={{height:280,background:'linear-gradient(135deg,#0F2247,#1a3a6e)',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center',padding:'0 20px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <div style={{color:'#FF7A29',fontWeight:800,fontSize:12,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:16,background:'rgba(255,122,41,0.1)',padding:'4px 12px',borderRadius:20}}>POINTS TABLE</div>
        <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:52,color:'#fff',margin:'0 0 16px 0',lineHeight:1.1}}>SEASON 5 STANDINGS</h1>
        <p style={{color:'rgba(255,255,255,0.7)',fontSize:16,maxWidth:600,margin:0,lineHeight:1.6}}>The race to the playoffs. Only the top two teams from each group advance.</p>
      </section>

      <main style={{maxWidth:1100,margin:'0 auto',padding:'60px 40px'}}>
        
        <div style={{display:'flex',gap:12,marginBottom:40}}>
          <div style={{background:'#FF7A29',color:'#fff',padding:'8px 24px',borderRadius:20,fontWeight:700,fontSize:14,cursor:'default',boxShadow:'0 4px 16px rgba(255,122,41,0.3)'}}>GROUP A</div>
          <div style={{background:'#FF7A29',color:'#fff',padding:'8px 24px',borderRadius:20,fontWeight:700,fontSize:14,cursor:'default',boxShadow:'0 4px 16px rgba(255,122,41,0.3)'}}>GROUP B</div>
        </div>

        {renderTable(groupA, "GROUP A")}
        {renderTable(groupB, "GROUP B")}

        <section style={{background:'#06101E',borderRadius:16,padding:40,border:'1px solid rgba(255,255,255,0.08)',marginTop:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32}}>
            <div>
              <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,margin:'0 0 8px 0',color:'#fff'}}>PLAYOFF PICTURE</h3>
              <p style={{margin:0,color:'rgba(255,255,255,0.5)',fontSize:14}}>Top 2 from each group qualify for playoffs</p>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{color:'#E8B23D',fontWeight:800,fontSize:14,marginBottom:4}}>GRAND FINAL</div>
              <div style={{color:'rgba(255,255,255,0.7)',fontSize:13}}>Sat 30 Aug • DY Patil Stadium</div>
            </div>
          </div>
          
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
            <div style={{background:'rgba(255,255,255,0.03)',borderRadius:12,padding:24,border:'1px solid rgba(255,255,255,0.05)'}}>
              <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,letterSpacing:'0.1em',marginBottom:16}}>SEMI FINAL 1</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:16,borderBottom:'1px dashed rgba(255,255,255,0.1)'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:32,height:32,background:'#1565C0',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14}}>D</div>
                  <span style={{fontWeight:700}}>Delhi Dynamos</span>
                </div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:600}}>A1</div>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:16}}>
                <div style={{display:'flex',alignItems:'center',gap:12,color:'rgba(255,255,255,0.4)'}}>
                  <div style={{width:32,height:32,background:'rgba(255,255,255,0.1)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14}}>?</div>
                  <span style={{fontWeight:600}}>Group B Runner-up</span>
                </div>
                <div style={{color:'rgba(255,255,255,0.3)',fontSize:12,fontWeight:600}}>B2</div>
              </div>
            </div>

            <div style={{background:'rgba(255,255,255,0.03)',borderRadius:12,padding:24,border:'1px solid rgba(255,255,255,0.05)'}}>
              <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,letterSpacing:'0.1em',marginBottom:16}}>SEMI FINAL 2</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:16,borderBottom:'1px dashed rgba(255,255,255,0.1)'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:32,height:32,background:'#E65100',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14}}>B</div>
                  <span style={{fontWeight:700}}>Bangalore Bulls</span>
                </div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:600}}>B1</div>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:16}}>
                <div style={{display:'flex',alignItems:'center',gap:12,color:'rgba(255,255,255,0.4)'}}>
                  <div style={{width:32,height:32,background:'rgba(255,255,255,0.1)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14}}>?</div>
                  <span style={{fontWeight:600}}>Group A Runner-up</span>
                </div>
                <div style={{color:'rgba(255,255,255,0.3)',fontSize:12,fontWeight:600}}>A2</div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
