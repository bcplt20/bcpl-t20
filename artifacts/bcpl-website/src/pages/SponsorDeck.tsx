import React from 'react';
import { SEASON } from '../lib/season';

/**
 * Premium print-perfect sponsorship deck — A4 landscape, magazine-grade.
 * IPL-franchise presentation quality: full-bleed photography, duotone navy
 * overlays, diagonal gold/orange section devices, condensed display type and
 * big numbers. Twelve slides, each exactly one A4-landscape page.
 *
 * Print-only route: no SiteHeader/SiteMeta chrome, kept OUT of nav + sitemap
 * (robots.txt disallows /sponsor-deck). Bilingual is not used — a sales deck is
 * single-language (English) by design.
 *
 * COMPLIANCE: every marketing number comes from the SEASON single source of
 * truth. No invented stats, viewership or reach figures; no scout/BCCI mentions,
 * no superlatives, no absolute or time-bound promises. Imagery reuses assets
 * already shipped in /public/bcpl-assets. Images print via
 * -webkit-print-color-adjust: exact so full-bleed photos render in the PDF.
 */

const BASE = import.meta.env.BASE_URL;
const asset = (f: string) => BASE + 'bcpl-assets/' + f;
const logo = (f: string) => BASE + 'bcpl-assets/logos/' + f;
const SP_EMAIL = 'sponsorship@bcplt20.com';
const SP_PHONE = '+91 91513 46555';
const FOOT = `Season ${SEASON.number} \u00b7 ${SP_EMAIL} \u00b7 ${SP_PHONE}`;

const TEAM_LOGOS = [
  'ahmedabad_lions.png', 'bengaluru_rockets.png', 'chennai_thalaivas.png',
  'delhi_suryas.png', 'hyderabad_hawks.png', 'kolkata_tigers.png',
  'lucknow_nawabs.png', 'mumbai_mavericks.png', 'punjab_warriors.png',
  'rajasthan_scorchers.png',
];

const CSS = `
@page { size: A4 landscape; margin: 0; }
*, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; background: #0C1A34; }
.deck { font-family: 'Inter', Arial, sans-serif; color: #fff; }

/* ── Page shell ─────────────────────────────────────────── */
.slide {
  position: relative; width: 297mm; height: 210mm; margin: 0 auto;
  overflow: hidden; display: flex; flex-direction: column;
  background: linear-gradient(155deg, #24396B 0%, #1B2E52 52%, #12233F 100%);
}
.slide + .slide { margin-top: 6mm; }
.pad { padding: 15mm 18mm; display: flex; flex-direction: column; flex: 1; position: relative; z-index: 3; }

/* ── Type + accents ─────────────────────────────────────── */
.gold { color: #F4C15A; }
.orange { color: #FF7A29; }
.title { font-family: 'Barlow Condensed','Oswald','Montserrat',sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: .01em; line-height: .95; margin: 0; }
.kick { font-family:'Barlow Condensed','Montserrat',sans-serif; font-size: 12px; font-weight: 800; letter-spacing: .34em; text-transform: uppercase; color: #F4C15A; display:flex; align-items:center; gap:4mm; }
.kick::before { content:''; width: 14mm; height: 2px; background: linear-gradient(90deg,#F4C15A,#FF7A29); display:inline-block; }
.deck h1 { font-size: 84px; }
.deck h2 { font-size: 46px; margin: 5mm 0 4mm; }
.lead { font-size: 15px; line-height: 1.75; color: rgba(255,255,255,0.86); max-width: 175mm; margin: 0; }
.lead.big { font-size: 19px; line-height: 1.7; }

/* diagonal gold hairline device (top-right corner accent) */
.corner { position:absolute; top:0; right:0; width: 90mm; height: 90mm; z-index:1;
  background: linear-gradient(135deg, rgba(244,193,90,0.16), rgba(255,122,41,0) 62%);
  clip-path: polygon(100% 0, 0 0, 100% 100%); }
.ball-motif { position:absolute; z-index:1; opacity:.10; width: 120mm; height:auto; right:-20mm; bottom:-24mm; transform: rotate(-8deg); pointer-events:none; }

/* footer bar with page number */
.footer { position:absolute; left:0; right:0; bottom:0; height: 12mm; z-index:4;
  display:flex; align-items:center; justify-content:space-between; padding: 0 18mm;
  font-size: 10.5px; letter-spacing:.04em; color: rgba(255,255,255,0.62);
  border-top: 1px solid rgba(255,255,255,0.12); }
.footer .pg { font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size: 13px; color:#F4C15A; letter-spacing:.1em; }
.brandbar { position:absolute; left:0; right:0; bottom:12mm; height: 3mm; z-index:4; background: linear-gradient(90deg,#F4C15A 0%, #FF7A29 55%, #D95E10 100%); }

/* ── Full-bleed photo layers ────────────────────────────── */
.bleed { position:absolute; inset:0; z-index:0; }
.bleed img { width:100%; height:100%; object-fit: cover; display:block; }
/* duotone navy scrim so white type always reads on any photo */
.scrim-l { position:absolute; inset:0; z-index:1; background: linear-gradient(90deg, rgba(12,26,52,0.94) 0%, rgba(12,26,52,0.78) 34%, rgba(12,26,52,0.30) 68%, rgba(12,26,52,0.12) 100%); }
.scrim-b { position:absolute; inset:0; z-index:1; background: linear-gradient(0deg, rgba(12,26,52,0.95) 0%, rgba(12,26,52,0.35) 40%, rgba(12,26,52,0.10) 70%); }
.scrim-full { position:absolute; inset:0; z-index:1; background: linear-gradient(155deg, rgba(27,46,82,0.88), rgba(18,35,63,0.72)); }

/* ── Stats ──────────────────────────────────────────────── */
.grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 7mm; margin-top: 8mm; }
.grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 7mm; margin-top: 6mm; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 6mm; align-items:center; }
.stat { background: rgba(255,255,255,0.05); border: 1px solid rgba(244,193,90,0.28); border-radius: 14px; padding: 9mm 5mm; text-align: center; }
.stat b { display: block; font-family: 'Barlow Condensed','Montserrat',sans-serif; font-weight: 800; font-size: 62px; color: #F4C15A; line-height: .9; }
.stat span { display: block; margin-top: 4mm; font-size: 12.5px; letter-spacing:.05em; text-transform:uppercase; color: rgba(255,255,255,0.85); }

.card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14); border-radius: 14px; padding: 7mm; }
.card h3 { font-family: 'Barlow Condensed','Montserrat',sans-serif; font-weight: 800; text-transform:uppercase; letter-spacing:.06em; font-size: 20px; margin: 0 0 4mm; color: #F4C15A; }
.card p, .card li { font-size: 12.5px; line-height: 1.7; color: rgba(255,255,255,0.85); }
.card ul { margin: 0; padding-left: 16px; }
.card li { margin-bottom: 2.5mm; }

/* ── Timeline (journey) ─────────────────────────────────── */
.timeline { display:flex; gap: 0; margin-top: 12mm; position:relative; }
.timeline::before { content:''; position:absolute; top: 5mm; left: 6%; right: 6%; height: 2px; background: linear-gradient(90deg,#F4C15A,#FF7A29); }
.tstep { flex:1; text-align:center; position:relative; padding: 0 3mm; }
.tdot { width: 10mm; height:10mm; border-radius:50%; background: #12233F; border: 2px solid #F4C15A; margin: 0 auto; display:flex; align-items:center; justify-content:center; font-family:'Barlow Condensed',sans-serif; font-weight:800; color:#F4C15A; font-size:16px; position:relative; z-index:2; }
.tstep h4 { font-family:'Barlow Condensed','Montserrat',sans-serif; text-transform:uppercase; letter-spacing:.05em; font-size:19px; margin: 6mm 0 3mm; color:#fff; }
.tstep p { font-size: 11.5px; line-height:1.6; color: rgba(255,255,255,0.78); margin:0; }

/* ── Tier matrix ────────────────────────────────────────── */
table.tiers { width: 100%; border-collapse: collapse; margin-top: 6mm; font-size: 12px; }
table.tiers th, table.tiers td { border: 1px solid rgba(255,255,255,0.16); padding: 4.5mm 4mm; text-align: center; }
table.tiers thead th { background: linear-gradient(135deg, rgba(244,193,90,0.22), rgba(255,122,41,0.14)); color: #F4C15A; font-family:'Barlow Condensed',sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; font-size: 15px; }
table.tiers td:first-child, table.tiers th:first-child { text-align: left; font-weight: 700; color: #fff; background: rgba(255,255,255,0.04); }
.yes { color: #3CD07E; font-weight: 900; font-size: 15px; }
.dash { color: rgba(255,255,255,0.35); }

/* ── Placement diagram ──────────────────────────────────── */
.place { display:grid; grid-template-columns: repeat(3,1fr); gap: 6mm; margin-top: 6mm; }
.pcell { border: 1px solid rgba(255,255,255,0.16); border-radius: 12px; overflow:hidden; display:flex; flex-direction:column; background: rgba(255,255,255,0.04); }
.pcell .ph { height: 40mm; position:relative; overflow:hidden; }
.pcell .ph img { width:100%; height:100%; object-fit:cover; }
.pcell .tag { position:absolute; left:0; bottom:0; right:0; background: linear-gradient(0deg, rgba(12,26,52,.92), transparent); padding: 8mm 4mm 3mm; }
.pcell .chip { display:inline-block; background:#F4C15A; color:#12233F; font-family:'Barlow Condensed',sans-serif; font-weight:900; letter-spacing:.05em; padding: 1.5mm 4mm; border-radius:5px; font-size: 12px; text-transform:uppercase; }
.pcell .body { padding: 4mm 5mm 5mm; }
.pcell h4 { font-family:'Barlow Condensed','Montserrat',sans-serif; text-transform:uppercase; letter-spacing:.05em; font-size: 17px; margin: 0 0 2mm; color:#fff; }
.pcell p { font-size: 11px; line-height:1.55; color: rgba(255,255,255,0.8); margin:0; }

/* ── Gallery grid ───────────────────────────────────────── */
.gal { display:grid; grid-template-columns: repeat(4,1fr); grid-auto-rows: 55mm; gap: 5mm; margin-top: 6mm; }
.gal .g { position:relative; border-radius: 10px; overflow:hidden; border: 1px solid rgba(255,255,255,0.12); }
.gal .g img { width:100%; height:100%; object-fit:cover; display:block; }
.gal .wide { grid-column: span 2; }
.gal .tall { grid-row: span 2; }

/* team logo strip */
.logos { display:grid; grid-template-columns: repeat(5,1fr); gap: 6mm; margin-top: 8mm; }
.logos .l { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.14); border-radius: 12px; height: 30mm; display:flex; align-items:center; justify-content:center; padding: 4mm; }
.logos .l img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,.4)); }

/* contact */
.contact-row { display: flex; gap: 6mm; margin-top: 8mm; flex-wrap: wrap; }
.contact-pill { background: rgba(255,255,255,0.07); border: 1px solid rgba(244,193,90,0.3); border-radius: 12px; padding: 6mm 8mm; font-size: 16px; font-weight:600; }
.cover-logo { width: 66mm; height: auto; filter: drop-shadow(0 6px 24px rgba(0,0,0,.6)); }

.why { display:grid; grid-template-columns: repeat(2,1fr); gap: 6mm 9mm; margin-top: 8mm; }
.why .w { display:flex; gap: 5mm; align-items:flex-start; }
.why .n { font-family:'Barlow Condensed',sans-serif; font-weight:800; font-size: 40px; color:#F4C15A; line-height:.9; min-width: 22mm; }
.why h4 { font-family:'Barlow Condensed','Montserrat',sans-serif; text-transform:uppercase; letter-spacing:.04em; font-size:19px; margin:0 0 2mm; color:#fff; }
.why p { font-size: 12.5px; line-height:1.6; color: rgba(255,255,255,0.83); margin:0; }

@media print {
  html, body { background: #fff; }
  .slide { break-after: page; page-break-after: always; margin: 0; }
  .slide:last-child { break-after: auto; page-break-after: auto; }
}
`;

/* Footer + page number shown on every slide (cover included). */
function Footer({ n }: { n: number }) {
  return (
    <>
      <div className="brandbar" />
      <div className="footer">
        <span>{FOOT}</span>
        <span className="pg">{String(n).padStart(2, '0')} / 12</span>
      </div>
    </>
  );
}

export default function SponsorDeck() {
  const TIER_ROWS: Array<[string, boolean, boolean, boolean, boolean]> = [
    ['Name / title association with the league', true, false, false, false],
    ['Jersey branding placement', true, true, false, false],
    ['LED & ground branding', true, true, true, false],
    ['Website + app logo placement', true, true, true, true],
    ['Match-day announcements', true, true, false, false],
    ['Social media features', true, true, true, true],
    ['Hospitality access', true, false, false, false],
    ['City / activity-level activation', true, true, true, true],
  ];
  const cell = (v: boolean) => v ? <span className="yes">{'\u2713'}</span> : <span className="dash">{'\u2014'}</span>;

  return (
    <div className="deck">
      <style>{CSS}</style>

      {/* ── 1 · COVER — full-bleed stadium ─────────────────── */}
      <section className="slide" style={{ justifyContent: 'center' }}>
        <div className="bleed"><img src={asset('stadium-hero.jpg')} alt="Stadium" /></div>
        <div className="scrim-full" />
        <div className="pad" style={{ justifyContent: 'center' }}>
          <img className="cover-logo" src={asset('bcpl-logo-white.png')} alt="BCPL" />
          <div className="kick" style={{ marginTop: '10mm' }}>Bhartiya Corporate Premier League</div>
          <h1 className="title" style={{ marginTop: '5mm' }}>SPONSORSHIP <span className="gold">DECK</span></h1>
          <p className="lead big" style={{ marginTop: '6mm' }}>
            Partner with a season-long T20 league built for India&rsquo;s working professionals.
          </p>
        </div>
        <Footer n={1} />
      </section>

      {/* ── 2 · THE STORY ──────────────────────────────────── */}
      <section className="slide">
        <div className="corner" />
        <img className="ball-motif" src={asset('bcpl-ball-transparent.png')} alt="" />
        <div className="pad">
          <div className="kick">The league</div>
          <h2 className="title">A STAGE BUILT FOR<br /><span className="gold">CORPORATE INDIA</span></h2>
          <div className="grid2" style={{ marginTop: '2mm' }}>
            <div>
              <p className="lead">
                BCPL is a season-long T20 league where the players are working professionals —
                an urban, earning, brand-aware community that competes across trials, a live
                auction, franchise teams and full match-days.
              </p>
              <p className="lead" style={{ marginTop: '5mm' }}>
                It is cricket with the intensity of a professional league and the loyalty of a
                corporate community — a setting where partner brands live alongside the game all
                season, not just for a single fixture.
              </p>
            </div>
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)', height: '110mm' }}>
              <img src={asset('hero-athlete-a.webp')} alt="BCPL athlete" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
        <Footer n={2} />
      </section>

      {/* ── 3 · LEAGUE IN NUMBERS ──────────────────────────── */}
      <section className="slide">
        <div className="corner" />
        <div className="pad">
          <div className="kick">The league in numbers</div>
          <h2 className="title">SCALE, AT A GLANCE</h2>
          <div className="grid4">
            <div className="stat"><b>{SEASON.teams}</b><span>Franchise teams</span></div>
            <div className="stat"><b>{SEASON.trialCities}</b><span>Trial cities</span></div>
            <div className="stat"><b>{SEASON.prizePool}</b><span>Prize pool</span></div>
            <div className="stat"><b>1</b><span>Season-long league</span></div>
          </div>
          <div className="logos">
            {TEAM_LOGOS.map(f => (
              <div className="l" key={f}><img src={logo(f)} alt="Franchise" /></div>
            ))}
          </div>
          <p className="lead" style={{ marginTop: '8mm', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            Indicative figures for Season {SEASON.number}. Final scope is confirmed per agreement.
          </p>
        </div>
        <Footer n={3} />
      </section>

      {/* ── 4 · OUR AUDIENCE (qualitative) ─────────────────── */}
      <section className="slide">
        <div className="bleed"><img src={asset('hero-athlete-b.webp')} alt="Audience" /></div>
        <div className="scrim-l" />
        <div className="pad" style={{ maxWidth: '175mm' }}>
          <div className="kick">Our audience</div>
          <h2 className="title">WHO YOU REACH</h2>
          <p className="lead big">
            Every player on the field is a working professional — the kind of urban, earning,
            decision-making audience brands want to sit next to.
          </p>
          <div className="grid3" style={{ marginTop: '8mm' }}>
            <div className="card"><h3>Working professionals</h3><p>Employees and founders playing competitively alongside their careers.</p></div>
            <div className="card"><h3>Urban &amp; earning</h3><p>A city-based, brand-aware community with real spending power.</p></div>
            <div className="card"><h3>Season-long attention</h3><p>Engaged across trials, auction and match-days — not a one-off moment.</p></div>
          </div>
          <p className="lead" style={{ marginTop: '7mm', fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>
            Audience is described qualitatively here — verified figures appear on the league&rsquo;s public pages.
          </p>
        </div>
        <Footer n={4} />
      </section>

      {/* ── 5 · THE SEASON JOURNEY (timeline) ──────────────── */}
      <section className="slide">
        <div className="corner" />
        <div className="pad">
          <div className="kick">The season journey</div>
          <h2 className="title">FROM TRIALS TO THE FINAL</h2>
          <p className="lead">One connected season — your brand travels the whole way with the league.</p>
          <div className="timeline">
            <div className="tstep"><div className="tdot">1</div><h4>Trials</h4><p>Open trials across cities bring professionals into the league.</p></div>
            <div className="tstep"><div className="tdot">2</div><h4>Auction</h4><p>A live auction assigns players to the franchise teams.</p></div>
            <div className="tstep"><div className="tdot">3</div><h4>League</h4><p>Match-days play out across the season with full team branding.</p></div>
            <div className="tstep"><div className="tdot">4</div><h4>Final</h4><p>The season builds to a marquee final and celebration.</p></div>
          </div>
          <div className="grid4" style={{ marginTop: '12mm', gap: '5mm' }}>
            {['event-teams-a.webp', 'auction-hero.webp', 'event-stage-trophy.webp', 'event-teams-b.webp'].map(f => (
              <div key={f} style={{ height: '48mm', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                <img src={asset(f)} alt="Season moment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
        <Footer n={5} />
      </section>

      {/* ── 6 · BRAND AMBASSADOR / MOMENTS ─────────────────── */}
      <section className="slide">
        <div className="bleed"><img src={asset('ganguly_2.jpg')} alt="Brand ambassador" /></div>
        <div className="scrim-l" />
        <div className="pad">
          <div className="kick">Brand ambassador</div>
          <h2 className="title">A FACE THE<br /><span className="gold">COUNTRY KNOWS</span></h2>
          <p className="lead big" style={{ maxWidth: '150mm' }}>
            The league is fronted by a recognised name in Indian cricket — lending presence and
            credibility to the platform your brand partners with.
          </p>
          <div className="grid4" style={{ marginTop: '10mm', gap: '5mm', maxWidth: '175mm' }}>
            {['ganguly_1.jpg', 'ganguly_3.jpg', 'ganguly_shoot.jpg', 'event-panel.webp'].map(f => (
              <div key={f} style={{ height: '42mm', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                <img src={asset(f)} alt="Ambassador moment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
        <Footer n={6} />
      </section>

      {/* ── 7 · SPONSORSHIP TIERS MATRIX ───────────────────── */}
      <section className="slide">
        <div className="corner" />
        <div className="pad">
          <div className="kick">Ways to partner</div>
          <h2 className="title">SPONSORSHIP TIERS</h2>
          <table className="tiers">
            <thead>
              <tr>
                <th>Deliverable</th>
                <th>Title</th><th>Powered By</th><th>Associate</th><th>Partner</th>
              </tr>
            </thead>
            <tbody>
              {TIER_ROWS.map(([label, a, b, c, d]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{cell(a)}</td><td>{cell(b)}</td><td>{cell(c)}</td><td>{cell(d)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="lead" style={{ marginTop: '6mm', fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>
            Indicative deliverables — final scope, placements and pricing are confirmed per agreement.
          </p>
        </div>
        <Footer n={7} />
      </section>

      {/* ── 8 · BRANDING PLACEMENTS (diagram over real photos) ── */}
      <section className="slide">
        <div className="corner" />
        <div className="pad">
          <div className="kick">Branding placements</div>
          <h2 className="title">WHERE YOUR LOGO LIVES</h2>
          <div className="place">
            <div className="pcell">
              <div className="ph"><img src={asset('jerseys.webp')} alt="Jersey" /><div className="tag"><span className="chip">Your brand</span></div></div>
              <div className="body"><h4>Jersey branding</h4><p>Front, back and sleeve placements across franchise kits.</p></div>
            </div>
            <div className="pcell">
              <div className="ph"><img src={asset('event-teams-a.webp')} alt="Ground" /><div className="tag"><span className="chip">Your brand</span></div></div>
              <div className="body"><h4>LED &amp; ground branding</h4><p>Boundary boards and on-ground presence through match-days.</p></div>
            </div>
            <div className="pcell">
              <div className="ph"><img src={asset('event-stage-trophy.webp')} alt="Stage" /><div className="tag"><span className="chip">Your brand</span></div></div>
              <div className="body"><h4>Stage &amp; event branding</h4><p>Auction, presentations and marquee moments.</p></div>
            </div>
            <div className="pcell">
              <div className="ph"><img src={asset('auction-hero.webp')} alt="Broadcast" /><div className="tag"><span className="chip">Your brand</span></div></div>
              <div className="body"><h4>Match-day announcements</h4><p>Named callouts woven through the live experience.</p></div>
            </div>
            <div className="pcell">
              <div className="ph"><img src={asset('event-panel.webp')} alt="Digital" /><div className="tag"><span className="chip">Your brand</span></div></div>
              <div className="body"><h4>Website sponsor strip</h4><p>Logo placement on the official league website.</p></div>
            </div>
            <div className="pcell">
              <div className="ph"><img src={asset('hero-athlete-c.webp')} alt="App" /><div className="tag"><span className="chip">Your brand</span></div></div>
              <div className="body"><h4>App logo placement</h4><p>Presence inside the player &amp; fan mobile app.</p></div>
            </div>
          </div>
          <p className="lead" style={{ marginTop: '5mm', fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>
            Illustrative placements — actual scope depends on the agreed package.
          </p>
        </div>
        <Footer n={8} />
      </section>

      {/* ── 9 · DIGITAL & APP PRESENCE (qualitative) ───────── */}
      <section className="slide">
        <div className="corner" />
        <img className="ball-motif" src={asset('bcpl-ball-transparent.png')} alt="" />
        <div className="pad">
          <div className="kick">Digital &amp; app presence</div>
          <h2 className="title">ALWAYS-ON VISIBILITY</h2>
          <p className="lead">Beyond the ground, the league runs on its own digital platforms — steady touchpoints for partner brands across the season.</p>
          <div className="grid3" style={{ marginTop: '9mm' }}>
            <div className="card">
              <h3>Official website</h3>
              <ul>
                <li>Live sponsor strip with partner logos</li>
                <li>Team, player &amp; match pages</li>
                <li>News &amp; season coverage</li>
              </ul>
            </div>
            <div className="card">
              <h3>Mobile app</h3>
              <ul>
                <li>Player &amp; fan experience</li>
                <li>In-app banners &amp; partner placement</li>
                <li>Match updates &amp; content</li>
              </ul>
            </div>
            <div className="card">
              <h3>Social channels</h3>
              <ul>
                <li>Match-day &amp; behind-the-scenes content</li>
                <li>Partner features &amp; shout-outs</li>
                <li>Season storytelling</li>
              </ul>
            </div>
          </div>
          <p className="lead" style={{ marginTop: '8mm', fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>
            Presence is described qualitatively — no audience or reach figures are claimed here.
          </p>
        </div>
        <Footer n={9} />
      </section>

      {/* ── 10 · PAST-SEASON GALLERY GRID ──────────────────── */}
      <section className="slide">
        <div className="pad">
          <div className="kick">From the league</div>
          <h2 className="title">MOMENTS &amp; MEMORIES</h2>
          <div className="gal">
            <div className="g tall"><img src={asset('event-stage-trophy.webp')} alt="Trophy moment" /></div>
            <div className="g wide"><img src={asset('event-teams-a.webp')} alt="Teams" /></div>
            <div className="g"><img src={asset('auction-hero.webp')} alt="Auction" /></div>
            <div className="g"><img src={asset('event-teams-b.webp')} alt="Teams" /></div>
            <div className="g"><img src={asset('jerseys.webp')} alt="Jerseys" /></div>
            <div className="g wide"><img src={asset('event-panel.webp')} alt="Event panel" /></div>
            <div className="g"><img src={asset('ambassador-a.webp')} alt="Ambassador" /></div>
          </div>
        </div>
        <Footer n={10} />
      </section>

      {/* ── 11 · WHY PARTNER (recap) ───────────────────────── */}
      <section className="slide">
        <div className="corner" />
        <div className="pad">
          <div className="kick">Why partner with BCPL</div>
          <h2 className="title">THE CASE, IN FOUR LINES</h2>
          <div className="why">
            <div className="w"><span className="n">01</span><div><h4>A premium audience</h4><p>Working professionals — urban, earning and brand-aware — competing all season.</p></div></div>
            <div className="w"><span className="n">02</span><div><h4>Season-long presence</h4><p>From trials to the final, your brand lives with the league, not a single fixture.</p></div></div>
            <div className="w"><span className="n">03</span><div><h4>Multi-surface branding</h4><p>Jersey, ground, stage, website and app — many places for your logo to show up.</p></div></div>
            <div className="w"><span className="n">04</span><div><h4>Credible platform</h4><p>A recognised ambassador and a professionally run {SEASON.teams}-team league.</p></div></div>
          </div>
          <div className="grid2" style={{ marginTop: '10mm' }}>
            <div style={{ height: '48mm', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
              <img src={asset('event-teams-b.webp')} alt="League" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ height: '48mm', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
              <img src={asset('ambassador-b.webp')} alt="Ambassador" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
        <Footer n={11} />
      </section>

      {/* ── 12 · CONTACT / CTA ─────────────────────────────── */}
      <section className="slide" style={{ justifyContent: 'center' }}>
        <div className="bleed"><img src={asset('stadium-hero.jpg')} alt="Stadium" /></div>
        <div className="scrim-full" />
        <div className="pad" style={{ justifyContent: 'center' }}>
          <img className="cover-logo" src={asset('bcpl-logo-white.png')} alt="BCPL" />
          <div className="kick" style={{ marginTop: '9mm' }}>Let&rsquo;s build the right partnership</div>
          <h2 className="title" style={{ fontSize: 56 }}>TALK TO THE <span className="gold">BCPL TEAM</span></h2>
          <div className="contact-row">
            <span className="contact-pill">{SP_EMAIL}</span>
            <span className="contact-pill">{SP_PHONE}</span>
            <span className="contact-pill">wa.me/919151346555</span>
          </div>
          <p className="lead" style={{ marginTop: '7mm', color: 'rgba(255,255,255,0.75)' }}>
            Bhartiya Corporate Premier League &middot; Season {SEASON.number}
          </p>
        </div>
        <Footer n={12} />
      </section>
    </div>
  );
}
