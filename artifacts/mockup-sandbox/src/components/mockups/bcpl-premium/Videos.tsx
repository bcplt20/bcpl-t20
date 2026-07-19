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

export function Videos() {
  const videos = [
    { title: "Join us in welcoming Ahmedabad Lions for Season 4 of #BCPL", date: "Nov 12, 2025", views: "24K", dur: "2:34" },
    { title: "Lucknow ke Nawab aa gaye hain! 🔥", date: "Nov 12, 2025", views: "18K", dur: "1:45" },
    { title: "Punjab de Warriors are ready to take charge! 🔥", date: "Nov 12, 2025", views: "15K", dur: "1:22" },
    { title: "Introducing the Mumbai Mavericks — Season 4! 🙌", date: "Nov 12, 2025", views: "22K", dur: "2:01" },
    { title: "BCPL Season 5 — Grand Opening Ceremony", date: "Jul 2025", views: "45K", dur: "45:10" },
    { title: "Delhi Dynamos vs Bangalore Bulls — Match Highlights", date: "Jul 5, 2025", views: "31K", dur: "12:30" },
    { title: "Player Auction Season 4 — Full Highlights 🏏", date: "Nov 2024", views: "67K", dur: "1:15:00" },
    { title: "Season 3 Grand Final — Last Over Thriller!", date: "Apr 2024", views: "89K", dur: "8:45" }
  ];

  const filters = ['All', 'Season 5', 'Team Announcements', 'Highlights', 'Behind the Scenes'];

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
        
        .vid-card{transition:transform 0.2s; cursor:pointer;}
        .vid-card:hover{transform:translateY(-4px);}
        .thumb{height:180px;background:linear-gradient(135deg,#0F2247,#1a3a6e);position:relative;display:flex;align-items:center;justify-content:center;}
        .play-btn{width:60px;height:60px;background:rgba(255,122,41,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;padding-left:4px;}
        
        @media(min-width:768px){
          .wrap{padding:0 28px}.section{padding:60px 0}.h1{font-size:56px}.grid-2{grid-template-columns:repeat(2,1fr);gap:24px}.grid-3{grid-template-columns:repeat(2,1fr);gap:20px}.grid-4{grid-template-columns:repeat(4,1fr)}
        }
        @media(min-width:1024px){
          .section{padding:80px 0}.h1{font-size:80px}.grid-3{grid-template-columns:repeat(3,1fr)}.nav-links{display:flex!important;align-items:center;gap:20px}.ham{display:none!important}
        }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <Navbar active="about" />

      <main style={{paddingBottom:'40px'}}>
        <div style={{padding:'60px 0',textAlign:'center'}}>
          <div className="wrap">
            <h1 className="h1" style={{marginBottom:16}}>▶️ VIDEOS</h1>
            <p style={{color:'rgba(255,255,255,0.7)',fontSize:16,maxWidth:600,margin:'0 auto'}}>Team announcements, auction highlights and behind-the-scenes moments</p>
          </div>
        </div>

        <div className="wrap">
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:16,marginBottom:16,WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
            {filters.map((f,i) => (
              <button key={f} style={{background:i===0?'#FF7A29':'rgba(255,255,255,0.06)',color:i===0?'#fff':'rgba(255,255,255,0.7)',border:'none',padding:'8px 16px',borderRadius:20,fontSize:14,fontWeight:600,whiteSpace:'nowrap',cursor:'pointer'}}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="wrap section" style={{paddingTop:0}}>
          <div className="grid-3">
            {videos.map((vid,i) => (
              <div key={i} className="glass vid-card" style={{overflow:'hidden'}}>
                <div className="thumb">
                  <div className="play-btn">▶</div>
                  <div style={{position:'absolute',bottom:12,right:12,background:'rgba(10,22,40,0.8)',backdropFilter:'blur(4px)',padding:'4px 8px',borderRadius:6,fontSize:11,fontWeight:700}}>{vid.dur}</div>
                </div>
                <div style={{padding:16}}>
                  <div style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:8}}>
                    <span style={{background:'rgba(255,122,41,0.15)',color:'#FF7A29',fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4,flexShrink:0}}>#BCPL</span>
                    <h3 style={{fontFamily:'Inter,sans-serif',fontWeight:700,fontSize:14,lineHeight:1.4}}>{vid.title}</h3>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12,color:'rgba(255,255,255,0.4)',fontSize:12}}>
                    <span>{vid.date}</span>
                    <span>•</span>
                    <span>{vid.views} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass" style={{marginTop:60,padding:'48px 24px',textAlign:'center',maxWidth:700,margin:'60px auto 0'}}>
            <h2 className="h2" style={{marginBottom:12}}>Subscribe to our YouTube channel for live updates & highlights</h2>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:15,marginBottom:28}}>Never miss a moment of the action.</p>
            <button style={{background:'#FF0000',color:'#fff',border:'none',height:48,padding:'0 24px',borderRadius:12,fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:15,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8}}>
              ▶️ Subscribe on YouTube
            </button>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
