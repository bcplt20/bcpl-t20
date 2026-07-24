import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';
import { StickyRegisterCTA } from "../components/StickyRegisterCTA";
import { AUCTION_PHOTOS } from '../data/auctionGallery';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#060E1C; }
.wrap { max-width:1280px; margin:0 auto; padding:0 20px; }
@media(min-width:768px){ .wrap{padding:0 32px} }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
.tag-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,122,41,0.12); border:1px solid rgba(255,122,41,0.3); border-radius:100px; padding:5px 14px; font-size:11px; font-weight:700; font-family:Montserrat,sans-serif; color:#FF7A29; letter-spacing:0.1em; }
.glass-card { background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85)); backdrop-filter:blur(32px); border:1px solid rgba(255,255,255,0.09); border-radius:20px; box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06); }
@keyframes pulseGlow { 0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)} 50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes scanPulse { 0%,100%{opacity:0.03} 50%{opacity:0.08} }
@keyframes floatParticle { 0%{transform:translateY(0) rotate(0deg);opacity:0.4} 50%{opacity:0.8} 100%{transform:translateY(-80px) rotate(180deg);opacity:0} }
@keyframes fadeSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes floatUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes lbFade { from{opacity:0} to{opacity:1} }
.photo-masonry { columns:2 160px; column-gap:12px; }
@media(min-width:640px){ .photo-masonry { columns:3 220px; column-gap:14px; } }
@media(min-width:1024px){ .photo-masonry { columns:4 260px; column-gap:16px; } }
.photo-card { position:relative; border-radius:14px; overflow:hidden; cursor:zoom-in; break-inside:avoid; margin-bottom:14px; border:1px solid rgba(255,255,255,0.07); background:#0A1727; }
.photo-card img { width:100%; height:auto; display:block; transition:transform .3s ease; }
.photo-card:hover img { transform:scale(1.04); }
.photo-card .photo-overlay { position:absolute; inset:0; background:linear-gradient(0deg,rgba(0,0,0,0.6) 0%,transparent 45%); opacity:0; transition:opacity .25s; display:flex; align-items:flex-end; padding:12px; }
.photo-card:hover .photo-overlay { opacity:1; }
.lb-btn { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); border-radius:12px; color:#fff; cursor:pointer; font-size:20px; line-height:1; padding:12px 16px; transition:background .2s; }
.lb-btn:hover { background:rgba(255,255,255,0.18); }
.load-more-btn { background:rgba(255,122,41,0.1); border:1.5px solid rgba(255,122,41,0.45); border-radius:14px; color:#FF7A29; font-family:Montserrat,sans-serif; font-weight:800; font-size:14px; letter-spacing:.05em; padding:14px 40px; cursor:pointer; transition:all .2s; }
.load-more-btn:hover { background:rgba(255,122,41,0.2); transform:translateY(-2px); }
/* float-reg-btn */
.float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
.float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
@keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
.float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
@media(max-width:1023px){ .float-reg-btn { display:none; } }
`;

function AmbientBg() {
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
      {[
        {top:'15%',left:'8%',color:'#FF7A29',delay:'0s',size:3},
        {top:'35%',left:'92%',color:'#E8B23D',delay:'1.2s',size:3},
        {top:'60%',left:'5%',color:'#fff',delay:'2.1s',size:2},
        {top:'75%',left:'88%',color:'#FF7A29',delay:'0.7s',size:3},
        {top:'25%',left:'50%',color:'#E8B23D',delay:'1.8s',size:2},
        {top:'85%',left:'30%',color:'#fff',delay:'0.4s',size:3},
      ].map((p,i)=>(
        <div key={i} style={{position:'absolute',top:p.top,left:p.left,width:p.size,height:p.size,borderRadius:'50%',background:p.color,animation:`floatParticle 6s ease-in-out ${p.delay} infinite`}}/>
      ))}
      <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
    </div>
  );
}

const BASE = import.meta.env.BASE_URL;
const thumbUrl = (f: string) => `${BASE}auction/thumb/${f}`;
const fullUrl  = (f: string) => `${BASE}auction/full/${f}`;

const PAGE_SIZE = 18;

export function Photos() {
  const { t } = useLang();
  const [visible, setVisible] = React.useState(PAGE_SIZE);
  const [lightbox, setLightbox] = React.useState<number | null>(null);

  const shown = AUCTION_PHOTOS.slice(0, visible);

  /* lightbox keyboard controls + scroll lock */
  React.useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox(i => (i === null ? i : (i + 1) % AUCTION_PHOTOS.length));
      if (e.key === 'ArrowLeft')  setLightbox(i => (i === null ? i : (i - 1 + AUCTION_PHOTOS.length) % AUCTION_PHOTOS.length));
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [lightbox]);

  return (
    <div style={{minHeight:'100vh',background:'#060E1C',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <SiteHeader active="Photos" />

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'100px 0 48px',textAlign:'center'}}>
        <div className="wrap">
          <div className="tag-pill" style={{marginBottom:24,animation:'floatUp 0.6s ease both'}}>{t("BCPL GALLERY","BCPL GALLERY")}</div>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,color:'#fff',marginBottom:12,animation:'floatUp 0.7s ease 0.1s both'}}>
            {t("MOMENTS THAT","वो पल जो")}
          </h1>
          <h1 className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:24,animation:'floatUp 0.7s ease 0.2s both'}}>
            {t("DEFINE US.","हमें परिभाषित करते हैं।")}
          </h1>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:18,maxWidth:520,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            {t("Straight from the BCPL player auction floor — the boards, the bids, the teams.","सीधे BCPL player auction floor से — boards, bids और teams।")}
          </p>
        </div>
      </section>

      {/* GALLERY */}
      <section style={{position:'relative',zIndex:1,padding:'12px 0 80px'}}>
        <div className="wrap">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:22}}>
            <div>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(20px,3.5vw,30px)',color:'#fff',textTransform:'uppercase',letterSpacing:'.02em'}}>
                {t("Player Auction","Player Auction")}
              </h2>
              <div style={{fontFamily:'Inter,sans-serif',fontSize:13,color:'rgba(255,255,255,0.45)',marginTop:4}}>
                {t("Official photos from the BCPL player auction event","BCPL player auction event की official photos")}
              </div>
            </div>
            <span className="tag-pill">{AUCTION_PHOTOS.length} {t("PHOTOS","PHOTOS")}</span>
          </div>

          <div className="photo-masonry">
            {shown.map((p, i) => (
              <div key={p.f} className="photo-card" onClick={() => setLightbox(i)}>
                <img src={thumbUrl(p.f)} alt={t("BCPL player auction moment","BCPL player auction का पल")}
                  width={p.w} height={p.h} loading={i < 6 ? 'eager' : 'lazy'} decoding="async" />
                <div className="photo-overlay">
                  <span style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:11,color:'#fff',letterSpacing:'.08em'}}>
                    {t("PLAYER AUCTION","PLAYER AUCTION")} · {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {visible < AUCTION_PHOTOS.length && (
            <div style={{textAlign:'center',marginTop:28}}>
              <button className="load-more-btn" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                {t("LOAD MORE PHOTOS","और PHOTOS देखें")} ({AUCTION_PHOTOS.length - visible})
              </button>
            </div>
          )}
        </div>
      </section>

      {/* VIDEOS COMING SOON + INSTAGRAM */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 110px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'clamp(28px,5vw,44px) clamp(20px,5vw,48px)',textAlign:'center',maxWidth:640,margin:'0 auto',border:'1px solid rgba(255,122,41,0.15)',animation:'fadeSlide 0.7s ease both'}}>
            <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,24px)',color:'#fff',marginBottom:10,lineHeight:1.25}}>
              {t("Auction Videos","Auction Videos")} <span className="shimmer-gold">{t("Coming Soon","जल्द आ रहे हैं")}</span>
            </h3>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,lineHeight:1.7,maxWidth:460,margin:'0 auto 22px',fontFamily:'Inter,sans-serif'}}>
              {t("Auction highlight videos are being edited. Match day and trial galleries will keep growing through the season.","Auction की highlight videos edit हो रही हैं। Match day और trial galleries season के साथ बढ़ती रहेंगी।")}
            </p>
            <a href="https://www.instagram.com/bcpl.t20" target="_blank" rel="noopener noreferrer"
              style={{display:'inline-flex',alignItems:'center',gap:10,padding:'12px 28px',borderRadius:14,background:'linear-gradient(135deg,#E1306C,#F77737,#FCAF45)',border:'none',color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13,cursor:'pointer',letterSpacing:'0.02em',textDecoration:'none'}}>
              {t("Follow @bcpl.t20 for Updates","@bcpl.t20 Follow करें")}
            </a>
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      {lightbox !== null && AUCTION_PHOTOS[lightbox] && (
        <div onClick={() => setLightbox(null)}
          style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(3,7,15,0.94)',display:'flex',alignItems:'center',justifyContent:'center',animation:'lbFade .2s ease both',padding:'clamp(8px,3vw,32px)'}}>
          <img src={fullUrl(AUCTION_PHOTOS[lightbox].f)} alt={t("BCPL player auction moment","BCPL player auction का पल")}
            onClick={e => e.stopPropagation()}
            style={{maxWidth:'100%',maxHeight:'92vh',borderRadius:10,boxShadow:'0 30px 90px rgba(0,0,0,0.8)',objectFit:'contain'}} />
          <button className="lb-btn" aria-label="Close" onClick={() => setLightbox(null)}
            style={{position:'absolute',top:16,right:16}}>✕</button>
          <button className="lb-btn" aria-label="Previous" onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + AUCTION_PHOTOS.length) % AUCTION_PHOTOS.length); }}
            style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)'}}>‹</button>
          <button className="lb-btn" aria-label="Next" onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % AUCTION_PHOTOS.length); }}
            style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)'}}>›</button>
          <div style={{position:'absolute',bottom:18,left:'50%',transform:'translateX(-50%)',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:12,color:'rgba(255,255,255,0.6)',letterSpacing:'.1em'}}>
            {lightbox + 1} / {AUCTION_PHOTOS.length}
          </div>
        </div>
      )}

      {/* ── FLOATING REGISTER BUTTON ── */}
      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>🏏 {t("REGISTER NOW","अभी REGISTER करें")} &rarr;</Link>
      <BCPLFooter />
      <StickyRegisterCTA/>
    </div>
  );
}
