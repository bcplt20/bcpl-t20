import React, { useMemo, useState } from 'react';
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
          if (st.phase1Status && st.phase1Status !== 'pending_payment' && st.phase1Status !== 'created') {
            setRegNumber(st.regNumber ?? '');
            setStep('done');
          } else {
            setFee(st.fees?.phase1 ?? (st.role === 'ar' ? 399 : 299));
            setStep('pay');
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
            setFee(st.fees?.phase1 ?? 299);
            setStep('pay');
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
    <TextInput
      value={props.value}
      onChangeText={props.onChange}
      placeholder={props.placeholder}
      placeholderTextColor={c.mutedForeground}
      keyboardType={props.keyboard ?? 'default'}
      maxLength={props.maxLength}
      autoCapitalize="none"
      style={[styles.input, { borderColor: c.border, color: c.foreground, backgroundColor: 'rgba(255,255,255,0.04)' }]}
    />
  );

  const primaryBtn = (label: string, onPress: () => void, testID: string) => (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.btn, { backgroundColor: '#FF6B00', opacity: busy || pressed ? 0.7 : 1 }]}
      testID={testID}
    >
      {busy ? <ActivityIndicator color="#fff" /> : (
        <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 }}>{label}</Text>
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
      contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 60 : 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 22 }}>{stepTitle[step]}</Text>
      <Text style={{ color: c.mutedForeground, fontSize: 13, marginTop: 4, marginBottom: 14 }}>
        {t('BCPL Season 5 — Phase 1 registration', 'BCPL सीज़न 5 — फेज़ 1 रजिस्ट्रेशन')}
      </Text>

      {error ? <Text style={styles.err}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      {step === 'account' ? (
        <Card>
          {input({ value: name, onChange: setName, placeholder: t('Full name', 'पूरा नाम') })}
          {input({ value: email, onChange: setEmail, placeholder: t('Email', 'ईमेल'), keyboard: 'email-address' })}
          {input({ value: phone, onChange: (v) => setPhone(v.replace(/\D/g, '')), placeholder: t('Mobile number (10 digits)', 'मोबाइल नंबर (10 अंक)'), keyboard: 'number-pad', maxLength: 10 })}
          {primaryBtn(t('Send OTP', 'OTP भेजें'), onSendOtp, 'reg-send-otp')}
        </Card>
      ) : null}

      {step === 'otp' ? (
        <Card>
          <Text style={{ color: c.mutedForeground, fontSize: 13, marginBottom: 10 }}>
            {t(`OTP sent to +91 ${phone}`, `+91 ${phone} पर OTP भेजा गया`)}
          </Text>
          {input({ value: otp, onChange: (v) => setOtp(v.replace(/\D/g, '')), placeholder: 'OTP', keyboard: 'number-pad', maxLength: 6 })}
          {primaryBtn(t('Verify & continue', 'वेरिफ़ाई करें'), onVerifyOtp, 'reg-verify-otp')}
          <Pressable onPress={() => { setStep('account'); setOtp(''); }} style={{ marginTop: 12, alignSelf: 'center' }}>
            <Text style={{ color: c.accent, fontSize: 13 }}>{t('Change details', 'जानकारी बदलें')}</Text>
          </Pressable>
        </Card>
      ) : null}

      {step === 'details' ? (
        <View style={{ gap: 12 }}>
          <Card>
            <Text style={[styles.label, { color: c.foreground }]}>{t('Your playing role', 'आपका रोल')}</Text>
            <View style={styles.chipWrap}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => setRole(r.id)}
                  style={[styles.chip, {
                    borderColor: role === r.id ? '#FF6B00' : c.border,
                    backgroundColor: role === r.id ? 'rgba(255,107,0,0.12)' : 'transparent',
                  }]}
                  testID={`role-${r.id}`}
                >
                  <Text style={{ color: role === r.id ? '#FF6B00' : c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                    {t(r.en, r.hi)}
                  </Text>
                  <Text style={{ color: c.mutedForeground, fontSize: 11 }}>₹{r.fee} + GST</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={[styles.label, { color: c.foreground }]}>{t('Trial city', 'ट्रायल शहर')}</Text>
            <View style={styles.chipWrap}>
              {CITIES.map((ct) => (
                <Pressable
                  key={ct}
                  onPress={() => setCity(ct)}
                  style={[styles.cityChip, {
                    borderColor: city === ct ? '#FF6B00' : c.border,
                    backgroundColor: city === ct ? 'rgba(255,107,0,0.12)' : 'transparent',
                  }]}
                >
                  <Text style={{ color: city === ct ? '#FF6B00' : c.foreground, fontSize: 12.5 }}>{ct}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={[styles.label, { color: c.foreground }]}>{t('Date of birth (18–45 years)', 'जन्मतिथि (18–45 वर्ष)')}</Text>
            {input({ value: dob, onChange: setDob, placeholder: 'YYYY-MM-DD', maxLength: 10 })}
            {primaryBtn(t('Continue to payment', 'पेमेंट पर जाएँ'), onSubmitDetails, 'reg-details')}
          </Card>
        </View>
      ) : null}

      {step === 'pay' ? (
        <Card>
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: c.mutedForeground, fontSize: 12.5 }}>{t('Phase 1 registration fee', 'फेज़ 1 रजिस्ट्रेशन फ़ीस')}</Text>
            <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 30, marginTop: 4 }}>₹{grossFee || '—'}</Text>
            {fee ? <Text style={{ color: c.mutedForeground, fontSize: 11.5 }}>₹{fee} + 18% GST</Text> : null}
          </View>

          <Pressable onPress={() => setAgreed(!agreed)} style={styles.checkRow} testID="reg-consent">
            <Feather name={agreed ? 'check-square' : 'square'} size={20} color={agreed ? '#FF6B00' : c.mutedForeground} />
            <Text style={{ color: c.foreground, fontSize: 12.5, flex: 1, lineHeight: 18 }}>
              {t('I accept the BCPL Terms & Conditions and Privacy Policy (bcplt20.com/terms)', 'मैं BCPL के नियम व शर्तें और प्राइवेसी पॉलिसी स्वीकार करता/करती हूँ (bcplt20.com/terms)')}
            </Text>
          </Pressable>
          <Pressable onPress={() => setMarketingOptIn(!marketingOptIn)} style={styles.checkRow}>
            <Feather name={marketingOptIn ? 'check-square' : 'square'} size={20} color={marketingOptIn ? '#FF6B00' : c.mutedForeground} />
            <Text style={{ color: c.mutedForeground, fontSize: 12.5, flex: 1, lineHeight: 18 }}>
              {t('Send me updates on WhatsApp/SMS (optional)', 'मुझे WhatsApp/SMS पर अपडेट भेजें (वैकल्पिक)')}
            </Text>
          </Pressable>

          {primaryBtn(t('Pay securely with Cashfree', 'Cashfree से सुरक्षित पेमेंट करें'), onPay, 'reg-pay')}

          {orderId ? (
            <Pressable
              onPress={onVerifyPayment}
              disabled={busy}
              style={({ pressed }) => [styles.btn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.accent, opacity: busy || pressed ? 0.7 : 1, marginTop: 10 }]}
              testID="reg-verify-pay"
            >
              <Text style={{ color: c.accent, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                {t('I have paid — verify payment', 'पेमेंट कर दी — वेरिफ़ाई करें')}
              </Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {step === 'done' ? (
        <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
          <Feather name="check-circle" size={44} color="#2ECC71" />
          <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 12 }}>
            {t('You are registered!', 'आप रजिस्टर्ड हैं!')}
          </Text>
          {regNumber ? (
            <Text style={{ color: c.accent, fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 6 }}>{regNumber}</Text>
          ) : null}
          <Text style={{ color: c.mutedForeground, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
            {t('Next step: upload your 30–60 sec trial video from your dashboard', 'अगला कदम: अपने डैशबोर्ड से 30–60 सेकंड का ट्रायल वीडियो अपलोड करें')}
          </Text>
          <Pressable
            onPress={() => router.replace('/profile')}
            style={({ pressed }) => [styles.btn, { backgroundColor: '#FF6B00', opacity: pressed ? 0.8 : 1, marginTop: 18, paddingHorizontal: 28 }]}
          >
            <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 14 }}>{t('Go to profile', 'प्रोफ़ाइल देखें')}</Text>
          </Pressable>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
    fontFamily: 'Inter_500Medium',
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  err: { color: '#FF6B6B', fontSize: 13, marginBottom: 10, fontFamily: 'Inter_600SemiBold' },
  info: { color: '#2ECC71', fontSize: 13, marginBottom: 10, fontFamily: 'Inter_600SemiBold' },
  label: { fontFamily: 'Inter_700Bold', fontSize: 14, marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    minWidth: '45%',
    flexGrow: 1,
  },
  cityChip: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 12, marginTop: 4 },
});
