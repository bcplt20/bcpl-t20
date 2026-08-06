import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useLang } from '@/lib/i18n';
import { getClassification, saveClassification, type ClassificationValue } from '@/lib/api';
import {
  canonicalRole,
  BATTING_HANDS,
  BATTING_POSITIONS,
  BATTING_STYLES,
  BOWLING_ARMS,
  bowlingTypesForArm,
  handLabel,
  armLabel,
  styleLabel,
  bowlingTypeLabel,
  positionLabel,
  type BattingHand,
  type BattingPosition,
  type BattingStyle,
  type BowlingArm,
  type BowlingType,
} from '@/lib/classification';

/**
 * Player classification (playing style) — captured once before the skill
 * video upload. Shows only the fields relevant to the player's role. All-
 * rounders complete two steps (batting → bowling); everyone else, one step.
 * On save the player continues to /register/upload-video (the upload page also
 * gates on this, so it can't be reached without a saved classification).
 */
export function PlayerClassification() {
  const { t, lang } = useLang();

  const [state, setState] = useState<'loading' | 'ready' | 'not_registered'>('loading');
  const [role, setRoleRaw] = useState<string>('bat');

  const [battingHand, setBattingHand] = useState<BattingHand | null>(null);
  const [battingPosition, setBattingPosition] = useState<BattingPosition | null>(null);
  const [battingStyle, setBattingStyle] = useState<BattingStyle | null>(null);
  const [bowlingArm, setBowlingArm] = useState<BowlingArm | null>(null);
  const [bowlingType, setBowlingType] = useState<BowlingType | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [carryover, setCarryover] = useState(false);
  const hydrated = useRef(false);

  const goUpload = () => window.location.assign(import.meta.env.BASE_URL + 'register/upload-video');
  const goDashboard = () => window.location.assign(import.meta.env.BASE_URL + 'profile');
  // Carryover players never upload a video — send them to their dashboard.
  const goNext = (isCarryover: boolean) => (isCarryover ? goDashboard() : goUpload());

  useEffect(() => {
    (async () => {
      try {
        const r = await getClassification();
        setRoleRaw(r.role ?? 'bat');
        setCarryover(r.carryover === true);
        // ONE-TIME: if it's already set, this screen isn't editable — move on.
        if (r.complete) { goNext(r.carryover === true); return; }
        if (!hydrated.current && r.classification) {
          hydrated.current = true;
          const v = r.classification;
          if (v.battingHand) setBattingHand(v.battingHand);
          if (v.battingPosition) setBattingPosition(v.battingPosition);
          if (v.battingStyle) setBattingStyle(v.battingStyle);
          if (v.bowlingArm) setBowlingArm(v.bowlingArm);
          if (v.bowlingType) setBowlingType(v.bowlingType);
        }
        setState('ready');
      } catch {
        setState('not_registered');
      }
    })();
  }, []);

  const cRole = canonicalRole(role);
  const needsBatting = cRole === 'bat' || cRole === 'wk' || cRole === 'ar';
  const needsBowling = cRole === 'bowl' || cRole === 'ar';
  const twoStep = needsBatting && needsBowling;

  const steps = useMemo<('batting' | 'bowling')[]>(() => {
    const s: ('batting' | 'bowling')[] = [];
    if (needsBatting) s.push('batting');
    if (needsBowling) s.push('bowling');
    return s;
  }, [needsBatting, needsBowling]);
  const currentStep = steps[stepIndex] ?? 'batting';
  const isLastStep = !twoStep || stepIndex === steps.length - 1;

  const battingValid = !needsBatting || (!!battingHand && !!battingPosition);
  const bowlingValid = !needsBowling || (!!bowlingArm && !!bowlingType);

  const onContinue = async () => {
    setError('');
    if (currentStep === 'batting' && !battingValid) {
      setError(t('Select your batting hand and position.', 'अपना बल्लेबाज़ी हाथ और स्थान चुनें।'));
      return;
    }
    if (currentStep === 'bowling' && !bowlingValid) {
      setError(t('Select your bowling arm and type.', 'अपना गेंदबाज़ी हाथ और प्रकार चुनें।'));
      return;
    }
    if (twoStep && stepIndex < steps.length - 1) { setStepIndex(stepIndex + 1); return; }

    const payload: ClassificationValue = {};
    if (needsBatting) {
      payload.battingHand = battingHand ?? undefined;
      payload.battingPosition = battingPosition ?? undefined;
      if (cRole === 'wk' && battingStyle) payload.battingStyle = battingStyle;
    }
    if (needsBowling) {
      payload.bowlingArm = bowlingArm ?? undefined;
      payload.bowlingType = bowlingType ?? undefined;
    }

    setSaving(true);
    try {
      await saveClassification(payload);
      goNext(carryover);
    } catch (e: any) {
      // One-time guard: already set → just move on to the next step.
      if (e?.code === 'CLASSIFICATION_ALREADY_SET') { goNext(carryover); return; }
      setError(e?.message ?? t('Could not save. Please try again.', 'सहेजा नहीं जा सका। कृपया फिर कोशिश करें।'));
      setSaving(false);
    }
  };

  const chip = (label: string, selected: boolean, onClick: () => void, key: string) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        padding: '11px 18px',
        borderRadius: 'var(--r)',
        border: selected ? '1px solid transparent' : '1px solid var(--line)',
        background: selected ? 'linear-gradient(135deg,#5B2BF0,#9B2FF0,#FF3DA6)' : 'rgba(255,255,255,0.03)',
        color: selected ? '#fff' : 'var(--ink)',
        fontFamily: 'var(--font-body)',
        fontWeight: selected ? 800 : 600,
        fontSize: 14,
      }}
    >
      {label}
    </button>
  );

  const fieldLabel = (text: string) => (
    <div style={{ color: 'var(--ink-3)', fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', margin: '4px 0 10px' }}>
      {text}
    </div>
  );

  const shell = (children: React.ReactNode) => (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>{children}</div>
    </div>
  );

  if (state === 'loading') {
    return shell(<div role="status" aria-label={t('Loading…', 'लोड हो रहा है…')} style={{ color: 'var(--ink-3)', textAlign: 'center' }}>{t('Loading…', 'लोड हो रहा है…')}</div>);
  }

  if (state === 'not_registered') {
    return shell(
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--ink)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, marginBottom: 12, textTransform: 'uppercase' }}>
          {t('Registration Required', 'रजिस्ट्रेशन आवश्यक है')}
        </h2>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
          {t('Please complete Phase 1 registration and payment first.', 'कृपया पहले Phase 1 रजिस्ट्रेशन और भुगतान पूरा करें।')}
        </p>
        <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,var(--orange),var(--orange-2))', color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: 'var(--r)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          {t('REGISTER NOW', 'अभी रजिस्टर करें')} →
        </Link>
      </div>
    );
  }

  return shell(
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 28 }}>
      {twoStep && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= stepIndex ? 'linear-gradient(90deg,#5B2BF0,#FF3DA6)' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      )}

      <h1 style={{ color: 'var(--ink)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 30, textTransform: 'uppercase', marginBottom: 8 }}>
        {t('Your Playing Style', 'आपकी खेल शैली')}
      </h1>
      <p style={{ color: 'var(--ink-3)', fontSize: 14, lineHeight: 1.7, marginBottom: 22 }}>
        {twoStep
          ? t(`Step ${stepIndex + 1} of ${steps.length}. This helps assess your video against the right criteria.`, `चरण ${stepIndex + 1}/${steps.length}. यह आपके video को सही मानदंड पर आँकने में मदद करता है।`)
          : t('This helps assess your video against the right criteria.', 'यह आपके video को सही मानदंड पर आँकने में मदद करता है।')}
      </p>

      {currentStep === 'batting' && (
        <div>
          <div style={{ color: '#FF3DA6', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            {t('Batting', 'बल्लेबाज़ी')}
          </div>
          {fieldLabel(t('Batting Hand', 'बल्लेबाज़ी हाथ'))}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            {BATTING_HANDS.map((h) => chip(handLabel(h, lang), battingHand === h, () => setBattingHand(h), `hand-${h}`))}
          </div>
          {fieldLabel(t('Batting Position', 'बल्लेबाज़ी स्थान'))}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            {BATTING_POSITIONS.map((p) => chip(positionLabel(role, p, lang), battingPosition === p, () => setBattingPosition(p), `pos-${p}`))}
          </div>
          {cRole === 'wk' && (
            <>
              {fieldLabel(t('Batting Style (optional)', 'बल्लेबाज़ी शैली (वैकल्पिक)'))}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
                {BATTING_STYLES.map((s) => chip(styleLabel(s, lang), battingStyle === s, () => setBattingStyle(battingStyle === s ? null : s), `style-${s}`))}
              </div>
            </>
          )}
        </div>
      )}

      {currentStep === 'bowling' && (
        <div>
          <div style={{ color: '#00DCF5', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            {t('Bowling', 'गेंदबाज़ी')}
          </div>
          {fieldLabel(t('Bowling Arm', 'गेंदबाज़ी हाथ'))}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            {BOWLING_ARMS.map((a) => chip(armLabel(a, lang), bowlingArm === a, () => { setBowlingArm(a); setBowlingType(null); }, `arm-${a}`))}
          </div>
          {bowlingArm ? (
            <>
              {fieldLabel(t('Bowling Type', 'गेंदबाज़ी प्रकार'))}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
                {bowlingTypesForArm(bowlingArm).map((bt) => chip(bowlingTypeLabel(bt, lang), bowlingType === bt, () => setBowlingType(bt), `btype-${bt}`))}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{t('Select your bowling arm first.', 'पहले अपना गेंदबाज़ी हाथ चुनें।')}</div>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: '#FF3DA6', fontSize: 13.5, fontWeight: 600, marginTop: 16 }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        {twoStep && stepIndex > 0 && (
          <button
            type="button"
            onClick={() => { setError(''); setStepIndex(stepIndex - 1); }}
            disabled={saving}
            style={{ cursor: 'pointer', padding: '14px 24px', borderRadius: 'var(--r)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: '.06em', textTransform: 'uppercase' }}
          >
            {t('Back', 'पीछे')}
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          disabled={saving}
          style={{ flex: 1, cursor: saving ? 'wait' : 'pointer', padding: '14px 24px', borderRadius: 'var(--r)', border: 'none', background: 'linear-gradient(135deg,var(--orange),var(--orange-2))', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: '.08em', textTransform: 'uppercase', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? t('Saving…', 'सहेजा जा रहा है…') : isLastStep ? t('Save & Continue', 'सहेजें और आगे') : t('Continue', 'आगे बढ़ें')}
        </button>
      </div>
    </div>
  );
}
