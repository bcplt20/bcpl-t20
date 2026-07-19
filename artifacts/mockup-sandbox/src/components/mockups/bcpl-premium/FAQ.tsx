import React, { useState } from 'react';

function Navbar({active=''}: {active?: string}) {
  const links=[['Home','home'],['Schedule','schedule'],['Match Center','matchcenter'],['Teams','teams'],['Points Table','points'],['About','about']];
  return (
    <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(10,22,40,0.97)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'0 40px'}}>
      <div style={{maxWidth:1200,margin:'0 auto',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:22}}>
          <span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:4}}>T20</span>
          <span style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:600,marginLeft:10,fontFamily:'Inter,sans-serif',textTransform:'uppercase',letterSpacing:'0.12em'}}>Bhartiya Corporate Premier League</span>
        </div>
        <div style={{display:'flex',gap:24,alignItems:'center'}}>
          {links.map(([label,key])=>(
            <a key={key} href="#" style={{color:active===key?'#FF7A29':'rgba(255,255,255,0.7)',fontWeight:600,fontSize:13.5,textDecoration:'none',fontFamily:'Inter,sans-serif',borderBottom:active===key?'2px solid #FF7A29':'2px solid transparent',paddingBottom:2}}>{label}</a>
          ))}
          <button style={{background:'linear-gradient(135deg,#FF7A29,#E8611A)',color:'#fff',border:'none',borderRadius:10,padding:'10px 22px',fontWeight:700,fontSize:13.5,cursor:'pointer',boxShadow:'0 4px 20px rgba(255,122,41,0.4)',fontFamily:'Inter,sans-serif'}}>Register ₹299</button>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const footerSections: [string, string[]][] = [
    ['League',['Home','Schedule','Match Center','Teams','Points Table']],
    ['Info',['About BCPL','FAQ','Contact Us','Eligibility','Code of Conduct']],
    ['Legal',['Cricket Rulebook','Terms of Service','Privacy Policy']]
  ];
  return (
    <footer style={{background:'#06101E',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'56px 40px 32px',fontFamily:'Inter,sans-serif'}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1fr',gap:40,marginBottom:40}}>
          <div>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,marginBottom:10}}><span style={{color:'#FF7A29'}}>BCPL</span><span style={{color:'#fff',marginLeft:4}}>T20</span></div>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:12.5,lineHeight:1.7,margin:'0 0 20px'}}>Bhartiya Corporate Premier League. World's largest corporate cricket league for working professionals.</p>
            <div style={{display:'flex',gap:8}}>
              {['📸','▶️','🐦','📘'].map((ic,i)=><a key={i} href="#" style={{width:34,height:34,borderRadius:8,background:'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,textDecoration:'none',border:'1px solid rgba(255,255,255,0.08)'}}>{ic}</a>)}
            </div>
          </div>
          {footerSections.map(([title,links])=>(
            <div key={title}>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:14}}>{title}</div>
              {links.map(l=><div key={l} style={{marginBottom:9}}><a href="#" style={{color:'rgba(255,255,255,0.6)',fontSize:13,textDecoration:'none'}}>{l}</a></div>)}
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'rgba(255,255,255,0.3)',fontSize:12}}>© 2025 Kriparti Playing 11 Private Limited. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

export function FAQ() {
  const [activeTab, setActiveTab] = useState('All');
  const [openItems, setOpenItems] = useState<number[]>([1]); // Q1 open by default
  const [search, setSearch] = useState('');

  const toggleItem = (id: number) => {
    setOpenItems(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const categories = ['All', 'Registration', 'Format', 'Payment', 'Selection', 'Teams'];

  const faqs = [
    { id: 1, category: 'General', label: 'REGISTRATION', q: 'What is BCPL T20?', a: 'BCPL (Bhartiya Corporate Premier League) T20 is India\'s biggest corporate cricket league, exclusively for working professionals and corporate employees. Run by Kriparti Playing 11 Private Limited, BCPL gives talented cricketers who missed the professional route a real chance to play on a grand stage.' },
    { id: 2, category: 'Registration', label: null, q: 'Who is eligible to participate?', a: 'Any working professional or corporate employee across India. You must be currently employed (full-time, part-time, or self-employed). Students and professional cricketers contracted to state or national teams are not eligible.' },
    { id: 3, category: 'Payment', label: 'PAYMENT', q: 'What is the registration fee?', a: '₹299 for Batsman, Bowler, or Wicket-Keeper. ₹399 for All-Rounders. This is the ONLY fee you\'ll ever pay — no auction fee, no tournament fee, no hidden charges.' },
    { id: 4, category: 'Selection', label: 'SELECTION', q: 'How does the selection process work?', a: 'Submit a 2-minute playing video → Our scout panel reviews all videos → Shortlisted players invited to a physical trial → Selected players go into the player auction → Franchise teams bid for you → You play for your city!' },
    { id: 5, category: 'Selection', label: null, q: 'What happens if I\'m not shortlisted?', a: 'The registration fee is non-refundable, but you\'re free to apply again in the next season. Many players get selected on their second or third attempt.' },
    { id: 6, category: 'Format', label: 'FORMAT & CITIES', q: 'Which cities does BCPL operate in?', a: 'Season 5 features 10 city franchises: Delhi, Mumbai, Pune, Kolkata, Bangalore, Chennai, Hyderabad, Jaipur, Ahmedabad, and Surat.' },
    { id: 7, category: 'Payment', label: null, q: 'Do I need to pay for the auction or tournament?', a: 'Absolutely not. Once registered and selected, everything — auction, jersey, kit, coaching, grounds — is covered. ₹299/₹399 is your total investment.' },
    { id: 8, category: 'Selection', label: null, q: 'How long does the selection take?', a: 'Video review typically takes 2-3 weeks. Physical trials are held within 4 weeks of shortlisting. The entire process from registration to team announcement is usually 6-8 weeks.' },
    { id: 9, category: 'Teams', label: 'TEAMS', q: 'Can I register as a team?', a: 'No. BCPL is a player-first league. You register individually and are assigned to a franchise team through the auction process.' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(search.toLowerCase()) || faq.a.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'All' || faq.category === activeTab;
    if (activeTab === 'Registration' && faq.category === 'General') return matchesSearch;
    return matchesSearch && matchesTab;
  });

  return (
    <div style={{ backgroundColor: '#0A1628', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Navbar active="" />
      
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0F2247, #1a3a6e)', height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 48, margin: '0 0 16px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Frequently Asked Questions</h1>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.8)', margin: 0 }}>Everything you need to know about BCPL T20</p>
      </div>

      <div style={{ maxWidth: 800, margin: '-32px auto 0', padding: '0 40px', position: 'relative', zIndex: 10 }}>
        <div style={{ background: 'rgba(15,34,71,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
          <span style={{ fontSize: 20, marginLeft: 8 }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search questions..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 16, outline: 'none', padding: '8px' }} 
          />
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '48px auto', padding: '0 40px', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveTab(cat)}
            style={{ 
              background: activeTab === cat ? '#FF7A29' : 'rgba(255,255,255,0.05)',
              border: activeTab === cat ? '1px solid #FF7A29' : '1px solid rgba(255,255,255,0.1)',
              color: activeTab === cat ? '#fff' : 'rgba(255,255,255,0.7)',
              padding: '10px 24px',
              borderRadius: 30,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto 80px', padding: '0 40px' }}>
        {filteredFaqs.map((faq) => {
          const isOpen = openItems.includes(faq.id);
          
          return (
            <div key={faq.id} style={{ marginBottom: 16 }}>
              {faq.label && activeTab === 'All' && !search && (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '32px 0 16px 16px' }}>
                  {faq.label}
                </div>
              )}
              <div 
                style={{ 
                  background: 'rgba(15,34,71,0.6)', 
                  backdropFilter: 'blur(20px)', 
                  border: '1px solid rgba(255,255,255,0.10)', 
                  borderRadius: 16, 
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                <button 
                  onClick={() => toggleItem(faq.id)}
                  style={{ 
                    width: '100%', 
                    background: 'transparent', 
                    border: 'none', 
                    padding: '24px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    color: '#fff', 
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600, color: isOpen ? '#FF7A29' : '#fff', paddingRight: 24, lineHeight: 1.5 }}>
                    {faq.q}
                  </span>
                  <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                    ▼
                  </span>
                </button>
                <div style={{ 
                  maxHeight: isOpen ? 500 : 0, 
                  opacity: isOpen ? 1 : 0,
                  transition: 'all 0.3s ease-in-out',
                  padding: isOpen ? '0 24px 24px' : '0 24px',
                  pointerEvents: isOpen ? 'auto' : 'none'
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredFaqs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.5)' }}>
            No questions found matching your search.
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
