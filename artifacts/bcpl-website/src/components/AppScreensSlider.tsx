import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "../lib/i18n";
import { SEASON } from "../lib/season";

const BASE = import.meta.env.BASE_URL;

/* ------------------------------------------------------------------ *
 * App-screen mockup slider for the /download hero.
 * 10 pure-HTML/CSS "app screens" inside a phone frame.
 * - Design language = the APP (violet/magenta/cyan/lime on dark stadium),
 *   deliberately NOT the website navy.
 * - Desktop: arrows + dots + auto-advance (~4s, pause on hover).
 * - Mobile: horizontal scroll-snap swipe with a peek of the next slide.
 * - Fully keyboard accessible; NO scroll-reveal/fade-in animations.
 * ------------------------------------------------------------------ */

const CSS = `
:root{}
.aps { --v:#7C5CFF; --m:#FF3DA6; --c:#00DCF5; --lime:#B6FF3C; --stad:#101433; --grad:linear-gradient(135deg,#5B2BF0,#9B2FF0 55%,#FF3DA6); }
.aps { position:relative; width:min(400px,100%); }
@media (max-width:899px){ .aps{ width:100%; } }

/* ---- viewport / track ---- */
.aps-vp { position:relative; }
.aps-track { display:flex; gap:0; overflow-x:auto; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; scrollbar-width:none; padding:6px 0 12px; }
.aps-track::-webkit-scrollbar{ display:none; }
.aps-slide { flex:0 0 100%; scroll-snap-align:center; display:flex; justify-content:center; }
/* mobile: peek next slide */
@media (max-width:899px){ .aps-slide{ flex:0 0 82%; } }

/* ---- phone frame ---- */
.aps-phone { position:relative; width:min(288px,72vw); aspect-ratio:9/19.2; border-radius:42px; padding:11px; background:linear-gradient(160deg,#05070f,#191d3a); border:2px solid rgba(255,255,255,.14); box-shadow:0 34px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.14); }
.aps-phone::before{ content:''; position:absolute; top:12px; left:50%; transform:translateX(-50%); width:112px; height:22px; border-radius:0 0 16px 16px; background:#04060d; z-index:6; }
.aps-scr { position:relative; width:100%; height:100%; border-radius:32px; overflow:hidden; background:radial-gradient(120% 70% at 50% -8%,rgba(124,92,255,.34),transparent 62%),linear-gradient(180deg,#161a3d,#101433 60%,#0b0e26); color:#fff; font-family:Inter,system-ui,sans-serif; display:flex; flex-direction:column; }
.aps-scr *{ pointer-events:none; }

/* ---- generic in-screen atoms ---- */
.s-status{ display:flex; align-items:center; justify-content:space-between; padding:16px 16px 6px; font-size:9px; font-weight:700; letter-spacing:.02em; color:rgba(255,255,255,.72); }
.s-status .dots{ display:flex; gap:3px; align-items:center; }
.s-status .dots i{ width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.6);font-style:normal;display:block; }
.s-status .batt{ width:16px;height:8px;border:1px solid rgba(255,255,255,.55);border-radius:2px;position:relative; }
.s-status .batt::after{ content:'';position:absolute;left:1px;top:1px;bottom:1px;right:5px;background:var(--lime);border-radius:1px; }
.s-body{ flex:1; overflow:hidden; padding:2px 14px 0; display:flex; flex-direction:column; gap:9px; }
.s-tabbar{ display:flex; justify-content:space-around; align-items:center; padding:9px 8px 12px; border-top:1px solid rgba(255,255,255,.08); background:rgba(6,8,20,.5); }
.s-tabbar span{ width:22px;height:22px;border-radius:7px;background:rgba(255,255,255,.10); }
.s-tabbar span.on{ background:var(--grad); box-shadow:0 4px 12px rgba(155,47,240,.5); }
.s-h{ display:flex; align-items:center; justify-content:space-between; padding:4px 0 2px; }
.s-h .ttl{ font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; letter-spacing:.03em; font-size:18px; }
.s-badge{ font-size:8.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#0b0e26; background:var(--lime); border-radius:100px; padding:3px 8px; }
.s-badge.v{ background:var(--grad); color:#fff; }
.s-badge.c{ background:var(--c); color:#04121a; }
.s-live{ display:inline-flex; align-items:center; gap:5px; font-size:8.5px; font-weight:800; letter-spacing:.1em; color:#fff; background:rgba(255,61,166,.18); border:1px solid rgba(255,61,166,.5); border-radius:100px; padding:3px 8px; }
.s-live b{ width:6px;height:6px;border-radius:50%;background:var(--m);box-shadow:0 0 0 0 rgba(255,61,166,.7); animation:aps-pulse 1.4s infinite; }
@keyframes aps-pulse{ 0%{box-shadow:0 0 0 0 rgba(255,61,166,.6)} 70%{box-shadow:0 0 0 7px rgba(255,61,166,0)} 100%{box-shadow:0 0 0 0 rgba(255,61,166,0)} }
.s-card{ background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.10); border-radius:14px; padding:11px 12px; }
.s-card.g{ background:linear-gradient(135deg,rgba(124,92,255,.22),rgba(255,61,166,.16)); border-color:rgba(255,255,255,.16); }
.s-lbl{ font-size:8.5px; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.6); font-weight:700; }
.s-chip{ font-size:9px; font-weight:700; color:#fff; background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.16); border-radius:100px; padding:4px 9px; }
.s-fab{ position:absolute; right:14px; bottom:60px; background:var(--grad); color:#fff; font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; letter-spacing:.04em; font-size:12px; padding:10px 16px; border-radius:100px; box-shadow:0 10px 26px rgba(155,47,240,.55); }
.s-grow{ flex:1 1 auto; min-height:0; }
.s-sec{ display:flex; align-items:center; justify-content:space-between; margin-top:1px; }
.s-sec .more{ font-size:8px; font-weight:700; letter-spacing:.06em; color:var(--c); }
.s-mrow{ display:flex; align-items:center; justify-content:space-between; font-size:9.5px; padding:4px 0; border-top:1px solid rgba(255,255,255,.07); }
.s-mrow:first-child{ border-top:none; }
.s-mrow .lead{ display:flex; align-items:center; gap:6px; }
.s-mrow .lead .cr{ width:15px;height:15px;border-radius:5px; flex:0 0 auto; }
.s-mrow b{ font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:11px; }
.s-mrow .up{ color:var(--lime); } .s-mrow .dn{ color:var(--m); }
.s-tile{ display:flex; align-items:center; gap:9px; }
.s-tile .th{ width:40px;height:40px;border-radius:9px; flex:0 0 auto; background:linear-gradient(135deg,rgba(0,220,245,.35),rgba(155,47,240,.4)); position:relative; overflow:hidden; }
.s-tile .th::after{ content:''; position:absolute; left:6px; right:6px; bottom:6px; height:3px; border-radius:2px; background:rgba(255,255,255,.5); }
.s-tile .tt b{ display:block; font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:11px; line-height:1.1; }
.s-tile .tt span{ font-size:8.5px; color:rgba(255,255,255,.6); }
.s-form{ display:flex; gap:5px; }
.s-form i{ width:16px;height:16px;border-radius:5px; display:flex;align-items:center;justify-content:center; font-style:normal; font-size:9px; font-weight:800; font-family:'Barlow Condensed',sans-serif; }
.s-form i.w{ background:var(--lime); color:#0b0e26; } .s-form i.l{ background:rgba(255,61,166,.5); color:#fff; }
.s-mini3{ display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }
.s-mini3 .m{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:10px; padding:7px 4px; text-align:center; }
.s-mini3 .m b{ display:block; font-family:'Barlow Condensed',sans-serif; font-size:14px; }
.s-mini3 .m span{ font-size:7.5px; letter-spacing:.06em; text-transform:uppercase; color:rgba(255,255,255,.6); }

/* screen 1 hero */
.s1-hero{ position:relative; border-radius:16px; overflow:hidden; height:98px; }
.s1-hero img{ width:100%; height:100%; object-fit:cover; object-position:top center; }
.s1-hero .ov{ position:absolute; inset:0; background:linear-gradient(180deg,rgba(16,20,51,.15),rgba(16,20,51,.92)); }
.s1-hero .cap{ position:absolute; left:11px; bottom:9px; right:11px; }
.s1-hero .cap h4{ margin:0; font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; font-size:19px; line-height:1; letter-spacing:.02em; }
.s1-hero .cap p{ margin:2px 0 0; font-size:9px; color:rgba(255,255,255,.82); }
.s1-tiles{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.s1-tiles .t{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:9px 6px; text-align:center; }
.s1-tiles .t b{ display:block; font-family:'Barlow Condensed',sans-serif; font-size:16px; }
.s1-tiles .t span{ font-size:8px; letter-spacing:.08em; text-transform:uppercase; color:rgba(255,255,255,.62); }

/* screen 2 live */
.s2-score{ display:flex; align-items:baseline; gap:8px; }
.s2-score .r{ font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:34px; line-height:1; }
.s2-score .o{ font-size:11px; color:rgba(255,255,255,.7); }
.s2-bat{ display:flex; align-items:center; justify-content:space-between; font-size:10px; padding:5px 0; border-bottom:1px solid rgba(255,255,255,.07); }
.s2-bat .nm{ display:flex; align-items:center; gap:5px; }
.s2-bat .strike{ width:6px;height:6px;border-radius:50%;background:var(--lime); }
.s2-bat .rn{ font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:12px; }
.s2-over{ display:flex; gap:6px; }
.s2-over .b{ width:22px;height:22px;border-radius:50%; display:flex;align-items:center;justify-content:center; font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:11px; background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.14); }
.s2-over .b.w{ background:var(--m); } .s2-over .b.six{ background:var(--v); } .s2-over .b.four{ background:var(--c); color:#04121a; }

/* screen 3 player card */
.s3-card{ position:relative; border-radius:18px; overflow:hidden; padding:14px 13px; background:linear-gradient(155deg,#5B2BF0,#9B2FF0 52%,#FF3DA6); box-shadow:0 14px 30px rgba(155,47,240,.4); }
.s3-card .wm{ position:absolute; right:-6px; bottom:-30px; font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:120px; line-height:1; color:rgba(255,255,255,.09); }
.s3-top{ display:flex; align-items:center; justify-content:space-between; position:relative; z-index:2; }
.s3-reg{ font-size:8.5px; font-weight:800; letter-spacing:.08em; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.35); border-radius:8px; padding:3px 7px; }
.s3-av{ width:64px;height:64px;border-radius:50%; margin:8px auto 6px; display:flex;align-items:center;justify-content:center; font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:26px; background:rgba(0,0,0,.18); border:3px solid var(--c); position:relative; z-index:2; }
.s3-nm{ text-align:center; font-family:'Barlow Condensed',sans-serif; font-weight:800; text-transform:uppercase; font-size:19px; letter-spacing:.02em; position:relative; z-index:2; }
.s3-chips{ display:flex; gap:5px; justify-content:center; margin:5px 0 8px; position:relative; z-index:2; }
.s3-chips span{ font-size:8px; font-weight:700; background:rgba(0,0,0,.22); border:1px solid rgba(0,220,245,.5); border-radius:100px; padding:3px 7px; }
.s3-hl{ background:rgba(0,0,0,.26); border-radius:11px; padding:8px 10px; position:relative; z-index:2; }
.s3-hl .ht{ font-size:8px; font-weight:800; letter-spacing:.1em; color:#FFD166; text-transform:uppercase; text-align:center; margin-bottom:5px; }
.s3-hl .row{ display:flex; justify-content:space-between; font-size:9px; padding:2px 0; }
.s3-hl .row b{ color:var(--c); font-family:'Barlow Condensed',sans-serif; font-size:11px; }
.s3-share{ margin-top:9px; text-align:center; font-family:'Barlow Condensed',sans-serif; font-weight:800; text-transform:uppercase; letter-spacing:.05em; font-size:12px; background:#fff; color:#7C1F6b; border-radius:100px; padding:7px; position:relative; z-index:2; }

/* screen 4 journey */
.s4-step{ display:flex; gap:10px; align-items:flex-start; }
.s4-rail{ display:flex; flex-direction:column; align-items:center; }
.s4-dot{ width:20px;height:20px;border-radius:50%; display:flex;align-items:center;justify-content:center; font-size:10px; font-weight:800; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); }
.s4-dot.done{ background:var(--lime); color:#0b0e26; border-color:var(--lime); }
.s4-dot.now{ background:var(--grad); border-color:transparent; box-shadow:0 0 0 4px rgba(155,47,240,.25); }
.s4-line{ width:2px; flex:1; min-height:12px; background:rgba(255,255,255,.16); }
.s4-line.done{ background:var(--lime); }
.s4-txt b{ display:block; font-size:11px; font-family:'Barlow Condensed',sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:.02em; }
.s4-txt span{ font-size:9px; color:rgba(255,255,255,.62); }
.s4-prog{ height:7px; border-radius:100px; background:rgba(255,255,255,.1); overflow:hidden; }
.s4-prog i{ display:block; height:100%; width:58%; background:var(--grad); }

/* screen 5 pass */
.s5-pass{ border-radius:16px; overflow:hidden; background:#fff; color:#0b0e26; }
.s5-pass .top{ background:var(--grad); color:#fff; padding:10px 12px; display:flex; align-items:center; justify-content:space-between; }
.s5-pass .top b{ font-family:'Barlow Condensed',sans-serif; text-transform:uppercase; font-size:14px; }
.s5-pass .qr{ margin:12px auto; width:96px; height:96px; border-radius:10px; background-image:
  linear-gradient(#0b0e26 25%,transparent 0),linear-gradient(90deg,#0b0e26 25%,transparent 0);
  background-size:12px 12px; background-color:#fff; border:6px solid #fff; box-shadow:0 0 0 2px #0b0e26; position:relative; }
.s5-pass .qr::after{ content:''; position:absolute; inset:26px; background:repeating-conic-gradient(#0b0e26 0 25%,#fff 0 50%) 50%/16px 16px; }
.s5-pass .meta{ padding:0 12px 12px; }
.s5-pass .meta .r{ display:flex; justify-content:space-between; font-size:10px; padding:4px 0; border-top:1px dashed rgba(0,0,0,.14); }
.s5-pass .meta .r b{ font-family:'Barlow Condensed',sans-serif; font-size:11px; }

/* screen 6 matches */
.s6-fix{ display:flex; align-items:center; justify-content:space-between; }
.s6-team{ display:flex; flex-direction:column; align-items:center; gap:4px; width:60px; }
.s6-crest{ width:30px;height:30px;border-radius:9px; }
.s6-team span{ font-size:9px; font-weight:700; }
.s6-vs{ text-align:center; }
.s6-vs .v{ font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:12px; color:rgba(255,255,255,.6); }
.s6-vs .cd{ display:block; margin-top:4px; font-size:8px; font-weight:800; letter-spacing:.06em; color:var(--c); background:rgba(0,220,245,.12); border:1px solid rgba(0,220,245,.4); border-radius:100px; padding:2px 7px; }

/* screen 7 points table */
.s7-t{ width:100%; border-collapse:collapse; }
.s7-t th{ font-size:8px; letter-spacing:.06em; text-transform:uppercase; color:rgba(255,255,255,.55); text-align:right; padding:5px 4px; font-weight:700; }
.s7-t th:first-child, .s7-t td:first-child{ text-align:left; }
.s7-t td{ font-size:10px; padding:6px 4px; text-align:right; border-top:1px solid rgba(255,255,255,.07); }
.s7-t td:first-child{ font-weight:700; display:flex; align-items:center; gap:6px; }
.s7-t td .cr{ width:16px;height:16px;border-radius:5px; }
.s7-t tr.q td{ background:linear-gradient(90deg,rgba(182,255,60,.14),transparent); }
.s7-pos{ width:14px; color:rgba(255,255,255,.5); font-size:9px; }

/* screen 8 mvp / vote */
.s8-pod{ display:flex; align-items:flex-end; justify-content:center; gap:8px; }
.s8-p{ display:flex; flex-direction:column; align-items:center; gap:4px; }
.s8-p .av{ width:34px;height:34px;border-radius:50%; display:flex;align-items:center;justify-content:center; font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:13px; background:rgba(255,255,255,.1); border:2px solid rgba(255,255,255,.25); }
.s8-p.g1 .av{ border-color:#FFD166; box-shadow:0 0 0 3px rgba(255,209,102,.25); }
.s8-p .bar{ width:34px; border-radius:8px 8px 0 0; background:var(--grad); }
.s8-p .nm{ font-size:8.5px; font-weight:700; }
.s8-poll{ }
.s8-opt{ display:flex; align-items:center; justify-content:space-between; font-size:10px; margin-top:6px; }
.s8-meter{ position:relative; height:8px; border-radius:100px; background:rgba(255,255,255,.1); overflow:hidden; margin-top:3px; }
.s8-meter i{ display:block; height:100%; background:var(--c); }
.s8-meter.b i{ background:var(--m); }

/* screen 9 auction */
.s9-lot{ position:relative; border-radius:16px; overflow:hidden; padding:12px; background:linear-gradient(150deg,rgba(124,92,255,.28),rgba(255,61,166,.2)); border:1px solid rgba(255,255,255,.16); }
.s9-sold{ position:absolute; top:12px; right:-30px; transform:rotate(38deg); background:var(--lime); color:#0b0e26; font-family:'Barlow Condensed',sans-serif; font-weight:800; letter-spacing:.1em; font-size:10px; padding:3px 34px; box-shadow:0 6px 16px rgba(0,0,0,.4); }
.s9-av{ width:52px;height:52px;border-radius:14px; display:flex;align-items:center;justify-content:center; font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:20px; background:rgba(0,0,0,.2); border:1px solid rgba(255,255,255,.2); }
.s9-bid{ font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size:26px; line-height:1; color:var(--lime); }
.s9-hist{ display:flex; justify-content:space-between; font-size:9px; padding:4px 0; border-top:1px solid rgba(255,255,255,.08); }

/* screen 10 notifications */
.s10-n{ display:flex; gap:9px; align-items:flex-start; }
.s10-ic{ width:30px;height:30px;border-radius:9px; flex:0 0 auto; display:flex;align-items:center;justify-content:center; background:rgba(255,255,255,.08); }
.s10-ic.v{ background:var(--grad); } .s10-ic.c{ background:rgba(0,220,245,.2); } .s10-ic.m{ background:rgba(255,61,166,.2); }
.s10-n .tx b{ display:block; font-size:10.5px; font-family:'Barlow Condensed',sans-serif; font-weight:700; }
.s10-n .tx span{ font-size:9px; color:rgba(255,255,255,.6); }
.s10-n .tm{ margin-left:auto; font-size:8px; color:rgba(255,255,255,.45); white-space:nowrap; }
.s10-bell{ position:relative; }
.s10-bell b{ position:absolute; top:-3px; right:-3px; width:13px;height:13px;border-radius:50%; background:var(--m); color:#fff; font-size:8px; display:flex;align-items:center;justify-content:center; font-weight:800; }

/* ---- controls ---- */
.aps-ctrls{ display:flex; align-items:center; justify-content:center; gap:14px; margin-top:6px; }
.aps-arrow{ width:38px;height:38px;border-radius:50%; display:none; align-items:center; justify-content:center; cursor:pointer; color:#fff; background:rgba(124,92,255,.18); border:1px solid rgba(124,92,255,.5); transition:background .16s,transform .12s; }
.aps-arrow:hover{ background:rgba(124,92,255,.34); } .aps-arrow:active{ transform:scale(.94); }
.aps-arrow:focus-visible{ outline:2px solid var(--c); outline-offset:2px; }
@media (min-width:900px){ .aps-arrow{ display:flex; } }
.aps-dots{ display:flex; gap:7px; align-items:center; flex-wrap:wrap; justify-content:center; max-width:220px; }
.aps-dot{ width:8px;height:8px;border-radius:50%; padding:0; border:0; cursor:pointer; background:rgba(255,255,255,.28); transition:background .16s,width .16s; }
.aps-dot.on{ width:22px; border-radius:100px; background:linear-gradient(90deg,#9B2FF0,#FF3DA6); }
.aps-dot:focus-visible{ outline:2px solid var(--c); outline-offset:2px; }
.aps-cap{ text-align:center; margin-top:12px; min-height:34px; }
.aps-cap .k{ font-size:9.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#00DCF5; }
.aps-cap .d{ font-size:12.5px; color:rgba(255,255,255,.8); margin-top:3px; font-family:Inter,sans-serif; }
`;

/* --- small helpers to keep JSX readable --- */
function StatusBar({ label }: { label: string }) {
  return (
    <div className="s-status">
      <span>{label}</span>
      <span className="dots"><i /><i /><i /><span className="batt" /></span>
    </div>
  );
}
function TabBar({ on }: { on: number }) {
  return (
    <div className="s-tabbar">
      {[0, 1, 2, 3, 4].map((i) => <span key={i} className={i === on ? "on" : ""} />)}
    </div>
  );
}

/* ------------------------- the 10 screens ------------------------- */

function ScreenHome({ t }: { t: (en: string, hi: string) => string }) {
  return (
    <div className="aps-scr">
      <StatusBar label="9:41" />
      <div className="s-body">
        <div className="s-h">
          <div className="ttl">BCPL</div>
          <span className="s-badge">{t("SEASON " + SEASON.number, "सीज़न " + SEASON.number)}</span>
        </div>
        <div className="s1-hero">
          <img src={BASE + "bcpl-assets/ambassador-a.webp"} alt="" />
          <div className="ov" />
          <div className="cap">
            <h4>{t("OFFICE TO STADIUM", "ऑफिस से स्टेडियम")}</h4>
            <p>{t("Your cricket dream isn't over", "आपका क्रिकेट सपना अभी बाकी है")}</p>
          </div>
        </div>
        <div className="s1-tiles">
          <div className="t"><b>10</b><span>{t("Matches", "मैच")}</span></div>
          <div className="t"><b>04</b><span>{t("Points", "अंक")}</span></div>
          <div className="t"><b>MVP</b><span>{t("Race", "रेस")}</span></div>
        </div>
        <div className="s-card g" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="s-lbl">{t("Phase 1", "फेज़ 1")}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15 }}>{t("Registration open", "रजिस्ट्रेशन खुला")}</div>
          </div>
          <span className="s-badge">{t("OPEN", "खुला")}</span>
        </div>
        <div className="s-card">
          <div className="s-sec" style={{ marginBottom: 8 }}><span className="s-lbl">{t("Up next", "अगला मैच")}</span><span className="s-badge c">2h 15m</span></div>
          <div className="s6-fix">
            <div className="s6-team"><div className="s6-crest" style={{ background: "linear-gradient(135deg,#7C5CFF,#00DCF5)" }} /><span>{t("Team A", "टीम A")}</span></div>
            <div className="s6-vs"><span className="v">VS</span></div>
            <div className="s6-team"><div className="s6-crest" style={{ background: "linear-gradient(135deg,#FF3DA6,#FF7A29)" }} /><span>{t("Team B", "टीम B")}</span></div>
          </div>
        </div>
        <div className="s-mini3">
          <div className="m"><b>1st</b><span>{t("On table", "टेबल पर")}</span></div>
          <div className="m"><b>A.V</b><span>{t("Top MVP", "टॉप MVP")}</span></div>
          <div className="m"><b>+1.8</b><span>NRR</span></div>
        </div>
        <div className="s-card s-tile">
          <div className="th" />
          <div className="tt"><b>{t("Season 5 kicks off", "सीज़न 5 शुरू")}</b><span>{t("Latest from the media centre", "मीडिया सेंटर से ताज़ा")}</span></div>
        </div>
        <div style={{ height: 46 }} />
      </div>
      <div className="s-fab">{t("Register", "रजिस्टर")}</div>
      <TabBar on={0} />
    </div>
  );
}

function ScreenLive({ t }: { t: (en: string, hi: string) => string }) {
  return (
    <div className="aps-scr">
      <StatusBar label="9:41" />
      <div className="s-body">
        <div className="s-h">
          <div className="ttl">{t("Live Scoring", "लाइव स्कोरिंग")}</div>
          <span className="s-live"><b />LIVE</span>
        </div>
        <div className="s-card">
          <div className="s-lbl">{t("Corporate XI", "कॉर्पोरेट XI")}</div>
          <div className="s2-score"><span className="r">147/4</span><span className="o">(16.2 {t("ov", "ओवर")})</span></div>
          <div className="s2-bat"><span className="nm"><span className="strike" />{t("A. Verma", "ए. वर्मा")}</span><span className="rn">58 (41)</span></div>
          <div className="s2-bat"><span className="nm">{t("R. Nair", "आर. नायर")}</span><span className="rn">23 (18)</span></div>
          <div className="s2-bat" style={{ borderBottom: "none", color: "rgba(255,255,255,.7)" }}><span className="nm">{t("Bowling: S. Khan", "गेंदबाज़ी: एस. खान")}</span><span className="rn">2-28</span></div>
        </div>
        <div className="s-card">
          <div className="s-lbl" style={{ marginBottom: 7 }}>{t("This over", "यह ओवर")}</div>
          <div className="s2-over">
            <span className="b">1</span>
            <span className="b four">4</span>
            <span className="b w">W</span>
            <span className="b six">6</span>
            <span className="b">2</span>
          </div>
        </div>
        <div className="s-mini3">
          <div className="m"><b>9.02</b><span>{t("Run rate", "रन रेट")}</span></div>
          <div className="m"><b>44</b><span>{t("Partnership", "साझेदारी")}</span></div>
          <div className="m"><b>9.4</b><span>{t("Req. RR", "आवश्यक RR")}</span></div>
        </div>
        <div className="s-card">
          <div className="s-lbl" style={{ marginBottom: 6 }}>{t("Fall of wickets", "विकेट पतन")}</div>
          <div className="s-mrow"><span>{t("1st wicket", "पहला विकेट")}</span><b>32 (4.1)</b></div>
          <div className="s-mrow"><span>{t("2nd wicket", "दूसरा विकेट")}</span><b>68 (8.5)</b></div>
          <div className="s-mrow"><span>{t("3rd wicket", "तीसरा विकेट")}</span><b>121 (14.2)</b></div>
        </div>
        <div className="s-grow" />
      </div>
      <TabBar on={1} />
    </div>
  );
}

function ScreenCard({ t }: { t: (en: string, hi: string) => string }) {
  return (
    <div className="aps-scr">
      <StatusBar label="9:41" />
      <div className="s-body">
        <div className="s-h"><div className="ttl">{t("My Card", "मेरा कार्ड")}</div></div>
        <div className="s3-card">
          <span className="wm">{SEASON.number}</span>
          <div className="s3-top">
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13 }}>BCPL T20</span>
            <span className="s3-reg">BCPL-DEL-42</span>
          </div>
          <div className="s3-av">RS</div>
          <div className="s3-nm">RAHUL SHARMA</div>
          <div className="s3-chips"><span>{t("ALL-ROUNDER", "ऑल-राउंडर")}</span><span>DELHI</span></div>
          <div className="s3-hl">
            <div className="ht">{t("BCPL SEASON " + SEASON.number + " HIGHLIGHTS", "BCPL सीज़न " + SEASON.number + " हाइलाइट्स")}</div>
            <div className="row"><span>{t("Total prize pool", "कुल प्राइज़ पूल")}</span><b>₹15 Cr+</b></div>
            <div className="row"><span>{t("Man of the Series", "मैन ऑफ द सीरीज़")}</span><b>{t("Luxury car", "लक्ज़री कार")}</b></div>
            <div className="row"><span>{t("Auction contracts", "ऑक्शन कॉन्ट्रैक्ट")}</span><b>₹2–20 L</b></div>
          </div>
          <div className="s3-share">{t("Share card", "कार्ड शेयर करें")}</div>
        </div>
        <div className="s-mini3">
          <div className="m"><b>Right</b><span>{t("Batting", "बल्लेबाज़ी")}</span></div>
          <div className="m"><b>Off-spin</b><span>{t("Bowling", "गेंदबाज़ी")}</span></div>
          <div className="m"><b>Delhi</b><span>{t("Trial city", "ट्रायल शहर")}</span></div>
        </div>
        <div className="s-card s-tile">
          <div className="th" />
          <div className="tt"><b>{t("Save to gallery", "गैलरी में सेव")}</b><span>{t("Post your card on socials", "अपना कार्ड सोशल पर पोस्ट करें")}</span></div>
        </div>
        <div className="s-grow" />
      </div>
      <TabBar on={2} />
    </div>
  );
}

function ScreenJourney({ t }: { t: (en: string, hi: string) => string }) {
  return (
    <div className="aps-scr">
      <StatusBar label="9:41" />
      <div className="s-body">
        <div className="s-h"><div className="ttl">{t("My Journey", "मेरी यात्रा")}</div></div>
        <div className="s-card" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div className="s4-step">
            <div className="s4-rail"><div className="s4-dot done">✓</div><div className="s4-line done" /></div>
            <div className="s4-txt" style={{ paddingBottom: 16 }}><b>{t("Registered", "रजिस्टर्ड")}</b><span>{t("Phase 1 complete", "फेज़ 1 पूरा")}</span></div>
          </div>
          <div className="s4-step">
            <div className="s4-rail"><div className="s4-dot now" /><div className="s4-line" /></div>
            <div className="s4-txt" style={{ paddingBottom: 16 }}><b>{t("Trial slot", "ट्रायल स्लॉट")}</b><span>{t("Booking window open", "बुकिंग विंडो खुली")}</span></div>
          </div>
          <div className="s4-step">
            <div className="s4-rail"><div className="s4-dot" /></div>
            <div className="s4-txt"><b>{t("Result window", "रिज़ल्ट विंडो")}</b><span>{t("Updates in the app", "अपडेट app में")}</span></div>
          </div>
        </div>
        <div className="s-card">
          <div className="s-lbl" style={{ marginBottom: 7 }}>{t("Progress", "प्रगति")}</div>
          <div className="s4-prog"><i /></div>
        </div>
        <div className="s-card g" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="s-lbl">{t("Next step", "अगला कदम")}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14 }}>{t("Book your trial slot", "अपना ट्रायल स्लॉट बुक करें")}</div>
          </div>
          <span className="s-badge c">{t("GO", "जाएँ")}</span>
        </div>
        <div className="s-card">
          <div className="s-lbl" style={{ marginBottom: 6 }}>{t("Checklist", "चेकलिस्ट")}</div>
          <div className="s-mrow"><span className="lead">{t("Profile details", "प्रोफ़ाइल विवरण")}</span><b className="up">{t("Done", "पूरा")}</b></div>
          <div className="s-mrow"><span className="lead">{t("Photo uploaded", "फ़ोटो अपलोड")}</span><b className="up">{t("Done", "पूरा")}</b></div>
          <div className="s-mrow"><span className="lead">{t("Slot booking", "स्लॉट बुकिंग")}</span><b style={{ color: "var(--c)" }}>{t("Pending", "बाकी")}</b></div>
        </div>
        <div className="s-grow" />
      </div>
      <TabBar on={0} />
    </div>
  );
}

function ScreenPass({ t }: { t: (en: string, hi: string) => string }) {
  return (
    <div className="aps-scr">
      <StatusBar label="9:41" />
      <div className="s-body">
        <div className="s-h"><div className="ttl">{t("Trial Pass", "ट्रायल पास")}</div><span className="s-badge v">{t("VALID", "मान्य")}</span></div>
        <div className="s5-pass">
          <div className="top"><b>BCPL {t("TRIAL PASS", "ट्रायल पास")}</b><span style={{ fontSize: 10 }}>SEASON {SEASON.number}</span></div>
          <div className="qr" />
          <div className="meta">
            <div className="r"><span>{t("Venue", "स्थल")}</span><b>{t("Delhi Central Ground", "दिल्ली सेंट्रल ग्राउंड")}</b></div>
            <div className="r"><span>{t("Date", "तारीख")}</span><b>18 Jan</b></div>
            <div className="r"><span>{t("Slot", "स्लॉट")}</span><b>09:30 AM</b></div>
            <div className="r"><span>{t("Pass ID", "पास आईडी")}</span><b>TP-DEL-2041</b></div>
          </div>
        </div>
        <div className="s-card">
          <div className="s-lbl" style={{ marginBottom: 6 }}>{t("How to use", "कैसे उपयोग करें")}</div>
          <div className="s-mrow"><span>{t("Show this pass at the gate", "गेट पर यह पास दिखाएँ")}</span></div>
          <div className="s-mrow"><span>{t("Carry a photo ID", "फ़ोटो आईडी साथ रखें")}</span></div>
          <div className="s-mrow"><span>{t("Reach 30 minutes early", "30 मिनट पहले पहुँचें")}</span></div>
        </div>
        <div className="s-card g" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="s-lbl">{t("Reminder", "रिमाइंडर")}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14 }}>{t("Trial in 1 day", "ट्रायल 1 दिन में")}</div>
          </div>
          <span className="s-badge">{t("SET", "सेट")}</span>
        </div>
        <div className="s-grow" />
      </div>
      <TabBar on={0} />
    </div>
  );
}

function ScreenMatches({ t }: { t: (en: string, hi: string) => string }) {
  const crest = (a: string, b: string) => ({ background: `linear-gradient(135deg,${a},${b})` });
  return (
    <div className="aps-scr">
      <StatusBar label="9:41" />
      <div className="s-body">
        <div className="s-h"><div className="ttl">{t("Matches", "मैच")}</div><span className="s-badge c">{t("FIXTURES", "फिक्स्चर")}</span></div>
        <div className="s-card">
          <div className="s6-fix">
            <div className="s6-team"><div className="s6-crest" style={crest("#7C5CFF", "#00DCF5")} /><span>{t("Team A", "टीम A")}</span></div>
            <div className="s6-vs"><span className="v">VS</span><span className="cd">2h 15m</span></div>
            <div className="s6-team"><div className="s6-crest" style={crest("#FF3DA6", "#FF7A29")} /><span>{t("Team B", "टीम B")}</span></div>
          </div>
        </div>
        <div className="s-card">
          <div className="s6-fix">
            <div className="s6-team"><div className="s6-crest" style={crest("#B6FF3C", "#00DCF5")} /><span>{t("Team C", "टीम C")}</span></div>
            <div className="s6-vs"><span className="v">VS</span><span className="cd">{t("Tomorrow", "कल")}</span></div>
            <div className="s6-team"><div className="s6-crest" style={crest("#9B2FF0", "#FF3DA6")} /><span>{t("Team D", "टीम D")}</span></div>
          </div>
        </div>
        <div className="s-card">
          <div className="s6-fix">
            <div className="s6-team"><div className="s6-crest" style={crest("#00DCF5", "#5B2BF0")} /><span>{t("Team E", "टीम E")}</span></div>
            <div className="s6-vs"><span className="v">VS</span><span className="cd">Sat 6:00</span></div>
            <div className="s6-team"><div className="s6-crest" style={crest("#FF7A29", "#B6FF3C")} /><span>{t("Team F", "टीम F")}</span></div>
          </div>
        </div>
        <div className="s-card">
          <div className="s-sec" style={{ marginBottom: 6 }}><span className="s-lbl">{t("Recent results", "हाल के नतीजे")}</span><span className="more">{t("See all", "सभी देखें")}</span></div>
          <div className="s-mrow"><span className="lead"><span className="cr" style={crest("#7C5CFF", "#00DCF5")} />{t("Team A beat Team C", "टीम A ने टीम C को हराया")}</span><b className="up">+22</b></div>
          <div className="s-mrow"><span className="lead"><span className="cr" style={crest("#9B2FF0", "#FF3DA6")} />{t("Team D beat Team F", "टीम D ने टीम F को हराया")}</span><b className="up">+6 wk</b></div>
        </div>
        <div className="s-grow" />
      </div>
      <TabBar on={1} />
    </div>
  );
}

function ScreenPoints({ t }: { t: (en: string, hi: string) => string }) {
  const cr = (a: string, b: string) => ({ background: `linear-gradient(135deg,${a},${b})` });
  const rows: Array<[number, string, string, string, string, string, boolean]> = [
    [1, "Team A", "#7C5CFF", "#00DCF5", "3-0", "+1.8", true],
    [2, "Team D", "#9B2FF0", "#FF3DA6", "2-1", "+0.9", true],
    [3, "Team B", "#FF3DA6", "#FF7A29", "1-1", "+0.2", false],
    [4, "Team C", "#B6FF3C", "#00DCF5", "1-2", "-0.6", false],
  ];
  return (
    <div className="aps-scr">
      <StatusBar label="9:41" />
      <div className="s-body">
        <div className="s-h"><div className="ttl">{t("Points Table", "पॉइंट्स टेबल")}</div><span className="s-badge">{t("GROUP", "ग्रुप")}</span></div>
        <div className="s-card">
          <table className="s7-t">
            <thead><tr><th>{t("Team", "टीम")}</th><th>W-L</th><th>NRR</th><th>{t("Pts", "अंक")}</th></tr></thead>
            <tbody>
              {rows.map(([pos, nm, a, b, wl, nrr, q], i) => (
                <tr key={nm} className={q ? "q" : ""}>
                  <td><span className="s7-pos">{pos}</span><span className="cr" style={cr(a, b)} />{nm}</td>
                  <td>{wl}</td><td>{nrr}</td><td style={{ fontWeight: 800 }}>{[6, 4, 2, 2][i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 9, color: "rgba(182,255,60,.9)", fontWeight: 700, letterSpacing: ".06em" }}>{t("Top 2 qualify", "टॉप 2 क्वालिफ़ाई")}</div>
        <div className="s-card">
          <div className="s-lbl" style={{ marginBottom: 7 }}>{t("Form guide", "फ़ॉर्म गाइड")}</div>
          <div className="s-mrow"><span className="lead"><span className="cr" style={{ background: "linear-gradient(135deg,#7C5CFF,#00DCF5)" }} />{t("Team A", "टीम A")}</span><span className="s-form"><i className="w">W</i><i className="w">W</i><i className="w">W</i></span></div>
          <div className="s-mrow"><span className="lead"><span className="cr" style={{ background: "linear-gradient(135deg,#9B2FF0,#FF3DA6)" }} />{t("Team D", "टीम D")}</span><span className="s-form"><i className="w">W</i><i className="l">L</i><i className="w">W</i></span></div>
          <div className="s-mrow"><span className="lead"><span className="cr" style={{ background: "linear-gradient(135deg,#FF3DA6,#FF7A29)" }} />{t("Team B", "टीम B")}</span><span className="s-form"><i className="l">L</i><i className="w">W</i><i className="l">L</i></span></div>
        </div>
        <div className="s-card">
          <div className="s-sec"><span className="s-lbl">{t("Legend", "संकेत")}</span></div>
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 8.5, color: "rgba(255,255,255,.7)" }}>
            <span>W-L · {t("Won-Lost", "जीत-हार")}</span>
            <span>NRR · {t("Net run rate", "नेट रन रेट")}</span>
          </div>
        </div>
        <div className="s-grow" />
      </div>
      <TabBar on={1} />
    </div>
  );
}

function ScreenMVP({ t }: { t: (en: string, hi: string) => string }) {
  return (
    <div className="aps-scr">
      <StatusBar label="9:41" />
      <div className="s-body">
        <div className="s-h"><div className="ttl">{t("MVP & Voting", "MVP और वोटिंग")}</div></div>
        <div className="s-card">
          <div className="s-lbl" style={{ textAlign: "center", marginBottom: 8 }}>{t("MVP Leaderboard", "MVP लीडरबोर्ड")}</div>
          <div className="s8-pod">
            <div className="s8-p"><div className="av">RN</div><div className="bar" style={{ height: 34 }} /><div className="nm">R. Nair</div></div>
            <div className="s8-p g1"><div className="av">AV</div><div className="bar" style={{ height: 50 }} /><div className="nm">A. Verma</div></div>
            <div className="s8-p"><div className="av">SK</div><div className="bar" style={{ height: 24 }} /><div className="nm">S. Khan</div></div>
          </div>
        </div>
        <div className="s-card s8-poll">
          <div className="s-lbl">{t("Fan Vote · Play of the day", "फैन वोट · दिन का पल")}</div>
          <div className="s8-opt"><span>{t("A. Verma six", "ए. वर्मा का छक्का")}</span><span>62%</span></div>
          <div className="s8-meter"><i style={{ width: "62%" }} /></div>
          <div className="s8-opt"><span>{t("S. Khan wicket", "एस. खान का विकेट")}</span><span>38%</span></div>
          <div className="s8-meter b"><i style={{ width: "38%" }} /></div>
        </div>
        <div className="s-card">
          <div className="s-sec" style={{ marginBottom: 6 }}><span className="s-lbl">{t("Top run-scorers", "टॉप रन-स्कोरर")}</span><span className="more">{t("Full list", "पूरी सूची")}</span></div>
          <div className="s-mrow"><span className="lead">1 · A. Verma</span><b>248</b></div>
          <div className="s-mrow"><span className="lead">2 · R. Nair</span><b>201</b></div>
          <div className="s-mrow"><span className="lead">3 · S. Khan</span><b>176</b></div>
          <div className="s-mrow"><span className="lead">4 · M. Rao</span><b>154</b></div>
        </div>
        <div className="s-grow" />
      </div>
      <TabBar on={3} />
    </div>
  );
}

function ScreenAuction({ t }: { t: (en: string, hi: string) => string }) {
  return (
    <div className="aps-scr">
      <StatusBar label="9:41" />
      <div className="s-body">
        <div className="s-h"><div className="ttl">{t("Auction", "ऑक्शन")}</div><span className="s-live"><b />{t("LIVE", "लाइव")}</span></div>
        <div className="s9-lot">
          <div className="s9-sold">SOLD</div>
          <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
            <div className="s9-av">AV</div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15 }}>A. VERMA</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.7)" }}>{t("All-Rounder · Delhi", "ऑल-राउंडर · दिल्ली")}</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="s-lbl">{t("Winning bid", "विजयी बोली")}</div>
            <div className="s9-bid">₹18.5 L</div>
          </div>
        </div>
        <div className="s-card">
          <div className="s-lbl" style={{ marginBottom: 4 }}>{t("Bid history", "बोली इतिहास")}</div>
          <div className="s9-hist" style={{ borderTop: "none" }}><span>{t("Base price", "बेस प्राइस")}</span><span>₹2 L</span></div>
          <div className="s9-hist"><span>{t("Previous", "पिछली")}</span><span>₹16 L</span></div>
          <div className="s9-hist"><span style={{ color: "var(--lime)", fontWeight: 700 }}>{t("Final", "अंतिम")}</span><span style={{ color: "var(--lime)", fontWeight: 700 }}>₹18.5 L</span></div>
        </div>
        <div className="s-mini3">
          <div className="m"><b>₹42 L</b><span>{t("Purse left", "बाकी पर्स")}</span></div>
          <div className="m"><b>08</b><span>{t("Slots left", "बाकी स्लॉट")}</span></div>
          <div className="m"><b>14</b><span>{t("Lots done", "पूरे लॉट")}</span></div>
        </div>
        <div className="s-card s-tile">
          <div className="th" style={{ background: "linear-gradient(135deg,#FF3DA6,#FF7A29)" }} />
          <div className="tt"><b>{t("Up next: R. Nair", "अगला: आर. नायर")}</b><span>{t("Batsman · base ₹2 L", "बल्लेबाज़ · बेस ₹2 L")}</span></div>
        </div>
        <div className="s-grow" />
      </div>
      <TabBar on={4} />
    </div>
  );
}

function ScreenNotifs({ t }: { t: (en: string, hi: string) => string }) {
  return (
    <div className="aps-scr">
      <StatusBar label="9:41" />
      <div className="s-body">
        <div className="s-h">
          <div className="ttl">{t("Updates", "अपडेट")}</div>
          <span className="s10-bell"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg><b>3</b></span>
        </div>
        <div className="s-card s10-n">
          <div className="s10-ic v"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></div>
          <div className="tx"><b>{t("Trial reminder", "ट्रायल रिमाइंडर")}</b><span>{t("Your slot is tomorrow, 9:30 AM", "आपका स्लॉट कल 9:30 AM")}</span></div>
          <span className="tm">2h</span>
        </div>
        <div className="s-card s10-n">
          <div className="s10-ic c"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00DCF5" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></div>
          <div className="tx"><b>{t("Result update", "रिज़ल्ट अपडेट")}</b><span>{t("Your trial result window is open", "आपकी रिज़ल्ट विंडो खुली है")}</span></div>
          <span className="tm">5h</span>
        </div>
        <div className="s-card s10-n">
          <div className="s10-ic m"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF3DA6" strokeWidth="2"><path d="M4 4h16v12H5l-1 4z" /></svg></div>
          <div className="tx"><b>{t("Match alert", "मैच अलर्ट")}</b><span>{t("Team A vs Team B starts in 2h", "टीम A बनाम टीम B 2 घंटे में")}</span></div>
          <span className="tm">1d</span>
        </div>
        <div className="s-card s10-n">
          <div className="s10-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B6FF3C" strokeWidth="2"><path d="M12 2 15 8l6 .9-4.5 4.3L18 20l-6-3.2L6 20l1.5-6.8L3 8.9 9 8z" /></svg></div>
          <div className="tx"><b>{t("Auction update", "ऑक्शन अपडेट")}</b><span>{t("A. Verma signed for ₹18.5 L", "ए. वर्मा ₹18.5 L में साइन")}</span></div>
          <span className="tm">2d</span>
        </div>
        <div className="s-card s10-n">
          <div className="s10-ic v"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M4 4h16v12H5l-1 4z" /></svg></div>
          <div className="tx"><b>{t("New in media", "मीडिया में नया")}</b><span>{t("Season 5 highlights are live", "सीज़न 5 हाइलाइट्स लाइव")}</span></div>
          <span className="tm">3d</span>
        </div>
        <div className="s-card s10-n">
          <div className="s10-ic c"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00DCF5" strokeWidth="2"><path d="M9 11l3 3 8-8" /><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" /></svg></div>
          <div className="tx"><b>{t("Fan vote is open", "फैन वोट खुला")}</b><span>{t("Pick your play of the day", "दिन का पल चुनें")}</span></div>
          <span className="tm">4d</span>
        </div>
        <div className="s-card s10-n">
          <div className="s10-ic m"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF3DA6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></svg></div>
          <div className="tx"><b>{t("Points table updated", "पॉइंट्स टेबल अपडेट")}</b><span>{t("Team A moves to the top", "टीम A टॉप पर")}</span></div>
          <span className="tm">5d</span>
        </div>
        <div className="s-grow" />
      </div>
      <TabBar on={4} />
    </div>
  );
}

/* ---------------------------- slider ----------------------------- */

export function AppScreensSlider() {
  const { t } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const programmatic = useRef(false);

  const SCREENS: Array<{ el: React.ReactNode; kEn: string; kHi: string; dEn: string; dHi: string }> = [
    { el: <ScreenHome t={t} />, kEn: "Home", kHi: "होम", dEn: "Everything BCPL on one home screen", dHi: "पूरा BCPL एक होम स्क्रीन पर" },
    { el: <ScreenLive t={t} />, kEn: "Live Scoring", kHi: "लाइव स्कोरिंग", dEn: "Ball-by-ball scores, live", dHi: "बॉल-दर-बॉल स्कोर, लाइव" },
    { el: <ScreenCard t={t} />, kEn: "Player Card", kHi: "प्लेयर कार्ड", dEn: "Your shareable BCPL player card", dHi: "आपका शेयर-योग्य BCPL प्लेयर कार्ड" },
    { el: <ScreenJourney t={t} />, kEn: "My Journey", kHi: "मेरी यात्रा", dEn: "Track your journey step by step", dHi: "अपनी यात्रा कदम-दर-कदम देखें" },
    { el: <ScreenPass t={t} />, kEn: "Trial Pass", kHi: "ट्रायल पास", dEn: "Your digital trial pass, always ready", dHi: "आपका डिजिटल ट्रायल पास, हमेशा तैयार" },
    { el: <ScreenMatches t={t} />, kEn: "Matches", kHi: "मैच", dEn: "Fixtures and countdowns", dHi: "फिक्स्चर और काउंटडाउन" },
    { el: <ScreenPoints t={t} />, kEn: "Points Table", kHi: "पॉइंट्स टेबल", dEn: "Standings, W-L and NRR", dHi: "स्टैंडिंग, W-L और NRR" },
    { el: <ScreenMVP t={t} />, kEn: "MVP & Voting", kHi: "MVP और वोटिंग", dEn: "Leaderboard and fan voting", dHi: "लीडरबोर्ड और फैन वोटिंग" },
    { el: <ScreenAuction t={t} />, kEn: "Auction", kHi: "ऑक्शन", dEn: "Live auction bids and contracts", dHi: "लाइव ऑक्शन बोली और कॉन्ट्रैक्ट" },
    { el: <ScreenNotifs t={t} />, kEn: "Updates", kHi: "अपडेट", dEn: "Trial, result and match alerts", dHi: "ट्रायल, रिज़ल्ट और मैच अलर्ट" },
  ];
  const N = SCREENS.length;

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = ((i % N) + N) % N;
    const slide = track.children[clamped] as HTMLElement | undefined;
    if (!slide) return;
    programmatic.current = true;
    track.scrollTo({ left: slide.offsetLeft - (track.offsetWidth - slide.offsetWidth) / 2, behavior: "smooth" });
    setIdx(clamped);
    window.setTimeout(() => { programmatic.current = false; }, 500);
  }, [N]);

  // keep idx in sync when the user swipes/scrolls manually
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      if (programmatic.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = track.scrollLeft + track.offsetWidth / 2;
        let best = 0, bestD = Infinity;
        for (let i = 0; i < track.children.length; i++) {
          const c = track.children[i] as HTMLElement;
          const cc = c.offsetLeft + c.offsetWidth / 2;
          const d = Math.abs(cc - center);
          if (d < bestD) { bestD = d; best = i; }
        }
        setIdx(best);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => { track.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  // auto-advance (~4s), paused on hover
  useEffect(() => {
    if (hover) return;
    const id = window.setInterval(() => goTo(idx + 1), 4000);
    return () => window.clearInterval(id);
  }, [idx, hover, goTo]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(idx - 1); }
  };

  const cur = SCREENS[idx];

  return (
    <div
      className="aps"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <style>{CSS}</style>
      <div
        className="aps-vp"
        role="region"
        aria-roledescription="carousel"
        aria-label={t("BCPL app screens", "BCPL app स्क्रीन")}
        tabIndex={0}
        onKeyDown={onKey}
      >
        <div className="aps-track" ref={trackRef}>
          {SCREENS.map((s, i) => (
            <div
              className="aps-slide"
              key={s.kEn}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${N} — ${t(s.kEn, s.kHi)}`}
              aria-hidden={i !== idx}
            >
              <div className="aps-phone">{s.el}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="aps-ctrls">
        <button type="button" className="aps-arrow" aria-label={t("Previous screen", "पिछली स्क्रीन")} onClick={() => goTo(idx - 1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="aps-dots" role="tablist" aria-label={t("Choose app screen", "स्क्रीन चुनें")}>
          {SCREENS.map((s, i) => (
            <button
              key={s.kEn}
              type="button"
              className={"aps-dot" + (i === idx ? " on" : "")}
              role="tab"
              aria-selected={i === idx}
              aria-label={t(s.kEn, s.kHi)}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <button type="button" className="aps-arrow" aria-label={t("Next screen", "अगली स्क्रीन")} onClick={() => goTo(idx + 1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>

      <div className="aps-cap" aria-live="polite">
        <div className="k">{t(cur.kEn, cur.kHi)}</div>
        <div className="d">{t(cur.dEn, cur.dHi)}</div>
      </div>
    </div>
  );
}
