import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getTrialPass, ApiError } from '@/lib/api';
import {
  Card,
  ErrorView,
  LoadingView,
  ScreenBackground,
  GlassAppBar,
  useAppBarHeight,
} from '@/components/ui';

/**
 * TRIAL PASS — the player's digital pass (QR) for the Phase 2 physical trial.
 * Mirrors the website's TrialPass page: QR at the gate, venue/slot details,
 * checked-in / assessed states. Data from GET /api/user/trial-pass.
 */

function DetailRow({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }}>
      <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12.5 }}>{label}</Text>
      <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

export default function TrialPassScreen() {
  const c = useColors();
  const { t } = useLang();
  const { token, ready } = useAuth();
  const appBarHeight = useAppBarHeight();

  const q = useQuery({
    queryKey: ['trial-pass', token],
    queryFn: () => getTrialPass(token as string),
    enabled: !!token,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  });

  const refetch = q.refetch;
  useFocusEffect(
    useCallback(() => {
      if (token) refetch();
    }, [token, refetch]),
  );

  const Header = (
    <>
      <ScreenBackground />
      <GlassAppBar title={t('Trial Pass', 'ट्रायल पास')} back={true} />
    </>
  );

  if (!ready) return <LoadingView />;

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight }}>
          <Feather name="lock" size={28} color={c.magenta} />
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
            {t('Log in to see your trial pass', 'अपना ट्रायल पास देखने के लिए लॉगिन करें')}
          </Text>
        </View>
      </View>
    );
  }

  if (q.isLoading) return (<View style={{ flex: 1, backgroundColor: c.bg }}>{Header}<LoadingView /></View>);

  // 404 = pass not allocated yet
  if (q.isError) {
    const notReady = q.error instanceof ApiError && q.error.status === 404;
    if (!notReady) return (<View style={{ flex: 1, backgroundColor: c.bg }}>{Header}<ErrorView onRetry={() => q.refetch()} /></View>);
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: appBarHeight + 40, alignItems: 'center' }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <LinearGradient colors={['#7C5CFF', '#FF3DA6']} style={StyleSheet.absoluteFill} />
            <Feather name="credit-card" size={34} color="#fff" />
          </View>
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginTop: 18, textAlign: 'center' }}>
            {t('Trial pass not ready yet', 'ट्रायल पास अभी तैयार नहीं है')}
          </Text>
          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13.5, marginTop: 10, textAlign: 'center', lineHeight: 20 }}>
            {t('Your pass appears here once your trial slot is allocated. You will also get an SMS and email.', 'आपका स्लॉट allocate होते ही पास यहाँ दिखेगा। SMS और ईमेल से भी सूचना मिलेगी।')}
          </Text>
        </ScrollView>
      </View>
    );
  }

  const d = q.data!;
  const checkedIn = !!d.checkedInAt;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 12, paddingBottom: 40 }}>
        {/* Status strip */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: c.card2, borderColor: c.line, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12 }}>
          <Feather name={d.assessmentSubmitted ? 'check-circle' : checkedIn ? 'map-pin' : 'credit-card'} size={13} color={c.getAccentText(c.cyan)} />
          <Text style={{ color: c.getAccentText(c.cyan), fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11.5, letterSpacing: 0.4 }}>
            {d.assessmentSubmitted
              ? t('Assessment recorded', 'असेसमेंट रिकॉर्ड हो गया')
              : checkedIn
                ? t('Checked in at venue', 'वेन्यू पर चेक-इन हो गया')
                : t('PHASE 2 · PHYSICAL TRIAL', 'फेज 2 · फिजिकल ट्रायल')}
          </Text>
        </View>

        {/* Pass card */}
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <LinearGradient colors={['#4316D8', '#8A2BE8', '#E03398']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18 }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, letterSpacing: 1 }}>
              {t('OFFICIAL TRIAL PASS', 'आधिकारिक ट्रायल पास')}
            </Text>
            <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginTop: 6 }}>{d.player.name}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, marginTop: 2 }}>
              {[d.player.regNumber, d.player.city].filter(Boolean).join(' · ')}
            </Text>
          </LinearGradient>

          {/* QR */}
          <View style={{ alignItems: 'center', paddingVertical: 22 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, opacity: d.assessmentSubmitted ? 0.55 : 1, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
              <Image source={{ uri: d.qrDataUrl }} style={{ width: 190, height: 190 }} contentFit="contain" />
            </View>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12.5, marginTop: 12, textAlign: 'center' }}>
              {d.assessmentSubmitted
                ? t('Check-in complete — QR no longer needed', 'चेक-इन पूरा — अब QR की ज़रूरत नहीं')
                : t('Show this QR at the venue gate', 'गेट पर यह QR दिखाएँ')}
            </Text>
          </View>
        </Card>

        {/* Venue & slot details */}
        {d.venue || d.slot ? (
          <Card style={{ marginTop: 14 }}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, marginBottom: 6 }}>
              {t('Venue & reporting', 'वेन्यू और रिपोर्टिंग')}
            </Text>
            {d.venue ? <DetailRow label={t('Venue', 'वेन्यू')} value={d.venue.name} /> : null}
            {d.venue?.city ? <DetailRow label={t('City', 'शहर')} value={d.venue.city} /> : null}
            {d.venue?.address ? <DetailRow label={t('Address', 'पता')} value={d.venue.address} /> : null}
            {d.slot?.date ? <DetailRow label={t('Date', 'तारीख')} value={d.slot.date} /> : null}
            {d.slot?.reportingTime ? <DetailRow label={t('Reporting time', 'रिपोर्टिंग समय')} value={d.slot.reportingTime} /> : null}
            {d.slot?.batch ? <DetailRow label={t('Batch', 'बैच')} value={d.slot.batch} /> : null}
          </Card>
        ) : null}

        {/* What to carry */}
        <Card style={{ marginTop: 14 }}>
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, marginBottom: 8 }}>
            {t('Carry with you', 'साथ लाएँ')}
          </Text>
          {[
            t('This Trial Pass (QR) on your phone', 'फोन पर यह ट्रायल पास (QR)'),
            t('Original Aadhaar card', 'Original आधार कार्ड'),
            t('Your cricket kit', 'अपनी क्रिकेट किट'),
          ].map((line, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 }}>
              <Feather name="check" size={14} color={c.getAccentText(c.cyan)} />
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>{line}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
