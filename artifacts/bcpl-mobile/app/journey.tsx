import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getDashboard, type Dashboard } from '@/lib/api';
import {
  BackChip,
  Card,
  ErrorView,
  LoadingView,
  ScreenBackground,
  useAppBarHeight,
  useBottomNavHeight,
} from '@/components/ui';

type StepState = 'done' | 'current' | 'todo';

function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
}

/*
 * Canonical paid vocabulary emitted by the API server. The server writes
 * "success" on Cashfree verify + webhook (payment.ts); older reconciliation
 * wrote "paid". The authoritative server list is PAID_STATUSES =
 * ["success", "paid"] (marketing.ts). Never invent new status strings here.
 */
const PAID_PAYMENT_STATUSES = ['success', 'paid'];
function isPaid(status?: string | null): boolean {
  return !!status && PAID_PAYMENT_STATUSES.includes(status);
}

/*
 * phase1Status values that a registration can ONLY reach after paying (the
 * flow is pending → payment_done → video_submitted → selected | rejected).
 * Legacy carryover users are provisioned straight to phase1Status "selected"
 * with NO phase1 payment row (auth.ts provisionLegacyCarryover) — their fees
 * are waived, so paid-ness must be inferred from phase1Status, not a payment
 * row. Only "pending" / "payment_pending" imply the user has not paid yet.
 * Mirrors the website's p1Paid check (PlayerProfile.tsx).
 */
const P1_AFTER_PAY = ['payment_done', 'video_submitted', 'selected', 'rejected'];
function impliesPaidFromPhase1(phase1Status?: string | null): boolean {
  return P1_AFTER_PAY.includes(phase1Status ?? '');
}

/**
 * A user is genuinely paid for Phase 1 if the payment row is in a paid state
 * OR the phase1Status has advanced past the unpaid states (covers legacy
 * carryover users who have no payment row). This guarantees a genuinely-paid
 * player never sees "payment pending".
 */
function isPhase1Paid(d: Dashboard): boolean {
  return isPaid(d.phase1Payment?.status) || impliesPaidFromPhase1(d.registration?.phase1Status);
}

/* ── Canonical journey derivation — MIRRORS the website source of truth
   (bcpl-website/src/pages/PlayerProfile.tsx deriveStep + journeyNodes). The
   whole screen is driven by ONE derived step, so exactly one next-action CTA
   is ever shown and KYC can never surface before the player is "selected".

   Phase-2 status vocab shared with the website (grep'd, never invented):
     phase2: (null) → payment_done → kyc_done → (kyc_approved) → trial_cleared
             → auction_shortlisted → team_signed
     kyc_records.status: pending | verified | failed                          */
const P2_TRIAL_STAGE = ['kyc_done', 'kyc_approved']; // KYC cleared, trial pending
const P2_POST_TRIAL = ['trial_cleared', 'auction_shortlisted', 'team_signed'];

/* KYC record statuses that mean "KYC is done". Historic vocab tolerance:
   some rows carry 'approved' instead of the canonical 'verified'. */
const KYC_DONE_STATUSES = ['verified', 'approved'];
const kycDone = (status: string | null | undefined): boolean =>
  !!status && KYC_DONE_STATUSES.includes(status);

type JourneyStep =
  | 'not_registered'
  | 'pay_phase1'
  | 'upload_video'
  | 'under_review'
  | 'rejected'
  | 'p2_register'
  | 'p2_kyc'
  | 'p2_kyc_pending'
  | 'trial_wait'
  | 'trial_scheduled'
  | 'trial_checked_in'
  | 'trial_completed';

/**
 * Single-cursor next-action derivation — byte-for-byte the same branch order
 * as the website's deriveStep(). Strongest server truth first so historic /
 * legacy-carryover accounts with missing early rows never get dragged back to
 * an earlier step.
 */
function deriveStep(d: Dashboard): JourneyStep {
  if (!d?.registered) return 'not_registered';
  const reg = d.registration;
  const p1 = reg?.phase1Status ?? '';
  const p2 = reg?.phase2Status ?? null;
  const kyc = d.kyc?.status ?? null;
  const trial = d.trial ?? null;
  const postTrial = P2_POST_TRIAL.includes(p2 ?? '');

  if (trial || postTrial || P2_TRIAL_STAGE.includes(p2 ?? '') || kycDone(kyc)) {
    if (trial?.assessmentSubmitted || postTrial) return 'trial_completed';
    if (trial?.checkedInAt) return 'trial_checked_in';
    if (trial) return 'trial_scheduled';
    return 'trial_wait';
  }
  if (p1 === 'rejected') return 'rejected';
  /* Phase-1 'selected' outranks a missing video row: legacy carryover accounts
     are provisioned already-selected with no video — they must land on the
     Phase-2 steps, never back on "upload video". */
  if (p1 !== 'selected') {
    /* BUG FIX: a registered-but-UNPAID player (phase1Status 'pending' / empty,
       no paid payment row) must be told to PAY Phase 1 — never to upload a
       video. The website enforces this via its upload-video page guard
       (phase1Status === 'pending' → "must pay first"); mirror it here by
       gating the upload step behind genuine paid-ness. isPhase1Paid() also
       returns true for legacy carryover (phase1Status advanced past pending
       with no payment row), so that path still flows through to the video/
       Phase-2 steps below unchanged. */
    if (!isPhase1Paid(d)) return 'pay_phase1';
    if (!d.video?.submitted) return 'upload_video';
    return 'under_review';
  }
  if (!p2) return 'p2_register';
  if (p2 === 'payment_done' && (!kyc || kyc === 'failed')) return 'p2_kyc';
  if (p2 === 'payment_done' && kyc === 'pending') return 'p2_kyc_pending';
  return 'under_review';
}

/**
 * 11-node MY BCPL JOURNEY timeline — mirrors the website's journeyNodes().
 * Same strongest-signal-first rule as deriveStep: a trial block (or kyc_done /
 * verified KYC) proves every earlier stage cleared, so early steps never show
 * as pending for historic accounts.
 */
function buildSteps(d: Dashboard, t: (en: string, hi: string) => string) {
  const reg = d.registration;
  const p1 = reg?.phase1Status ?? '';
  const p2 = reg?.phase2Status ?? null;
  const kyc = d.kyc?.status ?? null;
  const trial = d.trial ?? null;
  const postTrial = P2_POST_TRIAL.includes(p2 ?? '');
  const trialStage = !!trial || postTrial || P2_TRIAL_STAGE.includes(p2 ?? '') || kycDone(kyc);
  const p1After = impliesPaidFromPhase1(p1);
  const p2After = ['payment_done', ...P2_TRIAL_STAGE, ...P2_POST_TRIAL].includes(p2 ?? '');
  const resultOut = p1 === 'selected' || p1 === 'rejected';

  // Legacy PAID carryover players skip Phase-1 payment, the skill video and
  // the Phase-1 review/result entirely — they go straight to Phase-2 KYC.
  // Their journey: Registration → KYC → Trial pass → … (no video anywhere).
  const carryover = reg?.carryover === true;

  const defs: { title: string; icon: keyof typeof Feather.glyphMap; colors: readonly [string, string]; done: boolean }[] = carryover
    ? [
        { title: t('Registration', 'रजिस्ट्रेशन'), icon: 'user-check', colors: ['#5B2BF0', '#9B2FF0'], done: !!d.registered },
        { title: t('Phase 2 Payment', 'फेज 2 पेमेंट'), icon: 'credit-card', colors: ['#00DCF5', '#4B6BFF'], done: trialStage || p2After },
        { title: t('KYC Verification', 'KYC वेरिफिकेशन'), icon: 'shield', colors: ['#00DCF5', '#4B6BFF'], done: trialStage || kycDone(kyc) },
        { title: t('Trial Venue & Pass', 'ट्रायल वेन्यू व पास'), icon: 'map-pin', colors: ['#16E0A3', '#00B8D9'], done: !!trial || postTrial },
        { title: t('Venue Check-In', 'वेन्यू चेक-इन'), icon: 'log-in', colors: ['#16E0A3', '#00B8D9'], done: !!trial?.checkedInAt || postTrial },
        { title: t('Physical Trial', 'फिजिकल ट्रायल'), icon: 'activity', colors: ['#16E0A3', '#00B8D9'], done: !!trial?.assessmentSubmitted || postTrial },
        { title: t('Final Result', 'फाइनल रिज़ल्ट'), icon: 'target', colors: ['#FFC53D', '#FF7A3D'], done: false },
      ]
    : [
    { title: t('Registration', 'रजिस्ट्रेशन'), icon: 'user-check', colors: ['#5B2BF0', '#9B2FF0'], done: !!d.registered },
    { title: t('Phase 1 Payment', 'फेज 1 पेमेंट'), icon: 'credit-card', colors: ['#6B2BF0', '#9B2FF0'], done: trialStage || p1After },
    { title: t('Video Upload', 'वीडियो अपलोड'), icon: 'video', colors: ['#9B2FF0', '#FF3DA6'], done: trialStage || !!d.video?.submitted || ['video_submitted', 'selected', 'rejected'].includes(p1) },
    { title: t('Phase 1 Review', 'फेज 1 रिव्यू'), icon: 'search', colors: ['#FF3DA6', '#FF6FA6'], done: trialStage || resultOut },
    { title: t('Phase 1 Result', 'फेज 1 रिज़ल्ट'), icon: 'award', colors: ['#FF3DA6', '#FF8A3D'], done: trialStage || resultOut },
    { title: t('Phase 2 Payment', 'फेज 2 पेमेंट'), icon: 'credit-card', colors: ['#00DCF5', '#4B6BFF'], done: trialStage || p2After },
    { title: t('KYC Verification', 'KYC वेरिफिकेशन'), icon: 'shield', colors: ['#00DCF5', '#4B6BFF'], done: trialStage || kycDone(kyc) },
    { title: t('Trial Venue & Pass', 'ट्रायल वेन्यू व पास'), icon: 'map-pin', colors: ['#16E0A3', '#00B8D9'], done: !!trial || postTrial },
    { title: t('Venue Check-In', 'वेन्यू चेक-इन'), icon: 'log-in', colors: ['#16E0A3', '#00B8D9'], done: !!trial?.checkedInAt || postTrial },
    { title: t('Physical Trial', 'फिजिकल ट्रायल'), icon: 'activity', colors: ['#16E0A3', '#00B8D9'], done: !!trial?.assessmentSubmitted || postTrial },
    { title: t('Final Result', 'फाइनल रिज़ल्ट'), icon: 'target', colors: ['#FFC53D', '#FF7A3D'], done: false },
  ];

  /* Journey pauses (no "current" pulse) once a Phase 1 result is out and the
     player did not progress — remaining steps stay quietly upcoming. */
  const paused = p1 === 'rejected' && !trialStage;
  let activeGiven = false;
  return defs.map((def, i) => {
    let state: StepState;
    if (def.done) state = 'done';
    else if (!activeGiven && !paused) { activeGiven = true; state = 'current'; }
    else state = 'todo';
    return { key: String(i), title: def.title, icon: def.icon, colors: def.colors, state };
  });
}

function StepChip({ step, isLast }: { step: ReturnType<typeof buildSteps>[number]; isLast: boolean }) {
  const c = useColors();
  const { t } = useLang();
  const active = step.state !== 'todo';

  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      {/* rail */}
      <View style={{ alignItems: 'center', width: 48 }}>
        <View style={[styles.stepIcon, { borderColor: active ? 'transparent' : c.line, backgroundColor: active ? 'transparent' : c.card2 }]}>
          {active ? (
            <LinearGradient colors={step.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
          ) : null}
          <Feather
            name={step.state === 'done' ? 'check' : step.icon}
            size={20}
            color={active ? '#fff' : c.sub}
          />
        </View>
        {!isLast ? (
          <View style={{ flex: 1, width: 2, marginVertical: 4, backgroundColor: step.state === 'done' ? c.violet : c.line, borderRadius: 1, minHeight: 20 }} />
        ) : null}
      </View>

      {/* card */}
      <View style={{ flex: 1, marginBottom: 16 }}>
        <View style={[styles.stepCard, { backgroundColor: c.card, borderColor: step.state === 'current' ? c.violet : c.line }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15, flex: 1 }}>{step.title}</Text>
            {step.state === 'current' ? (
              <View style={{ backgroundColor: 'rgba(124,92,255,0.15)', borderColor: 'rgba(124,92,255,0.4)', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: c.violet, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9.5, letterSpacing: 0.5 }}>{t('CURRENT', 'अभी')}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: step.state === 'done' ? c.mint : step.state === 'current' ? c.violet : c.sub }} />
            <Text style={{ color: step.state === 'todo' ? c.sub : c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
              {step.state === 'done' ? t('Done', 'पूरा') : step.state === 'current' ? t('In progress', 'चल रहा है') : t('Pending', 'लंबित')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function JourneyScreen() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const { token, ready } = useAuth();
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const q = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  // BUG FIX (data freshness): refetch the dashboard whenever this screen
  // regains focus — e.g. after completing KYC/video/payment on another screen,
  // or after the owner changed their status on the website and came back to the
  // app. Combined with clearing the query cache on login/logout, the journey
  // never shows a stale step.
  const refetch = q.refetch;
  useFocusEffect(
    useCallback(() => {
      if (token) refetch();
    }, [token, refetch]),
  );

  if (!ready) return <LoadingView />;

  const d = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <BackChip onPress={() => router.back()} testID="journey-back" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomNavHeight, paddingTop: appBarHeight }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.violet} />}
      >
        <View style={{ paddingHorizontal: 16 }}>
          <LinearGradient colors={['#5B2BF0', '#9B2FF0', '#FF3DA6']} style={{ width: 48, height: 4, borderRadius: 2, marginBottom: 12, marginTop: 8 }} />
          <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32, color: c.ink, letterSpacing: -1 }}>
            {t('My Journey', 'मेरा सफ़र')}
          </Text>
          <Text style={{ color: c.sub, fontSize: 14, marginTop: 6, fontFamily: 'PlusJakartaSans_500Medium' }}>
            {t('Your Season 5 status, step by step', 'आपकी सीज़न 5 स्थिति, कदम दर कदम')}
          </Text>
        </View>

        {!token ? (
          <View style={{ padding: 16, paddingTop: 40 }}>
            <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
              <Feather name="lock" size={28} color={c.magenta} />
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
                {t('Log in to see your journey', 'अपना सफ़र देखने के लिए लॉगिन करें')}
              </Text>
              <Pressable onPress={() => router.push('/login')} style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]} testID="journey-login">
                <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
                <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>{t('Login with OTP', 'OTP से लॉगिन')}</Text>
              </Pressable>
            </Card>
          </View>
        ) : q.isLoading ? (
          <LoadingView />
        ) : q.isError ? (
          <ErrorView onRetry={() => q.refetch()} />
        ) : !d?.registered || !d.registration ? (
          <View style={{ padding: 16, paddingTop: 40 }}>
            <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
              <Feather name="edit-3" size={28} color={c.cyan} />
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center', paddingHorizontal: 24 }}>
                {t('Register for BCPL Season 5', 'BCPL सीज़न 5 के लिए रजिस्टर करें')}
              </Text>
              <Text style={{ color: c.sub, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium', paddingHorizontal: 24 }}>
                {t('Register right here in the app — your journey will appear once you complete it.', 'यहीं ऐप में रजिस्टर करें — पूरा करते ही आपका सफ़र यहाँ दिखेगा।')}
              </Text>
              <Pressable onPress={() => router.push('/register')} style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]} testID="journey-register">
                <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
                <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>{t('Register now', 'अभी रजिस्टर करें')}</Text>
              </Pressable>
            </Card>
          </View>
        ) : (
          <JourneyBody d={d} />
        )}
      </ScrollView>
    </View>
  );
}

function JourneyBody({ d }: { d: Dashboard }) {
  const c = useColors();
  const { t } = useLang();
  const steps = buildSteps(d, t);
  const reg = d.registration!;

  /* SINGLE source of truth for the next action — mirrors the website's
     deriveStep(). Exactly one CTA banner is ever shown, so KYC can never
     surface before the player is "selected" and the video step is always the
     next action for a paid-no-video player. */
  const step = deriveStep(d);

  // KYC detail card only makes sense once we're at/after the KYC gate.
  const kycStageReached = step === 'p2_kyc_pending' || step === 'trial_wait' ||
    step === 'trial_scheduled' || step === 'trial_checked_in' || step === 'trial_completed';

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
      {/* Reg number chip */}
      <Card style={{ padding: 0, marginBottom: 20 }}>
        <LinearGradient colors={['rgba(255,255,255,0.05)', 'transparent']} style={{ padding: 18, borderRadius: 22 }}>
          <Text style={{ color: c.sub, fontSize: 10.5, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 1 }}>
            {t('REGISTRATION NO.', 'रजिस्ट्रेशन नंबर')}
          </Text>
          <Text style={{ color: c.cyan, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 26, marginTop: 4, letterSpacing: -0.5 }}>
            {reg.regNumber ?? '—'}
          </Text>
          {reg.trialCity ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <Feather name="map-pin" size={14} color={c.magenta} />
              <Text style={{ color: c.ink, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('Trial city', 'ट्रायल शहर')}: <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold' }}>{reg.trialCity}</Text>
              </Text>
            </View>
          ) : null}
        </LinearGradient>
      </Card>

      {/* Next action — single derived-step banner (mirrors website getBannerConfig).
          For the video step this is the rich VideoTrialCard with a live countdown. */}
      <NextActionBanner step={step} d={d} />

      {/* Step timeline (11-node MY BCPL JOURNEY, website parity) */}
      <View style={{ marginTop: 20, marginBottom: 8 }}>
        {steps.map((s, i) => (
          <StepChip key={s.key} step={s} isLast={i === steps.length - 1} />
        ))}
      </View>

      {/* KYC status detail — only once the KYC gate has been reached */}
      {d.kyc && kycStageReached ? (
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.detailTitle, { color: c.ink }]}>{t('KYC status', 'KYC स्थिति')}</Text>
          <DetailRow label={t('Status', 'स्थिति')} value={
            kycDone(d.kyc.status) ? t('Verified', 'सत्यापित')
              : d.kyc.status === 'failed' ? t('Needs re-submission', 'दोबारा सबमिट करें')
                : t('Under review', 'समीक्षा में')
          } />
          {d.kyc.profession ? <DetailRow label={t('Profession', 'पेशा')} value={d.kyc.profession} /> : null}
          {fmtDate(d.kyc.verifiedAt) ? <DetailRow label={t('Verified on', 'सत्यापित तिथि')} value={fmtDate(d.kyc.verifiedAt)!} /> : null}
        </Card>
      ) : null}

      {/* Physical trial detail */}
      {d.trial?.venue ? (
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.detailTitle, { color: c.ink }]}>{t('Physical trial', 'फिजिकल ट्रायल')}</Text>
          <DetailRow label={t('Venue', 'वेन्यू')} value={d.trial.venue.name} />
          {d.trial.venue.city ? <DetailRow label={t('City', 'शहर')} value={d.trial.venue.city} /> : null}
          {d.trial.venue.address ? <DetailRow label={t('Address', 'पता')} value={d.trial.venue.address} /> : null}
          {d.trial.slot?.date ? <DetailRow label={t('Date', 'तारीख')} value={fmtDate(d.trial.slot.date) ?? d.trial.slot.date} /> : null}
          {d.trial.slot?.reportingTime ? <DetailRow label={t('Reporting time', 'रिपोर्टिंग समय')} value={d.trial.slot.reportingTime} /> : null}
          {d.trial.slot?.batch ? <DetailRow label={t('Batch', 'बैच')} value={d.trial.slot.batch} /> : null}
        </Card>
      ) : null}

      {/* Payment receipt info (also shows the waived line for legacy carryover) */}
      {d.phase1Payment || d.phase2Payment || impliesPaidFromPhase1(reg.phase1Status) ? (
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.detailTitle, { color: c.ink }]}>{t('Payments', 'भुगतान')}</Text>
          {d.phase1Payment ? (
            <DetailRow
              label={`${t('Phase 1', 'फेज 1')} · ₹${d.phase1Payment.amount}`}
              value={`${isPaid(d.phase1Payment.status) || impliesPaidFromPhase1(reg.phase1Status) ? t('Paid', 'भुगतान') : t('Pending', 'बाकी')}${fmtDate(d.phase1Payment.paidAt) ? ` · ${fmtDate(d.phase1Payment.paidAt)}` : ''}`}
            />
          ) : impliesPaidFromPhase1(reg.phase1Status) ? (
            <DetailRow
              label={t('Phase 1', 'फेज 1')}
              value={t('Fees waived (carryover)', 'फीस माफ (कैरीओवर)')}
            />
          ) : null}
          {d.phase2Payment ? (
            <DetailRow
              label={`${t('Phase 2', 'फेज 2')} · ₹${d.phase2Payment.amount}`}
              value={`${isPaid(d.phase2Payment.status) ? t('Paid', 'भुगतान') : t('Pending', 'बाकी')}${fmtDate(d.phase2Payment.paidAt) ? ` · ${fmtDate(d.phase2Payment.paidAt)}` : ''}`}
            />
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}

/**
 * Single next-action banner — one card per derived step, mirroring the
 * website's getBannerConfig() copy, CTAs and destinations exactly. Only ONE
 * of these is ever rendered per visit, guaranteeing the app can never show
 * the KYC CTA before a player is "selected" and always shows the video step
 * as the next action for a paid-no-video player.
 *
 * Native in-app video upload / KYC forms are owned by separate tasks; the
 * CTAs hand off to the authenticated website pages, exactly as today.
 */
function NextActionBanner({ step, d }: { step: JourneyStep; d: Dashboard }) {
  const c = useColors();
  const { t } = useLang();
  const router = useRouter();
  const reg = d.registration;
  const name = d.user?.name ?? '';
  const city = reg?.trialCity ?? '';

  // The video step gets the rich, premium countdown card.
  if (step === 'upload_video') {
    return (
      <VideoTrialCard
        deadlineIso={reg?.videoDeadline ?? null}
        deadlineExpired={!!reg?.deadlineExpired}
        videoSubmitted={!!d.video?.submitted}
        submittedAt={d.video?.submittedAt ?? null}
      />
    );
  }

  type Banner = {
    accent: string;
    icon: keyof typeof Feather.glyphMap;
    title: string;
    body: string;
    cta?: string;
    onPress?: () => void;
    ctaColors?: readonly [string, string];
    /** Whether the CTA navigates in-app (arrow) vs. opens a browser (external-link). */
    inApp?: boolean;
  };

  const banners: Record<Exclude<JourneyStep, 'upload_video'>, Banner> = {
    not_registered: {
      accent: c.magenta, icon: 'edit-3',
      title: t('Register for BCPL Season 5', 'BCPL सीज़न 5 के लिए रजिस्टर करें'),
      body: t('Start your BCPL journey — register as a player and pay the Phase 1 fee to get started.', 'अपना BCPL सफ़र शुरू करें — खिलाड़ी के रूप में रजिस्टर करें और शुरू करने के लिए फेज 1 फीस भरें।'),
      cta: t('Register now', 'अभी रजिस्टर करें'),
      onPress: () => router.push('/register'),
      ctaColors: ['#FF1A75', '#D10056'],
      inApp: true,
    },
    pay_phase1: {
      // BUG FIX: unpaid players must be told to PAY Phase 1 — never to upload a
      // video. This is the ONLY next action for a registered-but-unpaid player.
      accent: c.magenta, icon: 'credit-card',
      title: t('Complete Your Phase 1 Payment', 'अपना फेज 1 भुगतान पूरा करें'),
      body: t(`${name || 'Player'}, your registration is saved but the Phase 1 fee is still pending. Pay the Phase 1 fee to unlock your trial video upload and continue your BCPL journey.`, `${name || 'खिलाड़ी'}, आपकी रजिस्ट्रेशन सेव है लेकिन फेज 1 फीस अभी बाकी है। ट्रायल वीडियो अपलोड अनलॉक करने और अपना BCPL सफ़र जारी रखने के लिए फेज 1 फीस भरें।`),
      cta: t('PAY Phase 1 fee', 'फेज 1 फीस भरें'),
      onPress: () => router.push('/register'),
      ctaColors: ['#FF1A75', '#D10056'],
      inApp: true,
    },
    under_review: {
      accent: c.getAccentText(c.amber), icon: 'search',
      title: t('Video Under Evaluation', 'वीडियो मूल्यांकन में है'),
      body: t('Your Phase 1 submission is going through the evaluation process. Your result will be shared within 15 days via SMS and email.', 'आपका फेज 1 सबमिशन मूल्यांकन प्रक्रिया से गुज़र रहा है। आपका परिणाम 15 दिनों के भीतर SMS और ईमेल से मिलेगा।'),
    },
    rejected: {
      accent: c.getAccentText(c.amber), icon: 'flag',
      title: t('Phase 1 Assessment Complete', 'फेज 1 असेसमेंट पूरा'),
      body: t('You completed the full Phase 1 assessment this season. You were not shortlisted for Phase 2 this time — your scorecard shows exactly where to improve. Season 6 registrations open soon.', 'आपने इस सीज़न का पूरा फेज 1 असेसमेंट पूरा किया। इस बार आप फेज 2 के लिए shortlist नहीं हुए — आपका स्कोरकार्ड बताता है कि कहाँ सुधार करना है। सीज़न 6 रजिस्ट्रेशन जल्द खुलेंगे।'),
    },
    p2_register: {
      accent: c.mint, icon: 'star',
      title: t('Congratulations! Selected for Phase 2', 'बधाई हो! फेज 2 के लिए चुने गए'),
      body: t(`${name}, you've cleared Phase 1 evaluation. Complete Phase 2 registration and pay the trial fee to secure your spot at the ${city} physical trial.`, `${name}, आपने फेज 1 evaluation पास कर लिया है। फेज 2 रजिस्ट्रेशन पूरा करें और ${city} फिजिकल ट्रायल में अपनी जगह पक्की करने के लिए ट्रायल फीस भरें।`),
      cta: t('Continue to Phase 2', 'फेज 2 के लिए आगे बढ़ें'),
      onPress: () => router.push('/phase2-pay'),
      ctaColors: ['#16E0A3', '#00B8D9'],
      inApp: true,
    },
    p2_kyc: {
      accent: c.cyan, icon: 'shield',
      title: t('Complete Your KYC', 'अपना KYC पूरा करें'),
      body: t(`Phase 2 payment done. One last step — complete your KYC (Aadhaar + PAN verification) to confirm your trial slot in ${city}.`, `फेज 2 पेमेंट हो गया। एक आख़िरी कदम — ${city} में अपने ट्रायल स्लॉट की पुष्टि के लिए अपना KYC (आधार + PAN वेरिफ़िकेशन) पूरा करें।`),
      cta: t('Complete KYC now', 'अभी KYC पूरा करें'),
      onPress: () => router.push('/kyc'),
      ctaColors: ['#00B3FF', '#0077C8'],
      inApp: true,
    },
    p2_kyc_pending: {
      accent: c.getAccentText(c.amber), icon: 'clock',
      title: t('KYC Under Review', 'KYC रिव्यू में है'),
      body: t('Your KYC documents are being verified. This usually takes a few hours. You will receive an SMS and email once verified.', 'आपके KYC दस्तावेज़ वेरीफ़ाई किए जा रहे हैं। इसमें आमतौर पर कुछ घंटे लगते हैं। वेरीफ़ाई होने पर आपको SMS और ईमेल मिलेगा।'),
    },
    trial_wait: {
      accent: c.mint, icon: 'flag',
      title: t('KYC Verified — Awaiting Trial Schedule', 'KYC वेरीफ़ाइड — ट्रायल शेड्यूल का इंतज़ार'),
      body: t(`You're fully registered for the ${city} physical trial. Trial venue and date will be announced soon via SMS and email. Start your preparations!`, `आप ${city} फिजिकल ट्रायल के लिए पूरी तरह रजिस्टर्ड हैं। ट्रायल का स्थान और तारीख जल्द SMS और ईमेल से घोषित होगी। अपनी तैयारी शुरू करें!`),
    },
    trial_scheduled: {
      accent: c.getAccentText(c.amber), icon: 'map-pin',
      title: t('Trial Scheduled', 'ट्रायल निर्धारित'),
      body: t('Your physical trial is confirmed. See your venue, date and reporting time below. Carry your Trial Pass and original Aadhaar card.', 'आपका फिजिकल ट्रायल पक्का है। नीचे अपना वेन्यू, तारीख और रिपोर्टिंग समय देखें। अपना Trial Pass और original आधार कार्ड साथ लाएँ।'),
    },
    trial_checked_in: {
      accent: c.mint, icon: 'check-circle',
      title: t('Checked In — Best of Luck!', 'चेक-इन पूरा — शुभकामनाएँ!'),
      body: t("You are checked in at your trial venue. Follow the ground staff's instructions — your assessment will be recorded by the BCPL trial team.", 'आप अपने ट्रायल वेन्यू पर चेक-इन कर चुके हैं। Ground staff के निर्देशों का पालन करें — आपका असेसमेंट BCPL trial team रिकॉर्ड करेगी।'),
    },
    trial_completed: {
      accent: c.mint, icon: 'award',
      title: t('Physical Trial Completed', 'फिजिकल ट्रायल पूरा हुआ'),
      body: t(`Well played, ${name}! Your physical trial is complete and your assessment has been recorded. Results will be announced after trials conclude across all cities — you'll be notified by SMS and email.`, `बहुत बढ़िया, ${name}! आपका फिजिकल ट्रायल पूरा हो गया है और आपका असेसमेंट रिकॉर्ड कर लिया गया है। सभी शहरों के ट्रायल पूरे होने के बाद रिज़ल्ट घोषित होगा — आपको SMS और ईमेल से सूचना मिलेगी।`),
    },
  };

  const b = banners[step];
  if (!b) return null;

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Feather name={b.icon} size={18} color={b.accent} />
        <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, flex: 1 }}>{b.title}</Text>
      </View>
      <Text style={{ color: c.sub, fontSize: 13.5, lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' }}>{b.body}</Text>
      {b.cta && b.onPress ? (
        <Pressable onPress={b.onPress} style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.85 : 1 }]} testID={`journey-cta-${step}`}>
          <LinearGradient colors={b.ctaColors ?? (['#FF1A75', '#D10056'] as const)} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
          <Feather name={b.inApp ? 'arrow-right' : 'external-link'} size={16} color="#fff" />
          <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }}>{b.cta}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

type Countdown = { d: number; h: number; m: number; s: number; expired: boolean; urgent: boolean };

/**
 * Live countdown to the upload deadline — ticks every second. Mirrors the
 * website's useCountdown (Phase1VideoUpload.tsx). Returns null when there is
 * no deadline to count towards.
 */
function useCountdown(deadlineIso: string | null): Countdown | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadlineIso) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [deadlineIso]);
  if (!deadlineIso) return null;
  const target = new Date(deadlineIso).getTime();
  if (isNaN(target)) return null;
  const ms = target - now;
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true, urgent: true };
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor(ms / 3600000) % 24,
    m: Math.floor(ms / 60000) % 60,
    s: Math.floor(ms / 1000) % 60,
    expired: false,
    urgent: ms < 24 * 3600000,
  };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Premium video-trial card: status chips, a live ticking countdown to the
 * upload deadline, a slim progress bar for the 15-day window, and a prominent
 * hand-off CTA to the website upload page. States: not-started, submitted and
 * deadline-passed.
 */
function VideoTrialCard({
  deadlineIso,
  deadlineExpired,
  videoSubmitted,
  submittedAt,
}: {
  deadlineIso: string | null;
  deadlineExpired: boolean;
  videoSubmitted: boolean;
  submittedAt: string | null;
}) {
  const c = useColors();
  const { t } = useLang();
  const router = useRouter();
  const cd = useCountdown(deadlineIso);

  // Deadline is passed if the server said so, or the live countdown ran out.
  const passed = !videoSubmitted && (deadlineExpired || !!cd?.expired);
  const urgent = !!cd?.urgent && !passed && !videoSubmitted;

  // 15-day window progress (fraction of time already elapsed).
  const windowMs = 15 * 86400000;
  let elapsedFrac = 0;
  if (deadlineIso) {
    const target = new Date(deadlineIso).getTime();
    if (!isNaN(target)) {
      const remaining = Math.max(0, target - Date.now());
      elapsedFrac = Math.min(1, Math.max(0, 1 - remaining / windowMs));
    }
  }
  if (passed) elapsedFrac = 1;

  const chip = videoSubmitted
    ? { label: t('Submitted', 'सबमिट हो गया'), color: c.mint, bg: 'rgba(22,224,163,0.14)' }
    : passed
      ? { label: t('Window closed', 'window बंद'), color: c.coral, bg: 'rgba(255,90,110,0.14)' }
      : urgent
        ? { label: t('Closing soon', 'जल्द बंद'), color: c.coral, bg: 'rgba(255,90,110,0.14)' }
        : { label: t('Open', 'खुला'), color: c.getAccentText(c.amber), bg: 'rgba(255,197,61,0.14)' };

  const barColor = passed ? c.coral : urgent ? c.coral : c.magenta;
  const countdownColor = passed || urgent ? c.coral : c.getAccentText(c.amber);

  return (
    <Card style={{ marginTop: 8 }}>
      {/* Header + status chip */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Feather name="video" size={18} color={c.magenta} />
        <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15, flex: 1 }}>
          {t('Video Trial', 'वीडियो ट्रायल')}
        </Text>
        <View style={{ backgroundColor: chip.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: chip.color, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 0.5 }}>
            {chip.label.toUpperCase()}
          </Text>
        </View>
      </View>

      {videoSubmitted ? (
        /* ── Submitted state ── */
        <View style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="check-circle" size={16} color={c.mint} />
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
              {t('Your video is in.', 'आपका वीडियो जमा हो गया।')}
            </Text>
          </View>
          <Text style={{ color: c.sub, fontSize: 13, marginTop: 8, lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
            {t(
              'Your Phase 1 submission is going through evaluation. Result within 15 days via SMS, WhatsApp and email.',
              'आपका फेज 1 सबमिशन मूल्यांकन में है। परिणाम 15 दिनों के भीतर SMS, WhatsApp और ईमेल से मिलेगा।',
            )}
          </Text>
          {fmtDate(submittedAt) ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <Feather name="upload" size={14} color={c.mint} />
              <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                {t('Uploaded on', 'अपलोड तिथि')} {fmtDate(submittedAt)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : passed ? (
        /* ── Deadline passed state ── */
        <View style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="alert-triangle" size={16} color={c.coral} />
            <Text style={{ color: c.coral, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
              {t('Upload window closed', 'अपलोड window बंद')}
            </Text>
          </View>
          <Text style={{ color: c.sub, fontSize: 13, marginTop: 8, lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
            {t(
              'Your 15-day video window has expired and late submissions cannot be accepted for Phase 1 review.',
              'आपकी 15-दिन की वीडियो window समाप्त हो गई है और फेज 1 समीक्षा के लिए देर से सबमिशन स्वीकार नहीं होते।',
            )}
          </Text>
        </View>
      ) : (
        /* ── Not started / open state ── */
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
            {t('Upload your 30–90 second trial video', '30–90 सेकंड का ट्रायल वीडियो अपलोड करें')}
          </Text>
          <Text style={{ color: c.sub, fontSize: 13, marginTop: 8, lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
            {t(
              'Record a clear clip of your skills and upload it right here in the app within your window.',
              'अपनी स्किल्स का साफ clip record करके अपनी window के भीतर यहीं ऐप में अपलोड करें।',
            )}
          </Text>

          {/* Live countdown */}
          {cd ? (
            <View style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Feather name="clock" size={14} color={countdownColor} />
                <Text style={{ color: countdownColor, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12.5, letterSpacing: 0.3 }}>
                  {cd.d > 0
                    ? `${cd.d} ${cd.d === 1 ? t('day', 'दिन') : t('days', 'दिन')} ${pad2(cd.h)}:${pad2(cd.m)}:${pad2(cd.s)} ${t('left to upload', 'अपलोड बाकी')}`
                    : `${pad2(cd.h)}:${pad2(cd.m)}:${pad2(cd.s)} ${t('left to upload', 'अपलोड बाकी')}`}
                </Text>
              </View>
              {/* window progress bar */}
              <View style={{ height: 6, borderRadius: 3, backgroundColor: c.card2, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(elapsedFrac * 100)}%`, height: '100%', borderRadius: 3, backgroundColor: barColor }} />
              </View>
            </View>
          ) : null}

          <Pressable onPress={() => router.push('/upload-video')} style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.85 : 1 }]} testID="journey-video-upload">
            <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
            <Feather name="upload" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }}>
              {t('Upload trial video', 'ट्रायल वीडियो अपलोड करें')}
            </Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }}>
      <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, flexShrink: 0 }}>{label}</Text>
      <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stepCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  detailTitle: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, marginBottom: 4 },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
    overflow: 'hidden',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 20,
    overflow: 'hidden',
  },
});
