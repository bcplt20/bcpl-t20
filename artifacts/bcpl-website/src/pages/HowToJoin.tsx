import React from 'react';
import { Link } from 'wouter';
import { LandingLayout, LpBullets } from './landing/LandingLayout';
import type { LandingSection } from './landing/LandingLayout';
import { HOW_TO_JOIN_FAQS } from './landing/landingData';

/**
 * /how-to-join — SEO landing page for "how to join corporate cricket league
 * india". A step-by-step guide: register → video (30–90s) → result within 15 days
 * → physical trials → auction/teams. All process facts are from the FAQ page.
 */
export function HowToJoin() {
  const steps = [
    {
      n: '1',
      title: 'Register online',
      body: (
        <p className="lp-p" style={{ marginBottom: 0 }}>
          Open the <Link href="/register" style={{ color: '#FF7A29' }}>registration page</Link>, fill in the form and
          choose your playing role — Batsman, Bowler, Wicket-Keeper or All-Rounder. You also select your nearest trial
          city so that, if you advance, your physical-trial venue is convenient. The whole registration takes about five
          minutes, and you receive a confirmation with your unique registration ID.
        </p>
      ),
    },
    {
      n: '2',
      title: 'Submit your 30–90 second video',
      body: (
        <p className="lp-p" style={{ marginBottom: 0 }}>
          Within 15 days of registering, upload a 30–90 second cricket skills video. It should show your own current
          cricket performance for your chosen role — batting, bowling or keeping. All-rounders should show at least two
          skills. This is the single most important step, so give yourself time to film it well.
        </p>
      ),
    },
    {
      n: '3',
      title: 'Get your result within 15 days',
      body: (
        <p className="lp-p" style={{ marginBottom: 0 }}>
          Your video is assessed under BCPL's role-specific Phase 1 framework, and your result is shared within 15 days
          of submission. The process is evaluation-based, and your result may include a score and/or ranking where
          applicable. This first phase is entirely video-based — there is no travel involved yet.
        </p>
      ),
    },
    {
      n: '4',
      title: 'Attend the physical trial (Phase 2)',
      body: (
        <p className="lp-p" style={{ marginBottom: 0 }}>
          Players who are shortlisted to advance can choose to proceed to Phase 2 — a physical, standardised cricket
          trial at an authorised venue in your chosen city. It is assessed against a role-specific 100-point framework
          using the applicable attempt rules for your role. Only players who choose to proceed pay the Phase 2 fee. See
          the <Link href="/trial-rules" style={{ color: '#FF7A29' }}>physical trial rules</Link> for the full detail.
        </p>
      ),
    },
    {
      n: '5',
      title: 'Enter the auction and team stage',
      body: (
        <p className="lp-p" style={{ marginBottom: 0 }}>
          After the physical trial your assessment is recorded and enters a result-pending state until advancement is
          finalised under the applicable season rules. Players who qualify for the Auction Pool are eligible to take part
          in the player-auction process, through which franchise teams are formed. You can read more about how this works
          on the <Link href="/trust" style={{ color: '#FF7A29' }}>how selection works</Link> page.
        </p>
      ),
    },
  ];

  const sections: LandingSection[] = [
    {
      h2: 'Before you start',
      body: (
        <>
          <p className="lp-p">
            BCPL is a corporate cricket league for working professionals across India. Before registering, it helps
            to know the basics so the process runs smoothly:
          </p>
          <LpBullets items={[
            'You should be a working professional aged 18 to 45 as on the date of registration.',
            'Basic cricket experience is enough — no coaching certificates or club membership needed.',
            'You must not currently be under a first-class or professional cricket contract.',
            'Have a phone ready to film a short, clear cricket video of yourself.',
          ]} />
          <p className="lp-p">
            You can confirm all the requirements on the{' '}
            <Link href="/eligibility" style={{ color: '#FF7A29' }}>eligibility page</Link> before you begin.
          </p>
        </>
      ),
    },
    {
      h2: 'The five steps to join',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map((s) => (
            <div key={s.n} className="glass-card" style={{ padding: 'clamp(18px,3vw,24px)', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#FF7A29,#C94E0E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Barlow Condensed','Mukta',sans-serif", fontWeight: 900, fontSize: 20, color: '#fff', boxShadow: '0 0 0 4px rgba(255,122,41,0.18)' }}>{s.n}</div>
              <div>
                <h3 style={{ fontFamily: "'Barlow Condensed','Mukta',sans-serif", fontWeight: 800, fontSize: 'clamp(17px,2.6vw,21px)', color: '#fff', marginBottom: 8 }}>{s.title}</h3>
                {s.body}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      h2: 'A few tips before you film',
      body: (
        <>
          <LpBullets items={[
            'Film in good daylight with a steady phone so your technique is clearly visible.',
            'Show your genuine, current game — the video must be your own recent performance.',
            'Do not leave the video to the last day; you have 15 days, so use the time to get a good take.',
            'Pick the playing role you are strongest in — role selection is final at registration.',
          ]} />
          <p className="lp-p">
            Remember that completing one phase does not by itself carry you into the next — each stage is assessed on its
            own merits. For the full set of rules, fees and refund terms, read the{' '}
            <Link href="/faq" style={{ color: '#FF7A29' }}>FAQ</Link>.
          </p>
        </>
      ),
    },
  ];

  return (
    <LandingLayout
      active="About"
      kicker="Step-by-step guide"
      h1={<>How to Join a <span className="shimmer-gold">Corporate Cricket League</span> in India</>}
      intro={
        <p className="lp-p" style={{ fontSize: 'clamp(15px,2.2vw,18px)' }}>
          Joining BCPL is a clear, five-step process: register online, submit a 30–90 second cricket video, get your
          result within 15 days, attend a physical trial if you advance, and then the auction and team stage. Here is
          exactly how each step works.
        </p>
      }
      sections={sections}
      faqs={HOW_TO_JOIN_FAQS}
      faqHeading="How to join — common questions"
      finalCtaTitle={<>Start step one now</>}
      finalCtaSub="Registration takes about five minutes. Get your video in within 15 days and your result within 15 days."
    />
  );
}
