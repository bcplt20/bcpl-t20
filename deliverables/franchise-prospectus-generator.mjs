import { writeFileSync } from "fs";

/* ── Model (all revenue figures NET of 18% GST; stated in the document) ── */
const GST = 1.18;
const avgP1 = (299 * 0.5 + 399 * 0.5) / GST;      // blended Phase-1 net fee
const avgP2 = (2000 * 0.5 + 3000 * 0.5) / GST;    // blended Phase-2 net fee
const POOL_SHARE = 0.25, TEAMS = 10, BASE_CONV = 0.30;
const cr = (x) => x / 1e7;
const f2 = (x) => x.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const f1 = (x) => x.toLocaleString("en-IN", { maximumFractionDigits: 2 });

const seasons = [
  { s: "Season 6", yr: "Year 1", regs: 200000, spons: 3, media: 0 },
  { s: "Season 7", yr: "Year 2", regs: 300000, spons: 5, media: 0 },
  { s: "Season 8", yr: "Year 3", regs: 500000, spons: 6, media: 0 },
  { s: "Season 9", yr: "Year 4", regs: 800000, spons: 7, media: 1 },
  { s: "Season 10", yr: "Year 5", regs: 1000000, spons: 8, media: 2 },
];
const FEE = 3.0, OPS = 0.75; // ₹Cr: one-time franchise fee (metro tier), per-season squad+ops assumption

let cum = -FEE;
const proj = seasons.map((x) => {
  const p1 = cr(x.regs * avgP1);
  const p2 = cr(x.regs * BASE_CONV * avgP2);
  const central = p1 + p2 + x.spons + x.media;
  const pool = central * POOL_SHARE;
  const perTeam = pool / TEAMS;
  const net = perTeam - OPS;
  cum += net;
  return { ...x, p1, p2, central, pool, perTeam, net, cum };
});

const convRows = [10, 20, 30, 40, 50, 60, 70].map((c) => {
  const p2 = cr(200000 * (c / 100) * avgP2);
  const p1 = cr(200000 * avgP1);
  const central = p1 + p2 + 3 + 0;
  const pool = central * POOL_SHARE;
  return { c, p2, central, pool, perTeam: pool / TEAMS };
});

/* bar chart (per-team revenue by season) */
const maxV = Math.max(...proj.map((p) => p.perTeam));
const bars = proj.map((p, i) => {
  const h = (p.perTeam / maxV) * 150;
  const x = 60 + i * 130;
  return `<rect x="${x}" y="${210 - h}" width="72" height="${h}" rx="6" fill="url(#g1)"/>
  <text x="${x + 36}" y="${200 - h}" text-anchor="middle" font-size="13" font-weight="800" fill="#0D1E44">₹${f2(p.perTeam)} Cr</text>
  <text x="${x + 36}" y="${232}" text-anchor="middle" font-size="11" fill="#666">${p.s}</text>
  <text x="${x + 36}" y="${247}" text-anchor="middle" font-size="10" fill="#999">${(p.regs / 100000)} lakh reg.</text>`;
}).join("");

const projRows = proj.map((p) => `<tr>
  <td><b>${p.s}</b><br/><span class="dim">${p.yr}</span></td>
  <td>${(p.regs / 100000).toFixed(0)},00,000</td>
  <td>₹${f2(p.p1)} Cr</td><td>₹${f2(p.p2)} Cr</td><td>₹${f1(p.spons)} Cr</td><td>${p.media ? "₹" + f1(p.media) + " Cr" : "—"}</td>
  <td>₹${f2(p.central)} Cr</td><td><b>₹${f2(p.perTeam)} Cr</b></td>
</tr>`).join("");

const plRows = proj.map((p) => `<tr>
  <td><b>${p.s}</b> <span class="dim">(${p.yr})</span></td>
  <td>₹${f2(p.perTeam)} Cr</td><td>₹${f2(OPS)} Cr</td>
  <td style="color:${p.net >= 0 ? "#0B7A3B" : "#B3261E"}">${p.net >= 0 ? "+" : "−"}₹${f2(Math.abs(p.net))} Cr</td>
  <td style="color:${p.cum >= 0 ? "#0B7A3B" : "#B3261E"};font-weight:800">${p.cum >= 0 ? "+" : "−"}₹${f2(Math.abs(p.cum))} Cr</td>
</tr>`).join("");

const convRowsHtml = convRows.map((r) => `<tr${r.c === 30 ? ' class="hl"' : ""}>
  <td><b>${r.c}%</b>${r.c === 30 ? ' <span class="tag">base case</span>' : ""}</td>
  <td>₹${f2(r.p2)} Cr</td><td>₹${f2(r.central)} Cr</td><td>₹${f2(r.pool)} Cr</td><td><b>₹${f2(r.perTeam)} Cr</b></td>
</tr>`).join("");

const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1f2e;font-size:11.5px;line-height:1.7}
.page{page-break-after:always;padding:0}
.page:last-child{page-break-after:auto}
h1{font-size:30px;line-height:1.25}h2{font-size:17px;color:#0D1E44;margin-bottom:10px;letter-spacing:.02em}
h3{font-size:12.5px;color:#C94E0E;margin:14px 0 5px;text-transform:uppercase;letter-spacing:.08em}
p{margin-bottom:8px}
.cover{background:linear-gradient(150deg,#060F25,#0D1E44 60%,#122B5C);color:#fff;height:270mm;padding:60px 56px;display:flex;flex-direction:column;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cover .gold{color:#E8B23D}
.band{height:5px;background:linear-gradient(90deg,#9A3408,#FF6B00,#E8B23D,#FF6B00,#9A3408);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.inner{padding:34px 48px}
table{width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:10.5px}
th{background:#0D1E44;color:#fff;padding:7px 9px;text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;-webkit-print-color-adjust:exact;print-color-adjust:exact}
td{padding:7px 9px;border-bottom:1px solid #E7E2D8;vertical-align:top}
tr:nth-child(even) td{background:#FAF7F2}
tr.hl td{background:#FFF3E4;border-top:1.5px solid #FF6B00;border-bottom:1.5px solid #FF6B00}
.tag{background:#FF6B00;color:#fff;font-size:8px;font-weight:800;border-radius:4px;padding:1px 6px;margin-left:4px;letter-spacing:.05em}
.dim{color:#8a8f9c;font-size:9.5px}
.card{border:1.2px solid #E3D9C8;border-radius:10px;padding:13px 16px;margin-bottom:10px;background:#FDFBF7}
.card b.t{color:#0D1E44;display:block;margin-bottom:3px;font-size:12px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.note{background:#FFF7EC;border-left:4px solid #FF6B00;padding:10px 14px;border-radius:0 8px 8px 0;margin:12px 0;font-size:10.5px}
.legal p,.legal li{font-size:10px;line-height:1.65;color:#3a4050}
.legal ol{margin:4px 0 10px 18px}
.legal li{margin-bottom:5px}
.foot{margin-top:18px;border-top:2px solid #FF6B00;padding-top:8px;font-size:9px;color:#777;display:flex;justify-content:space-between}
@media print{@page{size:A4;margin:0} .inner{padding:16mm 14mm} .card,.note,tr{page-break-inside:avoid} h2,h3{page-break-after:avoid}}
`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>BCPL Franchise Prospectus</title><style>${css}</style></head><body>

<!-- COVER -->
<div class="page cover">
  <div style="display:flex;align-items:center;gap:18px"><img src="file:///home/runner/workspace/artifacts/bcpl-website/public/bcpl-assets/bcpl-logo-white.png" style="height:64px"/><div style="font-size:13px;letter-spacing:.3em;color:#E8B23D;font-weight:800">BCPL SPORTS PRIVATE LIMITED</div></div>
  <div style="margin-top:130px">
    <h1>Bhartiya Corporate Premier League<br/><span class="gold">Franchise Ownership Prospectus</span></h1>
    <p style="margin-top:18px;font-size:14px;color:rgba(255,255,255,.75);max-width:520px">Own a T20 franchise in India's corporate cricket league — a five-season illustrative growth outlook, the complete revenue-sharing model, investment structure, and key terms.</p>
  </div>
  <div style="margin-top:auto">
    <div style="display:flex;gap:26px;font-size:11px;color:rgba(255,255,255,.65)">
      <span>✉ info@bcplt20.com</span><span>🌐 www.bcplt20.com</span><span>☎ +91 91513 46555</span>
    </div>
    <div style="margin-top:14px;font-size:9px;color:rgba(255,255,255,.45);max-width:640px">Private &amp; confidential. This document is an invitation to explore franchise participation only — it is not an offer of securities, a deposit scheme, or an investment product, and it does not promise or assure any return. All projections are illustrative assumptions, not commitments. Franchise fee for the current season: ₹3 Cr (metro tier); the fee base increases 10% each season.</div>
  </div>
</div>

<!-- WHY + BENEFITS -->
<div class="page"><div class="band"></div><div class="inner">
  <h2>1 · Why a BCPL Franchise</h2>
  <p>BCPL is a professional Twenty-20 cricket league for working professionals. Registration for the league is pan-India and digital-first: players register online, submit performance videos, and progress through a two-phase selection funnel into city trials and the franchise player auction.</p>
  <div class="grid2">
    <div class="card"><b class="t">🏢 Your company's name on the team</b>The franchise may be named after the owner's company (subject to league brand guidelines) — every match, jersey, scorecard and broadcast carries your corporate brand.</div>
    <div class="card"><b class="t">🎯 A pure corporate audience</b>League participants are working professionals — a high-value, hard-to-reach audience for B2B and consumer brands alike.</div>
    <div class="card"><b class="t">📊 Consent-based participant insights</b>Franchises receive aggregated, consent-based engagement insights about participants connected to their team, and co-branded communication opportunities through official league channels — always within applicable Indian data-protection law (DPDP Act, 2023).</div>
    <div class="card"><b class="t">📈 Three revenue streams</b>A 25% central revenue pool shared across franchises: (1) player registration &amp; Phase-2 fees, (2) league sponsorship, and (3) central media income once broadcast turns revenue-positive.</div>
  </div>
  <h2 style="margin-top:18px">2 · Investment Structure</h2>
  <table>
    <tr><th>Item</th><th>Amount</th><th>Notes</th></tr>
    <tr><td>Bid registration fee</td><td><b>₹2,00,000</b></td><td>One-time, non-refundable, per applicant — payable to enter the bid process (covers evaluation &amp; processing), whether or not a franchise is allotted.</td></tr>
    <tr><td>Franchise fee — Metro tier</td><td><b>₹3 Cr</b></td><td rowspan="3">Current-season base. The league franchise fee base increases by <b>10% every season</b> — joining earlier locks a lower base. Where 10 or more qualified applicants register, allotment is by bid &amp; auction.</td></tr>
    <tr><td>Franchise fee — Tier-2 city</td><td><b>₹2 Cr</b></td></tr>
    <tr><td>Franchise fee — Premium metro</td><td><b>₹5 Cr</b></td></tr>
  </table>
  <div class="note"><b>Eligibility:</b> clean legal &amp; financial background, KYC of the applicant entity and its promoters, and source-of-funds verification are mandatory. The league's decision on allotment is final.</div>
  <div class="foot"><span>BCPL Franchise Prospectus</span><span>BCPL Sports Private Limited · Strictly Confidential</span><span>Page 2</span></div>
</div></div>

<!-- REVENUE MODEL + SCENARIOS -->
<div class="page"><div class="band"></div><div class="inner">
  <h2>3 · The Revenue-Sharing Model</h2>
  <p><b>25% of the league's central revenue pool</b> is distributed equally among the ${TEAMS} franchises each season. The pool has three components:</p>
  <div class="card"><b class="t">① Player registration &amp; Phase-2 fees</b>Phase-1 registration: ₹299 (standard roles) / ₹399 (all-rounder). Phase-2 (trial &amp; auction eligibility): ₹2,000 / ₹3,000. All figures in this document use fee amounts <b>net of 18% GST</b> and a 50:50 role mix (blended Phase-1 ≈ ₹296, Phase-2 ≈ ₹2,119 net per player).</div>
  <div class="card"><b class="t">② League sponsorship</b>Central league sponsorship (title, associate and partner sponsors). Illustrative trajectory: ₹3 Cr → ₹5 Cr → ₹6 Cr → ₹7 Cr → ₹8 Cr over five seasons.</div>
  <div class="card"><b class="t">③ Central media income (from Year 4)</b>In early seasons the league invests in broadcast distribution (a league cost — not charged to franchises). Once broadcast turns revenue-positive — assumed from Season 9 — 25% of central media income also flows into the same franchise pool.</div>

  <h2 style="margin-top:16px">4 · Season 6 — Phase-2 Conversion Scenarios</h2>
  <p>Assuming <b>2,00,000 Phase-1 registrations</b> in Season 6 and ₹3 Cr league sponsorship, per-team share at different Phase-2 conversion rates:</p>
  <table>
    <tr><th>Phase-2 conversion</th><th>Phase-2 revenue (net)</th><th>Central revenue*</th><th>25% franchise pool</th><th>Per team (÷${TEAMS})</th></tr>
    ${convRowsHtml}
  </table>
  <p class="dim">*Central revenue = Phase-1 (₹${f2(cr(200000 * avgP1))} Cr net) + Phase-2 + sponsorship (₹3 Cr). Media income is nil in Season 6.</p>
  <div class="foot"><span>BCPL Franchise Prospectus</span><span>BCPL Sports Private Limited · Strictly Confidential</span><span>Page 3</span></div>
</div></div>

<!-- 5 SEASON PROJECTION -->
<div class="page"><div class="band"></div><div class="inner">
  <h2>5 · Five-Season Illustrative Growth Outlook</h2>
  <p>Base-case assumptions: registrations grow 2 → 3 → 5 → 8 → 10 lakh; ${BASE_CONV * 100}% Phase-2 conversion; sponsorship ₹3/5/6/7/8 Cr; central media income from Season 9.</p>
  <svg width="720" height="260" viewBox="0 0 720 260" style="display:block;margin:6px auto 4px">
    <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6B00"/><stop offset="1" stop-color="#C94E0E"/></linearGradient></defs>
    <line x1="40" y1="210" x2="700" y2="210" stroke="#D8CDBB" stroke-width="1.5"/>
    ${bars}
    <text x="40" y="20" font-size="12" font-weight="800" fill="#0D1E44">Per-team revenue share (₹ Cr, illustrative)</text>
  </svg>
  <table>
    <tr><th>Season</th><th>Registrations</th><th>Phase-1 (net)</th><th>Phase-2 (net, ${BASE_CONV * 100}%)</th><th>Sponsorship</th><th>Media</th><th>Central revenue</th><th>Per-team share</th></tr>
    ${projRows}
  </table>

  <div class="foot"><span>BCPL Franchise Prospectus</span><span>BCPL Sports Private Limited · Strictly Confidential</span><span>Page 4</span></div>
</div></div>

<!-- P&L -->
<div class="page"><div class="band"></div><div class="inner">
  <h2>6 · Illustrative Franchise P&amp;L (Metro tier, ₹3 Cr one-time fee)</h2>
  <p>Assumes ₹${f2(OPS)} Cr per season for squad (auction purse) and team operations. Cumulative position includes the one-time ₹3 Cr franchise fee paid at entry.</p>
  <table>
    <tr><th>Season</th><th>Revenue share</th><th>Squad + operations</th><th>Season net</th><th>Cumulative position</th></tr>
    ${plRows}
  </table>
  <div class="note">The illustrative base case shows initial seasons in deficit, with the cumulative position approaching break-even around Year 4–5 as registrations, sponsorship and media income scale. <b>Actual results depend entirely on actual registrations, conversion, sponsorship and costs, and may be materially lower or higher. Nothing in this outlook is a promise, forecast or assurance of any income or return.</b></div>
  <div class="foot"><span>BCPL Franchise Prospectus</span><span>BCPL Sports Private Limited · Strictly Confidential</span><span>Page 5</span></div>
</div></div>

<!-- LEGAL -->
<div class="page"><div class="band"></div><div class="inner legal">
  <h2>7 · Key Terms &amp; Conditions</h2>
  <ol>
    <li><b>Nature of arrangement.</b> A BCPL franchise is a commercial sports-team ownership and revenue-sharing arrangement with BCPL Sports Private Limited ("the League"). It is <b>not</b> a security, deposit, collective investment scheme, partnership, or financial product, and is not marketed as one.</li>
    <li><b>No assured returns.</b> All revenue figures, charts and projections in this document are illustrative assumptions only. The League makes <b>no representation, warranty or guarantee of any revenue, profit, break-even timeline or return</b>. Franchise owners may incur losses.</li>
    <li><b>Fees.</b> The ₹2,00,000 bid registration fee is one-time and non-refundable in all circumstances, including non-allotment. The franchise fee is payable as per the executed Franchise Agreement; the league fee base increases by 10% per season for new allotments.</li>
    <li><b>Allotment.</b> Where ten or more qualified applications are received for available slots, allotment is by competitive bid/auction. The League's decision on eligibility, allotment, team naming and city assignment is final and binding.</li>
    <li><b>Eligibility &amp; verification.</b> Applicants must pass KYC, background and source-of-funds verification. The League may reject any application without assigning reasons, with no liability other than obligations expressly stated in a signed agreement.</li>
    <li><b>Revenue share.</b> The 25% central pool is computed on actually-received central revenue net of applicable taxes (including GST), payment-gateway charges and statutory deductions, and is distributed equally among active franchises per the Franchise Agreement. Registration and Phase-2 fee revenue depends on actual participation; sponsorship and media figures depend on third-party contracts that may or may not materialise.</li>
    <li><b>Data protection.</b> Any sharing of participant information is limited to aggregated and/or consent-based data, in compliance with the Digital Personal Data Protection Act, 2023 and League privacy policies. Franchises must not use participant data outside the permitted purpose.</li>
    <li><b>Branding.</b> Team names incorporating the owner's company name require League approval and must comply with League brand, advertising and content standards. All League IP remains the League's property.</li>
    <li><b>Costs borne by franchise.</b> Squad acquisition (auction purse), team operations, staff and local marketing are the franchise's responsibility unless expressly assumed by the League in writing.</li>
    <li><b>Term, termination &amp; transfer.</b> Franchise rights are granted per season/term as per the Franchise Agreement; transfer or sale of a franchise requires prior written League consent. Material breach, insolvency, or reputational-risk events may lead to suspension or termination as per the agreement.</li>
    <li><b>Governing law &amp; disputes.</b> Governed by the laws of India; disputes are subject to arbitration under the Arbitration and Conciliation Act, 1996, seat New Delhi, and the exclusive jurisdiction of the courts at New Delhi.</li>
    <li><b>Entire understanding.</b> This prospectus is for information only. Only a signed Franchise Agreement (with its schedules) creates binding rights and obligations; in case of conflict, the Franchise Agreement prevails over this document.</li>
  </ol>
  <h3>Disclaimer</h3>
  <p>This document is confidential and intended solely for the recipient. It does not constitute financial, legal or tax advice; recipients should take independent professional advice before applying. GST and other taxes apply as per law. BCPL Sports Private Limited reserves the right to modify the franchise programme, fees and terms at any time prior to signing of the Franchise Agreement. GST registration of BCPL Sports Private Limited is in progress; statutory details will be provided in the Franchise Agreement.</p>
  <h3>Contact</h3>
  <p>✉ info@bcplt20.com &nbsp;·&nbsp; 🌐 www.bcplt20.com &nbsp;·&nbsp; ☎ +91 91513 46555<br/>2nd Floor Back Side, RZ-108, Indra Park, Uttam Nagar, West Delhi, Delhi — 110059</p>
  <div class="foot"><span>BCPL Franchise Prospectus</span><span>BCPL Sports Private Limited · Strictly Confidential</span><span>Page 6</span></div>
</div></div>
</body></html>`;
writeFileSync("/tmp/prospectus.html", html);
console.log("ok", html.length, "| perTeam:", proj.map(p => f2(p.perTeam)).join(", "), "| cum:", proj.map(p => f2(p.cum)).join(", "));
