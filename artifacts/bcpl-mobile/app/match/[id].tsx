import React, { useEffect, useState } from 'react';
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
import { useLang } from '@/context/LanguageContext';
import {
  getLiveMatch,
  getScorecard,
  type LiveInnings,
  type LiveMatch,
} from '@/lib/api';
import { Badge, Card, ErrorView, LoadingView, TeamLogo } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

function oversStr(inn: LiveInnings): string {
  return `${inn.overs}.${inn.balls}`;
}

function InningsScore({ inn }: { inn: LiveInnings }) {
  const c = useColors();
  return (
    <View style={styles.innRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        <TeamLogo name={inn.battingTeam} size={36} />
        <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 15, flex: 1 }} numberOfLines={1}>
          {inn.battingTeam}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 20 }}>
          {inn.totalRuns}<Text style={{ color: c.mutedForeground, fontSize: 16 }}>/{inn.totalWickets}</Text>
        </Text>
        <Text style={{ color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_500Medium' }}>
          ({oversStr(inn)} ov)
        </Text>
      </View>
    </View>
  );
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

/** Live ticking countdown to match start + friendly "coming up" panel. */
function UpcomingPanel({ live }: { live: LiveMatch }) {
  const c = useColors();
  const { t } = useLang();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startAt = live.scheduledAt ? new Date(live.scheduledAt).getTime() : null;
  const diff = startAt ? startAt - now : null;
  const parts =
    diff !== null && diff > 0
      ? {
          d: Math.floor(diff / 86_400_000),
          h: Math.floor((diff % 86_400_000) / 3_600_000),
          m: Math.floor((diff % 3_600_000) / 60_000),
          s: Math.floor((diff % 60_000) / 1000),
        }
      : null;

  return (
    <View style={{ alignItems: 'center', paddingVertical: 20, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 8, width: 110 }}>
          <TeamLogo name={live.team1} size={64} />
          <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 14, textAlign: 'center', lineHeight: 18 }} numberOfLines={2}>
            {live.team1}
          </Text>
        </View>
        
        <View style={styles.vsContainer}>
          <View style={[styles.vsLineVert, { backgroundColor: c.border }]} />
          <LinearGradient
            colors={['rgba(232, 178, 61, 0.15)', 'rgba(255, 107, 0, 0.15)']}
            style={styles.vsChip}
          >
            <Text style={{ color: c.accent, fontFamily: 'Inter_700Bold', fontSize: 12 }}>VS</Text>
          </LinearGradient>
          <View style={[styles.vsLineVert, { backgroundColor: c.border }]} />
        </View>

        <View style={{ alignItems: 'center', gap: 8, width: 110 }}>
          <TeamLogo name={live.team2} size={64} />
          <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 14, textAlign: 'center', lineHeight: 18 }} numberOfLines={2}>
            {live.team2}
          </Text>
        </View>
      </View>

      {parts ? (
        <>
          <Text style={{ color: c.mutedForeground, fontSize: 12, letterSpacing: 1.5, fontFamily: 'Inter_600SemiBold', marginTop: 10 }}>
            {t('MATCH STARTS IN', 'मैच शुरू होने में')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { v: parts.d, l: t('DAYS', 'दिन') },
              { v: parts.h, l: t('HRS', 'घंटे') },
              { v: parts.m, l: t('MIN', 'मिनट') },
              { v: parts.s, l: t('SEC', 'सेकंड') },
            ].map((u) => (
              <View key={u.l} style={[styles.cdBox, { borderColor: 'rgba(232,178,61,0.3)', backgroundColor: 'rgba(232,178,61,0.08)' }]}>
                <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 24 }}>{pad2(u.v)}</Text>
                <Text style={{ color: c.accent, fontSize: 10, letterSpacing: 1, fontFamily: 'Inter_600SemiBold', marginTop: 2 }}>{u.l}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {live.scheduledAt ? (
        <Text style={{ color: c.mutedForeground, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
          {new Date(live.scheduledAt).toLocaleString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
          })}
          {live.venue ? ` · ${live.venue}` : ''}
        </Text>
      ) : null}

      <LinearGradient
        colors={['rgba(255,107,0,0.15)', 'rgba(255,107,0,0.05)']}
        style={styles.livePill}
      >
        <Text style={{ color: '#FF6B00', fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'center' }}>
          {t('Live score and ball-by-ball updates will appear here once the match begins', 'मैच शुरू होते ही लाइव स्कोर और बॉल-बाय-बॉल अपडेट यहीं दिखेंगे')}
        </Text>
      </LinearGradient>
    </View>
  );
}

function LiveTab({ live }: { live: LiveMatch }) {
  const c = useColors();
  const chasing = live.innings.find((i) => i.number === 2);
  const target = chasing?.target;

  return (
    <View style={{ gap: 16 }}>
      <Card>
        {live.innings.length === 0 ? (
          <UpcomingPanel live={live} />
        ) : (
          <View style={{ gap: 12 }}>
            {live.innings.map((inn) => <InningsScore key={inn.number} inn={inn} />)}
          </View>
        )}
        {live.status === 'completed' && live.resultDesc ? (
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>
            <Text style={{ color: c.accent, fontFamily: 'Inter_700Bold', fontSize: 14, textAlign: 'center' }}>
              {live.resultDesc}
            </Text>
          </View>
        ) : target && chasing ? (
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>
            <Text style={{ color: c.mutedForeground, fontSize: 13, textAlign: 'center', fontFamily: 'Inter_500Medium' }}>
              Target {target} · {Math.max(0, target - chasing.totalRuns)} runs needed
            </Text>
          </View>
        ) : null}
      </Card>

      {live.recentDeliveries.length > 0 ? (
        <Card style={{ padding: 0 }}>
          <View style={{ padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}>
            <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 }}>
              Recent Balls
            </Text>
          </View>
          {live.recentDeliveries.map((d, i) => (
            <View key={i} style={[styles.ballRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
              <View
                style={[
                  styles.ballChip,
                  {
                    backgroundColor: d.isWicket ? c.destructive : d.runs >= 4 ? c.success : 'rgba(255,255,255,0.1)',
                  },
                ]}
              >
                <Text
                  style={{
                    color: d.isWicket ? '#fff' : d.runs >= 4 ? '#fff' : c.mutedForeground,
                    fontFamily: 'Inter_700Bold',
                    fontSize: 13,
                  }}
                >
                  {d.isWicket ? 'W' : d.runs}
                </Text>
              </View>
              <Text style={{ color: c.mutedForeground, fontSize: 13, width: 40, fontFamily: 'Inter_500Medium' }}>{String(d.over)}</Text>
              <Text style={{ color: c.foreground, fontSize: 14, flex: 1, fontFamily: 'Inter_500Medium' }} numberOfLines={2}>
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
  const { t } = useLang();
  const q = useQuery({
    queryKey: ['scorecard', matchId],
    queryFn: () => getScorecard(matchId),
  });

  if (q.isLoading) return <LoadingView />;
  if (q.isError) return <ErrorView onRetry={() => q.refetch()} />;
  const cards = q.data?.scorecards ?? [];
  if (cards.length === 0)
    return (
      <Card style={{ paddingVertical: 40, alignItems: 'center' }}>
        <Text style={{ color: c.mutedForeground, textAlign: 'center', fontSize: 14, fontFamily: 'Inter_500Medium' }}>
          {t('Scorecard will appear after the match begins', 'स्कोरकार्ड मैच शुरू होने के बाद दिखेगा')}
        </Text>
      </Card>
    );

  return (
    <View style={{ gap: 16 }}>
      {cards.map((sc) => (
        <Card key={sc.innings.id} style={{ padding: 0 }}>
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'transparent']}
            style={{ padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}
          >
            <Text style={{ color: c.accent, fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 0.5 }}>
              INNINGS {sc.innings.inningsNumber}
              {sc.innings.battingTeam ? ` · ${sc.innings.battingTeam.toUpperCase()}` : ''}
            </Text>
          </LinearGradient>
          <View style={{ padding: 14 }}>
            <View style={styles.scHead}>
              <Text style={[styles.scName, { color: c.mutedForeground, fontSize: 11, fontFamily: 'Inter_600SemiBold' }]}>BATTER</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 11 }]}>R</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 11 }]}>B</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 11 }]}>4s</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 11 }]}>6s</Text>
            </View>
            {sc.scorecard.batting.map((b, i) => (
              <View key={i} style={[styles.scRow, { borderTopColor: c.border }]}>
                <View style={styles.scName}>
                  <Text style={{ color: c.foreground, fontSize: 13, fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>
                    {b.name}
                  </Text>
                  {b.dismissal ? (
                    <Text style={{ color: c.mutedForeground, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                      {b.dismissal}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.scNum, { color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 14 }]}>{b.runs}</Text>
                <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.balls}</Text>
                <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.fours}</Text>
                <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.sixes}</Text>
              </View>
            ))}
            <View style={[styles.scHead, { marginTop: 20 }]}>
              <Text style={[styles.scName, { color: c.mutedForeground, fontSize: 11, fontFamily: 'Inter_600SemiBold' }]}>BOWLER</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 11 }]}>O</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 11 }]}>R</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 11 }]}>W</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 11 }]} />
            </View>
            {sc.scorecard.bowling.map((b, i) => (
              <View key={i} style={[styles.scRow, { borderTopColor: c.border }]}>
                <Text style={[styles.scName, { color: c.foreground, fontSize: 13, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
                  {b.name}
                </Text>
                <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.overs}</Text>
                <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.runs}</Text>
                <Text style={[styles.scNum, { color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 14 }]}>{b.wickets}</Text>
                <Text style={[styles.scNum, { color: c.mutedForeground }]} />
              </View>
            ))}
          </View>
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
              <Text style={{ color: c.foreground, fontSize: 16, fontFamily: 'Inter_700Bold', flex: 1, letterSpacing: -0.2 }} numberOfLines={1}>
                Match {live.matchNo}
                {live.venue ? <Text style={{ color: c.mutedForeground, fontSize: 13, fontFamily: 'Inter_500Medium' }}> · {live.venue}</Text> : ''}
              </Text>
              {isLive ? <Badge label="Live" tone="live" /> : live.status === 'completed' ? <Badge label="Result" tone="gold" /> : <Badge label={live.status} />}
            </View>

            <View style={[styles.tabs, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]}>
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
                      fontFamily: tab === t ? 'Inter_700Bold' : 'Inter_600SemiBold',
                      fontSize: 13.5,
                      letterSpacing: 0.3,
                    }}
                  >
                    {t === 'live' ? 'Live Score' : 'Scorecard'}
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
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  innRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  ballRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ballChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    height: 60,
    justifyContent: 'center',
  },
  vsLineVert: {
    width: 1,
    flex: 1,
  },
  vsChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(232,178,61,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  cdBox: {
    width: 68,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  livePill: {
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 10,
    width: '100%',
  },
  scHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8 },
  scRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  scName: { flex: 1, paddingRight: 10 },
  scNum: { width: 36, textAlign: 'right', fontSize: 13, fontFamily: 'Inter_500Medium' },
});
