import React, { useState } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';

export function Phase1PaymentReceipt() {
  const [menuOpen, setMenuOpen] = useState(false);
  const NAV = ['Home','Match Center','Teams','Sponsors','Photos','Videos','About','FAQ','Contact'];
const NAV_ROUTES: Record<string,string> = { 'Home':'', 'Match Center':'match-center', 'Teams':'teams', 'Sponsors':'sponsors', 'Photos':'photos', 'Videos':'videos', 'About':'about', 'FAQ':'faq', 'Contact':'contact' };

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', color:'#F0EDE8', fontFamily:"'Inter',sans-serif", overflowX:'hidden', paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes checkPop{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.18) rotate(6deg);opacity:1}80%{transform:scale(0.94)}100%{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes ringPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}50%{box-shadow:0 0 0 18px rgba(34,197,94,0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes barcodeScan{0%{opacity:0.3}50%{opacity:1}100%{opacity:0.3}}

        .wrap{max-width:1100px;margin:0 auto;padding:0 16px}
        @media(min-width:768px){.wrap{padding:0 32px}}

        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}

        .btn-primary{
          background:linear-gradient(135deg,#FF7A29,#D95E10);
          border:none;border-radius:12px;color:#fff;
          font-family:Montserrat,sans-serif;font-weight:900;
          letter-spacing:0.06em;cursor:pointer;
          transition:transform .15s,filter .2s;
        }
        .btn-primary:hover{filter:brightness(1.15);transform:translateY(-2px)}

        .receipt-row{
          display:flex;justify-content:space-between;align-items:flex-start;
          padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.05);
          font-size:13px;gap:8px;
        }
        .receipt-row:last-child{border-bottom:none}
        .receipt-label{color:rgba(255,255,255,0.4);font-weight:600;letter-spacing:.04em;flex-shrink:0}
        .receipt-val{color:#F0EDE8;font-weight:700;text-align:right;word-break:break-all}

        .next-steps-grid{display:grid;grid-template-columns:1fr;gap:14px}
        @media(min-width:600px){.next-steps-grid{grid-template-columns:repeat(3,1fr)}}

        .next-card{
          background:#0A1727;border:1px solid rgba(255,255,255,0.08);border-radius:12px;
          padding:22px 20px;
          transition:border-color .2s,transform .2s;
        }
        .next-card:hover{border-color:rgba(255,122,41,0.35);transform:translateY(-3px)}

        .share-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .share-btn{
          display:flex;align-items:center;justify-content:center;gap:8px;
          padding:14px 22px;border-radius:12px;font-family:Montserrat,sans-serif;
          font-weight:800;font-size:13px;letter-spacing:.06em;cursor:pointer;
          border:none;transition:filter .2s,transform .15s;
          width:100%;
        }
        @media(min-width:480px){.share-btn{width:auto}}
        .share-btn:hover{filter:brightness(1.12);transform:translateY(-2px)}

        .barcode-line{display:inline-block;width:2px;margin:0 0.5px;background:rgba(255,255,255,0.85);animation:barcodeScan 2.5s ease-in-out infinite}

        .fade-up{animation:fadeUp .5s cubic-bezier(.34,1.56,.64,1) both}
        .fade-up-1{animation-delay:.1s}
        .fade-up-2{animation-delay:.25s}
        .fade-up-3{animation-delay:.4s}
        .fade-up-4{animation-delay:.55s}
        .fade-up-5{animation-delay:.7s}

        .ticket-wrap{background:#0A1727;border:1px solid rgba(255,122,41,0.35);position:relative;overflow:hidden;width:100%;max-width:100%}
        .ticket-notch-l{position:absolute;left:-10px;top:50%;transform:translateY(-50%);width:20px;height:20px;border-radius:50%;background:#06101E;border:1px solid rgba(255,122,41,0.35)}
        .ticket-notch-r{position:absolute;right:-10px;top:50%;transform:translateY(-50%);width:20px;height:20px;border-radius:50%;background:#06101E;border:1px solid rgba(255,122,41,0.35)}
        @media(max-width:480px){.ticket-notch-l,.ticket-notch-r{display:none}}

        .barcode-wrap{background:#060C18;padding:14px 20px;display:flex;align-items:flex-end;gap:0;border-top:1px solid rgba(255,255,255,0.05);overflow:hidden}
      `}</style>

      <div style={{ position:'sticky', top:0, zIndex:300 }}>
      {/* ── TICKER ── */}
      <div style={{ background:'linear-gradient(90deg,#C94E0E,#FF7A29,#E8611A,#FF7A29,#C94E0E)', backgroundSize:'300% 100%', animation:'gradShift 4s ease infinite', overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickerScroll 30s linear infinite' }}>
          {[...Array(4)].map((_,i) => (
            <span key={i} style={{ fontSize:11, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', color:'#fff' }}>
              &nbsp;🏏 SEASON 5 REGISTRATIONS OPEN &nbsp;·&nbsp; ₹6 CR PRIZE POOL &nbsp;·&nbsp; 50+ CITIES &nbsp;·&nbsp; 10 FRANCHISE TEAMS &nbsp;·&nbsp; #OfficeSeStadiumtak &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ background:'rgba(6,16,30,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ height:2, background:'linear-gradient(90deg,#FF7A29,#E8B23D,#FF7A29)', backgroundSize:'200%', animation:'shimGold 4s linear infinite' }} />
        <div className="wrap" style={{ height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
                          <img src={import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-white.png'} alt="BCPL" style={{ height:42, width:'auto', objectFit:'contain', display:'block', filter:'brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}/>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,178,61,0.12)', border:'1px solid rgba(232,178,61,0.5)', borderRadius:6, padding:'3px 10px' }}>
                <span style={{ fontSize:9 }}>🏆</span>
                <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:9, color:'#E8B23D', letterSpacing:'.12em' }}>SEASON 5</span>
              </div>
          </a>
          <div className="desk-nav">
            {NAV.map(l => <a key={l} href={'/' + NAV_ROUTES[l]} style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, textDecoration:'none', letterSpacing:'.04em' }}>{l}</a>)}
            <button className="btn-primary" onClick={()=>{window.location.href='/'+import.meta.env.BASE_URL.replace(/^\//,'');}} style={{ padding:'10px 24px', fontSize:12 }}>HOME →</button>
          </div>
          <button className="ham-btn" onClick={() => setMenuOpen(o => !o)}>
            {[0,1,2].map(i => <span key={i} style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:1, transition:'all .25s', transform: i===0&&menuOpen ? 'rotate(45deg) translate(5px,5px)' : i===1&&menuOpen ? 'scaleX(0)' : i===2&&menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : '' }} />)}
          </button>
        </div>
      </nav>
      </div>{/* /sticky-top */}

      {menuOpen && (
        <div style={{ position:'fixed', inset:0, background:'#040C18', zIndex:400, display:'flex', flexDirection:'column', padding:'72px 24px 40px', overflowY:'auto' }}>
          <button onClick={() => setMenuOpen(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', width:38, height:38, borderRadius:4, cursor:'pointer', fontSize:18 }}>✕</button>
          {NAV.map(l => <a key={l} href={'/' + NAV_ROUTES[l]} onClick={()=>setMenuOpen(false)} style={{ color:'rgba(255,255,255,0.85)', fontWeight:700, fontSize:18, fontFamily:'Montserrat,sans-serif', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{l}</a>)}
          <button className="btn-primary" onClick={()=>{ setMenuOpen(false); window.location.href = import.meta.env.BASE_URL; }} style={{ marginTop:24, padding:'16px', fontSize:15 }}>HOME →</button>
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{ position:'relative', overflow:'hidden', background:'linear-gradient(180deg,#06101E 0%,#060C18 100%)', paddingTop:60, paddingBottom:56, textAlign:'center' }}>
        <div style={{ position:'absolute', top:0, left:'-10%', width:'50%', height:'100%', background:'linear-gradient(135deg,rgba(34,197,94,0.06) 0%,transparent 60%)', transform:'skewX(-8deg)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:0, right:'-10%', width:'50%', height:'100%', background:'linear-gradient(225deg,rgba(34,197,94,0.04) 0%,transparent 60%)', transform:'skewX(-8deg)', pointerEvents:'none' }} />

        <div className="wrap">
          {/* Animated check circle */}
          <div className="fade-up" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:110, height:110, borderRadius:'50%', background:'rgba(34,197,94,0.12)', border:'3px solid #22C55E', marginBottom:32, animation:'ringPulse 2.5s ease-in-out infinite, fadeUp .5s ease both' }}>
            <div style={{ fontSize:52, animation:'checkPop .6s cubic-bezier(.34,1.56,.64,1) .2s both', display:'block' }}>✅</div>
          </div>

          <h1 className="fade-up fade-up-1" style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(30px,6vw,62px)', lineHeight:.95, letterSpacing:'-.02em', textTransform:'uppercase', marginBottom:10 }}>
            <span style={{ color:'#fff', display:'block' }}>ENTRY</span>
            <span style={{ color:'#22C55E', display:'block' }}>CONFIRMED.</span>
          </h1>
          <div className="fade-up fade-up-2" style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:'clamp(14px,3vw,24px)', color:'#FF7A29', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:20 }}>
            YOU'RE IN THE TRIALS.
          </div>

          {/* Player chips */}
          <div className="fade-up fade-up-3" style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginBottom:28 }}>
            {[
              { label:'🏏 Batsman', color:'#3B82F6' },
              { label:'📍 Mumbai', color:'#FF7A29' },
              { label:'BCPL Season 5', color:'#E8B23D' },
            ].map(c => (
              <span key={c.label} style={{ padding:'6px 16px', background:'rgba(255,255,255,0.05)', border:`1px solid ${c.color}44`, borderRadius:12, fontSize:12, fontWeight:700, fontFamily:'Montserrat,sans-serif', color:c.color, letterSpacing:'.06em' }}>
                {c.label}
              </span>
            ))}
          </div>

          {/* Booking ref */}
          <div className="fade-up fade-up-4" style={{ display:'inline-block', background:'#060C18', border:'1px solid rgba(255,122,41,0.4)', padding:'12px 20px', borderRadius:12, marginBottom:0, maxWidth:'100%', overflow:'hidden' }}>
            <div style={{ fontSize:9, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.18em', color:'rgba(255,255,255,0.35)', marginBottom:4 }}>REGISTRATION NUMBER</div>
            <div style={{ fontFamily:'monospace', fontSize:'clamp(13px,4vw,18px)', fontWeight:700, color:'#FF7A29', letterSpacing:'.12em', wordBreak:'break-all' }}>BCPL-MUM-7432</div>
          </div>
        </div>
      </div>

      {/* ── MATCH TICKET ── */}
      <div className="wrap fade-up fade-up-5" style={{ marginTop:40 }}>
        <div className="ticket-wrap">
          <div className="ticket-notch-l" />
          <div className="ticket-notch-r" />

          {/* Ticket header */}
          <div style={{ background:'linear-gradient(135deg,#C94E0E,#FF7A29,#E8611A)', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, letterSpacing:'.14em', color:'#fff', textTransform:'uppercase' }}>PHASE 1 TRIAL ENTRY</div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:700, fontSize:10, letterSpacing:'.12em', color:'rgba(255,255,255,0.75)', marginTop:2 }}>PAYMENT CONFIRMED</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.15)', padding:'6px 14px', borderRadius:12 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#fff', display:'inline-block', animation:'liveBlip 1.2s ease-in-out infinite' }} />
              <span style={{ fontSize:10, fontWeight:900, fontFamily:'Montserrat,sans-serif', color:'#fff', letterSpacing:'.1em' }}>CONFIRMED</span>
            </div>
          </div>

          {/* Ticket body */}
          <div style={{ padding:'0 20px' }}>
            {[
              { label:'Player Name', val:'Rahul Sharma' },
              { label:'Role', val:'🏏 Batsman' },
              { label:'Trial City', val:'📍 Mumbai' },
              { label:'Registration No.', val:'BCPL-MUM-7432' },
              { label:'Payment Date', val:'15 Jan 2025, 11:42 AM' },
            ].map(r => (
              <div key={r.label} className="receipt-row">
                <span className="receipt-label">{r.label}</span>
                <span className="receipt-val">{r.val}</span>
              </div>
            ))}
          </div>

          {/* GST Breakdown */}
          <div style={{ margin:'0', background:'rgba(255,122,41,0.04)', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'16px 20px' }}>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:800, fontSize:9, letterSpacing:'.14em', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', marginBottom:10 }}>Payment Breakdown</div>
            {[
              { label:'Taxable Amount', val:'₹253.39', dim:false },
              { label:'CGST @ 9%',      val:'₹22.81',  dim:true  },
              { label:'SGST @ 9%',      val:'₹22.81',  dim:true  },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color: r.dim ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)', fontWeight:600 }}>{r.label}</span>
                <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color: r.dim ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.7)', fontWeight:700 }}>{r.val}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0 2px', marginTop:6, borderTop:'1px solid rgba(255,122,41,0.3)' }}>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, color:'#FF7A29', letterSpacing:'.04em' }}>TOTAL PAID</span>
              <span style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:16, color:'#22C55E' }}>₹299.00 ✅</span>
            </div>
          </div>

          {/* Dashed divider */}
          <div style={{ borderTop:'2px dashed rgba(255,122,41,0.25)', margin:'0 20px' }} />

          {/* Phase 2 locked row */}
          <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.14em', color:'rgba(255,255,255,0.5)', textTransform:'uppercase' }}>PHASE 2 STATUS</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:3 }}>🔒 Locked — You'll be notified if selected by scouts</div>
            </div>
            <span style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', padding:'5px 12px', borderRadius:12, fontSize:10, fontWeight:800, fontFamily:'Montserrat,sans-serif', letterSpacing:'.12em', color:'rgba(255,255,255,0.4)' }}>PENDING</span>
          </div>

          {/* Decorative barcode */}
          <div className="barcode-wrap">
            {Array.from({length:52}, (_,i) => {
              const heights = [24,32,18,38,22,28,14,36,20,30,16,40,26,18,34,22,28,12,38,24,30,16,36,20,26,14,32,24,38,18,28,22,36,14,30,26,18,40,24,32,16,38,22,28,12,36,20,30,16,40,26,18];
              const h = heights[i % heights.length];
              const delay = (i * 0.04) % 2.5;
              return <div key={i} className="barcode-line" style={{ height:h, animationDelay:`${delay}s` }} />;
            })}
            <span style={{ marginLeft:'auto', fontFamily:'monospace', fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'.08em', whiteSpace:'nowrap' }}>BCPL-S5-MUM-BAT-7432</span>
          </div>
        </div>
      </div>

      {/* ── NEXT STEPS ── */}
      <div className="wrap" style={{ marginTop:48 }}>
        <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:11, letterSpacing:'.2em', color:'rgba(255,255,255,0.3)', marginBottom:20, textTransform:'uppercase' }}>Your Next Steps</div>
        <div className="next-steps-grid">
          {/* Step 1 */}
          <div className="next-card">
            <div style={{ fontSize:28, marginBottom:12 }}>🎬</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#FF7A29', letterSpacing:'.04em', marginBottom:6, textTransform:'uppercase' }}>Upload Your Trial Video</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#FF7A29', display:'inline-block', animation:'liveBlip 1s infinite' }} />
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,122,41,0.8)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.08em' }}>SUBMIT AS SOON AS POSSIBLE</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:16 }}>Record your 2-minute cricket trial video. Follow the guidelines for best results.</p>
            <button className="btn-primary" style={{ width:'100%', padding:'12px', fontSize:12 }}
              onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/upload-video'; }}>
              UPLOAD NOW →
            </button>
          </div>

          {/* Step 2 */}
          <div className="next-card">
            <div style={{ fontSize:28, marginBottom:12 }}>⏱</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'#E8B23D', letterSpacing:'.04em', marginBottom:6, textTransform:'uppercase' }}>Scout Review</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(232,178,61,0.7)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em' }}>BCCI-CERTIFIED EVALUATORS</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>Our trained scouts review every submission. Selection results announced via your registered email & WhatsApp.</p>
          </div>

          {/* Step 3 */}
          <div className="next-card" style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:28, marginBottom:12 }}>🔒</div>
            <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:14, color:'rgba(255,255,255,0.5)', letterSpacing:'.04em', marginBottom:6, textTransform:'uppercase' }}>Phase 2 (If Selected)</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.06em' }}>PHYSICAL TRIAL · LOCKED</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', lineHeight:1.6 }}>If selected by scouts, you'll be invited to the physical ground trial. Pay ₹2,000 only after selection — not before.</p>
          </div>
        </div>
      </div>

      {/* ── SHARE SECTION ── */}
      <div className="wrap" style={{ marginTop:48 }}>
        <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'28px 20px', textAlign:'center' }}>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:13, letterSpacing:'.16em', color:'rgba(255,255,255,0.4)', marginBottom:6, textTransform:'uppercase' }}>Share Your Achievement</div>
          <div style={{ fontFamily:'Montserrat,sans-serif', fontWeight:900, fontSize:20, color:'#fff', marginBottom:24 }}>Tell the world you're in the trials! 🏏</div>
          <div className="share-btns">
            <button className="share-btn" style={{ background:'#25D366', color:'#fff' }}
              onClick={() => {
                const msg = encodeURIComponent("🏏 I just registered for BCPL Season 5 trials! India's biggest corporate cricket league. Register at https://bcplt20.com #OfficeSeStadiumTak");
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}>
              💬 Share on WhatsApp
            </button>
            <button className="share-btn" style={{ background:'linear-gradient(135deg,#833AB4,#FD1D1D,#F56040)', color:'#fff' }}
              onClick={() => window.open('https://www.instagram.com/', '_blank')}>
              📸 Share on Instagram
            </button>
            <button className="share-btn" style={{ background:'linear-gradient(135deg,#1E3A5F,#0F2040)', border:'1px solid rgba(255,122,41,0.4)', color:'#FF7A29' }}
              onClick={() => {
                const logoUrl  = `${window.location.origin}${import.meta.env.BASE_URL}bcpl-assets/bcpl-ball-color.jpg`;
                const sigUrl   = `${window.location.origin}${import.meta.env.BASE_URL}bcpl-assets/bcpl-signature.png`;
                const stampUrl = `${window.location.origin}${import.meta.env.BASE_URL}bcpl-assets/bcpl-stamp.png`;
                const w = window.open('', '_blank');
                if (!w) return;
                w.document.write(`<!DOCTYPE html><html><head><title>BCPL Registration Receipt — BCPL-MUM-7432</title>
                <style>
                  *{box-sizing:border-box;margin:0;padding:0}
                  body{font-family:'Arial',sans-serif;background:#06101E;color:#F0EDE8;min-height:100vh;position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact}

                  /* Watermark */
                  body::before{
                    content:'';position:fixed;top:50%;left:50%;
                    transform:translate(-50%,-50%);
                    width:420px;height:420px;
                    background-image:url('${logoUrl}');
                    background-size:contain;background-repeat:no-repeat;background-position:center;
                    opacity:0.04;z-index:0;
                    -webkit-print-color-adjust:exact;print-color-adjust:exact;
                  }

                  .page{max-width:680px;margin:0 auto;padding:0 0 90px;position:relative;z-index:1}

                  /* Header */
                  .header{
                    background:linear-gradient(135deg,#C94E0E 0%,#FF7A29 50%,#E8611A 100%);
                    padding:28px 36px;display:flex;align-items:center;gap:20px;
                    -webkit-print-color-adjust:exact;print-color-adjust:exact;
                  }
                  .logo-circle{width:72px;height:72px;border-radius:50%;overflow:hidden;border:3px solid rgba(255,255,255,0.5);background:#fff;flex-shrink:0}
                  .logo-circle img{width:100%;height:100%;object-fit:cover;display:block}
                  .header-text .brand{font-size:22px;font-weight:900;color:#fff;letter-spacing:.06em;line-height:1}
                  .header-text .sub{font-size:10px;color:rgba(255,255,255,0.85);letter-spacing:.12em;margin-top:4px;font-weight:700;text-transform:uppercase}
                  .header-text .addr{font-size:8.5px;color:rgba(255,255,255,0.65);margin-top:5px}

                  /* Gold accent bar */
                  .gold-bar{height:4px;background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D);-webkit-print-color-adjust:exact;print-color-adjust:exact}

                  /* Success banner */
                  .success-banner{
                    background:linear-gradient(135deg,#052D1A,#073D24);
                    border-bottom:1px solid rgba(34,197,94,0.2);
                    padding:20px 36px;display:flex;align-items:center;gap:16;
                    -webkit-print-color-adjust:exact;print-color-adjust:exact;
                  }
                  .check-icon{font-size:36px;flex-shrink:0}
                  .success-title{font-size:20px;font-weight:900;color:#22C55E;letter-spacing:.04em;text-transform:uppercase}
                  .success-sub{font-size:11px;color:rgba(34,197,94,0.7);margin-top:3px;letter-spacing:.06em}
                  .reg-badge{margin-left:auto;text-align:right;flex-shrink:0}
                  .reg-label{font-size:8px;color:rgba(255,255,255,0.3);letter-spacing:.16em;text-transform:uppercase;font-weight:700}
                  .reg-num{font-size:16px;font-weight:900;color:#FF7A29;font-family:monospace;letter-spacing:.12em;margin-top:3px}

                  /* Body */
                  .body{padding:28px 36px}

                  /* Receipt card */
                  .receipt-card{
                    background:#0A1727;border:1px solid rgba(255,122,41,0.25);
                    border-radius:14px;overflow:hidden;margin-bottom:20px;
                    page-break-inside:avoid;
                  }
                  .receipt-card-header{
                    background:linear-gradient(135deg,#0F1D35,#0A1727);
                    padding:14px 20px;border-bottom:1px solid rgba(255,122,41,0.15);
                    font-size:10px;font-weight:900;color:#FF7A29;letter-spacing:.16em;text-transform:uppercase;
                    display:flex;align-items:center;gap:8px;
                  }
                  .receipt-table{width:100%;border-collapse:collapse}
                  .receipt-table tr{border-bottom:1px solid rgba(255,255,255,0.04)}
                  .receipt-table tr:last-child{border-bottom:none}
                  .receipt-table td{padding:12px 20px;font-size:13px}
                  .receipt-table td:first-child{color:rgba(255,255,255,0.4);font-weight:600;letter-spacing:.04em;width:42%}
                  .receipt-table td:last-child{color:#F0EDE8;font-weight:700;text-align:right}
                  .amount-row td:last-child{color:#22C55E;font-size:16px;font-weight:900}

                  /* Divider */
                  .dashed{border:none;border-top:2px dashed rgba(255,122,41,0.2);margin:0 20px}

                  /* Barcode */
                  .barcode-section{
                    background:#060C18;border-top:1px solid rgba(255,255,255,0.04);
                    padding:16px 20px;display:flex;align-items:flex-end;gap:1px;
                    -webkit-print-color-adjust:exact;print-color-adjust:exact;
                  }
                  .barcode-bar{display:inline-block;width:2px;margin:0 0.5px;background:rgba(255,255,255,0.8)}
                  .barcode-text{margin-left:auto;font-family:monospace;font-size:9px;color:rgba(255,255,255,0.25);white-space:nowrap;padding-bottom:2px}

                  /* Stamp / Sig block */
                  .sig-block{display:flex;justify-content:flex-end;align-items:center;gap:24px;
                    padding:0 20px 20px;page-break-inside:avoid}
                  .sig-col{text-align:center}
                  .sig-col img{display:block;margin:0 auto 6px}
                  .sig-col .sig-label{font-size:8.5px;color:rgba(255,255,255,0.35);
                    border-top:1px solid rgba(255,255,255,0.12);padding-top:5px;line-height:1.5}

                  /* Next steps */
                  .steps-card{
                    background:#0A1727;border:1px solid rgba(255,255,255,0.07);
                    border-radius:14px;padding:20px;margin-bottom:20px;
                    page-break-inside:avoid;
                  }
                  .steps-title{font-size:10px;font-weight:900;color:rgba(255,255,255,0.3);letter-spacing:.18em;text-transform:uppercase;margin-bottom:14px}
                  .step-row{display:flex;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
                  .step-row:last-child{border-bottom:none}
                  .step-num{width:28px;height:28px;border-radius:50%;background:rgba(255,122,41,0.15);border:1.5px solid rgba(255,122,41,0.4);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#FF7A29;flex-shrink:0}
                  .step-label{font-size:13px;font-weight:800;color:#F0EDE8;margin-bottom:3px}
                  .step-desc{font-size:11px;color:rgba(255,255,255,0.4);line-height:1.5}

                  /* Footer */
                  .footer{
                    background:#040C18;border-top:2px solid #FF7A29;
                    padding:12px 36px;display:flex;justify-content:space-between;align-items:center;
                    font-size:9px;color:rgba(255,255,255,0.3);
                    margin-top:8px;
                    -webkit-print-color-adjust:exact;print-color-adjust:exact;
                    page-break-inside:avoid;
                  }
                  .footer strong{color:#FF7A29}

                  @media print{
                    body{background:#06101E}
                    .page{padding-bottom:20px}
                    @page{margin:6mm 8mm;background:#06101E}
                  }
                </style></head>
                <body>
                  <div class="page">
                    <!-- Header -->
                    <div class="header">
                      <div class="logo-circle"><img src="${logoUrl}" alt="BCPL"/></div>
                      <div class="header-text">
                        <div class="brand">BCPL — Bhartiya Corporate Premier League</div>
                        <div class="sub">India's Biggest Corporate Cricket League · Season 5</div>
                        <div class="addr">Kriparti Playing11 Pvt. Ltd. &nbsp;·&nbsp; 2nd Floor, RZ-108, Indra Park, Uttam Nagar, New Delhi — 110059</div>
                        <div class="addr">legal@bcplt20.com &nbsp;·&nbsp; www.bcplt20.com &nbsp;·&nbsp; GSTIN: 07AAHCK4053D1ZS</div>
                      </div>
                    </div>
                    <div class="gold-bar"></div>

                    <!-- Success Banner -->
                    <div class="success-banner" style="display:flex;align-items:center;gap:16px;padding:20px 36px;background:linear-gradient(135deg,#052D1A,#073D24)">
                      <div class="check-icon">✅</div>
                      <div>
                        <div class="success-title">Registration Confirmed</div>
                        <div class="success-sub">Phase 1 Trial Entry · Payment Received</div>
                      </div>
                      <div class="reg-badge">
                        <div class="reg-label">Registration Number</div>
                        <div class="reg-num">BCPL-MUM-7432</div>
                      </div>
                    </div>

                    <div class="body">
                      <!-- Payment Receipt Card -->
                      <div class="receipt-card">
                        <div class="receipt-card-header">🧾 &nbsp;Payment Receipt</div>
                        <table class="receipt-table">
                          <tr><td>Player Name</td><td>Rahul Sharma</td></tr>
                          <tr><td>Registration No.</td><td style="font-family:monospace;color:#FF7A29">BCPL-MUM-7432</td></tr>
                          <tr><td>Role</td><td>🏏 Batsman</td></tr>
                          <tr><td>Trial City</td><td>📍 Mumbai</td></tr>
                          <tr><td>Phase</td><td>Phase 1 — Video Submission</td></tr>
                          <tr><td>Payment Date</td><td>15 Jan 2025, 11:42 AM</td></tr>
                          <tr><td>Payment Method</td><td>UPI / Online</td></tr>
                          <tr><td>Taxable Amount</td><td>₹253.39</td></tr>
                          <tr><td>CGST @ 9%</td><td>₹22.81</td></tr>
                          <tr><td>SGST @ 9%</td><td>₹22.81</td></tr>
                          <tr class="amount-row"><td>Total Paid</td><td>₹299.00 ✓</td></tr>
                        </table>

                        <hr class="dashed"/>

                        <div style="padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
                          <div style="font-size:11px;color:rgba(255,255,255,0.4)">Phase 2 Status</div>
                          <div style="font-size:11px;color:rgba(255,255,255,0.35);font-weight:700">🔒 Locked — Pending scout review</div>
                        </div>

                        <!-- Barcode -->
                        <div class="barcode-section">
                          ${Array.from({length:48}, (_,i) => {
                            const h = [22,32,16,38,20,28,14,36,18,30,24,40,26,16,34,22,28,12,36,22,30,16,34,20,26,14,32,22,38,18,28,20,34,14,30,24,18,40,22,30,16,36,20,28,12,34,20,18][i % 48];
                            return `<div class="barcode-bar" style="height:${h}px"></div>`;
                          }).join('')}
                          <div class="barcode-text">BCPL-S5-MUM-BAT-7432</div>
                        </div>
                      </div>

                      <!-- Next Steps -->
                      <div class="steps-card">
                        <div class="steps-title">Your Next Steps</div>
                        <div class="step-row">
                          <div class="step-num">1</div>
                          <div>
                            <div class="step-label">🎬 Upload Your Trial Video</div>
                            <div class="step-desc">Record a 2-minute cricket video and upload it via bcplt20.com within 7 days of registration.</div>
                          </div>
                        </div>
                        <div class="step-row">
                          <div class="step-num">2</div>
                          <div>
                            <div class="step-label">⏱ Await Scout Review</div>
                            <div class="step-desc">BCCI-certified scouts review your video. Selection results announced via email & WhatsApp.</div>
                          </div>
                        </div>
                        <div class="step-row">
                          <div class="step-num">3</div>
                          <div>
                            <div class="step-label">🔓 Phase 2 (If Selected)</div>
                            <div class="step-desc">Selected players get an invite for the physical ground trial. Pay ₹2,000 only after selection.</div>
                          </div>
                        </div>
                      </div>

                      <!-- Stamp & Signature -->
                      <div class="sig-block">
                        <div class="sig-col">
                          <img src="${sigUrl}" style="height:52px;object-fit:contain;opacity:0.9" alt="Signature"/>
                          <div class="sig-label">Authorised Signatory<br/><strong style="color:#FF7A29">Kriparti Playing11 Pvt. Ltd.</strong></div>
                        </div>
                        <div class="sig-col">
                          <img src="${stampUrl}" style="height:78px;object-fit:contain;opacity:0.85" alt="BCPL Stamp"/>
                          <div class="sig-label">Official Seal</div>
                        </div>
                      </div>

                      <!-- Note -->
                      <div style="background:#0A1727;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px 20px;font-size:11px;color:rgba(255,255,255,0.4);line-height:1.7;text-align:center;page-break-inside:avoid">
                        This is an official digital receipt issued by <strong style="color:rgba(255,255,255,0.65)">Kriparti Playing11 Pvt. Ltd.</strong><br/>
                        For support: <strong style="color:#FF7A29">legal@bcplt20.com</strong> &nbsp;·&nbsp; <strong style="color:#FF7A29">www.bcplt20.com</strong>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="footer">
                    <span>Ref: <strong>BCPL-MUM-7432</strong></span>
                    <span><strong>BCPL</strong> — Bhartiya Corporate Premier League · Season 5 · Official Receipt</span>
                    <span>© 2026 Kriparti Playing11 Pvt. Ltd.</span>
                  </div>
                </body></html>`);
                w.document.close();
                setTimeout(() => w.print(), 600);
              }}>
              ⬇ Download Receipt
            </button>
          </div>
        </div>
      </div>

      <BCPLFooter />
    </div>
  );
}
