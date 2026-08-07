import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { getMvpLeaderboard, type MvpPlayer } from '@/lib/api';
import { ScreenBackground, GlassAppBar, Card, useAppBarHeight, useBottomNavHeight, LoadingView, ErrorView, TeamDot } from '@/components/ui';

function PointsHelp() {
  const c = useColors();
  const { t } = useLang();
  const [open, setOpen] = useState(false);

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

  const Rule = ({ l, v }: { l: string; v: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 }}>{l}</Text>
      <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>{v}</Text>
    </View>
  );

  return (
    <Card style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 24, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>
          {t('Points System', 'पॉइंट्स सिस्टम')}
        </Text>
        <Pressable onPress={() => setOpen(false)} hitSlop={10}>
          <Feather name="x" size={20} color={c.sub} />
        </Pressable>
      </View>
      <View style={{ gap: 4 }}>
        <Rule l={t('Every Run', 'हर रन')} v="+1" />
        <Rule l={t('Every Four', 'हर चौका')} v="+1" />
        <Rule l={t('Every Six', 'हर छक्का')} v="+2" />
        <Rule l={t('30 / 50 / 100 Runs', '30 / 50 / 100 रन')} v="+4 / +8 / +16" />
        <Rule l={t('Duck (0 runs)', 'डक (0 रन)')} v="−2" />
      </View>
      <View style={{ height: 1, backgroundColor: c.line }} />
      <View style={{ gap: 4 }}>
        <Rule l={t('Every Wicket', 'हर विकेट')} v="+25" />
        <Rule l={t('Bowled / LBW Bonus', 'बोल्ड / LBW बोनस')} v="+8" />
        <Rule l={t('3 / 4 / 5 Wickets', '3 / 4 / 5 विकेट')} v="+4 / +8 / +16" />
        <Rule l={t('Maiden Over', 'मेडन ओवर')} v="+12" />
      </View>
      <View style={{ height: 1, backgroundColor: c.line }} />
      <View style={{ gap: 4 }}>
        <Rule l={t('Catch', 'कैच')} v="+8" />
        <Rule l={t('Stumping', 'स्टंपिंग')} v="+12" />
        <Rule l={t('Run Out (Direct / Assist)', 'रन आउट (डायरेक्ट / असिस्ट)')} v="+12 / +6" />
      </View>
    </Card>
  );
}

function PlayerRow({ p, i }: { p: MvpPlayer; i: number }) {
  const c = useColors();
  const { t } = useLang();
  
  return (
    <Card padding={16} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, ...(p.finalEligible ? { borderColor: c.magenta, borderWidth: 1 } : {}) }}>
      <View style={{ width: 32, alignItems: 'center' }}>
        <Text style={{ color: i < 3 ? c.amber : c.sub, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: i < 3 ? 24 : 18 }}>
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
  const [filter, setFilter] = useState<'all' | 'eligible'>('all');

  const q = useQuery({
    queryKey: ['mvp', filter],
    queryFn: () => getMvpLeaderboard(filter === 'eligible'),
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
            <Text style={{ color: filter === 'all' ? c.ink : c.sub, fontFamily: filter === 'all' ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
              {t('All Players', 'सभी खिलाड़ी')}
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setFilter('eligible')}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: filter === 'eligible' ? c.magenta : 'transparent', shadowColor: filter === 'eligible' ? c.magenta : 'transparent', shadowOpacity: 0.3, shadowRadius: 8, elevation: filter === 'eligible' ? 4 : 0 }}
          >
            <Text style={{ color: filter === 'eligible' ? '#fff' : c.sub, fontFamily: filter === 'eligible' ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
              {t('Car Race (Finalists)', 'कार रेस (फाइनलिस्ट)')}
            </Text>
          </Pressable>
        </View>

        {q.isLoading ? (
          <LoadingView />
        ) : q.isError ? (
          <ErrorView onRetry={() => q.refetch()} />
        ) : (
          <View>
            {q.data?.note && (
              <View style={{ backgroundColor: c.card2, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: c.line, marginBottom: 16 }}>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, textAlign: 'center' }}>
                  {q.data.note}
                </Text>
              </View>
            )}
            
            {q.data?.leaderboard.map((p, i) => (
              <PlayerRow key={`${p.name}-${p.team}`} p={p} i={i} />
            ))}
            
            {q.data?.leaderboard.length === 0 && (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Feather name="award" size={48} color={c.line} style={{ marginBottom: 16 }} />
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, textAlign: 'center' }}>
                  {t('No players found.', 'कोई खिलाड़ी नहीं मिला।')}
                </Text>
              </View>
            )}

            <PointsHelp />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
