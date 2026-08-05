import React from 'react';
import { useLang } from '../lib/i18n';
import { getPublicSponsors, type PublicSponsor } from '../lib/api';

/**
 * Public sponsor wall — IPL-style TIER hierarchy of the ACTIVE sponsors
 * managed from the admin panel (Sponsors view). Sponsors are grouped by
 * category in the admin's array order (first appearance wins), so the tier
 * order is exactly what the owner set. Tier 1 = biggest, centered card(s);
 * lower tiers get progressively smaller rows. Tier labels are rendered
 * as-is from the admin-typed category strings (already English labels).
 *
 * Renders nothing while loading or when no sponsor is published, so pages
 * look unchanged until the owner adds sponsors.
 */
type Group = { label: string; items: PublicSponsor[] };

function groupByTier(list: PublicSponsor[]): Group[] {
  const groups: Group[] = [];
  for (const s of list) {
    const label = (s.category || '').trim() || 'Partners';
    const g = groups.find(x => x.label.toLowerCase() === label.toLowerCase());
    if (g) g.items.push(s); else groups.push({ label, items: [s] });
  }
  return groups;
}

export function SponsorWall() {
  const { t } = useLang();
  const [sponsors, setSponsors] = React.useState<PublicSponsor[] | null>(null);

  React.useEffect(() => {
    let alive = true;
    getPublicSponsors()
      .then(r => { if (alive) setSponsors(r.sponsors ?? []); })
      .catch(() => { if (alive) setSponsors([]); });
    return () => { alive = false; };
  }, []);

  if (!sponsors || sponsors.length === 0) return null;

  const groups = groupByTier(sponsors);

  const chip = (s: PublicSponsor, logoH: number, key: React.Key) => {
    const inner = (
      <div className="bcpl-sw-chip" style={{ padding: `${Math.round(logoH * 0.28)}px ${Math.round(logoH * 0.42)}px` }}>
        {s.logo
          ? <img src={s.logo} alt={s.name + ' logo'} loading="lazy"
              style={{ height: logoH, maxWidth: logoH * 3.2, objectFit: 'contain', display: 'block' }} />
          : <span style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: Math.round(logoH * 0.4), color: '#1E325A', whiteSpace: 'nowrap' }}>
              {s.name}
            </span>}
      </div>
    );
    return s.website
      ? <a key={key} href={s.website} target="_blank" rel="noopener noreferrer" title={s.name} style={{ textDecoration: 'none', display: 'block' }}>{inner}</a>
      : <div key={key} title={s.name}>{inner}</div>;
  };

  return (
    <section style={{ padding: '0 0 64px' }}>
      <style>{`
        .bcpl-sw-chip {
          background:#fff; border-radius:16px; display:flex; align-items:center; justify-content:center;
          box-shadow:0 6px 20px rgba(0,0,0,0.25); transition:transform .18s, box-shadow .18s;
        }
        a:hover > .bcpl-sw-chip, div:hover > .bcpl-sw-chip { transform:translateY(-4px); box-shadow:0 12px 28px rgba(0,0,0,0.32); }
        .bcpl-sw-tierlabel {
          font-family:'Barlow Condensed',Montserrat,sans-serif; font-weight:800; letter-spacing:.16em;
          text-transform:uppercase; color:#E8B23D; text-align:center; margin-bottom:14px;
        }
        .bcpl-sw-row { display:flex; flex-wrap:wrap; justify-content:center; align-items:center; }
      `}</style>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(20px,3.5vw,32px)', color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>
            {t('Our Sponsors & Partners', 'हमारे Sponsors & Partners')}
          </div>
          <p style={{ color: 'var(--ink-3)', fontSize: 14, fontFamily: 'Inter,sans-serif', margin: 0 }}>
            {t('The brands powering BCPL Season 5', 'BCPL Season 5 को support करने वाले brands')}
          </p>
        </div>

        {groups.map((g, gi) => {
          // Tier 1 = largest, Tier 2 = medium, remaining = small.
          const logoH = gi === 0 ? 90 : gi === 1 ? 56 : 40;
          const gap = gi === 0 ? 28 : gi === 1 ? 22 : 16;
          const labelSize = gi === 0 ? 14 : gi === 1 ? 12 : 11;
          const marginTop = gi === 0 ? 0 : gi === 1 ? 44 : 34;
          return (
            <div key={g.label} style={{ marginTop }}>
              <div className="bcpl-sw-tierlabel" style={{ fontSize: labelSize, opacity: gi === 0 ? 1 : 0.85 }}>
                {g.label}
              </div>
              <div className="bcpl-sw-row" style={{ gap }}>
                {g.items.map((s, i) => chip(s, logoH, i))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
