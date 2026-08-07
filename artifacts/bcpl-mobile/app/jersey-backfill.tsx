import React, { useState, useEffect } from 'react';
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
const TROUSER_OPTS = ['28', '30', '32', '34', '36', '38', '40', '42', '44'];
const SHOE_OPTS = ['4', '5', '6', '7', '8', '9', '10', '11', '12'];
const HELMET_OPTS = ['S', 'M', 'L', 'XL'];
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
  const [ecRel, setEcRel] = useState('Friend');
  const [ecPhone, setEcPhone] = useState('');
  const [ecPhoneErr, setEcPhoneErr] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const q = useQuery({
    queryKey: ['profileCompletion', token],
    queryFn: () => getProfileCompletion(token as string),
    enabled: !!token,
  });

  useEffect(() => {
    if (q.data?.have) {
      if (q.data.have.tshirtSize) setTshirt(q.data.have.tshirtSize);
      if (q.data.have.trouserSize) setTrouser(q.data.have.trouserSize);
      if (q.data.have.shoeSize) setShoe(q.data.have.shoeSize);
      if (q.data.have.helmetSize) setHelmet(q.data.have.helmetSize);
      if (q.data.have.emergencyName) setEcName(q.data.have.emergencyName);
      if (q.data.have.emergencyPhone) setEcPhone(q.data.have.emergencyPhone);
    }
  }, [q.data]);

  // The schema requires emergencyName and emergencyPhone unconditionally.
  const emergencyOk = !!(ecName.trim() && ecRel && /^\d{10}$/.test(ecPhone));
  const canSubmit = !!tshirt && !!trouser && !!shoe && !!helmet && emergencyOk && !ecPhoneErr;

  const handleSubmit = async () => {
    if (!token) return;
    if (!/^\d{10}$/.test(ecPhone)) { setEcPhoneErr(t('Enter a 10-digit mobile number', '10 अंकों का मोबाइल नंबर डालें')); return; }
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
        emergencyName: ecName.trim(),
        emergencyRelation: ecRel,
        emergencyPhone: ecPhone,
      });
      qc.invalidateQueries({ queryKey: ['profileCompletion'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/journey');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setSubmitErr(err.message || 'Verification failed');
      } else {
        setSubmitErr('Network error. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (q.isLoading) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('Complete Profile', 'प्रोफाइल पूरी करें')} back={true} /><LoadingView /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('Complete Profile', 'प्रोफाइल पूरी करें')} back={true} />
      
      <ScrollView contentContainerStyle={{ paddingTop: appBarHeight + 16, paddingBottom: 60, paddingHorizontal: 16 }}>
        <Text style={{ color: c.ink, fontSize: 24, fontFamily: 'BricolageGrotesque_800ExtraBold', marginBottom: 8 }}>
          {t('A Few More Details', 'कुछ और जानकारी')}
        </Text>
        <Text style={{ color: c.sub, fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 24, lineHeight: 22 }}>
          {t('We need your jersey sizing and emergency contact to finalize your player profile.', 'आपकी प्लेयर प्रोफाइल को अंतिम रूप देने के लिए हमें आपकी जर्सी साइज और आपातकालीन संपर्क की आवश्यकता है।')}
        </Text>

        <Card style={{ padding: 20 }}>
          <Text style={{ color: c.ink, fontSize: 16, fontFamily: 'BricolageGrotesque_700Bold', marginBottom: 16 }}>{t('Team Kit Sizing', 'टीम किट साइज')}</Text>
          
          <Label c={c} text={t('T-SHIRT SIZE *', 'टी-शर्ट साइज *')} />
          <ChipRow options={TSHIRT_OPTS} value={tshirt} onChange={setTshirt} c={c} />
          <View style={{ height: 16 }} />
          
          <Label c={c} text={t('TROUSER (WAIST INCHES) *', 'ट्राउज़र (कमर इंच) *')} />
          <ChipRow options={TROUSER_OPTS} value={trouser} onChange={setTrouser} c={c} />
          <View style={{ height: 16 }} />
          
          <Label c={c} text={t('SHOE SIZE (UK) *', 'जूते का साइज (UK) *')} />
          <ChipRow options={SHOE_OPTS} value={shoe} onChange={setShoe} c={c} />
          <View style={{ height: 16 }} />
          
          <Label c={c} text={t('HELMET SIZE *', 'हेलमेट साइज *')} />
          <ChipRow options={HELMET_OPTS} value={helmet} onChange={setHelmet} c={c} />

          <View style={{ height: 32 }} />
          <Text style={{ color: c.ink, fontSize: 16, fontFamily: 'BricolageGrotesque_700Bold', marginBottom: 16 }}>{t('Emergency Contact', 'आपातकालीन संपर्क')}</Text>
          
          <Label c={c} text={t('CONTACT NAME *', 'संपर्क का नाम *')} />
          <TextField c={c} value={ecName} onChange={setEcName} placeholder={t('Full Name', 'पूरा नाम')} />
          <View style={{ height: 16 }} />
          
          <Label c={c} text={t('RELATION *', 'रिश्ता *')} />
          <ChipRow options={RELATION_OPTS} value={ecRel} onChange={setEcRel} c={c} />
          <View style={{ height: 16 }} />
          
          <Label c={c} text={t('EMERGENCY MOBILE NUMBER *', 'आपातकालीन मोबाइल नंबर *')} />
          <TextField c={c} value={ecPhone} onChange={(v: string) => { setEcPhone(v.replace(/\D/g, '').slice(0, 10)); setEcPhoneErr(''); }} placeholder={t('10-digit number', '10 अंकों का नंबर')} keyboard="number-pad" maxLength={10} err={!!ecPhoneErr} />
          {ecPhoneErr ? <ErrLine c={c} text={ecPhoneErr} /> : null}

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