import React from 'react';
import { useLang } from './i18n';
import { IcoWarn, IcoPrinter } from './icons';

/* ═══════════════════════════════════════════════════════════════════
 *  BCPL LEGAL DOCUMENT VERSIONING — single source of truth
 *  Flip LEGAL_APPROVAL_PENDING to false ONLY after the owner explicitly
 *  approves the legal wording for production publication.
 * ═══════════════════════════════════════════════════════════════════ */

export const LEGAL_APPROVAL_PENDING = false; // owner approved the legal wording on 24 July 2026

export const LEGAL_LAST_UPDATED = 'August 4, 2026';
export const LEGAL_LAST_UPDATED_HI = '4 अगस्त 2026';

export const LEGAL_DOCS = {
  terms:       { version: '2.1', titleEn: 'Terms & Conditions',            titleHi: 'नियम और शर्तें' },
  privacy:     { version: '2.1', titleEn: 'Privacy Policy',                titleHi: 'प्राइवेसी पॉलिसी' },
  refunds:     { version: '2.1', titleEn: 'Refund & Cancellation Policy',  titleHi: 'रिफंड और कैंसिलेशन पॉलिसी' },
  eligibility: { version: '2.1', titleEn: 'Eligibility Criteria',          titleHi: 'योग्यता मानदंड' },
  brandUsage:  { version: '1.0', titleEn: 'Brand, Photo & Logo Usage Policy', titleHi: 'ब्रांड, फोटो और लोगो उपयोग नीति', lastUpdatedEn: 'August 5, 2026', lastUpdatedHi: '5 अगस्त 2026' },
  selection:   { version: '2.1', titleEn: 'How Selection Works',           titleHi: 'चयन प्रक्रिया' },
  trialRules:  { version: '1.2', titleEn: 'Phase 2 Physical Trial Rules',  titleHi: 'फेज 2 फिजिकल ट्रायल नियम' },
  videoRules:  { version: '1.1', titleEn: 'Phase 1 Video Rules',           titleHi: 'फेज 1 वीडियो नियम' },
  conduct:     { version: '2.1', titleEn: 'Code of Conduct',               titleHi: 'आचार संहिता' },
  rulebook:    { version: '1.2', titleEn: 'BCPL Cricket Rulebook',         titleHi: 'BCPL क्रिकेट रूलबुक' },
  faq:         { version: '2.1', titleEn: 'Frequently Asked Questions',    titleHi: 'अक्सर पूछे जाने वाले सवाल' },
} as const;

export type LegalDocKey = keyof typeof LEGAL_DOCS;

/* Version strings recorded server-side when a player accepts terms /
 * declarations (documentVersion + acceptedAt). Keep in sync with LEGAL_DOCS. */
export const CONSENT_VERSIONS = {
  terms: LEGAL_DOCS.terms.version,
  privacy: LEGAL_DOCS.privacy.version,
  phase2Declarations: '2.1',
} as const;

/* ─── Print stylesheet: prints exactly what is displayed (incl. draft
 *     status), forced to light theme for paper. ─────────────────────── */
const printCss = `
/* Letterhead, watermark and print footer are hidden on screen; only paper. */
.legal-print-only { display: none !important; }
@media print {
  @page { margin: 22mm 14mm 20mm; }
  body { background: #fff !important; }
  header, nav, .float-reg-btn, .toc-sticky, .mobile-jump, .no-print,
  [data-sticky-cta], button:not(.print-keep) { display: none !important; }
  * { color: #111 !important; background: transparent !important;
      box-shadow: none !important; text-shadow: none !important;
      animation: none !important; backdrop-filter: none !important; }
  .glass-card { border: 1px solid #ccc !important; page-break-inside: avoid; }
  a { text-decoration: underline; }
  .legal-doc-header { border: 1.5px solid #333 !important; }

  /* ── Show the print-only chrome ── */
  .legal-print-only { display: block !important; }

  /* ── Letterhead band ── */
  .legal-letterhead {
    display: flex !important; align-items: center; justify-content: space-between;
    gap: 16px; padding-bottom: 8px; margin-bottom: 6px;
    border-bottom: 1.5px solid #FF7A29 !important;
  }
  .legal-letterhead img {
    height: 46px; width: auto; object-fit: contain; flex-shrink: 0;
    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
  }
  .legal-letterhead-org { text-align: right; line-height: 1.35; }
  .legal-letterhead-org .lh-name { font-family: Montserrat, sans-serif; font-weight: 800; font-size: 12.5px; color: #111 !important; }
  .legal-letterhead-org .lh-sub  { font-size: 10px; color: #444 !important; }
  .legal-letterhead-org .lh-meta { font-size: 10px; color: #444 !important; }

  /* Keep page content above the watermark without negative stacking
     (negative z-index on fixed elements is unreliable in print engines). */
  main, .wrap, .glass-card, .legal-doc-header { position: relative; z-index: 1; }

  /* ── Diagonal watermark (fixed → repeats on every printed page) ── */
  .legal-watermark {
    display: block !important;
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    width: 70%; z-index: 0; opacity: 0.07;
    pointer-events: none;
    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
  }
  .legal-watermark img { width: 100%; height: auto;
    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  /* ── Fixed bottom footer, repeats on every page ── */
  .legal-print-footer {
    display: block !important;
    position: fixed; bottom: 6mm; left: 0; right: 0;
    text-align: center; font-family: Inter, sans-serif;
    font-size: 8.5px; color: #555 !important; line-height: 1.5;
    border-top: 0.75px solid #ccc !important; padding-top: 4px;
  }
}
`;

/* ─── LegalDocHeader ──────────────────────────────────────────────────
 * Usage (directly under the page hero / h1, inside the .wrap container):
 *   import { LegalDocHeader } from '../lib/legalMeta';
 *   <LegalDocHeader doc="privacy" />
 * Renders: version · effective date · last updated · PRINT/PDF button,
 * plus an amber LEGAL APPROVAL PENDING banner while drafts await owner
 * approval. Pages must NOT hand-write their own "Last updated" lines.
 * ─────────────────────────────────────────────────────────────────── */
export function LegalDocHeader({ doc }: { doc: LegalDocKey }) {
  const { t } = useLang();
  const meta = LEGAL_DOCS[doc];
  const logoSrc = import.meta.env.BASE_URL + 'bcpl-assets/bcpl-logo-main.png';
  // Per-doc last-updated override, falling back to the global default.
  const lastUpdatedEn = 'lastUpdatedEn' in meta ? (meta as { lastUpdatedEn: string }).lastUpdatedEn : LEGAL_LAST_UPDATED;
  const lastUpdatedHi = 'lastUpdatedHi' in meta ? (meta as { lastUpdatedHi: string }).lastUpdatedHi : LEGAL_LAST_UPDATED_HI;
  return (
    <div style={{ maxWidth: 880, margin: '0 auto 28px' }}>
      <style>{printCss}</style>

      {/* ── PRINT-ONLY: diagonal watermark (repeats on every page) ── */}
      <div className="legal-print-only legal-watermark" aria-hidden="true">
        <img src={logoSrc} alt="" />
      </div>

      {/* ── PRINT-ONLY: letterhead band ── */}
      <div className="legal-print-only legal-letterhead" aria-hidden="true">
        <img src={logoSrc} alt="BCPL T20" />
        <div className="legal-letterhead-org">
          <div className="lh-name">Bhartiya Corporate Premier League (BCPL T20)</div>
          <div className="lh-sub">An initiative of Kriparti Playing11 Private Limited</div>
          <div className="lh-meta">bcplt20.com&nbsp;·&nbsp;info@bcplt20.com</div>
        </div>
      </div>

      {/* ── PRINT-ONLY: fixed footer (repeats on every page) ── */}
      <div className="legal-print-only legal-print-footer" aria-hidden="true">
        © BCPL T20 — Official document. Unauthorized reproduction, copying or republication is prohibited.
        &nbsp;·&nbsp; v{meta.version} · {t(lastUpdatedEn, lastUpdatedHi)}
      </div>

      {LEGAL_APPROVAL_PENDING && (
        <div className="legal-pending-banner" style={{
          background: 'rgba(232,178,61,0.10)', border: '1px solid rgba(232,178,61,0.45)',
          borderLeft: '4px solid #E8B23D', borderRadius: 12, padding: '12px 16px',
          marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ lineHeight: 1, flexShrink: 0, color: '#E8B23D' }}><IcoWarn size={18} /></span>
          <div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '.08em', color: '#E8B23D', textTransform: 'uppercase' }}>
              {t('Legal approval pending', 'Legal approval pending')}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 1.55, marginTop: 3 }}>
              {t('This is an updated draft under legal review. The previously published version continues to apply until this draft is approved and published.',
                 'यह updated draft अभी legal review में है। जब तक यह approve होकर publish नहीं होता, पहले से published version ही लागू रहेगा।')}
            </div>
          </div>
        </div>
      )}
      <div className="legal-doc-header" style={{
        background: 'linear-gradient(165deg,rgba(15,34,71,0.75),rgba(10,22,46,0.7))',
        border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12,
        padding: '12px 16px', display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', gap: '8px 18px',
      }}>
        {[
          [t('Version', 'Version'), `v${meta.version}${LEGAL_APPROVAL_PENDING ? t(' (draft)', ' (draft)') : ''}`],
          [t('Effective date', 'लागू होने की तारीख'), LEGAL_APPROVAL_PENDING ? t('Upon publication after approval', 'Approval के बाद publish होने पर') : t(lastUpdatedEn, lastUpdatedHi)],
          [t('Last updated', 'आखिरी अपडेट'), t(lastUpdatedEn, lastUpdatedHi)],
        ].map(([k, v]) => (
          <div key={k as string} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontFamily: 'Montserrat,sans-serif' }}>{k}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#E8B23D' }}>{v}</span>
          </div>
        ))}
        <button
          type="button"
          className="no-print"
          onClick={() => window.print()}
          style={{
            marginLeft: 'auto', background: 'rgba(255,122,41,0.10)',
            border: '1px solid rgba(255,122,41,0.35)', borderRadius: 9,
            color: '#FF7A29', fontFamily: 'Montserrat,sans-serif', fontWeight: 800,
            fontSize: 11, letterSpacing: '.06em', padding: '8px 14px',
            cursor: 'pointer', minHeight: 36,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <IcoPrinter size={14} /> {t('PRINT / DOWNLOAD PDF', 'PRINT / PDF DOWNLOAD')}
        </button>
      </div>
    </div>
  );
}
