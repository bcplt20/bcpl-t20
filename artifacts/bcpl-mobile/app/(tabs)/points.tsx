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
import { getMatches, getPointsTable, type PointsRow } from '@/lib/api';
import { Card, EmptyView, ErrorView, LoadingView, TeamLogo } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';

/** One group's standings table (mirrors website's Group A / Group B split). */
function GroupTable({ title, rows, qualify }: { title: string; rows: PointsRow[]; qualify: number }) {
  const c = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.groupHead}>
        <View style={[styles.groupChip, { backgroundColor: 'rgba(255,107,0,0.12)', borderColor: 'rgba(255,107,0,0.45)' }]}>
          <Text style={{ color: '#FF6B00', fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1 }}>{title}</Text>
        </View>
      </View>
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
        {rows.map((t, i) => (
          <View
            key={t.team}
            style={[
              styles.row,
              { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
              i < qualify && { backgroundColor: 'rgba(232,178,61,0.06)' },
            ]}
          >
            <Text style={[styles.pos, { color: i < qualify ? c.accent : c.mutedForeground }]}>{i + 1}</Text>
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
      </Card>
    </View>
  );
}

export default function PointsScreen() {
  const c = useColors();
  const q = useQuery({ queryKey: ['points'], queryFn: getPointsTable, refetchInterval: 120_000 });
  const matchesQ = useQuery({ queryKey: ['matches'], queryFn: getMatches });
  const table = q.data?.table ?? [];

  // Derive Group A / Group B membership from the match schedule (same as website)
  const groupOf = new Map<string, string>();
  for (const m of matchesQ.data?.matches ?? []) {
    const g = (m.grp ?? '').toUpperCase();
    if (g === 'A' || g === 'B') {
      if (!groupOf.has(m.team1)) groupOf.set(m.team1, g);
      if (!groupOf.has(m.team2)) groupOf.set(m.team2, g);
    }
  }
  const groupA = table.filter((t) => groupOf.get(t.team) === 'A');
  const groupB = table.filter((t) => groupOf.get(t.team) === 'B');
  const grouped = groupA.length > 0 && groupB.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 100 }}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); matchesQ.refetch(); }} tintColor={c.primary} />
        }
      >
        <ScreenHeader title="Points Table" subtitle="Season 5 standings" />
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {q.isLoading ? (
            <LoadingView />
          ) : q.isError ? (
            <ErrorView onRetry={() => q.refetch()} />
          ) : table.length === 0 ? (
            <EmptyView icon="bar-chart-2" text="Points table Season 5 शुरू होते ही यहाँ दिखेगी" />
          ) : grouped ? (
            <>
              <GroupTable title="GROUP A" rows={groupA} qualify={2} />
              <GroupTable title="GROUP B" rows={groupB} qualify={2} />
              <Text style={{ color: c.mutedForeground, fontSize: 11, paddingHorizontal: 4, paddingBottom: 6 }}>
                हर group की top 2 teams playoffs में जाती हैं
              </Text>
            </>
          ) : (
            <>
              <GroupTable title="STANDINGS" rows={table} qualify={4} />
              <Text style={{ color: c.mutedForeground, fontSize: 11, paddingHorizontal: 4, paddingBottom: 6 }}>
                Top 4 teams playoffs में जाती हैं
              </Text>
            </>
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
  groupHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  groupChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pos: { width: 20, fontFamily: 'Inter_700Bold', fontSize: 12 },
  team: { flex: 1 },
  num: { width: 24, textAlign: 'center', fontSize: 12 },
  nrr: { width: 44, textAlign: 'right', fontSize: 11 },
  pts: { width: 36, textAlign: 'right', fontSize: 12.5 },
});
