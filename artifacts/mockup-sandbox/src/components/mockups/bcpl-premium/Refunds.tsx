import React from 'react';

const css = `
.wrap{max-width:1200px;margin:0 auto;padding:0 16px}
.section{padding:40px 0}
.h1{font-family:Montserrat,sans-serif;font-weight:900;font-size:36px;line-height:1.05}
.h2{font-family:Montserrat,sans-serif;font-weight:800;font-size:22px}
.glass{background:rgba(15,34,71,0.7);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.10);border-radius:16px}
.btn-primary{background:linear-gradient(135deg,#FF7A29,#E8611A);border:none;border-radius:12px;color:#fff;font-weight:700;font-family:Montserrat,sans-serif;cursor:pointer;box-shadow:0 6px 24px rgba(255,122,41,0.4);transition:transform 0.15s;min-height:48px}
.btn-primary:active{transform:scale(0.97)}
.btn-wa{background:#2E9E4F;border:none;border-radius:12px;color:#fff;font-weight:700;cursor:pointer;min-height:48px}
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
.grid-2-3{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.toc-sidebar{display:none}
@media(min-width:768px){.wrap{padding:0 28px}.section{padding:60px 0}.h1{font-size:56px}.grid-2{grid-template-columns:repeat(2,1fr);gap:24px}.grid-3{grid-template-columns:repeat(2,1fr);gap:20px}.grid-4{grid-template-columns:repeat(4,1fr)}.grid-2-3{grid-template-columns:repeat(3,1fr)}}
@media(min-width:1024px){.section{padding:80px 0}.h1{font-size:80px}.grid-3{grid-template-columns:repeat(3,1fr)}.nav-links{display:flex!important;align-items:center;gap:20px}.ham{display:none!important}.bot-cta{display:none!important}.toc-sidebar{display:block}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.doc-h2 { font-family: Montserrat, sans-serif; font-weight: 800; font-size: 22px; color: #0F2247; margin-top: 40px; padding-top: 40px; border-top: 1px solid rgba(20,32,63,0.1); margin-bottom: 16px; }
.doc-h3 { font-family: Inter, sans-serif; font-weight: 700; font-size: 14px; color: #FF7A29; text-transform: uppercase; letter-spacing: 0.08em; margin: 24px 0 12px; }
.doc-p { font-family: Inter, sans-serif; font-size: 16px; line-height: 1.8; color: #14203F; margin-bottom: 16px; }
.doc-ul { padding-left: 20px; margin-bottom: 16px; }
.doc-li { padding: 4px 0; font-family: Inter, sans-serif; font-size: 16px; line-height: 1.8; color: #14203F; }
.highlight-box { background: rgba(255,122,41,0.08); border-left: 4px solid #FF7A29; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #14203F; font-family: Inter, sans-serif; font-size: 16px; line-height: 1.8; }
.hero-title { font-family: Montserrat, sans-serif; font-weight: 900; font-size: 32px; color: #fff; line-height: 1.2; margin-bottom: 8px; text-transform: uppercase; text-align: center; }
.hero-subtitle { font-family: Inter, sans-serif; font-size: 18px; color: rgba(255,255,255,0.8); text-align: center; }
.hero-meta { font-family: Inter, sans-serif; font-size: 14px; color: #FF7A29; font-weight: 600; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }
.toc-link { display: block; color: rgba(255,255,255,0.7); font-family: Inter, sans-serif; font-size: 14px; text-decoration: none; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
.toc-link:last-child { border-bottom: none; }
.toc-link:hover { color: #FF7A29; }
`;

function Navbar({active=''}) {
  const [open,setOpen]=React.useState(false);
  const links=[['Home','home'],['Match Center','matchcenter'],['Teams','teams'],['About','about']];
  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(10,22,40,0.97)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 2px 0 0 rgba(255,122,41,0.2)'}}>
        <div className="wrap" style={{height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:3}}>T20</span></div>
          <div className="nav-links">{links.map(([l,k])=><a key={k} href="#" style={{color:active===k?'#FF7A29':'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',borderBottom:active===k?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2}}>{l}</a>)}<button className="btn-primary" style={{padding:'9px 20px',fontSize:13.5,borderRadius:10,minHeight:'auto'}}>Register ₹299</button></div>
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

export function Refunds() {
  return (
    <div style={{ background: '#0A1628', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{css}</style>
      <Navbar />
      
      {/* Hero */}
      <div style={{ height: 200, background: 'linear-gradient(160deg, #0A1628, #0F2247)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 16px' }}>
        <h1 className="hero-title">REFUND POLICY</h1>
        <div className="hero-subtitle">Transparent and fair cancellation terms</div>
        <div className="hero-meta">Last updated: June 2025</div>
      </div>

      {/* Content Area */}
      <div style={{ background: '#FAF8F4', flex: 1 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 16px' }}>
          
          <div className="highlight-box" style={{ marginTop: 0 }}>
            BCPL's ₹299/₹399 registration fee is a trial entry fee — not a tournament or auction fee. It covers the cost of organizing trials, scouting, and shortlisting.
          </div>

          <h2 className="doc-h2" style={{ marginTop: 24 }}>1. Full Refund</h2>
          <p className="doc-p">Cancellation within 7 days of registration AND before video upload: 100% refund within 7 business days.</p>

          <h2 className="doc-h2">2. No Refund</h2>
          <p className="doc-p">After video upload: Registration fee is non-refundable, regardless of selection outcome.</p>

          <h2 className="doc-h2">3. BCPL Cancellation</h2>
          <p className="doc-p">If BCPL cancels a trial due to unforeseen circumstances, a full refund is provided. Rescheduled trials do not qualify for refund.</p>

          <h2 className="doc-h2">4. How to Cancel</h2>
          <p className="doc-p">Email cancellations@bcplt20.com or WhatsApp +91 98765 43210 within the eligible window with your registered phone number and reason.</p>

          <h2 className="doc-h2">5. Processing Time</h2>
          <p className="doc-p">Approved refunds are processed within 7 business days to the original payment method.</p>

          <h2 className="doc-h2">6. Not Refundable</h2>
          <p className="doc-p">Non-selection, change of mind after video upload, failure to attend trial, or code of conduct violations.</p>

          <h2 className="doc-h2">7. Disputes</h2>
          <p className="doc-p">Refund disputes must be raised within 30 days of the registration date. Email disputes@bcplt20.com.</p>

          <h2 className="doc-h2">Refund Scenarios</h2>
          <div className="tscroll" style={{ marginBottom: 24, background: '#fff', border: '1px solid rgba(20,32,63,0.1)', borderRadius: 12, overflow: 'hidden' }}>
            <table className="dtable" style={{ color: '#14203F' }}>
              <thead>
                <tr>
                  <th style={{ background: 'rgba(20,32,63,0.05)', color: '#0F2247' }}>Scenario</th>
                  <th style={{ background: 'rgba(20,32,63,0.05)', color: '#0F2247' }}>Refund</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ borderBottom: '1px solid rgba(20,32,63,0.05)' }}>Within 7 days, no video uploaded</td>
                  <td style={{ borderBottom: '1px solid rgba(20,32,63,0.05)' }}>✅ Full refund</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid rgba(20,32,63,0.05)' }}>After 7 days, no video uploaded</td>
                  <td style={{ borderBottom: '1px solid rgba(20,32,63,0.05)' }}>❌ No refund</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid rgba(20,32,63,0.05)' }}>Video uploaded</td>
                  <td style={{ borderBottom: '1px solid rgba(20,32,63,0.05)' }}>❌ No refund</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid rgba(20,32,63,0.05)' }}>BCPL cancels trial</td>
                  <td style={{ borderBottom: '1px solid rgba(20,32,63,0.05)' }}>✅ Full refund</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: 'none' }}>Not selected</td>
                  <td style={{ borderBottom: 'none' }}>❌ No refund (selection is merit-based)</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
