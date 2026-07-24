import React from "react";
import { Link } from "wouter";
import { getPublicSponsors, type PublicSponsor } from "../lib/api";

/**
 * Compact IPL/FIFA-style partners strip shown above the footer on EVERY page
 * (rendered by BCPLFooter). Sponsors come from the admin panel — the admin
 * list order IS the ranking here (top of the list shows first), grouped by
 * category in that order, so e.g. the Title Sponsor block leads.
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

  /* Group by category, preserving admin order (first appearance wins). */
  const groups: { label: string; items: PublicSponsor[] }[] = [];
  for (const s of sponsors) {
    const label = (s.category || "").trim() || "Partner";
    const g = groups.find(x => x.label.toLowerCase() === label.toLowerCase());
    if (g) g.items.push(s); else groups.push({ label, items: [s] });
  }

  return (
    <section aria-label="BCPL partners" style={{ background:"#050B18", borderTop:"1px solid rgba(255,255,255,.06)", padding:"clamp(30px,4.5vw,48px) 0 clamp(26px,4vw,40px)", fontFamily:"Montserrat,Inter,sans-serif" }}>
      <style>{`
        .bcpl-spst-wrap { max-width:1200px; margin:0 auto; padding:0 clamp(16px,4vw,40px); }
        .bcpl-spst-groups { display:flex; flex-wrap:wrap; justify-content:center; align-items:flex-start; gap:clamp(26px,4vw,52px) clamp(30px,5vw,64px); }
        .bcpl-spst-chip { background:#fff; border-radius:12px; display:flex; align-items:center; justify-content:center; padding:10px 18px; text-decoration:none; transition:transform .15s; }
        a.bcpl-spst-chip:hover { transform:translateY(-2px); }
        .bcpl-spst-all:hover { color:#FF7A29!important; }
      `}</style>
      <div className="bcpl-spst-wrap">
        <div className="bcpl-spst-groups">
          {groups.map((g, gi) => {
            const big = gi === 0; /* top-ranked tier gets bigger logos */
            const h = big ? 46 : 32;
            return (
              <div key={g.label} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:big?13:11, letterSpacing:".16em", textTransform:"uppercase", color: big ? "#E8B23D" : "rgba(255,255,255,.4)", marginBottom:12 }}>
                  {g.label}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:12 }}>
                  {g.items.map((s, i) => {
                    const inner = s.logo
                      ? <img src={s.logo} alt={s.name + " logo"} loading="lazy" style={{ height:h, maxWidth:big?170:120, objectFit:"contain", display:"block" }}/>
                      : <span style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:big?17:13, color:"#0A162E", whiteSpace:"nowrap", maxWidth:big?220:160, overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</span>;
                    return s.website
                      ? <a key={i} className="bcpl-spst-chip" href={s.website} target="_blank" rel="noopener noreferrer" title={s.name} style={{ minHeight:big?66:50 }}>{inner}</a>
                      : <div key={i} className="bcpl-spst-chip" title={s.name} style={{ minHeight:big?66:50 }}>{inner}</div>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign:"center", marginTop:22 }}>
          <Link href="/sponsors" className="bcpl-spst-all"
            style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", color:"rgba(255,255,255,.35)", textDecoration:"none", textTransform:"uppercase", transition:"color .2s" }}>
            All Partners →
          </Link>
        </div>
      </div>
    </section>
  );
}
