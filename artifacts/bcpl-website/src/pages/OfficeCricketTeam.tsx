import React from 'react';
import { Link } from 'wouter';
import { LandingLayout, LpBullets } from './landing/LandingLayout';
import type { LandingSection } from './landing/LandingLayout';
import { OFFICE_TEAM_FAQS } from './landing/landingData';

/**
 * /office-cricket-team — SEO landing page for "office cricket team tournament".
 * For companies / colleagues joining as office groups: the teamwork and
 * fitness angle, and how registration works individually.
 */
export function OfficeCricketTeam() {
  const sections: LandingSection[] = [
    {
      h2: 'Bring your office to the cricket field',
      body: (
        <>
          <p className="lp-p">
            Every office has that WhatsApp group where someone keeps saying, "we should all play a match sometime." BCPL
            T20 turns that idea into something far more serious than a Sunday knockabout. It is a corporate cricket league
            for working professionals, and there is nothing stopping a whole group of colleagues from one company joining
            the same season and going through the journey together.
          </p>
          <p className="lp-p">
            Whether it is five friends from the same team or fifty people from across a large company, an office group can
            all take part. Each person registers individually, but the shared experience — practising together, comparing
            videos, cheering each other on through the trials — is what makes it special.
          </p>
        </>
      ),
    },
    {
      h2: 'How registration works for a group',
      body: (
        <>
          <p className="lp-p">
            Registration is individual, and that is by design. It keeps the assessment fair, because everyone is measured
            on their own cricket skill against the same role-specific framework. For an office group, the flow looks like
            this:
          </p>
          <LpBullets items={[
            <>Each colleague <strong style={{ color: '#fff' }}>registers on their own</strong> and picks their playing role — Batsman, Bowler, Wicket-Keeper or All-Rounder.</>,
            <>Everyone uploads their own <strong style={{ color: '#fff' }}>30–60 second cricket video</strong> within 15 days of registering.</>,
            <>Each person gets an <strong style={{ color: '#fff' }}>individual Phase 1 result within 48 hours</strong> of their submission.</>,
            <>Colleagues who advance can each <strong style={{ color: '#fff' }}>choose to proceed to the Phase 2 physical trial</strong> in their nearest trial city.</>,
          ]} />
          <p className="lp-p">
            So there is no separate "company registration" — you simply have several colleagues going through the same
            individual process at the same time. Point your team at the{' '}
            <Link href="/how-to-join" style={{ color: '#FF7A29' }}>how to join</Link> guide and everyone can follow the
            same steps.
          </p>
        </>
      ),
    },
    {
      h2: 'The teamwork and fitness angle',
      body: (
        <>
          <p className="lp-p">
            Playing towards a real competition is a genuinely engaging team-building activity a company can back. Preparing
            for the video and the physical trial gets people out of their chairs and onto the field — regular practice,
            outdoor activity and a concrete goal to train towards. It is far more engaging than another indoor offsite.
          </p>
          <p className="lp-p">
            There is a genuine fitness benefit too. Working professionals often struggle to build exercise into a packed
            week; a shared cricket goal gives colleagues a reason to meet up, warm up and play. And the camaraderie that
            comes from chasing a target together tends to carry back into the workplace long after the season.
          </p>
        </>
      ),
    },
    {
      h2: 'Who from the office can take part',
      body: (
        <>
          <p className="lp-p">
            The eligibility rules apply to each colleague individually:
          </p>
          <LpBullets items={[
            'Working professionals — salaried employees, self-employed people, freelancers and business owners',
            'Aged 18 to 45 as on the date of registration',
            'Basic cricket experience — gully and colony cricket counts',
            'Not currently under a first-class or professional cricket contract',
          ]} />
          <p className="lp-p">
            Full requirements are on the <Link href="/eligibility" style={{ color: '#FF7A29' }}>eligibility page</Link>.
            Since the criteria are the same for everyone, an office group can quickly work out who is eligible before they
            all register.
          </p>
        </>
      ),
    },
    {
      h2: 'Getting your office group started',
      body: (
        <>
          <p className="lp-p">
            The easiest way to begin is to share the registration link in your office group and set a soft deadline —
            say, "let's all register and film our videos this fortnight." Because each person registers in about five
            minutes and then has 15 days to upload a video, it is very manageable alongside a full-time job.
          </p>
          <p className="lp-p">
            From there, everyone receives their own result within 48 hours, and colleagues who advance can take on the
            physical trial together. Read the full <Link href="/faq" style={{ color: '#FF7A29' }}>FAQ</Link> for details
            on fees, timelines and refunds, then get your group registered.
          </p>
        </>
      ),
    },
  ];

  return (
    <LandingLayout
      active="About"
      kicker="For office groups & colleagues"
      h1={<>Bring Your <span className="shimmer-gold">Office Cricket Team</span> to BCPL</>}
      intro={
        <p className="lp-p" style={{ fontSize: 'clamp(15px,2.2vw,18px)' }}>
          Turn the office WhatsApp group into a real cricket campaign. BCPL is a corporate cricket league where
          colleagues from the same company can take part together — great for teamwork and fitness. Registration is
          individual, so here is exactly how a group from one office joins.
        </p>
      }
      sections={sections}
      faqs={OFFICE_TEAM_FAQS}
      faqHeading="Office cricket teams — common questions"
      finalCtaTitle={<>Rally your colleagues and register</>}
      finalCtaSub="Each person registers individually in about five minutes — then go through the journey together as an office."
    />
  );
}
