import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';
import { StickyRegisterCTA } from "../components/StickyRegisterCTA";
import { AUCTION_CLIPS, AUCTION_STREAM, type AuctionClip } from '../data/auctionClips';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#060E1C; }
.wrap { max-width:1280px; margin:0 auto; padding:0 20px; }
.desk-nav { display:none; align-items:center; gap:22px; }
.ham-btn { display:flex; }
@media(min-width:768px){ .wrap{padding:0 32px} }
@media(min-width:1024px){ .desk-nav{display:flex!important;} .ham-btn{display:none!important;} }
.glass-card { background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85)); backdrop-filter:blur(32px); border:1px solid rgba(255,255,255,0.09); border-radius:20px; box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06); }
.shimmer-gold { background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite; }
.tag-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,122,41,0.12); border:1px solid rgba(255,122,41,0.3); border-radius:100px; padding:5px 14px; font-size:11px; font-weight:700; font-family:Montserrat,sans-serif; color:#FF7A29; letter-spacing:0.1em; }
@keyframes pulseGlow { 0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)} 50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes scanPulse { 0%,100%{opacity:0.03} 50%{opacity:0.08} }
@keyframes floatParticle { 0%{transform:translateY(0) rotate(0deg);opacity:0.4} 50%{opacity:0.8} 100%{transform:translateY(-80px) rotate(180deg);opacity:0} }
@keyframes fadeSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes floatUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes lbFade { from{opacity:0} to{opacity:1} }
.video-thumb { position:relative; border-radius:14px; overflow:hidden; cursor:pointer; transition:transform 0.25s,box-shadow 0.25s; }
.video-thumb:hover { transform:scale(1.02); box-shadow:0 16px 48px rgba(0,0,0,0.6); }
.video-thumb:hover .play-btn { transform:translate(-50%,-50%) scale(1.1); background:rgba(255,122,41,0.85); }
.play-btn { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:44px; height:44px; border-radius:50%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; transition:all 0.2s; backdrop-filter:blur(4px); border:1.5px solid rgba(255,255,255,0.2); }
.video-card { cursor:pointer; transition:transform 0.2s; }
.video-card:hover { transform:translateY(-4px); }
.lb-btn { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); border-radius:12px; color:#fff; cursor:pointer; font-size:20px; line-height:1; padding:12px 16px; transition:background .2s; }
.lb-btn:hover { background:rgba(255,255,255,0.18); }
/* float-reg-btn */
.float-reg-btn { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,#FF7A29,#D95E10); border:none; border-radius:12px; color:#fff; font-family:Montserrat,sans-serif; font-weight:900; font-size:13px; letter-spacing:.06em; cursor:pointer; padding:14px 22px; text-transform:uppercase; text-decoration:none; display:flex; align-items:center; gap:8px; box-shadow:0 8px 32px rgba(255,122,41,0.45); clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition:opacity .2s,transform .15s; }
.float-reg-btn:hover { opacity:.9; transform:translateY(-2px); }
@keyframes floatPulse { 0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4)} 50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)} }
.float-reg-pulse { animation:floatPulse 2.5s ease-in-out infinite; }
@media(max-width:1023px){ .float-reg-btn { display:none; } }
.video-grid { display:grid; grid-template-columns:1fr; gap:24px; }
@media(min-width:480px){ .video-grid { grid-template-columns:repeat(2,1fr); } }
@media(min-width:900px){ .video-grid { grid-template-columns:repeat(3,1fr); } }
.feat-card { position:relative; border-radius:20px; overflow:hidden; cursor:pointer; border:1px solid rgba(255,122,41,0.25); box-shadow:0 24px 64px rgba(0,0,0,0.5); transition:transform .25s, box-shadow .25s; }
.feat-card:hover { transform:translateY(-3px); box-shadow:0 32px 80px rgba(0,0,0,0.65); }
.feat-card:hover .play-btn { transform:translate(-50%,-50%) scale(1.1); background:rgba(255,122,41,0.85); }
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

function PlayButton({size=44}:{size?:number}) {
  return (
    <div className="play-btn" style={{width:size,height:size}}>
      <svg width={size*0.4} height={size*0.4} viewBox="0 0 12 14" fill="white">
        <path d="M0 0 L12 7 L0 14 Z"/>
      </svg>
    </div>
  );
}

const BASE = import.meta.env.BASE_URL;
const clipUrl = (f: string) => `${BASE}auction/clips/${f}`;

type ModalState =
  | { kind: 'yt'; id: string }
  | { kind: 'file'; src: string; loop?: boolean }
  | null;

export function Videos() {
  const { t } = useLang();
  const [modal, setModal] = React.useState<ModalState>(null);

  React.useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [modal]);

  const openClip = (c: AuctionClip) => setModal({ kind: 'file', src: clipUrl(c.file), loop: c.loop });

  return (
    <div style={{minHeight:'100vh',background:'#060E1C',fontFamily:'Inter,sans-serif',position:'relative'}}>
      <style>{CSS}</style>
      <AmbientBg/>
      <SiteHeader active="Videos" />

      {/* HERO */}
      <section style={{position:'relative',zIndex:1,padding:'100px 0 60px',textAlign:'center'}}>
        <div className="wrap">
          <div className="tag-pill" style={{marginBottom:24,animation:'floatUp 0.6s ease both'}}>BCPL TV</div>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,color:'#fff',marginBottom:12,animation:'floatUp 0.7s ease 0.1s both'}}>
            {t("WATCH EVERY","हर पल")}
          </h1>
          <h1 className="shimmer-gold" style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.05,marginBottom:24,animation:'floatUp 0.7s ease 0.2s both'}}>
            {t("MOMENT.","देखिए।")}
          </h1>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:18,maxWidth:520,margin:'0 auto',lineHeight:1.7,animation:'floatUp 0.7s ease 0.3s both'}}>
            {t("The Season 4 auction, team stories and league moments — your BCPL content hub.","Season 4 auction, team stories और league के पल — आपका BCPL content hub।")}
          </p>
        </div>
      </section>

      {/* SEASON 4 AUCTION — FEATURED FULL STREAM */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 56px'}}>
        <div className="wrap">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:22}}>
            <div>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(20px,3.5vw,30px)',color:'#fff',textTransform:'uppercase',letterSpacing:'.02em'}}>
                {t("Season 4 Auction","Season 4 Auction")}
              </h2>
              <div style={{fontFamily:'Inter,sans-serif',fontSize:13,color:'rgba(255,255,255,0.45)',marginTop:4}}>
                {t("The full live stream and official clips from the BCPL Season 4 player auction","BCPL Season 4 player auction का पूरा live stream और official clips")}
              </div>
            </div>
            <span className="tag-pill">{AUCTION_CLIPS.length + 1} {t("VIDEOS","VIDEOS")}</span>
          </div>

          {/* Featured: full auction stream (YouTube) */}
          <div className="feat-card" onClick={() => setModal({ kind: 'yt', id: AUCTION_STREAM.ytId })}
            style={{aspectRatio:'16/9',maxHeight:520,width:'100%',background:'#0A1727',marginBottom:14}}>
            <img src={clipUrl('auc-clip-01.jpg')} alt={t("BCPL Season 4 auction full stream","BCPL Season 4 auction का पूरा stream")}
              style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0.85}} loading="eager" decoding="async"/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,rgba(3,7,15,0.85) 0%,transparent 55%)'}}/>
            <PlayButton size={64}/>
            <div style={{position:'absolute',top:14,left:14,display:'flex',gap:8,flexWrap:'wrap'}}>
              <span style={{background:'#8B5CF6cc',backdropFilter:'blur(4px)',borderRadius:100,padding:'4px 12px',fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#fff',letterSpacing:'0.06em'}}>{t("SEASON 4 AUCTION","SEASON 4 AUCTION")}</span>
              <span style={{background:'#FF0000cc',backdropFilter:'blur(4px)',borderRadius:100,padding:'4px 12px',fontSize:10,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#fff',letterSpacing:'0.06em'}}>YOUTUBE</span>
            </div>
            <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'0 18px 18px'}}>
              <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(17px,2.6vw,26px)',color:'#fff',lineHeight:1.3}}>
                {t("BCPL Season 4 Auction — Full Live Stream","BCPL Season 4 Auction — पूरा Live Stream")}
              </div>
              <div style={{fontFamily:'Inter,sans-serif',fontSize:13,color:'rgba(255,255,255,0.6)',marginTop:4}}>
                {t("Every player, every bid — watch the complete auction","हर player, हर बोली — पूरा auction देखिए")}
              </div>
            </div>
            <div style={{position:'absolute',bottom:14,right:14,background:'rgba(0,0,0,0.8)',borderRadius:6,padding:'3px 9px',fontSize:12,color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:700}}>{AUCTION_STREAM.dur}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <a href={`https://youtu.be/${AUCTION_STREAM.ytId}`} target="_blank" rel="noopener noreferrer"
              style={{color:'rgba(255,255,255,0.55)',fontSize:13,fontFamily:'Inter,sans-serif',textDecoration:'none'}}>
              {t("Watch on YouTube ↗","YouTube पर देखें ↗")}
            </a>
          </div>
        </div>
      </section>

      {/* SEASON 4 AUCTION — CLIPS GRID */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 90px'}}>
        <div className="wrap">
          <div style={{marginBottom:18}}>
            <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(16px,2.6vw,22px)',color:'#fff',textTransform:'uppercase',letterSpacing:'.02em'}}>
              {t("Auction Floor Clips","Auction Floor की Clips")}
            </h3>
            <div style={{fontFamily:'Inter,sans-serif',fontSize:13,color:'rgba(255,255,255,0.45)',marginTop:4}}>
              {t("Short official clips shot at the Season 4 auction","Season 4 auction पर shoot हुई short official clips")}
            </div>
          </div>
          <div className="video-grid">
            {AUCTION_CLIPS.map((c,i)=>(
              <div key={c.file} className="video-card" style={{animation:`fadeSlide 0.5s ease ${(i%3)*0.1}s both`}} onClick={()=>openClip(c)}>
                <div className="video-thumb" style={{aspectRatio:'16/9',background:'#0A1727',marginBottom:12}}>
                  <img src={clipUrl(c.poster)} alt={t(c.title, c.titleHi)} loading={i < 3 ? 'eager' : 'lazy'} decoding="async"
                    style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
                  <PlayButton size={44}/>
                  <div style={{position:'absolute',top:10,left:10}}>
                    <span style={{background:'#8B5CF6cc',backdropFilter:'blur(4px)',borderRadius:100,padding:'3px 10px',fontSize:9,fontFamily:'Montserrat,sans-serif',fontWeight:700,color:'#fff',letterSpacing:'0.06em'}}>{t("SEASON 4 AUCTION","SEASON 4 AUCTION")}</span>
                  </div>
                  <div style={{position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,0.8)',borderRadius:5,padding:'2px 7px',fontSize:11,color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:700}}>{c.dur}</div>
                </div>
                <div>
                  <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:15,color:'#fff',marginBottom:6,lineHeight:1.4}}>{t(c.title, c.titleHi)}</h3>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:20,height:20,borderRadius:'50%',background:'linear-gradient(135deg,#FF7A29,#C94E0E)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,flexShrink:0}}>▶</div>
                    <span style={{color:'rgba(255,255,255,0.45)',fontSize:12,fontFamily:'Inter,sans-serif'}}>BCPL TV</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YOUTUBE CTA */}
      <section style={{position:'relative',zIndex:1,padding:'0 0 120px'}}>
        <div className="wrap">
          <div className="glass-card" style={{padding:'clamp(20px,5vw,48px) clamp(16px,4vw,48px)',textAlign:'center',maxWidth:640,margin:'0 auto',border:'1px solid rgba(255,122,41,0.15)'}}>
            <div style={{fontSize:44,marginBottom:12}}>▶️</div>
            <h3 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:24,color:'#fff',marginBottom:6}}>{t("Subscribe to BCPL TV","BCPL TV Subscribe करें")}</h3>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:14,marginBottom:24,fontFamily:'Inter,sans-serif'}}>{t("23K subscribers · New videos every match day","23K subscribers · हर match day नई videos")}</div>
            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
              <a href="https://www.youtube.com/@bcplt20league" target="_blank" rel="noopener noreferrer" style={{padding:'14px 36px',borderRadius:14,background:'#FF0000',border:'none',color:'#fff',fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',gap:8,letterSpacing:'0.02em',textDecoration:'none'}}>
                <span>▶</span> {t("Subscribe","Subscribe")}
              </a>
              <a href="https://www.youtube.com/@bcplt20league?sub_confirmation=1" target="_blank" rel="noopener noreferrer" style={{padding:'14px 28px',borderRadius:14,background:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.7)',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:15,cursor:'pointer',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8}}>
                🔔 {t("Enable Alerts","Alerts चालू करें")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO MODAL */}
      {modal && (
        <div onClick={() => setModal(null)}
          style={{position:'fixed',inset:0,zIndex:2000,background:'rgba(3,7,15,0.94)',display:'flex',alignItems:'center',justifyContent:'center',animation:'lbFade .2s ease both',padding:'clamp(8px,3vw,32px)'}}>
          <div onClick={e => e.stopPropagation()}
            style={{width:'min(1100px,96vw)',aspectRatio:'16/9',background:'#000',borderRadius:12,overflow:'hidden',boxShadow:'0 30px 90px rgba(0,0,0,0.8)'}}>
            {modal.kind === 'yt' ? (
              <iframe src={`https://www.youtube-nocookie.com/embed/${modal.id}?autoplay=1&rel=0`}
                title="BCPL video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen style={{width:'100%',height:'100%',border:'none',display:'block'}}/>
            ) : (
              <video src={modal.src} controls autoPlay playsInline loop={modal.loop}
                style={{width:'100%',height:'100%',display:'block',background:'#000'}}/>
            )}
          </div>
          <button className="lb-btn" aria-label="Close" onClick={() => setModal(null)}
            style={{position:'absolute',top:16,right:16}}>✕</button>
        </div>
      )}

      {/* ── FLOATING REGISTER BUTTON ── */}
      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>🏏 {t("REGISTER NOW","अभी REGISTER करें")} &rarr;</Link>
      <BCPLFooter />
      <StickyRegisterCTA/>
    </div>
  );
}
