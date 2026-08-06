import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { queryClient } from '@/lib/queryClient';
import { ApiError, verifyPhase1Payment, verifyPhase2Payment } from '@/lib/api';
import { ScreenBackground, GlassAppBar, useAppBarHeight } from '@/components/ui';

/**
 * In-app Cashfree checkout.
 *
 * Loads the server-hosted checkout page (runs the v3 SDK) INSIDE a WebView, so
 * the player never leaves the app. The order was created with platform:"app",
 * so Cashfree redirects back to `<API>/api/payment/app-return?orderId=…&phase=…`
 * when done. We intercept that navigation BEFORE it renders (never showing any
 * website), call the matching verify endpoint, and route to the in-app receipt.
 * Failures / cancels / mid-way closes all resolve cleanly to a retry state or
 * back to the pay step — verify is idempotent server-side so there is no risk
 * of a double charge.
 */
type Phase = '1' | '2';
type Screen = 'checkout' | 'verifying' | 'failed';

const RETURN_MARKER = '/api/payment/app-return';

export default function PayWebViewScreen() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const { token } = useAuth();
  const appBarHeight = useAppBarHeight();

  const params = useLocalSearchParams<{ checkoutUrl?: string; orderId?: string; phase?: string }>();
  const checkoutUrl = typeof params.checkoutUrl === 'string' ? params.checkoutUrl : '';
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const phase: Phase = params.phase === '2' ? '2' : '1';

  const [screen, setScreen] = useState<Screen>('checkout');
  const [loading, setLoading] = useState(true);
  const [failMsg, setFailMsg] = useState('');
  const handledRef = useRef(false); // guard: run verify only once

  // Verify the payment, then go to the receipt (success) or show a retry state.
  const runVerify = useCallback(async () => {
    if (handledRef.current) return;
    handledRef.current = true;
    setScreen('verifying');
    if (!token || !orderId) {
      setFailMsg(t('Your session expired. Please try the payment again.', 'आपका सेशन समाप्त हो गया। कृपया भुगतान फिर से करें।'));
      setScreen('failed');
      return;
    }
    try {
      const res = phase === '2'
        ? await verifyPhase2Payment(token, orderId)
        : await verifyPhase1Payment(token, orderId);
      if (res.success) {
        // Status changed server-side — drop any stale dashboard/status cache so
        // every downstream screen (Journey, more, next-step gates) refetches.
        queryClient.invalidateQueries({ queryKey: ['dashboard', token] });
        router.replace({ pathname: '/pay-receipt', params: { phase, orderId } });
        return;
      }
      // Provider says the payment is not SUCCESS (pending/failed/cancelled).
      setFailMsg(t('We could not confirm your payment. If money was debited it will be auto-refunded; you can safely retry.', 'हम आपके भुगतान की पुष्टि नहीं कर पाए। अगर पैसे कटे हैं तो वे अपने-आप वापस आ जाएँगे; आप सुरक्षित रूप से फिर कोशिश कर सकते हैं।'));
      setScreen('failed');
    } catch (e: any) {
      if (e instanceof ApiError && e.code === 'RECONCILIATION_REQUIRED') {
        setFailMsg(t('Payment received but is still being verified by our team. Please check back shortly.', 'भुगतान मिल गया है लेकिन हमारी टीम अभी इसे वेरिफाई कर रही है। कृपया थोड़ी देर बाद देखें।'));
      } else if (e instanceof ApiError && e.status === 400) {
        setFailMsg(t('Payment not completed yet. If you finished paying, tap Retry to confirm; otherwise you can try again.', 'भुगतान अभी पूरा नहीं हुआ। अगर आपने भुगतान कर दिया है तो पुष्टि के लिए Retry दबाएँ; वरना फिर कोशिश करें।'));
      } else {
        setFailMsg(e instanceof ApiError ? e.message : t('Something went wrong confirming your payment. Please retry.', 'भुगतान की पुष्टि में कुछ गड़बड़ हुई। कृपया फिर कोशिश करें।'));
      }
      // Allow re-verify from the failed screen (e.g. transient network error).
      handledRef.current = false;
      setScreen('failed');
    }
  }, [token, orderId, phase, router, t]);

  // Primary interception: catch the return URL before the WebView renders it.
  const onShouldStart = useCallback((req: { url: string }): boolean => {
    if (req.url.includes(RETURN_MARKER)) {
      runVerify();
      return false; // never load the return/website page
    }
    return true;
  }, [runVerify]);

  // Belt-and-braces: some platforms (web) don't fire onShouldStart for the SDK
  // self-redirect — also watch navigation state changes.
  const onNavChange = useCallback((nav: WebViewNavigation) => {
    if (nav.url && nav.url.includes(RETURN_MARKER)) {
      runVerify();
    }
  }, [runVerify]);

  // Fallback signal posted by the app-return page itself.
  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg?.type === 'bcpl_payment_return') runVerify();
    } catch { /* ignore non-JSON messages from the SDK */ }
  }, [runVerify]);

  // Android hardware back: while on the checkout page, going back cancels the
  // payment and returns to the pay step cleanly (no trapped/stuck screen).
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (screen === 'checkout') { router.back(); return true; }
        return false;
      });
      return () => sub.remove();
    }, [screen, router]),
  );

  const cancel = useCallback(() => router.back(), [router]);
  const retry = useCallback(() => router.back(), [router]); // back to pay step to start a fresh order

  const injectedJS = useMemo(
    // Keep the WebView background dark to avoid a white flash before the SDK loads.
    () => "document.documentElement.style.background='#0b0b12';true;",
    [],
  );

  if (!checkoutUrl) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenBackground />
        <GlassAppBar title={t('Payment', 'भुगतान')} back />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight }}>
          <Feather name="alert-triangle" size={28} color={c.coral} />
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 14, textAlign: 'center' }}>
            {t('Payment could not be started', 'भुगतान शुरू नहीं हो पाया')}
          </Text>
          <Pressable onPress={cancel} style={({ pressed }) => [styles.btn, { marginTop: 20, opacity: pressed ? 0.85 : 1 }]}>
            <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
            <Text style={styles.btnText}>{t('Go back', 'वापस जाएँ')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0b12' }}>
      <GlassAppBar title={t('Secure Payment', 'सुरक्षित भुगतान')} back />

      {screen === 'checkout' ? (
        <View style={{ flex: 1, paddingTop: appBarHeight }}>
          <WebView
            source={{ uri: checkoutUrl }}
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={onShouldStart}
            onNavigationStateChange={onNavChange}
            onMessage={onMessage}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            injectedJavaScriptBeforeContentLoaded={injectedJS}
            style={{ flex: 1, backgroundColor: '#0b0b12' }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            testID="pay-webview"
          />
          {loading ? (
            <View style={[StyleSheet.absoluteFill, { top: appBarHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0b12' }]} pointerEvents="none">
              <ActivityIndicator color="#FF3DA6" size="large" />
              <Text style={{ color: '#fff', marginTop: 14, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13.5 }}>
                {t('Loading secure checkout…', 'सुरक्षित चेकआउट लोड हो रहा है…')}
              </Text>
            </View>
          ) : null}
          <Pressable onPress={cancel} style={styles.cancelBar} testID="pay-cancel">
            <Feather name="x" size={15} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>{t('Cancel payment', 'भुगतान रद्द करें')}</Text>
          </Pressable>
        </View>
      ) : screen === 'verifying' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight, backgroundColor: '#0b0b12' }}>
          <ActivityIndicator color="#16E0A3" size="large" />
          <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginTop: 18, textAlign: 'center' }}>
            {t('Confirming your payment…', 'आपके भुगतान की पुष्टि हो रही है…')}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 10, textAlign: 'center', fontFamily: 'PlusJakartaSans_500Medium' }}>
            {t('Please wait — do not close the app.', 'कृपया प्रतीक्षा करें — ऐप बंद न करें।')}
          </Text>
        </View>
      ) : (
        /* failed */
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight, backgroundColor: '#0b0b12' }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,90,110,0.16)', borderWidth: 1, borderColor: 'rgba(255,90,110,0.4)' }}>
            <Feather name="x" size={38} color="#FF5A6E" />
          </View>
          <Text style={{ color: '#FF5A6E', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginTop: 18, textAlign: 'center' }}>
            {t('Payment नहीं हो पाया', 'Payment नहीं हो पाया')}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13.5, marginTop: 12, textAlign: 'center', lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium', maxWidth: 360 }}>
            {failMsg || t('Your payment did not go through. No worries — you can try again.', 'आपका भुगतान पूरा नहीं हुआ। कोई बात नहीं — आप फिर कोशिश कर सकते हैं।')}
          </Text>
          <Pressable onPress={retry} style={({ pressed }) => [styles.btn, { marginTop: 24, opacity: pressed ? 0.85 : 1 }]} testID="pay-retry">
            <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.btnText}>{t('Retry payment', 'फिर से भुगतान करें')}</Text>
          </Pressable>
          <Pressable onPress={cancel} style={{ marginTop: 16 }} testID="pay-goback">
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13.5, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Go back', 'वापस जाएँ')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 28, overflow: 'hidden',
  },
  btnText: { color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 },
  cancelBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, backgroundColor: 'rgba(11,11,18,0.92)',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.12)',
  },
});
