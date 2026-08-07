import React from 'react';
import { View, ScrollView, Text, Image, StyleSheet, Linking, Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { ScreenBackground, GlassAppBar, useAppBarHeight } from '@/components/ui';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const STATS = [
  { num: '2.5L+', labelEn: 'Players', labelHi: 'खिलाड़ी', subEn: 'registered across all seasons', subHi: 'सभी seasons में register' },
  { num: 'Pan-India', labelEn: 'Trial Network', labelHi: 'Trial नेटवर्क', subEn: 'growing every season', subHi: 'हर season बढ़ रहा' },
  { num: '4', labelEn: 'Seasons', labelHi: 'Seasons', subEn: 'completed since 2023', subHi: '2023 से पूरे' },
  { num: '10', labelEn: 'Franchises', labelHi: 'Franchises', subEn: 'competing in Season 5', subHi: 'Season 5 में' },
];

const TIMELINE = [
  { year: '2023', textEn: 'Season 1 — Founded in Delhi. Working professionals took the field for the first time. One unforgettable dream born.', textHi: 'Season 1 — Delhi में शुरुआत। Working professionals पहली बार मैदान में उतरे। एक अविस्मरणीय सपना जन्मा।' },
  { year: '2024', textEn: 'Season 2 — Growth exploded. Players joined from cities across India. Franchise auction system introduced. Corporate cricket found its identity.', textHi: 'Season 2 — तेज़ी से बढ़ोतरी। पूरे भारत के शहरों से खिलाड़ी जुड़े। Franchise auction system शुरू। Corporate cricket को अपनी पहचान मिली।' },
  { year: '2025', textEn: 'Season 3 & 4 — Two powerful seasons. Registrations grew rapidly across cities, with national media coverage. BCPL established itself as India\'s corporate cricket league.', textHi: 'Season 3 और 4 — दो शानदार seasons। Registrations कई शहरों में तेज़ी से बढ़े, national media coverage भी मिला। BCPL भारत की corporate cricket league के रूप में स्थापित हुई।' },
  { year: '2026', textEn: 'Season 4 concluded — a large wave of players registered across cities. Tournament held in October 2026. The stage was set for the grandest season.', textHi: 'Season 4 समाप्त — कई शहरों से खिलाड़ियों की बड़ी लहर register हुई। October 2026 में tournament हुआ। सबसे बड़े season के लिए तैयारी।' },
  { year: '2026–27', textEn: 'Season 5 — Registrations open now. 50+ trial cities across India. 10 franchise teams. ₹15 Crore+ prize pool. India\'s corporate cricket league for working professionals awaits you.', textHi: 'Season 5 — Registrations अब खुले हैं। पूरे भारत में 50+ trial cities। 10 franchise teams। ₹15 करोड़+ prize pool। Working professionals के लिए भारत की corporate cricket league आपका इंतज़ार कर रही है।' },
];

const HOW_WE_HELP = [
  { icon: 'award', titleEn: 'vs Local Cricket', titleHi: 'vs Local Cricket', bodyEn: 'No politics. No favoritism. Pure merit through criteria-based video assessment. Every applicant gets a fair, anonymous evaluation.', bodyHi: 'कोई पक्षपात नहीं। Pure merit through criteria-based video assessment। हर applicant को fair, anonymous evaluation मिलती है।' },
  { icon: 'hexagon', titleEn: 'vs Amateur Leagues', titleHi: 'vs Amateur Leagues', bodyEn: 'Professional grounds. Franchise system. Real auctions. This is as close to IPL as corporate cricket gets.', bodyHi: 'Professional grounds। Franchise system। Real auctions। Corporate cricket में IPL के सबसे करीब।' },
  { icon: 'zap', titleEn: 'vs Doing Nothing', titleHi: 'vs कुछ न करना', bodyEn: '₹299 gets you in. No other league offers this entry point for a shot at professional-grade cricket.', bodyHi: '₹299 में entry। कोई दूसरी league इतने कम में professional-grade cricket का मौका नहीं देती।' },
];

const STEPS = [
  { n: '1', title: 'Register online', titleHi: 'ऑनलाइन रजिस्टर करें', body: 'Registration takes about five minutes. You receive a unique registration ID.', bodyHi: 'रजिस्ट्रेशन में लगभग पांच मिनट लगते हैं। आपको एक unique registration ID मिलती है।' },
  { n: '2', title: 'Upload your video', titleHi: 'अपना वीडियो अपलोड करें', body: 'Within 15 days of registering, upload a 30–90 second cricket skills video.', bodyHi: 'रजिस्टर करने के 15 दिनों के भीतर, 30-90 सेकंड का क्रिकेट कौशल वीडियो अपलोड करें।' },
  { n: '3', title: 'Get your result', titleHi: 'अपना परिणाम प्राप्त करें', body: 'Your video is assessed under BCPL\'s framework, and result shared within 15 days.', bodyHi: 'आपके वीडियो का मूल्यांकन BCPL फ्रेमवर्क के तहत किया जाता है, और परिणाम 15 दिनों के भीतर साझा किया जाता है।' },
  { n: '4', title: 'Attend physical trials', titleHi: 'फिजिकल ट्रायल में भाग लें', body: 'A physical, standardised cricket trial at an authorised venue in your chosen city.', bodyHi: 'आपके चुने हुए शहर में एक अधिकृत स्थान पर एक भौतिक, मानकीकृत क्रिकेट ट्रायल।' },
  { n: '5', title: 'Auction & Teams', titleHi: 'ऑक्शन और टीमें', body: 'Players who qualify for the Auction Pool are eligible for the player-auction process.', bodyHi: 'जो खिलाड़ी ऑक्शन पूल के लिए क्वालीफाई करते हैं, वे खिलाड़ी-ऑक्शन प्रक्रिया के लिए पात्र होते हैं।' },
];

export default function AboutScreen() {
  const { t } = useLang();
  const c = useColors();
  const appBarHeight = useAppBarHeight();
  
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('About BCPL', 'BCPL के बारे में')} back />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: appBarHeight }} />
        {/* Hero */}
        <View style={{ padding: 24, paddingTop: 32, alignItems: 'center' }}>
          <Image source={require('../assets/images/bcpl-ball.png')} style={{ width: 120, height: 120, marginBottom: 24 }} resizeMode="contain" />
          <Text style={{ color: c.getAccentText(c.violet), fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 12 }}>
            {t('OUR STORY', 'हमारी कहानी')}
          </Text>
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32, textAlign: 'center', lineHeight: 36, marginBottom: 16 }}>
            {t('WHERE OFFICES', 'जहां ऑफिसें')}
            {'\n'}
            <Text style={{ color: c.getAccentText(c.magenta) }}>{t('MEET STADIUMS.', 'स्टेडियम बनती हैं।')}</Text>
          </Text>
          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 300 }}>
            {t("India's corporate cricket league. Turning working professionals into franchise cricketers since 2023.", "भारत की कॉर्पोरेट क्रिकेट लीग। 2023 से working professionals को franchise cricketers बना रहे हैं।")}
          </Text>
        </View>

        {/* Mission */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <LinearGradient colors={['rgba(255,61,166,0.15)', 'rgba(255,61,166,0.05)']} style={{ padding: 24, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,61,166,0.2)' }}>
            <Feather name="zap" size={24} color={c.getAccentText(c.magenta)} style={{ marginBottom: 12 }} />
            <Text style={{ color: c.ink, fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 24, fontStyle: 'italic' }}>
              "{t("Every working professional who watched IPL and thought 'I could have played' deserves a real shot. Millions stopped competitive cricket when work took over. BCPL exists to give them the stage they never got.", "हर working professional जो IPL देखते हुए सोचता है 'मैं भी खेल सकता था' — उसे एक असली मौका मिलना चाहिए। लाखों लोगों ने काम की वजह से competitive cricket छोड़ दी। BCPL उन्हें वो stage देने के लिए है जो उन्हें कभी नहीं मिला।")}"
            </Text>
            <Text style={{ color: c.getAccentText(c.magenta), fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1, marginTop: 16, textTransform: 'uppercase' }}>
              — {t('BCPL FOUNDING MISSION', 'BCPL की स्थापना मिशन')}
            </Text>
          </LinearGradient>
        </View>

        {/* How We Are Different */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Text style={{ color: c.sub, fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
            {t('WHY BCPL', 'क्यों BCPL')}
          </Text>
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginBottom: 20, textAlign: 'center' }}>
            {t('How We Are ', 'हम कैसे ')}<Text style={{ color: c.getAccentText(c.cyan) }}>{t('Different', 'अलग हैं')}</Text>
          </Text>
          <View style={{ gap: 12 }}>
            {HOW_WE_HELP.map((item, i) => (
              <View key={i} style={{ backgroundColor: c.card2, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: c.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,220,245,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={item.icon as any} size={16} color={c.getAccentText(c.cyan)} />
                  </View>
                  <Text style={{ color: c.getAccentText(c.cyan), fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>{t(item.titleEn, item.titleHi)}</Text>
                </View>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 }}>
                  {t(item.bodyEn, item.bodyHi)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {STATS.map((s, i) => (
              <View key={i} style={{ flex: 1, minWidth: '45%', backgroundColor: c.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: c.line, alignItems: 'center' }}>
                <Text style={{ color: c.getAccentText(c.violet), fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 28, marginBottom: 4 }}>{s.num}</Text>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 4 }}>{t(s.labelEn, s.labelHi)}</Text>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, textAlign: 'center', lineHeight: 15 }}>{t(s.subEn, s.subHi)}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Steps to Join */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginBottom: 20, textAlign: 'center' }}>
            {t('The Process', 'प्रक्रिया')}
          </Text>
          <View style={{ gap: 16 }}>
            {STEPS.map((s, i) => (
              <View key={s.n} style={{ flexDirection: 'row', gap: 16, backgroundColor: c.card2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: c.line }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,61,166,0.1)', borderWidth: 1, borderColor: 'rgba(255,61,166,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.getAccentText(c.magenta), fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>{s.n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, marginBottom: 4 }}>{t(s.title, s.titleHi)}</Text>
                  <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 19 }}>{t(s.body, s.bodyHi)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Timeline */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Text style={{ color: c.sub, fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
            {t('OUR JOURNEY', 'हमारा सफर')}
          </Text>
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginBottom: 24, textAlign: 'center' }}>
            {t('Five Seasons of ', 'पाँच Seasons की ')}<Text style={{ color: c.getAccentText(c.violet) }}>{t('Legacy', 'विरासत')}</Text>
          </Text>
          
          <View style={{ paddingLeft: 8 }}>
            {TIMELINE.map((tm, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: i === TIMELINE.length - 1 ? 0 : 20 }}>
                <View style={{ width: 2, backgroundColor: c.line, position: 'absolute', left: 24, top: 48, bottom: -20, display: i === TIMELINE.length - 1 ? 'none' : 'flex' }} />
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: c.card, borderWidth: 2, borderColor: c.getAccentText(c.violet), alignItems: 'center', justifyContent: 'center', zIndex: 1, marginRight: 16 }}>
                  <Text style={{ color: c.getAccentText(c.violet), fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }}>{tm.year.split('–')[0]}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: c.card2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.line, marginTop: 4 }}>
                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 }}>
                    {t(tm.textEn, tm.textHi)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer / Contact */}
        <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 32 }}>
          <Pressable onPress={() => Linking.openURL('https://bcplt20.com')} style={({ pressed }) => [{ backgroundColor: c.card, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: c.line }, pressed && { opacity: 0.8 }]}>
            <Feather name="globe" size={24} color={c.cyan} style={{ marginBottom: 12 }} />
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, marginBottom: 4 }}>bcplt20.com</Text>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 }}>{t('Visit our official website', 'हमारी आधिकारिक वेबसाइट देखें')}</Text>
          </Pressable>
        </View>
        
        <View style={{ alignItems: 'center', opacity: 0.5 }}>
          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 }}>BCPL v{Constants.expoConfig?.version || '1.0.0'}</Text>
        </View>

      </ScrollView>
    </View>
  );
}
