import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { communityMyMatches } from '@/lib/api';
import { GlassAppBar, ScreenBackground, Card, useAppBarHeight, useBottomNavHeight, ErrorView, LoadingView, GradientTag } from '@/components/ui';

export default function ScorerHome() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const { t } = useLang();
  const c = useColors();
  
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const query = useQuery({
    queryKey: ['community-mine'],
    queryFn: () => communityMyMatches(token as string),
    enabled: !!token,
  });

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('Scorer', 'स्कोरर')} /><LoadingView /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('Scorer', 'स्कोरर')} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomNavHeight, paddingTop: appBarHeight }}
        refreshControl={
          token ? <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={c.violet} /> : undefined
        }
      >
        <View style={{ padding: 16, gap: 16 }}>
          {!token ? (
            <Card style={{ alignItems: 'center', paddingVertical: 40, marginTop: 32 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${c.violet}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="stopwatch" size={32} color={c.violet} />
              </View>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, textAlign: 'center' }}>
                {t('Login to score matches', 'मैच स्कोर करने के लिए लॉगिन करें')}
              </Text>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 }}>
                {t('Create and score your own community cricket matches easily.', 'अपने लोकल क्रिकेट मैच बनाएं और स्कोर करें।')}
              </Text>
              <Pressable
                onPress={() => router.push('/login')}
                style={({ pressed }) => [{ width: '100%', height: 48, borderRadius: 12, overflow: 'hidden', opacity: pressed ? 0.8 : 1 }]}
              >
                <LinearGradient colors={['#7C5CFF', '#FF3DA6']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>
                    {t('Login Now', 'लॉगिन करें')}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Card>
          ) : (
            <>
              <Pressable
                onPress={() => router.push('/scorer/new')}
                style={({ pressed }) => [{ borderRadius: 16, overflow: 'hidden', opacity: pressed ? 0.9 : 1, marginTop: 16 }]}
              >
                <LinearGradient colors={['#7C5CFF', '#FF3DA6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12 }}>
                  <Feather name="plus-circle" size={24} color="#fff" />
                  <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20 }}>
                    {t('नया Match / New Match', 'नया Match / New Match')}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, marginTop: 24 }}>
                {t('My Matches', 'मेरे मैच')}
              </Text>

              {query.isLoading ? (
                <LoadingView />
              ) : query.isError ? (
                <ErrorView onRetry={() => query.refetch()} />
              ) : query.data?.matches.length === 0 ? (
                <Card style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Feather name="inbox" size={32} color={c.sub} style={{ marginBottom: 12 }} />
                  <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15 }}>
                    {t('No matches yet.', 'अभी कोई मैच नहीं है।')}
                  </Text>
                </Card>
              ) : (
                query.data?.matches.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => router.push(`/scorer/${m.id}?owned=1`)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                  >
                    <Card style={{ padding: 16 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18 }}>
                            {m.team1} vs {m.team2}
                          </Text>
                          {m.venue && (
                            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, marginTop: 4 }}>
                              <Feather name="map-pin" size={12} /> {m.venue}
                            </Text>
                          )}
                        </View>
                        {m.status === 'live' || m.status === 'innings2' ? (
                          <GradientTag label="LIVE" color={c.magenta} />
                        ) : (
                          <GradientTag label="DONE" color={c.cyan} />
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 }}>
                          {m.oversLimit} Overs · {new Date(m.createdAt).toLocaleDateString()}
                        </Text>
                        <Feather name="chevron-right" size={20} color={c.sub} />
                      </View>
                    </Card>
                  </Pressable>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
