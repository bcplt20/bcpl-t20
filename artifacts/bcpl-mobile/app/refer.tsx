import React, { useState } from 'react';
import { View, ScrollView, Text, Pressable, Share, Platform, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getReferral } from '@/lib/api';
import { ScreenBackground, GlassAppBar, useAppBarHeight, LoadingView, ErrorView, Card } from '@/components/ui';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReferScreen() {
  const c = useColors();
  const { t } = useLang();
  const { token, ready } = useAuth();
  const router = useRouter();
  const appBarHeight = useAppBarHeight();

  const q = useQuery({ 
    queryKey: ['referral', token], 
    queryFn: () => getReferral(token as string),
    enabled: !!token && ready
  });

  const handleShare = async () => {
    if (!q.data) return;
    try {
      const message = t(
        `Join BCPL Season 5! India's corporate cricket league. Use my code ${q.data.code} to register: ${q.data.link}`,
        `BCPL Season 5 से जुड़ें! इंडिया की कॉर्पोरेट क्रिकेट लीग। मेरा कोड ${q.data.code} इस्तेमाल करके रजिस्टर करें: ${q.data.link}`
      );
      await Share.share({ message, url: q.data.link });
    } catch (e) {
      console.log('Share error', e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <GlassAppBar title={t('Refer & Earn', 'रेफर करें और कमाएं')} back />
      
      {!ready || q.isLoading ? (
        <LoadingView />
      ) : !token ? (
        <ScrollView contentContainerStyle={{ paddingTop: appBarHeight + 40, paddingHorizontal: 16 }}>
          <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
            <Feather name="lock" size={28} color={c.magenta} />
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
              {t('Log in to view referrals', 'रेफरल देखने के लिए लॉगिन करें')}
            </Text>
            <Pressable onPress={() => router.push('/login')} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 14, overflow: 'hidden', paddingHorizontal: 24, marginTop: 24, opacity: pressed ? 0.85 : 1 }]}>
              <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>{t('Login with OTP', 'OTP से लॉगिन')}</Text>
            </Pressable>
          </Card>
        </ScrollView>
      ) : q.isError ? (
        <ErrorView onRetry={() => q.refetch()} />
      ) : q.data ? (
        <ScrollView contentContainerStyle={{ paddingTop: appBarHeight + 16, paddingBottom: 60, paddingHorizontal: 16 }}>
          <Card style={{ overflow: 'hidden', padding: 24, alignItems: 'center' }}>
            <LinearGradient colors={[`${c.violet}20`, `${c.magenta}05`, 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.magenta, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="gift" size={28} color="#fff" />
            </View>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, textAlign: 'center', marginBottom: 8 }}>
              {t('Refer Friends, Win Gear', 'दोस्तों को रेफर करें, किट जीतें')}
            </Text>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
              {t(`Get ${q.data.tiers?.[0]?.threshold || 3} friends to register and pay Phase 1 fee to earn BCPL training gear.`, `${q.data.tiers?.[0]?.threshold || 3} दोस्तों को फेज 1 पेमेंट के साथ रजिस्टर करवाएं और BCPL ट्रेनिंग किट पाएं।`)}
            </Text>

            <View style={{ backgroundColor: c.card2, borderWidth: 1, borderColor: c.line, borderRadius: 16, width: '100%', padding: 16, alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                {t('Your Referral Code', 'आपका रेफरल कोड')}
              </Text>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32, letterSpacing: 2 }}>
                {q.data.code}
              </Text>
            </View>

            <Pressable onPress={handleShare} style={({ pressed }) => ({ width: '100%', height: 52, borderRadius: 14, overflow: 'hidden', opacity: pressed ? 0.8 : 1 })}>
              <LinearGradient colors={[c.violet, c.magenta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                <Feather name="share-2" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>{t('Share with Friends', 'दोस्तों के साथ शेयर करें')}</Text>
              </LinearGradient>
            </Pressable>
          </Card>

          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 32, marginBottom: 16 }}>
            {t('Your Progress', 'आपकी प्रोग्रेस')}
          </Text>
          
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
                {t('Qualified Referrals', 'क्वालिफाइड रेफरल')}
              </Text>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20 }}>
                {q.data.paid} / {q.data.tiers?.[0]?.threshold || 3}
              </Text>
            </View>
            
            <View style={{ height: 8, borderRadius: 4, backgroundColor: c.card2, overflow: 'hidden', marginBottom: 16 }}>
              <View style={{ width: `${Math.min(100, (q.data.paid / (q.data.tiers?.[0]?.threshold || 3)) * 100)}%`, height: '100%', backgroundColor: c.cyan, borderRadius: 4 }} />
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 }}>
                {q.data.joined} {t('registered total', 'ने कुल रजिस्टर किया')}
              </Text>
              {q.data.tiers?.[0]?.rewardGiven ? (
                <Text style={{ color: c.lime, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>{t('Reward Granted!', 'इनाम मिल गया!')}</Text>
              ) : q.data.tiers?.[0]?.reached ? (
                <Text style={{ color: c.cyan, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>{t('Reward Unlocked!', 'इनाम खुल गया!')}</Text>
              ) : null}
            </View>
          </Card>
        </ScrollView>
      ) : null}
    </View>
  );
}
