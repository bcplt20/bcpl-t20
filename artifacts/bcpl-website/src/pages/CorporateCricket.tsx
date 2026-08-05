import React from 'react';
import { Link } from 'wouter';
import { LandingLayout, LpBullets } from './landing/LandingLayout';
import type { LandingSection } from './landing/LandingLayout';
import { CORPORATE_CRICKET_FAQS } from './landing/landingData';

/**
 * /corporate-cricket — SEO landing page for the query "corporate cricket
 * league" and "corporate cricket in india". Explains the concept, who plays,
 * the format and the season timeline, and links to /register /eligibility /faq.
 */
export function CorporateCricket() {
  const sections: LandingSection[] = [
    {
      h2: 'What corporate cricket actually means',
      body: (
        <>
          <p className="lp-p">
            Corporate cricket is competitive cricket organised for working professionals rather than for full-time,
            contracted cricketers. Instead of state academies and club circuits, the players are people who spend their
            weekdays in offices, on the road, running businesses or freelancing — and who still want a serious, structured
            stage to play the game they love. A corporate cricket league brings those players together under one set of
            rules, one assessment framework and one competitive season.
          </p>
          <p className="lp-p">
            BCPL (the Bhartiya Corporate Premier League) is a corporate cricket league of exactly this kind. It runs a
            franchise-style T20 competition in which working professionals from across India can register, be assessed on
            their cricket skills through a clear, evaluation-based process, and go on to play competitive matches. The idea
            is simple: give working professionals a real, fair route back onto a cricket field — from the office to the
            stadium.
          </p>
        </>
      ),
    },
    {
      h2: 'Who plays in a corporate cricket league',
      body: (
        <>
          <p className="lp-p">
            The whole point of corporate cricket is that you do not need to be a professional cricketer to take part. What
            matters is that you are a working professional with some cricket experience and a genuine appetite to compete.
            In BCPL that includes:
          </p>
          <LpBullets items={[
            'Salaried employees from any sector or industry',
            'Self-employed professionals, consultants and freelancers',
            'Business owners and entrepreneurs',
            'Gig, delivery and logistics workers',
            'Farmers, agriculture professionals, and government or PSU staff',
          ]} />
          <p className="lp-p">
            Players must be aged 18 to 45 as on the date of registration and must not currently be under a first-class or
            professional cricket contract. You do not need coaching certificates or club membership — basic cricket
            experience, including gully or colony cricket, counts. You can confirm the full requirements on the{' '}
            <Link href="/eligibility" style={{ color: '#FF7A29' }}>eligibility page</Link>.
          </p>
        </>
      ),
    },
    {
      h2: 'The format: a T20 franchise league',
      body: (
        <>
          <p className="lp-p">
            BCPL is played in the T20 format — the fast, high-energy version of the game that most Indian fans grew up
            watching. Teams are franchise squads, and players who progress through the assessment stages can enter an
            auction pool through which those franchise squads are formed. It is the closest a working professional can
            realistically get to the franchise-cricket experience: proper grounds, a structured competition and a season
            that builds towards a finale.
          </p>
          <p className="lp-p">
            Assessment is designed to be fair and consistent. Every applicant is measured against the same published,
            role-specific criteria rather than on contacts or reputation, so the emphasis stays on cricket skill.
          </p>
        </>
      ),
    },
    {
      h2: 'How the journey works, step by step',
      body: (
        <>
          <p className="lp-p">
            The path from registering to playing is broken into clear phases so you always know where you stand:
          </p>
          <LpBullets items={[
            <><strong style={{ color: '#fff' }}>Register online</strong> and choose your playing role — Batsman, Bowler, Wicket-Keeper or All-Rounder.</>,
            <><strong style={{ color: '#fff' }}>Submit a 30–60 second video</strong> of your own current cricket performance within 15 days of registering.</>,
            <><strong style={{ color: '#fff' }}>Get your Phase 1 result within 15 days</strong> of your video submission — the assessment is evaluation-based.</>,
            <><strong style={{ color: '#fff' }}>Advance to the physical trial (Phase 2)</strong> if you are shortlisted and choose to proceed — a standardised, role-specific trial scored out of 100.</>,
            <><strong style={{ color: '#fff' }}>Enter the auction pool</strong> if you qualify, where franchise squads are formed.</>,
          ]} />
          <p className="lp-p">
            For a full walk-through of each step, see the{' '}
            <Link href="/how-to-join" style={{ color: '#FF7A29' }}>how to join</Link> guide, and read the complete{' '}
            <Link href="/faq" style={{ color: '#FF7A29' }}>FAQ</Link> for details on fees, refunds and timelines.
          </p>
        </>
      ),
    },
    {
      h2: 'The season timeline',
      body: (
        <>
          <p className="lp-p">
            A corporate cricket season runs in phases rather than all at once. First comes online registration and the
            video-based Phase 1 assessment. Players who advance move to the physical trials in Phase 2. After that comes the
            auction, where franchise squads take shape, and then the T20 matches that make up the season, building towards
            the finale.
          </p>
          <p className="lp-p">
            Registration opens ahead of the season so working professionals have time to register, film and submit their
            video without rushing. If you have been thinking about playing, the practical first step is simply to register
            and get your video in — everything else follows from there.
          </p>
        </>
      ),
    },
  ];

  return (
    <LandingLayout
      active="About"
      kicker="Corporate Cricket in India"
      h1={<>Corporate Cricket in India: <span className="shimmer-gold">What is BCPL?</span></>}
      intro={
        <p className="lp-p" style={{ fontSize: 'clamp(15px,2.2vw,18px)' }}>
          Corporate cricket is competitive cricket for working professionals. BCPL is a franchise-style T20
          corporate cricket league where salaried employees, business owners and freelancers across India can register,
          be assessed and play. Here is what it is, who plays and how the season works.
        </p>
      }
      sections={sections}
      faqs={CORPORATE_CRICKET_FAQS}
      faqHeading="Corporate cricket — common questions"
      finalCtaTitle={<>Ready to take your shot at corporate cricket?</>}
      finalCtaSub="Register in about five minutes, upload your video, and get your Phase 1 result within 15 days."
    />
  );
}
