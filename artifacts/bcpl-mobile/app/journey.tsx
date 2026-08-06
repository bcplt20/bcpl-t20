import React from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getDashboard, SITE_ASSETS, type Dashboard } from '@/lib/api';
import {
  BackChip,
  Card,
  ErrorView,
  LoadingView,
  ScreenBackground,
  useAppBarHeight,
  useBottomNavHeight,
} from '@/components/ui';

/* Website pages we hand off to (open in the in-app browser). */
const WEB_VIDEO_UPLOAD = `${SITE_ASSETS}/register/upload-video`;
const WEB_KYC = `${SITE_ASSETS}/register/phase2/kyc`;

type StepState = 'done' | 'current' | 'todo';

function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
}

/* Compliant paid-check: legacy "paid" alongside "success" (see api-field-traps). */
function isPaid(status?: string | null): boolean {
  return status === 'success' || status === 'paid';
}

/**
 * Build the journey step list from live dashboard state. Copy is
 * compliance-safe: no "selected"/"scout"/guarantee wording — we use
 * "qualified" / "not qualified" and "Auction Pool".
 */
function buildSteps(d: Dashboard, t: (en: string, hi: string) => string) {
  const reg = d.registration;
  const p1 = reg?.phase1Status ?? 'pending';
  const p2 = reg?.phase2Status ?? '';
  const kycStatus = d.kyc?.status ?? '';
  const videoSubmitted = !!d.video?.submitted;
  const p1Paid = isPaid(d.phase1Payment?.status);

  // 1. Registered & Paid
  const paidDone = p1Paid || p1 !== 'pending';
  // 2. Video Trial
  const videoDone = videoSubmitted || ['video_submitted', 'selected', 'rejected'].includes(p1);
  // 3. Phase 1 Results
  const resultDone = p1 === 'selected' || p1 === 'rejected';
  const rejected = p1 === 'rejected';
  const qualified = p1 === 'selected';
  // 4. Phase 2 KYC
  const kycDone = kycStatus === 'verified' || p2 === 'kyc_done' || p2 === 'selected' || p2 === 'rejected';
  // 5. Physical Trial
  const trialDone = !!d.trial?.assessmentSubmitted;
  // 6. Auction Pool
  const auctionDone = p2 === 'selected';

  const stateOf = (done: boolean, prevDone: boolean): StepState =>
    done ? 'done' : prevDone ? 'current' : 'todo';

  const videoStatusLabel = videoSubmitted
    ? t('Submitted', 'सबमिट हो गया')
    : paidDone && !resultDone
      ? t('Upload pending', 'अपलोड बाकी')
      : t('Not started', 'शुरू नहीं');

  const resultLabel = rejected
    ? t('Not qualified', 'क्वालिफ़ाई नहीं')
    : qualified
      ? t('Qualified for Phase 2', 'फेज 2 के लिए क्वालिफ़ाई')
      : videoDone
        ? t('Under evaluation', 'मूल्यांकन में')
        : t('Awaited', 'प्रतीक्षित');

  const kycLabel =
    kycStatus === 'verified'
      ? t('Verified', 'सत्यापित')
      : kycStatus === 'failed'
        ? t('Needs re-submission', 'दोबारा सबमिट करें')
        : kycStatus === 'pending'
          ? t('Under review', 'समीक्षा में')
          : kycDone
            ? t('Done', 'पूरा')
            : qualified
              ? t('Pending', 'बाकी')
              : t('Awaited', 'प्रतीक्षित');

  const trialLabel = d.trial?.assessmentSubmitted
    ? t('Assessment recorded', 'मूल्यांकन दर्ज')
    : d.trial?.checkedInAt
      ? t('Checked in', 'चेक-इन हो गया')
      : d.trial?.venue
        ? t('Venue allocated', 'वेन्यू आवंटित')
        : kycDone
          ? t('Awaiting schedule', 'शेड्यूल प्रतीक्षित')
          : t('Awaited', 'प्रतीक्षित');

  return [
    {
      key: 'registered',
      icon: 'user-check' as const,
      title: t('Registered & Paid', 'रजिस्टर और भुगतान'),
      status: paidDone ? t('Done', 'पूरा') : t('Pending', 'बाकी'),
      state: stateOf(paidDone, true),
      colors: ['#5B2BF0', '#9B2FF0'] as const,
    },
    {
      key: 'video',
      icon: 'video' as const,
      title: t('Video Trial', 'वीडियो ट्रायल'),
      status: videoStatusLabel,
      state: stateOf(videoDone, paidDone),
      colors: ['#9B2FF0', '#FF3DA6'] as const,
    },
    {
      key: 'result',
      icon: 'award' as const,
      title: t('Phase 1 Results', 'फेज 1 परिणाम'),
      status: resultLabel,
      state: rejected ? 'done' : stateOf(resultDone, videoDone),
      colors: ['#FF3DA6', '#FF8A3D'] as const,
    },
    {
      key: 'kyc',
      icon: 'shield' as const,
      title: t('Phase 2 KYC', 'फेज 2 KYC'),
      status: kycLabel,
      state: stateOf(kycDone, qualified),
      colors: ['#00DCF5', '#4B6BFF'] as const,
    },
    {
      key: 'trial',
      icon: 'activity' as const,
      title: t('Physical Trial', 'फिजिकल ट्रायल'),
      status: trialLabel,
      state: stateOf(trialDone, kycDone),
      colors: ['#16E0A3', '#00B8D9'] as const,
    },
    {
      key: 'auction',
      icon: 'target' as const,
      title: t('Auction Pool', 'ऑक्शन पूल'),
      status: auctionDone ? t('In the pool', 'पूल में') : t('Awaited', 'प्रतीक्षित'),
      state: stateOf(auctionDone, trialDone),
      colors: ['#FFC53D', '#FF7A3D'] as const,
    },
  ];
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
            <Text style={{ color: step.state === 'todo' ? c.sub : c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>{step.status}</Text>
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

  const openWeb = (url: string) =>
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));

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
                {t('Register for this season on bcplt20.com', 'इस सीज़न की रजिस्ट्रेशन bcplt20.com पर करें')}
              </Text>
              <Text style={{ color: c.sub, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium', paddingHorizontal: 24 }}>
                {t('Your journey will appear here once registration is complete.', 'रजिस्ट्रेशन पूरी होते ही आपका सफ़र यहाँ दिखेगा।')}
              </Text>
            </Card>
          </View>
        ) : (
          <JourneyBody d={d} openWeb={openWeb} />
        )}
      </ScrollView>
    </View>
  );
}

function JourneyBody({ d, openWeb }: { d: Dashboard; openWeb: (url: string) => void }) {
  const c = useColors();
  const { t } = useLang();
  const steps = buildSteps(d, t);
  const reg = d.registration!;

  const videoSubmitted = !!d.video?.submitted;
  const p1 = reg.phase1Status ?? 'pending';
  const showVideoCta = !videoSubmitted && ['payment_done', 'video_submitted'].includes(p1);
  const deadline = fmtDate(reg.videoDeadline);
  const deadlineExpired = !!reg.deadlineExpired;

  const kycStatus = d.kyc?.status ?? '';
  const p2 = reg.phase2Status ?? '';
  const qualified = p1 === 'selected';
  const showKycCta = qualified && p2 === 'payment_done' && (kycStatus === '' || kycStatus === 'failed');

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

      {/* Step timeline */}
      <View style={{ marginBottom: 8 }}>
        {steps.map((s, i) => (
          <StepChip key={s.key} step={s} isLast={i === steps.length - 1} />
        ))}
      </View>

      {/* Video upload hand-off — native upload is NOT built here (separate task) */}
      {showVideoCta ? (
        <Card style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Feather name="video" size={18} color={c.magenta} />
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>{t('Video Trial', 'वीडियो ट्रायल')}</Text>
          </View>
          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
            {t('Video upload अभी website पर करें', 'Video upload अभी website पर करें')}
          </Text>
          <Text style={{ color: c.sub, fontSize: 13, marginTop: 8, lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
            {t(
              'Record a 30–60 second clip and upload it on bcplt20.com within your 15-day window.',
              '30–60 सेकंड का clip record करके अपनी 15-दिन की window में bcplt20.com पर upload करें।',
            )}
          </Text>
          {deadline ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <Feather name="clock" size={14} color={deadlineExpired ? c.coral : c.amber} />
              <Text style={{ color: deadlineExpired ? c.coral : c.getAccentText(c.amber), fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>
                {deadlineExpired ? t('Upload window closed', 'अपलोड window बंद') : `${t('Upload by', 'अपलोड करें')} ${deadline}`}
              </Text>
            </View>
          ) : null}
          <Pressable onPress={() => openWeb(WEB_VIDEO_UPLOAD)} style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.85 : 1 }]} testID="journey-video-upload">
            <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
            <Feather name="external-link" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }}>{t('Open upload page', 'अपलोड पेज खोलें')}</Text>
          </Pressable>
        </Card>
      ) : null}

      {/* KYC hand-off (website form is authenticated; we link out) */}
      {showKycCta ? (
        <Card style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Feather name="shield" size={18} color={c.cyan} />
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>{t('Phase 2 KYC', 'फेज 2 KYC')}</Text>
          </View>
          <Text style={{ color: c.sub, fontSize: 13, lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
            {kycStatus === 'failed'
              ? t('Your KYC needs to be re-submitted on bcplt20.com.', 'आपका KYC bcplt20.com पर दोबारा सबमिट करना होगा।')
              : t('Complete your Phase 2 KYC on bcplt20.com to continue.', 'आगे बढ़ने के लिए अपना फेज 2 KYC bcplt20.com पर पूरा करें।')}
          </Text>
          <Pressable onPress={() => openWeb(WEB_KYC)} style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.85 : 1 }]} testID="journey-kyc-open">
            <LinearGradient colors={['#00B3FF', '#0077C8']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
            <Feather name="external-link" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }}>{t('Open KYC page', 'KYC पेज खोलें')}</Text>
          </Pressable>
        </Card>
      ) : null}

      {/* KYC status detail (when submitted) */}
      {d.kyc && !showKycCta ? (
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.detailTitle, { color: c.ink }]}>{t('KYC status', 'KYC स्थिति')}</Text>
          <DetailRow label={t('Status', 'स्थिति')} value={
            d.kyc.status === 'verified' ? t('Verified', 'सत्यापित')
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

      {/* Payment receipt info */}
      {d.phase1Payment || d.phase2Payment ? (
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.detailTitle, { color: c.ink }]}>{t('Payments', 'भुगतान')}</Text>
          {d.phase1Payment ? (
            <DetailRow
              label={`${t('Phase 1', 'फेज 1')} · ₹${d.phase1Payment.amount}`}
              value={`${isPaid(d.phase1Payment.status) ? t('Paid', 'भुगतान') : t('Pending', 'बाकी')}${fmtDate(d.phase1Payment.paidAt) ? ` · ${fmtDate(d.phase1Payment.paidAt)}` : ''}`}
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
