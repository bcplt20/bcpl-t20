import React from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getMatches, getPointsTable, SITE_ASSETS, type Match } from '@/lib/api';
import { NEWS_ARTICLES } from '@/data/news';
import { Badge, Card, TeamLogo } from '@/components/ui';
import { MatchCard } from '@/components/MatchCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function pickFeatured(matches: Match[]): Match[] {
  const live = matches.filter((m) => m.status === 'live');
  if (live.length > 0) return live.slice(0, 2);
  const upcoming = matches
    .filter((m) => m.status !== 'completed' && m.status !== 'live')
    .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''));
  const recent = matches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => (b.scheduledAt ?? '').localeCompare(a.scheduledAt ?? ''));
  return [...upcoming.slice(0, 1), ...recent.slice(0, 1)];
}

export default function HomeScreen() {
  const c = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();

  const matchesQ = useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
    refetchInterval: 60_000,
  });
  const pointsQ = useQuery({ queryKey: ['points'], queryFn: getPointsTable });

  const matches = matchesQ.data?.matches ?? [];
  const featured = pickFeatured(matches);
  const topTeams = (pointsQ.data?.table ?? []).slice(0, 3);
  const latestNews = NEWS_ARTICLES.slice(0, 2);
  const anyLive = matches.some((m) => m.status === 'live');

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 100 }}
        refreshControl={
          <RefreshControl
            refreshing={matchesQ.isRefetching}
            onRefresh={() => {
              matchesQ.refetch();
              pointsQ.refetch();
            }}
            tintColor={c.primary}
          />
        }
      >
        <ScreenHeader
          title={user ? t(`Hello, ${user.name.split(' ')[0]}`, `नमस्ते, ${user.name.split(' ')[0]}`) : 'Bhartiya Corporate Premier League'}
          subtitle="Office से Stadium तक"
          subtitleColor="#FF6B00"
        />

        {/* Register hero banner */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <Pressable onPress={() => router.push('/register')} testID="hero-register">
            <View style={styles.hero}>
              <Image
                source={{ uri: `${SITE_ASSETS}/bcpl-assets/stadium-hero.jpg` }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
              {/* deep navy → transparent shade so text stays crisp */}
              <View style={styles.heroShade} />
              <View style={styles.heroShadeLeft} />
              {/* gold hairline frame for a premium feel */}
              <View pointerEvents="none" style={styles.heroFrame} />
              <Image
                source={require('../../assets/images/ganguly-cutout.png')}
                style={styles.heroGanguly}
                contentFit="contain"
                contentPosition="bottom right"
              />
              <View style={{ padding: 18, paddingRight: 140, minHeight: 168, justifyContent: 'center' }}>
                <Text style={styles.heroKick}>SEASON 5 · {t('REGISTRATIONS OPEN', 'रजिस्ट्रेशन शुरू')}</Text>
                <Text style={styles.heroFee}>₹299<Text style={styles.heroFeeGst}> +GST</Text></Text>
                <Text style={styles.heroFeeSub}>{t('Batsman · Bowler · Wicketkeeper', 'बल्लेबाज़ · गेंदबाज़ · विकेटकीपर')}</Text>
                <Text style={styles.heroFeeSub}>₹399 +GST · {t('All-Rounder', 'ऑलराउंडर')}</Text>
                <View style={styles.heroCta}>
                  <Text style={styles.heroCtaTxt}>{t('Register Now', 'अभी रजिस्टर करें')}</Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        {anyLive ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 4, marginTop: 12 }}>
            <Badge label="Match live now" tone="live" />
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          {featured.length > 0 ? (
            featured.map((m) => <MatchCard key={m.id} match={m} />)
          ) : matchesQ.isLoading ? (
            <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_500Medium' }}>Loading matches…</Text>
            </Card>
          ) : (
            <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
              <View style={styles.iconCircle}>
                <Feather name="calendar" size={28} color={c.mutedForeground} />
              </View>
              <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 16 }}>Schedule</Text>
              <Text style={{ color: c.mutedForeground, marginTop: 6, textAlign: 'center', fontSize: 13, lineHeight: 20 }}>
                {t('Season 5 schedule coming soon — October 2026', 'सीज़न 5 का शेड्यूल जल्द आ रहा है — अक्टूबर 2026')}
              </Text>
            </Card>
          )}
        </View>

        {topTeams.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <View style={styles.sectionRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: c.foreground }]}>Points Table</Text>
                <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 2 }}>Season 5 Standings</Text>
              </View>
              <Pressable onPress={() => router.push('/points')} testID="see-points" style={styles.seeAllBtn}>
                <Text style={{ color: c.accent, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                  {t('Full table', 'पूरी टेबल')}
                </Text>
                <Feather name="chevron-right" size={14} color={c.accent} />
              </Pressable>
            </View>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {topTeams.map((t, i) => (
                <View key={t.team} style={[styles.pointsRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                  <Text style={[styles.pos, { color: i === 0 ? c.accent : c.mutedForeground }]}>{i + 1}</Text>
                  <TeamLogo name={t.team} size={28} />
                  <Text style={[styles.teamName, { color: c.foreground }]} numberOfLines={1}>
                    {t.team}
                  </Text>
                  <Text style={{ color: c.mutedForeground, fontSize: 12.5, width: 36, textAlign: 'center' }}>{t.played} M</Text>
                  <View style={styles.ptsPill}>
                    <Text style={[styles.pts, { color: c.foreground }]}>{t.points}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
          <View style={styles.sectionRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Latest News</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 2 }}>League Updates</Text>
            </View>
            <Pressable onPress={() => router.push('/news')} testID="see-news" style={styles.seeAllBtn}>
              <Text style={{ color: c.accent, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                {t('All news', 'सारी खबरें')}
              </Text>
              <Feather name="chevron-right" size={14} color={c.accent} />
            </Pressable>
          </View>
          {latestNews.map((n) => (
            <Pressable
              key={n.slug}
              onPress={() => router.push(`/news/${n.slug}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
              testID={`home-news-${n.slug}`}
            >
              <Card style={styles.newsCard}>
                <Image
                  source={{ uri: `${SITE_ASSETS}/bcpl-assets/news/${n.image}` }}
                  style={styles.newsImage}
                  contentFit="cover"
                  transition={150}
                />
                <View style={styles.newsContent}>
                  <View style={styles.newsTagRow}>
                    <Text style={{ color: c.accent, fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
                      {n.tag.toUpperCase()}
                    </Text>
                    <Text style={{ color: c.mutedForeground, fontSize: 11 }}>• {n.date}</Text>
                  </View>
                  <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 6, lineHeight: 20 }} numberOfLines={2}>
                    {n.title}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(232,178,61,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hero: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 132,
    justifyContent: 'flex-end',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9,19,44,0.55)',
  },
  heroKick: {
    color: '#E8B23D',
    fontFamily: 'Inter_700Bold',
    fontSize: 10.5,
    letterSpacing: 2,
  },
  heroTitle: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 21, marginTop: 3 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 3, fontFamily: 'Inter_400Regular' },
  heroShadeLeft: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderLeftWidth: 200,
    borderLeftColor: 'rgba(9,19,44,0.35)',
  },
  heroFrame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,178,61,0.45)',
  },
  heroGanguly: {
    position: 'absolute',
    right: -6,
    bottom: 0,
    width: 150,
    height: '96%',
  },
  heroFee: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 34, marginTop: 6, lineHeight: 38 },
  heroFeeGst: { color: '#E8B23D', fontSize: 16, fontFamily: 'Inter_700Bold' },
  heroFeeSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2, fontFamily: 'Inter_500Medium' },
  heroCta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B00',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 12,
    shadowColor: '#FF6B00',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  heroCtaTxt: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.3 },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pos: { width: 16, fontFamily: 'Inter_700Bold', fontSize: 14 },
  teamName: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  ptsPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pts: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  newsCard: {
    marginBottom: 12,
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
    alignItems: 'stretch',
  },
  newsImage: {
    width: 100,
    height: '100%',
  },
  newsContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  newsTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
