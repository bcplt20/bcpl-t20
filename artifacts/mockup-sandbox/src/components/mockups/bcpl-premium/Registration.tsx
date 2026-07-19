import React from 'react';

function Navbar({ active = '' }) {
  const [open, setOpen] = React.useState(false);
  const links = [['Home', 'home'], ['Match Center', 'matchcenter'], ['Teams', 'teams'], ['Sponsors', 'sponsors'], ['About', 'about']];
  return (
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,22,40,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 2px 0 0 rgba(255,122,41,0.2)' }}>
        <div className="wrap" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 20 }}>
            <span style={{ color: '#FF7A29' }}>BCPL</span><span style={{ color: '#fff', marginLeft: 3 }}>T20</span>
          </div>
          <div className="nav-links">
            {links.map(([l, k]) => <a key={k} href="#" style={{ color: active === k ? '#FF7A29' : 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13.5, textDecoration: 'none', fontFamily: 'Inter,sans-serif', borderBottom: active === k ? '2px solid #FF7A29' : '2px solid transparent', paddingBottom: 2 }}>{l}</a>)}
            <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5, borderRadius: 10 }}>Register ₹299</button>
          </div>
          <button className="ham" onClick={() => setOpen(o => !o)} style={{ flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 8, zIndex: 201 }}>
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.25s', transform: open ? 'rotate(45deg) translate(4px,4px)' : '' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.25s', opacity: open ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.25s', transform: open ? 'rotate(-45deg) translate(4px,-4px)' : '' }} />
          </button>
        </div>
      </nav>
      {open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(6,16,30,0.99)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '72px 24px 40px', overflowY: 'auto' }}>
          <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 26, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22, marginBottom: 28 }}><span style={{ color: '#FF7A29' }}>BCPL</span><span style={{ color: '#fff', marginLeft: 3 }}>T20</span></div>
          {[['🏠 Home', 'home'], ['🔴 Match Center', 'mc'], ['🏏 Teams', 'teams'], ['🤝 Sponsors', 'sp'], ['📷 Photos', 'ph'], ['▶️ Videos', 'vid'], ['ℹ️ About', 'about'], ['❓ FAQ', 'faq'], ['✉️ Contact', 'contact']].map(([l, k]) => (
            <a key={k} href="#" onClick={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: 19, textDecoration: 'none', fontFamily: 'Montserrat,sans-serif', padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{l}</a>
          ))}
          <button className="btn-primary" style={{ marginTop: 28, height: 52, fontSize: 16, borderRadius: 14, width: '100%' }}>📝 Register for ₹299 →</button>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer style={{ background: '#06101E', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="grid-2" style={{ gap: 28, marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22, marginBottom: 10 }}><span style={{ color: '#FF7A29' }}>BCPL</span><span style={{ color: '#fff', marginLeft: 4 }}>T20</span></div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.7, marginBottom: 8, maxWidth: 280 }}>Bharatiya Corporate Premier League — world's largest corporate cricket league for working professionals.</p>
            <p style={{ color: 'rgba(255,122,41,0.6)', fontSize: 12, fontWeight: 600 }}>#OfficeSeStadiumtak</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>League</div>
              {['Schedule', 'Match Center', 'Teams', 'Points Table', 'Photos', 'Videos'].map(l => <div key={l} style={{ marginBottom: 8 }}><a href="#" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none' }}>{l}</a></div>)}
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Info</div>
              {['About', 'FAQ', 'Contact', 'Terms', 'Privacy', 'Refunds', 'Eligibility'].map(l => <div key={l} style={{ marginBottom: 8 }}><a href="#" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none' }}>{l}</a></div>)}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['📸', '▶️', '🐦', '📘'].map((ic, i) => <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.07)' }}>{ic}</a>)}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11 }}>© 2025 Kriparti Playing11 Pvt. Ltd.</div>
        </div>
      </div>
    </footer>
  );
}

const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan", "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Noida", "Gurugram", "Bhubaneswar", "Kochi", "Mysuru", "Tiruchirappalli", "Dehradun", "Mangaluru", "Aligarh", "Bareilly", "Moradabad", "Firozabad", "Bhilai", "Jalandhar", "Cuttack", "Thiruvananthapuram", "Guntur", "Hubli", "Solapur", "Udaipur", "Siliguri", "Saharanpur", "Gorakhpur", "Bikaner", "Amravati", "Salem", "Warangal"].sort();

const ROLES = [
  { id: 'batsman', title: '🏏 Batsman', price: 299, desc: 'Opener to finisher, if you can bat, this is your slot' },
  { id: 'bowler', title: '🎳 Bowler', price: 299, desc: 'Fast, medium or spin — we need variety' },
  { id: 'wk', title: '🧤 Wicket-Keeper', price: 299, desc: 'The backbone of every team' },
  { id: 'allrounder', title: '⭐ All-Rounder', price: 399, desc: 'Can do both? We pay premium for that' }
];

const STEPS = [
  { id: 1, title: 'Register', active: true, completed: false },
  { id: 2, title: 'Video', active: false, completed: false },
  { id: 3, title: 'Result', active: false, completed: false },
  { id: 4, title: 'Docs', active: false, completed: false },
  { id: 5, title: 'Done', active: false, completed: false }
];

export function Registration() {
  const [selectedRole, setSelectedRole] = React.useState('');
  const [showLogin, setShowLogin] = React.useState(false);
  const [showOtp, setShowOtp] = React.useState(false);
  const [selectedCity, setSelectedCity] = React.useState('');

  const currentPrice = selectedRole ? ROLES.find(r => r.id === selectedRole)?.price : 299;

  return (
    <div style={{ background: '#0A1628', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#FAF8F4', paddingBottom: '96px' }}>
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .wrap { max-width:1200px; margin:0 auto; padding:0 16px; }
        .section { padding:40px 0; }
        .h1 { font-family:Montserrat,sans-serif; font-weight:900; font-size:36px; line-height:1.05; }
        .h2 { font-family:Montserrat,sans-serif; font-weight:800; font-size:22px; }
        .grid-2 { display:grid; grid-template-columns:1fr; gap:14px; }
        .grid-3 { display:grid; grid-template-columns:1fr; gap:14px; }
        .grid-4 { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        .hide-mob { display:none!important; }
        .glass { background:rgba(15,34,71,0.7); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.10); border-radius:16px; }
        .btn-primary { background:linear-gradient(135deg,#FF7A29,#E8611A); border:none; border-radius:12px; color:#fff; font-weight:700; font-family:Montserrat,sans-serif; cursor:pointer; box-shadow:0 6px 24px rgba(255,122,41,0.4); transition:transform 0.15s; }
        .btn-primary:active { transform:scale(0.97); }
        .btn-wa { background:#2E9E4F; border:none; border-radius:12px; color:#fff; font-weight:700; cursor:pointer; }
        .input-f { background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.12); border-radius:12px; color:#fff; padding:14px 16px; width:100%; font-family:Inter,sans-serif; font-size:15px; outline:none; transition:border-color 0.2s; appearance:none; }
        .input-f:focus { border-color:#FF7A29; }
        .input-f::placeholder { color:rgba(255,255,255,0.3); }
        .input-f option { background:#0F2247; color:#fff; }
        .tscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; border-radius:16px; }
        .dtable { width:100%; border-collapse:collapse; min-width:560px; }
        .dtable th { background:rgba(255,122,41,0.12); color:rgba(255,255,255,0.55); font-size:11px; text-transform:uppercase; letter-spacing:0.1em; padding:12px 14px; text-align:left; font-family:Inter,sans-serif; }
        .dtable td { padding:14px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:14px; }
        .nav-links { display:none; }
        .ham { display:flex; }
        .bot-cta { display:flex; }
        
        .role-card { transition: all 0.2s; cursor: pointer; height: 100%; }
        .role-card:hover { border-color: rgba(255,122,41,0.4); }
        
        .progress-node { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; position: relative; z-index: 2; }
        .progress-line { position: absolute; top: 16px; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.1); z-index: 1; }
        
        .main-layout { display: flex; flex-direction: column; gap: 24px; padding: 24px 0; }
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        
        @media(min-width:768px){
          .wrap{padding:0 28px} .section{padding:60px 0} .h1{font-size:56px}
          .grid-2{grid-template-columns:repeat(2,1fr);gap:24px}
          .grid-3{grid-template-columns:repeat(2,1fr);gap:20px}
          .grid-4{grid-template-columns:repeat(4,1fr);gap:16px}
          .main-layout { flex-direction: row; gap: 32px; align-items: flex-start; }
          .left-col { flex: 1; }
          .right-col { width: 340px; position: sticky; top: 84px; }
          .form-grid { grid-template-columns: 1fr 1fr; }
        }
        @media(min-width:1024px){
          .section{padding:80px 0} .h1{font-size:80px}
          .grid-3{grid-template-columns:repeat(3,1fr)}
          .hide-mob{display:block!important}
          .nav-links{display:flex!important;align-items:center;gap:20px}
          .ham{display:none!important}
          .bot-cta{display:none!important}
        }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Announcement Bar */}
      <div style={{ background: '#FF7A29', color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 16px', textAlign: 'center' }}>
        🏏 LIMITED SEATS — Season 5 registration closing soon. Register now to secure your spot.
      </div>

      <Navbar active="" />

      {/* Step Progress Bar */}
      <div style={{ position: 'sticky', top: 60, zIndex: 90, background: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 0' }}>
        <div className="wrap">
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', maxWidth: 600, margin: '0 auto' }}>
            <div className="progress-line" />
            {STEPS.map((step, i) => (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div className="progress-node" style={{ 
                  background: step.active ? '#FF7A29' : (step.completed ? '#2E9E4F' : '#0F2247'), 
                  color: step.active || step.completed ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: step.active ? '2px solid #FF7A29' : (step.completed ? '2px solid #2E9E4F' : '2px solid rgba(255,255,255,0.1)'),
                  boxShadow: step.active ? '0 0 12px rgba(255,122,41,0.5)' : 'none'
                }}>
                  {step.completed ? '✓' : step.id}
                </div>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: step.active ? 700 : 500, 
                  color: step.active ? '#FF7A29' : (step.completed ? '#2E9E4F' : 'rgba(255,255,255,0.4)')
                }}>
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="main-layout">
          
          {/* LEFT COLUMN - MAIN FORM */}
          <div className="left-col">
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', marginBottom: 8 }}>Register To Play</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.5 }}>Join 5,000+ corporate professionals chasing their cricket dream.</p>
            </div>

            {/* Returning User Card */}
            <div className="glass" style={{ marginBottom: 24, padding: 20 }}>
              {!showLogin ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Already registered? Login to upload your video →</div>
                  <button onClick={() => setShowLogin(true)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Login with Phone</button>
                </div>
              ) : (
                <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff' }}>Login to your application</div>
                    <button onClick={() => setShowLogin(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>Cancel</button>
                  </div>
                  {!showOtp ? (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input type="tel" className="input-f" placeholder="Phone Number" style={{ flex: 1 }} />
                      <button onClick={() => setShowOtp(true)} className="btn-primary" style={{ padding: '0 24px', minHeight: 48 }}>Send OTP</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input type="text" className="input-f" placeholder="Enter OTP" style={{ flex: 1 }} />
                      <button className="btn-primary" style={{ padding: '0 24px', minHeight: 48 }}>Verify & Continue</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Registration Form */}
            <div className="glass" style={{ padding: '24px 20px' }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 16 }}>Basic Info</div>
                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontWeight: 500 }}>Full Name*</label>
                    <input type="text" className="input-f" placeholder="e.g. Rahul Sharma" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontWeight: 500 }}>Email ID*</label>
                    <input type="email" className="input-f" placeholder="name@company.com" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontWeight: 500 }}>Phone Number*</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '0 12px', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>+91</div>
                      <input type="tel" className="input-f" placeholder="10-digit mobile" style={{ flex: 1 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontWeight: 500 }}>Date of Birth*</label>
                    <input type="date" className="input-f" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontWeight: 500 }}>Referral Code (Optional)</label>
                  <input type="text" className="input-f" placeholder="Enter code for priority review" />
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Got a referral? Enter code for priority review</div>
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 16 }}>Choose Your Role*</div>
                <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                  {ROLES.map(role => {
                    const isSelected = selectedRole === role.id;
                    return (
                      <div 
                        key={role.id}
                        className={`glass role-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedRole(role.id)}
                        style={{ 
                          padding: 16, 
                          border: isSelected ? '2px solid #FF7A29' : '2px solid transparent',
                          background: isSelected ? 'rgba(255,122,41,0.08)' : 'rgba(15,34,71,0.7)',
                          boxShadow: isSelected ? '0 0 20px rgba(255,122,41,0.15)' : 'none'
                        }}
                      >
                        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 15, color: isSelected ? '#FF7A29' : '#fff', marginBottom: 4 }}>
                          {role.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, marginBottom: 12 }}>{role.desc}</div>
                        <div style={{ fontWeight: 700, color: '#E8B23D', fontSize: 14 }}>₹{role.price}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 16 }}>Trial City*</div>
                <select 
                  className="input-f" 
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  style={{ paddingRight: 32, cursor: 'pointer' }}
                >
                  <option value="" disabled>Select a city for physical trials</option>
                  {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>We'll conduct physical trials in your selected city</div>
              </div>

              <div style={{ 
                background: 'rgba(232,178,61,0.06)', 
                border: '1px solid rgba(232,178,61,0.2)', 
                borderRadius: 16, 
                padding: 24,
                marginBottom: 32
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'rgba(232,178,61,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>Registration Fee</div>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 32, color: '#E8B23D' }}>₹{currentPrice}</div>
                  </div>
                  <div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['✓ No auction fee', '✓ No tournament fee', '✓ No kit fee', '✓ No hidden charges'].map((item, i) => (
                        <li key={i} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#2E9E4F', fontWeight: 800 }}>✓</span> {item.replace('✓ ', '')}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(232,178,61,0.2)', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                  You only ever pay once — ₹299 (or ₹399 for All-Rounder)
                </div>
              </div>

              <button className="btn-primary" style={{ width: '100%', height: 56, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 17 }}>
                Register & Continue →
              </button>
              <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>
                By registering you agree to our Terms & Conditions. Secure payment.
              </div>
            </div>

            {/* NEXT STEP PREVIEW */}
            <div className="glass" style={{ marginTop: 24, padding: 24, opacity: 0.7, background: 'rgba(15,34,71,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>02 / VIDEO UPLOAD</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 16 }}>
                After successful registration, you'll upload a 2-minute playing video.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['• Record outdoors in daylight', '• Show batting/bowling/keeping in action', '• Min 2 minutes, max 5 minutes'].map((tip, i) => (
                  <li key={i} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{tip}</li>
                ))}
              </ul>
              <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'not-allowed', width: '100%' }}>
                Upload Video →
              </button>
            </div>
            
          </div>

          {/* RIGHT COLUMN - SIDEBAR */}
          <div className="right-col" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* What You Get */}
            <div className="glass" style={{ padding: 24, border: '1px solid rgba(232,178,61,0.3)' }}>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 18, color: '#E8B23D', marginBottom: 16 }}>What You Get</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { i: '🏆', t: 'Fair shot at BCPL Season 5' },
                  { i: '🎽', t: 'Official kit & jersey (if selected)' },
                  { i: '🏟️', t: 'Stadium-grade grounds' },
                  { i: '👨‍🏫', t: 'Professional coaching' },
                  { i: '📺', t: 'TV coverage' },
                  { i: '✓', t: 'No auction fee — ever', highlight: true },
                  { i: '✓', t: 'No tournament fee — ever', highlight: true }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 16, color: item.highlight ? '#2E9E4F' : 'inherit', fontWeight: item.highlight ? 800 : 400 }}>{item.i}</span>
                    <span style={{ fontSize: 14, color: item.highlight ? '#fff' : 'rgba(255,255,255,0.8)', fontWeight: item.highlight ? 600 : 400 }}>{item.t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="glass" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>🔒</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Secure Payment</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>5,000+ Players Trusted</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>⭐</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Season 5 – 7th Year</span>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="glass" style={{ padding: 24, borderLeft: '4px solid #FF7A29' }}>
              <div style={{ color: '#E8B23D', fontSize: 14, letterSpacing: '2px', marginBottom: 12 }}>⭐⭐⭐⭐⭐</div>
              <p style={{ fontSize: 14, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 16 }}>
                "Registered on a Tuesday. Got shortlisted by Friday. Played my first match in 6 weeks. BCPL is real."
              </p>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                — Arjun S., Software Engineer, Pune | Delhi Dynamos
              </div>
            </div>

            {/* Mini FAQ */}
            <div className="glass" style={{ padding: 24 }}>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 16 }}>Quick FAQ</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>Can I get a refund?</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Yes, within 7 days of registration. After video upload, non-refundable.</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>Do I need to be good?</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>You need to be passionate. Coaches assess form and attitude.</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>Any hidden fees?</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Absolutely none. ₹299 is the total.</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />

      {/* Mobile Sticky Bottom CTA */}
      <div className="bot-cta" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 199, padding: '10px 16px 16px', background: 'rgba(6,16,30,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', gap: 10 }}>
        <button className="btn-primary" style={{ flex: 2, height: 50, fontSize: 15 }}>Register ₹299 →</button>
        <button className="btn-wa" style={{ flex: 1, height: 50, fontSize: 14, borderRadius: 12 }}>💬 WhatsApp</button>
      </div>

    </div>
  );
}
