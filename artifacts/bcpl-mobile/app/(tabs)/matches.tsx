import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { getMatches, type Match } from '@/lib/api';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui';
import { MatchCard } from '@/components/MatchCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useLang } from '@/context/LanguageContext';

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
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title="Matches" subtitle={t('Season 5 schedule & results', 'सीज़न 5 शेड्यूल और नतीजे')} />
      <View style={styles.filters}>
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
                  backgroundColor: isActive ? c.primary : 'rgba(255,255,255,0.06)',
                  borderColor: isActive ? c.primary : 'rgba(255,255,255,0.1)',
                },
              ]}
            >
              <Text
                style={{
                  color: isActive ? c.primaryForeground : c.mutedForeground,
                  fontFamily: isActive ? 'Inter_700Bold' : 'Inter_600SemiBold',
                  fontSize: 13,
                  letterSpacing: 0.3,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
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
            paddingBottom: Platform.OS === 'web' ? 118 : 100,
            paddingTop: 8,
          }}
          refreshControl={
            <RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
});
