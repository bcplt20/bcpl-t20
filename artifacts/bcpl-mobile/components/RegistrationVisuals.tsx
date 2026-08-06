import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';

export function RegistrationHero() {
  const c = useColors();
  const { t } = useLang();
  
  return (
    <View style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: c.line, backgroundColor: c.card2 }}>
      <LinearGradient colors={['rgba(91,43,240,0.15)', 'rgba(255,61,166,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
      
      {/* Decorative strokes */}
      <View style={{ position: 'absolute', right: -40, top: -20, transform: [{ rotate: '15deg' }] }}>
        <LinearGradient colors={['#FF3DA6', '#5B2BF0']} style={{ width: 120, height: 16, borderRadius: 8, opacity: 0.8, marginBottom: 8 }} />
        <LinearGradient colors={['#00DCF5', '#16E0A3']} style={{ width: 80, height: 12, borderRadius: 6, opacity: 0.6, marginLeft: 20 }} />
      </View>
      
      <View style={{ padding: 24 }}>
        <Image source={require('../assets/images/bcpl-ball-clean.png')} style={{ width: 48, height: 48, marginBottom: 16 }} contentFit="contain" />
        
        <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, color: c.ink, lineHeight: 30 }}>
          {t('From Office to Stadium', 'ऑफिस से स्टेडियम तक')}
        </Text>
        <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: c.sub, marginTop: 8, lineHeight: 22 }}>
          {t('A 5-step journey to your professional cricket debut under floodlights.', 'प्रोफेशनल क्रिकेट डेब्यू तक का 5-स्टेप सफर।')}
        </Text>
      </View>
      
      <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 16 }}>
        {[
          { n: '1', icon: 'edit-3', en: 'Register & Pay', hi: 'रजिस्टर और पे', den: 'Phase 1 entry fee', dhi: 'फेज 1 एंट्री फीस', color: ['#FF3DA6', '#FF1A75'] },
          { n: '2', icon: 'video', en: 'Video Trial', hi: 'वीडियो ट्रायल', den: '30-60s skills clip', dhi: '30-60s स्किल्स क्लिप', color: ['#5B2BF0', '#9B2FF0'] },
          { n: '3', icon: 'activity', en: 'Physical Trial', hi: 'फिज़िकल ट्रायल', den: 'Standardized assessment', dhi: 'स्टैण्डर्ड असेसमेंट', color: ['#00E5FF', '#00B3FF'] },
          { n: '4', icon: 'users', en: 'Player Auction', hi: 'ऑक्शन', den: 'Franchise bidding', dhi: 'फ्रैंचाइज़ी बिडिंग', color: ['#FFC53D', '#FF8A3D'] },
          { n: '5', icon: 'star', en: 'BCPL Season 5', hi: 'BCPL खेलें', den: 'Corporate T20 League', dhi: 'कॉर्पोरेट T20 लीग', color: ['#B6FF3C', '#16E0A3'] },
        ].map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <LinearGradient colors={s.color as [string, string]} style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name={s.icon as any} size={20} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>{t(s.en, s.hi)}</Text>
              <Text style={{ color: c.sub, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2 }}>{t(s.den, s.dhi)}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderTopWidth: 1, borderTopColor: c.line }}>
        <Text style={{ color: c.sub, fontSize: 12, lineHeight: 18, fontFamily: 'PlusJakartaSans_500Medium' }}>
          {t('Phase 2 fee applies only after Phase 1 qualification. Fees cover participation only — see bcplt20.com for rules.', 'फेज़ 2 की फ़ीस सिर्फ़ फेज़ 1 क्वालिफ़ाई करने के बाद लगती है। फ़ीस केवल भागीदारी के लिए है — पूरे नियम bcplt20.com पर देखें।')}
        </Text>
      </View>
    </View>
  );
}

// Website shows a 4-node "Step X of 4" indicator (Details → Role → City → Pay).
// 'done' is an app-only success screen and is treated as "all steps complete".
export function StepProgressBar({ step }: { step: 'details' | 'role' | 'city' | 'pay' | 'done' }) {
  const c = useColors();
  const { t } = useLang();
  const steps = ['details', 'role', 'city', 'pay'];
  const idx = step === 'done' ? steps.length - 1 : steps.indexOf(step);
  const shown = Math.min(idx + 1, steps.length);

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
        {steps.map((s, i) => (
          <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= idx ? 'transparent' : c.line, overflow: 'hidden' }}>
            {i <= idx && <LinearGradient colors={['#5B2BF0', '#FF3DA6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
          </View>
        ))}
      </View>
      <Text style={{ color: c.sub, fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 1, textTransform: 'uppercase' }}>
        {t(`Step ${shown} of 4`, `Step ${shown} / 4`)}
      </Text>
    </View>
  );
}