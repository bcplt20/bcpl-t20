import React from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { getPointsTable } from '@/lib/api';
import { Card, EmptyView, ErrorView, LoadingView, TeamLogo } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function PointsScreen() {
  const c = useColors();
  const q = useQuery({ queryKey: ['points'], queryFn: getPointsTable, refetchInterval: 120_000 });
  const table = q.data?.table ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 100 }}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.primary} />
        }
      >
        <ScreenHeader title="Points Table" subtitle="Season 4 standings" />
        <View style={{ paddingHorizontal: 16 }}>
          {q.isLoading ? (
            <LoadingView />
          ) : q.isError ? (
            <ErrorView onRetry={() => q.refetch()} />
          ) : table.length === 0 ? (
            <EmptyView icon="bar-chart-2" text="Points table Season 4 शुरू होते ही यहाँ दिखेगी" />
          ) : (
            <Card style={{ paddingHorizontal: 0, paddingVertical: 4 }}>
              <View style={[styles.row, styles.headRow]}>
                <Text style={[styles.pos, { color: c.mutedForeground }]}>#</Text>
                <Text style={[styles.team, { color: c.mutedForeground, fontSize: 11 }]}>TEAM</Text>
                <Text style={[styles.num, { color: c.mutedForeground }]}>P</Text>
                <Text style={[styles.num, { color: c.mutedForeground }]}>W</Text>
                <Text style={[styles.num, { color: c.mutedForeground }]}>L</Text>
                <Text style={[styles.nrr, { color: c.mutedForeground }]}>NRR</Text>
                <Text style={[styles.pts, { color: c.mutedForeground }]}>PTS</Text>
              </View>
              {table.map((t, i) => (
                <View
                  key={t.team}
                  style={[
                    styles.row,
                    { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
                    i < 4 && { backgroundColor: 'rgba(232,178,61,0.06)' },
                  ]}
                >
                  <Text style={[styles.pos, { color: i < 4 ? c.accent : c.mutedForeground }]}>{i + 1}</Text>
                  <View style={[styles.team, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                    <TeamLogo name={t.team} size={26} />
                    <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12.5, flex: 1 }} numberOfLines={1}>
                      {t.team}
                    </Text>
                  </View>
                  <Text style={[styles.num, { color: c.foreground }]}>{t.played}</Text>
                  <Text style={[styles.num, { color: c.foreground }]}>{t.won}</Text>
                  <Text style={[styles.num, { color: c.foreground }]}>{t.lost}</Text>
                  <Text style={[styles.nrr, { color: c.mutedForeground }]}>
                    {typeof t.nrr === 'number' ? t.nrr.toFixed(2) : t.nrr}
                  </Text>
                  <Text style={[styles.pts, { color: c.foreground, fontFamily: 'Inter_700Bold' }]}>{t.points}</Text>
                </View>
              ))}
              <Text style={{ color: c.mutedForeground, fontSize: 10.5, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 6 }}>
                Top 4 playoffs में जाती हैं
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  headRow: { paddingVertical: 6 },
  pos: { width: 20, fontFamily: 'Inter_700Bold', fontSize: 12 },
  team: { flex: 1 },
  num: { width: 24, textAlign: 'center', fontSize: 12 },
  nrr: { width: 44, textAlign: 'right', fontSize: 11 },
  pts: { width: 36, textAlign: 'right', fontSize: 12.5 },
});
