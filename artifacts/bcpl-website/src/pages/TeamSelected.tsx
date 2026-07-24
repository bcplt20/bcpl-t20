import React, { useState } from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLang } from '../lib/i18n';

const BOOKING_REF = 'BCPL-S5-7432';
const L = import.meta.env.BASE_URL + 'bcpl-assets/logos/';

const TEAMS = [
  { name:'Rajasthan Scorchers', city:'Jaipur',     color:'#E97B6B', bg:'#1A0808', logo:`${L}rajasthan_scorchers.png`,  abbr:'RS', bid:'₹5,75,000' },
  { name:'Punjab Warriors',     city:'Chandigarh', color:'#DC2626', bg:'#1A0606', logo:`${L}punjab_warriors.png`,     abbr:'PW', bid:'₹4,50,000' },
  { name:'Kolkata Tigers',      city:'Kolkata',    color:'#F97316', bg:'#1A0A04', logo:`${L}kolkata_tigers.png`,      abbr:'KT', bid:'₹6,25,000' },
  { name:'Lucknow Nawabs',      city:'Lucknow',    color:'#F59E0B', bg:'#1A1204', logo:`${L}lucknow_nawabs.png`,      abbr:'LN', bid:'₹7,00,000' },
  { name:'Mumbai Mavericks',    city:'Mumbai',     color:'#3B82F6', bg:'#040E1A', logo:`${L}mumbai_mavericks.png`,    abbr:'MM', bid:'₹8,50,000' },
  { name:'Hyderabad Hawks',     city:'Hyderabad',  color:'#10B981', bg:'#041A10', logo:`${L}hyderabad_hawks.png`,     abbr:'HH', bid:'₹5,25,000' },
  { name:'Delhi Suryas',        city:'Delhi',      color:'#6366F1', bg:'#080A1A', logo:`${L}delhi_suryas.png`,        abbr:'DS', bid:'₹9,00,000' },
  { name:'Chennai Thalaivas',   city:'Chennai',    color:'#2563EB', bg:'#040B1A', logo:`${L}chennai_thalaivas.png`,   abbr:'CT', bid:'₹6,75,000' },
  { name:'Ahmedabad Lions',     city:'Ahmedabad',  color:'#B91C1C', bg:'#1A0404', logo:`${L}ahmedabad_lions.png`,     abbr:'AL', bid:'₹7,50,000' },
  { name:'Bengaluru Rockets',   city:'Bengaluru',  color:'#EF4444', bg:'#1A0606', logo:`${L}bengaluru_rockets.png`,   abbr:'BR', bid:'₹8,00,000' },
];

const ROADMAP = [
  { icon:'📝', label:'Register',     done:true },
  { icon:'🎬', label:'Video',        done:true },
  { icon:'🏟', label:'Phase 2',      done:true },
  { icon:'🪪', label:'KYC',          done:true },
  { icon:'🔨', label:'Auction',      done:true },
  { icon:'🏆', label:'Play BCPL',    done:true, final:true },
];

export function TeamSelected() {
  const [teamIdx, setTeamIdx]   = useState(4); // default: Mumbai Mavericks
  const team = TEAMS[teamIdx];
  const { t } = useLang();

  return (
    <div className="page-root">
      <style>{`
        .page-root { background: var(--bg); min-height: 100vh; font-family: var(--font-body); color: var(--ink); overflow-x: hidden; padding-bottom: 100px; }
        .W { max-width: var(--container); margin: 0 auto; padding: 0 20px; }
        @media(min-width: 768px){ .W { padding: 0 32px; } }
        @media(min-width: 1280px){ .W { padding: 0 48px; } }
        
        .btn-white { background: #fff; border: none; border-radius: var(--r); color: #000; font-family: var(--font-head); font-weight: 900; letter-spacing: .06em; cursor: pointer; transition: all .2s; text-transform: uppercase; padding: 16px 32px; font-size: 15px; box-shadow: 0 8px 24px rgba(255,255,255,0.2); }
        .btn-white:hover { filter: brightness(0.9); transform: translateY(-2px); }
        .btn-outline { background: transparent; border: 2px solid rgba(255,255,255,0.3); border-radius: var(--r); color: #fff; font-family: var(--font-head); font-weight: 800; cursor: pointer; transition: all .2s; padding: 16px 32px; font-size: 15px; text-transform: uppercase; letter-spacing: .04em; }
        .btn-outline:hover { border-color: #fff; background: rgba(255,255,255,0.1); }
        
        .team-pill { padding: 8px 16px; border-radius: 20px; font-family: var(--font-head); font-weight: 800; font-size: 12px; cursor: pointer; transition: all .2s; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); letter-spacing: .06em; white-space: nowrap; text-transform: uppercase; }
        .team-pill:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
        .team-pill.active { background: #fff; color: #000; border-color: #fff; box-shadow: 0 4px 12px rgba(255,255,255,0.2); }
        
        @keyframes scaleIn { from { transform: scale(0.6) rotate(-10deg); opacity: 0; } to { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes trophyBounce { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-10px) scale(1.05); } }
        @keyframes liveBlip { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
        
        .shimmer-white { background: linear-gradient(90deg, #fff, rgba(255,255,255,0.5), #fff, rgba(255,255,255,0.5), #fff); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmerWhite 3s linear infinite; }
        @keyframes shimmerWhite { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
        .next-card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 24px; transition: transform 0.2s; }
        .next-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.3); }
        
        .roadmap-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .roadmap-rail { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; min-width: 560px; }
      `}</style>

      <SiteHeader />

      {/* TEAM PICKER (demo toggle) */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--line)', padding: '12px 0', overflowX: 'auto' }}>
        <div className="W" style={{ display: 'flex', gap: 12, flexWrap: 'nowrap', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '.12em', flexShrink: 0, textTransform: 'uppercase' }}>{t("DEMO · PICK TEAM →", "डेमो · टीम चुनें →")}</span>
          {TEAMS.map((tInfo, i) => (
            <button key={tInfo.abbr} className={`team-pill ${i === teamIdx ? 'active' : ''}`} onClick={() => setTeamIdx(i)} style={ i === teamIdx ? { background: tInfo.color, borderColor: tInfo.color, color: '#fff' } : {} }>{tInfo.abbr}</button>
          ))}
        </div>
      </div>

      {/* HERO — SIGNED */}
      <section style={{ background: `linear-gradient(160deg, ${team.bg} 0%, var(--bg) 60%)`, padding: '80px 0 40px', position: 'relative', overflow: 'hidden', transition: 'background 0.5s' }}>
        {/* Radial glow */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${team.color}15 0%, transparent 70%)`, pointerEvents: 'none', transition: 'background 0.5s' }} />
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, ${team.color}, transparent)`, transition: 'background 0.5s' }} />
        {/* Logo watermark bg */}
        <div style={{ position: 'absolute', right: '-10%', top: '50%', transform: 'translateY(-50%)', width: '60%', maxWidth: 500, aspectRatio: '1', opacity: 0.05, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={team.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
        </div>

        <div className="W" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 48, animation: 'fadeUp 0.6s ease both' }}>
            {/* Trophy */}
            <div style={{ fontSize: 'clamp(64px, 12vw, 120px)', animation: 'trophyBounce 2.5s ease-in-out infinite', marginBottom: 24, display: 'inline-block' }}>🏆</div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: `${team.color}15`, border: `1px solid ${team.color}50`, borderRadius: '12px', padding: '8px 24px', marginBottom: 24, transition: 'all 0.5s' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'liveBlip 1.2s infinite' }} />
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 12, color: 'var(--green)', letterSpacing: '.14em', textTransform: 'uppercase' }}>{t("BCPL SEASON 5 · OFFICIALLY SIGNED", "BCPL सीजन 5 · आधिकारिक रूप से साइन")}</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(36px, 7vw, 72px)', lineHeight: 1.05, color: '#fff', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '-0.01em', animation: 'scaleIn 0.5s 0.1s ease both' }}>
              {t("YOU'VE BEEN", "आपको")}<br/>
              <span style={{ color: team.color, transition: 'color 0.5s' }}>{t("SIGNED!", "साइन कर लिया गया है!")}</span>
            </h1>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto 16px', animation: 'fadeUp 0.5s 0.2s ease both' }}>
              {t("Congratulations!", "बधाई हो!")} <strong style={{ color: '#fff' }}>{t(team.name, team.name)}</strong> {t("has selected you in the BCPL Season 5 Franchise Auction.", "ने आपको BCPL सीजन 5 फ्रैंचाइज़ी ऑक्शन में चुना है।")}
            </p>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '.14em', marginBottom: 40, textTransform: 'uppercase', animation: 'fadeUp 0.5s 0.3s ease both' }}>
              {t("PLAYER REF", "प्लेयर रेफ")} · <span style={{ color: team.color, transition: 'color 0.5s' }}>{BOOKING_REF}</span>
            </div>
          </div>

          {/* SIGNED CONTRACT CARD */}
          <div style={{ maxWidth: 640, margin: '0 auto', background: `linear-gradient(135deg, ${team.bg}, var(--bg))`, border: `2px solid ${team.color}`, borderRadius: 'var(--r)', padding: '32px 24px', position: 'relative', overflow: 'hidden', transition: 'all 0.5s', animation: 'fadeUp 0.5s 0.35s ease both', boxShadow: `0 20px 60px ${team.color}20` }}>
            {/* Ticket notches */}
            <div style={{ position: 'absolute', left: -2, top: '50%', width: 24, height: 48, background: 'var(--bg)', borderRadius: '0 50% 50% 0', border: `2px solid ${team.color}`, borderLeft: 'none', transform: 'translateY(-50%)', transition: 'border-color 0.5s' }} />
            <div style={{ position: 'absolute', right: -2, top: '50%', width: 24, height: 48, background: 'var(--bg)', borderRadius: '50% 0 0 50%', border: `2px solid ${team.color}`, borderRight: 'none', transform: 'translateY(-50%)', transition: 'border-color 0.5s' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', padding: '0 16px' }}>
              {/* Team logo */}
              <div style={{ width: 88, height: 88, borderRadius: '16px', background: '#fff', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                <img src={team.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt={team.name} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 11, color: team.color, letterSpacing: '.14em', marginBottom: 6, textTransform: 'uppercase', transition: 'color 0.5s' }}>{t("FRANCHISE CONTRACT · SEASON 5", "फ्रैंचाइज़ी कॉन्ट्रैक्ट · सीजन 5")}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(20px, 4vw, 28px)', color: '#fff', marginBottom: 4, textTransform: 'uppercase' }}>{t(team.name, team.name)}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{t(team.city, team.city)} · {t("Corporate T20 Franchise", "कॉर्पोरेट टी20 फ्रैंचाइज़ी")}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '.12em', marginBottom: 4, textTransform: 'uppercase' }}>{t("CONTRACT VALUE", "कॉन्ट्रैक्ट की कीमत")}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(28px, 5vw, 40px)', color: team.color, transition: 'color 0.5s' }}>{team.bid}</div>
              </div>
            </div>

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${team.color}30`, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, textAlign: 'center', transition: 'border-color 0.5s' }}>
              {[
                { label: t('Player', 'प्लेयर'), val: 'Rahul Sharma' },
                { label: t('Role', 'रोल'), val: t('Batsman', 'बल्लेबाज') },
                { label: t('Ref', 'रेफ'), val: BOOKING_REF },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 14, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' }}>{f.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: 100, background: 'linear-gradient(180deg, transparent, var(--bg))', marginTop: 48 }} />
      </section>

      <div className="W">
        {/* JOURNEY RAIL — all complete */}
        <div style={{ background: 'var(--panel)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--r)', padding: '32px 24px', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 13, letterSpacing: '.14em', color: 'var(--green)', textTransform: 'uppercase', marginBottom: 24 }}>🏆 {t("JOURNEY COMPLETE · ALL 6 STAGES CLEARED", "सफर पूरा · सभी 6 स्टेज क्लियर")}</div>
          <div className="roadmap-scroll">
          <div className="roadmap-rail">
            {ROADMAP.map((step, i) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: step.final ? 24 : 18, background: step.final ? 'linear-gradient(135deg, var(--gold), #F59E0B)' : 'linear-gradient(135deg, var(--green), #16A34A)', border: 'none', animation: step.final ? 'trophyBounce 2.5s ease-in-out infinite' : 'none', color: '#fff', fontWeight: 900, boxShadow: step.final ? '0 0 20px rgba(232,178,61,0.5)' : 'none' }}>
                    {step.final ? '🏆' : '✓'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 11, color: step.final ? 'var(--gold)' : 'var(--green)', textAlign: 'center', letterSpacing: '.06em', textTransform: 'uppercase' }}>{t(step.label, step.label)}</div>
                </div>
                {i < ROADMAP.length - 1 && <div style={{ flex: 1.5, height: 2, background: 'rgba(34,197,94,0.4)', margin: '0 8px', marginBottom: 28 }} />}
              </React.Fragment>
            ))}
          </div>
          </div>
        </div>

        {/* WHAT HAPPENS NEXT */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(24px, 4vw, 32px)', color: '#fff', marginBottom: 8, textTransform: 'uppercase' }}>{t("What Happens Next?", "आगे क्या होगा?")}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{t("Your franchise will contact you within 24 hours.", "आपकी फ्रैंचाइज़ी 24 घंटे के भीतर आपसे संपर्क करेगी।")}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {[
              { icon:'📱', title: t('Franchise WhatsApp', 'फ्रैंचाइज़ी WhatsApp'), body: t(`You'll be added to the official ${team.name} team WhatsApp group within 24 hours of the auction close.`, `ऑक्शन समाप्त होने के 24 घंटे के भीतर आपको आधिकारिक ${team.name} टीम WhatsApp ग्रुप में जोड़ दिया जाएगा।`) },
              { icon:'🧢', title: t('Team Kit & Jersey', 'टीम किट और जर्सी'), body: t('Your custom jersey, training gear, and Season 5 player ID will be dispatched to your address by courier.', 'आपकी कस्टम जर्सी, ट्रेनिंग गियर और सीजन 5 प्लेयर ID कूरियर द्वारा आपके पते पर भेज दी जाएगी।') },
              { icon:'📅', title: t('Training Schedule', 'ट्रेनिंग शेड्यूल'), body: t('Your franchise captain will share the training calendar, match venue, and pre-season camp details.', 'आपकी फ्रैंचाइज़ी का कप्तान ट्रेनिंग कैलेंडर, मैच का स्थान और प्री-सीजन कैंप की जानकारी साझा करेगा।') },
              { icon:'🏟', title: t('Season 5 Begins', 'सीजन 5 शुरू'), body: t('BCPL Season 5 tournament matches begin Sep–Oct 2026. You\'ll receive your fixture schedule via email + WhatsApp.', 'BCPL सीजन 5 टूर्नामेंट के मैच सितंबर-अक्टूबर 2026 में शुरू होंगे। आपको अपना फिक्सचर शेड्यूल ईमेल + WhatsApp के माध्यम से मिलेगा।') },
            ].map(card => (
              <div key={card.title} className="next-card">
                <div style={{ fontSize: 36, marginBottom: 16 }}>{card.icon}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 10, textTransform: 'uppercase' }}>{card.title}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{card.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SHARE */}
        <div style={{ background: `linear-gradient(135deg, ${team.bg}, var(--bg))`, border: `2px solid ${team.color}40`, borderRadius: 'var(--r)', padding: '40px 24px', textAlign: 'center', transition: 'all 0.5s', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${team.color}10 0%, transparent 70%)`, pointerEvents: 'none', transition: 'background 0.5s' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 'clamp(20px, 3vw, 28px)', color: '#fff', marginBottom: 8, textTransform: 'uppercase' }}>{t("Share Your Milestone", "अपनी उपलब्धि साझा करें")}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>{t("You made it from office to stadium. Let the world know.", "आपने ऑफिस से स्टेडियम तक का सफर तय किया है। दुनिया को बताएं।")}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {['📲 WhatsApp', '🐦 Twitter/X', '📸 Instagram'].map(btn => (
                <button key={btn} className="btn-outline" style={{ padding: '14px 24px', fontSize: 14, letterSpacing: '.06em' }}>{btn}</button>
              ))}
            </div>
            <div style={{ marginTop: 24, fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '.14em', textTransform: 'uppercase' }}>#OfficeSeStadiumtak · #BCPLT20 · #{team.name.replace(/\s/g,'')}</div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <BCPLFooter />
    </div>
  );
}
