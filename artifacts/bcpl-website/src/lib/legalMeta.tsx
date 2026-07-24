import React from 'react';
import { useLang } from './i18n';

/* ═══════════════════════════════════════════════════════════════════
 *  BCPL LEGAL DOCUMENT VERSIONING — single source of truth
 *  Flip LEGAL_APPROVAL_PENDING to false ONLY after the owner explicitly
 *  approves the legal wording for production publication.
 * ═══════════════════════════════════════════════════════════════════ */

export const LEGAL_APPROVAL_PENDING = false; // owner approved the legal wording on 24 July 2026

export const LEGAL_LAST_UPDATED = 'July 24, 2026';
export const LEGAL_LAST_UPDATED_HI = '24 जुलाई 2026';

export const LEGAL_DOCS = {
  terms:       { version: '2.0', titleEn: 'Terms & Conditions',            titleHi: 'नियम और शर्तें' },
  privacy:     { version: '2.0', titleEn: 'Privacy Policy',                titleHi: 'प्राइवेसी पॉलिसी' },
  refunds:     { version: '2.0', titleEn: 'Refund & Cancellation Policy',  titleHi: 'रिफंड और कैंसिलेशन पॉलिसी' },
  eligibility: { version: '2.0', titleEn: 'Eligibility Criteria',          titleHi: 'योग्यता मानदंड' },
  selection:   { version: '2.0', titleEn: 'How Selection Works',           titleHi: 'चयन प्रक्रिया' },
  trialRules:  { version: '1.1', titleEn: 'Phase 2 Physical Trial Rules',  titleHi: 'फेज 2 फिजिकल ट्रायल नियम' },
  videoRules:  { version: '1.1', titleEn: 'Phase 1 Video Rules',           titleHi: 'फेज 1 वीडियो नियम' },
  conduct:     { version: '2.0', titleEn: 'Code of Conduct',               titleHi: 'आचार संहिता' },
  rulebook:    { version: '1.1', titleEn: 'BCPL Cricket Rulebook',         titleHi: 'BCPL क्रिकेट रूलबुक' },
  faq:         { version: '2.0', titleEn: 'Frequently Asked Questions',    titleHi: 'अक्सर पूछे जाने वाले सवाल' },
} as const;

export type LegalDocKey = keyof typeof LEGAL_DOCS;

/* Version strings recorded server-side when a player accepts terms /
 * declarations (documentVersion + acceptedAt). Keep in sync with LEGAL_DOCS. */
export const CONSENT_VERSIONS = {
  terms: LEGAL_DOCS.terms.version,
  privacy: LEGAL_DOCS.privacy.version,
  phase2Declarations: '2.0',
} as const;

/* ─── Print stylesheet: prints exactly what is displayed (incl. draft
 *     status), forced to light theme for paper. ─────────────────────── */
const printCss = `
@media print {
  body { background: #fff !important; }
  header, nav, .float-reg-btn, .toc-sticky, .mobile-jump, .no-print,
  [data-sticky-cta], button:not(.print-keep) { display: none !important; }
  * { color: #111 !important; background: transparent !important;
      box-shadow: none !important; text-shadow: none !important;
      animation: none !important; backdrop-filter: none !important; }
  .glass-card { border: 1px solid #ccc !important; page-break-inside: avoid; }
  a { text-decoration: underline; }
  .legal-doc-header { border: 1.5px solid #333 !important; }
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
  return (
    <div style={{ maxWidth: 880, margin: '0 auto 28px' }}>
      <style>{printCss}</style>
      {LEGAL_APPROVAL_PENDING && (
        <div className="legal-pending-banner" style={{
          background: 'rgba(232,178,61,0.10)', border: '1px solid rgba(232,178,61,0.45)',
          borderLeft: '4px solid #E8B23D', borderRadius: 12, padding: '12px 16px',
          marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
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
          [t('Effective date', 'लागू होने की तारीख'), LEGAL_APPROVAL_PENDING ? t('Upon publication after approval', 'Approval के बाद publish होने पर') : t(LEGAL_LAST_UPDATED, LEGAL_LAST_UPDATED_HI)],
          [t('Last updated', 'आखिरी अपडेट'), t(LEGAL_LAST_UPDATED, LEGAL_LAST_UPDATED_HI)],
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
          }}
        >
          🖨 {t('PRINT / DOWNLOAD PDF', 'PRINT / PDF DOWNLOAD')}
        </button>
      </div>
    </div>
  );
}
