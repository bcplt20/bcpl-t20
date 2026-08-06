import React, { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import {
  ApiError,
  createPhase2Payment,
  getDashboard,
} from '@/lib/api';
import {
  Card,
  ErrorView,
  LoadingView,
  ScreenBackground,
  GlassAppBar,
  useAppBarHeight,
} from '@/components/ui';

// Keep in sync with website legalMeta.tsx CONSENT_VERSIONS.phase2Declarations
const P2_DECL_VERSION = '2.1';

const P2_DECL: { en: string; hi: string }[] = [
  {
    en: 'I confirm I meet the working-professional eligibility requirement, and that I have not played first-class cricket, IPL, or international cricket professionally (I meet the applicable cricket participation/gap requirement).',
    hi: 'मैं पुष्टि करता हूं कि मैं working-professional eligibility की शर्त पूरी करता हूं, और मैंने प्रथम श्रेणी क्रिकेट, आईपीएल या अंतरराष्ट्रीय क्रिकेट पेशेवर रूप से नहीं खेला है (मैं लागू cricket participation/gap शर्त पूरी करता हूं)।',
  },
  {
    en: 'I understand the Phase 2 fee is charged for participation in the Phase 2 physical trial, and I understand the physical-trial terms, the Player Auction process and the two-phase selection system.',
    hi: 'मैं समझता हूं कि Phase 2 fee, Phase 2 physical trial में participation के लिए ली जाती है, और मैं physical-trial की शर्तों, Player Auction प्रक्रिया और दो-चरणीय चयन प्रणाली को समझता हूं।',
  },
  {
    en: 'I agree to abide by the BCPL Code of Conduct throughout Season 5.',
    hi: 'मैं सीजन 5 के दौरान BCPL आचार संहिता का पालन करने के लिए सहमत हूं।',
  },
  {
    en: 'I understand that payment of the Phase 2 fee does not guarantee Final Selection, Auction Pool entry, Player Auction purchase, Team Purchase, a player contract, remuneration or Tournament Participation, and I accept the Phase 2 fee policy in the Refund & Cancellation Policy.',
    hi: 'मैं समझता हूं कि Phase 2 fee का भुगतान Final Selection, Auction Pool में प्रवेश, Player Auction में purchase, Team Purchase, player contract, remuneration या Tournament Participation की गारंटी नहीं देता, और मैं Refund & Cancellation Policy में दी गई Phase 2 fee policy स्वीकार करता हूं।',
  },
];

const ORDER_KEY = 'bcpl_pending_phase2_order_v1';

type LoadState = 'loading' | 'ok' | 'not_eligible' | 'already_paid' | 'error';

export default function Phase2PayScreen() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const { token, ready } = useAuth();
  const appBarHeight = useAppBarHeight();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [regId, setRegId] = useState('');
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const dq = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  // On focus (e.g. returning from the payment WebView / receipt): refetch so a
  // just-paid user immediately sees the "Phase 2 fee paid" state, never the pay
  // button again.
  useFocusEffect(
    useCallback(() => {
      if (token) dq.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]),
  );

  useEffect(() => {
    if (!dq.data) return;
    const d = dq.data;
    const reg = d.registration;
    if (!d.registered || !reg || reg.phase1Status !== 'selected') { setLoadState('not_eligible'); return; }
    if (reg.phase2Status && !['pending', 'payment_pending'].includes(reg.phase2Status)) {
      setLoadState('already_paid'); return;
    }
    setRegId(reg.id);
    setLoadState('ok');
  }, [dq.data]);

  const canProceed = checks.every(Boolean);

  // Create the Phase-2 order, then open the IN-APP checkout WebView. The
  // WebView intercepts the return URL, verifies, and routes to the in-app
  // receipt (which sends the player on to KYC). No external browser is used.
  const onPay = useCallback(async () => {
    setError('');
    if (!canProceed) { setError(t('Please confirm all declarations to continue.', 'जारी रखने के लिए कृपया सभी घोषणाओं की पुष्टि करें।')); return; }
    if (!token || !regId) return;
    setBusy(true);
    try {
      const pay = await createPhase2Payment(token, regId, {
        version: P2_DECL_VERSION,
        items: P2_DECL.map((d) => d.en),
      });
      await AsyncStorage.setItem(ORDER_KEY, pay.orderId).catch(() => {});
      if (!pay.checkoutUrl) {
        setError(t('Could not start payment — please update the app and try again', 'पेमेंट शुरू नहीं हो पाई — कृपया ऐप अपडेट करके फिर कोशिश करें'));
        return;
      }
      router.push({ pathname: '/pay-webview', params: { checkoutUrl: pay.checkoutUrl, orderId: pay.orderId, phase: '2' } });
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : t('Could not start payment', 'पेमेंट शुरू नहीं हो पाई'));
    } finally { setBusy(false); }
  }, [canProceed, token, regId, t, router]);

  if (!ready) return <LoadingView />;

  const Header = (
    <>
      <ScreenBackground />
      <GlassAppBar title={t('Phase 2', 'फेज 2')} back={true} />
    </>
  );

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight }}>
          <Feather name="lock" size={28} color={c.magenta} />
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
            {t('Log in to continue to Phase 2', 'फेज 2 के लिए लॉगिन करें')}
          </Text>
        </View>
      </View>
    );
  }
  if (loadState === 'loading' || dq.isLoading) return (<View style={{ flex: 1, backgroundColor: c.bg }}>{Header}<LoadingView /></View>);
  if (dq.isError && !dq.data) return (<View style={{ flex: 1, backgroundColor: c.bg }}>{Header}<ErrorView onRetry={() => dq.refetch()} /></View>);

  if (loadState === 'already_paid') return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <LinearGradient colors={['#16E0A3', '#00B8D9']} style={StyleSheet.absoluteFill} />
          <Feather name="check" size={40} color="#fff" />
        </View>
        <Text style={{ color: c.mint, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginTop: 16, textAlign: 'center' }}>
          {t('Phase 2 fee paid', 'फेज 2 फीस भर दी गई')}
        </Text>
        <Text style={{ color: c.sub, fontSize: 13.5, marginTop: 10, textAlign: 'center', lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium', maxWidth: 340 }}>
          {t('Next, complete your KYC to be cleared for the physical trials.', 'आगे, फिजिकल ट्रायल के लिए क्लियर होने हेतु अपना KYC पूरा करें।')}
        </Text>
        <Pressable onPress={() => router.replace('/kyc')} style={({ pressed }) => [styles.btn, { marginTop: 22, opacity: pressed ? 0.85 : 1 }]}>
          <LinearGradient colors={['#00DCF5', '#4B6BFF']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
          <Text style={styles.btnText}>{t('Start KYC', 'KYC शुरू करें')}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/journey')} style={{ marginTop: 16 }}>
          <Text style={{ color: c.sub, fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Back to my journey', 'मेरे सफ़र पर वापस')}</Text>
        </Pressable>
      </View>
    </View>
  );
  if (loadState === 'not_eligible' || loadState === 'error') return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight }}>
        <Feather name="lock" size={40} color={c.amber} />
        <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginTop: 16, textAlign: 'center' }}>
          {t('Phase 2 not available yet', 'फेज 2 अभी उपलब्ध नहीं')}
        </Text>
        <Text style={{ color: c.sub, fontSize: 13.5, marginTop: 10, textAlign: 'center', lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium', maxWidth: 340 }}>
          {t('You can pay the Phase 2 fee once you are selected in Phase 1.', 'फेज 1 में चयन होने के बाद आप फेज 2 फीस भर सकते हैं।')}
        </Text>
        <Pressable onPress={() => router.replace('/journey')} style={({ pressed }) => [styles.btn, { marginTop: 22, opacity: pressed ? 0.85 : 1 }]}>
          <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
          <Text style={styles.btnText}>{t('Back to my journey', 'मेरे सफ़र पर वापस')}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 8, paddingBottom: 60 }}>
        <LinearGradient colors={['#5B2BF0', '#9B2FF0', '#FF3DA6']} style={{ width: 48, height: 4, borderRadius: 2, marginBottom: 12 }} />
        <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 28, color: c.ink, letterSpacing: -0.5 }}>
          {t('Advance to Phase 2', 'फेज 2 के लिए आगे बढ़ें')}
        </Text>
        <Text style={{ color: c.sub, fontSize: 14, marginTop: 6, lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' }}>
          {t('Confirm the declarations below to proceed to Phase 2 payment. Employment & emergency details will be collected during KYC.', 'फेज 2 पेमेंट के लिए आगे बढ़ने से पहले नीचे दी गई घोषणाओं की पुष्टि करें। रोज़गार और आपातकालीन जानकारी KYC के दौरान ली जाएगी।')}
        </Text>

        <Card style={{ marginTop: 22 }}>
          {P2_DECL.map((d, i) => {
            const on = checks[i];
            return (
              <Pressable
                key={i}
                onPress={() => setChecks((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth, borderTopColor: c.line }}
              >
                <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: on ? c.magenta : c.sub, backgroundColor: on ? c.magenta : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  {on ? <Feather name="check" size={14} color="#fff" /> : null}
                </View>
                <Text style={{ color: c.ink, fontSize: 12.5, lineHeight: 19, fontFamily: 'PlusJakartaSans_500Medium', flex: 1 }}>{t(d.en, d.hi)}</Text>
              </Pressable>
            );
          })}
        </Card>

        {canProceed ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <Feather name="check-circle" size={15} color={c.mint} />
            <Text style={{ color: c.mint, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
              {t('All declarations confirmed. You may proceed.', 'सभी घोषणाओं की पुष्टि हो गई है। आप आगे बढ़ सकते हैं।')}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 14, borderRadius: 14, borderWidth: 1, backgroundColor: 'rgba(255,90,110,0.1)', borderColor: 'rgba(255,90,110,0.3)' }}>
            <Feather name="alert-triangle" size={14} color={c.coral} />
            <Text style={{ color: c.coral, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', flex: 1 }}>{error}</Text>
          </View>
        ) : null}

        <Pressable onPress={onPay} disabled={!canProceed || busy} style={({ pressed }) => [styles.btn, { marginTop: 20, opacity: !canProceed || busy ? 0.45 : pressed ? 0.85 : 1 }]} testID="phase2-pay">
          <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
          <Text style={styles.btnText}>{busy ? t('Starting payment…', 'पेमेंट शुरू हो रही है…') : t('Proceed to Phase 2 payment', 'फेज 2 पेमेंट के लिए आगे बढ़ें')}</Text>
        </Pressable>
        <Text style={{ color: c.sub, fontSize: 12, marginTop: 14, textAlign: 'center', fontFamily: 'PlusJakartaSans_500Medium', lineHeight: 18 }}>
          {t('Payment opens securely inside the app.', 'भुगतान ऐप के अंदर ही सुरक्षित रूप से खुलेगा।')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, overflow: 'hidden',
  },
  btnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, borderWidth: 1.5,
  },
  btnText: { color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 },
});
