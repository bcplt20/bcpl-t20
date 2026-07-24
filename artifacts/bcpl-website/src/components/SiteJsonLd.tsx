import { useEffect } from "react";
import { useLocation } from "wouter";
import { getMatches, getFees, type FeeConfig } from "@/lib/api";
import { FALLBACK_FEES } from "@/lib/fees";
import { SEASON } from "@/lib/season";

/**
 * Route-level JSON-LD (schema.org structured data) injector for the SPA.
 *
 * PARITY with the server: in production, crawlers get JSON-LD injected into
 * index.html by the API server's seoHtmlMiddleware (routes/seo.ts +
 * lib/jsonLd.ts). This component mirrors that output for the dev/browser
 * environment so what devs see in view-source matches production. The blobs
 * must stay factually identical to the server builders:
 *   - Organization : site-wide
 *   - FAQPage      : /faq   (fees sourced from GET /api/fees)
 *   - SportsEvent  : /match-center and /schedule (real rows from /api/matches)
 *
 * Silent no-op on any failure — structured data is progressive enhancement.
 */

const SITE_ORIGIN = "https://bcplt20.com";
const LD_ATTR = "data-bcpl-jsonld";

function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BCPL T20 — Bhartiya Corporate Premier League",
    alternateName: "BCPL T20",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/bcpl-assets/bcpl-logo-color.jpg`,
    description:
      `India's corporate T20 cricket league for working professionals — ${SEASON.teams} franchise teams competing across the season.`,
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

function faqPageLd(fees: FeeConfig) {
  const p1Std = fees.phase1.bat;
  const p1Ar = fees.phase1.ar;
  const p2Std = fees.phase2.bat;
  const p2Ar = fees.phase2.ar;

  const qa: Array<{ q: string; a: string }> = [
    { q: "How do I register?", a: `Visit www.bcplt20.com, fill the registration form, choose your playing role (Batsman, Bowler, Wicket-Keeper, or All-Rounder), select your nearest trial city, and pay ₹${p1Std} + GST (₹${p1Ar} + GST for All-Rounder). The entire process takes just 5 minutes.` },
    { q: "Who can participate in BCPL?", a: `Any working professional aged ${SEASON.ageMin} to ${SEASON.ageMax} years (as on the date of registration) can participate — salaried employees, self-employed individuals, freelancers, or business owners. You must be currently employed or actively running a business.` },
    { q: "Is the registration fee refundable?", a: "Yes, within 15 days of registration if you have not yet uploaded your evaluation video. Once your video has been uploaded and submitted for review, the fee becomes non-refundable. Please refer to our Refunds policy for full details." },
    { q: "What is Phase 1?", a: "Phase 1 is a video-based assessment stage. After registering, you upload a 30–60 second cricket skills video within 15 days. Your submission is assessed under BCPL's role-specific Phase 1 framework, and your result target is within 48 hours of video submission." },
    { q: "How much does Phase 1 cost by role?", a: `The applicable Phase 1 fee depends on your playing role: ₹${p1Std} + applicable GST for Batsman, Bowler and Wicketkeeper, and ₹${p1Ar} + applicable GST for All-Rounder. The exact GST-inclusive amount is displayed at the time of payment.` },
    { q: "Does payment guarantee selection?", a: "No. Payment of Phase 1 or Phase 2 fees does not guarantee qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration or tournament participation." },
    { q: "Who pays the Phase 2 fee?", a: `Only eligible Phase 1 qualified players who choose to proceed to the physical trial pay the Phase 2 fee. The applicable role-based Phase 2 fee is ₹${p2Std} + applicable GST for Batsman/Bowler/Wicketkeeper and ₹${p2Ar} + applicable GST for All-Rounder, as displayed at the time of payment.` },
    { q: "What happens at the physical trial?", a: "Phase 2 is a physical, standardised cricket trial conducted at authorised venues. You are assessed against a role-specific 100-point framework using the applicable attempt rules for your role." },
    { q: "Does Auction Pool qualification guarantee a team?", a: "No. Qualification for the BCPL Auction Pool means eligibility to participate in the applicable player-auction process. Auction Pool qualification does not guarantee purchase by a team, a player contract, remuneration, squad selection or tournament participation." },
    { q: "What payment methods are accepted?", a: "We accept all major UPI apps (GPay, PhonePe, Paytm, etc.), debit and credit cards (Visa, Mastercard, RuPay), net banking from 50+ banks, and popular wallets. All payments are processed securely via Cashfree." },
    { q: "When is BCPL Season 5?", a: "Video trials run from July–August 2025. Physical trials take place August–September 2025. The main BCPL T20 season (matches) runs September–November 2025. The finale is expected in late November 2025." },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_ORIGIN}/faq`,
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

function eventStatusFor(status: string) {
  return status === "abandoned"
    ? "https://schema.org/EventCancelled"
    : "https://schema.org/EventScheduled";
}

function sportsEventLd(m: any) {
  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${m.team1} vs ${m.team2} — BCPL T20 Season ${m.season}`,
    sport: "Cricket",
    eventStatus: eventStatusFor(String(m.status)),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${SITE_ORIGIN}/match-center`,
    organizer: { "@type": "Organization", name: "BCPL T20 — Bhartiya Corporate Premier League", url: SITE_ORIGIN },
    competitor: [
      { "@type": "SportsTeam", name: m.team1 },
      { "@type": "SportsTeam", name: m.team2 },
    ],
  };
  if (m.venue) obj.location = { "@type": "Place", name: m.venue };
  if (m.scheduledAt) obj.startDate = new Date(m.scheduledAt).toISOString();
  return obj;
}

/** Replace whatever this component previously injected with the given blobs. */
function writeJsonLd(objects: Array<Record<string, unknown>>) {
  document.head.querySelectorAll(`script[${LD_ATTR}]`).forEach((el) => el.remove());
  for (const obj of objects) {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute(LD_ATTR, "1");
    el.textContent = JSON.stringify(obj);
    document.head.appendChild(el);
  }
}

export function SiteJsonLd() {
  const [location] = useLocation();

  useEffect(() => {
    let alive = true;
    const path = location.replace(/\/+$/, "") || "/";

    (async () => {
      const objects: Array<Record<string, unknown>> = [organizationLd()];

      if (path === "/faq") {
        let fees: FeeConfig = FALLBACK_FEES;
        try { fees = await getFees(); } catch { /* keep fallback */ }
        objects.push(faqPageLd(fees));
      }

      if (path === "/match-center" || path === "/schedule") {
        try {
          const { matches } = await getMatches(5);
          for (const m of (matches ?? []).slice(0, 20)) {
            if (String(m.status) !== "abandoned") objects.push(sportsEventLd(m));
          }
        } catch { /* Organization still injected */ }
      }

      if (alive) writeJsonLd(objects);
    })();

    return () => { alive = false; };
  }, [location]);

  return null;
}
