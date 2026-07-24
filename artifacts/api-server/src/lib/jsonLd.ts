/**
 * JSON-LD (schema.org) structured data for server-side injection.
 *
 * Google shows rich results — FAQ dropdowns, organization knowledge panel,
 * sports-event details — only when a page carries valid JSON-LD in its HTML.
 * Production serves STATIC nginx HTML to crawlers, so these blobs are injected
 * server-side by seoHtmlMiddleware (routes/seo.ts) before the HTML goes out.
 *
 * Ground rules for the payloads here:
 *  - Every fact must be accurate to what the page actually shows. Fees come
 *    from the SAME `FEES` map that charges payments (routes/register.ts), FAQ
 *    entries are ported verbatim from the website's FAQ page, and SportsEvent
 *    entries are built from real rows in the `matches` table.
 *  - Canonical URLs use SITE_ORIGIN (bcplt20.com), never invented paths.
 *  - Output is a ready-to-embed `<script type="application/ld+json">…</script>`
 *    string; the JSON is HTML-escaped so a "<" or "&" in content can never
 *    break out of the script element.
 */

import { FEES } from "../routes/register";
import type { Match } from "@workspace/db/schema";

/** Escape a JSON string for safe embedding inside <script>…</script>.
 *  "<" is the only sequence that can terminate a script element early
 *  (</script>, <!--), so we escape "<" plus the line/para separators that
 *  break strict JSON parsers. */
function escapeJsonForScript(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Wrap one or more schema.org objects into a script tag. */
export function renderJsonLd(objects: Array<Record<string, unknown>>): string {
  if (objects.length === 0) return "";
  return objects
    .map(
      (obj) =>
        `<script type="application/ld+json">${escapeJsonForScript(JSON.stringify(obj))}</script>`,
    )
    .join("\n  ");
}

/* ─── Organization (site-wide) ────────────────────────────────────────────
   Shown on every page so Google can build the knowledge panel / logo. */
export function organizationLd(siteOrigin: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BCPL T20 — Bhartiya Corporate Premier League",
    alternateName: "BCPL T20",
    url: siteOrigin,
    logo: `${siteOrigin}/bcpl-assets/bcpl-logo-color.jpg`,
    description:
      "India's corporate T20 cricket league for working professionals — 10 franchise teams competing across the season.",
    sameAs: ["https://twitter.com/BCPLT20League"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@bcplt20.com",
        telephone: "+91-9151346555",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
    ],
  };
}

/* ─── FAQPage (/faq) ───────────────────────────────────────────────────────
   Ported from artifacts/bcpl-website/src/pages/FAQ.tsx (English answers).
   Fee-bearing answers pull the live numbers from FEES so the structured data
   can never state a price different from what the site charges. */
export function faqPageLd(siteOrigin: string): Record<string, unknown> {
  const p1Std = FEES.bat.phase1; // 299
  const p1Ar = FEES.ar.phase1; // 399
  const p2Std = FEES.bat.phase2; // 2000
  const p2Ar = FEES.ar.phase2; // 3000

  const qa: Array<{ q: string; a: string }> = [
    {
      q: "How do I register?",
      a: `Visit www.bcplt20.com, fill the registration form, choose your playing role (Batsman, Bowler, Wicket-Keeper, or All-Rounder), select your nearest trial city, and pay ₹${p1Std} + GST (₹${p1Ar} + GST for All-Rounder). The entire process takes just 5 minutes.`,
    },
    {
      q: "Who can participate in BCPL?",
      a: "Any working professional aged 18 to 45 years (as on the date of registration) can participate — salaried employees, self-employed individuals, freelancers, or business owners. You must be currently employed or actively running a business.",
    },
    {
      q: "Is the registration fee refundable?",
      a: "Yes, within 15 days of registration if you have not yet uploaded your evaluation video. Once your video has been uploaded and submitted for review, the fee becomes non-refundable. Please refer to our Refunds policy for full details.",
    },
    {
      q: "What is Phase 1?",
      a: "Phase 1 is a video-based assessment stage. After registering, you upload a 30–60 second cricket skills video within 15 days. Your submission is assessed under BCPL's role-specific Phase 1 framework, and your result target is within 48 hours of video submission.",
    },
    {
      q: "How much does Phase 1 cost by role?",
      a: `The applicable Phase 1 fee depends on your playing role: ₹${p1Std} + applicable GST for Batsman, Bowler and Wicketkeeper, and ₹${p1Ar} + applicable GST for All-Rounder. The exact GST-inclusive amount is displayed at the time of payment.`,
    },
    {
      q: "Does payment guarantee selection?",
      a: "No. Payment of Phase 1 or Phase 2 fees does not guarantee qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration or tournament participation.",
    },
    {
      q: "Who pays the Phase 2 fee?",
      a: `Only eligible Phase 1 qualified players who choose to proceed to the physical trial pay the Phase 2 fee. The applicable role-based Phase 2 fee is ₹${p2Std} + applicable GST for Batsman/Bowler/Wicketkeeper and ₹${p2Ar} + applicable GST for All-Rounder, as displayed at the time of payment.`,
    },
    {
      q: "What happens at the physical trial?",
      a: "Phase 2 is a physical, standardised cricket trial conducted at authorised venues. You are assessed against a role-specific 100-point framework using the applicable attempt rules for your role.",
    },
    {
      q: "Does Auction Pool qualification guarantee a team?",
      a: "No. Qualification for the BCPL Auction Pool means eligibility to participate in the applicable player-auction process. Auction Pool qualification does not guarantee purchase by a team, a player contract, remuneration, squad selection or tournament participation.",
    },
    {
      q: "What payment methods are accepted?",
      a: "We accept all major UPI apps (GPay, PhonePe, Paytm, etc.), debit and credit cards (Visa, Mastercard, RuPay), net banking from 50+ banks, and popular wallets. All payments are processed securely via Cashfree.",
    },
    {
      q: "When is BCPL Season 5?",
      a: "Video trials run from July–August 2025. Physical trials take place August–September 2025. The main BCPL T20 season (matches) runs September–November 2025. The finale is expected in late November 2025.",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteOrigin}/faq`,
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/* ─── SportsEvent (match pages) ─────────────────────────────────────────────
   Built from real `matches` rows. status → eventStatus mapping uses the
   canonical match status vocabulary from lib/db/src/schema/matches.ts:
   scheduled | toss_done | xi_selected | live | innings2 | completed | abandoned. */
function eventStatusFor(status: string): string {
  switch (status) {
    case "abandoned":
      return "https://schema.org/EventCancelled";
    case "completed":
    case "live":
    case "innings2":
    case "toss_done":
    case "xi_selected":
    case "scheduled":
    default:
      return "https://schema.org/EventScheduled";
  }
}

export function sportsEventLd(match: Match, siteOrigin: string): Record<string, unknown> {
  const name = `${match.team1} vs ${match.team2} — BCPL T20 Season ${match.season}`;
  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name,
    sport: "Cricket",
    eventStatus: eventStatusFor(match.status),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${siteOrigin}/match-center`,
    organizer: {
      "@type": "Organization",
      name: "BCPL T20 — Bhartiya Corporate Premier League",
      url: siteOrigin,
    },
    competitor: [
      { "@type": "SportsTeam", name: match.team1 },
      { "@type": "SportsTeam", name: match.team2 },
    ],
  };
  if (match.venue) {
    obj.location = { "@type": "Place", name: match.venue };
  }
  if (match.scheduledAt) {
    obj.startDate = new Date(match.scheduledAt).toISOString();
  }
  return obj;
}
