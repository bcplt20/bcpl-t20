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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
        <TeamLogo name={inn.battingTeam} size={44} />
        <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 16, flex: 1 }} numberOfLines={1}>
          {inn.battingTeam}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: c.foreground, fontFamily: 'Inter_800ExtraBold', fontSize: 24 }}>
          {inn.totalRuns}<Text style={{ color: c.mutedForeground, fontSize: 18 }}>/{inn.totalWickets}</Text>
        </Text>
        <Text style={{ color: c.mutedForeground, fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 2 }}>
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
    <View style={{ alignItems: 'center', paddingVertical: 24, gap: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
        <View style={{ alignItems: 'center', gap: 12, width: 110 }}>
          <View style={styles.logoWrap}>
            <LinearGradient colors={['rgba(255,255,255,0.1)', 'transparent']} style={styles.logoGlow} />
            <TeamLogo name={live.team1} size={72} glow={true} />
          </View>
          <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, textAlign: 'center', lineHeight: 20 }} numberOfLines={2}>
            {live.team1}
          </Text>
        </View>
        
        <View style={styles.vsContainer}>
          <LinearGradient colors={['transparent', c.border, 'transparent']} style={styles.vsLineVert} />
          <LinearGradient
            colors={['#00E5FF', '#FF1A75']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vsChip}
          >
            <Text style={styles.vsText}>VS</Text>
          </LinearGradient>
          <LinearGradient colors={['transparent', c.border, 'transparent']} style={styles.vsLineVert} />
        </View>

        <View style={{ alignItems: 'center', gap: 12, width: 110 }}>
          <View style={styles.logoWrap}>
            <LinearGradient colors={['rgba(255,255,255,0.1)', 'transparent']} style={styles.logoGlow} />
            <TeamLogo name={live.team2} size={72} glow={true} />
          </View>
          <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, textAlign: 'center', lineHeight: 20 }} numberOfLines={2}>
            {live.team2}
          </Text>
        </View>
      </View>

      {parts ? (
        <>
          <Text style={{ color: c.mutedForeground, fontSize: 13, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginTop: 12 }}>
            {t('MATCH STARTS IN', 'मैच शुरू होने में')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { v: parts.d, l: t('DAYS', 'दिन') },
              { v: parts.h, l: t('HRS', 'घंटे') },
              { v: parts.m, l: t('MIN', 'मिनट') },
              { v: parts.s, l: t('SEC', 'सेकंड') },
            ].map((u) => (
              <View key={u.l} style={[styles.cdBox, { borderColor: 'rgba(0, 229, 255,0.4)', backgroundColor: 'rgba(0, 229, 255,0.1)' }]}>
                <Text style={{ color: c.foreground, fontFamily: 'Inter_800ExtraBold', fontSize: 26 }}>{pad2(u.v)}</Text>
                <Text style={{ color: c.accent, fontSize: 11, letterSpacing: 1, fontFamily: 'Inter_700Bold', marginTop: 4 }}>{u.l}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {live.scheduledAt ? (
        <Text style={{ color: c.mutedForeground, fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 8 }}>
          {new Date(live.scheduledAt).toLocaleString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
          })}
          {live.venue ? ` · ${live.venue}` : ''}
        </Text>
      ) : null}

      <LinearGradient
        colors={['rgba(255, 26, 117,0.2)', 'rgba(255, 26, 117,0.05)']}
        style={styles.livePill}
      >
        <Text style={{ color: '#FF1A75', fontFamily: 'Inter_700Bold', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
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
          <View style={{ gap: 16 }}>
            {live.innings.map((inn) => <InningsScore key={inn.number} inn={inn} />)}
          </View>
        )}
        {live.status === 'completed' && live.resultDesc ? (
          <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>
            <Text style={{ color: c.accent, fontFamily: 'Inter_800ExtraBold', fontSize: 16, textAlign: 'center' }}>
              {live.resultDesc}
            </Text>
          </View>
        ) : target && chasing ? (
          <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>
            <Text style={{ color: c.mutedForeground, fontSize: 14, textAlign: 'center', fontFamily: 'Inter_600SemiBold' }}>
              Target {target} · <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold' }}>{Math.max(0, target - chasing.totalRuns)} runs needed</Text>
            </Text>
          </View>
        ) : null}
      </Card>

      {live.recentDeliveries.length > 0 ? (
        <Card style={{ padding: 0 }}>
          <View style={{ padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}>
            <Text style={{ color: c.foreground, fontFamily: 'Inter_800ExtraBold', fontSize: 18 }}>
              Recent Balls
            </Text>
          </View>
          {live.recentDeliveries.map((d, i) => (
            <View key={i} style={[styles.ballRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
              <View
                style={[
                  styles.ballChip,
                  {
                    backgroundColor: d.isWicket ? c.destructive : d.runs >= 4 ? c.success : 'rgba(255,255,255,0.08)',
                  },
                ]}
              >
                <Text
                  style={{
                    color: d.isWicket ? '#fff' : d.runs >= 4 ? '#fff' : c.foreground,
                    fontFamily: 'Inter_800ExtraBold',
                    fontSize: 14,
                  }}
                >
                  {d.isWicket ? 'W' : d.runs}
                </Text>
              </View>
              <Text style={{ color: c.mutedForeground, fontSize: 14, width: 44, fontFamily: 'Inter_600SemiBold' }}>{String(d.over)}</Text>
              <Text style={{ color: c.foreground, fontSize: 15, flex: 1, fontFamily: 'Inter_500Medium', lineHeight: 22 }} numberOfLines={2}>
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
      <Card style={{ paddingVertical: 48, alignItems: 'center' }}>
        <Text style={{ color: c.mutedForeground, textAlign: 'center', fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>
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
            style={{ padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}
          >
            <Text style={{ color: c.accent, fontFamily: 'Inter_800ExtraBold', fontSize: 14, letterSpacing: 0.5 }}>
              INNINGS {sc.innings.inningsNumber}
              {sc.innings.battingTeam ? ` · ${sc.innings.battingTeam.toUpperCase()}` : ''}
            </Text>
          </LinearGradient>
          <View style={{ padding: 16 }}>
            <View style={styles.scHead}>
              <Text style={[styles.scName, { color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_700Bold' }]}>BATTER</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_700Bold' }]}>R</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_700Bold' }]}>B</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_700Bold' }]}>4s</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_700Bold' }]}>6s</Text>
            </View>
            {sc.scorecard.batting.map((b, i) => (
              <View key={i} style={[styles.scRow, { borderTopColor: c.border }]}>
                <View style={styles.scName}>
                  <Text style={{ color: c.foreground, fontSize: 14, fontFamily: 'Inter_700Bold' }} numberOfLines={1}>
                    {b.name}
                  </Text>
                  {b.dismissal ? (
                    <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 4, fontFamily: 'Inter_500Medium' }} numberOfLines={1}>
                      {b.dismissal}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.scNum, { color: c.foreground, fontFamily: 'Inter_800ExtraBold', fontSize: 15 }]}>{b.runs}</Text>
                <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.balls}</Text>
                <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.fours}</Text>
                <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.sixes}</Text>
              </View>
            ))}
            <View style={[styles.scHead, { marginTop: 24 }]}>
              <Text style={[styles.scName, { color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_700Bold' }]}>BOWLER</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_700Bold' }]}>O</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_700Bold' }]}>R</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_700Bold' }]}>W</Text>
              <Text style={[styles.scNum, { color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_700Bold' }]} />
            </View>
            {sc.scorecard.bowling.map((b, i) => (
              <View key={i} style={[styles.scRow, { borderTopColor: c.border }]}>
                <Text style={[styles.scName, { color: c.foreground, fontSize: 14, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
                  {b.name}
                </Text>
                <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.overs}</Text>
                <Text style={[styles.scNum, { color: c.mutedForeground }]}>{b.runs}</Text>
                <Text style={[styles.scNum, { color: c.foreground, fontFamily: 'Inter_800ExtraBold', fontSize: 15 }]}>{b.wickets}</Text>
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
              <Text style={{ color: c.foreground, fontSize: 20, fontFamily: 'Inter_800ExtraBold', flex: 1, letterSpacing: -0.5 }} numberOfLines={1}>
                Match {live.matchNo}
                {live.venue ? <Text style={{ color: c.mutedForeground, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}> · {live.venue}</Text> : ''}
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
                  {tab === t ? (
                    <LinearGradient colors={['#FF1A75', '#D10056']} style={StyleSheet.absoluteFill} />
                  ) : null}
                  <Text
                    style={{
                      color: tab === t ? '#fff' : c.mutedForeground,
                      fontFamily: tab === t ? 'Inter_700Bold' : 'Inter_600SemiBold',
                      fontSize: 14,
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
    marginBottom: 24,
    marginTop: 12,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 6,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  innRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  ballRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  ballChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    height: 70,
    justifyContent: 'center',
  },
  vsLineVert: {
    width: 2,
    flex: 1,
  },
  vsText: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  vsChip: {
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    shadowColor: '#FF1A75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#161124',
    zIndex: 2,
  },
  logoWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  cdBox: {
    width: 72,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  livePill: {
    borderWidth: 1,
    borderColor: 'rgba(255, 26, 117, 0.4)',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginTop: 16,
    width: '100%',
  },
  scHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10 },
  scRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  scName: { flex: 1, paddingRight: 12 },
  scNum: { width: 40, textAlign: 'right', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
