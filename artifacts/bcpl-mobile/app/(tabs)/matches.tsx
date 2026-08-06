import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { getMatches, type Match } from '@/lib/api';
import { EmptyView, ErrorView, LoadingView, GlassAppBar, ScreenBackground, useAppBarHeight, useBottomNavHeight } from '@/components/ui';
import { MatchCard } from '@/components/MatchCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useLang } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

type Filter = 'all' | 'live' | 'upcoming' | 'results';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'results', label: 'Results' },
];

export default function MatchesScreen() {
  const c = useColors();
  const { t } = useLang();
  const [filter, setFilter] = useState<Filter>('all');
  
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const q = useQuery({ queryKey: ['matches'], queryFn: getMatches, refetchInterval: 60_000 });
  const all = q.data?.matches ?? [];

  const filtered: Match[] = all
    .filter((m) => {
      if (filter === 'live') return m.status === 'live';
      if (filter === 'upcoming') return m.status !== 'live' && m.status !== 'completed';
      if (filter === 'results') return m.status === 'completed';
      return true;
    })
    .sort((a, b) => {
      const rank = (m: Match) => (m.status === 'live' ? 0 : m.status === 'completed' ? 2 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '');
    });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title="Matches" />
      <View style={[styles.filters, { marginTop: appBarHeight, borderBottomColor: c.line }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 16, paddingTop: 10 }}>
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                testID={`filter-${f.key}`}
                style={[
                  styles.chip,
                  {
                    borderColor: isActive ? c.magenta : 'rgba(255,255,255,0.1)',
                  },
                ]}
              >
                {isActive ? (
                  <LinearGradient colors={['#5B2BF0', '#9B2FF0']} style={StyleSheet.absoluteFill} />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: c.card2 }]} />
                )}
                <Text
                  style={{
                    color: isActive ? '#fff' : c.sub,
                    fontFamily: isActive ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold',
                    fontSize: 14,
                    letterSpacing: 0.3,
                  }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      {q.isLoading ? (
        <LoadingView />
      ) : q.isError ? (
        <ErrorView onRetry={() => q.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyView icon="calendar" text={t('No matches in this section yet', 'अभी इस सेक्शन में कोई मैच नहीं है')} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MatchCard match={item} />}
          scrollEnabled={filtered.length > 0}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: bottomNavHeight,
            paddingTop: 8,
          }}
          refreshControl={
            <RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.magenta} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
