import React from 'react';

const commonStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
.wrap{max-width:1200px;margin:0 auto;padding:0 16px}
.section{padding:40px 0}
.h1{font-family:'Montserrat',sans-serif;font-weight:900;font-size:36px;line-height:1.05;color:#fff}
.h2{font-family:'Montserrat',sans-serif;font-weight:800;font-size:22px;color:#fff}
.glass{background:rgba(15,34,71,0.7);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.10);border-radius:16px}
.btn-primary{background:linear-gradient(135deg,#FF7A29,#E8611A);border:none;border-radius:12px;color:#fff;font-weight:700;font-family:'Montserrat',sans-serif;cursor:pointer;box-shadow:0 6px 24px rgba(255,122,41,0.4);transition:transform 0.15s;min-height:48px;display:inline-flex;align-items:center;justify-content:center}
.btn-primary:active{transform:scale(0.97)}
.btn-wa{background:#2E9E4F;border:none;border-radius:12px;color:#fff;font-weight:700;cursor:pointer;min-height:48px;display:inline-flex;align-items:center;justify-content:center}
.input-f{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;padding:14px 16px;width:100%;font-family:'Inter',sans-serif;font-size:15px;outline:none;transition:border-color 0.2s;appearance:none}
.input-f:focus{border-color:#FF7A29}
.input-f::placeholder{color:rgba(255,255,255,0.3)}
.input-f option{background:#0F2247;color:#fff}
.tscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:16px;background:rgba(15,34,71,0.7);border:1px solid rgba(255,255,255,0.10)}
.dtable{width:100%;border-collapse:collapse;min-width:560px}
.dtable th{background:rgba(255,122,41,0.12);color:rgba(255,255,255,0.55);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;padding:12px 14px;text-align:left;font-family:'Inter',sans-serif}
.dtable td{padding:14px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:14px;color:#fff;font-family:'Inter',sans-serif}
.grid-2{display:grid;grid-template-columns:1fr;gap:14px}
.grid-3{display:grid;grid-template-columns:1fr;gap:14px}
.grid-4{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.nav-links{display:none}
.ham{display:flex}
.bot-cta{display:flex}
@media(min-width:768px){.wrap{padding:0 28px}.section{padding:60px 0}.h1{font-size:56px}.grid-2{grid-template-columns:repeat(2,1fr);gap:24px}.grid-3{grid-template-columns:repeat(3,1fr);gap:20px}.grid-4{grid-template-columns:repeat(4,1fr)}}
@media(min-width:1024px){.section{padding:80px 0}.h1{font-size:80px}.nav-links{display:flex!important;align-items:center;gap:20px}.ham{display:none!important}.bot-cta{display:none!important}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
`;

function Navbar({active=''}) {
  const [open,setOpen]=React.useState(false);
  const links=[['Home','home'],['Match Center','matchcenter'],['Teams','teams'],['About','about']];
  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(10,22,40,0.97)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 2px 0 0 rgba(255,122,41,0.2)'}}>
        <div className="wrap" style={{height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:3}}>T20</span></div>
          <div className="nav-links">{links.map(([l,k])=><a key={k} href="#" style={{color:active===k?'#FF7A29':'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',borderBottom:active===k?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2}}>{l}</a>)}<button className="btn-primary" style={{padding:'9px 20px',fontSize:13.5,borderRadius:10,minHeight:'36px'}}>Register ₹299</button></div>
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
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:13,lineHeight:1.7,marginBottom:8,maxWidth:280,fontFamily:'Inter,sans-serif'}}>Bharatiya Corporate Premier League — world\'s largest corporate cricket league for working professionals.</p>
            <p style={{color:'rgba(255,122,41,0.6)',fontSize:12,fontWeight:600,fontFamily:'Inter,sans-serif'}}>#OfficeSeStadiumtak</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,fontFamily:'Inter,sans-serif'}}>
            <div><div style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>League</div>{['Schedule','Match Center','Teams','Points Table','Photos','Videos'].map(l=><div key={l} style={{marginBottom:8}}><a href="#" style={{color:'rgba(255,255,255,0.55)',fontSize:13,textDecoration:'none'}}>{l}</a></div>)}</div>
            <div><div style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Info</div>{['About','FAQ','Contact','Terms','Privacy','Refunds','Eligibility'].map(l=><div key={l} style={{marginBottom:8}}><a href="#" style={{color:'rgba(255,255,255,0.55)',fontSize:13,textDecoration:'none'}}>{l}</a></div>)}</div>
          </div>
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:20,display:'flex',flexWrap:'wrap',gap:12,justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',gap:8}}>{['📸','▶️','🐦','📘'].map((ic,i)=><a key={i} href="#" style={{width:36,height:36,borderRadius:9,background:'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,textDecoration:'none',border:'1px solid rgba(255,255,255,0.07)'}}>{ic}</a>)}</div>
          <div style={{color:'rgba(255,255,255,0.28)',fontSize:11,fontFamily:'Inter,sans-serif'}}>© 2025 Kriparti Playing11 Pvt. Ltd.</div>
        </div>
      </div>
    </footer>
  );
}

export function MatchCenter() {
  return (
    <div style={{backgroundColor:'#0A1628',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#fff'}}>
      <style dangerouslySetInnerHTML={{__html: commonStyles}} />
      <Navbar active="matchcenter" />
      
      {/* Announcement Bar */}
      <div style={{background:'#FF7A29',color:'#fff',padding:'8px 16px',textAlign:'center',fontSize:'13px',fontWeight:700,fontFamily:'Inter,sans-serif'}}>
        <span style={{animation:'pulse 2s infinite'}}>🔴 LIVE COVERAGE</span> — Mumbai Mavericks vs Delhi Dynamos · SAT 26 JULY · 6PM IST
      </div>

      <div style={{paddingBottom:'96px'}}>
        {/* Hero area */}
        <section style={{background:'linear-gradient(160deg,#0A1628,#0F2247)',padding:'24px 0'}}>
          <div className="wrap">
            <div className="glass" style={{boxShadow:'0 0 20px rgba(232,178,61,0.15)',border:'1px solid rgba(232,178,61,0.3)',padding:'24px 20px',display:'flex',flexDirection:'column',gap:'20px'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
                <span style={{background:'rgba(15,34,71,0.9)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'20px',padding:'4px 12px',fontSize:'11px',fontWeight:700,color:'#4da8da',letterSpacing:'0.05em'}}>NEXT MATCH</span>
                <span style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',fontWeight:500}}>🏟️ DY Patil Stadium, Mumbai</span>
              </div>
              
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'20px',color:'#fff'}}>Mumbai Mavericks</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>Mumbai</div>
                </div>
                
                <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'50%',width:'36px',height:'36px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'14px',color:'#E8B23D',fontFamily:'Montserrat,sans-serif'}}>
                  VS
                </div>

                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'20px',color:'#fff'}}>Delhi Dynamos</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>Delhi</div>
                </div>
              </div>

              <div style={{textAlign:'center',color:'#FF7A29',fontSize:'14px',fontWeight:600}}>
                📅 SAT, 26 JULY 2025 · 6:00 PM IST
              </div>

              <div style={{display:'flex',justifyContent:'center',gap:'8px',flexWrap:'wrap'}}>
                {['3 DAYS', '14 HRS', '22 MIN', '45 SEC'].map((t,i) => (
                  <span key={i} className="glass" style={{padding:'6px 12px',fontSize:'12px',fontWeight:700,color:'#fff'}}>{t}</span>
                ))}
              </div>

              <button className="glass" style={{color:'#fff',height:'44px',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'12px',fontWeight:600,fontSize:'15px',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                Set Reminder →
              </button>
            </div>
          </div>
        </section>

        {/* Recent Results */}
        <section className="section" style={{paddingTop:'24px',paddingBottom:'24px'}}>
          <div className="wrap">
            <h2 className="h2" style={{marginBottom:'20px'}}>Recent Results</h2>
            <div className="grid-3">
              {[
                { teams: 'DEL vs BLR', result: 'DELHI WON by 34 runs', score: '142/8 (20.0) vs 108 all out (18.3)', date: 'Sat Jul 5 · DY Patil' },
                { teams: 'MUM vs CHE', result: 'MUMBAI WON by 6 wkts', score: '139/4 (19.2) vs 138/9 (20.0)', date: 'Sun Jul 6 · Wankhede' },
                { teams: 'HYD vs KOL', result: 'HYDERABAD WON by 2 wkts', score: '134/8 (19.5) vs 132/7 (20.0)', date: 'Sat Jul 12 · Eden Gardens' }
              ].map((m, i) => (
                <div key={i} className="glass" style={{padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{background:'rgba(255,255,255,0.1)',padding:'2px 8px',borderRadius:'10px',fontSize:'10px',fontWeight:700,color:'rgba(255,255,255,0.6)'}}>FINAL</span>
                    <span style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',fontWeight:500}}>{m.date}</span>
                  </div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'16px'}}>{m.teams}</div>
                  <div style={{color:'#2E9E4F',fontSize:'13px',fontWeight:700}}>{m.result}</div>
                  <div style={{color:'rgba(255,255,255,0.5)',fontSize:'12px'}}>{m.score}</div>
                  <a href="#" style={{color:'#FF7A29',fontSize:'12px',textDecoration:'none',fontWeight:600,marginTop:'4px'}}>Full Scorecard →</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sample Scorecard */}
        <section className="section" style={{paddingTop:'16px',paddingBottom:'40px'}}>
          <div className="wrap">
            <div className="glass" style={{padding:'24px',display:'flex',flexDirection:'column',gap:'20px'}}>
              <div>
                <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'18px',marginBottom:'4px'}}>📊 SAMPLE LIVE SCORECARD</h3>
                <div style={{fontSize:'14px',color:'rgba(255,255,255,0.6)'}}>Delhi Dynamos vs Bangalore Bulls</div>
              </div>

              <div className="tscroll">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>BATTING</th>
                      <th>R</th>
                      <th>B</th>
                      <th>4s</th>
                      <th>6s</th>
                      <th>SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Rohit Sharma*</td>
                      <td style={{fontWeight:700}}>45</td>
                      <td>38</td>
                      <td>3</td>
                      <td>1</td>
                      <td>118.4</td>
                    </tr>
                    <tr>
                      <td>Vikas Gupta</td>
                      <td style={{fontWeight:700}}>32</td>
                      <td>28</td>
                      <td>4</td>
                      <td>0</td>
                      <td>114.3</td>
                    </tr>
                    <tr>
                      <td>Karan Mehta</td>
                      <td style={{fontWeight:700}}>18</td>
                      <td>15</td>
                      <td>2</td>
                      <td>0</td>
                      <td>120.0</td>
                    </tr>
                    <tr style={{background:'rgba(255,255,255,0.02)'}}>
                      <td style={{fontWeight:600,color:'rgba(255,255,255,0.5)'}}>EXTRAS</td>
                      <td colSpan={5} style={{fontWeight:700}}>10</td>
                    </tr>
                    <tr style={{background:'rgba(255,122,41,0.05)'}}>
                      <td colSpan={6} style={{fontSize:'13px'}}>
                        <span style={{fontWeight:700,color:'#FF7A29',marginRight:'12px'}}>TOTAL: 142/8 (20.0 overs)</span>
                        <span style={{color:'rgba(255,255,255,0.6)',marginRight:'12px'}}>RRR: —</span>
                        <span style={{color:'rgba(255,255,255,0.6)'}}>CRR: 7.10</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="tscroll">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>BOWLING</th>
                      <th>O</th>
                      <th>M</th>
                      <th>R</th>
                      <th>W</th>
                      <th>Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>A. Kumar</td>
                      <td>4</td>
                      <td>0</td>
                      <td>28</td>
                      <td style={{fontWeight:700,color:'#E8493F'}}>2</td>
                      <td>7.00</td>
                    </tr>
                    <tr>
                      <td>S. Reddy</td>
                      <td>4</td>
                      <td>1</td>
                      <td>22</td>
                      <td style={{fontWeight:700,color:'#E8493F'}}>3</td>
                      <td>5.50</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',padding:'8px',background:'rgba(255,255,255,0.05)',borderRadius:'8px'}}>
                <span style={{fontWeight:600,color:'#fff'}}>Fall of Wickets:</span> 1-45 (2.4 ov), 2-78 (8.1 ov), 3-95 (11.2 ov)...
              </div>

              <button className="btn-primary" style={{width:'100%',height:'52px',fontSize:'16px'}}>
                View All Matches →
              </button>
            </div>
          </div>
        </section>
      </div>

      <Footer />

      <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:199,padding:'10px 16px 16px',background:'rgba(6,16,30,0.98)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(255,255,255,0.08)',gap:10}}>
        <button className="btn-primary" style={{flex:2,height:50,fontSize:15}}>Register ₹299 →</button>
        <button className="btn-wa" style={{flex:1,height:50,fontSize:14,borderRadius:12}}>💬 WhatsApp</button>
      </div>
    </div>
  );
}
