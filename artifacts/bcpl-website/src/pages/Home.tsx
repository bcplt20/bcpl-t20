import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { getMatches, getPointsTable, isAuthenticated, type FeeConfig } from "../lib/api";
import { useFees, inr } from "../lib/fees";
import { SEASON } from "../lib/season";
import { BCPLFooter } from "../components/BCPLFooter";
import { SiteHeader } from "../components/SiteHeader";
import { useLang } from "../lib/i18n";
import { FlipCountdown } from "../components/FlipCountdown";
import { IcoCheck, IcoShield, IcoClock, IcoLock, IcoList, IcoTrophy, IcoPin, IcoBat, IcoBall, IcoStar, IcoFlag, IcoStadium } from "../lib/icons";
import { MatchCard } from "../components/MatchCard";

const PHASE1_DEADLINE = "2027-02-28T23:59:59+05:30";

const BASE = import.meta.env.BASE_URL;
const L = BASE + "bcpl-assets/logos/";

/* ── The 30-sec BCPL film shipped with the site (compressed, local). ── */
const STORY_FILM = BASE + "bcpl-assets/bcpl-30sec.mp4";

/* ── Video links (YouTube). Khali ("") = story ke liye local film chalegi,
     ganguly ke liye /videos page. Jaise hi YouTube link ready ho, yahan daal dein. ── */
const HOME_VIDEOS = {
  story:   "",   // 45-60 sec "This is BCPL" film (YouTube) — khali = local 30-sec film
  ganguly: "",   // Sourav Ganguly ka message
};

const TEAMS = [
  { name:"Rajasthan Scorchers",  city:"Jaipur",      color:"#E97B6B", slug:"rajasthan_scorchers"  },
  { name:"Punjab Warriors",      city:"Chandigarh",  color:"#DC2626", slug:"punjab_warriors"       },
  { name:"Kolkata Tigers",        city:"Kolkata",     color:"#F97316", slug:"kolkata_tigers"        },
  { name:"Lucknow Nawabs",        city:"Lucknow",     color:"#F59E0B", slug:"lucknow_nawabs"        },
  { name:"Mumbai Mavericks",      city:"Mumbai",      color:"#3B82F6", slug:"mumbai_mavericks"      },
  { name:"Hyderabad Hawks",       city:"Hyderabad",   color:"#16A34A", slug:"hyderabad_hawks"       },
  { name:"Delhi Suryas",           city:"Delhi",       color:"#6366F1", slug:"delhi_suryas"          },
  { name:"Chennai Thalaivas",      city:"Chennai",     color:"#2563EB", slug:"chennai_thalaivas"     },
  { name:"Ahmedabad Lions",        city:"Ahmedabad",   color:"#B91C1C", slug:"ahmedabad_lions"       },
  { name:"Bengaluru Rockets",      city:"Bengaluru",   color:"#EF4444", slug:"bengaluru_rockets"     },
];

/* ── LEAGUE STRIP — broadcast-style animated ticker below the hero ── */
const TICKER = [
  { en:"Season 5",                 hi:"सीज़न 5",                    live:true  },
  { en:`${SEASON.trialCities} Trial Cities`,         hi:`${SEASON.trialCities} trial शहर`                          },
  { en:`${SEASON.teams} Teams`,                 hi:`${SEASON.teams} टीमें`                               },
  { en:`${SEASON.prizePool} Prize Pool`,       hi:"₹15 करोड़+ प्राइज़ पूल"                  },
  { en:"International Cricket Grounds", hi:"इंटरनेशनल क्रिकेट ग्राउंड्स"        },
  { en:"Live Player Auction",      hi:"लाइव Player Auction"                    },
  { en:`${SEASON.playerValue} Player Value`,    hi:`${SEASON.playerValue} player value`                  },
];

/* ── REAL PROOF — photographs from BCPL's own Season 4 events ── */
const PROOF = [
  { img:"auction-hero.webp",       wide:true,  en:"Live Player Auction — Season 4",   hi:"लाइव Player Auction — Season 4" },
  { img:"event-stage-trophy.webp", wide:false, en:"The BCPL Trophy",                  hi:"BCPL Trophy" },
  { img:"event-teams-b.webp",      wide:false, en:"10 Franchises, One Stage",         hi:"10 franchises, एक मंच" },
  { img:"jerseys.webp",            wide:true,  en:"Season 4 Team Jerseys",            hi:"Season 4 की team jerseys" },
  { img:"event-panel.webp",        wide:false, en:"League Launch Panel",              hi:"League launch panel" },
  { img:"event-teams-a.webp",      wide:false, en:"Franchise Owners & Captains",      hi:"Franchise owners और captains" },
];

/* ── HOW BCPL WORKS — 4 concise steps (spec #14; fees from shared config).
     The deeper journey detail lives on the registration + journey pages. ── */
const ROAD = (f: FeeConfig) => [
  { icon:"reg", en:"Register",         hi:"रजिस्टर",        date:"Oct '26 – Feb '27", fee: inr(f.phase1.bat) + " / " + inr(f.phase1.ar) + " + GST", descEn:"Pick your role, pay online — done in 5 minutes.",                                                       descHi:"Role चुनें, online payment करें — 5 मिनट में हो गया।",                                        color:"#FF7A29", live:true },
  { icon:"video", en:"Video Trial",      hi:"वीडियो ट्रायल",  date:"Within 15 days",    fee:null,                                                      descEn:"Upload a 30–60 second cricket clip from any ground in India.",                                          descHi:"किसी भी मैदान से 30–60 second की cricket clip upload करें।",                                       color:"#FF9350" },
  { icon:"result", en:"Phase 1 Result",   hi:"फेज़ 1 रिज़ल्ट", date:"Within 15 days",   fee:null,                                                      descEn:"Your video is evaluated against BCPL's Phase 1 assessment criteria.",                                   descHi:"आपका video BCPL के Phase 1 assessment criteria पर evaluate होता है।",                          color:"#E8B23D" },
  { icon:"trophy", en:"Phase 2 & Beyond", hi:"फेज़ 2 और आगे",  date:"Mar – Oct '27",     fee: inr(f.phase2.bat) + " / " + inr(f.phase2.ar) + " + GST", descEn:"After Phase 1 qualification — physical trial in your city, the live franchise auction, then Season 5 under the floodlights.", descHi:"Phase 1 qualify करने के बाद — आपके शहर में physical trial, live franchise auction, फिर floodlights के नीचे Season 5।", color:"#F0C860" },
];

/* ── SEASON 5 ROADMAP — premium animated timeline (spec §6):
     Registration → Video Trial → Physical Trial → Auction → Tournament.
     `live:true` = the step currently open (highlighted + pulsing). ── */
const S5_ROADMAP = [
  { icon:"reg",    moEn:"Oct – Feb", moHi:"अक्टू – फ़रवरी", en:"Registration",   hi:"रजिस्ट्रेशन",      color:"#FF7A29", live:true },
  { icon:"video",  moEn:"Within 15 days", moHi:"15 दिन में", en:"Video Trial",   hi:"वीडियो ट्रायल",    color:"#FF9350" },
  { icon:"trial",  moEn:"Mar – Jun", moHi:"मार्च – जून",    en:"Physical Trial", hi:"फिज़िकल ट्रायल",   color:"#E8B23D" },
  { icon:"auction",moEn:"Aug",       moHi:"अगस्त",          en:"Auction",        hi:"ऑक्शन",           color:"#F0C860" },
  { icon:"trophy", moEn:"Sep – Oct", moHi:"सितं – अक्टू",   en:"Tournament",     hi:"टूर्नामेंट",        color:"#22C55E" },
];

/* ── REAL PLAYER STORIES — sirf VERIFIED asli players.
     3-6 past players ki details yahan daalein (photo public/bcpl-assets/players/ mein rakhein).
     Jab tak array khali hai, yeh section website par NAHI dikhega — koi fake story nahi.
     Format: { name:"Rahul Sharma", profession:"Software Engineer", city:"Delhi",
               season:"Season 4", team:"Mumbai Mavericks", photo: BASE+"bcpl-assets/players/rahul.jpg",
               quoteEn:"...", quoteHi:"...", videoUrl:"" } ── */
type Story = { name:string; profession:string; city:string; season:string; team:string; photo:string; quoteEn:string; quoteHi:string; videoUrl?:string };
const STORIES: Story[] = [];

/* ── League in numbers — VERIFIED figures only (same claims used across the site) ── */
const NUMBERS = [
  { end:250000, inFmt:true,  prefix:"",  suffix:"+",     en:"Working Professionals Joined", hi:"Working professionals जुड़े" },
  { end:400,    inFmt:false, prefix:"",  suffix:"+",     en:"Players Auctioned",            hi:"खिलाड़ी auction हुए" },
  { end:14,     inFmt:false, prefix:"₹", suffix:" Cr+",  en:"Prize Money Distributed",      hi:"इनाम बाँटे जा चुके" },
  { end:4,      inFmt:false, prefix:"",  suffix:"",      en:"Seasons Completed",            hi:"सीज़न पूरे" },
  { end:50,     inFmt:false, prefix:"",  suffix:"+",     en:"Trial Cities",                 hi:"ट्रायल शहर" },
  { end:10,     inFmt:false, prefix:"",  suffix:"",      en:"Franchises",                   hi:"फ्रैंचाइज़ी" },
];

const FAQS = (f: FeeConfig) => [
  { qEn:"How much do I pay in Phase 1?",         qHi:"Phase 1 में कितना देना होगा?",
    aEn: inr(f.phase1.bat) + " + GST for Batsman/Bowler/Wicket-keeper. " + inr(f.phase1.ar) + " + GST for All-rounders. Nothing else is payable in Phase 1.",
    aHi: "Batsman/Bowler/Wicket-keeper के लिए " + inr(f.phase1.bat) + " + GST। All-rounder के लिए " + inr(f.phase1.ar) + " + GST। Phase 1 में इसके अलावा कुछ नहीं।" },
  { qEn:"Do I pay extra for Phase 2?",           qHi:"क्या Phase 2 के लिए अलग से देना होगा?",
    aEn:"Only after Phase 1 qualification. Phase 2 fee is " + inr(f.phase2.bat) + " + GST (Bat/Bowl/WK) or " + inr(f.phase2.ar) + " + GST (All-rounder) — a separate payment charged solely for participation in the Phase 2 physical trial. Fees once paid are non-refundable except where expressly provided in the Refund & Cancellation Policy.",
    aHi:"सिर्फ Phase 1 qualify करने के बाद। Phase 2 fee " + inr(f.phase2.bat) + " + GST (Bat/Bowl/WK) या " + inr(f.phase2.ar) + " + GST (All-rounder) — यह अलग payment सिर्फ Phase 2 physical trial में participation के लिए है। एक बार paid fee refundable नहीं है, सिवाय उन स्थितियों के जो Refund & Cancellation Policy में साफ़ लिखी हैं।" },
  { qEn:"Are there hidden costs?",               qHi:"क्या कोई छिपे हुए charges हैं?",
    aEn:"The Phase 2 fee is payable only if you qualify and choose to proceed. Maximum total cost is " + inr(f.phase1.bat + f.phase2.bat) + "–" + inr(f.phase1.ar + f.phase2.ar) + " + GST for your entire BCPL journey — registration to franchise auction.",
    aHi:"Phase 2 fee सिर्फ तभी देनी होती है जब आप qualify करें और आगे बढ़ना चुनें। पूरे BCPL सफर की अधिकतम कुल लागत " + inr(f.phase1.bat + f.phase2.bat) + "–" + inr(f.phase1.ar + f.phase2.ar) + " + GST है — registration से लेकर auction तक।" },
  { qEn:"Who reviews my Phase 1 video?",         qHi:"मेरा Phase 1 video कौन देखता है?",
    aEn:"Your video is evaluated against BCPL's Phase 1 assessment criteria. Results are shared within 15 days of submission.",
    aHi:"आपका video BCPL के Phase 1 assessment criteria पर evaluate होता है। Result submission के 15 दिनों के भीतर SMS/email से मिलता है।" },
  { qEn:"Which cities have physical trials?",    qHi:"Physical trials किन शहरों में होंगे?",
    aEn:"Cities across India including Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Lucknow, Pune, Surat, Nagpur, Indore, Bhopal, Patna, Kochi, and many more.",
    aHi:"भारत भर के शहर — Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Lucknow, Pune, Surat, Nagpur, Indore, Bhopal, Patna, Kochi और भी कई।" },
  { qEn:"What if I'm not selected for Phase 2?", qHi:"अगर मैं Phase 2 के लिए select नहीं हुआ तो?",
    aEn:"You simply don't pay for Phase 2. Your Phase 1 fee covers registration and the Phase 1 video assessment, and there is no further obligation.",
    aHi:"तो Phase 2 का कुछ भी नहीं देना। Phase 1 fee में registration और Phase 1 video assessment शामिल है — उसके बाद कोई obligation नहीं।" },
];

/* ── YouTube URL → embeddable URL (strict host allowlist; null = not embeddable) ── */
const YT_HOSTS = ["youtube.com","www.youtube.com","m.youtube.com","www.youtube-nocookie.com"];
function toEmbed(url:string):string|null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    if (u.hostname === "youtu.be") return "https://www.youtube.com/embed/" + u.pathname.slice(1) + "?autoplay=1&rel=0";
    if (YT_HOSTS.includes(u.hostname)) {
      if (u.pathname.startsWith("/embed/")) return url;
      if (u.pathname.startsWith("/shorts/")) return "https://www.youtube.com/embed/" + u.pathname.split("/")[2] + "?autoplay=1&rel=0";
      const v = u.searchParams.get("v");
      if (v) return "https://www.youtube.com/embed/" + v + "?autoplay=1&rel=0";
    }
  } catch { /* fall through */ }
  return null;
}

/* ═══════════════════════════════════════════════════════════ */
export function Home() {
  const { t, lang } = useLang();
  const [faqOpen,   setFaqOpen]   = useState<number|null>(null);
  const [video,     setVideo]     = useState<string|null>(null);
  const [, navigate] = useLocation();
  const authed = isAuthenticated();
  const fees   = useFees();
  const gstPct = Math.round(fees.gstRate * 100);
  const ROAD_STEPS = ROAD(fees);
  const FAQ_ITEMS  = FAQS(fees);

  const vMaskRef   = useRef<HTMLDivElement|null>(null);
  const vOpenerRef = useRef<HTMLElement|null>(null);

  const rememberOpener = () => {
    vOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  };
  const showVideo = (url:string) => {
    if (toEmbed(url)) { rememberOpener(); setVideo(url); }
    else navigate("/videos");
  };
  const openVideo = (key: keyof typeof HOME_VIDEOS) => {
    const url = HOME_VIDEOS[key];
    if (url) { showVideo(url); return; }
    if (key === "story") { rememberOpener(); setVideo(STORY_FILM); return; }
    navigate("/videos");
  };

  /* Live data from API */
  const [liveMatches,  setLiveMatches]  = useState<any[]>([]);
  const [liveTable,    setLiveTable]    = useState<any[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const fetchLiveData = () => {
    getMatches(5).then(r => setLiveMatches(r.matches)).catch(()=>{});
    getPointsTable(5).then(r => setLiveTable(r.table)).catch(()=>{});
  };

  useEffect(()=>{
    fetchLiveData();
    pollRef.current = setInterval(fetchLiveData, 30000);
    return ()=>{ if(pollRef.current) clearInterval(pollRef.current); };
  },[]);

  /* Video modal: ESC close + Tab focus trap + focus restore to opener */
  useEffect(()=>{
    if(!video) return;
    const mask = vMaskRef.current;
    const focusables = ()=> mask ? Array.from(mask.querySelectorAll<HTMLElement>("button, iframe, video")) : [];
    const els0 = focusables();
    (els0.find(el=>el.tagName==="BUTTON") ?? els0[0])?.focus();
    const onKey = (e:KeyboardEvent)=>{
      if(e.key==="Escape"){ setVideo(null); return; }
      if(e.key!=="Tab") return;
      const els = focusables();
      if(!els.length) return;
      const first = els[0], last = els[els.length-1];
      const active = document.activeElement as HTMLElement|null;
      const inside = !!(active && mask && mask.contains(active));
      if(e.shiftKey ? (active===first || !inside) : (active===last || !inside)){
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return ()=>{
      window.removeEventListener("keydown", onKey);
      vOpenerRef.current?.focus();
      vOpenerRef.current = null;
    };
  },[video]);

  /* Deep-link: scroll to #hash section after mount (SPA renders after load) */
  useEffect(()=>{
    const h = window.location.hash;
    if (!h) return;
    const tm = setTimeout(()=>{ document.getElementById(h.slice(1))?.scrollIntoView(); }, 200);
    return ()=>clearTimeout(tm);
  },[]);

  /* Scroll-reveal for .rv elements.
     SAFETY-FIRST: content must NEVER stay hidden. IntersectionObserver only
     adds the fade-in nicety; a scroll/resize/interval sweep guarantees that
     anything near the viewport (including late-rendered elements) is revealed
     even if the observer never fires (some iOS in-app browsers). */
  const rootRef = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    const root = rootRef.current;
    if (!root) return;
    if (!("IntersectionObserver" in window)) return; // no JS gating class -> CSS keeps everything visible
    document.documentElement.classList.add("rv-js");
    const SEL = ".rv, .rv-stagger, .rv-up, .rv-left, .rv-scale";
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("rv-in"); obs.unobserve(e.target); } }),
      { threshold: 0.05, rootMargin: "0px 0px 80px 0px" }
    );
    const seen = new WeakSet<Element>();
    const scan = (instantFirstView: boolean) => {
      root.querySelectorAll(SEL).forEach(el => {
        if (el.classList.contains("rv-in")) return;
        const r = el.getBoundingClientRect();
        const near = r.top < window.innerHeight + 120 && r.bottom > -120;
        if (near) {
          if (instantFirstView) el.classList.add("rv-now","rv-in");
          else el.classList.add("rv-in");
          return;
        }
        if (!seen.has(el)) { seen.add(el); obs.observe(el); }
      });
    };
    scan(true); // first viewport reveals instantly, rest handed to the observer
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(()=>{ raf = 0; scan(false); }); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    /* Sweep a few times after mount to catch late-rendered content (API data). */
    const iv = window.setInterval(()=>scan(false), 800);
    const ivStop = window.setTimeout(()=>clearInterval(iv), 8000);
    return ()=>{
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      clearInterval(iv); clearTimeout(ivStop);
    };
  },[lang]);

  return (
    <div ref={rootRef} className="home-root" style={{ background:"var(--bg)", color:"#F0EDE8", fontFamily:"'Inter',sans-serif", overflowX:"hidden" }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        .W{max-width:1200px;margin:0 auto;padding:0 20px;}
        @media(min-width:768px){.W{padding:0 32px;}}
        @media(min-width:1280px){.W{padding:0 48px;}}
        .mont{font-family:var(--font-head);}
        .bhead{font-family:'Barlow Condensed','Mukta','Montserrat',sans-serif;}

        @keyframes pulse6   {0%,100%{box-shadow:0 0 0 0 rgba(255,122,41,.4)}50%{box-shadow:0 0 0 10px rgba(255,122,41,0)}}
        @keyframes blip     {0%,100%{opacity:1}50%{opacity:.15}}
        @keyframes gradMove {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes kenburns {from{transform:scale(1.02) translate(0,0)}to{transform:scale(1.12) translate(-1.6%,1.2%)}}
        @keyframes floodPulse{0%,100%{opacity:.35}50%{opacity:.7}}
        @keyframes playRing {0%{box-shadow:0 0 0 0 rgba(255,122,41,.5)}100%{box-shadow:0 0 0 26px rgba(255,122,41,0)}}
        @keyframes tickMove {from{transform:translateX(0)}to{transform:translateX(-50%)}}

        .btn-cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#FF8A3D 0%,#FF7A29 45%,#D95E10 100%);border:none;border-radius:14px;color:#fff;font-family:var(--font-head);font-weight:900;font-size:14px;letter-spacing:.04em;cursor:pointer;padding:14px 28px;min-height:48px;text-transform:uppercase;text-decoration:none;transition:filter .2s,transform .14s,box-shadow .2s;box-shadow:0 8px 26px rgba(255,122,41,.4),inset 0 1px 0 rgba(255,255,255,.22);}
        .btn-cta:hover{filter:brightness(1.08);transform:translateY(-2px);box-shadow:0 12px 34px rgba(255,122,41,.52),inset 0 1px 0 rgba(255,255,255,.28);}
        .btn-cta:active{transform:scale(.98);}
        .btn-ghost{display:inline-flex;align-items:center;gap:8px;background:rgba(18,32,60,.4);border:1.5px solid rgba(255,255,255,.28);border-radius:14px;color:rgba(255,255,255,.9);font-family:var(--font-head);font-weight:700;font-size:14px;cursor:pointer;padding:13px 26px;text-transform:uppercase;transition:border-color .2s,color .2s;text-decoration:none;backdrop-filter:blur(6px);}
        .btn-ghost:hover{border-color:#E8B23D;color:#E8B23D;}

        .slbl{font-family:var(--font-head);font-weight:800;font-size:11px;letter-spacing:.15em;color:#FF7A29;text-transform:uppercase;display:flex;align-items:center;gap:10px;margin-bottom:14px;}
        .slbl::before{content:'';display:inline-block;width:20px;height:2px;background:#FF7A29;}
        .card{background:linear-gradient(165deg,#25477C 0%,#24396B 60%,#1D3B67 100%);border:1px solid rgba(255,255,255,0.2);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.05);}
        .shim{background:linear-gradient(90deg,#FF7A29,#FFB347,#FF7A29);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradMove 3s ease infinite;}
        .shim-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradMove 3s ease infinite;}

        /* Scroll reveal */
        @keyframes rvAutoShow{to{opacity:1;transform:none;}}
        html.rv-js .rv{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease;animation:rvAutoShow .6s ease 2s forwards;}
        .rv-in{opacity:1;transform:translateY(0);}
        @media(prefers-reduced-motion:reduce){
          .rv{opacity:1;transform:none;}
          .hero-bg,.play-btn{animation:none!important;}
          .tick{animation:none!important;}
          .hero-stats .hs{animation:none!important;}
        }

        /* HERO */
        .hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%;opacity:.5;animation:kenburns 26s ease-in-out infinite alternate;will-change:transform;}
        .hero-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.5;}
        .hero-flood{position:absolute;pointer-events:none;animation:floodPulse 7s ease-in-out infinite;}
        .hero-ganguly{position:absolute;right:0;bottom:0;height:96%;width:auto;object-fit:cover;object-position:center top;opacity:.9;pointer-events:none;user-select:none;filter:contrast(1.06) brightness(.98);mask-image:linear-gradient(to left,rgba(0,0,0,1) 30%,rgba(0,0,0,.6) 62%,transparent 88%);-webkit-mask-image:linear-gradient(to left,rgba(0,0,0,1) 30%,rgba(0,0,0,.6) 62%,transparent 88%);}
        @media(max-width:899px){.hero-ganguly{opacity:.22;height:100%;right:-10%;}}
        .hero-inner{position:relative;z-index:2;padding:clamp(60px,9vw,110px) 0 clamp(56px,9vw,100px);max-width:680px;}
        .hero-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 20px;margin-bottom:20px;max-width:540px;}
        .hero-stats .hs{position:relative;animation:statIn .7s cubic-bezier(.22,1,.36,1) both;}
        .hero-stats .hs-n{font-family:var(--font-head);font-weight:900;font-size:clamp(24px,3.2vw,34px);line-height:1;color:#fff;letter-spacing:.01em;font-variant-numeric:tabular-nums;text-shadow:0 2px 18px rgba(0,0,0,.5);white-space:nowrap;}
        .hero-stats .hs-l{font-family:var(--font-head);font-weight:700;font-size:clamp(9.5px,1.1vw,11px);letter-spacing:.16em;color:#E8B23D;text-transform:uppercase;margin-top:6px;white-space:nowrap;}
        @media(min-width:900px){
          .hero-stats{display:flex;align-items:stretch;gap:0;max-width:none;}
          .hero-stats .hs{padding:2px 18px;}
          .hero-stats .hs:first-child{padding-left:0;}
          .hero-stats .hs+.hs::before{content:'';position:absolute;left:0;top:10%;bottom:10%;width:1px;background:linear-gradient(180deg,transparent,rgba(232,178,61,.5),transparent);}
        }
        @keyframes statIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

        /* League strip ticker */
        .tick-wrap{overflow:hidden;background:linear-gradient(90deg,#1F3652,#213C62 50%,#1F3652);border-top:1px solid rgba(232,178,61,.28);border-bottom:1px solid rgba(232,178,61,.28);position:relative;mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);}
        .tick{display:flex;width:max-content;animation:tickMove 46s linear infinite;}
        .tick:hover{animation-play-state:paused;}
        .tick-item{display:inline-flex;align-items:center;gap:16px;padding:13px 0 13px 16px;white-space:nowrap;}
        .tick-item .tx{font-family:'Barlow Condensed','Mukta',sans-serif;font-weight:700;font-size:clamp(16px,2vw,20px);letter-spacing:.12em;color:#E8B23D;text-transform:uppercase;}
        .tick-item .sep{width:6px;height:6px;border-radius:50%;background:rgba(255,122,41,.55);margin-left:16px;flex-shrink:0;}

        /* THIS IS BCPL — video section */
        .play-btn{width:clamp(72px,10vw,96px);height:clamp(72px,10vw,96px);border-radius:50%;border:none;cursor:pointer;background:linear-gradient(135deg,#FF7A29,#D95E10);color:#fff;font-size:clamp(24px,3.4vw,32px);display:inline-flex;align-items:center;justify-content:center;animation:playRing 2.2s ease-out infinite;transition:transform .2s;box-shadow:0 10px 40px rgba(255,122,41,.45);}
        .play-btn:hover{transform:scale(1.07);}

        /* Road */
        .road{display:grid;grid-template-columns:1fr;gap:12px;position:relative;padding:4px 0 8px;}
        @media(min-width:640px){.road{grid-template-columns:repeat(2,1fr);gap:14px;}}
        .road-card{position:relative;border-radius:16px;padding:22px 20px 20px;background:linear-gradient(165deg,#26487C 0%,#24396B 60%,#1D3864 100%);border:1px solid rgba(255,255,255,0.2);box-shadow:0 10px 28px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.05);transition:transform .28s cubic-bezier(.22,1,.36,1),border-color .28s,box-shadow .28s;display:flex;flex-direction:column;}
        .road-card:hover{transform:translateY(-3px);box-shadow:0 20px 46px rgba(0,0,0,.5);border-color:rgba(255,255,255,.18);}
        @media(min-width:1150px){
          .road{grid-template-columns:repeat(4,1fr);gap:16px;}
          .road::before{content:'';position:absolute;top:44px;left:3%;right:3%;height:2px;background:linear-gradient(90deg,#FF7A29,#FF9350,#E8B23D,#F0C860);opacity:.3;z-index:0;}
        }

        /* Season 5 roadmap — premium animated timeline (spec §6) */
        .s5map{position:relative;display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:36px;}
        /* connector rail (base) + drawing line that animates on reveal */
        .s5map::before{content:'';position:absolute;top:33px;left:9%;right:9%;height:3px;border-radius:3px;background:rgba(255,255,255,0.18);}
        .s5map::after{content:'';position:absolute;top:33px;left:9%;right:9%;height:3px;border-radius:3px;background:linear-gradient(90deg,#FF7A29,#E8B23D 55%,#22C55E);transform:scaleX(0);transform-origin:left;transition:transform 1.5s cubic-bezier(.22,1,.36,1) .15s;box-shadow:0 0 14px rgba(232,178,61,.4);}
        .s5map.rv-in::after{transform:scaleX(1);}
        .s5m{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;z-index:1;}
        .s5m-node{width:66px;height:66px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;z-index:2;flex-shrink:0;background:linear-gradient(165deg,#26487C,#1D3864);border:2px solid rgba(255,255,255,0.2);box-shadow:0 10px 26px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,0.18);transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s,border-color .3s;}
        .s5m:hover .s5m-node{transform:translateY(-4px) scale(1.04);}
        .s5m-node.live{border-color:var(--nc,#FF7A29);box-shadow:0 0 0 4px color-mix(in srgb,var(--nc,#FF7A29) 18%,transparent),0 12px 30px rgba(0,0,0,.45);animation:s5pulse 2.4s ease-in-out infinite;}
        @keyframes s5pulse{0%,100%{box-shadow:0 0 0 4px color-mix(in srgb,var(--nc,#FF7A29) 18%,transparent),0 12px 30px rgba(0,0,0,.45);}50%{box-shadow:0 0 0 10px color-mix(in srgb,var(--nc,#FF7A29) 0%,transparent),0 12px 30px rgba(0,0,0,.45);}}
        .s5m-live-tag{position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:#22C55E;color:#062012;font-family:var(--font-head);font-weight:900;font-size:8px;letter-spacing:.1em;padding:2px 7px;border-radius:20px;white-space:nowrap;box-shadow:0 4px 12px rgba(34,197,94,.4);}
        .s5m-txt{display:flex;flex-direction:column;gap:4px;align-items:center;}
        .s5m-mo{font-family:var(--font-head);font-weight:800;font-size:clamp(10px,1.3vw,12px);letter-spacing:.12em;color:var(--ink-3);text-transform:uppercase;}
        .s5m-lb{font-family:var(--font-head);font-weight:900;font-size:clamp(13px,1.7vw,17px);letter-spacing:.04em;color:#fff;text-transform:uppercase;line-height:1.05;}
        @media(max-width:639px){
          .s5map{grid-template-columns:1fr;gap:12px;margin-top:22px;padding-left:0;}
          /* full-width step cards instead of a left-hugging rail — fills the screen evenly */
          .s5map::before,.s5map::after{display:none;}
          .s5m{flex-direction:row;text-align:left;gap:14px;padding:13px 14px;align-items:center;
               background:linear-gradient(150deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015));
               border:1px solid rgba(255,255,255,0.14);border-left:3px solid var(--nc,#FF7A29);
               border-radius:14px;box-shadow:0 8px 22px rgba(0,0,0,.28);}
          /* short connector between cards, colored per step */
          .s5m:not(:last-child)::after{content:'';position:absolute;left:41px;bottom:-13px;width:3px;height:14px;border-radius:3px;
               background:linear-gradient(180deg,var(--nc,#FF7A29),rgba(255,255,255,0.25));z-index:0;}
          .s5m-node{width:54px;height:54px;}
          .s5m-txt{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0;align-items:flex-start;text-align:left;}
          .s5m-mo{color:var(--nc,#E8B23D);opacity:.95;}
          .s5m-lb{font-size:16px;}
          /* step counter on the right keeps the card balanced */
          .s5map{counter-reset:s5step;}
          .s5m::before{counter-increment:s5step;content:"0" counter(s5step);
               font-family:var(--font-head);font-weight:900;font-size:22px;line-height:1;
               color:rgba(255,255,255,0.14);flex:0 0 auto;order:3;}
        }

        /* Pricing journey chips */
        .jour{display:flex;align-items:stretch;gap:10px;flex-wrap:wrap;margin-bottom:28px;}
        .jour .jc{flex:1 1 180px;background:linear-gradient(165deg,#26487C 0%,#24396B 60%,#1D3864 100%);border:1px solid rgba(255,255,255,0.2);border-radius:14px;padding:16px 18px;position:relative;box-shadow:0 8px 24px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.05);transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s;}
        .jour .jc:hover{transform:translateY(-3px);box-shadow:0 16px 38px rgba(0,0,0,.42);}
        .jour .ja{align-self:center;color:rgba(232,178,61,.65);font-size:18px;flex:0 0 auto;}
        @media(max-width:639px){.jour .ja{display:none;}}

        /* Stories */
        .story-grid{display:grid;grid-template-columns:1fr;gap:16px;}
        @media(min-width:640px){.story-grid{grid-template-columns:repeat(2,1fr);}}
        @media(min-width:1000px){.story-grid{grid-template-columns:repeat(3,1fr);}}

        /* Numbers */
        .num-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
        @media(min-width:768px){.num-grid{grid-template-columns:repeat(3,1fr);}}
        .num-cell{background:linear-gradient(165deg,#26487C 0%,#24396B 60%,#1D3864 100%);border:1px solid rgba(232,178,61,.18);border-radius:16px;padding:clamp(24px,3vw,34px) clamp(18px,2.4vw,28px);text-align:center;box-shadow:0 10px 28px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.05);transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s,border-color .28s;}
        .num-cell:hover{transform:translateY(-3px);box-shadow:0 18px 42px rgba(0,0,0,.44);border-color:rgba(232,178,61,.32);}

        /* Real proof gallery */
        .proof-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
        @media(min-width:768px){.proof-grid{grid-template-columns:repeat(4,1fr);gap:12px;}}
        .proof-tile{position:relative;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.18);aspect-ratio:4/3;background:#1F3652;}
        .proof-tile.wide{grid-column:span 2;}
        .proof-tile img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease;}
        .proof-tile:hover img{transform:scale(1.05);}
        .proof-cap{position:absolute;left:10px;bottom:10px;right:10px;display:inline-flex;align-items:center;gap:6px;}
        .proof-cap span{background:rgba(17,30,57,.78);backdrop-filter:blur(6px);border:1px solid rgba(232,178,61,.3);border-radius:8px;padding:5px 10px;font-family:var(--font-head);font-size:10px;font-weight:700;color:#F0EDE8;letter-spacing:.04em;}

        /* Teams */
        .team-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
        @media(min-width:560px){.team-grid{grid-template-columns:repeat(3,1fr);}}
        @media(min-width:900px){.team-grid{grid-template-columns:repeat(5,1fr);}}
        .fr-card{position:relative;border-radius:18px;padding:22px 14px 18px;text-align:center;cursor:pointer;overflow:hidden;border:1px solid rgba(255,255,255,0.18);transition:transform .25s,box-shadow .25s,border-color .25s;}
        .fr-card:hover{transform:translateY(-5px);}

        /* Match center */
        .mc-grid{display:grid;grid-template-columns:1fr;gap:24px;}
        @media(min-width:900px){.mc-grid{grid-template-columns:1fr 1fr;}}

        /* Fees */
        .price-grid{display:grid;grid-template-columns:1fr;gap:14px;}
        @media(min-width:640px){.price-grid{grid-template-columns:1fr 1fr;}}

        /* Ambassador */
        .amb-wrap{display:grid;grid-template-columns:1fr;gap:28px;align-items:center;}
        @media(min-width:880px){.amb-wrap{grid-template-columns:1.05fr 1fr;gap:56px;}}
        .amb-proof{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:26px;}
        .amb-proof>div{display:inline-flex;align-items:center;gap:7px;background:rgba(232,178,61,.07);border:1px solid rgba(232,178,61,.25);border-radius:10px;padding:8px 13px;}
        .amb-proof .mont{font-size:11px;font-weight:700;color:#E8B23D;}

        /* Video modal */
        .vmask{position:fixed;inset:0;z-index:400;background:rgba(13,26,52,.92);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;}
        .vbox{position:relative;width:min(960px,96vw);aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.2);box-shadow:0 40px 120px rgba(0,0,0,.7);}

        /* Sticky mobile CTA */
        .stick-cta{position:fixed;left:0;right:0;bottom:0;z-index:300;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;padding-bottom:calc(10px + env(safe-area-inset-bottom));background:rgba(17,30,57,.97);backdrop-filter:blur(16px);border-top:1px solid rgba(255,122,41,.35);}
        @media(min-width:768px){.stick-cta{display:none;}}
        @media(max-width:767px){.home-root{padding-bottom:76px;}}

        /* ══ LIGHT-SURFACE SECTION ("BCPL so far" numbers) — spec §4D ══
           Warm off-white panel that resets the eye. Every child colour is
           remapped to deep-navy so nothing reads dark-on-light. */
        .sec-numbers{background:linear-gradient(180deg,#F4F1EA 0%,#EAE5DA 100%);color:#1B2E52;border-top:1px solid rgba(25,52,86,.08);border-bottom:1px solid rgba(25,52,86,.08);}
        .sec-numbers .slbl{color:#C24E12;}
        .sec-numbers .slbl::before{background:#C24E12;}
        .sec-numbers h2{color:#1B2E52 !important;}
        .sec-numbers .sec-sub{color:rgba(25,52,86,.66) !important;}
        .sec-numbers .num-cell{background:#FFFFFF;border:1px solid rgba(25,52,86,.10);box-shadow:0 10px 26px rgba(25,52,86,.10),inset 0 1px 0 rgba(255,255,255,0.88);}
        .sec-numbers .num-cell:hover{box-shadow:0 16px 36px rgba(25,52,86,.16);border-color:rgba(200,131,45,.4);}
        .sec-numbers .num-n{color:#B4791F !important;}     /* deep gold — reads on white */
        .sec-numbers .num-l{color:rgba(25,52,86,.66) !important;}

        /* ══ JOURNEY — bigger, more major (spec §16-18) ══ */
        .road-card .rc-num{font-family:var(--font-head);font-weight:900;font-size:34px;line-height:1;}
        .road-card .rc-title{font-family:var(--font-head);font-weight:900;font-size:clamp(19px,2.4vw,22px);color:#fff;margin-bottom:8px;letter-spacing:.01em;line-height:1.05;}
        .road-card .rc-date{font-family:var(--font-head);font-size:12px;font-weight:800;letter-spacing:.05em;}
        .road-card .rc-desc{font-size:14px;color:rgba(255,255,255,0.88);line-height:1.6;flex:1;}
        .road-card .rc-node{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;}

        /* ══ SEASON 5 ROADMAP on MID-TONE surface — clearly separated ══ */
        .sec-roadmap{background:linear-gradient(180deg,#305074 0%,#2D5076 100%) !important;border-top:1px solid rgba(255,255,255,0.18);border-bottom:1px solid rgba(255,255,255,0.18);}
        .sec-roadmap .slbl{color:#FFD98A;}
        .sec-roadmap .slbl::before{background:#FFD98A;}
        .sec-roadmap .rm-sub{color:rgba(255,255,255,0.88) !important;}
        /* thicker connector on mid surface */
        .sec-roadmap .s5map::before{background:rgba(255,255,255,.16);height:4px;top:32px;}
        .sec-roadmap .s5map::after{height:4px;top:32px;}
        .sec-roadmap .s5m-node{background:linear-gradient(165deg,#31527A,#2C5077);border-color:rgba(255,255,255,.22);}
        .sec-roadmap .s5m-mo{color:#FFD98A !important;font-size:clamp(11px,1.4vw,13px);}
        .sec-roadmap .s5m-lb{font-size:clamp(15px,1.9vw,19px);}
        @media(max-width:639px){
          .sec-roadmap .s5map::before{left:38px;top:20px;bottom:20px;width:4px;height:auto;}
          .sec-roadmap .s5map::after{left:38px;top:20px;bottom:20px;width:4px;height:auto;}
        }
      `}</style>

      {/* ══ SHARED HEADER ══ */}
      <SiteHeader active="Home" />

      {/* ══ 1 · CINEMATIC HERO — the dream first ══ */}
      <section style={{ position:"relative", overflow:"hidden", background:"#16223C" }}>
        <img src={BASE + "bcpl-assets/stadium-hero.jpg"} alt="" aria-hidden="true" className="hero-bg"
          onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
        <HeroVideo/>
        {/* Floodlight glows */}
        <div className="hero-flood" style={{ top:"-20%", left:"5%", width:"40%", height:"60%", background:"radial-gradient(ellipse,rgba(232,178,61,.14) 0%,transparent 65%)" }}/>
        <div className="hero-flood" style={{ top:"-25%", right:"18%", width:"45%", height:"65%", background:"radial-gradient(ellipse,rgba(255,255,255,0.18) 0%,transparent 65%)", animationDelay:"3.5s" }}/>
        {/* Readability overlays */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,rgba(16,31,57,.94) 0%,rgba(16,31,57,.72) 45%,rgba(16,31,57,.30) 100%)" }}/>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg,rgba(16,31,57,.92) 0%,transparent 32%)" }}/>
        <img src={BASE + "bcpl-assets/hero-athlete-a.webp"} alt="BCPL player in Season 5 kit" className="hero-ganguly"
          onError={e=>{(e.currentTarget as HTMLImageElement).src = BASE + "bcpl-assets/ganguly_shoot.jpg";}}/>

        <div className="W">
          <div className="hero-inner">
            {/* Full league name */}
            <div className="mont" style={{ fontWeight:800, fontSize:"clamp(11px,1.6vw,14px)", letterSpacing:".26em", color:"#E8B23D", textTransform:"uppercase", marginBottom:10, textShadow:"0 2px 16px rgba(0,0,0,.6)" }}>
              Bhartiya Corporate Premier League
            </div>

            {/* Kicker */}
            <div className="mont" style={{ fontWeight:800, fontSize:"clamp(12px,1.8vw,15px)", letterSpacing:".2em", color:"rgba(255,255,255,0.88)", textTransform:"uppercase", marginBottom:14 }}>
              {t("From Office to Stadium","ऑफिस से स्टेडियम तक")}
            </div>

            {/* Headline — the dream, not the fee */}
            <h1 className="mont" style={{ fontWeight:900, fontSize:"clamp(32px,5.8vw,68px)", lineHeight:1.04, textTransform:"uppercase", color:"#fff", letterSpacing:"-.02em", marginBottom:18, textShadow:"0 4px 30px rgba(0,0,0,.6)" }}>
              {t("Your Cricket","आपका क्रिकेट")}<br/>
              <span className="shim-gold">{t("Dream","सपना")}</span> {t("Isn't Over.","अभी ज़िंदा है।")}
            </h1>

            {/* League scale — broadcast-style stat lockup (Season 5 verified numbers).
                Range (not "max") — the ₹2L floor is the reassurance; "₹20L max"
                alone reads like you could sell for ₹5,000. */}
            <div className="hero-stats" aria-label={t("Season 5 key numbers","Season 5 के मुख्य आँकड़े")}>
              {[
                { n:SEASON.trialCities, en:"Trial Cities",         hi:"Trial शहर" },
                { n:String(SEASON.teams), en:"Teams",              hi:"टीमें" },
                { n:SEASON.prizePool,   en:"Prize Pool",           hi:"प्राइज़ पूल" },
                { n:SEASON.playerValue, en:"Player Auction Value", hi:"प्लेयर ऑक्शन वैल्यू" },
              ].map((x,i)=>(
                <div key={x.en} className="hs" style={{ animationDelay:(0.2 + i*0.12) + "s" }}>
                  <div className="hs-n">{x.n}</div>
                  <div className="hs-l">{t(x.en,x.hi)}</div>
                </div>
              ))}
            </div>

            <div className="mont" style={{ fontWeight:900, fontSize:"clamp(15px,2.4vw,19px)", marginBottom:28 }}>
              <span className="shim">#OfficeSeStadiumTak</span>
            </div>

            {/* CTAs — primary register (journey CTA when logged in) + How BCPL Works (spec #12) */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:26 }}>
              {authed ? (
                <button className="btn-cta" style={{ fontSize:15, padding:"16px 32px" }} onClick={()=>navigate("/profile")}>{t("Continue Your Journey","अपना सफर जारी रखें")} →</button>
              ) : (
                <button className="btn-cta" style={{ fontSize:15, padding:"16px 32px", animation:"pulse6 2.6s infinite" }} onClick={()=>navigate("/register")}>{t("Register for Phase 1","Phase 1 के लिए रजिस्टर करें")} →</button>
              )}
              <a className="btn-ghost" style={{ fontSize:14 }} href="#road">{t("How BCPL Works","BCPL कैसे काम करता है")}</a>
            </div>

            {/* Closing pill — live rolling mini-timer; the big scoreboard sits in the final CTA */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"rgba(255,122,41,.1)", border:"1px solid rgba(255,122,41,.3)", borderRadius:20, padding:"8px 16px", flexWrap:"wrap", maxWidth:"100%" }}>
              <span className="mont" style={{ fontSize:11, fontWeight:800, color:"#FFB347", letterSpacing:".06em", textTransform:"uppercase" }}>{t("Phase 1 closes in","Phase 1 बंद होने में")}</span>
              <FlipCountdown target={PHASE1_DEADLINE} size="sm" />
              <span className="mont" style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.88)", letterSpacing:".06em" }}>· 28 Feb 2027</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2 · LEAGUE STRIP — broadcast ticker ══ */}
      <section className="tick-wrap" aria-label={t("League highlights","League की खास बातें")}>
        <div className="tick">
          {[...TICKER, ...TICKER].map((x,i)=>(
            <span key={i} className="tick-item" aria-hidden={i>=TICKER.length}>
              {x.live && <span style={{ width:7, height:7, borderRadius:"50%", background:"#22C55E", boxShadow:"0 0 8px rgba(34,197,94,.7)", display:"inline-block", animation:"blip 2.4s ease infinite", flexShrink:0 }}/>}
              <span className="tx">{t(x.en,x.hi)}</span>
              <span className="sep" aria-hidden="true"/>
            </span>
          ))}
        </div>
      </section>

      {/* ══ 3 · THE LEAGUE IN NUMBERS ══ */}
      <section id="numbers" className="rv sec-numbers" style={{ padding:"clamp(54px,7vw,88px) 0", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 60% at 50% 0%,rgba(180,121,31,.06) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div className="W" style={{ position:"relative", zIndex:1 }}>
          <div className="slbl" style={{ justifyContent:"center" }}>{t("BCPL so far","अब तक का BCPL")}</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4vw,44px)", textTransform:"uppercase", textAlign:"center", marginBottom:8 }}>{t("The league in numbers","आँकड़ों में league")}</h2>
          <p className="sec-sub" style={{ fontSize:15, textAlign:"center", marginBottom:36 }}>{t("Four seasons of proof — not promises.","चार seasons का सबूत — सिर्फ वादे नहीं।")}</p>
          <div className="num-grid rv-stagger">
            {NUMBERS.map(n=>(
              <div key={n.en} className="num-cell">
                <div className="mont num-n" style={{ fontWeight:900, fontSize:"clamp(28px,4.2vw,44px)", lineHeight:1, whiteSpace:"nowrap" }}>
                  <CountUp end={n.end} prefix={n.prefix} suffix={n.suffix} inFmt={n.inFmt}/>
                </div>
                <div className="mont num-l" style={{ fontWeight:800, fontSize:"clamp(12px,1.5vw,13px)", letterSpacing:".08em", textTransform:"uppercase", marginTop:10 }}>{t(n.en,n.hi)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4 · ROAD TO BCPL ══ */}
      <section id="road" className="rv" style={{ padding:"clamp(54px,7vw,88px) 0", background:"var(--bg)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 100%,rgba(255,122,41,.04) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div className="W" style={{ position:"relative", zIndex:1 }}>
          <div className="slbl">{t("Your Journey","आपका सफर")}</div>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:34 }}>
            <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(26px,4.4vw,48px)", color:"#fff", textTransform:"uppercase" }}>{t("From Registration to Stadium","रजिस्ट्रेशन से स्टेडियम तक")}</h2>
            <span className="mont" style={{ fontSize:13, fontWeight:800, color:"var(--gold)", letterSpacing:".1em" }}>{t("4 STEPS · ONE DREAM","4 कदम · एक सपना")}</span>
          </div>

          <div className="road rv-stagger">
            {ROAD_STEPS.map((s,i)=>(
              <div key={i} className="road-card" style={{ borderTop:`3px solid ${s.color}`, zIndex:1 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <div className="rc-node" style={{ background:`${s.color}1A`, border:`1.5px solid ${s.color}66` }}><StepIcon kind={s.icon} color={s.color}/></div>
                  <span className="mont rc-num" style={{ color:`${s.color}38` }}>{String(i+1).padStart(2,"0")}</span>
                </div>
                <div style={{ display:"inline-block", alignSelf:"flex-start", background:`${s.color}18`, border:`1px solid ${s.color}44`, borderRadius:20, padding:"3px 12px", marginBottom:10 }}>
                  <span className="mont rc-date" style={{ color:s.color }}>{s.date}</span>
                </div>
                <div className="mont rc-title">{t(s.en,s.hi)}</div>
                <p className="rc-desc">{t(s.descEn,s.descHi)}</p>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginTop:12, minHeight:26 }}>
                  {s.fee && (
                    <span style={{ background:`${s.color}20`, border:`1px solid ${s.color}55`, borderRadius:8, padding:"4px 11px" }}>
                      <span className="mont" style={{ fontSize:13, fontWeight:800, color:s.color }}>{s.fee}</span>
                    </span>
                  )}
                  {s.live && (
                    <span style={{ background:"rgba(34,197,94,.14)", border:"1px solid rgba(34,197,94,.4)", borderRadius:8, padding:"4px 11px", display:"inline-flex", alignItems:"center", gap:6 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"blip 1s infinite" }}/>
                      <span className="mont" style={{ fontSize:13, fontWeight:800, color:"#4ADE80" }}>{t("OPEN NOW","अभी खुला")}</span>
                    </span>
                  )}
                  {i===3 && <span style={{ fontSize:13, color:"rgba(255,255,255,.72)", alignSelf:"center" }}>{t("only after Phase 1 qualification","सिर्फ Phase 1 qualify करने के बाद")}</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:26, display:"flex", justifyContent:"center", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <button className="btn-cta" style={{ fontSize:14 }} onClick={()=>navigate("/register")}>{t("Start Step 1 — Register","पहला कदम — रजिस्टर करें")} →</button>
            <button className="btn-ghost" style={{ fontSize:13 }} onClick={()=>navigate("/trust")}>{t("See the complete selection journey","पूरा selection journey देखें")}</button>
          </div>
        </div>
      </section>

      {/* ══ 4b · SEASON 5 ROADMAP — premium animated timeline (spec §6) ══ */}
      <section id="roadmap" className="sec-roadmap" aria-label={t("Season 5 roadmap","Season 5 का roadmap")} style={{ padding:"clamp(56px,7vw,92px) 0", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 60% at 50% 0%,rgba(255,217,138,.08) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div className="W rv" style={{ position:"relative", zIndex:1 }}>
          <div className="slbl" style={{ justifyContent:"center" }}>{t("Season 5 Roadmap","Season 5 का roadmap")}</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(26px,4.4vw,48px)", color:"#fff", textTransform:"uppercase", textAlign:"center", marginBottom:8 }}>{t("The year at a glance","पूरा साल एक नज़र में")}</h2>
          <p className="rm-sub" style={{ fontSize:16, textAlign:"center", marginBottom:6 }}>{t("Registration to the floodlights — five moves.","रजिस्ट्रेशन से floodlights तक — पाँच पड़ाव।")}</p>
          <div className="s5map rv-stagger">
            {S5_ROADMAP.map(m=>(
              <div key={m.en} className="s5m" style={{ ["--nc" as any]: m.color }}>
                <span className={"s5m-node" + (m.live ? " live" : "")}>
                  {m.live && <span className="s5m-live-tag">{t("LIVE","लाइव")}</span>}
                  <StepIcon kind={m.icon} color={m.color}/>
                </span>
                <span className="s5m-txt">
                  <span className="s5m-mo">{t(m.moEn,m.moHi)}</span>
                  <span className="s5m-lb">{t(m.en,m.hi)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5 · PRICING — you pay only if you progress ══ */}
      <section id="fees" className="rv" style={{ padding:"clamp(54px,7vw,88px) 0", background:"var(--bg)" }}>
        <div className="W">
          <div className="slbl">{t("Pricing","फीस")}</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4.2vw,46px)", color:"#fff", textTransform:"uppercase", lineHeight:1.1, marginBottom:6 }}>
            {t("You pay only","पैसे सिर्फ तब,")}<br/><span className="shim">{t("if you progress.","जब आप आगे बढ़ें।")}</span>
          </h2>
          <p style={{ fontSize:15, color:"var(--ink-3)", marginBottom:26, maxWidth:520 }}>{t("Here's exactly what you pay — and when. Every fee is shown with GST (" + gstPct + "%) before you pay.","यहाँ साफ लिखा है — कितना, और कब। हर fee GST (" + gstPct + "%) के साथ payment से पहले दिखाई जाती है।")}</p>

          {/* The money journey at a glance */}
          <div className="jour rv-stagger">
            <div className="jc" style={{ borderTop:"3px solid #FF7A29" }}>
              <div className="mont" style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:6 }}>{t("Step 1 · Now","कदम 1 · अभी")}</div>
              <div className="mont" style={{ fontWeight:900, fontSize:24, color:"#FF9350" }}>{inr(fees.phase1.bat)}<span style={{ fontSize:14, color:"var(--ink-2)" }}> / {inr(fees.phase1.ar)} + GST</span></div>
              <div style={{ fontSize:13, color:"var(--ink-3)", marginTop:4 }}>{t("Register + video trial","Register + video trial")}</div>
            </div>
            <div className="ja">→</div>
            <div className="jc" style={{ borderTop:"3px solid #E8B23D" }}>
              <div className="mont" style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:6 }}>{t("Step 2 · After Phase 1 qualification","कदम 2 · Phase 1 qualify करने के बाद")}</div>
              <div className="mont" style={{ fontWeight:900, fontSize:24, color:"#F0C860" }}>{inr(fees.phase2.bat)}<span style={{ fontSize:14, color:"var(--ink-2)" }}> / {inr(fees.phase2.ar)} + GST</span></div>
              <div style={{ fontSize:13, color:"var(--ink-3)", marginTop:4 }}>{t("Physical trial entry","Physical trial entry")}</div>
            </div>
            <div className="ja">→</div>
            <div className="jc" style={{ borderTop:"3px solid #22C55E" }}>
              <div className="mont" style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:6 }}>{t("Step 3 · Season 5","कदम 3 · Season 5")}</div>
              <div className="mont" style={{ fontWeight:900, fontSize:24, color:"#22C55E" }}>₹0*</div>
              <div style={{ fontSize:13, color:"var(--ink-3)", marginTop:4 }}>{t("No additional BCPL tournament participation fee*","कोई अतिरिक्त BCPL tournament participation fee नहीं*")}</div>
            </div>
          </div>

          {/* PART D footnote + PART E payment/selection disclaimer — visible, not buried */}
          <p style={{ fontSize:13, color:"var(--ink-2)", lineHeight:1.65, margin:"12px 0 26px", maxWidth:720 }}>
            {t("*Subject to the applicable BCPL Season 5 rules and any expressly disclosed exceptions. Payment of Phase 1 or Phase 2 fees does not guarantee qualification, selection, Auction Pool entry, purchase by a team, player contract, remuneration or tournament participation.",
               "*BCPL Season 5 के लागू नियमों और स्पष्ट रूप से बताए गए अपवादों के अधीन। Phase 1 या Phase 2 fee का भुगतान qualification, selection, Auction Pool में जगह, team द्वारा purchase, player contract, remuneration या tournament participation की guarantee नहीं है।")}
          </p>

          {/* Guarantees — single home for trust chips */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:26 }}>
            {[
              { icon:IcoCheck,  en:"Transparent Fee Structure",           hi:"पारदर्शी Fee Structure" },
              { icon:IcoShield, en:"Phase 2 only after Phase 1 qualification", hi:"Phase 2 सिर्फ Phase 1 qualify करने के बाद" },
              { icon:IcoClock,  en:"Result within 15 days",              hi:"15 दिनों में result" },
              { icon:IcoLock,   en:"Secure payment via Cashfree",        hi:"Cashfree से सुरक्षित payment" },
            ].map(g=>(
              <div key={g.en} style={{ display:"flex", alignItems:"center", gap:7, background:"rgba(34,197,94,.07)", border:"1px solid rgba(34,197,94,.22)", borderRadius:10, padding:"7px 13px" }}>
                <g.icon size={15} style={{ color:"#4ADE80" }} />
                <span className="mont" style={{ fontWeight:700, fontSize:11, color:"#4ADE80" }}>{t(g.en,g.hi)}</span>
              </div>
            ))}
          </div>

          <div className="price-grid">
            <div className="card" style={{ padding:24, borderTop:"3px solid #FF7A29" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,122,41,.12)", border:"1px solid rgba(255,122,41,.3)", display:"flex", alignItems:"center", justifyContent:"center" }}><IcoList size={20} style={{ color:"#FF7A29" }} /></div>
                <div>
                  <div className="mont" style={{ fontWeight:900, fontSize:16, color:"#FF7A29" }}>Phase 1</div>
                  <div style={{ fontSize:12, color:"var(--ink-3)" }}>{t("Online — pay now to register","Online — रजिस्टर के लिए अभी payment")}</div>
                </div>
                <div style={{ marginLeft:"auto", background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.3)", borderRadius:8, padding:"3px 10px" }}>
                  <span className="mont" style={{ fontSize:10, fontWeight:800, color:"#22C55E" }}>{t("OPEN","खुला")}</span>
                </div>
              </div>
              {[{icon:IcoBat,role:t("Batsman","बल्लेबाज़"),price:inr(fees.phase1.bat)},{icon:IcoBall,role:t("Bowler","गेंदबाज़"),price:inr(fees.phase1.bowl)},{icon:IcoShield,role:t("Wicket-keeper","विकेट-कीपर"),price:inr(fees.phase1.wk)},{icon:IcoStar,role:t("All-Rounder","ऑल-राउंडर"),price:inr(fees.phase1.ar)}].map(r=>(
                <div key={r.role} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.18)" }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:15, color:"var(--ink-2)" }}><r.icon size={16} style={{ color:"rgba(255,255,255,0.88)" }} />{r.role}</span>
                  <span className="mont" style={{ fontWeight:900, fontSize:18, color:"#FF7A29" }}>{r.price}</span>
                </div>
              ))}
              <p style={{ fontSize:12, color:"var(--ink-3)", marginTop:14, lineHeight:1.6 }}>{t("Includes: Phase 1 assessment · Video submission · Registration confirmation","शामिल: Phase 1 assessment · Video submission · Registration confirmation")}</p>
              <button className="btn-cta" style={{ width:"100%", justifyContent:"center", marginTop:20, fontSize:14, padding:14 }} onClick={()=>navigate("/register")}>{t("Register Now","अभी रजिस्टर करें")} →</button>
            </div>
            <div className="card" style={{ padding:24, borderTop:"3px solid #E8B23D" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"rgba(232,178,61,.12)", border:"1px solid rgba(232,178,61,.3)", display:"flex", alignItems:"center", justifyContent:"center" }}><IcoTrophy size={20} style={{ color:"#E8B23D" }} /></div>
                <div>
                  <div className="mont" style={{ fontWeight:900, fontSize:16, color:"#E8B23D" }}>Phase 2</div>
                  <div style={{ fontSize:12, color:"var(--ink-3)" }}>{t("Physical trial — after Phase 1 qualification","Physical trial — Phase 1 qualify करने के बाद")}</div>
                </div>
                <div style={{ marginLeft:"auto", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:8, padding:"3px 10px" }}>
                  <span className="mont" style={{ fontSize:10, fontWeight:800, color:"var(--ink-3)" }}>{t("IF SELECTED","SELECT होने पर")}</span>
                </div>
              </div>
              {[{icon:IcoBat,role:t("Batsman","बल्लेबाज़"),price:inr(fees.phase2.bat)},{icon:IcoBall,role:t("Bowler","गेंदबाज़"),price:inr(fees.phase2.bowl)},{icon:IcoShield,role:t("Wicket-keeper","विकेट-कीपर"),price:inr(fees.phase2.wk)},{icon:IcoStar,role:t("All-Rounder","ऑल-राउंडर"),price:inr(fees.phase2.ar)}].map(r=>(
                <div key={r.role} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.18)" }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:15, color:"var(--ink-2)" }}><r.icon size={16} style={{ color:"rgba(255,255,255,0.88)" }} />{r.role}</span>
                  <span className="mont" style={{ fontWeight:900, fontSize:18, color:"#E8B23D" }}>{r.price}</span>
                </div>
              ))}
              <p style={{ fontSize:12, color:"var(--ink-3)", marginTop:14, lineHeight:1.6 }}>{t("Includes: Physical trial entry · Franchise auction eligibility · Season 5 participation","शामिल: Physical trial entry · Auction eligibility · Season 5 participation")}</p>
              {/* §16 wording: Phase 2 fee = participation fee for qualified players only.
                  Never "selection fee", never a flat "non-refundable" (the Refund Policy
                  has express exceptions), never payment→selection. */}
              <div style={{ marginTop:20, padding:"14px 16px", background:"rgba(232,178,61,.06)", border:"1px solid rgba(232,178,61,.22)", borderRadius:12, display:"flex", gap:10, alignItems:"flex-start" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8B23D" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink:0, marginTop:2 }} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M12 11.5V16"/></svg>
                <p style={{ fontSize:13, color:"var(--ink-2)", lineHeight:1.65 }}>
                  <strong style={{ color:"#F0C860" }}>{t("The Phase 2 fee is payable only if you qualify through Phase 1 and are invited to the physical trial","Phase 2 fee सिर्फ तब देनी होती है जब आप Phase 1 से qualify करके physical trial के लिए invite होते हैं")}</strong>
                  {" — "}
                  {t("it is charged solely for participation in the Phase 2 physical trial and does not guarantee Auction Pool entry, purchase by a team, a player contract or tournament participation. Fees once paid are non-refundable except where expressly provided in the ","यह fee सिर्फ Phase 2 physical trial में participation के लिए है — यह Auction Pool में जगह, team द्वारा purchase, player contract या tournament participation की guarantee नहीं है। एक बार paid fee refundable नहीं है, सिवाय उन स्थितियों के जो ")}
                  <Link href="/refunds" style={{ color:"#E8B23D", textDecoration:"underline" }}>{t("Refund & Cancellation Policy","रिफ़ंड और कैंसिलेशन पॉलिसी")}</Link>
                  {t(".", " में साफ़ लिखी हैं।")}
                </p>
              </div>
            </div>
          </div>
          <div style={{ marginTop:20, padding:"20px 24px", background:"rgba(255,122,41,.05)", border:"1px solid rgba(255,122,41,.2)", borderRadius:16, display:"flex", flexWrap:"wrap", gap:20, alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div className="mont" style={{ fontWeight:900, fontSize:14, color:"#FF7A29" }}>{t("Maximum Total Cost (Full Journey)","अधिकतम कुल लागत (पूरा सफर)")}</div>
              <div style={{ fontSize:13, color:"var(--ink-3)", marginTop:4 }}>{t("Phase 1 + Phase 2 combined, after Phase 1 qualification","Phase 1 + Phase 2 मिलाकर, Phase 1 qualify करने के बाद")}</div>
            </div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {[{label:"Bat/Bowl/WK",total:inr(fees.phase1.bat + fees.phase2.bat) + " + GST"},{label:t("All-Rounder","ऑल-राउंडर"),total:inr(fees.phase1.ar + fees.phase2.ar) + " + GST"}].map(x=>(
                <div key={x.total} style={{ textAlign:"center" }}>
                  <div className="mont" style={{ fontWeight:900, fontSize:24, color:"#fff" }}>{x.total}</div>
                  <div style={{ fontSize:11, color:"var(--ink-3)" }}>{x.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 6 · REAL PLAYERS. REAL AUCTIONS. REAL STADIUMS. ══ */}
      <section className="rv" style={{ padding:"clamp(54px,7vw,88px) 0", background:"#1D2942", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 60% at 50% 100%,rgba(232,178,61,.04) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div className="W" style={{ position:"relative", zIndex:1 }}>
          <div className="slbl">{t("Season 4 · On the ground","Season 4 · ज़मीन पर")}</div>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:10 }}>
            <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4.2vw,46px)", color:"#fff", textTransform:"uppercase", lineHeight:1.1 }}>
              {t("Real players.","असली players।")} <span className="shim-gold">{t("Real auctions.","असली auctions।")}</span> {t("Real stadiums.","असली stadiums।")}
            </h2>
          </div>
          <p style={{ fontSize:15, color:"var(--ink-3)", marginBottom:30, maxWidth:560 }}>
            {t("Not mockups — photographs from BCPL's own launches, auctions and match days.",
               "Mockup नहीं — BCPL के अपने launch events, auction और match days की असली तस्वीरें।")}
          </p>
          <div className="proof-grid">
            {PROOF.map(p=>(
              <div key={p.img} className={"proof-tile" + (p.wide ? " wide" : "")}>
                <img src={BASE + "bcpl-assets/" + p.img} alt={t(p.en,p.hi)} loading="lazy"
                  onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
                <div className="proof-cap"><span>{t(p.en,p.hi)}</span></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:22, display:"flex", justifyContent:"center" }}>
            <Link href="/photos" className="btn-ghost" style={{ fontSize:13 }}>{t("See the full gallery","पूरी gallery देखें")} →</Link>
          </div>
        </div>
      </section>

      {/* ══ 7 · REAL PLAYER STORIES — renders only with verified players ══ */}
      {STORIES.length > 0 && (
        <section className="rv" style={{ padding:"clamp(54px,7vw,88px) 0", background:"var(--bg)" }}>
          <div className="W">
            <div className="slbl">{t("Real Stories","असली कहानियाँ")}</div>
            <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4.2vw,46px)", color:"#fff", textTransform:"uppercase", lineHeight:1.1, marginBottom:8 }}>
              {t("They were working professionals.","वे working professionals थे।")}<br/>
              <span className="shim-gold">{t("Then BCPL called.","फिर BCPL की call आई।")}</span>
            </h2>
            <p style={{ fontSize:15, color:"var(--ink-3)", marginBottom:34, maxWidth:560 }}>
              {t("Real players from past seasons — proof that the fair-chance promise is real.","पिछले seasons के असली players — इस बात का सबूत कि fair chance का वादा सच है।")}
            </p>
            <div className="story-grid">
              {STORIES.map(s=>(
                <div key={s.name} className="card" style={{ overflow:"hidden" }}>
                  <div style={{ position:"relative", aspectRatio:"4/3", background:"#213B5C" }}>
                    <img src={s.photo} alt={s.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
                      onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg,rgba(16,31,57,.75) 0%,transparent 50%)" }}/>
                    <div style={{ position:"absolute", left:14, bottom:12 }}>
                      <div className="mont" style={{ fontWeight:900, fontSize:17, color:"#fff" }}>{s.name}</div>
                      <div className="mont" style={{ fontSize:11, fontWeight:700, color:"#E8B23D" }}>{s.profession} → {s.season} Player</div>
                    </div>
                  </div>
                  <div style={{ padding:"14px 16px 16px" }}>
                    <div className="mont" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:11, fontWeight:800, letterSpacing:".08em", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:8 }}><IcoPin size={14} style={{ color:"var(--ink-3)" }} />{s.city} → {s.team}</div>
                    <p style={{ fontSize:13, color:"rgba(255,255,255,0.88)", lineHeight:1.65, fontStyle:"italic" }}>"{t(s.quoteEn, s.quoteHi)}"</p>
                    {s.videoUrl && (
                      <button className="btn-ghost" style={{ fontSize:11, padding:"9px 16px", marginTop:12 }} onClick={()=>showVideo(s.videoUrl!)}>▶ {t("Watch the story","कहानी देखें")}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ 8 · SOURAV GANGULY × BCPL — full-width cinematic ══ */}
      <section className="rv" style={{ padding:"clamp(54px,7vw,96px) 0", background:"linear-gradient(180deg,#1D304D,var(--bg))", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-30%", right:"-15%", width:"55%", height:"160%", background:"radial-gradient(ellipse,rgba(232,178,61,.09) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"-40%", left:"-10%", width:"45%", height:"120%", background:"radial-gradient(ellipse,rgba(255,122,41,.05) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div className="W" style={{ position:"relative", zIndex:1 }}>
          <div className="amb-wrap">
            {/* Photo */}
            <div style={{ position:"relative", borderRadius:24, overflow:"hidden", border:"1px solid rgba(232,178,61,.35)", boxShadow:"0 30px 80px rgba(0,0,0,.55)", background:"linear-gradient(180deg,#1D3252,#1F3652)" }}>
              <img src={BASE + "bcpl-assets/ambassador-b.webp"} alt="Sourav Ganguly — BCPL Brand Ambassador"
                style={{ width:"100%", height:"auto", display:"block", filter:"contrast(1.05)" }}
                onError={e=>{(e.currentTarget as HTMLImageElement).src = BASE + "bcpl-assets/ganguly_2.jpg";}}/>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg,rgba(16,31,57,.55) 0%,transparent 40%)" }}/>
              <div style={{ position:"absolute", left:16, bottom:14, display:"inline-flex", alignItems:"center", gap:8, background:"rgba(17,30,57,.75)", backdropFilter:"blur(8px)", border:"1px solid rgba(232,178,61,.4)", borderRadius:10, padding:"7px 14px" }}>
                <IcoBat size={13} style={{ color:"#E8B23D" }} />
                <span className="mont" style={{ fontSize:10, fontWeight:900, color:"#E8B23D", letterSpacing:".14em", textTransform:"uppercase" }}>{t("Official Brand Ambassador","आधिकारिक ब्रांड एंबेसडर")}</span>
              </div>
            </div>

            {/* Copy */}
            <div>
              <div className="slbl">{t("Brand Ambassador","ब्रांड एंबेसडर")}</div>
              <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(28px,4.6vw,52px)", color:"#fff", textTransform:"uppercase", lineHeight:1.04, marginBottom:20 }}>
                Sourav<br/><span className="shim-gold">Ganguly</span> <span style={{ color:"rgba(255,255,255,.28)", fontWeight:800 }}>×</span> BCPL
              </h2>
              <div style={{ position:"relative", maxWidth:500, marginBottom:20 }}>
                <span aria-hidden="true" className="mont" style={{ position:"absolute", top:-26, left:-8, fontSize:72, fontWeight:900, color:"rgba(232,178,61,.18)", lineHeight:1, userSelect:"none" }}>“</span>
                <p style={{ position:"relative", fontSize:"clamp(17px,2.4vw,24px)", color:"rgba(255,255,255,0.88)", lineHeight:1.55, fontStyle:"italic", borderLeft:"3px solid #E8B23D", paddingLeft:18 }}>
                  {t("A platform built to discover India's hidden cricketing talent.","भारत की छिपी हुई क्रिकेट प्रतिभा को खोजने के लिए बना platform।")}
                </p>
              </div>
              <div className="mont" style={{ fontWeight:800, fontSize:14, color:"#E8B23D", marginBottom:16 }}>— Sourav Ganguly</div>

              {/* Proof points */}
              <div className="amb-proof">
                <div><IcoFlag size={14} style={{ color:"#E8B23D" }} /><span className="mont">{t("Former Captain, Indian Cricket Team","भारतीय टीम के पूर्व कप्तान")}</span></div>
                <div><IcoShield size={14} style={{ color:"#E8B23D" }} /><span className="mont">{t("Former President, BCCI","BCCI के पूर्व अध्यक्ष")}</span></div>
                <div><IcoStar size={14} style={{ color:"#E8B23D" }} /><span className="mont">{t("Face of BCPL Season 5","BCPL Season 5 का चेहरा")}</span></div>
              </div>

              <button className="btn-ghost" style={{ fontSize:13, borderColor:"rgba(232,178,61,.5)", color:"#E8B23D" }} onClick={()=>openVideo("ganguly")}>
                ▶ {t("Watch Sourav Ganguly's message","सौरव गांगुली का message देखें")} →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 9 · SEASON 5 FRANCHISES ══ */}
      <section className="rv" style={{ padding:"clamp(54px,7vw,88px) 0", background:"#1D2942" }}>
        <div className="W">
          <div className="slbl">{t("Franchises","फ्रैंचाइज़ी")}</div>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:34 }}>
            <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4vw,44px)", color:"#fff", textTransform:"uppercase" }}>{t("Season 5 Teams","सीज़न 5 की टीमें")}</h2>
            <Link href="/teams" style={{ fontSize:13, color:"#FF7A29", textDecoration:"none", fontWeight:700 }}>{t("Meet the teams","सभी टीमें देखें")} →</Link>
          </div>
          <div className="team-grid">
            {TEAMS.map(tm=>(
              <div key={tm.name} className="fr-card" role="link" tabIndex={0} aria-label={"View "+tm.name+" squad"}
                onClick={()=>navigate("/teams")} onKeyDown={e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); navigate("/teams"); } }}
                style={{ background:`linear-gradient(170deg,${tm.color}26 0%,#1F3652 55%)`, borderColor:`${tm.color}30` }}
                onMouseEnter={e=>{ e.currentTarget.style.boxShadow=`0 16px 40px ${tm.color}30`; e.currentTarget.style.borderColor=`${tm.color}70`; }}
                onMouseLeave={e=>{ e.currentTarget.style.boxShadow=""; e.currentTarget.style.borderColor=`${tm.color}30`; }}>
                <div style={{ position:"absolute", top:-24, right:-24, width:90, height:90, borderRadius:"50%", background:`${tm.color}12`, pointerEvents:"none" }}/>
                <TeamLogo slug={tm.slug} name={tm.name} color={tm.color}/>
                <div className="mont" style={{ fontWeight:800, fontSize:"clamp(12px,1.5vw,14px)", color:"#F1F5F9", lineHeight:1.25, marginTop:12 }}>{tm.name}</div>
                <div className="mont" style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", color:`${tm.color}CC`, textTransform:"uppercase", marginTop:4 }}>{tm.city}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsors show ONLY in the footer strip (owner call, Jul 2026) — full wall lives at /sponsors. */}

      {/* ══ 10 · THIS IS BCPL — the film ══ */}
      <section className="rv" style={{ position:"relative", overflow:"hidden", background:"#16223C" }}>
        <img src={BASE + "bcpl-assets/event-stage-trophy.webp"} alt="" aria-hidden="true"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 40%", opacity:.25 }}
          onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 75% 90% at 50% 50%,rgba(16,31,57,.55) 0%,rgba(16,31,57,.96) 100%)" }}/>
        <div className="W" style={{ position:"relative", zIndex:1, textAlign:"center", padding:"clamp(64px,9vw,110px) 20px" }}>
          <div className="slbl" style={{ justifyContent:"center" }}>{t("This is BCPL","यही है BCPL")}</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(26px,4.8vw,54px)", color:"#fff", textTransform:"uppercase", lineHeight:1.08, marginBottom:16, textShadow:"0 4px 30px rgba(0,0,0,.6)" }}>
            {t("This is not just cricket.","यह सिर्फ क्रिकेट नहीं है।")}<br/>
            <span className="shim-gold">{t("This is your second chance.","यह आपका दूसरा मौका है।")}</span>
          </h2>
          <p style={{ fontSize:"clamp(15px,1.9vw,16px)", color:"rgba(255,255,255,0.88)", lineHeight:1.75, maxWidth:620, margin:"0 auto 34px" }}>
            {t("Office → kit bag → trial → selection → auction hammer → jersey → stadium. A real pathway from working professional to professional-style cricket.",
               "ऑफिस → किट बैग → ट्रायल → सिलेक्शन → ऑक्शन का हथौड़ा → जर्सी → स्टेडियम। Working professional से professional-style cricket तक का असली रास्ता।")}
          </p>
          <button type="button" className="play-btn" aria-label={t("Play the BCPL story video","BCPL की कहानी का video चलाएँ")} onClick={()=>openVideo("story")}>▶</button>
          <div className="mont" style={{ marginTop:18, fontSize:11, fontWeight:800, letterSpacing:".16em", color:"rgba(255,255,255,0.72)", textTransform:"uppercase" }}>
            {t("Watch the BCPL story · 30 sec","BCPL की कहानी देखें · 30 sec")}
          </div>
        </div>
      </section>

      {/* ══ 11 · MATCH CENTER & LEADERBOARD — always on ══ */}
      <section className="rv" style={{ padding:"clamp(54px,7vw,88px) 0", background:"#1D2942", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize:"48px 48px", pointerEvents:"none" }}/>
        <div className="W" style={{ position:"relative", zIndex:1 }}>
          <div className="slbl">{t("Live Season","लाइव सीज़न")}</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(24px,4vw,44px)", color:"#fff", textTransform:"uppercase", marginBottom:34 }}>{t("Match Center & Leaderboard","मैच सेंटर और लीडरबोर्ड")}</h2>

          <div className="mc-grid">
            {/* ── Matches column ── */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div className="mont" style={{ fontSize:11, fontWeight:800, letterSpacing:".12em", color:"var(--ink-3)", textTransform:"uppercase" }}>{t("Recent & Upcoming","हाल के और आगामी मैच")}</div>
                <Link href="/match-center" style={{ fontSize:12, color:"#FF7A29", textDecoration:"none", fontWeight:700 }}>{t("View all","सभी देखें")} →</Link>
              </div>
              {liveMatches.length === 0 ? (
                <div className="card" style={{ padding:"34px 24px", textAlign:"center", borderStyle:"dashed", borderColor:"rgba(255,255,255,0.2)" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><IcoStadium size={34} style={{ color:"var(--ink-3)" }} /></div>
                  <div className="mont" style={{ fontWeight:800, fontSize:15, color:"#fff", marginBottom:6 }}>{t("Fixtures drop before the season opener","Season से पहले fixtures आएँगे")}</div>
                  <p style={{ fontSize:13, color:"var(--ink-3)", lineHeight:1.6, marginBottom:16 }}>{t("Season 4 matches: Sep – Oct 2027. Register now — you might be playing in one.","Season 4 के मैच: Sep – Oct 2027 । अभी register करें — हो सकता है इनमें आप खेलें।")}</p>
                  <Link href="/schedule" style={{ fontSize:12, color:"#FF7A29", textDecoration:"none", fontWeight:700 }}>{t("See full schedule","पूरा schedule देखें")} →</Link>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {liveMatches.slice(0,5).map((m:any, i:number) => (
                    <MatchCard key={m.id||m.matchNo} match={m} compact delayIndex={i} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Leaderboard column ── */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div className="mont" style={{ fontSize:11, fontWeight:800, letterSpacing:".12em", color:"var(--ink-3)", textTransform:"uppercase" }}>{t("Points Table — Season 4","पॉइंट्स टेबल — सीज़न 4")}</div>
                <Link href="/points-table" style={{ fontSize:12, color:"#FF7A29", textDecoration:"none", fontWeight:700 }}>{t("Full table","पूरी टेबल")} →</Link>
              </div>
              {liveTable.length === 0 ? (
                <div className="card" style={{ padding:"34px 24px", textAlign:"center", borderStyle:"dashed", borderColor:"rgba(255,255,255,0.2)" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><IcoList size={34} style={{ color:"var(--ink-3)" }} /></div>
                  <div className="mont" style={{ fontWeight:800, fontSize:15, color:"#fff", marginBottom:6 }}>{t("The leaderboard goes live with the first ball","पहली गेंद के साथ leaderboard live होगा")}</div>
                  <p style={{ fontSize:13, color:"var(--ink-3)", lineHeight:1.6, marginBottom:18 }}>{t("10 franchises. One trophy. Standings update ball-by-ball during Season 4.","10 franchises । एक trophy । Season 4 में हर गेंद पर standings update होंगी।")}</p>
                  <div style={{ display:"flex", justifyContent:"center", flexWrap:"wrap", gap:8 }}>
                    {TEAMS.map(tm=>(
                      <img key={tm.slug} src={`${L}${tm.slug}.png`} alt={tm.name} title={tm.name} style={{ width:30, height:30, objectFit:"contain", opacity:.75 }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background:"linear-gradient(135deg,#1F3652,#1D2942)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:14, overflow:"hidden" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"28px 1fr 30px 30px 30px 44px 50px", padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.18)" }}>
                    {["#","Team","P","W","L","Pts","NRR"].map(h=>(
                      <div key={h} className="mont" style={{ fontSize:9, fontWeight:800, color:"var(--ink-3)", letterSpacing:".1em", textAlign: h==="Team"?"left":"center" }}>{h}</div>
                    ))}
                  </div>
                  {liveTable.map((r:any, i:number, arr:any[])=>{
                    const tm = TEAMS.find(x=>x.name===r.team);
                    const nrr = (r.nrr>=0?"+":"")+Number(r.nrr).toFixed(3);
                    return (
                      <div key={r.team} style={{ display:"grid", gridTemplateColumns:"28px 1fr 30px 30px 30px 44px 50px", padding:"9px 14px", borderBottom: i<arr.length-1?"1px solid rgba(255,255,255,.04)":"none", background: i<4?"rgba(255,122,41,.025)":"transparent", position:"relative" }}>
                        {i<4 && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background:`${tm?.color||"#64748B"}60` }}/>}
                        <div className="mont" style={{ fontSize:11, fontWeight:900, color: i<3?"#E8B23D":"rgba(255,255,255,.4)", textAlign:"center" }}>{i+1}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, minWidth:0 }}>
                          <img src={`${L}${tm?.slug||""}.png`} alt={r.team} style={{ width:18, height:18, objectFit:"contain", flexShrink:0 }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
                          <span className="mont" style={{ fontSize:11, fontWeight:700, color: i<4?"#E2E8F0":"#94A3B8", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.team}</span>
                        </div>
                        {[r.played, r.won, r.lost].map((v:any,j:number)=>(
                          <div key={j} style={{ fontSize:11, color:"#64748B", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>{v}</div>
                        ))}
                        <div className="mont" style={{ fontSize:13, fontWeight:900, color: i<4?"#FF7A29":"#94A3B8", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>{r.points}</div>
                        <div className="mont" style={{ fontSize:10, fontWeight:700, color: nrr.startsWith("+")?"#22C55E":"#EF4444", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center" }}>{nrr}</div>
                      </div>
                    );
                  })}
                  <div style={{ padding:"9px 14px", background:"rgba(255,122,41,.04)", borderTop:"1px solid rgba(255,122,41,.1)", display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:10, height:10, background:"rgba(255,122,41,.4)", borderRadius:2, flexShrink:0 }}/>
                    <span style={{ fontSize:10, color:"var(--ink-3)" }}>{t("Top 4 qualify for playoffs","Top 4 playoffs में जाएँगी")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 12 · FAQ ══ */}
      <section className="rv" style={{ padding:"clamp(54px,7vw,88px) 0", background:"var(--bg)" }}>
        <div className="W">
          <div className="slbl">FAQ</div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(22px,4vw,40px)", color:"#fff", textTransform:"uppercase", marginBottom:8 }}>{t("Frequently Asked Questions","अक्सर पूछे जाने वाले सवाल")}</h2>
          <p style={{ fontSize:15, color:"var(--ink-3)", marginBottom:36 }}>{t("Everything you need to know before registering.","रजिस्टर करने से पहले जो भी जानना ज़रूरी है।")}</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10, maxWidth:760 }}>
            {FAQ_ITEMS.map((f,i)=>(
              <div key={i} className="card" style={{ overflow:"hidden", transition:"border-color .2s", borderColor:faqOpen===i?"rgba(255,122,41,.4)":"rgba(255,255,255,0.18)" }}>
                <button type="button" onClick={()=>setFaqOpen(faqOpen===i?null:i)}
                  aria-expanded={faqOpen===i} aria-controls={"faq-a-"+i}
                  style={{ width:"100%", background:"none", border:"none", cursor:"pointer", font:"inherit", color:"inherit", textAlign:"left", padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
                  <span style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ width:24, height:24, borderRadius:"50%", background:"rgba(255,122,41,.1)", border:"1px solid rgba(255,122,41,.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span className="mont" style={{ fontSize:10, fontWeight:800, color:"#FF7A29" }}>{i+1}</span>
                    </span>
                    <span className="mont" style={{ fontWeight:700, fontSize:"clamp(15px,2vw,16px)", color:faqOpen===i?"#FF9350":"#F1F5F9" }}>{t(f.qEn,f.qHi)}</span>
                  </span>
                  <span aria-hidden="true" style={{ fontSize:18, color:faqOpen===i?"#FF7A29":"rgba(255,255,255,.3)", flexShrink:0, display:"inline-block", transform:faqOpen===i?"rotate(45deg)":"rotate(0)", transition:"transform .25s" }}>+</span>
                </button>
                {faqOpen===i&&(
                  <div id={"faq-a-"+i} style={{ padding:"0 20px 18px 56px" }}>
                    <p style={{ fontSize:"clamp(14px,1.9vw,15px)", color:"var(--ink-2)", lineHeight:1.75 }}>{t(f.aEn,f.aHi)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 13 · FINAL CTA ══ */}
      <section style={{ position:"relative", overflow:"hidden", background:"#16223C" }}>
        <img src={BASE + "bcpl-assets/stadium-hero.jpg"} alt="" aria-hidden="true"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 60%", opacity:.3 }}
          onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 80% at 50% 50%,rgba(16,31,57,.55) 0%,rgba(16,31,57,.92) 100%)" }}/>
        <div className="W" style={{ textAlign:"center", position:"relative", zIndex:1, padding:"clamp(64px,9vw,110px) 20px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,122,41,.12)", border:"1px solid rgba(255,122,41,.35)", borderRadius:20, padding:"6px 16px", marginBottom:24, backdropFilter:"blur(6px)" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"blip 1.2s infinite" }}/>
            <span className="mont" style={{ fontSize:11, fontWeight:800, color:"#FFB347", letterSpacing:".12em", textTransform:"uppercase" }}>{t("Phase 1 closes 28 Feb 2027","Phase 1 — 28 Feb 2027 तक")}</span>
          </div>
          <h2 className="mont" style={{ fontWeight:900, fontSize:"clamp(30px,5.4vw,64px)", color:"#fff", textTransform:"uppercase", lineHeight:1.04, marginBottom:14, textShadow:"0 4px 30px rgba(0,0,0,.6)" }}>
            {t("The floodlights","फ्लडलाइट्स आपका")}<br/>{t("are waiting.","इंतज़ार कर रही हैं।")}
          </h2>
          <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"rgba(255,255,255,0.88)", lineHeight:1.7, maxWidth:520, margin:"0 auto 30px" }}>
            {t("Join 2.5 lakh+ working professionals already on the road to BCPL Season 5.","2.5 लाख+ working professionals BCPL Season 5 के रास्ते पर निकल चुके हैं — अब आपकी बारी।")}
          </p>

          {/* The big odometer scoreboard — its single home on the page */}
          <div style={{ marginBottom:32 }}>
            <FlipCountdown target={PHASE1_DEADLINE} size="lg" />
          </div>

          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            {authed ? (
              <button className="btn-cta" style={{ fontSize:16, padding:"17px 38px" }} onClick={()=>navigate("/profile")}>{t("Continue Your Journey","अपना सफर जारी रखें")} →</button>
            ) : (
              <button className="btn-cta" style={{ fontSize:16, padding:"17px 38px" }} onClick={()=>navigate("/register")}>{t("Register for Phase 1","Phase 1 के लिए रजिस्टर करें")} →</button>
            )}
            <a className="btn-ghost" href="#road" style={{ fontSize:14 }}>{t("How BCPL works","BCPL कैसे काम करता है")}</a>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <BCPLFooter />

      {/* ══ STICKY MOBILE CTA ══ */}
      {!authed && (
        <div className="stick-cta">
          <div style={{ minWidth:0, flex:"1 1 auto", overflow:"hidden" }}>
            <div className="mont" style={{ fontWeight:900, fontSize:13.5, color:"#fff", lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t("Phase 1 Registration","Phase 1 रजिस्ट्रेशन")}</div>
            <div style={{ fontSize:11.5, color:"rgba(255,255,255,.72)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t("Closes 28 Feb 2027","28 Feb 2027 तक")}</div>
          </div>
          <button className="btn-cta" style={{ fontSize:15, padding:"14px 22px", flex:"0 0 auto", maxWidth:"58%" }} onClick={()=>navigate("/register")}>{t("Register Now","रजिस्टर करें")} →</button>
        </div>
      )}

      {/* ══ VIDEO MODAL — YouTube embed ya local film ══ */}
      {video && (
        <div ref={vMaskRef} className="vmask" role="dialog" aria-modal="true" aria-label="BCPL video" onClick={()=>setVideo(null)}>
          <div className="vbox" onClick={e=>e.stopPropagation()}>
            {video === STORY_FILM ? (
              <video src={video} controls autoPlay playsInline
                style={{ position:"absolute", inset:0, width:"100%", height:"100%", background:"#000" }}/>
            ) : (
              <iframe src={toEmbed(video) ?? undefined} title="BCPL video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
                style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none" }}/>
            )}
          </div>
          <button type="button" aria-label={t("Close video","Video बंद करें")} onClick={()=>setVideo(null)}
            style={{ position:"fixed", top:18, right:18, width:42, height:42, borderRadius:"50%", background:"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,.25)", color:"#fff", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)" }}>✕</button>
        </div>
      )}
    </div>
  );
}

/* ── Cinematic hero background video — desktop 16:9 / mobile 9:16.
     Respects prefers-reduced-motion and data-saver; falls back to the still image. ── */
function HeroVideo() {
  const [src, setSrc] = useState<string|null>(null);
  useEffect(()=>{
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c:any = (navigator as any).connection;
    if (c && (c.saveData || /2g/.test(c.effectiveType || ""))) return;
    setSrc(BASE + (window.matchMedia("(max-width: 767px)").matches ? "bcpl-assets/hero-bg-mobile.mp4" : "bcpl-assets/hero-bg.mp4"));
  },[]);
  if (!src) return null;
  return (
    <video className="hero-vid" src={src} poster={BASE + "bcpl-assets/hero-poster.jpg"}
      autoPlay muted loop playsInline aria-hidden="true"
      onError={e=>{(e.currentTarget as HTMLVideoElement).style.display="none";}}/>
  );
}

/* ── Animated count-up number (runs once, when scrolled into view) ── */
function CountUp({ end, prefix="", suffix="", inFmt=false, dur=1600 }:{ end:number; prefix?:string; suffix?:string; inFmt?:boolean; dur?:number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement|null>(null);
  const started = useRef(false);
  useEffect(()=>{
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVal(end); return; }
    let raf = 0;
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const step = (now:number)=>{
            const p = Math.min((now - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(end * eased));
            if (p < 1) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
          obs.disconnect();
        }
      });
    },{ threshold:.4 });
    obs.observe(el);
    return ()=>{ obs.disconnect(); cancelAnimationFrame(raf); };
  },[end, dur]);
  const txt = inFmt ? val.toLocaleString("en-IN") : String(val);
  return <span ref={ref}>{prefix}{txt}{suffix}</span>;
}

/* ── Team Logo with image fallback ── */
/* Consistent-stroke inline icons for the journey steps (spec: one icon style, no emoji) */
function StepIcon({ kind, color }: { kind: string; color: string }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "reg")     return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7.5h8M8 11.5h8M8 15.5h5"/></svg>;
  if (kind === "video")   return <svg {...p}><rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10.5 22 7v10l-7-3.5"/></svg>;
  if (kind === "result")  return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/><path d="m8.2 11.2 2 2 3.6-3.9"/></svg>;
  if (kind === "trial")   return <svg {...p}><path d="M4 20v-2a4 4 0 0 1 4-4h3"/><circle cx="9" cy="7" r="3"/><path d="M15 16.5 17 18l3.5-4"/></svg>;
  if (kind === "auction") return <svg {...p}><path d="m14 3 5 5-3 3-5-5 3-3Z"/><path d="m11.5 5.5-7 7 3 3 7-7"/><path d="M4 21h9"/></svg>;
  return <svg {...p}><path d="M7 3h10v5a5 5 0 0 1-10 0V3Z"/><path d="M7 5H4.5a2.5 2.5 0 0 0 2.6 3.4M17 5h2.5a2.5 2.5 0 0 1-2.6 3.4"/><path d="M12 13v3.2M8.5 20h7M12 16.2c-1.6 0-2.6 1.2-2.8 3.8h5.6c-.2-2.6-1.2-3.8-2.8-3.8Z"/></svg>;
}

function TeamLogo({ slug, name, color }: { slug:string; name:string; color:string }) {
  const [err, setErr] = useState(false);
  if (!err) {
    return (
      <img src={`${L}${slug}.png`} alt={name} onError={()=>setErr(true)}
        style={{ width:60, height:60, borderRadius:14, objectFit:"contain", background:"rgba(255,255,255,.04)", margin:"0 auto", display:"block", filter:"drop-shadow(0 6px 14px rgba(0,0,0,.4))" }}/>
    );
  }
  return (
    <div style={{ width:60, height:60, borderRadius:14, background:color+"22", border:`1px solid ${color}44`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}>
      <IcoBat size={24} style={{ color }} />
    </div>
  );
}
