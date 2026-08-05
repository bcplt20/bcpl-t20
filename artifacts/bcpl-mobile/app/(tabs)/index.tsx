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
import { getMatches, getPointsTable, SITE_ASSETS, type Match } from '@/lib/api';
import { NEWS_ARTICLES } from '@/data/news';
import { Badge, Card } from '@/components/ui';
import { MatchCard } from '@/components/MatchCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Feather } from '@expo/vector-icons';

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
          title={user ? `नमस्ते, ${user.name.split(' ')[0]}` : 'BCPL T20'}
          subtitle="Bhartiya Corporate Premier League · Season 4"
        />

        {anyLive ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
            <Badge label="Match live now" tone="live" />
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {featured.length > 0 ? (
            featured.map((m) => <MatchCard key={m.id} match={m} />)
          ) : matchesQ.isLoading ? (
            <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Text style={{ color: c.mutedForeground }}>Loading matches…</Text>
            </Card>
          ) : (
            <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Feather name="calendar" size={26} color={c.mutedForeground} />
              <Text style={{ color: c.mutedForeground, marginTop: 8, textAlign: 'center' }}>
                Season 4 schedule जल्द आ रहा है — October 2026
              </Text>
            </Card>
          )}
        </View>

        {topTeams.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Points Table</Text>
              <Pressable onPress={() => router.push('/points')} testID="see-points">
                <Text style={{ color: c.accent, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                  पूरी table →
                </Text>
              </Pressable>
            </View>
            <Card>
              {topTeams.map((t, i) => (
                <View key={t.team} style={[styles.pointsRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                  <Text style={[styles.pos, { color: c.accent }]}>{i + 1}</Text>
                  <Text style={[styles.teamName, { color: c.foreground }]} numberOfLines={1}>
                    {t.team}
                  </Text>
                  <Text style={{ color: c.mutedForeground, fontSize: 12 }}>{t.played} M</Text>
                  <Text style={[styles.pts, { color: c.foreground }]}>{t.points} pts</Text>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Latest News</Text>
            <Pressable onPress={() => router.push('/news')} testID="see-news">
              <Text style={{ color: c.accent, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                सारी news →
              </Text>
            </Pressable>
          </View>
          {latestNews.map((n) => (
            <Pressable
              key={n.slug}
              onPress={() => router.push(`/news/${n.slug}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              testID={`home-news-${n.slug}`}
            >
              <Card style={{ marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Image
                  source={{ uri: `${SITE_ASSETS}/bcpl-assets/news/${n.image}` }}
                  style={{ width: 68, height: 68, borderRadius: 10 }}
                  contentFit="cover"
                  transition={150}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.accent, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                    {n.tag.toUpperCase()} · {n.date}
                  </Text>
                  <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13.5, marginTop: 3 }} numberOfLines={2}>
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
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  pos: { width: 18, fontFamily: 'Inter_700Bold', fontSize: 13 },
  teamName: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13.5 },
  pts: { fontFamily: 'Inter_700Bold', fontSize: 13, width: 52, textAlign: 'right' },
});
