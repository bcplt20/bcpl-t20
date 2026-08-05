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
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { ApiError, sendOtp, verifyOtp } from '@/lib/api';

export default function LoginScreen() {
  const c = useColors();
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLang();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={styles.wrap}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.iconWrap, { backgroundColor: c.card }]}>
          <Feather name="smartphone" size={26} color={c.accent} />
        </View>
        <Text style={[styles.title, { color: c.foreground }]}>
          {step === 'phone' ? t('Log in with OTP', 'OTP से लॉगिन करें') : t('Enter OTP', 'OTP डालें')}
        </Text>
        <Text style={[styles.sub, { color: c.mutedForeground }]}>
          {step === 'phone'
            ? t('The same number you used for BCPL registration', 'वही नंबर जिससे BCPL रजिस्ट्रेशन की थी')
            : t(`Enter the OTP sent to +91 ${phone}`, `+91 ${phone} पर भेजा गया OTP डालें`)}
        </Text>

        {step === 'phone' ? (
          <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.card }]}>
            <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_600SemiBold' }}>+91</Text>
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="number-pad"
              placeholder="Mobile number"
              placeholderTextColor={c.mutedForeground}
              style={[styles.input, { color: c.foreground }]}
              maxLength={10}
              testID="phone-input"
              autoFocus
            />
          </View>
        ) : (
          <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.card }]}>
            <Feather name="key" size={16} color={c.mutedForeground} />
            <TextInput
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="OTP"
              placeholderTextColor={c.mutedForeground}
              style={[styles.input, { color: c.foreground, letterSpacing: 6 }]}
              maxLength={6}
              testID="otp-input"
              autoFocus
            />
          </View>
        )}

        {error ? (
          <Text style={{ color: c.destructive, fontSize: 13, marginTop: 10, textAlign: 'center' }}>{error}</Text>
        ) : info && step === 'otp' ? (
          <Text style={{ color: c.success, fontSize: 13, marginTop: 10, textAlign: 'center' }}>{info}</Text>
        ) : null}

        <Pressable
          onPress={step === 'phone' ? handleSend : handleVerify}
          disabled={busy}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: c.primary, opacity: busy ? 0.6 : pressed ? 0.85 : 1 },
          ]}
          testID="submit-button"
        >
          {busy ? (
            <ActivityIndicator color={c.primaryForeground} />
          ) : (
            <Text style={{ color: c.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 15 }}>
              {step === 'phone' ? 'Send OTP' : 'Verify & Login'}
            </Text>
          )}
        </Pressable>

        {step === 'otp' ? (
          <Pressable onPress={() => { setStep('phone'); setOtp(''); setError(null); }} testID="change-number">
            <Text style={{ color: c.accent, fontSize: 13, marginTop: 16, fontFamily: 'Inter_600SemiBold' }}>
              {t('Change number', 'नंबर बदलें')}
            </Text>
          </Pressable>
        ) : null}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 13.5, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 24,
    width: '100%',
    height: 52,
  },
  input: { flex: 1, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  btn: {
    marginTop: 18,
    borderRadius: 12,
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
