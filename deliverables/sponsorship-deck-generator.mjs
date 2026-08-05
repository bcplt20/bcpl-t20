import { writeFileSync } from "fs";

/* BCPL Season 4 Sponsorship Deck — v2 (Aug 2026)
   Landscape A4, IPL-style, photo-rich & colorful. 24 pages.
   Owner asked for: more color, charts (bar/"manhattan" style), real images
   (Ganguly, SonyLIV & FanCode logos, jerseys, stadium, auction), bigger fonts,
   a new "Official Drinking Partner" tier, and full requirements detail.
   Facts: 2.5 Lakh+ corporate registrations, 2 Lakh+ Instagram, ~3 Lakh social,
   50M+ reach (#), ambassadors Sourav Ganguly & Zaheer Khan, streaming SonyLIV
   & FanCode (#). All projections carry the # marker. Copy compliance: no
   superlatives / absolute promises / restricted words. English only (PDF
   renderer has no Devanagari). */

const A = "file:///home/runner/workspace/artifacts/bcpl-website/public/bcpl-assets";
const D = "file:///home/runner/workspace/attached_assets/deck";
const LOGO = `${A}/bcpl-logo-white.png`;
const LOGO_DARKTXT = `${A}/bcpl-logo-transparent.png`;

const TEAMS = ["ahmedabad_lions","bengaluru_rockets","chennai_thalaivas","delhi_suryas","hyderabad_hawks","kolkata_tigers","lucknow_nawabs","mumbai_mavericks","punjab_warriors","rajasthan_scorchers"];
const teamStrip = (h=44) => `<div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap;align-items:center">${TEAMS.map(t=>`<img src="${A}/logos/${t}.png" style="height:${h}px">`).join("")}</div>`;

const foot = (n) => `<div class="foot"><span>BCPL Season 4 Sponsorship Deck · Aug 2026 · v2</span><span>BCPL Sports Private Limited · Confidential · # figures are projections/estimates, not guarantees</span><span class="pgno">${n}</span></div>`;

const HASH = `<p class="hashnote"><b>#</b> Estimate / projection based on the League's own data and assumptions — not a guarantee of any specific reach, viewership or outcome.</p>`;

/* CSS bar chart: items = [{label, value, display, color?, hash?}] */
function bars(items, { max = null, height = 150 } = {}) {
  const m = max ?? Math.max(...items.map(i => i.value));
  return `<div class="chart" style="height:${height}px">${items.map(i => `
    <div class="bar-col">
      <div class="bar-val">${i.display}${i.hash ? '<span class="hash">#</span>' : ''}</div>
      <div class="bar" style="height:${Math.max(6, Math.round((i.value / m) * (height - 46)))}px;background:${i.color ?? 'linear-gradient(180deg,#FFB25E,#FF6B00)'}"></div>
      <div class="bar-lbl">${i.label}</div>
    </div>`).join("")}</div>`;
}

const css = `
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4 landscape;margin:0}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1f2e;font-size:14.5px;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{page-break-after:always;position:relative;overflow:hidden;width:297mm;height:209mm;background:#FDFBF7}
.page:last-child{page-break-after:auto}
.inner{padding:26px 46px 14px;position:relative;z-index:2;height:100%;display:flex;flex-direction:column}
.inner .body{flex:1;position:relative}
h1{font-size:40px;line-height:1.15}
h2{font-size:28px;color:#0D1E44;margin-bottom:6px}
.dark h2,.photo h2{color:#fff}
h2 .kick{display:block;font-size:12.5px;letter-spacing:.28em;color:#FF6B00;font-weight:800;margin-bottom:4px}
.dark h2 .kick,.photo h2 .kick{color:#E8B23D}
h3{font-size:13px;color:#C94E0E;margin:8px 0 5px;text-transform:uppercase;letter-spacing:.08em}
.dark h3{color:#E8B23D}
p{margin-bottom:7px}
.dark{background:linear-gradient(150deg,#060F25,#0D1E44 55%,#15346B);color:#fff}
.dark p{color:rgba(255,255,255,0.9)}
.photo{color:#fff}
.photo .bgimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
.photo .shade{position:absolute;inset:0;background:linear-gradient(100deg,rgba(5,13,32,0.94) 0%,rgba(8,20,48,0.82) 45%,rgba(10,25,60,0.45) 100%);z-index:1}
.photo p{color:rgba(255,255,255,0.92)}
.gold{color:#E8B23D}
.orange{color:#FF6B00}
.band{height:7px;background:linear-gradient(90deg,#9A3408,#FF6B00,#E8B23D,#FF6B00,#9A3408)}
table{width:100%;border-collapse:collapse;margin:6px 0 8px;font-size:12.5px;position:relative;z-index:1}
th{background:linear-gradient(120deg,#0D1E44,#15346B);color:#fff;padding:7px 10px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
td{padding:7px 10px;border-bottom:1px solid #E7E2D8;vertical-align:top;background:#fff}
tr:nth-child(even) td{background:#FAF6EF}
tr.hl td{background:#FFF1DE;border-top:2px solid #FF6B00;border-bottom:2px solid #FF6B00}
.dim{color:#8a8f9c;font-size:12px}
.card{border:1.5px solid #EBDFC9;border-radius:14px;padding:12px 16px;margin-bottom:10px;background:#fff;font-size:13.2px;line-height:1.55;box-shadow:0 2px 6px rgba(13,30,68,0.05)}
.card b.t{color:#0D1E44;display:block;margin-bottom:4px;font-size:15.5px}
.card.acc{border-top:5px solid #FF6B00}
.card.accg{border-top:5px solid #E8B23D}
.card.accb{border-top:5px solid #15346B}
.dark .card,.photo .card{background:rgba(10,22,50,0.72);border-color:rgba(232,178,61,0.45);color:rgba(255,255,255,0.92)}
.dark .card b.t,.photo .card b.t{color:#E8B23D}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.grid4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px}
.note{background:#FFF4E6;border-left:6px solid #FF6B00;padding:9px 14px;border-radius:0 12px 12px 0;margin:8px 0;font-size:12.8px;line-height:1.55}
.dark .note,.photo .note{background:rgba(255,107,0,0.14);color:#fff}
.statrow{display:flex;gap:16px;margin:16px 0}
.stat{flex:1;background:linear-gradient(160deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04));border:1.5px solid rgba(232,178,61,0.5);border-radius:16px;padding:20px 12px;text-align:center}
.stat .n{font-size:32px;font-weight:900;color:#E8B23D}
.stat .l{font-size:12px;color:rgba(255,255,255,0.75);margin-top:5px;letter-spacing:.05em;text-transform:uppercase}
.statlight{flex:1;background:#fff;border:1.5px solid #EBDFC9;border-radius:16px;padding:18px 12px;text-align:center;box-shadow:0 2px 6px rgba(13,30,68,0.06)}
.statlight .n{font-size:29px;font-weight:900;color:#C94E0E}
.statlight .l{font-size:11.5px;color:#666;margin-top:5px;letter-spacing:.05em;text-transform:uppercase}
.foot{margin-top:8px;border-top:3px solid #FF6B00;padding-top:7px;font-size:10px;color:#777;display:flex;justify-content:space-between;position:relative;z-index:2;gap:20px}
.dark .foot,.photo .foot{color:rgba(255,255,255,0.6);border-top-color:#E8B23D}
.pgno{font-weight:800}
.tick{color:#0B7A3B;font-weight:800}
.cross{color:#B3261E;font-weight:800}
.price{font-size:21px;font-weight:900;color:#C94E0E;white-space:nowrap}
.tag{background:#FF6B00;color:#fff;font-size:10px;font-weight:800;border-radius:5px;padding:2px 9px;letter-spacing:.05em}
.tag.g{background:#E8B23D;color:#0D1E44}
.hash{color:#B3261E;font-weight:900}
.hashnote{font-size:10.2px;color:#B3261E;margin:3px 0 4px;line-height:1.45}
.chart{display:flex;align-items:flex-end;gap:26px;justify-content:center;padding:4px 10px 0}
.bar-col{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
.bar{width:64px;border-radius:8px 8px 0 0;box-shadow:inset 0 -4px 10px rgba(0,0,0,0.12)}
.bar-val{font-size:14px;font-weight:900;color:#0D1E44;margin-bottom:4px;white-space:nowrap}
.dark .bar-val{color:#fff}
.bar-lbl{font-size:11px;font-weight:700;color:#66708a;margin-top:6px;text-align:center;max-width:110px;line-height:1.3}
.dark .bar-lbl{color:rgba(255,255,255,0.75)}
.imgcard{border-radius:16px;overflow:hidden;box-shadow:0 6px 18px rgba(13,30,68,0.25);position:relative}
.imgcard img{width:100%;height:100%;object-fit:cover;display:block}
.imgcap{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(transparent,rgba(5,13,32,0.9));color:#fff;padding:26px 14px 10px;font-size:12px;font-weight:700}
.ott{background:#fff;border-radius:16px;padding:18px 24px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(13,30,68,0.15)}
.bignum{font-size:52px;font-weight:900;color:#FF6B00;line-height:1}
.steps{display:flex;gap:0;align-items:stretch;margin:10px 0}
.step{flex:1;position:relative;background:#fff;border:1.5px solid #EBDFC9;border-radius:14px;padding:12px 14px 12px 18px;margin-right:26px;font-size:12.6px;box-shadow:0 2px 6px rgba(13,30,68,0.05)}
.step:last-child{margin-right:0}
.step .no{position:absolute;top:-13px;left:12px;background:#FF6B00;color:#fff;font-weight:900;font-size:13px;border-radius:20px;padding:3px 12px}
.step b{display:block;color:#0D1E44;margin-bottom:3px;font-size:13.5px}
.tocline{display:flex;align-items:baseline;gap:12px;font-size:16.5px;padding:7px 0;border-bottom:1px dashed #D9CFBB}
.tocline .n{font-weight:900;color:#FF6B00;width:34px;font-size:15px}
.tocline .pg{margin-left:auto;color:#8a8f9c;font-size:13px;font-weight:700}
/* "animated" energy look — glowing ball + speed streaks (static, print-safe) */
.deco{position:absolute;z-index:0;pointer-events:none}
.ballwrap{position:absolute;z-index:0}
.ballglow{position:absolute;inset:-46%;border-radius:50%;background:radial-gradient(circle,rgba(255,107,0,0.45) 0%,rgba(232,178,61,0.22) 40%,transparent 70%)}
.ballimg{position:relative;width:100%;transform:rotate(-18deg);filter:drop-shadow(0 10px 26px rgba(255,107,0,0.5))}
.trail{position:absolute;height:9px;border-radius:9px;background:linear-gradient(90deg,transparent,rgba(255,107,0,0.75));z-index:0}
.trail.g{background:linear-gradient(90deg,transparent,rgba(232,178,61,0.7))}
.trail.b{background:linear-gradient(90deg,transparent,rgba(21,52,107,0.45))}
.streak{position:absolute;width:150%;height:120px;transform:rotate(-7deg);background:linear-gradient(90deg,transparent,rgba(255,107,0,0.10),rgba(232,178,61,0.14),transparent);z-index:0}
.dark .streak,.photo .streak{background:linear-gradient(90deg,transparent,rgba(255,107,0,0.16),rgba(232,178,61,0.18),transparent)}
.ringlogo{position:absolute;z-index:0;border-radius:50%;border:2.5px dashed rgba(255,107,0,0.30)}
`;

/* Glowing "in-motion" BCPL ball with speed trails. side: 'right'|'left' */
const BALL = `${A}/bcpl-ball-transparent.png`;
function ballDeco({ size = 190, top = null, bottom = "6%", right = "3%", left = null, opacity = 1 } = {}) {
  const pos = `${top !== null ? `top:${top};` : `bottom:${bottom};`}${left !== null ? `left:${left};` : `right:${right};`}`;
  return `<div class="ballwrap" style="width:${size}px;height:${size}px;${pos}opacity:${opacity}">
    <div class="ballglow"></div>
    <div class="trail" style="width:${size * 1.5}px;right:${size * 0.75}px;top:34%"></div>
    <div class="trail g" style="width:${size * 1.1}px;right:${size * 0.8}px;top:50%"></div>
    <div class="trail b" style="width:${size * 0.8}px;right:${size * 0.7}px;top:66%"></div>
    <img class="ballimg" src="${BALL}">
  </div>`;
}
const streak = (top = "30%") => `<div class="streak" style="top:${top};left:-20%"></div>`;
const rings = (size, top, right) => `<div class="ringlogo" style="width:${size}px;height:${size}px;top:${top};right:${right}"></div><div class="ringlogo" style="width:${size*0.7}px;height:${size*0.7}px;top:calc(${top} + ${size*0.15}px);right:calc(${right} + ${size*0.15}px);border-color:rgba(232,178,61,0.35)"></div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>

<!-- P1 · COVER (stadium photo) -->
<div class="page photo">
  <img class="bgimg" src="${A}/stadium-hero.jpg"><div class="shade"></div>
  <div class="inner">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <img src="${LOGO}" style="height:76px">
      <div style="text-align:right;font-size:12.5px;letter-spacing:.25em;color:#E8B23D;font-weight:800">BCPL SPORTS PRIVATE LIMITED</div>
    </div>
    <div class="body" style="display:flex;flex-direction:column;justify-content:center">
      <div style="font-size:14px;letter-spacing:.35em;color:#E8B23D;font-weight:800;margin-bottom:10px">SEASON 4 · OCTOBER 2026</div>
      <h1>Bhartiya Corporate<br>Premier League</h1>
      <div style="font-size:26px;font-weight:900;color:#FF9A4D;margin-top:6px">Partnership &amp; Sponsorship Deck</div>
      <p style="max-width:700px;margin-top:14px;font-size:16.5px">India's T20 cricket league for working professionals — real grounds, a live player auction, franchise teams, and a young corporate audience that plays the game, not just watches it.</p>
      <div class="statrow" style="max-width:900px">
        <div class="stat"><div class="n">2.5 Lakh+</div><div class="l">Corporate registrations</div></div>
        <div class="stat"><div class="n">3 Lakh</div><div class="l">Social followers</div></div>
        <div class="stat"><div class="n">50 M+ <span style="font-size:16px" class="hash">#</span></div><div class="l">Social reach</div></div>
        <div class="stat"><div class="n">10</div><div class="l">Franchise teams</div></div>
      </div>
      <p style="font-size:15px;margin-top:4px">Brand Ambassadors: <b class="gold">Sourav Ganguly &amp; Zaheer Khan</b> &nbsp;·&nbsp; Streaming: <b class="gold">SonyLIV &amp; FanCode</b> <span class="hash">#</span></p>
    </div>
    ${foot("1")}
  </div>
</div>

<!-- P2 · CONTENTS -->
<div class="page"><div class="band"></div>${streak("60%")}${ballDeco({ size: 150, bottom: "5%", right: "3%" })}<div class="inner">
  <h2><span class="kick">SEASON 4 · SPONSORSHIP DECK</span>What's Inside</h2>
  <div class="body"><div class="grid2" style="margin-top:10px;column-gap:50px">
    <div>
      <div class="tocline"><span class="n">01</span> The League — what BCPL is <span class="pg">3–5</span></div>
      <div class="tocline"><span class="n">02</span> The season journey &amp; the show <span class="pg">6–7</span></div>
      <div class="tocline"><span class="n">03</span> The audience your brand meets <span class="pg">8–9</span></div>
      <div class="tocline"><span class="n">04</span> Digital footprint — the numbers <span class="pg">10</span></div>
      <div class="tocline"><span class="n">05</span> Broadcast — SonyLIV &amp; FanCode <span class="pg">11</span></div>
      <div class="tocline"><span class="n">06</span> The faces — Ganguly &amp; Zaheer <span class="pg">12–13</span></div>
    </div>
    <div>
      <div class="tocline"><span class="n">07</span> Sponsorship menu &amp; pricing <span class="pg">14–15</span></div>
      <div class="tocline"><span class="n">08</span> Every tier in detail <span class="pg">16–20</span></div>
      <div class="tocline"><span class="n">09</span> Deliverables matrix <span class="pg">21</span></div>
      <div class="tocline"><span class="n">10</span> Included · not included · what we need from you <span class="pg">22–23</span></div>
      <div class="tocline"><span class="n">11</span> Next steps &amp; contact <span class="pg">24</span></div>
    </div>
  </div>
  <div style="margin-top:26px">${teamStrip(58)}</div>
  <p class="dim" style="text-align:center;margin-top:10px">The 10 franchise teams of BCPL Season 4</p>
  </div>
  ${foot("2")}
</div></div>

<!-- P3 · WHAT IS BCPL -->
<div class="page"><div class="band"></div>${rings(220, "-60px", "-70px")}${ballDeco({ size: 130, top: "4%", right: "3.5%" })}<div class="inner">
  <h2><span class="kick">01 · THE LEAGUE</span>What is BCPL?</h2>
  <div class="body">
  <p style="font-size:15.5px;max-width:920px">The <b>Bhartiya Corporate Premier League</b> is a structured T20 franchise league for India's working professionals. Players register online, clear KYC and physical trials, enter a <b>live player auction</b>, and play a full tournament — live digital scoring, professional umpires, match-day production, points table — run centrally by the League.</p>
  <div class="grid3" style="margin-top:12px">
    <div class="card acc"><b class="t">A league, not a one-day event</b>Group stage → knockouts → final. 10 franchise teams, a player auction with a defined purse — the complete franchise-league format, season after season.</div>
    <div class="card accg"><b class="t">Season 4 — the biggest yet</b>Three seasons completed. Season 4 opens October 2026 with <b>2.5 Lakh+ registrations</b> already recorded on the League's own platform.</div>
    <div class="card accb"><b class="t">Corporate + cricket audience</b>Every registered player is a working professional — a high-value, hard-to-reach audience for consumer and B2B brands alike.</div>
    <div class="card accb"><b class="t">Own digital platform</b>Registrations, payments, live scores and points tables run on <b>bcplt20.com</b> — sponsor logos live where the audience already is.</div>
    <div class="card acc"><b class="t">Credible faces</b>Brand ambassadors <b>Sourav Ganguly</b> and <b>Zaheer Khan</b> front the League's campaigns and content.</div>
    <div class="card accg"><b class="t">Broadcast-ready</b>Season 4 matches are planned on <b>SonyLIV</b> and <b>FanCode</b> <span class="hash">#</span> — with ad inventory available to League sponsors.</div>
  </div>
  ${HASH}
  </div>
  ${foot("3")}
</div></div>

<!-- P4 · PHOTO SPREAD: THE SHOW -->
<div class="page dark"><div class="inner">
  <h2><span class="kick">01 · THE LEAGUE</span>This Is What the League Looks Like</h2>
  <div class="body" style="display:grid;grid-template-columns:1.25fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:14px;margin-top:8px">
    <div class="imgcard" style="grid-row:span 2"><img src="${A}/auction-hero.webp"><div class="imgcap">The Season 4 player auction — franchises bidding live for corporate cricketers</div></div>
    <div class="imgcard"><img src="${A}/event-stage-trophy.webp"><div class="imgcap">Trophy &amp; stage production</div></div>
    <div class="imgcard"><img src="${A}/event-teams-a.webp"><div class="imgcap">Franchise squads on stage</div></div>
    <div class="imgcard"><img src="${A}/jerseys.webp"><div class="imgcap">Professional-grade team kits</div></div>
    <div class="imgcard"><img src="${A}/event-panel.webp"><div class="imgcap">League leadership &amp; media panels</div></div>
  </div>
  ${foot("4")}
</div></div>

<!-- P5 · LEAGUE IN NUMBERS (chart) -->
<div class="page"><div class="band"></div>${streak("55%")}${ballDeco({ size: 120, bottom: "5%", right: "2.5%", opacity: 0.9 })}<div class="inner">
  <h2><span class="kick">01 · THE LEAGUE</span>The League in Numbers</h2>
  <div class="body">
  <div class="statrow">
    <div class="statlight"><div class="n">2.5 Lakh+</div><div class="l">Registered players</div></div>
    <div class="statlight"><div class="n">10</div><div class="l">Franchise teams</div></div>
    <div class="statlight"><div class="n">3</div><div class="l">Seasons completed</div></div>
    <div class="statlight"><div class="n">2</div><div class="l">Legendary ambassadors</div></div>
    <div class="statlight"><div class="n">2</div><div class="l">OTT platforms planned <span class="hash">#</span></div></div>
  </div>
  <div class="grid2" style="align-items:end">
    <div>
      <h3>Community &amp; following — where the audience sits</h3>
      ${bars([
        { label: "Registered players", value: 250, display: "2.5 L+" },
        { label: "Instagram followers", value: 200, display: "2 L+", color: "linear-gradient(180deg,#F7D488,#E8B23D)" },
        { label: "Other social platforms", value: 100, display: "~1 L", color: "linear-gradient(180deg,#7FA3E8,#15346B)" },
      ], { height: 190 })}
    </div>
    <div>
      <h3>Season 4 scale vs earlier seasons <span class="hash">#</span></h3>
      ${bars([
        { label: "Season 2", value: 35, display: "Growing" },
        { label: "Season 3", value: 60, display: "Bigger", color: "linear-gradient(180deg,#F7D488,#E8B23D)" },
        { label: "Season 4 (Oct 2026)", value: 100, display: "2.5 L+ regs", hash: true },
      ], { height: 190 })}
      <p class="dim" style="margin-top:4px">Registrations have grown season on season; Season 4 is the League's largest intake so far. <span class="hash">#</span></p>
    </div>
  </div>
  ${HASH}
  </div>
  ${foot("5")}
</div></div>

<!-- P6 · SEASON JOURNEY -->
<div class="page"><div class="band"></div>${streak("40%")}${ballDeco({ size: 150, top: "5%", right: "3%" })}<div class="inner">
  <h2><span class="kick">02 · THE SEASON</span>How a BCPL Season Runs</h2>
  <div class="body">
  <p style="font-size:15px">Sponsors don't get one match-day — they ride a <b>multi-month story</b> the audience follows stage by stage:</p>
  <div class="steps" style="margin-top:22px">
    <div class="step"><span class="no">1</span><b>Registrations</b>Lakhs of professionals register &amp; pay online — months of high-traffic League pages and social pushes.</div>
    <div class="step"><span class="no">2</span><b>Trials &amp; selection</b>Video submissions and physical trials across cities — content that runs for weeks.</div>
    <div class="step"><span class="no">3</span><b>Player auction</b>The season's marquee media event — franchises bid live; press &amp; reels peak here.</div>
    <div class="step"><span class="no">4</span><b>League matches</b>Group stage across venues — live scoring, reels, points-table drama every match day.</div>
    <div class="step"><span class="no">5</span><b>Playoffs &amp; final</b>Knockouts, the trophy night, awards — the biggest audience moments of the season.</div>
  </div>
  <h3 style="margin-top:22px">Why this matters to a sponsor</h3>
  <div class="grid3">
    <div class="card acc"><b class="t">Months of exposure, one ticket</b>Your brand rides every stage — registration banners to finale backdrops — not a single weekend.</div>
    <div class="card accg"><b class="t">Multiple content peaks</b>Auction day, opening match, playoffs, finale — repeated spikes of attention across the season. </div>
    <div class="card accb"><b class="t">Owned + earned media</b>League platform and social, plus press coverage (IANS, PTI, Tribune, News18 and more have covered BCPL).</div>
  </div>
  </div>
  ${foot("6")}
</div></div>

<!-- P7 · AUCTION PHOTO PAGE -->
<div class="page photo">
  <img class="bgimg" src="${A}/event-stage-trophy.webp"><div class="shade"></div>
  <div class="inner">
    <h2><span class="kick">02 · THE SEASON</span>Produced Like the Big Leagues</h2>
    <div class="body" style="display:flex;flex-direction:column;justify-content:flex-end">
      <div class="grid3">
        <div class="card"><b class="t">Stage &amp; broadcast production</b>Professional staging, anchors, live streams and highlight edits — sponsor branding sits inside a premium-looking show.</div>
        <div class="card"><b class="t">National press attention</b>League milestones have been covered by IANS, PTI, Tribune India, News18, Hindustan Times, India Today and more.</div>
        <div class="card"><b class="t">Trophy moments</b>Presentation ceremonies, awards and the trophy night — the photographs that get shared carry your logo on the backdrop.</div>
      </div>
    </div>
    ${foot("7")}
  </div>
</div>

<!-- P8 · AUDIENCE -->
<div class="page"><div class="band"></div>${rings(200, "-55px", "-60px")}${ballDeco({ size: 115, top: "4.5%", right: "3.5%" })}<div class="inner">
  <h2><span class="kick">03 · THE AUDIENCE</span>The Audience Your Brand Meets</h2>
  <div class="body">
  <div class="statrow">
    <div class="statlight"><div class="n">2.5 Lakh+</div><div class="l">Registered — all corporate</div></div>
    <div class="statlight"><div class="n">25–40</div><div class="l">Core age band</div></div>
    <div class="statlight"><div class="n">Pan-India</div><div class="l">Major cities covered</div></div>
    <div class="statlight"><div class="n">100%</div><div class="l">Registered &amp; paid online</div></div>
  </div>
  <div class="grid2" style="align-items:end">
    <div>
      <h3>Indicative audience profile <span class="hash">#</span></h3>
      ${bars([
        { label: "Age 25–34", value: 55, display: "~55%", hash: true },
        { label: "Age 35–44", value: 30, display: "~30%", hash: true, color: "linear-gradient(180deg,#F7D488,#E8B23D)" },
        { label: "Other", value: 15, display: "~15%", hash: true, color: "linear-gradient(180deg,#7FA3E8,#15346B)" },
      ], { height: 165 })}
    </div>
    <div>
      <div class="card acc"><b class="t">Earning, deciding, spending</b>Salaried professionals and business owners — the exact audience for finance, auto, tech, apparel, F&amp;B, beverages, travel and consumer-durable brands.</div>
      <div class="card accg"><b class="t">Participants, not passers-by</b>They registered, paid, submitted videos and follow their own tournament journey — engagement per follower runs far deeper than a generic sports page.</div>
    </div>
  </div>
  ${HASH}
  </div>
  ${foot("8")}
</div></div>

<!-- P9 · AUDIENCE 2 -->
<div class="page dark"><div class="inner">
  <h2><span class="kick">03 · THE AUDIENCE</span>Why This Audience Is Hard to Buy Anywhere Else</h2>
  <div class="body">
  <div class="grid2" style="margin-top:10px">
    <div class="card"><b class="t">B2B doors open too</b>Players come from companies across sectors — a League sponsorship puts your brand in front of professionals from hundreds of workplaces. Useful for HR platforms, SaaS, insurance and enterprise brands, not just consumer names.</div>
    <div class="card"><b class="t">Consent-based, compliant reach</b>Sponsor campaigns to the registered player base run through official League channels only — consent-based and within the DPDP Act, 2023. Clean data practice, no grey lists.</div>
    <div class="card"><b class="t">City-by-city presence</b>Registrations span metros and tier-2 cities — Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Lucknow, Jaipur, Ahmedabad, Chandigarh and more — matching the franchise map.</div>
    <div class="card"><b class="t">A story people share</b>"Office ka banda auction me bik gaya" is content people forward — player journeys give sponsors emotional moments most ad buys can't create.</div>
  </div>
  <div style="margin-top:16px">${teamStrip(52)}</div>
  </div>
  ${foot("9")}
</div></div>

<!-- P10 · DIGITAL FOOTPRINT -->
<div class="page"><div class="band"></div>${streak("20%")}${ballDeco({ size: 130, bottom: "6%", right: "3%", opacity: 0.9 })}<div class="inner">
  <h2><span class="kick">04 · DIGITAL</span>Digital Footprint — The Numbers</h2>
  <div class="body">
  <div class="grid2" style="align-items:end">
    <div>
      <h3>Followers &amp; reach</h3>
      ${bars([
        { label: "Instagram", value: 200, display: "2 L+" },
        { label: "All social (total)", value: 300, display: "~3 L", color: "linear-gradient(180deg,#F7D488,#E8B23D)" },
      ], { height: 175 })}
      <div class="note" style="margin-top:10px"><b>50 M+ <span class="hash">#</span> total social reach</b> across the last season cycle — auction clips, player stories and match reels travel well beyond the follower base.</div>
    </div>
    <div>
      <div class="card acc"><b class="t">Reels, match clips &amp; player stories</b>Season content — auction moments, highlights, player journeys — runs all season. Sponsors are woven into the content, not parked in a corner.</div>
      <div class="card accg"><b class="t">Ambassador-led campaigns</b>Campaign films with Sourav Ganguly and Zaheer Khan carry sponsor branding as per tier — celebrity association at League cost, not yours.</div>
      <div class="card accb"><b class="t">Always-on League platform</b>Live scoring, points table and news on bcplt20.com all season — sponsor logos sit on the pages fans refresh the most.</div>
    </div>
  </div>
  ${HASH}
  </div>
  ${foot("10")}
</div></div>

<!-- P11 · BROADCAST with OTT logos -->
<div class="page dark"><div class="inner">
  <h2><span class="kick">05 · BROADCAST</span>Streaming on SonyLIV &amp; FanCode <span class="hash" style="font-size:17px">#</span></h2>
  <div class="body">
  <div style="display:flex;gap:26px;align-items:center;justify-content:center;margin:18px 0 20px">
    <div class="ott" style="width:290px;height:120px"><img src="${D}/sonyliv.png" style="max-height:86px;max-width:240px"></div>
    <div style="font-size:22px;font-weight:900;color:#E8B23D">+</div>
    <div class="ott" style="width:290px;height:120px"><img src="${D}/fancode.png" style="max-height:96px;max-width:240px"></div>
  </div>
  <p style="text-align:center;font-size:15.5px;max-width:900px;margin:0 auto 14px">Season 4 matches are planned for streaming on <b>SonyLIV</b> and <b>FanCode</b> — putting BCPL in front of a national OTT sports audience beyond its own channels.</p>
  <div class="grid4">
    <div class="card"><b class="t">Ad slots on stream</b>League sponsors receive ad slots in match streams as per tier — your brand plays inside the cricket.</div>
    <div class="card"><b class="t">On-screen presence</b>Title &amp; Powered-By partners integrated into broadcast graphics — score bugs, replays, timeout stings.</div>
    <div class="card"><b class="t">Commentary mentions</b>Tiered verbal integrations — title naming in score read-outs, sponsored segments, review mentions.</div>
    <div class="card"><b class="t">Clips carry you further</b>Broadcast branding travels into highlights and social clips after every match — one placement, many surfaces.</div>
  </div>
  <div class="note"><b>Straight talk:</b> streaming plans, ad-slot counts and viewership depend on final platform agreements for Season 4 and are marked <span class="hash">#</span>. Exact broadcast deliverables are listed in the sponsorship agreement before signing — no verbal promises.</div>
  </div>
  ${foot("11")}
</div></div>

<!-- P12 · GANGULY PHOTO PAGE -->
<div class="page photo">
  <img class="bgimg" src="${A}/ambassador-a.webp" style="object-position:center 12%"><div class="shade" style="background:linear-gradient(90deg,rgba(5,13,32,0.95) 0%,rgba(8,20,48,0.85) 42%,rgba(10,25,60,0.25) 100%)"></div>
  <div class="inner">
    <h2><span class="kick">06 · THE FACES</span>Sourav Ganguly<br><span style="font-size:16px;font-weight:700;color:#E8B23D">Brand Ambassador, BCPL</span></h2>
    <div class="body" style="display:flex;flex-direction:column;justify-content:center;max-width:520px">
      <div class="card"><b class="t">Why it matters to you</b>Former India captain and one of Indian cricket's most trusted leadership voices. Dada fronts BCPL's campaign films, launch content and key season moments — your brand appears in campaigns a standalone brand film could not buy at this cost.</div>
      <div class="card"><b class="t">In his words to the press</b>"BCPL will create new pathways for corporate cricketing talent" — coverage carried by IANS, PTI, Tribune India, News18 and more at the Season 4 auction.</div>
    </div>
    ${foot("12")}
  </div>
</div>

<!-- P13 · ZAHEER + AMBASSADOR VALUE -->
<div class="page photo">
  <img class="bgimg" src="${A}/ambassador-b.webp" style="object-position:center 15%"><div class="shade" style="background:linear-gradient(270deg,rgba(5,13,32,0.95) 0%,rgba(8,20,48,0.85) 42%,rgba(10,25,60,0.25) 100%)"></div>
  <div class="inner">
    <div style="display:flex;justify-content:flex-end"><h2 style="text-align:right"><span class="kick">06 · THE FACES</span>Zaheer Khan<br><span style="font-size:16px;font-weight:700;color:#E8B23D">Brand Ambassador, BCPL</span></h2></div>
    <div class="body" style="display:flex;flex-direction:column;justify-content:center;align-items:flex-end">
      <div style="max-width:520px">
        <div class="card"><b class="t">India's premier fast-bowling great</b>Zaheer fronts player-facing content — trials, auction and tournament-phase campaigns — through the season.</div>
        <div class="card"><b class="t">What sponsors get</b>Season-long ambassador association across launch, auction, matches and finale. Title &amp; Powered-By tiers receive sponsor integration in ambassador campaign content, as written in the agreement.</div>
        <div class="card" style="font-size:11.5px"><b class="t" style="font-size:13px">One honest line</b>Personal appearances by ambassadors at sponsor events are not included in any tier by default — such requests are separate commercial discussions with the League.</div>
      </div>
    </div>
    ${foot("13")}
  </div>
</div>

<!-- P14 · SPONSORSHIP MENU -->
<div class="page"><div class="band"></div>${ballDeco({ size: 110, top: "3.5%", right: "3%" })}<div class="inner">
  <h2><span class="kick">07 · THE MENU</span>Season 4 Sponsorship Opportunities</h2>
  <p style="font-size:13px;max-width:900px">All amounts are <b>per season, indicative and negotiable</b>, exclusive of GST. Final pricing depends on category exclusivity, deliverable mix and timing of commitment.</p>
  <div class="body">
  <table>
    <tr><th>Property</th><th>Slots</th><th>Headline rights</th><th>Indicative range</th></tr>
    <tr class="hl"><td><b>Title Sponsor</b> <span class="tag">FLAGSHIP</span></td><td>1 (exclusive)</td><td>League naming — "<b>&lt;Your Brand&gt; BCPL T20</b>" everywhere: logo lock-up, broadcast graphics, trophy, all League branding</td><td class="price">₹1.5 – 2 Cr</td></tr>
    <tr><td><b>Powered By / Co-Presenting</b></td><td>2</td><td>"Powered by &lt;Brand&gt;" on broadcast &amp; ground; second-tier logo on all League creatives</td><td class="price">₹50 – 75 L</td></tr>
    <tr><td><b>Official Jersey Partner</b> — all 10 teams</td><td>1</td><td>Your logo on the playing jersey of <b>all 10 franchise teams</b> — every match, every photo, every clip</td><td class="price">₹80 L – 1 Cr</td></tr>
    <tr><td><b>Associate Partner</b></td><td>3–4</td><td>"Official &lt;Category&gt; Partner", ground + digital branding</td><td class="price">₹25 – 35 L</td></tr>
    <tr><td><b>Official Drinking Partner</b> <span class="tag g">NEW</span></td><td>1</td><td>Exclusive beverage rights — pouring rights at venues, drinks-break branding, dugout coolers &amp; bottles in frame</td><td class="price">₹20 – 30 L</td></tr>
    <tr><td><b>Strategic Timeout Sponsor</b></td><td>1</td><td>Every strategic timeout branded &amp; announced as yours — broadcast sting + ground board + commentary</td><td class="price">₹15 – 25 L</td></tr>
    <tr><td><b>Official Umpire Partner</b></td><td>1</td><td>Logo on umpire uniforms all season + review-moment mentions</td><td class="price">₹10 – 15 L</td></tr>
  </table>
  <div class="note"><b>Title + Jersey bundle:</b> the Title Sponsor may also take the all-10-team jersey rights as a combined package at preferred pricing — the strongest single brand presence the League can offer. Ask for the bundle quote.</div>
  </div>
  ${foot("14")}
</div></div>

<!-- P15 · PRICE LADDER CHART -->
<div class="page"><div class="band"></div>${streak("16%")}${ballDeco({ size: 140, top: "6%", right: "3%" })}<div class="inner">
  <h2><span class="kick">07 · THE MENU</span>The Ladder at a Glance</h2>
  <div class="body">
  <h3>Indicative investment by tier (upper end of range, ₹)</h3>
  ${bars([
    { label: "Umpire", value: 15, display: "15 L", color: "linear-gradient(180deg,#B9C7E6,#5F7BB8)" },
    { label: "Timeout", value: 25, display: "25 L", color: "linear-gradient(180deg,#9FB4E0,#4666A8)" },
    { label: "Drinking Partner", value: 30, display: "30 L", color: "linear-gradient(180deg,#8DE6B8,#189C5C)" },
    { label: "Associate", value: 35, display: "35 L", color: "linear-gradient(180deg,#7FA3E8,#15346B)" },
    { label: "Powered By", value: 75, display: "75 L", color: "linear-gradient(180deg,#F7D488,#E8B23D)" },
    { label: "Jersey (all 10 teams)", value: 100, display: "1 Cr", color: "linear-gradient(180deg,#FFB25E,#FF6B00)" },
    { label: "Title", value: 200, display: "2 Cr", color: "linear-gradient(180deg,#FF9A4D,#C94E0E)" },
  ], { height: 260 })}
  <div class="grid3" style="margin-top:14px">
    <div class="card acc"><b class="t">Pick by objective</b>Awareness at scale → Title / Jersey. Category presence → Powered By / Associate. Sharp, ownable moments → Drinking Partner / Timeout / Umpire.</div>
    <div class="card accg"><b class="t">Early birds sit better</b>Commitments before September 2026 secure better inventory positions and pricing across all tiers.</div>
    <div class="card accb"><b class="t">Every rupee is written down</b>Each tier's deliverables — placements, counts, sizes, timelines — go into a signed agreement. Nothing stays verbal.</div>
  </div>
  </div>
  ${foot("15")}
</div></div>

<!-- P16 · TITLE DETAIL -->
<div class="page"><div class="band"></div>${rings(190, "-50px", "-55px")}<div class="inner">
  <h2><span class="kick">08 · TIER DETAIL</span>Title Sponsor — What You Own <span class="dim" style="font-size:14px">(1 exclusive slot · ₹1.5–2 Cr indicative)</span></h2>
  <div class="body">
  <div class="grid2">
    <div>
      <h3>Naming &amp; identity</h3>
      <div class="card acc">League renamed "<b>&lt;Your Brand&gt; BCPL T20</b>" for the season — in the logo lock-up, on the trophy, in every score graphic, press note, backdrop and certificate.</div>
      <h3>Broadcast &amp; streaming <span class="hash">#</span></h3>
      <div class="card acc">First-position ad slots on SonyLIV/FanCode streams · title integration in score bug &amp; match graphics · verbal title mentions in commentary · logo in all highlight packages.</div>
      <h3>On-ground</h3>
      <div class="card acc">Premium boundary boards at every match · presentation-ceremony backdrop · toss board · trophy handover by your leadership at the final · hospitality passes for all match days.</div>
    </div>
    <div>
      <h3>Digital &amp; content</h3>
      <div class="card accg">Logo on bcplt20.com header &amp; live-score pages all season · presence in ambassador campaign content · dedicated launch announcement · co-branded reels through the season.</div>
      <h3>Audience programs</h3>
      <div class="card accg">Consent-based co-branded communication to the registered player base via official League channels (DPDP-compliant) · first right on League activation properties (fan zones, contests).</div>
      <h3>Protection</h3>
      <div class="card accg">Full category exclusivity at Title level · right of first refusal on Season 5 title rights · all deliverables written into the agreement with a season-end delivery report.</div>
    </div>
  </div>
  ${HASH}
  </div>
  ${foot("16")}
</div></div>

<!-- P17 · JERSEY (photo) -->
<div class="page photo">
  <img class="bgimg" src="${A}/jerseys.webp"><div class="shade"></div>
  <div class="inner">
    <h2><span class="kick">08 · TIER DETAIL</span>Official Jersey Partner — All 10 Teams <span style="font-size:14px;color:rgba(255,255,255,0.7)">(1 slot · ₹80 L – 1 Cr indicative)</span></h2>
    <div class="body" style="display:flex;align-items:flex-end">
      <div class="grid2" style="width:100%">
        <div class="card"><b class="t">The most photographed real estate in cricket</b>Your logo on the chest/sleeve of every playing jersey of all 10 franchise teams — in every ball bowled, every celebration, every player photo, every reel, every broadcast frame, all season.</div>
        <div class="card"><b class="t">Beyond the ground</b>Players keep and wear their jerseys — your brand walks into offices, gyms and weekend games long after the season. Jersey-reveal content on League social carries your logo at launch.</div>
        <div class="card"><b class="t">Professional-grade kit</b>Jerseys are produced centrally to professional quality — placement, size and print consistent across all 10 teams. Placement (chest/sleeve/back) and sizes are specified in the agreement.</div>
        <div class="card"><b class="t">Bundle with Title</b>Combined Title + Jersey rights give one brand the League's name <i>and</i> every player's chest — the deepest association available. Combined quote on request.</div>
      </div>
    </div>
    ${foot("17")}
  </div>
</div>

<!-- P18 · DRINKING PARTNER (NEW) -->
<div class="page dark"><div class="inner">
  <h2><span class="kick">08 · TIER DETAIL</span>Official Drinking Partner <span class="tag g" style="font-size:12px;vertical-align:middle">NEW FOR SEASON 4</span> <span style="font-size:14px;color:rgba(255,255,255,0.65)">(1 slot · ₹20–30 L indicative)</span></h2>
  <div class="body">
  <p style="font-size:15px;max-width:1000px">Cricket runs on drinks breaks. The Official Drinking Partner owns every hydration moment of the season — on the ground, on the stream and in the frame.</p>
  <div class="grid2" style="margin-top:10px">
    <div class="card"><b class="t">Pouring &amp; visibility rights</b>Exclusive beverage pouring rights at League venues · branded coolers, bottles and sippers in both dugouts — in frame whenever the camera cuts to players.</div>
    <div class="card"><b class="t">The drinks break is yours</b>Every official drinks break announced as "&lt;Brand&gt; Hydration Break" — ground announcement + broadcast graphic <span class="hash">#</span> in every match.</div>
    <div class="card"><b class="t">Player-moment content</b>Post-wicket and boundary-side hydration shots make natural social clips — the League cuts branded "cool-down" moments into season reels.</div>
    <div class="card"><b class="t">On-ground sampling</b>Sampling/activation zone at venues on match days for spectators and players (venue rules apply) · logo on bcplt20.com partners page &amp; announcements.</div>
  </div>
  <div class="note"><b>Category note:</b> open to water, sports-drink, juice, energy-drink, tea/coffee and similar beverage brands. Alcohol brands can be accommodated only within applicable law and venue policy — surrogate/off-limit advertising is not accepted. One brand holds this slot exclusively.</div>
  ${HASH}
  </div>
  ${foot("18")}
</div></div>

<!-- P19 · POWERED BY + ASSOCIATE -->
<div class="page"><div class="band"></div>${streak("60%")}${ballDeco({ size: 110, bottom: "5%", right: "2.5%", opacity: 0.85 })}<div class="inner">
  <h2><span class="kick">08 · TIER DETAIL</span>Powered By &amp; Associate Partner</h2>
  <div class="body">
  <div class="grid2">
    <div class="card acc" style="padding:16px 20px"><b class="t" style="font-size:18px">Powered By / Co-Presenting — 2 slots · ₹50–75 L</b>
      "Powered by &lt;Brand&gt;" alongside the League name on broadcast graphics, backdrops and creatives<br>
      · Ad slots on SonyLIV/FanCode streams <span class="hash">#</span><br>
      · Boundary boards at every match<br>
      · Logo on bcplt20.com and League creatives<br>
      · Presence in select ambassador content<br>
      · Category exclusivity at this tier · hospitality passes for all match days</div>
    <div class="card accb" style="padding:16px 20px"><b class="t" style="font-size:18px">Associate Partner — 3–4 slots · ₹25–35 L</b>
      "Official &lt;Category&gt; Partner of BCPL" designation<br>
      · Ground branding at all matches<br>
      · Logo on League digital properties<br>
      · Social-media announcement &amp; season-long tags<br>
      · Ad slots on streams (limited) <span class="hash">#</span><br>
      · One consent-based campaign to the player base (DPDP-compliant)<br>
      · Category exclusivity within your slot</div>
  </div>
  <h3 style="margin-top:8px">Good fits we're actively looking for</h3>
  <div class="grid4">
    <div class="card"><b class="t" style="font-size:13.5px">Finance &amp; fintech</b>Cards, broking, insurance, lending — a salaried, investing audience.</div>
    <div class="card"><b class="t" style="font-size:13.5px">Auto &amp; mobility</b>Two-wheelers to sedans — first-car and upgrade buyers in one place.</div>
    <div class="card"><b class="t" style="font-size:13.5px">Tech &amp; SaaS</b>Devices, HR-tech, productivity — decision-makers who play here.</div>
    <div class="card"><b class="t" style="font-size:13.5px">F&amp;B, apparel, travel</b>Consumer brands that want young-professional mindshare.</div>
  </div>
  ${HASH}
  </div>
  ${foot("19")}
</div></div>

<!-- P20 · TIMEOUT + UMPIRE -->
<div class="page"><div class="band"></div>${rings(180, "-45px", "-50px")}${ballDeco({ size: 105, top: "4%", right: "3.5%" })}<div class="inner">
  <h2><span class="kick">08 · TIER DETAIL</span>Strategic Timeout &amp; Umpire Partner</h2>
  <div class="body">
  <div class="grid2">
    <div class="card acc" style="padding:16px 20px"><b class="t" style="font-size:18px">Strategic Timeout Sponsor — 1 slot · ₹15–25 L</b>
      Every strategic timeout in every match announced and branded as yours<br>
      · Broadcast sting + graphic at each timeout <span class="hash">#</span><br>
      · Ground announcement + timeout-board branding<br>
      · Social clips of key timeout moments carry your lock-up<br>
      <span class="dim">High-frequency, high-recall — multiple guaranteed brand moments every single match.</span></div>
    <div class="card accb" style="padding:16px 20px"><b class="t" style="font-size:18px">Official Umpire Partner — 1 slot · ₹10–15 L</b>
      Your logo on umpire uniforms in every match of the season<br>
      · In frame during every appeal, review and decision replay<br>
      · "Review presented by &lt;Brand&gt;" broadcast mention <span class="hash">#</span><br>
      · Partners-page logo + season announcements<br>
      <span class="dim">A clean, uncluttered placement that one brand owns alone.</span></div>
  </div>
  <div class="note"><b>Every tier receives:</b> logo on the League partners page, a season-end delivery report with photo/screenshot proof, and a signed sponsorship agreement listing each deliverable — nothing is left verbal.</div>
  ${HASH}
  </div>
  ${foot("20")}
</div></div>

<!-- P21 · MATRIX -->
<div class="page"><div class="band"></div><div class="inner">
  <h2><span class="kick">09 · AT A GLANCE</span>Deliverables Matrix</h2>
  <div class="body">
  <table style="font-size:11.4px">
    <tr><th>Deliverable</th><th>Title</th><th>Powered By</th><th>Jersey</th><th>Associate</th><th>Drinking</th><th>Timeout</th><th>Umpire</th></tr>
    <tr><td>League naming rights</td><td class="tick">✔</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
    <tr><td>Logo on all 10 team jerseys</td><td class="dim">bundle</td><td class="cross">—</td><td class="tick">✔</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
    <tr><td>Broadcast/stream ad slots <span class="hash">#</span></td><td class="tick">✔ first</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔ ltd</td><td class="tick">✔ ltd</td><td class="tick">✔ ltd</td><td class="cross">—</td></tr>
    <tr><td>Broadcast graphics integration <span class="hash">#</span></td><td class="tick">✔</td><td class="tick">✔</td><td class="cross">—</td><td class="cross">—</td><td class="tick">✔ drinks break</td><td class="tick">✔ timeout sting</td><td class="tick">✔ review</td></tr>
    <tr><td>Boundary boards (all matches)</td><td class="tick">✔ premium</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔ timeout board</td><td class="cross">—</td></tr>
    <tr><td>Dugout / on-field presence</td><td class="cross">—</td><td class="cross">—</td><td class="tick">✔ kit</td><td class="cross">—</td><td class="tick">✔ coolers &amp; bottles</td><td class="cross">—</td><td class="tick">✔ uniforms</td></tr>
    <tr><td>Venue pouring / sampling rights</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="tick">✔ exclusive</td><td class="cross">—</td><td class="cross">—</td></tr>
    <tr><td>Ceremony/backdrop &amp; trophy presence</td><td class="tick">✔ incl. trophy</td><td class="tick">✔</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
    <tr><td>bcplt20.com &amp; live-score page logo</td><td class="tick">✔ header</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔</td></tr>
    <tr><td>League social campaigns &amp; reels</td><td class="tick">✔ season</td><td class="tick">✔</td><td class="tick">✔ kit launch</td><td class="tick">✔</td><td class="tick">✔ hydration clips</td><td class="tick">✔ timeout clips</td><td class="tick">✔</td></tr>
    <tr><td>Ambassador campaign presence</td><td class="tick">✔</td><td class="tick">✔ select</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
    <tr><td>Player-base campaigns (consent, DPDP)</td><td class="tick">✔</td><td class="tick">✔</td><td class="cross">—</td><td class="tick">✔ 1</td><td class="tick">✔ 1</td><td class="cross">—</td><td class="cross">—</td></tr>
    <tr><td>Category exclusivity</td><td class="tick">✔ full</td><td class="tick">✔ tier</td><td class="tick">✔ apparel</td><td class="tick">✔ category</td><td class="tick">✔ beverage</td><td class="tick">✔ property</td><td class="tick">✔ property</td></tr>
    <tr><td>Hospitality passes</td><td class="tick">✔ all</td><td class="tick">✔ all</td><td class="tick">✔ key</td><td class="tick">✔ key</td><td class="tick">✔ key</td><td class="tick">✔ playoffs</td><td class="tick">✔ playoffs</td></tr>
  </table>
  ${HASH}
  </div>
  ${foot("21")}
</div></div>

<!-- P22 · INCLUDED / NOT INCLUDED -->
<div class="page"><div class="band"></div>${streak("48%")}${ballDeco({ size: 115, bottom: "6%", right: "2.5%", opacity: 0.85 })}<div class="inner">
  <h2><span class="kick">10 · CLARITY</span>What's Included — and What's Not</h2>
  <div class="body">
  <div class="grid2">
    <div>
      <h3 style="color:#0B7A3B">Included in every sponsorship</h3>
      <div class="card" style="border-top:5px solid #0B7A3B">
        <span class="tick">✔</span> Written agreement listing every deliverable — placements, counts, sizes, timelines.<br>
        <span class="tick">✔</span> All production &amp; placement of on-ground League branding at League cost.<br>
        <span class="tick">✔</span> Season-end delivery report with photos/screenshots of executed deliverables.<br>
        <span class="tick">✔</span> A single League point of contact through the season.<br>
        <span class="tick">✔</span> GST invoicing from BCPL Sports Private Limited.</div>
    </div>
    <div>
      <h3 style="color:#B3261E">Not included (so there are no surprises)</h3>
      <div class="card" style="border-top:5px solid #B3261E">
        <span class="cross">✘</span> No guarantee of specific viewership, reach or business outcomes — all audience figures marked <span class="hash">#</span> are estimates.<br>
        <span class="cross">✘</span> Ambassador personal appearances at sponsor events — separate discussion, not part of any tier.<br>
        <span class="cross">✘</span> Sponsor's own ad-film production — you supply finished creatives to broadcast specs.<br>
        <span class="cross">✘</span> Franchise-team-level sponsorships — teams sell their own secondary properties; this deck covers League properties only.<br>
        <span class="cross">✘</span> No equity, revenue share or investment product — this is a brand-sponsorship arrangement only.</div>
    </div>
  </div>
  <div class="note"><b>Payment terms (indicative):</b> 50% on signing · 50% before the first match. Category exclusivity activates only on signing. Early commitment (before September 2026) secures better inventory positions and pricing.</div>
  </div>
  ${foot("22")}
</div></div>

<!-- P23 · WHAT WE NEED FROM YOU -->
<div class="page"><div class="band"></div>${rings(200, "-55px", "-60px")}${ballDeco({ size: 110, top: "4%", right: "3.5%" })}<div class="inner">
  <h2><span class="kick">10 · CLARITY</span>What We Need From You — Sponsor Checklist</h2>
  <div class="body">
  <p style="font-size:14.5px">To deliver your branding cleanly and on time, this is everything the League needs from your side. Nothing more.</p>
  <div class="grid3" style="margin-top:8px">
    <div class="card acc"><b class="t">1 · Brand assets <span class="dim" style="font-size:11px">(within 7 days of signing)</span></b>Vector logo (light + dark versions) · brand colours &amp; usage guide if you have one · approved brand name text for naming rights tiers.</div>
    <div class="card acc"><b class="t">2 · Broadcast creatives <span class="hash">#</span> <span class="dim" style="font-size:11px">(2 weeks before first match)</span></b>Finished video spots to platform specs (we share the exact spec sheet) · static frames for graphics integration · one nominated approver for creative sign-offs.</div>
    <div class="card acc"><b class="t">3 · Commercials</b>Signed sponsorship agreement · first tranche (50%) at signing · GST details for invoicing · PO/vendor onboarding docs if your company requires them.</div>
    <div class="card accg"><b class="t">4 · One decision-maker</b>A single point of contact on your side who can approve artwork and placements within 48 hours — this is the #1 factor that keeps deliverables on schedule.</div>
    <div class="card accg"><b class="t">5 · Activation inputs <span class="dim" style="font-size:11px">(if your tier includes them)</span></b>Sampling stock &amp; staff for venue activations (Drinking Partner) · campaign creative for player-base communication (League sends it via official channels).</div>
    <div class="card accg"><b class="t">6 · Compliance basics</b>Your brand/category must be legally advertisable in India · claims in your creatives are your responsibility · League reserves the right to decline creatives that break law or venue policy.</div>
  </div>
  <div class="note"><b>What you do NOT need to arrange:</b> ground branding production &amp; installation, League social content creation, ambassador content production, platform coordination with SonyLIV/FanCode — all handled by the League.</div>
  </div>
  ${foot("23")}
</div></div>

<!-- P24 · NEXT STEPS + CONTACT -->
<div class="page photo">
  <img class="bgimg" src="${A}/event-teams-a.webp"><div class="shade"></div>
  <div class="inner">
    <h2><span class="kick">11 · LET'S TALK</span>Why BCPL, and What Happens Next</h2>
    <div class="body" style="display:flex;flex-direction:column;justify-content:flex-end">
      <div class="grid3">
        <div class="card"><b class="t">Big-league feel, sensible ticket</b>Franchise-league association — naming, jerseys, broadcast, ambassadors — at a fraction of what top-tier properties cost.</div>
        <div class="card"><b class="t">An audience you can't buy elsewhere</b>2.5 Lakh+ registered corporate professionals plus a ~3 Lakh social following — participants, not passers-by.</div>
        <div class="card"><b class="t">Grow with the League</b>Season 4 pricing with first-refusal rights on future seasons — early partners grow as the League grows.</div>
      </div>
      <div class="steps" style="margin-top:20px">
        <div class="step" style="background:rgba(10,22,50,0.8);border-color:rgba(232,178,61,0.45);color:rgba(255,255,255,0.92)"><span class="no">1</span><b style="color:#E8B23D">Talk to us</b>Share your category &amp; objectives — we confirm slot availability and exclusivity.</div>
        <div class="step" style="background:rgba(10,22,50,0.8);border-color:rgba(232,178,61,0.45);color:rgba(255,255,255,0.92)"><span class="no">2</span><b style="color:#E8B23D">Custom proposal</b>Tailored deliverable mix + written proposal with exact pricing in 5 working days.</div>
        <div class="step" style="background:rgba(10,22,50,0.8);border-color:rgba(232,178,61,0.45);color:rgba(255,255,255,0.92)"><span class="no">3</span><b style="color:#E8B23D">Sign &amp; go live</b>Agreement + first tranche locks your inventory. Branding goes live with the Season 4 launch wave.</div>
      </div>
      <div style="margin-top:18px;background:rgba(10,22,50,0.85);border:1.5px solid rgba(232,178,61,0.5);border-radius:16px;padding:16px 22px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:17px;font-weight:900;color:#E8B23D">Sponsorship Desk — Founder's Office</div>
          <div style="font-size:15px;margin-top:4px">Phone: <b>+91 83684 44754</b> &nbsp;·&nbsp; Email: <b>support@bcplt20.com</b> &nbsp;·&nbsp; Web: <b>www.bcplt20.com</b></div>
        </div>
        <img src="${LOGO}" style="height:56px">
      </div>
      <p style="color:rgba(255,255,255,0.55);font-size:9.8px;margin-top:10px">This deck is confidential and for the named recipient only. It is an invitation to discuss sponsorship — not an offer, contract or investment product. All figures marked # are the League's own estimates and projections; actual outcomes may differ. Final deliverables, pricing and terms are as per the signed sponsorship agreement only. GST extra as applicable. Logos of streaming platforms are shown to indicate planned distribution partners for Season 4 (#) and remain the property of their respective owners.</p>
    </div>
    ${foot("24")}
  </div>
</div>

</body></html>`;

writeFileSync("/tmp/sponsordeck.html", html);
console.log("wrote /tmp/sponsordeck.html", html.length, "bytes");
