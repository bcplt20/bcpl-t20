import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { getTeamDetail, type TeamPlayer } from '@/lib/api';
import {
  BackChip,
  Card,
  ErrorView,
  LoadingView,
  ScreenBackground,
  useAppBarHeight,
  useBottomNavHeight,
} from '@/components/ui';
import { teamLogoUri } from '@/app/teams';

const ROLE_ABBR: Record<string, string> = {
  Batsman: 'BAT',
  Bowler: 'BWL',
  'All-rounder': 'AR',
  'Wicket-keeper': 'WK',
};
const ROLE_COLORS: Record<string, string> = {
  BAT: '#00DCF5',
  BWL: '#FF5A6E',
  WK: '#FFC53D',
  AR: '#16E0A3',
};

function PlayerRow({ player, accent }: { player: TeamPlayer; accent: string }) {
  const c = useColors();
  const abbr = ROLE_ABBR[player.role] || player.role;
  const rc = ROLE_COLORS[abbr] || accent;
  const photo = teamLogoUri(player.photoUrl);

  return (
    <View style={[styles.playerRow, { backgroundColor: c.card, borderColor: c.line }]} testID={`squad-player-${player.id}`}>
      {photo ? (
        <Image source={{ uri: photo }} style={[styles.avatar, { borderColor: `${accent}66` }]} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, { borderColor: `${accent}66`, backgroundColor: `${accent}22`, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: c.getAccentText(accent), fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>
            {player.jerseyNo || player.name[0]}
          </Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }} numberOfLines={1}>
            {player.name}
          </Text>
          {player.isCaptain ? (
            <View style={[styles.capTag, { backgroundColor: 'rgba(255,197,61,0.2)', borderColor: 'rgba(255,197,61,0.5)' }]}>
              <Text style={{ color: c.getAccentText(c.amber), fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9 }}>C</Text>
            </View>
          ) : null}
          {player.isViceCaptain ? (
            <View style={[styles.capTag, { backgroundColor: c.card2, borderColor: c.line }]}>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9 }}>VC</Text>
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: `${rc}22`, borderColor: `${rc}55`, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ color: c.getAccentText(rc), fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 0.5 }}>{abbr}</Text>
          </View>
          {player.jerseyNo ? (
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 }}>#{player.jerseyNo}</Text>
          ) : null}
          {player.state ? (
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 }}>{player.state}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function TeamDetailScreen() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const q = useQuery({
    queryKey: ['team', id],
    queryFn: () => getTeamDetail(String(id)),
    enabled: !!id,
  });

  const team = q.data?.team;
  const players = q.data?.players ?? [];
  const accent = team?.color || c.violet;
  const second = team?.secondColor || accent;
  const logo = teamLogoUri(team?.logoUrl);

  const about = team
    ? [
        { label: t('Home City', 'गृह नगर'), value: team.city || '—' },
        { label: t('Home Ground', 'गृह मैदान'), value: team.homeGround || t('To be announced', 'जल्द घोषित होगा') },
        { label: t('Coach', 'कोच'), value: team.coach || t('To be announced', 'जल्द घोषित होगा') },
        { label: t('Captain', 'कप्तान'), value: team.captain || t('To be announced', 'जल्द घोषित होगा') },
        { label: t('Franchise Owner', 'फ्रैंचाइज़ी मालिक'), value: team.owner || t('To be announced', 'जल्द घोषित होगा') },
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <BackChip onPress={() => router.back()} testID="team-detail-back" />

      {q.isLoading ? (
        <View style={{ flex: 1, paddingTop: appBarHeight }}>
          <LoadingView />
        </View>
      ) : q.isError || !team ? (
        <View style={{ flex: 1, paddingTop: appBarHeight }}>
          <ErrorView onRetry={() => q.refetch()} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomNavHeight }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={accent} />}
        >
          {/* HERO in team colors */}
          <View style={{ paddingTop: appBarHeight + 8, paddingBottom: 28, alignItems: 'center', overflow: 'hidden' }}>
            <LinearGradient
              colors={[`${accent}44`, `${second}18`, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.heroLogo, { borderColor: `${accent}66`, shadowColor: accent }]}>
              {logo ? (
                <Image source={{ uri: logo }} style={{ width: '86%', height: '86%' }} contentFit="contain" />
              ) : (
                <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 34, color: accent }}>
                  {team.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('')}
                </Text>
              )}
            </View>
            <View style={{ backgroundColor: `${accent}22`, borderColor: `${accent}55`, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, marginTop: 16 }}>
              <Text style={{ color: c.getAccentText(accent), fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 1.5 }}>
                {t('SEASON 5', 'सीज़न 5')}
                {team.city ? ` · ${team.city.toUpperCase()}` : ''}
              </Text>
            </View>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 30, letterSpacing: -0.8, marginTop: 14, textAlign: 'center', paddingHorizontal: 24 }}>
              {team.name}
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16, gap: 16 }}>
            {/* SQUAD */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <LinearGradient colors={[accent, second]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ width: 5, height: 24, borderRadius: 3 }} />
                <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, color: c.ink, letterSpacing: -0.5 }}>
                  {t('Squad', 'टीम')}
                </Text>
                {players.length > 0 ? (
                  <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>· {players.length}</Text>
                ) : null}
              </View>

              {players.length === 0 ? (
                <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${accent}18`, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="users" size={26} color={c.getAccentText(accent)} />
                  </View>
                  <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 17, marginTop: 16, textAlign: 'center' }}>
                    {t('Squad announced after the auction', 'ऑक्शन के बाद टीम घोषित होगी')}
                  </Text>
                  <Text style={{ color: c.sub, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium', paddingHorizontal: 12 }}>
                    {t(
                      `The ${team.name} squad will be finalised at the Season 5 auction.`,
                      `${team.name} की टीम सीज़न 5 ऑक्शन में तय होगी।`,
                    )}
                  </Text>
                </Card>
              ) : (
                <View style={{ gap: 10 }}>
                  {players.map((p) => (
                    <PlayerRow key={p.id} player={p} accent={accent} />
                  ))}
                </View>
              )}
            </View>

            {/* ABOUT */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <LinearGradient colors={[accent, second]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ width: 5, height: 24, borderRadius: 3 }} />
                <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, color: c.ink, letterSpacing: -0.5 }}>
                  {t('About', 'जानकारी')}
                </Text>
              </View>
              <Card padding={0} border={true}>
                {about.map((a, i) => (
                  <View
                    key={a.label}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: i > 0 ? StyleSheet.hairlineWidth : 0, borderTopColor: c.line }}
                  >
                    <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>{a.label}</Text>
                    <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, maxWidth: '55%', textAlign: 'right' }}>{a.value}</Text>
                  </View>
                ))}
              </Card>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heroLogo: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    flexShrink: 0,
  },
  capTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
});
