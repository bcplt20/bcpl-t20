import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import {
  ApiError,
  createPhase1Payment,
  getRegisterStatus,
  registerPhase1,
  sendOtp,
  verifyOtp,
  type PlayerRole,
} from '@/lib/api';
import { Card, ScreenBackground, GlassAppBar, useAppBarHeight } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi', 'Indore', 'Nagpur', 'Bhopal', 'Patna',
  'Surat', 'Vadodara', 'Noida', 'Gurugram', 'Agra',
];

// Keep in sync with website legalMeta.tsx CONSENT_VERSIONS
const CONSENT = { termsVersion: '2.1', privacyVersion: '2.1' };

const ROLES: { id: PlayerRole; en: string; hi: string; fee: number }[] = [
  { id: 'bat', en: 'Batsman', hi: 'बल्लेबाज़', fee: 299 },
  { id: 'bowl', en: 'Bowler', hi: 'गेंदबाज़', fee: 299 },
  { id: 'wk', en: 'Wicketkeeper', hi: 'विकेटकीपर', fee: 299 },
  { id: 'ar', en: 'All-Rounder', hi: 'ऑलराउंडर', fee: 399 },
];

type Step = 'account' | 'otp' | 'details' | 'pay' | 'done';

// Server phase1Status vocabulary: 'pending' = registered but unpaid;
// 'payment_done' and later stages mean the fee is already paid.
const isUnpaidStatus = (s?: string | null) => !s || s === 'pending';

const ORDER_KEY = 'bcpl_pending_phase1_order_v1';

import { RegistrationHero, StepProgressBar } from '@/components/RegistrationVisuals';

export default function RegisterScreen() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const { token, user, login } = useAuth();
  const appBarHeight = useAppBarHeight();

  const [step, setStep] = useState<Step>(token ? 'details' : 'account');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // account step
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone?.replace(/^\+?91/, '') ?? '');
  const [otp, setOtp] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'register' | 'login'>('register');

  // details step
  const [role, setRole] = useState<PlayerRole | null>(null);
  const [city, setCity] = useState('');
  const [dob, setDob] = useState(''); // YYYY-MM-DD

  // pay step
  const [registrationId, setRegistrationId] = useState('');
  const [fee, setFee] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [regNumber, setRegNumber] = useState('');
  // phase1Status at the time the done step was reached — legacy carryover users
  // ('selected') should be routed to Journey/Phase 2, not the video upload screen.
  const [doneStatus, setDoneStatus] = useState<string>('payment_done');

  const grossFee = useMemo(() => Math.round(fee * 1.18), [fee]);

  // Sync with the server's registration status. Resume rules (owner-mandated):
  //  • a returning registered-but-UNPAID user lands DIRECTLY on the pay step —
  //    role/city/dob are NEVER re-asked.
  //  • a PAID user lands on the done step (back can never resurface pay).
  // `keepManualStep` lets an in-progress account/otp/details user keep their
  // step (and typed details) — we only auto-jump when the server proves they
  // are already registered.
  const syncStatus = useCallback(async (opts?: { allowJumpFromEarly?: boolean }) => {
    if (!token) return;
    try {
      const st = await getRegisterStatus(token);
      if (!st.registered || !st.registrationId) return;
      setRegistrationId(st.registrationId);
      if (isUnpaidStatus(st.phase1Status)) {
        setFee(st.fees?.phase1 ?? 299);
        // Only pull an early-step user forward to pay on the very first sync;
        // do not yank them backwards from done→pay on a later refetch.
        setStep((prev) => (prev === 'done' ? prev : (opts?.allowJumpFromEarly || prev === 'pay' ? 'pay' : prev)));
      } else {
        // Paid (or legacy carryover) — land on done and forget any stale order.
        setRegNumber(st.regNumber ?? '');
        setDoneStatus(st.phase1Status || 'payment_done');
        setStep('done');
        AsyncStorage.removeItem(ORDER_KEY).catch(() => {});
      }
    } catch {
      // best-effort — user can proceed through the normal steps
    }
  }, [token]);

  // On mount: recover any registered state (incl. after an app relaunch during
  // checkout). Jump an early-step logged-in user straight to their real step.
  useEffect(() => {
    if (!token) return;
    syncStatus({ allowJumpFromEarly: true });
  }, [token, syncStatus]);

  // On focus (e.g. returning from the payment WebView / receipt): re-check
  // status so a just-paid user can never see the pay button again.
  useFocusEffect(
    useCallback(() => {
      if (token) syncStatus();
    }, [token, syncStatus]),
  );

  const fail = (e: unknown, fallback: string) =>
    setError(e instanceof Error ? e.message : fallback);

  /* ── step 1: account / OTP ── */
  const onSendOtp = async () => {
    setError(''); setInfo('');
    if (!/^\d{10}$/.test(phone)) return setError(t('Enter a 10-digit mobile number', '10 अंकों का मोबाइल नंबर डालें'));
    if (name.trim().length < 3) return setError(t('Enter your full name', 'अपना पूरा नाम डालें'));
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t('Enter a valid email', 'सही ईमेल डालें'));
    setBusy(true);
    try {
      const r = await sendOtp(phone, 'register');
      setOtpPurpose('register');
      setInfo(r.devOtp ? `Dev OTP: ${r.devOtp}` : t('OTP has been sent to your number', 'OTP आपके नंबर पर भेज दिया गया है'));
      setStep('otp');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // account already exists — fall back to login OTP
        try {
          const r2 = await sendOtp(phone, 'login');
          setOtpPurpose('login');
          setInfo(r2.devOtp ? `Dev OTP: ${r2.devOtp}` : t('You already have an account — OTP sent for login', 'आपका अकाउंट पहले से है — लॉगिन OTP भेजा गया है'));
          setStep('otp');
        } catch (e2) {
          fail(e2, t('Could not send OTP', 'OTP भेजने में दिक्कत हुई'));
        }
      } else {
        fail(e, t('Could not send OTP', 'OTP भेजने में दिक्कत हुई'));
      }
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtp = async () => {
    setError('');
    if (!otp.trim()) return setError(t('Enter the OTP', 'OTP डालें'));
    setBusy(true);
    try {
      const r = await verifyOtp(phone, otp.trim(), {
        purpose: otpPurpose,
        name: name.trim(),
        email: email.trim(),
      });
      await login(r.token, r.user);
      // If they already registered, jump straight to the right step
      try {
        const st = await getRegisterStatus(r.token);
        if (st.registered && st.registrationId) {
          setRegistrationId(st.registrationId);
          if (isUnpaidStatus(st.phase1Status)) {
            setFee(st.fees?.phase1 ?? (st.role === 'ar' ? 399 : 299));
            setStep('pay');
          } else {
            setRegNumber(st.regNumber ?? '');
            setDoneStatus(st.phase1Status || 'payment_done');
            setStep('done');
          }
          return;
        }
      } catch {
        // status check is best-effort
      }
      setStep('details');
    } catch (e) {
      fail(e, t('Incorrect OTP, please try again', 'OTP गलत है, फिर कोशिश करें'));
    } finally {
      setBusy(false);
    }
  };

  /* ── step 2: details ── */
  const onSubmitDetails = async () => {
    setError('');
    if (!role) return setError(t('Choose your playing role', 'अपना रोल चुनें'));
    if (!city) return setError(t('Choose your trial city', 'ट्रायल शहर चुनें'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return setError(t('Enter date of birth as YYYY-MM-DD', 'जन्मतिथि YYYY-MM-DD में डालें'));
    if (!token) return setStep('account');
    setBusy(true);
    try {
      const r = await registerPhase1(token, { role, trialCity: city, dob });
      setRegistrationId(r.registrationId);
      setFee(r.phase1Fee);
      setStep('pay');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        try {
          const st = await getRegisterStatus(token);
          if (st.registered && st.registrationId) {
            setRegistrationId(st.registrationId);
            if (isUnpaidStatus(st.phase1Status)) {
              setFee(st.fees?.phase1 ?? 299);
              setStep('pay');
            } else {
              setRegNumber(st.regNumber ?? '');
              setDoneStatus(st.phase1Status || 'payment_done');
              setStep('done');
            }
            return;
          }
        } catch { /* fall through */ }
      }
      if (e instanceof ApiError && e.code === 'AGE_INELIGIBLE') {
        setError(t('Age must be between 18 and 45 for BCPL trials', 'BCPL ट्रायल के लिए उम्र 18 से 45 के बीच होनी चाहिए'));
      } else {
        fail(e, t('Registration failed, please try again', 'रजिस्ट्रेशन में दिक्कत हुई, फिर कोशिश करें'));
      }
    } finally {
      setBusy(false);
    }
  };

  /* ── step 3: payment ── */
  // Creates the Cashfree order, then opens the IN-APP checkout WebView. The
  // WebView intercepts the return URL, verifies the payment, and routes to the
  // in-app receipt (which sends the player on to the video-upload step). No
  // external browser / website is ever involved.
  const onPay = async () => {
    setError('');
    if (!agreed) return setError(t('Please accept the Terms & Privacy Policy', 'कृपया नियम व प्राइवेसी पॉलिसी स्वीकार करें'));
    if (!token || !registrationId) return;
    setBusy(true);
    try {
      const pay = await createPhase1Payment(token, registrationId, {
        ...CONSENT,
        marketingOptIn,
      });
      // Persist the order so a relaunch mid-checkout can still resolve status.
      await AsyncStorage.setItem(ORDER_KEY, pay.orderId).catch(() => {});
      if (!pay.checkoutUrl) {
        return setError(t('Could not start payment — please update the app and try again', 'पेमेंट शुरू नहीं हो पाई — कृपया ऐप अपडेट करके फिर कोशिश करें'));
      }
      router.push({ pathname: '/pay-webview', params: { checkoutUrl: pay.checkoutUrl, orderId: pay.orderId, phase: '1' } });
    } catch (e) {
      fail(e, t('Could not start payment', 'पेमेंट शुरू नहीं हो पाई'));
    } finally {
      setBusy(false);
    }
  };

  /* ── UI helpers ── */
  const input = (props: {
    value: string; onChange: (v: string) => void; placeholder: string;
    keyboard?: 'default' | 'number-pad' | 'email-address'; maxLength?: number;
  }) => (
    <View style={[styles.inputWrap, { borderColor: c.line, backgroundColor: c.card2 }]}>
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        placeholderTextColor={c.sub}
        keyboardType={props.keyboard ?? 'default'}
        maxLength={props.maxLength}
        autoCapitalize="none"
        style={[styles.input, { color: c.ink }]}
      />
    </View>
  );

  const primaryBtn = (label: string, onPress: () => void, testID: string) => (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.btn, { opacity: busy || pressed ? 0.7 : 1 }]}
      testID={testID}
    >
      <LinearGradient
        colors={['#FF1A75', '#D10056']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      {busy ? <ActivityIndicator color="#fff" /> : (
        <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, letterSpacing: 0.5 }}>{label}</Text>
      )}
    </Pressable>
  );

  const stepTitle: Record<Step, string> = {
    account: t('Create your account', 'अपना अकाउंट बनाएँ'),
    otp: t('Enter OTP', 'OTP डालें'),
    details: t('Playing details', 'खेल की जानकारी'),
    pay: t('Phase 1 fee', 'फेज़ 1 फ़ीस'),
    done: t('Registration complete!', 'रजिस्ट्रेशन पूरी!'),
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title="Register" back={true} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: appBarHeight, paddingBottom: Platform.OS === 'web' ? 60 : 40 }}
        keyboardShouldPersistTaps="handled"
      >
      <StepProgressBar step={step} />
      <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 28, letterSpacing: -0.5 }}>{stepTitle[step]}</Text>
      <Text style={{ color: c.sub, fontSize: 15, marginTop: 8, marginBottom: 24, fontFamily: 'PlusJakartaSans_500Medium' }}>
        {t('BCPL Season 5 — Phase 1 registration', 'BCPL सीज़न 5 — फेज़ 1 रजिस्ट्रेशन')}
      </Text>

      {error ? (
        <View style={styles.alertBox}>
          <Feather name="alert-circle" size={18} color={c.coral} />
          <Text style={{ color: c.coral, fontSize: 14, flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{error}</Text>
        </View>
      ) : null}
      
      {info ? (
        <View style={[styles.alertBox, { backgroundColor: 'rgba(49, 197, 107, 0.15)' }]}>
          <Feather name="check-circle" size={18} color={c.mint} />
          <Text style={{ color: c.mint, fontSize: 14, flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{info}</Text>
        </View>
      ) : null}

      {step === 'account' ? (
        <View style={{ gap: 16 }}>
        <RegistrationHero />
        <Card>
          {input({ value: name, onChange: setName, placeholder: t('Full name', 'पूरा नाम') })}
          {input({ value: email, onChange: setEmail, placeholder: t('Email', 'ईमेल'), keyboard: 'email-address' })}
          {input({ value: phone, onChange: (v) => setPhone(v.replace(/\D/g, '')), placeholder: t('Mobile number (10 digits)', 'मोबाइल नंबर (10 अंक)'), keyboard: 'number-pad', maxLength: 10 })}
          <View style={{ marginTop: 16 }}>
            {primaryBtn(t('Send OTP', 'OTP भेजें'), onSendOtp, 'reg-send-otp')}
          </View>
        </Card>
        </View>
      ) : null}

      {step === 'otp' ? (
        <Card>
          <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,26,117,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: 'rgba(255,26,117,0.3)' }}>
              <Feather name="mail" size={28} color={c.magenta} />
            </View>
            <Text style={{ color: c.ink, fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center' }}>
              {t(`OTP sent to +91 ${phone}`, `+91 ${phone} पर OTP भेजा गया`)}
            </Text>
          </View>
          {input({ value: otp, onChange: (v) => setOtp(v.replace(/\D/g, '')), placeholder: 'Enter OTP', keyboard: 'number-pad', maxLength: 6 })}
          <View style={{ marginTop: 16 }}>
            {primaryBtn(t('Verify & continue', 'वेरिफ़ाई करें'), onVerifyOtp, 'reg-verify-otp')}
          </View>
          <Pressable onPress={() => { setStep('account'); setOtp(''); }} style={{ marginTop: 24, alignSelf: 'center', padding: 8 }}>
            <Text style={{ color: c.cyan, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Change details', 'जानकारी बदलें')}</Text>
          </Pressable>
        </Card>
      ) : null}

      {step === 'details' ? (
        <View style={{ gap: 20 }}>
          <Card>
            <Text style={[styles.label, { color: c.ink }]}>{t('Your playing role', 'आपका रोल')}</Text>
            <View style={styles.chipWrap}>
              {ROLES.map((r) => {
                const isActive = role === r.id;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => setRole(r.id)}
                    style={[styles.chip, {
                      borderColor: isActive ? c.magenta : c.line,
                      backgroundColor: isActive ? 'rgba(255,26,117,0.15)' : c.card,
                    }]}
                    testID={`role-${r.id}`}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={['rgba(255,26,117,0.2)', 'rgba(255,26,117,0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    ) : null}
                    <Text style={{ color: isActive ? c.getAccentText(c.magenta) : c.ink, fontFamily: isActive ? 'Inter_800ExtraBold' : 'Inter_600SemiBold', fontSize: 16 }}>
                      {t(r.en, r.hi)}
                    </Text>
                    <Text style={{ color: isActive ? c.getAccentText(c.magenta) : c.sub, fontSize: 13, marginTop: 6, fontFamily: 'PlusJakartaSans_600SemiBold' }}>₹{r.fee} <Text style={{ fontSize: 11 }}>+ GST</Text></Text>
                    
                    {isActive && (
                      <View style={{ position: 'absolute', top: -10, right: -10, width: 28, height: 28, borderRadius: 14, backgroundColor: c.magenta, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.card, shadowColor: c.magenta, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 }}>
                        <Feather name="check" size={16} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card>
            <Text style={[styles.label, { color: c.ink }]}>{t('Trial city', 'ट्रायल शहर')}</Text>
            <View style={styles.chipWrap}>
              {CITIES.map((ct) => {
                const isActive = city === ct;
                return (
                  <Pressable
                    key={ct}
                    onPress={() => setCity(ct)}
                    style={[styles.cityChip, {
                      borderColor: isActive ? c.magenta : c.line,
                      backgroundColor: isActive ? 'rgba(255,26,117,0.15)' : 'transparent',
                    }]}
                  >
                    <Text style={{ color: isActive ? c.getAccentText(c.magenta) : c.ink, fontSize: 14, fontFamily: isActive ? 'Inter_700Bold' : 'Inter_500Medium' }}>{ct}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card>
            <Text style={[styles.label, { color: c.ink }]}>{t('Date of birth (18–45 years)', 'जन्मतिथि (18–45 वर्ष)')}</Text>
            {input({ value: dob, onChange: setDob, placeholder: 'YYYY-MM-DD', maxLength: 10 })}
            <View style={{ marginTop: 16 }}>
              {primaryBtn(t('Continue to payment', 'पेमेंट पर जाएँ'), onSubmitDetails, 'reg-details')}
            </View>
          </Card>
        </View>
      ) : null}

      {step === 'pay' ? (
        <Card style={{ padding: 0 }}>
          <View style={{ alignItems: 'center', paddingVertical: 40, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line }}>
            <Text style={{ color: c.sub, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.5 }}>{t('Phase 1 registration fee', 'फेज़ 1 रजिस्ट्रेशन फ़ीस')}</Text>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 52, marginTop: 16 }}>₹{grossFee || '—'}</Text>
            {fee ? <Text style={{ color: c.cyan, fontSize: 14, marginTop: 6, fontFamily: 'PlusJakartaSans_600SemiBold' }}>₹{fee} + 18% GST</Text> : null}
          </View>

          <View style={{ padding: 24 }}>
            <Pressable onPress={() => setAgreed(!agreed)} style={styles.checkRow} testID="reg-consent">
              <Feather name={agreed ? 'check-square' : 'square'} size={24} color={agreed ? c.magenta : c.sub} />
              <Text style={{ color: c.ink, fontSize: 14.5, flex: 1, lineHeight: 22, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('I accept the BCPL Terms & Conditions and Privacy Policy (bcplt20.com/terms)', 'मैं BCPL के नियम व शर्तें और प्राइवेसी पॉलिसी स्वीकार करता/करती हूँ (bcplt20.com/terms)')}
              </Text>
            </Pressable>
            <Pressable onPress={() => setMarketingOptIn(!marketingOptIn)} style={styles.checkRow}>
              <Feather name={marketingOptIn ? 'check-square' : 'square'} size={24} color={marketingOptIn ? c.magenta : c.sub} />
              <Text style={{ color: c.sub, fontSize: 14.5, flex: 1, lineHeight: 22, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('Send me updates on WhatsApp/SMS (optional)', 'मुझे WhatsApp/SMS पर अपडेट भेजें (वैकल्पिक)')}
              </Text>
            </Pressable>

            <View style={{ marginTop: 32 }}>
              {primaryBtn(t('Pay securely with Cashfree', 'Cashfree से सुरक्षित पेमेंट करें'), onPay, 'reg-pay')}
            </View>
            <Text style={{ color: c.sub, fontSize: 12, marginTop: 14, textAlign: 'center', fontFamily: 'PlusJakartaSans_500Medium', lineHeight: 18 }}>
              {t('Payment opens securely inside the app. Cards, UPI & netbanking supported.', 'भुगतान ऐप के अंदर ही सुरक्षित रूप से खुलेगा। कार्ड, UPI और नेटबैंकिंग सपोर्टेड।')}
            </Text>
          </View>
        </Card>
      ) : null}

      {step === 'done' ? (
        <Card style={{ alignItems: 'center', paddingVertical: 56 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(49, 197, 107, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: 'rgba(49, 197, 107, 0.3)' }}>
            <Feather name="check" size={48} color="#2ECC71" />
          </View>
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 28 }}>
            {t('You are registered!', 'आप रजिस्टर्ड हैं!')}
          </Text>
          {regNumber ? (
            <View style={{ marginTop: 32, paddingVertical: 16, paddingHorizontal: 32, backgroundColor: c.card2, borderRadius: 16, borderWidth: 1, borderColor: c.line }}>
              <Text style={{ color: c.sub, fontSize: 13, textAlign: 'center', fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 6, letterSpacing: 0.5 }}>REGISTRATION NO.</Text>
              <Text style={{ color: c.getAccentText(c.cyan), fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32 }}>{regNumber}</Text>
            </View>
          ) : null}
          <Text style={{ color: c.sub, fontSize: 15, marginTop: 28, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
            {t('Next step: upload your 30–60 second trial video — right here in the app.', 'अगला कदम: अपना 30–60 सेकंड का ट्रायल वीडियो अपलोड करें — यहीं ऐप में।')}
          </Text>

          {/* Video guidelines so the player knows exactly what to record before
              they head to the in-app upload screen (mirrors website copy). */}
          <View style={{ width: '100%', marginTop: 26, padding: 16, backgroundColor: c.card2, borderRadius: 16, borderWidth: 1, borderColor: c.line }}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15, marginBottom: 12 }}>
              {t('Video guidelines', 'वीडियो दिशानिर्देश')}
            </Text>
            {[
              { en: 'Record a 30–60 second clip clearly showing your cricket skills.', hi: '30–60 सेकंड का clip रिकॉर्ड करें जिसमें आपकी क्रिकेट स्किल्स साफ़ दिखें।' },
              { en: 'Shoot horizontally in good light with a stable camera.', hi: 'अच्छी रोशनी में स्थिर कैमरे से हॉरिजॉन्टल शूट करें।' },
              { en: 'No editing or background music — raw footage of your own play only.', hi: 'कोई एडिटिंग या म्यूजिक नहीं — केवल आपके अपने खेल की मूल फुटेज।' },
              { en: 'MP4 / MOV / AVI / WebM, up to 200 MB.', hi: 'MP4 / MOV / AVI / WebM, अधिकतम 200 MB.' },
              { en: 'Upload within your deadline window shown on the upload screen.', hi: 'अपलोड स्क्रीन पर दिखाई गई समय-सीमा के भीतर अपलोड करें।' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                <Feather name="check" size={14} color="#2ECC71" style={{ marginTop: 2 }} />
                <Text style={{ color: c.sub, fontSize: 12.5, lineHeight: 19, fontFamily: 'PlusJakartaSans_500Medium', flex: 1 }}>{t(item.en, item.hi)}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => router.replace(doneStatus === 'payment_done' ? '/upload-video' : '/journey')}
            style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.8 : 1, marginTop: 28, paddingHorizontal: 40 }]}
          >
            <LinearGradient
              colors={['#FF1A75', '#D10056']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, letterSpacing: 0.5 }}>
              {doneStatus === 'payment_done'
                ? t('Upload trial video', 'ट्रायल वीडियो अपलोड करें')
                : t('Continue your journey', 'अपना सफ़र जारी रखें')}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/journey')} style={{ marginTop: 16 }}>
            <Text style={{ color: c.sub, fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('View my journey', 'मेरा सफ़र देखें')}</Text>
          </Pressable>
        </Card>
      ) : null}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF1A75',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,26,117,0.3)',
  },
  stepLine: { width: 2, flex: 1, backgroundColor: 'rgba(255,26,117,0.2)', marginVertical: 4 },
  inputWrap: {
    borderWidth: 2,
    borderRadius: 16,
    marginBottom: 16,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  btn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#FF1A75',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  label: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, marginBottom: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  chip: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    minWidth: '46%',
    flexGrow: 1,
    overflow: 'visible',
  },
  cityChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  checkRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start', marginBottom: 20 },
});
