import { writeFileSync } from "fs";

/* BCPL Season 4 Sponsorship Deck — v1 (Aug 2026)
   Landscape A4 slides, IPL-style partner deck for Season 4 (October 2026).
   Owner-supplied facts: 2.5 lakh corporate registrations, 2 lakh+ Instagram,
   ~3 lakh total social followers, 50M+ reach, brand ambassadors Sourav Ganguly
   & Zaheer Khan, broadcast on SonyLIV & FanCode with sponsor ad slots.
   Amounts are REALISTIC ranges (negotiable, +GST). All forward-looking numbers
   carry the # marker (projection, not a guarantee). Copy compliance: no
   superlatives, no absolute promises, no restricted words. */

const LOGO = "file:///home/runner/workspace/artifacts/bcpl-website/public/bcpl-assets/bcpl-logo-white.png";

const WM = `<div class="wm">BCPL · CONFIDENTIAL</div>`;
const foot = (n) => `<div class="foot"><span>BCPL Season 4 Sponsorship Deck · Aug 2026 · v1</span><span>BCPL Sports Private Limited · Confidential — for the named recipient only · # figures are projections/estimates, not guarantees</span><span>${n}</span></div>`;

const css = `
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4 landscape;margin:0}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1f2e;font-size:13px;line-height:1.55}
.page{page-break-after:always;position:relative;overflow:hidden;width:297mm;height:209mm}
.page:last-child{page-break-after:auto}
.wm{position:absolute;top:48%;left:50%;transform:translate(-50%,-50%) rotate(-22deg);font-size:88px;font-weight:900;letter-spacing:.12em;color:rgba(13,30,68,0.045);white-space:nowrap;z-index:0}
.dark .wm{color:rgba(255,255,255,0.04)}
.inner{padding:26px 44px 14px;position:relative;z-index:1;height:100%;display:flex;flex-direction:column}
.inner .body{flex:1}
h1{font-size:34px;line-height:1.2}
h2{font-size:23px;color:#0D1E44;margin-bottom:4px}
.dark h2{color:#fff}
h3{font-size:12px;color:#C94E0E;margin:6px 0 4px;text-transform:uppercase;letter-spacing:.08em}
.dark h3{color:#E8B23D}
p{margin-bottom:6px}
.dark{background:linear-gradient(150deg,#060F25,#0D1E44 55%,#15346B);color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.dark p{color:rgba(255,255,255,0.88)}
.gold{color:#E8B23D}
.band{height:6px;background:linear-gradient(90deg,#9A3408,#FF6B00,#E8B23D,#FF6B00,#9A3408);-webkit-print-color-adjust:exact;print-color-adjust:exact}
table{width:100%;border-collapse:collapse;margin:5px 0 7px;font-size:11px;position:relative;z-index:1}
th{background:#0D1E44;color:#fff;padding:5px 8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;-webkit-print-color-adjust:exact;print-color-adjust:exact}
td{padding:5px 8px;border-bottom:1px solid #E7E2D8;vertical-align:top}
tr:nth-child(even) td{background:#FAF7F2}
tr.hl td{background:#FFF3E4;border-top:1.5px solid #FF6B00;border-bottom:1.5px solid #FF6B00}
.dim{color:#8a8f9c;font-size:11px}
.card{border:1.4px solid #E3D9C8;border-radius:12px;padding:9px 14px;margin-bottom:8px;background:#FDFBF7;font-size:11.8px;line-height:1.5}
.card b.t{color:#0D1E44;display:block;margin-bottom:3px;font-size:14px}
.dark .card{background:rgba(255,255,255,0.06);border-color:rgba(232,178,61,0.4);color:rgba(255,255,255,0.9)}
.dark .card b.t{color:#E8B23D}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.note{background:#FFF7EC;border-left:5px solid #FF6B00;padding:7px 12px;border-radius:0 10px 10px 0;margin:6px 0;font-size:11.4px;line-height:1.5}
.statrow{display:flex;gap:14px;margin:16px 0}
.stat{flex:1;background:rgba(255,255,255,0.07);border:1px solid rgba(232,178,61,0.4);border-radius:12px;padding:16px 12px;text-align:center}
.stat .n{font-size:27px;font-weight:900;color:#E8B23D}
.stat .l{font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:.05em;text-transform:uppercase}
.statlight{flex:1;background:#FDFBF7;border:1.4px solid #E3D9C8;border-radius:12px;padding:14px 12px;text-align:center}
.statlight .n{font-size:25px;font-weight:900;color:#C94E0E}
.statlight .l{font-size:10.5px;color:#666;margin-top:4px;letter-spacing:.05em;text-transform:uppercase}
.foot{margin-top:6px;border-top:2.5px solid #FF6B00;padding-top:7px;font-size:9.6px;color:#777;display:flex;justify-content:space-between;position:relative;z-index:1;gap:20px}
.dark .foot{color:rgba(255,255,255,0.55);border-top-color:#E8B23D}
.tick{color:#0B7A3B;font-weight:800}
.cross{color:#B3261E;font-weight:800}
.price{font-size:19px;font-weight:900;color:#C94E0E;white-space:nowrap}
.tag{background:#FF6B00;color:#fff;font-size:9.5px;font-weight:800;border-radius:4px;padding:2px 8px;letter-spacing:.05em;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.hash{color:#B3261E;font-weight:900}
.hashnote{font-size:9.6px;color:#B3261E;margin:2px 0 4px;line-height:1.45}
`;

const HASH = `<p class="hashnote"><b>#</b> Estimate / projection based on the League's own data and assumptions — not a guarantee or assurance of any specific reach, viewership or outcome.</p>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>

<!-- S1 · COVER -->
<div class="page dark">${WM}<div class="inner">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <img src="${LOGO}" style="height:64px" onerror="this.style.display='none'">
    <div style="text-align:right;font-size:12px;letter-spacing:.25em;color:#E8B23D;font-weight:700">BCPL SPORTS PRIVATE LIMITED</div>
  </div>
  <div class="body" style="display:flex;flex-direction:column;justify-content:center">
    <h1>Bhartiya Corporate Premier League<br><span class="gold">Season 4 — Partnership &amp; Sponsorship Deck</span></h1>
    <p style="max-width:720px;margin-top:10px;font-size:15px">India's T20 cricket league for working professionals — played on real grounds, followed by a young corporate audience, and broadcast-ready for October 2026.</p>
    <div class="statrow">
      <div class="stat"><div class="n">2.5 Lakh+</div><div class="l">Corporate registrations</div></div>
      <div class="stat"><div class="n">3 Lakh</div><div class="l">Social followers (total)</div></div>
      <div class="stat"><div class="n">50 M+ <span style="font-size:15px" class="hash">#</span></div><div class="l">Social media reach</div></div>
      <div class="stat"><div class="n">10</div><div class="l">Franchise teams</div></div>
    </div>
    <p style="font-size:13px"><b class="gold">Season 4 · October 2026</b> &nbsp;·&nbsp; Brand Ambassadors: <b>Sourav Ganguly &amp; Zaheer Khan</b> &nbsp;·&nbsp; Streaming: <b>SonyLIV &amp; FanCode</b></p>
  </div>
  ${foot("Cover")}
</div></div>

<!-- S2 · ABOUT -->
<div class="page">${WM}<div class="inner">
  <h2>1 · What is BCPL?</h2>
  <div class="body">
  <p>The <b>Bhartiya Corporate Premier League (BCPL)</b>, run by BCPL Sports Private Limited, is a structured T20 cricket league built for India's working professionals. Players register online, clear KYC and physical trials, enter a live player auction, and play a televised-style franchise tournament — live digital scoring, professional umpires, match-day production and a points table, all run centrally by the League.</p>
  <div class="grid3" style="margin-top:8px">
    <div class="card"><b class="t">A league, not a one-day event</b>Group stage → knockouts → final across the season, 10 franchise teams, player auction with a defined purse — the full franchise-league format.</div>
    <div class="card"><b class="t">Season 4 — the biggest yet</b>Three seasons completed. Season 4 opens October 2026 with 2.5 Lakh+ registrations already recorded on the League's own platform.</div>
    <div class="card"><b class="t">Corporate + cricket audience</b>Every registered player is a working professional — a high-value, hard-to-reach audience for consumer and B2B brands alike.</div>
    <div class="card"><b class="t">Own digital platform</b>Registrations, payments, live scores and points tables run on bcplt20.com — every sponsor logo lives where the audience already is.</div>
    <div class="card"><b class="t">Credible faces</b>Brand ambassadors <b>Sourav Ganguly</b> and <b>Zaheer Khan</b> front the League's campaigns and content.</div>
    <div class="card"><b class="t">Broadcast-ready</b>Season 4 matches are planned on <b>SonyLIV</b> and <b>FanCode</b> <span class="hash">#</span> — with ad inventory available to League sponsors.</div>
  </div>
  ${HASH}
  </div>
  ${foot("Page 2")}
</div></div>

<!-- S3 · AUDIENCE -->
<div class="page">${WM}<div class="inner">
  <h2>2 · The Audience Your Brand Meets</h2>
  <div class="body">
  <div class="statrow">
    <div class="statlight"><div class="n">2.5 Lakh+</div><div class="l">Registered players — pure corporate</div></div>
    <div class="statlight"><div class="n">25–40</div><div class="l">Core age band (working professionals)</div></div>
    <div class="statlight"><div class="n">Pan-India</div><div class="l">Registrations across major cities</div></div>
    <div class="statlight"><div class="n">100%</div><div class="l">Digital-first — registered &amp; paid online</div></div>
  </div>
  <div class="grid2">
    <div class="card"><b class="t">Earning, deciding, spending</b>BCPL's players and followers are salaried professionals and business owners — the exact audience for finance, auto, tech, apparel, F&amp;B, travel and consumer-durable brands.</div>
    <div class="card"><b class="t">Engaged, not passive</b>These are participants, not just viewers — they registered, paid, submitted videos and follow their own tournament journey. Engagement per follower is far deeper than a generic sports page.</div>
    <div class="card"><b class="t">B2B doors open too</b>Players come from companies across sectors. A League sponsorship puts your brand in front of professionals from hundreds of workplaces — useful for HR, SaaS and enterprise brands.</div>
    <div class="card"><b class="t">Consent-based engagement</b>Sponsor campaigns to the player base run through official League channels, consent-based and within the DPDP Act, 2023 — clean, compliant reach.</div>
  </div>
  </div>
  ${foot("Page 3")}
</div></div>

<!-- S4 · DIGITAL REACH -->
<div class="page dark">${WM}<div class="inner">
  <h2>3 · Digital Footprint</h2>
  <div class="body">
  <div class="statrow">
    <div class="stat"><div class="n">2 Lakh+</div><div class="l">Instagram followers</div></div>
    <div class="stat"><div class="n">~3 Lakh</div><div class="l">Total social followers</div></div>
    <div class="stat"><div class="n">50 M+ <span style="font-size:15px" class="hash">#</span></div><div class="l">Total social reach</div></div>
    <div class="stat"><div class="n">bcplt20.com</div><div class="l">Live scores · points · news</div></div>
  </div>
  <div class="grid2">
    <div class="card"><b class="t">Reels, match clips &amp; player stories</b>Season content — auction moments, match highlights, player journeys — runs all season long. Sponsors are woven into this content, not just parked in a corner.</div>
    <div class="card"><b class="t">Ambassador-led campaigns</b>Campaign films and posts featuring Sourav Ganguly and Zaheer Khan carry sponsor branding as per tier — celebrity association at league cost, not yours.</div>
    <div class="card"><b class="t">Always-on league platform</b>Live scoring pages, points table and news on bcplt20.com run through the season — sponsor logos sit on the pages fans refresh the most.</div>
    <div class="card"><b class="t">Registration-season spikes</b>Registration windows drive traffic surges to League pages and social — high-frequency exposure ahead of the tournament itself.</div>
  </div>
  ${HASH}
  </div>
  ${foot("Page 4")}
</div></div>

<!-- S5 · BROADCAST -->
<div class="page">${WM}<div class="inner">
  <h2>4 · Broadcast &amp; Streaming — SonyLIV and FanCode <span class="hash" style="font-size:15px">#</span></h2>
  <div class="body">
  <p>Season 4 matches are planned for streaming on <b>SonyLIV</b> and <b>FanCode</b> — putting BCPL in front of a national OTT sports audience beyond its own social channels.</p>
  <div class="grid2">
    <div class="card"><b class="t">Sponsor ad slots on stream</b>League sponsors receive ad slots in the match streams as per their tier — your brand plays inside the cricket, alongside the on-ground branding you already own.</div>
    <div class="card"><b class="t">On-screen presence</b>Title and Powered-By partners are integrated into broadcast graphics — score bugs, replays, strategic-timeout stings and lower-thirds, as per tier.</div>
    <div class="card"><b class="t">Commentary mentions</b>Tiered verbal integrations — title naming in every score read-out, sponsored segments ("Strategic Timeout presented by…"), umpire-review mentions.</div>
    <div class="card"><b class="t">Highlights &amp; clips carry you further</b>Broadcast branding travels into highlight packages and social clips after every match — one placement, many surfaces.</div>
  </div>
  <div class="note"><b>Straight talk:</b> streaming plans, ad-slot counts and viewership depend on final platform agreements for Season 4 and are marked <span class="hash">#</span>. Exact broadcast deliverables per sponsor are listed in the sponsorship agreement before signing — no verbal promises.</div>
  </div>
  ${foot("Page 5")}
</div></div>

<!-- S6 · AMBASSADORS -->
<div class="page dark">${WM}<div class="inner">
  <h2>5 · The Faces of BCPL</h2>
  <div class="body">
  <div class="grid2" style="margin-top:10px">
    <div class="card" style="padding:16px 18px"><b class="t" style="font-size:19px">Sourav Ganguly</b><span style="font-size:12.5px">Former India captain &amp; one of Indian cricket's most trusted leadership voices — Brand Ambassador, BCPL. Features in League campaign films, launch content and key season moments.</span></div>
    <div class="card" style="padding:16px 18px"><b class="t" style="font-size:19px">Zaheer Khan</b><span style="font-size:12.5px">India's premier fast-bowling great — Brand Ambassador, BCPL. Fronts player-facing content, trials and tournament-phase campaigns through the season.</span></div>
  </div>
  <h3 style="margin-top:14px">What this means for a sponsor</h3>
  <div class="grid3">
    <div class="card"><b class="t">Instant credibility</b>Your brand appears in campaigns fronted by two of India's most recognised cricketers — association a standalone brand campaign cannot buy at this cost.</div>
    <div class="card"><b class="t">Co-branded content</b>Title &amp; Powered-By tiers receive sponsor integration in ambassador campaign content, as agreed in the sponsorship agreement.</div>
    <div class="card"><b class="t">Season-long, not one-off</b>Ambassador association runs across the season narrative — launch, auction, matches, finale — keeping your brand in the story throughout.</div>
  </div>
  <p class="dim" style="color:rgba(255,255,255,0.55);font-size:10.5px;margin-top:6px">Personal appearances by ambassadors at sponsor events are not included in any tier by default; such requests are separate commercial discussions with the League.</p>
  </div>
  ${foot("Page 6")}
</div></div>

<!-- S7 · SPONSORSHIP MENU -->
<div class="page">${WM}<div class="inner">
  <h2>6 · Season 4 Sponsorship Opportunities</h2>
  <p style="font-size:11.5px">All amounts are <b>per season, indicative and negotiable</b>, exclusive of GST. Final pricing depends on category exclusivity, deliverable mix and timing of commitment.</p>
  <div class="body">
  <table>
    <tr><th>Property</th><th>Slots</th><th>Headline rights</th><th>Indicative range (per season)</th></tr>
    <tr class="hl"><td><b>Title Sponsor</b> <span class="tag">FLAGSHIP</span></td><td>1 (exclusive)</td><td>League naming — "<b>&lt;Your Brand&gt; BCPL T20</b>" everywhere: logo lock-up, broadcast graphics, trophy, all League branding</td><td class="price">₹1.5 – 2 Cr</td></tr>
    <tr><td><b>Powered By / Co-Presenting</b></td><td>2</td><td>"Powered by &lt;Brand&gt;" on broadcast &amp; ground; second-tier logo on all League creatives</td><td class="price">₹50 – 75 L</td></tr>
    <tr><td><b>Official Jersey Partner</b> — all 10 team jerseys</td><td>1</td><td>Your logo on the playing jersey of <b>all 10 franchise teams</b> — every match, every photo, every clip</td><td class="price">₹80 L – 1 Cr</td></tr>
    <tr><td><b>Associate Partner</b></td><td>3–4</td><td>Category partner ("Official &lt;Category&gt; Partner"), ground + digital branding</td><td class="price">₹25 – 35 L</td></tr>
    <tr><td><b>Strategic Timeout Sponsor</b></td><td>1</td><td>Every strategic timeout branded &amp; announced as yours — broadcast sting + ground board + commentary</td><td class="price">₹15 – 25 L</td></tr>
    <tr><td><b>Official Umpire Partner</b></td><td>1</td><td>Logo on umpire uniforms all season + review-moment mentions</td><td class="price">₹10 – 15 L</td></tr>
  </table>
  <div class="note"><b>Title + Jersey bundle:</b> the Title Sponsor may also take the all-10-team jersey rights as a combined package at preferred pricing — the strongest single brand presence the League can offer. Ask for the bundle quote.</div>
  </div>
  ${foot("Page 7")}
</div></div>

<!-- S8 · TITLE SPONSOR DETAIL -->
<div class="page">${WM}<div class="inner">
  <h2>7 · Title Sponsor — What You Own <span class="dim" style="font-size:13px">(1 exclusive slot · ₹1.5–2 Cr indicative)</span></h2>
  <div class="body">
  <div class="grid2">
    <div>
      <h3>Naming &amp; identity</h3>
      <div class="card">League renamed "<b>&lt;Your Brand&gt; BCPL T20</b>" for the season — in the logo lock-up, on the trophy, in every score graphic, press note, backdrop and certificate.</div>
      <h3>Broadcast &amp; streaming <span class="hash">#</span></h3>
      <div class="card">First-position ad slots on SonyLIV/FanCode streams · title integration in score bug &amp; match graphics · verbal title mentions in commentary · logo in all highlight packages.</div>
      <h3>On-ground</h3>
      <div class="card">Premium boundary boards at every match · presentation-ceremony backdrop · toss board · trophy handover by your leadership at the final · hospitality passes for all match days.</div>
    </div>
    <div>
      <h3>Digital &amp; content</h3>
      <div class="card">Logo on bcplt20.com header &amp; live-score pages all season · presence in ambassador campaign content · dedicated launch announcement across League social · co-branded reels through the season.</div>
      <h3>Audience programs</h3>
      <div class="card">Consent-based co-branded communication to the registered player base via official League channels (DPDP-compliant) · first right on League activation properties (fan zones, contests).</div>
      <h3>Protection</h3>
      <div class="card">Full category exclusivity at Title level · right of first refusal on Season 5 title rights · all deliverables written into the sponsorship agreement with a delivery report at season end.</div>
    </div>
  </div>
  ${HASH}
  </div>
  ${foot("Page 8")}
</div></div>

<!-- S9 · JERSEY -->
<div class="page">${WM}<div class="inner">
  <h2>8 · Official Jersey Partner — All 10 Teams <span class="dim" style="font-size:13px">(1 slot · ₹80 L – 1 Cr indicative)</span></h2>
  <div class="body">
  <div class="grid2">
    <div class="card"><b class="t">The most photographed real estate in cricket</b>Your logo on the chest/sleeve of every playing jersey of all 10 franchise teams — visible in every ball bowled, every celebration, every player photo, every reel and every broadcast frame, all season.</div>
    <div class="card"><b class="t">Beyond the ground</b>Players keep and wear their jerseys — your brand walks into offices, gyms and weekend games long after the season ends. Jersey-reveal content on League social carries your logo at launch.</div>
    <div class="card"><b class="t">Indian-team-grade kit</b>BCPL mandates professional-quality jerseys and kit — your logo sits on apparel players are proud to wear, produced centrally so placement, size and quality are consistent across all 10 teams.</div>
    <div class="card"><b class="t">Bundle with Title</b>Combined Title + Jersey rights give one brand the league's name <i>and</i> every player's chest — the deepest association available. Combined package at preferred pricing on request.</div>
  </div>
  <div class="note">Placement (chest / sleeve / back), logo size and kit-launch deliverables are specified in the agreement. Franchise-level shoulder/secondary placements may be sold separately by teams; the League partner position stated here is uniform across all 10 teams.</div>
  </div>
  ${foot("Page 9")}
</div></div>

<!-- S10 · MID TIERS -->
<div class="page">${WM}<div class="inner">
  <h2>9 · Powered By · Associate · Timeout · Umpire</h2>
  <div class="body">
  <div class="grid2">
    <div class="card"><b class="t">Powered By / Co-Presenting — 2 slots · ₹50–75 L</b>"Powered by &lt;Brand&gt;" alongside the League name on broadcast graphics, backdrops and creatives · ad slots on streams <span class="hash">#</span> · boundary boards every match · logo on bcplt20.com · presence in select ambassador content · category exclusivity at this tier · hospitality passes.</div>
    <div class="card"><b class="t">Associate Partner — 3–4 slots · ₹25–35 L</b>"Official &lt;Category&gt; Partner of BCPL" designation · ground branding at all matches · logo on League digital properties · social-media announcement &amp; season-long tags · ad slots on streams (limited) <span class="hash">#</span> · category exclusivity within your slot.</div>
    <div class="card"><b class="t">Strategic Timeout Sponsor — 1 slot · ₹15–25 L</b>Every strategic timeout in every match announced and branded as yours — broadcast sting + graphic <span class="hash">#</span>, ground announcement, timeout-board branding, plus social clips of key timeout moments carrying your lock-up. High-frequency, high-recall property.</div>
    <div class="card"><b class="t">Official Umpire Partner — 1 slot · ₹10–15 L</b>Your logo on umpire uniforms in every match — in frame during every appeal, review and decision replay · "review presented by" broadcast mention <span class="hash">#</span> · a clean, uncluttered placement one brand owns alone.</div>
  </div>
  ${HASH}
  <div class="note">Every tier receives: logo on the League partners page, season-end delivery report, and a signed sponsorship agreement listing each deliverable — nothing is left verbal.</div>
  </div>
  ${foot("Page 10")}
</div></div>

<!-- S11 · MATRIX -->
<div class="page">${WM}<div class="inner">
  <h2>10 · Deliverables at a Glance</h2>
  <div class="body">
  <table style="font-size:10.6px">
    <tr><th>Deliverable</th><th>Title</th><th>Powered By</th><th>Jersey</th><th>Associate</th><th>Timeout</th><th>Umpire</th></tr>
    <tr><td>League naming rights</td><td class="tick">✔</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
    <tr><td>Logo on all 10 team jerseys</td><td class="dim">bundle option</td><td class="cross">—</td><td class="tick">✔</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
    <tr><td>Broadcast/stream ad slots <span class="hash">#</span></td><td class="tick">✔ first position</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔ limited</td><td class="tick">✔ limited</td><td class="cross">—</td></tr>
    <tr><td>Broadcast graphics integration <span class="hash">#</span></td><td class="tick">✔</td><td class="tick">✔</td><td class="cross">—</td><td class="cross">—</td><td class="tick">✔ timeout sting</td><td class="tick">✔ review mention</td></tr>
    <tr><td>Boundary boards (all matches)</td><td class="tick">✔ premium</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔ timeout board</td><td class="cross">—</td></tr>
    <tr><td>Ceremony/backdrop &amp; trophy presence</td><td class="tick">✔ incl. trophy</td><td class="tick">✔</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
    <tr><td>Uniform branding (umpires)</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="tick">✔</td></tr>
    <tr><td>bcplt20.com &amp; live-score page logo</td><td class="tick">✔ header</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔</td><td class="tick">✔</td></tr>
    <tr><td>League social campaigns &amp; reels</td><td class="tick">✔ season-long</td><td class="tick">✔</td><td class="tick">✔ kit launch +</td><td class="tick">✔ announcements</td><td class="tick">✔ timeout clips</td><td class="tick">✔ announcements</td></tr>
    <tr><td>Ambassador campaign presence</td><td class="tick">✔</td><td class="tick">✔ select</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td><td class="cross">—</td></tr>
    <tr><td>Consent-based player-base campaigns (DPDP)</td><td class="tick">✔</td><td class="tick">✔</td><td class="cross">—</td><td class="tick">✔ 1 campaign</td><td class="cross">—</td><td class="cross">—</td></tr>
    <tr><td>Category exclusivity</td><td class="tick">✔ full</td><td class="tick">✔ tier</td><td class="tick">✔ apparel</td><td class="tick">✔ category</td><td class="tick">✔ property</td><td class="tick">✔ property</td></tr>
    <tr><td>Hospitality passes</td><td class="tick">✔ all matches</td><td class="tick">✔ all matches</td><td class="tick">✔ key matches</td><td class="tick">✔ key matches</td><td class="tick">✔ playoffs</td><td class="tick">✔ playoffs</td></tr>
  </table>
  ${HASH}
  </div>
  ${foot("Page 11")}
</div></div>

<!-- S12 · INCLUDED / NOT INCLUDED -->
<div class="page">${WM}<div class="inner">
  <h2>11 · What's Included — and What's Not</h2>
  <div class="body">
  <div class="grid2">
    <div>
      <h3 style="color:#0B7A3B">Included in every sponsorship</h3>
      <div class="card">✔ Written agreement listing every deliverable — placements, counts, sizes, timelines.<br>✔ All production &amp; placement of on-ground League branding at League cost.<br>✔ Season-end delivery report with photos/screenshots of executed deliverables.<br>✔ A single League point of contact through the season.<br>✔ Invoicing with GST from BCPL Sports Private Limited.</div>
    </div>
    <div>
      <h3 style="color:#B3261E">Not included (so there are no surprises)</h3>
      <div class="card">✘ No guarantee of specific viewership, reach or business outcomes — all audience figures marked <span class="hash">#</span> are estimates.<br>✘ Ambassador personal appearances at sponsor events — separate discussion, not part of any tier.<br>✘ Sponsor's own ad-film production costs — you supply finished creatives to broadcast specs.<br>✘ Franchise-team-level sponsorships — teams sell their own secondary properties; this deck covers League properties only.<br>✘ No equity, revenue share or investment product — this is a brand-sponsorship arrangement only.</div>
    </div>
  </div>
  <div class="note"><b>Payment terms (indicative):</b> 50% on signing · 50% before the first match. Category exclusivity activates only on signing. Early commitment (before September 2026) secures better inventory positions and pricing.</div>
  </div>
  ${foot("Page 12")}
</div></div>

<!-- S13 · WHY + NEXT STEPS -->
<div class="page dark">${WM}<div class="inner">
  <h2>12 · Why BCPL, and What Happens Next</h2>
  <div class="body">
  <div class="grid3" style="margin-top:8px">
    <div class="card"><b class="t">Big-league feel, sensible ticket</b>Franchise-league association — naming, jerseys, broadcast, ambassadors — at a fraction of what top-tier properties cost.</div>
    <div class="card"><b class="t">An audience you can't buy elsewhere</b>2.5 Lakh+ registered corporate professionals plus a ~3 Lakh social following — participants, not passers-by.</div>
    <div class="card"><b class="t">A league that's growing with you</b>Get in at Season 4 pricing with first-refusal rights on future seasons — early partners grow as the League grows.</div>
  </div>
  <h3 style="margin-top:12px">Next steps</h3>
  <div class="grid3">
    <div class="card"><b class="t">1 · Talk to us</b>Share your category and objectives — we'll confirm slot availability and exclusivity for your category.</div>
    <div class="card"><b class="t">2 · Custom proposal</b>We tailor the deliverable mix and share a written proposal with exact pricing within 5 working days.</div>
    <div class="card"><b class="t">3 · Sign &amp; go live</b>Agreement + first tranche locks your inventory. Branding goes live with the League's Season 4 launch wave.</div>
  </div>
  <div style="margin-top:14px;font-size:14px">
    <b class="gold">Sponsorship Desk — Founder's Office</b><br>
    <span style="font-size:13px">Phone: <b>+91 83684 44754</b> &nbsp;·&nbsp; Email: <b>support@bcplt20.com</b> &nbsp;·&nbsp; Web: <b>www.bcplt20.com</b></span>
  </div>
  <p class="dim" style="color:rgba(255,255,255,0.5);font-size:9.6px;margin-top:10px">This deck is confidential and for the named recipient only. It is an invitation to discuss sponsorship — not an offer, contract or investment product. All figures marked # are the League's own estimates and projections; actual outcomes may differ. Final deliverables, pricing and terms are as per the signed sponsorship agreement only. GST extra as applicable.</p>
  </div>
  ${foot("Page 13")}
</div></div>

</body></html>`;

writeFileSync("/tmp/sponsordeck.html", html);
console.log("wrote /tmp/sponsordeck.html", html.length, "bytes");
