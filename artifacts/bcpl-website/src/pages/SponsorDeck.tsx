import React from 'react';
import { SEASON } from '../lib/season';

/**
 * Print-perfect sponsorship deck — A4 landscape, no header/footer chrome.
 * Intended for PDF generation (headless print). Kept OUT of the nav and
 * sitemap (robots.txt disallows /sponsor-deck). Bilingual is not used here
 * — a sales deck is single-language (English) by design.
 *
 * Each <section class="slide"> is one full A4-landscape page. Numbers come
 * from the SEASON single source of truth; imagery reuses existing public
 * assets already shipped with the site. No invented figures.
 */

const BASE = import.meta.env.BASE_URL;
const asset = (f: string) => BASE + 'bcpl-assets/' + f;
const SP_EMAIL = 'sponsorship@bcplt20.com';
const SP_PHONE = '+91 91513 46555';

const CSS = `
@page { size: A4 landscape; margin: 0; }
* , *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #0E1D3D; }
.deck { font-family: 'Inter', Arial, sans-serif; color: #fff; }
.slide {
  position: relative; width: 297mm; min-height: 210mm; margin: 0 auto;
  padding: 16mm 18mm; overflow: hidden; display: flex; flex-direction: column;
  background: linear-gradient(160deg, #12305F 0%, #16264A 55%, #0E1D3D 100%);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.slide + .slide { margin-top: 8mm; }
.gold { color: #FFD873; }
.kick { font-size: 11px; font-weight: 800; letter-spacing: .28em; text-transform: uppercase; color: #E8B23D; }
.title { font-family: 'Barlow Condensed','Montserrat',sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: .02em; line-height: .98; }
.deck h1 { font-size: 60px; margin: 8mm 0 0; }
.deck h2 { font-size: 34px; margin: 4mm 0 6mm; }
.lead { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.85); max-width: 200mm; }
.grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 8mm; margin-top: 6mm; }
.grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 8mm; margin-top: 6mm; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 6mm; }
.stat { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.16); border-radius: 12px; padding: 8mm 6mm; text-align: center; }
.stat b { display: block; font-family: 'Barlow Condensed','Montserrat',sans-serif; font-weight: 800; font-size: 44px; color: #FFD873; line-height: 1; }
.stat span { display: block; margin-top: 4mm; font-size: 13px; color: rgba(255,255,255,0.82); }
.card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14); border-radius: 12px; padding: 6mm; }
.card h3 { font-family: 'Montserrat',sans-serif; font-weight: 800; font-size: 16px; margin: 0 0 3mm; color: #fff; }
.card p, .card li { font-size: 12.5px; line-height: 1.65; color: rgba(255,255,255,0.82); }
.card ul { margin: 0; padding-left: 16px; }
table.tiers { width: 100%; border-collapse: collapse; margin-top: 6mm; font-size: 12px; }
table.tiers th, table.tiers td { border: 1px solid rgba(255,255,255,0.16); padding: 5mm 4mm; text-align: center; }
table.tiers th { background: rgba(232,178,61,0.14); color: #FFD873; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
table.tiers td:first-child { text-align: left; font-weight: 700; color: #fff; background: rgba(255,255,255,0.04); }
.yes { color: #31C56B; font-weight: 900; }
.dash { color: rgba(255,255,255,0.4); }
.strip { display: grid; grid-template-columns: repeat(4,1fr); gap: 5mm; margin-top: 6mm; }
.strip img { width: 100%; height: 46mm; object-fit: cover; border-radius: 8px; display: block; border: 1px solid rgba(255,255,255,0.12); }
.mock { display: grid; grid-template-columns: repeat(2,1fr); gap: 6mm; margin-top: 6mm; }
.mockcell { border: 1px solid rgba(255,255,255,0.16); border-radius: 12px; padding: 6mm; display: flex; flex-direction: column; gap: 4mm; }
.jersey { height: 40mm; border-radius: 10px; background: linear-gradient(135deg,#1E4B8F,#2E6FD6); position: relative; display: flex; align-items: center; justify-content: center; }
.jersey .logo { background: #FFD873; color: #0C1D33; font-weight: 900; padding: 4mm 8mm; border-radius: 6px; font-size: 13px; letter-spacing: .05em; }
.led { height: 18mm; border-radius: 8px; background: repeating-linear-gradient(90deg,#0C1D33 0 8mm,#16264A 8mm 16mm); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.16); }
.led .logo { background: #E8B23D; color: #0C1D33; font-weight: 900; padding: 2mm 6mm; border-radius: 5px; font-size: 12px; }
.screen { height: 34mm; border-radius: 10px; border: 3px solid rgba(255,255,255,0.2); background: #0C1D33; display: flex; align-items: flex-end; justify-content: center; padding: 3mm; }
.screen .bar { width: 100%; background: rgba(255,255,255,0.06); border-radius: 6px; padding: 3mm; display: flex; gap: 4mm; align-items: center; justify-content: center; }
.screen .chip { background: #FFD873; color: #0C1D33; font-weight: 900; padding: 1.5mm 4mm; border-radius: 4px; font-size: 10px; }
.brandbar { position: absolute; left: 0; right: 0; bottom: 0; height: 6mm; background: linear-gradient(90deg,#E8B23D,#FF7A29); }
.foot { margin-top: auto; padding-top: 8mm; font-size: 11px; color: rgba(255,255,255,0.55); }
.cover-logo { width: 44mm; height: auto; }
.contact-row { display: flex; gap: 6mm; margin-top: 6mm; flex-wrap: wrap; }
.contact-pill { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.16); border-radius: 10px; padding: 5mm 7mm; font-size: 14px; }
@media print {
  html, body { background: #fff; }
  .slide { break-after: page; page-break-after: always; margin: 0; }
  .slide:last-child { break-after: auto; page-break-after: auto; }
}
`;

export default function SponsorDeck() {
  // No SiteHeader / SiteMeta chrome — this route is print-only.
  const TIER_ROWS: Array<[string, boolean, boolean, boolean, boolean]> = [
    ['Name association with the league', true, false, false, false],
    ['Jersey branding placement', true, false, false, false],
    ['LED & ground branding', true, true, true, false],
    ['Website + app logo placement', true, true, true, true],
    ['Match-day announcements', true, true, false, false],
    ['Social media features', true, true, true, true],
    ['Hospitality box access', true, false, false, false],
    ['City / activity-level activation', true, true, true, true],
  ];
  const cell = (v: boolean) => v ? <span className="yes">{'\u2713'}</span> : <span className="dash">{'\u2014'}</span>;

  return (
    <div className="deck">
      <style>{CSS}</style>

      {/* 1 — Cover */}
      <section className="slide" style={{ justifyContent: 'center' }}>
        <img className="cover-logo" src={asset('bcpl-logo-white.png')} alt="BCPL" />
        <div className="kick" style={{ marginTop: '10mm' }}>Bhartiya Corporate Premier League</div>
        <h1 className="title">SPONSORSHIP <span className="gold">DECK</span></h1>
        <p className="lead" style={{ marginTop: '6mm', fontSize: 18 }}>
          Partner with a season-long T20 league for India&rsquo;s working professionals.
        </p>
        <div className="foot">Season {SEASON.number} &nbsp;&middot;&nbsp; {SP_EMAIL} &nbsp;&middot;&nbsp; {SP_PHONE}</div>
        <div className="brandbar" />
      </section>

      {/* 2 — League at a glance */}
      <section className="slide">
        <div className="kick">The league at a glance</div>
        <h2 className="title">A SEASON-LONG STAGE FOR YOUR BRAND</h2>
        <p className="lead">
          BCPL is a season-long T20 league built around working professionals — an urban, earning,
          brand-aware audience — across trials, the auction, match-days and digital coverage.
        </p>
        <div className="grid4">
          <div className="stat"><b>{SEASON.teams}</b><span>Franchise teams</span></div>
          <div className="stat"><b>{SEASON.trialCities}</b><span>Trial cities</span></div>
          <div className="stat"><b>{SEASON.prizePool}</b><span>Prize pool</span></div>
          <div className="stat"><b>1</b><span>Season-long league</span></div>
        </div>
        <div className="foot">Indicative figures for Season {SEASON.number}. Final scope confirmed per agreement.</div>
        <div className="brandbar" />
      </section>

      {/* 3 — Audience & digital reach (qualitative) */}
      <section className="slide">
        <div className="kick">Audience &amp; digital reach</div>
        <h2 className="title">WHERE YOUR BRAND SHOWS UP</h2>
        <div className="grid3">
          <div className="card">
            <h3>The audience</h3>
            <p>Every player is a working professional — an urban, earning, brand-aware audience that
               follows the league across a full season.</p>
          </div>
          <div className="card">
            <h3>Digital presence</h3>
            <ul>
              <li>Official website with a live sponsor strip</li>
              <li>Mobile app for players &amp; fans</li>
              <li>Social channels &amp; match-day content</li>
            </ul>
          </div>
          <div className="card">
            <h3>On the ground</h3>
            <ul>
              <li>Trials across multiple cities</li>
              <li>Live auction &amp; team events</li>
              <li>Match-day branding &amp; announcements</li>
            </ul>
          </div>
        </div>
        <div className="foot">Reach is qualitative here — verified figures appear on the league&rsquo;s public pages.</div>
        <div className="brandbar" />
      </section>

      {/* 4 — Tier table */}
      <section className="slide">
        <div className="kick">Ways to partner</div>
        <h2 className="title">SPONSORSHIP TIERS</h2>
        <table className="tiers">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Deliverable</th>
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
        <div className="foot">Indicative deliverables — final scope, placements and pricing are confirmed per agreement.</div>
        <div className="brandbar" />
      </section>

      {/* 5 — Branding placements (CSS mock) */}
      <section className="slide">
        <div className="kick">Branding placements</div>
        <h2 className="title">WHERE YOUR LOGO LIVES</h2>
        <div className="mock">
          <div className="mockcell">
            <h3 style={{ margin: 0, fontFamily: "'Montserrat',sans-serif", fontSize: 15 }}>Jersey branding</h3>
            <div className="jersey"><span className="logo">YOUR BRAND</span></div>
          </div>
          <div className="mockcell">
            <h3 style={{ margin: 0, fontFamily: "'Montserrat',sans-serif", fontSize: 15 }}>LED &amp; ground branding</h3>
            <div className="led"><span className="logo">YOUR BRAND</span></div>
            <div className="led"><span className="logo">YOUR BRAND</span></div>
          </div>
          <div className="mockcell">
            <h3 style={{ margin: 0, fontFamily: "'Montserrat',sans-serif", fontSize: 15 }}>Website sponsor strip</h3>
            <div className="screen"><div className="bar"><span className="chip">YOUR BRAND</span><span className="chip">PARTNER</span></div></div>
          </div>
          <div className="mockcell">
            <h3 style={{ margin: 0, fontFamily: "'Montserrat',sans-serif", fontSize: 15 }}>App logo placement</h3>
            <div className="screen"><div className="bar"><span className="chip">YOUR BRAND</span></div></div>
          </div>
        </div>
        <div className="foot">Illustrative mock-ups — actual placements depend on the agreed package.</div>
        <div className="brandbar" />
      </section>

      {/* 6 — Past seasons montage */}
      <section className="slide">
        <div className="kick">Past seasons</div>
        <h2 className="title">MOMENTS FROM THE LEAGUE</h2>
        <div className="strip">
          {['event-teams-a.webp', 'event-teams-b.webp', 'event-stage-trophy.webp', 'auction-hero.webp'].map(f => (
            <img key={f} src={asset(f)} alt="BCPL season moment" />
          ))}
        </div>
        <div className="strip" style={{ marginTop: '5mm' }}>
          {['jerseys.webp', 'event-panel.webp', 'ganguly_1.jpg', 'ganguly_shoot.jpg'].map(f => (
            <img key={f} src={asset(f)} alt="BCPL season moment" />
          ))}
        </div>
        <div className="brandbar" />
      </section>

      {/* 7 — Contact */}
      <section className="slide" style={{ justifyContent: 'center' }}>
        <img className="cover-logo" src={asset('bcpl-logo-white.png')} alt="BCPL" />
        <div className="kick" style={{ marginTop: '10mm' }}>Let&rsquo;s build the right partnership</div>
        <h2 className="title" style={{ fontSize: 44 }}>TALK TO THE <span className="gold">BCPL TEAM</span></h2>
        <div className="contact-row">
          <span className="contact-pill">{SP_EMAIL}</span>
          <span className="contact-pill">{SP_PHONE}</span>
          <span className="contact-pill">wa.me/919151346555</span>
        </div>
        <div className="foot">Bhartiya Corporate Premier League &middot; Season {SEASON.number}</div>
        <div className="brandbar" />
      </section>
    </div>
  );
}
