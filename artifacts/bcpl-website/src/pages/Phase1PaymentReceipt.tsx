import React, { useState, useEffect } from 'react';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { verifyPhase1Payment, getMe, getRegistrationStatus } from '../lib/api';
import { ReferralShareBanner } from '../components/ReferralCard';
import { useLang } from '../lib/i18n';
import { formatRole } from '../lib/format';
import { IcoCheck, IcoLock, IcoVideo, IcoClock, IcoChat, IcoCamera, IcoDownload } from '../lib/icons';

export function Phase1PaymentReceipt() {
  const { t } = useLang();
  /* ── Real receipt data ── */
  const [receiptLoading, setReceiptLoading] = useState(true);
  const [receiptError, setReceiptError] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerRole, setPlayerRole] = useState('');
  const [playerCity, setPlayerCity] = useState('');
  const [regId, setRegId] = useState('');
  const [regNumber, setRegNumber] = useState('');   // sequential BCPL-DEL-1 style number
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    if (!orderId) { setReceiptError('Missing order ID.'); setReceiptLoading(false); return; }

    (async () => {
      try {
        const [verifyRes, meRes, statusRes] = await Promise.all([
          verifyPhase1Payment(orderId),
          getMe(),
          getRegistrationStatus(),
        ]);
        if (!verifyRes.success) throw new Error('Payment not confirmed');
        setPlayerName(meRes.user.name);
        const role = (statusRes as any).role ?? '';
        const city = (statusRes as any).trialCity ?? '';
        const fees = (statusRes as any).fees ?? {};
        setPlayerRole(role ? formatRole(role) : '');
        setPlayerCity(city);
        setRegId((statusRes as any).registrationId ?? verifyRes.registrationId ?? '');
        setRegNumber(verifyRes.regNumber ?? (statusRes as any).regNumber ?? '');
        // Show GST-inclusive amount (base * 1.18, same formula as API)
        const baseFee = fees.phase1 ?? 299;
        setPaidAmount(Math.round(baseFee * 1.18));
        setPaymentDate(new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
      } catch (e: any) {
        setReceiptError('Could not load receipt. Please check your connection and try again.');
      } finally { setReceiptLoading(false); }
    })();
  }, []);

  return (
    <div style={{ background:'#06101E', minHeight:'100vh', color:'#F0EDE8', fontFamily:"'Inter',sans-serif", overflowX:'hidden', paddingBottom:80 }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimGold{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes checkPop{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.18) rotate(6deg);opacity:1}80%{transform:scale(0.94)}100%{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes ringPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}50%{box-shadow:0 0 0 18px rgba(34,197,94,0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes liveBlip{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes barcodeScan{0%{opacity:0.3}50%{opacity:1}100%{opacity:0.3}}

        .wrap{max-width:var(--container);margin:0 auto;padding:0 20px}
        @media(min-width:768px){.wrap{padding:0 32px}}
        @media(min-width:1280px){.wrap{padding:0 48px}}

        .desk-nav{display:none}
        @media(min-width:1024px){.desk-nav{display:flex;align-items:center;gap:20px}}
        .ham-btn{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
        @media(min-width:1024px){.ham-btn{display:none}}

        .btn-primary{
          background:linear-gradient(135deg,#FF7A29,#D95E10);
          border:none;border-radius:var(--r);color:#fff;
          font-family:var(--font-head);font-weight:900;
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
          padding:14px 22px;border-radius:12px;font-family:var(--font-head);
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

      <SiteHeader />

      {/* ── HERO ── */}
      <div style={{ position:'relative', overflow:'hidden', background:'linear-gradient(180deg,#06101E 0%,#060C18 100%)', paddingTop:60, paddingBottom:56, textAlign:'center' }}>
        <div style={{ position:'absolute', top:0, left:'-10%', width:'50%', height:'100%', background:'linear-gradient(135deg,rgba(34,197,94,0.06) 0%,transparent 60%)', transform:'skewX(-8deg)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:0, right:'-10%', width:'50%', height:'100%', background:'linear-gradient(225deg,rgba(34,197,94,0.04) 0%,transparent 60%)', transform:'skewX(-8deg)', pointerEvents:'none' }} />

        <div className="wrap">
          {/* Animated check circle */}
          <div className="fade-up" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:110, height:110, borderRadius:'50%', background:'rgba(34,197,94,0.12)', border:'3px solid #22C55E', marginBottom:32, animation:'ringPulse 2.5s ease-in-out infinite, fadeUp .5s ease both' }}>
            <div style={{ color:'#22C55E', animation:'checkPop .6s cubic-bezier(.34,1.56,.64,1) .2s both', display:'block' }}><IcoCheck size={52} /></div>
          </div>

          <h1 className="fade-up fade-up-1" style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:'clamp(30px,6vw,62px)', lineHeight:.95, letterSpacing:'.015em', textTransform:'uppercase', marginBottom:10 }}>
            <span style={{ color:'#fff', display:'block' }}>{t("ENTRY","ENTRY")}</span>
            <span style={{ color:'#22C55E', display:'block' }}>{t("CONFIRMED.","CONFIRMED.")}</span>
          </h1>
          <div className="fade-up fade-up-2" style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:'clamp(14px,3vw,24px)', color:'#FF7A29', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:20 }}>
            {t("YOU'RE IN THE TRIALS.","आप TRIALS में हैं।")}
          </div>

          {/* Loading / Error */}
          {receiptLoading && <div style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:20 }}>{t("Confirming payment…","Payment confirm हो रही है…")}</div>}
          {receiptError && (
            <div style={{ marginBottom:20 }}>
              <div style={{ color:'#EF4444', fontSize:13, fontWeight:600, marginBottom:10 }}>{receiptError}</div>
              <button onClick={() => window.location.reload()} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.18)', color:'#fff', borderRadius:10, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>{t('Try Again', 'फिर कोशिश करें')}</button>
            </div>
          )}

          {/* Player chips */}
          {!receiptLoading && !receiptError && (
          <div className="fade-up fade-up-3" style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginBottom:28 }}>
            {[
              { label: playerRole || t('Player','Player'), color:'#3B82F6' },
              { label: playerCity || t('City','City'), color:'#FF7A29' },
              { label:'BCPL Season 5', color:'#E8B23D' },
            ].map(c => (
              <span key={c.label} style={{ padding:'6px 16px', background:'rgba(255,255,255,0.05)', border:`1px solid ${c.color}44`, borderRadius:12, fontSize:12, fontWeight:700, fontFamily:'var(--font-head)', color:c.color, letterSpacing:'.06em' }}>
                {c.label}
              </span>
            ))}
          </div>
          )}

          {/* Booking ref */}
          {!receiptLoading && (
          <div className="fade-up fade-up-4" style={{ display:'inline-block', background:'#060C18', border:'1px solid rgba(255,122,41,0.4)', padding:'12px 20px', borderRadius:12, marginBottom:0, maxWidth:'100%', overflow:'hidden' }}>
            <div style={{ fontSize:9, fontWeight:800, fontFamily:'var(--font-head)', letterSpacing:'.18em', color:'rgba(255,255,255,0.35)', marginBottom:4 }}>{t("REGISTRATION NUMBER","REGISTRATION NUMBER")}</div>
            <div style={{ fontFamily:'monospace', fontSize:'clamp(13px,4vw,18px)', fontWeight:700, color:'#FF7A29', letterSpacing:'.12em', wordBreak:'break-all' }}>
              {regNumber || (regId ? regId.slice(0,8).toUpperCase() : '—')}
            </div>
          </div>
          )}
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
              <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:13, letterSpacing:'.14em', color:'#fff', textTransform:'uppercase' }}>{t("PHASE 1 TRIAL ENTRY","PHASE 1 TRIAL ENTRY")}</div>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:10, letterSpacing:'.12em', color:'rgba(255,255,255,0.75)', marginTop:2 }}>{t("PAYMENT CONFIRMED","PAYMENT CONFIRMED")}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.15)', padding:'6px 14px', borderRadius:12 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#fff', display:'inline-block', animation:'liveBlip 1.2s ease-in-out infinite' }} />
              <span style={{ fontSize:10, fontWeight:900, fontFamily:'var(--font-head)', color:'#fff', letterSpacing:'.1em' }}>{t("CONFIRMED","CONFIRMED")}</span>
            </div>
          </div>

          {/* Ticket body */}
          <div style={{ padding:'0 20px' }}>
            {[
              { label:t('Player Name','Player का नाम'),      val: playerName || '—' },
              { label:t('Role','Role'),             val: playerRole || '—' },
              { label:t('Trial City','Trial City'),       val: playerCity || '—' },
              { label:t('Registration No.','Registration No.'), val: regNumber || (regId ? regId.slice(0,8).toUpperCase() : '—') },
              { label:t('Payment Date','Payment Date'),     val: paymentDate || '—' },
            ].map(r => (
              <div key={r.label} className="receipt-row">
                <span className="receipt-label">{r.label}</span>
                <span className="receipt-val">{r.val}</span>
              </div>
            ))}
          </div>

          {/* GST Breakdown */}
          {(() => {
            const taxable = paidAmount ? +(paidAmount / 1.18).toFixed(2) : 0;
            const gst     = paidAmount ? +((paidAmount - taxable) / 2).toFixed(2) : 0;
            return (
            <div style={{ margin:'0', background:'rgba(255,122,41,0.04)', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'16px 20px' }}>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:9, letterSpacing:'.14em', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', marginBottom:10 }}>{t("Payment Breakdown","Payment Breakdown")}</div>
              {[
                { label:'Taxable Amount', val: paidAmount ? `₹${taxable.toFixed(2)}` : '—', dim:false },
                { label:'CGST @ 9%',     val: paidAmount ? `₹${gst.toFixed(2)}`     : '—', dim:true  },
                { label:'SGST @ 9%',     val: paidAmount ? `₹${gst.toFixed(2)}`     : '—', dim:true  },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color: r.dim ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)', fontWeight:600 }}>{r.label}</span>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color: r.dim ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.7)', fontWeight:700 }}>{r.val}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0 2px', marginTop:6, borderTop:'1px solid rgba(255,122,41,0.3)' }}>
                <span style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:13, color:'#FF7A29', letterSpacing:'.04em' }}>{t("TOTAL PAID","TOTAL PAID")}</span>
                <span style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:16, color:'#22C55E', display:'inline-flex', alignItems:'center', gap:6 }}>
                  {paidAmount ? <>₹{paidAmount.toFixed(2)} <IcoCheck size={16} /></> : '—'}
                </span>
              </div>
            </div>
            );
          })()}

          {/* Dashed divider */}
          <div style={{ borderTop:'2px dashed rgba(255,122,41,0.25)', margin:'0 20px' }} />

          {/* Phase 2 locked row */}
          <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:11, letterSpacing:'.14em', color:'rgba(255,255,255,0.5)', textTransform:'uppercase' }}>{t("PHASE 2 STATUS","PHASE 2 STATUS")}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:3, display:'inline-flex', alignItems:'center', gap:6 }}><IcoLock size={14} /> {t("Locked — You'll be notified when your result is released","Locked — जब आपका result release होगा तब आपको notify किया जाएगा")}</div>
            </div>
            <span style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', padding:'5px 12px', borderRadius:12, fontSize:10, fontWeight:800, fontFamily:'var(--font-head)', letterSpacing:'.12em', color:'rgba(255,255,255,0.4)' }}>{t("PENDING","PENDING")}</span>
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
        <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:11, letterSpacing:'.2em', color:'rgba(255,255,255,0.3)', marginBottom:20, textTransform:'uppercase' }}>{t("Your Next Steps","आपके अगले Steps")}</div>
        <div className="next-steps-grid">
          {/* Step 1 */}
          <div className="next-card">
            <div style={{ color:'#FF7A29', marginBottom:12 }}><IcoVideo size={28} /></div>
            <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:14, color:'#FF7A29', letterSpacing:'.04em', marginBottom:6, textTransform:'uppercase' }}>{t("Upload Your Trial Video","अपनी Trial Video Upload करें")}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#FF7A29', display:'inline-block', animation:'liveBlip 1s infinite' }} />
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,122,41,0.8)', fontFamily:'var(--font-head)', letterSpacing:'.08em' }}>{t("SUBMIT AS SOON AS POSSIBLE","जल्द से जल्द SUBMIT करें")}</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:16 }}>{t("Record your 30–60 second cricket trial video. Follow the guidelines for best results.","अपनी 30–60 second की cricket trial video record करें। बेहतर results के लिए guidelines follow करें।")}</p>
            <button className="btn-primary" style={{ width:'100%', padding:'12px', fontSize:12 }}
              onClick={() => { window.location.href = import.meta.env.BASE_URL + 'register/upload-video'; }}>
              {t("UPLOAD NOW →","अभी UPLOAD करें →")}
            </button>
          </div>

          {/* Step 2 */}
          <div className="next-card">
            <div style={{ color:'#E8B23D', marginBottom:12 }}><IcoClock size={28} /></div>
            <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:14, color:'#E8B23D', letterSpacing:'.04em', marginBottom:6, textTransform:'uppercase' }}>{t("Phase 1 Evaluation","Phase 1 Evaluation")}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(232,178,61,0.7)', fontFamily:'var(--font-head)', letterSpacing:'.06em' }}>{t("CRITERIA-BASED ASSESSMENT","CRITERIA-BASED ASSESSMENT")}</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>{t("Every submission is evaluated against BCPL's Phase 1 assessment criteria. Results announced via your registered email & WhatsApp.","हर submission को BCPL के Phase 1 assessment criteria के against evaluate किया जाता है। Results आपके registered email और WhatsApp पर घोषित होते हैं।")}</p>
          </div>

          {/* Step 3 */}
          <div className="next-card" style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color:'rgba(255,255,255,0.5)', marginBottom:12 }}><IcoLock size={28} /></div>
            <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:14, color:'rgba(255,255,255,0.5)', letterSpacing:'.04em', marginBottom:6, textTransform:'uppercase' }}>{t("Phase 2 (If Selected)","Phase 2 (अगर Selected हुए)")}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', fontFamily:'var(--font-head)', letterSpacing:'.06em' }}>{t("PHYSICAL TRIAL · LOCKED","PHYSICAL TRIAL · LOCKED")}</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', lineHeight:1.6 }}>{t("If you qualify through Phase 1, you'll be invited to the physical ground trial. The Phase 2 fee becomes payable only if you qualify through Phase 1 and choose to proceed.","अगर आप Phase 1 से qualify करते हैं, तो आपको physical ground trial के लिए invite किया जाएगा। Phase 2 fee तभी देनी होती है जब आप Phase 1 से qualify करें और आगे बढ़ने का चुनाव करें।")}</p>
          </div>
        </div>
      </div>

      {/* ── REFER & EARN (personal link — renders once payment is verified) ── */}
      <div className="wrap" style={{ marginTop:48 }}>
        <ReferralShareBanner />
      </div>

      {/* ── SHARE SECTION ── */}
      <div className="wrap" style={{ marginTop:32 }}>
        <div style={{ background:'#0A1727', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'28px 20px', textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:13, letterSpacing:'.16em', color:'rgba(255,255,255,0.4)', marginBottom:6, textTransform:'uppercase' }}>{t("Share Your Achievement","अपनी Achievement Share करें")}</div>
          <div style={{ fontFamily:'var(--font-head)', fontWeight:900, fontSize:20, color:'#fff', marginBottom:24 }}>{t("Tell the world you're in the trials!","दुनिया को बताएं कि आप trials में हैं!")}</div>
          <div className="share-btns">
            <button className="share-btn" style={{ background:'#25D366', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}
              onClick={() => {
                const msg = encodeURIComponent("🏏 I just registered for BCPL Season 5 trials! India's corporate cricket league. Register at https://bcplt20.com #OfficeSeStadiumTak");
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}>
              <IcoChat size={16} /> {t("Share on WhatsApp","WhatsApp पर Share करें")}
            </button>
            <button className="share-btn" style={{ background:'linear-gradient(135deg,#833AB4,#FD1D1D,#F56040)', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}
              onClick={() => window.open('https://www.instagram.com/bcpl.t20', '_blank')}>
              <IcoCamera size={16} /> {t("Share on Instagram","Instagram पर Share करें")}
            </button>
            <button className="share-btn" style={{ background:'linear-gradient(135deg,#1E3A5F,#0F2040)', border:'1px solid rgba(255,122,41,0.4)', color:'#FF7A29', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}
              onClick={() => {
                const logoUrl  = `${window.location.origin}${import.meta.env.BASE_URL}bcpl-assets/bcpl-ball-color.jpg`;
                const sigUrl   = `${window.location.origin}${import.meta.env.BASE_URL}bcpl-assets/bcpl-signature.png`;
                const stampUrl = `${window.location.origin}${import.meta.env.BASE_URL}bcpl-assets/bcpl-stamp.png`;
                const w = window.open('', '_blank');
                if (!w) return;
                const printRegNo   = regNumber || (regId ? regId.slice(0,8).toUpperCase() : '—');
                const printGstAmt  = Math.round((paidAmount * 9 / 118) * 100) / 100;   // 9% GST component of the inclusive total
                const printGst     = printGstAmt.toFixed(2);
                const printTaxable = (paidAmount - 2 * printGstAmt).toFixed(2);
                w.document.write(`<!DOCTYPE html><html><head><title>BCPL Registration Receipt — ${printRegNo}</title>
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
                        <div class="sub">India's Corporate Cricket League · Season 5</div>
                        <div class="addr">Kriparti Playing11 Pvt. Ltd. &nbsp;·&nbsp; 2nd Floor, RZ-108, Indra Park, Uttam Nagar, New Delhi — 110059</div>
                        <div class="addr">legal@bcplt20.com &nbsp;·&nbsp; www.bcplt20.com &nbsp;·&nbsp; GSTIN: 07AAHCK4053D1ZS</div>
                      </div>
                    </div>
                    <div class="gold-bar"></div>

                    <!-- Success Banner -->
                    <div class="success-banner" style="display:flex;align-items:center;gap:16px;padding:20px 36px;background:linear-gradient(135deg,#052D1A,#073D24)">
                      <div class="check-icon">✓</div>
                      <div>
                        <div class="success-title">Registration Confirmed</div>
                        <div class="success-sub">Phase 1 Trial Entry · Payment Received</div>
                      </div>
                      <div class="reg-badge">
                        <div class="reg-label">Registration Number</div>
                        <div class="reg-num">${printRegNo}</div>
                      </div>
                    </div>

                    <div class="body">
                      <!-- Payment Receipt Card -->
                      <div class="receipt-card">
                        <div class="receipt-card-header">Payment Receipt</div>
                        <table class="receipt-table">
                          <tr><td>Player Name</td><td>${playerName || '—'}</td></tr>
                          <tr><td>Registration No.</td><td style="font-family:monospace;color:#FF7A29">${printRegNo}</td></tr>
                          <tr><td>Role</td><td>${playerRole || '—'}</td></tr>
                          <tr><td>Trial City</td><td>${playerCity || '—'}</td></tr>
                          <tr><td>Phase</td><td>Phase 1 — Video Submission</td></tr>
                          <tr><td>Payment Date</td><td>${paymentDate || '—'}</td></tr>
                          <tr><td>Payment Method</td><td>UPI / Online</td></tr>
                          <tr><td>Taxable Amount</td><td>₹${printTaxable}</td></tr>
                          <tr><td>CGST @ 9%</td><td>₹${printGst}</td></tr>
                          <tr><td>SGST @ 9%</td><td>₹${printGst}</td></tr>
                          <tr class="amount-row"><td>Total Paid</td><td>₹${paidAmount.toFixed(2)} ✓</td></tr>
                        </table>

                        <hr class="dashed"/>

                        <div style="padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
                          <div style="font-size:11px;color:rgba(255,255,255,0.4)">Phase 2 Status</div>
                          <div style="font-size:11px;color:rgba(255,255,255,0.35);font-weight:700">Locked — Pending evaluation</div>
                        </div>

                        <!-- Barcode -->
                        <div class="barcode-section">
                          ${Array.from({length:48}, (_,i) => {
                            const h = [22,32,16,38,20,28,14,36,18,30,24,40,26,16,34,22,28,12,36,22,30,16,34,20,26,14,32,22,38,18,28,20,34,14,30,24,18,40,22,30,16,36,20,28,12,34,20,18][i % 48];
                            return `<div class="barcode-bar" style="height:${h}px"></div>`;
                          }).join('')}
                          <div class="barcode-text">${printRegNo}</div>
                        </div>
                      </div>

                      <!-- Next Steps -->
                      <div class="steps-card">
                        <div class="steps-title">Your Next Steps</div>
                        <div class="step-row">
                          <div class="step-num">1</div>
                          <div>
                            <div class="step-label">Upload Your Trial Video</div>
                            <div class="step-desc">Record a 30–60 second cricket video and upload it via bcplt20.com within 15 days of registration.</div>
                          </div>
                        </div>
                        <div class="step-row">
                          <div class="step-num">2</div>
                          <div>
                            <div class="step-label">Evaluation In Progress</div>
                            <div class="step-desc">Your video is evaluated against BCPL's Phase 1 assessment criteria. Results announced via email & WhatsApp.</div>
                          </div>
                        </div>
                        <div class="step-row">
                          <div class="step-num">3</div>
                          <div>
                            <div class="step-label">Phase 2 (If Selected)</div>
                            <div class="step-desc">Qualified players get an invite for the physical ground trial. The Phase 2 fee becomes payable only if you qualify through Phase 1 and choose to proceed.</div>
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
                    <span>Ref: <strong>${printRegNo}</strong></span>
                    <span><strong>BCPL</strong> — Bhartiya Corporate Premier League · Season 5 · Official Receipt</span>
                    <span>© 2026 Kriparti Playing11 Pvt. Ltd.</span>
                  </div>
                </body></html>`);
                w.document.close();
                setTimeout(() => w.print(), 600);
              }}>
              <IcoDownload size={16} /> {t("Download Receipt","Receipt Download करें")}
            </button>
          </div>
        </div>
      </div>

      <BCPLFooter />
    </div>
  );
}
