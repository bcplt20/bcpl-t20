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

export function Sponsors() {
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
        .sp-box{background:rgba(255,255,255,0.05);border-radius:12px;display:flex;align-items:center;justifyContent:center;color:rgba(255,255,255,0.3);font-size:13px;text-align:center;}
        @media(min-width:768px){
          .wrap{padding:0 28px}.section{padding:60px 0}.h1{font-size:56px}.grid-2{grid-template-columns:repeat(2,1fr);gap:24px}.grid-3{grid-template-columns:repeat(2,1fr);gap:20px}.grid-4{grid-template-columns:repeat(4,1fr)}
          .sp-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        }
        @media(max-width:767px){
          .sp-grid-3{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        }
        @media(min-width:1024px){
          .section{padding:80px 0}.h1{font-size:80px}.grid-3{grid-template-columns:repeat(3,1fr)}.nav-links{display:flex!important;align-items:center;gap:20px}.ham{display:none!important}.bot-cta{display:none!important}
        }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <Navbar active="about" />

      <main style={{paddingBottom:'96px'}}>
        <div style={{padding:'60px 0',textAlign:'center'}}>
          <div className="wrap">
            <h1 className="h1" style={{marginBottom:16}}>OUR SPONSORS</h1>
            <p style={{color:'rgba(255,255,255,0.7)',fontSize:16,maxWidth:600,margin:'0 auto'}}>The brands powering India's biggest corporate cricket league.</p>
          </div>
        </div>

        <div className="wrap section" style={{paddingTop:0}}>
          
          <div className="glass" style={{padding:'40px 24px',textAlign:'center',marginBottom:32,background:'rgba(232,178,61,0.06)',borderColor:'rgba(232,178,61,0.3)'}}>
            <div style={{color:'#E8B23D',fontSize:13,fontWeight:700,letterSpacing:'0.1em',marginBottom:24}}>🏆 TITLE SPONSOR</div>
            <div style={{fontSize:15,color:'rgba(255,255,255,0.6)',marginBottom:16}}>BCPL T20 Presents</div>
            <div className="sp-box" style={{maxWidth:300,height:100,margin:'0 auto',marginBottom:24,border:'1px solid rgba(255,255,255,0.1)'}}>
              Title Sponsor Logo
            </div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:14}}>Powering Season 5 of the Bharatiya Corporate Premier League</div>
          </div>

          <div style={{marginBottom:48}}>
            <h3 style={{textAlign:'center',color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:700,letterSpacing:'0.1em',marginBottom:20}}>CO-PRESENTING SPONSORS</h3>
            <div className="grid-2">
              {[1,2].map(i => (
                <div key={i} className="glass" style={{padding:'32px 24px',textAlign:'center'}}>
                  <div className="sp-box" style={{height:80,marginBottom:16,border:'1px solid rgba(255,255,255,0.05)'}}>Co-Presenting Logo</div>
                  <div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>Co-Presenting Partner</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:48}}>
            <h3 style={{textAlign:'center',color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:700,letterSpacing:'0.1em',marginBottom:20}}>OFFICIAL SPONSORS</h3>
            <div className="sp-grid-3">
              {['Sport','Hydration','Nutrition','Travel','Tech','Media'].map((type,i) => (
                <div key={i} className="glass" style={{padding:'24px 16px',textAlign:'center'}}>
                  <div className="sp-box" style={{height:60,marginBottom:12}}>Logo</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>Official {type} Partner</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:60}}>
            <h3 style={{textAlign:'center',color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:700,letterSpacing:'0.1em',marginBottom:20}}>ASSOCIATE SPONSORS</h3>
            <div className="grid-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="glass" style={{padding:16,textAlign:'center'}}>
                  <div className="sp-box" style={{height:50}}>Partner Logo</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{padding:'48px 24px',textAlign:'center',maxWidth:800,margin:'0 auto'}}>
            <h2 className="h2" style={{marginBottom:16}}>Partner With BCPL T20</h2>
            <p style={{color:'rgba(255,255,255,0.7)',fontSize:15,marginBottom:32,lineHeight:1.6}}>Reach 5,000+ corporate professionals across 10 cities. National TV coverage. Unmatched social media exposure for your brand.</p>
            <button className="btn-primary" style={{marginBottom:24}}>Enquire About Sponsorship →</button>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:13}}>
              sponsors@bcplt20.com <span style={{margin:'0 8px'}}>|</span> +91 98765 43210
            </div>
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
