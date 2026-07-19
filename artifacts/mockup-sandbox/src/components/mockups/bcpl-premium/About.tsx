import React from 'react';

function Navbar({active=''}) {
  const [open,setOpen]=React.useState(false);
  const links=[['Home','home'],['Match Center','matchcenter'],['Teams','teams'],['About','about']];
  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(10,22,40,0.97)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 2px 0 0 rgba(255,122,41,0.2)'}}>
        <div className="wrap" style={{height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:3}}>T20</span></div>
          <div className="nav-links">{links.map(([l,k])=><a key={k} href="#" style={{color:active===k?'#FF7A29':'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',borderBottom:active===k?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2}}>{l}</a>)}<button className="btn-primary" style={{padding:'9px 20px',fontSize:13.5,borderRadius:10,minHeight:40}}>Register ₹299</button></div>
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

function MobileCTA() {
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:199,padding:'10px 16px 16px',background:'rgba(6,16,30,0.98)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(255,255,255,0.08)',gap:10}}>
      <button className="btn-primary" style={{flex:2,height:50,fontSize:15}}>Register ₹299 →</button>
      <button className="btn-wa" style={{flex:1,height:50,fontSize:14,borderRadius:12}}>💬 WhatsApp</button>
    </div>
  );
}

export function About() {
  const style = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@700;800;900&display=swap');
    .wrap{max-width:1200px;margin:0 auto;padding:0 16px}
    .section{padding:40px 0}
    .h1{font-family:Montserrat,sans-serif;font-weight:900;font-size:36px;line-height:1.05}
    .h2{font-family:Montserrat,sans-serif;font-weight:800;font-size:22px}
    .glass{background:rgba(15,34,71,0.7);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.10);border-radius:16px}
    .btn-primary{background:linear-gradient(135deg,#FF7A29,#E8611A);border:none;border-radius:12px;color:#fff;font-weight:700;font-family:Montserrat,sans-serif;cursor:pointer;box-shadow:0 6px 24px rgba(255,122,41,0.4);transition:transform 0.15s;min-height:48px;display:inline-flex;align-items:center;justify-content:center}
    .btn-primary:active{transform:scale(0.97)}
    .btn-wa{background:#2E9E4F;border:none;border-radius:12px;color:#fff;font-weight:700;cursor:pointer;min-height:48px;display:inline-flex;align-items:center;justify-content:center}
    .input-f{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;padding:14px 16px;width:100%;font-family:Inter,sans-serif;font-size:15px;outline:none;transition:border-color 0.2s;appearance:none}
    .input-f:focus{border-color:#FF7A29}
    .input-f::placeholder{color:rgba(255,255,255,0.3)}
    .input-f option{background:#0F2247;color:#fff}
    .tscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:16px}
    .tscroll::-webkit-scrollbar{display:none;}
    .dtable{width:100%;border-collapse:collapse;min-width:560px}
    .dtable th{background:rgba(255,122,41,0.12);color:rgba(255,255,255,0.55);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;padding:12px 14px;text-align:left;font-family:Inter,sans-serif}
    .dtable td{padding:14px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:14px}
    .grid-2{display:grid;grid-template-columns:1fr;gap:14px}
    .grid-3{display:grid;grid-template-columns:1fr;gap:14px}
    .grid-4{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
    .nav-links{display:none}
    .ham{display:flex}
    .bot-cta{display:flex}
    @media(min-width:768px){.wrap{padding:0 28px}.section{padding:60px 0}.h1{font-size:56px}.grid-2{grid-template-columns:repeat(2,1fr);gap:24px}.grid-3{grid-template-columns:repeat(2,1fr);gap:20px}.grid-4{grid-template-columns:repeat(4,1fr)}}
    @media(min-width:1024px){.section{padding:80px 0}.h1{font-size:80px}.grid-3{grid-template-columns:repeat(3,1fr)}.nav-links{display:flex!important;align-items:center;gap:20px}.ham{display:none!important}.bot-cta{display:none!important}}
    body { font-family: Inter, sans-serif; margin: 0; }
  `;

  return (
    <div style={{background:'#0A1628', color:'#fff', minHeight:'100vh', paddingBottom:96}}>
      <style>{style}</style>
      <Navbar active="about" />
      
      {/* Hero */}
      <div style={{height:280, background:'linear-gradient(160deg,#0A1628,#0F2247)', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'0 20px', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <div>
          <div style={{color:'#FF7A29', fontWeight:700, fontSize:14, marginBottom:16, letterSpacing:'0.05em', textTransform:'uppercase'}}>#OfficeSeStadiumtak</div>
          <h1 className="h1" style={{marginBottom:16}}>ABOUT BCPL T20</h1>
          <p style={{fontSize:18, color:'rgba(255,255,255,0.8)', marginBottom:24}}>Relive the dream. Rediscover the thrill.</p>
          <div style={{display:'inline-flex', alignItems:'center', background:'rgba(255,255,255,0.05)', padding:'6px 16px', borderRadius:20, fontSize:12, color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)'}}>
            Est. 2020 · Kriparti Playing11 Pvt. Ltd.
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="section" style={{paddingBottom:0}}>
        <div className="wrap" style={{maxWidth:800, textAlign:'center'}}>
          <blockquote style={{fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:22, lineHeight:1.5, color:'rgba(255,255,255,0.9)', margin:0, marginBottom:32}}>
            "At BCPL T20, we believe team sports are more than just a game — they teach valuable life skills, such as teamwork, leadership, and perseverance that resonate with every corporate professional."
          </blockquote>
          <p style={{fontFamily:'Inter,sans-serif', fontSize:16, lineHeight:1.8, color:'rgba(255,255,255,0.7)'}}>
            BCPL is a T20 cricket tournament built exclusively for corporate employees and working professionals across India. A chance to step off the office floor and onto a real cricket stage. Conceptualised by Kriparti Playing11 Private Limited, BCPL has grown from 3 seasons to become the world's largest corporate cricket league.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{background:'#06101E', padding:'32px 0', marginTop:60}}>
        <div className="wrap">
          <div className="grid-4" style={{textAlign:'center'}}>
            <div>
              <div style={{fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:32, color:'#E8B23D', marginBottom:4}}>5,000+</div>
              <div style={{fontSize:13, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600}}>Players</div>
            </div>
            <div>
              <div style={{fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:32, color:'#FF7A29', marginBottom:4}}>200+</div>
              <div style={{fontSize:13, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600}}>Teams</div>
            </div>
            <div>
              <div style={{fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:32, color:'#E8B23D', marginBottom:4}}>10</div>
              <div style={{fontSize:13, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600}}>Cities</div>
            </div>
            <div>
              <div style={{fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:32, color:'#FF7A29', marginBottom:4}}>5</div>
              <div style={{fontSize:13, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600}}>Seasons</div>
            </div>
          </div>
        </div>
      </div>

      {/* What we provide */}
      <div className="section">
        <div className="wrap">
          <h2 className="h2" style={{textAlign:'center', marginBottom:40}}>WHAT WE PROVIDE</h2>
          <div className="grid-3">
            <div className="glass" style={{padding:32, textAlign:'center'}}>
              <div style={{fontSize:48, marginBottom:20}}>🎽</div>
              <h3 style={{fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:18, marginBottom:12}}>Real Kit & Jersey</h3>
              <p style={{fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.6}}>Every selected player receives official BCPL kit, jersey and bag — at zero cost to you.</p>
            </div>
            <div className="glass" style={{padding:32, textAlign:'center'}}>
              <div style={{fontSize:48, marginBottom:20}}>🏟️</div>
              <h3 style={{fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:18, marginBottom:12}}>Stadium-Grade Grounds</h3>
              <p style={{fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.6}}>We play on real cricket stadiums equipped with international-standard facilities across 10 cities.</p>
            </div>
            <div className="glass" style={{padding:32, textAlign:'center'}}>
              <div style={{fontSize:48, marginBottom:20}}>👨‍🏫</div>
              <h3 style={{fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:18, marginBottom:12}}>Expert Coaching</h3>
              <p style={{fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.6}}>BCCI-certified coaches assess, guide and develop every player through the season.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Journey */}
      <div className="section" style={{background:'rgba(255,255,255,0.02)'}}>
        <div className="wrap" style={{maxWidth:600}}>
          <h2 className="h2" style={{textAlign:'center', marginBottom:40}}>OUR STORY SO FAR</h2>
          
          <div style={{position:'relative', paddingLeft:32}}>
            <div style={{position:'absolute', top:8, bottom:0, left:7, width:2, background:'rgba(255,122,41,0.2)'}}></div>
            
            {[
              { year: '2020', desc: 'Founded by Kriparti Playing11. First ever corporate cricket league in India.' },
              { year: '2021', desc: 'Season 2: 500+ registrations, 5 cities.' },
              { year: '2022', desc: 'Season 3: Expanded to 8 cities. Delhi vs Gujarat final.' },
              { year: '2023', desc: 'Season 4: First ever player auction! 10 franchises. 2,000+ players.' },
              { year: '2025', desc: 'Season 5: 5,000+ players. 10 cities. Biggest season yet.' }
            ].map((item, i) => (
              <div key={i} style={{position:'relative', marginBottom:32}}>
                <div style={{position:'absolute', top:4, left:-29, width:10, height:10, borderRadius:'50%', background:'#FF7A29', boxShadow:'0 0 0 4px rgba(10,22,40,1)'}}></div>
                <div style={{fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:20, color:'#E8B23D', marginBottom:8}}>{item.year}</div>
                <div style={{fontSize:15, color:'rgba(255,255,255,0.7)', lineHeight:1.5}}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Cards */}
      <div className="section">
        <div className="wrap">
          <h2 className="h2" style={{textAlign:'center', marginBottom:40}}>LEADERSHIP</h2>
          <div className="grid-3">
            {[1,2,3].map(i => (
              <div key={i} className="glass" style={{padding:24, display:'flex', gap:16, alignItems:'center'}}>
                <div style={{width:56, height:56, borderRadius:'50%', background:'#FF7A29', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'#fff', flexShrink:0}}>
                  KP
                </div>
                <div>
                  <div style={{fontWeight:700, fontSize:16, marginBottom:4}}>Founder Name | Kriparti Playing11</div>
                  <div style={{fontSize:12, color:'#FF7A29', fontWeight:600, marginBottom:4}}>Founder & CEO</div>
                  <div style={{fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.4}}>7+ years organizing corporate cricket. Visionary behind BCPL.</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section" style={{textAlign:'center', paddingBottom:80}}>
        <div className="wrap" style={{maxWidth:600}}>
          <div style={{fontSize:20, fontWeight:700, marginBottom:24}}>Join 5,000+ professionals. Register for Season 5 — ₹299 only.</div>
          <button className="btn-primary" style={{width:'100%', maxWidth:400, height:52, fontSize:16, borderRadius:14}}>Register Now →</button>
        </div>
      </div>

      <Footer />
      <MobileCTA />
    </div>
  );
}
