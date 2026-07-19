import React from 'react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#060E1C; }
.wrap { max-width:1280px; margin:0 auto; padding:0 20px; }
.desk-nav { display:none; align-items:center; gap:22px; }
.ham-btn { display:flex; }
.bot-cta { display:flex; }
@media(min-width:768px){ .wrap{padding:0 32px} }
@media(min-width:1024px){ .desk-nav{display:flex!important;} .ham-btn{display:none!important;} .bot-cta{display:none!important;} }
.btn-fire { background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%); border:none; border-radius:14px; color:#fff; font-family:Montserrat,sans-serif; font-weight:800; cursor:pointer; box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2); transition:transform 0.15s,box-shadow 0.2s; letter-spacing:0.02em; animation:pulseGlow 3s ease-in-out infinite; }
.btn-fire:hover { transform:translateY(-2px); box-shadow:0 14px 40px rgba(255,122,41,0.6); }
.btn-fire:active { transform:scale(0.97); }
.btn-wa { background:linear-gradient(135deg,#25D366,#1BA851); border:none; border-radius:14px; color:#fff; font-weight:700; cursor:pointer; font-family:Montserrat,sans-serif; transition:transform 0.15s; }
.glass-card { background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85)); backdrop-filter:blur(32px); border:1px solid rgba(255,255,255,0.09); border-radius:20px; box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06); }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
.tag-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,122,41,0.12); border:1px solid rgba(255,122,41,0.3); border-radius:100px; padding:5px 14px; font-size:11px; font-weight:700; font-family:Montserrat,sans-serif; color:#FF7A29; letter-spacing:0.1em; }
.inp { width:100%; background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.1); border-radius:14px; color:#F8F4EE; padding:15px 18px; font-family:Inter,sans-serif; font-size:15px; outline:none; transition:all 0.25s; appearance:none; }
.inp:focus { border-color:#FF7A29; background:rgba(255,122,41,0.06); box-shadow:0 0 0 4px rgba(255,122,41,0.12); }
.inp::placeholder { color:rgba(255,255,255,0.28); }
.lbl { font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-bottom:8px; display:block; }
@keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes pulseGlow { 0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)} 50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes scanPulse { 0%,100%{opacity:0.03} 50%{opacity:0.08} }
@keyframes floatParticle { 0%{transform:translateY(0) rotate(0deg);opacity:0.4} 50%{opacity:0.8} 100%{transform:translateY(-80px) rotate(180deg);opacity:0} }
@keyframes fadeSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes floatUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes borderGlow { 0%,100%{border-color:rgba(255,122,41,0.3)} 50%{border-color:rgba(255,122,41,0.8)} }
.contact-method-card { transition:transform 0.2s,box-shadow 0.2s; cursor:default; }
.contact-method-card:hover { transform:translateY(-6px); }
`;

function AmbientBg() {
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.07}} viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
        <path d="M0,400 Q320,320 640,380 Q960,440 1280,360 L1280,720 L0,720 Z" fill="#1a2a4a"/>
        <rect x="80" y="100" width="8" height="300" fill="#334"/>
        <rect x="76" y="80" width="16" height="12" fill="#445" rx="2"/>
        <rect x="1192" y="100" width="8" height="300" fill="#334"/>
        <rect x="1188" y="80" width="16" height="12" fill="#445" rx="2"/>
        <rect x="440" y="420" width="400" height="160" fill="none" stroke="#334" strokeWidth="2"/>
      </svg>
      {[
        {top:'15%',left:'8%',color:'#FF7A29',delay:'0s',size:3},
        {top:'35%',left:'92%',color:'#E8B23D',delay:'1.2s',size:3},
        {top:'60%',left:'5%',color:'#fff',delay:'2.1s',size:2},
        {top:'75%',left:'88%',color:'#FF7A29',delay:'0.7s',size:3},
        {top:'25%',left:'50%',color:'#E8B23D',delay:'1.8s',size:2},
        {top:'85%',left:'30%',color:'#fff',delay:'0.4s',size:3},
        {top:'45%',left:'70%',color:'#FF7A29',delay:'2.5s',size:2},
        {top:'10%',left:'65%',color:'#E8B23D',delay:'1.0s',size:3},
      ].map((p,i)=>(
        <div key={i} style={{position:'absolute',top:p.top,left:p.left,width:p.size,height:p.size,borderRadius:'50%',background:p.color,animation:`floatParticle 6s ease-in-out ${p.delay} infinite`}}/>
      ))}
      <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
    </div>
  );
}

function AnnouncementBar() {
  return (
    <div style={{position:'relative',zIndex:10,background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)',backgroundSize:'300% 100%',animation:'gradShift 4s ease infinite',color:'#fff',padding:'11px 20px',textAlign:'center',fontSize:13,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.04em',display:'flex',alignItems:'center',justifyContent:'center',gap:16,flexWrap:'wrap'}}>
      <span>🏏 Season 5 Registrations OPEN — ₹299 Only</span>
      <span style={{width:1,height:14,background:'rgba(255,255,255,0.4)',display:'inline-block'}}/>
      <span>75 Cities · 10 Franchises · 5,000+ Players</span>
      <span style={{width:1,height:14,background:'rgba(255,255,255,0.4)',display:'inline-block'}}/>
      <span>#OfficeSeStadiumtak</span>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = React.useState(false);
  const links = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:200,background:'rgba(6,14,28,0.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.07)',boxShadow:'0 1px 0 0 rgba(255,122,41,0.25)'}}>
        <div className="wrap" style={{height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff'}}>T20</span></span>
            <span style={{fontSize:10,color:'rgba(255,122,41,0.7)',fontFamily:'Montserrat,sans-serif',fontWeight:700,marginLeft:8,letterSpacing:'0.08em'}}>SEASON 5</span>
          </div>
          <div className="desk-nav">
            {links.map(l=>(
              <a key={l} href="#" style={{color:l==='Contact'?'#FF7A29':'rgba(255,255,255,0.75)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',transition:'color 0.2s'}}>{l}</a>
            ))}
            <button className="btn-fire" style={{padding:'10px 22px',fontSize:14}}>Register ₹299</button>
          </div>
          <button className="ham-btn" onClick={()=>setOpen(o=>!o)} style={{flexDirection:'column',gap:5,background:'none',border:'none',cursor:'pointer',padding:8,zIndex:201}}>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(45deg) translate(5px,5px)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'scaleX(0)':''}}/>
            <span style={{display:'block',width:22,height:2,background:'#fff',borderRadius:12,transition:'all 0.25s',transform:open?'rotate(-45deg) translate(5px,-5px)':''}}/>
          </button>
        </div>
      </nav>
      {open && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#06101E',zIndex:300,display:'flex',flexDirection:'column',padding:'72px 24px 40px',overflowY:'auto'}}>
          <button onClick={()=>{ setOpen(false); window.location.assign(ROUTE_MAP[l]||'/'); }} style={{position:'absolute',top:18,right:20,background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:28,cursor:'pointer',lineHeight:1}}>✕</button>
          <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:32}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff'}}>T20</span></div>
          {links.map(l=>(
            <a key={l} href="#" onClick={()=>{ setOpen(false); window.location.assign(ROUTE_MAP[l]||'/'); }} style={{color:'rgba(255,255,255,0.88)',fontWeight:700,fontSize:20,textDecoration:'none',fontFamily:'Montserrat,sans-serif',padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>{l}</a>
          ))}
          <button className="btn-fire" style={{marginTop:32,height:54,fontSize:17,width:'100%'}}>📝 Register for ₹299 →</button>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer style={{background:'#040C18',borderTop:'1px solid rgba(255,255,255,0.05)',padding:'48px 0 32px',position:'relative',zIndex:10}}>
      <div className="wrap">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:40,marginBottom:40}}>
          <div>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:26,marginBottom:8}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff'}}>T20</span></div>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.1em',marginBottom:12}}>SEASON 5 · 2025</div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:13,fontFamily:'Inter,sans-serif',lineHeight:1.6}}>#OfficeSeStadiumtak<br/>Relive the dream. Rediscover the thrill.</div>
          </div>
          <div>
            <div style={{color:'rgba(255,255,255,0.3)',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.1em',marginBottom:16,textTransform:'uppercase'}}>League</div>
            {['Schedule','Match Center','Teams','Points Table','Photos','Videos'].map(l=>(
              <a key={l} href="#" style={{display:'block',color:'rgba(255,255,255,0.55)',fontSize:14,fontFamily:'Inter,sans-serif',textDecoration:'none',marginBottom:9}}>{l}</a>
            ))}
          </div>
          <div>
            <div style={{color:'rgba(255,255,255,0.3)',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700,letterSpacing:'0.1em',marginBottom:16,textTransform:'uppercase'}}>Info</div>
            {['About','FAQ','Contact','Terms','Privacy','Refunds','Eligibility'].map(l=>(
              <a key={l} href="#" style={{display:'block',color:'rgba(255,255,255,0.55)',fontSize:14,fontFamily:'Inter,sans-serif',textDecoration:'none',marginBottom:9}}>{l}</a>
            ))}
          </div>
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:24,display:'flex',flexWrap:'wrap',gap:12,justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'rgba(255,255,255,0.3)',fontSize:12,fontFamily:'Inter,sans-serif'}}>© 2025 Kriparti Playing11 Pvt. Ltd. | www.bcpl-t20.com</div>
          <div style={{color:'rgba(255,255,255,0.25)',fontSize:12,fontFamily:'Inter,sans-serif'}}>All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

function MobileStickyCTA() {
  return (
    <div className="bot-cta" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:500,background:'rgba(4,12,24,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'10px 16px 18px',gap:10}}>
      <button className="btn-fire" style={{flex:2,height:52,fontSize:15}}>Register ₹299 →</button>
      <button className="btn-wa" style={{flex:1,height:52,fontSize:14}}>💬 WhatsApp</button>
    </div>
  );
}


const ROUTE_MAP: Record<string,string> = {
  'Home':'/', 'HOME':'/',
  'Match Center':'/match-center', 'MATCH CENTER':'/match-center',
  'Teams':'/teams', 'TEAMS':'/teams',
  'Sponsors':'/sponsors', 'SPONSORS':'/sponsors',
  'Photos':'/photos', 'PHOTOS':'/photos',
  'Videos':'/videos', 'VIDEOS':'/videos',
  'About':'/about', 'ABOUT':'/about',
  'FAQ':'/faq',
  'Contact':'/contact', 'CONTACT':'/contact',
  'Schedule':'/schedule',
  'Points Table':'/points-table',
};

export function Contact() {
  const [form, setForm] = React.useState({name:'',email:'',phone:'',subject:'',message:''});
  const [sent, setSent] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setTimeout(()=>setSent(false), 4000);
  }

  return (
    <div style={{minHeight:'100vh',background:'#060E1C',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <AnnouncementBar/>
      <Navbar/>

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'100px 0 80px',textAlign:'center'}}>
        <div className="wrap">
          <div className="tag-pill" style={{marginBottom:24,animation:'floatUp 0.6s ease both'}}>GET IN TOUCH</div>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,color:'#fff',marginBottom:12,animation:'floatUp 0.7s ease 0.1s both'}}>
            WE'RE HERE
          </h1>
          <h1 className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:28,animation:'floatUp 0.7s ease 0.2s both'}}>
            FOR YOU.
          </h1>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:18,maxWidth:520,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            Questions about registration, results, or anything else? We're here to help, fast.
          </p>
        </div>
      </section>

      {/* CONTACT METHODS */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 60px'}}>
        <div className="wrap">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:24}}>
            {/* WhatsApp */}
            <div className="glass-card contact-method-card" style={{padding:'36px 28px',border:'1px solid rgba(37,211,102,0.25)',boxShadow:'0 0 40px rgba(37,211,102,0.06)',animation:'fadeSlide 0.6s ease 0.1s both'}}>
              <div style={{fontSize:44,marginBottom:16}}>📱</div>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20,color:'#fff',marginBottom:8}}>WhatsApp</div>
              <div style={{color:'rgba(255,255,255,0.55)',fontSize:14,lineHeight:1.6,marginBottom:8}}>Fastest response.</div>
              <div style={{color:'#25D366',fontSize:13,fontWeight:600,marginBottom:24}}>Reply within 2 hours</div>
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                <button style={{width:'100%',height:48,borderRadius:14,background:'linear-gradient(135deg,#25D366,#1BA851)',border:'none',color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,cursor:'pointer',transition:'transform 0.15s'}}>
                  Chat Now →
                </button>
              </a>
            </div>

            {/* Email */}
            <div className="glass-card contact-method-card" style={{padding:'36px 28px',border:'1px solid rgba(6,182,212,0.25)',boxShadow:'0 0 40px rgba(6,182,212,0.06)',animation:'fadeSlide 0.6s ease 0.2s both'}}>
              <div style={{fontSize:44,marginBottom:16}}>📧</div>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20,color:'#fff',marginBottom:8}}>Email</div>
              <div style={{color:'#06B6D4',fontSize:15,fontWeight:700,marginBottom:4}}>info@bcpl-t20.com</div>
              <div style={{color:'rgba(255,255,255,0.45)',fontSize:13,lineHeight:1.6,marginBottom:24}}>Response within 24 hours</div>
              <a href="mailto:info@bcpl-t20.com" style={{textDecoration:'none'}}>
                <button style={{width:'100%',height:48,borderRadius:14,background:'linear-gradient(135deg,#06B6D4,#0891B2)',border:'none',color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,cursor:'pointer',transition:'transform 0.15s'}}>
                  Send Email →
                </button>
              </a>
            </div>

            {/* Call */}
            <div className="glass-card contact-method-card" style={{padding:'36px 28px',border:'1px solid rgba(139,92,246,0.25)',boxShadow:'0 0 40px rgba(139,92,246,0.06)',animation:'fadeSlide 0.6s ease 0.3s both'}}>
              <div style={{fontSize:44,marginBottom:16}}>📞</div>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20,color:'#fff',marginBottom:8}}>Call Us</div>
              <div style={{color:'#8B5CF6',fontSize:15,fontWeight:700,marginBottom:4}}>+91 98765 43210</div>
              <div style={{color:'rgba(255,255,255,0.45)',fontSize:13,lineHeight:1.6,marginBottom:24}}>Mon–Sat 10AM–7PM IST</div>
              <a href="tel:+919876543210" style={{textDecoration:'none'}}>
                <button style={{width:'100%',height:48,borderRadius:14,background:'linear-gradient(135deg,#8B5CF6,#7C3AED)',border:'none',color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,cursor:'pointer',transition:'transform 0.15s'}}>
                  Call Now →
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 60px'}}>
        <div className="wrap">
          <div style={{display:'grid',gridTemplateColumns:'1fr min(480px,100%)',gap:32,alignItems:'start'}} className="contact-grid">
            <style>{`.contact-grid { grid-template-columns: 1fr; } @media(min-width:900px){ .contact-grid { grid-template-columns: 1fr min(480px,100%); } }
        /* ── FLOATING REGISTER BUTTON ── */
        .float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:9999; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:'Montserrat',sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
        .float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
        @keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
        .float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
      `}</style>

            <div className="glass-card" style={{padding:'40px',animation:'fadeSlide 0.7s ease 0.2s both'}}>
              <div className="tag-pill" style={{marginBottom:20}}>SEND A MESSAGE</div>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:28,color:'#fff',marginBottom:8}}>Drop Us a Line</h2>
              <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,marginBottom:32,lineHeight:1.6}}>Fill out the form and our team will get back to you within 24 hours.</p>

              {sent ? (
                <div style={{textAlign:'center',padding:'40px 20px'}}>
                  <div style={{fontSize:48,marginBottom:16}}>✅</div>
                  <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:20,color:'#22C55E',marginBottom:8}}>Message Sent!</div>
                  <div style={{color:'rgba(255,255,255,0.6)',fontSize:14}}>We'll get back to you within 24 hours.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                    <div>
                      <label className="lbl">Full Name *</label>
                      <input className="inp" placeholder="Rahul Sharma" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
                    </div>
                    <div>
                      <label className="lbl">Work Email *</label>
                      <input className="inp" type="email" placeholder="rahul@company.com" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
                    </div>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label className="lbl">Phone Number</label>
                    <input className="inp" placeholder="+91 98765 43210" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label className="lbl">Subject</label>
                    <select className="inp" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} style={{color:form.subject?'#F8F4EE':'rgba(255,255,255,0.28)'}}>
                      <option value="" disabled>Select a subject...</option>
                      <option value="registration">Registration Query</option>
                      <option value="result">Result Query</option>
                      <option value="sponsorship">Sponsorship</option>
                      <option value="general">General</option>
                      <option value="technical">Technical Issue</option>
                    </select>
                  </div>
                  <div style={{marginBottom:24}}>
                    <label className="lbl">Message</label>
                    <textarea className="inp" rows={5} placeholder="Tell us how we can help..." value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} style={{resize:'vertical',minHeight:120}}/>
                  </div>
                  <button type="submit" className="btn-fire" style={{width:'100%',height:54,fontSize:16}}>
                    Send Message →
                  </button>
                </form>
              )}
            </div>

            {/* FAQ Teaser */}
            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              <div className="glass-card" style={{padding:'32px',animation:'fadeSlide 0.7s ease 0.35s both'}}>
                <div style={{fontSize:32,marginBottom:12}}>❓</div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:18,color:'#fff',marginBottom:8}}>Common Questions?</div>
                <p style={{color:'rgba(255,255,255,0.55)',fontSize:14,marginBottom:20,lineHeight:1.6}}>Quick answers to the most frequent queries:</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:20}}>
                  {['Refund policy','Eligibility','Video format','Results timeline'].map(chip=>(
                    <span key={chip} style={{background:'rgba(255,122,41,0.1)',border:'1px solid rgba(255,122,41,0.25)',borderRadius:100,padding:'6px 14px',fontSize:12,color:'#FF7A29',fontFamily:'Montserrat,sans-serif',fontWeight:700,cursor:'pointer'}}>
                      {chip}
                    </span>
                  ))}
                </div>
                <button className="btn-fire" style={{width:'100%',height:46,fontSize:14}}>Check Full FAQ →</button>
              </div>

              <div className="glass-card" style={{padding:'28px',animation:'fadeSlide 0.7s ease 0.45s both'}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'rgba(255,255,255,0.7)',marginBottom:16}}>📍 Find Us</div>
                <div style={{color:'rgba(255,255,255,0.5)',fontSize:13,lineHeight:1.8}}>
                  <div>Kriparti Playing11 Pvt. Ltd.</div>
                  <div style={{color:'#FF7A29',fontWeight:600}}>www.bcpl-t20.com</div>
                  <div style={{marginTop:8,color:'rgba(255,255,255,0.35)',fontSize:12}}>CIN: U74999DL2020PTC123456</div>
                </div>
              </div>

              <div className="glass-card" style={{padding:'28px',animation:'fadeSlide 0.7s ease 0.55s both'}}>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'rgba(255,255,255,0.7)',marginBottom:16}}>⏰ Support Hours</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[['Mon–Fri','10AM–7PM'],['Saturday','10AM–5PM'],['Sunday','Closed'],['WhatsApp','24×7']].map(([d,t])=>(
                    <div key={d}>
                      <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontFamily:'Montserrat,sans-serif',fontWeight:700}}>{d}</div>
                      <div style={{color:t==='24×7'?'#22C55E':'rgba(255,255,255,0.75)',fontSize:13,fontWeight:600}}>{t}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer/>
      <MobileStickyCTA/>
      {/* ── FLOATING REGISTER BUTTON ── */}
      <a className="float-reg-btn float-reg-pulse" href="/register" style={{textDecoration:"none"}}>🏏 REGISTER NOW →</a>
    </div>
  );
}
