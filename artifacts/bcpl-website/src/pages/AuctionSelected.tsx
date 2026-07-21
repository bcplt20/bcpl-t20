import React, { useState } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';

const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
const NAV_ROUTES: Record<string,string> = { 'Home':'', 'Match Center':'match-center', 'Teams':'teams', 'Sponsors':'sponsors', 'Photos':'photos', 'Videos':'videos', 'About':'about', 'FAQ':'faq', 'Contact':'contact' };
const BOOKING_REF = 'BCPL-S5-7432';

const TEAMS = [
  { name:'Rajasthan Scorchers', color:'#EF4444', abbr:'RS' },
  { name:'Punjab Warriors',     color:'#F59E0B', abbr:'PW' },
  { name:'Kolkata Tigers',      color:'#F97316', abbr:'KT' },
  { name:'Lucknow Nawabs',      color:'#8B5CF6', abbr:'LN' },
  { name:'Mumbai Mavericks',    color:'#3B82F6', abbr:'MM' },
  { name:'Hyderabad Hawks',     color:'#06B6D4', abbr:'HH' },
  { name:'Delhi Suryas',        color:'#FF7A29', abbr:'DS' },
  { name:'Chennai Thalaivas',   color:'#10B981', abbr:'CT' },
  { name:'Ahmedabad Lions',     color:'#EC4899', abbr:'AL' },
  { name:'Bengaluru Rockets',   color:'#22C55E', abbr:'BR' },
];

const ROADMAP = [
  { icon:'📝', label:'Register',     done:true  },
  { icon:'🎬', label:'Upload Video', done:true  },
  { icon:'🏟', label:'Phase 2 Trial',done:true  },
  { icon:'🪪', label:'KYC Done',     done:true  },
  { icon:'🔨', label:'Auction',      active:true },
  { icon:'🏆', label:'Play BCPL',    done:false },
];

export function AuctionSelected() {
  const [menuOpen, setMenuOpen] = useState(false);

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
        .btn-gold{background:linear-gradient(135deg,#E8B23D,#C49A1E);border:none;border-radius:12px;color:#060C18;font-family:Montserrat,sans-serif;font-weight:900;letter-spacing:.06em;cursor:pointer;transition:all .2s;text-transform:uppercase;min-height:44px;display:inline-flex;align-items:center;justify-content:center;}
        .btn-gold:hover{filter:brightness(1.1);transform:translateY(-2px)}
        .btn-outline{background:transparent;border:1px solid rgba(255,255,255,0.2);border-radius:12px;color:rgba(255,255,255,0.7);font-family:Montserrat,sans-serif;font-weight:700;cursor:pointer;transition:all .2s;min-height:44px;display:inline-flex;align-items:center;justify-content:center;}
        .btn-outline:hover{border-color:#E8B23D;color:#E8B23D}
        .cta-btn-group{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;}
        .cta-btn-group .btn-gold,.cta-btn-group .btn-outline{flex:1 1 180px;max-width:260px;}
        @media(max-width:480px){.cta-btn-group .btn-gold,.cta-btn-group .btn-outline{max-width:100%;}}
        .team-bid-card{background:#0A1727;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;transition:border-color .2s}
        .team-bid-card:hover{border-color:rgba(232,178,61,0.3)}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.1}}
        @keyframes pulseGold{0%,100%{box-shadow:0 0 0 0 rgba(232,178,61,0.5)}50%{box-shadow:0 0 0 16px rgba(232,178,61,0)}}
        @keyframes glowGold{0%,100%{box-shadow:0 0 20px rgba(232,178,61,0.3),0 0 40px rgba(232,178,61,0.1);border-color:rgba(232,178,61,0.6)}50%{box-shadow:0 0 50px rgba(232,178,61,0.8),0 0 90px rgba(232,178,61,0.3);border-color:#E8B23D}}
        @keyframes scaleIn{from{transform:scale(0.75);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes starPop{0%{transform:scale(0) rotate(0deg);opacity:0}60%{transform:scale(1.3) rotate(10deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}
        .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimGold 3s linear infinite}
        .mob-menu{position:fixed;top:0;left:0;right:0;bottom:0;background:#06101E;z-index:999;display:flex;flex-direction:column;padding:80px 32px 32px;gap:24px;overflow-y:auto}
        .mob-menu-link{font-family:Montserrat,sans-serif;font-weight:800;font-size:18px;letter-spacing:.06em;color:rgba(255,255,255,0.8);text-transform:uppercase;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:20px}
        .close-btn{position:fixed;top:20px;right:24px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;z-index:1000}
        .node-done{background:linear-gradient(135deg,#E8B23D,#C49A1E);border:none}
        .node-active{background:rgba(232,178,61,0.15);border:2px solid #E8B23D;animation:pulseGold 2s infinite}
        .node-pending{background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.15)}
        .roadmap-rail{display:flex;flex-wrap:wrap;gap:0;justify-content:center}
        @media(max-width:600px){.roadmap-rail{gap:0}}
        .rail-item{display:flex;flex-direction:column;align-items:center;flex:1;min-width:80px;max-width:120px}
        .rail-conn{flex:1;height:2px;align-self:center;margin-top:-30px;min-width:20px;max-width:60px}
      `}</style>

      {/* TICKER */}
      <div style={{ background:'linear-gradient(90deg,#C9960E,#E8B23D,#C49A1E,#E8B23D,#C9960E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 28s linear infinite' }}>
          {[...Array(4)].map((_,i)=>(
            <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#060C18' }}>
              &nbsp;&nbsp;&nbsp;🏆 AUCTION SHORTLISTED · BCPL SEASON 5 · REF: {BOOKING_REF} · FRANCHISE AUCTION COMING · ₹6 CR PRIZE POOL · #OfficeSeStadiumtak&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* NAVBAR */}
      <nav style={{ position:'sticky', top:0, zIndex:200, background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="wrap" style={{ height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:2 }}>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#FF7A29' }}>BCPL</span>
            <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff' }}>T20</span>
          </div>
          <nav className="desk-nav">
            {NAV.map(l=><a key={l} href="#" style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:12, color:'rgba(255,255,255,0.6)', textDecoration:'none', letterSpacing:'.08em', textTransform:'uppercase' }}>{l}</a>)}
          </nav>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.3)', borderRadius:12, padding:'6px 14px', fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'#E8B23D', letterSpacing:'.06em' }}>
              🔨 AUCTION SHORTLISTED
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
          {NAV.map(l=><div key={l} className="mob-menu-link" onClick={()=>setMenuOpen(false)}>{l}</div>)}
        </div>
      )}

      {/* HERO — AUCTION SHORTLISTED */}
      <section style={{ padding:'60px 0 0', background:'linear-gradient(180deg,#06101E 0%,#081420 100%)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%,rgba(232,178,61,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,#E8B23D,#FFD700,#E8B23D,transparent)' }} />

        <div className="wrap" style={{ position:'relative', zIndex:1 }}>
          {/* Star badge */}
          <div style={{ textAlign:'center', marginBottom:32, animation:'fadeUp 0.6s ease both' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:12, background:'rgba(232,178,61,0.1)', border:'1px solid rgba(232,178,61,0.35)', borderRadius:12, padding:'8px 20px', marginBottom:24 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#E8B23D', display:'inline-block', animation:'liveBlip 1.2s infinite' }} />
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'#E8B23D', letterSpacing:'.12em' }}>BCPL SEASON 5 · FRANCHISE AUCTION</span>
            </div>

            <div style={{ fontSize:80, animation:'starPop 0.6s 0.1s ease both', marginBottom:16 }}>🏆</div>
            <h1 style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(28px,6vw,64px)', lineHeight:1.05, color:'#fff', textTransform:'uppercase', marginBottom:16, letterSpacing:'-0.01em' }}>
              YOU ARE <span className="shimmer-gold">AUCTION</span><br/>SHORTLISTED
            </h1>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(14px,2vw,17px)', color:'rgba(255,255,255,0.6)', lineHeight:1.6, maxWidth:520, margin:'0 auto 32px' }}>
              Congratulations! All 10 BCPL franchise coaches have reviewed your trial performance. Your profile is now live for the Season 5 Franchise Auction.
            </p>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'rgba(255,255,255,0.35)', letterSpacing:'.12em', marginBottom:40 }}>
              PLAYER REF · <span style={{ color:'#E8B23D' }}>{BOOKING_REF}</span>
            </div>
          </div>

          {/* Player Auction Card */}
          <div style={{ maxWidth:540, margin:'0 auto 48px', background:'linear-gradient(135deg,#0E1C30,#0A1727)', border:'2px solid rgba(232,178,61,0.4)', borderRadius:12, padding:'28px 24px', position:'relative', animation:'glowGold 3s ease-in-out infinite', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, right:0, width:120, height:120, background:'radial-gradient(circle at top right,rgba(232,178,61,0.1) 0%,transparent 70%)', pointerEvents:'none' }} />
            <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
              <div style={{ width:64, height:64, borderRadius:12, background:'linear-gradient(135deg,#E8B23D,#C49A1E)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:24, color:'#060C18', flexShrink:0 }}>RS</div>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'#E8B23D', letterSpacing:'.1em', marginBottom:4 }}>AUCTION PLAYER CARD</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:22, color:'#fff', marginBottom:4 }}>Rahul Sharma</div>
                <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>Batsman · Mumbai · 28 yrs</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ background:'rgba(255,122,41,0.15)', border:'1px solid rgba(255,122,41,0.3)', padding:'3px 10px', fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:800, color:'#FF7A29', borderRadius:12 }}>P1 SELECTED</span>
                  <span style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', padding:'3px 10px', fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:800, color:'#22C55E', borderRadius:12 }}>P2 CLEARED</span>
                  <span style={{ background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.3)', padding:'3px 10px', fontSize:11, fontFamily:'Montserrat,sans-serif', fontWeight:800, color:'#E8B23D', borderRadius:12 }}>KYC VERIFIED</span>
                </div>
              </div>
              <div style={{ textAlign:'right', minWidth:100 }}>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em', marginBottom:4 }}>BASE PRICE</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:24, color:'#E8B23D' }}>₹1L</div>
                <div style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Starting bid</div>
              </div>
            </div>
            <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em' }}>REF · {BOOKING_REF}</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'.1em' }}>SEASON 5 · BCPL</div>
            </div>
          </div>
        </div>

        {/* Gold gradient bottom fade */}
        <div style={{ height:80, background:'linear-gradient(180deg,transparent,#060C18)', marginTop:-10 }} />
      </section>

      <div className="wrap">
        {/* JOURNEY RAIL */}
        <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'28px 20px', marginBottom:24, overflowX:'auto' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'.12em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', marginBottom:20 }}>YOUR JOURNEY SO FAR</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', minWidth:440 }}>
            {ROADMAP.map((step,i)=>(
              <React.Fragment key={i}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                    ...(step.done ? { background:'linear-gradient(135deg,#E8B23D,#C49A1E)', border:'none' } :
                       step.active ? { background:'rgba(232,178,61,0.1)', border:'2px solid #E8B23D', animation:'pulseGold 2s infinite' } :
                       { background:'rgba(255,255,255,0.04)', border:'2px solid rgba(255,255,255,0.1)' })
                  }}>{step.done ? '✓' : step.icon}</div>
                  <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:step.active ? 800 : 700, fontSize:10, color:step.done||step.active ? '#E8B23D' : 'rgba(255,255,255,0.3)', textAlign:'center', letterSpacing:'.04em', maxWidth:64, lineHeight:1.3 }}>{step.label}</div>
                </div>
                {i<ROADMAP.length-1 && <div style={{ flex:1, height:2, background:step.done ? 'rgba(232,178,61,0.4)' : 'rgba(255,255,255,0.08)', margin:'0 4px', marginBottom:24 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* WHAT HAPPENS AT AUCTION */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,3vw,26px)', color:'#fff', marginBottom:4, textTransform:'uppercase', letterSpacing:'.02em' }}>What Happens at the Auction?</div>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:20 }}>Here's exactly what to expect on auction day.</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
            {[
              { icon:'📋', title:'Your Profile Goes Live', body:'All 10 franchise owners + coaching staff receive your full player profile — video, trial scores, and physical data.' },
              { icon:'🔨', title:'Franchises Place Bids', body:'Bidding starts at your base price (₹1L for Batsman). Each franchise can raise bids in ₹25K–₹1L increments.' },
              { icon:'💰', title:'Highest Bidder Signs You', body:'The franchise with the final highest bid secures you for Season 5. Payment is made to BCPL, you receive your team contract.' },
              { icon:'📱', title:'You Are Notified Live', body:'You will receive an SMS + WhatsApp alert the moment your name is called and when bidding concludes.' },
            ].map(card=>(
              <div key={card.title} style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.07)', padding:'20px 20px', borderRadius:12 }}>
                <div style={{ fontSize:28, marginBottom:10 }}>{card.icon}</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:14, color:'#fff', marginBottom:6 }}>{card.title}</div>
                <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>{card.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ALL 10 FRANCHISE TEAMS */}
        <div style={{ background:'#0A1727', border:'1px solid rgba(232,178,61,0.2)', borderRadius:12, padding:'24px 20px', marginBottom:24 }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'#E8B23D', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:4 }}>ALL 10 FRANCHISES</div>
          <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:16 }}>Any of these teams may bid on you. Auction result is announced live.</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8 }}>
            {TEAMS.map(t=>(
              <div key={t.name} style={{ background:'#060C18', border:`1px solid ${t.color}22`, borderRadius:12, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:12, background:`linear-gradient(135deg,${t.color}33,${t.color}11)`, border:`1px solid ${t.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:t.color, flexShrink:0 }}>{t.abbr}</div>
                <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:10, color:'rgba(255,255,255,0.7)', lineHeight:1.2 }}>{t.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AUCTION DATE */}
        <div style={{ background:'linear-gradient(135deg,#0E1C30,#06101E)', border:'2px solid rgba(232,178,61,0.35)', borderRadius:12, padding:'28px 24px', marginBottom:24, textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%,rgba(232,178,61,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:11, color:'rgba(255,255,255,0.35)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:8 }}>Season 5 · Franchise Auction</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(18px,3vw,28px)', color:'#E8B23D', marginBottom:4, textTransform:'uppercase' }}>AUGUST 2026</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:20 }}>Exact date & venue to be announced via WhatsApp/Email</div>
            <div className="cta-btn-group">
              <button className="btn-gold" style={{ padding:'13px 28px', fontSize:13 }}
                onClick={() => { const msg = encodeURIComponent('🏆 Remind me about BCPL Season 5 Franchise Auction — August 2026! #OfficeSeStadiumtak'); window.open(`https://wa.me/918800000000?text=${msg}`, '_blank'); }}>SET AUCTION REMINDER →</button>
              <button className="btn-outline" style={{ padding:'13px 24px', fontSize:13 }}
                onClick={() => { const BASE = import.meta.env.BASE_URL; const logoUrl = `${window.location.origin}${BASE}bcpl-assets/bcpl-logo-white.png`; const w = window.open('', '_blank'); if (!w) return; w.document.write(`<!DOCTYPE html><html><head><title>BCPL Player Profile — ${BOOKING_REF}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#06101E;color:#F0EDE8;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{max-width:680px;margin:0 auto;padding:40px 36px}.header{display:flex;align-items:center;gap:20px;padding:24px 36px;background:linear-gradient(135deg,#0A1A30,#06101E);border-bottom:3px solid #FF7A29;margin:-40px -36px 32px}.logo{width:60px;height:60px;object-fit:contain}.brand{font-size:20px;font-weight:900;color:#FF7A29;font-family:Arial,sans-serif}.sub{font-size:11px;color:rgba(255,255,255,0.4);margin-top:3px}.title{font-size:18px;font-weight:900;color:#E8B23D;font-family:Arial,sans-serif;margin-bottom:20px;text-transform:uppercase;letter-spacing:.1em}.row{display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.06);padding:10px 0;font-size:13px}.row-label{color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.row-val{color:#F0EDE8;font-weight:700}.ref{font-family:monospace;color:#FF7A29;font-size:15px}.tagline{text-align:center;margin-top:32px;font-size:12px;font-weight:800;color:#E8B23D;letter-spacing:.1em}@media print{body{background:#06101E}}</style></head><body><div class="page"><div class="header"><img class="logo" src="${logoUrl}" alt="BCPL"/><div><div class="brand">BCPL — Bhartiya Corporate Premier League</div><div class="sub">Season 5 · Franchise Auction Shortlisted</div></div></div><div class="title">Player Profile</div><div class="row"><span class="row-label">Reference No.</span><span class="row-val ref">${BOOKING_REF}</span></div><div class="row"><span class="row-label">Player Name</span><span class="row-val">Rahul Sharma</span></div><div class="row"><span class="row-label">Role</span><span class="row-val">🏏 Batsman</span></div><div class="row"><span class="row-label">Trial City</span><span class="row-val">📍 Mumbai</span></div><div class="row"><span class="row-label">Phase 2 Status</span><span class="row-val" style="color:#22C55E">Trial Cleared ✓</span></div><div class="row"><span class="row-label">Auction Status</span><span class="row-val" style="color:#E8B23D">Shortlisted ✓</span></div><div class="row"><span class="row-label">Assigned Team</span><span class="row-val">Mumbai Mavericks</span></div><div class="row"><span class="row-label">Contract Value</span><span class="row-val">₹8,50,000</span></div><div class="tagline">#OfficeSeStadiumtak</div></div></body></html>`); w.document.close(); setTimeout(() => w.print(), 600); }}>DOWNLOAD PLAYER PROFILE</button>
            </div>
          </div>
        </div>

        {/* NOTICE */}
        <div style={{ background:'rgba(232,178,61,0.05)', border:'1px solid rgba(232,178,61,0.2)', borderRadius:12, padding:'16px 20px', display:'flex', gap:14, alignItems:'flex-start' }}>
          <span style={{ fontSize:20, flexShrink:0 }}>📱</span>
          <div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:12, color:'#E8B23D', marginBottom:4, textTransform:'uppercase', letterSpacing:'.06em' }}>Stay Ready</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
              Keep your phone on. The moment auction bidding opens for your profile, you'll receive a live notification. Your franchise manager will contact you directly within 24 hours of the auction close.
            </div>
          </div>
        </div>
      </div>

      <BCPLFooter />
    </div>
  );
}
