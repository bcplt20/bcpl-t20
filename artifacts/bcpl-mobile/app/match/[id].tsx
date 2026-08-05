import React, { useState } from 'react';
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
import { useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import {
  getLiveMatch,
  getScorecard,
  type LiveInnings,
  type LiveMatch,
} from '@/lib/api';
import { Badge, Card, ErrorView, LoadingView, TeamDot } from '@/components/ui';

function oversStr(inn: LiveInnings): string {
  return `${inn.overs}.${inn.balls}`;
}

function InningsScore({ inn }: { inn: LiveInnings }) {
  const c = useColors();
  return (
    <View style={styles.innRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        <TeamDot name={inn.battingTeam} size={28} />
        <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13.5, flex: 1 }} numberOfLines={1}>
          {inn.battingTeam}
        </Text>
      </View>
      <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 17 }}>
        {inn.totalRuns}/{inn.totalWickets}
      </Text>
      <Text style={{ color: c.mutedForeground, fontSize: 12, width: 58, textAlign: 'right' }}>
        ({oversStr(inn)} ov)
      </Text>
    </View>
  );
}

function LiveTab({ live }: { live: LiveMatch }) {
  const c = useColors();
  const chasing = live.innings.find((i) => i.number === 2);
  const target = chasing?.target;

  return (
    <View style={{ gap: 12 }}>
      <Card>
        {live.innings.length === 0 ? (
          <Text style={{ color: c.mutedForeground, textAlign: 'center', paddingVertical: 10 }}>
            Match जल्द शुरू होगा
          </Text>
        ) : (
          live.innings.map((inn) => <InningsScore key={inn.number} inn={inn} />)
        )}
        {live.status === 'completed' && live.resultDesc ? (
          <Text style={{ color: c.accent, fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
            {live.resultDesc}
          </Text>
        ) : target && chasing ? (
          <Text style={{ color: c.mutedForeground, fontSize: 12.5, marginTop: 8, textAlign: 'center' }}>
            Target {target} · {Math.max(0, target - chasing.totalRuns)} runs needed
          </Text>
        ) : null}
      </Card>

      {live.recentDeliveries.length > 0 ? (
        <Card>
          <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 14.5, marginBottom: 8 }}>
            Recent balls
          </Text>
          {live.recentDeliveries.map((d, i) => (
            <View key={i} style={[styles.ballRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
              <View
                style={[
                  styles.ballChip,
                  {
                    backgroundColor: d.isWicket ? c.destructive : d.runs >= 4 ? c.accent : c.muted,
                  },
                ]}
              >
                <Text
                  style={{
                    color: d.isWicket ? '#fff' : d.runs >= 4 ? c.accentForeground : c.mutedForeground,
                    fontFamily: 'Inter_700Bold',
                    fontSize: 12,
                  }}
                >
                  {d.isWicket ? 'W' : d.runs}
                </Text>
              </View>
              <Text style={{ color: c.mutedForeground, fontSize: 12, width: 36 }}>{String(d.over)}</Text>
              <Text style={{ color: c.foreground, fontSize: 12.5, flex: 1 }} numberOfLines={2}>
                {d.commentary ?? (d.isWicket ? 'Wicket!' : `${d.runs} run${d.runs === 1 ? '' : 's'}`)}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

function ScorecardTab({ matchId }: { matchId: string }) {
  const c = useColors();
  const q = useQuery({
    queryKey: ['scorecard', matchId],
    queryFn: () => getScorecard(matchId),
  });

  if (q.isLoading) return <LoadingView />;
  if (q.isError) return <ErrorView onRetry={() => q.refetch()} />;
  const cards = q.data?.scorecards ?? [];
  if (cards.length === 0)
    return (
      <Card>
        <Text style={{ color: c.mutedForeground, textAlign: 'center', paddingVertical: 10 }}>
          Scorecard match शुरू होने के बाद दिखेगा
        </Text>
      </Card>
    );

  return (
    <View style={{ gap: 12 }}>
      {cards.map((sc) => (
        <Card key={sc.innings.id}>
          <Text style={{ color: c.accent, fontFamily: 'Inter_700Bold', fontSize: 13, marginBottom: 8 }}>
            INNINGS {sc.innings.inningsNumber}
            {sc.innings.battingTeam ? ` · ${sc.innings.battingTeam.toUpperCase()}` : ''}
          </Text>
          <View style={styles.scHead}>
            <Text style={[styles.scName, { color: c.mutedForeground, fontSize: 11 }]}>BATTER</Text>
            <Text style={[styles.scNum, { color: c.mutedForeground }]}>R</Text>
            <Text style={[styles.scNum, { color: c.mutedForeground }]}>B</Text>
            <Text style={[styles.scNum, { color: c.mutedForeground }]}>4s</Text>
            <Text style={[styles.scNum, { color: c.mutedForeground }]}>6s</Text>
          </View>
          {sc.scorecard.batting.map((b, i) => (
            <View key={i} style={[styles.scRow, { borderTopColor: c.border }]}>
              <View style={styles.scName}>
                <Text style={{ color: c.foreground, fontSize: 12.5, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>
                  {b.name}
                </Text>
                {b.dismissal ? (
                  <Text style={{ color: c.mutedForeground, fontSize: 10.5 }} numberOfLines={1}>
                    {b.dismissal}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.scNum, { color: c.foreground, fontFamily: 'Inter_700Bold' }]}>{b.runs}</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.balls}</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.fours}</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.sixes}</Text>
            </View>
          ))}
          <View style={[styles.scHead, { marginTop: 12 }]}>
            <Text style={[styles.scName, { color: c.mutedForeground, fontSize: 11 }]}>BOWLER</Text>
            <Text style={[styles.scNum, { color: c.mutedForeground }]}>O</Text>
            <Text style={[styles.scNum, { color: c.mutedForeground }]}>R</Text>
            <Text style={[styles.scNum, { color: c.mutedForeground }]}>W</Text>
            <Text style={[styles.scNum, { color: c.mutedForeground }]} />
          </View>
          {sc.scorecard.bowling.map((b, i) => (
            <View key={i} style={[styles.scRow, { borderTopColor: c.border }]}>
              <Text style={[styles.scName, { color: c.foreground, fontSize: 12.5, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
                {b.name}
              </Text>
              <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.overs}</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.runs}</Text>
              <Text style={[styles.scNum, { color: c.foreground, fontFamily: 'Inter_700Bold' }]}>{b.wickets}</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground }]} />
            </View>
          ))}
        </Card>
      ))}
    </View>
  );
}

export default function MatchDetailScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = String(id);
  const [tab, setTab] = useState<'live' | 'scorecard'>('live');

  const liveQ = useQuery({
    queryKey: ['live', matchId],
    queryFn: () => getLiveMatch(matchId),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (s === 'live') return 10_000;
      if (s === 'completed' || s === 'abandoned') return false;
      // scheduled / toss etc. — poll lightly so it flips to live automatically
      return 60_000;
    },
  });

  const live = liveQ.data;
  const isLive = live?.status === 'live';

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 60 : 30 }}
        refreshControl={
          <RefreshControl refreshing={liveQ.isRefetching} onRefresh={() => liveQ.refetch()} tintColor={c.primary} />
        }
      >
        {liveQ.isLoading ? (
          <LoadingView />
        ) : liveQ.isError ? (
          <ErrorView onRetry={() => liveQ.refetch()} />
        ) : live ? (
          <>
            <View style={styles.headRow}>
              <Text style={{ color: c.mutedForeground, fontSize: 12.5, flex: 1 }} numberOfLines={1}>
                Match {live.matchNo}
                {live.venue ? ` · ${live.venue}` : ''}
              </Text>
              {isLive ? <Badge label="Live" tone="live" /> : live.status === 'completed' ? <Badge label="Result" tone="gold" /> : <Badge label={live.status} />}
            </View>

            <View style={[styles.tabs, { backgroundColor: c.muted }]}>
              {(['live', 'scorecard'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={[styles.tabBtn, tab === t && { backgroundColor: c.primary }]}
                  testID={`tab-${t}`}
                >
                  <Text
                    style={{
                      color: tab === t ? c.primaryForeground : c.mutedForeground,
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 13,
                    }}
                  >
                    {t === 'live' ? 'Score' : 'Scorecard'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === 'live' ? <LiveTab live={live} /> : <ScorecardTab matchId={matchId} />}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  innRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  ballRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  ballChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: 5 },
  scRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  scName: { flex: 1, paddingRight: 8 },
  scNum: { width: 32, textAlign: 'right', fontSize: 12 },
});
