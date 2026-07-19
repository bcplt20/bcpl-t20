import React from 'react';

function Navbar({active=''}) {
  const [open,setOpen]=React.useState(false);
  const links=[['Home','home'],['Match Center','matchcenter'],['Teams','teams'],['About','about']];
  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(10,22,40,0.97)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 2px 0 0 rgba(255,122,41,0.2)'}}>
        <div className="wrap" style={{height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:3}}>T20</span></div>
          <div className="nav-links">{links.map(([l,k])=><a key={k} href="#" style={{color:active===k?'#FF7A29':'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',borderBottom:active===k?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2}}>{l}</a>)}<button className="btn-primary" style={{padding:'9px 20px',fontSize:13.5,borderRadius:10,minHeight:'38px'}}>Register ₹299</button></div>
          <button className="ham" onClick={()=>setOpen(o=>!o)} style={{flexDirection:'column',gap:5,background:'none',border:'none',cursor:'pointer',padding:8,zIndex:201}}>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',transform:open?'rotate(45deg) translate(4px,4px)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',opacity:open?0:1}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:2,transition:'all 0.25s',transform:open?'rotate(-45deg) translate(4px,-4px)':''}}/>
          </button>
        </div>
      </nav>
      {open&&(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(6,16,30,0.99)',zIndex:200,display:'flex',flexDirection:'column',padding:'72px 24px 40px',overflowY:'auto'}}>
        <button onClick={()=>setOpen(false)} style={{position:'absolute',top:16,right:16,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:26,cursor:'pointer',lineHeight:1}}>✕</button>
        <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,marginBottom:28}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:3}}>T20</span></div>
        {[['🏠 Home'],['🔴 Match Center'],['🏏 Teams'],['🤝 Sponsors'],['📷 Photos'],['▶️ Videos'],['ℹ️ About'],['❓ FAQ'],['✉️ Contact']].map(([l])=><a key={l} href="#" onClick={()=>setOpen(false)} style={{color:'rgba(255,255,255,0.85)',fontWeight:700,fontSize:19,textDecoration:'none',fontFamily:'Montserrat,sans-serif',padding:'13px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{l}</a>)}
        <button className="btn-primary" style={{marginTop:28,height:52,fontSize:16,borderRadius:14,width:'100%'}}>📝 Register for ₹299 →</button>
      </div>)}
    </>
  );
}

function Footer() {
  return (
    <footer style={{background:'#06101E',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
      <div className="wrap" style={{paddingTop:40,paddingBottom:40}}>
        <div className="grid-2" style={{gap:28,marginBottom:28}}>
          <div>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22,marginBottom:10}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:4}}>T20</span></div>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:13,lineHeight:1.7,marginBottom:8,maxWidth:280}}>Bharatiya Corporate Premier League — world's largest corporate cricket league for working professionals.</p>
            <p style={{color:'rgba(255,122,41,0.6)',fontSize:12,fontWeight:600}}>#OfficeSeStadiumtak</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div><div style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>League</div>{['Schedule','Match Center','Teams','Points Table','Photos','Videos'].map(l=><div key={l} style={{marginBottom:8}}><a href="#" style={{color:'rgba(255,255,255,0.55)',fontSize:13,textDecoration:'none'}}>{l}</a></div>)}</div>
            <div><div style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Info</div>{['About','FAQ','Contact','Terms','Privacy','Refunds','Eligibility'].map(l=><div key={l} style={{marginBottom:8}}><a href="#" style={{color:'rgba(255,255,255,0.55)',fontSize:13,textDecoration:'none'}}>{l}</a></div>)}</div>
          </div>
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:20,display:'flex',flexWrap:'wrap',gap:12,justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',gap:8}}>{['📸','▶️','🐦','📘'].map((ic,i)=><a key={i} href="#" style={{width:36,height:36,borderRadius:9,background:'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,textDecoration:'none',border:'1px solid rgba(255,255,255,0.07)'}}>{ic}</a>)}</div>
          <div style={{color:'rgba(255,255,255,0.28)',fontSize:11}}>© 2025 Kriparti Playing11 Pvt. Ltd.</div>
        </div>
      </div>
    </footer>
  );
}

export function TeamDetail() {
  const teamColor = '#1565C0';
  const players = [
    { name: 'Rohit Sharma', role: 'BAT', company: 'Infosys', loc: 'Delhi', inits: 'RS' },
    { name: 'Vikas Gupta', role: 'BOWL', company: 'HDFC Bank', loc: 'Delhi', inits: 'VG' },
    { name: 'Priya Nair', role: 'WK', company: 'Amazon', loc: 'Delhi', inits: 'PN' },
    { name: 'Arjun Singh', role: 'AR', company: 'Wipro', loc: 'Delhi', inits: 'AS' },
    { name: 'Karan Mehta', role: 'BAT', company: 'Deloitte', loc: 'Delhi', inits: 'KM' },
    { name: 'Deepika Roy', role: 'BOWL', company: 'TCS', loc: 'Delhi', inits: 'DR' },
    { name: 'Suresh Kumar', role: 'BAT', company: 'Accenture', loc: 'Delhi', inits: 'SK' },
    { name: 'Ankita Joshi', role: 'AR', company: 'Flipkart', loc: 'Delhi', inits: 'AJ' },
    { name: 'Rajesh Verma', role: 'BOWL', company: 'Reliance', loc: 'Delhi', inits: 'RV' },
    { name: 'Sneha Patel', role: 'BAT', company: 'ICICI', loc: 'Delhi', inits: 'SP' },
    { name: 'Mohit Yadav', role: 'WK', company: 'Zomato', loc: 'Delhi', inits: 'MY' },
    { name: 'Pooja Reddy', role: 'BOWL', company: 'Swiggy', loc: 'Delhi', inits: 'PR' }
  ];

  const getRoleColor = (role) => {
    switch(role) {
      case 'BAT': return '#2E9E4F';
      case 'BOWL': return '#E8493F';
      case 'WK': return '#E8B23D';
      case 'AR': return '#FF7A29';
      default: return '#555';
    }
  };

  return (
    <div style={{background:'#0A1628',color:'#fff',minHeight:'100vh',fontFamily:'Inter,sans-serif'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
        .wrap{max-width:1200px;margin:0 auto;padding:0 16px}
        .section{padding:40px 0}
        .h1{font-family:Montserrat,sans-serif;font-weight:900;font-size:36px;line-height:1.05}
        .h2{font-family:Montserrat,sans-serif;font-weight:800;font-size:22px}
        .glass{background:rgba(15,34,71,0.7);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.10);border-radius:16px}
        .btn-primary{background:linear-gradient(135deg,#FF7A29,#E8611A);border:none;border-radius:12px;color:#fff;font-weight:700;font-family:Montserrat,sans-serif;cursor:pointer;box-shadow:0 6px 24px rgba(255,122,41,0.4);transition:transform 0.15s;min-height:48px;display:inline-flex;align-items:center;justify-content:center;padding:0 24px;}
        .btn-primary:active{transform:scale(0.97)}
        .btn-wa{background:#2E9E4F;border:none;border-radius:12px;color:#fff;font-weight:700;cursor:pointer;min-height:48px;display:inline-flex;align-items:center;justify-content:center;padding:0 24px;}
        .input-f{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;padding:14px 16px;width:100%;font-family:Inter,sans-serif;font-size:15px;outline:none;transition:border-color 0.2s;appearance:none}
        .input-f:focus{border-color:#FF7A29}
        .input-f::placeholder{color:rgba(255,255,255,0.3)}
        .input-f option{background:#0F2247;color:#fff}
        .tscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:16px}
        .dtable{width:100%;border-collapse:collapse;min-width:560px}
        .dtable th{background:rgba(255,122,41,0.12);color:rgba(255,255,255,0.55);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;padding:12px 14px;text-align:left;font-family:Inter,sans-serif}
        .dtable td{padding:14px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:14px}
        .grid-2{display:grid;grid-template-columns:1fr;gap:14px}
        .grid-3{display:grid;grid-template-columns:1fr;gap:14px}
        .grid-4{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .nav-links{display:none}
        .ham{display:flex}
        .bot-cta{display:flex}
        
        @media(min-width:768px){
          .wrap{padding:0 28px}.section{padding:60px 0}.h1{font-size:56px}.grid-2{grid-template-columns:repeat(2,1fr);gap:24px}.grid-3{grid-template-columns:repeat(2,1fr);gap:20px}.grid-4{grid-template-columns:repeat(3,1fr)}
        }
        @media(min-width:1024px){
          .section{padding:80px 0}.h1{font-size:80px}.grid-3{grid-template-columns:repeat(3,1fr)}.grid-4{grid-template-columns:repeat(4,1fr)}.nav-links{display:flex!important;align-items:center;gap:20px}.ham{display:none!important}.bot-cta{display:none!important}
        }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <Navbar active="teams" />

      <main style={{paddingBottom:'96px'}}>
        <div style={{background:`linear-gradient(135deg,#0A1628,${teamColor} 150%)`,padding:'48px 16px'}}>
          <div className="wrap">
            <a href="#" style={{color:'#FF7A29',fontSize:13,textDecoration:'none',fontWeight:600,display:'inline-flex',alignItems:'center',gap:4,marginBottom:24}}>← All Teams</a>
            
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:16}}>
              <div style={{width:64,height:64,borderRadius:'50%',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,boxShadow:'0 8px 24px rgba(0,0,0,0.2)'}}>🏏</div>
              
              <div>
                <h1 className="h1" style={{fontSize:40,marginBottom:8}}>DELHI DYNAMOS</h1>
                <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                  <span style={{color:'rgba(255,255,255,0.7)',fontSize:14}}>🏙️ Delhi | GROUP A</span>
                  <span style={{background:'rgba(46,158,79,0.2)',color:'#2E9E4F',padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,border:'1px solid rgba(46,158,79,0.3)'}}>SEASON 5 ACTIVE</span>
                </div>
              </div>
            </div>

            <div style={{display:'flex',gap:12,marginTop:32,flexWrap:'wrap'}}>
              <div className="glass" style={{padding:'8px 16px',borderRadius:20,fontSize:13,fontWeight:600}}>🏆 Group A Leaders</div>
              <div className="glass" style={{padding:'8px 16px',borderRadius:20,fontSize:13,fontWeight:600}}>⭐ 12 Points</div>
              <div className="glass" style={{padding:'8px 16px',borderRadius:20,fontSize:13,fontWeight:600}}>🏏 8 Matches</div>
            </div>
          </div>
        </div>

        <div className="section wrap">
          <h2 className="h2" style={{marginBottom:24,fontSize:20,letterSpacing:'0.05em'}}>SQUAD ROSTER</h2>
          <div className="grid-4">
            {players.map((p,i) => (
              <div key={i} className="glass" style={{padding:16,display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:48,height:48,borderRadius:'50%',background:teamColor,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:18,color:'#fff',flexShrink:0}}>
                  {p.inits}
                </div>
                <div>
                  <div style={{fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:15,color:'#fff',marginBottom:4,lineHeight:1.1}}>{p.name}</div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{background:getRoleColor(p.role),color:'#fff',fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4,letterSpacing:'0.05em'}}>{p.role}</span>
                    <span style={{fontSize:12,color:'rgba(255,255,255,0.5)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.company} · {p.loc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section wrap" style={{paddingTop:0}}>
          <h2 className="h2" style={{marginBottom:24,fontSize:20,letterSpacing:'0.05em'}}>TEAM STATS</h2>
          <div className="glass tscroll">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Matches</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Points</th>
                  <th>NRR</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>8</td>
                  <td>6</td>
                  <td>2</td>
                  <td style={{fontWeight:700,color:'#FF7A29'}}>12</td>
                  <td style={{color:'#2E9E4F'}}>+1.24</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <Footer />

      <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:199,padding:'10px 16px 16px',background:'rgba(6,16,30,0.98)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(255,255,255,0.08)',gap:10}}>
        <button className="btn-primary" style={{flex:2,height:50,fontSize:15}}>Register ₹299 →</button>
        <button className="btn-wa" style={{flex:1,height:50,fontSize:14,borderRadius:12}}>💬 WhatsApp</button>
      </div>
    </div>
  );
}
