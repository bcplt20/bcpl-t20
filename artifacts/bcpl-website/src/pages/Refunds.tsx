import React from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { LegalDocHeader } from '../lib/legalMeta';
import { IcoRupee, IcoRoute, IcoCard, IcoVideo, IcoCheck, IcoInfo, IcoWarn, IcoList, IcoBan, IcoClock, IcoSearch, IcoMail, IcoPen, IcoChat, IcoStadium, IcoZap, IcoCalendar, IcoScale, IcoShield, IcoDoc } from '../lib/icons';

type IcoComp = (p: { size?: number; style?: React.CSSProperties }) => React.ReactElement;

const OrangeDot = () => (
  <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#FF7A29',marginRight:10,flexShrink:0,marginTop:7}}/>
);

/* ── Refund & Cancellation Policy ──────────────────────────────────────────
 * Restructured per spec §7 (25 required sections, grouped into an accordion
 * with a table of contents). Implements the APPROVED business rule:
 *   Phase 1 fee is NON-REFUNDABLE once successfully paid — including where the
 *   player does not upload / uploads late / uploads an invalid video /
 *   withdraws / does not qualify. Non-upload NEVER creates a refund right.
 * The ONLY result-related refund exception is the already-published rule:
 *   valid compliant submission recorded + BCPL fails to declare the result
 *   within the published 15-working-days period + player raises a support
 *   request within the claim period → refund per published policy.
 * Also refundable: duplicate payment, payment debited but registration not
 * created (reconciliation), BCPL cancelling a trial without a reasonable
 * rescheduled opportunity.
 * ────────────────────────────────────────────────────────────────────────── */

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'note'; tone: 'green' | 'red' | 'gold' | 'blue'; title?: string; text: string };

type Section = { n: number; icon: IcoComp; title: string; blocks: Block[] };

const SECTIONS: Section[] = [
  {
    n: 1, icon: IcoInfo, title: 'Purpose & Scope',
    blocks: [
      { kind: 'p', text: 'This Refund & Cancellation Policy explains, scenario by scenario, when a fee paid to BCPL is refundable and when it is not. It applies to Phase 1 (video-trial) fees and Phase 2 (physical-trial) fees paid on www.bcplt20.com for BCPL Season 5.' },
      { kind: 'p', text: 'This policy forms part of, and must be read together with, the BCPL Terms & Conditions. Where a specific fact (such as a fee amount or an applicable window) is shown to you at checkout or in your dashboard, that displayed value applies.' },
    ],
  },
  {
    n: 2, icon: IcoDoc, title: 'Definitions',
    blocks: [
      { kind: 'ul', items: [
        'BCPL / we / us — the league operated by the legal entity Kriparthi Playing 11 Pvt. Ltd.',
        'Phase 1 fee — the role-based registration fee for the Phase 1 video-trial process, plus applicable GST.',
        'Phase 2 fee — the role-based physical-trial fee, plus applicable GST, payable only by players who are Phase 1 Qualified and choose to proceed.',
        'Video / submission — the prescribed Phase 1 trial video uploaded within the applicable upload window.',
        'Result — the Phase 1 outcome (Phase 1 Qualified / not qualified) published by BCPL.',
        'Successfully paid — a payment confirmed by the payment gateway against a created BCPL registration/order.',
      ] },
    ],
  },
  {
    n: 3, icon: IcoCard, title: 'Phase 1 Fee Treatment',
    blocks: [
      { kind: 'p', text: 'Phase 1 fees are charged for registration in and access to the applicable Phase 1 trial process, including the opportunity to submit the prescribed video assessment within the permitted submission period.' },
      { kind: 'note', tone: 'red', title: 'Phase 1 fee is non-refundable once successfully paid', text: 'Once a Phase 1 payment is successfully completed, the fee is non-refundable, including where the participant:' },
      { kind: 'ol', items: [
        '(a) does not upload a video;',
        '(b) uploads after the applicable deadline;',
        '(c) uploads an incomplete, invalid, corrupted, inaccessible or non-compliant video;',
        '(d) voluntarily withdraws;',
        '(e) does not complete any subsequent required action;',
        '(f) is found ineligible due to inaccurate, incomplete or misleading information supplied by the participant; or',
        '(g) does not qualify for the next stage.',
      ] },
      { kind: 'note', tone: 'red', text: 'Non-submission of a video within the applicable period does not create a right to a refund. The participant\u2019s own failure, delay, incorrect submission or non-submission does not convert a successfully paid Phase 1 fee into a refundable payment. Late uploads may be rejected according to the applicable process.' },
      { kind: 'p', text: 'The one result-related exception to Phase 1 non-refundability is set out in Section 11 (Refunds expressly approved by BCPL — undeclared-result exception).' },
    ],
  },
  {
    n: 4, icon: IcoStadium, title: 'Phase 2 Physical-Trial Fee Treatment',
    blocks: [
      { kind: 'p', text: 'The Phase 2 amount is charged for the opportunity to participate in the assigned physical-trial process. It is not a selection fee, an Auction Pool entry guarantee, a Team Purchase guarantee, a player contract, a salary/remuneration guarantee, or a Tournament Participation guarantee.' },
      { kind: 'p', text: 'Once the Phase 2 fee is successfully paid, it is non-refundable in circumstances such as:' },
      { kind: 'ul', items: [
        'participant withdrawal;',
        'failure to attend the physical trial;',
        'late arrival beyond the permitted entry window;',
        'incomplete documentation;',
        'failed eligibility verification caused by the participant\u2019s information;',
        'breach of the Code of Conduct;',
        'disqualification;',
        'non-selection after the trial (Final Selection Pending does not become a refund right); or',
        'failure to follow trial instructions.',
      ] },
      { kind: 'p', text: 'Where BCPL itself cancels a physical trial and does not provide a reasonable rescheduled opportunity, see Section 6.' },
    ],
  },
  {
    n: 5, icon: IcoBan, title: 'Non-Refundable Circumstances (Summary)',
    blocks: [
      { kind: 'p', text: 'Outside the situations for which this policy expressly provides a refund, fees are not refundable. This includes, for example:' },
      { kind: 'ul', items: [
        'A Phase 1 video not being uploaded, uploaded late, or uploaded in an invalid/non-compliant form.',
        'Change of mind after a fee has been successfully paid.',
        'Non-selection at any stage — Phase 1, physical trial, Auction Pool, Player Auction or Team Purchase.',
        'Ineligibility caused by false or inaccurate declarations of age, professional status, cricket history or identity.',
        'Disqualification for Code of Conduct or integrity violations at any stage.',
        'Inability to attend a trial due to personal, scheduling or travel reasons.',
        'Technical issues on the participant\u2019s own device, internet or upload.',
      ] },
    ],
  },
  {
    n: 6, icon: IcoStadium, title: 'BCPL Cancellation of a Trial / Event',
    blocks: [
      { kind: 'p', text: 'If BCPL cancels a physical trial or event that you have paid to attend and does not provide a reasonable rescheduled opportunity to participate, you may request a refund of the applicable Phase 2 fee for that cancelled trial.' },
      { kind: 'note', tone: 'green', text: 'Where BCPL cancels a trial entirely and no alternative slot, venue or reasonable rescheduled opportunity is offered, the applicable fee is refundable to your original payment method after verification.' },
    ],
  },
  {
    n: 7, icon: IcoCalendar, title: 'BCPL Rescheduling or Venue Change',
    blocks: [
      { kind: 'p', text: 'BCPL may reschedule a trial or change a venue for operational, safety, weather or logistical reasons. Where a reasonable rescheduled slot or alternative venue is offered, this is treated as the remedy for the change and does not by itself create a refund right.' },
      { kind: 'p', text: 'If you cannot attend the rescheduled slot, any further consideration is as provided under the published season rules; a change of your personal circumstances is not, by itself, a refundable BCPL cancellation.' },
    ],
  },
  {
    n: 8, icon: IcoRoute, title: 'Duplicate Payment',
    blocks: [
      { kind: 'p', text: 'If you are charged more than once for the same fee (for example, two successful charges for the same Phase 1 registration), the verified duplicate amount is refunded to the original payment method.' },
      { kind: 'p', text: 'To request this, email support@bcplt20.com with your Registration ID and both payment references so the duplicate can be verified.' },
    ],
  },
  {
    n: 9, icon: IcoZap, title: 'Failed / Pending Transaction',
    blocks: [
      { kind: 'p', text: 'If a payment fails or remains pending, no registration/order is completed and no fee is due. Where the payment gateway holds and then auto-reverses an unconfirmed amount, that reversal is handled by the gateway.' },
      { kind: 'p', text: 'Do not re-attempt payment repeatedly on a pending transaction; contact support so the transaction can be reconciled before any re-attempt.' },
    ],
  },
  {
    n: 10, icon: IcoSearch, title: 'Payment Debited but Status Not Updated',
    blocks: [
      { kind: 'p', text: 'If an amount is debited from your account but your BCPL registration/order is not created or confirmed, this is reconciled before any refund or duplicate charge.' },
      { kind: 'note', tone: 'green', text: 'Where a payment is debited but no registration is created, the amount is refunded to the original payment method after reconciliation. Contact support@bcplt20.com with your transaction details so we can investigate and resolve it.' },
    ],
  },
  {
    n: 11, icon: IcoCheck, title: 'Refunds Expressly Approved by BCPL (Undeclared-Result Exception)',
    blocks: [
      { kind: 'p', text: 'If BCPL receives a valid, compliant Phase 1 submission but does not provide or publish the applicable Phase 1 result within the formally committed period, the participant may contact BCPL through the official support channel for resolution.' },
      { kind: 'p', text: 'Depending on the circumstances and the applicable published policy, BCPL may provide an extended assessment timeline, re-assessment, service credit, participation transfer, or a refund where expressly approved.' },
      { kind: 'note', tone: 'green', title: 'Published result-failure refund exception', text: 'Where BCPL does not declare a Phase 1 result for a valid, recorded submission within the published 15-working-days result period, a refund of the Phase 1 fee is available on the following basis:' },
      { kind: 'ol', items: [
        'a valid, compliant Phase 1 video was submitted;',
        'the submission was successfully recorded by BCPL;',
        'no result was declared by BCPL;',
        'the published 15-working-days resolution period has elapsed;',
        'the participant submitted a support request within the stated claim period;',
        'there is no fraud, chargeback or duplicate-refund; and',
        'the refund is approved after verification.',
      ] },
      { kind: 'note', tone: 'gold', text: 'This is the only result-related exception to Phase 1 non-refundability. It applies to BCPL failing to declare a result — not to a participant failing to upload. A minor technical delay does not, by itself, create an automatic refund.' },
    ],
  },
  {
    n: 12, icon: IcoClock, title: 'Refund Processing Timeline',
    blocks: [
      { kind: 'p', text: 'Where a refund is approved under this policy, it is processed to the original payment method used for the transaction.' },
      { kind: 'note', tone: 'blue', title: 'Processing time', text: 'The specific acknowledgement and processing windows for approved refunds are the operationally committed timelines published by BCPL. Gateway settlement time may apply in addition. OWNER / COUNSEL DECISION REQUIRED: confirm the exact approved acknowledgement and processing timeline for approved refunds before this is published as a fixed number of days.' },
    ],
  },
  {
    n: 13, icon: IcoShield, title: 'Chargebacks & Payment Disputes',
    blocks: [
      { kind: 'p', text: 'If you believe a charge is incorrect, please raise it with BCPL support first so it can be verified and resolved. Raising a chargeback with your bank for a fee that is non-refundable under this policy may lead to suspension of your registration pending resolution.' },
      { kind: 'p', text: 'A refund will not be processed twice for the same transaction (for example, both a BCPL refund and a successful bank chargeback).' },
    ],
  },
  {
    n: 14, icon: IcoBan, title: 'Fraud, Misrepresentation & Ineligibility',
    blocks: [
      { kind: 'p', text: 'Fees paid by a participant who is disqualified for fraud, impersonation, document/video manipulation, or for supplying false, inaccurate or misleading eligibility information (including age, professional status, cricket history or identity) are non-refundable.' },
    ],
  },
  {
    n: 15, icon: IcoInfo, title: 'Participant Withdrawal / No-Show',
    blocks: [
      { kind: 'p', text: 'A participant\u2019s voluntary withdrawal after a fee is successfully paid, or a no-show at an assigned physical trial, does not create a refund right.' },
    ],
  },
  {
    n: 16, icon: IcoVideo, title: 'Video Non-Submission / Invalid Submission',
    blocks: [
      { kind: 'note', tone: 'red', text: 'Not uploading your Phase 1 video, uploading it after the deadline, or uploading an incomplete, invalid, corrupted, inaccessible or non-compliant video does not entitle you to a refund of the Phase 1 fee. See Section 3.' },
    ],
  },
  {
    n: 17, icon: IcoStadium, title: 'Trial Non-Attendance',
    blocks: [
      { kind: 'p', text: 'Missing your assigned physical-trial slot, or arriving after the permitted entry window, is not automatically refundable. Any rescheduling or further consideration is only as provided under the published season rules.' },
    ],
  },
  {
    n: 18, icon: IcoWarn, title: 'Force Majeure',
    blocks: [
      { kind: 'p', text: 'Where BCPL is prevented from delivering a trial or event by circumstances beyond its reasonable control (including natural events, public-health restrictions, government orders, or venue failure), BCPL will seek to reschedule. Where BCPL cannot provide a reasonable rescheduled opportunity for a paid physical trial, Section 6 applies.' },
    ],
  },
  {
    n: 19, icon: IcoRupee, title: 'Optional Merchandise / Services',
    blocks: [
      { kind: 'p', text: 'Where BCPL offers any optional merchandise or add-on service, the refund terms shown for that specific item at the time of purchase apply. Personalised or dispatched items may be non-returnable.' },
    ],
  },
  {
    n: 20, icon: IcoMail, title: 'How to Raise a Refund Request',
    blocks: [
      { kind: 'p', text: 'Email support@bcplt20.com. Use the subject line: "REFUND REQUEST \u2014 [Your Registration ID]".' },
      { kind: 'ol', items: [
        'Your BCPL Registration ID (from your confirmation email).',
        'The scenario you are relying on (for example, duplicate payment, or undeclared result under Section 11).',
        'A brief explanation of your request.',
        'Your payment reference / order details.',
      ] },
    ],
  },
  {
    n: 21, icon: IcoDoc, title: 'Evidence Required',
    blocks: [
      { kind: 'ul', items: [
        'Payment confirmation (screenshot or PDF from the payment gateway).',
        'For duplicate payments: both payment references for the same fee.',
        'For a debited-but-pending case: the bank/UPI debit reference and the transaction timestamp.',
        'For the undeclared-result exception (Section 11): your Registration ID and video-submission confirmation.',
      ] },
      { kind: 'p', text: 'BCPL may verify your identity before actioning a refund request.' },
    ],
  },
  {
    n: 22, icon: IcoCard, title: 'Refund Destination',
    blocks: [
      { kind: 'p', text: 'Approved refunds are processed to the original payment method used for the transaction (for example, the same card or UPI). Refunds are not paid to a different account or by an alternative method.' },
    ],
  },
  {
    n: 23, icon: IcoScale, title: 'GST / Tax Treatment',
    blocks: [
      { kind: 'p', text: 'Fees are charged together with applicable GST; the amount shown to you at checkout is the amount payable. Where a refund is approved under this policy, the refund is processed on the amount actually charged, including the GST component charged on that amount, in accordance with applicable tax rules.' },
      { kind: 'p', text: 'A tax invoice/receipt is issued for successful payments.' },
    ],
  },
  {
    n: 24, icon: IcoChat, title: 'Contact Details',
    blocks: [
      { kind: 'p', text: 'For any refund query, email support@bcplt20.com with your Registration ID. Support hours are 9 AM \u2013 7 PM, Monday to Saturday.' },
    ],
  },
  {
    n: 25, icon: IcoInfo, title: 'Policy Version / Effective Date',
    blocks: [
      { kind: 'p', text: 'The version number, effective date and last-updated date for this policy are shown in the document header at the top of this page. This document applies to BCPL Season 5 unless expressly stated otherwise.' },
    ],
  },
];

export function Refunds() {
  const [regId,setRegId]=React.useState('');
  const [reason,setReason]=React.useState('');
  const [submitted,setSubmitted]=React.useState(false);
  const [open,setOpen]=React.useState<number | null>(1);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    .wrap{max-width:1280px;margin:0 auto;padding:0 16px;}
    .desk-nav{display:none;align-items:center;gap:22px;}
    .ham-btn{display:flex;}
    @media(min-width:640px){.wrap{padding:0 24px}}
    @media(min-width:768px){.wrap{padding:0 32px}}
    @media(min-width:1024px){.desk-nav{display:flex!important;}.ham-btn{display:none!important;}}
    .btn-fire{background:linear-gradient(135deg,#FF7A29 0%,#E8611A 60%,#C94E0E 100%);border:none;border-radius:14px;color:#fff;font-family:Montserrat,sans-serif;font-weight:800;cursor:pointer;box-shadow:0 8px 28px rgba(255,122,41,0.45),inset 0 1px 0 rgba(255,255,255,0.2);transition:transform 0.15s,box-shadow 0.2s;letter-spacing:0.02em;animation:pulseGlow 3s ease-in-out infinite;display:inline-flex;align-items:center;justify-content:center;min-height:44px;}
    .btn-fire:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(255,122,41,0.6);}
    .glass-card{background:linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85));backdrop-filter:blur(32px);border:1px solid rgba(255,255,255,0.09);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06);}
    .shimmer-gold{background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D,#F5C842,#E8B23D);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite;}
    .tag-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,122,41,0.12);border:1px solid rgba(255,122,41,0.3);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;font-family:Montserrat,sans-serif;color:#FF7A29;letter-spacing:0.1em;}
    .inp{width:100%;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:14px;color:#F8F4EE;padding:15px 18px;font-family:Inter,sans-serif;font-size:16px;outline:none;transition:all 0.25s;appearance:none;}
    .inp:focus{border-color:#FF7A29;background:rgba(255,122,41,0.06);box-shadow:0 0 0 4px rgba(255,122,41,0.12);}
    .inp::placeholder{color:rgba(255,255,255,0.28);}
    .lbl{font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-3);margin-bottom:8px;display:block;}
    .footer-grid{grid-template-columns:1fr!important;}
    @media(min-width:640px){.footer-grid{grid-template-columns:1fr 1fr!important;}}
    .float-reg-btn{position:fixed;bottom:28px;right:28px;z-index:900;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:12px;color:#fff;font-family:Montserrat,sans-serif;font-weight:900;font-size:13px;letter-spacing:.06em;cursor:pointer;padding:14px 22px;text-transform:uppercase;text-decoration:none;display:flex;align-items:center;gap:8px;box-shadow:0 8px 32px rgba(255,122,41,0.45);clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);transition:opacity .2s,transform .15s;}
    .float-reg-btn:hover{opacity:.9;transform:translateY(-2px);}
    .float-reg-pulse{animation:floatPulse 2.5s ease-in-out infinite;}
    @media(max-width:1023px){.float-reg-btn{display:none!important;}}
    .toc-grid{display:grid;grid-template-columns:1fr;gap:6px;}
    @media(min-width:640px){.toc-grid{grid-template-columns:1fr 1fr;}}
    .toc-link{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;text-decoration:none;color:rgba(255,255,255,.68);font-size:13px;border:1px solid transparent;transition:all .2s;min-height:40px;}
    .toc-link:hover{background:rgba(255,122,41,.08);color:#FF7A29;border-color:rgba(255,122,41,.2);}
    .acc-head{width:100%;display:flex;align-items:center;gap:12px;background:transparent;border:none;cursor:pointer;text-align:left;padding:0;color:inherit;}
    @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes pulseGlow{0%,100%{box-shadow:0 0 16px rgba(255,122,41,0.4)}50%{box-shadow:0 0 36px rgba(255,122,41,0.8),0 0 60px rgba(255,122,41,0.3)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes floatParticle{0%{transform:translateY(0) rotate(0deg);opacity:0.4}50%{opacity:0.8}100%{transform:translateY(-80px) rotate(180deg);opacity:0}}
    @keyframes scanPulse{0%,100%{opacity:0.03}50%{opacity:0.08}}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes borderGlow{0%,100%{border-color:rgba(255,122,41,0.3)}50%{border-color:rgba(255,122,41,0.8)}}
    @keyframes floatPulse{0%,100%{box-shadow:0 8px 32px rgba(255,122,41,0.45)}50%{box-shadow:0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0)}}
  `;

  const particles=[
    {top:'15%',left:'8%',color:'#FF7A29',delay:'0s',size:3},
    {top:'25%',left:'92%',color:'#E8B23D',delay:'1.2s',size:4},
    {top:'55%',left:'5%',color:'#fff',delay:'0.7s',size:3},
    {top:'70%',left:'88%',color:'#FF7A29',delay:'2s',size:3},
    {top:'40%',left:'50%',color:'#E8B23D',delay:'1.5s',size:4},
    {top:'80%',left:'30%',color:'#fff',delay:'0.3s',size:3},
    {top:'10%',left:'65%',color:'#FF7A29',delay:'2.5s',size:3},
    {top:'60%',left:'72%',color:'#E8B23D',delay:'0.9s',size:4},
  ];

  const toneColors:Record<string,{bg:string;bd:string;fg:string}> = {
    green:{bg:'rgba(34,197,94,0.08)',bd:'rgba(34,197,94,0.35)',fg:'#22C55E'},
    red:{bg:'rgba(232,73,63,0.08)',bd:'rgba(232,73,63,0.35)',fg:'#E8493F'},
    gold:{bg:'rgba(232,178,61,0.08)',bd:'rgba(232,178,61,0.4)',fg:'#E8B23D'},
    blue:{bg:'rgba(59,130,246,0.08)',bd:'rgba(59,130,246,0.3)',fg:'#60A5FA'},
  };

  const renderBlock = (b: Block, i: number) => {
    if (b.kind === 'p') return (
      <p key={i} style={{color:'rgba(255,255,255,0.75)',fontSize:'clamp(13px,2vw,15px)',lineHeight:1.75,marginBottom:12}}>{b.text}</p>
    );
    if (b.kind === 'ul') return (
      <ul key={i} style={{listStyle:'none',display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
        {b.items.map((it,j)=>(<li key={j} style={{display:'flex',alignItems:'flex-start',color:'rgba(255,255,255,0.75)',fontSize:'clamp(13px,2vw,14.5px)',lineHeight:1.7}}><OrangeDot/><span>{it}</span></li>))}
      </ul>
    );
    if (b.kind === 'ol') return (
      <ol key={i} style={{listStyle:'none',display:'flex',flexDirection:'column',gap:8,marginBottom:12,paddingLeft:0}}>
        {b.items.map((it,j)=>(<li key={j} style={{color:'rgba(255,255,255,0.78)',fontSize:'clamp(13px,2vw,14.5px)',lineHeight:1.7,paddingLeft:4}}>{it}</li>))}
      </ol>
    );
    // note
    const c = toneColors[b.tone];
    return (
      <div key={i} style={{background:c.bg,border:`1px solid ${c.bd}`,borderLeft:`4px solid ${c.fg}`,borderRadius:12,padding:'14px 16px',marginBottom:12}}>
        {b.title && <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:13,color:c.fg,marginBottom:6}}>{b.title}</div>}
        <p style={{color:'rgba(255,255,255,0.88)',fontSize:'clamp(13px,2vw,14.5px)',lineHeight:1.7,fontWeight:600}}>{b.text}</p>
      </div>
    );
  };

  return (
    <div style={{background:'#0E1624',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#F8F4EE',paddingBottom:80,overflowX:'hidden'}}>
      <style>{css}</style>
      <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,122,41,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.12) 0%, transparent 60%)'}}/>
        <svg style={{position:'absolute',bottom:0,left:0,right:0,width:'100%',opacity:0.07}} viewBox="0 0 1440 400" preserveAspectRatio="none">
          <path d="M0,400 L0,200 Q360,80 720,80 Q1080,80 1440,200 L1440,400 Z" fill="#1a2a4a"/>
          <rect x="680" y="200" width="80" height="200" fill="#15223B"/>
          <line x1="200" y1="0" x2="260" y2="200" stroke="#E8B23D" strokeWidth="3"/>
          <line x1="200" y1="0" x2="140" y2="200" stroke="#E8B23D" strokeWidth="3"/>
          <circle cx="200" cy="0" r="8" fill="#E8B23D"/>
          <line x1="1240" y1="0" x2="1300" y2="200" stroke="#E8B23D" strokeWidth="3"/>
          <line x1="1240" y1="0" x2="1180" y2="200" stroke="#E8B23D" strokeWidth="3"/>
          <circle cx="1240" cy="0" r="8" fill="#E8B23D"/>
        </svg>
        {particles.map((p,i)=>(
          <div key={i} style={{position:'absolute',top:p.top,left:p.left,width:p.size,height:p.size,borderRadius:'50%',background:p.color,animation:`floatParticle 4s ease-in-out ${p.delay} infinite`}}/>
        ))}
        <div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.015) 2px,rgba(255,255,255,0.015) 4px)',animation:'scanPulse 4s ease-in-out infinite'}}/>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <SiteHeader />

        <section style={{padding:'clamp(40px,8vw,72px) 0 40px',textAlign:'center',animation:'fadeSlide 0.6s ease both'}}>
          <div className="wrap">
            <div className="tag-pill" style={{marginBottom:20}}><IcoRupee size={14}/> REFUND & CANCELLATION POLICY</div>
            <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(32px,7vw,72px)',lineHeight:1.05,marginBottom:8}}>
              <span style={{color:'#fff',display:'block'}}>REFUND &</span>
              <span className="shimmer-gold" style={{display:'block'}}>CANCELLATION.</span>
            </h1>
            <p style={{color:'var(--ink-3)',fontSize:12,marginTop:16,fontFamily:'Inter,sans-serif'}}>यह दस्तावेज़ English में मान्य है · This document is authoritative in English.</p>
            <p style={{color:'rgba(255,255,255,0.65)',fontSize:'clamp(14px,2vw,16px)',lineHeight:1.7,maxWidth:640,margin:'16px auto 0'}}>
              This policy sets out, by scenario, when a refund applies under the BCPL two-phase process and when it does not. This document applies to BCPL Season 5 unless expressly stated otherwise.
            </p>
            <div style={{marginTop:28}}>
              <LegalDocHeader doc="refunds" />
            </div>
          </div>
        </section>

        <div className="wrap" style={{maxWidth:900,margin:'0 auto',paddingBottom:40}}>

          {/* KEY POINTS — plain-language summary */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.1s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <span style={{color:'#E8B23D',display:'inline-flex',alignItems:'center'}}><IcoList size={20}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:18,color:'#E8B23D'}}>Key Points</h2>
            </div>
            <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:12}}>
              {[
                'Your Phase 1 fee is non-refundable once it is successfully paid — including if you do not upload your video, upload late, upload an invalid video, withdraw, or do not qualify.',
                'Not uploading your video does not give you a refund.',
                'The one result-related exception: if you submit a valid video and BCPL does not declare your Phase 1 result within the published 15-working-days period, you can raise a support request for a refund (see Section 11).',
                'Your Phase 2 physical-trial fee is non-refundable for withdrawal, no-show, late arrival, failed verification, misconduct, disqualification or non-selection.',
                'You may get a refund for a verified duplicate payment, for money debited but no registration created, or where BCPL cancels a trial without a reasonable rescheduled opportunity.',
                'Approved refunds go back to your original payment method.',
              ].map((it,i)=>(
                <li key={i} style={{display:'flex',alignItems:'flex-start',gap:10,color:'rgba(255,255,255,0.82)',fontSize:'clamp(13px,2vw,15px)',lineHeight:1.7}}>
                  <span style={{flexShrink:0,color:'#22C55E',display:'inline-flex',marginTop:1}}><IcoCheck size={18}/></span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Disclaimer — prominent */}
          <div style={{background:'rgba(232,178,61,0.10)',border:'2px solid rgba(232,178,61,0.45)',borderLeft:'4px solid #E8B23D',borderRadius:16,padding:'18px clamp(16px,4vw,24px)',marginBottom:20,animation:'fadeSlide 0.5s ease 0.15s both'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{flexShrink:0,lineHeight:1,color:'#E8B23D',display:'inline-flex'}}><IcoWarn size={24}/></span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:15,color:'#E8B23D',marginBottom:6}}>Payment Disclaimer</div>
                <p style={{color:'rgba(255,255,255,0.9)',fontSize:'clamp(13px,2vw,15px)',lineHeight:1.75,fontWeight:600}}>
                  Payment of Phase 1 or Phase 2 fees does not guarantee Phase 1 Qualified status, Final Selection, Auction Pool entry, Player Auction purchase, Team Purchase, a player contract, remuneration or Tournament Participation.
                </p>
              </div>
            </div>
          </div>

          {/* Fee context note */}
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'14px clamp(16px,4vw,22px)',marginBottom:24}}>
            <p style={{color:'rgba(255,255,255,0.7)',fontSize:13,lineHeight:1.75}}>
              Phase 1 fee is role-based (₹299 + applicable GST for Batsman / Bowler / Wicketkeeper; ₹399 + applicable GST for All-Rounder). The Phase 2 fee is the applicable role-based Phase 2 fee plus applicable GST as displayed at the time of payment. GST is charged as applicable. The amount shown to you at checkout is the amount payable.
            </p>
          </div>

          {/* TABLE OF CONTENTS */}
          <div className="glass-card" style={{padding:'clamp(18px,4vw,26px)',marginBottom:24,animation:'fadeSlide 0.5s ease 0.2s both'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <span style={{color:'#FF7A29',display:'inline-flex',alignItems:'center'}}><IcoRoute size={18}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:16,color:'#fff'}}>Contents</h2>
            </div>
            <div className="toc-grid">
              {SECTIONS.map(s=>(
                <a key={s.n} href={`#refund-${s.n}`} className="toc-link" onClick={(e)=>{e.preventDefault();setOpen(s.n);setTimeout(()=>document.getElementById(`refund-${s.n}`)?.scrollIntoView({behavior:'smooth',block:'start'}),40);}}>
                  <span style={{width:24,height:24,borderRadius:'50%',background:'rgba(255,122,41,.15)',border:'1px solid rgba(255,122,41,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#FF7A29',flexShrink:0,fontFamily:'Montserrat,sans-serif'}}>{s.n}</span>
                  <span style={{flex:1}}>{s.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* FULL POLICY — accordion */}
          {SECTIONS.map((s,idx)=>{
            const isOpen = open === s.n;
            return (
              <div key={s.n} id={`refund-${s.n}`} className="glass-card" style={{padding:'clamp(16px,4vw,24px) clamp(16px,4vw,30px)',marginBottom:12,scrollMarginTop:90,animation:`fadeSlide 0.4s ease ${Math.min(0.05+idx*0.02,0.4)}s both`}}>
                <button className="acc-head" onClick={()=>setOpen(isOpen?null:s.n)} aria-expanded={isOpen}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,rgba(255,122,41,0.3),rgba(232,178,61,0.2))',border:'1px solid rgba(255,122,41,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:13,color:'#FF7A29',flexShrink:0}}>{s.n}</div>
                  <span style={{color:'#FF7A29',display:'inline-flex',alignItems:'center',flexShrink:0}}><s.icon size={18}/></span>
                  <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(15px,2.6vw,18px)',color:'#fff',flex:1}}>{s.title}</h2>
                  <span style={{color:'var(--ink-3)',fontSize:18,transition:'transform .2s',transform:isOpen?'rotate(180deg)':'none',flexShrink:0}}>▾</span>
                </button>
                {isOpen && (
                  <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.08)'}}>
                    {s.blocks.map((b,i)=>renderBlock(b,i))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Refund Request Mini-Form */}
          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px) clamp(16px,4vw,36px)',margin:'24px 0',border:'1px solid rgba(255,122,41,0.2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
              <span style={{color:'#FF7A29',display:'inline-flex',alignItems:'center'}}><IcoPen size={24}/></span>
              <h2 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:'clamp(16px,3vw,20px)',color:'#fff'}}>Refund Request Form</h2>
            </div>
            {submitted ? (
              <div style={{textAlign:'center',padding:'24px 0'}}>
                <div style={{marginBottom:12,color:'#22C55E',display:'flex',justifyContent:'center'}}><IcoCheck size={44}/></div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:20,color:'#22C55E',marginBottom:8}}>Request Submitted!</div>
                <p style={{color:'rgba(255,255,255,0.6)',fontSize:14}}>We've received your refund request. We will review it against this policy and respond to your registered email.</p>
              </div>
            ) : (
              <>
                <div style={{marginBottom:18}}>
                  <label className="lbl">Registration ID</label>
                  <input className="inp" type="text" placeholder="e.g. BCPL-DEL-1" value={regId} onChange={e=>setRegId(e.target.value)}/>
                </div>
                <div style={{marginBottom:20}}>
                  <label className="lbl">Reason for Refund</label>
                  <textarea className="inp" rows={4} placeholder="Briefly explain your request and the scenario you are relying on..." value={reason} onChange={e=>setReason(e.target.value)} style={{resize:'vertical',minHeight:100}}/>
                </div>
                <button className="btn-fire" style={{width:'100%',height:52,fontSize:16}} onClick={()=>{if(regId.trim()&&reason.trim())setSubmitted(true);}}>
                  Submit Refund Request →
                </button>
                <p style={{textAlign:'center',marginTop:14,color:'var(--ink-3)',fontSize:13}}>
                  Or email directly: <strong style={{color:'#E8B23D'}}>support@bcplt20.com</strong>
                </p>
              </>
            )}
          </div>

          <div style={{background:'rgba(255,122,41,0.08)',border:'1px solid rgba(255,122,41,0.4)',borderLeft:'3px solid #FF7A29',borderRadius:16,padding:'20px clamp(16px,4vw,24px)',marginBottom:20,animation:'borderGlow 3s ease-in-out infinite'}}>
            <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{flexShrink:0,color:'#FF7A29',display:'inline-flex'}}><IcoChat size={24}/></span>
              <div>
                <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:15,color:'#FF7A29',marginBottom:6}}>Have Questions?</div>
                <p style={{color:'rgba(255,255,255,0.85)',fontSize:'clamp(13px,2vw,14px)',lineHeight:1.7}}>
                  Contact our support team at <strong style={{color:'#E8B23D'}}>support@bcplt20.com</strong>. We're here 9 AM – 7 PM, Monday–Saturday.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{padding:'clamp(20px,4vw,32px)',textAlign:'center'}}>
            <div style={{fontFamily:'Montserrat,sans-serif',fontWeight:900,fontSize:'clamp(18px,3vw,22px)',marginBottom:8}}>Ready to Register?</div>
            <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,marginBottom:20}}>Before you pay, please note that the Phase 1 fee is non-refundable once successfully paid, including if you do not upload your video.</p>
            <Link href="/register" className="btn-fire" style={{padding:'14px 36px',fontSize:16,width:'100%',maxWidth:300,textDecoration:'none',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>Register for Phase 1 →</Link>
          </div>
        </div>

        <BCPLFooter />
      </div>
      <StickyRegisterCTA />
      <Link className='float-reg-btn float-reg-pulse' href='/register' style={{textDecoration:'none'}}>REGISTER NOW →</Link>
    </div>
  );
}
