import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { getTeams, SITE_ASSETS, type Team } from '@/lib/api';
import {
  BackChip,
  Card,
  ErrorView,
  LoadingView,
  ScreenBackground,
  useAppBarHeight,
  useBottomNavHeight,
} from '@/components/ui';

/* Canonical display order — mirrors the website Teams page grouping
   (Group A = first 5, Group B = last 5). */
const CANON_ORDER = [
  'Rajasthan Scorchers', 'Mumbai Mavericks', 'Chennai Thalaivas', 'Hyderabad Hawks', 'Ahmedabad Lions',
  'Delhi Suryas', 'Punjab Warriors', 'Kolkata Tigers', 'Lucknow Nawabs', 'Bengaluru Rockets',
];

export function teamLogoUri(logoUrl?: string | null): string | null {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http') || logoUrl.startsWith('data:')) return logoUrl;
  return `${SITE_ASSETS}/${logoUrl.replace(/^\//, '')}`;
}

function abbrOf(name: string) {
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function TeamCard({ team, group }: { team: Team; group: string }) {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const accent = team.color || c.violet;
  const second = team.secondColor || accent;
  const logo = teamLogoUri(team.logoUrl);

  return (
    <Pressable
      onPress={() => router.push(`/team/${team.slug}`)}
      testID={`team-card-${team.slug}`}
      style={({ pressed }) => ({ flexBasis: '47%', flexGrow: 1, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
    >
      <Card padding={0} border={true} style={{ overflow: 'hidden', minHeight: 168 }}>
        {/* team-color gradient wash */}
        <LinearGradient
          colors={[`${accent}33`, `${second}12`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 3, backgroundColor: accent }} />
        {/* watermark logo */}
        {logo ? (
          <Image
            source={{ uri: logo }}
            style={{ position: 'absolute', right: -14, bottom: -14, width: 96, height: 96, opacity: 0.08 }}
            contentFit="contain"
          />
        ) : null}

        <View style={{ padding: 16 }}>
          <View style={[styles.logoBadge, { borderColor: `${accent}66`, shadowColor: accent }]}>
            {logo ? (
              <Image source={{ uri: logo }} style={{ width: '84%', height: '84%' }} contentFit="contain" />
            ) : (
              <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, color: accent }}>{abbrOf(team.name)}</Text>
            )}
          </View>
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, marginTop: 12, letterSpacing: -0.3 }} numberOfLines={2}>
            {team.name}
          </Text>
          {team.city ? (
            <Text style={{ color: c.getAccentText(accent), fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 }}>
              {team.city}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <View style={{ backgroundColor: `${accent}22`, borderColor: `${accent}44`, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: c.getAccentText(accent), fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 0.5 }}>
                {group}
              </Text>
            </View>
            {(team.playerCount ?? 0) > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="users" size={11} color={c.sub} />
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 }}>{team.playerCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function TeamsScreen() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const q = useQuery({ queryKey: ['teams'], queryFn: getTeams });

  const ordered = React.useMemo(() => {
    const list = [...(q.data?.teams ?? [])];
    list.sort((a, b) => {
      const ia = CANON_ORDER.indexOf(a.name);
      const ib = CANON_ORDER.indexOf(b.name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.name.localeCompare(b.name);
    });
    return list;
  }, [q.data]);

  const groupOf = (team: Team) => {
    const idx = CANON_ORDER.indexOf(team.name);
    if (idx === -1) return t('SEASON 5', 'सीज़न 5');
    return idx < 5 ? t('GROUP A', 'ग्रुप A') : t('GROUP B', 'ग्रुप B');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <BackChip onPress={() => router.back()} testID="teams-back" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomNavHeight, paddingTop: appBarHeight }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={c.violet} />}
      >
        <View style={{ paddingHorizontal: 16 }}>
          <LinearGradient colors={['#FF3DA6', '#5B2BF0']} style={{ width: 48, height: 4, borderRadius: 2, marginBottom: 12, marginTop: 8 }} />
          <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32, color: c.ink, letterSpacing: -1 }}>
            {t('Teams', 'टीमें')}
          </Text>
          <Text style={{ color: c.sub, fontSize: 14, marginTop: 6, fontFamily: 'PlusJakartaSans_500Medium' }}>
            {t('The 10 Season 5 franchises', 'सीज़न 5 की 10 फ्रैंचाइज़ी')}
          </Text>
        </View>

        {q.isLoading ? (
          <LoadingView />
        ) : q.isError ? (
          <ErrorView onRetry={() => q.refetch()} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingTop: 20 }}>
            {ordered.map((team) => (
              <TeamCard key={team.id} team={team} group={groupOf(team)} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
});
