import { writeFileSync } from "fs";

/* v5 — premium/detail upgrade Aug'26 (all v4 owner-approved numbers unchanged):
   NEW: contents page + doc-control box, League at a Glance, application &
   payment timeline, League-vs-Franchise responsibility matrix, Risk Factors,
   2-page FAQ (kill the phone calls), acknowledgment slip on last page.
   Retained from v4: sponsorship pool 40%; jersey 100% team's own; registration
   25% pool net of league operational costs on actuals; prize winner 3 Cr
   (1.5/1.5), runner-up 2 Cr (1/1) — upside, not in P&L; fee FLAT ₹3 Cr/season
   (₹15 Cr / 5 yrs); 5-yr lock-in, co-owner ≤50% after 3 yrs with consent;
   MoM prizes owner-borne ≈ ₹5–10 L/yr; "#" projection markers everywhere. */
const GST = 1.18, TEAMS = 10;
const avgP1 = (299 * 0.5 + 399 * 0.5) / GST;
const avgP2 = (2000 * 0.5 + 3000 * 0.5) / GST;
const cr = (x) => x / 1e7;
const f2 = (x) => x.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const f1 = (x) => x.toLocaleString("en-IN", { maximumFractionDigits: 1 });
const L = (n) => (n / 100000) + " lakh";
const PURSE = 1, OPS = 1, FEE = 3;
const CONVS = [0.30, 0.50, 0.60];

function buildScenario(regs, spons, media, jersey) {
  const cums = [0, 0, 0];
  return regs.map((r, i) => {
    const p1 = cr(r * avgP1);
    const cost = FEE + PURSE + OPS;
    const by = CONVS.map((c, k) => {
      const p2 = cr(r * c * avgP2);
      const perTeam = (0.25 * (p1 + p2) + 0.40 * spons[i] + 0.25 * media[i]) / TEAMS + jersey[i];
      const net = perTeam - cost; cums[k] += net;
      return { conv: c, p2, perTeam, net, cum: cums[k] };
    });
    return { season: "Season " + (6 + i), year: "Year " + (i + 1), regs: r, p1, spons: spons[i], media: media[i], jersey: jersey[i], fee: FEE, cost, by };
  });
}
const A = buildScenario([200000, 300000, 500000, 800000, 1000000], [3, 5, 6, 7, 8], [0, 0, 0, 1, 2], [0.20, 0.40, 0.80, 1.00, 1.50]);
const B = buildScenario([500000, 1000000, 1500000, 2000000, 2500000], [5, 8, 12, 16, 20], [0, 0, 1, 2, 3], [0.50, 0.75, 1.00, 1.50, 2.00]);
const C = buildScenario([1000000, 2000000, 3000000, 4000000, 5000000], [8, 12, 16, 20, 25], [0, 1, 2, 3, 4], [1.00, 1.50, 2.00, 2.50, 3.00]);

const conv2L = [10, 20, 30, 40, 50, 60, 70].map((c) => {
  const p1 = cr(200000 * avgP1), p2 = cr(200000 * (c / 100) * avgP2);
  return { c, p2, perTeam: (0.25 * (p1 + p2) + 0.40 * 3) / TEAMS + 0.20 };
});

const BARCOLORS = ["#FF6B00", "#E8B23D", "#31C56B", "#3B82F6", "#A855F7"];
function manhattan(data, title, convIdx) {
  const maxV = Math.max(...data.map((p) => p.by[convIdx].perTeam));
  const bars = data.map((p, i) => {
    const v = p.by[convIdx].perTeam;
    const h = Math.max(10, (v / maxV) * 160);
    const x = 55 + i * 135;
    return `<rect x="${x}" y="${217 - h}" width="82" height="${h}" rx="8" fill="url(#bg${i})"/>
    <text x="${x + 41}" y="${205 - h}" text-anchor="middle" font-size="15" font-weight="800" fill="#0D1E44">₹${f2(v)} Cr</text>
    <text x="${x + 41}" y="${239}" text-anchor="middle" font-size="13" font-weight="700" fill="#444">${p.season}</text>
    <text x="${x + 41}" y="${255}" text-anchor="middle" font-size="11.5" fill="#888">${p.year} · ${L(p.regs)}</text>`;
  }).join("");
  const defs = data.map((_, i) => `<linearGradient id="bg${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BARCOLORS[i]}"/><stop offset="1" stop-color="${BARCOLORS[i]}99"/></linearGradient>`).join("");
  return `<svg width="440" height="165" viewBox="0 0 740 268" style="display:block;margin:0 auto">
  <defs>${defs}</defs><line x1="35" y1="217" x2="720" y2="217" stroke="#D8CDBB" stroke-width="1.5"/>
  ${bars}<text x="35" y="18" font-size="14" font-weight="800" fill="#0D1E44">${title} <tspan fill="#B3261E">#</tspan></text></svg>`;
}
function pie(slices, size = 240) {
  const tot = slices.reduce((s, x) => s + x.v, 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 6;
  let a = -Math.PI / 2, paths = "", legend = "";
  slices.forEach((s) => {
    const a2 = a + (s.v / tot) * Math.PI * 2;
    const x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a), x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = a2 - a > Math.PI ? 1 : 0;
    paths += `<path d="M${cx},${cy} L${f2(x1)},${f2(y1)} A${r},${r} 0 ${large} 1 ${f2(x2)},${f2(y2)} Z" fill="${s.color}" stroke="#fff" stroke-width="2.5"/>`;
    const mid = (a + a2) / 2, lx = cx + r * 0.62 * Math.cos(mid), ly = cy + r * 0.62 * Math.sin(mid);
    paths += `<text x="${f2(lx)}" y="${f2(ly)}" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">${Math.round((s.v / tot) * 100)}%</text>`;
    legend += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px"><span style="width:14px;height:14px;border-radius:4px;background:${s.color};display:inline-block"></span><span style="font-size:12.5px"><b>${s.label}</b></span></div>`;
    a = a2;
  });
  return `<div style="display:flex;align-items:center;gap:26px;justify-content:center;margin:6px 0 4px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}</svg><div>${legend}</div></div>`;
}

const HASHNOTE = `<p style="font-size:9.8px;color:#B3261E;margin:1px 0 4px;line-height:1.45"><b>#</b> Projection / illustration only — <b>not a guarantee, promise or assurance of any income or return</b>. These are the League's own assumptions about the future; actual results may be higher or lower, and may not happen at all.</p>`;

const netCell = (n) => `<td style="color:${n >= 0 ? "#0B7A3B" : "#B3261E"};font-weight:700">${n >= 0 ? "+" : "−"}₹${f2(Math.abs(n))} Cr</td>`;
const revTable = (D) => `<table>
  <tr><th>Season</th><th>Registrations</th><th>Phase-1 (net)</th><th>League spons.</th><th>Jersey spons. (100% yours)</th><th>Media</th><th>Fee + Purse + Ops</th></tr>
  ${D.map((p) => `<tr><td><b>${p.season}</b> <span class="dim">(${p.year})</span></td><td>${L(p.regs)}</td><td>₹${f2(p.p1)} Cr</td><td>₹${f1(p.spons)} Cr</td><td>₹${f2(p.jersey)} Cr</td><td>${p.media ? "₹" + f1(p.media) + " Cr" : "—"}</td><td>₹${f2(p.cost)} Cr</td></tr>`).join("")}
</table>`;
const plTable = (D) => `<table>
  <tr><th rowspan="2" style="vertical-align:middle">Season</th><th colspan="2" style="text-align:center;border-right:2px solid #E8B23D">Phase-2 conversion 30%</th><th colspan="2" style="text-align:center;border-right:2px solid #E8B23D">Conversion 50%</th><th colspan="2" style="text-align:center">Conversion 60%</th></tr>
  <tr><th>Team revenue</th><th style="border-right:2px solid #E8B23D">Season net</th><th>Team revenue</th><th style="border-right:2px solid #E8B23D">Season net</th><th>Team revenue</th><th>Season net</th></tr>
  ${D.map((p) => `<tr><td><b>${p.season}</b> <span class="dim">(${p.year})</span></td>${p.by.map((b) => `<td>₹${f2(b.perTeam)} Cr</td>${netCell(b.net)}`).join("")}</tr>`).join("")}
  <tr style="background:#F2EFE8"><td><b>5-season cumulative</b></td>${D[4].by.map((b) => `<td></td><td style="color:${b.cum >= 0 ? "#0B7A3B" : "#B3261E"};font-weight:800">${b.cum >= 0 ? "+" : "−"}₹${f2(Math.abs(b.cum))} Cr</td>`).join("")}</tr>
</table>`;

const WM = `<div class="wm">BCPL · CONFIDENTIAL</div>`;
const foot = (n) => `<div class="foot"><span>BCPL Franchise Prospectus · Aug 2026 · v5</span><span>BCPL Sports Private Limited · Strictly Confidential — do not share · # figures are projections, not guarantees</span><span>Page ${n}</span></div>`;

const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1f2e;font-size:13px;line-height:1.6}
.page{page-break-after:always;position:relative;overflow:hidden}
.page:last-child{page-break-after:auto}
.wm{position:absolute;top:46%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:74px;font-weight:900;letter-spacing:.12em;color:rgba(13,30,68,0.05);white-space:nowrap;pointer-events:none;z-index:0}
.cover .wm{color:rgba(255,255,255,0.045)}
.inner{padding:36px 46px;position:relative;z-index:1}
h1{font-size:33px;line-height:1.25}
h2{font-size:19px;color:#0D1E44;margin-bottom:6px}
h3{font-size:12px;color:#C94E0E;margin:5px 0 3px;text-transform:uppercase;letter-spacing:.07em}
p{margin-bottom:7px}
.cover{background:linear-gradient(150deg,#060F25,#0D1E44 55%,#15346B);color:#fff;height:270mm;padding:52px 52px;display:flex;flex-direction:column;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.gold{color:#E8B23D}
.band{height:6px;background:linear-gradient(90deg,#9A3408,#FF6B00,#E8B23D,#FF6B00,#9A3408);-webkit-print-color-adjust:exact;print-color-adjust:exact}
table{width:100%;border-collapse:collapse;margin:5px 0 7px;font-size:10.4px;position:relative;z-index:1}
th{background:#0D1E44;color:#fff;padding:4px 7px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;-webkit-print-color-adjust:exact;print-color-adjust:exact}
td{padding:4px 7px;border-bottom:1px solid #E7E2D8;vertical-align:top}
tr:nth-child(even) td{background:#FAF7F2}
tr.hl td{background:#FFF3E4;border-top:1.5px solid #FF6B00;border-bottom:1.5px solid #FF6B00}
.tag{background:#FF6B00;color:#fff;font-size:9.5px;font-weight:800;border-radius:4px;padding:1.5px 7px;margin-left:5px;letter-spacing:.05em}
.dim{color:#8a8f9c;font-size:11px}
.card{border:1.4px solid #E3D9C8;border-radius:12px;padding:8px 13px;margin-bottom:7px;background:#FDFBF7;font-size:11.6px;line-height:1.5}
.card b.t{color:#0D1E44;display:block;margin-bottom:4px;font-size:14px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.note{background:#FFF7EC;border-left:5px solid #FF6B00;padding:7px 12px;border-radius:0 10px 10px 0;margin:6px 0;font-size:11.3px;line-height:1.5}
.danger{background:#FDECEA;border-left:5px solid #B3261E}
.statrow{display:flex;gap:12px;margin:20px 0}
.stat{flex:1;background:rgba(255,255,255,0.07);border:1px solid rgba(232,178,61,0.4);border-radius:12px;padding:16px 14px;text-align:center}
.stat .n{font-size:24px;font-weight:900;color:#E8B23D}
.stat .l{font-size:11px;color:rgba(255,255,255,0.7);margin-top:3px;letter-spacing:.05em;text-transform:uppercase}
.legal p,.legal li{font-size:10.1px;line-height:1.5;color:#333a4c}
.legal ol{margin:4px 0 12px 20px}
.legal li{margin-bottom:3px}
.foot{margin-top:8px;border-top:2.5px solid #FF6B00;padding-top:9px;font-size:10px;color:#777;display:flex;justify-content:space-between;position:relative;z-index:1}
.toc{width:100%;border-collapse:collapse;font-size:12.6px}
.toc td{padding:7px 6px;border-bottom:1px dashed #D8CDBB;background:transparent !important}
.toc .pg{text-align:right;font-weight:800;color:#C94E0E;width:40px}
.step{display:flex;gap:12px;margin-bottom:8px;align-items:flex-start}
.stepnum{min-width:26px;height:26px;border-radius:50%;background:#0D1E44;color:#E8B23D;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.stepbody{font-size:11.4px;line-height:1.5}
.stepbody b{color:#0D1E44;font-size:12.4px}
.faq{border-left:4px solid #E8B23D;background:#FDFBF7;border-radius:0 10px 10px 0;padding:7px 12px;margin-bottom:7px}
.faq .q{font-weight:800;color:#0D1E44;font-size:11.8px;margin-bottom:2px}
.faq .a{font-size:10.9px;line-height:1.5;color:#333a4c}
@media print{@page{size:A4;margin:0} .inner{padding:12mm 13mm 10mm} .card,.note,tr,.faq,.step{page-break-inside:avoid} h2,h3{page-break-after:avoid}}
`;

const scenarioPage = (num, secnum, letter, name, sub, D, chartTitle, noteHtml) => `
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>${secnum} · Outlook ${letter} — ${name} <span class="dim" style="font-size:13px">(${sub})</span> <span style="color:#B3261E">#</span></h2>
  ${manhattan(D, chartTitle + " — at 30% Phase-2 conversion", 0)}
  ${revTable(D)}
  <h3>Franchise P&amp;L <span style="color:#B3261E">#</span> — season net at 30% / 50% / 60% Phase-2 conversion (incl. jersey sponsorship)</h3>
  ${plTable(D)}
  ${HASHNOTE}
  ${noteHtml}
  ${foot(num)}
</div></div>`;

const faq = (q, a) => `<div class="faq"><div class="q">Q. ${q}</div><div class="a">${a}</div></div>`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>BCPL Franchise Prospectus</title><style>${css}</style></head><body>

<!-- P1 · COVER -->
<div class="page cover">${WM}
  <div style="display:flex;align-items:center;gap:18px;position:relative;z-index:1"><img src="file:///home/runner/workspace/artifacts/bcpl-website/public/bcpl-assets/bcpl-logo-white.png" style="height:66px"/><div style="font-size:14px;letter-spacing:.28em;color:#E8B23D;font-weight:800">BCPL SPORTS PRIVATE LIMITED</div></div>
  <div style="margin-top:54px;position:relative;z-index:1">
    <h1>Bhartiya Corporate Premier League<br/><span class="gold">Franchise Ownership Prospectus</span></h1>
    <p style="margin-top:16px;font-size:15.5px;color:rgba(255,255,255,.78);max-width:560px">Own a T20 franchise in India's corporate cricket league — the privilege of team ownership, the complete revenue-sharing model, the full application process, and a five-season illustrative growth outlook.</p>
  </div>
  <div class="statrow" style="position:relative;z-index:1">
    <div class="stat"><div class="n">10</div><div class="l">Franchise Teams</div></div>
    <div class="stat"><div class="n">25%</div><div class="l">Registration Revenue Pool</div></div>
    <div class="stat"><div class="n">40%</div><div class="l">Sponsorship Revenue Pool</div></div>
    <div class="stat"><div class="n">100%</div><div class="l">Jersey Sponsorship — Yours</div></div>
  </div>
  <div style="position:relative;z-index:1;margin-top:14px">
    <div style="background:rgba(232,178,61,0.1);border:1px solid rgba(232,178,61,0.45);border-radius:14px;padding:16px 22px">
      <div style="font-size:12px;letter-spacing:.18em;color:#E8B23D;font-weight:800;margin-bottom:8px">WHAT'S INSIDE</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 22px;font-size:12.6px;color:rgba(255,255,255,.85)">
        <div>① The league at a glance</div><div>② The privilege of team ownership</div>
        <div>③ Investment — ₹15 Cr over 5 seasons</div><div>④ Five revenue streams, explained</div>
        <div>⑤ 5-year outlook — three growth paths</div><div>⑥ Application process &amp; payment timeline</div>
        <div>⑦ Who does what — league vs franchise</div><div>⑧ Risk factors — read candidly</div>
        <div>⑨ 20 questions, answered in advance</div><div>⑩ Complete legal terms &amp; confidentiality</div>
      </div>
    </div>
  </div>
  <div style="position:relative;z-index:1;margin-top:14px;background:rgba(255,255,255,0.06);border:1px dashed rgba(232,178,61,0.5);border-radius:12px;padding:12px 20px;font-size:12px;color:rgba(255,255,255,.8)">
    <b style="color:#E8B23D;letter-spacing:.14em;font-size:11px">DOCUMENT CONTROL</b><br/>
    Issued to: ______________________________________ &nbsp;·&nbsp; Copy No: ________ &nbsp;·&nbsp; Date of issue: ____________<br/>
    <span style="font-size:10.5px;color:rgba(255,255,255,.6)">This numbered copy is issued to the named recipient only and is traceable to them. Version: August 2026 (v5). This document supersedes all earlier versions.</span>
  </div>
  <div style="margin-top:auto;position:relative;z-index:1">
    <div style="display:flex;gap:26px;font-size:12.5px;color:rgba(255,255,255,.72)">
      <span><b style="color:#E8B23D">EMAIL</b> franchisee@bcplt20.com</span><span><b style="color:#E8B23D">WEB</b> www.bcplt20.com</span><span><b style="color:#E8B23D">PHONE</b> +91 83684 44754 (Founder's Office)</span>
    </div>
    <div style="margin-top:13px;font-size:10px;color:rgba(255,255,255,.5);max-width:660px">Private &amp; strictly confidential — issued to the named recipient only; any sharing, copying or circulation is prohibited (see Confidentiality, last page). This is an invitation to explore franchise participation only — not an offer of securities, a deposit scheme or an investment product; no return is promised or assured. All projections marked # are illustrative assumptions only — not guarantees.</div>
  </div>
</div>

<!-- P2 · CONTENTS + HOW TO READ -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>Contents</h2>
  <table class="toc">
    <tr><td>1 · The League at a Glance — format, player funnel, platform</td><td class="pg">3</td></tr>
    <tr><td>2 · The Privilege of Owning a Team</td><td class="pg">4</td></tr>
    <tr><td>3 · Investment Structure — ₹15 Cr over five seasons</td><td class="pg">5</td></tr>
    <tr><td>4 · How a Franchise Earns — five streams &nbsp;·&nbsp; 5 · Season-6 conversion table <span style="color:#B3261E">#</span></td><td class="pg">6</td></tr>
    <tr><td>6 · Outlook A — Steady Growth <span style="color:#B3261E">#</span></td><td class="pg">7</td></tr>
    <tr><td>7 · Outlook B — High Growth <span style="color:#B3261E">#</span></td><td class="pg">8</td></tr>
    <tr><td>8 · Outlook C — Ultra High Growth <span style="color:#B3261E">#</span></td><td class="pg">9</td></tr>
    <tr><td>9 · From Enquiry to Match Day — application process, payment timeline &amp; document checklist</td><td class="pg">10</td></tr>
    <tr><td>10 · Who Does What — league vs franchise responsibility matrix</td><td class="pg">11</td></tr>
    <tr><td>11 · Risk Factors — a candid statement</td><td class="pg">12</td></tr>
    <tr><td>12 · Frequently Asked Questions — 20 answers in advance</td><td class="pg">13–14</td></tr>
    <tr><td>13 · Key Terms &amp; Conditions</td><td class="pg">15</td></tr>
    <tr><td>14 · Confidentiality · Disclaimer · Contact · Acknowledgment</td><td class="pg">16</td></tr>
  </table>
  <h3 style="margin-top:16px">How to read this document</h3>
  <div class="note"><b>The <span style="color:#B3261E">#</span> marker.</b> Wherever you see <b style="color:#B3261E">#</b>, the number next to it is a <b>projection or illustration only</b> — the League's own assumption about the future. It is <b>not</b> a promise, guarantee or assurance of any income, profit or return. Confirmed, committed figures (fees, pool percentages, prize splits, lock-in) carry no # marker.</div>
  <div class="note"><b>What is binding.</b> Nothing in this prospectus creates rights or obligations. Only the signed <b>Franchise Agreement</b> (with its schedules) is binding; where this document and the Franchise Agreement differ, the Franchise Agreement prevails.</div>
  <div class="note danger"><b>Independent advice.</b> A franchise involves substantial multi-season financial commitments. Please have your own legal, tax and financial advisors review the Franchise Agreement before signing. This document is not financial, legal or tax advice.</div>
  ${foot(2)}
</div></div>

<!-- P3 · LEAGUE AT A GLANCE -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>1 · The League at a Glance</h2>
  <p>The <b>Bhartiya Corporate Premier League (BCPL)</b>, run by BCPL Sports Private Limited, is a T20 cricket league built for India's working professionals — a structured, technology-driven pathway from open registration to a televised-style franchise tournament.</p>
  <h3>The player funnel — where franchise revenue begins</h3>
  <div class="step"><div class="stepnum">1</div><div class="stepbody"><b>Phase 1 — Registration &amp; skill video (₹299 / ₹399)</b><br/>Players register on bcplt20.com and submit a 30–60 second skill video, which is evaluated against a structured 100-point assessment framework. Results are announced within the league's published timelines.</div></div>
  <div class="step"><div class="stepnum">2</div><div class="stepbody"><b>Phase 2 — KYC, physical trials &amp; auction eligibility (₹2,000 / ₹3,000)</b><br/>Shortlisted players complete verified KYC (PAN + Aadhaar) and attend physical trials in their chosen city, conducted by the league with structured on-ground evaluation.</div></div>
  <div class="step"><div class="stepnum">3</div><div class="stepbody"><b>Player auction — your team takes shape</b><br/>Top-performing trialists enter the player auction. Each franchise builds its squad from a fixed ₹1 Cr purse — every team starts on equal footing.</div></div>
  <div class="step"><div class="stepnum">4</div><div class="stepbody"><b>The tournament — group stage to final</b><br/>10 franchises play a T20 tournament with group stages, knockouts and a final — with live digital scoring, points tables and match centres on the league platform.</div></div>
  <h3>League-grade infrastructure, centrally run</h3>
  <div class="grid2">
    <div class="card"><b class="t">Digital platform</b>Registrations, payments, verified KYC, trial passes with unique registration numbers, live scoring and points tables run on the league's own platform at bcplt20.com.</div>
    <div class="card"><b class="t">Structured, auditable evaluation</b>Every player passes through the same published assessment framework — video scoring, trial evaluation and selection criteria — giving franchises a merit-based talent pool.</div>
    <div class="card"><b class="t">Match-day standards</b>Professional grounds, umpires, scoring and match operations are organised centrally by the league at league cost.</div>
    <div class="card"><b class="t">Player-welfare mandate</b>The league mandates 5-star player accommodation and Indian-team-grade kit — protecting the experience that gives the league (and your team) its stature.</div>
  </div>
  <div class="note">Season numbering in this document: the outlook pages call your first ownership season "Season 6 (Year 1)" and run five seasons to "Season 10 (Year 5)". Fees and pool percentages are identical for every franchise in every season shown.</div>
  ${foot(3)}
</div></div>

<!-- P4 · PRIVILEGE -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>2 · The Privilege of Owning a Team</h2>
  <p>Owning a sports franchise is not an ordinary business purchase. Across the world — and most visibly in the IPL — team ownership sits in a category of its own: a seat at the top table of a sport, a public identity for a business house, and an asset whose stature grows with the league itself. Corporate leaders own teams for the brand, the network, the community standing and the sheer pride of walking into a stadium behind their own name — the financials are only one part of the story.</p>
  <p>BCPL brings that same ownership experience to India's fastest-growing corporate sporting stage — at a fraction of big-league cost, and at the very beginning of the league's growth curve.</p>
  <div class="grid2">
    <div class="card"><b class="t">Your company's name on the team</b>The franchise may be named after the owner's company (subject to league brand guidelines) — every match, jersey, scorecard and broadcast carries your corporate brand, season after season.</div>
    <div class="card"><b class="t">A world-class team experience</b>The league mandates a top standard: players stay in 5-star hotels, jerseys and kit are Indian-team grade, and team management is fully professional. Your franchise looks and feels big-league from day one.</div>
    <div class="card"><b class="t">A pure corporate audience</b>League participants are working professionals — a high-value, hard-to-reach audience for B2B and consumer brands, and a natural network for the owner's own businesses.</div>
    <div class="card"><b class="t">Consent-based participant insights</b>Aggregated, consent-based engagement insights about participants connected to your team, plus co-branded communication through official league channels — always within the DPDP Act, 2023.</div>
    <div class="card"><b class="t">A league that grows every season</b>Registrations, digital reach and on-ground footprint grow season on season — and your revenue pools are tied directly to that growth.</div>
    <div class="card"><b class="t">League-run machinery</b>Grounds, umpires, live scoring, broadcast, the digital platform, registrations and payments are all run centrally by the league. You build the team — the league runs the machinery.</div>
  </div>
  ${foot(4)}
</div></div>

<!-- P5 · INVESTMENT -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>3 · Investment Structure — ₹15 Cr Over Five Seasons</h2>
  <p>A BCPL franchise is a <b>five-season commitment</b>. The league franchise fee is <b>₹3 Cr per season, flat — with no increase of any kind for five seasons</b>. That means the franchise fee for your team is <b>₹15 Cr in total across Seasons 1–5</b>, paid as ₹3 Cr each season.</p>
  <table>
    <tr><th>Item</th><th>Amount / season</th><th>Notes</th></tr>
    <tr><td><b>League franchise fee</b></td><td><b>₹3 Cr every season (flat)</b></td><td>Same for every franchise. Payable every season, <b>not one-time</b>. <b>No increment — the fee stays ₹3 Cr for all five seasons (₹15 Cr total).</b></td></tr>
    <tr><td><b>Auction purse</b></td><td><b>₹1 Cr (fixed)</b></td><td>Every team's player-auction purse. Held fixed for the next 2–3 seasons; reviewed by the league thereafter.</td></tr>
    <tr><td><b>Team operations</b></td><td><b>≈ ₹1 Cr (indicative)</b></td><td>5-star player accommodation, Indian-team-grade jerseys &amp; kit, team management, travel and match-day operations. Varies with the owner's choices, but the league's minimum standards must be met.</td></tr>
    <tr><td><b>Man-of-the-Match prizes &amp; trophies</b></td><td>≈ ₹5–10 lakh (indicative)</td><td>Group-stage Man-of-the-Match prizes and trophies are <b>borne by the franchise owner</b>. Amount is not fixed — indicatively ₹5–10 lakh per season.</td></tr>
    <tr><td>Bid registration fee</td><td>₹2,00,000 (one-time)</td><td>Non-refundable, per applicant, to enter the bid process — whether or not a franchise is allotted.</td></tr>
  </table>
  ${pie([
    { v: 3, label: "League franchise fee — ₹3 Cr (flat, no increase)", color: "#FF6B00" },
    { v: 1, label: "Auction purse — ₹1 Cr (fixed)", color: "#E8B23D" },
    { v: 1, label: "Team operations — ≈ ₹1 Cr", color: "#0D1E44" },
  ])}
  <p class="dim" style="text-align:center">Season outlay ≈ ₹5 Cr (plus MoM prizes ≈ ₹5–10 lakh) — the pie shows the split of a season's commitment. GST applies extra on fees as per law.</p>
  <div class="note"><b>5-year lock-in:</b> the franchise <b>cannot be sold or transferred for a minimum of 5 years</b>. After 3 years, the owner may add a co-owner holding up to 50%, with the League's prior written consent. A full sale is not permitted before the 5-year lock-in ends.</div>
  <div class="note"><b>Allotment &amp; eligibility:</b> clean legal &amp; financial background, KYC of the applicant entity and promoters, and source-of-funds verification are mandatory. Where 10 or more qualified applicants register, allotment is by competitive bid &amp; auction. The league's decision is final.</div>
  ${foot(5)}
</div></div>

<!-- P6 · REVENUE MODEL + CONVERSION -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>4 · How a Franchise Earns — Five Streams</h2>
  <div class="card"><b class="t">① 25% of player registration &amp; Phase-2 revenue — after league operational costs</b>Phase-1: ₹299 / ₹399 · Phase-2 (trials &amp; auction eligibility): ₹2,000 / ₹3,000. <b>25% of this pool is shared equally among the 10 franchises</b> — computed on revenue <b>net of GST and net of the league's actual operational costs</b> (tournament conduct, trials, grounds and other operating expenses, deducted on actuals). Figures in this document are net of 18% GST but shown before operational-cost deduction — actual payouts will be lower to that extent. <span style="color:#B3261E">#</span></div>
  <div class="card"><b class="t">② 40% of league sponsorship revenue</b>Title, associate and partner sponsors pay to reach the league's corporate audience. <b>40% of central sponsorship revenue is distributed equally among the franchises.</b></div>
  <div class="card"><b class="t">③ Jersey / T-shirt sponsorship — 100% yours</b>Whatever sponsors your team signs for its own jersey and kit, <b>that revenue belongs entirely to the franchise</b> — the league takes no share. The outlook pages include an illustrative jersey-sponsorship line for each growth path. <span style="color:#B3261E">#</span></div>
  <div class="card"><b class="t">④ Prize money — 50% of winnings to the owner</b>Winning team prize <b>₹3 Cr</b>: ₹1.5 Cr to the franchise owner, ₹1.5 Cr to the players. Runner-up prize <b>₹2 Cr</b>: ₹1 Cr to the owner, ₹1 Cr to the players. <b>Only the winning and runner-up teams receive this</b> — it is performance-based and is therefore not included in the P&amp;L projections. <span style="color:#B3261E">#</span></div>
  <div class="card"><b class="t">⑤ 25% of central media income — from Year 4</b>In early seasons the league invests in broadcast distribution (a league cost, never charged to franchises). Once broadcast turns revenue-positive, 25% of central media income also flows to the franchises.</div>

  <h2 style="margin-top:14px">5 · Season 6 — What Conversion Does to Your Share <span style="color:#B3261E">#</span></h2>
  <p>With <b>2,00,000 Phase-1 registrations</b>, ₹3 Cr league sponsorship and ₹20 lakh own jersey sponsorship in Season 6, the per-team revenue at different Phase-2 conversion rates:</p>
  <table>
    <tr><th>Phase-2 conversion</th><th>Phase-2 revenue (net)</th><th>Per-team revenue</th></tr>
    ${conv2L.map((r) => `<tr${r.c === 30 || r.c === 50 || r.c === 60 ? ' class="hl"' : ""}><td><b>${r.c}%</b> of registrations${r.c === 30 ? '<span class="tag">conservative</span>' : r.c === 50 ? '<span class="tag">base case</span>' : r.c === 60 ? '<span class="tag">strong</span>' : ""}</td><td>₹${f2(r.p2)} Cr</td><td><b>₹${f2(r.perTeam)} Cr</b></td></tr>`).join("")}
  </table>
  <p class="dim">Per-team revenue = [25% × (Phase-1 + Phase-2 net revenue) + 40% × league sponsorship] ÷ 10 teams + own jersey sponsorship. Registration pool is before league operational-cost deduction (deducted on actuals).</p>
  ${HASHNOTE}
  ${foot(6)}
</div></div>

${scenarioPage(7, 6, "A", "Steady Growth", "2 → 3 → 5 → 8 → 10 lakh registrations · jersey ₹20L → ₹1.5 Cr", A,
  "Per-team revenue (₹ Cr, illustrative)",
  `<div class="note danger"><b>Straight talk:</b> at steady-growth scale the revenue streams do not yet cover the ≈ ₹5 Cr annual commitment even at strong conversion — at this scale ownership is a brand, network and early-position play. No assured returns exist in franchise sport — we show this honestly.</div>`)}

${scenarioPage(8, 7, "B", "High Growth", "5 → 10 → 15 → 20 → 25 lakh registrations · jersey ₹50L → ₹2 Cr", B,
  "Per-team revenue (₹ Cr, illustrative)",
  `<div class="note">With jersey sponsorship included, the franchise turns season-positive materially earlier at 50–60% conversion. <b>Actual results depend entirely on actual registrations, conversion, sponsorship, operational costs and the team's own jersey deals; nothing here is a promise or assurance of any return.</b></div>`)}

${scenarioPage(9, 8, "C", "Ultra High Growth", "10 → 20 → 30 → 40 → 50 lakh · jersey ₹1 Cr → ₹3 Cr", C,
  "Per-team revenue (₹ Cr, illustrative)",
  `<div class="note">At ultra scale the franchise is season-positive early, with the full upside of owning a team from the league's early years — plus 100% of its own jersey sponsorship. <b>Illustrative only; no income or return is promised or assured.</b></div>`)}

<!-- P10 · APPLICATION PROCESS + PAYMENT TIMELINE + CHECKLIST -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>9 · From Enquiry to Match Day — Process &amp; Payment Timeline</h2>
  <div class="step"><div class="stepnum">1</div><div class="stepbody"><b>Expression of interest</b> — write to <b>franchisee@bcplt20.com</b> with your company name and preferred city. The Founder's Office responds with the application pack. <span class="dim">No payment at this stage.</span></div></div>
  <div class="step"><div class="stepnum">2</div><div class="stepbody"><b>Bid registration — ₹2,00,000 (one-time, non-refundable)</b> — submit the application form, the document checklist below, and the bid registration fee. This admits you to the allotment process whether or not a franchise is ultimately allotted.</div></div>
  <div class="step"><div class="stepnum">3</div><div class="stepbody"><b>Verification</b> — KYC of the applicant entity and promoters, background check and source-of-funds verification. The league may seek clarifications; incomplete files are not processed.</div></div>
  <div class="step"><div class="stepnum">4</div><div class="stepbody"><b>Allotment</b> — where 10 or more qualified applicants register, allotment is by competitive bid &amp; auction; otherwise by the league's evaluation. City assignment and team-name approval follow. The league's decision is final.</div></div>
  <div class="step"><div class="stepnum">5</div><div class="stepbody"><b>Franchise Agreement + season franchise fee — ₹3 Cr</b> — sign the Franchise Agreement and pay the season's franchise fee by the due date it specifies. Team branding (name, colours, logo) is finalised with league approval.</div></div>
  <div class="step"><div class="stepnum">6</div><div class="stepbody"><b>Auction purse funding — ₹1 Cr</b> — fund the full purse before the player auction date notified by the league; build your squad at the auction.</div></div>
  <div class="step"><div class="stepnum">7</div><div class="stepbody"><b>Season operations</b> — run team operations to league minimum standards (≈ ₹1 Cr indicative): 5-star player accommodation, Indian-team-grade kit, team management, travel; plus group-stage Man-of-the-Match prizes &amp; trophies (≈ ₹5–10 lakh, owner-borne).</div></div>
  <div class="step"><div class="stepnum">8</div><div class="stepbody"><b>Post-season settlement</b> — after season-end reconciliation of central revenues (registrations, sponsorship, media), your revenue share is computed and paid as per the Franchise Agreement schedule, with a season statement.</div></div>
  <h3>Document checklist — keep ready before applying</h3>
  <table>
    <tr><th>Applicant entity</th><th>Promoters / directors</th><th>Financial</th></tr>
    <tr>
      <td>Certificate of Incorporation · MOA &amp; AOA · Company PAN · GST registration · Board resolution authorising the application &amp; signatory · Shareholding pattern</td>
      <td>PAN and Aadhaar/passport of each promoter and authorised signatory · Recent photographs · Directorship &amp; interest disclosures</td>
      <td>Last 3 years' audited financial statements · Net-worth certificate (CA-certified) · Source-of-funds declaration · Bank reference letter</td>
    </tr>
  </table>
  <p class="dim">All payment due dates are set by the Franchise Agreement and allotment letter. Non-payment by a due date is a material breach (see Key Terms). GST applies extra on all fees as per law.</p>
  ${foot(10)}
</div></div>

<!-- P11 · RESPONSIBILITY MATRIX -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>10 · Who Does What — So There Are No Surprises</h2>
  <p>The league runs the machinery; the franchise builds and runs the team. This split is contractual — here is the complete picture:</p>
  <table>
    <tr><th style="width:38%">Area</th><th style="text-align:center">League (at league cost)</th><th style="text-align:center">Franchise (at franchise cost)</th></tr>
    <tr><td>Player registrations, payments &amp; digital platform (bcplt20.com)</td><td style="text-align:center">✔</td><td style="text-align:center">—</td></tr>
    <tr><td>Player KYC, video assessment &amp; physical trials</td><td style="text-align:center">✔</td><td style="text-align:center">—</td></tr>
    <tr><td>Grounds, umpires, match officials &amp; match-day conduct</td><td style="text-align:center">✔</td><td style="text-align:center">—</td></tr>
    <tr><td>Live scoring, points tables, league digital coverage</td><td style="text-align:center">✔</td><td style="text-align:center">—</td></tr>
    <tr><td>Broadcast &amp; media distribution (league investment in early seasons)</td><td style="text-align:center">✔</td><td style="text-align:center">—</td></tr>
    <tr><td>Central sponsorship sales (title / associate / partner)</td><td style="text-align:center">✔ <span class="dim">(40% shared)</span></td><td style="text-align:center">—</td></tr>
    <tr><td>Player auction — conduct &amp; player pool</td><td style="text-align:center">✔</td><td style="text-align:center">purse ₹1 Cr</td></tr>
    <tr><td>Winner / runner-up prize money</td><td style="text-align:center">✔</td><td style="text-align:center">—</td></tr>
    <tr><td>Squad selection, coaching &amp; team management</td><td style="text-align:center">—</td><td style="text-align:center">✔</td></tr>
    <tr><td>Player accommodation (5-star mandated) &amp; team travel</td><td style="text-align:center">—</td><td style="text-align:center">✔</td></tr>
    <tr><td>Jerseys &amp; kit (Indian-team grade mandated)</td><td style="text-align:center">—</td><td style="text-align:center">✔</td></tr>
    <tr><td>Team jersey/kit sponsorship sales</td><td style="text-align:center">—</td><td style="text-align:center">✔ <span class="dim">(100% yours)</span></td></tr>
    <tr><td>Group-stage Man-of-the-Match prizes &amp; trophies</td><td style="text-align:center">—</td><td style="text-align:center">✔ <span class="dim">(≈ ₹5–10 L/yr)</span></td></tr>
    <tr><td>Team branding &amp; local marketing (within league guidelines)</td><td style="text-align:center">approval</td><td style="text-align:center">✔</td></tr>
  </table>
  <div class="note"><b>Standards enforcement:</b> the league prescribes and audits minimum standards for player welfare, accommodation, kit and conduct. Persistent failure to meet standards is a material breach of the Franchise Agreement.</div>
  <div class="note"><b>One point of contact:</b> every franchise gets a named league contact in the Founder's Office for operations, payments and approvals — so answers come from one desk, in writing.</div>
  ${foot(11)}
</div></div>

<!-- P12 · RISK FACTORS -->
<div class="page">${WM}<div class="band"></div><div class="inner legal">
  <h2>11 · Risk Factors — A Candid Statement</h2>
  <p style="font-size:11.5px">We would rather you read this page twice than be surprised once. Each of the following can materially affect franchise economics; none is exhaustive:</p>
  <ol>
    <li><b>Possibility of sustained losses.</b> The Steady-Growth outlook itself shows season-level losses at every conversion rate. A franchise may lose money for multiple consecutive seasons, and the five-season cumulative result may be negative.</li>
    <li><b>Registration &amp; conversion risk.</b> All revenue pools depend first on actual player registrations and Phase-2 conversion. These may be materially below the assumptions marked # in this document, and may decline season on season.</li>
    <li><b>Sponsorship &amp; media risk.</b> League sponsorship and media income depend on third-party contracts that may not materialise, may be smaller than assumed, or may be cancelled. Media share begins only if and when broadcast turns revenue-positive.</li>
    <li><b>Early-stage league risk.</b> BCPL is an early-stage league without the operating history of established leagues. Formats, cities, calendars and commercial results can change materially between seasons.</li>
    <li><b>Cost risk.</b> Team operating costs (≈ ₹1 Cr indicative) can exceed estimates — hotel rates, travel, kit and staffing are market-priced. League minimum standards must be met regardless of cost.</li>
    <li><b>Operational-cost deduction.</b> The 25% registration pool is computed after deduction of the league's actual operational costs; the figures in this document are shown before that deduction, so actual pool payouts will be lower to that extent.</li>
    <li><b>Illiquidity.</b> The 5-year lock-in means the franchise cannot be sold or transferred during that period. There is no assurance of any buyer, price or exit thereafter.</li>
    <li><b>Regulatory &amp; tax risk.</b> Changes in law — sports regulation, data protection, GST/tax treatment, payment or gaming regulation — can affect league operations and franchise economics.</li>
    <li><b>Reputational &amp; conduct risk.</b> Conduct events involving any team, player or official can affect the league as a whole and each franchise's commercial value.</li>
    <li><b>Force majeure.</b> Seasons may be shortened, relocated or cancelled for events beyond the league's control (weather, public-order, health emergencies, venue loss), with consequences as set out in the Franchise Agreement.</li>
    <li><b>Dependence on the league.</b> Central revenue collection, tournament conduct and brand stewardship rest with the league; a franchise's central-pool income depends on the league performing these functions.</li>
  </ol>
  <div class="note danger"><b>Decision rule we suggest:</b> commit only capital whose loss over five seasons would not impair your core business, and treat every # figure as an assumption to stress-test with your own advisors — not as a forecast to rely on.</div>
  ${foot(12)}
</div></div>

<!-- P13 · FAQ 1 -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>12 · Frequently Asked Questions <span class="dim" style="font-size:13px">(so you don't have to call — but you always can)</span></h2>
  <h3>Money in — fees &amp; costs</h3>
  ${faq("Is the ₹3 Cr franchise fee one-time?", "No. It is <b>per season</b> — ₹3 Cr every season, flat, with no increase for five seasons. Over Seasons 1–5 the total franchise fee is ₹15 Cr. GST applies extra as per law.")}
  ${faq("What is my total outlay in a season?", "Franchise fee ₹3 Cr + auction purse ₹1 Cr + team operations ≈ ₹1 Cr (indicative) ≈ <b>₹5 Cr</b>, plus group-stage Man-of-the-Match prizes &amp; trophies ≈ ₹5–10 lakh (owner-borne, not fixed).")}
  ${faq("Is the ₹2,00,000 bid registration fee refundable if I am not allotted a franchise?", "No. It is one-time and non-refundable in all circumstances, including non-allotment.")}
  ${faq("When do I pay what?", "Bid registration fee with your application; season franchise fee on signing/each season per the Franchise Agreement due dates; auction purse in full before the player auction; operations through the season. Exact due dates come in your allotment letter and Franchise Agreement.")}
  ${faq("Can the purse or fee change?", "The franchise fee is contractually flat for five seasons. The ₹1 Cr purse is fixed for the next 2–3 seasons and reviewed by the league thereafter — any change applies equally to all 10 franchises.")}
  <h3>Money out — revenue &amp; payouts</h3>
  ${faq("Exactly what revenue do I receive?", "Five streams: <b>25%</b> of registration + Phase-2 revenue (shared equally among 10 teams, net of GST, gateway charges, refunds and league operational costs on actuals) · <b>40%</b> of central sponsorship (shared equally) · <b>100%</b> of your own jersey/kit sponsorship · prize money if you win (₹1.5 Cr owner share) or finish runner-up (₹1 Cr owner share) · <b>25%</b> of central media income once broadcast turns revenue-positive (projected from Year 4).")}
  ${faq("When and how is my share paid?", "After season-end reconciliation of actually-received central revenues, per the payment schedule in the Franchise Agreement, with a season statement showing the computation.")}
  ${faq("Are the revenue numbers in this document guaranteed?", "No — this matters: every figure marked <b style='color:#B3261E'>#</b> is an illustrative assumption only. No revenue, profit, break-even or return of any kind is promised or assured. The Steady-Growth outlook honestly shows losses.")}
  ${faq("Why is the registration pool 'net of operational costs'?", "The 25% pool is computed on registration revenue after GST and after the league's actual costs of conducting the tournament and trials (grounds, operations) — deducted on actuals. The tables in this document are shown before that deduction, so actual payouts will be lower to that extent.")}
  ${faq("Who pays the winner and runner-up prize money?", "The league. Winner ₹3 Cr (₹1.5 Cr owner / ₹1.5 Cr players); runner-up ₹2 Cr (₹1 Cr / ₹1 Cr). Only those two teams receive prize money; group-stage MoM prizes are borne by each franchise.")}
  ${foot(13)}
</div></div>

<!-- P14 · FAQ 2 -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2 style="visibility:hidden;height:0;margin:0">FAQ continued</h2>
  <h3>Ownership, team &amp; control</h3>
  ${faq("Can I name the team after my company?", "Yes — franchise naming after the owner's company is permitted, subject to league brand guidelines and written approval. Team colours and logo are finalised the same way.")}
  ${faq("Can I sell the franchise later?", "Not before the <b>5-year lock-in</b> ends — no sale, assignment or transfer in whole during that period. After 3 years you may induct a co-owner holding up to 50%, with the league's prior written consent and KYC of the incoming co-owner.")}
  ${faq("How do I get players? Can I sign anyone I want?", "Squads are built at the league player auction from the pool of trial-qualified players, using your ₹1 Cr purse. This keeps all 10 teams on equal footing and every player verified and merit-assessed.")}
  ${faq("What exactly do I have to organise myself?", "Squad and coaching decisions, team management, 5-star player accommodation, team travel, Indian-team-grade jerseys/kit, your own jersey sponsorships, local team marketing (within guidelines) and group-stage MoM prizes. Everything else — grounds, umpires, scoring, platform, trials, auction conduct, central sponsorship, broadcast — is run by the league at league cost.")}
  ${faq("Do I get access to player/participant data?", "Only aggregated and/or consent-based insights, in compliance with the Digital Personal Data Protection Act, 2023 and league privacy policies. Raw participant data is never transferred, and permitted data must be deleted on termination.")}
  <h3>Process &amp; legal</h3>
  ${faq("How is a franchise allotted? Can I choose my city?", "You state your preferred city when applying. Where 10 or more qualified applicants register, allotment is by competitive bid &amp; auction. City assignment and allotment decisions of the league are final.")}
  ${faq("What documents do I need to apply?", "The checklist on the process page: entity incorporation documents, PAN, GST, board resolution, shareholding pattern; promoter KYC; 3 years' audited financials, net-worth certificate, source-of-funds declaration and a bank reference.")}
  ${faq("Is this an investment scheme? What legal protection do I have?", "No. A BCPL franchise is a commercial sports-team ownership and revenue-sharing arrangement — not a security, deposit or investment product, and no return is assured. Your rights and protections are exactly those in the signed Franchise Agreement — which is why we ask you to have it reviewed by your own advisors.")}
  ${faq("What happens if a season is cancelled or shortened?", "The force-majeure provisions of the Franchise Agreement apply — they set out the consequences for fees and obligations. No consequential-loss claims lie against the league.")}
  ${faq("Whom do I contact, and how fast will I get answers?", "The Franchise Desk at <b>franchisee@bcplt20.com</b> / +91 83684 44754 — handled directly by the Founder's Office, which is also your single named contact after allotment. Every material answer is given in writing.")}
  <div class="note">A question not covered here? Ask it once in writing — the answer becomes part of your pre-signing record.</div>
  ${foot(14)}
</div></div>

<!-- P15 · LEGAL -->
<div class="page">${WM}<div class="band"></div><div class="inner legal">
  <h2>13 · Key Terms &amp; Conditions</h2>
  <ol>
    <li><b>Nature of arrangement.</b> A BCPL franchise is a commercial sports-team ownership and revenue-sharing arrangement with BCPL Sports Private Limited ("the League"). It is <b>not</b> a security, deposit, collective investment scheme, partnership, franchise under any statutory franchise law, or financial product, and is not marketed as one.</li>
    <li><b>No assured returns.</b> All revenue figures, charts and projections in this document (marked #) are illustrative assumptions only — the League's own thinking about the future, which may or may not materialise. The League makes <b>no representation, warranty or guarantee of any revenue, profit, break-even timeline or return</b>. Actual results may be higher or lower than shown. Franchise owners may incur losses, including sustained losses across multiple seasons, as the Steady-Growth outlook itself illustrates.</li>
    <li><b>Fees.</b> (a) The ₹2,00,000 bid registration fee is one-time and non-refundable in all circumstances, including non-allotment. (b) The league franchise fee is <b>₹3 Cr per season, flat and identical for all franchises, with no increment for five seasons</b> (aggregate ₹15 Cr over Seasons 1–5), payable every season. (c) The auction purse (currently ₹1 Cr) must be funded in full each season. (d) Team operating costs are the franchise's responsibility and must meet League minimum standards (player accommodation, kit, management). (e) Group-stage Man-of-the-Match prizes and trophies are borne by the franchise (indicatively ₹5–10 lakh per season; not fixed). Non-payment of any seasonal amount by its due date is a material breach.</li>
    <li><b>Lock-in &amp; transfer.</b> The franchise is subject to a <b>minimum lock-in of five (5) years</b>, during which it cannot be sold, assigned or transferred in whole. After completion of three (3) years, the owner may induct a co-owner holding up to 50% of the franchise, subject to the League's prior written consent, KYC and verification of the incoming co-owner. Any transfer, pledge or change of control otherwise requires prior written League consent.</li>
    <li><b>Allotment.</b> Where ten or more qualified applications are received for available slots, allotment is by competitive bid/auction. The League's decision on eligibility, allotment, team naming and city assignment is final and binding.</li>
    <li><b>Eligibility &amp; verification.</b> Applicants must pass KYC, background and source-of-funds verification. The League may reject any application without assigning reasons, with no liability other than obligations expressly stated in a signed agreement.</li>
    <li><b>Revenue share.</b> Pool percentages (25% registration/Phase-2, 40% sponsorship, 25% media) are computed on <b>actually-received</b> central revenue net of applicable taxes (including GST), payment-gateway charges, refunds, statutory deductions and — for the registration/Phase-2 pool — <b>the League's operational costs of conducting the tournament, trials and related activities, deducted on actuals</b>, and distributed equally among active, fully-paid-up franchises per the Franchise Agreement. Jersey/kit sponsorship signed by a franchise for its own team belongs 100% to that franchise, subject to League brand and category guidelines. Registration revenue depends on actual participation; sponsorship and media figures depend on third-party contracts that may or may not materialise. No minimum pool size is guaranteed.</li>
    <li><b>Prize money.</b> The winning team's prize (currently ₹3 Cr) is split ₹1.5 Cr to the franchise owner and ₹1.5 Cr to the players; the runner-up prize (currently ₹2 Cr) is split ₹1 Cr to the owner and ₹1 Cr to the players. Prize money is payable only to the winning and runner-up teams of a season, is subject to change by the League before each season, and is not an assured payment to any franchise.</li>
    <li><b>League standards.</b> The League may prescribe and update minimum standards for player welfare, accommodation, kit, conduct and match operations. Persistent failure to meet standards is a material breach.</li>
    <li><b>Data protection.</b> Any sharing of participant information is limited to aggregated and/or consent-based data, in compliance with the Digital Personal Data Protection Act, 2023 and League privacy policies. Franchises must not use participant data outside the permitted purpose, must not transfer it to any third party, and must delete it on termination.</li>
    <li><b>Branding &amp; IP.</b> Team names incorporating the owner's company name require League approval and must comply with League brand, advertising and content standards. All League IP (name, marks, footage, data, formats) remains the League's property; the franchise receives only a limited, non-transferable seasonal licence.</li>
    <li><b>Conduct &amp; compliance.</b> Franchises, their owners and personnel must comply with applicable law (including anti-corruption, anti-money-laundering and betting/gaming laws), League anti-corruption and conduct codes, and must not engage in conduct harming the League's reputation.</li>
    <li><b>Term &amp; termination.</b> Franchise rights are granted per season/term as per the Franchise Agreement. Material breach, non-payment, insolvency or reputational-risk events may lead to suspension or termination; fees already paid are non-refundable on termination for cause.</li>
    <li><b>Force majeure.</b> Seasons may be shortened, relocated or cancelled for events beyond the League's control; the Franchise Agreement sets out the consequences. No consequential-loss claims lie against the League.</li>
    <li><b>Taxes.</b> Each party bears its own taxes. GST and withholding taxes apply as per law on all fees and distributions.</li>
    <li><b>Governing law &amp; disputes.</b> Governed by the laws of India; disputes are subject to arbitration under the Arbitration and Conciliation Act, 1996 (sole arbitrator, seat New Delhi, English language) and the exclusive jurisdiction of the courts at New Delhi.</li>
    <li><b>Entire understanding.</b> This prospectus is for information only. Only a signed Franchise Agreement (with schedules) creates binding rights and obligations; in case of conflict, the Franchise Agreement prevails over this document. The League may modify the programme, fees and terms at any time before signing.</li>
  </ol>
  ${foot(15)}
</div></div>

<!-- P16 · CONFIDENTIALITY + CONTACT + ACKNOWLEDGMENT -->
<div class="page">${WM}<div class="band"></div><div class="inner legal">
  <h2>14 · Confidentiality — Read Before Sharing</h2>
  <div class="note danger" style="font-size:12.5px"><b>This document is strictly confidential.</b> It is issued to the named recipient alone, solely to evaluate BCPL franchise participation. <b>You may not share, forward, copy, photograph, publish or disclose this document or its contents to any person whatsoever</b> — not to advisors, associates, media or any third party — without the League's prior written consent. By retaining this document you accept these obligations as binding. Unauthorised disclosure or use may cause the League serious commercial harm and will entitle the League to injunctive relief, damages and any other remedy available in law, and will disqualify the recipient from the franchise process. If you do not agree, delete/return this document immediately.</div>
  <h3>Disclaimer</h3>
  <p>This document does not constitute financial, legal or tax advice; recipients should take independent professional advice before applying. It is not an offer or solicitation of securities or deposits and no return is promised or assured. All projections marked # are illustrative assumptions only — the League's own estimates of the future, which may or may not materialise; actual outcomes may differ materially, higher or lower. GST and other taxes apply as per law. GST registration of BCPL Sports Private Limited is in progress; statutory details will be provided in the Franchise Agreement. The League reserves the right to modify the franchise programme, fees and terms at any time prior to signing.</p>
  <h3>Contact — Franchise Desk</h3>
  <p style="font-size:14px">Email <b>franchisee@bcplt20.com</b> &nbsp;·&nbsp; Web <b>www.bcplt20.com</b> &nbsp;·&nbsp; Phone <b>+91 83684 44754</b> (Founder's Office)</p>
  <p class="dim">All franchise enquiries are handled directly by the Founder's Office. Please quote your company name and preferred city in your first message.</p>
  <h3 style="margin-top:14px">Recipient acknowledgment</h3>
  <div style="border:1.4px solid #E3D9C8;border-radius:12px;padding:12px 16px;background:#FDFBF7;font-size:10.6px;line-height:1.7">
    I acknowledge receipt of this numbered copy of the BCPL Franchise Ownership Prospectus (August 2026, v5). I have read and accept the confidentiality obligations above, and I understand that all figures marked # are illustrative assumptions only and that no income or return is promised or assured.<br/><br/>
    Name: ___________________________ &nbsp;&nbsp; Company: ___________________________ &nbsp;&nbsp; Copy No: ________<br/><br/>
    Signature: ______________________ &nbsp;&nbsp; Place: ______________________ &nbsp;&nbsp; Date: ______________________
  </div>
  ${foot(16)}
</div></div>
</body></html>`;
writeFileSync("/tmp/prospectus2.html", html);
for (const [n, D] of [["A", A], ["B", B], ["C", C]]) {
  console.log(n, "cum30/50/60:", D[4].by.map((b) => f2(b.cum)).join(" / "));
  console.log(n, "Y5 net30/50/60:", D[4].by.map((b) => f2(b.net)).join(" / "));
}
