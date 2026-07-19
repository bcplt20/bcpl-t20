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

export function Schedule() {
  const [activeTab, setActiveTab] = React.useState('All Matches');
  const tabs = ['All Matches', 'Group A', 'Group B', 'Knockouts'];

  return (
    <div style={{backgroundColor:'#0A1628',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#fff'}}>
      <style dangerouslySetInnerHTML={{__html: commonStyles}} />
      <Navbar active="" />
      
      <div style={{paddingBottom:'96px'}}>
        <section style={{padding:'40px 0 20px',textAlign:'center'}}>
          <div className="wrap">
            <h1 className="h1" style={{fontSize:'32px',marginBottom:'8px'}}>MATCH SCHEDULE</h1>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:'16px',fontWeight:500}}>Season 5 — All Fixtures</div>
          </div>
        </section>

        {/* Filter Bar */}
        <div style={{borderBottom:'1px solid rgba(255,255,255,0.05)',position:'sticky',top:'60px',background:'rgba(10,22,40,0.9)',backdropFilter:'blur(20px)',zIndex:90}}>
          <div className="wrap" style={{padding:'12px 16px',display:'flex',gap:'8px',overflowX:'auto',whiteSpace:'nowrap',scrollbarWidth:'none'}}>
            {tabs.map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                className={activeTab === t ? 'btn-primary' : 'glass'}
                style={{
                  minHeight:0,
                  padding:'8px 16px',
                  borderRadius:'20px',
                  fontSize:'13px',
                  fontWeight:600,
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
            {/* Upcoming Matches */}
            <div style={{marginBottom:'32px'}}>
              <h3 style={{color:'#FF7A29',fontWeight:800,fontSize:'14px',letterSpacing:'0.05em',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
                UPCOMING MATCHES
                <div style={{flex:1,height:'1px',background:'linear-gradient(90deg, rgba(255,122,41,0.5), transparent)'}}></div>
              </h3>

              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {[
                  {teams:'Mumbai Mavericks VS Delhi Dynamos', date:'SAT, 26 JULY 2025 · 6:00 PM IST', venue:'🏟️ DY Patil Stadium, Mumbai'},
                  {teams:'Bangalore Bulls VS Pune Panthers', date:'SUN, 27 JULY 2025 · 10:00 AM IST', venue:'🏟️ Chinnaswamy Stadium, Bangalore'},
                  {teams:'Chennai Chiefs VS Kolkata Knights', date:'SAT, 2 AUG 2025 · 6:00 PM IST', venue:'🏟️ Chepauk Stadium, Chennai'},
                ].map((m, i) => (
                  <div key={i} className="glass" style={{padding:'18px 20px',display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:'8px'}}>
                      <span style={{background:'rgba(77,168,218,0.15)',color:'#4da8da',padding:'2px 8px',borderRadius:'8px',fontSize:'10px',fontWeight:700}}>🔵 UPCOMING</span>
                      <span style={{fontSize:'12px',fontWeight:600,color:'rgba(255,255,255,0.6)'}}>{m.date}</span>
                    </div>
                    
                    <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'18px',textAlign:'center'}}>
                      {m.teams.split('VS')[0]} <span style={{color:'rgba(255,255,255,0.3)',fontSize:'14px',margin:'0 4px'}}>VS</span> {m.teams.split('VS')[1]}
                    </div>
                    
                    <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',textAlign:'center'}}>
                      {m.venue}
                    </div>

                    <div style={{display:'flex',justifyContent:'center'}}>
                      <span className="glass" style={{padding:'4px 10px',fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.8)'}}>
                        Starts in {3+i} days
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Knockout Stage */}
            <div style={{marginBottom:'32px'}}>
              <h3 style={{color:'#E8B23D',fontWeight:800,fontSize:'14px',letterSpacing:'0.05em',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
                🏆 KNOCKOUT STAGE
                <div style={{flex:1,height:'1px',background:'linear-gradient(90deg, rgba(232,178,61,0.5), transparent)'}}></div>
              </h3>

              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                <div className="glass" style={{padding:'18px 20px',border:'1px solid rgba(232,178,61,0.2)',background:'rgba(232,178,61,0.03)'}}>
                  <div style={{color:'#E8B23D',fontSize:'12px',fontWeight:700,marginBottom:'4px',textAlign:'center'}}>SEMI-FINAL 1</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'16px',textAlign:'center',marginBottom:'4px'}}>TBD <span style={{color:'rgba(255,255,255,0.3)',fontSize:'14px',margin:'0 4px'}}>VS</span> TBD</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',textAlign:'center'}}>Sat Aug 23 · 6:00 PM · DY Patil</div>
                </div>

                <div className="glass" style={{padding:'18px 20px',border:'1px solid rgba(232,178,61,0.2)',background:'rgba(232,178,61,0.03)'}}>
                  <div style={{color:'#E8B23D',fontSize:'12px',fontWeight:700,marginBottom:'4px',textAlign:'center'}}>SEMI-FINAL 2</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'16px',textAlign:'center',marginBottom:'4px'}}>TBD <span style={{color:'rgba(255,255,255,0.3)',fontSize:'14px',margin:'0 4px'}}>VS</span> TBD</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',textAlign:'center'}}>Sun Aug 24 · 10:00 AM · Chinnaswamy</div>
                </div>

                <div className="glass" style={{padding:'24px 20px',border:'2px solid rgba(232,178,61,0.5)',background:'linear-gradient(135deg, rgba(232,178,61,0.1), rgba(15,34,71,0.5))',boxShadow:'0 8px 24px rgba(232,178,61,0.15)'}}>
                  <div style={{color:'#E8B23D',fontSize:'14px',fontWeight:800,marginBottom:'8px',textAlign:'center',letterSpacing:'0.1em'}}>GRAND FINAL</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'22px',textAlign:'center',marginBottom:'8px'}}>Winner SF1 <span style={{color:'rgba(255,255,255,0.4)',fontSize:'16px',margin:'0 4px'}}>VS</span> Winner SF2</div>
                  <div style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',textAlign:'center',fontWeight:500}}>Sat Aug 30 · 6:00 PM · DY Patil</div>
                </div>
              </div>
            </div>

            {/* Completed Matches */}
            <div>
              <h3 style={{color:'rgba(255,255,255,0.5)',fontWeight:800,fontSize:'14px',letterSpacing:'0.05em',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
                COMPLETED MATCHES
                <div style={{flex:1,height:'1px',background:'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)'}}></div>
              </h3>

              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {[
                  {result:'DELHI DYNAMOS won by 34 runs', score:'142/8 (20.0 ov) def 108 all out (18.3 ov)'},
                  {result:'MUMBAI MAVERICKS won by 6 wkts', score:'139/4 (19.2 ov) def 138/9 (20.0 ov)'},
                  {result:'HYDERABAD HAWKS won by 2 wkts', score:'134/8 (19.5 ov) def 132/7 (20.0 ov)'},
                ].map((m, i) => (
                  <div key={i} className="glass" style={{padding:'16px 20px',opacity:0.8,background:'rgba(15,34,71,0.4)'}}>
                    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                      <div>
                        <span style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.7)',padding:'2px 8px',borderRadius:'8px',fontSize:'10px',fontWeight:700}}>✅ COMPLETED</span>
                      </div>
                      <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'15px',color:'#fff'}}>{m.result}</div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>{m.score}</div>
                      <a href="#" style={{color:'#FF7A29',fontSize:'13px',fontWeight:600,textDecoration:'none',marginTop:'4px',display:'inline-block'}}>View Scorecard →</a>
                    </div>
                  </div>
                ))}
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
