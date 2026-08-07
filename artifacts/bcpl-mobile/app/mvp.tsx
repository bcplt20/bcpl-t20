import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { getMvpLeaderboard, getMvpStats, type MvpPlayer, type MvpPointsConfig, type TournamentStatRow } from '@/lib/api';
import { ScreenBackground, GlassAppBar, Card, useAppBarHeight, useBottomNavHeight, LoadingView, ErrorView, TeamDot, TeamLogo } from '@/components/ui';

const DEFAULT_CFG: MvpPointsConfig = {
  batting: { run: 1, fourBonus: 1, sixBonus: 2, milestone30: 4, milestone50: 8, milestone100: 16, duck: -2 },
  bowling: { wicket: 25, bowledLbwBonus: 8, haul3: 4, haul4: 8, haul5: 16, maidenOver: 12 },
  fielding: { catch: 8, threeCatchBonus: 4, stumping: 12, directRunout: 12, assistedRunout: 6 },
};

function PointsHelp({ config = DEFAULT_CFG }: { config?: MvpPointsConfig }) {
  const c = useColors();
  const { t } = useLang();
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}>
        <Feather name="info" size={14} color={c.cyan} />
        <Text style={{ color: c.cyan, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>
          {t('How are points calculated?', 'Points कैसे मिलते हैं?')}
        </Text>
      </Pressable>
    );
  }

  const Rule = ({ l, v, color }: { l: string; v: string; color: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: `${color}10`, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
      <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>{l}</Text>
      <View style={{ backgroundColor: color, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
        <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }}>{v}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 32, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18 }}>
          {t('Points System', 'पॉइंट्स सिस्टम')}
        </Text>
        <Pressable onPress={() => setOpen(false)} hitSlop={10} style={{ backgroundColor: c.card2, padding: 6, borderRadius: 16 }}>
          <Feather name="chevron-up" size={20} color={c.sub} />
        </Pressable>
      </View>

      {/* Batting */}
      <Card padding={16} style={{ borderColor: `${c.coral}30`, borderWidth: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={{ backgroundColor: c.coral, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="baseball" size={16} color="#fff" />
          </View>
          <Text style={{ color: c.coral, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Batting', 'बल्लेबाज़ी')}</Text>
        </View>
        <View style={{ gap: 8 }}>
          <Rule l={t('Every Run', 'हर रन')} v={`+${config.batting.run}`} color={c.coral} />
          <Rule l={t('Every Four', 'हर चौका')} v={`+${config.batting.fourBonus}`} color={c.coral} />
          <Rule l={t('Every Six', 'हर छक्का')} v={`+${config.batting.sixBonus}`} color={c.coral} />
          <Rule l={t('30 / 50 / 100 Runs', '30 / 50 / 100 रन')} v={`+${config.batting.milestone30} / +${config.batting.milestone50} / +${config.batting.milestone100}`} color={c.coral} />
          <Rule l={t('Duck (0 runs)', 'डक (0 रन)')} v={`${config.batting.duck}`} color="#EF4444" />
        </View>
      </Card>

      {/* Bowling */}
      <Card padding={16} style={{ borderColor: `${c.violet}30`, borderWidth: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={{ backgroundColor: c.violet, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="baseball-outline" size={16} color="#fff" />
          </View>
          <Text style={{ color: c.violet, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Bowling', 'गेंदबाज़ी')}</Text>
        </View>
        <View style={{ gap: 8 }}>
          <Rule l={t('Every Wicket', 'हर विकेट')} v={`+${config.bowling.wicket}`} color={c.violet} />
          <Rule l={t('Bowled / LBW Bonus', 'बोल्ड / LBW बोनस')} v={`+${config.bowling.bowledLbwBonus}`} color={c.violet} />
          <Rule l={t('3 / 4 / 5 Wickets', '3 / 4 / 5 विकेट')} v={`+${config.bowling.haul3} / +${config.bowling.haul4} / +${config.bowling.haul5}`} color={c.violet} />
          <Rule l={t('Maiden Over', 'मेडन ओवर')} v={`+${config.bowling.maidenOver}`} color={c.violet} />
        </View>
      </Card>

      {/* Fielding */}
      <Card padding={16} style={{ borderColor: `${c.cyan}30`, borderWidth: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={{ backgroundColor: c.cyan, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="hand-left" size={16} color="#fff" />
          </View>
          <Text style={{ color: c.cyan, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Fielding', 'फील्डिंग')}</Text>
        </View>
        <View style={{ gap: 8 }}>
          <Rule l={t('Catch', 'कैच')} v={`+${config.fielding.catch}`} color={c.cyan} />
          <Rule l={t('Stumping', 'स्टंपिंग')} v={`+${config.fielding.stumping}`} color={c.cyan} />
          <Rule l={t('Run Out (Direct / Assist)', 'रन आउट (डायरेक्ट / असिस्ट)')} v={`+${config.fielding.directRunout} / +${config.fielding.assistedRunout}`} color={c.cyan} />
        </View>
      </Card>
    </View>
  );
}

function PlayerRow({ p, finalistsExist }: { p: MvpPlayer; finalistsExist: boolean }) {
  const c = useColors();
  const { t } = useLang();
  
  return (
    <Card padding={16} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, ...(p.finalEligible ? { borderColor: c.magenta, borderWidth: 1 } : {}) }}>
      <View style={{ width: 32, alignItems: 'center' }}>
        <Text style={{ color: p.rank <= 3 ? c.amber : c.sub, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: p.rank <= 3 ? 24 : 18 }}>
          #{p.rank}
        </Text>
      </View>
      <TeamDot name={p.team} size={40} glow={p.finalEligible} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, marginBottom: 2 }} numberOfLines={1}>
          {p.name}
        </Text>
        <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 }} numberOfLines={1}>
          {p.team}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
          <Text style={{ color: c.sub, fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' }}>M: <Text style={{ color: c.ink }}>{p.matches}</Text></Text>
          <Text style={{ color: c.sub, fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' }}>R: <Text style={{ color: c.ink }}>{p.runs}</Text></Text>
          <Text style={{ color: c.sub, fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' }}>W: <Text style={{ color: c.ink }}>{p.wickets}</Text></Text>
          <Text style={{ color: c.sub, fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' }}>C: <Text style={{ color: c.ink }}>{p.catches}</Text></Text>
        </View>
        {finalistsExist && !p.finalEligible && (
          <View style={{ marginTop: 6, backgroundColor: `${c.sub}15`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' }}>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10 }}>{t('Not valid for Car', 'Car के लिए valid नहीं')}</Text>
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={{ color: p.finalEligible ? c.magenta : c.cyan, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24 }}>
          {p.points.toLocaleString()}
        </Text>
        <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {t('PTS', 'पॉइंट्स')}
        </Text>
      </View>
    </Card>
  );
}

export default function MvpScreen() {
  const c = useColors();
  const { t } = useLang();
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();
  const [filter, setFilter] = useState<'all' | 'eligible' | 'stats'>('all');

  const q = useQuery({
    queryKey: ['mvp', filter],
    queryFn: () => getMvpLeaderboard(filter === 'eligible'),
    enabled: filter !== 'stats',
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('MVP Race', 'MVP रेस')} back={true} />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 16, paddingBottom: bottomNavHeight + 40 }}>
        {/* Toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: c.card2, borderRadius: 12, padding: 4, marginBottom: 16 }}>
          <Pressable 
            onPress={() => setFilter('all')}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: filter === 'all' ? c.card : 'transparent', shadowColor: filter === 'all' ? '#000' : 'transparent', shadowOpacity: 0.1, shadowRadius: 4, elevation: filter === 'all' ? 2 : 0 }}
          >
            <Text style={{ color: filter === 'all' ? c.ink : c.sub, fontFamily: filter === 'all' ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
              {t('Points', 'पॉइंट्स')}
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setFilter('eligible')}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: filter === 'eligible' ? c.magenta : 'transparent', shadowColor: filter === 'eligible' ? c.magenta : 'transparent', shadowOpacity: 0.3, shadowRadius: 8, elevation: filter === 'eligible' ? 4 : 0 }}
          >
            <Text style={{ color: filter === 'eligible' ? '#fff' : c.sub, fontFamily: filter === 'eligible' ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
              {t('Finalists', 'फाइनलिस्ट')}
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setFilter('stats')}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: filter === 'stats' ? c.card : 'transparent', shadowColor: filter === 'stats' ? '#000' : 'transparent', shadowOpacity: 0.1, shadowRadius: 4, elevation: filter === 'stats' ? 2 : 0 }}
          >
            <Text style={{ color: filter === 'stats' ? c.ink : c.sub, fontFamily: filter === 'stats' ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
              {t('Stats', 'आँकड़े')}
            </Text>
          </Pressable>
        </View>

        {filter === 'stats' ? (
          <TournamentStatsView />
        ) : q.isLoading ? (
          <LoadingView />
        ) : q.isError ? (
          <ErrorView onRetry={() => q.refetch()} />
        ) : (
          <View>
            {q.data?.note && filter === 'eligible' && (
              <View style={{ backgroundColor: c.card2, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: c.line, marginBottom: 16 }}>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, textAlign: 'center' }}>
                  {q.data.note}
                </Text>
              </View>
            )}
            
            {q.data?.leaderboard.slice(0, 15).map((p) => (
              <PlayerRow key={`${p.name}-${p.team}`} p={p} finalistsExist={!!q.data?.finalists} />
            ))}
            
            {q.data?.leaderboard.length === 0 && (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Feather name="award" size={48} color={c.line} style={{ marginBottom: 16 }} />
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, textAlign: 'center' }}>
                  {t('No players found.', 'कोई खिलाड़ी नहीं मिला।')}
                </Text>
              </View>
            )}

            <PointsHelp config={q.data?.pointsConfig} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TournamentStatsView() {
  const c = useColors();
  const { t } = useLang();
  
  const q = useQuery({ queryKey: ['mvp-stats'], queryFn: getMvpStats, refetchInterval: 60000 });
  const [activeTab, setActiveTab] = useState<'runs'|'wickets'|'catches'|'sixes'|'fours'>('runs');

  if (q.isLoading) return <LoadingView />;
  if (q.isError) return <ErrorView onRetry={() => q.refetch()} />;

  const data = q.data;
  if (!data) return null;

  let list: TournamentStatRow[] = [];
  let title = '';
  if (activeTab === 'runs') { list = data.mostRuns; title = t('Most Runs', 'सर्वाधिक रन'); }
  if (activeTab === 'wickets') { list = data.mostWickets; title = t('Most Wickets', 'सर्वाधिक विकेट'); }
  if (activeTab === 'catches') { list = data.mostCatches; title = t('Most Catches', 'सर्वाधिक कैच'); }
  if (activeTab === 'sixes') { list = data.mostSixes; title = t('Most Sixes', 'सर्वाधिक छक्के'); }
  if (activeTab === 'fours') { list = data.mostFours; title = t('Most Fours', 'सर्वाधिक चौके'); }

  const isEmpty = !list || list.length === 0;

  return (
    <View style={{ flex: 1, paddingBottom: 24 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
        {(['runs', 'wickets', 'catches', 'sixes', 'fours'] as const).map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: activeTab === tab ? c.violet : c.card2, borderWidth: 1, borderColor: activeTab === tab ? c.violet : c.line }}>
            <Text style={{ color: activeTab === tab ? '#fff' : c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>
              {tab === 'runs' ? t('Most Runs', 'सर्वाधिक रन') : tab === 'wickets' ? t('Most Wickets', 'सर्वाधिक विकेट') : tab === 'catches' ? t('Most Catches', 'सर्वाधिक कैच') : tab === 'sixes' ? t('Most Sixes', 'सर्वाधिक छक्के') : t('Most Fours', 'सर्वाधिक चौके')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isEmpty ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Feather name="bar-chart-2" size={48} color={c.line} style={{ marginBottom: 16 }} />
          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, textAlign: 'center' }}>
            {t('Tournament stats not available yet.', 'टूर्नामेंट के आँकड़े अभी उपलब्ध नहीं हैं।')}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {list.slice(0, 10).map((row, i) => (
            <View key={`${row.player}-${row.team}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: i === 0 ? `${c.violet}50` : c.line, elevation: i === 0 ? 4 : 0, shadowColor: i === 0 ? c.violet : 'transparent', shadowOpacity: 0.2, shadowRadius: 8 }}>
              <View style={{ width: 28, alignItems: 'center' }}>
                <Text style={{ color: i === 0 ? c.violet : c.sub, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: i === 0 ? 18 : 14 }}>{i + 1}</Text>
              </View>
              <TeamLogo name={row.team} size={36} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: i === 0 ? 16 : 14 }} numberOfLines={1}>{row.player}</Text>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 }}>{row.team}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                <Text style={{ color: i === 0 ? c.violet : c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: i === 0 ? 22 : 18 }}>{row.value}</Text>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 }}>{row.matches} {t('Matches', 'मैच')}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
