import React from 'react';
import { View, ScrollView, Text, Pressable, FlatList, Dimensions, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getBadges } from '@/lib/api';
import { ScreenBackground, GlassAppBar, useAppBarHeight, LoadingView, ErrorView, Card } from '@/components/ui';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function BadgesScreen() {
  const c = useColors();
  const { t } = useLang();
  const { token, ready } = useAuth();
  const router = useRouter();
  const appBarHeight = useAppBarHeight();

  const q = useQuery({ 
    queryKey: ['badges', token], 
    queryFn: () => getBadges(token as string),
    enabled: !!token && ready
  });

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <GlassAppBar title={t('My Badges', 'मेरे बैज')} back />
      
      {!ready || q.isLoading ? (
        <LoadingView />
      ) : !token ? (
        <ScrollView contentContainerStyle={{ paddingTop: appBarHeight + 40, paddingHorizontal: 16 }}>
          <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
            <Feather name="lock" size={28} color={c.magenta} />
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
              {t('Log in to see your badges', 'अपने बैज देखने के लिए लॉगिन करें')}
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
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginBottom: 8 }}>
            {t('Achievements', 'अचीवमेंट्स')}
          </Text>
          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, marginBottom: 24 }}>
            {t('Earn badges as you progress in Season 5.', 'सीज़न 5 में आगे बढ़ते हुए बैज कमाएं।')}
          </Text>

          <FlatList
            data={q.data.badges}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ gap: 12, justifyContent: 'space-between', marginBottom: 12 }}
            renderItem={({ item: b }) => (
              <View style={{ width: '48%', backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: b.earned ? c.magenta : c.line, overflow: 'hidden', padding: 16, alignItems: 'center' }}>
                {b.earned ? (
                  <LinearGradient colors={[`${c.violet}1A`, `${c.magenta}05`, 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                ) : null}
                
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: b.earned ? c.magenta : c.card2, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: b.earned ? c.card : c.line, elevation: b.earned ? 4 : 0 }}>
                  <Feather name={b.icon as any || 'award'} size={28} color={b.earned ? '#fff' : c.sub} />
                  {!b.earned && (
                    <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: c.bg, borderRadius: 10, padding: 2 }}>
                      <Feather name="lock" size={12} color={c.sub} />
                    </View>
                  )}
                </View>
                
                <Text style={{ color: b.earned ? c.ink : c.sub, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14, textAlign: 'center', marginBottom: 4 }}>
                  {t(b.title, b.titleHi)}
                </Text>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 8 }}>
                  {t(b.desc, b.descHi)}
                </Text>

                {b.earned && b.earnedAt ? (
                  <View style={{ backgroundColor: c.card2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: c.cyan, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10 }}>{formatDate(b.earnedAt)}</Text>
                  </View>
                ) : null}
              </View>
            )}
          />
        </ScrollView>
      ) : null}
    </View>
  );
}
