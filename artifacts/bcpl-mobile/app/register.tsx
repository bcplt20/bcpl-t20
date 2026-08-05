import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  verifyPhase1Payment,
  type PlayerRole,
} from '@/lib/api';
import { Card } from '@/components/ui';
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

export default function RegisterScreen() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const { token, user, login } = useAuth();

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
  const [orderId, setOrderId] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [regNumber, setRegNumber] = useState('');

  const grossFee = useMemo(() => Math.round(fee * 1.18), [fee]);

  // Logged-in users: sync with server status on mount and recover any
  // pending Cashfree order (app may have been backgrounded during checkout).
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [st, savedOrder] = await Promise.all([
          getRegisterStatus(token),
          AsyncStorage.getItem(ORDER_KEY),
        ]);
        if (cancelled) return;
        if (st.registered && st.registrationId) {
          setRegistrationId(st.registrationId);
          if (isUnpaidStatus(st.phase1Status)) {
            setFee(st.fees?.phase1 ?? 299);
            if (savedOrder) setOrderId(savedOrder);
            setStep('pay');
          } else {
            setRegNumber(st.regNumber ?? '');
            setStep('done');
            AsyncStorage.removeItem(ORDER_KEY).catch(() => {});
          }
        }
      } catch {
        // best-effort — user can proceed through the normal steps
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

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
      setOrderId(pay.orderId);
      await AsyncStorage.setItem(ORDER_KEY, pay.orderId).catch(() => {});
      // Cashfree hosted checkout (opens in browser)
      await Linking.openURL(`https://payments.cashfree.com/order/#${pay.paymentSessionId}`);
    } catch (e) {
      fail(e, t('Could not start payment', 'पेमेंट शुरू नहीं हो पाई'));
    } finally {
      setBusy(false);
    }
  };

  const onVerifyPayment = async () => {
    setError('');
    if (!token || !orderId) return;
    setBusy(true);
    try {
      const r = await verifyPhase1Payment(token, orderId);
      if (r.success) {
        setRegNumber(r.regNumber ?? '');
        setStep('done');
        AsyncStorage.removeItem(ORDER_KEY).catch(() => {});
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setError(t('Payment not completed yet — finish it in the browser, then tap again', 'पेमेंट अभी पूरी नहीं हुई — ब्राउज़र में पूरी करके फिर दबाएँ'));
      } else {
        fail(e, t('Could not verify payment', 'पेमेंट वेरिफ़ाई नहीं हो पाई'));
      }
    } finally {
      setBusy(false);
    }
  };

  /* ── UI helpers ── */
  const input = (props: {
    value: string; onChange: (v: string) => void; placeholder: string;
    keyboard?: 'default' | 'number-pad' | 'email-address'; maxLength?: number;
  }) => (
    <View style={styles.inputWrap}>
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        placeholderTextColor={c.mutedForeground}
        keyboardType={props.keyboard ?? 'default'}
        maxLength={props.maxLength}
        autoCapitalize="none"
        style={[styles.input, { color: c.foreground }]}
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
        colors={['#FF6B00', '#D95A00']}
        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
      />
      {busy ? <ActivityIndicator color="#fff" /> : (
        <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 }}>{label}</Text>
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
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: Platform.OS === 'web' ? 60 : 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.5 }}>{stepTitle[step]}</Text>
      <Text style={{ color: c.mutedForeground, fontSize: 14, marginTop: 6, marginBottom: 20, fontFamily: 'Inter_500Medium' }}>
        {t('BCPL Season 5 — Phase 1 registration', 'BCPL सीज़न 5 — फेज़ 1 रजिस्ट्रेशन')}
      </Text>

      {error ? (
        <View style={styles.alertBox}>
          <Feather name="alert-circle" size={16} color={c.destructive} />
          <Text style={{ color: c.destructive, fontSize: 13, flex: 1, fontFamily: 'Inter_500Medium' }}>{error}</Text>
        </View>
      ) : null}
      
      {info ? (
        <View style={[styles.alertBox, { backgroundColor: 'rgba(49, 197, 107, 0.1)' }]}>
          <Feather name="check-circle" size={16} color={c.success} />
          <Text style={{ color: c.success, fontSize: 13, flex: 1, fontFamily: 'Inter_500Medium' }}>{info}</Text>
        </View>
      ) : null}

      {step === 'account' ? (
        <View style={{ gap: 12 }}>
        <Card>
          <Text style={{ color: '#E8B23D', fontFamily: 'Inter_700Bold', fontSize: 10.5, letterSpacing: 2 }}>
            {t('YOUR JOURNEY', 'आपका सफ़र')}
          </Text>
          <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 4, marginBottom: 10 }}>
            {t('From office to stadium — how it works', 'ऑफिस से स्टेडियम तक — पूरा process')}
          </Text>
          {[
            { n: '1', en: 'Register', hi: 'रजिस्टर करें', den: 'Fill the form + pay the entry fee', dhi: 'फॉर्म भरें + एंट्री फ़ीस दें' },
            { n: '2', en: 'Upload video', hi: 'वीडियो अपलोड करें', den: '30–60 sec cricket clip from any ground', dhi: 'किसी भी मैदान से 30–60 सेकंड की क्रिकेट क्लिप' },
            { n: '3', en: 'Phase 1 result', hi: 'फेज़ 1 रिज़ल्ट', den: "Video evaluated on BCPL's Phase 1 criteria — result within 15 days", dhi: 'वीडियो BCPL के फेज़ 1 मापदंड पर परखा जाता है — 15 दिनों में रिज़ल्ट' },
            { n: '4', en: 'Physical trial', hi: 'फिज़िकल ट्रायल', den: 'At your trial city — after Phase 1 qualification (₹2,000 / ₹3,000)', dhi: 'आपके ट्रायल शहर में — फेज़ 1 क्वालिफ़ाई करने के बाद (₹2,000 / ₹3,000)' },
            { n: '5', en: 'Auction', hi: 'ऑक्शन', den: 'Franchises bid on you', dhi: 'फ्रैंचाइज़ी आप पर बोली लगाती हैं' },
            { n: '6', en: 'Play BCPL', hi: 'BCPL खेलें', den: 'Represent your franchise under floodlights', dhi: 'फ्लडलाइट्स में अपनी फ्रैंचाइज़ी के लिए खेलें' },
          ].map((s, i, arr) => (
            <View key={s.n} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.stepDot}>
                  <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 12 }}>{s.n}</Text>
                </View>
                {i < arr.length - 1 ? <View style={styles.stepLine} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 14 : 0 }}>
                <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13.5 }}>{t(s.en, s.hi)}</Text>
                <Text style={{ color: c.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 1 }}>{t(s.den, s.dhi)}</Text>
              </View>
            </View>
          ))}
          <Text style={{ color: c.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 12 }}>
            {t(
              'Phase 2 fee applies only after Phase 1 qualification. Fees cover participation only — see bcplt20.com/refunds and bcplt20.com/eligibility for full rules.',
              'फेज़ 2 की फ़ीस सिर्फ़ फेज़ 1 क्वालिफ़ाई करने के बाद लगती है। फ़ीस केवल भागीदारी के लिए है — पूरे नियम bcplt20.com/refunds और bcplt20.com/eligibility पर देखें।',
            )}
          </Text>
        </Card>
        <Card>
          {input({ value: name, onChange: setName, placeholder: t('Full name', 'पूरा नाम') })}
          {input({ value: email, onChange: setEmail, placeholder: t('Email', 'ईमेल'), keyboard: 'email-address' })}
          {input({ value: phone, onChange: (v) => setPhone(v.replace(/\D/g, '')), placeholder: t('Mobile number (10 digits)', 'मोबाइल नंबर (10 अंक)'), keyboard: 'number-pad', maxLength: 10 })}
          <View style={{ marginTop: 12 }}>
            {primaryBtn(t('Send OTP', 'OTP भेजें'), onSendOtp, 'reg-send-otp')}
          </View>
        </Card>
        </View>
      ) : null}

      {step === 'otp' ? (
        <Card>
          <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 12 }}>
            <Feather name="mail" size={32} color={c.accent} style={{ marginBottom: 16 }} />
            <Text style={{ color: c.foreground, fontSize: 16, fontFamily: 'Inter_600SemiBold', textAlign: 'center' }}>
              {t(`OTP sent to +91 ${phone}`, `+91 ${phone} पर OTP भेजा गया`)}
            </Text>
          </View>
          {input({ value: otp, onChange: (v) => setOtp(v.replace(/\D/g, '')), placeholder: 'Enter OTP', keyboard: 'number-pad', maxLength: 6 })}
          <View style={{ marginTop: 12 }}>
            {primaryBtn(t('Verify & continue', 'वेरिफ़ाई करें'), onVerifyOtp, 'reg-verify-otp')}
          </View>
          <Pressable onPress={() => { setStep('account'); setOtp(''); }} style={{ marginTop: 20, alignSelf: 'center' }}>
            <Text style={{ color: c.accent, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>{t('Change details', 'जानकारी बदलें')}</Text>
          </Pressable>
        </Card>
      ) : null}

      {step === 'details' ? (
        <View style={{ gap: 16 }}>
          <Card>
            <Text style={[styles.label, { color: c.foreground }]}>{t('Your playing role', 'आपका रोल')}</Text>
            <View style={styles.chipWrap}>
              {ROLES.map((r) => {
                const isActive = role === r.id;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => setRole(r.id)}
                    style={[styles.chip, {
                      borderColor: isActive ? c.primary : 'rgba(255,255,255,0.1)',
                      backgroundColor: isActive ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.03)',
                    }]}
                    testID={`role-${r.id}`}
                  >
                    <Text style={{ color: isActive ? c.primary : c.foreground, fontFamily: isActive ? 'Inter_700Bold' : 'Inter_600SemiBold', fontSize: 14 }}>
                      {t(r.en, r.hi)}
                    </Text>
                    <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 4 }}>₹{r.fee} + GST</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card>
            <Text style={[styles.label, { color: c.foreground }]}>{t('Trial city', 'ट्रायल शहर')}</Text>
            <View style={styles.chipWrap}>
              {CITIES.map((ct) => {
                const isActive = city === ct;
                return (
                  <Pressable
                    key={ct}
                    onPress={() => setCity(ct)}
                    style={[styles.cityChip, {
                      borderColor: isActive ? c.primary : 'rgba(255,255,255,0.1)',
                      backgroundColor: isActive ? 'rgba(255,107,0,0.12)' : 'transparent',
                    }]}
                  >
                    <Text style={{ color: isActive ? c.primary : c.foreground, fontSize: 13, fontFamily: isActive ? 'Inter_700Bold' : 'Inter_500Medium' }}>{ct}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card>
            <Text style={[styles.label, { color: c.foreground }]}>{t('Date of birth (18–45 years)', 'जन्मतिथि (18–45 वर्ष)')}</Text>
            {input({ value: dob, onChange: setDob, placeholder: 'YYYY-MM-DD', maxLength: 10 })}
            <View style={{ marginTop: 12 }}>
              {primaryBtn(t('Continue to payment', 'पेमेंट पर जाएँ'), onSubmitDetails, 'reg-details')}
            </View>
          </Card>
        </View>
      ) : null}

      {step === 'pay' ? (
        <Card style={{ padding: 0 }}>
          <View style={{ alignItems: 'center', paddingVertical: 32, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <Text style={{ color: c.mutedForeground, fontSize: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 }}>{t('Phase 1 registration fee', 'फेज़ 1 रजिस्ट्रेशन फ़ीस')}</Text>
            <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 44, marginTop: 12 }}>₹{grossFee || '—'}</Text>
            {fee ? <Text style={{ color: c.mutedForeground, fontSize: 13, marginTop: 4, fontFamily: 'Inter_500Medium' }}>₹{fee} + 18% GST</Text> : null}
          </View>

          <View style={{ padding: 20 }}>
            <Pressable onPress={() => setAgreed(!agreed)} style={styles.checkRow} testID="reg-consent">
              <Feather name={agreed ? 'check-square' : 'square'} size={22} color={agreed ? c.primary : c.mutedForeground} />
              <Text style={{ color: c.foreground, fontSize: 13.5, flex: 1, lineHeight: 20 }}>
                {t('I accept the BCPL Terms & Conditions and Privacy Policy (bcplt20.com/terms)', 'मैं BCPL के नियम व शर्तें और प्राइवेसी पॉलिसी स्वीकार करता/करती हूँ (bcplt20.com/terms)')}
              </Text>
            </Pressable>
            <Pressable onPress={() => setMarketingOptIn(!marketingOptIn)} style={styles.checkRow}>
              <Feather name={marketingOptIn ? 'check-square' : 'square'} size={22} color={marketingOptIn ? c.primary : c.mutedForeground} />
              <Text style={{ color: c.mutedForeground, fontSize: 13.5, flex: 1, lineHeight: 20 }}>
                {t('Send me updates on WhatsApp/SMS (optional)', 'मुझे WhatsApp/SMS पर अपडेट भेजें (वैकल्पिक)')}
              </Text>
            </Pressable>

            <View style={{ marginTop: 24 }}>
              {primaryBtn(t('Pay securely with Cashfree', 'Cashfree से सुरक्षित पेमेंट करें'), onPay, 'reg-pay')}
            </View>

            {orderId ? (
              <Pressable
                onPress={onVerifyPayment}
                disabled={busy}
                style={({ pressed }) => [styles.btn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.accent, opacity: busy || pressed ? 0.7 : 1, marginTop: 16 }]}
                testID="reg-verify-pay"
              >
                <Text style={{ color: c.accent, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                  {t('I have paid — verify payment', 'पेमेंट कर दी — वेरिफ़ाई करें')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Card>
      ) : null}

      {step === 'done' ? (
        <Card style={{ alignItems: 'center', paddingVertical: 48 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(49, 197, 107, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Feather name="check" size={40} color="#2ECC71" />
          </View>
          <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 24 }}>
            {t('You are registered!', 'आप रजिस्टर्ड हैं!')}
          </Text>
          {regNumber ? (
            <View style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ color: c.mutedForeground, fontSize: 12, textAlign: 'center', fontFamily: 'Inter_600SemiBold', marginBottom: 4, letterSpacing: 0.5 }}>REGISTRATION NO.</Text>
              <Text style={{ color: c.accent, fontFamily: 'Inter_700Bold', fontSize: 24 }}>{regNumber}</Text>
            </View>
          ) : null}
          <Text style={{ color: c.mutedForeground, fontSize: 14, marginTop: 24, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 }}>
            {t('Next step: upload your 30–60 sec trial video from your dashboard', 'अगला कदम: अपने डैशबोर्ड से 30–60 सेकंड का ट्रायल वीडियो अपलोड करें')}
          </Text>
          <Pressable
            onPress={() => router.replace('/profile')}
            style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.8 : 1, marginTop: 32, paddingHorizontal: 40 }]}
          >
            <LinearGradient
              colors={['#FF6B00', '#D95A00']}
              style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
            />
            <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 }}>{t('Go to profile', 'प्रोफ़ाइल देखें')}</Text>
          </Pressable>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: { width: 2, flex: 1, backgroundColor: 'rgba(232,178,61,0.35)', marginVertical: 2 },
  inputWrap: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    marginBottom: 12,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: { fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 14 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: '47%',
    flexGrow: 1,
  },
  cityChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  checkRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 16 },
});
