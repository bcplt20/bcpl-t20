/* ── BCPL shared inline SVG icon set (2026 master spec §36 — no emoji in UI) ──
   Usage: <IcoTrophy size={20} style={{ color:'var(--gold)' }} />
   Stroke inherits currentColor; wrap in a colored span or pass style.color.
   This file is the ONLY icon source for the public site — do not define
   per-page icon components, and do not add lucide imports for public pages. */
import React from 'react';

const ico = (d: React.ReactNode, vb = '0 0 24 24') => (p: { size?: number; style?: React.CSSProperties }) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox={vb} fill="none" stroke="currentColor"
    strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...p.style }} aria-hidden="true">{d}</svg>
);

/* ── Core (from PlayerProfile) ── */
export const IcoHome    = ico(<><path d="M4 11 12 4l8 7" /><path d="M6 10v9h12v-9" /></>);
export const IcoRoute   = ico(<><circle cx="6" cy="19" r="2.4" /><circle cx="18" cy="5" r="2.4" /><path d="M8.2 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.6" /></>);
export const IcoCard    = ico(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 10h18" /><path d="M7 15h4" /></>);
export const IcoUser    = ico(<><circle cx="12" cy="8" r="3.6" /><path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5" /></>);
export const IcoHeadset = ico(<><path d="M4 13a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="6" rx="1.6" /><rect x="17" y="13" width="4" height="6" rx="1.6" /></>);
export const IcoOut     = ico(<><path d="M14 4h-8v16h8" /><path d="M10 12h11" /><path d="m17 8 4 4-4 4" /></>);
export const IcoTicket  = ico(<><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" /><path d="M13 6v2.5M13 11v2M13 15.5V18" strokeDasharray="0.1 3.4" /></>);
export const IcoDoc     = ico(<><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M10 12h5M10 16h5" /></>);
export const IcoCheck   = ico(<path d="M4.5 12.5 10 18 19.5 7" />);
export const IcoX       = ico(<><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>);
export const IcoSearch  = ico(<><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></>);
export const IcoStar    = ico(<path d="m12 3.5 2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.5l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7Z" />);
export const IcoVideo   = ico(<><rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="m16 10 5-3v10l-5-3" /></>);
export const IcoIdCard  = ico(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="8.5" cy="11" r="2" /><path d="M6 16c.6-1.4 1.5-2 2.5-2s1.9.6 2.5 2" /><path d="M14 10h5M14 14h5" /></>);
export const IcoClock   = ico(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>);
export const IcoPin     = ico(<><path d="M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11Z" /><circle cx="12" cy="10" r="2.6" /></>);
export const IcoFlag    = ico(<><path d="M5 21V4" /><path d="M5 4h12l-2.5 4L17 12H5" /></>);
export const IcoTrophy  = ico(<><path d="M7 4h10v5a5 5 0 0 1-10 0Z" /><path d="M7 6H4v1a4 4 0 0 0 3 3.9M17 6h3v1a4 4 0 0 1-3 3.9" /><path d="M12 14v3" /><path d="M8 21h8M9 21c0-2 1-3 3-3s3 1 3 3" /></>);
export const IcoPen     = ico(<><path d="m14.5 5.5 4 4L8 20H4v-4Z" /><path d="m12.5 7.5 4 4" /></>);
export const IcoList    = ico(<><rect x="4" y="3.5" width="16" height="17" rx="2.5" /><path d="M9 3.5h6v3H9z" /><path d="M8 11h8M8 15h5" /></>);

/* ── Sweep vocabulary (§36) ── */
export const IcoChat     = ico(<path d="M20 15a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" />);
export const IcoMail     = ico(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7.5 8.5 6 8.5-6" /></>);
export const IcoPhone    = ico(<path d="M5 4h4l1.6 4.6-2.2 1.9a12.5 12.5 0 0 0 5.1 5.1l1.9-2.2L20 15v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />);
export const IcoBell     = ico(<><path d="M6 9.5a6 6 0 0 1 12 0c0 4.8 1.8 6 1.8 6H4.2s1.8-1.2 1.8-6" /><path d="M10 19.5a2.2 2.2 0 0 0 4 0" /></>);
export const IcoGift     = ico(<><rect x="4" y="9" width="16" height="4" rx="1" /><path d="M6 13v6.5h12V13" /><path d="M12 9v10.5" /><path d="M12 9C9.5 9 7.5 7.8 7.5 6.2 7.5 4.9 8.6 4 9.7 4c1.6 0 2.3 2.4 2.3 5 0-2.6.7-5 2.3-5 1.1 0 2.2.9 2.2 2.2C16.5 7.8 14.5 9 12 9Z" /></>);
export const IcoMedal    = ico(<><circle cx="12" cy="15" r="4.5" /><path d="m8.8 11.6-3-7.6h4.4L12 9l1.8-5h4.4l-3 7.6" /></>);
export const IcoScale    = ico(<><path d="M12 5v15" /><path d="M8.5 20h7" /><path d="M4.5 7h15" /><path d="M7 7 4 13a3.2 3.2 0 0 0 6 0Z" /><path d="M17 7l-3 6a3.2 3.2 0 0 0 6 0Z" /></>);
export const IcoLock     = ico(<><rect x="5" y="11" width="14" height="9.5" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const IcoTarget   = ico(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.8" /><circle cx="12" cy="12" r="1.4" /></>);
export const IcoCalendar = ico(<><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>);
export const IcoStadium  = ico(<><ellipse cx="12" cy="15.5" rx="8.5" ry="4" /><path d="M3.5 15.5V12c0-2.2 3.8-4 8.5-4s8.5 1.8 8.5 4v3.5" /><path d="M12 8V5.5" /></>);
export const IcoBan      = ico(<><circle cx="12" cy="12" r="8.5" /><path d="m6.2 6.2 11.6 11.6" /></>);
export const IcoFlask    = ico(<><path d="M10 3.5v5.5l-5.4 8.9A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-3.1L14 9V3.5" /><path d="M8.5 3.5h7" /><path d="M7.6 15h8.8" /></>);
export const IcoShirt    = ico(<path d="m9 4-5.5 3 2 4L8 10v10h8V10l2.5 1 2-4L15 4a3 3 0 0 1-6 0Z" />);
export const IcoBulb     = ico(<><path d="M12 3a6 6 0 0 0-3.6 10.8c.9.7 1.6 1.4 1.6 2.2h4c0-.8.7-1.5 1.6-2.2A6 6 0 0 0 12 3Z" /><path d="M10 19h4M10.7 21.5h2.6" /></>);
export const IcoPrinter  = ico(<><path d="M7 8V3.5h10V8" /><rect x="4" y="8" width="16" height="8" rx="2" /><path d="M7 13.5h10v7H7z" /></>);
export const IcoWarn     = ico(<><path d="M12 3.5 22 20H2Z" /><path d="M12 9.5v4.5" /><path d="M12 17.3h.01" /></>);
export const IcoKey      = ico(<><circle cx="8" cy="15.5" r="3.8" /><path d="m10.8 12.7 8.7-8.7" /><path d="m15 8.5 3 3" /></>);
export const IcoImage    = ico(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="8.5" cy="10" r="1.7" /><path d="m5 18 5-5 3 3 3.5-3.5L21 17" /></>);
export const IcoCamera   = ico(<><path d="M4 7.5h3.5L9.5 5h5l2 2.5H20a1 1 0 0 1 1 1V19H3V8.5a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.4" /></>);
export const IcoDownload = ico(<><path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>);
export const IcoUpload   = ico(<><path d="M12 20V9" /><path d="m7 13 5-5 5 5" /><path d="M5 4h14" /></>);
export const IcoInfo     = ico(<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><path d="M12 7.8h.01" /></>);
export const IcoShield   = ico(<path d="M12 3 5 6v6c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6Z" />);
export const IcoBall     = ico(<><circle cx="12" cy="12" r="8.5" /><path d="M8 4.7c2.4 4.5 2.4 10.1 0 14.6M16 4.7c-2.4 4.5-2.4 10.1 0 14.6" /></>);
export const IcoBat      = ico(<><path d="m13.5 3.5 7 7-9 9a3 3 0 0 1-4.3 0L4.5 16.8a3 3 0 0 1 0-4.3Z" /><path d="m3.5 20.5 2.7-2.7" /></>);
export const IcoZap      = ico(<path d="M13 3 5 13.5h5L10.5 21 19 10.5h-5.5Z" />);
export const IcoEyeOff   = ico(<><path d="m4 4 16 16" /><path d="M9.9 5.2A10 10 0 0 1 21 12a15.6 15.6 0 0 1-2.7 3.3M6.2 6.9A14.6 14.6 0 0 0 3 12s3.4 6 9 6a9.5 9.5 0 0 0 3.1-.5" /></>);
export const IcoRupee    = ico(<><path d="M6.5 4h11M6.5 8.5h11" /><path d="M6.5 4c5.5 0 7.5 1.8 7.5 4.5S11.5 13 9 13H6.5l7.5 7.5" /></>);
export const IcoBook     = ico(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5Z" /><path d="M20 17v4H6.5a2.5 2.5 0 0 1-2.5-2.5" /></>);
export const IcoMegaphone= ico(<><path d="M4 10v4h3l7 5V5l-7 5Z" /><path d="M17 9a4.5 4.5 0 0 1 0 6" /></>);
export const IcoHourglass= ico(<><path d="M7 3h10M7 21h10" /><path d="M8 3v3.5L12 11l4-4.5V3M8 21v-3.5L12 13l4 4.5V21" /></>);
export const IcoGauge    = ico(<><path d="M4.5 16.5a8.5 8.5 0 1 1 15 0" /><path d="m12 14.5 3.8-4.8" /><path d="M12 14.5h.01" /></>);
export const IcoUsers    = ico(<><circle cx="9" cy="9" r="3.1" /><path d="M3.5 19.5c1-2.8 3-4.2 5.5-4.2s4.5 1.4 5.5 4.2" /><circle cx="16.8" cy="9.8" r="2.6" /><path d="M15.7 15.6c2.4.2 4 1.5 4.9 3.9" /></>);
export const IcoPages    = ico(<><path d="M8 3h9a2 2 0 0 1 2 2v13" /><path d="M6 6h9a2 2 0 0 1 2 2v13H8a2 2 0 0 1-2-2Z" /><path d="M9.5 11.5h6M9.5 15.5h6" /></>);
