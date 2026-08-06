import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getDashboard } from '@/lib/api';
import { Card, LoadingView, ScreenBackground, GlassAppBar, useAppBarHeight } from '@/components/ui';

/**
 * In-app payment receipt shown after a successful phase1 / phase2 payment,
 * verified in the WebView. Pulls the authoritative amount / reg number / date
 * from the (freshly-invalidated) dashboard and shows the clear next step:
 *   phase 1 → Upload trial video
 *   phase 2 → Complete KYC
 */
function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PayReceiptScreen() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const { token } = useAuth();
  const appBarHeight = useAppBarHeight();

  const params = useLocalSearchParams<{ phase?: string; orderId?: string }>();
  const phase = params.phase === '2' ? '2' : '1';
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  const dq = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  const d = dq.data;
  const pay = phase === '2' ? d?.phase2Payment : d?.phase1Payment;
  const regNumber = d?.registration?.regNumber ?? '—';
  const amount = pay?.amount;
  const paidAt = pay?.paidAt;

  const isP2 = phase === '2';
  const nextLabel = isP2 ? t('Complete KYC', 'KYC पूरा करें') : t('Upload trial video', 'ट्रायल वीडियो अपलोड करें');
  const nextRoute = isP2 ? '/kyc' : '/upload-video';
  const nextIcon: keyof typeof Feather.glyphMap = isP2 ? 'shield' : 'upload';
  const feeLabel = isP2 ? t('Phase 2 trial fee', 'फेज 2 ट्रायल फीस') : t('Phase 1 registration fee', 'फेज 1 रजिस्ट्रेशन फीस');

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('Payment Receipt', 'भुगतान रसीद')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 8, paddingBottom: 48 }}>
        {/* Success hero */}
        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <LinearGradient colors={['#16E0A3', '#00B8D9']} style={StyleSheet.absoluteFill} />
            <Feather name="check" size={46} color="#fff" />
          </View>
          <Text style={{ color: c.mint, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 26, marginTop: 18, textAlign: 'center', letterSpacing: -0.5 }}>
            {t('Payment successful!', 'भुगतान सफल!')}
          </Text>
          <Text style={{ color: c.sub, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium', maxWidth: 340 }}>
            {isP2
              ? t('Your Phase 2 trial fee is confirmed. One last step to lock your slot.', 'आपकी फेज 2 ट्रायल फीस पक्की हो गई। स्लॉट पक्का करने के लिए एक आख़िरी कदम।')
              : t('You are registered for BCPL Season 5. Next, upload your trial video.', 'आप BCPL सीज़न 5 के लिए रजिस्टर्ड हैं। आगे, अपना ट्रायल वीडियो अपलोड करें।')}
          </Text>
        </View>

        {dq.isLoading ? (
          <LoadingView />
        ) : (
          <Card style={{ marginTop: 20 }}>
            <ReceiptRow c={c} label={t('Registration No.', 'रजिस्ट्रेशन नंबर')} value={regNumber} highlight />
            <ReceiptRow c={c} label={feeLabel} value={amount != null ? `₹${amount}` : '—'} />
            <ReceiptRow c={c} label={t('Transaction ID', 'ट्रांज़ैक्शन आईडी')} value={orderId || '—'} mono />
            <ReceiptRow c={c} label={t('Paid on', 'भुगतान तिथि')} value={fmtDate(paidAt)} />
            <ReceiptRow c={c} label={t('Status', 'स्थिति')} value={t('SUCCESS', 'सफल')} statusOk last />
          </Card>
        )}

        {/* Next step */}
        <Pressable onPress={() => router.replace(nextRoute as any)} style={({ pressed }) => [styles.btn, { marginTop: 22, opacity: pressed ? 0.85 : 1 }]} testID="receipt-next">
          <LinearGradient colors={isP2 ? ['#00DCF5', '#4B6BFF'] : ['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
          <Feather name={nextIcon} size={17} color="#fff" />
          <Text style={styles.btnText}>{nextLabel}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/journey')} style={{ marginTop: 16, alignItems: 'center' }} testID="receipt-journey">
          <Text style={{ color: c.sub, fontSize: 13.5, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('View my journey', 'मेरा सफ़र देखें')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ReceiptRow({ c, label, value, highlight, mono, statusOk, last }: {
  c: ReturnType<typeof useColors>; label: string; value: string;
  highlight?: boolean; mono?: boolean; statusOk?: boolean; last?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.line }}>
      <Text style={{ color: c.sub, fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{label}</Text>
      <Text
        numberOfLines={1}
        style={{
          color: statusOk ? c.mint : highlight ? c.cyan : c.ink,
          fontSize: highlight ? 16 : mono ? 12 : 13.5,
          fontFamily: highlight ? 'BricolageGrotesque_800ExtraBold' : 'PlusJakartaSans_700Bold',
          flexShrink: 1, textAlign: 'right',
        }}
      >{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, overflow: 'hidden',
  },
  btnText: { color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 },
});
