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

export function FAQ() {
  const [openIndex, setOpenIndex] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState('All');

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
    .tscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
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

  const tabs = ['All', 'Registration', 'Format', 'Payment', 'Selection', 'Teams', 'Rules'];

  const faqs = [
    { cat: 'REGISTRATION', q: 'What is BCPL T20?', a: "BCPL (Bharatiya Corporate Premier League) T20 is India's biggest corporate cricket league, built exclusively for working professionals. Run by Kriparti Playing11 Pvt. Ltd., BCPL gives talented cricketers who couldn't go professional a real shot at playing in a stadium — with actual kit, coaching, and competition." },
    { cat: 'REGISTRATION', q: 'Who is eligible to participate?', a: 'Any working professional or corporate employee across India. Full-time, part-time, or self-employed. Students are not eligible. Professional cricketers under BCCI or state contracts are not eligible.' },
    { cat: 'REGISTRATION', q: 'What is the registration fee?', a: '₹299 for Batsman, Bowler, or Wicket-Keeper. ₹399 for All-Rounders. This is the ONLY fee you ever pay. No auction fee, no tournament fee, no kit fee, no hidden charges.' },
    { cat: 'REGISTRATION', q: 'How does the selection process work?', a: '(1) Register and submit a 2-minute playing video. (2) Scout panel reviews within 2–3 weeks. (3) Shortlisted players invited to a physical trial in their city. (4) Selected players go to the player auction. (5) Franchise teams bid for players. (6) You represent your city for the full season!' },
    { cat: 'REGISTRATION', q: "What if I'm not shortlisted?", a: 'The registration fee is non-refundable after the video upload stage. However, you are welcome to register again next season. Many players get selected on their 2nd or 3rd attempt.' },
    { cat: 'CITIES & FORMAT', q: 'Which cities does BCPL operate in?', a: 'Season 5 has 10 city franchises: Delhi, Mumbai, Pune, Kolkata, Bangalore, Chennai, Hyderabad, Jaipur, Ahmedabad, and Lucknow. Trials are held in 75+ cities across India.' },
    { cat: 'VIDEO', q: 'What do I need to upload for the video?', a: 'A 2–5 minute video showing your batting, bowling, or keeping (depending on your role). Record outdoors in good lighting. Natural action shots work best — no fancy editing needed.' },
    { cat: 'PAYMENT', q: 'Is there a refund policy?', a: "You can cancel within 7 days of registration if you haven't yet uploaded your video, for a full refund. After video upload, the registration fee is non-refundable. For details, see our Refund Policy." },
    { cat: 'GENERAL', q: 'Can I register as a team or company group?', a: "No. BCPL is player-first. You register individually. If selected, you're assigned to a franchise through the auction. Your company colleagues could all register independently and some may end up on the same team!" }
  ];

  return (
    <div style={{background:'#0A1628', color:'#fff', minHeight:'100vh', paddingBottom:96}}>
      <style>{style}</style>
      <div style={{background:'#2E9E4F', padding:'10px 16px', textAlign:'center', fontSize:14, fontWeight:600}}>
        ❓ Got questions? WhatsApp us at +91 98765 43210
      </div>
      <Navbar active="faq" />

      {/* Hero */}
      <div style={{textAlign:'center', padding:'60px 20px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <h1 className="h1" style={{marginBottom:16}}>FAQ</h1>
        <p style={{fontSize:18, color:'rgba(255,255,255,0.8)'}}>Everything you need to know about BCPL T20</p>
      </div>

      <div className="section" style={{paddingTop:40}}>
        <div className="wrap">
          {/* Search */}
          <div className="glass" style={{maxWidth:500, margin:'0 auto 32px', borderRadius:24, padding:'4px 4px 4px 20px', display:'flex', alignItems:'center'}}>
            <span style={{fontSize:18, marginRight:12}}>🔍</span>
            <input type="text" placeholder="Search questions..." style={{background:'transparent', border:'none', outline:'none', color:'#fff', flex:1, fontSize:15, width:'100%'}} />
            <button className="btn-primary" style={{height:40, minHeight:40, padding:'0 20px', borderRadius:10}}>Search</button>
          </div>

          {/* Tabs */}
          <div className="tscroll" style={{display:'flex', gap:8, paddingBottom:12, maxWidth:760, margin:'0 auto 40px'}}>
            {tabs.map(t => (
              <button key={t} onClick={()=>setActiveTab(t)} style={{padding:'8px 16px', borderRadius:20, fontSize:14, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', background:activeTab===t?'#FF7A29':'rgba(15,34,71,0.7)', color:activeTab===t?'#fff':'rgba(255,255,255,0.6)', backdropFilter:'blur(10px)', border:'1px solid '+(activeTab===t?'#FF7A29':'rgba(255,255,255,0.1)')}}>
                {t}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div style={{maxWidth:760, margin:'0 auto'}}>
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              const showCat = i === 0 || faqs[i-1].cat !== faq.cat;
              return (
                <div key={i} style={{marginBottom:12}}>
                  {showCat && (
                    <div style={{display:'inline-block', padding:'4px 10px', background:'rgba(255,122,41,0.15)', color:'#FF7A29', fontSize:11, fontWeight:700, borderRadius:6, marginBottom:8, marginTop:i===0?0:16, letterSpacing:'0.05em'}}>
                      {faq.cat}
                    </div>
                  )}
                  <div className="glass" style={{overflow:'hidden'}}>
                    <div onClick={()=>setOpenIndex(isOpen?-1:i)} style={{padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', background:isOpen?'rgba(255,255,255,0.03)':'transparent'}}>
                      <div style={{fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:15, color:'#fff', paddingRight:16}}>{faq.q}</div>
                      <div style={{color:'#FF7A29', fontSize:14, transform:isOpen?'rotate(180deg)':'rotate(0)', transition:'transform 0.25s', flexShrink:0}}>▼</div>
                    </div>
                    {isOpen && (
                      <div style={{padding:'0 20px 20px', fontSize:14, lineHeight:1.75, color:'rgba(255,255,255,0.75)', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:16}}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
      <MobileCTA />
    </div>
  );
}
