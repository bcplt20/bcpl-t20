import React from 'react';
import { useLang } from '../lib/i18n';
import { getPublicSponsors, type PublicSponsor } from '../lib/api';

/**
 * Public sponsor wall — shows the ACTIVE sponsors managed from the admin
 * panel (Sponsors view). Renders nothing while loading or when no sponsor
 * is published, so pages look unchanged until the owner adds sponsors.
 */
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

  return (
    <section style={{ padding: '0 0 64px' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 'clamp(20px,3.5vw,32px)', color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>
            {t('Our Sponsors & Partners', 'हमारे Sponsors & Partners')}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, fontFamily: 'Inter,sans-serif', margin: 0 }}>
            {t('The brands powering BCPL Season 5', 'BCPL Season 5 को support करने वाले brands')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          {sponsors.map((s, i) => {
            const card = (
              <div style={{ background: 'linear-gradient(135deg,rgba(15,34,71,0.92),rgba(10,22,46,0.88))', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '22px 18px', textAlign: 'center', height: '100%', transition: 'border-color .2s' }}>
                <div style={{ width: 88, height: 88, borderRadius: 14, background: '#fff', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
                  {s.logo
                    ? <img src={s.logo} alt={s.name + ' logo'} loading="lazy"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
                    : <span style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 30, color: '#0A162E' }}>
                        {s.name.charAt(0).toUpperCase()}
                      </span>}
                </div>
                <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>{s.name}</div>
                {s.category && (
                  <span style={{ display: 'inline-block', background: 'rgba(232,178,61,0.1)', border: '1px solid rgba(232,178,61,0.35)', color: '#E8B23D', borderRadius: 100, padding: '3px 12px', fontSize: 10, fontWeight: 800, fontFamily: 'Montserrat,sans-serif', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                    {s.category}
                  </span>
                )}
              </div>
            );
            return s.website
              ? <a key={i} href={s.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>{card}</a>
              : <div key={i}>{card}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
