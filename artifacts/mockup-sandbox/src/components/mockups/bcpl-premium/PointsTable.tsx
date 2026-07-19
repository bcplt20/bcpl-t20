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

export function PointsTable() {
  const [activeTab, setActiveTab] = React.useState('Group A');
  const tabs = ['GROUP A', 'GROUP B'];

  return (
    <div style={{backgroundColor:'#0A1628',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#fff'}}>
      <style dangerouslySetInnerHTML={{__html: commonStyles}} />
      <Navbar active="pointstable" />
      
      <div style={{paddingBottom:'96px'}}>
        <section style={{padding:'40px 0 20px',textAlign:'center'}}>
          <div className="wrap">
            <h1 className="h1" style={{fontSize:'32px',marginBottom:'8px'}}>POINTS TABLE</h1>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:'16px',fontWeight:500}}>Season 5 Standings</div>
          </div>
        </section>

        {/* Group Tabs */}
        <div style={{position:'sticky',top:'60px',background:'rgba(10,22,40,0.9)',backdropFilter:'blur(20px)',zIndex:90,padding:'12px 0'}}>
          <div className="wrap" style={{display:'flex',gap:'8px'}}>
            {tabs.map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                className={activeTab === t ? 'btn-primary' : 'glass'}
                style={{
                  flex:1,
                  minHeight:0,
                  padding:'10px 16px',
                  borderRadius:'12px',
                  fontSize:'14px',
                  fontWeight:700,
                  color: activeTab === t ? '#fff' : 'rgba(255,255,255,0.7)',
                  border: activeTab === t ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: activeTab === t ? '0 4px 12px rgba(255,122,41,0.3)' : 'none',
                  cursor:'pointer'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <section className="section" style={{paddingTop:'24px'}}>
          <div className="wrap">
            
            {/* GROUP A */}
            <div style={{marginBottom:'40px', display: activeTab === 'GROUP A' ? 'block' : 'none'}}>
              <h3 style={{color:'#fff',fontWeight:800,fontSize:'16px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
                <span style={{display:'block',width:'12px',height:'12px',borderRadius:'50%',background:'#1565C0'}}></span>
                GROUP A
              </h3>
              
              <div className="tscroll" style={{marginBottom:'16px'}}>
                <table className="dtable">
                  <thead>
                    <tr>
                      <th style={{width:'32px'}}>#</th>
                      <th>TEAM</th>
                      <th>P</th>
                      <th>W</th>
                      <th>L</th>
                      <th>T/NR</th>
                      <th>PTS</th>
                      <th>NRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{background:'rgba(232,178,61,0.06)',borderLeft:'3px solid #E8B23D'}}>
                      <td>🏆</td>
                      <td style={{fontWeight:800}}><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#1565C0',marginRight:'8px'}}></span>Delhi Dynamos</td>
                      <td>8</td>
                      <td>6</td>
                      <td>2</td>
                      <td>0</td>
                      <td style={{fontWeight:800,color:'#E8B23D',fontSize:'16px'}}>12</td>
                      <td style={{color:'#2E9E4F'}}>+1.24</td>
                    </tr>
                    <tr>
                      <td style={{color:'rgba(255,255,255,0.5)'}}>2</td>
                      <td style={{fontWeight:600}}><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#C62828',marginRight:'8px'}}></span>Mumbai Mavericks</td>
                      <td>8</td>
                      <td>5</td>
                      <td>3</td>
                      <td>0</td>
                      <td style={{fontWeight:700,fontSize:'15px'}}>10</td>
                      <td style={{color:'#2E9E4F'}}>+0.87</td>
                    </tr>
                    <tr style={{background:'rgba(255,255,255,0.02)'}}>
                      <td colSpan={8} style={{padding:'8px 14px',fontSize:'11px',fontWeight:700,color:'rgba(255,255,255,0.4)',textAlign:'center',letterSpacing:'0.1em'}}>
                        — QUALIFIED FOR PLAYOFFS —
                      </td>
                    </tr>
                    <tr>
                      <td style={{color:'rgba(255,255,255,0.5)'}}>3</td>
                      <td style={{fontWeight:500}}><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#7B1FA2',marginRight:'8px'}}></span>Pune Panthers</td>
                      <td>8</td>
                      <td>4</td>
                      <td>4</td>
                      <td>0</td>
                      <td style={{fontWeight:600}}>8</td>
                      <td style={{color:'#2E9E4F'}}>+0.12</td>
                    </tr>
                    <tr>
                      <td style={{color:'rgba(255,255,255,0.5)'}}>4</td>
                      <td style={{fontWeight:500}}><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#424242',marginRight:'8px'}}></span>Kolkata Knights</td>
                      <td>8</td>
                      <td>3</td>
                      <td>5</td>
                      <td>0</td>
                      <td style={{fontWeight:600}}>6</td>
                      <td style={{color:'#E8493F'}}>-0.45</td>
                    </tr>
                    <tr>
                      <td style={{color:'rgba(255,255,255,0.5)'}}>5</td>
                      <td style={{fontWeight:500}}><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#FF6F00',marginRight:'8px'}}></span>Ahmedabad Lions</td>
                      <td>8</td>
                      <td>2</td>
                      <td>6</td>
                      <td>0</td>
                      <td style={{fontWeight:600}}>4</td>
                      <td style={{color:'#E8493F'}}>-1.78</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* GROUP B */}
            <div style={{marginBottom:'40px', display: activeTab === 'GROUP B' ? 'block' : 'none'}}>
              <h3 style={{color:'#fff',fontWeight:800,fontSize:'16px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
                <span style={{display:'block',width:'12px',height:'12px',borderRadius:'50%',background:'#E65100'}}></span>
                GROUP B
              </h3>
              
              <div className="tscroll" style={{marginBottom:'16px'}}>
                <table className="dtable">
                  <thead>
                    <tr>
                      <th style={{width:'32px'}}>#</th>
                      <th>TEAM</th>
                      <th>P</th>
                      <th>W</th>
                      <th>L</th>
                      <th>T/NR</th>
                      <th>PTS</th>
                      <th>NRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{background:'rgba(232,178,61,0.06)',borderLeft:'3px solid #E8B23D'}}>
                      <td>🏆</td>
                      <td style={{fontWeight:800}}><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#E65100',marginRight:'8px'}}></span>Bangalore Bulls</td>
                      <td>8</td>
                      <td>7</td>
                      <td>1</td>
                      <td>0</td>
                      <td style={{fontWeight:800,color:'#E8B23D',fontSize:'16px'}}>14</td>
                      <td style={{color:'#2E9E4F'}}>+1.85</td>
                    </tr>
                    <tr>
                      <td style={{color:'rgba(255,255,255,0.5)'}}>2</td>
                      <td style={{fontWeight:600}}><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#F9A825',marginRight:'8px'}}></span>Chennai Chiefs</td>
                      <td>8</td>
                      <td>5</td>
                      <td>3</td>
                      <td>0</td>
                      <td style={{fontWeight:700,fontSize:'15px'}}>10</td>
                      <td style={{color:'#2E9E4F'}}>+0.54</td>
                    </tr>
                    <tr style={{background:'rgba(255,255,255,0.02)'}}>
                      <td colSpan={8} style={{padding:'8px 14px',fontSize:'11px',fontWeight:700,color:'rgba(255,255,255,0.4)',textAlign:'center',letterSpacing:'0.1em'}}>
                        — QUALIFIED FOR PLAYOFFS —
                      </td>
                    </tr>
                    <tr>
                      <td style={{color:'rgba(255,255,255,0.5)'}}>3</td>
                      <td style={{fontWeight:500}}><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#2E7D32',marginRight:'8px'}}></span>Hyderabad Hawks</td>
                      <td>8</td>
                      <td>4</td>
                      <td>4</td>
                      <td>0</td>
                      <td style={{fontWeight:600}}>8</td>
                      <td style={{color:'#E8493F'}}>-0.11</td>
                    </tr>
                    <tr>
                      <td style={{color:'rgba(255,255,255,0.5)'}}>4</td>
                      <td style={{fontWeight:500}}><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#AD1457',marginRight:'8px'}}></span>Jaipur Jaguars</td>
                      <td>8</td>
                      <td>3</td>
                      <td>5</td>
                      <td>0</td>
                      <td style={{fontWeight:600}}>6</td>
                      <td style={{color:'#E8493F'}}>-0.78</td>
                    </tr>
                    <tr>
                      <td style={{color:'rgba(255,255,255,0.5)'}}>5</td>
                      <td style={{fontWeight:500}}><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#0277BD',marginRight:'8px'}}></span>Lucknow Nawabs</td>
                      <td>8</td>
                      <td>1</td>
                      <td>7</td>
                      <td>0</td>
                      <td style={{fontWeight:600}}>2</td>
                      <td style={{color:'#E8493F'}}>-1.52</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Playoff Picture */}
            <div style={{marginBottom:'24px'}}>
              <h3 style={{color:'#E8B23D',fontWeight:800,fontSize:'14px',letterSpacing:'0.05em',marginBottom:'16px'}}>
                PLAYOFF PICTURE
              </h3>
              
              <div className="grid-2">
                <div className="glass" style={{padding:'16px',border:'1px solid rgba(255,255,255,0.15)'}}>
                  <div style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:700,marginBottom:'8px'}}>SEMI-FINAL 1</div>
                  <div style={{fontSize:'13px',fontWeight:600}}><span style={{color:'rgba(255,255,255,0.4)'}}>Grp A #1</span> Delhi Dynamos</div>
                  <div style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',margin:'4px 0'}}>VS</div>
                  <div style={{fontSize:'13px',fontWeight:600}}><span style={{color:'rgba(255,255,255,0.4)'}}>Grp B #2</span> Chennai Chiefs</div>
                </div>

                <div className="glass" style={{padding:'16px',border:'1px solid rgba(255,255,255,0.15)'}}>
                  <div style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:700,marginBottom:'8px'}}>SEMI-FINAL 2</div>
                  <div style={{fontSize:'13px',fontWeight:600}}><span style={{color:'rgba(255,255,255,0.4)'}}>Grp B #1</span> Bangalore Bulls</div>
                  <div style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',margin:'4px 0'}}>VS</div>
                  <div style={{fontSize:'13px',fontWeight:600}}><span style={{color:'rgba(255,255,255,0.4)'}}>Grp A #2</span> Mumbai Mavericks</div>
                </div>
              </div>

              <div className="glass" style={{marginTop:'14px',padding:'20px',textAlign:'center',background:'linear-gradient(135deg, rgba(232,178,61,0.1), rgba(15,34,71,0.5))',border:'1px solid rgba(232,178,61,0.3)'}}>
                <div style={{color:'#E8B23D',fontSize:'12px',fontWeight:800,marginBottom:'8px'}}>GRAND FINAL</div>
                <div style={{fontSize:'15px',fontWeight:700,marginBottom:'4px'}}>Winner SF1 <span style={{color:'rgba(255,255,255,0.3)',margin:'0 4px',fontSize:'12px'}}>VS</span> Winner SF2</div>
                <div style={{color:'#E8B23D',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:'14px',marginTop:'12px'}}>Grand Final Date: 30 August 2025</div>
              </div>
            </div>

            {/* How points work */}
            <div className="glass" style={{padding:'16px',background:'rgba(255,255,255,0.03)',border:'1px dashed rgba(255,255,255,0.15)'}}>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',fontWeight:500,lineHeight:1.6}}>
                <strong style={{color:'#fff'}}>Points System:</strong> Win = 2 pts | Tie/NR = 1 pt each | Loss = 0 pts<br/>
                <span style={{color:'rgba(255,255,255,0.5)'}}>Net Run Rate (NRR) determines ranking if points are equal.</span>
              </div>
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
