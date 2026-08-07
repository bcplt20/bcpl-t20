import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { saveProfileBackfill, getProfileCompletion, ApiError } from '@/lib/api';
import { ScreenBackground, GlassAppBar, Card, LoadingView, useAppBarHeight } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

const TSHIRT_OPTS = ['S', 'M', 'L', 'XL', 'XXL'];
const RELATION_OPTS = ['Father', 'Mother', 'Spouse', 'Friend', 'Other'];

function Label({ c, text }: { c: any; text: string }) {
  return <Text style={{ color: c.sub, fontSize: 11.5, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' }}>{text}</Text>;
}

function ErrLine({ c, text }: { c: any; text: string }) {
  return <Text style={{ color: c.coral, fontSize: 12, marginTop: 6, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{text}</Text>;
}

function ChipRow({ options, value, onChange, c }: { options: string[]; value: string; onChange: (v: string) => void; c: any }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <Pressable key={opt} onPress={() => onChange(opt)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: active ? 2 : 1, borderColor: active ? c.cyan : c.line, backgroundColor: active ? 'rgba(0,220,245,0.08)' : c.card2 }}>
            <Text style={{ color: active ? c.cyan : c.ink, fontSize: 13, fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold' }}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TextField({ c, value, onChange, placeholder, keyboard = 'default', maxLength, err }: any) {
  return (
    <View style={[styles.inputWrap, { borderColor: err ? c.coral : c.line, backgroundColor: c.card2 }]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.sub}
        keyboardType={keyboard}
        maxLength={maxLength}
        style={{ color: c.ink, fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', paddingVertical: 12, paddingHorizontal: 16 }}
      />
    </View>
  );
}

export default function JerseyBackfillScreen() {
  const c = useColors();
  const { t } = useLang();
  const { token } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const appBarHeight = useAppBarHeight();

  const [tshirt, setTshirt] = useState('');
  const [trouser, setTrouser] = useState('');
  const [shoe, setShoe] = useState('');
  const [helmet, setHelmet] = useState('');
  
  const [ecName, setEcName] = useState('');
  const [ecRel, setEcRel] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [ecPhoneErr, setEcPhoneErr] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const q = useQuery({
    queryKey: ['profileCompletion', token],
    queryFn: () => getProfileCompletion(token as string),
    enabled: !!token,
  });

  const needsEc = q.data?.missingFields?.includes('emergencyPhone') || q.data?.missingFields?.includes('emergencyName');

  const emergencyOk = !needsEc || !!(ecName.trim() && ecRel && /^\d{10}$/.test(ecPhone));
  const canSubmit = !!tshirt && !!trouser && !!shoe && !!helmet && emergencyOk && !ecPhoneErr;

  const handleSubmit = async () => {
    if (!token) return;
    if (needsEc && !/^\d{10}$/.test(ecPhone)) { setEcPhoneErr(t('Enter a 10-digit mobile number', '10 अंकों का मोबाइल नंबर डालें')); return; }
    if (!canSubmit) {
      setSubmitErr(t('Please complete jersey details and required fields.', 'कृपया जर्सी डिटेल्स और आवश्यक जानकारी पूरा करें।'));
      return;
    }
    
    setSubmitting(true);
    setSubmitErr('');
    try {
      await saveProfileBackfill(token, {
        tshirtSize: tshirt,
        trouserSize: trouser,
        shoeSize: shoe,
        helmetSize: helmet,
        ...(needsEc ? {
          emergencyName: ecName.trim(),
          emergencyRelation: ecRel,
          emergencyPhone: ecPhone,
        } : {}),
      });
      // Invalidate queries so dashboard/profile know we're done
      qc.invalidateQueries({ queryKey: ['profileCompletion', token] });
      qc.invalidateQueries({ queryKey: ['dashboard', token] });
      router.back();
    } catch (e: any) {
      setSubmitErr(e instanceof ApiError ? e.message : t('Submission failed. Please try again.', 'सबमिशन विफल रहा। कृपया पुनः प्रयास करें।'));
    } finally {
      setSubmitting(false);
    }
  };

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenBackground />
        <GlassAppBar title={t('Jersey Sizes', 'जर्सी साइज़')} back />
        <LoadingView />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('Jersey Sizes', 'जर्सी साइज़')} back />
      
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: appBarHeight + 12, paddingBottom: 80 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 17 }}>
              {t('Jersey Details', 'जर्सी डिटेल्स')}
            </Text>
            <Text style={{ color: c.sub, fontSize: 12.5, marginTop: 4, lineHeight: 18, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {t('These jersey details are not for trials — no kit is provided at trials. If you are picked into a team through the auction, having your sizes on file makes jersey preparation easy. Please fill your sizes accordingly.', 'ये jersey details trials के लिए नहीं हैं — trials में kit नहीं दी जाती। अगर auction के ज़रिए आप किसी team में चुने जाते हैं, तो आपकी sizes पहले से हमारे पास होने से jersey बनवाना आसान रहेगा। इसी हिसाब से अपनी सही sizes भरें।')}
            </Text>
          </View>

          <Label c={c} text={t('T-SHIRT SIZE *', 'टी-शर्ट साइज़ *')} />
          <ChipRow options={TSHIRT_OPTS} value={tshirt} onChange={setTshirt} c={c} />
          <View style={{ height: 18 }} />
          
          <Label c={c} text={t('TROUSER SIZE *', 'ट्राउज़र साइज़ *')} />
          <ChipRow options={['28', '30', '32', '34', '36', '38', '40', '42', '44']} value={trouser} onChange={setTrouser} c={c} />
          <View style={{ height: 18 }} />
          
          <Label c={c} text={t('SHOE SIZE (UK) *', 'जूते का साइज़ (UK) *')} />
          <ChipRow options={['4', '5', '6', '7', '8', '9', '10', '11', '12']} value={shoe} onChange={setShoe} c={c} />
          <View style={{ height: 18 }} />
          
          <Label c={c} text={t('HELMET SIZE *', 'हेलमेट साइज़ *')} />
          <ChipRow options={['S', 'M', 'L', 'XL']} value={helmet} onChange={setHelmet} c={c} />

          {needsEc ? (
            <>
              <View style={{ height: 22, marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }} />
              
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15, marginBottom: 14 }}>
                {t('Emergency contact', 'आपातकालीन संपर्क')}
              </Text>
              
              <Label c={c} text={t('CONTACT PERSON NAME *', 'संपर्क व्यक्ति का नाम *')} />
              <TextField c={c} value={ecName} onChange={setEcName} placeholder={t('Full name', 'पूरा नाम')} />
              <View style={{ height: 16 }} />
              
              <Label c={c} text={t('RELATION *', 'रिश्ता *')} />
              <ChipRow options={RELATION_OPTS} value={ecRel} onChange={setEcRel} c={c} />
              <View style={{ height: 16 }} />
              
              <Label c={c} text={t('EMERGENCY MOBILE NUMBER *', 'आपातकालीन मोबाइल नंबर *')} />
              <TextField c={c} value={ecPhone} onChange={(v: string) => { setEcPhone(v.replace(/\D/g, '').slice(0, 10)); setEcPhoneErr(''); }} placeholder={t('10-digit number', '10 अंकों का नंबर')} keyboard="number-pad" maxLength={10} err={!!ecPhoneErr} />
              {ecPhoneErr ? <ErrLine c={c} text={ecPhoneErr} /> : null}
            </>
          ) : null}

          {submitErr ? <ErrLine c={c} text={submitErr} /> : null}
          
          <Pressable 
            onPress={handleSubmit} 
            disabled={!canSubmit || submitting} 
            style={({ pressed }) => [styles.btn, { marginTop: 24, opacity: !canSubmit || submitting ? 0.45 : pressed ? 0.85 : 1 }]}
          >
            <LinearGradient colors={['#00DCF5', '#4B6BFF']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t('Save Details', 'डिटेल्स सेव करें')}</Text>
            )}
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnText: {
    color: '#fff',
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 16,
  },
});
