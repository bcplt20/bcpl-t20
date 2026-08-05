import React from "react";
import { Link } from "wouter";
import { getPublicSponsors, type PublicSponsor } from "../lib/api";

/**
 * IPL-style partners strip shown above the footer on EVERY page (rendered by
 * BCPLFooter): ONE clean centered row of white logo chips — no tier headings,
 * no stacked groups. Sponsors come from the admin panel and the admin list
 * order IS the display order (tier ranking), so the top sponsor shows first.
 * If logos don't fit on one line they wrap, and wrapped rows stay centered.
 * Renders nothing while loading or when no active sponsor exists.
 *
 * Cached for 60s per session — the footer is on every page and must not
 * refetch on each SPA navigation, but fresh admin edits still show quickly.
 */
let cached: PublicSponsor[] | null = null;
let cachedAt = 0;
let inflight: Promise<PublicSponsor[]> | null = null;

function loadSponsors(): Promise<PublicSponsor[]> {
  if (cached && Date.now() - cachedAt < 60_000) return Promise.resolve(cached);
  if (!inflight) {
    inflight = getPublicSponsors()
      .then(r => {
        cached = r.sponsors ?? [];
        cachedAt = Date.now();
        inflight = null;
        return cached;
      })
      .catch(() => { inflight = null; return cached ?? []; }); // keep stale on failure, retry next mount
  }
  return inflight;
}

export function FooterSponsorStrip() {
  const [sponsors, setSponsors] = React.useState<PublicSponsor[] | null>(cached);

  React.useEffect(() => {
    let alive = true;
    void loadSponsors().then(list => { if (alive) setSponsors(list); });
    return () => { alive = false; };
  }, []);

  if (!sponsors || sponsors.length === 0) return null;

  return (
    <section aria-label="BCPL partners" style={{ background:"#111F3C", borderTop:"1px solid rgba(255,255,255,0.18)", padding:"clamp(26px,4vw,40px) 0 clamp(22px,3.5vw,34px)", fontFamily:"Montserrat,Inter,sans-serif" }}>
      <style>{`
        .bcpl-spst-wrap { max-width:1200px; margin:0 auto; padding:0 clamp(16px,4vw,40px); }
        .bcpl-spst-row { display:flex; flex-wrap:wrap; justify-content:center; align-items:center; gap:clamp(10px,2vw,18px); }
        .bcpl-spst-chip { background:#fff; border-radius:12px; display:flex; align-items:center; justify-content:center; padding:10px 18px; min-height:58px; text-decoration:none; transition:transform .15s; }
        a.bcpl-spst-chip:hover { transform:translateY(-2px); }
        .bcpl-spst-all:hover { color:#FF7A29!important; }
      `}</style>
      <div className="bcpl-spst-wrap">
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:12, letterSpacing:".2em", textTransform:"uppercase", color:"rgba(255,255,255,.45)", textAlign:"center", marginBottom:16 }}>
          Official Partners
        </div>
        <div className="bcpl-spst-row">
          {sponsors.map((s, i) => {
            const inner = s.logo
              ? <img src={s.logo} alt={s.name + " logo"} loading="lazy" style={{ height:38, maxWidth:150, objectFit:"contain", display:"block" }}/>
              : <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:15, color:"#1E325A", whiteSpace:"nowrap", maxWidth:190, overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</span>;
            return s.website
              ? <a key={i} className="bcpl-spst-chip" href={s.website} target="_blank" rel="noopener noreferrer" title={s.name}>{inner}</a>
              : <div key={i} className="bcpl-spst-chip" title={s.name}>{inner}</div>;
          })}
        </div>
        <div style={{ textAlign:"center", marginTop:20 }}>
          <Link href="/sponsors" className="bcpl-spst-all"
            style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", color:"var(--ink-3)", textDecoration:"none", textTransform:"uppercase", transition:"color .2s" }}>
            All Partners →
          </Link>
        </div>
      </div>
    </section>
  );
}
