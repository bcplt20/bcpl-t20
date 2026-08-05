import React from 'react';
import { Link } from 'wouter';
import { LandingLayout, LpBullets } from './landing/LandingLayout';
import type { LandingSection } from './landing/LandingLayout';
import { DELHI_FAQS } from './landing/landingData';

/**
 * /corporate-cricket-tournament-delhi — SEO landing page for
 * "corporate cricket tournament delhi". Delhi-NCR focused: the region,
 * trials in Delhi and how Delhi corporate employees join.
 */
export function CorporateCricketDelhi() {
  const sections: LandingSection[] = [
    {
      h2: 'A corporate cricket tournament for Delhi-NCR',
      body: (
        <>
          <p className="lp-p">
            Delhi-NCR is one of the busiest professional hubs in the country, and it is full of working professionals who
            grew up playing cricket and never quite stopped loving it. BCPL T20 is a corporate cricket league built exactly
            for them: a structured, franchise-style T20 competition open to working professionals, with Delhi-NCR as one of
            its trial regions.
          </p>
          <p className="lp-p">
            If you work in an office in Connaught Place, run a business in Gurugram, freelance from Noida or commute in from
            Ghaziabad or Faridabad, you can take part. Registration is online and open to working professionals across the
            region — you do not need to be attached to any club or academy to get started.
          </p>
        </>
      ),
    },
    {
      h2: 'How Delhi corporate employees join',
      body: (
        <>
          <p className="lp-p">
            Joining from anywhere in Delhi-NCR follows the same clear steps as the rest of the league:
          </p>
          <LpBullets items={[
            <><strong style={{ color: '#fff' }}>Register online</strong> and pick your playing role — Batsman, Bowler, Wicket-Keeper or All-Rounder.</>,
            <><strong style={{ color: '#fff' }}>Select your nearest trial city</strong> during registration so your physical-trial venue is convenient for you.</>,
            <><strong style={{ color: '#fff' }}>Upload a 30–60 second cricket video</strong> within 15 days of registering, showing your own current performance.</>,
            <><strong style={{ color: '#fff' }}>Receive your Phase 1 result within 48 hours</strong> of submitting your video.</>,
          ]} />
          <p className="lp-p">
            The whole registration takes about five minutes. Because it is online, a group of colleagues from the same
            Delhi office can all sign up in the same week and go through the process together.
          </p>
        </>
      ),
    },
    {
      h2: 'Trials in the Delhi-NCR region',
      body: (
        <>
          <p className="lp-p">
            Phase 2 is a physical, on-ground trial held at authorised venues. When you register you choose your nearest
            trial city, and Delhi-NCR players are assigned a venue within the region so travel stays manageable. The
            physical trial is a standardised, role-specific assessment scored out of 100 — the same framework used across
            all authorised venues, so every player is measured consistently.
          </p>
          <p className="lp-p">
            Only players who are shortlisted from Phase 1 and choose to proceed take part in the Phase 2 physical trial.
            You can read exactly how the on-ground trial works on the{' '}
            <Link href="/trial-rules" style={{ color: '#FF7A29' }}>physical trial rules</Link> page.
          </p>
        </>
      ),
    },
    {
      h2: 'Who can register from Delhi-NCR',
      body: (
        <>
          <p className="lp-p">
            The eligibility rules are the same across the country. To take part you should be:
          </p>
          <LpBullets items={[
            'A working professional — salaried, self-employed, freelancer or business owner',
            'Aged 18 to 45 as on the date of registration',
            'Someone with basic cricket experience (gully and colony cricket counts)',
            'Not currently under a first-class or professional cricket contract',
          ]} />
          <p className="lp-p">
            Full details are on the <Link href="/eligibility" style={{ color: '#FF7A29' }}>eligibility page</Link>, and
            the complete process is covered in the <Link href="/faq" style={{ color: '#FF7A29' }}>FAQ</Link>.
          </p>
        </>
      ),
    },
    {
      h2: 'Why Delhi-NCR professionals take part',
      body: (
        <>
          <p className="lp-p">
            Delhi-NCR has one of the densest concentrations of working professionals anywhere in India — sprawling office
            parks in Gurugram and Noida, government and corporate offices across central Delhi, and thousands of small
            businesses and freelancers in between. A huge number of those people played cricket seriously in school and
            college, then drifted away from the competitive game once work took over. A corporate cricket league gives
            that lapsed player a proper reason to pick the game back up.
          </p>
          <p className="lp-p">
            Because everything up to the physical trial happens online, the format fits around a demanding Delhi work
            schedule. You register when it suits you, film your video over a weekend, and get your result within 48 hours.
            There is no need to attend anything in person until Phase 2 — and even then, choosing your nearest trial city
            keeps the travel within the region. It is a realistic way for a busy professional to test their cricket
            against a consistent, published standard rather than an informal weekend match.
          </p>
        </>
      ),
    },
    {
      h2: 'What happens after you submit your video',
      body: (
        <>
          <p className="lp-p">
            Once your video is in, it is assessed under BCPL's role-specific Phase 1 framework and you receive a result
            within 48 hours. Players who advance can choose to proceed to the Phase 2 physical trial in the Delhi-NCR
            region. From there, players who qualify enter the auction pool through which franchise squads are formed.
          </p>
          <p className="lp-p">
            The practical first move for any Delhi-NCR working professional is the same: register, film a short video and
            submit it. For a step-by-step breakdown, see the{' '}
            <Link href="/how-to-join" style={{ color: '#FF7A29' }}>how to join</Link> guide.
          </p>
        </>
      ),
    },
  ];

  return (
    <LandingLayout
      active="About"
      kicker="Delhi-NCR · Corporate Cricket"
      h1={<>Corporate Cricket Tournament in <span className="shimmer-gold">Delhi-NCR</span></>}
      intro={
        <p className="lp-p" style={{ fontSize: 'clamp(15px,2.2vw,18px)' }}>
          A corporate cricket tournament for Delhi-NCR working professionals. BCPL T20 lets office employees across
          Delhi, Gurugram, Noida, Ghaziabad and Faridabad register online, submit a short cricket video and, if they
          advance, attend a physical trial in the region.
        </p>
      }
      sections={sections}
      faqs={DELHI_FAQS}
      faqHeading="Delhi-NCR corporate cricket — common questions"
      finalCtaTitle={<>Working in Delhi-NCR? Take the field.</>}
      finalCtaSub="Register online in about five minutes, pick your nearest trial city, and get your Phase 1 result within 48 hours."
    />
  );
}
