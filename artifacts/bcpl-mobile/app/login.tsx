import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { ApiError, sendOtp, verifyOtp } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenBackground, GlassAppBar, useAppBarHeight } from '@/components/ui';

export default function LoginScreen() {
  const c = useColors();
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLang();
  
  const appBarHeight = useAppBarHeight();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  // Resend cooldown (mirrors the website login modal's 30s resend timer).
  const [resendTimer, setResendTimer] = useState<number>(0);

  const startResendTimer = () => {
    setResendTimer(30);
    const iv = setInterval(() => {
      setResendTimer((n) => {
        if (n <= 1) { clearInterval(iv); return 0; }
        return n - 1;
      });
    }, 1000);
  };

  const handleSend = async () => {
    setError(null);
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10) {
      setError(t('Enter a 10-digit mobile number', '10 अंकों का मोबाइल नंबर डालें'));
      return;
    }
    setBusy(true);
    try {
      const r = await sendOtp(clean);
      setInfo(r.devOtp ? `Dev OTP: ${r.devOtp}` : t('OTP has been sent to your number', 'OTP आपके नंबर पर भेज दिया गया है'));
      setStep('otp');
      startResendTimer();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NOT_REGISTERED') {
        setError(t('This number is not registered — register first on bcplt20.com', 'यह नंबर रजिस्टर्ड नहीं है — पहले bcplt20.com पर रजिस्टर करें'));
      } else {
        setError(e instanceof Error ? e.message : t('Could not send OTP, please try again', 'OTP भेजने में दिक्कत हुई'));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || busy) return;
    setError(null);
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10) return;
    setBusy(true);
    try {
      const r = await sendOtp(clean);
      setInfo(r.devOtp ? `Dev OTP: ${r.devOtp}` : t('OTP has been sent to your number', 'OTP आपके नंबर पर भेज दिया गया है'));
      startResendTimer();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Could not resend OTP, please try again', 'OTP दोबारा भेजने में दिक्कत हुई'));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (otp.replace(/\D/g, '').length < 4) {
      setError(t('Enter the OTP', 'OTP डालें'));
      return;
    }
    setBusy(true);
    try {
      const r = await verifyOtp(phone.replace(/\D/g, ''), otp.trim());
      await login(r.token, r.user);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Incorrect OTP, please try again', 'OTP गलत है, फिर कोशिश करें'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title="Login" back={true} />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.wrap, { paddingTop: appBarHeight + 20 }]}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.iconWrap, { backgroundColor: '#fff' }]}>
          <Image source={require('../assets/images/bcpl-ball-clean.png')} style={{ width: 50, height: 50 }} contentFit="contain" />
        </View>
        <Text style={[styles.title, { color: c.ink }]}>
          {t('Player Login', 'Player Login')}
        </Text>
        <Text style={[styles.sub, { color: c.sub }]}>
          {step === 'phone'
            ? t('Enter your registered mobile number', 'अपना registered mobile number डालें')
            : t(`OTP sent to +91 ${phone}`, `OTP भेजा गया +91 ${phone}`)}
        </Text>

        {step === 'phone' ? (
          <View style={[styles.inputRow, { borderColor: c.line, backgroundColor: c.card2 }]}>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>+91</Text>
            <View style={{ width: 1, height: 24, backgroundColor: c.line }} />
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="number-pad"
              placeholder={t('10-digit number', '10 अंकों का नंबर')}
              placeholderTextColor={c.sub}
              style={[styles.input, { color: c.ink, letterSpacing: 0 }]}
              maxLength={10}
              testID="phone-input"
              autoFocus
            />
          </View>
        ) : (
          <View style={[styles.inputRow, { borderColor: c.line, backgroundColor: c.card2 }]}>
            <Feather name="key" size={20} color={c.sub} />
            <View style={{ width: 1, height: 24, backgroundColor: c.line }} />
            <TextInput
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="OTP"
              placeholderTextColor={c.sub}
              style={[styles.input, { color: c.ink, letterSpacing: 12, textAlign: 'center' }]}
              maxLength={6}
              testID="otp-input"
              autoFocus
            />
          </View>
        )}

        {error ? (
          <View style={styles.alertBox}>
            <Feather name="alert-circle" size={18} color={c.coral} />
            <Text style={{ color: c.coral, fontSize: 14, flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{error}</Text>
          </View>
        ) : info && step === 'otp' ? (
          <View style={[styles.alertBox, { backgroundColor: 'rgba(49, 197, 107, 0.15)' }]}>
            <Feather name="check-circle" size={18} color={c.mint} />
            <Text style={{ color: c.mint, fontSize: 14, flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{info}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={step === 'phone' ? handleSend : handleVerify}
          disabled={busy}
          style={({ pressed }) => [
            styles.btn,
            { opacity: busy ? 0.6 : pressed ? 0.85 : 1 },
          ]}
          testID="submit-button"
        >
          <LinearGradient
            colors={['#FF1A75', '#D10056']}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, letterSpacing: 0.5 }}>
              {step === 'phone' ? t('Send OTP →', 'OTP भेजें →') : t('Verify & Login', 'Verify करें & Login')}
            </Text>
          )}
        </Pressable>

        {step === 'otp' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 16 }}>
            <Pressable onPress={() => { setStep('phone'); setOtp(''); setError(null); }} testID="change-number" style={{ paddingVertical: 12 }}>
              <Text style={{ color: c.cyan, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>
                {t('← Change number', '← नंबर बदलें')}
              </Text>
            </Pressable>
            <Pressable onPress={handleResend} disabled={resendTimer > 0 || busy} testID="resend-otp" style={{ paddingVertical: 12 }}>
              <Text style={{ color: resendTimer > 0 ? c.sub : c.cyan, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' }}>
                {resendTimer > 0 ? t(`Resend in ${resendTimer}s`, `${resendTimer}s में दोबारा भेजें`) : t('Resend OTP', 'OTP दोबारा भेजें')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/register')} testID="go-register" style={{ padding: 16, marginTop: 16 }}>
            <Text style={{ color: c.sub, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {t('New player? ', 'नया player? ')}
              <Text style={{ color: c.getAccentText(c.magenta), fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Register here →', 'यहाँ Register करें →')}</Text>
            </Text>
          </Pressable>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,26,117,0.3)',
  },
  title: { fontSize: 28, fontFamily: 'BricolageGrotesque_800ExtraBold', letterSpacing: -0.5 },
  sub: { fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20, fontFamily: 'PlusJakartaSans_500Medium' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginTop: 40,
    width: '100%',
    height: 64,
  },
  input: { flex: 1, fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold' },
  btn: {
    marginTop: 32,
    borderRadius: 16,
    width: '100%',
    height: 60,
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
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
  },
});
