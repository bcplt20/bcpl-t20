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
import { Card, EmptyView, ErrorView, LoadingView, TeamLogo, GlassAppBar, ScreenBackground, useAppBarHeight, useBottomNavHeight } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useLang } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

/** One group's standings table (mirrors website's Group A / Group B split). */
function GroupTable({ title, rows, qualify }: { title: string; rows: PointsRow[]; qualify: number }) {
  const c = useColors();
  return (
    <View style={{ marginBottom: 28 }}>
      <View style={styles.groupHead}>
        <LinearGradient
          colors={[`${c.cyan}33`, `${c.cyan}05`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.groupChip, { borderColor: c.getAccentText(c.cyan) }]}
        >
          <Text style={{ color: c.getAccentText(c.cyan), fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 13, letterSpacing: 1.5 }}>{title}</Text>
        </LinearGradient>
      </View>
      <Card padding={0} border={true}>
        <View style={[styles.row, styles.headRow, { backgroundColor: c.card2, borderBottomWidth: 1, borderBottomColor: c.line }]}>
          <Text style={[styles.pos, { color: c.sub, fontSize: 11 }]}>#</Text>
          <Text style={[styles.team, { color: c.sub, fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.5 }]}>TEAM</Text>
          <Text style={[styles.num, { color: c.sub, fontSize: 11 }]}>P</Text>
          <Text style={[styles.num, { color: c.sub, fontSize: 11 }]}>W</Text>
          <Text style={[styles.num, { color: c.sub, fontSize: 11 }]}>L</Text>
          <Text style={[styles.nrr, { color: c.sub, fontSize: 11 }]}>NRR</Text>
          <Text style={[styles.pts, { color: c.sub, fontSize: 11 }]}>PTS</Text>
        </View>
        {rows.map((t, i) => (
          <View
            key={t.team}
            style={[
              styles.row,
              { borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line },
              i < qualify && { backgroundColor: `${c.mint}10` },
            ]}
          >
            <View style={{ width: 22, alignItems: 'center' }}>
              <View style={[styles.medal, { backgroundColor: i < qualify ? c.mint : c.card2, borderWidth: i >= qualify ? 1 : 0, borderColor: c.line }]}>
                <Text style={[styles.medalText, { color: i < qualify ? '#000' : c.sub }]}>{i + 1}</Text>
              </View>
            </View>
            <View style={[styles.team, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <TeamLogo name={t.team} size={28} />
              <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13.5, flex: 1 }} numberOfLines={1}>
                {t.team}
              </Text>
            </View>
            <Text style={[styles.num, { color: c.ink }]}>{t.played}</Text>
            <Text style={[styles.num, { color: c.getAccentText(c.mint), fontFamily: 'PlusJakartaSans_600SemiBold' }]}>{t.won}</Text>
            <Text style={[styles.num, { color: c.getAccentText(c.coral), fontFamily: 'PlusJakartaSans_600SemiBold' }]}>{t.lost}</Text>
            <Text style={[styles.nrr, { color: typeof t.nrr === 'number' && t.nrr > 0 ? c.getAccentText(c.mint) : c.sub }]}>
              {typeof t.nrr === 'number' ? (t.nrr > 0 ? `+${t.nrr.toFixed(2)}` : t.nrr.toFixed(2)) : t.nrr}
            </Text>
            <Text style={[styles.pts, { color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }]}>{t.points}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

export default function PointsScreen() {
  const c = useColors();
  const { t } = useLang();
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();
  
  const q = useQuery({ queryKey: ['points'], queryFn: getPointsTable, refetchInterval: 120_000 });
  const matchesQ = useQuery({ queryKey: ['matches'], queryFn: getMatches });
  const table = q.data?.table ?? [];

  // Derive Group A / Group B membership from the match schedule (same as website)
  const groupOf = new Map<string, string>();
  for (const m of matchesQ.data?.matches ?? []) {
    if (m.stage && m.stage !== 'league') continue; // playoffs carry no group meaning
    const g = (m.grp ?? '').toUpperCase();
    if (g === 'A' || g === 'B') {
      if (!groupOf.has(m.team1)) groupOf.set(m.team1, g);
      if (!groupOf.has(m.team2)) groupOf.set(m.team2, g);
    }
  }
  const groupA = table.filter((t) => groupOf.get(t.team) === 'A');
  const groupB = table.filter((t) => groupOf.get(t.team) === 'B');
  const grouped = groupA.length > 0 || groupB.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title="Points Table" back={true} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomNavHeight, paddingTop: appBarHeight }}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); matchesQ.refetch(); }} tintColor={c.magenta} />
        }
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          {q.isLoading ? (
            <LoadingView />
          ) : q.isError ? (
            <ErrorView onRetry={() => q.refetch()} />
          ) : table.length === 0 ? (
            <EmptyView icon="bar-chart-2" text={t('Points table will appear once Season 5 begins', 'पॉइंट्स टेबल सीज़न 5 शुरू होते ही यहाँ दिखेगी')} />
          ) : grouped ? (
            <>
              <GroupTable title="GROUP A" rows={groupA} qualify={2} />
              <GroupTable title="GROUP B" rows={groupB} qualify={2} />
              <Text style={{ color: c.sub, fontSize: 12, paddingHorizontal: 4, paddingBottom: 6, textAlign: 'center' }}>
                {t('Top 2 teams from each group qualify for the playoffs', 'हर ग्रुप की टॉप 2 टीमें प्लेऑफ़ में जाती हैं')}
              </Text>
            </>
          ) : (
            <>
              <GroupTable title="STANDINGS" rows={table} qualify={4} />
              <Text style={{ color: c.sub, fontSize: 12, paddingHorizontal: 4, paddingBottom: 6, textAlign: 'center' }}>
                {t('Top 4 teams qualify for the playoffs', 'टॉप 4 टीमें प्लेऑफ़ में जाती हैं')}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headRow: { paddingVertical: 10 },
  groupHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  groupChip: {
    borderWidth: 1,
    borderColor: 'rgba(255, 26, 117, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  pos: { width: 22, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, textAlign: 'center' },
  medal: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: { color: '#000', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 11 },
  team: { flex: 1, paddingLeft: 8 },
  num: { width: 26, textAlign: 'center', fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium' },
  nrr: { width: 50, textAlign: 'right', fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' },
  pts: { width: 36, textAlign: 'right', fontSize: 13 },
});
