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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import {
  getLiveMatch,
  getScorecard,
  getMatchMoments,
  type LiveInnings,
  type LiveMatch,
  type Match,
} from '@/lib/api';
import { Badge, Card, ErrorView, LoadingView, TeamLogo, GlassAppBar, ScreenBackground, getTeamColor, GradientTag, useAppBarHeight, useBottomNavHeight } from '@/components/ui';
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
        <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, flex: 1 }} numberOfLines={1}>
          {inn.battingTeam}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24 }}>
          {inn.totalRuns}<Text style={{ color: c.sub, fontSize: 18 }}>/{inn.totalWickets}</Text>
        </Text>
        <Text style={{ color: c.sub, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: 2 }}>
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
    <Card padding={0} style={{ overflow: 'hidden' }}>
      <LinearGradient
        colors={[`${getTeamColor(live.team1)}33`, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[`${getTeamColor(live.team2)}33`, 'transparent']}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={{ alignItems: 'center', paddingVertical: 24, gap: 20, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
        <View style={{ alignItems: 'center', gap: 12, width: 120 }}>
          <View style={styles.logoWrap}>
            <LinearGradient colors={['rgba(255,255,255,0.1)', 'transparent']} style={styles.logoGlow} />
            <TeamLogo name={live.team1} size={96} glow={c.isDark} />
          </View>
          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, textAlign: 'center', lineHeight: 20 }} numberOfLines={2}>
            {live.team1}
          </Text>
        </View>
        
        <View style={[styles.vsContainer, { flex: 1, paddingHorizontal: 10, flexDirection: 'column', gap: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LinearGradient colors={['transparent', c.line, 'transparent']} style={styles.vsLineVert} />
            <View style={[styles.vsChip, { backgroundColor: c.card2, borderColor: c.line }]}>
              <Text style={[styles.vsText, { color: c.sub }]}>VS</Text>
            </View>
            <LinearGradient colors={['transparent', c.line, 'transparent']} style={styles.vsLineVert} />
          </View>
          {parts ? (
            <View style={{ backgroundColor: `${c.cyan}15`, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: `${c.cyan}40`, width: '100%', alignItems: 'center' }}>
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit 
                style={{ color: c.cyan, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 13, letterSpacing: 0, fontVariant: ['tabular-nums'] }}
              >
                {parts.d > 0 ? `${parts.d}d ${pad2(parts.h)}h ${pad2(parts.m)}m ${pad2(parts.s)}s` : `${pad2(parts.h)}:${pad2(parts.m)}:${pad2(parts.s)}`}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ alignItems: 'center', gap: 12, width: 120 }}>
          <View style={styles.logoWrap}>
            <LinearGradient colors={['rgba(255,255,255,0.1)', 'transparent']} style={styles.logoGlow} />
            <TeamLogo name={live.team2} size={96} glow={c.isDark} />
          </View>
          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, textAlign: 'center', lineHeight: 20 }} numberOfLines={2}>
            {live.team2}
          </Text>
        </View>
      </View>

      {live.scheduledAt ? (
        <Text style={{ color: c.sub, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: 8 }}>
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
        <Text style={{ color: '#FF1A75', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
          {t('Live score and ball-by-ball updates will appear here once the match begins', 'मैच शुरू होते ही लाइव स्कोर और बॉल-बाय-बॉल अपडेट यहीं दिखेंगे')}
        </Text>
      </LinearGradient>
      </View>
    </Card>
  );
}

function LiveTab({ live }: { live: LiveMatch }) {
  const c = useColors();
  const innings = live.innings ?? [];
  const chasing = innings.find((i) => i.number === 2);
  const target = chasing?.target;

  return (
    <View style={{ gap: 16 }}>
      {innings.length === 0 ? (
        <UpcomingPanel live={live} />
      ) : (
        <Card>
          <View style={{ gap: 16 }}>
            {innings.map((inn) => <InningsScore key={inn.number} inn={inn} />)}
          </View>

          {live.dls?.active && (
            <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.line, alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(255,61,166,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,61,166,0.3)', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="cloud-rain" size={16} color={c.magenta} />
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>
                  DLS: Par {live.dls.parScore ?? '--'} {live.dls.aheadBehind !== undefined ? `(${live.dls.aheadBehind > 0 ? '+' : ''}${live.dls.aheadBehind} ${live.dls.aheadBehind >= 0 ? 'ahead' : 'behind'})` : ''} · Target {live.dls.target ?? '--'} in {live.dls.revisedOvers ?? '--'} ov
                </Text>
              </View>
            </View>
          )}

          {live.status === 'completed' && live.resultDesc ? (
            <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: c.line }}>
              <Text style={{ color: c.magenta, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, textAlign: 'center' }}>
                {live.resultDesc}
              </Text>
            </View>
          ) : target && chasing ? (
            <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: c.line }}>
              <Text style={{ color: c.sub, fontSize: 14, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                Target {target} · <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold' }}>{Math.max(0, target - chasing.totalRuns)} runs needed</Text>
              </Text>
            </View>
          ) : null}
        </Card>
      )}

      {(live.recentDeliveries ?? []).length > 0 ? (
        <Card padding={0} border={true}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18 }}>
              Recent Balls
            </Text>
          </View>
          {(live.recentDeliveries ?? []).map((d, i) => (
            <View key={i} style={[styles.ballRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
              <View
                style={[
                  styles.ballChip,
                  {
                    backgroundColor: d.isWicket ? c.coral : d.runs >= 4 ? c.mint : c.card2,
                    borderWidth: (d.isWicket || d.runs >= 4) ? 0 : 1,
                    borderColor: c.line,
                  },
                ]}
              >
                <Text
                  style={{
                    color: (d.isWicket || d.runs >= 4) ? c.card : c.ink,
                    fontFamily: 'BricolageGrotesque_800ExtraBold',
                    fontSize: 14,
                  }}
                >
                  {d.isWicket ? 'W' : d.runs}
                </Text>
              </View>
              <Text style={{ color: c.sub, fontSize: 14, width: 44, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{String(d.over)}</Text>
              <Text style={{ color: c.ink, fontSize: 15, flex: 1, fontFamily: 'PlusJakartaSans_500Medium', lineHeight: 22 }} numberOfLines={2}>
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
        <Text style={{ color: c.sub, textAlign: 'center', fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
          {t('Scorecard will appear after the match begins', 'स्कोरकार्ड मैच शुरू होने के बाद दिखेगा')}
        </Text>
      </Card>
    );

  return (
    <View style={{ gap: 16 }}>
      {cards.map((sc) => (
        <Card key={sc.innings.id} padding={0} border={true}>
          <LinearGradient
            colors={[c.card2, c.card]}
            style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: c.line }}
          >
            <Text style={{ color: c.getAccentText(c.cyan), fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14, letterSpacing: 0.5 }}>
              INNINGS {sc.innings.inningsNumber}
              {sc.innings.battingTeam ? ` · ${sc.innings.battingTeam.toUpperCase()}` : ''}
            </Text>
          </LinearGradient>
          <View style={{ padding: 16 }}>
            <View style={styles.scHead}>
              <Text style={[styles.scName, { color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }]}>BATTER</Text>
              <Text style={[styles.scNum, { color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }]}>R</Text>
              <Text style={[styles.scNum, { color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }]}>B</Text>
              <Text style={[styles.scNum, { color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }]}>4s</Text>
              <Text style={[styles.scNum, { color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }]}>6s</Text>
            </View>
            {sc.scorecard.batting.map((b, i) => (
              <View key={i} style={[styles.scRow, { borderTopColor: c.line }]}>
                <View style={styles.scName}>
                  <Text style={{ color: c.ink, fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={1}>
                    {b.name}
                  </Text>
                  {b.dismissal ? (
                    <Text style={{ color: c.sub, fontSize: 12, marginTop: 4, fontFamily: 'PlusJakartaSans_500Medium' }} numberOfLines={1}>
                      {b.dismissal}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.scNum, { color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }]}>{b.runs}</Text>
                <Text style={[styles.scNum, { color: c.sub }]}>{b.balls}</Text>
                <Text style={[styles.scNum, { color: c.sub }]}>{b.fours}</Text>
                <Text style={[styles.scNum, { color: c.sub }]}>{b.sixes}</Text>
              </View>
            ))}
            <View style={[styles.scHead, { marginTop: 24 }]}>
              <Text style={[styles.scName, { color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }]}>BOWLER</Text>
              <Text style={[styles.scNum, { color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }]}>O</Text>
              <Text style={[styles.scNum, { color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }]}>R</Text>
              <Text style={[styles.scNum, { color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }]}>W</Text>
              <Text style={[styles.scNum, { color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }]} />
            </View>
            {sc.scorecard.bowling.map((b, i) => (
              <View key={i} style={[styles.scRow, { borderTopColor: c.line }]}>
                <Text style={[styles.scName, { color: c.ink, fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' }]} numberOfLines={1}>
                  {b.name}
                </Text>
                <Text style={[styles.scNum, { color: c.sub }]}>{b.overs}</Text>
                <Text style={[styles.scNum, { color: c.sub }]}>{b.runs}</Text>
                <Text style={[styles.scNum, { color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }]}>{b.wickets}</Text>
                <Text style={[styles.scNum, { color: c.sub }]} />
              </View>
            ))}
          </View>
        </Card>
      ))}
    </View>
  );
}

function MomentsTab({ moments, c }: { moments: any[], c: any }) {
  const { t } = useLang();
  
  if (!moments || moments.length === 0) {
    return (
      <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
        <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15 }}>
          {t('No moments captured yet.', 'अभी तक कोई मोमेंट्स नहीं हैं।')}
        </Text>
      </Card>
    );
  }

  const getMomentColor = (type: string) => {
    switch (type) {
      case 'wicket': return '#FF3DA6';
      case 'six': return '#00DCF5';
      case 'fifty': return '#B6FF3C';
      case 'hundred': return '#FFC53D';
      case 'hat_trick': return '#5B2BF0';
      default: return c.cyan;
    }
  };

  const getMomentIcon = (type: string) => {
    switch (type) {
      case 'wicket': return 'target';
      case 'six': return 'arrow-up-circle';
      case 'fifty': return 'award';
      case 'hundred': return 'star';
      case 'hat_trick': return 'zap';
      default: return 'play-circle';
    }
  };

  return (
    <View style={{ gap: 16 }}>
      {moments.map((m, i) => (
        <Card key={i} padding={16} border={true} style={{ overflow: 'hidden' }}>
          <LinearGradient colors={[`${getMomentColor(m.type)}1A`, 'transparent']} style={StyleSheet.absoluteFill} />
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: getMomentColor(m.type), alignItems: 'center', justifyContent: 'center' }}>
              <Feather name={getMomentIcon(m.type) as any} size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: getMomentColor(m.type), fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {m.type.replace('_', ' ')}
                </Text>
                {m.over !== undefined && m.ball !== undefined && (
                  <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                    Ov {m.over}.{m.ball}
                  </Text>
                )}
              </View>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, lineHeight: 22 }}>
                {t(m.text, m.textHi || m.text)}
              </Text>
              {m.caption ? (
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, marginTop: 4 }}>
                  {t(m.caption, m.captionHi || m.caption)}
                </Text>
              ) : null}
            </View>
          </View>
          
          {m.clipUrl ? (
            <Pressable style={({ pressed }) => ({ marginTop: 16, height: 180, borderRadius: 12, overflow: 'hidden', backgroundColor: c.card2, opacity: pressed ? 0.9 : 1, borderWidth: 1, borderColor: c.line })}>
              {/* If web, can use video tag; otherwise just simulate for now or use expo-av */}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="play-circle" size={48} color={c.sub} />
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, marginTop: 8 }}>Watch Clip</Text>
              </View>
            </Pressable>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

export default function MatchDetailScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = String(id);
  const [tab, setTab] = useState<'live' | 'scorecard' | 'moments'>('live');
  const queryClient = useQueryClient();
  
  const appBarHeight = useAppBarHeight();

  const initialMatch = React.useMemo(() => {
    const schedule = queryClient.getQueryData<{ matches: Match[] }>(['matches']);
    if (schedule?.matches) {
      return schedule.matches.find(m => m.id === matchId);
    }
    return undefined;
  }, [matchId, queryClient]);

  const liveQ = useQuery({
    queryKey: ['live', matchId],
    queryFn: () => getLiveMatch(matchId),
    initialData: initialMatch ? {
      id: initialMatch.id,
      matchNo: initialMatch.matchNo,
      status: initialMatch.status,
      team1: initialMatch.team1,
      team2: initialMatch.team2,
      toss: (initialMatch as any).toss ?? null,
      resultDesc: initialMatch.resultDesc,
      scheduledAt: initialMatch.scheduledAt,
      venue: initialMatch.venue,
      stage: initialMatch.stage,
      grp: initialMatch.grp,
      events: [],
    } as any : undefined,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (s === 'live') return 10_000;
      if (s === 'completed' || s === 'abandoned') return false;
      // scheduled / toss etc. — poll lightly so it flips to live automatically
      return 60_000;
    },
  });

  const momentsQ = useQuery({
    queryKey: ['match-moments', matchId],
    queryFn: () => getMatchMoments(matchId).catch(() => null),
    enabled: !!matchId,
    refetchInterval: (query) => {
      const s = liveQ.data?.status;
      return s === 'live' ? 30_000 : false;
    }
  });

  const live = liveQ.data;
  const isLive = live?.status === 'live';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title="Match Center" back={true} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 60 : 30 }}
        refreshControl={
          <RefreshControl refreshing={liveQ.isRefetching} onRefresh={() => liveQ.refetch()} tintColor={c.magenta} progressViewOffset={appBarHeight} />
        }
      >
        <View style={{ height: appBarHeight - 16 }} />
        {liveQ.isLoading ? (
          <LoadingView />
        ) : liveQ.isError ? (
          <ErrorView onRetry={() => liveQ.refetch()} />
        ) : live ? (
          <>
            <View style={styles.headRow}>
              <Text style={{ color: c.ink, fontSize: 20, fontFamily: 'BricolageGrotesque_800ExtraBold', flex: 1, letterSpacing: -0.5 }} numberOfLines={1}>
                Match {live.matchNo}
                {live.venue ? <Text style={{ color: c.sub, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' }}> · {live.venue}</Text> : ''}
              </Text>
              {isLive ? <Badge label="Live" tone="live" /> : live.status === 'completed' ? <Badge label="Result" tone="gold" /> : <Badge label={live.status} />}
            </View>

            <View style={[styles.tabs, { backgroundColor: c.card2, borderColor: c.line, borderWidth: 1 }]}>
              {(['live', 'scorecard', 'moments'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={[styles.tabBtn, tab === t && { backgroundColor: c.violet }]}
                  testID={`tab-${t}`}
                >
                  {tab === t ? (
                    <LinearGradient colors={['#5B2BF0', '#9B2FF0']} style={StyleSheet.absoluteFill} />
                  ) : null}
                  <Text
                    style={{
                      color: tab === t ? '#fff' : c.sub,
                      fontFamily: tab === t ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold',
                      fontSize: 14,
                      letterSpacing: 0.3,
                    }}
                  >
                    {t === 'live' ? 'Live Score' : t === 'scorecard' ? 'Scorecard' : 'Moments'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === 'live' ? <LiveTab live={live} /> : tab === 'scorecard' ? <ScorecardTab matchId={matchId} /> : <MomentsTab moments={momentsQ.data?.moments || []} c={c} />}
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
  vsText: { fontSize: 13, fontFamily: 'BricolageGrotesque_800ExtraBold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
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
  scNum: { width: 40, textAlign: 'right', fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold' },
});
