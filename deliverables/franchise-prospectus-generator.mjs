import { writeFileSync } from "fs";

/* ── Model ──────────────────────────────────────────────────────────
   Revenue pools (as published on bcplt20.com/franchise):
     25% of registration+phase2 revenue, 50% of sponsorship, 25% of media
     → distributed equally among 10 franchises.
   Costs (owner's model): franchise fee ₹3 Cr EVERY season (+10%/yr),
     auction purse ₹1 Cr fixed, team ops ≈ ₹1 Cr (5-star standard).
   All revenue net of 18% GST. */
const GST = 1.18, TEAMS = 10, CONV = 0.30;
const avgP1 = (299 * 0.5 + 399 * 0.5) / GST;
const avgP2 = (2000 * 0.5 + 3000 * 0.5) / GST;
const cr = (x) => x / 1e7;
const f2 = (x) => x.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const f1 = (x) => x.toLocaleString("en-IN", { maximumFractionDigits: 1 });
const L = (n) => (n / 100000) + " lakh";

const PURSE = 1, OPS = 1;
const fee = (y) => 3 * Math.pow(1.10, y); // y=0 → ₹3 Cr Year 1

function buildScenario(regs, spons, media) {
  let cum = 0;
  return regs.map((r, i) => {
    const p1 = cr(r * avgP1), p2 = cr(r * CONV * avgP2);
    const perTeam = (0.25 * (p1 + p2) + 0.5 * spons[i] + 0.25 * media[i]) / TEAMS;
    const cost = fee(i) + PURSE + OPS;
    const net = perTeam - cost; cum += net;
    return { season: "Season " + (6 + i), year: "Year " + (i + 1), regs: r, p1, p2, spons: spons[i], media: media[i], perTeam, fee: fee(i), cost, net, cum };
  });
}
const A = buildScenario([200000, 300000, 500000, 800000, 1000000], [3, 5, 6, 7, 8], [0, 0, 0, 1, 2]);
const B = buildScenario([500000, 1000000, 1500000, 2000000, 2500000], [5, 8, 12, 16, 20], [0, 0, 1, 2, 3]);

const conv2L = [10, 20, 30, 40, 50, 60, 70].map((c) => {
  const p1 = cr(200000 * avgP1), p2 = cr(200000 * (c / 100) * avgP2);
  return { c, p2, perTeam: (0.25 * (p1 + p2) + 0.5 * 3) / TEAMS };
});

/* charts */
const BARCOLORS = ["#FF6B00", "#E8B23D", "#31C56B", "#3B82F6", "#A855F7"];
function manhattan(data, title) {
  const maxV = Math.max(...data.map((p) => p.perTeam));
  const bars = data.map((p, i) => {
    const h = Math.max(10, (p.perTeam / maxV) * 165);
    const x = 55 + i * 135;
    return `<rect x="${x}" y="${222 - h}" width="82" height="${h}" rx="8" fill="url(#bg${i})"/>
    <text x="${x + 41}" y="${210 - h}" text-anchor="middle" font-size="15" font-weight="800" fill="#0D1E44">₹${f2(p.perTeam)} Cr</text>
    <text x="${x + 41}" y="${244}" text-anchor="middle" font-size="13" font-weight="700" fill="#444">${p.season}</text>
    <text x="${x + 41}" y="${260}" text-anchor="middle" font-size="11.5" fill="#888">${p.year} · ${L(p.regs)}</text>`;
  }).join("");
  const defs = data.map((_, i) => `<linearGradient id="bg${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BARCOLORS[i]}"/><stop offset="1" stop-color="${BARCOLORS[i]}99"/></linearGradient>`).join("");
  return `<svg width="660" height="235" viewBox="0 0 740 275" style="display:block;margin:0 auto">
  <defs>${defs}</defs>
  <line x1="35" y1="222" x2="720" y2="222" stroke="#D8CDBB" stroke-width="1.5"/>
  ${bars}
  <text x="35" y="20" font-size="14" font-weight="800" fill="#0D1E44">${title}</text></svg>`;
}
function pie(slices, size = 240) {
  // slices: [{v,label,color}]
  const tot = slices.reduce((s, x) => s + x.v, 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 6;
  let a = -Math.PI / 2, paths = "", legend = "";
  slices.forEach((s, i) => {
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

const scenTable = (D) => `<table>
  <tr><th>Season</th><th>Registrations</th><th>Phase-1 (net)</th><th>Phase-2 (net, 30%)</th><th>Sponsorship</th><th>Media</th><th>Per-team share</th></tr>
  ${D.map((p) => `<tr><td><b>${p.season}</b> <span class="dim">(${p.year})</span></td><td>${L(p.regs)}</td><td>₹${f2(p.p1)} Cr</td><td>₹${f2(p.p2)} Cr</td><td>₹${f1(p.spons)} Cr</td><td>${p.media ? "₹" + f1(p.media) + " Cr" : "—"}</td><td><b>₹${f2(p.perTeam)} Cr</b></td></tr>`).join("")}
</table>`;
const plTable = (D) => `<table>
  <tr><th>Season</th><th>Revenue share</th><th>Franchise fee</th><th>Purse + Ops</th><th>Season net</th><th>Cumulative</th></tr>
  ${D.map((p) => `<tr><td><b>${p.season}</b> <span class="dim">(${p.year})</span></td><td>₹${f2(p.perTeam)} Cr</td><td>₹${f2(p.fee)} Cr</td><td>₹${f2(PURSE + OPS)} Cr</td>
  <td style="color:${p.net >= 0 ? "#0B7A3B" : "#B3261E"};font-weight:700">${p.net >= 0 ? "+" : "−"}₹${f2(Math.abs(p.net))} Cr</td>
  <td style="color:${p.cum >= 0 ? "#0B7A3B" : "#B3261E"};font-weight:800">${p.cum >= 0 ? "+" : "−"}₹${f2(Math.abs(p.cum))} Cr</td></tr>`).join("")}
</table>`;

const WM = `<div class="wm">BCPL · CONFIDENTIAL</div>`;
const foot = (n) => `<div class="foot"><span>BCPL Franchise Prospectus</span><span>BCPL Sports Private Limited · Strictly Confidential — do not share</span><span>Page ${n}</span></div>`;

const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1f2e;font-size:13.5px;line-height:1.7}
.page{page-break-after:always;position:relative;overflow:hidden}
.page:last-child{page-break-after:auto}
.wm{position:absolute;top:46%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:74px;font-weight:900;letter-spacing:.12em;color:rgba(13,30,68,0.05);white-space:nowrap;pointer-events:none;z-index:0}
.cover .wm{color:rgba(255,255,255,0.045)}
.inner{padding:36px 46px;position:relative;z-index:1}
h1{font-size:33px;line-height:1.25}
h2{font-size:20px;color:#0D1E44;margin-bottom:8px}
h3{font-size:13px;color:#C94E0E;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.07em}
p{margin-bottom:9px}
.cover{background:linear-gradient(150deg,#060F25,#0D1E44 55%,#15346B);color:#fff;height:270mm;padding:52px 52px;display:flex;flex-direction:column;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.gold{color:#E8B23D}
.band{height:6px;background:linear-gradient(90deg,#9A3408,#FF6B00,#E8B23D,#FF6B00,#9A3408);-webkit-print-color-adjust:exact;print-color-adjust:exact}
table{width:100%;border-collapse:collapse;margin:8px 0 12px;font-size:11.5px;position:relative;z-index:1}
th{background:#0D1E44;color:#fff;padding:7px 9px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;-webkit-print-color-adjust:exact;print-color-adjust:exact}
td{padding:7px 9px;border-bottom:1px solid #E7E2D8;vertical-align:top}
tr:nth-child(even) td{background:#FAF7F2}
tr.hl td{background:#FFF3E4;border-top:1.5px solid #FF6B00;border-bottom:1.5px solid #FF6B00}
.tag{background:#FF6B00;color:#fff;font-size:9.5px;font-weight:800;border-radius:4px;padding:1.5px 7px;margin-left:5px;letter-spacing:.05em}
.dim{color:#8a8f9c;font-size:11px}
.card{border:1.4px solid #E3D9C8;border-radius:12px;padding:15px 18px;margin-bottom:11px;background:#FDFBF7}
.card b.t{color:#0D1E44;display:block;margin-bottom:4px;font-size:14.5px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.note{background:#FFF7EC;border-left:5px solid #FF6B00;padding:9px 13px;border-radius:0 10px 10px 0;margin:8px 0;font-size:12px;line-height:1.6}
.danger{background:#FDECEA;border-left:5px solid #B3261E}
.statrow{display:flex;gap:12px;margin:20px 0}
.stat{flex:1;background:rgba(255,255,255,0.07);border:1px solid rgba(232,178,61,0.4);border-radius:12px;padding:16px 14px;text-align:center}
.stat .n{font-size:24px;font-weight:900;color:#E8B23D}
.stat .l{font-size:11px;color:rgba(255,255,255,0.7);margin-top:3px;letter-spacing:.05em;text-transform:uppercase}
.legal p,.legal li{font-size:10.8px;line-height:1.62;color:#333a4c}
.legal ol{margin:4px 0 12px 20px}
.legal li{margin-bottom:4px}
.foot{margin-top:12px;border-top:2.5px solid #FF6B00;padding-top:9px;font-size:10px;color:#777;display:flex;justify-content:space-between;position:relative;z-index:1}
@media print{@page{size:A4;margin:0} .inner{padding:12mm 13mm 10mm} .card,.note,tr{page-break-inside:avoid} h2,h3{page-break-after:avoid}}
`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>BCPL Franchise Prospectus</title><style>${css}</style></head><body>

<!-- 1 · COVER -->
<div class="page cover">${WM}
  <div style="display:flex;align-items:center;gap:18px;position:relative;z-index:1"><img src="file:///home/runner/workspace/artifacts/bcpl-website/public/bcpl-assets/bcpl-logo-white.png" style="height:66px"/><div style="font-size:14px;letter-spacing:.28em;color:#E8B23D;font-weight:800">BCPL SPORTS PRIVATE LIMITED</div></div>
  <div style="margin-top:66px;position:relative;z-index:1">
    <h1>Bhartiya Corporate Premier League<br/><span class="gold">Franchise Ownership Prospectus</span></h1>
    <p style="margin-top:16px;font-size:15.5px;color:rgba(255,255,255,.78);max-width:560px">Own a T20 franchise in India's corporate cricket league — the privilege of team ownership, the complete revenue-sharing model, and a five-season illustrative growth outlook.</p>
  </div>
  <div class="statrow" style="position:relative;z-index:1">
    <div class="stat"><div class="n">10</div><div class="l">Franchise Teams</div></div>
    <div class="stat"><div class="n">25%</div><div class="l">Registration Revenue Pool</div></div>
    <div class="stat"><div class="n">50%</div><div class="l">Sponsorship Revenue Pool</div></div>
    <div class="stat"><div class="n">Pan-India</div><div class="l">Digital-First League</div></div>
  </div>
  <div style="position:relative;z-index:1;margin-top:22px">
    <div style="background:rgba(232,178,61,0.1);border:1px solid rgba(232,178,61,0.45);border-radius:14px;padding:18px 22px">
      <div style="font-size:12px;letter-spacing:.18em;color:#E8B23D;font-weight:800;margin-bottom:8px">WHAT'S INSIDE</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 22px;font-size:13px;color:rgba(255,255,255,.85)">
        <div>① The privilege of team ownership</div><div>② Investment structure &amp; annual fees</div>
        <div>③ Three revenue streams, explained</div><div>④ Conversion scenarios — Season 6</div>
        <div>⑤ 5-year outlook — steady &amp; high-growth</div><div>⑥ Complete legal terms &amp; confidentiality</div>
      </div>
    </div>
  </div>
  <div style="margin-top:auto;position:relative;z-index:1">
    <div style="display:flex;gap:26px;font-size:12.5px;color:rgba(255,255,255,.72)">
      <span><b style="color:#E8B23D">EMAIL</b> franchisee@bcplt20.com</span><span><b style="color:#E8B23D">WEB</b> www.bcplt20.com</span><span><b style="color:#E8B23D">PHONE</b> +91 83684 44754 (Founder\'s Office)</span>
    </div>
    <div style="margin-top:13px;font-size:10px;color:rgba(255,255,255,.5);max-width:660px">Private &amp; strictly confidential — issued to the named recipient only; any sharing, copying or circulation is prohibited (see Confidentiality, last page). This is an invitation to explore franchise participation only — not an offer of securities, a deposit scheme or an investment product; no return is promised or assured. All projections are illustrative assumptions.</div>
  </div>
</div>

<!-- 2 · PRIVILEGE + WHY -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>1 · The Privilege of Owning a Team</h2>
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
  ${foot(2)}
</div></div>

<!-- 3 · INVESTMENT -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>2 · Investment Structure — What a Season Costs</h2>
  <p>A BCPL franchise is an <b>annual commitment of approximately ₹5 Cr per season</b> (metro tier), made up of three parts:</p>
  <table>
    <tr><th>Item</th><th>Amount / season</th><th>Notes</th></tr>
    <tr><td><b>League franchise fee</b></td><td><b>₹3 Cr every season</b></td><td>Payable every season, <b>not one-time</b>. The fee increases by <b>10% each season</b> (₹3 Cr → ₹3.30 Cr → ₹3.63 Cr …). Tier-2 city: ₹2 Cr base · Premium metro: ₹5 Cr base, same 10% escalation.</td></tr>
    <tr><td><b>Auction purse</b></td><td><b>₹1 Cr (fixed)</b></td><td>Every team's player-auction purse. Held fixed for the next 2–3 seasons; reviewed by the league thereafter.</td></tr>
    <tr><td><b>Team operations</b></td><td><b>≈ ₹1 Cr (indicative)</b></td><td>5-star player accommodation, Indian-team-grade jerseys &amp; kit, team management, travel and match-day operations. Varies with the owner's choices, but the league's minimum standards must be met.</td></tr>
    <tr><td>Bid registration fee</td><td>₹2,00,000 (one-time)</td><td>Non-refundable, per applicant, to enter the bid process — whether or not a franchise is allotted.</td></tr>
  </table>
  ${pie([
    { v: 3, label: "League franchise fee — ₹3 Cr (10% ↑/season)", color: "#FF6B00" },
    { v: 1, label: "Auction purse — ₹1 Cr (fixed)", color: "#E8B23D" },
    { v: 1, label: "Team operations — ≈ ₹1 Cr", color: "#0D1E44" },
  ])}
  <p class="dim" style="text-align:center">Year-1 outlay ≈ ₹5 Cr (metro tier) — the pie shows the split of a season's commitment.</p>
  <div class="note"><b>Allotment &amp; eligibility:</b> clean legal &amp; financial background, KYC of the applicant entity and promoters, and source-of-funds verification are mandatory. Where 10 or more qualified applicants register, allotment is by competitive bid &amp; auction. The league's decision is final.</div>
  ${foot(3)}
</div></div>

<!-- 4 · REVENUE MODEL + CONVERSION -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>3 · How a Franchise Earns — Three Streams</h2>
  <div class="card"><b class="t">① 25% of player registration &amp; Phase-2 revenue</b>Phase-1 registration: ₹299 / ₹399 · Phase-2 (trials &amp; auction eligibility): ₹2,000 / ₹3,000. <b>25% of this revenue pool is distributed equally among the 10 franchises</b> every season. Figures in this document are net of 18% GST (blended Phase-1 ≈ ₹296, Phase-2 ≈ ₹2,119 net).</div>
  <div class="card"><b class="t">② 50% of league sponsorship revenue</b>Title, associate and partner sponsors pay to reach the league's corporate audience. <b>Half of all central sponsorship revenue is distributed equally among the franchises.</b></div>
  <div class="card"><b class="t">③ 25% of central media income — from Year 4</b>In early seasons the league invests in broadcast distribution (a league cost, never charged to franchises). Once broadcast turns revenue-positive, 25% of central media income also flows to the franchises.</div>

  <h2 style="margin-top:18px">4 · Season 6 — What Conversion Does to Your Share</h2>
  <p>With <b>2,00,000 Phase-1 registrations</b> and ₹3 Cr sponsorship in Season 6, the per-team share at different Phase-2 conversion rates:</p>
  <table>
    <tr><th>Phase-2 conversion</th><th>Phase-2 revenue (net)</th><th>Per-team share</th></tr>
    ${conv2L.map((r) => `<tr${r.c === 30 ? ' class="hl"' : ""}><td><b>${r.c}%</b> of registrations${r.c === 30 ? '<span class="tag">base case</span>' : ""}</td><td>₹${f2(r.p2)} Cr</td><td><b>₹${f2(r.perTeam)} Cr</b></td></tr>`).join("")}
  </table>
  <p class="dim">Per-team share = [25% × (Phase-1 + Phase-2 net revenue) + 50% × sponsorship] ÷ 10 teams. All scenario tables in this document use the 30% base case.</p>
  ${foot(4)}
</div></div>

<!-- 5 · SCENARIO A -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>5 · Outlook A — Steady Growth <span class="dim" style="font-size:13px">(2 → 3 → 5 → 8 → 10 lakh registrations)</span></h2>
  ${manhattan(A, "Per-team revenue share (₹ Cr, illustrative) — Steady Growth")}
  ${scenTable(A)}
  <h3>Franchise P&amp;L — Steady Growth</h3>
  ${plTable(A)}
  <div class="note danger"><b>Straight talk:</b> at steady-growth scale, the season's revenue share does not yet cover the ≈ ₹5 Cr annual commitment — ownership at this stage is a brand, network and early-position play, with financial upside arriving only at high-growth scale (next page). No assured returns exist in franchise sport — we show this honestly.</div>
  ${foot(5)}
</div></div>

<!-- 6 · SCENARIO B -->
<div class="page">${WM}<div class="band"></div><div class="inner">
  <h2>6 · Outlook B — High Growth <span class="dim" style="font-size:13px">(5 → 10 → 15 → 20 → 25 lakh registrations)</span></h2>
  ${manhattan(B, "Per-team revenue share (₹ Cr, illustrative) — High Growth")}
  ${scenTable(B)}
  <h3>Franchise P&amp;L — High Growth</h3>
  ${plTable(B)}
  <div class="note">In the high-growth picture, season net losses narrow every year, the franchise approaches season-level break-even around <b>Year 4</b> and turns season-positive in <b>Year 5</b> — while the team's brand value, fanbase and sponsorship pull compound alongside. <b>Actual results depend entirely on actual registrations, conversion, sponsorship and costs and may be materially lower or higher; nothing here is a promise, forecast or assurance of any income or return.</b></div>
  ${foot(6)}
</div></div>

<!-- 7 · LEGAL -->
<div class="page">${WM}<div class="band"></div><div class="inner legal">
  <h2>7 · Key Terms &amp; Conditions</h2>
  <ol>
    <li><b>Nature of arrangement.</b> A BCPL franchise is a commercial sports-team ownership and revenue-sharing arrangement with BCPL Sports Private Limited ("the League"). It is <b>not</b> a security, deposit, collective investment scheme, partnership, franchise under any statutory franchise law, or financial product, and is not marketed as one.</li>
    <li><b>No assured returns.</b> All revenue figures, charts and projections in this document are illustrative assumptions only. The League makes <b>no representation, warranty or guarantee of any revenue, profit, break-even timeline or return</b>. Franchise owners may incur losses, including sustained losses across multiple seasons, as the Steady-Growth outlook itself illustrates.</li>
    <li><b>Fees.</b> (a) The ₹2,00,000 bid registration fee is one-time and non-refundable in all circumstances, including non-allotment. (b) The league franchise fee is payable <b>every season</b> and increases by 10% per season. (c) The auction purse (currently ₹1 Cr) must be funded in full each season. (d) Team operating costs are the franchise's responsibility and must meet League minimum standards (player accommodation, kit, management). Non-payment of any seasonal amount by its due date is a material breach.</li>
    <li><b>Allotment.</b> Where ten or more qualified applications are received for available slots, allotment is by competitive bid/auction. The League's decision on eligibility, allotment, team naming, tier classification and city assignment is final and binding.</li>
    <li><b>Eligibility &amp; verification.</b> Applicants must pass KYC, background and source-of-funds verification. The League may reject any application without assigning reasons, with no liability other than obligations expressly stated in a signed agreement.</li>
    <li><b>Revenue share.</b> Pool percentages (25% registration/Phase-2, 50% sponsorship, 25% media) are computed on <b>actually-received</b> central revenue net of applicable taxes (including GST), payment-gateway charges, refunds and statutory deductions, and distributed equally among active, fully-paid-up franchises per the Franchise Agreement. Registration revenue depends on actual participation; sponsorship and media figures depend on third-party contracts that may or may not materialise. No minimum pool size is guaranteed.</li>
    <li><b>League standards.</b> The League may prescribe and update minimum standards for player welfare, accommodation, kit, conduct and match operations. Persistent failure to meet standards is a material breach.</li>
    <li><b>Data protection.</b> Any sharing of participant information is limited to aggregated and/or consent-based data, in compliance with the Digital Personal Data Protection Act, 2023 and League privacy policies. Franchises must not use participant data outside the permitted purpose, must not transfer it to any third party, and must delete it on termination.</li>
    <li><b>Branding &amp; IP.</b> Team names incorporating the owner's company name require League approval and must comply with League brand, advertising and content standards. All League IP (name, marks, footage, data, formats) remains the League's property; the franchise receives only a limited, non-transferable seasonal licence.</li>
    <li><b>Conduct &amp; compliance.</b> Franchises, their owners and personnel must comply with applicable law (including anti-corruption, anti-money-laundering and betting/gaming laws), League anti-corruption and conduct codes, and must not engage in conduct harming the League's reputation.</li>
    <li><b>Term, termination &amp; transfer.</b> Franchise rights are granted per season/term as per the Franchise Agreement. Transfer, sale, pledge or change of control requires prior written League consent. Material breach, non-payment, insolvency or reputational-risk events may lead to suspension or termination; fees already paid are non-refundable on termination for cause.</li>
    <li><b>Force majeure.</b> Seasons may be shortened, relocated or cancelled for events beyond the League's control; the Franchise Agreement sets out the consequences. No consequential-loss claims lie against the League.</li>
    <li><b>Taxes.</b> Each party bears its own taxes. GST and withholding taxes apply as per law on all fees and distributions.</li>
    <li><b>Governing law &amp; disputes.</b> Governed by the laws of India; disputes are subject to arbitration under the Arbitration and Conciliation Act, 1996 (sole arbitrator, seat New Delhi, English language) and the exclusive jurisdiction of the courts at New Delhi.</li>
    <li><b>Entire understanding.</b> This prospectus is for information only. Only a signed Franchise Agreement (with schedules) creates binding rights and obligations; in case of conflict, the Franchise Agreement prevails over this document. The League may modify the programme, fees and terms at any time before signing.</li>
  </ol>
  ${foot(7)}
</div></div>

<!-- 8 · CONFIDENTIALITY + CONTACT -->
<div class="page">${WM}<div class="band"></div><div class="inner legal">
  <h2>8 · Confidentiality — Read Before Sharing</h2>
  <div class="note danger" style="font-size:12.5px"><b>This document is strictly confidential.</b> It is issued to the named recipient alone, solely to evaluate BCPL franchise participation. <b>You may not share, forward, copy, photograph, publish or disclose this document or its contents to any person whatsoever</b> — not to advisors, associates, media or any third party — without the League's prior written consent. By retaining this document you accept these obligations as binding. Unauthorised disclosure or use may cause the League serious commercial harm and will entitle the League to injunctive relief, damages and any other remedy available in law, and will disqualify the recipient from the franchise process. If you do not agree, delete/return this document immediately.</div>
  <h3>Disclaimer</h3>
  <p>This document does not constitute financial, legal or tax advice; recipients should take independent professional advice before applying. It is not an offer or solicitation of securities or deposits and no return is promised or assured. All projections are illustrative assumptions; actual outcomes may differ materially. GST and other taxes apply as per law. GST registration of BCPL Sports Private Limited is in progress; statutory details will be provided in the Franchise Agreement. The League reserves the right to modify the franchise programme, fees and terms at any time prior to signing.</p>
  <h3>Contact — Franchise Desk</h3>
  <p style="font-size:14px">Email <b>franchisee@bcplt20.com</b> &nbsp;·&nbsp; Web <b>www.bcplt20.com</b> &nbsp;·&nbsp; Phone <b>+91 83684 44754</b> (Founder's Office)</p>
  <p class="dim">All franchise enquiries are handled directly by the Founder's Office. Please quote your company name and preferred city in your first message.</p>
  ${foot(8)}
</div></div>
</body></html>`;
writeFileSync("/tmp/prospectus2.html", html);
console.log("A perTeam:", A.map(p => f2(p.perTeam)).join(", "));
console.log("A net:", A.map(p => f2(p.net)).join(", "), "cum:", f2(A[4].cum));
console.log("B perTeam:", B.map(p => f2(p.perTeam)).join(", "));
console.log("B net:", B.map(p => f2(p.net)).join(", "), "cum:", f2(B[4].cum));
