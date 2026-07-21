import React, { useState, useEffect } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';

const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
const NAV_ROUTES: Record<string,string> = { 'Home':'', 'Match Center':'match-center', 'Teams':'teams', 'Sponsors':'sponsors', 'Photos':'photos', 'Videos':'videos', 'About':'about', 'FAQ':'faq', 'Contact':'contact' };
const BOOKING_REF = 'BCPL-S5-7432';

const BIDS = [
  { team:'Mumbai Mavericks',   color:'#3B82F6', abbr:'MM', amount:'₹8,50,000', time:'2 min ago',  current:true  },
  { team:'Delhi Suryas',       color:'#FF7A29', abbr:'DS', amount:'₹7,00,000', time:'8 min ago',  current:false },
  { team:'Kolkata Tigers',     color:'#F97316', abbr:'KT', amount:'₹5,50,000', time:'14 min ago', current:false },
  { team:'Chennai Thalaivas',  color:'#10B981', abbr:'CT', amount:'₹4,00,000', time:'21 min ago', current:false },
  { team:'Rajasthan Scorchers',color:'#EF4444', abbr:'RS', amount:'₹2,50,000', time:'28 min ago', current:false },
  { team:'Base Price',         color:'rgba(255,255,255,0.2)', abbr:'—', amount:'₹1,00,000', time:'Start', current:false },
];

const ROADMAP = [
  { icon:'📝', label:'Register',     done:true  },
  { icon:'🎬', label:'Video',        done:true  },
  { icon:'🏟', label:'Phase 2',      done:true  },
  { icon:'🪪', label:'KYC',          done:true  },
  { icon:'🔨', label:'Auction',      active:true },
  { icon:'🏆', label:'Play BCPL',    done:false },
];

export function AuctionLive() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [bidCount, setBidCount]   = useState(5);
  const [elapsed, setElapsed]     = useState(31);

  useEffect(()=>{
    const t = setInterval(()=>{
      setElapsed(e => e+1);
    }, 60000);
    return ()=>clearInterval(t);
  }, []);

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', fontFamily:"'Inter',sans-serif", color:'#F0EDE8', overflowX:'hidden', paddingBottom:100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .wrap{max-width:1100px;margin:0 auto;padding:0 16px}
        @media(min-width:640px){.wrap{padding:0 24px}}
        @media(min-width:1024px){.wrap{padding:0 40px}}
        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}
        .btn-gold{background:linear-gradient(135deg,#E8B23D,#C49A1E);border:none;border-radius:12px;color:#060C18;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:.06em;cursor:pointer;transition:all .2s;text-transform:uppercase}
        .btn-gold:hover{filter:brightness(1.1);transform:translateY(-2px)}
        .bid-row{display:flex;align-items:center;gap:12;padding:14px 16px;border-radius:12px;transition:all .2s}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.05}}
        @keyframes livePulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.6)}50%{box-shadow:0 0 0 14px rgba(239,68,68,0)}}
        @keyframes pulseGold{0%,100%{box-shadow:0 0 0 0 rgba(232,178,61,0.5)}50%{box-shadow:0 0 0 12px rgba(232,178,61,0)}}
        @keyframes bidSlide{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowBlue{0%,100%{box-shadow:0 0 20px rgba(59,130,246,0.3)}50%{box-shadow:0 0 50px rgba(59,130,246,0.6)}}
        @keyframes counterUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimGold 2s linear infinite}
        .mob-menu{position:fixed;top:0;left:0;right:0;bottom:0;background:#06101E;z-index:999;display:flex;flex-direction:column;padding:80px 32px 32px;gap:24px;overflow-y:auto}
        .mob-menu-link{font-family:Montserrat,sans-serif;font-weight:800;font-size:18px;color:rgba(255,255,255,0.8);text-transform:uppercase;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:20px}
        .close-btn{position:fixed;top:20px;right:24px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;z-index:1000}
      `}</style>

      {/* LIVE TICKER — RED */}
      <div style={{ background:'#EF4444', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 20s linear infinite' }}>
          {[...Array(6)].map((_,i)=>(
            <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff' }}>
              &nbsp;&nbsp;&nbsp;🔴 LIVE AUCTION · {BOOKING_REF} · CURRENT BID ₹8,50,000 · MUMBAI MAVERICKS LEADING · BIDDING IN PROGRESS&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* NAVBAR */}
      <nav style={{ position:'sticky', top:0, zIndex:200, background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(239,68,68,0.25)' }}>
        <div className="wrap" style={{ height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <a href="/" style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:8, flexShrink:0, whiteSpace:'nowrap', textDecoration:'none' }}>
            <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL"
              style={{ height:36, maxWidth:100, width:'auto', objectFit:'contain', display:'block', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))', flexShrink:0 }}/>
            <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px', flexShrink:0 }}>
              <span style={{ fontSize:9 }}>🏆</span>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
            </div>
          </a>
          <nav className="desk-nav">
            {NAV.map(l=><a key={l} href={'/' + NAV_ROUTES[l]} style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'rgba(255,255,255,0.6)', textDecoration:'none', letterSpacing:'.08em', textTransform:'uppercase' }}>{l}</a>)}
          </nav>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:12, padding:'6px 14px' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444', display:'inline-block', animation:'liveBlip 0.8s infinite' }} />
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'#EF4444', letterSpacing:'.08em' }}>AUCTION LIVE</span>
            </div>
            <button className="ham-btn" onClick={()=>setMenuOpen(true)}>
              {[0,1,2].map(i=><span key={i} style={{ width:24, height:2, background:'#fff', display:'block' }} />)}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="mob-menu">
          <button className="close-btn" onClick={()=>setMenuOpen(false)}>✕</button>
          {NAV.map(l=><a key={l} href={'/' + NAV_ROUTES[l]} className="mob-menu-link" onClick={()=>setMenuOpen(false)} style={{textDecoration:'none'}}>{l}</a>)}
        </div>
      )}

      {/* HERO — AUCTION LIVE */}
      <section style={{ padding:'48px 0 0', background:'linear-gradient(180deg,#06101E 0%,#081218 100%)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 50% at 50% 0%,rgba(59,130,246,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,#EF4444,#FF7A29,#EF4444,transparent)', animation:'shimGold 2s linear infinite' }} />

        <div className="wrap" style={{ position:'relative', zIndex:1 }}>
          <div style={{ textAlign:'center', marginBottom:40, animation:'fadeUp 0.5s ease both' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:12, padding:'8px 20px', marginBottom:20, animation:'livePulse 1.5s infinite' }}>
              <span style={{ width:9, height:9, borderRadius:'50%', background:'#EF4444', display:'inline-block', animation:'liveBlip 0.8s infinite' }} />
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, color:'#EF4444', letterSpacing:'.14em' }}>🔴 AUCTION LIVE NOW</span>
            </div>

            <img src={import.meta.env.BASE_URL + 'bcpl-assets/role-icons/auction.png'} alt="Auction"
              style={{ height:72, width:72, objectFit:'contain', margin:'12px auto 16px', display:'block', filter:'drop-shadow(0 4px 20px rgba(239,68,68,0.5)) brightness(1.1)' }}/>
            <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(24px,5vw,56px)', lineHeight:1.05, color:'#fff', textTransform:'uppercase', marginBottom:8, letterSpacing:'-0.01em' }}>
              YOUR NAME IS<br/>
              <span className="shimmer-gold">LIVE IN THE AUCTION</span>
            </h1>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(14px,2vw,16px)', color:'rgba(255,255,255,0.55)', lineHeight:1.6, maxWidth:460, margin:'0 auto 8px' }}>
              Franchise coaches are bidding on you right now. The highest bid wins your contract for BCPL Season 5.
            </p>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'rgba(255,255,255,0.25)', letterSpacing:'.12em' }}>REF · {BOOKING_REF} · {elapsed} MINS ELAPSED</div>
          </div>

          {/* CURRENT BID HERO */}
          <div style={{ maxWidth:480, margin:'0 auto 48px', background:'linear-gradient(135deg,#0A1828,#06101E)', border:'2px solid #3B82F6', borderRadius:12, padding:'28px 24px', textAlign:'center', position:'relative', overflow:'hidden', animation:'glowBlue 3s ease-in-out infinite' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%,rgba(59,130,246,0.1) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:12, background:'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, color:'#3B82F6' }}>MM</div>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:'.08em' }}>CURRENT LEADER</div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:15, color:'#fff' }}>Mumbai Mavericks</div>
                </div>
              </div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(36px,8vw,72px)', color:'#3B82F6', lineHeight:1, marginBottom:4, animation:'counterUp 0.5s ease both' }}>₹8,50,000</div>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.4)' }}>Bid placed 2 minutes ago · 5 bids total</div>
            </div>
          </div>
        </div>
        <div style={{ height:60, background:'linear-gradient(180deg,transparent,#060C18)' }} />
      </section>

      <div className="wrap">
        {/* JOURNEY RAIL */}
        <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'24px 20px', marginBottom:24, overflowX:'auto' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'.12em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', marginBottom:20 }}>JOURNEY PROGRESS</div>
          <div style={{ display:'flex', alignItems:'center', minWidth:440 }}>
            {ROADMAP.map((step,i)=>(
              <React.Fragment key={i}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                    ...(step.done ? { background:'linear-gradient(135deg,#E8B23D,#C49A1E)' } :
                       step.active ? { background:'rgba(239,68,68,0.1)', border:'2px solid #EF4444', animation:'livePulse 1.5s infinite' } :
                       { background:'rgba(255,255,255,0.04)', border:'2px solid rgba(255,255,255,0.1)' })
                  }}>{step.done ? '✓' : step.icon}</div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:step.active ? 800 : 700, fontSize:10, color:step.done ? '#E8B23D' : step.active ? '#EF4444' : 'rgba(255,255,255,0.3)', textAlign:'center', letterSpacing:'.04em', lineHeight:1.3 }}>{step.label}</div>
                </div>
                {i<ROADMAP.length-1 && <div style={{ flex:1, height:2, background:step.done ? 'rgba(232,178,61,0.4)' : 'rgba(255,255,255,0.08)', margin:'0 4px', marginBottom:24 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* BID HISTORY */}
        <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'24px 20px', marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(16px,2.5vw,20px)', color:'#fff', textTransform:'uppercase' }}>Bid History</div>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2 }}>5 franchises have bid on your profile</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:12, padding:'6px 14px' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#EF4444', display:'inline-block', animation:'liveBlip 0.8s infinite' }} />
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'#EF4444', letterSpacing:'.08em' }}>LIVE</span>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {BIDS.map((bid,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:12, background:bid.current ? 'rgba(59,130,246,0.08)' : i===0 ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)', border:`1px solid ${bid.current ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)'}`, animation: i===0 ? 'bidSlide 0.3s ease both' : 'none' }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:12, color:'rgba(255,255,255,0.25)', width:24, flexShrink:0 }}>#{BIDS.length-i}</div>
                <div style={{ width:36, height:36, borderRadius:12, background:`${bid.color}22`, border:`1px solid ${bid.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, color:bid.color, flexShrink:0 }}>{bid.abbr}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:13, color:bid.current ? '#fff' : 'rgba(255,255,255,0.65)' }}>{bid.team}</div>
                  <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{bid.time}</div>
                </div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(14px,2vw,18px)', color:bid.current ? '#3B82F6' : 'rgba(255,255,255,0.5)' }}>{bid.amount}</div>
                {bid.current && <div style={{ background:'#3B82F6', borderRadius:12, padding:'3px 8px', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:9, color:'#fff', letterSpacing:'.08em', flexShrink:0 }}>LEADING</div>}
              </div>
            ))}
          </div>
        </div>

        {/* NOTICE */}
        <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:12, padding:'18px 20px', display:'flex', gap:14 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>⏳</span>
          <div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'#3B82F6', marginBottom:4, letterSpacing:'.06em' }}>AUCTION CLOSING SOON</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>
              Bidding closes when no new bid is placed for 3 consecutive minutes. You will be notified via SMS + WhatsApp the moment your auction concludes. Keep your phone on and close.
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <BCPLFooter />
    </div>
  );
}
